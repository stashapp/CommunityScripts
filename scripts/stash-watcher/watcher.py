#!/usr/bin/python -w
import argparse
import configparser
import time
import os
from threading import Lock, Condition
from watchdog.observers import Observer
from watchdog.observers.polling import PollingObserver
from watchdog.events import PatternMatchingEventHandler
from stashapi.stashapp import StashInterface
import logging
import sys
from enum import Enum

# the type of watcher being used; controls how to interpret the events
WatcherType = Enum("WatcherType", ["INOTIFY", "WINDOWS", "POLLING", "KQUEUE"])

# Setup logger
logger = logging.getLogger("stash-watcher")
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setLevel(logging.INFO)
ch.setFormatter(logging.Formatter("%(asctime)s %(message)s"))
logger.addHandler(ch)

# This signals that we should
shouldUpdate = False
mutex = Lock()
signal = Condition(mutex)

modifiedFiles = {}


currentWatcherType = None


def log(msg):
    logger.info(msg)


def debug(msg):
    logger.debug(msg)


def handleEvent(event):
    global shouldUpdate
    global currentWatcherType
    debug("========EVENT========")
    debug(str(event))
    # log(modifiedFiles)
    # Record if the file was modified.  When a file is closed, see if it was modified.  If so, trigger
    shouldTrigger = False

    if event.is_directory == True:
        return
    # Depending on the watcher type, we have to handle these events differently
    if currentWatcherType == WatcherType.WINDOWS:
        # On windows here's what happens:
        # File moved into a watched directory - Created Event
        # File moved out of a watched directory - Deleted Event
        # Moved within a watched directory (src and dst in watched directory) - Moved event

        # echo blah > foo.mp4 - Created then Modified
        # copying a small file - Created then Modified
        # copying a large file - Created then two (or more) Modified events (appears to be one when the file is created and another when it's finished)

        # It looks like you can get an optional Created Event and then
        # either one or two Modified events.  You can also get Moved events

        # For local files on Windows, they can't be opened if they're currently
        # being written to.  Therefore, every time we get an event, attempt to
        # open the file.  If we're successful, assume the write is finished and
        # trigger the update.  Otherwise wait until the next event and try again
        if event.event_type == "created" or event.event_type == "modified":
            try:
                with open(event.src_path) as file:
                    debug("Successfully opened file; triggering")
                    shouldTrigger = True
            except:
                pass

        if event.event_type == "moved":
            shouldTrigger = True
    elif currentWatcherType == WatcherType.POLLING:
        # Every interval you get 1 event per changed file
        #  - If the file was not present in the previous poll, then Created
        #  - If the file was present and has a new size, then Modified
        #  - If the file was moved within the directory, then Moved
        #  - If the file is gone, then deleted
        #
        # For now, just trigger on the created event.  In the future, create
        # a timer at 2x polling interval.  Reschedule the timer on each event
        # when it fires, trigger the update.
        if event.event_type == "moved" or event.event_type == "created":
            shouldTrigger = True
    # Until someone tests this on mac, just do what INOTIFY does
    elif (
        currentWatcherType == WatcherType.INOTIFY
        or currentWatcherType == WatcherType.KQUEUE
    ):
        if event.event_type == "modified":
            modifiedFiles[event.src_path] = 1
        # These are for files being copied into the target
        elif event.event_type == "closed":
            if event.src_path in modifiedFiles:
                del modifiedFiles[event.src_path]
                shouldTrigger = True
        # For download managers and the like that write to a temporary file and then move to the destination (real)
        # path.  Note that this actually triggers if the destination is in the watched location, and not just if it's
        # moved out of a watched directory
        elif event.event_type == "moved":
            shouldTrigger = True
    else:
        print("Unknown watcher type " + str(currentWatcherType))
        sys.exit(1)

    # Trigger the update
    if shouldTrigger:
        debug("Triggering updates")
        with mutex:
            shouldUpdate = True
            signal.notify()


def main(stash, scanFlags, paths, extensions, timeout, pollInterval):
    global shouldUpdate
    global currentWatcherType

    if len(extensions) == 1 and extensions[0] == "*":
        patterns = ["*"]
    else:
        patterns = list(map(lambda x: "*." + x, extensions))
    eventHandler = PatternMatchingEventHandler(patterns, None, False, True)
    eventHandler.on_any_event = handleEvent
    observer = Observer()
    observerName = type(observer).__name__
    if pollInterval != None and pollInterval > 0:
        currentWatcherType = WatcherType.POLLING
        observer = PollingObserver()
    elif observerName == "WindowsApiObserver":
        currentWatcherType = WatcherType.WINDOWS
    elif observerName == "KqueueObserver":
        currentWatcherType = WatcherType.KQUEUE
    elif observerName == "InotifyObserver":
        currentWatcherType = WatcherType.INOTIFY
    else:
        print("Unknown watcher type " + str(observer))
        sys.exit(1)

    debug(str(observer))
    for path in paths:
        observer.schedule(eventHandler, path, recursive=True)
    observer.start()
    try:
        while True:
            with mutex:
                while not shouldUpdate:
                    signal.wait()
                shouldUpdate = False
            log("Triggering stash scan")
            stash.metadata_scan(flags=scanFlags)
            log("Sleeping for " + str(timeout) + " seconds")
            time.sleep(timeout)
    except KeyboardInterrupt:
        observer.stop()
        observer.join()


def listConverter(item):
    debug("listConverter(" + str(item) + ")")
    if not item:
        return None
    listItems = [i.strip() for i in item.split(",")]
    if not listItems or (len(listItems) == 1 and not listItems[0]):
        return None
    return listItems


def makeArgParser():
    parser = argparse.ArgumentParser(description="Stash file watcher")
    parser.add_argument("config_path", nargs=1, help="Config file path (toml)")
    return parser


def parseConfig(path):
    config = configparser.ConfigParser(converters={"list": listConverter})

    # Load the defaults first
    defaults_path = os.path.join(os.path.dirname("__file__"), "defaults.toml")
    config.read(defaults_path)

    # Now read the user config
    config.read(path)

    return config


if __name__ == "__main__":
    # Parse the arguments
    parser = makeArgParser()
    args = parser.parse_args()
    configPath = args.config_path
    config = parseConfig(configPath)

    # Set up Stash
    stashArgs = {
        "scheme": config["Host"]["Scheme"],
        "host": config["Host"]["Host"],
        "port": config["Host"]["Port"],
    }

    if config["Host"]["ApiKey"]:
        stashArgs["ApiKey"] = config["Host"]["ApiKey"]

    stash = StashInterface(stashArgs)

    # And now the flags for the scan
    scanFlags = {
        "scanGenerateCovers": config["ScanOptions"].getboolean("Covers"),
        "scanGeneratePreviews": config["ScanOptions"].getboolean("Previews"),
        "scanGenerateImagePreviews": config["ScanOptions"].getboolean("ImagePreviews"),
        "scanGenerateSprites": config["ScanOptions"].getboolean("Sprites"),
        "scanGeneratePhashes": config["ScanOptions"].getboolean("Phashes"),
        "scanGenerateThumbnails": config["ScanOptions"].getboolean("Thumbnails"),
        "scanGenerateClipPreviews": config["ScanOptions"].getboolean("ClipPreviews"),
    }

    paths = config.getlist("Config", "Paths")
    timeout = config["Config"].getint("Cooldown")

    # If the extensions are in the config, use them.  Otherwise pull them from stash.
    extensions = config.getlist("Config", "Extensions")
    if not extensions:
        stashConfig = stash.get_configuration()
        extensions = (
            stashConfig["general"]["videoExtensions"]
            + stashConfig["general"]["imageExtensions"]
            + stashConfig["general"]["galleryExtensions"]
        )

    pollIntervalStr = config.get("Config", "PollInterval")
    if pollIntervalStr:
        pollInterval = int(pollIntervalStr)
    else:
        pollInterval = None

    if config.get("Config", "Debug") == "true":
        logger.setLevel(logging.DEBUG)
        ch.setLevel(logging.DEBUG)

    main(stash, scanFlags, paths, extensions, timeout, pollInterval)
