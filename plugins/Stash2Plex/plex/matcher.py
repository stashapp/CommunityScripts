"""
Plex item matching logic with optional caching support.

Fast path: title search derived from filename, then verify by filename match.
Slow fallback: scan all items if title search fails.

Caching support (optional):
- library_cache: PlexCache for library items and search results
- match_cache: MatchCache for path-to-item key mappings

When caches are provided:
1. Check match_cache for existing path-to-key mapping
2. If hit, fetch item directly via library.fetchItem(key) (1 API call vs search)
3. If miss or stale, fall back to search/all logic
4. After successful match, store in match_cache

Cache stores simplified dicts, but matching returns actual plexapi Video objects.
"""

from enum import Enum
import logging
import re
import sys
from pathlib import Path
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from plexapi.library import LibrarySection
    from plexapi.video import Video
    from plex.cache import PlexCache, MatchCache

logger = logging.getLogger('Stash2Plex.plex.matcher')

# Stash plugin log levels
def log_debug(msg): print(f"\x01d\x02[Stash2Plex Matcher] {msg}", file=sys.stderr)
def log_info(msg): print(f"\x01i\x02[Stash2Plex Matcher] {msg}", file=sys.stderr)
def log_warn(msg): print(f"\x01w\x02[Stash2Plex Matcher] {msg}", file=sys.stderr)


def _cached_item_has_file(item_data: dict, filename: str, case_insensitive: bool = True) -> bool:
    """
    Check if cached item data has a file matching the given filename.

    Args:
        item_data: Dict with 'file_paths' list from cache
        filename: Filename to match (not full path)
        case_insensitive: If True, compare case-insensitively

    Returns:
        True if item has matching filename
    """
    file_paths = item_data.get('file_paths', [])
    compare_name = filename.lower() if case_insensitive else filename

    for file_path in file_paths:
        cached_name = Path(file_path).name
        if case_insensitive:
            cached_name = cached_name.lower()
        if cached_name == compare_name:
            return True
    return False


def _item_has_file(item, path_or_filename: str, exact: bool = True, case_insensitive: bool = False) -> bool:
    """
    Check if a Plex item has a media file matching the given path or filename.

    Args:
        item: Plex video item
        path_or_filename: Full path or just filename to match
        exact: If True, match full path; if False, match filename only
        case_insensitive: If True, compare case-insensitively

    Returns:
        True if item has matching file
    """
    try:
        if not hasattr(item, 'media') or not item.media:
            return False

        compare_val = path_or_filename.lower() if case_insensitive else path_or_filename

        for media in item.media:
            if not hasattr(media, 'parts') or not media.parts:
                continue
            for part in media.parts:
                if not hasattr(part, 'file') or not part.file:
                    continue

                file_path = part.file
                if case_insensitive:
                    file_path = file_path.lower()

                if exact:
                    if file_path == compare_val:
                        return True
                else:
                    # Match filename only
                    if file_path.endswith('/' + compare_val) or file_path.endswith('\\' + compare_val):
                        return True
                    # Also check without path separator for edge cases
                    if Path(file_path).name == (Path(path_or_filename).name if not case_insensitive else Path(path_or_filename).name.lower()):
                        return True
    except Exception as e:
        logger.debug(f"Error checking item files: {e}")

    return False


class MatchConfidence(Enum):
    HIGH = "high"   # Single unique match - auto-sync safe
    LOW = "low"     # Multiple candidates - needs review


def find_plex_item_by_path(
    library: "LibrarySection",
    stash_path: str,
    plex_path_prefix: Optional[str] = None,
    stash_path_prefix: Optional[str] = None,
) -> Optional["Video"]:
    """
    Find Plex item matching a Stash file path.

    Fast path: title search then verify filename.
    Slow fallback: scan all items by filename if title search fails.

    Args:
        library: Plex library section to search
        stash_path: File path from Stash
        plex_path_prefix: Unused, kept for API compatibility
        stash_path_prefix: Unused, kept for API compatibility

    Returns:
        Matching Plex item or None if not found / ambiguous
    """
    path = Path(stash_path)
    filename = path.name
    filename_lower = filename.lower()

    # Derive title variants from filename
    title_search = path.stem
    title_search = re.sub(r'\s*[-_]?\s*(WEBDL|WEB-DL|WEBRip|HDTV|BluRay|BDRip|DVDRip|720p|1080p|2160p|4K|HDR|DV).*$', '', title_search, flags=re.IGNORECASE)
    title_base = re.sub(r'\s*[-_]?\s*\d{4}-\d{2}-\d{2}\s*$', '', title_search)

    matches = []

    # Fast path: title search
    try:
        for title in [title_search, title_base]:
            if matches:
                break
            results = library.search(title=title)
            for item in results:
                if _item_has_file(item, filename_lower, exact=False, case_insensitive=True):
                    matches.append(item)
    except Exception as e:
        logger.warning(f"Title search failed: {e}")

    # Slow fallback if needed
    if not matches:
        try:
            all_items = library.all()
            for item in all_items:
                if _item_has_file(item, filename_lower, exact=False, case_insensitive=True):
                    matches.append(item)
        except Exception as e:
            logger.warning(f"Scan failed: {e}")

    if len(matches) == 1:
        return matches[0]
    return None


def find_plex_items_with_confidence(
    library: "LibrarySection",
    stash_path: str,
    plex_path_prefix: Optional[str] = None,
    stash_path_prefix: Optional[str] = None,
    library_cache: Optional["PlexCache"] = None,
    match_cache: Optional["MatchCache"] = None,
) -> tuple[MatchConfidence, Optional["Video"], list["Video"]]:
    """
    Find Plex item with confidence scoring and optional caching.

    Execution order with caches:
    1. Check match_cache for existing path-to-key mapping
    2. If hit, fetch item directly via library.fetchItem(key) (1 API call)
    3. If stale (item not found), invalidate cache and continue
    4. Fall back to title search, then all-items scan
    5. On successful match, store in match_cache for next time

    Args:
        library: Plex library section to search
        stash_path: File path from Stash
        plex_path_prefix: Unused, kept for API compatibility
        stash_path_prefix: Unused, kept for API compatibility
        library_cache: Optional PlexCache for library/search result caching
        match_cache: Optional MatchCache for path-to-key mapping caching

    Returns:
        Tuple of (confidence, best_match_or_none, all_candidates):
        - HIGH confidence + item: Single unique match found
        - LOW confidence + None: Multiple ambiguous matches (candidates list populated)
        - Raises PlexNotFound if no matches at all

    Raises:
        PlexNotFound: When no matching items found (allows retry logic)

    Example:
        >>> # Without caches (backward compatible)
        >>> confidence, item, candidates = find_plex_items_with_confidence(library, path)

        >>> # With caches (optimized)
        >>> from plex.cache import PlexCache, MatchCache
        >>> lib_cache = PlexCache("/data")
        >>> match_cache = MatchCache("/data")
        >>> confidence, item, candidates = find_plex_items_with_confidence(
        ...     library, path, library_cache=lib_cache, match_cache=match_cache
        ... )
    """
    from plex.exceptions import PlexNotFound

    path = Path(stash_path)
    filename = path.name
    filename_lower = filename.lower()
    library_name = library.title

    # Check match_cache for existing mapping (fastest path)
    if match_cache is not None:
        cached_key = match_cache.get_match(library_name, stash_path)
        if cached_key is not None:
            log_debug(f"Match cache hit: {stash_path} -> {cached_key}")
            try:
                # Fetch item directly by key (1 API call vs search)
                item = library.fetchItem(cached_key)
                if item is not None:
                    log_info(f"Cache hit: {item.title}")
                    return (MatchConfidence.HIGH, item, [item])
            except Exception as e:
                # Item not found at cached key - cache is stale
                log_debug(f"Cached key stale, invalidating: {e}")
                match_cache.invalidate(library_name, stash_path)

    # Derive title variants from filename
    title_search = path.stem
    # Remove quality suffix (handles "WEBDL", "- WEBDL", "WEBDL-2160p", etc.)
    title_search = re.sub(r'\s*[-_]?\s*(WEBDL|WEB-DL|WEBRip|HDTV|BluRay|BDRip|DVDRip|720p|1080p|2160p|4K|HDR|DV).*$', '', title_search, flags=re.IGNORECASE)
    # Remove date suffix like "- 2026-01-30" or "2026-01-30"
    title_base = re.sub(r'\s*[-_]?\s*\d{4}-\d{2}-\d{2}\s*$', '', title_search)

    log_debug(f"Searching '{library_name}' for: {filename}")
    log_debug(f"Title variants: '{title_search}' / '{title_base}'")

    candidates = []

    # Fast path: title search (with optional library_cache)
    try:
        for title in [title_search, title_base]:
            if candidates:
                break
            log_debug(f"Title search: '{title}'")

            # Check library_cache for search results
            cached_results = None
            if library_cache is not None:
                cached_results = library_cache.get_search_results(library_name, title)

            if cached_results is not None:
                # Cache hit - match against cached data, then fetch actual items
                log_debug(f"Search cache hit: {len(cached_results)} results")
                for item_data in cached_results:
                    if _cached_item_has_file(item_data, filename_lower, case_insensitive=True):
                        # Found match in cache - fetch actual item
                        try:
                            actual_item = library.fetchItem(item_data['key'])
                            if actual_item is not None:
                                candidates.append(actual_item)
                                log_info(f"Found (cached): {actual_item.title}")
                        except Exception as e:
                            log_debug(f"Failed to fetch cached item {item_data['key']}: {e}")
            else:
                # Cache miss - do actual search
                results = library.search(title=title)
                log_debug(f"Got {len(results)} title matches")

                # Cache the results for next time
                if library_cache is not None:
                    library_cache.set_search_results(library_name, title, results)

                for item in results:
                    if _item_has_file(item, filename_lower, exact=False, case_insensitive=True):
                        candidates.append(item)
                        log_info(f"Found: {item.title}")
    except Exception as e:
        log_warn(f"Title search failed: {e}")

    # Slow fallback: scan all items if title search found nothing
    if not candidates:
        try:
            log_debug(f"Fallback: scanning all items...")

            # Check library_cache for all items
            cached_items = None
            if library_cache is not None:
                cached_items = library_cache.get_library_items(library_name)

            if cached_items is not None:
                # Cache hit - match against cached data, then fetch actual items
                log_debug(f"Library cache hit: {len(cached_items)} items")
                for item_data in cached_items:
                    if _cached_item_has_file(item_data, filename_lower, case_insensitive=True):
                        # Found match in cache - fetch actual item
                        try:
                            actual_item = library.fetchItem(item_data['key'])
                            if actual_item is not None:
                                candidates.append(actual_item)
                                log_info(f"Found (cached): {actual_item.title}")
                        except Exception as e:
                            log_debug(f"Failed to fetch cached item {item_data['key']}: {e}")
            else:
                # Cache miss - do actual library scan
                all_items = library.all()
                log_debug(f"Scanning {len(all_items)} items...")

                # Cache the items for next time
                if library_cache is not None:
                    library_cache.set_library_items(library_name, all_items)

                for item in all_items:
                    if _item_has_file(item, filename_lower, exact=False, case_insensitive=True):
                        candidates.append(item)
                        log_info(f"Found: {item.title}")
        except Exception as e:
            log_warn(f"Scan failed: {e}")

    # Scoring logic
    if len(candidates) == 0:
        raise PlexNotFound(f"No Plex item found for filename: {filename}")
    elif len(candidates) == 1:
        logger.debug(f"HIGH confidence match for {filename}")
        # Store in match_cache for next time
        if match_cache is not None:
            item = candidates[0]
            item_key = getattr(item, 'key', None) or getattr(item, 'ratingKey', None)
            if item_key:
                match_cache.set_match(library_name, stash_path, str(item_key))
        return (MatchConfidence.HIGH, candidates[0], candidates)
    else:
        # Multiple matches - log warning with candidate paths
        candidate_paths = []
        for item in candidates:
            try:
                if hasattr(item, 'media') and item.media:
                    if hasattr(item.media[0], 'parts') and item.media[0].parts:
                        candidate_paths.append(item.media[0].parts[0].file)
            except (IndexError, AttributeError):
                candidate_paths.append("<path unavailable>")

        logger.warning(
            f"LOW confidence match for '{filename}': "
            f"{len(candidates)} candidates found - {candidate_paths}"
        )
        return (MatchConfidence.LOW, None, candidates)
