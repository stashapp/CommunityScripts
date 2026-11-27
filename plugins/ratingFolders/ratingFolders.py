#!/usr/bin/env python3
# Rating Folders - a plugin for Stash (https://github.com/stashapp/stash)
# SPDX-License-Identifier: AGPL-3.0-only
"""Move a scene's file to the folder configured for its rating.

The file is moved with Stash's own `moveFiles` mutation, so Stash keeps
tracking it (no rescan needed). Safety rules:

* never deletes anything and never overwrites an existing file
  (a " (2)", " (3)"... suffix is added instead);
* never creates folders: the destination folder must already exist and be
  inside one of Stash's libraries (not excluded for videos);
* dry run is the default: nothing moves until "Move files for real" is on.

Only the Python standard library is used, so there is nothing to install.
"""

import json
import os
import re
import shutil
import sys
import urllib.error
import urllib.request

PLUGIN_ID = "ratingFolders"

SIDECAR_EXTS = {".funscript", ".srt", ".vtt", ".ass", ".ssa"}
# subtitle types Stash links to a scene's file (pkg/file/video/caption.go)
STASH_CAPTION_EXTS = {".srt", ".vtt"}
MAX_STEM_CHARS = 150
MAX_SUFFIX = 999
PER_PAGE = 100

SCENE_FIELDS = """
  id
  title
  code
  date
  rating100
  studio { name }
  performers { name }
  files { id path basename zip_file_id }
"""

FIND_SCENE = "query FindScene($id: ID!) { findScene(id: $id) { %s } }" % SCENE_FIELDS

FIND_RATED_SCENES = """
query FindRatedScenes($filter: FindFilterType, $scene_filter: SceneFilterType) {
  findScenes(filter: $filter, scene_filter: $scene_filter) {
    count
    scenes { %s }
  }
}
""" % SCENE_FIELDS

CONFIGURATION = """
query Configuration {
  configuration {
    general { stashes { path excludeVideo } excludes }
    plugins
  }
}
"""

MOVE_FILES = "mutation MoveFiles($input: MoveFilesInput!) { moveFiles(input: $input) }"

SCAN = "mutation Scan($input: ScanMetadataInput!) { metadataScan(input: $input) }"


# ---------------------------------------------------------------- logging --
# Stash reads plugin logs from stderr: SOH + level letter + STX + message.

def _log(level, msg):
    for line in str(msg).splitlines() or [""]:
        sys.stderr.write("\x01%s\x02%s\n" % (level, line))
    sys.stderr.flush()


def log_debug(msg):
    _log("d", msg)


def log_info(msg):
    _log("i", msg)


def log_warning(msg):
    _log("w", msg)


def log_error(msg):
    _log("e", msg)


def log_progress(fraction):
    _log("p", "%.4f" % max(0.0, min(1.0, fraction)))


# ------------------------------------------------------------- GraphQL ----

class StashError(Exception):
    pass


class Stash:
    """Minimal GraphQL client using the connection Stash hands to plugins."""

    def __init__(self, conn):
        host = conn.get("Host") or "127.0.0.1"
        # Stash listening on all interfaces: talk to it over IPv4 loopback.
        # ("localhost" can resolve to ::1 first and stall on Windows.)
        if host in ("0.0.0.0", "::", "[::]", "localhost"):
            host = "127.0.0.1"
        if ":" in host and not host.startswith("["):
            host = "[%s]" % host
        self.url = "%s://%s:%s/graphql" % (conn.get("Scheme") or "http", host, conn.get("Port") or 9999)
        self.headers = {"Content-Type": "application/json", "Accept": "application/json"}
        cookie = conn.get("SessionCookie") or {}
        if cookie.get("Name"):
            self.headers["Cookie"] = "%s=%s" % (cookie["Name"], cookie.get("Value", ""))
        if conn.get("ApiKey"):
            self.headers["ApiKey"] = conn["ApiKey"]

    def call(self, query, variables=None):
        body = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
        req = urllib.request.Request(self.url, data=body, headers=self.headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")[:500]
            raise StashError("HTTP %s from Stash: %s" % (exc.code, detail))
        except urllib.error.URLError as exc:
            raise StashError("cannot reach Stash at %s: %s" % (self.url, exc.reason))
        if payload.get("errors"):
            raise StashError("; ".join(e.get("message", str(e)) for e in payload["errors"]))
        return payload.get("data") or {}


# ------------------------------------------------------------- settings ---

class ConfigError(ValueError):
    pass


class Rule:
    def __init__(self, low, high, high_inclusive_exact, folder, text):
        self.low = low
        self.high = high
        self.high_inclusive_exact = high_inclusive_exact
        self.folder = folder
        self.text = text

    def matches(self, rating10):
        if rating10 < self.low:
            return False
        if self.high_inclusive_exact:
            return rating10 <= self.high
        # "7-8" means 7.0 up to (not including) 9.0, so 8.5 is covered too.
        return rating10 < self.high + 1


_NUM = r"(\d+(?:[.,]\d+)?)"
_RULE_RE = re.compile(r"^\s*" + _NUM + r"\s*(?:-\s*" + _NUM + r")?\s*=\s*(.+?)\s*$")


def _num(text):
    return float(text.replace(",", "."))


def parse_rules(text):
    """Parse "9-10=D:\\Top; 7-8=D:\\Keep; 1-4=D:\\Trash" (0-10 scale)."""
    rules = []
    for chunk in re.split(r"[;\n]", text or ""):
        if not chunk.strip():
            continue
        m = _RULE_RE.match(chunk)
        if not m:
            raise ConfigError("cannot read rule %r (expected e.g. 9-10=D:\\Videos\\Top)" % chunk.strip())
        low = _num(m.group(1))
        high = _num(m.group(2)) if m.group(2) else low
        if not (0 <= low <= 10 and 0 <= high <= 10) or low > high:
            raise ConfigError("rule %r: ratings go from 0 to 10, low to high" % chunk.strip())
        folder = m.group(3).strip().strip('"').strip()
        if not folder:
            raise ConfigError("rule %r has no folder" % chunk.strip())
        exact = m.group(2) is not None and ("." in m.group(2) or "," in m.group(2))
        if m.group(2) is None:
            exact = "." in m.group(1) or "," in m.group(1)
        rules.append(Rule(low, high, exact, folder, chunk.strip()))
    return rules


def folder_for_rating(rules, rating100):
    rating10 = rating100 / 10.0
    for rule in rules:
        if rule.matches(rating10):
            return rule
    return None


class Config:
    def __init__(self, settings, libraries, excludes):
        self.rules = parse_rules(settings.get("rules") or "")
        self.unrated_folder = (settings.get("unratedFolder") or "").strip().strip('"').strip()
        self.template = (settings.get("renameTemplate") or "").strip()
        self.dry_run = not bool(settings.get("moveForReal"))
        self.move_sidecars = not bool(settings.get("leaveSidecars"))
        self.libraries = libraries  # list of (path, exclude_video)
        self.excludes = excludes
        if self.template:
            unknown = sorted(set(re.findall(r"\{([^{}]*)\}", self.template)) - set(PLACEHOLDERS))
            if unknown:
                raise ConfigError("unknown placeholder(s) in rename template: %s (allowed: %s)"
                                  % (", ".join("{%s}" % u for u in unknown),
                                     ", ".join("{%s}" % p for p in PLACEHOLDERS)))


def load_config(stash):
    data = stash.call(CONFIGURATION).get("configuration") or {}
    plugins = data.get("plugins") or {}
    settings = plugins.get(PLUGIN_ID) or {}
    general = data.get("general") or {}
    libraries = [(s.get("path") or "", bool(s.get("excludeVideo"))) for s in general.get("stashes") or []]
    libraries = [lib for lib in libraries if lib[0]]
    return Config(settings, libraries, general.get("excludes") or [])


# ---------------------------------------------------------------- naming --

PLACEHOLDERS = ("title", "studio", "performers", "date", "year", "code", "rating", "original")

_ILLEGAL_MAP = {
    ":": " - ", "/": "-", "\\": "-", "|": "-", '"': "'",
    "?": "", "*": "", "<": "", ">": "",
}
_RESERVED = {"CON", "PRN", "AUX", "NUL"} | {"COM%d" % i for i in range(1, 10)} | {"LPT%d" % i for i in range(1, 10)}


def clean_value(value):
    value = "".join(_ILLEGAL_MAP.get(c, c) for c in str(value))
    value = "".join(" " if ord(c) < 32 or ord(c) == 127 else c for c in value)
    return " ".join(value.split())


def _format_rating(rating100):
    if rating100 is None:
        return ""
    return ("%.1f" % (rating100 / 10.0)).rstrip("0").rstrip(".")


def template_values(scene, original_stem):
    performers = [p.get("name") or "" for p in scene.get("performers") or []]
    performers = [p for p in performers if p.strip()]
    date = scene.get("date") or ""
    return {
        "title": scene.get("title") or "",
        "studio": (scene.get("studio") or {}).get("name") or "",
        "performers": ", ".join(performers[:3]),
        "date": date,
        "year": date[:4],
        "code": scene.get("code") or "",
        "rating": _format_rating(scene.get("rating100")),
        "original": original_stem,
    }


def render_name(template, scene, original_stem):
    """Fill the template. Separators around empty fields are dropped, so
    "{performers} - {studio} - {title}" without a studio gives "A - T".
    Returns None if nothing usable is left."""
    values = template_values(scene, original_stem)
    tokens = {}

    def to_token(match):
        tok = "\ue000" + chr(0xE100 + len(tokens)) + "\ue001"
        tokens[tok] = clean_value(values[match.group(1)])
        return tok

    skeleton = re.sub(r"\{(%s)\}" % "|".join(PLACEHOLDERS), to_token, template)
    for tok, val in tokens.items():
        if not val:
            skeleton = skeleton.replace(tok, "")
    # tidy literal text only (values are still tokens, so they are untouched)
    skeleton = clean_value(skeleton)
    for _ in range(3):
        skeleton = re.sub(r"\(\s*\)|\[\s*\]", "", skeleton)
        skeleton = re.sub(r"(\s*[-_,]\s*)(?:[-_,]\s*)+", lambda m: m.group(1), skeleton)
        skeleton = " ".join(skeleton.split())
    skeleton = skeleton.strip(" -_,.")
    for tok, val in tokens.items():
        skeleton = skeleton.replace(tok, val)
    name = " ".join(skeleton.split()).strip(" .")
    if len(name) > MAX_STEM_CHARS:
        name = name[:MAX_STEM_CHARS].rstrip(" .-_,")
    if not name:
        return None
    if name.split(".")[0].upper() in _RESERVED:
        name = "_" + name
    return name


# ----------------------------------------------------------------- paths --

def norm(path):
    return os.path.normcase(os.path.normpath(os.path.abspath(path)))


def is_inside(path, root):
    path, root = norm(path), norm(root)
    try:
        return os.path.commonpath([path, root]) == root
    except ValueError:  # different drives on Windows
        return False


def destination_problem(folder, cfg, basename):
    """Return a reason not to use this folder, or None if it is fine."""
    if not os.path.isabs(folder):
        return "destination folder %s is not an absolute path" % folder
    if not os.path.isdir(folder):
        return "destination folder %s does not exist (create it first; the plugin never creates folders)" % folder
    libs = [lib for lib in cfg.libraries if is_inside(folder, lib[0])]
    if not libs:
        return "destination folder %s is outside every Stash library" % folder
    # the most specific library wins, as in Stash
    lib = max(libs, key=lambda lib: len(norm(lib[0])))
    if lib[1]:
        return "destination folder %s is in library %s, which excludes videos" % (folder, lib[0])
    target = os.path.join(folder, basename)
    for pattern in cfg.excludes:
        try:
            if re.search(pattern, target, re.IGNORECASE) or re.search(pattern, folder + os.sep, re.IGNORECASE):
                return "destination %s matches the Stash exclude pattern %r" % (target, pattern)
        except re.error:
            continue
    return None


def free_target(folder, stem, ext, current_path, reserved=()):
    """First free path for stem+ext in folder, adding " (2)", " (3)"...
    Returns current_path if the file is already there under one of those names,
    or None if no free name was found. `reserved` holds normalized paths that a
    dry run already promised to earlier scenes, so the log matches a real run."""
    current = norm(current_path)
    for n in range(1, MAX_SUFFIX + 1):
        name = stem + ext if n == 1 else "%s (%d)%s" % (stem, n, ext)
        candidate = os.path.join(folder, name)
        if norm(candidate) == current:
            return current_path
        if not os.path.lexists(candidate) and norm(candidate) not in reserved:
            return candidate
    return None


def find_sidecars(video_path):
    folder = os.path.dirname(video_path)
    stem = os.path.splitext(os.path.basename(video_path))[0]
    prefix = (stem + ".").lower()
    found = []
    try:
        names = os.listdir(folder)
    except OSError:
        return found
    for name in names:
        if name.lower().startswith(prefix) and os.path.splitext(name)[1].lower() in SIDECAR_EXTS:
            path = os.path.join(folder, name)
            if os.path.isfile(path):
                found.append((path, name[len(stem):]))  # keep ".en.srt", ".roll.funscript"...
    return sorted(found)


# --------------------------------------------------------------- the work --

def plan(scene, cfg, reserved=()):
    """Decide what to do with one scene. Returns (action, details):
    action is "move" or "skip"; details is a dict."""
    sid = scene.get("id")
    rating100 = scene.get("rating100")
    if rating100 is None or rating100 <= 0:
        if not cfg.unrated_folder:
            return "skip", {"reason": "scene %s has no rating; unrated scenes are not moved" % sid, "level": "debug"}
        folder, why = cfg.unrated_folder, "no rating"
    else:
        rule = folder_for_rating(cfg.rules, rating100)
        if rule is None:
            return "skip", {"reason": "scene %s: rating %s/10 matches no rule" % (sid, _format_rating(rating100)),
                            "level": "info"}
        folder, why = rule.folder, "rating %s/10, rule %s" % (_format_rating(rating100), rule.text)

    files = scene.get("files") or []
    if not files:
        return "skip", {"reason": "scene %s has no file" % sid, "level": "warning"}
    f = files[0]
    src = f.get("path") or ""
    if f.get("zip_file_id"):
        return "skip", {"reason": "scene %s: %s is inside a zip file and cannot be moved" % (sid, src),
                        "level": "warning"}
    if not os.path.isfile(src):
        return "skip", {"reason": "scene %s: file %s not found on disk" % (sid, src), "level": "warning"}

    stem, ext = os.path.splitext(os.path.basename(src))
    new_stem = stem
    if cfg.template:
        rendered = render_name(cfg.template, scene, stem)
        if rendered:
            new_stem = rendered
        else:
            log_debug("scene %s: rename template gave an empty name, keeping %s" % (sid, stem))

    problem = destination_problem(folder, cfg, new_stem + ext)
    if problem:
        return "skip", {"reason": "scene %s not moved: %s" % (sid, problem), "level": "warning"}

    dst = free_target(folder, new_stem, ext, src, reserved)
    if dst is None:
        return "skip", {"reason": "scene %s: no free file name for %s in %s" % (sid, new_stem + ext, folder),
                        "level": "warning"}
    if norm(dst) == norm(src):
        return "skip", {"reason": "scene %s: already in place (%s)" % (sid, src), "level": "debug"}

    dst_stem = os.path.splitext(os.path.basename(dst))[0]
    sidecars = []
    if cfg.move_sidecars:
        for path, suffix in find_sidecars(src):
            sidecars.append((path, os.path.join(folder, dst_stem + suffix)))
    return "move", {"scene": sid, "file_id": f.get("id"), "src": src, "dst": dst, "folder": folder,
                    "why": why, "sidecars": sidecars}


def _report_skip(details):
    level = details.get("level", "info")
    {"debug": log_debug, "info": log_info, "warning": log_warning}.get(level, log_info)(details["reason"])


def move_sidecars(sidecars):
    """Move what can be moved; returns the (src, dst) pairs that were moved."""
    moved = []
    for src, dst in sidecars:
        if os.path.lexists(dst):
            log_warning("left %s where it was: %s already exists" % (src, dst))
            continue
        try:
            shutil.move(src, dst)
            log_info("moved sidecar %s -> %s" % (src, dst))
            moved.append((src, dst))
        except OSError as exc:
            log_warning("could not move sidecar %s: %s" % (src, exc))
    return moved


def relink_subtitles(stash, video, subtitles):
    """Stash remembers a scene's subtitles by file name. After a rename it still
    points at the old name, and its scan only adds a subtitle once the stale one
    is gone. So: scan the video (drops the stale entry), then scan the renamed
    subtitles (links them again). Stash runs the two scans one after the other."""
    no_extras = {"scanGenerateCovers": False, "scanGeneratePreviews": False,
                 "scanGenerateImagePreviews": False, "scanGenerateSprites": False,
                 "scanGeneratePhashes": False, "scanGenerateImagePhashes": False,
                 "scanGenerateThumbnails": False, "scanGenerateClipPreviews": False}
    try:
        stash.call(SCAN, {"input": dict(no_extras, paths=[video])})
        stash.call(SCAN, {"input": dict(no_extras, paths=list(subtitles))})
        log_info("asked Stash to link the renamed subtitle%s to %s (two quick scans)"
                 % ("s" if len(subtitles) > 1 else "", video))
    except StashError as exc:
        log_warning("could not ask Stash to rescan the renamed subtitles (%s); "
                    "Stash will pick them up on a later library scan" % exc)


def process_scene(stash, scene, cfg, dry_run, reserved=None):
    """Returns "moved", "would_move", "skipped" or "failed"."""
    action, d = plan(scene, cfg, reserved if reserved is not None else ())
    if action == "skip":
        _report_skip(d)
        return "skipped"

    extra = ""
    if d["sidecars"]:
        extra = " (+%d sidecar file%s)" % (len(d["sidecars"]), "s" if len(d["sidecars"]) > 1 else "")
    if dry_run:
        if reserved is not None:
            reserved.add(norm(d["dst"]))
        log_info("[DRY RUN] scene %s (%s): would move %s -> %s%s"
                 % (d["scene"], d["why"], d["src"], d["dst"], extra))
        return "would_move"

    try:
        stash.call(MOVE_FILES, {"input": {
            "ids": [d["file_id"]],
            "destination_folder": d["folder"],
            "destination_basename": os.path.basename(d["dst"]),
        }})
    except StashError as exc:
        log_error("scene %s: Stash refused to move %s -> %s: %s" % (d["scene"], d["src"], d["dst"], exc))
        return "failed"

    if not os.path.isfile(d["dst"]):
        log_error("scene %s: Stash reported success but %s is not there; check the Stash log" % (d["scene"], d["dst"]))
        return "failed"
    log_info("scene %s (%s): moved %s -> %s" % (d["scene"], d["why"], d["src"], d["dst"]))
    moved = move_sidecars(d["sidecars"])
    renamed_subtitles = [dst for src, dst in moved
                         if os.path.splitext(dst)[1].lower() in STASH_CAPTION_EXTS
                         and os.path.basename(src) != os.path.basename(dst)]
    if renamed_subtitles:
        relink_subtitles(stash, d["dst"], renamed_subtitles)
    return "moved"


DRY_RUN_NOTE = ". Dry run is on: no file was moved. Turn on \"Move files for real\" in the plugin settings when the log looks right."
PREVIEW_NOTE = ". Preview only: no file was moved."


def _summary(counts, note=""):
    parts = ["%d %s" % (n, k.replace("_", " ")) for k, n in counts.items() if n]
    return (", ".join(parts) or "nothing to do") + note


def run_hook(stash, cfg, hook):
    fields = hook.get("inputFields") or []
    if "rating100" not in fields and "rating" not in fields:
        return "rating not changed; nothing to do"
    scene = stash.call(FIND_SCENE, {"id": str(hook.get("id"))}).get("findScene")
    if not scene:
        log_warning("scene %s not found" % hook.get("id"))
        return "scene not found"
    result = process_scene(stash, scene, cfg, cfg.dry_run)
    return _summary({result: 1}, DRY_RUN_NOTE if result == "would_move" else "")


def run_task(stash, cfg, preview):
    dry_run = preview or cfg.dry_run
    scenes, page = [], 1
    while True:
        data = stash.call(FIND_RATED_SCENES, {
            "filter": {"per_page": PER_PAGE, "page": page, "sort": "id", "direction": "ASC"},
            "scene_filter": {"rating100": {"value": 0, "modifier": "GREATER_THAN"}},
        }).get("findScenes") or {}
        batch = data.get("scenes") or []
        scenes.extend(batch)
        if not batch or len(scenes) >= (data.get("count") or 0):
            break
        page += 1
    if preview:
        log_info("Previewing %d rated scene(s); nothing will be moved" % len(scenes))
    elif dry_run:
        log_info("Applying rating folders to %d rated scene(s) in dry run; nothing will be moved" % len(scenes))
    else:
        log_info("Applying rating folders to %d rated scene(s)" % len(scenes))
    counts = {"moved": 0, "would_move": 0, "skipped": 0, "failed": 0}
    reserved = set()  # names a dry run has already given out
    for i, scene in enumerate(scenes):
        counts[process_scene(stash, scene, cfg, dry_run, reserved)] += 1
        log_progress((i + 1) / float(len(scenes)))
    summary = _summary(counts, PREVIEW_NOTE if preview else DRY_RUN_NOTE if dry_run else "")
    log_info(summary)
    return summary


def main():
    raw = sys.stdin.read()
    try:
        plugin_input = json.loads(raw) if raw.strip() else {}
    except ValueError:
        log_error("could not read the input sent by Stash")
        print(json.dumps({"error": "bad input"}))
        return
    args = plugin_input.get("args") or {}
    stash = Stash(plugin_input.get("server_connection") or {})
    try:
        cfg = load_config(stash)
        if not cfg.rules and not cfg.unrated_folder:
            msg = "no rules configured yet (Settings > Plugins > Rating Folders); nothing to do"
            log_info(msg) if args.get("mode") else log_debug(msg)
            print(json.dumps({"output": msg}))
            return
        hook = args.get("hookContext")
        if hook:
            out = run_hook(stash, cfg, hook)
        elif args.get("mode") == "preview":
            out = run_task(stash, cfg, preview=True)
        elif args.get("mode") == "apply":
            out = run_task(stash, cfg, preview=False)
        else:
            out = "unknown mode %r" % args.get("mode")
            log_error(out)
        print(json.dumps({"output": out}))
    except ConfigError as exc:
        log_error("Rating Folders settings: %s. Nothing was moved." % exc)
        print(json.dumps({"error": str(exc)}))
    except StashError as exc:
        log_error("Rating Folders: %s. Nothing else was moved." % exc)
        print(json.dumps({"error": str(exc)}))


if __name__ == "__main__":
    main()
