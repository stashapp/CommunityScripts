# Javstash Autofill

Automatically fills in a newly-created performer's empty fields from a scraper
(default: the [javstash](https://javstash.org) stash-box) the moment the
performer is created (`Performer.Create.Post` hook).

It searches the configured source by the performer's name, takes the
best name-matching candidate, and fills the empty fields. Existing values and
existing images are protected by default; you can opt into overwriting on a
per-field basis.

## Behaviour

- **Best name match, or skip.** The candidate with the highest name-match score
  (exact = 1.0, otherwise fuzzy) is used. If the best score is below the
  configurable threshold, nothing is done.
- **Fill empty only (default).** Only empty fields are written, so manual edits
  and other scrapers' data are preserved. Each field can be switched to
  "overwrite existing" individually.
- **Primary name policy.** For each origin (Identify vs. manual creation) you can
  choose whether the created name stays primary (scraper name goes to aliases)
  or the scraper's canonical name becomes primary (created name goes to aliases).
- **Duplicate merge.** When the scraper name would become primary but a performer
  with that name already exists, the newly-created one is merged into the
  existing performer (`performerMerge`) — scenes are re-linked, the created name
  and the stash-box id are carried over, and the duplicate is removed.
- **Measurements normalisation.** `91H-56-88` → `91(H)-56-88`.
- **Asynchronous image.** The image is downloaded and set in a detached
  background process, so the hook returns immediately and Stash never blocks on a
  slow remote image fetch.

## Requirements

- Python 3 available to Stash's plugin runner.
- The chosen source configured in Stash. For a stash-box source (e.g. javstash),
  add it under **Settings → Metadata Providers → Stash-box Endpoints**.

## Settings

| Setting | Description |
| --- | --- |
| Scraper (Identify) / Scraper (manual) | Source per origin: a stash-box endpoint URL or a `scraper_id`. Empty = javstash. |
| Use scraper name (Identify) / (manual) | Make the scraper's canonical name the primary name for that origin. Default: Identify ON, manual OFF. |
| Name-match threshold | Skip if the best match score is below this (default 0.9). |
| Overwrite: *field* | Per-field toggle. OFF = fill only when empty (default); ON = overwrite even if a value already exists. For URLs / aliases, ON replaces and OFF appends; for the image, ON replaces an existing image. |

## Notes

- The source scrape is proxied through Stash's own `scrapeSinglePerformer`, so no
  API keys are needed in the plugin itself.
- Identify-origin creations are detected by the presence of `stash_ids` in the
  create input.
