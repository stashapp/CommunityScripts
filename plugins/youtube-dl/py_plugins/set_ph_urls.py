import os
import json
import sys
import log
from stash_interface import StashInterface


def main():
    json_input = readJSONInput()

    client = StashInterface(json_input.get('server_connection'))
    add_ph_urls(client)

    output = {
        'output': 'ok'
    }

    print(json.dumps(output) + '\n')


def readJSONInput():
    json_input = sys.stdin.read()
    return json.loads(json_input)


def add_ph_urls(client):
    count = 0

    scenes = client.findScenesByPathRegex(
        r"(ph[a-z0-9]{13}\.(?:[mM][pP]4|[wW][mM][vV]\S))$"
    )

    for scene in scenes:
        if scene.get('url') is None or scene.get('url') == "":
            try:
                ph_id = os.path.splitext(scene.get('path').split('ph')[1])[0]
            except IndexError:
                log.LogDebug(f"Error, skipping scene {scene.get('id')}")
                continue
            url = f"https://www.pornhub.com/view_video.php?viewkey=ph{ph_id}"

            scene_data = {
                'id': scene.get('id'),
                'url': url
            }

            # Required, would be cleared otherwise
            if scene.get('rating'):
                scene_data['rating'] = scene.get('rating')

            tag_ids = []
            for t in scene.get('tags'):
                tag_ids.append(t.get('id'))
            scene_data['tag_ids'] = tag_ids

            performer_ids = []
            for p in scene.get('performers'):
                performer_ids.append(p.get('id'))
            scene_data['performer_ids'] = performer_ids

            if scene.get('studio'):
                scene_data['studio_id'] = scene.get('studio').get('id')

            if scene.get('gallery'):
                scene_data['gallery_id'] = scene.get('gallery').get('id')

            if scene.get('rating'):
                scene_data['rating'] = scene.get('rating')

            client.updateScene(scene_data)
            log.LogDebug(f'Set url for scene {scene.get("id")}')
            count += 1

    log.LogInfo(f"Set urls for {count} scene(s)")


main()
