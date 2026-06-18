import stashapi.log as log
from stashapi.stashapp import StashInterface
import sys
import json

GALLERY_PAGE_SIZE = 50
IMAGE_UPDATE_BATCH = 1000


def processAll():
    exclusion_marker_tag_id = None

    if settings["excludeWithTag"]:
        exclusion_marker_tag = stash.find_tag(settings["excludeWithTag"])
        if exclusion_marker_tag:
            exclusion_marker_tag_id = exclusion_marker_tag["id"]

    query = {
        "image_count": {
            "modifier": "NOT_EQUALS",
            "value": 0,
        }
    }

    if settings["excludeOrganized"]:
        query["organized"] = False

    if exclusion_marker_tag_id:
        query["tags"] = {
            "value": [exclusion_marker_tag_id],
            "modifier": "EXCLUDES",
        }

    try:
        total_count = stash.find_galleries(f=query, filter={"page": 1, "per_page": 1}, get_count=True)[0]
    except Exception:
        total_count = 0

    processed = 0
    page = 1

    while True:
        if total_count > 0:
            log.progress(min(processed / total_count, 1.0))

        galleries = stash.find_galleries(
            f=query,
            filter={"page": page, "per_page": GALLERY_PAGE_SIZE},
            fragment="id title code organized tags { id name } performers { id } studio { id }"
        )

        if not galleries:
            log.info("Finished processing all galleries.")
            break

        for gallery in galleries:
            processGallery(gallery)
            processed += 1

        page += 1


def processGallery(gallery: dict):
    if settings["excludeWithTag"]:
        for tag in gallery.get("tags", []):
            if tag["name"] == settings["excludeWithTag"]:
                return

    if settings["excludeOrganized"] and gallery.get("organized"):
        return

    gallery_tag_ids = [t["id"] for t in gallery.get("tags", [])]
    gallery_performer_ids = [p["id"] for p in gallery.get("performers", [])]
    
    gallery_studio = gallery.get("studio")
    gallery_studio_id = gallery_studio["id"] if gallery_studio else None

    # If the gallery holds absolutely no operational metadata, bypass processing
    if not gallery_tag_ids and not gallery_performer_ids and not gallery_studio_id:
        return

    images = stash.find_gallery_images(
        gallery["id"],
        fragment="id tags { id } performers { id } studio { id }"
    )

    if not images:
        return

    image_ids_to_update = []
    gallery_tags_set = set(gallery_tag_ids)
    gallery_perfs_set = set(gallery_performer_ids)

    for img in images:
        existing_img_tags = {t['id'] for t in img.get('tags', [])}
        existing_img_perfs = {p['id'] for p in img.get('performers', [])}
        
        img_studio = img.get("studio")
        img_studio_id = img_studio["id"] if img_studio else None

        # Determine structural delta discrepancies cleanly
        missing_tags = gallery_tags_set - existing_img_tags
        missing_perfs = gallery_perfs_set - existing_img_perfs
        studio_mismatch = (gallery_studio_id is not None and img_studio_id != gallery_studio_id)

        if missing_tags or missing_perfs or studio_mismatch:
            image_ids_to_update.append(img["id"])

    if not image_ids_to_update:
        return

    gallery_name = gallery.get("title") or gallery.get("code") or f"ID {gallery['id']}"
    tag_names = [t["name"] for t in gallery.get("tags", [])]
    tags_string = ", ".join(tag_names) if tag_names else "None"
    context_msg = f"Gallery: '{gallery_name}' | Tags: [{tags_string}]"

    for i in range(0, len(image_ids_to_update), IMAGE_UPDATE_BATCH):
        batch = image_ids_to_update[i:i + IMAGE_UPDATE_BATCH]
        sendImageBatch(batch, gallery_tag_ids, gallery_performer_ids, gallery_studio_id, context_msg)


def sendImageBatch(image_ids, tag_ids, performer_ids, studio_id, context_msg):
    update_data = {
        "ids": image_ids
    }

    if tag_ids:
        update_data["tag_ids"] = {
            "mode": "ADD",
            "ids": tag_ids
        }

    if performer_ids:
        update_data["performer_ids"] = {
            "mode": "ADD",
            "ids": performer_ids
        }
        
    if studio_id:
        update_data["studio_id"] = studio_id

    log.info(f"Bulk down-updating {len(image_ids)} child images ({context_msg})")
    stash.update_images(update_data)


json_input = json.loads(sys.stdin.read())
FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)

config = stash.get_configuration()
settings = {
    "excludeWithTag": "",
    "excludeOrganized": False
}

if "tagImagesFromGalleries" in config["plugins"]:
    settings.update(config["plugins"]["tagImagesFromGalleries"])

if "mode" in json_input["args"]:
    if "processAll" in json_input["args"]["mode"]:
        processAll()

elif "hookContext" in json_input["args"]:
    hook = json_input["args"]["hookContext"]
    gallery_id = hook["id"]

    # Safe validation check: handle inputs without breaking on complex sub-object mutations
    if (
        hook.get("type") in ["Gallery.Update.Post", "Gallery.Create.Post"]
        and hook.get("inputFields") is not None
    ):
        gallery = stash.find_gallery(gallery_id, fragment="id title code organized tags { id name } performers { id } studio { id }")
        if gallery:
            processGallery(gallery)