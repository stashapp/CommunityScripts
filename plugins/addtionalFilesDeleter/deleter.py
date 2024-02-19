import sys
import json

import stashapi.log as log
from stashapi.stashapp import StashInterface

SVG_IMAGE = (
    "data:image/svg+xml;base64,PCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIi"
    "AiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KDTwhLS0gVXBsb2FkZW"
    "QgdG86IFNWRyBSZXBvLCB3d3cuc3ZncmVwby5jb20sIFRyYW5zZm9ybWVkIGJ5OiBTVkcgUmVwbyBNaXhlciBUb2"
    "9scyAtLT4KPHN2ZyB3aWR0aD0iODAwcHgiIGhlaWdodD0iODAwcHgiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD"
    "0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KDTxnIGlkPSJTVkdSZXBvX2JnQ2Fycm"
    "llciIgc3Ryb2tlLXdpZHRoPSIwIi8+Cg08ZyBpZD0iU1ZHUmVwb190cmFjZXJDYXJyaWVyIiBzdHJva2UtbGluZW"
    "NhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KDTxnIGlkPSJTVkdSZXBvX2ljb25DYXJyaWVyIj"
    "4gPHBhdGggZD0iTTUuNjM2MDUgNS42MzYwNUwxOC4zNjQgMTguMzY0TTUuNjM2MDUgMTguMzY0TDE4LjM2NCA1Lj"
    "YzNjA1TTIxIDEyQzIxIDE2Ljk3MDYgMTYuOTcwNiAyMSAxMiAyMUM3LjAyOTQ0IDIxIDMgMTYuOTcwNiAzIDEyQz"
    "MgNy4wMjk0NCA3LjAyOTQ0IDMgMTIgM0MxNi45NzA2IDMgMjEgNy4wMjk0NCAyMSAxMloiIHN0cm9rZT0iI2ZmZm"
    "ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPiA8L2c+Cg08L3N2Zz4="
)


tag_exclude = {
    "name": "Addtional Files Deleter: Scenes/Images: Ignore",
    "description": "Addtional Files Deleter: Scene/Image Objects that contain addtional files "
    "will not be deleted",
    "image": SVG_IMAGE
}


def main():
    global stash

    json_input = json.loads(sys.stdin.read())
    mode_arg = json_input["args"]["mode"]

    stash = StashInterface(json_input["server_connection"])

    if mode_arg == "create_tag":
        create_tag(tag_exclude)
    if mode_arg == "remove_tag":
        remove_tag()
    if mode_arg == "images_delete":
        images_delete()
    if mode_arg == "images_delete_record_paths":
        images_delete_record_paths()
    if mode_arg == "scenes_delete":
        scenes_delete()
    if mode_arg == "scenes_delete_record_paths":
        scenes_delete_record_paths()


def update_image(image_id, paths):
    update = stash.update_image(
        {'id': image_id, 'urls': paths})
    return update


def update_scene(scene_id, paths):
    update = stash.update_scene(
        {'id': scene_id, 'urls': paths})
    return update


def find_images(find_images_tag):
    log.debug(f"Hello: {find_images_tag}")
    images = stash.find_images(
        f={
            "file_count": {"modifier": "GREATER_THAN", "value": 1},
            "tags": {"modifier": "EXCLUDES", "value": find_images_tag},
        },
        filter={
            "per_page": "-1"
        }
    )
    return images


def find_scenes(find_scenes_tag):
    scenes = stash.find_scenes(
        f={
            "file_count": {"modifier": "GREATER_THAN", "value": 1},
            "tags": {"modifier": "EXCLUDES", "value": find_scenes_tag},
        }
    )
    return scenes


def find_tag(name, create=False):
    find_tag_tag = stash.find_tag(name, create)
    if find_tag_tag is None:
        log.error(f"Tag does not exist: {tag_exclude['name']}")
    else:
        log.info(f"Found Tag: ID:{find_tag_tag['id']} Name: {find_tag_tag['name']}")
    return find_tag_tag


def create_tag(obj):
    create_tag_tag = stash.create_tag(obj)

    if create_tag_tag is None:
        log.error(f'Tag already exists: {tag_exclude["name"]}')
    else:
        log.info(f"Created Tag: ID:{create_tag_tag['id']} Name: {create_tag_tag['name']}")
    return create_tag_tag


def remove_tag():
    remove_tag_tag = find_tag(tag_exclude["name"])
    if remove_tag_tag is not None:
        stash.destroy_tag(remove_tag_tag['id'])
        log.info(f"Deleted Tag - ID:{remove_tag_tag['id']}: Name: {remove_tag_tag['name']}")


def images_delete():
    log.info("Addtional Files Deleter: Initialised with Args: images_delete")
    images_delete_tag = find_tag(tag_exclude)

    if images_delete_tag is None:
        images_delete_tag = create_tag(tag_exclude)

    images = find_images(images_delete_tag["id"])

    for image in images:
        log.info(f"ID:{image['id']} - Deleting addtional files from Image Object")
        for i, file in enumerate(image["visual_files"]):
            if i == 0:  # skip first ID
                continue
            delete = stash.destroy_files(file["id"])
            if delete is True:
                log.info(f"File ID:{file['id']} - Deleted: {file['path']}")
            else:
                log.error(f"File ID:{file['id']} - Could not be Deleted: {file['path']}")


def images_delete_record_paths():
    log.info("Addtional Files Deleter: Initialised with Args: images_delete_record_paths")
    images_delete_record_tag = find_tag(tag_exclude)

    if images_delete_record_tag is None:
        images_delete_record_tag = create_tag(tag_exclude)

    images = find_images(images_delete_record_tag["id"])
    for image in images:
        image_id = image["id"]
        paths = image["urls"]
        log.info(f"ID:{image_id} - Image object: Deleting addtional files and recording path(s) in URLs Field")
        for i, file in enumerate(image["visual_files"]):
            if i == 0:  # skip first ID
                continue
            path = file["path"]
            delete = stash.destroy_files(file["id"])
            if delete is True:
                log.info(f"ID:{file['id']} - deleted: {path}")
                paths.append("File: " + path)
            else:
                log.error(f"ID:{file['id']} - Could not be deleted: {path}")
            log.info(f"Updating Image ID:{image_id}: URLs with path(s): {paths}")
            update = update_image(image_id, paths)
            if update is not None:
                log.info(f"Image ID:{image_id}: Updated with path(s) as URLs: {path}")
            else:
                log.error(f"Image ID:{image_id}: Could not be updated with path(s) as URLs: {path}")


def scenes_delete():
    log.info("Addtional Files Deleter: Initialised with Args: scenes_delete")
    scenes_delete_tag = find_tag(tag_exclude)

    if scenes_delete_tag is None:
        scenes_delete_tag = create_tag(tag_exclude)

    scenes = find_scenes(scenes_delete_tag["id"])
    for scene in scenes:
        log.info(f"Scene: {scene}")

        log.info(f"ID:{scene['id']} - Deleting addtional files from Scene Object")
        for i, file in enumerate(scene["files"]):
            if i == 0:  # skip first ID
                continue
            delete = stash.destroy_files(file["id"])
            if delete is True:
                log.info(f"File ID:{file['id']} - Deleted: {file['path']}")
            else:
                log.error(
                    f"File ID:{file['id']} - Ccould not be Deleted: {file['path']}")


def scenes_delete_record_paths():
    log.info("Addtional Files Deleter: Initialised with Args: scenes_delete_record_paths")
    scenes_delete_record_tag = find_tag(tag_exclude)

    if scenes_delete_record_tag is None:
        scenes_delete_record_tag = create_tag(tag_exclude)

    scenes = find_scenes(scenes_delete_record_tag["id"])
    for scene in scenes:
        scene_id = scene["id"]
        paths = scene["urls"]
        log.info(f"ID:{id} - Scene object: Deleting addtional files and recording path(s) in URLs Field")
        for i, file in enumerate(scene["files"]):
            if i == 0:  # skip first ID
                continue
            path = file["path"]
            delete = stash.destroy_files(file["id"])
            if delete is True:
                log.info(f"ID:{file['id']} - Deleted: {path}")
                paths.append("File: " + path)
            else:
                log.error(f"ID:{file['id']} - Could not be Deleted: {path}")
            log.info(f"Updating Scene ID:{
                     scene_id}: URLs with path(s): {paths}")
            update = update_scene(scene_id, paths)
            if update is not None:
                log.info(
                    f"Scene ID:{scene_id}: Updated with path(s) as URLs: {path}")
            else:
                log.error(f"Scene ID:{scene_id}: Could not be updated with path(s) as URLs: {path}")


if __name__ == "__main__":
    main()
