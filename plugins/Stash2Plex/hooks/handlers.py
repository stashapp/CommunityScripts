"""
Hook handlers for fast event capture.

Implements <100ms event handlers that enqueue jobs for background processing.
Includes metadata validation before enqueueing.
"""

import sys
import time
from typing import Optional


# Stash plugin log levels
def log_trace(msg): print(f"\x01t\x02[Stash2Plex Hook] {msg}", file=sys.stderr)
def log_debug(msg): print(f"\x01d\x02[Stash2Plex Hook] {msg}", file=sys.stderr)
def log_info(msg): print(f"\x01i\x02[Stash2Plex Hook] {msg}", file=sys.stderr)
def log_warn(msg): print(f"\x01w\x02[Stash2Plex Hook] {msg}", file=sys.stderr)
def log_error(msg): print(f"\x01e\x02[Stash2Plex Hook] {msg}", file=sys.stderr)


try:
    from sync_queue.operations import enqueue, load_sync_timestamps
except ImportError:
    enqueue = None
    load_sync_timestamps = None

try:
    from validation.metadata import validate_metadata
except ImportError:
    validate_metadata = None


# In-memory tracking of pending scene IDs for deduplication
# Resets on restart - acceptable tradeoff for <100ms hook handler requirement
_pending_scene_ids: set[int] = set()


# GraphQL query for fetching complete scene metadata
# stashapi's find_scene uses a minimal fragment that only returns id for nested objects
SCENE_QUERY = """
query FindScene($id: ID!) {
    findScene(id: $id) {
        id
        title
        details
        date
        rating100
        files {
            path
        }
        studio {
            id
            name
        }
        performers {
            id
            name
        }
        tags {
            id
            name
        }
        paths {
            screenshot
            preview
        }
    }
}
"""


def mark_scene_pending(scene_id: int) -> None:
    """Mark scene as having a pending job in queue."""
    _pending_scene_ids.add(scene_id)


def unmark_scene_pending(scene_id: int) -> None:
    """Remove scene from pending set (called after job completes)."""
    _pending_scene_ids.discard(scene_id)


def is_scene_pending(scene_id: int) -> bool:
    """Check if scene already has a pending job."""
    return scene_id in _pending_scene_ids


def is_scan_running(stash) -> bool:
    """
    Check if a library scan or generate job is currently running.

    Args:
        stash: StashInterface instance

    Returns:
        True if scan/generate job is active
    """
    if not stash:
        return False

    try:
        # Stash Job type has: id, status, subTasks, description, progress, startTime, endTime, addTime
        result = stash.call_GQL("""
            query { jobQueue { status description } }
        """)

        jobs = result.get('jobQueue', []) if result else []

        # Check description for scan-related keywords
        scan_keywords = ['scan', 'auto tag', 'generate', 'identify']
        for job in jobs:
            status = (job.get('status') or '').upper()
            description = (job.get('description') or '').lower()
            if status in ('RUNNING', 'READY') and any(kw in description for kw in scan_keywords):
                log_trace(f"Scan job active: {description}")
                return True

    except Exception as e:
        log_trace(f"Could not check job queue: {e}")

    return False


def requires_plex_sync(update_data: dict) -> bool:
    """
    Check if update contains sync-worthy changes.

    Filters out non-metadata updates like play counts, view history,
    and file system only changes.

    Args:
        update_data: Scene update data from Stash hook

    Returns:
        True if update contains metadata fields that should sync to Plex
    """
    # Metadata fields that trigger Plex sync
    sync_fields = [
        'title',
        'details',
        'studio_id',
        'performer_ids',
        'tag_ids',
        'rating100',
        'date',
        'rating',
        'studio',
        'performers',
        'tags'
    ]

    # Check if any sync-worthy field is present in the update
    for field in sync_fields:
        if field in update_data:
            return True

    return False


def on_scene_update(
    scene_id: int,
    update_data: dict,
    queue,
    data_dir: Optional[str] = None,
    sync_timestamps: Optional[dict[int, float]] = None,
    stash=None
) -> bool:
    """
    Handle scene update event with fast enqueue.

    Target: <100ms execution time. Validates metadata before enqueueing
    to ensure clean data enters the queue.

    Args:
        scene_id: Stash scene ID
        update_data: Scene update data from hook
        queue: Queue instance for job storage
        data_dir: Plugin data directory for sync timestamps
        sync_timestamps: Dict mapping scene_id to last sync timestamp
        stash: StashInterface for fetching scene file path

    Returns:
        True if job was enqueued, False if filtered out or validation failed
    """
    start = time.time()

    # Skip if scan/generate job is running
    if is_scan_running(stash):
        log_trace(f"Scene {scene_id} skipped - scan job active")
        return False

    # Filter non-sync events before enqueueing
    if not requires_plex_sync(update_data):
        log_trace(f"Scene {scene_id} update filtered (no metadata changes)")
        return False

    # Filter: Timestamp comparison for late update detection
    if sync_timestamps is not None:
        # Try to get updated_at from Stash hook data
        # Fallback to current time if field missing (Stash may not always provide it)
        stash_updated_at = update_data.get('updated_at')
        if stash_updated_at is None:
            # Stash didn't provide updated_at - use current time as proxy
            # This means we'll re-sync, which is safe (idempotent)
            stash_updated_at = time.time()

        last_synced = sync_timestamps.get(scene_id)
        if last_synced and stash_updated_at <= last_synced:
            log_trace(f"Scene {scene_id} already synced (Stash: {stash_updated_at} <= Last: {last_synced})")
            return False

    # Filter: Queue deduplication using in-memory tracking
    if is_scene_pending(scene_id):
        log_trace(f"Scene {scene_id} already in queue, skipping duplicate")
        return False

    # Enqueue job for background processing
    if enqueue is None:
        log_error("queue.operations not available")
        return False

    # Fetch full scene data from Stash - needed for file path and complete metadata
    file_path = None
    scene_data = {}
    if stash:
        try:
            # Use raw GraphQL call for complete metadata (stashapi's find_scene uses minimal fragment)
            scene = None
            try:
                if hasattr(stash, 'call_GQL'):
                    result = stash.call_GQL(SCENE_QUERY, {"id": scene_id})
                    scene = result.get("findScene") if result else None
                elif hasattr(stash, '_callGraphQL'):
                    result = stash._callGraphQL(SCENE_QUERY, {"id": scene_id})
                    scene = result.get("findScene") if result else None
                else:
                    scene = stash.find_scene(scene_id)
            except Exception as gql_err:
                log_debug(f"GQL call failed: {gql_err}, falling back to find_scene")
                scene = stash.find_scene(scene_id)

            if scene:
                # Get file path
                files = scene.get('files', [])
                if files:
                    file_path = files[0].get('path')

                # Extract full metadata from scene
                scene_data['title'] = scene.get('title')
                scene_data['details'] = scene.get('details')
                scene_data['date'] = scene.get('date')
                scene_data['rating100'] = scene.get('rating100')

                # Get studio name
                studio = scene.get('studio')
                if studio:
                    scene_data['studio'] = studio.get('name')

                # Get performer names
                performers = scene.get('performers', [])
                if performers:
                    scene_data['performers'] = [p.get('name') for p in performers if p.get('name')]

                # Get tag names
                tags = scene.get('tags', [])
                if tags:
                    scene_data['tags'] = [t.get('name') for t in tags if t.get('name')]

                # Get image paths (poster/background)
                paths = scene.get('paths', {})
                if paths:
                    if paths.get('screenshot'):
                        scene_data['poster_url'] = paths['screenshot']
                    if paths.get('preview'):
                        scene_data['background_url'] = paths['preview']

        except Exception as e:
            import traceback
            log_warn(f"Could not fetch scene {scene_id}: {e}")
            traceback.print_exc()

    if not file_path:
        log_error(f"No file path for scene {scene_id}, cannot sync to Plex")
        return False

    # Merge scene_data with update_data (update_data takes precedence)
    # This ensures we have complete metadata even if hook only sent partial update
    merged_data = dict(scene_data)
    merged_data.update(update_data)
    merged_data['path'] = file_path
    update_data = merged_data

    # Build validation data from update_data
    # Title is required - if missing from update, we need to get it
    # For now, if title is missing, we skip validation
    title = update_data.get('title')

    if title and validate_metadata is not None:
        # Build validation dict with available fields
        validation_data = {
            'scene_id': scene_id,
            'title': title,
        }

        # Add optional fields if present
        for field in ['details', 'rating100', 'date', 'studio', 'performers', 'tags']:
            if field in update_data and update_data[field] is not None:
                validation_data[field] = update_data[field]

        # Validate and sanitize
        validated, error = validate_metadata(validation_data)

        if error:
            # Check if it's a missing title error (critical)
            if 'title' in error.lower() and ('required' in error.lower() or 'empty' in error.lower()):
                log_error(f"Scene {scene_id} validation failed: {error}")
                return False
            # For other validation errors, log warning but continue with sanitized data
            log_warn(f"Scene {scene_id} validation issue: {error}")

        if validated:
            # Use validated/sanitized data for job
            sanitized_data = {
                'title': validated.title,
            }
            # Add optional fields from validated model
            if validated.details is not None:
                sanitized_data['details'] = validated.details
            if validated.rating100 is not None:
                sanitized_data['rating100'] = validated.rating100
            if validated.date is not None:
                sanitized_data['date'] = validated.date
            if validated.studio is not None:
                sanitized_data['studio'] = validated.studio
            if validated.performers is not None:
                sanitized_data['performers'] = validated.performers
            if validated.tags is not None:
                sanitized_data['tags'] = validated.tags

            # Preserve any extra fields from original update_data that we don't validate
            for key in ['studio_id', 'performer_ids', 'tag_ids', 'rating', 'path', 'poster_url', 'background_url']:
                if key in update_data:
                    sanitized_data[key] = update_data[key]

            enqueue(queue, scene_id, "metadata", sanitized_data)
        else:
            # Validation failed critically (title issues), already logged above
            return False
    else:
        # No title in update or validation not available, enqueue as-is
        # (title might be in Stash already, worker can lookup)
        enqueue(queue, scene_id, "metadata", update_data)

    # Mark scene as pending to prevent duplicate enqueues
    mark_scene_pending(scene_id)

    # Calculate elapsed time and warn if over target
    elapsed_ms = (time.time() - start) * 1000
    log_debug(f"Enqueued sync job for scene {scene_id} in {elapsed_ms:.1f}ms")

    if elapsed_ms > 100:
        log_warn(f"Hook handler exceeded 100ms target ({elapsed_ms:.1f}ms)")

    return True
