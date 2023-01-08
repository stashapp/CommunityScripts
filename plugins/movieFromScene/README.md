# Auto-Create Movie From Scene Update
### A python plugin for Stash with GUI config.

Tested under: <br>
Stash v0.18.0 <br>
Python 3.10 with tkinter installed <br>
Windows 11

### Purpose of the plugin:
There are lots of scrapers which can retrieve information for scenes, but there are only a few of them came with movie scrapers. No one have patience to scrape the scene then copy the information from scenes to movies bit by bit. Therefore, this is where the plugin comes in handy: you specify the criteria when to automatically create a movie for your scene. Once the settings are set, and a scene has enough information to fit the criteria, it will automatically use the scene information to create a new movie for you.

### install instructions:
Drop the py_plugins folder and the "movieFromScene.yml" file in stash's plugin folder, and press the `Reload plugins` button in the Plugin settings. <p>

This plugin requires python 3.10 for the new "match" statement. Because "if elif...else..." is so lame! <br>
It also comes with a GUI that can help you set the criteria and run mode easily, but then you need to install "tkinter" in Python. Or you can just edit the config file manually.

### How to use it:
Once installed, you will find under the "Settings->Tasks->Plugin Tasks" a new task called "Auto-Create Movie From Scene" like below:
<p>
<img src="https://user-images.githubusercontent.com/22040708/211181083-e24a7685-073e-4f0c-a00f-872dfbe34ab4.png" width=600 />
<p>
Here you can hit "Disable" to disable the plugin, or "Enable" to activate it, or "Dryrun" to see how it runs in the console log.
If you have installed tkinter, you can click on "Show Config" to see the detail settings.
It's the same thing as you run "movieFromSceneGui.py" directly from file browser or a console. Anyway, you will end up with the screen: 
<p>
<img src="https://user-images.githubusercontent.com/22040708/211181257-2182df00-0b8f-4c93-90d9-885dbb0172f6.png" width= 400 />
<p>
  
* The run mode is obvious: Disable, Enable or just Dry Runs.
* The criteria defines under what condition this plugin will automatically create a movie.
  
As the above example, it will only create a movie when:
  
1. The scene has no movies.
2. The scene has title. ( This is not the same as the file name. )
3. The scene has at least one performer.
4. The scene has some details text.
  
Only when all 4 conditions are met, and after the scene is updated with something, then a movie will be created and linked to that scene. The new movie will try to copy as much information as possible, including title, studio, duration, date, details and front cover. <br>
The new movie will not copy the URL from scene directly, instead it will copy the scene's internal URL, like "http://localhost:9999/scenes/1234" . Because I am planning on create a scraper that will allow you to update the movie information from this URL. It doesn't make much sense to direct-copy the URL if the scraper cannot scrape the URL for movies.

### I got a problem with xxx...
This is only version 1.0. So please raise an issue and let me know. I am not a Linux or Docker guy, so please don't expect me to solve
problems related to that. In fact, this is my first time to build a Python GUI program. Please be understanding.



