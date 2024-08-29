# Description: This is a Stash plugin which manages duplicate files.
# By David Maisonave (aka Axter) Jul-2024 (https://www.axter.com/)
# Get the latest developers version from following link: https://github.com/David-Maisonave/Axter-Stash/tree/main/plugins/DupFileManager
# Note: To call this script outside of Stash, pass argument --url 
#       Example:    python DupFileManager.py --url http://localhost:9999 -a
import os, sys, time, pathlib, argparse, platform, shutil, logging
from StashPluginHelper import StashPluginHelper
from DupFileManager_config import config # Import config from DupFileManager_config.py

parser = argparse.ArgumentParser()
parser.add_argument('--url', '-u', dest='stash_url', type=str, help='Add Stash URL')
parser.add_argument('--trace', '-t', dest='trace', action='store_true', help='Enables debug trace mode.')
parser.add_argument('--add_dup_tag', '-a', dest='dup_tag', action='store_true', help='Set a tag to duplicate files.')
parser.add_argument('--del_tag_dup', '-d', dest='del_tag', action='store_true', help='Only delete scenes having DuplicateMarkForDeletion tag.')
parser.add_argument('--remove_dup', '-r', dest='remove', action='store_true', help='Remove (delete) duplicate files.')
parse_args = parser.parse_args()

settings = {
    "mergeDupFilename": False,
    "permanentlyDelete": False,
    "whitelistDelDupInSameFolder": False,
    "whitelistDoTagLowResDup": False,
    "zCleanAfterDel": False,
    "zSwapHighRes": False,
    "zSwapLongLength": False,
    "zWhitelist": "",
    "zxGraylist": "",
    "zyBlacklist": "",
    "zyMaxDupToProcess": 0,
    "zzdebugTracing": False,
}
stash = StashPluginHelper(
        stash_url=parse_args.stash_url,
        debugTracing=parse_args.trace,
        settings=settings,
        config=config,
        maxbytes=10*1024*1024,
        )
if len(sys.argv) > 1:
    stash.Log(f"argv = {sys.argv}")
else:
    stash.Trace(f"No command line arguments. JSON_INPUT['args'] = {stash.JSON_INPUT['args']}")
stash.Status(logLevel=logging.DEBUG)

# stash.Trace(f"\nStarting (__file__={__file__}) (stash.CALLED_AS_STASH_PLUGIN={stash.CALLED_AS_STASH_PLUGIN}) (stash.DEBUG_TRACING={stash.DEBUG_TRACING}) (stash.PLUGIN_TASK_NAME={stash.PLUGIN_TASK_NAME})************************************************")
# stash.encodeToUtf8 = True


LOG_STASH_N_PLUGIN = stash.LOG_TO_STASH if stash.CALLED_AS_STASH_PLUGIN else stash.LOG_TO_CONSOLE + stash.LOG_TO_FILE
listSeparator               = stash.Setting('listSeparator', ',', notEmpty=True)
addPrimaryDupPathToDetails  = stash.Setting('addPrimaryDupPathToDetails') 
mergeDupFilename            = stash.Setting('mergeDupFilename')
moveToTrashCan              = False if stash.Setting('permanentlyDelete') else True
alternateTrashCanPath       = stash.Setting('dup_path')
whitelistDelDupInSameFolder = stash.Setting('whitelistDelDupInSameFolder')
whitelistDoTagLowResDup     = stash.Setting('whitelistDoTagLowResDup')
maxDupToProcess             = int(stash.Setting('zyMaxDupToProcess'))
swapHighRes                 = stash.Setting('zSwapHighRes')
swapLongLength              = stash.Setting('zSwapLongLength')
significantTimeDiff         = stash.Setting('significantTimeDiff')
toRecycleBeforeSwap         = stash.Setting('toRecycleBeforeSwap')
cleanAfterDel               = stash.Setting('zCleanAfterDel')
duration_diff               = float(stash.Setting('duration_diff'))
if duration_diff > 10:
    duration_diff = 10
elif duration_diff < 1:
    duration_diff = 1

# significantTimeDiff can not be higher than 1 and shouldn't be lower than .5
if significantTimeDiff > 1:
    significantTimeDiff = 1
if significantTimeDiff < .5:
    significantTimeDiff = .5


duplicateMarkForDeletion = stash.Setting('DupFileTag')
if duplicateMarkForDeletion == "":
    duplicateMarkForDeletion = 'DuplicateMarkForDeletion'

duplicateWhitelistTag = stash.Setting('DupWhiteListTag')
if duplicateWhitelistTag == "":
    duplicateWhitelistTag = 'DuplicateWhitelistFile'

excludeMergeTags = [duplicateMarkForDeletion, duplicateWhitelistTag]
stash.init_mergeMetadata(excludeMergeTags)

graylist = stash.Setting('zxGraylist').split(listSeparator)
graylist = [item.lower() for item in graylist]
if graylist == [""] : graylist = []
stash.Trace(f"graylist = {graylist}")   
whitelist = stash.Setting('zWhitelist').split(listSeparator)
whitelist = [item.lower() for item in whitelist]
if whitelist == [""] : whitelist = []
stash.Trace(f"whitelist = {whitelist}")   
blacklist = stash.Setting('zyBlacklist').split(listSeparator)
blacklist = [item.lower() for item in blacklist]
if blacklist == [""] : blacklist = []
stash.Trace(f"blacklist = {blacklist}")
    
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


def createTagId(tagName, tagName_descp, deleteIfExist = False):
    tagId = stash.find_tags(q=tagName)
    if len(tagId):
        tagId = tagId[0]
        if deleteIfExist:
            stash.destroy_tag(int(tagId['id']))
        else:
            return tagId['id']
    tagId = stash.create_tag({"name":tagName, "description":tagName_descp, "ignore_auto_tag": True})
    stash.Log(f"Dup-tagId={tagId['id']}")
    return tagId['id']

def setTagId(tagId, tagName, sceneDetails, DupFileToKeep):
    details = ""
    ORG_DATA_DICT = {'id' : sceneDetails['id']}
    dataDict = ORG_DATA_DICT.copy()
    doAddTag = True
    if addPrimaryDupPathToDetails:
        BaseDupStr = f"BaseDup={DupFileToKeep['files'][0]['path']}\n{stash.STASH_URL}/scenes/{DupFileToKeep['id']}\n"
        if sceneDetails['details'] == "":
            details = BaseDupStr
        elif not sceneDetails['details'].startswith(BaseDupStr):
            details = f"{BaseDupStr};\n{sceneDetails['details']}"
    for tag in sceneDetails['tags']:
        if tag['name'] == tagName:
            doAddTag = False
            break
    if doAddTag:
        dataDict.update({'tag_ids' : tagId})
    if details != "":
        dataDict.update({'details' : details})
    if dataDict != ORG_DATA_DICT:
        stash.update_scene(dataDict)
        stash.Trace(f"[setTagId] Updated {sceneDetails['files'][0]['path']} with metadata {dataDict}", toAscii=True)
    else:
        stash.Trace(f"[setTagId] Nothing to update {sceneDetails['files'][0]['path']}.", toAscii=True)


def isInList(listToCk, pathToCk):
    pathToCk = pathToCk.lower()
    for item in listToCk:
        if pathToCk.startswith(item):
            return True
    return False

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

def significantLessTime(durrationToKeep, durrationOther):
    timeDiff = durrationToKeep / durrationOther
    if timeDiff < significantTimeDiff:
        return True
    return False

def isSwapCandidate(DupFileToKeep, DupFile):
    # Don't move if both are in whitelist
    if isInList(whitelist, DupFileToKeep['files'][0]['path']) and isInList(whitelist, DupFile['files'][0]['path']):
        return False
    if swapHighRes and (int(DupFileToKeep['files'][0]['width']) > int(DupFile['files'][0]['width']) or int(DupFileToKeep['files'][0]['height']) > int(DupFile['files'][0]['height'])):
        if not significantLessTime(int(DupFileToKeep['files'][0]['duration']), int(DupFile['files'][0]['duration'])):
            return True
        else:
            stash.Warn(f"File '{DupFileToKeep['files'][0]['path']}' has a higher resolution than '{DupFile['files'][0]['path']}', but the duration is significantly shorter.", toAscii=True)
    if swapLongLength and int(DupFileToKeep['files'][0]['duration']) > int(DupFile['files'][0]['duration']):
        if int(DupFileToKeep['files'][0]['width']) >= int(DupFile['files'][0]['width']) or int(DupFileToKeep['files'][0]['height']) >= int(DupFile['files'][0]['height']):
            return True
    return False

def mangeDupFiles(merge=False, deleteDup=False, tagDuplicates=False):
    duplicateMarkForDeletion_descp = 'Tag added to duplicate scenes so-as to tag them for deletion.'
    stash.Trace(f"duplicateMarkForDeletion = {duplicateMarkForDeletion}")    
    dupTagId = createTagId(duplicateMarkForDeletion, duplicateMarkForDeletion_descp)
    stash.Trace(f"dupTagId={dupTagId} name={duplicateMarkForDeletion}")
    
    dupWhitelistTagId = None
    if whitelistDoTagLowResDup:
        stash.Trace(f"duplicateWhitelistTag = {duplicateWhitelistTag}")    
        duplicateWhitelistTag_descp = 'Tag added to duplicate scenes which are in the whitelist. This means there are two or more duplicates in the whitelist.'
        dupWhitelistTagId = createTagId(duplicateWhitelistTag, duplicateWhitelistTag_descp)
        stash.Trace(f"dupWhitelistTagId={dupWhitelistTagId} name={duplicateWhitelistTag}")
    
    QtyDupSet = 0
    QtyDup = 0
    QtyExactDup = 0
    QtyAlmostDup = 0
    QtyRealTimeDiff = 0
    QtyTagForDel = 0
    QtySkipForDel = 0
    QtySwap = 0
    QtyMerge = 0
    QtyDeleted = 0
    stash.Log("#########################################################################")
    stash.Trace("#########################################################################")
    stash.Log(f"Waiting for find_duplicate_scenes_diff to return results; duration_diff={duration_diff}; significantTimeDiff={significantTimeDiff}", printTo=LOG_STASH_N_PLUGIN)
    DupFileSets = stash.find_duplicate_scenes_diff(duration_diff=duration_diff)
    qtyResults = len(DupFileSets)
    stash.Trace("#########################################################################")
    for DupFileSet in DupFileSets:
        stash.Trace(f"DupFileSet={DupFileSet}")
        QtyDupSet+=1
        stash.Progress(QtyDupSet, qtyResults)
        SepLine = "---------------------------"
        DupFileToKeep = ""
        DupToCopyFrom = ""
        DupFileDetailList = []
        for DupFile in DupFileSet:
            QtyDup+=1
            stash.log.sl.progress(f"Scene ID = {DupFile['id']}")
            time.sleep(2)
            Scene = stash.find_scene(DupFile['id'])
            sceneData = f"Scene = {Scene}"
            stash.Trace(sceneData, toAscii=True)
            DupFileDetailList = DupFileDetailList + [Scene]
            if DupFileToKeep != "":
                if int(DupFileToKeep['files'][0]['duration']) == int(Scene['files'][0]['duration']): # Do not count fractions of a second as a difference
                    QtyExactDup+=1
                else:
                    QtyAlmostDup+=1
                    SepLine = "***************************"
                    if significantLessTime(int(DupFileToKeep['files'][0]['duration']), int(Scene['files'][0]['duration'])):
                        QtyRealTimeDiff += 1
                if int(DupFileToKeep['files'][0]['width']) < int(Scene['files'][0]['width']) or int(DupFileToKeep['files'][0]['height']) < int(Scene['files'][0]['height']):
                    DupFileToKeep = Scene
                elif int(DupFileToKeep['files'][0]['duration']) < int(Scene['files'][0]['duration']):
                    DupFileToKeep = Scene
                elif isInList(whitelist, Scene['files'][0]['path']) and not isInList(whitelist, DupFileToKeep['files'][0]['path']):
                    DupFileToKeep = Scene
                elif isInList(blacklist, DupFileToKeep['files'][0]['path']) and not isInList(blacklist, Scene['files'][0]['path']):
                    DupFileToKeep = Scene
                elif isInList(graylist, Scene['files'][0]['path']) and not isInList(graylist, DupFileToKeep['files'][0]['path']):
                    DupFileToKeep = Scene
                elif len(DupFileToKeep['files'][0]['path']) < len(Scene['files'][0]['path']):
                    DupFileToKeep = Scene
                elif int(DupFileToKeep['files'][0]['size']) < int(Scene['files'][0]['size']):
                    DupFileToKeep = Scene
            else:
                DupFileToKeep = Scene
            # stash.Trace(f"DupFileToKeep = {DupFileToKeep}")
            stash.Trace(f"KeepID={DupFileToKeep['id']}, ID={DupFile['id']} duration=({Scene['files'][0]['duration']}), Size=({Scene['files'][0]['size']}), Res=({Scene['files'][0]['width']} x {Scene['files'][0]['height']}) Name={Scene['files'][0]['path']}, KeepPath={DupFileToKeep['files'][0]['path']}", toAscii=True)
        
        for DupFile in DupFileDetailList:
            if DupFile['id'] != DupFileToKeep['id']:
                if merge:
                    result = stash.merge_metadata(DupFile, DupFileToKeep)
                    if result != "Nothing To Merge":
                        QtyMerge += 1
                
                if isInList(whitelist, DupFile['files'][0]['path']) and (not whitelistDelDupInSameFolder or not hasSameDir(DupFile['files'][0]['path'], DupFileToKeep['files'][0]['path'])):
                    if isSwapCandidate(DupFileToKeep, DupFile):
                        if merge:
                            stash.merge_metadata(DupFileToKeep, DupFile)
                        if toRecycleBeforeSwap:
                            sendToTrash(DupFile['files'][0]['path'])
                        shutil.move(DupFileToKeep['files'][0]['path'], DupFile['files'][0]['path'])
                        stash.Log(f"Moved better file '{DupFileToKeep['files'][0]['path']}' to '{DupFile['files'][0]['path']}'", toAscii=True, printTo=LOG_STASH_N_PLUGIN)
                        DupFileToKeep = DupFile
                        QtySwap+=1
                    else:
                        stash.Log(f"NOT processing duplicate, because it's in whitelist. '{DupFile['files'][0]['path']}'", toAscii=True)
                        if dupWhitelistTagId and tagDuplicates:
                            setTagId(dupWhitelistTagId, duplicateWhitelistTag, DupFile, DupFileToKeep)
                    QtySkipForDel+=1
                else:
                    if deleteDup:
                        DupFileName = DupFile['files'][0]['path']
                        DupFileNameOnly = pathlib.Path(DupFileName).stem
                        stash.Warn(f"Deleting duplicate '{DupFileName}'", toAscii=True, printTo=LOG_STASH_N_PLUGIN)
                        if alternateTrashCanPath != "":
                            destPath = f"{alternateTrashCanPath }{os.sep}{DupFileNameOnly}"
                            if os.path.isfile(destPath):
                                destPath = f"{alternateTrashCanPath }{os.sep}_{time.time()}_{DupFileNameOnly}"
                            shutil.move(DupFileName, destPath)
                        elif moveToTrashCan:
                            sendToTrash(DupFileName)
                        stash.destroy_scene(DupFile['id'], delete_file=True)
                        QtyDeleted += 1
                    elif tagDuplicates:
                        if QtyTagForDel == 0:
                            stash.Log(f"Tagging duplicate {DupFile['files'][0]['path']} for deletion with tag {duplicateMarkForDeletion}.", toAscii=True, printTo=LOG_STASH_N_PLUGIN)
                        else:
                            stash.Log(f"Tagging duplicate {DupFile['files'][0]['path']} for deletion.", toAscii=True, printTo=LOG_STASH_N_PLUGIN)
                        setTagId(dupTagId, duplicateMarkForDeletion, DupFile, DupFileToKeep)
                    QtyTagForDel+=1
        stash.Trace(SepLine)
        if maxDupToProcess > 0 and QtyDup > maxDupToProcess:
            break
    
    stash.Log(f"QtyDupSet={QtyDupSet}, QtyDup={QtyDup}, QtyDeleted={QtyDeleted}, QtySwap={QtySwap}, QtyTagForDel={QtyTagForDel}, QtySkipForDel={QtySkipForDel}, QtyExactDup={QtyExactDup}, QtyAlmostDup={QtyAlmostDup}, QtyMerge={QtyMerge}, QtyRealTimeDiff={QtyRealTimeDiff}", printTo=LOG_STASH_N_PLUGIN)
    if cleanAfterDel:
        stash.Log("Adding clean jobs to the Task Queue", printTo=LOG_STASH_N_PLUGIN)
        stash.metadata_clean(paths=stash.STASH_PATHS)
        stash.metadata_clean_generated()
        stash.optimise_database()

def deleteTagggedDuplicates():
    tagId = stash.find_tags(q=duplicateMarkForDeletion)
    if len(tagId) > 0 and 'id' in tagId[0]:
        tagId = tagId[0]['id']
    else:
        stash.Warn(f"Could not find tag ID for tag '{duplicateMarkForDeletion}'.")
        return
    QtyDup = 0
    QtyDeleted = 0
    QtyFailedQuery = 0
    stash.Trace("#########################################################################")
    sceneIDs = stash.find_scenes(f={"tags": {"value":tagId, "modifier":"INCLUDES"}}, fragment='id')
    qtyResults = len(sceneIDs)
    stash.Trace(f"Found {qtyResults} scenes with tag ({duplicateMarkForDeletion}): sceneIDs = {sceneIDs}")
    for sceneID in sceneIDs:
        # stash.Trace(f"Getting scene data for scene ID {sceneID['id']}.")
        QtyDup += 1
        prgs = QtyDup / qtyResults
        stash.Progress(QtyDup, qtyResults)
        scene = stash.find_scene(sceneID['id'])
        if scene == None or len(scene) == 0:
            stash.Warn(f"Could not get scene data for scene ID {sceneID['id']}.")
            QtyFailedQuery += 1
            continue
        # stash.Log(f"scene={scene}")
        DupFileName = scene['files'][0]['path']
        DupFileNameOnly = pathlib.Path(DupFileName).stem
        stash.Warn(f"Deleting duplicate '{DupFileName}'", toAscii=True, printTo=LOG_STASH_N_PLUGIN)
        if alternateTrashCanPath != "":
            destPath = f"{alternateTrashCanPath }{os.sep}{DupFileNameOnly}"
            if os.path.isfile(destPath):
                destPath = f"{alternateTrashCanPath }{os.sep}_{time.time()}_{DupFileNameOnly}"
            shutil.move(DupFileName, destPath)
        elif moveToTrashCan:
            sendToTrash(DupFileName)
        result = stash.destroy_scene(scene['id'], delete_file=True)
        stash.Trace(f"destroy_scene result={result} for file {DupFileName}", toAscii=True)
        QtyDeleted += 1
    stash.Log(f"QtyDup={QtyDup}, QtyDeleted={QtyDeleted}, QtyFailedQuery={QtyFailedQuery}", printTo=LOG_STASH_N_PLUGIN)
    return

def testSetDupTagOnScene(sceneId):
    scene = stash.find_scene(sceneId)
    stash.Log(f"scene={scene}")
    stash.Log(f"scene tags={scene['tags']}")
    tag_ids = [dupTagId]
    for tag in scene['tags']:
        tag_ids = tag_ids + [tag['id']]
    stash.Log(f"tag_ids={tag_ids}")
    stash.update_scene({'id' : scene['id'], 'tag_ids' : tag_ids})

if stash.PLUGIN_TASK_NAME == "tag_duplicates_task":
    mangeDupFiles(tagDuplicates=True, merge=mergeDupFilename)
    stash.Trace(f"{stash.PLUGIN_TASK_NAME} EXIT")
elif stash.PLUGIN_TASK_NAME == "delete_tagged_duplicates_task":
    deleteTagggedDuplicates()
    stash.Trace(f"{stash.PLUGIN_TASK_NAME} EXIT")
elif stash.PLUGIN_TASK_NAME == "delete_duplicates_task":
    mangeDupFiles(deleteDup=True, merge=mergeDupFilename)
    stash.Trace(f"{stash.PLUGIN_TASK_NAME} EXIT")
elif parse_args.dup_tag:
    mangeDupFiles(tagDuplicates=True, merge=mergeDupFilename)
    stash.Trace(f"Tag duplicate EXIT")
elif parse_args.del_tag:
    deleteTagggedDuplicates()
    stash.Trace(f"Delete Tagged duplicates EXIT")
elif parse_args.remove:
    mangeDupFiles(deleteDup=True, merge=mergeDupFilename)
    stash.Trace(f"Delete duplicate EXIT")
else:
    stash.Log(f"Nothing to do!!! (PLUGIN_ARGS_MODE={stash.PLUGIN_TASK_NAME})")





stash.Trace("\n*********************************\nEXITING   ***********************\n*********************************")
