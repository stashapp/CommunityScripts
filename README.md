# CommunityScripts Repository

This repository contains plugin and utility scripts created by the Stash community and hosted on the official GitHub repo.  There is also [a list of third-party plugins on our wiki page](https://github.com/stashapp/stash/wiki/Plugins-&--Scripts).

## How To Install
To download a plugin, either clone the git repo, or download the files directly. 

It is recommended that plugins are placed in their own subdirectory of your `plugins` directory. The `plugins` directory should be created as a subdirectory in the directory containing your `config.yml` file. This will be in `$HOME/.stash` by default.

When downloading directly click on the file you want and then make sure to click the raw button:

![](https://user-images.githubusercontent.com/1358708/82524777-cd4cfe80-9afd-11ea-808d-5ea7bf26704f.jpg)

# Plugin and Script Directory
This list keeps track of scripts and plugins in this repository. Please ensure the list is kept in alphabetical order.

## Plugins

Category|Triggers|Plugin Name|Description|Minimum Stash version
--------|-----------|-----------|-----------|---------------------
Scraper|Task|[GHScraper_Checker](plugins/GHScraper_Checker)|Compare local file against github file from the community scraper repo.|v0.8
Maintenance|Scene.Update|[renamerOnUpdate](plugins/renamerOnUpdate)|Rename your file based on Stash metadata.|v0.7
Maintenance|Set Scene Cover|[setSceneCoverFromFile](plugins/setSceneCoverFromFile)|Searchs Stash for Scenes with a cover image in the same folder and sets the cover image in stash to that image|v0.7
Scenes|Scene.Create<br />Gallery.Create<br />Image.Create|[defaultDataForPath](plugins/defaultDataForPath)|Adds configured Tags, Performers and/or Studio to all newly scanned Scenes, Images and Galleries..|v0.8
Scenes|SceneMarker.Create<br />SceneMarker.Update|[markerTagToScene](plugins/markerTagToScene)|Adds primary tag of Scene Marker to the Scene on marker create/update.|v0.8 ([46bbede](https://github.com/stashapp/stash/commit/46bbede9a07144797d6f26cf414205b390ca88f9))
Scanning|Scene.Create<br />Gallery.Create|[filenameParser](plugins/filenameParser)|Tries to parse filenames, primarily in {studio}.{year}.{month}.{day}.{performer1firstname}.{performer1lastname}.{performer2}.{title} format, into the respective fields|v0.10
Reporting||[TagGraph](plugins/taggrap)|Creates a visual of the Tag relations.|v0.7

## Utility Scripts

Category|Plugin Name|Description|Minimum Stash version
--------|-----------|-----------|---------------------
Kodi|[Kodi Helper](scripts/kodi-helper)|Generates `nfo` and `strm` for use with Kodi.|v0.7
Maintenance|[Stash Sqlite Renamer](scripts/Sqlite_Renamer)|Renames your files using stash's metadata.|v0.7
