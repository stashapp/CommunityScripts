"""Rename operations for scenes and galleries."""

import difflib
import os
import re
import shutil
from pathlib import Path
from typing import Any, Literal

import config_loader
import log
import platform_utils
import stash_graphql
import template_processing
from stash_graphql_models import FindFilesResponse
from template_processing import FileData, ItemInformation, Template


def _find_diff_text(a: str, b: str) -> None:
    """Display a diff between two strings, showing added and removed characters.

    Args:
        a: Original string
        b: New string
    """
    addi = minus = stay = ""
    minus_ = addi_ = 0
    for _, s in enumerate(difflib.ndiff(a, b)):
        if s[0] == " ":
            stay += s[-1]
            minus += "*"
            addi += "*"
        elif s[0] == "-":
            minus += s[-1]
            minus_ += 1
        elif s[0] == "+":
            addi += s[-1]
            addi_ += 1
    if minus_ > 20 or addi_ > 20:
        log.log_debug(f"Diff Checker: +{addi_}; -{minus_};")
        log.log_debug(f"OLD: {a}")
        log.log_debug(f"NEW: {b}")
    else:
        log.log_debug(
            f"Original: {a}\n- Charac: {minus}\n+ Charac: {addi}\n  Result: {b}"
        )


def _path_in_set(
    path_str: str, path_set: set[str], target_platform: str | None
) -> bool:
    """Check if a path string is in a set of path strings, handling case-insensitivity on Windows.

    Args:
        path_str: Path string to check
        path_set: Set of path strings to check against
        target_platform: Platform to target ("windows", "linux", "macos", or None for auto-detect)

    Returns:
        True if path_str is in path_set (case-insensitive on Windows, case-sensitive otherwise)
    """
    platform = platform_utils.normalize_platform(target_platform)

    # On Windows, compare case-insensitively
    if platform == "windows":
        path_str_folded = path_str.casefold()
        return any(path_str_folded == p.casefold() for p in path_set)

    # On other platforms, compare case-sensitively
    return path_str in path_set


def _build_duplicate_check_regex(base_path: Path, suffixes: list[str]) -> str:
    r"""Build regex pattern to match base path with any suffix variation.

    Args:
        base_path: Base file path without suffix (e.g., /dir/movie.mp4)
        suffixes: List of suffix strings to check (e.g., ["_1", "_2", "_3"])

    Returns:
        Regex pattern that matches the base path with or without any suffix
        Example: ^/dir/movie(_1|_2|_3)?\.mp4$ or ^C:\\dir\\movie(_1|_2|_3)?\.mp4$ on Windows
    """
    # Split path into directory, stem, and extension
    directory = str(base_path.parent)
    stem = base_path.stem
    ext = base_path.suffix

    # Escape all components for regex safety (handles special chars like ()[].*+?)
    # re.escape handles platform separators: / on Unix, \ on Windows
    escaped_dir = re.escape(directory)
    escaped_stem = re.escape(stem)
    escaped_ext = re.escape(ext)

    # Get platform-appropriate path separator and escape it for regex
    sep = re.escape(os.sep)

    if suffixes:
        # Escape each suffix and join with | (regex OR)
        escaped_suffixes = "|".join(re.escape(s) for s in suffixes)
        # Pattern matches base path with optional suffix
        pattern = (
            f"^{escaped_dir}{sep}{escaped_stem}({escaped_suffixes})?{escaped_ext}$"
        )
    else:
        # No suffixes, just match the base path exactly
        pattern = f"^{escaped_dir}{sep}{escaped_stem}{escaped_ext}$"

    return pattern


def _matches_ignore_pattern(item_name: str, ignore_pattern: dict[str, str]) -> bool:
    """Check if an item name matches an ignore pattern.

    Args:
        item_name: Name of the file/folder to check
        ignore_pattern: Dict with either "name" key for exact match, or "regex" key for pattern match

    Returns:
        True if the item matches the pattern, False otherwise
    """
    match ignore_pattern:
        case {"name": name}:
            # Simple string match
            return item_name == name
        case {"regex": pattern}:
            # Regex pattern match
            try:
                return bool(re.match(pattern, item_name))
            except re.error as err:
                log.log_warning(
                    f"Invalid regex pattern in remove_emptyfolder_ignore_items: {pattern}. Error: {err}"
                )
                return False
        case _:
            return False


def _is_folder_empty(folder_path: Path) -> bool:
    """Check if a folder is empty, optionally ignoring specific items.

    Args:
        folder_path: Path to the folder to check

    Returns:
        True if the folder is empty (or only contains ignored items), False otherwise
    """
    dir_contents = list(folder_path.iterdir())
    if not dir_contents:
        return True

    if config_loader.CONFIG.remove_emptyfolder_ignore_items:
        # Check if directory only contains ignored items
        is_empty = all(
            any(
                _matches_ignore_pattern(item.name, pattern)
                for pattern in config_loader.CONFIG.remove_emptyfolder_ignore_items
            )
            for item in dir_contents
        )
        if is_empty:
            # Remove ignored items before removing the folder
            for item in dir_contents:
                try:
                    if item.is_file():
                        item.unlink()
                        log.log_debug(f"Removed ignored file: {item}")
                    elif item.is_dir():
                        # Remove ignored directories completely, regardless of contents
                        shutil.rmtree(item)
                        log.log_debug(
                            f"Removed ignored folder (and all contents): {item}"
                        )
                except (OSError, PermissionError) as err:
                    log.log_warning(f"Failed to remove ignored item {item}: {err}")
            return True

    return False


def _remove_empty_folders(current_path: Path) -> None:
    """Remove empty parent directories after moving a file/folder.

    Args:
        current_path: Path of the moved file/folder (old location)
    """
    if not config_loader.CONFIG.remove_emptyfolder:
        return

    current_dir = current_path.parent

    # Remove immediate parent folder if empty
    if current_dir.exists() and _is_folder_empty(current_dir):
        try:
            log.log_info(f"Removing empty folder ({current_dir})")
            current_dir.rmdir()
            current_dir = current_dir.parent
        except (OSError, PermissionError) as err:
            log.log_warning(f"Failed to delete empty folder {current_dir}: {err}")
            return

    # If recursive parent folder removal is not enabled, stop here
    if not config_loader.CONFIG.remove_empty_parent_folders:
        return

    # Determine the topmost directory in the path (first directory component)
    # For absolute paths: root + first directory (e.g., /tank)
    # For relative paths: first directory component (e.g., library)
    path_parts = current_path.parts
    if current_path.is_absolute():
        # For absolute paths, topmost directory is root + first part
        # e.g., /tank/stash/library/... -> topmost is /tank
        if len(path_parts) > 1:
            # Root is parts[0], first dir is parts[1], so topmost is root/parts[1]
            # Use helper to ensure Windows paths are parsed correctly
            topmost_dir = (
                platform_utils.create_path_from_string(
                    path_parts[0], config_loader.CONFIG.target_platform_normalized
                )
                / path_parts[1]
            )
        else:
            # Only root or file directly in root, don't remove anything
            topmost_dir = current_dir
    else:
        # For relative paths, topmost directory is the first component
        if path_parts:
            # Use helper to ensure Windows paths are parsed correctly
            topmost_dir = platform_utils.create_path_from_string(
                path_parts[0], config_loader.CONFIG.target_platform_normalized
            )
        else:
            # Empty path, don't remove anything
            topmost_dir = current_dir

    # Remove empty parent directories recursively up to the topmost directory
    while current_dir.exists() and current_dir != topmost_dir:
        try:
            if _is_folder_empty(current_dir):
                log.log_info(f"Removing empty folder ({current_dir})")
                parent_dir = current_dir.parent
                current_dir.rmdir()
                if parent_dir == current_dir:
                    break
                current_dir = parent_dir
            else:
                break
        except (OSError, PermissionError) as err:
            log.log_warning(f"Failed to delete empty folder {current_dir}: {err}")
            break


def _find_available_suffix_index(
    base_path: Path, item_id: str, suffixes: list[str], is_folder: bool
) -> int:
    """Find the index of the first available duplicate suffix for a path.

    Checks if the base path or any path with a suffix is available (not a duplicate).
    For folders: Checks filesystem directly using Path.exists() since Stash doesn't
    remove deleted folders from its database, causing false positives with GraphQL.
    For files: Uses GraphQL FindFiles query to check database for duplicates.

    Works for both filename template renames (with suffixes) and path-only renames
    (without suffixes).

    Args:
        base_path: Base file/folder path to check (e.g., /dir/movie.mp4 or /dir/folder)
        item_id: Current item ID to exclude from duplicate check (only used for files)
        suffixes: Optional list of suffix strings to try (e.g., ["_1", "_2", "_3"]).
                  Defaults to empty list for path-only duplicate checking.
        is_folder: If True, check folders using filesystem; if False, check files using GraphQL

    Returns:
        -1 if base path is available (no suffix needed)
        0 to len(suffixes)-1 for first available suffix index
        len(suffixes) if all paths/suffixes are taken (caller should handle field removal)
    """
    if is_folder:
        # Check folders using filesystem (Stash doesn't remove deleted folders from DB)
        # Check if base path (no suffix) is available
        if not base_path.exists():
            return -1

        # Check each suffix in order
        for idx, suffix in enumerate(suffixes):
            # Construct path with this suffix
            path_with_suffix = base_path.parent / (
                base_path.stem + suffix + base_path.suffix
            )
            if not path_with_suffix.exists():
                return idx

        # All suffixes are taken
        return len(suffixes)
    else:
        # Check files using GraphQL FindFiles query
        # Build regex pattern to match all variations at once
        regex_pattern = _build_duplicate_check_regex(base_path, suffixes)

        query = """
        query FindFiles($file_filter: FileFilterType) {
            findFiles(file_filter: $file_filter) {
                files {
                    id
                    path
                }
            }
        }
        """
        variables = {
            "file_filter": {
                "path": {"modifier": "MATCHES_REGEX", "value": regex_pattern}
            },
        }

        result = stash_graphql.call_graphql(query, variables)

        # Validate and extract files from result
        response = FindFilesResponse.model_validate(result)
        items = response.find_files.files

        # Build set of taken paths (excluding current item)
        taken_paths = set()
        for item in items:
            if item.id != item_id:
                taken_paths.add(item.path)

        # Check if base path (no suffix) is available
        # Use case-insensitive comparison on Windows
        base_path_str = str(base_path)
        if not _path_in_set(
            base_path_str, taken_paths, config_loader.CONFIG.target_platform_normalized
        ):
            return -1

        # Check each suffix in order
        for idx, suffix in enumerate(suffixes):
            # Construct path with this suffix
            path_with_suffix = base_path.parent / (
                base_path.stem + suffix + base_path.suffix
            )
            path_with_suffix_str = str(path_with_suffix)
            if not _path_in_set(
                path_with_suffix_str,
                taken_paths,
                config_loader.CONFIG.target_platform_normalized,
            ):
                return idx

        # All suffixes are taken
        return len(suffixes)


def scene_rename(
    current_path: Path,
    new_path: Path,
    file_data: FileData,
    scene_id: str,
) -> None:
    """Rename a scene file and handle associated files.

    Args:
        current_path: Current file path
        new_path: New file path
        file_data: File data dictionary
        scene_id: Scene ID (used for logging)
    """
    # Check file exists using pathlib
    if not current_path.is_file():
        raise FileNotFoundError(
            f"File doesn't exist in your Disk/Drive: {current_path}"
        )

    # file_data.file is always set for scene files
    assert file_data.file is not None

    # Move the file
    move_mutation = """
    mutation MoveFiles($input: MoveFilesInput!) {
        moveFiles(input: $input)
    }
    """

    move_variables = {
        "input": {
            "ids": file_data.file.id,
            "destination_folder": str(new_path.parent),
            "destination_basename": str(new_path.name),
        }
    }

    stash_graphql.call_graphql(move_mutation, move_variables)

    # Check if the move/rename worked correctly
    if not new_path.is_file():
        raise RuntimeError(f"Failed to rename the file: {current_path} -> {new_path}")

    log.log_info(f"File Renamed! ({current_path} -> {new_path})")

    log.write_rename_log(scene_id, current_path, new_path, file_data, is_folder=False)
    _remove_empty_folders(current_path)


def associated_rename(scene_id: str, current_path: Path, new_path: Path) -> None:
    """Rename associated files (e.g., .nfo, .srt) when a scene is renamed.

    Args:
        scene_id: Scene ID for logging purposes
        current_path: Current path of the scene file
        new_path: New path of the scene file
    """
    if config_loader.CONFIG.associated_extension:
        for ext in config_loader.CONFIG.associated_extension:
            p = current_path.with_suffix(f".{ext}")
            p_new = new_path.with_suffix(f".{ext}")
            if p.is_file():
                try:
                    shutil.move(p, p_new)
                except (OSError, PermissionError, FileNotFoundError) as err:
                    log.log_error(
                        f"Something prevents renaming this file '{p}' - err: {err}"
                    )
                    continue
            if p_new.is_file():
                log.log_info(f"[OS] Associate file renamed ({p_new})")
                if config_loader.CONFIG.log_file:
                    try:
                        with open(
                            config_loader.CONFIG.log_file, "a", encoding="utf-8"
                        ) as f:
                            f.write(f"{scene_id}|{p}|{p_new}\n")
                    except (OSError, PermissionError) as err:
                        shutil.move(p_new, p)
                        log.log_error(
                            f"Restoring the original name, error writing the logfile: {err}"
                        )


class PathValidator:
    """Validates and finds unique paths within length constraints."""

    def __init__(
        self,
        item_info: ItemInformation,
        template: Template,
        file_data: FileData,
        item_index: int,
    ):
        """Initialize the path validator.

        Args:
            item_info: Scene or gallery information
            template: Template dictionary with filename and path
            file_data: File data dictionary
            item_index: Index of the item in the items array
        """
        self.item_info = item_info
        self.template = template
        self.file_data = file_data
        self.item_index = item_index
        self.field_removal_index = 0

    def find_valid_path(self) -> Path | None:
        """Main entry point: find a valid path through iterative refinement.

        Returns:
            The valid path found, or None if no valid path could be found
        """
        # Find a valid path that is unique and within length limits
        log.log_debug("Finding valid path that is unique and within length limits")

        while True:
            new_path = generate_item_path(
                self.item_info, self.template, self.item_index, self.file_data
            )

            result = self._try_validate_path(new_path)
            if result is not None:
                return result

            # Try removing fields if validation failed
            if not self._try_remove_field():
                log.log_error(
                    "Could not find a unique filename within length limit "
                    "after removing all fields"
                )
                return None

    def _try_validate_path(self, base_path: Path) -> Path | None:
        """Try to validate and find a unique path for the current configuration.

        Args:
            base_path: The base path to validate

        Returns:
            Valid path if found, None if validation failed
        """
        # Route based on whether filename template exists:
        # - With filename template: can use suffixes to make path unique (for both files and gallery folders)
        # - Without filename template: suffixes aren't used
        if self.template.filename:
            return self._validate_path_with_filename(base_path)
        else:
            return self._validate_path_without_filename(base_path)

    def _validate_path_with_filename(self, base_path: Path) -> Path | None:
        """Validate path when filename template exists.

        Args:
            base_path: The base path to validate

        Returns:
            Valid path if found, None if validation failed
        """
        # Check for empty filename
        base_filename = template_processing.create_new_filename(
            self.item_info, self.template.filename or "", self.item_index, -1
        )
        if self._is_filename_empty(base_filename):
            return None

        base_path_obj = base_path.parent / base_filename

        # Early return if path unchanged
        if self._is_path_unchanged(base_path_obj):
            return base_path_obj

        # Check length constraints
        if not self._check_filename_length(base_filename):
            return None  # Will trigger field removal

        # Check path length with worst-case suffix
        if not self._check_path_length_with_suffix(base_path_obj, base_filename):
            return None  # Will trigger field removal

        # Try to find unique path with suffixes
        return self._find_unique_path(base_path_obj)

    def _validate_path_without_filename(self, base_path: Path) -> Path | None:
        """Validate path when only path template exists (no filename template).

        Args:
            base_path: The base path to validate

        Returns:
            Valid path if found, None if validation failed
        """
        if self._is_path_unchanged(base_path):
            return base_path

        if not self._check_path_length(base_path):
            return None  # Will trigger field removal

        # Check for duplicates (no filename template, so suffixes aren't used to make path unique)
        duplicate_index = _find_available_suffix_index(
            base_path,
            self.file_data.item_id,
            [],
            self.file_data.type == "gallery_folder",
        )
        if duplicate_index == -1:
            return base_path

        # Duplicate found but no filename template to apply suffixes
        log.log_debug("Duplicate found but no filename template for suffixes")
        return None  # Will trigger field removal

    def _is_filename_empty(self, filename: str) -> bool:
        """Check if generated filename would be empty (only extension).

        Args:
            filename: The filename to check

        Returns:
            True if filename is empty (only extension), False otherwise
        """
        base_path_obj = Path(filename)
        filename_stem = base_path_obj.stem
        is_empty = not filename_stem.strip() or (
            base_path_obj.name == filename_stem and base_path_obj.name.startswith(".")
        )
        if is_empty:
            log.log_warning(
                f"Generated filename would be empty (only extension). "
                f"Skipping rename to keep current filename: {self.file_data.current_path.name}"
            )
        return is_empty

    def _check_filename_length(self, base_filename: str) -> bool:
        """Check if filename with longest suffix fits within limits.

        Args:
            base_filename: The base filename to check

        Returns:
            True if filename fits, False otherwise
        """
        base_path_obj = Path(base_filename)
        longest_suffix = self._get_longest_suffix()
        worst_case = base_path_obj.stem + longest_suffix + base_path_obj.suffix
        length = platform_utils.get_string_length(
            worst_case, config_loader.CONFIG.platform_limits.use_bytes
        )
        max_length = config_loader.CONFIG.platform_limits.max_filename_length
        if length > max_length:
            unit = (
                "bytes" if config_loader.CONFIG.platform_limits.use_bytes else "chars"
            )
            log.log_debug(
                f"Filename too long with max suffix ({length} {unit} > {max_length} {unit})"
            )
            return False
        return True

    def _check_path_length_with_suffix(
        self, base_path: Path, base_filename: str
    ) -> bool:
        """Check if full path with longest suffix fits within limits.

        Args:
            base_path: The base path
            base_filename: The base filename

        Returns:
            True if path fits, False otherwise
        """
        base_path_obj = Path(base_filename)
        longest_suffix = self._get_longest_suffix()
        worst_case_filename = base_path_obj.stem + longest_suffix + base_path_obj.suffix
        worst_case_path = base_path.parent / worst_case_filename
        path_str = str(worst_case_path)
        length = platform_utils.get_string_length(
            path_str, config_loader.CONFIG.platform_limits.use_bytes
        )
        max_length = config_loader.CONFIG.platform_limits.max_path_length
        if length > max_length:
            unit = (
                "bytes" if config_loader.CONFIG.platform_limits.use_bytes else "chars"
            )
            log.log_debug(
                f"Path too long with max suffix ({length} {unit} > {max_length} {unit})"
            )
            return False
        return True

    def _check_path_length(self, path: Path) -> bool:
        """Check if path fits within length limits.

        Args:
            path: The path to check

        Returns:
            True if path fits, False otherwise
        """
        path_str = str(path)
        length = platform_utils.get_string_length(
            path_str, config_loader.CONFIG.platform_limits.use_bytes
        )
        max_length = config_loader.CONFIG.platform_limits.max_path_length
        if length > max_length:
            unit = (
                "bytes" if config_loader.CONFIG.platform_limits.use_bytes else "chars"
            )
            log.log_debug(f"Path too long ({length} {unit} > {max_length} {unit})")
            return False
        return True

    def _is_path_unchanged(self, path: Path) -> bool:
        """Check if generated path equals current path.

        Args:
            path: The path to check

        Returns:
            True if path is unchanged, False otherwise
        """
        if platform_utils.paths_equal(
            path,
            self.file_data.current_path,
            config_loader.CONFIG.target_platform_normalized,
        ):
            log.log_debug("Generated path equals current path - no rename needed")
            return True
        return False

    def _find_unique_path(self, base_path: Path) -> Path | None:
        """Try to find unique path using duplicate suffixes.

        Args:
            base_path: The base path

        Returns:
            Valid path with suffix if found, None if all suffixes exhausted
        """
        duplicate_suffix_index = _find_available_suffix_index(
            base_path,
            self.file_data.item_id,
            config_loader.CONFIG.duplicate_suffix,
            self.file_data.type == "gallery_folder",
        )

        if duplicate_suffix_index < len(config_loader.CONFIG.duplicate_suffix):
            log.log_debug(
                f"Found valid path with suffix index {duplicate_suffix_index}"
            )
            new_filename = template_processing.create_new_filename(
                self.item_info,
                self.template.filename or "",
                self.item_index,
                duplicate_suffix_index,
            )
            return base_path.parent / new_filename

        log.log_debug("All duplicate suffixes exhausted")
        return None  # Will trigger field removal

    def _get_longest_suffix(self) -> str:
        """Get the longest possible duplicate suffix.

        Returns:
            The longest suffix string, or empty string if no suffixes configured
        """
        if not config_loader.CONFIG.duplicate_suffix:
            return ""
        return max(
            config_loader.CONFIG.duplicate_suffix,
            key=lambda s: platform_utils.get_string_length(
                s, config_loader.CONFIG.platform_limits.use_bytes
            ),
        )

    def _try_remove_field(self) -> bool:
        """Try to remove the next field to shorten the path.

        Returns:
            True if a field was removed, False if all fields exhausted
        """
        if self.field_removal_index >= len(config_loader.CONFIG.order_field):
            return False

        removed_field = config_loader.CONFIG.order_field[self.field_removal_index]
        field_name = removed_field.replace("$", "")
        if getattr(self.item_info, field_name, None):
            setattr(self.item_info, field_name, None)
            log.log_warning(
                f"Removed {removed_field} to reduce path length/find unique name"
            )

        self.field_removal_index += 1
        return True


def log_rename_changes(current_path: Path, new_path: Path) -> None:
    """Log what will change during a rename operation.

    Args:
        current_path: Current path of the file/folder
        new_path: New path for the file/folder
    """
    if current_path.parent != new_path.parent:
        log.log_info(
            f"{'Folder' if current_path.is_dir() else 'File'} will be moved to another directory"
        )
        log.log_debug(f"[OLD path] {current_path}")
        log.log_debug(f"[NEW path] {new_path}")

    if current_path.name != new_path.name:
        log.log_info("The filename will be changed")
        if config_loader.CONFIG.alt_diff_display:
            _find_diff_text(current_path.name, new_path.name)
        else:
            log.log_debug(f"[OLD filename] {current_path.name}")
            log.log_debug(f"[NEW filename] {new_path.name}")


def handle_clean_tag_option(
    template: Template,
    item_id: str,
    item_type: Literal["scene", "gallery"],
) -> None:
    """Handle clean_tag option by removing tags after rename.

    Args:
        template: Template dictionary (may contain path with clean_tag option)
        item_id: Scene ID or gallery ID
        item_type: "scene" or "gallery" to determine which GraphQL function to call
    """
    try:
        if template.path and "clean_tag" in template.path.option:
            tag_ids = template.path.opt_details["clean_tag"]
            match item_type:
                case "scene":
                    stash_graphql.graphql_remove_scenes_tag([item_id], tag_ids)
                case "gallery":
                    stash_graphql.graphql_remove_gallery_tag([item_id], tag_ids)
    except RuntimeError as err:
        log.log_error(f"Error trying to remove tag: {err}")


def generate_item_path(
    item_info: ItemInformation,
    template: Template,
    item_index: int,
    file_data: FileData,
    duplicate_suffix_index: int = -1,
) -> Path:
    """Generate path for a file/folder based on template.

    Args:
        item_info: Scene or gallery information dictionary
        template: Template dictionary with filename and path
        item_index: Index of the item in the items array
        file_data: File data dictionary with current_path
        duplicate_suffix_index: Suffix index for duplicate handling (-1 for no suffix)

    Returns:
        Path object for the generated path
    """
    # Generate base filename/path
    if template.filename:
        filename = template_processing.create_new_filename(
            item_info, template.filename, item_index, duplicate_suffix_index
        )
    else:
        filename = file_data.current_path.name

    if template.path:
        directory = template_processing.create_new_path(item_info, item_index)
    else:
        directory = file_data.current_path.parent

    return directory / filename


def gallery_rename(
    current_path: Path,
    new_path: Path,
    file_data: FileData,
    gallery_id: str,
    task_mode: bool = False,
) -> None:
    """Rename a gallery file or folder.

    For folder galleries: Uses filesystem operations (shutil.move) instead of GraphQL
    moveFiles mutation. This is necessary because:
    1. moveFiles updates file pointers in the database but doesn't update the gallery's
       folder_id reference, causing a mismatch where files point to the new folder but
       the gallery still references the old folder ID.
    2. After filesystem move, we trigger a metadata scan to sync Stash's database and
       update the gallery's folder reference.

    For zip galleries: Uses GraphQL moveFiles mutation which works well for single files.

    Args:
        current_path: Current path of the file/folder
        new_path: New path for the file/folder
        file_data: File data dictionary (must contain 'item_id' and 'type')
        gallery_id: Gallery ID for logging
        task_mode: If True, skip waiting for metadata scan to avoid deadlock when running as a task
    """
    # Determine if this is a folder based on type
    is_folder = file_data.type == "gallery_folder"
    item_id = file_data.item_id

    if not item_id:
        raise ValueError("file_data must contain 'item_id'")

    # For folders, check if directory exists
    if is_folder:
        if not current_path.is_dir():
            raise FileNotFoundError(
                f"Folder doesn't exist in your Disk/Drive: {current_path}"
            )
    else:
        # For zip files, check if file exists
        if not current_path.is_file():
            raise FileNotFoundError(
                f"File doesn't exist in your Disk/Drive: {current_path}"
            )

    if is_folder:
        # For folder galleries: use filesystem operations
        # Move the folder using shutil.move for cross-filesystem compatibility
        log.log_debug(f"Moving folder via filesystem: {current_path} -> {new_path}")
        shutil.move(current_path, new_path)

        # Verify the move succeeded
        if not new_path.is_dir():
            raise RuntimeError(
                f"Failed to rename the folder: {current_path} -> {new_path}"
            )
        log.log_info(f"[OS] Folder Renamed! ({current_path} -> {new_path})")

        # Trigger metadata scan to update gallery's folder reference
        # This is necessary because:
        # 1. We moved the folder via filesystem, so Stash's database is out of sync
        # 2. The metadata scan will detect the new folder location and update the
        #    gallery's folder_id reference to point to the new folder
        # 3. As of stash 0.29 there is no way to directly update the gallery's folder_id
        log.log_debug(
            f"Triggering metadata scan on {new_path} to update gallery folder reference"
        )
        try:
            job_id = stash_graphql.graphql_metadata_scan([str(new_path)])
            log.log_debug(f"Metadata scan job started: {job_id}")
            if task_mode:
                # In task mode, don't wait for the scan to avoid deadlock
                # (the scan job will run after the plugin task completes)
                log.log_info(
                    f"Running in task mode - metadata scan {job_id} will run asynchronously"
                )
            elif stash_graphql.has_running_tasks(exclude_job_id=job_id):
                # If there are other tasks running, don't wait to avoid conflicts
                log.log_info(
                    f"Other tasks are running - metadata scan {job_id} will run asynchronously"
                )
            else:
                # In hook mode with no other tasks, wait for the scan to complete
                stash_graphql.wait_for_metadata_scan(job_id)
                log.log_debug("Metadata scan completed successfully")
        except (RuntimeError, TimeoutError) as err:
            log.log_warning(
                f"Metadata scan failed or timed out: {err}. Gallery folder reference may not be updated."
            )
    else:
        # For zip galleries: use GraphQL moveFiles mutation (works well for files)
        move_mutation = """
        mutation MoveFiles($input: MoveFilesInput!) {
            moveFiles(input: $input)
        }
        """
        move_variables: dict[str, Any] = {
            "input": {
                "ids": [item_id],
                "destination_folder": str(new_path.parent),
                "destination_basename": str(new_path.name),
            }
        }

        stash_graphql.call_graphql(move_mutation, move_variables)

        # Verify the move succeeded
        if not new_path.is_file():
            raise RuntimeError(
                f"Failed to rename the file: {current_path} -> {new_path}"
            )
        log.log_info(f"[OS] File Renamed! ({current_path} -> {new_path})")

    log.write_rename_log(
        gallery_id, current_path, new_path, file_data, is_folder=is_folder
    )
    _remove_empty_folders(current_path)
