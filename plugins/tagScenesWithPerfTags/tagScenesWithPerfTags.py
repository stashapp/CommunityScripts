from stashapi.stashapp import StashInterface
import sys
import json

def processAll():
    query = {
        "tags": {
            "modifier": "NOT_NULL",
        },
        "scene_count": {
            "modifier": "NOT_EQUALS",
            "value": 0,
        },
    }
    performersTotal = stash.find_performers(f=query, get_count=True)[0]
    i = 0
    tags = []
    scenes = []
    while i < performersTotal:
        perf = stash.find_performers(f=query, filter={"page": i, "per_page": 1})
        for tag in perf[0]["tags"]:
            tags.append(tag["id"])
        for scene in perf[0]["scenes"]:
            scenes.append(scene["id"])
        stash.update_scenes(
            {
                "ids": scenes,
                "tag_ids": {"mode": "ADD", "ids": tags},
            }
        )
        i = i + 1
        tags = []
        scenes = []


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
