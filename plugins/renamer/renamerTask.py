import difflib
import json
import os
import re
import sqlite3
import subprocess
import sys
import time

import requests

try:
    import psutil  # pip install psutil
    MODULE_PSUTIL = True
except:
    MODULE_PSUTIL = False

try:
    import unidecode  # pip install Unidecode
    MODULE_UNIDECODE = True
except:
    MODULE_UNIDECODE = False

import config
import log


FRAGMENT = json.loads(sys.stdin.read())
FRAGMENT_SERVER = FRAGMENT["server_connection"]
PLUGIN_DIR = FRAGMENT_SERVER["PluginDir"]
PLUGIN_ARGS = FRAGMENT['args'].get("mode")

log.LogDebug("--Starting Plugin 'Renammer'--")

#log.LogDebug("{}".format(FRAGMENT))

def callGraphQL(query, variables=None, raise_exception=True):
    # Session cookie for authentication
    graphql_port = FRAGMENT_SERVER['Port']
    graphql_scheme = FRAGMENT_SERVER['Scheme']
    graphql_cookies = {
        'session': FRAGMENT_SERVER.get('SessionCookie').get('Value')
    }
    graphql_headers = {
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "DNT": "1"
    }
    graphql_domain = 'localhost'
    # Stash GraphQL endpoint
    graphql_url = graphql_scheme + "://" + graphql_domain + ":" + str(graphql_port) + "/graphql"

    json = {'query': query}
    if variables is not None:
        json['variables'] = variables
    try:
        response = requests.post(graphql_url, json=json,headers=graphql_headers, cookies=graphql_cookies, timeout=20)
    except Exception as e:
         exit_plugin(err="[FATAL] Exception with GraphQL request. {}".format(e))
    if response.status_code == 200:
        result = response.json()
        if result.get("error"):
            for error in result["error"]["errors"]:
                if raise_exception:
                    raise Exception("GraphQL error: {}".format(error))
                else:
                    log.LogError("GraphQL error: {}".format(error))
            return None
        if result.get("data"):
            return result.get("data")
    elif response.status_code == 401:
        exit_plugin(err="HTTP Error 401, Unauthorised.")
    else:
        raise ConnectionError("GraphQL query failed: {} - {}".format(response.status_code, response.content))


def graphql_getScene(scene_id):
    query = """
    query FindScene($id: ID!, $checksum: String) {
        findScene(id: $id, checksum: $checksum) {
            ...SceneData
        }
    }
    fragment SceneData on Scene {
        id
        checksum
        oshash
        title
        details
        url
        date
        rating
        o_counter
        organized
        path
        phash
        interactive
        file {
            size
            duration
            video_codec
            audio_codec
            width
            height
            framerate
            bitrate
        }
        studio {
            ...SlimStudioData
        }
        movies {
            movie {
            ...MovieData
            }
            scene_index
        }
        tags {
            ...SlimTagData
        }
        performers {
            ...PerformerData
        }
    }
    fragment SlimStudioData on Studio {
        id
        name
        parent_studio {
            id
            name
        }
        details
        rating
        aliases
    }
    fragment MovieData on Movie {
        id
        checksum
        name
        aliases
        date
        rating
        director
        studio {
            ...SlimStudioData
        }
        synopsis
        url
    }
    fragment SlimTagData on Tag {
        id
        name
        aliases
    }
    fragment PerformerData on Performer {
        id
        checksum
        name
        url
        gender
        twitter
        instagram
        birthdate
        ethnicity
        country
        eye_color
        height
        measurements
        fake_tits
        career_length
        tattoos
        piercings
        aliases
        favorite
        tags {
            ...SlimTagData
        }
        rating
        details
        death_date
        hair_color
        weight
    }
    """
    variables = {
        "id": scene_id
    }
    result = callGraphQL(query, variables)
    return result.get('findScene')


def graphql_getConfiguration():
    query = """
        query Configuration {
            configuration {
                general {
                    databasePath
                }
            }
        }
    """
    result = callGraphQL(query)
    return result.get('configuration')


def graphql_findScene(perPage,direc="DESC"):
    query = """
    query FindScenes($filter: FindFilterType) {
        findScenes(filter: $filter) {
            count
            scenes {
                ...SlimSceneData
            }
        }
    }
    fragment SlimSceneData on Scene {
        id
        checksum
        oshash
        title
        details
        url
        date
        rating
        o_counter
        organized
        path
        phash
        interactive
        scene_markers {
            id
            title
            seconds
        }
        galleries {
            id
            path
            title
        }
        studio {
            id
            name
        }
        movies {
            movie {
                id
                name
            }
            scene_index
        }
        tags {
            id
            name
        }
        performers {
            id
            name
            gender
            favorite
        }
    }
    """
    # ASC DESC
    variables = {'filter': {"direction": direc, "page": 1, "per_page": perPage, "sort": "updated_at"}}
    result = callGraphQL(query, variables)
    return result.get("findScenes")


def makeFilename(scene_information, query):
    new_filename = str(query)
    for field in TEMPLATE_FIELD:
        field_name = field.replace("$","")
        if field in new_filename:
            if scene_information.get(field_name):
                if field == "$performer":
                    if re.search(r"\$performer[-\s_]*\$title", new_filename) and scene_information.get('title') and PREVENT_TITLE_PERF:
                        if re.search("^{}".format(scene_information["performer"]), scene_information["title"]):
                            log.LogInfo("Ignoring the performer field because it's already in start of title")
                            new_filename = re.sub('\$performer[-\s_]*', '', new_filename)
                            continue
                new_filename = new_filename.replace(field, scene_information[field_name])
            else:
                new_filename = re.sub('\${}[-\s_]*'.format(field_name), '', new_filename)

    # remove []
    new_filename = re.sub('\[\W*]', '', new_filename)
    # Remove multiple space/_ in row
    new_filename = re.sub('[\s_]{2,}', ' ', new_filename)
    # Remove multiple - in row
    new_filename = re.sub('(?:[\s_]-){2,}', ' -', new_filename)
    # Remove space at start/end
    new_filename = new_filename.strip(" -")
    return new_filename


def find_diff_text(a, b):
    addi = minus = stay = ""
    minus_ = addi_ = 0
    for _, s in enumerate(difflib.ndiff(a, b)):
        if s[0] == ' ':
            stay += s[-1]
            minus += "*"
            addi += "*"
        elif s[0] == '-':
            minus += s[-1]
            minus_ += 1
        elif s[0] == '+':
            addi += s[-1]
            addi_ += 1
    if minus_ > 20 or addi_ > 20:
        log.LogDebug("Diff Checker: +{}; -{};".format(addi_,minus_))
        log.LogDebug("OLD: {}".format(a))
        log.LogDebug("NEW: {}".format(b))
    else:
        log.LogDebug("Original: {}\n- Charac: {}\n+ Charac: {}\n  Result: {}".format(a, minus, addi, b))
    return 


def has_handle(fpath,all_result=False):
    lst = []
    for proc in psutil.process_iter():
        try:
            for item in proc.open_files():
                if fpath == item.path:
                    if all_result:
                        lst.append(proc)
                    else:
                        return proc
        except Exception:
            pass
    return lst


def exit_plugin(msg=None, err=None):
    if msg is None and err is None:
        msg = "plugin ended"
    output_json = {"output": msg, "error": err}
    print(json.dumps(output_json))
    sys.exit()


def renamer(scene_id):
    filename_template = None
    STASH_SCENE = graphql_getScene(scene_id)
    # ================================================================ #
    #                       RENAMER                                    #
    # Tags > Studios > Default

    # Default
    if config.use_default_template:
        filename_template = config.default_template

    # Change by Studio
    if STASH_SCENE.get("studio") and config.studio_templates:
        if config.studio_templates.get(STASH_SCENE["studio"]["name"]):
            filename_template = config.studio_templates[STASH_SCENE["studio"]["name"]]
        # by Parent
        if STASH_SCENE["studio"].get("parent_studio"):
            if config.studio_templates.get(STASH_SCENE["studio"]["name"]):
                filename_template = config.studio_templates[STASH_SCENE["studio"]["name"]]

    # Change by Tag
    if STASH_SCENE.get("tags") and config.tag_templates:
        for tag in STASH_SCENE["tags"]:
            if config.tag_templates.get(tag["name"]):
                filename_template = config.tag_templates[tag["name"]]
                break

    #                           END                                    #
    ####################################################################

    if config.only_organized and not STASH_SCENE["organized"]:
        return("Scene ignored (not organized)")

    if not filename_template:
        return("No template for this scene.")

    #log.LogDebug("Using this template: {}".format(filename_template))

    current_path = STASH_SCENE["path"]
    # note: contain the dot (.mp4)
    file_extension = os.path.splitext(current_path)[1]
    # note: basename contains the extension
    current_filename = os.path.basename(current_path)
    current_directory = os.path.dirname(current_path)

    # Grabbing things from Stash
    scene_information = {}

    # Grab Title (without extension if present)
    if STASH_SCENE.get("title"):
        # Removing extension if present in title
        scene_information["title"] = re.sub("{}$".format(file_extension), "", STASH_SCENE["title"])

    # Grab Date
    scene_information["date"] = STASH_SCENE.get("date")

    # Grab Performer
    if STASH_SCENE.get("performers"):
        perf_list = ""
        if len(STASH_SCENE["performers"]) > PERFORMER_LIMIT:
            log.LogInfo("More than {} performer(s). Ignoring $performer".format(PERFORMER_LIMIT))
        else:
            for perf in STASH_SCENE["performers"]:
                #log.LogDebug(performer)
                if PERFORMER_IGNORE_MALE:
                    if perf["gender"] != "MALE":
                        perf_list += perf["name"] + PERFORMER_SPLITCHAR
                else:
                    perf_list += perf["name"] + PERFORMER_SPLITCHAR
            # Remove last character
            perf_list = perf_list[:-len(PERFORMER_SPLITCHAR)]
        scene_information["performer"] = perf_list

    # Grab Studio name
    if STASH_SCENE.get("studio"):
        scene_information["studio"] = STASH_SCENE["studio"].get("name")
        scene_information["studio_family"] = scene_information["studio"]
        # Grab Parent name
        if STASH_SCENE["studio"].get("parent_studio"):
            scene_information["parent_studio"] = STASH_SCENE["studio"]["parent_studio"]["name"]
            scene_information["studio_family"] = scene_information["parent_studio"]

    # Grab Height (720p,1080p,4k...)
    scene_information["resolution"] = 'SD'
    scene_information["height"] = "{}p".format(STASH_SCENE["file"]["height"])
    if STASH_SCENE["file"]["height"] >= 720:
        scene_information["resolution"] = 'HD'
    if STASH_SCENE["file"]["height"] >= 2160:
        scene_information["height"] = '4k'
        scene_information["resolution"] = 'UHD'
    if STASH_SCENE["file"]["height"] >= 4320:
        scene_information["height"] = '8k'
    # For Phone ?
    if STASH_SCENE["file"]["height"] > STASH_SCENE["file"]["width"]:
        scene_information["resolution"] = 'VERTICAL'

    scene_information["video_codec"] = STASH_SCENE["file"]["video_codec"]
    scene_information["audio_codec"] = STASH_SCENE["file"]["audio_codec"]

    log.LogDebug("[{}] Scene information: {}".format(scene_id,scene_information))

    if scene_information.get("date"):
        scene_information["year"] = scene_information["date"][0:4]


    # Create the new filename
    new_filename = makeFilename(scene_information, filename_template) + file_extension

    # Remove illegal character for Windows ('#' and ',' is not illegal you can remove it)
    new_filename = re.sub('[\\/:"*?<>|#,]+', '', new_filename)

    # Trying to remove non standard character
    if MODULE_UNIDECODE and UNICODE_USE:
        new_filename = unidecode.unidecode(new_filename, errors='preserve')
    else:
        # Using typewriter for Apostrophe
        new_filename = re.sub("[’‘]+", "'", new_filename)

    # Replace the old filename by the new in the filepath
    new_path = current_path.rstrip(current_filename) + new_filename

    # Trying to prevent error with long path for Win10
    # https://docs.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation?tabs=cmd
    if len(new_path) > 240:
        log.LogWarning("The Path is too long ({})...".format(len(new_path)))
        for word in ORDER_SHORTFIELD:
            if word not in filename_template:
                continue
            filename_template = re.sub('\{}[-\s_]*'.format(word), '', filename_template).strip()
            log.LogDebug("Removing field: {}".format(word))
            new_filename = makeFilename(scene_information, filename_template) + file_extension
            new_path = current_path.rstrip(current_filename) + new_filename
            if len(new_path) < 240:
                log.LogInfo("Reduced filename to: {}".format(new_filename))
                break
        if len(new_path) > 240:
            return("Can't manage to reduce the path, operation aborted.")

    #log.LogDebug("Filename: {} -> {}".format(current_filename,new_filename))
    #log.LogDebug("Path: {} -> {}".format(current_path,new_path))

    if (new_path == current_path):
        return("Filename already correct. ({})".format(current_filename))

    if ALT_DIFF_DISPLAY:
        find_diff_text(current_filename,new_filename)
    else:
        log.LogDebug("[OLD] Filename: {}".format(current_filename))
        log.LogDebug("[NEW] Filename: {}".format(new_filename))
    if DRY_RUN:
        with open(FILE_DRYRUN_RESULT, 'a', encoding='utf-8') as f:
            f.write("{}|{}|{}\n".format(scene_id, current_filename, new_filename))
        return("[Dry-run] Writing in {}".format(FILE_DRYRUN_RESULT))


    # Connect to the DB
    try:
        sqliteConnection = sqlite3.connect(STASH_DATABASE)
        cursor = sqliteConnection.cursor()
        log.LogDebug("Python successfully connected to SQLite")
    except sqlite3.Error as error:
        return("FATAL SQLITE Error: {}".format(error))

    # Looking for duplicate filename
    folder_name = os.path.basename(os.path.dirname(new_path))
    cursor.execute("SELECT id FROM scenes WHERE path LIKE ? AND NOT id=?;", ["%" + folder_name + "_" + new_filename, scene_id])
    dupl_check = cursor.fetchall()
    if len(dupl_check) > 0:
        for dupl_row in dupl_check:
            log.LogError("Same path: [{}]".format(dupl_row[0]))
        return("Duplicate path detected, check log!")

    cursor.execute("SELECT id FROM scenes WHERE path LIKE ? AND NOT id=?;", ["%" + new_filename, scene_id])
    dupl_check = cursor.fetchall()
    if len(dupl_check) > 0:
        for dupl_row in dupl_check:
            log.LogInfo("Same filename: [{}]".format(dupl_row[0]))

    # OS Rename
    if (os.path.isfile(current_path) == True):
        try:
            os.rename(current_path, new_path)
        except PermissionError as err:
            if "[WinError 32]" in str(err) and MODULE_PSUTIL:
                log.LogWarning("A process use this file, trying to find it (Probably FFMPEG)")
                # Find what process access the file, it's ffmpeg for sure...
                process_use = has_handle(current_path, PROCESS_ALLRESULT)
                if process_use:
                    # Terminate the process then try again to rename
                    log.LogDebug("Process that use this file: {}".format(process_use))
                    if PROCESS_KILL:
                        p = psutil.Process(process_use.pid)
                        p.terminate()
                        p.wait(10)
                        # If we don't manage to close it, this will create a error again.
                        os.rename(current_path, new_path)
                    else:
                        return("A process prevent editing the file.")
            else:
                log.LogError(err)
                return ""
        if (os.path.isfile(new_path) == True):
            log.LogInfo("[OS] File Renamed!")
            if LOGFILE:
                with open(LOGFILE, 'a', encoding='utf-8') as f:
                    f.write("{}|{}|{}\n".format(scene_id, current_path, new_path))
        else:
            # I don't think it's possible. 
            return("[OS] File failed to rename ? {}".format(new_path))
    else:
        return("[OS] File don't exist in your Disk/Drive ({})".format(current_path))

    # Database rename
    cursor.execute("UPDATE scenes SET path=? WHERE id=?;", [new_path, scene_id])
    sqliteConnection.commit()
    # Close DB
    cursor.close()
    sqliteConnection.close()
    log.LogInfo("[SQLITE] Database updated and closed!")
    return ""


# File that show what we will changed.
FILE_DRYRUN_RESULT = os.path.join(PLUGIN_DIR, "renamer_scan.txt")

STASH_CONFIG = graphql_getConfiguration()
STASH_DATABASE = STASH_CONFIG["general"]["databasePath"]
TEMPLATE_FIELD = "$date $year $performer $title $height $resolution $studio $parent_studio $studio_family $video_codec $audio_codec".split(" ")

# READING CONFIG

LOGFILE = config.log_file
PERFORMER_SPLITCHAR = config.performer_splitchar
PERFORMER_LIMIT = config.performer_limit
PERFORMER_IGNORE_MALE = config.performer_ignore_male
PREVENT_TITLE_PERF = config.prevent_title_performer

PROCESS_KILL = config.process_kill_attach
PROCESS_ALLRESULT = config.process_getall
UNICODE_USE = config.use_ascii

ORDER_SHORTFIELD = config.order_field
ALT_DIFF_DISPLAY = config.alt_diff_display

# Task
scenes = None
progress = 0
start_time = time.time()

if PLUGIN_ARGS in ["Process_test","Process_full","Process_dry"]:
    DRY_RUN = False
else:
    log.LogDebug("Dry-Run enable")
    DRY_RUN = True

if PLUGIN_ARGS in ["DRYRUN_test","Process_test"]:
    scenes = graphql_findScene(10, "DESC")
if PLUGIN_ARGS in ["DRYRUN_full","Process_full"]:
    scenes = graphql_findScene(-1, "ASC")
if PLUGIN_ARGS == "Process_dry":
    if os.path.exists(FILE_DRYRUN_RESULT):
        scenes = {"scenes":[]}
        with open(FILE_DRYRUN_RESULT, 'r') as f:
            for line in f:
                scene_id_file = line.split("|")[0]
                scenes["scenes"].append({"id": scene_id_file})
    else:
        exit_plugin(err="Can't find the file from the dry-run ({}). Be sure to run a Dry-Run task before.".format(FILE_DRYRUN_RESULT))

if not scenes:
    exit_plugin(err="no scene")

log.LogDebug("Count scenes: {}".format(len(scenes["scenes"])))
progress_step = 1 / len(scenes["scenes"])

for scene in scenes["scenes"]:
    msg = renamer(scene["id"])
    if msg:
        log.LogDebug(msg)
    progress += progress_step
    log.LogProgress(progress)

if PLUGIN_ARGS == "Process_dry":
    os.remove(FILE_DRYRUN_RESULT)

if DRY_RUN:
    num_lines = 0
    if os.path.exists(FILE_DRYRUN_RESULT):
        num_lines = sum(1 for _ in open(FILE_DRYRUN_RESULT))
    if num_lines > 0:
        log.LogInfo("[DRY-RUN] There wil be {} file(s) changed. Check {} for more details".format(num_lines, FILE_DRYRUN_RESULT))
    else:
        log.LogInfo("[DRY-RUN] No change to do.")

log.LogInfo("Took {} seconds".format(round(time.time() - start_time)))
exit_plugin("Successful!")
