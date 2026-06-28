#!/usr/bin/env python3
"""Stash MP4 Metadata Mapper — Phase 2.

Reads scene metadata from Stash via GraphQL and writes it into MP4
metadata atoms using mutagen. Supports batch export and hook-based
auto-export on scene update.
"""

import json
import os
import re
import sys

PLUGIN_ID = "StashMetadataMapper"


def _ensure_deps():
    import subprocess
    needed = []
    try:
        from mutagen.mp4 import MP4  # noqa: F401
    except ImportError:
        needed.append("mutagen")
    try:
        import requests  # noqa: F401
    except ImportError:
        needed.append("requests")
    if not needed:
        return
    print(f"[{PLUGIN_ID}] Installing missing deps: {needed}", file=sys.stderr, flush=True)
    # Try install strategies in order; stop at the first one that works.
    for flags in [["--user"], ["--break-system-packages"], ["--user", "--break-system-packages"], []]:
        try:
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "--quiet"] + flags + needed,
                check=True, capture_output=True,
            )
            return
        except subprocess.CalledProcessError:
            continue
    print(
        f"[{PLUGIN_ID}] ERROR: Could not auto-install deps. "
        f"Run manually: {sys.executable} -m pip install {' '.join(needed)}",
        file=sys.stderr, flush=True,
    )
    sys.exit(1)

_ensure_deps()

from mutagen.mp4 import MP4, MP4Cover, MP4FreeForm, AtomDataType  # noqa: E402

from stash_interface import StashInterface

MP4_EXTENSIONS = {".mp4", ".m4v"}

# Maps StashDB endpoint URLs to human-readable atom key suffixes
ENDPOINT_ATOM_KEYS = {
    "https://stashdb.org/graphql": "stashdb_id",
    "https://theporndb.net/graphql": "tpdb_id",
}

ATOM_LABELS = {
    "stik": "media kind (movie=9)",
    "©nam": "title",
    "ldes": "long description",
    "©day": "date",
    "aART": "studio (album artist)",
    "©ART": "cast (artist)",
    "covr": "artwork",
    "©gen": "genre",
    "keyw": "keywords",
}

DEFAULT_SETTINGS = {
    "exportTitle": True,
    "exportDescription": True,
    "exportDate": True,
    "exportStudio": True,
    "exportCast": True,
    "exportRating": True,
    "exportArtwork": True,
    "exportTagsAsKeywords": True,
    "genreTagNames": "",
    "ignoreTagNames": "",
    "exportStashIds": True,
}

# Settings that are strings, not booleans
_STRING_SETTINGS = {"genreTagNames", "ignoreTagNames"}


def log(msg, level="INFO"):
    print(f"[{PLUGIN_ID}] [{level}] {msg}", file=sys.stderr, flush=True)


def eprint(msg):
    """Write a line directly to stderr (used for dry-run preview blocks)."""
    print(msg, file=sys.stderr, flush=True)


def get_settings(stash):
    config = stash.get_plugin_config()
    settings = dict(DEFAULT_SETTINGS)
    for key, value in config.items():
        if key not in settings:
            continue
        if key in _STRING_SETTINGS:
            settings[key] = str(value) if value is not None else ""
        else:
            settings[key] = bool(value)
    return settings


def _parse_tag_patterns(s):
    """Parse a comma-separated setting into a list of lowercase substrings to match against tag names."""
    if not s:
        return []
    return [t.strip().lower() for t in s.split(",") if t.strip()]


def _tag_matches(name_lower, patterns):
    """Return True if name_lower contains any of the patterns as a substring."""
    return any(p in name_lower for p in patterns)


def _endpoint_to_key(endpoint):
    key = re.sub(r"https?://", "", endpoint)
    key = re.sub(r"[^a-zA-Z0-9]", "_", key).strip("_")
    return key[:40]


def fetch_artwork(stash, scene):
    screenshot_url = (scene.get("paths") or {}).get("screenshot")
    if not screenshot_url:
        return None, None
    try:
        data = stash.fetch_bytes(screenshot_url)
        fmt = MP4Cover.FORMAT_PNG if data[:8] == b"\x89PNG\r\n\x1a\n" else MP4Cover.FORMAT_JPEG
        return data, fmt
    except Exception as exc:
        log(f"Could not fetch artwork: {exc}", "WARNING")
        return None, None


def build_metadata(scene, settings, stash):
    """Build a dict of MP4 atom key → value for the scene."""
    meta = {}

    meta["stik"] = [9]  # Media kind: Movie — tells players to use video metadata fields

    if settings["exportTitle"] and scene.get("title"):
        meta["©nam"] = [scene["title"]]

    if settings["exportDescription"] and scene.get("details"):
        meta["ldes"] = [scene["details"]]

    if settings["exportDate"] and scene.get("date"):
        meta["©day"] = [scene["date"]]

    if settings["exportStudio"] and scene.get("studio"):
        name = scene["studio"]["name"]
        meta["aART"] = [name]
        meta["----:com.stash:studio"] = [MP4FreeForm(name.encode("utf-8"), AtomDataType.UTF8)]

    if settings["exportCast"] and scene.get("performers"):
        meta["©ART"] = [", ".join(p["name"] for p in scene["performers"])]

    if settings["exportRating"] and scene.get("rating100") is not None:
        meta["----:com.stash:rating100"] = [
            MP4FreeForm(str(scene["rating100"]).encode("utf-8"), AtomDataType.UTF8)
        ]

    tags = scene.get("tags") or []
    if tags and (settings["exportTagsAsKeywords"] or settings["genreTagNames"]):
        genre_patterns = _parse_tag_patterns(settings["genreTagNames"])
        ignore_patterns = _parse_tag_patterns(settings["ignoreTagNames"])
        genres, keywords = [], []
        for tag in tags:
            name = tag["name"]
            nl = name.lower()
            if ignore_patterns and _tag_matches(nl, ignore_patterns):
                continue
            if genre_patterns and _tag_matches(nl, genre_patterns):
                genres.append(name)
            elif settings["exportTagsAsKeywords"]:
                keywords.append(name)
        if genres:
            meta["©gen"] = [", ".join(genres)]
        if keywords:
            meta["keyw"] = ["; ".join(keywords)]

    if settings["exportStashIds"]:
        meta["----:com.stash:id"] = [
            MP4FreeForm(str(scene["id"]).encode("utf-8"), AtomDataType.UTF8)
        ]
        for sid in scene.get("stash_ids") or []:
            endpoint = sid.get("endpoint", "")
            stash_id = sid.get("stash_id", "")
            suffix = ENDPOINT_ATOM_KEYS.get(endpoint, _endpoint_to_key(endpoint))
            meta[f"----:com.stash:{suffix}"] = [
                MP4FreeForm(stash_id.encode("utf-8"), AtomDataType.UTF8)
            ]

    if settings["exportArtwork"]:
        artwork_data, artwork_fmt = fetch_artwork(stash, scene)
        if artwork_data:
            meta["covr"] = [MP4Cover(artwork_data, imageformat=artwork_fmt)]

    return meta


def _format_val(val):
    if val is None:
        return "<not set>"
    if isinstance(val, list) and not val:
        return "<empty>"
    item = val[0] if isinstance(val, list) else val
    if isinstance(item, MP4Cover):
        fmt = "JPEG" if item.imageformat == MP4Cover.FORMAT_JPEG else "PNG"
        return f"[{fmt}, {len(item):,} bytes]"
    if isinstance(item, MP4FreeForm):
        return repr(bytes(item).decode("utf-8", errors="replace"))
    return repr(str(item))


def _atom_label(key):
    if key.startswith("----:com.stash:"):
        return key.split(":", 2)[-1]
    return ATOM_LABELS.get(key, key)


def process_scene(stash, scene, settings, dry_run):
    scene_id = scene.get("id", "?")
    files = scene.get("files") or []

    if not files:
        log(f"Scene {scene_id}: no files, skipping")
        return

    new_meta = build_metadata(scene, settings, stash)

    if not new_meta:
        log(f"Scene {scene_id}: nothing to write (all fields disabled or empty)")
        return

    for f in files:
        path = f.get("path", "")
        ext = os.path.splitext(path)[1].lower()
        if ext not in MP4_EXTENSIONS:
            log(f"Scene {scene_id}: skipping non-MP4 file: {path}")
            continue
        if not os.path.exists(path):
            log(f"Scene {scene_id}: file not found: {path}", "WARNING")
            continue

        if dry_run:
            _preview(path, scene_id, new_meta)
        else:
            _write(path, scene_id, new_meta)


def _preview(path, scene_id, new_meta):
    try:
        mp4 = MP4(path)
        current = mp4.tags or {}
    except Exception:
        current = {}

    eprint(f"\n[DRY RUN] Scene {scene_id}: {path}")
    changed = 0
    for key, new_val in new_meta.items():
        old_val = current.get(key)
        old_str = _format_val(old_val)
        new_str = _format_val(new_val)
        if old_str != new_str:
            label = _atom_label(key)
            eprint(f"  {key} ({label})")
            eprint(f"    before: {old_str}")
            eprint(f"    after:  {new_str}")
            changed += 1

    if changed == 0:
        eprint("  [no changes]")
    else:
        eprint(f"  [WOULD WRITE {changed} atom(s)]")


def _write(path, scene_id, new_meta):
    try:
        mp4 = MP4(path)
        if mp4.tags is None:
            mp4.add_tags()
        for key, val in new_meta.items():
            mp4.tags[key] = val
        mp4.save()
        log(f"Scene {scene_id}: wrote {len(new_meta)} atom(s) → {path}")
    except Exception as exc:
        log(f"Scene {scene_id}: failed writing {path}: {exc}", "ERROR")


def handle_hook(stash, args, settings, dry_run):
    hook_ctx = args.get("hookContext") or {}
    scene_id = hook_ctx.get("id")
    if not scene_id:
        log("Hook fired with no scene ID in hookContext", "WARNING")
        return "no scene id"
    scene = stash.find_scene(scene_id)
    if not scene:
        log(f"Scene {scene_id} not found", "WARNING")
        return f"scene {scene_id} not found"
    process_scene(stash, scene, settings, dry_run)
    return f"processed scene {scene_id}"


def handle_export(stash, settings, dry_run):
    page = 1
    per_page = 100
    total = 0

    while True:
        result = stash.find_scenes(page=page, per_page=per_page)
        if not result:
            break
        scenes = result.get("scenes") or []
        count = result.get("count", 0)
        if not scenes:
            break
        for scene in scenes:
            process_scene(stash, scene, settings, dry_run)
            total += 1
        log(f"Progress: {total}/{count}")
        if total >= count:
            break
        page += 1

    mode_label = "previewed" if dry_run else "processed"
    return f"{mode_label} {total} scene(s)"


def main():
    raw = sys.stdin.read()
    plugin_input = json.loads(raw)

    conn = plugin_input.get("server_connection") or {}
    args = plugin_input.get("args") or {}
    mode = args.get("mode", "export")
    dry_run = str(args.get("dryRun", "false")).lower() == "true"

    stash = StashInterface(conn)
    settings = get_settings(stash)

    log(f"Starting — mode={mode} dry_run={dry_run}")

    if mode == "hook":
        result = handle_hook(stash, args, settings, dry_run)
    elif mode == "export":
        result = handle_export(stash, settings, dry_run)
    else:
        result = f"unknown mode: {mode}"
        log(result, "ERROR")

    print(json.dumps({"output": result}))


if __name__ == "__main__":
    main()
