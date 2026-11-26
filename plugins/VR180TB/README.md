# VR 180 TB

I have lots of VR scenes that are 180-degree where the left and right eye images are vertical and they don't play properly in any of the current selections (180 LR, 360 mono, and 360 TB) in Stash.

This plugin adds a **180 TB** projection option to Stash's existing VR selector for 180-degree stereoscopic videos whose left and right eye images are stacked vertically.

Stash currently exposes an **180 LR** option, but the bundled `videojs-vr` implementation does not provide a native `180_TB` projection. This plugin reuses the existing 180-degree stereo geometry and remaps its texture coordinates for top/bottom stereo.

## Features

- Adds **180 TB** directly after Stash's built-in **180 LR** menu item.
- Uses Stash's native VR menu item class, so the new option matches the existing UI.
- Leaves built-in **180 LR**, **360 TB**, **360 Mono**, and **Off** behavior unchanged.
- Does not replace Video.js, Three.js, or Stash's player.
- Does not run a permanent polling interval.

## Installation

Install the plugin through the CommunityScripts source once available.

For manual installation, copy this directory into your Stash plugins directory and reload plugins:

```text
VR180TB/
├── README.md
├── VR180TB.js
└── VR180TB.yml
```

Hard-refresh the browser after installing or updating the plugin.

## Usage

Open a scene with a 180-degree top/bottom stereoscopic video and choose:

**VR selector → 180 TB**

The plugin first asks Stash/videojs-vr to create its normal **180 LR** hemisphere geometry, then remaps the two eye meshes:

| Eye | Native 180 LR UVs | 180 TB UVs |
| --- | --- | --- |
| Left | U `0..0.5`, V `0..1` | U `0..1`, V `0.5..1` |
| Right | U `0.5..1`, V `0..1` | U `0..1`, V `0..0.5` |

## Implementation notes

The current Stash VR menu is built on `@blaineam/videojs-vr`. Although older upstream changelog text referenced `180_TB`, the currently bundled projection list does not expose it.

Two implementation details are intentionally preserved:

1. `player.vr()` is initialized before `player.vrMenu()`.
2. The plugin uses Stash's native **180 LR** geometry as the base before remapping UVs.

The UV conversion is defensive. It only modifies geometry when the current UV ranges exactly match the expected native **180 LR** layout. If Stash or `videojs-vr` changes those internals in the future, the plugin leaves unexpected geometry untouched.

## Compatibility and limitations

This plugin depends on runtime details of Stash's current VR menu and `videojs-vr` integration, including the existing `VRMenuItem`, `loadVR()`, and eye-mesh geometry. A future Stash or `videojs-vr` update may require changes.

Validated with real **1920×3840 180-degree top/bottom stereoscopic video** in Chrome.

## Development

This contribution was LLM-assisted. The 180 TB behavior was developed interactively and human-tested against real media in Stash. The plugin code has been reviewed by me, the testing has been carried out by me with real VR videos on v0.31.1 of Stash. I take full responsibility for the plugin code and its license compliance.

## License

This plugin is intended for inclusion in the Stash CommunityScripts repository and is licensed under the repository's GNU Affero General Public License v3.
