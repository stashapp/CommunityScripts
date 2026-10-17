"""Per-family score post-processing and frame aggregation."""

from tagai_core.config import (
    CHAR_THRESHOLD, JOYTAG_THRESHOLD_DEFAULT, SEXPOS_CLASS_NAMES, SEXPOS_MARGIN_DEFAULT,
    SEXPOS_THRESHOLD_DEFAULT, TAG_THRESHOLD, YOLO_DET_CLASS_NAMES,
    YOLO_DET_CONF_DEFAULT, YOLO_DET_IOU_DEFAULT, YOLO_MARGIN_DEFAULT,
    YOLO_MIN_VOTES_DEFAULT, YOLO_SHARE_DEFAULT, YOLO_THRESHOLD_DEFAULT,
    YOLO_TOP_K_DEFAULT,
)
from tagai_core.config import np
import math


def softmax(x):
    x = np.asarray(x, dtype=np.float32)
    x = x - np.max(x)
    e = np.exp(x)
    s = float(np.sum(e))
    if s == 0.0:
        return e
    return e / s


def _as_probabilities(out):
    """Return a probability vector.

    Some classification ONNX exports emit raw logits and must be softmaxed by
    the caller, while others (e.g. yolo26n-cls-porn, which contains a Softmax
    node) already emit probabilities. If the output already looks softmaxed
    (all in [0, 1] and summing to ~1) it is returned unchanged.
    """
    arr = np.asarray(out, dtype=np.float32).reshape(-1)
    if arr.size:
        if (
            float(arr.min()) >= 0.0
            and float(arr.max()) <= 1.0
            and abs(float(arr.sum()) - 1.0) < 1e-3
        ):
            return arr
    return softmax(arr)


def _as_sigmoid_probabilities(out):
    """Return per-tag probabilities for a sigmoid (multi-label) head.

    JoyTag emits raw logits that must be passed through a sigmoid, but some
    exports already include the activation. If every value is already inside
    [0, 1] the output is returned unchanged.
    """
    arr = np.asarray(out, dtype=np.float32).reshape(-1)
    if arr.size and float(arr.min()) >= 0.0 and float(arr.max()) <= 1.0:
        return arr
    return 1.0 / (1.0 + np.exp(-arr))


def _nms(boxes, scores, iou_threshold):
    """Greedy non-maximum suppression -> indices of the kept boxes."""
    boxes = np.asarray(boxes, dtype=np.float32)
    scores = np.asarray(scores, dtype=np.float32)
    if boxes.size == 0:
        return []

    x1, y1, x2, y2 = boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3]
    areas = np.maximum(0.0, x2 - x1) * np.maximum(0.0, y2 - y1)
    order = scores.argsort()[::-1]

    keep = []
    while order.size:
        i = int(order[0])
        keep.append(i)
        if order.size == 1:
            break
        rest = order[1:]
        xx1 = np.maximum(x1[i], x1[rest])
        yy1 = np.maximum(y1[i], y1[rest])
        xx2 = np.minimum(x2[i], x2[rest])
        yy2 = np.minimum(y2[i], y2[rest])
        inter = np.maximum(0.0, xx2 - xx1) * np.maximum(0.0, yy2 - yy1)
        union = areas[i] + areas[rest] - inter
        iou = np.divide(inter, union, out=np.zeros_like(inter), where=union > 0)
        order = rest[iou <= iou_threshold]

    return keep


def yolo_det_postprocess(output, model,
                         conf_threshold=YOLO_DET_CONF_DEFAULT,
                         iou_threshold=YOLO_DET_IOU_DEFAULT):
    """Decode a YOLO11 detection head -> ``[(class_name, confidence)]``.

    The exported graph ends at the raw head, so boxes are decoded here: the
    output is ``[4 + num_classes, anchors]`` (or the transposed layout), each
    anchor carrying a centre-based ``xywh`` box followed by one score per
    class. Only class names and confidences are returned -- box positions are
    not needed for tagging -- and overlapping boxes are removed with NMS.
    """
    preds = np.asarray(output, dtype=np.float32)
    while preds.ndim > 2:
        preds = preds[0]
    if preds.ndim != 2:
        return []

    names = model.get("class_names") or list(YOLO_DET_CLASS_NAMES)
    num_classes = len(names)

    # Rows must be anchors: accept either [anchors, 4 + nc] or [4 + nc, anchors].
    if preds.shape[1] != 4 + num_classes and preds.shape[0] == 4 + num_classes:
        preds = preds.T
    if preds.shape[1] < 5:
        return []
    num_classes = min(num_classes, preds.shape[1] - 4)
    if num_classes <= 0:
        return []

    boxes_xywh = preds[:, :4]
    scores = preds[:, 4:4 + num_classes]
    class_ids = scores.argmax(axis=1)
    confs = scores[np.arange(scores.shape[0]), class_ids]

    mask = confs >= conf_threshold
    if not np.any(mask):
        return []
    boxes_xywh = boxes_xywh[mask]
    confs = confs[mask]
    class_ids = class_ids[mask]

    cx, cy, bw, bh = (boxes_xywh[:, i] for i in range(4))
    boxes_xyxy = np.stack(
        [cx - bw / 2.0, cy - bh / 2.0, cx + bw / 2.0, cy + bh / 2.0], axis=1
    )

    keep = _nms(boxes_xyxy, confs, iou_threshold)

    results = []
    for i in keep:
        cid = int(class_ids[i])
        name = names[cid] if cid < len(names) else f"class_{cid}"
        results.append((name, float(confs[i])))
    return results


def _sexpos_from_probs(probs, model, threshold=SEXPOS_THRESHOLD_DEFAULT,
                       margin=SEXPOS_MARGIN_DEFAULT):
    """Accept at most the top class of one frame -> ``[(name, score)]``.

    A frame is only tagged when the top class reaches ``threshold`` and, when
    ``margin`` is non-zero, beats the runner-up by at least that much.
    """
    probs = np.asarray(probs, dtype=np.float32).reshape(-1)
    if probs.size == 0:
        return []

    names = model.get("class_names") or list(SEXPOS_CLASS_NAMES)
    if len(names) != probs.size:
        names = [f"class_{i}" for i in range(probs.size)]

    order = np.argsort(probs)[::-1]
    top1 = float(probs[order[0]])
    top2 = float(probs[order[1]]) if order.size > 1 else 0.0
    if top1 < threshold:
        return []
    if margin and (top1 - top2) < margin:
        return []
    return [(names[int(order[0])], top1)]


def sexpos_postprocess(logits, model, threshold=SEXPOS_THRESHOLD_DEFAULT,
                       margin=SEXPOS_MARGIN_DEFAULT):
    """Accept at most the top class of one frame -> ``[(name, score)]``.

    The exported graph ends at the raw logits, so a softmax is applied here.
    A frame is only tagged when the top class reaches ``threshold`` and, when
    ``margin`` is non-zero, beats the runner-up by at least that much.
    """
    return _sexpos_from_probs(
        softmax(np.asarray(logits, dtype=np.float32).reshape(-1)),
        model,
        threshold=threshold,
        margin=margin,
    )


def wd_postprocess(probs, model, tag_threshold=TAG_THRESHOLD,
                   char_threshold=CHAR_THRESHOLD, tag_characters=False):
    """Return ``[(name, score)]`` for the WD model given a probability vector."""
    tags = model["tags"]
    general_idx = model["general_idx"]
    char_idx = model["char_idx"]
    if char_idx is None:
        char_idx = len(tags)

    probs = np.asarray(probs).reshape(-1)

    general = [
        (tags[i], float(probs[i]))
        for i in range(general_idx, min(char_idx, len(tags)))
        if probs[i] > tag_threshold
    ]
    chars = []
    if tag_characters:
        chars = [
            (tags[i], float(probs[i]))
            for i in range(char_idx, len(tags))
            if probs[i] > char_threshold
        ]

    return general + chars


def joytag_postprocess(probs, model, threshold=JOYTAG_THRESHOLD_DEFAULT):
    """Return ``[(name, score)]`` for JoyTag: every tag above ``threshold``."""
    tags = model.get("tags") or []
    probs = np.asarray(probs, dtype=np.float32).reshape(-1)
    if len(tags) != len(probs):
        tags = [f"tag_{i}" for i in range(len(probs))]

    hits = [
        (tags[i], float(probs[i]))
        for i in range(len(probs))
        if probs[i] > threshold
    ]
    hits.sort(key=lambda kv: kv[1], reverse=True)
    return hits


def yolo_postprocess(probs, model, thresholds=None,
                     margin=YOLO_MARGIN_DEFAULT,
                     default_threshold=YOLO_THRESHOLD_DEFAULT,
                     top_k=YOLO_TOP_K_DEFAULT):
    """Accept up to ``top_k`` classes for one frame -> ``[(name, score)]``.

    The frame is only trusted when the top class passes the author's rule:

    ``conf_ok   = top1 >= threshold`` (per-class if available)
    ``margin_ok = top1 - top2 >= margin``

    With ``top_k > 1`` the runner-up classes are additionally returned for a
    trusted frame when they clear their own confidence threshold. This raises
    recall on frames that show more than one act, at the cost of potential
    false positives; the default ``top_k = 1`` keeps the original behaviour.
    """
    probs = np.asarray(probs, dtype=np.float32).reshape(-1)
    names = model.get("class_names") or []
    if len(names) != len(probs):
        names = [f"class_{i}" for i in range(len(probs))]

    if probs.size == 0:
        return []

    def threshold_for(class_name):
        if thresholds:
            return thresholds.get(
                class_name, thresholds.get("default", default_threshold)
            )
        return default_threshold

    order = np.argsort(probs)[::-1]
    top1 = int(order[0])
    top1_conf = float(probs[top1])
    top2_conf = float(probs[order[1]]) if order.size > 1 else 0.0

    if top1_conf < threshold_for(names[top1]):
        return []
    if (top1_conf - top2_conf) < margin:
        return []

    try:
        limit = max(1, int(top_k))
    except (TypeError, ValueError):
        limit = 1

    accepted = [(names[top1], top1_conf)]
    for idx in order[1:limit]:
        idx = int(idx)
        conf = float(probs[idx])
        if conf >= threshold_for(names[idx]):
            accepted.append((names[idx], conf))
    return accepted


# ------------------------------- aggregation ------------------------------ #

def wd_aggregate(frame_results):
    """Per-label max probability across frames (thresholds already applied)."""
    best = {}
    for res in frame_results:
        for name, score in res:
            if name not in best or score > best[name]:
                best[name] = float(score)
    return sorted(best.items(), key=lambda kv: kv[1], reverse=True)


def yolo_aggregate(frame_results, frame_count=None, multi=True,
                   min_votes=YOLO_MIN_VOTES_DEFAULT,
                   share=YOLO_SHARE_DEFAULT):
    """Aggregate single-label frame results into scene-level tag list.

    The classifier accepts at most one class per frame, but a video can contain
    several acts over time, so the accepted frames are pooled:

    * ``multi=True`` (default): every class accepted on at least
      ``max(min_votes, ceil(share * accepted_frames))`` frames is returned, so a
      video with several distinct acts yields several tags.
    * ``multi=False``: the historical single majority-vote winner.

    Ties are broken by higher mean confidence.
    """
    counts = {}
    sums = {}
    accepted_frames = 0
    for res in frame_results:
        if not res:
            continue
        accepted_frames += 1
        for name, score in res:
            counts[name] = counts.get(name, 0) + 1
            sums[name] = sums.get(name, 0.0) + float(score)

    if not counts:
        return []

    def _winner():
        best = max(counts, key=lambda n: (counts[n], sums[n] / counts[n]))
        return [(best, sums[best] / counts[best])]

    if not multi:
        return _winner()

    threshold = max(1, int(min_votes))
    if share and accepted_frames:
        threshold = max(threshold, int(math.ceil(share * accepted_frames)))

    kept = [
        (name, sums[name] / counts[name])
        for name, count in counts.items()
        if count >= threshold
    ]
    if not kept:
        # Never drop everything: keep the strongest candidate.
        return _winner()

    kept.sort(key=lambda item: (counts[item[0]], item[1]), reverse=True)
    return kept


# ========================================================================== #
# 4. IMAGE PIPELINE
# ========================================================================== #
