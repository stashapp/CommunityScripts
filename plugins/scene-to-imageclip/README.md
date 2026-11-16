# Scene to ImageClip Converter

https://discourse.stashapp.cc/t/scene-to-imageclip-converter/6558

Turn scenes into Stash image clips — the looping, zoomable kind — and back, keeping the
file and its metadata. The plugin works two ways:

- **In a batch:** tag scenes `imageclip` and run one task, **Convert tagged scenes to image
  clips**. It renames the files, scans them and moves each scene's metadata onto its clip.
  Good for converting many scenes at once.
- **One item at a time:** a **Convert to clip** button on scene pages and a **Convert to
  scene** button on image clip pages. Good for a single item, and the only way back from
  clip to scene.

Both use the same naming: an image clip made from `video.mp4` is the file
`video.mp4.vclip`, or `video.mp4.3gp` if you set the image clip extension to `3gp` (see
Settings). No file is ever deleted.

An image clip is an Image whose file is a video. Stash plays it as a looping image.

## Requirements

- **Scan video extensions as image clips** turned on (`create_image_clip_from_videos: true`
  in `config.yml`, or Settings → Library).
- The image clip extension (`vclip` unless you change it) in Settings → Library → Image
  extensions. The convert and rename tasks add it for you; the buttons refuse to run without it
  (`clip_ext_not_configured`).
- Images scanned (`excludeimage: false`) on the library paths that hold your clips.
- For the buttons:
  - Stash v0.31.0 or later. The buttons read and write custom fields on scenes and images,
    which older versions do not have. The batch tasks do not need them.
  - At least one library root that scans both images and video. Files that cannot change
    type where they are get moved there (see Settings).
- The plugin folder must be writable: the buttons keep a small journal there while a
  toggle runs (see "If a toggle is cut off"), and renames on a filesystem without hard
  links take a lock file there.
- Python 3 with the standard library only. The official Stash Docker image has it.

The batch tasks check the clip settings and warn you if something is missing.

Windows: the path handling understands Windows paths (`C:\...`, `\\server\...`), but the
plugin has not been tested on a Stash running on Windows.

## Install

Copy the `scene-to-imageclip` folder into your Stash plugins folder, or install it from
the CommunityScripts source in Settings → Plugins:

```
<stash config dir>/plugins/scene-to-imageclip/
```

Then go to **Settings → Plugins → Reload Plugins** and reload the browser page.

### Upgrading from the separate clip-scene-toggle plugin

The buttons used to be a separate plugin, `clip-scene-toggle`. They are part of this
plugin now. If you have the old one installed:

1. If your copy has a **Recover interrupted toggles** task, run it once (Settings →
   Tasks), so no cut-off toggle is left in its journal. Older copies have no such task
   and nothing to recover.
2. Remove the `clip-scene-toggle` folder from your plugins folder and reload plugins.
3. If you had set **Destination root for moves**, set it again under this plugin.

While the old plugin is still enabled, this plugin does not add its own buttons, so you
never get two of each; the old plugin's buttons keep working until you remove it. Saved
scene data on your clips (the `clip_scene_toggle` custom field) is read by this plugin as
before.

## Batch conversion

### Workflow

```
1. Tag scenes with "imageclip" in Stash
2. Settings → Tasks → Plugins →
   "Convert tagged scenes to image clips (rename, scan, transfer)" → Run
```

The task renames the files, then puts two jobs in Stash's job queue behind itself and
ends: a scan of just the files it renamed, then the transfer task. Stash runs queued jobs
one at a time, in order, so the transfer starts once the scan is done. Watch all three in
Settings → Tasks (the job queue). The queued scan asks Stash to generate nothing, so
previews and thumbnails are not made ahead of time; run Generate if you want them.

A task cannot start a scan and wait for it, because the scan only starts once the task
has ended; that is why the work is split into a task that queues the rest.

#### By hand, in three steps

The convert task runs these same three steps for you. Run them yourself to re-run one
step, or to scan more than the renamed files:

```
1. Settings → Tasks → Plugins → "Rename imageclip Scenes to clip files" → Run
2. Run a library scan  (Settings → Tasks → Scan)
3. Settings → Tasks → Plugins → "Transfer metadata and clean up original scenes" → Run
```

The scan between steps 1 and 3 is important — Stash needs to discover the renamed files
as image clips before the metadata transfer can find them.

### What the tasks do

- **Convert tagged scenes to image clips** — the rename below, then it queues a scan of
  the files it renamed and the transfer task. A file renamed by an earlier run but never
  scanned or transferred (its old name is gone, its clip name is there) is queued again
  with them. When nothing was renamed and nothing is waiting, it queues nothing.
- **Rename** — finds all scenes tagged `imageclip`, renames their files on disk
  (`video.mp4` → `video.mp4.vclip`, or the extension you set), and sorts out any tag name
  variants (`image clip`, `image_clip`, `Image Clip`, etc.) into one canonical tag. It
  also adds the image clip extension to the image extensions if it is missing.
- **Transfer** — after you rescan, moves each old scene entry onto its new image clip
  the same way the **Convert to clip** button does (see the table below): the metadata,
  galleries and O count are copied, and the scene-only data (O and play history,
  markers, groups, stash IDs) is saved in the clip's `clip_scene_toggle` custom field,
  so **Convert to scene** can bring it back. Then it removes the scene record from the
  database. The clip keeps any tags and custom fields it already had. The scene is found
  by the clip's file path without its clip suffix (`.vclip` or the extension you set),
  matched exactly.

The tasks write their progress to the Stash log (Settings → Logs) and end with a count of
what they renamed, transferred, skipped and could not do.

### Good to know

- **Safe to re-run** — files already ending in `.vclip` (or the extension you set) are
  skipped. A second run of the convert task after a finished one queues nothing.
- **A cancelled scan is harmless** — if you cancel the convert task's scan, the transfer
  still runs after it, finds no new clip for the files the scan did not reach and leaves
  their scenes as they are. Run the convert task again (or scan and run the transfer
  task) to finish them.
- **Never overwrites** — if `video.mp4.vclip` already exists, `video.mp4` is not renamed
  and the log says so.
- **Multi-file scenes** — all files attached to a scene get renamed, not just the first.
- **Leftover variant tags** — tag variants like `Image Clip` are emptied of scenes but not
  deleted. Delete them yourself if you want; Stash will then let you add their names as
  aliases of `imageclip`. (If the canonical tag itself had a variant name, such as
  `Image Clip`, it is renamed to `imageclip` and keeps the old name as an alias.)
- **Old scene kept when something could not be copied** — if Stash does not answer while
  the galleries are copied, or the scene still has other files, the scene stays and the
  log says why. Running the transfer task again finishes it; the O count is never added
  twice.

## Buttons: Convert to clip / Convert to scene

1. Open a scene and press **Convert to clip**.
2. Open an image clip and press **Convert to scene**. The button only shows on images
   that play a video, so stills and gifs never get it.

While it works the button reads **Converting…**. When it is done the page opens the new
item. If something was not carried over, or there is a warning, the plugin shows it
first, with a button to open the new item. Going to clip always reports the cover image,
because a clip cannot keep it.

If it fails the button reads **Convert failed** and shows a code and a short message
beside it.

### Settings

Settings → Plugins → Scene to ImageClip Converter:

- **Destination root for moves.** Used by the buttons only. A library root, written as
  the path Stash sees (inside the container if you run Docker). It must scan both images
  and video. Leave it empty to use the first library root that scans both. If you have
  no such root, every toggle is refused with `bad_destination_root`.
- **Image clip extension.** Used by the buttons and the batch tasks. The extension added
  to a video's name to make it an image clip. Empty means `vclip`. A leading dot and
  capitals are ignored; a value that is not 1 to 16 letters and digits falls back to
  `vclip` with a warning in the log. An extension Stash scans as video (`mp4`, `mov` and
  the rest of Settings → Library → Video extensions) is refused with
  `clip_ext_is_video`.

#### Why `3gp`

Finder, Quick Look and Windows Explorer pick a file's player by its extension, so they
cannot preview a `.vclip`. A `3gp` file uses the same container as MP4 (ISO base media),
so an H.264 or AV1 clip renamed `video.mp4.3gp` plays in Quick Look and gets a thumbnail
in Finder; Microsoft lists `.3gp` with `.mp4` as an "MP4 Video file" for Windows. `3gp`
is not in Stash's default video extensions, so the file stays an image clip. Other
software that scans the same folders, such as a media server, will see the clips as
videos too. Existing `.vclip` clips keep working: the
buttons and the transfer task read both suffixes, nothing is renamed, and `vclip` stays in
the image extensions. Only new clips get the new extension. (If you later change it
again, clips named with the previous non-`vclip` extension are no longer recognised by
name.)

### How it works

Stash decides scene or image clip in two ways:

- by name: `name.mp4.vclip` (or `name.mp4.3gp` with that extension set) is an image,
  `name.mp4` is a video;
- by place: a video in a library root that scans images but not video becomes an image
  clip, when **Scan video extensions as image clips** is on.

The buttons always make clips by name (they add the image clip extension). They handle
clips made by place, and clips named `.vclip` whatever the setting, when they turn them
back into scenes.

Crossing that line always makes Stash create a new item. So the plugin does it in one
pass and copies the metadata itself:

1. Check the item's primary file: it is a video, it is on disk, it is inside a library
   root, and the destination root is valid. Check that no item in Stash already points
   at the new name.
2. Write a journal entry, then rename the file on disk. It adds or strips the clip
   suffix in place. If the item's own root cannot hold the other type, it moves the file into the
   destination root instead.
3. Scan that one path and wait for the scan to finish.
4. Find the new item at exactly the new path and copy the metadata onto it.
5. Queue a Generate job for the new item (thumbnails, previews and so on).
6. Delete the old record from the database (the file is never deleted), then clear the
   journal entry.

If the target file name is taken, the new name gets `.toggle-<id>` before the extension.
The move never replaces an existing file: it uses a hard link and then removes the old
name. On a filesystem without hard links (some network shares) it checks and renames
under a lock that all renames by this plugin share. The rename task moves files the same
way.

The scan of the new name is allowed 180 seconds plus one second for every 10 MB of the
file. Stash reads the whole file of a clip (it is an image to Stash, so it gets an
MD5), and a large clip on slow storage needs the time. If the scan is still running when
that runs out, the plugin stops it and waits for Stash to let go of the file before it
renames it back.

With **Calculate MD5 for videos** on, Stash treats the rename as a move and gives the new
item the old item's file row. The plugin handles that: the row is kept when the old
record is deleted. Items with more than one file are refused in that case
(`md5_multi_file`).

### What it changes

On disk:

- The file is renamed (the clip suffix added or removed), or moved into the destination
  root.
- Nothing is deleted. Sidecar files with the same base name (subtitles, funscripts) are
  not renamed or moved.
- While a toggle runs, a journal file sits in the plugin folder under `journal/`. It holds
  the old and new path of the file. It is removed when the toggle ends.

In the database:

- A new scene or image is created by the scan.
- The old scene or image record is deleted (`delete_file: false`). Its generated files
  (previews, sprites and so on) are deleted with it.
- Going to clip, scene-only data is saved on the image as JSON in the custom field
  `clip_scene_toggle`. Going back to scene, it is restored and the field is removed.

#### Fields

| Field | Scene → clip | Clip → scene |
|---|---|---|
| title, code, details, date, rating, organized, URLs | copied | copied |
| studio, performers, tags | copied | copied |
| galleries | added in a separate step, keeping any folder gallery the scan put the new item in; if Stash rejects them they are reported as dropped | same |
| director / photographer | director → photographer | photographer → director |
| your custom fields | copied | copied, minus `clip_scene_toggle` |
| O count | image O count raised to match | O history restored; O events added while it was a clip get the current time |
| O history timestamps | saved in the custom field | restored |
| play history, play duration, resume time | saved in the custom field | restored |
| groups (with scene number), stash IDs | saved in the custom field | restored; a group that was deleted meanwhile is reported as dropped |
| scene markers | saved in the custom field | recreated one by one (see below) |
| cover image | **dropped** (a new one is generated) | n/a |
| captions, interactive | **dropped**, reported only when the scene had them | n/a |

The plugin output lists what was carried and what was dropped. A clip made by the batch
tasks has no saved scene data, so turning it into a scene carries the fields in the
first rows only.

If saved data cannot be restored when a clip goes back to a scene (a marker Stash
rejects, for example because its tag was deleted, or a damaged or unreadable custom
field), the old image is **not** deleted. The same happens in either direction when Stash
does not answer while the galleries are copied. Its `clip_scene_toggle` custom field still
holds the saved data, and the plugin warns you. The old image's file has moved, so
Stash's **Clean** task would delete that image; copy what you need from it first.

#### Items with more than one file

Only the primary file is converted. The other files stay on the old record, which keeps
all its metadata. The plugin makes the next file the primary and removes the database
row of the file that moved (the file on disk is kept). You end up with two items: the
new one, and the old one with the remaining files. If that last step fails, the toggle
still succeeds with a warning, and Stash's **Clean** task removes the stale row.

If the old item's remaining file has the same content as the one that moved (a copy),
the new clip cannot be turned back into a scene: Stash adds the file to the old item by
fingerprint instead of making a new scene. The plugin refuses with `duplicate_content`,
renames the file back and removes the row Stash added, so the clip stays a clip and
nothing is left behind.

(The batch rename task, by contrast, renames every file of a tagged scene.)

### Undo

Press the button again on the new item. A clip that came from a scene goes back to a
scene with the saved data restored. Some things do not come back:

- A custom cover image.
- The old folder. If the first toggle moved the file into the destination root, the file
  stays there when you toggle back.
- The old name, if the first toggle added `.toggle-<id>` to avoid a name clash.
- A clip made from one file of a multi-file item, while the old item still holds a copy
  with the same content (see "Items with more than one file").

If something fails after the file was renamed, the plugin undoes it: it deletes the half
made item, renames the file back and rescans the old path. The old item is left as it
was. If only the final delete of the old record fails, the toggle still succeeds and
reports `old record not destroyed: #<id>`. You can delete that record yourself (keep the
file).

A message that ends with `(rollback incomplete: …)` means the undo could not finish.
Stash or the disk has changed and needs a look. The names inside are
`new_entity_kept`, `rename_back_failed`, `rescan_not_queued`, `lookup_failed`,
`stale_row_kept` and `scan_running` (Stash was still reading the file, so it was left at
the new name). The journal entry is kept, and the next toggle or the recover task tries
again.

### If a toggle is cut off

Stash stops the plugin when the browser request is cancelled while **Converting…** is
showing, for example when the tab is closed. A Stash restart stops it too. The journal
entry tells the plugin what was done so far. The next time any toggle runs, it first
finishes or rolls back every cut-off toggle. You can also run it yourself: Settings →
Tasks, then **Recover interrupted toggles** in the plugin tasks list.

- Cut off before the new item was complete: the new item is deleted, the file is
  renamed back and the old path is rescanned.
- Cut off after the new item was complete: the old record is deleted as usual.
- A toggle still running in another tab is left alone.
- If Stash does not answer or a step fails, the entry is kept and tried again next time.
- Stash numbers its jobs from 1 again after a restart. The entry records when its scan
  job was added, so recovery never stops or waits on a different job with the same number.
- If the disk does not match the journal (for example, both file names exist), or the
  scan result is not one clean new item, nothing more is touched. The entry is renamed to
  `journal/<id>.failed` and the log says so.

### Refusal codes

| Code | Meaning |
|---|---|
| `bad_args` | missing or invalid mode or id |
| `not_found` | no item with that id |
| `load_failed` | Stash did not answer the config or item query |
| `clip_ext_is_video` | the image clip extension setting is one of Stash's video extensions |
| `clip_ext_not_configured` | add the image clip extension (`vclip` by default) to the image extensions |
| `no_file` | the item has no file |
| `not_video` | the file is not a video (gif and webp clips are not supported) |
| `file_missing` | the file is not on disk |
| `outside_library` | the file is not under any library root |
| `bad_destination_root` | no valid destination root (see Settings) |
| `md5_multi_file` | Calculate MD5 for videos is on and the item has more than one file |
| `already_scene_route` / `already_clip_route` | the item is already the target type by its name or place |
| `collision` | the target name and its `.toggle-<id>` fallback both exist |
| `target_has_record` | an item in Stash already points at the new name (often a missing file). Run Stash's **Clean** task, then try again |
| `journal_unwritable` | the plugin cannot write its journal in the plugin folder |
| `cross_device` | a move would cross filesystems (there is no copy fallback) |
| `rename_failed` | the operating system refused the rename |
| `scan_failed` / `scan_timeout` | the one-file scan failed or took too long (rolled back) |
| `new_entity_not_found` / `ambiguous_new_entity` / `shared_file_row` | the scan did not produce one clean new item at the new path (rolled back) |
| `duplicate_content` | the file matched an existing item by fingerprint, so Stash added the file to that item instead of making a new one. The file is renamed back and the row Stash added is removed (if that fails, the message says `stale_row_kept`; Stash's **Clean** task removes it) |
| `find_failed` / `transfer_failed` / `generate_failed` | a step failed (rolled back) |

## Using both

- A clip made by the batch tasks can be turned back into a scene with **Convert to
  scene**, and a clip made with the button is left alone by the transfer task (its old
  scene is already gone). If a button toggle ended with a warning that the old scene was
  kept, the transfer task treats it the way the button would: it copies what is still
  missing and removes the scene only when everything is on the clip.
- **Convert to scene removes the `imageclip` tag** (any spelling). A scene converted with
  the rename task keeps the tag on its clip; without this, turning that clip back into a
  scene with the button would leave it tagged and the next run of the convert or rename
  task would turn it straight back into a clip. Its other tags come across as
  usual.

## Limits

- The buttons convert one item at a time; the batch tasks are the way to do many.
- Stash runs jobs one at a time. A button's scan may wait behind other jobs. The plugin
  allows 180 seconds of running time and 15 minutes in total, then stops the scan and
  rolls back with `scan_timeout`. Try again when Stash is idle.
- Moves must stay on one filesystem.
- gif and webp clips are not supported by the buttons.
- Going to clip raises the image's O count one step at a time, so a very large O count
  takes a moment.
- The scan time allowance assumes the file can be read at 10 MB/s or faster.
- The plugin talks to Stash on the address and port Stash reports (`localhost` when
  Stash listens on all addresses). Over https on `localhost`, the certificate is not
  checked; on any other host it is.
- The buttons' logs and output carry ids, counts, field names and codes only, never a
  path or a title; the journal file holds paths while a toggle runs. The batch tasks log
  file names, so you can see which files they renamed.
