"""
Persistent Queue Module

Provides durable job queue infrastructure for Stash2Plex using SQLite-backed
persistence. Jobs survive process restarts, crashes, and Plex outages.
"""

from sync_queue.manager import QueueManager
from sync_queue.models import SyncJob
from sync_queue.dlq import DeadLetterQueue

# Operations will be imported after operations.py is created
try:
    from sync_queue.operations import enqueue, get_pending, ack_job, nack_job, fail_job, get_stats
    __all__ = [
        'QueueManager',
        'SyncJob',
        'DeadLetterQueue',
        'enqueue',
        'get_pending',
        'ack_job',
        'nack_job',
        'fail_job',
        'get_stats',
    ]
except ImportError:
    # operations.py not yet created
    __all__ = [
        'QueueManager',
        'SyncJob',
        'DeadLetterQueue',
    ]
