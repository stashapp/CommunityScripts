import stashapi.log as log
from stashapi.stashapp import StashInterface
import sys
import json
import time


per_page = 100
skip_tag = "[MiscTags: Skip]"

# Defaults if nothing has changed in the stash ui
settings = {"addStashVrCompanionTags": False,
            "addVRTags": False,
            "addSoloTags": True,
            "addThreesomeTags": True,
            "addFoursomeTags": True,
            "addFivesomeTags": True,
            "addSixsomeTags": True,
            "addSevensomeTags": True,
            "assumeMissingMale": True,
            "flatStudio": ""}

VRCTags = {
    "flat": {"VRCTags": ["FLAT"], "projTags": []},
    "180_mono": {"VRCTags": ["DOME", "MONO"], "projTags": ["180°"]},
    "360_mono": {"VRCTags": ["SPHERE", "MONO"], "projTags": ["360°"]},
    "180_sbs": {"VRCTags": ["DOME", "SBS"], "projTags": ["180°"]},
    "lr_180": {"VRCTags": ["DOME", "SBS"], "projTags": ["180°"]},
    "180_lr": {"VRCTags": ["DOME", "SBS"], "projTags": ["180°"]},
    "180_3dh_lr": {"VRCTags": ["DOME", "SBS"], "projTags": ["180°"]},
    "360_tb": {"VRCTags": ["SPHERE", "TB"], "projTags": ["360°"]},
    "mkx200": {"VRCTags": ["MKX200", "FISHEYE", "SBS"], "projTags": ["200°"]},
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
performer_cache = {}


def processScene(scene):
    log.debug("processing scene: %s" % (scene["id"],))
    # if the scene has [MiscTags: Skip] then skip it
    if skip_tag not in tags_cache:
        tags_cache[skip_tag] = stash.find_tag(skip_tag, create=True).get("id")
    if tags_cache[skip_tag] not in [x["id"] for x in scene["tags"]]:
        tags = []
        update = False
        if settings["addStashVrCompanionTags"]:
            processStashVRCompanionTags(scene, tags)
            log.debug(tags)
        if settings["addVRTags"]:
            processVRTags(scene, tags)
        if settings["addSoloTags"]:
            soloTag(scene, tags)
        if settings["addThreesomeTags"]:
            processGroupMakeup(['threesome'], 'Threesome', 3, scene, tags)
        if settings["addFoursomeTags"]:
            processGroupMakeup(['foursome', '4some'], 'Foursome', 4, scene, tags)
        if settings["addFivesomeTags"]:
            processGroupMakeup(['fivesome', 'fiveway'], 'Fivesome', 5, scene, tags)
        if settings["addSixsomeTags"]:
            processGroupMakeup(['sixsome'], 'Sixsome', 6, scene, tags)
        if settings["addSevensomeTags"]:
            processGroupMakeup(['sevensome'], 'Sevensome', 7, scene, tags)

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
            for t in tags:
                if t not in tags_cache:
                    tt = stash.find_tag(t, create=True)
                    tags_cache[t]=tt
                    for x in tt["aliases"]:
                        tags_cache[x] = tt
                    log.debug(tt)
                if tags_cache[t].get("id") not in new_scene["tag_ids"]:
                    new_scene["tag_ids"].append(tags_cache[t].get("id"))
                    update = True
                else:
                    log.debug('already there %s' % (t,))
        if update:
            log.info(
                "Adding tags to scene: %s, tags: %s"
                % (
                    scene["title"],
                    tags,
                )
            )
            log.debug(new_scene)
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
    if scene["studio"]:
        if scene["studio"]["id"] in [
            x.strip() for x in settings["flatStudio"].split(",")
        ]:
            if "export_deovr" not in tags:
                tags.append("export_deovr")

                tags.append("FLAT")
    log.debug(tags)

def soloTag(scene,tags):
    """Add Solo Female, Solo male, Solo Trans where there is a single performer and the solo tag"""
    for name in ['solo', 'solo model', 'solo models']:
        if name in [x["name"].lower() for x in scene['tags']]:
            if len(scene['performers']) == 1:
                p=getPerformer(scene['performers'][0])
                if p['gender'] == 'FEMALE':
                    tags.append('Solo Female')
                elif p['gender'] == 'MALE':
                    tags.append('Solo Male')
                elif p['gender'] == 'TRANSGENDER_MALE':
                    tags.append('Solo Trans')
                elif p['gender'] == 'TRANSGENDER_FEMALE':
                    tags.append('Solo Trans')


def getPerformer(p):
    if p['id'] not in performer_cache:
        p2 = stash.find_performer(p)
        performer_cache[p['id']] = p2
        log.debug(performer_cache)
        return p2
    return performer_cache[p['id']]


def processGroupMakeup(tag_strings, makeup_label, count, scene, tags):
    for name in tag_strings:
        if name in [x["name"].lower() for x in scene['tags']]:
            makeup = []
            for p in scene['performers']:
                p2 = getPerformer(p)
                if p2['gender'] == 'FEMALE':
                    makeup.append('G')
                elif p2['gender'] == 'MALE':
                    makeup.append('B')
                elif p2['gender'] == 'TRANSGENDER_FEMALE':
                    makeup.append('T')
                elif p2['gender'] == 'TRANSGENDER_MALE':
                    makeup.append('T')
                elif p2['gender'] == 'INTERSEX':
                    makeup.append('I')
                elif p2['gender'] == 'NON_BINARY':
                    makeup.append('I')
                else:
                    makeup.append('U')
                    # unknown or not set yet
                #
            if settings["assumeMissingMale"]:
                # If there is a mising performer
                for x in range(len(makeup), count):
                    makeup.append('B')

            if len(makeup) == count:
                makeup.sort()
                makeup_str = ''.join(makeup)
                if makeup_str == ('G' * count):
                    tags.append('%s (Lesbian)' % (makeup_label, ))
                elif makeup_str == ('B' * count):
                    tags.append('%s (Gay)' % (makeup_label, ))
                elif makeup_str == ('G' * count):
                    tags.append('%s (Lesbian)' % (makeup_label, ))
                else:
                    tags.append('%s (%s)' % (makeup_label, makeup_str, ) )
            else:
                log.debug('missing performers for group makeup %s, have %s performers instead' % (makeup_label, len(makeup), ))


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
if "miscTags" in config:
    settings.update(config["miscTags"])
log.info("config: %s " % (settings,))

if "mode" in json_input["args"]:
    PLUGIN_ARGS = json_input["args"]["mode"]
    log.debug(json_input)
    if "processScenes" in PLUGIN_ARGS:
        if "scene_id" in json_input["args"]:
            scene = stash.find_scene(json_input["args"]["scene_id"])
            processScene(scene)
        else:
            processScenes()

elif "hookContext" in json_input["args"]:
    id = json_input["args"]["hookContext"]["id"]
    if json_input["args"]["hookContext"]["type"] == "Scene.Update.Post":
        stash.run_plugin_task("miscTags", "Process all", args={"scene_id": id})
#        scene = stash.find_scene(id)
#        processScene(scene)
