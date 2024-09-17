# Description: This is a Stash plugin which manages duplicate files.
# By David Maisonave (aka Axter) Jul-2024 (https://www.axter.com/)
# Get the latest developers version from following link: https://github.com/David-Maisonave/Axter-Stash/tree/main/plugins/DupFileManager
config = {
    # If enabled, adds the primary duplicate path to the scene detail.
    "addPrimaryDupPathToDetails" : True,
    # Alternative path to move duplicate files.
    "dup_path": "", #Example: "C:\\TempDeleteFolder"
    # The threshold as to what percentage is consider a significant shorter time.
    "significantTimeDiff" : .90, # 90% threshold
    # Valued passed to stash API function FindDuplicateScenes.
    "duration_diff" : 10, # (default=10) A value from 1 to 10.
    # If enabled, moves destination file to recycle bin before swapping Hi-Res file.
    "toRecycleBeforeSwap" : True,
    # Character used to seperate items on the whitelist, blacklist, and graylist
    "listSeparator" : ",",
    # Tag used to tag duplicates with lower resolution, duration, and file name length.
    "DupFileTag" : "DuplicateMarkForDeletion",
    # Tag name used to tag duplicates in the whitelist. E.g. DuplicateWhitelistFile
    "DupWhiteListTag" : "DuplicateWhitelistFile",
    
    # The following fields are ONLY used when running DupFileManager in script mode
    "endpoint_Scheme" : "http", # Define endpoint to use when contacting the Stash server
    "endpoint_Host" : "0.0.0.0", # Define endpoint to use when contacting the Stash server
    "endpoint_Port" : 9999, # Define endpoint to use when contacting the Stash server
}
