import stashapi.log as log
from stashapi.stashapp import StashInterface
import stashapi.marker_parse as mp
import sys
from pathlib import Path
import json
import re
import time


def processScene(scene):
    log.debug(scene["scene_markers"])
    if len(scene["scene_markers"]) == 0:
        for f in scene["files"]:
            scriptfile = Path(f["path"]).parent / (Path(f["path"]).stem + ".funscript")
            log.debug(scriptfile)
            if scriptfile.exists():
                with open(scriptfile) as f2:
                    script_json = json.load(f2)
                    if "metadata" in script_json:
                        markers = []
                        if "chapters" in script_json["metadata"]:
                            for c in script_json["metadata"]["chapters"]:
                                name = c["name"]
                                if len(name) == 0:
                                    name = "#"
                                marker = {
                                    "seconds": sum(
                                        x * float(t)
                                        for x, t in zip(
                                            [3600, 60, 1],
                                            re.split(r"[:]", c["startTime"]),
                                        )
                                    ),
                                    "primary_tag": name,
                                    "tags": [],
                                    "title": name,
                                }
                                log.debug(marker)
                                markers.append(marker)
                            if len(markers) > 0:
                                mp.import_scene_markers(stash, markers, scene["id"], 15)


def processAll():
    query = {
        "has_markers": "false",
        "interactive": True,
    }
    per_page = 100
    log.info("Getting scene count")
    count = stash.find_scenes(
        f=query,
        filter={"per_page": 1},
        get_count=True,
    )[0]
    log.info(str(count) + " scenes to process.")
    #    i = 0
    # 98
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
            time.sleep(2)


json_input = json.loads(sys.stdin.read())

FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)

if "mode" in json_input["args"]:
    PLUGIN_ARGS = json_input["args"]["mode"]
    if "processAll" == PLUGIN_ARGS:
        processAll()
elif "hookContext" in json_input["args"]:
    _id = json_input["args"]["hookContext"]["id"]
    _type = json_input["args"]["hookContext"]["type"]
    if _type == "Scene.Update.Post":
        scene = stash.find_scene(_id)
        processScene(scene)
