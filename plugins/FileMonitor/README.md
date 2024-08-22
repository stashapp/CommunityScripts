# FileMonitor: Ver 0.8.7 (By David Maisonave)
FileMonitor is a [Stash](https://github.com/stashapp/stash) plugin with the following two main features:
- Updates Stash when any file changes occurs in the Stash library.
- **Task Scheduler**: Runs scheduled task based on the scheduler configuration in **filemonitor_config.py**.

## Starting FileMonitor from the UI
From the GUI, FileMonitor can be started as a service or as a plugin. The recommended method is to start it as a service. When started as a service, it will jump on the Task Queue momentarily, and then disappear as it starts running in the background.
- To start monitoring file changes, go to **Stash->Settings->Task->[Plugin Tasks]->FileMonitor**, and click on the [Start Library Monitor Service] button.
  - ![FileMonitorService](https://github.com/user-attachments/assets/b12aeca9-37a8-447f-90da-26e9440735ad)
  - **Important Note**: At first, this will show up as a plugin in the Task Queue momentarily. It will then disappear from the Task Queue and run in the background as a service.
- To stop FileMonitor click on [Stop Library Monitor] button.
- The **[Monitor as a Plugin]** option is mainly available for backwards compatibility and for test purposes.
  

## Using FileMonitor as a script
**FileMonitor** can be called as a standalone script.
- To start monitoring call the script and pass --url and the Stash URL.
  - python filemonitor.py --url http://localhost:9999
- To stop **FileMonitor**, pass argument **--stop**.
  - python filemonitor.py **--stop**
  - The stop command works to stop the standalone job and the Stash plugin task job.
- To restart **FileMonitor**, pass argument **--restart**.
  - python filemonitor.py **--restart**
  - The restart command restarts FileMonitor as a Task in Stash.

# Task Scheduler
To enable the scheduler go to **Stash->Settings->Plugins->Plugins->FileMonitor** and enable the **Scheduler** option.
![ReoccurringTaskScheduler](https://github.com/user-attachments/assets/5a7bf6a4-3bd6-4692-a6c3-e9f8f4664f14)

- **Warning:** The below task are already preconfigured in the scheduler, and when the scheduler is enabled all these task are enabled.
  - Auto Tag -> [Auto Tag] (Daily)
  - Maintenance -> [Clean] (every 2 days)
  - Maintenance -> [Clean Generated Files] (every 2 days)
  - Maintenance -> [Optimise Database] (Daily)
  - Generated Content-> [Generate] (Every Sunday at 7AM)
  - Library -> [Scan] (Weekly) (Every Sunday at 3AM)
  - Backup -> [Backup] 2nd sunday of the month at 1AM
- The example tasks are disabled by default because they either have a zero frequency value or the time field is set to **DISABLED**.

To configure the schedule or to add new task, edit the **task_scheduler** section in the **filemonitor_config.py** file.
```` python
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
],
````
- To add plugins to the task list, both the Plugin-ID and the plugin name is required. The plugin ID is usually the file name of the script without the extension.
  - For plugin task, optionally **validateDir** field can be included that defines the plugin sub directory, which is checked to see if it exist before running the task.
- Task can be scheduled to run monthly, weekly, hourly, and by minutes.
- The scheduler list uses two types of syntax. One is **weekday** based, and the other is **frequency** based.
  - **weekday Based**
    - Use the weekday based syntax for daily, weekly, and monthly schedules.
    - All the weekday based methods must have a **weekday** field and a **time** field, which specifies the day(s) of the week and the time to start the task.
    - **Daily**:
      - A daily task populates the weekday field with all the days of the week.
      - **Daily Example**:
        - Starts a task daily at 6AM.
          - `{"task" : "Optimise Database",   "weekday" : "monday,tuesday,wednesday,thursday,friday,saturday,sunday",   "time" : "06:00"},`
    - **Weekly**:
      - **Weekly Example**:
        - Starts a task weekly every monday and 9AM.
          - `{"task" : "Generate",   "weekday" : "monday",   "time" : "09:00"},`
    - **Monthly**:
      - The monthly syntax is similar to the weekly format, but it also includes a **"monthly"** field which must be set to 1, 2, 3, or 4.
      - **Monthly Examples**:
        - Starts a task once a month on the 3rd sunday of the month and at 1AM.
          - `{"task" : "Backup",     "weekday" : "sunday",   "time" : "01:00", "monthly" : 3},`
        - Starts a task at 2PM once a month on the 1st saturday of the month.
          - `{"task" : "Clean",     "weekday" : "saturday",   "time" : "14:00", "monthly" : 1},`

  - **Frequency Based**
    - The frequency field can be in **minutes** or **hours**.
    - The frequency value must be a number greater than zero. A frequency value of zero will disable the task on the schedule.
    - **Frequency Based Examples**:
      - Starts a task every 24 hours.
        - `{"task" : "Auto Tag",   "hours" : 24},`
      - Starts a (**plugin**) task every 30 minutes.
        - `{"task" : "Create Tags", "pluginId" : "pathParser", "minutes" : 30},`
    - The frequency field does support **days** and **seconds**.
      - **seconds** is mainly used for test purposes.
      - The use of **days** is discourage, because it only works if FileMonitor is running for X many days non-stop.
        - For example, if days is used with 30 days, FileMonitor would have to be running non-stop for 30 days before the task is activated. If it's restarted at any time during the 30 days, the count down restarts.
        - It's recommended to use weekday based syntax over using days, because many restarts can occur during the week or month, and the task will still get started as long as FileMonitor is running during the scheduled activation time.

- The scheduler feature requires `pip install schedule`
  - If the user leaves the scheduler disabled, **schedule** does NOT have to be installed.
- For best results use the scheduler with FileMonitor running as a service.

## Requirements
- pip install -r requirements.txt
- Or manually install each requirement:
  - `pip install stashapp-tools --upgrade`
  - `pip install pyYAML`
  - `pip install watchdog`
  - `pip install schedule`

## Installation
- Follow **Requirements** instructions.
- In the stash plugin directory (C:\Users\MyUserName\.stash\plugins), create a folder named **FileMonitor**.
- Copy all the plugin files to this folder.(**C:\Users\MyUserName\\.stash\plugins\FileMonitor**).
- Click the **[Reload Plugins]** button in Stash->Settings->Plugins->Plugins.

That's it!!!

## Options
- Main options are accessible in the GUI via Settings->Plugins->Plugins->[FileMonitor].
  - When the UI option [Max DB Backups] is set to a value greater than 1, and when the scheduler is enabled, the quantity of database backup files are trim down to the set [**Max DB Backups**] value after the scheduler executes the Backup task.
  - The other options are self explanatory from the UI.
- Additional options available in filemonitor_config.py. The options are well documented in the commented code.

## Bugs and Feature Request
Please use the following link to report FileMonitor bugs:
[FileMonitor Bug Report](https://github.com/David-Maisonave/Axter-Stash/issues/new?assignees=&labels=Plugin_Bug&projects=&template=bug_report_plugin.yml&title=%F0%9F%AA%B2%5BFileMonitor%5D+Your_Short_title)

Please use the following link to report FileMonitor Feature Request:[FileMonitor Feature Reques](https://github.com/David-Maisonave/Axter-Stash/issues/new?assignees=&labels=Enhancement&projects=&template=feature_request_plugin.yml&title=%F0%9F%92%A1%EF%B8%8F%5BEnhancement%5D%3A%5BFileMonitor%5D+Your_Short_title)

Please do **NOT** use the feature request to include any problems associated with errors. Instead use the bug report for error issues.

