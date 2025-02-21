import stashapi.log as log
from stashapi.stashapp import StashInterface
import stashapi.marker_parse as mp
import yaml
import json
import os
import sys
import xml.etree.ElementTree as ET
import zipfile

per_page = 100


def processGallery(g):
    # Read ComicInfo.xml File
    if len(g["files"]) == 0:
        log.info(g["id"] + " is not an archive. No scanning for Comic Metadata.")
        return
    comicInfo = False
    with zipfile.ZipFile(g["files"][0]["path"], "r") as archive:
        archivecontent = [x.lower() for x in archive.namelist()]
        for archivefile in archivecontent:
            if archivefile.lower() == "comicinfo.xml":
                comicInfo = ET.fromstring(archive.read("ComicInfo.xml"))
    if not comicInfo:
        log.info(
            g["files"][0]["path"]
            + " does not contain a ComicInfo.xml file. No scan will be triggered."
        )
        return

    # Adjust names for giving ids
    for key in ImportList.keys():
        if ImportList[key] == "tags":
            ImportList[key] = "tag_ids"
        if ImportList[key] == "performers":
            ImportList[key] = "performer_ids"
        if ImportList[key] == "studio":
            ImportList[key] = "studio_id"

    # Get Metadata from ComicInfo.xml
    galleryData = {"id": g["id"]}
    for item in ImportList.keys():
        value = comicInfo.find(item)
        if value != None:
            galleryData[ImportList[item]] = value.text
    chapterData = []
    pageData = comicInfo.find("Pages")
    if pageData:
        for page in pageData:
            if page.get("Bookmark"):
                chapterData.append(
                    {
                        "image_index": int(page.get("Image")) + 1,
                        "title": page.get("Bookmark"),
                    }
                )
            if page.get("Type"):
                chapterData.append(
                    {
                        "image_index": int(page.get("Image")) + 1,
                        "title": page.get("Type"),
                    }
                )

    # Adjust the retrieved data if necessary
    for data in galleryData.keys():
        if data in ["tag_ids", "performer_ids"]:
            galleryData[data] = [x.strip() for x in galleryData[data].split(",")]
        if data == "tag_ids":
            tagids = []
            for tag in galleryData[data]:
                tagids.append(stash.find_tag(tag, create=True)["id"])
            galleryData[data] = tagids
        if data == "performer_ids":
            performerids = []
            for performer in galleryData[data]:
                performerids.append(stash.find_performer(performer, create=True)["id"])
            galleryData[data] = performerids
        if data == "studio_id":
            galleryData[data] = stash.find_studio(galleryData[data], create=True)["id"]
        if data == "date":
            galleryData[data] = galleryData[data] + "-01-01"
        if data == "organized":
            galleryData[data] = eval(galleryData[data].lower().capitalize())
        if data == "rating100":
            galleryData[data] = int(galleryData[data])

    # Add Chapter if it does not exist and finally update Gallery Metadata
    for chapter in chapterData:
        addChapter = True
        for existingChapter in g["chapters"]:
            if (
                existingChapter["title"] == chapter["title"]
                and existingChapter["image_index"] == chapter["image_index"]
            ):
                addChapter = False
        if addChapter:
            stash.create_gallery_chapter(
                {
                    "title": chapter["title"],
                    "image_index": chapter["image_index"],
                    "gallery_id": g["id"],
                }
            )
    stash.update_gallery(galleryData)


def processAll():
    log.info("Getting gallery count")
    count = stash.find_galleries(f={}, filter={"per_page": 1}, get_count=True)[0]
    log.info(str(count) + " galleries to scan.")
    for r in range(1, int(count / per_page) + 1):
        log.info("processing " + str(r * per_page) + " - " + str(count))
        galleries = stash.find_galleries(f={}, filter={"page": r, "per_page": per_page})
        for g in galleries:
            processGallery(g)


# Start of the Program
json_input = json.loads(sys.stdin.read())
FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)

# Load Config
with open(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.yml"), "r"
) as f:
    try:
        config = yaml.safe_load(f)
    except yaml.YAMLError as exc:
        log.error("Could not load config.yml: " + str(exc))
        sys.exit(1)
try:
    ImportList = config["ImportList"]
except KeyError as key:
    log.error(
        str(key)
        + " is not defined in config.yml, but is needed for this script to proceed"
    )
    sys.exit(1)

if "mode" in json_input["args"]:
    PLUGIN_ARGS = json_input["args"]["mode"]
    if "process" in PLUGIN_ARGS:
        processAll()
elif "hookContext" in json_input["args"]:
    id = json_input["args"]["hookContext"]["id"]
    gallery = stash.find_gallery(id)
    processGallery(gallery)
