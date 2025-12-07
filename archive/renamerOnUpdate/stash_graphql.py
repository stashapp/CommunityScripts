"""GraphQL operations for interacting with Stash API."""

import time
from typing import Any

from gql import Client, gql
from pydantic import BaseModel, ValidationError

import config_loader
import log
from stash_graphql_models import (
    ConfigurationResponse,
    FindFolderResponse,
    FindGalleriesResponse,
    FindGalleryResponse,
    FindGroupResponse,
    FindSceneResponse,
    FindScenesResponse,
    FindStudioResponse,
    FolderModel,
    GalleryModel,
    GroupModel,
    JobQueueResponse,
    JobResponse,
    MetadataScanResponse,
    SceneModel,
    StudioModel,
    VersionResponse,
)

# GraphQL client - initialized by initialize_client()
_gql_client: Client | None = None

# Minimum required Stash version (major, minor, patch)
# Patch version is optional - if not specified, defaults to 0
MIN_STASH_VERSION = (0, 29)


def initialize_client(client: Client) -> None:
    """Initialize the GraphQL client for this module.

    Args:
        client: The GraphQL client instance to use
    """
    global _gql_client
    _gql_client = client


def call_graphql(query: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
    """Execute a GraphQL query using the shared client."""
    if _gql_client is None:
        raise RuntimeError(
            "GraphQL client not initialized. Call initialize_client() first."
        )
    try:
        result: dict[str, Any] = _gql_client.execute(
            gql(query), variable_values=variables
        )
        return result
    except Exception as e:
        # We can't call exit_plugin here since it's in the main module
        # So we'll raise and let the caller handle it
        raise RuntimeError(f"GraphQL error: {e}") from e


def _validate_response[T: BaseModel](
    result: dict[str, Any], model_class: type[T], context: str = ""
) -> T:
    """Validate GraphQL response against a Pydantic model.

    Args:
        result: Raw GraphQL response dictionary
        model_class: Pydantic model class to validate against
        context: Optional context string for error messages

    Returns:
        Validated Pydantic model instance

    Note:
        This function will call exit_plugin and exit the plugin if validation fails.
    """
    try:
        return model_class.model_validate(result)
    except ValidationError as e:
        # Late import to avoid circular dependency
        from renamerOnUpdate import exit_plugin

        error_msg = (
            f"GraphQL response validation failed{': ' + context if context else ''}"
        )
        exit_plugin(f"[FATAL] {error_msg}", e)


def check_stash_version() -> None:
    """Check that Stash version meets the minimum requirement.

    Raises:
        SystemExit: If the version check fails or version is too old
    """
    # Late import to avoid circular dependency
    from renamerOnUpdate import exit_plugin

    # Extract minimum version components (patch defaults to 0 if not provided)
    min_major = MIN_STASH_VERSION[0]
    min_minor = MIN_STASH_VERSION[1]
    min_patch = MIN_STASH_VERSION[2] if len(MIN_STASH_VERSION) > 2 else 0

    # Format minimum version string
    if min_patch > 0:
        min_version_str = f"v{min_major}.{min_minor}.{min_patch}"
    else:
        min_version_str = f"v{min_major}.{min_minor}.0"

    query = """
    query {
        version {
            version
        }
    }
    """
    try:
        result = call_graphql(query)
        version_response = _validate_response(result, VersionResponse, "version check")
        version_str_original = (
            version_response.version.version if version_response.version.version else ""
        )

        if not version_str_original:
            error_msg = f"Could not retrieve Stash version. Please ensure you are running Stash {min_version_str} or later."
            log.log_error(f"[FATAL] {error_msg}")
            exit_plugin(f"[FATAL] {error_msg}", None)

        # Parse version string (e.g., "v0.29.3" -> (0, 29, 3))
        # Remove 'v' prefix if present
        version_str = version_str_original.lstrip("v")
        version_parts = version_str.split(".")

        if len(version_parts) < 2:
            error_msg = f"Invalid version format: {version_str_original}. Expected format: v{min_major}.{min_minor}.x or {min_major}.{min_minor}.x"
            log.log_error(f"[FATAL] {error_msg}")
            exit_plugin(f"[FATAL] {error_msg}", None)

        try:
            major = int(version_parts[0])
            minor = int(version_parts[1])
            # Patch version defaults to 0 if not present
            patch = int(version_parts[2]) if len(version_parts) > 2 else 0
        except ValueError:
            error_msg = f"Could not parse version numbers from: {version_str_original}"
            log.log_error(f"[FATAL] {error_msg}")
            exit_plugin(f"[FATAL] {error_msg}", None)

        # Check if version meets minimum requirement (major.minor.patch)
        version_too_old = (
            major < min_major
            or (major == min_major and minor < min_minor)
            or (major == min_major and minor == min_minor and patch < min_patch)
        )

        if version_too_old:
            error_msg = f"Stash version {version_str_original} is too old. This plugin requires Stash {min_version_str} or later. Please upgrade Stash."
            log.log_error(f"[FATAL] {error_msg}")
            exit_plugin(f"[FATAL] {error_msg}", None)

        log.log_debug(f"Stash version check passed: {version_str_original}")
    except (RuntimeError, ValueError) as e:
        error_msg = f"Failed to check Stash version. Please ensure you are running Stash {min_version_str} or later."
        log.log_error(f"[FATAL] {error_msg}: {e}")
        exit_plugin(f"[FATAL] {error_msg}", e)


# Shared GraphQL fragments for reuse across queries
_SCENE_DATA_FRAGMENT = """
fragment SceneData on Scene {
    id
    title
    date
    rating100
    stash_ids {
        endpoint
        stash_id
    }
    organized
    code
    files {
        id
        path
        video_codec
        audio_codec
        width
        height
        frame_rate
        duration
        bit_rate
        fingerprints {
            type
            value
        }
    }
    studio {
        id
        name
        parent_studio {
            id
            name
        }
    }
    tags {
        id
        name
    }
    performers {
        id
        name
        gender
        favorite
        rating100
        stash_ids {
            endpoint
            stash_id
        }
    }
    groups {
        group {
            id
            name
            date
            containing_groups {
                group {
                    id
                    name
                }
            }
        }
        scene_index
    }
}
"""

_GALLERY_DATA_FRAGMENT = """
fragment GalleryData on Gallery {
    id
    title
    date
    rating100
    organized
    code
    folder {
        id
        path
    }
    files {
        id
        path
        fingerprints {
            type
            value
        }
    }
    studio {
        id
        name
        parent_studio {
            id
            name
        }
    }
    tags {
        id
        name
    }
    performers {
        id
        name
        gender
        favorite
        rating100
        stash_ids {
            endpoint
            stash_id
        }
    }
}
"""


def graphql_get_scene(scene_id: str) -> SceneModel:
    """Get scene information by ID.

    Args:
        scene_id: Scene ID

    Returns:
        SceneModel instance

    Raises:
        RuntimeError: If scene not found or validation fails
    """
    query = f"""
    query FindScene($id: ID!) {{
        findScene(id: $id) {{
            ...SceneData
        }}
    }}
    {_SCENE_DATA_FRAGMENT}
    """
    variables = {"id": scene_id}
    result = call_graphql(query, variables)
    response = _validate_response(result, FindSceneResponse, f"findScene({scene_id})")
    if response.find_scene is None:
        raise RuntimeError(f"Scene with ID {scene_id} not found")
    return response.find_scene


# used for task mode
def graphql_find_scene(per_page: int, direc: str = "DESC") -> FindScenesResponse:
    """Find scenes with pagination.

    Args:
        per_page: Number of results per page
        direc: Sort direction ("ASC" or "DESC")

    Returns:
        FindScenesResponse instance with scenes and pagination info
    """
    query = f"""
    query FindScenes($filter: FindFilterType) {{
        findScenes(filter: $filter) {{
            count
            scenes {{
                ...SceneData
            }}
        }}
    }}
    {_SCENE_DATA_FRAGMENT}
    """
    # ASC DESC
    variables = {
        "filter": {
            "direction": direc,
            "page": 1,
            "per_page": per_page,
            "sort": "updated_at",
        }
    }
    result = call_graphql(query, variables)
    return _validate_response(result, FindScenesResponse, "findScenes")


def graphql_get_gallery(gallery_id: str) -> GalleryModel:
    """Get gallery information by ID.

    Args:
        gallery_id: Gallery ID

    Returns:
        GalleryModel instance

    Raises:
        RuntimeError: If gallery not found or validation fails
    """
    query = f"""
    query FindGallery($id: ID!) {{
        findGallery(id: $id) {{
            ...GalleryData
        }}
    }}
    {_GALLERY_DATA_FRAGMENT}
    """
    variables = {"id": gallery_id}
    result = call_graphql(query, variables)
    response = _validate_response(
        result, FindGalleryResponse, f"findGallery({gallery_id})"
    )
    if response.find_gallery is None:
        raise RuntimeError(f"Gallery with ID {gallery_id} not found")
    return response.find_gallery


# used for task mode
def graphql_find_gallery(per_page: int, direc: str = "DESC") -> FindGalleriesResponse:
    """Find galleries with pagination.

    Args:
        per_page: Number of results per page
        direc: Sort direction ("ASC" or "DESC")

    Returns:
        FindGalleriesResponse instance with galleries and pagination info
    """
    query = f"""
    query FindGalleries($filter: FindFilterType) {{
        findGalleries(filter: $filter) {{
            count
            galleries {{
                ...GalleryData
            }}
        }}
    }}
    {_GALLERY_DATA_FRAGMENT}
    """
    # ASC DESC
    variables = {
        "filter": {
            "direction": direc,
            "page": 1,
            "per_page": per_page,
            "sort": "updated_at",
        }
    }
    result = call_graphql(query, variables)
    return _validate_response(result, FindGalleriesResponse, "findGalleries")


def graphql_get_folder(folder_id: str) -> FolderModel:
    """Get folder information by ID.

    Args:
        folder_id: Folder ID

    Returns:
        FolderModel instance

    Raises:
        RuntimeError: If folder not found or validation fails
    """
    query = """
    query FindFolder($id: ID!) {
        findFolder(id: $id) {
            id
            path
        }
    }
    """
    variables = {"id": folder_id}
    result = call_graphql(query, variables)
    response = _validate_response(
        result, FindFolderResponse, f"findFolder({folder_id})"
    )
    if response.find_folder is None:
        raise RuntimeError(f"Folder with ID {folder_id} not found")
    return response.find_folder


def graphql_metadata_scan(paths: list[str]) -> str:
    """Trigger a metadata scan for the given paths.

    Args:
        paths: List of directory paths to scan

    Returns:
        Job ID for the metadata scan operation
    """
    query = """
    mutation MetadataScan($input: ScanMetadataInput!) {
        metadataScan(input: $input)
    }
    """
    variables = {"input": {"paths": paths}}
    result = call_graphql(query, variables)
    response = _validate_response(result, MetadataScanResponse, "metadataScan")
    return response.metadata_scan


def _graphql_find_job(job_id: str) -> JobResponse:
    """Get job status by ID.

    Returns:
        JobResponse instance
    """
    query = """
    query FindJob($input: FindJobInput!) {
        findJob(input: $input) {
            progress
            status
            error
        }
    }
    """
    variables = {"input": {"id": job_id}}
    result = call_graphql(query, variables)
    return _validate_response(result, JobResponse, f"findJob({job_id})")


def wait_for_metadata_scan(job_id: str, timeout: int | None = None) -> None:
    """Wait for a metadata scan job to complete.

    Args:
        job_id: Job ID from metadataScan mutation
        timeout: Maximum time to wait in seconds. If None, uses config_loader.CONFIG.metadata_scan_timeout (default: 60)

    Raises:
        TimeoutError: If the job doesn't complete within the timeout
        RuntimeError: If the job fails
    """
    if timeout is None:
        timeout = config_loader.CONFIG.metadata_scan_timeout

    start_time = time.time()
    while time.time() - start_time < timeout:
        job_response = _graphql_find_job(job_id)
        job = job_response.find_job
        status = job.status

        match status:
            case "FINISHED":
                if job.error:
                    raise RuntimeError(f"Metadata scan job failed: {job.error}")
                return
            case "CANCELLED" | "FAILED":
                error = job.error if job.error else "Unknown error"
                raise RuntimeError(f"Metadata scan job {status.lower()}: {error}")

        # Wait a bit before checking again
        time.sleep(0.5)

    raise TimeoutError(
        f"Metadata scan job {job_id} did not complete within {timeout} seconds"
    )


def graphql_get_studio(studio_id: str) -> StudioModel:
    """Get studio information by ID.

    Args:
        studio_id: Studio ID

    Returns:
        StudioModel instance

    Raises:
        RuntimeError: If studio not found or validation fails
    """
    query = """
        query FindStudio($id:ID!) {
            findStudio(id: $id) {
                id
                name
                parent_studio {
                    id
                    name
                }
            }
        }
    """
    variables = {"id": studio_id}
    result = call_graphql(query, variables)
    response = _validate_response(
        result, FindStudioResponse, f"findStudio({studio_id})"
    )
    if response.find_studio is None:
        raise RuntimeError(f"Studio with ID {studio_id} not found")
    return response.find_studio


def traverse_studio_hierarchy(studio: StudioModel) -> list[StudioModel]:
    """Traverse up the studio hierarchy and return all studios.

    Args:
        studio: Starting studio

    Returns:
        List of studios from root to leaf
    """
    studios = [studio]
    current = studio

    while current.parent_studio:
        parent = graphql_get_studio(current.parent_studio.id)
        studios.insert(0, parent)  # Insert at beginning for root-to-leaf order
        current = parent

    return studios


def graphql_get_group(group_id: str) -> GroupModel:
    """Get group information by ID.

    Args:
        group_id: Group ID

    Returns:
        GroupModel instance

    Raises:
        RuntimeError: If group not found or validation fails
    """
    query = """
        query FindGroup($id:ID!) {
            findGroup(id: $id) {
                id
                name
                date
                containing_groups {
                    group {
                        name
                        id
                    }
                }
            }
        }
    """
    variables = {"id": group_id}
    result = call_graphql(query, variables)
    response = _validate_response(result, FindGroupResponse, f"findGroup({group_id})")
    if response.find_group is None:
        raise RuntimeError(f"Group with ID {group_id} not found")
    return response.find_group


def graphql_remove_scenes_tag(id_scenes: list, id_tags: list) -> dict:
    """Remove tags from scenes.

    Args:
        id_scenes: List of scene IDs
        id_tags: List of tag IDs to remove

    Returns:
        Mutation result dictionary
    """
    query = """
    mutation BulkSceneUpdate($input: BulkSceneUpdateInput!) {
        bulkSceneUpdate(input: $input) {
            id
        }
    }
    """
    variables = {
        "input": {"ids": id_scenes, "tag_ids": {"ids": id_tags, "mode": "REMOVE"}}
    }
    return call_graphql(query, variables)


def graphql_remove_gallery_tag(id_galleries: list, id_tags: list) -> dict:
    """Remove tags from galleries.

    Args:
        id_galleries: List of gallery IDs
        id_tags: List of tag IDs to remove

    Returns:
        Mutation result dictionary
    """
    query = """
    mutation BulkGalleryUpdate($input: BulkGalleryUpdateInput!) {
        bulkGalleryUpdate(input: $input) {
            id
        }
    }
    """
    variables = {
        "input": {"ids": id_galleries, "tag_ids": {"ids": id_tags, "mode": "REMOVE"}}
    }
    return call_graphql(query, variables)


def _graphql_get_job_queue() -> JobQueueResponse:
    """Get the current job queue.

    Returns:
        JobQueueResponse instance with list of all jobs
    """
    query = """
    query JobQueue {
        jobQueue {
            id
            status
            subTasks
            description
            progress
            startTime
            endTime
            addTime
            error
        }
    }
    """
    result = call_graphql(query)
    return _validate_response(result, JobQueueResponse, "jobQueue")


def has_running_tasks(exclude_job_id: str | None = None) -> bool:
    """Check if there are any running or ready tasks in the job queue.

    Args:
        exclude_job_id: Optional job ID to exclude from the check (e.g., a job we just launched)

    Returns:
        True if there are any jobs with status "RUNNING" or "READY" (excluding the specified job), False otherwise
    """
    job_queue = _graphql_get_job_queue()
    for job in job_queue.job_queue:
        if job.id == exclude_job_id:
            continue
        if job.status in ("RUNNING", "READY"):
            return True
    return False


def get_stash_language() -> str:
    """Fetch the interface language from Stash configuration.

    Returns:
        Language code string (e.g., "en-US"), defaults to "en-US" if not available
    """
    query = """
    query {
        configuration {
            interface {
                language
            }
        }
    }
    """
    result = call_graphql(query)
    response = _validate_response(result, ConfigurationResponse, "configuration")
    language = response.configuration.interface.language
    return language if language else "en-US"
