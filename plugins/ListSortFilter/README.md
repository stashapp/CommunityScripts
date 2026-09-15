# List Sort Filter

Trims the **sort by** dropdown of every Stash list down to the options you
actually use. Untick an entry and it stops appearing in that list's menu.

Stash offers 30 sort options for scenes, 23 for performers, 13 for tags, and so
on. Most libraries only ever use a handful.

## Display only

Only the menu entry is hidden — sorting itself is untouched:

- saved filters keep working, even when they sort by a hidden entry
- `?sortby=play_count` URLs keep working
- the dropdown button still shows the current sort by name

So hiding an entry can never break an existing view; you just stop seeing it in
the list of choices.

## Nothing is hard-coded

The plugin carries **no list of sort values and no labels of its own**.

Stash hands each of its list components the filter it renders, so patching
`SceneList`, `PerformerList` and friends with `PluginApi.patch.before` is enough
to learn what that list currently offers — straight from Stash, as you open the
page, with no interaction and nothing to parse. Labels are not stored either:
the settings page formats Stash's own message IDs through Stash's own
react-intl (`PluginApi.libraries.Intl`).

That means:

- when Stash adds, removes or renames a sort option, this plugin needs no update
- the settings page is in your Stash UI language for free, with exactly the same
  wording as the dropdown — switch language and it follows immediately
- what each list offers is re-read every time you open it, so it cannot go stale

The only names the plugin knows are those eight component names. That is API
surface rather than data: a list type Stash adds later simply is not covered
until its name is added to `LIST_COMPONENTS`.

## How lists are told apart

Lists are keyed by the mode Stash itself uses (`SCENES`, `PERFORMERS`, …), taken
from the filter. A stylesheet, however, cannot know which list a menu belongs
to, and the DOM does not say: Stash gives the performer list the class
`gallery-list` (same as the gallery list), and an embedded list such as
`/performers/42/scenes` is a scene list on a performer route. So the CSS is
anchored on a sort value that occurs in that list and in no other — computed
from the lists seen so far, not from a table.

```
.sort-by-select .dropdown-menu:has(.dropdown-item[data-value="<anchor>"])
                               .dropdown-item[data-value="<hidden>"] { display: none }
```

Values that share a name across lists (`rating`, `path`, `tag_count`,
`duration`, …) therefore never leak from one list's rules into another's, and
the lists embedded in performer / studio / tag pages are covered too. If the
discovered lists happen to offer no unique value (one list's options being a
subset of another's), the selector additionally excludes the values only the
other list has.

On browsers without `:has()` a small MutationObserver stamps each menu with
`data-lsf="<mode>"` instead — matching it by its set of values — and equivalent
rules take over.

## Settings

`Settings > Plugins > List Sort Filter`. A list appears there once you have
opened it at least once.

Stash's plugin settings are static YAML, so a fixed checkbox per sort option
would be exactly the thing that needs maintaining whenever Stash changes one.
The plugin therefore declares only:

- `enabled` — master switch
- `lists`, `hidden` — its own storage (JSON): what each list offers, and which
  entries are hidden. Kept in the plugin config rather than the browser so your
  choices follow you across devices. The panel does not render them; clear
  `hidden` via `configurePlugin` to show every sort option again. `lists` is
  refreshed automatically whenever you open a list.

and draws the per-entry checkboxes itself, from the lists it has discovered.
The panel is installed by patching Stash's own `PluginSettings` component
(`PluginApi.patch.instead`) and is built from Stash's `SettingGroup` and
`BooleanSetting`, so it inherits the native look and the collapsing behaviour
rather than reimplementing them: one collapsible section per list, collapsed by
default, one checkbox per entry, ticked = visible. Changes take effect on the
next page load — reload, or navigate away and back.

Only the block's own description is still written straight to the DOM, because
Stash prints it from the YAML above the patched component.

### Translation

Stash does not translate plugin settings — `SettingsPluginsPanel` prints
`displayName` verbatim — which is another reason the panel is rendered by the
plugin: it can label itself in the Stash UI language. The sort entries need no
translation table at all (Stash's message IDs are formatted through Stash's own
react-intl), and neither do the list names (the mode, lower-cased, is a message
ID too).

Only the plugin's own seven sentences are translated, in `STRINGS` in
`ListSortFilter.js` — one entry per language Stash offers (38 tables, keyed by
base code, with Chinese split into `zh-tw` / `zh-cn` because Stash ships both
scripts). Anything missing falls back to English per string, so a partial table
is fine. Non-English strings are best-effort; corrections from native speakers
are welcome.

`{n}` is the number of entries in a list and `{hidden}` how many of them are
hidden.
