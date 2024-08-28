# DupFileManager: Ver 0.1.2 (By David Maisonave)
DupFileManager is a [Stash](https://github.com/stashapp/stash) plugin which manages duplicate file in the Stash system.
### Features
- Can merge potential source in the duplicate file names for tag names, performers, and studios.
  - Normally when Stash searches the file name for tag names, performers, and studios, it only does so using the primary file.
- Delete duplicate file task with the following options:
  - Tasks (Settings->Task->[Plugin Tasks]->DupFileManager)
    - **Tag Duplicate Filename** - Set tag DuplicateMarkForDeletion to the duplicates with lower resolution, duration, file name length, and/or black list path.
    - **Delete Duplicates** - Deletes duplicate files
  - Plugin UI options (Settings->Plugins->Plugins->[DupFileManager])
    - Use a white-list of preferential directories to determine which duplicate will be the primary.
    - Use a gray-list of preferential directories to determine which duplicate should be the primary.
    - Use a black-list to determine which duplicates should be deleted first.
    - **Permanent Delete** - Enable to permanently delete files, instead of moving files to trash can.
    - **Max Dup Process** - Use to limit the maximum files to process. Can be used to do a limited test run.
    - **Merge Duplicate Tags** - Before deletion, merge metadata from duplicate. E.g. Tag names, performers, studios, title, galleries, rating, details, etc... 
  - Options available via DupFileManager_config.py
    - **dup_path** - Alternate path to move deleted files to. Example: "C:\TempDeleteFolder"
    - **swapHighRes** - When enabled, swaps higher resolution files between whitelist and blacklist/graylist files.
    - **swapLongLength** - When enabled, swaps scene with longer duration.
    - **toRecycleBeforeSwap** - When enabled, moves destination file to recycle bin before swapping files.

### Requirements
`pip install --upgrade stashapp-tools`
`pip install pyYAML`
`pip install Send2Trash`

### Installation
- Follow **Requirements** instructions.
- In the stash plugin directory (C:\Users\MyUserName\.stash\plugins), create a folder named **DupFileManager**.
- Copy all the plugin files to this folder.(**C:\Users\MyUserName\\.stash\plugins\DupFileManager**).
- Click the **[Reload Plugins]** button in Stash->Settings->Plugins->Plugins.

That's it!!!

### Options
- Options are accessible in the GUI via Settings->Plugins->Plugins->[DupFileManager].
- More options available in DupFileManager_config.py.

