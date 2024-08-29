# Description: This is a Stash plugin which allows users to rename the video (scene) file name by editing the [Title] field located in the scene [Edit] tab.
# By David Maisonave (aka Axter) Jul-2024 (https://www.axter.com/)
# Get the latest developers version from following link: https://github.com/David-Maisonave/Axter-Stash/tree/main/plugins/RenameFile
# Based on source code from  https://github.com/Serechops/Serechops-Stash/tree/main/plugins/Renamer
import os, sys, shutil, json, requests, hashlib, pathlib, logging
from pathlib import Path
import stashapi.log as log # Importing stashapi.log as log for critical events ONLY
from stashapi.stashapp import StashInterface
from StashPluginHelper import StashPluginHelper
from renamefile_settings import config # Import settings from renamefile_settings.py

# **********************************************************************
# Constant global variables --------------------------------------------
DEFAULT_FIELD_KEY_LIST = "title,performers,studio,tags" # Default Field Key List with the desired order
DEFAULT_SEPERATOR = "-"
# GraphQL query to fetch all scenes
QUERY_ALL_SCENES = """
    query AllScenes {
        allScenes {
            id
            updated_at
        }
    }
"""
# **********************************************************************
# Global variables          --------------------------------------------
inputToUpdateScenePost = False
exitMsg = "Change success!!"

# **********************************************************************
# ----------------------------------------------------------------------
settings = {
    "performerAppend": False,
    "studioAppend": False,
    "tagAppend": False,
    "z_keyFIeldsIncludeInFileName": False,
    "zafileRenameViaMove": False,
    "zfieldKeyList": DEFAULT_FIELD_KEY_LIST,
    "zmaximumTagKeys": 12,
    "zseparators": DEFAULT_SEPERATOR,
    "zzdebugTracing": False,
    "zzdryRun": False,
}
stash = StashPluginHelper(
        settings=settings,
        config=config,
        maxbytes=10*1024*1024,
        )
stash.Status(logLevel=logging.DEBUG)
if stash.PLUGIN_ID in stash.PLUGIN_CONFIGURATION:
    stash.pluginSettings.update(stash.PLUGIN_CONFIGURATION[stash.PLUGIN_ID])
# ----------------------------------------------------------------------
WRAPPER_STYLES = config["wrapper_styles"]
POSTFIX_STYLES = config["postfix_styles"]

# Extract dry_run setting from settings
dry_run = stash.pluginSettings["zzdryRun"]
dry_run_prefix = ''
try:
    if stash.JSON_INPUT['args']['hookContext']['input']: inputToUpdateScenePost = True # This avoids calling rename logic twice
except:
    pass
stash.Trace("settings: %s " % (stash.pluginSettings,))

if dry_run:
    stash.Log("Dry run mode is enabled.")
    dry_run_prefix = "Would've "
max_tag_keys = stash.pluginSettings["zmaximumTagKeys"] if stash.pluginSettings["zmaximumTagKeys"] != 0 else 12 # Need this incase use explicitly sets value to zero in UI
# ToDo: Add split logic here to slpit possible string array into an array
exclude_paths = config["pathToExclude"]
exclude_paths = exclude_paths.split()
stash.Trace(f"(exclude_paths={exclude_paths})")
excluded_tags = config["excludeTags"]
# Extract tag whitelist from settings
tag_whitelist = config["tagWhitelist"]
if not tag_whitelist:
    tag_whitelist = ""
stash.Trace(f"(tag_whitelist={tag_whitelist})")

endpointHost = stash.JSON_INPUT['server_connection']['Host']
if endpointHost == "0.0.0.0":
    endpointHost = "localhost"
endpoint = f"{stash.JSON_INPUT['server_connection']['Scheme']}://{endpointHost}:{stash.JSON_INPUT['server_connection']['Port']}/graphql"

stash.Trace(f"(endpoint={endpoint})")
move_files = stash.pluginSettings["zafileRenameViaMove"]
fieldKeyList = stash.pluginSettings["zfieldKeyList"] # Default Field Key List with the desired order
if not fieldKeyList or fieldKeyList == "":
    fieldKeyList = DEFAULT_FIELD_KEY_LIST
fieldKeyList = fieldKeyList.replace(" ", "")
fieldKeyList = fieldKeyList.replace(";", ",")
fieldKeyList = fieldKeyList.split(",")
stash.Trace(f"(fieldKeyList={fieldKeyList})")
separator = stash.pluginSettings["zseparators"]
# ----------------------------------------------------------------------
# **********************************************************************

double_separator = separator + separator
stash.Trace(f"(WRAPPER_STYLES={WRAPPER_STYLES}) (POSTFIX_STYLES={POSTFIX_STYLES})")

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
def form_filename(original_file_stem, scene_details):  
    filename_parts = []
    tag_keys_added = 0
    default_title = ''
    if_notitle_use_org_filename = config["if_notitle_use_org_filename"]
    include_keyField_if_in_name = stash.pluginSettings["z_keyFIeldsIncludeInFileName"]
    if if_notitle_use_org_filename:
        default_title = original_file_stem
    # ...................
    # Title needs to be set here incase user changes the fieldKeyList where tags or performers come before title.
    title = scene_details.get('title', default_title)
    if not title:
        if if_notitle_use_org_filename:
            title = default_title
    # ...................

    stash.Trace(f"(title=\"{title}\")")
    
    # Function to add tag to filename
    def add_tag(tag_name):
        nonlocal tag_keys_added
        nonlocal filename_parts
        stash.Trace(f"(tag_name={tag_name})")
        if max_tag_keys == -1 or (max_tag_keys is not None and tag_keys_added >= int(max_tag_keys)):
            return  # Skip adding more tags if the maximum limit is reached
        if tag_name in excluded_tags:
            stash.Trace(f"EXCLUDING (tag_name={tag_name})")
            return
        # Check if the tag name is in the whitelist
        if tag_whitelist == "" or tag_whitelist == None or (tag_whitelist and tag_name in tag_whitelist):
            if WRAPPER_STYLES.get('tag'):
                filename_parts.append(f"{WRAPPER_STYLES['tag'][0]}{tag_name}{WRAPPER_STYLES['tag'][1]}")
            else:
                filename_parts.append(tag_name)
            tag_keys_added += 1
        else:
            stash.Log(f"Skipping tag not in whitelist: {tag_name}")
        stash.Trace(f"(tag_keys_added={tag_keys_added})")
    
    for key in fieldKeyList:
        if key == 'studio':
            if stash.pluginSettings["studioAppend"]:
                studio_name = scene_details.get('studio', {})
                stash.Trace(f"(studio_name={studio_name})")
                if studio_name:
                    studio_name = scene_details.get('studio', {}).get('name', '')
                    stash.Trace(f"(studio_name={studio_name})")
                    if studio_name:
                        studio_name += POSTFIX_STYLES.get('studio')
                        if include_keyField_if_in_name or studio_name.lower() not in title.lower():
                            if WRAPPER_STYLES.get('studio'):
                                filename_parts.append(f"{WRAPPER_STYLES['studio'][0]}{studio_name}{WRAPPER_STYLES['studio'][1]}")
                            else:
                                filename_parts.append(studio_name)
        elif key == 'title':
            if title:  # This value has already been fetch in start of function because it needs to be defined before tags and performers
                title += POSTFIX_STYLES.get('title')
                if WRAPPER_STYLES.get('title'):
                    filename_parts.append(f"{WRAPPER_STYLES['title'][0]}{title}{WRAPPER_STYLES['title'][1]}")
                else:
                    filename_parts.append(title)
        elif key == 'performers':
            if stash.pluginSettings["performerAppend"]:
                performers = '-'.join([performer.get('name', '') for performer in scene_details.get('performers', [])])
                if performers:
                    performers += POSTFIX_STYLES.get('performers')
                    stash.Trace(f"(include_keyField_if_in_name={include_keyField_if_in_name})")
                    if include_keyField_if_in_name or performers.lower() not in title.lower():
                        stash.Trace(f"(performers={performers})")
                        if WRAPPER_STYLES.get('performers'):
                            filename_parts.append(f"{WRAPPER_STYLES['performers'][0]}{performers}{WRAPPER_STYLES['performers'][1]}")
                        else:
                            filename_parts.append(performers)
        elif key == 'date':
            scene_date = scene_details.get('date', '')
            if scene_date:
                scene_date += POSTFIX_STYLES.get('date')
                if WRAPPER_STYLES.get('date'):
                    scene_date = f"{WRAPPER_STYLES['date'][0]}{scene_date}{WRAPPER_STYLES['date'][1]}"
                if scene_date not in title:
                    filename_parts.append(scene_date)
        elif key == 'resolution':
            width = str(scene_details.get('files', [{}])[0].get('width', ''))  # Convert width to string
            height = str(scene_details.get('files', [{}])[0].get('height', ''))  # Convert height to string
            if width and height:
                resolution = width + POSTFIX_STYLES.get('width_height_seperator') + height + POSTFIX_STYLES.get('resolution')
                if WRAPPER_STYLES.get('resolution'):
                    resolution = f"{WRAPPER_STYLES['resolution'][0]}{resolution}{WRAPPER_STYLES['width'][1]}"
                if resolution not in title:
                    filename_parts.append(resolution)
        elif key == 'width':
            width = str(scene_details.get('files', [{}])[0].get('width', ''))  # Convert width to string
            if width:
                width += POSTFIX_STYLES.get('width')
                if WRAPPER_STYLES.get('width'):
                    width = f"{WRAPPER_STYLES['width'][0]}{width}{WRAPPER_STYLES['width'][1]}"
                if width not in title:
                    filename_parts.append(width)
        elif key == 'height':
            height = str(scene_details.get('files', [{}])[0].get('height', ''))  # Convert height to string
            if height:
                height += POSTFIX_STYLES.get('height')
                if WRAPPER_STYLES.get('height'):
                    height = f"{WRAPPER_STYLES['height'][0]}{height}{WRAPPER_STYLES['height'][1]}"
                if height not in title:
                    filename_parts.append(height)
        elif key == 'video_codec':
            video_codec = scene_details.get('files', [{}])[0].get('video_codec', '').upper()  # Convert to uppercase
            if video_codec:
                video_codec += POSTFIX_STYLES.get('video_codec')
                if WRAPPER_STYLES.get('video_codec'):
                    video_codec = f"{WRAPPER_STYLES['video_codec'][0]}{video_codec}{WRAPPER_STYLES['video_codec'][1]}"
                if video_codec not in title:
                    filename_parts.append(video_codec)
        elif key == 'frame_rate':
            frame_rate = str(scene_details.get('files', [{}])[0].get('frame_rate', '')) + 'FPS'  # Convert to string and append ' FPS'
            if frame_rate:
                frame_rate += POSTFIX_STYLES.get('frame_rate')
                if WRAPPER_STYLES.get('frame_rate'):
                    frame_rate = f"{WRAPPER_STYLES['frame_rate'][0]}{frame_rate}{WRAPPER_STYLES['frame_rate'][1]}"
                if frame_rate not in title:
                    filename_parts.append(frame_rate)
        elif key == 'galleries':
            galleries = [gallery.get('title', '') for gallery in scene_details.get('galleries', [])]
            for gallery_name in galleries:
                stash.Trace(f"(include_keyField_if_in_name={include_keyField_if_in_name}) (gallery_name={gallery_name})")
                if include_keyField_if_in_name or gallery_name.lower() not in title.lower():
                    gallery_name += POSTFIX_STYLES.get('galleries')
                    if WRAPPER_STYLES.get('galleries'):
                        filename_parts.append(f"{WRAPPER_STYLES['galleries'][0]}{gallery_name}{WRAPPER_STYLES['galleries'][1]}")
                    else:
                        filename_parts.append(gallery_name)
                    stash.Trace(f"(gallery_name={gallery_name})")
        elif key == 'tags':
            if stash.pluginSettings["tagAppend"]:
                tags = [tag.get('name', '') for tag in scene_details.get('tags', [])]
                for tag_name in tags:
                    stash.Trace(f"(include_keyField_if_in_name={include_keyField_if_in_name}) (tag_name={tag_name})")
                    if include_keyField_if_in_name or tag_name.lower() not in title.lower():
                        add_tag(tag_name + POSTFIX_STYLES.get('tag'))
                        stash.Trace(f"(tag_name={tag_name})")
    
    stash.Trace(f"(filename_parts={filename_parts})")
    new_filename = separator.join(filename_parts).replace(double_separator, separator)
    stash.Trace(f"(new_filename={new_filename})")

    # Check if the scene's path matches any of the excluded paths
    if exclude_paths and should_exclude_path(scene_details):
        stash.Log(f"Scene belongs to an excluded path. Skipping filename modification.")
        return Path(scene_details['files'][0]['path']).name  # Return the original filename

    return replace_illegal_characters(new_filename)

def rename_scene(scene_id):  
    global exitMsg
    scene_details = stash.find_scene(scene_id)
    stash.Trace(f"(scene_details1={scene_details})")
    if not scene_details:
        stash.Error(f"Scene with ID {scene_id} not found.")
        return None
    original_file_path = scene_details['files'][0]['path']
    original_parent_directory = Path(original_file_path).parent
    stash.Trace(f"(original_file_path={original_file_path})")
    # Check if the scene's path matches any of the excluded paths
    if exclude_paths and any(Path(original_file_path).match(exclude_path) for exclude_path in exclude_paths):
        stash.Log(f"Scene with ID {scene_id} belongs to an excluded path. Skipping modifications.")
        return None

    original_file_stem  = Path(original_file_path).stem
    original_file_name  = Path(original_file_path).name
    new_filename        = form_filename(original_file_stem, scene_details)  
    max_filename_length = int(config["max_filename_length"])
    if len(new_filename) > max_filename_length:
        extension_length = len(Path(original_file_path).suffix)
        max_base_filename_length = max_filename_length - extension_length
        truncated_filename = new_filename[:max_base_filename_length]
        hash_suffix = hashlib.md5(new_filename.encode()).hexdigest()
        new_filename = truncated_filename + '_' + hash_suffix + Path(original_file_path).suffix
    newFilenameWithExt  = new_filename + Path(original_file_path).suffix
    new_file_path       = f"{original_parent_directory}{os.sep}{new_filename}{Path(original_file_name).suffix}"
    stash.Trace(f"(original_file_name={original_file_name})(new_file_path={new_file_path})")
    if original_file_name == newFilenameWithExt or original_file_name == new_filename:
        stash.Log(f"Nothing to do, because new file name matches original file name: (newFilenameWithExt={newFilenameWithExt})")
        return None
    targetDidExist = True if os.path.isfile(new_file_path) else False
    try:
        if move_files:
            if not dry_run:
                shutil.move(original_file_path, new_file_path)
            exitMsg = f"{dry_run_prefix}Moved file to '{new_file_path}' from '{original_file_path}'"
        else:
            if not dry_run:
                os.rename(original_file_path, new_file_path)
            exitMsg = f"{dry_run_prefix}Renamed file to '{new_file_path}' from '{original_file_path}'"
    except OSError as e:
        exitMsg = f"Failed to move/rename file: From {original_file_path} to {new_file_path}. Error: {e}"
        stash.Error(exitMsg)
        if not targetDidExist and os.path.isfile(new_file_path):
            if os.path.isfile(original_file_path):
                os.remove(original_file_path)
            pass
        else:
            raise
    
    stash.metadata_scan(paths=[original_parent_directory.resolve().as_posix()])
    stash.Log(exitMsg)
    return new_filename 
    
def rename_files_task():
    scene_result = stash.get_all_scenes()
    all_scenes = scene_result['allScenes']
    if not all_scenes:
        stash.Error("No scenes found.")
        exit()
    # Find the scene with the latest updated_at timestamp
    latest_scene = max(all_scenes, key=lambda scene: scene['updated_at'])
    # Extract the ID of the latest scene
    latest_scene_id = latest_scene.get('id')
    # Rename the latest scene and trigger metadata scan
    new_filename = rename_scene(latest_scene_id)
    # Log dry run state and indicate if no changes were made
    if dry_run:  
        stash.Log("Dry run: Script executed in dry run mode. No changes were made.")
    elif not new_filename:  
        stash.Log("No changes were made.")
    return

if stash.PLUGIN_TASK_NAME == "rename_files_task":
    rename_files_task()
elif inputToUpdateScenePost:
    rename_files_task()

stash.Trace("\n*********************************\nEXITING   ***********************\n*********************************")

# ToDo: Wish List
    # Add code to get tags from duplicate filenames