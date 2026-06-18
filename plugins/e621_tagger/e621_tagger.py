import hashlib
import re
import sys
import json
import time
import requests
import itertools
import stashapi.log as log
from stashapi.stashapp import StashInterface
from typing import List, Optional, Tuple

MD5_RE = re.compile(r"^[a-f0-9]{32}$")

IMAGE_FRAGMENT = """
id
organized
visual_files {
  ... on ImageFile {
    id
    path
    basename
    fingerprints {
      type
      value
    }
  }
  ... on VideoFile {
    id
    path
    basename
    fingerprints {
      type
      value
    }
  }
}
tags {
  id
  name
}
"""

SCENE_FRAGMENT = """
id
organized
files {
  id
  path
  basename
  fingerprints {
    type
    value
  }
}
tags {
  id
  name
}
"""


def _update_image_minimal(stash: StashInterface, payload: dict) -> dict:
    query = """
    mutation ImageUpdate($input: ImageUpdateInput!) {
        imageUpdate(input: $input) { id }
    }
    """
    return stash.call_GQL(query, {"input": payload})


def _update_scene_minimal(stash: StashInterface, payload: dict) -> dict:
    query = """
    mutation SceneUpdate($input: SceneUpdateInput!) {
        sceneUpdate(input: $input) { id }
    }
    """
    return stash.call_GQL(query, {"input": payload})


def _extract_file_md5(file_data: dict) -> Optional[str]:
    if not file_data:
        return None
    for fp in file_data.get("fingerprints") or []:
        fp_type = (fp.get("type") or "").lower()
        fp_value = fp.get("value") or ""
        if fp_type == "md5" and MD5_RE.match(fp_value):
            return fp_value
    cs = file_data.get("checksum")
    if cs and MD5_RE.match(cs):
        return cs
    return None


def _build_filter(skip_tag_ids, exclude_organized):
    f = {}
    if skip_tag_ids:
        f["tags"] = {
            "value": [],
            "excludes": skip_tag_ids,
            "modifier": "INCLUDES_ALL",
            "depth": -1,
        }
    if exclude_organized:
        f["organized"] = False
    return f


def count_images(
    client: StashInterface, skip_tag_ids: list, exclude_organized: bool
) -> int:
    image_filter = _build_filter(skip_tag_ids, exclude_organized)
    pagination = {"page": 1, "per_page": 0, "sort": "created_at", "direction": "ASC"}
    total, _ = client.find_images(
        f=image_filter,
        filter=pagination,
        get_count=True,
        fragment=IMAGE_FRAGMENT,
    )
    return total


def count_scenes(
    client: StashInterface, skip_tag_ids: list, exclude_organized: bool
) -> int:
    scene_filter = _build_filter(skip_tag_ids, exclude_organized)
    pagination = {"page": 1, "per_page": 0, "sort": "created_at", "direction": "ASC"}
    total, _ = client.find_scenes(
        f=scene_filter,
        filter=pagination,
        get_count=True,
        fragment=SCENE_FRAGMENT,
    )
    return total


def stream_images(
    client: StashInterface,
    skip_tag_ids: List[int],
    exclude_organized: bool,
    per_page: int = 100,
):
    page = 1
    base_filter = _build_filter(skip_tag_ids, exclude_organized)
    while True:
        pagination = {
            "page": page,
            "per_page": per_page,
            "sort": "created_at",
            "direction": "ASC",
        }
        images = client.find_images(
            f=base_filter, filter=pagination, fragment=IMAGE_FRAGMENT
        )
        if not images:
            break
        log.info(f"Fetched image page {page} with {len(images)} images")
        for img in images:
            yield ("image", img)
        page += 1


def stream_scenes(
    client: StashInterface,
    skip_tag_ids: List[int],
    exclude_organized: bool,
    per_page: int = 100,
):
    page = 1
    base_filter = _build_filter(skip_tag_ids, exclude_organized)
    while True:
        pagination = {
            "page": page,
            "per_page": per_page,
            "sort": "created_at",
            "direction": "ASC",
        }
        scenes = client.find_scenes(
            f=base_filter, filter=pagination, fragment=SCENE_FRAGMENT
        )
        if not scenes:
            break
        log.info(f"Fetched scene page {page} with {len(scenes)} scenes")
        for sc in scenes:
            yield ("scene", sc)
        page += 1


def process_e621_post_for_item(
    stash: StashInterface, item_type: str, item_id: str, item_md5: str
) -> bool:
    if item_type == "image":
        obj = stash.find_image(item_id, fragment=IMAGE_FRAGMENT)
        already_tagged = any(t["name"] == "e621_tagged" for t in obj.get("tags", []))
        already_failed = any(
            t["name"] == "e621_tag_failed" for t in obj.get("tags", [])
        )
    else:
        obj = stash.find_scene(item_id, fragment=SCENE_FRAGMENT)
        already_tagged = any(t["name"] == "e621_tagged" for t in obj.get("tags", []))
        already_failed = any(
            t["name"] == "e621_tag_failed" for t in obj.get("tags", [])
        )

    if already_tagged or already_failed:
        return False

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
        try:
            payload = {"id": item_id, "tag_ids": list(set(fail_ids))}
            if item_type == "image":
                _update_image_minimal(stash, payload)
            else:
                _update_scene_minimal(stash, payload)
            return True
        except Exception as e2:
            log.error(f"Failed to mark as failed: {str(e2)}")
            return False

    if not post_data:
        return False

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
        name = char
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
            _update_image_minimal(stash, update_payload)
            log.debug(f"Image updated: {item_id}")
        else:
            _update_scene_minimal(stash, update_payload)
            log.info(f"Scene updated: {item_id}")
        return True
    except Exception as e:
        log.error(f"Update failed: {str(e)}")
        return False


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


def scrape_image(client: StashInterface, image_id: str) -> bool:
    image = client.find_image(image_id, fragment=IMAGE_FRAGMENT)
    if not image or not image.get("visual_files"):
        return False

    file_data = image["visual_files"][0]
    filename = file_data.get("basename", "")
    filename_md5 = filename.split(".")[0] if filename else ""

    if MD5_RE.match(filename_md5):
        final_md5 = filename_md5
        log.debug(f"Using filename MD5 for image: {final_md5}")
    else:
        file_md5 = _extract_file_md5(file_data)
        if file_md5:
            final_md5 = file_md5
            log.debug(f"Using file fingerprint MD5 for image: {final_md5}")
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
                return False

    return process_e621_post_for_item(client, "image", image_id, final_md5)


def scrape_scene(client: StashInterface, scene_id: str) -> bool:
    scene = client.find_scene(scene_id, fragment=SCENE_FRAGMENT)
    if not scene:
        return False

    final_md5 = None

    files = scene.get("files") or scene.get("scene_files") or []
    if not files:
        log.error(f"No files found for scene {scene_id}; cannot compute md5")
        return False

    file_data = files[0]
    file_md5 = _extract_file_md5(file_data)
    if file_md5:
        final_md5 = file_md5
        log.info(f"Using file fingerprint MD5 for scene: {final_md5}")
    else:
        basename = file_data.get("basename", "")
        filename_md5 = basename.split(".")[0] if basename else ""
        if MD5_RE.match(filename_md5):
            final_md5 = filename_md5
            log.info(f"Using filename MD5 for scene: {final_md5}")
        else:
            try:
                md5_hash = hashlib.md5()
                with open(file_data["path"], "rb") as f:
                    for chunk in iter(lambda: f.read(65536), b""):
                        md5_hash.update(chunk)
                final_md5 = md5_hash.hexdigest()
                log.info(f"Generated content MD5 for scene: {final_md5}")
            except Exception as e:
                log.error(f"Failed to generate MD5 for scene: {str(e)}")
                return False

    return process_e621_post_for_item(client, "scene", scene_id, final_md5)


if __name__ == "__main__":
    log.info("Starting tagger with scanning passes until no work left...")
    json_input = json.loads(sys.stdin.read())
    stash = StashInterface(json_input["server_connection"])

    config = stash.get_configuration().get("plugins", {})
    settings = {"SkipTags": "e621_tagged, e621_tag_failed", "ExcludeOrganized": False}
    settings.update(config.get("e621_tagger", {}))

    e621_tagged = get_or_create_tag(stash, "e621_tagged")
    e621_failed = get_or_create_tag(stash, "e621_tag_failed")

    skip_tag_names = [n.strip() for n in settings["SkipTags"].split(",") if n.strip()]
    skip_tag_ids: List[int] = []
    for name in skip_tag_names:
        found = stash.find_tags(f={"name": {"value": name, "modifier": "EQUALS"}})
        if found:
            skip_tag_ids.append(found[0]["id"])
    skip_tag_ids.extend([e621_tagged["id"], e621_failed["id"]])

    per_page = 50

    log.info("Counting images...")
    num_images = count_images(stash, skip_tag_ids, settings["ExcludeOrganized"])
    log.info("Counting scenes...")
    num_scenes = count_scenes(stash, skip_tag_ids, settings["ExcludeOrganized"])

    total = (num_images + num_scenes) or 1

    log.info(f"Total items (images + scenes): {total}")

    processed_count = 0
    pass_num = 0
    
    while True:
        pass_num += 1
        log.info(f"Starting scanning pass #{pass_num}")
        pass_processed = 0

        
        page = 1
        while True:
            pagination = {
                "page": page,
                "per_page": per_page,
                "sort": "created_at",
                "direction": "ASC",
            }
            images = stash.find_images(
                f=_build_filter(skip_tag_ids, settings["ExcludeOrganized"]),
                filter=pagination,
                fragment=IMAGE_FRAGMENT,
            )
            log.info(f"[pass {pass_num}] fetched image page {page}, count={len(images)}")
            if not images:
                break
            for img in images:
                item_id = img.get("id")
                if not item_id:
                    log.error(f"[pass {pass_num}] image without id on page {page}")
                    continue
                
                current = stash.find_image(item_id, fragment=IMAGE_FRAGMENT)
                current_tag_ids = [t["id"] for t in current.get("tags", [])]
                if any(tid in current_tag_ids for tid in skip_tag_ids):
                    log.info(f"[pass {pass_num}] skipping image {item_id} - now has skip tag")
                    processed_count += 1
                    pass_processed += 1
                    log.progress(float(processed_count) / float(total))
                    continue

                try:
                    updated = scrape_image(stash, item_id)
                except Exception as e:
                    log.error(f"[pass {pass_num}] scrape_image exception for {item_id}: {str(e)}")
                    updated = False

                if updated:
                    processed_count += 1
                    pass_processed += 1
                    log.debug(f"[pass {pass_num}] processed image {item_id} (processed_count={processed_count})")
                    log.progress(float(processed_count) / float(total))

            if len(images) < per_page:
                break
            page += 1

        
        page = 1
        while True:
            pagination = {
                "page": page,
                "per_page": per_page,
                "sort": "created_at",
                "direction": "ASC",
            }
            scenes = stash.find_scenes(
                f=_build_filter(skip_tag_ids, settings["ExcludeOrganized"]),
                filter=pagination,
                fragment=SCENE_FRAGMENT,
            )
            log.info(f"[pass {pass_num}] fetched scene page {page}, count={len(scenes)}")
            if not scenes:
                break
            for sc in scenes:
                item_id = sc.get("id")
                if not item_id:
                    log.error(f"[pass {pass_num}] scene without id on page {page}")
                    continue

                current = stash.find_scene(item_id, fragment=SCENE_FRAGMENT)
                current_tag_ids = [t["id"] for t in current.get("tags", [])]
                if any(tid in current_tag_ids for tid in skip_tag_ids):
                    log.info(f"[pass {pass_num}] skipping scene {item_id} - now has skip tag")
                    processed_count += 1
                    pass_processed += 1
                    log.progress(float(processed_count) / float(total))
                    continue

                try:
                    updated = scrape_scene(stash, item_id)
                except Exception as e:
                    log.error(f"[pass {pass_num}] scrape_scene exception for {item_id}: {str(e)}")
                    updated = False

                if updated:
                    processed_count += 1
                    pass_processed += 1
                    log.info(f"[pass {pass_num}] processed scene {item_id} (processed_count={processed_count})")
                    log.progress(float(processed_count) / float(total))

            if len(scenes) < per_page:
                break
            page += 1

        log.info(f"Pass #{pass_num} finished. items processed this pass: {pass_processed}")

        if pass_processed == 0:
            log.info("No items processed in last pass; finishing scan.")
            break

        time.sleep(0.2)

    log.progress(1.0)
