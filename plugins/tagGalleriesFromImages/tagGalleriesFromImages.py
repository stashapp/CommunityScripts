import stashapi.log as log
from stashapi.stashapp import StashInterface
import sys
import json

def processAll():
    exclusion_marker_tag_id = None
    if settings["excludeWithTag"] != "":
        exclussion_marker_tag = stash.find_tag(settings["excludeWithTag"])
        if exclussion_marker_tag is not None:
            exclusion_marker_tag_id = exclussion_marker_tag['id']
    
    query = {
        "image_count": {
            "modifier": "NOT_EQUALS",
            "value": 0,
        },
    }
    if settings['excludeOrganized']:
        query["organized"] = False
    if exclusion_marker_tag_id is not None:
        query["tags"] = {
            "value": [exclusion_marker_tag_id],
            "modifier": "EXCLUDES"
        }
    
    total_count = stash.find_galleries(f=query, filter={"page": 0, "per_page": 0}, get_count=True)[0]
    i = 0
    while i < total_count:
        log.progress((i / total_count))
        
        galleries = stash.find_galleries(f=query, filter={"page": i, "per_page": 1})
        if len(galleries) == 0:
            break
        gallery = galleries[0]

        processGallery(gallery)

        i = i + 1


def processGallery(gallery : dict):
    tags = []
    performersIds = []
    should_tag = True
    if settings["excludeWithTag"] != "":
        for tag in gallery["tags"]:
            if tag["name"] == settings["excludeWithTag"]:
                should_tag = False
                break
    
    if settings['excludeOrganized']:
        if gallery['organized']:
            should_tag = False

    if should_tag:
        existing_tag_ids = {t['id'] for t in gallery['tags']}
        existing_performer_ids = {p['id'] for p in gallery['performers']}

        images = stash.find_gallery_images(gallery['id'], fragment='tags { id name } performers { id name }')
        if len(images) > 0:
            tag_ids = set()
            tag_names = set()

            performer_ids = set()
            performer_names = set()

            for image in images:
                image_tag_ids = [tag['id'] for tag in image['tags']]
                image_tag_names = [tag['name'] for tag in image['tags']]
                tag_ids.update(image_tag_ids)
                tag_names.update(image_tag_names)
                
                image_performer_ids = [performer['id'] for performer in image['performers']]
                image_performer_names = [performer['name'] for performer in image['performers']]
                performer_ids.update(image_performer_ids)
                performer_names.update(image_performer_names)
            
            new_tags_ids = tag_ids - existing_tag_ids
            new_performer_ids = performer_ids - existing_performer_ids
            
            if len(new_tags_ids) > 0 or len(new_performer_ids) > 0:
                log.info(f"updating gallery {gallery['id']} from {len(images)} images with tags {tag_names} ({len(new_tags_ids)} new) and performers {performer_names} ({len(new_performer_ids)} new)")
                stash.update_galleries({"ids": gallery['id'], "tag_ids": {"mode": "ADD", "ids": list(new_tags_ids)}, "performer_ids": {"mode": "ADD", "ids": list(new_performer_ids)}})


json_input = json.loads(sys.stdin.read())
FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)
config = stash.get_configuration()
settings = {
    "excludeWithTag": "",
    "excludeOrganized": False
}
if "tagGalleriesFromImages" in config["plugins"]:
    settings.update(config["plugins"]["tagGalleriesFromImages"])

if "mode" in json_input["args"]:
    PLUGIN_ARGS = json_input["args"]["mode"]
    if "processAll" in PLUGIN_ARGS:
        processAll()
elif "hookContext" in json_input["args"]:
    id = json_input["args"]["hookContext"]['id']
    if (
        (
            json_input["args"]["hookContext"]["type"] == "Gallery.Update.Post"
                or json_input["args"]["hookContext"]["type"] == "Gallery.Create.Post"
        ) and "inputFields" in json_input["args"]["hookContext"]
        and len(json_input["args"]["hookContext"]["inputFields"]) > 2
    ):
        gallery = stash.find_gallery(id)
        processGallery(gallery)
