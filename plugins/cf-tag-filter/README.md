# Custom Field Tag Filter

https://discourse.stashapp.cc/t/custom-field-tag-filter/9542

Hide "meta-tags" from manual tag entry (when editing scenes) and from scraper results. A tag is treated as a meta-tag when it has a specific **custom field** set on it.

This is a self-contained alternative to the [`tag-filter`](https://github.com/feederbox826/plugins) plugin. The big difference: `tag-filter` stores the list of hidden tags in the **browser's localStorage**, so the list is lost when you clear your browser cache or open StashApp in a different browser. This plugin instead stores the marking **on the tag itself in the stash database** (via a custom field), so it is shared across browsers and survives cache clears.

It is also **fully self-contained** — it does not require any helper plugins (`0gql-intercept`, `forbiddenConfig`, `wfke`, `fontawesome-js`).

## What it does

Hides marked tags from:

- the tag dropdown when editing a scene (`FindTagsForSelect`)
- the scraper's automatic tag search
- scraper results (optional, see settings)

It does **not** hide a tag from:

- the `/tags` page or its search box
- scenes that already have the tag
- the backend / GraphQL

## Setup

1. Install the plugin and enable it under **Settings → Plugins**.
2. Configure the settings (see below). Set **Custom field name** to the field you want to use, e.g. `foobar`.
3. Mark a tag: open the tag's **Edit** page, add a custom field with the name you configured (e.g. `foobar`) and any non-empty value (e.g. `1`), and save.
4. Reload the UI. The tag is now hidden from scene tag entry.

## Settings

| Setting | Description |
| --- | --- |
| **Custom field name** | The name of the custom field that marks a tag as hidden. Required — leave empty to disable filtering. |
| **Custom field value (optional)** | If set, only tags whose custom field equals this value are hidden. Leave empty to hide any tag that has the field set (to any non-empty value). |
| **Also hide marked tags from scraper results** | When enabled, marked tags are also stripped from scene scrape results. |

## How it works

The plugin intercepts GraphQL responses in the browser and removes hidden tags from the scene tag dropdown and (optionally) scraper results. It asks the stash backend for the list of marked tags **lazily and only once per page load** — the first time a tag dropdown or scrape result is shown — then reuses that list for the rest of the session. It does no background polling, so simply viewing or browsing items generates no extra traffic.

This mirrors Stash's own cache-first behavior: if you mark or change a tag in another tab, reload the page to pick it up (the same way newly added tags/groups require a reload in the stock UI).

Because the source of truth is the tag's custom field in the stash database, your hidden-tag list is the same in every browser and is never lost when clearing the browser cache.
