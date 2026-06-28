# Extract Embedded Subtitles

A Stash plugin that pulls **embedded text subtitle tracks** out of your video files and writes them as external `.srt` sidecar files. Stash already displays external captions, so once the files exist they show up in the video player's caption menu—this just automates creating them.

Addresses [stashapp/stash#3875](https://github.com/stashapp/stash/issues/3875).

## Why a plugin?

Video.js (Stash's player) cannot render *embedded* subtitle tracks directly, and the maintainers' preferred path for this feature is a plugin that generates sidecar `.srt` files (see the issue discussion). This plugin does exactly that, naming the files so Stash's built-in caption matcher attaches them automatically.

## What it does

- Uses `ffprobe` to find subtitle streams in each scene's file(s).
- Extracts each **text** track (SubRip, ASS/SSA, mov_text, WebVTT, …) to `videoname.<lang>.srt` next to the video, matching Stash's caption naming convention (`pkg/file/video/caption.go`).
- Triggers a scan of the affected folders so the captions appear without you having to manually rescan the whole library.

### Limitations

- **Image-based subtitles** (PGS / Blu-ray, VobSub / DVD, DVB) are *skipped*—they're bitmaps and can't be converted to text without OCR.
- **ASS/SSA styling** (fonts, positioning, karaoke) is lost when converting to SRT. This is a deliberate, predictable trade-off; the original file is never modified.
- Stash stores one caption per language, so if a file has two tracks in the same language only the `default` one is extracted.

## Install

1. Copy the `extractSubtitles` folder into your Stash `plugins` directory.
2. Make sure `stashapp-tools` is available to the Python that Stash uses: `pip install stashapp-tools` (or use the **PythonDepManager** community plugin with the bundled `requirements.txt`).
3. `ffmpeg`/`ffprobe` must be on `PATH`, or set their paths in Stash **Settings → System → FFMPEG**.
4. In Stash, **Settings → Plugins → Reload Plugins**.

## Use

- **One-off / whole library:** **Settings → Tasks → Plugin Tasks → Extract Embedded Subtitles → run.** This walks every scene, extracts subs, then rescans the touched folders.
- **Ongoing additions:** enable **Extract On Scan** in the plugin settings. New scenes get their subtitles extracted on creation and their folder rescanned. For a large *initial* import, prefer the one-off task instead of the hook to avoid many small rescans.

### Settings

| Setting | Default | Description |
| --- | --- | --- |
| Overwrite Existing | off | Re-extract even if a matching `.srt` already exists. |
| Extract On Scan | off | Auto-extract when a new scene is created. |

## Notes

This is a community plugin and not part of Stash core; it complements, rather than replaces, in-player rendering of embedded tracks.

## Development

LLM-assisted, human-reviewed, and tested. Subtitle extraction was verified end-to-end against a real `ffmpeg`/`ffprobe` using a multi-track MKV (SubRip + ASS→SRT conversion + an untagged track), and the output filenames were checked against Stash's caption-matching rules in `pkg/file/video/caption.go`.
