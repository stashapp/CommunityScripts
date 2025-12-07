import os

###################################################################
#       General information         #
# -----------------------------------------------------------------
# Available elements for renaming:
#   $oshash
#   $md5
#   $phash
#   $date
#   $date_format
#   $year
#   $performer
#   $title
#   $height
#   $resolution
#   $duration
#   $bitrate (megabits per second)
#   $studio
#   $parent_studio
#   $studio_family
#   $rating
#   $tags
#   $video_codec
#   $audio_codec
#   $group_title
#   $group_year
#   $group_scene
#   $stashid_scene
#   $stashid_performer
#   $studio_code
#
# Note:
# $date_format: can be edited with date_format settings
# $duration: can be edited with duration_format settings
# $studio_family: If parent studio exists use it, else use the studio name.
# $performer: If more than * performers linked to the scene, this field will be ignored. Limit this number at Settings section below (default: 3)
# $resolution: SD/HD/UHD/VERTICAL (for phone) | $height: 720p 1080p 4k 5k 6k 8k
# $group_scene: "scene #" # = index scene
# -----------------------------------------------------------------
# Example templates:
#
# $title                                    == Her Fantasy Ball
# $date $title                              == 2016-12-29 Her Fantasy Ball
# $date.$title                              == 2016-12-29.Her Fantasy Ball
# $year $title $height                      == 2016 Her Fantasy Ball 1080p
# $year_$title-$height                      == 2016_Her Fantasy Ball-1080p
# $date $performer - $title [$studio]       == 2016-12-29 Eva Lovia - Her Fantasy Ball [Sneaky Sex]
# $parent_studio $date $performer - $title  == Reality Kings 2016-12-29 Eva Lovia - Her Fantasy Ball
# $date $title - $tags                      == 2016-12-29 Her Fantasy Ball - Blowjob Cumshot Facial Tattoo
#

####################################################################
#           TEMPLATE FILENAME FOR SCENES (Rename your scene files)

# Priority : Tags > Studios > Default

# Templates to use for given tags
# Add or remove as needed or leave it empty/comment out
# you can specific group with {}. exemple: [$studio] {$date -} $title, the '-' will be removed if no date
tag_templates = {
    # "!1. Western": "$date $performer - $title [$studio]",
    # "!1. JAV": "$title",
    # "!1. Anime": "$title $date [$studio]"
}

# Adjust the below if you want to use studio names instead of tags for the renaming templates
studio_templates = {}

# Change to True to use the default template if no specific tag/studio is found
use_default_template = False
# Default template, adjust as needed
default_template = "$date $title"

####################################################################
#           TEMPLATE PATH FOR SCENES  (Move your scene files)

# $studio_hierarchy: create the whole studio hierarchy as folders (MindGeek/Brazzers/Hot And Mean/video.mp4).
# $group_hierarchy: create the whole group hierarchy as folders (group_a/group_b/group_c/video.mp4). When a group has two parents, only the first parent is used.
# ^* = parent of folder (E:\Movies\video.mp4 -> E:\Movies\)

# trigger with a specific tag
# "tagname": "path"
# ex: "plugin_move": r"E:\Movies\R18\$studio_hierarchy"
p_tag_templates = {}


p_studio_templates = {}

# match a path
# "match path": "destination"
# ex: r"E:\Film\R18\2. Test\A trier": r"E:\Film\R18\2. Test\A trier\$performer",
p_path_templates = {}

# change to True to use the default template if no specific tag/studio is found
p_use_default_template = False
# default template, adjust as needed
p_default_template = f"^*{os.sep}$performer"

# if unorganized, ignore other templates, use this path
p_non_organized = r""

####################################################################
#           TEMPLATE FILENAME FOR GALLERIES (Rename your galleries)
####################################################################

# Priority : Tags > Studios > Default

# Templates to use for given tags
# Add or remove as needed or leave it empty/comment out
# you can specific group with {}. exemple: [$studio] {$date -} $title, the '-' will be removed if no date
gallery_tag_templates = {}

# Adjust the below if you want to use studio names instead of tags for the renaming templates
gallery_studio_templates = {}

# Change to True to use the default template if no specific tag/studio is found
use_default_gallery_template = False
# Default template, adjust as needed
default_gallery_template = "$date $title"

####################################################################
#           TEMPLATE PATH FOR GALLERIES  (Move your galleries)
####################################################################

# $studio_hierarchy: create the whole studio hierarchy as folders (MindGeek/Brazzers/Hot And Mean/gallery.zip).
# ^* = parent of folder (E:\Galleries\gallery.zip -> E:\Galleries\)

# trigger with a specific tag
# "tagname": "path"
# ex: "plugin_move": r"E:\Galleries\R18\$studio_hierarchy"
p_gallery_tag_templates = {}

p_gallery_studio_templates = {}

# match a path
# "match path": "destination"
# ex: r"E:\Gallery\R18\2. Test\A trier": r"E:\Gallery\R18\2. Test\A trier\$performer",
p_gallery_path_templates = {}

# change to True to use the default template if no specific tag/studio is found
p_use_default_gallery_template = False
# default template, adjust as needed
p_default_gallery_template = f"^*{os.sep}$performer"

# option if tag is present
# "tagname": [option]
# clean_tag: remove the tag after the rename
# inverse_performer: change the last/first name (Jane Doe -> Doe Jane)
# dry_run: activate dry_run for this scene
# ex: "plugin_move": ["clean_tag"]
p_tag_option = {}
######################################
#               Logging              #

# File to save what is renamed, can be useful if you need to revert changes.
# Will look like: IDSCENE|OLD_PATH|NEW_PATH
# Leave Blank ("") or use None if you don't want to use a log file, or a working path like: C:\Users\USERNAME\.stash\plugins\Hooks\rename_log.txt
log_file = r""

######################################
#               Settings             #

# rename associated file (subtitle, funscript) if present
associated_extension = ["srt", "vtt", "funscript"]

# use filename as title if no title is set
# it will cause problem if you update multiple time the same scene without title.
filename_as_title = False

# Character which replaces every space in the filename
# Common values are "." and "_"
# e. g.:
# "."
# 2016-12-29.Eva.Lovia.-.Her.Fantasy.Ball
filename_splitchar = " "

# replace space for stash field (title, performer...), if you have a title 'I love Stash' it can become 'I_love_Stash'
field_whitespaceSeperator = ""
# Remove/Replace character from field
# Supports two formats:
# 1. Single replacement (dict): {"replace": "foo", "with": "bar"} or {"regex": "pattern", "with": "replacement"}
# 2. Multiple replacements (list): [{"replace": "foo", "with": "bar"}, {"regex": "pattern", "with": "replacement"}, ...]
# Examples:
#   "$studio": {"replace": "'", "with": ""}  # My Dad's Hot Girlfriend --> My Dads Hot Girlfriend
#   "$title": {"regex": "^(A|An|The) ", "with": ""}  # Remove leading prepositions (replaces prepositions_list)
#   "$title": [
#       {"replace": ".", "with": ""},      # Remove periods
#       {"replace": "---", "with": "-"},    # Replace --- with - (longer pattern first)
#       {"replace": "--", "with": "-"}     # Replace -- with - (shorter pattern second)
#   ]
field_replacer = {}

# Match and replace.
# "match": ["replace with", "system"] the second element of the list determine the system used. If you don't put this element, the default is word
# regex: match a regex, word: match a word, any: match a term
# difference between 'word' & 'any': word is between seperator (space, _, -), any is anything ('ring' would replace 'during')
# ex:   "Scene": ["Sc.", "word"]    - Replace Scene by Sc.
#       r"S\d+:E\d+": ["", "regex"] - Remove Sxx:Ex (x is a digit)
#       r"[,#]": ["", "regex"]      - Remove comma and hash
replace_words = {}

# Date format for $date_format field, check: https://docs.python.org/3/library/datetime.html#strftime-and-strptime-format-codes
date_format = r"%Y-%m-%d"
# Duration format, check table: https://docs.python.org/3/library/time.html#time.strftime
# exemple: %H;%M;%S -> 00;35;20 (You can't have ':' character in filename)
# If empty, it will give you the duration as seconds
duration_format = r""

# put the filename in lowercase
lowercase_Filename = False
# filename in title case (Capitalises each word and lowercases the rest)
titlecase_Filename = False

# Character to use as a performer separator.
performer_splitchar = " "
# Maximum number of performer names in the filename. If there are more performers than that in a scene, the filename will not include any performer names, unless performer_limit_keep is set to True!
performer_limit = 3
# Use performer names up to the limit, instead of discarding all performer names when the limit is reach (e.g. if limit=3, the filename can contains 3 performers for a 4 performer scene)
performer_limit_keep = False
# sorting performer (name, id, rating, favorite, mix (favorite > rating > name), mixid (favorite > rating > id))
# stash returns ids as strings, so when sorting by id, they are string sorted (e.g., "10" < "2"), not integer sorted
performer_sort = "id"
# ignore certain gender. Available "MALE" "FEMALE" "TRANSGENDER_MALE" "TRANSGENDER_FEMALE" "INTERSEX" "NON_BINARY" "UNDEFINED"
performer_ignoreGender = []

# Suffixes appended to filenames when multiple files in the same scene would generate identical names.
# First file uses no suffix, subsequent files use _1, _2, _3, etc. to ensure uniqueness.
duplicate_suffix = ["_1", "_2", "_3", "_4", "_5", "_6", "_7", "_8", "_9", "_10"]

# Prevent duplicate performer names when both $performer and $title are in the template.
# If the title contains the performer name, the $performer field is removed from the template.
# Works in both directions: $performer - $title and $title - $performer
# e.g.:
# Template: $year $performer - $title
# 2016 Dani Daniels - Dani Daniels in ***.mp4 --> 2016 - Dani Daniels in ***.mp4
# Template: $title {$performer - }
# Dani Daniels in Scene - Dani Daniels --> Dani Daniels in Scene (group removed when $performer is removed)
prevent_title_performer = False

## Path mover related
# remove consecutive (/FolderName/FolderName/video.mp4 -> FolderName/video.mp4
prevent_consecutive = True
# check when the file has moved that the old directory is empty, if empty it will remove it.
remove_emptyfolder = True
# When enabled, recursively removes empty parent directories up to the topmost directory in the path.
# This extends remove_emptyfolder to also remove parent directories that become empty.
remove_empty_parent_folders = False
# When removing empty folders, ignore specific files and folders when determining if a folder is empty.
# Folders containing only items matching this list will be considered empty and removed.
# The ignored items will be automatically removed before removing the folder.
# Works for both files and folders - specify the exact name or use regex patterns to match.
# Each item in the list must be a dict with either "name" key for exact match, or "regex" key for pattern match.
# Default: [] (empty list - no items are ignored)
# Examples:
#   [{"name": ".DS_Store"}, {"name": "Thumbs.db"}, {"name": ".nfo"}, {"name": ".actors"}]  # Simple string matches (files and folders)
#   [{"regex": r"^\.DS_Store.*"}]  # Regex pattern to match .DS_Store and variants
#   [{"name": ".DS_Store"}, {"regex": r"^\.nfo$|^\.tbn$"}, {"name": ".actors"}]  # Mix of name and regex
remove_emptyfolder_ignore_items = []
# Timeout in seconds for metadata scan operations when moving folder galleries.
# Some users with very large libraries may need to increase this value.
metadata_scan_timeout = 60
# the folder only contains 1 performer name. Else it will look the same as for filename
path_one_performer = True
# if there is no performer on the scene, the $performer field will be replaced by "NoPerformer" so a folder "NoPerformer" will be created
path_noperformer_folder = False
# if path_one_performer is True and the folder already has a performer name, it won't be changed. Takes performer_sort and performer_ignoreGender into consideration.
path_keep_alrperf = True

# Squeeze studio names removes all spaces in studio, parent studio and studio family name
# e. g.:
# Reality Kings --> RealityKings
# Team Skeet Extras --> TeamSkeetExtras
squeeze_studio_names = False

# Rating configuration
# Stash stores ratings on an integer scale from 1-100, where 100 = 5 stars.
# The rating_display_mode controls how the integer rating is converted for display:
#   - None or "integer": Use the raw integer value (1-100)
#   - "stars": Convert to star rating (0-5 stars)
#   - "decimal": Convert to decimal rating (0.0-5.0)
# rating_format is a format string that wraps the converted rating value.
# Examples:
#   rating_display_mode = "stars", rating_star_precision = "full", rating_format = "{}"
#     with rating100=100 (5 stars)  == 5
#   rating_display_mode = "stars", rating_star_precision = "half", rating_format = "{}-stars"
#     with rating100=50 (2.5 stars)  == 2.5-stars
#   rating_display_mode = "decimal", rating_decimal_places = 1, rating_format = "{}"
#     with rating100=100 (5.0)     == 5.0
#   rating_display_mode = None, rating_format = "{}"
#     with rating100=100            == 100
rating_display_mode = None  # None, "integer", "stars", or "decimal"
rating_star_precision = "full"  # "full", "half", "quarter", or "tenth" (only used when rating_display_mode="stars")
rating_decimal_places = (
    1  # Number of decimal places (only used when rating_display_mode="decimal")
)
rating_format = "{}"  # Format string that wraps the converted rating value

# Character to use as a tag separator.
tags_splitchar = " "
# Include and exclude tags
# 	Tags will be compared strictly. "pantyhose" != "Pantyhose" and "panty hose" != "pantyhose"
# Option 1: If you're using whitelist, every other tag which is not listed there will be ignored in the filename
# Option 2: All tags in the tags_blacklist array will be ignored in the filename. Every other tag will be used.
# Option 3: Leave both arrays empty if you're looking for every tag which is linked to the scene.
# 			Attention: Only recommended if the scene linked tags number is not that big due to maxiumum filename length
tags_whitelist = [
    # "Brunette", "Blowjob"
]

tags_blacklist = [
    # ignored tags...
]

# Only rename 'Organized' scenes.
only_organized = False

# Target platform for path and filename length limits. Set to None to auto-detect the current platform.
# Options: None (auto-detect), "windows", "linux", "macos", "freebsd"
# Useful when running on Linux but serving files to Windows clients via Samba.
# Platform limits:
#   - Windows: 260 chars path, 255 chars filename (characters)
#   - Linux: 4096 bytes path, 255 bytes filename (bytes)
#   - macOS: 1024 bytes path, 255 bytes filename (bytes)
#   - FreeBSD: 4096 bytes path, 255 bytes filename (bytes)
target_platform = None

# Fields to remove if the filename or path is too long. First in list will be removed then second then ... if length is still too long.
# Used for both filename length and full path length validation.
order_field = [
    "$video_codec",
    "$audio_codec",
    "$resolution",
    "tags",
    "rating",
    "$height",
    "$studio_family",
    "$studio",
    "$parent_studio",
    "$performer",
]

# Alternate way to show diff. Not useful at all.
alt_diff_display = False

# number of items (scenes/galleries) to process by the task renamer. -1 = all items
batch_size = -1

# disable/enable the hook. You can edit this value in 'Plugin Tasks' inside of Stash.
enable_hook = False
# disable/enable dry mode. Do a trial run with no permanent changes. Can write into a file (dryrun_renamerOnUpdate.txt), set a path for log_file.
# You can edit this value in 'Plugin Tasks' inside of Stash.
dry_run = True
# Choose if you want to append to (True) or overwrite (False) the dry-run log file.
dry_run_append = True
######################################
#            Module Related          #

# Convert non-ASCII characters to ASCII equivalents using Unidecode.
# Prevents having non-common characters by replacing them with ASCII equivalents.
# Warning: If you have non-latin characters (Cyrillic, Kanji, Arabic, ...), the result will be extremely different.
use_ascii = False

# Replace emojis in filenames and paths with their code representations (e.g., :smile:)
# If enabled, emojis will be replaced with their textual codes
replace_emoji = False
# Language override for emoji replacement. Set to None to use Stash's interface language setting.
# Supported two-letter language codes: ar (Arabic), de (German), en (English), es (Spanish),
# fa (Farsi/Persian), fr (French), id (Indonesian), it (Italian), ja (Japanese), ko (Korean),
# pt (Portuguese), ru (Russian), tr (Turkish), zh (Simplified Chinese)
# If the language is not supported by the emoji package, it will fall back to English.
emoji_language_override = None
# Delimiter for emoji codes. Default is None (uses default colons, e.g., :smile:).
# Set to a character like "_" or "-" to use custom delimiters (e.g., :smile: -> _smile_ or -smile-).
# Useful on Windows where colons are invalid path characters.
emoji_delimiter = None
