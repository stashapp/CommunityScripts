# Plugin list

This list keeps track of scripts and plugins in this repository. Please ensure the list is kept in alphabetical order.

## Plugins

Category|Triggers|Plugin Name|Description|Minimum Stash version
--------|-----------|-----------|-----------|---------------------
Scraper|Task|[GHScraper_Checker](plugins/GHScraper_Checker)|Compare local file against github file from the community scraper repo.|v0.8
Maintenance|Scene.Update|[renamerOnUpdate](plugins/renamerOnUpdate)|Rename your file based on Stash metadata.|v0.7
Scenes|SceneMarker.Create<br />SceneMarker.Update|[markerTagToScene](plugins/markerTagToScene)|Adds primary tag of Scene Marker to the Scene on marker create/update.|v0.8 ([46bbede](https://github.com/stashapp/stash/commit/46bbede9a07144797d6f26cf414205b390ca88f9))
Scanning|Scene.Create<br />Gallery.Create|[filenameParser](plugins/filenameParser)|Tries to parse filenames, primarily in {studio}.{year}.{month}.{day}.{performer1firstname}.{performer1lastname}.{performer2}.{title} format, into the respective fields|v0.10


## Utility Scripts

Category|Plugin Name|Description|Minimum Stash version
--------|-----------|-----------|---------------------
Kodi|[Kodi Helper](scripts/kodi-helper)|Generates `nfo` and `strm` for use with Kodi.|v0.7
Maintenance|[Stash Sqlite Renamer](scripts/Sqlite_Renamer)|Renames your files using stash's metadata.|v0.7
