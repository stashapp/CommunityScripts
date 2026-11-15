# video_editor.py
import json
import os
import re
import subprocess
import sys
import urllib.request

from encode_hook import (hook_settings, build_job, encode as hook_or_local,
                         run_hook_process, output_size)
from ffmpeg_args import (even, mirror_encode_args, build_vf, build_command,
                         build_trim_command, reencode_target, partial_target)
from stash_ops import (find_scene_query, find_image_query, get_configuration_query,
                       metadata_scan_mutation, find_file_id_query,
                       scene_merge_mutation, set_primary_mutation,
                       generate_scene_mutation, generate_image_mutation,
                       scene_markers_query, marker_update_mutation,
                       marker_destroy_mutation)

PLUGIN_ID = "StashVideoEditor"
EDITED_SUFFIX = ".edited"
# Edits this plugin has encoded and not yet swapped in: {output path: record}.
# The record is what makes a file "ours". The hook and the merge task act only on
# recorded paths, so a file a user happened to name `something.edited.mp4` is never
# touched, and a finished edit is never processed twice.
PENDING_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                            "sve-pending.json")


def _log(level, msg):
    sys.stderr.write("\x01%s\x02%s\n" % (level, msg))
    sys.stderr.flush()


class StashGQL:
    def __init__(self, conn):
        scheme = conn.get("Scheme", "http")
        host = conn.get("Host", "localhost")
        if host in ("", "0.0.0.0"):
            host = "localhost"
        port = conn.get("Port", 9999)
        self.url = "%s://%s:%s/graphql" % (scheme, host, port)
        self.headers = {"Content-Type": "application/json"}
        cookie = conn.get("SessionCookie") or {}
        if cookie.get("Name"):
            self.headers["Cookie"] = "%s=%s" % (cookie["Name"], cookie.get("Value", ""))
        if conn.get("ApiKey"):
            self.headers["ApiKey"] = conn["ApiKey"]

    def call(self, query, variables=None):
        body = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
        req = urllib.request.Request(self.url, data=body, headers=self.headers, method="POST")
        with urllib.request.urlopen(req) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        if payload.get("errors"):
            raise RuntimeError("GraphQL error: %s" % payload["errors"])
        return payload["data"]


# ── Pending-edit records ──────────────────────────────────────────────────────
def load_pending(path=None):
    try:
        with open(path or PENDING_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {}
    except (OSError, ValueError):
        return {}


def save_pending(pending, path=None):
    path = path or PENDING_FILE
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(pending, f)
    os.replace(tmp, path)


def add_pending(dst, record, path=None):
    pending = load_pending(path)
    pending[os.path.normpath(dst)] = record
    save_pending(pending, path)


def drop_pending(dst, path=None):
    pending = load_pending(path)
    if pending.pop(os.path.normpath(dst), None) is not None:
        save_pending(pending, path)


def derive_output_path(src, ext=None, exists=os.path.exists):
    """Path for the edited file: `<root>.edited<ext>` next to the source. `ext`
    defaults to the source's. A name that is already taken (an earlier edit of the
    same source) gets `.edited-2`, `.edited-3`, … so every edit is a NEW file: the
    scan then creates a scene for it and the hook runs. Overwriting a file Stash
    already knows would create no scene and the edit would never be swapped in."""
    root, src_ext = os.path.splitext(src)
    ext = ext or src_ext or ".mp4"
    candidate = root + EDITED_SUFFIX + ext
    n = 2
    while exists(candidate):
        candidate = "%s%s-%d%s" % (root, EDITED_SUFFIX, n, ext)
        n += 1
    return candidate


def remap_markers(markers, start, new_duration, eps=0.05):
    """Shift scene markers onto a trimmed timeline. Each marker moves earlier by
    `start`; markers whose moment falls outside the kept [0, new_duration] range are
    dropped (their footage is gone). Markers that do not move are left out. Returns
    a list of {action: update|delete, ...}.
    new_duration None ⇒ no upper bound (cull only the front)."""
    upper = float("inf") if new_duration is None else new_duration
    actions = []
    for m in markers:
        sec = m.get("seconds")
        if sec is None:
            continue
        ns = sec - start
        if ns < -eps or ns > upper + eps:
            actions.append({"action": "delete", "id": m["id"]})
            continue
        ns = max(0.0, ns)
        es = m.get("end_seconds")
        nes = None
        if es is not None:
            nes = min(max(es - start, ns), upper) if upper != float("inf") else max(es - start, ns)
        if ns == sec and nes == es:
            continue  # nothing moved (a trim that kept the start)
        actions.append({"action": "update", "id": m["id"], "seconds": ns, "end_seconds": nes})
    return actions


def scrub_paths(text, src):
    """Remove file paths from a message bound for the Stash log. Every path this
    plugin handles for one edit (source, partial, output, backup) starts with the
    source path minus its extension, so one prefix replace covers them all. The
    pattern consumes spaces and stops at a quote, colon or newline, so the rest of
    the message survives."""
    root = os.path.splitext(src)[0] if src else ""
    if not root:
        return text
    return re.sub(re.escape(root) + r"[^'\":\n]*", "<file>", text)


def scrub_ffmpeg_error(stderr, src, max_lines=3):
    """First few non-empty lines of ffmpeg's stderr with file paths removed, so the
    Stash log shows the cause of a failure without printing library file names.
    ffmpeg prints the root cause first and follow-on errors after it."""
    text = stderr.decode("utf-8", "replace") if isinstance(stderr, bytes) else (stderr or "")
    lines = [ln.strip() for ln in scrub_paths(text, src).splitlines() if ln.strip()]
    return " | ".join(lines[:max_lines])


def _err(e, src=None):
    return scrub_paths(str(e), src)


def _remove_quietly(path):
    try:
        if os.path.exists(path):
            os.remove(path)
    except OSError:
        pass


def _run_encode(cmd, src, tmp, dst):
    """Run ffmpeg, then move the finished file into place. Raises on failure.
    Encodes to `tmp` first so a failed or interrupted run never leaves a
    half-written file at `dst`. The source is never touched."""
    _log("i", "[SVE] encoding")
    try:
        result = subprocess.run(cmd, stderr=subprocess.PIPE)
    except BaseException:
        _remove_quietly(tmp)
        raise
    if result.returncode != 0:
        _remove_quietly(tmp)
        detail = scrub_ffmpeg_error(result.stderr, src)
        raise RuntimeError("ffmpeg failed (returncode %s)%s"
                           % (result.returncode, ": " + detail if detail else ""))
    os.replace(tmp, dst)


def _encode(cfg, job_fields, make_cmd, enc, src, tmp, dst, audio_args, fmt):
    """Encode src to dst: through the configured encode hook when there is one and
    this edit is a re-encode (job_fields is not None), else (or when the hook misses)
    with the local ffmpeg. Both write the in-progress name `tmp`, which Stash does not
    scan, and the result is moved onto dst only when it is complete. Raises when the
    local encode fails. Returns "encode hook" or "local"."""
    hook, timeout = hook_settings((cfg.get("plugins") or {}).get(PLUGIN_ID))
    job = None
    if hook and job_fields is not None:
        fields = dict(job_fields)
        job = build_job(fields.pop("op"), src, tmp, fmt, dst, enc, audio_args,
                        make_cmd(enc, src, tmp, audio_args, fmt), **fields)
    where = hook_or_local(
        hook if job else None, timeout, job, tmp,
        run_hook=run_hook_process,
        local=lambda: _run_encode(make_cmd(enc, src, tmp, audio_args, fmt), src, tmp, dst),
        size_of=output_size, remove=_remove_quietly,
        log=lambda msg: _log("i", "[SVE] " + msg))
    if where == "hook":
        os.replace(tmp, dst)
        return "encode hook"
    return "local"


def _missing(args, keys):
    """Names of required task arguments that are absent. The crop and trim tasks
    also show under Settings > Tasks, where they have no arguments to work with."""
    return [k for k in keys if args.get(k) is None]


def _scene_edit(gql, args, op, make_cmd, ext_for_src, start=None, job_fields=None):
    """Shared scene flow: record the edit, encode a new file, queue a scan, EXIT.
    We cannot wait for the scan: Stash's job queue is serial, so the scan cannot run
    until this task exits. The Scene.Create.Post hook finishes the swap once the
    scan has created a scene for the new file. `job_fields` (op-specific fields of
    the encode-hook job) is None for an edit that is never handed to the hook."""
    scene_id = str(args["scene_id"])
    scene = gql.call(*find_scene_query(scene_id))["findScene"]
    if not scene or not scene.get("files"):
        _log("e", "[SVE] scene %s has no files" % scene_id)
        return
    src = scene["files"][0]["path"]
    ext, audio_args = ext_for_src(os.path.splitext(src)[1])
    dst = derive_output_path(src, ext)
    tmp, fmt = partial_target(dst)

    cfg = gql.call(*get_configuration_query())["configuration"]
    enc = mirror_encode_args(cfg["general"])
    if job_fields is not None:
        job_fields = dict(job_fields, op=op, scene_id=scene_id)

    record = {"scene_id": scene_id, "op": op}
    if start is not None:
        record["start"] = start
    try:
        # Recorded BEFORE the encode: if the record cannot be written the edit could
        # never be swapped in, so fail now rather than after a long encode.
        add_pending(dst, record)
    except OSError as e:
        _log("e", "[SVE] cannot write the pending-edit record in the plugin folder: %s"
             % e.strerror)
        return
    try:
        where = _encode(cfg, job_fields, make_cmd, enc, src, tmp, dst, audio_args, fmt)
    except Exception as e:
        drop_pending(dst)
        _log("e", "[SVE] %s failed scene %s: %s" % (op, scene_id, _err(e, src)))
        return
    _log("i", "[SVE] %s done for scene %s (%s)" % (op, scene_id, where))

    scan_data = gql.call(*metadata_scan_mutation(dst))
    _log("i", "[SVE] queued scan job=%s; the swap runs via the Scene.Create.Post hook"
         % scan_data.get("metadataScan"))


# ── Task (UI-triggered): crop / stretch ───────────────────────────────────────
def crop_reencode(gql, args):
    missing = _missing(args, ("scene_id", "crop", "out_w", "out_h"))
    if missing:
        _log("e", "[SVE] nothing to crop: open the editor with the Crop & re-encode "
                  "button on a scene page (missing %s)" % ", ".join(missing))
        return
    vf = build_vf(args["crop"], int(args["out_w"]), int(args["out_h"]))

    def make_cmd(enc, src, tmp, audio_args, fmt):
        return build_command(enc["ffmpeg"], src, tmp, vf, enc["input_args"],
                             enc["output_args"], audio_args=audio_args, fmt=fmt)

    _scene_edit(gql, args, "crop", make_cmd, reencode_target,
                job_fields=_crop_job_fields(args["crop"], args["out_w"], args["out_h"]))


def _crop_job_fields(crop, out_w, out_h):
    """Crop box and output size as the encode uses them (even, as in build_vf)."""
    return {"crop": {k: even(crop[k]) for k in ("x", "y", "width", "height")},
            "out_w": even(int(out_w)), "out_h": even(int(out_h))}


# ── Image-clip crop (UI-triggered) — overwrite-in-place swap ─────────────────
# Image clips (.vclip videos filed under the Image model) have no imageAssignFile /
# imageMerge API, so the scene-style scan→merge→setPrimary flow can't be reused.
# Instead we re-encode to a sibling file, keep the original as a `.sve-bak` sidecar
# (Stash ignores that extension), move the edited file onto the canonical path, and
# rescan so Stash re-fingerprints the changed file IN PLACE — preserving the image
# record and all its metadata. No new record, no merge, no markers (clips have none).
def imageclip_edited_path(path):
    """Sibling encode target, ALWAYS `.mp4`, on the SAME directory as the source (so
    the final os.replace is an atomic rename): `/x/clip.web.vclip` →
    `/x/clip.web.sve-imgedit.mp4`.

    Why always mp4 (not the source's extension): the crop re-encodes to H.264 (Stash's
    transcode default), so the output CONTAINER must accept H.264. The source's own
    inner extension can't be trusted for that — it may be `.webm` (which rejects H.264),
    or a non-standard tag like `.web`/`.gif` that ffmpeg can't mux at all ("Unable to
    choose an output format"). mp4 always accepts H.264; the file is then renamed onto the
    `.vclip` path, so the real container is invisible to Stash either way."""
    root, _ = os.path.splitext(path)  # drops the trailing `.vclip` (or real ext)
    return root + ".sve-imgedit.mp4"


def swap_in_place(src, edited, backup):
    """Put `edited` at `src`, keeping the ORIGINAL at `backup`.
    First crop: the original moves to `backup`, then the edit takes its place; if
    that second step fails the original is moved back. Later crops: `backup` already
    holds the true original, so it is left alone and the edit replaces the previous
    crop directly. The original is never deleted."""
    if os.path.exists(backup):
        os.replace(edited, src)
        return
    os.replace(src, backup)
    try:
        os.replace(edited, src)
    except Exception:
        os.replace(backup, src)  # roll back: the original returns to its path
        raise


def image_crop(gql, args):
    missing = _missing(args, ("image_id", "crop", "out_w", "out_h"))
    if missing:
        _log("e", "[SVE] nothing to crop: open the editor with the Crop & re-encode "
                  "button on an image clip page (missing %s)" % ", ".join(missing))
        return
    image_id = str(args["image_id"])
    crop = args["crop"]
    out_w, out_h = int(args["out_w"]), int(args["out_h"])

    image = gql.call(*find_image_query(image_id)).get("findImage")
    files = (image or {}).get("visual_files") or []
    vfile = next((f for f in files if f.get("__typename") == "VideoFile"), None)
    if not vfile:
        _log("e", "[SVE] image %s has no video (vclip) file to crop" % image_id)
        return
    src = vfile["path"]
    edited = imageclip_edited_path(src)
    tmp, fmt = partial_target(edited)

    cfg = gql.call(*get_configuration_query())["configuration"]
    enc = mirror_encode_args(cfg["general"])
    vf = build_vf(crop, out_w, out_h)

    def make_cmd(enc, src, out, audio_args, fmt):
        return build_command(enc["ffmpeg"], src, out, vf, enc["input_args"],
                             enc["output_args"], audio_args=audio_args, fmt=fmt)

    job_fields = dict(_crop_job_fields(crop, out_w, out_h), op="crop", image_id=image_id)
    try:
        # The clip's real container is unknown (the name ends in .vclip), so audio is
        # re-encoded to AAC, which mp4 always accepts.
        where = _encode(cfg, job_fields, make_cmd, enc, src, tmp, edited,
                        ["-c:a", "aac"], fmt)
    except Exception as e:
        _log("e", "[SVE] image crop failed image %s: %s" % (image_id, _err(e, src)))
        return

    try:
        swap_in_place(src, edited, src + ".sve-bak")
    except Exception as e:
        _remove_quietly(edited)
        _log("e", "[SVE] image %s swap failed, clip left as it was: %s"
             % (image_id, _err(e, src)))
        return
    _log("i", "[SVE] cropped image %s (%s; original kept as .sve-bak)" % (image_id, where))

    scan_data = gql.call(*metadata_scan_mutation(src))
    _log("i", "[SVE] queued scan job=%s to refresh image %s dimensions in place"
         % (scan_data.get("metadataScan"), image_id))

    # Regenerate the clip's preview/thumbnail — the scan re-fingerprints the file but
    # does NOT redraw generated assets, so without this the animated preview keeps
    # showing the pre-crop frame. Queued after the scan; Stash's serial job queue runs
    # scan → generate in order, so generate sees the re-fingerprinted file.
    try:
        gen = gql.call(*generate_image_mutation(image_id))
        _log("i", "[SVE] queued generate job=%s (clipPreview/thumbnail overwrite) for image %s"
             % (gen.get("metadataGenerate"), image_id))
    except Exception as e:
        _log("e", "[SVE] image %s generate queue FAILED (crop applied; preview stays stale): %s"
             % (image_id, _err(e, src)))


# ── Task (UI-triggered): lossless / precision TRIM, same swap flow ────────────
# A trim is a distinct, crop-mutually-exclusive operation. Lossless = stream-copy
# (-c copy, instant, the cut snaps to the nearest keyframe so the output always
# CONTAINS the chosen range). Precision = re-encode for a frame-accurate cut.
def trim(gql, args):
    missing = _missing(args, ("scene_id", "start", "end"))
    if missing:
        _log("e", "[SVE] nothing to trim: open the editor with the Trim button on a "
                  "scene page (missing %s)" % ", ".join(missing))
        return
    start, end = float(args["start"]), float(args["end"])
    mode = args.get("mode")
    if mode == "lossless_trim":
        lossless = True
    elif mode == "precision_trim":
        lossless = False
    else:
        lossless = bool(args.get("lossless", True))

    def make_cmd(enc, src, tmp, audio_args, fmt):
        if lossless:
            return build_trim_command(enc["ffmpeg"], src, tmp, start, end,
                                      lossless=True, fmt=fmt)
        return build_trim_command(enc["ffmpeg"], src, tmp, start, end, lossless=False,
                                  input_args=enc["input_args"],
                                  output_args=enc["output_args"],
                                  audio_args=audio_args, fmt=fmt)

    # A stream copy keeps the source container; a re-encode may have to change it.
    ext_for_src = (lambda ext: (ext or ".mp4", None)) if lossless else reencode_target
    # A lossless trim is a stream copy that takes seconds: never handed to the hook.
    _scene_edit(gql, args, "trim", make_cmd, ext_for_src, start=start,
                job_fields=None if lossless else {"start": start, "end": end})


# ── Hook (Scene.Create.Post) and merge task: finish a recorded edit ───────────
# The hook runs inside the scan job, so it never waits on a queued job. sceneMerge
# is a synchronous mutation (not a job), so there is no deadlock.
def _match_pending(scene, pending):
    """(file, key, record) for the first of the scene's files that has a pending
    record, or (None, None, None)."""
    for f in scene.get("files") or []:
        key = os.path.normpath(f["path"])
        if key in pending:
            return f, key, pending[key]
    return None, None, None


def _finish_edit(gql, scene, edited, key, rec):
    """Swap a recorded edit in: merge its scene into the source scene (unless the
    file is already there), make it primary, move markers for a trim, regenerate.
    The record is dropped once the file is primary, so nothing here runs twice.
    Returns True on success."""
    sid = str(scene["id"])
    target = str(rec.get("scene_id"))
    edited_file_id = edited["id"]

    if sid != target:
        if not gql.call(*find_scene_query(target)).get("findScene"):
            _log("e", "[SVE] source scene %s no longer exists; leaving scene %s as its "
                      "own scene" % (target, sid))
            drop_pending(key)
            return False
        try:
            gql.call(*scene_merge_mutation([sid], target))
            _log("i", "[SVE] merged new scene %s into source scene %s" % (sid, target))
        except Exception as e:
            _log("e", "[SVE] sceneMerge FAILED (new=%s source=%s): %s"
                 % (sid, target, _err(e, key)))
            return False

    # Promote to primary separately — merge discards a requested primary when the
    # destination already has one (merge.go); the edited file is now associated.
    try:
        gql.call(*set_primary_mutation(target, edited_file_id))
        _log("i", "[SVE] set primary file=%s on scene %s" % (edited_file_id, target))
    except Exception as e:
        _log("e", "[SVE] set primary FAILED (scene=%s file=%s): %s"
             % (target, edited_file_id, _err(e, key)))
        return False

    # Dropped before the marker pass: a marker shift must never be applied twice.
    drop_pending(key)

    # Trim only: the timeline moved, so shift the scene's markers onto it and drop
    # the ones whose moment was cut away. A trim that kept the start (offset 0) still
    # needs the pass, for markers past the new end.
    if rec.get("op") == "trim":
        _remap_scene_markers(gql, target, float(rec.get("start") or 0.0), edited_file_id)

    try:
        gql.call(*generate_scene_mutation(target))
        _log("i", "[SVE] queued generate (overwrite) for scene %s" % target)
    except Exception as e:
        _log("e", "[SVE] generate FAILED (scene=%s): %s" % (target, _err(e, key)))
    return True


def _remap_scene_markers(gql, scene_id, offset, file_id=None):
    try:
        data = gql.call(*scene_markers_query(scene_id))["findScene"]
    except Exception as e:
        _log("e", "[SVE] marker query FAILED (scene=%s): %s" % (scene_id, e))
        return
    markers = data.get("scene_markers") or []
    if not markers:
        return
    files = data.get("files") or []
    trimmed = next((f for f in files if str(f.get("id")) == str(file_id)),
                   files[0] if files else None)
    new_dur = trimmed.get("duration") if trimmed else None
    shifted = removed = 0
    for a in remap_markers(markers, offset, new_dur):
        try:
            if a["action"] == "delete":
                gql.call(*marker_destroy_mutation(a["id"]))
                removed += 1
            else:
                gql.call(*marker_update_mutation(a["id"], a["seconds"], a["end_seconds"]))
                shifted += 1
        except Exception as e:
            _log("e", "[SVE] marker %s %s FAILED: %s" % (a["id"], a["action"], e))
    _log("i", "[SVE] trim marker remap (shift %.3fs): %d shifted, %d removed"
         % (offset, shifted, removed))


def merge_hook(gql, new_scene_id):
    if not new_scene_id:
        return
    pending = load_pending()
    if not pending:
        return  # the usual case during a scan: nothing of ours is waiting
    scene = gql.call(*find_scene_query(str(new_scene_id)))["findScene"]
    if not scene:
        return
    edited, key, rec = _match_pending(scene, pending)
    if edited:
        _finish_edit(gql, scene, edited, key, rec)


def merge_all(gql):
    """Manual fallback task: finish every recorded edit the hook did not."""
    pending = load_pending()
    _log("i", "[SVE] merge: %d edit(s) waiting" % len(pending))
    done = 0
    for key, rec in list(pending.items()):
        scenes = gql.call(*find_file_id_query(key))["findScenes"]["scenes"]
        scene = edited = None
        for s in scenes:
            edited = next((f for f in s["files"] if os.path.normpath(f["path"]) == key), None)
            if edited:
                scene = s
                break
        if scene:
            if _finish_edit(gql, scene, edited, key, rec):
                done += 1
        elif os.path.exists(key):
            job = gql.call(*metadata_scan_mutation(key)).get("metadataScan")
            _log("i", "[SVE] an edit for scene %s is not scanned yet; queued scan job=%s"
                 % (rec.get("scene_id"), job))
        else:
            _log("i", "[SVE] the edited file for scene %s is gone; record dropped"
                 % rec.get("scene_id"))
            drop_pending(key)
    _log("i", "[SVE] merge done: finished %d of %d" % (done, len(pending)))


def main():
    data = json.loads(sys.stdin.read())
    gql = StashGQL(data["server_connection"])
    args = data.get("args", {})
    if args.get("mode") == "crop_reencode":
        crop_reencode(gql, args)
    elif args.get("mode") == "image_crop":
        image_crop(gql, args)
    elif args.get("mode") in ("trim", "lossless_trim", "precision_trim"):
        trim(gql, args)
    elif args.get("mode") == "merge":
        merge_all(gql)
    elif "hookContext" in args:
        ctx = args["hookContext"] or {}
        if str(ctx.get("type", "")).startswith("Scene.Create"):
            merge_hook(gql, ctx.get("id"))


if __name__ == "__main__":
    main()
