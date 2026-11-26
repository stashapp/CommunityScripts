"""Calibration debug report (JSON) helpers."""

from tagai_core import config, stashlog
from tagai_core.config import DEBUG_AGG_TOP_DEFAULT, DEBUG_FILENAME
import json
import os
import time


def aggregate_candidates(per_frame):
    """Per-tag max of several candidate lists, best first."""
    best = {}
    for candidates in per_frame:
        for name, score in candidates:
            if name not in best or score > best[name]:
                best[name] = float(score)
    return sorted(best.items(), key=lambda kv: kv[1], reverse=True)


def _debug_settings(model, cfg):
    """The cfg values that decide whether this model's tags are accepted."""
    family = model["family"]
    if family == "wd":
        return {
            "tag_threshold": cfg.get("tag_threshold"),
            "char_threshold": cfg.get("char_threshold"),
            "tag_characters": cfg.get("tag_characters"),
        }
    if family == "joytag":
        return {"joytag_threshold": cfg.get("joytag_threshold")}
    if family == "yolo-det":
        return {
            "det_conf": cfg.get("det_conf"),
            "det_iou": cfg.get("det_iou"),
        }
    if family == "sexpos":
        return {
            "sexpos_threshold": cfg.get("sexpos_threshold"),
            "sexpos_margin": cfg.get("sexpos_margin"),
        }
    return {
        "yolo_threshold": cfg.get("yolo_threshold"),
        "yolo_margin": cfg.get("yolo_margin"),
        "yolo_top_k": cfg.get("yolo_top_k"),
        "yolo_multi": cfg.get("yolo_multi"),
        "yolo_min_votes": cfg.get("yolo_min_votes"),
        "yolo_share": cfg.get("yolo_share"),
        "thresholds": model.get("thresholds"),
    }


def _debug_entry(model, cfg):
    """Start a debug record for one model."""
    return {
        "name": model.get("name"),
        "family": model["family"],
        "settings": _debug_settings(model, cfg),
        "per_frame": [],
    }


def _finish_debug_entry(entry, tags):
    """Store the aggregated candidates and the accepted tags in an entry."""
    if entry is None:
        return
    accepted = [name for name, _score in tags]
    entry["tags"] = accepted
    aggregate = aggregate_candidates(entry.get("per_frame") or [])
    entry["aggregate"] = [
        {"tag": name, "score": round(float(score), 4), "accepted": name in accepted}
        for name, score in aggregate[:DEBUG_AGG_TOP_DEFAULT]
    ]


def _debug_pairs(candidates):
    """Compact ``[[tag, score], ...]`` rows for the debug report."""
    return [[name, round(float(score), 4)] for name, score in candidates]


_DEBUG = {"path": None, "items": [], "settings": {}}


def resolve_debug_path(value):
    """Map the ``debug_log`` argument to a report path (``None`` = disabled)."""
    if value is None or isinstance(value, bool):
        return os.path.join(config.PLUGIN_DIR, DEBUG_FILENAME) if value else None
    text = str(value).strip()
    if not text or text.lower() in ("false", "0", "no", "off"):
        return None
    if text.lower() in ("true", "1", "yes", "on"):
        return os.path.join(config.PLUGIN_DIR, DEBUG_FILENAME)
    return text


def debug_start(path, cfg):
    """Enable the debug report; returns whether it is active."""
    if not path:
        _DEBUG["path"] = None
        return False
    _DEBUG["path"] = path
    _DEBUG["items"] = []
    _DEBUG["settings"] = {
        key: value for key, value in (cfg or {}).items() if key != "hf_token"
    }
    stashlog.log.info(f"TagAI debug: writing tag confidences to {path}")
    return True


def debug_add_item(item):
    """Append one item record to the report and rewrite the JSON file."""
    path = _DEBUG.get("path")
    if not path:
        return
    _DEBUG["items"].append(item)
    report = {
        "plugin": "TagAI",
        "format": 1,
        "generated": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "settings": _DEBUG.get("settings") or {},
        "items": _DEBUG["items"],
    }
    try:
        directory = os.path.dirname(os.path.abspath(path))
        if directory:
            os.makedirs(directory, exist_ok=True)
        with open(path, "w", encoding="utf-8") as handle:
            json.dump(report, handle, indent=1)
        stashlog.log.info(f"TagAI debug: {len(_DEBUG['items'])} item(s) in {path}")
    except Exception as exc:
        stashlog.log.error(f"TagAI debug: could not write {path}: {exc}")
