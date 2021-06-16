import os
import sqlite3
import re
import progressbar

# Your sqlite path
DB_PATH = r"C:\Users\Winter\.stash\Full.sqlite"
# Log keep a trace of OldPath & Newpath. Could be useful if you want to revert everything. Filename: rename_log.txt
USING_LOG = True
# DRY_RUN = True | Will don't change anything in your database & disk.
DRY_RUN = False

print("Path:", DB_PATH)
if DRY_RUN == True:
    try:
        os.remove("rename_dryrun.txt") 
    except FileNotFoundError:
        pass
    print("DRY-RUN Enable")

def gettingTagsID(name):
    cursor.execute("SELECT id from tags WHERE name=?;", [name])
    result = cursor.fetchone()
    try:
        id = str(result[0])
        print("Tag: {} [{}]".format(name,id))
    except:
        id = None
        print("Error when trying to get:{}".format(name))
    return id


def get_SceneID_fromTags(id):
    cursor.execute("SELECT scene_id from scenes_tags WHERE tag_id=?;", [id])
    record = cursor.fetchall()
    print("There is {} scene(s) with the tag_id {}".format(len(record),id))
    array_ID = []
    for row in record:
        array_ID.append(row[0])
    list = ",".join(map(str, array_ID))
    return list


def get_Perf_fromSceneID(id_scene):
    perf_list = ""
    cursor.execute("SELECT performer_id from performers_scenes WHERE scene_id=?;", [id_scene])
    record = cursor.fetchall()
    #print("Performer in scene: ", len(record))
    if len(record) > 3:
        print("More than 3 performers.")
    else:
        for row in record:
            perf_id = str(row[0])
            cursor.execute("SELECT name from performers WHERE id=?;", [perf_id])
            perf = cursor.fetchall()
            perf_list += str(perf[0][0]) + " "
    perf_list = perf_list.strip()
    return perf_list


def get_Studio_fromID(id):
    cursor.execute("SELECT name from studios WHERE id=?;", [id])
    record = cursor.fetchall()
    studio_name = str(record[0][0])
    return studio_name


def makeFilename(scene_information, query):
    # Query exemple: 
    # Available: $date $performer $title $studio $height
    # $title                              == SSNI-000.mp4
    # $date $title                        == 2017-04-27 Oni Chichi.mp4
    # $date $performer - $title [$studio] == 2016-12-29 Eva Lovia - Her Fantasy Ball [Sneaky Sex].mp4
    new_filename = str(query)
    if "$date" in new_filename:
        if scene_information.get('date') == "":
            new_filename = re.sub('\$date\s*', '', new_filename)
        else:
            new_filename =new_filename.replace("$date", scene_information.get('date'))

    if "$performer" in new_filename:
        if scene_information.get('performer') == "":
            new_filename = re.sub('\$performer\s*', '', new_filename)
        else:
            new_filename = new_filename.replace("$performer", scene_information.get('performer'))

    if "$title" in new_filename:
        if scene_information.get('title') == "":
            new_filename = re.sub('\$title\s*', '', new_filename)
        else:
            new_filename = new_filename.replace("$title", scene_information.get('title'))

    if "$studio" in new_filename:
        if scene_information.get('studio') == "":
            new_filename = re.sub('\[\$studio\]', '', new_filename)
            new_filename = re.sub('\$studio\s*', '', new_filename)
        else:
            new_filename = new_filename.replace("$studio", scene_information.get('studio'))

    if "$height" in new_filename:
        if scene_information.get('height') == "":
            new_filename = re.sub('\$height\s*', '', new_filename)
        else:
            new_filename = new_filename.replace("$height", scene_information.get('height'))
    new_filename = new_filename.strip()
    return new_filename


def edit_db(queryfilename,optionnal_query=None):
    query = "SELECT id,path,title,date,studio_id,height from scenes;"
    if optionnal_query is not None:
        query = "SELECT id,path,title,date,studio_id,height from scenes {};".format(optionnal_query)
    cursor.execute(query)
    record = cursor.fetchall()
    if len(record) == 0:
        print("There is no scene to change with this query")
        return
    print("Scenes numbers: {}".format(len(record)))
    edit = 0
    progressbar_Index = 0
    progress = progressbar.ProgressBar(redirect_stdout=True).start(len(record))
    for row in record:
        progress.update(progressbar_Index + 1)
        progressbar_Index += 1
        scene_ID = str(row[0])
        scene_fullPath = str(row[1])
        scene_Directory = os.path.dirname(scene_fullPath)
        scene_Extension = os.path.splitext(scene_fullPath)[1]
        scene_Title = str(row[2])
        scene_Date = str(row[3])
        scene_Studio_id = str(row[4])
        scene_height = str(row[5])
        # By default, title contains extensions.
        scene_Title = re.sub(scene_Extension + '$', '', scene_Title)

        #  Look for duplicate title, if a other scene have same date and title it will skip it.
        cursor.execute("SELECT path FROM scenes WHERE title=? AND date=? AND NOT id=?;", [scene_Title, scene_Date, scene_ID])
        duplicateCheck = cursor.fetchall()
        if (len(duplicateCheck) > 0):
            problem = 0
            for dupl_row in duplicateCheck:
                if (os.path.dirname(str(dupl_row[0])) == scene_Directory):
                    with open('output.txt', 'a', encoding='utf-8') as f:
                        f.write('Duplicated title detected!\n')
                        f.write('{} - {}\n'.format(scene_ID, scene_Title))
                        f.write('{} - {}\n'.format(os.path.dirname(str(dupl_row[0])), scene_Directory))
                        problem = 1
            if (problem == 1):
                print("\n")
                continue

        performer_name = get_Perf_fromSceneID(scene_ID)

        studio_name = ""
        if (scene_Studio_id and scene_Studio_id != "None"):
            studio_name = get_Studio_fromID(scene_Studio_id)

        if scene_height == '4320':
            scene_height='8k'
        else:
            if scene_height == '2160':
                scene_height='4k'
            else:
                scene_height="{}p".format(scene_height)

        scene_information = {
            "title": scene_Title,
            "date": scene_Date,
            "performer": performer_name,
            "studio": studio_name,
            "height": scene_height
        }

        newfilename = makeFilename(scene_information, queryfilename) + scene_Extension

        # Remove illegal character for Windows ('#' and ',' is not illegal you can remove it)
        newfilename = re.sub('[\\/:"*?<>|#,]+', '', newfilename)
        newpath = scene_Directory + "\\" + newfilename
        if len(newpath) > 240:
            print("The Path is too long...\n", newpath)
            reducePath = len(scene_Directory) + len(scene_Date) + len(scene_Title) + len(scene_Extension) + 3
            if reducePath < 240:
                newpath = scene_Directory + "\\" + \
                    makeFilename(scene_information,"$date - $title") + scene_Extension
                print("Reducing path to: ", newpath)
        if (newpath == scene_fullPath):
            #print("Files already renamed (Db).\n")
            continue
        else:
            #print("ID: ", scene_ID)
            #print("Path: ", scene_fullPath)
            #print("Directory:", scene_Directory)
            #print("Extension: ", scene_Extension)
            #print("Title: ", scene_Title)
            #print("Date: ", scene_Date)
            #print("Studio ID: ", scene_Studio_id)
            #print("Performer name: ", performer_name)
            #print("Studio name: ", studio_name)
            #print("Resolution: ", scene_height)
            #print("-------------")
            print("OLD Filename: ", os.path.basename(scene_fullPath))  # Get filename
            print("NEW Filename: ", newfilename)
            print("NEW Path: ", newpath)

            #
            # THIS PART WILL EDIT YOUR DATABASE, FILES (be careful and know what you do)
            #
            # Windows Rename
            if (os.path.isfile(scene_fullPath) == True):
                if DRY_RUN == False:
                    os.rename(scene_fullPath, newpath)
                    if (os.path.isfile(newpath) == True):
                        print("File Renamed!")
                        if USING_LOG == True:
                            print("{}|{}|{}\n".format(scene_ID,scene_fullPath,newpath), file=open("rename_log.txt", "a", encoding='utf-8'))
                        # Database rename
                        cursor.execute("UPDATE scenes SET path=? WHERE id=?;", [newpath, scene_ID])
                        edit += 1
                        # I update the database every 10 files, you can change this number.
                        if (edit > 10):
                            sqliteConnection.commit()
                            print("[Database] Datebase Updated!")
                            edit = 0
                    else:
                        print("File failed to rename ?\n{}".format(newpath), file=open("output.txt", "a", encoding='utf-8'))
                else:
                    print("[DRY_RUN] File should be renamed")
                    print("{} -> {}\n".format(scene_fullPath,newpath), file=open("rename_dryrun.txt", "a", encoding='utf-8'))
            else:
                print("File don't exist in your Disk/Drive")
            print("\n")
        # break
    progress.finish()
    if DRY_RUN == False:
        sqliteConnection.commit()
    return


try:
    sqliteConnection = sqlite3.connect(DB_PATH)
    cursor = sqliteConnection.cursor()
    print("Python successfully connected to SQLite\n")
except sqlite3.Error as error:
    print("FATAL SQLITE Error: ", error)
    input("Press Enter to continue...")
    exit(1)

## THIS PART IS PERSONAL THINGS, YOU SHOULD CHANGE THING BELOW :)

# Select Scene with Specific Tags
tags_dict = {
    '1': {
        'tag': '1. JAV',
        'filename': '$title'
    },
    '2': {
        'tag': '1. Anime',
        'filename': '$date $title'
    },
    '3': {
        'tag': '1. Western',
        'filename': '$date $performer - $title [$studio]'
    }
}

for _, dict_section in tags_dict.items():
    tag_name = dict_section.get("tag")
    filename_template = dict_section.get("filename")
    id_tags = gettingTagsID(tag_name)
    if id_tags is not None:
        id_scene = get_SceneID_fromTags(id_tags)
        option_sqlite_query = "WHERE id in ({}) AND path LIKE 'E:\\Film\\R18\\%'".format(id_scene)
        edit_db(filename_template,option_sqlite_query)
        print("====================")

# Select ALL scenes
#edit_db("$date $performer - $title [$studio]")

## END OF PERSONAL THINGS

if DRY_RUN == False:
    sqliteConnection.commit()
cursor.close()
sqliteConnection.close()
print("The SQLite connection is closed")
# Input if you want to check the console.
input("Press Enter to continue...")
