import json
import sys
import re
import datetime as dt

try:
    import stashapi.log as log
    from stashapi.tools import human_bytes
    from stashapi.stash_types import PhashDistance
    from stashapi.stashapp import StashInterface
except ModuleNotFoundError:
    print("You need to install the stashapi module. (pip install stashapp-tools)",
     file=sys.stderr)


PRIORITY = ['resolution', 'bitrate', 'size', 'age'] # 'encoding'
CODEC_PRIORITY = ['H265','HEVC','H264','MPEG4']

FRAGMENT = json.loads(sys.stdin.read())
MODE = FRAGMENT['args']['mode']
stash = StashInterface(FRAGMENT["server_connection"])

SLIM_SCENE_FRAGMENT = """
	id
	title
	path
	file_mod_time
	tags { id }
	file {
		size
		height
		bitrate
		video_codec
	}
"""

def main():
	if MODE == "create":
		stash.find_tag('[Dupe: Keep]', create=True)
		stash.find_tag('[Dupe: Remove]', create=True)
		stash.find_tag('[Dupe: Ignore]', create=True)
		
	if MODE == "remove":
		tag_id = stash.find_tag('[Dupe: Keep]').get("id")
		stash.destroy_tag(tag_id)
		tag_id = stash.find_tag('[Dupe: Remove]').get("id")
		stash.destroy_tag(tag_id)

	if MODE == "tagexact":
		duplicate_list = stash.find_duplicate_scenes(PhashDistance.EXACT, fragment=SLIM_SCENE_FRAGMENT)
		process_duplicates(duplicate_list)
	if MODE == "taghigh":
		duplicate_list = stash.find_duplicate_scenes(PhashDistance.HIGH, fragment=SLIM_SCENE_FRAGMENT)
		process_duplicates(duplicate_list)
	if MODE == "tagmid":
		duplicate_list = stash.find_duplicate_scenes(PhashDistance.MEDIUM, fragment=SLIM_SCENE_FRAGMENT)
		process_duplicates(duplicate_list)

	if MODE == "cleantitle":
		clean_titles()

	log.exit("Plugin exited normally.")


def parse_timestamp(ts, format="%Y-%m-%dT%H:%M:%S%z"):
	ts = re.sub(r'\.\d+', "", ts) #remove fractional seconds
	return dt.datetime.strptime(ts, format)

class StashScene:

	def __init__(self, scene=None) -> None:
		self.id = int(scene['id'])
		self.mod_time = parse_timestamp(scene['file_mod_time'])
		self.height = scene['file']['height']
		self.size = int(scene['file']['size'])
		self.bitrate = int(scene['file']['bitrate'])
		# replace any existing tagged title
		self.title = re.sub(r'^\[Dupe: \d+[KR]\]\s+', '', scene['title'])
		self.path = scene['path']

		self.codec = scene['file']['video_codec'].upper()
		if self.codec in CODEC_PRIORITY:
			self.codec = CODEC_PRIORITY.index(self.codec)
		else:
			log.warning(f"could not find codec {self.codec}")

	def __repr__(self) -> str:
		return f'<StashScene ({self.id})>'

	def __str__(self) -> str:
		return f'id:{self.id}, height:{self.height}, size:{human_bytes(self.size)}, file_mod_time:{self.mod_time}, title:{self.title}'

	def compare(self, other):
		if not (isinstance(other, StashScene)):
			raise Exception(f"can only compare to <StashScene> not <{type(other)}>")

		# Check if same scene
		if self.id == other.id:
			return None, "Matching IDs {self.id}=={other.id}"

		def compare_not_found():
			raise Exception("comparison not found")
		for type in PRIORITY:
			try:
				compare_function = getattr(self, f'compare_{type}', compare_not_found)
				best, msg = compare_function(other)
				if best:
					return best, msg
			except Exception as e:
				log.error(f"Issue Comparing <{type}> {e}")
		
		return None, f"{self.id} worse than {other.id}"

	def compare_resolution(self, other):
		# Checking Resolution
		if self.height != other.height:
			if self.height > other.height:
				return self, f"Better Resolution {self.height} > {other.height} | {self.id}>{other.id}"
			else:
				return other, f"Better Resolution {other.height} > {self.height} | {other.id}>{self.id}"
		return None, None
	def compare_bitrate(self, other):
		# Checking Bitrate
		if self.bitrate != other.bitrate:
			if self.bitrate > other.bitrate:
				return self, f"Better Bitrate {human_bytes(self.bitrate)} > {human_bytes(other.bitrate)} Δ:({human_bytes(self.bitrate-other.bitrate)}) | {self.id}>{other.id}"
			else:
				return other, f"Better Bitrate {human_bytes(other.bitrate)} > {human_bytes(self.bitrate)} Δ:({human_bytes(other.bitrate-self.bitrate)}) | {other.id}>{self.id}"
		return None, None
	def compare_size(self, other):
		# Checking Size
		if self.size != other.size:
			if self.size > other.size:
				return self, f"Better Size {human_bytes(self.size)} > {human_bytes(other.size)} Δ:({human_bytes(self.size-other.size)}) | {self.id} > {other.id}"
			else:
				return other, f"Better Size {human_bytes(other.size)} > {human_bytes(self.size)} Δ:({human_bytes(other.size-self.size)}) | {other.id} > {self.id}"
		return None, None
	def compare_age(self, other):
		# Checking Age
		if self.mod_time != other.mod_time:
			if self.mod_time < other.mod_time:
				return self, f"Choose Oldest: Δ:{other.mod_time-self.mod_time} | {self.id} older than {other.id}"
			else:
				return other, f"Choose Oldest: Δ:{self.mod_time-other.mod_time} | {other.id} older than {self.id}"
		return None, None
	def compare_encoding(self, other):
		# could not find one of the codecs in priority list
		if not isinstance(self.codec, int) or not isinstance(other.codec, int):
			return None, None
		if self.codec != other.codec:
			if self.codec < other.codec:
				return self, f"Preferred Codec {CODEC_PRIORITY[self.codec]} over {CODEC_PRIORITY[other.codec]} | {self.id} better than {other.id}"
			else:
				return other, f"Preferred Codec {CODEC_PRIORITY[other.codec]} over {CODEC_PRIORITY[self.codec]} | {other.id} better than {self.id}"
		return None, None


def process_duplicates(duplicate_list):
	ignore_tag_id = stash.find_tag('[Dupe: Ignore]', create=True).get("id")
	total = len(duplicate_list)
	log.info(f"There is {total} sets of duplicates found.")
	for i, group in enumerate(duplicate_list):
		log.progress(i/total)
		filtered_group = []
		for scene in group:
			tag_ids = [ t['id'] for t in scene['tags'] ]
			if ignore_tag_id in tag_ids:
				log.debug(f"Ignore {scene['id']} {scene['title']}")
			else:
				filtered_group.append(scene)
		if len(filtered_group) > 1:
			tag_files(filtered_group)

def tag_files(group):
	tag_keep = stash.find_tag('[Dupe: Keep]', create=True).get("id")
	tag_remove = stash.find_tag('[Dupe: Remove]', create=True).get("id")

	group = [StashScene(s) for s in group]

	keep_reasons = []
	keep_scene = group[0]
	for scene in group[1:]:
		better, msg = scene.compare(keep_scene)
		if better:
			keep_scene = better
		keep_reasons.append(msg)

	keep_scene.reasons = keep_reasons

	log.info(f"{keep_scene.id} best of:{[s.id for s in group]} {keep_scene.reasons}")

	for scene in group:
		if scene.id == keep_scene.id:
			# log.debug(f"Tag for Keeping: {scene.id} {scene.path}")
			stash.update_scenes({
				'ids': [scene.id],
				'title':  f'[Dupe: {keep_scene.id}K] {scene.title}',
				'tag_ids': {
					'mode': 'ADD',
					'ids': [tag_keep]
				} 
			})
		else:
			# log.debug(f"Tag for Removal: {scene.id} {scene.path}")
			stash.update_scenes({
				'ids': [scene.id],
				'title':  f'[Dupe: {keep_scene.id}R] {scene.title}',
				'tag_ids': {
					'mode': 'ADD',
					'ids': [tag_remove]
				} 
			})

def clean_titles():
	scenes = stash.find_scenes(f={
		"title": {
			"modifier": "MATCHES_REGEX",
			"value": "^\\[Dupe: (\\d+)([KR])\\]"
		}
	},fragment="id title")

	log.info(f"Cleaning Titles/Tags of {len(scenes)} Scenes ")
	
	for scene in scenes:
		title = re.sub(r'\[Dupe: \d+[KR]\]\s+', '', scene['title'])
		log.info(f"Removing Dupe Title String from: [{scene['id']}] {scene['title']}")
		stash.update_scenes({
			'ids': [scene['id']],
			'title': title
		})

	tag_keep = stash.find_tag('[Dupe: Keep]')
	if tag_keep:
		tag_keep = tag_keep['id']
		scenes = stash.find_scenes(f={
			"tags":{
				"value": [tag_keep],
				"modifier": "INCLUDES",
				"depth": 0
			}
		},fragment="id title")
		stash.update_scenes({
			'ids': [s['id'] for s in scenes],
			'tag_ids': {
				'mode': 'REMOVE',
				'ids': [tag_keep]
			} 
		})

	tag_remove = stash.find_tag('[Dupe: Remove]')
	if tag_remove:
		tag_remove = tag_remove['id']
		scenes = stash.find_scenes(f={
			"tags":{
				"value": [tag_remove],
				"modifier": "INCLUDES",
				"depth": 0
			}
		},fragment="id title")
		stash.update_scenes({
			'ids': [s['id'] for s in scenes],
			'tag_ids': {
				'mode': 'REMOVE',
				'ids': [tag_remove]
			} 
		})

if __name__ == '__main__':
	main()
