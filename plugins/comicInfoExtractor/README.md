# Comic Archive Metadata Extractor
Follows the Comicrack Standard for saving Comic Metadata in .cbz files by reading the ComicInfo.xml file in the archive and writing the result into the stash gallery.
Use the config.py ImportList to define what XML names should be mapped to what.
Currently, Bookmark and Type are recognized as chapters that are imported as well.
The current Configuration will overwrite any value you try to set that is already set in the ComicInfo.xml. For a change in that, change the hook condition in the yml.

### Installation 
Move the `comicInfoExtractor` directory into Stash's plugins directory, reload plugins.

### Tasks
* Load all cbz Metadata - Fetch metadata for all galleries.
* Post update hook - Fetch metadata for that gallery
