# SQLITE Renamer for Stash
Using metadata from your stash to rename your file.

## Requirement
- Python (Tested on Python v3.9.1 64bit, Win10)
- Request Module
- Stash
- Windows 10 ? (No idea if this work for all OS)
- Log.py

## Usage

- Everytime you will update a scene, it will check/update your filename.
- Replace things between [Line 354 - 370](renamerOnUpdate.py#L343)
- You can set a path for [STASH_LOGFILE](renamerOnUpdate.py#L21), so you will have a file with all changes that the plugins made. Could be useful to revert.

## Filename template
Available: `$date` `$performer` `$title` `$studio` `$height`

The script will replace these field with the data from the database.
Exemple:
| Template        | Result           
| ------------- |:-------------:
$title|Her Fantasy Ball.mp4
$title $height|Her Fantasy Ball 1080p.mp4
$date $title|2016-12-29 Her Fantasy Ball.mp4
$date $performer - $title [$studio]|2016-12-29 Eva Lovia - Her Fantasy Ball [Sneaky Sex].mp4

Note: 
- A regex will remove illegal character for Windows.
- If you path will be more than 240 characters, the script will try to reduce it. It will only use Date + Title.
- If your height of the video is 2160/4320, it will be replace by `4k`/`8k` else it will be `height + p` (240p,720p,1080p...)
- If the scene contains more than 3 performers, $performer will be replace by nothing.

## Change scenes by tags

If you want differents formats by tags:
```py
if scene_info.get("tags"):
    for tag in scene_info["tags"]:
        if tag["name"] == "WHOAAAA_TAGS1":
            result_template = "$date $performer - $title [$studio]"
        if tag["name"] == "WHOAAAA_TAGS2":
            result_template = "$title"
        if result_template:
            break
```

If you only want change 1 tag:
```py
if scene_info.get("tags"):
    for tag in scene_info["tags"]:
        if tag["name"] == "WHOAAAA_TAGS1":
            result_template = "$date $performer - $title [$studio]"
        if result_template:
            break
```
## Change all scenes

```py
result_template = "$date $title"
```
