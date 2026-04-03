# Mobile Wall Layout

https://discourse.stashapp.cc/t/mobile-wall-layout/6160

Makes the wall-mode gallery render as a single full-width column on mobile
devices, on the **Markers** (`/scenes/markers`) and **Images** (`/images`) pages.

By default, Stash's wall mode uses `react-photo-gallery`, which calculates
`position: absolute` offsets for a multi-column brick layout. On small screens
this produces items that are too small to comfortably tap and browse. This
plugin overrides those offsets so each item spans the full width of the screen,
making marker previews and images easy to scroll through on a phone.

## Behaviour

- Applies only on **touch-screen devices** (`pointer: coarse`) — correctly
  targets phones and tablets without triggering on narrow desktop browser windows.
- Activates and deactivates automatically as you navigate between pages.
- Has no effect on desktop or mouse-driven viewports.

## Implementation note

The fix injects a `<style>` tag with `!important` rules wrapped in a
`@media (pointer: coarse)` query, rather than setting inline styles via
JavaScript or checking `window.innerWidth` at runtime. This is necessary
because `react-photo-gallery` continuously recalculates and re-applies its own
inline styles; a CSS rule with `!important` wins unconditionally regardless of
render timing. Using `pointer: coarse` instead of a pixel-width threshold
prevents the fix from activating on narrow desktop windows.
