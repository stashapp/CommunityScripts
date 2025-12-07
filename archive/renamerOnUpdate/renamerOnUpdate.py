"""Main plugin entry point for RenamerOnUpdate Stash plugin."""

import cProfile
import io
import json
import os
import pstats
import re
import sys
import traceback
from collections.abc import Callable
from pathlib import Path
from typing import Any, Literal, NoReturn

from gql import Client
from gql.transport.requests import RequestsHTTPTransport
from pydantic import ValidationError

import config_loader
import data_extraction
import log
import platform_utils
import plugin_input_models
import rename_operations
import stash_graphql
import template_processing
from stash_graphql_models import (
    FindGalleriesResponse,
    FindScenesResponse,
    GalleryModel,
    SceneModel,
)
from template_processing import (
    GalleryInformation,
    Template,
)


def _extract_error_details(err: Exception) -> list[str]:
    """Extract error details from various exception types.

    Args:
        err: Exception to extract details from

    Returns:
        List of error detail strings
    """
    if isinstance(err, ValidationError):
        # Pydantic ValidationError has errors() method
        return [
            error.get("msg", str(error)) if isinstance(error, dict) else str(error)
            for error in err.errors()
        ]

    if hasattr(err, "errors"):
        # Some errors have errors() as a method, others as a property
        errors = err.errors() if callable(err.errors) else err.errors
        return [
            str(error.get("message", error)) if isinstance(error, dict) else str(error)
            for error in errors
        ]

    if hasattr(err, "message"):
        return [str(err.message)]

    try:
        return [str(err)]
    except Exception:
        return [f"{type(err).__name__}: Unable to extract error message"]


def exit_plugin(msg: str | None = None, err: Exception | None = None) -> NoReturn:
    """Exit the plugin with a message and optional error.

    Args:
        msg: Exit message to output
        err: Optional exception to include in output
    """
    if msg is None and err is None:
        msg = "plugin ended"

    # Disable profiler and generate statistics
    try:
        if "_profiler" in globals():
            _profiler.disable()
            stats = pstats.Stats(_profiler)
            stats.sort_stats("cumulative")

            # Get total execution time
            total_time = stats.total_tt  # type: ignore[attr-defined]

            # Get top 20 functions by cumulative time (filtered to project modules)
            stats_stream = io.StringIO()
            stats.stream = stats_stream  # type: ignore[attr-defined]

            # Build regex pattern dynamically from project directory
            project_dir = Path(__file__).parent.resolve()
            project_dir_name = project_dir.name
            module_names = [
                py_file.stem  # Get filename without extension
                for py_file in project_dir.glob("*.py")
                if not py_file.name.startswith(".")
            ]

            # Build regex pattern: "renamerOnUpdate/(renamerOnUpdate|log|filename_sanitizer|config)"
            if module_names:
                pattern = (
                    f"{project_dir_name}{re.escape(os.sep)}({'|'.join(module_names)})"
                )
                stats.print_stats(pattern, 20)
            else:
                stats.print_stats(20)  # Fallback if no modules found

            # Log overall execution time and top 20 functions
            log.log_debug(f"Execution time: {total_time:.5f}s")
            stats_output = stats_stream.getvalue()
            for line in stats_output.splitlines():
                if line.strip():  # Skip empty lines
                    log.log_trace(line)
    except (NameError, AttributeError):
        # Profiler not initialized, skip profiling output
        pass

    # Extract error message if exception provided
    error_msg = None
    if err is not None:
        error_details = _extract_error_details(err)
        if error_details:
            error_msg = "; ".join(error_details)

    output_json = {"output": msg, "error": error_msg}
    print(json.dumps(output_json))
    sys.exit()


def _config_edit(name: str, state: bool) -> int:
    """Edit a boolean configuration value in config.py.

    Args:
        name: Configuration variable name
        state: New boolean value

    Returns:
        Number of occurrences found and modified
    """
    found = 0
    try:
        with open(config_loader.CONFIG_MODULE.__file__, encoding="utf8") as file:
            config_lines = file.readlines()
        with open(config_loader.CONFIG_MODULE.__file__, "w", encoding="utf8") as file_w:
            for line in config_lines:
                if len(line.split("=")) > 1 and name == line.split("=")[0].strip():
                    file_w.write(f"{name} = {state}\n")
                    found += 1
                    continue
                file_w.write(line)
    except PermissionError as err:
        log.log_error(f"You don't have the permission to edit config.py ({err})")
    return found


def _process_file_or_folder_rename(
    item_information: template_processing.ItemInformation,
    template: Template,
    file_data: template_processing.FileData,
    item_index: int,
    option_dryrun: bool,
    item_id: str,
    should_rename_associated: bool = False,
    task_mode: bool = False,
) -> None:
    """Process a single file or folder rename: find valid path and rename.

    Args:
        item_information: Scene or gallery information
        template: Template for filename/path generation
        file_data: Current file/folder data
        item_index: Index of file/folder in items array
        option_dryrun: Whether dry-run mode is enabled
        item_id: Item ID for logging
        should_rename_associated: If True, rename associated files (scenes only, first file)
        task_mode: If True, running in task mode
    """
    # Generate base path first to check if rename is needed
    base_path = rename_operations.generate_item_path(
        item_information, template, item_index, file_data
    )

    # If base path equals current path, no rename needed
    if platform_utils.paths_equal(
        base_path,
        file_data.current_path,
        config_loader.CONFIG.target_platform_normalized,
    ):
        log.log_info(f"Everything is ok. ({file_data.current_path.name})")
        return

    # Path will change - find valid rename path
    validator = rename_operations.PathValidator(
        item_information,
        template,
        file_data,
        item_index,
    )
    new_path = validator.find_valid_path()

    # If we failed to find a valid path, skip this file
    if new_path is None:
        log.write_dry_run_log(
            item_id,
            file_data.current_path,
            failed=True,
            option_dryrun=option_dryrun,
        )
        return

    rename_operations.log_rename_changes(file_data.current_path, new_path)

    # Dry-run mode: just log
    if config_loader.CONFIG.dry_run or option_dryrun:
        log.write_dry_run_log(
            item_id,
            file_data.current_path,
            new_path,
            option_dryrun=option_dryrun,
        )
        return

    # Perform rename
    try:
        if isinstance(item_information, GalleryInformation):
            # Gallery rename
            rename_operations.gallery_rename(
                file_data.current_path,
                new_path,
                file_data,
                item_id,
                task_mode=task_mode,
            )
        else:
            # Scene rename
            rename_operations.scene_rename(
                file_data.current_path,
                new_path,
                file_data,
                item_id,
            )
            # Rename associated files for first file only
            if should_rename_associated:
                rename_operations.associated_rename(
                    item_id,
                    file_data.current_path,
                    new_path,
                )
    except RuntimeError as err:
        log.log_error(f"Error during rename operation ({err})")
        return


def _process_item_rename(
    item_id: str,
    media_type: Literal["scene", "gallery"],
    get_item_func: Callable[[str], SceneModel | GalleryModel],
    extract_info_func: Callable[[Any, Template], template_processing.ItemInformation],
    task_mode: bool = False,
) -> None:
    """Generic renamer that works for both scenes and galleries.

    Processes files/folders one-by-one to maintain correct duplicate detection.
    Each file/folder is processed and renamed immediately before moving to the next.

    Args:
        item_id: Item ID
        media_type: "scene" or "gallery"
        get_item_func: Function to fetch item data: (id_str) -> SceneModel/GalleryModel
        extract_info_func: Function to extract item information: (item, template) -> ItemInformation
        task_mode: If True, indicates running in task mode
    """
    option_dryrun = False

    # Fetch the item data
    stash_item = get_item_func(item_id)

    # Check only_organized
    if (
        config_loader.CONFIG.only_organized
        and not stash_item.organized
        and not config_loader.CONFIG.p_non_organized
    ):
        log.log_debug(f"[{item_id}] {media_type.capitalize()} ignored (not organized)")
        return

    # Determine templates
    template = Template(
        filename=template_processing.get_filename_template(
            stash_item,
            media_type,
        ),
        path=template_processing.get_path_template(
            stash_item,
            media_type,
        ),
    )

    # Check if we have any template
    if not template.filename and not template.path:
        log.log_warning(f"[{item_id}] No template for this {media_type}.")
        return

    # Check for dry_run option in path template
    if (
        template.path
        and template.path.option
        and "dry_run" in template.path.option
        and not config_loader.CONFIG.dry_run
    ):
        log.log_info("Dry-Run on (activate by option)")
        option_dryrun = True

    # Validate item (e.g., check for files/folders)
    if media_type == "scene":
        if not stash_item.files:
            log.log_warning(
                f"[{item_id}] Scene has no files. "
                "Scenes without files are not supported for renaming/moving."
            )
            return
    else:  # gallery
        # Type narrowing: we know it's a GalleryModel in this branch
        assert isinstance(stash_item, GalleryModel)
        gallery_files = stash_item.files
        has_files = gallery_files and len(gallery_files) > 0
        has_folder = stash_item.folder is not None
        if not has_folder and not has_files:
            log.log_warning(
                f"[{item_id}] Gallery is a manually created gallery with no folder or files. "
                "These types of galleries are not supported for renaming/moving. "
                "Only folder-based and zip file-based galleries are supported."
            )
            return

    # Extract item information
    item_information = extract_info_func(stash_item, template)
    log.log_debug(f"[{item_id}] {media_type.capitalize()} information extracted")
    log.log_debug(f"[{item_id}] Template: {template}")

    # Process items one-by-one (critical for duplicate detection)
    for item_index, file_data in enumerate(item_information.items):
        _process_file_or_folder_rename(
            item_information,
            template,
            file_data,
            item_index,
            option_dryrun,
            item_id,
            should_rename_associated=(media_type == "scene" and item_index == 0),
            task_mode=task_mode,
        )

    # Handle clean_tag option after all files processed
    rename_operations.handle_clean_tag_option(
        template,
        item_id,
        media_type,
    )


def _process_task_items(
    find_func: Callable[[int, str], FindScenesResponse | FindGalleriesResponse],
    media_type: Literal["scene", "gallery"],
    get_item_func: Callable[[str], SceneModel | GalleryModel],
    extract_info_func: Callable[[Any, Template], template_processing.ItemInformation],
) -> None:
    """Process items in task mode (triggered from a task, not a hook).

    Args:
        find_func: GraphQL function to fetch items (e.g., stash_graphql.graphql_find_scene)
        media_type: "scene" or "gallery"
        get_item_func: Function to fetch item data: (id_str) -> SceneModel/GalleryModel
        extract_info_func: Function to extract item information: (item, template) -> ItemInformation
    """
    items_result = find_func(config_loader.CONFIG.batch_size, "ASC")
    # Extract items from response model
    items: list[SceneModel] | list[GalleryModel]
    if isinstance(items_result, FindScenesResponse):
        items = items_result.find_scenes.scenes
    elif isinstance(items_result, FindGalleriesResponse):
        items = items_result.find_galleries.galleries
    else:
        raise TypeError(
            f"Expected FindScenesResponse or FindGalleriesResponse, got {type(items_result)}"
        )

    log.log_debug(f"Count {media_type}s: {len(items)}")
    progress: float = 0.0
    progress_step = 1 / len(items) if items else 1.0

    for item in items:
        item_title = item.title if item.title else "No Title"
        log.log_debug(f"** Checking {media_type}: {item_title} - {item.id} **")
        try:
            _process_item_rename(
                item.id,
                media_type,
                get_item_func,
                extract_info_func,
                task_mode=True,
            )
        except RuntimeError as err:
            log.log_error(f"main function error: {err}")
        progress += progress_step
        log.log_progress(progress)


# Initialize execution environment
if __name__ == "__main__":
    _profiler = cProfile.Profile()
    _profiler.enable()
    try:
        plugin_input = plugin_input_models.PluginInput.model_validate_json(
            sys.stdin.read()
        )
    except ValidationError as e:
        log.log_error(f"Failed to parse plugin input: {e}")
        exit_plugin("Failed to parse plugin input", e)

    server_connection = plugin_input.server_connection

    # Extract plugin_args and hook_context based on args type
    plugin_args: (
        Literal["enable", "disable", "dryrun", "task_scenes", "task_galleries"] | None
    ) = None
    hook_context: plugin_input_models.HookContext | None = None

    if isinstance(plugin_input.args, plugin_input_models.TaskArgs):
        plugin_args = plugin_input.args.mode
    elif isinstance(plugin_input.args, plugin_input_models.HookArgs):
        hook_context = plugin_input.args.hook_context

    # Trace log for plugin input exploration (useful for debugging and understanding structure)
    log.log_trace("Plugin Input:")
    for line in plugin_input.model_dump_json(indent=2).splitlines():
        log.log_trace(line)

    # Set up GraphQL client (must be done after plugin input parsing)
    gql_client = Client(
        transport=RequestsHTTPTransport(
            url=(
                f"{server_connection.Scheme}://"
                f"{'localhost' if server_connection.Host == '0.0.0.0' else server_connection.Host}:"
                f"{server_connection.Port}/graphql"
            ),
            cookies={"session": server_connection.SessionCookie.Value},
            timeout=20,
        )
    )
    # Initialize graphql module with client
    stash_graphql.initialize_client(gql_client)

    # Early validation checks
    # When the "clean_tag" option is set, the cleaning operation triggers the "Scene.Update.Post" or "Gallery.Update.Post" hook.
    if hook_context is not None:
        # Check if this is a tag removal only update
        # Handle both single update ({"id", "tag_ids"}) and bulk update ({"ids", "tag_ids"})
        input_fields = set(hook_context.input_fields or [])
        if hook_context.type in (
            "Scene.Update.Post",
            "Gallery.Update.Post",
        ) and input_fields in [{"id", "tag_ids"}, {"ids", "tag_ids"}]:
            # Extract tag_ids from input (handles both single and bulk update inputs)
            tag_ids: plugin_input_models.UpdateIDs | list[str] | None = None
            if isinstance(
                hook_context.input,
                (
                    plugin_input_models.SceneUpdateInput,
                    plugin_input_models.GalleryUpdateInput,
                    plugin_input_models.BulkSceneUpdateInput,
                    plugin_input_models.BulkGalleryUpdateInput,
                ),
            ):
                tag_ids = hook_context.input.tag_ids

            # Skip if this is only removing tags
            if (
                isinstance(tag_ids, plugin_input_models.UpdateIDs)
                and tag_ids.mode == "REMOVE"
            ):
                item_type = (
                    "scene" if hook_context.type == "Scene.Update.Post" else "gallery"
                )
                exit_plugin(
                    f"Detected {item_type} update that only removes tags. Skipping plugin 'Renamer'."
                )

    # Check Stash version before proceeding
    stash_graphql.check_stash_version()

    # Handle plugin arguments (enable/disable/dryrun)
    if plugin_args:
        log.log_debug("--Starting Plugin 'Renamer'--")
        match plugin_args:
            case "enable":
                log.log_info("Enable hook")
                success = _config_edit("enable_hook", True)
                if not success:
                    log.log_error("Script failed to change the value")
                exit_plugin("script finished")
            case "disable":
                log.log_info("Disable hook")
                success = _config_edit("enable_hook", False)
                if not success:
                    log.log_error("Script failed to change the value")
                exit_plugin("script finished")
            case "dryrun":
                if config_loader.CONFIG.dry_run:
                    log.log_info("Disable dryrun")
                    success = _config_edit("dry_run", False)
                else:
                    log.log_info("Enable dryrun")
                    success = _config_edit("dry_run", True)
                if not success:
                    log.log_error("Script failed to change the value")
                exit_plugin("script finished")
    else:
        if not config_loader.CONFIG.enable_hook:
            exit_plugin("Hook disabled")
        log.log_debug("--Starting Hook 'Renamer'--")
        if hook_context is None:
            exit_plugin("Invalid hook context")
        hook_type = hook_context.type

    # Initialize emoji language after GraphQL is available
    config_loader.initialize_emoji_language(stash_graphql.get_stash_language)

    # ============================================================================
    # MAIN EXECUTION FLOW
    # ============================================================================

    if plugin_args:
        match plugin_args:
            case "task_scenes":
                _process_task_items(
                    stash_graphql.graphql_find_scene,
                    "scene",
                    stash_graphql.graphql_get_scene,
                    data_extraction.extract_scene_info,
                )
            case "task_galleries":
                _process_task_items(
                    stash_graphql.graphql_find_gallery,
                    "gallery",
                    stash_graphql.graphql_get_gallery,
                    data_extraction.extract_gallery_info,
                )
            case _:
                log.log_warning(f"Unknown plugin_args: {plugin_args}")
    else:
        # Handle different hook types
        # hook_context is guaranteed to be non-None here (checked above)
        assert hook_context is not None
        match hook_type:
            case "Gallery.Update.Post":
                try:
                    _process_item_rename(
                        hook_context.id,
                        "gallery",
                        stash_graphql.graphql_get_gallery,
                        data_extraction.extract_gallery_info,
                    )
                except RuntimeError as err:
                    log.log_error(f"gallery renamer error: {err}")
                    traceback.print_exc()
            case "Scene.Update.Post":
                try:
                    _process_item_rename(
                        hook_context.id,
                        "scene",
                        stash_graphql.graphql_get_scene,
                        data_extraction.extract_scene_info,
                    )
                except RuntimeError as err:
                    log.log_error(f"scene renamer error: {err}")
                    traceback.print_exc()
            case _:
                log.log_warning(f"Unknown hook type: {hook_type}")

    exit_plugin("Successful!")
