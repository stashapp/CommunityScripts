# Info JSON Importer

**Imports metadata from yt-dlp `.info.json` files directly into Stash.**

Developed by [David Smith](mailto:david@maxprovider.net) · © David Smith 2026

---

## What It Does

When you download videos with [yt-dlp](https://github.com/yt-dlp/yt-dlp), it can optionally save a companion `.info.json` file alongside each video containing metadata from the source site — title, upload date, tags, uploader name, description and more.

This plugin scans every scene in your Stash library, looks for a matching `.info.json` file next to the video, and imports the following fields into Stash:

| Field | Imported As |
|---|---|
| `title` | Scene title |
| `upload_date` | Scene date |
| `uploader` / `channel` | Studio (created if not exists) |
| `tags` | Scene tags (created if not exists) |
| `description` | Scene details |

Studios and tags that do not already exist in Stash are created automatically during the import.

---

## Requirements

- Stash v0.25.0 or later
- Python 3 (accessible as `python3`)
- pip
- yt-dlp `.info.json` files saved alongside your video files

Your video filenames must follow the standard yt-dlp naming format with the video ID in square brackets, and the `.info.json` must share the same base name:

```
Some_Video_Title [ph63841ed468601].mp4
Some_Video_Title [ph63841ed468601].info.json  ← this is what the plugin reads
```

If you have existing videos without `.info.json` files, use [MetaFetch](https://github.com/stashapp/CommunityScripts) or run yt-dlp with `--write-info-json --skip-download` to generate them retroactively.

---

## Installation

### Using setup.sh (recommended)

1. Download all four plugin files into a folder on your computer
2. Run the setup script from that folder:

```bash
chmod +x setup.sh
./setup.sh
```

The script will:
- Ask for your Stash API key
- Ask for your Stash plugins folder location (defaults to `~/.stash/plugins/`)
- Write the API key into the plugin
- Copy the plugin files to the correct location
- Install the required `requests` Python library

3. Open Stash in your browser
4. Go to **Settings → Plugins** and click **Reload Plugins**
5. Go to **Settings → Tasks** — you will see **Info JSON Importer** listed

### Manual installation

1. Copy the `infoJsonImporter/` folder into your Stash plugins directory (typically `~/.stash/plugins/`)
2. Edit `infoJsonImporter.py` and set your API key:
   ```python
   API_KEY = "your-api-key-here"
   ```
3. Install the required dependency:
   ```bash
   pip install requests --break-system-packages
   ```
4. In Stash go to **Settings → Plugins → Reload Plugins**

---

## Getting Your Stash API Key

In Stash go to: **Settings → Security → API Key → Generate**

Copy the key that appears and paste it when `setup.sh` asks, or set it manually in `infoJsonImporter.py`.

> If your Stash instance has no authentication enabled (no username/password required), leave the API key blank.

---

## Usage

Two tasks are available under **Settings → Tasks → Info JSON Importer**:

### Dry Run (preview only)
Scans all scenes and shows what would be imported — titles, dates, studios and tag counts — **without making any changes to Stash**. Always run this first to verify the plugin is working correctly.

### Import Info JSON
Performs the actual import. Updates all scenes that have a matching `.info.json` file. Creates any missing studios and tags automatically.

> On a large library this may take 30–60 minutes. Plugin output appears in **Settings → Logs**. Set the log level to **Debug** to see per-scene detail.

---

## Summary Output

When complete, a summary is shown in the logs:

```
============================================================
Info JSON Importer complete
  Scenes scanned:       19306
  Info JSON found:      18119
  No JSON found:         1011
  No video file:          176
  Successfully updated: 18119
  Errors:                   0
============================================================
```

---

## Re-running

The plugin can be re-run safely at any time. It overwrites existing metadata with whatever is in the `.info.json` file, so running it again after adding new `.info.json` files will pick up the new ones.

---

## Troubleshooting

**Plugin does not appear in Stash**
Make sure both `infoJsonImporter.yml` and `infoJsonImporter.py` are in the same folder inside your plugins directory, then click **Reload Plugins**.

**401 Unauthorized in logs**
Your API key is missing or incorrect. Re-run `setup.sh` or edit the `API_KEY` line in `infoJsonImporter.py` directly.

**Runs instantly with no output**
Check **Settings → Logs** with Debug level. If you see a connection error, verify Stash is running and the API key is correct.

**High number of scenes with no JSON found**
Your `.info.json` files may have different names than the video files. The plugin looks for a `.info.json` with exactly the same base name as the video file.

**Plugin finishes but metadata not visible**
Run a Metadata Scan in Stash (**Settings → Tasks → Scan**) after the import to refresh the display.

---

## Notes

- The plugin never modifies, moves or deletes your video files
- Only scenes already in your Stash library are processed
- Scenes without a matching `.info.json` file are skipped silently
- Tags and studios are created with the exact names from the JSON file
- Description is imported as the Stash **Details** field on each scene
