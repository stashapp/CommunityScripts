"""
Plex exception hierarchy for error classification.

Integrates with Phase 2 error classification by subclassing TransientError
and PermanentError. This ensures proper retry/DLQ routing via the worker.

Exception classes:
    PlexTemporaryError: Retry-able errors (network, timeout, 5xx, rate limits)
    PlexPermanentError: Non-retry-able errors (auth, bad request)
    PlexNotFound: Item not in Plex library - may appear after scan

Functions:
    translate_plex_exception: Convert plexapi/requests exceptions to hierarchy
"""

from worker.processor import TransientError, PermanentError


class PlexTemporaryError(TransientError):
    """
    Retry-able Plex errors.

    Used for errors that may resolve with retry:
    - Network connectivity issues
    - Timeout errors
    - Server overload (5xx, rate limiting)
    """
    pass


class PlexPermanentError(PermanentError):
    """
    Non-retry-able Plex errors.

    Used for errors that won't resolve with retry:
    - Authentication failures (invalid token)
    - Bad requests (malformed data)
    - Permission errors
    """
    pass


class PlexNotFound(TransientError):
    """
    Item not found in Plex library.

    Distinct from PlexTemporaryError to allow different retry timing.
    Plex library scanning can take minutes to hours, so an item may
    appear after the library scan completes.

    This is treated as transient because the file may exist in the
    filesystem but Plex hasn't indexed it yet.
    """
    pass


def translate_plex_exception(exc: Exception) -> Exception:
    """
    Translate PlexAPI or requests exception to Phase 2 hierarchy.

    Handles:
    - plexapi.exceptions (Unauthorized, NotFound, BadRequest)
    - requests.exceptions (ConnectionError, Timeout)
    - HTTP status codes via response attribute
    - Unknown errors default to transient (safer)

    Args:
        exc: The original exception from PlexAPI or requests

    Returns:
        A PlexTemporaryError, PlexPermanentError, or PlexNotFound instance
    """
    # Import plexapi exceptions lazily to avoid hard dependency at module load
    try:
        from plexapi.exceptions import Unauthorized, NotFound, BadRequest
        has_plexapi = True
    except ImportError:
        has_plexapi = False
        Unauthorized = NotFound = BadRequest = None

    # Import requests exceptions
    try:
        import requests.exceptions
        has_requests = True
    except ImportError:
        has_requests = False

    # Handle PlexAPI exceptions
    if has_plexapi:
        if Unauthorized is not None and isinstance(exc, Unauthorized):
            return PlexPermanentError(f"Authentication failed: {exc}")
        if NotFound is not None and isinstance(exc, NotFound):
            return PlexNotFound(f"Item not found in Plex: {exc}")
        if BadRequest is not None and isinstance(exc, BadRequest):
            return PlexPermanentError(f"Bad request to Plex: {exc}")

    # Handle requests/network exceptions
    if has_requests:
        if isinstance(exc, requests.exceptions.ConnectionError):
            return PlexTemporaryError(f"Connection error: {exc}")
        if isinstance(exc, requests.exceptions.Timeout):
            return PlexTemporaryError(f"Timeout error: {exc}")

    # Handle base Python network exceptions
    if isinstance(exc, (ConnectionError, TimeoutError, OSError)):
        return PlexTemporaryError(f"Connection error: {exc}")

    # Handle HTTP errors with response attribute (status codes)
    if hasattr(exc, 'response') and exc.response is not None:
        status = getattr(exc.response, 'status_code', None)
        if status is not None:
            if status == 401:
                return PlexPermanentError(f"Unauthorized (401): {exc}")
            if status == 404:
                return PlexNotFound(f"Not found (404): {exc}")
            if status in (429, 500, 502, 503, 504):
                return PlexTemporaryError(f"Server error ({status}): {exc}")
            if 400 <= status < 500:
                return PlexPermanentError(f"Client error ({status}): {exc}")

    # Unknown errors default to transient (safer, allows retry)
    return PlexTemporaryError(f"Unknown Plex error: {exc}")
