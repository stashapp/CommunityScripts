# Play Next

Play Next is a UI plugin for [Stash](https://stashapp.cc/) that lets you build
an ordered, one-shot override queue without interrupting the scene currently
playing.

Hover a scene card and press **Shift+N**. Selected scenes play next in the order
you chose them, then Stash resumes the original playback queue.

## Features

- Adds scenes to an ordered Play Next queue with **Shift+N**.
- Works with the main scene grid, the native queue, Similar Scenes, and
  lightweight scene-card layouts used by skins and plugins.
- Keeps current playback running while the queue is assembled.
- Shows a pink outline when the scene under the pointer is selectable.
- Shows the ordered overrides inside the player queue.
- Removes an already queued scene by hovering it and pressing **Shift+N**
  again.
- Provides per-scene **Remove** buttons and **Clear all / Clear remaining**.
- Uses **Shift+Alt+N** to clear pending overrides.
- Restores Stash's original URL-encoded playback queue after the final
  override.
- Does not claim left-click, middle-click, right-click, double-click, drag, or
  context-menu behavior.

## Install with Stash Plugin Manager

In Stash, open **Settings -> Plugins -> Available Plugins**, use the default
**Community (stable)** source, find **Play Next**, and install it.

Until the CommunityScripts pull request is merged, the maintainer's source can
be added manually:

```text
https://raw.githubusercontent.com/MrX-Builds/Play-Next/main/index.yml
```

## Manual installation

1. Download `PlayNext_v1.1.1.zip` from the
   [v1.1.1 release](https://github.com/MrX-Builds/Play-Next/releases/tag/v1.1.1).
2. Extract the ZIP.
3. Copy the enclosed `PlayNext` folder into the Stash plugins folder.
4. Confirm the manifest path is `.../plugins/PlayNext/PlayNext.yml`.
5. In Stash, select **Settings -> Plugins -> Reload plugins**.
6. Hard-refresh the browser page with **Ctrl+F5**.

## Usage

1. Open or focus a Stash scene player.
2. Hover a scene card. A pink outline confirms selection readiness.
3. Press **Shift+N** to append it.
4. Repeat with other scenes in the order you want them played.

Press **Shift+N** over an already queued scene to remove it. Press
**Shift+Alt+N** to clear the queue. If an override is already playing, it
finishes normally while the remaining overrides are cleared.

The active player and card window may be separate browser windows, but they
must use the same Stash origin (protocol, host, and port).

## Read-only boundary

Play Next makes one read-only `findScene` GraphQL query when a card is selected.
It sends no GraphQL mutations and does not create, edit, delete, tag, organize,
or otherwise modify Stash metadata, files, settings, or the database.

## Compatibility and testing

Version 1.1.1 targets the current React/video.js Stash interface and was checked
against a live Stash v0.32.0 server plus the upstream `ScenePlayer`, `ScenePage`,
and `SceneQueue` interfaces. Automated checks cover plugin registration,
Similar Scenes selection, ordered override transitions, original-queue restore,
manifest integrity, and absence of mouse-button interception.

Stash's UI plugin API is experimental, so future interface changes may require
a compatibility update. Third-party skin and plugin combinations cannot all be
tested exhaustively.

## LLM-assisted development disclosure

Version 1.1.1 was developed with LLM assistance. The maintainer reviewed the
code, human-tested it in a live Stash instance (including ordered multi-scene
overrides, Similar Scenes selection, cancellation, and original-queue restore),
and accepts responsibility for the code and license compliance.

## License

MIT


