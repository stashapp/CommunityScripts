# Addtional Files Deleter

https://discourse.stashapp.cc/t/addtional-files-deleter/1337

This plugin scans your Stash library for scenes or images where the file count is greater than 1\. It skips the primary file for each object and deletes the additional files. In most cases, duplicate scene files are identical phash matches unless a scene was manually merged. Image objects with multiple files are typically grouped by identical checksums.

## Usage

Copy the repository into your Stash plugins folder or add it through the plugin system and refresh plugins from the Settings screen.

If this is your first run, use the Create Tag task to create an ignore tag that can be applied to Scenes or Images so they are skipped when the other tasks run.

Other than the Create Tag task, you can run the following tasks:

- Images - Delete
- Images - Delete & Record
- Scenes - Delete
- Scenes - Delete & Record

Tasks that just specify Delete remove the additional files from the object. Delete & Record saves the deleted file paths with a "File: " prefix, appends them to the object's current URL list, and updates the object. This is a precaution to preserve metadata that may be useful later.
