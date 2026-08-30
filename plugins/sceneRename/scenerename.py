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

SCENE_FRAGMENT = "id title code studio {name} files {id path width height parent_folder {id}} date custom_fields"

ORIGINAL_NAME_FIELD = "original_filename"

# Filesystem name limits are in bytes, not characters (255 on ext4/btrfs).
NAME_MAX_BYTES = 255

# Illegal or troublesome in filenames. ":" is here because clean_title() only
# strips it from titles - studio names and codes reach the filename untouched.
ILLEGAL_CHARS = ["<", ">", '"', "/", "\\", "|", "?", "*", ":"]


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
    for ch in ILLEGAL_CHARS:
        filename = filename.replace(ch, "-")

    # Control characters (NUL, newline, tab) are legal on Linux but make the
    # file miserable to handle in a shell, over SMB, or on any other platform.
    filename = "".join(
        " " if ord(c) < 32 or ord(c) == 127 else c for c in filename
    )

    # Tidy up the whitespace those substitutions can leave behind.
    filename = " ".join(filename.split())

    # A leading dot hides the file; trailing dots and spaces break elsewhere.
    return filename.strip(" .")


def truncate_to_bytes(name, max_bytes):
    """Trim to a byte budget without splitting a multi-byte character."""
    if len(name.encode("utf-8")) <= max_bytes:
        return name
    trimmed = name.encode("utf-8")[:max_bytes].decode("utf-8", "ignore")
    return trimmed.strip(" .")


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


def form_filename(scene, max_stem_bytes=NAME_MAX_BYTES):
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

    # Studio and title are both required. Without a title the name collapses to
    # just the studio (plus resolution), which is worse than the original.
    if not studio_name or not title.strip():
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
    new_name = truncate_to_bytes(new_name, max_stem_bytes)

    # Sanitising can empty the stem, e.g. a studio and title of only dots.
    if not new_name:
        return None

    return new_name


def record_original_name(stash, scene, original_name):
    """Save the pre-rename basename to the scene's custom fields.

    Only written once, so the earliest known filename survives later renames.
    Uses a partial update so any other custom fields are left alone.
    """
    existing = scene.get("custom_fields") or {}
    if existing.get(ORIGINAL_NAME_FIELD):
        return

    try:
        stash.update_scene({
            "id": scene["id"],
            "custom_fields": {"partial": {ORIGINAL_NAME_FIELD: original_name}},
        })
        file_logger.info("  Recorded {} = {}".format(ORIGINAL_NAME_FIELD, original_name))
    except Exception as e:
        # Bookkeeping failure must not be reported as a failed rename.
        msg = "Renamed, but could not record original filename: {}".format(e)
        log.warning(msg)
        file_logger.warning(msg)


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

    # Budget the stem in bytes, leaving room for the extension and a possible
    # " (2)" duplicate suffix.
    max_stem_bytes = NAME_MAX_BYTES - len(ext.encode("utf-8")) - len(" (999)")
    new_stem = form_filename(scene, max_stem_bytes)
    if not new_stem:
        missing = []
        if not (scene.get("studio") or {}).get("name"):
            missing.append("studio")
        if not clean_title(scene.get("title", "")).strip():
            missing.append("title")
        msg = "Skipping '{}' - missing required metadata: {}".format(
            original_name, ", ".join(missing))
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

    # Let Stash do the rename via moveFiles: it renames on disk and updates the
    # file record in one transaction, so no rescan is needed and the DB never
    # points at a stale path. A destination folder is required even for an
    # in-place rename, so pass the file's current one.
    move_input = {
        "ids": [files[0]["id"]],
        "destination_basename": new_name,
    }
    parent_folder = files[0].get("parent_folder") or {}
    if parent_folder.get("id"):
        move_input["destination_folder_id"] = parent_folder["id"]
    else:
        move_input["destination_folder"] = str(parent)

    try:
        stash.move_files(move_input)
        msg = "Renamed successfully: {}".format(new_path)
        log.info(msg)
        file_logger.info(msg)
        record_original_name(stash, scene, original_name)
    except Exception as e:
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
