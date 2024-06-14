import csv
import os
import zipfile
from stashapi.stashapp import StashInterface
import stashapi.log as log
import config

tagid_mappings = {}
tagname_mappings = {}
max_gaps = {}
min_durations = {}
required_durations = {}
tag_thresholds = {}

def initialize(connection):
    global stash
    global aierroed_tag_id
    global tagme_tag_id
    global ai_base_tag_id
    global ai_tagged_tag_id
    global vr_tag_id

    # Initialize the Stash API
    stash = StashInterface(connection)

    # Initialize "metadata" tags
    aierroed_tag_id = stash.find_tag(config.aierrored_tag_name, create=True)["id"]
    tagme_tag_id = stash.find_tag(config.tagme_tag_name, create=True)["id"]
    ai_base_tag_id = stash.find_tag(config.ai_base_tag_name, create=True)["id"]
    ai_tagged_tag_id = stash.find_tag(config.aitagged_tag_name, create=True)["id"]
    vr_tag_id = stash.find_tag(stash.get_configuration()["ui"]["vrTag"])["id"]

    try:
        parse_csv("tag_mappings.csv")
    except Exception as e:
        log.error(f"Failed to parse tag_mappings.csv: {e}")

# ----------------- Tag Methods -----------------

def get_tag_ids(tag_names):
    return [get_tag_id(tag_name) for tag_name in tag_names]

def get_tag_id(tag_name):
    if tag_name not in tagid_mappings:
        return stash.find_tag(tag_name)["id"]
    return tagid_mappings.get(tag_name)

def get_tag_threshold(tag_name):
    return tag_thresholds.get(tag_name, 0.5)

def is_ai_tag(tag_name):
    return tag_name in tagname_mappings

def is_scene_tagged(tags):
    for tag in tags:
        if tag['id'] == ai_tagged_tag_id:
            return True
    return False

def is_vr_scene(tags):
    for tag in tags:
        if tag['id'] == vr_tag_id:
            return True
    return False

# ----------------- Image Methods -----------------

def get_tagme_images():
    return stash.find_images(f={"tags": {"value":tagme_tag_id, "modifier":"INCLUDES"}}, fragment="id files {path}")

def add_error_images(image_ids):
    stash.update_images({"ids": image_ids, "tag_ids": {"ids": [aierroed_tag_id], "mode": "ADD"}})

def remove_tagme_tags_from_images(image_ids):
    stash.update_images({"ids": image_ids, "tag_ids": {"ids": [tagme_tag_id], "mode": "REMOVE"}})

def add_tags_to_image(image_id, tag_ids):
    stash.update_images({"ids": [image_id], "tag_ids": {"ids": tag_ids, "mode": "ADD"}})

def get_image_paths_and_ids(images):
    imagePaths = []
    imageIds = []
    temp_files = []
    for image in images:
        try:
            imagePath = image['files'][0]['path']
            imageId = image['id']
            if '.zip' in imagePath:
                zip_index = imagePath.index('.zip') + 4
                zip_path, img_path = imagePath[:zip_index], imagePath[zip_index+1:].replace('\\', '/')
                with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                    temp_path = os.path.join(config.temp_image_dir, img_path)
                    os.makedirs(os.path.dirname(temp_path), exist_ok=True)
                    zip_ref.extract(img_path, config.temp_image_dir)
                    imagePath = os.path.abspath(os.path.normpath(temp_path))
                    temp_files.append(imagePath)
            imagePaths.append(imagePath)
            imageIds.append(imageId)
        except IndexError:
            log.error(f"Failed to process image: {image}")
            continue
    return imagePaths, imageIds, temp_files

# ----------------- Scene Methods -----------------

def add_tags_to_video(video_id, tag_ids, add_tagged=True):
    if add_tagged:
        tag_ids.append(ai_tagged_tag_id)
    stash.update_scenes({"ids": [video_id], "tag_ids": {"ids": tag_ids, "mode": "ADD"}})

def remove_ai_tags_from_video(video_id, remove_tagme=True):
    ai_tags = list(tagid_mappings.values())
    if remove_tagme:
        ai_tags.append(tagme_tag_id)
    stash.update_scenes({"ids": [video_id], "tag_ids": {"ids": ai_tags, "mode": "REMOVE"}})

def get_tagme_scenes():
    return stash.find_scenes(f={"tags": {"value":tagme_tag_id, "modifier":"INCLUDES"}}, fragment="id tags {id} files {path duration fingerprint(type: \"phash\")}")

def add_error_scene(scene_id):
    stash.update_scenes({"ids": [scene_id], "tag_ids": {"ids": [aierroed_tag_id], "mode": "ADD"}})

def remove_tagme_tag_from_scene(scene_id):
    stash.update_scenes({"ids": [scene_id], "tag_ids": {"ids": [tagme_tag_id], "mode": "REMOVE"}})

def get_required_duration(tag_name, scene_duration):
    if not required_durations:
        log.error("Tag mappings not initialized")
    required_duration_value = str(required_durations.get(tag_name))
    required_duration_value = required_duration_value.replace(" ", "").lower()

    if required_duration_value.endswith("s"):
        # If the value ends with 's', remove 's' and convert to float
        return float(required_duration_value[:-1])
    elif required_duration_value.endswith("%"):
        # If the value ends with '%', remove '%' and calculate the percentage of scene_duration
        percentage = float(required_duration_value[:-1])
        return (percentage / 100) * scene_duration
    elif "." in required_duration_value and 0 <= float(required_duration_value) <= 1:
        # If the value is a proportion, calculate the proportion of scene_duration
        proportion = float(required_duration_value)
        return proportion * scene_duration
    else:
        # If the value is a straight number, convert to float
        return float(required_duration_value)

# ----------------- Marker Methods -----------------

def is_ai_marker_supported(tag_name):
    return tag_name in min_durations

def get_min_duration(tag_name):
    return min_durations.get(tag_name)

def get_max_gap(tag_name):
    return max_gaps.get(tag_name, 0)

def add_markers_to_video(video_id, tag_id, tag_name, time_frames):
    for time_frame in time_frames:
        stash.create_scene_marker({"scene_id": video_id, "primary_tag_id":tag_id, "tag_ids": [tag_id], "seconds": time_frame.start, "title":tagname_mappings[tag_name]})

def remove_ai_markers_from_video(video_id):
    ai_tags = set(tagid_mappings.values())
    scene_markers = stash.get_scene_markers(video_id, fragment="id primary_tag {id}")
    for scene_marker in scene_markers:
        if scene_marker.get("primary_tag").get("id") in ai_tags:
            stash.destroy_scene_marker(scene_marker.get("id"))

# ----------------- Helpers -----------------

def parse_csv(file_path):
    global tagid_mappings
    global tagname_mappings
    global max_gaps
    global min_durations
    global required_durations
    global tag_thresholds

    with open(file_path, mode='r') as infile:
        reader = csv.DictReader(infile)
        for row in reader:
            server_tag = row.get('ServerTag')
            stash_tag = row.get('StashTag')
            min_duration = float(row.get('MinMarkerDuration', -1)) #float(row['MinDuration']) 
            max_gap = float(row.get('MaxGap', 0)) #float(row['MaxGap'])
            required_duration = row.get('RequiredDuration', "200%")
            tag_threshold = float(row.get('TagThreshold', 0.5))

            tag = stash.find_tag(stash_tag)
            if not tag:
                tag = stash.create_tag({"name":stash_tag, "ignore_auto_tag": True, "parent_ids":[ai_base_tag_id]})
            
            tagid_mappings[server_tag] = tag["id"]
            tagname_mappings[server_tag] = stash_tag
            if min_duration != -1:
                min_durations[server_tag] = min_duration
                max_gaps[server_tag] = max_gap
            required_durations[server_tag] = required_duration
            tag_thresholds[server_tag] = tag_threshold
