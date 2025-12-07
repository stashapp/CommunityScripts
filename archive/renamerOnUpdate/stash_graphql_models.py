"""Pydantic models for Stash GraphQL API responses."""

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    computed_field,
    field_validator,
    model_validator,
)


# Validation helper functions
def validate_rating100_range(v: int | None) -> int | None:
    """Validate rating100 is in valid range (1-100).

    Args:
        v: Rating value to validate

    Returns:
        The validated rating value

    Raises:
        ValueError: If rating is not None and outside the 1-100 range
    """
    if v is not None and (v < 1 or v > 100):
        raise ValueError(f"rating100 must be between 1 and 100, got {v}")
    return v


# Supporting types
class StashIDModel(BaseModel):
    """StashID model for external database IDs."""

    endpoint: str
    stash_id: str


class FingerprintModel(BaseModel):
    """Fingerprint model for file fingerprints."""

    type: str
    value: str


class TagModel(BaseModel):
    """Tag model."""

    id: str
    name: str


class StudioParentModel(BaseModel):
    """Parent studio model."""

    id: str
    name: str


class StudioModel(BaseModel):
    """Studio model."""

    id: str
    name: str
    parent_studio: StudioParentModel | None = None


class PerformerModel(BaseModel):
    """Performer model."""

    id: str
    name: str
    gender: str | None = None
    favorite: bool = False
    rating100: int | None = None
    stash_ids: list[StashIDModel] = Field(default_factory=list)

    @field_validator("rating100")
    @classmethod
    def validate_rating100(cls, v: int | None) -> int | None:
        """Validate rating100 is in valid range (1-100)."""
        return validate_rating100_range(v)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def name_inverted(self) -> str:
        """Inverted name from 'FirstName LastName' to 'LastName, FirstName'.

        For single names, returns the name unchanged.
        For two-part names, returns 'LastName, FirstName'.
        For multi-part names, returns 'LastName, First Middle...'.
        """
        parts = self.name.split()
        if len(parts) <= 1:
            return self.name
        elif len(parts) == 2:
            return f"{parts[1]}, {parts[0]}"
        else:
            return f"{parts[-1]}, {' '.join(parts[:-1])}"


class GroupParentModel(BaseModel):
    """Parent group model (nested in containing_groups)."""

    id: str
    name: str


class GroupContainingGroupModel(BaseModel):
    """Containing group model."""

    group: GroupParentModel


class GroupModel(BaseModel):
    """Group model."""

    id: str
    name: str
    date: str | None = None
    containing_groups: list[GroupContainingGroupModel] = Field(default_factory=list)


class SceneGroupModel(BaseModel):
    """Scene group model (relationship between scene and group)."""

    group: GroupModel
    scene_index: int | None = None

    @field_validator("scene_index")
    @classmethod
    def validate_scene_index(cls, v: int | None) -> int | None:
        """Validate scene_index is non-negative.

        Args:
            v: Scene index value to validate

        Returns:
            The validated scene index value

        Raises:
            ValueError: If scene_index is not None and negative
        """
        if v is not None and v < 0:
            raise ValueError(f"scene_index must be non-negative, got {v}")
        return v


class VideoFileModel(BaseModel):
    """Video file model for scenes."""

    id: str
    path: str
    video_codec: str | None = None
    audio_codec: str | None = None
    width: int | None = None
    height: int | None = None
    frame_rate: float | None = None
    duration: float | None = None
    bit_rate: int | None = None
    fingerprints: list[FingerprintModel] = Field(default_factory=list)

    @field_validator("width", "height")
    @classmethod
    def validate_dimensions(cls, v: int | None) -> int | None:
        """Validate width and height are positive.

        Args:
            v: Dimension value to validate

        Returns:
            The validated dimension value

        Raises:
            ValueError: If dimension is not None and not positive
        """
        if v is not None and v <= 0:
            raise ValueError(f"Dimension must be positive, got {v}")
        return v

    @field_validator("frame_rate")
    @classmethod
    def validate_frame_rate(cls, v: float | None) -> float | None:
        """Validate frame_rate is positive.

        Args:
            v: Frame rate value to validate

        Returns:
            The validated frame rate value

        Raises:
            ValueError: If frame_rate is not None and not positive
        """
        if v is not None and v <= 0:
            raise ValueError(f"frame_rate must be positive, got {v}")
        return v

    @field_validator("duration")
    @classmethod
    def validate_duration(cls, v: float | None) -> float | None:
        """Validate duration is non-negative.

        Args:
            v: Duration value to validate

        Returns:
            The validated duration value

        Raises:
            ValueError: If duration is not None and negative
        """
        if v is not None and v < 0:
            raise ValueError(f"duration must be non-negative, got {v}")
        return v

    @field_validator("bit_rate")
    @classmethod
    def validate_bit_rate(cls, v: int | None) -> int | None:
        """Validate bit_rate is positive.

        Args:
            v: Bit rate value to validate

        Returns:
            The validated bit rate value

        Raises:
            ValueError: If bit_rate is not None and not positive
        """
        if v is not None and v <= 0:
            raise ValueError(f"bit_rate must be positive, got {v}")
        return v


class GalleryZipFileModel(BaseModel):
    """Zip file model for galleries (used when gallery.files contains zip files)."""

    id: str
    path: str
    fingerprints: list[FingerprintModel] = Field(default_factory=list)


class FolderModel(BaseModel):
    """Folder model."""

    id: str
    path: str


# Core entity models
class SceneModel(BaseModel):
    """Scene model matching SceneData fragment."""

    id: str
    title: str | None = None
    date: str | None = None
    rating100: int | None = None
    stash_ids: list[StashIDModel] = Field(default_factory=list)
    organized: bool = False
    code: str | None = None
    files: list[VideoFileModel] = Field(default_factory=list)
    studio: StudioModel | None = None
    tags: list[TagModel] = Field(default_factory=list)
    performers: list[PerformerModel] = Field(default_factory=list)
    groups: list[SceneGroupModel] = Field(default_factory=list)

    @field_validator("rating100")
    @classmethod
    def validate_rating100(cls, v: int | None) -> int | None:
        """Validate rating100 is in valid range (1-100)."""
        return validate_rating100_range(v)


class GalleryModel(BaseModel):
    """Gallery model matching GalleryData fragment.

    Note: Galleries are either folder-based (have folder) or zip-based (have files).
    Zip-based galleries should have at most one file in the files list.
    """

    id: str
    title: str | None = None
    date: str | None = None
    rating100: int | None = None
    organized: bool = False
    code: str | None = None
    folder: FolderModel | None = None
    files: list[GalleryZipFileModel] = Field(default_factory=list)
    studio: StudioModel | None = None
    tags: list[TagModel] = Field(default_factory=list)
    performers: list[PerformerModel] = Field(default_factory=list)

    @field_validator("rating100")
    @classmethod
    def validate_rating100(cls, v: int | None) -> int | None:
        """Validate rating100 is in valid range (1-100)."""
        return validate_rating100_range(v)

    @field_validator("files")
    @classmethod
    def validate_files_count(
        cls, v: list[GalleryZipFileModel]
    ) -> list[GalleryZipFileModel]:
        """Validate that gallery files list contains at most one zip file.

        Args:
            v: List of gallery zip files

        Returns:
            The validated list

        Raises:
            ValueError: If the list contains more than one file
        """
        if len(v) > 1:
            raise ValueError(
                f"Gallery files list should contain at most one zip file, got {len(v)} files"
            )
        return v

    @model_validator(mode="after")
    def validate_folder_and_files_mutually_exclusive(self) -> "GalleryModel":
        """Validate that gallery has either folder OR files, not both.

        Returns:
            The validated model

        Raises:
            ValueError: If gallery has both folder and files
        """
        if self.folder is not None and len(self.files) > 0:
            raise ValueError(
                "Gallery should have either a folder (folder-based gallery) or files (zip-based gallery), "
                f"but not both. Found folder: {self.folder.id if self.folder else None}, "
                f"files count: {len(self.files)}"
            )
        return self


# Response wrapper models
# Define result models first to avoid forward references
class FindScenesResultModel(BaseModel):
    """Result model for findScenes query."""

    count: int
    scenes: list[SceneModel] = Field(default_factory=list)


class FindGalleriesResultModel(BaseModel):
    """Result model for findGalleries query."""

    count: int
    galleries: list[GalleryModel] = Field(default_factory=list)


class FindSceneResponse(BaseModel):
    """Response wrapper for findScene query."""

    model_config = ConfigDict(populate_by_name=True)

    find_scene: SceneModel | None = Field(None, alias="findScene")


class FindScenesResponse(BaseModel):
    """Response wrapper for findScenes query."""

    model_config = ConfigDict(populate_by_name=True)

    find_scenes: FindScenesResultModel = Field(alias="findScenes")


class FindGalleryResponse(BaseModel):
    """Response wrapper for findGallery query."""

    model_config = ConfigDict(populate_by_name=True)

    find_gallery: GalleryModel | None = Field(None, alias="findGallery")


class FindGalleriesResponse(BaseModel):
    """Response wrapper for findGalleries query."""

    model_config = ConfigDict(populate_by_name=True)

    find_galleries: FindGalleriesResultModel = Field(alias="findGalleries")


class FindFolderResponse(BaseModel):
    """Response wrapper for findFolder query."""

    model_config = ConfigDict(populate_by_name=True)

    find_folder: FolderModel | None = Field(None, alias="findFolder")


class FindStudioResponse(BaseModel):
    """Response wrapper for findStudio query."""

    model_config = ConfigDict(populate_by_name=True)

    find_studio: StudioModel | None = Field(None, alias="findStudio")


class FindGroupResponse(BaseModel):
    """Response wrapper for findGroup query."""

    model_config = ConfigDict(populate_by_name=True)

    find_group: GroupModel | None = Field(None, alias="findGroup")


class FindFileModel(BaseModel):
    """File model for FindFiles query."""

    id: str
    path: str


class FindFilesResultModel(BaseModel):
    """Result model for findFiles query."""

    files: list[FindFileModel] = Field(default_factory=list)


class FindFilesResponse(BaseModel):
    """Response wrapper for findFiles query."""

    model_config = ConfigDict(populate_by_name=True)

    find_files: FindFilesResultModel = Field(alias="findFiles")


# System types
class VersionResponse(BaseModel):
    """Response wrapper for version query."""

    model_config = ConfigDict(populate_by_name=True)

    version: "VersionModel" = Field(alias="version")


class VersionModel(BaseModel):
    """Version model."""

    version: str | None = None


class JobResponse(BaseModel):
    """Response wrapper for findJob query."""

    model_config = ConfigDict(populate_by_name=True)

    find_job: "JobModel" = Field(alias="findJob")


class JobModel(BaseModel):
    """Job model."""

    progress: float | None = None
    status: str
    error: str | None = None

    @field_validator("progress")
    @classmethod
    def validate_progress(cls, v: float | None) -> float | None:
        """Validate progress is in valid range (0-100).

        Args:
            v: Progress value to validate

        Returns:
            The validated progress value

        Raises:
            ValueError: If progress is not None and outside the 0-100 range
        """
        if v is not None and (v < 0 or v > 100):
            raise ValueError(f"progress must be between 0 and 100, got {v}")
        return v


class JobQueueModel(BaseModel):
    """Job model for job queue (includes all job fields)."""

    id: str
    status: str
    sub_tasks: list[str] | None = Field(default=None, alias="subTasks")
    description: str
    progress: float | None = None
    start_time: str | None = Field(None, alias="startTime")
    end_time: str | None = Field(None, alias="endTime")
    add_time: str = Field(alias="addTime")
    error: str | None = None

    model_config = ConfigDict(populate_by_name=True)

    @field_validator("progress")
    @classmethod
    def validate_progress(cls, v: float | None) -> float | None:
        """Validate progress is in valid range (0-100).

        Args:
            v: Progress value to validate

        Returns:
            The validated progress value

        Raises:
            ValueError: If progress is not None and outside the 0-100 range
        """
        if v is not None and (v < 0 or v > 100):
            raise ValueError(f"progress must be between 0 and 100, got {v}")
        return v


class JobQueueResponse(BaseModel):
    """Response wrapper for jobQueue query."""

    model_config = ConfigDict(populate_by_name=True)

    job_queue: list[JobQueueModel] = Field(default_factory=list, alias="jobQueue")


class MetadataScanResponse(BaseModel):
    """Response wrapper for metadataScan mutation."""

    model_config = ConfigDict(populate_by_name=True)

    metadata_scan: str = Field(alias="metadataScan")


class ConfigurationInterfaceModel(BaseModel):
    """Interface configuration model."""

    language: str | None = None


class ConfigurationModel(BaseModel):
    """Configuration model."""

    interface: ConfigurationInterfaceModel


class ConfigurationResponse(BaseModel):
    """Response wrapper for configuration query."""

    model_config = ConfigDict(populate_by_name=True)

    configuration: ConfigurationModel = Field(alias="configuration")
