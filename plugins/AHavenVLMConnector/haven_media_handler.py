"""
Haven Media Handler Module
Handles StashApp media operations and tag management
"""

import os
import zipfile
import shutil
from typing import List, Dict, Any, Optional, Tuple, Set
from datetime import datetime
import json

# Use PythonDepManager for dependency management
try:
    from PythonDepManager import ensure_import
    ensure_import("stashapi:stashapp-tools==0.2.58")
    
    from stashapi.stashapp import StashInterface, StashVersion
    import stashapi.log as log
except ImportError as e:
    print(f"stashapp-tools not found: {e}")
    print("Please ensure PythonDepManager is available and stashapp-tools is accessible")
    raise

import haven_vlm_config as config

# Global variables
tag_id_cache: Dict[str, int] = {}
vlm_tag_ids_cache: Set[int] = set()
stash_version: Optional[StashVersion] = None
end_seconds_support: bool = False

# Tag IDs
stash: Optional[StashInterface] = None
vlm_errored_tag_id: Optional[int] = None
vlm_tagme_tag_id: Optional[int] = None
vlm_base_tag_id: Optional[int] = None
vlm_tagged_tag_id: Optional[int] = None
vr_tag_id: Optional[int] = None
vlm_incorrect_tag_id: Optional[int] = None

def initialize(connection: Dict[str, Any]) -> None:
    """Initialize the media handler with StashApp connection"""
    global stash, vlm_errored_tag_id, vlm_tagme_tag_id, vlm_base_tag_id
    global vlm_tagged_tag_id, vr_tag_id, end_seconds_support, stash_version
    global vlm_incorrect_tag_id

    # Initialize the Stash API
    stash = StashInterface(connection)

    # Initialize "metadata" tags
    vlm_errored_tag_id = stash.find_tag(config.config.vlm_errored_tag_name, create=True)["id"]
    vlm_tagme_tag_id = stash.find_tag(config.config.vlm_tagme_tag_name, create=True)["id"]
    vlm_base_tag_id = stash.find_tag(config.config.vlm_base_tag_name, create=True)["id"]
    vlm_tagged_tag_id = stash.find_tag(config.config.vlm_tagged_tag_name, create=True)["id"]
    vlm_incorrect_tag_id = stash.find_tag(config.config.vlm_incorrect_tag_name, create=True)["id"]
    
    # Get VR tag from configuration
    vr_tag_name = stash.get_configuration()["ui"].get("vrTag", None)
    if not vr_tag_name:
        log.warning("No VR tag found in configuration")
        vr_tag_id = None
    else:
        vr_tag_id = stash.find_tag(vr_tag_name)["id"]

    stash_version = get_stash_version()
    end_second_support_beyond = StashVersion("v0.27.2-76648")
    end_seconds_support = stash_version > end_second_support_beyond

def get_stash_version() -> StashVersion:
    """Get the current StashApp version"""
    if not stash:
        raise RuntimeError("Stash interface not initialized")
    return stash.stash_version()

# ----------------- Tag Management Methods -----------------

def get_tag_ids(tag_names: List[str], create: bool = False) -> List[int]:
    """Get tag IDs for multiple tag names"""
    return [get_tag_id(tag_name, create) for tag_name in tag_names]

def get_tag_id(tag_name: str, create: bool = False) -> Optional[int]:
    """Get tag ID for a single tag name"""
    if tag_name not in tag_id_cache:
        stashtag = stash.find_tag(tag_name)
        if stashtag:
            tag_id_cache[tag_name] = stashtag["id"]
            return stashtag["id"]
        else:
            if not create:
                return None
            tag = stash.create_tag({
                "name": tag_name, 
                "ignore_auto_tag": True, 
                "parent_ids": [vlm_base_tag_id]
            })['id']
            tag_id_cache[tag_name] = tag
            vlm_tag_ids_cache.add(tag)
            return tag
    return tag_id_cache.get(tag_name)

def get_vlm_tags() -> List[int]:
    """Get all VLM-generated tags"""
    if len(vlm_tag_ids_cache) == 0:
        vlm_tags = [
            item['id'] for item in stash.find_tags(
                f={"parents": {"value": vlm_base_tag_id, "modifier": "INCLUDES"}}, 
                fragment="id"
            )
        ]
        vlm_tag_ids_cache.update(vlm_tags)
    else:
        vlm_tags = list(vlm_tag_ids_cache)
    return vlm_tags

def is_scene_tagged(tags: List[Dict[str, Any]]) -> bool:
    """Check if a scene has been tagged by VLM"""
    for tag in tags:
        if tag['id'] == vlm_tagged_tag_id:
            return True
    return False

def is_vr_scene(tags: List[Dict[str, Any]]) -> bool:
    """Check if a scene is VR content"""
    for tag in tags:
        if tag['id'] == vr_tag_id:
            return True
    return False

# ----------------- Scene Management Methods -----------------

def add_tags_to_video(video_id: int, tag_ids: List[int], add_tagged: bool = True) -> None:
    """Add tags to a video scene"""
    if add_tagged:
        tag_ids.append(vlm_tagged_tag_id)
    stash.update_scenes({
        "ids": [video_id], 
        "tag_ids": {"ids": tag_ids, "mode": "ADD"}
    })

def clear_all_tags_from_video(scene: Dict[str, Any]) -> None:
    """Clear all tags from a video scene using existing scene data"""
    scene_id = scene.get('id')
    if scene_id is None:
        log.error("Scene missing 'id' field")
        return
    
    current_tag_ids = [tag['id'] for tag in scene.get('tags', [])]
    if current_tag_ids:
        stash.update_scenes({
            "ids": [scene_id], 
            "tag_ids": {"ids": current_tag_ids, "mode": "REMOVE"}
        })
        log.info(f"Cleared {len(current_tag_ids)} tags from scene {scene_id}")

def clear_all_markers_from_video(video_id: int) -> None:
    """Clear all markers from a video scene"""
    markers = get_scene_markers(video_id)
    if markers:
        delete_markers(markers)
        log.info(f"Cleared all {len(markers)} markers from scene {video_id}")

def remove_vlm_tags_from_video(
    video_id: int, 
    remove_tagme: bool = True, 
    remove_errored: bool = True
) -> None:
    """Remove all VLM tags from a video scene"""
    vlm_tags = get_vlm_tags()
    if remove_tagme:
        vlm_tags.append(vlm_tagme_tag_id)
    if remove_errored:
        vlm_tags.append(vlm_errored_tag_id)
    stash.update_scenes({
        "ids": [video_id], 
        "tag_ids": {"ids": vlm_tags, "mode": "REMOVE"}
    })

def get_tagme_scenes() -> List[Dict[str, Any]]:
    """Get scenes tagged with VLM_TagMe"""
    return stash.find_scenes(
        f={"tags": {"value": vlm_tagme_tag_id, "modifier": "INCLUDES"}}, 
        fragment="id tags {id} files {path duration fingerprint(type: \"phash\")}"
    )

def add_error_scene(scene_id: int) -> None:
    """Add error tag to a scene"""
    stash.update_scenes({
        "ids": [scene_id], 
        "tag_ids": {"ids": [vlm_errored_tag_id], "mode": "ADD"}
    })

def remove_tagme_tag_from_scene(scene_id: int) -> None:
    """Remove VLM_TagMe tag from a scene"""
    stash.update_scenes({
        "ids": [scene_id], 
        "tag_ids": {"ids": [vlm_tagme_tag_id], "mode": "REMOVE"}
    })

# ----------------- Marker Management Methods -----------------

def add_markers_to_video_from_dict(
    video_id: int, 
    tag_timespans_dict: Dict[str, Dict[str, List[Any]]]
) -> None:
    """Add markers to video from timespan dictionary"""
    for _, tag_timespan_dict in tag_timespans_dict.items():
        for tag_name, time_frames in tag_timespan_dict.items():
            tag_id = get_tag_id(tag_name, create=True)
            if tag_id:
                add_markers_to_video(video_id, tag_id, tag_name, time_frames)

def get_incorrect_markers() -> List[Dict[str, Any]]:
    """Get markers tagged with VLM_Incorrect"""
    if end_seconds_support:
        return stash.find_scene_markers(
            {"tags": {"value": vlm_incorrect_tag_id, "modifier": "INCLUDES"}}, 
            fragment="id scene {id files{path}} primary_tag {id, name} seconds end_seconds"
        )
    else:
        return stash.find_scene_markers(
            {"tags": {"value": vlm_incorrect_tag_id, "modifier": "INCLUDES"}}, 
            fragment="id scene {id files{path}} primary_tag {id, name} seconds"
        )

def add_markers_to_video(
    video_id: int, 
    tag_id: int, 
    tag_name: str, 
    time_frames: List[Any]
) -> None:
    """Add markers to video for specific time frames"""
    for time_frame in time_frames:
        if end_seconds_support:
            stash.create_scene_marker({
                "scene_id": video_id, 
                "primary_tag_id": tag_id, 
                "tag_ids": [tag_id], 
                "seconds": time_frame.start, 
                "end_seconds": time_frame.end, 
                "title": tag_name
            })
        else:
            stash.create_scene_marker({
                "scene_id": video_id, 
                "primary_tag_id": tag_id, 
                "tag_ids": [tag_id], 
                "seconds": time_frame.start, 
                "title": tag_name
            })

def get_scene_markers(video_id: int) -> List[Dict[str, Any]]:
    """Get all markers for a scene"""
    return stash.get_scene_markers(video_id)

def write_scene_marker_to_file(
    marker: Dict[str, Any], 
    scene_file: str, 
    output_folder: str
) -> None:
    """Write scene marker data to file for analysis"""
    try:
        marker_id = marker['id']
        scene_id = marker['scene']['id']
        tag_name = marker['primary_tag']['name']
        
        # Create output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"marker_{marker_id}_scene_{scene_id}_{tag_name}_{timestamp}.json"
        output_path = os.path.join(output_folder, filename)
        
        # Prepare marker data
        marker_data = {
            "marker_id": marker_id,
            "scene_id": scene_id,
            "tag_name": tag_name,
            "seconds": marker.get("seconds"),
            "end_seconds": marker.get("end_seconds"),
            "scene_file": scene_file,
            "timestamp": timestamp
        }
        
        # Write to file
        with open(output_path, 'w') as f:
            json.dump(marker_data, f, indent=2)

    except Exception as e:
        log.error(f"Failed to write marker data: {e}")

def delete_markers(markers: List[Dict[str, Any]]) -> None:
    """Delete markers from StashApp"""
    for marker in markers:
        try:
            stash.destroy_scene_marker(marker['id'])
        except Exception as e:
            log.error(f"Failed to delete marker {marker['id']}: {e}")

def get_scene_markers_by_tag(
    video_id: int, 
    error_if_no_end_seconds: bool = True
) -> List[Dict[str, Any]]:
    """Get scene markers by tag with end_seconds support check"""
    if end_seconds_support:
        return stash.get_scene_markers(video_id)
    else:
        if error_if_no_end_seconds:
            log.error("End seconds not supported in this StashApp version")
            raise RuntimeError("End seconds not supported")
        return stash.get_scene_markers(video_id)

def remove_incorrect_tag_from_markers(markers: List[Dict[str, Any]]) -> None:
    """Remove VLM_Incorrect tag from markers"""
    marker_ids = [marker['id'] for marker in markers]
    for marker_id in marker_ids:
        try:
            stash.update_scene_marker({
                "id": marker_id,
                "tag_ids": {"ids": [vlm_incorrect_tag_id], "mode": "REMOVE"}
            })
        except Exception as e:
            log.error(f"Failed to remove incorrect tag from marker {marker_id}: {e}")

def remove_vlm_markers_from_video(video_id: int) -> None:
    """Remove all VLM markers from a video"""
    markers = get_scene_markers(video_id)
    vlm_tag_ids = get_vlm_tags()
    
    for marker in markers:
        if marker['primary_tag']['id'] in vlm_tag_ids:
            try:
                stash.destroy_scene_marker(marker['id'])
            except Exception as e:
                log.error(f"Failed to delete VLM marker {marker['id']}: {e}") 