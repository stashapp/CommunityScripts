# Stash Watcher
Stash Watcher is a service that watches your Stash library directories for changes and then triggers a Metadata Scan when new files are added to those directories.  It then waits a period of time before triggering another scan to keep Stash from constantly scanning if you're making many changes.  Note that updates are watched during that window; the update is merely delayed.

## Configuration
Modify a [config.toml](config.toml) for your environment.  The defaults match the Stash docker defaults, so they may work for you.  You are likely to have to update `Paths` and possibly `ApiKey`.  Check out [default.toml](default.toml) for all configurable options.  You can configure:
* Url (host, domain, port)
* Api Key (if your Stash is password protected)
* Paths
* Timeout - the minimum time between Metadata Scans
* Scan options - The options for the Metadata Scan
* Enable Polling - see [SMB/CIFS Shares](#smbcifs-shares)

## Running Stash Watcher
You can run Stash Watcher directly from the [command line](#running-directly-with-python) or from inside [docker](#running-with-docker).  

### Running directly with python
The directs below are for linux, but they should work on other operating systems.
#### Step 0: Create a Virtual Environment (optional, but recommended)
```
python -m venv venv
. venv/bin/activate
```
#### Step 1: Install dependencies
```
pip install -r requirements.txt
```
#### Step 2: Create/Modify Configuration
Following the directions in [Configuration](#configuration), modify [config.toml](config.toml) if necessary.

#### Step 3: Execute 
```
python watcher.py path_to_config.toml
```
That's it.  Now when you make changes to watched directories, Stash Watcher will make an API call to trigger a metadata scan.

### Running with docker
There is currently no published docker image, so you'll have to build it yourself.  The easiest way to do this is with docker compose:
```
version: "3.4"
services:
  stash-watcher:
    container_name: stash-watcher
    build: <path_to_stash-watcher_directory>
    volumes:
      #This is only required if you have to modify config.toml (if the defaults are fine you don't have to map this file)
      - ./config.toml:/config.toml:ro
      #This is the path to your stash content.  If you have multiple paths, map them here
      - /stash:/data:ro
    restart: unless-stopped
```

Then you can run
```
docker compose up -d --build
```
To start the watcher.

## Notes
### SMB/CIFS shares
The library ([watchdog](https://pypi.org/project/watchdog/)) that Stash Watcher uses has some limitations when dealing with SMB/CIFS shares.  If you encounter some problems, set [PollInterval in your config.toml](https://github.com/DuctTape42/CommunityScripts/blob/main/scripts/stash-watcher/defaults.toml#L28).  This is a lot less efficient than the default mechanism, but is more likely to work.

In my testing (this is from Windows to a share on another machine), if the machine running Stash Watcher wrote to the share, then the normal watcher worked fine.  However, if a different machine wrote to the share, then Stash Watcher did not see the write unless I used Polling.

