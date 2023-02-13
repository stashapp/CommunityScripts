from datetime import datetime
import difflib
import json
import os
import re
import shutil
import time
import sqlite3
import sys

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
import renamerOnUpdate_graphql as graphql
import renamerOnUpdate_sqlite as sql

LOGFILE = config.log_file
DB_VERSION_FILE_REFACTOR = sql.DB_VERSION_FILE_REFACTOR

DRY_RUN = config.dry_run
DRY_RUN_FILE = None

if config.log_file:
    DRY_RUN_FILE = os.path.join(os.path.dirname(config.log_file),
                                "renamerOnUpdate_dryrun.txt")

if DRY_RUN:
    if DRY_RUN_FILE and not config.dry_run_append:
        if os.path.exists(DRY_RUN_FILE):
            os.remove(DRY_RUN_FILE)
    log.LogInfo("Dry mode on")

# get config

ALT_DIFF_DISPLAY = config.alt_diff_display
ASSOCIATED_EXT = config.associated_extension
DUPLICATE_SUFFIX = config.duplicate_suffix
FIELD_REPLACER = config.field_replacer
FIELD_WHITESPACE_SEP = config.field_whitespaceSeperator
FILENAME_ASTITLE = config.filename_as_title
FILENAME_LOWER = config.lowercase_Filename
FILENAME_REMOVECHARACTER = config.removecharac_Filename
FILENAME_REPLACEWORDS = config.replace_words
FILENAME_SPLITCHAR = config.filename_splitchar
FILENAME_TITLECASE = config.titlecase_Filename
IGNORE_PATH_LENGTH = config.ignore_path_length
ORDER_SHORTFIELD = config.order_field
PATH_KEEP_ALRPERF = config.path_keep_alrperf
PATH_NON_ORGANIZED = config.p_non_organized
PATH_NOPERFORMER_FOLDER = config.path_noperformer_folder
PATH_ONEPERFORMER = config.path_one_performer
PERFORMER_IGNOREGENDER = config.performer_ignoreGender
PERFORMER_LIMIT = config.performer_limit
PERFORMER_LIMIT_KEEP = config.performer_limit_keep
PERFORMER_SORT = config.performer_sort
PERFORMER_SPLITCHAR = config.performer_splitchar
PREPOSITIONS_LIST = config.prepositions_list
PREPOSITIONS_REMOVAL = config.prepositions_removal
PREVENT_CONSECUTIVE = config.prevent_consecutive
PREVENT_TITLE_PERF = config.prevent_title_performer
PROCESS_ALLRESULT = config.process_getall
PROCESS_KILL = config.process_kill_attach
RATING_FORMAT = config.rating_format
REMOVE_EMPTY_FOLDER = config.remove_emptyfolder
SQUEEZE_STUDIO_NAMES = config.squeeze_studio_names
TAGS_BLACKLIST = config.tags_blacklist
TAGS_SPLITCHAR = config.tags_splitchar
TAGS_WHITELIST = config.tags_whitelist
UNICODE_USE = config.use_ascii

ORDER_SHORTFIELD.insert(0, None)
START_TIME = time.time()


##
## ----- System Utils -----
##
def exit_plugin(msg=None, err=None) -> None:
    """
    exit plugin printing msg, error to stdout
    """
    if msg is None and err is None:
        msg = "plugin ended"
    log.LogDebug(f"Execution time: {round(time.time() - START_TIME, 5)}s")
    output_json = {"output": msg, "error": err}
    print(json.dumps(output_json))
    sys.exit()


def has_handle(fpath, all_result=False) -> list:
    """
    get handle/s of processes with path fpath
    """
    lst = []
    for proc in psutil.process_iter():
        try:
            for item in proc.open_files():
                if fpath == item.path:
                    if all_result:
                        lst.append(proc)
                    else:
                        return [proc]
        except Exception:
            pass
    return lst


def config_edit(name: str, state: bool) -> int:
    """
    set value of name in config file to state
    """
    found = 0
    try:
        with open(config.__file__, 'r', encoding='utf8') as file_r:
            config_lines = file_r.readlines()
        with open(config.__file__, 'w', encoding='utf8') as file_w:
            for line in config_lines:
                if len(line.split("=")) > 1:
                    if name == line.split("=")[0].strip():
                        file_w.write(f"{name} = {state}\n")
                        found += 1
                        continue
                file_w.write(line)
    except PermissionError as err:
        log.LogError(
            f"You don't have the permission to edit {config.__file__} ({err})")
    return found


##
## ----- Text Utils -----
##


def remove_consecutive_nonword(text: str) -> str:
    """
    remove consecutive nonword characters from text
    """
    for _ in range(0, 10):
        m = re.findall(r'(\W+)\1+', text)
        if m:
            text = re.sub(r'(\W+)\1+', r'\1', text)
        else:
            break
    return text


def find_diff_text(a: str, b: str) -> None:
    """
    print to log the difference in characters between a, b
    """
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
        log.LogDebug(f"Diff Checker: +{addi_}; -{minus_};")
        log.LogDebug(f"OLD: {a}")
        log.LogDebug(f"NEW: {b}")
    else:
        log.LogDebug(
            f"Original: {a}\n- Charac: {minus}\n+ Charac: {addi}\n  Result: {b}"
        )


def cleanup_text(text: str):
    """
    clean text by removing unwanted chars
    """
    text = re.sub(r'\(\W*\)|\[\W*\]|{[^a-zA-Z0-9]*}', '', text)
    text = re.sub(r'[{}]', '', text)
    text = remove_consecutive_nonword(text)
    return text.strip(" -_.")


def replace_text(text: str) -> str:
    """
    replace text using FILENAME_REPLACEWORDS
    """
    for old, new in FILENAME_REPLACEWORDS.items():
        if isinstance(new, str):
            new = [new]
        if len(new) > 1:
            if new[1] == "regex":
                tmp = re.sub(old, new[0], text)
                if tmp != text:
                    log.LogDebug(f"Regex matched: {text} -> {tmp}")
            else:
                if new[1] == "word":
                    tmp = re.sub(fr'([\s_-])({old})([\s_-])',
                                 f'\\1{new[0]}\\3', text)
                elif new[1] == "any":
                    tmp = text.replace(old, new[0])
                if tmp != text:
                    log.LogDebug(f"'{old}' changed with '{new[0]}'")
        else:
            tmp = re.sub(fr'([\s_-])({old})([\s_-])', f'\\1{new[0]}\\3', text)
            if tmp != text:
                log.LogDebug(f"'{old}' changed with '{new[0]}'")
        text = tmp
    return tmp


def capitalize_words(word: str):
    """
    capitalize word
    """
    # thanks to BCFC_1982 for it
    return re.sub(r"[A-Za-z]+('[A-Za-z]+)?",
                  lambda word: word.group(0).capitalize(), word)


##
##  ----- File Utils -----
##


def file_rename(current_path: str, new_path: str, scene_info: dict) -> bool:
    """
    move file with current_path to new_path
    returns True if file was moved, False otherwise
    """
    # OS Rename
    if not os.path.isfile(current_path):
        log.LogWarning(
            f"[OS] File doesn't exist in your Disk/Drive ({current_path})")
        return False
    # moving/renaming
    new_dir = os.path.dirname(new_path)
    current_dir = os.path.dirname(current_path)
    if not os.path.exists(new_dir):
        log.LogInfo(f"Creating folder because it doesn't exist ({new_dir})")
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
            if len(process_use) > 0:
                # Terminate the process then try again to rename
                log.LogDebug(f"Process that uses this file: {process_use[0]}")
                if PROCESS_KILL:
                    pcs = psutil.Process(process_use[0].pid)
                    pcs.terminate()
                    pcs.wait(10)
                    # If process is not terminated, this will create an error again.
                    try:
                        shutil.move(current_path, new_path)
                    except Exception as exc_err:
                        log.LogError(
                            f"Something still prevents renaming the file. {exc_err}"
                        )
                        return False
                else:
                    log.LogError("A process prevents renaming the file.")
                    return False
        else:
            log.LogError(f"Something prevents renaming the file. {err}")
            return False
    # check if the move/rename works correctly
    if os.path.isfile(new_path):
        log.LogInfo(f"[OS] File Renamed! ({current_path} -> {new_path})")
        if LOGFILE:
            try:
                with open(LOGFILE, 'a', encoding='utf-8') as l_f:
                    l_f.write(
                        f"{scene_info['scene_id']}|{current_path}|{new_path}|{scene_info['oshash']}\n"
                    )
            except Exception as err:
                shutil.move(new_path, current_path)
                log.LogError(
                    f"Restoring the original path, error writing the logfile: {err}"
                )
                return False
        if REMOVE_EMPTY_FOLDER:
            with os.scandir(current_dir) as dir_entries:
                if not any(dir_entries):
                    log.LogInfo(f"Removing empty folder ({current_dir})")
                    try:
                        os.rmdir(current_dir)
                    except Exception as err:
                        log.LogWarning(
                            f"Failed to delete empty folder {current_dir} - {err}"
                        )
    else:
        # I don't think it's possible.
        log.LogError(f"[OS] Failed to rename the file ? {new_path}")
        return False
    return True


def make_path(scene_information: dict, query: str) -> str:
    new_filename = str(query)
    new_filename = new_filename.replace("$performer", "$performer_path")
    rpl, title = field_replacer(new_filename, scene_information)
    if not title:
        rpl = rpl.replace("$title", "")
    rpl = cleanup_text(rpl)
    if title:
        rpl = rpl.replace("$title", title)
    return rpl


def make_filename(scene_information: dict, query: str) -> str:
    new_filename = str(query)
    rpl, title = field_replacer(new_filename, scene_information)
    if FILENAME_REPLACEWORDS:
        rpl = replace_text(rpl)
    if not title:
        rpl = rpl.replace("$title", "")
    rpl = cleanup_text(rpl)
    if title:
        rpl = rpl.replace("$title", title)
    # Replace spaces with splitchar
    rpl = rpl.replace(' ', FILENAME_SPLITCHAR)
    return rpl


def create_new_path(scene_info: dict, template: dict):
    # Create the new path
    # Split the template path
    path_split = scene_info['template_split']
    path_list = []
    for part in path_split:
        if ":" in part and path_split[0]:
            path_list.append(part)
        elif part == "$studio_hierarchy":
            if not scene_info.get("studio_hierarchy"):
                continue
            for p in scene_info["studio_hierarchy"]:
                path_list.append(re.sub('[\\/:"*?<>|]+', '', p).strip())
        else:
            path_list.append(
                re.sub('[\\/:"*?<>|]+', '', make_path(scene_info,
                                                      part)).strip())
    # Remove blank, empty string
    path_split = [x for x in path_list if x]
    # The first character was a seperator, so put it back.
    if path_list[0] == "":
        path_split.insert(0, "")

    if PREVENT_CONSECUTIVE:
        # remove consecutive (/FolderName/FolderName/video.mp4 -> FolderName/video.mp4
        path_split = remove_consecutive(path_split)

    if "^*" in template["path"]["destination"]:
        if scene_info['current_directory'] != os.sep.join(path_split):
            path_split.pop(len(scene_info['current_directory']))

    path_edited = os.sep.join(path_split)

    if FILENAME_REMOVECHARACTER:
        path_edited = re.sub(f'[{FILENAME_REMOVECHARACTER}]+', '', path_edited)

    # Using typewriter for Apostrophe
    new_path = re.sub("[’‘”“]+", "'", path_edited)

    return new_path


def create_new_filename(scene_info: dict, template: str):
    new_filename = make_filename(scene_info, template) + DUPLICATE_SUFFIX[
        scene_info['file_index']] + scene_info['file_extension']
    if FILENAME_LOWER:
        new_filename = new_filename.lower()
    if FILENAME_TITLECASE:
        new_filename = capitalize_words(new_filename)
    # Remove illegal character for Windows
    new_filename = re.sub('[\\/:"*?<>|]+', '', new_filename)

    if FILENAME_REMOVECHARACTER:
        new_filename = re.sub(f'[{FILENAME_REMOVECHARACTER}]+', '',
                              new_filename)

    # Trying to remove non standard character
    if MODULE_UNIDECODE and UNICODE_USE:
        new_filename = unidecode.unidecode(new_filename, errors='preserve')
    else:
        # Using typewriter for Apostrophe
        new_filename = re.sub("[’‘”“]+", "'", new_filename)
    return new_filename


def associated_rename(scene_info: dict, extensions: list):
    """
    Try to rename related files, avoiding existing ones, according to given extensions
    """
    if extensions:
        for ext in extensions:
            p = os.path.splitext(scene_info['current_path'])[0] + "." + ext
            p_new = os.path.splitext(scene_info['final_path'])[0] + "." + ext
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
                        with open(LOGFILE, 'a', encoding='utf-8') as l_f:
                            l_f.write(
                                f"{scene_info['scene_id']}|{p}|{p_new}\n")
                    except Exception as err:
                        shutil.move(p_new, p)
                        log.LogError(
                            f"Restoring the original name, error writing the logfile: {err}"
                        )


def check_longpath(l_path: str, ignore: bool) -> bool:
    """
    Check long paths for Win10
    https://docs.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation?tabs=cmd
    """
    if len(l_path) > 240 and not ignore:
        log.LogError(
            f"The path is too long ({len(l_path)} > 240). You can look at 'order_field'/'ignore_path_length' in config."
        )
        return True
    return False


##
## ----- Misc Utils -----
##


def remove_consecutive(liste: list) -> list:
    """
    remove consecutive duplicate items from liste
    """
    new_list = []
    for i in range(0, len(liste)):
        if i != 0 and liste[i] == liste[i - 1]:
            continue
        new_list.append(liste[i])
    return new_list


def field_replacer(text: str, scene_information: dict):
    """
    replace fields in text according to config
    """
    field_found = re.findall(r"\$\w+", text)
    result = text
    title = None
    replaced_word = ""
    if field_found:
        field_found.sort(key=len, reverse=True)
    for i in range(0, len(field_found)):
        field = field_found[i].replace("$", "").strip("_")
        # If $performer is before $title, prevent having duplicate text.
        if field == "performer" and len(
                field_found) > i + 1 and scene_information.get('performer'):
            if field_found[i + 1] == "$title" and scene_information.get(
                    'title') and PREVENT_TITLE_PERF:
                if re.search(f"^{scene_information['performer'].lower()}",
                             scene_information['title'].lower()):
                    log.LogDebug(
                        "Ignoring the performer field because it's already in start of title"
                    )
                    result = result.replace("$performer", "")
                    continue
        replaced_word = scene_information.get(field)
        if not replaced_word:
            replaced_word = ""
        if FIELD_REPLACER.get(f"${field}"):
            replaced_word = replaced_word.replace(
                FIELD_REPLACER[f"${field}"]["replace"],
                FIELD_REPLACER[f"${field}"]["with"])
        if field == "title":
            title = replaced_word.strip()
            continue
        if replaced_word == "":
            result = result.replace(field_found[i], replaced_word)
        else:
            result = result.replace(f"${field}", replaced_word)
    return result, title


def get_template_path(scene: dict) -> dict:
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
            template["destination"] = config.p_studio_templates[scene["studio"]
                                                                ["name"]]
        # by Parent
        if scene["studio"].get("parent_studio"):
            if config.p_studio_templates.get(scene["studio"]["name"]):
                template["destination"] = config.p_studio_templates[
                    scene["studio"]["name"]]

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
    if not scene['organized'] and PATH_NON_ORGANIZED:
        template["destination"] = PATH_NON_ORGANIZED
    return template


##
## ----- Parsing ------
##
def extract_info(scene: dict, gql: graphql.Query, template: None) -> dict:
    # Grabbing things from Stash
    scene_information = {}

    scene_information['current_path'] = str(scene['path'])
    # note: contain the dot (.mp4)
    scene_information['file_extension'] = os.path.splitext(
        scene_information['current_path'])[1]
    # note: basename contains the extension
    scene_information['current_filename'] = os.path.basename(
        scene_information['current_path'])
    scene_information['current_directory'] = os.path.dirname(
        scene_information['current_path'])
    scene_information['oshash'] = scene['oshash']
    scene_information['checksum'] = scene.get("checksum")
    scene_information['studio_code'] = scene.get("code")

    if scene.get("stash_ids"):
        #todo support other db that stashdb ?
        scene_information['stashid_scene'] = scene['stash_ids'][0]["stash_id"]

    if template.get("path"):
        if "^*" in template["path"]["destination"]:
            template["path"]["destination"] = template["path"][
                "destination"].replace("^*",
                                       scene_information['current_directory'])
        scene_information['template_split'] = os.path.normpath(
            template["path"]["destination"]).split(os.sep)
    scene_information['current_path_split'] = os.path.normpath(
        scene_information['current_path']).split(os.sep)

    if FILENAME_ASTITLE and not scene.get("title"):
        scene["title"] = scene_information['current_filename']

    # Grab Title (without extension if present)
    if scene.get("title"):
        # Removing extension if present in title
        scene_information['title'] = re.sub(
            fr"{scene_information['file_extension']}$", "", scene['title'])
        if PREPOSITIONS_REMOVAL:
            for word in PREPOSITIONS_LIST:
                scene_information['title'] = re.sub(fr"^{word}[\s_-]", "",
                                                    scene_information['title'])

    # Grab Date
    scene_information['date'] = scene.get("date")
    if scene_information['date']:
        date_scene = datetime.strptime(scene_information['date'], r"%Y-%m-%d")
        scene_information['date_format'] = datetime.strftime(
            date_scene, config.date_format)

    # Grab Duration
    scene_information['duration'] = scene['file']['duration']
    if config.duration_format:
        scene_information['duration'] = time.strftime(
            config.duration_format, time.gmtime(scene_information['duration']))
    else:
        scene_information['duration'] = str(scene_information['duration'])

    # Grab Rating
    if scene.get("rating"):
        scene_information['rating'] = RATING_FORMAT.format(scene['rating'])

    # Grab Performer
    scene_information['performer_path'] = None
    if scene.get("performers"):
        perf_list = []
        perf_list_stashid = []
        perf_rating = {"0": []}
        perf_favorite = {"yes": [], "no": []}
        for perf in scene['performers']:
            if perf.get("gender"):
                if perf['gender'] in PERFORMER_IGNOREGENDER:
                    continue
            elif "UNDEFINED" in PERFORMER_IGNOREGENDER:
                continue
            # path related
            if template.get("path"):
                if "inverse_performer" in template["path"]["option"]:
                    perf["name"] = re.sub(r"([a-zA-Z]+)(\s)([a-zA-Z]+)",
                                          r"\3 \1", perf["name"])
            perf_list.append(perf['name'])
            if perf.get('rating'):
                if perf_rating.get(str(perf['rating'])) is None:
                    perf_rating[str(perf['rating'])] = []
                perf_rating[str(perf['rating'])].append(perf['name'])
            else:
                perf_rating["0"].append(perf['name'])
            if perf.get('favorite'):
                perf_favorite['yes'].append(perf['name'])
            else:
                perf_favorite['no'].append(perf['name'])
            # if the path already contains the name we keep this one
            if perf["name"] in scene_information[
                    'current_path_split'] and scene_information.get(
                        'performer_path') is None and PATH_KEEP_ALRPERF:
                scene_information['performer_path'] = perf["name"]
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
        if not scene_information['performer_path'] and perf_list:
            scene_information['performer_path'] = perf_list[0]
        if len(perf_list) > PERFORMER_LIMIT:
            if not PERFORMER_LIMIT_KEEP:
                log.LogInfo(
                    f"More than {PERFORMER_LIMIT} performer(s). Ignoring $performer"
                )
                perf_list = []
            else:
                log.LogInfo(
                    f"Limited the amount of performer to {PERFORMER_LIMIT}")
                perf_list = perf_list[0:PERFORMER_LIMIT]
        scene_information['performer'] = PERFORMER_SPLITCHAR.join(perf_list)
        if perf_list:
            for p in perf_list:
                for perf in scene['performers']:
                    #todo support other db that stashdb ?
                    if p == perf['name'] and perf.get('stash_ids'):
                        perf_list_stashid.append(
                            perf['stash_ids'][0]["stash_id"])
                        break
            scene_information['stashid_performer'] = PERFORMER_SPLITCHAR.join(
                perf_list_stashid)
        if not PATH_ONEPERFORMER:
            scene_information['performer_path'] = PERFORMER_SPLITCHAR.join(
                perf_list)
    elif PATH_NOPERFORMER_FOLDER:
        scene_information['performer_path'] = "NoPerformer"

    # Grab Studio name
    if scene.get("studio"):
        if SQUEEZE_STUDIO_NAMES:
            scene_information['studio'] = scene['studio']['name'].replace(
                ' ', '')
        else:
            scene_information['studio'] = scene['studio']['name']
        scene_information['studio_family'] = scene_information['studio']
        studio_hierarchy = [scene_information['studio']]
        # Grab Parent name
        if scene['studio'].get("parent_studio"):
            if SQUEEZE_STUDIO_NAMES:
                scene_information['parent_studio'] = scene['studio'][
                    'parent_studio']['name'].replace(' ', '')
            else:
                scene_information['parent_studio'] = scene['studio'][
                    'parent_studio']['name']
            scene_information['studio_family'] = scene_information[
                'parent_studio']

            studio_p = scene['studio']
            while studio_p.get("parent_studio"):
                studio_p = gql.get_studio(studio_p['parent_studio']['id'])
                if studio_p:
                    if SQUEEZE_STUDIO_NAMES:
                        studio_hierarchy.append(studio_p['name'].replace(
                            ' ', ''))
                    else:
                        studio_hierarchy.append(studio_p['name'])
            studio_hierarchy.reverse()
        scene_information['studio_hierarchy'] = studio_hierarchy
    # Grab Tags
    if scene.get("tags"):
        tag_list = []
        for tag in scene['tags']:
            # ignore tag in blacklist
            if tag['name'] in TAGS_BLACKLIST:
                continue
            # check if there is a whilelist
            if len(TAGS_WHITELIST) > 0:
                if tag['name'] in TAGS_WHITELIST:
                    tag_list.append(tag['name'])
            else:
                tag_list.append(tag['name'])
        scene_information['tags'] = TAGS_SPLITCHAR.join(tag_list)

    # Grab Height (720p,1080p,4k...)
    scene_information['bitrate'] = str(
        round(int(scene['file']['bitrate']) / 1000000, 2))
    scene_information['resolution'] = 'SD'
    scene_information['height'] = f"{scene['file']['height']}p"
    if scene['file']['height'] >= 720:
        scene_information['resolution'] = 'HD'
    if scene['file']['height'] >= 2160:
        scene_information['height'] = '4k'
        scene_information['resolution'] = 'UHD'
    if scene['file']['height'] >= 2880:
        scene_information['height'] = '5k'
    if scene['file']['height'] >= 3384:
        scene_information['height'] = '6k'
    if scene['file']['height'] >= 4320:
        scene_information['height'] = '8k'
    # For Phone ?
    if scene['file']['height'] > scene['file']['width']:
        scene_information['resolution'] = 'VERTICAL'

    if scene.get("movies"):
        scene_information["movie_title"] = scene["movies"][0]["movie"]["name"]
        if scene["movies"][0]["movie"].get("date"):
            scene_information["movie_year"] = scene["movies"][0]["movie"][
                "date"][0:4]
        if scene["movies"][0].get("scene_index"):
            scene_information["movie_index"] = scene["movies"][0][
                "scene_index"]
            scene_information[
                "movie_scene"] = f"scene {scene_information['movie_index']}"

    # Grab Video and Audio codec
    scene_information['video_codec'] = scene['file']['video_codec'].upper()
    scene_information['audio_codec'] = scene['file']['audio_codec'].upper()

    if scene_information.get("date"):
        scene_information['year'] = scene_information['date'][0:4]

    if FIELD_WHITESPACE_SEP:
        for key, value in scene_information.items():
            if key in [
                    "current_path", "current_filename", "current_directory",
                    "current_path_split", "template_split"
            ]:
                continue
            if isinstance(value, str):
                scene_information[key] = value.replace(" ",
                                                       FIELD_WHITESPACE_SEP)
            elif isinstance(value, list):
                scene_information[key] = [
                    x.replace(" ", FIELD_WHITESPACE_SEP) for x in value
                ]
    return scene_information


def sort_performer(lst_use: list, lst_app: list = None) -> list:
    if lst_app is None:
        lst_app = []
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


def get_template_filename(scene: dict, gql: graphql.Query) -> str:
    """
    return template to use for filename
    tag templates are used if available
    otherwise studio templates (if available)
    """
    template = None
    # by Studio
    if scene.get("studio") and config.studio_templates:
        template_found = False
        current_studio = scene.get("studio")
        if config.studio_templates.get(current_studio['name']):
            template = config.studio_templates[current_studio['name']]
            template_found = True
        # search parents for studio name (by first Parent found)
        while current_studio.get("parent_studio") and not template_found:
            if config.studio_templates.get(
                    current_studio.get("parent_studio").get("name")):
                template = config.studio_templates[
                    current_studio['parent_studio']['name']]
                template_found = True
            current_studio = gql.get_studio(
                current_studio.get("parent_studio")['id'])

    # by Tag
    tags = [x["name"] for x in scene["tags"]]
    if scene.get("tags") and config.tag_templates:
        for match, job in config.tag_templates.items():
            if match in tags:
                template = job
                break
    return template


def renamer(scene_id,
            gql: graphql.Query,
            db_conn: sqlite3.Connection = None,
            db: sql.Stash = None):
    option_dryrun = False
    if isinstance(scene_id, dict):
        stash_scene = scene_id
        scene_id = stash_scene['id']
    elif isinstance(scene_id, int):
        stash_scene = gql.get_scene(scene_id)

    if config.only_organized and not stash_scene[
            'organized'] and not PATH_NON_ORGANIZED:
        log.LogDebug(f"[{scene_id}] Scene ignored (not organized)")
        return

    # refactor file support
    fingerprint = []
    if stash_scene.get("path"):
        stash_scene["file"]["path"] = stash_scene["path"]
        if stash_scene.get("checksum"):
            fingerprint.append({
                "type": "md5",
                "value": stash_scene["checksum"]
            })
        if stash_scene.get("oshash"):
            fingerprint.append({
                "type": "oshash",
                "value": stash_scene["oshash"]
            })
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
        # refactor file support
        for f_print in scene_file["fingerprints"]:
            if f_print.get("oshash"):
                stash_scene["oshash"] = f_print["oshash"]
            if f_print.get("md5"):
                stash_scene["checksum"] = f_print["md5"]
        stash_scene["path"] = scene_file["path"]
        stash_scene["file"] = scene_file
        if scene_file.get("bit_rate"):
            stash_scene["file"]["bitrate"] = scene_file["bit_rate"]
        if scene_file.get("frame_rate"):
            stash_scene["file"]["framerate"] = scene_file["frame_rate"]

        # Tags > Studios > Default
        template = {}
        template["filename"] = get_template_filename(scene=stash_scene,
                                                     gql=gql)
        template["path"] = get_template_path(stash_scene)
        if not template["path"].get("destination"):
            if config.p_use_default_template:
                log.LogDebug("[PATH] Using default template")
                template["path"] = {
                    "destination": config.p_default_template,
                    "option": [],
                    "opt_details": {}
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

        #log.LogDebug("Using this template: {}".format(filename_template))
        scene_information = extract_info(scene=stash_scene,
                                         gql=gql,
                                         template=template)
        #log.LogDebug(f"[{scene_id}] Scene information: {scene_information}")
        log.LogDebug(f"[{scene_id}] Template: {template}")

        scene_information['scene_id'] = scene_id
        scene_information['file_index'] = i

        for removed_field in ORDER_SHORTFIELD:
            if removed_field:
                if scene_information.get(removed_field.replace("$", "")):
                    del scene_information[removed_field.replace("$", "")]
                    log.LogWarning(
                        f"removed {removed_field} to reduce the length path")
                else:
                    continue
            if template["filename"]:
                scene_information['new_filename'] = create_new_filename(
                    scene_information, template["filename"])

            else:
                scene_information['new_filename'] = scene_information[
                    'current_filename']
            if template.get("path"):
                scene_information['new_directory'] = create_new_path(
                    scene_information, template)
            else:
                scene_information['new_directory'] = scene_information[
                    'current_directory']
            scene_information['final_path'] = os.path.join(
                scene_information['new_directory'],
                scene_information['new_filename'])
            # check length of path
            if IGNORE_PATH_LENGTH or len(
                    scene_information['final_path']) <= 240:
                break

        if check_longpath(scene_information['final_path'], IGNORE_PATH_LENGTH):
            if (DRY_RUN or option_dryrun) and LOGFILE:
                with open(DRY_RUN_FILE, 'a', encoding='utf-8') as l_f:
                    l_f.write(
                        f"[LENGTH LIMIT] {scene_information['scene_id']}|{scene_information['final_path']}\n"
                    )
            continue

        #log.LogDebug(f"Filename: {scene_information['current_filename']} -> {scene_information['new_filename']}")
        #log.LogDebug(f"Path: {scene_information['current_directory']} -> {scene_information['new_directory']}")

        if scene_information['final_path'] == scene_information[
                'current_path']:
            log.LogInfo(
                f"Everything is ok. ({scene_information['current_filename']})")
            continue

        if scene_information['current_directory'] != scene_information[
                'new_directory']:
            log.LogInfo("File will be moved to another directory")
            log.LogDebug(f"[OLD path] {scene_information['current_path']}")
            log.LogDebug(f"[NEW path] {scene_information['final_path']}")

        if scene_information['current_filename'] != scene_information[
                'new_filename']:
            log.LogInfo("The filename will be changed")
            if ALT_DIFF_DISPLAY:
                find_diff_text(scene_information['current_filename'],
                               scene_information['new_filename'])
            else:
                log.LogDebug(
                    f"[OLD filename] {scene_information['current_filename']}")
                log.LogDebug(
                    f"[NEW filename] {scene_information['new_filename']}")

        if (DRY_RUN or option_dryrun) and LOGFILE:
            with open(DRY_RUN_FILE, 'a', encoding='utf-8') as d_f:
                d_f.write(
                    f"{scene_information['scene_id']}|{scene_information['current_path']}|{scene_information['final_path']}\n"
                )
            continue
        # check if there is already a file where the new path is
        gql_err = gql.checking_duplicate_db(scene_information)
        while gql_err and scene_information['file_index'] <= len(
                DUPLICATE_SUFFIX):
            log.LogDebug("Duplicate filename detected, increasing file index")
            scene_information[
                'file_index'] = scene_information['file_index'] + 1
            scene_information['new_filename'] = create_new_filename(
                scene_information, template["filename"])
            scene_information['final_path'] = os.path.join(
                scene_information['new_directory'],
                scene_information['new_filename'])
            log.LogDebug(f"[NEW filename] {scene_information['new_filename']}")
            log.LogDebug(f"[NEW path] {scene_information['final_path']}")
            gql_err = gql.checking_duplicate_db(scene_information)
        # abort
        if gql_err:
            raise Exception("duplicate")
        # connect to the db
        if not db_conn:
            if db is None:
                return
            stash_db = db.connect_db()
            if stash_db is None:
                return
        else:
            stash_db = db_conn
        try:
            # rename file on your disk
            moved = file_rename(scene_information['current_path'],
                                scene_information['final_path'],
                                scene_information)
            if not moved:
                raise Exception("rename")
            # rename file on your db
            try:
                db.db_rename(stash_db, scene_information)
            except Exception as exc_err:
                log.LogError(
                    f"error when trying to update the database ({exc_err}), revert the move..."
                )
                moved_final = file_rename(scene_information['final_path'],
                                          scene_information['current_path'],
                                          scene_information)
                if not moved_final:
                    raise Exception("rename") from exc_err
                raise Exception("database update") from exc_err
            if i == 0:
                associated_rename(scene_information, ASSOCIATED_EXT)
            if template.get("path"):
                if "clean_tag" in template["path"]["option"]:
                    gql.remove_scenes_tag(
                        [scene_information['scene_id']],
                        template["path"]["opt_details"]["clean_tag"])
        except Exception as exc_err:
            log.LogError(f"Error during database operation ({exc_err})")
            if not db_conn:
                log.LogDebug("[SQLITE] Database closed")
                stash_db.close()
            continue
    if not db_conn and stash_db:
        stash_db.close()
        log.LogInfo("[SQLITE] Database updated and closed!")
