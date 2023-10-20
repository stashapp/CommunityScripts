import json
import sys
import re
import datetime as dt

try:
    import stashapi.log as log
    from stashapi.tools import human_bytes, human_bits
    from stashapi.stash_types import PhashDistance
    from stashapi.stashapp import StashInterface
except ModuleNotFoundError:
    print("You need to install the stashapi module. (pip install stashapp-tools)",
     file=sys.stderr)


PRIORITY = ['resolution', 'bitrate', 'encoding', 'size', 'age']
CODEC_PRIORITY = {'AV1':0,'H265':1,'HEVC':1,'H264':2,'MPEG4':3,'MPEG1VIDEO':3,'WMV3':4,'WMV2':5,'VC1':6,'SVQ3':7}

FRAGMENT = json.loads(sys.stdin.read())
MODE = FRAGMENT['args']['mode']
stash = StashInterface(FRAGMENT["server_connection"])

IGNORE_TAG_NAME = "[Dupe: Ignore]"
SLIM_SCENE_FRAGMENT = """
id
title
date
tags { id }
files {
	size
	width
	height
	bit_rate
	mod_time
	duration
	framerate
	video_codec
}
"""

def main():
		
	if MODE == "remove":
		clean_scenes()
		for tag in get_managed_tags():
			stash.destroy_tag(tag["id"])

	if MODE == "tag_exact":
		process_duplicates(PhashDistance.EXACT)
	if MODE == "tag_high":
		process_duplicates(PhashDistance.HIGH)
	if MODE == "tag_medium":
		process_duplicates(PhashDistance.MEDIUM)

	if MODE == "clean_scenes":
		clean_scenes()
	if MODE == "generate_phash":
		generate_phash()


	log.exit("Plugin exited normally.")


def parse_timestamp(ts, format="%Y-%m-%dT%H:%M:%S%z"):
	ts = re.sub(r'\.\d+', "", ts) #remove fractional seconds
	return dt.datetime.strptime(ts, format)


class StashScene:

	def __init__(self, scene=None) -> None:
		file = scene["files"][0]

		self.id = int(scene['id'])
		self.mod_time = parse_timestamp(file['mod_time'])
		if scene.get("date"):
			self.date = parse_timestamp(scene['date'], format="%Y-%m-%d")
		else:
			self.date = None
		self.path = scene.get("path")
		self.width = file['width']
		self.height = file['height']
		# File size in # of BYTES
		self.size = int(file['size'])
		self.frame_rate = int(file['framerate'])
		self.bitrate = int(file['bit_rate'])
		self.duration = float(file['duration'])
		# replace any existing tagged title
		self.title = re.sub(r'^\[Dupe: \d+[KR]\]\s+', '', scene['title'])
		self.path = file['path']
		self.tag_ids = [t["id"]for t in scene["tags"]]

		self.reason = None

		self.codec = file['video_codec'].upper()
		if self.codec in CODEC_PRIORITY:
			self.codec_priority = CODEC_PRIORITY[self.codec]
		else:
			self.codec_priority = 99
			log.warning(f"could not find codec {self.codec} used in SceneID:{self.id}")

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
				better, worse = self, other
			else:
				worse, better = self, other
			worse.reason = "resolution"
			return better, f"Better Resolution {better.id}:{better.height}p > {worse.id}:{worse.height}p"
		return None, None
	def compare_bitrate(self, other):
		# Checking Bitrate
		if self.bitrate != other.bitrate:
			if self.bitrate > other.bitrate:
				better, worse = self, other
			else:
				worse, better = self, other
			worse.reason = "bitrate"
			return better, f"Better Bitrate {human_bits(better.bitrate)}ps > {human_bits(worse.bitrate)}ps Δ:({human_bits(better.bitrate-other.bitrate)}ps)"
		return None, None
	def compare_size(self, other):
		# Checking Size
		if abs(self.size-other.size) > 100000: # diff is > than 0.1 Mb
			if self.size > other.size:
				better, worse = self, other
			else:
				worse, better = self, other
			worse.reason = "file_size"
			return better, f"Better Size {human_bytes(better.size)} > {human_bytes(worse.size)} Δ:({human_bytes(better.size-worse.size)})"
		return None, None
	def compare_age(self, other):
		# Checking Age
		if (self.mod_time and other.mod_time) and (self.mod_time != other.mod_time):
			if self.mod_time < other.mod_time:
				better, worse = self, other
			else:
				worse, better = self, other
			worse.reason = "age"
			return better, f"Choose Oldest: Δ:{worse.mod_time-better.mod_time} | {better.id} older than {worse.id}"
		return None, None
	def compare_encoding(self, other):
		if self.codec_priority != other.codec_priority:
			try:
				if self.codec_priority < other.codec_priority:
					better, worse = self, other
				else:
					worse, better = self, other
				worse.reason = "video_codec"
				return self, f"Prefer Codec {better.codec}({better.id}) over {worse.codec}({worse.id})"
			except TypeError:
				# could not find one of the codecs in priority list (comparing int to str)
				pass
		return None, None


def process_duplicates(distance:PhashDistance=PhashDistance.EXACT):
	
	clean_scenes() # clean old results

	ignore_tag_id = stash.find_tag(IGNORE_TAG_NAME, create=True).get("id")
	duplicate_list = stash.find_duplicate_scenes(distance, fragment=SLIM_SCENE_FRAGMENT)

	total = len(duplicate_list)
	log.info(f"There is {total} sets of duplicates found.")

	for i, group in enumerate(duplicate_list):
		group = [StashScene(s) for s in group]
		filtered_group = []
		for scene in group:
			if ignore_tag_id in scene.tag_ids:
				log.debug(f"Ignore {scene.id} {scene.title}")
			else:
				filtered_group.append(scene)
		
		if len(filtered_group) > 1:
			tag_files(filtered_group)
		
		log.progress(i/total)

def tag_files(group):
	group = [StashScene(s) for s in group]

	keep_reasons = []
	keep_scene = group[0]
	for scene in group[1:]:
		better, msg = scene.compare(keep_scene)
		if better:
			keep_scene = better
		keep_reasons.append(msg)

	if not keep_scene:
		log.warning(f"could not determine better scene from {group}")
		return

	total_size = human_bytes(total_size)
	keep_scene.reasons = keep_reasons

	log.info(f"{keep_scene.id} best of:{[s.id for s in group]} {keep_scene.reasons}")

	for scene in group:
		if scene.id == keep_scene.id:
			# log.debug(f"Tag for Keeping: {scene.id} {scene.path}")
			stash.update_scenes({
				'ids': [scene.id],
				'title':  f'[PDT: {total_size}|{keep_scene.id}K] {scene.title}'
			})
		else:
			tag_ids = []
			if scene.reason:
				tag_ids.append(stash.find_tag(f'[Reason: {scene.reason}]', create=True).get('id'))
			stash.update_scenes({
				'ids': [scene.id],
				'title':  f'[PDT: {total_size}|{keep_scene.id}R] {scene.title}',
				'tag_ids': {
					'mode': 'ADD',
					'ids': tag_ids
				} 
			})

def clean_scenes():
	scenes = stash.find_scenes(f={
		"title": {
			"modifier": "MATCHES_REGEX",
			"value": "^\\[PDT: .+?\\]"
		}
	},fragment="id title")

	log.info(f"Cleaning Titles/Tags of {len(scenes)} Scenes ")
	
	# Clean scene Title
	for scene in scenes:
		title = re.sub(r'\[PDT: .+?\]\s+', '', scene['title'])
		log.info(f"Removing Dupe Title String from: [{scene['id']}] {scene['title']}")
		stash.update_scenes({
			'ids': [scene['id']],
			'title': title
		})

	# Remove Tags
	for tag in get_managed_tags():
		scene_filter={"tags":{"value": [tag['id']],"modifier": "INCLUDES","depth": 0}}
		stash.update_scenes({
			'ids': [s["id"] for s in stash.find_scenes(f=scene_filter, fragment="id")],
			'tag_ids': {
				'mode': 'REMOVE',
				'ids': [tag['id']]
			} 
		})

def get_managed_tags(fragment="id name"):
	return stash.find_tags(f={
	"name": {
		"value": "^\\[Reason",
		"modifier": "MATCHES_REGEX"
	}}, fragment=fragment)

def generate_phash():
	query = """mutation MetadataGenerate($input: GenerateMetadataInput!) {
		metadataGenerate(input: $input)
	}"""
	variables = {"phashes", True}
	stash._callGraphQL(query, variables)

if __name__ == '__main__':
	main()
