import os, sys, json, logging, traceback
from pathlib import Path
from logging.handlers import RotatingFileHandler

# Setup file logging
log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scenerename.log")
file_logger = logging.getLogger("scenerename")
file_logger.setLevel(logging.DEBUG)
fh = RotatingFileHandler(log_file, maxBytes=2*1024*1024, backupCount=2)
fh.setFormatter(logging.Formatter("%(asctime)s %(levelname)s: %(message)s"))
file_logger.addHandler(fh)

try:
    import stashapi.log as log
    from stashapi.stashapp import StashInterface
except ModuleNotFoundError:
    print("stashapi not found", file=sys.stderr)
    sys.exit(1)

SCENE_FRAGMENT = "id title code studio {name} files {id path width height} date"


def get_json_input():
    return json.loads(sys.stdin.read())


def get_stash(json_input):
    conn = json_input["server_connection"]
    host = conn["Host"]
    if host == "0.0.0.0":
        host = "localhost"
    stash_conn = {
        "Scheme": conn["Scheme"],
        "Host": host,
        "Port": conn["Port"],
    }
    if conn.get("SessionCookie"):
        stash_conn["SessionCookie"] = conn["SessionCookie"]
    if conn.get("ApiKey"):
        stash_conn["ApiKey"] = conn["ApiKey"]
    return StashInterface(stash_conn)


def get_settings(json_input, stash):
    settings = {"dryRun": False, "debugTracing": False}
    try:
        config = stash.call_GQL("query Configuration { configuration { plugins }}")
        plugins_config = config.get("configuration", {}).get("plugins", {})
        if "scenerename" in plugins_config:
            s = plugins_config["scenerename"]
            settings["dryRun"] = s.get("dryRun", False)
            settings["debugTracing"] = s.get("debugTracing", False)
    except Exception:
        pass
    return settings


def replace_illegal_chars(filename):
    for ch in ["<", ">", '"', "/", "\\", "|", "?", "*"]:
        filename = filename.replace(ch, "-")
    return filename


def get_resolution_label(height):
    h = int(height)
    if h >= 2160:
        return "4K"
    elif h >= 1440:
        return "1440p"
    elif h >= 1080:
        return "1080p"
    elif h >= 720:
        return "720p"
    elif h >= 480:
        return "480p"
    return str(h) + "p"



def clean_title(title):
    """Replace colons with commas in the title."""
    if not title:
        return ""
    return title.replace(":", ",")


def form_filename(scene):
    """Build filename: Studio #Code - Title [Resolution]"""
    # Studio Name
    studio = scene.get("studio")
    studio_name = ""
    if studio:
        studio_name = studio.get("name", "")

    # Studio Code / Sequence
    code = scene.get("code") or ""

    # Resolution
    resolution = ""
    files = scene.get("files", [])
    if files:
        height = files[0].get("height")
        if height:
            resolution = get_resolution_label(height)

    # Full title with colons replaced by commas
    title = clean_title(scene.get("title", ""))

    # Skip files without a studio name
    if not studio_name:
        return None

    # Build: "Studio #Code - Title [Resolution]"
    # Start with studio name
    new_name = studio_name

    # Add code if present
    if code:
        new_name = "{} #{}".format(new_name, code)

    # Add title if present
    if title:
        new_name = "{} - {}".format(new_name, title)

    # Add resolution at the end in brackets
    if resolution:
        new_name = "{} [{}]".format(new_name, resolution)

    new_name = replace_illegal_chars(new_name)

    if len(new_name) > 240:
        new_name = new_name[:240]

    return new_name


def rename_scene(stash, scene_id, dry_run=False, debug=False):
    scene = stash.find_scene(scene_id, SCENE_FRAGMENT)
    if not scene:
        log.error("Scene {} not found".format(scene_id))
        return None

    files = scene.get("files", [])
    if not files:
        log.error("Scene {} has no files".format(scene_id))
        return None

    original_path = files[0]["path"]
    if not os.path.isfile(original_path):
        log.error("File does not exist: {}".format(original_path))
        return None

    original_name = Path(original_path).name
    ext = Path(original_path).suffix
    parent = Path(original_path).parent

    new_stem = form_filename(scene)
    if not new_stem:
        msg = "Could not form new filename - missing metadata (need at least one of: studio, code, title)"
        log.info(msg)
        file_logger.info(msg)
        return None

    new_name = new_stem + ext
    new_path = str(parent / new_name)

    if original_name == new_name:
        msg = "No change needed: {}".format(original_name)
        log.info(msg)
        file_logger.info(msg)
        return None

    # Handle duplicates - append (2), (3), etc. if target already exists
    if os.path.isfile(new_path) and new_path != original_path:
        counter = 2
        while True:
            dup_name = "{} ({}){}".format(new_stem, counter, ext)
            dup_path = str(parent / dup_name)
            if dup_path == original_path:
                # Already at the correct duplicate counter - no rename needed
                msg = "Already correctly named: {}".format(original_name)
                log.info(msg)
                file_logger.info(msg)
                return None
            if not os.path.isfile(dup_path):
                new_name = dup_name
                new_path = dup_path
                file_logger.warning("Duplicate detected, using: {}".format(new_name))
                break
            counter += 1

    prefix = "[DRY RUN] " if dry_run else ""
    msg = "{}Changing from '{}' to '{}'".format(prefix, original_name, new_name)
    log.info(msg)
    file_logger.info(msg)

    if debug:
        studio = scene.get("studio")
        studio_name = studio.get("name") if studio else "N/A"
        file_logger.debug("  Studio: {}".format(studio_name))
        file_logger.debug("  Code: {}".format(scene.get("code", "N/A")))
        file_logger.debug("  Title: {}".format(scene.get("title", "N/A")))
        file_logger.debug("  Height: {}".format(files[0].get("height", "N/A")))
        file_logger.debug("  Full path: {} -> {}".format(original_path, new_path))

    if dry_run:
        return new_stem

    try:
        os.rename(original_path, new_path)
        msg = "Renamed successfully: {}".format(new_path)
        log.info(msg)
        file_logger.info(msg)
        stash.metadata_scan(paths=[str(parent)])
    except OSError as e:
        msg = "Failed to rename: {}".format(e)
        log.error(msg)
        file_logger.error(msg)
        return None

    return new_stem


def main():
    json_input = get_json_input()
    stash = get_stash(json_input)
    settings = get_settings(json_input, stash)
    dry_run = settings["dryRun"]
    debug = settings["debugTracing"]

    mode = json_input.get("args", {}).get("mode", "")

    # Force dry run for the dry run task
    if mode == "dry_run_last":
        dry_run = True

    if mode in ("rename_last", "dry_run_last"):
        result = stash.call_GQL("query { allScenes { id updated_at } }")
        all_scenes = result.get("allScenes", [])
        if not all_scenes:
            log.info("No scenes found")
            return
        latest = max(all_scenes, key=lambda s: s["updated_at"])
        rename_scene(stash, latest["id"], dry_run=dry_run, debug=debug)
    else:
        # Hook mode - Scene.Update.Post
        try:
            hook_context = json_input["args"]["hookContext"]
            scene_id = hook_context["id"]
            rename_scene(stash, scene_id, dry_run=dry_run, debug=debug)
        except (KeyError, TypeError) as e:
            file_logger.error("Could not get scene ID from hook: {}".format(e))
            log.error("Could not get scene ID from hook: {}".format(e))


if __name__ == "__main__":
    main()
