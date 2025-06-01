import stashapi.log as log
from stashapi.stashapp import StashInterface
import sys
import json

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
    performersTotal = stash.find_performers(f=query, filter={"page": 0, "per_page": 0}, get_count=True)[0]
    i = 0
    while i < performersTotal:
        log.progress((i / performersTotal))
        
        perf = stash.find_performers(f=query, filter={"page": i, "per_page": 1})

        performer_tags_ids = []
        performer_tags_names = []
        for performer_tag in perf[0]["tags"]:
            performer_tags_ids.append(performer_tag["id"])
            performer_tags_names.append(performer_tag["name"])
        
        scene_query = {
            "performers": {
                "value": [perf[0]["id"]],
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

        performer_scene_count = stash.find_scenes(f=scene_query, filter={"page": 0, "per_page": 0}, get_count=True)[0]
        
        if performer_scene_count > 0:
            log.info(f"updating {performer_scene_count} scenes of performer \"{ perf[0]['name']}\" with tags {performer_tags_names}")

            performer_scene_page_size = 100
            performer_scene_page = 0
            while performer_scene_page * performer_scene_page_size < performer_scene_count:
                performer_scenes = stash.find_scenes(f=scene_query, filter={"page": performer_scene_page, "per_page": performer_scene_page_size}, fragment='id')
                performer_scene_ids = [performer_scene['id'] for performer_scene in performer_scenes]

                stash.update_scenes(
                    {
                        "ids": performer_scene_ids,
                        "tag_ids": {"mode": "ADD", "ids": performer_tags_ids},
                    }
                )
                performer_scene_page += 1

        i = i + 1


def processScene(scene):
    tags = []
    performersIds = []
    should_tag = True
    if settings["excludeSceneWithTag"] != "":
        for tag in scene["tags"]:
            if tag["name"] == settings["excludeSceneWithTag"]:
                should_tag = False
                break
    
    if settings['excludeSceneOrganized']:
        if scene['organized']:
            should_tag = False

    if should_tag:
        for perf in scene["performers"]:
            performersIds.append(perf["id"])
        performers = []
        for perfId in performersIds:
            performers.append(stash.find_performer(perfId))
        for perf in performers:
            for tag in perf["tags"]:
                tags.append(tag["id"])
        stash.update_scenes({"ids": scene["id"], "tag_ids": {"mode": "ADD", "ids": tags}})
        tags = []
        performersIds = []
        performers = []


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
    if (
        (
            json_input["args"]["hookContext"]["type"] == "Scene.Update.Post"
                or "Scene.Create.Post"
        ) and "inputFields" in json_input["args"]["hookContext"]
        and len(json_input["args"]["hookContext"]["inputFields"]) > 2
    ):
        scene = stash.find_scene(id)
        processScene(scene)
