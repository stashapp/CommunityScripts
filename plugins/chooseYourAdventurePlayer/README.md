# Choose Your Own Adventure Player
A plugin to adapt Choose Your Own Adventure Games to the Stash VideoJS player.

## Setup

The plugin provides various settings, but only the `Game tag`, `Resource path`, and `Scene directory path` settings are required for it to work. 

### Game tag (Required)
This is the name of the tag created to indicate that the selected game clip is the starting video for the game. (I would recommend setting your default filters up to hide other related videos that are not the starting video)

### Resource path (Required)
This is the path where the non-video game resources would live. For example, the path to the `Sample` directory would be the `Resource path`, which contains one game with the id `1234`. Each game within this directory is expected to have a choices directory with all the necessary JSON files as well as an `images` directory with all the relevant images for the game. You can configure assets directly in this plugin if you want. I would just recommend against it to prevent your game files from being deleted if you ever uninstalled this plugin from the Stash plugin page. I would recommend setting up a custom-served folder for your Stash; see:  [Custom served folders](https://docs.stashapp.cc/in-app-manual/configuration/#custom-served-folders). 

### Scene directory path (Required)
This is the path within your Stash library directories where your game scenes are stored. For example, the path to the `Sample` directory would be the `Scene directory path`, which contains one game with the id `1234`. In your case, the videos do not have to live under a videos directory within the `1234` directory.