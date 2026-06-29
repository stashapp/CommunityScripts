# Stash Metadata Embedder

A [Stash](https://stashapp.cc) plugin that embeds scene metadata and cover art directly into MKV and MP4 video files using ffmpeg. No re-encoding — all operations are stream copy, so processing is fast and lossless.

## Features

- Embeds title, date, performers, studio, tags, rating, details, and URL into video file metadata
- Attaches the Stash scene screenshot as a cover image (JPEG)
- Supports MKV and MP4 containers
- Dry run mode for safe previewing before any files are modified
- Handles Docker volume cross-device file operations safely

## Requirements

- [Stash](https://github.com/stashapp/stash) (the official Docker image includes everything needed)
- `ffmpeg` available in PATH or at a standard location (`/usr/bin/ffmpeg`, `/usr/local/bin/ffmpeg`)
- Python 3

## Installation

1. Create the plugin directory inside your Stash config folder:

```bash
mkdir -p ~/.stash/plugins/stash_metadata_embed
```

2. Copy both plugin files into it:

```bash
cp stash_metadata_embed.yml stash_metadata_embed.py ~/.stash/plugins/stash_metadata_embed/
```

3. In the Stash UI, go to **Settings → Plugins** and click **Reload Plugins**

The plugin will appear under **Settings → Tasks** in the Plugin Tasks section.

## Usage

Go to **Settings → Tasks** and scroll down to **Plugin Tasks**. You will see three tasks under **Metadata Embedder**:

| Task | Description |
|---|---|
| **Embed Metadata + Cover Image** | Embeds all metadata tags and attaches the scene screenshot as cover art |
| **Embed Metadata Only** | Embeds metadata tags only, skips the cover image |
| **Dry Run (log only)** | Logs what would be embedded without modifying any files |

Always run **Dry Run** first on a new installation to verify everything looks correct before committing changes to your files.

Progress and log output are visible in **Settings → Logs**. Set the log level to **Debug** for verbose output including the full ffmpeg command being run for each file.

## Metadata Field Mapping

| Stash Field | ffmpeg Tag | Notes |
|---|---|---|
| Title | `title` | |
| Details | `comment` | |
| Date | `date` | |
| Performers | `artist` | |
| Studio | `album_artist` | |
| Tags | `genre` | Comma-separated |
| Rating | `rating` | Converted from 0–100 to 0.0–10.0 |
| URL | `purl` | First URL only |
| Screenshot | attached cover image | Converted to JPEG before embedding |

You can verify what was written to a file using:

```bash
ffprobe -v quiet -print_format json -show_format yourfile.mkv
```

## Notes

- Files are processed in-place. The plugin writes to a temporary file on the same filesystem as the source, then atomically replaces the original.
- Only `.mkv` and `.mp4` files are processed. Other formats are skipped.
- Stash cover images are served as WebP and are automatically converted to JPEG before embedding, as MP4 containers do not support WebP attachments.
- If a scene has no files on disk, or the file path is not accessible from the container, it will be skipped with a warning in the log.

## Troubleshooting

**`Failed to fetch scenes from Stash`** — Check that the Stash server URL is reachable from within the plugin process. If running in Docker, ensure the plugin is connecting to `127.0.0.1` and not `0.0.0.0`.

**`ffmpeg not found`** — The plugin will log the paths it searched. Install ffmpeg or ensure it is on the PATH for the user running Stash.

**`Conversion failed` / codec errors** — Enable Debug logging to see the full ffmpeg stderr output for the failing file.

**`Cross-device link` error** — This is handled automatically. The plugin creates its temp files on the same filesystem as the source video.
