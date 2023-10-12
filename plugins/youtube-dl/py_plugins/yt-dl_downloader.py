import yt_dlp
import log
import configparser
import pathlib
import re
import sys
import json
import os
import shutil

from stash_interface import StashInterface

current_path = str(pathlib.Path(__file__).parent.absolute())
plugin_folder = str(pathlib.Path(current_path + '/../yt-dl_downloader/').absolute())
downloaded_json = os.path.join(plugin_folder, "downloaded.json")
downloaded_backup_json = os.path.join(plugin_folder, "downloaded_backup.json")

def main():
    json_input = read_json_input()

    output = {}
    run(json_input, output)

    out = json.dumps(output)
    print(out + "\n")


def read_json_input():
    json_input = sys.stdin.read()
    return json.loads(json_input)


def run(json_input, output):
    mode_arg = json_input['args']['mode']

    try:
        client = StashInterface(json_input["server_connection"])
        if mode_arg == "" or mode_arg == "download":
            read_urls_and_download(client)
            client.scan_for_new_files()
        elif mode_arg == "tag":
            tag_scenes(client)
    except Exception:
        raise

    output["output"] = "ok"


def tag_scenes(client):
    if not os.path.isfile(downloaded_json) and os.path.isfile(downloaded_backup_json):
        shutil.copyfile(downloaded_backup_json, downloaded_json)
    with open(downloaded_json) as json_file:
        data = json.load(json_file)
        regex = r'([a-zA-Z0-9]+).*\.(?:[mM][pP]4|[wW][mM][vV])$'
        scenes = client.findScenesByPathRegex(regex)

        total = len(scenes)
        i = 0
        for scene in scenes:
            i += 1
            log.LogProgress(i/total)
            log.LogDebug(os.path.join("ScenePath", scene.get('path')))
            basename = os.path.basename(scene.get('path'))
            filename = os.path.splitext(basename)[0]

            found_video = None
            for video in data:
                if video['id'] in filename:
                    found_video = video
                    break
            if found_video is not None:
                scene_data = {
                    'id': scene.get('id'),
                    'url': video['url'],
                    'title': video['title']
                }

                # Required, would be cleared otherwise
                if scene.get('rating'):
                    scene_data['rating'] = scene.get('rating')

                tag_ids = []
                for t in scene.get('tags'):
                    tag_ids.append(t.get('id'))
                tag_ids.append(get_scrape_tag(client))
                if video.get('tags') is not None:
                    for tag in video.get('tags'):
                        returned_tag_id = client.findTagIdWithName(tag)
                        if returned_tag_id != None:
                            tag_ids.append(returned_tag_id)
                scene_data['tag_ids'] = tag_ids

                performer_ids = []
                for p in scene.get('performers'):
                    performer_ids.append(p.get('id'))
                if video.get('performers') is not None:
                    for performer in video.get('performers'):
                        performer_ids.append(client.findPerformerIdWithName(performer.get('given_name')))
                scene_data['performer_ids'] = performer_ids

                if video.get('studio').get('url') is not None:
                    scene_data['studio_id'] = client.findStudioIdWithUrl(video.get('studio').get('url'))
                elif scene.get('studio'):
                    scene_data['studio_id'] = scene.get('studio').get('id')

                if scene.get('gallery'):
                    scene_data['gallery_id'] = scene.get('gallery').get('id')

                if scene.get('rating'):
                    scene_data['rating'] = scene.get('rating')
                client.updateScene(scene_data)


def get_scrape_tag(client):
    tag_name = "scrape"
    tag_id = client.findTagIdWithName(tag_name)
    if tag_id is not None:
        return tag_id
    else:
        client.createTagWithName(tag_name)
        tag_id = client.findTagIdWithName(tag_name)
        return tag_id


def read_urls_and_download(client):
    with open(os.path.join(plugin_folder, 'urls.txt'), 'r') as url_file:
        urls = url_file.readlines()
    downloaded = []
    total = len(urls)
    i = 0
    for url in urls:
        i += 1
        log.LogProgress(i/total)
        if check_url_valid(url.strip()):
            download(url.strip(), downloaded)
            add_tags(client, downloaded[len(downloaded)-1].get('tags'))
            add_performers(client, downloaded[len(downloaded)-1].get('performers'))
            add_studio(client, downloaded[len(downloaded)-1].get('studio'))
    if os.path.isfile(downloaded_json):
        shutil.move(downloaded_json, downloaded_backup_json)
    with open(downloaded_json, 'w') as outfile:
        json.dump(downloaded, outfile)


def check_url_valid(url):
    regex = re.compile(
        r'^(?:http|ftp)s?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain...
        r'localhost|'  # localhost...   
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)

    return re.match(regex, url) is not None


def download(url, downloaded):
    config_path = os.path.join(plugin_folder, 'config.ini')
    log.LogDebug(f"Reading config file at: {config_path}")
    config = configparser.ConfigParser()
    config.read(config_path)
    ytdl_options = {}
    ytdl_options_to_dict(config.items('YTDL_OPTIONS'), ytdl_options)
    download_dir = str(pathlib.Path(config.get('PATHS', 'downloadDir') + '/%(id)s.%(ext)s').absolute())
    log.LogDebug("Downloading " + url + " to: " + download_dir)

    ydl = yt_dlp.YoutubeDL({
        'outtmpl': download_dir,
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        **ytdl_options,
    })

    with ydl:
        try:
            meta = ydl.extract_info(url=url, download=True)
            log.LogDebug(meta['id'])
            log.LogDebug("Download finished!")
            downloaded.append({
                "url": url,
                "id": meta.get('id'),
                "title": meta.get('title'),
                "tags": meta.get('tags'),
                "studio": {
                    "name": meta.get('uploader_id'),
                    "url": meta.get('uploader_url'),
                },
                "performers": meta.get('actors'),
            })
        except Exception as e:
            log.LogWarning(str(e))
    

def ytdl_options_to_dict(tup, di):
    for a, b in tup:
        di.setdefault(a, bool(b))
    return di


def add_tags(client, tags):
  if tags is not None:
    for tag in tags:
        tag_id = client.findTagIdWithName(tag)
        
        if tag_id is None:
            client.createTagWithName(tag)
            log.LogInfo("Tag created successfully")
        else:
            log.LogInfo("Tag already exists")



def add_performers(client, performers):
    if performers is not None:
        for performer in performers:
            performer_id = client.findPerformerIdWithName(performer.get('given_name'))

            if performer_id is None:
                client.createPerformerByName(performer.get('given_name'))
                log.LogInfo('Performer created successfully')
            else:
                log.LogInfo('Performer already exists')


def add_studio(client, studio):
    if studio.get('url') is not None:
        studio_id = client.findStudioIdWithUrl(studio.get('url'))

        if studio_id is None:
            client.createStudio(studio.get('name'), studio.get('url'))
            log.LogInfo('Studio created successfully')
        else:
            log.LogInfo('Studio already exists')
    elif studio.get('name') is not None:
        studio_id = client.findStudiosWithName(studio.get('name'))

        if studio_id is None:
            client.createStudio(studio.get('name'), studio.get('url'))
            log.LogInfo('Studio created successfully')
        else:
            log.LogInfo('Studio already exists')


main()
