from stashapi.stashapp import StashInterface
import sys
import json

def processAll():
    query = {
        "tags": {
            "modifier": "NOT_NULL",
        },
        "image_count": {
            "modifier": "NOT_EQUALS",
            "value": 0,
        },
    }
    performersTotal = stash.find_performers(f=query, get_count=True)[0]
    i = 0
    tags = []
    images = []
    while i < performersTotal:
        perf = stash.find_performers(f=query, filter={"page": i, "per_page": 1})
        for tag in perf[0]["tags"]:
            tags.append(tag["id"])
        for image in perf[0]["images"]:
            images.append(image["id"])
        stash.update_images(
            {
                "ids": images,
                "tag_ids": {"mode": "ADD", "ids": tags},
            }
        )
        i = i + 1
        tags = []
        images = []


def processImage(image):
    tags = []
    performersIds = []
    should_tag = True
    if settings["excludeImageWithTag"] != "":
        for tag in image["tags"]:
            if tag["name"] == settings["excludeImageWithTag"]:
                should_tag = False
                break
    
    if settings['excludeImageOrganized']:
        if image['organized']:
            should_tag = False

    if should_tag:
        for perf in image["performers"]:
            performersIds.append(perf["id"])
        performers = []
        for perfId in performersIds:
            performers.append(stash.find_performer(perfId))
        for perf in performers:
            for tag in perf["tags"]:
                tags.append(tag["id"])
        stash.update_images({"ids": image["id"], "tag_ids": {"mode": "ADD", "ids": tags}})
        tags = []
        performersIds = []
        performers = []


json_input = json.loads(sys.stdin.read())
FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)
config = stash.get_configuration()
settings = {
    "excludeImageWithTag": "",
    "excludeImageOrganized": False
}
if "tagImagesWithPerfTags" in config["plugins"]:
    settings.update(config["plugins"]["tagImagesWithPerfTags"])

if "mode" in json_input["args"]:
    PLUGIN_ARGS = json_input["args"]["mode"]
    if "processAll" in PLUGIN_ARGS:
        processAll()
elif "hookContext" in json_input["args"]:
    id = json_input["args"]["hookContext"]["id"]
    if (
        (
            json_input["args"]["hookContext"]["type"] == "Image.Update.Post"
                or "Image.Create.Post"
        ) and "inputFields" in json_input["args"]["hookContext"]
        and len(json_input["args"]["hookContext"]["inputFields"]) > 2
    ):
        image = stash.find_image(id)
        processImage(image)
