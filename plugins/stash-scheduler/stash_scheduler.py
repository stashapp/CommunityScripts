#!/usr/bin/env python3
"""
stash_scheduler.py — Stash Scheduler Plugin

All plugin tasks (invoked by Stash via stdin JSON) exit IMMEDIATELY so they
never occupy the Stash job queue. Long-running work is handed off to detached
background subprocesses that run outside Stash's queue entirely.

Plugin task modes (mode comes from defaultArgs in the manifest):
  start_scheduler  — Save config, kill any existing daemon, start daemon in
                     background, return immediately.
  run_now          — Fire scan mutation, return immediately. If "Run Identify
                     After Scan" is enabled, launch a background subprocess to
                     wait for the scan and then trigger identify.
  force_now        — Fire scan mutation and ALWAYS launch a background subprocess
                     for identify afterwards, regardless of settings.
  check_status     — Report whether the daemon is running and show recent log
                     lines. Safe to run at any time; never modifies state.

Background subprocess modes (invoked via sys.argv, never by Stash directly):
  --daemon                          — Run the APScheduler loop.
  --after-identify <job_id> <mins>  — Wait for scan job to finish, then
                                      trigger identify.
"""

import json
import logging
import os
import signal
import subprocess
import sys
import tempfile
import threading
import time

# ---------------------------------------------------------------------------
# Paths (all in temp dir so subprocesses find them regardless of cwd)
# ---------------------------------------------------------------------------
_TMP = tempfile.gettempdir()
CONFIG_FILE = os.path.join(_TMP, "stash-scheduler-config.json")
PID_FILE    = os.path.join(_TMP, "stash-scheduler-daemon.pid")
LOG_FILE    = os.path.join(_TMP, "stash-scheduler-daemon.log")

# ---------------------------------------------------------------------------
# GraphQL
# ---------------------------------------------------------------------------
SCAN_MUTATION = """
mutation MetadataScan($input: ScanMetadataInput!) {
  metadataScan(input: $input)
}
"""

IDENTIFY_MUTATION = """
mutation MetadataIdentify($input: IdentifyMetadataInput!) {
  metadataIdentify(input: $input)
}
"""

JOB_QUEUE_QUERY = """
query JobQueue {
  jobQueue {
    id
    status
    description
    progress
  }
}
"""

CONFIGURATION_QUERY = """
query Configuration {
  configuration {
    plugins
    defaults {
      identify {
        sources {
          source {
            stash_box_endpoint
            scraper_id
          }
          options {
            fieldOptions {
              field
              strategy
              createMissing
            }
            setCoverImage
            setOrganized
            includeMalePerformers
          }
        }
        options {
          fieldOptions {
            field
            strategy
            createMissing
          }
          setCoverImage
          setOrganized
          includeMalePerformers
        }
      }
    }
  }
}
"""

# ---------------------------------------------------------------------------
# Config file I/O
# ---------------------------------------------------------------------------

def save_config(server_connection, settings):
    with open(CONFIG_FILE, "w") as f:
        json.dump({"server_connection": server_connection, "settings": settings}, f)


def load_config():
    with open(CONFIG_FILE) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Stash connection
# ---------------------------------------------------------------------------

def make_stash(server_connection):
    from stashapi.stashapp import StashInterface
    return StashInterface(server_connection)


def call_gql(stash, query, variables=None):
    return stash.call_GQL(query, variables or {})


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

def get_plugin_settings(stash, plugin_id="stash-scheduler"):
    defaults = {
        "frequency": "daily",
        "time_of_day": "02:00",
        "day_of_week": "sun",
        "timezone": "UTC",
        "run_identify": False,
        "identify_timeout_minutes": 120,
        # Comma- or newline-separated list of paths to restrict scan + identify.
        # Empty string = full library (default).
        "scanPaths": "",
        # Scan generation flags — all off by default (non-breaking)
        "scanGenerateCovers": False,
        "scanGeneratePreviews": False,
        "scanGenerateImagePreviews": False,
        "scanGenerateSprites": False,
        "scanGeneratePhashes": False,
        "scanGenerateImagePhashes": False,
        "scanGenerateThumbnails": False,
        "scanGenerateClipPreviews": False,
        "rescan": False,
    }
    try:
        result = call_gql(stash, CONFIGURATION_QUERY)
        plugins_cfg = result.get("configuration", {}).get("plugins", {})
        saved = plugins_cfg.get(plugin_id, {})
        defaults.update(saved)
    except Exception as exc:
        stash.log.warning(f"[Stash Scheduler] Could not read plugin settings: {exc}")
    return defaults


def _parse_time_of_day(raw, warn):
    raw = str(raw).strip()
    try:
        parts = raw.split(":")
        if len(parts) != 2:
            raise ValueError("expected HH:MM")
        hh, mm = int(parts[0]), int(parts[1])
        if not (0 <= hh <= 23 and 0 <= mm <= 59):
            raise ValueError(f"values out of range: {hh}:{mm:02d}")
        return hh, mm
    except (ValueError, TypeError) as exc:
        warn(f"[Stash Scheduler] Invalid time_of_day {raw!r} ({exc}) — defaulting to 02:00.")
        return 2, 0


def validate_and_coerce_settings(settings, warn):
    VALID_FREQUENCIES = {"hourly", "daily", "weekly"}
    VALID_DAYS = {"mon", "tue", "wed", "thu", "fri", "sat", "sun"}

    freq = str(settings.get("frequency", "daily")).strip().lower()
    if freq not in VALID_FREQUENCIES:
        warn(f"[Stash Scheduler] Invalid frequency {freq!r} — defaulting to 'daily'.")
        freq = "daily"
    settings["frequency"] = freq

    raw_time = settings.get("time_of_day", "02:00")
    hour, minute = _parse_time_of_day(raw_time, warn)
    settings["time_of_day"] = f"{hour:02d}:{minute:02d}"
    settings["hour"] = hour
    settings["minute"] = minute

    dow = str(settings.get("day_of_week", "sun")).strip().lower()
    if dow not in VALID_DAYS:
        warn(f"[Stash Scheduler] Invalid day_of_week {dow!r} — defaulting to 'sun'.")
        dow = "sun"
    settings["day_of_week"] = dow

    try:
        timeout = int(settings.get("identify_timeout_minutes", 120))
        if timeout < 1:
            raise ValueError(f"must be >= 1, got {timeout}")
    except (ValueError, TypeError) as exc:
        warn(f"[Stash Scheduler] Invalid identify_timeout_minutes ({exc}) — defaulting to 120.")
        timeout = 120
    settings["identify_timeout_minutes"] = timeout

    settings["run_identify"] = bool(settings.get("run_identify", False))

    tz_raw = str(settings.get("timezone", "")).strip()
    if not tz_raw:
        tz_raw = "UTC"
    try:
        import zoneinfo
        zoneinfo.ZoneInfo(tz_raw)
    except Exception:
        try:
            from backports import zoneinfo as _bz
            _bz.ZoneInfo(tz_raw)
        except Exception:
            warn(
                f"[Stash Scheduler] Unrecognised timezone {tz_raw!r} — defaulting to UTC."
            )
            tz_raw = "UTC"
    settings["timezone"] = tz_raw

    # scanPaths — parse comma/newline-separated string into a clean list
    raw_paths = str(settings.get("scanPaths", "") or "")
    import re as _re
    scan_paths = [p.strip() for p in _re.split(r"[,\n]+", raw_paths) if p.strip()]
    settings["scan_paths"] = scan_paths  # normalised list; raw "scanPaths" kept for saving

    # Scan generation flags — coerce to bool
    for flag in (
        "scanGenerateCovers", "scanGeneratePreviews", "scanGenerateImagePreviews",
        "scanGenerateSprites", "scanGeneratePhashes", "scanGenerateImagePhashes",
        "scanGenerateThumbnails", "scanGenerateClipPreviews", "rescan",
    ):
        settings[flag] = bool(settings.get(flag, False))

    return settings


# ---------------------------------------------------------------------------
# Scan / Identify helpers (used by both plugin tasks and the daemon)
# ---------------------------------------------------------------------------

_SCAN_FLAGS = (
    "scanGenerateCovers",
    "scanGeneratePreviews",
    "scanGenerateImagePreviews",
    "scanGenerateSprites",
    "scanGeneratePhashes",
    "scanGenerateImagePhashes",
    "scanGenerateThumbnails",
    "scanGenerateClipPreviews",
    "rescan",
)


def trigger_scan(stash_or_log, gql_fn, settings=None):
    """
    Trigger a library scan and return the job ID.
    stash_or_log: a StashInterface, a logging.Logger, or None.
    gql_fn:       callable(query, variables) -> result dict.
    settings:     validated settings dict (used to set scanGenerate* flags).
    """
    scan_input = {}
    if settings:
        for flag in _SCAN_FLAGS:
            if settings.get(flag):
                scan_input[flag] = True
        paths = settings.get("scan_paths") or []
        if paths:
            scan_input["paths"] = paths

    active_flags = [f for f in _SCAN_FLAGS if scan_input.get(f)]
    paths_desc = (
        f" paths=[{', '.join(scan_input['paths'])}]" if scan_input.get("paths") else ""
    )
    if active_flags:
        _log_info(
            stash_or_log,
            "[Stash Scheduler] Triggering library scan with flags: "
            + ", ".join(active_flags) + paths_desc,
        )
    else:
        _log_info(
            stash_or_log,
            "[Stash Scheduler] Triggering library scan"
            + (paths_desc if paths_desc else " (full library)") + "…",
        )

    result = gql_fn(SCAN_MUTATION, {"input": scan_input})
    job_id = result.get("metadataScan")
    if job_id:
        _log_info(stash_or_log, f"[Stash Scheduler] Scan job started (id={job_id})")
    else:
        _log_warn(stash_or_log, "[Stash Scheduler] metadataScan returned no job ID.")
    return job_id


def trigger_identify(stash_or_log, gql_fn, paths=None):
    """
    Trigger an identify task and return the job ID.
    paths: optional list of path strings — when set, only scenes within those
           paths are identified (mirrors the scan path restriction).
    """
    try:
        result = gql_fn(CONFIGURATION_QUERY, {})
        identify = result.get("configuration", {}).get("defaults", {}).get("identify", {})
    except Exception as exc:
        _log_warn(stash_or_log, f"[Stash Scheduler] Could not read identify defaults: {exc}")
        return None

    if not identify or not identify.get("sources"):
        _log_warn(
            stash_or_log,
            "[Stash Scheduler] Identify skipped — no sources configured in "
            "Settings → Identify.",
        )
        return None

    paths_desc = f" (paths: {', '.join(paths)})" if paths else " (full library)"
    _log_info(stash_or_log, f"[Stash Scheduler] Triggering identify task{paths_desc}…")
    try:
        identify_input = {"sources": identify["sources"]}
        if identify.get("options"):
            identify_input["options"] = identify["options"]
        if paths:
            identify_input["paths"] = paths
        result = gql_fn(IDENTIFY_MUTATION, {"input": identify_input})
        job_id = result.get("metadataIdentify")
        _log_info(stash_or_log, f"[Stash Scheduler] Identify job started (id={job_id})")
        return job_id
    except Exception as exc:
        _log_err(stash_or_log, f"[Stash Scheduler] Failed to start identify: {exc}")
        return None


def wait_for_scan_and_identify(stash_or_log, gql_fn, job_id, timeout_minutes, paths=None):
    """
    Poll until the scan job finishes, then trigger identify.
    Runs in a daemon thread or a detached subprocess — never in a Stash task.
    paths: optional list of path strings passed through to trigger_identify.
    """
    if job_id is None:
        _log_warn(stash_or_log, "[Stash Scheduler] No scan job ID — identify skipped.")
        return

    deadline = time.time() + timeout_minutes * 60
    _log_info(
        stash_or_log,
        f"[Stash Scheduler] Waiting for scan {job_id} to finish "
        f"(timeout {timeout_minutes} min)…",
    )

    while time.time() < deadline:
        try:
            result = gql_fn(JOB_QUEUE_QUERY, {})
            queue = result.get("jobQueue") or []
            job = next((j for j in queue if str(j.get("id")) == str(job_id)), None)

            if job is None:
                _log_info(stash_or_log, "[Stash Scheduler] Scan complete — starting identify.")
                trigger_identify(stash_or_log, gql_fn, paths)
                return

            status = job.get("status", "UNKNOWN")
            if status == "FINISHED":
                _log_info(stash_or_log, "[Stash Scheduler] Scan finished — starting identify.")
                trigger_identify(stash_or_log, gql_fn, paths)
                return
            if status in ("CANCELLED", "FAILED"):
                _log_warn(
                    stash_or_log,
                    f"[Stash Scheduler] Scan ended with status {status}. Identify skipped.",
                )
                return

        except Exception as exc:
            _log_warn(stash_or_log, f"[Stash Scheduler] Error polling job queue: {exc}")

        time.sleep(15)

    _log_warn(
        stash_or_log,
        f"[Stash Scheduler] Timed out after {timeout_minutes} min. Identify skipped.",
    )


# ---------------------------------------------------------------------------
# Logging helpers
# stash_or_log is either a StashInterface (plugin tasks) or a logging.Logger
# (daemon / background subprocesses). None = silent.
# ---------------------------------------------------------------------------

def _log_info(obj, msg):
    if obj is None:
        return
    if isinstance(obj, logging.Logger):
        obj.info(msg)
    else:
        try:
            obj.log.info(msg)
        except Exception:
            pass


def _log_warn(obj, msg):
    if obj is None:
        return
    if isinstance(obj, logging.Logger):
        obj.warning(msg)
    else:
        try:
            obj.log.warning(msg)
        except Exception:
            pass


def _log_err(obj, msg):
    if obj is None:
        return
    if isinstance(obj, logging.Logger):
        obj.error(msg)
    else:
        try:
            obj.log.error(msg)
        except Exception:
            pass


def _make_file_logger(name="stash-scheduler"):
    """Return a Logger that writes to LOG_FILE with timestamps."""
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    logger.setLevel(logging.DEBUG)
    fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
    fh.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(fh)
    # Also mirror to stderr so it shows up when running interactively
    sh = logging.StreamHandler(sys.stderr)
    sh.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(sh)
    return logger


# ---------------------------------------------------------------------------
# Subprocess / daemon helpers
# ---------------------------------------------------------------------------

def _self():
    return os.path.abspath(__file__)


def launch_detached(*args):
    """
    Launch this script with the given argv in a fully detached process.
    The daemon subprocess redirects stdout/stderr to LOG_FILE so its output
    is preserved. Other subprocesses discard output.
    """
    is_daemon = args and args[0] == "--daemon"
    if is_daemon:
        log_fd = open(LOG_FILE, "a")
        stdout = log_fd
        stderr = log_fd
    else:
        stdout = subprocess.DEVNULL
        stderr = subprocess.DEVNULL

    subprocess.Popen(
        [sys.executable, _self()] + list(args),
        stdin=subprocess.DEVNULL,
        stdout=stdout,
        stderr=stderr,
        close_fds=True,
        start_new_session=True,
    )


def kill_existing_daemon():
    if not os.path.exists(PID_FILE):
        return
    try:
        with open(PID_FILE) as f:
            pid = int(f.read().strip())
        os.kill(pid, signal.SIGTERM)
        time.sleep(1)
        try:
            os.kill(pid, signal.SIGKILL)
        except OSError:
            pass
    except (OSError, ValueError):
        pass
    finally:
        try:
            os.remove(PID_FILE)
        except OSError:
            pass


def write_pid():
    with open(PID_FILE, "w") as f:
        f.write(str(os.getpid()))


def daemon_alive():
    """Return (alive: bool, pid: int|None)."""
    if not os.path.exists(PID_FILE):
        return False, None
    try:
        with open(PID_FILE) as f:
            pid = int(f.read().strip())
        os.kill(pid, 0)   # signal 0 = existence check only
        return True, pid
    except (OSError, ValueError):
        return False, None


def tail_log(n=30):
    """Return the last n lines of the daemon log file as a string."""
    if not os.path.exists(LOG_FILE):
        return "(log file not found)"
    try:
        with open(LOG_FILE, encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
        return "".join(lines[-n:]).strip()
    except Exception as exc:
        return f"(could not read log: {exc})"


# ---------------------------------------------------------------------------
# Background mode: --daemon
# ---------------------------------------------------------------------------

def run_daemon():
    log = _make_file_logger()
    log.info("=== Stash Scheduler daemon starting ===")

    try:
        cfg = load_config()
    except Exception as exc:
        log.error(f"Cannot read config file: {exc}")
        sys.exit(1)

    write_pid()
    log.info(f"PID {os.getpid()} written to {PID_FILE}")

    try:
        stash = make_stash(cfg["server_connection"])
    except Exception as exc:
        log.error(f"Cannot connect to Stash: {exc}")
        sys.exit(1)

    settings = validate_and_coerce_settings(cfg["settings"], lambda m: log.warning(m))

    try:
        from apscheduler.schedulers.background import BackgroundScheduler
    except ImportError:
        log.error("APScheduler not installed. Run: pip install apscheduler")
        sys.exit(1)

    frequency = settings["frequency"]
    hour = settings["hour"]
    minute = settings["minute"]
    day_of_week = settings["day_of_week"]
    timezone = settings["timezone"]
    run_identify = settings["run_identify"]
    identify_timeout = settings["identify_timeout_minutes"]
    scan_paths = settings.get("scan_paths") or []

    # Build a simple GQL callable for the daemon (not stash.log-based)
    def gql(query, variables=None):
        return call_gql(stash, query, variables)

    def scheduled_job():
        log.info("Scheduled scan cycle firing.")
        try:
            job_id = trigger_scan(log, gql, settings)
        except Exception as exc:
            log.error(f"Scan failed: {exc}")
            return
        if run_identify:
            threading.Thread(
                target=wait_for_scan_and_identify,
                args=(log, gql, job_id, identify_timeout, scan_paths or None),
                daemon=True,
            ).start()

    scheduler = BackgroundScheduler(timezone=timezone)
    job_kwargs = {"func": scheduled_job, "misfire_grace_time": 3600, "coalesce": True}

    if frequency == "hourly":
        scheduler.add_job(trigger="cron", minute=0, **job_kwargs)
        log.info(f"Schedule: every hour at :00 ({timezone})")
    elif frequency == "weekly":
        scheduler.add_job(
            trigger="cron", day_of_week=day_of_week, hour=hour, minute=minute, **job_kwargs
        )
        log.info(f"Schedule: weekly {day_of_week.upper()} at {hour:02d}:{minute:02d} ({timezone})")
    else:
        scheduler.add_job(trigger="cron", hour=hour, minute=minute, **job_kwargs)
        log.info(f"Schedule: daily at {hour:02d}:{minute:02d} ({timezone})")

    log.info(f"Identify after scan: {'yes' if run_identify else 'no'}")

    if scan_paths:
        log.info("Scan/identify paths: " + ", ".join(scan_paths))
    else:
        log.info("Scan/identify paths: full library")

    active_flags = [f for f in _SCAN_FLAGS if settings.get(f)]
    if active_flags:
        log.info("Scan flags: " + ", ".join(active_flags))
    else:
        log.info("Scan flags: none (bare scan)")

    scheduler.start()
    log.info("Daemon is running. Waiting for scheduled events…")

    stop = threading.Event()
    signal.signal(signal.SIGTERM, lambda *_: stop.set())
    signal.signal(signal.SIGINT, lambda *_: stop.set())
    stop.wait()

    scheduler.shutdown(wait=False)
    log.info("Daemon stopped.")


# ---------------------------------------------------------------------------
# Background mode: --after-identify <job_id> <timeout_minutes>
# ---------------------------------------------------------------------------

def run_after_identify(job_id_arg, timeout_arg):
    log = _make_file_logger()
    log.info("=== after-identify subprocess starting ===")

    try:
        cfg = load_config()
    except Exception as exc:
        log.error(f"Cannot read config: {exc}")
        sys.exit(1)

    try:
        stash = make_stash(cfg["server_connection"])
    except Exception as exc:
        log.error(f"Cannot connect to Stash: {exc}")
        sys.exit(1)

    def gql(query, variables=None):
        return call_gql(stash, query, variables)

    job_id = None if job_id_arg == "none" else job_id_arg
    try:
        timeout = int(timeout_arg)
    except (ValueError, TypeError):
        timeout = 120

    # Read scan_paths from the saved settings so identify is scoped consistently
    settings = validate_and_coerce_settings(
        cfg.get("settings", {}), lambda m: log.warning(m)
    )
    scan_paths = settings.get("scan_paths") or None

    wait_for_scan_and_identify(log, gql, job_id, timeout, scan_paths)
    log.info("=== after-identify subprocess done ===")


# ---------------------------------------------------------------------------
# Plugin task modes — exit quickly, never block
# ---------------------------------------------------------------------------

def task_start_scheduler(stash, server_connection, settings):
    save_config(server_connection, settings)
    kill_existing_daemon()
    launch_detached("--daemon")
    freq = settings["frequency"]
    time_str = settings.get("time_of_day", "??:??")
    dow = settings.get("day_of_week", "")
    tz = settings.get("timezone", "UTC")
    if freq == "hourly":
        schedule_desc = f"every hour at :00 ({tz})"
    elif freq == "weekly":
        schedule_desc = f"weekly on {dow.upper()} at {time_str} ({tz})"
    else:
        schedule_desc = f"daily at {time_str} ({tz})"
    stash.log.info(
        f"[Stash Scheduler] Daemon launched. Schedule: {schedule_desc}. "
        f"Identify after scan: {'yes' if settings['run_identify'] else 'no'}. "
        f"Daemon log: {LOG_FILE}"
    )
    print(json.dumps({"output": f"Scheduler daemon started ({schedule_desc})."}))


def task_run_now(stash, settings, force_identify=False):
    stash.log.info("[Stash Scheduler] Triggering scan now…")
    try:
        job_id = trigger_scan(stash, lambda q, v=None: call_gql(stash, q, v), settings)
    except Exception as exc:
        stash.log.error(f"[Stash Scheduler] Scan could not be started: {exc}")
        print(json.dumps({"output": f"Error starting scan: {exc}"}))
        return

    run_identify = force_identify or settings["run_identify"]
    timeout = settings["identify_timeout_minutes"]

    if run_identify:
        jid_arg = str(job_id) if job_id else "none"
        launch_detached("--after-identify", jid_arg, str(timeout))
        stash.log.info("[Stash Scheduler] Identify will follow scan completion (background).")
        print(json.dumps({"output": "Scan started. Identify will follow in the background."}))
    else:
        print(json.dumps({"output": "Scan started."}))


def task_check_status(stash):
    alive, pid = daemon_alive()
    status_line = f"Daemon: RUNNING (PID {pid})" if alive else "Daemon: NOT RUNNING"
    recent = tail_log(30)
    output = f"{status_line}\nLog file: {LOG_FILE}\n\nRecent log ({LOG_FILE}):\n{recent}"
    stash.log.info(f"[Stash Scheduler] {status_line}")
    print(json.dumps({"output": output}))


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    # Background subprocess modes
    if len(sys.argv) > 1:
        mode = sys.argv[1]
        if mode == "--daemon":
            run_daemon()
            return
        if mode == "--after-identify":
            job_id_arg = sys.argv[2] if len(sys.argv) > 2 else "none"
            timeout_arg = sys.argv[3] if len(sys.argv) > 3 else "120"
            run_after_identify(job_id_arg, timeout_arg)
            return
        print(f"[Stash Scheduler] Unknown argument: {mode}", file=sys.stderr)
        sys.exit(1)

    # Plugin task mode
    raw = sys.stdin.read()
    try:
        plugin_input = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"[Stash Scheduler] Failed to parse plugin input: {exc}", file=sys.stderr)
        sys.exit(1)

    server_connection = plugin_input.get("server_connection", {})
    task_mode = plugin_input.get("args", {}).get("mode", "start_scheduler")

    try:
        from stashapi.stashapp import StashInterface
        stash = StashInterface(server_connection)
    except ImportError:
        print("[Stash Scheduler] stashapp-tools not installed.", file=sys.stderr)
        sys.exit(1)
    except Exception as exc:
        print(f"[Stash Scheduler] Could not connect to Stash: {exc}", file=sys.stderr)
        sys.exit(1)

    settings = get_plugin_settings(stash)
    settings = validate_and_coerce_settings(settings, lambda m: stash.log.warning(m))

    if task_mode == "start_scheduler":
        task_start_scheduler(stash, server_connection, settings)
    elif task_mode == "run_now":
        task_run_now(stash, settings, force_identify=False)
    elif task_mode == "force_now":
        stash.log.info("[Stash Scheduler] Force mode — identify will always run after scan.")
        task_run_now(stash, settings, force_identify=True)
    elif task_mode == "check_status":
        task_check_status(stash)
    else:
        stash.log.error(f"[Stash Scheduler] Unknown task mode: {task_mode!r}")
        sys.exit(1)


if __name__ == "__main__":
    main()
