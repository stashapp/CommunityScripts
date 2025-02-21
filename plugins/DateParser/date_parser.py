import sys, json

import stashapi.log as log
from stashapi.stashapp import StashInterface
import re
from dateparser import parse


def main():
    global stash
    global pattern

    pattern = re.compile(
        r"\D(\d{4}|\d{1,2})[\._\- /\\](\d{1,2}|[a-zA-Z]{3,}\.*)[\._\- /\\](\d{4}|\d{1,2})\D"
    )
    json_input = json.loads(sys.stdin.read())
    mode_arg = json_input["args"]["mode"]

    stash = StashInterface(json_input["server_connection"])

    if mode_arg == "gallery":
        find_date_for_galleries()


def find_date_for_galleries():

    galleries = stash.find_galleries(
        f={
            "is_missing": "date",
            "path": {"modifier": "MATCHES_REGEX", "value": ".zip$"},
            "file_count": {"modifier": "EQUALS", "value": 1},
        }
    )

    total = len(galleries)

    log.info(f"Found {total} galleries")

    for i, gallery in enumerate(galleries):
        log.progress(i / total)
        acceptableDate = None
        for file in gallery.get("files", []):
            for match in pattern.finditer(file["path"]):
                g1 = match.group(1)
                g2 = match.group(2)
                g3 = match.group(3)
                temp = parse(g1 + " " + g2 + " " + g3)
                if temp:
                    acceptableDate = temp.strftime("%Y-%m-%d")
        if acceptableDate:
            log.info(
                "Gallery ID ("
                + gallery.get("id")
                + ") has matched the date : "
                + acceptableDate
            )
            updateObject = {"id": gallery.get("id"), "date": acceptableDate}
            stash.update_gallery(updateObject)


if __name__ == "__main__":
    main()
