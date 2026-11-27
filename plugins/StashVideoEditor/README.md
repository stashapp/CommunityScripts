# Stash Video Editor

Crop, stretch or trim a scene's video from the scene page. The edit is made
server-side with ffmpeg, written to a new file next to the original, and set as
the scene's primary file. The original stays on the scene as a second file:
nothing is overwritten or deleted.

## Requirements

- `python3` on the PATH of the machine or container running Stash (standard
  library only, no pip packages).
- Stash must be able to write to the folder that holds the video.
- A browser that can play the file directly. If it cannot (some HEVC, MPEG-4 or
  VP9 files), the editor says so instead of showing an empty stage.

## Crop and stretch

The **Crop & re-encode** button on the scene page opens the editor.

- Drag the box or any of its 8 handles. With no change the box covers the whole
  frame.
- **Auto-crop bars** finds the sharp picture area and sets the box to it. It
  works on black bars and on blurred padding.
- **Switch to Stretch** keeps the cropped region and lets you resize it to a
  different shape.
- The submit button states the output size.

The re-encode uses the ffmpeg path and the transcode input and output arguments
from Stash's settings. When no output arguments are set it uses
`libx264 -crf 18 -preset slow`.

- An `.mp4`, `.m4v`, `.mov` or `.mkv` source keeps its container and its audio
  is copied.
- Any other source (WebM, AVI, WMV and so on) is written as `.mp4` with AAC
  audio, because those containers cannot hold H.264 or hold it poorly.
- A re-encode keeps the first video stream and all audio streams. Subtitle
  streams are not carried over. Data streams are not copied (ffmpeg may write a
  new timecode track of its own).

### Placing the crop precisely

The stage draws the source scaled down (a 1080p video renders at 0.375x), and the
crop box dims everything outside itself, so a letterbox bar and a dimmed strip of
real content look the same there. Two controls fix that:

- **Magnifier.** Hover or drag any handle and a panel shows the pixels around
  that edge at 1:1 source resolution, undimmed. The region being removed is
  washed red and labelled CUT, the surviving side is labelled KEEP, and the
  marker line sits on the boundary pixel on the removed side, so no mark covers a
  pixel you are keeping. The caption names the edge coordinate, how many pixels
  it removes and from which side (`top y 138 · cut 138px above`).
- **Arrow keys.** They nudge the last-touched handle by 2 source pixels (Shift:
  10). The step is even because the crop is rounded to even dimensions for
  H.264.

## Trim

The **Trim** button opens a timeline with an in handle and an out handle. The
timeline shows the scene's sprite sheet when one has been generated.

- **Lossless** copies the video, audio and subtitle streams without
  re-encoding. It is instant and loses no quality. The cut starts at the nearest
  keyframe at or before the in point, so the whole selection is kept and the
  result can start slightly early.
- **Precision** re-encodes for a frame-accurate cut.

After a trim, the scene's markers are moved to the new timeline, and markers
whose moment was cut away are removed. After a lossless trim a marker can be off
by up to one keyframe interval.

## How the swap works

1. The task writes a record of the edit to `sve-pending.json` in the plugin
   folder, encodes to `<name>.edited.<ext>` next to the original, and queues a
   scan of that file. If that name is taken, it uses `.edited-2`, `.edited-3`
   and so on, so an earlier edit is never overwritten.
2. The scan creates a new scene for the file. The plugin's `Scene.Create.Post`
   hook merges that scene into the original, sets the edited file as primary,
   moves the markers after a trim, and queues a generate with overwrite for the
   scene's covers, previews, sprites, phash and marker previews. Then it removes
   the record.

The hook acts only on files that have a record. A file you named
`something.edited.mp4` yourself is left alone.

If the hook did not run, the **Merge edited scenes** task (Settings > Tasks)
finishes every edit that still has a record. Running it again does nothing.

The **Crop and re-encode** and **Trim** tasks also show under Settings > Tasks.
They only work from the buttons on the scene and image pages.

## Image clips

The **Crop & re-encode** button also appears on the image page for image clips
(`.vclip` videos). Stash has no file-swap API for images, so the cropped file is
written over the original path and the original is kept beside it as
`<name>.sve-bak`. A rescan refreshes the image in place, and its record and
metadata are kept. If you crop the same clip again, the backup stays the first
original. The cropped clip is H.264 with AAC audio. Trim is scene-only.

## Encode hook (optional)

Stash's own ffmpeg does the re-encodes unless you set **Encode hook
(executable path)** in the plugin's settings. With it set, crop, stretch and
precision trim hand each re-encode to that executable first: for example to use
another machine's GPU or a cloud encoder. A lossless trim is a stream copy and
always runs locally.

The plugin runs the executable with no arguments and writes one JSON job to its
stdin:

| Field | Value |
|---|---|
| `version` | `1` |
| `op` | `crop` (crop and stretch) or `trim` (precision trim) |
| `scene_id`, `image_id` | The scene or image clip being edited. The other one is `null`. |
| `src` | The source video, with the path as Stash sees it. |
| `dst` | Where the output must be written: an in-progress name ending in `.sve-partial`, which Stash does not scan. |
| `format` | The ffmpeg muxer for `dst` (`mp4`, `mov`, `matroska`), since its name does not say. |
| `final_dst` | Where the plugin moves `dst` once the hook succeeds. Its extension names the container. |
| `crop` | Crop only: `{x, y, width, height}` in source pixels, rounded down to even. |
| `out_w`, `out_h` | Crop only: the output size. |
| `start`, `end` | Trim only: the in and out points in seconds. |
| `encode` | `ffmpeg`, `input_args`, `output_args` and `audio_args`: Stash's transcode settings as the plugin would use them. |
| `ffmpeg_command` | The full ffmpeg argv the plugin would run itself, writing to `dst`. A hook can run it elsewhere or translate it for another encoder. |

The contract:

- Exit 0 once the finished file is at `dst`. The plugin checks that `dst`
  exists and is not empty (exit 0 alone is not enough), then moves it to
  `final_dst`.
- Anything else (a non-zero exit, no output or an empty one, running past
  **Encode hook timeout**, an executable that cannot start) is logged with its
  reason, and the plugin deletes whatever is at `dst` and encodes locally. The
  hook runs in its own process group, which is killed when the hook exits or
  times out. Work it handed to another machine is not stopped by that, so such
  work should write only to `dst`, or put a finished file at `final_dst` in one
  rename.
- The hook's stdout and stderr are discarded, so they never put file names in
  the Stash log. Write to a log file of your own if you need detail.
- After a hook succeeds, the edit carries on exactly as after a local encode.
- Cancelling the Stash task does not stop a running hook. Whatever it writes
  stays at the `.sve-partial` name, which you can delete.

The hook runs as the Stash user with Stash's environment (in Docker, the
container's), so a server address or token can come from an environment
variable. Plugins already run code on the Stash host, so a hook adds no new
privilege.

The timeout defaults to 3600 seconds and is capped at 86400 (a day).

### Example: ffmpeg-over-ip

[ffmpeg-over-ip](https://github.com/steelbrain/ffmpeg-over-ip) runs ffmpeg on
another machine and tunnels the file reads and writes back, so the two machines
need no shared folder. Put its client binary and its client config side by side
where Stash can run them, then point the hook at:

```python
#!/usr/bin/env python3
import json, subprocess, sys

CLIENT = "/root/.stash/ffmpeg-over-ip/ffmpeg-over-ip-client"
job = json.load(sys.stdin)
# The client forwards its stdin to the server, so give it none.
sys.exit(subprocess.run([CLIENT] + job["ffmpeg_command"][1:],
                        stdin=subprocess.DEVNULL).returncode)
```

The client sends the arguments unchanged. To swap the encoder for the remote
machine's hardware one, use the `rewrites` option in the server's config.
Leave the client's `log` option unset: it would record file paths.

### Example: an HTTP encode service

A hook for a service that reads and writes the library over a shared mount,
answers `GET /health` with `{"ok": true}`, and takes the job on `POST /encode`
with a bearer token. The service picks the container from the output name and
renames its output into place when done, so the hook sends it `final_dst` and
moves the result to `dst`. The address and token come from the environment:

```python
#!/usr/bin/env python3
import json, os, sys, urllib.request

url = os.environ.get("SVE_OFFLOAD_URL", "").rstrip("/")
token = os.environ.get("SVE_OFFLOAD_TOKEN", "")
job = json.load(sys.stdin)
spec = {k: job.get(k) for k in ("op", "src", "crop", "out_w", "out_h", "start", "end", "encode")}
spec["scene_id"] = job["scene_id"] or job["image_id"]
spec["dst"] = job["final_dst"]  # this service picks the container from the name

def call(path, body=None, timeout=10):
    req = urllib.request.Request(
        url + path, data=json.dumps(body).encode() if body else None,
        headers={"Content-Type": "application/json", "Authorization": "Bearer " + token})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r).get("ok") is True

try:
    ok = bool(url) and call("/health") and call("/encode", spec, timeout=None)
    if ok:
        os.replace(job["final_dst"], job["dst"])
except Exception:
    ok = False
sys.exit(0 if ok else 1)
```

## Files the plugin writes

| File | What it is |
|---|---|
| `<name>.edited.<ext>`, `<name>.edited-2.<ext>`, ... | The edited video, next to the original. |
| `<name>.sve-bak` | The original of a cropped image clip. |
| `*.sve-partial` | An encode in progress. Removed when ffmpeg fails. A task that is killed can leave one behind; it is safe to delete. |
| `sve-pending.json` (plugin folder) | Edits that are encoded and not yet swapped in. |

To undo a scene edit, set the original file as primary on the scene's File Info
tab and delete the edited file.

## Limits

- The generate step replaces the scene's cover with a frame from the edited
  file. A cover you set by hand is replaced too.
- A re-encode does not carry subtitle streams.
- An ffmpeg failure shows only in the Stash log.

## Attribution

`cropMath.js` adapts coordinate helpers from
[react-easy-crop](https://github.com/ValentinH/react-easy-crop) (MIT License;
the notice is in the file).
