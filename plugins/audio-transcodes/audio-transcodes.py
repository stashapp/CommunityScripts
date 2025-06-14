import stashapi.log as log
from stashapi.stashapp import StashInterface
import sys
import json
from pathlib import Path
import subprocess

settings = {"hash_type": "oshash", "transcodes_dir": "/generated/transcodes/"}


def run_ffmpeg(file, hash):
    dest = Path(settings["transcodes_dir"]) / "transcodes" / str(hash + ".mp4")
    if not dest.exists():
        log.debug(
            "running ffmpeg on %s to generate %s"
            % (
                file,
                dest,
            )
        )
        command = [
            "ffmpeg",
            "-loglevel", "error",
            "-f", "lavfi",
            "-i", "color=c=blue:s=1280x720",
            "-i", file,
            "-shortest",
            "-fflags", "+shortest",
            dest,
        ]
        log.debug("about to run command: %s " % (command,))
        subprocess.run(command)
    else:
        log.debug(
            "transcode already exists %s - %s"
            % (
                dest,
                file,
            )
        )


def processScene(s):
    for f in s["files"]:
        if f["width"] == 0:
            log.debug("needs to transcode")
            for h in f["fingerprints"]:
                if h["type"] == settings["hash_type"]:
                    file = f["path"]
                    hash = h["value"]
                    run_ffmpeg(file, hash)


def processAll():
    scenes = stash.find_scenes(
        f={"resolution": {"modifier": "LESS_THAN", "value": "VERY_LOW"}}
    )
    for s in scenes:
        processScene(s)


json_input = json.loads(sys.stdin.read())

FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)
config = stash.get_configuration()

settings["transcodes_dir"] = config["general"]["generatedPath"]
settings["hash_type"] = config["general"]["videoFileNamingAlgorithm"].lower()
log.debug(settings)

if "mode" in json_input["args"]:
    PLUGIN_ARGS = json_input["args"]["mode"]
    log.debug(json_input)
    if "processScenes" == PLUGIN_ARGS:
        processAll()

elif "hookContext" in json_input["args"]:
    _id = json_input["args"]["hookContext"]["id"]
    _type = json_input["args"]["hookContext"]["type"]
    if _type == "Scene.Create.Post":
        scene = stash.find_scene(_id)
        processScene(scene)
