# Group Details

`Group Details` is a UI plugin for Stash group card.

## Screenshot

![Group Details screenshot](./screenshot.png)

## What It Adds

- **Date line:** appends total duration (`H:MM:SS`) to the right side of the date row.
- **Chip list:** appends a resolution chip (PNG badge) to the end of `.card-popovers`.
- **Tooltips:** duration and resolution both expose native `title` tooltips.

## Data Source

Metrics are computed in-browser from GraphQL `findGroup` scene data (`id`, `title`, `files { duration height }`, `groups { group { id } scene_index }`).

## Scene Filtering

When **Include all scenes** is disabled (default), scenes are included only if `scene_index` is:

- `null`, or
- an integer in `0..89`

Exception: if the group has exactly **one scene**, scene-index filtering is bypassed for that group.

When **Include all scenes** is enabled, all returned scenes are included regardless of `scene_index`.

![Group Details Settings screenshot](./details.png)

## Sorting

Duration tooltip scene lines are sorted by:

1. `scene_index` ascending (`null` sorts as `90`)
2. duration descending
3. scene `id` ascending (stable tie-break)

## Duration Metric

- Uses each included scene's **max file duration**.
- Card value is total duration displayed as `H:MM:SS`.
- Tooltip lists every included scene as:
  - `N. Title H:MM:SS` when `scene_index` is present
  - `Title H:MM:SS` when `scene_index` is null

## Resolution Metric

Average resolution uses vertical pixels (`height`) from each included scene's tallest file:

- For groups with **exactly one total file**, the duration gate is bypassed.
- Otherwise, only scenes with `duration > 600` are eligible.
- Resolution average is `round(sum(height) / count)`.
- Tooltip format is:
  - `Resolution Average: <N>p`
  - or `Resolution Average: —` when no eligible average exists.

Resolution chip empty/dash behavior:

- If there are no files (or single-file case with unusable height): render nothing.
- If `totalFileCount > 1` and no eligible average: render `—`.

## Resolution Badge Mapping

The plugin picks a PNG badge using a 2% tolerance (`>= 98%` of target resolution):

- `< 234` -> `144p.png`
- then highest match from:
  - `240`, `360`, `480`, `720`, `1080`, `1440 (2k)`, `2160 (4k)`, `2880 (5k)`, `3160 (6k)`, `4320 (8k)`

## Assets And Build

Badges are authored as PNG files in `assets/` and embedded into `images.js` as base64 data URIs.

- Source files: `plugins/GroupDetails/assets/*.png`
- Generated file: `plugins/GroupDetails/images.js`

Regenerate `images.js` after changing PNGs:

```bash
bash build.sh
```

`build.sh` reads `assets/*.png`, sorts filenames deterministically, and rewrites `images.js`.

## Updates Not Showing?

After editing plugin files, perform a **full page reload** (F5 / Ctrl+Shift+R). In-app navigation can keep an older script in memory.

## Gen AI Assisted Plugin Authorship
This plugin was generated with the help of Generative AI (Cursor).

Per the draft guidelines of [#678]
- ✅ LLM use is openly disclosed.
- ✅ Code is reviewed by a human.
- ✅ Human testing and validation was performed.
- ✅ You take full responsibility for the code (including license compliance).