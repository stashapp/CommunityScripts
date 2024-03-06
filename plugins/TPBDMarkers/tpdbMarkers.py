import stashapi.log as log
from stashapi.stashapp import StashInterface
import stashapi.marker_parse as mp
import sys
import requests
import json
import time


per_page = 100
request_s = requests.Session()


def processScene(scene):
    for sid in scene["stash_ids"]:
        if sid["endpoint"] == "https://theporndb.net/graphql":
            log.debug("Scene has a TPDB stash id, looking up %s " % (sid["stash_id"],))
            res = request_s.get(
                "https://api.theporndb.net/scenes/%s" % (sid["stash_id"],)
            )
            if res.status_code == 200:
                if "data" in res.json():
                    data = res.json()["data"]
                    markers = []
                    for m in data["markers"]:
                        log.debug(m)
                        marker = {
                            "title": m["title"],
                            "primary_tag": m["title"],
                            "tags": [],
                            "seconds": m["start_time"],
                        }
                        markers.append(marker)

                    if len(markers) > 0:
                        log.info("Saving markers")
                        mp.import_scene_markers(stash, markers, scene["id"], 15)


#            log.debug(res.content)


def processAll():
    log.info("Getting scene count")
    skip_sync_tag_id = stash.find_tag("[TPDB: Skip Marker]", create=True).get("id")
    count = stash.find_scenes(
        f={
            "stash_id_endpoint": {
                "endpoint": "https://theporndb.net/graphql",
                "modifier": "NOT_NULL",
                "stash_id": "",
            },
            "has_markers": "false",
            "tags": {
                "depth": 0,
                "excludes": [skip_sync_tag_id],
                "modifier": "INCLUDES_ALL",
                "value": [],
            },
        },
        filter={"per_page": 1},
        get_count=True,
    )[0]
    log.info(str(count) + " scenes to submit.")
    i = 0
    for r in range(1, int(count / per_page) + 1):
        log.info(
            "fetching data: %s - %s %0.1f%%"
            % (
                (r - 1) * per_page,
                r * per_page,
                (i / count) * 100,
            )
        )
        scenes = stash.find_scenes(
            f={
                "stash_id_endpoint": {
                    "endpoint": "https://theporndb.net/graphql",
                    "modifier": "NOT_NULL",
                    "stash_id": "",
                },
                "has_markers": "false",
            },
            filter={"page": r, "per_page": per_page},
        )
        for s in scenes:
            processScene(s)
            i = i + 1
            log.progress((i / count))
            time.sleep(1)


json_input = json.loads(sys.stdin.read())

FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)

config = stash.get_configuration()["plugins"]
settings = {
    "disableSceneMarkerHook": False,
}
if "tPdBmarkers" in config:
    settings.update(config["tPdBmarkers"])
log.debug("settings: %s " % (settings,))

# Set up the auth token for tpdb
if "https://theporndb.net/graphql" in [
    x["endpoint"] for x in stash.get_configuration()["general"]["stashBoxes"]
]:
    for x in stash.get_configuration()["general"]["stashBoxes"]:
        if x["endpoint"] == "https://theporndb.net/graphql":
            request_s.headers["Authorization"] = "Bearer %s" % (x["api_key"],)

    if "mode" in json_input["args"]:
        PLUGIN_ARGS = json_input["args"]["mode"]
        if "processScene" in PLUGIN_ARGS:
            processAll()
    elif "hookContext" in json_input["args"]:
        _id = json_input["args"]["hookContext"]["id"]
        _type = json_input["args"]["hookContext"]["type"]
        if _type == "Scene.Update.Post" and not settings["disableSceneMarkerHook"]:
            scene = stash.find_scene(_id)
            processScene(scene)

else:
    log.warning("The Porn DB endpoint not configured")
