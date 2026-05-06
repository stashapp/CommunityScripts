# Stash Scheduler Plugin

https://discourse.stashapp.cc/t/stash-scheduler/7059

A plugin for [Stash](https://github.com/stashapp/stash) that automatically runs library scans on a schedule (hourly, daily, or weekly), with an optional identify pass after each scan.

---

## Features

- Schedule scans at **hourly**, **daily**, or **weekly** intervals
- Configure the **hour of day** (and day of week for weekly)
- Optionally run an **Identify** task automatically after each scan completes
- Identify is skipped safely if the scan fails, is cancelled, or no job ID is returned
- **Run Now** task for instant manual trigger (useful for testing)
- **Auto-start on system boot** via systemd, Windows startup, or a cron job (see below)
- All settings managed through Stash's built-in plugin settings UI — no config files to edit

---

## Requirements

- **Stash** v0.17.0 or later
- **Python 3.8+** (must be available as `python3` in your system PATH)
- pip packages: `apscheduler` and `stashapp-tools` (see Installation below)
- `curl` (only needed if you use the auto-start scripts)

---

## Installation

### 1 — Copy the plugin folder

Copy the entire `stash-scheduler/` directory into your Stash plugins folder:

```
<Stash data directory>/plugins/stash-scheduler/
```

The final layout should look like:

```
plugins/
└── stash-scheduler/
    ├── stash-scheduler.yml
    ├── stash_scheduler.py
    ├── requirements.txt
    ├── startup/
    │   ├── autostart.sh        (Linux/macOS)
    │   ├── autostart.bat       (Windows)
    │   └── stash-scheduler.service  (systemd)
    └── README.md
```

> Your Stash data directory is shown under **Settings → System**.  
> Common locations: `~/.stash` (Linux/macOS) or `C:\Users\<you>\.stash` (Windows).

### 2 — Install Python dependencies

Open a terminal and run:

```bash
pip install apscheduler "stashapp-tools>=0.2.40"
```

Or install from the requirements file:

```bash
pip install -r /path/to/plugins/stash-scheduler/requirements.txt
```

### 3 — Reload plugins in Stash

In Stash, go to **Settings → Plugins** and click **Reload Plugins**. "Stash Scheduler" will appear in the list.

> **Note on auto-start:** After dropping the plugin into the `plugins/` folder, the scheduler does **not** start automatically — Stash's plugin system has no built-in startup hook. You must either start it manually each time (Settings → Tasks → Start Scheduler) or configure OS-level auto-start using the scripts in `startup/` (see the [Auto-start on boot](#auto-start-on-boot-recommended) section). The systemd unit is the most complete option, as it covers Stash restarts as well as system boot.

---

## Configuration

Open **Settings → Plugins → Stash Scheduler** and set your preferences:

| Setting | Description | Default |
|---|---|---|
| **Scan Frequency** | `hourly`, `daily`, or `weekly` | `daily` |
| **Time of Day (HH:MM)** | Time to run the scan in 24-hour `HH:MM` format. Used by Daily and Weekly; ignored for Hourly. | `02:00` |
| **Day of Week** | Day to scan when Frequency is Weekly. Use `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, or `sun`. | `sun` |
| **Timezone** | IANA timezone name for interpreting Time of Day and Day of Week. Examples: `America/New_York`, `Europe/London`, `Asia/Tokyo`. Leave blank for UTC. | `UTC` |
| **Run Identify After Scan** | When enabled, runs an Identify task after each scan finishes successfully. | `false` |
| **Scan Completion Timeout (minutes)** | Max time to wait for the scan before giving up on Identify. | `120` |
| **Limit to Paths** | Restrict the scan (and the follow-up Identify) to specific directories. One path per line, or comma-separated. Leave blank for the full library. | *(full library)* |
| **Generate Covers** | Generate cover images for scenes during scan. | `false` |
| **Generate Video Previews** | Generate video preview clips during scan. | `false` |
| **Generate Image Previews** | Generate image preview strips during scan. | `false` |
| **Generate Sprites** | Generate sprite sheets (seek-bar previews) during scan. | `false` |
| **Generate Video Phashes** | Generate perceptual hashes for video files (duplicate detection). | `false` |
| **Generate Image Phashes** | Generate perceptual hashes for image files (duplicate detection). | `false` |
| **Generate Image Thumbnails** | Generate thumbnails for image files during scan. | `false` |
| **Generate Image Clip Previews** | Generate animated clip previews for image gallery files. | `false` |
| **Force Rescan** | Rescan all files even if modification time is unchanged. Useful after Stash upgrades. | `false` |

### Timezone configuration example

To run a daily scan at **2:00 AM New York time**:

```
Scan Frequency:   daily
Time of Day:      02:00
Timezone:         America/New_York
```

To run a weekly scan at **3:30 AM London time every Sunday**:

```
Scan Frequency:   weekly
Time of Day:      03:30
Day of Week:      sun
Timezone:         Europe/London
```

A full list of valid timezone names is available at  
https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

> **Note:** If the Timezone field is left blank or set to an unrecognised value, the scheduler falls back to **UTC** and logs a warning.

---

## Starting the Scheduler

The scheduler runs as a **long-lived task** inside Stash. You can start it manually or configure it to start automatically on system boot (recommended).

### Manual start

1. Go to **Settings → Tasks**.
2. Under **Stash Scheduler**, click **Start Scheduler**.
3. The task will appear as running and stay active until you stop it or restart Stash.

### Auto-start on boot (recommended)

Because Stash restarts the plugin process after each Stash restart, auto-start scripts are the most reliable way to ensure the scheduler is always running. Choose the method that fits your setup:

#### Linux — systemd (recommended — handles Stash restarts automatically)

The systemd unit uses `BindsTo=stash.service`, which means it stops when Stash stops and starts when Stash starts. This covers both the initial system boot **and** any subsequent Stash restarts — ensuring the scheduler is always running as long as Stash is running.

```bash
# 1. Make the startup script executable
chmod +x ~/.stash/plugins/stash-scheduler/startup/autostart.sh

# 2. Copy the systemd unit to the system directory
sudo cp ~/.stash/plugins/stash-scheduler/startup/stash-scheduler.service \
        /etc/systemd/system/stash-scheduler.service

# 3. Edit the unit file — set your Stash unit name, URL, and plugin path
#    Find your Stash unit name with:  systemctl list-units | grep -i stash
sudo nano /etc/systemd/system/stash-scheduler.service

# 4. Enable and start the unit
sudo systemctl daemon-reload
sudo systemctl enable stash-scheduler.service
sudo systemctl start stash-scheduler.service
```

The key settings inside the unit file:
```ini
BindsTo=stash.service        # restart this unit whenever Stash restarts
After=stash.service          # wait for Stash to start before trying to connect
Restart=on-failure           # retry if the connection script fails
STASH_URL=http://localhost:9999
PLUGIN_DIR=/path/to/.stash/plugins/stash-scheduler
# Uncomment to enable API key auth:
# STASH_API_KEY=your-api-key-here
```

#### Linux / macOS — cron @reboot

```bash
crontab -e
```

Add this line (adjust paths):

```cron
@reboot sleep 30 && /path/to/plugins/stash-scheduler/startup/autostart.sh >> /tmp/stash-scheduler-autostart.log 2>&1
```

The `sleep 30` gives Stash time to start before the script tries to connect.

#### Windows — Startup folder

1. Press `Win + R`, type `shell:startup`, press Enter.
2. Create a shortcut to `startup\autostart.bat` in that folder.
3. The script will run each time you log in.

Alternatively, use Task Scheduler to trigger `autostart.bat` on system startup (without needing a user session):

- Trigger: **At startup**
- Action: Start `C:\path\to\plugins\stash-scheduler\startup\autostart.bat`
- Check: **Run whether user is logged in or not**

#### Docker / custom entrypoint

Add the following to your Docker entrypoint or startup script, after Stash starts:

```bash
/app/plugins/stash-scheduler/startup/autostart.sh http://localhost:9999
```

---

## Testing Your Settings

Without waiting for the next scheduled run:

1. Go to **Settings → Tasks**.
2. Under **Stash Scheduler**, click **Run Scan Now**.

This triggers a scan (and identify, if enabled) immediately and marks itself complete when done.

---

## How It Works

```
System boots → autostart script runs → polls until Stash is ready
                                              │
                                              ▼
                               Calls runPluginTask via GraphQL
                               to start "Start Scheduler" task
                                              │
                                              ▼
stash_scheduler.py reads plugin settings from Stash API
                                              │
                                              ▼
APScheduler registers a cron job (hourly / daily / weekly)
                                              │
                        (fires at each scheduled time)
                                              │
                                              ▼
               metadataScan mutation → Stash starts a full library scan
                                              │
                        ┌─────────────────────┴──────────────────────┐
                        │                                            │
               run_identify = false                        run_identify = true
                        │                                            │
                       done                    Poll job queue until scan finishes
                                               or timeout elapses
                                                          │
                                               ┌──────────┴──────────┐
                                               │                     │
                                         Scan succeeded         Scan failed /
                                               │                 timed out /
                                               ▼               no job ID
                                  metadataIdentify mutation    → Identify skipped
                                  (uses Settings → Identify    (logged as warning)
                                   sources & options)
```

### About Identify sources

The Identify step uses whatever sources you have configured in **Settings → Metadata → Identify** (e.g., Stash-box connections, scrapers). If no sources are configured there, the identify step will be skipped and a warning will appear in the Stash log.

Identify is also skipped if:
- The scan returns no trackable job ID
- The scan fails or is cancelled
- The scan exceeds the configured timeout

---

## Logs

All activity is written to the Stash log. To view it:

- Go to **Settings → Logs** (or the Stash log panel).
- Look for lines prefixed with `[Stash Scheduler]`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Plugin doesn't appear after Reload | Check that `stash-scheduler.yml` is in the correct folder and YAML syntax is valid. |
| `ModuleNotFoundError: No module named 'apscheduler'` | Run `pip install apscheduler stashapp-tools`. |
| `Could not connect to Stash` | Make sure Stash is running and accessible. |
| Identify is skipped every run | Go to **Settings → Metadata → Identify** and add at least one scraper or Stash-box source. |
| Identify skipped with "no job ID" warning | This is a safety measure — the scan still ran. It can happen on older Stash versions that don't return a job ID for the scan mutation. |
| Scan runs but Identify never starts | Increase **Scan Completion Timeout** if your library is large. |
| Auto-start script says "Stash not available" | Increase the `sleep` delay before calling the script, or raise `MAX_WAIT` inside `autostart.sh`. |
| Schedule fires at wrong time | Check the **Timezone** setting. Set it to your local IANA timezone (e.g. `America/Chicago`) so the Time of Day is interpreted correctly. |

---

## Version History

| Version | Notes |
|---|---|
| 0.6.0 | Added "Limit to Paths" setting — scan and identify can now be restricted to specific directories |
| 0.5.0 | Fixed identify-after-scan (null jobQueue crash); added 9 scan generation flag settings (covers, previews, sprites, phashes, thumbnails, clip previews, force rescan) |
| 0.4.0 | Added Check Status task; daemon logs written to file (`/tmp/stash-scheduler-daemon.log`) |
| 0.3.0 | Added Timezone setting — Time of Day and Day of Week are now interpreted in any IANA timezone instead of always UTC |
| 0.2.0 | Added auto-start scripts (Linux/macOS/Windows/systemd), configurable identify timeout, strict scan→identify sequencing (identify skipped on scan failure/unknown/timeout), improved logging |
| 0.1.0 | Initial release |

---

## License

MIT — use freely, modify as you like.
