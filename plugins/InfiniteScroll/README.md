# Infinite Scroll

Replaces page buttons with infinite scrolling in every list: scenes, images, galleries, performers, studios, tags, groups and markers, in Grid, List, Wall and Tagger views, including the lists on performer, studio, tag, group and gallery pages.

Full documentation, known limitations and issues: https://github.com/RyanAtNight/StashInfiniteScroll

## What it does

- Loads items in batches of 14 before you reach the bottom, further ahead the faster you scroll.
- Keeps your place: the page number in the address bar follows the page in view, going back from a scene returns to the same item, and a copied link opens at that page with a **Load earlier results** button.
- Pins the toolbar, filter tags, page buttons and result count at the top while the list scrolls under them.
- The page buttons show the page in view and jump to any page; the count shows the total.
- Keeps Stash's own features working across everything loaded: Select all, shift-click ranges, bulk edit and delete, the play queue, the image lightbox, random sort and the scene tagger.
- Re-fetches what's loaded when items are added or removed while you scroll, so nothing is skipped or shown twice.
- Stays fast in long lists: off-screen Grid cards become empty boxes of the same size, and previews wait while you scroll fast.

If a Stash update removes something the plugin relies on, that part switches itself off and Stash's normal pages are used.

## Settings

| Setting | Default | |
|---|---|---|
| Disable in Grid / List / Wall / Tagger view | off | Use normal pages in that view. |
| Disable on detail pages | off | Use normal pages for lists inside performer, studio, tag, group and gallery pages. |
| Hide the page jumper | off | Hide the page buttons above the list. |
| Don't pin the list header | off | Let the toolbar, filter tags, page buttons and count scroll away. |
| Keep every card mounted | off | Turn off the Grid placeholders. |
| Load-ahead distance (screens) | 1.5 | The least that's kept loaded below the view; fast scrolling loads further. |
| Tagger confirmation threshold | 40 | When "Scrape All" asks first. |

## Compatibility

Tested on Stash v0.31.1, v0.32.0 and the development build, each in a fresh install with no other plugins. No dependencies.
