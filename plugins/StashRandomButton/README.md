# Stash Random Button Plugin

[Plugin thread on Discourse](https://discourse.stashapp.cc/t/randombutton/1809)

Adds a "Random" button to the Stash UI, letting you instantly jump to a random scene, image, performer, studio, group, tag, or gallery—including random "internal" navigation (e.g. a random scene inside a studio).

## Features

- Adds a "Random" button to the Stash UI navigation bar.
- Supports random navigation for:
  - **Scenes** (global and within performer, studio, tag, group)
  - **Images** (global and within a gallery)
  - **Performers** (global)
  - **Studios** (global)
  - **Groups** (global)
  - **Tags** (global)
  - **Galleries** (global)
- Lightweight, no external dependencies.
- Uses Stash's GraphQL API.
- Simple, robust, and easy to maintain.

## Installation

1. **Download the Plugin**
   ```bash
   git clone https://github.com/Nightyonlyy/StashRandomButton.git
   ```

2. **Copy to Stash Plugins Folder**
   - Move the `StashRandomButton` folder to:
     - Windows: `%USERPROFILE%\.stash\plugins\`
     - Linux/Mac: `~/.stash/plugins/`
   - Ensure it contains:
     - `random-button.js`
     - `random-button.yml`
     - `random_button.css`

3. **Reload Plugins**
   - In Stash, go to `Settings > Plugins` and click "Reload Plugins".
   - The button should appear on those pages.

## Usage
Click the "Random" button in the navigation bar to jump to a random entity (scene, image, performer, studio, group, tag, or gallery) depending on your current page.
  - On internal entity pages (e.g., performer, studio, group, tag, gallery), the button picks a random scene or image from inside that entity.

## Requirements
- Stash version v0.27.2 or higher.

## Development
- Written in JavaScript using the Stash Plugin API.
- Edit `random-button.js` to customize and reload plugins in Stash.

## Changelog
- 2.0.0: Major upgrade! Now supports random navigation for performers, studios, groups, tags, galleries, and images (global and internal).
