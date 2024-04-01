import stashapi.log as log
from stashapi.stashapp import StashInterface,StashItem
from stashapi.stashbox import StashBoxInterface
import os
import sys
import requests
import json
import time
import math
import requests
from pathlib import Path
import base64


per_page = 100
request_s = requests.Session()
stash_boxes = {}
scrapers={}

def processImages(img):
    log.debug("image: %s" % (img,))
    image_data=None
    for file in [x["path"] for x in img["visual_files"]]:
        if settings["path"] in file:
            index_file = Path(Path(file).parent) / (Path(file).stem + ".json")
            log.debug(index_file)
            if index_file.exists():
                log.debug("loading index file %s" % (index_file,))
                with open(index_file) as f:
                    index = json.load(f)
                    index["id"] = img["id"]
                    if image_data:
                        image_data["gallery_ids"].extend(index["gallery_ids"])
                    else:
                        image_data = index
    if image_data:
#        log.debug(image_data)
        stash.update_image(image_data)


def processPerformers():
    query={
            "tags": {
                "depth": 0,
                "excludes": [],
                "modifier": "INCLUDES_ALL",
                "value": [tag_stashbox_performer_gallery],
            }
        }
    performers = stash.find_performers(f=query)

    for performer in performers:
        processPerformer(performer)


def processPerformer(performer):
    dir = Path(settings["path"]) / performer["id"]
    dir.mkdir(parents=True, exist_ok=True)
    nogallery = dir / ".nogallery"
    nogallery.touch()
    for sid in performer["stash_ids"]:
        log.debug(sid)
        processPerformerStashid(sid["endpoint"], sid["stash_id"], performer)


def get_stashbox(endpoint):
    for sbx_config in stash.get_configuration()["general"]["stashBoxes"]:
        if sbx_config["endpoint"] == endpoint:
            stashbox = StashBoxInterface(
                {"endpoint": sbx_config["endpoint"], "api_key": sbx_config["api_key"]}
            )
            stash_boxes[endpoint] = stashbox
            return stashbox


def processPerformerStashid(endpoint, stashid, p):
    log.info(
        "processing performer %s, %s  endpoint: %s,  stash id: %s"
        % (
            p["name"],
            p["id"],
            endpoint,
            stashid,
        )
    )

    index_file = os.path.join(settings["path"], p["id"], "index.json")
    if os.path.exists(index_file):
        with open(os.path.join(settings["path"], p["id"], "index.json")) as f:
            index = json.load(f)
    else:
        index = {"files": {}, "galleries": {}, "performer_id": p["id"]}

    modified = False
    stashbox = get_stashbox(endpoint)
    if stashbox:
        query = """id
        name
        images {
          id
          url
        }
        urls{
          url
          type
        }
        """
        perf = stashbox.find_performer(stashid, fragment=query)
        log.debug(perf)
        if endpoint not in index["galleries"]:
            gallery_input = {
                "title": "%s - %s "
                % (
                    p["name"],
                    endpoint[8:-8],
                ),
                "urls": [
                    "%s/performers/%s"
                    % (
                        endpoint[:-8],
                        stashid,
                    )
                ],
                "tag_ids": [tag_stashbox_performer_gallery],
                "performer_ids": [p["id"]],
            }
            gal = stash.create_gallery(gallery_input)
            log.info("Created gallery %s" % (gal,))
            index["galleries"][endpoint] = gal

            modified = True
        # check if the gallery still exists and has not been deleted
        current_gal = stash.find_gallery(index["galleries"][endpoint])
        log.debug("current: %s" % (current_gal,))
        if current_gal is None:
            log.debug("deleted?")
            gallery_input = {
                "title": "%s - %s "
                % (
                    p["name"],
                    endpoint[:-8],
                ),
                "urls": [
                    "%s/performers/%s"
                    % (
                        endpoint[:-8],
                        stashid,
                    )
                ],
                "tag_ids": [tag_stashbox_performer_gallery],
                "performer_ids": [p["id"]],
            }

            gal = stash.create_gallery(gallery_input)
            log.info("Created gallery %s" % (gal,))
            index["galleries"][endpoint] = gal
            modified = True
        if modified:
            with open(index_file, "w") as f:
                json.dump(index, f)

        for img in perf["images"]:
            image_index = Path(settings["path"]) / p["id"] / (img["id"] + ".json")
            if not image_index.exists():
                with open(image_index, "w") as f:
                    image_data = {
                        "title": img["id"],
                        "urls": [img["url"]],
                        "performer_ids": [p["id"]],
                        "tag_ids": [tag_stashbox_performer_gallery],
                        "gallery_ids": [index["galleries"][endpoint]],
                    }
                    json.dump(image_data, f)
            filename = Path(settings["path"]) / p["id"] / (img["id"] + ".jpg")
            if not os.path.exists(filename):
                log.info(
                    "Downloading image %s to %s"
                    % (
                        img["url"],
                        filename,
                    )
                )
                r = requests.get(img["url"])
                with open(filename, "wb") as f:
                    f.write(r.content)
                    f.close()
            #            modified=True
            else:
                log.debug("image already downloaded")

        # scrape urls on the performer using the url scrapers in stash
        if settings['runPerformerScraper'] and len(perf['urls'])>0:

            # we need to determine what scrapers we have and what url patterns they accept, query what url patterns are supported, should only need to check once
            if len(scrapers) == 0:
                scrapers_graphql="""query ListPerformerScrapers {
                  listScrapers(types: [PERFORMER]) {
                  id
                  name
                    performer {
                      urls
                      supported_scrapes
                    }
                  }
                }"""
                res = stash.callGQL(scrapers_graphql)
                for r in res['listScrapers']:
                    if r['performer']['urls']:
                        for url in r['performer']['urls']:
                            scrapers[url]=r

            for u in perf['urls']:
                for url in scrapers.keys():
                    if url in u['url']:
                        log.info('Running stash scraper on performer url: %s' % (u['url'],))
                        res=stash.scrape_performer_url(u['url'])
                        # Check if the scraper returned a result
                        if res is not None:
                            log.debug(res)
                            # it's possible for multiple images to be returned by a scraper so incriment a number each image
                            image_id = 1
                            if res['images']:
                                for image in res['images']:
                                    image_index = Path(settings["path"]) / p["id"] / ("%s-%s.json" % (scrapers[url]['id'],image_id ,))
                                    if not image_index.exists():
                                        with open(image_index, "w") as f:
                                            image_data = {
                                                "title":  '%s - %s ' % (scrapers[url]['id'],image_id,),
                                                "details": "name: %s\ngender: %s\nurl: %s\ntwitter: %s\ninstagram: %s\nbirthdate: %s\nethnicity: %s\ncountry: %s\neye_color: %s\nheight: %s\nmeasurements: %s\nfake tits: %s\npenis_length: %s\n career length: %s\ntattoos: %s\npiercings: %s\nhair_color: %s\nweight: %s\n description: %s\n" % (res['name'], res['gender'], res['url'], res['twitter'], res['instagram'], res['birthdate'], res['ethnicity'], res['country'], res['eye_color'], res['height'], res['measurements'], res['fake_tits'], res['penis_length'], res['career_length'], res['tattoos'], res['piercings'], res['hair_color'], res['weight'], res['details'],),
                                                "urls": [u['url'],],
                                                "performer_ids": [p["id"]],
                                                "tag_ids": [tag_stashbox_performer_gallery],
                                                "gallery_ids": [index["galleries"][endpoint]],
                                            }
                                            json.dump(image_data, f)
                                    filename = Path(settings["path"]) / p["id"] / ("%s-%s.jpg" % (scrapers[url]['id'],image_id ,))
                                    if not filename.exists():
                                        if image.startswith('data:'):
                                            with open(filename, "wb") as f:
                                                f.write(base64.b64decode(image.split('base64,')[1]))
                                                f.close()
                                        else:
                                            with open(image_index, "w") as f:
                                                image_data = {
                                                    "title": '%s - %s ' % (scrapers[url]['id'],image_id,),
                                                    "details": "%s"% (res,),
                                                    "urls": [u['url'],image],
                                                    "performer_ids": [p["id"]],
                                                    "tag_ids": [tag_stashbox_performer_gallery],
                                                    "gallery_ids": [index["galleries"][endpoint]],
                                                }
                                                json.dump(image_data, f)
                                            filename = Path(settings["path"]) / p["id"] / ("%s.jpg" % (image_id,))
                                            r = requests.get(img["url"])
                                            if r.status_code==200:
                                                with open(filename, "wb") as f:
                                                    f.write(r.content)
                                                    f.close()
                                    image_id=image_id+1


    #                log.debug('%s %s' % (url['url'],url['type'],))
#                    stash.scraper
#                    scrape=stash.scrape_performer_url(ur)

    else:
        log.error("endpoint %s not configured, skipping" % (endpoint,))


def setPerformerPicture(img):
    if len(img["performers"]) == 1:
        log.debug(img["paths"]["image"])
        res = request_s.get(img["paths"]["image"])
        log.debug(res.headers["Content-Type"])
        if res.status_code == 200:
            encoded = base64.b64encode(res.content).decode()
            new_performer = {
                "id": img["performers"][0]["id"],
                "image": "data:{0};base64,{1}".format(
                    res.headers["Content-Type"], encoded
                ),
            }
            log.info("updating performer with tagged image %s" % (new_performer["id"],))
            stash.update_performer(new_performer)


def processQueue():
    for id in settings["queue"].split(","):
        if len(id) > 0:
            p = stash.find_performer(id)
            processPerformer(p)
    # queue has not changed since we started, clear setting
    if (
        stash.get_configuration()["plugins"]["stashdb-performer-gallery"]
        == settings["queue"]
    ):
        stash.configure_plugin("stashdb-performer-gallery", {"queue": ""})
        stash.metadata_scan(paths=[settings["path"]])
        stash.run_plugin_task("stashdb-performer-gallery", "relink missing images")
    else:
        # update remove the completed entries from the queue string leaving the unprocessed and schedule the task again
        log.debug("updating queue")
        stash.configure_plugin(
            "stashdb-performer-gallery",
            {
                "queue": stash.get_configuration()["plugins"][
                    "stashdb-performer-gallery"
                ]["queue"].removeprefix(settings["queue"])
            },
        )
        stash.run_plugin_task("stashdb-performer-gallery", "Process Performers", args={"full": False})


def relink_images(performer_id=None):
    query = {
            "path": {"modifier": "INCLUDES", "value": settings["path"]},
        }
    if performer_id==None:
        query["is_missing"] = "galleries"
        query['path']={"modifier": "INCLUDES", "value": settings["path"]}
    else:
        query['path']={"modifier": "INCLUDES", "value": str(Path(settings["path"]) / performer_id / )  }
#    else:
#        query["file_count"] = {"modifier": "NOT_EQUALS", "value": 1}


    total = stash.find_images(f=query, get_count=True)[0]
    i = 0
    images = []
    while i < total:
        images = stash.find_images(f=query, filter={"page": 0, "per_page": per_page})
        for img in images:
            log.debug('image: %s' %(img,))
            processImages(img)
            i=i+1
            log.progress((i / total))


json_input = json.loads(sys.stdin.read())

FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)

config = stash.get_configuration()["plugins"]
settings = {
    "path": "/download_dir",
    "runPerformerScraper":False,
}
if "stashdb-performer-gallery" in config:
    settings.update(config["stashdb-performer-gallery"])
# log.info('config: %s ' % (settings,))


tag_stashbox_performer_gallery = stash.find_tag(
    "[Stashbox Performer Gallery]", create=True
).get("id")
tag_performer_image = stash.find_tag("[Set Profile Image]", create=True).get("id")

if "stasdb-performer-gallery" in config:
    settings.update(config["stasdb-performer-gallery"])

if "mode" in json_input["args"]:
    PLUGIN_ARGS = json_input["args"]["mode"]
    if "performer" in json_input["args"]:
        p = stash.find_performer(json_input["args"]["performer"])
        if tag_stashbox_performer_gallery in [x["id"] for x in p["tags"]]:
            processPerformer(p)
            stash.metadata_scan(paths=[settings["path"]])
            stash.run_plugin_task(
                "stashdb-performer-gallery", "relink missing images", args={'performer_id':p['id']}
            )
    elif "processPerformers" in PLUGIN_ARGS:
        processPerformers()
        stash.metadata_scan([settings["path"]])
        stash.run_plugin_task(
            "stashdb-performer-gallery", "relink missing images", args={}
        )
    elif "processImages" in PLUGIN_ARGS:
        if "performer_id" in json_input["args"]:
            relink_images(performer_id=json_input["args"]["performer_id"])
        else:
            relink_images()


elif "hookContext" in json_input["args"]:
    id = json_input["args"]["hookContext"]["id"]
    if json_input["args"]["hookContext"]["type"] == "Image.Create.Post":
        img = stash.find_image(image_in=id)
        processImages(img)
    if json_input["args"]["hookContext"]["type"] == "Image.Update.Post":
        img = stash.find_image(image_in=id)
        if tag_performer_image in [x["id"] for x in img["tags"]]:
            setPerformerPicture(img)
    if json_input["args"]["hookContext"]["type"] == "Performer.Update.Post":
        stash.run_plugin_task(
            "stashdb-performer-gallery", "Process Performers", args={"performer": id}
        )
