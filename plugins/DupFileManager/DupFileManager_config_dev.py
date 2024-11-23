# Below fields are in the development stage, and should not be used.
config_dev = {
    # If enabled, ignore reparsepoints. For Windows NT drives only.
    "ignoreReparsepoints" : True,
    # If enabled, ignore symbolic links.
    "ignoreSymbolicLinks" : True,
    
    # If enabled, swap longer file name to preferred path.
    "swapLongFileName" : False,
    
    # If enabled, when finding exact duplicate files, keep file with the shorter name. The default is to keep file name with the longer name.
    "keepShorterFileName" : False,
    # If enabled, when finding duplicate files, keep media with the shorter time length. The default is to keep media with longer time length.
    "keepShorterLength" : False,
    # If enabled, when finding duplicate files, keep media with the lower resolution. The default is to keep media with higher resolution.
    "keepLowerResolution" : False,
    # If enabled, keep duplicate media with high resolution over media with significant longer time.
    "keepHighResOverLen" : False, # Requires keepBothHighResAndLongerLen = False
    # If enabled, keep both duplicate files if the LOWER resolution file is significantly longer.
    "keepBothHighResAndLongerLen" : True,
    
    # Keep empty to check all paths, or populate it with the only paths to check for duplicates
    "onlyCheck_paths": [],     #Example: "onlyCheck_paths": ['C:\\SomeMediaPath\\subpath', "E:\\YetAnotherPath\\subpath', "E:\\YetAnotherPath\\secondSubPath']
}
