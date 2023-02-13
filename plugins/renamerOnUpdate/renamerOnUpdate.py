import json
import sys
import traceback

try:
    import renamerOnUpdate_config as config
except Exception:
    import config

import log
import renamerOnUpdate_graphql as graphql
import renamerOnUpdate_utils as utils
import renamerOnUpdate_sqlite as sql

PER_PAGE_MAX = 1000  # max scenes to process per batch
##
## start
##
START_TIME = utils.START_TIME
FRAGMENT = json.loads(sys.stdin.read())

FRAGMENT_SERVER = FRAGMENT["server_connection"]
PLUGIN_DIR = FRAGMENT_SERVER["PluginDir"]
PLUGIN_ARGS = FRAGMENT['args'].get("mode")

#log.LogDebug("f{FRAGMENT}")

if PLUGIN_ARGS:
    log.LogDebug("--Starting Plugin 'Renamer'--")
    if "bulk" not in PLUGIN_ARGS:
        if "enable" in PLUGIN_ARGS:
            log.LogInfo("Enable hook")
            SUCCESS = utils.config_edit("enable_hook", True)
        elif "disable" in PLUGIN_ARGS:
            log.LogInfo("Disable hook")
            SUCCESS = utils.config_edit("enable_hook", False)
        elif "dryrun" in PLUGIN_ARGS:
            if config.dry_run:
                log.LogInfo("Disable dryrun")
                SUCCESS = utils.config_edit("dry_run", False)
            else:
                log.LogInfo("Enable dryrun")
                SUCCESS = utils.config_edit("dry_run", True)
        if not SUCCESS:
            log.LogError("Script failed to change the value")
        utils.exit_plugin("script finished")
else:
    if not config.enable_hook:
        utils.exit_plugin("Hook disabled")
    log.LogDebug("--Starting Hook 'Renamer'--")
    FRAGMENT_HOOK_TYPE = FRAGMENT["args"]["hookContext"]["type"]
    FRAGMENT_SCENE_ID = FRAGMENT["args"]["hookContext"]["id"]

# init query
stash_query = graphql.Query(host=FRAGMENT_SERVER['Host'],
                            scheme=FRAGMENT_SERVER['Scheme'],
                            port=str(FRAGMENT_SERVER['Port']),
                            session=FRAGMENT_SERVER['SessionCookie']['Value'])

STASH_CONFIG = stash_query.get_configuration()
STASH_DATABASE = STASH_CONFIG['general']['databasePath']

# query stash for db version
DB_VERSION = stash_query.get_build()
# set file query to db version
stash_query.set_file_query()
# init db
stash_db = sql.Stash(STASH_DATABASE, DB_VERSION)

test_run_15 = False

if PLUGIN_ARGS:
    if "bulk" in PLUGIN_ARGS:
        per_page = config.batch_number_scene
        if "bulk15" in PLUGIN_ARGS:
            per_page = 15
            test_run_15 = True
        if per_page <= 0 or per_page > PER_PAGE_MAX:  # process batches PER_PAGE_MAX at a time
            per_page = PER_PAGE_MAX
        page = 1
        scenes = stash_query.find_scene(per_page, page=page, direc="ASC")
        scenes_count = scenes['count']
        log.LogDebug(f"Total scenes found: {scenes_count}")

        scenes_actual = 0
        progress = 0
        progress_step = 1 / scenes_count
        if test_run_15:
            progress_step = 1 / min(15, scenes_count)

        stash_sql = stash_db.connect_db()
        if stash_sql is None:
            utils.exit_plugin()
        while scenes_actual < scenes_count:
            for scene in scenes['scenes']:
                log.LogDebug(
                    f"*{scenes_actual+1}/{scenes_count}* Checking scene: {scene['title']} - {scene['id']} **"
                )
                try:
                    utils.renamer(scene_id=scene,
                                  gql=stash_query,
                                  db_conn=stash_sql,
                                  db=stash_db)
                except Exception as err:
                    log.LogError(f"main function error: {err}")
                progress += progress_step
                scenes_actual += 1
                log.LogProgress(progress)
            if (not test_run_15) and (scenes_actual < scenes_count):
                page += 1  # get next page
                scenes = stash_query.find_scene(per_page,
                                                page=page,
                                                direc="ASC")
                if scenes['count'] != scenes_count:
                    log.LogWarning(
                        f"Scene count changed {scenes_count}->{scenes['count']}"
                    )
                    scenes_count = scenes["count"]
            else:
                break
        stash_sql.close()
        log.LogInfo("[SQLITE] Database closed!")
else:
    try:
        utils.renamer(scene_id=FRAGMENT_SCENE_ID, gql=stash_query, db=stash_db)
    except Exception as err:
        log.LogError(f"main function error: {err}")
        traceback.print_exc()

utils.exit_plugin("Successful!")
