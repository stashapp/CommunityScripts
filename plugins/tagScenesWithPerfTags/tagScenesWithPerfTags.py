import stashapi.log as log
from stashapi.stashapp import StashInterface
import sys
import json

PERFORMER_PAGE_SIZE = 100
SCENE_UPDATE_BATCH = 1000


def processAll():
    exclusion_marker_tag_id = None
    if settings["excludeSceneWithTag"] != "":
        exclusion_marker_tag = stash.find_tag(settings["excludeSceneWithTag"])
        if exclusion_marker_tag is not None:
            exclusion_marker_tag_id = exclusion_marker_tag['id']

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

    while performersTotal > processed:
        log.progress(min(processed / performersTotal, 1.0))

        performers = stash.find_performers(
            f=query,
            filter={"page": page, "per_page": PERFORMER_PAGE_SIZE},
            fragment="id name tags { id name }"
        )

        if not performers:
            break

        for perf in performers:
            perf_tags = perf.get("tags", [])
            if not perf_tags:
                processed += 1
                continue

            performer_tags_ids = set()
            performer_tags_names = set()

            for tag in perf["tags"]:
                performer_tags_ids.add(tag["id"])
                performer_tags_names.add(tag["name"])

            scene_query = {
                "performers": {
                    "value": [perf["id"]],
                    "modifier": "INCLUDES"
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
                        "tag_ids": {"mode": "ADD", "ids": list(performer_tags_ids)},
                    }
                )
            processed += 1
        page += 1

    log.info("Finished processing all performers.")


def processScene(scene: dict):
    # Skip if organized
    if settings['excludeSceneOrganized'] and scene.get('organized'):
        log.debug("Skipping scene update because it is organized")
        return

    # Skip if tagged with the excluded tag
    scene_tags = scene.get("tags", [])
    if settings["excludeSceneWithTag"] != "":
        for tag in scene_tags:
            if tag["name"] == settings["excludeSceneWithTag"]:
                log.debug("Skipping scene because it has the excluded tag")
                return

    perf_tag_ids = set()
    for perf in scene.get("performers", []):
        perf_tag_ids.update(map(lambda tag: tag["id"], perf.get("tags", [])))

    # Skip if no performer tags
    if not perf_tag_ids:
        log.debug("Skipping scene update because performers have no tags")
        return

    scene_tag_ids = set(map(lambda tag: tag["id"], scene_tags))

    # Skip if scene already has all performer tags
    if perf_tag_ids.issubset(scene_tag_ids):
        log.debug("Skipping scene update because it already has all performer tags")
        return

    log.debug(f"Updating scene {scene['id']} with performer tags: {perf_tag_ids}")
    scene_tag_ids.update(perf_tag_ids)

    stash.update_scene({
        "id": scene["id"],
        "tag_ids": list(scene_tag_ids)
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
        scene = stash.find_scene(id, fragment="id organized tags { id name } performers { id tags { id } }")
        if scene:
            processScene(scene)
