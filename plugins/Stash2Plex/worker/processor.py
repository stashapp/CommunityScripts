"""
Background worker for processing sync jobs.

Implements reliable job processing with acknowledgment workflow:
- Acknowledges successful jobs
- Retries transient failures with exponential backoff
- Moves permanently failed jobs to DLQ
- Circuit breaker pauses processing during Plex outages
"""

import os
import sys
import time
import threading
import logging
from typing import Optional, TYPE_CHECKING

from worker.stats import SyncStats

# Lazy imports to avoid circular import with validation module
# These are imported inside _update_metadata() where they're used


# Stash plugin log levels
def log_trace(msg): print(f"\x01t\x02[Stash2Plex Worker] {msg}", file=sys.stderr)
def log_debug(msg): print(f"\x01d\x02[Stash2Plex Worker] {msg}", file=sys.stderr)
def log_info(msg): print(f"\x01i\x02[Stash2Plex Worker] {msg}", file=sys.stderr)
def log_warn(msg): print(f"\x01w\x02[Stash2Plex Worker] {msg}", file=sys.stderr)
def log_error(msg): print(f"\x01e\x02[Stash2Plex Worker] {msg}", file=sys.stderr)

# Lazy imports to avoid module-level pollution in tests
# These functions are imported inside methods that use them
# to ensure imports are fresh and not polluted by test mocking

logger = logging.getLogger('Stash2Plex.worker')

if TYPE_CHECKING:
    from validation.config import Stash2PlexConfig
    from plex.client import PlexClient
    from plex.cache import PlexCache, MatchCache


class TransientError(Exception):
    """Retry-able errors (network, timeout, 5xx)"""
    pass


class PermanentError(Exception):
    """Non-retry-able errors (4xx except 429, validation)"""
    pass


class SyncWorker:
    """
    Background worker that processes sync jobs from the queue.

    Runs in a daemon thread and processes jobs with proper acknowledgment:
    - Success: ack_job
    - Transient failure: exponential backoff retry with metadata in job
    - Permanent failure or max retries: fail_job + DLQ
    - Circuit breaker: pauses processing after consecutive failures
    """

    def __init__(
        self,
        queue,
        dlq: 'DeadLetterQueue',
        config: 'Stash2PlexConfig',
        data_dir: Optional[str] = None,
        max_retries: int = 5,
    ):
        """
        Initialize sync worker.

        Args:
            queue: SQLiteAckQueue instance
            dlq: DeadLetterQueue for permanently failed jobs
            config: Stash2PlexConfig with Plex URL, token, and timeouts
            data_dir: Plugin data directory for sync timestamp updates
            max_retries: Maximum retry attempts before moving to DLQ (default for standard errors)
        """
        self.queue = queue
        self.dlq = dlq
        self.config = config
        self.data_dir = data_dir
        self.max_retries = max_retries
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self._plex_client: Optional['PlexClient'] = None

        # Initialize caches (lazy, created on first use)
        self._library_cache: Optional['PlexCache'] = None
        self._match_cache: Optional['MatchCache'] = None

        # Initialize stats tracking
        self._stats = SyncStats()
        if data_dir is not None:
            stats_path = os.path.join(data_dir, 'stats.json')
            self._stats = SyncStats.load_from_file(stats_path)

        # DLQ status logging interval
        self._jobs_since_dlq_log = 0
        self._dlq_log_interval = 10  # Log DLQ status every 10 jobs

        # Circuit breaker for resilience during Plex outages
        from worker.circuit_breaker import CircuitBreaker
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5,
            recovery_timeout=60.0,
            success_threshold=1
        )

    def start(self):
        """Start the background worker thread"""
        if self.running:
            log_trace("Already running")
            return

        # Cleanup old DLQ entries
        retention_days = getattr(self.config, 'dlq_retention_days', 30)
        self.dlq.delete_older_than(days=retention_days)

        # Log DLQ status on startup
        self._log_dlq_status()

        self.running = True
        self.thread = threading.Thread(target=self._worker_loop, daemon=True)
        self.thread.start()
        log_info("Started")

    def _log_dlq_status(self):
        """Log DLQ status if jobs present."""
        count = self.dlq.get_count()
        if count > 0:
            log_warn(f"DLQ contains {count} failed jobs requiring review")
            recent = self.dlq.get_recent(limit=5)
            for entry in recent:
                log_debug(
                    f"DLQ #{entry['id']}: scene {entry['scene_id']} - "
                    f"{entry['error_type']}: {entry['error_message'][:80]}"
                )

    def _log_batch_summary(self):
        """Log periodic summary of sync operations with JSON stats."""
        import json

        stats = self._stats

        # Human-readable summary line
        log_info(
            f"Sync summary: {stats.jobs_succeeded}/{stats.jobs_processed} succeeded "
            f"({stats.success_rate:.1f}%), avg {stats.avg_processing_time*1000:.0f}ms, "
            f"confidence: {stats.high_confidence_matches} high / {stats.low_confidence_matches} low"
        )

        # JSON batch summary for machine parsing
        stats_dict = {
            "processed": stats.jobs_processed,
            "succeeded": stats.jobs_succeeded,
            "failed": stats.jobs_failed,
            "to_dlq": stats.jobs_to_dlq,
            "success_rate": f"{stats.success_rate:.1f}%",
            "avg_time_ms": int(stats.avg_processing_time * 1000),
            "high_confidence": stats.high_confidence_matches,
            "low_confidence": stats.low_confidence_matches,
            "errors_by_type": stats.errors_by_type,
        }
        log_info(f"Stats: {json.dumps(stats_dict)}")

        # DLQ summary if items present (using get_error_summary method)
        dlq_summary = self.dlq.get_error_summary()
        if dlq_summary:
            total = sum(dlq_summary.values())
            breakdown = ", ".join(f"{count} {err_type}" for err_type, count in dlq_summary.items())
            log_warn(f"DLQ contains {total} items: {breakdown}")

    def stop(self):
        """Stop the background worker thread"""
        if not self.running:
            return

        log_trace("Stopping...")
        self.running = False

        if self.thread:
            self.thread.join(timeout=5)
            if self.thread.is_alive():
                log_warn("Thread did not stop cleanly")

        log_trace("Stopped")

    def _prepare_for_retry(self, job: dict, error: Exception) -> dict:
        """
        Add retry metadata to job before re-enqueueing.

        Stores retry_count, next_retry_at, and last_error_type in job dict
        so retry state survives worker restart (crash-safe).

        Args:
            job: Job dict to update
            error: The exception that caused the retry

        Returns:
            Updated job dict with retry metadata
        """
        from worker.backoff import calculate_delay, get_retry_params

        base, cap, max_retries = get_retry_params(error)
        retry_count = job.get('retry_count', 0) + 1
        delay = calculate_delay(retry_count - 1, base, cap)  # -1 because we just incremented

        job['retry_count'] = retry_count
        job['next_retry_at'] = time.time() + delay
        job['last_error_type'] = type(error).__name__
        return job

    def _is_ready_for_retry(self, job: dict) -> bool:
        """
        Check if job's backoff delay has elapsed.

        Args:
            job: Job dict with optional next_retry_at field

        Returns:
            True if job is ready for processing (no delay or delay elapsed)
        """
        next_retry_at = job.get('next_retry_at', 0)
        return time.time() >= next_retry_at

    def _get_max_retries_for_error(self, error: Exception) -> int:
        """
        Get max retries based on error type.

        PlexNotFound errors get more retries (12) to allow for library scanning.
        Other transient errors use the standard max_retries (5).

        Args:
            error: The exception that triggered the retry

        Returns:
            Maximum number of retries for this error type
        """
        from worker.backoff import get_retry_params
        _, _, max_retries = get_retry_params(error)
        return max_retries

    def _requeue_with_metadata(self, job: dict):
        """
        Re-enqueue job with updated retry metadata.

        persist-queue's nack() doesn't support modifying job data,
        so we ack the current job and enqueue a fresh copy with
        updated metadata.

        Args:
            job: Job dict with retry metadata already added
        """
        # Lazy import to avoid module-level import pollution in tests
        from sync_queue.operations import ack_job as _ack_job

        # Extract original job fields for re-enqueue
        scene_id = job.get('scene_id')
        update_type = job.get('update_type')
        data = job.get('data', {})

        # Create new job with all metadata preserved
        new_job = {
            'scene_id': scene_id,
            'update_type': update_type,
            'data': data,
            'enqueued_at': job.get('enqueued_at', time.time()),
            'job_key': job.get('job_key', f"scene_{scene_id}"),
            # Preserve retry metadata
            'retry_count': job.get('retry_count', 0),
            'next_retry_at': job.get('next_retry_at', 0),
            'last_error_type': job.get('last_error_type'),
        }

        # Ack the old job (removes from queue)
        _ack_job(self.queue, job)
        # Enqueue fresh copy with metadata
        self.queue.put(new_job)

    def _worker_loop(self):
        """Main worker loop - runs in background thread"""
        from worker.circuit_breaker import CircuitState
        # Lazy imports to avoid module-level pollution in tests
        from sync_queue.operations import get_pending, ack_job, nack_job, fail_job

        while self.running:
            try:
                # Check circuit breaker first - pause if Plex is down
                if not self.circuit_breaker.can_execute():
                    log_debug(f"Circuit OPEN, sleeping {self.config.poll_interval}s")
                    time.sleep(self.config.poll_interval)
                    continue

                # Get next pending job (10 second timeout)
                item = get_pending(self.queue, timeout=10)
                if item is None:
                    # Timeout, continue loop
                    continue

                # Check if backoff delay has elapsed
                if not self._is_ready_for_retry(item):
                    # Put back in queue - not ready yet
                    nack_job(self.queue, item)
                    time.sleep(0.1)  # Small delay to avoid tight loop
                    continue

                pqid = item.get('pqid')
                scene_id = item.get('scene_id')
                retry_count = item.get('retry_count', 0)
                log_debug(f"Processing job {pqid} for scene {scene_id} (attempt {retry_count + 1})")

                _job_start = time.perf_counter()
                try:
                    # Process the job and get match confidence
                    confidence = self._process_job(item)
                    _job_elapsed = time.perf_counter() - _job_start

                    # Record success with stats
                    self._stats.record_success(_job_elapsed, confidence=confidence or 'high')

                    # Success: acknowledge job and record with circuit breaker
                    ack_job(self.queue, item)
                    self.circuit_breaker.record_success()
                    log_info(f"Job {pqid} completed")

                    # Periodic batch summary and cache status logging
                    self._jobs_since_dlq_log += 1
                    if self._jobs_since_dlq_log >= self._dlq_log_interval:
                        self._log_batch_summary()
                        self._log_cache_stats()
                        self._jobs_since_dlq_log = 0

                        # Save stats periodically
                        if self.data_dir is not None:
                            stats_path = os.path.join(self.data_dir, 'stats.json')
                            self._stats.save_to_file(stats_path)

                except TransientError as e:
                    _job_elapsed = time.perf_counter() - _job_start
                    # Record failure with circuit breaker
                    self.circuit_breaker.record_failure()
                    if self.circuit_breaker.state == CircuitState.OPEN:
                        log_warn("Circuit breaker OPENED - pausing processing")

                    # Prepare job for retry with backoff metadata
                    job = self._prepare_for_retry(item, e)
                    max_retries = self._get_max_retries_for_error(e)
                    job_retry_count = job.get('retry_count', 0)

                    if job_retry_count >= max_retries:
                        log_warn(f"Job {pqid} exceeded max retries ({max_retries}), moving to DLQ")
                        fail_job(self.queue, item)
                        self.dlq.add(job, e, job_retry_count)
                        self._stats.record_failure(type(e).__name__, _job_elapsed, to_dlq=True)
                    else:
                        delay = job.get('next_retry_at', 0) - time.time()
                        log_debug(f"Job {pqid} failed (attempt {job_retry_count}/{max_retries}), retry in {delay:.1f}s: {e}")
                        self._requeue_with_metadata(job)
                        self._stats.record_failure(type(e).__name__, _job_elapsed, to_dlq=False)

                except PermanentError as e:
                    _job_elapsed = time.perf_counter() - _job_start
                    # Permanent error: move to DLQ immediately (doesn't count against circuit)
                    log_error(f"Job {pqid} permanent failure, moving to DLQ: {e}")
                    fail_job(self.queue, item)
                    self.dlq.add(item, e, item.get('retry_count', 0))
                    self._stats.record_failure(type(e).__name__, _job_elapsed, to_dlq=True)

                except Exception as e:
                    _job_elapsed = time.perf_counter() - _job_start
                    # Unknown error: treat as transient with circuit breaker
                    self.circuit_breaker.record_failure()
                    log_warn(f"Job {pqid} unexpected error (treating as transient): {e}")
                    nack_job(self.queue, item)
                    self._stats.record_failure(type(e).__name__, _job_elapsed, to_dlq=False)

            except Exception as e:
                # Worker loop error: log and continue
                log_error(f"Worker loop error: {e}")
                time.sleep(1)  # Avoid tight loop on persistent errors

    def _fetch_stash_image(self, url: str) -> Optional[bytes]:
        """
        Fetch image from Stash URL.

        Downloads the image bytes so we can upload directly to Plex,
        avoiding issues with Plex not being able to reach Stash's internal URL.

        Args:
            url: Stash image URL (screenshot, preview, etc.)

        Returns:
            Image bytes or None if fetch failed
        """
        import urllib.request
        import urllib.error

        try:
            # Build request with authentication from Stash connection
            req = urllib.request.Request(url)

            # Add API key header if available
            api_key = getattr(self.config, 'stash_api_key', None)
            if api_key:
                req.add_header('ApiKey', api_key)

            # Add session cookie if available
            session_cookie = getattr(self.config, 'stash_session_cookie', None)
            if session_cookie:
                req.add_header('Cookie', session_cookie)

            with urllib.request.urlopen(req, timeout=30) as response:
                return response.read()
        except urllib.error.URLError as e:
            log_warn(f" Failed to fetch image from Stash: {e}")
            return None
        except Exception as e:
            log_warn(f" Image fetch error: {e}")
            return None

    def _get_plex_client(self) -> 'PlexClient':
        """
        Get PlexClient with lazy initialization.

        Creates PlexClient on first use to avoid connecting to Plex
        until we actually need to process a job.

        Returns:
            PlexClient instance configured with URL, token, and timeouts
        """
        if self._plex_client is None:
            from plex.client import PlexClient
            self._plex_client = PlexClient(
                url=self.config.plex_url,
                token=self.config.plex_token,
                connect_timeout=self.config.plex_connect_timeout,
                read_timeout=self.config.plex_read_timeout,
            )
        return self._plex_client

    def _get_caches(self) -> tuple[Optional['PlexCache'], Optional['MatchCache']]:
        """
        Get or create cache instances (lazy initialization).

        Caches are only created when data_dir is set. When data_dir is None,
        returns (None, None) and processing continues without caching.

        Returns:
            Tuple of (PlexCache or None, MatchCache or None)
        """
        if self._library_cache is None and self.data_dir is not None:
            from plex.cache import PlexCache, MatchCache
            cache_dir = os.path.join(self.data_dir, 'cache')
            self._library_cache = PlexCache(cache_dir)
            self._match_cache = MatchCache(cache_dir)
            log_debug(f"Initialized caches at {cache_dir}")
        return self._library_cache, self._match_cache

    def _log_cache_stats(self):
        """Log cache hit/miss statistics."""
        library_cache, match_cache = self._get_caches()
        if library_cache is not None:
            stats = library_cache.get_stats()
            total = stats.get('hits', 0) + stats.get('misses', 0)
            if total > 0:
                hit_rate = stats['hits'] / total * 100
                log_debug(f"Library cache: {hit_rate:.1f}% hit rate ({stats['hits']} hits, {stats['misses']} misses)")
        if match_cache is not None:
            stats = match_cache.get_stats()
            total = stats.get('hits', 0) + stats.get('misses', 0)
            if total > 0:
                hit_rate = stats['hits'] / total * 100
                log_info(f"Match cache: {hit_rate:.1f}% hit rate ({stats['hits']} hits, {stats['misses']} misses)")

    def _process_job(self, job: dict) -> Optional[str]:
        """
        Process a sync job by updating Plex metadata.

        Finds the Plex item matching the job's file path and updates
        its metadata based on the update_type.

        Args:
            job: Job dict with scene_id, update_type, data
                - scene_id: Stash scene ID
                - update_type: Type of update (e.g., 'metadata')
                - data: Dict containing 'path' and metadata fields

        Returns:
            Match confidence level ('high' or 'low'), or None if job failed

        Raises:
            TransientError: For retry-able errors (network, timeout)
            PermanentError: For permanent failures (missing path, bad data)
        """
        import time as _time
        _start_time = _time.perf_counter()

        from plex.exceptions import PlexTemporaryError, PlexPermanentError, PlexNotFound, translate_plex_exception
        from plex.matcher import find_plex_items_with_confidence, MatchConfidence
        # Lazy imports to avoid module-level pollution in tests
        from sync_queue.operations import save_sync_timestamp
        from hooks.handlers import unmark_scene_pending

        scene_id = job.get('scene_id')
        data = job.get('data', {})
        file_path = data.get('path')

        if not file_path:
            raise PermanentError(f"Job {scene_id} missing file path")

        try:
            client = self._get_plex_client()

            # Get library section(s) to search
            if self.config.plex_library:
                # Search only the configured library
                try:
                    sections = [client.server.library.section(self.config.plex_library)]
                    log_trace(f"Searching library: {self.config.plex_library}")
                except Exception as e:
                    raise PermanentError(f"Library '{self.config.plex_library}' not found: {e}")
            else:
                # Search all libraries (slow)
                sections = client.server.library.sections()
                log_info(f"Searching all {len(sections)} libraries (set plex_library to speed up)")

            # Get caches for optimized matching
            library_cache, match_cache = self._get_caches()

            # Search library sections, collect ALL candidates
            all_candidates = []
            for section in sections:
                try:
                    confidence, item, candidates = find_plex_items_with_confidence(
                        section,
                        file_path,
                        library_cache=library_cache,
                        match_cache=match_cache,
                    )
                    all_candidates.extend(candidates)
                except PlexNotFound:
                    continue  # No match in this section, try next

            # Deduplicate candidates (same item might be in multiple sections)
            seen_keys = set()
            unique_candidates = []
            for c in all_candidates:
                if c.key not in seen_keys:
                    seen_keys.add(c.key)
                    unique_candidates.append(c)

            # Apply confidence scoring
            confidence = None
            if len(unique_candidates) == 0:
                raise PlexNotFound(f"Could not find Plex item for path: {file_path}")
            elif len(unique_candidates) == 1:
                # HIGH confidence - single unique match
                confidence = 'high'
                plex_item = unique_candidates[0]
                self._update_metadata(plex_item, data)
            else:
                # LOW confidence - multiple matches
                confidence = 'low'
                paths = [c.media[0].parts[0].file if c.media and c.media[0].parts else c.key for c in unique_candidates]
                if self.config.strict_matching:
                    logger.warning(
                        f"[Stash2Plex] LOW CONFIDENCE SKIPPED: scene {scene_id}\n"
                        f"  Stash path: {file_path}\n"
                        f"  Plex candidates ({len(unique_candidates)}): {paths}"
                    )
                    raise PermanentError(f"Low confidence match skipped (strict_matching=true)")
                else:
                    plex_item = unique_candidates[0]
                    logger.warning(
                        f"[Stash2Plex] LOW CONFIDENCE SYNCED: scene {scene_id}\n"
                        f"  Chosen: {paths[0]}\n"
                        f"  Other candidates: {paths[1:]}"
                    )
                    self._update_metadata(plex_item, data)

            # Update sync timestamp after successful sync
            if self.data_dir is not None:
                save_sync_timestamp(self.data_dir, scene_id, time.time())

            # Remove from pending set (always, even on failure - will be re-added on retry)
            unmark_scene_pending(scene_id)

            # Log job processing time
            _elapsed = _time.perf_counter() - _start_time
            if _elapsed >= 1.0:
                log_info(f"_process_job took {_elapsed:.3f}s")
            else:
                log_trace(f"_process_job took {_elapsed:.3f}s")

            return confidence

        except (PlexTemporaryError, PlexPermanentError, PlexNotFound):
            unmark_scene_pending(scene_id)  # Allow re-enqueue on next hook
            raise
        except Exception as e:
            unmark_scene_pending(scene_id)
            raise translate_plex_exception(e)

    def _validate_edit_result(self, plex_item, expected_edits: dict) -> list:
        """
        Validate that edit actually applied expected values.

        Returns list of fields that may not have updated correctly.
        This catches silent failures where Plex accepts the request
        but doesn't apply the value (e.g., field limit exceeded).

        Args:
            plex_item: Plex item after reload
            expected_edits: Dict of edits that were sent (field.value -> value)

        Returns:
            List of issue descriptions for fields that may not have updated
        """
        issues = []
        for field_key, expected_value in expected_edits.items():
            # Skip locked fields and non-value fields
            if '.locked' in field_key or not expected_value:
                continue

            # Parse field name from "field.value" format
            field_name = field_key.replace('.value', '')

            # Map edit field names to actual plex_item attributes
            field_mapping = {
                'title': 'title',
                'studio': 'studio',
                'summary': 'summary',
                'tagline': 'tagline',
                'originallyAvailableAt': 'originallyAvailableAt',
            }

            attr_name = field_mapping.get(field_name)
            if not attr_name:
                continue

            actual_value = getattr(plex_item, attr_name, None)

            # Convert to string for comparison (handle None)
            expected_str = str(expected_value) if expected_value else ''
            actual_str = str(actual_value) if actual_value else ''

            # Check if value matches (with tolerance for truncation/sanitization)
            # Compare first 50 chars to handle any server-side trimming
            if expected_str and actual_str:
                if expected_str[:50] != actual_str[:50]:
                    issues.append(
                        f"{field_name}: sent '{expected_str[:20]}...', "
                        f"got '{actual_str[:20]}...'"
                    )
            elif expected_str and not actual_str:
                issues.append(f"{field_name}: sent value but field is empty")

        return issues

    def _update_metadata(self, plex_item, data: dict):
        """
        Update Plex item metadata from sync job data with granular error handling.

        Implements LOCKED user decision: When Stash provides None/empty for an
        optional field, the existing Plex value is CLEARED (not preserved).
        When a field key is NOT in the data dict, the existing value is preserved.

        Non-critical field failures (performers, tags, poster, background, collection)
        are logged as warnings but don't fail the overall sync. Critical field failures
        (core metadata edit) propagate and fail the job.

        Uses plex_item.edit() to update metadata fields, then reloads
        the item to confirm changes.

        Args:
            plex_item: Plex Video item to update
            data: Dict containing metadata fields (title, studio, details, etc.)

        Returns:
            PartialSyncResult tracking which fields succeeded and which had warnings
        """
        # Lazy imports to avoid circular import with validation module
        from validation.limits import (
            MAX_TITLE_LENGTH,
            MAX_STUDIO_LENGTH,
            MAX_SUMMARY_LENGTH,
            MAX_TAGLINE_LENGTH,
            MAX_PERFORMER_NAME_LENGTH,
            MAX_TAG_NAME_LENGTH,
            MAX_PERFORMERS,
            MAX_TAGS,
        )
        from validation.sanitizers import sanitize_for_plex
        from validation.errors import PartialSyncResult

        result = PartialSyncResult()
        edits = {}

        # =========================================================================
        # MASTER TOGGLE CHECK - if OFF, skip ALL field syncing
        # =========================================================================
        if not getattr(self.config, 'sync_master', True):
            log_debug("Master sync toggle is OFF - skipping all field syncs")
            return result

        # LOCKED DECISION: Missing optional fields clear existing Plex values
        # - If key exists AND value is None/empty -> CLEAR (set to '')
        # - If key exists AND value is present -> sanitize and set
        # - If key does NOT exist in data dict -> do nothing (preserve)

        # Handle title field (CRITICAL - failure propagates)
        if 'title' in data:
            title_value = data.get('title')
            if title_value is None or title_value == '':
                # LOCKED: Clear existing Plex value
                edits['title.value'] = ''
                log_debug("Clearing title (Stash value is empty)")
            else:
                sanitized = sanitize_for_plex(title_value, max_length=MAX_TITLE_LENGTH)
                if not self.config.preserve_plex_edits or not plex_item.title:
                    edits['title.value'] = sanitized

        # Handle studio field - TOGGLE CHECK FIRST
        if getattr(self.config, 'sync_studio', True):
            if 'studio' in data:
                studio_value = data.get('studio')
                if studio_value is None or studio_value == '':
                    # LOCKED: Clear existing Plex value
                    edits['studio.value'] = ''
                    log_debug("Clearing studio (Stash value is empty)")
                else:
                    sanitized = sanitize_for_plex(studio_value, max_length=MAX_STUDIO_LENGTH)
                    if not self.config.preserve_plex_edits or not plex_item.studio:
                        edits['studio.value'] = sanitized

        # Handle summary field (Stash 'details' -> Plex 'summary') - TOGGLE CHECK FIRST
        if getattr(self.config, 'sync_summary', True):
            # Check for both 'details' and 'summary' keys
            has_summary_key = 'details' in data or 'summary' in data
            if has_summary_key:
                summary_value = data.get('details') or data.get('summary')
                if summary_value is None or summary_value == '':
                    # LOCKED: Clear existing Plex value
                    edits['summary.value'] = ''
                    log_debug("Clearing summary (Stash value is empty)")
                else:
                    sanitized = sanitize_for_plex(summary_value, max_length=MAX_SUMMARY_LENGTH)
                    if not self.config.preserve_plex_edits or not plex_item.summary:
                        edits['summary.value'] = sanitized

        # Handle tagline field - TOGGLE CHECK FIRST
        if getattr(self.config, 'sync_tagline', True):
            if 'tagline' in data:
                tagline_value = data.get('tagline')
                if tagline_value is None or tagline_value == '':
                    # LOCKED: Clear existing Plex value
                    edits['tagline.value'] = ''
                    log_debug("Clearing tagline (Stash value is empty)")
                else:
                    sanitized = sanitize_for_plex(tagline_value, max_length=MAX_TAGLINE_LENGTH)
                    if not self.config.preserve_plex_edits or not getattr(plex_item, 'tagline', None):
                        edits['tagline.value'] = sanitized

        # Handle date field - TOGGLE CHECK FIRST
        if getattr(self.config, 'sync_date', True):
            if 'date' in data:
                date_value = data.get('date')
                if date_value is None or date_value == '':
                    # LOCKED: Clear existing Plex value
                    edits['originallyAvailableAt.value'] = ''
                    log_debug("Clearing date (Stash value is empty)")
                else:
                    if not self.config.preserve_plex_edits or not getattr(plex_item, 'originallyAvailableAt', None):
                        edits['originallyAvailableAt.value'] = date_value

        # Apply core metadata edits (CRITICAL - failure propagates)
        if edits:
            log_debug(f"Updating fields: {list(edits.keys())}")
            plex_item.edit(**edits)
            plex_item.reload()

            # Validate that edits were actually applied
            validation_issues = self._validate_edit_result(plex_item, edits)
            if validation_issues:
                log_debug(f"Edit validation issues (may be expected): {validation_issues}")

            mode = "preserved" if self.config.preserve_plex_edits else "overwrite"
            log_info(f"Updated metadata ({mode} mode): {plex_item.title}")
            result.add_success('metadata')
        else:
            log_trace(f"No metadata fields to update for: {plex_item.title}")

        # NON-CRITICAL: Sync performers as actors - TOGGLE CHECK FIRST
        # LOCKED: If 'performers' key exists with empty/None, clear all actors
        if getattr(self.config, 'sync_performers', True) and 'performers' in data:
            performers = data.get('performers')
            if performers is None or performers == []:
                # LOCKED: Clear all existing performers
                try:
                    plex_item.edit(**{'actor.locked': 1})  # Lock to clear
                    plex_item.reload()
                    log_debug("Clearing performers (Stash value is empty)")
                    result.add_success('performers')
                except Exception as e:
                    log_warn(f" Failed to clear performers: {e}")
                    result.add_warning('performers', e)
            elif performers:
                try:
                    # Sanitize performer names and apply limits
                    sanitized_performers = [
                        sanitize_for_plex(p, max_length=MAX_PERFORMER_NAME_LENGTH)
                        for p in performers
                    ]

                    # Apply MAX_PERFORMERS limit
                    if len(sanitized_performers) > MAX_PERFORMERS:
                        log_warn(f"Truncating performers list from {len(sanitized_performers)} to {MAX_PERFORMERS}")
                        sanitized_performers = sanitized_performers[:MAX_PERFORMERS]

                    # Get current actors
                    current_actors = [actor.tag for actor in getattr(plex_item, 'actors', [])]
                    new_performers = [p for p in sanitized_performers if p not in current_actors]

                    if new_performers:
                        # Build actor edit params - each actor needs actor[N].tag.tag format
                        actor_edits = {}
                        all_actors = current_actors + new_performers
                        # Apply limit to combined list too
                        if len(all_actors) > MAX_PERFORMERS:
                            log_warn(f"Truncating combined actors list from {len(all_actors)} to {MAX_PERFORMERS}")
                            all_actors = all_actors[:MAX_PERFORMERS]
                        for i, actor_name in enumerate(all_actors):
                            actor_edits[f'actor[{i}].tag.tag'] = actor_name

                        plex_item.edit(**actor_edits)
                        plex_item.reload()
                        log_info(f"Added {len(new_performers)} performers: {new_performers}")
                    else:
                        log_trace(f"Performers already in Plex: {sanitized_performers}")
                    result.add_success('performers')
                except Exception as e:
                    log_warn(f" Failed to sync performers: {e}")
                    result.add_warning('performers', e)

        # NON-CRITICAL: Sync poster image - TOGGLE CHECK FIRST
        # (download from Stash, save to temp file, upload to Plex)
        if getattr(self.config, 'sync_poster', True) and data.get('poster_url'):
            poster_url = data.get('poster_url')
            try:
                image_data = self._fetch_stash_image(poster_url)
                if image_data:
                    import tempfile
                    import os
                    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
                        f.write(image_data)
                        temp_path = f.name
                    try:
                        plex_item.uploadPoster(filepath=temp_path)
                        log_debug(f"Uploaded poster ({len(image_data)} bytes)")
                        result.add_success('poster')
                    finally:
                        os.unlink(temp_path)
                else:
                    result.add_warning('poster', ValueError("No image data returned from Stash"))
            except Exception as e:
                log_warn(f" Failed to upload poster: {e}")
                result.add_warning('poster', e)

        # NON-CRITICAL: Sync background/art image - TOGGLE CHECK FIRST
        # (download from Stash, save to temp file, upload to Plex)
        if getattr(self.config, 'sync_background', True) and data.get('background_url'):
            background_url = data.get('background_url')
            try:
                image_data = self._fetch_stash_image(background_url)
                if image_data:
                    import tempfile
                    import os
                    with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
                        f.write(image_data)
                        temp_path = f.name
                    try:
                        plex_item.uploadArt(filepath=temp_path)
                        log_debug(f"Uploaded background ({len(image_data)} bytes)")
                        result.add_success('background')
                    finally:
                        os.unlink(temp_path)
                else:
                    result.add_warning('background', ValueError("No image data returned from Stash"))
            except Exception as e:
                log_warn(f" Failed to upload background: {e}")
                result.add_warning('background', e)

        # NON-CRITICAL: Sync tags as genres - TOGGLE CHECK FIRST
        # LOCKED: If 'tags' key exists with empty/None, clear all tags
        if getattr(self.config, 'sync_tags', True) and 'tags' in data:
            tags = data.get('tags')
            if tags is None or tags == []:
                # LOCKED: Clear all existing tags/genres
                try:
                    plex_item.edit(**{'genre.locked': 1})  # Lock to clear
                    plex_item.reload()
                    log_debug("Clearing tags (Stash value is empty)")
                    result.add_success('tags')
                except Exception as e:
                    log_warn(f" Failed to clear tags: {e}")
                    result.add_warning('tags', e)
            elif tags:
                try:
                    # Sanitize tag names and apply limits
                    sanitized_tags = [
                        sanitize_for_plex(t, max_length=MAX_TAG_NAME_LENGTH)
                        for t in tags
                    ]

                    # Apply MAX_TAGS limit
                    if len(sanitized_tags) > MAX_TAGS:
                        log_warn(f"Truncating tags list from {len(sanitized_tags)} to {MAX_TAGS}")
                        sanitized_tags = sanitized_tags[:MAX_TAGS]

                    current_genres = [g.tag for g in getattr(plex_item, 'genres', [])]
                    new_tags = [t for t in sanitized_tags if t not in current_genres]

                    if new_tags:
                        # Build genre edit params
                        genre_edits = {}
                        all_genres = current_genres + new_tags
                        # Apply limit to combined list too
                        if len(all_genres) > MAX_TAGS:
                            log_warn(f"Truncating combined tags list from {len(all_genres)} to {MAX_TAGS}")
                            all_genres = all_genres[:MAX_TAGS]
                        for i, genre_name in enumerate(all_genres):
                            genre_edits[f'genre[{i}].tag.tag'] = genre_name

                        plex_item.edit(**genre_edits)
                        plex_item.reload()
                        log_info(f"Added {len(new_tags)} tags as genres: {new_tags}")
                    else:
                        log_trace(f"Tags already in Plex: {sanitized_tags}")
                    result.add_success('tags')
                except Exception as e:
                    log_warn(f" Failed to sync tags: {e}")
                    result.add_warning('tags', e)

        # NON-CRITICAL: Add to studio collection - TOGGLE CHECK FIRST
        if getattr(self.config, 'sync_collection', True) and data.get('studio'):
            studio = data.get('studio')
            try:
                current_collections = [c.tag for c in getattr(plex_item, 'collections', [])]
                if studio not in current_collections:
                    # Build collection edit params
                    collection_edits = {}
                    all_collections = current_collections + [studio]
                    for i, coll_name in enumerate(all_collections):
                        collection_edits[f'collection[{i}].tag.tag'] = coll_name

                    plex_item.edit(**collection_edits)
                    plex_item.reload()
                    log_debug(f"Added to collection: {studio}")
                else:
                    log_trace(f"Already in collection: {studio}")
                result.add_success('collection')
            except Exception as e:
                log_warn(f" Failed to add to collection: {e}")
                result.add_warning('collection', e)

        # Log aggregated warnings at end
        if result.has_warnings:
            log_warn(f"Partial sync for {plex_item.title}: {result.warning_summary}")

        return result
