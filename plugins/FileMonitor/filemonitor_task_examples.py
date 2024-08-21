# Below are example tasks.
# They are all disabled by default, by having zero value for time frequency, or by having "DISABLED" set for the time field.
# To enable these tasks, set the frequency or the time value to a valid frequency or time stamp.
task_examples = {
    "task_scheduler": [
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
        
        # Example#C1 Some OS may need the "command" field, which specifies the binary path.
        {"task" : "CheckStashIsRunning",    "command" : "<stash_path>stash-linux-arm64v8",                          "minutes" :0},
        # Example#C2 RunAfter field can be used to specify task to run after starting Stash
        {"task" : "CheckStashIsRunning", "RunAfter" : [{"task" : "Scan"},{"task" : "Backup", "maxBackup" : 0},{"task" : "Clean"}],   "minutes" :0},        
    ],
}
