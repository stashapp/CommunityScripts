##### This page was added starting on version 1.0.0 to keep track of newly added features between versions.

### 1.0.0

- Added Tools-UI option to get FileMonitor running status.
- Added Stash toolbar icon to get FileMonitor running status.

### 1.0.1

- Added Docker support.

### 1.0.2

- Added ability to monitor host file system for multiple Docker Stash installations.

### 1.0.3

- Added start and stop FileMonitor button to Tools-UI FileMonitor Status
- Fixed bug associated with starting FileMonitor service with no jobs waiting.

### 1.0.4

- Added ping Docker GQL check before attempting to monitor Stash Dockers
- Uploaded missing filemonitor.js to CommunityScripts

### 1.0.5

- Fixed bug associated with library cleaning

### 1.0.8

- Fixed bug on macOS where "Start Library Monitor Service" always failed: the shared-memory name used as the service's running/singleton lock exceeded macOS's POSIX shm_open name length limit (OSError "File name too long"), which was being swallowed and misreported as "FileMonitor must already be running". Shortened the name and surfaced the real exception in the error message.
- Hardened detached process launches (used by the service start, and shared with DupFileManager/RenameFile) to put the child in its own session via `start_new_session=True`, so it isn't torn down when the launching task process exits.
