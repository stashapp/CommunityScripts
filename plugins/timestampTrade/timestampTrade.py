import stashapi.log as log
from stashapi.stashapp import StashInterface
import stashapi.marker_parse as mp
import os
import sys
import requests
import json
import time
import math


per_page = 100
request_s = requests.Session()


def processScene(s):
    if len(s['stash_ids']) > 0:
        for sid in s['stash_ids']:
            #                print('looking up markers for stash id: '+sid['stash_id'])
            res = requests.post('https://timestamp.trade/get-markers/' + sid['stash_id'], json=s)
            md = res.json()
            if 'marker' in md:
                log.info(
                    'api returned something, for scene: ' + s['title'] + ' marker count: ' + str(len(md['marker'])))
                markers = []
                for m in md['marker']:
#                    log.debug('-- ' + m['name'] + ", " + str(m['start'] / 1000))
                    marker = {}
                    marker["seconds"] = m['start'] / 1000
                    marker["primary_tag"] = m["tag"]
                    marker["tags"] = []
                    marker["title"] = m['name']
                    markers.append(marker)
                if len(markers) > 0:
                    log.info('Saving markers')
                    mp.import_scene_markers(stash, markers, s['id'], 15)


def processAll():
    log.info('Getting scene count')
    count=stash.find_scenes(f={"stash_id":{"value":"","modifier":"NOT_NULL"},"has_markers":"false"},filter={"per_page": 1},get_count=True)[0]
    log.info(str(count)+' scenes to submit.')
    i=0
    for r in range(1,int(count/per_page)+1):
        log.info('fetching data: %s - %s %0.1f%%' % ((r - 1) * per_page,r * per_page,(i/count)*100,))
        scenes=stash.find_scenes(f={"stash_id":{"value":"","modifier":"NOT_NULL"},"has_markers":"false"},filter={"page":r,"per_page": per_page})
        for s in scenes:
            processScene(s)
            i=i+1
            log.progress((i/count))
            time.sleep(2)

def submit():
    scene_fgmt = """title
       details
       url
       date
       performers{
           name
           stash_ids{
              endpoint
              stash_id
           }
       }
       tags{
           name
       }
       studio{
           name
           stash_ids{
              endpoint
              stash_id
           }
       }
       stash_ids{
           endpoint
           stash_id
       }
       scene_markers{
           title
           seconds
           primary_tag{
              name
           }
       }"""
    count = stash.find_scenes(f={"has_markers": "true"}, filter={"per_page": 1}, get_count=True)[0]
    i=0
    for r in range(1, math.ceil(count/per_page) + 1):
        log.info('submitting scenes: %s - %s %0.1f%%' % ((r - 1) * per_page,r * per_page,(i/count)*100,))
        scenes = stash.find_scenes(f={"has_markers": "true"}, filter={"page": r, "per_page": per_page},fragment=scene_fgmt)
        for s in scenes:
            log.debug("submitting scene: " + str(s))
            request_s.post('https://timestamp.trade/submit-stash', json=s)
            i=i+1
            log.progress((i/count))
            time.sleep(2)



json_input = json.loads(sys.stdin.read())
FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)
if 'mode' in json_input['args']:
    PLUGIN_ARGS = json_input['args']["mode"]
    if 'submit' in PLUGIN_ARGS:
        submit()
    elif 'process' in PLUGIN_ARGS:
        processAll()
elif 'hookContext' in json_input['args']:
    id=json_input['args']['hookContext']['id']
    scene=stash.find_scene(id)
    processScene(scene)
