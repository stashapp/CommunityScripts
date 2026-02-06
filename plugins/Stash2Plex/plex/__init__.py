"""
Plex API client module for Stash2Plex.

This module provides the interface for communicating with Plex servers,
including exception handling, timeout configuration, and retry logic.

Classes:
    PlexClient: Wrapper around PlexServer with timeouts and retry

Exceptions:
    PlexTemporaryError: Retry-able Plex errors (network, timeout, 5xx)
    PlexPermanentError: Non-retry-able Plex errors (auth, bad request)
    PlexNotFound: Item not found in Plex - may appear after library scan

Functions:
    translate_plex_exception: Convert plexapi exceptions to our hierarchy
    find_plex_item_by_path: Find Plex item by file path with fallback strategies
"""

from plex.exceptions import (
    PlexTemporaryError,
    PlexPermanentError,
    PlexNotFound,
    translate_plex_exception,
)
from plex.client import PlexClient
from plex.matcher import find_plex_item_by_path

__all__ = [
    'PlexClient',
    'PlexTemporaryError',
    'PlexPermanentError',
    'PlexNotFound',
    'translate_plex_exception',
    'find_plex_item_by_path',
]
