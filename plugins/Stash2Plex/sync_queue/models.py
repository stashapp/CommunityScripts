"""
Job data models for sync queue.

Uses dict-compatible structures for safe serialization with persist-queue.
"""

import time
from typing import TypedDict, Any


class SyncJob(TypedDict):
    """
    Sync job data structure.

    Dict-compatible type for safe pickling by persist-queue.
    All jobs are JSON-serializable to avoid pickle protocol issues.
    """
    scene_id: int
    update_type: str
    data: dict[str, Any]
    enqueued_at: float
    job_key: str


def create_sync_job(scene_id: int, update_type: str, data: dict[str, Any]) -> SyncJob:
    """
    Create a new sync job dict.

    Args:
        scene_id: Stash scene ID
        update_type: Type of update (e.g., "metadata", "image")
        data: Metadata to sync to Plex

    Returns:
        SyncJob dict ready for queue
    """
    return SyncJob(
        scene_id=scene_id,
        update_type=update_type,
        data=data,
        enqueued_at=time.time(),
        job_key=f"scene_{scene_id}"
    )
