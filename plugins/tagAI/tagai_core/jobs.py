"""Pagination loop and image/scene job runners."""

from tagai_core import stash_client, stashlog
from tagai_core.debug import debug_add_item
from tagai_core.images import apply_tags
from tagai_core.inference import run_model_batch
from tagai_core.scenes import process_scene
from tagai_core.tags import filter_tags
import traceback


def iterate_job(fetch_page, process_batch, mode, per_page, on_progress=None):
    """Pagination loop shared by images and scenes.

    ``fetch_page(page) -> (items, count)`` and ``process_batch(items)``.

    * ``TagAll`` / ``Tagged``: the result set *shrinks* as items get tagged, so
      always fetch page 1; stop when the page is empty or no returned item is
      new (this is the fix for the historic infinite re-tag loop).
    * ``ForceTag``: the result set is stable, so advance pages until a page is
      empty (with a safety bound based on ``count``).

    Returns the set of processed ids.
    """
    processed = set()
    page = 1
    total = 0

    while True:
        items, count = fetch_page(page)
        if not items:
            break

        fresh = [it for it in items if it.get("id") not in processed]

        if mode in ("TagAll", "Tagged"):
            if not fresh:
                break
        if fresh:
            process_batch(fresh)
            processed.update(it["id"] for it in fresh)
            total += len(fresh)
            if on_progress and count:
                on_progress(min(1.0, total / float(count)))

        if mode == "ForceTag":
            page += 1
            if count and page * per_page > count + per_page:
                break
        else:
            page = 1

    return processed


def run_image_job(fetch_page, mode, per_page, models, cfg,
                  flag_tag_id, ai_tagged_id, prefix):
    def process_batch(items):
        valid = [it for it in items if it.get("files")]
        paths = [it["files"][0]["path"] for it in valid]
        debug_out = [] if cfg.get("debug") else None
        tag_batches = run_model_batch(paths, models, cfg, debug_out=debug_out)
        for index, (it, tags) in enumerate(zip(valid, tag_batches)):
            try:
                tags = filter_tags(
                    tags, cfg.get("tag_whitelist"), cfg.get("tag_blacklist")
                )
                ids = [tid for tid in (stash_client.ensure_tag(prefix + name)
                                       for name, _score in tags) if tid]
                apply_tags(it["id"], ids, flag_tag_id, ai_tagged_id)
                if debug_out is not None:
                    debug_add_item({
                        "id": it.get("id"),
                        "path": paths[index],
                        "duration": None,
                        "frames": 1,
                        "models": debug_out[index],
                        "applied_tags": [prefix + name for name, _score in tags],
                    })
            except Exception as exc:
                stashlog.log.error(f"Image {it.get('id')} failed: {exc}\n{traceback.format_exc()}")

    return iterate_job(fetch_page, process_batch, mode, per_page,
                       on_progress=lambda p: stashlog.log.progress(p))


def run_scene_job(fetch_page, mode, per_page, models, cfg,
                  flag_tag_id, ai_tagged_id, prefix):
    def process_batch(items):
        for it in items:
            try:
                process_scene(it, models, cfg, flag_tag_id, ai_tagged_id, prefix)
            except Exception as exc:
                stashlog.log.error(f"Scene {it.get('id')} failed: {exc}\n{traceback.format_exc()}")

    return iterate_job(fetch_page, process_batch, mode, per_page,
                       on_progress=lambda p: stashlog.log.progress(p))


# ========================================================================== #
# 7. ARG PARSING & DISPATCHER
# ========================================================================== #
