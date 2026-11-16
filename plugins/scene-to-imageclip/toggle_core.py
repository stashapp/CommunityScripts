"""Pure helpers for the scene-to-imageclip clip/scene toggle: routes, paths, preflight, field mapping,
journal states. The batch tasks share the clip-name and image-extension helpers.

No I/O. Anything that touches the disk is injected (`exists`, `isfile`), so the
unit tests never read or write a real library path.

Paths are the paths Stash reports. A path that starts with a drive letter (`C:\\`) or
`\\\\` is handled with Windows rules (either separator, case-insensitive matching);
anything else with POSIX rules.
"""
from __future__ import annotations

import json
import ntpath
import os
import posixpath
import re
from dataclasses import dataclass

MODES = ("to_clip", "to_scene")
DEFAULT_CLIP_EXT = "vclip"
VCLIP_SUFFIX = "." + DEFAULT_CLIP_EXT  # always recognised as a clip name, whatever the setting
_CLIP_EXT_RE = re.compile(r"^[a-z0-9]{1,16}$")
CLIP_TAG = "imageclip"
_WIN_PATH = re.compile(r"^(?:[A-Za-z]:(?:[\\/]|$)|\\\\)")


@dataclass(frozen=True)
class Refusal:
    code: str
    message: str


@dataclass(frozen=True)
class Plan:
    kind: str       # "rename_in_place" | "move_and_rename" | "move"
    new_path: str
    moves: bool


# ── paths ────────────────────────────────────────────────────────────────────

def is_windows_path(path):
    return bool(_WIN_PATH.match(path or ""))


def pathmod(path):
    """ntpath for a Windows-style path, posixpath otherwise."""
    return ntpath if is_windows_path(path) else posixpath


def _norm_root(path):
    """Strip whitespace and trailing separators; a filesystem root stays a root."""
    p = (path or "").strip()
    if is_windows_path(p):
        p = p.rstrip("\\/")
        if re.fullmatch(r"[A-Za-z]:", p):
            p += "\\"
        return p
    if len(p) > 1:
        p = p.rstrip("/") or "/"
    return p


def _key(path):
    """Comparison key: Windows paths compare case-insensitively with either separator."""
    return ntpath.normcase(path) if is_windows_path(path) else path


def same_path(a, b):
    return _key(_norm_root(a)) == _key(_norm_root(b))


def _inside(path, root):
    """True when `path` is `root` or under it, on whole path components."""
    if is_windows_path(path) != is_windows_path(root):
        return False
    p, r = _key(path), _key(root)
    if is_windows_path(root):
        if r.endswith("\\"):
            return p.startswith(r)
        return p == r or p.startswith(r + "\\")
    if r == "/":
        return p.startswith("/")
    return p == r or p.startswith(r + "/")


def find_root(path, stashes):
    """Longest library root containing `path`, matched on whole path components."""
    best, best_len = None, -1
    for stash in stashes or []:
        root = _norm_root(stash.get("path"))
        if not root:
            continue
        if _inside(path, root) and len(root) > best_len:
            best, best_len = stash, len(root)
    return best


def clip_ext_from_setting(value):
    """(extension, malformed) from the clipExtension setting.

    The extension is bare and lower case (a leading dot is dropped). Empty or unset gives
    the default, vclip; so does a value that is not 1-16 letters and digits, and then
    `malformed` is True so the caller can log it.
    """
    if value is None or (isinstance(value, str) and not value.strip()):
        return DEFAULT_CLIP_EXT, False
    if not isinstance(value, str):
        return DEFAULT_CLIP_EXT, True
    ext = value.strip().lstrip(".").lower()
    if not _CLIP_EXT_RE.match(ext):
        return DEFAULT_CLIP_EXT, True
    return ext, False


def _ext_set(exts):
    return {str(e).lower().lstrip(".") for e in exts or []}


def clip_ext_refusal(clip_ext, video_exts):
    """A Refusal when the clip extension is one of Stash's video extensions, else None.

    A file named <name>.mp4.mp4 would be scanned as a scene again, so such an extension
    cannot mark an image clip.
    """
    if clip_ext in _ext_set(video_exts):
        return Refusal("clip_ext_is_video",
                       "the image clip extension '%s' is a video extension; set another one "
                       "(default vclip)" % clip_ext)
    return None


def clip_suffixes(clip_ext=DEFAULT_CLIP_EXT):
    """Suffixes that mark an image clip by name: the configured one, then .vclip."""
    own = "." + clip_ext
    return (own,) if own == VCLIP_SUFFIX else (own, VCLIP_SUFFIX)


def clip_suffix(basename, clip_ext=DEFAULT_CLIP_EXT):
    """The clip suffix `basename` ends with, in its own spelling, or ""."""
    low = (basename or "").lower()
    for suffix in clip_suffixes(clip_ext):
        if low.endswith(suffix):
            return basename[-len(suffix):]
    return ""


def has_clip_suffix(basename, clip_ext=DEFAULT_CLIP_EXT):
    return bool(clip_suffix(basename, clip_ext))


def strip_clip_suffix(basename, clip_ext=DEFAULT_CLIP_EXT):
    suffix = clip_suffix(basename, clip_ext)
    return basename[: -len(suffix)] if suffix else basename


def clip_ext_configured(image_extensions, clip_ext=DEFAULT_CLIP_EXT):
    """True when Stash's image extensions include the clip extension (any case, with or without a dot)."""
    return clip_ext in _ext_set(image_extensions)


def is_video_name(basename, video_exts, clip_ext=DEFAULT_CLIP_EXT):
    name = strip_clip_suffix(basename, clip_ext)
    stem, dot, ext = name.rpartition(".")
    if not dot or not stem:
        return False
    return ext.lower() in _ext_set(video_exts)


def collision_name(basename, source_id, clip_ext=DEFAULT_CLIP_EXT):
    """Insert `.toggle-<id>` before the media extension, keeping any clip suffix.

    a.mp4 -> a.toggle-1.mp4; a.mp4.vclip -> a.toggle-1.mp4.vclip; a.b.mp4 -> a.b.toggle-1.mp4
    """
    media = strip_clip_suffix(basename, clip_ext)
    suffix = basename[len(media):]
    stem, dot, ext = media.rpartition(".")
    if not dot or not stem:
        return "%s.toggle-%s%s" % (media, source_id, suffix)
    return "%s.toggle-%s.%s%s" % (stem, source_id, ext, suffix)


def scans_both(stash):
    return not stash.get("excludeVideo") and not stash.get("excludeImage")


def plan_route(mode, path, root, dest_root, source_id, exists, clip_ext=DEFAULT_CLIP_EXT):
    """Where the file goes. Returns a Plan or a Refusal. `exists(path) -> bool` is injected.

    to_clip adds `.<clip_ext>`; to_scene strips whichever clip suffix the name carries
    (the configured one or .vclip)."""
    pm = pathmod(path)
    folder, base = pm.split(path)
    dest = _norm_root(dest_root)
    scans_images = not root.get("excludeImage")
    scans_video = not root.get("excludeVideo")
    if mode == "to_clip":
        if has_clip_suffix(base, clip_ext):
            return Refusal("already_clip_route", "file already carries an image clip suffix")
        suffix = "." + clip_ext
        if scans_images:
            kind, new_path = "rename_in_place", pm.join(folder, base + suffix)
        else:
            kind, new_path = "move_and_rename", pathmod(dest).join(dest, base + suffix)
    elif mode == "to_scene":
        if has_clip_suffix(base, clip_ext):
            media = strip_clip_suffix(base, clip_ext)
            if scans_video:
                kind, new_path = "rename_in_place", pm.join(folder, media)
            else:
                kind, new_path = "move_and_rename", pathmod(dest).join(dest, media)
        elif not scans_video:
            kind, new_path = "move", pathmod(dest).join(dest, base)
        else:
            return Refusal("already_scene_route", "a video-scanning root already treats this file as a scene")
    else:
        return Refusal("bad_args", "mode must be to_clip or to_scene")
    if exists(new_path):
        npm = pathmod(new_path)
        parent, new_base = npm.split(new_path)
        new_path = npm.join(parent, collision_name(new_base, source_id, clip_ext))
        if exists(new_path):
            return Refusal("collision", "target name and its suffixed fallback are both taken")
    return Plan(kind, new_path, kind != "rename_in_place")


# ── preflight, field mapping, backup ─────────────────────────────────────────

BACKUP_KEY = "clip_scene_toggle"
BACKUP_VERSION = 1
SCAN_MIN_BYTES_PER_S = 10 * 1024 * 1024  # assumed slowest read rate for a full-file hash

# GraphQL selection sets for the source entity.
SCENE_FIELDS = """
  id title code details director urls date rating100 organized
  o_counter o_history play_history play_duration resume_time
  interactive captions { caption_type }
  studio { id } performers { id } tags { id } galleries { id }
  groups { group { id } scene_index }
  stash_ids { endpoint stash_id updated_at }
  scene_markers { id title seconds end_seconds primary_tag { id } tags { id } }
  custom_fields
  files { __typename id path size }
"""

IMAGE_FIELDS = """
  id title code details photographer urls date rating100 organized o_counter
  studio { id } performers { id } tags { id name } galleries { id }
  custom_fields
  visual_files {
    __typename
    ... on VideoFile { id path size }
    ... on ImageFile { id path }
  }
"""

COMMON_FIELDS = ("title", "code", "details", "date", "rating100", "organized", "urls",
                 "studio", "performers", "tags", "galleries")
# (key inside the backup payload, field name reported in carried/dropped)
BACKUP_FIELDS = (("o_history", "o_history"), ("play_history", "play_history"),
                 ("play_duration", "play_duration"), ("resume_time", "resume_time"),
                 ("groups", "groups"), ("stash_ids", "stash_ids"), ("markers", "scene_markers"))


def normalize_id(value):
    """Entity id from the UI as a canonical string, or None. Accepts 42 or "42"."""
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return str(value) if value > 0 else None
    if isinstance(value, str):
        s = value.strip()
        if s.isdigit() and int(s) > 0:
            return str(int(s))
    return None


def dest_root_from_setting(value, stashes=None):
    """The destinationRoot setting, normalized.

    Empty, whitespace or unset -> the first library root that scans both images and
    video, or "" when there is none (preflight then refuses with bad_destination_root).
    """
    if not isinstance(value, str) or not value.strip():
        for stash in stashes or []:
            root = _norm_root(stash.get("path"))
            if root and scans_both(stash):
                return root
        return ""
    value = _norm_root(value)
    # Build paths from the library root's own spelling: Stash stores and returns paths as
    # configured, and the post-scan lookup compares them byte for byte.
    for stash in stashes or []:
        if same_path(stash.get("path"), value):
            return _norm_root(stash.get("path"))
    return value


def source_files(mode, entity):
    key = "files" if mode == "to_clip" else "visual_files"
    return list((entity or {}).get(key) or [])


def primary_file(mode, entity):
    """The file the toggle converts, or None when the item has no file.

    Stash's schema has no primary-file field on Scene or Image; its file loader returns
    the primary file first, so the first entry of `files` (scene) or `visual_files`
    (image) is the primary. A multi-file item converts this file only; the others stay
    on the old record.
    """
    files = source_files(mode, entity)
    return files[0] if files else None


def remaining_file_ids(mode, entity):
    """Ids of the files that stay on the old record (every file but the primary)."""
    return [str(f.get("id")) for f in source_files(mode, entity)[1:]]


def preflight(mode, entity, config, dest_root, isfile=os.path.isfile, clip_ext=DEFAULT_CLIP_EXT):
    """Checks run on the primary file before anything changes. Returns a Refusal or None.

    `config` is configuration.general. A multi-file item is not refused: only its
    primary file is converted (except with Calculate MD5 on, see below).
    """
    refusal = clip_ext_refusal(clip_ext, config.get("videoExtensions"))
    if refusal is not None:
        return refusal
    if not clip_ext_configured(config.get("imageExtensions"), clip_ext):
        return Refusal("clip_ext_not_configured", "add %s to image extensions" % clip_ext)
    primary = primary_file(mode, entity)
    if primary is None:
        return Refusal("no_file", "item has no file")
    path = primary.get("path") or ""
    if primary.get("__typename") != "VideoFile" or not is_video_name(
            pathmod(path).basename(path), config.get("videoExtensions"), clip_ext):
        return Refusal("not_video", "file is not a video")
    if not isfile(path):
        return Refusal("file_missing", "file is not on disk")
    stashes = config.get("stashes") or []
    if find_root(path, stashes) is None:
        return Refusal("outside_library", "file is outside every library root")
    dest = _norm_root(dest_root)
    if not dest or not any(same_path(s.get("path"), dest) and scans_both(s) for s in stashes):
        return Refusal("bad_destination_root",
                       "destination root must be a library root that scans images and video")
    if config.get("calculateMD5") and remaining_file_ids(mode, entity):
        return Refusal("md5_multi_file",
                       "with Calculate MD5 for videos on, items with more than one file cannot be converted")
    return None


def _ids(items):
    return [str(x["id"]) for x in items or []]


def user_custom_fields(custom_fields):
    return {k: v for k, v in (custom_fields or {}).items() if k != BACKUP_KEY}


def _common_input(src):
    """Update input for the fields carried both ways. Galleries go in a separate update."""
    inp = {}
    for key in ("title", "code", "details", "date", "rating100"):
        if src.get(key) not in (None, ""):
            inp[key] = src[key]
    inp["organized"] = bool(src.get("organized"))
    inp["urls"] = list(src.get("urls") or [])
    if src.get("studio"):
        inp["studio_id"] = str(src["studio"]["id"])
    inp["performer_ids"] = _ids(src.get("performers"))
    inp["tag_ids"] = _ids(src.get("tags"))
    custom = user_custom_fields(src.get("custom_fields"))
    if custom:
        inp["custom_fields"] = {"full": custom}
    return inp


def gallery_ids(src):
    return _ids(src.get("galleries"))


def scene_to_image_input(scene):
    """ImageUpdateInput fields (without id) carried from a scene (to_clip)."""
    inp = _common_input(scene)
    if scene.get("director"):
        inp["photographer"] = scene["director"]
    return inp


def is_clip_tag(name):
    """True for the imageclip tag and its spellings (Image Clip, image_clip, image-clip...)."""
    return (name or "").lower().replace(" ", "").replace("_", "").replace("-", "") == CLIP_TAG


def image_to_scene_input(image):
    """SceneUpdateInput fields (without id) carried from an image (to_scene).

    The imageclip tag (any spelling) is left off: the Rename task would otherwise turn the
    new scene straight back into a clip.
    """
    inp = _common_input(image)
    inp["tag_ids"] = [str(t["id"]) for t in image.get("tags") or [] if not is_clip_tag(t.get("name"))]
    if image.get("photographer"):
        inp["director"] = image["photographer"]
    return inp


def build_backup(scene):
    """Scene-only data parked on the image under custom_fields[BACKUP_KEY]."""
    return {
        "v": BACKUP_VERSION,
        "o_history": list(scene.get("o_history") or []),
        "play_history": list(scene.get("play_history") or []),
        "play_duration": scene.get("play_duration") or 0,
        "resume_time": scene.get("resume_time") or 0,
        "groups": [{"group_id": str(g["group"]["id"]), "scene_index": g.get("scene_index")}
                   for g in scene.get("groups") or []],
        "stash_ids": [{"endpoint": s["endpoint"], "stash_id": s["stash_id"],
                       "updated_at": s.get("updated_at")} for s in scene.get("stash_ids") or []],
        "markers": [{"title": m.get("title") or "", "seconds": m["seconds"],
                     "end_seconds": m.get("end_seconds"),
                     "primary_tag_id": str(m["primary_tag"]["id"]), "tag_ids": _ids(m.get("tags"))}
                    for m in scene.get("scene_markers") or []],
    }


def backup_has_content(backup):
    return any(bool(v) for k, v in backup.items() if k != "v")


def _is_num(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def _is_id(x):
    return (isinstance(x, str) and x.strip() != "") or (isinstance(x, int) and not isinstance(x, bool))


def _ok_group(g):
    return isinstance(g, dict) and _is_id(g.get("group_id")) and (
        g.get("scene_index") is None or (isinstance(g.get("scene_index"), int) and not isinstance(g.get("scene_index"), bool)))


def _ok_stash_id(s):
    return (isinstance(s, dict) and isinstance(s.get("endpoint"), str) and isinstance(s.get("stash_id"), str)
            and (s.get("updated_at") is None or isinstance(s.get("updated_at"), str)))


def _ok_marker(m):
    return (isinstance(m, dict) and _is_num(m.get("seconds")) and _is_id(m.get("primary_tag_id"))
            and (m.get("title") is None or isinstance(m.get("title"), str))
            and (m.get("end_seconds") is None or _is_num(m.get("end_seconds")))
            and isinstance(m.get("tag_ids") or [], list) and all(_is_id(t) for t in m.get("tag_ids") or []))


_LIST_CHECKS = (("o_history", "o_history", lambda t: isinstance(t, str)),
                ("play_history", "play_history", lambda t: isinstance(t, str)),
                ("groups", "groups", _ok_group),
                ("stash_ids", "stash_ids", _ok_stash_id),
                ("markers", "scene_markers", _ok_marker))


def check_backup(backup):
    """(usable backup or None, names of fields with bad items).

    Every item is checked before anything is restored, so a damaged backup cannot crash
    the toggle half way. Bad items are left out of the returned backup and named, so the
    caller keeps the old image (which still holds the original). A backup from an unknown
    future version is not used at all.
    """
    if not isinstance(backup, dict):
        return None, ["backup"]
    version = backup.get("v", BACKUP_VERSION)  # backups written before versioning are v1
    if version != BACKUP_VERSION:
        return None, ["backup"]
    clean, bad = {"v": BACKUP_VERSION}, []
    for key, name, ok in _LIST_CHECKS:
        items = backup.get(key)
        if items is None:
            clean[key] = []
            continue
        if not isinstance(items, list):
            clean[key] = []
            bad.append(name)
            continue
        good = [x for x in items if ok(x)]
        if len(good) < len(items):
            bad.append(name)
        clean[key] = good
    for key in ("play_duration", "resume_time"):
        value = backup.get(key)
        if value is None:
            clean[key] = 0
        elif _is_num(value):
            clean[key] = value
        else:
            clean[key] = 0
            bad.append(key)
    return clean, bad


def scan_budget(size_bytes, base_s):
    """Running time allowed for the one-file scan. A clip file is an image to Stash, which
    hashes the whole file (MD5), so the budget grows with the file size."""
    try:
        size = max(0, int(size_bytes or 0))
    except (TypeError, ValueError):
        size = 0
    return base_s + size // SCAN_MIN_BYTES_PER_S


def stray_file_row(entities, mode, new_path):
    """(entity id, file id) of the row a scan added at `new_path` to an existing item
    (duplicate_content), or None. Never the item's primary (first) file."""
    for e in entities or []:
        files = _found_files(e, mode)
        for i, f in enumerate(files):
            if i > 0 and isinstance(f, dict) and f.get("path") == new_path:
                return str(e["id"]), str(f.get("id"))
    return None


def encode_backup(backup):
    """Stored as a JSON string: a flat custom-field value, whatever Map nesting allows."""
    return json.dumps(backup, separators=(",", ":"), sort_keys=True)


def restore_plan(image_custom_fields):
    """(backup or None, custom fields without the backup key)."""
    rest = dict(image_custom_fields or {})
    raw = rest.pop(BACKUP_KEY, None)
    backup = None
    if isinstance(raw, dict):
        backup = raw
    elif isinstance(raw, str):
        try:
            parsed = json.loads(raw)
        except ValueError:
            parsed = None
        if isinstance(parsed, dict):
            backup = parsed
    return backup, rest


def backup_state(image_custom_fields):
    """"none" (no backup key), "ok" (a readable backup) or "corrupt" (key present, unreadable
    or from an unknown version)."""
    if BACKUP_KEY not in (image_custom_fields or {}):
        return "none"
    backup, _rest = restore_plan(image_custom_fields)
    if backup is None or check_backup(backup)[0] is None:
        return "corrupt"
    return "ok"


def backup_groups(backup):
    return [{"group_id": str(g["group_id"]), "scene_index": g.get("scene_index")}
            for g in (backup or {}).get("groups") or []]


def backup_scene_input(backup):
    """stash_ids for the sceneUpdate, from a backup. Groups are checked separately."""
    inp = {}
    if backup.get("stash_ids"):
        stash_ids = []
        for s in backup["stash_ids"]:
            item = {"endpoint": s["endpoint"], "stash_id": s["stash_id"]}
            if s.get("updated_at"):
                item["updated_at"] = s["updated_at"]
            stash_ids.append(item)
        inp["stash_ids"] = stash_ids
    return inp


def marker_input(scene_id, marker):
    """SceneMarkerCreateInput for one backed-up marker."""
    inp = {"scene_id": scene_id, "title": marker.get("title") or "",
           "seconds": marker["seconds"], "primary_tag_id": str(marker["primary_tag_id"]),
           "tag_ids": [str(t) for t in marker.get("tag_ids") or []]}
    if marker.get("end_seconds") is not None:
        inp["end_seconds"] = marker["end_seconds"]
    return inp


def o_count(value):
    """O-counter as a non-negative int (junk -> 0). No upper limit."""
    try:
        n = int(value or 0)
    except (TypeError, ValueError):
        n = 0
    return max(0, n)


def o_replay_plan(o_counter, backup):
    """(history timestamps to replay, extra O events stamped now) for to_scene.

    The image's current o_counter wins: the newest backed-up timestamps are kept, and
    O events added while it was a clip are replayed with the current time.
    """
    n = o_count(o_counter)
    history = sorted((backup or {}).get("o_history") or [], key=str)
    if n <= len(history):
        return history[len(history) - n:], 0
    return history, n - len(history)


def dropped_to_clip(scene):
    """Scene fields that an image cannot hold. The cover is always listed (it is regenerated)."""
    dropped = ["cover_image"]
    if scene.get("captions"):
        dropped.append("captions")
    if scene.get("interactive"):
        dropped.append("interactive")
    return dropped


def carried_and_dropped(mode, entity):
    """(carried field names, dropped field names) for the output contract."""
    carried = [f for f in COMMON_FIELDS if entity.get(f)]
    credit = "director" if mode == "to_clip" else "photographer"
    if entity.get(credit):
        carried.append(credit)
    if user_custom_fields(entity.get("custom_fields")):
        carried.append("custom_fields")
    if o_count(entity.get("o_counter")):
        carried.append("o_counter")
    if mode == "to_clip":
        carried += [name for _key, name in BACKUP_FIELDS if entity.get(name)]
        return carried, dropped_to_clip(entity)
    backup, _rest = restore_plan(entity.get("custom_fields"))
    if backup:
        carried += [name for key, name in BACKUP_FIELDS if backup.get(key)]
    return carried, []


def _found_files(entity, mode):
    return list((entity.get("visual_files") if mode == "to_clip" else entity.get("files")) or [])


def exact_path_matches(entities, new_path, mode):
    """Entities with a file whose path equals `new_path` exactly (case- and byte-exact).

    Stash's path EQUALS filter is an unescaped SQL LIKE: `_` and `%` act as wildcards and
    ASCII case is ignored, so the lookup can return unrelated items. Only an exact
    string match is trusted. Paths are compared here and never reported.
    """
    return [e for e in entities or []
            if any(isinstance(f, dict) and f.get("path") == new_path for f in _found_files(e, mode))]


def classify_found(entities, mode, source_file_id):
    """(new entity id, new file id, Refusal or None) from the post-scan lookup.

    Pass the result of exact_path_matches. A new item that shares the source's file row
    (Stash treated the rename as a move, as it does with Calculate MD5 on) is accepted:
    the caller then keeps that row when it destroys the old record. duplicate_content
    keeps no ids: the scan attached the renamed file to an existing item by fingerprint,
    and that item must not be destroyed.
    """
    entities = list(entities or [])
    if not entities:
        return None, None, Refusal("new_entity_not_found", "scan produced no item at the new path")
    if len(entities) > 1:
        return None, None, Refusal("ambiguous_new_entity", "%d items at the new path" % len(entities))
    entity = entities[0]
    files = _found_files(entity, mode)
    file_ids = [str(f.get("id")) for f in files]
    if len(files) > 1 and str(source_file_id) not in file_ids:
        return None, None, Refusal(
            "duplicate_content",
            "file matched an existing item by fingerprint, so Stash added it there instead of making a new item")
    if len(files) != 1:
        return None, None, Refusal("ambiguous_new_entity", "new item has %d files" % len(files))
    return str(entity["id"]), file_ids[0], None


def destroy_file_entry(old_file_id, new_file_id):
    """Destroy the old file row only when the new entity does not share it."""
    return str(old_file_id) != str(new_file_id)


# ── journal states ───────────────────────────────────────────────────────────

# Written before the rename and advanced as the toggle goes. A journal left behind by a
# killed toggle tells recovery what to do.
ROLL_BACK_STATES = ("renaming", "renamed", "scanning", "found")
COMPLETE_STATES = ("transferred",)


def recovery_action(journal, old_exists, new_exists):
    """What recovery does with a leftover journal, from its state and the disk.

    "discard": nothing changed on disk; drop the journal.
    "roll_back": destroy any new item, rename the file back, rescan the old path.
    "complete": the new item is finished; run the final step on the old record.
    "stuck": the disk does not match the journal; keep it for a person to look at.
    """
    state = (journal or {}).get("state")
    if state in COMPLETE_STATES:
        return "complete" if new_exists else "stuck"
    if state not in ROLL_BACK_STATES:
        return "stuck"
    if state == "renaming" and old_exists and not new_exists:
        return "discard"
    if new_exists and not old_exists:
        return "roll_back"
    if old_exists and not new_exists:
        return "roll_back"  # already renamed back; still clean up any new item and rescan
    return "stuck"
