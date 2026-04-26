#!/usr/bin/env python3
"""
================================================================================
 Info JSON Importer — Stash Plugin
================================================================================
 Reads yt-dlp .info.json files saved alongside video files and imports their
 metadata into Stash via the GraphQL API.

 Fields imported from .info.json:
   title       -> Scene title
   description -> Scene details
   upload_date -> Scene date (YYYYMMDD -> YYYY-MM-DD)
   uploader    -> Studio name (created if not exists)
   tags        -> Scene tags (created if not exists)

 Two tasks available:
   Import Info JSON  — actually updates Stash scenes
   Dry Run           — previews what would change, makes no modifications

 Version:  1.0.0
 Created:  26 April 2026
 Author:   David Smith
 Contact:  david@maxprovider.net
 © David Smith 2026
================================================================================
"""

import sys
import os
import json
import re
import argparse
import requests
from pathlib import Path

# ── Read connection parameters from Stash (passed via stdin) ──────────────────
# Stash passes a JSON blob to stdin containing server connection details
# and any plugin arguments.
try:
    raw = sys.stdin.read()
    plugin_input = json.loads(raw)
except Exception:
    plugin_input = {}

server = plugin_input.get("server_connection", {})
SCHEME  = server.get("Scheme", "http")
HOST    = server.get("Host", "localhost")
PORT    = server.get("Port", 9999)

# Normalise 0.0.0.0 to localhost
if HOST == "0.0.0.0":
    HOST = "localhost"

GRAPHQL_URL = f"{SCHEME}://{HOST}:{PORT}/graphql"

# ── API key ────────────────────────────────────────────────────────────────────
# Set your Stash API key here, or use the provided setup.sh script to set it
# automatically. Generate a key in Stash: Settings → Security → API Key
# Leave empty ("") if your Stash instance has no authentication enabled.
API_KEY = ""

HEADERS = {
    "Content-Type": "application/json",
    "ApiKey": API_KEY,
}

# ── Parse task argument ───────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("--task", default="import", choices=["import", "dryrun"])
args, _ = parser.parse_known_args()
DRY_RUN = (args.task == "dryrun")

def log(msg, level="info"):
    """
    Send a log message to Stash in the required format.
    Stash reads plugin output line by line looking for this prefix.
    """
    prefix = {
        "trace":   "TRACE",
        "debug":   "DEBUG",
        "info":    "INFO",
        "warning": "WARN",
        "error":   "ERROR",
        "progress":"PROGRESS",
    }.get(level, "INFO")
    print(f"{prefix} {msg}", file=sys.stderr, flush=True)

def gql(query, variables=None):
    """Execute a GraphQL query/mutation against the Stash API."""
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    try:
        r = requests.post(GRAPHQL_URL, json=payload, headers=HEADERS, timeout=30)
        r.raise_for_status()
        data = r.json()
        if "errors" in data:
            log(f"  GraphQL error: {data['errors']}")
            return None
        return data.get("data")
    except Exception as e:
        log(f"  Request failed: {e}")
        return None

# ── GraphQL queries and mutations ─────────────────────────────────────────────

def get_all_scenes():
    """Fetch all scenes from Stash with their file paths."""
    query = """
    query AllScenes($page: Int!) {
        findScenes(
            filter: { per_page: 100, page: $page }
            scene_filter: {}
        ) {
            count
            scenes {
                id
                title
                files {
                    path
                }
            }
        }
    }
    """
    all_scenes = []
    page = 1
    while True:
        data = gql(query, {"page": page})
        if not data:
            break
        result = data.get("findScenes", {})
        scenes = result.get("scenes", [])
        all_scenes.extend(scenes)
        if len(all_scenes) >= result.get("count", 0):
            break
        page += 1
    return all_scenes

def find_or_create_studio(name):
    """Find a studio by name, or create it if it doesn't exist."""
    query = """
    query FindStudio($name: String!) {
        findStudios(
            studio_filter: { name: { value: $name, modifier: EQUALS } }
            filter: { per_page: 1 }
        ) {
            studios { id name }
        }
    }
    """
    data = gql(query, {"name": name})
    if data:
        studios = data.get("findStudios", {}).get("studios", [])
        if studios:
            return studios[0]["id"]

    # Create the studio
    mutation = """
    mutation CreateStudio($name: String!) {
        studioCreate(input: { name: $name }) { id }
    }
    """
    data = gql(mutation, {"name": name})
    if data:
        return data.get("studioCreate", {}).get("id")
    return None

def find_or_create_tag(name):
    """Find a tag by name, or create it if it doesn't exist."""
    query = """
    query FindTag($name: String!) {
        findTags(
            tag_filter: { name: { value: $name, modifier: EQUALS } }
            filter: { per_page: 1 }
        ) {
            tags { id name }
        }
    }
    """
    data = gql(query, {"name": name})
    if data:
        tags = data.get("findTags", {}).get("tags", [])
        if tags:
            return tags[0]["id"]

    # Create the tag
    mutation = """
    mutation CreateTag($name: String!) {
        tagCreate(input: { name: $name }) { id }
    }
    """
    data = gql(mutation, {"name": name})
    if data:
        return data.get("tagCreate", {}).get("id")
    return None

def update_scene(scene_id, title=None, details=None, date=None,
                 studio_id=None, tag_ids=None):
    """Update a scene's metadata in Stash."""
    input_data = {"id": scene_id}
    if title:     input_data["title"]     = title
    if details:   input_data["details"]   = details
    if date:      input_data["date"]      = date
    if studio_id: input_data["studio_id"] = studio_id
    if tag_ids:   input_data["tag_ids"]   = tag_ids

    mutation = """
    mutation UpdateScene($input: SceneUpdateInput!) {
        sceneUpdate(input: $input) { id title }
    }
    """
    return gql(mutation, {"input": input_data})

# ── Info JSON parsing ─────────────────────────────────────────────────────────

def find_info_json(video_path):
    """
    Look for a .info.json file next to the video file.
    Tries exact base name match first, then any [ID].info.json in same folder.
    """
    p = Path(video_path)
    # Standard yt-dlp naming: same name, different extension
    candidate = p.with_suffix(".info.json")
    if candidate.exists():
        return candidate

    # Also try stripping the extension and checking for .info.json
    stem = p.stem  # e.g. "Title [phABC123]"
    candidate2 = p.parent / f"{stem}.info.json"
    if candidate2.exists():
        return candidate2

    return None

def parse_info_json(json_path):
    """
    Parse a yt-dlp .info.json file and extract relevant metadata fields.
    Returns a dict with keys: title, description, date, uploader, tags.
    """
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        log(f"  Failed to parse {json_path}: {e}")
        return None

    result = {}

    # Title
    title = data.get("title") or data.get("fulltitle")
    if title:
        result["title"] = title.strip()

    # Description
    desc = data.get("description")
    if desc:
        result["description"] = desc.strip()

    # Upload date — yt-dlp stores as YYYYMMDD string
    upload_date = data.get("upload_date")
    if upload_date and re.match(r"^\d{8}$", upload_date):
        result["date"] = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:]}"

    # Uploader — use as studio name
    uploader = data.get("uploader") or data.get("channel")
    if uploader:
        result["uploader"] = uploader.strip()

    # Tags — yt-dlp stores as list of strings
    tags = data.get("tags")
    if tags and isinstance(tags, list):
        # Filter out empty strings and deduplicate
        result["tags"] = list({t.strip() for t in tags if t and t.strip()})

    return result

# ── Main import logic ─────────────────────────────────────────────────────────

def run_import():
    mode = "DRY RUN — no changes will be made" if DRY_RUN else "LIVE — Stash will be updated"
    log(f"Info JSON Importer starting — {mode}")
    log(f"Connecting to Stash at {GRAPHQL_URL}")
    log("")

    # Verify connection
    test = gql("query { version { version } }")
    if not test:
        log("ERROR: Could not connect to Stash. Check your API key and Stash is running.")
        sys.exit(1)
    stash_version = test.get("version", {}).get("version", "unknown")
    log(f"Connected to Stash {stash_version}")
    log("")

    # Fetch all scenes
    log("Fetching all scenes from Stash...")
    scenes = get_all_scenes()
    log(f"Found {len(scenes)} scenes total")
    log("")

    # Counters
    found      = 0
    updated    = 0
    no_json    = 0
    no_file    = 0
    errors     = 0

    for i, scene in enumerate(scenes, 1):
        # Get the primary file path
        files = scene.get("files", [])
        if not files:
            no_file += 1
            continue

        video_path = files[0].get("path", "")
        if not video_path or not os.path.exists(video_path):
            no_file += 1
            continue

        # Look for .info.json
        json_path = find_info_json(video_path)
        if not json_path:
            no_json += 1
            continue

        found += 1
        meta = parse_info_json(json_path)
        if not meta:
            errors += 1
            continue

        scene_id    = scene["id"]
        scene_title = scene.get("title") or os.path.basename(video_path)
        short_name  = scene_title[:60] + "..." if len(scene_title) > 60 else scene_title

        log(f"[{i}/{len(scenes)}] {short_name}")
        log(f"  JSON: {json_path.name}")

        if DRY_RUN:
            # Just show what would happen
            if "title"       in meta: log(f"  Would set title:       {meta['title'][:70]}")
            if "date"        in meta: log(f"  Would set date:        {meta['date']}")
            if "uploader"    in meta: log(f"  Would set studio:      {meta['uploader']}")
            if "description" in meta: log(f"  Would set description: {meta['description'][:60]}...")
            if "tags"        in meta: log(f"  Would set {len(meta['tags'])} tags")
            updated += 1
            continue

        # Resolve studio ID
        studio_id = None
        if "uploader" in meta:
            studio_id = find_or_create_studio(meta["uploader"])
            if studio_id:
                log(f"  Studio: {meta['uploader']}")

        # Resolve tag IDs
        tag_ids = []
        if "tags" in meta:
            for tag_name in meta["tags"][:50]:  # cap at 50 tags
                tid = find_or_create_tag(tag_name)
                if tid:
                    tag_ids.append(tid)
            if tag_ids:
                log(f"  Tags: {len(tag_ids)} applied")

        # Update the scene
        result = update_scene(
            scene_id   = scene_id,
            title      = meta.get("title"),
            details    = meta.get("description"),
            date       = meta.get("date"),
            studio_id  = studio_id,
            tag_ids    = tag_ids if tag_ids else None,
        )

        if result:
            updated += 1
            log(f"  Updated OK")
        else:
            errors += 1
            log(f"  Update FAILED")

    # Summary
    log("")
    log("=" * 60)
    log(f"Info JSON Importer complete")
    log(f"  Scenes scanned:      {len(scenes)}")
    log(f"  Info JSON found:     {found}")
    log(f"  No video file:       {no_file}")
    log(f"  No JSON found:       {no_json}")
    if DRY_RUN:
        log(f"  Would update:        {updated}")
    else:
        log(f"  Successfully updated:{updated}")
        log(f"  Errors:              {errors}")
    log("=" * 60)

if __name__ == "__main__":
    run_import()
