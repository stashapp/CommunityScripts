import requests, os, shutil
import re, sys, json
import datetime as dt
import time

try:
    import stashapi.log as log
    from stashapi.stashapp import StashInterface

except ModuleNotFoundError:
    print(
        "You need to install the stashapi module. (pip install stashapp-tools)",
        file=sys.stderr,
    )
    exit

FAKTORCONV = 6.25
FRAGMENT = json.loads(sys.stdin.read())
# MODE = FRAGMENT['args']['mode']
MODE = FRAGMENT["args"].get("mode")
PLUGIN_DIR = FRAGMENT["server_connection"]["PluginDir"]
stash = StashInterface(FRAGMENT["server_connection"])

SLIM_SCENE_FRAGMENT = """
id
title
url
urls
details
date
tags { id }
studio{
   name
   stash_ids{
      endpoint
      stash_id
   }
}
files {
    size
    path
    width
    height
    bit_rate
    mod_time
    duration
    frame_rate
    video_codec
}
"""


def main():

    log.info(f"Plugin Dir {PLUGIN_DIR} ")
    cachepath = os.path.join(PLUGIN_DIR, "cache")

    try:
        os.makedirs(cachepath, exist_ok=True)
        print("Directory '%s' created successfully" % cachepath)
    except OSError as error:
        print("Directory '%s' can not be created" % cachepath)

    if MODE:
        if MODE == "download":
            get_download()
        if MODE == "disable":
            return True
    else:
        try:
            get_download()  # ToDo use single Scene
        except Exception as err:
            log.LogError(f"main function error: {err}")

    log.exit("Plugin exited normally.")


def parse_timestamp(ts, format="%Y-%m-%dT%H:%M:%S%z"):
    ts = re.sub(r"\.\d+", "", ts)  # remove fractional seconds
    return dt.datetime.strptime(ts, format)


def get_download():

    cachepath = os.path.join(PLUGIN_DIR, "cache")
    log.info(f"Plugin Cachepath {cachepath} ")

    # adulttime.com
    # jerkbuddies.com
    # adulttime.studio
    # oopsie.tube
    # adulttimepilots.com
    # kissmefuckme.net
    # youngerloverofmine.com
    # dareweshare.net
    # milfoverload.net
    # getupclose.com
    # https://switch.com/en/video/switch/Switch-Awakening/234167
    # https://howwomenorgasm.com/en/video/howwomenorgasm/How-Women-Orgasm---Lumi-Ray/230015

    scene_count, scenes = stash.find_scenes(
        # f={"url": {"modifier": "INCLUDES", "value": "adulttime.com"}},
        f={
            "url": {
                "modifier": "MATCHES_REGEX",
                "value": "howwomenorgasm\\.com|switch\\.com|getupclose\\.com|milfoverload\\.net|dareweshare\\.net|jerkbuddies\\.com|adulttime\\.studio|adulttime\\.com|oopsie\\.tube|adulttimepilots\\.com|kissmefuckme\\.net|youngerloverofmine\\.com",
            }
        },
        fragment=SLIM_SCENE_FRAGMENT,
        get_count=True,
    )

    log.info(f"Plugin found {scene_count} Scenes from Adulttime ")

    i = 0
    for i, scene in enumerate(scenes):
        urls = scene["urls"]
        for u in urls:
            # if re.search(r"members\.adulttime\.com", u):
            if re.search(r"\.adulttime\.com", u):
                aid = re.search(r"\/([0-9]+)", u)
                aid = aid.group(1)
                fpw = f"{cachepath}/{aid}.json"
                fppatw = f"{cachepath}/{aid}.pat"
                fpfunw = f"{cachepath}/{aid}.funscript"
                log.debug(f"Found Adulttime URL {u} width Provider ID {aid}")

                # Try to DL or open from Cache
                if os.path.isfile(fpw) == False:
                    dlurl = f"https://coll.lovense.com/coll-log/video-websites/get/pattern?videoId={aid}&pf=Adulttime"
                    r = requests.get(dlurl, allow_redirects=True)
                    log.debug(r.content)
                    dlapires = json.loads(r.content)
                    open(fpw, "w+").write(r.content.decode("utf-8"))
                else:
                    with open(fpw, "r") as f:
                        dlapires = json.load(f)
                try:
                    if dlapires["code"] == 0:
                        log.info(f"Try Interactive for this ID")
                        if os.path.isfile(fppatw) == False:
                            dlpaturl = dlapires["data"]["pattern"]
                            rpat = requests.get(dlpaturl, allow_redirects=True)
                            open(fppatw, "w+").write(
                                rpat.content.decode("utf-8")
                            )
                            if os.path.isfile(fpfunw) == False:
                                convert_lovense_to_funscript(
                                    scene, fppatw, fpfunw
                                )
                        map_file_with_funscript(scene, fpfunw)
                    else:
                        log.debug(f"No Interactive for this ID")

                except KeyError:
                    log.error(
                        "File '%s' can not be read, invailed format" % fpw
                    )
                    fullfile = json.dumps(dlapires)
                    if re.search("Too many requests", fullfile) or re.search(
                        "security", fullfile
                    ):
                        os.remove(fpw)
                        log.error("Too many requests. Wait a moment...")
                        time.sleep(60)

        log.progress(i / scene_count)
        i = i + 1


def map_file_with_funscript(sceneinfo, funscriptfile):
    scenefiles = sceneinfo["files"]
    for u in scenefiles:
        filepath = os.path.dirname(os.path.abspath(u["path"]))
        filename = os.path.basename(u["path"])
        filenamewithoutext = filename.rsplit(".", maxsplit=1)[0]
        funscriptnewname = f"{filenamewithoutext}.funscript"
        funscriptnewlocaton = os.path.join(filepath, funscriptnewname)

        shutil.copy2(funscriptfile, funscriptnewlocaton)

        log.info(f"Copy {funscriptfile} to {funscriptnewlocaton}")
        # log.info(filename)
        # log.info(filenamewithoutext)


def convert_lovense_to_funscript(sceneinfo, patternfile, funscriptfile):

    # Sceneninfo
    title = re.sub(r"\[PDT: .+?\]\s+", "", sceneinfo["title"])
    duration = int(sceneinfo["files"][0]["duration"] + 0.5) * 1000

    # Lovensescript
    with open(patternfile, "r") as losc:
        lovensactions = json.load(losc)

    # Funscript-Output
    data = {}
    data["version"] = "1.0"
    data["range"] = 100
    data["inverted"] = False
    data["metadata"] = {}
    data["metadata"]["bookmarks"] = {}
    data["metadata"]["chapters"] = {}
    data["metadata"]["performers"] = {}
    data["metadata"]["tags"] = {}
    data["metadata"]["title"] = title
    data["metadata"]["creator"] = "Adulttime Interactive Downloader for Stash"
    data["metadata"]["description"] = ""
    data["metadata"]["duration"] = duration
    data["metadata"]["license"] = "Open"
    data["metadata"]["script_url"] = ""
    data["metadata"]["type"] = "basic"
    data["metadata"]["video_url"] = ""
    data["metadata"]["notes"] = "Convert from Lovense to Funscript"
    data["actions"] = []

    marker_at = 0
    marker_pos = 0
    for la in lovensactions:

        # 0 nicht konvertieren
        if la["v"] == 0:
            marker_at = 0
        else:
            marker_at = la["v"] * FAKTORCONV

        # Division durch 0 nicht moeglich
        if la["t"] == 0:
            print("Skip Junk with Value '%s' " % la["t"])
        else:
            # marker_pos = (la["t"] / 1000)*1
            marker_pos = (la["t"]) * 1
            data["actions"].extend(
                [{"pos": int(marker_at + 0.5), "at": int(marker_pos + 0.5)}]
            )

    # json_data = json.dumps(data)
    # log.debug(json_data)

    # Funscript schreiben
    open(funscriptfile, "w+").write(json.dumps(data))


if __name__ == "__main__":
    main()
