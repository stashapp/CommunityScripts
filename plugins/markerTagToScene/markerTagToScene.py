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
    context = fragment["args"]["hookContext"]
    
    marker_tag_ids = context["input"].get("tag_ids", [])
    marker_tag_ids.append(context["input"]["primary_tag_id"])
    scene_id = context["input"]["scene_id"]

    scene_tag_ids = get_scene_tags(scene_id)
    log.info(f"{marker_tag_ids=} {scene_id=} {scene_tag_ids=}")

    missing_tag_ids = [tid for tid in marker_tag_ids if tid not in scene_tag_ids]
    if missing_tag_ids:
        scene_tag_ids.extend(missing_tag_ids)
        stash.update_scene({"id":scene_id, "tag_ids": scene_tag_ids})
        log.info(f'added missing tag(s) {missing_tag_ids} to scene {scene_id}')
    else:
        log.debug("all marker tags already exists on scene")

    log.exit()

def get_scene_tags(scene_id):
    scene = stash.find_scene(scene_id, fragment="tags { id }")
    return [t["id"] for t in scene["tags"]]

if __name__ == '__main__':
    main()