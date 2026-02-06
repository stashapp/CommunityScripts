"""
Dead Letter Queue Module

Stores permanently failed jobs for manual review and debugging. When jobs fail
beyond retry limits or encounter permanent errors, they're moved to the DLQ
with full error context preserved.
"""

import sqlite3
import pickle
import traceback
import logging
from typing import Optional

# Use standard logging for DLQ operations
log = logging.getLogger(__name__)


class DeadLetterQueue:
    """Dead letter queue for permanently failed sync jobs"""

    def __init__(self, data_dir: str):
        """
        Initialize dead letter queue

        Args:
            data_dir: Directory for DLQ database (same as main queue)
        """
        import os
        self.db_path = os.path.join(data_dir, 'dlq.db')
        self._setup_schema()

    def _setup_schema(self):
        """Create dead_letters table and indexes if not exists"""
        conn = sqlite3.connect(self.db_path)

        # Create table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS dead_letters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER,
                scene_id INTEGER,
                job_data BLOB,
                error_type TEXT,
                error_message TEXT,
                stack_trace TEXT,
                retry_count INTEGER,
                failed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Create indexes for efficient querying
        conn.execute('CREATE INDEX IF NOT EXISTS idx_failed_at ON dead_letters(failed_at)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_scene_id ON dead_letters(scene_id)')

        conn.commit()
        conn.close()

    def _get_connection(self):
        """Get SQLite connection (context manager pattern)"""
        return sqlite3.connect(self.db_path)

    def add(self, job: dict, error: Exception, retry_count: int):
        """
        Add failed job to DLQ

        Args:
            job: Full job dict (includes pqid, scene_id, data)
            error: Exception that caused failure
            retry_count: Number of retry attempts before failure
        """
        with self._get_connection() as conn:
            conn.execute(
                '''INSERT INTO dead_letters
                   (job_id, scene_id, job_data, error_type, error_message, stack_trace, retry_count)
                   VALUES (?, ?, ?, ?, ?, ?, ?)''',
                (
                    job.get('pqid'),
                    job.get('scene_id'),
                    pickle.dumps(job),
                    type(error).__name__,
                    str(error),
                    traceback.format_exc(),
                    retry_count
                )
            )
            conn.commit()

        log.warning(f"Job {job.get('pqid')} moved to DLQ after {retry_count} retries: {type(error).__name__}")

    def get_recent(self, limit: int = 10) -> list[dict]:
        """
        Get recent failed jobs (summary, no full job_data)

        Args:
            limit: Maximum number of entries to return

        Returns:
            List of dicts with: id, job_id, scene_id, error_type, error_message, failed_at
        """
        with self._get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                '''SELECT id, job_id, scene_id, error_type, error_message, failed_at
                   FROM dead_letters
                   ORDER BY failed_at DESC
                   LIMIT ?''',
                (limit,)
            )
            results = [dict(row) for row in cursor.fetchall()]

        return results

    def get_by_id(self, dlq_id: int) -> Optional[dict]:
        """
        Get full job details by DLQ ID (including unpickled job_data)

        Args:
            dlq_id: Dead letter queue entry ID

        Returns:
            Full job dict, or None if not found
        """
        with self._get_connection() as conn:
            cursor = conn.execute(
                'SELECT job_data FROM dead_letters WHERE id = ?',
                (dlq_id,)
            )
            row = cursor.fetchone()

        if row is None:
            return None

        # Unpickle job_data
        return pickle.loads(row[0])

    def get_count(self) -> int:
        """
        Get total count of DLQ entries

        Returns:
            Number of failed jobs in DLQ
        """
        with self._get_connection() as conn:
            cursor = conn.execute('SELECT COUNT(*) FROM dead_letters')
            count = cursor.fetchone()[0]

        return count

    def delete_older_than(self, days: int = 30):
        """
        Delete DLQ entries older than specified days

        Args:
            days: Retention period (default 30 days)
        """
        with self._get_connection() as conn:
            cursor = conn.execute(
                "DELETE FROM dead_letters WHERE failed_at < datetime('now', '-' || ? || ' days')",
                (days,)
            )
            count = cursor.rowcount
            conn.commit()

        log.info(f"Removed {count} DLQ entries older than {days} days")

    def get_error_summary(self) -> dict[str, int]:
        """
        Get count of DLQ entries grouped by error type.

        Returns:
            Dict mapping error_type to count, e.g., {"PlexNotFound": 3, "PermanentError": 2}
        """
        with self._get_connection() as conn:
            cursor = conn.execute(
                'SELECT error_type, COUNT(*) as count FROM dead_letters GROUP BY error_type'
            )
            return {row[0]: row[1] for row in cursor.fetchall()}


if __name__ == "__main__":
    import tempfile
    import os

    with tempfile.TemporaryDirectory() as tmpdir:
        dlq = DeadLetterQueue(tmpdir)

        # Add a failed job
        test_job = {"pqid": 1, "scene_id": 123, "data": {"title": "Test"}}
        test_error = ValueError("Plex API error: 404 Not Found")
        dlq.add(test_job, test_error, retry_count=5)

        # Query
        assert dlq.get_count() == 1
        recent = dlq.get_recent(limit=5)
        assert len(recent) == 1
        assert recent[0]["scene_id"] == 123

        # Get full job
        full = dlq.get_by_id(recent[0]["id"])
        assert full["scene_id"] == 123

        print("DLQ integration test PASSED")
