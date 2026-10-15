# Minimal Theme

https://discourse.stashapp.cc/t/minimal/1421

A theme that brings content to the front.

It's still rough around the edges. Feedback is welcome.

For intended experience:

- Turn off studio images in card view.

## Screenshots

### Version 0.3.0

Taken on Stash v0.31.1 with demo content: fictional titles and names, blurred openly licensed photos (credits on the [screenshots branch](https://github.com/nexalapp/CommunityScripts/tree/screenshots)).

| Scenes | Scene |
|---|---|
| ![Scenes](https://raw.githubusercontent.com/nexalapp/CommunityScripts/43c9691b1c39e40be1e918faa9a0a75183ba956a/Theme-Minimal/desktop-scenes.jpg) | ![Scene](https://raw.githubusercontent.com/nexalapp/CommunityScripts/43c9691b1c39e40be1e918faa9a0a75183ba956a/Theme-Minimal/desktop-scene.jpg) |

| Performer | Studios |
|---|---|
| ![Performer](https://raw.githubusercontent.com/nexalapp/CommunityScripts/43c9691b1c39e40be1e918faa9a0a75183ba956a/Theme-Minimal/desktop-performer.jpg) | ![Studios](https://raw.githubusercontent.com/nexalapp/CommunityScripts/43c9691b1c39e40be1e918faa9a0a75183ba956a/Theme-Minimal/desktop-studios.jpg) |

<img src="https://raw.githubusercontent.com/nexalapp/CommunityScripts/43c9691b1c39e40be1e918faa9a0a75183ba956a/Theme-Minimal/mobile-scenes.jpg" alt="Scenes on a phone" width="260"> <img src="https://raw.githubusercontent.com/nexalapp/CommunityScripts/43c9691b1c39e40be1e918faa9a0a75183ba956a/Theme-Minimal/mobile-scene.jpg" alt="A scene on a phone" width="260">

### Version 0.1

<img width="1792" alt="stash--minimal-theme-v0 1--performers" src="https://github.com/user-attachments/assets/9050c621-deb8-4ede-b6ca-f759e89f1519" />
<img width="1792" alt="stash--minimal-theme-v0 1--tags" src="https://github.com/user-attachments/assets/fb562bdc-cf5c-4bd8-ab5e-1ee1147ba068" />
<img width="1792" alt="stash--minimal-theme-v0 1--settings" src="https://github.com/user-attachments/assets/65befac3-74c4-4b6f-a999-8ff0e8e9dc40" />
<img width="1792" alt="stash--minimal-theme-v0 1--scenes" src="https://github.com/user-attachments/assets/05d45f6e-7fb7-4ed8-b2af-5a153bdb3611" />

## Changelog

### Version 0.3.0 - 2026-10-03

- Refresh for Stash v0.29+: the list toolbar (its old `.scene-list-toolbar` selector no longer matches), filter drawer and sticky pagination.
- Toolbar controls share a 34px hit area; pagination is centred with the result count beside it; the duplicate bottom pagination is hidden.
- Resolution and duration share one chip; studio logo chip top-left; card spacing and caption inset on one 12px rhythm; studio and tag logos on a soft 16:9 tile.
- Card counts are plain icon + number, aligned with the title.
- Hover lifts the card on a soft shadow; selection is a 2px light ring.
- One light primary action per screen; secondary actions are quiet grey pills.
- Menu shows words only; scene title at 34px; full-bleed performer portrait with a 40px name and a tight field list.
- Filter drawer one step lighter than the page; its toggle no longer sits half off the edge.
- Meta text greys lifted so small text passes WCAG AA.

### Version 0.2.7 - 2025-04-07
- Theme studio rating for real.
- Remove card hover.

### Version 0.2.6 - 2025-04-06

- Theme studio rating.

### Version 0.2.5 - 2025-04-06

- Theme tag card view.
- Rework studio/tag card backgrounds.

### Version 0.2.4 - 2025-04-06

- Increase contrast for settings toggles
- Fix popover arrow theming
- Theme performer scraper
- Theme player vtt preview and markers

### Version 0.2.3 - 2025-04-05

- Fix studio image in scene view.
- Update performer/studio page.

### Version 0.2.2 - 2025-03-15

- Theme popover arrow.
- Theme card size slider.
- Theme studio tagger.
- Theme scene tagger search result.
- Theme skeleton.
- Center stats.

### Version 0.2.1 - 2025-03-15

- Fix content offset from nav-bar.

### Version 0.2 - 2025-03-15

- Themed the tagger view for a more cohesive look.
- Restyled and refactored the navbar for improved usability and aesthetics.
- Restyled all the scene card information overlays to enhance clarity and visual appeal.
- Fixed the scene card selector to ensure proper functionality.
- Fixed scene auto play.
