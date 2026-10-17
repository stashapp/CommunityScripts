"""Per-family image preprocessing for the ONNX models."""

from tagai_core.config import JOYTAG_SIZE, SEXPOS_RESIZE, SEXPOS_SIZE, YOLO_DET_SIZE
from tagai_core.config import Image
from tagai_core.config import np


_IMAGENET_MEAN = None if np is None else np.array(
    [0.485, 0.456, 0.406], dtype=np.float32)
_IMAGENET_STD = None if np is None else np.array(
    [0.229, 0.224, 0.225], dtype=np.float32)

def wd_preprocess(img, size):
    """WD: aspect-preserving resize of the longest side to ``size``, pasted
    centred on a white square, BGR, NHWC ``[1, size, size, 3]``."""
    ratio = size / max(img.size)
    new = (int(img.width * ratio), int(img.height * ratio))
    img = img.resize(new, Image.LANCZOS)

    square = Image.new("RGB", (size, size), (255, 255, 255))
    square.paste(img, ((size - new[0]) // 2, (size - new[1]) // 2))

    arr = np.array(square).astype(np.float32)[:, :, ::-1]  # RGB -> BGR
    return np.expand_dims(arr, 0)  # [1, H, W, 3]


def yolo_preprocess(img, size=224):
    """YOLO classification: resize shorter side to ``size``, centre-crop to
    ``size x size``, RGB/255, CHW ``[1, 3, size, size]``."""
    img = img.convert("RGB")
    w, h = img.size
    scale = size / min(w, h)
    nw = max(1, int(round(w * scale)))
    nh = max(1, int(round(h * scale)))
    img = img.resize((nw, nh), Image.BILINEAR)

    left = (nw - size) // 2
    top = (nh - size) // 2
    img = img.crop((left, top, left + size, top + size))

    arr = np.asarray(img, dtype=np.float32) / 255.0
    arr = np.transpose(arr, (2, 0, 1))  # HWC -> CHW
    return np.expand_dims(arr, 0)


def yolo_preprocess_batch(images, size=224):
    """Preprocess a list of PIL images into ``[N, 3, size, size]`` float32."""
    if not images:
        return None
    return np.concatenate(
        [yolo_preprocess(img, size) for img in images], axis=0
    ).astype(np.float32)


def yolo_det_preprocess(img, size=YOLO_DET_SIZE):
    """YOLO11-NSFW detection: letterbox the image to ``size`` with grey padding.

    Returns ``(arr, meta)`` where ``arr`` is ``[1, 3, size, size]`` in [0, 1]
    and ``meta`` records the scale and padding used, so detection boxes can be
    mapped back to the original image if ever needed.
    """
    img = img.convert("RGB")
    w, h = img.size
    scale = min(size / w, size / h)
    nw = max(1, int(round(w * scale)))
    nh = max(1, int(round(h * scale)))
    resized = img.resize((nw, nh), Image.BILINEAR)

    canvas = Image.new("RGB", (size, size), (114, 114, 114))
    pad_x = (size - nw) // 2
    pad_y = (size - nh) // 2
    canvas.paste(resized, (pad_x, pad_y))

    arr = np.asarray(canvas, dtype=np.float32) / 255.0
    arr = np.transpose(arr, (2, 0, 1))  # HWC -> CHW
    meta = {"scale": scale, "pad_x": pad_x, "pad_y": pad_y, "size": size}
    return np.expand_dims(arr, 0), meta


def sexpos_preprocess(img, size=SEXPOS_SIZE, resize=SEXPOS_RESIZE):
    """porntech/sex-position: resize the shorter side to ``resize`` (BICUBIC),
    centre-crop ``size``, scale to [0, 1], ImageNet-normalise -> CHW."""
    img = img.convert("RGB")
    w, h = img.size
    scale = resize / min(w, h)
    nw = max(1, int(round(w * scale)))
    nh = max(1, int(round(h * scale)))
    img = img.resize((nw, nh), Image.BICUBIC)

    left = (nw - size) // 2
    top = (nh - size) // 2
    img = img.crop((left, top, left + size, top + size))

    arr = np.asarray(img, dtype=np.float32) / 255.0
    arr = (arr - _IMAGENET_MEAN) / _IMAGENET_STD
    arr = np.transpose(arr, (2, 0, 1))  # HWC -> CHW
    return np.expand_dims(arr, 0)


# JoyTag normalises with the CLIP statistics on a white-padded square.
_JOYTAG_MEAN = None if np is None else np.array(
    [0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
_JOYTAG_STD = None if np is None else np.array(
    [0.26862954, 0.26130258, 0.27577711], dtype=np.float32)


def joytag_preprocess(img, size=JOYTAG_SIZE):
    """JoyTag: white-pad the image to a square, resize to ``size`` (BICUBIC),
    scale to [0, 1] and CLIP-normalise -> CHW ``[1, 3, size, size]``."""
    img = img.convert("RGB")
    w, h = img.size
    max_dim = max(w, h)
    square = Image.new("RGB", (max_dim, max_dim), (255, 255, 255))
    square.paste(img, ((max_dim - w) // 2, (max_dim - h) // 2))

    if max_dim != size:
        square = square.resize((size, size), Image.BICUBIC)

    arr = np.asarray(square, dtype=np.float32) / 255.0
    arr = (arr - _JOYTAG_MEAN) / _JOYTAG_STD
    arr = np.transpose(arr, (2, 0, 1))  # HWC -> CHW
    return np.expand_dims(arr, 0)


# ------------------------------ postprocessing ---------------------------- #
