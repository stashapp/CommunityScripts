###################################################################
#       General information         #
# -----------------------------------------------------------------
# Available elements for renaming:
#   $oshash
#   $checksum
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
#   $movie_scene
#   $movie_title
#   $movie_year
#   $movie_scene
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
# $movie_scene: "scene #" # = index scene
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
#           TEMPLATE FILENAME (Rename your files)

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
#           TEMPLATE PATH  (Move your files)

# $studio_hierarchy: create the whole hierarchy folder (MindGeek/Brazzers/Hot And Mean/video.mp4)
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
p_default_template = r"^*\$performer"

# if unorganized, ignore other templates, use this path
p_non_organized = r""

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
# Remove/Replace character from field (not using regex)
# "field": {"replace": "foo","with": "bar"}
# ex: "$studio": {"replace": "'","with": ""} My Dad's Hot Girlfriend --> My Dads Hot Girlfriend
field_replacer = {}

# Match and replace.
# "match": ["replace with", "system"] the second element of the list determine the system used. If you don't put this element, the default is word
# regex: match a regex, word: match a word, any: match a term
# difference between 'word' & 'any': word is between seperator (space, _, -), any is anything ('ring' would replace 'during')
# ex:   "Scene": ["Sc.", "word"]    - Replace Scene by Sc.
#       r"S\d+:E\d+": ["", "regex"] - Remove Sxx:Ex (x is a digit)
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
# remove these characters if there are present in the filename
removecharac_Filename = ",#"

# Character to use as a performer separator.
performer_splitchar = " "
# Maximum number of performer names in the filename. If there are more than that in a scene the filename will not include any performer name!
performer_limit = 3
# The filename with have the name of performer before reaching the limit (if limit=3, the filename can contains 3 performers for a 4 performers scenes)
performer_limit_keep = False
# sorting performer (name, id, rating, favorite, mix (favorite > rating > name), mixid (..>..> id))
performer_sort = "id"
# ignore certain gender. Available "MALE" "FEMALE" "TRANSGENDER_MALE" "TRANSGENDER_FEMALE" "INTERSEX" "NON_BINARY" "UNDEFINED"
performer_ignoreGender = []

# word attached at end if multiple file for same scene [FileRefactor]
duplicate_suffix = ["", "_1", "_2", "_3", "_4", "_5", "_6", "_7", "_8", "_9", "_10"]

# If $performer is before $title, prevent having duplicate text.
# e.g.:
# Template used: $year $performer - $title
# 2016 Dani Daniels - Dani Daniels in ***.mp4 --> 2016 Dani Daniels in ***.mp4
prevent_title_performer = False

## Path mover related
# remove consecutive (/FolderName/FolderName/video.mp4 -> FolderName/video.mp4
prevent_consecutive = True
# check when the file has moved that the old directory is empty, if empty it will remove it.
remove_emptyfolder = True
# the folder only contains 1 performer name. Else it will look the same as for filename
path_one_performer = True
# if there is no performer on the scene, the $performer field will be replaced by "NoPerformer" so a folder "NoPerformer" will be created
path_noperformer_folder = False
# if the folder already have a performer name, it won't change it
path_keep_alrperf = True

# Removes prepositions from the beginning of titles
prepositions_list = ["The", "A", "An"]
prepositions_removal = False

# Squeeze studio names removes all spaces in studio, parent studio and studio family name
# e. g.:
# Reality Kings --> RealityKings
# Team Skeet Extras --> TeamSkeetExtras
squeeze_studio_names = False

# Rating indicator option to identify the number correctly in your OS file search
# Separated from the template handling above to avoid having only "RTG" in the filename for scenes without ratings
# e. g.:
# "{}" with scene rating of 5       == 5
# "RTG{}" with scene rating of 5    == RTG5
# "{}-stars" with scene rating 3    == 3-stars
rating_format = "{}"

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

# If the new path is over 240 characters, the plugin will try to reduce it. Set to True to ignore that.
ignore_path_length = False

# Field to remove if the path is too long. First in list will be removed then second then ... if length is still too long.
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

# number of scene process by the task renamer. -1 = all scenes
batch_number_scene = -1

# disable/enable the hook. You can edit this value in 'Plugin Tasks' inside of Stash.
enable_hook = True
# disable/enable dry mode. Do a trial run with no permanent changes. Can write into a file (dryrun_renamerOnUpdate.txt), set a path for log_file.
# You can edit this value in 'Plugin Tasks' inside of Stash.
dry_run = False
# Choose if you want to append to (True) or overwrite (False) the dry-run log file.
dry_run_append = True
######################################
#            Module Related          #

# ! OPTIONAL module settings. Not needed for basic operation !

# = psutil module (https://pypi.org/project/psutil/) =
# Gets a list of all processes instead of stopping after the first one. Enabling it slows down the plugin
process_getall = False
# If the file is used by a process, the plugin will kill it. IT CAN MAKE STASH CRASH TOO.
process_kill_attach = False
# =========================

# = Unidecode module (https://pypi.org/project/Unidecode/) =
# Check site mentioned for more details.
# TL;DR: Prevent having non common characters by replacing them.
# Warning: If you have non-latin characters (Cyrillic, Kanji, Arabic, ...), the result will be extremely different.
use_ascii = False
# =========================
