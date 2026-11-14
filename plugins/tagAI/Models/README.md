# Models

Place the AI model files in this folder. Each model needs the exact file name
listed below.

Lazy loading means you only need the model(s) for the target(s) you use:

* Image tasks need one or more **WD taggers** (`.onnx` + `.csv`) or the
  **JoyTag** tagger (`.onnx` + `top_tags.txt`).
* Video tasks need the **YOLO classifier** (`.onnx`).

The `.onnx` and `.csv` files are git-ignored (they are large), so they are not
committed to this repository -- download them yourself.

## Automatic download

If a required file is missing when a task runs, TagAI downloads it from
Hugging Face automatically (this can be disabled with `auto_download=false`).
The mapping from model name to repository and file is built in, so normally
you do not have to do anything.

* The WD taggers and JoyTag are public and download without credentials.
* The `yolo11-nsfw` detector and the `sex-position` classifier are **not**
  downloadable (their upstream repositories ship only `.pt`/`.bin`
  checkpoints). Export their ONNX once, as described below.
* The YOLO classifier is **gated** (see below) and needs a token. Provide one
  by setting the `HF_TOKEN` environment variable (`HUGGING_FACE_HUB_TOKEN` and
  `HUGGINGFACE_TOKEN` also work), by passing the `hf_token` task argument, or
  by placing the token in a file named `hf_token` (or `hf.token` /
  `huggingface.token`) next to `tagAI.py`.
* For the YOLO classifier TagAI also tries to fetch the model's published
  per-class threshold file (best effort). If it cannot be downloaded, the
  built-in defaults are used instead.

If a download fails you can always fetch the files manually and drop them here
with the exact names below; the automatic download only fills in what is
missing.

---

## WD taggers (images)

Multi-label taggers from [SmilingWolf](https://huggingface.co/SmilingWolf).
For each model download `model.onnx` and `selected_tags.csv`, then rename them
so the base name matches the model name.

### wd-v1-4-moat-tagger-v2 (default for images)

* https://huggingface.co/SmilingWolf/wd-v1-4-moat-tagger-v2/resolve/main/model.onnx?download=true
* https://huggingface.co/SmilingWolf/wd-v1-4-moat-tagger-v2/resolve/main/selected_tags.csv?download=true

Rename to:

* `wd-v1-4-moat-tagger-v2.onnx`
* `wd-v1-4-moat-tagger-v2.csv`

### wd-convnext-tagger-v3

* https://huggingface.co/SmilingWolf/wd-convnext-tagger-v3/resolve/main/model.onnx?download=true
* https://huggingface.co/SmilingWolf/wd-convnext-tagger-v3/resolve/main/selected_tags.csv?download=true

Rename to:

* `wd-convnext-tagger-v3.onnx`
* `wd-convnext-tagger-v3.csv`

### wd-v1-4-vit-tagger

* https://huggingface.co/SmilingWolf/wd-v1-4-vit-tagger/resolve/main/model.onnx?download=true
* https://huggingface.co/SmilingWolf/wd-v1-4-vit-tagger/resolve/main/selected_tags.csv?download=true

Rename to:

* `wd-v1-4-vit-tagger.onnx`
* `wd-v1-4-vit-tagger.csv`

### wd-swinv2-tagger-v3

An updated tagger that recognises **10,861** tags (the v1-4 series has 9,083).

* https://huggingface.co/SmilingWolf/wd-swinv2-tagger-v3/resolve/main/model.onnx?download=true
* https://huggingface.co/SmilingWolf/wd-swinv2-tagger-v3/resolve/main/selected_tags.csv?download=true

Rename to:

* `wd-swinv2-tagger-v3.onnx`
* `wd-swinv2-tagger-v3.csv`

### wd-eva02-large-tagger-v3

The largest and most accurate WD v3 tagger (10,861 tags). It is noticeably
slower and uses more memory than the other taggers.

* https://huggingface.co/SmilingWolf/wd-eva02-large-tagger-v3/resolve/main/model.onnx?download=true
* https://huggingface.co/SmilingWolf/wd-eva02-large-tagger-v3/resolve/main/selected_tags.csv?download=true

Rename to:

* `wd-eva02-large-tagger-v3.onnx`
* `wd-eva02-large-tagger-v3.csv`

---

## JoyTag (images, photographic)

[JoyTag](https://huggingface.co/fancyfeast/joytag) is a multi-label tagger
(ViT-B/16, 448x448, 5,000+ Danbooru tags) that was additionally trained on
manually tagged **photographic** images, so it tends to work better on real
photos than the WD taggers.

* https://huggingface.co/fancyfeast/joytag/resolve/main/model.onnx?download=true
* https://huggingface.co/fancyfeast/joytag/resolve/main/top_tags.txt?download=true

Rename to:

* `joytag.onnx`
* `joytag-top_tags.txt`

`top_tags.txt` holds one tag per line, in the model's output order. JoyTag
outputs raw logits; TagAI applies a sigmoid and keeps every tag above the
`joytag_threshold` argument (default `0.4`). Images are padded to a white
square, resized to 448x448 and CLIP-normalised before inference.

---

## YOLO classifier (videos)

The video pipeline uses
[`likewendy/yolo26n-cls-porn`](https://huggingface.co/likewendy/yolo26n-cls-porn),
a single-label classifier over 35 adult classes.

> **This model is gated.** You must be logged in to Hugging Face and have
> accepted the model's terms before you can download it.

1. Log in to Hugging Face and accept the model's license/terms on its page.
2. Download the weights (`weights/best.onnx` from the repository).
3. Place the file here and rename it to:

   * `yolo26n-cls-porn.onnx`

> **Note:** the exported model already contains a Softmax layer, so its output
> is a probability distribution. TagAI detects and handles both softmaxed
> output and raw logits, so either export works. Do not rename the classes.

### Per-class thresholds

The model ships a published per-class confidence threshold file
(`class35_conf_thresholds_by_name.json`); TagAI downloads it here as
`yolo26n-cls-porn-thresholds.json` when possible and otherwise uses the same
values bundled into the code.

To override them, place a JSON object mapping class name to a threshold here:

* `yolo26n-cls-porn-thresholds.json`

```json
{
  "Kissing": 0.6,
  "Pants": 0.85,
  "default": 0.5
}
```

When present, a frame's top class is accepted only if it clears its own
threshold (falling back to `default`, then to the `yolo_threshold` argument).
Keys may be given in Chinese or English (the model's own names are Chinese and
are translated automatically).

---

## JoyTag (images)

See the JoyTag section above; it lives in this folder as `joytag.onnx` and
`joytag-top_tags.txt`.

---

## YOLO11-NSFW detector (videos)

`yolo11-nsfw` is an object detector that finds explicit acts and body parts
(10 classes: person, breast, vulva, butt, male, penis, anal, vaginal, blowjob,
handjob). Unlike the classifiers it can report several classes for one frame.

TagAI **cannot download this model for you**: the upstream repository
([`Felldude/Yolo11_NSFW_Small`](https://huggingface.co/Felldude/Yolo11_NSFW_Small))
only publishes a `.pt` checkpoint and its licence is **AGPL-3.0**, so the ONNX
has to be exported once by hand:

```sh
# 1. download the checkpoint
curl -L -o yolo_nsfw_s.pt \
  https://huggingface.co/Felldude/Yolo11_NSFW_Small/resolve/main/yolo_nsfw_s.pt

# 2. export to ONNX (needs `pip install ultralytics`)
yolo export model=yolo_nsfw_s.pt format=onnx imgsz=640

# 3. put the result here under the name TagAI expects
mv yolo_nsfw_s.onnx /path/to/tagAI/Models/yolo11-nsfw.onnx
```

The exported graph ends at the raw detection head (`[1, 14, 8400]`); TagAI
decodes it itself, filtering boxes with `det_conf` (default `0.25`) and
applying non-maximum suppression with `det_iou` (default `0.45`). Images are
letterboxed to 640x640 with grey padding, exactly like Ultralytics does.

TagAI ships no weights for this model. If `yolo11-nsfw.onnx` is missing the
task fails with an error pointing here.

---

## sex-position (images and videos)

`porntech/sex-position` is a single-label resnet50 over eight positions:
`blowjob`, `hardcore`, `titjob`, `handjob`, `pussy-licking`, `fingering`,
`other` and `solo`. The repository ships only `pytorch_model.bin`, so TagAI
cannot download it -- export the ONNX once:

```bash
python -m venv /tmp/sexpos && . /tmp/sexpos/bin/activate
pip install torch timm onnx
python - <<'PY'
import torch, timm
m = timm.create_model("hf_hub:porntech/sex-position", pretrained=True)
m.eval()
torch.onnx.export(
    m, torch.randn(2, 3, 224, 224), "sex-position.onnx",
    input_names=["input"], output_names=["output"],
    dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}},
    opset_version=17, dynamo=False,
)
PY
mv sex-position.onnx /path/to/tagAI/Models/sex-position.onnx
```

TagAI expects input `input` with shape `[batch, 3, 224, 224]` and output
`output` with shape `[batch, 8]` **raw logits** (it applies the softmax
itself). Images are resized so the shorter side is 256 (bicubic),
centre-cropped to 224x224 and normalised with the ImageNet mean/std, which
matches the model's own `timm` preprocessing. The weights are MIT licensed
and the model is undefined on non-explicit input.

## Class names

The 35 YOLO classes, **in model output order**, are:

AI Generated, Titfuck, Voyeurism, Public Exposure, Creampie, Anime, Curly Hair,
Double Penetration, Blowjob, Bukkake, Christmas, Maid, Lesbian Strapon, Lesbian
Tribbing, CFNM, Pregnant, Pissing, Handjob, Kissing, Oiled, Squirting, Solo
Male, Male Group, Leather and Latex, Tattoo, Cuckold, Asshole Close-up, Footjob,
Armpit, Rimjob, Pussy Licking, Pants, Interracial, Mirror, Facesitting.

The model stores these names in Chinese; TagAI reads them from the ONNX
metadata, translates them to English, and falls back to this built-in list if
the metadata is unavailable.
