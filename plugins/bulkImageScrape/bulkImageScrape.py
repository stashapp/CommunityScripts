from collections.abc import Generator
import sys
import json
import math
import time

from PythonDepManager import ensure_import
ensure_import("stashapi@git+https://github.com/stg-annon/stashapi@f2de6fa")

import stashapi.log as log
from stashapi.stash_types import StashItem
from stashapi.stashapp import StashInterface
from stashapi.scrape_parser import ScrapeParser


#
# Helper functions
#

README_URL: str = "https://github.com/stashapp/CommunityScripts/blob/main/plugins/bulkImageScrape/README.md"


def validate_scraper(client: StashInterface, scraper_id: str) -> str:
    """
    Check if the requested scraper exists and is able to scrape images
    and return the id if it does
    """

    if scraper_id == "":
        log.error(
            "ScraperID is empty - cannot continue\n"
            "Please set a valid ScraperID in the plugin settings at:\n"
            "Settings -> Plugins -> Plugins -> BulkImageScrape -> ScraperID\n"
            f"as described in the README.md file at:\n"
            f"{README_URL}"
        )
        exit(1)

    scrapers: list[dict] = client.list_scrapers([StashItem.IMAGE])
    valid_scraper_ids: list[str] = []

    for scraper in scrapers:
        if scraper["id"] == scraper_id:
            valid_scraper_ids.append(scraper["id"])

    if len(valid_scraper_ids) == 0:
        log.error(
            f"No valid image scraper found with id {scraper_id}\n"
            "Please check the ScraperID is correct\n"
            "Your selected scraper should be listed at:\n"
            "Settings -> Metadata Providers -> Scrapers -> Image scrapers"
            f"as described in the README.md file at:\n"
            f"{README_URL}"
        )
        exit(1)

    if len(valid_scraper_ids) > 1:
        log.error(
            f"Multiple image scrapers found with id {scraper_id}\n"
            "Scraper ID must be unique - please fix your scraper installations\n"
            "Check your installed scrapers at:\n"
            "Settings -> Metadata Providers -> Installed Scrapers"
            f"as described in the README.md file at:\n"
            f"{README_URL}"
        )
        exit(1)

    return valid_scraper_ids[0]


def validate_stashapi(item: StashItem, client: StashInterface) -> None:
    """
    Quick check to make sure we have the correct version of stashapi installed
    """
    if item.IMAGE is None or not hasattr(client, "scrape_image"):
        log.error(
            "It seems you are using an older version of stashapi\n"
            "without support for image scraping.\n"
            "Please use the requirements.txt file to install the most recent version\n"
            f"as described in the README.md file at:\n"
            f"{README_URL}"
        )
        exit(1)


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


def parse_skip_tags(client: StashInterface, skip_tags: str) -> list[str]:
    """
    Parse the skip tags to a list of tag ids
    """
    if skip_tags == "" or skip_tags is None:
        return []

    skip_tags = skip_tags.split(",")
    tag_ids: list[str] = []
    for tag in skip_tags:
        tag_id: None | str = get_tag_id(client, tag.strip())
        if tag_id is not None:
            tag_ids.append(tag_id)
    return tag_ids

def parse_performerIds_filter(performerIdsFilter: str) -> list[str]:
    """
    Parse a list of performer ids
    """
    if performerIdsFilter == "" or performerIdsFilter is None:
        return []

    performerIdsFilter = performerIdsFilter.split(",")
    return performerIdsFilter


def build_image_filter(skip_tags: list[str], performerIdsFilter: list[str], exclude_organized: bool
) -> dict:
    image_filter: dict = {}

    if performerIdsFilter is not None and len(performerIdsFilter) > 0:
        log.info(f"Images filtered for performer ID : {performerIdsFilter}")
        image_filter["performers"] = {
            "value": performerIdsFilter,
            "modifier": "INCLUDES",
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

    return image_filter


def count_all_images(
    client: StashInterface, skip_tags: list[str], performerIdsFilter: list[str], exclude_organized: bool
) -> int:
    """
    count all images from the stash
    """
    image_filter: dict = build_image_filter(skip_tags=skip_tags, performerIdsFilter=performerIdsFilter, exclude_organized=exclude_organized)

    all_results: dict = {
        "page": 1,
        "per_page": 0,
        "sort": "created_at",
        "direction": "ASC",
    }

    total_images, images = client.find_images(f=image_filter, filter=all_results, get_count=True)

    return total_images


def get_all_images(
    client: StashInterface, skip_tags: list[str], performerIdsFilter: list[str], exclude_organized: bool, skip_entries: int = 0
) -> Generator[dict, None, None]:
    """
    Get all images from the stash
    """
    image_filter: dict = build_image_filter(skip_tags=skip_tags, performerIdsFilter=performerIdsFilter, exclude_organized=exclude_organized)

    page_size = 100
    page = 1
    if skip_entries > 0:
        page += math.floor(skip_entries / page_size)
        log.info(f"skipping to result page {page} with {page_size} entries each to skip around {skip_entries}")

    images = None
    while images is None or len(images) > 0:
        all_results: dict = {
            "page": page,
            "per_page": page_size,
            "sort": "created_at",
            "direction": "ASC",
        }

        images = client.find_images(f=image_filter, filter=all_results)

        for image in images:
            yield image

        page += 1


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
        # something went strangely wrong?
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
log.info("Starting Bulk Image Scrape Plugin")

config: dict = stash.get_configuration()["plugins"]
settings: dict[str, any] = {
    "ScraperID": "",
    "SkipTags": "",
    "PerformerIdsFilter": "",
    "CreateMissingPerformers": False,
    "CreateMissingStudios": False,
    "CreateMissingTags": False,
    "MergeExistingTags": False,
    "ExcludeOrganized": False,
    "SkipEntriesNum": 0,

}

if "BulkImageScrape" in config:
    settings.update(config["BulkImageScrape"])
log.info(f"settings: {settings=}")

scrape_parser = ScrapeParser(
    stash,
    log,
    settings["CreateMissingTags"],
    settings["CreateMissingStudios"],
    settings["CreateMissingPerformers"],
)

#
# VALIDATE ENVIRONMENT
#

validate_stashapi(StashItem.IMAGE, stash)
scraper_id: str = validate_scraper(stash, settings["ScraperID"])
parsed_skip_tags: list[str] = parse_skip_tags(stash, settings["SkipTags"])
parsed_performerids_filter: list[str] = parse_performerIds_filter(settings["PerformerIdsFilter"])

#
# MAIN
#

log.info("Querying images from stash")
total_images: int = count_all_images(
    stash, parsed_skip_tags, parsed_performerids_filter, settings["ExcludeOrganized"]
) - settings["SkipEntriesNum"]

if total_images == 0:
    log.info("No images found with the given filters")
    exit(0)
else:
    log.info(f"Found {total_images} images")

images: Generator[dict, None, None] = get_all_images(
    stash, parsed_skip_tags, parsed_performerids_filter, settings["ExcludeOrganized"], settings["SkipEntriesNum"]
)

for i, image in enumerate(images, start=1):
    time.sleep(0.5)
    log.progress((i / total_images))
    log.debug(f"Scraping image {image['id']} with scraper {scraper_id}")

    scrape: dict | list[dict] | None = scrape_image(stash, image["id"], scraper_id)
    valid: bool = scrape_is_valid(scrape)
    if not valid:
        log.debug(
            f"Scraper returned invalid/empty result for image {image['id']} "
            f"with scraper {scraper_id} - skipping"
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
