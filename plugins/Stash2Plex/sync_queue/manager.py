"""
Queue manager for persistent job storage.

Handles queue initialization, lifecycle management, and shutdown.
"""

import os
from typing import Optional
try:
    import persistqueue
except ImportError:
    persistqueue = None  # Will fail at runtime with clear error


class QueueManager:
    """
    Manages SQLite-backed persistent queue lifecycle.

    Stores queue in Stash plugin data directory. Queue survives
    process restarts and crashes with auto_resume=True.
    """

    def __init__(self, data_dir: Optional[str] = None):
        """
        Initialize queue manager.

        Args:
            data_dir: Directory for queue storage. Defaults to
                     $STASH_PLUGIN_DATA or ~/.stash/plugins/Stash2Plex/data
        """
        if persistqueue is None:
            raise ImportError(
                "persist-queue not installed. "
                "Run: pip install persist-queue>=1.1.0"
            )

        # Determine data directory
        if data_dir is None:
            # Try environment variable first
            stash_data = os.getenv('STASH_PLUGIN_DATA')
            if stash_data:
                data_dir = stash_data
            else:
                # Fallback to default location
                home = os.path.expanduser('~')
                data_dir = os.path.join(home, '.stash', 'plugins', 'Stash2Plex', 'data')

        self.data_dir = data_dir
        self.queue_path = os.path.join(data_dir, 'queue')

        # Create directory if needed
        os.makedirs(self.queue_path, exist_ok=True)

        # Initialize queue
        self._queue = self._init_queue()

        print(f"Queue initialized at {self.queue_path}")

    def _init_queue(self) -> 'persistqueue.SQLiteAckQueue':
        """
        Create SQLiteAckQueue with production settings.

        Returns:
            Configured SQLiteAckQueue instance
        """
        return persistqueue.SQLiteAckQueue(
            path=self.queue_path,
            auto_commit=True,      # Required for AckQueue - immediate persistence
            multithreading=True,   # Thread-safe operations
            auto_resume=True       # Recover unack jobs on crash
        )

    def get_queue(self) -> 'persistqueue.SQLiteAckQueue':
        """
        Get the queue instance.

        Returns:
            SQLiteAckQueue for job operations
        """
        return self._queue

    def shutdown(self):
        """
        Clean shutdown of queue manager.

        Logs final statistics and closes connections.
        """
        # Queue doesn't require explicit close, but log stats
        print("Queue manager shutting down")

        # Note: persist-queue handles cleanup automatically
        # No explicit close() needed for SQLiteAckQueue
