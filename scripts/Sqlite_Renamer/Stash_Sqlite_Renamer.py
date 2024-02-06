import os
import re
import sqlite3
import sys

import progressbar

# Your sqlite path
DB_PATH = r"C:\Users\Winter\.stash\Full.sqlite"
# Log keep a trace of OldPath & new_path. Could be useful if you want to revert everything. Filename: rename_log.txt
USING_LOG = True
# DRY_RUN = True | Will don't change anything in your database & disk.
DRY_RUN = False
# Only take female performer name
FEMALE_ONLY = False
# Print debug message
DEBUG_MODE = True


def logPrint(q):
    if "[DEBUG]" in q and DEBUG_MODE == False:
        return
    print(q)


logPrint("Database Path: {}".format(DB_PATH))
if DRY_RUN == True:
    try:
        os.remove("rename_dryrun.txt")
    except FileNotFoundError:
        pass
    logPrint("[DRY_RUN] DRY-RUN Enable")


def gettingTagsID(name):
    cursor.execute("SELECT id from tags WHERE name=?;", [name])
    result = cursor.fetchone()
    try:
        id = str(result[0])
        logPrint("[Tag] [{}] {}".format(id, name))
    except:
        id = None
        logPrint("[Tag] Error when trying to get:{}".format(name))
    return id


def get_SceneID_fromTags(id):
    cursor.execute("SELECT scene_id from scenes_tags WHERE tag_id=?;", [id])
    record = cursor.fetchall()
    logPrint("There is {} scene(s) with the tag_id {}".format(len(record), id))
    array_ID = []
    for row in record:
        array_ID.append(row[0])
    list = ",".join(map(str, array_ID))
    return list


def get_Perf_fromSceneID(id_scene):
    perf_list = ""
    cursor.execute(
        "SELECT performer_id from performers_scenes WHERE scene_id=?;", [id_scene]
    )
    record = cursor.fetchall()
    # logPrint("Performer in scene: ", len(record))
    if len(record) > 3:
        logPrint("More than 3 performers.")
    else:
        perfcount = 0
        for row in record:
            perf_id = str(row[0])
            cursor.execute("SELECT name,gender from performers WHERE id=?;", [perf_id])
            perf = cursor.fetchall()
            if FEMALE_ONLY == True:
                # Only take female gender
                if str(perf[0][1]) == "FEMALE":
                    perf_list += str(perf[0][0]) + " "
                    perfcount += 1
                else:
                    continue
            else:
                perf_list += str(perf[0][0]) + " "
                perfcount += 1
    perf_list = perf_list.strip()
    return perf_list


def get_Studio_fromID(id):
    cursor.execute("SELECT name from studios WHERE id=?;", [id])
    record = cursor.fetchall()
    studio_name = str(record[0][0])
    return studio_name


def makeFilename(scene_info, query):
    # Query exemple:
    # Available: $date $performer $title $studio $height
    # $title                              == SSNI-000.mp4
    # $date $title                        == 2017-04-27 Oni Chichi.mp4
    # $date $performer - $title [$studio] == 2016-12-29 Eva Lovia - Her Fantasy Ball [Sneaky Sex].mp4
    new_filename = str(query)
    if "$date" in new_filename:
        if scene_info.get("date") == "" or scene_info.get("date") is None:
            new_filename = re.sub("\$date\s*", "", new_filename)
        else:
            new_filename = new_filename.replace("$date", scene_info["date"])

    if "$performer" in new_filename:
        if scene_info.get("performer") == "" or scene_info.get("performer") is None:
            new_filename = re.sub("\$performer\s*", "", new_filename)
        else:
            new_filename = new_filename.replace("$performer", scene_info["performer"])

    if "$title" in new_filename:
        if scene_info.get("title") == "" or scene_info.get("title") is None:
            new_filename = re.sub("\$title\s*", "", new_filename)
        else:
            new_filename = new_filename.replace("$title", scene_info["title"])

    if "$studio" in new_filename:
        if scene_info.get("studio") == "" or scene_info.get("studio") is None:
            new_filename = re.sub("\$studio\s*", "", new_filename)
        else:
            new_filename = new_filename.replace("$studio", scene_info["studio"])

    if "$height" in new_filename:
        if scene_info.get("height") == "" or scene_info.get("height") is None:
            new_filename = re.sub("\$height\s*", "", new_filename)
        else:
            new_filename = new_filename.replace("$height", scene_info["height"])
    new_filename = re.sub("^\s*-\s*", "", new_filename)
    new_filename = re.sub("\s*-\s*$", "", new_filename)
    new_filename = re.sub("\[\W*]", "", new_filename)
    new_filename = re.sub("\s{2,}", " ", new_filename)
    new_filename = new_filename.strip()
    return new_filename


def edit_db(query_filename, optionnal_query=None):
    query = "SELECT id,path,title,date,studio_id,height from scenes;"
    if optionnal_query is not None:
        query = "SELECT id,path,title,date,studio_id,height from scenes {};".format(
            optionnal_query
        )
    cursor.execute(query)
    record = cursor.fetchall()
    if len(record) == 0:
        logPrint("[Warn] There is no scene to change with this query")
        return
    logPrint("Scenes numbers: {}".format(len(record)))
    progressbar_Index = 0
    progress = progressbar.ProgressBar(redirect_stdout=True).start(len(record))
    for row in record:
        progress.update(progressbar_Index + 1)
        progressbar_Index += 1
        scene_ID = str(row[0])
        # Fixing letter (X:Folder -> X:\Folder)
        current_path = re.sub(r"^(.):\\*", r"\1:\\", str(row[1]))
        current_directory = os.path.dirname(current_path)
        current_filename = os.path.basename(current_path)
        file_extension = os.path.splitext(current_path)[1]
        scene_title = str(row[2])
        scene_date = str(row[3])
        scene_Studio_id = str(row[4])
        file_height = str(row[5])
        # By default, title contains extensions.
        scene_title = re.sub(file_extension + "$", "", scene_title)

        performer_name = get_Perf_fromSceneID(scene_ID)

        studio_name = ""
        if scene_Studio_id and scene_Studio_id != "None":
            studio_name = get_Studio_fromID(scene_Studio_id)

        if file_height == "4320":
            file_height = "8k"
        else:
            if file_height == "2160":
                file_height = "4k"
            else:
                file_height = "{}p".format(file_height)

        scene_info = {
            "title": scene_title,
            "date": scene_date,
            "performer": performer_name,
            "studio": studio_name,
            "height": file_height,
        }
        logPrint("[DEBUG] Scene information: {}".format(scene_info))
        # Create the new filename
        new_filename = makeFilename(scene_info, query_filename) + file_extension

        # Remove illegal character for Windows ('#' and ',' is not illegal you can remove it)
        new_filename = re.sub('[\\/:"*?<>|#,]+', "", new_filename)

        # Replace the old filename by the new in the filepath
        new_path = current_path.replace(current_filename, new_filename)

        if len(new_path) > 240:
            logPrint("[Warn] The Path is too long ({})".format(new_path))
            # We only use the date and title to get a shorter file (eg: 2017-04-27 - Oni Chichi.mp4)
            if scene_info.get("date"):
                reducePath = (
                    len(
                        current_directory
                        + scene_info["title"]
                        + scene_info["date"]
                        + file_extension
                    )
                    + 3
                )
            else:
                reducePath = (
                    len(current_directory + scene_info["title"] + file_extension) + 3
                )
            if reducePath < 240:
                if scene_info.get("date"):
                    new_filename = (
                        makeFilename(scene_info, "$date - $title") + file_extension
                    )
                else:
                    new_filename = makeFilename(scene_info, "$title") + file_extension
                # new_path = re.sub('{}$'.format(current_filename), new_filename, current_path)
                new_path = current_path.replace(current_filename, new_filename)
                logPrint("Reduced filename to: {}", new_filename)
            else:
                logPrint(
                    "[Error] Can't manage to reduce the path, ID: {}".format(scene_ID)
                )
                continue

        # Looking for duplicate filename
        cursor.execute(
            "SELECT id FROM scenes WHERE path LIKE ? AND NOT id=?;",
            ["%" + new_filename, scene_ID],
        )
        dupl_check = cursor.fetchall()
        if len(dupl_check) > 0:
            for dupl_row in dupl_check:
                logPrint("[Error] Same filename: [{}]".format(dupl_row[0]))
                logPrint(
                    "[{}] - {}\n".format(dupl_row[0], new_filename),
                    file=open("renamer_duplicate.txt", "a", encoding="utf-8"),
                )
            logPrint("\n")
            continue

        logPrint("[DEBUG] Filename: {} -> {}".format(current_filename, new_filename))
        logPrint("[DEBUG] Path: {} -> {}".format(current_path, new_path))
        if new_path == current_path:
            logPrint("[DEBUG] File already good.\n")
            continue
        else:
            #
            # THIS PART WILL EDIT YOUR DATABASE, FILES (be careful and know what you do)
            #
            # Windows Rename
            if os.path.isfile(current_path) == True:
                if DRY_RUN == False:
                    os.rename(current_path, new_path)
                    if os.path.isfile(new_path) == True:
                        logPrint("[OS] File Renamed! ({})".format(current_filename))
                        if USING_LOG == True:
                            print(
                                "{}|{}|{}\n".format(scene_ID, current_path, new_path),
                                file=open("rename_log.txt", "a", encoding="utf-8"),
                            )

                        # Database rename
                        cursor.execute(
                            "UPDATE scenes SET path=? WHERE id=?;", [new_path, scene_ID]
                        )
                        sqliteConnection.commit()
                        logPrint("[SQLITE] Datebase Updated!")
                    else:
                        logPrint(
                            "[OS] File failed to rename ? ({})".format(current_filename)
                        )
                        print(
                            "{} -> {}\n".format(current_path, new_path),
                            file=open("renamer_fail.txt", "a", encoding="utf-8"),
                        )
                else:
                    logPrint("[DRY_RUN][OS] File should be renamed")
                    print(
                        "{} -> {}\n".format(current_path, new_path),
                        file=open("renamer_dryrun.txt", "a", encoding="utf-8"),
                    )
            else:
                logPrint(
                    "[OS] File don't exist in your Disk/Drive ({})".format(current_path)
                )
            logPrint("\n")
        # break
    progress.finish()
    if DRY_RUN == False:
        sqliteConnection.commit()
    return


try:
    sqliteConnection = sqlite3.connect(DB_PATH)
    cursor = sqliteConnection.cursor()
    logPrint("Python successfully connected to SQLite\n")
except sqlite3.Error as error:
    logPrint("FATAL SQLITE Error: ", error)
    input("Press Enter to continue...")
    sys.exit(1)

# THIS PART IS PERSONAL THINGS, YOU SHOULD CHANGE THING BELOW :)

# Select Scene with Specific Tags
tags_dict = {
    "1": {"tag": "!1. JAV", "filename": "$title"},
    "2": {"tag": "!1. Anime", "filename": "$date $title"},
    "3": {"tag": "!1. Western", "filename": "$date $performer - $title [$studio]"},
}

for _, dict_section in tags_dict.items():
    tag_name = dict_section.get("tag")
    filename_template = dict_section.get("filename")
    id_tags = gettingTagsID(tag_name)
    if id_tags is not None:
        id_scene = get_SceneID_fromTags(id_tags)
        option_sqlite_query = (
            "WHERE id in ({}) AND path LIKE 'E:\\Film\\R18\\%'".format(id_scene)
        )
        edit_db(filename_template, option_sqlite_query)
        logPrint("====================")

# Select ALL scenes
# edit_db("$date $performer - $title [$studio]")

# END OF PERSONAL THINGS

if DRY_RUN == False:
    sqliteConnection.commit()
cursor.close()
sqliteConnection.close()
logPrint("The SQLite connection is closed")
# Input if you want to check the console.
input("Press Enter to continue...")
