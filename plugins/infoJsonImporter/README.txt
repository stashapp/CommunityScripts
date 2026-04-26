Info JSON Importer — Stash Plugin
==================================
© David Smith 2026 · david@maxprovider.net
Version: 1.0.0  |  Created: 26 April 2026

Imports metadata from yt-dlp .info.json files directly into Stash.
For every scene in your Stash library, if a matching .info.json file
exists alongside the video, the following fields are imported:

  - Title
  - Date (upload date from the source site)
  - Studio (from the uploader/channel name)
  - Tags (all tags from the source site)
  - Description

Studios and tags that do not already exist in Stash are created
automatically during the import.

FILES
-----
infoJsonImporter.yml   Plugin configuration (Stash reads this)
infoJsonImporter.py    Plugin logic
setup.sh               Interactive setup script
README.txt             This file

REQUIREMENTS
------------
- Stash v0.25.0 or later
- Python 3 installed and accessible as 'python3'
- pip (to install the 'requests' library)
- yt-dlp .info.json files saved alongside your video files

Your video filenames must follow the yt-dlp naming format with the
video ID in square brackets, and the .info.json file must have the
same base name as the video:

  Some_Video_Title [ph63841ed468601].mp4
  Some_Video_Title [ph63841ed468601].info.json  ← this is what we read

INSTALLATION
------------
1. Download all plugin files into a folder on your computer

2. Run the setup script from that folder:

     chmod +x setup.sh
     ./setup.sh

   The setup script will:
   - Ask for your Stash API key
   - Ask for your Stash plugins folder location
   - Write the API key into the plugin
   - Copy the plugin files to the correct location
   - Install the required 'requests' Python library

3. Open Stash in your browser

4. Go to Settings → Plugins and click Reload Plugins

5. Go to Settings → Tasks — you will see Info JSON Importer listed

GETTING YOUR STASH API KEY
--------------------------
In Stash go to:
  Settings → Security → API Key → Generate

Copy the key that appears. You will paste it when setup.sh asks for it.

If you do not have authentication enabled on your Stash (no username/
password required to access it), you can leave the API key blank when
setup.sh asks — the plugin will connect without one.

YOUR STASH PLUGINS FOLDER
--------------------------
The default location is:

  ~/.stash/plugins/

If you have configured Stash to use a different data directory, your
plugins folder will be inside that directory instead. You can find it
in Stash under Settings → System → Paths.

The setup script asks you for this path and defaults to ~/.stash/plugins/
if you just press Enter.

RUNNING THE PLUGIN
------------------
Two tasks are available under Settings → Tasks → Info JSON Importer:

  Dry Run (preview only)
    Scans all scenes and shows what would be imported — titles, dates,
    studios and tag counts — without making any changes to Stash.
    Always run this first to verify the plugin is working correctly.

  Import Info JSON
    Performs the actual import. Updates all scenes that have a matching
    .info.json file. Creates any missing studios and tags automatically.
    On a large library this may take 30-60 minutes.

Plugin output appears in Stash under Settings → Logs. Set the log
level to Debug to see per-scene detail.

A summary is shown at the end:

  Scenes scanned:       Total scenes in your Stash library
  Info JSON found:      Scenes with a matching .info.json file
  No JSON found:        Scenes with no .info.json (will be skipped)
  No video file:        Scenes whose video file could not be found
  Successfully updated: Scenes updated in Stash (live run only)

RE-RUNNING
----------
The plugin can be re-run safely at any time. It overwrites existing
metadata with whatever is in the .info.json file, so running it again
after adding new .info.json files will pick up the new ones.

TROUBLESHOOTING
---------------
Plugin does not appear in Stash
  Make sure both infoJsonImporter.yml and infoJsonImporter.py are in
  the same folder inside your plugins directory, and click Reload Plugins.

401 Unauthorized in logs
  Your API key is missing or incorrect. Re-run setup.sh and enter the
  correct key, then reload the plugin.

0 scenes updated / runs instantly with no output
  Check Settings → Logs with Debug level. If you see a connection error,
  verify Stash is running and the API key is correct.

High number of scenes with no JSON found
  Your .info.json files may be in a different location or have different
  names than the video files. The plugin looks for a .info.json file
  with exactly the same base name as the video file.

Plugin finishes but metadata not appearing in Stash
  Run a Metadata Scan in Stash (Settings → Tasks → Scan) after the
  import to ensure Stash refreshes its display.

NOTES
-----
- The plugin never modifies, moves or deletes your video files
- Only scenes already in your Stash library are processed
- Scenes without a matching .info.json file are skipped silently
- Tags and studios are created with the exact names from the JSON file
- Description is imported as the Stash 'Details' field on each scene
