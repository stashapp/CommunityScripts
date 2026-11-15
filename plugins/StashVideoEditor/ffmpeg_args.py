# Pure helpers for building the re-encode ffmpeg command. No Stash imports.

def even(n):
    n = int(round(n))
    if n < 0:
        return 0
    return n - (n % 2)

def build_vf(crop, out_w, out_h):
    cw, ch = even(crop["width"]), even(crop["height"])
    cx, cy = even(crop["x"]), even(crop["y"])
    ow, oh = even(out_w), even(out_h)
    return "crop=%d:%d:%d:%d,scale=%d:%d,setsar=1,format=yuv420p" % (cw, ch, cx, cy, ow, oh)

def mirror_encode_args(config_general):
    ffmpeg = config_general.get("ffmpegPath") or "ffmpeg"
    input_args = list(config_general.get("transcodeInputArgs") or [])
    output_args = list(config_general.get("transcodeOutputArgs") or [])
    if not output_args:
        output_args = ["-c:v", "libx264", "-crf", "18", "-preset", "slow"]
    return {"ffmpeg": ffmpeg, "input_args": input_args, "output_args": output_args}

# Containers a re-encode may keep. Anything else (webm cannot hold H.264; avi, wmv
# and the like are poor homes for it) is written as .mp4 instead.
REENCODE_CONTAINERS = (".mp4", ".m4v", ".mov", ".mkv")

# ffmpeg muxer names by extension. Knowing the muxer lets the in-progress file carry
# a non-media name (so a scan never picks up a half-written file) with `-f`.
MUXERS = {".mp4": "mp4", ".m4v": "mp4", ".mov": "mov", ".mkv": "matroska",
          ".webm": "webm", ".avi": "avi", ".wmv": "asf", ".flv": "flv",
          ".ts": "mpegts", ".mpg": "mpeg", ".mpeg": "mpeg"}

def reencode_target(src_ext):
    """(output extension, audio args) for a re-encode of a source with this
    extension. A kept container copies the audio. A changed container gets AAC,
    because the source's audio codec may not fit in mp4."""
    ext = (src_ext or "").lower()
    if ext in REENCODE_CONTAINERS:
        return ext, ["-c:a", "copy"]
    return ".mp4", ["-c:a", "aac"]

def partial_target(dst):
    """(in-progress path, muxer or None) for an output path. With a known muxer the
    in-progress file ends in `.sve-partial`, which Stash does not scan. Otherwise it
    keeps the real extension last so ffmpeg can still pick the muxer from the name."""
    ext = dst[dst.rfind("."):].lower() if "." in dst else ""
    fmt = MUXERS.get(ext)
    if fmt:
        return dst + ".sve-partial", fmt
    return dst + ".sve-partial" + ext, None

def _fmt_args(fmt):
    return ["-f", fmt] if fmt else []

def build_command(ffmpeg, src, dst, vf, input_args, output_args,
                  audio_args=None, fmt=None):
    # Map the first video stream and any audio only. `-map 0` would also send data
    # tracks (timecode, telemetry) and cover-art streams through the encoder and the
    # crop filter, and ffmpeg fails on both.
    audio = ["-c:a", "copy"] if audio_args is None else list(audio_args)
    return ([ffmpeg, "-loglevel", "error", "-y", *input_args, "-i", src,
             "-map", "0:v:0", "-map", "0:a?",
             "-vf", vf, *output_args, *audio, *_fmt_args(fmt), dst])

def format_timestamp(seconds):
    """Compact decimal-seconds string for ffmpeg -ss/-to (no trailing zeros)."""
    return ("%.3f" % float(seconds)).rstrip("0").rstrip(".")

def build_trim_command(ffmpeg, src, dst, start, end, lossless,
                       input_args=None, output_args=None, audio_args=None, fmt=None):
    """Build a trim ffmpeg command for one in/out range.

    Seek (-ss/-to) is placed BEFORE -i in both modes:
      * lossless (-c copy): input-side seek snaps the in-point to the nearest
        preceding keyframe, so the output always CONTAINS the chosen range.
      * precision (re-encode): input-side seek is still fast, and ffmpeg decodes
        forward to the exact requested frame before encoding — frame-accurate.
    """
    ss, to = format_timestamp(start), format_timestamp(end)
    if lossless:
        # Video, audio and subtitles are copied. Data tracks are left out: several
        # muxers refuse them even as a copy.
        return [ffmpeg, "-loglevel", "error", "-y",
                "-ss", ss, "-to", to, "-i", src,
                "-map", "0:v", "-map", "0:a?", "-map", "0:s?",
                "-c", "copy", "-avoid_negative_ts", "make_zero",
                *_fmt_args(fmt), dst]
    audio = ["-c:a", "copy"] if audio_args is None else list(audio_args)
    return [ffmpeg, "-loglevel", "error", "-y",
            *list(input_args or []), "-ss", ss, "-to", to, "-i", src,
            "-map", "0:v:0", "-map", "0:a?",
            *list(output_args or []), *audio, *_fmt_args(fmt), dst]
