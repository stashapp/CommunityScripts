import requests
import sys
import re
import log


class StashInterface:
    port = ""
    url = ""
    headers = {
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "DNT": "1"
    }
    cookies = {}

    def __init__(self, conn, fragments={}):
        self.port = conn['Port']
        scheme = conn['Scheme']

        # Session cookie for authentication
        self.cookies = {
            'session': conn.get('SessionCookie').get('Value')
        }

        domain = conn.get('Domain') if conn.get('Domain') else 'localhost'

        # Stash GraphQL endpoint
        self.url = scheme + "://" + domain + ":" + str(self.port) + "/graphql"
        log.debug(f"Using stash GraphQl endpoint at {self.url}")

        self.fragments = fragments
        self.fragments.update(stash_gql_fragments)

    def __resolveFragments(self, query):

        fragmentRefrences = list(set(re.findall(r'(?<=\.\.\.)\w+', query)))
        fragments = []
        for ref in fragmentRefrences:
            fragments.append({
                "fragment": ref,
                "defined": bool(re.search("fragment {}".format(ref), query))
            })

        if all([f["defined"] for f in fragments]):
            return query
        else:
            for fragment in [f["fragment"] for f in fragments if not f["defined"]]:
                if fragment not in self.fragments:
                    raise Exception(f'GraphQL error: fragment "{fragment}" not defined')
                query += self.fragments[fragment]
            return self.__resolveFragments(query)

    def __callGraphQL(self, query, variables=None):

        query = self.__resolveFragments(query)

        json = {'query': query}
        if variables is not None:
            json['variables'] = variables

        response = requests.post(self.url, json=json, headers=self.headers, cookies=self.cookies)

        if response.status_code == 200:
            result = response.json()
            if result.get("error", None):
                for error in result["error"]["errors"]:
                    raise Exception("GraphQL error: {}".format(error))
            if result.get("data", None):
                return result.get("data")
        elif response.status_code == 401:
            sys.exit("HTTP Error 401, Unauthorised. Cookie authentication most likely failed")
        else:
            raise ConnectionError(
                "GraphQL query failed:{} - {}. Query: {}. Variables: {}".format(
                    response.status_code, response.content, query, variables)
            )



    def get_scenes_id(self, filter={}):
        query = """
        query FindScenes($filter: FindFilterType, $scene_filter: SceneFilterType, $scene_ids: [Int!]) {
            findScenes(filter: $filter, scene_filter: $scene_filter, scene_ids: $scene_ids) {
                count
                scenes {
                    id
                }
            }
        }
        """
        variables = {
            "filter": { "per_page": -1 },
            "scene_filter": filter
        }
            
        result = self.__callGraphQL(query, variables)
        scene_ids = [s["id"] for s in result.get('findScenes').get('scenes')] 

        return scene_ids

    def update_scene(self, scene_data):
        query = """
            mutation SceneUpdate($input:SceneUpdateInput!) {
                sceneUpdate(input: $input) {
                    id
                }
            }
        """
        variables = {'input': scene_data}

        result = self.__callGraphQL(query, variables)
        return result["sceneUpdate"]["id"]

    def get_root_paths(self):
        query = """
            query Configuration {
                configuration {
                    general{
                        stashes{
                            path
                            excludeVideo
                        }
                    }
                }
            }
        """
        result = self.__callGraphQL(query)

        stashes = result["configuration"]["general"]["stashes"]
        paths = [s["path"] for s in stashes if not s["excludeVideo"]] 

        return paths

stash_gql_fragments = {}