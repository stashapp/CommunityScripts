import json
import os
import sys
import time

import config

# import log
import graphql

API_VERSION_BF_FILES = 31  # APP/DB Schema version prior to files refactor PR
MAX_RETRY_COUNT = 25
SLEEP_RETRY = 0.5

FRAGMENT = json.loads(sys.stdin.read())
# log.LogDebug(json.dumps(FRAGMENT))
FRAGMENT_SERVER = FRAGMENT["server_connection"]
FRAGMENT_SCENE_ID = FRAGMENT["args"].get("hookContext")

if FRAGMENT_SCENE_ID:
    scene_id = FRAGMENT_SCENE_ID["id"]
else:
    graphql.exit_plugin("No ID found")

graphql_port = FRAGMENT_SERVER["Port"]
graphql_scheme = FRAGMENT_SERVER["Scheme"]
graphql_session = FRAGMENT_SERVER.get("SessionCookie").get("Value")

system_status = graphql.get_api_version(
    port=graphql_port, session=graphql_session, scheme=graphql_scheme
)

api_version = system_status.get("appSchema")

basename = None

if api_version > API_VERSION_BF_FILES:  # only needed for versions after files refactor
    files_base = graphql.get_scene_base(
        scene_id=scene_id,
        port=graphql_port,
        session=graphql_session,
        scheme=graphql_scheme,
    )
    if len(files_base["files"]) > 0:
        basename = files_base["files"][0].get("basename")
else:
    graphql.exit_plugin(
        f"Stash with API version:{api_version} is not supported. You need at least {API_VERSION_BF_FILES}"
    )

if basename is None:
    graphql.exit_plugin("No basename found")  # file-less scene

if config.STRIP_EXT:
    basename = os.path.splitext(basename)[0]

i = MAX_RETRY_COUNT
while i >= 0:
    # log.LogDebug(f"TitleFromFilename: Retry attempt {i}")
    i -= 1
    updated_scene = graphql.update_scene_title(
        scene_id,
        basename,
        port=graphql_port,
        session=graphql_session,
        scheme=graphql_scheme,
    )
    if updated_scene:
        graphql.exit_plugin(
            f"Scene title updated after {MAX_RETRY_COUNT - i} tries. Title:{updated_scene.get('title')}"
        )
    time.sleep(SLEEP_RETRY)

graphql.exit_plugin("Error updating scene")
