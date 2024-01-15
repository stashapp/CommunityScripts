import config_manager
import json
import os
import pathlib
import sys
import subprocess
from favorite_performers_sync import set_stashbox_favorite_performers, set_stashbox_favorite_performer
from audit_performer_urls import audit_performer_urls
try:
    import stashapi.log as log
    log.LEVEL = log.StashLogLevel.INFO
    from stashapi.stashapp import StashInterface
    from stashapi.stashbox import StashBoxInterface
except ModuleNotFoundError:
    print("If you have pip (normally installed with python), run this command in a terminal (cmd): 'pip install stashapp-tools'", file=sys.stderr)
    sys.exit()

json_input = json.loads(sys.stdin.read())
name = json_input['args']['name']

stash = StashInterface(json_input["server_connection"])

CONFIG_PATH = os.path.join(pathlib.Path(__file__).parent.resolve(), 'config.ini')

def main():
    if name == 'update_config_value':
        update_config_value()
    if name == 'get_config_value':
        get_config_value()

    if name == 'explorer':
        open_explorer()
    if name == 'mediaplayer':
        open_mediaplayer()
    if name == 'audit_performer_urls':
        audit_performer_urls(stash)
    if name == 'favorite_performers_sync':
        sbox = StashBoxInterface(stash.get_stashbox_connection(json_input['args']['endpoint']))
        set_stashbox_favorite_performers(stash, sbox)
    if name == 'favorite_performer_sync':
        favorite_performer_sync()
        
    if name == 'update_studio':
        log.warning("update_studio id deprecated, use Studio Tagger")

    print(json.dumps({"output":"ok"}) + "\n")

def open_explorer():
    path = json_input['args']['path']
    log.debug(f"{name}: {path}")
    subprocess.Popen(f'explorer "{path}"')

def open_mediaplayer():
    mediaplayer_path = config_manager.get_config_value(CONFIG_PATH, 'MEDIAPLAYER', 'path')
    path = json_input['args']['path']
    log.debug(f"mediaplayer_path: {mediaplayer_path}")
    log.debug(f"{name}: {path}")
    subprocess.Popen([mediaplayer_path, path])

def favorite_performer_sync():
    sbox = StashBoxInterface(stash.get_stashbox_connection(json_input['args']['endpoint']))
    stash_id = json_input['args']['stash_id']
    favorite = json_input['args']['favorite']
    log.debug(f"Favorite performer sync: endpoint={sbox.endpoint}, stash_id={stash_id}, favorite={favorite}")
    set_stashbox_favorite_performer(sbox, stash_id, favorite)

def update_config_value():
    log.debug(f"config path: {CONFIG_PATH}")
    section_key = json_input['args']['section_key']
    prop_name = json_input['args']['prop_name']
    value = json_input['args']['value']
    if not section_key or not prop_name:
        log.error(f"{name}: Missing args")
        sys.exit(0)
    log.debug(f"{name}: [{section_key}][{prop_name}] = {value}")
    config_manager.update_config_value(CONFIG_PATH, section_key, prop_name, value)

def get_config_value():
    log.debug(f"config path: {CONFIG_PATH}")
    section_key = json_input['args']['section_key']
    prop_name = json_input['args']['prop_name']
    if not section_key or not prop_name:
        log.error(f"{name}: Missing args")
        sys.exit(0)
    value = config_manager.get_config_value(CONFIG_PATH, section_key, prop_name)
    log.debug(f"{name}: [{section_key}][{prop_name}] = {value}")

if __name__ == '__main__':
    main()