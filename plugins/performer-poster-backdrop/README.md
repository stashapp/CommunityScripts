# Performer Poster Backdrop (Stash UI Plugin)

Adds a blurred poster-style backdrop behind performer headers using the performer’s poster image.

![Performer Poster Backdrop example](https://raw.githubusercontent.com/worryaboutstuff/performer-poster-backdrop/main/assets/performer-poster-backdrop-example.png)


## Features

- Applies only to **Performer pages**
- Uses the performer’s **poster image** as a background layer
- Adjustable:
  - Opacity
  - Blur strength
  - Vertical image alignment
- Supports **per-performer Y-offset overrides**
- Blank settings automatically fall back to defaults

## Installation

1. Copy the following files into your Stash UI plugins directory:
   - `performer-poster-backdrop.yml`
   - `performer-poster-backdrop.js`
   - `performer-poster-backdrop.css`

2. In Stash, go to **Settings → Plugins**
3. Find **Performer Poster Backdrop**
4. Adjust settings if desired and click **Confirm**
5. Refresh a performer page

## Settings

### Backdrop opacity
Controls how visible the backdrop is.

- Range: `0`–`1`
- Default: `1`
- Examples:
  - `0.7` → subtle
  - `0.5` → very soft
  - `0` → invisible

Leaving this field blank uses the default.

### Backdrop blur
Controls how blurred the backdrop appears (in pixels).

- Default: `10`
- Examples:
  - `5` → light blur
  - `15` → strong blur
  - `0` → no blur

Leaving this field blank uses the default.

### Default Y offset
Controls the vertical alignment of the backdrop image.

- Range: `0`–`100`
- Default: `20`
- Meaning:
  - `0` → favor top of image
  - `50` → center
  - `100` → favor bottom

Leaving this field blank uses the default.

## Per-performer Y overrides

Use this when a specific performer’s poster needs different vertical positioning.

Enter overrides as a **comma-separated list** in a single text field.

### Format

`PERFORMER_ID:OFFSET`

### Example

`142:35, 219:20, 501:50`



Accepted separators:
- `:` (recommended)
- `=`
- `-`

Whitespace is ignored.
