# scrollFeed (mobileWallLayout)

Discussion: https://discourse.stashapp.cc/t/mobile-wall-layout/6160

Turns Stash's **Markers** (`/scenes/markers`), **Images** (`/images`) and
**Scenes** (`/scenes`, wall view) walls into a scrollable mobile feed:
full-width single-column layout, video play-on-visibility, and DOM-ordered
loading that keeps the feed watchable over cellular and degrading
connections.

The plugin is published under the filename `mobileWallLayout` (and that's
still the internal ID, so existing installs upgrade cleanly). The display
name it presents in Stash's Plugins panel is `scrollFeed`.

## What it does

1. **Full-width single-column layout on touch devices.** By default, Stash's
   walls use `react-photo-gallery`, which calculates `position: absolute`
   offsets for a multi-column brick layout. On phones those offsets produce
   items that are too small to tap through comfortably. The plugin injects
   a `<style>` tag wrapped in a `@media (pointer: coarse)` query to override
   them. Touchscreens get the single-column feed. Desktop and mouse-driven
   viewports keep Stash's layout.

2. **Play-on-visibility.** Stash marks wall previews with `autoPlay`, so a
   20-card page can fire 20 simultaneous playbacks, and iOS Safari bogs
   down. An `IntersectionObserver` plays each clip at 10% visibility and
   pauses it when it leaves the viewport. In practice 2 to 3 clips play at
   once, which is what you want when scrolling a feed. The plugin removes
   the `autoplay` attribute from wall videos so only this observer starts
   playback.

3. **DOM-ordered loading.** When the wall mounts, React starts fetches for
   every video on the page. Clips within two screens of the viewport keep
   those fetches. Clips further down have their fetch cancelled and join an
   ordered queue. The queue restores them top-down as you scroll toward
   them, 2 at a time, advancing on `canplay` or a 500ms fallback.

4. **Releasing far-off clips.** A paused video that still has a source keeps
   its decoder and buffer. Clips more than five screens away are paused and
   unloaded to free memory and decoders. They load again when you scroll
   back within two screens. The gap between the two distances stops a clip
   from being unloaded and refetched on every small scroll.

5. **Stall recovery.** In the author's testing, Safari (iOS and macOS)
   sometimes freezes Stash's VP9/WebM image-clip previews on their last
   frame instead of looping. A light check every 500ms restarts an in-view
   clip that is stuck at its end. A clip that becomes playable while already
   in view now starts playing without needing to be scrolled out and back.

6. **AV1 fallback for image clips.** In the author's testing, Safari's AV1
   decoder can stop working mid-session until Safari restarts. When an image
   clip's full file fails to decode, the plugin swaps in the clip's
   generated preview so the lightbox or image page shows the clip at lower
   resolution instead of an empty box. The preview keeps the full file's
   size on screen. It swaps only if the preview exists, and puts the full
   file back if the preview fails too. A slide that is off screen stays
   paused. This applies on every page, not only the walls.

## Target pages

The layout and video behaviour are active only on `/scenes/markers`,
`/images` and `/scenes`. On `/scenes` they take effect in wall view; grid
and list views have no wall videos, so nothing changes there. From Stash
v0.32.0, scene wall videos exist only when the wall playback setting is
"video"; earlier versions show a scene's video preview on the wall whenever
one exists. The plugin
removes its style tag and disconnects its observers when you navigate away.

The layout change applies on touch devices only. The video behaviour
(play-on-visibility, ordered loading, releasing far-off clips, stall
recovery) runs on every device, including desktop. The AV1 fallback in
item 6 runs on every page.

## Tuning

The main knobs are constants in `mobileWallLayout.js`:

| Constant | Default | Effect |
|---|---:|---|
| `threshold` (play IntersectionObserver) | `0.1` | Lower = scroll feels continuous (more clips partially playing); higher = stricter focus on the clip in view. |
| `_MAX_CONCURRENT_LOADS` | `2` | Higher = queued clips finish sooner but each loads slower; lower = top clips get more uncontested bandwidth but the tail waits longer. |
| `_LOAD_ADVANCE_MS` | `500` | Short = every queued video starts fetching sooner (better for degrading reception); long = top clips get more solo time before the pipe re-splits. |
| `_NEAR_SCREENS` | `2` | How many screen heights ahead of the viewport a clip starts loading. Clips this close when the wall first renders keep Stash's own fetch. |
| `_FAR_SCREENS` | `5` | How many screen heights from the viewport a clip must be before it is unloaded. Keep it larger than `_NEAR_SCREENS`. |
| `_STALL_POLL_MS` | `500` | How often the stall check runs. |

## Retention

`react-photo-gallery@8.0.0` does not virtualize: every item in the current
page stays in the DOM. A clip keeps its downloaded bytes while it stays
within five screens of the viewport, so scrolling back a short way resumes
instantly even if the network has since dropped. Clips further away are
released and refetch when you come back. Page-change remounts the gallery
and resets state.

## Changes since 3.0

- **3.1:** A clip that becomes playable while already in view now starts
  playing. Before, it could stay paused until scrolled out and back.
- **3.2:** Restarts previews that Safari freezes on their last frame.
- **3.3:** Falls back to an image clip's preview when Safari fails to decode
  the full file (AV1).
- **3.4:** Play-on-visibility and ordered loading now also run on the
  `/scenes` wall. Clips far off screen are unloaded to free decoders and
  memory. Wall videos no longer start themselves when their source is
  restored off screen.
- **3.5:** The single-column layout now also applies to the `/scenes` wall
  on touch devices.
- **3.6:** Clips are loaded at two screens away but unloaded only at five,
  so scrolling near the edge no longer refetches the same clip repeatedly.
- **3.7:** Clips near the viewport keep their source when the wall first
  renders. This is meant to reduce the pause when Stash refetches the list,
  for example after adding a tag or changing a filter. Also in this
  release: a clip already loading is no longer restarted when it scrolls
  into view; a clip unloaded mid-load and scrolled straight back now loads
  again instead of staying blank; and the AV1 fallback keeps the clip's
  size, checks the preview exists, and leaves off-screen slides paused.

## Compatibility

Requires `IntersectionObserver`, `MutationObserver`, `WeakMap`, `WeakSet`,
`Element.isConnected`. All supported by mobile Safari 12.1+, Chrome,
Firefox, and Edge.
