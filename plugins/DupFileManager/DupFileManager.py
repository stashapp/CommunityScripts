# Description: This is a Stash plugin which manages duplicate files.
# By David Maisonave (aka Axter) Jul-2024 (https://www.axter.com/)
# Get the latest developers version from following link: https://github.com/David-Maisonave/Axter-Stash/tree/main/plugins/DupFileManager
# Note: To call this script outside of Stash, pass argument --url 
#       Example:    python DupFileManager.py --url http://localhost:9999 -a
try:
    import ModulesValidate
    ModulesValidate.modulesInstalled(["send2trash", "requests"], silent=True)
except Exception as e:
    import traceback, sys
    tb = traceback.format_exc()
    print(f"ModulesValidate Exception. Error: {e}\nTraceBack={tb}", file=sys.stderr)
import os, sys, time, pathlib, argparse, platform, shutil, traceback, logging, requests, json
from datetime import datetime
from StashPluginHelper import StashPluginHelper
from stashapi.stash_types import PhashDistance
from DupFileManager_config import config # Import config from DupFileManager_config.py
from DupFileManager_report_config import report_config

# ToDo: make sure the following line of code works
config |= report_config

parser = argparse.ArgumentParser()
parser.add_argument('--url', '-u', dest='stash_url', type=str, help='Add Stash URL')
parser.add_argument('--trace', '-t', dest='trace', action='store_true', help='Enables debug trace mode.')
parser.add_argument('--add_dup_tag', '-a', dest='dup_tag', action='store_true', help='Set a tag to duplicate files.')
parser.add_argument('--clear_dup_tag', '-c', dest='clear_tag', action='store_true', help='Clear duplicates of duplicate tags.')
parser.add_argument('--del_tag_dup', '-d', dest='del_tag', action='store_true', help='Only delete scenes having DuplicateMarkForDeletion tag.')
parser.add_argument('--remove_dup', '-r', dest='remove', action='store_true', help='Remove (delete) duplicate files.')
parse_args = parser.parse_args()

settings = {
    "matchDupDistance": 0,
    "mergeDupFilename": False,
    "whitelistDelDupInSameFolder": False,
    "zvWhitelist": "",
    "zwGraylist": "",
    "zxBlacklist": "",
    "zxPinklist": "",
    "zyMaxDupToProcess": 0,
    "zySwapHighRes": False,
    "zySwapLongLength": False,
    "zySwapBetterBitRate": False,
    "zySwapCodec": False,
    "zySwapBetterFrameRate": False,
    "zzDebug": False,
    "zzTracing": False,
    "zzdryRun": False,
    
    "zzObsoleteSettingsCheckVer2": False, # This is a hidden variable that is NOT displayed in the UI
    
    # Obsolete setting names
    "zWhitelist": "",
    "zxGraylist": "",
    "zyBlacklist": "",
    "zyMatchDupDistance": 0,
    "zSwapHighRes": False,
    "zSwapLongLength": False,
    "zSwapBetterBitRate": False,
    "zSwapCodec": False,
    "zSwapBetterFrameRate": False,
}
stash = StashPluginHelper(
        stash_url=parse_args.stash_url,
        debugTracing=parse_args.trace,
        settings=settings,
        config=config,
        maxbytes=10*1024*1024,
        DebugTraceFieldName="zzTracing",
        DebugFieldName="zzDebug",
        )
stash.convertToAscii = True
dry_run = stash.Setting("zzdryRun")

advanceMenuOptions = [  "applyCombo", "applyComboPinklist", "applyComboGraylist", "applyComboBlacklist", "pathToDelete", "pathToDeleteBlacklist", "sizeToDeleteLess", "sizeToDeleteGreater", "sizeToDeleteBlacklistLess", "sizeToDeleteBlacklistGreater", "durationToDeleteLess", "durationToDeleteGreater", "durationToDeleteBlacklistLess", "durationToDeleteBlacklistGreater", 
                        "commonResToDeleteLess", "commonResToDeleteEq", "commonResToDeleteGreater", "commonResToDeleteBlacklistLess", "commonResToDeleteBlacklistEq", "commonResToDeleteBlacklistGreater", "resolutionToDeleteLess", "resolutionToDeleteEq", "resolutionToDeleteGreater", 
                        "resolutionToDeleteBlacklistLess", "resolutionToDeleteBlacklistEq", "resolutionToDeleteBlacklistGreater", "ratingToDeleteLess", "ratingToDeleteEq", "ratingToDeleteGreater", "ratingToDeleteBlacklistLess", "ratingToDeleteBlacklistEq", "ratingToDeleteBlacklistGreater", 
                        "tagToDelete", "tagToDeleteBlacklist", "titleToDelete", "titleToDeleteBlacklist", "pathStrToDelete", "pathStrToDeleteBlacklist"]

doJsonReturnModeTypes = ["tag_duplicates_task", "removeDupTag", "addExcludeTag", "removeExcludeTag", "mergeTags", "getLocalDupReportPath", 
                         "createDuplicateReportWithoutTagging", "deleteLocalDupReportHtmlFiles", "clear_duplicate_tags_task",
                         "deleteAllDupFileManagerTags", "deleteBlackListTaggedDuplicatesTask", "deleteTaggedDuplicatesLwrResOrLwrDuration",
                         "deleteBlackListTaggedDuplicatesLwrResOrLwrDuration", "create_duplicate_report_task"]
doJsonReturnModeTypes += [advanceMenuOptions]
doJsonReturn = False
if len(sys.argv) < 2 and stash.PLUGIN_TASK_NAME in doJsonReturnModeTypes:
    doJsonReturn = True
    stash.log_to_norm = stash.LogTo.FILE
elif stash.PLUGIN_TASK_NAME == "doEarlyExit":
    time.sleep(3)
    stash.Log("Doing early exit because of task name")
    time.sleep(3)
    exit(0)

stash.Log("******************* Starting   *******************")
if len(sys.argv) > 1:
    stash.Log(f"argv = {sys.argv}")
else:
    stash.Debug(f"No command line arguments. JSON_INPUT['args'] = {stash.JSON_INPUT['args']}; PLUGIN_TASK_NAME = {stash.PLUGIN_TASK_NAME}; argv = {sys.argv}")
stash.status(logLevel=logging.DEBUG)
               
obsoleteSettingsToConvert = {"zWhitelist" : "zvWhitelist", "zxGraylist" : "zwGraylist", "zyBlacklist" : "zxBlacklist", "zyMatchDupDistance" : "matchDupDistance", "zSwapHighRes" : "zySwapHighRes", "zSwapLongLength" : "zySwapLongLength", "zSwapBetterBitRate" : "zySwapBetterBitRate", "zSwapCodec" : "zySwapCodec", "zSwapBetterFrameRate" : "zySwapBetterFrameRate"}
stash.replaceObsoleteSettings(obsoleteSettingsToConvert, "zzObsoleteSettingsCheckVer2")


LOG_STASH_N_PLUGIN = stash.LogTo.STASH if stash.CALLED_AS_STASH_PLUGIN else stash.LogTo.CONSOLE + stash.LogTo.FILE
listSeparator               = stash.Setting('listSeparator', ',', notEmpty=True)
addPrimaryDupPathToDetails  = stash.Setting('addPrimaryDupPathToDetails') 
clearAllDupfileManagerTags  = stash.Setting('clearAllDupfileManagerTags')
doGeneratePhash             = stash.Setting('doGeneratePhash')
mergeDupFilename            = stash.Setting('mergeDupFilename')
moveToTrashCan              = False if stash.Setting('permanentlyDelete') else True
alternateTrashCanPath       = stash.Setting('dup_path')
whitelistDelDupInSameFolder = stash.Setting('whitelistDelDupInSameFolder')
graylistTagging             = stash.Setting('graylistTagging')
maxDupToProcess             = int(stash.Setting('zyMaxDupToProcess'))
significantTimeDiff         = float(stash.Setting('significantTimeDiff'))
toRecycleBeforeSwap         = stash.Setting('toRecycleBeforeSwap')
cleanAfterDel               = stash.Setting('cleanAfterDel')

swapHighRes                 = stash.Setting('zySwapHighRes')
swapLongLength              = stash.Setting('zySwapLongLength')
swapBetterBitRate           = stash.Setting('zySwapBetterBitRate')
swapCodec                   = stash.Setting('zySwapCodec')
swapBetterFrameRate         = stash.Setting('zySwapBetterFrameRate')
favorLongerFileName         = stash.Setting('favorLongerFileName')
favorLargerFileSize         = stash.Setting('favorLargerFileSize')
favorBitRateChange          = stash.Setting('favorBitRateChange')
favorHighBitRate            = stash.Setting('favorHighBitRate')
favorFrameRateChange        = stash.Setting('favorFrameRateChange')
favorHigherFrameRate        = stash.Setting('favorHigherFrameRate')
favorCodecRanking           = stash.Setting('favorCodecRanking')
codecRankingSetToUse        = stash.Setting('codecRankingSetToUse')
if   codecRankingSetToUse == 4:
    codecRanking            = stash.Setting('codecRankingSet4')
elif codecRankingSetToUse == 3:
    codecRanking            = stash.Setting('codecRankingSet3')
elif codecRankingSetToUse == 2:
    codecRanking            = stash.Setting('codecRankingSet2')
else:
    codecRanking            = stash.Setting('codecRankingSet1')
skipIfTagged                = stash.Setting('skipIfTagged')
killScanningPostProcess     = stash.Setting('killScanningPostProcess')
tagLongDurationLowRes       = stash.Setting('tagLongDurationLowRes')
bitRateIsImporantComp       = stash.Setting('bitRateIsImporantComp')
codecIsImporantComp         = stash.Setting('codecIsImporantComp')

excludeFromReportIfSignificantTimeDiff = False

matchDupDistance            = int(stash.Setting('matchDupDistance'))
matchPhaseDistance          = PhashDistance.EXACT
matchPhaseDistanceText      = "Exact Match"
if (stash.PLUGIN_TASK_NAME == "tag_duplicates_task" or stash.PLUGIN_TASK_NAME == "create_duplicate_report_task") and 'Target' in stash.JSON_INPUT['args']:
    stash.enableProgressBar(False)
    if stash.JSON_INPUT['args']['Target'].startswith("0"):
        matchDupDistance = 0
    elif stash.JSON_INPUT['args']['Target'].startswith("1"):
        matchDupDistance = 1
    elif stash.JSON_INPUT['args']['Target'].startswith("2"):
        matchDupDistance = 2
    elif stash.JSON_INPUT['args']['Target'].startswith("3"):
        matchDupDistance = 3
    
    if stash.JSON_INPUT['args']['Target'].find(":") == 1:
        significantTimeDiff = float(stash.JSON_INPUT['args']['Target'][2:])
        excludeFromReportIfSignificantTimeDiff = True

if matchDupDistance == 1:
    matchPhaseDistance      = PhashDistance.HIGH
    matchPhaseDistanceText  = "High Match"
elif matchDupDistance == 2:
    matchPhaseDistance      = PhashDistance.MEDIUM
    matchPhaseDistanceText  = "Medium Match"
elif matchDupDistance == 3:
    matchPhaseDistance      = PhashDistance.LOW
    matchPhaseDistanceText  = "Low Match"

# significantTimeDiff can not be higher than 1 and shouldn't be lower than .5
if significantTimeDiff > 1:
    significantTimeDiff = float(1.00)
if significantTimeDiff < .25:
    significantTimeDiff = float(0.25)


duplicateMarkForDeletion = stash.Setting('DupFileTag')
if duplicateMarkForDeletion == "":
    duplicateMarkForDeletion = 'DuplicateMarkForDeletion'

base1_duplicateMarkForDeletion = duplicateMarkForDeletion

duplicateWhitelistTag = stash.Setting('DupWhiteListTag')
if duplicateWhitelistTag == "":
    duplicateWhitelistTag = '_DuplicateWhitelistFile'

excludeDupFileDeleteTag = stash.Setting('excludeDupFileDeleteTag')
if excludeDupFileDeleteTag == "":
    excludeDupFileDeleteTag = '_ExcludeDuplicateMarkForDeletion'

graylistMarkForDeletion = stash.Setting('graylistMarkForDeletion')
if graylistMarkForDeletion == "":
    graylistMarkForDeletion = '_GraylistMarkForDeletion'

longerDurationLowerResolution = stash.Setting('longerDurationLowerResolution')
if longerDurationLowerResolution == "":
    longerDurationLowerResolution = '_LongerDurationLowerResolution'

excludeMergeTags = [duplicateMarkForDeletion, duplicateWhitelistTag, excludeDupFileDeleteTag]

if stash.Setting('underscoreDupFileTag') and not duplicateMarkForDeletion.startswith('_'):
    duplicateMarkForDeletionWithOutUnderscore = duplicateMarkForDeletion
    duplicateMarkForDeletion = "_" + duplicateMarkForDeletion
    if stash.renameTag(duplicateMarkForDeletionWithOutUnderscore, duplicateMarkForDeletion):
        stash.Log(f"Renamed tag {duplicateMarkForDeletionWithOutUnderscore} to {duplicateMarkForDeletion}")
    stash.Trace(f"Added underscore to {duplicateMarkForDeletionWithOutUnderscore} = {duplicateMarkForDeletion}")
    excludeMergeTags += [duplicateMarkForDeletion]
else:
    stash.Trace(f"duplicateMarkForDeletion = {duplicateMarkForDeletion}")

base2_duplicateMarkForDeletion = duplicateMarkForDeletion

if stash.Setting('appendMatchDupDistance'):
    duplicateMarkForDeletion += f"_{matchDupDistance}"
    excludeMergeTags += [duplicateMarkForDeletion]

stash.initMergeMetadata(excludeMergeTags)

graylist = stash.Setting('zwGraylist').split(listSeparator)
graylist = [item.lower() for item in graylist]
if graylist == [""] : graylist = []
stash.Trace(f"graylist = {graylist}")   
whitelist = stash.Setting('zvWhitelist').split(listSeparator)
whitelist = [item.lower() for item in whitelist]
if whitelist == [""] : whitelist = []
stash.Trace(f"whitelist = {whitelist}")   
blacklist = stash.Setting('zxBlacklist').split(listSeparator)
blacklist = [item.lower() for item in blacklist]
if blacklist == [""] : blacklist = []
pinklist = stash.Setting('zxPinklist').split(listSeparator)
pinklist = [item.lower() for item in pinklist]
if pinklist == [""] : pinklist = []
stash.Trace(f"pinklist = {pinklist}")
    
def realpath(path):
    """
    get_symbolic_target for win
    """
    try:
        import win32file
        f = win32file.CreateFile(path, win32file.GENERIC_READ,
                                 win32file.FILE_SHARE_READ, None,
                                 win32file.OPEN_EXISTING,
                                 win32file.FILE_FLAG_BACKUP_SEMANTICS, None)
        target = win32file.GetFinalPathNameByHandle(f, 0)
        # an above gives us something like u'\\\\?\\C:\\tmp\\scalarizr\\3.3.0.7978'
        return target.strip('\\\\?\\')
    except ImportError:
        handle = open_dir(path)
        target = get_symbolic_target(handle)
        check_closed(handle)
        return target

def isReparsePoint(path):
    import win32api
    import win32con
    from parse_reparsepoint import Navigator
    FinalPathname = realpath(path)
    stash.Log(f"(path='{path}') (FinalPathname='{FinalPathname}')")
    if FinalPathname != path:
        stash.Log(f"Symbolic link '{path}'")
        return True
    if not os.path.isdir(path):
        path = os.path.dirname(path)
    return win32api.GetFileAttributes(path) & win32con.FILE_ATTRIBUTE_REPARSE_POINT

def testReparsePointAndSymLink(merge=False, deleteDup=False):
    stash.Trace(f"Debug Tracing (platform.system()={platform.system()})")
    myTestPath1 = r"B:\V\V\Tip\POV - Holly Molly petite ginger anal slut - RedTube.mp4" # not a reparse point or symbolic link
    myTestPath2 = r"B:\_\SpecialSet\Amateur Anal Attempts\BRCC test studio name.m2ts" # reparse point
    myTestPath3 = r"B:\_\SpecialSet\Amateur Anal Attempts\Amateur Anal Attempts 4.mp4" #symbolic link
    myTestPath4 = r"E:\Stash\plugins\RenameFile\README.md" #symbolic link
    myTestPath5 = r"E:\_\David-Maisonave\Axter-Stash\plugins\RenameFile\README.md" #symbolic link
    myTestPath6 = r"E:\_\David-Maisonave\Axter-Stash\plugins\DeleteMe\Renamer\README.md" # not reparse point
    stash.Log(f"Testing '{myTestPath1}'")
    if isReparsePoint(myTestPath1):
        stash.Log(f"isSymLink '{myTestPath1}'")
    else:
        stash.Log(f"Not isSymLink '{myTestPath1}'")
        
    if isReparsePoint(myTestPath2):
        stash.Log(f"isSymLink '{myTestPath2}'")
    else:
        stash.Log(f"Not isSymLink '{myTestPath2}'")
        
    if isReparsePoint(myTestPath3):
        stash.Log(f"isSymLink '{myTestPath3}'")
    else:
        stash.Log(f"Not isSymLink '{myTestPath3}'")
        
    if isReparsePoint(myTestPath4):
        stash.Log(f"isSymLink '{myTestPath4}'")
    else:
        stash.Log(f"Not isSymLink '{myTestPath4}'")
        
    if isReparsePoint(myTestPath5):
        stash.Log(f"isSymLink '{myTestPath5}'")
    else:
        stash.Log(f"Not isSymLink '{myTestPath5}'")
        
    if isReparsePoint(myTestPath6):
        stash.Log(f"isSymLink '{myTestPath6}'")
    else:
        stash.Log(f"Not isSymLink '{myTestPath6}'")
    return

detailPrefix = "BaseDup="
detailPostfix = "<BaseDup>\n"

def setTagId(tagName, sceneDetails, DupFileToKeep, TagReason="", ignoreAutoTag=False):
    details = ""
    ORG_DATA_DICT = {'id' : sceneDetails['id']}
    dataDict = ORG_DATA_DICT.copy()
    doAddTag = True
    if addPrimaryDupPathToDetails:
        BaseDupStr = f"{detailPrefix}{DupFileToKeep['files'][0]['path']}\n{stash.STASH_URL}/scenes/{DupFileToKeep['id']}\n{TagReason}(matchDupDistance={matchPhaseDistanceText})\n{detailPostfix}"
        if sceneDetails['details'] == "":
            details = BaseDupStr
        elif not sceneDetails['details'].startswith(detailPrefix):
            details = f"{BaseDupStr};\n{sceneDetails['details']}"
    for tag in sceneDetails['tags']:
        if tag['name'] == tagName:
            doAddTag = False
            break
    if doAddTag:
        stash.addTag(sceneDetails, tagName, ignoreAutoTag=ignoreAutoTag)
    if details != "":
        dataDict.update({'details' : details})
    if dataDict != ORG_DATA_DICT:
        stash.updateScene(dataDict)
        stash.Trace(f"[setTagId] Updated {sceneDetails['files'][0]['path']} with metadata {dataDict} and tag {tagName}", toAscii=True)
    else:
        stash.Trace(f"[setTagId] Nothing to update {sceneDetails['files'][0]['path']} already has tag {tagName}.", toAscii=True)
    return doAddTag

def setTagId_withRetry(tagName, sceneDetails, DupFileToKeep, TagReason="", ignoreAutoTag=False, retryCount = 12, sleepSecondsBetweenRetry = 5):
    errMsg = None
    for i in range(0, retryCount):
        try:
            if errMsg != None:
                stash.Warn(errMsg)
            return setTagId(tagName, sceneDetails, DupFileToKeep, TagReason, ignoreAutoTag)
        except (requests.exceptions.ConnectionError, ConnectionResetError):
            tb = traceback.format_exc()
            errMsg = f"[setTagId] Exception calling setTagId. Will retry; count({i}); Error: {e}\nTraceBack={tb}"
        except Exception as e:
            tb = traceback.format_exc()
            errMsg = f"[setTagId] Unknown exception calling setTagId. Will retry; count({i}); Error: {e}\nTraceBack={tb}"
        time.sleep(sleepSecondsBetweenRetry)

def hasSameDir(path1, path2):
    if pathlib.Path(path1).resolve().parent == pathlib.Path(path2).resolve().parent:
        return True
    return False

def sendToTrash(path):
    if not os.path.isfile(path):
        stash.Warn(f"File does not exist: {path}.", toAscii=True)
        return False
    try:
        from send2trash import send2trash # Requirement: pip install Send2Trash
        send2trash(path)
        return True
    except Exception as e:
        stash.Error(f"Failed to send file {path} to recycle bin. Error: {e}", toAscii=True)
        try:
            if os.path.isfile(path):
                os.remove(path)
                return True
        except Exception as e:
            stash.Error(f"Failed to delete file {path}. Error: {e}", toAscii=True)
    return False
# If ckTimeDiff=False: Does durration2 have significant more time than durration1
def significantTimeDiffCheck(durration1, durration2, ckTimeDiff = False): # If ckTimeDiff=True: is time different significant in either direction. 
    if not isinstance(durration1, int) and 'files' in durration1:
        durration1 = int(durration1['files'][0]['duration'])
        durration2 = int(durration2['files'][0]['duration'])
    timeDiff = getTimeDif(durration1, durration2)
    if ckTimeDiff and timeDiff > 1:
        timeDiff = getTimeDif(durration2, durration1)
    if timeDiff < significantTimeDiff:
        return True
    return False

def getTimeDif(durration1, durration2): # Where durration1 is ecpected to be smaller than durration2 IE(45/60=.75)
    return durration1 / durration2

def isBetterVideo(scene1, scene2, swapCandidateCk = False): # is scene2 better than scene1
    # Prioritize higher reslution over codec, bit rate, and frame rate
    if int(scene1['files'][0]['width']) * int(scene1['files'][0]['height']) > int(scene2['files'][0]['width']) * int(scene2['files'][0]['height']):
        return False
    if (favorBitRateChange and swapCandidateCk == False) or (swapCandidateCk and swapBetterBitRate):
        if (favorHighBitRate and int(scene2['files'][0]['bit_rate']) > int(scene1['files'][0]['bit_rate'])) or (not favorHighBitRate and int(scene2['files'][0]['bit_rate']) < int(scene1['files'][0]['bit_rate'])):
            stash.Trace(f"[isBetterVideo]:[favorHighBitRate={favorHighBitRate}] Better bit rate. {scene1['files'][0]['path']}={scene1['files'][0]['bit_rate']} v.s. {scene2['files'][0]['path']}={scene2['files'][0]['bit_rate']}")
            return True
    if (favorCodecRanking and swapCandidateCk == False) or (swapCandidateCk and swapCodec):
        scene1CodecRank = stash.indexStartsWithInList(codecRanking, scene1['files'][0]['video_codec'])
        scene2CodecRank = stash.indexStartsWithInList(codecRanking, scene2['files'][0]['video_codec'])
        if scene2CodecRank < scene1CodecRank:
            stash.Trace(f"[isBetterVideo] Better codec. {scene1['files'][0]['path']}={scene1['files'][0]['video_codec']}:Rank={scene1CodecRank} v.s. {scene2['files'][0]['path']}={scene2['files'][0]['video_codec']}:Rank={scene2CodecRank}")
            return True
    if (favorFrameRateChange and swapCandidateCk == False) or (swapCandidateCk and swapBetterFrameRate):
        if (favorHigherFrameRate and int(scene2['files'][0]['frame_rate']) > int(scene1['files'][0]['frame_rate'])) or (not favorHigherFrameRate and int(scene2['files'][0]['frame_rate']) < int(scene1['files'][0]['frame_rate'])):
            stash.Trace(f"[isBetterVideo]:[favorHigherFrameRate={favorHigherFrameRate}] Better frame rate. {scene1['files'][0]['path']}={scene1['files'][0]['frame_rate']} v.s. {scene2['files'][0]['path']}={scene2['files'][0]['frame_rate']}")
            return True
    return False

def significantMoreTimeCompareToBetterVideo(scene1, scene2): # is scene2 better than scene1
    if isinstance(scene1, int):
        scene1 = stash.find_scene(scene1)
        scene2 = stash.find_scene(scene2)
    if int(scene1['files'][0]['duration']) >= int(scene2['files'][0]['duration']):
        return False
    if int(scene1['files'][0]['width']) * int(scene1['files'][0]['height']) > int(scene2['files'][0]['width']) * int(scene2['files'][0]['height']):
        if significantTimeDiffCheck(scene1, scene2):
            if tagLongDurationLowRes:
                didAddTag = setTagId_withRetry(longerDurationLowerResolution, scene2, scene1, ignoreAutoTag=True)
                stash.Log(f"Tagged sene2 with tag {longerDurationLowerResolution}, because scene1 is better video, but it has significant less time ({getTimeDif(int(scene1['files'][0]['duration']), int(scene2['files'][0]['duration']))}%) compare to scene2; scene1={scene1['files'][0]['path']} (ID={scene1['id']})(duration={scene1['files'][0]['duration']}); scene2={scene2['files'][0]['path']} (ID={scene2['id']}) (duration={scene1['files'][0]['duration']}); didAddTag={didAddTag}")
            else:
                stash.Warn(f"Scene1 is better video, but it has significant less time ({getTimeDif(int(scene1['files'][0]['duration']), int(scene2['files'][0]['duration']))}%) compare to scene2; Scene1={scene1['files'][0]['path']} (ID={scene1['id']})(duration={scene1['files'][0]['duration']}); Scene2={scene2['files'][0]['path']} (ID={scene2['id']}) (duration={scene1['files'][0]['duration']})")            
        return False
    return True

def allThingsEqual(scene1, scene2): # If all important things are equal, return true
    if int(scene1['files'][0]['duration']) != int(scene2['files'][0]['duration']):
        return False
    if scene1['files'][0]['width'] != scene2['files'][0]['width']:
        return False
    if scene1['files'][0]['height'] != scene2['files'][0]['height']:
        return False
    if bitRateIsImporantComp and scene1['files'][0]['bit_rate'] != scene2['files'][0]['bit_rate']:
        return False
    if codecIsImporantComp and scene1['files'][0]['video_codec'] != scene2['files'][0]['video_codec']:
        return False
    return True

def isSwapCandidate(DupFileToKeep, DupFile):
    # Don't move if both are in whitelist
    if stash.startsWithInList(whitelist, DupFileToKeep['files'][0]['path']) and stash.startsWithInList(whitelist, DupFile['files'][0]['path']):
        return False
    if swapHighRes and int(DupFileToKeep['files'][0]['width']) * int(DupFileToKeep['files'][0]['height']) > int(DupFile['files'][0]['width']) * int(DupFile['files'][0]['height']):
        if not significantTimeDiffCheck(DupFileToKeep, DupFile):
            return True
        else:
            stash.Warn(f"File '{DupFileToKeep['files'][0]['path']}' has a higher resolution than '{DupFile['files'][0]['path']}', but the duration is significantly shorter.", toAscii=True)
    if swapLongLength and int(DupFileToKeep['files'][0]['duration']) > int(DupFile['files'][0]['duration']):
        if int(DupFileToKeep['files'][0]['width']) >= int(DupFile['files'][0]['width']) or int(DupFileToKeep['files'][0]['height']) >= int(DupFile['files'][0]['height']):
            return True
    if isBetterVideo(DupFile, DupFileToKeep, swapCandidateCk=True):
        if not significantTimeDiffCheck(DupFileToKeep, DupFile):
            return True
        else:
            stash.Warn(f"File '{DupFileToKeep['files'][0]['path']}' has better codec/bit-rate than '{DupFile['files'][0]['path']}', but the duration is significantly shorter; DupFileToKeep-ID={DupFileToKeep['id']};DupFile-ID={DupFile['id']};BitRate {DupFileToKeep['files'][0]['bit_rate']} vs {DupFile['files'][0]['bit_rate']};Codec {DupFileToKeep['files'][0]['video_codec']} vs {DupFile['files'][0]['video_codec']};FrameRate {DupFileToKeep['files'][0]['frame_rate']} vs {DupFile['files'][0]['frame_rate']};", toAscii=True)
    return False

dupWhitelistTagId = None
def addDupWhitelistTag():
    global dupWhitelistTagId
    stash.Trace(f"Adding tag duplicateWhitelistTag = {duplicateWhitelistTag}")    
    descp = 'Tag added to duplicate scenes which are in the whitelist. This means there are two or more duplicates in the whitelist.'
    dupWhitelistTagId = stash.createTagId(duplicateWhitelistTag, descp, ignoreAutoTag=True)
    stash.Trace(f"dupWhitelistTagId={dupWhitelistTagId} name={duplicateWhitelistTag}")

excludeDupFileDeleteTagId = None
def addExcludeDupTag():
    global excludeDupFileDeleteTagId
    stash.Trace(f"Adding tag excludeDupFileDeleteTag = {excludeDupFileDeleteTag}")    
    descp = 'Excludes duplicate scene from DupFileManager tagging and deletion process. A scene having this tag will not get deleted by DupFileManager'
    excludeDupFileDeleteTagId = stash.createTagId(excludeDupFileDeleteTag, descp, ignoreAutoTag=True)
    stash.Trace(f"dupWhitelistTagId={excludeDupFileDeleteTagId} name={excludeDupFileDeleteTag}")

def isTaggedExcluded(Scene):
    for tag in Scene['tags']:
        if tag['name'] == excludeDupFileDeleteTag:
            return True
    return False

def isWorseKeepCandidate(DupFileToKeep, Scene):
    if not stash.startsWithInList(whitelist, Scene['files'][0]['path']) and stash.startsWithInList(whitelist, DupFileToKeep['files'][0]['path']):
        return True
    if not stash.startsWithInList(graylist, Scene['files'][0]['path']) and stash.startsWithInList(graylist, DupFileToKeep['files'][0]['path']):
        return True
    if not stash.startsWithInList(blacklist, DupFileToKeep['files'][0]['path']) and stash.startsWithInList(blacklist, Scene['files'][0]['path']):
        return True
    
    if stash.startsWithInList(graylist, Scene['files'][0]['path']) and stash.startsWithInList(graylist, DupFileToKeep['files'][0]['path']) and stash.indexStartsWithInList(graylist, DupFileToKeep['files'][0]['path']) < stash.indexStartsWithInList(graylist, Scene['files'][0]['path']):
        return True
    if stash.startsWithInList(blacklist, DupFileToKeep['files'][0]['path']) and stash.startsWithInList(blacklist, Scene['files'][0]['path']) and stash.indexStartsWithInList(blacklist, DupFileToKeep['files'][0]['path']) < stash.indexStartsWithInList(blacklist, Scene['files'][0]['path']):
        return True      
    return False

def killScanningJobs():
    try:
        if killScanningPostProcess:
            stash.stopJobs(1, "Scanning...")
    except Exception as e:
        tb = traceback.format_exc()
        stash.Error(f"Exception while trying to kill scan jobs; Error: {e}\nTraceBack={tb}")

def getPath(Scene, getParent = False):
    path = stash.asc2(Scene['files'][0]['path'])
    path = path.replace("'", "")
    path = path.replace("\\\\", "\\")
    if getParent:
        return pathlib.Path(path).resolve().parent
    return path

def getHtmlReportTableRow(qtyResults, tagDuplicates):
    htmlReportPrefix = stash.Setting('htmlReportPrefix')
    htmlReportPrefix = htmlReportPrefix.replace('http://127.0.0.1:9999/graphql', stash.url)
    htmlReportPrefix = htmlReportPrefix.replace('http://localhost:9999/graphql', stash.url)
    if 'apiKey' in stash.STASH_CONFIGURATION and stash.STASH_CONFIGURATION['apiKey'] != "":
        htmlReportPrefix = htmlReportPrefix.replace('var apiKey = "";', f"var apiKey = \"{stash.STASH_CONFIGURATION['apiKey']}\";")
    if tagDuplicates == False:
        htmlReportPrefix = htmlReportPrefix.replace('<td><button id="AdvanceMenu"', '<td hidden><button id="AdvanceMenu"')
    htmlReportPrefix = htmlReportPrefix.replace('(QtyPlaceHolder)', f'{qtyResults}')
    htmlReportPrefix = htmlReportPrefix.replace('(MatchTypePlaceHolder)', f'(Match Type = {matchPhaseDistanceText})')
    htmlReportPrefix = htmlReportPrefix.replace('(DateCreatedPlaceHolder)', datetime.now().strftime("%d-%b-%Y, %H:%M:%S"))
    return htmlReportPrefix

htmlReportTableData         = stash.Setting('htmlReportTableData')
htmlDetailDiffTextColor = stash.Setting('htmlDetailDiffTextColor')
htmlSupperHighlight     = stash.Setting('htmlSupperHighlight')
htmlLowerHighlight      = stash.Setting('htmlLowerHighlight')
def getColor(Scene1, Scene2, ifScene1HigherChangeColor = False, roundUpNumber = False, qtyDiff=0):
    if (Scene1 == Scene2) or (roundUpNumber and int(Scene1) == int(Scene2)):
        return ""
    if ifScene1HigherChangeColor and int(Scene1) > int(Scene2):
        if (int(Scene1) - int(Scene2)) > qtyDiff:
            return f' style="color:{htmlDetailDiffTextColor};background-color:{htmlSupperHighlight};"'
        return f' style="color:{htmlDetailDiffTextColor};background-color:{htmlLowerHighlight};"'
    return f' style="color:{htmlDetailDiffTextColor};"'

def getRes(Scene):
    return int(Scene['files'][0]['width']) * int(Scene['files'][0]['height'])

reasonDict = {}

def logReason(DupFileToKeep, Scene, reason):
    global reasonDict
    reasonDict[Scene['id']] = reason
    reasonDict[DupFileToKeep['id']] = reason
    stash.Debug(f"Replacing {DupFileToKeep['files'][0]['path']} with {Scene['files'][0]['path']} for candidate to keep. Reason={reason}")


def getSceneID(scene):
    return htmlReportTableData.replace("<td", f"<td class=\"ID_{scene['id']}\" ")

def fileNameClassID(scene):
    return f" class=\"FN_ID_{scene['id']}\" "

def doesDelCandidateHaveMetadataNotInDupToKeep(DupFile, DupFileToKeep, listName, itemName = 'name'):
    DelCandidateItems = []
    DupToKeepItems = []
    DupToKeepMissingItem = False
    DelCandidateMissingItem = False
    for item in DupFileToKeep[listName]:
        if listName != 'tags' or not item['ignore_auto_tag']:
            if listName == "groups":
                DupToKeepItems += [item['group']['name']]
            elif listName == "galleries":
                item = stash.getGalleryName(item['id'])
                DupToKeepItems += [item[itemName]]
            else:
                DupToKeepItems += [item[itemName]]
    for item in DupFile[listName]:
        if listName != 'tags' or not item['ignore_auto_tag']:
            if listName == "groups":
                name = item['group'][itemName]
            elif listName == "galleries":
                item = stash.getGalleryName(item['id'])
                name = item[itemName]
            else:
                name = item[itemName]
            DelCandidateItems += [name]
            if name not in DupToKeepItems:
                DupToKeepMissingItem = True
    for name in DupToKeepItems:
        if name not in DelCandidateItems:
            DelCandidateMissingItem = True
            break
    return DupToKeepMissingItem, DelCandidateMissingItem


htmlReportNameFolder        = f"{stash.PLUGINS_PATH}{os.sep}DupFileManager{os.sep}report"
htmlReportName              = f"{htmlReportNameFolder}{os.sep}{stash.Setting('htmlReportName')}"
htmlReportTableRow          = stash.Setting('htmlReportTableRow')
htmlIncludeImagePreview     = stash.Setting('htmlIncludeImagePreview')
htmlImagePreviewPopupSize   = stash.Setting('htmlImagePreviewPopupSize')
htmlReportVideoPreview      = stash.Setting('htmlReportVideoPreview')
htmlHighlightTimeDiff       = stash.Setting('htmlHighlightTimeDiff')
htmlPreviewOrStream         = "stream" if stash.Setting('streamOverPreview') else "preview"

def writeRowToHtmlReport(fileHtmlReport, DupFile, DupFileToKeep, QtyTagForDel = "?", tagDuplicates = False):
    fileDoesNotExistStr = "<b style='color:red;background-color:yellow;font-size:10px;'>[File NOT Exist]<b>"
    defaultColorTag = "BlueTag.png"
    defaultColorPerformer = "Headshot.png"
    defaultColorGalleries = "Galleries.png"
    defaultColorGroup = "Group.png"
    htmlTagPrefix = '<div class="dropdown_icon"><img src="https://www.axter.com/images/stash/' + defaultColorTag + '" alt="Tags" style="width:20px;height:20px;"><i class="fa fa-caret-down"></i><div class="dropdown_tag-content">'
    htmlPerformerPrefix = '<div class="dropdown_icon"><img src="https://www.axter.com/images/stash/' + defaultColorPerformer + '" alt="Performers" title="Performers" style="width:20px;height:20px;"><i class="fa fa-caret-down"></i><div class="dropdown_performer-content">'
    htmlGalleryPrefix = '<div class="dropdown_icon"><img src="https://www.axter.com/images/stash/' + defaultColorGalleries + '" alt="Galleries" title="Galleries" style="width:20px;height:20px;"><i class="fa fa-caret-down"></i><div class="dropdown_gallery-content">'
    htmlGroupPrefix = '<div class="dropdown_icon"><img src="https://www.axter.com/images/stash/' + defaultColorGroup + '" alt="Groups" title="Groups" style="width:20px;height:20px;"><i class="fa fa-caret-down"></i><div class="dropdown_group-content">'
    dupFileExist = True if os.path.isfile(DupFile['files'][0]['path']) else False
    toKeepFileExist = True if os.path.isfile(DupFileToKeep['files'][0]['path']) else False
    fileHtmlReport.write(f"{htmlReportTableRow}")
    videoPreview = f"<video {htmlReportVideoPreview} poster=\"{DupFile['paths']['screenshot']}\"><source src=\"{DupFile['paths'][htmlPreviewOrStream]}\" type=\"video/mp4\"></video>"
    if htmlIncludeImagePreview:
        imagePreview = f"<ul><li><img src=\"{DupFile['paths']['sprite']}\" alt=\"\" width=\"140\"><span class=\"large\"><img src=\"{DupFile['paths']['sprite']}\" class=\"large-image\" alt=\"\" width=\"{htmlImagePreviewPopupSize}\"></span></li></ul>"
        fileHtmlReport.write(f"{getSceneID(DupFile)}<table><tr><td>{videoPreview}</td><td>{imagePreview}</td></tr></table></td>")
    else:
        fileHtmlReport.write(f"{getSceneID(DupFile)}{videoPreview}</td>")
    fileHtmlReport.write(f"{getSceneID(DupFile)}<a href=\"{stash.STASH_URL}/scenes/{DupFile['id']}\" target=\"_blank\" rel=\"noopener noreferrer\" {fileNameClassID(DupFile)}>{getPath(DupFile)}</a>")
    fileHtmlReport.write(f"<p><table><tr class=\"scene-details\"><th>Res</th><th>Durration</th><th>BitRate</th><th>Codec</th><th>FrameRate</th><th>size</th><th>ID</th><th>index</th></tr>")
    fileHtmlReport.write(f"<tr class=\"scene-details\"><td {getColor(getRes(DupFile), getRes(DupFileToKeep), True)}>{DupFile['files'][0]['width']}x{DupFile['files'][0]['height']}</td><td {getColor(DupFile['files'][0]['duration'], DupFileToKeep['files'][0]['duration'], True, True, htmlHighlightTimeDiff)}>{DupFile['files'][0]['duration']}</td><td {getColor(DupFile['files'][0]['bit_rate'], DupFileToKeep['files'][0]['bit_rate'])}>{DupFile['files'][0]['bit_rate']}</td><td {getColor(DupFile['files'][0]['video_codec'], DupFileToKeep['files'][0]['video_codec'])}>{DupFile['files'][0]['video_codec']}</td><td {getColor(DupFile['files'][0]['frame_rate'], DupFileToKeep['files'][0]['frame_rate'])}>{DupFile['files'][0]['frame_rate']}</td><td {getColor(DupFile['files'][0]['size'], DupFileToKeep['files'][0]['size'])}>{DupFile['files'][0]['size']}</td><td>{DupFile['id']}</td><td>{QtyTagForDel}</td></tr>")
    
    if DupFile['id'] in reasonDict:
        fileHtmlReport.write(f"<tr class=\"reason-details\"><td colspan='8'>Reason: {reasonDict[DupFile['id']]}</td></tr>")
    # elif DupFileToKeep['id'] in reasonDict:
        # fileHtmlReport.write(f"<tr class=\"reason-details\"><td colspan='8'>Reason: {reasonDict[DupFileToKeep['id']]}</td></tr>")
    elif int(DupFileToKeep['files'][0]['width']) * int(DupFileToKeep['files'][0]['height']) > int(DupFile['files'][0]['width']) * int(DupFile['files'][0]['height']):
        fileHtmlReport.write(f"<tr class=\"reason-details\"><td colspan='8'>Reason: Resolution {DupFile['files'][0]['width']}x{DupFile['files'][0]['height']} < {DupFileToKeep['files'][0]['width']}x{DupFileToKeep['files'][0]['height']}</td></tr>")
    elif significantMoreTimeCompareToBetterVideo(DupFile, DupFileToKeep):
        if significantTimeDiffCheck(DupFile, DupFileToKeep):
            theReason = f"Significant-Duration: <b style='color:red;background-color:neon green;'>{DupFile['files'][0]['duration']} < {DupFileToKeep['files'][0]['duration']}</b>"
        else:
            theReason = f"Duration: {DupFile['files'][0]['duration']} < {DupFileToKeep['files'][0]['duration']}"
        fileHtmlReport.write(f"<tr class=\"reason-details\"><td colspan='8'>Reason: {theReason}</td></tr>")
    elif isBetterVideo(DupFile, DupFileToKeep):
        fileHtmlReport.write(f"<tr class=\"reason-details\"><td colspan='8'>Reason: Better Video</td></tr>")
    elif stash.startsWithInList(DupFileToKeep, DupFile['files'][0]['path']) and not stash.startsWithInList(whitelist, DupFile['files'][0]['path']):
        fileHtmlReport.write(f"<tr class=\"reason-details\"><td colspan='8'>Reason: not whitelist vs whitelist</td></tr>")
    elif isTaggedExcluded(DupFileToKeep) and not isTaggedExcluded(DupFile):
        fileHtmlReport.write(f"<tr class=\"reason-details\"><td colspan='8'>Reason: not ExcludeTag vs ExcludeTag</td></tr>")
    
    fileHtmlReport.write("</table>")
    fileHtmlReport.write('<div class="dropbtn_table"><button value="DoNothing">File Options <i class="fa fa-caret-down"></i></button><div class="dropbtn_table-content">')
    fileHtmlReport.write(f"<div><button title=\"Delete file and remove scene from stash\" value=\"deleteScene\" id=\"{DupFile['id']}\">Delete</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Remove scene from stash only. Do NOT delete file.\" value=\"removeScene\" id=\"{DupFile['id']}\">Remove Scene</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Copy duplicate to file-to-keep.\" value=\"copyScene\" id=\"{DupFile['id']}:{DupFileToKeep['id']}\">Copy to [Duplicate to Keep]</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Replace file-to-keep with this duplicate, and copy metadata from this duplicate to file-to-keep.\" value=\"moveScene\" id=\"{DupFile['id']}:{DupFileToKeep['id']}\">Move to [Duplicate to Keep] and Metadata</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Replace file-to-keep file name with this duplicate file name.\" value=\"renameFile\" id=\"{DupFileToKeep['id']}:{stash.asc2(pathlib.Path(DupFile['files'][0]['path']).stem)}\">Copy this Name to [Duplicate to Keep]</button></div>")
    fileHtmlReport.write("</div></div>")
    
    fileHtmlReport.write(f"<div class=\"dropbtn_table\"><button value=\"flagScene\" id=\"{DupFile['id']}\">Flag or Tag <i class=\"fa fa-caret-down\"></i></button><div class=\"dropbtn_table-content\">")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagScene\" id=\"{DupFile['id']}\">Flag this scene</button></div>")
    # ToDo: Add following buttons:
    #       rename file
    if dupFileExist and tagDuplicates:
        fileHtmlReport.write(f"<div><button title=\"Remove duplicate tag from scene.\" value=\"removeDupTag\" id=\"{DupFile['id']}\">Remove Duplicate Tag</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Add exclude tag to scene. This will exclude scene from deletion via deletion tag\" value=\"addExcludeTag\" id=\"{DupFile['id']}\">Add Exclude Tag</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Merge duplicate scene tags with ToKeep scene tags\" value=\"mergeTags\" id=\"{DupFile['id']}:{DupFileToKeep['id']}\">Merge Tags, Performers, & Galleries</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagSceneyellow highlight\" id=\"{DupFile['id']}\" style=\"background-color:yellow\">Flag Yellow</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagScenegreen highlight\" id=\"{DupFile['id']}\" style=\"background-color:#00FF00\">Flag Green</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagSceneorange highlight\" id=\"{DupFile['id']}\" style=\"background-color:orange\">Flag Orange</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagScenecyan highlight\" id=\"{DupFile['id']}\" style=\"background-color:cyan\">Flag Cyan</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagScenepink highlight\" id=\"{DupFile['id']}\" style=\"background-color:pink\">Flag Pink</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagScenered highlight\" id=\"{DupFile['id']}\" style=\"background-color:red\">Flag Red</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagScenestrike-through\" id=\"{DupFile['id']}\">Flag Strike-through</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagScenedisable-scene\" id=\"{DupFile['id']}\">Flag Disable-scene</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagSceneremove all flags\" id=\"{DupFile['id']}\">Remove All Flags</button></div>")
    fileHtmlReport.write("</div></div>")
    
    
    if dupFileExist:
        fileHtmlReport.write('<div class="dropbtn_table"><button value="DoNothing">Local File <i class="fa fa-caret-down"></i></button><div class="links_table-content">')
        fileHtmlReport.write(f"<div><a class=\"link-items\" title=\"Open folder\" href=\"file://{getPath(DupFile, True)}\">[Folder]</a></div>")
        fileHtmlReport.write(f"<div><a class=\"link-items\" title=\"Play file locally\" href=\"file://{getPath(DupFile)}\">[Play]</a></div>")
        fileHtmlReport.write("</div></div>")
    else:
        fileHtmlReport.write(fileDoesNotExistStr)
    DupToKeepMissingTag, DelCandidateMissingTag = doesDelCandidateHaveMetadataNotInDupToKeep(DupFile, DupFileToKeep, 'tags')
    if len(DupFile['tags']) > 0:
        if DupToKeepMissingTag:
            fileHtmlReport.write(htmlTagPrefix.replace(defaultColorTag, "YellowTag.png"))
        else:
            fileHtmlReport.write(htmlTagPrefix)
        for tag in DupFile['tags']:
            # if not tag['ignore_auto_tag']:
            fileHtmlReport.write(f"<div style='color:black;font-size: 12px;'>{tag['name']}</div>")
        fileHtmlReport.write("</div></div>")
    DupToKeepMissingPerformer, DelCandidateMissingPerformer = doesDelCandidateHaveMetadataNotInDupToKeep(DupFile, DupFileToKeep, 'performers')
    if len(DupFile['performers']) > 0:
        if DupToKeepMissingPerformer:
            fileHtmlReport.write(htmlPerformerPrefix.replace(defaultColorPerformer, "YellowHeadshot.png"))
        else:
            fileHtmlReport.write(htmlPerformerPrefix)
        for performer in DupFile['performers']:
            fileHtmlReport.write(f"<div style='color:black;font-size: 12px;'>{performer['name']}</div>")
        fileHtmlReport.write("</div></div>")
    DupToKeepMissingGallery, DelCandidateMissingGallery = doesDelCandidateHaveMetadataNotInDupToKeep(DupFile, DupFileToKeep, 'galleries', 'title')
    if len(DupFile['galleries']) > 0:
        if DupToKeepMissingGallery:
            fileHtmlReport.write(htmlGalleryPrefix.replace(defaultColorGalleries, "YellowGalleries.png"))
        else:
            fileHtmlReport.write(htmlGalleryPrefix)
        for gallery in DupFile['galleries']:
            gallery = stash.getGalleryName(gallery['id'])
            fileHtmlReport.write(f"<div style='color:black;font-size: 12px;'>{gallery['title']}</div>")
        fileHtmlReport.write("</div></div>")
    DupToKeepMissingGroup, DelCandidateMissingGroup = doesDelCandidateHaveMetadataNotInDupToKeep(DupFile, DupFileToKeep, 'groups')
    if len(DupFile['groups']) > 0:
        if DupToKeepMissingGroup:
            fileHtmlReport.write(htmlGroupPrefix.replace(defaultColorGroup, "YellowGroup.png"))
        else:
            fileHtmlReport.write(htmlGroupPrefix)
        for group in DupFile['groups']:
            fileHtmlReport.write(f"<div style='color:black;font-size: 12px;'>{group['group']['name']}</div>")
        fileHtmlReport.write("</div></div>")
    
    fileHtmlReport.write("</p></td>")
    
    videoPreview = f"<video {htmlReportVideoPreview} poster=\"{DupFileToKeep['paths']['screenshot']}\"><source src=\"{DupFileToKeep['paths'][htmlPreviewOrStream]}\" type=\"video/mp4\"></video>"
    if htmlIncludeImagePreview:
        imagePreview = f"<ul><li><img src=\"{DupFileToKeep['paths']['sprite']}\" alt=\"\" width=\"140\"><span class=\"large\"><img src=\"{DupFileToKeep['paths']['sprite']}\" class=\"large-image\" alt=\"\" width=\"{htmlImagePreviewPopupSize}\"></span></li></ul>"
        fileHtmlReport.write(f"{getSceneID(DupFileToKeep)}<table><tr><td>{videoPreview}</td><td>{imagePreview}</td></tr></table></td>")
    else:
        fileHtmlReport.write(f"{getSceneID(DupFileToKeep)}{videoPreview}</td>")
    fileHtmlReport.write(f"{getSceneID(DupFileToKeep)}<a href=\"{stash.STASH_URL}/scenes/{DupFileToKeep['id']}\" target=\"_blank\" rel=\"noopener noreferrer\" {fileNameClassID(DupFileToKeep)}>{getPath(DupFileToKeep)}</a>")
    fileHtmlReport.write(f"<p><table><tr class=\"scene-details\"><th>Res</th><th>Durration</th><th>BitRate</th><th>Codec</th><th>FrameRate</th><th>size</th><th>ID</th></tr>")
    fileHtmlReport.write(f"<tr class=\"scene-details\"><td>{DupFileToKeep['files'][0]['width']}x{DupFileToKeep['files'][0]['height']}</td><td>{DupFileToKeep['files'][0]['duration']}</td><td>{DupFileToKeep['files'][0]['bit_rate']}</td><td>{DupFileToKeep['files'][0]['video_codec']}</td><td>{DupFileToKeep['files'][0]['frame_rate']}</td><td>{DupFileToKeep['files'][0]['size']}</td><td>{DupFileToKeep['id']}</td></tr></table>")
    
    fileHtmlReport.write('<div class="dropbtn_table"><button value="DoNothing">File Options <i class="fa fa-caret-down"></i></button><div class="dropbtn_table-content">')
    fileHtmlReport.write(f"<div><button title=\"Delete [DupFileToKeep] and remove scene from stash\" value=\"deleteScene\" id=\"{DupFileToKeep['id']}\">Delete</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Remove scene from stash only. Do NOT delete file.\" value=\"removeScene\" id=\"{DupFileToKeep['id']}\">Remove</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Rename file-to-keep.\" value=\"newName\" id=\"{DupFileToKeep['id']}:{stash.asc2(pathlib.Path(DupFileToKeep['files'][0]['path']).stem)}\">Rename</button></div>")
    fileHtmlReport.write("</div></div>")
    
    fileHtmlReport.write(f"<div class=\"dropbtn_table\"><button value=\"flagScene\" id=\"{DupFileToKeep['id']}\">Flag or Tag <i class=\"fa fa-caret-down\"></i></button><div class=\"dropbtn_table-content\">")
    if isTaggedExcluded(DupFileToKeep):
        fileHtmlReport.write(f"<div><button title=\"Remove exclude scene from deletion tag\" value=\"removeExcludeTag\" id=\"{DupFileToKeep['id']}\">Remove Exclude Tag</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagScene\" id=\"{DupFileToKeep['id']}\">Flag this scene</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagSceneyellow highlight\" id=\"{DupFileToKeep['id']}\" style=\"background-color:yellow\">Flag Yellow</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagScenegreen highlight\" id=\"{DupFileToKeep['id']}\" style=\"background-color:#00FF00\">Flag Green</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagSceneorange highlight\" id=\"{DupFileToKeep['id']}\" style=\"background-color:orange\">Flag Orange</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagScenecyan highlight\" id=\"{DupFileToKeep['id']}\" style=\"background-color:cyan\">Flag Cyan</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagScenepink highlight\" id=\"{DupFileToKeep['id']}\" style=\"background-color:pink\">Flag Pink</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagScenered highlight\" id=\"{DupFileToKeep['id']}\" style=\"background-color:red\">Flag Red</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagScenestrike-through\" id=\"{DupFileToKeep['id']}\">Flag Strike-through</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagScenedisable-scene\" id=\"{DupFileToKeep['id']}\">Flag Disable-scene</button></div>")
    fileHtmlReport.write(f"<div><button title=\"Flag scene as reviewed or as awaiting review.\" value=\"flagSceneremove all flags\" id=\"{DupFileToKeep['id']}\">Remove All Flags</button></div>")
    fileHtmlReport.write("</div></div>")
    
    
    fileHtmlReport.write('<div class="dropbtn_table"><button value="DoNothing">Local File <i class="fa fa-caret-down"></i></button><div class="links_table-content">')
    fileHtmlReport.write(f"<div><a class=\"link-items\" title=\"Open folder\" href=\"file://{getPath(DupFileToKeep, True)}\">[Folder]</a></div>")
    if toKeepFileExist:
        fileHtmlReport.write(f"<div><a class=\"link-items\" title=\"Play file locally\" href=\"file://{getPath(DupFileToKeep)}\">[Play]</a></div>")
    fileHtmlReport.write("</div></div>")
    if not toKeepFileExist:
        fileHtmlReport.write(fileDoesNotExistStr)
    
    if len(DupFileToKeep['tags']) > 0:
        if DelCandidateMissingTag:
            fileHtmlReport.write(htmlTagPrefix.replace(defaultColorTag, "RedTag.png"))
        else:
            fileHtmlReport.write(htmlTagPrefix)
        for tag in DupFileToKeep['tags']:
            # if not tag['ignore_auto_tag']:
            fileHtmlReport.write(f"<div style='color:black;font-size: 12px;'>{tag['name']}</div>")
        fileHtmlReport.write("</div></div>")
    if len(DupFileToKeep['performers']) > 0:
        if DelCandidateMissingPerformer:
            fileHtmlReport.write(htmlPerformerPrefix.replace(defaultColorPerformer, "PinkHeadshot.png"))
        else:
            fileHtmlReport.write(htmlPerformerPrefix)
        for performer in DupFileToKeep['performers']:
            fileHtmlReport.write(f"<div style='color:black;font-size: 12px;'>{performer['name']}</div>")
        fileHtmlReport.write("</div></div>")
    if len(DupFileToKeep['galleries']) > 0:
        if DelCandidateMissingGallery:
            fileHtmlReport.write(htmlGalleryPrefix.replace(defaultColorGalleries, "PinkGalleries.png"))
        else:
            fileHtmlReport.write(htmlGalleryPrefix)
        for gallery in DupFileToKeep['galleries']:
            gallery = stash.getGalleryName(gallery['id'])
            fileHtmlReport.write(f"<div style='color:black;font-size: 12px;'>{gallery['title']}</div>")
        fileHtmlReport.write("</div></div>")
    if len(DupFileToKeep['groups']) > 0:
        if DelCandidateMissingGroup:
            fileHtmlReport.write(htmlGroupPrefix.replace(defaultColorGroup, "PinkGroup.png"))
        else:
            fileHtmlReport.write(htmlGroupPrefix)
        for group in DupFileToKeep['groups']:
            fileHtmlReport.write(f"<div style='color:black;font-size: 12px;'>{group['group']['name']}</div>")
        fileHtmlReport.write("</div></div>")
    # ToDo: Add following buttons:
    #       rename file
    fileHtmlReport.write(f"</p></td>")
    
    fileHtmlReport.write(f"</tr><!-- ::DuplicateToDelete_SceneID={DupFile['id']}::DuplicateToKeep_SceneID={DupFileToKeep['id']}:: -->\n")

fragmentForSceneDetails = 'id tags {id name ignore_auto_tag} groups {group {name} } performers {name} galleries {id} files {path width height duration size video_codec bit_rate frame_rate} details '
htmlFileData = " paths {screenshot sprite " + htmlPreviewOrStream + "} "
mergeFieldData = " code director title rating100 date studio {id name} urls "
fragmentForSceneDetails += mergeFieldData + htmlFileData
DuplicateCandidateForDeletionList = f"{htmlReportNameFolder}{os.sep}DuplicateCandidateForDeletionList.txt"

def mangeDupFiles(merge=False, deleteDup=False, tagDuplicates=False, deleteBlacklistOnly=False, deleteLowerResAndDuration=False):
    global reasonDict
    global htmlFileData
    duplicateMarkForDeletion_descp = 'Tag added to duplicate scenes so-as to tag them for deletion.'
    stash.Trace(f"duplicateMarkForDeletion = {duplicateMarkForDeletion}")    
    dupTagId = stash.createTagId(duplicateMarkForDeletion, duplicateMarkForDeletion_descp, ignoreAutoTag=True)
    stash.Trace(f"dupTagId={dupTagId} name={duplicateMarkForDeletion}")
    createHtmlReport            = stash.Setting('createHtmlReport')
    htmlReportNameHomePage      = htmlReportName
    htmlReportPaginate          = stash.Setting('htmlReportPaginate')
    
    
    addDupWhitelistTag()
    addExcludeDupTag()
    
    QtyDupSet = 0
    QtyDup = 0
    QtyExactDup = 0
    QtyAlmostDup = 0
    QtyRealTimeDiff = 0
    QtyTagForDel = 0
    QtyTagForDelPaginate = 0
    PaginateId = 0
    QtyNewlyTag = 0
    QtySkipForDel = 0
    QtyExcludeForDel = 0
    QtySwap = 0
    QtyMerge = 0
    QtyDeleted = 0
    stash.Log("#########################################################################")
    stash.Trace("#########################################################################")
    stash.Log(f"Waiting for find_duplicate_scenes_diff to return results; matchDupDistance={matchPhaseDistanceText}; significantTimeDiff={significantTimeDiff}", printTo=LOG_STASH_N_PLUGIN)
    stash.startSpinningProcessBar()
    if not createHtmlReport:
        htmlFileData = ""
    DupFileSets = stash.find_duplicate_scenes(matchPhaseDistance, fragment=fragmentForSceneDetails)
    stash.stopSpinningProcessBar()
    qtyResults = len(DupFileSets)
    stash.setProgressBarIter(qtyResults)
    stash.Trace("#########################################################################")
    stash.Log(f"Found {qtyResults} duplicate sets...")
    fileHtmlReport = None
    if not os.path.isdir(htmlReportNameFolder):
        os.mkdir(htmlReportNameFolder)
        if not os.path.isdir(htmlReportNameFolder):
            stash.Error(f"Failed to create report directory {htmlReportNameFolder}.")
            return
    if createHtmlReport:
        deleteLocalDupReportHtmlFiles(False)
        fileHtmlReport = open(htmlReportName, "w")
        fileHtmlReport.write(f"{getHtmlReportTableRow(qtyResults, tagDuplicates)}\n")
        fileHtmlReport.write(f"{stash.Setting('htmlReportTable')}\n")
        htmlReportTableHeader   = stash.Setting('htmlReportTableHeader')
        fileHtmlReport.write(f"{htmlReportTableRow}{htmlReportTableHeader}Scene</th>{htmlReportTableHeader}Duplicate to Delete</th>{htmlReportTableHeader}Scene-ToKeep</th>{htmlReportTableHeader}Duplicate to Keep</th></tr>\n")
    fileDuplicateCandidateForDeletionList = open(DuplicateCandidateForDeletionList, "w")
    
    for DupFileSet in DupFileSets:
        # stash.Trace(f"DupFileSet={DupFileSet}", toAscii=True)
        QtyDupSet+=1
        stash.progressBar(QtyDupSet, qtyResults)
        SepLine = "---------------------------"
        DupFileToKeep = None
        DupToCopyFrom = ""
        DupFileDetailList = []
        for DupFile in DupFileSet:
            QtyDup+=1
            Scene = DupFile
            if skipIfTagged and createHtmlReport == False and duplicateMarkForDeletion in Scene['tags']:
                stash.Trace(f"Skipping scene '{Scene['files'][0]['path']}' because already tagged with {duplicateMarkForDeletion}")
                continue
            stash.TraceOnce(f"Scene = {Scene}", toAscii=True)
            DupFileDetailList = DupFileDetailList + [Scene]
            if os.path.isfile(Scene['files'][0]['path']):
                if DupFileToKeep != None:
                    if int(DupFileToKeep['files'][0]['duration']) == int(Scene['files'][0]['duration']): # Do not count fractions of a second as a difference
                        QtyExactDup+=1
                    else:
                        QtyAlmostDup+=1
                        SepLine = "***************************"
                        if significantTimeDiffCheck(DupFileToKeep, Scene):
                            QtyRealTimeDiff += 1
                    
                    if int(DupFileToKeep['files'][0]['width']) * int(DupFileToKeep['files'][0]['height']) < int(Scene['files'][0]['width']) * int(Scene['files'][0]['height']):
                        logReason(DupFileToKeep, Scene, f"resolution: {DupFileToKeep['files'][0]['width']}x{DupFileToKeep['files'][0]['height']} < {Scene['files'][0]['width']}x{Scene['files'][0]['height']}")
                        DupFileToKeep = Scene
                    elif significantMoreTimeCompareToBetterVideo(DupFileToKeep, Scene):
                        if significantTimeDiffCheck(DupFileToKeep, Scene):
                            theReason = f"significant-duration: <b style='color:red;background-color:bright green;'>{DupFileToKeep['files'][0]['duration']} < {Scene['files'][0]['duration']}</b>"
                        else:
                            theReason = f"duration: {DupFileToKeep['files'][0]['duration']} < {Scene['files'][0]['duration']}"
                        reasonKeyword = "significant-duration" if significantTimeDiffCheck(DupFileToKeep, Scene) else "duration"
                        logReason(DupFileToKeep, Scene, theReason)
                        DupFileToKeep = Scene
                    elif isBetterVideo(DupFileToKeep, Scene):
                        logReason(DupFileToKeep, Scene, f"codec,bit_rate, or frame_rate: {DupFileToKeep['files'][0]['video_codec']}, {DupFileToKeep['files'][0]['bit_rate']}, {DupFileToKeep['files'][0]['frame_rate']} : {Scene['files'][0]['video_codec']}, {Scene['files'][0]['bit_rate']}, {Scene['files'][0]['frame_rate']}")
                        DupFileToKeep = Scene
                    elif stash.startsWithInList(whitelist, Scene['files'][0]['path']) and not stash.startsWithInList(whitelist, DupFileToKeep['files'][0]['path']):
                        logReason(DupFileToKeep, Scene, f"not whitelist vs whitelist")
                        DupFileToKeep = Scene
                    elif isTaggedExcluded(Scene) and not isTaggedExcluded(DupFileToKeep):
                        logReason(DupFileToKeep, Scene, f"not ExcludeTag vs ExcludeTag")
                        DupFileToKeep = Scene
                    elif allThingsEqual(DupFileToKeep, Scene):
                        # Only do below checks if all imporant things are equal.
                        if stash.startsWithInList(blacklist, DupFileToKeep['files'][0]['path']) and not stash.startsWithInList(blacklist, Scene['files'][0]['path']):
                            logReason(DupFileToKeep, Scene, f"blacklist vs not blacklist")
                            DupFileToKeep = Scene
                        elif stash.startsWithInList(blacklist, DupFileToKeep['files'][0]['path']) and stash.startsWithInList(blacklist, Scene['files'][0]['path']) and stash.indexStartsWithInList(blacklist, DupFileToKeep['files'][0]['path']) > stash.indexStartsWithInList(blacklist, Scene['files'][0]['path']):
                            logReason(DupFileToKeep, Scene, f"blacklist-index {stash.indexStartsWithInList(blacklist, DupFileToKeep['files'][0]['path'])} > {stash.indexStartsWithInList(blacklist, Scene['files'][0]['path'])}")
                            DupFileToKeep = Scene
                        elif stash.startsWithInList(graylist, Scene['files'][0]['path']) and not stash.startsWithInList(graylist, DupFileToKeep['files'][0]['path']):
                            logReason(DupFileToKeep, Scene, f"not graylist vs graylist")
                            DupFileToKeep = Scene
                        elif stash.startsWithInList(graylist, Scene['files'][0]['path']) and stash.startsWithInList(graylist, DupFileToKeep['files'][0]['path']) and stash.indexStartsWithInList(graylist, DupFileToKeep['files'][0]['path']) > stash.indexStartsWithInList(graylist, Scene['files'][0]['path']):
                            logReason(DupFileToKeep, Scene, f"graylist-index {stash.indexStartsWithInList(graylist, DupFileToKeep['files'][0]['path'])} > {stash.indexStartsWithInList(graylist, Scene['files'][0]['path'])}")
                            DupFileToKeep = Scene
                        elif favorLongerFileName and len(DupFileToKeep['files'][0]['path']) < len(Scene['files'][0]['path']) and not isWorseKeepCandidate(DupFileToKeep, Scene):
                            logReason(DupFileToKeep, Scene, f"path-len {len(DupFileToKeep['files'][0]['path'])} < {len(Scene['files'][0]['path'])}")
                            DupFileToKeep = Scene
                        elif favorLargerFileSize and int(DupFileToKeep['files'][0]['size']) < int(Scene['files'][0]['size']) and not isWorseKeepCandidate(DupFileToKeep, Scene):
                            logReason(DupFileToKeep, Scene, f"size {DupFileToKeep['files'][0]['size']} < {Scene['files'][0]['size']}")
                            DupFileToKeep = Scene
                        elif not favorLongerFileName and len(DupFileToKeep['files'][0]['path']) > len(Scene['files'][0]['path']) and not isWorseKeepCandidate(DupFileToKeep, Scene):
                            logReason(DupFileToKeep, Scene, f"path-len {len(DupFileToKeep['files'][0]['path'])} > {len(Scene['files'][0]['path'])}")
                            DupFileToKeep = Scene
                        elif not favorLargerFileSize and int(DupFileToKeep['files'][0]['size']) > int(Scene['files'][0]['size']) and not isWorseKeepCandidate(DupFileToKeep, Scene):
                            logReason(DupFileToKeep, Scene, f"size {DupFileToKeep['files'][0]['size']} > {Scene['files'][0]['size']}")
                            DupFileToKeep = Scene
                else:
                    DupFileToKeep = Scene
                # stash.Trace(f"DupFileToKeep = {DupFileToKeep}")
                stash.Debug(f"KeepID={DupFileToKeep['id']}, ID={DupFile['id']} duration=({Scene['files'][0]['duration']}), Size=({Scene['files'][0]['size']}), Res=({Scene['files'][0]['width']} x {Scene['files'][0]['height']}) Name={Scene['files'][0]['path']}, KeepPath={DupFileToKeep['files'][0]['path']}", toAscii=True)
            else:
                stash.Error(f"Scene does NOT exist; path={Scene['files'][0]['path']}; ID={Scene['id']}")
        
        for DupFile in DupFileDetailList:
            if DupFileToKeep != None and DupFile['id'] != DupFileToKeep['id']:
                if merge:
                    result = stash.mergeMetadata(DupFile, DupFileToKeep)
                    if result != "Nothing To Merge":
                        QtyMerge += 1
                didAddTag = False
                if stash.startsWithInList(whitelist, DupFile['files'][0]['path']) and (not whitelistDelDupInSameFolder or not hasSameDir(DupFile['files'][0]['path'], DupFileToKeep['files'][0]['path'])):
                    QtySkipForDel+=1
                    if isSwapCandidate(DupFileToKeep, DupFile):
                        if merge:
                            stash.mergeMetadata(DupFileToKeep, DupFile)
                        if toRecycleBeforeSwap:
                            sendToTrash(DupFile['files'][0]['path'])
                        stash.Log(f"Moving better file '{DupFileToKeep['files'][0]['path']}' to '{DupFile['files'][0]['path']}'; SrcID={DupFileToKeep['id']};DescID={DupFile['id']};QtyDup={QtyDup};Set={QtyDupSet} of {qtyResults};QtySwap={QtySwap};QtySkipForDel={QtySkipForDel}", toAscii=True, printTo=LOG_STASH_N_PLUGIN)
                        try:
                            shutil.move(DupFileToKeep['files'][0]['path'], DupFile['files'][0]['path'])
                            QtySwap+=1
                        except Exception as e:
                            tb = traceback.format_exc()
                            stash.Error(f"Exception while moving file '{DupFileToKeep['files'][0]['path']}' to '{DupFile['files'][0]['path']}; SrcID={DupFileToKeep['id']};DescID={DupFile['id']}'; Error: {e}\nTraceBack={tb}")
                        DupFileToKeep = DupFile
                    else:
                        if dupWhitelistTagId and tagDuplicates:
                            didAddTag = setTagId_withRetry(duplicateWhitelistTag, DupFile, DupFileToKeep, ignoreAutoTag=True)
                        stash.Log(f"NOT processing duplicate, because it's in whitelist. '{DupFile['files'][0]['path']}';AddTagW={didAddTag};QtyDup={QtyDup};Set={QtyDupSet} of {qtyResults};QtySkipForDel={QtySkipForDel}", toAscii=True)
                else:
                    if isTaggedExcluded(DupFile):
                        QtyExcludeForDel+=1
                        stash.Log(f"Excluding file {DupFile['files'][0]['path']} because tagged for exclusion via tag {excludeDupFileDeleteTag};QtyDup={QtyDup};Set={QtyDupSet} of {qtyResults}")
                    else:
                        # ToDo: Add merge logic here
                        if deleteDup:
                            DupFileName = DupFile['files'][0]['path']
                            if not deleteBlacklistOnly or stash.startsWithInList(blacklist, DupFile['files'][0]['path']):
                                if not deleteLowerResAndDuration or (isBetterVideo(DupFile, DupFileToKeep) and not significantMoreTimeCompareToBetterVideo(DupFileToKeep, DupFile)) or (significantMoreTimeCompareToBetterVideo(DupFile, DupFileToKeep) and not isBetterVideo(DupFileToKeep, DupFile)):
                                    QtyDeleted += 1
                                    DupFileNameOnly = pathlib.Path(DupFileName).stem
                                    stash.Warn(f"Deleting duplicate '{DupFileName}';QtyDup={QtyDup};Set={QtyDupSet} of {qtyResults};QtyDeleted={QtyDeleted}", toAscii=True, printTo=LOG_STASH_N_PLUGIN)
                                    if alternateTrashCanPath != "":
                                        destPath = f"{alternateTrashCanPath }{os.sep}{DupFileNameOnly}"
                                        if os.path.isfile(destPath):
                                            destPath = f"{alternateTrashCanPath }{os.sep}_{time.time()}_{DupFileNameOnly}"
                                        shutil.move(DupFileName, destPath)
                                    elif moveToTrashCan:
                                        sendToTrash(DupFileName)
                                    if dry_run:
                                        result = f"dry_run enabled, but scene {DupFile['files'][0]['path']} would have been removed from stash with delete_file=True."
                                        stash.Log(result)
                                    else:
                                        stash.destroyScene(DupFile['id'], delete_file=True)
                                    updateDuplicateCandidateForDeletionList(DupFile['id'], removeScene = True)
                        elif tagDuplicates or fileHtmlReport != None:
                            if excludeFromReportIfSignificantTimeDiff and significantTimeDiffCheck(DupFile, DupFileToKeep, True):
                                stash.Log(f"Skipping duplicate {DupFile['files'][0]['path']} (ID={DupFile['id']}), because of time difference greater than {significantTimeDiff} for file {DupFileToKeep['files'][0]['path']}.")
                                continue
                            QtyTagForDel+=1
                            QtyTagForDelPaginate+=1
                            didAddTag = False
                            if tagDuplicates:
                                didAddTag = setTagId_withRetry(duplicateMarkForDeletion, DupFile, DupFileToKeep, ignoreAutoTag=True)
                            if fileHtmlReport != None:
                                # ToDo: Add icons using github path
                                #    add copy button with copy icon
                                #    add move button with r-sqr icon
                                #    repace delete button with trashcan icon
                                #    add rename file code and button
                                #    add delete only from stash db code and button using DB delete icon
                                stash.Debug(f"Adding scene {DupFile['id']} to HTML report.")
                                writeRowToHtmlReport(fileHtmlReport, DupFile, DupFileToKeep, QtyTagForDel, tagDuplicates)
                                fileDuplicateCandidateForDeletionList.write(json.dumps(DupFile) + "\n")
                                if QtyTagForDelPaginate >= htmlReportPaginate:
                                    QtyTagForDelPaginate = 0
                                    fileHtmlReport.write("</table>\n")
                                    homeHtmReportLink = f"<a id=\"HomePage\" class=\"link-items\" title=\"Home Page\" href=\"file://{htmlReportNameHomePage}\">[Home]</a>"
                                    prevHtmReportLink = ""
                                    if PaginateId > 0:
                                        if PaginateId > 1:
                                            prevHtmReport = htmlReportNameHomePage.replace(".html", f"_{PaginateId-1}.html")
                                        else:
                                            prevHtmReport = htmlReportNameHomePage
                                        prevHtmReportLink = f"<a id=\"PrevPage\" class=\"link-items\" title=\"Previous Page\" href=\"file://{prevHtmReport}\">[Prev]</a>"
                                    nextHtmReport = htmlReportNameHomePage.replace(".html", f"_{PaginateId+1}.html")
                                    nextHtmReportLink = f"<a id=\"NextPage\" class=\"link-items\" title=\"Next Page\" href=\"file://{nextHtmReport}\">[Next]</a>"
                                    fileHtmlReport.write(f"<center><table><tr><td>{homeHtmReportLink}</td><td>{prevHtmReportLink}</td><td>{nextHtmReportLink}</td></tr></table></center>")
                                    fileHtmlReport.write(f"{stash.Setting('htmlReportPostfix')}")
                                    fileHtmlReport.close()
                                    PaginateId+=1
                                    fileHtmlReport = open(nextHtmReport, "w")
                                    fileHtmlReport.write(f"{getHtmlReportTableRow(qtyResults, tagDuplicates)}\n")
                                    if PaginateId > 1:
                                        prevHtmReport = htmlReportNameHomePage.replace(".html", f"_{PaginateId-1}.html")
                                    else:
                                        prevHtmReport = htmlReportNameHomePage
                                    prevHtmReportLink = f"<a id=\"PrevPage_Top\" class=\"link-items\" title=\"Previous Page\" href=\"file://{prevHtmReport}\">[Prev]</a>"
                                    if len(DupFileSets) > (QtyTagForDel + htmlReportPaginate):
                                        nextHtmReport = htmlReportNameHomePage.replace(".html", f"_{PaginateId+1}.html")
                                        nextHtmReportLink = f"<a id=\"NextPage_Top\" class=\"link-items\" title=\"Next Page\" href=\"file://{nextHtmReport}\">[Next]</a>"
                                        fileHtmlReport.write(f"<center><table><tr><td>{homeHtmReportLink}</td><td>{prevHtmReportLink}</td><td>{nextHtmReportLink}</td></tr></table></center>")
                                    else:
                                        stash.Debug(f"DupFileSets Qty = {len(DupFileSets)}; DupFileDetailList Qty = {len(DupFileDetailList)}; QtyTagForDel = {QtyTagForDel}; htmlReportPaginate = {htmlReportPaginate}; QtyTagForDel + htmlReportPaginate = {QtyTagForDel+htmlReportPaginate}")
                                        fileHtmlReport.write(f"<center><table><tr><td>{homeHtmReportLink}</td><td>{prevHtmReportLink}</td></tr></table></center>")
                                    fileHtmlReport.write(f"{stash.Setting('htmlReportTable')}\n")
                                    fileHtmlReport.write(f"{htmlReportTableRow}{htmlReportTableHeader}Scene</th>{htmlReportTableHeader}Duplicate to Delete</th>{htmlReportTableHeader}Scene-ToKeep</th>{htmlReportTableHeader}Duplicate to Keep</th></tr>\n")
                            
                            if tagDuplicates and graylistTagging and stash.startsWithInList(graylist, DupFile['files'][0]['path']):
                                stash.addTag(DupFile, graylistMarkForDeletion, ignoreAutoTag=True)
                            if didAddTag:
                                QtyNewlyTag+=1
                            if QtyTagForDel == 1:
                                stash.Log(f"Tagging duplicate {DupFile['files'][0]['path']} for deletion with tag {duplicateMarkForDeletion}", toAscii=True, printTo=LOG_STASH_N_PLUGIN)
                            else:
                                didAddTag = 1 if didAddTag else 0
                                stash.Log(f"Tagging duplicate {DupFile['files'][0]['path']} for deletion;AddTag={didAddTag};Qty={QtyDup};Set={QtyDupSet} of {qtyResults};NewlyTag={QtyNewlyTag};isTag={QtyTagForDel}", toAscii=True, printTo=LOG_STASH_N_PLUGIN)
        stash.Trace(SepLine)
        if maxDupToProcess > 0 and ((QtyTagForDel > maxDupToProcess) or (QtyTagForDel == 0 and QtyDup > maxDupToProcess)):
            break
    
    fileDuplicateCandidateForDeletionList.close()
    if fileHtmlReport != None:
        fileHtmlReport.write("</table>\n")
        if PaginateId > 0:
            homeHtmReportLink = f"<a id=\"HomePage_Top\" class=\"link-items\" title=\"Home Page\" href=\"file://{htmlReportNameHomePage}\">[Home]</a>"
            if PaginateId > 1:
                prevHtmReport = htmlReportNameHomePage.replace(".html", f"_{PaginateId-1}.html")
            else:
                prevHtmReport = htmlReportNameHomePage
            prevHtmReportLink = f"<a class=\"link-items\" title=\"Previous Page\" href=\"file://{prevHtmReport}\">[Prev]</a>"
            fileHtmlReport.write(f"<center><table><tr><td>{homeHtmReportLink}</td><td>{prevHtmReportLink}</td></tr></table></center>")
        fileHtmlReport.write(f"<h2>Total Tagged for Deletion {QtyTagForDel}</h2>\n")
        fileHtmlReport.write(f"{stash.Setting('htmlReportPostfix')}")
        fileHtmlReport.close()
        stash.Log(f"************************************************************", printTo = stash.LogTo.STASH)
        stash.Log(f"************************************************************", printTo = stash.LogTo.STASH)
        stash.Log(f"View Stash duplicate report using Stash->Settings->Tools->[Duplicate File Report]", printTo = stash.LogTo.STASH)
        stash.Log(f"************************************************************", printTo = stash.LogTo.STASH)
        stash.Log(f"************************************************************", printTo = stash.LogTo.STASH)

        
    stash.Debug("#####################################################")
    stash.Log(f"QtyDupSet={QtyDupSet}, QtyDup={QtyDup}, QtyDeleted={QtyDeleted}, QtySwap={QtySwap}, QtyTagForDel={QtyTagForDel}, QtySkipForDel={QtySkipForDel}, QtyExcludeForDel={QtyExcludeForDel}, QtyExactDup={QtyExactDup}, QtyAlmostDup={QtyAlmostDup}, QtyMerge={QtyMerge}, QtyRealTimeDiff={QtyRealTimeDiff}", printTo=LOG_STASH_N_PLUGIN)
    killScanningJobs()
    if cleanAfterDel and deleteDup:
        stash.Log("Adding clean jobs to the Task Queue", printTo=LOG_STASH_N_PLUGIN)
        stash.metadata_clean()
        stash.metadata_clean_generated()
        stash.optimise_database()
    if doGeneratePhash:
        stash.metadata_generate({"phashes": True})
    sys.stdout.write("Report complete")

def findCurrentTagId(tagNames):
    # tagNames = [i for n, i in enumerate(tagNames) if i not in tagNames[:n]]
    for tagName in tagNames:
        if tag := stash.find_tag(tagName):
            return tag['id'], tagName
    return "-1", None

def toJson(data):
    # data = data.replace("'", '"')
    data = data.replace("\\", "\\\\")
    data = data.replace("\\\\\\\\", "\\\\")
    return json.loads(data)

def getAnAdvanceMenuOptionSelected(taskName, target, isTagOnlyScenes, tagOrFlag, pathToDelete, sizeToDelete, durationToDelete, resolutionToDelete, ratingToDelete, tagToDelete, titleToDelete, pathStrToDelete, fileNotExistToDelete, compareToLess, compareToGreater):
    stash.Log(f"Processing taskName = {taskName}, target = {target}")
    if "Blacklist" in taskName:
        tagOrFlag = "Blacklist"
    if "Graylist" in taskName:
        tagOrFlag = "Graylist"
    if "Pinklist" in taskName:
        tagOrFlag = "Pinklist"
    if "YellowFlag" in taskName:
        tagOrFlag = "YellowFlag"
    if "GreenFlag" in taskName:
        tagOrFlag = "GreenFlag"
    if "OrangeFlag" in taskName:
        tagOrFlag = "OrangeFlag"
    if "CyanFlag" in taskName:
        tagOrFlag = "CyanFlag"
    if "PinkFlag" in taskName:
        tagOrFlag = "PinkFlag"
    if "RedFlag" in taskName:
        tagOrFlag = "RedFlag"
    if "Less" in taskName:
        compareToLess = True
    if "Greater" in taskName:
        compareToGreater = True
    
    if ":TagOnlyScenes" in target:
        isTagOnlyScenes = True
        target = target.replace(":TagOnlyScenes","")
    
    if "pathToDelete" in taskName:
        pathToDelete = target.lower()
    elif "sizeToDelete" in taskName:
        sizeToDelete = int(target)
    elif "durationToDelete" in taskName:
        durationToDelete = int(target)
    elif "commonResToDelete" in taskName:
        resolutionToDelete = int(target)
    elif "resolutionToDelete" in taskName:
        resolutionToDelete = int(target)
    elif "ratingToDelete" in taskName:
        ratingToDelete = int(target) * 20
    elif "tagToDelete" in taskName:
        tagToDelete = target.lower()
    elif "titleToDelete" in taskName:
        titleToDelete = target.lower()
    elif "pathStrToDelete" in taskName:
        pathStrToDelete = target.lower()
    elif "fileNotExistToDelete" in taskName:
        fileNotExistToDelete = True
        if target == "Tagged":
            isTagOnlyScenes = True
        else:
            isTagOnlyScenes = False
    elif "TagOnlyScenes" in taskName:
        isTagOnlyScenes = True
    return isTagOnlyScenes, tagOrFlag, pathToDelete, sizeToDelete, durationToDelete, resolutionToDelete, ratingToDelete, tagToDelete, titleToDelete, pathStrToDelete, fileNotExistToDelete, compareToLess, compareToGreater

def getAdvanceMenuOptionSelected(advanceMenuOptionSelected):
    isTagOnlyScenes = False
    tagOrFlag = None
    pathToDelete = ""
    sizeToDelete = -1
    durationToDelete = -1
    resolutionToDelete = -1
    ratingToDelete = -1
    tagToDelete = ""
    titleToDelete = ""
    pathStrToDelete = ""
    fileNotExistToDelete = False
    compareToLess = False
    compareToGreater = False
    if advanceMenuOptionSelected:
        stash.enableProgressBar(False)
        if 'Target' in stash.JSON_INPUT['args']:
            if "applyCombo" in stash.PLUGIN_TASK_NAME:
                jsonObject = toJson(stash.JSON_INPUT['args']['Target'])
                for taskName in jsonObject:
                    isTagOnlyScenes, tagOrFlag, pathToDelete, sizeToDelete, durationToDelete, resolutionToDelete, ratingToDelete, tagToDelete, titleToDelete, pathStrToDelete, fileNotExistToDelete, compareToLess, compareToGreater = getAnAdvanceMenuOptionSelected(taskName, jsonObject[taskName], isTagOnlyScenes, tagOrFlag, pathToDelete, sizeToDelete, durationToDelete, resolutionToDelete, ratingToDelete, tagToDelete, titleToDelete, pathStrToDelete, fileNotExistToDelete, compareToLess, compareToGreater)
            else:
                return getAnAdvanceMenuOptionSelected(stash.PLUGIN_TASK_NAME, stash.JSON_INPUT['args']['Target'], isTagOnlyScenes, tagOrFlag, pathToDelete, sizeToDelete, durationToDelete, resolutionToDelete, ratingToDelete, tagToDelete, titleToDelete, pathStrToDelete, compareToLess, compareToGreater)
    return isTagOnlyScenes, tagOrFlag, pathToDelete, sizeToDelete, durationToDelete, resolutionToDelete, ratingToDelete, tagToDelete, titleToDelete, pathStrToDelete, fileNotExistToDelete, compareToLess, compareToGreater

def getScenesFromReport():
    stash.Log(f"Getting candidates for deletion from file {DuplicateCandidateForDeletionList}.")
    scenes = []
    lines = None
    with open(DuplicateCandidateForDeletionList, 'r') as file:
        lines = file.readlines()
    for line in lines:
        scenes += [json.loads(line)]
    return scenes

deleteSceneFlagBgColor = "#646464"

def getFlaggedScenesFromReport(fileName, flagType):
    stash.Debug(f"Searching for flag type {flagType} in file {fileName}")
    flaggedScenes = []
    lines = None
    with open(fileName, 'r') as file:
        lines = file.readlines()
    stash.Trace(f"line count = {len(lines)}")
    for line in lines:
        if line.startswith(f".ID_") and flagType in line and deleteSceneFlagBgColor not in line:
            id = int(line[4:line.index("{")])
            stash.Debug(f"Found scene id = {id} with flag {flagType}")
            flaggedScenes +=[id]
            stash.Trace(f"flaggedScenes count = {len(flaggedScenes)}")
        elif line.startswith("</style>"):
            if len(flaggedScenes) > 0:
                return flaggedScenes
            break
    stash.Trace(f"Did not find flag {flagType}")
    return None
        
def getFlaggedScenes(flagType=None, ReportName = htmlReportName):
    flaggedScenes = []
    if flagType == None:
        flagType = stash.JSON_INPUT['args']['Target']
        if flagType == "green":
            flagType = "#00FF00"
    else:
        if flagType == "YellowFlag":
            flagType = "yellow"
        if flagType == "GreenFlag":
            flagType = "#00FF00"
        if flagType == "OrangeFlag":
            flagType = "orange"
        if flagType == "CyanFlag":
            flagType = "cyan"
        if flagType == "PinkFlag":
            flagType = "pink"
        if flagType == "RedFlag":
            flagType = "red"
    
    stash.Debug(f"Searching for scenes with flag type {flagType}")
    
    if os.path.isfile(ReportName):
        results = getFlaggedScenesFromReport(ReportName,flagType)
        if results != None:
            flaggedScenes += results
            stash.Trace(f"flaggedScenes count = {len(flaggedScenes)}")
        for x in range(2, 9999):
            fileName = ReportName.replace(".html", f"_{x-1}.html")
            stash.Debug(f"Checking if file '{fileName}' exist.")
            if not os.path.isfile(fileName):
                break
            results = getFlaggedScenesFromReport(fileName,flagType)
            if results != None:
                flaggedScenes += results
                stash.Trace(f"flaggedScenes count = {len(flaggedScenes)}")
    else:
        stash.Log(f"Report file does not exist: {ReportName}")    
    
    return flaggedScenes, flagType

# //////////////////////////////////////////////////////////////////////////////
# //////////////////////////////////////////////////////////////////////////////
def manageDuplicatesTaggedOrInReport(deleteScenes=False, clearTag=False, setGrayListTag=False, tagId=-1, advanceMenuOptionSelected=False, checkFlagOption=False):
    tagName = None
    if tagId == -1:
        tagId, tagName = findCurrentTagId([duplicateMarkForDeletion, base1_duplicateMarkForDeletion, base2_duplicateMarkForDeletion, 'DuplicateMarkForDeletion', '_DuplicateMarkForDeletion'])
    if int(tagId) < 0:
        stash.Warn(f"Could not find tag ID for tag '{duplicateMarkForDeletion}'.")
        return

    excludedTags = [duplicateMarkForDeletion]
    if clearAllDupfileManagerTags:
        excludedTags = [duplicateMarkForDeletion, duplicateWhitelistTag, excludeDupFileDeleteTag, graylistMarkForDeletion, longerDurationLowerResolution]
    
    isTagOnlyScenes, tagOrFlag, pathToDelete, sizeToDelete, durationToDelete, resolutionToDelete, ratingToDelete, tagToDelete, titleToDelete, pathStrToDelete, fileNotExistToDelete, compareToLess, compareToGreater = getAdvanceMenuOptionSelected(advanceMenuOptionSelected)
    if advanceMenuOptionSelected and deleteScenes and pathToDelete == "" and tagToDelete == "" and titleToDelete == "" and pathStrToDelete == "" and sizeToDelete == -1 and durationToDelete == -1 and resolutionToDelete == -1 and ratingToDelete == -1 and fileNotExistToDelete == False:
        stash.Error("Running advance menu option with no options enabled.")
        return
    
    flaggedScenes = None
    flagType = None
    if checkFlagOption or (tagOrFlag != None and "Flag" in tagOrFlag):
        if checkFlagOption:
            flaggedScenes, flagType = getFlaggedScenes()
        else:
            checkFlagOption = True
            flaggedScenes, flagType = getFlaggedScenes(tagOrFlag)
        if flaggedScenes == None or len(flaggedScenes) == 0:
            stash.Error(f"Early exit, because found no scenes with flag {flagType}.")
            return
        stash.Debug(f"Fournd {len(flaggedScenes)} scenes with flag {flagType}")
   
    QtyDup = 0
    QtyDeleted = 0
    QtyClearedTags = 0
    QtySetGraylistTag = 0
    QtyFailedQuery = 0
    stash.Debug("#########################################################################")
    stash.startSpinningProcessBar()
    if advanceMenuOptionSelected == False and checkFlagOption == False:
        isTagOnlyScenes = True
    if isTagOnlyScenes:
        stash.Log(f"Getting candidates for deletion by using tag-ID {tagId} and tag-name {tagName}; isTagOnlyScenes={isTagOnlyScenes};advanceMenuOptionSelected={advanceMenuOptionSelected}")
        scenes = stash.find_scenes(f={"tags": {"value":tagId, "modifier":"INCLUDES"}}, fragment=fragmentForSceneDetails) # Old setting 'id tags {id name} files {path width height duration size video_codec bit_rate frame_rate} details title rating100')
    else:
        scenes = getScenesFromReport()
    stash.stopSpinningProcessBar()
    qtyResults = len(scenes)
    if isTagOnlyScenes:
        stash.Log(f"Found {qtyResults} scenes with tag ({duplicateMarkForDeletion})")
    else:
        stash.Log(f"Found {qtyResults} scenes in report")
    stash.setProgressBarIter(qtyResults)
    for scene in scenes:
        QtyDup += 1
        stash.progressBar(QtyDup, qtyResults)
        # scene = stash.find_scene(sceneID['id'])
        # if scene == None or len(scene) == 0:
            # stash.Warn(f"Could not get scene data for scene ID {scene['id']}.")
            # QtyFailedQuery += 1
            # continue
        # stash.Trace(f"scene={scene}")
        if clearTag:
            QtyClearedTags += 1 
            # ToDo: Add logic to exclude graylistMarkForDeletion
            tags = [int(item['id']) for item in scene["tags"] if item['name'] not in excludedTags]
            # if clearAllDupfileManagerTags:
                # tags = []
                # for tag in scene["tags"]:
                    # if tag['name'] in excludedTags:
                        # continue
                    # tags += [int(tag['id'])]
            stash.TraceOnce(f"tagId={tagId}, len={len(tags)}, tags = {tags}")
            dataDict = {'id' : scene['id']}
            if addPrimaryDupPathToDetails:
                sceneDetails = scene['details']
                if sceneDetails.find(detailPrefix) == 0 and sceneDetails.find(detailPostfix) > 1:
                    Pos1 = sceneDetails.find(detailPrefix)
                    Pos2 = sceneDetails.find(detailPostfix)
                    sceneDetails = sceneDetails[0:Pos1] + sceneDetails[Pos2 + len(detailPostfix):]                
                dataDict.update({'details' : sceneDetails})
            dataDict.update({'tag_ids' : tags})
            stash.Log(f"Updating scene with {dataDict};QtyClearedTags={QtyClearedTags};Count={QtyDup} of {qtyResults}")
            stash.updateScene(dataDict)
            # stash.removeTag(scene, duplicateMarkForDeletion)
        elif setGrayListTag:
            if stash.startsWithInList(graylist, scene['files'][0]['path']):
                QtySetGraylistTag+=1
                if stash.addTag(scene, graylistMarkForDeletion, ignoreAutoTag=True):
                    stash.Log(f"Added tag {graylistMarkForDeletion} to scene {scene['files'][0]['path']};QtySetGraylistTag={QtySetGraylistTag};Count={QtyDup} of {qtyResults}")
                else:
                    stash.Trace(f"Scene already had tag {graylistMarkForDeletion}; {scene['files'][0]['path']}")
        elif deleteScenes:
            DupFileName = scene['files'][0]['path']
            DupFileNameOnly = pathlib.Path(DupFileName).stem
            if checkFlagOption and (tagOrFlag == None or "Flag" not in tagOrFlag):
                if int(scene['id']) in flaggedScenes:
                    stash.Log(f"Found {flagType} flagged candidate for deletion; Scene ID = {scene['id']}")
                else:
                    continue
            elif advanceMenuOptionSelected:
                if checkFlagOption:
                    if int(scene['id']) in flaggedScenes:
                        stash.Trace(f"Found {flagType} flag for Scene ID = {scene['id']}")
                    else:
                        continue
                if tagOrFlag == "Blacklist":
                    if not stash.startsWithInList(blacklist, scene['files'][0]['path']):
                        continue
                if tagOrFlag == "Graylist":
                    if not stash.startsWithInList(graylist, scene['files'][0]['path']):
                        continue
                if tagOrFlag == "Pinklist":
                    if not stash.startsWithInList(pinklist, scene['files'][0]['path']):
                        continue
                if pathToDelete != "":
                    if not DupFileName.lower().startswith(pathToDelete):
                        stash.Debug(f"Skipping file {DupFileName} because it does not start with {pathToDelete}.")
                        continue
                if pathStrToDelete != "":
                    if not pathStrToDelete in DupFileName.lower():
                        stash.Debug(f"Skipping file {DupFileName} because it does not contain value {pathStrToDelete}.")
                        continue
                if sizeToDelete != -1:
                    compareTo = int(scene['files'][0]['size'])
                    if compareToLess:
                        if not (compareTo < sizeToDelete):
                            continue
                    elif compareToGreater:
                        if not (compareTo > sizeToDelete):
                            continue
                    else:
                        if not compareTo == sizeToDelete:
                            continue
                if durationToDelete != -1:
                    compareTo = int(scene['files'][0]['duration'])
                    if compareToLess:
                        if not (compareTo < durationToDelete):
                            continue
                    elif compareToGreater:
                        if not (compareTo > durationToDelete):
                            continue
                    else:
                        if not compareTo == durationToDelete:
                            continue
                if resolutionToDelete != -1:
                    compareTo = int(scene['files'][0]['width']) * int(scene['files'][0]['height'])
                    if compareToLess:
                        if not (compareTo < resolutionToDelete):
                            continue
                    elif compareToGreater:
                        if not (compareTo > resolutionToDelete):
                            continue
                    else:
                        if not compareTo == resolutionToDelete:
                            continue
                if ratingToDelete != -1:
                    if scene['rating100'] == "None":
                        compareTo = 0
                    else:
                        compareTo = int(scene['rating100'])
                    if compareToLess:
                        if not (compareTo < resolutionToDelete):
                            continue
                    elif compareToGreater:
                        if not (compareTo > resolutionToDelete):
                            continue
                    else:
                        if not compareTo == resolutionToDelete:
                            continue
                if titleToDelete != "":
                    if not titleToDelete in scene['title'].lower():
                        stash.Debug(f"Skipping file {DupFileName} because it does not contain value {titleToDelete} in title ({scene['title']}).")
                        continue
                if tagToDelete != "":
                    doProcessThis = False
                    for tag in scene['tags']:
                        if tag['name'].lower() == tagToDelete:
                            doProcessThis = True
                            break
                    if doProcessThis == False:
                        continue
                if fileNotExistToDelete:
                    if os.path.isfile(scene['files'][0]['path']):
                        continue
            stash.Log(f"Deleting duplicate '{DupFileName}'", toAscii=True, printTo=LOG_STASH_N_PLUGIN)
            if alternateTrashCanPath != "":
                destPath = f"{alternateTrashCanPath }{os.sep}{DupFileNameOnly}"
                if os.path.isfile(destPath):
                    destPath = f"{alternateTrashCanPath }{os.sep}_{time.time()}_{DupFileNameOnly}"
                shutil.move(DupFileName, destPath)
            elif moveToTrashCan:
                sendToTrash(DupFileName)
            result = deleteScene(scene=scene['id'], deleteFile=True, writeToStdOut=False)
            QtyDeleted += 1
            stash.Debug(f"destroyScene result={result} for file {DupFileName};QtyDeleted={QtyDeleted};Count={QtyDup} of {qtyResults}", toAscii=True)
        else:
            stash.Error("manageDuplicatesTaggedOrInReport called with invlaid input arguments. Doing early exit.")
            return
    stash.Debug("#####################################################")
    stash.Log(f"QtyDup={QtyDup}, QtyClearedTags={QtyClearedTags}, QtySetGraylistTag={QtySetGraylistTag}, QtyDeleted={QtyDeleted}, QtyFailedQuery={QtyFailedQuery}", printTo=LOG_STASH_N_PLUGIN)
    killScanningJobs()
    if deleteScenes and not advanceMenuOptionSelected:
        if cleanAfterDel:
            stash.Log("Adding clean jobs to the Task Queue", printTo=LOG_STASH_N_PLUGIN)
            stash.metadata_clean()
            stash.metadata_clean_generated()
            stash.optimise_database()


def removeDupTag():
    if 'Target' not in stash.JSON_INPUT['args']:
        stash.Error(f"Could not find Target in JSON_INPUT ({stash.JSON_INPUT['args']})")
        return
    scene = stash.JSON_INPUT['args']['Target']
    stash.Log(f"Processing scene ID# {scene}")
    stash.removeTag(scene, duplicateMarkForDeletion)
    stash.Log(f"Done removing tag from scene {scene}.")
    jsonReturn = "{'removeDupTag' : 'complete', 'id': '" + f"{scene}" + "'}"
    stash.Log(f"Sending json value {jsonReturn}")
    sys.stdout.write(jsonReturn)

def addExcludeTag():
    if 'Target' not in stash.JSON_INPUT['args']:
        stash.Error(f"Could not find Target in JSON_INPUT ({stash.JSON_INPUT['args']})")
        return
    scene = stash.JSON_INPUT['args']['Target']
    stash.Log(f"Processing scene ID# {scene}")
    stash.addTag(scene, excludeDupFileDeleteTag)
    stash.Log(f"Done adding exclude tag to scene {scene}.")
    sys.stdout.write("{" + f"addExcludeTag : 'complete', id: '{scene}'" + "}")

def removeExcludeTag():
    if 'Target' not in stash.JSON_INPUT['args']:
        stash.Error(f"Could not find Target in JSON_INPUT ({stash.JSON_INPUT['args']})")
        return
    scene = stash.JSON_INPUT['args']['Target']
    stash.Log(f"Processing scene ID# {scene}")
    stash.removeTag(scene, excludeDupFileDeleteTag)
    stash.Log(f"Done removing exclude tag from scene {scene}.")
    sys.stdout.write("{" + f"removeExcludeTag : 'complete', id: '{scene}'" + "}")

def getParseData(getSceneDetails1=True, getSceneDetails2=True, checkIfNotSplitValue=False):
    if 'Target' not in stash.JSON_INPUT['args']:
        stash.Error(f"Could not find Target in JSON_INPUT ({stash.JSON_INPUT['args']})")
        return None, None
    targetsSrc = stash.JSON_INPUT['args']['Target']
    if checkIfNotSplitValue and ":" not in targetsSrc:
        return targetsSrc, None
    targets = targetsSrc.split(":")
    if len(targets) < 2:
        stash.Error(f"Could not get both targets from string {targetsSrc}")
        return None, None
    stash.Log(f"Parsed targets {targets[0]} and {targets[1]}")
    target1 = targets[0]
    target2 = targets[1]
    if getSceneDetails1:
        target1 = stash.find_scene(int(target1))
    if getSceneDetails2:
        target2 = stash.find_scene(int(target2))
    elif len(targets) > 2:
        target2 = target2 + targets[2]
    return target1, target2

def mergeMetadataInThisFile(fileName):
    stash.Debug(f"Checking report file '{fileName}' for yellow icons indicating missing metadata in DuplicateToKeep.")
    lines = None
    with open(fileName, 'r') as file:
        lines = file.readlines()
    for line in lines:
        if "https://www.axter.com/images/stash/Yellow" in line: # FYI: This catches YellowGroup.png as well, even though group is not currently supported for merging
            searchStrScene1 = "<!-- ::DuplicateToDelete_SceneID="
            idx = line.index(searchStrScene1) + len(searchStrScene1)
            scene_id1 = line[idx:]
            scene_id1 = scene_id1[:scene_id1.index('::')]
            searchStrScene2 = "::DuplicateToKeep_SceneID="
            idx = line.index(searchStrScene2, idx) + len(searchStrScene2)
            scene_id2 = line[idx:]
            scene_id2 = scene_id2[:scene_id2.index('::')]
            stash.Log(f"From file {fileName}, merging metadata from scene {scene_id1} to scene {scene_id2}")
            stash.mergeMetadata(int(scene_id1), int(scene_id2))
            updateScenesInReports(scene_id2)

def mergeMetadataForAll(ReportName = htmlReportName):
    if os.path.isfile(ReportName):
        mergeMetadataInThisFile(ReportName)
        for x in range(2, 9999):
            fileName = ReportName.replace(".html", f"_{x-1}.html")
            stash.Debug(f"Checking if file '{fileName}' exist.")
            if not os.path.isfile(fileName):
                break
            mergeMetadataInThisFile(fileName)
    stash.Log(f"Done merging metadata for all scenes")
    sys.stdout.write("{mergeTags : 'complete'}")

def mergeTags():
    scene1, scene2 = getParseData(checkIfNotSplitValue=True)
    if scene1 == None or scene2 == None:
        if scene1 == "mergeMetadataForAll":
            mergeMetadataForAll()
        else:
            sys.stdout.write("{" + f"mergeTags : 'failed', id1: '{scene1}', id2: '{scene2}'" + "}")
        return
    stash.mergeMetadata(scene1, scene2)
    updateScenesInReports(scene2['id'])
    stash.Log(f"Done merging scenes for scene {scene1['id']} and scene {scene2['id']}")
    sys.stdout.write("{" + f"mergeTags : 'complete', id1: '{scene1['id']}', id2: '{scene2['id']}'" + "}")

def getLocalDupReportPath():
    htmlReportExist = "true" if os.path.isfile(htmlReportName) else "false"
    localPath = htmlReportName.replace("\\", "\\\\")
    jsonReturn = "{'LocalDupReportExist' : " + f"{htmlReportExist}" + ", 'Path': '" + f"{localPath}" + "'}"
    stash.Log(f"Sending json value {jsonReturn}")
    sys.stdout.write(jsonReturn)

def deleteLocalDupReportHtmlFiles(doJsonOutput = True):
    htmlReportExist = "true" if os.path.isfile(htmlReportName) else "false"
    if os.path.isfile(htmlReportName):
        stash.Log(f"Deleting file {htmlReportName}")
        os.remove(htmlReportName)
        for x in range(2, 9999):
            fileName = htmlReportName.replace(".html", f"_{x-1}.html")
            stash.Debug(f"Checking if file '{fileName}' exist.")
            if not os.path.isfile(fileName):
                break
            stash.Log(f"Deleting file {fileName}")
            os.remove(fileName)
    else:
        stash.Log(f"Report file does not exist: {htmlReportName}")
    if doJsonOutput:
        jsonReturn = "{'LocalDupReportExist' : " + f"{htmlReportExist}" + ", 'Path': '" + f"{htmlReportName}" + "', 'qty': '" + f"{x}" + "'}"
        stash.Log(f"Sending json value {jsonReturn}")
        sys.stdout.write(jsonReturn)

def removeTagFromAllScenes(tagName, deleteTags):
    if tag := stash.find_tag(tagName):
        if deleteTags:
            stash.Debug(f"Deleting tag name {tagName} with Tag ID {tag['id']} from stash.")
            stash.destroy_tag(int(tag['id']))
        else:
            stash.Debug(f"Removing tag name {tagName} with Tag ID {tag['id']} from all scenes.")
            if stash.isCorrectDbVersion() and stash.removeTagFromAllScenes(tagID=int(tag['id'])):
                stash.Log(f"Removed tag name {tagName} using SQL.")
            else:
                manageDuplicatesTaggedOrInReport(clearTag=True, tagId=int(tag['id']))
        return True
    
    stash.Warn(f"Could not find tag name {tagName}")
    return False

def removeAllDupTagsFromAllScenes(deleteTags=False):
    tagsToClear = [duplicateMarkForDeletion, base1_duplicateMarkForDeletion, base2_duplicateMarkForDeletion, graylistMarkForDeletion, longerDurationLowerResolution, duplicateWhitelistTag]
    for x in range(0, 3):
        tagsToClear += [base1_duplicateMarkForDeletion + f"_{x}"] 
    for x in range(0, 3):
        tagsToClear += [base2_duplicateMarkForDeletion + f"_{x}"] 
    tagsToClear = list(set(tagsToClear)) # Remove duplicates
    validTags = []
    for tagToClear in tagsToClear:
        if removeTagFromAllScenes(tagToClear, deleteTags):
            validTags +=[tagToClear]
    if doJsonReturn:
        jsonReturn = "{'removeAllDupTagFromAllScenes' : " + f"{duplicateMarkForDeletion}" + ", 'OtherTags': '" + f"{validTags}" + "'}"
        stash.Log(f"Sending json value {jsonReturn}")
        sys.stdout.write(jsonReturn)
    else:
        stash.Log(f"Clear tags {tagsToClear}")

def updateDuplicateCandidateForDeletionList(scene, removeScene = False):
    lines = None
    scene_id = None
    if not os.path.isfile(DuplicateCandidateForDeletionList):
        return
    with open(DuplicateCandidateForDeletionList, 'r') as file:
        lines = file.readlines()
    if removeScene:
        scene_id = scene
    else:
        scene_id = scene['id']
    stash.Trace(f"Trying to update scene ID {scene_id} in file {DuplicateCandidateForDeletionList}.")
    foundScene = False
    with open(DuplicateCandidateForDeletionList, 'w') as file:
        for line in lines:
            if foundScene:
                file.write(line)
            else:
                sceneDetails = json.loads(line)
                if sceneDetails['id'] == scene_id:
                    if not removeScene:
                        file.write(json.dumps(scene) + "\n")
                    foundScene = True
                else:
                    file.write(line)
    if foundScene:
        stash.Debug(f"Found and updated scene ID {scene_id} in file {DuplicateCandidateForDeletionList}.")
    else:
        stash.Debug(f"Did not find scene ID {scene_id} in file {DuplicateCandidateForDeletionList}.")

def updateScenesInReport(fileName, scene):
    stash.Log(f"Updating table rows with scene {scene} in file {fileName}")
    results = False
    scene1 = -1
    scene2 = -1
    strToFind = "class=\"ID_"
    lines = None
    with open(fileName, 'r') as file:
        lines = file.readlines()
    stash.Log(f"line count = {len(lines)}")
    stash.Log(f"Searching for class=\"ID_{scene}\"")
    with open(fileName, 'w') as file:
        for line in lines:
            # stash.Debug(f"line = {line}")
            if f"class=\"ID_{scene}\"" in line:
                stash.Debug(f"Found class ID_{scene} in line: {line}")
                idx = 0
                while line.find(strToFind, idx) > -1:
                    idx = line.find(strToFind, idx) + len(strToFind)
                    id = line[idx:]
                    stash.Debug(f"id = {id}, idx = {idx}")
                    id = id[:id.find('"')]
                    stash.Debug(f"id = {id}")
                    if scene1 == -1:
                        scene1 = int(id)
                    elif scene1 != int(id) and scene2 == -1:
                        scene2 = int(id)
                    elif scene1 != -1 and scene2 != -1:
                        break
                if scene1 != -1 and scene2 != -1:
                    sceneDetails1 = stash.find_scene(scene1, fragment=fragmentForSceneDetails)
                    sceneDetails2 = stash.find_scene(scene2, fragment=fragmentForSceneDetails)
                    if sceneDetails1 == None or sceneDetails2 == None:
                        stash.Error("Could not get scene details for both scene1 ({scene1}) and scene2  ({scene2}); sceneDetails1={sceneDetails1}; sceneDetails2={sceneDetails2};")
                    else:
                        stash.Log(f"Updating in report {fileName} scene {scene1} and scene {scene2}")
                        writeRowToHtmlReport(file, sceneDetails1, sceneDetails2)
                        if scene == sceneDetails1['id']:
                            results = True
                            updateDuplicateCandidateForDeletionList(sceneDetails1)
                else:
                    stash.Error(f"Could not get both scene ID associated with scene {scene}; scene1 = {scene1}; scene2 = {scene2}")
                    file.write(line)
            else:
                file.write(line)
    if scene1 == -1 or scene2 == -1:
        stash.Log(f"Did not find both scene ID's associated with scene {scene}; scene1 = {scene1}; scene2 = {scene2}")
    return results

def updateScenesInReports(scene, ReportName = htmlReportName):
    if os.path.isfile(ReportName):
        if updateScenesInReport(ReportName, scene):
            return
        for x in range(2, 9999):
            fileName = ReportName.replace(".html", f"_{x-1}.html")
            stash.Debug(f"Checking if file '{fileName}' exist.")
            if not os.path.isfile(fileName):
                break
            if updateScenesInReport(fileName, scene):
                break
        stash.Debug("updateScenesInReports complete")
    else:
        stash.Log(f"Report file does not exist: {ReportName}")

def addPropertyToSceneClass(fileName, scene, property):
    stash.Debug(f"Inserting property {property} for scene {scene} in file {fileName}")
    doStyleEndTagCheck = True
    lines = None
    with open(fileName, 'r') as file:
        lines = file.readlines()
    stash.Debug(f"line count = {len(lines)}")
    with open(fileName, 'w') as file:
        for line in lines:
            # stash.Debug(f"line = {line}")
            if doStyleEndTagCheck:
                if scene == None:
                    if line.startswith(f".ID_") and deleteSceneFlagBgColor not in line:
                        continue
                    elif line.startswith("</style>"):
                        doStyleEndTagCheck = False
                else:
                    if property == "remove highlight" and line.startswith(f".ID_{scene}" + "{") and deleteSceneFlagBgColor not in line and "background-color" in line:
                        continue
                    if property == "" and line.startswith(f".ID_{scene}" + "{"):
                        continue
                    if line.startswith("</style>"):
                        if property != "" and property != "remove highlight":
                            styleSetting = f".ID_{scene}{property}\n"
                            stash.Debug(f"styleSetting = {styleSetting}")
                            file.write(styleSetting)
                        doStyleEndTagCheck = False
            file.write(line)

def addPropertyToSceneClassToAllFiles(scene, property, ReportName = htmlReportName):
    if os.path.isfile(ReportName):
        addPropertyToSceneClass(ReportName, scene, property)
        for x in range(2, 9999):
            fileName = ReportName.replace(".html", f"_{x-1}.html")
            stash.Debug(f"Checking if file '{fileName}' exist.")
            if not os.path.isfile(fileName):
                break
            addPropertyToSceneClass(fileName, scene, property)
    else:
        stash.Log(f"Report file does not exist: {ReportName}")

def deleteScene(disableInReport=True, deleteFile=True, scene=None, writeToStdOut=True): # Scene ID
    if 'Target' not in stash.JSON_INPUT['args']:
        stash.Error(f"Could not find Target in JSON_INPUT ({stash.JSON_INPUT['args']})")
        return
    if scene == None:
        scene = stash.JSON_INPUT['args']['Target']
    stash.Log(f"Processing scene ID# {scene}")
    if dry_run:
        result = f"dry_run enabled, but scene {scene} would have been removed from stash with delete_file={deleteFile}."
        stash.Log(result)
    else:
        result = stash.destroyScene(scene, delete_file=deleteFile)
    if disableInReport:
        addPropertyToSceneClassToAllFiles(scene, "remove highlight")
        addPropertyToSceneClassToAllFiles(scene, "{background-color:" + deleteSceneFlagBgColor + ";pointer-events:none;}")
    updateDuplicateCandidateForDeletionList(scene, removeScene = True)
    if writeToStdOut:
        stash.Log(f"{stash.PLUGIN_TASK_NAME} complete for scene {scene} with results = {result}")
        sys.stdout.write("{" + f"{stash.PLUGIN_TASK_NAME} : 'complete', id: '{scene}', result: '{result}'" + "}")
    return result

def clearAllSceneFlags():
    addPropertyToSceneClassToAllFiles(None, None)
    stash.Log(f"{stash.PLUGIN_TASK_NAME} complete for all scenes")
    sys.stdout.write("{" + f"{stash.PLUGIN_TASK_NAME} : 'complete'" + "}")

def copyScene(moveScene=False):
    scene1, scene2 = getParseData()
    if scene1 == None or scene2 == None:
        sys.stdout.write("{" + f"{stash.PLUGIN_TASK_NAME} : 'failed', id1: '{scene1}', id2: '{scene2}'" + "}")
        return
    if moveScene:
        stash.mergeMetadata(scene1, scene2)
    stash.Debug(f"Coping file {scene1['files'][0]['path']} to {scene2['files'][0]['path']}")
    result = shutil.copy(scene1['files'][0]['path'], scene2['files'][0]['path'])
    if moveScene:
        if dry_run:
            result = f"dry_run enabled, but scene {scene1['files'][0]['path']} would have been removed from stash with delete_file=True."
            stash.Log(result)
        else:
            result = stash.destroyScene(scene1['id'], delete_file=True)
        updateDuplicateCandidateForDeletionList(scene1['id'], removeScene = True)
        stash.Log(f"destroyScene for scene {scene1['id']} results = {result}")
    stash.Log(f"{stash.PLUGIN_TASK_NAME} complete for scene {scene1['id']} and {scene2['id']}")
    sys.stdout.write("{" + f"{stash.PLUGIN_TASK_NAME} : 'complete', id1: '{scene1['id']}', id2: '{scene2['id']}', result: '{result}'" + "}")

def renameFile():
    scene, newName = getParseData(getSceneDetails2=False)
    if scene == None or newName == None:
        sys.stdout.write("{" + f"{stash.PLUGIN_TASK_NAME} : 'failed', scene: '{scene}', newName: '{newName}'" + "}")
        return
    newName = newName.strip("'")
    ext = pathlib.Path(scene['files'][0]['path']).suffix
    newNameFull = f"{pathlib.Path(scene['files'][0]['path']).resolve().parent}{os.sep}{newName}{ext}"
    newNameFull = newNameFull.strip("'")
    newNameFull = newNameFull.replace("\\\\", "\\")
    oldNameFull = scene['files'][0]['path']
    oldNameFull = oldNameFull.strip("'")
    oldNameFull = oldNameFull.replace("\\\\", "\\")
    stash.Log(f"renaming file '{stash.asc2(oldNameFull)}' to '{stash.asc2(newNameFull)}'")
    result = os.rename(oldNameFull, newNameFull)
    stash.renameFileNameInDB(scene['files'][0]['id'], pathlib.Path(oldNameFull).stem, f"{newName}{ext}", UpdateUsingIdOnly = True)
    updateScenesInReports(scene['id'])
    stash.Log(f"{stash.PLUGIN_TASK_NAME} complete for scene {scene['id']} ;renamed to {newName}; result={result}")
    sys.stdout.write("{" + f"{stash.PLUGIN_TASK_NAME} : 'complete', scene: '{scene['id']}', newName: '{newName}', result: '{result}'" + "}")
    
def flagScene():
    scene, flagType = getParseData(False, False)
    if scene == None or flagType == None:
        sys.stdout.write("{" + f"{stash.PLUGIN_TASK_NAME} : 'failed', scene: '{scene}', flagType: '{flagType}'" + "}")
        return
    
    if " highlight" in flagType:
        addPropertyToSceneClassToAllFiles(scene, "remove highlight")
    
    if flagType == "disable-scene":
        addPropertyToSceneClassToAllFiles(scene, "{background-color:gray;pointer-events:none;}")
    elif flagType == "strike-through":
        addPropertyToSceneClassToAllFiles(scene, "{text-decoration: line-through;}")
    elif flagType == "yellow highlight":
        addPropertyToSceneClassToAllFiles(scene, "{background-color:yellow;}")
    elif flagType == "green highlight":
        addPropertyToSceneClassToAllFiles(scene, "{background-color:#00FF00;}")
    elif flagType == "orange highlight":
        addPropertyToSceneClassToAllFiles(scene, "{background-color:orange;}")
    elif flagType == "cyan highlight":
        addPropertyToSceneClassToAllFiles(scene, "{background-color:cyan;}")
    elif flagType == "pink highlight":
        addPropertyToSceneClassToAllFiles(scene, "{background-color:pink;}")
    elif flagType == "red highlight":
        addPropertyToSceneClassToAllFiles(scene, "{background-color:red;}")
    elif flagType == "remove all flags":
        addPropertyToSceneClassToAllFiles(scene, "")
    else:
        stash.Log(f"Invalid flagType ({flagType})")
        sys.stdout.write("{" + f"{stash.PLUGIN_TASK_NAME} : 'failed', scene: '{scene}', flagType: '{flagType}'" + "}")
        return
    sys.stdout.write("{" + f"{stash.PLUGIN_TASK_NAME} : 'complete', scene: '{scene}', flagType: '{flagType}'" + "}")

# ToDo: Add to UI menu
#    Remove all Dup tagged files (Just remove from stash, and leave file)
#    Clear GraylistMarkForDel tag
#    Delete GraylistMarkForDel tag
#    Remove from stash all files no longer part of stash library 
#    Remove from stash all files in the Exclusion list (Not supporting regexps)
# ToDo: Add to advance menu
#    Remove only graylist dup
#    Exclude graylist from delete
#    Include graylist in delete

try:
    if stash.PLUGIN_TASK_NAME == "tag_duplicates_task":
        mangeDupFiles(tagDuplicates=True, merge=mergeDupFilename)
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "create_duplicate_report_task":
        mangeDupFiles(tagDuplicates=False, merge=mergeDupFilename)
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "delete_tagged_duplicates_task":
        manageDuplicatesTaggedOrInReport(deleteScenes=True)
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "delete_duplicates_task":
        mangeDupFiles(deleteDup=True, merge=mergeDupFilename)
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "clear_duplicate_tags_task":
        removeAllDupTagsFromAllScenes()
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "graylist_tag_task":
        manageDuplicatesTaggedOrInReport(setGrayListTag=True)
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "generate_phash_task":
        stash.metadata_generate({"phashes": True})
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "deleteScene":
        deleteScene()
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME.startswith("deleteScene"):
        manageDuplicatesTaggedOrInReport(deleteScenes=True, checkFlagOption=True)
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "removeScene":
        deleteScene(deleteFile=False)
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "renameFile":
        renameFile()
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "flagScene":
        flagScene()
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "clearAllSceneFlags":
        clearAllSceneFlags()
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "copyScene":
        copyScene()
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "moveScene":
        copyScene(moveScene=True)
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "removeDupTag":
        removeDupTag()
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "addExcludeTag":
        addExcludeTag()
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "removeExcludeTag":
        removeExcludeTag()
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "mergeTags":
        mergeTags()
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "getLocalDupReportPath":
        getLocalDupReportPath()
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "deleteLocalDupReportHtmlFiles":
        deleteLocalDupReportHtmlFiles()
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "createDuplicateReportWithoutTagging":
        mangeDupFiles(tagDuplicates=False, merge=mergeDupFilename)
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "deleteAllDupFileManagerTags":
        removeAllDupTagsFromAllScenes(deleteTags=True)
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "deleteBlackListTaggedDuplicatesTask":
        mangeDupFiles(deleteDup=True, merge=mergeDupFilename, deleteBlacklistOnly=True)
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "deleteTaggedDuplicatesLwrResOrLwrDuration":
        mangeDupFiles(deleteDup=True, merge=mergeDupFilename, deleteLowerResAndDuration=True)
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif stash.PLUGIN_TASK_NAME == "deleteBlackListTaggedDuplicatesLwrResOrLwrDuration":
        mangeDupFiles(deleteDup=True, merge=mergeDupFilename, deleteBlacklistOnly=True, deleteLowerResAndDuration=True)
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif parse_args.dup_tag:
        stash.PLUGIN_TASK_NAME = "dup_tag"
        mangeDupFiles(tagDuplicates=True, merge=mergeDupFilename)
        stash.Debug(f"Tag duplicate EXIT")
    elif parse_args.del_tag:
        stash.PLUGIN_TASK_NAME = "del_tag"
        manageDuplicatesTaggedOrInReport(deleteScenes=True)
        stash.Debug(f"Delete Tagged duplicates EXIT")
    elif parse_args.clear_tag:
        stash.PLUGIN_TASK_NAME = "clear_tag"
        removeAllDupTagsFromAllScenes()
        stash.Debug(f"Clear duplicate tags EXIT")
    elif parse_args.remove:
        stash.PLUGIN_TASK_NAME = "remove"
        mangeDupFiles(deleteDup=True, merge=mergeDupFilename)
        stash.Debug(f"Delete duplicate EXIT")
    elif len(sys.argv) < 2 and stash.PLUGIN_TASK_NAME in advanceMenuOptions:
        manageDuplicatesTaggedOrInReport(deleteScenes=True, advanceMenuOptionSelected=True)
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    else:
        stash.Log(f"Nothing to do!!! (PLUGIN_ARGS_MODE={stash.PLUGIN_TASK_NAME})")
except Exception as e:
    tb = traceback.format_exc()
    
    stash.Error(f"Exception while running DupFileManager Task({stash.PLUGIN_TASK_NAME}); Error: {e}\nTraceBack={tb}")
    killScanningJobs()
    stash.convertToAscii = False
    stash.Error(f"Error: {e}\nTraceBack={tb}")
    if doJsonReturn:
        sys.stdout.write("{" + f"Exception : '{e}; See log file for TraceBack' " + "}")

stash.Log("\n*********************************\nEXITING   ***********************\n*********************************")
