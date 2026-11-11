# tagAI

A [Stash](https://stashapp.cc) plugin that tags **Images** and **Videos
(Scenes)** using locally hosted AI models. Nothing is uploaded anywhere -- all
inference runs on your own machine.

It supports two families of models and lets you choose which to use per task:

| Target   | Model family                     | Example model                          | Output                                     |
| -------- | -------------------------------- | -------------------------------------- | ------------------------------------------ |
| `images` | WD / JoyTag multi-label taggers  | `wd-v1-4-moat-tagger-v2`, `joytag`     | many tags per image                        |
| `videos` | YOLO classifier / detector + WD  | `yolo11-nsfw,sex-position,wd-v1-4-moat-tagger-v2` | one or more tags per video (voted over frames) |

Models are loaded **lazily**: image jobs never load the YOLO model and video
jobs never load a WD tagger, so only the model you actually need is kept in
memory.

---

## Quick start

Get it running in five steps. Everything below is explained in more depth
[after the configuration guide](#in-depth-guide).

### 1. Install the plugin

Put this whole folder in your Stash community plugins directory, so that the
file `tagAI.py` ends up here:

```
<stash-config-dir>/plugins/community/tagAI/tagAI.py
```

On a typical Linux install that is `~/.stash/plugins/community/tagAI/`. If Stash
already runs other community plugins, you probably already know where it lives.

Copy the `tagai_core/` folder alongside `tagAI.py` -- `tagAI.py` is only a thin
launcher and most of the code lives in that package (see
[Project layout](#project-layout) for what is in it).

### 2. Install the Python dependencies

Install them into **the same Python that Stash uses to run plugins**:

```sh
pip install -r requirements.txt
```

> ⚠️ This is the single most common setup mistake. "The Python Stash uses" is
> the first `python` on Stash's `PATH`, which is often a dedicated virtualenv --
> **not** the one your terminal happens to use. Installing into the wrong
> interpreter gives `ModuleNotFoundError: No module named 'PIL'` (or
> `onnxruntime`) when a task runs.

### 3. Install ffmpeg (only if you want to tag videos)

`ffmpeg` must be on your `PATH`, or you can point a task at it with the
`ffmpeg_path` argument. Image tagging does not need ffmpeg.

### 4. Add your model files

* **Images:** nothing to do. The public WD taggers and JoyTag download
  automatically the first time a task needs them.
* **Videos:** the `yolo26n-cls-porn` classifier is gated and needs a Hugging
  Face token, and the `yolo11-nsfw` detector / `sex-position` classifier must
  be exported to ONNX once by hand. See
  [`Models/README.md`](Models/README.md) for the exact steps.

### 5. Run a task

In Stash: **Settings → Tasks**, pick one of the `TagAI` tasks (for example
**"Tag All Untagged Images"**) and press **Run**.

That's it. The first run may download a model and can take a while; later runs
reuse it.

### Optional: the API key file

The plugin works out of the box inside Stash because Stash hands it the API
key/session on stdin. If you ever run `tagAI.py` by itself, copy `_api.key` to
`api.key` and put your Stash API key in it.

---

## Configuration (`tagAI.yml`)

All of the plugin's settings live in **`tagAI.yml`**, in the plugin folder. This
section explains how to read and edit it. A complete list of every available
setting is in the [full argument reference](#full-argument-reference).

### The shape of the file

```yaml
name: TagAI                       # plugin name shown in Stash
version: 1.8                      # plugin version
exec:                             # how Stash launches the plugin
  - python
  - "{pluginDir}/tagAI.py"
description: Tag images and videos with locally hosted AI models
interface: raw
tasks:                            # the tasks Stash lists under Settings -> Tasks
  - name: "Tag All Untagged Images"
    description: "Tag all untagged images (WD tagger)"
    defaultArgs:                  # <-- every setting for this task lives here
      target: images
      model: wd-v1-4-moat-tagger-v2
      mode: TagAll
      flag_tag: "AI_TagMe"
      add_tag: "AI_Tagged"
      tag_prefix: "AI: "
      # ...plus the debug_* and tag_*_list options (see the reference table)
```

You normally only ever touch the **`defaultArgs:`** block of a task -- that is
where each task's settings are stored. The rest of the file (name, version,
`exec`, ...) is boilerplate that lets Stash find and run the plugin; leave it
alone.

### How task settings work

Each task has its own set of defaults under `defaultArgs:`. When Stash runs a
task it passes those settings to the plugin. **Editing a value in `defaultArgs`
changes the behaviour of that task.**

To change something, find the task you care about and add or edit the line:

```yaml
      target: images
      model: wd-eva02-large-tagger-v3   # changed: use the biggest WD tagger
      tag_threshold: "0.6"              # changed: require more confidence
```

A few rules of thumb:

* **Values are plain YAML.** Text can be quoted (`"AI: "`) or unquoted
  (`images`). Keep the quotes around anything with leading/trailing spaces or a
  colon, like the `tag_prefix` value `"AI: "`.
* **Numbers are written as strings** in this file (`"0.5"`, `"10"`) to match the
  existing style; the plugin converts them for you.
* **To turn an option off**, set it to an empty value: `markers: ""`.
* **After editing, reload the plugin** in Stash (Settings → Plugins → *Reload*,
  or restart Stash) so the new defaults are picked up.

### The six tasks that ship with the plugin

| # | Task name                     | Target   | Mode       | Model (default)                                    |
| - | ----------------------------- | -------- | ---------- | -------------------------------------------------- |
| 1 | Tag All Untagged Images       | `images` | `TagAll`   | `wd-v1-4-moat-tagger-v2`                           |
| 2 | Tag All Images -- Force       | `images` | `ForceTag` | `wd-v1-4-moat-tagger-v2`                           |
| 3 | Tag All Flagged Images        | `images` | `Tagged`   | `wd-v1-4-moat-tagger-v2`                           |
| 4 | Tag All Untagged Videos       | `videos` | `TagAll`   | `yolo11-nsfw,sex-position,wd-v1-4-moat-tagger-v2`  |
| 5 | Tag All Videos -- Force       | `videos` | `ForceTag` | `yolo11-nsfw,sex-position,wd-v1-4-moat-tagger-v2`  |
| 6 | Tag All Flagged Videos        | `videos` | `Tagged`   | `yolo11-nsfw,sex-position,wd-v1-4-moat-tagger-v2`  |

The `mode` decides which items a task touches:

* **`TagAll`** -- tag items that do **not** already carry the `add_tag`
  (`AI_Tagged`). This is the normal "tag everything new" mode.
* **`ForceTag`** -- tag everything, even items already carrying `add_tag`.
  Use it to re-tag after changing thresholds or models.
* **`Tagged`** -- tag only items carrying the `flag_tag` (`AI_TagMe`) -- handy
  for tagging a hand-picked set. In Stash, add the `AI_TagMe` tag to the items
  you want, then run the "Flagged" task.

### Common configuration recipes

**Use a different image model** (in one of the image tasks):

```yaml
      model: wd-eva02-large-tagger-v3
```

**Run several image models at once** and merge their tags:

```yaml
      model: "joytag,wd-eva02-large-tagger-v3"
```

**Enable scene markers on a video task** (see
[scene markers](#tagging-exact-moments-scene-markers) below):

```yaml
      markers: ranges        # off (default) | ranges | best
      marker_max: "200"
```

**Tune how confident a model must be:**

```yaml
      tag_threshold: "0.65"    # images: WD general tags
      det_conf: "0.25"         # videos: yolo11-nsfw detections
      yolo_min_votes: "2"      # videos: frames that must agree
```

**Write a debug report to calibrate thresholds:**

```yaml
      debug_log: "tagai-debug.json"
```

**Add an entirely new task:** copy an existing task block (from `- name:` down
through its `defaultArgs:`) and change its `name` and settings. No code changes
are needed -- pick a `target` (`images` or `videos`), a `model`, and a `mode`,
and Stash will list it.

The video tasks that ship with the plugin already run
`yolo11-nsfw,sex-position,wd-v1-4-moat-tagger-v2` at `frame_interval: 5`,
`det_conf: 0.25`, `tag_threshold: 0.65`, `yolo_min_votes: 2` and
`sexpos_margin: 0.15`. The "Tag All Flagged Videos" task additionally has
`markers: ranges` enabled.

---

# In-depth guide

Everything below is reference material. Read it as you need it.

## Requirements

1. **Python dependencies** -- install with `pip install -r requirements.txt`.
   Make sure you install them into the **same Python interpreter Stash uses to
   run plugins** (the first `python` on Stash's `PATH`, which is not
   necessarily the one on your shell). Installing into the wrong interpreter is
   the usual cause of `ModuleNotFoundError: No module named 'PIL'` /
   `onnxruntime`.
2. **ffmpeg** -- required for video tagging (frame extraction). It must be on
   your `PATH`, or provide the `ffmpeg_path` argument on the task.
3. **Models** -- if a model file is missing, TagAI downloads it from Hugging
   Face automatically (see [`Models/README.md`](Models/README.md)). The gated
   YOLO classifier additionally needs a Hugging Face token once you have
   accepted its terms -- set `HF_TOKEN` (or a local `hf_token` file), or pass
   the `hf_token` argument. The `yolo11-nsfw` detector and `sex-position`
   classifier cannot be downloaded and must be exported to ONNX once by hand.
4. **API key** -- copy `_api.key` to `api.key` and put your Stash API key in it.
   (The plugin also accepts the key/session cookie Stash passes on stdin, so
   this file is optional when running inside Stash.)

## Tasks

Six tasks are registered -- three for images and three for videos. See
[the six tasks](#the-six-tasks-that-ship-with-the-plugin) above for the task
table and the meaning of the `TagAll` / `ForceTag` / `Tagged` modes.

The video tasks run three models in one pass by default, so every frame
contributes the detector's acts and body parts, the position classifier's tag
and the tagger's Danbooru tags (including named positions such as
`cowgirl position`).

In all cases the processed item also receives the `add_tag`, and every AI tag is
created automatically if it does not exist yet. AI tags are prefixed with
`tag_prefix` (`AI: ` by default).

## Choosing a model

The `model` argument selects which model a task uses. Available models:

* `wd-v1-4-moat-tagger-v2` (default for images)
* `wd-convnext-tagger-v3`
* `wd-v1-4-vit-tagger`
* `wd-swinv2-tagger-v3` (WD v3, 10,861 tags)
* `wd-eva02-large-tagger-v3` (WD v3, largest and most accurate, slowest)
* `joytag` (photographic multi-label tagger)
* `yolo26n-cls-porn` (35-class single-label classifier, videos)
* `yolo11-nsfw` (YOLO11 NSFW object detector, videos -- see below)
* `sex-position` (porntech sex-position classifier, images and videos)

The `target` argument chooses the pipeline (`images` or `videos`); it also
determines the default model when `model` is omitted.

## How tagging works

### Images (WD taggers)

The WD models are multi-label: for each image the model returns a probability
per tag. General tags above `tag_threshold` (default `0.5`) are applied.
Character tags (category `4`) are only applied when `tag_characters` is `true`
and above `char_threshold` (default `0.85`).

The three `wd-*-v3` models (`wd-convnext-tagger-v3`, `wd-swinv2-tagger-v3`,
`wd-eva02-large-tagger-v3`) work exactly the same way but recognise 10,861 tags
instead of 9,083.

### Images (JoyTag)

JoyTag is a second multi-label tagger you can select with `model: joytag`. It
was trained on Danbooru plus a manually tagged set of **photographic** images,
so it tends to do better on real photos than on drawn art. Every tag scoring
above `joytag_threshold` (default `0.4`) is applied; there is no separate
character category.

### Videos (YOLO classifier)

The YOLO model is single-label *per frame*, but a video usually contains more
than one kind of content, so TagAI votes over many frames and can apply several
tags:

1. Frames are sampled across the middle 10%-90% of the video's duration with
   ffmpeg. By default roughly **one frame every `frame_interval` seconds**
   (default `10`), capped at `max_frames` (default `512`). Set
   `frame_interval: 0` to instead sample exactly `frame_count` frames (default
   `8`) evenly spread over that band. Frames are extracted by `frame_workers`
   (default `4`) parallel ffmpeg processes, which hides the seek latency of slow
   or networked storage.
2. Every frame is classified. A frame is *accepted* only if the top class clears
   its threshold **and** beats the runner-up by at least `yolo_margin` (default
   `0.4`). Thresholds are per class: the values published with the model are
   bundled in and an override file next to the model is used if present (see
   [`Models/README.md`](Models/README.md)); `yolo_threshold` (default `0.5`) is
   only the fallback. Frames are classified in batches of `infer_batch_size`
   (default `8`), which keeps the GPU busy on long videos. With `yolo_top_k`
   above `1` each accepted frame may also report its runner-up classes, but only
   when they clear their own threshold.
3. TagAI collects every class that won an accepted frame. With `yolo_multi`
   `true` (the default) a class is applied when it wins at least
   `yolo_min_votes` accepted frames (default `1`, so a single confident frame is
   enough) and, if `yolo_share` is above `0`, at least that fraction of all
   accepted frames (default `0` = no share filter). Raise `yolo_min_votes` or
   set `yolo_share` to demand more agreement before a tag is applied. If no
   class reaches the bar the single strongest class is applied so a video is
   never left untagged. Set `yolo_multi: false` to restore the old "one
   majority-vote winner" behaviour.

Class names are stored in the model in Chinese and are automatically translated
to English.

`yolo11-nsfw` is an **object detector** rather than a single-label classifier:
each frame may contain several boxes, so it can report several acts or body
parts (person, breast, vulva, butt, male, penis, anal, vaginal, blowjob,
handjob) for the same frame. Boxes are filtered with `det_conf` (default
`0.25`) and non-maximum suppressed with `det_iou` (default `0.45`), then the
surviving classes are pooled across frames with the same vote rules as above
(`yolo_multi`, `yolo_min_votes`, `yolo_share`).

`sex-position` (porntech) is a single-label classifier over eight positions:
`blowjob`, `hardcore` (missionary/doggystyle/cowgirl/spooning), `titjob`,
`handjob`, `pussy-licking`, `fingering`, `other` and `solo`. Its top class is
applied when it reaches `sexpos_threshold` (default `0.5`) and, if
`sexpos_margin` is set, beats the runner-up by that much. On videos the accepted
classes are pooled with the same vote rules as the other video models. It is
undefined on non-explicit input, so it can attach a position tag to a scene that
has none.

## Running several models at once

`model` accepts a comma-separated list. Every model is run on the same item in
one pass and the resulting tags are merged -- a tag produced by more than one
model keeps its highest score:

```yaml
      model: "yolo26n-cls-porn,yolo11-nsfw"      # videos
      model: "yolo11-nsfw,sex-position"          # videos
      model: "joytag,wd-eva02-large-tagger-v3"   # images
```

Each model keeps its own options (`det_conf`, `sexpos_threshold`, `yolo_margin`,
...) and every referenced model must be available (downloaded automatically
where possible -- see [`Models/README.md`](Models/README.md)). Every extra model
costs one extra inference pass per item, which is small next to frame extraction
for videos.

## Tagging exact moments (scene markers)

Plain Stash tags belong to the whole scene, so a tag search always returns the
full video. If you want to find *the moment* a tag appears, let TagAI create
**scene markers**: Stash's markers carry a start and end time (plus an optional
preview clip), and the Scenes page can filter by marker tag.

Enable it per task -- it is off by default:

```yaml
      markers: ranges    # off (default), ranges or best
      marker_pad: ""     # seconds added to each end; empty = the sampling interval
      marker_max: "200"  # marker cap per scene; 0 disables markers
      marker_gap: "60"   # merge markers of one tag closer than 2*marker_pad + this
      marker_whitelist: ""  # only these tags may create markers (comma separated)
      marker_blacklist: ""  # these tags never create markers (comma separated)
```

* `ranges` (recommended) -- every sampled frame that accepted a tag becomes a
  point, and consecutive points of the same tag are merged into one marker. Two
  hits also merge when their padded spans would overlap, so a tag that fires
  every other frame does not produce a marker per frame.
* `best` -- a single marker per tag, at its most confident frame.

Each marker's **primary tag** is the `AI: `-prefixed tag it came from (Stash
requires exactly one primary tag) and the other AI tags that fired on the same
frames are attached as additional marker tags, so you can filter by any of them.

`marker_gap` merges markers of the *same* tag that are close together, so a tag
which fires on and off for a while becomes one marker per burst instead of one
per sample. Two hits are combined when they are no further apart than
`2 * marker_pad + marker_gap` seconds (`0` = only hits whose padded spans
already touch, which is the old behaviour). With `frame_interval: 5`,
`marker_pad: 2` and `marker_gap: 60`, a tag has to stay quiet for over a minute
before it can produce a second marker. It never merges two different tags.

`marker_whitelist` and `marker_blacklist` restrict which tags may create
markers, which is how you keep background noise (`blurry`, `1girl`, ...) from
producing marker spam. Both take a comma-separated list of tag names; matching
is case-insensitive, the `AI: ` prefix is optional, and multi-word names such as
`cowgirl position` are kept intact. A non-empty whitelist allows *only* the
listed tags to create markers, and the blacklist always wins over the whitelist.
The filters affect markers only -- the scene still gets all the tags -- and they
also stop a filtered tag from being attached as an extra marker tag.

`marker_pad` defaults to the median spacing of the sampled frames (for a
`frame_interval` of `5`, that is 5 s), so a marker always spans at least
`2 * marker_pad = 10` s around the frame that fired -- a hit at 60 s becomes a
marker from 55 s to 65 s. That padding is what makes the markers comfortable to
click through, and it is also the merge tolerance in `ranges` mode.

To search: **Scenes page → Filter → Markers → Marker tags** (add more than one
to require all of them), optionally combined with **Has markers**. Markers also
appear in the scene's *Markers* tab, where clicking one seeks the player to that
moment.

Notes:

* Marker previews (the little looping clips under each marker) are rendered by
  Stash with ffmpeg; if you generate a lot of markers you may want to turn
  marker preview generation down or off in Stash's own settings.
* Re-running a task does not stack markers: a marker is skipped when one with
  the same primary tag already exists within `2 * marker_pad` seconds.
* Markers are only created for tags the scene vote accepted (the same thresholds
  apply), so tune those first with the debug log below.

## Filtering the tags

`tag_whitelist` and `tag_blacklist` decide which tags are written to the item
itself. They work exactly like the marker filters (comma-separated names,
case-insensitive, an optional `AI: ` prefix, the blacklist always wins) but they
act earlier: a filtered tag is never applied to the image or scene, and it can
no longer become a marker either -- so they are a second way to keep marker
noise down.

```yaml
      tag_blacklist: "blurry, 1girl, artist name"    # never applied
      tag_whitelist: "cowgirl position, doggystyle"  # only these are applied
```

Both default to empty (= no filtering) and apply to images and videos alike.
With a non-empty whitelist only the listed tags are applied, which is useful
when you want nothing but the acts you care about: everything else the models
produce is dropped before it reaches your library.

## Calibrating thresholds (debug log)

Thresholds are guesses until you measure them on your own library. Set
`debug_log` and TagAI writes a JSON report of every tag confidence it saw for
each processed item, so running **one** video with the task you want to tune is
enough:

```yaml
      debug_log: "tagai-debug.json"   # a path, or true for tagai-debug.json next to the plugin
      debug_floor: "0.05"             # ignore scores below this
      debug_top: "10"                 # candidates kept per frame and model
```

The report is rewritten after every item (`per_frame` holds one row per sampled
frame):

```json
{
 "plugin": "TagAI", "format": 1, "generated": "2026-10-17T12:00:00",
 "settings": { "det_conf": 0.25, "tag_threshold": 0.5, "...": "..." },
 "items": [
  { "id": 21418, "path": "/media/videos/a.mp4", "duration": 1696.6, "frames": 52,
    "models": [
      { "name": "wd-v1-4-moat-tagger-v2", "family": "wd",
        "settings": { "tag_threshold": 0.5, "char_threshold": 0.85, "tag_characters": false },
        "per_frame": [ [["sex from behind", 0.814], ["doggystyle", 0.73]], ["..."] ],
        "aggregate": [ {"tag": "sex from behind", "score": 0.814, "accepted": true} ],
        "tags": ["sex from behind", "doggystyle"] }
    ],
    "applied_tags": ["AI: sex from behind", "AI: doggystyle"] }
 ]
}
```

Read the per-model `aggregate` list: every tag the model produced above
`debug_floor`, its best score over the frames and whether the current settings
accepted it. Raise a threshold when a tag with a low score keeps appearing,
lower it when a real tag sits just under the bar. `per_frame` shows whether a
tag fired consistently or on a single lucky frame. The report is written to disk
only -- never to stdout -- and `settings` never contains your `hf_token`.

## Full argument reference

Each task declares its defaults in `tagAI.yml`; all of them can be overridden.

| Argument          | Default                  | Applies to | Meaning                                              |
| ----------------- | ------------------------ | ---------- | ---------------------------------------------------- |
| `target`          | `images`                 | both       | `images` or `videos`                                 |
| `model`           | per target               | both       | Model name, or a comma-separated list of names       |
| `mode`            | `TagAll`                 | both       | `TagAll`, `ForceTag` or `Tagged`                     |
| `flag_tag`        | `AI_TagMe`               | both       | Tag that marks an item as flagged (mode `Tagged`)    |
| `add_tag`         | `AI_Tagged`              | both       | Tag added to every processed item                    |
| `tag_prefix`      | `AI: `                   | both       | Prefix for all created AI tags                       |
| `tag_threshold`   | `0.5`                    | images     | WD general tag threshold                             |
| `char_threshold`  | `0.85`                   | images     | WD character tag threshold                           |
| `tag_characters`  | `false`                  | images     | Whether to apply WD character tags                   |
| `joytag_threshold`| `0.4`                    | images     | JoyTag score threshold                               |
| `frame_interval`  | `10` (seconds)           | videos     | Sample ~one frame every N seconds (0 = use `frame_count`) |
| `max_frames`      | `512`                    | videos     | Upper bound on frames sampled per video              |
| `frame_count`     | `8`                      | videos     | Frames sampled when `frame_interval` is 0            |
| `frame_workers`   | `4`                      | videos     | Parallel ffmpeg processes used to extract frames     |
| `infer_batch_size`| `8`                      | videos     | Frames per onnxruntime call                          |
| `yolo_threshold`  | `0.5`                    | videos     | Fallback per-frame confidence threshold              |
| `yolo_margin`     | `0.4`                    | videos     | Minimum top1-top2 confidence gap to accept a frame   |
| `yolo_multi`      | `true`                   | videos     | Tag every class that wins enough accepted frames     |
| `yolo_min_votes`  | `1`                      | videos     | Minimum accepted frames for a class to be tagged     |
| `yolo_share`      | `0`                      | videos     | Minimum fraction of accepted frames (0 = off)        |
| `yolo_top_k`      | `1`                      | videos     | Classes reported per frame (opt-in recall boost)     |
| `det_conf`        | `0.25`                   | videos     | Detection confidence threshold (`yolo11-nsfw`)       |
| `det_iou`         | `0.45`                   | videos     | NMS IoU threshold (`yolo11-nsfw`)                    |
| `sexpos_threshold`| `0.5`                    | both       | `sex-position` top-1 confidence threshold            |
| `sexpos_margin`   | `0` (off)                | both       | Minimum top1-top2 gap for `sex-position`             |
| `batch_size`      | `256` img / `64` video   | both       | Page size used when fetching items                   |
| `ffmpeg_path`     | `ffmpeg`                 | videos     | Path to the ffmpeg binary                            |
| `auto_download`   | `true`                   | both       | Download a missing model from Hugging Face           |
| `hf_token`        | none                     | both       | Hugging Face token for gated models                  |
| `debug_log`       | off                      | both       | Write per-tag confidences to this JSON report (or `true` for `tagai-debug.json`) |
| `debug_floor`     | `0.05`                   | both       | Lowest score recorded in the debug report            |
| `debug_top`       | `10`                     | both       | Candidates recorded per frame and model in the debug report |
| `markers`         | `off`                    | videos     | Create scene markers at the moments a tag fired: `off`, `ranges` or `best` |
| `marker_pad`      | sampling interval        | videos     | Seconds padded onto each end of a marker (also the merge tolerance) |
| `marker_max`      | `50`                     | videos     | Maximum markers created per scene (0 = none)         |
| `marker_gap`      | `0`                      | videos     | Merge markers of one tag closer than `2 * marker_pad + this` seconds |
| `marker_whitelist`| none                     | videos     | Only these tags may create markers (comma-separated names) |
| `marker_blacklist`| none                     | videos     | These tags never create markers (comma-separated names) |
| `tag_whitelist`   | none                     | both       | Only these tags are written to the item (comma-separated names) |
| `tag_blacklist`   | none                     | both       | These tags are never written to the item (comma-separated names) |

## Notes

* The plugin never writes anything but (optionally) JSON to stdout, since Stash
  parses stdout. All logging goes through `stashapi.log`.
* Missing models produce a clear error pointing at
  [`Models/README.md`](Models/README.md) rather than crashing the whole job.

## Project layout

Stash runs `tagAI.py` directly (`exec: [python, "{pluginDir}/tagAI.py"]`), so that
file has to stay put -- but it is only a short launcher for the `tagai_core`
package next to it:

| Module                   | Responsibility                                            |
| ------------------------ | --------------------------------------------------------- |
| `tagAI.py`               | entry point: check dependencies, call `tagai_core.cli.main` |
| `tagai_core/config.py`   | constants, the model registry and class-name tables       |
| `tagai_core/stashlog.py` | logging (`stashapi.log`, falling back to stderr)          |
| `tagai_core/stash_client.py` | GraphQL connection, tag lookup and creation          |
| `tagai_core/models.py`   | model sessions, Hugging Face download, label loading      |
| `tagai_core/preprocess.py` | per-family image preprocessing                          |
| `tagai_core/postprocess.py` | per-family score post-processing and aggregation      |
| `tagai_core/debug.py`    | calibration debug report                                  |
| `tagai_core/inference.py` | generic inference shared by the image and video pipelines |
| `tagai_core/images.py`   | image queries and tag application                         |
| `tagai_core/frames.py`   | video frame timing and ffmpeg extraction                  |
| `tagai_core/markers.py`  | scene marker planning and creation                        |
| `tagai_core/scenes.py`   | scene queries and per-scene processing                    |
| `tagai_core/jobs.py`     | pagination loop and image/scene runners                   |
| `tagai_core/cli.py`      | argument parsing, task dispatch (`main`)                  |

The package imports in the order above (roughly leaf to top), so no module
imports a module that imports it back. Tests live in `tests/test_tagai.py` and
run with `python -m unittest discover -s tests -v`; they import the submodules
directly (e.g. `from tagai_core import cli`) and patch names on the module that
defines them.
