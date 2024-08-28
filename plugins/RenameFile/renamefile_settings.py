# By David Maisonave (aka Axter) 2024
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
    "wrapper_styles": {     # Modify these values to change how each part of the filename is wrapped.
        "title": '',
        "performers": '()',
        "tag": '[]',     
        "studio": '{}',
        "galleries": '()', 
        "resolution": '',   # Contains both WITH and HEIGHT
        "width": '',      
        "height": '',      
        "video_codec": '', 
        "frame_rate": '',  
        "date": '()',       # This field is not populated in the DB by default.  It's usually empty.
    },
    # Define the field postfix
    "postfix_styles": {
        "title": '', 
        "performers": '',
        "tag": '',
        "studio": '',
        "galleries": '', 
        "resolution": 'P',              # Contains both WITH and HEIGHT   
        "width": 'W',
        "height": 'P',
        "width_height_seperator": 'x',  # Used in RESOLUTION field as the string seperating WITH and HEIGHT. Example: 720x480 or 1280X720
        "video_codec": '', 
        "frame_rate": 'FR',  
        "date": '',      
    },
    # Add tags to exclude from RenameFile.
    "excludeTags": ["DuplicateMarkForDeletion", "DuplicateMarkForSwap", "DuplicateWhitelistFile","_DuplicateMarkForDeletion","_DuplicateMarkForSwap", "_DuplicateWhitelistFile"],
    # Add path(s) to exclude from RenameFile. Example Usage: r"/path/to/exclude1"  When entering multiple paths, use space. Example: r"/path_1_to/exclude" r"/someOtherPath2Exclude" r"/yetAnotherPath"
    "pathToExclude": "",
    # Define a whitelist of allowed tags or EMPTY to allow all tags. Example Usage: "tag1", "tag2", "tag3"
    "tagWhitelist": "",
    # Define whether the original file name should be used if title is empty
    "if_notitle_use_org_filename": True, # Warning: Do not recommend setting this to False.
    # Current Stash DB schema only allows maximum base file name length to be 255
    "max_filename_length": 255,
}
