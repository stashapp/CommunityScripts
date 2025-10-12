import stashapi.log as log
from stashapi.stashapp import StashInterface
import sys
import json


class RemovableTag(object):

    def __init__(self, id: str, name:str = None, cause:str = None):
        self.id = int(id)
        self.name = name
        self.cause = cause

    def __hash__(self):
        return hash(self.id)
    
    def __eq__(self, other):
        return self.id == other.id

    def __repr__(self):
        #return f"RemovableTag(id={repr(self.id)}, name={repr(self.name)}, cause={repr(self.cause)})"
        return f"Tag(id={repr(self.id)}, name={repr(self.name)})"


REMOVABLE_PARENT_TAG_CACHE : dict[int, set[RemovableTag]] = dict()


def calc_removable_tags_from_tag_ids(tag_ids : list[str], is_explict : bool) -> set[RemovableTag]:
    #log.debug(f"calc_removable_tags_from_tag_ids(): {tag_ids}, {is_explict}")
    
    removable_tags : set[RemovableTag] = set()

    for tag_id in tag_ids:
        removable_tags_for_tag = calc_removable_tags_for_tag_id(int(tag_id), is_explict=is_explict)
        removable_tags.update(removable_tags_for_tag)

    return removable_tags


def calc_removable_tags_from_tags(tags : list[dict], is_explict : bool) -> set[RemovableTag]:
    #log.debug(f"calc_removable_tags_from_tags(): {tags}, {is_explict}")

    removable_tags : set[RemovableTag] = set()

    for tag in tags:
        removable_tags_for_tag = calc_removable_tags_for_tag(tag, is_explict=is_explict)
        removable_tags.update(removable_tags_for_tag)

    return removable_tags


def calc_removable_tags_for_tag_id(tag_id : str, is_explict : bool) -> set[RemovableTag]:
    #log.debug(f"calc_removable_tags_for_tag_id(): {tag_id}, {is_explict}")

    tag = stash.find_tag(int(tag_id))
    removable_tags = calc_removable_tags_for_tag(tag=tag, is_explict=is_explict)
    
    return removable_tags


def calc_removable_tags_for_tag(tag : dict, is_explict : bool) -> set[RemovableTag]:
    #log.debug(f"calc_removable_tags_for_tag(): {tag['name']}, {is_explict}")

    tag_id = int(tag['id'])
        
    removable_tags : set[RemovableTag] = set()

    if tag_id in REMOVABLE_PARENT_TAG_CACHE:
        removable_tags_for_parents = set(REMOVABLE_PARENT_TAG_CACHE[tag_id])
    else:
        removable_tags_for_parents = calc_removable_tags_from_tag_ids([int(t['id']) for t in tag["parents"]], is_explict=False)
        REMOVABLE_PARENT_TAG_CACHE[tag_id] = set(removable_tags_for_parents)
    removable_tags.update(removable_tags_for_parents)

    # is not the first tag in the tag chain being processed
    if not is_explict:
        # is a root tag
        if len(tag["parents"]) == 0 and settings["removeRootParents"]:
            removable_tags.add(RemovableTag(id = tag_id, name = tag["name"], cause = "removeRootParents"))
        # is ignored for auto-tagging
        elif tag["ignore_auto_tag"] and settings["removeNonAutotagableParents"]:
            removable_tags.add(RemovableTag(id = tag_id, name = tag["name"], cause = "removeNonAutotagableParents"))
        # is intermediate tag
        elif len(tag["parents"]) > 0 and settings["removeIntermediateParents"]:
            removable_tags.add(RemovableTag(id = tag_id, name = tag["name"], cause = "removeIntermediateParents"))

    #log.debug(f"calc_removable_tags_for_tag(): {tag['name']}, {is_explict} = {removable_tags}")

    return removable_tags


def processAllScenes():
    if not settings["enableForScenes"]:
        log.debug("disabled for scenes")
        return
    
    query = {
        "tags": {
            "modifier": "NOT_NULL",
        }
    }
    if settings['excludeOrganized']:
            query["organized"] = False
    total_count = stash.find_scenes(f=query, filter={"page": 0, "per_page": 0}, get_count=True)[0]

    page_size = 100
    page = 0
    processed_count = 0
    while page * page_size < total_count:
        items = stash.find_scenes(f=query, filter={"page": page, "per_page": page_size})

        for item in items:
            processed_count += 1
            log.progress((processed_count / total_count))
            processScene(item)

        page += 1


def processScene(scene : dict):
    if not settings["enableForScenes"]:
        log.debug("disabled for scenes")
        return
    if scene['organized'] and settings["excludeOrganized"]:
        log.debug("disabled for organized")
        return

    tag_ids = {int(t['id']) for t in scene["tags"]}
    removable_tags = calc_removable_tags_from_tags(scene["tags"], is_explict=True)
    tags_to_remove = [t for t in removable_tags if t.id in tag_ids]

    if len(tags_to_remove) > 0:
        tag_ids_to_remove = [t.id for t in tags_to_remove]
        log.info(f"scene {scene['id']} removing redundant tags {tags_to_remove}")
        stash.update_scenes({"ids": scene['id'], "tag_ids": {"mode": "REMOVE", "ids": tag_ids_to_remove}})
    else:
        log.debug(f"scene {scene['id']} no redundant tags {tags_to_remove} in {tag_ids} from possible {removable_tags}")


def processAllImages():
    if not settings["enableForImages"]:
        log.debug("disabled for images")
        return
    
    query = {
        "tags": {
            "modifier": "NOT_NULL",
        }
    }
    if settings['excludeOrganized']:
            query["organized"] = False
    total_count = stash.find_images(f=query, filter={"page": 0, "per_page": 0}, get_count=True)[0]

    page_size = 100
    page = 0
    processed_count = 0
    while page * page_size < total_count:
        items = stash.find_images(f=query, filter={"page": page, "per_page": page_size})

        for item in items:
            processed_count += 1
            log.progress((processed_count / total_count))
            processImage(item)

        page += 1


def processImage(image : dict):
    if not settings["enableForImages"]:
        log.trace("disabled for images")
        return
    if image['organized'] and settings["excludeOrganized"]:
        log.debug("disabled for organized")
        return
    
    tag_ids = {int(t['id']) for t in image["tags"]}
    removable_tags = calc_removable_tags_from_tags(image["tags"], is_explict=True)
    tags_to_remove = [t for t in removable_tags if t.id in tag_ids]

    if len(tags_to_remove) > 0:
        tag_ids_to_remove = [t.id for t in tags_to_remove]
        log.info(f"image {image['id']} removing redundant tags {tags_to_remove}")
        stash.update_images({"ids": image['id'], "tag_ids": {"mode": "REMOVE", "ids": tag_ids_to_remove}})
    else:
        log.debug(f"image {image['id']} no redundant tags {tags_to_remove} in {tag_ids} from possible {removable_tags}")


def processAllGalleries():
    if not settings["enableForGalleries"]:
        log.debug("disabled for galleries")
        return
    
    query = {
        "tags": {
            "modifier": "NOT_NULL",
        }
    }
    if settings['excludeOrganized']:
            query["organized"] = False
    total_count = stash.find_galleries(f=query, filter={"page": 0, "per_page": 0}, get_count=True)[0]

    page_size = 100
    page = 0
    processed_count = 0
    while page * page_size < total_count:
        items = stash.find_galleries(f=query, filter={"page": page, "per_page": page_size})

        for item in items:
            processed_count += 1
            log.progress((processed_count / total_count))
            processGallery(item)

        page += 1


def processGallery(gallery : dict):
    if not settings["enableForGalleries"]:
        log.debug("disabled for galleries")
        return
    if gallery['organized'] and settings["excludeOrganized"]:
        log.trace("disabled for organized")
        return

    tag_ids = {int(t['id']) for t in gallery["tags"]}
    
    removable_tags = calc_removable_tags_from_tags(gallery["tags"], is_explict=True)
    log.debug(f"gallery {gallery['id']} potential redundant tags {removable_tags}")
    tags_to_remove = [t for t in removable_tags if t.id in tag_ids]

    if len(tags_to_remove) > 0:
        tag_ids_to_remove = [t.id for t in tags_to_remove]
        log.info(f"gallery {gallery['id']} removing redundant tags {tags_to_remove}")
        stash.update_galleries({"ids": gallery['id'], "tag_ids": {"mode": "REMOVE", "ids": tag_ids_to_remove}})
    else:
        log.debug(f"gallery {gallery['id']} no redundant tags {tags_to_remove} in {tag_ids} from possible {removable_tags}")


def processAllPerformers():
    if not settings["enableForPerformers"]:
        log.debug("disabled for performers")
        return
    
    query = {
        "tags": {
            "modifier": "NOT_NULL",
        }
    }
    if settings['excludeOrganized']:
            query["organized"] = False
    total_count = stash.find_performers(f=query, filter={"page": 0, "per_page": 0}, get_count=True)[0]

    page_size = 100
    page = 0
    processed_count = 0
    while page * page_size < total_count:
        items = stash.find_performers(f=query, filter={"page": page, "per_page": page_size})

        for item in items:
            processed_count += 1
            log.progress((processed_count / total_count))
            processPerformer(item)

        page += 1


def processPerformer(performer : dict):
    if not settings["enableForPerformers"]:
        log.debug("disabled for performers")
        return

    tag_ids = {int(t['id']) for t in performer["tags"]}
    removable_tags = calc_removable_tags_from_tags(performer["tags"], is_explict=True)
    tags_to_remove = [t for t in removable_tags if t.id in tag_ids]

    if len(tags_to_remove) > 0:
        tag_ids_to_remove = [t.id for t in tags_to_remove]
        log.info(f"performer {performer['id']} removing redundant tags {tags_to_remove}")
        stash.update_performers({"ids": performer['id'], "tag_ids": {"mode": "REMOVE", "ids": tag_ids_to_remove}})
    else:
        log.debug(f"performer {performer['id']} no redundant tags {tags_to_remove} in {tag_ids} from possible {removable_tags}")


json_input = json.loads(sys.stdin.read())
FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)
config = stash.get_configuration()
settings = {
    "enableForScenes": False,
    "enableForImages": False,
    "enableForGalleries": False,
    "enableForPerformers": False,
    "removeRootParents": False,
    "removeNonAutotagableParents": False,
    "removeIntermediateParents": False,
    "excludeOrganized": False
}
if "untagRedundantTags" in config["plugins"]:
    settings.update(config["plugins"]["untagRedundantTags"])

if "mode" in json_input["args"]:
    PLUGIN_ARGS = json_input["args"]["mode"]
    if "processAllScenes" in PLUGIN_ARGS:
        processAllScenes()
    elif "processAllImages" in PLUGIN_ARGS:
        processAllImages()
    elif "processAllGalleries" in PLUGIN_ARGS:
        processAllGalleries()
    elif "processAllPerformers" in PLUGIN_ARGS:
        processAllPerformers()
elif "hookContext" in json_input["args"]:
    id = json_input["args"]["hookContext"]['id']
    log.debug(f"hook invoked with {json_input["args"]["hookContext"]["type"]} in {id}")

    if (
        settings["enableForScenes"] and
        (
            json_input["args"]["hookContext"]["type"] == "Scene.Update.Post"
                or json_input["args"]["hookContext"]["type"] == "Scene.Create.Post"
        ) and "inputFields" in json_input["args"]["hookContext"]
        and len(json_input["args"]["hookContext"]["inputFields"]) > 2
    ):
        scene = stash.find_scene(id)
        processScene(scene=scene)
    elif (
        settings["enableForImages"] and
        (
            json_input["args"]["hookContext"]["type"] == "Image.Update.Post"
                or json_input["args"]["hookContext"]["type"] == "Image.Create.Post"
        ) and "inputFields" in json_input["args"]["hookContext"]
        and len(json_input["args"]["hookContext"]["inputFields"]) > 2
    ):
        image = stash.find_image(id)
        processImage(image=image)
    elif (
        settings["enableForGalleries"] and
        (
            json_input["args"]["hookContext"]["type"] == "Gallery.Update.Post"
                or json_input["args"]["hookContext"]["type"] == "Gallery.Create.Post"
        ) and "inputFields" in json_input["args"]["hookContext"]
        and len(json_input["args"]["hookContext"]["inputFields"]) > 2
    ):
        gallery = stash.find_gallery(id)
        processGallery(gallery=gallery)
    elif (
        settings["enableForPerformers"] and
        (
            json_input["args"]["hookContext"]["type"] == "Performer.Update.Post"
                or json_input["args"]["hookContext"]["type"] == "Performer.Create.Post"
        ) and "inputFields" in json_input["args"]["hookContext"]
        and len(json_input["args"]["hookContext"]["inputFields"]) > 2
    ):
        performer = stash.find_performer(id)
        processPerformer(performer=performer)
