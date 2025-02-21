
#  titleFromFilename
Sets a scene's title

## Requirements
- Stash ( versions after the files refactor PR, API>31 )
- Python 3.10
- Requests Module (https://pypi.org/project/requests/)

## Installation

- Download the whole folder `titleFromFilename`
- Place it in your **plugins** folder (where the `config.yml` is). If its not there create it
- Reload plugins from stash (Settings > Plugins -> Reload Plugins)
- titleFromFilename should appear

## Usage
When a scene is created the plugin will set the title to the filename.
By default the file extension will not be added to the title.
If you want to keep the file extension open `config.py` file and change `STRIP_EXT = True` to `STRIP_EXT = False`


