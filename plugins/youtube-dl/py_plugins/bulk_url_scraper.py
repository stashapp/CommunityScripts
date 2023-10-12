import sys
import time
import array
import json
from enum import Enum
from typing import Dict
from urllib.parse import urlparse

import log
import config
from stash_interface import StashInterface

# Name of the tag, that will be used for selecting scenes for bulk scraping
control_tag = "scrape"


# Enumeration of (supported) entity types
# Entities in this plugin are scrapable objects in stash like scenes and galleries
class Entity(Enum):
    Scene = 'scenes'
    Gallery = 'galleries'


def main():
    json_input = read_json_input()

    output = {}
    run(json_input, output)

    out = json.dumps(output)
    print(out + "\n")


# Waits the remaining time between the last timestamp and the configured delay in seconds
def wait(delay, time_last, time_now) -> int:
    time_last = int(time_last)
    time_now = int(time_now)
    if time_now > time_last:
        if time_now - time_last < delay:
            time.sleep(delay - (time_now - time_last) + 1)
    return time_now


def read_json_input():
    json_input = sys.stdin.read()
    return json.loads(json_input)


def run(json_input, output):
    mode_arg = json_input['args']['mode']

    try:
        if mode_arg == "" or mode_arg == "scrape":
            client = StashInterface(json_input["server_connection"])
            bulk_scrape(client)
        elif mode_arg == "create":
            client = StashInterface(json_input["server_connection"])
            add_tag(client)
        elif mode_arg == "remove":
            client = StashInterface(json_input["server_connection"])
            remove_tag(client)
    except Exception:
        raise

    output["output"] = "ok"


def __bulk_scrape(client,
                  entities: Dict[Entity, array.array],
                  create_missing_performers=True,
                  create_missing_tags=False,
                  create_missing_studios=False,
                  create_missing_movies=False,
                  delay=5) -> None:
    last_request = -1
    # Unpack entity dict and iterate over each type (scenes, galleries)
    # entities is non empty and contains at least one non empty entity type
    for entity_class, entity_array in entities.items():
        log.LogInfo(f"Scraping {entity_class.value}")
        # Fetch available url scrapers for entity type
        if entity_class is Entity.Scene:
            supported_scrapers = client.sceneScraperURLs()
        elif entity_class is Entity.Gallery:
            supported_scrapers = client.galleryScraperURLs()
        else:
            raise TypeError(f"Unexpected Entity type: {entity_class}")

        if delay > 0:
            # Initialize last request with current time + delay time
            last_request = time.time() + delay

        missing_scrapers = list()

        # Number of scraped scenes
        count = 0

        total = len(entity_array)
        # Index for progress bar
        i = 0

        # Scrape if url not in missing_scrapers
        for entity in entity_array:
            # Update status bar
            i += 1
            log.LogProgress(i / total)

            if entity.get('url') is None or entity.get('url') == "":
                # Skip the scene/gallery if it does not have an url
                log.LogInfo(f"{entity_class.name} {entity.get('id')} is missing url")
                continue

            url_netloc = urlparse(entity.get("url")).netloc.split('www.')[-1]  # URL domain name (without www. and tld)
            if url_netloc not in missing_scrapers:
                if delay:
                    last_request = wait(delay, last_request, time.time())

                # The query has different fields, so there can not be one scrapeURL function
                if entity_class is Entity.Scene:
                    scraped_data = client.scrapeSceneURL(entity.get('url'))
                elif entity_class is Entity.Gallery:
                    scraped_data = client.scrapeGalleryURL(entity.get('url'))
                else:
                    raise TypeError(f"Unexpected Entity type: {entity_class}")
                if scraped_data is None:
                    if url_netloc not in supported_scrapers:
                        # If result is null, and url is not in list of supported scrapers, add url to missing_scrapers
                        # Faster then checking every time, if url is in list of supported scrapers
                        log.LogWarning(
                            f"{entity_class.name} {entity.get('id')}: "
                            f"Missing scraper for {url_netloc}"
                        )
                        log.LogDebug(f"Full url: {entity.get('url')}")
                        missing_scrapers.append(url_netloc)
                    else:
                        log.LogInfo(f"Could not scrape {entity_class.name.lower()} {entity.get('id')}")
                        log.LogDebug("Return data was None")
                    continue
                # No data has been found for this scene
                if not any(scraped_data.values()):
                    log.LogInfo(f"Could not get data for {entity_class.name.lower()} {entity.get('id')}")
                    continue

                update_entity(client=client, entity=entity, entity_type=entity_class,
                              scraped_data=scraped_data,
                              create_missing_tags=create_missing_tags,
                              create_missing_performers=create_missing_performers,
                              create_missing_studios=create_missing_studios,
                              create_missing_movies=create_missing_movies)

                log.LogDebug(f"Scraped data for {entity_class.name.lower()} {entity.get('id')}")
                count += 1

        log.LogInfo(f"Scraped data for {count} {entity_class.value}")


def bulk_scrape(client, create_missing_performers=False, create_missing_tags=False, create_missing_studios=False,
                create_missing_movies=False, delay=5):
    try:
        create_missing_studios = bool(config.create_missing_studios)
        create_missing_tags = bool(config.create_missing_tags)
        create_missing_performers = bool(config.create_missing_performers)
        create_missing_movies = bool(config.create_missing_movies)
        delay = int(config.delay)
    except AttributeError as e:
        log.LogWarning(e)
        log.LogWarning("Using defaults for missing config values")
    except ValueError as e:
        log.LogWarning(e)
        log.LogWarning("Using defaults for wrong values")

    log.LogInfo('##### Bulk URL Scraper #####')
    log.LogInfo(f'create_missing_performers: {create_missing_performers}')
    log.LogInfo(f'create_missing_tags: {create_missing_tags}')
    log.LogInfo(f'create_missing_studios: {create_missing_studios}')
    log.LogInfo(f'create_missing_movies: {create_missing_movies}')
    log.LogInfo(f'delay: {delay}')
    log.LogInfo('#############################')

    # Search for all scenes with scrape tag
    tag = client.findTagIdWithName(control_tag)
    if tag is None:
        sys.exit("Tag scrape does not exist. Please create it via the 'Create scrape tag' task")

    tag_ids = [tag]
    entities = {}
    scenes = client.findScenesByTags(tag_ids)
    log.LogInfo(f'Found {len(scenes)} scenes with scrape tag')
    if len(scenes) > 0:
        entities[Entity.Scene] = scenes
    galleries = client.findGalleriesByTags(tag_ids)
    log.LogInfo(f'Found {len(galleries)} galleries with scrape tag')
    if len(galleries) > 0:
        entities[Entity.Gallery] = galleries

    if len(entities) > 0:
        __bulk_scrape(
            client=client,
            entities=entities,
            create_missing_tags=create_missing_tags,
            create_missing_performers=create_missing_performers,
            create_missing_studios=create_missing_studios,
            create_missing_movies=create_missing_movies,
            delay=delay
        )


# Updates an entity with the scraped data
def update_entity(client: StashInterface, entity, entity_type: Entity, scraped_data, create_missing_tags: bool,
                  create_missing_performers: bool, create_missing_studios: bool, create_missing_movies: bool):
    # Create dict with entity data
    update_data = {
        'id': entity.get('id')
    }
    if scraped_data.get('title'):
        update_data['title'] = scraped_data.get('title')
    if scraped_data.get('details'):
        update_data['details'] = scraped_data.get('details')
    if scraped_data.get('date'):
        update_data['date'] = scraped_data.get('date')
    if entity_type is Entity.Scene:
        # Images are only supported for scenes
        if scraped_data.get('image'):
            update_data['cover_image'] = scraped_data.get('image')
    if scraped_data.get('tags'):
        tag_ids = list()
        for tag in scraped_data.get('tags'):
            if tag.get('stored_id'):
                tag_ids.append(tag.get('stored_id'))
            else:
                if create_missing_tags and tag.get('name') != "":
                    # Capitalize each word
                    tag_name = " ".join(x.capitalize() for x in tag.get('name').split(" "))
                    log.LogInfo(f'Create missing tag: {tag_name}')
                    tag_id = client.createTagWithName(tag_name)
                    if tag_id is not None:
                        tag_ids.append(tag_id)
        if len(tag_ids) > 0:
            update_data['tag_ids'] = tag_ids

    if scraped_data.get('performers'):
        performer_ids = list()
        for performer in scraped_data.get('performers'):
            if performer.get('stored_id'):
                performer_ids.append(performer.get('stored_id'))
            else:
                if create_missing_performers and performer.get('name') != "":
                    performer_name = " ".join(x.capitalize() for x in performer.get('name').split(" "))
                    log.LogInfo(f'Create missing performer: {performer_name}')
                    performer_id = client.createPerformerByName(performer_name)
                    if performer_id is not None:
                        performer_ids.append(performer_id)
        if len(performer_ids) > 0:
            update_data['performer_ids'] = performer_ids

    if scraped_data.get('studio'):
        studio = scraped_data.get('studio')
        if studio.get('stored_id'):
            update_data['studio_id'] = studio.get('stored_id')
        else:
            if create_missing_studios:
                studio_name = " ".join(x.capitalize() for x in studio.get('name').split(" "))
                log.LogInfo(f'Creating missing studio {studio_name}')
                studio_url = '{uri.scheme}://{uri.netloc}'.format(uri=urlparse(entity.get('url')))
                studio_id = client.createStudio(studio_name, studio_url)
                if studio_id is not None:
                    update_data['studio_id'] = studio_id

    if scraped_data.get('movies'):
        movies = list()
        for movie in scraped_data.get('movies'):
            if movie.get('stored_id'):
                movies.append({'movie_id': movie.get('stored_id')})
            else:
                if create_missing_movies and movie.get('name') != '':
                    log.LogInfo(f'Create missing movie: {movie.get("name")}')
                    if movie.get('url') is not None and movie.get('url') != '':
                        movie_id = client.createMovie(movie.get('name'), movie.get('url'))
                    else:
                        movie_id = client.createMovie(movie.get('name'))

                    if movie_id is not None:
                        movies.append({'movie_id': movie_id})
        if len(movies) > 0:
            update_data['movies'] = movies

    # Update entity with scraped scene data
    if entity_type is Entity.Scene:
        client.updateScene(update_data)
    elif entity_type is Entity.Gallery:
        client.updateGallery(update_data)
    else:
        raise TypeError(f"Unexpected Entity type: {entity_type}")


def add_tag(client):
    tag_id = client.findTagIdWithName(control_tag)

    if tag_id is None:
        client.createTagWithName(control_tag)
        log.LogInfo("Tag created successfully")
    else:
        log.LogInfo("Tag already exists")


def remove_tag(client):
    tag_id = client.findTagIdWithName(control_tag)

    if tag_id is None:
        log.LogInfo("Tag does not exist. Nothing to remove")
        return

    log.LogInfo("Destroying tag")
    client.destroyTag(tag_id)


main()
