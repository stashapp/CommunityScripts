# FileMonitor: Ver 0.9.0 (By David Maisonave)
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
	# To create a daily task, include each day of the week for the weekday field or "every"
	# Optional field for task "Auto Tag" is 'paths'. For detail usage, see example #A3: in filemonitor_task_examples.py
	{"task" : "Auto Tag",           "weekday" : "monday,tuesday,wednesday,thursday,friday,saturday,sunday",  "time" : "05:00"},  # Auto Tag -> [Auto Tag] (Daily at 6AM)
	# Task "Create Tags" is a plugin task. Optional fields are taskName and validateDir field. For detail usage, see examples #B1, #B2, #B3, and #B4 in filemonitor_task_examples.py
	{"task" : "pathParser", "taskName" : "Create Tags",  "validateDir" : "pathParser",  
				"weekday" : "every",             "time" : "05:30"}, # [Plugin Tasks] - > [Path Parser] -> [Create Tags]  (Daily at 5AM) : This task requires plugin [Path Parser]
	# The following task runs plugin DupFileManager (tag_duplicates_task) if the plugin is installed. The task runs in the background because of "taskQue" : False
	{"task" : "DupFileManager", "taskMode" : "tag_duplicates_task",  "validateDir" : "DupFileManager",  "taskQue" : False,
				"weekday" : "every",   "time" : "02:30"}, # [Plugin Tasks] -> DupFileManager -> [Delete Duplicates] (Daily at 2:30AM)
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
	# The following task requires plugin DupFileManager and UI option [Delete Duplicate Scheduler] enabled.
	{"task" : "DupFileManager", "taskName" : "Delete Duplicates",  "validateDir" : "DupFileManager",  
										"weekday" : "sunday",  "time" : "02:00", "monthly" : 2}, # [Plugin Tasks] -> DupFileManager -> [Delete Duplicates] 2nd sunday of the month at 2AM (02:00)     
	
	# The [CheckStashIsRunning] task checks if Stash is running. If not running, it will start up stash. 
	# This task only works if FileMonitor is started as a service or in command line mode.
	# Optional fields are 'command' and 'RunAfter'. For detail usage, see examples #C1 and #C2 in filemonitor_task_examples.py
	{"task" : "CheckStashIsRunning",    "minutes" :5}, # Checks every 5 minutes
],
````
- To add plugins to the task list, use the Plugin-ID in the "task" field. The plugin ID is usually the file name of the script without the extension.
  - Plugin task have the following optional fields: taskName, taskMode, validateDir, and taskQue
    - The **validateDir** field can be used to define the plugin sub directory, which is checked to see if it exist before running the task.
    - **taskName** field is used to name the task to call for the associated plugin. It can not be used with "taskQue":False
    - **taskQue** field is used to call the plugin without using the Task Queue. I.E. "taskQue":False. When this field is set to False, the taskName field can NOT be used.  Instead use taskMode to identify the task to call.
    - **taskMode** field is used in order to run the plugin without using the Task Queue. The plugin runs immediatly. Be careful not to confuse taskMode with taskName. Look in the plugin *.yml file under the **tasks** section where it defines both the task-name and the task-mode.
- Task can be scheduled to run monthly, weekly, hourly, and by minutes.
- The scheduler list uses two types of syntax. One is **weekday** based, and the other is **frequency** based.
  - **weekday Based**
    - Use the weekday based syntax for daily, weekly, and monthly schedules.
    - All the weekday based methods must have a **weekday** field and a **time** field, which specifies the day(s) of the week and the time to start the task.
    - **Daily**:
      - A daily task populates the weekday field with all the days of the week or with keyword **every**.
      - **Daily Example**:
        - Starts a task daily at 6AM.
          - `{"task" : "Optimise Database",   "weekday" : "monday,tuesday,wednesday,thursday,friday,saturday,sunday",   "time" : "06:00"},`
        - Starts a task daily at 2PM.
          - `{"task" : "Optimise Database",   "weekday" : "every",   "time" : "14:00"},`
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

