import json
import sys
import re
import datetime as dt
import stashapi.log as log
from stashapi.tools import human_bytes
from stashapi.stash_types import PhashDistance
from stashapi.stashapp import StashInterface

FRAGMENT = json.loads(sys.stdin.read())
MODE = FRAGMENT["args"]["mode"]
stash = StashInterface(FRAGMENT["server_connection"])
dupe_marker_tag = stash.find_tag("[Marker: Duplicate]", create=True).get("id")


def findScenesWithMarkers():
    totalDupes = 0
    scenes = stash.find_scenes(f={"has_markers": "true"}, fragment="id")
    for scene in scenes:
        totalDupes += checkScene(scene)
    log.info("Found %d duplicate markers across %d scenes" % (totalDupes, len(scenes)))


def addMarkerTag(marker):
    query = """
      mutation SceneMarkerUpdate($input:SceneMarkerUpdateInput!) {
          sceneMarkerUpdate(input: $input) {
              id
          }
      }
  """
    oldTags = [tag["id"] for tag in marker["tags"]]
    if dupe_marker_tag in oldTags:
        return
    oldTags.append(dupe_marker_tag)
    newMarker = {"id": marker["id"], "tag_ids": oldTags}
    stash._callGraphQL(query, {"input": newMarker})
    # stash.update_scene_marker(newMarker, "id")


def checkScene(scene):
    seen = set()
    dupes = []
    markers = stash.find_scene_markers(scene["id"])
    # find duplicate pairs
    for marker in markers:
        sortidx = ";".join(
            [
                str(marker["title"]),
                str(marker["seconds"]),
                str(marker["primary_tag"]["id"]),
            ]
        )
        if sortidx not in seen:
            seen.add(sortidx)
        else:
            dupes.append(marker)
    # add tag
    if dupes:
        log.debug("Found %d duplicate markers in scene %s" % (len(dupes), scene["id"]))
        for dupe in dupes:
            addMarkerTag(dupe)
    return len(dupes)


def main():
    if MODE == "search":
        findScenesWithMarkers()
    log.exit("Plugin exited normally.")


if __name__ == "__main__":
    main()
