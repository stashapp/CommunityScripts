#!/usr/bin/env python3
"""
Scene to ImageClip Converter — Stash plugin
===========================================
The plugin's one entry point. Stash runs it for every task and for the page buttons;
`args.mode` picks what it does:

  convert    task "Convert tagged scenes to image clips (rename, scan, transfer)" (below)
  rename     task "Rename imageclip Scenes to clip files" (batch, below)
  transfer   task "Transfer metadata and clean up original scenes" (batch, below)
  recover    task "Recover interrupted toggles" (toggle.py)
  to_clip    "Convert to clip" button on a scene page (toggle.py)
  to_scene   "Convert to scene" button on an image clip page (toggle.py)

Any other mode is refused with code bad_args; nothing is renamed.

The clip extension is the "Image clip extension" setting (clipExtension, default vclip).
New clip names get it; a name ending in it or in .vclip is read as a clip, so a library
holding either kind, or both, keeps working when the setting changes.

Batch rename:
  1. Ensures the clip extension is listed in Stash's image extensions.
  2. Reconciles tag name variants (imageclip / image clip / image_clip / image-clip /
     ImageClip / Image Clip) into a single canonical 'imageclip' tag. Variant tags are
     emptied, not deleted; a variant renamed to 'imageclip' keeps its old name as an alias.
  3. Finds all scenes tagged 'imageclip' and renames their files from
     video.mp4  →  video.mp4.vclip, or video.mp4.<clip extension> (never replacing an
     existing file).
  4. If no scenes are found, diagnoses likely config issues.

After the rename, run a library scan: Stash reclassifies the renamed files as image clips,
provided "Scan video extensions as image clips" (create_image_clip_from_videos) is on
and the library path scans images. Then run the transfer task.

Batch transfer: for each image clip named with a clip suffix, moves the scene that still
points at the file's old name (the path without the suffix) onto the clip with the toggle's own carry-over
(toggle.transfer_to_image), then retires that scene record with toggle.final_step (never
the file). A scene is kept when something could not be copied or it has other files.

Convert (one click): the rename above, then it queues a scan of exactly the files it
renamed and, behind that scan, this plugin's transfer task, and returns. Stash runs jobs
one at a time in the order they were queued, so a task cannot wait for a scan it starts
(the scan would only begin after the task ends); queuing both behind itself gets the same
order. A tagged scene whose file was renamed by an earlier run but never scanned or
transferred (its old name is gone and the clip name is there) is queued again with them.
When nothing was renamed and nothing is waiting, nothing is queued.

Batch tasks log to the Stash log (stderr, with Stash's level prefix) and report progress;
the task's output is a one-line summary.
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toggle  # noqa: E402
import toggle_core as core  # noqa: E402

PLUGIN_ID     = toggle.PLUGIN_ID
CANONICAL_TAG = core.CLIP_TAG
PAGE_SIZE     = 200   # max safe page size for scene queries

TOGGLE_MODES = core.MODES  # to_clip, to_scene


# ── Output helpers ─────────────────────────────────────────────────────────────

def log(msg):
    toggle.log("i", msg)


def logwarn(msg):
    toggle.log("w", msg)


def logerr(msg):
    toggle.log("e", msg)


def progress(pct):
    """Task progress (0..1), shown on the task in Stash's job list."""
    sys.stderr.write("\x01p\x02%s\n" % round(float(pct), 3))
    sys.stderr.flush()


class TaskFailed(Exception):
    """A batch task stopped early; the message is the task's error."""


# ── Phase 1: ensure the clip extension is in image extensions ─────────────────

CONFIG_QUERY = """
query BatchConfig($ids: [ID!]) {
    configuration {
        general {
            imageExtensions
            videoExtensions
            stashes { path excludeImage excludeVideo }
            createImageClipsFromVideos
        }
        plugins(include: $ids)
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


def load_batch_config(client):
    """(configuration.general, clip extension). TaskFailed when the configuration cannot be
    read or the clip extension is one of Stash's video extensions."""
    try:
        conf = client.call(CONFIG_QUERY, {"ids": [PLUGIN_ID]})["configuration"]
    except toggle.GraphQLError as exc:
        raise TaskFailed(f"Could not read Stash configuration: {exc}")
    general = conf["general"]
    clip_ext = toggle.clip_ext_setting(conf)
    refusal = core.clip_ext_refusal(clip_ext, general.get("videoExtensions"))
    if refusal is not None:
        raise TaskFailed(f"Image clip extension refused: {refusal.message}")
    return general, clip_ext


def ensure_clip_extension(client, config, clip_ext):
    """Add the clip extension to image extensions when it is missing. Nothing is removed,
    so .vclip stays listed for clips named before the setting changed."""
    exts = config["imageExtensions"] or []
    if core.clip_ext_configured(exts, clip_ext):
        log(f"✓ .{clip_ext} is already listed in image_extensions.")
    else:
        # Only imageExtensions is sent — omitted fields are not reset by Stash
        new_exts = exts + [clip_ext]
        client.call(CONFIGURE_GENERAL_MUTATION, {"input": {"imageExtensions": new_exts}})
        log(f"✓ Added .{clip_ext} to image_extensions.")

    if not config.get("createImageClipsFromVideos"):
        logwarn(f"⚠ create_image_clip_from_videos is not enabled — .{clip_ext} files will "
                "not become image clips after scanning. Enable it in config.yml.")


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


def find_variant_tags(client):
    """Return all tags whose normalized name matches 'imageclip'."""
    data = client.call(ALL_TAGS_QUERY)
    return [t for t in data["findTags"]["tags"] if core.is_clip_tag(t["name"])]


def get_all_scene_ids_for_tag(client, tag_id):
    """Paginate through all scenes with the given tag and return their IDs."""
    ids = []
    page = 1
    while True:
        data  = client.call(SCENES_BY_TAG_QUERY, {"tag_id": [tag_id], "page": page})
        batch = data["findScenes"]["scenes"]
        total = data["findScenes"]["count"]
        ids.extend(s["id"] for s in batch)
        if len(ids) >= total or not batch:
            break
        page += 1
    return ids


def reconcile_tags(client):
    """
    Find all tag name variants, ensure a single canonical 'imageclip' tag
    exists, migrate scenes from variant tags to it, and add variant names
    as aliases. Returns the canonical tag ID.
    """
    variants = find_variant_tags(client)

    if not variants:
        data = client.call(TAG_CREATE_MUTATION, {"input": {"name": CANONICAL_TAG}})
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
        client.call(TAG_UPDATE_MUTATION, {"input": {"id": canonical_id, "name": CANONICAL_TAG}})
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

        scene_ids = get_all_scene_ids_for_tag(client, tag["id"])
        if scene_ids:
            client.call(BULK_TAG_MUTATION, {
                "input": {
                    "ids": scene_ids,
                    "tag_ids": {"ids": [canonical_id], "mode": "ADD"},
                }
            })
            client.call(BULK_TAG_MUTATION, {
                "input": {
                    "ids": scene_ids,
                    "tag_ids": {"ids": [tag["id"]], "mode": "REMOVE"},
                }
            })
            log(f"    Moved {len(scene_ids)} scene(s) from '{variant_name}' → '{CANONICAL_TAG}'.")
            migrated_scenes += len(scene_ids)

        # The variant tag is kept, and Stash refuses an alias that is another tag's name,
        # so its name is not added as an alias here.
        log(f"    Variant tag '{variant_name}' still exists — you can delete it manually, "
            f"then add '{variant_name}' as an alias of '{CANONICAL_TAG}' if you like.")

    if aliases_to_add:
        new_aliases = sorted(existing_aliases | set(aliases_to_add))
        try:
            client.call(TAG_UPDATE_MUTATION, {
                "input": {"id": canonical_id, "aliases": new_aliases}
            })
            log(f"  Added aliases: {', '.join(aliases_to_add)}")
        except toggle.GraphQLError as exc:
            # An alias is a convenience; it must not stop the rename.
            logwarn(f"  Could not add aliases ({', '.join(aliases_to_add)}): {exc}")

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


def get_all_scenes_with_tag(client, tag_id):
    scenes = []
    page   = 1
    while True:
        data  = client.call(FIND_SCENES_QUERY, {"tag_id": [tag_id], "page": page})
        batch = data["findScenes"]["scenes"]
        total = data["findScenes"]["count"]
        scenes.extend(batch)
        if len(scenes) >= total or not batch:
            break
        page += 1
    return scenes


def rename_file(old_path, new_path):
    """Rename without ever replacing an existing file (the toggle's no-replace move).
    Raises FileExistsError when new_path is taken."""
    toggle.checked_rename(old_path, new_path)


# ── Phase 4: diagnose when no scenes found ────────────────────────────────────

def diagnose(config):
    """Log actionable hints when no scenes are found to process."""
    log("No scenes to rename. Possible reasons:")

    stashes      = config.get("stashes") or []
    video_only   = [s for s in stashes if not s["excludeVideo"] and s["excludeImage"]]
    if video_only:
        log("  Some library paths have video scanning enabled but image scanning "
            "disabled. Files in these paths cannot become image clips.")
        log("  Fix: set excludeimage: false (or enable Images in Settings → Libraries):")
        for s in video_only:
            log(f"    {s['path']}")

    if not config.get("createImageClipsFromVideos"):
        log("  create_image_clip_from_videos is not enabled in your config.")
        log("  Fix: add  create_image_clip_from_videos: true  to config.yml.")

    log("  If config looks correct, make sure scenes are tagged 'imageclip' "
        "and run a library scan before re-running this plugin.")


def tagged_scenes(client):
    """Phases 1-2 and the scene lookup shared by rename and convert.

    Returns (config, clip_ext, scenes); scenes is empty when none is tagged (the reasons
    are logged)."""
    # Load config once — used by both phase 1 and phase 4
    config, clip_ext = load_batch_config(client)

    # Phase 1 — config
    log("── Phase 1: image_extensions ──")
    try:
        ensure_clip_extension(client, config, clip_ext)
    except toggle.GraphQLError as exc:
        logerr(f"Could not update image_extensions: {exc}")
    progress(0.1)

    # Phase 2 — tag reconciliation
    log("── Phase 2: tag reconciliation ──")
    try:
        canonical_id = reconcile_tags(client)
    except toggle.GraphQLError as exc:
        raise TaskFailed(f"Tag reconciliation failed: {exc}")
    progress(0.2)

    # Phase 3 — find scenes and rename
    log("── Phase 3: renaming files ──")
    try:
        scenes = get_all_scenes_with_tag(client, canonical_id)
    except toggle.GraphQLError as exc:
        raise TaskFailed(f"Could not query scenes: {exc}")

    if not scenes:
        log(f"No scenes found tagged '{CANONICAL_TAG}'.")
        diagnose(config)
        progress(1.0)
    return config, clip_ext, scenes


def waiting_clip_path(old_path, clip_ext):
    """The clip-named file of an earlier rename that Stash has not caught up with: the old
    name is gone and a clip name is there. None otherwise."""
    if os.path.lexists(old_path):
        return None
    for suffix in core.clip_suffixes(clip_ext):
        if os.path.lexists(old_path + suffix):
            return old_path + suffix
    return None


def rename_scene_files(scenes, clip_ext, waiting=None):
    """Rename every file of the tagged scenes to its clip name, never replacing a file.

    Returns (renamed, skipped, errors); renamed is the list of new paths. When `waiting` is
    a list, a file renamed by an earlier run and not yet scanned or transferred (see
    waiting_clip_path) is added to it instead of being counted as an error."""
    suffix = "." + clip_ext
    renamed = []
    skipped = 0
    errors  = 0

    for i, scene in enumerate(scenes):
        progress(0.2 + 0.8 * i / len(scenes))

        for f in scene["files"]:
            basename = f["basename"]

            if core.has_clip_suffix(basename, clip_ext):
                log(f"  skip  {basename}  (already a clip name)")
                skipped += 1
                continue

            old_path = f["path"]
            new_path = old_path + suffix
            if waiting is not None:
                pending = waiting_clip_path(old_path, clip_ext)
                if pending is not None:
                    log(f"  wait  {basename}  (renamed earlier; queued for the scan and transfer)")
                    waiting.append(pending)
                    continue
            try:
                rename_file(old_path, new_path)
                log(f"  ok    {basename}  →  {basename}{suffix}")
                renamed.append(new_path)
            except FileExistsError:
                logerr(f"  fail  {basename}  —  {basename}{suffix} already exists; not replaced")
                errors += 1
            except OSError as exc:
                logerr(f"  fail  {basename}  —  {exc}")
                errors += 1

    progress(1.0)
    return renamed, skipped, errors


def rename_main(client):
    log("=== Scene to ImageClip Converter: rename ===")
    _config, clip_ext, scenes = tagged_scenes(client)
    if not scenes:
        return "No scenes tagged imageclip."

    log(f"Found {len(scenes)} scene(s) to process. "
        "(Scenes with multiple files will have all files renamed.)")
    renamed, skipped, errors = rename_scene_files(scenes, clip_ext)

    summary = f"Done — renamed: {len(renamed)}, skipped: {skipped}, errors: {errors}."
    log(summary)
    if renamed:
        log(f"Run a library scan so Stash reclassifies .{clip_ext} files as image clips.")
    return summary


# ── Convert: rename, then queue the scan and the transfer behind this task ───

# The task convert queues after the scan; test_manifest checks it matches the manifest.
TRANSFER_TASK_NAME = "Transfer metadata and clean up original scenes"

QUEUE_SCAN_MUTATION = """
mutation ConvertQueueScan($input: ScanMetadataInput!) {
    metadataScan(input: $input)
}
"""

# runPluginTask(plugin_id, task_name, args_map) is the same on Stash v0.31.1, v0.32.0 and
# development; args_map repeats the task's defaultArgs so the mode never depends on them.
QUEUE_TASK_MUTATION = """
mutation ConvertQueueTransfer($id: ID!, $task: String!, $args: Map) {
    runPluginTask(plugin_id: $id, task_name: $task, args_map: $args)
}
"""


def queue_scan_and_transfer(client, paths):
    """Queue a scan of exactly `paths`, then the transfer task. Returns (scan job, transfer job).

    Stash starts queued jobs one at a time, in order, after this task ends, so the transfer
    starts only once the scan has ended (finished, failed or cancelled). The transfer acts
    only on clips whose path matches a scene's exactly, so it is harmless after a cut-short
    scan; the files it did not see are picked up by the next run."""
    paths = sorted(set(paths))
    try:
        scan_job = client.call(QUEUE_SCAN_MUTATION, {"input": {"paths": paths}})["metadataScan"]
    except toggle.GraphQLError as exc:
        raise TaskFailed(f"Files renamed, but the scan could not be queued ({exc}). "
                         "Run a library scan, then the transfer task.")
    log(f"Queued scan job {scan_job} for {len(paths)} file(s).")
    try:
        transfer_job = client.call(QUEUE_TASK_MUTATION, {
            "id": PLUGIN_ID, "task": TRANSFER_TASK_NAME, "args": {"mode": "transfer"},
        })["runPluginTask"]
    except toggle.GraphQLError as exc:
        raise TaskFailed(f"Files renamed and scan job {scan_job} queued, but the transfer task "
                         f"could not be queued ({exc}). Run it after the scan.")
    log(f"Queued transfer job {transfer_job}; it starts after scan job {scan_job} ends.")
    return scan_job, transfer_job


def convert_main(client):
    log("=== Scene to ImageClip Converter: convert (rename, scan, transfer) ===")
    _config, clip_ext, scenes = tagged_scenes(client)
    if not scenes:
        return "No scenes tagged imageclip; nothing queued."

    log(f"Found {len(scenes)} scene(s) to process. "
        "(Scenes with multiple files will have all files renamed.)")
    waiting = []
    renamed, skipped, errors = rename_scene_files(scenes, clip_ext, waiting)
    counts = (f"renamed: {len(renamed)}, waiting from an earlier run: {len(waiting)}, "
              f"skipped: {skipped}, errors: {errors}")
    if not renamed and not waiting:
        summary = f"Done — {counts}; nothing to scan, nothing queued."
        log(summary)
        return summary

    scan_job, transfer_job = queue_scan_and_transfer(client, renamed + waiting)
    summary = (f"Done — {counts}; queued scan job {scan_job} and transfer job "
               f"{transfer_job}.")
    log(summary)
    return summary


# ── Phase 5: transfer metadata from scenes to image clips ─────────────────────

FIND_CLIP_IMAGES_QUERY = """
query FindClipImages($suffix: String!, $page: Int!) {
    findImages(
        image_filter: { path: { value: $suffix, modifier: INCLUDES } }
        filter: { per_page: %d, page: $page }
    ) {
        count
        images {
            id
            visual_files {
                ... on VideoFile { path basename }
                ... on ImageFile { path basename }
            }
        }
    }
}
""" % PAGE_SIZE

# Stash's path EQUALS filter is a case-insensitive LIKE (`_` and `%` are wildcards), so
# it only narrows the lookup; toggle_core.exact_path_matches picks the exact path.
FIND_SCENES_BY_PATH_QUERY = """
query FindScenesByPath($path: String!) {
    findScenes(
        scene_filter: { path: { value: $path, modifier: EQUALS } }
        filter: { per_page: -1 }
    ) {
        scenes { id files { id path } }
    }
}
"""


def get_all_clip_images(client, clip_ext):
    """Images whose path contains a clip suffix (.vclip or the configured one), each once."""
    images, seen = [], set()
    for suffix in core.clip_suffixes(clip_ext):
        found, page = [], 1
        while True:
            data  = client.call(FIND_CLIP_IMAGES_QUERY, {"suffix": suffix, "page": page})
            batch = data["findImages"]["images"]
            total = data["findImages"]["count"]
            found.extend(batch)
            if len(found) >= total or not batch:
                break
            page += 1
        for image in found:
            if image["id"] not in seen:
                seen.add(image["id"])
                images.append(image)
    return images


def find_scenes_by_path(client, path):
    """Scenes with a file at exactly `path`."""
    found = client.call(FIND_SCENES_BY_PATH_QUERY, {"path": path})["findScenes"]["scenes"]
    return core.exact_path_matches(found, path, "to_scene")


def transfer_and_clean(client, image_id, scene_id, clip_path, original_path):
    """Move one old scene onto its clip the way the Convert to clip button does.

    toggle.transfer_to_image carries the fields, galleries and O count and parks the
    scene-only data (O and play history, markers, groups, stash ids) on the clip; then
    toggle.final_step retires the scene. The scene is kept when something could not be
    copied, or when it still has other files. Safe to run again on a kept scene: the O
    count is topped up, never added twice, and galleries are merged.

    The clip's own tags and custom fields are kept alongside the scene's (a scan or the
    user may have set them). Returns (state, warning): state is "done" or "kept".
    """
    scene = toggle.load_scene(client, scene_id)
    image = toggle.load_image(client, image_id)
    if not scene or not image:
        raise toggle.GraphQLError("the scene or the clip disappeared")
    old = [f for f in scene.get("files") or [] if f.get("path") == original_path]
    new = [f for f in image.get("visual_files") or [] if f.get("path") == clip_path]
    if not old or not new:
        raise toggle.GraphQLError("the scene or the clip no longer has that file")
    old_file_id, new_file_id = str(old[0]["id"]), str(new[0]["id"])
    remaining = [str(f["id"]) for f in scene["files"] if str(f["id"]) != old_file_id]

    tag_ids = sorted({str(t["id"]) for t in (image.get("tags") or []) + (scene.get("tags") or [])})
    custom = dict(core.user_custom_fields(image.get("custom_fields")))
    custom.update(core.user_custom_fields(scene.get("custom_fields")))
    source = dict(scene, tags=[{"id": t} for t in tag_ids], custom_fields=custom)

    _carried, _dropped, _saved, incomplete = toggle.transfer_to_image(
        client, source, image_id, have_o=image.get("o_counter"))
    warning = toggle.final_step(client, "to_clip", scene_id, old_file_id, new_file_id,
                                remaining, incomplete)
    return ("kept" if remaining or incomplete else "done"), warning


def transfer_main(client):
    log("=== Scene to ImageClip Converter: transfer metadata & clean up ===")

    _config, clip_ext = load_batch_config(client)
    names = " / ".join(core.clip_suffixes(clip_ext))
    log(f"── Finding {names} image clips ──")
    try:
        images = get_all_clip_images(client, clip_ext)
    except toggle.GraphQLError as exc:
        raise TaskFailed(f"Could not query image clips: {exc}")

    if not images:
        log(f"No {names} image clips found. Run the rename task and a library scan first.")
        progress(1.0)
        return f"No {names} image clips found."

    log(f"Found {len(images)} {names} image clip(s) to process.")

    transferred = 0
    kept        = 0
    skipped     = 0
    errors      = 0

    for i, image in enumerate(images):
        progress(i / len(images))

        # An image clip's file is a VideoFile, which Image.files (ImageFile
        # only) leaves out. visual_files returns both kinds.
        for f in image.get("visual_files") or []:
            if not core.has_clip_suffix(f.get("path") or "", clip_ext):
                continue

            original_path = core.strip_clip_suffix(f["path"], clip_ext)
            try:
                scenes = find_scenes_by_path(client, original_path)
            except toggle.GraphQLError as exc:
                logerr(f"  fail  {f['basename']}  —  {exc}")
                errors += 1
                continue

            if not scenes:
                log(f"  skip  {f['basename']}  (no scene found at {original_path})")
                skipped += 1
                continue
            if len(scenes) > 1:
                logwarn(f"  skip  {f['basename']}  ({len(scenes)} scenes at {original_path})")
                skipped += 1
                continue
            scene = scenes[0]

            try:
                state, warning = transfer_and_clean(client, image["id"], scene["id"],
                                                    f["path"], original_path)
            except toggle.GraphQLError as exc:
                logerr(f"  fail  {f['basename']}  —  {exc}")
                errors += 1
                continue
            transferred += 1
            if state == "kept":
                kept += 1
                logwarn(f"  kept  {f['basename']}  ← scene {scene['id']} "
                        f"({warning or 'it still has other files'})")
            elif warning:
                logwarn(f"  ok    {f['basename']}  ← scene {scene['id']}  ({warning})")
            else:
                log(f"  ok    {f['basename']}  ← scene {scene['id']}")

    progress(1.0)
    summary = (f"Done — transferred: {transferred}, old scenes kept: {kept}, "
               f"skipped: {skipped}, errors: {errors}.")
    log(summary)
    return summary


# ── Dispatcher ─────────────────────────────────────────────────────────────────

def dispatch(args, client):
    """The `output` (or raises TaskFailed) for one run, chosen by args.mode."""
    mode = args.get("mode")
    if mode == "convert":
        return convert_main(client)
    if mode == "rename":
        return rename_main(client)
    if mode == "transfer":
        return transfer_main(client)
    if mode == "recover":
        return toggle.run_recover(client)
    if mode in TOGGLE_MODES:
        return toggle.run(args, client)
    # Never fall back to a batch task: an unknown mode changes nothing.
    return toggle.refused(mode, core.normalize_id(args.get("id")), core.Refusal(
        "bad_args", "mode must be one of convert, rename, transfer, recover, to_clip, to_scene"))


def main(stdin=None, stdout=None):
    """Read Stash's input once, run the mode, write one JSON object to stdout."""
    stdout = stdout or sys.stdout
    try:
        # Log lines carry ✓ and —; never let a narrow console encoding crash a task.
        sys.stderr.reconfigure(errors="backslashreplace")
    except (AttributeError, ValueError):
        pass
    try:
        data = toggle.read_input(stdin)
        client = toggle.StashClient(data.get("server_connection") or {})
        payload = {"output": dispatch(data.get("args") or {}, client)}
    except TaskFailed as e:
        logerr(str(e))
        payload = {"error": str(e)}
    except Exception as e:
        toggle.log("e", "%s crashed (%s)" % (PLUGIN_ID, e.__class__.__name__))
        payload = {"error": "%s crashed (%s)" % (PLUGIN_ID, e.__class__.__name__)}
    stdout.write(json.dumps(payload) + "\n")
    stdout.flush()


if __name__ == "__main__":
    main()
