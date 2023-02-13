import requests

import log

DB_VERSION_FILE_REFACTOR = 32
DB_VERSION_SCENE_STUDIO_CODE = 38

FILE_QUERY_REFACTOR = """
            files {
                path
                video_codec
                audio_codec
                width
                height
                frame_rate
                duration
                bit_rate
                fingerprints {
                    type
                    value
                }
            }
    """
FILE_QUERY_OLD = """
            path
            file {
                video_codec
                audio_codec
                width
                height
                framerate
                bitrate
                duration
            }
    """


class Query:
    """
    Query class implements all graphql query related logic
    """

    def __init__(self, host: str, scheme: str, port: str, session: str):
        self.host = host
        self.scheme = scheme
        self.port = port
        self.session = session
        self.file_query = FILE_QUERY_REFACTOR  # by default support FR builds

    def set_file_query(self) -> None:
        """
        set the file query that will be used by the class
        depending on the database version of stash
        """
        db = self.get_build()
        if db < DB_VERSION_FILE_REFACTOR:
            self.file_query = FILE_QUERY_OLD  # use prior to FR file query
        if db >= DB_VERSION_SCENE_STUDIO_CODE:
            self.file_query = f"        code{self.file_query}"  # add code field to query

    def call_graphql(self, query, variables=None) -> dict:
        """
        execute the graphql query with the given variables
        """
        graphql_port = self.port
        graphql_scheme = self.scheme
        graphql_cookies = {'session': self.session}
        graphql_headers = {
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Connection": "keep-alive",
            "DNT": "1"
        }
        graphql_domain = self.host
        if graphql_domain == "0.0.0.0":
            graphql_domain = "localhost"
        # Stash GraphQL endpoint
        graphql_url = f"{graphql_scheme}://{graphql_domain}:{graphql_port}/graphql"

        json = {'query': query}
        if variables is not None:
            json['variables'] = variables
        try:
            response = requests.post(graphql_url,
                                     json=json,
                                     headers=graphql_headers,
                                     cookies=graphql_cookies,
                                     timeout=20)
        except Exception as exc_err:
            log.LogError(f"[FATAL] Error with the graphql request {exc_err}")
            raise ConnectionError(
                f"[FATAL] Error with the graphql request {exc_err}"
            ) from exc_err
        if response.status_code == 200:
            result = response.json()
            if result.get("error"):
                for error in result["error"]["errors"]:
                    raise Exception(f"GraphQL error: {error}")
                return None
            if result.get("data"):
                return result.get("data")
        elif response.status_code == 401:
            log.LogError("HTTP Error 401, Unauthorised.")
            raise ConnectionError("HTTP Error 401, Unauthorised.")
        else:
            raise ConnectionError(
                f"GraphQL query failed: {response.status_code} - {response.content}"
            )
        return None

    def get_scene(self, scene_id):
        """
        get scene data from scene_id
        """
        query = """
        query FindScene($id: ID!, $checksum: String) {
            findScene(id: $id, checksum: $checksum) {
                ...SceneData
            }
        }
        fragment SceneData on Scene {
            id
            oshash
            checksum
            title
            date
            rating
            stash_ids {
                endpoint
                stash_id
            }
            organized""" + self.file_query + """
            studio {
                id
                name
                parent_studio {
                    id
                    name
                }
            }
            tags {
                id
                name
            }
            performers {
                id
                name
                gender
                favorite
                rating
                stash_ids{
                    endpoint
                    stash_id
                }
            }
            movies {
                movie {
                    name
                    date
                }
                scene_index
            }
        }
        """
        variables = {"id": scene_id}
        result = self.call_graphql(query, variables)
        return result.get('findScene')

    def find_scene(self, per_page: int, page=1, direc="DESC") -> dict:
        """
        return all scenes
        used for bulk searches
        """
        query = """
        query FindScenes($filter: FindFilterType) {
            findScenes(filter: $filter) {
                count
                scenes {
                    ...SlimSceneData
                }
            }
        }
        fragment SlimSceneData on Scene {
            id
            oshash
            checksum
            title
            date
            rating
            organized
            stash_ids {
                endpoint
                stash_id
            }
        """ + self.file_query + """
            studio {
                id
                name
                parent_studio {
                    id
                    name
                }
            }
            tags {
                id
                name
            }
            performers {
                id
                name
                gender
                favorite
                rating
                stash_ids{
                    endpoint
                    stash_id
                }
            }
            movies {
                movie {
                    name
                    date
                }
                scene_index
            }
        }
        """
        # ASC DESC
        variables = {
            'filter': {
                "direction": direc,
                "page": page,
                "per_page": per_page,
                "sort": "updated_at"
            }
        }
        result = self.call_graphql(query, variables)
        return result.get("findScenes")

    def find_scene_by_path(self, path, modifier) -> dict:
        """
        find all scenes in path with modifier
        used to search for duplicates when renaming
        """
        query = """
        query FindScenes($filter: FindFilterType, $scene_filter: SceneFilterType) {
            findScenes(filter: $filter, scene_filter: $scene_filter) {
                count
                scenes {
                    id
                    title
                }
            }
        }
        """
        # ASC DESC
        variables = {
            'filter': {
                "direction": "ASC",
                "page": 1,
                "per_page": 40,
                "sort": "updated_at"
            },
            "scene_filter": {
                "path": {
                    "modifier": modifier,
                    "value": path
                }
            }
        }
        result = self.call_graphql(query, variables)
        return result.get("findScenes")

    def get_configuration(self) -> dict:
        """
        return stash configuration
        used to get the database path
        """
        query = """
            query Configuration {
                configuration {
                    general {
                        databasePath
                    }
                }
            }
        """
        result = self.call_graphql(query)
        return result.get('configuration')

    def get_studio(self, studio_id) -> dict:
        """
        return studio with studio_id
        """
        query = """
            query FindStudio($id:ID!) {
                findStudio(id: $id) {
                    id
                    name
                        parent_studio {
                        id
                        name
                    }
                }
            }
        """
        variables = {"id": studio_id}
        result = self.call_graphql(query, variables)
        return result.get("findStudio")

    def remove_scenes_tag(self, id_scenes: list, id_tags: list) -> dict:
        """
        bulk remove tags in id_tags list from studios with ids in id_scenes
        """
        query = """
        mutation BulkSceneUpdate($input: BulkSceneUpdateInput!) {
            bulkSceneUpdate(input: $input) {
                id
            }
        }
        """
        variables = {
            'input': {
                "ids": id_scenes,
                "tag_ids": {
                    "ids": id_tags,
                    "mode": "REMOVE"
                }
            }
        }
        result = self.call_graphql(query, variables)
        return result

    def get_build(self) -> int:
        """
        return stash's database version
        """
        query = """
            {
                systemStatus {
                    databaseSchema
                }
            }
        """
        result = self.call_graphql(query)
        return result['systemStatus']['databaseSchema']

    def checking_duplicate_db(self, scene_info: dict) -> bool:
        """
        check for duplicate filenames
        """
        scenes = self.find_scene_by_path(scene_info['final_path'], "EQUALS")
        if scenes["count"] > 0:
            log.LogError("Duplicate path detected")
            for dupl_row in scenes["scenes"]:
                log.LogWarning(f"Identical path: [{dupl_row['id']}]")
            return True
        scenes = self.find_scene_by_path(scene_info['new_filename'], "EQUALS")
        if scenes["count"] > 0:
            for dupl_row in scenes["scenes"]:
                if dupl_row['id'] != scene_info['scene_id']:
                    log.LogWarning(f"Duplicate filename: [{dupl_row['id']}]")
        return False
