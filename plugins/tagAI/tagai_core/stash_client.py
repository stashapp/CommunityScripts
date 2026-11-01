"""Stash GraphQL connection and tag lookup/creation helpers."""

from tagai_core import config, stashlog
from tagai_core.config import STASH_URL_DEFAULT
from tagai_core.config import requests


STASH_URL = STASH_URL_DEFAULT
API_KEY = None
SESSION_COOKIE = None


# ========================================================================== #
# 2. CONNECTION & GRAPHQL
# ========================================================================== #

def setup_connection(json_input):
    """Resolve the GraphQL URL + credentials.

    Prefers ``server_connection`` from stdin (so custom ports/auth work without
    editing the code) and falls back to the bundled ``api.key`` file.
    """
    global STASH_URL, API_KEY, SESSION_COOKIE

    sc = (json_input or {}).get("server_connection") or {}
    scheme = sc.get("Scheme") or "http"
    host = sc.get("Host") or "localhost"
    port = sc.get("Port") or 9999
    STASH_URL = f"{scheme}://{host}:{port}/graphql"

    SESSION_COOKIE = None
    sess = sc.get("SessionCookie")
    if isinstance(sess, dict) and sess.get("Value"):
        SESSION_COOKIE = sess
    elif isinstance(sess, str) and sess:
        SESSION_COOKIE = {"Name": "session", "Value": sess}

    # api.key file is the battle-tested path; prefer it when present.
    api_key = None
    try:
        with open(config.API_KEY_PATH, encoding="utf-8") as f:
            candidate = f.readline().strip()
            if candidate:
                api_key = candidate
    except OSError:
        pass

    if api_key is None and SESSION_COOKIE:
        api_key = SESSION_COOKIE.get("Value")

    API_KEY = api_key
    return STASH_URL, API_KEY, SESSION_COOKIE


def gql(query, variables=None):
    headers = {}
    if API_KEY:
        headers["ApiKey"] = API_KEY
    if SESSION_COOKIE and SESSION_COOKIE.get("Value"):
        headers["Cookie"] = f"{SESSION_COOKIE['Name']}={SESSION_COOKIE['Value']}"

    res = requests.post(
        STASH_URL,
        json={"query": query, "variables": variables},
        headers=headers,
    ).json()

    if "errors" in res:
        stashlog.log.error(f"GraphQL Error:\n{res['errors']}")
    return res


# --------------------------- Tag cache / ensure --------------------------- #

# Stash treats tag names as case-insensitively unique, so the cache is keyed
# by the lower-cased name: ``AI: christmas`` and ``AI: Christmas`` are the same
# tag as far as Stash is concerned, and re-creating it fails with
# ``tag with name '...' already exists``.
TAG_CACHE = {}  # lower-cased name -> id


def _cache_tag(tag_id, name):
    if tag_id and name:
        TAG_CACHE.setdefault(name.lower(), tag_id)
    return tag_id


def find_tag_by_name(name):
    """Return the id of an existing tag, matching names case-insensitively."""
    q = """query($name:String!){
      findTags(tag_filter:{name:{value:$name, modifier:EQUALS}}){ tags{id name} }
    }"""
    r = gql(q, {"name": name})
    tags = ((r.get("data") or {}).get("findTags") or {}).get("tags") or []
    if tags:
        return _cache_tag(tags[0]["id"], tags[0]["name"])
    return None


def load_tag_cache():
    """Load every tag name -> id into ``TAG_CACHE`` (paged defensively)."""
    page = 1
    per_page = 1000
    while True:
        q = """query($page:Int!,$per:Int!){
          findTags(filter:{page:$page, per_page:$per}){ tags{id name} count }
        }"""
        r = gql(q, {"page": page, "per": per_page})
        data = (r.get("data") or {}).get("findTags") or {}
        tags = data.get("tags") or []
        for t in tags:
            _cache_tag(t["id"], t["name"])
        count = data.get("count") or 0
        if not tags or len(tags) < per_page or page * per_page >= count:
            break
        page += 1
    stashlog.log.info(f"Tag cache loaded: {len(TAG_CACHE)} tags")


def ensure_tag(name):
    """Return the id of ``name``, creating the tag only if it is missing.

    Case differences do not create a second tag: an existing tag whose name
    only differs in capitalisation is reused.  Returns ``None`` if the tag
    could neither be found nor created.
    """
    if not name:
        return None

    cached = TAG_CACHE.get(name.lower())
    if cached:
        return cached

    existing = find_tag_by_name(name)
    if existing:
        return existing

    q = """mutation($name:String!){
      tagCreate(input:{name:$name}){id name}
    }"""
    r = gql(q, {"name": name})
    created = (r.get("data") or {}).get("tagCreate")
    if created and created.get("id"):
        return _cache_tag(created["id"], created.get("name"))

    # Creation failed (e.g. it already existed): look it up one more time.
    existing = find_tag_by_name(name)
    if existing:
        return existing

    stashlog.log.error(f"Could not create or find tag {name!r}")
    return None


# ========================================================================== #
# 3. MODEL REGISTRY / STRATEGY LAYER (lazy loading)
# ========================================================================== #
