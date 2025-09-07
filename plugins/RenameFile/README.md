# RenameFile: Ver 1.0.0 (By David Maisonave)

https://discourse.stashapp.cc/t/renamefile/1334

Please post any (**G-Rated**) bugs, feature request, help-request to the following link: [Issues](https://github.com/David-Maisonave/Axter-Stash/issues/new/choose).

RenameFile is a [Stash](https://github.com/stashapp/stash) plugin. Starting version 0.5.5, user can add the current title to the title input field by clicking on the current title. Also, the Stash database gets updated directly instead of running a scan task as long as the database is version 68.

## Content
- [Summary](#Summary)
- [RenameFile vs RenameOnUpdate](#RenameFile-vs-RenameOnUpdate)
- [Using RenameFile](#Using-RenameFile)
- [Requirements](#Requirements)
- [Installation](#Installation)
- [Options](#Options)
- [Bugs and Feature Request](#Bugs-and-Feature-Request)
- [Discourse](#Discourse)


## Summary

- The plugin allows user to rename one scene at a time by editing the **[Title]** field and then clicking **[Save]**.

<img width="270" alt="RenameFileViaTitleUnderEditTab" src="https://github.com/user-attachments/assets/f27d0205-d4ed-44fb-9bb2-5b9a75cba2e0">
<img width="270" alt="RenameFileViaTitle_AfterSaved" src="https://github.com/user-attachments/assets/bf5779ea-77b3-478a-8f72-2dba695db6f0">

- The [Title] field is located under the [Edit] tab.
- After clicking **[Save]**, the change can be seen in File Explorer momentarily.

  - <img width="560" alt="RenameFileViaTitle_AfterSaved_InExplorer" src="https://github.com/user-attachments/assets/60cd807b-dd49-4ac8-9eee-801050e20a2c">

- The plugin can optionally append the following fields if they do not already exist in the file name:

  - title, performers, tags, studio, galleries, resolution, width, height, video_codec, frame_rate, date

- The newly added UI options allows user to perform the following actions when clicking on the fixed title heading.
  - Mouse-click: Append the title heading to the input title field.
  - Ctrl-click: Copy title heading to clipboard.
  - Shift-click: Replace content of input title field with title heading.
  - Alt-click: Copy URI (local file path) to clipboard.

### RenameFile vs RenameOnUpdate

- Although RenameFile has a similar name to other plugins (RenameOnUpdate, Renamer, etc..), it's main purpose is entirely different.
  - The main purpose of RenameFile is to rename one scene at a time, which is the scene being displayed on the web browser. The scene is renamed by using the Title field, which is used to rename the base (stem) of the file name.
  - Other plugins with similar names are used for mass renaming (rename all your scenes), and do not edit the base (stem).

### Using RenameFile

- Open a scene (via Stash), and click on the [**Edit**] tab. Populate the [**Title**] field with the desired file name.
  - Note: Do **NOT** include the file folder name and do **NOT** include file extension.
- After populating the Title field, click the save button.
  - **Warning:** On Windows, if Stash or any other player is playing the video, the RenameFile plugin will get an access denied error. Use one of the following two methods to avoid this error:
    - **Option#1:** Populate **handleExe** in renamefile_settings.py with the full path of handle.exe. RenameFile will use this program to close all opened file handles before renaming a file. See options section for more details.
    - **Option#2:** Refresh the browser for page playing the video before renaming the file via Title field.
- After a few seconds, the file will get renamed and the screen will get updated with the new file name.
- The append tags and performers option is disable by default. To enable these options go to the Settings->Plugins->Plugins->[RenameFile] field options, and enable the associated field.
- When [Append Tags] is enabled, by default tag names are appended to the file name only if the tags do not exist in the original name. Same applies to [Append Performers] option.
- Since this plugin is largely based on the [Renamer](https://github.com/Serechops/Serechops-Stash/tree/main/plugins/Renamer) plugin, it inherited some of its features, like being able to include any of the following fields when auto-renaming is executed:
  - studio, performers, date, height, video_codec, frame_rate
  - To add these fields see the [Key Fields] option in Settings->Plugins->Plugins->[RenameFile].
  - The [Key Fields] can also be used to change the order for the file name format.
- There are many options in Plugins->[RenameFile] UI, and all the options have detailed descriptions. Please advise us if any of the options need further clarification, and provide example details.
  - **[Key Fields]**: (This option may require more detail than could be provided in the GUI)
    - Define key fields to use to format the file name. This is a comma seperated list, and the list should be in the desired format order. (Default=title,performers,studio,tags)
      - For example, if the user wants the performers name before the title, set the performers name first.
      - Example:"performers,title,tags".
    - This is an example of user adding height:"title,performers,tags,height"
    - Here's an example using all of the supported fields: "title,performers,tags,studio,galleries,resolution,width,height,video_codec,frame_rate,date".
    - The **resolution** field equals width + height.
    - The date field is **not** populated by default unless the user explicitly adds the date value to a scene.
    - If **[Key Fields]** is empty, the default value is used. (Default=title,performers,studio,tags)
- There are additional options in renamefile_settings.py, but these options should only be changed by advanced users, and any changes should be tested first with the [Dry-Run] option enabled.

### Requirements

- pip install -r requirements.txt
- Or manually install each requirement:
  - `pip install stashapp-tools --upgrade`
  - `pip install requests`
  - `pip install psutil`
- For (Windows-Only) optional feature **handleExe**, download handle.exe:
  - https://learn.microsoft.com/en-us/sysinternals/downloads/handle

### Installation

- Follow **Requirements** instructions.
- Create a folder named **RenameFile**, in the stash plugin directory (C:\Users\MyUserName\.stash\plugins).
- Download the latest version from the following link: [RenameFile](https://github.com/David-Maisonave/Axter-Stash/tree/main/plugins/RenameFile), and copy the plugin files to folder.(**C:\Users\MyUserName\\.stash\plugins\RenameFile**).
- Click the **[Reload Plugins]** button in Stash->Settings->Plugins->Plugins.

That's it!!!

### Options

- Main options are accessible in the GUI via Settings->Plugins->Plugins->[RenameFile].
- Advanced options are available in the **renamefile_settings.py** file. After making changes, go to http://localhost:9999/settings?tab=plugins, and click [Reload Plugins].
  - **rename_associated_files_enable** - (Default=True). When value set to true, will enable feature for associated_files_to_rename. See **associated_files_to_rename**.
  - **associated_files_to_rename** - This field is a list of file extension that are associated with the video file, and that are renamed when the video file is renamed.  Requires **rename_associated_files_enable** to be True. User should add or remove extensions from this list for their particular requirements.
    - By default, the following extensions are set to this list:
      - **CAP**: Primarily used for Japanese subtitles
      - **DFXP**: Distribution Format Exchange Profile
      - **Funscript**: A file format that is the standard format for scripting interactive devices by syncing them up to a video.
      - **INFO**: A ".info file" is a configuration or metadata file with different meanings depending on the context.
      - **LRC**: A computer file format that synchronizes song lyrics with an audio file, such as MP3, AAC, or MIDI.
      - **MCC**: MacCaption
      - **SAMI**: Synchronized Accessible Media Interchange -> A Microsoft accessibility initiative released in the summer of 1998.
      - **SCC**: Scenarist Closed Caption -> A format used by broadcast and digital media producers for TV and movies.
      - **SRT**: SubRip Text -> A widely used, simple text file format that displays caption text with timecodes
      - **STL**: Spruce Subtitle File -> Text file for Apple's DVD Studio Pro
      - **TTML**: Timed Text Markup Language
      - **TXT**: A plain text file containing information about the associated video file.
      - **VTT**: WebVTT -> A text-based format that is part of the HTML5 standard
      - **XML**: Extensible Markup Language -> A text-based file format used for storing and transporting data for the associated video file. It is designed to be both human-readable and machine-readable.
  - **handleExe** - Populate this field in order to allow RenameFile plugin to close all open file handles.
    - In Windows, a file can't be renamed if the file is opened by another process. In other words, if a file is being played by Stash or any other video player, the RenameFile plugin will get an access denied error when trying to rename the file.
    - As a workaround, the 'handleExe' field can be populated with the full path to handle.exe or handle64.exe. (See requirements for download link)
    - RenameFile can use the Handle.exe program to close all opened file handles by all processes before renaming the file.
    - **Warning:** This feature can cause the process playing the video to crash.

## Bugs and Feature Request

Please use the following link to report RenameFile bugs:
[RenameFile Bug Report](https://github.com/David-Maisonave/Axter-Stash/issues/new?assignees=&labels=Plugin_Bug&projects=&template=bug_report_plugin.yml&title=%F0%9F%AA%B2%5BRenameFile%5D+Your_Short_title)

Please use the following link to report RenameFile Feature Request:[RenameFile Feature Reques](https://github.com/David-Maisonave/Axter-Stash/issues/new?assignees=&labels=Enhancement&projects=&template=feature_request_plugin.yml&title=%F0%9F%92%A1%EF%B8%8F%5BEnhancement%5D%3A%5BRenameFile%5D+Your_Short_title)

Please do **NOT** use the feature request to include any problems associated with errors. Instead use the bug report for error issues.

**Note:** This script is **largely** based on the [Renamer](https://github.com/Serechops/Serechops-Stash/tree/main/plugins/Renamer) script.

### Discourse
[Discourse-RenameFile](https://discourse.stashapp.cc/t/renamefile/1334)

**Note:**
- The author of this plugin does **not** monitor Discourse. Please post any (**G-Rated**) bugs, feature request, help-request to the following link: [Issues](https://github.com/David-Maisonave/Axter-Stash/issues/new/choose).
- The [Discourse link](https://discourse.stashapp.cc/t/renamefile/1334) should be use for discussion that would be inappropriate in GitHub.

