# Description: This is a Stash plugin which allows users to rename the video (scene) file name by editing the [Title] field located in the scene [Edit] tab.
# By David Maisonave (aka Axter) Jul-2025 (https://www.axter.com/)
# Get the latest developers version from following link: https://github.com/David-Maisonave/Axter-Stash/tree/main/plugins/RenameFile
# Based on source code from  https://github.com/Serechops/Serechops-Stash/tree/main/plugins/Renamer

# To automatically install missing modules, uncomment the following lines of code.
# try:
    # import ModulesValidate
    # ModulesValidate.modulesInstalled(["stashapp-tools", "requests"])
# except Exception as e:
    # import traceback, sys
    # tb = traceback.format_exc()
    # print(f"ModulesValidate Exception. Error: {e}\nTraceBack={tb}", file=sys.stderr)
    
import os, sys, shutil, json, hashlib, pathlib, logging, time, traceback
from pathlib import Path
import stashapi.log as log # Importing stashapi.log as log for critical events ONLY
from stashapi.stashapp import StashInterface
from StashPluginHelper import StashPluginHelper
from StashPluginHelper import taskQueue
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
doNothing = False
exitMsg = "Change success!!"

# **********************************************************************
# ----------------------------------------------------------------------
settings = {
    "yRenameEvenIfTitleEmpty": False,
    "z_keyFIeldsIncludeInFileName": False,
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
# stash.status(logLevel=logging.DEBUG)
if stash.PLUGIN_ID in stash.PLUGIN_CONFIGURATION:
    stash.pluginSettings.update(stash.PLUGIN_CONFIGURATION[stash.PLUGIN_ID])
if stash.IS_DOCKER:
    stash.log_to_wrn_set = stash.LogTo.STASH + stash.LogTo.FILE
# ----------------------------------------------------------------------
WRAPPER_STYLES = config["wrapper_styles"]
POSTFIX_STYLES = config["postfix_styles"]

renameEvenIfTitleEmpty = stash.pluginSettings["yRenameEvenIfTitleEmpty"]

# Extract dry_run setting from settings
dry_run = stash.pluginSettings["zzdryRun"]
dry_run_prefix = ''
try:
    stash.Trace(f"hookContext={stash.JSON_INPUT['args']['hookContext']}")
    if stash.JSON_INPUT['args']['hookContext']['input']:
        if stash.JSON_INPUT['args']['hookContext']['input'] == None:
            doNothing = True
            stash.Log("input = None")
        else:
            inputToUpdateScenePost = True # This avoids calling rename logic twice
except:
    pass
    stash.Warn("Exception thrown")

if dry_run:
    stash.Log("Dry run mode is enabled.")
    dry_run_prefix = "Would've "
max_tag_keys = stash.pluginSettings["zmaximumTagKeys"] if stash.pluginSettings["zmaximumTagKeys"] != 0 else 12 # Need this incase use explicitly sets value to zero in UI
# ToDo: Add split logic here to slpit possible string array into an array
exclude_paths = config["pathToExclude"]
exclude_paths = exclude_paths.split()
if len(exclude_paths) > 0:
    stash.Trace(f"(exclude_paths={exclude_paths})")
excluded_tags = config["excludeTags"]
# Extract tag whitelist from settings
tag_whitelist = config["tagWhitelist"]
if not tag_whitelist:
    tag_whitelist = ""
if len(tag_whitelist) > 0:
    stash.Trace(f"(tag_whitelist={tag_whitelist})")
handleExe = stash.pluginConfig['handleExe']
openedfile = None
if handleExe != None and handleExe != "" and os.path.isfile(handleExe):
    # ModulesValidate.modulesInstalled(["psutil"], silent=True)
    from openedFile import openedFile
    openedfile = openedFile(handleExe, stash)

endpointHost = stash.JSON_INPUT['server_connection']['Host']
if endpointHost == "0.0.0.0":
    endpointHost = "localhost"
endpoint = f"{stash.JSON_INPUT['server_connection']['Scheme']}://{endpointHost}:{stash.JSON_INPUT['server_connection']['Port']}/graphql"

# stash.Trace(f"(endpoint={endpoint})")
move_files = stash.Setting("fileRenameViaMove")
fieldKeyList = stash.pluginSettings["zfieldKeyList"] # Default Field Key List with the desired order
if not fieldKeyList or fieldKeyList == "":
    fieldKeyList = DEFAULT_FIELD_KEY_LIST
fieldKeyList = fieldKeyList.replace(" ", "")
fieldKeyList = fieldKeyList.replace(";", ",")
fieldKeyList = fieldKeyList.split(",")
# stash.Trace(f"(fieldKeyList={fieldKeyList})")
separator = stash.pluginSettings["zseparators"]
# ----------------------------------------------------------------------
# **********************************************************************

double_separator = separator + separator
# stash.Trace(f"(WRAPPER_STYLES={WRAPPER_STYLES}) (POSTFIX_STYLES={POSTFIX_STYLES})")

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

include_keyField_if_in_name     = stash.pluginSettings["z_keyFIeldsIncludeInFileName"]
excludeIgnoreAutoTags           = config["excludeIgnoreAutoTags"]
max_performers                  = int(config["max_performers"])
rename_associated_files_enable  = config["rename_associated_files_enable"]
associated_files_to_rename      = config["associated_files_to_rename"]

def getPerformers(scene, title):
    title = title.lower()
    results = ""
    qtyPerformers = 0
    for performer in scene['performers']:
        qtyPerformers += 1
        if max_performers > -1 and qtyPerformers > max_performers:
            break
        name = performer['name']
        stash.Trace(f"performer = {name}")
        if not include_keyField_if_in_name:
            if name.lower() in title:
                stash.Trace(f"Skipping performer name '{name}' because already in title: '{title}'")
                continue
        results += f"{name}, "
    return results.strip(", ")

def getGalleries(scene, title):
    results = ""
    for gallery in scene['galleries']:
        name = gallery = stash.find_gallery(gallery['id'])['title']
        stash.Trace(f"gallery = {name}")
        if not include_keyField_if_in_name:
            if name.lower() in title:
                stash.Trace(f"Skipping gallery name '{name}' because already in title: '{title}'")
                continue
        results += f"{name}, "
    return results.strip(", ")

def getTags(scene, title):
    title = title.lower()
    results = ""
    for tag in scene['tags']:
        name = tag['name']
        stash.Trace(f"tag = {name}")
        if excludeIgnoreAutoTags == True and tag['ignore_auto_tag'] == True:
            stash.Trace(f"Skipping tag name '{name}' because ignore_auto_tag is True.")
            continue
        if not include_keyField_if_in_name:
            if name.lower() in title:
                stash.Trace(f"Skipping tag name '{name}' because already in title: '{title}'")
                continue
        results += f"{name}, "
    return results.strip(", ")

# Function to form the new filename based on scene details and user settings
def form_filename(original_file_stem, scene_details):  
    filename_parts = []
    tag_keys_added = 0
    default_title = ''
    if_notitle_use_org_filename = config["if_notitle_use_org_filename"]
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
    
    stash.Trace(f"scene_details = {scene_details}")
    
    for key in fieldKeyList:
        if key == 'studio':
            if stash.Setting("studioAppendEnable"):
                studio = scene_details.get('studio')
                if studio != None:
                    studio_name = studio.get('name')
                else:
                    studio_name = None
                stash.Trace(f"(studio_name={studio_name})")
                if studio_name:
                    studio_name += POSTFIX_STYLES.get('studio')
                    if include_keyField_if_in_name or studio_name.lower() not in title.lower():
                        if WRAPPER_STYLES.get('studio'):
                            filename_parts.append(f"{WRAPPER_STYLES['studio'][0]}{studio_name}{WRAPPER_STYLES['studio'][1]}")
                        else:
                            filename_parts.append(studio_name)
            else:
                stash.Trace("Skipping studio because of user setting studioAppend disabled.")
        elif key == 'title':
            if title:  # This value has already been fetch in start of function because it needs to be defined before tags and performers
                title += POSTFIX_STYLES.get('title')
                if WRAPPER_STYLES.get('title'):
                    filename_parts.append(f"{WRAPPER_STYLES['title'][0]}{title}{WRAPPER_STYLES['title'][1]}")
                else:
                    filename_parts.append(title)
        elif key == 'performers':
            if stash.Setting("performerAppendEnable"):
                performers = getPerformers(scene_details, title)
                if performers != "":
                    performers += POSTFIX_STYLES.get('performers')
                    stash.Trace(f"(performers={performers})")
                    if WRAPPER_STYLES.get('performers'):
                        filename_parts.append(f"{WRAPPER_STYLES['performers'][0]}{performers}{WRAPPER_STYLES['performers'][1]}")
                    else:
                        filename_parts.append(performers)
        elif key == 'date':
            scene_date = scene_details.get('date')
            if scene_date:
                scene_date += POSTFIX_STYLES.get('date')
                if WRAPPER_STYLES.get('date'):
                    scene_date = f"{WRAPPER_STYLES['date'][0]}{scene_date}{WRAPPER_STYLES['date'][1]}"
                if scene_date not in title:
                    filename_parts.append(scene_date)
        elif key == 'resolution':
            # width = str(scene_details.get('files', [{}])[0].get('width', ''))  # Convert width to string
            # height = str(scene_details.get('files', [{}])[0].get('height', ''))  # Convert height to string
            width = str(scene_details['files'][0]['width'])
            height = str(scene_details['files'][0]['height'])
            if width and height:
                resolution = width + POSTFIX_STYLES.get('width_height_seperator') + height + POSTFIX_STYLES.get('resolution')
                if WRAPPER_STYLES.get('resolution'):
                    resolution = f"{WRAPPER_STYLES['resolution'][0]}{resolution}{WRAPPER_STYLES['width'][1]}"
                if resolution not in title:
                    filename_parts.append(resolution)
        elif key == 'width':
            width = str(scene_details['files'][0]['width'])
            if width:
                width += POSTFIX_STYLES.get('width')
                if WRAPPER_STYLES.get('width'):
                    width = f"{WRAPPER_STYLES['width'][0]}{width}{WRAPPER_STYLES['width'][1]}"
                if width not in title:
                    filename_parts.append(width)
        elif key == 'height':
            height = str(scene_details['files'][0]['height'])
            if height:
                height += POSTFIX_STYLES.get('height')
                if WRAPPER_STYLES.get('height'):
                    height = f"{WRAPPER_STYLES['height'][0]}{height}{WRAPPER_STYLES['height'][1]}"
                if height not in title:
                    filename_parts.append(height)
        elif key == 'video_codec':
            video_codec = scene_details['files'][0]['video_codec'].upper()  # Convert to uppercase
            if video_codec:
                video_codec += POSTFIX_STYLES.get('video_codec')
                if WRAPPER_STYLES.get('video_codec'):
                    video_codec = f"{WRAPPER_STYLES['video_codec'][0]}{video_codec}{WRAPPER_STYLES['video_codec'][1]}"
                if video_codec not in title:
                    filename_parts.append(video_codec)
        elif key == 'frame_rate':
            frame_rate = str(scene_details['files'][0]['frame_rate']) + 'FPS'  # Convert to string and append ' FPS'
            if frame_rate:
                frame_rate += POSTFIX_STYLES.get('frame_rate')
                if WRAPPER_STYLES.get('frame_rate'):
                    frame_rate = f"{WRAPPER_STYLES['frame_rate'][0]}{frame_rate}{WRAPPER_STYLES['frame_rate'][1]}"
                if frame_rate not in title:
                    filename_parts.append(frame_rate)
        elif key == 'galleries':
            galleries = getGalleries(scene_details, title)
            if galleries != "":
                galleries += POSTFIX_STYLES.get('galleries')
                if WRAPPER_STYLES.get('galleries'):
                    filename_parts.append(f"{WRAPPER_STYLES['galleries'][0]}{galleries}{WRAPPER_STYLES['galleries'][1]}")
                else:
                    filename_parts.append(galleries)
                stash.Trace(f"(galleries={galleries})")
        elif key == 'tags':
            if stash.Setting("tagAppendEnable"):
                tags = getTags(scene_details, title)
                if tags != "":
                    tags += POSTFIX_STYLES.get('tag')
                    if WRAPPER_STYLES.get('tag'):
                        filename_parts.append(f"{WRAPPER_STYLES['tag'][0]}{tags}{WRAPPER_STYLES['tag'][1]}")
                    else:
                        filename_parts.append(tags)
                    stash.Trace(f"(tags={tags})")
    
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
    POST_SCAN_DELAY = 3
    fragment = 'id title performers {name} tags {id name ignore_auto_tag} studio {name} galleries {id} files {id path width height video_codec frame_rate} date'
    scene_details = stash.find_scene(scene_id, fragment)
    stash.Trace(f"(scene_details={scene_details})")
    if not scene_details:
        stash.Error(f"Scene with ID {scene_id} not found.")
        return None
    taskqueue = taskQueue(stash.job_queue())
    original_file_path = scene_details['files'][0]['path']
    original_parent_directory = Path(original_file_path).parent
    maxScanCountDefault = 5
    maxScanCountForUpdate = 10
    if scene_details['title'] == None or scene_details['title'] == "":
        if renameEvenIfTitleEmpty == False:
            stash.Log("Nothing to do because title is empty.")
            return None
        stash.Warn("Title is empty.")
        maxScanCountDefault = 1
        maxScanCountForUpdate = 1
    if not os.path.isfile(original_file_path) and not taskqueue.clearDupTagsJobOnTaskQueue() and not taskqueue.deleteTaggedScenesJobOnTaskQueue() and not taskqueue.tooManyScanOnTaskQueue(maxScanCountDefault):
        stash.Warn(f"[metadata_scan] Have to rescan scene ID {scene_id}, because Stash library path '{original_file_path}' does not exist. Scanning path: {original_parent_directory.resolve().as_posix()}")
        stash.metadata_scan(paths=[original_parent_directory.resolve().as_posix()])
        time.sleep(POST_SCAN_DELAY) # After a scan, need a few seconds delay before fetching data.
        scene_details = stash.find_scene(scene_id)
        original_file_path = scene_details['files'][0]['path']
    if not os.path.isfile(original_file_path):
        stash.Error(f"Can not rename file because path {original_file_path} doesn't exist.")
        return None
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
    org_file_root_stem  = f"{original_parent_directory}{os.sep}{original_file_stem}"
    new_file_root_stem  = f"{original_parent_directory}{os.sep}{new_filename}"
    stash.Trace(f"(original_file_name={original_file_name}) (newFilenameWithExt={newFilenameWithExt})(new_file_path={new_file_path}) (FileID={scene_details['files'][0]['id']})")
    if original_file_name == newFilenameWithExt or original_file_name == new_filename:
        stash.Log(f"Nothing to do, because new file name matches original file name: (newFilenameWithExt={newFilenameWithExt})")
        return None
    targetDidExist = True if os.path.isfile(new_file_path) else False
    try:
        if openedfile != None:
            results = openedfile.closeFile(original_file_path)
            if results != None:
                stash.Warn(f"Had to close '{original_file_path}', because it was opened by following pids:{results['pids']}")
        if move_files:
            if not dry_run:
                stash.Trace(f"Moving file '{original_file_path}' to '{new_file_path}'")
                shutil.move(original_file_path, new_file_path)
                if rename_associated_files_enable:
                    stash.Trace(f"rename_associated_files_enable is enabled")
                    for ext in associated_files_to_rename:
                        associted_filename = org_file_root_stem + ext
                        # stash.Trace(f"Checking if file exist: '{associted_filename}'")
                        if os.path.isfile(associted_filename):
                            new_associted_filename = new_file_root_stem + ext
                            stash.Log(f"Renaming file '{associted_filename}' to '{new_associted_filename}'")
                            shutil.move(associted_filename, new_associted_filename)
            exitMsg = f"{dry_run_prefix}Moved file to '{new_file_path}' from '{original_file_path}'"
        else:
            stash.Trace(f"Rename('{original_file_path}', '{new_file_path}')")
            if not dry_run:
                stash.Trace(f"Renaming file '{original_file_path}' to '{new_file_path}'")
                os.rename(original_file_path, new_file_path)
                if rename_associated_files_enable:
                    stash.Trace(f"rename_associated_files_enable is enabled...")
                    for ext in associated_files_to_rename:
                        associted_filename = org_file_root_stem + ext
                        # stash.Trace(f"Checking if file exist: '{associted_filename}'")
                        if os.path.isfile(associted_filename):
                            new_associted_filename = new_file_root_stem + ext
                            stash.Log(f"Renaming file '{associted_filename}' to '{new_associted_filename}'")
                            os.rename(associted_filename, new_associted_filename)
            exitMsg = f"{dry_run_prefix}Renamed file to '{new_file_path}' from '{original_file_path}'"
    except OSError as e:
        exitMsg = f"Failed to move/rename file: From {original_file_path} to {new_file_path}; targetDidExist={targetDidExist}. Error: {e}"
        stash.Error(exitMsg)
        if not taskqueue.tooManyScanOnTaskQueue(maxScanCountDefault):
            stash.Trace(f"Calling [metadata_scan] for path {original_parent_directory.resolve().as_posix()}")
            stash.metadata_scan(paths=[original_parent_directory.resolve().as_posix()])
        if targetDidExist:
            raise
        if os.path.isfile(new_file_path):
            if os.path.isfile(original_file_path):
                os.remove(original_file_path)
            pass
        else:
            # ToDo: Add delay rename here
            raise
    
    if dry_run:
        stash.Log("Dry-Run, so skipping DB renaming")
    elif stash.renameFileNameInDB(scene_details['files'][0]['id'], original_file_name, newFilenameWithExt):
        stash.Trace("DB rename success")
    elif not taskqueue.tooManyScanOnTaskQueue(maxScanCountForUpdate):
        stash.Trace(f"Calling [metadata_scan] for path {original_parent_directory.resolve().as_posix()}")
        stash.metadata_scan(paths=[original_parent_directory.resolve().as_posix()])
        time.sleep(POST_SCAN_DELAY) # After a scan, need a few seconds delay before fetching data.
        scene_details = stash.find_scene(scene_id)
        if new_file_path != scene_details['files'][0]['path'] and not targetDidExist and not taskqueue.tooManyScanOnTaskQueue(maxScanCountDefault):
            stash.Trace(f"Calling [metadata_scan] for path {original_parent_directory.resolve().as_posix()}")
            stash.metadata_scan(paths=[original_parent_directory.resolve().as_posix()])
            time.sleep(POST_SCAN_DELAY) # After a scan, need a few seconds delay before fetching data.
            scene_details = stash.find_scene(scene_id)
            if new_file_path != scene_details['files'][0]['path']:
                if not os.path.isfile(new_file_path):
                    stash.Error(f"Failed to rename file from {scene_details['files'][0]['path']} to {new_file_path}.")
                elif os.path.isfile(scene_details['files'][0]['path']):
                    stash.Warn(f"Failed to rename file from {scene_details['files'][0]['path']} to {new_file_path}. Old file still exist. Will attempt delay deletion.")
                    for i in range(1, 5*60):
                        time.sleep(60)
                        if not os.path.isfile(new_file_path):
                            stash.Error(f"Not deleting old file name {original_file_path} because new file name (new_file_path) does NOT exist.")
                            break
                        os.remove(original_file_path)
                        if not os.path.isfile(original_file_path):
                            stash.Log(f"Deleted {original_file_path} in delay deletion after {i} minutes.")
                            stash.Trace(f"Calling [metadata_scan] for path {original_parent_directory.resolve().as_posix()}")
                            stash.metadata_scan(paths=[original_parent_directory.resolve().as_posix()])
                            break
                else:
                    org_stem = Path(scene_details['files'][0]['path']).stem
                    new_stem = Path(new_file_path).stem
                    file_id = scene_details['files'][0]['id']
                    stash.Warn(f"Failed to update Stash library with new name. Will try direct SQL update. org_name={org_stem}; new_name={new_stem}; file_id={file_id}")
                    # stash.set_file_basename(file_id, new_stem)
    else:
        stash.Warn(f"Not performming [metadata_scan] because too many scan jobs are already on the Task Queue. Recommend running a full scan, and a clean job to make sure Stash DB is up to date.")
        if not taskqueue.cleanJobOnTaskQueue():
            stash.metadata_scan()
            stash.metadata_clean()
        if not taskqueue.cleanGeneratedJobOnTaskQueue():
            stash.metadata_clean_generated()
    stash.Log(exitMsg)
    return new_filename 
    
def rename_files_task():
    scene_result = stash.get_all_scenes()
    all_scenes = scene_result['allScenes']
    if not all_scenes:
        stash.Error("No scenes found.")
        sys.exit(13)
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

try:
    if stash.PLUGIN_TASK_NAME == "rename_files_task":
        stash.Trace(f"PLUGIN_TASK_NAME={stash.PLUGIN_TASK_NAME}")
        rename_files_task()
    elif inputToUpdateScenePost:
        rename_files_task()
    else:
        stash.Trace(f"Nothing to do. doNothing={doNothing}")
except Exception as e:
    tb = traceback.format_exc()
    stash.Error(f"Exception while running Plugin. Error: {e}\nTraceBack={tb}")
    # stash.log.exception('Got exception on main handler')

stash.Trace("\n*********************************\nEXITING   ***********************\n*********************************")

