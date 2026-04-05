# Scene to ImageClip Converter

Turn tagged scenes into Stash image clips — the looping, zoomable kind — by renaming their files to `.vclip` and migrating metadata automatically.

## How it works

Stash has a built-in image clip feature: if a video file has a `.vclip` extension and `create_image_clip_from_videos` is enabled, Stash treats it as a looping image instead of a scene. This plugin handles the conversion for you in two steps:

1. **Rename** — finds all scenes tagged `imageclip`, renames their files on disk (`video.mp4` → `video.mp4.vclip`), and sorts out any tag name variants (`image clip`, `image_clip`, `Image Clip`, etc.) into one canonical tag.
2. **Transfer** — after you rescan, copies metadata (title, rating, performers, studio, tags, etc.) from the old scene entries to the new image clip entries, then removes the now-redundant scene records from the database.

No files are ever deleted. The rename just appends `.vclip`; the cleanup only removes database records.

## Setup

You need two things configured in Stash before this plugin will work:

1. **Enable image clip creation** — add this to your `config.yml` (or toggle it in Settings → System):
   ```yaml
   create_image_clip_from_videos: true
   ```

2. **Enable image scanning** on any library paths that contain your clips — in Settings → Libraries, make sure *Images* is checked (i.e. `excludeimage: false`). Otherwise Stash won't pick up the renamed files.

The plugin checks both of these and warns you if something's missing.

## Installation

Copy the `scene-to-imageclip` folder into your Stash plugins directory:

```
<stash config dir>/plugins/scene-to-imageclip/
```

Go to **Settings → Plugins → Reload Plugins**.

Requires Python 3 (included in the official Stash Docker image). No pip packages needed — stdlib only.

## Workflow

```
1. Tag scenes with "imageclip" in Stash
2. Settings → Tasks → Plugins → "Rename imageclip Scenes to .vclip" → Run
3. Run a library scan  (Settings → Tasks → Scan)
4. Settings → Tasks → Plugins → "Transfer metadata and clean up" → Run
```

The scan between steps 2 and 4 is important — Stash needs to discover the renamed files as image clips before the metadata transfer can find them.

## Good to know

- **Safe to re-run** — files already ending in `.vclip` are skipped.
- **Multi-file scenes** — all files attached to a scene get renamed, not just the first.
- **Leftover variant tags** — tag variants like `Image Clip` are emptied of scenes but not deleted. You can clean those up manually if you want.
- **What doesn't transfer** — scene markers and cover images. Markers are timestamp-based and don't make sense on image clips.
