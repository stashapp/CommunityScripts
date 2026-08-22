import requests


class StashInterface:
    def __init__(self, conn):
        scheme = conn.get("Scheme", "http")
        host = conn.get("Host", "localhost")
        port = conn.get("Port", 9999)
        self.base_url = f"{scheme}://{host}:{port}"
        self.graphql_url = f"{self.base_url}/graphql"
        self.session = requests.Session()
        cookie = conn.get("SessionCookie") or {}
        if cookie.get("Name") and cookie.get("Value"):
            self.session.cookies.set(cookie["Name"], cookie["Value"])
        api_key = conn.get("ApiKey") or ""
        if api_key:
            self.session.headers["ApiKey"] = api_key

    def call_gql(self, query, variables=None):
        payload = {"query": query}
        if variables:
            payload["variables"] = variables
        resp = self.session.post(self.graphql_url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        if "errors" in data:
            raise Exception(f"GraphQL errors: {data['errors']}")
        return data.get("data")

    def fetch_bytes(self, url):
        if url.startswith("/"):
            url = self.base_url + url
        resp = self.session.get(url)
        resp.raise_for_status()
        return resp.content

    def get_plugin_config(self):
        query = "query { configuration { plugins } }"
        result = self.call_gql(query)
        if result:
            return result.get("configuration", {}).get("plugins", {}).get("StashMetadataMapper", {})
        return {}

    def find_scene(self, scene_id):
        query = """
        query FindScene($id: ID!) {
          findScene(id: $id) {
            id title details date rating100
            files { path }
            studio { name }
            performers { name }
            tags { name }
            paths { screenshot }
            stash_ids { endpoint stash_id }
          }
        }
        """
        result = self.call_gql(query, {"id": str(scene_id)})
        return result.get("findScene") if result else None

    def find_scenes(self, page=1, per_page=100):
        query = """
        query FindScenes($filter: FindFilterType) {
          findScenes(filter: $filter) {
            count
            scenes {
              id title details date rating100
              files { path }
              studio { name }
              performers { name }
              tags { name }
              paths { screenshot }
              stash_ids { endpoint stash_id }
            }
          }
        }
        """
        variables = {
            "filter": {
                "page": page,
                "per_page": per_page,
                "sort": "id",
                "direction": "ASC",
            }
        }
        result = self.call_gql(query, variables)
        return result.get("findScenes") if result else None
