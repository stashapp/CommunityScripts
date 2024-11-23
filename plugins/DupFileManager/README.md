# DupFileManager: Ver 0.1.9 (By David Maisonave)

DupFileManager is a [Stash](https://github.com/stashapp/stash) plugin which manages duplicate files in the Stash system.
It has both **task** and **tools-UI** components.

### Features

- Creates a duplicate file report which can be accessed from the settings->tools menu options.The report is created as an HTML file and stored in local path under plugins\DupFileManager\report\DuplicateTagScenes.html.
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
- Advance menu (for specially tagged duplicates)
  ![Screenshot 2024-11-22 145139](https://github.com/user-attachments/assets/d76646f0-c5a8-4069-ad0f-a6e5e96e7ed0)
  - Delete only specially tagged duplicates in blacklist path.
  - Delete duplicates with specified file path.
  - Delete duplicates with specific string in File name.
  - Delete duplicates with specified file size range.
  - Delete with specified duration range.
  - Delete with resolution range.
  - Delete duplicates having specified tags.
  - Delete duplicates with specified rating.
  - Delete duplicates with any of the above combinations.
- Bottom extended portion of the Advanced Menu screen.
  - ![Screenshot 2024-11-22 232005](https://github.com/user-attachments/assets/9a0d2e9d-783b-4ea2-8fa5-3805b40af4eb)
- Delete duplicate file task with the following options:
  - Tasks (Settings->Task->[Plugin Tasks]->DupFileManager)
    - **Tag Duplicates** - Set tag DuplicateMarkForDeletion to the duplicates with lower resolution, duration, file name length, and/or black list path.
    - **Delete Tagged Duplicates** - Delete scenes having DuplicateMarkForDeletion tag.
    - **Delete Duplicates** - Deletes duplicate files. Performs deletion without first tagging.
  - Plugin UI options (Settings->Plugins->Plugins->[DupFileManager])
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

- Options are accessible in the GUI via Settings->Plugins->Plugins->[DupFileManager].
- More options available in DupFileManager_config.py.

### Screenshots

- Example DupFileManager duplicate report. (file names have been edited to PG).
  - The report displays preview videos that are playable. Will play a few seconds sample of the video. This requires scan setting **[Generate animated image previews]** to be enabled when scanning all files.
  - ![Screenshot 2024-11-22 225359](https://github.com/user-attachments/assets/dc705b24-e2d7-4663-92fd-1516aa7aacf5)
  - If there's a scene on the left side that has a higher resolution or duration, it gets a yellow highlight on the report.
  - There's an optional setting that allows both preview videos and preview images to be displayed on the report. See settings **htmlIncludeImagePreview** in the **DupFileManager_report_config.py** file.
  - There are many more options available for how the report is created. These options are targeted for more advanced users.  The options are all available in the **DupFileManager_report_config.py** file, and the settings have commented descriptions preceeding them. See the **DupFileManager_report_config.py** file in the DupFileManager plugin folder for more details.
- Tools UI Menu
![Screenshot 2024-11-22 145512](https://github.com/user-attachments/assets/03e166eb-ddaa-4eb8-8160-4c9180ca1323)
  - Can access either **Duplicate File Report (DupFileManager)** or **DupFileManager Tools and Utilities** menu options.
- DupFileManager Report Menu
  - ![Screenshot 2024-11-22 151630](https://github.com/user-attachments/assets/834ee60f-1a4a-4a3e-bbf7-23aeca2bda1f)
- DupFileManager Tools and Utilities
  - ![Screenshot 2024-11-22 152023](https://github.com/user-attachments/assets/4daaea9e-f603-4619-b536-e6609135bab1)
- Full bottom extended portion of the Advanced Menu screen.
  - ![Screenshot 2024-11-22 232208](https://github.com/user-attachments/assets/bf1f3021-3a8c-4875-9737-60ee3d7fe675)

### Future Planned Features
- Currently, the report and advanced menu do not work with Stash settings requiring a password. Additional logic will be added to have them use the API Key. Planned for 1.0.0 Version.
- Add an advanced menu that will work with non-tagged reports. It will iterated through the existing report file(s) to aplly deletions, instead of searching Stash DB for tagged files. Planned for 1.1.0 Version.
- Greylist deletion option will be added to the advanced menu. Planned for 1.0.5 Version.
- Add advanced menu directly to the Settings->Tools menu. Planned for 1.5.0 Version.
- Add report directly to the Settings->Tools menu. Planned for 1.5.0 Version.
- Remove all flags from all scenes option. Planned for 1.0.5 Version.
- Transfer option settings **[Disable Complete Confirmation]** and **[Disable Delete Confirmation]** when paginating. Planned for 1.0.5 Version.



