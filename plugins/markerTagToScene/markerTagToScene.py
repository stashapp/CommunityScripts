import sys, json

try:
    import stashapi.log as log
    from stashapi.stashapp import StashInterface
except ModuleNotFoundError:
    print("You need to install the stashapi module. (pip install stashapp-tools)",
     file=sys.stderr)

def main():
    global stash

    fragment = json.loads(sys.stdin.read())
    stash = StashInterface(fragment["server_connection"])

    mode = fragment['args'].get("mode")
    context = fragment["args"].get("hookContext")

    if context:
        run_hook(context)
    if mode == "updateAllScenes":
        update_all_scenes()
    if mode == "dryRunUpdateAllScenes":
        update_all_scenes(True)

def run_hook(context):
    scene_id = context["input"]["scene_id"]
    scene_tag_ids = get_scene_tag_ids(scene_id)
    marker_tag_ids = context["input"].get("tag_ids", [])
    marker_tag_ids.append(context["input"]["primary_tag_id"])

    missing_tag_ids = [tid for tid in marker_tag_ids if tid not in scene_tag_ids]
    if missing_tag_ids:
        scene_tag_ids.extend(missing_tag_ids)
        stash.update_scene({"id":scene_id, "tag_ids": scene_tag_ids})
        log.info(f'added missing tag(s) {missing_tag_ids} to scene {scene_id}')
    else:
        log.debug("all marker tags already exist on scene")

    log.exit()

def update_all_scenes(dry_run=False):
    log.info("Querying Scenes with markers from Stash...")

    count, scenes = stash.find_scenes({"has_markers": "true"}, fragment="id tags { id } scene_markers { primary_tag { id } tags { id } }", get_count=True)

    log.info(f"processing {count} scenes with markers")
    for i, s in enumerate(scenes):
        log.progress(i/count)
        scene_id = s["id"]
        
        scene_tag_ids = [t["id"] for t in s["tags"]]
        marker_tag_ids = get_scene_marker_tag_ids(scene=s)
        
        missing_tag_ids = [tid for tid in marker_tag_ids if tid not in scene_tag_ids]
        if missing_tag_ids == []:
            log.debug(f"all marker tags already exist on scene {scene_id}")
            continue
        if dry_run:
            log.info(f'missing tag(s) {missing_tag_ids} from scene {scene_id}')
            continue
        scene_tag_ids.extend(missing_tag_ids)
        stash.update_scene({"id":scene_id, "tag_ids": scene_tag_ids})
        log.info(f'added missing tag(s) {missing_tag_ids} to scene {scene_id}')


def get_marker_tag_ids(marker):
    tag_ids = [t["id"] for t in marker["tags"]]
    tag_ids.append(marker["primary_tag"]["id"])
    return tag_ids
def get_scene_marker_tag_ids(scene=None, scene_id=None):
    if scene:
        all_markers_ids = [get_marker_tag_ids(m) for m in scene["scene_markers"]]
        return sum(all_markers_ids, [])
    if scene_id:
        scene = stash.find_scene(fragment="id scene_markers { primary_tag { id } tags { id } }") 
        return get_scene_marker_tag_ids( scene=scene )
def get_scene_tag_ids(scene_id):
    scene = stash.find_scene(scene_id, fragment="tags { id }")
    return [t["id"] for t in scene["tags"]]

if __name__ == '__main__':
    main()