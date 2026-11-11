"""Unit tests for the TagAI plugin.

These tests deliberately avoid a real ONNX runtime / ffmpeg / Stash instance:
the model layer is exercised with fake sessions and the network layer with
monkey-patched ``gql``. Run with::

    python -m unittest discover -s tests -v
"""

import json
import os
import sys
import tempfile
import unittest
from unittest import mock

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import subprocess  # noqa: E402
from tagai_core import (  # noqa: E402
    cli as tc_cli,
    config as tc_config,
    debug as tc_debug,
    frames as tc_frames,
    images as tc_images,
    inference as tc_inference,
    jobs as tc_jobs,
    markers as tc_markers,
    models as tc_models,
    postprocess as tc_postprocess,
    preprocess as tc_preprocess,
    scenes as tc_scenes,
    stash_client as tc_stash_client,
    stashlog as tc_stashlog,
    tags as tc_tags,
)


# --------------------------------------------------------------------------- #
# Fakes
# --------------------------------------------------------------------------- #

class _FakeInput:
    def __init__(self, name, shape):
        self.name = name
        self.shape = shape


class _FakeOutput:
    def __init__(self, name):
        self.name = name


class _FakeMeta:
    def __init__(self, names=None):
        self.custom_metadata_map = {}
        if names is not None:
            self.custom_metadata_map["names"] = names


class _FakeSession:
    """Minimal stand-in for onnxruntime.InferenceSession."""

    def __init__(self, path, providers=None, input_shape=(1, 448, 448, 3),
                 names=None, output_size=2):
        self.path = path
        self.providers = providers
        self._inputs = [_FakeInput("input", list(input_shape))]
        self._outputs = [_FakeOutput("output")]
        self._meta = _FakeMeta(names)
        self.output_size = output_size

    def get_inputs(self):
        return self._inputs

    def get_outputs(self):
        return self._outputs

    def get_modelmeta(self):
        return self._meta

    def run(self, output_names, feeds):
        if not feeds:
            return [np.full((1, self.output_size), 1.0 / self.output_size, dtype=np.float32)]
        batch = next(iter(feeds.values()))
        n = int(np.asarray(batch).shape[0]) if np.ndim(batch) else 1
        return [np.full((n, self.output_size), 1.0 / self.output_size, dtype=np.float32)]


def _fake_onnxruntime(session_cls):
    module = mock.MagicMock()
    module.InferenceSession = session_cls
    return module


# --------------------------------------------------------------------------- #
# Strategy layer: softmax / probabilities
# --------------------------------------------------------------------------- #

class TestSoftmax(unittest.TestCase):
    def test_sums_to_one(self):
        out = tc_postprocess.softmax([2.0, 1.0, 0.1])
        self.assertAlmostEqual(float(out.sum()), 1.0, places=6)

    def test_monotonic(self):
        out = tc_postprocess.softmax([3.0, 1.0, 0.0])
        self.assertGreater(out[0], out[1])
        self.assertGreater(out[1], out[2])

    def test_numerically_stable(self):
        out = tc_postprocess.softmax([1000.0, 1000.0])
        self.assertTrue(np.all(np.isfinite(out)))
        self.assertAlmostEqual(float(out.sum()), 1.0, places=6)


class TestAsProbabilities(unittest.TestCase):
    def test_detects_softmaxed_output(self):
        probs = np.array([0.5, 0.3, 0.2])
        np.testing.assert_allclose(tc_postprocess._as_probabilities(probs), probs)

    def test_applies_softmax_to_logits(self):
        out = tc_postprocess._as_probabilities(np.array([2.0, 1.0, 0.1]))
        self.assertAlmostEqual(float(out.sum()), 1.0, places=6)
        self.assertGreaterEqual(float(out.min()), 0.0)


# --------------------------------------------------------------------------- #
# Preprocessing
# --------------------------------------------------------------------------- #

class TestPreprocess(unittest.TestCase):
    def test_wd_preprocess_shape_and_white_pad(self):
        img = Image.new("RGB", (200, 100), (255, 0, 0))  # landscape red
        arr = tc_preprocess.wd_preprocess(img, 448)
        self.assertEqual(arr.shape, (1, 448, 448, 3))
        self.assertEqual(arr.dtype, np.float32)

        # Corners are the white square padding.
        np.testing.assert_allclose(arr[0, 0, 0], [255, 255, 255])
        np.testing.assert_allclose(arr[0, -1, -1], [255, 255, 255])

        # Centre is BGR of red -> [0, 0, 255].
        centre = arr[0, 224, 224]
        self.assertLess(centre[0], 5)
        self.assertLess(centre[1], 5)
        self.assertGreater(centre[2], 250)

    def test_yolo_preprocess_shape_and_range(self):
        img = Image.new("RGB", (400, 200), (10, 20, 30))
        arr = tc_preprocess.yolo_preprocess(img, 224)
        self.assertEqual(arr.shape, (1, 3, 224, 224))
        self.assertEqual(arr.dtype, np.float32)
        self.assertGreaterEqual(float(arr.min()), 0.0)
        self.assertLessEqual(float(arr.max()), 1.0)


# --------------------------------------------------------------------------- #
# Postprocessing
# --------------------------------------------------------------------------- #

class TestWdPostprocess(unittest.TestCase):
    def setUp(self):
        self.model = {"tags": ["a", "b", "c", "d", "e"],
                      "general_idx": 0, "char_idx": 3}

    def test_general_slice_excludes_characters(self):
        probs = np.array([0.9, 0.4, 0.6, 0.99, 0.99])
        result = tc_postprocess.wd_postprocess(probs, self.model, tag_threshold=0.5,
                                      char_threshold=0.85, tag_characters=False)
        names = [n for n, _ in result]
        self.assertIn("a", names)
        self.assertIn("c", names)
        self.assertNotIn("d", names)  # character row must not leak into general
        self.assertNotIn("b", names)  # below threshold

    def test_characters_gated(self):
        probs = np.array([0.9, 0.4, 0.6, 0.99, 0.99])
        result = tc_postprocess.wd_postprocess(probs, self.model, tag_threshold=0.5,
                                      char_threshold=0.85, tag_characters=True)
        names = [n for n, _ in result]
        self.assertIn("d", names)
        self.assertIn("e", names)

    def test_char_idx_none_uses_end(self):
        model = {"tags": ["a", "b", "c"], "general_idx": 0, "char_idx": None}
        result = tc_postprocess.wd_postprocess(np.array([0.9, 0.9, 0.9]), model,
                                      tag_threshold=0.5)
        self.assertEqual(len(result), 3)


class TestYoloPostprocess(unittest.TestCase):
    def setUp(self):
        self.model = {"class_names": ["A", "B", "C"]}

    def test_accepts_confident_margin(self):
        result = tc_postprocess.yolo_postprocess(np.array([0.9, 0.05, 0.05]), self.model,
                                        margin=0.4, default_threshold=0.5)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0][0], "A")
        self.assertAlmostEqual(result[0][1], 0.9, places=5)

    def test_rejects_small_margin(self):
        result = tc_postprocess.yolo_postprocess(np.array([0.55, 0.4, 0.05]), self.model,
                                        margin=0.4, default_threshold=0.5)
        self.assertEqual(result, [])

    def test_rejects_low_confidence(self):
        result = tc_postprocess.yolo_postprocess(np.array([0.45, 0.3, 0.25]), self.model,
                                        margin=0.1, default_threshold=0.5)
        self.assertEqual(result, [])

    def test_per_class_threshold(self):
        thresholds = {"A": 0.95, "default": 0.5}
        result = tc_postprocess.yolo_postprocess(np.array([0.9, 0.05, 0.05]), self.model,
                                        thresholds=thresholds, margin=0.4)
        self.assertEqual(result, [])

    def test_class_name_fallback_when_mismatch(self):
        model = {"class_names": []}
        result = tc_postprocess.yolo_postprocess(np.array([0.9, 0.05]), model,
                                        margin=0.4, default_threshold=0.5)
        self.assertEqual(result[0][0], "class_0")

    def test_top_k_defaults_to_single_class(self):
        result = tc_postprocess.yolo_postprocess(np.array([0.95, 0.55, 0.05]), self.model,
                                        margin=0.2, default_threshold=0.5)
        self.assertEqual([name for name, _ in result], ["A"])

    def test_top_k_two_adds_runner_up(self):
        result = tc_postprocess.yolo_postprocess(np.array([0.95, 0.55, 0.05]), self.model,
                                        margin=0.2, default_threshold=0.5, top_k=2)
        self.assertEqual([name for name, _ in result], ["A", "B"])
        self.assertAlmostEqual(result[1][1], 0.55, places=5)

    def test_top_k_skips_runner_up_below_threshold(self):
        result = tc_postprocess.yolo_postprocess(np.array([0.95, 0.3, 0.05]), self.model,
                                        margin=0.2, default_threshold=0.5, top_k=2)
        self.assertEqual([name for name, _ in result], ["A"])

    def test_top_k_uses_per_class_threshold_for_runner_up(self):
        thresholds = {"A": 0.5, "B": 0.9, "default": 0.5}
        result = tc_postprocess.yolo_postprocess(np.array([0.95, 0.55, 0.05]), self.model,
                                        thresholds=thresholds, margin=0.2, top_k=2)
        self.assertEqual([name for name, _ in result], ["A"])

    def test_top_k_ignored_when_frame_is_rejected(self):
        result = tc_postprocess.yolo_postprocess(np.array([0.6, 0.5, 0.05]), self.model,
                                        margin=0.4, default_threshold=0.5, top_k=3)
        self.assertEqual(result, [])


# --------------------------------------------------------------------------- #
# Aggregation
# --------------------------------------------------------------------------- #

class TestAggregation(unittest.TestCase):
    def test_wd_aggregate_uses_max(self):
        frames = [[("a", 0.6)], [("a", 0.9), ("b", 0.7)]]
        result = dict(tc_postprocess.wd_aggregate(frames))
        self.assertAlmostEqual(result["a"], 0.9)
        self.assertAlmostEqual(result["b"], 0.7)

    def test_yolo_aggregate_majority(self):
        frames = [[("A", 0.9)], [("B", 0.8)], [("A", 0.7)]]
        result = tc_postprocess.yolo_aggregate(frames)
        self.assertEqual(result[0][0], "A")

    def test_yolo_aggregate_tie_breaks_on_mean_conf(self):
        frames = [[("A", 0.6)], [("B", 0.9)]]
        result = tc_postprocess.yolo_aggregate(frames)
        self.assertEqual(result[0][0], "B")

    def test_yolo_aggregate_empty(self):
        self.assertEqual(tc_postprocess.yolo_aggregate([[], [], []]), [])

    def test_yolo_multilabel_keeps_every_repeated_class(self):
        frames = [[("A", 0.9)], [("A", 0.8)], [("B", 0.7)], [("B", 0.7)]]
        result = tc_postprocess.yolo_aggregate(frames, min_votes=2, share=0.0)
        self.assertEqual([n for n, _ in result], ["A", "B"])

    def test_yolo_multilabel_drops_singletons(self):
        frames = [[("A", 0.9)], [("A", 0.8)], [("B", 0.7)]]
        result = tc_postprocess.yolo_aggregate(frames, min_votes=2, share=0.0)
        self.assertEqual([n for n, _ in result], ["A"])

    def test_yolo_multilabel_share_threshold(self):
        # "A" wins 3 of 5 accepted frames, "B" 2 of 5.
        frames = [[("A", 0.9)], [("A", 0.9)], [("A", 0.9)],
                  [("B", 0.9)], [("B", 0.9)]]
        # share 0.5 -> a class must win >= 3 frames, so only "A" survives.
        self.assertEqual(
            [n for n, _ in tc_postprocess.yolo_aggregate(frames, min_votes=1, share=0.5)],
            ["A"])
        # share 0.3 -> 2 frames are enough, so both survive.
        self.assertEqual(
            [n for n, _ in tc_postprocess.yolo_aggregate(frames, min_votes=1, share=0.3)],
            ["A", "B"])

    def test_yolo_single_winner_mode(self):
        frames = [[("A", 0.9)], [("B", 0.9)], [("A", 0.8)]]
        result = tc_postprocess.yolo_aggregate(frames, multi=False)
        self.assertEqual([n for n, _ in result], ["A"])

    def test_yolo_falls_back_to_winner_when_nothing_passes(self):
        frames = [[("A", 0.6)], [("B", 0.9)]]
        result = tc_postprocess.yolo_aggregate(frames, min_votes=5, share=0.0)
        self.assertEqual([n for n, _ in result], ["B"])


# --------------------------------------------------------------------------- #
# WD label CSV parsing
# --------------------------------------------------------------------------- #

class TestLoadTags(unittest.TestCase):
    def _write_csv(self, rows):
        fd, path = tempfile.mkstemp(suffix=".csv")
        os.close(fd)
        with open(path, "w", encoding="utf-8") as f:
            f.write("tag_id,name,category,count\n")
            for r in rows:
                f.write(",".join(str(x) for x in r) + "\n")
        self.addCleanup(os.remove, path)
        return path

    def test_boundary_detection(self):
        path = self._write_csv([
            (1, "rating_x", 9, 1),
            (2, "general_a", 0, 1),
            (3, "general_b", 0, 1),
            (4, "char_c", 4, 1),
        ])
        tags, general_idx, char_idx = tc_models.load_tags(path)
        self.assertEqual(tags, ["rating x", "general a", "general b", "char c"])
        self.assertEqual(general_idx, 1)
        self.assertEqual(char_idx, 3)

    def test_missing_general_raises(self):
        path = self._write_csv([(1, "char_c", 4, 1)])
        with self.assertRaises(RuntimeError):
            tc_models.load_tags(path)


# --------------------------------------------------------------------------- #
# YOLO metadata / thresholds
# --------------------------------------------------------------------------- #

class TestYoloMetadata(unittest.TestCase):
    def test_class_names_english_passthrough(self):
        session = _FakeSession("x", names="{0: 'Cuckold', 1: 'Anime'}")
        self.assertEqual(tc_models.load_yolo_class_names(session), ["Cuckold", "Anime"])

    def test_class_names_translated_from_chinese(self):
        """Metadata names are Chinese; they must be mapped to English."""
        session = _FakeSession("x", names="{0: '接吻', 1: '动漫', 2: '未知'}")
        self.assertEqual(tc_models.load_yolo_class_names(session),
                         ["Kissing", "Anime", "未知"])

    def test_class_names_fallback(self):
        session = _FakeSession("x", names=None)
        names = tc_models.load_yolo_class_names(session)
        self.assertEqual(len(names), 35)
        self.assertEqual(names, tc_config.YOLO_CLASS_NAMES)

    def test_bundled_defaults_cover_every_class(self):
        for name in tc_config.YOLO_CLASS_NAMES:
            self.assertIn(name, tc_config.YOLO_DEFAULT_THRESHOLDS)
        self.assertAlmostEqual(tc_config.YOLO_DEFAULT_THRESHOLDS["Kissing"],
                               0.64717263, places=8)
        self.assertAlmostEqual(tc_config.YOLO_DEFAULT_THRESHOLDS["Pants"],
                               0.96068484, places=8)

    def test_load_thresholds_merges_overrides(self):
        with tempfile.TemporaryDirectory() as tmp:
            with mock.patch.object(tc_config, "MODEL_DIR", tmp):
                with open(os.path.join(tmp, "yolo26n-cls-porn-thresholds.json"),
                          "w", encoding="utf-8") as f:
                    # Chinese key from the upstream file + a plain override.
                    f.write('{"接吻": 0.71, "default": 0.4}')
                result = tc_models.load_yolo_thresholds("yolo26n-cls-porn")
                # Bundled defaults are still present...
                self.assertEqual(result["Pants"], tc_config.YOLO_DEFAULT_THRESHOLDS["Pants"])
                # ...and the file overrides win, with zh keys translated.
                self.assertAlmostEqual(result["Kissing"], 0.71)
                self.assertAlmostEqual(result["default"], 0.4)

    def test_load_thresholds_defaults_without_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            with mock.patch.object(tc_config, "MODEL_DIR", tmp):
                result = tc_models.load_yolo_thresholds("yolo26n-cls-porn")
                self.assertEqual(result, tc_config.YOLO_DEFAULT_THRESHOLDS)

    def test_load_thresholds_none_for_wd(self):
        self.assertIsNone(tc_models.load_yolo_thresholds("wd-v1-4-moat-tagger-v2"))


# --------------------------------------------------------------------------- #
# Model registry
# --------------------------------------------------------------------------- #

class TestModelRegistry(unittest.TestCase):
    def test_unknown_model_raises(self):
        with self.assertRaises(ValueError):
            tc_models.get_model("does-not-exist")

    def test_missing_file_raises_clear_error(self):
        with tempfile.TemporaryDirectory() as tmp:
            with mock.patch.object(tc_config, "MODEL_DIR", tmp):
                with self.assertRaises(FileNotFoundError) as ctx:
                    tc_models.get_model("wd-v1-4-moat-tagger-v2")
        self.assertIn("README", str(ctx.exception))

    def test_loads_wd_model_and_caches(self):
        with tempfile.TemporaryDirectory() as tmp:
            with open(os.path.join(tmp, "wd-v1-4-moat-tagger-v2.onnx"), "w") as f:
                f.write("x")
            with open(os.path.join(tmp, "wd-v1-4-moat-tagger-v2.csv"), "w",
                      encoding="utf-8") as f:
                f.write("tag_id,name,category,count\n")
                f.write("1,general_a,0,1\n")
                f.write("2,char_c,4,1\n")

            fake = _fake_onnxruntime(_FakeSession)
            tc_models._SESSION_CACHE.clear()
            self.addCleanup(tc_models._SESSION_CACHE.clear)
            with mock.patch.object(tc_config, "MODEL_DIR", tmp), \
                    mock.patch.dict(sys.modules, {"onnxruntime": fake}):
                model = tc_models.get_model("wd-v1-4-moat-tagger-v2")
                self.assertEqual(model["family"], "wd")
                self.assertEqual(model["size"], 448)
                self.assertEqual(model["tags"], ["general a", "char c"])
                # cached
                self.assertIs(tc_models.get_model("wd-v1-4-moat-tagger-v2"), model)

    def test_softmax_applied_for_yolo(self):
        with tempfile.TemporaryDirectory() as tmp:
            with open(os.path.join(tmp, "yolo26n-cls-porn.onnx"), "w") as f:
                f.write("x")

            fake = _fake_onnxruntime(
                lambda path, providers=None: _FakeSession(
                    path, providers, input_shape=(1, 3, 224, 224),
                    names="{0: 'Cuckold', 1: 'Anime'},", output_size=2,
                )
            )
            tc_models._SESSION_CACHE.clear()
            self.addCleanup(tc_models._SESSION_CACHE.clear)
            with mock.patch.object(tc_config, "MODEL_DIR", tmp), \
                    mock.patch.dict(sys.modules, {"onnxruntime": fake}):
                model = tc_models.get_model("yolo26n-cls-porn")
                self.assertEqual(model["family"], "yolo")
                self.assertEqual(model["size"], 224)


class _FakeResponse:
    """Minimal stand-in for a requests streaming response."""

    def __init__(self, status=200, body=b"", headers=None):
        self.status_code = status
        self._body = body
        self.headers = headers if headers is not None else {
            "Content-Length": str(len(body))
        }

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")

    def iter_content(self, chunk_size=1):
        yield self._body


class TestModelDownload(unittest.TestCase):
    def setUp(self):
        # Keep the environment token-free by default.
        self._env = mock.patch.dict(
            os.environ,
            {"HF_TOKEN": "", "HUGGING_FACE_HUB_TOKEN": "", "HUGGINGFACE_TOKEN": ""},
            clear=False,
        )
        self._env.start()
        self.addCleanup(self._env.stop)

        self._log = mock.patch.object(tc_stashlog, "log", mock.MagicMock())
        self._log.start()
        self.addCleanup(self._log.stop)

    def test_token_precedence_explicit(self):
        self.assertEqual(tc_models.resolve_hf_token("explicit"), "explicit")

    def test_token_from_env(self):
        with mock.patch.dict(os.environ, {"HF_TOKEN": "abc123"}):
            with tempfile.TemporaryDirectory() as tmp:
                with mock.patch.object(tc_config, "PLUGIN_DIR", tmp):
                    self.assertEqual(tc_models.resolve_hf_token(), "abc123")

    def test_token_from_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            with open(os.path.join(tmp, "hf_token"), "w") as f:
                f.write("filetoken\n")
            with mock.patch.object(tc_config, "PLUGIN_DIR", tmp):
                self.assertEqual(tc_models.resolve_hf_token(), "filetoken")

    def test_token_absent_returns_none(self):
        with tempfile.TemporaryDirectory() as tmp:
            with mock.patch.object(tc_config, "PLUGIN_DIR", tmp):
                self.assertIsNone(tc_models.resolve_hf_token())

    def test_hf_url(self):
        self.assertEqual(
            tc_models._hf_url("owner/repo", "weights/best.onnx"),
            f"{tc_config.HF_ENDPOINT}/owner/repo/resolve/main/weights/best.onnx",
        )

    def test_ensure_skips_when_present(self):
        with tempfile.TemporaryDirectory() as tmp:
            for local, _ in tc_config.MODELS["wd-v1-4-moat-tagger-v2"]["files"]:
                open(os.path.join(tmp, local), "w").close()
            with mock.patch.object(tc_config, "MODEL_DIR", tmp), \
                    mock.patch.object(tc_config.requests, "get") as get:
                self.assertEqual(
                    tc_models.ensure_model_files("wd-v1-4-moat-tagger-v2"), []
                )
                get.assert_not_called()

    def test_ensure_downloads_missing_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            resp = _FakeResponse(body=b"HELLO")
            with mock.patch.object(tc_config, "MODEL_DIR", tmp), \
                    mock.patch.object(tc_config.requests, "get",
                                      return_value=resp) as get:
                out = tc_models.ensure_model_files("wd-v1-4-moat-tagger-v2")
            self.assertEqual(len(out), 2)
            self.assertEqual(get.call_count, 2)
            for local, _ in tc_config.MODELS["wd-v1-4-moat-tagger-v2"]["files"]:
                with open(os.path.join(tmp, local), "rb") as f:
                    self.assertEqual(f.read(), b"HELLO")

    def test_ensure_download_disabled_raises(self):
        with tempfile.TemporaryDirectory() as tmp:
            with mock.patch.object(tc_config, "MODEL_DIR", tmp):
                with self.assertRaises(FileNotFoundError) as ctx:
                    tc_models.ensure_model_files(
                        "wd-v1-4-moat-tagger-v2", allow_download=False
                    )
        self.assertIn("README", str(ctx.exception))

    def test_gated_permission_error_is_clear(self):
        with tempfile.TemporaryDirectory() as tmp:
            resp = _FakeResponse(status=403)
            with mock.patch.object(tc_config, "MODEL_DIR", tmp), \
                    mock.patch.object(tc_config.requests, "get", return_value=resp):
                with self.assertRaises(FileNotFoundError) as ctx:
                    tc_models.ensure_model_files("yolo26n-cls-porn",
                                             token="tok")
        message = str(ctx.exception)
        self.assertIn("token", message.lower())
        self.assertIn("README", message)

    def test_unknown_model_raises(self):
        with self.assertRaises(ValueError):
            tc_models.ensure_model_files("nope")

    def test_optional_file_downloaded_best_effort(self):
        with tempfile.TemporaryDirectory() as tmp:
            # Required ONNX present; only the optional thresholds file missing.
            open(os.path.join(tmp, "yolo26n-cls-porn.onnx"), "w").close()
            resp = _FakeResponse(body=b'{"a": 0.5}')
            with mock.patch.object(tc_config, "MODEL_DIR", tmp), \
                    mock.patch.object(tc_config.requests, "get",
                                      return_value=resp) as get:
                out = tc_models.ensure_model_files("yolo26n-cls-porn", token="tok")
            self.assertEqual(len(out), 1)
            self.assertTrue(out[0].endswith("yolo26n-cls-porn-thresholds.json"))
            self.assertEqual(get.call_count, 1)

    def test_optional_file_failure_is_not_fatal(self):
        with tempfile.TemporaryDirectory() as tmp:
            open(os.path.join(tmp, "yolo26n-cls-porn.onnx"), "w").close()
            with mock.patch.object(tc_config, "MODEL_DIR", tmp), \
                    mock.patch.object(tc_config.requests, "get",
                                      side_effect=RuntimeError("boom")):
                self.assertEqual(
                    tc_models.ensure_model_files("yolo26n-cls-porn", token="tok"),
                    [])


# --------------------------------------------------------------------------- #
# Connection resolution
# --------------------------------------------------------------------------- #

class TestConnection(unittest.TestCase):
    def setUp(self):
        self._saved = (tc_stash_client.STASH_URL, tc_stash_client.API_KEY, tc_stash_client.SESSION_COOKIE,
                       tc_config.API_KEY_PATH)

    def tearDown(self):
        (tc_stash_client.STASH_URL, tc_stash_client.API_KEY, tc_stash_client.SESSION_COOKIE,
         tc_config.API_KEY_PATH) = self._saved

    def test_from_server_connection(self):
        tc_config.API_KEY_PATH = "/nonexistent/api.key"
        url, key, cookie = tc_stash_client.setup_connection({
            "server_connection": {
                "Scheme": "https", "Host": "stash.local", "Port": 8443,
                "SessionCookie": "abc123",
            }
        })
        self.assertEqual(url, "https://stash.local:8443/graphql")
        self.assertEqual(key, "abc123")
        self.assertEqual(cookie, {"Name": "session", "Value": "abc123"})

    def test_cookie_dict(self):
        tc_config.API_KEY_PATH = "/nonexistent/api.key"
        _url, key, cookie = tc_stash_client.setup_connection({
            "server_connection": {
                "SessionCookie": {"Name": "session", "Value": "xyz"},
            }
        })
        self.assertEqual(key, "xyz")
        self.assertEqual(cookie["Value"], "xyz")

    def test_falls_back_to_api_key_file(self):
        with tempfile.NamedTemporaryFile("w", delete=False) as f:
            f.write("file-key\n")
            path = f.name
        self.addCleanup(os.remove, path)
        tc_config.API_KEY_PATH = path
        _url, key, _cookie = tc_stash_client.setup_connection({})
        self.assertEqual(key, "file-key")


# --------------------------------------------------------------------------- #
# GraphQL queries + apply mutations
# --------------------------------------------------------------------------- #

class TestGraphQLQueries(unittest.TestCase):
    def test_get_images_parses_response(self):
        captured = {}

        def fake_gql(query, variables=None):
            captured.update(variables)
            return {"data": {"findImages": {
                "images": [{"id": "1"}], "count": 7}}}

        with mock.patch.object(tc_stash_client, "gql", fake_gql):
            images, count = tc_images.get_images("1357", page=2, per_page=10)
        self.assertEqual(images, [{"id": "1"}])
        self.assertEqual(count, 7)
        self.assertEqual(captured["excludes"], ["1357"])
        self.assertEqual(captured["page"], 2)
        self.assertEqual(captured["per_page"], 10)

    def test_get_scenes_video_fields(self):
        def fake_gql(query, variables=None):
            self.assertIn("... on VideoFile", query)
            return {"data": {"findScenes": {
                "scenes": [{"id": "3968"}], "count": 1}}}

        with mock.patch.object(tc_stash_client, "gql", fake_gql):
            scenes, count = tc_scenes.get_scenes("1357")
        self.assertEqual(scenes, [{"id": "3968"}])
        self.assertEqual(count, 1)

    def test_apply_tags_merge(self):
        calls = []

        def fake_gql(query, variables=None):
            calls.append((query, variables))
            if "findImage" in query:
                return {"data": {"findImage": {"tags": [
                    {"id": "10"}, {"id": "1355"}, {"id": "20"}]}}}
            return {"data": {"imageUpdate": {"id": "1"}}}

        with mock.patch.object(tc_stash_client, "gql", fake_gql):
            tc_images.apply_tags("1", ["100", "200"],
                             exclude_tag_id="1355", ai_tagged_id="1357")

        mutation = [c for c in calls if "imageUpdate" in c[0]][0]
        self.assertEqual(set(mutation[1]["tags"]),
                         {"10", "20", "100", "200", "1357"})

    def test_apply_scene_tags_merge(self):
        calls = []

        def fake_gql(query, variables=None):
            calls.append((query, variables))
            if "findScene" in query:
                return {"data": {"findScene": {"tags": [{"id": "10"}]}}}
            return {"data": {"sceneUpdate": {"id": "1"}}}

        with mock.patch.object(tc_stash_client, "gql", fake_gql):
            tc_scenes.apply_scene_tags("1", ["100"],
                                   exclude_tag_id="1355", ai_tagged_id="1357")

        mutation = [c for c in calls if "sceneUpdate" in c[0]][0]
        self.assertEqual(set(mutation[1]["tags"]), {"10", "100", "1357"})


# --------------------------------------------------------------------------- #
# Tag cache / ensure_tag (case-insensitive tag names)
# --------------------------------------------------------------------------- #

class TestTagCache(unittest.TestCase):
    def setUp(self):
        self._saved = dict(tc_stash_client.TAG_CACHE)
        tc_stash_client.TAG_CACHE = {}
        self._log = mock.patch.object(tc_stashlog, "log", mock.MagicMock())
        self._log.start()

    def tearDown(self):
        self._log.stop()
        tc_stash_client.TAG_CACHE = self._saved

    def test_load_tag_cache_is_case_insensitive(self):
        def fake_gql(query, variables=None):
            return {"data": {"findTags": {
                "tags": [{"id": "3290", "name": "AI: christmas"}],
                "count": 1}}}

        with mock.patch.object(tc_stash_client, "gql", fake_gql):
            tc_stash_client.load_tag_cache()
        self.assertEqual(tc_stash_client.TAG_CACHE["ai: christmas"], "3290")

    def test_ensure_tag_uses_cache_without_querying(self):
        tc_stash_client.TAG_CACHE["ai: x"] = "5"

        def boom(query, variables=None):
            raise AssertionError("gql must not be called on a cache hit")

        with mock.patch.object(tc_stash_client, "gql", boom):
            self.assertEqual(tc_stash_client.ensure_tag("AI: X"), "5")

    def test_ensure_tag_reuses_existing_case_variant(self):
        def fake_gql(query, variables=None):
            if "findTags" in query:
                return {"data": {"findTags": {
                    "tags": [{"id": "3290", "name": "AI: christmas"}]}}}
            raise AssertionError("tagCreate must not run for an existing tag")

        with mock.patch.object(tc_stash_client, "gql", fake_gql):
            self.assertEqual(tc_stash_client.ensure_tag("AI: Christmas"), "3290")
        self.assertEqual(tc_stash_client.TAG_CACHE["ai: christmas"], "3290")

    def test_ensure_tag_creates_when_missing(self):
        def fake_gql(query, variables=None):
            if "findTags" in query:
                return {"data": {"findTags": {"tags": []}}}
            return {"data": {"tagCreate": {"id": "9", "name": "AI: New"}}}

        with mock.patch.object(tc_stash_client, "gql", fake_gql):
            self.assertEqual(tc_stash_client.ensure_tag("AI: New"), "9")
        self.assertEqual(tc_stash_client.TAG_CACHE["ai: new"], "9")

    def test_ensure_tag_recovers_when_create_fails(self):
        state = {"lookups": 0}

        def fake_gql(query, variables=None):
            if "findTags" in query:
                state["lookups"] += 1
                # Not found before the create, found afterwards.
                tags = [] if state["lookups"] == 1 else [
                    {"id": "7", "name": "AI: Kissing"}]
                return {"data": {"findTags": {"tags": tags}}}
            return {"errors": [{"message": "already exists"}], "data": None}

        with mock.patch.object(tc_stash_client, "gql", fake_gql):
            self.assertEqual(tc_stash_client.ensure_tag("AI: Kissing"), "7")
        self.assertEqual(state["lookups"], 2)

    def test_ensure_tag_returns_none_when_unresolvable(self):
        def fake_gql(query, variables=None):
            if "findTags" in query:
                return {"data": {"findTags": {"tags": []}}}
            return {"errors": [{"message": "boom"}], "data": None}

        with mock.patch.object(tc_stash_client, "gql", fake_gql):
            self.assertIsNone(tc_stash_client.ensure_tag("AI: Nope"))
        tc_stashlog.log.error.assert_called()

    def test_ensure_tag_blank_name(self):
        self.assertIsNone(tc_stash_client.ensure_tag(""))


# --------------------------------------------------------------------------- #
# Pagination loop
# --------------------------------------------------------------------------- #

class TestIterateJob(unittest.TestCase):
    def test_tagall_shrinking_set_terminates(self):
        state = {"ids": [1, 2, 3, 4, 5], "fetches": 0}

        def fetch(page):
            state["fetches"] += 1
            items = [{"id": i} for i in state["ids"]]
            return items, len(items)

        def process(batch):
            for it in batch:
                state["ids"].remove(it["id"])

        processed = tc_jobs.iterate_job(fetch, process, "TagAll", 2)
        self.assertEqual(processed, {1, 2, 3, 4, 5})
        self.assertEqual(state["ids"], [])
        self.assertLessEqual(state["fetches"], 10)  # no infinite loop

    def test_tagall_stops_when_nothing_new(self):
        fetches = {"n": 0}

        def fetch(page):
            fetches["n"] += 1
            return [{"id": 1}, {"id": 2}], 2

        processed = tc_jobs.iterate_job(fetch, lambda b: None, "TagAll", 2)
        self.assertEqual(processed, {1, 2})
        self.assertEqual(fetches["n"], 2)  # second fetch finds no new ids

    def test_forcetag_advances_pages(self):
        pages = {1: [{"id": 1}, {"id": 2}], 2: [{"id": 3}], 3: []}
        seen_pages = []

        def fetch(page):
            seen_pages.append(page)
            return pages.get(page, []), 3

        processed = tc_jobs.iterate_job(fetch, lambda b: None, "ForceTag", 2)
        self.assertEqual(processed, {1, 2, 3})
        self.assertIn(2, seen_pages)
        self.assertNotIn(1, [seen_pages[i] for i in range(len(seen_pages))
                             if i > 0])  # page advances, never resets

    def test_progress_callback(self):
        progress = []
        pages = {1: [{"id": 1}], 2: []}

        def fetch(page):
            return pages.get(page, []), 1

        tc_jobs.iterate_job(fetch, lambda b: None, "ForceTag", 1,
                          on_progress=progress.append)
        self.assertTrue(progress)
        self.assertLessEqual(max(progress), 1.0)


# --------------------------------------------------------------------------- #
# Frame extraction
# --------------------------------------------------------------------------- #

class TestComputeFrameTimes(unittest.TestCase):
    def test_zero_or_missing_duration(self):
        self.assertEqual(tc_frames.compute_frame_times(0), [])
        self.assertEqual(tc_frames.compute_frame_times(None), [])

    def test_frame_count_mode(self):
        """frame_interval <= 0 falls back to an evenly spread frame_count."""
        times = tc_frames.compute_frame_times(100.0, frame_count=4, frame_interval=0)
        self.assertEqual(len(times), 4)
        self.assertGreaterEqual(min(times), 10.0)
        self.assertLessEqual(max(times), 90.0)
        # Evenly spread across the band.
        self.assertAlmostEqual(times[1] - times[0], times[2] - times[1], places=5)

    def test_interval_mode_counts_frames(self):
        """~one frame per interval, sampled across the middle 80% band."""
        times = tc_frames.compute_frame_times(100.0, frame_interval=10.0,
                                          max_frames=1000)
        # span = 80s, 80 // 10 + 1 == 9 samples.
        self.assertEqual(len(times), 9)
        self.assertGreaterEqual(min(times), 10.0)
        self.assertLessEqual(max(times), 90.0)

    def test_interval_mode_honours_max_frames(self):
        times = tc_frames.compute_frame_times(3600.0, frame_interval=1.0,
                                          max_frames=64)
        self.assertEqual(len(times), 64)

    def test_short_video_yields_single_frame(self):
        times = tc_frames.compute_frame_times(5.0, frame_interval=10.0)
        self.assertEqual(len(times), 1)
        self.assertGreater(times[0], 0.0)
        self.assertLess(times[0], 5.0)


class TestExtractFrames(unittest.TestCase):
    def test_no_video_or_times_returns_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(tc_frames.extract_frames("", [1.0], tmp), [])
            self.assertEqual(tc_frames.extract_frames("x.mp4", None, tmp), [])
            self.assertEqual(tc_frames.extract_frames("x.mp4", [], tmp), [])

    def test_missing_video_returns_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertEqual(
                tc_frames.extract_frames("/no/such/video.mp4", [50.0], tmp), [])

    def test_missing_ffmpeg_returns_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            video = os.path.join(tmp, "v.mp4")
            open(video, "w").close()
            with mock.patch.object(subprocess, "run",
                                   side_effect=FileNotFoundError):
                frames = tc_frames.extract_frames(video, [30.0, 60.0], tmp,
                                              ffmpeg_path="nope")
            self.assertEqual(frames, [])

    def test_extracts_one_frame_per_time(self):
        captured = []
        with tempfile.TemporaryDirectory() as tmp:
            video = os.path.join(tmp, "v.mp4")
            open(video, "w").close()
            times = tc_frames.compute_frame_times(100.0, frame_count=4,
                                              frame_interval=0)

            class _Proc:
                returncode = 0
                stderr = ""

            def fake_run(cmd, capture_output=True, text=True):
                captured.append(cmd)
                # Emulate ffmpeg writing the output frame.
                out = cmd[-1]
                open(out, "w").close()
                return _Proc()

            with mock.patch.object(subprocess, "run", fake_run):
                frames = tc_frames.extract_frames(video, times, tmp)

            self.assertEqual(len(frames), 4)
            ss_times = [float(cmd[cmd.index("-ss") + 1]) for cmd in captured]
            self.assertGreaterEqual(min(ss_times), 10.0)
            self.assertLessEqual(max(ss_times), 90.0)

    def test_include_times_returns_timestamps(self):
        with tempfile.TemporaryDirectory() as tmp:
            video = os.path.join(tmp, "v.mp4")
            open(video, "w").close()
            times = tc_frames.compute_frame_times(100.0, frame_count=4,
                                              frame_interval=0)

            class _Proc:
                returncode = 0
                stderr = ""

            def fake_run(cmd, capture_output=True, text=True):
                open(cmd[-1], "w").close()
                return _Proc()

            with mock.patch.object(subprocess, "run", fake_run):
                frames = tc_frames.extract_frames(video, times, tmp,
                                              include_times=True)

            self.assertEqual(len(frames), 4)
            self.assertEqual([moment for _path, moment in frames], list(times))
            self.assertTrue(all(isinstance(path, str)
                                for path, _moment in frames))

    def test_parallel_extraction_returns_all_frames(self):
        captured = []
        with tempfile.TemporaryDirectory() as tmp:
            video = os.path.join(tmp, "v.mp4")
            open(video, "w").close()
            times = tc_frames.compute_frame_times(300.0, frame_count=12,
                                              frame_interval=0)

            class _Proc:
                returncode = 0
                stderr = ""

            def fake_run(cmd, capture_output=True, text=True):
                captured.append(cmd)
                open(cmd[-1], "w").close()
                return _Proc()

            with mock.patch.object(subprocess, "run", fake_run):
                frames = tc_frames.extract_frames(video, times, tmp, workers=4)

            self.assertEqual(len(frames), 12)
            self.assertEqual(len(captured), 12)
            # Frames must come back ordered by index regardless of completion
            # order.
            self.assertEqual(
                frames,
                [os.path.join(tmp, f"frame_{i:03d}.jpg") for i in range(12)],
            )


# --------------------------------------------------------------------------- #
# Video inference batching
# --------------------------------------------------------------------------- #

class TestInferFrames(unittest.TestCase):
    def _write_frames(self, tmp, count):
        paths = []
        for i in range(count):
            path = os.path.join(tmp, f"frame_{i:03d}.jpg")
            Image.new("RGB", (64, 64), (i * 10 % 255, 0, 0)).save(path)
            paths.append(path)
        return paths

    def _yolo_model(self, session):
        return {
            "family": "yolo",
            "size": 224,
            "session": session,
            "input_name": "input",
            "output_name": "output",
            "class_names": ["AI Generated", "Anime"],
            "thresholds": None,
        }

    def test_yolo_runs_batched(self):
        with tempfile.TemporaryDirectory() as tmp:
            paths = self._write_frames(tmp, 5)
            session = mock.MagicMock()
            session.run.return_value = [
                np.array([[1.0, 0.0]], dtype=np.float32) for _ in range(4)
            ]
            cfg = {"yolo_margin": 0.0, "yolo_threshold": 0.5,
                   "yolo_multi": True, "yolo_min_votes": 1, "yolo_share": 0.0,
                   "infer_batch_size": 4}

            results = tc_inference.infer_frames(paths, self._yolo_model(session), cfg)

            # 5 frames in batches of 4 -> two session calls (4 + 1).
            self.assertEqual(session.run.call_count, 2)
            batch_sizes = [
                call.args[1]["input"].shape[0] for call in session.run.call_args_list
            ]
            self.assertEqual(batch_sizes, [4, 1])
            self.assertEqual(results[0][0], "AI Generated")

    def test_yolo_batch_size_one_still_works(self):
        with tempfile.TemporaryDirectory() as tmp:
            paths = self._write_frames(tmp, 3)
            session = mock.MagicMock()
            session.run.return_value = [
                np.array([[0.7, 0.2]], dtype=np.float32) for _ in range(3)
            ]
            cfg = {"yolo_margin": 0.0, "yolo_threshold": 0.5,
                   "yolo_multi": True, "yolo_min_votes": 1, "yolo_share": 0.0,
                   "infer_batch_size": 1}

            results = tc_inference.infer_frames(paths, self._yolo_model(session), cfg)

            self.assertEqual(session.run.call_count, 3)
            self.assertEqual(results, [("AI Generated", results[0][1])])

    def test_unreadable_frames_are_skipped(self):
        with tempfile.TemporaryDirectory() as tmp:
            paths = self._write_frames(tmp, 2)
            paths.insert(1, os.path.join(tmp, "missing.jpg"))
            session = mock.MagicMock()
            session.run.return_value = [
                np.array([[1.0, 0.0]], dtype=np.float32) for _ in range(2)
            ]
            cfg = {"yolo_margin": 0.0, "yolo_threshold": 0.5,
                   "yolo_multi": True, "yolo_min_votes": 1, "yolo_share": 0.0,
                   "infer_batch_size": 8}

            with mock.patch.object(tc_stashlog, "log", mock.MagicMock()):
                results = tc_inference.infer_frames(paths, self._yolo_model(session), cfg)

            self.assertEqual(session.run.call_count, 1)
            self.assertEqual(session.run.call_args.args[1]["input"].shape[0], 2)
            self.assertEqual(results[0][0], "AI Generated")


# --------------------------------------------------------------------------- #
# Config parsing
# --------------------------------------------------------------------------- #

class TestJoyTag(unittest.TestCase):
    def test_load_joytag_tags(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "top_tags.txt")
            with open(path, "w", encoding="utf-8") as f:
                f.write("alpha\nbeta\n\n  gamma  \n")
            self.assertEqual(
                tc_models.load_joytag_tags(path), ["alpha", "beta", "gamma"]
            )

    def test_sigmoid_passthrough_when_already_probabilities(self):
        arr = np.array([0.1, 0.9, 0.5], dtype=np.float32)
        out = tc_postprocess._as_sigmoid_probabilities(arr)
        np.testing.assert_allclose(out, arr)

    def test_sigmoid_applied_to_logits(self):
        arr = np.array([-1.0, 0.0, 1.0], dtype=np.float32)
        out = tc_postprocess._as_sigmoid_probabilities(arr)
        expected = 1.0 / (1.0 + np.exp(-arr))
        np.testing.assert_allclose(out, expected, rtol=1e-5)
        self.assertGreater(float(out.min()), 0.0)
        self.assertLess(float(out.max()), 1.0)

    def test_preprocess_shape_and_normalisation(self):
        img = Image.new("RGB", (100, 50), (255, 255, 255))
        arr = tc_preprocess.joytag_preprocess(img)
        self.assertEqual(arr.shape, (1, 3, 448, 448))
        # A white pixel normalises to (1 - mean) / std for every channel.
        self.assertAlmostEqual(
            float(arr[0, 0, 0, 0]), (1.0 - 0.48145466) / 0.26862954, places=4
        )

    def test_postprocess_keeps_tags_above_threshold(self):
        model = {"tags": ["a", "b", "c"]}
        probs = np.array([0.9, 0.1, 0.5], dtype=np.float32)
        hits = tc_postprocess.joytag_postprocess(probs, model)
        self.assertEqual([name for name, _ in hits], ["a", "c"])
        self.assertAlmostEqual(hits[0][1], 0.9, places=5)
        self.assertEqual(tc_postprocess.joytag_postprocess(probs, model, threshold=0.95), [])

    def test_postprocess_name_fallback(self):
        model = {"tags": ["a"]}
        probs = np.array([0.9, 0.8], dtype=np.float32)
        hits = tc_postprocess.joytag_postprocess(probs, model)
        self.assertEqual([name for name, _ in hits], ["tag_0", "tag_1"])

    def test_registry_loads_joytag(self):
        with tempfile.TemporaryDirectory() as tmp:
            with open(os.path.join(tmp, "joytag.onnx"), "w") as f:
                f.write("x")
            with open(os.path.join(tmp, "joytag-top_tags.txt"), "w",
                      encoding="utf-8") as f:
                f.write("alpha\nbeta\n")

            fake = _fake_onnxruntime(_FakeSession)
            tc_models._SESSION_CACHE.clear()
            self.addCleanup(tc_models._SESSION_CACHE.clear)
            with mock.patch.object(tc_config, "MODEL_DIR", tmp), \
                    mock.patch.dict(sys.modules, {"onnxruntime": fake}):
                model = tc_models.get_model("joytag")
                self.assertEqual(model["family"], "joytag")
                self.assertEqual(model["size"], tc_config.JOYTAG_SIZE)
                self.assertEqual(model["tags"], ["alpha", "beta"])

    def test_registry_loads_wd_v3(self):
        with tempfile.TemporaryDirectory() as tmp:
            with open(os.path.join(tmp, "wd-swinv2-tagger-v3.onnx"), "w") as f:
                f.write("x")
            with open(os.path.join(tmp, "wd-swinv2-tagger-v3.csv"), "w",
                      encoding="utf-8") as f:
                f.write("tag_id,name,category,count\n")
                f.write("1,v3_general,0,1\n")

            fake = _fake_onnxruntime(_FakeSession)
            tc_models._SESSION_CACHE.clear()
            self.addCleanup(tc_models._SESSION_CACHE.clear)
            with mock.patch.object(tc_config, "MODEL_DIR", tmp), \
                    mock.patch.dict(sys.modules, {"onnxruntime": fake}):
                model = tc_models.get_model("wd-swinv2-tagger-v3")
                self.assertEqual(model["family"], "wd")
                self.assertEqual(model["tags"], ["v3 general"])

    def test_joytag_threshold_default_and_override(self):
        self.assertEqual(
            tc_cli.build_cfg({})["joytag_threshold"],
            tc_config.JOYTAG_THRESHOLD_DEFAULT,
        )
        self.assertAlmostEqual(
            tc_cli.build_cfg({"joytag_threshold": "0.6"})["joytag_threshold"],
            0.6,
        )


class TestYoloDet(unittest.TestCase):
    def test_class_names_from_metadata(self):
        session = _FakeSession("x", names="{0: 'person', 1: 'blowjob'}")
        self.assertEqual(tc_models.load_det_class_names(session), ["person", "blowjob"])

    def test_class_names_fallback(self):
        self.assertEqual(
            tc_models.load_det_class_names(_FakeSession("x")),
            tc_config.YOLO_DET_CLASS_NAMES,
        )

    def test_preprocess_letterboxes_to_square(self):
        img = Image.new("RGB", (1280, 720), (255, 255, 255))
        arr, meta = tc_preprocess.yolo_det_preprocess(img)
        self.assertEqual(arr.shape, (1, 3, 640, 640))
        self.assertEqual(meta["size"], 640)
        self.assertAlmostEqual(meta["scale"], 0.5, places=6)
        self.assertEqual(meta["pad_x"], 0)
        self.assertEqual(meta["pad_y"], 140)
        # Padding is grey (114) and the image content is untouched white.
        self.assertAlmostEqual(float(arr[0, 0, 0, 0]), 114 / 255.0, places=5)
        self.assertAlmostEqual(float(arr[0, 0, 320, 320]), 1.0, places=5)

    def test_nms_suppresses_overlapping_boxes(self):
        boxes = [[0, 0, 10, 10], [1, 1, 11, 11], [100, 100, 110, 110]]
        scores = [0.9, 0.8, 0.7]
        self.assertEqual(tc_postprocess._nms(boxes, scores, 0.45), [0, 2])

    @staticmethod
    def _det_output(entries, num_classes=10, anchors=8400):
        """Build a synthetic ``[1, 4 + num_classes, anchors]`` head output."""
        out = np.zeros((1, 4 + num_classes, anchors), dtype=np.float32)
        for anchor, (box, class_id, conf) in enumerate(entries):
            out[0, :4, anchor] = box
            out[0, 4 + class_id, anchor] = conf
        return out

    def test_postprocess_decodes_a_detection(self):
        model = {"class_names": tc_config.YOLO_DET_CLASS_NAMES}
        out = self._det_output([([320.0, 320.0, 100.0, 100.0], 8, 0.9)])
        hits = tc_postprocess.yolo_det_postprocess(out, model)
        self.assertEqual(len(hits), 1)
        self.assertEqual(hits[0][0], "blowjob")
        self.assertAlmostEqual(hits[0][1], 0.9, places=5)

    def test_postprocess_respects_conf_threshold(self):
        model = {"class_names": tc_config.YOLO_DET_CLASS_NAMES}
        out = self._det_output([([320.0, 320.0, 100.0, 100.0], 8, 0.1)])
        self.assertEqual(tc_postprocess.yolo_det_postprocess(out, model), [])
        self.assertEqual(
            len(tc_postprocess.yolo_det_postprocess(out, model, conf_threshold=0.05)), 1
        )

    def test_postprocess_suppresses_duplicate_boxes(self):
        model = {"class_names": tc_config.YOLO_DET_CLASS_NAMES}
        out = self._det_output([
            ([320.0, 320.0, 100.0, 100.0], 8, 0.9),
            ([322.0, 320.0, 100.0, 100.0], 7, 0.5),
        ])
        self.assertEqual([name for name, _ in tc_postprocess.yolo_det_postprocess(out, model)],
                         ["blowjob"])

    def test_postprocess_accepts_transposed_layout(self):
        model = {"class_names": ["a", "b"]}
        out = np.zeros((8400, 6), dtype=np.float32)
        out[0, :4] = [10.0, 10.0, 20.0, 20.0]
        out[0, 5] = 0.8
        hits = tc_postprocess.yolo_det_postprocess(out, model)
        self.assertEqual(len(hits), 1)
        self.assertEqual(hits[0][0], "b")

    def test_registry_loads_detector(self):
        with tempfile.TemporaryDirectory() as tmp:
            with open(os.path.join(tmp, "yolo11-nsfw.onnx"), "w") as f:
                f.write("x")
            fake = _fake_onnxruntime(
                lambda path, providers=None: _FakeSession(
                    path, providers,
                    input_shape=(1, 3, 640, 640),
                    names="{0: 'person', 9: 'handjob'}",
                    output_size=14,
                )
            )
            tc_models._SESSION_CACHE.clear()
            self.addCleanup(tc_models._SESSION_CACHE.clear)
            with mock.patch.object(tc_config, "MODEL_DIR", tmp), \
                    mock.patch.dict(sys.modules, {"onnxruntime": fake}):
                model = tc_models.get_model("yolo11-nsfw")
        self.assertEqual(model["family"], "yolo-det")
        self.assertEqual(model["size"], tc_config.YOLO_DET_SIZE)
        self.assertEqual(model["class_names"], ["person", "handjob"])

    def test_build_cfg_det_defaults_and_overrides(self):
        defaults = tc_cli.build_cfg({})
        self.assertEqual(defaults["det_conf"], tc_config.YOLO_DET_CONF_DEFAULT)
        self.assertEqual(defaults["det_iou"], tc_config.YOLO_DET_IOU_DEFAULT)
        cfg = tc_cli.build_cfg({"det_conf": "0.4", "det_iou": "0.6"})
        self.assertAlmostEqual(cfg["det_conf"], 0.4)
        self.assertAlmostEqual(cfg["det_iou"], 0.6)


    def test_classify_image_detects_act(self):
        out = self._det_output([((320.0, 320.0, 100.0, 100.0), 8, 0.9)])
        model = {
            "family": "yolo-det",
            "size": tc_config.YOLO_DET_SIZE,
            "session": _DetSession(out),
            "input_name": "input",
            "output_name": "output",
            "class_names": tc_config.YOLO_DET_CLASS_NAMES,
        }
        cfg = {
            "det_conf": tc_config.YOLO_DET_CONF_DEFAULT,
            "det_iou": tc_config.YOLO_DET_IOU_DEFAULT,
        }
        img = Image.new("RGB", (1280, 720), (255, 255, 255))
        tags = tc_inference.classify_image(img, model, cfg)
        self.assertEqual([name for name, _ in tags], ["blowjob"])


class _DetSession:
    """Minimal session stub returning a pre-built detection head."""

    def __init__(self, output):
        self._output = output

    def run(self, output_names, feeds):
        return [self._output]


class TestSexPos(unittest.TestCase):
    def setUp(self):
        self.model = {"class_names": list(tc_config.SEXPOS_CLASS_NAMES)}

    def test_class_names(self):
        self.assertEqual(len(tc_config.SEXPOS_CLASS_NAMES), 8)
        self.assertEqual(tc_config.SEXPOS_CLASS_NAMES[0], "blowjob")

    def test_preprocess_shape_and_imagenet_normalisation(self):
        img = Image.new("RGB", (400, 200), (255, 255, 255))
        arr = tc_preprocess.sexpos_preprocess(img)
        self.assertEqual(arr.shape, (1, 3, 224, 224))
        self.assertAlmostEqual(
            float(arr[0, 0, 0, 0]), (1.0 - 0.485) / 0.229, places=4
        )

    def test_postprocess_picks_top_class(self):
        logits = np.zeros(8, dtype=np.float32)
        logits[7] = 5.0
        hits = tc_postprocess.sexpos_postprocess(logits, self.model)
        self.assertEqual([name for name, _ in hits], ["solo"])
        self.assertGreater(hits[0][1], 0.9)

    def test_postprocess_respects_threshold(self):
        logits = np.zeros(8, dtype=np.float32)
        self.assertEqual(
            tc_postprocess.sexpos_postprocess(logits, self.model, threshold=0.5), []
        )

    def test_postprocess_margin(self):
        logits = np.array([4.0, 3.5, 0, 0, 0, 0, 0, 0], dtype=np.float32)
        self.assertEqual(
            [name for name, _ in tc_postprocess.sexpos_postprocess(logits, self.model)],
            ["blowjob"],
        )
        self.assertEqual(
            tc_postprocess.sexpos_postprocess(logits, self.model, margin=0.5), []
        )

    def test_postprocess_name_fallback(self):
        model = {"class_names": ["blowjob"]}
        logits = np.zeros(8, dtype=np.float32)
        logits[7] = 5.0
        self.assertEqual(
            [name for name, _ in tc_postprocess.sexpos_postprocess(logits, model)],
            ["class_7"],
        )

    def test_registry_loads_sexpos(self):
        with tempfile.TemporaryDirectory() as tmp:
            with open(os.path.join(tmp, "sex-position.onnx"), "w") as f:
                f.write("x")
            fake = _fake_onnxruntime(lambda path, providers=None: _FakeSession(
                path, providers, input_shape=(1, 3, 224, 224), output_size=8))
            tc_models._SESSION_CACHE.clear()
            self.addCleanup(tc_models._SESSION_CACHE.clear)
            with mock.patch.object(tc_config, "MODEL_DIR", tmp), \
                    mock.patch.dict(sys.modules, {"onnxruntime": fake}):
                model = tc_models.get_model("sex-position")
        self.assertEqual(model["family"], "sexpos")
        self.assertEqual(model["size"], tc_config.SEXPOS_SIZE)
        self.assertEqual(model["class_names"], tc_config.SEXPOS_CLASS_NAMES)

    def test_classify_image_uses_sexpos(self):
        out = np.zeros((1, 8), dtype=np.float32)
        out[0, 7] = 5.0
        model = {
            "name": "sex-position",
            "family": "sexpos",
            "size": tc_config.SEXPOS_SIZE,
            "session": _DetSession(out),
            "input_name": "input",
            "output_name": "output",
            "class_names": tc_config.SEXPOS_CLASS_NAMES,
        }
        img = Image.new("RGB", (320, 240), (128, 128, 128))
        tags = tc_inference.classify_image(img, model, tc_cli.build_cfg({}))
        self.assertEqual([name for name, _ in tags], ["solo"])


class TestMultiModel(unittest.TestCase):
    def test_parse_single_name(self):
        self.assertEqual(tc_cli.parse_model_names("joytag", "d"), ["joytag"])

    def test_parse_comma_semicolon_and_whitespace(self):
        self.assertEqual(
            tc_cli.parse_model_names("a, b;c d", "x"), ["a", "b", "c", "d"]
        )

    def test_parse_dedupes_and_keeps_order(self):
        self.assertEqual(tc_cli.parse_model_names("a,b,a", "x"), ["a", "b"])

    def test_parse_empty_uses_default(self):
        self.assertEqual(tc_cli.parse_model_names("", "img"), ["img"])
        self.assertEqual(tc_cli.parse_model_names(None, "vid"), ["vid"])
        self.assertEqual(tc_cli.parse_model_names([], "d"), ["d"])

    def test_parse_list_value(self):
        self.assertEqual(tc_cli.parse_model_names(["a", "b", "a"], "d"), ["a", "b"])

    def test_merge_tag_results_keeps_best_score(self):
        merged = tc_inference.merge_tag_results([[("a", 0.4)], [("b", 0.9), ("a", 0.7)]])
        self.assertEqual(merged, [("b", 0.9), ("a", 0.7)])

    def test_classify_with_models_runs_every_model(self):
        img = Image.new("RGB", (8, 8), (0, 0, 0))
        models = [{"name": "m1"}, {"name": "m2"}]
        calls = []

        def fake(image, model, cfg):
            calls.append(model["name"])
            if model["name"] == "m1":
                return [("a", 0.4)]
            return [("b", 0.9), ("a", 0.7)]

        with mock.patch.object(tc_inference, "classify_image", side_effect=fake):
            tags = tc_inference.classify_with_models(img, models, {})
        self.assertEqual(calls, ["m1", "m2"])
        self.assertEqual(tags, [("b", 0.9), ("a", 0.7)])

    def test_classify_with_models_single_returns_unchanged(self):
        img = Image.new("RGB", (8, 8), (0, 0, 0))
        with mock.patch.object(tc_inference, "classify_image", return_value=[("x", 0.1), ("y", 0.9)]
        ):
            tags = tc_inference.classify_with_models(img, {"name": "m"}, {})
        self.assertEqual(tags, [("x", 0.1), ("y", 0.9)])

    def test_classify_with_models_skips_failing_model(self):
        img = Image.new("RGB", (8, 8), (0, 0, 0))
        models = [{"name": "bad"}, {"name": "good"}]

        def fake(image, model, cfg):
            if model["name"] == "bad":
                raise RuntimeError("boom")
            return [("ok", 0.8)]

        with mock.patch.object(tc_inference, "classify_image", side_effect=fake), \
                mock.patch.object(tc_stashlog, "log", mock.MagicMock()):
            tags = tc_inference.classify_with_models(img, models, {})
        self.assertEqual(tags, [("ok", 0.8)])

    def test_infer_frames_with_model_list_merges(self):
        with tempfile.TemporaryDirectory() as tmp:
            paths = []
            for i in range(3):
                path = os.path.join(tmp, f"frame_{i:03d}.jpg")
                Image.new("RGB", (64, 64), (10, 20, 30)).save(path)
                paths.append(path)

            models = [
                {"name": "sex-position", "family": "sexpos"},
                {"name": "joytag", "family": "joytag"},
            ]

            def fake(image, model, cfg):
                if model["name"] == "sex-position":
                    return [("solo", 0.8)]
                return [("1girl", 0.7), ("solo", 0.6)]

            with mock.patch.object(tc_inference, "classify_image", side_effect=fake):
                tags = tc_inference.infer_frames(paths, models, tc_cli.build_cfg({}))
        merged = dict(tags)
        self.assertAlmostEqual(merged["solo"], 0.8, places=5)
        self.assertAlmostEqual(merged["1girl"], 0.7, places=5)


class TestDebugLog(unittest.TestCase):
    def tearDown(self):
        tc_debug.debug_start(None, {})

    def test_resolve_debug_path_disabled(self):
        for value in (None, "", "false", "0", "no", "off", False):
            self.assertIsNone(tc_debug.resolve_debug_path(value))

    def test_resolve_debug_path_truthy_uses_default_file(self):
        expected = os.path.join(tc_config.PLUGIN_DIR, tc_config.DEBUG_FILENAME)
        for value in (True, "true", "1", "yes", "on"):
            self.assertEqual(tc_debug.resolve_debug_path(value), expected)

    def test_resolve_debug_path_explicit(self):
        self.assertEqual(tc_debug.resolve_debug_path("/tmp/x.json"), "/tmp/x.json")
        self.assertEqual(
            tc_debug.resolve_debug_path(" out/report.json "), "out/report.json"
        )

    def test_candidate_scores_vectors(self):
        model = {"family": "yolo", "class_names": ["a", "b", "c"]}
        cfg = {"debug_floor": 0.1, "debug_top": 2}
        scores = np.array([0.05, 0.9, 0.3], dtype=np.float32)

        hits = tc_inference.candidate_scores("yolo", scores, model, cfg)
        self.assertEqual([name for name, _score in hits], ["b", "c"])
        self.assertAlmostEqual(hits[0][1], 0.9, places=5)
        self.assertAlmostEqual(hits[1][1], 0.3, places=5)

        # The floor can be raised for a single call.
        raised = tc_inference.candidate_scores("yolo", scores, model, cfg, floor=0.5)
        self.assertEqual([name for name, _score in raised], ["b"])

    def test_candidate_scores_name_fallback(self):
        model = {"family": "yolo"}
        cfg = {"debug_floor": 0.0, "debug_top": 10}
        scores = np.array([0.2, 0.4], dtype=np.float32)

        hits = tc_inference.candidate_scores("yolo", scores, model, cfg)
        self.assertEqual([name for name, _score in hits], ["class_1", "class_0"])
        self.assertAlmostEqual(hits[0][1], 0.4, places=5)
        self.assertAlmostEqual(hits[1][1], 0.2, places=5)

    def test_candidate_scores_empty(self):
        self.assertEqual(
            tc_inference.candidate_scores("yolo", np.array([], dtype=np.float32), {}, {}),
            [],
        )

    def test_candidate_scores_detector_uses_the_floor(self):
        calls = {}

        def fake_postprocess(scores, model, conf_threshold=None,
                             iou_threshold=None):
            calls["conf"] = conf_threshold
            calls["iou"] = iou_threshold
            return [("person", 0.12), ("penis", 0.08)]

        model = {"family": "yolo-det", "class_names": ["person", "penis"]}
        with mock.patch.object(tc_postprocess, "yolo_det_postprocess", side_effect=fake_postprocess
        ):
            hits = tc_inference.candidate_scores(
                "yolo-det", np.zeros((1, 14, 10), dtype=np.float32), model,
                {"debug_floor": 0.05, "debug_top": 1, "det_iou": 0.5},
            )

        self.assertEqual(calls, {"conf": 0.05, "iou": 0.5})
        self.assertEqual(hits, [("person", 0.12)])

    def test_aggregate_candidates_keeps_max_per_tag(self):
        merged = tc_debug.aggregate_candidates([
            [("a", 0.4), ("b", 0.9)],
            [("a", 0.7), ("c", 0.2)],
        ])
        self.assertEqual(merged, [("b", 0.9), ("a", 0.7), ("c", 0.2)])
        self.assertEqual(tc_debug.aggregate_candidates([]), [])

    def test_finish_debug_entry_marks_accepted_candidates(self):
        entry = tc_debug._debug_entry(
            {"name": "m", "family": "yolo"}, {"yolo_threshold": 0.5}
        )
        entry["per_frame"] = [[("a", 0.9), ("b", 0.3)]]
        tc_debug._finish_debug_entry(entry, [("a", 0.9)])

        self.assertEqual(entry["tags"], ["a"])
        self.assertEqual(
            entry["aggregate"][0],
            {"tag": "a", "score": 0.9, "accepted": True},
        )
        self.assertEqual(entry["aggregate"][1]["tag"], "b")
        self.assertFalse(entry["aggregate"][1]["accepted"])

    def test_debug_report_is_written(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = os.path.join(tmp, "sub", "report.json")
            cfg = {"debug_log": path, "debug_floor": 0.05, "hf_token": "secret"}
            self.assertTrue(
                tc_debug.debug_start(tc_debug.resolve_debug_path(cfg["debug_log"]), cfg)
            )
            tc_debug.debug_add_item(
                {"id": 1, "models": [], "applied_tags": ["AI: x"]}
            )
            with open(path, encoding="utf-8") as handle:
                data = json.load(handle)

        self.assertEqual(data["plugin"], "TagAI")
        self.assertEqual(data["format"], 1)
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0]["id"], 1)
        self.assertEqual(data["items"][0]["applied_tags"], ["AI: x"])
        self.assertNotIn("hf_token", data["settings"])

    def test_debug_add_item_without_path_is_noop(self):
        tc_debug.debug_start(None, {})
        tc_debug.debug_add_item({"id": 1})
        self.assertEqual(tc_debug._DEBUG["items"], [])

    def test_infer_frames_collects_debug_records(self):
        with tempfile.TemporaryDirectory() as tmp:
            paths = []
            for i in range(2):
                path = os.path.join(tmp, f"frame_{i}.jpg")
                Image.new("RGB", (64, 64), (1, 2, 3)).save(path)
                paths.append(path)

            session = mock.MagicMock()
            session.run.return_value = [
                np.array([[0.8, 0.1], [0.8, 0.1]], dtype=np.float32)
            ]
            model = {
                "name": "yolo26n-cls-porn", "family": "yolo", "size": 224,
                "session": session, "input_name": "input",
                "output_name": "output",
                "class_names": ["porn", "safe"], "thresholds": None,
            }
            cfg = tc_cli.build_cfg({"debug_log": "report.json", "yolo_margin": "0.0"})
            debug = {}

            tags = tc_inference.infer_frames(paths, model, cfg, debug=debug)
            entry = debug["yolo26n-cls-porn"]

        self.assertEqual(entry["family"], "yolo")
        self.assertEqual(len(entry["per_frame"]), 2)
        self.assertEqual(entry["per_frame"][0][0][0], "porn")
        self.assertEqual(entry["tags"], [name for name, _score in tags])
        self.assertEqual(entry["tags"], ["porn"])
        self.assertTrue(entry["aggregate"][0]["accepted"])

    def test_classify_with_models_collects_debug_records(self):
        img = Image.new("RGB", (8, 8), (0, 0, 0))
        models = [{"name": "m1", "family": "yolo", "class_names": ["a", "b"]}]
        cfg = {"debug_floor": 0.0, "debug_top": 5}
        debug = []

        with mock.patch.object(tc_inference, "run_inference",
            return_value=("yolo", np.array([0.9, 0.2], dtype=np.float32)),
        ), mock.patch.object(tc_inference, "postprocess_scores", return_value=[("a", 0.9)]
        ):
            tags = tc_inference.classify_with_models(img, models, cfg, debug=debug)

        self.assertEqual(tags, [("a", 0.9)])
        self.assertEqual(len(debug), 1)
        self.assertEqual(debug[0]["name"], "m1")
        self.assertEqual(debug[0]["tags"], ["a"])
        per_frame = debug[0]["per_frame"]
        self.assertEqual([name for name, _score in per_frame[0]], ["a", "b"])
        self.assertAlmostEqual(per_frame[0][0][1], 0.9, places=5)


class TestSceneMarkers(unittest.TestCase):
    def test_parse_marker_mode(self):
        for value in ("", None, "off", "OFF", "false", "0", "no", "none",
                      "disabled"):
            self.assertEqual(tc_markers.parse_marker_mode(value), "off")
        for value in ("ranges", "Range", "runs"):
            self.assertEqual(tc_markers.parse_marker_mode(value), "ranges")
        for value in ("best", "TOP", "peak"):
            self.assertEqual(tc_markers.parse_marker_mode(value), "best")
        with mock.patch.object(tc_stashlog, "log", mock.MagicMock()):
            self.assertEqual(tc_markers.parse_marker_mode("nonsense"), "off")

    def test_frame_spacing(self):
        self.assertEqual(tc_markers._frame_spacing([]), 0.0)
        self.assertEqual(tc_markers._frame_spacing([5.0]), 0.0)
        self.assertAlmostEqual(tc_markers._frame_spacing([0.0, 10.0, 20.0]), 10.0)
        # Median of the gaps, without interpolation.
        self.assertAlmostEqual(tc_markers._frame_spacing([0.0, 1.0, 5.0, 6.0]), 1.0)

    def test_combine_hits_merges_models_and_keeps_the_best(self):
        hits_out = {
            "m1": [[("a", 0.4)], []],
            "m2": [[("a", 0.9), ("b", 0.6)], [("c", 0.3)]],
        }
        combined = tc_markers.combine_hits(hits_out, 3)
        self.assertEqual(len(combined), 3)
        self.assertAlmostEqual(combined[0]["a"], 0.9)
        self.assertAlmostEqual(combined[0]["b"], 0.6)
        self.assertAlmostEqual(combined[1]["c"], 0.3)
        self.assertEqual(combined[2], {})
        # Rows past the frame count are ignored.
        self.assertEqual(len(tc_markers.combine_hits(hits_out, 1)), 1)
        self.assertEqual(tc_markers.combine_hits(None, 2), [{}, {}])

    def test_marker_span_pads_the_ends(self):
        span = tc_markers._marker_span("a", 10.0, 12.0, 0.8, ["a", "b"],
                                  {"b": 0.5}, 2.0, None)
        self.assertEqual(span, {"tag": "a", "start": 8.0, "end": 14.0,
                                "score": 0.8, "tags": ["b"]})

    def test_marker_span_minimum_length_and_clamping(self):
        span = tc_markers._marker_span("a", 10.0, 10.0, 0.9, ["a"], {}, 0.0, None)
        self.assertAlmostEqual(span["end"] - span["start"],
                               tc_config.MARKER_MIN_LENGTH)

        # Clamped so the marker never runs past the end of the video.
        span = tc_markers._marker_span("a", 9.5, 9.6, 0.9, ["a"], {}, 0.0, 10.0)
        self.assertEqual(span["start"], 9.0)
        self.assertEqual(span["end"], 10.0)

        # Never starts before the beginning either.
        span = tc_markers._marker_span("a", 1.0, 1.0, 0.9, ["a"], {}, 30.0, 100.0)
        self.assertEqual(span["start"], 0.0)

    def test_build_markers_ranges_merges_adjacent_frames(self):
        markers = tc_markers.build_markers(
            [("a", 0.9)],
            [{"a": 0.6}, {"a": 0.7}, {}, {"a": 0.9}, {"a": 0.5}],
            [0.0, 10.0, 20.0, 30.0, 40.0],
            100.0,
            pad=0.0,
        )
        self.assertEqual(
            [(m["tag"], m["start"], m["end"], m["score"]) for m in markers],
            [("a", 0.0, 10.0, 0.7), ("a", 30.0, 40.0, 0.9)],
        )

    def test_build_markers_merges_when_padded_spans_would_overlap(self):
        tags = [("a", 0.9)]
        hits = [{"a": 0.9}, {}, {"a": 0.8}]
        times = [0.0, 10.0, 20.0]

        merged = tc_markers.build_markers(tags, hits, times, 100.0, pad=10.0)
        self.assertEqual(len(merged), 1)
        self.assertEqual((merged[0]["start"], merged[0]["end"]), (0.0, 30.0))

        split = tc_markers.build_markers(tags, hits, times, 100.0, pad=5.0)
        self.assertEqual(len(split), 2)

    def test_build_markers_best_mode_uses_the_peak_frame(self):
        markers = tc_markers.build_markers(
            [("a", 0.9)],
            [{"a": 0.7}, {"a": 0.9}, {"a": 0.6}],
            [0.0, 10.0, 20.0],
            100.0,
            mode="best",
            pad=0.0,
        )
        self.assertEqual(len(markers), 1)
        self.assertEqual(markers[0]["start"], 10.0)
        self.assertEqual(markers[0]["end"], 11.0)
        self.assertAlmostEqual(markers[0]["score"], 0.9)

    def test_build_markers_ignores_unapplied_tags_and_collects_co_tags(self):
        markers = tc_markers.build_markers(
            [("a", 0.9), ("b", 0.6)],
            [{"a": 0.9, "b": 0.6, "c": 0.99}],
            [5.0],
            100.0,
            pad=0.0,
        )
        self.assertEqual([m["tag"] for m in markers], ["a", "b"])
        # "c" was never applied to the scene, so it is not a co-tag either.
        self.assertEqual(markers[0]["tags"], ["b"])
        self.assertEqual(markers[1]["tags"], ["a"])

    def test_build_markers_without_hits(self):
        self.assertEqual(tc_markers.build_markers([], [], [], 10.0), [])
        self.assertEqual(
            tc_markers.build_markers([("a", 0.9)], [], [1.0], 10.0), [])

    def test_get_scene_markers_parses_the_response(self):
        payload = {"data": {"findScene": {"scene_markers": [
            {"seconds": 12.5, "primary_tag": {"id": "7"}},
            {"seconds": 0, "primary_tag": None},
        ]}}}
        with mock.patch.object(tc_stash_client, "gql", return_value=payload):
            markers = tc_markers.get_scene_markers("3")
        self.assertEqual(markers, [
            {"primary_tag_id": "7", "seconds": 12.5},
            {"primary_tag_id": None, "seconds": 0.0},
        ])

    def test_create_scene_marker_payload(self):
        calls = []

        def fake_gql(query, variables=None):
            calls.append(variables)
            return {"data": {"sceneMarkerCreate": {"id": "11"}}}

        with mock.patch.object(tc_stash_client, "gql", fake_gql):
            ok = tc_markers.create_scene_marker(
                "2", "5", 10.1234, 20.5678, "t", ["6"])

        self.assertTrue(ok)
        self.assertEqual(calls[0]["input"], {
            "scene_id": "2", "primary_tag_id": "5", "seconds": 10.123,
            "end_seconds": 20.568, "title": "t", "tag_ids": ["6"],
        })

        # Without co-tags the key is omitted and a failed create returns False.
        with mock.patch.object(tc_stash_client, "gql",
                               return_value={"data": {}}) as fake:
            self.assertFalse(
                tc_markers.create_scene_marker("2", "5", 0.0, 1.0, "t"))
        self.assertNotIn("tag_ids", fake.call_args.args[1]["input"])

    def test_create_scene_markers_off_by_default(self):
        with mock.patch.object(tc_stash_client, "gql", mock.MagicMock()) as fake:
            created = tc_markers.create_scene_markers(
                {"id": "1"}, [("a", 0.9)], [{"a": 0.9}], [10.0], 100.0,
                {"markers": "off"}, "AI: ")
        self.assertEqual(created, [])
        fake.assert_not_called()

    def test_create_scene_markers_creates_and_dedupes(self):
        created_calls = []

        def fake_create(scene_id, tag_id, start, end, title, tag_ids=None):
            created_calls.append((scene_id, tag_id, start, end, title, tag_ids))
            return True

        cfg = {"markers": "ranges", "marker_pad": 0.0, "marker_max": 50}
        scene = {"id": "9"}
        with mock.patch.object(tc_stash_client, "ensure_tag",
                               side_effect=lambda name: "id-" + name), \
                mock.patch.object(tc_markers, "get_scene_markers",
                                  return_value=[]), \
                mock.patch.object(tc_markers, "create_scene_marker", fake_create):
            created = tc_markers.create_scene_markers(
                scene, [("a", 0.9)], [{"a": 0.9}, {"a": 0.8}], [0.0, 10.0],
                100.0, cfg, "AI: ")

        self.assertEqual(len(created), 1)
        self.assertEqual(created[0]["start"], 0.0)
        self.assertEqual(created_calls,
                         [("9", "id-AI: a", 0.0, 10.0, "a", [])])

        # A re-run sees the marker that already exists and skips it.
        with mock.patch.object(tc_stash_client, "ensure_tag",
                               side_effect=lambda name: "id-" + name), \
                mock.patch.object(tc_markers, "get_scene_markers",
                                  return_value=[{"primary_tag_id": "id-AI: a",
                                                 "seconds": 0.5}]), \
                mock.patch.object(tc_markers, "create_scene_marker", fake_create):
            created = tc_markers.create_scene_markers(
                scene, [("a", 0.9)], [{"a": 0.9}], [0.0], 100.0, cfg, "AI: ")
        self.assertEqual(created, [])

    def test_create_scene_markers_honours_marker_max(self):
        created = []

        def fake_create(scene_id, tag_id, start, end, title, tag_ids=None):
            created.append(title)
            return True

        cfg = {"markers": "best", "marker_pad": 0.0, "marker_max": 1}
        with mock.patch.object(tc_stash_client, "ensure_tag",
                               side_effect=lambda name: "id-" + name), \
                mock.patch.object(tc_markers, "get_scene_markers",
                                  return_value=[]), \
                mock.patch.object(tc_markers, "create_scene_marker", fake_create), \
                mock.patch.object(tc_stashlog, "log", mock.MagicMock()):
            spans = tc_markers.create_scene_markers(
                {"id": "4"}, [("a", 0.9), ("b", 0.8)],
                [{"a": 0.9}, {"b": 0.8}], [0.0, 10.0], 100.0, cfg, "AI: ")

        self.assertEqual(len(spans), 1)
        self.assertEqual(created, ["a"])

    def test_create_scene_markers_default_pad_is_the_frame_spacing(self):
        created = []

        def fake_create(scene_id, tag_id, start, end, title, tag_ids=None):
            created.append((start, end))
            return True

        cfg = {"markers": "ranges", "marker_pad": None, "marker_max": 10}
        with mock.patch.object(tc_stash_client, "ensure_tag",
                               side_effect=lambda name: "id-" + name), \
                mock.patch.object(tc_markers, "get_scene_markers",
                                  return_value=[]), \
                mock.patch.object(tc_markers, "create_scene_marker", fake_create):
            spans = tc_markers.create_scene_markers(
                {"id": "5"}, [("a", 0.9)], [{"a": 0.9}, {}, {"a": 0.8}],
                [0.0, 10.0, 20.0], 100.0, cfg, "AI: ")

        self.assertEqual(len(spans), 1)
        self.assertEqual(created, [(0.0, 30.0)])


    def test_parse_tag_filter(self):
        self.assertEqual(tc_tags.parse_tag_filter(""), [])
        self.assertEqual(tc_tags.parse_tag_filter(None), [])
        self.assertEqual(tc_tags.parse_tag_filter("a, b ; c"), ["a", "b", "c"])
        # The prefix is optional and matching is case-insensitive.
        self.assertEqual(
            tc_tags.parse_tag_filter("AI: Cowgirl Position, sex from behind"),
            ["cowgirl position", "sex from behind"],
        )
        # Whitespace never separates a multi-word tag name.
        self.assertEqual(
            tc_tags.parse_tag_filter("cowgirl position"), ["cowgirl position"]
        )
        self.assertEqual(tc_tags.parse_tag_filter(["B", "a", "b"]), ["a", "b"])

    def test_filter_tags_filters_scene_tags(self):
        tags = [("a", 0.9), ("b", 0.8), ("c", 0.7)]
        self.assertEqual(tc_tags.filter_tags(tags), tags)
        self.assertEqual(
            tc_tags.filter_tags(tags, ["a", "b"]), [("a", 0.9), ("b", 0.8)]
        )
        self.assertEqual(
            tc_tags.filter_tags(tags, None, ["b"]), [("a", 0.9), ("c", 0.7)]
        )
        self.assertEqual(tc_tags.filter_tags(tags, ["a", "b"], ["a"]), [("b", 0.8)])

    def test_filter_marker_tags(self):
        tags = [("a", 0.9), ("b", 0.8), ("c", 0.7)]

        self.assertEqual(tc_tags.filter_marker_tags(tags), tags)
        self.assertEqual(
            tc_tags.filter_marker_tags(tags, None, ["b"]),
            [("a", 0.9), ("c", 0.7)],
        )
        self.assertEqual(
            tc_tags.filter_marker_tags(tags, ["a", "b"]),
            [("a", 0.9), ("b", 0.8)],
        )
        # The blacklist wins over the whitelist.
        self.assertEqual(
            tc_tags.filter_marker_tags(tags, ["a", "b"], ["a"]), [("b", 0.8)]
        )
        # Matching is case-insensitive.
        self.assertEqual(
            tc_tags.filter_marker_tags(
                [("Cowgirl Position", 0.9)], None, ["cowgirl position"]
            ),
            [],
        )

    def test_create_scene_markers_blacklist_skips_the_tag(self):
        created_calls = []

        def fake_create(scene_id, tag_id, start, end, title, tag_ids=None):
            created_calls.append((scene_id, tag_id, start, end, title, tag_ids))
            return True

        cfg = {
            "markers": "ranges", "marker_pad": 0.0, "marker_max": 50,
            "marker_whitelist": [], "marker_blacklist": ["noise"],
        }
        with mock.patch.object(tc_stash_client, "ensure_tag",
                               side_effect=lambda name: "id-" + name), \
                mock.patch.object(tc_markers, "get_scene_markers",
                                  return_value=[]), \
                mock.patch.object(tc_markers, "create_scene_marker",
                                  side_effect=fake_create):
            created = tc_markers.create_scene_markers(
                {"id": "7"}, [("a", 0.9), ("noise", 0.95)],
                [{"a": 0.9, "noise": 0.95}], [0.0], 100.0, cfg, "AI: ",
            )

        self.assertEqual(len(created), 1)
        self.assertEqual(created[0]["tag"], "a")
        # "noise" creates no marker and is not attached as a co-tag either.
        self.assertEqual(
            created_calls, [("7", "id-AI: a", 0.0, 1.0, "a", [])]
        )

    def test_create_scene_markers_whitelist_restricts_the_tags(self):
        created_calls = []

        def fake_create(scene_id, tag_id, start, end, title, tag_ids=None):
            created_calls.append((scene_id, tag_id, start, end, title, tag_ids))
            return True

        cfg = {
            "markers": "ranges", "marker_pad": 0.0, "marker_max": 50,
            "marker_whitelist": ["a"], "marker_blacklist": [],
        }
        with mock.patch.object(tc_stash_client, "ensure_tag",
                               side_effect=lambda name: "id-" + name), \
                mock.patch.object(tc_markers, "get_scene_markers",
                                  return_value=[]), \
                mock.patch.object(tc_markers, "create_scene_marker",
                                  side_effect=fake_create):
            created = tc_markers.create_scene_markers(
                {"id": "8"}, [("a", 0.9), ("b", 0.8)],
                [{"a": 0.9, "b": 0.8}], [0.0], 100.0, cfg, "AI: ",
            )

        self.assertEqual([marker["tag"] for marker in created], ["a"])
        # "b" is not attached to the "a" marker either.
        self.assertEqual(created_calls, [("8", "id-AI: a", 0.0, 1.0, "a", [])])

    def test_create_scene_markers_whitelist_can_leave_nothing(self):
        cfg = {
            "markers": "ranges", "marker_pad": 0.0, "marker_max": 50,
            "marker_whitelist": ["z"], "marker_blacklist": [],
        }
        with mock.patch.object(tc_stash_client, "gql") as gql:
            created = tc_markers.create_scene_markers(
                {"id": "8"}, [("a", 0.9)], [{"a": 0.9}], [0.0], 100.0,
                cfg, "AI: ",
            )

        self.assertEqual(created, [])
        gql.assert_not_called()


    def test_build_markers_merges_hits_within_the_gap(self):
        tags = [("a", 0.9)]
        hits = [{"a": 0.9}, {}, {"a": 0.8}]
        times = [0.0, 10.0, 30.0]

        apart = tc_markers.build_markers(tags, hits, times, 100.0, pad=0.0)
        self.assertEqual(len(apart), 2)
        self.assertEqual(
            [(marker["start"], marker["end"]) for marker in apart],
            [(0.0, 1.0), (30.0, 31.0)],
        )

        merged = tc_markers.build_markers(tags, hits, times, 100.0, pad=0.0, gap=60.0)
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["start"], 0.0)
        self.assertEqual(merged[0]["end"], 30.0)
        self.assertAlmostEqual(merged[0]["score"], 0.9, places=5)

    def test_build_markers_gap_never_merges_different_tags(self):
        markers = tc_markers.build_markers(
            [("a", 0.9), ("b", 0.9)], [{"a": 0.9}, {"b": 0.9}], [0.0, 30.0],
            100.0, pad=0.0, gap=60.0,
        )
        self.assertEqual([marker["tag"] for marker in markers], ["a", "b"])
        self.assertEqual(len(markers), 2)


class TestFrameHits(unittest.TestCase):
    def test_failed_batch_pads_the_rows(self):
        with tempfile.TemporaryDirectory() as tmp:
            paths = []
            for i in range(2):
                path = os.path.join(tmp, f"frame_{i}.jpg")
                Image.new("RGB", (64, 64), (1, 2, 3)).save(path)
                paths.append(path)

            session = mock.MagicMock()
            session.run.side_effect = [
                RuntimeError("boom"),
                [np.array([[0.9, 0.1]], dtype=np.float32)],
            ]
            model = {
                "name": "cls", "family": "yolo", "size": 224,
                "session": session, "input_name": "input",
                "output_name": "output",
                "class_names": ["porn", "safe"], "thresholds": None,
            }
            cfg = tc_cli.build_cfg({"yolo_margin": "0.0",
                                   "infer_batch_size": "1"})
            hits = {}
            with mock.patch.object(tc_stashlog, "log", mock.MagicMock()):
                tags = tc_inference.infer_frames(paths, model, cfg, hits_out=hits)

        self.assertEqual(len(hits["cls"]), 2)
        self.assertEqual(hits["cls"][0], [])
        self.assertEqual(hits["cls"][1][0][0], "porn")
        self.assertIn("porn", [name for name, _score in tags])

    def test_failed_frame_keeps_the_rows_aligned(self):
        with tempfile.TemporaryDirectory() as tmp:
            paths = []
            for i in range(3):
                path = os.path.join(tmp, f"frame_{i}.jpg")
                Image.new("RGB", (64, 64), (1, 2, 3)).save(path)
                paths.append(path)

            calls = []

            def fake(image, model, cfg):
                calls.append(1)
                if len(calls) == 2:
                    raise RuntimeError("boom")
                return [("solo", 0.9)]

            hits = {}
            with mock.patch.object(tc_inference, "classify_image", side_effect=fake), \
                    mock.patch.object(tc_stashlog, "log", mock.MagicMock()):
                tags = tc_inference.infer_frames(
                    paths, {"name": "m", "family": "sexpos"},
                    tc_cli.build_cfg({}), hits_out=hits)

        self.assertEqual([len(row) for row in hits["m"]], [1, 0, 1])
        self.assertEqual([name for name, _score in tags], ["solo"])
        self.assertAlmostEqual(tags[0][1], 0.9, places=5)

    def test_hits_out_is_optional(self):
        with mock.patch.object(tc_inference, "classify_image",
                               return_value=[("solo", 0.9)]):
            tags = tc_inference.infer_frames(
                ["/no/such/frame.jpg"], {"name": "m", "family": "sexpos"},
                tc_cli.build_cfg({}))

        self.assertEqual(tags, [])


class TestBuildCfg(unittest.TestCase):
    def test_defaults(self):
        cfg = tc_cli.build_cfg({})
        self.assertEqual(cfg["frame_count"], tc_config.FRAME_COUNT_DEFAULT)
        self.assertEqual(
            cfg["sexpos_threshold"], tc_config.SEXPOS_THRESHOLD_DEFAULT
        )
        self.assertEqual(cfg["sexpos_margin"], tc_config.SEXPOS_MARGIN_DEFAULT)
        self.assertEqual(cfg["det_conf"], tc_config.YOLO_DET_CONF_DEFAULT)
        self.assertEqual(cfg["det_iou"], tc_config.YOLO_DET_IOU_DEFAULT)
        self.assertEqual(cfg["frame_interval"], tc_config.FRAME_INTERVAL_DEFAULT)
        self.assertEqual(cfg["max_frames"], tc_config.MAX_FRAMES_DEFAULT)
        self.assertEqual(cfg["frame_workers"], tc_config.FRAME_WORKERS_DEFAULT)
        self.assertEqual(cfg["infer_batch_size"], tc_config.INFER_BATCH_SIZE_DEFAULT)
        self.assertEqual(cfg["ffmpeg_path"], "ffmpeg")
        self.assertFalse(cfg["tag_characters"])
        self.assertTrue(cfg["yolo_multi"])
        self.assertEqual(cfg["yolo_min_votes"], tc_config.YOLO_MIN_VOTES_DEFAULT)
        self.assertEqual(cfg["yolo_share"], tc_config.YOLO_SHARE_DEFAULT)
        self.assertEqual(cfg["yolo_top_k"], tc_config.YOLO_TOP_K_DEFAULT)
        self.assertEqual(cfg["yolo_top_k"], 1)

    def test_overrides_and_bool(self):
        cfg = tc_cli.build_cfg({
            "frame_count": "2", "tag_threshold": "0.7",
            "tag_characters": "true", "ffmpeg_path": "/opt/ffmpeg",
        })
        self.assertEqual(cfg["frame_count"], 2)
        self.assertAlmostEqual(cfg["tag_threshold"], 0.7)
        self.assertTrue(cfg["tag_characters"])
        self.assertEqual(cfg["ffmpeg_path"], "/opt/ffmpeg")

    def test_sampling_and_voting_overrides(self):
        cfg = tc_cli.build_cfg({
            "frame_interval": "3.5", "max_frames": "12",
            "yolo_multi": "false", "yolo_min_votes": "4", "yolo_share": "0.6",
            "frame_workers": "2", "infer_batch_size": "16", "yolo_top_k": "2",
        })
        self.assertAlmostEqual(cfg["frame_interval"], 3.5)
        self.assertEqual(cfg["max_frames"], 12)
        self.assertFalse(cfg["yolo_multi"])
        self.assertEqual(cfg["yolo_min_votes"], 4)
        self.assertAlmostEqual(cfg["yolo_share"], 0.6)
        self.assertEqual(cfg["frame_workers"], 2)
        self.assertEqual(cfg["infer_batch_size"], 16)
        self.assertEqual(cfg["yolo_top_k"], 2)

    def test_download_defaults_and_overrides(self):
        cfg = tc_cli.build_cfg({})
        self.assertTrue(cfg["auto_download"])
        self.assertIsNone(cfg["hf_token"])

        cfg = tc_cli.build_cfg({"auto_download": "false", "hf_token": "tok"})
        self.assertFalse(cfg["auto_download"])
        self.assertEqual(cfg["hf_token"], "tok")

    def test_debug_defaults_and_overrides(self):
        cfg = tc_cli.build_cfg({})
        self.assertIsNone(cfg["debug_log"])
        self.assertEqual(cfg["debug_floor"], tc_config.DEBUG_FLOOR_DEFAULT)
        self.assertEqual(cfg["debug_top"], tc_config.DEBUG_TOP_DEFAULT)

        cfg = tc_cli.build_cfg({
            "debug_log": "report.json", "debug_floor": "0.2", "debug_top": "3",
        })
        self.assertEqual(cfg["debug_log"], "report.json")
        self.assertAlmostEqual(cfg["debug_floor"], 0.2)
        self.assertEqual(cfg["debug_top"], 3)

    def test_marker_defaults_and_overrides(self):
        cfg = tc_cli.build_cfg({})
        self.assertEqual(cfg["markers"], "off")
        self.assertIsNone(cfg["marker_pad"])
        self.assertEqual(cfg["marker_max"], tc_config.MARKER_MAX_DEFAULT)

        cfg = tc_cli.build_cfg({
            "markers": "best", "marker_pad": "2.5", "marker_max": "3",
        })
        self.assertEqual(cfg["markers"], "best")
        self.assertAlmostEqual(cfg["marker_pad"], 2.5)
        self.assertEqual(cfg["marker_max"], 3)

    def test_marker_filter_defaults_and_overrides(self):
        cfg = tc_cli.build_cfg({})
        self.assertEqual(cfg["marker_whitelist"], [])
        self.assertEqual(cfg["marker_blacklist"], [])

        cfg = tc_cli.build_cfg({
            "marker_whitelist": "AI: Cowgirl Position,sex from behind",
            "marker_blacklist": "blurry, 1girl",
        })
        self.assertEqual(
            cfg["marker_whitelist"], ["cowgirl position", "sex from behind"]
        )
        self.assertEqual(cfg["marker_blacklist"], ["1girl", "blurry"])
        # The cfg is echoed into the debug report, so it has to be serialisable.
        json.dumps(cfg)


    def test_marker_gap_defaults_and_overrides(self):
        self.assertEqual(tc_cli.build_cfg({})["marker_gap"], 0.0)
        self.assertAlmostEqual(
            tc_cli.build_cfg({"marker_gap": "45"})["marker_gap"], 45.0
        )


    def test_tag_filter_defaults_and_overrides(self):
        cfg = tc_cli.build_cfg({})
        self.assertEqual(cfg["tag_whitelist"], [])
        self.assertEqual(cfg["tag_blacklist"], [])

        cfg = tc_cli.build_cfg({
            "tag_whitelist": "AI: Cowgirl Position,sex from behind",
            "tag_blacklist": "blurry, 1girl",
        })
        self.assertEqual(cfg["tag_whitelist"],
                         ["cowgirl position", "sex from behind"])
        self.assertEqual(cfg["tag_blacklist"], ["1girl", "blurry"])


if __name__ == "__main__":
    unittest.main()
