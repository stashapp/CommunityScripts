"""
Statistics tracking for sync operations.

Provides SyncStats dataclass for tracking job processing metrics including
success/fail counts, timing data, match confidence tracking, and error
type aggregation.
"""

import json
import os
import time
from dataclasses import dataclass, field
from typing import Dict


@dataclass
class SyncStats:
    """
    Statistics for sync job processing.

    Tracks cumulative metrics across sync operations including job counts,
    processing times, error types, and match confidence levels.

    Attributes:
        jobs_processed: Total number of jobs processed
        jobs_succeeded: Number of successfully completed jobs
        jobs_failed: Number of failed jobs
        jobs_to_dlq: Number of jobs moved to dead letter queue
        total_processing_time: Sum of all processing times in seconds
        session_start: Timestamp when stats tracking began
        errors_by_type: Count of errors by type name (e.g., "PlexNotFound": 3)
        high_confidence_matches: Count of high confidence Plex matches
        low_confidence_matches: Count of low confidence Plex matches

    Example:
        >>> stats = SyncStats()
        >>> stats.record_success(0.5, confidence='high')
        >>> stats.record_failure('PlexNotFound', 0.2, to_dlq=True)
        >>> print(f"Success rate: {stats.success_rate:.1f}%")
        Success rate: 50.0%
    """

    jobs_processed: int = 0
    jobs_succeeded: int = 0
    jobs_failed: int = 0
    jobs_to_dlq: int = 0
    total_processing_time: float = 0.0
    session_start: float = field(default_factory=time.time)
    errors_by_type: Dict[str, int] = field(default_factory=dict)
    high_confidence_matches: int = 0
    low_confidence_matches: int = 0

    def record_success(self, processing_time: float, confidence: str = 'high') -> None:
        """
        Record a successful job completion.

        Args:
            processing_time: Time taken to process job in seconds
            confidence: Match confidence level ('high' or 'low')
        """
        self.jobs_processed += 1
        self.jobs_succeeded += 1
        self.total_processing_time += processing_time

        if confidence == 'high':
            self.high_confidence_matches += 1
        else:
            self.low_confidence_matches += 1

    def record_failure(
        self,
        error_type: str,
        processing_time: float,
        to_dlq: bool = False
    ) -> None:
        """
        Record a job failure.

        Args:
            error_type: Name of the exception type (e.g., 'PlexNotFound')
            processing_time: Time taken before failure in seconds
            to_dlq: Whether job was moved to dead letter queue
        """
        self.jobs_processed += 1
        self.jobs_failed += 1
        self.total_processing_time += processing_time

        if to_dlq:
            self.jobs_to_dlq += 1

        # Track error type count
        self.errors_by_type[error_type] = self.errors_by_type.get(error_type, 0) + 1

    @property
    def success_rate(self) -> float:
        """
        Calculate success rate as a percentage.

        Returns:
            Percentage of successful jobs (0.0 to 100.0), or 0.0 if no jobs processed
        """
        if self.jobs_processed == 0:
            return 0.0
        return (self.jobs_succeeded / self.jobs_processed) * 100.0

    @property
    def avg_processing_time(self) -> float:
        """
        Calculate average processing time per job.

        Returns:
            Average time in seconds, or 0.0 if no jobs processed
        """
        if self.jobs_processed == 0:
            return 0.0
        return self.total_processing_time / self.jobs_processed

    def to_dict(self) -> dict:
        """
        Convert stats to dictionary for JSON serialization.

        Returns:
            Dict containing all stats fields
        """
        return {
            'jobs_processed': self.jobs_processed,
            'jobs_succeeded': self.jobs_succeeded,
            'jobs_failed': self.jobs_failed,
            'jobs_to_dlq': self.jobs_to_dlq,
            'total_processing_time': self.total_processing_time,
            'session_start': self.session_start,
            'errors_by_type': dict(self.errors_by_type),
            'high_confidence_matches': self.high_confidence_matches,
            'low_confidence_matches': self.low_confidence_matches,
        }

    def save_to_file(self, filepath: str) -> None:
        """
        Save stats to JSON file with cumulative merge.

        If the file already exists, loads existing stats and merges
        cumulative totals before saving. Creates parent directories
        if needed.

        Args:
            filepath: Path to JSON file for persistence
        """
        # Load existing stats if file exists
        existing = {}
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r') as f:
                    existing = json.load(f)
            except (json.JSONDecodeError, IOError):
                existing = {}

        # Merge cumulative totals
        merged = {
            'jobs_processed': existing.get('jobs_processed', 0) + self.jobs_processed,
            'jobs_succeeded': existing.get('jobs_succeeded', 0) + self.jobs_succeeded,
            'jobs_failed': existing.get('jobs_failed', 0) + self.jobs_failed,
            'jobs_to_dlq': existing.get('jobs_to_dlq', 0) + self.jobs_to_dlq,
            'total_processing_time': existing.get('total_processing_time', 0.0) + self.total_processing_time,
            'session_start': existing.get('session_start', self.session_start),
            'high_confidence_matches': existing.get('high_confidence_matches', 0) + self.high_confidence_matches,
            'low_confidence_matches': existing.get('low_confidence_matches', 0) + self.low_confidence_matches,
        }

        # Merge error type counts
        merged_errors = dict(existing.get('errors_by_type', {}))
        for error_type, count in self.errors_by_type.items():
            merged_errors[error_type] = merged_errors.get(error_type, 0) + count
        merged['errors_by_type'] = merged_errors

        # Ensure parent directory exists
        parent_dir = os.path.dirname(filepath)
        if parent_dir:
            os.makedirs(parent_dir, exist_ok=True)

        # Write merged stats
        with open(filepath, 'w') as f:
            json.dump(merged, f, indent=2)

    @classmethod
    def load_from_file(cls, filepath: str) -> 'SyncStats':
        """
        Load stats from JSON file.

        If the file doesn't exist or is invalid, returns a new empty
        SyncStats instance.

        Args:
            filepath: Path to JSON file to load

        Returns:
            SyncStats instance with loaded data, or empty stats if file missing
        """
        if not os.path.exists(filepath):
            return cls()

        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError):
            return cls()

        return cls(
            jobs_processed=data.get('jobs_processed', 0),
            jobs_succeeded=data.get('jobs_succeeded', 0),
            jobs_failed=data.get('jobs_failed', 0),
            jobs_to_dlq=data.get('jobs_to_dlq', 0),
            total_processing_time=data.get('total_processing_time', 0.0),
            session_start=data.get('session_start', time.time()),
            errors_by_type=dict(data.get('errors_by_type', {})),
            high_confidence_matches=data.get('high_confidence_matches', 0),
            low_confidence_matches=data.get('low_confidence_matches', 0),
        )
