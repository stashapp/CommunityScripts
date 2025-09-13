import stashapi.log as log
from stashapi.stashapp import StashInterface
import stashapi.marker_parse as mp
import sys
import requests
import json
import time


per_page = 100
request_s = requests.Session()

TPDB_ENDPOINT = "https://theporndb.net/graphql"
tags_cache = {}


def getTag(name):
    if name not in tags_cache:
        tag = stash.find_tag(name, create=True)
        tags_cache[name] = tag.get("id")
    return tags_cache[name]


def processScene(scene):
    getTag("[TPDBMarker]")
    for sid in scene["stash_ids"]:
        if sid["endpoint"] == TPDB_ENDPOINT:
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
                        if settings["addTPDBMarkerTag"]:
                            marker["tags"].append(int(getTag("[TPDBMarker]")))

                        if settings["addTPDBMarkerTitle"]:
                            marker["title"] = f'[TPDBMarker] {m["title"]}'

                        markers.append(marker)

                    if len(markers) > 0:
                        log.info("Saving markers")
                        if settings["overwriteMarkers"]:
                            stash.destroy_scene_markers(scene["id"])
                            mp.import_scene_markers(stash, markers, scene["id"], 15)
                        elif (len(scene["scene_markers"]) == 0 or settings["mergeMarkers"]):
                            mp.import_scene_markers(stash, markers, scene["id"], 15)
                    # skip if there is already a group linked
                    if settings["createMovieFromScene"] and len(scene.get("groups", [])) == 0:
                        groups=[]
                        for g in data["groups"]:
                            group=processGroup(g)
                            if group:
                                groups.append({"group_id": group["id"],"scene_index":None})
                        log.debug(groups)
                        if len(groups) > 0:
                           stash.update_scene({'id':scene["id"],"groups":groups})
            else:
                log.error('bad response from tpdb: %s' % (res.status_code,))

#            log.debug(res.content)


def processAll():
    log.info("Getting scene count")
    skip_sync_tag_id = stash.find_tag("[TPDB: Skip Marker]", create=True).get("id")
    f = {
        "stash_id_endpoint": {
            "endpoint": TPDB_ENDPOINT,
            "modifier": "NOT_NULL",
            "stash_id": "",
        },
        "tags": {
            "depth": 0,
            "excludes": [skip_sync_tag_id],
            "modifier": "INCLUDES_ALL",
            "value": [],
        },
    }
    if not settings["runOnScenesWithMarkers"]:
        f["has_markers"] = "false"
    count = stash.find_scenes(
        f,
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
        f = {
            "stash_id_endpoint": {
                "endpoint": TPDB_ENDPOINT,
                "modifier": "NOT_NULL",
                "stash_id": "",
            },
        }
        if not settings["runOnScenesWithMarkers"]:
            f["has_markers"] = "false"
        scenes = stash.find_scenes(
            f,
            filter={"page": r, "per_page": per_page},
        )
        for s in scenes:
            processScene(s)
            i = i + 1
            log.progress((i / count))
            time.sleep(1)

def processGroup(g):
    log.debug(g)
    log.debug(g.keys())
    # check if the group exists with the url, then match to the scene
    sg = stash.find_groups(
      f={
        "url": {
          "modifier": "EQUALS",
          "value": g["url"],
        }
      }
    )
    log.debug("sg: %s" % (sg,))
    if len(sg) >0:
        return sg[0]
    # find the group by name
    sg=stash.find_groups(q=g['title'])
    for grp in sg:
        if grp['name']==g['title']:
          return grp


    # just create the group with the details from tpdb
    new_group={
       'name': g['title'],
       'date': g['date'],
       'synopsis': g['description'],
       'front_image': g['image'],
       'back_image': g['back_image'],
       'urls': [g['url']],
    }
    if g['site']:
        studio=stash.find_studio(g['site'],create=True)
        if studio:
            new_group['studio_id']=studio['id']

    grp=stash.create_group(new_group)
    log.debug(grp)
    return grp





json_input = json.loads(sys.stdin.read())

FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)

config = stash.get_configuration()["plugins"]
settings = {
    "disableSceneMarkerHook": False,
    "createMovieFromScene":True,
    "addTPDBMarkerTag": False,
    "addTPDBMarkerTitle": False,
    "runOnScenesWithMarkers": False,
    "overwriteMarkers": False,
    "mergeMarkers": False,
}
if "tPdBmarkers" in config:
    settings.update(config["tPdBmarkers"])
log.debug("settings: %s " % (settings,))

# Set up the auth token for tpdb
if TPDB_ENDPOINT in [
    x["endpoint"] for x in stash.get_configuration()["general"]["stashBoxes"]
]:
    for x in stash.get_configuration()["general"]["stashBoxes"]:
        if x["endpoint"] == TPDB_ENDPOINT:
            request_s.headers["Authorization"] = "Bearer %s" % (x["api_key"],)

    if "mode" in json_input["args"]:
        PLUGIN_ARGS = json_input["args"]["mode"]
        if "processScene" == PLUGIN_ARGS:
            if "scene_id" in json_input["args"]:
                scene = stash.find_scene(
                    json_input["args"]["scene_id"],
                    fragment='id urls stash_ids {endpoint stash_id} groups {scene_index group {id}} tags {id} scene_markers {id} interactive files { path duration fingerprint(type: "phash")}')
                processScene(scene)
            else:
                processAll()
    elif "hookContext" in json_input["args"]:
        _id = json_input["args"]["hookContext"]["id"]
        _type = json_input["args"]["hookContext"]["type"]
        if _type == "Scene.Update.Post" and not settings["disableSceneMarkerHook"]:
            stash.run_plugin_task("TPDBMarkers", "Sync", args={"scene_id": _id})
#          scene = stash.find_scene(_id)
#            processScene(scene)

else:
    log.warning("The Porn DB endpoint not configured")
