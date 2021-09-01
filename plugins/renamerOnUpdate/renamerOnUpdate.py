import json
import os
import re
import sqlite3
import sys

import requests

import log

log.LogDebug("--Starting Hook 'Update' Plugin--")

FRAGMENT = json.loads(sys.stdin.read())
FRAGMENT_SERVER = FRAGMENT["server_connection"]
FRAGMENT_SCENE_ID = FRAGMENT["args"]["hookContext"]["id"]

# File to save what is renamed, so it could be useful to revert what you done. 
# Look like: IDSCENE|OLD_FILENAME|NEW_FILENAME
# Blank or None if you don't want this file, or a working path like this: C:\Users\Winter\.stash\plugins\Hooks\rename_log.txt
STASH_LOGFILE = r""

# ! You have other things to change at line 368-385 !

def callGraphQL(query, variables=None):
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
    if FRAGMENT_SERVER.get('Domain'):
        graphql_domain = FRAGMENT_SERVER['Domain']
    else:
        graphql_domain = 'localhost'
    # Stash GraphQL endpoint
    graphql_url = graphql_scheme + "://" + \
        graphql_domain + ":" + str(graphql_port) + "/graphql"

    json = {'query': query}
    if variables is not None:
        json['variables'] = variables
    response = requests.post(graphql_url, json=json,
                             headers=graphql_headers, cookies=graphql_cookies)
    if response.status_code == 200:
        result = response.json()
        if result.get("error"):
            for error in result["error"]["errors"]:
                raise Exception("GraphQL error: {}".format(error))
        if result.get("data"):
            return result.get("data")
    elif response.status_code == 401:
        sys.exit("HTTP Error 401, Unauthorised.")
    else:
        raise ConnectionError("GraphQL query failed:{} - {}. Query: {}. Variables: {}".format(
            response.status_code, response.content, query, variables))


def graphql_getscene(scene_id):
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
        paths {
            screenshot
            preview
            stream
            webp
            vtt
            chapters_vtt
            funscript
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
        image_path
        stash_ids {
            endpoint
            stash_id
        }
        parent_studio {
            id
            name
        }
        details
        rating
    }
    fragment MovieData on Movie {
        id
        checksum
        name
        aliases
        duration
        date
        rating
        director
        studio {
            ...SlimStudioData
        }
        synopsis
        url
        front_image_path
        back_image_path
        scene_count
    }
    fragment SlimTagData on Tag {
        id
        name
        aliases
        image_path
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
        image_path
        scene_count
        image_count
        gallery_count
        tags {
            ...SlimTagData
        }
        stash_ids {
            stash_id
            endpoint
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


def graphql_configuration():
    query = """
        query Configuration {
            configuration {
                ...ConfigData
            }
        }
        fragment ConfigData on ConfigResult {
            general {
                ...ConfigGeneralData
            }
            interface {
                ...ConfigInterfaceData
            }
            dlna {
                ...ConfigDLNAData
            }
        }
        fragment ConfigGeneralData on ConfigGeneralResult {
            stashes {
                path
                excludeVideo
                excludeImage
            }
            databasePath
            generatedPath
            configFilePath
            cachePath
            calculateMD5
            videoFileNamingAlgorithm
            parallelTasks
            previewAudio
            previewSegments
            previewSegmentDuration
            previewExcludeStart
            previewExcludeEnd
            previewPreset
            maxTranscodeSize
            maxStreamingTranscodeSize
            apiKey
            username
            password
            maxSessionAge
            logFile
            logOut
            logLevel
            logAccess
            createGalleriesFromFolders
            videoExtensions
            imageExtensions
            galleryExtensions
            excludes
            imageExcludes
            scraperUserAgent
            scraperCertCheck
            scraperCDPPath
            stashBoxes {
                name
                endpoint
                api_key
            }
        }
        fragment ConfigInterfaceData on ConfigInterfaceResult {
            menuItems
            soundOnPreview
            wallShowTitle
            wallPlayback
            maximumLoopDuration
            autostartVideo
            showStudioAsText
            css
            cssEnabled
            language
            slideshowDelay
            handyKey
        }
        fragment ConfigDLNAData on ConfigDLNAResult {
            serverName
            enabled
            whitelistedIPs
            interfaces
        }
    """
    result = callGraphQL(query)
    return result.get('configuration')


def makeFilename(scene_information, query):
    # Query exemple:
    # Available: $date $performer $title $studio $height $parent_studio
    # $title                                    == SSNI-000.mp4
    # $date $title                              == 2017-04-27 Oni Chichi.mp4
    # $date $title $height                      == 2017-04-27 Oni Chichi 1080p.mp4
    # $date $performer - $title [$studio]       == 2016-12-29 Eva Lovia - Her Fantasy Ball [Sneaky Sex].mp4
    # $parent_studio $date $performer - $title  == RealityKings 2016-12-29 Eva Lovia - Her Fantasy Ball.mp4
    new_filename = str(query)
    if "$date" in new_filename:
        if scene_information.get('date') == "" or scene_information.get('date') is None:
            new_filename = re.sub('\$date\s*', '', new_filename)
        else:
            new_filename = new_filename.replace("$date", scene_information["date"])

    if "$performer" in new_filename:
        if scene_information.get('performer') == "" or scene_information.get('performer') is None:
            new_filename = re.sub('\$performer\s*', '', new_filename)
        else:
            new_filename = new_filename.replace("$performer", scene_information["performer"])

    if "$title" in new_filename:
        if scene_information.get('title') == "" or scene_information.get('title') is None:
            new_filename = re.sub('\$title\s*', '', new_filename)
        else:
            new_filename = new_filename.replace("$title", scene_information["title"])

    if "$studio" in new_filename:
        if scene_information.get('studio') == "" or scene_information.get('studio') is None:
            new_filename = re.sub('\$studio\s*', '', new_filename)
        else:
            new_filename = new_filename.replace("$studio", scene_information["studio"])

    if "$parent_studio" in new_filename:
        if scene_information.get('parent_studio') == "" or scene_information.get('parent_studio') is None:
            new_filename = re.sub('\$parent_studio\s*', '', new_filename)
        else:
            new_filename = new_filename.replace("$parent_studio", scene_information["parent_studio"])

    if "$height" in new_filename:
        if scene_information.get('height') == "" or scene_information.get('height') is None:
            new_filename = re.sub('\$height\s*', '', new_filename)
        else:
            new_filename = new_filename.replace("$height", scene_information["height"])
    new_filename = re.sub('^\s*-\s*', '', new_filename)
    new_filename = re.sub('\s*-\s*$', '', new_filename)
    new_filename = re.sub('\[\W*]', '', new_filename)
    new_filename = re.sub('\s{2,}', ' ', new_filename)
    new_filename = new_filename.strip()
    return new_filename

def exit_plugin(msg=None, err=None):
    if msg is None and err is None:
        msg = "plugin ended"
    output_json = {"output": msg, "error": err}
    print(json.dumps(output_json))
    sys.exit()


scene_info = graphql_getscene(FRAGMENT_SCENE_ID)
stash_config = graphql_configuration()
stash_database = stash_config["general"]["databasePath"]
log.LogDebug("Scene ID: {}".format(FRAGMENT_SCENE_ID))
#log.LogDebug("Scene Info: {}".format(scene_info))
log.LogDebug("Database Path: {}".format(stash_database))
result_template = None
# -----------------------------------------------------------------
# Available: $date $performer $title $studio $height $parent_studio
# -----------------------------------------------------------------
# e.g.:
# $title                                    == SSNI-000.mp4
# $date $title                              == 2017-04-27 Oni Chichi.mp4
# $date $title $height                      == 2017-04-27 Oni Chichi 1080p.mp4
# $date $performer - $title [$studio]       == 2016-12-29 Eva Lovia - Her Fantasy Ball [Sneaky Sex].mp4
# $parent_studio $date $performer - $title  == Reality Kings 2016-12-29 Eva Lovia - Her Fantasy Ball.mp4
# -----------------------------------------------------------------
# START OF PERSONAL THINGS

# Different template depending of tag present in the scene.
if scene_info.get("tags"):
    for tag in scene_info["tags"]:
        if tag["name"] == "!1. Western":
            result_template = "$date $performer - $title [$studio]"
        if tag["name"] == "!1. JAV":
            result_template = "$title"
        if tag["name"] == "!1. Anime":
            result_template = "$date $title"
        if result_template:
            break

# IF YOU WANT TO FORCE A TEMPLATE FOR ANY FILE, UNCOMMENT BELOW
#result_template = "$date $title"

# END OF PERSONAL THINGS

if result_template is None:
    exit_plugin("No template for this file.")
else:
    log.LogDebug("Using this template: {}".format(result_template))

current_path = scene_info["path"]
file_extension = os.path.splitext(current_path)[1]
# Note: basename contains the extension
current_filename = os.path.basename(current_path)
current_directory = os.path.dirname(current_path)

# Grabbing things from Stash
scene_information = {}
# Grab Title (without extension if present)
if scene_info.get("title"):
    # Remove extension
    scene_information["title"] = re.sub(file_extension + '$', '', scene_info["title"])
# Grab Date
scene_information["date"] = scene_info.get("date")
# Grab Performer (Dani Daniels Riley Reid)
if scene_info.get("performers"):
    perf_list = ""
    if len(scene_info["performers"]) > 3:
        log.LogWarning("More than 3 performers.")
    else:
        for performer in scene_info["performers"]:
            if performer.get("name"):
                perf_list += performer["name"] + " "
            else:
                continue
        perf_list = perf_list.strip()
    scene_information["performer"] = perf_list
# Grab Studio name
if scene_info.get("studio"):
    scene_information["studio"] = scene_info["studio"].get("name")
    # Grab Parent name
    if scene_info["studio"].get("parent_studio"):
        scene_information["parent_studio"] = scene_info["studio"]["parent_studio"]["name"]
# Grab Height (720p,1080p,4k...)
if scene_info["file"]["height"] == '4320':
    scene_information["height"] = '8k'
else:
    if scene_info["file"]["height"] == '2160':
        scene_information["height"] = '4k'
    else:
        scene_information["height"] = "{}p".format(scene_info["file"]["height"])

log.LogDebug("[DEBUG] Scene information: {}".format(scene_information))
# Create the new filename
new_filename = makeFilename(scene_information, result_template) + file_extension

# Remove illegal character for Windows ('#' and ',' is not illegal you can remove it)
new_filename = re.sub('[\\/:"*?<>|#,]+', '', new_filename)
# Using typewriter for Apostrophe
new_filename = re.sub("[’‘]+", "'", new_filename)

# Replace the old filename by the new in the filepath
new_path = current_path.replace(current_filename,new_filename)
#new_path = re.sub('{}$'.format(current_filename), new_filename, current_path)

# Trying to prevent error with long path for Win10
# https://docs.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation?tabs=cmd
if len(new_path) > 240:
    log.LogWarning("The Path is too long...", new_path)
    # We only use the date and title to get a shorter file (eg: 2017-04-27 - Oni Chichi.mp4)
    if scene_info.get("date"):
        reducePath = len(current_directory + scene_info["title"] + scene_info["date"] + file_extension) + 3
    else:
        reducePath = len(current_directory + scene_info["title"] + file_extension) + 3
    if reducePath < 240:
        if scene_info.get("date"):
            new_filename = makeFilename(scene_information, "$date - $title") + file_extension
        else:
            new_filename = makeFilename(scene_information, "$title") + file_extension
        new_path = current_path.replace(current_filename,new_filename)
        #new_path = re.sub('{}$'.format(current_filename), new_filename, current_path)
        log.LogInfo("Reduced filename to: {}", new_filename)
    else:
        exit_plugin(err="Can't manage to reduce the path, operation aborted.")
log.LogDebug("Filename: {} -> {}".format(current_filename,new_filename))
log.LogDebug("Path: {} -> {}".format(current_path,new_path))

if (new_path == current_path):
    exit_plugin("Filename already correct.")

# Connect to the DB
try:
    sqliteConnection = sqlite3.connect(stash_database)
    cursor = sqliteConnection.cursor()
    log.LogDebug("Python successfully connected to SQLite\n")
except sqlite3.Error as error:
    exit_plugin(err="FATAL SQLITE Error: {}".format(error))

# Looking for duplicate filename
cursor.execute("SELECT id FROM scenes WHERE path LIKE ? AND NOT id=?;", ["%" + new_filename, FRAGMENT_SCENE_ID])
dupl_check = cursor.fetchall()
if len(dupl_check) > 0:
    for dupl_row in dupl_check:
        log.LogError("Same filename: [{}]".format(dupl_row[0]))
    exit_plugin(err="Duplicate filename detected, check log!")

# OS Rename
if (os.path.isfile(current_path) == True):
    os.rename(current_path, new_path)
    if (os.path.isfile(new_path) == True):
        log.LogInfo("[OS] File Renamed!")
        if STASH_LOGFILE:
            with open(STASH_LOGFILE, 'a', encoding='utf-8') as f:
                f.write("{}|{}|{}\n".format(FRAGMENT_SCENE_ID, current_path, new_path))
    else:
        exit_plugin(err="[OS] File failed to rename ? {}".format(new_path))
else:
    exit_plugin(err="[OS] File don't exist in your Disk/Drive ({})".format(current_path))

# Database rename
cursor.execute("UPDATE scenes SET path=? WHERE id=?;", [new_path, FRAGMENT_SCENE_ID])
# Close DB
sqliteConnection.commit()
cursor.close()
sqliteConnection.close()
log.LogInfo("[SQLITE] Database updated!")
exit_plugin("Successful!")
