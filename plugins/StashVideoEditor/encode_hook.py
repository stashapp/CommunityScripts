# encode_hook.py: hand a re-encode to an executable the user configured.
#
# The plugin writes a JSON job to the executable's stdin. Exit status 0 means the
# executable wrote the output file at job["dst"], an in-progress name Stash does not
# scan; the plugin then moves it to job["final_dst"]. Anything else (a non-zero exit,
# a timeout, an executable that cannot start, or exit 0 with no output) is logged and
# the plugin encodes locally, as it does when no hook is set. The decision in
# encode() takes its side effects as arguments so it can be tested without a
# process or a file system.
import json
import math
import os
import signal
import subprocess
import time

SETTING_PATH = "encodeHook"
SETTING_TIMEOUT = "encodeHookTimeout"
DEFAULT_TIMEOUT = 3600  # seconds; a cloud encode can be slow
MAX_TIMEOUT = 86400  # a day; subprocess cannot wait much longer (OverflowError)
JOB_VERSION = 1


def hook_settings(settings):
    """(executable path or None, timeout in seconds) from the plugin's settings."""
    settings = settings or {}
    path = (settings.get(SETTING_PATH) or "").strip() or None
    try:
        timeout = float(settings.get(SETTING_TIMEOUT))
    except (TypeError, ValueError):
        timeout = 0
    if math.isnan(timeout) or timeout <= 0:
        timeout = DEFAULT_TIMEOUT
    return path, min(timeout, MAX_TIMEOUT)


def build_job(op, src, dst, fmt, final_dst, enc, audio_args, ffmpeg_command,
              scene_id=None, image_id=None, crop=None, out_w=None, out_h=None,
              start=None, end=None):
    """The job the hook reads from stdin. Paths are as Stash sees them. The hook writes
    `dst` (an in-progress name; `fmt` is its ffmpeg muxer), and the plugin moves it to
    `final_dst`. `ffmpeg_command` is the full argv the plugin would run itself, writing
    to dst."""
    job = {"version": JOB_VERSION, "op": op, "scene_id": scene_id, "image_id": image_id,
           "src": src, "dst": dst, "format": fmt, "final_dst": final_dst}
    if op == "crop":
        job.update({"crop": crop, "out_w": out_w, "out_h": out_h})
    else:
        job.update({"start": start, "end": end})
    job["encode"] = {"ffmpeg": enc["ffmpeg"], "input_args": list(enc["input_args"]),
                     "output_args": list(enc["output_args"]),
                     "audio_args": list(audio_args) if audio_args else ["-c:a", "copy"]}
    job["ffmpeg_command"] = list(ffmpeg_command)
    return job


def encode(hook, timeout, job, dst, *, run_hook, local, size_of, remove, log,
           clock=time.monotonic):
    """Run the hook, or local() when there is none or it misses. Returns "hook" or
    "local". Log lines name no path: the plugin's log must not show file names."""
    if not hook:
        local()
        return "local"
    remove(dst)  # a leftover from an interrupted run must not pass the size check
    log("running the encode hook")
    t0 = clock()
    try:
        rc = run_hook(hook, json.dumps(job).encode("utf-8"), timeout)
        if rc != 0:
            reason = "exit status %s" % rc
        elif size_of(dst) <= 0:
            reason = "exit status 0 but no output file"
        else:
            log("encode hook wrote the output in %.1fs" % (clock() - t0))
            return "hook"
    except subprocess.TimeoutExpired:
        reason = "timed out after %gs" % timeout
    except OSError as e:
        reason = "could not start it (%s)" % (e.strerror or type(e).__name__)
    except Exception as e:  # never let a hook problem skip the local encode
        reason = type(e).__name__
    log("encode hook failed (%s); encoding locally" % reason)
    remove(dst)
    local()
    return "local"


def run_hook_process(path, data, timeout):
    """Run the hook with `data` on stdin; return its exit status. Its stdout and
    stderr are discarded: stdout belongs to the plugin's reply to Stash, and Stash
    logs a plugin's stderr, which must not carry file names. The hook runs in its own
    process group, which is killed once the hook has exited or overrun (so nothing it
    started can still be writing the output when the plugin checks it). On timeout
    TimeoutExpired is raised."""
    proc = subprocess.Popen([path], stdin=subprocess.PIPE, stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL, start_new_session=True)
    try:
        proc.communicate(data, timeout=timeout)
    finally:
        try:
            os.killpg(proc.pid, signal.SIGKILL)
        except OSError:
            pass  # the group is already gone
        proc.wait()
    return proc.returncode


def output_size(path):
    """Size of a regular file at path, 0 when there is none."""
    try:
        return os.path.getsize(path) if os.path.isfile(path) else 0
    except OSError:
        return 0
