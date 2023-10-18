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

SLIM_SCENE_FRAGMENT = """
id
title
date
path
file_mod_time
tags { id }
file {
	size
	width
	height
	bitrate
	duration
	framerate
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
		self.id = int(scene['id'])
		self.mod_time = parse_timestamp(scene['file_mod_time'])
		if scene.get("date"):
			self.date = parse_timestamp(scene['date'], format="%Y-%m-%d")
		else:
			self.date = None
		self.path = scene.get("path")
		self.width = scene['file']['width']
		self.height = scene['file']['height']
		# File size in # of BYTES
		self.size = int(scene['file']['size'])
		self.frame_rate = int(scene['file']['framerate'])
		self.bitrate = int(scene['file']['bitrate'])
		self.duration = float(scene['file']['duration'])
		# replace any existing tagged title
		self.title = re.sub(r'^\[Dupe: \d+[KR]\]\s+', '', scene['title'])
		self.path = scene['path']
		self.tag_ids = [t["id"]for t in scene["tags"]]

		self.reason = None

		self.codec = scene['file']['video_codec'].upper()
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
		if (self.date and other.date) and (self.date != other.date):
			if self.date < other.date:
				better, worse = self, other
			else:
				worse, better = self, other
			worse.reason = "age"
			return better, f"Choose Oldest: Δ:{worse.date-better.date} | {better.id} older than {worse.id}"
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

	ignore_tag_id = stash.find_tag('[Dupe: Ignore]', create=True).get("id")
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
	keep_tag_id = stash.find_tag('[Dupe: Keep]', create=True).get("id")
	remove_tag_id = stash.find_tag('[Dupe: Remove]', create=True).get("id")

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
				'title':  f'[PDT: {total_size}|{keep_scene.id}K] {scene.title}',
				'tag_ids': {
					'mode': 'ADD',
					'ids': [keep_tag_id]
				} 
			})
		else:
			tag_ids = [remove_tag_id]
			if scene.reason:
				tag_ids.append(stash.find_tag(f'[Reason: {scene.reason}]', create=True).get('id'))
			stash.update_scenes({
				'ids': [scene.id],
				'title':  f'[PDT: {total_size}|{keep_scene.id}R] {scene.title}',
				'tag_ids': {
					'mode': 'ADD',
					'ids': [remove_tag_id]
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
	tag_ids_to_remove = []
	keep_tag = stash.find_tag('[Dupe: Keep]')
	if keep_tag:
		tag_ids_to_remove.append(keep_tag["id"])
	remove_tag = stash.find_tag('[Dupe: Remove]')
	if remove_tag:
		tag_ids_to_remove.append(remove_tag["id"])
	reason_tags = stash.find_tags(f={
	"name": {
		"value": "^\\[Reason",
		"modifier": "MATCHES_REGEX"
	}})
	tag_ids_to_remove.extend([t["id"] for t in reason_tags])

	for tag_id in tag_ids_to_remove:
		scene_filter={"tags":{"value": [tag_id],"modifier": "INCLUDES","depth": 0}}
		stash.update_scenes({
			'ids': [s["id"] for s in stash.find_scenes(f=scene_filter, fragment="id")],
			'tag_ids': {
				'mode': 'REMOVE',
				'ids': [tag_id]
			} 
		})

		
def generate_phash():
	query = """mutation MetadataGenerate($input: GenerateMetadataInput!) {
		metadataGenerate(input: $input)
	}"""
	variables = {"phashes", True}
	stash._callGraphQL(query, variables)

if __name__ == '__main__':
	main()
