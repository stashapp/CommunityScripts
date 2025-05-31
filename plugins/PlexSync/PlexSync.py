import stashapi.log as log
import re
from stashapi.stashapp import StashInterface
import sys
import json
import unidecode
import requests


def processScene(scene):
    tags = []

    if settings["skipUnorganized"] and not scene['organized']: # don't process scenes that aren't marked organized.
        log.info("Not organized, bye!")
        sys.exit()


    if settings["tagStashIDs"]:
        if not scene["stash_ids"]: # Tagging empty Stash ID
            tags.append(empty_stashid)

        for stashbox in scene["stash_ids"]: # Add all the stashbox ID tags
            url = stashbox['endpoint']
            if (url == "https://stashdb.org/graphql"):
                tags.append(int(settings["tagID_stashdb"]))

            if (url == "https://pmvstash.org/graphql"):
                tags.append(int(settings["tagID_pmvstash"]))

            if (url == "https://theporndb.net/graphql"):
                tags.append(int(settings["tagID_porndb"]))

            if (url == "https://fansdb.cc/graphql"):
                tags.append(int(settings["tagID_fansdb"]))

            if (url == "https://javstash.org/graphql"):
                tags.append(int(settings["tagID_javstash"]))

        if (len(tags) != 0):
            for x in scene['tags']:
                if (int(x['id']) in tags):
                    log.debug(f"We already have the tag {x['id']} from {tags}")
                    tags.remove(int(x['id']))

            if tags: # Just a double check that we still have pending tags to add
                log.info(f"Adding the stashbox tags {tags} to scene {scene['title']}")
                stash.update_scenes({"ids": scene["id"], "tag_ids": {"mode": "ADD", "ids": tags}})


    if settings["cleanTitles"]:
        if scene['title']: # Lots of title fixing.  It's messy, but works good to remove weird characters and other improvements.
            new_title = unidecode.unidecode(scene['title'], errors='ignore') # NB!!: Cyrillic and such gets changed to "normal" characters.
            new_title = re.sub('^( | |@|\')+', "", new_title)
            new_title = re.sub(' +$', "", new_title)
            new_title = re.sub('^!+', "", new_title)
            new_title = re.sub("^\\?+", "", new_title)
            new_title = re.sub("^\\*+", "", new_title)
            new_title = re.sub('^The ("|\')', 'The ', new_title)
            new_title = re.sub('^A ("|\')', 'A ', new_title)
            new_title = re.sub(' (Wmv|Mp4|Mov|Qt|HD)$', '', new_title)
            new_title = re.sub('^[^A-Za-z0-9]', '', new_title)
            new_title = re.sub('^( )', '', new_title)
            if not (new_title == scene['title']):
                log.info(f"New title: {new_title} from {scene['title']}")
                if (new_title == ""):
                    new_title = "ZZZ Invalid Title"
                stash.update_scenes({"ids": scene["id"], "title": new_title})


    if scene["urls"]: # If scene contains Plex URL, refresh Plex metadata
        for urls in reversed(scene["urls"]): # todo: remove reversed(); this was a quickfix for when a scene somehow got two plex urls - the most recent url is most likely the most "valid"
            if ("/library/metadata/" in urls):
                plexurl = urls.replace("plex", "https://" + settings["plexHost"] + ":" + settings["plexPort"])
                plexurl += "/refresh?X-Plex-Token=" + settings["plexToken"]
                log.info(f"Refreshing scene on Plex via {plexurl}")
                try:
                    requests.packages.urllib3.disable_warnings() # TLS errors are irrelevant when I'm on localhost...
                    r = requests.put(plexurl, verify=False)
                    r.raise_for_status()
                except requests.exceptions.HTTPError as e:
                    log.error(f"Plex API failed: {e.response.text}")

    return


json_input = json.loads(sys.stdin.read())
FRAGMENT_SERVER = json_input["server_connection"]
stash = StashInterface(FRAGMENT_SERVER)

config = stash.get_configuration()
settings = {
    "plexToken": "YOUR_PLEX_TOKEN_HERE",
    "plexHost": "localhost",
    "plexPort": "32400",
    "tagStashIDs": False,
    "skipUnorganized": True,
    "cleanTitles": True,
    "tagID_emptystashid": "1",
    "tagID_stashdb": "2",
    "tagID_pmvstash": "3",
    "tagID_porndb": "4",
    "tagID_fansdb": "5",
    "tagID_javstash": "6"
}
if "PlexSync" in config["plugins"]:
    settings.update(config["plugins"]["PlexSync"])

if "hookContext" in json_input["args"]:
    id = json_input["args"]["hookContext"]["id"]
    if (
        json_input["args"]["hookContext"]["type"] == "Scene.Update.Post"
        or "Scene.Create.Post"
    ):
        #log.info(f"We run with {json_input}") # Uncomment for debugging what's sent to Stash
        exit = False
        request_tags = []
        stashbox_tags = []
        stashbox_tags.append(frozenset(
            {
                int(settings["tagID_stashdb"]),
                int(settings["tagID_pmvstash"]),
                int(settings["tagID_porndb"]),
                int(settings["tagID_fansdb"]),
                int(settings["tagID_javstash"])
            }))

        if "tag_ids" in json_input["args"]["hookContext"]["inputFields"]:
            request_tags = json_input["args"]["hookContext"]["input"]["tag_ids"]
            if set(request_tags) & set(stashbox_tags): # prevent rerunning tag addition, when the update is simply adding the tags
                log.info("Already have correct tags.")
                exit = True
            else:
                exit = False

        if "urls" in json_input["args"]["hookContext"]["inputFields"]:
            if len(json_input["args"]["hookContext"]["inputFields"]) == 2: # Hacky fix; Plex agent sends only two fields, so in this case we won't update metadata there again. Stash UI etc usually sends all fields in update, so no worries.
                log.info("Got new Plex URL, will not refresh.")
                exit = True
            else:
                exit = False

        if exit == True:
            log.info("Nothing to do, exiting.")
            sys.exit()

        scene = stash.find_scene(id)
        processScene(scene)
