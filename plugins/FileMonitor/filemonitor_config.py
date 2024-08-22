# Description: This is a Stash plugin which updates Stash if any changes occurs in the Stash library paths.
# By David Maisonave (aka Axter) Jul-2024 (https://www.axter.com/)
# Get the latest developers version from following link: https://github.com/David-Maisonave/Axter-Stash/tree/main/plugins/FileMonitor
config = {
    # The task scheduler list.
    # Task can be scheduled to run monthly, weekly, daily, hourly, and by minutes. For best results use the scheduler with FileMonitor running as a service.
    # For daily, weekly, and monthly task, use the weekday syntax.
    #   The [Auto Tag] task is an example of a daily scheduled task.
    #   The [Generate] task is an example of a weekly scheduled task.
    #   The [Backup] task is an example of a monthly scheduled task.
    #   The hour section in time MUST be a two digit number, and use military time format. Example: 1PM = "13:00" and 1AM = "01:00"
    # Note: Look at filemonitor_task_examples.py for many example task having more detailed usage.
    "task_scheduler": [
        # To create a daily task, include each day of the week for the weekday field.
        # Optional field for task "Auto Tag" is 'paths'. For detail usage, see example #A3: in filemonitor_task_examples.py
        {"task" : "Auto Tag",           "weekday" : "monday,tuesday,wednesday,thursday,friday,saturday,sunday",  "time" : "05:00"},  # Auto Tag -> [Auto Tag] (Daily at 6AM)
        # Task "Create Tags" is a plugin task. All plugin task have a REQUIRED  pluginId field and an optional validateDir field. For detail usage, see examples #B1 and #B2 in filemonitor_task_examples.py
        {"task" : "Create Tags", "pluginId" : "pathParser",  "validateDir" : "pathParser",  
            "weekday" : "monday,tuesday,wednesday,thursday,friday,saturday,sunday",             "time" : "05:30"}, # [Plugin Tasks] - > [Path Parser] -> [Create Tags]  (Daily at 5AM) : This task requires plugin [Path Parser]
        {"task" : "Optimise Database",  "weekday" : "monday,tuesday,wednesday,thursday,friday", "time" : "07:00"},  # Maintenance -> [Optimise Database] (Every weekday at 7AM)
        
        # The following tasks are scheduled weekly
        # Optional field for task "Scan", "Auto Tag", and "Clean" is 'paths'. For detail usage, see examples #A3: in filemonitor_task_examples.py
        {"task" : "Scan",                   "weekday" : "saturday",   "time" : "03:00"}, # Library -> [Scan] (Weekly) (Every saturday at 3AM)
        {"task" : "Auto Tag",               "weekday" : "saturday",   "time" : "03:30"}, # Auto Tag -> [Auto Tag] (Weekly) (Every saturday at 3:30AM)
        {"task" : "Generate",               "weekday" : "saturday",   "time" : "04:00"}, # Generated Content-> [Generate] (Every saturday at 4AM)
        {"task" : "Clean",                  "weekday" : "saturday",   "time" : "04:30"}, # Maintenance -> [Clean] (Every saturday at 4:30AM)
        {"task" : "Clean Generated Files",  "weekday" : "saturday",   "time" : "05:00"}, # Maintenance -> [Clean Generated Files] (Every saturday at 5AM)
        {"task" : "Optimise Database",      "weekday" : "saturday",   "time" : "05:30"}, # Maintenance -> [Optimise Database] (Every saturday at 5:30AM)
        
        # To perform a task monthly, specify the day of the month as in the weekly schedule format, and add a monthly field.
            # The monthly field value must be 1, 2, 3, or 4.
                # 1 = 1st specified weekday of the month. Example 1st monday.
                # 2 = 2nd specified weekday of the month. Example 2nd monday of the month.
                # 3 = 3rd specified weekday of the month.
                # 4 = 4th specified weekday of the month.
        # The Backup task is scheduled monthly
        # Optional field for task "Backup" is maxBackup. For detail usage, see example #A5 in filemonitor_task_examples.py
        {"task" : "Backup",                 "weekday" : "sunday",  "time" : "01:00", "monthly" : 2}, # Backup -> [Backup] 2nd sunday of the month at 1AM (01:00)        
        
        # The [CheckStashIsRunning] task checks if Stash is running. If not running, it will start up stash. 
        # This task only works if FileMonitor is started as a service or in command line mode.
        # Optional fields are 'command' and 'RunAfter'. For detail usage, see examples #C1 and #C2 in filemonitor_task_examples.py
        {"task" : "CheckStashIsRunning",    "minutes" :5}, # Checks every 5 minutes
    ],
    
    # Timeout in seconds. This is how often FileMonitor will check the scheduler and (in-plugin mode) check if another job (Task) is in the queue.
    "timeOut": 60,
    # Timeout in seconds for delay processing of path scan jobs. This value should always be smaller than timeOut
    "timeOutDelayProcess": 3,
    # Maximum time to wait for a scan job to complete. Need this incase Stash gets restarted in the middle of a scan job.
    "maxWaitTimeJobFinish": 30 * 60, # Wait 30 minutes max
    
    # ApiKey only needed when Stash credentials are set and while calling FileMonitor via command line.
    "apiKey" : "", # Example: "eyJabccideJIUfg1NigRInD345I6dfpXVCfd.eyJ1abcDEfGheHRlHJiJklMonPQ32FsVewtsfSIsImlhdCI6MTcyMzg2NzkwOH0.5bkHU6sfs3532dsryu1ki3iFBwnd_4AHs325yHljsPw"
    # Enable to run metadata clean task after file deletion.
    "runCleanAfterDelete": False,
    # Enable to run metadata_generate (Generate Content) after metadata scan.
    "runGenerateContent": False,
    
    # When populated (comma separated list [lower-case]), only scan for changes for specified file extension
    "fileExtTypes" : "", # Example: "mp4,mpg,mpeg,m2ts,wmv,avi,m4v,flv,mov,asf,mkv,divx,webm,ts,mp2t"
    # When populated, only include file changes in specified paths.
    "includePathChanges" :[], # Example: ["C:\\MyVideos", "C:\\MyImages"]
    # When populated, exclude file changes in paths that start with specified entries.
    "excludePathChanges" :[], # Example: ["C:\\MyVideos\\SomeSubFolder\\", "C:\\MyImages\\folder\\Sub\\"]
    
    # The following fields are ONLY used when running FileMonitor in command line mode.
    "endpoint_Scheme" : "http", # Define endpoint to use when contacting the Stash server
    "endpoint_Host" : "0.0.0.0", # Define endpoint to use when contacting the Stash server
    "endpoint_Port" : 9999, # Define endpoint to use when contacting the Stash server
    
    # The following are advanced user options.
    # Enable to run scan when triggered by on_any_event.
    "onAnyEvent": False, # If enabled may cause excessive triggers.
    # Enable to monitor changes in file system for modification flag. This option is NOT needed for Windows, because on Windows changes are triggered via CREATE, DELETE, and MOVE flags. Other OS may differ.
    "scanModified": False, # Warning: Enabling this in Windows OS may cause excessive triggers when user is only viewing directory content.
    # Enable to exit FileMonitor by creating special file in plugin folder\working
    "createSpecFileToExit": True,
    # Enable to delete special file immediately after it's created in stop process.
    "deleteSpecFileInStop": False,
    
    # Below are place holders for **possible** future features.
    # !!! Not yet implemented !!!
    # When enabled, if CREATE flag is triggered, DupFileManager task is called if the plugin is installed.
    "onCreateCallDupFileManager": False, # Not yet implemented!!!!
    # !!! Not yet implemented !!!    
}
