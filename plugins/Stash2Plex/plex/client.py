"""
PlexClient wrapper with explicit timeouts and retry logic.

Provides a PlexClient class that wraps plexapi.server.PlexServer with:
- Explicit timeout configuration (no infinite hangs)
- Tenacity retry for connection errors (handles network blips)
- Lazy PlexServer initialization
- Exception translation to Phase 2 hierarchy
"""

import logging
from typing import Any, Optional, Tuple, Type, TYPE_CHECKING

from tenacity import (
    retry,
    retry_if_exception_type,
    wait_exponential_jitter,
    stop_after_attempt,
    before_sleep_log,
)

from plex.exceptions import translate_plex_exception

if TYPE_CHECKING:
    from plexapi.server import PlexServer

logger = logging.getLogger('Stash2Plex.plex.client')


def _get_retriable_exceptions() -> Tuple[Type[Exception], ...]:
    """
    Build tuple of retriable exceptions lazily.

    This avoids importing requests at module load time, which would
    trigger urllib3 and conflict with the project's queue/ module
    shadowing Python's stdlib queue module.
    """
    import requests.exceptions
    return (
        ConnectionError,
        TimeoutError,
        OSError,
        requests.exceptions.ConnectionError,
        requests.exceptions.Timeout,
    )


# Connection errors that warrant immediate retry
# These are network-level failures that may resolve quickly
# Lazily initialized to avoid import issues
RETRIABLE_EXCEPTIONS: Tuple[Type[Exception], ...] = (
    ConnectionError,
    TimeoutError,
    OSError,
)


class PlexClient:
    """
    Wrapper around PlexServer with timeout and retry configuration.

    Provides reliable Plex communication by:
    - Configuring explicit timeouts (no infinite hangs)
    - Retrying connection errors with exponential backoff and jitter
    - Lazy initialization (connection on first use)
    - Exception translation to Phase 2 error hierarchy

    Args:
        url: Plex server URL (e.g., http://192.168.1.100:32400)
        token: Plex authentication token
        connect_timeout: Connection timeout in seconds (default: 5.0)
        read_timeout: Read timeout in seconds (default: 30.0)

    Example:
        >>> from plex.client import PlexClient
        >>> client = PlexClient(
        ...     url="http://plex:32400",
        ...     token="your-token",
        ...     timeout=10
        ... )
        >>> library = client.get_library("Movies")
    """

    # Class-level cache for full retriable exceptions tuple
    _retriable_exceptions: Optional[Tuple[Type[Exception], ...]] = None

    def __init__(
        self,
        url: str,
        token: str,
        connect_timeout: float = 5.0,
        read_timeout: float = 30.0,
    ) -> None:
        self._url = url
        self._token = token
        self._connect_timeout = connect_timeout
        self._read_timeout = read_timeout
        self._server: Optional["PlexServer"] = None

    @classmethod
    def _get_retriable_exceptions(cls) -> Tuple[Type[Exception], ...]:
        """Get full retriable exceptions tuple, including requests exceptions."""
        if cls._retriable_exceptions is None:
            cls._retriable_exceptions = _get_retriable_exceptions()
        return cls._retriable_exceptions

    def _get_server(self) -> "PlexServer":
        """
        Create and return PlexServer connection with retry on network errors.

        Uses tenacity retry for automatic retry on connection errors:
        - 3 attempts maximum
        - Exponential backoff: 100ms initial, 400ms max, with 100ms jitter
        - Logs warning before each retry attempt

        Returns:
            Connected PlexServer instance

        Raises:
            PlexTemporaryError: On connection/timeout errors after all retries
            PlexPermanentError: On authentication failures
        """
        from plexapi.server import PlexServer

        # Get full retriable exceptions including requests types
        retriable = self._get_retriable_exceptions()

        @retry(
            retry=retry_if_exception_type(retriable),
            wait=wait_exponential_jitter(initial=0.1, max=0.4, jitter=0.1),
            stop=stop_after_attempt(3),
            before_sleep=before_sleep_log(logger, logging.WARNING),
            reraise=True,
        )
        def connect():
            try:
                logger.debug(f"Connecting to Plex server at {self._url}")
                server = PlexServer(
                    baseurl=self._url,
                    token=self._token,
                    timeout=self._read_timeout,
                )
                logger.debug(f"Connected to Plex server: {server.friendlyName}")
                return server
            except retriable:
                # Let tenacity handle retry
                raise
            except Exception as exc:
                # Translate other exceptions to our hierarchy
                raise translate_plex_exception(exc) from exc

        return connect()

    @property
    def server(self) -> "PlexServer":
        """
        Get the PlexServer instance, connecting lazily if needed.

        Returns:
            Connected PlexServer instance

        Raises:
            PlexTemporaryError: On connection/timeout errors
            PlexPermanentError: On authentication failures
        """
        if self._server is None:
            self._server = self._get_server()
        return self._server

    def get_library(self, section_name: str) -> Any:
        """
        Get a library section by name.

        Args:
            section_name: Name of the library section (e.g., "Movies", "TV Shows")

        Returns:
            LibrarySection instance

        Raises:
            PlexNotFound: If section doesn't exist
            PlexTemporaryError: On connection errors
        """
        try:
            return self.server.library.section(section_name)
        except Exception as exc:
            raise translate_plex_exception(exc) from exc
