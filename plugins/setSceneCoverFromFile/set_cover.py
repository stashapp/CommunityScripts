import os
import re
import sys
import json
import base64

try:
    import stashapi.log as log
    from stashapi.tools import file_to_base64
    from stashapi.stashapp import StashInterface
except ModuleNotFoundError:
    print(
        "You need to install the stashapi module. (pip install stashapp-tools)",
        file=sys.stderr,
    )

MANUAL_ROOT = None  # /some/other/path to override scanning all stashes
cover_pattern = r"(?:thumb|poster|cover)\.(?:jpg|png)"


def main():
    global stash, mode_arg
    json_input = json.loads(sys.stdin.read())

    stash = StashInterface(json_input["server_connection"])
    mode_arg = json_input["args"]["mode"]

    try:
        if MANUAL_ROOT:
            scan(MANUAL_ROOT, handle_cover)
        else:
            for stash_path in get_stash_paths():
                scan(stash_path, handle_cover)
    except Exception as e:
        log.error(e)

    out = json.dumps({"output": "ok"})
    print(out + "\n")


def handle_cover(path, file):
    filepath = os.path.join(path, file)

    b64img = file_to_base64(filepath)
    if not b64img:
        log.warning(f"Could not parse {filepath} to b64image")
        return

    scenes = stash.find_scenes(
        f={"path": {"modifier": "INCLUDES", "value": f'{path}"'}}, fragment="id"
    )

    log.info(f'Found Cover: {[int(s["id"]) for s in scenes]}|{filepath}')

    if mode_arg == "set_cover":
        for scene in scenes:
            stash.update_scene({"id": scene["id"], "cover_image": b64img})
        log.info(f"Applied cover to {len(scenes)} scenes")


def get_stash_paths():
    config = stash.get_configuration("general { stashes { path excludeVideo } }")
    stashes = config["configuration"]["general"]["stashes"]
    return [s["path"] for s in stashes if not s["excludeVideo"]]


def scan(ROOT_PATH, _callback):
    log.info(f"Scanning {ROOT_PATH}")
    for root, dirs, files in os.walk(ROOT_PATH):
        for file in files:
            if re.match(cover_pattern, file, re.IGNORECASE):
                _callback(root, file)


if __name__ == "__main__":
    main()
