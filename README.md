# CommunityScripts Repository

This repository contains plugin and utility scripts created by the Stash community and hosted on the official GitHub repo.  

There is also [a list of third-party plugins on our wiki page](https://github.com/stashapp/stash/wiki/Plugins-&--Scripts).

## Please note: V24 now uses an installer
# We recommend you use that to install plugins.  
Manual installs are discouraged, and you shouldn't do so unless you otherwise know what you are doing.

## How To Install
To download a plugin in Stash v24, the CommunityScripts repo source is automatically installed by default.

This default source is located at https://stashapp.github.io/CommunityScripts/stable/index.yml

# Plugin, Themes, and Scripts Directory
We used to list all plugins, themes, and scripts in this repository...
but with the changes in v24, ANY items installable by the plugin installer are no longer listed here.
Use the Plugin Installer built into Stash.

We will continue to list the items NOT otherwise installable this way below.

## NOTE: BREAKING CHANGES
The recent v24 release (and development branches) had major breaking changes to old schema, and plugin changes.
We're beginning to review plugins and the rest and patch them to work, but it's an ongoing process...

We'll update the table below as we do this...
We will also be rearranging things a bit, and updating documentation (including this page)

## Plugins and Themes are no longer listed here.

Category|Triggers|Plugin Name|Description|Minimum Stash version|Updated for v24|
--------|-----------|-----------|-----------|---------------------|-----
Scraper|Task|[GHScraper_Checker](plugins/GHScraper_Checker)|Compare local file against github file from the community scraper repo.|v0.8|:x:
Maintenance|Task<br />Scene.Update|[renamerOnUpdate](plugins/renamerOnUpdate)|Rename/Move your file based on Stash metadata.|v0.7|:x:
Maintenance|Set Scene Cover|[setSceneCoverFromFile](plugins/setSceneCoverFromFile)|Searchs Stash for Scenes with a cover image in the same folder and sets the cover image in stash to that image|v0.7|:x:
Scenes|SceneMarker.Create<br />SceneMarker.Update|[markerTagToScene](plugins/markerTagToScene)|Adds primary tag of Scene Marker to the Scene on marker create/update.|v0.8 ([46bbede](https://github.com/stashapp/stash/commit/46bbede9a07144797d6f26cf414205b390ca88f9))|:x:
Scanning|Scene.Create<br />Gallery.Create<br />Image.Create|[defaultDataForPath](plugins/defaultDataForPath)|Adds configured Tags, Performers and/or Studio to all newly scanned Scenes, Images and Galleries..|v0.8|:x:
Scanning|Scene.Create<br />Gallery.Create|[filenameParser](plugins/filenameParser)|Tries to parse filenames, primarily in {studio}.{year}.{month}.{day}.{performer1firstname}.{performer1lastname}.{performer2}.{title} format, into the respective fields|v0.10|:x:
Scanning|Scene.Create|[pathParser](plugins/pathParser)|Updates scene info based on the file path.|v0.17|:x:
Scanning|Scene.Create|[titleFromFilename](plugins/titleFromFilename)|Sets the scene title to its filename|v0.17|:x:
Reporting||[TagGraph](plugins/tagGraph)|Creates a visual of the Tag relations.|v0.7|:x:

## Themes

Theme Name|Description                                 |Updated for v24|
----------|--------------------------------------------|----
[Plex](themes/plex)      |Theme inspired by the popular Plex Interface|:x:

## Utility Scripts

|Category|Name|Description|Updated for v24|
---------|---------------|-----------|----
StashDB  |[StashDB Submission Helper](/userscripts/StashDB_Submission_Helper)|Adds handy functions for StashDB submissions like buttons to add aliases in bulk to a performer|:x:
Kodi|[Kodi Helper](scripts/kodi-helper)|Generates `nfo` and `strm` for use with Kodi.|v0.7|:x:
