import requests
import sys
import log
import re

class StashInterface:
    port = ""
    url = ""
    headers = {
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "DNT": "1"
    }
    cookies = {}

    def __init__(self, conn, fragments={}):
        self.port = conn['Port'] if conn.get('Port') else '9999'
        scheme = conn['Scheme'] if conn.get('Scheme') else 'http'

        # Session cookie for authentication

        self.cookies = {}
        if conn.get('SessionCookie'):
            self.cookies.update({
                'session': conn['SessionCookie']['Value']
            })

        domain = conn['Domain'] if conn.get('Domain') else 'localhost'

        # Stash GraphQL endpoint
        self.url = f'{scheme}://{domain}:{self.port}/graphql'
        log.debug(f"Using stash GraphQl endpoint at {self.url}")

        self.fragments = fragments

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

        json_request = {'query': query}
        if variables is not None:
            json_request['variables'] = variables

        response = requests.post(self.url, json=json_request, headers=self.headers, cookies=self.cookies)
        
        if response.status_code == 200:
            result = response.json()

            if result.get("errors"):
                for error in result["errors"]:
                    log.debug(f"GraphQL error: {error}")
            if result.get("error"):
                for error in result["error"]["errors"]:
                    log.debug(f"GraphQL error: {error}")
            if result.get("data"):
                return result['data']
        elif response.status_code == 401:
            sys.exit("HTTP Error 401, Unauthorised. Cookie authentication most likely failed")
        else:
            raise ConnectionError(
                "GraphQL query failed:{} - {}. Query: {}. Variables: {}".format(
                    response.status_code, response.content, query, variables)
            )

    def __match_alias_item(self, search, items):
        item_matches = {}
        for item in items:
            if re.match(rf'{search}$', item.name, re.IGNORECASE):
                log.debug(f'matched "{search}" to "{item.name}" ({item.id}) using primary name')
                item_matches[item.id] = item
            if not item.aliases:
                continue
            for alias in item.aliases:
                if re.match(rf'{search}$', alias.strip(), re.IGNORECASE):
                    log.debug(f'matched "{search}" to "{alias}" ({item.id}) using alias')
                    item_matches[item.id] = item
        return list(item_matches.values())

    def get_db_path(self):
        query = """
            query Configuration {
                configuration {
                    general{
                        databasePath
                    }
                }
            }
        """

        result = self.__callGraphQL(query)
        return result['configuration']['general']['databasePath']
