
# SQLITE Renamer for Stash (Task)
Using metadata from your stash to rename your file.

## Requirement
- Stash
- Python 3+ (Tested on Python v3.9.1 64bit, Win10)
- Request Module (https://pypi.org/project/requests/)
- Windows 10 ? (No idea if this work for all OS)

## Installation

- Download the whole folder 'renamer' (config.py, log.py, renamerTask.py/.yml)
- Place it in your **plugins** folder (where the `config.yml` is)
- Reload plugins (Settings > Plugins)
- renamerTask should appear. 

### :exclamation: Make sure to configure the plugin by editing `config.py` before running it :exclamation:

## Usage

- You have tasks (Settings > Task):
	- **Dry-Run 🔍**: Don't edit any file, just show in log. It will create `renamer_scan.txt` that contains every edit.
	  - **[DRYRUN] Check 10 scenes**: Check 10 scenes (by newest updated).
	  - **[DRYRUN] Check all scenes**: Check all scenes.
	- **Process :pencil2:**: Edit your files, **don't touch Stash while doing this task**.
	  - **Process scanned scene from Dry-Run task**: Read `renamer_scan.txt` instead of checking all scenes.
	  - **Process 10 scenes**:  Check 10 scenes (by newest updated).
	  - **Process all scenes**: Check all scenes.

## Configuration

- Read/Edit `config.py`
	- I recommend setting the **log_file** as it can be useful to revert.
- If you have the **renamerOnUpdate** plugin, you can copy the `config.py` from it.

### Example

> Note: The priority is Tag > Studio > Default

The config will be:
```py
# Change filename for scenes from 'Vixen' or 'Slayed' studio.
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
# Use space as a performer separator
performer_splitchar  =  " "
# If the scene has more than 3 performers, the $performer field will be ignored.
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

