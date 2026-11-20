import sys
import json
import argparse
import requests
import re

def get_stash_config():
    """Dynamically parses Stash's stdin payload for connection strings and user UI settings."""
    try:
        raw_input = sys.stdin.read().strip()
        input_data = json.loads(raw_input) if raw_input else {}
        
        server_conn = input_data.get('server_connection') or {}
        scheme = server_conn.get('Scheme', 'http')
        port = server_conn.get('Port', 9999)
        url = f"{scheme}://localhost:{port}/graphql"
        
        session = requests.Session()
        api_key = server_conn.get('ApiKey') or server_conn.get('api_key')
        if api_key:
            session.headers.update({"ApiKey": api_key})
            
        cookie_data = server_conn.get('SessionCookie') or {}
        if cookie_data.get('Name') and cookie_data.get('Value'):
            session.cookies.set(cookie_data['Name'], cookie_data['Value'])

        plugin_settings = input_data.get('plugin_settings') or {}
        task_args = input_data.get('args') or {}
        
        target_string = plugin_settings.get('target_string') or task_args.get('target_string')
        dry_run = plugin_settings.get('dry_run', False)
        
        # Fallback to direct DB config lookup if stdin payload is empty
        if not target_string:
            plugin_query = "query { configuration { plugins } }"
            response = session.post(url, json={'query': plugin_query}, headers={"Content-Type": "application/json"})
            res = response.json()
            plugins_config = res.get('data', {}).get('configuration', {}).get('plugins', {})
            our_config = plugins_config.get('clean_details', {})
            target_string = our_config.get('target_string', '')
            dry_run = our_config.get('dry_run', False)

        target_string = str(target_string).strip() if target_string else ""
        
        selected_scene_ids = []
        if 'hookContext' in input_data:
            input_ids = input_data['hookContext'].get('input', {}).get('ids', [])
            selected_scene_ids = input_ids
            
        return session, url, target_string, dry_run, selected_scene_ids
    except Exception as e:
        sys.stderr.write(f"Initialization Error: {e}\n")
        print(json.dumps({}))
        sys.exit(1)

def call_graphql(session, url, query, variables=None):
    try:
        response = session.post(url, json={'query': query, 'variables': variables}, headers={"Content-Type": "application/json"})
        return response.json()
    except Exception as e:
        sys.stderr.write(f"GraphQL Transmission Error: {e}\n")
        return {}

def get_all_scenes(session, url):
    """Paginates safely through the database to prevent memory crashes on large instances."""
    scenes = []
    page = 1
    per_page = 500
    while True:
        query = """
        query FindScenesPage($filter: FindFilterType) {
            findScenes(scene_filter: {}, filter: $filter) {
                scenes { id details }
            }
        }
        """
        variables = {"filter": {"page": page, "per_page": per_page}}
        res = call_graphql(session, url, query, variables)
        page_scenes = res.get('data', {}).get('findScenes', {}).get('scenes', [])
        if not page_scenes:
            break
        scenes.extend(page_scenes)
        page += 1
    return scenes

def get_selected_scenes(session, url, scene_ids):
    scenes = []
    for s_id in scene_ids:
        query = f"query {{ findScene(id: \"{s_id}\") {{ id details }} }}"
        res = call_graphql(session, url, query)
        if res.get('data', {}).get('findScene'):
            scenes.append(res['data']['findScene'])
    return scenes

def update_scene_details(session, url, scene_id, new_details):
    mutation = """
    mutation SceneUpdate($id: ID!, $details: String) {
        sceneUpdate(input: { id: $id, details: $details }) { id }
    }
    """
    call_graphql(url, mutation, {'id': scene_id, 'details': new_details})

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', choices=['all', 'selection'], required=True)
    args = parser.parse_args()

    session, url, target_string, dry_run, selected_ids = get_stash_config()
    
    if not target_string:
        sys.stderr.write("Execution aborted: No Target String configured in settings.\n")
        print(json.dumps({}))
        sys.exit(0)

    scenes = get_selected_scenes(session, url, selected_ids) if args.mode == 'selection' else get_all_scenes(session, url)
    
    sys.stderr.write(f"Targeting string: '{target_string}' (Dry Run: {dry_run})\n")
    sys.stderr.write(f"Evaluating {len(scenes)} scenes...\n")

    pattern = re.compile(re.escape(target_string), re.IGNORECASE)
    match_count = 0

    for scene in scenes:
        details = scene.get('details')
        if details and pattern.search(details):
            match_count += 1
            if not dry_run:
                # Replaces all occurrences in memory first, stripping trailing whitespaces cleanly
                cleaned_details = pattern.sub("", details).strip()
                # Single database mutation execute call per scene
                update_scene_details(session, url, scene['id'], cleaned_details)

    if dry_run:
        sys.stderr.write(f"[DRY RUN] Finished. Found {match_count} scenes containing the target string. No changes made.\n")
    else:
        sys.stderr.write(f"Success! Cleaned the target string from {match_count} scene descriptions.\n")
        
    print(json.dumps({}))

if __name__ == '__main__':
    main()
