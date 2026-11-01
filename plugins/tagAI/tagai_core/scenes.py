"""Scene GraphQL queries, frame extraction and per-scene processing."""

from tagai_core import stash_client, stashlog
from tagai_core.debug import debug_add_item
from tagai_core.frames import compute_frame_times, extract_frames
from tagai_core.inference import infer_frames
from tagai_core.markers import combine_hits, create_scene_markers
from tagai_core.tags import filter_tags
from tagai_core.config import (
    FRAME_COUNT_DEFAULT, FRAME_INTERVAL_DEFAULT, FRAME_WORKERS_DEFAULT,
    MAX_FRAMES_DEFAULT, PER_PAGE_VIDEO_DEFAULT,
)
import shutil
import tempfile
import traceback


def get_scenes(ai_tagged_id, page=1, per_page=PER_PAGE_VIDEO_DEFAULT):
    q = """
query MyQuery($excludes: [ID!], $page: Int, $per_page: Int) {
  findScenes(
    scene_filter: { tags: { modifier: INCLUDES_ALL, excludes: $excludes } }
    filter: { page: $page, per_page: $per_page }
  ) {
    scenes { id files { path ... on VideoFile { duration width height } } }
    count
  }
}"""
    res = stash_client.gql(q, {"excludes": [ai_tagged_id], "page": page, "per_page": per_page})
    if "errors" in res:
        return [], 0
    data = res.get("data", {}).get("findScenes") or {}
    return data.get("scenes") or [], data.get("count") or 0


def get_scenes_force(page=1, per_page=PER_PAGE_VIDEO_DEFAULT):
    q = """
query MyQuery($page: Int, $per_page: Int) {
  findScenes(filter: { page: $page, per_page: $per_page }) {
    scenes { id files { path ... on VideoFile { duration width height } } }
    count
  }
}"""
    res = stash_client.gql(q, {"page": page, "per_page": per_page})
    if "errors" in res:
        return [], 0
    data = res.get("data", {}).get("findScenes") or {}
    return data.get("scenes") or [], data.get("count") or 0


def get_scenes_w_tag(flag_tag_id, page=1, per_page=PER_PAGE_VIDEO_DEFAULT):
    q = """
query MyQuery($value: [ID!], $page: Int, $per_page: Int) {
  findScenes(
    scene_filter: { tags: { modifier: INCLUDES_ALL, value: $value } }
    filter: { page: $page, per_page: $per_page }
  ) {
    scenes { id files { path ... on VideoFile { duration width height } } }
    count
  }
}"""
    res = stash_client.gql(q, {"value": [flag_tag_id], "page": page, "per_page": per_page})
    if "errors" in res:
        return [], 0
    data = res.get("data", {}).get("findScenes") or {}
    return data.get("scenes") or [], data.get("count") or 0


def get_scene_tags(scene_id):
    q = """query($id:ID!){ findScene(id:$id){ tags{id} } }"""
    r = stash_client.gql(q, {"id": scene_id})
    return r.get("data", {}).get("findScene", {}).get("tags", []) or []


def apply_scene_tags(scene_id, new_tag_ids, exclude_tag_id=None, ai_tagged_id=None):
    """Mirror of :func:`apply_tags` using ``sceneUpdate``."""
    new_tag_ids = [t for t in new_tag_ids if t]
    if ai_tagged_id:
        new_tag_ids.append(ai_tagged_id)
    if not new_tag_ids:
        stashlog.log.info("No tags to apply.")
        return

    existing = [
        t["id"]
        for t in get_scene_tags(scene_id)
        if t["id"] != exclude_tag_id
    ]
    final = list(set(existing + new_tag_ids))

    q = """mutation($id:ID!, $tags:[ID!]!){
      sceneUpdate(input:{id:$id, tag_ids:$tags}){id}
    }"""
    stash_client.gql(q, {"id": scene_id, "tags": final})


def process_scene(scene, models, cfg, flag_tag_id, ai_tagged_id, prefix):
    """Extract frames, classify, tag and (optionally) mark a single scene."""
    files = scene.get("files") or []
    video = files[0] if files else None
    path = video.get("path") if video else None
    duration = video.get("duration") if video else None

    if not path or not duration or duration <= 0:
        stashlog.log.info(f"Scene {scene.get('id')}: no video file/duration, skipping")
        return []

    tmp = tempfile.mkdtemp(prefix="tagai_")
    try:
        times = compute_frame_times(
            duration,
            frame_count=cfg.get("frame_count", FRAME_COUNT_DEFAULT),
            frame_interval=cfg.get("frame_interval", FRAME_INTERVAL_DEFAULT),
            max_frames=cfg.get("max_frames", MAX_FRAMES_DEFAULT),
        )
        extracted = extract_frames(
            path, times, tmp, cfg["ffmpeg_path"],
            workers=cfg.get("frame_workers", FRAME_WORKERS_DEFAULT),
            include_times=True,
        )
        if not extracted:
            stashlog.log.info(f"Scene {scene.get('id')}: no frames extracted, skipping")
            return []
        frames = [frame for frame, _moment in extracted]
        frame_times = [moment for _frame, moment in extracted]
        stashlog.log.info(f"Scene {scene.get('id')}: classifying {len(frames)} frames")
        debug_models = {} if cfg.get("debug") else None
        markers_mode = cfg.get("markers") or "off"
        hits_out = {} if markers_mode != "off" else None
        tags = infer_frames(
            frames, models, cfg, debug=debug_models, hits_out=hits_out
        )
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    tags = filter_tags(tags, cfg.get("tag_whitelist"), cfg.get("tag_blacklist"))
    ids = [tid for tid in (stash_client.ensure_tag(prefix + name) for name, _score in tags) if tid]
    apply_scene_tags(scene["id"], ids, flag_tag_id, ai_tagged_id)

    created_markers = []
    if markers_mode != "off" and hits_out is not None:
        try:
            created_markers = create_scene_markers(
                scene, tags, combine_hits(hits_out, len(frames)),
                frame_times, duration, cfg, prefix,
            )
        except Exception as exc:
            stashlog.log.error(
                f"Scene {scene.get('id')}: could not create markers: {exc}\n"
                f"{traceback.format_exc()}"
            )

    if debug_models is not None:
        debug_add_item({
            "id": scene.get("id"),
            "path": path,
            "duration": round(float(duration), 3),
            "frames": len(frames),
            "models": list(debug_models.values()),
            "applied_tags": [prefix + name for name, _score in tags],
            "markers": created_markers,
        })
    return tags


# ========================================================================== #
# 6. JOB LOOP / PAGINATION
# ========================================================================== #
