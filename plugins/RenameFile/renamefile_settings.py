# By David Maisonave (aka Axter) 2025
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
    "excludeTags": ["DuplicateMarkForDeletion", "DuplicateMarkForSwap", "DuplicateWhitelistFile","_DuplicateMarkForDeletion","_DuplicateMarkForSwap", "_DuplicateWhitelistFile","ExcludeDuplicateMarkForDeletion", "_ExcludeDuplicateMarkForDeletion"],
    # Add path(s) to exclude from RenameFile. Example Usage: r"/path/to/exclude1"  When entering multiple paths, use space. Example: r"/path_1_to/exclude" r"/someOtherPath2Exclude" r"/yetAnotherPath"
    "pathToExclude": "",
    # Define a whitelist of allowed tags or EMPTY to allow all tags. Example Usage: "tag1", "tag2", "tag3"
    "tagWhitelist": "",
    # Define whether the original file name should be used if title is empty
    "if_notitle_use_org_filename": True, # Warning: Do not recommend setting this to False.
    # Current Stash DB schema only allows maximum base file name length to be 255
    "max_filename_length": 255,
    # Exclude tags with ignore_auto_tag set to True
    "excludeIgnoreAutoTags": True,
    # Enable to append performers name to file name when renaming a file. Requires performers to be included in [Key Fields] list, which by default it is included.
    "performerAppendEnable": True,
    # Enable to append studio name to file name when renaming a file. Requires studio to be included in [Key Fields] list, which by default it is included.
    "studioAppendEnable": True,
    # Enable to append tag names to file name when renaming a file. Requires tags to be included in [Key Fields] list, which by default it is included.
    "tagAppendEnable": True,
    # Enable to move file instead of rename file. (Not recommended for Windows OS)
    "fileRenameViaMove": False,
    # Maximum allowed performers to be added to file name. If value -1=no limit.
    "max_performers": -1,
    # When value set to true, will enable feature for associated_files_to_rename.
    "rename_associated_files_enable": True, # See associated_files_to_rename option.
    # Add or remove file extensions which are to get renamed when renaming a video file. For example if having a.mp4 and a.funscript, if a.mp4 gets renamed to foofoo.mp4, then a.funscript will get renamed to foofoo.funscript.
    "associated_files_to_rename": [".funscript", ".srt", ".vtt", ".scc", ".ttml", ".dfxp", ".lrc", ".cap", ".sami", ".stl", ".mcc", ".info", ".txt", ".xml"],
        # funscript = A file format that is the standard format for scripting interactive devices by syncing them up to a video
        # SRT       = SubRip Text -> A widely used, simple text file format that displays caption text with timecodes
        # VTT       = WebVTT -> A text-based format that is part of the HTML5 standard
        # SCC       = Scenarist Closed Caption -> A format used by broadcast and digital media producers for TV and movies. 
        # TTML      = Timed Text Markup Language
        # DFXP      = Distribution Format Exchange Profile
        # LRC       = A computer file format that synchronizes song lyrics with an audio file, such as MP3, AAC, or MIDI.
        # CAP       = Primarily used for Japanese subtitles
        # SAMI      = Synchronized Accessible Media Interchange -> A Microsoft accessibility initiative released in the summer of 1998. 
        # STL       = Spruce Subtitle File -> Text file for Apple's DVD Studio Pro
        # MCC       = MacCaption
    
    # handleExe is for Windows only.
    # In Windows, a file can't be renamed if the file is opened by another process.
    # In other words, if a file is being played by Stash or any other video player, the RenameFile plugin
    # will get an access denied error when trying to rename the file.
    # As a workaround, the 'handleExe' field can be populated with the full path to handle.exe or handle64.exe.
    # This executable can be downloaded from the following link:
    # https://learn.microsoft.com/en-us/sysinternals/downloads/handle
    # RenameFile can use the Handle.exe program to close all opened file handles by all processes before renaming the file.
    #
    # Warning: This feature can cause the process playing the video to crash.
    "handleExe": r"C:\Sysinternals\handle64.exe", # https://learn.microsoft.com/en-us/sysinternals/downloads/handle
}
