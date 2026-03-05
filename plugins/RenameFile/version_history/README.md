##### This page was added starting on version 0.5.6 to keep track of newly added features between versions.
### 0.5.6
- Fixed bug with studio getting the studio ID instead of the name of the studio in rename process.
- Improved performance by having code get all required scene details in one call to stash.
- To remove UI clutter, move rarely used options (performerAppendEnable, studioAppendEnable, tagAppendEnable, & fileRenameViaMove) to renamefile_settings.py
- Change options (performerAppendEnable, studioAppendEnable, tagAppendEnable) to default to True (enabled)
### 0.5.7
- Uploaded missing renamefile.js and renamefile.css files to CommunityScripts
### 0.5.8
- Added setting max_performers to renamefile_settings.py, which allows limitting the quantity of performers added to file name.
### 0.5.9
- Added rename associated file feature. When video file is renamed, associated files will get renamed.
  - Associated files are determind by file extensions listed in variable **associated_files_to_rename** which is in **renamefile_settings.py** file.
  - Option **rename_associated_files_enable** can be used to disable this feature.  It's turned on by default.
### 1.0.0
- Fixed Dry-Run bug, which changed the file name in the database when Dry-Run was enabled.
### 1.0.1
- 
