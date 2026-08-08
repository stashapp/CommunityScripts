# Scene Thumbnails

Scene Thumbnails adds a dismissable thumbnail grid to Stash scene pages. Each tile shows a frame of the video; clicking a tile seeks playback to that point, and a live highlight follows the current playing position. The grid lives in a drawer at the bottom of the scene panel.

Built entirely in the browser from Stash's existing scene sprite and WebVTT — no generation, no ffmpeg, nothing written to disk. The only thing saved is your grid-size preference, kept in the browser (localStorage).

## Features

- Thumbnail grid in a dismissable drawer at the bottom of the scene panel (open with the "Scene Thumbnails" toggle below the video)
- Click a tile to seek to that point in the video; clicking a tile dismisses the drawer
- Live highlight that tracks playback position

## Requirements

- Stash with scene sprites generated (Generate → Sprites)

## Credits

Inspired by and partially derived from Mosaic Poster (https://discourse.stashapp.cc/t/mosaic-poster/12358), part of stashapp/CommunityScripts. Mosaic Poster replaces the pre-playback poster; Scene Thumbnails adds a thumbnail grid shown in a dismissable drawer at the bottom of the scene panel, with a live highlight.

## License

Licensed under the GNU Affero General Public License v3.0. See LICENSE.
