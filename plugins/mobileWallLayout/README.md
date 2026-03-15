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

- Applies only when `window.innerWidth ≤ 960px` — covers all current phones
  including large flagships in landscape (e.g. iPhone 16 Pro Max: 932px,
  Galaxy S24 Ultra: 915px), while excluding tablets (iPad mini landscape: 1024px).
- Activates and deactivates automatically as you navigate between pages.
- Re-evaluates on orientation change (portrait ↔ landscape).
- Has no effect on desktop or tablet viewports.

## Implementation note

The fix injects a `<style>` tag with `!important` rules rather than setting
inline styles via JavaScript. This is necessary because `react-photo-gallery`
continuously recalculates and re-applies its own inline styles; a CSS rule with
`!important` wins unconditionally regardless of render timing.
