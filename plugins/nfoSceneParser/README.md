# nfoFileParser

https://discourse.stashapp.cc/t/nfosceneparser/1385

Automatically and transparently populates your scenes data (during scan) based on either:
- NFO files 
- patterns in your file names, configured through regex. 

Ideal to "initial load" a large set of new files (or even a whole library) and not "start from scratch" in stash! *...provided you have nfo files and/or consistent patterns in your file names of course...*

# Installation

- If you have not done it yet, install the required python module: `pip install requests` (or `pip3 install requests` depending on your python setup). Note: if you are running stash as a Docker container, this is not needed as it is already installed.
- Download the whole folder `nfoFileParser`
- Place it in your `plugins` folder (where the `config.yml` is)
- Reload plugins (`Settings > Plugins > Reload`)
- `nfoFileParser` appears
- Scan some new files...

The plug-in is automatically triggered on each new scene creation (typically during scan)

# Usage

Imports scene details from nfo files or from regex patterns.

Every time a new scene is created, it will:
  - look for a matching NFO file and parse it into the scene data (studio, performers, date, name,...)
  - if no NFO are found, it uses a regular expression (regex) to parse your filename for patterns. This fallback works only if you have consistent & identifiable patterns in (some of) your file names. Read carefully below how to configure regex to match your file name pattern(s).
  - If none of the above is found: it will do nothing ;-)

NFO complies with KODI's 'Movie Template' specification (https://kodi.wiki/view/NFO_files/Movies). Note: although initially created by KODI, this NFO structure has become a de-facto standard among video management software and is used today far beyond its KODI roots to store the video files's metadata.

regex patterns complies with Python's regular expressions. A good tool to write/test regex is: https://regex101.com/ 

## config.py

nfoFileParser works without any config edits. If you want more control, have a look at `config.py`, where you can change some default behavior.

## Reload task

nfoFileParser typically processes everything during scan. If you want to reload the nfo/regex at a later time, you can execute a "reload" task.

It works in three steps: configure, select & run:
- Configure: edit `reload_tags` in the plugin's `config.py` file. Set the name to an existing tag in your stash. It is used as the 'marker" tag by the plugin to identify which scenes to reload.
- Select: add the configured tag to your scenes to "mark" them.
- Run: execute the "reload" task: stash's settings -> "Tasks" -> Scroll down to "plugin tasks" / nfoSceneParser (at the bottom) -> "Reload tagged scenes" button

A reload essentially merges the new file data with the existing scene data, giving priority to the nfo/regex content. More specifically:
- For single-value fields, overrides what is already set if another content is found 
- For single-value fields, keeps what is already set if nothing is found
- For multi-value fields, adds to existing values.

Note: The marker tag is removed from the reloaded scenes (unless it is present in the nfo or regex) => no need to remove it manually...

# NFO files organization

## Scene NFO

The plugin automatically looks for .nfo files (and optionally thumbnail images) in the same directory and with the same filename as your video file (for instance for a `BestSceneEver.mp4` video, it will look for a corresponding `BestSceneEver.nfo` file). Through config, you can specify an alternate location for your NFO files.

## Folder NFO

If a "folder.nfo" file is present, it will be loaded and applied as default for all scene files within the same folder. A scene specific nfo will override the default from the folder.nfo.

So if you have a folder.nfo, with a studio, or an performer, they will automatically be applied to all scenes in the folder, even if there is no specific nfo for each scene file.

folder.nfo are also used to create movies. See below for details on movie support.

## Image support

Thumbnails images are supported either from `<thumb>` tags in the NFO itself (link to image URL) or alternatively will be loaded from the local disk (following KODI's naming convention for movie artwork). The plug-in will use the first image it finds among:
- A local image with the `-landscape` or `-poster` or no suffix (example: `BestSceneEver-landscape.jpg` or `BestSceneEver.jpg`). If you have movie info in your nfo, two images will be loaded for front & back posters (example: `folder-poster.jpg` and `folder-poster1.jpg`)
- A download of the `<thumb>` tags url (if there are multiple thumb fields in the nfo, uses the one with the "landscape" attribute has priority over "poster").

## Movie support

Movies are automatically found and created in stash from the nfo files. The plugin supports two different alternatives:
- folder.nfo if present contains data valid for all scene files in the same directory. That is the very definition of a movie. The `<title>`tag designate the movie name, with all other relevant tags used to create the movie with all its details (`<date>`, `<studio>`, `<director>`, front/back image from `<thumb>`)
- Inside the scene nfo, through the `<set>` tag that designate the group/set to which multiple scenes belong.

example for `folder.nfo`:
```xml
<movie>
  <title>My Movie Title</title>
  <plot>You have to see it to believe it...</plot>
  <thumb aspect="poster">https://front_cover.jpg</thumb>
  <thumb aspect="poster">https://back_cover.jpg</thumb>
  <studio>Best studio ever</studio>
  <director>Georges Lucas</director>
</movie>
```

example for `BestSceneEver.nfo`:

```xml
<movie>
  <title>BestSceneEver</title>
  <plot>Scene of the century</plot>
  <thumb aspect="landscape">https://scene_cover.jpg</thumb>
  <studio>Best studio ever</studio>
  <set>
    <name>My Movie Title</name>
    <index>2</index>
  </set>
  </movie>
```

## url support

The nfo spec does not officially support `<url>` tags, but given the importance for stash, it is supported by nfoSceneParser as an nfo extension and will be correctly recognized and updated to your scenes and movies.

## Mapping between stash data and nfo fields

stash scene fields       | nfo movie fields
------------------------ | ---------------------
`title`                  | `title` or `originaltitle` or `sorttitle`
`details`                | `plot` or `outline` or `tagline`
`studio`                 | `studio`
`performers`             | `actor.name` (sorted by `actor.order`)
`movie`                  | `set.name` (sorted by `set.index`) or `title` from folder.nfo
`rating`                 | `userrating` or `ratings.rating`
`tags`                   | `tag` or `genre`
`date`                   | `premiered` or `year`
`url`                    | `url`
`director` (for movies)  | `director` (only for folder.nfo)
`cover image` (or `front`/`back`for movies)           | `thumb` (or local file)
`id`                     | `uniqueid`

Note: `uniqueid` support is only for existing stash scenes that were exported before (to they are updated "in place" with their existing id)




# Regex pattern matching

Regular expressions work by recognizing patterns in your files. It is a fallback if no NFO can be found.

You need to configure a custom pattern (like studio, actors or movie) that is specific to your naming convention. So a little bit of configuration is needed to "tell the plugin" how to recognize the right patterns.

patterns use the "regular expression" standard to match patterns (regex).

## Regex configuration - not your typical plugin

A consistent and uniform naming convention across a whole media library is extremely unlikely. Therefore, nfoSceneParser supports not one, but multiple `nfoSceneParser.json` regex config files. They are placed alongside your media files, directly into the library. 

A configuration file applies to all files and subdirectories below it. 

Config files can be nested inside the library's directories tree. In this case, the deepest and most specific config is always used. 

`nfoSceneParser.json` configs are searched and loaded when the plug-in is executed. They can be added, modified or removed while stash is running, without the need to "reload" the plugins.

## File structure `nfoSceneParser.json` 

Configuration files consist of one regex and some attributes.  

| Name          | Required | Description                            |
| ------------- | -------- | -------------------------------------- |
| regex         | true     | A regular expression (regex). Regex can be easily learned, previewed and tested via [https://regex101.com/](https://regex101.com/)|
| splitter      | false    | Used to further split the matched "performers" or 'tags" text into an array of strings (the most frequent use case being a list of actors or tags). For instance, if performers matches to `"Megan Rain, London Keyes"`, a splitter of `", "` will separate the two performers from the matched string  |
| scope         | false    | possible values are "path" or "filename". Whether the regex is applied to the scene's whole path or just the filename. Defaults to "path" |

## Example `nfoSceneParser.json` 

Let's assume the following directory and file structure:

`/movies/movie series/Movie Name 17/Studio name - first1 last1, first2 last2 - Scene title - 2017-12-31.mp4`

A common naming convention is used for all files under "movie series" directory => the  `nfoSceneParser.json` file is placed in `/movies/movie series`.

We want to identify the following patterns:
- The deepest folder is the `movie`
- The file name has different sections, all separated by the same `' - '` delimiter. We can therefore use this to delimit and match the `studio`, the `performers` and the scene's `title`.
- The `date` is matched automatically. There is nothing to configure for that.

`nfoSceneParser.json` (remember: to be placed in your library)
```json
{
  "regex": "^.*[/\\\\](?P<movie>.*?)[/\\](?P<studio>.*?) - (?P<performers>.*?) - (?P<title>.*?)[-]+.*\\.mp4$",
  "splitter": ", ",
  "scope": "path"
}
```

A quick look at the regex:
- `[/\\]` Matches slash & backslash, making it work on Windows and Unix path alike (Macos, Linux,...)
- Capturing groups like `(?P<movie>.*?)` have name that must match the supported nfoFileParser attributes (see below)

Note: in json, every `\` is escaped to `\\` => `\\` in json is actually `\` in the regex. If you are unfamiliar, look for a json regex formatter online and paste your regex there to get the properly "escaped" string you need to use in the config file. 

## Supported regex capturing group names

The following can be used in your regex capturing group names:
- title
- date
- performers
- tags
- studio
- rating
- movie
- director
- index (mapped to stash scene_index - only relevant for movies)

Note: if `date` is not specified, the plug-in attempts to detect the date anywhere in the file name.
