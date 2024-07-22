# RenameFile: Ver 0.2.5
RenameFile is a [Stash](https://github.com/stashapp/stash) plugin which performs the following two main task.
- **Rename Scene File Name** (On-The-Fly)
- **Append tag names** to file name
- **Append Performer names** to file name

It allows users to rename the video (scene) file name by editing the [Title] field located in the scene [Edit] tab.
In addition, the plugin optionally also appends tags and performers to the file name if the name does not already exist in the original file name.

Note: This script is **largely** based on the [Renamer](https://github.com/Serechops/Serechops-Stash/tree/main/plugins/Renamer) script.

### Using RenameFile
- Open a scene (via Stash), and click on the [**Edit**] tab. Populate the [**Title**] field with the desired file name. 
  - Note: Do **NOT** include the file folder name and do **NOT** include file extension. 
- After populating the Title field, click the save button.
- After a few seconds, the file will get renamed and the screen will get updated with the new file name.
- The append tags and perfomers option is disable by default. To enable these options go to the Settings->Plugins->Plugins->[RenameFile] field options, and enable the associated field.
- When [Append Tags] is enabled, by default tag names are appended to the file name only if the tags do not exist in the original name. Same applies to [Append Performers] option.
- Since this plugin is largely based on the [Renamer](https://github.com/Serechops/Serechops-Stash/tree/main/plugins/Renamer) plugin, it inherited some of its features, like being able to include any of the following fields when auto-renaming is executed:
  - studio, performers, date, height, video_codec, frame_rate
  - To add these fields see the [Key Fields] option in Settings->Plugins->Plugins->[RenameFile].
  - The [Key Fields] can also be used to change the order for the file name format.
- There are many options in Plugins->[RenameFile] UI, and all the options have detailed descriptions. Please advise us if any of the options need further clarification, and provide example details.
- There are additional options in renamefile_settings.py, but these options should only be changed by advanced users, and any changes should be tested first with the [Dry-Run] option enabled.

**Note:** On Windows 10/11, the file can not be renamed while it's playing. It will result in following error:
`
Error: [WinError 32] The process cannot access the file because it is being used by another process
`
To avoid this error, refresh the URL before changing the Title field.

### Requirements
`pip install stashapp-tools`

`pip install pyYAML`

### Installation
- Follow **Requirements** instructions.
- In the stash plugin directory (C:\Users\MyUserName\.stash\plugins), create a folder named **RenameFile**.
- Copy all the plugin files to this folder.(**C:\Users\MyUserName\.stash\plugins\RenameFile**).
- Restart Stash.

That's it!!!

### Options
To change options, see **renamefile_settings.py** file. After making changes, go to http://localhost:9999/settings?tab=plugins, and click [Reload Plugins].
