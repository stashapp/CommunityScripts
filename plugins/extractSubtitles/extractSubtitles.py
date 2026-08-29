"""Extract Embedded Subtitles - Stash plugin.

Extracts embedded *text* subtitle tracks (subrip/ass/ssa/mov_text/webvtt/...)
from video files into external `.srt` sidecar files named the way Stash expects,
then triggers a scan so Stash attaches them as captions.

Stash's caption matching (pkg/file/video/caption.go) recognises files named:
    <video_basename>.<lang>.srt   (e.g. movie.eng.srt)
    <video_basename>.srt          (when the language is unknown)
where <lang> must be a valid ISO-639 code. We reproduce that naming exactly so
the existing external-caption support picks the files up on the next scan.

Image-based subtitle codecs (PGS, VobSub, DVB, etc.) cannot be converted to text
and are skipped. Styled formats (ASS/SSA) are converted to SRT, which drops
positioning/styling - this is the same trade-off as most players' SRT export.
"""

import json
import os
import subprocess
import sys

import stashapi.log as log
from stashapi.stashapp import StashInterface

# --- subtitle codec classification -----------------------------------------

# Image-based subtitle codecs are bitmaps and cannot be converted to text SRT
# without OCR, so we skip them. Every other subtitle stream is handed to ffmpeg,
# which converts text formats (SubRip/ASS/SSA/mov_text/WebVTT/...) to SRT; if a
# stream genuinely can't be converted, the ffmpeg call fails and is counted as
# an error rather than silently dropped. (A blocklist beats an allowlist here:
# we won't miss a valid-but-unlisted text format.)
IMAGE_SUB_CODECS = {
    "hdmv_pgs_subtitle",
    "pgssub",
    "dvd_subtitle",
    "dvdsub",
    "dvb_subtitle",
    "dvbsub",
    "dvb_teletext",
    "xsub",
}

# ISO 639-2 "undefined" and the like - treated as "no language".
UNKNOWN_LANGS = {"", "und", "unknown", "none", "mis", "mul", "zxx"}

# Stash's CaptionExts (vtt preferred, but we emit srt as ffmpeg converts to it).
EXISTING_CAPTION_EXTS = ("srt", "vtt")


def normalize_lang(raw):
    """Return a filename language segment, or '' if unknown.

    Stash validates the segment with Go's language.ParseBase, which accepts
    2- or 3-letter ISO-639 codes. ffprobe usually emits 3-letter ISO-639-2
    (e.g. 'eng'), which is valid. Anything we don't trust maps to '' so the
    file becomes <basename>.srt (unknown language).
    """
    if raw is None:
        return ""
    lang = str(raw).strip().lower()
    if lang in UNKNOWN_LANGS:
        return ""
    # Only 2- or 3-letter alpha codes are valid ISO-639 bases.
    if len(lang) in (2, 3) and lang.isalpha():
        return lang
    return ""


def caption_path(video_path, lang):
    """Reproduce Stash's GetCaptionPath(path, lang, 'srt')."""
    base, _ext = os.path.splitext(video_path)
    if lang == "":
        return base + ".srt"
    return base + "." + lang + ".srt"


def has_existing_external_caption(video_path, lang):
    """True if Stash would already see an external caption for this language."""
    base, _ext = os.path.splitext(video_path)
    for ext in EXISTING_CAPTION_EXTS:
        if lang == "":
            candidate = base + "." + ext
        else:
            candidate = base + "." + lang + "." + ext
        if os.path.isfile(candidate):
            return True
    return False


# --- ffprobe / ffmpeg --------------------------------------------------------

def probe_subtitle_streams(ffprobe, video_path):
    """Return the list of subtitle stream dicts from ffprobe, or [] on error."""
    cmd = [
        ffprobe,
        "-v", "error",
        "-print_format", "json",
        "-show_streams",
        "-select_streams", "s",
        video_path,
    ]
    try:
        out = subprocess.run(
            cmd, capture_output=True, text=True, check=False
        )
    except FileNotFoundError:
        log.error("ffprobe not found at '%s' - set the path or add it to PATH" % ffprobe)
        raise
    if out.returncode != 0:
        log.warning("ffprobe failed for %s: %s" % (video_path, out.stderr.strip()))
        return []
    try:
        data = json.loads(out.stdout or "{}")
    except json.JSONDecodeError:
        log.warning("Could not parse ffprobe output for %s" % video_path)
        return []
    return data.get("streams", [])


def extract_stream(ffmpeg, video_path, stream_index, dest, overwrite):
    """Run ffmpeg to extract one subtitle stream to dest as SRT.

    Returns True on success.
    """
    cmd = [
        ffmpeg,
        "-loglevel", "error",
        "-y" if overwrite else "-n",
        "-i", video_path,
        "-map", "0:%d" % stream_index,
        "-c:s", "srt",
        dest,
    ]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, check=False)
    except FileNotFoundError:
        log.error("ffmpeg not found at '%s' - set the path or add it to PATH" % ffmpeg)
        raise
    if out.returncode != 0:
        # ffmpeg writes a tiny/empty file on some failures; clean it up.
        if os.path.isfile(dest) and os.path.getsize(dest) == 0:
            try:
                os.remove(dest)
            except OSError:
                pass
        log.warning("ffmpeg failed extracting stream %d of %s: %s"
                    % (stream_index, video_path, out.stderr.strip()))
        return False
    if not os.path.isfile(dest) or os.path.getsize(dest) == 0:
        log.warning("ffmpeg produced no usable subtitle for stream %d of %s"
                    % (stream_index, video_path))
        if os.path.isfile(dest):
            try:
                os.remove(dest)
            except OSError:
                pass
        return False
    return True


def process_file(ffprobe, ffmpeg, video_path, overwrite, stats):
    """Extract every distinct-language text subtitle from one video file.

    Stash stores at most one caption per (language, type), so we extract one
    SRT per language, preferring the stream marked 'default'. Returns the set
    of directories that gained new subtitle files (for later rescanning).
    """
    if not os.path.isfile(video_path):
        log.debug("Skipping missing file %s" % video_path)
        return set()

    streams = probe_subtitle_streams(ffprobe, video_path)
    if not streams:
        return set()

    # Prefer default-disposition streams first so the "best" track wins a tie.
    def sort_key(s):
        disp = s.get("disposition", {}) or {}
        return (
            0 if disp.get("default") else 1,
            0 if disp.get("forced") else 1,
            s.get("index", 0),
        )

    touched_dirs = set()
    used_targets = set()

    for s in sorted(streams, key=sort_key):
        codec = (s.get("codec_name") or "").lower()
        index = s.get("index")
        if index is None:
            continue

        if codec in IMAGE_SUB_CODECS:
            log.debug("Skipping image-based subtitle (%s) in %s" % (codec, video_path))
            stats["image_skipped"] += 1
            continue

        tags = s.get("tags", {}) or {}
        lang = normalize_lang(tags.get("language"))
        dest = caption_path(video_path, lang)

        # One caption per language: don't write a second file to the same name.
        if dest in used_targets:
            continue
        used_targets.add(dest)

        if not overwrite and os.path.isfile(dest):
            log.debug("Subtitle already exists, skipping: %s" % dest)
            stats["already_exists"] += 1
            continue

        # If the user already provided an external caption in this language
        # (e.g. a .vtt), don't clobber/duplicate it.
        if not overwrite and has_existing_external_caption(video_path, lang):
            log.debug("External caption already present for lang '%s': %s" % (lang or "und", video_path))
            stats["already_exists"] += 1
            continue

        if extract_stream(ffmpeg, video_path, index, dest, overwrite):
            log.info("Extracted %s subtitle -> %s" % (lang or "und", os.path.basename(dest)))
            stats["extracted"] += 1
            touched_dirs.add(os.path.dirname(dest))
        else:
            stats["errors"] += 1

    return touched_dirs


# --- scene helpers -----------------------------------------------------------

SCENE_FRAGMENT = "id title files { path }"


def process_scene(stash, ffprobe, ffmpeg, scene, overwrite, stats):
    touched = set()
    for f in scene.get("files", []) or []:
        path = f.get("path")
        if path:
            touched |= process_file(ffprobe, ffmpeg, path, overwrite, stats)
    return touched


def rescan_dirs(stash, dirs):
    """Trigger a Stash scan limited to the given directories so the new
    sidecar files are associated as captions."""
    paths = sorted(d for d in dirs if d)
    if not paths:
        return
    log.info("Triggering scan of %d folder(s) to attach captions" % len(paths))
    try:
        stash.metadata_scan(paths=paths)
    except Exception as e:  # noqa: BLE001 - surface but don't crash the plugin
        log.error("Failed to trigger scan: %s - run a Library scan manually to "
                  "attach the new subtitles. (%s)" % (paths, e))


# --- entry points ------------------------------------------------------------

def extract_all(stash, ffprobe, ffmpeg, overwrite):
    scenes = stash.find_scenes(fragment=SCENE_FRAGMENT)
    total = len(scenes)
    log.info("Checking %d scene(s) for embedded subtitles" % total)

    stats = {
        "extracted": 0,
        "already_exists": 0,
        "image_skipped": 0,
        "errors": 0,
    }
    touched = set()
    for i, scene in enumerate(scenes):
        touched |= process_scene(stash, ffprobe, ffmpeg, scene, overwrite, stats)
        if total:
            log.progress((i + 1) / total)

    rescan_dirs(stash, touched)

    log.info(
        "Done. Extracted %d, skipped %d existing, %d image-based, %d errors."
        % (stats["extracted"], stats["already_exists"], stats["image_skipped"],
           stats["errors"])
    )


def main():
    raw = sys.stdin.read()
    json_input = json.loads(raw)

    stash = StashInterface(json_input["server_connection"])
    config = stash.get_configuration()
    general = config.get("general", {}) or {}
    plugin_settings = (config.get("plugins", {}) or {}).get("extractSubtitles", {}) or {}

    # ffmpeg/ffprobe: prefer Stash's configured binaries, else rely on PATH.
    ffmpeg = general.get("ffmpegPath") or "ffmpeg"
    ffprobe = general.get("ffprobePath") or "ffprobe"

    overwrite = bool(plugin_settings.get("overwrite", False))
    extract_on_scan = bool(plugin_settings.get("extractOnScan", False))

    args = json_input.get("args", {}) or {}

    # Allow a task to override overwrite via defaultArgs if desired.
    if "overwrite" in args:
        overwrite = bool(args["overwrite"])

    mode = args.get("mode")
    if mode == "extractAll":
        extract_all(stash, ffprobe, ffmpeg, overwrite)
        return

    # Hook path: Scene.Create.Post
    hook = args.get("hookContext")
    if hook and hook.get("type") == "Scene.Create.Post":
        if not extract_on_scan:
            log.debug("Extract On Scan disabled; ignoring scene-create hook")
            return
        scene = stash.find_scene(hook.get("id"), fragment=SCENE_FRAGMENT)
        if not scene:
            return
        stats = {
            "extracted": 0, "already_exists": 0, "image_skipped": 0, "errors": 0,
        }
        touched = process_scene(stash, ffprobe, ffmpeg, scene, overwrite, stats)
        rescan_dirs(stash, touched)
        return

    log.debug("No actionable mode/hook in input; nothing to do")


if __name__ == "__main__":
    main()
