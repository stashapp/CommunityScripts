import stashapi.log as log
from stashapi.stashapp import StashInterface
import sys
import json
import uuid

STASH_BOXES = [
    "https://fansdb.cc",
    "https://pmvstash.org",
    "https://stashdb.org",
    "https://javstash.org",
    "https://theporndb.net",
]

def processPerformer(performer):
    log.trace(performer["stash_ids"])
    stash_boxes = [x["endpoint"] for x in performer["stash_ids"]]
    needs_update = False
    performer_update = {"id": performer["id"], "stash_ids": performer["stash_ids"]}
    for url in performer["urls"]:
        log.trace(url)
        for domain in STASH_BOXES:
            if f"{domain}/performers/" in url and f"{domain}/graphql" not in stash_boxes:
                try:
                    stash_box_id = url.rstrip("/").rsplit("/", 1)[1]
                    stash_box_id = str(uuid.UUID(stash_box_id, version=4))
                except ValueError:
                    continue

                performer_update["stash_ids"].append(
                    {"endpoint": f"{domain}/graphql", "stash_id": stash_box_id}
                )
                needs_update = True
                log.info("Adding stashbox %s to performer %s" % (domain, performer["id"]))

    log.trace(performer_update)
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
