# Addtional Files Deleter

 https://discourse.stashapp.cc/t/addtional-files-deleter/1337

This is a plugin that will scan your Stash for either scenes or images where the file count is above 1. It will then skip over the primary file for each scene or image object and delete these extra files. Usually scene that contain multiple files are identical Phash matches (Unless you have manually merged unidentical Phashed files). Image objects that contain multiple files are grouped together under identical checksums, not Phashes. (You can't manually merge images as of yet.)

## Usage

Copy repository into Stash plugins folder or add via the new plugins system and refresh your plugins from the Settings.

If on first run you may want to run the Create Tag task, which creates an ignore tag that you can apply to Scenes or Images, so that they are bypassed when any of the other tasks are run.

Other than Create Tag task you can run the following tasks.

Images - Delete
Images - Delete & Record
Scenes - Delete
Scenes - Delete & Record

Tasks that just specify delete will just delete addtional files from their respective objects and Delete & Record will take the file paths of the files to be deleted, prefix them with "File: " (For latter easy searching) and it will append them to the current list of urls the object has and update the object. This is just a precaution to record perhaps usefull metadata an additional file path may hold for later use.
