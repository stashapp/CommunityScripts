# scrollFeed (mobileWallLayout)

Turns Stash's **Markers** (`/scenes/markers`) and **Images** (`/images`) wall
into a scrollable mobile feed — full-width single-column layout, video
play-on-visibility, and DOM-ordered loading that keeps the feed watchable
over cellular and degrading connections.

The plugin is published under the filename `mobileWallLayout` (and that's
still the internal ID, so existing installs upgrade cleanly). The display
name it presents in Stash's Plugins panel is `scrollFeed`.

## What it does

1. **Full-width single-column layout on touch devices.** By default, Stash's
   wall uses `react-photo-gallery`, which calculates `position: absolute`
   offsets for a multi-column brick layout. On phones those offsets produce
   items that are too small to tap through comfortably. The plugin injects
   a `<style>` tag wrapped in a `@media (pointer: coarse)` query to override
   them. Touchscreens get the mobile feed; desktop and mouse-driven
   viewports are untouched.

2. **Play-on-visibility.** Stash marks marker previews with `autoPlay`, so
   a 20-card page can fire 20 simultaneous playbacks — iOS Safari bogs down
   past its ~20-`<video>` decoder ceiling. An `IntersectionObserver` plays
   each clip at 10% visibility and pauses it when it leaves the viewport.
   In practice 2–3 clips play concurrently, which is what you want when
   scrolling a feed.

3. **DOM-ordered loading.** When the wall mounts, React starts parallel
   fetches for every video on the page. On cellular that splits the uplink
   20 ways and no video is playable for a long time. The plugin cancels
   those fetches, pushes the videos onto an ordered queue, and re-issues
   them top-down — 2 concurrent at a time, advancing on `canplay` or a
   500ms fallback. The top clip is playable quickly, and the entire page
   is in-flight within ~5 seconds, so moving into a weaker-signal area
   doesn't leave the bottom of the page with zero bytes.

## Target pages

Active only on `/scenes/markers` and `/images`. Deactivates (removes its
style tag, disconnects its observers) on navigation away. No effect on any
other view.

## Tuning

The primary knobs are declared as constants at the top of the load-queue
section in `mobileWallLayout.js`:

| Constant | Default | Effect |
|---|---:|---|
| `threshold` (IntersectionObserver) | `0.1` | Lower = scroll feels continuous (more clips partially playing); higher = stricter focus on the clip in view. |
| `_MAX_CONCURRENT_LOADS` | `2` | Higher = entire page finishes sooner but each clip loads slower; lower = top clips get more uncontested bandwidth but the tail waits longer. |
| `_LOAD_ADVANCE_MS` | `500` | Short = every video starts fetching sooner (better for degrading reception); long = top clips get more solo time before the pipe re-splits. |

## Retention

`react-photo-gallery@8.0.0` does not virtualize — every photo in the
current page stays in the DOM. Video elements therefore keep their
downloaded bytes for the lifetime of the page, so scrolling back to a
clip you've already buffered resumes instantly even if the network has
since dropped. Retention scope is the current page; page-change remounts
the gallery and resets state.

## Compatibility

Requires `IntersectionObserver`, `MutationObserver`, `WeakMap`, `WeakSet`,
`Element.isConnected`. All supported by mobile Safari 12.1+, Chrome,
Firefox, and Edge.
