# Description: This is a Stash plugin which updates Stash if any changes occurs in the Stash library paths.
# By David Maisonave (aka Axter) Jul-2024 (https://www.axter.com/)
# Get the latest developers version from following link: https://github.com/David-Maisonave/Axter-Stash/tree/main/plugins/ChangeFileMonitor
# Note: To call this script outside of Stash, pass any argument. 
#       Example:    python changefilemonitor.py foofoo
import os
import sys
import time
import shutil
import fileinput
import hashlib
import json
from pathlib import Path
import requests
import logging
from logging.handlers import RotatingFileHandler
import stashapi.log as log # Importing stashapi.log as log for critical events ONLY
from stashapi.stashapp import StashInterface
from watchdog.observers import Observer # This is also needed for event attributes
import watchdog  # pip install watchdog  # https://pythonhosted.org/watchdog/
from threading import Lock, Condition
from multiprocessing import shared_memory
from changefilemonitor_config import config # Import settings from changefilemonitor_config.py

# **********************************************************************
# Constant global variables --------------------------------------------
LOG_FILE_PATH = log_file_path = f"{Path(__file__).resolve().parent}\\{Path(__file__).stem}.log" 
FORMAT = "[%(asctime)s - LN:%(lineno)s] %(message)s"
PLUGIN_ARGS = False
PLUGIN_ARGS_MODE = False
PLUGIN_ID = Path(__file__).stem.lower()
# GraphQL query to fetch all scenes
QUERY_ALL_SCENES = """
    query AllScenes {
        allScenes {
            id
            updated_at
        }
    }
"""
RFH = RotatingFileHandler(
    filename=LOG_FILE_PATH, 
    mode='a',
    maxBytes=2*1024*1024, # Configure logging for this script with max log file size of 2000K
    backupCount=2,
    encoding=None,
    delay=0
)
TIMEOUT = 5
CONTINUE_RUNNING_SIG = 99

# **********************************************************************
# Global variables          --------------------------------------------
exitMsg = "Change success!!"
mutex = Lock()
signal = Condition(mutex)
shouldUpdate = False
TargetPaths = []
runningInPluginMode = False

# Configure local log file for plugin within plugin folder having a limited max log file size 
logging.basicConfig(level=logging.INFO, format=FORMAT, datefmt="%y%m%d %H:%M:%S", handlers=[RFH])
logger = logging.getLogger(Path(__file__).stem)
    
# **********************************************************************
# ----------------------------------------------------------------------
# Code section to fetch variables from Plugin UI and from changefilemonitor_settings.py
# Check if being called as Stash plugin
gettingCalledAsStashPlugin = True
stopLibraryMonitoring = False
StdInRead = None
try:
    if len(sys.argv) == 1:
        print(f"Attempting to read stdin. (len(sys.argv)={len(sys.argv)})", file=sys.stderr)
        StdInRead = sys.stdin.read()
        # for line in fileinput.input():
            # StdInRead = line
            # break
    else:
        if len(sys.argv) > 1 and sys.argv[1].lower() == "stop":
            stopLibraryMonitoring = True
        raise Exception("Not called in plugin mode.") 
except:
    gettingCalledAsStashPlugin = False
    print(f"Either len(sys.argv) not expected value OR sys.stdin.read() failed! (stopLibraryMonitoring={stopLibraryMonitoring}) (StdInRead={StdInRead}) (len(sys.argv)={len(sys.argv)})", file=sys.stderr)
    pass
    
if gettingCalledAsStashPlugin and StdInRead:
    print(f"StdInRead={StdInRead} (len(sys.argv)={len(sys.argv)})", file=sys.stderr)
    runningInPluginMode = True
    json_input = json.loads(StdInRead)
    FRAGMENT_SERVER = json_input["server_connection"]
else:
    runningInPluginMode = False
    FRAGMENT_SERVER = {'Scheme': config['endpoint_Scheme'], 'Host': config['endpoint_Host'], 'Port': config['endpoint_Port'], 'SessionCookie': {'Name': 'session', 'Value': '', 'Path': '', 'Domain': '', 'Expires': '0001-01-01T00:00:00Z', 'RawExpires': '', 'MaxAge': 0, 'Secure': False, 'HttpOnly': False, 'SameSite': 0, 'Raw': '', 'Unparsed': None}, 'Dir': os.path.dirname(Path(__file__).resolve().parent), 'PluginDir': Path(__file__).resolve().parent}
    print("Running in non-plugin mode!", file=sys.stderr)

stash = StashInterface(FRAGMENT_SERVER)
PLUGINCONFIGURATION = stash.get_configuration()["plugins"]
STASHCONFIGURATION = stash.get_configuration()["general"]
STASHPATHSCONFIG = STASHCONFIGURATION['stashes']
stashPaths = []
settings = {
    "recursiveDisabled": False,
    "runCleanAfterDelete": False,
    "scanModified": False,
    "zzdebugTracing": False,
    "zzdryRun": False,
}

if PLUGIN_ID in PLUGINCONFIGURATION:
    settings.update(PLUGINCONFIGURATION[PLUGIN_ID])
# ----------------------------------------------------------------------
debugTracing = settings["zzdebugTracing"]
RECURSIVE = settings["recursiveDisabled"] == False
SCAN_MODIFIED = settings["scanModified"]
RUN_CLEAN_AFTER_DELETE = settings["runCleanAfterDelete"]
RUN_GENERATE_CONTENT = config['runGenerateContent']

for item in STASHPATHSCONFIG: 
    stashPaths.append(item["path"])

# Extract dry_run setting from settings
DRY_RUN = settings["zzdryRun"]
dry_run_prefix = ''
try:
    PLUGIN_ARGS         = json_input['args']
    PLUGIN_ARGS_MODE    = json_input['args']["mode"]
except:
    pass
logger.info(f"\nStarting (runningInPluginMode={runningInPluginMode}) (debugTracing={debugTracing}) (DRY_RUN={DRY_RUN}) (PLUGIN_ARGS_MODE={PLUGIN_ARGS_MODE}) (PLUGIN_ARGS={PLUGIN_ARGS})************************************************")
if debugTracing: logger.info(f"Debug Tracing (stash.get_configuration()={stash.get_configuration()})................")
if debugTracing: logger.info("settings: %s " % (settings,))
if debugTracing: logger.info(f"Debug Tracing (STASHCONFIGURATION={STASHCONFIGURATION})................")
if debugTracing: logger.info(f"Debug Tracing (stashPaths={stashPaths})................")

if DRY_RUN:
    logger.info("Dry run mode is enabled.")
    dry_run_prefix = "Would've "
if debugTracing: logger.info("Debug Tracing................")
# ----------------------------------------------------------------------
# **********************************************************************
if debugTracing: logger.info(f"Debug Tracing (SCAN_MODIFIED={SCAN_MODIFIED}) (RECURSIVE={RECURSIVE})................")

def start_library_monitor():
    global shouldUpdate
    global TargetPaths    
    try:
        # Create shared memory buffer which can be used as singleton logic or to get a signal to quit task from external script
        shm_a = shared_memory.SharedMemory(name="DavidMaisonaveAxter_ChangeFileMonitor", create=True, size=4)
    except:
        pass
        logger.info("Could not open shared memory map. Change File Monitor must be running. Can not run multiple instance of Change File Monitor.")
        return
    type(shm_a.buf)
    shm_buffer = shm_a.buf
    len(shm_buffer)
    shm_buffer[0] = CONTINUE_RUNNING_SIG
    if debugTracing: logger.info(f"Shared memory map opended, and flag set to {shm_buffer[0]}")
    RunCleanMetadata = False

    event_handler = watchdog.events.FileSystemEventHandler()
    def on_created(event):
        global shouldUpdate
        global TargetPaths
        TargetPaths.append(event.src_path)
        logger.info(f"CREATE *** '{event.src_path}'")
        with mutex:
            shouldUpdate = True
            signal.notify()

    def on_deleted(event):
        global shouldUpdate
        global TargetPaths
        nonlocal RunCleanMetadata
        TargetPaths.append(event.src_path)
        logger.info(f"DELETE ***  '{event.src_path}'")
        with mutex:
            shouldUpdate = True
            RunCleanMetadata = True
            signal.notify()

    def on_modified(event):
        global shouldUpdate
        global TargetPaths
        if SCAN_MODIFIED:
            TargetPaths.append(event.src_path)
            logger.info(f"MODIFIED ***  '{event.src_path}'")
            with mutex:
                shouldUpdate = True
                signal.notify()
        else:
            if debugTracing: logger.info(f"Ignoring modifications due to plugin UI setting. path='{event.src_path}'")

    def on_moved(event):
        global shouldUpdate
        global TargetPaths
        TargetPaths.append(event.src_path)
        TargetPaths.append(event.dest_path)
        logger.info(f"MOVE ***  from '{event.src_path}' to '{event.dest_path}'")
        with mutex:
            shouldUpdate = True
            signal.notify()

    if debugTracing: logger.info("Debug Trace........")
    event_handler.on_created = on_created
    event_handler.on_deleted = on_deleted
    event_handler.on_modified = on_modified
    event_handler.on_moved = on_moved
    
    observer = Observer()
    
    # Iterate through stashPaths
    for path in stashPaths:
        observer.schedule(event_handler, path, recursive=RECURSIVE)
        if debugTracing: logger.info(f"Observing {path}")
    observer.start()
    if debugTracing: logger.info("Starting loop................")
    try:
        while True:
            TmpTargetPaths = []
            with mutex:
                while not shouldUpdate:
                    if debugTracing: logger.info("Wait start................")
                    signal.wait()
                    if debugTracing: logger.info("Wait end................")
                shouldUpdate = False
                TmpTargetPaths = []
                for TargetPath in TargetPaths:
                    TmpTargetPaths.append(os.path.dirname(TargetPath))
                TargetPaths = []
                TmpTargetPaths = list(set(TmpTargetPaths))
            if TmpTargetPaths != []:
                logger.info(f"Triggering stash scan for path(s) {TmpTargetPaths}")
                if not DRY_RUN:
                    stash.metadata_scan(paths=TmpTargetPaths)
                if RUN_CLEAN_AFTER_DELETE and RunCleanMetadata:
                    stash.metadata_clean(paths=TmpTargetPaths, dry_run=DRY_RUN)
                if RUN_GENERATE_CONTENT:
                    stash.metadata_generate()
                if gettingCalledAsStashPlugin and shm_buffer[0] == CONTINUE_RUNNING_SIG:
                    stash.run_plugin_task(plugin_id=PLUGIN_ID, task_name="Start Library Monitor")
                    if debugTracing: logger.info("Exiting plugin so that metadata_scan task can run.")
                    return
            else:
                if debugTracing: logger.info("Nothing to scan.")
            if shm_buffer[0] != CONTINUE_RUNNING_SIG:
                logger.info(f"Exiting Change File Monitor. (shm_buffer[0]={shm_buffer[0]})")
                shm_a.close()
                shm_a.unlink()  # Call unlink only once to release the shared memory
                raise KeyboardInterrupt
    except KeyboardInterrupt:
        observer.stop()
        if debugTracing: logger.info("Stopping observer................")
    observer.join()
    if debugTracing: logger.info("Exiting function................")

# This function is only useful when called outside of Stash. 
#       Example: python changefilemonitor.py stop
# Stops monitoring after triggered by the next file change.
# ToDo: Add logic so it doesn't have to wait until the next file change
def stop_library_monitor():
    if debugTracing: logger.info("Opening shared memory map.")
    try:
        shm_a = shared_memory.SharedMemory(name="DavidMaisonaveAxter_ChangeFileMonitor", create=False, size=4)
    except:
        pass
        logger.info("Could not open shared memory map. Change File Monitor must not be running.")
        return
    type(shm_a.buf)
    shm_buffer = shm_a.buf
    len(shm_buffer)
    shm_buffer[0] = 123
    if debugTracing: logger.info(f"Shared memory map opended, and flag set to {shm_buffer[0]}")
    shm_a.close()
    shm_a.unlink()  # Call unlink only once to release the shared memory
    time.sleep(1)
    return
    
if stopLibraryMonitoring:
    stop_library_monitor()
    if debugTracing: logger.info(f"stop_library_monitor EXIT................")
elif PLUGIN_ARGS_MODE == "start_library_monitor" or not gettingCalledAsStashPlugin:
    start_library_monitor()
    if debugTracing: logger.info(f"start_library_monitor EXIT................")
else:
    logger.info(f"Nothing to do!!! (PLUGIN_ARGS_MODE={PLUGIN_ARGS_MODE})")

if debugTracing: logger.info("\n*********************************\nEXITING   ***********************\n*********************************")
