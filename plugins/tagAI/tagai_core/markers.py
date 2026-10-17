"""Scene marker planning and creation."""

from tagai_core import stash_client, stashlog
from tagai_core.tags import filter_marker_tags
from tagai_core.config import MARKER_MAX_DEFAULT, MARKER_MIN_LENGTH


def get_scene_markers(scene_id):
    """Existing markers of a scene as ``[{primary_tag_id, seconds}]``."""
    q = """query($id:ID!){
      findScene(id:$id){ scene_markers{ seconds primary_tag{ id } } }
    }"""
    result = stash_client.gql(q, {"id": scene_id})
    markers = (
        ((result.get("data") or {}).get("findScene") or {}).get("scene_markers")
        or []
    )
    existing = []
    for marker in markers:
        primary = marker.get("primary_tag") or {}
        existing.append({
            "primary_tag_id": primary.get("id"),
            "seconds": float(marker.get("seconds") or 0.0),
        })
    return existing


def create_scene_marker(scene_id, primary_tag_id, start, end, title,
                        tag_ids=None):
    """Create one scene marker; returns whether Stash accepted it."""
    q = """mutation($input:SceneMarkerCreateInput!){
      sceneMarkerCreate(input:$input){ id }
    }"""
    payload = {
        "scene_id": scene_id,
        "primary_tag_id": primary_tag_id,
        "seconds": round(float(start), 3),
        "end_seconds": round(float(end), 3),
        "title": title,
    }
    if tag_ids:
        payload["tag_ids"] = list(tag_ids)
    result = stash_client.gql(q, {"input": payload})
    created = ((result.get("data") or {}).get("sceneMarkerCreate") or {})
    return bool(created.get("id"))


def parse_marker_mode(value):
    """Normalise the ``markers`` argument -> ``off``, ``ranges`` or ``best``."""
    text = str(value or "").strip().lower()
    if text in ("", "off", "false", "0", "no", "none", "disabled"):
        return "off"
    if text in ("ranges", "range", "runs"):
        return "ranges"
    if text in ("best", "top", "peak"):
        return "best"
    stashlog.log.error(f"Unknown markers mode {value!r}; expected off, ranges or best")
    return "off"


def _frame_spacing(times):
    """Median gap between consecutive sampled frames (0.0 when unknown)."""
    if not times or len(times) < 2:
        return 0.0
    gaps = sorted(float(b) - float(a) for a, b in zip(times, times[1:]))
    return gaps[len(gaps) // 2]


def combine_hits(hits_out, frame_count):
    """Merge per-model per-frame hits -> one ``{tag: score}`` map per frame."""
    combined = [{} for _ in range(max(0, int(frame_count)))]
    for per_frame in (hits_out or {}).values():
        for index, row in enumerate(per_frame or []):
            if index >= len(combined):
                break
            for name, score in row or []:
                best = combined[index].get(name)
                if best is None or score > best:
                    combined[index][name] = float(score)
    return combined


def _merge_run_rows(run, hits):
    """Best score per tag over all frames of one run."""
    merged = {}
    for index, _moment, _score in run:
        for tag, score in (hits[index] or {}).items():
            if tag not in merged or score > merged[tag]:
                merged[tag] = float(score)
    return merged


def _marker_span(name, start, end, score, wanted, row, pad, duration):
    """One marker record, padded and clamped to the video's duration."""
    start = max(0.0, float(start) - pad)
    end = float(end) + pad
    end = max(end, start + MARKER_MIN_LENGTH)
    if duration:
        end = min(float(duration), end)
        start = min(start, max(0.0, end - MARKER_MIN_LENGTH))
    return {
        "tag": name,
        "start": round(start, 3),
        "end": round(end, 3),
        "score": round(float(score), 4),
        "tags": [tag for tag in wanted if tag != name and tag in row],
    }


def build_markers(tags, hits, frame_times, duration, mode="ranges", pad=0.0,
                  gap=0.0):
    """Turn the per-frame hits of a scene into marker spans.

    ``hits`` holds one ``{tag: score}`` mapping per sampled frame and
    ``frame_times`` the matching timestamps (both in sampling order, so index
    *i* of one belongs to index *i* of the other). Only the scene-level
    ``tags`` are considered, so the markers always agree with the applied tags.

    With ``mode="ranges"`` consecutive hits of a tag become a single marker
    spanning from its first to its last hit; with ``mode="best"`` only the most
    confident frame of each tag is used. Every span is padded by ``pad``
    seconds on both sides -- so a marker lasts at least ``2 * pad`` seconds --
    and clamped to ``[0, duration]``. The other tags that fired during the same
    span are returned as co-tags.

    Two hits of one tag are also merged when they are no further apart than
    ``2 * pad + gap`` seconds, so a tag that fires in bursts produces one
    marker per burst instead of one per sample. ``gap`` defaults to ``0``,
    which only merges hits whose padded spans would already touch.
    """
    wanted = [name for name, _score in tags]
    if not wanted or not hits or not frame_times:
        return []

    try:
        pad = max(0.0, float(pad))
    except (TypeError, ValueError):
        pad = 0.0

    try:
        gap = max(0.0, float(gap))
    except (TypeError, ValueError):
        gap = 0.0

    points = {}
    for index in range(min(len(hits), len(frame_times))):
        row = hits[index] or {}
        for name in wanted:
            if name in row:
                points.setdefault(name, []).append(
                    (index, float(frame_times[index]), float(row[name]))
                )

    markers = []
    for name in wanted:
        found = points.get(name) or []
        if not found:
            continue

        if mode == "best":
            index, moment, score = max(found, key=lambda item: (item[2], -item[0]))
            markers.append(
                _marker_span(name, moment, moment, score, wanted,
                             hits[index], pad, duration)
            )
            continue

        run = [found[0]]
        spans = []
        for point in found[1:]:
            # Adjacent samples belong to the same moment; so do hits whose
            # padded spans would overlap (or come within the merge gap).
            if (point[0] - run[-1][0] == 1
                    or point[1] - run[-1][1] <= 2 * pad + gap + 1e-6):
                run.append(point)
            else:
                spans.append(run)
                run = [point]
        spans.append(run)

        for span in spans:
            markers.append(
                _marker_span(name, span[0][1], span[-1][1],
                             max(point[2] for point in span), wanted,
                             _merge_run_rows(span, hits), pad, duration)
            )

    markers.sort(key=lambda marker: (marker["start"], marker["tag"]))
    return markers


def create_scene_markers(scene, tags, hits, frame_times, duration, cfg, prefix):
    """Create the scene markers for one scene; returns the created spans.

    The marker whitelist/blacklist is applied first, so a filtered tag never
    becomes a marker (or the co-tag of one). Re-runs do not stack markers: a
    span is skipped when the scene already has a marker with the same primary
    tag close to (within one padding) the same moment. At most ``marker_max``
    markers are created per scene.
    """
    mode = cfg.get("markers") or "off"
    if mode == "off":
        return []

    tags = filter_marker_tags(
        tags, cfg.get("marker_whitelist"), cfg.get("marker_blacklist")
    )

    pad = cfg.get("marker_pad")
    if pad is None:
        pad = _frame_spacing(frame_times)
    try:
        gap = max(0.0, float(cfg.get("marker_gap") or 0.0))
    except (TypeError, ValueError):
        gap = 0.0

    spans = build_markers(tags, hits, frame_times, duration, mode=mode, pad=pad,
                          gap=gap)
    if not spans:
        return []

    try:
        limit = max(0, int(cfg.get("marker_max", MARKER_MAX_DEFAULT)))
    except (TypeError, ValueError):
        limit = MARKER_MAX_DEFAULT
    if limit == 0:
        return []

    scene_id = scene.get("id")
    existing = get_scene_markers(scene_id)
    tolerance = max(MARKER_MIN_LENGTH, 2.0 * float(pad))

    created = []
    for span in spans:
        if len(created) >= limit:
            stashlog.log.info(
                f"Scene {scene_id}: marker limit ({limit}) reached, "
                "not creating further markers"
            )
            break

        tag_id = stash_client.ensure_tag(prefix + span["tag"])
        if not tag_id:
            continue
        if any(
            marker.get("primary_tag_id") == tag_id
            and abs(marker.get("seconds", 0.0) - span["start"]) <= tolerance
            for marker in existing
        ):
            continue

        co_tag_ids = [
            tid for tid in (stash_client.ensure_tag(prefix + name) for name in span["tags"])
            if tid and tid != tag_id
        ]
        if create_scene_marker(scene_id, tag_id, span["start"], span["end"],
                               span["tag"], co_tag_ids):
            existing.append({"primary_tag_id": tag_id, "seconds": span["start"]})
            created.append(span)

    if created:
        stashlog.log.info(f"Scene {scene_id}: created {len(created)} marker(s)")
    return created
