###################################################################
#
# -----------------------------------------------------------------
# Available: $date $year $performer $title $height $resolution $studio $parent_studio $studio_family $video_codec $audio_codec
# -note:
# $studio_family: If parent studio exist use it, else use the studio name.
# $performer: If more than * performers, this field will be ignored. Limit to fix at Settings section below (default: 3)
# $resolution: SD/HD/UHD/VERTICAL (for phone) | $height: 720p 1080p 4k 8k
# -----------------------------------------------------------------
# e.g.:
# $title                                    == Her Fantasy Ball
# $date $title                              == 2016-12-29 Her Fantasy Ball
# $year $title $height                      == 2016 Her Fantasy Ball 1080p
# $date $performer - $title [$studio]       == 2016-12-29 Eva Lovia - Her Fantasy Ball [Sneaky Sex]
# $parent_studio $date $performer - $title  == Reality Kings 2016-12-29 Eva Lovia - Her Fantasy Ball
#
####################################################################
#               TEMPLATE             #

# Priority : Tags > Studios > Default

# templates to use for given tags
# add or remove as needed
tag_templates = {
    "!1. Western": "$date $performer - $title [$studio]",
    "!1. JAV": "$title",
    "!1. Anime": "$title $date [$studio]"
}

# adjust the below if you want to use studio names instead of tags for the renaming templates
studio_templates = {

}

# change to True to use the default template if no specific tag/studio is found
use_default_template = False
# default template, adjust as needed
default_template = "$date $title"

######################################
#               Logging              #

# File to save what is renamed, can be useful if you need to revert changes.
# Will look like: IDSCENE|OLD_PATH|NEW_PATH
# Leave Blank ("") or use None if you don't want to use a log file, or a working path like: C:\Users\USERNAME\.stash\plugins\Hooks\rename_log.txt
log_file = r""

######################################
#               Settings             #

# Character to use as a performer separator.
performer_splitchar = " "
# Maximum number of performer names in the filename. If there are more than that in a scene the filename will not include any performer names!
performer_limit = 3
# ignore male performers.
performer_ignore_male = False

# If $performer is before $title, prevent having duplicate text. 
# e.g.:
# Template used: $year $performer - $title
# 2016 Dani Daniels - Dani Daniels in ***.mp4 --> 2016 Dani Daniels in ***.mp4
prevent_title_performer = False

# Only rename 'Organized' scenes.
only_organized = False
# Field to remove if the path is too long. First in list will be removed then second then ... if length is still too long.
order_field = ["$video_codec", "$audio_codec", "$resolution", "$height", "$studio_family", "$studio", "$parent_studio","$performer"]
# Alternate way to show diff. Not useful at all.
alt_diff_display = False

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
