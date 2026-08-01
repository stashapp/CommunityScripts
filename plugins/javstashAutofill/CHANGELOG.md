# Changelog

## v1.3
- Initial release.
- Fill a newly-created performer's empty fields from a scraper (default javstash) on `Performer.Create.Post`.
- Best name-match selection with a configurable threshold; skip when no match.
- Per-origin (Identify / manual) source and primary-name policy.
- Duplicate merge when the scraper name becomes primary and a same-named performer already exists.
- Per-field overwrite toggles (default off = fill empty only).
- Measurements normalisation and asynchronous image setting.
