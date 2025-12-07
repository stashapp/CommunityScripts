"""Configuration loader that processes and exposes all config values."""

import os
import types
from collections.abc import Callable
from pathlib import Path
from typing import Any, Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    ValidationError,
    computed_field,
    field_validator,
    model_validator,
)

import log
import platform_utils
from platform_utils import Platform, PlatformLimits

try:
    import config
except ImportError:
    log.log_warning(
        "Could not import ROU config file, did you rename the template file to 'config.py'? Defaulting to template config file"
    )
    import renamerOnUpdate_config as config  # type: ignore[no-redef]


# Supported emoji language codes (two-letter ISO codes)
# Single source of truth for both type hints and runtime validation
SUPPORTED_EMOJI_LANGUAGES = frozenset(
    {
        "ar",  # Arabic
        "de",  # German
        "en",  # English
        "es",  # Spanish
        "fa",  # Farsi/Persian
        "fr",  # French
        "id",  # Indonesian
        "it",  # Italian
        "ja",  # Japanese
        "ko",  # Korean
        "pt",  # Portuguese
        "ru",  # Russian
        "tr",  # Turkish
        "zh",  # Simplified Chinese
    }
)


# Pydantic models for complex nested structures
# Note: We validate complex dict structures using field_validators in RenamerConfig
class RenamerConfig(BaseModel):
    """Pydantic model for configuration validation."""

    model_config = ConfigDict(
        extra="ignore",  # Silently ignore unknown fields (e.g., old config values from removed settings)
        populate_by_name=True,  # Allow both field name and alias
    )

    # Dry run configuration
    dry_run: bool = True
    dry_run_append: bool = True
    log_file: str = ""

    # Associated file extensions
    associated_extension: list[str] = Field(
        default_factory=lambda: ["srt", "vtt", "funscript"]
    )

    # Field processing configuration
    field_whitespace_separator: str = Field(
        default="", alias="field_whitespaceSeperator"
    )
    field_replacer: dict[str, dict[str, str] | list[dict[str, str]]] = Field(
        default_factory=dict
    )

    # Filename processing configuration
    filename_as_title: bool = False
    lowercase_filename: bool = Field(default=False, alias="lowercase_Filename")
    titlecase_filename: bool = Field(default=False, alias="titlecase_Filename")
    filename_splitchar: str = " "
    replace_words: dict[str, list[str]] = Field(default_factory=dict)

    # Performer processing configuration
    performer_splitchar: str = " "
    performer_limit: int = 3
    performer_limit_keep: bool = False
    performer_sort: Literal["name", "id", "rating", "favorite", "mix", "mixid"] = "id"
    performer_ignore_gender: list[str] = Field(
        default_factory=list, alias="performer_ignoreGender"
    )
    prevent_title_performer: bool = False

    # Duplicate handling configuration
    duplicate_suffix: list[str] = Field(
        default_factory=lambda: [
            "_1",
            "_2",
            "_3",
            "_4",
            "_5",
            "_6",
            "_7",
            "_8",
            "_9",
            "_10",
        ]
    )

    # Date and duration format configuration
    date_format: str = r"%Y-%m-%d"
    duration_format: str = ""

    # Studio processing configuration
    squeeze_studio_names: bool = False

    # Rating configuration
    rating_display_mode: Literal["integer", "stars", "decimal"] | None = None
    rating_star_precision: Literal["full", "half", "quarter", "tenth"] = "full"
    rating_decimal_places: int = 1
    rating_format: str = "{}"

    # Tag processing configuration
    tags_splitchar: str = " "
    tags_whitelist: list[str] = Field(default_factory=list)
    tags_blacklist: list[str] = Field(default_factory=list)

    # Platform-specific configuration
    target_platform: Literal["windows", "linux", "macos", "freebsd"] | None = None

    # Path processing configuration
    prevent_consecutive: bool = True
    remove_emptyfolder: bool = True
    remove_empty_parent_folders: bool = False
    remove_emptyfolder_ignore_items: list[dict[str, str]] = Field(default_factory=list)

    # Character encoding and emoji configuration
    use_ascii: bool = False
    replace_emoji: bool = False
    # Validated against SUPPORTED_EMOJI_LANGUAGES at runtime
    emoji_language_override: str | None = None
    emoji_delimiter: str | None = None
    # Mutable field for dynamic emoji language (set by initialize_emoji_language())
    emoji_language: str = "en"  # Default, will be updated if replace_emoji is True

    # Field removal order configuration
    order_field: list[str] = Field(
        default_factory=lambda: [
            "$video_codec",
            "$audio_codec",
            "$resolution",
            "tags",
            "rating",
            "$height",
            "$studio_family",
            "$studio",
            "$parent_studio",
            "$performer",
        ]
    )

    # Display configuration
    alt_diff_display: bool = False

    # Path template configuration
    path_noperformer_folder: bool = False
    path_keep_alrperf: bool = True
    p_non_organized: str = ""
    path_one_performer: bool = True
    p_tag_option: dict[str, list[str]] = Field(default_factory=dict)

    # Filename template configuration
    studio_templates: dict[str, str] = Field(default_factory=dict)
    tag_templates: dict[str, str] = Field(default_factory=dict)
    use_default_template: bool = False
    default_template: str = "$date $title"
    gallery_studio_templates: dict[str, str] = Field(default_factory=dict)
    gallery_tag_templates: dict[str, str] = Field(default_factory=dict)
    use_default_gallery_template: bool = False
    default_gallery_template: str = "$date $title"

    # Path template configuration (p_ prefix)
    p_path_templates: dict[str, str] = Field(default_factory=dict)
    p_studio_templates: dict[str, str] = Field(default_factory=dict)
    p_tag_templates: dict[str, str] = Field(default_factory=dict)
    p_use_default_template: bool = False
    p_default_template: str = Field(default_factory=lambda: f"^*{os.sep}$performer")
    p_gallery_path_templates: dict[str, str] = Field(default_factory=dict)
    p_gallery_studio_templates: dict[str, str] = Field(default_factory=dict)
    p_gallery_tag_templates: dict[str, str] = Field(default_factory=dict)
    p_use_default_gallery_template: bool = False
    p_default_gallery_template: str = Field(
        default_factory=lambda: f"^*{os.sep}$performer"
    )

    # Plugin control configuration
    only_organized: bool = False
    enable_hook: bool = False
    batch_size: int = -1

    # Metadata scan configuration
    metadata_scan_timeout: int = 60

    @field_validator("batch_size")
    @classmethod
    def validate_batch_size(cls, v: int) -> int:
        """Validate batch_size is >= -1.

        Args:
            v: Batch size value to validate

        Returns:
            The validated batch size value

        Raises:
            ValueError: If batch_size is less than -1
        """
        if v < -1:
            raise ValueError(
                f"batch_size must be >= -1 (got {v}). Use -1 for all items or a positive number to limit batch size."
            )
        return v

    @field_validator("field_replacer", mode="before")
    @classmethod
    def validate_field_replacer(
        cls, v: Any
    ) -> dict[str, dict[str, str] | list[dict[str, str]]]:
        """Validate field_replacer structure."""
        if not isinstance(v, dict):
            raise ValueError("field_replacer must be a dict")
        result: dict[str, dict[str, str] | list[dict[str, str]]] = {}
        for key, val in v.items():
            if not isinstance(key, str):
                raise ValueError(
                    f"field_replacer keys must be strings, got {type(key)}"
                )
            if isinstance(val, dict):
                # Single replacement
                if not (("replace" in val or "regex" in val) and "with" in val):
                    raise ValueError(
                        f"field_replacer entry '{key}' must have 'replace' or 'regex' and 'with' keys"
                    )
                if not all(isinstance(v, str) for v in val.values()):
                    raise ValueError(
                        f"field_replacer entry '{key}' values must be strings"
                    )
                result[key] = val
            elif isinstance(val, list):
                # Multiple replacements
                validated_list: list[dict[str, str]] = []
                for item in val:
                    if not isinstance(item, dict):
                        raise ValueError(
                            f"field_replacer entry '{key}' list items must be dicts"
                        )
                    if not (("replace" in item or "regex" in item) and "with" in item):
                        raise ValueError(
                            f"field_replacer entry '{key}' list item must have 'replace' or 'regex' and 'with' keys"
                        )
                    if not all(isinstance(v, str) for v in item.values()):
                        raise ValueError(
                            f"field_replacer entry '{key}' list item values must be strings"
                        )
                    validated_list.append(item)
                result[key] = validated_list
            else:
                raise ValueError(
                    f"field_replacer entry '{key}' must be dict or list, got {type(val)}"
                )
        return result

    @field_validator("replace_words", mode="before")
    @classmethod
    def validate_replace_words(cls, v: Any) -> dict[str, list[str]]:
        """Validate replace_words structure."""
        if not isinstance(v, dict):
            raise ValueError("replace_words must be a dict")
        result: dict[str, list[str]] = {}
        for key, val in v.items():
            if not isinstance(key, str):
                raise ValueError(f"replace_words keys must be strings, got {type(key)}")
            if not isinstance(val, list):
                raise ValueError(
                    f"replace_words entry '{key}' must be a list, got {type(val)}"
                )
            if len(val) < 1 or len(val) > 2:
                raise ValueError(
                    f"replace_words entry '{key}' must have 1-2 elements: "
                    f"[replacement_string] or [replacement_string, system]. "
                    f"Got {len(val)} element(s). "
                    f"System can be 'word', 'regex', or 'any' (defaults to 'word' if omitted)."
                )
            if not all(isinstance(item, str) for item in val):
                raise ValueError(
                    f"replace_words entry '{key}' list items must be strings"
                )
            result[key] = val
        return result

    @field_validator("emoji_language_override")
    @classmethod
    def validate_emoji_language(cls, v: str | None) -> str | None:
        """Validate emoji_language_override against supported languages."""
        if v is not None and v not in SUPPORTED_EMOJI_LANGUAGES:
            supported = ", ".join(sorted(SUPPORTED_EMOJI_LANGUAGES))
            raise ValueError(
                f"emoji_language_override must be one of: {supported}. Got: {v}"
            )
        return v

    @field_validator("performer_limit")
    @classmethod
    def validate_performer_limit(cls, v: int) -> int:
        """Validate performer_limit is positive.

        Args:
            v: Performer limit value to validate

        Returns:
            The validated performer limit value

        Raises:
            ValueError: If performer_limit is not positive
        """
        if v <= 0:
            raise ValueError(f"performer_limit must be positive, got {v}")
        return v

    @field_validator("p_tag_option", mode="before")
    @classmethod
    def validate_p_tag_option(cls, v: Any) -> dict[str, list[str]]:
        """Validate p_tag_option structure."""
        if not isinstance(v, dict):
            raise ValueError("p_tag_option must be a dict")
        result: dict[str, list[str]] = {}
        for key, val in v.items():
            if not isinstance(key, str):
                raise ValueError(f"p_tag_option keys must be strings, got {type(key)}")
            if not isinstance(val, list):
                raise ValueError(
                    f"p_tag_option entry '{key}' must be a list, got {type(val)}"
                )
            if not all(isinstance(item, str) for item in val):
                raise ValueError(
                    f"p_tag_option entry '{key}' list items must be strings"
                )
            result[key] = val
        return result

    @field_validator("remove_emptyfolder_ignore_items", mode="before")
    @classmethod
    def validate_remove_emptyfolder_ignore_items(cls, v: Any) -> list[dict[str, str]]:
        """Validate remove_emptyfolder_ignore_items structure."""
        if not isinstance(v, list):
            raise ValueError(
                f"remove_emptyfolder_ignore_items must be a list, got {type(v).__name__}"
            )
        validated_list: list[dict[str, str]] = []
        for item in v:
            if not isinstance(item, dict):
                raise ValueError(
                    f"remove_emptyfolder_ignore_items list items must be dicts, got {type(item).__name__}"
                )
            if not (("name" in item or "regex" in item) and len(item) == 1):
                raise ValueError(
                    "remove_emptyfolder_ignore_items list items must have exactly one of 'name' or 'regex' key"
                )
            if not all(isinstance(val, str) for val in item.values()):
                raise ValueError(
                    "remove_emptyfolder_ignore_items list item values must be strings"
                )
            validated_list.append(item)
        return validated_list

    @field_validator(
        "studio_templates",
        "tag_templates",
        "gallery_studio_templates",
        "gallery_tag_templates",
        "p_path_templates",
        "p_studio_templates",
        "p_tag_templates",
        "p_gallery_path_templates",
        "p_gallery_studio_templates",
        "p_gallery_tag_templates",
        mode="before",
    )
    @classmethod
    def validate_template_dict(cls, v: Any) -> dict[str, str]:
        """Validate template dict structures."""
        if not isinstance(v, dict):
            raise ValueError("Template dict must be a dict")
        result: dict[str, str] = {}
        for key, val in v.items():
            if not isinstance(key, str):
                raise ValueError(f"Template dict keys must be strings, got {type(key)}")
            if not isinstance(val, str):
                raise ValueError(
                    f"Template dict entry '{key}' must be a string, got {type(val)}"
                )
            result[key] = val
        return result

    @model_validator(mode="after")
    def validate_remove_empty_parent_folders_dependency(self) -> "RenamerConfig":
        """Validate that remove_empty_parent_folders requires remove_emptyfolder.

        Raises:
            ValueError: If remove_empty_parent_folders is True but remove_emptyfolder is False
        """
        if self.remove_empty_parent_folders and not self.remove_emptyfolder:
            raise ValueError(
                "remove_empty_parent_folders requires remove_emptyfolder to be enabled. "
                "Set remove_emptyfolder = True to use remove_empty_parent_folders."
            )
        return self

    # Computed fields for derived configuration values
    @computed_field  # type: ignore[prop-decorator]
    @property
    def dry_run_file(self) -> Path | None:
        """Compute dry run file path from log_file."""
        if self.log_file:
            return Path(self.log_file).parent / "renamerOnUpdate_dryrun.txt"
        return None

    @computed_field  # type: ignore[prop-decorator]
    @property
    def target_platform_normalized(self) -> Platform:
        """Get normalized platform name."""
        return platform_utils.normalize_platform(self.target_platform)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def platform_limits(self) -> PlatformLimits:
        """Get platform-specific limits."""
        return platform_utils.get_platform_limits(self.target_platform)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def illegal_chars(self) -> str:
        """Get platform-specific illegal characters."""
        return platform_utils.get_illegal_chars(self.target_platform)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def windows_reserved_names(self) -> list[str] | None:
        """Get Windows reserved names if on Windows."""
        if self.target_platform_normalized == "windows":
            return platform_utils.get_windows_reserved_names()
        return None


def _load_config_with_validation() -> RenamerConfig:
    """Load and validate configuration using Pydantic.

    Returns:
        Validated RenamerConfig instance with defaults applied for invalid values.
    """
    # Get all config attributes (excluding imported modules and private attributes)
    config_dict: dict[str, Any] = {}
    for attr_name in dir(config):
        if not attr_name.startswith("_"):
            attr_value = getattr(config, attr_name)
            # Skip imported modules (like 'os', 'pathlib', etc.)
            if not isinstance(attr_value, types.ModuleType):
                config_dict[attr_name] = attr_value

    try:
        return RenamerConfig(**config_dict)
    except ValidationError as e:
        # Handle validation errors (type mismatches, etc.)
        log.log_warning(
            f"Configuration validation failed: {e}. Attempting to use defaults for invalid fields."
        )
        # Create config with defaults, catching individual field errors
        try:
            # Retry with lenient validation (allows type coercion) as a fallback
            # strict=False allows coercion (e.g., "123" -> 123) instead of failing
            return RenamerConfig.model_validate(config_dict, strict=False)
        except ValidationError as e2:
            # If that fails, create with defaults only
            log.log_warning(
                f"Could not validate configuration: {e2}. Using all default values."
            )
            return RenamerConfig()


# Load and validate configuration
CONFIG = _load_config_with_validation()

# Handle dry run file deletion side effect
if CONFIG.dry_run and CONFIG.dry_run_file:
    if not CONFIG.dry_run_append and CONFIG.dry_run_file.exists():
        CONFIG.dry_run_file.unlink()
    log.log_info("Dry mode on")

# Expose config module for config_edit function
CONFIG_MODULE = config


def initialize_emoji_language(get_stash_language_func: Callable[[], str]) -> None:
    """Initialize CONFIG.emoji_language using the provided function to get Stash language.

    This should be called after GraphQL client is set up, since get_stash_language
    requires GraphQL access.

    Args:
        get_stash_language_func: Function that returns the Stash interface language
            (e.g., "en-US"). Will be normalized to a two-letter code.
    """
    if CONFIG.replace_emoji:
        if CONFIG.emoji_language_override:
            # Already validated by Pydantic as a valid two-letter code
            CONFIG.emoji_language = CONFIG.emoji_language_override
        else:
            # Extract two-letter code from locale (e.g., "en-US" -> "en")
            # and validate against supported languages
            stash_lang = get_stash_language_func()
            lang_code = stash_lang.split("-")[0].lower() if stash_lang else "en"
            CONFIG.emoji_language = (
                lang_code if lang_code in SUPPORTED_EMOJI_LANGUAGES else "en"
            )
