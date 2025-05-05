import sys
import json
import time
import stashapi.log as log
from stashapi.stash_types import StashItem
from stashapi.stashapp import StashInterface
from stashapi.scrape_parser import ScrapeParser

# Quick check to make sure we have the correct version of stashapi
if StashItem.IMAGE is None or not hasattr(StashInterface, "scrape_image"):
    log.error(
        "It seems you are using an older version of stashapi\n"
        "without support for image scraping.\n"
        "Please use the requirements.txt file to install the most recent version"
    )
    exit(1)


#
# Helper functions
#


def get_tag_id(client: StashInterface, tag_name: str) -> str | None:
    """
    Get the id of a tag by name or return None if the tag is not found
    """
    if tag_name == "" or tag_name is None:
        raise ValueError("Invalid tag name provided - skipping ...")

    tags: list[dict] = client.find_tags(
        f={"name": {"value": tag_name, "modifier": "EQUALS"}}
    )
    if len(tags) == 0:
        log.error(f"No id found for tag {tag_name} - skipping ...")
        return None
    return tags[0]["id"]


def get_scraper_id(client: StashInterface, scraper_name: str) -> str | None:
    """
    Get the id of a scraper by name or return None if the scraper is not found
    """
    scrapers: list[dict] = client.list_scrapers([StashItem.IMAGE])
    for scraper in scrapers:
        if scraper["name"] == scraper_name:
            return scraper["id"]
    return None


def parse_skip_tags(client: StashInterface, skip_tags: str) -> list[str]:
    """
    Parse the skip tags to a list of tag ids
    """
    skip_tags = skip_tags.split(",")
    tag_ids: list[str] = []
    for tag in skip_tags:
        tag_id: None | str = get_tag_id(client, tag.strip())
        if tag_id is not None:
            tag_ids.append(tag_id)
    return tag_ids


def get_all_images(
    client: StashInterface, skip_tags: list[str], exclude_organized: bool
) -> list[dict]:
    """
    Get all images from the stash
    """
    image_filter: dict = {}
    all_results: dict = {
        "page": 1,
        "per_page": -1,
        "sort": "created_at",
        "direction": "ASC",
    }

    if exclude_organized:
        image_filter["organized"] = False

    if skip_tags is not None and len(skip_tags) > 0:
        tags: list[str] = skip_tags
        image_filter["tags"] = {
            "value": [],
            "excludes": tags,
            "modifier": "INCLUDES_ALL",
            "depth": -1,
        }

    result: list[dict] = client.find_images(f=image_filter, filter=all_results)

    return result


def scrape_image(
    client: StashInterface, image_id: str, scraperid: str
) -> dict | list[dict] | None:
    """
    Scrape an image with the given scraper
    """
    try:
        scrape_result: dict = client.scrape_image(scraperid, image_id)
    except Exception as e:
        # Catch any exceptions not under our control
        # so we can continue with the next image in case of errors
        log.error(f"Error scraping image {image_id} with scraper {scraperid}: {e}")
        return None

    return scrape_result


def scrape_is_valid(scrape_input: dict | list[dict] | None) -> bool:
    """
    Check if the scrape is formatted as expected and has any data we can process
    """
    if scrape_input is None:
        # most likely the scraper failed or had an exception we catched and returned None
        return False
    elif isinstance(scrape_input, list):
        # single image scrape results are lists with a single dict inside
        return len(scrape_input) == 1 and scrape_is_valid(scrape_input[0])
    elif isinstance(scrape_input, dict):
        # check if there are any values that are
        # not None, empty lists, empty dicts, or empty strings
        return any(
            value
            for value in scrape_input.values()
            if value is not None and value != [] and value != {} and value != ""
        )
    else:
        # something went wrong strangely wrong?
        return False


def process_image_scrape(
    parser: ScrapeParser,
    image_input: dict,
    scrape_input: dict | list[dict],
    merge_existing_tags: bool,
) -> dict | None:
    """
    Process the scrape input and return an update dictionary
    """
    if isinstance(scrape_input, list) and len(scrape_input) == 1:
        # single image scrape results are lists with a single dict inside
        scrape_input = scrape_input[0]
    elif isinstance(scrape_input, dict):
        # do nothing if its already a dict
        pass
    else:
        log.error(f"Unknown scrape input type for image {image_input['id']}")
        return None

    update_dict: dict = parser.image_from_scrape(scrape_input)
    update_dict["id"] = image_input["id"]
    if merge_existing_tags:
        existing_tags: list = [tag["id"] for tag in image_input["tags"]]
        merged_tags: list = list(set(existing_tags + update_dict["tag_ids"]))
        update_dict["tag_ids"] = merged_tags

    return update_dict


def update_image(client: StashInterface, update: dict) -> dict | None:
    """
    Update the image with the given update
    """

    try:
        return client.update_image(update)
    except Exception as e:
        # Catch any exceptions not under our control
        # so we can continue with the next image in case of errors
        log.error(f"Error updating image {update['id']}: {e}")
        return None


#
# SETUP
#


json_input: dict = json.loads(sys.stdin.read())
FRAGMENT_SERVER: dict = json_input["server_connection"]
stash: StashInterface = StashInterface(FRAGMENT_SERVER)

config: dict = stash.get_configuration()["plugins"]
settings: dict[str, any] = {
    "ScraperID": "",
    "SkipTags": "",
    "CreateMissingPerformers": False,
    "CreateMissingStudios": False,
    "CreateMissingTags": False,
    "MergeExistingTags": False,
    "ExcludeOrganized": False,
}

if "BulkImageScrape" in config:
    settings.update(config["BulkImageScrape"])

scrape_parser = ScrapeParser(
    stash,
    log,
    settings["CreateMissingTags"],
    settings["CreateMissingStudios"],
    settings["CreateMissingPerformers"],
)

#
# Validate input settings
#


# Exit if no ScraperID is set or we cannot resolve it
if settings["ScraperID"] == "":
    log.error("No ScraperID set")
    exit(1)

scraper_id: None | str = get_scraper_id(stash, settings["ScraperID"])
if scraper_id is None:
    log.error(f"ScraperID {settings['ScraperID']} not found - cannot continue")
    log.error("Please check the ScraperID is correct and try again")
    exit(1)

# parse the skip tags to a list of tag ids if we have any
parsed_skip_tags: list[str] = []
if settings["SkipTags"] != "":
    parsed_skip_tags = parse_skip_tags(stash, settings["SkipTags"])
    if len(parsed_skip_tags) == 0:
        parsed_skip_tags = []

#
# MAIN
#

log.info("Starting Bulk Image Scrape Plugin")
log.info(f"settings: {settings=}")
log.info("Querying images from stash")

images: list[dict] = get_all_images(
    stash, parsed_skip_tags, settings["ExcludeOrganized"]
)

total_images: int = len(images)
if total_images == 0:
    log.info("No images found with the given filters")
    exit(0)
else:
    log.info(f"Found {len(images)} images")


for i, image in enumerate(images, start=1):
    time.sleep(0.5)
    log.progress((i / total_images))
    log.debug(f"Scraping image {image['id']} with scraper {scraper_id}")

    scrape: dict | list[dict] | None = scrape_image(stash, image["id"], scraper_id)
    valid: bool = scrape_is_valid(scrape)
    if not valid:
        log.debug(
            f"Scraper returned invalid/empty result for image {image['id']} with scraper {scraper_id} - skipping"
        )
        continue

    update_input: dict | None = process_image_scrape(
        scrape_parser, image, scrape, settings["MergeExistingTags"]
    )
    if update_input is not None:
        update_image(stash, update_input)
        log.info(f"Updated image {image['id']} with scraper {scraper_id}")
    else:
        log.error(
            f"Failed to update image {image['id']} with result from scraper {scraper_id}"
        )
