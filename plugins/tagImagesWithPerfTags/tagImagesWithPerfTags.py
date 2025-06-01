import stashapi.log as log
from stashapi.stashapp import StashInterface
import sys
import json

def processAll():
    exclusion_marker_tag_id = None
    if settings["excludeImageWithTag"] != "":
        exclussion_marker_tag = stash.find_tag(settings["excludeImageWithTag"])
        if exclussion_marker_tag is not None:
            exclusion_marker_tag_id = exclussion_marker_tag['id']
    
    query = {
        "tags": {
            "modifier": "NOT_NULL",
        },
        "image_count": {
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
        
        image_query = {
            "performers": {
                "value": [perf[0]["id"]],
                "modifier": "INCLUDES_ALL"
            }
        }
        if settings['excludeImageOrganized']:
            image_query["organized"] = False
        if exclusion_marker_tag_id is not None:
             image_query["tags"] = {
                "value": [exclusion_marker_tag_id],
                "modifier": "EXCLUDES"
            }

        performer_image_count = stash.find_images(f=image_query, filter={"page": 0, "per_page": 0}, get_count=True)[0]
        
        if performer_image_count > 0:
            log.info(f"updating {performer_image_count} images of performer \"{ perf[0]['name']}\" with tags {performer_tags_names}")

            performer_image_page_size = 100
            performer_image_page = 0
            while performer_image_page * performer_image_page_size < performer_image_count:
                performer_images = stash.find_images(f=image_query, filter={"page": performer_image_page, "per_page": performer_image_page_size}, fragment='id')
                performer_image_ids = [performer_image['id'] for performer_image in performer_images]

                stash.update_images(
                    {
                        "ids": performer_image_ids,
                        "tag_ids": {"mode": "ADD", "ids": performer_tags_ids},
                    }
                )
                performer_image_page += 1

        i = i + 1


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
