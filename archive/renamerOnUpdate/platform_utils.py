"""Platform-specific utility functions for path and filename handling."""

import re
import sys
from pathlib import Path
from typing import Literal, cast

from pydantic import BaseModel

import log

# Type alias for supported platforms - update here if adding new platforms
type Platform = Literal["windows", "linux", "macos", "freebsd"]


class PlatformLimits(BaseModel):
    """Platform-specific path and filename length limits."""

    max_path_length: int
    max_filename_length: int
    use_bytes: bool


def get_string_length(text: str, use_bytes: bool) -> int:
    """Get the length of a string in bytes or characters.

    Args:
        text: The string to measure
        use_bytes: If True, return byte length (UTF-8 encoded), otherwise character length

    Returns:
        Length of the string in bytes or characters
    """
    if use_bytes:
        return len(text.encode("utf-8"))
    return len(text)


def _normalize_platform(
    target_platform: str | None,
) -> Platform:
    """Normalize platform string to standard format.

    Args:
        target_platform: Platform to target ("windows", "linux", "macos", "freebsd", or None for auto-detect)

    Returns:
        Normalized platform string ("windows", "linux", "macos", or "freebsd")
    """
    if target_platform is None:
        # Auto-detect platform
        if sys.platform == "win32":
            return "windows"
        elif sys.platform == "darwin":
            return "macos"
        elif sys.platform.startswith("freebsd"):
            return "freebsd"
        else:
            # Default to linux for other Unix-like systems
            return "linux"

    # Lowercase the platform string - we know it will be one of the four valid values
    normalized = target_platform.lower()
    return cast(Platform, normalized)


def normalize_platform(
    target_platform: str | None = None,
) -> Platform:
    """Normalize platform string to standard format (public wrapper).

    Args:
        target_platform: Platform to target ("windows", "linux", "macos", "freebsd", or None for auto-detect)

    Returns:
        Normalized platform string ("windows", "linux", "macos", or "freebsd")
    """
    return _normalize_platform(target_platform)


def create_path_from_string(path_str: str, target_platform: Platform) -> Path:
    """Create a Path object from a string, handling Windows paths correctly on any platform.

    Uses PureWindowsPath for Windows paths to ensure proper parsing of drive letters
    and UNC paths, even when running on non-Windows systems.

    Args:
        path_str: Path string (may be Windows, Unix, or UNC path)
        target_platform: Platform to target ("windows", "linux", "macos", "freebsd").
            Must already be normalized (use config_loader.CONFIG.target_platform_normalized).

    Returns:
        Path object with correctly parsed path structure
    """
    from pathlib import Path as PathType
    from pathlib import PureWindowsPath

    # Detect Windows paths:
    # 1. UNC paths: start with \\
    # 2. Windows drive letters: single letter followed by : (with optional path separator or end of string)
    #    Pattern: ^[A-Za-z]: matches C:, D:, etc. (even without separator, like C:file.txt)
    # 3. If target_platform is Windows and path is ambiguous (relative path), treat as Windows
    is_unc_path = path_str.startswith("\\\\")
    is_windows_drive = bool(re.match(r"^[A-Za-z]:", path_str))

    # For ambiguous cases (relative paths without drive letters), use target_platform
    is_relative = (
        not path_str.startswith("/") and not is_unc_path and not is_windows_drive
    )

    is_windows_path = (
        is_unc_path
        or is_windows_drive
        or (is_relative and target_platform == "windows")
    )

    if is_windows_path:
        return PathType(PureWindowsPath(path_str))
    else:
        return PathType(path_str)


def get_platform_limits(target_platform: str | None = None) -> PlatformLimits:
    """Get platform-specific path and filename length limits.

    Args:
        target_platform: Platform to target ("windows", "linux", "macos", "freebsd", or None for auto-detect)

    Returns:
        Dictionary with:
        - max_path_length: Maximum path length
        - max_filename_length: Maximum filename length
        - use_bytes: Whether limits are in bytes (True) or characters (False)
    """
    platform = _normalize_platform(target_platform)

    match platform:
        case "windows":
            return PlatformLimits(
                max_path_length=260,  # MAX_PATH includes full path with filename
                max_filename_length=255,
                use_bytes=False,
            )
        case "linux":
            return PlatformLimits(
                max_path_length=4096,  # PATH_MAX in bytes
                max_filename_length=255,  # NAME_MAX in bytes
                use_bytes=True,
            )
        case "macos":
            return PlatformLimits(
                max_path_length=1024,  # PATH_MAX in bytes (APFS/HFS+)
                max_filename_length=255,  # NAME_MAX in bytes (APFS/HFS+)
                use_bytes=True,
            )
        case "freebsd":
            return PlatformLimits(
                max_path_length=4096,  # PATH_MAX in bytes
                max_filename_length=255,  # NAME_MAX in bytes
                use_bytes=True,
            )
        case _:
            # Default to Windows if unknown platform (most restrictive)
            log.log_warning(
                f"Unknown platform '{platform}', defaulting to Windows limits"
            )
            return PlatformLimits(
                max_path_length=260,  # MAX_PATH includes full path with filename
                max_filename_length=255,
                use_bytes=False,
            )


def get_illegal_chars(target_platform: str | None = None) -> str:
    """Get platform-specific illegal characters for filenames and path components.

    Args:
        target_platform: Platform to target ("windows", "linux", "macos", "freebsd", or None for auto-detect)

    Returns:
        String containing illegal characters for the target platform
    """
    platform = _normalize_platform(target_platform)

    match platform:
        case "windows":
            # Windows illegal characters: \ / : " * ? < > |
            return '\\/:"*?<>|'
        case "macos":
            # macOS: forward slash (path separator) and colon (legacy path separator)
            return "/:"
        case "linux":
            # Linux: only forward slash is illegal in filenames/path components
            # (backslash is allowed on Unix-like systems)
            return "/"
        case "freebsd":
            # FreeBSD: only forward slash is illegal in filenames/path components
            # (backslash is allowed on Unix-like systems)
            return "/"
        case _:
            # Default to Windows if unknown platform (most restrictive)
            return '\\/:"*?<>|'


def get_windows_reserved_names() -> list[str]:
    """Get Windows reserved device names.

    Returns:
        List of reserved device names (case-insensitive)
    """
    return [
        "CON",
        "PRN",
        "AUX",
        "NUL",
        "COM1",
        "COM2",
        "COM3",
        "COM4",
        "COM5",
        "COM6",
        "COM7",
        "COM8",
        "COM9",
        "LPT1",
        "LPT2",
        "LPT3",
        "LPT4",
        "LPT5",
        "LPT6",
        "LPT7",
        "LPT8",
        "LPT9",
    ]


def paths_equal(
    path1: str | object,
    path2: str | object,
    target_platform: Platform,
) -> bool:
    """Compare two paths for equality, handling case-insensitivity on Windows.

    On Windows (or when targeting Windows), paths are compared case-insensitively
    because the filesystem is case-insensitive. On other platforms, paths are
    compared case-sensitively.

    Uses Path.samefile() when both paths exist (most accurate), otherwise falls back
    to string comparison with case-insensitive handling on Windows.

    Args:
        path1: First path (Path object or string)
        path2: Second path (Path object or string)
        target_platform: Platform to target ("windows", "linux", "macos", "freebsd").
            Must already be normalized (use config_loader.CONFIG.target_platform_normalized).

    Returns:
        True if paths are equal (case-insensitive on Windows, case-sensitive otherwise)
    """
    from pathlib import Path as PathType

    # Convert to Path objects if needed
    if isinstance(path1, PathType):
        path1_obj = path1
    else:
        path1_obj = create_path_from_string(str(path1), target_platform)

    if isinstance(path2, PathType):
        path2_obj = path2
    else:
        path2_obj = create_path_from_string(str(path2), target_platform)

    # If both paths exist, use Path.samefile() which handles case-insensitivity on Windows
    # This is the most accurate method as it uses the filesystem's actual comparison
    try:
        if path1_obj.exists() and path2_obj.exists():
            return path1_obj.samefile(path2_obj)
    except (OSError, ValueError):
        # samefile() can raise OSError if paths don't exist or ValueError for invalid paths
        # Fall through to string comparison
        pass

    # Fall back to string comparison
    str_path1 = str(path1_obj)
    str_path2 = str(path2_obj)

    # On Windows, compare case-insensitively
    if target_platform == "windows":
        return str_path1.casefold() == str_path2.casefold()

    # On other platforms, compare case-sensitively
    return str_path1 == str_path2
