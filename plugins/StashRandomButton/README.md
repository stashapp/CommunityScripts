# Stash Random Button Plugin

Adds a "Random" button to the image & scenes page to quickly navigate to a random scene.

## Features
- Adds a "Random" button to the Stash UI.
- Selects a random scene via GraphQL query.
- Lightweight, no external dependencies.

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
Click the "Random" button in the navigation bar to jump to a random image or scene depending on the tab.

## Requirements
- Stash version v0.27.2 or higher.

## Development
- Written in JavaScript using the Stash Plugin API.
- Edit `random-button.js` to customize and reload plugins in Stash.
