import hashlib
import re
import sys
import json
import time
import requests
import stashapi.log as log
from stashapi.stashapp import StashInterface


def get_all_images(
    client: StashInterface,
    skip_tags: list[int],
    exclude_organized: bool,
    per_page: int = 100,
) -> list[dict]:
    """
    Generator to fetch images in pages from the stash API.
    """
    page = 1
    while True:
        image_filter = {}
        pagination = {
            "page": page,
            "per_page": per_page,
            "sort": "created_at",
            "direction": "ASC",
        }

        if skip_tags:
            image_filter["tags"] = {
                "value": [],
                "excludes": skip_tags,
                "modifier": "INCLUDES_ALL",
                "depth": -1,
            }

        if exclude_organized:
            image_filter["organized"] = False

        images = client.find_images(f=image_filter, filter=pagination)
        if not images:
            # no more pages
            break

        log.info(f"Fetched page {page} with {len(images)} images")
        for img in images:
            yield img

        # move to next page
        page += 1


def process_e621_post(stash: StashInterface, image_id: str, image_md5: str) -> None:
    """Process e621 metadata and update Stash records"""
    # same as before...
    image = stash.find_image(image_id)
    if any(t["name"] == "e621_tagged" for t in image.get("tags", [])):
        return

    if any(t["name"] == "e621_tag_failed" for t in image.get("tags", [])):
        return

    try:
        time.sleep(0.5)
        response = requests.get(
            f"https://e621.net/posts.json?md5={image_md5}",
            headers={"User-Agent": "Stash-e621-Tagger/1.0"},
            timeout=10
        )
        response.raise_for_status()
        post_data = response.json().get("post", {})
    except Exception as e:
        log.error(f"Marking as failed. e621 API error: {str(e)}")
        e621_tag_failed = get_or_create_tag(stash, "e621_tag_failed")
        fail_ids = [e621_tag_failed["id"]] + [t["id"] for t in image.get("tags", [])]
        stash.update_image({"id": image_id, "tag_ids": list(set(fail_ids))})
        return

    if not post_data:
        return

    e621_tag = get_or_create_tag(stash, "e621_tagged")
    post_url = f"https://e621.net/posts/{post_data['id']}"

    tag_ids = [e621_tag["id"]]
    for cat in ["general", "species", "character", "artist", "copyright"]:
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
        name = char.split('_(')[0]
        perf = get_or_create_performer(stash, name)
        performer_ids.append(perf["id"])

    try:
        stash.update_image({
            "id": image_id,
            "organized": True,
            "urls": [post_url],
            "tag_ids": list(set(tag_ids)),
            "studio_id": studio_id,
            "performer_ids": performer_ids
        })
        log.info(f"Image updated: {image_id}")
    except Exception as e:
        log.error(f"Update failed: {str(e)}")


def get_or_create_tag(stash: StashInterface, tag_name: str) -> dict:
    """Find or create tag with hierarchy handling"""
    # Validate tag name
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
        current_name = ":".join(parts[:i+1]).strip()
        if not current_name:
            continue
            
        existing = stash.find_tags(f={"name": {"value": current_name, "modifier": "EQUALS"}})
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
    """Find or create studio"""
    studios = stash.find_studios(f={"name": {"value": name, "modifier": "EQUALS"}})
    return studios[0] if studios else stash.create_studio({"name": name})


def get_or_create_performer(stash: StashInterface, name: str) -> dict:
    """Find or create performer"""
    performers = stash.find_performers(f={"name": {"value": name, "modifier": "EQUALS"}})
    return performers[0] if performers else stash.create_performer({"name": name})


def scrape_image(client: StashInterface, image_id: str) -> None:
    """Main scraping handler"""
    # same logic as before for MD5 extraction and process_e621_post call
    image = client.find_image(image_id)
    if not image or not image.get("visual_files"):
        return

    file_data = image["visual_files"][0]
    filename = file_data["basename"]
    filename_md5 = filename.split('.')[0]

    if re.match(r"^[a-f0-9]{32}$", filename_md5):
        final_md5 = filename_md5
        log.info(f"Using filename MD5: {final_md5}")
    else:
        try:
            md5_hash = hashlib.md5()
            with open(file_data["path"], "rb") as f:
                for chunk in iter(lambda: f.read(65536), b""):
                    md5_hash.update(chunk)
            final_md5 = md5_hash.hexdigest()
            log.info(f"Generated content MD5: {final_md5}")
        except Exception as e:
            log.error(f"Failed to generate MD5: {str(e)}")
            return

    process_e621_post(client, image_id, final_md5)


if __name__ == "__main__":
    log.info("Starting tagger with pagination...")
    json_input = json.loads(sys.stdin.read())
    stash = StashInterface(json_input["server_connection"])

    config = stash.get_configuration().get("plugins", {})
    settings = {
        "SkipTags": "e621_tagged, e621_tag_failed",
        "ExcludeOrganized": False
    }
    settings.update(config.get("e621_tagger", {}))

    e621_tagged = get_or_create_tag(stash, "e621_tagged")
    e621_failed = get_or_create_tag(stash, "e621_tag_failed")

    skip_tags = [t.strip() for t in settings["SkipTags"].split(",") if t.strip()]
    skip_tags = [st for st in skip_tags]
    skip_tags.extend([e621_tagged["id"], e621_failed["id"]])

    log.info("Fetching images in pages...")
    for idx, image in enumerate(get_all_images(stash, skip_tags, settings["ExcludeOrganized"], per_page=100), start=1):
        current_tags = [t["name"] for t in image.get("tags", [])]
        if any(t in current_tags for t in skip_tags):
            log.info(f"Skipping image {image['id']} - contains skip tag")
            continue

        log.progress(idx)
        scrape_image(stash, image["id"])
