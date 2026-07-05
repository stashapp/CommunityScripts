import stashapi.log as log
from stashapi.stashapp import StashInterface
import sys
import json

PERFORMER_PAGE_SIZE = 100
SCENE_UPDATE_BATCH = 1000


def processAll():
    exclusion_marker_tag_id = None
    if settings["excludeSceneWithTag"] != "":
        exclussion_marker_tag = stash.find_tag(settings["excludeSceneWithTag"])
        if exclussion_marker_tag is not None:
            exclusion_marker_tag_id = exclussion_marker_tag['id']

    query = {
        "tags": {
            "modifier": "NOT_NULL",
        },
        "scene_count": {
            "modifier": "NOT_EQUALS",
            "value": 0,
        },
    }

    try:
        performersTotal = stash.find_performers(f=query, filter={"page": 0, "per_page": 1}, get_count=True)[0]
    except Exception:
        performersTotal = 0

    processed = 0
    page = 0

    while True:
        if performersTotal > 0:
            log.progress(min(processed / performersTotal, 1.0))

        performers = stash.find_performers(
            f=query,
            filter={"page": page, "per_page": PERFORMER_PAGE_SIZE},
            fragment="id name tags { id name }"
        )

        if not performers:
            log.info("Finished processing all performers.")
            break

        for perf in performers:
          performer_tags_ids = []
          performer_tags_names = []
          for performer_tag in perf.get("tags",[]):
            if settings["excludeTagWithIgnoreAutoTag"] and performer_tag["ignore_auto_tag"]:
                continue
            performer_tags_ids.append(performer_tag["id"])
            performer_tags_names.append(performer_tag["name"])

            if not performer_tags_ids:
                processed += 1
                continue

            scene_query = {
                "performers": {
                    "value": [perf["id"]],
                    "modifier": "INCLUDES_ALL"
                }
            }
            if settings['excludeSceneOrganized']:
                scene_query["organized"] = False
            if exclusion_marker_tag_id is not None:
                 scene_query["tags"] = {
                    "value": [exclusion_marker_tag_id],
                    "modifier": "EXCLUDES"
                }

            performer_scenes = stash.find_scenes(f=scene_query, fragment='id')
            if not performer_scenes:
                processed += 1
                continue

            performer_scene_ids = [scene['id'] for scene in performer_scenes]
            tags_string = ", ".join(performer_tags_names)
            context_msg = f"Performer: '{perf['name']}' | Tags: [{tags_string}]"

            log.info(f"Bulk updating {len(performer_scene_ids)} scenes ({context_msg})")

            for i in range(0, len(performer_scene_ids), SCENE_UPDATE_BATCH):
                batch = performer_scene_ids[i:i + SCENE_UPDATE_BATCH]
                stash.update_scenes(
                    {
                        "ids": batch,
                        "tag_ids": {"mode": "ADD", "ids": performer_tags_ids},
                    }
                )
            processed += 1
        page += 1


def processScene(scene: dict):
    if settings["excludeSceneWithTag"] != "":
        for tag in scene.get("tags", []):
            if tag["name"] == settings["excludeSceneWithTag"]:
                return

    if settings['excludeSceneOrganized'] and scene.get('organized'):
        return

    target_tag_ids = []
    for perf in scene.get("performers", []):
        for tag in perf.get("tags", []):
            if settings["excludeTagWithIgnoreAutoTag"] and tag["ignore_auto_tag"]:
                continue
            target_tag_ids.append(tag["id"])

    if not target_tag_ids:
        return

    stash.update_scenes({
        "ids": [scene["id"]],
        "tag_ids": {"mode": "ADD", "ids": list(set(target_tag_ids))}
    })


json_input = json.loads(sys.stdin.read())
FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)
config = stash.get_configuration()

settings = {
    "excludeSceneWithTag": "",
    "excludeSceneOrganized": False
}
if "tagScenesWithPerfTags" in config["plugins"]:
    settings.update(config["plugins"]["tagScenesWithPerfTags"])

if "mode" in json_input["args"]:
    PLUGIN_ARGS = json_input["args"]["mode"]
    if "processAll" in PLUGIN_ARGS:
        processAll()
elif "hookContext" in json_input["args"]:
    id = json_input["args"]["hookContext"]["id"]
    hook_type = json_input["args"]["hookContext"].get("type", "")

    if (
        (hook_type == "Scene.Update.Post" or hook_type == "Scene.Create.Post")
        and "inputFields" in json_input["args"]["hookContext"]
        and len(json_input["args"]["hookContext"]["inputFields"]) > 1
    ):
        # Enforce explicit studio object allocation inside our graphQL post-hook criteria
        scene = stash.find_scene(id, fragment="id organized tags { name } performers { id tags { id ignore_auto_tag } } studio { id }")
        if scene:
            processScene(scene)
