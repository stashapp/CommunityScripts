"""Logging module for plugin messages and file operations."""

import sys
from pathlib import Path

import config_loader
from template_processing import FileData

# Log messages sent from a plugin instance are transmitted via stderr and are
# encoded with a prefix consisting of special character SOH, then the log
# level (one of t, d, i, w, e, or p - corresponding to trace, debug, info,
# warning, error and progress levels respectively), then special character
# STX.
#
# The log_trace, log_debug, log_info, log_warning, and log_error methods, and their equivalent
# formatted methods are intended for use by plugin instances to transmit log
# messages. The log_progress method is also intended for sending progress data.
#


def __prefix(level_char: bytes) -> str:
    start_level_char = b"\x01"
    end_level_char = b"\x02"

    ret = start_level_char + level_char + end_level_char
    return ret.decode()


def __log(level_char: bytes, s: str) -> None:
    if level_char == b"":
        return

    print(__prefix(level_char) + s + "\n", file=sys.stderr, flush=True)


def log_trace(s: str) -> None:
    """Log a trace-level message."""
    __log(b"t", s)


def log_debug(s: str) -> None:
    """Log a debug-level message."""
    __log(b"d", s)


def log_info(s: str) -> None:
    """Log an info-level message."""
    __log(b"i", s)


def log_warning(s: str) -> None:
    """Log a warning-level message."""
    __log(b"w", s)


def log_error(s: str) -> None:
    """Log an error-level message."""
    __log(b"e", s)


def log_progress(p: float) -> None:
    """Log a progress value (0.0 to 1.0)."""
    progress = min(max(0, p), 1)
    __log(b"p", str(progress))


def write_rename_log(
    item_id: str | None,
    current_path: Path,
    new_path: Path,
    file_data: FileData,
    is_folder: bool = False,
) -> None:
    """Write rename operation to logfile.

    Args:
        item_id: Scene ID or gallery ID for logging
        current_path: Original path
        new_path: New path
        file_data: FileData dataclass (for extracting fingerprints)
        is_folder: True if this is a folder (no fingerprints)
    """
    if not config_loader.CONFIG.log_file:
        return

    try:
        # Extract oshash from file fingerprints (only for files, not folders)
        oshash = ""
        if not is_folder and file_data.file:
            fingerprints = file_data.file.fingerprints
            for fp in fingerprints:
                if fp.type == "oshash":
                    oshash = fp.value or ""
                    break

        with open(config_loader.CONFIG.log_file, "a", encoding="utf-8") as f:
            f.write(f"{item_id or 'unknown'}|{current_path}|{new_path}|{oshash}\n")
    except OSError as err:
        raise OSError(
            f"Error writing to logfile ({config_loader.CONFIG.log_file}): {err}"
        ) from err


def write_dry_run_log(
    item_id: str | None,
    current_path: Path,
    new_path: Path | None = None,
    failed: bool = False,
    option_dryrun: bool = False,
) -> None:
    """Write dry-run operation to dry-run logfile.

    Args:
        item_id: Scene ID or gallery ID for logging
        current_path: Original path
        new_path: New path (None for failures)
        failed: True if the operation failed
        option_dryrun: True if dry-run was activated by option
    """
    if (
        not (config_loader.CONFIG.dry_run or option_dryrun)
        or not config_loader.CONFIG.log_file
        or not config_loader.CONFIG.dry_run_file
    ):
        return

    try:
        with open(config_loader.CONFIG.dry_run_file, "a", encoding="utf-8") as f:
            if failed:
                f.write(f"[FAILED] {item_id or 'unknown'}|{current_path}\n")
            else:
                f.write(f"{item_id or 'unknown'}|{current_path}|{new_path}\n")
    except OSError as err:
        log_error(
            f"Error writing to dry-run logfile ({config_loader.CONFIG.dry_run_file}): {err}"
        )
