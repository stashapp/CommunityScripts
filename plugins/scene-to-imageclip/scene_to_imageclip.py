#!/usr/bin/env python3
"""
Scene to ImageClip Converter — Stash Task Plugin
==================================================
Converts scenes marked as image clips into Stash image-clip entities by:

  1. Ensuring .vclip is listed in Stash's image_extensions config.
  2. Reconciling tag name variants (imageclip / image clip / image_clip /
     image-clip / ImageClip / Image Clip) into a single canonical 'imageclip'
     tag, adding the other names as aliases.
  3. Finding all scenes tagged 'imageclip' and renaming their files from
     video.mp4  →  video.mp4.vclip.
  4. If no scenes are found, diagnosing likely config issues.

After running, do a library scan: Stash will reclassify .vclip files as
image clips, provided create_image_clip_from_videos: true is set in
config.yml and the containing library path has excludeimage: false.

Usage:
  Settings → Tasks → Plugins → "Rename imageclip Scenes to .vclip" → [Run]
"""

import json
import os
import sys
import urllib.request

# ── Stash plugin bootstrap ─────────────────────────────────────────────────────

FRAGMENT    = json.loads(sys.stdin.read())
SERVER      = FRAGMENT["server_connection"]
PORT        = SERVER["Port"]
SCHEME      = SERVER["Scheme"]
SESSION     = SERVER.get("SessionCookie", {}).get("Value", "")
API_KEY     = SERVER.get("ApiKey", "")

GRAPHQL_URL = f"{SCHEME}://localhost:{PORT}/graphql"

HEADERS = {"Content-Type": "application/json", "Accept": "application/json"}
if API_KEY:
    HEADERS["ApiKey"] = API_KEY
COOKIES = {"session": SESSION} if SESSION and not API_KEY else {}

# ── Constants ──────────────────────────────────────────────────────────────────

CANONICAL_TAG = "imageclip"
VCLIP_EXT     = "vclip"
PAGE_SIZE     = 200   # max safe page size for scene queries


# ── Output helpers ─────────────────────────────────────────────────────────────

def log(msg):
    print(json.dumps({"output": str(msg) + "\n"}), flush=True)

def logerr(msg):
    print(json.dumps({"error": str(msg) + "\n"}), flush=True)

def progress(pct):
    print(json.dumps({"progress": round(float(pct), 3)}), flush=True)


# ── GraphQL ────────────────────────────────────────────────────────────────────

def gql(query, variables=None):
    payload = {"query": query}
    if variables:
        payload["variables"] = variables
    body = json.dumps(payload).encode()
    req = urllib.request.Request(GRAPHQL_URL, data=body, headers=HEADERS, method="POST")
    if COOKIES:
        req.add_header("Cookie", "; ".join(f"{k}={v}" for k, v in COOKIES.items()))
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    if "errors" in data:
        raise RuntimeError(f"GraphQL errors: {data['errors']}")
    return data["data"]


# ── Phase 1: ensure .vclip in image_extensions ────────────────────────────────

CONFIG_QUERY = """
query {
    configuration {
        general {
            imageExtensions
            stashes { path excludeImage excludeVideo }
            createImageClipsFromVideos
        }
    }
}
"""

CONFIGURE_GENERAL_MUTATION = """
mutation ConfigureGeneral($input: ConfigGeneralInput!) {
    configureGeneral(input: $input) {
        imageExtensions
    }
}
"""


def ensure_vclip_extension(config):
    exts = config["imageExtensions"] or []
    if VCLIP_EXT in exts:
        log(f"✓ .{VCLIP_EXT} is already listed in image_extensions.")
    else:
        # Only imageExtensions is sent — omitted fields are not reset by Stash
        new_exts = exts + [VCLIP_EXT]
        gql(CONFIGURE_GENERAL_MUTATION, {"input": {"imageExtensions": new_exts}})
        log(f"✓ Added .{VCLIP_EXT} to image_extensions.")

    if not config.get("createImageClipsFromVideos"):
        log(f"  ⚠ create_image_clip_from_videos is not enabled — .vclip files will")
        log(f"    not become image clips after scanning. Enable it in config.yml.")


# ── Phase 2: reconcile tag variants ───────────────────────────────────────────

ALL_TAGS_QUERY = """
query {
    findTags(filter: { per_page: -1 }) {
        tags { id name aliases }
    }
}
"""
# per_page: -1 is intentional here — tag counts are small (rarely >1000)
# and we need the full set to do client-side normalization matching.

TAG_CREATE_MUTATION = """
mutation TagCreate($input: TagCreateInput!) {
    tagCreate(input: $input) { id name }
}
"""

TAG_UPDATE_MUTATION = """
mutation TagUpdate($input: TagUpdateInput!) {
    tagUpdate(input: $input) { id aliases }
}
"""

SCENES_BY_TAG_QUERY = """
query ScenesByTag($tag_id: [ID!], $page: Int!) {
    findScenes(
        scene_filter: { tags: { value: $tag_id, modifier: INCLUDES } }
        filter: { per_page: %d, page: $page }
    ) {
        count
        scenes { id }
    }
}
""" % PAGE_SIZE

BULK_TAG_MUTATION = """
mutation BulkSceneUpdate($input: BulkSceneUpdateInput!) {
    bulkSceneUpdate(input: $input) { id }
}
"""


def normalize(name):
    """Collapse separators and lowercase for variant comparison."""
    return name.lower().replace(" ", "").replace("_", "").replace("-", "")


def find_variant_tags():
    """Return all tags whose normalized name matches 'imageclip'."""
    data = gql(ALL_TAGS_QUERY)
    target = normalize(CANONICAL_TAG)
    return [t for t in data["findTags"]["tags"] if normalize(t["name"]) == target]


def get_all_scene_ids_for_tag(tag_id):
    """Paginate through all scenes with the given tag and return their IDs."""
    ids = []
    page = 1
    while True:
        data  = gql(SCENES_BY_TAG_QUERY, {"tag_id": [tag_id], "page": page})
        batch = data["findScenes"]["scenes"]
        total = data["findScenes"]["count"]
        ids.extend(s["id"] for s in batch)
        if len(ids) >= total or not batch:
            break
        page += 1
    return ids


def reconcile_tags():
    """
    Find all tag name variants, ensure a single canonical 'imageclip' tag
    exists, migrate scenes from variant tags to it, and add variant names
    as aliases. Returns the canonical tag ID.
    """
    variants = find_variant_tags()

    if not variants:
        data = gql(TAG_CREATE_MUTATION, {"input": {"name": CANONICAL_TAG}})
        tag_id = data["tagCreate"]["id"]
        log(f"✓ Created new tag '{CANONICAL_TAG}' (id: {tag_id}).")
        return tag_id

    # Prefer the tag whose name is exactly CANONICAL_TAG; otherwise use first found
    canonical = next((t for t in variants if t["name"] == CANONICAL_TAG), variants[0])
    canonical_id = canonical["id"]

    # Collect aliases to add (variant names not already an alias or the canonical name)
    existing_aliases = set(canonical.get("aliases") or [])
    aliases_to_add   = []
    migrated_scenes  = 0

    if canonical["name"] != CANONICAL_TAG:
        old_name = canonical["name"]
        gql(TAG_UPDATE_MUTATION, {"input": {"id": canonical_id, "name": CANONICAL_TAG}})
        log(f"  Renamed tag '{old_name}' → '{CANONICAL_TAG}' (id: {canonical_id}).")
        if old_name not in existing_aliases:
            existing_aliases.add(old_name)
            aliases_to_add.append(old_name)
    else:
        log(f"✓ Canonical tag '{CANONICAL_TAG}' found (id: {canonical_id}).")

    for tag in variants:
        if tag["id"] == canonical_id:
            continue

        variant_name = tag["name"]
        log(f"  Found variant tag '{variant_name}' — migrating scenes…")

        scene_ids = get_all_scene_ids_for_tag(tag["id"])
        if scene_ids:
            gql(BULK_TAG_MUTATION, {
                "input": {
                    "ids": scene_ids,
                    "tag_ids": {"ids": [canonical_id], "mode": "ADD"},
                }
            })
            gql(BULK_TAG_MUTATION, {
                "input": {
                    "ids": scene_ids,
                    "tag_ids": {"ids": [tag["id"]], "mode": "REMOVE"},
                }
            })
            log(f"    Moved {len(scene_ids)} scene(s) from '{variant_name}' → '{CANONICAL_TAG}'.")
            migrated_scenes += len(scene_ids)

        if variant_name not in existing_aliases and variant_name != canonical["name"]:
            aliases_to_add.append(variant_name)
        log(f"    Variant tag '{variant_name}' still exists — you can delete it manually.")

    if aliases_to_add:
        new_aliases = sorted(existing_aliases | set(aliases_to_add))
        gql(TAG_UPDATE_MUTATION, {
            "input": {"id": canonical_id, "aliases": new_aliases}
        })
        log(f"  Added aliases: {', '.join(aliases_to_add)}")

    if migrated_scenes:
        log(f"  Migrated {migrated_scenes} scene(s) from variant tags.")

    return canonical_id


# ── Phase 3: find scenes and rename files ─────────────────────────────────────

FIND_SCENES_QUERY = """
query FindScenes($tag_id: [ID!], $page: Int!) {
    findScenes(
        scene_filter: { tags: { value: $tag_id, modifier: INCLUDES } }
        filter: { per_page: %d, page: $page }
    ) {
        count
        scenes {
            id
            files {
                id
                path
                basename
            }
        }
    }
}
""" % PAGE_SIZE

def get_all_scenes_with_tag(tag_id):
    scenes = []
    page   = 1
    while True:
        data  = gql(FIND_SCENES_QUERY, {"tag_id": [tag_id], "page": page})
        batch = data["findScenes"]["scenes"]
        total = data["findScenes"]["count"]
        scenes.extend(batch)
        if len(scenes) >= total or not batch:
            break
        page += 1
    return scenes


def rename_file(old_path, new_path):
    os.rename(old_path, new_path)


# ── Phase 4: diagnose when no scenes found ────────────────────────────────────

def diagnose(config):
    """Log actionable hints when no scenes are found to process."""
    log("\nNo scenes to rename. Possible reasons:")

    stashes      = config.get("stashes") or []
    video_only   = [s for s in stashes if not s["excludeVideo"] and s["excludeImage"]]
    if video_only:
        log("\n  Some library paths have video scanning enabled but image scanning")
        log("  disabled. Files in these paths cannot become image clips.")
        log("  Fix: set excludeimage: false (or enable Images in Settings → Libraries):")
        for s in video_only:
            log(f"    {s['path']}")

    if not config.get("createImageClipsFromVideos"):
        log("\n  create_image_clip_from_videos is not enabled in your config.")
        log("  Fix: add  create_image_clip_from_videos: true  to config.yml.")

    log("\n  If config looks correct, make sure scenes are tagged 'imageclip'")
    log("  and run a library scan before re-running this plugin.")


# ── Phase 5: transfer metadata from scenes to image clips ─────────────────────

FIND_VCLIP_IMAGES_QUERY = """
query FindVclipImages($page: Int!) {
    findImages(
        image_filter: { path: { value: ".vclip", modifier: INCLUDES } }
        filter: { per_page: %d, page: $page }
    ) {
        count
        images {
            id
            title
            rating100
            details
            date
            files { path basename }
            tags { id }
            performers { id }
            studio { id }
        }
    }
}
""" % PAGE_SIZE

FIND_SCENE_BY_PATH_QUERY = """
query FindSceneByPath($path: String!) {
    findScenes(
        scene_filter: { path: { value: $path, modifier: EQUALS } }
        filter: { per_page: 1 }
    ) {
        scenes {
            id
            title
            rating100
            details
            date
            tags { id }
            performers { id }
            studio { id }
        }
    }
}
"""

IMAGE_UPDATE_MUTATION = """
mutation ImageUpdate($input: ImageUpdateInput!) {
    imageUpdate(input: $input) { id }
}
"""

SCENE_DESTROY_MUTATION = """
mutation SceneDestroy($input: SceneDestroyInput!) {
    sceneDestroy(input: $input)
}
"""


def get_all_vclip_images():
    images = []
    page   = 1
    while True:
        data  = gql(FIND_VCLIP_IMAGES_QUERY, {"page": page})
        batch = data["findImages"]["images"]
        total = data["findImages"]["count"]
        images.extend(batch)
        if len(images) >= total or not batch:
            break
        page += 1
    return images


def find_scene_by_path(path):
    data   = gql(FIND_SCENE_BY_PATH_QUERY, {"path": path})
    scenes = data["findScenes"]["scenes"]
    return scenes[0] if scenes else None


def transfer_and_clean(image, scene):
    update = {"id": image["id"]}

    if scene.get("title"):
        update["title"] = scene["title"]
    if scene.get("rating100") is not None:
        update["rating100"] = scene["rating100"]
    if scene.get("details"):
        update["details"] = scene["details"]
    if scene.get("date"):
        update["date"] = scene["date"]
    if scene.get("performers"):
        update["performer_ids"] = [p["id"] for p in scene["performers"]]
    if scene.get("studio"):
        update["studio_id"] = scene["studio"]["id"]

    # Merge tags — union of image and scene tag sets
    image_tag_ids = {t["id"] for t in (image.get("tags") or [])}
    scene_tag_ids = {t["id"] for t in (scene.get("tags") or [])}
    merged = sorted(image_tag_ids | scene_tag_ids)
    if merged:
        update["tag_ids"] = merged

    gql(IMAGE_UPDATE_MUTATION, {"input": update})
    gql(SCENE_DESTROY_MUTATION, {"input": {"id": scene["id"], "delete_file": False}})


def transfer_main():
    log("=== Transfer Metadata & Clean Up ===\n")

    log("── Finding .vclip image clips ──")
    try:
        images = get_all_vclip_images()
    except Exception as exc:
        logerr(f"Could not query image clips: {exc}")
        sys.exit(1)

    if not images:
        log("No .vclip image clips found. Run the rename task and a library scan first.")
        progress(1.0)
        return

    log(f"Found {len(images)} .vclip image clip(s) to process.\n")

    transferred = 0
    skipped     = 0
    errors      = 0

    for i, image in enumerate(images):
        progress(i / len(images))

        for f in image["files"]:
            if not f["path"].endswith(".vclip"):
                continue

            original_path = f["path"][:-6]  # strip ".vclip"
            scene = find_scene_by_path(original_path)

            if not scene:
                log(f"  skip  {f['basename']}  (no scene found at {original_path})")
                skipped += 1
                continue

            try:
                transfer_and_clean(image, scene)
                log(f"  ok    {f['basename']}  ← scene {scene['id']}")
                transferred += 1
            except Exception as exc:
                logerr(f"  fail  {f['basename']}  —  {exc}")
                errors += 1

    progress(1.0)
    log(f"\nDone — transferred: {transferred}, skipped: {skipped}, errors: {errors}.")


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    log("=== Scene to ImageClip Converter ===\n")

    # Load config once — used by both phase 1 and phase 4
    try:
        config = gql(CONFIG_QUERY)["configuration"]["general"]
    except Exception as exc:
        logerr(f"Could not read Stash configuration: {exc}")
        sys.exit(1)

    # Phase 1 — config
    log("── Phase 1: image_extensions ──")
    try:
        ensure_vclip_extension(config)
    except Exception as exc:
        logerr(f"Could not update image_extensions: {exc}")
    progress(0.1)

    # Phase 2 — tag reconciliation
    log("\n── Phase 2: tag reconciliation ──")
    try:
        canonical_id = reconcile_tags()
    except Exception as exc:
        logerr(f"Tag reconciliation failed: {exc}")
        sys.exit(1)
    progress(0.2)

    # Phase 3 — find scenes and rename
    log("\n── Phase 3: renaming files ──")
    try:
        scenes = get_all_scenes_with_tag(canonical_id)
    except Exception as exc:
        logerr(f"Could not query scenes: {exc}")
        sys.exit(1)

    if not scenes:
        log(f"No scenes found tagged '{CANONICAL_TAG}'.")
        diagnose(config)
        progress(1.0)
        return

    log(f"Found {len(scenes)} scene(s) to process.")
    log("(Scenes with multiple files will have all files renamed.)\n")

    renamed = 0
    skipped = 0
    errors  = 0

    for i, scene in enumerate(scenes):
        progress(i / len(scenes))

        for f in scene["files"]:
            basename = f["basename"]

            if basename.endswith(".vclip"):
                log(f"  skip  {basename}  (already .vclip)")
                skipped += 1
                continue

            old_path = f["path"]
            new_path = old_path + ".vclip"
            try:
                rename_file(old_path, new_path)
                log(f"  ok    {basename}  →  {basename}.vclip")
                renamed += 1
            except Exception as exc:
                logerr(f"  fail  {basename}  —  {exc}")
                errors += 1

    progress(1.0)
    log(f"\nDone — renamed: {renamed}, skipped: {skipped}, errors: {errors}.")
    if renamed:
        log("Run a library scan so Stash reclassifies .vclip files as image clips.")


mode = FRAGMENT.get("args", {}).get("mode", "rename")
if mode == "transfer":
    transfer_main()
else:
    main()
