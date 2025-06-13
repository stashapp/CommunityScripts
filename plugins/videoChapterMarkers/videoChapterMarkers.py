import stashapi.log as log
from stashapi.stashapp import StashInterface
import stashapi.marker_parse as mp
import sys
import json
import time
from pathlib import Path
import subprocess
import re

def extract_chapters_from_video(video_path):
    try:
        cmd = [
            "ffprobe", 
            "-v", "quiet",
            "-print_format", "json",
            "-show_chapters",
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            log.error(f"Error extracting chapters from {video_path}: {result.stderr}")
            return []
        
        chapters_data = json.loads(result.stdout)
        
        if "chapters" not in chapters_data or len(chapters_data["chapters"]) == 0:
            log.debug(f"No chapters found in {video_path}")
            return []
        
        markers = []
        for chapter in chapters_data["chapters"]:
            title = chapter.get("tags", {}).get("title", "Chapter")
            
            start_time = float(chapter.get("start_time", 0))
            
            marker = {
                "seconds": start_time,
                "primary_tag": "From Chapter",
                "tags": [],
                "title": title,
            }
            log.debug(marker)
            markers.append(marker)
        
        return markers
    
    except Exception as e:
        log.error(f"Error processing {video_path}: {str(e)}")
        return []

def processScene(scene):
    log.debug(scene["scene_markers"])
    # Only process scenes without existing markers
    if len(scene["scene_markers"]) == 0:
        for f in scene["files"]:
            video_path = f["path"]
            log.debug(f"Processing video: {video_path}")
            
            markers = extract_chapters_from_video(video_path)
            
            if len(markers) > 0:
                if len(markers) == 1 and markers[0]["seconds"] == 0:
                    log.info(f"Single chapter at the beginning in {video_path}, skipping import.")
                else:
                    log.info(f"Found {len(markers)} chapters in {video_path}")
                    mp.import_scene_markers(stash, markers, scene["id"], 15)
            else:
                log.info(f"No chapters found in {video_path}")

def processAll():
    query = {
        "has_markers": "false",
    }
    per_page = 100
    log.info("Getting scene count")
    count = stash.find_scenes(
        f=query,
        filter={"per_page": 1},
        get_count=True,
    )[0]
    log.info(str(count) + " scenes to process.")
    
    for r in range(1, int(count / per_page) + 2):
        i = (r - 1) * per_page
        log.info(
            "fetching data: %s - %s %0.1f%%"
            % (
                (r - 1) * per_page,
                r * per_page,
                (i / count) * 100,
            )
        )
        scenes = stash.find_scenes(
            f=query,
            filter={"page": r, "per_page": per_page},
        )
        for s in scenes:
            processScene(s)
            i = i + 1
            log.progress((i / count))

json_input = json.loads(sys.stdin.read())

FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)

if "mode" in json_input["args"]:
    PLUGIN_ARGS = json_input["args"]["mode"]
    if "processAll" == PLUGIN_ARGS:
        processAll()
if "hookContext" in json_input["args"]:
    _id = json_input["args"]["hookContext"]["id"]
    _type = json_input["args"]["hookContext"]["type"]
    if _type == "Scene.Update.Post":
        scene = stash.find_scene(_id)
        processScene(scene)
