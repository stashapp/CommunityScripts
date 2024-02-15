import difflib
import json
import os
import re
import shutil
import sqlite3
import sys
import time
import traceback
from datetime import datetime

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


try:
    import renamerOnUpdate_config as config
except Exception:
    import config
import log


DB_VERSION_FILE_REFACTOR = 32
DB_VERSION_SCENE_STUDIO_CODE = 38

DRY_RUN = config.dry_run
DRY_RUN_FILE = None

if config.log_file:
    DRY_RUN_FILE = os.path.join(
        os.path.dirname(config.log_file), "renamerOnUpdate_dryrun.txt"
    )

if DRY_RUN:
    if DRY_RUN_FILE and not config.dry_run_append:
        if os.path.exists(DRY_RUN_FILE):
            os.remove(DRY_RUN_FILE)
    log.LogInfo("Dry mode on")

START_TIME = time.time()
FRAGMENT = json.loads(sys.stdin.read())

FRAGMENT_SERVER = FRAGMENT["server_connection"]
PLUGIN_DIR = FRAGMENT_SERVER["PluginDir"]


PLUGIN_ARGS = FRAGMENT["args"].get("mode")

# log.LogDebug("{}".format(FRAGMENT))


def callGraphQL(query, variables=None):
    # Session cookie for authentication
    graphql_port = str(FRAGMENT_SERVER["Port"])
    graphql_scheme = FRAGMENT_SERVER["Scheme"]
    graphql_cookies = {"session": FRAGMENT_SERVER["SessionCookie"]["Value"]}
    graphql_headers = {
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "DNT": "1",
    }
    graphql_domain = FRAGMENT_SERVER["Host"]
    if graphql_domain == "0.0.0.0":
        graphql_domain = "localhost"
    # Stash GraphQL endpoint
    graphql_url = f"{graphql_scheme}://{graphql_domain}:{graphql_port}/graphql"

    json = {"query": query}
    if variables is not None:
        json["variables"] = variables
    try:
        response = requests.post(
            graphql_url,
            json=json,
            headers=graphql_headers,
            cookies=graphql_cookies,
            timeout=20,
        )
    except Exception as e:
        exit_plugin(err=f"[FATAL] Error with the graphql request {e}")
    if response.status_code == 200:
        result = response.json()
        if result.get("error"):
            for error in result["error"]["errors"]:
                raise Exception(f"GraphQL error: {error}")
            return None
        if result.get("data"):
            return result.get("data")
    elif response.status_code == 401:
        exit_plugin(err="HTTP Error 401, Unauthorised.")
    else:
        raise ConnectionError(
            f"GraphQL query failed: {response.status_code} - {response.content}"
        )


def graphql_getScene(scene_id):
    query = (
        """
    query FindScene($id: ID!, $checksum: String) {
        findScene(id: $id, checksum: $checksum) {
            ...SceneData
        }
    }
    fragment SceneData on Scene {
        id
        title
        date
        rating100
        stash_ids {
            endpoint
            stash_id
        }
        organized"""
        + FILE_QUERY
        + """
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
            favorite
            rating100
            stash_ids{
                endpoint
                stash_id
            }
        }
        movies {
            movie {
                name
                date
            }
            scene_index
        }
    }
    """
    )
    variables = {"id": scene_id}
    result = callGraphQL(query, variables)
    return result.get("findScene")


# used for bulk
def graphql_findScene(perPage, direc="DESC") -> dict:
    query = (
        """
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
        title
        date
        rating100
        organized
        stash_ids {
            endpoint
            stash_id
        }
    """
        + FILE_QUERY
        + """
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
            favorite
            rating100
            stash_ids{
                endpoint
                stash_id
            }
        }
        movies {
            movie {
                name
                date
            }
            scene_index
        }
    }
    """
    )
    # ASC DESC
    variables = {
        "filter": {
            "direction": direc,
            "page": 1,
            "per_page": perPage,
            "sort": "updated_at",
        }
    }
    result = callGraphQL(query, variables)
    return result.get("findScenes")


# used to find duplicate
def graphql_findScenebyPath(path, modifier) -> dict:
    query = """
    query FindScenes($filter: FindFilterType, $scene_filter: SceneFilterType) {
        findScenes(filter: $filter, scene_filter: $scene_filter) {
            count
            scenes {
                id
                title
            }
        }
    }
    """
    # ASC DESC
    variables = {
        "filter": {"direction": "ASC", "page": 1, "per_page": 40, "sort": "updated_at"},
        "scene_filter": {"path": {"modifier": modifier, "value": path}},
    }
    result = callGraphQL(query, variables)
    return result.get("findScenes")


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
    return result.get("configuration")


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
    variables = {"id": studio_id}
    result = callGraphQL(query, variables)
    return result.get("findStudio")


def graphql_removeScenesTag(id_scenes: list, id_tags: list):
    query = """
    mutation BulkSceneUpdate($input: BulkSceneUpdateInput!) {
        bulkSceneUpdate(input: $input) {
            id
        }
    }
    """
    variables = {
        "input": {"ids": id_scenes, "tag_ids": {"ids": id_tags, "mode": "REMOVE"}}
    }
    result = callGraphQL(query, variables)
    return result


def graphql_getBuild():
    query = """
        {
            systemStatus {
                databaseSchema
            }
        }
    """
    result = callGraphQL(query)
    return result["systemStatus"]["databaseSchema"]


def find_diff_text(a: str, b: str):
    addi = minus = stay = ""
    minus_ = addi_ = 0
    for _, s in enumerate(difflib.ndiff(a, b)):
        if s[0] == " ":
            stay += s[-1]
            minus += "*"
            addi += "*"
        elif s[0] == "-":
            minus += s[-1]
            minus_ += 1
        elif s[0] == "+":
            addi += s[-1]
            addi_ += 1
    if minus_ > 20 or addi_ > 20:
        log.LogDebug(f"Diff Checker: +{addi_}; -{minus_};")
        log.LogDebug(f"OLD: {a}")
        log.LogDebug(f"NEW: {b}")
    else:
        log.LogDebug(
            f"Original: {a}\n- Charac: {minus}\n+ Charac: {addi}\n  Result: {b}"
        )
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
    try:
        with open(config.__file__, "r", encoding="utf8") as file:
            config_lines = file.readlines()
        with open(config.__file__, "w", encoding="utf8") as file_w:
            for line in config_lines:
                if len(line.split("=")) > 1:
                    if name == line.split("=")[0].strip():
                        file_w.write(f"{name} = {state}\n")
                        found += 1
                        continue
                file_w.write(line)
    except PermissionError as err:
        log.LogError(f"You don't have the permission to edit config.py ({err})")
    return found


def check_longpath(path: str):
    # Trying to prevent error with long paths for Win10
    # https://docs.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation?tabs=cmd
    if len(path) > 240 and not IGNORE_PATH_LENGTH:
        log.LogError(
            f"The path is too long ({len(path)} > 240). You can look at 'order_field'/'ignore_path_length' in config."
        )
        return 1


def get_template_filename(scene: dict):
    template = None
    # Change by Studio
    if scene.get("studio") and config.studio_templates:
        template_found = False
        current_studio = scene.get("studio")
        if config.studio_templates.get(current_studio["name"]):
            template = config.studio_templates[current_studio["name"]]
            template_found = True
        # by first Parent found
        while current_studio.get("parent_studio") and not template_found:
            if config.studio_templates.get(
                current_studio.get("parent_studio").get("name")
            ):
                template = config.studio_templates[
                    current_studio["parent_studio"]["name"]
                ]
                template_found = True
            current_studio = graphql_getStudio(
                current_studio.get("parent_studio")["id"]
            )

    # Change by Tag
    tags = [x["name"] for x in scene["tags"]]
    if scene.get("tags") and config.tag_templates:
        for match, job in config.tag_templates.items():
            if match in tags:
                template = job
                break
    return template


def get_template_path(scene: dict):
    template = {"destination": "", "option": [], "opt_details": {}}
    # Change by Path
    if config.p_path_templates:
        for match, job in config.p_path_templates.items():
            if match in scene["path"]:
                template["destination"] = job
                break

    # Change by Studio
    if scene.get("studio") and config.p_studio_templates:
        if config.p_studio_templates.get(scene["studio"]["name"]):
            template["destination"] = config.p_studio_templates[scene["studio"]["name"]]
        # by Parent
        if scene["studio"].get("parent_studio"):
            if config.p_studio_templates.get(scene["studio"]["name"]):
                template["destination"] = config.p_studio_templates[
                    scene["studio"]["name"]
                ]

    # Change by Tag
    tags = [x["name"] for x in scene["tags"]]
    if scene.get("tags") and config.p_tag_templates:
        for match, job in config.p_tag_templates.items():
            if match in tags:
                template["destination"] = job
                break

    if scene.get("tags") and config.p_tag_option:
        for tag in scene["tags"]:
            if config.p_tag_option.get(tag["name"]):
                opt = config.p_tag_option[tag["name"]]
                template["option"].extend(opt)
                if "clean_tag" in opt:
                    if template["opt_details"].get("clean_tag"):
                        template["opt_details"]["clean_tag"].append(tag["id"])
                    else:
                        template["opt_details"] = {"clean_tag": [tag["id"]]}
    if not scene["organized"] and PATH_NON_ORGANIZED:
        template["destination"] = PATH_NON_ORGANIZED
    return template


def sort_performer(lst_use: list, lst_app=[]):
    for p in lst_use:
        lst_use[p].sort()
    for p in lst_use.values():
        for n in p:
            if n not in lst_app:
                lst_app.append(n)
    return lst_app


def sort_rating(d: dict):
    new_d = {}
    for i in sorted(d.keys(), reverse=True):
        new_d[i] = d[i]
    return new_d


def extract_info(scene: dict, template: None):
    # Grabbing things from Stash
    scene_information = {}

    scene_information["current_path"] = str(scene["path"])
    # note: contain the dot (.mp4)
    scene_information["file_extension"] = os.path.splitext(
        scene_information["current_path"]
    )[1]
    # note: basename contains the extension
    scene_information["current_filename"] = os.path.basename(
        scene_information["current_path"]
    )
    scene_information["current_directory"] = os.path.dirname(
        scene_information["current_path"]
    )
    scene_information["oshash"] = scene.get("oshash")
    scene_information["checksum"] = scene.get("checksum")
    scene_information["studio_code"] = scene.get("code")

    if scene.get("stash_ids"):
        # todo support other db that stashdb ?
        scene_information["stashid_scene"] = scene["stash_ids"][0]["stash_id"]

    if template.get("path"):
        if "^*" in template["path"]["destination"]:
            template["path"]["destination"] = template["path"]["destination"].replace(
                "^*", scene_information["current_directory"]
            )
        scene_information["template_split"] = os.path.normpath(
            template["path"]["destination"]
        ).split(os.sep)
    scene_information["current_path_split"] = os.path.normpath(
        scene_information["current_path"]
    ).split(os.sep)

    if FILENAME_ASTITLE and not scene.get("title"):
        scene["title"] = scene_information["current_filename"]

    # Grab Title (without extension if present)
    if scene.get("title"):
        # Removing extension if present in title
        scene_information["title"] = re.sub(
            rf"{scene_information['file_extension']}$", "", scene["title"]
        )
        if PREPOSITIONS_REMOVAL:
            for word in PREPOSITIONS_LIST:
                scene_information["title"] = re.sub(
                    rf"^{word}[\s_-]", "", scene_information["title"]
                )

    # Grab Date
    scene_information["date"] = scene.get("date")
    if scene_information["date"]:
        date_scene = datetime.strptime(scene_information["date"], r"%Y-%m-%d")
        scene_information["date_format"] = datetime.strftime(
            date_scene, config.date_format
        )

    # Grab Duration
    scene_information["duration"] = scene["file"]["duration"]
    if config.duration_format:
        scene_information["duration"] = time.strftime(
            config.duration_format, time.gmtime(scene_information["duration"])
        )
    else:
        scene_information["duration"] = str(scene_information["duration"])

    # Grab Rating
    if scene.get("rating100"):
        scene_information["rating"] = RATING_FORMAT.format(scene["rating100"])

    # Grab Performer
    scene_information["performer_path"] = None
    if scene.get("performers"):
        perf_list = []
        perf_list_stashid = []
        perf_rating = {"0": []}
        perf_favorite = {"yes": [], "no": []}
        for perf in scene["performers"]:
            if perf.get("gender"):
                if perf["gender"] in PERFORMER_IGNOREGENDER:
                    continue
            elif "UNDEFINED" in PERFORMER_IGNOREGENDER:
                continue
            # path related
            if template.get("path"):
                if "inverse_performer" in template["path"]["option"]:
                    perf["name"] = re.sub(
                        r"([a-zA-Z]+)(\s)([a-zA-Z]+)", r"\3 \1", perf["name"]
                    )
            perf_list.append(perf["name"])
            if perf.get("rating100"):
                if perf_rating.get(str(perf["rating100"])) is None:
                    perf_rating[str(perf["rating100"])] = []
                perf_rating[str(perf["rating100"])].append(perf["name"])
            else:
                perf_rating["0"].append(perf["name"])
            if perf.get("favorite"):
                perf_favorite["yes"].append(perf["name"])
            else:
                perf_favorite["no"].append(perf["name"])
            # if the path already contains the name we keep this one
            if (
                perf["name"] in scene_information["current_path_split"]
                and scene_information.get("performer_path") is None
                and PATH_KEEP_ALRPERF
            ):
                scene_information["performer_path"] = perf["name"]
                log.LogDebug(
                    f"[PATH] Keeping the current name of the performer '{perf['name']}'"
                )
        perf_rating = sort_rating(perf_rating)
        # sort performer
        if PERFORMER_SORT == "rating":
            # sort alpha
            perf_list = sort_performer(perf_rating)
        elif PERFORMER_SORT == "favorite":
            perf_list = sort_performer(perf_favorite)
        elif PERFORMER_SORT == "mix":
            perf_list = []
            for p in perf_favorite:
                perf_favorite[p].sort()
            for p in perf_favorite.get("yes"):
                perf_list.append(p)
            perf_list = sort_performer(perf_rating, perf_list)
        elif PERFORMER_SORT == "mixid":
            perf_list = []
            for p in perf_favorite.get("yes"):
                perf_list.append(p)
            for p in perf_rating.values():
                for n in p:
                    if n not in perf_list:
                        perf_list.append(n)
        elif PERFORMER_SORT == "name":
            perf_list.sort()
        if not scene_information["performer_path"] and perf_list:
            scene_information["performer_path"] = perf_list[0]
        if len(perf_list) > PERFORMER_LIMIT:
            if not PERFORMER_LIMIT_KEEP:
                log.LogInfo(
                    f"More than {PERFORMER_LIMIT} performer(s). Ignoring $performer"
                )
                perf_list = []
            else:
                log.LogInfo(f"Limited the amount of performer to {PERFORMER_LIMIT}")
                perf_list = perf_list[0:PERFORMER_LIMIT]
        scene_information["performer"] = PERFORMER_SPLITCHAR.join(perf_list)
        if perf_list:
            for p in perf_list:
                for perf in scene["performers"]:
                    # todo support other db that stashdb ?
                    if p == perf["name"] and perf.get("stash_ids"):
                        perf_list_stashid.append(perf["stash_ids"][0]["stash_id"])
                        break
            scene_information["stashid_performer"] = PERFORMER_SPLITCHAR.join(
                perf_list_stashid
            )
        if not PATH_ONEPERFORMER:
            scene_information["performer_path"] = PERFORMER_SPLITCHAR.join(perf_list)
    elif PATH_NOPERFORMER_FOLDER:
        scene_information["performer_path"] = "NoPerformer"

    # Grab Studio name
    if scene.get("studio"):
        if SQUEEZE_STUDIO_NAMES:
            scene_information["studio"] = scene["studio"]["name"].replace(" ", "")
        else:
            scene_information["studio"] = scene["studio"]["name"]
        scene_information["studio_family"] = scene_information["studio"]
        studio_hierarchy = [scene_information["studio"]]
        # Grab Parent name
        if scene["studio"].get("parent_studio"):
            if SQUEEZE_STUDIO_NAMES:
                scene_information["parent_studio"] = scene["studio"]["parent_studio"][
                    "name"
                ].replace(" ", "")
            else:
                scene_information["parent_studio"] = scene["studio"]["parent_studio"][
                    "name"
                ]
            scene_information["studio_family"] = scene_information["parent_studio"]

            studio_p = scene["studio"]
            while studio_p.get("parent_studio"):
                studio_p = graphql_getStudio(studio_p["parent_studio"]["id"])
                if studio_p:
                    if SQUEEZE_STUDIO_NAMES:
                        studio_hierarchy.append(studio_p["name"].replace(" ", ""))
                    else:
                        studio_hierarchy.append(studio_p["name"])
            studio_hierarchy.reverse()
        scene_information["studio_hierarchy"] = studio_hierarchy
    # Grab Tags
    if scene.get("tags"):
        tag_list = []
        for tag in scene["tags"]:
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
    scene_information["bit_rate"] = str(
        round(int(scene["file"]["bit_rate"]) / 1000000, 2)
    )
    scene_information["resolution"] = "SD"
    scene_information["height"] = f"{scene['file']['height']}p"
    if scene["file"]["height"] >= 720:
        scene_information["resolution"] = "HD"
    if scene["file"]["height"] >= 2160:
        scene_information["height"] = "4k"
        scene_information["resolution"] = "UHD"
    if scene["file"]["height"] >= 2880:
        scene_information["height"] = "5k"
    if scene["file"]["height"] >= 3384:
        scene_information["height"] = "6k"
    if scene["file"]["height"] >= 4320:
        scene_information["height"] = "8k"
    # For Phone ?
    if scene["file"]["height"] > scene["file"]["width"]:
        scene_information["resolution"] = "VERTICAL"

    if scene.get("movies"):
        scene_information["movie_title"] = scene["movies"][0]["movie"]["name"]
        if scene["movies"][0]["movie"].get("date"):
            scene_information["movie_year"] = scene["movies"][0]["movie"]["date"][0:4]
        if scene["movies"][0].get("scene_index"):
            scene_information["movie_index"] = scene["movies"][0]["scene_index"]
            scene_information["movie_scene"] = (
                f"scene {scene_information['movie_index']}"
            )

    # Grab Video and Audio codec
    scene_information["video_codec"] = scene["file"]["video_codec"].upper()
    scene_information["audio_codec"] = scene["file"]["audio_codec"].upper()

    if scene_information.get("date"):
        scene_information["year"] = scene_information["date"][0:4]

    if FIELD_WHITESPACE_SEP:
        for key, value in scene_information.items():
            if key in [
                "current_path",
                "current_filename",
                "current_directory",
                "current_path_split",
                "template_split",
            ]:
                continue
            if type(value) is str:
                scene_information[key] = value.replace(" ", FIELD_WHITESPACE_SEP)
            elif type(value) is list:
                scene_information[key] = [
                    x.replace(" ", FIELD_WHITESPACE_SEP) for x in value
                ]
    return scene_information


def replace_text(text: str):
    for old, new in FILENAME_REPLACEWORDS.items():
        if type(new) is str:
            new = [new]
        if len(new) > 1:
            if new[1] == "regex":
                tmp = re.sub(old, new[0], text)
                if tmp != text:
                    log.LogDebug(f"Regex matched: {text} -> {tmp}")
            else:
                if new[1] == "word":
                    tmp = re.sub(rf"([\s_-])({old})([\s_-])", f"\\1{new[0]}\\3", text)
                elif new[1] == "any":
                    tmp = text.replace(old, new[0])
                if tmp != text:
                    log.LogDebug(f"'{old}' changed with '{new[0]}'")
        else:
            tmp = re.sub(rf"([\s_-])({old})([\s_-])", f"\\1{new[0]}\\3", text)
            if tmp != text:
                log.LogDebug(f"'{old}' changed with '{new[0]}'")
        text = tmp
    return tmp


def cleanup_text(text: str):
    text = re.sub(r"\(\W*\)|\[\W*\]|{[^a-zA-Z0-9]*}", "", text)
    text = re.sub(r"[{}]", "", text)
    text = remove_consecutive_nonword(text)
    return text.strip(" -_.")


def remove_consecutive_nonword(text: str):
    for _ in range(0, 10):
        m = re.findall(r"(\W+)\1+", text)
        if m:
            text = re.sub(r"(\W+)\1+", r"\1", text)
        else:
            break
    return text


def field_replacer(text: str, scene_information: dict):
    field_found = re.findall(r"\$\w+", text)
    result = text
    title = None
    replaced_word = ""
    if field_found:
        field_found.sort(key=len, reverse=True)
    for i in range(0, len(field_found)):
        f = field_found[i].replace("$", "").strip("_")
        # If $performer is before $title, prevent having duplicate text.
        if (
            f == "performer"
            and len(field_found) > i + 1
            and scene_information.get("performer")
        ):
            if (
                field_found[i + 1] == "$title"
                and scene_information.get("title")
                and PREVENT_TITLE_PERF
            ):
                if re.search(
                    f"^{scene_information['performer'].lower()}",
                    scene_information["title"].lower(),
                ):
                    log.LogDebug(
                        "Ignoring the performer field because it's already in start of title"
                    )
                    result = result.replace("$performer", "")
                    continue
        replaced_word = scene_information.get(f)
        if not replaced_word:
            replaced_word = ""
        if FIELD_REPLACER.get(f"${f}"):
            replaced_word = replaced_word.replace(
                FIELD_REPLACER[f"${f}"]["replace"], FIELD_REPLACER[f"${f}"]["with"]
            )
        if f == "title":
            title = replaced_word.strip()
            continue
        if replaced_word == "":
            result = result.replace(field_found[i], replaced_word)
        else:
            result = result.replace(f"${f}", replaced_word)
    return result, title


def makeFilename(scene_information: dict, query: str) -> str:
    new_filename = str(query)
    r, t = field_replacer(new_filename, scene_information)
    if FILENAME_REPLACEWORDS:
        r = replace_text(r)
    if not t:
        r = r.replace("$title", "")
    r = cleanup_text(r)
    if t:
        r = r.replace("$title", t)
    # Replace spaces with splitchar
    r = r.replace(" ", FILENAME_SPLITCHAR)
    return r


def makePath(scene_information: dict, query: str) -> str:
    new_filename = str(query)
    new_filename = new_filename.replace("$performer", "$performer_path")
    r, t = field_replacer(new_filename, scene_information)
    if not t:
        r = r.replace("$title", "")
    r = cleanup_text(r)
    if t:
        r = r.replace("$title", t)
    return r


def capitalizeWords(s: str) -> str:
    """
    Converts a filename to title case. Capitalizes all words except for certain
    conjunctions, prepositions, and articles, unless they are the first or
    last word of a segment of the filename. Recognizes standard apostrophes, right
    single quotation marks (U+2019), and left single quotation marks (U+2018) within words.

    Ignores all caps words and abbreviations, e.g., MILF, BBW, VR, PAWGs.
    Ignores words with mixed case, e.g., LaSirena69, VRCosplayX, xHamster.
    Ignores resolutions, e.g., 1080p, 4k.

    Args:
        s (str): The string to capitalize.

    Returns:
        str: The capitalized string.

    Raises:
        ValueError: If the input is not a string.

    About the regex:
        The first \b marks the starting word boundary.
        [A-Z]? allows for an optional initial uppercase letter.
        [a-z\'\u2019\u2018]+ matches one or more lowercase letters, apostrophes, right single quotation marks, or left single quotation marks.
            If a word contains multiple uppercase letters, it does not match.
        The final \b marks the ending word boundary, ensuring the expression matches whole words.
    """
    if not isinstance(s, str):
        raise ValueError("Input must be a string.")

    # Function to capitalize words based on their position and value.
    def process_word(match):
        word = match.group(0)
        preceding_char, following_char = None, None

        # List of words to avoid capitalizing if found between other words.
        exceptions = {"and", "of", "the"}

        # Find the nearest non-space character before the current word
        if match.start() > 0:
            for i in range(match.start() - 1, -1, -1):
                if not match.string[i].isspace():
                    preceding_char = match.string[i]
                    break

        # Find the nearest non-space character after the current word
        if match.end() < len(s):
            for i in range(match.end(), len(s)):
                if not match.string[i].isspace():
                    following_char = match.string[i]
                    break

        # Determine capitalization based on the position and the exception rules
        if (
            match.start() == 0
            or match.end() == len(s)
            or word.lower() not in exceptions
            or (preceding_char and not preceding_char.isalnum())
            or (following_char and not following_char.isalnum())
        ):
            return word.capitalize()
        else:
            return word.lower()

    # Apply the regex pattern and the process_word function.
    return re.sub(r"\b[A-Z]?[a-z\'\u2019\u2018]+\b", process_word, s)


def create_new_filename(scene_info: dict, template: str):
    new_filename = (
        makeFilename(scene_info, template)
        + DUPLICATE_SUFFIX[scene_info["file_index"]]
        + scene_info["file_extension"]
    )
    if FILENAME_LOWER:
        new_filename = new_filename.lower()
    if FILENAME_TITLECASE:
        new_filename = capitalizeWords(new_filename)
    # Remove illegal character for Windows
    new_filename = re.sub('[\\/:"*?<>|]+', "", new_filename)

    if FILENAME_REMOVECHARACTER:
        new_filename = re.sub(f"[{FILENAME_REMOVECHARACTER}]+", "", new_filename)

    # Trying to remove non standard character
    if MODULE_UNIDECODE and UNICODE_USE:
        new_filename = unidecode.unidecode(new_filename, errors="preserve")
    else:
        # Using typewriter for Apostrophe
        new_filename = re.sub("[’‘”“]+", "'", new_filename)
    return new_filename


def remove_consecutive(liste: list):
    new_list = []
    for i in range(0, len(liste)):
        if i != 0 and liste[i] == liste[i - 1]:
            continue
        new_list.append(liste[i])
    return new_list


def create_new_path(scene_info: dict, template: dict):
    # Create the new path
    # Split the template path
    path_split = scene_info["template_split"]
    path_list = []
    for part in path_split:
        if ":" in part and path_split[0]:
            path_list.append(part)
        elif part == "$studio_hierarchy":
            if not scene_info.get("studio_hierarchy"):
                continue
            for p in scene_info["studio_hierarchy"]:
                path_list.append(re.sub('[\\/:"*?<>|]+', "", p).strip())
        else:
            path_list.append(
                re.sub('[\\/:"*?<>|]+', "", makePath(scene_info, part)).strip()
            )
    # Remove blank, empty string
    path_split = [x for x in path_list if x]
    # The first character was a seperator, so put it back.
    if path_list[0] == "":
        path_split.insert(0, "")

    if PREVENT_CONSECUTIVE:
        # remove consecutive (/FolderName/FolderName/video.mp4 -> FolderName/video.mp4
        path_split = remove_consecutive(path_split)

    if "^*" in template["path"]["destination"]:
        if scene_info["current_directory"] != os.sep.join(path_split):
            path_split.pop(len(scene_info["current_directory"]))

    path_edited = os.sep.join(path_split)

    if FILENAME_REMOVECHARACTER:
        path_edited = re.sub(f"[{FILENAME_REMOVECHARACTER}]+", "", path_edited)

    # Using typewriter for Apostrophe
    new_path = re.sub("[’‘”“]+", "'", path_edited)

    return new_path


def connect_db(path: str):
    try:
        sqliteConnection = sqlite3.connect(path, timeout=10)
        log.LogDebug("Python successfully connected to SQLite")
    except sqlite3.Error as error:
        log.LogError(f"FATAL SQLITE Error: {error}")
        return None
    return sqliteConnection


def checking_duplicate_db(scene_info: dict):
    scenes = graphql_findScenebyPath(scene_info["final_path"], "EQUALS")
    if scenes["count"] > 0:
        log.LogError("Duplicate path detected")
        for dupl_row in scenes["scenes"]:
            log.LogWarning(f"Identical path: [{dupl_row['id']}]")
        return 1
    scenes = graphql_findScenebyPath(scene_info["new_filename"], "EQUALS")
    if scenes["count"] > 0:
        for dupl_row in scenes["scenes"]:
            if dupl_row["id"] != scene_info["scene_id"]:
                log.LogWarning(f"Duplicate filename: [{dupl_row['id']}]")


def db_rename(stash_db: sqlite3.Connection, scene_info):
    cursor = stash_db.cursor()
    # Database rename
    cursor.execute(
        "UPDATE scenes SET path=? WHERE id=?;",
        [scene_info["final_path"], scene_info["scene_id"]],
    )
    stash_db.commit()
    # Close DB
    cursor.close()


def db_rename_refactor(stash_db: sqlite3.Connection, scene_info):
    cursor = stash_db.cursor()
    # 2022-09-17T11:25:52+02:00
    mod_time = datetime.now().astimezone().isoformat("T", "seconds")

    # get the next id that we should use if needed
    cursor.execute("SELECT MAX(id) from folders")
    new_id = cursor.fetchall()[0][0] + 1

    # get the old folder id
    cursor.execute(
        "SELECT id FROM folders WHERE path=?", [scene_info["current_directory"]]
    )
    old_folder_id = cursor.fetchall()[0][0]

    # check if the folder of file is created in db
    cursor.execute("SELECT id FROM folders WHERE path=?", [scene_info["new_directory"]])
    folder_id = cursor.fetchall()
    if not folder_id:
        dir = scene_info["new_directory"]
        # reduce the path to find a parent folder
        for _ in range(1, len(scene_info["new_directory"].split(os.sep))):
            dir = os.path.dirname(dir)
            cursor.execute("SELECT id FROM folders WHERE path=?", [dir])
            parent_id = cursor.fetchall()
            if parent_id:
                # create a new row with the new folder with the parent folder find above
                cursor.execute(
                    "INSERT INTO 'main'.'folders'('id', 'path', 'parent_folder_id', 'mod_time', 'created_at', 'updated_at', 'zip_file_id') VALUES (?, ?, ?, ?, ?, ?, ?);",
                    [
                        new_id,
                        scene_info["new_directory"],
                        parent_id[0][0],
                        mod_time,
                        mod_time,
                        mod_time,
                        None,
                    ],
                )
                stash_db.commit()
                folder_id = new_id
                break
    else:
        folder_id = folder_id[0][0]
    if folder_id:
        cursor.execute(
            "SELECT file_id from scenes_files WHERE scene_id=?",
            [scene_info["scene_id"]],
        )
        file_ids = cursor.fetchall()
        file_id = None
        for f in file_ids:
            # it can have multiple file for a scene
            cursor.execute("SELECT parent_folder_id from files WHERE id=?", [f[0]])
            check_parent = cursor.fetchall()[0][0]
            # if the parent id is the one found above section, we find our file.s
            if check_parent == old_folder_id:
                file_id = f[0]
                break
        if file_id:
            # log.LogDebug(f"UPDATE files SET basename={scene_info['new_filename']}, parent_folder_id={folder_id}, updated_at={mod_time} WHERE id={file_id};")
            cursor.execute(
                "UPDATE files SET basename=?, parent_folder_id=?, updated_at=? WHERE id=?;",
                [scene_info["new_filename"], folder_id, mod_time, file_id],
            )
            cursor.close()
            stash_db.commit()
        else:
            raise Exception("Failed to find file_id")
    else:
        cursor.close()
        raise Exception(
            f"You need to setup a library with the new location ({scene_info['new_directory']}) and scan at least 1 file"
        )


def file_rename(current_path: str, new_path: str, scene_info: dict):
    # OS Rename
    if not os.path.isfile(current_path):
        log.LogWarning(f"[OS] File doesn't exist in your Disk/Drive ({current_path})")
        return 1
    # moving/renaming
    new_dir = os.path.dirname(new_path)
    current_dir = os.path.dirname(current_path)
    if not os.path.exists(new_dir):
        log.LogInfo(f"Creating folder because it don't exist ({new_dir})")
        os.makedirs(new_dir)
    try:
        shutil.move(current_path, new_path)
    except PermissionError as err:
        if "[WinError 32]" in str(err) and MODULE_PSUTIL:
            log.LogWarning(
                "A process is using this file (Probably FFMPEG), trying to find it ..."
            )
            # Find which process accesses the file, it's ffmpeg for sure...
            process_use = has_handle(current_path, PROCESS_ALLRESULT)
            if process_use:
                # Terminate the process then try again to rename
                log.LogDebug(f"Process that uses this file: {process_use}")
                if PROCESS_KILL:
                    p = psutil.Process(process_use.pid)
                    p.terminate()
                    p.wait(10)
                    # If process is not terminated, this will create an error again.
                    try:
                        shutil.move(current_path, new_path)
                    except Exception as err:
                        log.LogError(
                            f"Something still prevents renaming the file. {err}"
                        )
                        return 1
                else:
                    log.LogError("A process prevents renaming the file.")
                    return 1
        else:
            log.LogError(f"Something prevents renaming the file. {err}")
            return 1
    # checking if the move/rename work correctly
    if os.path.isfile(new_path):
        log.LogInfo(f"[OS] File Renamed! ({current_path} -> {new_path})")
        if LOGFILE:
            try:
                with open(LOGFILE, "a", encoding="utf-8") as f:
                    f.write(
                        f"{scene_info['scene_id']}|{current_path}|{new_path}|{scene_info['oshash']}\n"
                    )
            except Exception as err:
                shutil.move(new_path, current_path)
                log.LogError(
                    f"Restoring the original path, error writing the logfile: {err}"
                )
                return 1
        if REMOVE_EMPTY_FOLDER:
            with os.scandir(current_dir) as it:
                if not any(it):
                    log.LogInfo(f"Removing empty folder ({current_dir})")
                    try:
                        os.rmdir(current_dir)
                    except Exception as err:
                        log.logWarning(
                            f"Fail to delete empty folder {current_dir} - {err}"
                        )
    else:
        # I don't think it's possible.
        log.LogError(f"[OS] Failed to rename the file ? {new_path}")
        return 1


def associated_rename(scene_info: dict):
    if ASSOCIATED_EXT:
        for ext in ASSOCIATED_EXT:
            p = os.path.splitext(scene_info["current_path"])[0] + "." + ext
            p_new = os.path.splitext(scene_info["final_path"])[0] + "." + ext
            if os.path.isfile(p):
                try:
                    shutil.move(p, p_new)
                except Exception as err:
                    log.LogError(
                        f"Something prevents renaming this file '{p}' - err: {err}"
                    )
                    continue
            if os.path.isfile(p_new):
                log.LogInfo(f"[OS] Associate file renamed ({p_new})")
                if LOGFILE:
                    try:
                        with open(LOGFILE, "a", encoding="utf-8") as f:
                            f.write(f"{scene_info['scene_id']}|{p}|{p_new}\n")
                    except Exception as err:
                        shutil.move(p_new, p)
                        log.LogError(
                            f"Restoring the original name, error writing the logfile: {err}"
                        )


def renamer(scene_id, db_conn=None):
    option_dryrun = False
    if type(scene_id) is dict:
        stash_scene = scene_id
        scene_id = stash_scene["id"]
    elif type(scene_id) is int:
        stash_scene = graphql_getScene(scene_id)

    if (
        config.only_organized
        and not stash_scene["organized"]
        and not PATH_NON_ORGANIZED
    ):
        log.LogDebug(f"[{scene_id}] Scene ignored (not organized)")
        return

    # refractor file support
    fingerprint = []
    if stash_scene.get("path"):
        stash_scene["file"]["path"] = stash_scene["path"]
        if stash_scene.get("checksum"):
            fingerprint.append({"type": "md5", "value": stash_scene["checksum"]})
        if stash_scene.get("oshash"):
            fingerprint.append({"type": "oshash", "value": stash_scene["oshash"]})
        stash_scene["file"]["fingerprints"] = fingerprint
        scene_files = [stash_scene["file"]]
        del stash_scene["path"]
        del stash_scene["file"]
    elif stash_scene.get("files"):
        scene_files = stash_scene["files"]
        del stash_scene["files"]
    else:
        scene_files = []
    stash_db = None
    for i in range(0, len(scene_files)):
        scene_file = scene_files[i]
        # refractor file support
        for f in scene_file["fingerprints"]:
            if f.get("oshash"):
                stash_scene["oshash"] = f["oshash"]
            if f.get("md5"):
                stash_scene["checksum"] = f["md5"]
            if f.get("checksum"):
                stash_scene["checksum"] = f["checksum"]
        stash_scene["path"] = scene_file["path"]
        stash_scene["file"] = scene_file
        if scene_file.get("bit_rate"):
            stash_scene["file"]["bit_rate"] = scene_file["bit_rate"]
        if scene_file.get("frame_rate"):
            stash_scene["file"]["framerate"] = scene_file["frame_rate"]

        # Tags > Studios > Default
        template = {}
        template["filename"] = get_template_filename(stash_scene)
        template["path"] = get_template_path(stash_scene)
        if not template["path"].get("destination"):
            if config.p_use_default_template:
                log.LogDebug("[PATH] Using default template")
                template["path"] = {
                    "destination": config.p_default_template,
                    "option": [],
                    "opt_details": {},
                }
            else:
                template["path"] = None
        else:
            if template["path"].get("option"):
                if "dry_run" in template["path"]["option"] and not DRY_RUN:
                    log.LogInfo("Dry-Run on (activate by option)")
                    option_dryrun = True
        if not template["filename"] and config.use_default_template:
            log.LogDebug("[FILENAME] Using default template")
            template["filename"] = config.default_template

        if not template["filename"] and not template["path"]:
            log.LogWarning(f"[{scene_id}] No template for this scene.")
            return

        # log.LogDebug("Using this template: {}".format(filename_template))
        scene_information = extract_info(stash_scene, template)
        log.LogDebug(f"[{scene_id}] Scene information: {scene_information}")
        log.LogDebug(f"[{scene_id}] Template: {template}")

        scene_information["scene_id"] = scene_id
        scene_information["file_index"] = i

        for removed_field in ORDER_SHORTFIELD:
            if removed_field:
                if scene_information.get(removed_field.replace("$", "")):
                    del scene_information[removed_field.replace("$", "")]
                    log.LogWarning(f"removed {removed_field} to reduce the length path")
                else:
                    continue
            if template["filename"]:
                scene_information["new_filename"] = create_new_filename(
                    scene_information, template["filename"]
                )
            else:
                scene_information["new_filename"] = scene_information[
                    "current_filename"
                ]
            if template.get("path"):
                scene_information["new_directory"] = create_new_path(
                    scene_information, template
                )
            else:
                scene_information["new_directory"] = scene_information[
                    "current_directory"
                ]
            scene_information["final_path"] = os.path.join(
                scene_information["new_directory"], scene_information["new_filename"]
            )
            # check length of path
            if IGNORE_PATH_LENGTH or len(scene_information["final_path"]) <= 240:
                break

        if check_longpath(scene_information["final_path"]):
            if (DRY_RUN or option_dryrun) and LOGFILE:
                with open(DRY_RUN_FILE, "a", encoding="utf-8") as f:
                    f.write(
                        f"[LENGTH LIMIT] {scene_information['scene_id']}|{scene_information['final_path']}\n"
                    )
            continue

        # log.LogDebug(f"Filename: {scene_information['current_filename']} -> {scene_information['new_filename']}")
        # log.LogDebug(f"Path: {scene_information['current_directory']} -> {scene_information['new_directory']}")

        if scene_information["final_path"] == scene_information["current_path"]:
            log.LogInfo(f"Everything is ok. ({scene_information['current_filename']})")
            continue

        if scene_information["current_directory"] != scene_information["new_directory"]:
            log.LogInfo("File will be moved to another directory")
            log.LogDebug(f"[OLD path] {scene_information['current_path']}")
            log.LogDebug(f"[NEW path] {scene_information['final_path']}")

        if scene_information["current_filename"] != scene_information["new_filename"]:
            log.LogInfo("The filename will be changed")
            if ALT_DIFF_DISPLAY:
                find_diff_text(
                    scene_information["current_filename"],
                    scene_information["new_filename"],
                )
            else:
                log.LogDebug(f"[OLD filename] {scene_information['current_filename']}")
                log.LogDebug(f"[NEW filename] {scene_information['new_filename']}")

        if (DRY_RUN or option_dryrun) and LOGFILE:
            with open(DRY_RUN_FILE, "a", encoding="utf-8") as f:
                f.write(
                    f"{scene_information['scene_id']}|{scene_information['current_path']}|{scene_information['final_path']}\n"
                )
            continue
        # check if there is already a file where the new path is
        err = checking_duplicate_db(scene_information)
        while err and scene_information["file_index"] <= len(DUPLICATE_SUFFIX):
            log.LogDebug("Duplicate filename detected, increasing file index")
            scene_information["file_index"] = scene_information["file_index"] + 1
            scene_information["new_filename"] = create_new_filename(
                scene_information, template["filename"]
            )
            scene_information["final_path"] = os.path.join(
                scene_information["new_directory"], scene_information["new_filename"]
            )
            log.LogDebug(f"[NEW filename] {scene_information['new_filename']}")
            log.LogDebug(f"[NEW path] {scene_information['final_path']}")
            err = checking_duplicate_db(scene_information)
        # abort
        if err:
            raise Exception("duplicate")
        # connect to the db
        if not db_conn:
            stash_db = connect_db(STASH_DATABASE)
            if stash_db is None:
                return
        else:
            stash_db = db_conn
        try:
            # rename file on your disk
            err = file_rename(
                scene_information["current_path"],
                scene_information["final_path"],
                scene_information,
            )
            if err:
                raise Exception("rename")
            # rename file on your db
            try:
                if DB_VERSION >= DB_VERSION_FILE_REFACTOR:
                    db_rename_refactor(stash_db, scene_information)
                else:
                    db_rename(stash_db, scene_information)
            except Exception as err:
                log.LogError(
                    f"error when trying to update the database ({err}), revert the move..."
                )
                err = file_rename(
                    scene_information["final_path"],
                    scene_information["current_path"],
                    scene_information,
                )
                if err:
                    raise Exception("rename")
                raise Exception("database update")
            if i == 0:
                associated_rename(scene_information)
            if template.get("path"):
                if "clean_tag" in template["path"]["option"]:
                    graphql_removeScenesTag(
                        [scene_information["scene_id"]],
                        template["path"]["opt_details"]["clean_tag"],
                    )
        except Exception as err:
            log.LogError(f"Error during database operation ({err})")
            if not db_conn:
                log.LogDebug("[SQLITE] Database closed")
                stash_db.close()
            continue
    if not db_conn and stash_db:
        stash_db.close()
        log.LogInfo("[SQLITE] Database updated and closed!")


def exit_plugin(msg=None, err=None):
    if msg is None and err is None:
        msg = "plugin ended"
    log.LogDebug("Execution time: {}s".format(round(time.time() - START_TIME, 5)))
    output_json = {"output": msg, "error": err}
    print(json.dumps(output_json))
    sys.exit()


if PLUGIN_ARGS:
    log.LogDebug("--Starting Plugin 'Renamer'--")
    if "bulk" not in PLUGIN_ARGS:
        if "enable" in PLUGIN_ARGS:
            log.LogInfo("Enable hook")
            success = config_edit("enable_hook", True)
        elif "disable" in PLUGIN_ARGS:
            log.LogInfo("Disable hook")
            success = config_edit("enable_hook", False)
        elif "dryrun" in PLUGIN_ARGS:
            if config.dry_run:
                log.LogInfo("Disable dryrun")
                success = config_edit("dry_run", False)
            else:
                log.LogInfo("Enable dryrun")
                success = config_edit("dry_run", True)
        if not success:
            log.LogError("Script failed to change the value")
        exit_plugin("script finished")
else:
    if not config.enable_hook:
        exit_plugin("Hook disabled")
    log.LogDebug("--Starting Hook 'Renamer'--")
    FRAGMENT_HOOK_TYPE = FRAGMENT["args"]["hookContext"]["type"]
    FRAGMENT_SCENE_ID = FRAGMENT["args"]["hookContext"]["id"]

LOGFILE = config.log_file

# Gallery.Update.Post
# if FRAGMENT_HOOK_TYPE == "Scene.Update.Post":


STASH_CONFIG = graphql_getConfiguration()
STASH_DATABASE = STASH_CONFIG["general"]["databasePath"]

# READING CONFIG

ASSOCIATED_EXT = config.associated_extension

FIELD_WHITESPACE_SEP = config.field_whitespaceSeperator
FIELD_REPLACER = config.field_replacer

FILENAME_ASTITLE = config.filename_as_title
FILENAME_LOWER = config.lowercase_Filename
FILENAME_TITLECASE = config.titlecase_Filename
FILENAME_SPLITCHAR = config.filename_splitchar
FILENAME_REMOVECHARACTER = config.removecharac_Filename
FILENAME_REPLACEWORDS = config.replace_words

PERFORMER_SPLITCHAR = config.performer_splitchar
PERFORMER_LIMIT = config.performer_limit
PERFORMER_LIMIT_KEEP = config.performer_limit_keep
PERFORMER_SORT = config.performer_sort
PERFORMER_IGNOREGENDER = config.performer_ignoreGender
PREVENT_TITLE_PERF = config.prevent_title_performer

DUPLICATE_SUFFIX = config.duplicate_suffix

PREPOSITIONS_LIST = config.prepositions_list
PREPOSITIONS_REMOVAL = config.prepositions_removal

SQUEEZE_STUDIO_NAMES = config.squeeze_studio_names

RATING_FORMAT = config.rating_format

TAGS_SPLITCHAR = config.tags_splitchar
TAGS_WHITELIST = config.tags_whitelist
TAGS_BLACKLIST = config.tags_blacklist

IGNORE_PATH_LENGTH = config.ignore_path_length

PREVENT_CONSECUTIVE = config.prevent_consecutive
REMOVE_EMPTY_FOLDER = config.remove_emptyfolder

PROCESS_KILL = config.process_kill_attach
PROCESS_ALLRESULT = config.process_getall
UNICODE_USE = config.use_ascii

ORDER_SHORTFIELD = config.order_field
ORDER_SHORTFIELD.insert(0, None)

ALT_DIFF_DISPLAY = config.alt_diff_display

PATH_NOPERFORMER_FOLDER = config.path_noperformer_folder
PATH_KEEP_ALRPERF = config.path_keep_alrperf
PATH_NON_ORGANIZED = config.p_non_organized
PATH_ONEPERFORMER = config.path_one_performer

DB_VERSION = graphql_getBuild()
if DB_VERSION >= DB_VERSION_FILE_REFACTOR:
    FILE_QUERY = """
            files {
                path
                video_codec
                audio_codec
                width
                height
                frame_rate
                duration
                bit_rate
                phash: fingerprint(type: "phash")
                oshash: fingerprint(type: "oshash")
                checksum: fingerprint(type: "checksum")
                fingerprints {
                    type
                    value
                }
            }
    """
else:
    FILE_QUERY = """
            path
            file {
                video_codec
                audio_codec
                width
                height
                framerate
                bitrate
                duration
            }
    """
if DB_VERSION >= DB_VERSION_SCENE_STUDIO_CODE:
    FILE_QUERY = f"        code{FILE_QUERY}"

if PLUGIN_ARGS:
    if "bulk" in PLUGIN_ARGS:
        scenes = graphql_findScene(config.batch_number_scene, "ASC")
        log.LogDebug(f"Count scenes: {len(scenes['scenes'])}")
        progress = 0
        progress_step = 1 / len(scenes["scenes"])
        stash_db = connect_db(STASH_DATABASE)
        if stash_db is None:
            exit_plugin()
        for scene in scenes["scenes"]:
            log.LogDebug(f"** Checking scene: {scene['title']} - {scene['id']} **")
            try:
                renamer(scene, stash_db)
            except Exception as err:
                log.LogError(f"main function error: {err}")
            progress += progress_step
            log.LogProgress(progress)
        stash_db.close()
        log.LogInfo("[SQLITE] Database closed!")
else:
    try:
        renamer(FRAGMENT_SCENE_ID)
    except Exception as err:
        log.LogError(f"main function error: {err}")
        traceback.print_exc()

exit_plugin("Successful!")
