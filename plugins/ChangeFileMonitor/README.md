# ChangeFileMonitor: Ver 0.1.0 (By David Maisonave)
ChangeFileMonitor is a [Stash](https://github.com/stashapp/stash) plugin which updates Stash if any changes occurs in the Stash library paths.

### Using ChangeFileMonitor as a plugin
- To start monitoring file changes, go to **Stash->Settings->Task->[Plugin Tasks]->ChangeFileMonitor**, and click on the [Start Library Monitor] button.
  - ![ChangeFileMonitor_Task](https://github.com/user-attachments/assets/f275a70f-8e86-42a4-b2c1-98b3f4935334)
- To stop this task, go to **Stash->Settings->Task->[Task Queue]**, and click on the **[x]**.
  - ![Kill_ChangeFileMonitor_Task](https://github.com/user-attachments/assets/a3f4abca-f3a2-49fa-9db5-e0c733e0aeb1)

### Using ChangeFileMonitor as a script
**ChangeFileMonitor** can be called as a standalone script.
- To start monitoring call the script and pass any argument.
  - python changefilemonitor.py **foofoo**
- To stop **ChangeFileMonitor**, pass argument **stop**.
  - python changefilemonitor.py **stop**
  - After running above command line, **ChangeFileMonitor** will stop after the next file change occurs.
  - The stop command works to stop the standalone job and the Stash plugin task job.

### Requirements
`pip install stashapp-tools`
`pip install pyYAML`
`pip install watchdog`

### Installation
- Follow **Requirements** instructions.
- In the stash plugin directory (C:\Users\MyUserName\.stash\plugins), create a folder named **ChangeFileMonitor**.
- Copy all the plugin files to this folder.(**C:\Users\MyUserName\\.stash\plugins\ChangeFileMonitor**).
- Restart Stash.

That's it!!!

### Options
- All options are accessible in the GUI via Settings->Plugins->Plugins->[ChangeFileMonitor].


