"""
Pydantic metadata validation model for Stash2Plex.

Provides SyncMetadata model with field validation and sanitization
to ensure clean data before enqueueing for Plex sync.
"""

from pydantic import BaseModel, Field, field_validator, ValidationError
from typing import Optional, Any
import logging

from validation.sanitizers import sanitize_for_plex


log = logging.getLogger('Stash2Plex.validation')


class SyncMetadata(BaseModel):
    """
    Validated metadata structure for Plex sync jobs.

    Required fields:
        scene_id: Positive integer identifying the scene in Stash
        title: Non-empty string (1-255 chars) for the scene title

    Optional fields:
        details: Description/summary (max 10000 chars)
        date: Release date string
        rating100: Rating on 0-100 scale
        studio: Studio name (max 255 chars)
        performers: List of performer names
        tags: List of tag names

    All string fields are automatically sanitized via field_validator
    to remove control characters and normalize text.

    Example:
        >>> from validation.metadata import SyncMetadata
        >>> meta = SyncMetadata(
        ...     scene_id=123,
        ...     title="Example Scene",
        ...     studio="Example Studio",
        ...     performers=["Actor One", "Actor Two"]
        ... )
        >>> print(meta.title)
        Example Scene
    """

    # Required fields
    scene_id: int = Field(..., gt=0, description="Stash scene ID (positive integer)")
    title: str = Field(..., min_length=1, max_length=255, description="Scene title")

    # Optional fields
    details: Optional[str] = Field(default=None, max_length=10000, description="Scene description")
    date: Optional[str] = Field(default=None, description="Release date")
    rating100: Optional[int] = Field(default=None, ge=0, le=100, description="Rating 0-100")
    studio: Optional[str] = Field(default=None, max_length=255, description="Studio name")
    performers: Optional[list[str]] = Field(default=None, description="Performer names")
    tags: Optional[list[str]] = Field(default=None, description="Tag names")

    @field_validator('title', mode='before')
    @classmethod
    def sanitize_title(cls, v: Any) -> str:
        """Sanitize title field, ensuring non-empty string."""
        if v is None:
            raise ValueError("title is required")
        if not isinstance(v, str):
            v = str(v)
        original = v
        sanitized = sanitize_for_plex(v, max_length=255)
        if sanitized != original:
            log.debug(f"Sanitized title: '{original[:50]}...' -> '{sanitized[:50]}...'")
        if not sanitized:
            raise ValueError("title cannot be empty after sanitization")
        return sanitized

    @field_validator('details', mode='before')
    @classmethod
    def sanitize_details(cls, v: Any) -> Optional[str]:
        """Sanitize details field."""
        if v is None:
            return None
        if not isinstance(v, str):
            v = str(v)
        original = v
        sanitized = sanitize_for_plex(v, max_length=10000)
        if sanitized != original:
            log.debug(f"Sanitized details: '{original[:50]}...' -> '{sanitized[:50]}...'")
        return sanitized if sanitized else None

    @field_validator('studio', mode='before')
    @classmethod
    def sanitize_studio(cls, v: Any) -> Optional[str]:
        """Sanitize studio field."""
        if v is None:
            return None
        if not isinstance(v, str):
            v = str(v)
        original = v
        sanitized = sanitize_for_plex(v, max_length=255)
        if sanitized != original:
            log.debug(f"Sanitized studio: '{original[:50]}...' -> '{sanitized[:50]}...'")
        return sanitized if sanitized else None

    @field_validator('performers', 'tags', mode='before')
    @classmethod
    def sanitize_string_list(cls, v: Any) -> Optional[list[str]]:
        """Sanitize list of string fields."""
        if v is None:
            return None
        if not isinstance(v, list):
            return None
        sanitized = [
            sanitize_for_plex(str(item), max_length=255)
            for item in v
            if item
        ]
        # Filter out empty strings after sanitization
        return [s for s in sanitized if s] or None


def validate_metadata(data: dict) -> tuple[Optional[SyncMetadata], Optional[str]]:
    """
    Validate metadata dictionary and return result.

    This helper allows callers to handle validation errors gracefully
    without needing to catch exceptions.

    Args:
        data: Dictionary containing metadata fields

    Returns:
        Tuple of (SyncMetadata, None) on success
        Tuple of (None, error_message) on validation failure
    """
    try:
        model = SyncMetadata(**data)
        return (model, None)
    except ValidationError as e:
        # Extract readable error message
        errors = e.errors()
        if errors:
            first_error = errors[0]
            field = '.'.join(str(loc) for loc in first_error.get('loc', []))
            msg = first_error.get('msg', 'validation error')
            return (None, f"{field}: {msg}")
        return (None, str(e))


# Re-export ValidationError for caller convenience
__all__ = ['SyncMetadata', 'validate_metadata', 'ValidationError']
