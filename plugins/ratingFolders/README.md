# Rating Folders

Rate a scene in Stash and its file moves to the folder you chose for that rating.

```
9-10  ->  D:\Videos\Top
7-8   ->  D:\Videos\Keep
1-4   ->  D:\Videos\Trash
```

Your folders on disk end up matching your ratings, so they stay organized for anything that reads them directly (a VR player, a file browser, a backup job), and you can clear out the "Trash" folder yourself when you're ready.

Files are moved with Stash's own `moveFiles` GraphQL mutation, the one Stash uses when you move a file from its UI. Stash keeps tracking the file at its new path, so you don't need a rescan and your metadata, markers and play history stay attached.

## What it does

- **On rating change** (hook `Scene.Update.Post`): when a scene's rating is changed (in the scene page, the scene card or a bulk edit), the primary file of that scene is moved to the folder of the first matching rule. Edits that don't touch the rating are ignored.
- **Task "Preview rating folders (dry run)"**: logs what would happen to every rated scene. It never moves anything, whatever the settings.
- **Task "Apply rating folders to all rated scenes"**: does the same for real for every rated scene. It respects dry run, so with the default settings it only logs.
- **Optional rename** with a template such as `{performers} - {studio} - {date} - {title}`.
- **Sidecar files** with the same name (`.funscript`, including multi-axis ones like `.roll.funscript`, and `.srt`, `.vtt`, `.ass`, `.ssa` subtitles) move with the video by default.

## Safety

The plugin is built to never lose a file:

- **Dry run is on out of the box.** Until you turn on *Move files for real*, the plugin only writes `[DRY RUN] ... would move A -> B` lines to the Stash log (Settings > Logs; set the log level to Info or lower to see them).
- **Never deletes anything.** "Trash" is just a folder name. The plugin only moves files.
- **Never overwrites.** If the destination name is taken, it adds ` (2)`, ` (3)`... Stash also refuses to move onto an existing file, and if that happens the scene is left where it was and the error goes to the log. A sidecar whose destination name is taken stays where it is (with a warning).
- **Never creates folders.** If a rule's folder doesn't exist, nothing moves and the log tells you so. This catches typos in the settings.
- **Stays inside your libraries.** The destination must be inside one of Stash's library folders. It can't be a library marked "exclude video", and it can't match one of your Stash exclude patterns. Otherwise the file would disappear from Stash on the next scan.
- Files inside zip archives are skipped, and so are files Stash can't find on disk.
- Invalid settings (an unreadable rule, an unknown placeholder) stop the plugin before it moves anything. The error shows up in the log.
- Running it again is harmless: scenes already in the right place (including ones that got a ` (2)` suffix) are left alone.

## Installation

In Stash: *Settings > Plugins > Available Plugins*. Add the CommunityScripts source if you haven't already (`https://stashapp.github.io/CommunityScripts/stable/index.yml`), then install **Rating Folders**.

To install by hand, copy the `ratingFolders` folder into your Stash `plugins` folder and click *Reload plugins*.

You need Python 3.7 or newer on the PATH as `python` (the same Python other plugins use). The plugin uses only the Python standard library, so there's nothing to `pip install`.

## Configuration

*Settings > Plugins > Rating Folders*:

| Setting | What it does |
|---|---|
| **Rating rules** | `range=folder` pairs separated by `;`. Example: `9-10=D:\Videos\Top; 7-8=D:\Videos\Keep; 1-4=D:\Videos\Trash`. |
| **Folder for unrated scenes** | Where a scene goes when its rating is removed. Leave it empty (the default) to never move unrated scenes. |
| **Rename template** | Optional. Leave it empty to keep file names. |
| **Move files for real (turn off dry run)** | Off by default. Turn it on once the log shows what you expect. |
| **Leave sidecar files behind** | Off by default, so funscripts and subtitles move with the video. Turn it on to leave them where they are. |

### Rating rules

Ratings use Stash's 0-10 scale, whatever rating system your UI shows:

| Stars | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| 0-10 scale | 2 | 4 | 6 | 8 | 10 |

- `7-8` covers 7.0 to 8.9, so decimal ratings such as 8.5 fall inside it. If you write a decimal bound like `6.5-6.9`, it is used exactly.
- A single number works too: `10=D:\Videos\Best`.
- The first matching rule wins. A rating that matches no rule (5-6 in the example above) leaves the file where it is.
- Paths can be Windows (`D:\Videos\Top`), Linux or Docker (`/data/videos/top`) paths, as Stash sees them. They can't contain `;`.

### Rename template

Placeholders: `{title}`, `{studio}`, `{performers}` (up to 3, comma-separated), `{date}` (YYYY-MM-DD), `{year}`, `{code}`, `{rating}` (0-10), `{original}` (the current file name without its extension).

- An empty field is dropped together with the separator around it: `{performers} - {studio} - {title}` gives `Jane Doe - My Title` for a scene without a studio. Empty `()` and `[]` are removed too.
- Characters that aren't allowed in file names are replaced (`:` becomes ` - `, `/` becomes `-`, `?` and `*` are removed).
- Names are capped at 150 characters. The extension never changes.
- If the template gives an empty name for a scene, the current name is kept.

## Notes and limits

- Only the scene's primary file is moved. Any other files of the same scene stay where they are.
- Sidecar files are moved by the plugin after Stash moves the video, because Stash doesn't track `.funscript` files as files. Stash remembers `.srt` and `.vtt` subtitles by file name, so when they keep their name they keep working right away. When they are renamed (rename template or a ` (2)` suffix), the plugin asks Stash for two quick scans, of the video and then of the subtitles, so Stash links them under the new name.
- The plugin runs on the machine (or container) where Stash runs, so folders must be paths that Stash itself can see.

## License

AGPL-3.0, like the rest of CommunityScripts.

---

Made by the developer of ReelTier (https://reeltier.com), a free Windows app that does this from inside HereSphere and DeoVR.
