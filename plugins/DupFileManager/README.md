# DupFileManager: Ver 1.0.0 (By David Maisonave)

https://discourse.stashapp.cc/t/dupfilemanager/1331

Please post any (**G-Rated**) bugs, feature request, help-request to the following link: [Issues](https://github.com/David-Maisonave/Axter-Stash/issues/new/choose).


DupFileManager is a [Stash](https://github.com/stashapp/stash) plugin which manages duplicate files in the Stash system.
It has both **task** and **tools-UI** components.

## Content
- [Features](#Features)
- [Requirements](#Requirements)
- [Installation](#Installation)
- [Options](#Options)
- [Advanced Options](#Advanced-Options)
- [Future Planned Features, Changes, or Fixes](#Future-Planned-Features-Changes-or-Fixes)
- [Stash Password](#Stash-Password)
- [Screenshots](#Screenshots)
- [Discourse](#Discourse)


### Features

- Creates a duplicate file report which can be accessed from the Stash->Settings->Tools menu options. The report is created as an HTML file and stored in local path under plugins\DupFileManager\report\DuplicateTagScenes.html.
  - See screenshot at the bottom of this page for example report.
  - Items on the left side of the report are the primary duplicates designated for deletion. By default, these duplicates are given a special _duplicate tag.
  - Items on the right side of the report are designated as primary duplicates to keep. They usually have higher resolution, duration and/or preferred paths.
  - The report has the following options:
    - Delete: Delete file and remove from Stash library.
    - Remove: Remove from Stash library.
    - Rename: Rename file.
    - Copy: Copy file from left (source) to right (to-keep).
    - Move: Copy file and metadata left to right.
    - Cpy-Name: Copy file name left to right.
    - Add-Exclude: Add exclude tag to scene,so that scene is excluded from deletion.
    - Remove-Tag: Remove duplicate tag from scene.
    - Flag-Scene: Flag (mark) scene in report as reviewed (or as requiring further review). Optional flags (yellow, green, orange, cyan, pink, red, strike-through, & disable-scene)
    - Merge: Copy Metadata (tags, performers,& studios) from left to right.
- Can merge potential source in the duplicate file names for tag names, performers, and studios.
  - Normally when Stash searches the file name for tag names, performers, and studios, it only does so using the primary file.
- Advance menu
  - ![Screenshot 2024-12-13 164930](https://github.com/user-attachments/assets/10098a4d-de2f-4e83-94ce-5988c5935404)
  - Advance menu can be access from the Stash->Settings->Tools->**[Duplicate File Report]** menu or from the **DupFileManager Tools & Util**.
  - Here are **some** of the options available in the **Advance Menu**.
    - Delete specially tagged duplicates in blacklist path.
    - Delete duplicates with specified file path.
    - Delete duplicates with specific string in File name.
    - Delete duplicates with specified file size range.
    - Delete with specified duration range.
    - Delete with resolution range.
    - Delete duplicates having specified tags.
    - Delete duplicates with specified rating.
    - Delete duplicates with any of the above combinations.
- Bottom extended portion of the Advanced Menu is for customizing the report.
  - ![Screenshot 2025-01-14 141032](https://github.com/user-attachments/assets/a37e2074-cfec-47ae-9eed-a7769fc2245d)
- Delete duplicate file task with the following options:
  - Tasks (Stash->Settings->Task->[Plugin Tasks]->DupFileManager)
    - **Tag Duplicates** - Set tag DuplicateMarkForDeletion to the duplicates with lower resolution, duration, file name length, and/or black list path.
    - **Delete Tagged Duplicates** - Delete scenes having DuplicateMarkForDeletion tag.
    - **Delete Duplicates** - Deletes duplicate files. Performs deletion without first tagging.
  - Plugin UI options (Stash->Settings->Plugins->Plugins->[DupFileManager])
    - Has a 3 tier path selection to determine which duplicates to keep, and which should be candidates for deletions.
      - **Whitelist** - List of paths NOT to be deleted.
        - E.g. C:\Favorite\,E:\MustKeep\
      - **Gray-List** - List of preferential paths to determine which duplicate should be the primary.
        - E.g. C:\2nd_Favorite\,H:\ShouldKeep\
      - **Blacklist** - List of LEAST preferential paths to determine primary candidates for deletion.
        - E.g. C:\Downloads\,F:\DeleteMeFirst\
    - **Permanent Delete** - Enable to permanently delete files, instead of moving files to trash can.
    - **Max Dup Process** - Use to limit the maximum files to process. Can be used to do a limited test run.
    - **Merge Duplicate Tags** - Before deletion, merge metadata from duplicate. E.g. Tag names, performers, studios, title, galleries, rating, details, etc...
    - **Swap High Resolution** - When enabled, swaps higher resolution files between whitelist and blacklist/graylist files.
    - **Swap Longer Duration** - When enabled, swaps scene with longer duration.
  - Options available via DupFileManager_config.py
    - **dup_path** - Alternate path to move deleted files to. Example: "C:\TempDeleteFolder"
    - **toRecycleBeforeSwap** - When enabled, moves destination file to recycle bin before swapping files.
    - **addPrimaryDupPathToDetails** - If enabled, adds the primary duplicate path to the scene detail.
- Tools UI Menu
  ![Screenshot 2024-11-22 145512](https://github.com/user-attachments/assets/03e166eb-ddaa-4eb8-8160-4c9180ca1323)
  - Can access either **Duplicate File Report (DupFileManager)** or **DupFileManager Tools and Utilities** menu options.

### Requirements

- `pip install --upgrade stashapp-tools`
- `pip install requests`
- `pip install Send2Trash`

### Installation

- Follow **Requirements** instructions.
- In the stash plugin directory (C:\Users\MyUserName\.stash\plugins), create a folder named **DupFileManager**.
- Copy all the plugin files to this folder.(**C:\Users\MyUserName\\.stash\plugins\DupFileManager**).
- Click the **[Reload Plugins]** button in Stash->Settings->Plugins->Plugins.

That's it!!!

### Options

- Options are accessible in the GUI via Stash->Settings->Plugins->Plugins->[DupFileManager].
- Also see:
  - Stash->Settings->Tools->[Duplicate File Report]
  - Stash->Settings->Tools->[DupFileManager Tools and Utilities]
- More options available on the following link:
  - [advance_options.html](https://stash.axter.com/1.1/advance_options.html)
  - When using a Stash installation that requires a password or that is not using port 9999...
    - Access above link from Stash->Settings->Tools->[Duplicate File Report]->[**Advance Duplicate File Menu**]
	- Or add the GQL and apiKey as parameters to the URL.
	  - Example: https://stash.axter.com/1.1/advance_options.html?GQL=http://localhost:9999/graphql&apiKey=1234567890abcdefghijklmnop
    - See following for more details: [Stash Password](README.md#Stash-Password)

### Advanced Options

Users can setup a private or alternate remote site by changing variables **remoteReportDirURL** and **js_DirURL** in file DupFileManager_report_config.py.
- The following files are needed at the remote site that is pointed to by **remoteReportDirURL**.
  - DupFileManager_report.js
  - DupFileManager_report.css
  - file.html
  - advance_options.html
- The **js_DirURL** path requires the following:
  - jquery-3.7.1.min.js
  - EasyUI associated files
  - jquery.prompt.js and jquery.prompt.css  

### Stash Password

- Stash installation configured with a password, need to generate an API-Key. 
  - To generate an API-Key:
    - Go to Stash->Settings->Security->Authentication->[API Key]
	- Click on [Generate API-Key]
- Once the API key is generated, DupFileManager will automatically fetch the key.


### Screenshots

- Example DupFileManager duplicate report. (file names have been edited to PG).
  - The report displays preview videos that are playable. Will play a few seconds sample of the video. This requires scan setting **[Generate animated image previews]** to be enabled when scanning all files.
  - ![Screenshot 2024-11-22 225359](https://github.com/user-attachments/assets/dc705b24-e2d7-4663-92fd-1516aa7aacf5)
  - If there's a scene on the left side that has a higher resolution or duration, it gets a yellow highlight on the report.
  - There's an optional setting that allows both preview videos and preview images to be displayed on the report. See settings **htmlIncludeImagePreview** in the **DupFileManager_report_config.py** file.
  - There are many more options available for how the report is created. These options are targeted for more advanced users.  The options are all available in the **DupFileManager_report_config.py** file, and the settings have commented descriptions preceding them. See the **DupFileManager_report_config.py** file in the DupFileManager plugin folder for more details.
- Tools UI Menu
  ![Screenshot 2024-11-22 145512](https://github.com/user-attachments/assets/03e166eb-ddaa-4eb8-8160-4c9180ca1323)
  - Can access either **Duplicate File Report (DupFileManager)** or **DupFileManager Tools and Utilities** menu options.
- DupFileManager Report Menu
  - ![Screenshot 2024-11-22 151630](https://github.com/user-attachments/assets/834ee60f-1a4a-4a3e-bbf7-23aeca2bda1f)
- DupFileManager Tools and Utilities
  - ![Screenshot 2024-11-22 152023](https://github.com/user-attachments/assets/4daaea9e-f603-4619-b536-e6609135bab1)
- Full bottom extended portion of the Advanced Menu screen.
  - ![Screenshot 2025-01-14 141613](https://github.com/user-attachments/assets/77928538-e6f2-47b7-8717-45db054ffbf5)

### Future Planned Features, Changes, or Fixes
- Scheduled Changes
  - On Adv Menu, add option to set special _ToBeDeletedTag_ under Delete button menu.
  - Remove [Max Dup Process] from the Stash->Plugins GUI. This option already exist in advance menu. Planned for 1.2.0 Version.
  - Add chat icon to report which on hover, displays a popup window showing scene details content. Planned for 1.2.0 Version.
  - Add studio icon to report; on hover show studio name. Planned for 1.2.0 Version.
  - Add option on report to view rating and change it. Use an icon with a number on it to show rating. Planned for 1.2.0 Version.
  - On report make flag toggle logic. In other words, when flag button is selected, and scene is already that color, remove the colored flag. Planned for 1.2.0 Version.
  - Add report option to set flag to all scenes missing metadata on Scene-ToKeep or having higher resolution or longer duration on **Duplicate-to-Delete** scene. Planned for 1.2.0 Version.
  - Add option to [**Advance Duplicate File Menu**] to display cover image for preview image. Planned for 1.2.0 Version.
  - On report, when move operation is performed, have it automatically delete the **Duplicate-to-Delete** scene. Planned for 1.2.0 Version.
  - On [**Advance Duplicate File Menu**], add a flag option to the menu on the left side, and shrink the tag option. Planned for 1.2.0 Version.
    - Change the TagOrFlag option on the right side to a check mark.
  - Add option to delete by file type. Planned for 1.2.0 Version.
  - On report, have [Flag or Tag] option still enabled after manually disabling scene. Planned for 1.2.0 Version.
  - On [**Advance Duplicate File Menu**], have the details section hide fully, or partially when the page is first displayed. Planned for 1.4.0 Version.
- Unscheduled Changes
  - Change splitbutton so it hides tooltip when hovering over dropdown side of the button.
  - Fix errors on HTML page listed in https://validator.w3.org.
  - Add logic to merge performers and galleries separately from tag merging on report.
  - Add logic to merge group metadata when selecting merge option on report.
  - Add advanced menu directly to the Stash->Settings->Tools menu. (This change does not look doable!!!)
  - Add report directly to the Stash->Settings->Tools menu. (This change does not look doable!!!)
  - Add double strike-through option to flagging.
  - Add option to report to automatically strip width & height from name on rename. Example: foofoo - 1920x1080P.mp4
  - Move [Merge Duplicate Tags], [Whitelist Delete In Same Folder], and [Swap Better **] field options from the Stash->Plugins GUI to the advance menu.
    

### Discourse
[Discourse-DupFileManager](https://discourse.stashapp.cc/t/dupfilemanager/1331)

**Note:**
- The author of this plugin does **not** monitor Discourse. Please post any (**G-Rated**) bugs, feature request, help-request to the following link: [Issues](https://github.com/David-Maisonave/Axter-Stash/issues/new/choose).
- The [Discourse link](https://discourse.stashapp.cc/t/dupfilemanager/1331) should be use for discussion that would be inappropriate in GitHub.

