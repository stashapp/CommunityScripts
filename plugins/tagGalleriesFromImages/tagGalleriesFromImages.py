import stashapi.log as log
from stashapi.stashapp import StashInterface
import sys
import json
import time

GALLERY_PAGE_SIZE = 150
tag_cache = {}


def processAll():
    exclusion_marker_tag_id = None
    if settings["excludeWithTag"]:
        if settings["excludeWithTag"] in tag_cache:
            exclusion_marker_tag_id = tag_cache[settings["excludeWithTag"]]['id']
        else:
            exclusion_marker_tag = stash.find_tag(settings["excludeWithTag"])
            if exclusion_marker_tag:
                exclusion_marker_tag_id = exclusion_marker_tag['id']
                tag_cache[settings["excludeWithTag"]] = exclusion_marker_tag
    
    query = {
        "image_count": {
            "modifier": "NOT_EQUALS",
            "value": 0,
        },
    }
    if settings['excludeOrganized']:
        query["organized"] = False
    if exclusion_marker_tag_id:
        query["tags"] = {
            "value": [exclusion_marker_tag_id],
            "modifier": "EXCLUDES"
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
    
    tag_cache.clear()


def should_exclude_gallery(gallery, exclusion_tag_name):
    if exclusion_tag_name:
        for tag in gallery.get("tags", []):
            if tag["name"] == exclusion_tag_name:
                return True
    
    if settings['excludeOrganized'] and gallery.get('organized'):
        return True
        
    return False


def processGallery(gallery: dict):
    if should_exclude_gallery(gallery, settings["excludeWithTag"]):
        return

    gallery_id = gallery['id']

    images = stash.find_gallery_images(
        gallery_id, 
        fragment='tags { id } performers { id } studio { id }'
    )
    
    if not images:
        return

    all_found_tag_ids = {t['id'] for img in images for t in img.get('tags', []) if 'id' in t}
    all_found_performer_ids = {p['id'] for img in images for p in img.get('performers', []) if 'id' in p}
    all_found_studio_ids = {img['studio']['id'] for img in images if img.get('studio') and img['studio'].get('id')}

    if not all_found_tag_ids and not all_found_performer_ids and not all_found_studio_ids:
        return

    existing_tag_ids = {t['id'] for t in gallery.get('tags', [])}
    existing_perf_ids = {p['id'] for p in gallery.get('performers', [])}
    existing_studio_id = gallery.get('studio', {}).get('id') if gallery.get('studio') else None

    missing_tags = all_found_tag_ids - existing_tag_ids
    missing_perfs = all_found_performer_ids - existing_perf_ids
    
    target_studio_id = list(all_found_studio_ids)[0] if all_found_studio_ids else None
    studio_missing = bool(target_studio_id and (target_studio_id != existing_studio_id))

    if not missing_tags and not missing_perfs and not studio_missing:
        return

    update_data = {"ids": [gallery_id]}
    if missing_tags and all_found_tag_ids:
        update_data["tag_ids"] = {"mode": "ADD", "ids": list(all_found_tag_ids)}
    if missing_perfs and all_found_performer_ids:
        update_data["performer_ids"] = {"mode": "ADD", "ids": list(all_found_performer_ids)}
    if studio_missing:
        update_data["studio_id"] = target_studio_id

    gallery_name = gallery.get("title") or gallery.get("code") or f"ID {gallery_id}"
    log.info(f"Syncing gallery '{gallery_name}' upward with structural image metadata updates.")
    
    try:
        stash.update_galleries(update_data)
    except Exception as e:
        log.error(f"Error updating gallery {gallery_id}: {str(e)}")


json_input = json.loads(sys.stdin.read())
FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)

config = stash.get_configuration()
settings = {"excludeWithTag": "", "excludeOrganized": False}

if config and "plugins" in config and "tagGalleriesFromImages" in config["plugins"]:
    settings.update(config["plugins"]["tagGalleriesFromImages"])

if "mode" in json_input["args"]:
    if "processAll" in json_input["args"]["mode"]:
        processAll()
elif "hookContext" in json_input["args"]:
    time.sleep(0.05)
    hook = json_input["args"]["hookContext"]
    hook_type = hook.get("type", "")

    # --- GALLERY HOOK HANDLER ---
    if hook_type in ["Gallery.Update.Post", "Gallery.Create.Post"]:
        gallery = stash.find_gallery(hook['id'], fragment="id title code organized tags { id name } performers { id } studio { id }")
        if gallery:
            processGallery(gallery)

    # --- IMAGE HOOK HANDLER ---
    elif hook_type in ["Image.Update.Post", "Image.Create.Post"]:
        image_id = hook['id']
        image_data = stash.find_image(image_id, fragment="gallery { id }")
        
        if image_data and image_data.get("gallery"):
            gallery_id = image_data["gallery"]["id"]
            gallery = stash.find_gallery(gallery_id, fragment="id title code organized tags { id name } performers { id } studio { id }")
            if gallery:
                processGallery(gallery)