# If dry is True, will do a trial run with no permanent changes. 
# Look in the log file for what would have been updated...
dry_mode = False

# nfo file location & naming.
# Possible options:
# - "with files": with the video files: Follows NFO standard naming: https://kodi.wiki/view/NFO_files/Movies
# - "...": a specific directory you mention. In this case, the nfo names will match your stash scene ids.
# if you set the above to "with files", it'll force filename anyway, to match the filename.
# ! Not yet implemented. Currently, only "with files" is supported
nfo_location = "with files"

# By default the plugin will look for an nfo based on file name:
# "Movie Title (2023).nfo"
# If you want to use a custom file name eg. "movie.nfo", set it here.
custom_nfo_name = ""

# If True, will never update already "organized" scenes.
skip_organized = True

# If True, will set the scene to "organized" on update from nfo file. 
set_organized_nfo = True

# Set of fields that must be set from the nfo (i.e. "not be empty") for the scene to be marked organized. 
# Possible values: "performers", "studio", "tags", "movie", "title", "details", "date", 
#                  "rating", "urls" and "cover_image"
set_organized_only_if = ["title", "performers", "details", "date", "studio", "tags", "cover_image"]

# Blacklist: array of nfo fields that will not be loaded into the scene.
# Possible values: "performers", "studio", "tags", "movie", "title", "details", "date", 
#                  "rating", "urls" and "cover_image", "director"
# Note: "tags" is a special case: if blacklisted, new tags will not be created, but existing tags will be mapped.
blacklist = ["rating"]

# List of tags that will never be created or set to the scene.
# Example: blacklisted_tags = ["HD", "Now in HD"]
blacklisted_tags = ["HD", "4K", "Now in HD", "1080p Video", "4k Video"]

# Name of the tag used as 'marker" by the plugin to identify which scenes to reload.
# Empty string or None disables the reload feature
reload_tag = "_NFO_RELOAD"

# Creates missing entities in stash's database (or not)
create_missing_performers = True
create_missing_studios = True
create_missing_tags = True
create_missing_movies = True

# Choose which field should be parsed into user rating
# and if it should be multiplied by a factor.
user_rating_field = "userrating"
user_rating_multiplier = 1

# Let you decide from where genres should be loaded from.
# Possible values: "tags", "genres", "both"
load_tags_from = "both"

###############################################################################
# Do not change config below unless you are absolutely sure of what you do...
###############################################################################

# Wether to Looks for existing entries also in aliases
search_performer_aliases = True
search_studio_aliases = True

levenshtein_distance_tolerance = 2

# "Single names" means performers with only one word as name like "Anna" or "Siri".
# If true, single names aliases will be ignored: 
# => only the "main" performer name determines if a performer exists or is created.
# Only relevant if search_performer_aliases is True.
ignore_single_name_performer_aliases = True

# If the above is set to true, it can be overruled for some allowed (whitelisted) names
single_name_whitelist = ["MJFresh", "JMac", "Mazee"]

###############################################################################
# Reminder: if no matching NFO file can be found for the scene, a fallback 
# "regular expressions" parsing is supported.
#
# ! regex patterns are defined in their own config files. 
#
# See README.md for details
###############################################################################
