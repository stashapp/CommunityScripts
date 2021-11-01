import os
import re
import sys
import json
import base64

import log
from stash_interface import StashInterface

MANUAL_ROOT = None # /some/other/path to override scanning all stashes
cover_pattern = r'(?:thumb|poster|cover)\.(?:jpg|png)'

def main():
	global stash, mode_arg
	json_input = json.loads(sys.stdin.read())

	stash = StashInterface(json_input["server_connection"])
	mode_arg = json_input['args']['mode']

	try:
		if MANUAL_ROOT:
			scan(MANUAL_ROOT, handle_cover)
		else:
			for stash_path in stash.get_root_paths():
				scan(stash_path, handle_cover)
	except Exception as e:
		log.error(e)

	out = json.dumps({"output": "ok"})
	print( out + "\n")


def handle_cover(path, file):
	filepath = os.path.join(path, file)


	with open(filepath, "rb") as img:
		b64img_bytes = base64.b64encode(img.read())

	if not b64img_bytes:
		return
		
	b64img  = f"data:image/jpeg;base64,{b64img_bytes.decode('utf-8')}"

	scene_ids = stash.get_scenes_id(filter={
		"path": {
			"modifier": "INCLUDES",
			"value": f"{path}\""
		}
	})

	log.info(f'Found Cover: {[int(s) for s in scene_ids]}|{filepath}')

	if mode_arg == "set_cover":
		for scene_id in scene_ids:
			stash.update_scene({
				"id": scene_id,
				"cover_image": b64img
			})
		log.info(f'Applied cover Scenes')

def scan(ROOT_PATH, _callback):
	log.info(f'Scanning {ROOT_PATH}')
	for root, dirs, files in os.walk(ROOT_PATH):
		for file in files:
			if re.match(cover_pattern, file, re.IGNORECASE):
				_callback(root, file)

main()