import sys
import json
import stashapi.log as log


def do_logcat(args):
    if "logcat" not in args:
        log.error("logcat not found in args")
        return
    logs = args["logcat"]
    log.info(logs)

def do_crash_report(args):
    if "crash_report" not in args:
        log.error("report not found in args")
        return
    report = args["crash_report"]
    log.error(report)

json_input = json.loads(sys.stdin.read())

args = json_input["args"]
if "mode" in args:
    mode = args["mode"]
    if mode == "logcat":
        do_logcat(args)
    elif mode == "crash_report":
        do_crash_report(args)
    else:
      log.warning("Unknown mode: " + mode)

