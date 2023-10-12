import json
import sys
import time

import log
from stash_interface import StashInterface

# Name of the tag used by this plugin
control_tag = "CopyTags"


def main():
    json_input = read_json_input()

    output = {}
    run(json_input, output)

    out = json.dumps(output)
    print(out + "\n")


def read_json_input():
    json_input = sys.stdin.read()
    return json.loads(json_input)


def run(json_input, output):
    mode_arg = json_input['args']['mode']

    try:
        if mode_arg == "" or mode_arg == "create":
            client = StashInterface(json_input["server_connection"])
            add_tag(client)
        elif mode_arg == "remove":
            client = StashInterface(json_input["server_connection"])
            remove_tag(client)
        elif mode_arg == "copy":
            client = StashInterface(json_input["server_connection"])
            copy_tags(client)
        elif mode_arg == "copyall":
            client = StashInterface(json_input["server_connection"])
            copy_all_tags(client)
        elif mode_arg == "studioImageCopy":
            client = StashInterface(json_input["server_connection"])
            image_studio_copy(client)
        elif mode_arg == "dateImageCopy":
            client = StashInterface(json_input["server_connection"])
            date_image_copy(client)
    except Exception:
        raise

    output["output"] = "ok"


# Helper function
def __copy_tags(client, galleries):
    # TODO: Multithreading
    count = 0
    for gallery in galleries:
        if gallery.get('scenes') is not None:
            if len(gallery.get('scenes')) == 0:
                log.LogWarning(f'Gallery {gallery.get("id")} has no scene attached')
                continue
            if len(gallery.get('scenes')) > 1:
                log.LogInfo(f'Gallery {gallery.get("id")} has multiple scenes, only copying tags from first scene')
            # Select first scene from gallery scenes
            scene_id = gallery.get('scenes')[0].get('id')
            scene = client.getSceneById(scene_id)
            gallery_data = {
                'id': gallery.get('id'),
                'title': scene.get('title')
            }
            if scene.get('details'):
                gallery_data['details'] = scene.get('details')
            if scene.get('url'):
                gallery_data['url'] = scene.get('url')
            if scene.get('date'):
                gallery_data['date'] = scene.get('date')
            if scene.get('rating'):
                gallery_data['rating'] = scene.get('rating')
            if scene.get('studio'):
                gallery_data['studio_id'] = scene.get('studio').get('id')
            if scene.get('tags'):
                tag_ids = [t.get('id') for t in scene.get('tags')]
                gallery_data['tag_ids'] = tag_ids
            if scene.get('performers'):
                performer_ids = [p.get('id') for p in scene.get('performers')]
                gallery_data['performer_ids'] = performer_ids

            client.updateGallery(gallery_data)
            log.LogDebug(f'Copied information to gallery {gallery.get("id")}')
            count += 1
    return count


def copy_tags(client):
    tag = client.findTagIdWithName(control_tag)
    if tag is None:
        sys.exit(f"Tag {control_tag} does not exist. Please create it via the 'Create CopyTags tag' task")

    tag_ids = [tag]

    galleries = client.findGalleriesByTags(tag_ids)

    log.LogDebug(f"Found {len(galleries)} galleries with {control_tag} tag")

    count = __copy_tags(client, galleries)

    log.LogInfo(f'Copied scene information to {count} galleries')


def copy_all_tags(client):
    log.LogWarning("#######################################")
    log.LogWarning("Warning! This task will copy all information to all galleries with attached scenes")
    log.LogWarning("You have 30 seconds to cancel this task before it starts copying")
    log.LogWarning("#######################################")

    time.sleep(30)
    log.LogInfo("Start copying information. This may take a while depending on the amount of galleries")
    # Get all galleries
    galleries = client.findGalleriesByTags([])
    log.LogDebug(f"Found {len(galleries)} galleries")
    count = __copy_tags(client, galleries)

    log.LogInfo(f'Copied scene information to {count} galleries')


def image_studio_copy(client):
    galleries = client.findGalleries()

    # List of gallery ids for each studio
    # {'studio_id': [gallery_ids]}
    studio_mapping = {}

    # Get studio from each gallery and add it to the mapping
    for gallery in galleries:
        studio = gallery.get('studio')
        if studio is not None:
            if studio_mapping.get(studio.get('id')):
                studio_mapping[studio.get('id')].append(int(gallery.get('id')))
            else:
                studio_mapping[studio.get('id')] = [int(gallery.get('id'))]

    log.LogDebug(f'Found {len(studio_mapping)} studios with galleries')

    # Bulk update all images in galleries for each studio
    for studio, galleries in studio_mapping.items():
        studio_id = int(studio)
        log.LogDebug(f'There are {len(galleries)} galleries with studio id {studio_id}')

        # Get images with gallery ids
        image_filter = {
            "galleries": {
                "value": galleries,
                "modifier": "INCLUDES"
            }
        }

        images = client.findImages(image_filter)
        log.LogDebug(f'There is a total of {len(images)} images with studio id {studio_id}')

        # Only update images with no studio or different studio
        to_update = [int(image.get('id')) for image in images if
                     (image.get('studio') is None or int(image.get('studio').get('id')) != studio_id)]
        log.LogInfo(f'Adding studio {studio_id} to {len(to_update)} images')

        # Bulk update images with studio_id
        client.updateImageStudio(image_ids=to_update, studio_id=studio_id)


def date_image_copy(client):
    image_filter = {
        'is_missing': 'date'
    }
    images = client.findImages(image_filter=image_filter)
    log.LogInfo(f"Found {len(images)} images with missing date")

    galleries = {}
    count = 0
    for image in images:
        i = image.get('id')
        image_galleries = image.get('galleries')
        if len(image_galleries) == 0:
            log.LogDebug(f"Skipping image {i}: missing gallery")
            continue
        gallery = image_galleries[0]
        if galleries.get(gallery.get('id')) is None:
            # Gallery date may be None, has to be checked later
            galleries[gallery.get('id')] = {'date': gallery.get('date'), 'images': []}
        galleries[gallery.get('id')]['images'].append(i)
        count = count + 1
    log.LogInfo(f"Updating {count} images")
    for gid, gallery in galleries.items():
        date = gallery.get('date')
        if date is None:
            log.LogInfo(f"Skipping gallery {gid}: missing date")
            continue
        client.updateImageDate(image_ids=gallery.get('images'), date=date)

def add_tag(client):
    tag_name = control_tag
    tag_id = client.findTagIdWithName(tag_name)

    if tag_id is None:
        client.createTagWithName(tag_name)
        log.LogInfo("Tag created successfully")
    else:
        log.LogInfo("Tag already exists")


def remove_tag(client):
    tag_name = control_tag
    tag_id = client.findTagIdWithName(tag_name)

    if tag_id is None:
        log.LogInfo("Tag does not exist. Nothing to remove")
        return

    log.LogInfo("Destroying tag")
    client.destroyTag(tag_id)


main()
