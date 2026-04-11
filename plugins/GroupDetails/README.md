# Group Details

`Group Details` is a UI plugin for Stash group pages.

It adds two computed metrics to each group card's stats row, flanking the scene-count element:

- Left: total duration (`H:MM:SS`)
- Right: average vertical resolution (`###p`)

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

Hovering the duration or resolution values shows a multi-line list of contributing scenes, one per line:

`[scene_index] Title H:MM:SS`

Null `scene_index` is shown as `[null]`. Missing titles appear as `(no title)`.
The duration chip lists every scene in the duration scope; the resolution chip lists only scenes counted toward the `> 600s` average (with non-zero height).
