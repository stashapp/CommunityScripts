# Changelog

## v1.4
- Fix: the primary name is now corrected to the scraper's spelling when it only differed in casing/spacing (a typed `yua mikami` becomes `Yua Mikami`); previously such a name was considered identical and never replaced.
- Fix: the matched stash-box performer id is stored as a `stash_id` (the scrape now requests `remote_site_id`), so Identify and the Tagger recognise the performer afterwards.
- Easier configuration: the source can be given as the name of a stash-box already configured in Stash (e.g. `StashDB`), part of a name/endpoint (`stashdb`), or a performer scraper name - no need to retype the endpoint URL. Empty falls back to javstash if configured, otherwise the first configured stash-box.
- Scraped `urls` are now read from the modern `urls` list as well as twitter/instagram.

## v1.3
- Initial release.
- Fill a newly-created performer's empty fields from a scraper (default javstash) on `Performer.Create.Post`.
- Best name-match selection with a configurable threshold; skip when no match.
- Per-origin (Identify / manual) source and primary-name policy.
- Duplicate merge when the scraper name becomes primary and a same-named performer already exists.
- Per-field overwrite toggles (default off = fill empty only).
- Measurements normalisation and asynchronous image setting.
