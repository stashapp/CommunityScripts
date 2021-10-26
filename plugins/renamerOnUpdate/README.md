
# SQLITE Renamer for Stash
Using metadata from your stash to rename your file.

## Requirement
- Stash
- Python 3+ (Tested on Python v3.9.1 64bit, Win10)
- Request Module (https://pypi.org/project/requests/)
- Windows 10 ? (No idea if this work for all OS)

## Installation

- Download the whole folder 'renamerOnUpdate' (config.py, log.py, renamerOnUpdate.py/.yml)
- Place it in your **plugins** folder (where the `config.yml` is)
- Reload plugins (Settings > Plugins)
- renamerOnUpdate should appear. 

### :exclamation: You still need to configure it :exclamation:

## Usage

- Everytime you did a update on a scene, it will check/rename your file. A update is:
	- Saving in **Scene Edit**.
	- Pressing **Organized** button.
	- A scan that **update** the path.

- You also have task (Settings > Task):
	- **Dry-Run**: Don't edit any file, just show in log. It will create `renamer_scan.txt` that contains every edit.
	  - **Dry-run short**: Check 20 scenes (by newest updated).
	  - **Dry-run full**: Check all scenes.
	- **Process**: Edit your files, **don't touch Stash while doing this task**.
	  - **Check scene from dry-run file**: Read `renamer_scan.txt` instead of checking all scenes.
	  - **Check all scenes**: Check all scenes.
	  - **Check 20 scenes**:  Check 20 scenes (by oldest updated).

## Configuration

- Read/Edit `config.py`
	- I recommend set **log_file** as it can be useful to revert.

### Example

> Note: The priority is Tag > Studio > Default

The config will be:
```py
# Change filename if scene from 'Vixen' or 'Slayed' studio.
studio_templates  = {
	"Slayed": "$date $performer - $title [$studio]",
	"Vixen": "$performer - $title [$studio]"
}
# Change filename if the tag 'rename_tag' is present.
tag_templates  = {
	"rename_tag": "$year $title - $studio $resolution $video_codec",
}
# Change filename no matter what
use_default_template  =  True
default_template  =  "$date $title"
# A space will seperate performer.
performer_splitchar  =  " "
# If more than 3 performers, the $performer field will be ignored.
performer_limit  =  3
```
The scene was just scanned, everything is default (Title = Filename).
Current filename: `Slayed.21.09.02.Ariana.Marie.Emily.Willis.And.Eliza.Ibarra.XXX.1080p.mp4`

|Stash Field  | Value | Filename | Trigger template |
|--|:---:|--|--|
| - | *Default* |`Slayed.21.09.02.Ariana.Marie.Emily.Willis.And.Eliza.Ibarra.XXX.1080p.mp4` | default_template
| ~Title| **Driver**| `Driver.mp4` | default_template
| +Date| **2021-09-02**| `2021-09-02 Driver.mp4` | default_template
| +Performer | **Ariana Marie<br>Emily Willis<br>Eliza Ibarra**| `2021-09-02 Driver.mp4` | default_template
| +Studio | **Vixen**| `Ariana Marie Emily Willis Eliza Ibarra - Driver [Vixen].mp4` | studio_templates [Vixen]
| ~Studio | **Slayed**| `2021-09-02 Ariana Marie Emily Willis Eliza Ibarra - Driver [Slayed].mp4` | studio_templates [Slayed]
| +Performer | **Elsa Jean**| `2021-09-02 Driver [Slayed].mp4` | studio_templates [Slayed]<br>**Reach performer_limit**.
| +Tag | **rename_tag**| `2021 Driver - Slayed HD h264.mp4` | tag_templates [rename_tag]

