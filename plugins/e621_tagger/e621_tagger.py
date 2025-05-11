import re
import sys
import json
import time
import requests
import stashapi.log as log
from stashapi.stashapp import StashInterface



def get_all_images(
    client: StashInterface, 
    skip_tags: list[str], 
    exclude_organized: bool
) -> list[dict]:
    """
    Get all images with proper tag exclusion and organization filter
    """
    image_filter = {}
    pagination = {
        "page": 1,
        "per_page": -1,  # -1 gets all results at once
        "sort": "created_at",
        "direction": "ASC",
    }

    # Convert tag names to IDs
    tag_ids = []
    for tag_name in skip_tags:
        tag = get_or_create_tag(client, tag_name)
        if tag:
            tag_ids.append(tag["id"])

    if tag_ids:
        image_filter["tags"] = {
            "value": [],
            "excludes": tag_ids,
            "modifier": "INCLUDES_ALL",
            "depth": -1,
        }

    if exclude_organized:
        image_filter["organized"] = False  # Correct field name

    # Maintain original parameter structure
    return client.find_images(f=image_filter, filter=pagination)


def process_e621_post(stash: StashInterface, image_id: str, image_md5: str) -> None:
    """Process e621 metadata and update Stash records"""
    # Skip already processed images
    image = stash.find_image(image_id)
    if any(tag["name"] == "e621_tagged" for tag in image.get("tags", [])):
        return

    try:
        time.sleep(2)  # Rate limiting
        response = requests.get(
            f"https://e621.net/posts.json?md5={image_md5}",
            headers={"User-Agent": "Stash-e621-Tagger/1.0"},
            timeout=10
        )
        response.raise_for_status()
        post_data = response.json().get("post", {})
    except Exception as e:
        log.error(f"e621 API error: {str(e)}")
        return

    if not post_data:
        return

    # Create essential entities
    e621_tag = get_or_create_tag(stash, "e621_tagged")
    post_url = f"https://e621.net/posts/{post_data['id']}"

    # Process tags
    tag_ids = [e621_tag["id"]]
    for category in ["general", "species", "character", "artist", "copyright"]:
        for tag in post_data.get("tags", {}).get(category, []):
            stash_tag = get_or_create_tag(stash, tag)
            tag_ids.append(stash_tag["id"])

    # Process studio
    studio_id = None
    if artists := post_data.get("tags", {}).get("artist"):
        studio = get_or_create_studio(stash, artists[0])
        studio_id = studio["id"]

    # Process performers
    performer_ids = []
    for char_tag in post_data.get("tags", {}).get("character", []):
        performer_name = char_tag.split('_(')[0]
        performer = get_or_create_performer(stash, performer_name)
        performer_ids.append(performer["id"])

    # Update image
    try:
        stash.update_image({
            "id": image_id,
            "urls": [post_url],
            "tag_ids": list(set(tag_ids)),
            "studio_id": studio_id,
            "performer_ids": performer_ids
        })
    except Exception as e:
        log.error(f"Update failed: {str(e)}")


def get_or_create_tag(stash: StashInterface, tag_name: str) -> dict:
    """Find or create tag with hierarchy handling"""
    existing = stash.find_tags(f={"name": {"value": tag_name, "modifier": "EQUALS"}})
    if existing:
        return existing[0]
    
    parts = tag_name.split(":")
    parent_id = None
    for i in range(len(parts)):
        current_name = ":".join(parts[:i+1])
        existing = stash.find_tags(f={"name": {"value": current_name, "modifier": "EQUALS"}})
        if not existing:
            create_data = {"name": current_name}
            if parent_id:
                create_data["parent_ids"] = [parent_id]
            new_tag = stash.create_tag(create_data)
            parent_id = new_tag["id"]
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
    image = client.find_image(image_id)
    if not image or not image.get("visual_files"):
        return

    file_data = image["visual_files"][0]
    filename = file_data["basename"]
    filename_md5 = filename.split('.')[0]

    if not re.match(r"^[a-f0-9]{32}$", filename_md5):
        return

    process_e621_post(client, image_id, filename_md5)


# Plugin setup and execution
if __name__ == "__main__":
    json_input = json.loads(sys.stdin.read())
    stash = StashInterface(json_input["server_connection"])

    config = stash.get_configuration().get("plugins", {})
    settings = {
        "SkipTags": "",
        "ExcludeOrganized": False
    }
    settings.update(config.get("BulkImageScrape", {}))

    skip_tags = [t.strip() for t in settings["SkipTags"].split(",") if t.strip()]
    images = get_all_images(stash, skip_tags, settings["ExcludeOrganized"])

    for i, image in enumerate(images, 1):
        time.sleep(0.5)
        log.progress(i/len(images))
        scrape_image(stash, image["id"])
