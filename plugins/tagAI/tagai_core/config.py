"""Configuration constants, model registry and class-name tables."""

import os


_DEP_IMPORT_ERROR = None
try:
    import numpy as np
    import requests
    from PIL import Image
except ImportError as _dep_exc:  # pragma: no cover - only hit when deps missing
    _DEP_IMPORT_ERROR = str(_dep_exc)
    np = None
    requests = None
    Image = None


# ========================================================================== #
# 1. CONFIG
# ========================================================================== #

PLUGIN_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(PLUGIN_DIR, "Models")
API_KEY_PATH = os.path.join(PLUGIN_DIR, "api.key")

STASH_URL_DEFAULT = "http://localhost:9999/graphql"

TAG_THRESHOLD = 0.5          # WD general tag threshold
CHAR_THRESHOLD = 0.85        # WD character tag threshold
BATCH_LIMIT = 1024
PER_PAGE_IMAGE_DEFAULT = 256
PER_PAGE_VIDEO_DEFAULT = 64
FRAME_COUNT_DEFAULT = 8
FRAME_INTERVAL_DEFAULT = 10.0  # seconds between sampled frames (0 = use frame_count)
MAX_FRAMES_DEFAULT = 512       # upper bound on frames sampled per video
FRAME_LONG_SIDE = 448          # intermediate frame extraction size (long side)
FRAME_WORKERS_DEFAULT = 4      # parallel ffmpeg processes used to extract frames
INFER_BATCH_SIZE_DEFAULT = 8   # frames per onnxruntime call (video pipeline)
YOLO_THRESHOLD_DEFAULT = 0.5
YOLO_MARGIN_DEFAULT = 0.4
YOLO_MIN_VOTES_DEFAULT = 1     # min accepted frames for a YOLO class to be tagged
YOLO_SHARE_DEFAULT = 0.0       # min fraction of accepted frames (0 = no share filter)
YOLO_TOP_K_DEFAULT = 1         # classes accepted per frame (1 = top-1 only)
JOYTAG_SIZE = 448              # JoyTag expects a 448x448 square
JOYTAG_THRESHOLD_DEFAULT = 0.4 # JoyTag sigmoid threshold (author's default)

# YOLO11-NSFW object detector (explicit acts / body parts).
YOLO_DET_SIZE = 640            # detection input size
YOLO_DET_CONF_DEFAULT = 0.25   # detection confidence threshold
YOLO_DET_IOU_DEFAULT = 0.45    # NMS IoU threshold
# Used when the ONNX metadata does not carry the class names.
YOLO_DET_CLASS_NAMES = [
    "person", "breast", "vulva", "butt", "male",
    "penis", "anal", "vaginal", "blowjob", "handjob",
]

# porntech/sex-position: single-label sex-position classifier (resnet50).
SEXPOS_SIZE = 224              # centre-cropped input size
SEXPOS_RESIZE = 256            # shorter side before the centre crop
SEXPOS_THRESHOLD_DEFAULT = 0.5 # top-1 confidence needed to tag the frame
SEXPOS_MARGIN_DEFAULT = 0.0    # optional top1-top2 gap (0 = disabled)
SEXPOS_CLASS_NAMES = [
    "blowjob", "hardcore", "titjob", "handjob",
    "pussy-licking", "fingering", "other", "solo",
]
# Debug report: per-tag confidences of one run, written to a JSON file so the
# thresholds can be calibrated against a known video (see README).
DEBUG_FILENAME = "tagai-debug.json"
DEBUG_FLOOR_DEFAULT = 0.05      # candidates below this score are not recorded
DEBUG_TOP_DEFAULT = 10          # candidates recorded per frame and model
DEBUG_AGG_TOP_DEFAULT = 100     # candidates recorded in the per-model summary

# Scene markers: optional per-tag markers at the moments a tag fired. The
# marker spans are padded by the sampling interval so a marker always lasts at
# least ``2 * marker_pad`` seconds (see build_markers).
MARKER_MODES = ("off", "ranges", "best")
MARKER_MAX_DEFAULT = 50         # upper bound on markers created per scene
MARKER_MIN_LENGTH = 1.0         # shortest allowed marker span (seconds)

# ImageNet statistics used by the timm preprocessing of that model.
DEFAULT_IMAGE_MODEL = "wd-v1-4-moat-tagger-v2"
DEFAULT_VIDEO_MODEL = "yolo26n-cls-porn"

# Hugging Face download settings (used to fetch missing models automatically).
HF_ENDPOINT = os.environ.get("HF_ENDPOINT", "https://huggingface.co").rstrip("/")
HF_TOKEN_ENV_VARS = ("HF_TOKEN", "HUGGING_FACE_HUB_TOKEN", "HUGGINGFACE_TOKEN")
HF_TOKEN_FILENAMES = ("hf_token", "hf.token", "huggingface.token")

# Model registry. ``family`` selects the strategy layer.
# Model registry. ``family`` selects the strategy layer; ``repo``/``files``
# describe how to fetch the model from Hugging Face when it is not on disk yet.
# ``files`` is a list of (local_filename, path_in_repo).
MODELS = {
    "wd-v1-4-moat-tagger-v2": {
        "family": "wd",
        "onnx": "wd-v1-4-moat-tagger-v2.onnx",
        "labels": "wd-v1-4-moat-tagger-v2.csv",
        "repo": "SmilingWolf/wd-v1-4-moat-tagger-v2",
        "files": [
            ("wd-v1-4-moat-tagger-v2.onnx", "model.onnx"),
            ("wd-v1-4-moat-tagger-v2.csv", "selected_tags.csv"),
        ],
    },
    "wd-convnext-tagger-v3": {
        "family": "wd",
        "onnx": "wd-convnext-tagger-v3.onnx",
        "labels": "wd-convnext-tagger-v3.csv",
        "repo": "SmilingWolf/wd-convnext-tagger-v3",
        "files": [
            ("wd-convnext-tagger-v3.onnx", "model.onnx"),
            ("wd-convnext-tagger-v3.csv", "selected_tags.csv"),
        ],
    },
    "wd-v1-4-vit-tagger": {
        "family": "wd",
        "onnx": "wd-v1-4-vit-tagger.onnx",
        "labels": "wd-v1-4-vit-tagger.csv",
        "repo": "SmilingWolf/wd-v1-4-vit-tagger",
        "files": [
            ("wd-v1-4-vit-tagger.onnx", "model.onnx"),
            ("wd-v1-4-vit-tagger.csv", "selected_tags.csv"),
        ],
    },
    # WD v3 taggers: 10,861 tags (vs 9,083 in the v1-4 series) and, unlike the
    # v1-4 graphs, a dynamic batch dimension.
    "wd-swinv2-tagger-v3": {
        "family": "wd",
        "onnx": "wd-swinv2-tagger-v3.onnx",
        "labels": "wd-swinv2-tagger-v3.csv",
        "repo": "SmilingWolf/wd-swinv2-tagger-v3",
        "files": [
            ("wd-swinv2-tagger-v3.onnx", "model.onnx"),
            ("wd-swinv2-tagger-v3.csv", "selected_tags.csv"),
        ],
    },
    "wd-eva02-large-tagger-v3": {
        "family": "wd",
        "onnx": "wd-eva02-large-tagger-v3.onnx",
        "labels": "wd-eva02-large-tagger-v3.csv",
        "repo": "SmilingWolf/wd-eva02-large-tagger-v3",
        "files": [
            ("wd-eva02-large-tagger-v3.onnx", "model.onnx"),
            ("wd-eva02-large-tagger-v3.csv", "selected_tags.csv"),
        ],
    },
    # JoyTag: ViT-B/16 multi-label tagger trained on Danbooru plus manually
    # tagged photographic images, so it works well on real (photo) porn.
    "joytag": {
        "family": "joytag",
        "onnx": "joytag.onnx",
        "labels": "joytag-top_tags.txt",
        "repo": "fancyfeast/joytag",
        "files": [
            ("joytag.onnx", "model.onnx"),
            ("joytag-top_tags.txt", "top_tags.txt"),
        ],
    },
    # YOLO11-NSFW: object detection of explicit acts and body parts (10
    # classes). The upstream repository only ships a .pt checkpoint, so the
    # ONNX has to be exported once by hand (see Models/README.md) -- it cannot
    # be downloaded automatically.
    "yolo11-nsfw": {
        "family": "yolo-det",
        "onnx": "yolo11-nsfw.onnx",
    },
    # porntech/sex-position: single-label sex-position classifier (resnet50, 8
    # classes). The upstream repository ships only pytorch_model.bin, so the
    # ONNX has to be exported once by hand (see Models/README.md) -- it cannot
    # be downloaded automatically.
    "sex-position": {
        "family": "sexpos",
        "onnx": "sex-position.onnx",
    },
    "yolo26n-cls-porn": {
        "family": "yolo",
        "onnx": "yolo26n-cls-porn.onnx",
        "repo": "likewendy/yolo26n-cls-porn",
        "gated": True,
        "files": [
            ("yolo26n-cls-porn.onnx", "weights/best.onnx"),
        ],
        # Optional: per-class confidence thresholds published by the author.
        # Fetched best-effort; the bundled defaults are used when absent.
        "optional_files": [
            ("yolo26n-cls-porn-thresholds.json",
             "class35_conf_thresholds_by_name.json"),
        ],
    },
}

# The YOLO classifier (likewendy/yolo26n-cls-porn) ships Chinese class names in
# its ONNX metadata. They are translated to English so Stash tags stay
# readable. The order of ``YOLO_CLASS_NAMES`` below is the model's real output
# order (verified against the ONNX metadata), NOT the order the README displays.
YOLO_ZH_TO_EN = {
    "AI生成": "AI Generated",
    "乳交": "Titfuck",
    "偷窥": "Voyeurism",
    "公共暴露": "Public Exposure",
    "内射": "Creampie",
    "动漫": "Anime",
    "卷发": "Curly Hair",
    "双插": "Double Penetration",
    "口交": "Blowjob",
    "口爆大会": "Bukkake",
    "圣诞": "Christmas",
    "女仆": "Maid",
    "女女假阳具": "Lesbian Strapon",
    "女女摩擦": "Lesbian Tribbing",
    "女着男裸": "CFNM",
    "孕妇": "Pregnant",
    "恋尿": "Pissing",
    "手交": "Handjob",
    "接吻": "Kissing",
    "油亮": "Oiled",
    "潮吹": "Squirting",
    "男性独处": "Solo Male",
    "男性群像": "Male Group",
    "皮革乳胶": "Leather and Latex",
    "纹身": "Tattoo",
    "绿帽视角": "Cuckold",
    "肛门特写": "Asshole Close-up",
    "脚交": "Footjob",
    "腋窝": "Armpit",
    "舔肛": "Rimjob",
    "舔阴": "Pussy Licking",
    "裤装": "Pants",
    "跨种族": "Interracial",
    "镜前": "Mirror",
    "骑脸": "Facesitting",
}

# Fallback English class names in the model's output order (used only when the
# ONNX metadata does not carry names).
YOLO_CLASS_NAMES = [
    "AI Generated", "Titfuck", "Voyeurism", "Public Exposure", "Creampie",
    "Anime", "Curly Hair", "Double Penetration", "Blowjob", "Bukkake",
    "Christmas", "Maid", "Lesbian Strapon", "Lesbian Tribbing", "CFNM",
    "Pregnant", "Pissing", "Handjob", "Kissing", "Oiled",
    "Squirting", "Solo Male", "Male Group", "Leather and Latex", "Tattoo",
    "Cuckold", "Asshole Close-up", "Footjob", "Armpit", "Rimjob",
    "Pussy Licking", "Pants", "Interracial", "Mirror", "Facesitting",
]

# Per-class confidence thresholds published by the model author (converted from
# class35_conf_thresholds_by_name.json). Using these instead of a flat 0.5 cuts
# down on false positives such as "Kissing" / "Pants".
YOLO_DEFAULT_THRESHOLDS = {
    "AI Generated": 0.5,
    "Titfuck": 0.5,
    "Voyeurism": 0.51236963,
    "Public Exposure": 0.55655706,
    "Creampie": 0.71145976,
    "Anime": 0.5,
    "Curly Hair": 0.74997914,
    "Double Penetration": 0.5,
    "Blowjob": 0.89571738,
    "Bukkake": 0.5,
    "Christmas": 0.5,
    "Maid": 0.60505283,
    "Lesbian Strapon": 0.5,
    "Lesbian Tribbing": 0.51000375,
    "CFNM": 0.66284251,
    "Pregnant": 0.51583439,
    "Pissing": 0.58715159,
    "Handjob": 0.88127387,
    "Kissing": 0.64717263,
    "Oiled": 0.85343647,
    "Squirting": 0.85944873,
    "Solo Male": 0.84280539,
    "Male Group": 0.76054007,
    "Leather and Latex": 0.56601757,
    "Tattoo": 0.80576283,
    "Cuckold": 0.9,
    "Asshole Close-up": 0.5,
    "Footjob": 0.5,
    "Armpit": 0.5,
    "Rimjob": 0.67189211,
    "Pussy Licking": 0.70615655,
    "Pants": 0.96068484,
    "Interracial": 0.8965643,
    "Mirror": 0.5,
    "Facesitting": 0.83216292,
}

# Runtime connection state (populated from stdin / api.key by setup_connection).
