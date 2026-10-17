"""Generic model inference shared by the image and video pipelines."""

from tagai_core import postprocess, stashlog
from tagai_core.debug import _debug_entry, _debug_pairs, _finish_debug_entry
from tagai_core.postprocess import (
    _as_probabilities, _as_sigmoid_probabilities, _sexpos_from_probs,
    joytag_postprocess, softmax, wd_aggregate, wd_postprocess, yolo_aggregate,
    yolo_postprocess,
)
from tagai_core.preprocess import (
    joytag_preprocess, sexpos_preprocess, wd_preprocess, yolo_det_preprocess,
    yolo_preprocess, yolo_preprocess_batch,
)
from tagai_core.config import (
    DEBUG_FLOOR_DEFAULT, DEBUG_TOP_DEFAULT, INFER_BATCH_SIZE_DEFAULT,
    JOYTAG_THRESHOLD_DEFAULT, SEXPOS_MARGIN_DEFAULT, SEXPOS_THRESHOLD_DEFAULT,
    YOLO_DET_CONF_DEFAULT, YOLO_DET_IOU_DEFAULT, YOLO_MIN_VOTES_DEFAULT,
    YOLO_SHARE_DEFAULT, YOLO_TOP_K_DEFAULT,
)
from tagai_core.config import Image
from tagai_core.config import np
import zipfile


def load_pil_image(path):
    """Open an image path, transparently supporting images inside .zip files."""
    if ".zip" in path.lower():
        zp, inner = path.split(".zip", 1)
        zp += ".zip"
        inner = inner.lstrip("\\/").replace("\\", "/")
        with zipfile.ZipFile(zp, "r") as z:
            fn = inner.split("/")[-1]
            cand = [x for x in z.namelist() if x.endswith(fn)]
            if not cand:
                raise FileNotFoundError(fn)
            return Image.open(z.open(cand[0])).convert("RGB")
    return Image.open(path).convert("RGB")


def run_inference(img, model, cfg):
    """Run one model on one image -> ``(family, raw scores)``.

    The returned scores are family specific: a probability vector for the
    classifier families and the raw detection head for ``yolo-det`` (so the
    debug report can re-decode it at a lower confidence floor).
    """
    family = model["family"]

    if family == "wd":
        arr = wd_preprocess(img, model["size"])
        out = model["session"].run(
            [model["output_name"]], {model["input_name"]: arr}
        )[0][0]
        return family, out

    if family == "joytag":
        arr = joytag_preprocess(img, model["size"])
        out = model["session"].run(
            [model["output_name"]], {model["input_name"]: arr}
        )[0][0]
        return family, _as_sigmoid_probabilities(out)

    if family == "yolo-det":
        arr, _meta = yolo_det_preprocess(img, model["size"])
        out = model["session"].run(
            [model["output_name"]], {model["input_name"]: arr}
        )[0]
        return family, out

    if family == "sexpos":
        arr = sexpos_preprocess(img, model["size"])
        out = model["session"].run(
            [model["output_name"]], {model["input_name"]: arr}
        )[0][0]
        return family, softmax(np.asarray(out, dtype=np.float32).reshape(-1))

    # yolo
    arr = yolo_preprocess(img, model["size"])
    out = model["session"].run(
        [model["output_name"]], {model["input_name"]: arr}
    )[0][0]
    return family, _as_probabilities(out)


def postprocess_scores(family, scores, model, cfg):
    """Turn one model's raw scores into the accepted ``[(name, score)]``."""
    if family == "wd":
        return wd_postprocess(
            scores,
            model,
            tag_threshold=cfg["tag_threshold"],
            char_threshold=cfg["char_threshold"],
            tag_characters=cfg["tag_characters"],
        )

    if family == "joytag":
        return joytag_postprocess(
            scores,
            model,
            threshold=cfg.get("joytag_threshold", JOYTAG_THRESHOLD_DEFAULT),
        )

    if family == "yolo-det":
        return postprocess.yolo_det_postprocess(
            scores,
            model,
            conf_threshold=cfg.get("det_conf", YOLO_DET_CONF_DEFAULT),
            iou_threshold=cfg.get("det_iou", YOLO_DET_IOU_DEFAULT),
        )

    if family == "sexpos":
        return _sexpos_from_probs(
            scores,
            model,
            threshold=cfg.get("sexpos_threshold", SEXPOS_THRESHOLD_DEFAULT),
            margin=cfg.get("sexpos_margin", SEXPOS_MARGIN_DEFAULT),
        )

    return yolo_postprocess(
        scores,
        model,
        thresholds=model.get("thresholds"),
        margin=cfg["yolo_margin"],
        default_threshold=cfg["yolo_threshold"],
        top_k=cfg.get("yolo_top_k", YOLO_TOP_K_DEFAULT),
    )


def classify_image(img, model, cfg):
    """Run the selected model on one PIL image -> ``[(name, score)]``."""
    family, scores = run_inference(img, model, cfg)
    return postprocess_scores(family, scores, model, cfg)


def candidate_scores(family, scores, model, cfg, floor=None, top=None):
    """Every score above ``floor``, best first (used by the debug report).

    Unlike :func:`postprocess_scores` this ignores the acceptance thresholds,
    so the report shows how close the rejected tags were to being tagged.
    """
    if floor is None:
        floor = cfg.get("debug_floor", DEBUG_FLOOR_DEFAULT)
    if top is None:
        top = cfg.get("debug_top", DEBUG_TOP_DEFAULT)

    if family == "yolo-det":
        detections = postprocess.yolo_det_postprocess(
            scores,
            model,
            conf_threshold=floor,
            iou_threshold=cfg.get("det_iou", YOLO_DET_IOU_DEFAULT),
        )
        return [(name, float(score)) for name, score in detections[:top]]

    arr = np.asarray(scores, dtype=np.float32).reshape(-1)
    if arr.size == 0:
        return []

    names = model.get("tags") or model.get("class_names") or []
    if len(names) != arr.size:
        names = [f"class_{i}" for i in range(arr.size)]

    hits = []
    for idx in np.argsort(arr)[::-1]:
        idx = int(idx)
        score = float(arr[idx])
        if score < floor:
            break
        hits.append((names[idx], score))
        if len(hits) >= max(1, int(top)):
            break
    return hits


def merge_tag_results(results):
    """Merge several ``[(name, score)]`` lists, keeping the best score."""
    best = {}
    for res in results:
        for name, score in res:
            if name not in best or score > best[name]:
                best[name] = float(score)
    return sorted(best.items(), key=lambda kv: kv[1], reverse=True)


def classify_with_models(img, models, cfg, debug=None):
    """Run every model on one image and merge the tags they produce.

    ``models`` may be a single model entry (dict) or a list of them. With one
    model the result is returned unchanged, so the tag order of the existing
    single-model pipelines is preserved exactly.

    When ``debug`` is a list, one record per model (with the per-tag
    confidences, including the rejected ones) is appended to it.
    """
    if isinstance(models, dict):
        models = [models]
    results = []
    for model in models:
        try:
            if debug is None:
                results.append(classify_image(img, model, cfg))
                continue
            family, scores = run_inference(img, model, cfg)
            tags = postprocess_scores(family, scores, model, cfg)
            results.append(tags)
            try:
                entry = _debug_entry(model, cfg)
                entry["per_frame"].append(
                    _debug_pairs(candidate_scores(family, scores, model, cfg))
                )
                _finish_debug_entry(entry, tags)
                debug.append(entry)
            except Exception as exc:
                stashlog.log.error(
                    f"Debug candidates for {model.get('name')} failed: {exc}"
                )
        except Exception as exc:
            stashlog.log.error(f"Model {model.get('name')} failed: {exc}")
    if not results:
        return []
    if len(results) == 1:
        return results[0]
    return merge_tag_results(results)


def run_model(path, models, cfg, debug=None):
    """Classify a single image path (supports .zip members)."""
    return classify_with_models(load_pil_image(path), models, cfg, debug=debug)


def run_model_batch(paths, models, cfg, debug_out=None):
    """Classify a list of image paths, returning one result list per path.

    When ``debug_out`` is a list, one debug record per path is appended to it.
    """
    results = []
    for path in paths:
        debug = [] if debug_out is not None else None
        try:
            results.append(run_model(path, models, cfg, debug=debug))
        except Exception as exc:
            stashlog.log.error(f"Failed to process image {path}: {exc}")
            results.append([])
        if debug_out is not None:
            debug_out.append(debug)
    return results


def _record_hits(hits_out, model, per_frame):
    """Store one model's accepted per-frame tags for the marker builder."""
    if hits_out is not None:
        hits_out[model.get("name")] = per_frame


def _infer_frames_one_model(images, model, cfg, debug=None, hits_out=None):
    """Aggregate one model's per-frame results into a scene-level tag list.

    When ``debug`` is a dict the per-frame candidate confidences are stored
    under ``debug[model name]`` for the calibration report. When ``hits_out``
    is a dict the accepted per-frame tags are stored under the model name, one
    row per frame -- a failed frame yields an empty row, so the rows always
    stay aligned with ``images`` (the video pipeline uses them to place scene
    markers).
    """
    entry = None
    if debug is not None:
        entry = _debug_entry(model, cfg)
        debug[model.get("name")] = entry

    if model["family"] == "yolo":
        try:
            batch_size = max(
                1, int(cfg.get("infer_batch_size", INFER_BATCH_SIZE_DEFAULT))
            )
        except (TypeError, ValueError):
            batch_size = INFER_BATCH_SIZE_DEFAULT

        per_frame = []
        for start in range(0, len(images), batch_size):
            chunk = images[start:start + batch_size]
            expected = len(per_frame) + len(chunk)
            try:
                batch = yolo_preprocess_batch(chunk, model["size"])
                outputs = model["session"].run(
                    [model["output_name"]], {model["input_name"]: batch}
                )[0]
            except Exception as exc:
                stashlog.log.error(f"Failed to classify {len(chunk)} frame(s): {exc}")
            else:
                for row in outputs:
                    probs = _as_probabilities(np.asarray(row).reshape(-1))
                    per_frame.append(
                        yolo_postprocess(
                            probs,
                            model,
                            thresholds=model.get("thresholds"),
                            margin=cfg["yolo_margin"],
                            default_threshold=cfg["yolo_threshold"],
                            top_k=cfg.get("yolo_top_k", YOLO_TOP_K_DEFAULT),
                        )
                    )
                    if entry is not None:
                        entry["per_frame"].append(
                            _debug_pairs(candidate_scores("yolo", probs, model, cfg))
                        )
            # A failed batch must not shift the frame indices.
            while len(per_frame) < expected:
                per_frame.append([])
                if entry is not None:
                    entry["per_frame"].append([])

        tags = yolo_aggregate(
            per_frame,
            frame_count=len(images),
            multi=cfg.get("yolo_multi", True),
            min_votes=cfg.get("yolo_min_votes", YOLO_MIN_VOTES_DEFAULT),
            share=cfg.get("yolo_share", YOLO_SHARE_DEFAULT),
        )
        _finish_debug_entry(entry, tags)
        _record_hits(hits_out, model, per_frame)
        return tags

    per_frame = []
    for img in images:
        try:
            if entry is None:
                per_frame.append(classify_image(img, model, cfg))
                continue
            family, scores = run_inference(img, model, cfg)
            tags = postprocess_scores(family, scores, model, cfg)
            per_frame.append(tags)
            entry["per_frame"].append(
                _debug_pairs(candidate_scores(family, scores, model, cfg))
            )
        except Exception as exc:
            stashlog.log.error(f"Failed to classify frame: {exc}")
            per_frame.append([])
            if entry is not None:
                entry["per_frame"].append([])

    if model["family"] in ("yolo-det", "sexpos"):
        # These models name classes per accepted frame, so the votes are
        # pooled exactly like the single-label classifier's accepted frames.
        tags = yolo_aggregate(
            per_frame,
            frame_count=len(images),
            multi=cfg.get("yolo_multi", True),
            min_votes=cfg.get("yolo_min_votes", YOLO_MIN_VOTES_DEFAULT),
            share=cfg.get("yolo_share", YOLO_SHARE_DEFAULT),
        )
    else:
        tags = wd_aggregate(per_frame)
    _finish_debug_entry(entry, tags)
    _record_hits(hits_out, model, per_frame)
    return tags


def infer_frames(frame_paths, models, cfg, debug=None, hits_out=None):
    """Classify every frame with every model and merge the tags.

    Frames are read once. YOLO classification models are pushed through the
    session in batches (their batch dimension is dynamic), which keeps the GPU
    busy instead of paying per-frame call overhead; the other families (WD and
    JoyTag have a fixed batch of 1, the detector and sexpos models run one
    frame at a time) are handled per image. With several models the per-model
    scene tags are merged, keeping the best score for each tag.

    When ``debug`` is a dict the per-frame candidate confidences of every model
    are collected in it (used by the calibration report); when ``hits_out`` is
    a dict the accepted per-frame tags of every model are collected in it
    (used to place scene markers).
    """
    if isinstance(models, dict):
        models = [models]

    images = []
    for path in frame_paths:
        try:
            images.append(Image.open(path).convert("RGB"))
        except Exception as exc:
            stashlog.log.error(f"Failed to load frame {path}: {exc}")

    results = []
    for model in models:
        try:
            results.append(
                _infer_frames_one_model(
                    images, model, cfg, debug=debug, hits_out=hits_out
                )
            )
        except Exception as exc:
            stashlog.log.error(f"Model {model.get('name')} failed on frames: {exc}")

    if not results:
        return []
    if len(results) == 1:
        return results[0]
    return merge_tag_results(results)


def run_model_frames(frame_paths, models, cfg, debug=None, hits_out=None):
    """Alias kept for readability in the video pipeline."""
    return infer_frames(frame_paths, models, cfg, debug=debug, hits_out=hits_out)
