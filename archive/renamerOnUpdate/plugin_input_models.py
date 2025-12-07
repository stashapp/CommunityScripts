"""Pydantic models for Stash plugin input structures.

These models only include fields that are actually used by the plugin.
Extra fields from Stash are ignored via extra = "ignore".

Reference: stash-develop/pkg/plugin/common/msg.go
"""

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class SessionCookieModel(BaseModel):
    """Model for http.Cookie structure when serialized to JSON."""

    Value: str

    class Config:
        """Pydantic config to ignore extra fields from Stash."""

        extra = "ignore"  # Ignore extra fields that Stash may add in the future


class StashServerConnection(BaseModel):
    """Connection details for plugin to connect to Stash server."""

    Scheme: str
    Host: str
    Port: int
    SessionCookie: SessionCookieModel

    class Config:
        """Pydantic config to ignore extra fields from Stash."""

        extra = "ignore"  # Ignore extra fields that Stash may add in the future


class UpdateIDs(BaseModel):
    """Update IDs structure with mode."""

    ids: list[str] = Field(default_factory=list)
    mode: Literal["SET", "ADD", "REMOVE"]

    class Config:
        """Pydantic config to ignore extra fields from Stash."""

        extra = "ignore"  # Ignore extra fields that Stash may add in the future


class SceneUpdateInput(BaseModel):
    """Scene update input structure."""

    id: str
    tag_ids: list[str] | UpdateIDs = Field(default_factory=list, alias="tag_ids")

    @field_validator("tag_ids", mode="before")
    @classmethod
    def validate_tag_ids(cls, v: Any) -> list[str] | UpdateIDs:
        """Validate tag_ids - can be list[str] or UpdateIDs dict."""
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, dict):
            # Check if it has mode field (UpdateIDs structure)
            if "mode" in v:
                return UpdateIDs(**v)
            # Otherwise treat as empty list (shouldn't happen but handle gracefully)
            return []
        return []

    class Config:
        """Pydantic config for field name population."""

        populate_by_name = True
        extra = "ignore"  # Ignore extra fields that Stash may add in the future


class GalleryUpdateInput(BaseModel):
    """Gallery update input structure."""

    id: str
    tag_ids: list[str] | UpdateIDs = Field(default_factory=list, alias="tag_ids")

    @field_validator("tag_ids", mode="before")
    @classmethod
    def validate_tag_ids(cls, v: Any) -> list[str] | UpdateIDs:
        """Validate tag_ids - can be list[str] or UpdateIDs dict."""
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, dict):
            # Check if it has mode field (UpdateIDs structure)
            if "mode" in v:
                return UpdateIDs(**v)
            # Otherwise treat as empty list (shouldn't happen but handle gracefully)
            return []
        return []

    class Config:
        """Pydantic config for field name population."""

        populate_by_name = True
        extra = "ignore"  # Ignore extra fields that Stash may add in the future


class BulkSceneUpdateInput(BaseModel):
    """Bulk scene update input structure."""

    ids: list[str]
    tag_ids: UpdateIDs | None = None

    class Config:
        """Pydantic config for field name population."""

        populate_by_name = True
        extra = "ignore"  # Ignore extra fields that Stash may add in the future


class BulkGalleryUpdateInput(BaseModel):
    """Bulk gallery update input structure."""

    ids: list[str]
    tag_ids: UpdateIDs | None = None

    class Config:
        """Pydantic config for field name population."""

        populate_by_name = True
        extra = "ignore"  # Ignore extra fields that Stash may add in the future


class HookContext(BaseModel):
    """Hook context structure passed to plugins.

    Note: The id field is typed as str (not int) to match GraphQL convention where
    IDs are strings. The raw plugin interface sends integers, but we normalize them
    to strings via a validator for consistency with GraphQL and to match the expected
    type in renamer functions.
    """

    id: str
    type: Literal["Scene.Update.Post", "Gallery.Update.Post"]
    input: (
        SceneUpdateInput
        | GalleryUpdateInput
        | BulkSceneUpdateInput
        | BulkGalleryUpdateInput
        | None
    ) = None
    input_fields: list[str] | None = Field(None, alias="inputFields")

    @field_validator("id", mode="before")
    @classmethod
    def normalize_id(cls, v: Any) -> str:
        """Normalize ID to string (handles int from raw interface, string from GraphQL)."""
        if isinstance(v, int):
            return str(v)
        if isinstance(v, str):
            return v
        if isinstance(v, dict) and "id" in v:
            # Handle nested dict case (shouldn't happen but handle gracefully)
            nested_id = v["id"]
            return str(nested_id) if isinstance(nested_id, int) else str(nested_id)
        return str(v)

    @model_validator(mode="before")
    @classmethod
    def validate_input(cls, data: Any) -> Any:
        """Validate input based on hook type.

        For single updates, parses into SceneUpdateInput or GalleryUpdateInput.
        For bulk updates (with 'ids' instead of 'id'), keeps as dict.
        Handles None input values (Stash may send null for input field).
        """
        if not isinstance(data, dict):
            return data

        # Handle None input - Stash may send null for input field
        if "input" in data and data["input"] is None:
            # Keep None as-is (field is now optional)
            return data

        # Parse input based on hook type
        if "input" in data and isinstance(data["input"], dict) and "type" in data:
            hook_type = data["type"]
            input_data = data["input"]

            # Check if this is a bulk update (has 'ids' instead of 'id')
            if "ids" in input_data and "id" not in input_data:
                # Bulk update - parse as BulkSceneUpdateInput or BulkGalleryUpdateInput
                try:
                    if hook_type == "Scene.Update.Post":
                        data["input"] = BulkSceneUpdateInput(**input_data)
                    elif hook_type == "Gallery.Update.Post":
                        data["input"] = BulkGalleryUpdateInput(**input_data)
                except Exception:
                    # If parsing fails, keep as dict (fallback)
                    pass
                return data

            # Single update - try to parse as structured input
            try:
                if hook_type == "Scene.Update.Post":
                    data["input"] = SceneUpdateInput(**input_data)
                elif hook_type == "Gallery.Update.Post":
                    data["input"] = GalleryUpdateInput(**input_data)
            except Exception:
                # If parsing fails (e.g., missing required fields), keep as dict
                pass

        return data

    class Config:
        """Pydantic config for field name population."""

        populate_by_name = True
        extra = "ignore"  # Ignore extra fields that Stash may add in the future


class TaskArgs(BaseModel):
    """Args structure for plugin tasks."""

    mode: Literal["enable", "disable", "dryrun", "task_scenes", "task_galleries"]
    # hookContext can be present from defaultArgs but we ignore it

    class Config:
        """Pydantic config for field name population."""

        populate_by_name = True
        extra = "ignore"  # Ignore extra fields like 'hookContext' if present


class HookArgs(BaseModel):
    """Args structure for plugin hooks."""

    hook_context: HookContext = Field(alias="hookContext")
    # mode can be present from defaultArgs but we ignore it

    class Config:
        """Pydantic config for field name population."""

        populate_by_name = True
        extra = "ignore"  # Ignore extra fields like 'mode' if present


class PluginInput(BaseModel):
    """Main plugin input structure."""

    server_connection: StashServerConnection = Field(alias="server_connection")
    args: TaskArgs | HookArgs

    @field_validator("args", mode="before")
    @classmethod
    def validate_args(cls, v: Any) -> TaskArgs | HookArgs:
        """Validate args - can contain hookContext or mode."""
        if not isinstance(v, dict):
            raise ValueError("args must be a dict")

        # If hookContext is present, parse as HookArgs (even if mode is also present)
        if "hookContext" in v and isinstance(v["hookContext"], dict):
            hook_context_data = v["hookContext"]
            # Parse HookContext first, then construct HookArgs using model_validate
            # Pass the full dict - Pydantic will ignore extra fields like 'mode'
            parsed_hook_context = HookContext(**hook_context_data)
            return HookArgs.model_validate({**v, "hookContext": parsed_hook_context})

        # If mode is present, parse as TaskArgs
        if "mode" in v:
            # Use model_validate to handle aliases properly
            return TaskArgs.model_validate({"mode": v["mode"]})

        raise ValueError("args must contain either 'hookContext' or 'mode'")

    class Config:
        """Pydantic config for field name population."""

        populate_by_name = True
        extra = "ignore"  # Ignore extra fields that Stash may add in the future
