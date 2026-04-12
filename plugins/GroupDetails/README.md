# Group Details

`Group Details` is a UI plugin for Stash group pages.

It adds two computed metrics to each group card's stats area:

- **Top line:** total duration (`H:MM:SS`) on the left, native scene-count chip centered.
- **Second line:** resolution **bucket icon** (inline SVG from Font Awesome **Free** solid paths) right-aligned, below the first line so tag/group chips are not squeezed horizontally. Hover shows `Resolution average: Npx` (or `—` if none).

Buckets use average **vertical pixel height** of contributing scenes: **`<480`**, **`<720`**, **`≤1081`**, **`>1081`**. Icons are **display**, **film**, **expand**, **maximize** (FA 6.5.2 free-solid), chosen so each tier is visually distinct. Stash’s `PluginApi` Font Awesome export is incomplete for plugins, and Pro-only glyphs (regular SD/HD/4K marks) are not in Free, so icons are **not** loaded from `PluginApi`.

## Filtering rules

By default, both metrics only consider scenes whose `scene_index` for the current group is:

- `null`, or
- an integer in the inclusive range `0..89`

This excludes common trailer/bonus/out-of-band indices such as `-1`, `90`, `99`, etc.

### Plugin setting: Include all scenes

In **Settings → Plugins → Group Details**, enable **Include all scenes** to skip the `scene_index` filter and use every scene returned for the group. The **`duration > 600` seconds** rule for the average resolution metric still applies in both modes.

After changing this setting, reload the group page (or navigate away and back) so metrics refresh.

## Resolution rule

Average resolution is based on vertical pixels (`height`) with an additional duration filter:

- Include only eligible scenes where `duration > 600` seconds.
- Compute as `round(sum(height) / count)`.
- Display as `NNNp` (for example, `720p`).

## Duration rule

Total duration is the sum of eligible scene durations and is displayed as `H:MM:SS`.

## Data source

The plugin fetches group scene data through GraphQL (`findGroup`) and computes metrics in-browser. It does not rely on card DOM text parsing.

## Tooltips

**Duration chip:** every eligible scene included in the **total duration** sum, one line per scene:

`[scene_index] Title H:MM:SS`

**Resolution icon:** hover shows `Resolution average: Npx`, or `Resolution average: —` when no scenes qualify for the average (same duration, height, and scene_index rules as in **Resolution rule**).

Null `scene_index` is shown as `[null]`. Missing titles appear as `(no title)`.

The resolution **icon** sits inside a wrapper; inner SVG uses `pointer-events: none` so hover targets the wrapper and the native `title` tooltip appears reliably in Chrome.

## Updates not showing?

Stash loads UI plugins from a fixed URL (`/plugin/GroupDetails/javascript`). After you change plugin files, do a **full page reload** (F5 or Ctrl+Shift+R) so the browser fetches the new script (the server ETag changes when file content changes). In-app navigation alone can keep an older script in memory, so you may still see old tooltip text until you reload.
