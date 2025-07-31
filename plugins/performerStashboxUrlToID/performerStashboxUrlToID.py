import stashapi.log as log
from stashapi.stashapp import StashInterface
import sys
import json
import time
import re


def processPerformer(performer):
    log.debug(performer["stash_ids"])
    stash_boxes = [x["endpoint"] for x in performer["stash_ids"]]
    needs_update = False
    performer_update = {"id": performer["id"], "stash_ids": performer["stash_ids"]}
    for url in performer["urls"]:
        log.debug(url)
        if "https://fansdb.cc/performers/" in url:
            if "https://fansdb.cc/graphql" not in stash_boxes:
                performer_update["stash_ids"].append(
                    {"endpoint": "https://fansdb.cc/graphql", "stash_id": url[-36:]}
                )
                needs_update = True
        if "https://pmvstash.org/performers/" in url:
            if "https://pmvstash.org/graphql" not in stash_boxes:
                performer_update["stash_ids"].append(
                    {"endpoint": "https://pmvstash.org/graphql", "stash_id": url[-36:]}
                )
                needs_update = True
        if "https://stashdb.org/performers/" in url:
            if "https://stashdb.org/graphql" not in stash_boxes:
                performer_update["stash_ids"].append(
                    {"endpoint": "https://stashdb.org/graphql", "stash_id": url[-36:]}
                )
                needs_update = True

    log.debug(performer_update)
    if needs_update:
        stash.update_performer(performer_update)

def processAll():
    for sbx_config in stash.get_configuration()["general"]["stashBoxes"]:
        log.debug("processing stashbox: %s" % (sbx_config['endpoint'],))
        query={
                "stash_id_endpoint": {
                    "endpoint": sbx_config['endpoint'],
                    "modifier": "IS_NULL",
                    "stash_id": ""
                },
                "url": {
                    "modifier": "INCLUDES",
                    "value": sbx_config['endpoint'][:-7]
                }
            }
        performers=stash.find_performers(f=query)
        for performer in performers:
            processPerformer(performer)

json_input = json.loads(sys.stdin.read())
FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)
if "mode" in json_input["args"]:
    PLUGIN_ARGS = json_input["args"]["mode"]
#    log.debug(json_input)
    if "processAll" == PLUGIN_ARGS:
        processAll()

elif "hookContext" in json_input["args"]:
    id = json_input["args"]["hookContext"]["id"]
    if json_input["args"]["hookContext"]["type"] in  ["Performer.Update.Post","Performer.Create.Post"]:
        p = stash.find_performer(id)
        processPerformer(p)
