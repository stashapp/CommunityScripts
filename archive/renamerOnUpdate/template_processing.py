"""Template processing functions for filename and path generation."""

import re
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

import config_loader
import filename_sanitizer
import log
import stash_graphql
from stash_graphql_models import (
    GalleryModel,
    GalleryZipFileModel,
    SceneModel,
    StudioModel,
    TagModel,
    VideoFileModel,
)

# ============================================================================
# Data Models
# ============================================================================


class _TemplateConfig(BaseModel):
    """Template configuration for a specific media type and template type.

    Attributes:
        path_templates: Path templates dict (only for path type, None otherwise)
        studio_templates: Studio templates dict mapping studio names to template strings
        tag_templates: Tag templates dict mapping tag names to template strings
        use_default: Whether to use default template if no match found
        default_template: Default template string to use when use_default is True
    """

    path_templates: dict[str, str] | None = None
    studio_templates: dict[str, str]
    tag_templates: dict[str, str]
    use_default: bool
    default_template: str


class PathTemplate(BaseModel):
    """Path template configuration for scene or gallery.

    Attributes:
        destination: Destination path template string
        option: List of path options (e.g., ["clean_tag"])
        opt_details: Dictionary with option-specific details (e.g., {"clean_tag": [tag_ids]})
    """

    destination: str = ""
    option: list[str] = Field(default_factory=list)
    opt_details: dict[str, list[str]] = Field(default_factory=dict)


class Template(BaseModel):
    """Template model with filename and path templates."""

    filename: str | None = None
    path: PathTemplate | None = None


class FileData(BaseModel):
    """File data for scene files or gallery files/folders."""

    type: Literal["scene_file", "gallery_folder", "gallery_zip_file"]
    file_index: int
    item_id: str
    current_path: Path
    template_path: Path | None = None
    title_override: str | None = None
    performer_path: str | None = None
    duration: str | None = None
    file: VideoFileModel | None = None
    gallery_zip_file: GalleryZipFileModel | None = None


class _BaseItemInformation(BaseModel):
    """Base class for scene and gallery information with common fields."""

    title: str | None = None
    date: str | None = None
    date_format: str | None = None
    year: str | None = None
    rating: str | None = None
    performer: str | None = None
    performer_path: str | None = None
    stashid_performer: str | None = None
    studio: str | None = None
    studio_family: str | None = None
    parent_studio: str | None = None
    studio_hierarchy: list[str] | None = None
    tags: str | None = None
    studio_code: str | None = None
    # Items list
    items: list[FileData] = Field(default_factory=list)
    # Internal field for temporary storage (will be cleaned up)
    performer_list: list[str] | None = None


class SceneInformation(_BaseItemInformation):
    """Scene information extracted from Stash data."""

    scene_id: str
    # Scene-specific fields
    group_title: str | None = None
    group_year: str | None = None
    group_scene: str | None = None
    group_index: int | None = None
    group_hierarchy: list[str] | None = None
    stashid_scene: str | None = None


class GalleryInformation(_BaseItemInformation):
    """Gallery information extracted from Stash data."""

    gallery_id: str


# Type alias for functions that accept either type
ItemInformation = SceneInformation | GalleryInformation


# ============================================================================
# Public API Functions
# ============================================================================


def get_filename_template(
    item: SceneModel | GalleryModel, media_type: Literal["scene", "gallery"]
) -> str | None:
    """Get filename template for a scene or gallery.

    Args:
        item: SceneModel or GalleryModel instance
        media_type: "scene" or "gallery"

    Returns:
        Template string or None

    Raises:
        ValueError: If media_type is not "scene" or "gallery"
    """
    # Get template configuration
    config = _get_template_config(media_type, "filename")

    # Try to find template by studio (traverses full hierarchy)
    template = _find_studio_template(
        item.studio,
        config.studio_templates,
    )

    # Try to find template by tag (overrides studio template)
    if tag_template := _find_tag_template(item.tags, config.tag_templates):
        template = tag_template

    # Apply default if no template found
    if not template and config.use_default:
        log.log_debug(f"[FILENAME] Using default template for {media_type}")
        template = config.default_template

    return template


def get_path_template(
    item: SceneModel | GalleryModel, media_type: Literal["scene", "gallery"]
) -> PathTemplate | None:
    """Get path template for a scene or gallery.

    Args:
        item: SceneModel or GalleryModel instance
        media_type: "scene" or "gallery"

    Returns:
        PathTemplate or None

    Raises:
        ValueError: If media_type is not "scene" or "gallery"
    """
    template = PathTemplate()

    # Get template configuration
    config = _get_template_config(media_type, "path")

    # Get current path - for scenes it's in item.files[0].path, for galleries we need to derive it
    match media_type:
        case "scene":
            # For scenes, get path from first file
            current_path = item.files[0].path if item.files else ""
        case "gallery":
            # For galleries, get path from folder or files
            if isinstance(item, GalleryModel):
                if item.folder:
                    # Folder gallery - we'll need to get the folder path
                    # For now, use empty string as we'll handle this in extract_gallery_info
                    current_path = ""
                elif item.files:
                    # Pydantic ensures files is always a list (never None)
                    current_path = item.files[0].path
                else:
                    current_path = ""
            else:
                current_path = ""

    # Change by Path (only for path templates, checked first)
    if config.path_templates and current_path:
        for match, destination_template in config.path_templates.items():
            if match in current_path:
                template.destination = destination_template
                break

    # Change by Studio (traverses full hierarchy)
    if studio_template := _find_studio_template(
        item.studio,
        config.studio_templates,
    ):
        template.destination = studio_template

    # Change by Tag (overrides studio template)
    if tag_template := _find_tag_template(item.tags, config.tag_templates):
        template.destination = tag_template

    # Tag options (for both scenes and galleries)
    if item.tags and config_loader.CONFIG.p_tag_option:
        for tag in item.tags:
            if config_loader.CONFIG.p_tag_option.get(tag.name):
                opt = config_loader.CONFIG.p_tag_option[tag.name]
                template.option.extend(opt)
                if "clean_tag" in opt:
                    if template.opt_details.get("clean_tag"):
                        template.opt_details["clean_tag"].append(tag.id)
                    else:
                        template.opt_details = {"clean_tag": [tag.id]}

    if not item.organized and config_loader.CONFIG.p_non_organized:
        template.destination = config_loader.CONFIG.p_non_organized

    # Apply default if no destination found
    if not template.destination:
        if config.use_default:
            log.log_debug(f"[PATH] Using default template for {media_type}")
            template.destination = config.default_template
        else:
            # Return None if no template and no default
            return None

    return template


def create_new_filename(
    item_info: ItemInformation,
    template: str,
    item_index: int,
    duplicate_suffix_index: int,
) -> str:
    """Create a new filename from a template.

    Args:
        item_info: Scene or gallery information dataclass
        template: Filename template string
        item_index: Index of the item in the items array
        duplicate_suffix_index: Index for duplicate suffix (-1 for no suffix)

    Returns:
        Complete filename with extension
    """
    file_data = item_info.items[item_index]
    # If duplicate_suffix_index is -1, don't add any suffix
    duplicate_suffix: str = (
        ""
        if duplicate_suffix_index == -1
        else config_loader.CONFIG.duplicate_suffix[duplicate_suffix_index]
    )

    # Process template: field replacement and sanitization
    r, title = _field_replacer(template, item_info, item_index)

    # Handle $title placeholder: remove if empty or None, remove consecutive non-word chars,
    # then replace placeholder with title
    if not title:
        r = r.replace("$title", "")
    r = filename_sanitizer.remove_consecutive_nonword(
        r
    )  # Remove consecutive non-word characters
    if title:
        r = r.replace("$title", title)  # Add title back after processing
    # Strip leading/trailing whitespace that may have been left by empty fields
    r = r.strip()

    # Use centralized sanitization (skip remove_consecutive_nonword since we already did it)
    r = filename_sanitizer.sanitize_filename(
        r,
        replace_words=config_loader.CONFIG.replace_words,
        use_ascii=config_loader.CONFIG.use_ascii,
        lowercase=config_loader.CONFIG.lowercase_filename,
        titlecase=config_loader.CONFIG.titlecase_filename,
        replace_emoji=config_loader.CONFIG.replace_emoji,
        emoji_language=config_loader.CONFIG.emoji_language,
        emoji_delimiter=config_loader.CONFIG.emoji_delimiter,
        skip_consecutive_nonword=True,
        illegal_chars=config_loader.CONFIG.illegal_chars,
        target_platform=config_loader.CONFIG.target_platform_normalized,
        reserved_names=config_loader.CONFIG.windows_reserved_names,
    )

    # Replace spaces with splitchar
    base_filename: str = r.replace(" ", config_loader.CONFIG.filename_splitchar)

    # Return the complete filename with extension
    # Note: Using string concatenation because Path.with_suffix() would treat dots
    # in the filename (e.g., "Big.Buck.Bunny") as part of the suffix to replace
    complete_filename: str = (
        base_filename + duplicate_suffix + file_data.current_path.suffix
    )
    return complete_filename


def create_new_path(item_info: ItemInformation, item_index: int) -> Path:
    """Create a new path from template path information.

    Args:
        item_info: Scene or gallery information dataclass
        item_index: Index of the item in the items array

    Returns:
        New Path object, or empty Path if no template path is available
    """
    # Create the new path
    # Get the template path from file_data
    file_data = item_info.items[item_index]
    template_path = file_data.template_path
    if not template_path:
        return Path()

    path_list = []

    for part in (path_parts := template_path.parts):
        # Preserve root path separators (drive letters on Windows, UNC paths, "/" on Unix) only if first part
        # UNC paths: \\server\share\... (first part starts with \\)
        # Drive letters: C:\... (contains :)
        # Unix root: / (equals /)
        if part == path_parts[0] and (
            ":" in part or part == "/" or part.startswith("\\\\")
        ):
            path_list.append(part)
        elif part == "$studio_hierarchy":
            if not item_info.studio_hierarchy:
                continue
            for p in item_info.studio_hierarchy:
                # Sanitize each hierarchy part
                sanitized = filename_sanitizer.sanitize_path_part(
                    p,
                    replace_words=config_loader.CONFIG.replace_words,
                    use_ascii=config_loader.CONFIG.use_ascii,
                    replace_emoji=config_loader.CONFIG.replace_emoji,
                    emoji_language=config_loader.CONFIG.emoji_language,
                    emoji_delimiter=config_loader.CONFIG.emoji_delimiter,
                    illegal_chars=config_loader.CONFIG.illegal_chars,
                    target_platform=config_loader.CONFIG.target_platform_normalized,
                    reserved_names=config_loader.CONFIG.windows_reserved_names,
                )
                path_list.append(sanitized)
        elif part == "$group_hierarchy":
            # group_hierarchy is only available for scenes
            if isinstance(item_info, SceneInformation) and item_info.group_hierarchy:
                for p in item_info.group_hierarchy:
                    # Sanitize each hierarchy part
                    sanitized = filename_sanitizer.sanitize_path_part(
                        p,
                        replace_words=config_loader.CONFIG.replace_words,
                        use_ascii=config_loader.CONFIG.use_ascii,
                        replace_emoji=config_loader.CONFIG.replace_emoji,
                        emoji_language=config_loader.CONFIG.emoji_language,
                        emoji_delimiter=config_loader.CONFIG.emoji_delimiter,
                        illegal_chars=config_loader.CONFIG.illegal_chars,
                        target_platform=config_loader.CONFIG.target_platform_normalized,
                        reserved_names=config_loader.CONFIG.windows_reserved_names,
                    )
                    path_list.append(sanitized)
        else:
            # Process template part: replace $performer with $performer_path, do field replacement
            part_query = part.replace("$performer", "$performer_path")
            path_part, title = _field_replacer(part_query, item_info, item_index)

            # Handle $title placeholder: remove if empty or None, clean up template,
            # then replace placeholder with title
            if not title:
                path_part = path_part.replace("$title", "")
            path_part = filename_sanitizer.remove_consecutive_nonword(path_part)
            if title:
                path_part = path_part.replace("$title", title)
            # Strip leading/trailing whitespace that may have been left by empty fields
            path_part = path_part.strip()

            # Sanitize the path part (includes emoji replacement if enabled)
            sanitized = filename_sanitizer.sanitize_path_part(
                path_part,
                replace_words=config_loader.CONFIG.replace_words,
                use_ascii=config_loader.CONFIG.use_ascii,
                replace_emoji=config_loader.CONFIG.replace_emoji,
                emoji_language=config_loader.CONFIG.emoji_language,
                emoji_delimiter=config_loader.CONFIG.emoji_delimiter,
                illegal_chars=config_loader.CONFIG.illegal_chars,
                target_platform=config_loader.CONFIG.target_platform_normalized,
                reserved_names=config_loader.CONFIG.windows_reserved_names,
            )
            path_list.append(sanitized)

    # Remove blank, empty string, and whitespace-only strings
    path_split = [x for x in path_list if x.strip()]

    if config_loader.CONFIG.prevent_consecutive:
        # remove consecutive (/FolderName/FolderName/video.mp4 -> FolderName/video.mp4
        path_split = _remove_consecutive(path_split)

    return Path(*path_split)


# ============================================================================
# Private Helper Functions
# ============================================================================

# Template Selection Helpers


def _get_template_config(
    media_type: Literal["scene", "gallery"],
    template_type: Literal["filename", "path"],
) -> _TemplateConfig:
    """Get template configuration based on media type and template type.

    Args:
        media_type: "scene" or "gallery"
        template_type: "filename" or "path"

    Returns:
        _TemplateConfig instance with appropriate configuration values

    Raises:
        ValueError: If media_type or template_type is invalid
    """
    match (media_type, template_type):
        case ("gallery", "filename"):
            return _TemplateConfig(
                path_templates=None,
                studio_templates=config_loader.CONFIG.gallery_studio_templates,
                tag_templates=config_loader.CONFIG.gallery_tag_templates,
                use_default=config_loader.CONFIG.use_default_gallery_template,
                default_template=config_loader.CONFIG.default_gallery_template,
            )
        case ("scene", "filename"):
            return _TemplateConfig(
                path_templates=None,
                studio_templates=config_loader.CONFIG.studio_templates,
                tag_templates=config_loader.CONFIG.tag_templates,
                use_default=config_loader.CONFIG.use_default_template,
                default_template=config_loader.CONFIG.default_template,
            )
        case ("gallery", "path"):
            return _TemplateConfig(
                path_templates=config_loader.CONFIG.p_gallery_path_templates,
                studio_templates=config_loader.CONFIG.p_gallery_studio_templates,
                tag_templates=config_loader.CONFIG.p_gallery_tag_templates,
                use_default=config_loader.CONFIG.p_use_default_gallery_template,
                default_template=config_loader.CONFIG.p_default_gallery_template,
            )
        case ("scene", "path"):
            return _TemplateConfig(
                path_templates=config_loader.CONFIG.p_path_templates,
                studio_templates=config_loader.CONFIG.p_studio_templates,
                tag_templates=config_loader.CONFIG.p_tag_templates,
                use_default=config_loader.CONFIG.p_use_default_template,
                default_template=config_loader.CONFIG.p_default_template,
            )
        case _:
            raise ValueError(
                f"Unexpected (media_type, template_type): ({media_type}, {template_type})"
            )


def _find_studio_template(
    studio: StudioModel | None,
    studio_templates: dict[str, str] | None,
) -> str | None:
    """Find template by traversing studio hierarchy.

    Traverses the full studio hierarchy (current studio and all parent studios)
    to find a matching template. Checks current studio first, then walks up
    the parent chain until a match is found.

    Args:
        studio: StudioModel instance (or None)
        studio_templates: Dictionary mapping studio names to template strings

    Returns:
        Template string if found, None otherwise
    """
    if not studio or not studio_templates:
        return None

    # Get full hierarchy (root to leaf) and check from leaf to root
    # This checks current studio first, then walks up to root
    studios = stash_graphql.traverse_studio_hierarchy(studio)

    for studio_obj in reversed(studios):
        if studio_templates.get(studio_obj.name):
            return studio_templates[studio_obj.name]

    return None


def _find_tag_template(
    tags: list[TagModel] | None, tag_templates: dict[str, str] | None
) -> str | None:
    """Find template by matching tags.

    Args:
        tags: List of TagModel instances
        tag_templates: Dictionary mapping tag names to template strings

    Returns:
        Template string if found, None otherwise
    """
    if not tags or not tag_templates:
        return None

    tag_names = [tag.name for tag in tags]
    for match, template in tag_templates.items():
        if match in tag_names:
            return template

    return None


# Template Processing Helpers


def _get_field_value(
    field_name: str, item_information: ItemInformation, item_index: int
) -> str:
    """Get the value for a field, handling both scene-level and file-level fields.

    Args:
        field_name: Field name without $ prefix
        item_information: Scene or gallery information dataclass
        item_index: Index of the item in the items array

    Returns:
        Field value as string, or empty string if not found
    """
    # Get file-specific data
    file_data = (
        item_information.items[item_index]
        if item_index < len(item_information.items)
        else None
    )

    f = field_name.replace("$", "").strip("_")
    replaced_word = ""

    match f:
        # Fingerprint fields - read from file level
        # Check both "file" (scenes) and "gallery_zip_file" (gallery zip files)
        # Note: Galleries only have md5, scenes can have oshash, md5, and phash
        case "oshash" | "phash":
            # Only scenes have oshash and phash
            if file_data and file_data.file:
                fingerprints = file_data.file.fingerprints
                for fingerprint in fingerprints:
                    if fingerprint.type == f:
                        replaced_word = fingerprint.value or ""
                        break
        case "md5":
            # Both scenes and galleries have md5
            file_obj = None
            if file_data:
                file_obj = file_data.file or file_data.gallery_zip_file
            if file_obj:
                fingerprints = file_obj.fingerprints
                for fingerprint in fingerprints:
                    if fingerprint.type == f:
                        replaced_word = fingerprint.value or ""
                        break

        # File-level media attributes (scenes only - galleries don't have these)
        case "bit_rate":
            if file_data and file_data.file and file_data.file.bit_rate is not None:
                replaced_word = str(round(int(file_data.file.bit_rate) / 1000000, 2))
            else:
                replaced_word = ""

        case "height":
            if file_data and file_data.file:
                height = file_data.file.height
                if height is not None:
                    if height >= 4320:
                        replaced_word = "8k"
                    elif height >= 3384:
                        replaced_word = "6k"
                    elif height >= 2880:
                        replaced_word = "5k"
                    elif height >= 2160:
                        replaced_word = "4k"
                    else:
                        replaced_word = f"{height}p"
                else:
                    replaced_word = ""
            else:
                replaced_word = ""

        case "resolution":
            if file_data and file_data.file:
                height = file_data.file.height or 0
                width = file_data.file.width or 0
                if height > width:
                    replaced_word = "VERTICAL"
                elif height >= 2160:
                    replaced_word = "UHD"
                elif height >= 720:
                    replaced_word = "HD"
                else:
                    replaced_word = "SD"
            else:
                replaced_word = ""

        case "video_codec":
            if file_data and file_data.file:
                codec = file_data.file.video_codec
                replaced_word = "" if codec is None else codec.upper()
            else:
                replaced_word = ""

        case "audio_codec":
            if file_data and file_data.file:
                codec = file_data.file.audio_codec
                replaced_word = "" if codec is None else codec.upper()
            else:
                replaced_word = ""

        # File-specific performer_path and duration
        case "performer_path":
            perf_path = (
                file_data.performer_path if file_data else None
            ) or item_information.performer_path
            replaced_word = "" if perf_path is None else str(perf_path)

        case "duration":
            duration = file_data.duration if file_data else None
            replaced_word = "" if duration is None else duration

        # Title - check for file-specific override (CONFIG.filename_as_title)
        case "title":
            title_value = (
                file_data.title_override if file_data else None
            ) or item_information.title
            replaced_word = str(title_value).strip() if title_value else ""

        # Default: scene-level fields
        case _:
            field_value = getattr(item_information, f, "")
            replaced_word = "" if field_value is None else str(field_value)

    # Apply field replacer if configured
    if config_loader.CONFIG.field_replacer.get(f"${f}"):
        field_replacer_config = config_loader.CONFIG.field_replacer[f"${f}"]

        # Support both single replacement (dict) and multiple replacements (list)
        if isinstance(field_replacer_config, list):
            # Multiple replacements - apply in sequence
            for replacement_config in field_replacer_config:
                if "regex" in replacement_config:
                    pattern = replacement_config["regex"]
                    replacement = replacement_config.get("with", "")
                    replaced_word = re.sub(pattern, replacement, replaced_word)
                elif "replace" in replacement_config:
                    replaced_word = replaced_word.replace(
                        replacement_config["replace"],
                        replacement_config["with"],
                    )
        elif isinstance(field_replacer_config, dict):
            # Single replacement
            if "regex" in field_replacer_config:
                pattern = field_replacer_config["regex"]
                replacement = field_replacer_config.get("with", "")
                replaced_word = re.sub(pattern, replacement, replaced_word)
            elif "replace" in field_replacer_config:
                replaced_word = replaced_word.replace(
                    field_replacer_config["replace"],
                    field_replacer_config["with"],
                )

    # Ensure replaced_word is always a string
    replaced_word = str(replaced_word) if replaced_word is not None else ""
    return replaced_word


def _process_groups(
    template: str, item_information: ItemInformation, item_index: int
) -> str:
    """Process groups in template by dynamically detecting separators and removing entire groups if any variable within them is missing.

    Args:
        template: Template string with potential groups {variable separator variable}
        item_information: Scene or gallery information dataclass
        item_index: Index of the item in the items array

    Returns:
        Template string with groups processed (removed if any variable is missing, kept if all variables present)
    """
    result = template

    # Find all groups {content}
    group_pattern = r"\{([^}]*)\}"
    groups = re.finditer(group_pattern, result)

    # Process groups from right to left to maintain indices
    for match in reversed(list(groups)):
        group_content = match.group(1)

        # Extract all variables from the group
        variables = re.findall(r"\$\w+", group_content)

        if not variables:
            # No variables in group, remove it
            result = result[: match.start()] + result[match.end() :]
            continue

        # Replace variables and check if any are empty
        group_result = group_content
        has_empty = False

        for var in variables:
            field_value = _get_field_value(var, item_information, item_index)
            if not field_value:
                has_empty = True
                break
            # Replace variable with its value
            group_result = group_result.replace(var, field_value)

        # If any variable is empty, remove the entire group
        if has_empty:
            result = result[: match.start()] + result[match.end() :]
        else:
            # All variables have values, replace group with processed content
            result = result[: match.start()] + group_result + result[match.end() :]

    return result


def _field_replacer(
    template: str, item_information: ItemInformation, item_index: int
) -> tuple[str, str | None]:
    """Replace template variables with their values from scene and file information.

    Processes groups first (removing entire groups if any variable is missing),
    then replaces remaining field variables with their values. The $title field
    is handled specially - it is extracted but not replaced in the template,
    allowing it to be processed separately after cleanup.

    Args:
        template: Template string containing variables (e.g., "$date $title")
            and groups (e.g., "{$date - }$title")
        item_information: ItemInformation dataclass containing scene or gallery metadata
        item_index: Index of the item in the items array

    Returns:
        Tuple of (processed_template, title_value):
            - processed_template: Template with variables replaced (except $title)
            - title_value: Extracted title value, or None if not present
    """
    # Process groups first (before field replacement)
    result = _process_groups(template, item_information, item_index)

    # Now process remaining fields outside of groups
    field_found = re.findall(r"\$\w+", result)
    title = None

    if field_found:
        field_found.sort(key=len, reverse=True)
    for i in range(0, len(field_found)):
        f = field_found[i].replace("$", "")

        # Prevent duplicate performer names when both $performer and $title are in the template.
        # Works in both directions: if title contains performer, remove $performer field.
        if (
            f == "performer"
            and item_information.performer
            and item_information.title
            and config_loader.CONFIG.prevent_title_performer
        ):
            # Check if $title is also in the template
            has_title = any(field.replace("$", "") == "title" for field in field_found)

            if has_title:
                # Check if title contains performer name (case-insensitive)
                performer_name = item_information.performer
                title_lower = (
                    item_information.title.lower() if item_information.title else ""
                )
                performer_lower = performer_name.lower() if performer_name else ""

                if performer_lower in title_lower:
                    log.log_debug(
                        "Ignoring the performer field because it's already in title"
                    )
                    result = result.replace("$performer", "")
                    continue

        # Get field value using helper function
        replaced_word = _get_field_value(field_found[i], item_information, item_index)

        # Extract title but don't replace $title yet - it will be replaced after remove_consecutive_nonword
        if f == "title":
            title = replaced_word
            continue

        # Replace field in result
        if replaced_word == "":
            result = result.replace(field_found[i], replaced_word)
        else:
            result = result.replace(f"${f}", replaced_word)

    return result, title


# Utility Helpers


def _remove_consecutive(liste: list) -> list:
    """Remove consecutive duplicate elements from a list.

    Args:
        liste: List to process

    Returns:
        List with consecutive duplicates removed
    """
    new_list = []
    for i in range(0, len(liste)):
        if i != 0 and liste[i] == liste[i - 1]:
            continue
        new_list.append(liste[i])
    return new_list
