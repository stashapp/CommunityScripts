"""Model registry: ONNX session cache, Hugging Face download, labels."""

from tagai_core import config, stashlog
from tagai_core.config import (
    HF_ENDPOINT, HF_TOKEN_ENV_VARS, HF_TOKEN_FILENAMES, JOYTAG_SIZE, MODELS,
    SEXPOS_CLASS_NAMES, SEXPOS_SIZE, YOLO_CLASS_NAMES, YOLO_DEFAULT_THRESHOLDS,
    YOLO_DET_CLASS_NAMES, YOLO_DET_SIZE, YOLO_ZH_TO_EN,
)
from tagai_core.config import requests
import ast
import csv
import json
import os


_SESSION_CACHE = {}  # model name -> entry dict


def _resolve_wd_size(shape):
    """WD taggers are NHWC [N, H, W, 3]; return H (fall back to 448)."""
    if len(shape) == 4 and isinstance(shape[2], int):
        return shape[2]
    if len(shape) == 4 and isinstance(shape[1], int):
        return shape[1]
    return 448


def load_tags(csv_path):
    """Parse a WD ``selected_tags.csv``.

    Returns ``(tags, general_idx, char_idx)`` where the rows are laid out as
    ``[general..., ratings..., characters...]``. ``char_idx`` is ``None`` when
    the file has no character rows.
    """
    tags = []
    general_idx = None
    char_idx = None

    with open(csv_path, encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader, None)  # header
        for row in reader:
            if len(row) < 3:
                continue
            name = row[1].replace("_", " ")
            tags.append(name)

            if general_idx is None and row[2] == "0":
                general_idx = len(tags) - 1
            elif char_idx is None and row[2] == "4":
                char_idx = len(tags) - 1

    if general_idx is None:
        raise RuntimeError(
            f"CSV boundary detection failed for {csv_path}: no rows with category '0'"
        )

    return tags, general_idx, char_idx


def load_joytag_tags(txt_path):
    """Read JoyTag's ``top_tags.txt`` (one tag per line, index-ordered)."""
    with open(txt_path, encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def load_yolo_class_names(session):
    """Read class names from ONNX metadata (``names``), else the built-in list.

    The upstream model ships Chinese names; they are translated to English so
    the resulting Stash tags stay readable.
    """
    try:
        meta = session.get_modelmeta().custom_metadata_map
        raw = meta.get("names")
        if raw:
            parsed = ast.literal_eval(raw)
            if isinstance(parsed, dict):
                names = [str(parsed[k]) for k in sorted(parsed, key=lambda x: int(x))]
            elif isinstance(parsed, (list, tuple)):
                names = [str(x) for x in parsed]
            else:
                names = None
            if names:
                return [YOLO_ZH_TO_EN.get(n, n) for n in names]
    except Exception as exc:  # pragma: no cover - depends on model metadata
        stashlog.log.error(f"Could not read YOLO class names from metadata: {exc}")
    return list(YOLO_CLASS_NAMES)


def load_det_class_names(session):
    """Read detection class names from ONNX metadata (``names``), else built-in.

    The YOLO11-NSFW export stores ``names`` as a ``{index: name}`` mapping in
    its metadata; when it is missing the bundled list is used.
    """
    try:
        meta = session.get_modelmeta().custom_metadata_map
        raw = meta.get("names")
        if raw:
            parsed = ast.literal_eval(raw)
            if isinstance(parsed, dict):
                return [str(parsed[k]) for k in sorted(parsed, key=lambda x: int(x))]
            if isinstance(parsed, (list, tuple)):
                return [str(x) for x in parsed]
    except Exception as exc:  # pragma: no cover - depends on model metadata
        stashlog.log.error(f"Could not read detection class names from metadata: {exc}")
    return list(YOLO_DET_CLASS_NAMES)


def load_yolo_thresholds(model_name):
    """Return per-class thresholds for a YOLO model, else ``None``.

    Starts from the thresholds published by the model author (bundled in
    :data:`YOLO_DEFAULT_THRESHOLDS`) and lets an optional
    ``Models/<onnx-basename>-thresholds.json`` override them. Keys in that file
    may be English or the model's original Chinese names.
    """
    spec = MODELS.get(model_name, {})
    if spec.get("family") != "yolo":
        return None

    thresholds = dict(YOLO_DEFAULT_THRESHOLDS)

    onnx_name = spec.get("onnx")
    if onnx_name:
        base = os.path.splitext(onnx_name)[0]
        path = os.path.join(config.MODEL_DIR, base + "-thresholds.json")
        if os.path.isfile(path):
            try:
                with open(path, encoding="utf-8") as f:
                    data = json.load(f)
            except (OSError, ValueError) as exc:
                stashlog.log.error(f"Failed to read YOLO thresholds {path}: {exc}")
                data = None

            if isinstance(data, dict):
                for k, v in data.items():
                    try:
                        key = YOLO_ZH_TO_EN.get(str(k), str(k))
                        thresholds[key] = float(v)
                    except (TypeError, ValueError):
                        continue

    return thresholds or None


def resolve_hf_token(explicit=None):
    """Return a Hugging Face token from the arg, env vars, or a local file."""
    if explicit:
        return str(explicit).strip()

    for var in HF_TOKEN_ENV_VARS:
        value = os.environ.get(var)
        if value and value.strip():
            return value.strip()

    for name in HF_TOKEN_FILENAMES:
        path = os.path.join(config.PLUGIN_DIR, name)
        if os.path.isfile(path):
            try:
                with open(path, encoding="utf-8") as f:
                    token = f.readline().strip()
                if token:
                    return token
            except OSError:
                pass
    return None


def _hf_url(repo, path_in_repo):
    return f"{HF_ENDPOINT}/{repo}/resolve/main/{path_in_repo}"


def download_file(url, dest, token=None, on_progress=None):
    """Stream ``url`` to ``dest`` atomically (via a ``.part`` temp file)."""
    headers = {"User-Agent": "tagAI"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
    tmp = dest + ".part"

    with requests.get(
        url, headers=headers, stream=True, timeout=60, allow_redirects=True
    ) as resp:
        if resp.status_code in (401, 403):
            raise PermissionError(
                f"access denied ({resp.status_code}) for {url}"
            )
        resp.raise_for_status()

        try:
            total = int(resp.headers.get("Content-Length") or 0)
        except (TypeError, ValueError):
            total = 0

        done = 0
        with open(tmp, "wb") as fh:
            for chunk in resp.iter_content(chunk_size=1024 * 1024):
                if not chunk:
                    continue
                fh.write(chunk)
                done += len(chunk)
                if on_progress and total:
                    on_progress(min(1.0, done / total))

    os.replace(tmp, dest)
    return dest


def ensure_model_files(name, token=None, allow_download=True, on_progress=None):
    """Make sure every file for ``name`` exists locally, downloading if needed.

    Returns the list of files that were downloaded (empty when everything was
    already present). Raises a clear error when a file is missing and downloads
    are disabled or denied.
    """
    if name not in MODELS:
        raise ValueError(
            f"Unknown model {name!r}. Available: {', '.join(sorted(MODELS))}"
        )

    spec = MODELS[name]
    files = spec.get("files") or []
    missing = [
        (local, remote)
        for local, remote in files
        if not os.path.isfile(os.path.join(config.MODEL_DIR, local))
    ]
    optional = [
        (local, remote)
        for local, remote in (spec.get("optional_files") or [])
        if not os.path.isfile(os.path.join(config.MODEL_DIR, local))
    ]
    if not missing and not optional:
        return []

    if not allow_download:
        if missing:
            raise FileNotFoundError(
                "Missing model file(s): "
                + ", ".join(local for local, _ in missing)
                + "\nSee Models/README.md for download instructions."
            )
        # Only optional files are missing; skip them (bundled defaults apply).
        return []

    repo = spec.get("repo")
    if repo and (missing or optional):
        token = resolve_hf_token(token)
    else:
        token = None

    if missing and not repo:
        raise FileNotFoundError(
            "No download source configured for model "
            f"{name!r}; place the files in {config.MODEL_DIR} manually "
            "(see Models/README.md)."
        )

    if repo and spec.get("gated") and (missing or optional) and not token:
        stashlog.log.warning(
            f"Model {name!r} is gated on Hugging Face. Downloading without a "
            "token will likely fail; set HF_TOKEN (or a local hf_token file) "
            "after accepting the model's terms. See Models/README.md."
        )

    downloaded = []

    def _fetch(local, remote):
        dest = os.path.join(config.MODEL_DIR, local)
        url = _hf_url(repo, remote)
        stashlog.log.info(f"Downloading {local} from {url}")

        def _report(fraction, _name=local):
            if on_progress:
                try:
                    on_progress(fraction)
                except Exception:
                    pass
            stashlog.log.progress(fraction)

        download_file(url, dest, token=token, on_progress=_report)
        return dest

    for local, remote in missing:
        try:
            dest = _fetch(local, remote)
        except PermissionError as exc:
            raise FileNotFoundError(
                f"Could not download {local} from {remote}: {exc}. If this is a "
                "gated model, accept its terms on Hugging Face and provide a "
                "token via HF_TOKEN or a local hf_token file. "
                "See Models/README.md."
            ) from exc
        downloaded.append(dest)
        stashlog.log.info(f"Saved {dest}")

    # Optional files (e.g. the published threshold table) are best-effort.
    for local, remote in optional:
        if not repo:
            break
        try:
            dest = _fetch(local, remote)
        except Exception as exc:
            stashlog.log.warning(f"Could not download optional file {local}: {exc}")
            continue
        downloaded.append(dest)
        stashlog.log.info(f"Saved {dest}")

    return downloaded


def get_model(name):
    """Return a cached model entry, loading it on first use.

    Raises clear errors when the model name is unknown or a required file is
    missing so the plugin fails gracefully (Stash must not crash).
    """
    if name in _SESSION_CACHE:
        return _SESSION_CACHE[name]

    if name not in MODELS:
        raise ValueError(
            f"Unknown model {name!r}. Available: {', '.join(sorted(MODELS))}"
        )

    spec = MODELS[name]
    onnx_path = os.path.join(config.MODEL_DIR, spec["onnx"])
    if not os.path.isfile(onnx_path):
        raise FileNotFoundError(
            f"Model file not found: {onnx_path}\n"
            "See Models/README.md for download instructions."
        )

    try:
        import onnxruntime as ort
    except ImportError as exc:  # pragma: no cover - depends on env
        raise ImportError(
            "onnxruntime is required for TagAI. Install with: "
            "pip install -r requirements.txt"
        ) from exc

    session = ort.InferenceSession(
        onnx_path,
        providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
    )
    input_meta = session.get_inputs()[0]
    output_name = session.get_outputs()[0].name

    entry = {
        "name": name,
        "session": session,
        "family": spec["family"],
        "input_name": input_meta.name,
        "output_name": output_name,
        "spec": spec,
    }

    if spec["family"] == "wd":
        csv_path = os.path.join(config.MODEL_DIR, spec["labels"])
        if not os.path.isfile(csv_path):
            raise FileNotFoundError(
                f"Label CSV not found: {csv_path}\n"
                "See Models/README.md for download instructions."
            )
        tags, general_idx, char_idx = load_tags(csv_path)
        entry.update(
            {
                "tags": tags,
                "general_idx": general_idx,
                "char_idx": char_idx,
                "size": _resolve_wd_size(input_meta.shape),
            }
        )
    elif spec["family"] == "yolo":
        entry.update(
            {
                "size": 224,
                "class_names": load_yolo_class_names(session),
                "thresholds": load_yolo_thresholds(name),
            }
        )
    elif spec["family"] == "yolo-det":
        entry.update(
            {
                "size": YOLO_DET_SIZE,
                "class_names": load_det_class_names(session),
            }
        )
    elif spec["family"] == "sexpos":
        entry.update(
            {
                "size": SEXPOS_SIZE,
                "class_names": list(SEXPOS_CLASS_NAMES),
            }
        )

    else:  # joytag
        csv_path = os.path.join(config.MODEL_DIR, spec["labels"])
        if not os.path.isfile(csv_path):
            raise FileNotFoundError(
                f"Tag list not found: {csv_path}\n"
                "See Models/README.md for download instructions."
            )
        entry.update(
            {
                "tags": load_joytag_tags(csv_path),
                "size": JOYTAG_SIZE,
            }
        )

    _SESSION_CACHE[name] = entry
    return entry


def unload_model(name):
    """Drop a cached session (frees GPU memory)."""
    _SESSION_CACHE.pop(name, None)


# ------------------------------ preprocessing ----------------------------- #
