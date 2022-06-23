import json
import sys
import re
import requests

import log

FRAGMENT = json.loads(sys.stdin.read())
FRAGMENT_SERVER = FRAGMENT["server_connection"]
PLUGINS_ARGS = FRAGMENT['args']['mode']


def callGraphQL(query, variables=None, raise_exception=True):
    # Session cookie for authentication
    graphql_port = FRAGMENT_SERVER['Port']
    graphql_scheme = FRAGMENT_SERVER['Scheme']
    graphql_cookies = {
        'session': FRAGMENT_SERVER.get('SessionCookie').get('Value')
    }
    graphql_headers = {
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "DNT": "1"
    }
    graphql_domain = 'localhost'
    # Stash GraphQL endpoint
    graphql_url = graphql_scheme + "://" + graphql_domain + ":" + str(
        graphql_port) + "/graphql"

    json = {
        'query': query
    }
    if variables is not None:
        json['variables'] = variables
    try:
        response = requests.post(
            graphql_url,
            json=json,
            headers=graphql_headers,
            cookies=graphql_cookies
            )
    except Exception as e:
        exit_plugin(err="[FATAL] Exception with GraphQL request. {}".format(e))
    if response.status_code == 200:
        result = response.json()
        if result.get("error"):
            for error in result["error"]["errors"]:
                if raise_exception:
                    raise Exception("GraphQL error: {}".format(error))
                else:
                    log.LogError("GraphQL error: {}".format(error))
            return None
        if result.get("errors"):
            for error in result["errors"]:
                if raise_exception:
                    raise Exception("GraphQL error: {}".format(error))
                else:
                    log.LogError("GraphQL error: {}".format(error))
            return None
        if result.get("data"):
            return result.get("data")
    elif response.status_code == 401:
        exit_plugin(err="HTTP Error 401, Unauthorised.")
    else:
        raise ConnectionError("GraphQL query failed:{} - {}".format(response.status_code, response.content))


def graphql_duplicateScenes(distance: int) -> list:
    query = """
    query FindDuplicateScenes($distance: Int) {
        findDuplicateScenes(distance: $distance) {
            ...SlimSceneData
        }
    }
    fragment SlimSceneData on Scene {
        id
        title
        path
        file_mod_time
        file {
            size
            height
        }
    }

    """
    variables = {
        "distance": distance
    }
    result = callGraphQL(query, variables)
    return result["findDuplicateScenes"]


def exit_plugin(msg=None, err=None):
    if msg is None and err is None:
        msg = "plugin ended"
    output_json = {
        "output": msg,
        "error": err
    }
    print(json.dumps(output_json))
    sys.exit()


def createTagWithName(name):
    query = """
        mutation tagCreate($input:TagCreateInput!) {
            tagCreate(input: $input){
                id
            }
        }
    """
    variables = {'input': {
        'name': name
    }}

    result = callGraphQL(query, variables)
    return result["tagCreate"]["id"]


def destroyTag(tag_id):
    query = """
        mutation tagDestroy($input: TagDestroyInput!) {
            tagDestroy(input: $input)
        }
    """
    variables = {'input': {
        'id': tag_id
    }}

    callGraphQL(query, variables)


def findTagIdWithName(name):
    query = """
        query {
            allTags {
            id
            name
            }
        }
    """

    result = callGraphQL(query)

    for tag in result["allTags"]:
        if tag["name"] == name:
            return tag["id"]
    return None


def tag_files(group):
    tag_keep = findTagIdWithName('[Dupe: Keep]')
    tag_remove = findTagIdWithName('[Dupe: Remove]')

    log.LogInfo("==========")
    scenelist = {"sceneid": 0, "height": 0, "size": 0, "file_mod_time": '', "title": '', "path": ''}

    for scene in group:
        scene['path'] = re.search(r'(.*/)', scene['path']).group(1)
        if scene['file']['height'] > scenelist['height']:
            if scenelist['height']:
                log.LogInfo(f"Selecting {scene['id']} due to Height ({scene['file']['height']} > {scenelist['height']})")
            scenelist['sceneid'] = scene['id']
            scenelist['file_mod_time'] = scene['file_mod_time']
            scenelist['height'] = scene['file']['height']
            scenelist['size'] = scene['file']['size']
            scenelist['title'] = scene['title']
            scenelist['path'] = scene['path']
        elif scene['file']['height'] == scenelist['height']:
            if scene['file']['size'] > scenelist['size']:
                if scenelist['size']:
                    log.LogInfo(f"Both files are same resolution ({scene['file']['height']}) so continuing")
                    log.LogInfo(f"Selecting {scene['id']} due to Size ({scene['file']['size']} > {scenelist['size']})")
                scenelist['sceneid'] = scene['id']
                scenelist['file_mod_time'] = scene['file_mod_time']
                scenelist['height'] = scene['file']['height']
                scenelist['size'] = scene['file']['size']
                scenelist['title'] = scene['title']
                scenelist['path'] = scene['path']
            elif scene['file']['size'] == scenelist['size']:
                if scene['file_mod_time'] < scenelist['file_mod_time']:
                    if scenelist['file_mod_time']:
                        log.LogInfo(f"Both files are same resolution ({scene['file']['height']}) and same size ({scene['file']['size']}) so continuing")
                        log.LogInfo(f"Selecting {scene['id']} due to File Mod Time ({scene['file_mod_time']} < {scenelist['file_mod_time']})")
                    scenelist['sceneid'] = scene['id']
                    scenelist['file_mod_time'] = scene['file_mod_time']
                    scenelist['height'] = scene['file']['height']
                    scenelist['size'] = scene['file']['size']
                    scenelist['title'] = scene['title']
                    scenelist['path'] = scene['path']
        if scenelist['sceneid'] != scene['id']:
            log.LogInfo(f"Kept initial pick.  Rem: ({scene['file']['height']} / {scene['file']['size']} / {scene['file_mod_time']}) Kept: ({scenelist['height']} / {scenelist['size']} / {scenelist['file_mod_time']})")
    log.LogInfo(F"Keeping:  {str(scenelist)}")
    keeptitle = f"[Dupe: {scenelist['sceneid']}K] {scenelist['title']}"
    keepquery = 'mutation BulkSceneUpdate(){bulkSceneUpdate(input: {ids: [' + str(scenelist['sceneid']) + '], tag_ids:{ids: [' + str(tag_keep) + '], mode: ADD}, title: "' + keeptitle.replace('"', '\\"') + '"}) {id}}'
    callGraphQL(keepquery)
    for scene in group:
        if scene['id'] != scenelist['sceneid']:
            scratchscene = {"sceneid": scene['id'], "height": scene['file']['height'], "size": scene['file']['size'], "file_mod_time": scene['file_mod_time'], "title": scene['title'], "path": scene['path']}
            log.LogInfo(f"Removing: {str(scratchscene)}")
            removetitle = f"[Dupe: {scenelist['sceneid']}R] {scenelist['title']}"
            removequery = 'mutation BulkSceneUpdate(){bulkSceneUpdate(input: {ids: [' + str(scene['id']) + '], tag_ids:{ids: [' + str(tag_remove) + '], mode: ADD}, title: "' + removetitle.replace('"', '\\"') + '"}) {id}}'
            callGraphQL(removequery)
            scratchscene.clear()
    scenelist = {"sceneid": 0, "height": 0, "size": 0, "file_mod_time": '', "title": ''}


def clean_titles():
    cleanquery = 'query findScenes(){findScenes(scene_filter: {title: {value: "[Dupe: ", modifier: INCLUDES}}, filter: {per_page: -1}){scenes{id title}}}'
    scenelist = callGraphQL(cleanquery)
    scenelist = scenelist['findScenes']['scenes']
    for scene in scenelist:
        title = re.sub(r'\[Dupe: \d+[KR]\] ', '', scene['title'])
        sceneid = scene['id']
        log.LogInfo(f"Removing Dupe Title String from: [{sceneid}] {scene['title']}")
        stripquery = 'mutation BulkSceneUpdate(){bulkSceneUpdate(input: {ids: [' + sceneid + '], title: "' + title.replace('"', '\\"') + '"}) {id}}'
        callGraphQL(stripquery)


# Distance;
if PLUGINS_ARGS == "create":
    createTagWithName('[Dupe: Keep]')
    createTagWithName('[Dupe: Remove]')

if PLUGINS_ARGS == "remove":
    tagid = findTagIdWithName('[Dupe: Keep]')
    destroyTag(tagid)
    tagid = findTagIdWithName('[Dupe: Remove]')
    destroyTag(tagid)

if PLUGINS_ARGS == "tagexact":
    distance = 0
    duplicate_list = graphql_duplicateScenes(distance)
    log.LogInfo("There is {} sets of duplicates found.".format(len(duplicate_list)))

    for group in duplicate_list:
        tag_files(group)

if PLUGINS_ARGS == "taghigh":
    distance = 3
    duplicate_list = graphql_duplicateScenes(distance)
    log.LogInfo("There is {} sets of duplicates found.".format(len(duplicate_list)))

    for group in duplicate_list:
        tag_files(group)

if PLUGINS_ARGS == "tagmid":
    distance = 6
    duplicate_list = graphql_duplicateScenes(distance)
    log.LogInfo("There is {} sets of duplicates found.".format(len(duplicate_list)))

    for group in duplicate_list:
        tag_files(group)

if PLUGINS_ARGS == "cleantitle":
    clean_titles()

exit_plugin("Plugin ended correctly.")
