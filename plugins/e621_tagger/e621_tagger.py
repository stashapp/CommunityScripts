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


    if any(tag["name"] == "e621_tag_failed" for tag in image.get("tags", [])):
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
        log.error(f"Marking as failed. e621 API error: {str(e)}")
        e621_tag_failed_tag = get_or_create_tag(stash, "e621_tag_failed")
        image_tags_on_e621_fail_ids = [e621_tag_failed_tag["id"]]

        for tag in image.get("tags"):
            image_tags_on_e621_fail_ids.append(tag["id"])
       
        stash.update_image({
            "id": image_id,
            "tag_ids": list(set(image_tags_on_e621_fail_ids))
        })

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
            # Clean and validate tag
            clean_tag = tag.strip()
            if not clean_tag:
                continue
            
            stash_tag = get_or_create_tag(stash, clean_tag)
            if stash_tag:
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
            "organized": True,
            "urls": [post_url],
            "tag_ids": list(set(tag_ids)),
            "studio_id": studio_id,
            "performer_ids": performer_ids
        })

        log.info("Image updated: ${image_id}")
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
    image = client.find_image(image_id)
    if not image or not image.get("visual_files"):
        return

    file_data = image["visual_files"][0]
    filename = file_data["basename"]
    filename_md5 = filename.split('.')[0]
    final_md5 = None

    # First try filename-based MD5
    if re.match(r"^[a-f0-9]{32}$", filename_md5):
        final_md5 = filename_md5
        log.info(f"Using filename MD5: {final_md5}")
    else:
        # Fallback to content-based MD5
        try:
            file_path = file_data["path"]
            log.info(f"Generating MD5 from file content: {file_path}")
            
            md5_hash = hashlib.md5()
            with open(file_path, "rb") as f:
                # Read file in 64kb chunks for memory efficiency
                for chunk in iter(lambda: f.read(65536), b""):
                    md5_hash.update(chunk)
            
            final_md5 = md5_hash.hexdigest()
            log.info(f"Generated content MD5: {final_md5}")
        except Exception as e:
            log.error(f"Failed to generate MD5: {str(e)}")
            return

    if final_md5:
        process_e621_post(client, image_id, final_md5)
    else:
        log.warning("No valid MD5 available for processing")

# Plugin setup and execution
# In the main execution block:
if __name__ == "__main__":
    log.info("Starting tagger...")
    json_input = json.loads(sys.stdin.read())
    stash = StashInterface(json_input["server_connection"])

    config = stash.get_configuration().get("plugins", {})
    settings = {
        "SkipTags": "e621_tagged, e621_tag_failed",  # Add automatic filtering
        "ExcludeOrganized": False
    }
    settings.update(config.get("e621_tagger", {}))

    log.info(settings)

    # Get e621_tagged ID for filtering
    e621_tagged_tag = get_or_create_tag(stash, "e621_tagged")
    e621_tag_failed_tag = get_or_create_tag(stash, "e621_tag_failed")

    # Existing tags + automatic e621_tagged exclusion
    skip_tags = [t.strip() for t in settings["SkipTags"].split(",") if t.strip()]
    skip_tags.append(e621_tagged_tag["id"])  # Filter by ID instead of name
    skip_tags.append(e621_tag_failed_tag["id"])  # Filter by ID instead of name

    log.info("Getting images...")
    images = get_all_images(stash, skip_tags, settings["ExcludeOrganized"])
    log.info(f"Got ${str(len(images))} images");

    # Rest of the loop remains the same
    for i, image in enumerate(images, 1):
        image_tag_names = [tag["name"] for tag in image.get("tags", [])]
        if any(tag in image_tag_names for tag in skip_tags):
            log.info(f"Skipping image {image['id']} - contains skip tag")
            continue

        log.progress(i/len(images))
        scrape_image(stash, image["id"])
