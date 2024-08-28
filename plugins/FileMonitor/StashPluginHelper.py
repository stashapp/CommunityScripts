from stashapi.stashapp import StashInterface
from logging.handlers import RotatingFileHandler
import re, inspect, sys, os, pathlib, logging, json
import concurrent.futures
from stashapi.stash_types import PhashDistance
import __main__

_ARGUMENT_UNSPECIFIED_ = "_ARGUMENT_UNSPECIFIED_"

# StashPluginHelper (By David Maisonave aka Axter)
    # See end of this file for example usage
    # Log Features:
        # Can optionally log out to multiple outputs for each Log or Trace call.
        # Logging includes source code line number
        # Sets a maximum plugin log file size
    # Stash Interface Features:
        # Gets STASH_URL value from command line argument and/or from STDIN_READ
        # Sets FRAGMENT_SERVER based on command line arguments or STDIN_READ
        # Sets PLUGIN_ID based on the main script file name (in lower case)
        # Gets PLUGIN_TASK_NAME value
        # Sets pluginSettings (The plugin UI settings)
    # Misc Features:
        # Gets DRY_RUN value from command line argument and/or from UI and/or from config file
        # Gets DEBUG_TRACING value from command line argument and/or from UI and/or from config file
        # Sets RUNNING_IN_COMMAND_LINE_MODE to True if detects multiple arguments
        # Sets CALLED_AS_STASH_PLUGIN to True if it's able to read from STDIN_READ
class StashPluginHelper(StashInterface):
    # Primary Members for external reference
    PLUGIN_TASK_NAME = None
    PLUGIN_ID = None
    PLUGIN_CONFIGURATION = None
    PLUGINS_PATH = None
    pluginSettings = None
    pluginConfig = None
    STASH_URL = None
    STASH_CONFIGURATION = None
    JSON_INPUT = None
    DEBUG_TRACING = False
    DRY_RUN = False
    CALLED_AS_STASH_PLUGIN = False
    RUNNING_IN_COMMAND_LINE_MODE = False
    FRAGMENT_SERVER = None
    STASHPATHSCONFIG = None
    STASH_PATHS = []
    API_KEY = None
    excludeMergeTags = None
    
    # printTo argument
    LOG_TO_FILE = 1
    LOG_TO_CONSOLE = 2  # Note: Only see output when running in command line mode. In plugin mode, this output is lost.
    LOG_TO_STDERR = 4   # Note: In plugin mode, output to StdErr ALWAYS gets sent to stash logging as an error.
    LOG_TO_STASH = 8
    LOG_TO_WARN = 16
    LOG_TO_ERROR = 32
    LOG_TO_CRITICAL = 64
    LOG_TO_ALL = LOG_TO_FILE + LOG_TO_CONSOLE + LOG_TO_STDERR + LOG_TO_STASH
    
    # Misc class variables
    MAIN_SCRIPT_NAME = None
    LOG_LEVEL = logging.INFO
    LOG_FILE_DIR = None
    LOG_FILE_NAME = None
    STDIN_READ = None
    pluginLog = None
    logLinePreviousHits = []
    thredPool = None
    STASH_INTERFACE_INIT = False
    _mergeMetadata = None
    encodeToUtf8 = False
    convertToAscii = False # If set True, it takes precedence over encodeToUtf8
    
    # Prefix message value
    LEV_TRACE = "TRACE: "
    LEV_DBG = "DBG: "
    LEV_INF = "INF: "
    LEV_WRN = "WRN: "
    LEV_ERR = "ERR: "
    LEV_CRITICAL = "CRITICAL: "
    
    # Default format
    LOG_FORMAT = "[%(asctime)s] %(message)s"
    
    # Externally modifiable variables
    log_to_err_set = LOG_TO_FILE + LOG_TO_STDERR # This can be changed by the calling source in order to customize what targets get error messages
    log_to_norm = LOG_TO_FILE + LOG_TO_CONSOLE # Can be change so-as to set target output for normal logging
    # Warn message goes to both plugin log file and stash when sent to Stash log file.
    log_to_wrn_set = LOG_TO_STASH # This can be changed by the calling source in order to customize what targets get warning messages

    def __init__(self, 
                    debugTracing = None,            # Set debugTracing to True so as to output debug and trace logging
                    logFormat = LOG_FORMAT,         # Plugin log line format
                    dateFmt = "%y%m%d %H:%M:%S",    # Date format when logging to plugin log file
                    maxbytes = 8*1024*1024,         # Max size of plugin log file
                    backupcount = 2,                # Backup counts when log file size reaches max size
                    logToWrnSet = 0,                # Customize the target output set which will get warning logging
                    logToErrSet = 0,                # Customize the target output set which will get error logging
                    logToNormSet = 0,               # Customize the target output set which will get normal logging
                    logFilePath = "",               # Plugin log file. If empty, the log file name will be set based on current python file name and path
                    mainScriptName = "",            # The main plugin script file name (full path)
                    pluginID = "",
                    settings = None,                # Default settings for UI fields
                    config = None,                  # From pluginName_config.py or pluginName_setting.py
                    fragmentServer = None,
                    stash_url = None,               # Stash URL (endpoint URL) Example: http://localhost:9999
                    apiKey = None,                  # API Key only needed when username and password set while running script via command line
                    DebugTraceFieldName = "zzdebugTracing",
                    DryRunFieldName = "zzdryRun",
                    setStashLoggerAsPluginLogger = False):              
        self.thredPool = concurrent.futures.ThreadPoolExecutor(max_workers=2)
        if logToWrnSet: self.log_to_wrn_set = logToWrnSet
        if logToErrSet: self.log_to_err_set = logToErrSet
        if logToNormSet: self.log_to_norm = logToNormSet
        if stash_url and len(stash_url): self.STASH_URL = stash_url
        self.MAIN_SCRIPT_NAME = mainScriptName if mainScriptName != "" else __main__.__file__
        self.PLUGIN_ID = pluginID if pluginID != "" else pathlib.Path(self.MAIN_SCRIPT_NAME).stem
        # print(f"self.MAIN_SCRIPT_NAME={self.MAIN_SCRIPT_NAME}, self.PLUGIN_ID={self.PLUGIN_ID}", file=sys.stderr)
        self.LOG_FILE_NAME = logFilePath if logFilePath != "" else f"{pathlib.Path(self.MAIN_SCRIPT_NAME).resolve().parent}{os.sep}{pathlib.Path(self.MAIN_SCRIPT_NAME).stem}.log" 
        self.LOG_FILE_DIR = pathlib.Path(self.LOG_FILE_NAME).resolve().parent 
        RFH = RotatingFileHandler(
            filename=self.LOG_FILE_NAME, 
            mode='a',
            maxBytes=maxbytes,
            backupCount=backupcount,
            encoding=None,
            delay=0
        )
        if fragmentServer:
            self.FRAGMENT_SERVER = fragmentServer
        else:
            self.FRAGMENT_SERVER = {'Scheme': 'http', 'Host': '0.0.0.0', 'Port': '9999', 'SessionCookie': {'Name': 'session', 'Value': '', 'Path': '', 'Domain': '', 'Expires': '0001-01-01T00:00:00Z', 'RawExpires': '', 'MaxAge': 0, 'Secure': False, 'HttpOnly': False, 'SameSite': 0, 'Raw': '', 'Unparsed': None}, 'Dir': os.path.dirname(pathlib.Path(self.MAIN_SCRIPT_NAME).resolve().parent), 'PluginDir': pathlib.Path(self.MAIN_SCRIPT_NAME).resolve().parent}
        
        if debugTracing: self.DEBUG_TRACING = debugTracing        
        if config:
            self.pluginConfig = config        
            if self.Setting('apiKey', "") != "":
                self.FRAGMENT_SERVER['ApiKey'] = self.Setting('apiKey')

        
        if apiKey and apiKey != "":
            self.FRAGMENT_SERVER['ApiKey'] = apiKey
        
        if len(sys.argv) > 1:
            RUNNING_IN_COMMAND_LINE_MODE = True
            if not debugTracing or not stash_url:
                for argValue in sys.argv[1:]:
                    if argValue.lower() == "--trace":
                        self.DEBUG_TRACING = True
                    elif argValue.lower() == "--dry_run" or argValue.lower() == "--dryrun":
                        self.DRY_RUN = True
                    elif ":" in argValue and not self.STASH_URL:
                        self.STASH_URL = argValue
            if self.STASH_URL:
                endpointUrlArr = self.STASH_URL.split(":")
                if len(endpointUrlArr) == 3:
                    self.FRAGMENT_SERVER['Scheme'] = endpointUrlArr[0]
                    self.FRAGMENT_SERVER['Host'] = endpointUrlArr[1][2:]
                    self.FRAGMENT_SERVER['Port'] = endpointUrlArr[2]
            super().__init__(self.FRAGMENT_SERVER)
            self.STASH_INTERFACE_INIT = True
        else:
            try:
                self.STDIN_READ = sys.stdin.read()
                self.CALLED_AS_STASH_PLUGIN = True
            except:
                pass
        if self.STDIN_READ:
            self.JSON_INPUT = json.loads(self.STDIN_READ)
            if "args" in self.JSON_INPUT and "mode" in self.JSON_INPUT["args"]:
                self.PLUGIN_TASK_NAME = self.JSON_INPUT["args"]["mode"]
            self.FRAGMENT_SERVER = self.JSON_INPUT["server_connection"]
            self.STASH_URL = f"{self.FRAGMENT_SERVER['Scheme']}://{self.FRAGMENT_SERVER['Host']}:{self.FRAGMENT_SERVER['Port']}"
            super().__init__(self.FRAGMENT_SERVER)
            self.STASH_INTERFACE_INIT = True
            
        if self.STASH_URL.startswith("http://0.0.0.0:"):
            self.STASH_URL = self.STASH_URL.replace("http://0.0.0.0:", "http://localhost:")
        
        if self.STASH_INTERFACE_INIT:
            self.PLUGIN_CONFIGURATION = self.get_configuration()["plugins"]
            self.STASH_CONFIGURATION = self.get_configuration()["general"]
            self.STASHPATHSCONFIG = self.STASH_CONFIGURATION['stashes']
            if 'pluginsPath' in self.STASH_CONFIGURATION:
                self.PLUGINS_PATH = self.STASH_CONFIGURATION['pluginsPath']
            for item in self.STASHPATHSCONFIG: 
                self.STASH_PATHS.append(item["path"])
            if settings:
                self.pluginSettings = settings
                if self.PLUGIN_ID in self.PLUGIN_CONFIGURATION:
                    self.pluginSettings.update(self.PLUGIN_CONFIGURATION[self.PLUGIN_ID])
            if 'apiKey' in self.STASH_CONFIGURATION:
                self.API_KEY = self.STASH_CONFIGURATION['apiKey']
        
        self.DRY_RUN = self.Setting(DryRunFieldName, self.DRY_RUN)
        self.DEBUG_TRACING = self.Setting(DebugTraceFieldName, self.DEBUG_TRACING)
        if self.DEBUG_TRACING: self.LOG_LEVEL = logging.DEBUG
        
        logging.basicConfig(level=self.LOG_LEVEL, format=logFormat, datefmt=dateFmt, handlers=[RFH])
        self.pluginLog = logging.getLogger(pathlib.Path(self.MAIN_SCRIPT_NAME).stem)
        if setStashLoggerAsPluginLogger:
            self.log = self.pluginLog
    
    def __del__(self):
        self.thredPool.shutdown(wait=False)
    
    def Setting(self, name, default=_ARGUMENT_UNSPECIFIED_, raiseEx=True, notEmpty=False):
        if self.pluginSettings != None and name in self.pluginSettings:
            if notEmpty == False or self.pluginSettings[name] != "":
                return self.pluginSettings[name]
        if self.pluginConfig != None and name in self.pluginConfig:
            if notEmpty == False or self.pluginConfig[name] != "":
                return self.pluginConfig[name]
        if default == _ARGUMENT_UNSPECIFIED_ and raiseEx:
            raise Exception(f"Missing {name} from both UI settings and config file settings.") 
        return default
    
    def Log(self, logMsg, printTo = 0, logLevel = logging.INFO, lineNo = -1, levelStr = "", logAlways = False, toAscii = None):
        if toAscii or (toAscii == None and (self.encodeToUtf8 or self.convertToAscii)):
            logMsg = self.asc2(logMsg)
        else:
            logMsg = logMsg
        if printTo == 0: 
            printTo = self.log_to_norm
        elif printTo == self.LOG_TO_ERROR and logLevel == logging.INFO:
            logLevel = logging.ERROR
            printTo = self.log_to_err_set
        elif printTo == self.LOG_TO_CRITICAL and logLevel == logging.INFO:
            logLevel = logging.CRITICAL
            printTo = self.log_to_err_set
        elif printTo == self.LOG_TO_WARN and logLevel == logging.INFO:
            logLevel = logging.WARN
            printTo = self.log_to_wrn_set
        if lineNo == -1:
            lineNo = inspect.currentframe().f_back.f_lineno
        LN_Str = f"[LN:{lineNo}]"
        # print(f"{LN_Str}, {logAlways}, {self.LOG_LEVEL}, {logging.DEBUG}, {levelStr}, {logMsg}")
        if logLevel == logging.DEBUG and (logAlways == False or self.LOG_LEVEL == logging.DEBUG):
            if levelStr == "": levelStr = self.LEV_DBG
            if printTo & self.LOG_TO_FILE: self.pluginLog.debug(f"{LN_Str} {levelStr}{logMsg}")
            if printTo & self.LOG_TO_STASH: self.log.debug(f"{LN_Str} {levelStr}{logMsg}")
        elif logLevel == logging.INFO or logLevel == logging.DEBUG:
            if levelStr == "": levelStr = self.LEV_INF if logLevel == logging.INFO else self.LEV_DBG
            if printTo & self.LOG_TO_FILE: self.pluginLog.info(f"{LN_Str} {levelStr}{logMsg}")
            if printTo & self.LOG_TO_STASH: self.log.info(f"{LN_Str} {levelStr}{logMsg}")
        elif logLevel == logging.WARN:
            if levelStr == "": levelStr = self.LEV_WRN
            if printTo & self.LOG_TO_FILE: self.pluginLog.warning(f"{LN_Str} {levelStr}{logMsg}")
            if printTo & self.LOG_TO_STASH: self.log.warning(f"{LN_Str} {levelStr}{logMsg}")
        elif logLevel == logging.ERROR:
            if levelStr == "": levelStr = self.LEV_ERR
            if printTo & self.LOG_TO_FILE: self.pluginLog.error(f"{LN_Str} {levelStr}{logMsg}")
            if printTo & self.LOG_TO_STASH: self.log.error(f"{LN_Str} {levelStr}{logMsg}")
        elif logLevel == logging.CRITICAL:
            if levelStr == "": levelStr = self.LEV_CRITICAL
            if printTo & self.LOG_TO_FILE: self.pluginLog.critical(f"{LN_Str} {levelStr}{logMsg}")
            if printTo & self.LOG_TO_STASH: self.log.error(f"{LN_Str} {levelStr}{logMsg}")
        if (printTo & self.LOG_TO_CONSOLE) and (logLevel != logging.DEBUG or self.DEBUG_TRACING or logAlways):
            print(f"{LN_Str} {levelStr}{logMsg}")
        if (printTo & self.LOG_TO_STDERR) and (logLevel != logging.DEBUG or self.DEBUG_TRACING or logAlways):
            print(f"StdErr: {LN_Str} {levelStr}{logMsg}", file=sys.stderr)
    
    def Trace(self, logMsg = "", printTo = 0, logAlways = False, lineNo = -1, toAscii = None):
        if printTo == 0: printTo = self.LOG_TO_FILE
        if lineNo == -1:
            lineNo = inspect.currentframe().f_back.f_lineno
        logLev = logging.INFO if logAlways else logging.DEBUG
        if self.DEBUG_TRACING or logAlways:
            if logMsg == "":
                logMsg = f"Line number {lineNo}..."
            self.Log(logMsg, printTo, logLev, lineNo, self.LEV_TRACE, logAlways, toAscii=toAscii)
    
    # Log once per session. Only logs the first time called from a particular line number in the code.
    def TraceOnce(self, logMsg = "", printTo = 0, logAlways = False, toAscii = None):
        lineNo = inspect.currentframe().f_back.f_lineno
        if self.DEBUG_TRACING or logAlways:
            FuncAndLineNo = f"{inspect.currentframe().f_back.f_code.co_name}:{lineNo}"
            if FuncAndLineNo in self.logLinePreviousHits:
                return
            self.logLinePreviousHits.append(FuncAndLineNo)
            self.Trace(logMsg, printTo, logAlways, lineNo, toAscii=toAscii)

    # Log INFO on first call, then do Trace on remaining calls.
    def LogOnce(self, logMsg = "", printTo = 0, logAlways = False, traceOnRemainingCalls = True, toAscii = None):
        if printTo == 0: printTo = self.LOG_TO_FILE
        lineNo = inspect.currentframe().f_back.f_lineno
        FuncAndLineNo = f"{inspect.currentframe().f_back.f_code.co_name}:{lineNo}"
        if FuncAndLineNo in self.logLinePreviousHits:
            if traceOnRemainingCalls:
                self.Trace(logMsg, printTo, logAlways, lineNo, toAscii=toAscii) 
        else:
            self.logLinePreviousHits.append(FuncAndLineNo)
            self.Log(logMsg, printTo, logging.INFO, lineNo, toAscii=toAscii)   
    
    def Warn(self, logMsg, printTo = 0, toAscii = None):
        if printTo == 0: printTo = self.log_to_wrn_set
        lineNo = inspect.currentframe().f_back.f_lineno
        self.Log(logMsg, printTo, logging.WARN, lineNo, toAscii=toAscii)
    
    def Error(self, logMsg, printTo = 0, toAscii = None):
        if printTo == 0: printTo = self.log_to_err_set
        lineNo = inspect.currentframe().f_back.f_lineno
        self.Log(logMsg, printTo, logging.ERROR, lineNo, toAscii=toAscii)
    
    def Status(self, printTo = 0, logLevel = logging.INFO, lineNo = -1):
        if printTo == 0: printTo = self.log_to_norm
        if lineNo == -1:
            lineNo = inspect.currentframe().f_back.f_lineno
        self.Log(f"StashPluginHelper Status: (CALLED_AS_STASH_PLUGIN={self.CALLED_AS_STASH_PLUGIN}), (RUNNING_IN_COMMAND_LINE_MODE={self.RUNNING_IN_COMMAND_LINE_MODE}), (DEBUG_TRACING={self.DEBUG_TRACING}), (DRY_RUN={self.DRY_RUN}), (PLUGIN_ID={self.PLUGIN_ID}), (PLUGIN_TASK_NAME={self.PLUGIN_TASK_NAME}), (STASH_URL={self.STASH_URL}), (MAIN_SCRIPT_NAME={self.MAIN_SCRIPT_NAME})",
            printTo, logLevel, lineNo)
    
    def ExecuteProcess(self, args, ExecDetach=False):
        import platform, subprocess
        is_windows = any(platform.win32_ver())
        pid = None
        self.Trace(f"is_windows={is_windows} args={args}")
        if is_windows:
            if ExecDetach:
                self.Trace("Executing process using Windows DETACHED_PROCESS")
                DETACHED_PROCESS = 0x00000008
                pid = subprocess.Popen(args,creationflags=DETACHED_PROCESS, shell=True).pid
            else:
                pid = subprocess.Popen(args, shell=True).pid
        else:
            self.Trace("Executing process using normal Popen")
            pid = subprocess.Popen(args).pid
        self.Trace(f"pid={pid}")
        return pid
    
    def ExecutePythonScript(self, args, ExecDetach=True):
        PythonExe = f"{sys.executable}"
        argsWithPython = [f"{PythonExe}"] + args
        return self.ExecuteProcess(argsWithPython,ExecDetach=ExecDetach)
    
    def Submit(self, *args, **kwargs):
        return self.thredPool.submit(*args, **kwargs)
    
    def asc2(self, data, convertToAscii=None):
        if convertToAscii or (convertToAscii == None and self.convertToAscii):
            return ascii(data)
        return str(str(data).encode('utf-8'))[2:-1] # This works better for logging than ascii function
        # data = str(data).encode('ascii','ignore') # This works better for logging than ascii function
        # return str(data)[2:-1] # strip out b'str'
    
    def init_mergeMetadata(self, excludeMergeTags=None):
        self.excludeMergeTags = excludeMergeTags
        self._mergeMetadata = mergeMetadata(self, self.excludeMergeTags)
    
    # Must call init_mergeMetadata, before calling merge_metadata
    def merge_metadata(self, SrcData, DestData): # Input arguments can be scene ID or scene metadata
        if type(SrcData) is int:
            SrcData = self.find_scene(SrcData)
            DestData = self.find_scene(DestData)
        return self._mergeMetadata.merge(SrcData, DestData)
    
    def Progress(self, currentIndex, maxCount):
        progress = (currentIndex / maxCount) if currentIndex < maxCount else (maxCount / currentIndex)
        self.log.progress(progress)
    
    def run_plugin(self, plugin_id, task_mode=None, args:dict={}, asyn=False):
        """Runs a plugin operation.
           The operation is run immediately and does not use the job queue.
        Args:
            plugin_id (ID):             plugin_id
            task_name (str, optional):  Plugin task to perform
            args (dict, optional):      Arguments to pass to plugin. Plugin access via JSON_INPUT['args']
        Returns:
            A map of the result.
        """
        query = """mutation RunPluginOperation($plugin_id: ID!, $args: Map!) {
            runPluginOperation(plugin_id: $plugin_id, args: $args)
            }"""        
        if task_mode != None:
            args.update({"mode" : task_mode})
        variables = {
            "plugin_id": plugin_id,
            "args": args,
        }
        if asyn:
            self.Submit(self.call_GQL, query, variables)
            return f"Made asynchronous call for plugin {plugin_id}"
        else:
            return self.call_GQL(query, variables)
       
    def find_duplicate_scenes_diff(self, distance: PhashDistance=PhashDistance.EXACT, fragment='id', duration_diff: float=10.00 ):
        query = """
        	query FindDuplicateScenes($distance: Int, $duration_diff: Float) {
        		findDuplicateScenes(distance: $distance, duration_diff: $duration_diff) {
        			...SceneSlim
        		}
        	}
        """
        if fragment:
        	query = re.sub(r'\.\.\.SceneSlim', fragment, query)
        else:
        	query += "fragment SceneSlim on Scene { id  }"
        
        variables = { "distance": distance, "duration_diff": duration_diff }
        result = self.call_GQL(query, variables)
        return result['findDuplicateScenes'] 
    
    # #################################################################################################
    # The below functions extends class StashInterface with functions which are not yet in the class
    def get_all_scenes(self):
        query_all_scenes = """
            query AllScenes {
                allScenes {
                    id
                    updated_at
                }
            }
        """
        return self.call_GQL(query_all_scenes)
    
    def metadata_autotag(self, paths:list=[], performers:list=[], studios:list=[], tags:list=[]):
        query = """
        mutation MetadataAutoTag($input:AutoTagMetadataInput!) {
            metadataAutoTag(input: $input)
        }
        """
        metadata_autotag_input = {
            "paths":paths,
            "performers": performers,
            "studios":studios,
            "tags":tags,
        }
        result = self.call_GQL(query, {"input": metadata_autotag_input})
        return result
    
    def backup_database(self):
        return self.call_GQL("mutation { backupDatabase(input: {download: false})}")

    def optimise_database(self):
        return self.call_GQL("mutation OptimiseDatabase { optimiseDatabase }")
    
    def metadata_clean_generated(self, blobFiles=True, dryRun=False, imageThumbnails=True, markers=True, screenshots=True, sprites=True, transcodes=True):
        query = """
        mutation MetadataCleanGenerated($input: CleanGeneratedInput!) {
          metadataCleanGenerated(input: $input)
        }
        """
        clean_metadata_input = {
            "blobFiles": blobFiles,
            "dryRun": dryRun,
            "imageThumbnails": imageThumbnails,
            "markers": markers,
            "screenshots": screenshots,
            "sprites": sprites,
            "transcodes": transcodes,
        }
        result = self.call_GQL(query, {"input": clean_metadata_input})
        return result
    
    def rename_generated_files(self):
        return self.call_GQL("mutation MigrateHashNaming {migrateHashNaming}")

class mergeMetadata: # A class to merge scene metadata from source scene to destination scene
    srcData = None
    destData = None
    stash = None
    excludeMergeTags = None
    dataDict = None
    result = "Nothing To Merge"
    def __init__(self, stash, excludeMergeTags=None):
        self.stash = stash
        self.excludeMergeTags = excludeMergeTags
    
    def merge(self, SrcData, DestData):
        self.srcData = SrcData
        self.destData = DestData
        ORG_DATA_DICT = {'id' : self.destData['id']}
        self.dataDict = ORG_DATA_DICT.copy()
        self.mergeItems('tags', 'tag_ids', [], excludeName=self.excludeMergeTags)
        self.mergeItems('performers', 'performer_ids', [])
        self.mergeItems('galleries', 'gallery_ids', [])
        self.mergeItems('movies', 'movies', [])
        self.mergeItems('urls', listToAdd=self.destData['urls'], NotStartWith=self.stash.STASH_URL)
        self.mergeItem('studio', 'studio_id', 'id')
        self.mergeItem('title')
        self.mergeItem('director')
        self.mergeItem('date')
        self.mergeItem('details')
        self.mergeItem('rating100')
        self.mergeItem('code')
        if self.dataDict != ORG_DATA_DICT:
            self.stash.Trace(f"Updating scene ID({self.destData['id']}) with {self.dataDict}; path={self.destData['files'][0]['path']}", toAscii=True)
            self.result = self.stash.update_scene(self.dataDict)
        return self.result
    
    def Nothing(self, Data):
        if not Data or Data == "" or (type(Data) is str and Data.strip() == ""):
            return True
        return False
    
    def mergeItem(self,fieldName, updateFieldName=None, subField=None):
        if updateFieldName == None:
            updateFieldName = fieldName
        if self.Nothing(self.destData[fieldName]) and not self.Nothing(self.srcData[fieldName]):
            if subField == None:
                self.dataDict.update({ updateFieldName : self.srcData[fieldName]})
            else:
                self.dataDict.update({ updateFieldName : self.srcData[fieldName][subField]})
    def mergeItems(self, fieldName, updateFieldName=None, listToAdd=[], NotStartWith=None, excludeName=None):
        dataAdded = ""
        for item in self.srcData[fieldName]:
            if item not in self.destData[fieldName]:
                if NotStartWith == None or not item.startswith(NotStartWith):
                    if excludeName == None or item['name'] not in excludeName:
                        if fieldName == 'movies':
                            listToAdd += [{"movie_id" : item['movie']['id'], "scene_index" : item['scene_index']}]
                            dataAdded += f"{item['movie']['id']} "                    
                        elif updateFieldName == None:
                            listToAdd += [item]
                            dataAdded += f"{item} "
                        else:
                            listToAdd += [item['id']]
                            dataAdded += f"{item['id']} "
        if dataAdded != "":
            if updateFieldName == None:
                updateFieldName = fieldName
            else:
                for item in self.destData[fieldName]:
                    if fieldName == 'movies':
                        listToAdd += [{"movie_id" : item['movie']['id'], "scene_index" : item['scene_index']}]
                    else:
                        listToAdd += [item['id']]
            self.dataDict.update({ updateFieldName : listToAdd})
            # self.stash.Trace(f"Added {fieldName} ({dataAdded}) to scene ID({self.destData['id']})", toAscii=True)
