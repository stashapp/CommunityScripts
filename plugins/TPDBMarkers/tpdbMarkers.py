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
SKIP_TAG = "[TPDB: Skip Marker]"

def processScene(scene):
    has_markers = len(scene["scene_markers"]) > 0
    has_skip_tag = any([t["name"] == SKIP_TAG for t in scene["tags"]])
    if has_markers or has_skip_tag:
        log.debug(f"Skipping. has_markers: {has_markers}, has_skip_tag: {has_skip_tag}")
        return

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
                        markers.append(marker)

                    if len(markers) > 0:
                        log.info("Saving markers")
                        mp.import_scene_markers(stash, markers, scene["id"], 15)
                    # skip if there is already a movie linked
                    if settings["createMovieFromScene"] and len(scene.get("movies", [])) == 0:
                        movies=[]
                        for m in data["movies"]:
                           movie=processMovie(m)
                           if movie:
                               movies.append({"movie_id": movie["id"],"scene_index":None})
                        log.debug(movies)
                        if len(movies) > 0:
                           stash.update_scene({'id':scene["id"],"movies":movies})
            else:
                log.error('bad response from tpdb: %s' % (res.status_code,))

#            log.debug(res.content)


def processAll():
    log.info("Getting scene count")
    skip_sync_tag_id = stash.find_tag(SKIP_TAG, create=True).get("id")
    scene_filter = {
        "stash_id_endpoint": {
            "endpoint": TPDB_ENDPOINT,
            "modifier": "NOT_NULL",
            "stash_id": "",
        },
        "has_markers": "false",
        "tags": {
            "value": skip_sync_tag_id,
            "modifier": "EXCLUDES",
        },
    }
    count = stash.find_scenes(
        f=scene_filter,
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
            f=scene_filter,
            filter={"page": r, "per_page": per_page},
        )
        for s in scenes:
            processScene(s)
            i = i + 1
            log.progress((i / count))
            time.sleep(1)

def processMovie(m):
    log.debug(m)
    log.debug(m.keys())
    # check if the movie exists with the url, then match to the scene
    sm = stash.find_movies(
      f={
        "url": {
          "modifier": "EQUALS",
          "value": m["url"],
        }
      }
    )
    log.debug("sm: %s" % (sm,))
    if len(sm) >0:
        return sm[0]
    # find the movie by name
    sm=stash.find_movies(q=m['title'])
    for mov in sm:
        if mov['name']==m['title']:
          return mov


    # just create the movie with the details from tpdb
    new_movie={
       'name': m['title'],
       'date': m['date'],
       'synopsis': m['description'],
       'front_image': m['image'],
       'back_image': m['back_image'],
       'url': m['url'],
    }
    if m['site']:
        studio=stash.find_studio(m['site'],create=True)
        if studio:
            new_movie['studio_id']=studio['id']

    mov=stash.create_movie(new_movie)
    log.debug(mov)
    return mov





json_input = json.loads(sys.stdin.read())

FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)

config = stash.get_configuration()["plugins"]
settings = {
    "disableSceneMarkerHook": False,
    "createMovieFromScene":True,
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
                scene = stash.find_scene(json_input["args"]["scene_id"])
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
