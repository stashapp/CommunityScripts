This plugin has four functions:

# PHASH Duplicate Tagger

## Requirements
 * python >= 3.10.X
 * `pip install -r requirements.txt`


## Title Syntax

This plugin will change the titles of scenes that are matched as duplicates in the following format

`[PDT: 0.0GB|<group_id><keep_flag>] <Scene Title>`

group_id: usually the scene ID of the scene that was selected to Keep
keep_flag: K=Keep R=remove U=Unknown


## Tags
various tags may be created by this plugin 
* Keep - Applied on scenes that are determined to be the "best"
* Remove - Applied to the scenes that determined to be the "worst"
* Unknown - Applied to scenes where a best scene could not be determined
* Ignore - Applied to scenes by user to ignore known duplicates
* Reason -  These tags are applied to remove scenes, they will have a category that will match the determining factor on why a scene was chosen to be removed

## Tasks
### Tag Dupes (EXACT/HIGH/MEDIUM)
These tasks will search for scenes with similar PHASHs within stash the closeness (distance) of the hashes to each other depends on which option you select

* EXACT - Matches have a distance of 0 and should be exact matches
* HIGH - Matches have a distance of 3 and are very similar to each other
* MEDIUM - Matches have a distance of 6 and resemble each other

### Delete Managed Tags
remove any generated tags within stash created by the plugin, excluding the `Ignore` tag this may be something you want to retain

### Scene Cleanup
cleanup changes made to scene titles and tags back to before they were tagged

### Generate Scene PHASHs
Start a generate task within stash to generate PHASHs

## Custom Compare Functions

you can create custom compare functions inside config.py all current compare functions are provided custom functions must return two values when a better file is determined, the better object and a message string, optionally you can set `remove_reason` on the worse file and it will be tagged with that reason

custom functions must start with "compare_" otherwise they will not be detected, make sure to add your function name to the PRIORITY list