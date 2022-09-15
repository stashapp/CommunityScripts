import difflib
import json
import os
import re
import sqlite3
import sys

import requests

try:
    import psutil  # pip install psutil
    MODULE_PSUTIL = True
except Exception:
    MODULE_PSUTIL = False

try:
    import unidecode  # pip install Unidecode
    MODULE_UNIDECODE = True
except Exception:
    MODULE_UNIDECODE = False

import config

import log

DRY_RUN = False

FRAGMENT = json.loads(sys.stdin.read())

FRAGMENT_SERVER = FRAGMENT["server_connection"]
PLUGIN_DIR = FRAGMENT_SERVER["PluginDir"]

FRAGMENT_SCENE_ID = FRAGMENT["args"].get("hookContext")
if FRAGMENT_SCENE_ID:
    FRAGMENT_SCENE_ID = FRAGMENT_SCENE_ID["id"]
PLUGIN_ARGS = FRAGMENT['args'].get("mode")

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
    graphql_domain = STASH_URL
    # Stash GraphQL endpoint
    graphql_url = graphql_scheme + "://" + graphql_domain + ":" + str(graphql_port) + "/graphql"

    json = {'query': query}
    if variables is not None:
        json['variables'] = variables
    try:
        response = requests.post(graphql_url, json=json, headers=graphql_headers, cookies=graphql_cookies, timeout=20)
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
        if result.get("errors"):
            for error in result["errors"]:
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
        title
        date
        rating
        organized
        path
        file {
            video_codec
            audio_codec
            width
            height
            framerate
            bitrate
        }
        studio {
          id
          name
          parent_studio {
              id
              name
          }
        }
        tags {
          id
          name
        }
        performers {
          id
          name
          gender
        }
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


def graphql_getStudio(studio_id):
    query = """
        query FindStudio($id:ID!) {
            findStudio(id: $id) {
                id
                name
                parent_studio {
                    id
                    name
                }
            }
        }
    """
    variables = {
        "id": studio_id
    }
    result = callGraphQL(query, variables)
    return result.get("findStudio")


def makeFilename(scene_information, query):
    new_filename = str(query)
    for field in TEMPLATE_FIELD:
        field_name = field.replace("$", "")
        if field in new_filename:
            if scene_information.get(field_name):
                if field == "$performer":
                    if re.search(r"\$performer[-\s_]*\$title", new_filename) and scene_information.get('title') and PREVENT_TITLE_PERF:
                        if re.search("^{}".format(scene_information["performer"]), scene_information["title"]):
                            log.LogInfo("Ignoring the performer field because it's already in start of title")
                            new_filename = new_filename.replace(field, "")
                            continue
                new_filename = new_filename.replace(field, scene_information[field_name])
            else:
                new_filename = new_filename.replace(field, "")

    # cleanup
    new_filename = re.sub(r'[\s_-]+(?=\W{2})', ' ', new_filename)
    # remove multi space
    new_filename = re.sub(r'\s+', ' ', new_filename)
    # remove thing like 'test - ]'
    for c in ["[", "("]:
        new_filename = re.sub(r'{}[_\s-]+'.format("\\" + c), c, new_filename)
    for c in ["]", ")"]:
        new_filename = re.sub(r'[_\s-]+{}'.format("\\" + c), c, new_filename)
    # remove () []
    new_filename = re.sub(r'\(\W*\)|\[\W*\]', '', new_filename)
    # Remove space at start/end
    new_filename = new_filename.strip(" -_")
    # Replace spaces with splitchar
    new_filename = new_filename.replace(' ', FILENAME_SPLITCHAR)
    return new_filename


def find_diff_text(a: str, b: str):
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
        log.LogDebug("Diff Checker: +{}; -{};".format(addi_, minus_))
        log.LogDebug("OLD: {}".format(a))
        log.LogDebug("NEW: {}".format(b))
    else:
        log.LogDebug("Original: {}\n- Charac: {}\n+ Charac: {}\n  Result: {}".format(a, minus, addi, b))
    return


def has_handle(fpath, all_result=False):
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


def config_edit(name: str, state: bool):
    found = 0
    with open(config.__file__, 'r') as file:
        config_lines = file.readlines()
    with open(config.__file__, 'w') as file_w:
        for line in config_lines:
            if name in line.split("=")[0].strip():
                file_w.write("{} = {}\n".format(name, state))
                found += 1
            else:
                file_w.write(line)
    return found


def exit_plugin(msg=None, err=None):
    if msg is None and err is None:
        msg = "plugin ended"
    output_json = {"output": msg, "error": err}
    print(json.dumps(output_json))
    sys.exit()


if PLUGIN_ARGS:
    log.LogDebug("--Starting Plugin 'Renamer'--")
    if "enable" in PLUGIN_ARGS:
        log.LogInfo("Enable hook")
        success = config_edit("enable_hook", True)
    elif "disable" in PLUGIN_ARGS:
        log.LogInfo("Disable hook")
        success = config_edit("enable_hook", False)
    if not success:
        log.LogError("Script failed to change the value of 'enable_hook' variable")
    exit_plugin("script finished")
else:
    if not config.enable_hook:
        exit_plugin("Hook disabled")
    else:
        log.LogDebug("--Starting Hook 'Renamer'--")

STASH_URL = config.stash_url
LOGFILE = config.log_file

STASH_SCENE = graphql_getScene(FRAGMENT_SCENE_ID)
STASH_CONFIG = graphql_getConfiguration()
STASH_DATABASE = STASH_CONFIG["general"]["databasePath"]
TEMPLATE_FIELD = "$date $year $twodigityear $month $day $performer $title $height $resolution $parent_studio $studio_family $studio $rating $tags $video_codec $audio_codec".split(" ")

#log.LogDebug("Scene ID: {}".format(FRAGMENT_SCENE_ID))
#log.LogDebug("Scene Info: {}".format(STASH_SCENE))
#log.LogDebug("Database Path: {}".format(STASH_DATABASE))
filename_template = None


# READING CONFIG
if config.only_organized and not STASH_SCENE["organized"]:
    exit_plugin("Scene ignored (not organized)")
    
ASSOCIATED_EXT = config.associated_extension

FIELD_WHITESPACE_SEP = config.field_whitespaceSeperator

FILENAME_LOWER = config.lowercase_Filename
FILENAME_SPLITCHAR = config.filename_splitchar
FILENAME_REMOVECHARACTER = config.removecharac_Filename

PERFORMER_SPLITCHAR = config.performer_splitchar
PERFORMER_LIMIT = config.performer_limit
PERFORMER_IGNOREGENDER = config.performer_ignoreGender
PREVENT_TITLE_PERF = config.prevent_title_performer

PREPOSITIONS_LIST = config.prepositions_list
PREPOSITIONS_REMOVAL = config.prepositions_removal

SQUEEZE_STUDIO_NAMES = config.squeeze_studio_names

RATING_FORMAT = config.rating_format

TAGS_SPLITCHAR = config.tags_splitchar
TAGS_WHITELIST = config.tags_whitelist
TAGS_BLACKLIST = config.tags_blacklist

IGNORE_PATH_LENGTH = config.ignore_path_length


PROCESS_KILL = config.process_kill_attach
PROCESS_ALLRESULT = config.process_getall
UNICODE_USE = config.use_ascii

ORDER_SHORTFIELD = config.order_field
ALT_DIFF_DISPLAY = config.alt_diff_display

# ================================================================ #
#                       RENAMER                                    #
# Tags > Studios > Default

# Default
if config.use_default_template:
    filename_template = config.default_template

# Change by Studio
if STASH_SCENE.get("studio") and config.studio_templates:
    template_found = False
    current_studio = STASH_SCENE.get("studio")
    if config.studio_templates.get(current_studio["name"]):
        filename_template = config.studio_templates[current_studio["name"]]
        template_found = True
    # by first Parent found
    while current_studio.get("parent_studio") and not template_found:
        if config.studio_templates.get(current_studio.get("parent_studio").get("name")):
            filename_template = config.studio_templates[current_studio["parent_studio"]["name"]]
            template_found = True
        current_studio = graphql_getStudio(current_studio.get("parent_studio")["id"])

# Change by Tag
if STASH_SCENE.get("tags") and config.tag_templates:
    for tag in STASH_SCENE["tags"]:
        if config.tag_templates.get(tag["name"]):
            filename_template = config.tag_templates[tag["name"]]
            break

#                           END                                    #
####################################################################

if not filename_template:
    exit_plugin("No template for this scene.")

#log.LogDebug("Using this template: {}".format(filename_template))

current_path = str(STASH_SCENE["path"])
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
    scene_information["title"] = re.sub(r"{}$".format(file_extension), "", STASH_SCENE["title"])
    if PREPOSITIONS_REMOVAL:
        for word in PREPOSITIONS_LIST:
            scene_information["title"] = re.sub(r"^{}[\s_-]".format(word), "", scene_information["title"])

# Grab Date
scene_information["date"] = STASH_SCENE.get("date")

# Grab Rating
if STASH_SCENE.get("rating"):
    scene_information["rating"] = RATING_FORMAT.format(STASH_SCENE["rating"])

# Grab Performer
if STASH_SCENE.get("performers"):
    perf_list = []
    for perf in STASH_SCENE["performers"]:
        if perf.get("gender"):
            if perf["gender"] in PERFORMER_IGNOREGENDER:
                continue
        perf_list.append(perf["name"])
    if len(perf_list) > PERFORMER_LIMIT:
        log.LogInfo("More than {} performer(s). Ignoring $performer".format(PERFORMER_LIMIT))
        perf_list = []
    scene_information["performer"] = PERFORMER_SPLITCHAR.join(perf_list)

# Grab Studio name
if STASH_SCENE.get("studio"):
    if SQUEEZE_STUDIO_NAMES:
        scene_information["studio"] = STASH_SCENE["studio"]["name"].replace(' ', '')
    else:
        scene_information["studio"] = STASH_SCENE["studio"]["name"]
    scene_information["studio_family"] = scene_information["studio"]
    # Grab Parent name
    if STASH_SCENE["studio"].get("parent_studio"):
        if SQUEEZE_STUDIO_NAMES:
            scene_information["parent_studio"] = STASH_SCENE["studio"]["parent_studio"]["name"].replace(' ', '')
        else:
            scene_information["parent_studio"] = STASH_SCENE["studio"]["parent_studio"]["name"]
        scene_information["studio_family"] = scene_information["parent_studio"]

# Grab Tags
if STASH_SCENE.get("tags"):
    tag_list = []
    for tag in STASH_SCENE["tags"]:
        # ignore tag in blacklist
        if tag["name"] in TAGS_BLACKLIST:
            continue
        # check if there is a whilelist
        if len(TAGS_WHITELIST) > 0:
            if tag["name"] in TAGS_WHITELIST:
                tag_list.append(tag["name"])
        else:
            tag_list.append(tag["name"])
    scene_information["tags"] = TAGS_SPLITCHAR.join(tag_list)

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

# Grab Video and Audio codec
scene_information["video_codec"] = STASH_SCENE["file"]["video_codec"].upper()
scene_information["audio_codec"] = STASH_SCENE["file"]["audio_codec"].upper()

if scene_information.get("date"):
    scene_information["year"] = scene_information["date"][0:4]
    scene_information["twodigityear"] = scene_information["date"][2:4]
    scene_information["month"] = scene_information["date"][5:7]
    scene_information["day"] = scene_information["date"][8:10]

if FIELD_WHITESPACE_SEP:
    for key, value in scene_information.items():
        if type(value) is str:
            scene_information[key] = value.replace(" ", FIELD_WHITESPACE_SEP)
        elif type(value) is list:
            scene_information[key] = [x.replace(" ", FIELD_WHITESPACE_SEP) for x in value]

log.LogDebug("[{}] Scene information: {}".format(FRAGMENT_SCENE_ID, scene_information))


# Create the new filename
new_filename = makeFilename(scene_information, filename_template) + file_extension
if FILENAME_LOWER:
    new_filename = new_filename.lower()

# Remove illegal character for Windows
new_filename = re.sub('[\\/:"*?<>|]+', '', new_filename)
if FILENAME_REMOVECHARACTER:
    new_filename = re.sub('[{}]+'.format(FILENAME_REMOVECHARACTER), '', new_filename)

# Trying to remove non standard character
if MODULE_UNIDECODE and UNICODE_USE:
    new_filename = unidecode.unidecode(new_filename, errors='preserve')
else:
    # Using typewriter for Apostrophe
    new_filename = re.sub("[’‘”“]+", "'", new_filename)

# Replace the old filename by the new in the filepath
new_path = current_path.rstrip(current_filename) + new_filename

# Trying to prevent error with long paths for Win10
# https://docs.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation?tabs=cmd
if len(new_path) > 240 and not IGNORE_PATH_LENGTH:
    log.LogWarning("Resulting Path is too long ({})...".format(len(new_path)))
    for word in ORDER_SHORTFIELD:
        if word not in filename_template:
            continue
        filename_template = re.sub(r'\{}[-\s_]*'.format(word), '', filename_template).strip()
        log.LogDebug("Removing field: {}".format(word))
        new_filename = makeFilename(scene_information, filename_template) + file_extension
        new_path = current_path.rstrip(current_filename) + new_filename
        if len(new_path) < 240:
            log.LogInfo("Reduced filename to: {}".format(new_filename))
            break
    if len(new_path) > 240:
        exit_plugin(err="Can't shorten path, operation aborted.")

#log.LogDebug("Filename: {} -> {}".format(current_filename,new_filename))
#log.LogDebug("Path: {} -> {}".format(current_path,new_path))

if (new_path == current_path):
    exit_plugin("Filename already ok. ({})".format(current_filename))

if ALT_DIFF_DISPLAY:
    find_diff_text(current_filename, new_filename)
else:
    log.LogDebug("[OLD] Filename: {}".format(current_filename))
    log.LogDebug("[NEW] Filename: {}".format(new_filename))

if DRY_RUN:
    exit_plugin("Dry run")

# Connect to the DB
try:
    sqliteConnection = sqlite3.connect(STASH_DATABASE)
    cursor = sqliteConnection.cursor()
    log.LogDebug("Python successfully connected to SQLite")
except sqlite3.Error as error:
    exit_plugin(err="FATAL SQLITE Error: {}".format(error))

# Looking for duplicate path
cursor.execute("SELECT id FROM scenes WHERE path LIKE ? AND NOT id=?;", ["%" + current_directory + "_" + new_filename, FRAGMENT_SCENE_ID])
dupl_check = cursor.fetchall()
if len(dupl_check) > 0:
    for dupl_row in dupl_check:
        log.LogError("Identical path: [{}]".format(dupl_row[0]))
    exit_plugin(err="Duplicate path detected, check log!")
# Looking for duplicate filename
cursor.execute("SELECT id FROM scenes WHERE path LIKE ? AND NOT id=?;", ["%" + new_filename, FRAGMENT_SCENE_ID])
dupl_check = cursor.fetchall()
if len(dupl_check) > 0:
    for dupl_row in dupl_check:
        log.LogWarning("Duplicate filename: [{}]".format(dupl_row[0]))

# OS Rename
if os.path.isfile(current_path):
    try:
        os.rename(current_path, new_path)
    except PermissionError as err:
        if "[WinError 32]" in str(err) and MODULE_PSUTIL:
            log.LogWarning("A process is using this file (Probably FFMPEG), trying to find it ...")
            # Find which process accesses the file, it's ffmpeg for sure...
            process_use = has_handle(current_path, PROCESS_ALLRESULT)
            if process_use:
                # Terminate the process then try again to rename
                log.LogDebug("Process that uses this file: {}".format(process_use))
                if PROCESS_KILL:
                    p = psutil.Process(process_use.pid)
                    p.terminate()
                    p.wait(10)
                    # If process is not terminated, this will create an error again.
                    os.rename(current_path, new_path)
                else:
                    exit_plugin(err="A process prevents renaming the file.")
        else:
            log.LogError(err)
            sys.exit()
    if os.path.isfile(new_path):
        log.LogInfo("[OS] File Renamed!")
        if LOGFILE:
            with open(LOGFILE, 'a', encoding='utf-8') as f:
                f.write("{}|{}|{}\n".format(FRAGMENT_SCENE_ID, current_path, new_path))
    else:
        # I don't think it's possible.
        exit_plugin(err="[OS] Failed to rename the file ? {}".format(new_path))
else:
    exit_plugin(err="[OS] File doesn't exist in your Disk/Drive ({})".format(current_path))

# Database rename
cursor.execute("UPDATE scenes SET path=? WHERE id=?;", [new_path, FRAGMENT_SCENE_ID])
sqliteConnection.commit()
# Close DB
cursor.close()
sqliteConnection.close()
log.LogInfo("[SQLITE] Database updated and closed!")

if ASSOCIATED_EXT:
    for ext in ASSOCIATED_EXT:
        p = os.path.splitext(current_path)[0] + "." + ext
        p_new = os.path.splitext(new_path)[0] + "." + ext
        if os.path.isfile(p):
            try:
                os.rename(p, p_new)
            except Exception as err:
                log.LogError("Something prevents renaming this file '{}' - err: {}".format(p, err))
                continue
        if os.path.isfile(p_new):
            log.LogInfo("[OS] Associate file renamed ({})".format(p_new))
            if LOGFILE:
                try:
                    with open(LOGFILE, 'a', encoding='utf-8') as f:
                        f.write("{}|{}|{}\n".format(FRAGMENT_SCENE_ID, p, p_new))
                except Exception as err:
                    os.rename(p_new, p)
                    log.LogError("Restoring the original name, error writing the logfile: {}".format(err))
exit_plugin("Successful!")
