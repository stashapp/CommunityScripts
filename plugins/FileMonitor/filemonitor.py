# Description: This is a Stash plugin which updates Stash if any changes occurs in the Stash library paths, and runs a scheduler.
# By David Maisonave (aka Axter) Jul-2024 (https://www.axter.com/)
# Get the latest developers version from following link: https://github.com/David-Maisonave/Axter-Stash/tree/main/plugins/FileMonitor
# Note: To call this script outside of Stash, pass argument --url and the Stash URL.
#       Example:    python filemonitor.py --url http://localhost:9999
try:
    import ModulesValidate
    ModulesValidate.modulesInstalled(["stashapp-tools", "watchdog", "schedule", "requests"], silent=True)
except Exception as e:
    import traceback, sys
    tb = traceback.format_exc()
    print(f"ModulesValidate Exception. Error: {e}\nTraceBack={tb}", file=sys.stderr)
import os, sys, time, pathlib, argparse, platform, traceback, logging
from StashPluginHelper import StashPluginHelper
from StashPluginHelper import taskQueue
from threading import Lock, Condition
from multiprocessing import shared_memory
from filemonitor_config import config
from filemonitor_task_examples import task_examples
from filemonitor_self_unit_test import self_unit_test
from datetime import datetime

config['task_scheduler'] = config['task_scheduler'] + task_examples['task_scheduler']
if self_unit_test['selfUnitTest_repeat']:
    config['task_scheduler'] = config['task_scheduler'] + self_unit_test['task_scheduler_repeat']
if self_unit_test['selfUnitTest_set_time']:
    config['task_scheduler'] = config['task_scheduler'] + self_unit_test['task_scheduler_set_time']

CONTINUE_RUNNING_SIG = 99
STOP_RUNNING_SIG = 32

parser = argparse.ArgumentParser()
parser.add_argument('--url', '-u', dest='stash_url', type=str, help='Add Stash URL')
parser.add_argument('--trace', '-t', dest='trace', action='store_true', help='Enables debug trace mode.')
parser.add_argument('--stop', '-s', dest='stop', action='store_true', help='Stop a running FileMonitor task.')
parser.add_argument('--kill_que', '-k', dest='kill_job_task_que', type=str, help='Kill job on Task Queue while running in service mode (command line mode).')
parser.add_argument('--restart', '-r', dest='restart', action='store_true', help='Restart FileMonitor.')
parser.add_argument('--silent', '--quit', '-q', dest='quit', action='store_true', help='Run in silent mode. No output to console or stderr. Use this when running from pythonw.exe')
parser.add_argument('--apikey', '-a', dest='apikey', type=str, help='API Key')
parser.add_argument('--docker', '-d', dest='docker', type=str, help='Docker compose YML file.')
parse_args = parser.parse_args()


logToErrSet = 0
logToNormSet = 0
if parse_args.quit:
    logToErrSet = 1
    logToNormSet = 1

settings = {
    "recursiveDisabled": False,
    "turnOnScheduler": False,
    "turnOnSchedulerDeleteDup": False,
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
        maxbytes=5*1024*1024,
        apiKey=parse_args.apikey
        )

doJsonReturnModeTypes = ["getFileMonitorRunningStatus", "start_library_monitor_service_json", "stop_library_monitor_json"]
doJsonReturn = False
doJsonReturnFileMonitorStatus = False
if len(sys.argv) < 2 and stash.PLUGIN_TASK_NAME in doJsonReturnModeTypes:
    doJsonReturn = True
    doJsonReturnFileMonitorStatus = True
    stash.log_to_norm = stash.LogTo.FILE
    if stash.PLUGIN_TASK_NAME.endswith("_json"):
        stash.PLUGIN_TASK_NAME = stash.PLUGIN_TASK_NAME[:-5]

stash.status(logLevel=logging.DEBUG)
stash.Log(f"\nStarting (__file__={__file__}) (stash.CALLED_AS_STASH_PLUGIN={stash.CALLED_AS_STASH_PLUGIN}) (stash.DEBUG_TRACING={stash.DEBUG_TRACING}) (stash.DRY_RUN={stash.DRY_RUN}) (stash.PLUGIN_TASK_NAME={stash.PLUGIN_TASK_NAME})************************************************")
stash.Trace(f"stash.JSON_INPUT={stash.JSON_INPUT}")

exitMsg = "Change success!!"
mutex = Lock()
signal = Condition(mutex)
shouldUpdate = False

SHAREDMEMORY_NAME = "DavidMaisonaveAxter_FileMonitor" # Unique name for shared memory
SHAREDMEMORY_SIZE = 4
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
includePathChanges = includePathChanges[:] # Make a copy of the list, and not a reference
hostIncludePathChanges = includePathChanges[:]
excludePathChanges = stash.pluginConfig['excludePathChanges']
turnOnSchedulerDeleteDup = stash.pluginSettings['turnOnSchedulerDeleteDup']
NotInLibraryTagName = stash.pluginConfig['NotInLibraryTagName']

filemonitor_config_dev_file = f"{stash.PLUGINS_PATH}{os.sep}FileMonitor{os.sep}filemonitor_config_dev.py"
if os.path.exists(filemonitor_config_dev_file):
    stash.Log(f"Getting {filemonitor_config_dev_file} configuration settings.")
    from filemonitor_config_dev import config_dev
    config['dockers'] = config_dev['dockers']
    
dockerMapVolumes = {}
dockerReverseMapVolumes = {}
dockerObservedPaths = {}
if not parse_args.docker == None and len(parse_args.docker) > 0:
    if stash.IS_DOCKER:
        stash.Error("You are running this script from within Docker. This is NOT supported.  Run this script in the host machine instead. Performing early exit due to unsupported action.")
        sys.exit(50) # ERROR_NOT_SUPPORTED: The request is not supported.
    stash.Log(f"Docker compose YML file = {parse_args.docker}")
    ModulesValidate.modulesInstalled(["pyyaml"], silent=True)
    import yaml
    dockerStashPath = pathlib.Path(parse_args.docker).resolve().parent
    with open(parse_args.docker, "r", encoding='utf-8-sig') as stream:
        try:
            data_loaded = yaml.safe_load(stream)
            for service in data_loaded['services']:
                for volume in data_loaded['services'][service]['volumes']:
                    volSplit = volume.replace(":ro", "").split(":/")
                    hostPath = volSplit[0]
                    # Do not scan Stash interanl working folders
                    if volSplit[1] == "root/.stash" or volSplit[1] == "metadata" or volSplit[1] == "cache" or volSplit[1] == "blobs" or volSplit[1] == "generated":
                        continue
                    if volSplit[0].startswith("./../../"):
                        dockerStashParentPath = pathlib.Path(dockerStashPath).resolve().parent
                        hostPath = f"{pathlib.Path(dockerStashParentPath).resolve().parent}{hostPath[8:]}"
                    elif volSplit[0].startswith("./../"):
                        hostPath = f"{pathlib.Path(dockerStashPath).resolve().parent}{hostPath[5:]}"
                    elif volSplit[0].startswith("./"):
                        hostPath = f"{dockerStashPath}{hostPath[1:]}"
                    elif volSplit[0].startswith("/"):
                        continue
                    dockerMapVolumes[hostPath] = f"/{volSplit[1]}"
                    dockerReverseMapVolumes[f"/{volSplit[1]}"] = hostPath
            for hostPath in dockerMapVolumes:
                stash.Log(f"Host-Path = {hostPath}, Docker-Path = {dockerMapVolumes[hostPath]}")
        except yaml.YAMLError as e:
            import traceback
            tb = traceback.format_exc()
            stash.Error(f"Exception while parsing Docker file {parse_args.docker}; Error: {e}\nTraceBack={tb}")

if stash.IS_DOCKER and stash.PLUGIN_TASK_NAME != "stop_library_monitor" and not parse_args.stop and stash.PLUGIN_TASK_NAME != "getFileMonitorRunningStatus":
    stash.Error("You are running this script from within Docker. This is NOT supported.  Run this script in the host machine instead.")
    stash.Warn("For more information on running FileMonitor on host machine see following link:\n https://github.com/David-Maisonave/Axter-Stash/tree/main/plugins/FileMonitor#Docker")
    stash.Warn("Performing early exit because FileMonitor has to run on the host machine, and can NOT run on Docker directly.")
    sys.exit(10) # ERROR_BAD_ENVIRONMENT: The environment is incorrect.
    # Alternate error:  sys.exit(160) # ERROR_BAD_ARGUMENTS: One or more arguments are not correct.

dockerStashes = {}
for docker in stash.pluginConfig['dockers']:
    stash.Log(f"Adding monitoring to Docker Stash {docker['GQL']}")
    dockerStashes[docker['GQL']] = StashPluginHelper(
            stash_url=docker['GQL'],
            debugTracing=parse_args.trace,
            settings=settings,
            config=config,
            logToErrSet=logToErrSet,
            logToNormSet=8,
            maxbytes=5*1024*1024,
            apiKey=docker['apiKey']
            )
    for bindMount in docker['bindMounts']:
        for key in bindMount:
            if len(key) == 0:
                continue
            # Do not scan Stash interanl working folders
            if bindMount[key] == "/root/.stash" or bindMount[key] == "/metadata" or bindMount[key] == "/cache" or bindMount[key] == "/blobs" or bindMount[key] == "/generated":
                continue
            stash.Log(f"Adding monitoring for host path '{key}' which is Docker mount path '{bindMount[key]}' for Stash {docker['GQL']}")
            includePathChanges += [key]
stash.Log(f"This Stash instance GQL = {stash.STASH_URL}")
# for path in includePathChanges:
    # stash.Log(f"[post] includePathChange = {path}")

if stash.DRY_RUN:
    stash.Log("Dry run mode is enabled.")
stash.Trace(f"(SCAN_MODIFIED={SCAN_MODIFIED}) (SCAN_ON_ANY_EVENT={SCAN_ON_ANY_EVENT}) (RECURSIVE={RECURSIVE})")

StartFileMonitorAsAPluginTaskName = "Monitor as a Plugin"
StartFileMonitorAsAServiceTaskName = "Start Library Monitor Service"

StartFileMonitorAsAPluginTaskID = "start_library_monitor"
StartFileMonitorAsAServiceTaskID = "start_library_monitor_service"
StopFileMonitorAsAPluginTaskID = "stop_library_monitor"
SYNC_LIBRARY_REMOVE = "sync_library_remove"
SYNC_LIBRARY_TAG = "sync_library_tag"
CLEAR_SYNC_LIBRARY_TAG = "clear_sync_tags_task"

FileMonitorPluginIsOnTaskQue =  stash.CALLED_AS_STASH_PLUGIN
StopLibraryMonitorWaitingInTaskQueue = False
JobIdInTheQue = 0
JobIdOf_StartAsAServiceTask = None
def isJobWaitingToRun(getJobIdOf_StartAsAServiceTask = False):
    global StopLibraryMonitorWaitingInTaskQueue
    global JobIdInTheQue
    global JobIdOf_StartAsAServiceTask
    global FileMonitorPluginIsOnTaskQue
    FileMonitorPluginIsOnTaskQue = False
    jobIsWaiting = False
    taskQue = stash.job_queue()
    if taskQue == None:
        return jobIsWaiting
    for jobDetails in taskQue:
        stash.Trace(f"(Job ID({jobDetails['id']})={jobDetails})")
        if getJobIdOf_StartAsAServiceTask:
            if jobDetails['status'] == "RUNNING" and jobDetails['description'].find(StartFileMonitorAsAServiceTaskName) > -1:
                JobIdOf_StartAsAServiceTask = jobDetails['id']
                stash.Trace(f"Found current running task '{jobDetails['description']}' with Job ID {JobIdOf_StartAsAServiceTask}")
                return True
        else:
            if jobDetails['status'] == "READY":
                if jobDetails['description'] == "Running plugin task: Stop Library Monitor":
                    StopLibraryMonitorWaitingInTaskQueue = True
                JobIdInTheQue = jobDetails['id']
                jobIsWaiting = True
            elif jobDetails['status'] == "RUNNING" and jobDetails['description'].find(StartFileMonitorAsAPluginTaskName) > -1:
                FileMonitorPluginIsOnTaskQue = True  
    JobIdInTheQue = 0
    return jobIsWaiting

if stash.PLUGIN_TASK_NAME == StartFileMonitorAsAPluginTaskID:
    stash.Trace(f"isJobWaitingToRun() = {isJobWaitingToRun()})")
elif stash.PLUGIN_TASK_NAME == StartFileMonitorAsAServiceTaskID:
    stash.Trace(f"isJobWaitingToRun() = {isJobWaitingToRun(True)})")


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
                        stash.Log(f"Adding to scheduler task '{self.taskName(task)}' monthly on number {task['monthly']} {task['weekday']} at {task['time']}")
                    elif task['weekday'] == "every":
                        stash.Log(f"Adding to scheduler task '{self.taskName(task)}' (weekly) every day at {task['time']}")
                    else:
                        stash.Log(f"Adding to scheduler task '{self.taskName(task)}' (weekly) every {task['weekday']} at {task['time']}")
                    
                    hasValidDay = False
                    if "monday" in weekDays or "every" in weekDays:
                        schedule.every().monday.at(task['time']).do(self.runTask, task)
                        hasValidDay = True
                    if "tuesday" in weekDays or "every" in weekDays:
                        schedule.every().tuesday.at(task['time']).do(self.runTask, task)
                        hasValidDay = True
                    if "wednesday" in weekDays or "every" in weekDays:
                        schedule.every().wednesday.at(task['time']).do(self.runTask, task)
                        hasValidDay = True
                    if "thursday" in weekDays or "every" in weekDays:
                        schedule.every().thursday.at(task['time']).do(self.runTask, task)
                        hasValidDay = True
                    if "friday" in weekDays or "every" in weekDays:
                        schedule.every().friday.at(task['time']).do(self.runTask, task)
                        hasValidDay = True
                    if "saturday" in weekDays or "every" in weekDays or "weekend" in weekDays:
                        schedule.every().saturday.at(task['time']).do(self.runTask, task)
                        hasValidDay = True
                    if "sunday" in weekDays or "every" in weekDays or "weekend" in weekDays:
                        schedule.every().sunday.at(task['time']).do(self.runTask, task)
                        hasValidDay = True
                    
                    if not hasValidDay:
                        stash.Error(f"Task '{task['task']}' is missing valid day(s) in weekday field. weekday = '{task['weekday']}'")
            else:
                stash.Error(f"Task '{task['task']}' is missing fields.")
        self.checkSchedulePending()
    
    def taskName(self, task):
        pluginTask = None
        if 'taskName' in task:
            pluginTask = task['taskName']
        elif 'taskMode' in task:
            pluginTask = task['taskMode']
        if pluginTask == None or pluginTask == "":
            return task['task']
        return f"{task['task']}->{pluginTask}"
    
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
            result = self.jobIdOutput(stash.metadata_clean(dry_run=stash.DRY_RUN))
        elif task['task'] == "Clean Path":
            result = self.jobIdOutput(stash.metadata_clean(paths=targetPaths, dry_run=stash.DRY_RUN))
        elif task['task'] == "Clean Generated Files":
            result = self.jobIdOutput(stash.metadata_clean_generated())
        elif task['task'] == "Generate":
            result = self.jobIdOutput(stash.metadata_generate())
        elif task['task'] == "Generate Phashes":
            result = self.jobIdOutput(stash.metadata_generate({"phashes": True}))
        elif task['task'] == "Backup":
            result = self.jobIdOutput(self.runBackupTask(task))
        elif task['task'] == "Scan":
            result = self.jobIdOutput(stash.metadata_scan())
        elif task['task'] == "Scan Path":
            result = self.jobIdOutput(stash.metadata_scan(paths=targetPaths))
        elif task['task'] == "Auto Tag":
            result = self.jobIdOutput(stash.metadata_autotag())
        elif task['task'] == "Auto Tag Path":
            result = self.jobIdOutput(stash.metadata_autotag(paths=targetPaths))
        elif task['task'] == "Optimise Database":
            result = self.jobIdOutput(stash.optimise_database())
        elif task['task'] == "RenameGeneratedFiles":
            result = self.jobIdOutput(stash.rename_generated_files())
        elif task['task'] == "GQL":
            result = self.jobIdOutput(stash.call_GQL(task['input']))
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
        elif task['task'] == "DebugOnce":
            Msg = "Scheduled DebugOnce."
            if 'msg' in task and task['msg'] != "":
                Msg = task['msg']
            result = stash.DebugOnce(Msg)
        elif task['task'] == "CheckStashIsRunning":
            result = self.checkStashIsRunning(task)
        elif task['task'] == "python":
            result = self.runPythonScript(task)
        elif task['task'] == "execute":
            result = self.runExecuteProcessTask(task)
        else:
            result = self.jobIdOutput(self.runPluginTask(task))
        
        if result:
            stash.Trace(f"Task '{task['task']}' result={result}")
    
    def jobIdOutput(self, result):
        if result == None or result == "":
            return result
        jobId = None
        if type(result) is int:
            jobId = result
        elif str(result).isnumeric():
            jobId = int(result)
        else:
            return result
        return f"Task started with Job-ID#({jobId})"
    
    def runExecuteProcessTask(self, task):
        if 'command' in task and task['command'] != "":
            cmd = task['command'].replace("<plugin_path>", f"{pathlib.Path(__file__).resolve().parent}{os.sep}")
            args = [cmd]
            if 'args' in task and len(task['args']) > 0:
                args = args + [task['args']]
            stash.Log(f"Executing command arguments {args}.")
            return f"Execute process PID = {stash.executeProcess(args)}"
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
            return f"Python process PID = {stash.executePythonScript(args, ExecDetach=detached)}"
        else:
            stash.Error(f"Can not run task '{task['task']}', because it's missing 'script' field.")
        return None
    
    def runPluginTask(self, task):
        try:
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
                return None
            if not turnOnSchedulerDeleteDup and  (task['task'] == "Delete Duplicates" or  ('taskName' in task and (task['taskName'] == "Delete Duplicates" or task['taskName'] == "Delete Tagged Duplicates")) or ('taskMode' in task and task['taskMode'] == "delete_duplicates_task")):
                stash.Warn(f"Not running task {task['task']}, because [Delete Duplicate Scheduler] is NOT enabled. See Stash UI option Settings->Plugins->Plugins->FileMonitor->[Delete Duplicate Scheduler]")
                return None           
            # The pluginId field is only here for backward compatibility, and should not be used in future scheduler configurations
            if 'pluginId' in task and task['pluginId'] != "": # Obsolete method
                stash.Trace(f"Adding to Task Queue plugin task pluginID={task['pluginId']}, task name = {task['task']}. {validDirMsg}")
                return stash.run_plugin_task(plugin_id=task['pluginId'], task_name=task['task'])
            else:
                taskName = None
                taskMode = None
                if 'taskName' in task:
                    taskName = task['taskName']
                if 'taskMode' in task:
                    taskMode = task['taskMode']
                if ('taskQue' in task and task['taskQue'] == False) or taskName == None:
                    stash.Log(f"Running plugin task pluginID={task['task']}, task mode = {taskMode}. {validDirMsg}")
                    # Asynchronous threading logic to call runPlugin, because it's a blocking call.
                    stash.runPlugin(plugin_id=task['task'], task_mode=taskMode, asyn=True)
                    return None
                else:
                    stash.Trace(f"Adding to Task Queue plugin task pluginID={task['task']}, task name = {taskName}. {validDirMsg}")
                    return stash.run_plugin_task(plugin_id=task['task'], task_name=taskName)
        except Exception as e:
            stash.LogOnce(f"Failed to call plugin {task['task']} with plugin-ID {task['pluginId']}. Error: {e}")
            pass
        return None
    
    def checkStashIsRunning(self, task = {}, sleepAfterStart = 10):
        try:
            result = stash.stash_version()
        except:
            pass
            stash.Error("Failed to get response from Stash.")
            if stash.IS_WINDOWS:
                execPath = f"{pathlib.Path(stash.PLUGINS_PATH).resolve().parent}{os.sep}stash-win.exe"
            elif stash.IS_MAC_OS:
                execPath = f"{pathlib.Path(stash.PLUGINS_PATH).resolve().parent}{os.sep} stash-macos "
            elif stash.IS_LINUX:
                # ToDo: Need to verify this method will work for (stash-linux-arm32v6, stash-linux-arm32v7, and stash-linux-arm64v8)
                if platform.system().lower().find("32v6") > -1:
                    execPath = f"{pathlib.Path(stash.PLUGINS_PATH).resolve().parent}{os.sep}stash-linux-arm32v6"
                elif platform.system().lower().find("32v7") > -1:
                    execPath = f"{pathlib.Path(stash.PLUGINS_PATH).resolve().parent}{os.sep}stash-linux-arm32v7"
                elif platform.system().lower().find("64v8 ") > -1:
                    execPath = f"{pathlib.Path(stash.PLUGINS_PATH).resolve().parent}{os.sep}stash-linux-arm64v8"
                else:
                    execPath = f"{pathlib.Path(stash.PLUGINS_PATH).resolve().parent}{os.sep}stash-linux"
            elif stash.IS_FREEBSD:
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
            result = f"Execute process PID = {stash.executeProcess(args)}"
            time.sleep(sleepAfterStart)
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
    from watchdog.observers import Observer # This is also needed for event attributes
    import watchdog  # pip install watchdog  # https://pythonhosted.org/watchdog/
    global shouldUpdate
    global TargetPaths
    global lastScanJob
    try:
        # Create shared memory buffer which can be used as singleton logic or to get a signal to quit task from external script
        shm_a = shared_memory.SharedMemory(name=SHAREDMEMORY_NAME, create=True, size=SHAREDMEMORY_SIZE)
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
        pathToObserve = path
        if not parse_args.docker == None and len(parse_args.docker) > 0:
            if not pathToObserve.startswith("/"):
                pathToObserve = f"/{pathToObserve}"
            stash.Debug(f"Converting Docker path '{pathToObserve}' to Host-path; original-path={path}")
            if pathToObserve in dockerReverseMapVolumes:
                pathToObserve = dockerReverseMapVolumes[pathToObserve]
            for dockerPath in dockerReverseMapVolumes:
                if pathToObserve.startswith(f"{dockerPath}/"):
                    pathToObserve = pathToObserve.replace(f"{dockerPath}/", f"{dockerReverseMapVolumes[dockerPath]}/")
                    break
            pathToObserve = pathToObserve.replace('/', os.sep)
            dockerObservedPaths[f"{pathToObserve}{os.sep}"] = path
        stash.Log(f"Observing {pathToObserve}")
        if not os.path.exists(pathToObserve):
            stash.Error(f"Skipping path '{pathToObserve}' because it does not exist!!!")
            continue
        observer.schedule(event_handler, pathToObserve, recursive=RECURSIVE)
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
                        stash.Log(f"Awaiting file change-trigger, with a short timeout ({timeOutInSeconds} seconds), because of active delay path processing.")
                    else:
                        stash.Log(f"Waiting for a file change-trigger. Timeout = {timeOutInSeconds} seconds.")
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
                            stash.Log(f"[SpFl]Detected trigger file to kill FileMonitor. {SPECIAL_FILE_NAME}", printTo = stash.LogTo.FILE + stash.LogTo.CONSOLE + stash.LogTo.STASH)
                        else:
                            stash.Trace(f"[SpFl]Did not find file {SPECIAL_FILE_NAME}.")
                
                # Make sure special file does not exist, incase change was missed.
                if CREATE_SPECIAL_FILE_TO_EXIT and os.path.isfile(SPECIAL_FILE_NAME) and shm_buffer[0] == CONTINUE_RUNNING_SIG:
                    shm_buffer[0] = STOP_RUNNING_SIG
                    stash.Log(f"[SpFl]Detected trigger file to kill FileMonitor. {SPECIAL_FILE_NAME}", printTo = stash.LogTo.FILE + stash.LogTo.CONSOLE + stash.LogTo.STASH)
                TargetPaths = []
                TmpTargetPaths = list(set(TmpTargetPaths))
            if TmpTargetPaths != [] or lastScanJob['DelayedProcessTargetPaths'] != []:
                # ToDo: Add check to see if Docker Map path
                stash.Log(f"Triggering Stash scan for path(s) {TmpTargetPaths} and/or {lastScanJob['DelayedProcessTargetPaths']}")
                if lastScanJob['DelayedProcessTargetPaths'] != [] or len(TmpTargetPaths) > 1 or TmpTargetPaths[0] != SPECIAL_FILE_DIR:
                    if not stash.DRY_RUN:
                        if lastScanJob['id'] > -1:
                            if stashScheduler:
                                stashScheduler.checkStashIsRunning()
                            lastScanJob['lastStatus'] = stash.find_job(lastScanJob['id'])
                            elapsedTime = time.time() - lastScanJob['timeAddedToTaskQueue']
                            if lastScanJob['lastStatus'] == None or lastScanJob['lastStatus'] == "" or 'status' not in lastScanJob['lastStatus']:
                                stash.Warn(f"Could not get a status from scan job {lastScanJob['id']}; result = {lastScanJob['lastStatus']}; Elapse-Time = {elapsedTime}")
                            else:
                                stash.Trace(f"Last Scan Job ({lastScanJob['id']}); Status = {lastScanJob['lastStatus']['status']}; result = {lastScanJob['lastStatus']}; Elapse-Time = {elapsedTime}")
                            if lastScanJob['lastStatus'] == None or lastScanJob['lastStatus'] == "" or 'status' not in lastScanJob['lastStatus'] or lastScanJob['lastStatus']['status'] in JOB_ENDED_STATUSES or elapsedTime > MAX_SECONDS_WAIT_SCANJOB_COMPLETE:
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
                            taskqueue = taskQueue(stash.job_queue())
                            if taskqueue.tooManyScanOnTaskQueue(7):
                                stash.Log(f"[metadata_scan] Skipping updating Stash for paths '{TmpTargetPaths}', because too many scans on Task Queue.")
                            else:
                                if not parse_args.docker == None and len(parse_args.docker) > 0:
                                    CpyTmpTargetPaths = list(set(TmpTargetPaths))
                                    TmpTargetPaths = []
                                    for CpyTmpTargetPath in CpyTmpTargetPaths:
                                        for key in dockerObservedPaths:
                                            if CpyTmpTargetPath.startswith(key):
                                                HostTmpTargetPath = CpyTmpTargetPath
                                                CpyTmpTargetPath = f"{dockerObservedPaths[key]}/{CpyTmpTargetPath[len(key):]}"
                                                stash.Log(f"Converted Host-Path {HostTmpTargetPath} to Docker-Path {CpyTmpTargetPath}")
                                                TmpTargetPaths += [CpyTmpTargetPath]
                                                break
                                if len(stash.pluginConfig['dockers']) > 0:
                                    for TmpTargetPath in TmpTargetPaths:
                                        for docker in stash.pluginConfig['dockers']:
                                            for bindMount in docker['bindMounts']:
                                                for key in bindMount:
                                                    if TmpTargetPath.startswith(key):
                                                        stash.Log(f"Sending notification to Stash Docker {docker['GQL']} for file system change in path '{bindMount[key]}' which is host path {key}.")
                                                        dockerStashes[docker['GQL']].Log(f"File system change in path '{bindMount[key]}' which is host path {key}.")
                                                        dockerStashes[docker['GQL']].metadata_scan(paths=bindMount[key])
                                stash.Trace(f"[metadata_scan] Calling metadata_scan for paths '{TmpTargetPaths}'")
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
        shm_a = shared_memory.SharedMemory(name=SHAREDMEMORY_NAME, create=False, size=SHAREDMEMORY_SIZE)
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
    if doJsonReturnFileMonitorStatus:
        sys.stdout.write("{" + f"{stash.PLUGIN_TASK_NAME} : 'complete', FileMonitorStatus:'NOT running', IS_DOCKER:'{stash.IS_DOCKER}'" + "}")

def start_library_monitor_service():
    # First check if FileMonitor is already running
    try:
        shm_a = shared_memory.SharedMemory(name=SHAREDMEMORY_NAME, create=False, size=SHAREDMEMORY_SIZE)
        shm_a.close()
        shm_a.unlink()
        stash.Error("FileMonitor is already running. Need to stop FileMonitor before trying to start it again.")
        return
    except:
        pass
        stash.Trace("FileMonitor is not running, so it's safe to start it as a service.")
    args = [f"{pathlib.Path(__file__).resolve().parent}{os.sep}filemonitor.py", '--url', f"{stash.STASH_URL}"]
    if JobIdOf_StartAsAServiceTask != None:
        args += ["-k", JobIdOf_StartAsAServiceTask]
    if stash.API_KEY:
        args += ["-a", stash.API_KEY]
    results = stash.executePythonScript(args)
    stash.Trace(f"executePythonScript results='{results}'")
    if doJsonReturnFileMonitorStatus:
        time.sleep(5)
        sys.stdout.write("{" + f"{stash.PLUGIN_TASK_NAME} : 'complete', FileMonitorStatus:'RUNNING', IS_DOCKER:'{stash.IS_DOCKER}'" + "}")

def synchronize_library(removeScene=False):
    stash.startSpinningProcessBar()
    scenes = stash.find_scenes(fragment='id tags {id name} files {path}')
    qtyResults = len(scenes)
    Qty = 0
    stash.Log(f"count = {qtyResults}")
    stash.stopSpinningProcessBar()
    sceneIDs = stash.find_scenes(fragment='id files {path}')
    for scene in scenes:
        Qty += 1
        stash.progressBar(Qty, qtyResults)
        scenePartOfLibrary = False
        for path in stash.STASH_PATHS:
            if scene['files'][0]['path'].startswith(path):
                scenePartOfLibrary = True
                break
        if scenePartOfLibrary == False:
            stash.Log(f"Scene ID={scene['id']}; path={scene['files'][0]['path']} not part of Stash Library")
            if removeScene:
                stash.destroy_scene(scene['id'])
                stash.Log(f"Removed Scene ID={scene['id']}; path={scene['files'][0]['path']}")
            else:
                stash.addTag(scene, NotInLibraryTagName, ignoreAutoTag=True)
                stash.Trace(f"Tagged ({NotInLibraryTagName}) Scene ID={scene['id']}; path={scene['files'][0]['path']}")

def manageTagggedScenes(clearTag=True):
    tagId = stash.find_tags(q=NotInLibraryTagName)
    if len(tagId) > 0 and 'id' in tagId[0]:
        tagId = tagId[0]['id']
    else:
        stash.Warn(f"Could not find tag ID for tag '{NotInLibraryTagName}'.")
        return
    QtyDup = 0
    QtyRemoved = 0
    QtyClearedTags = 0
    QtyFailedQuery = 0
    stash.Trace("#########################################################################")
    stash.startSpinningProcessBar()
    stash.Trace(f"Calling find_scenes with tagId={tagId}")
    sceneIDs = stash.find_scenes(f={"tags": {"value":tagId, "modifier":"INCLUDES"}}, fragment='id')
    stash.stopSpinningProcessBar()
    qtyResults = len(sceneIDs)
    stash.Trace(f"Found {qtyResults} scenes with tag ({NotInLibraryTagName}): sceneIDs = {sceneIDs}")
    for sceneID in sceneIDs:
        # stash.Trace(f"Getting scene data for scene ID {sceneID['id']}.")
        QtyDup += 1
        prgs = QtyDup / qtyResults
        stash.progressBar(QtyDup, qtyResults)
        scene = stash.find_scene(sceneID['id'])
        if scene == None or len(scene) == 0:
            stash.Warn(f"Could not get scene data for scene ID {sceneID['id']}.")
            QtyFailedQuery += 1
            continue
        # stash.Trace(f"scene={scene}")
        if clearTag:
            tags = [int(item['id']) for item in scene["tags"] if item['id'] != tagId]
            stash.TraceOnce(f"tagId={tagId}, len={len(tags)}, tags = {tags}")
            dataDict = {'id' : scene['id']}
            dataDict.update({'tag_ids' : tags})
            stash.Log(f"Updating scene with {dataDict}")
            stash.update_scene(dataDict)
            # stash.removeTag(scene, NotInLibraryTagName)
            QtyClearedTags += 1            
        else:
            stash.destroy_scene(scene['id'])
            stash.Log(f"Removed Scene ID={scene['id']}; path={scene['files'][0]['path']}")
            QtyRemoved += 1
    stash.Log(f"QtyDup={QtyDup}, QtyClearedTags={QtyClearedTags}, QtyRemoved={QtyRemoved}, QtyFailedQuery={QtyFailedQuery}")

runTypeID=0
runTypeName=["NothingToDo", "stop_library_monitor", "StartFileMonitorAsAServiceTaskID", "StartFileMonitorAsAPluginTaskID", "CommandLineStartLibMonitor"]

def getFileMonitorRunningStatus():
    FileMonitorStatus = "NOT running"
    try:
        shm_a = shared_memory.SharedMemory(name=SHAREDMEMORY_NAME, create=False, size=SHAREDMEMORY_SIZE)
        shm_a.close()
        shm_a.unlink()
        FileMonitorStatus = "RUNNING"
        stash.Log("FileMonitor is running...")
    except:
        pass
        stash.Log("FileMonitor is NOT running!!!")
    stash.Log(f"{stash.PLUGIN_TASK_NAME} complete")
    sys.stdout.write("{" + f"{stash.PLUGIN_TASK_NAME} : 'complete', FileMonitorStatus:'{FileMonitorStatus}', IS_DOCKER:'{stash.IS_DOCKER}'" + "}")

try:
    if parse_args.stop or parse_args.restart or stash.PLUGIN_TASK_NAME == "stop_library_monitor":
        runTypeID=1
        stop_library_monitor()
        if parse_args.restart:
            time.sleep(5)
            stash.run_plugin_task(plugin_id=stash.PLUGIN_ID, task_name=StartFileMonitorAsAPluginTaskName)
            stash.Trace(f"Restart FileMonitor EXIT")
        else:
            stash.Trace(f"Stop FileMonitor EXIT")
    elif stash.PLUGIN_TASK_NAME == StartFileMonitorAsAServiceTaskID:
        runTypeID=2
        start_library_monitor_service()
        stash.Trace(f"{StartFileMonitorAsAServiceTaskID} transitioning to service mode.")
    elif stash.PLUGIN_TASK_NAME == StartFileMonitorAsAPluginTaskID:
        runTypeID=3
        start_library_monitor()
        stash.Trace(f"{StartFileMonitorAsAPluginTaskID} EXIT")
    elif stash.PLUGIN_TASK_NAME == SYNC_LIBRARY_REMOVE:
        runTypeID=5
        synchronize_library(removeScene=tRUE)
        stash.Trace(f"{SYNC_LIBRARY_REMOVE} EXIT")
    elif stash.PLUGIN_TASK_NAME == SYNC_LIBRARY_TAG:
        runTypeID=6
        synchronize_library()
        stash.Trace(f"{SYNC_LIBRARY_TAG} EXIT")
    elif stash.PLUGIN_TASK_NAME == CLEAR_SYNC_LIBRARY_TAG:
        runTypeID=7
        manageTagggedScenes()
        stash.Trace(f"{CLEAR_SYNC_LIBRARY_TAG} EXIT")
    elif stash.PLUGIN_TASK_NAME == "getFileMonitorRunningStatus":
        getFileMonitorRunningStatus()
        stash.Debug(f"{stash.PLUGIN_TASK_NAME} EXIT")
    elif not stash.CALLED_AS_STASH_PLUGIN:
        runTypeID=4
        if parse_args.kill_job_task_que != None and parse_args.kill_job_task_que != "":
            # Removing the job from the Task Queue is really only needed for Linux, but it should be OK to do in general.
            stash.Log(f"Removing job ID {parse_args.kill_job_task_que} from the Task Queue, because transitioning to service mode.")
            stash.stop_job(parse_args.kill_job_task_que)
        start_library_monitor()
        stash.Trace("Command line FileMonitor EXIT")
    else:
        stash.Log(f"Nothing to do!!! (stash.PLUGIN_TASK_NAME={stash.PLUGIN_TASK_NAME})")
except Exception as e:
    tb = traceback.format_exc()
    stash.Error(f"Exception while running FileMonitor. runType='{runTypeName[runTypeID]}'; Error: {e}\nTraceBack={tb}")
    if doJsonReturn:
        sys.stdout.write("{" + f"Exception : '{e}; See log file for TraceBack' " + "}")
stash.Trace("\n*********************************\nEXITING   ***********************\n*********************************")

# ToDo: Add option to add path to library if path not included when calling metadata_scan