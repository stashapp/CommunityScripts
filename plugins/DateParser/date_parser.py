import os
import sys, json
from PythonDepManager import ensure_import
ensure_import("dateparser>=1.2.1")
ensure_import("stashapi:stashapp-tools")
import stashapi.log as log
from stashapi.stashapp import StashInterface
import re
from dateparser import parse


def main():
    global stash
    global pattern

    pattern = re.compile(
        r"\D((\d{4}|\d{1,2})[\._\- /\\](\d{1,2}|[a-zA-Z]{3,}\.*)[\._\- /\\](\d{4}|\d{1,2}))\D*"
    )
    json_input = json.loads(sys.stdin.read())
    mode_arg = json_input["args"]["mode"]

    stash = StashInterface(json_input["server_connection"])
    config = stash.get_configuration()["plugins"]
    settings = {"setTitle": False}
    if "date_parser" in config:
        settings.update(config["date_parser"])
    if mode_arg == "gallery":
        find_date_for_galleries(settings)


def parse_date_candidate(string):
    result = None
    for match in pattern.finditer(string):
        g0 = match.group(1)
        g1 = match.group(2)
        g2 = match.group(3)
        g3 = match.group(4)
        temp = parse(g1 + " " + g2 + " " + g3)
        if temp:
            potential_title = None
            _,ext = os.path.splitext(string)
            if not ext and g0 in os.path.basename(string):
                potential_title = os.path.basename(string).replace(g0, "").strip()
            result = [temp.strftime("%Y-%m-%d"), potential_title]
    return result


def find_date_for_galleries(settings):

    galleries = stash.find_galleries(f={"is_missing": "date"})

    total = len(galleries)

    log.info(f"Found {total} galleries")

    for i, gallery in enumerate(galleries):
        log.progress(i / total)
        acceptableDate = None
        
        for file in gallery.get("files", []):
            if candidate := parse_date_candidate(file["path"]):
                acceptableDate = candidate
        
        if "folder" in gallery and gallery["folder"]:
            if "path" in gallery["folder"] and gallery["folder"]["path"]:
                if candidate := parse_date_candidate(gallery["folder"]["path"]):
                    acceptableDate = candidate
        
        if acceptableDate:
            log.info(
                "Gallery ID ("
                + gallery.get("id")
                + ") has matched the date : "
                + acceptableDate[0]
            )
            updateObject = {"id": gallery.get("id"), "date": acceptableDate[0]}
            if settings['setTitle'] and not gallery.get("title") and acceptableDate[1]:
                updateObject["title"] = acceptableDate[1]
            stash.update_gallery(updateObject)


if __name__ == "__main__":
    main()
