from PythonDepManager import ensure_import
ensure_import("piexif==1.1.3")
ensure_import("stashapi:stashapp-tools>=0.2.58")
import os
#from pickle import TRUE
import sys, json
import uuid
import stashapi.log as log
from stashapi.stashapp import StashInterface
import pathlib
import piexif
import subprocess
from PIL import Image, PngImagePlugin

def main():
	global stash
	global pattern

	
	json_input = json.loads(sys.stdin.read())
	hookContext = json_input['args'].get("hookContext")
	stash = StashInterface(json_input["server_connection"])
	mode_arg = json_input["args"]["mode"]
	if hookContext and (hookContext.get("type") == "Image.Create.Post") and (hookContext.get("date") is None):
		#updateImages(hookContext.get('id'))
		getDateFromImage(hookContext.get('id'))
	elif mode_arg == "find":
		getDateFromImages()

def getDateFromImage(imageID):
	image = stash.find_image(imageID)
	if image and image["date"] is None:
		date = None
		if image["visual_files"][0]["path"]:
			path = pathlib.Path(image["visual_files"][0]["path"])
			ext = path.suffix.lower()
			try:
				if ext in [".jpg", ".jpeg", ".tiff"]:
					# Try EXIF
					exif_dict = piexif.load(str(path))
					for tag in ["DateTimeOriginal", "DateTimeDigitized", "DateTime"]:
						value = exif_dict["Exif"].get(piexif.ExifIFD.__dict__.get(tag))
						if value:
							date = value.decode().split(" ")[0].replace(":", "-")
							break
				elif ext == ".png":
					# Try PNG tEXt/iTXt
					with Image.open(path) as img:
						info = img.info
						for key in ["date:create", "date:modify", "Creation Time", "creation_time"]:
							if key in info:
								date = info[key].split(" ")[0].replace(":", "-")
								break
						# Try PngImagePlugin for tEXt chunks
						if not date and isinstance(img, PngImagePlugin.PngImageFile):
							for k, v in img.text.items():
								if "date" in k.lower() or "time" in k.lower():
									date = v.split(" ")[0].replace(":", "-")
									break
				elif ext in [".webp", ".gif"]:
					# Try XMP metadata (if present)
					with open(path, "rb") as f:
						data = f.read()
						xmp_start = data.find(b"<x:xmpmeta")
						xmp_end = data.find(b"</x:xmpmeta>")
						if xmp_start != -1 and xmp_end != -1:
							xmp = data[xmp_start:xmp_end+12].decode(errors="ignore")
							import re
							m = re.search(r"DateTimeOriginal>([\d\-: ]+)<", xmp)
							if m:
								date = m.group(1).split(" ")[0].replace(":", "-")
				elif ext in [".mp4", ".webm"]:
					# Use ffprobe to get creation_time
					try:
						result = subprocess.run(
							[
								"ffprobe", "-v", "error", "-select_streams", "v:0",
								"-show_entries", "format_tags=creation_time",
								"-of", "default=noprint_wrappers=1:nokey=1",
								str(path)
							],
							stdout=subprocess.PIPE,
							stderr=subprocess.PIPE,
							text=True
						)
						if result.stdout:
							date = result.stdout.strip().split("T")[0]
					except Exception as e:
						log.info(f"ffprobe error: {e}")
			except Exception as e:
				log.info(f"Metadata extraction error: {e}")
		if date:
			stash.update_image({
				"id": imageID,
				"date": date
			})
			log.info("Updated image "+str(path)+" with date "+str(date))

def getDateFromImages():
	images = stash.find_images(f={
		"date": {
			"modifier": "IS_NULL",
			"value": ""
		},
		"galleries": {
			"modifier": "IS_NULL",
			"value": []
		}
		},fragment="id")
	tasks = len(images)
	log.info(f"Found {tasks} images with no date")
	prog = 0
	for id in images:
		getDateFromImage(id["id"])
		prog += 1
		log.progress(prog / tasks)


if __name__ == "__main__":
    main()
