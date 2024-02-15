import stashapi.log as log
from stashapi.stashapp import StashInterface
import sys
import json
import time


per_page = 100
skip_tag = "[MiscTags: Skip]"

# Defaults if nothing has changed in the stash ui
settings = {"addStashVrCompanionTags": False, "addVrTags": False, "flatStudio": ""}

VRCTags = {
    "flat": {"VRCTags": ["FLAT"], "projTags": []},
    "180_mono": {"VRCTags": ["DOME", "MONO"], "projTags": ["180°"]},
    "360_mono": {"VRCTags": ["SPHERE", "MONO"], "projTags": ["360°"]},
    "180_sbs": {"VRCTags": ["DOME", "SBS"], "projTags": ["180°"]},
    "LR_180": {"VRCTags": ["DOME", "SBS"], "projTags": ["180°"]},
    "180_lr": {"VRCTags": ["DOME", "SBS"], "projTags": ["180°"]},
    "180_3dh_lr": {"VRCTags": ["DOME", "SBS"], "projTags": ["180°"]},
    "360_tb": {"VRCTags": ["SPHERE", "SBS"], "projTags": ["360°"]},
    "mkx200": {"VRCTags": ["MKX200", "FISHEYE", "SBS"], "projTags": ["220°"]},
    "mkx220": {"VRCTags": ["MKX220", "FISHEYE", "SBS"], "projTags": ["220°"]},
    "vrca220": {"VRCTags": ["VRCA220", "FISHEYE", "SBS"], "projTags": ["220°"]},
    "rf52": {"VRCTags": ["RF52", "FISHEYE", "SBS"], "projTags": ["190°"]},
    "fisheye190": {"VRCTags": ["RF52", "FISHEYE", "SBS"], "projTags": ["190°"]},
    "passthrough": {"VRCTags": [], "projTags": ["Augmented Reality"]},
    "8k": {"VRCTags": [], "projTags": ["8K"]},
    "7k": {"VRCTags": [], "projTags": ["7K"]},
    "6k": {"VRCTags": [], "projTags": ["6K"]},
    "5k": {"VRCTags": [], "projTags": ["5K"]},
}
tags_cache = {}


def processScene(scene):
    log.debug("processing scene: %s" % (scene["id"],))
    # if the scene has [MiscTags: Skip] then skip it
    if skip_tag not in tags_cache:
        tags_cache[skip_tag] = stash.find_tag(skip_tag, create=True).get("id")
    if tags_cache[skip_tag] not in [x["id"] for x in scene["tags"]]:
        tags = []
        if settings["addStashVrCompanionTags"]:
            processStashVRCompanionTags(scene, tags)
            log.debug(tags)
        if settings["addVrTags"]:
            processVRTags(scene, tags)
        if len(settings["flatStudio"]) > 0:
            processFlatStudio(scene, tags)

        if len(tags) > 0:
            log.debug(
                "processing scene %s, checking if tags need to be added: %s"
                % (
                    scene["title"],
                    tags,
                )
            )
            # start with the existing tag id's, then look up the new tag id's and create if needed
            new_scene = {"id": scene["id"], "tag_ids": [x["id"] for x in scene["tags"]]}
            update = False
            for t in tags:
                if t not in tags_cache:
                    tags_cache[t] = stash.find_tag(t, create=True).get("id")
                    update = True
                if tags_cache[t] not in new_scene["tag_ids"]:
                    new_scene["tag_ids"].append(tags_cache[t])
                    update = True
            if update:
                log.info(
                    "Adding tags to scene: %s, tags: %s"
                    % (
                        scene["title"],
                        tags,
                    )
                )
                stash.update_scene(new_scene)
        else:
            log.debug("no update")
    else:
        log.debug("skipping scene")


def processStashVRCompanionTags(scene, tags):
    found = False
    for f in scene["files"]:
        for k, v in VRCTags.items():
            if k in f["basename"].lower():
                tags.extend(v["VRCTags"])
                found = True
    if found:
        tags.append("export_deovr")
    return None


def processVRTags(scene, tags):
    found = False
    for f in scene["files"]:
        for k, v in VRCTags.items():
            if k in f["basename"].lower():
                tags.extend(v["projTags"])
                found = True
    if found:
        if "vrTag" in stash.get_configuration()["ui"]:
            vr_tag = stash.get_configuration()["ui"]["vrTag"]
            if vr_tag:
                tags.append(vr_tag)
            else:
                tags.append("VR")
        else:
            tags.append("VR")
    return None


def processFlatStudio(scene, tags):
    log.debug(scene)
    if scene["studio"]:
        if scene["studio"]["id"] in [
            x.strip() for x in settings["flatStudio"].split(",")
        ]:
            if "export_deovr" not in tags:
                tags.append("export_deovr")

                tags.append("FLAT")
    log.debug(tags)


def processScenes():
    log.info("Getting scene count")
    if skip_tag not in tags_cache:
        tags_cache[skip_tag] = stash.find_tag(skip_tag, create=True).get("id")
    count = stash.find_scenes(
        f={
            "tags": {
                "depth": 0,
                "excludes": [tags_cache[skip_tag]],
                "modifier": "INCLUDES_ALL",
                "value": [],
            }
        },
        filter={"per_page": 1},
        get_count=True,
    )[0]
    log.info(str(count) + " scenes to process.")
    i = 0
    for r in range(1, int(count / per_page) + 2):
        log.info(
            "adding tags to scenes: %s - %s %0.1f%%"
            % (
                (r - 1) * per_page,
                r * per_page,
                (i / count) * 100,
            )
        )
        scenes = stash.find_scenes(
            f={
                "tags": {
                    "depth": 0,
                    "excludes": [tags_cache[skip_tag]],
                    "modifier": "INCLUDES_ALL",
                    "value": [],
                }
            },
            filter={"page": r, "per_page": per_page},
        )
        for s in scenes:
            processScene(s)
            i = i + 1
            log.progress((i / count))
            time.sleep(1)


json_input = json.loads(sys.stdin.read())

FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)
config = stash.get_configuration()["plugins"]
if "misc-tags" in config:
    settings.update(config["misc-tags"])
log.info("config: %s " % (settings,))

if "mode" in json_input["args"]:
    PLUGIN_ARGS = json_input["args"]["mode"]
    if "processScenes" in PLUGIN_ARGS:
        processScenes()


elif "hookContext" in json_input["args"]:
    id = json_input["args"]["hookContext"]["id"]
    if json_input["args"]["hookContext"]["type"] == "Scene.Update.Post":
        scene = stash.find_scene(id)
        processScene(scene)
