"""Argument parsing and the plugin entry point."""

from tagai_core import stash_client, stashlog
from tagai_core.debug import debug_start, resolve_debug_path
from tagai_core.images import get_images, get_images_force, get_images_w_tag
from tagai_core.jobs import run_image_job, run_scene_job
from tagai_core.markers import parse_marker_mode
from tagai_core.models import ensure_model_files, get_model
from tagai_core.scenes import get_scenes, get_scenes_force, get_scenes_w_tag
from tagai_core.stash_client import load_tag_cache, setup_connection
from tagai_core.tags import parse_tag_filter
from tagai_core.config import (
    CHAR_THRESHOLD, DEBUG_FLOOR_DEFAULT, DEBUG_TOP_DEFAULT, DEFAULT_IMAGE_MODEL,
    DEFAULT_VIDEO_MODEL, FRAME_COUNT_DEFAULT, FRAME_INTERVAL_DEFAULT,
    FRAME_WORKERS_DEFAULT, INFER_BATCH_SIZE_DEFAULT, JOYTAG_THRESHOLD_DEFAULT,
    MARKER_MAX_DEFAULT, MAX_FRAMES_DEFAULT, PER_PAGE_IMAGE_DEFAULT,
    PER_PAGE_VIDEO_DEFAULT, SEXPOS_MARGIN_DEFAULT, SEXPOS_THRESHOLD_DEFAULT,
    TAG_THRESHOLD, YOLO_DET_CONF_DEFAULT, YOLO_DET_IOU_DEFAULT, YOLO_MARGIN_DEFAULT,
    YOLO_MIN_VOTES_DEFAULT, YOLO_SHARE_DEFAULT, YOLO_THRESHOLD_DEFAULT,
    YOLO_TOP_K_DEFAULT, _DEP_IMPORT_ERROR,
)
import json
import os
import sys


def parse_model_names(value, default):
    """Normalise the ``model`` argument into an ordered list of model names.

    Accepts a single name or several separated by commas, semicolons or
    whitespace (e.g. ``yolo11-nsfw,sex-position``). Duplicates are dropped and
    an empty value falls back to ``default``.
    """
    if isinstance(value, (list, tuple)):
        raw = [str(item) for item in value]
    else:
        raw = str(value or "").replace(";", ",").replace(",", " ").split()

    names = []
    for item in raw:
        item = item.strip()
        if item and item not in names:
            names.append(item)
    if not names and default:
        names = [default]
    return names


def build_cfg(args):
    """Normalise the runtime configuration from the plugin args."""

    def as_int(key, default):
        try:
            return int(args.get(key, default))
        except (TypeError, ValueError):
            return default

    def as_float(key, default):
        try:
            return float(args.get(key, default))
        except (TypeError, ValueError):
            return default

    def as_bool(key, default=False):
        v = args.get(key, default)
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.strip().lower() in ("1", "true", "yes", "on")
        return bool(v)

    return {
        "tag_threshold": as_float("tag_threshold", TAG_THRESHOLD),
        "char_threshold": as_float("char_threshold", CHAR_THRESHOLD),
        "tag_characters": as_bool("tag_characters", False),
        "joytag_threshold": as_float("joytag_threshold", JOYTAG_THRESHOLD_DEFAULT),
        "det_conf": as_float("det_conf", YOLO_DET_CONF_DEFAULT),
        "det_iou": as_float("det_iou", YOLO_DET_IOU_DEFAULT),
        "sexpos_threshold": as_float("sexpos_threshold", SEXPOS_THRESHOLD_DEFAULT),
        "sexpos_margin": as_float("sexpos_margin", SEXPOS_MARGIN_DEFAULT),
        "yolo_threshold": as_float("yolo_threshold", YOLO_THRESHOLD_DEFAULT),
        "yolo_margin": as_float("yolo_margin", YOLO_MARGIN_DEFAULT),
        "frame_count": as_int("frame_count", FRAME_COUNT_DEFAULT),
        "frame_interval": as_float("frame_interval", FRAME_INTERVAL_DEFAULT),
        "max_frames": as_int("max_frames", MAX_FRAMES_DEFAULT),
        "frame_workers": as_int("frame_workers", FRAME_WORKERS_DEFAULT),
        "infer_batch_size": as_int("infer_batch_size", INFER_BATCH_SIZE_DEFAULT),
        "yolo_multi": as_bool("yolo_multi", True),
        "yolo_min_votes": as_int("yolo_min_votes", YOLO_MIN_VOTES_DEFAULT),
        "yolo_share": as_float("yolo_share", YOLO_SHARE_DEFAULT),
        "yolo_top_k": as_int("yolo_top_k", YOLO_TOP_K_DEFAULT),
        "ffmpeg_path": args.get("ffmpeg_path")
        or os.environ.get("TAGAI_FFMPEG")
        or "ffmpeg",
        "auto_download": as_bool("auto_download", True),
        "debug_log": args.get("debug_log"),
        "debug_floor": as_float("debug_floor", DEBUG_FLOOR_DEFAULT),
        "debug_top": as_int("debug_top", DEBUG_TOP_DEFAULT),
        "markers": parse_marker_mode(args.get("markers")),
        "marker_pad": as_float("marker_pad", None),
        "marker_max": as_int("marker_max", MARKER_MAX_DEFAULT),
        "marker_gap": as_float("marker_gap", 0.0),
        "marker_whitelist": parse_tag_filter(
            args.get("marker_whitelist"), args.get("tag_prefix", "AI: ")
        ),
        "marker_blacklist": parse_tag_filter(
            args.get("marker_blacklist"), args.get("tag_prefix", "AI: ")
        ),
        "tag_whitelist": parse_tag_filter(
            args.get("tag_whitelist"), args.get("tag_prefix", "AI: ")
        ),
        "tag_blacklist": parse_tag_filter(
            args.get("tag_blacklist"), args.get("tag_prefix", "AI: ")
        ),
        "hf_token": args.get("hf_token") or None,
    }


def main():
    if _DEP_IMPORT_ERROR:
        stashlog.log.error(
            "TagAI is missing a required Python dependency: "
            f"{_DEP_IMPORT_ERROR}. Install the requirements into the Python "
            "interpreter Stash uses for plugins (see requirements.txt), e.g. "
            "'pip install -r requirements.txt'."
        )
        return

    raw = sys.stdin.read()
    try:
        json_input = json.loads(raw) if raw.strip() else {}
    except ValueError as exc:
        stashlog.log.error(f"Invalid JSON on stdin: {exc}")
        json_input = {}

    setup_connection(json_input)

    args = (json_input or {}).get("args") or {}

    target = (args.get("target") or "images").lower()
    if target in ("video", "scene", "scenes"):
        target = "videos"
    if target not in ("images", "videos"):
        stashlog.log.error(f"Unknown target {target!r}; expected 'images' or 'videos'")
        return

    if target == "videos":
        default_model = DEFAULT_VIDEO_MODEL
        default_per_page = PER_PAGE_VIDEO_DEFAULT
    else:
        default_model = DEFAULT_IMAGE_MODEL
        default_per_page = PER_PAGE_IMAGE_DEFAULT

    model_names = parse_model_names(args.get("model"), default_model)

    mode = args.get("mode") or "TagAll"
    if mode not in ("TagAll", "ForceTag", "Tagged"):
        stashlog.log.error(
            f"Unknown mode {mode!r}; expected TagAll, ForceTag or Tagged"
        )
        return

    try:
        per_page = int(args.get("batch_size") or default_per_page)
    except (TypeError, ValueError):
        per_page = default_per_page

    prefix = args.get("tag_prefix", "AI: ")
    cfg = build_cfg(args)
    cfg["debug"] = debug_start(resolve_debug_path(cfg.get("debug_log")), cfg)

    load_tag_cache()
    flag_tag_id = stash_client.ensure_tag(args.get("flag_tag") or "AI_TagMe")
    ai_tagged_id = stash_client.ensure_tag(args.get("add_tag") or "AI_Tagged")
    if not flag_tag_id or not ai_tagged_id:
        stashlog.log.error("TagAI could not create the required flag/tagged tags; aborting")
        return

    models = []
    for name in model_names:
        try:
            ensure_model_files(
                name,
                token=cfg.get("hf_token"),
                allow_download=cfg.get("auto_download", True),
                on_progress=lambda p: stashlog.log.progress(p),
            )
        except Exception as exc:
            stashlog.log.error(f"Could not obtain model {name!r}: {exc}")
            continue

        try:
            models.append(get_model(name))
        except Exception as exc:
            stashlog.log.error(f"Could not load model {name!r}: {exc}")

    if not models:
        stashlog.log.error("TagAI could not load any model; aborting")
        return

    stashlog.log.info(
        f"TagAI: target={target} models={','.join(m['name'] for m in models)} "
        f"mode={mode} per_page={per_page}"
    )

    if target == "images":
        if mode == "TagAll":
            fetch = lambda page: get_images(ai_tagged_id, page, per_page)
        elif mode == "ForceTag":
            fetch = lambda page: get_images_force(page, per_page)
        else:
            fetch = lambda page: get_images_w_tag(flag_tag_id, page, per_page)

        processed = run_image_job(
            fetch, mode, per_page, models, cfg, flag_tag_id, ai_tagged_id, prefix
        )
    else:
        if mode == "TagAll":
            fetch = lambda page: get_scenes(ai_tagged_id, page, per_page)
        elif mode == "ForceTag":
            fetch = lambda page: get_scenes_force(page, per_page)
        else:
            fetch = lambda page: get_scenes_w_tag(flag_tag_id, page, per_page)

        processed = run_scene_job(
            fetch, mode, per_page, models, cfg, flag_tag_id, ai_tagged_id, prefix
        )

    stashlog.log.info(f"TagAI finished: processed {len(processed)} item(s)")
