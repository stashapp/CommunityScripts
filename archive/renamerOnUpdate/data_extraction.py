"""Data extraction functions for processing Stash GraphQL responses."""

import re
import time
from datetime import datetime
from pathlib import Path
from typing import Literal

from pydantic import BaseModel

import config_loader
import log
import platform_utils
import stash_graphql
from stash_graphql_models import (
    GalleryModel,
    PerformerModel,
    SceneModel,
    StudioModel,
    TagModel,
)
from template_processing import FileData, GalleryInformation, SceneInformation, Template


class _StudioInfo(BaseModel):
    """Studio information including hierarchy.

    Attributes:
        studio: Formatted name of the current studio
        studio_family: Formatted name of the parent studio (if exists), otherwise current studio
        parent_studio: Formatted name of the parent studio (if exists)
        studio_hierarchy: List of formatted studio names from root to leaf
    """

    studio: str | None = None
    studio_family: str | None = None
    parent_studio: str | None = None
    studio_hierarchy: list[str] | None = None


class _DateInfo(BaseModel):
    """Date information extracted from a date string."""

    date: str | None = None
    date_format: str | None = None
    year: str | None = None


class _PerformerInfo(BaseModel):
    """Performer information extracted from a list of performers."""

    performer: str | None = None
    stashid_performer: str | None = None
    performer_path: str | None = None
    performer_list: list[str] | None = None  # Optional, for internal use


def _should_ignore_performer(performer: PerformerModel, ignore_genders: list) -> bool:
    """Check if performer should be ignored based on gender.

    Args:
        performer: PerformerModel instance
        ignore_genders: List of genders to ignore

    Returns:
        True if performer should be ignored, False otherwise
    """
    if not ignore_genders:
        return False

    gender = performer.gender
    if gender is None:
        return "UNDEFINED" in ignore_genders

    return gender in ignore_genders


def _sort_performers(
    performers: list[PerformerModel], sort_method: str, use_inverted: bool = False
) -> list[PerformerModel]:
    """Sort performers based on the specified method.

    Args:
        performers: List of PerformerModel instances
        sort_method: Sorting method ('name', 'id', 'rating', 'favorite', 'mix', 'mixid')
        use_inverted: If True, sort by inverted names instead of original names

    Returns:
        List of sorted PerformerModel instances
    """

    def _get_rating_int(perf: PerformerModel) -> int:
        """Extract rating as int, defaulting to -1 if not available or not an int."""
        rating = perf.rating100
        return rating if rating is not None else -1

    def _get_name_for_sort(perf: PerformerModel) -> str:
        """Get the name to use for sorting (inverted or original)."""
        return perf.name_inverted if use_inverted else perf.name

    match sort_method:
        case "name":
            return sorted(performers, key=lambda p: _get_name_for_sort(p).lower())
        case "id":
            return sorted(performers, key=lambda p: p.id)
        case "rating":
            # Higher rating first, then alphabetically
            return sorted(
                performers,
                key=lambda p: (
                    -_get_rating_int(p),
                    _get_name_for_sort(p).lower(),
                ),
            )
        case "favorite":
            # Favorites first, then alphabetically
            return sorted(
                performers,
                key=lambda p: (
                    not p.favorite,
                    _get_name_for_sort(p).lower(),
                ),
            )
        case "mix":
            # favorite > rating > name
            return sorted(
                performers,
                key=lambda p: (
                    not p.favorite,
                    -_get_rating_int(p),
                    _get_name_for_sort(p).lower(),
                ),
            )
        case "mixid":
            # favorite > rating > id
            return sorted(
                performers,
                key=lambda p: (
                    not p.favorite,
                    -_get_rating_int(p),
                    p.id,
                ),
            )
        case _:
            return performers


def _extract_stash_ids(sorted_performers: list[PerformerModel], split_char: str) -> str:
    """Extract stash_ids from sorted performers.

    Args:
        sorted_performers: List of sorted PerformerModel instances
        split_char: Character to join IDs with

    Returns:
        Joined string of stash IDs
    """
    perf_list_stashid = [
        perf.stash_ids[0].stash_id for perf in sorted_performers if perf.stash_ids
    ]

    return split_char.join(perf_list_stashid)


def _format_studio_name(name: str) -> str:
    """Format studio name based on config_loader.CONFIG.squeeze_studio_names setting."""
    return name.replace(" ", "") if config_loader.CONFIG.squeeze_studio_names else name


def _convert_rating(rating100: int) -> str:
    """Convert rating100 (1-100 integer) to display format based on configuration.

    Args:
        rating100: Integer rating from Stash (1-100, where 100 = 5 stars)

    Returns:
        Formatted rating string based on rating_display_mode configuration
    """
    display_mode = config_loader.CONFIG.rating_display_mode

    # If None or "integer", return raw integer
    if display_mode is None or display_mode == "integer":
        return str(rating100)

    # Convert to 0-5 scale (100 = 5.0)
    # Stash uses division by 20: rating100 / 20.0
    # This is equivalent to: rating100 / 100.0 * 5.0
    rating_5_scale = rating100 / 20.0

    if display_mode == "stars":
        # Convert to star rating with specified precision
        precision = config_loader.CONFIG.rating_star_precision

        match precision:
            case "full":
                # Round to nearest whole star (0, 1, 2, 3, 4, 5)
                stars_int = round(rating_5_scale)
                return str(int(stars_int))
            case "half":
                # Round to nearest half star (0, 0.5, 1, 1.5, ..., 5)
                stars_float = round(rating_5_scale * 2) / 2.0
                # Format with 1 decimal place, but remove trailing zero for whole numbers
                return f"{stars_float:.1f}".rstrip("0").rstrip(".")
            case "quarter":
                # Round to nearest quarter star (0, 0.25, 0.5, 0.75, ..., 5)
                stars_float = round(rating_5_scale * 4) / 4.0
                # Format with 2 decimal places, but remove trailing zeros
                return f"{stars_float:.2f}".rstrip("0").rstrip(".")
            case "tenth":
                # Round to nearest tenth star (0, 0.1, 0.2, ..., 5)
                stars_float = round(rating_5_scale * 10) / 10.0
                # Format with 1 decimal place, but remove trailing zero for whole numbers
                return f"{stars_float:.1f}".rstrip("0").rstrip(".")
            case _:
                # Default to full stars if invalid precision
                stars_int = round(rating_5_scale)
                return str(int(stars_int))

    elif display_mode == "decimal":
        # Convert to decimal rating (0.0-5.0)
        decimal_places = config_loader.CONFIG.rating_decimal_places
        return f"{rating_5_scale:.{decimal_places}f}"

    else:
        # Invalid display_mode, return raw integer
        return str(rating100)


def _extract_date_info(date_str: str | None) -> _DateInfo:
    """Extract date information from a date string.

    Args:
        date_str: Date string in YYYY-MM-DD format or None

    Returns:
        _DateInfo model with date, date_format, and year
    """
    if not date_str:
        return _DateInfo()

    date_obj = datetime.strptime(date_str, r"%Y-%m-%d")
    date_format = datetime.strftime(date_obj, config_loader.CONFIG.date_format)
    year = str(date_obj.year)

    return _DateInfo(date=date_str, date_format=date_format, year=year)


def _extract_performer_info(
    performers: list[PerformerModel] | None,
    template: Template,
    store_perf_list: bool = False,
) -> _PerformerInfo:
    """Extract performer information from a list of performers.

    Args:
        performers: List of PerformerModel instances or None
        template: Template dictionary (for checking inverse_performer option)
        store_perf_list: If True, store performer_list for per-file processing

    Returns:
        _PerformerInfo model with performer, stashid_performer, performer_path, and optionally performer_list
    """
    if not performers:
        if config_loader.CONFIG.path_noperformer_folder:
            return _PerformerInfo(performer_path="NoPerformer")
        return _PerformerInfo()

    # Step 1: Filter performers
    processed_performers: list[PerformerModel] = []

    for performer in performers:
        # Skip ignored genders
        if _should_ignore_performer(
            performer, config_loader.CONFIG.performer_ignore_gender
        ):
            continue

        processed_performers.append(performer)

    # Step 2: Check if name inversion is needed
    template_path = template.path
    use_inverted = bool(template_path and "inverse_performer" in template_path.option)

    # Step 3: Sort performers (using inverted names for sorting if needed)
    sorted_performers = _sort_performers(
        processed_performers, config_loader.CONFIG.performer_sort, use_inverted
    )

    # Step 4: Apply performer limit
    if len(sorted_performers) > config_loader.CONFIG.performer_limit:
        if not config_loader.CONFIG.performer_limit_keep:
            log.log_info(
                f"More than {config_loader.CONFIG.performer_limit} performer(s). Ignoring $performer"
            )
            sorted_performers = []
        else:
            log.log_info(
                f"Limited the amount of performer to {config_loader.CONFIG.performer_limit}"
            )
            sorted_performers = sorted_performers[
                0 : config_loader.CONFIG.performer_limit
            ]

    # Step 5: Extract names from sorted performers (using inverted names if needed)
    performer_list = [
        p.name_inverted if use_inverted else p.name for p in sorted_performers
    ]

    # Step 6: Build final performer string
    performer_str = config_loader.CONFIG.performer_splitchar.join(performer_list)

    # Step 7: Extract stash IDs directly from sorted performers
    stashid_performer = None
    if sorted_performers:
        stashid_performer = _extract_stash_ids(
            sorted_performers, config_loader.CONFIG.performer_splitchar
        )

    # Step 8: Set default performer_path
    performer_path = None
    if performer_list:
        if config_loader.CONFIG.path_one_performer:
            performer_path = performer_list[0]
        else:
            performer_path = config_loader.CONFIG.performer_splitchar.join(
                performer_list
            )

    # Store for per-file CONFIG.path_keep_alrperf processing if requested
    performer_list_for_model = performer_list if store_perf_list else None

    return _PerformerInfo(
        performer=performer_str,
        stashid_performer=stashid_performer,
        performer_path=performer_path,
        performer_list=performer_list_for_model,
    )


def _extract_tags_info(tags: list[TagModel]) -> str:
    """Extract tags information from a list of tags.

    Args:
        tags: List of TagModel instances

    Returns:
        Joined string of tag names (empty string if no tags)
    """
    if not tags:
        return ""

    tag_list = []
    for tag in tags:
        # ignore tag in blacklist
        if tag.name in config_loader.CONFIG.tags_blacklist:
            continue
        # check if there is a whitelist
        if len(config_loader.CONFIG.tags_whitelist) > 0:
            if tag.name in config_loader.CONFIG.tags_whitelist:
                tag_list.append(tag.name)
        else:
            tag_list.append(tag.name)

    return config_loader.CONFIG.tags_splitchar.join(tag_list)


def _apply_field_whitespace_separator(
    information: SceneInformation | GalleryInformation,
) -> None:
    """Apply field whitespace separator to information Pydantic model fields.

    Modifies the model in place.

    Args:
        information: ItemInformation to modify
    """
    if config_loader.CONFIG.field_whitespace_separator:
        # Exclude fields that shouldn't be processed
        excluded_fields = {
            "scene_id",
            "gallery_id",
            "group_index",
            "items",
            "performer_list",
        }

        # Use SceneInformation for field iteration (both classes have same common fields)
        for field_name in SceneInformation.model_fields:
            if field_name in excluded_fields or field_name.startswith("_"):
                continue

            value = getattr(information, field_name, None)
            if value is not None:
                if isinstance(value, str):
                    setattr(
                        information,
                        field_name,
                        value.replace(
                            " ", config_loader.CONFIG.field_whitespace_separator
                        ),
                    )
                elif isinstance(value, list):
                    setattr(
                        information,
                        field_name,
                        [
                            x.replace(
                                " ", config_loader.CONFIG.field_whitespace_separator
                            )
                            if isinstance(x, str)
                            else x
                            for x in value
                        ],
                    )


def _apply_path_keep_alrperf(
    item_info: FileData,
    current_path: Path,
    performer_path: str | None,
    performer_list: list[str] | None,
) -> None:
    """Apply config_loader.CONFIG.path_keep_alrperf logic to update performer_path if a performer name is found in the current path.

    Modifies item_info in place.

    Args:
        item_info: FileData to update (will set performer_path)
        current_path: Path to check for performer names
        performer_path: Default performer_path to use
        performer_list: List of performer names to check (or None)
    """
    item_info.performer_path = performer_path
    if config_loader.CONFIG.path_keep_alrperf and current_path and performer_list:
        for name in performer_list:
            if name in current_path.parts:
                item_info.performer_path = name
                log.log_debug(
                    f"[PATH] Keeping the current name of the performer '{name}'"
                )
                break


def _process_template_path(template: Template, current_path: Path) -> Path | None:
    """Process template path, handling ^* replacement with parent directory.

    Args:
        template: Template dictionary (may contain "path" key)
        current_path: Current path to use for ^* replacement

    Returns:
        Path object for template path, or None if no path template
    """
    if not template.path:
        return None

    template_dest = template.path.destination
    # Check if destination is empty (Pydantic default value)
    # This can happen when PathTemplate exists but destination wasn't set or is empty string
    if not template_dest:
        return None

    if "^*" in template_dest:
        parent_str = str(current_path.parent) if current_path else ""
        template_dest = template_dest.replace("^*", parent_str)

    # Use platform_utils helper to ensure proper parsing of Windows paths
    return platform_utils.create_path_from_string(
        template_dest, config_loader.CONFIG.target_platform_normalized
    )


def _clean_title_extension(title: str | None, current_path: Path) -> str | None:
    """Remove file extension from title if it matches the current path's extension.

    Args:
        title: Title string to clean (or None)
        current_path: Path object to get extension from

    Returns:
        Cleaned title string, or None if title was None or no change was made
    """
    if not title or not current_path:
        return None

    cleaned_title = re.sub(
        rf"{re.escape(current_path.suffix)}$",
        "",
        title,
    )

    # Only return if we actually removed something
    if cleaned_title != title:
        return cleaned_title

    return None


def _extract_studio_info(studio: StudioModel | None) -> _StudioInfo:
    """Extract studio information including hierarchy.

    Args:
        studio: StudioModel instance with name, id, and optional parent_studio, or None

    Returns:
        _StudioInfo model with studio, studio_family, parent_studio, and studio_hierarchy
    """
    if not studio:
        return _StudioInfo()

    # Get full hierarchy (root to leaf) and format names
    studios = stash_graphql.traverse_studio_hierarchy(studio)
    studio_hierarchy = [_format_studio_name(s.name) for s in studios]

    # Current studio is the last in the hierarchy (leaf)
    studio_name = studio_hierarchy[-1]
    studio_family = studio_name
    parent_studio = None

    # Parent studio is the second-to-last if there are multiple studios
    if len(studio_hierarchy) > 1:
        parent_studio = studio_hierarchy[-2]
        studio_family = parent_studio

    return _StudioInfo(
        studio=studio_name,
        studio_family=studio_family,
        parent_studio=parent_studio,
        studio_hierarchy=studio_hierarchy,
    )


def _extract_title(
    item: SceneModel | GalleryModel, item_type: Literal["scene", "gallery"]
) -> str | None:
    """Extract and process title from a scene or gallery.

    Handles title extraction with optional preposition removal and fallback to
    filename if config_loader.CONFIG.filename_as_title is enabled.

    Args:
        item: SceneModel or GalleryModel instance
        item_type: "scene" or "gallery" to determine extraction logic

    Returns:
        Title string or None if no title found
    """
    title = None

    if item.title:
        title = item.title
    elif config_loader.CONFIG.filename_as_title:
        match item_type:
            case "scene":
                # Scene - use first file's name
                if isinstance(item, SceneModel) and item.files and len(item.files) > 0:
                    title = platform_utils.create_path_from_string(
                        item.files[0].path,
                        config_loader.CONFIG.target_platform_normalized,
                    ).stem
            case "gallery":
                # Gallery - use folder name or zip file name
                if isinstance(item, GalleryModel):
                    if item.folder:
                        folder = stash_graphql.graphql_get_folder(item.folder.id)
                        if folder.path:
                            title = platform_utils.create_path_from_string(
                                folder.path,
                                config_loader.CONFIG.target_platform_normalized,
                            ).name
                    elif item.files and len(item.files) > 0:
                        title = platform_utils.create_path_from_string(
                            item.files[0].path,
                            config_loader.CONFIG.target_platform_normalized,
                        ).stem

    return title


def _extract_common_item_info(
    item: SceneModel | GalleryModel,
    template: Template,
    item_type: Literal["scene", "gallery"],
) -> SceneInformation | GalleryInformation:
    """Extract common information from a scene or gallery.

    Handles extraction of fields that are common to both scenes and galleries:
    ID, studio_code, title, date, rating, performers, studio, and tags.

    Args:
        item: SceneModel or GalleryModel instance
        template: Template dictionary with filename and path templates
        item_type: "scene" or "gallery" to determine extraction logic

    Returns:
        ItemInformation dataclass with common fields extracted and processed
    """
    # Set ID and studio_code
    # item.id is always a string (required field in SceneModel/GalleryModel)
    scene_id: str | None = None
    gallery_id: str | None = None
    if item_type == "scene":
        scene_id = item.id
    else:
        gallery_id = item.id

    # Extract Title
    title = _extract_title(item, item_type)

    # Extract Date
    date_info = _extract_date_info(item.date)

    # Extract Rating
    rating = None
    if item.rating100 is not None:
        converted_rating = _convert_rating(item.rating100)
        rating = config_loader.CONFIG.rating_format.format(converted_rating)

    # Extract Performer
    performer_info = _extract_performer_info(
        item.performers, template, store_perf_list=True
    )

    # Process Studio information
    studio_info = _extract_studio_info(item.studio)

    # Extract Tags
    tags = _extract_tags_info(item.tags)

    # Build SceneInformation or GalleryInformation
    # Union type annotation is required because this variable is assigned in both branches
    # and mypy needs to know it can hold either type
    if item_type == "scene":
        assert scene_id is not None
        information: SceneInformation | GalleryInformation = SceneInformation(
            scene_id=scene_id,
            title=title,
            date=date_info.date,
            date_format=date_info.date_format,
            year=date_info.year,
            rating=rating,
            performer=performer_info.performer,
            performer_path=performer_info.performer_path,
            stashid_performer=performer_info.stashid_performer,
            studio=studio_info.studio,
            studio_family=studio_info.studio_family,
            parent_studio=studio_info.parent_studio,
            studio_hierarchy=studio_info.studio_hierarchy,
            tags=tags,
            studio_code=item.code,
            performer_list=performer_info.performer_list,
        )
    else:
        assert gallery_id is not None
        information = GalleryInformation(
            gallery_id=gallery_id,
            title=title,
            date=date_info.date,
            date_format=date_info.date_format,
            year=date_info.year,
            rating=rating,
            performer=performer_info.performer,
            performer_path=performer_info.performer_path,
            stashid_performer=performer_info.stashid_performer,
            studio=studio_info.studio,
            studio_family=studio_info.studio_family,
            parent_studio=studio_info.parent_studio,
            studio_hierarchy=studio_info.studio_hierarchy,
            tags=tags,
            studio_code=item.code,
            performer_list=performer_info.performer_list,
        )

    # Note: Whitespace separator is NOT applied here because:
    # - Scenes may add group fields that need processing
    # - Each extraction function applies it after all fields are added
    return information


def extract_scene_info(scene: SceneModel, template: Template) -> SceneInformation:
    """Extract and process scene information from Stash scene data.

    Processes scene-level attributes (title, date, rating, performers, studio, tags, groups)
    and file-level attributes (paths, fingerprints, codecs, etc.) into a structured
    dictionary suitable for template processing.

    Args:
        scene: SceneModel instance from Stash GraphQL query containing scene data
        template: Template dictionary with filename and path templates (used for
                  processing options like inverse_performer and config_loader.CONFIG.path_keep_alrperf)

    Returns:
        Dictionary containing:
        - Scene-level fields: scene_id, title, date, date_format, year, rating,
          performer, performer_path, stashid_performer, studio, studio_family,
          parent_studio, studio_hierarchy, tags, group_title, group_year,
          group_scene, group_index, group_hierarchy, stashid_scene, studio_code
        - File-level fields in "items" list: Each file dict contains type="scene_file",
          file_index, item_id, current_path, template_path, title_override (optional),
          performer_path, duration, bitrate, height, resolution, video_codec,
          audio_codec, oshash, md5, phash, file (with fingerprints and codecs)
        - Internal fields: performer_list (for config_loader.CONFIG.path_keep_alrperf processing)
    """
    # ========== SCENE-LEVEL EXTRACTION ==========

    # Extract common fields - cast to SceneInformation since we know item_type is "scene"
    common_info = _extract_common_item_info(scene, template, "scene")
    if not isinstance(common_info, SceneInformation):
        raise RuntimeError("Expected SceneInformation but got GalleryInformation")
    scene_information = common_info

    # Scene-specific fields
    if scene.stash_ids:
        # todo support other db that stashdb ?
        scene_information.stashid_scene = scene.stash_ids[0].stash_id

    # Process group information
    if scene.groups:
        first_group = scene.groups[0]
        group_data = first_group.group

        # Basic group information
        scene_information.group_title = group_data.name
        scene_information.group_hierarchy = [scene_information.group_title]

        # Group year
        if group_data.date:
            scene_information.group_year = group_data.date[:4]

        # Scene index
        if first_group.scene_index is not None:
            scene_information.group_index = first_group.scene_index
            scene_information.group_scene = f"scene {first_group.scene_index}"

        # Build hierarchy by prepending parents
        if group_data.containing_groups:
            next_group_id: str | None = group_data.containing_groups[0].group.id

            while next_group_id:
                parent_group = stash_graphql.graphql_get_group(next_group_id)
                if scene_information.group_hierarchy is None:
                    scene_information.group_hierarchy = []
                scene_information.group_hierarchy.insert(0, parent_group.name)

                # Get next parent
                next_group_id = (
                    parent_group.containing_groups[0].group.id
                    if parent_group.containing_groups
                    else None
                )

    # Apply field whitespace separator after all scene-level fields are added
    # (including groups, which are added after common fields)
    _apply_field_whitespace_separator(scene_information)

    # ========== FILE-LEVEL EXTRACTION ==========

    items_info = []

    for file_index, scene_file in enumerate(scene.files):
        current_path = platform_utils.create_path_from_string(
            scene_file.path, config_loader.CONFIG.target_platform_normalized
        )

        # Handle template path with ^* replacement for this file
        template_path = _process_template_path(template, current_path)

        # Handle title - check if it contains this file's extension and clean it
        # (scene title is already set, potentially from first file if config_loader.CONFIG.filename_as_title)
        cleaned_title = _clean_title_extension(scene_information.title, current_path)

        # Store duration from file
        duration: str | None = None
        if scene_file.duration is not None:
            if config_loader.CONFIG.duration_format:
                duration = time.strftime(
                    config_loader.CONFIG.duration_format,
                    time.gmtime(scene_file.duration),
                )
            else:
                duration = str(scene_file.duration)

        # Create FileData
        file_info = FileData(
            type="scene_file",
            file_index=file_index,
            item_id=scene_file.id,
            current_path=current_path,
            template_path=template_path,
            title_override=cleaned_title,
            duration=duration,
            file=scene_file,
        )

        # Handle per-file performer_path (config_loader.CONFIG.path_keep_alrperf)
        _apply_path_keep_alrperf(
            file_info,
            file_info.current_path,
            scene_information.performer_path,
            scene_information.performer_list,
        )

        items_info.append(file_info)

    # Clean up internal fields
    scene_information.performer_list = None

    # Add items array to scene_information
    scene_information.items = items_info

    return scene_information


def extract_gallery_info(
    gallery: GalleryModel, template: Template
) -> GalleryInformation:
    """Extract and process gallery information from Stash gallery data.

    Processes gallery-level attributes (title, date, rating, performers, studio, tags)
    and file/folder-level attributes (paths, fingerprints) into a structured
    dictionary suitable for template processing.

    Similar to extract_scene_info but for galleries. Excludes scene-specific fields
    like video codecs, audio codecs, resolution, height, duration, bitrate, and groups.

    Args:
        gallery: GalleryModel instance from Stash GraphQL query containing gallery data
        template: Template dictionary with filename and path templates (used for
                  processing options like inverse_performer and config_loader.CONFIG.path_keep_alrperf)

    Returns:
        Dictionary containing:
        - Gallery-level fields: gallery_id, title, date, date_format, year, rating,
          performer, performer_path, stashid_performer, studio, studio_family,
          parent_studio, studio_hierarchy, tags, studio_code
        - File/folder-level fields in "items" list: Each item dict contains either:
          - For folder galleries: type="gallery_folder", item_id, current_path, template_path
          - For zip galleries: type="gallery_zip_file", item_id, current_path, template_path,
            title_override (optional), gallery_zip_file (with fingerprints: oshash, md5, phash)
        - Internal fields: performer_list (for config_loader.CONFIG.path_keep_alrperf processing)
    """
    # ========== GALLERY-LEVEL EXTRACTION ==========

    # Extract common fields - cast to GalleryInformation since we know item_type is "gallery"
    common_info = _extract_common_item_info(gallery, template, "gallery")
    if not isinstance(common_info, GalleryInformation):
        raise RuntimeError("Expected GalleryInformation but got SceneInformation")
    gallery_information = common_info

    # Apply field whitespace separator after all gallery-level fields are added
    _apply_field_whitespace_separator(gallery_information)

    # ========== FILE/FOLDER-LEVEL EXTRACTION ==========

    items_info = []

    # Determine if this is a folder gallery or zip gallery
    if gallery.folder:
        # Folder gallery - get folder info
        folder = stash_graphql.graphql_get_folder(gallery.folder.id)
        folder_path = folder.path if folder.path else ""

        current_path = (
            platform_utils.create_path_from_string(
                folder_path, config_loader.CONFIG.target_platform_normalized
            )
            if folder_path
            else Path()
        )

        # Handle template path with ^* replacement
        template_path = _process_template_path(template, current_path)

        # Create FileData for folder
        folder_info = FileData(
            type="gallery_folder",
            file_index=0,
            item_id=gallery.folder.id,
            current_path=current_path,
            template_path=template_path,
        )

        # Handle performer_path (config_loader.CONFIG.path_keep_alrperf)
        _apply_path_keep_alrperf(
            folder_info,
            folder_info.current_path,
            gallery_information.performer_path,
            gallery_information.performer_list,
        )

        items_info.append(folder_info)
    elif gallery.files and len(gallery.files) > 0:
        # Zip gallery - use zip file
        zip_file = gallery.files[0]

        current_path = platform_utils.create_path_from_string(
            zip_file.path, config_loader.CONFIG.target_platform_normalized
        )

        # Handle template path with ^* replacement
        template_path = _process_template_path(template, current_path)

        # Handle title - check if it contains extension and clean it
        cleaned_title = _clean_title_extension(gallery_information.title, current_path)

        # Create FileData for zip file
        zip_file_info = FileData(
            type="gallery_zip_file",
            file_index=0,
            item_id=zip_file.id,
            current_path=current_path,
            template_path=template_path,
            title_override=cleaned_title,
            gallery_zip_file=zip_file,
        )

        # Handle performer_path (config_loader.CONFIG.path_keep_alrperf)
        _apply_path_keep_alrperf(
            zip_file_info,
            zip_file_info.current_path,
            gallery_information.performer_path,
            gallery_information.performer_list,
        )

        items_info.append(zip_file_info)
    else:
        # Manually created galleries (no folder, no files or empty files array)
        # This case should be caught earlier in renamer_gallery, but handle gracefully here too
        has_files = gallery.files and len(gallery.files) > 0
        has_folder = gallery.folder is not None

        if not has_folder and not has_files:
            raise ValueError(
                "Gallery is a manually created gallery with no folder or files. "
                "These types of galleries are not supported for renaming/moving. "
                "Only folder-based and zip file-based galleries are supported."
            )
        else:
            # Unexpected case - should not happen
            raise ValueError(f"No folder or files in gallery: {gallery}")

    # Clean up internal fields
    gallery_information.performer_list = None

    # Add items array to gallery_information
    gallery_information.items = items_info

    return gallery_information
