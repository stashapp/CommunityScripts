import os
import re
import sys
import json
import base64

import log
from stash_interface import StashInterface

ROOT_PATH = 'P:\\path\\to\\files'
cover_pattern = r'(?:thumb|poster|cover)\.(?:jpg|png)'


def main():
	json_input = json.loads(sys.stdin.read())

	output = {}
	run(json_input, output)

	out = json.dumps(output)
	print(out + "\n")

def run(json_input, output):
	global client

	mode_arg = json_input['args']['mode']
	
	try:
		client = StashInterface(json_input["server_connection"])
				
		if mode_arg == "scan":
			scan(handle_cover)

	except Exception:
		raise

	output["output"] = "ok"


def handle_cover(path, file):
	filepath = os.path.join(path, file)

	log.info(f'Found cover in "{filepath}"')

	with open(filepath, "rb") as img:
		b64img_bytes = base64.b64encode(img.read())

	if not b64img_bytes:
		return
		
	b64img  = f"data:image/jpeg;base64,{b64img_bytes.decode('utf-8')}"

	scenes = client.get_scenes_id(filter={
		"path": {
			"modifier": "INCLUDES",
			"value": f"{path}\""
		}
	})

	for scene_id in scenes:
		client.update_scene_overwrite({
			"id": scene_id,
			"cover_image": b64img
		})
		log.info(f'set cover for scene {scene_id}')

def scan(_callback):
	log.info(f'Scanning {ROOT_PATH}')
	for root, dirs, files in os.walk(ROOT_PATH):
		for file in files:
			if re.match(cover_pattern, file, re.IGNORECASE):
				_callback(root, file)

main()