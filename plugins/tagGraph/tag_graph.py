import os, re, sys, copy, json, requests

# local dependencies
import config

# external dependencies
from pyvis.network import Network


class StashLogger:
    # Log messages sent from a script scraper instance are transmitted via stderr and are
    # encoded with a prefix consisting of special character SOH, then the log
    # level (one of t, d, i, w or e - corresponding to trace, debug, info,
    # warning and error levels respectively), then special character
    # STX.
    #
    # The log.trace, log.debug, log.info, log.warning, and log.error methods, and their equivalent
    # formatted methods are intended for use by script scraper instances to transmit log
    # messages.
    #
    def __log(self, level_char: bytes, s):
        if level_char:
            lvl_char = "\x01{}\x02".format(level_char.decode())
            s = re.sub(r"data:image.+?;base64(.+?')", "[...]", str(s))
            for x in s.split("\n"):
                print(lvl_char, x, file=sys.stderr, flush=True)

    def trace(self, s):
        self.__log(b"t", s)

    def debug(self, s):
        self.__log(b"d", s)

    def info(self, s):
        self.__log(b"i", s)

    def warning(self, s):
        self.__log(b"w", s)

    def error(self, s):
        self.__log(b"e", s)

    def progress(self, p):
        progress = min(max(0, p), 1)
        self.__log(b"p", str(progress))


class StashInterface:
    port = ""
    url = ""
    headers = {
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "DNT": "1",
    }
    cookies = {}

    def __init__(self, conn, fragments={}):
        global log

        if conn.get("Logger"):
            log = conn.get("Logger")
        else:
            raise Exception("No logger passed to StashInterface")

        self.port = conn["Port"] if conn.get("Port") else "9999"
        scheme = conn["Scheme"] if conn.get("Scheme") else "http"

        api_key = conn.get("ApiKey")
        if api_key:
            self.headers["ApiKey"] = api_key

        # Session cookie for authentication
        self.cookies = {}
        if conn.get("SessionCookie"):
            self.cookies.update({"session": conn["SessionCookie"]["Value"]})

        domain = conn["Domain"] if conn.get("Domain") else "localhost"

        # Stash GraphQL endpoint
        self.url = f"{scheme}://{domain}:{self.port}/graphql"

        try:
            self.get_stash_config()
        except Exception:
            log.error(f"Could not connect to Stash at {self.url}")
            sys.exit()

        log.info(f"Using Stash's GraphQl endpoint at {self.url}")

        self.fragments = fragments

    def __resolveFragments(self, query):

        fragmentReferences = list(set(re.findall(r"(?<=\.\.\.)\w+", query)))
        fragments = []
        for ref in fragmentReferences:
            fragments.append(
                {
                    "fragment": ref,
                    "defined": bool(re.search("fragment {}".format(ref), query)),
                }
            )

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

        json_request = {"query": query}
        if variables is not None:
            json_request["variables"] = variables

        response = requests.post(
            self.url, json=json_request, headers=self.headers, cookies=self.cookies
        )

        if response.status_code == 200:
            result = response.json()

            if result.get("errors"):
                for error in result["errors"]:
                    log.error(f"GraphQL error: {error}")
            if result.get("error"):
                for error in result["error"]["errors"]:
                    log.error(f"GraphQL error: {error}")
            if result.get("data"):
                return result["data"]
        elif response.status_code == 401:
            sys.exit(
                "HTTP Error 401, Unauthorized. Cookie authentication most likely failed"
            )
        else:
            raise ConnectionError(
                "GraphQL query failed:{} - {}. Query: {}. Variables: {}".format(
                    response.status_code, response.content, query, variables
                )
            )

    def __match_alias_item(self, search, items):
        item_matches = {}
        for item in items:
            if re.match(rf"{search}$", item.name, re.IGNORECASE):
                log.debug(
                    f'matched "{search}" to "{item.name}" ({item.id}) using primary name'
                )
                item_matches[item.id] = item
            if not item.aliases:
                continue
            for alias in item.aliases:
                if re.match(rf"{search}$", alias.strip(), re.IGNORECASE):
                    log.debug(
                        f'matched "{search}" to "{alias}" ({item.id}) using alias'
                    )
                    item_matches[item.id] = item
        return list(item_matches.values())

    def get_stash_config(self):
        query = """
		query Configuration {
			configuration { general { stashes{ path } } }
		}
		"""
        result = self.__callGraphQL(query)
        return result["configuration"]

    def get_tags_with_relations(self):
        query = """
		query FindTags($filter: FindFilterType, $tag_filter: TagFilterType) {
			findTags(filter: $filter, tag_filter: $tag_filter) {
					count
					tags {
						id
						name
						parents { id }
						children { id }
					}
			}
		}
		"""

        variables = {
            "tag_filter": {
                "child_count": {"modifier": "GREATER_THAN", "value": 0},
                "OR": {"parent_count": {"modifier": "GREATER_THAN", "value": 0}},
            },
            "filter": {"q": "", "per_page": -1},
        }
        result = self.__callGraphQL(query, variables)
        return result["findTags"]["tags"]


def script_init():
    import logging as log

    log.basicConfig(level=log.INFO, format="%(levelname)s: %(message)s")
    stash_connection = config.STASH_SETTINGS
    stash_connection["Logger"] = log
    generate_graph(stash_connection)


def plugin_init():
    log = StashLogger()
    stash_connection = json.loads(sys.stdin.read())["server_connection"]
    stash_connection["Logger"] = log
    generate_graph(stash_connection)
    print(json.dumps({"output": "ok"}))


def generate_graph(stash_connection):
    log = stash_connection["Logger"]

    stash = StashInterface(stash_connection)
    log.info("getting tags from stash...")
    tags = stash.get_tags_with_relations()

    log.info("generating graph...")
    if config.SHOW_OPTIONS:
        G = Network(
            directed=True,
            height="100%",
            width="66%",
            bgcolor="#202b33",
            font_color="white",
        )
        G.show_buttons()
    else:
        G = Network(
            directed=True,
            height="100%",
            width="100%",
            bgcolor="#202b33",
            font_color="white",
        )

    node_theme = {
        "border": "#adb5bd",
        "background": "#394b59",
        "highlight": {"border": "#137cbd", "background": "#FFFFFF"},
    }
    edge_theme = {"color": "#FFFFFF", "highlight": "#137cbd"}

    # create all nodes
    for tag in tags:
        G.add_node(tag["id"], label=tag["name"], color=node_theme)
    # create all edges
    for tag in tags:
        for child in tag["children"]:
            G.add_edge(tag["id"], child["id"], color=edge_theme)

    current_abs_path = os.path.dirname(os.path.abspath(__file__))
    save_path = os.path.join(current_abs_path, "tag_graph.html")

    G.save_graph(save_path)
    log.info(f'saved graph to "{save_path}"')


if __name__ == "__main__":
    if len(sys.argv) > 1:
        script_init()
    else:
        plugin_init()
