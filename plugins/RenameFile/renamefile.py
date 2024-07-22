import requests
import os
import logging
import shutil
from pathlib import Path
import hashlib
import json
import sys
from stashapi.stashapp import StashInterface

# This is a Stash plugin which allows users to rename the video (scene) file name by editing the [Title] field located in the scene [Edit] tab.

# Importing stashapi.log as log for critical events
import stashapi.log as log

# Import settings from renamefile_settings.py
from renamefile_settings import config

# Get the directory of the script
script_dir = Path(__file__).resolve().parent

# Configure logging for your script
log_file_path = script_dir / 'renamefile.log'
FORMAT = "[%(asctime)s - LN:%(lineno)s] %(message)s"
logging.basicConfig(filename=log_file_path, level=logging.INFO, format=FORMAT)
logger = logging.getLogger('renamefile')
DEFAULT_ENDPOINT = "http://localhost:9999/graphql" # Default GraphQL endpoint
DEFAULT_FIELD_KEY_LIST = "title, performers, tags" # Default Field Key List with the desired order
DEFAULT_SEPERATOR = "-"

# ------------------------------------------
# ------------------------------------------
# Code to fetch variables from Plugin UI
json_input = json.loads(sys.stdin.read())
FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)
pluginConfiguration = stash.get_configuration()["plugins"]
settings = {
    "dryRun": False,
    "fileRenameViaMove": False,
    "performerAppend": False,
    "performerIncludeInFileName": False,
    "tagAppend": False,
    "tagIncludeInFileName": False,
    "zFieldKeyList": DEFAULT_FIELD_KEY_LIST,
    "zgraphqlEndpoint": DEFAULT_ENDPOINT,
    "zmaximumTagKeys": 12,
    "zpathToExclude": "",
    "zseparators": DEFAULT_SEPERATOR,
    "ztagWhitelist": "",
    "zzdebugTracing": False,
}
if "renamefile" in pluginConfiguration:
    settings.update(pluginConfiguration["renamefile"])
# ------------------------------------------
debugTracing = settings["zzdebugTracing"]

# Extract dry_run setting from settings
dry_run = settings["dryRun"]
dry_run_prefix = ''
logger.info(f"\nStarting (debugTracing={debugTracing}) (dry_run={dry_run})************************************************")
if debugTracing: logger.info("settings: %s " % (settings,))
if dry_run:
    logger.info("Dry run mode is enabled.")
    dry_run_prefix = "Would've "
if debugTracing: logger.info("Debug Tracing................")
max_tag_keys = settings["zmaximumTagKeys"] if settings["zmaximumTagKeys"] != 0 else 12 # Need this incase use explicitly sets value to zero in UI
if debugTracing: logger.info("Debug Tracing................")
# ToDo: Add split logic here to slpit possible string array into an array
exclude_paths = settings["zpathToExclude"]
exclude_paths = exclude_paths.split()
if debugTracing: logger.info(f"Debug Tracing (exclude_paths={exclude_paths})................")
# Extract tag whitelist from settings
tag_whitelist = settings["ztagWhitelist"]
if debugTracing: logger.info("Debug Tracing................")
if not tag_whitelist:
    tag_whitelist = ""
endpoint = settings["zgraphqlEndpoint"] # GraphQL endpoint
if debugTracing: logger.info("Debug Tracing................")
if not endpoint or endpoint == "":
    endpoint = DEFAULT_ENDPOINT
# Extract rename_files and move_files settings from renamefile_settings.py
rename_files = config["rename_files"]
move_files = settings["fileRenameViaMove"]
if debugTracing: logger.info("Debug Tracing................")
fieldKeyList = settings["zFieldKeyList"] # Default Field Key List with the desired order
if not fieldKeyList or fieldKeyList == "":
    fieldKeyList = DEFAULT_FIELD_KEY_LIST
fieldKeyList = fieldKeyList.replace(" ", "")
fieldKeyList = fieldKeyList.replace(";", ",")
fieldKeyList = fieldKeyList.split(",")
if debugTracing: logger.info(f"Debug Tracing (fieldKeyList={fieldKeyList})................")
separator = settings["zseparators"]
# ------------------------------------------
# ------------------------------------------
double_separator = separator + separator


# GraphQL query to fetch all scenes
query_all_scenes = """
    query AllScenes {
        allScenes {
            id
            updated_at
        }
    }
"""
if debugTracing: logger.info("Debug Tracing................")

# Function to make GraphQL requests
def graphql_request(query, variables=None):
    if debugTracing: logger.info("Debug Tracing................%s", query)
    data = {'query': query}
    if variables:
        data['variables'] = variables
        if debugTracing: logger.info("Debug Tracing................")
    if debugTracing: logger.info("Debug Tracing................")
    response = requests.post(endpoint, json=data)
    if debugTracing: logger.info("Debug Tracing................")
    return response.json()

# Function to replace illegal characters in filenames
def replace_illegal_characters(filename):
    illegal_characters = ['<', '>', ':', '"', '/', '\\', '|', '?', '*']
    for char in illegal_characters:
        filename = filename.replace(char, '-')
    return filename

def should_exclude_path(scene_details):
    scene_path = scene_details['files'][0]['path']  # Assuming the first file path is representative
    for exclude_path in exclude_paths:
        if scene_path.startswith(exclude_path):
            return True
    return False

# Function to form the new filename based on scene details and user settings
def form_filename(original_file_stem, scene_details, wrapper_styles):  
    if debugTracing: logger.info("Debug Tracing................")
    filename_parts = []
    tag_keys_added = 0
    default_title = ''
    if_notitle_use_org_filename = config["if_notitle_use_org_filename"]
    include_tag_if_in_name = settings["tagIncludeInFileName"]
    include_performer_if_in_name = settings["performerIncludeInFileName"]
    if if_notitle_use_org_filename:
        default_title = original_file_stem
    # ...................
    # Title needs to be set here incase user changes the fieldKeyList where tags or performers come before title.
    title = scene_details.get('title', default_title)
    if not title:
        if if_notitle_use_org_filename:
            title = default_title
    # ...................

    if debugTracing: logger.info("Debug Tracing................")
    
    # Function to add tag to filename
    def add_tag(tag_name):
        nonlocal tag_keys_added
        nonlocal filename_parts
        nonlocal wrapper_styles
        if debugTracing: logger.info(f"Debug Tracing (tag_name={tag_name})................")
        if max_tag_keys == -1 or (max_tag_keys is not None and tag_keys_added >= int(max_tag_keys)):
            return  # Skip adding more tags if the maximum limit is reached
        
        # Check if the tag name is in the whitelist
        if tag_whitelist == "" or tag_whitelist == None or (tag_whitelist and tag_name in tag_whitelist):
            if wrapper_styles.get('tag'):
                filename_parts.append(f"{wrapper_styles['tag'][0]}{tag_name}{wrapper_styles['tag'][1]}")
                if debugTracing: logger.info("Debug Tracing................")
            else:
                filename_parts.append(tag_name)
                if debugTracing: logger.info("Debug Tracing................")
            tag_keys_added += 1
            if debugTracing: logger.info("Debug Tracing................")
        else:
            logger.info(f"Skipping tag not in whitelist: {tag_name}")
        if debugTracing: logger.info(f"Debug Tracing (tag_keys_added={tag_keys_added})................")
    
    for key in fieldKeyList:
        if key == 'studio':
            studio_name = scene_details.get('studio', {}).get('name', '')
            if studio_name:
                if wrapper_styles.get('studio'):
                    filename_parts.append(f"{wrapper_styles['studio'][0]}{studio_name}{wrapper_styles['studio'][1]}")
                else:
                    filename_parts.append(studio_name)
        elif key == 'title':
            if title:  # This value has already been fetch in start of function because it needs to be defined before tags and performers
                if wrapper_styles.get('title'):
                    filename_parts.append(f"{wrapper_styles['title'][0]}{title}{wrapper_styles['title'][1]}")
                else:
                    filename_parts.append(title)
        elif key == 'performers':
            if settings["performerAppend"]:
                performers = '-'.join([performer.get('name', '') for performer in scene_details.get('performers', [])])
                if performers:
                    if not include_performer_if_in_name or performers.lower() not in title.lower():
                        if wrapper_styles.get('performers'):
                            filename_parts.append(f"{wrapper_styles['performers'][0]}{performers}{wrapper_styles['performers'][1]}")
                        else:
                            filename_parts.append(performers)
        elif key == 'date':
            scene_date = scene_details.get('date', '')
            if scene_date:
                if wrapper_styles.get('date'):
                    filename_parts.append(f"{wrapper_styles['date'][0]}{scene_date}{wrapper_styles['date'][1]}")
                else:
                    filename_parts.append(scene_date)
        elif key == 'height':
            height = str(scene_details.get('files', [{}])[0].get('height', ''))  # Convert height to string
            if height:
                height += 'p'
                if wrapper_styles.get('height'):
                    filename_parts.append(f"{wrapper_styles['height'][0]}{height}{wrapper_styles['height'][1]}")
                else:
                    filename_parts.append(height)
        elif key == 'video_codec':
            video_codec = scene_details.get('files', [{}])[0].get('video_codec', '').upper()  # Convert to uppercase
            if video_codec:
                if wrapper_styles.get('video_codec'):
                    filename_parts.append(f"{wrapper_styles['video_codec'][0]}{video_codec}{wrapper_styles['video_codec'][1]}")
                else:
                    filename_parts.append(video_codec)
        elif key == 'frame_rate':
            frame_rate = str(scene_details.get('files', [{}])[0].get('frame_rate', '')) + ' FPS'  # Convert to string and append ' FPS'
            if frame_rate:
                if wrapper_styles.get('frame_rate'):
                    filename_parts.append(f"{wrapper_styles['frame_rate'][0]}{frame_rate}{wrapper_styles['frame_rate'][1]}")
                else:
                    filename_parts.append(frame_rate)
        elif key == 'tags':
            if settings["tagAppend"]:
                tags = [tag.get('name', '') for tag in scene_details.get('tags', [])]
                if debugTracing: logger.info("Debug Tracing................")
                for tag_name in tags:
                    if debugTracing: logger.info(f"Debug Tracing (include_tag_if_in_name={include_tag_if_in_name})................")
                    if include_tag_if_in_name or tag_name.lower() not in title.lower():
                        add_tag(tag_name)
                        if debugTracing: logger.info("Debug Tracing................")
    
    new_filename = separator.join(filename_parts).replace(double_separator, separator)

    # Check if the scene's path matches any of the excluded paths
    if exclude_paths and should_exclude_path(scene_details):
        logger.info(f"Scene belongs to an excluded path. Skipping filename modification.")
        return Path(scene_details['files'][0]['path']).name  # Return the original filename

    return replace_illegal_characters(new_filename)

def find_scene_by_id(scene_id):
    query_find_scene = """
    query FindScene($scene_id: ID!) {
        findScene(id: $scene_id) {
            id
            title
            date
            files {
                path
                height
                video_codec
                frame_rate
            }
            studio {
                name
            }
            performers {
                name
            }
            tags {
                name
            }
        }
    }
"""
    scene_result = graphql_request(query_find_scene, variables={"scene_id": scene_id})
    return scene_result.get('data', {}).get('findScene')

def move_or_rename_files(scene_details, new_filename, original_parent_directory):
    studio_directory = None
    for file_info in scene_details['files']:
        path = file_info['path']
        original_path = Path(path)

        # Check if the file's path matches any of the excluded paths
        if exclude_paths and any(original_path.match(exclude_path) for exclude_path in exclude_paths):
            logger.info(f"File {path} belongs to an excluded path. Skipping modification.")
            continue

        new_path = original_parent_directory if not move_files else original_parent_directory / scene_details['studio']['name']
        if rename_files:
            new_path = new_path / (new_filename + original_path.suffix)
        try:
            if move_files:
                if studio_directory is None:
                    studio_directory = original_parent_directory / scene_details['studio']['name']
                    studio_directory.mkdir(parents=True, exist_ok=True)
                if rename_files:  # Check if rename_files is True
                    if not dry_run:
                        shutil.move(original_path, new_path)
                    logger.info(f"{dry_run_prefix}Moved and renamed file: {path} -> {new_path}")
                else:
                    if not dry_run:
                        shutil.move(original_path, new_path)
                    logger.info(f"{dry_run_prefix}Moved file: {path} -> {new_path}")
            else:
                if rename_files:  # Check if rename_files is True
                    if not dry_run:
                        original_path.rename(new_path)
                    logger.info(f"{dry_run_prefix}Renamed file: {path} -> {new_path}")
                else:
                    if not dry_run:
                        shutil.move(original_path, new_path)
                    logger.info(f"{dry_run_prefix}Moved file: {path} -> {new_path}")
        except FileNotFoundError:
            log.error(f"File not found: {path}. Skipping...")
            logger.error(f"File not found: {path}. Skipping...")
            continue
        except OSError as e:
            log.error(f"Failed to move or rename file: {path}. Error: {e}")
            logger.error(f"Failed to move or rename file: {path}. Error: {e}")
            continue

    return new_path  # Return the new_path variable after the loop

def perform_metadata_scan(metadata_scan_path):
    metadata_scan_path_windows = metadata_scan_path.resolve().as_posix()
    mutation_metadata_scan = """
        mutation {
            metadataScan(input: { paths: "%s" })
        }
    """ % metadata_scan_path_windows
    if debugTracing: 
        logger.info(f"Attempting metadata scan mutation with path: {metadata_scan_path_windows}")
        logger.info(f"Mutation string: {mutation_metadata_scan}")
    graphql_request(mutation_metadata_scan)

def rename_scene(scene_id, wrapper_styles, stash_directory):  
    scene_details = find_scene_by_id(scene_id)
    if debugTracing: logger.info(f"Debug Tracing (scene_details={scene_details})................")
    if not scene_details:
        log.error(f"Scene with ID {scene_id} not found.")
        logger.error(f"Scene with ID {scene_id} not found.")
        return

    if debugTracing: logger.info(f"Debug Tracing................")
    
    original_file_path = scene_details['files'][0]['path']
    original_parent_directory = Path(original_file_path).parent
    if debugTracing: logger.info(f"Debug Tracing (original_file_path={original_file_path})................")

    # Check if the scene's path matches any of the excluded paths
    if exclude_paths and any(Path(original_file_path).match(exclude_path) for exclude_path in exclude_paths):
        logger.info(f"Scene with ID {scene_id} belongs to an excluded path. Skipping modifications.")
        return

    if debugTracing: logger.info(f"Debug Tracing................")
    original_path_info = {'original_file_path': original_file_path,
                         'original_parent_directory': original_parent_directory}

    new_path_info = None

    original_file_stem = Path(original_file_path).stem
    original_file_name = Path(original_file_path).name
    new_filename = form_filename(original_file_stem, scene_details, wrapper_styles)  
    newFilenameWithExt = new_filename + Path(original_file_path).suffix
    if debugTracing: logger.info(f"Debug Tracing (original_file_name={original_file_name})(newFilenameWithExt={newFilenameWithExt})................")
    if original_file_name == newFilenameWithExt:
        logger.info(f"Nothing to do, because new file name matches original file name: (newFilenameWithExt={newFilenameWithExt})")
        return
    if debugTracing: logger.info(f"Debug Tracing................")

    if rename_files:
        new_path = original_parent_directory / (newFilenameWithExt)
        new_path_info = {'new_file_path': new_path}
        if debugTracing: logger.info(f"{dry_run_prefix}New filename: {new_path}")

    if move_files and original_parent_directory.name != scene_details['studio']['name']:
        new_path = original_parent_directory / scene_details['studio']['name'] / (new_filename + Path(original_file_path).suffix)
        new_path_info = {'new_file_path': new_path}
        move_or_rename_files(scene_details, new_filename, original_parent_directory)
        logger.info(f"{dry_run_prefix}Moved to directory: '{new_path}'")

    # If rename_files is True, attempt renaming even if move_files is False
    if rename_files:
        new_file_path = original_parent_directory / (new_filename + Path(original_file_name).suffix)
        if original_file_name != new_filename:
            try:
                if not dry_run:
                    os.rename(original_file_path, new_file_path)
                logger.info(f"{dry_run_prefix}Renamed file: {original_file_path} -> {new_file_path}")
            except Exception as e:
                log.error(f"Failed to rename file: {original_file_path}. Error: {e}")
                logger.error(f"Failed to rename file: {original_file_path}. Error: {e}")

    metadata_scan_path = original_parent_directory
    perform_metadata_scan(metadata_scan_path)

    # ToDo: Add logic to the below code section so it checks base file length and checks folder length, instead of lumping them altogether.
    # Current DB schema allows file folder max length to be 255, and max base filename to be 255
    max_filename_length = int(config["max_filename_length"])
    if len(new_filename) > max_filename_length:
        extension_length = len(Path(original_file_path).suffix)
        max_base_filename_length = max_filename_length - extension_length
        truncated_filename = new_filename[:max_base_filename_length]
        hash_suffix = hashlib.md5(new_filename.encode()).hexdigest()
        new_filename = truncated_filename + '_' + hash_suffix + Path(original_file_path).suffix

    return new_filename, original_path_info, new_path_info 
    
if debugTracing: logger.info("Debug Tracing................")
# Execute the GraphQL query to fetch all scenes
scene_result = graphql_request(query_all_scenes)
if debugTracing: logger.info("Debug Tracing................")
all_scenes = scene_result.get('data', {}).get('allScenes', [])
if debugTracing: logger.info("Debug Tracing................")
if not all_scenes:
    if debugTracing: logger.info("Debug Tracing................")
    log.error("No scenes found.")
    logger.error("No scenes found.")
    exit()
if debugTracing: logger.info("Debug Tracing................")

# Find the scene with the latest updated_at timestamp
latest_scene = max(all_scenes, key=lambda scene: scene['updated_at'])

# Extract the ID of the latest scene
latest_scene_id = latest_scene.get('id')


# Extract wrapper styles
wrapper_styles = config["wrapper_styles"]

# Read stash directory from renamefile_settings.py
stash_directory = config.get('stash_directory', '')
if debugTracing: logger.info("Debug Tracing................")

if debugTracing: logger.info("Debug Tracing................")

# Rename the latest scene and trigger metadata scan
new_filename = rename_scene(latest_scene_id, wrapper_styles, stash_directory)
if debugTracing: logger.info("Debug Tracing................")

# Log dry run state and indicate if no changes were made
if dry_run:  
    log.info("Dry run: Script executed in dry run mode. No changes were made.")
    logger.info("Dry run: Script executed in dry run mode. No changes were made.")
elif not new_filename:  
    logger.info("No changes were made.")
else:
    logger.info("Change success!")
if debugTracing: logger.info("\n*********************************\nEXITING   ***********************\n*********************************")
# ToDo List
    # Add logic to max_filename_length code so it checks base file length and checks folder length, instead of lumping them altogether.
    # Add logic to update Sqlite DB on file name change, instead of perform_metadata_scan.
    # Get variables from the Plugins Settings UI instead of from renamefile_settings.py