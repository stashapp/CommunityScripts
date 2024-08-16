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
    # Note: The hour section in time MUST be a two digit number, and use military time format. Example: 1PM = "13:00" and 1AM = "01:00"
    "task_scheduler": [
         # To create a daily task, include each day of the week for the weekday field.
        {"task" : "Auto Tag",           "weekday" : "monday,tuesday,wednesday,thursday,friday,saturday,sunday",  "time" : "06:00"},  # Auto Tag -> [Auto Tag] (Daily at 6AM)
        {"task" : "Optimise Database",  "weekday" : "monday,tuesday,wednesday,thursday,friday,saturday,sunday",  "time" : "07:00"},  # Maintenance -> [Optimise Database] (Daily at 7AM)
        {"task" : "Create Tags", "pluginId" : "pathParser",  "validateDir" : "pathParser",  "weekday" : "monday,tuesday,wednesday,thursday,friday,saturday,sunday",  "time" : "05:00"}, # [Plugin Tasks] - > [Path Parser] -> [Create Tags]  (Daily at 5AM) : This task requires plugin [Path Parser]
        
        # The following tasks are scheduled for 3 days out of the week.
        {"task" : "Clean",                  "weekday" : "monday,wednesday,friday",  "time" : "08:00"},  # Maintenance -> [Clean] (3 days per week at 8AM)
        {"task" : "Clean Generated Files",  "weekday" : "tuesday,thursday,saturday",  "time" : "08:00"},  # Maintenance -> [Clean Generated Files] (3 days per week at 8AM)
        
        # The following tasks are scheduled weekly
        {"task" : "Generate",   "weekday" : "sunday",   "time" : "07:00"}, # Generated Content-> [Generate] (Every Sunday at 7AM)
        {"task" : "Scan",       "weekday" : "sunday",   "time" : "03:00"}, # Library -> [Scan] (Weekly) (Every Sunday at 3AM)
        
        # To perform a task monthly, specify the day of the month as in the weekly schedule format, and add a monthly field.
            # The monthly field value must be 1, 2, 3, or 4.
                # 1 = 1st specified weekday of the month. Example 1st monday.
                # 2 = 2nd specified weekday of the month. Example 2nd monday of the month.
                # 3 = 3rd specified weekday of the month.
                # 4 = 4th specified weekday of the month.
        # The following task is scheduled monthly
        {"task" : "Backup",     "weekday" : "sunday",   "time" : "01:00", "monthly" : 2}, # Backup -> [Backup] 2nd sunday of the month at 1AM (01:00)        
        
        # Example#A1: Task to call call_GQL API with custom input
        {"task" : "GQL", "input" : "mutation OptimiseDatabase { optimiseDatabase }", "weekday" : "sunday",   "time" : "DISABLED"}, # To enable, change "DISABLED" to valid time
        
        # Example#A2: Task to call a python script. When this task is executed, the keyword <plugin_path> is replaced by filemonitor.py current directory.
        #           The args field is NOT required.
        {"task" : "python", "script" : "<plugin_path>test_script_hello_world.py", "args" : "--MyArguments Hello", "weekday" : "monday",   "time" : "DISABLED"}, # change "DISABLED" to valid time
        
        # Example#A3: The following task types can optionally take a [paths] field. If the paths field does not exists, the paths in the Stash library is used.
        {"task" : "Scan",       "paths" : [r"E:\MyVideos\downloads", r"V:\MyOtherVideos"],   "weekday" : "sunday",   "time" : "DISABLED"}, # Library -> [Scan]
        {"task" : "Auto Tag",   "paths" : [r"E:\MyVideos\downloads", r"V:\MyOtherVideos"],   "weekday" : "monday,tuesday,wednesday,thursday,friday,saturday,sunday",  "time" : "DISABLED"},  # Auto Tag -> [Auto Tag]
        {"task" : "Clean",      "paths" : ["E:\\MyVideos\\downloads", "V:\\MyOtherVideos"],   "weekday" : "sunday",   "time" : "DISABLED"}, # Generated Content-> [Generate]
        
        # Example#A4: Task which calls Migrations -> [Rename generated files]
        {"task" : "RenameGeneratedFiles",       "weekday" : "tuesday,thursday",   "time" : "DISABLED"}, # (bi-weekly) example
        
        # Example#A5: The Backup task using optional field maxBackup, which overrides the UI [Max DB Backups] value
        {"task" : "Backup", "maxBackup" : 12,   "weekday" : "sunday",   "time" : "DISABLED"}, # Trim the DB backup files down to 12 backup files.
        {"task" : "Backup", "maxBackup" : 0,    "weekday" : "sunday",   "time" : "DISABLED"}, # When used with a zero value, it will make sure no file trimming will occur no matter the value of the UI [Max DB Backups]
        
        # The above weekday method is the more reliable method to schedule task, because it doesn't rely on FileMonitor running continuously (non-stop).
        
        # The below examples use frequency field method which can work with minutes and hours. A zero frequency value disables the task.
        #       Note:   Both seconds and days are also supported for the frequency field. 
        #               However, seconds is mainly used for test purposes.
        #               And days usage is discourage, because it only works if FileMonitor is running for X many days non-stop.
        # The below example tasks are done using hours and minutes, however any of these task types can be converted to a daily, weekly, or monthly syntax.
                       
        # Example#B1: The following task is the syntax used for a plugin. A plugin task requires the plugin name for the [task] field, and the plugin-ID for the [pluginId] field.
        {"task" : "PluginButtonName_Here", "pluginId" : "PluginId_Here", "hours" : 0}, # The zero frequency value makes this task disabled.
        # Example#B2: Optionally, the validateDir field can be included which is used to validate that the plugin is installed either under the plugins folder or under the plugins-community folder.
        {"task" : "PluginButtonName_Here", "pluginId" : "PluginId_Here",  "validateDir" : "UsuallySameAsPluginID", "hours" : 0}, # The zero frequency value makes this task disabled.
        
        # Example#B3: Task to execute a command
        {"task" : "execute", "command" : "C:\\MyPath\\HelloWorld.bat", "hours" : 0},
        
        # Example#B4: Task to execute a command with optional args field, and using keyword <plugin_path>, which gets replaced with filemonitor.py current directory.
        {"task" : "execute", "command" : "<plugin_path>HelloWorld.cmd", "args" : "--name David", "minutes" : 0},
        
        # Comment out **test** tasks.
        # To run test, enable all task, and start FileMonitor as a service.
        # When executed, these task should be seen in the Task Queue unless otherwise stated in comments.
        # These tasks are usually executed before updating major releases on https://github.com/David-Maisonave/Axter-Stash/blob/main/plugins/FileMonitor
        # These tasks are ALWAYS executed before updating to https://github.com/stashapp/CommunityScripts
        # MUST ToDo: Always comment out below test task before checking in this code!!!
        # {"task" : "TestBadTaskNameError",                       "minutes" : 1}, # Test invalid task name
        # {"task" : "execute",                                    "minutes" : 1}, # Test invalid task (missing command)
        # {"task" : "python",                                     "minutes" : 1}, # Test invalid task (missing scripts)
        # {"task" : "PluginWithOutID",                            "minutes" : 1}, # Test invalid task (missing pluginId)
        # {"task" : "execute", "command" : "",                    "minutes" : 1}, # Test invalid task (missing command)
        # {"task" : "python", "script" : "",                      "minutes" : 1}, # Test invalid task (missing scripts)
        # {"task" : "PluginWithOutID", "pluginId" : "",           "minutes" : 1}, # Test invalid task (missing pluginId)
        # {"task" : "Foo","pluginId":"foo","validateDir":"foo",   "minutes" : 1}, # Test invalid task (missing plugin directory)
        # {"task" : "Generate",                                                                           "weekday" : "friday",   "time" : "12:03"},
        # {"task" : "Clean",                                                                              "weekday" : "friday",   "time" : "12:03"},
        # {"task" : "Auto Tag",                                                                           "weekday" : "friday",   "time" : "12:03"},
        # {"task" : "Optimise Database",                                                                  "weekday" : "friday",   "time" : "12:03"},
        # {"task" : "Create Tags", "pluginId" : "pathParser",  "validateDir" : "pathParser",              "weekday" : "friday",   "time" : "12:03"}, # In task queue as -> Running plugin task: Create Tags
        # {"task" : "Scan","paths": [r"B:\_\SpecialSet", r"C:\foo"],                                      "weekday" : "friday",   "time" : "12:03"},
        # {"task" : "GQL", "input" : "mutation OptimiseDatabase { optimiseDatabase }",                    "weekday" : "friday",   "time" : "12:03"}, # In task queue as -> Optimising database...
        # {"task" : "Clean Generated Files",                                                              "weekday" : "friday",   "time" : "12:03"},
        # {"task" : "RenameGeneratedFiles",                                                               "weekday" : "friday",   "time" : "12:03"}, # In task queue as -> Migrating scene hashes...
        # {"task" : "Backup", "maxBackups" : 0,                                                           "weekday" : "friday",   "time" : "12:03"}, # Does NOT show up in the Task Queue. Must check STASH log file to verify run.
        # {"task" : "python", "script" : "<plugin_path>test_hello_world2.py",                             "weekday" : "friday",   "time" : "12:03"}, # Does NOT show up in the Task Queue. Check FileMonitor log file, and look for -> Task 'python' result=???
        # {"task" : "python", "script" : "<plugin_path>test_hello_world.py", "detach" : False,            "weekday" : "friday",   "time" : "12:03"}, # Does NOT show up in the Task Queue. Check FileMonitor log file, and look for -> Task 'python' result=???
        # {"task" : "execute", "command" : "<plugin_path>test_hello_world2.cmd",                          "weekday" : "friday",   "time" : "12:03"}, # Does NOT show up in the Task Queue. Check FileMonitor log file, and look for -> Task 'execute' result=???
        # {"task" : "execute", "command" : "<plugin_path>test_hello_world.bat", "args" : "--name David",  "weekday" : "friday",   "time" : "12:03"}, # Does NOT show up in the Task Queue. Check FileMonitor log file, and look for -> Task 'execute' result=???
    ],
    
    # Timeout in seconds. This is how often FileMonitor will check the scheduler and (in-plugin mode) check if another job (Task) is in the queue.
    "timeOut": 60,
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
    
    # The following fields are ONLY used when running FileMonitor in script mode.
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
