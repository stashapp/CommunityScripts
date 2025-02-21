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
    # If enabled, moves destination file to recycle bin before swapping Hi-Res file.
    "toRecycleBeforeSwap" : True,
    # Character used to seperate items on the whitelist, blacklist, and graylist
    "listSeparator" : ",",
    # Enable to permanently delete files, instead of moving files to trash can.
    "permanentlyDelete" : False,
    # After running a 'Delete Duplicates' task, run Clean, Clean-Generated, and Optimize-Database.
    "cleanAfterDel" : True,
    # Generate PHASH after tag or delete task.
    "doGeneratePhash" : False,
    # If enabled, skip processing tagged scenes. This option is ignored if createHtmlReport is True
    "skipIfTagged" : False,
    # If enabled, stop multiple scanning jobs after processing duplicates
    "killScanningPostProcess" : True,
    # If enabled, tag scenes which have longer duration, but lower resolution
    "tagLongDurationLowRes" : True,
    # If enabled, bit-rate is used in important comparisons for function allThingsEqual
    "bitRateIsImporantComp" : True,
    # If enabled, codec is used in important comparisons for function allThingsEqual
    "codecIsImporantComp" : True,
    
    # Tag names **************************************************
    # Tag used to tag duplicates with lower resolution, duration, and file name length.
    "DupFileTag" : "DuplicateMarkForDeletion",
    # Tag name used to tag duplicates in the whitelist. E.g. _DuplicateWhitelistFile
    "DupWhiteListTag" : "_DuplicateWhitelistFile",
    # Tag name used to exclude duplicate from deletion
    "excludeDupFileDeleteTag" : "_ExcludeDuplicateMarkForDeletion",
    # Tag name used to tag scenes with existing tag DuplicateMarkForDeletion, and that are in the graylist
    "graylistMarkForDeletion" : "_GraylistMarkForDeletion",
    # Tag name for scenes with significant longer duration but lower resolution
    "longerDurationLowerResolution" : "_LongerDurationLowerResolution",
    
    # Other tag related options **************************************************
    # If enabled, when adding tag DuplicateMarkForDeletion to graylist scene, also add tag _GraylistMarkForDeletion.
    "graylistTagging" : True,
    # If enabled, the Clear Tags task clears scenes of all tags (DuplicateMarkForDeletion, _DuplicateWhite..., _ExcludeDup..., _Graylist..., _LongerDur...)
    "clearAllDupfileManagerTags" : True,
    # If enabled, append dup tag name with match duplicate distance number. I.E. (DuplicateMarkForDeletion_0) or (DuplicateMarkForDeletion_1)
    "appendMatchDupDistance" : True,
    # If enabled, start dup tag name with an underscore. I.E. (_DuplicateMarkForDeletion). Places tag at the end of tag list.
    "underscoreDupFileTag" : True,
    
    # Favor setings *********************************************
    # If enabled, favor longer file name over shorter. If disabled, favor shorter file name.
    "favorLongerFileName" : True,
    # If enabled, favor larger file size over smaller. If disabled, favor smaller file size.
    "favorLargerFileSize" : True,
    # If enabled, favor videos with a different bit rate value. If favorHighBitRate is true, favor higher rate. If favorHighBitRate is false, favor lower rate
    "favorBitRateChange" : True,
    # If enabled, favor videos with higher bit rate. Used with either favorBitRateChange option or UI [Swap Bit Rate Change] option.
    "favorHighBitRate" : True,
    # If enabled, favor videos with a different frame rate value. If favorHigherFrameRate is true, favor higher rate. If favorHigherFrameRate is false, favor lower rate
    "favorFrameRateChange" : True,
    # If enabled, favor videos with higher frame rate. Used with either favorFrameRateChange option or UI [Swap Better Frame Rate] option.
    "favorHigherFrameRate" : True,
    # If enabled, favor videos with better codec according to codecRanking
    "favorCodecRanking" : True,
    # Codec Ranking in order of preference (default (codecRankingSet1) is order of ranking based on maximum potential efficiency)
    "codecRankingSet1"      : ["h266", "vvc", "av1", "vvdec", "shvc", "h265", "hevc", "xvc", "vp9", "h264", "avc", "mvc", "msmpeg4v10", "vp8", "vcb", "msmpeg4v3", "h263", "h263i", "msmpeg4v2", "msmpeg4v1", "mpeg4", "mpeg-4", "mpeg4video", "theora", "vc3", "vc-3", "vp7", "vp6f", "vp6", "vc1", "vc-1", "mpeg2", "mpeg-2", "mpeg2video", "h262", "h222", "h261", "vp5", "vp4", "vp3", "wmv3", "mpeg1", "mpeg-1", "mpeg1video", "vp3", "wmv2", "wmv1", "wmv", "flv1", "png", "gif", "jpeg", "m-jpeg", "mjpeg"],
    # codecRankingSet2 is in order of least potential efficiency
    "codecRankingSet2"      : ["gif", "png", "flv1", "mpeg1video", "mpeg1", "wmv1", "wmv2", "wmv3", "mpeg2video", "mpeg2", "AVC", "vc1", "vc-1", "msmpeg4v1", "msmpeg4v2", "msmpeg4v3", "mpeg4", "vp6f", "vp8", "h263i", "h263", "h264", "h265", "av1", "vp9", "h266"],
    # codecRankingSet3 is in order of quality
    "codecRankingSet3"      : ["h266", "vp9", "av1", "h265", "h264", "h263", "h263i", "vp8", "vp6f", "mpeg4", "msmpeg4v3", "msmpeg4v2", "msmpeg4v1", "vc-1", "vc1", "AVC", "mpeg2", "mpeg2video", "wmv3", "wmv2", "wmv1", "mpeg1", "mpeg1video", "flv1", "png", "gif"],
    # codecRankingSet4 is in order of compatibility 
    "codecRankingSet4"      : ["h264", "vp8", "mpeg4", "msmpeg4v3", "msmpeg4v2", "msmpeg4v1", "h266", "vp9", "av1", "h265", "h263", "h263i", "vp6f", "vc-1", "vc1", "AVC", "mpeg2", "mpeg2video", "wmv3", "wmv2", "wmv1", "mpeg1", "mpeg1video", "flv1", "png", "gif"],
    # Determines which codecRankingSet to use when ranking codec. Default is 1 for codecRankingSet1
    "codecRankingSetToUse"  : 1,
    
    # The following fields are ONLY used when running DupFileManager in script mode
    "endpoint_Scheme" : "http", # Define endpoint to use when contacting the Stash server
    "endpoint_Host" : "0.0.0.0", # Define endpoint to use when contacting the Stash server
    "endpoint_Port" : 9999, # Define endpoint to use when contacting the Stash server
}

# Codec ranking research source:
    # https://imagekit.io/blog/video-encoding/
    # https://support.spinetix.com/wiki/Video_decoding
    # https://en.wikipedia.org/wiki/Comparison_of_video_codecs
    # https://en.wikipedia.org/wiki/List_of_open-source_codecs
    # https://en.wikipedia.org/wiki/List_of_codecs
    # https://en.wikipedia.org/wiki/Comparison_of_video_container_formats
