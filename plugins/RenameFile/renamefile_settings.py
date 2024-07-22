# Importing config dictionary
# RenameFile plugin main configuration options are available on the Stash GUI under Settings->Plugins->Plugins->[RenameFile].
# Most users should only use the GUI options.
# The configuration options in this file are for advanced users ONLY!!!
    # After making any changes in this file, it's highly recommended that it be first tested with Dry-Run enabled. See Settings->Plugins->Plugins->[RenameFile]-[Dry Run]
        # When dry-run is enabled, only logging occurs and files do NOT get renamed. User can review the renamefile.log file to verify renaming will occur as expected.
        # See (Stash\plugins\RenameFile\renamefile.log)
    # To activate changes to this file, click the [Reload plugins] button. Settings->Plugins->Plugins->[Reload plugins]
config = {
    # Define wrapper styles for different parts of the filename.
    # Use '[]' for square brackets, '{}' for curly brackets, '()' for parentheses, or an empty string for None.
    "wrapper_styles": {
        "studio": '[]',        # Modify these values to change how each part of the filename is wrapped.
        "title": '',         # Use '[]' for square brackets, '{}' for curly brackets, '()' for parentheses, or an empty string for None.
        "performers": '()',    # Modify these values to change how each part of the filename is wrapped.
        "date": '[]',          # Use '[]' for square brackets, '{}' for curly brackets, '()' for parentheses, or an empty string for None.
        "height": '()',        # Modify these values to change how each part of the filename is wrapped.
        "video_codec": '[]',   # Use '[]' for square brackets, '{}' for curly brackets, '()' for parentheses, or an empty string for None.
        "frame_rate": '[]',    # Modify these values to change how each part of the filename is wrapped.
        "tag": '[]'            # Modify these values to change how each tag part of the filename is wrapped.
    },
    # Define whether files should be renamed when moved
    "rename_files": True,
    # Define whether the original file name should be used if title is empty
    "if_notitle_use_org_filename": True, # Warning: Do not recommend setting this to False.
    # Current Stash DB schema only allows maximum base file name length to be 255
    "max_filename_length": 255,
    # "max_filefolder_length": 255, # For future useage
    # "max_filebase_length": 255, # For future useage
}
