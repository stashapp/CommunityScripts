import stashapi.log as log
from stashapi.stashapp import StashInterface
import stashapi.marker_parse as mp
import os
import sys
import requests
import json

per_page = 100

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
                    log.debug('-- ' + m['name'] + ", " + str(m['start'] / 1000))
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
    for r in range(1,int(count/per_page)+1):
        log.info('processing '+str(r*per_page)+ ' - '+str(count))
        scenes=stash.find_scenes(f={"stash_id":{"value":"","modifier":"NOT_NULL"},"has_markers":"false"},filter={"page":r,"per_page": per_page})
        for s in scenes:
            processScene(s)

def submit():
    count = stash.find_scenes(f={"has_markers": "true"}, filter={"per_page": 1}, get_count=True)[0]
    for r in range(1, int(count / per_page) + 2):
        log.info('processing ' + str((r - 1) * per_page) + ' - ' + str(r * per_page) + ' / ' + str(count))
        scenes = stash.find_scenes(f={"has_markers": "true"}, filter={"page": r, "per_page": per_page})
        for s in scenes:
            # Cleanup, remove fields that are not needed by the api like ratings, file paths etc
            for x in ['id', 'checksum', 'oshash', 'phash', 'rating', 'organized', 'o_counter', 'file','path', 'galleries']:
                s.pop(x, None)
            for t in s['tags']:
                for x in ['id', 'image_path', 'scene_count', 'primary_tag']:
                    t.pop(x, None)
            for t in s['performers']:
                for x in ['id', 'checksum', 'scene_count', 'image_path', 'image_count', 'gallery_count', 'favorite',
                          'tags']:
                    t.pop(x, None)
            for m in s['scene_markers']:
                for x in ['id', 'scene', 'tags']:
                    m.pop(x, None)
                for x in ['id', 'aliases', 'image_path', 'scene_count']:
                    m['primary_tag'].pop(x, None)

            print("submitting scene: " + str(s))
            requests.post('https://timestamp.trade/submit-stash', json=s)





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
