"""
Configuration validation for Stash2Plex.

Provides pydantic v2 models for validating plugin configuration
with fail-fast behavior and sensible defaults.
"""

from pydantic import BaseModel, Field, field_validator, ValidationError
from typing import Optional
import logging

log = logging.getLogger('Stash2Plex.config')


class Stash2PlexConfig(BaseModel):
    """
    Stash2Plex plugin configuration with validation.

    Required:
        plex_url: Plex server URL (e.g., http://192.168.1.100:32400)
        plex_token: Plex authentication token

    Optional tunables:
        enabled: Master on/off switch (default: True)
        max_retries: Retry attempts before DLQ (default: 5, range: 1-20)
        poll_interval: Worker poll interval in seconds (default: 1.0, range: 0.1-60.0)
        strict_mode: If True, reject invalid metadata; if False, sanitize and continue (default: False)
        plex_connect_timeout: Connection timeout in seconds (default: 5.0, range: 1.0-30.0)
        plex_read_timeout: Read timeout in seconds (default: 30.0, range: 5.0-120.0)
        dlq_retention_days: Days to retain failed jobs in DLQ (default: 30, range: 1-365)
    """

    # Required fields
    plex_url: str
    plex_token: str

    # Optional tunables with defaults
    enabled: bool = True
    max_retries: int = Field(default=5, ge=1, le=20)
    poll_interval: float = Field(default=1.0, ge=0.1, le=60.0)
    strict_mode: bool = False

    # Plex connection timeouts (in seconds)
    plex_connect_timeout: float = Field(default=5.0, ge=1.0, le=30.0)
    plex_read_timeout: float = Field(default=30.0, ge=5.0, le=120.0)

    # DLQ settings
    dlq_retention_days: int = Field(default=30, ge=1, le=365)

    # Plex library to sync (required - e.g., "Adult", "Movies")
    plex_library: Optional[str] = Field(
        default=None,
        description="Name of Plex library section to sync. If not set, searches all libraries (slow)."
    )

    # Late update detection flags
    strict_matching: bool = Field(
        default=True,
        description="Skip sync on low-confidence matches (safer). False = sync anyway with warning logged."
    )
    preserve_plex_edits: bool = Field(
        default=False,
        description="Preserve manual Plex edits. True = only update empty fields, False = Stash always wins."
    )

    # =========================================================================
    # Field Sync Toggles (all default True = enabled)
    # =========================================================================

    sync_master: bool = Field(
        default=True,
        description="Master toggle to enable/disable all metadata field syncing"
    )
    sync_studio: bool = Field(
        default=True,
        description="Sync studio name from Stash to Plex"
    )
    sync_summary: bool = Field(
        default=True,
        description="Sync summary/details from Stash to Plex"
    )
    sync_tagline: bool = Field(
        default=True,
        description="Sync tagline from Stash to Plex"
    )
    sync_date: bool = Field(
        default=True,
        description="Sync release date from Stash to Plex"
    )
    sync_performers: bool = Field(
        default=True,
        description="Sync performers as Plex actors"
    )
    sync_tags: bool = Field(
        default=True,
        description="Sync tags as Plex genres"
    )
    sync_poster: bool = Field(
        default=True,
        description="Sync poster image from Stash to Plex"
    )
    sync_background: bool = Field(
        default=True,
        description="Sync background/fanart image from Stash to Plex"
    )
    sync_collection: bool = Field(
        default=True,
        description="Add items to Plex collection based on studio name"
    )

    # Stash connection (for fetching images)
    stash_url: Optional[str] = Field(
        default=None,
        description="Stash server URL (extracted from connection)"
    )
    stash_api_key: Optional[str] = Field(
        default=None,
        description="Stash API key for authenticated image fetching"
    )
    stash_session_cookie: Optional[str] = Field(
        default=None,
        description="Stash session cookie for authenticated image fetching"
    )

    @field_validator('plex_url', mode='after')
    @classmethod
    def validate_plex_url(cls, v: str) -> str:
        """Validate plex_url is a valid HTTP/HTTPS URL."""
        if not v:
            raise ValueError('plex_url is required')
        if not v.startswith(('http://', 'https://')):
            raise ValueError('plex_url must start with http:// or https://')
        return v.rstrip('/')  # Normalize: remove trailing slash

    @field_validator('plex_token', mode='after')
    @classmethod
    def validate_plex_token(cls, v: str) -> str:
        """Validate plex_token is present and reasonable length."""
        if not v:
            raise ValueError('plex_token is required')
        if len(v) < 10:
            raise ValueError('plex_token appears invalid (too short)')
        return v

    @field_validator(
        'strict_matching', 'preserve_plex_edits',
        'sync_master', 'sync_studio', 'sync_summary', 'sync_tagline',
        'sync_date', 'sync_performers', 'sync_tags', 'sync_poster',
        'sync_background', 'sync_collection',
        mode='before'
    )
    @classmethod
    def validate_booleans(cls, v):
        """Ensure boolean fields are actual booleans, not truthy strings."""
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            lower = v.lower()
            if lower in ('true', '1', 'yes'):
                return True
            if lower in ('false', '0', 'no'):
                return False
            raise ValueError(f"Invalid boolean value: {v}")
        raise ValueError(f"Expected boolean, got {type(v).__name__}")

    def log_config(self) -> None:
        """Log configuration with masked token for security."""
        if len(self.plex_token) > 8:
            masked = self.plex_token[:4] + '****' + self.plex_token[-4:]
        else:
            masked = '****'
        log.info(
            f"Stash2Plex config: url={self.plex_url}, token={masked}, "
            f"max_retries={self.max_retries}, enabled={self.enabled}, "
            f"strict_mode={self.strict_mode}, "
            f"connect_timeout={self.plex_connect_timeout}s, "
            f"read_timeout={self.plex_read_timeout}s, "
            f"dlq_retention_days={self.dlq_retention_days}, "
            f"strict_matching={self.strict_matching}, "
            f"preserve_plex_edits={self.preserve_plex_edits}"
        )
        # Log field sync toggle summary
        toggles_off = [k.replace('sync_', '') for k in [
            'sync_studio', 'sync_summary', 'sync_tagline', 'sync_date',
            'sync_performers', 'sync_tags', 'sync_poster', 'sync_background', 'sync_collection'
        ] if not getattr(self, k, True)]
        if not self.sync_master:
            log.info("Field sync: MASTER OFF (all fields disabled)")
        elif toggles_off:
            log.info(f"Field sync: enabled except {toggles_off}")
        else:
            log.info("Field sync: all fields enabled")


def validate_config(config_dict: dict) -> tuple[Optional[Stash2PlexConfig], Optional[str]]:
    """
    Validate configuration dictionary and return Stash2PlexConfig or error message.

    Args:
        config_dict: Dictionary containing configuration values

    Returns:
        Tuple of (Stash2PlexConfig, None) on success,
        or (None, error_message) on validation failure
    """
    try:
        config = Stash2PlexConfig(**config_dict)
        return (config, None)
    except ValidationError as e:
        # Extract user-friendly error messages
        errors = []
        for error in e.errors():
            field = '.'.join(str(loc) for loc in error['loc'])
            msg = error['msg']
            errors.append(f"{field}: {msg}")
        error_message = '; '.join(errors)
        return (None, error_message)


# Re-export ValidationError for external use
__all__ = ['Stash2PlexConfig', 'validate_config', 'ValidationError']
