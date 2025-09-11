import hashlib
import re
import sys
import json
import time
import requests
import stashapi.log as log
from stashapi.stashapp import StashInterface
from typing import List


MD5_RE = re.compile(r"^[a-f0-9]{32}$")


def get_all_images(
    client: StashInterface,
    skip_tag_ids: List[int],
    exclude_organized: bool,
    per_page: int = 100,
) -> List[dict]:
    page = 1
    all_images = []
    while True:
        image_filter = {}
        pagination = {
            "page": page,
            "per_page": per_page,
            "sort": "created_at",
            "direction": "ASC",
        }

        if skip_tag_ids:
            image_filter["tags"] = {
                "value": [],
                "excludes": skip_tag_ids,
                "modifier": "INCLUDES_ALL",
                "depth": -1,
            }

        if exclude_organized:
            image_filter["organized"] = False

        images = client.find_images(f=image_filter, filter=pagination)
        if not images:
            break

        log.info(f"Fetched image page {page} with {len(images)} images")
        all_images.extend(images)
        page += 1

    return all_images


def get_all_scenes(
    client: StashInterface,
    skip_tag_ids: List[int],
    exclude_organized: bool,
    per_page: int = 100,
) -> List[dict]:
    page = 1
    all_scenes = []
    while True:
        scene_filter = {}
        pagination = {
            "page": page,
            "per_page": per_page,
            "sort": "created_at",
            "direction": "ASC",
        }

        if skip_tag_ids:
            scene_filter["tags"] = {
                "value": [],
                "excludes": skip_tag_ids,
                "modifier": "INCLUDES_ALL",
                "depth": -1,
            }

        if exclude_organized:
            scene_filter["organized"] = False

        scenes = client.find_scenes(f=scene_filter, filter=pagination)
        if not scenes:
            break

        log.info(f"Fetched scene page {page} with {len(scenes)} scenes")
        all_scenes.extend(scenes)
        page += 1

    return all_scenes


def process_e621_post_for_item(
    stash: StashInterface, item_type: str, item_id: str, item_md5: str
) -> None:
    """
    item_type: "image" or "scene"
    Update the corresponding object on success, or tag as failed on API error.
    """
    # Fetch latest object to check tags
    if item_type == "image":
        obj = stash.find_image(item_id)
        already_tagged = any(t["name"] == "e621_tagged" for t in obj.get("tags", []))
        already_failed = any(
            t["name"] == "e621_tag_failed" for t in obj.get("tags", [])
        )
    else:
        obj = stash.find_scene(item_id)
        already_tagged = any(t["name"] == "e621_tagged" for t in obj.get("tags", []))
        already_failed = any(
            t["name"] == "e621_tag_failed" for t in obj.get("tags", [])
        )

    if already_tagged or already_failed:
        return

    try:
        time.sleep(0.5)
        response = requests.get(
            f"https://e621.net/posts.json?md5={item_md5}",
            headers={"User-Agent": "Stash-e621-Tagger/1.0"},
            timeout=10,
        )
        response.raise_for_status()
        post_data = response.json().get("post", {})
    except Exception as e:
        log.error(f"Marking as failed. e621 API error: {str(e)}")
        e621_tag_failed = get_or_create_tag(stash, "e621_tag_failed")
        fail_ids = [e621_tag_failed["id"]] + [t["id"] for t in obj.get("tags", [])]
        if item_type == "image":
            stash.update_image({"id": item_id, "tag_ids": list(set(fail_ids))})
        else:
            stash.update_scene({"id": item_id, "tag_ids": list(set(fail_ids))})
        return

    if not post_data:
        return

    e621_tag = get_or_create_tag(stash, "e621_tagged")
    post_url = f"https://e621.net/posts/{post_data['id']}"

    tag_ids = [e621_tag["id"]]
    for cat in ["general", "species", "artist", "copyright", "meta"]:
        for tag in post_data.get("tags", {}).get(cat, []):
            clean_tag = tag.strip()
            if not clean_tag:
                continue
            stash_tag = get_or_create_tag(stash, clean_tag)
            if stash_tag:
                tag_ids.append(stash_tag["id"])

    studio_id = None
    if artists := post_data.get("tags", {}).get("artist"):
        studio = get_or_create_studio(stash, artists[0])
        studio_id = studio["id"]

    performer_ids = []
    for char in post_data.get("tags", {}).get("character", []):
        name = char.split("_(")[0]
        perf = get_or_create_performer(stash, name)
        performer_ids.append(perf["id"])

    try:
        update_payload = {
            "id": item_id,
            "organized": True,
            "urls": [post_url],
            "tag_ids": list(set(tag_ids)),
            "studio_id": studio_id,
            "performer_ids": performer_ids,
        }
        if item_type == "image":
            stash.update_image(update_payload)
            log.info(f"Image updated: {item_id}")
        else:
            stash.update_scene(update_payload)
            log.info(f"Scene updated: {item_id}")
    except Exception as e:
        log.error(f"Update failed: {str(e)}")


def get_or_create_tag(stash: StashInterface, tag_name: str) -> dict:
    tag_name = tag_name.strip()
    if not tag_name:
        log.error("Attempted to create tag with empty name")
        return None

    existing = stash.find_tags(f={"name": {"value": tag_name, "modifier": "EQUALS"}})
    if existing:
        return existing[0]

    parts = tag_name.split(":")
    parent_id = None
    for i in range(len(parts)):
        current_name = ":".join(parts[: i + 1]).strip()
        if not current_name:
            continue

        existing = stash.find_tags(
            f={"name": {"value": current_name, "modifier": "EQUALS"}}
        )
        if not existing:
            create_data = {"name": current_name}
            if parent_id:
                create_data["parent_ids"] = [parent_id]
            try:
                new_tag = stash.create_tag(create_data)
                if not new_tag:
                    log.error(f"Failed to create tag: {current_name}")
                    return None
                parent_id = new_tag["id"]
            except Exception as e:
                log.error(f"Error creating tag {current_name}: {str(e)}")
                return None
        else:
            parent_id = existing[0]["id"]
    return {"id": parent_id}


def get_or_create_studio(stash: StashInterface, name: str) -> dict:
    studios = stash.find_studios(f={"name": {"value": name, "modifier": "EQUALS"}})
    return studios[0] if studios else stash.create_studio({"name": name})


def get_or_create_performer(stash: StashInterface, name: str) -> dict:
    performers = stash.find_performers(
        f={"name": {"value": name, "modifier": "EQUALS"}}
    )
    return performers[0] if performers else stash.create_performer({"name": name})


def scrape_image(client: StashInterface, image_id: str) -> None:
    image = client.find_image(image_id)
    if not image or not image.get("visual_files"):
        return

    file_data = image["visual_files"][0]
    filename = file_data.get("basename", "")
    filename_md5 = filename.split(".")[0] if filename else ""

    if MD5_RE.match(filename_md5):
        final_md5 = filename_md5
        log.info(f"Using filename MD5 for image: {final_md5}")
    else:
        # try if API provided checksum/md5 field on image
        if image.get("checksum"):
            final_md5 = image["checksum"]
            log.info(f"Using image checksum: {final_md5}")
        elif image.get("md5"):
            final_md5 = image["md5"]
            log.info(f"Using image md5: {final_md5}")
        else:
            try:
                md5_hash = hashlib.md5()
                with open(file_data["path"], "rb") as f:
                    for chunk in iter(lambda: f.read(65536), b""):
                        md5_hash.update(chunk)
                final_md5 = md5_hash.hexdigest()
                log.info(f"Generated content MD5 for image: {final_md5}")
            except Exception as e:
                log.error(f"Failed to generate MD5 for image: {str(e)}")
                return

    process_e621_post_for_item(client, "image", image_id, final_md5)


def scrape_scene(client: StashInterface, scene_id: str) -> None:
    """
    Attempt to find a stable MD5 for a scene/video:
      - prefer scene.checksum or scene.md5
      - then files[0].checksum
      - then files[0].basename parsed for md5
      - fallback: compute MD5 from files[0].path
    """
    scene = client.find_scene(scene_id)
    if not scene:
        return

    final_md5 = None

    # direct fields
    if scene.get("checksum") and MD5_RE.match(scene.get("checksum")):
        final_md5 = scene.get("checksum")
        log.info(f"Using scene checksum: {final_md5}")
    elif scene.get("md5") and MD5_RE.match(scene.get("md5")):
        final_md5 = scene.get("md5")
        log.info(f"Using scene md5: {final_md5}")
    else:
        files = scene.get("files") or scene.get("scene_files") or []
        if files:
            file_data = files[0]
            # try file-level checksum
            if file_data.get("checksum") and MD5_RE.match(file_data.get("checksum")):
                final_md5 = file_data.get("checksum")
                log.info(f"Using file checksum for scene: {final_md5}")
            else:
                basename = file_data.get("basename", "")
                filename_md5 = basename.split(".")[0] if basename else ""
                if MD5_RE.match(filename_md5):
                    final_md5 = filename_md5
                    log.info(f"Using filename MD5 for scene: {final_md5}")
                else:
                    # attempt to compute
                    try:
                        md5_hash = hashlib.md5()
                        with open(file_data["path"], "rb") as f:
                            for chunk in iter(lambda: f.read(65536), b""):
                                md5_hash.update(chunk)
                        final_md5 = md5_hash.hexdigest()
                        log.info(f"Generated content MD5 for scene: {final_md5}")
                    except Exception as e:
                        log.error(f"Failed to generate MD5 for scene: {str(e)}")
                        return
        else:
            log.error(f"No files found for scene {scene_id}; cannot compute md5")
            return

    if final_md5:
        process_e621_post_for_item(client, "scene", scene_id, final_md5)


if __name__ == "__main__":
    log.info("Starting tagger with stable pagination snapshot (images + scenes)...")
    json_input = json.loads(sys.stdin.read())
    stash = StashInterface(json_input["server_connection"])

    config = stash.get_configuration().get("plugins", {})
    settings = {"SkipTags": "e621_tagged, e621_tag_failed", "ExcludeOrganized": False}
    settings.update(config.get("e621_tagger", {}))

    # ensure e621 tags exist and get their ids
    e621_tagged = get_or_create_tag(stash, "e621_tagged")
    e621_failed = get_or_create_tag(stash, "e621_tag_failed")

    # resolve skip tag NAMES from settings to tag IDs
    skip_tag_names = [n.strip() for n in settings["SkipTags"].split(",") if n.strip()]
    skip_tag_ids: List[int] = []
    for name in skip_tag_names:
        found = stash.find_tags(f={"name": {"value": name, "modifier": "EQUALS"}})
        if found:
            skip_tag_ids.append(found[0]["id"])
    # always include the internal e621 tags (ensure ints)
    skip_tag_ids.extend([e621_tagged["id"], e621_failed["id"]])

    log.info("Fetching images in pages (stable snapshot)...")
    images = get_all_images(
        stash, skip_tag_ids, settings["ExcludeOrganized"], per_page=50
    )
    log.info("Fetching scenes in pages (stable snapshot)...")
    scenes = get_all_scenes(
        stash, skip_tag_ids, settings["ExcludeOrganized"], per_page=50
    )

    # build unified list with type so we can preserve progress and skipping logic
    unified = []
    for img in images:
        unified.append({"type": "image", "obj": img})
    for sc in scenes:
        unified.append({"type": "scene", "obj": sc})

    total = len(unified) or 1
    for idx, entry in enumerate(unified, start=1):
        # report start-of-item progress (0..1). avoid sending 1.0 until the very end.
        log.progress(float(idx - 1) / float(total))

        item_type = entry["type"]
        item = entry["obj"]
        item_id = item["id"]

        current_tag_ids = [t["id"] for t in item.get("tags", [])]
        if any(tid in current_tag_ids for tid in skip_tag_ids):
            log.info(f"Skipping {item_type} {item_id} - contains skip tag")
            # reflect the skipped item as completed
            log.progress(float(idx) / float(total))
            continue

        if item_type == "image":
            scrape_image(stash, item_id)
        else:
            scrape_scene(stash, item_id)

        # mark this item done
        log.progress(float(idx) / float(total))

    # ensure UI shows complete when finished
    log.progress(1.0)
