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

Click the "Random" button in the navigation bar to instantly jump to a random item, with behavior depending on your current page:

- **Scenes:**
  - On the main scenes page, the button selects a random scene from all scenes in your library.
  - On a performer, studio, tag, or group *scenes* page, it picks a random scene **from within that entity**.
  - When viewing a scene's detail page, clicking "Random" again selects a random scene from **all scenes** (not just from the previous filter).

- **Groups:**
  - On the main groups page, the button picks a random group.
  - Inside a group (group's scenes page), it selects a random scene from within that group.

- **Galleries & Images:**
  - On the main galleries page, the button picks a random gallery.
  - Inside a gallery (gallery's page), it selects a random image from that gallery.
  - When viewing an individual image (image detail page), the button selects a random image from **all images in the database**, not just from the current gallery.

- **Performers:**
  - On the main performers page, it picks a random performer.
  - Inside a performer's page (performer's scenes), it selects a random scene from that performer.
  - When viewing a scene's detail page, clicking "Random" again picks a random scene from **all scenes**.

- **Studios:**
  - On the main studios page, the button picks a random studio.
  - Inside a studio's page (studio's scenes), it selects a random scene from that studio.
  - When viewing a scene's detail page, clicking "Random" again selects a random scene from **all scenes**.

- **Tags:**
  - On the main tags page, it picks a random tag.
  - Inside a tag's page (tag's scenes), it selects a random scene from that tag.
  - When viewing a scene's detail page, clicking "Random" again picks a random scene from **all scenes**, regardless of tag.

---

**Tip:** The Random button always selects from the *full library* when you are on a detail (scene or image) page, regardless of how you navigated there.

---

## Requirements
- Stash version v0.27.2 or higher.

## Development
- Written in JavaScript using the Stash Plugin API.
- Edit `random-button.js` to customize and reload plugins in Stash.

## Changelog
- 2.0.1:
  - The Random button now works on scene and image detail pages: when viewing an individual scene or image, clicking "Random" selects a random scene or image from the entire database.
  - Improved context awareness for the Random button on all major Stash entities (scenes, performers, studios, tags, groups, galleries, images).
  - When inside a group, tag, studio, performer, or gallery, the button picks a random scene or image from within that entity.
  - When on a group, tag, studio, performer, or gallery detail page (not listing scenes/images), the Random button selects a random group, tag, studio, performer, or gallery respectively.
  - Updated documentation.
- 2.0.0: Major upgrade! Now supports random navigation for performers, studios, groups, tags, galleries, and images (global and internal).
- 1.1.0: Initial public release with support for random scenes.
