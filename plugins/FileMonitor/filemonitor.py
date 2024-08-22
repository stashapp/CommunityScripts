# Description: This is a Stash plugin which updates Stash if any changes occurs in the Stash library paths, and runs a scheduler.
# By David Maisonave (aka Axter) Jul-2024 (https://www.axter.com/)
# Get the latest developers version from following link: https://github.com/David-Maisonave/Axter-Stash/tree/main/plugins/FileMonitor
# Note: To call this script outside of Stash, pass argument --url and the Stash URL.
#       Example:    python filemonitor.py --url http://localhost:9999
import os, sys, time, pathlib, argparse, platform, traceback
from StashPluginHelper import StashPluginHelper
import watchdog  # pip install watchdog  # https://pythonhosted.org/watchdog/
from watchdog.observers import Observer # This is also needed for event attributes
from threading import Lock, Condition
from multiprocessing import shared_memory
from filemonitor_config import config
from filemonitor_task_examples import task_examples
from filemonitor_self_unit_test import self_unit_test

config['task_scheduler'] = config['task_scheduler'] + task_examples['task_scheduler']
if self_unit_test['selfUnitTest']:
    config['task_scheduler'] = config['task_scheduler'] + self_unit_test['task_scheduler']

CONTINUE_RUNNING_SIG = 99
STOP_RUNNING_SIG = 32

parser = argparse.ArgumentParser()
parser.add_argument('--url', '-u', dest='stash_url', type=str, help='Add Stash URL')
parser.add_argument('--trace', '-t', dest='trace', action='store_true', help='Enables debug trace mode.')
parser.add_argument('--stop', '-s', dest='stop', action='store_true', help='Stop (kill) a running FileMonitor task.')
parser.add_argument('--restart', '-r', dest='restart', action='store_true', help='Restart FileMonitor.')
parser.add_argument('--silent', '--quit', '-q', dest='quit', action='store_true', help='Run in silent mode. No output to console or stderr. Use this when running from pythonw.exe')
parser.add_argument('--apikey', '-a', dest='apikey', type=str, help='API Key')
parse_args = parser.parse_args()

logToErrSet = 0
logToNormSet = 0
if parse_args.quit:
    logToErrSet = 1
    logToNormSet = 1

settings = {
    "recursiveDisabled": False,
    "turnOnScheduler": False,
    "zmaximumBackups": 1,
    "zzdebugTracing": False
}
stash = StashPluginHelper(
        stash_url=parse_args.stash_url,
        debugTracing=parse_args.trace,
        settings=settings,
        config=config,
        logToErrSet=logToErrSet,
        logToNormSet=logToNormSet,
        apiKey=parse_args.apikey
        )
stash.Status()
stash.Log(f"\nStarting (__file__={__file__}) (stash.CALLED_AS_STASH_PLUGIN={stash.CALLED_AS_STASH_PLUGIN}) (stash.DEBUG_TRACING={stash.DEBUG_TRACING}) (stash.DRY_RUN={stash.DRY_RUN}) (stash.PLUGIN_TASK_NAME={stash.PLUGIN_TASK_NAME})************************************************")

exitMsg = "Change success!!"
mutex = Lock()
signal = Condition(mutex)
shouldUpdate = False

SHAREDMEMORY_NAME = "DavidMaisonaveAxter_FileMonitor" # Unique name for shared memory
RECURSIVE = stash.pluginSettings["recursiveDisabled"] == False
SCAN_MODIFIED = stash.pluginConfig["scanModified"]
RUN_CLEAN_AFTER_DELETE = stash.pluginConfig["runCleanAfterDelete"]
RUN_GENERATE_CONTENT = stash.pluginConfig['runGenerateContent']
SCAN_ON_ANY_EVENT = stash.pluginConfig['onAnyEvent']
SIGNAL_TIMEOUT = stash.pluginConfig['timeOut'] if stash.pluginConfig['timeOut'] > 0 else 1
MAX_TIMEOUT_FOR_DELAY_PATH_PROCESS = stash.pluginConfig['timeOutDelayProcess']
MAX_SECONDS_WAIT_SCANJOB_COMPLETE = stash.pluginConfig['maxWaitTimeJobFinish']

CREATE_SPECIAL_FILE_TO_EXIT = stash.pluginConfig['createSpecFileToExit']
DELETE_SPECIAL_FILE_ON_STOP = stash.pluginConfig['deleteSpecFileInStop']
SPECIAL_FILE_DIR = f"{stash.LOG_FILE_DIR}{os.sep}working"
if CREATE_SPECIAL_FILE_TO_EXIT and not os.path.exists(SPECIAL_FILE_DIR):
    os.makedirs(SPECIAL_FILE_DIR)
# Unique name to trigger shutting down FileMonitor
SPECIAL_FILE_NAME = f"{SPECIAL_FILE_DIR}{os.sep}trigger_to_kill_filemonitor_by_david_maisonave.txt"
if CREATE_SPECIAL_FILE_TO_EXIT and os.path.isfile(SPECIAL_FILE_NAME):
    os.remove(SPECIAL_FILE_NAME)

fileExtTypes = stash.pluginConfig['fileExtTypes'].split(",") if stash.pluginConfig['fileExtTypes'] != "" else []
includePathChanges = stash.pluginConfig['includePathChanges'] if len(stash.pluginConfig['includePathChanges']) > 0 else stash.STASH_PATHS
excludePathChanges = stash.pluginConfig['excludePathChanges']

if stash.DRY_RUN:
    stash.Log("Dry run mode is enabled.")
stash.Trace(f"(SCAN_MODIFIED={SCAN_MODIFIED}) (SCAN_ON_ANY_EVENT={SCAN_ON_ANY_EVENT}) (RECURSIVE={RECURSIVE})")

StartFileMonitorAsAPluginTaskName = "Monitor as a Plugin"
StartFileMonitorAsAServiceTaskName = "Start Library Monitor Service"
StartFileMonitorAsAPluginTaskID = "start_library_monitor"
StartFileMonitorAsAServiceTaskID = "start_library_monitor_service"

FileMonitorPluginIsOnTaskQue =  stash.CALLED_AS_STASH_PLUGIN
StopLibraryMonitorWaitingInTaskQueue = False
JobIdInTheQue = 0
def isJobWaitingToRun():
    global StopLibraryMonitorWaitingInTaskQueue
    global JobIdInTheQue
    global FileMonitorPluginIsOnTaskQue
    FileMonitorPluginIsOnTaskQue = False
    jobIsWaiting = False
    taskQue = stash.job_queue()
    for jobDetails in taskQue:
        stash.Trace(f"(Job ID({jobDetails['id']})={jobDetails})")
        if jobDetails['status'] == "READY":
            if jobDetails['description'] == "Running plugin task: Stop Library Monitor":
                StopLibraryMonitorWaitingInTaskQueue = True
            JobIdInTheQue = jobDetails['id']
            jobIsWaiting = True
        elif jobDetails['status'] == "RUNNING" and jobDetails['description'].find(StartFileMonitorAsAPluginTaskName) > -1:
            FileMonitorPluginIsOnTaskQue = True  
    JobIdInTheQue = 0
    return jobIsWaiting

if stash.CALLED_AS_STASH_PLUGIN and stash.PLUGIN_TASK_NAME == StartFileMonitorAsAPluginTaskID:
    stash.Trace(f"isJobWaitingToRun() = {isJobWaitingToRun()})")
        
class StashScheduler: # Stash Scheduler
    def __init__(self):
        import schedule # pip install schedule  # https://github.com/dbader/schedule
        global SIGNAL_TIMEOUT
        for task in stash.pluginConfig['task_scheduler']:
            if 'task' not in task:
                stash.Error(f"Task is missing required task field. task={task}")
            elif 'hours' in task:
                if task['hours'] > 0:
                    stash.Log(f"Adding to scheduler task '{task['task']}' at {task['hours']} hours interval")
                    schedule.every(task['hours']).hours.do(self.runTask, task)
                    if task['hours'] > 167: # Warn when using a week or more of hours
                        stash.Warn(f"Using {task['hours']} hours in task '{task['task']}'. Should use the weekday syntax instead.")
            elif 'minutes' in task:
                if task['minutes'] > 0:
                    stash.Log(f"Adding to scheduler task '{task['task']}' at {task['minutes']} minutes interval")
                    schedule.every(task['minutes']).minutes.do(self.runTask, task)
                    if task['minutes'] > 10079: # Warn when using a week or more of minutes
                        stash.Warn(f"Using {task['minutes']} minutes in task '{task['task']}'. Should use the weekday syntax instead.")
            elif 'days' in task: # Left here for backward compatibility, but should use weekday logic instead.
                if task['days'] > 0:
                    stash.Log(f"Adding to scheduler task '{task['task']}' at {task['days']} days interval")
                    schedule.every(task['days']).days.do(self.runTask, task)
                    if task['days'] > 6: # Warn when using a week or more of days
                        stash.Warn(f"Using {task['days']} days in task '{task['task']}'. Should use the weekday syntax instead.")
            elif 'seconds' in task: # This is mainly here for test purposes only
                if task['seconds'] > 0:
                    if SIGNAL_TIMEOUT > task['seconds']:
                        stash.Log(f"Changing SIGNAL_TIMEOUT from value {SIGNAL_TIMEOUT} to {task['seconds']} to allow '{task['task']}' to get triggered timely")
                        SIGNAL_TIMEOUT = task['seconds']
                    stash.Log(f"Adding to scheduler task '{task['task']}' at {task['seconds']} seconds interval")
                    schedule.every(task['seconds']).seconds.do(self.runTask, task)
            elif 'weekday' in task and 'time' in task:
                if task['time'].upper() == "DISABLED":
                    stash.Trace(f"Skipping task '{task['task']}', because it's disabled. To enable this task, change the time field to a valid time. Example: '07:00'")
                elif len(task['time']) != 5 or task['time'][2] != ":":
                    stash.Error(f"Skipping task '{task['task']}', because time ({task['time']}) is invalid. Change the time field to a valid time. Example: '07:00'")
                else:
                    weekDays = task['weekday'].lower()
                    if 'monthly' in task:
                        stash.Log(f"Adding to scheduler task '{task['task']}' monthly on number {task['monthly']} {task['weekday']} at {task['time']}")
                    else:
                        stash.Log(f"Adding to scheduler task '{task['task']}' (weekly) every {task['weekday']} at {task['time']}")
                    
                    hasValidDay = False
                    if "monday" in weekDays:
                        schedule.every().monday.at(task['time']).do(self.runTask, task)
                        hasValidDay = True
                    if "tuesday" in weekDays:
                        schedule.every().tuesday.at(task['time']).do(self.runTask, task)
                        hasValidDay = True
                    if "wednesday" in weekDays:
                        schedule.every().wednesday.at(task['time']).do(self.runTask, task)
                        hasValidDay = True
                    if "thursday" in weekDays:
                        schedule.every().thursday.at(task['time']).do(self.runTask, task)
                        hasValidDay = True
                    if "friday" in weekDays:
                        schedule.every().friday.at(task['time']).do(self.runTask, task)
                        hasValidDay = True
                    if "saturday" in weekDays:
                        schedule.every().saturday.at(task['time']).do(self.runTask, task)
                        hasValidDay = True
                    if "sunday" in weekDays:
                        schedule.every().sunday.at(task['time']).do(self.runTask, task)
                        hasValidDay = True
                    
                    if not hasValidDay:
                        stash.Error(f"Task '{task['task']}' is missing valid day(s) in weekday field. weekday = '{task['weekday']}'")
            else:
                stash.Error(f"Task '{task['task']}' is missing fields.")
        self.checkSchedulePending()
    
    # ToDo: Add asynchronous threading logic to running task.
    def runTask(self, task):
        import datetime
        stash.Trace(f"Running task {task}")
        if 'monthly' in task:
            dayOfTheMonth = datetime.datetime.today().day
            FirstAllowedDate = ((task['monthly'] - 1) * 7) + 1
            LastAllowedDate = task['monthly'] * 7
            if dayOfTheMonth < FirstAllowedDate or dayOfTheMonth > LastAllowedDate:
                stash.Log(f"Skipping task {task['task']} because today is not the right {task['weekday']} of the month. Target range is between {FirstAllowedDate} and {LastAllowedDate}.")
                return
        
        targetPaths = includePathChanges
        if 'paths' in task:
            targetPaths = task['paths']
        
        result = None
        if task['task'] == "Clean":
            result = stash.metadata_clean(paths=targetPaths, dry_run=stash.DRY_RUN)
        elif task['task'] == "Clean Generated Files":
            result = stash.metadata_clean_generated()
        elif task['task'] == "Generate":
            result = stash.metadata_generate()
        elif task['task'] == "Backup":
            result = self.runBackupTask(task)
        elif task['task'] == "Scan":
            result = stash.metadata_scan(paths=targetPaths)
        elif task['task'] == "Auto Tag":
            result = stash.metadata_autotag(paths=targetPaths)
        elif task['task'] == "Optimise Database":
            result = stash.optimise_database()
        elif task['task'] == "RenameGeneratedFiles":
            result = stash.rename_generated_files()
        elif task['task'] == "GQL":
            result = stash.call_GQL(task['input'])
        elif task['task'] == "Log":
            Msg = "Scheduled Logging (INFO)."
            if 'msg' in task and task['msg'] != "":
                Msg = task['msg']
            result = stash.Log(Msg)
        elif task['task'] == "Trace":
            Msg = "Scheduled Logging (DBG)."
            if 'msg' in task and task['msg'] != "":
                Msg = task['msg']
            result = stash.Trace(Msg)
        elif task['task'] == "LogOnce":
            Msg = "Scheduled LogOnce."
            if 'msg' in task and task['msg'] != "":
                Msg = task['msg']
            result = stash.LogOnce(Msg)
        elif task['task'] == "TraceOnce":
            Msg = "Scheduled TraceOnce."
            if 'msg' in task and task['msg'] != "":
                Msg = task['msg']
            result = stash.TraceOnce(Msg)
        elif task['task'] == "CheckStashIsRunning":
            result = self.checkStashIsRunning(task)
        elif task['task'] == "python":
            result = self.runPythonScript(task)
        elif task['task'] == "execute":
            result = self.runExecuteProcessTask(task)
        else:
            result = self.runPluginTask(task)
        
        if result:
            stash.Trace(f"Task '{task['task']}' result={result}")
    
    def runExecuteProcessTask(self, task):
        if 'command' in task and task['command'] != "":
            cmd = task['command'].replace("<plugin_path>", f"{pathlib.Path(__file__).resolve().parent}{os.sep}")
            args = [cmd]
            if 'args' in task and len(task['args']) > 0:
                args = args + [task['args']]
            stash.Log(f"Executing command arguments {args}.")
            return f"Execute process PID = {stash.ExecuteProcess(args)}"
        else:
            stash.Error(f"Can not run task '{task['task']}', because it's missing 'command' field.")
        return None
    
    def runPythonScript(self, task):
        if 'script' in task and task['script'] != "":
            script = task['script'].replace("<plugin_path>", f"{pathlib.Path(__file__).resolve().parent}{os.sep}")
            stash.Log(f"Executing python script {script}.")
            args = [script]
            if 'args' in task and len(task['args']) > 0:
                args = args + [task['args']]
            detached = True
            if 'detach' in task:
                detached = task['detach']
            return f"Python process PID = {stash.ExecutePythonScript(args, ExecDetach=detached)}"
        else:
            stash.Error(f"Can not run task '{task['task']}', because it's missing 'script' field.")
        return None
    
    def runPluginTask(self, task):
        # ToDo: Add code to check if plugin is installed.
        try:
            if 'pluginId' in task and task['pluginId'] != "":
                invalidDir = False
                validDirMsg = ""
                if 'validateDir' in task and task['validateDir'] != "":
                    invalidDir = True
                    communityPluginPath = f"{stash.PLUGINS_PATH}{os.sep}community{os.sep}{task['validateDir']}"
                    basePluginPath = f"{stash.PLUGINS_PATH}{os.sep}{task['validateDir']}"
                    if os.path.exists(communityPluginPath):
                        invalidDir = False
                        validDirMsg = f"Valid path in {communityPluginPath}"
                    elif os.path.exists(basePluginPath):
                        invalidDir = False
                        validDirMsg = f"Valid path in {basePluginPath}"
                if invalidDir:
                    stash.Error(f"Could not run task '{task['task']}' because sub directory '{task['validateDir']}' does not exist under path '{stash.PLUGINS_PATH}'")
                else:
                    stash.Trace(f"Running plugin task pluginID={task['pluginId']}, task name = {task['task']}. {validDirMsg}")
                    return stash.run_plugin_task(plugin_id=task['pluginId'], task_name=task['task'])
            else:
                stash.Error(f"Can not run task '{task['task']}', because it's an invalid task.")
                stash.LogOnce(f"If task '{task['task']}' is supposed to be a built-in task, check for correct task name spelling.")
                stash.LogOnce(f"If task '{task['task']}' is supposed to be a plugin, make sure to include the pluginId field in the task. task={task}")
        except Exception as e:
            stash.LogOnce(f"Failed to call plugin {task['task']} with plugin-ID {task['pluginId']}. Error: {e}")
            pass
        return None
    
    def checkStashIsRunning(self, task):
        try:
            result = stash.stash_version()
        except:
            pass
            stash.Error("Failed to get response from Stash.")
            if platform.system() == "Windows":
                execPath = f"{pathlib.Path(stash.PLUGINS_PATH).resolve().parent}{os.sep}stash-win.exe"
            elif platform.system() == "Darwin": # MacOS
                execPath = f"{pathlib.Path(stash.PLUGINS_PATH).resolve().parent}{os.sep} stash-macos "
            elif platform.system().lower().startswith("linux"):
                # ToDo: Need to verify this method will work for (stash-linux-arm32v6, stash-linux-arm32v7, and stash-linux-arm64v8)
                if platform.system().lower().find("32v6") > -1:
                    execPath = f"{pathlib.Path(stash.PLUGINS_PATH).resolve().parent}{os.sep}stash-linux-arm32v6"
                elif platform.system().lower().find("32v7") > -1:
                    execPath = f"{pathlib.Path(stash.PLUGINS_PATH).resolve().parent}{os.sep}stash-linux-arm32v7"
                elif platform.system().lower().find("64v8 ") > -1:
                    execPath = f"{pathlib.Path(stash.PLUGINS_PATH).resolve().parent}{os.sep}stash-linux-arm64v8"
                else:
                    execPath = f"{pathlib.Path(stash.PLUGINS_PATH).resolve().parent}{os.sep}stash-linux"
            elif platform.system().lower().startswith("freebsd"):
                execPath = f"{pathlib.Path(stash.PLUGINS_PATH).resolve().parent}{os.sep}stash-freebsd"
            elif 'command' not in task or task['command'] == "":
                stash.Error("Can not start Stash, because failed to determine platform OS. As a workaround, add 'command' field to this task.")
                return None
            
            if 'command' in task and task['command'] != "":
                cmd = task['command'].replace("<stash_path>", f"{pathlib.Path(stash.PLUGINS_PATH).resolve().parent}{os.sep}")
                args = [cmd]
            else:
                if os.path.isfile(execPath):
                    args = [execPath]
                else:
                    stash.Error("Could not start Stash, because could not find executable Stash file '{execPath}'")
                    return None
            result = f"Execute process PID = {stash.ExecuteProcess(args)}"
            time.sleep(10)
            if "RunAfter" in task and len(task['RunAfter']) > 0:
                for runAfterTask in task['RunAfter']:
                    self.runTask(runAfterTask)
        return result 
    
    def runBackupTask(self, task):
        stash.LogOnce("Note: Backup task does not get listed in the Task Queue, but user can verify that it started by looking in the Stash log file as an INFO level log line.")
        result = stash.backup_database()
        maximumBackup = stash.pluginSettings['zmaximumBackups']
        stash.Trace(f"maximumBackup={maximumBackup}")
        if "maxBackups" in task:
            maximumBackup = task['maxBackups']
        stash.Trace(f"maximumBackup={maximumBackup}")
        if isinstance(maximumBackup,str):
            maximumBackup = int(maximumBackup)
        if maximumBackup < 2:
            stash.TraceOnce(f"Skipping DB backup file trim because zmaximumBackups={maximumBackup}. Value has to be greater than 1.")
        elif 'backupDirectoryPath' in stash.STASH_CONFIGURATION:
            if len(stash.STASH_CONFIGURATION['backupDirectoryPath']) < 5:
                stash.TraceOnce(f"Skipping DB backup file trim because backupDirectoryPath length is to short. Len={len(stash.STASH_CONFIGURATION['backupDirectoryPath'])}. Only support length greater than 4 characters.")
            elif os.path.exists(stash.STASH_CONFIGURATION['backupDirectoryPath']):
                stash.LogOnce(f"Checking quantity of DB backups if path {stash.STASH_CONFIGURATION['backupDirectoryPath']} exceeds {maximumBackup} backup files.")
                self.trimDbFiles(stash.STASH_CONFIGURATION['backupDirectoryPath'], maximumBackup)
            else:
                stash.TraceOnce(f"Skipping DB backup file trim because backupDirectoryPath does NOT exist. backupDirectoryPath={stash.STASH_CONFIGURATION['backupDirectoryPath']}")        
        return result
    
    def trimDbFiles(self, dbPath, maxFiles):
        if not os.path.exists(dbPath):
            stash.LogOnce(f"Exiting trimDbFiles, because path {dbPath} does not exists.")
            return
        if len(dbPath) < 5: # For safety and security, short path not supported.
            stash.Warn(f"Exiting trimDbFiles, because path {dbPath} is to short. Len={len(dbPath)}. Path string must be at least 5 characters in length.")
            return
        stashPrefixSqlDbFileName = "stash-go.sqlite."
        dbFiles = sorted(os.listdir(dbPath))
        n = len(dbFiles)
        for i in range(0, n-maxFiles):
            dbFilePath = f"{dbPath}{os.sep}{dbFiles[i]}"
            if dbFiles[i].startswith(stashPrefixSqlDbFileName):
                stash.Warn(f"Deleting DB file {dbFilePath}")
                os.remove(dbFilePath)
            else:
                stash.LogOnce(f"Skipping deleting file '{dbFiles[i]}', because the file doesn't start with string '{stashPrefixSqlDbFileName}'.")
    
    def checkSchedulePending(self):
        import schedule # pip install schedule  # https://github.com/dbader/schedule
        stash.TraceOnce("Checking if task pending.")
        schedule.run_pending()
        stash.TraceOnce("Pending check complete.")

TargetPaths = []
lastScanJob = {
    "id": -1,
    "TargetPaths": [],
    "DelayedProcessTargetPaths": [],
    "timeAddedToTaskQueue": None,
    "timeOutDelayProcess": 1,
    "lastStatus" : ""
}
JOB_ENDED_STATUSES = ["FINISHED", "CANCELLED"]

def start_library_monitor():
    global shouldUpdate
    global TargetPaths
    global lastScanJob
    try:
        # Create shared memory buffer which can be used as singleton logic or to get a signal to quit task from external script
        shm_a = shared_memory.SharedMemory(name=SHAREDMEMORY_NAME, create=True, size=4)
    except:
        stash.Error(f"Could not open shared memory map ({SHAREDMEMORY_NAME}). Change File Monitor must be running. Can not run multiple instance of Change File Monitor. Stop FileMonitor before trying to start it again.")
        return
    type(shm_a.buf)
    shm_buffer = shm_a.buf
    len(shm_buffer)
    shm_buffer[0] = CONTINUE_RUNNING_SIG
    stash.Trace(f"Shared memory map opended, and flag set to {shm_buffer[0]}")
    RunCleanMetadata = False
    stashScheduler = StashScheduler() if stash.pluginSettings['turnOnScheduler'] else None   
    event_handler = watchdog.events.FileSystemEventHandler()
    def doIgnoreFileExt(chng_path, addToTargetPaths = False):
        global TargetPaths
        chng_path_lwr = chng_path.lower()
        if len(fileExtTypes) > 0:
            suffix = pathlib.Path(chng_path_lwr).suffix.lstrip(".")
            if suffix not in fileExtTypes:
                stash.TraceOnce(f"Ignoring file change because not a monitored type ({suffix}).")
                return True
        if len(excludePathChanges) > 0:
            for path in excludePathChanges:
                if chng_path_lwr.startswith(path.lower()):
                    stash.TraceOnce(f"Ignoring file change because is excluded path ({chng_path_lwr}) per entery '{path}'.")
                    return True
        if addToTargetPaths:
            TargetPaths.append(chng_path)
        return False
    
    def on_created(event):
        global shouldUpdate
        if doIgnoreFileExt(event.src_path, True):
            return
        stash.Log(f"CREATE *** '{event.src_path}'")
        with mutex:
            shouldUpdate = True
            signal.notify()

    def on_deleted(event):
        global shouldUpdate
        nonlocal RunCleanMetadata
        if doIgnoreFileExt(event.src_path, True):
            return
        stash.Log(f"DELETE ***  '{event.src_path}'")
        with mutex:
            shouldUpdate = True
            RunCleanMetadata = True
            signal.notify()

    def on_modified(event):
        global shouldUpdate
        global TargetPaths
        if doIgnoreFileExt(event.src_path):
            return
        if SCAN_MODIFIED:
            TargetPaths.append(event.src_path)
            stash.Log(f"MODIFIED ***  '{event.src_path}'")
            with mutex:
                shouldUpdate = True
                signal.notify()
        else:
            stash.TraceOnce(f"Ignoring modifications due to plugin UI setting. path='{event.src_path}'")

    def on_moved(event):
        global shouldUpdate
        global TargetPaths
        if doIgnoreFileExt(event.src_path, True):
            return
        TargetPaths.append(event.dest_path)
        stash.Log(f"MOVE ***  from '{event.src_path}' to '{event.dest_path}'")
        with mutex:
            shouldUpdate = True
            signal.notify()
    
    def on_any_event(event):
        global shouldUpdate
        global TargetPaths
        if doIgnoreFileExt(event.src_path):
            return
        if SCAN_ON_ANY_EVENT or event.src_path == SPECIAL_FILE_DIR:
            stash.Log(f"Any-Event ***  '{event.src_path}'")
            TargetPaths.append(event.src_path)
            with mutex:
                shouldUpdate = True
                signal.notify()
        else:
            stash.TraceOnce("Ignoring on_any_event trigger.")
    
    event_handler.on_created = on_created
    event_handler.on_deleted = on_deleted
    event_handler.on_modified = on_modified
    event_handler.on_moved = on_moved
    event_handler.on_any_event = on_any_event
    
    observer = Observer()
    
    # Iterate through includePathChanges
    for path in includePathChanges:
        observer.schedule(event_handler, path, recursive=RECURSIVE)
        stash.Log(f"Observing {path}")
    observer.schedule(event_handler, SPECIAL_FILE_DIR, recursive=RECURSIVE)
    stash.Trace(f"Observing FileMonitor path {SPECIAL_FILE_DIR}")
    observer.start()
    JobIsRunning = False
    PutPluginBackOnTaskQueAndExit = False
    stash.Trace("Starting loop")
    try:
        while True:
            TmpTargetPaths = []
            with mutex:
                while not shouldUpdate:
                    stash.TraceOnce("While not shouldUpdate")
                    if stash.CALLED_AS_STASH_PLUGIN and isJobWaitingToRun():
                        if FileMonitorPluginIsOnTaskQue:
                            stash.Log(f"Another task (JobID={JobIdInTheQue}) is waiting on the queue. Will restart FileMonitor to allow other task to run.")
                            JobIsRunning = True
                            break
                        else:
                            stash.Warn("Not restarting because FileMonitor is no longer on Task Queue")
                    if shm_buffer[0] != CONTINUE_RUNNING_SIG:
                        stash.Log(f"Breaking out of loop. (shm_buffer[0]={shm_buffer[0]})")
                        break
                    if stash.pluginSettings['turnOnScheduler']:
                        stashScheduler.checkSchedulePending()
                    timeOutInSeconds = SIGNAL_TIMEOUT
                    if lastScanJob['DelayedProcessTargetPaths'] != [] and timeOutInSeconds > lastScanJob['timeOutDelayProcess']:
                        if lastScanJob['timeOutDelayProcess'] < MAX_TIMEOUT_FOR_DELAY_PATH_PROCESS:
                            lastScanJob['timeOutDelayProcess'] = lastScanJob['timeOutDelayProcess'] * 2
                            if lastScanJob['timeOutDelayProcess'] > MAX_TIMEOUT_FOR_DELAY_PATH_PROCESS:
                                lastScanJob['timeOutDelayProcess'] = MAX_TIMEOUT_FOR_DELAY_PATH_PROCESS
                        timeOutInSeconds = lastScanJob['timeOutDelayProcess']
                        stash.LogOnce(f"Awaiting file change-trigger, with a short timeout ({timeOutInSeconds} seconds), because of active delay path processing.")
                    else:
                        stash.LogOnce(f"Waiting for a file change-trigger. Timeout = {timeOutInSeconds} seconds.")
                    signal.wait(timeout=timeOutInSeconds)
                    if lastScanJob['DelayedProcessTargetPaths'] != []:
                        stash.TraceOnce(f"Processing delay scan for path(s) {lastScanJob['DelayedProcessTargetPaths']}")
                        break
                    elif stash.pluginSettings['turnOnScheduler'] and not shouldUpdate:
                        stash.TraceOnce("Checking the scheduler.")
                    elif shouldUpdate:
                        stash.LogOnce("File change trigger occurred.")
                    else:
                        stash.TraceOnce("Wait timeout occurred.")
                shouldUpdate = False
                TmpTargetPaths = []
                for TargetPath in TargetPaths:
                    TmpTargetPaths.append(os.path.dirname(TargetPath))
                    stash.Trace(f"Added Path {os.path.dirname(TargetPath)}")
                    if TargetPath == SPECIAL_FILE_NAME:
                        if os.path.isfile(SPECIAL_FILE_NAME):
                            shm_buffer[0] = STOP_RUNNING_SIG
                            stash.Log(f"[SpFl]Detected trigger file to kill FileMonitor. {SPECIAL_FILE_NAME}", printTo = stash.LOG_TO_FILE + stash.LOG_TO_CONSOLE + stash.LOG_TO_STASH)
                        else:
                            stash.Trace(f"[SpFl]Did not find file {SPECIAL_FILE_NAME}.")
                
                # Make sure special file does not exist, incase change was missed.
                if CREATE_SPECIAL_FILE_TO_EXIT and os.path.isfile(SPECIAL_FILE_NAME) and shm_buffer[0] == CONTINUE_RUNNING_SIG:
                    shm_buffer[0] = STOP_RUNNING_SIG
                    stash.Log(f"[SpFl]Detected trigger file to kill FileMonitor. {SPECIAL_FILE_NAME}", printTo = stash.LOG_TO_FILE + stash.LOG_TO_CONSOLE + stash.LOG_TO_STASH)
                TargetPaths = []
                TmpTargetPaths = list(set(TmpTargetPaths))
            if TmpTargetPaths != [] or lastScanJob['DelayedProcessTargetPaths'] != []:
                stash.Log(f"Triggering Stash scan for path(s) {TmpTargetPaths}")
                if lastScanJob['DelayedProcessTargetPaths'] != [] or len(TmpTargetPaths) > 1 or TmpTargetPaths[0] != SPECIAL_FILE_DIR:
                    if not stash.DRY_RUN:
                        if lastScanJob['id'] > -1:
                            lastScanJob['lastStatus'] = stash.find_job(lastScanJob['id'])
                            elapsedTime = time.time() - lastScanJob['timeAddedToTaskQueue']
                            if 'status' not in lastScanJob['lastStatus']:
                                stash.Warn(f"Could not get a status from scan job {lastScanJob['id']}; result = {lastScanJob['lastStatus']}; Elapse-Time = {elapsedTime}")
                            else:
                                stash.Trace(f"Last Scan Job ({lastScanJob['id']}); Status = {lastScanJob['lastStatus']['status']}; result = {lastScanJob['lastStatus']}; Elapse-Time = {elapsedTime}")
                            if 'status' not in lastScanJob['lastStatus'] or lastScanJob['lastStatus']['status'] in JOB_ENDED_STATUSES or elapsedTime > MAX_SECONDS_WAIT_SCANJOB_COMPLETE:
                                if elapsedTime > MAX_SECONDS_WAIT_SCANJOB_COMPLETE:
                                    stash.Warn(f"Timeout occurred waiting for scan job {lastScanJob['id']} to complete. Elapse-Time = {elapsedTime}; Max-Time={MAX_SECONDS_WAIT_SCANJOB_COMPLETE}; Scan-Path(s) = {lastScanJob['TargetPaths']}")
                                lastScanJob['id'] = -1
                                lastScanJob['timeOutDelayProcess'] = 1
                                if len(lastScanJob['DelayedProcessTargetPaths']) > 0:
                                    stash.Trace(f"Adding {lastScanJob['DelayedProcessTargetPaths']} to {TmpTargetPaths}")
                                    for path in lastScanJob['DelayedProcessTargetPaths']:
                                        if path not in TmpTargetPaths:
                                            TmpTargetPaths.append(path)
                                    # TmpTargetPaths += [lastScanJob['DelayedProcessTargetPaths']]
                                    stash.Trace(f"TmpTargetPaths = {TmpTargetPaths}")
                                    lastScanJob['DelayedProcessTargetPaths'] = []
                            else:
                                if TmpTargetPaths != []:
                                    stash.Trace(f"Adding {TmpTargetPaths} to {lastScanJob['DelayedProcessTargetPaths']}")
                                    for path in TmpTargetPaths:
                                        if path not in lastScanJob['DelayedProcessTargetPaths']:
                                            lastScanJob['DelayedProcessTargetPaths'].append(path)
                                stash.Trace(f"lastScanJob['DelayedProcessTargetPaths'] = {lastScanJob['DelayedProcessTargetPaths']}")
                        if lastScanJob['id'] == -1:
                            stash.Trace(f"Calling metadata_scan for paths '{TmpTargetPaths}'")
                            lastScanJob['id'] = int(stash.metadata_scan(paths=TmpTargetPaths))
                            lastScanJob['TargetPaths'] = TmpTargetPaths
                            lastScanJob['timeAddedToTaskQueue'] = time.time()
                            stash.Trace(f"metadata_scan JobId = {lastScanJob['id']}, Start-Time = {lastScanJob['timeAddedToTaskQueue']}, paths = {lastScanJob['TargetPaths']}")
                    if RUN_CLEAN_AFTER_DELETE and RunCleanMetadata:
                        stash.metadata_clean(paths=TmpTargetPaths, dry_run=stash.DRY_RUN)
                    if RUN_GENERATE_CONTENT:
                        stash.metadata_generate()
                    if stash.CALLED_AS_STASH_PLUGIN and shm_buffer[0] == CONTINUE_RUNNING_SIG and FileMonitorPluginIsOnTaskQue:
                        PutPluginBackOnTaskQueAndExit = True
            else:
                stash.Trace("Nothing to scan.")
            
            if shm_buffer[0] != CONTINUE_RUNNING_SIG or StopLibraryMonitorWaitingInTaskQueue:               
                stash.Log(f"Exiting Change File Monitor. (shm_buffer[0]={shm_buffer[0]}) (StopLibraryMonitorWaitingInTaskQueue={StopLibraryMonitorWaitingInTaskQueue})")
                shm_a.close()
                shm_a.unlink()  # Call unlink only once to release the shared memory
                raise KeyboardInterrupt
            elif JobIsRunning or PutPluginBackOnTaskQueAndExit:
                stash.run_plugin_task(plugin_id=stash.PLUGIN_ID, task_name=StartFileMonitorAsAPluginTaskName)
                stash.Trace(f"Exiting plugin so that other task can run. (JobIsRunning={JobIsRunning}) (PutPluginBackOnTaskQueAndExit={PutPluginBackOnTaskQueAndExit})")
                return
    except KeyboardInterrupt:
        observer.stop()
        stash.Trace("Stopping observer")
        if os.path.isfile(SPECIAL_FILE_NAME):
            os.remove(SPECIAL_FILE_NAME)
    observer.join()
    stash.Trace("Exiting function")

#       Example: python filemonitor.py --stop
def stop_library_monitor():
    if CREATE_SPECIAL_FILE_TO_EXIT:
        if os.path.isfile(SPECIAL_FILE_NAME):
            os.remove(SPECIAL_FILE_NAME)
        pathlib.Path(SPECIAL_FILE_NAME).touch()
        if DELETE_SPECIAL_FILE_ON_STOP:
            os.remove(SPECIAL_FILE_NAME)
    stash.Trace("Opening shared memory map.")
    try:
        shm_a = shared_memory.SharedMemory(name=SHAREDMEMORY_NAME, create=False, size=4)
    except:
        # If FileMonitor is running as plugin, then it's expected behavior that SharedMemory will not be available.
        stash.Trace(f"Could not open shared memory map ({SHAREDMEMORY_NAME}). Change File Monitor must not be running.")
        return
    type(shm_a.buf)
    shm_buffer = shm_a.buf
    len(shm_buffer)
    shm_buffer[0] = STOP_RUNNING_SIG
    stash.Trace(f"Shared memory map opended, and flag set to {shm_buffer[0]}")
    shm_a.close()
    shm_a.unlink()  # Call unlink only once to release the shared memory

def start_library_monitor_service():
    # First check if FileMonitor is already running
    try:
        shm_a = shared_memory.SharedMemory(name=SHAREDMEMORY_NAME, create=False, size=4)
        shm_a.close()
        shm_a.unlink()
        stash.Error("FileMonitor is already running. Need to stop FileMonitor before trying to start it again.")
        return
    except:
        pass
        stash.Trace("FileMonitor is not running, so it's safe to start it as a service.")
    args = [f"{pathlib.Path(__file__).resolve().parent}{os.sep}filemonitor.py", '--url', f"{stash.STASH_URL}"]
    if stash.API_KEY:
        args = args + ["-a", stash.API_KEY]
    stash.ExecutePythonScript(args)
    
if parse_args.stop or parse_args.restart or stash.PLUGIN_TASK_NAME == "stop_library_monitor":
    stop_library_monitor()
    if parse_args.restart:
        time.sleep(5)
        stash.run_plugin_task(plugin_id=stash.PLUGIN_ID, task_name=StartFileMonitorAsAPluginTaskName)
        stash.Trace(f"Restart FileMonitor EXIT")
    else:
        stash.Trace(f"Stop FileMonitor EXIT")
elif stash.PLUGIN_TASK_NAME == StartFileMonitorAsAServiceTaskID:
    start_library_monitor_service()
    stash.Trace(f"{StartFileMonitorAsAServiceTaskID} EXIT")
elif stash.PLUGIN_TASK_NAME == StartFileMonitorAsAPluginTaskID:
    start_library_monitor()
    stash.Trace(f"{StartFileMonitorAsAPluginTaskID} EXIT")
elif not stash.CALLED_AS_STASH_PLUGIN:
    try:
        start_library_monitor()
        stash.Trace(f"Command line FileMonitor EXIT")
    except Exception as e:
        tb = traceback.format_exc()
        stash.Error(f"Exception while running FileMonitor from the command line. Error: {e}\nTraceBack={tb}")
        stash.log.exception('Got exception on main handler')
else:
    stash.Log(f"Nothing to do!!! (stash.PLUGIN_TASK_NAME={stash.PLUGIN_TASK_NAME})")

stash.Trace("\n*********************************\nEXITING   ***********************\n*********************************")
