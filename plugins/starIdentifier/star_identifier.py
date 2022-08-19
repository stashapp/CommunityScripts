# https://github.com/axxeman23/star_identifier

# built-in
import json
import sys
import os
import pathlib

# external
import urllib.request
import face_recognition
import numpy as np

# local
import log
import star_identifier_config as config
from star_identifier_interface import IdentifierStashInterface

#
# constants
#

current_path = str(config.root_path or pathlib.Path(__file__).parent.absolute())
encoding_export_folder = str(pathlib.Path(current_path + f'/../{config.encodings_folder}/').absolute())

encodings_path = os.path.join(encoding_export_folder, config.encodings_filename)
errors_path = os.path.join(encoding_export_folder, config.encodings_error_filename)

#
# main
#

def main():
  json_input = read_json_input()

  output = {}

  try:
    run(json_input)
  except Exception as error:
    log.LogError(str(error))
    return

  out = json.dumps(output)
  print(out + "\n")

def run(json_input):
  log.LogInfo('==> running')
  mode_arg = json_input['args']['mode']
  client = IdentifierStashInterface(json_input["server_connection"])

  match mode_arg:
    case "export_known":
      export_known(client)
    case "identify_imgs":
      identify_imgs(client, *load_encodings())
    case "identify_scene_screenshots":
      identify_scene_screenshots(client, *load_encodings())
    case "debug":
      debug_func(client)
    case _:
      export_known(client)

#
# utils
#

def read_json_input():
  json_input = sys.stdin.read()
  return json.loads(json_input)

def json_print(input, path):
  os.makedirs(encoding_export_folder, exist_ok=True)
  f = open(path, 'w')
  json.dump(input, f)
  f.close()

def get_scrape_tag(client, tag_name):
  tag_id = client.findTagIdWithName(tag_name)
  if tag_id is not None:
    return tag_id
  else:
    client.createTagWithName(tag_name)
    tag_id = client.findTagIdWithName(tag_name)
    return tag_id

def get_scrape_tag_filter(client):
  return {
    "tags": {
      "value": [get_scrape_tag(client, config.tag_name_identify)],
      "modifier": "INCLUDES_ALL"
    }
  }

def load_encodings():
  log.LogInfo("Loading exported face encodings...")

  e = Exception(f"Encoding database not found at {encodings_path}. Run Export Performers and try again.")
  try:
    ids = []
    known_face_encodings = []
    npz = np.load(encodings_path)

    if not len(npz):
      raise e

    for id in npz:
      ids.append(id)
      known_face_encodings.append(npz[id])

    return [ids, known_face_encodings]
  except FileNotFoundError:
    raise e

#
# debug
#

def debug_print(input):
  f = open(os.path.join(current_path, 'debug.txt'), 'a')
  f.write(str(input))
  f.close()

def debug_func(client):
  f = open(os.path.join(current_path, 'debug.txt'), 'w')
  f.close()

#
# export function
#

def export_known(client):
  # This would be faster multi-threaded, but that seems to break face_recognition

  log.LogInfo('Getting all performer images...')
  
  performers = client.getPerformerImages()
  total = len(performers)

  log.LogInfo(f"Found {total} performers")

  if total == 0:
    log.LogError('No performers found.')
    return

  os.makedirs(encoding_export_folder, exist_ok=True)

  count = 0
  outputDict = {}
  errorList = []

  log.LogInfo('Starting performer image export (this might take a while)')

  for performer in performers:
    log.LogProgress(count / total)

    image = face_recognition.load_image_file(urllib.request.urlopen(performer['image_path']))
    try:
      encoding = face_recognition.face_encodings(image)[0]
      outputDict[performer['id']] = encoding
    except IndexError:
      log.LogInfo(f"No face found for {performer['name']}")
      errorList.append(performer)

    count += 1

  np.savez(encodings_path, **outputDict)
  json_print(errorList, errors_path)

  log.LogInfo(f'Finished exporting all {total} performer images. Failed recognitions saved to {str(errors_path)}.')

  error_tag = get_scrape_tag(client, config.tag_name_encoding_error)
  error_ids = list(map(lambda entry: entry['id'], errorList))

  log.LogInfo(f"Tagging failed performer exports with {config.tag_name_encoding_error}...")
  client.bulkPerformerAddTags(error_ids, [error_tag])

#
# Facial recognition functions
#


def get_recognized_ids_from_path(image_path, known_face_encodings, ids):
  return get_recognized_ids(face_recognition.load_image_file(image_path), known_face_encodings, ids)

def get_recognized_ids_from_url(image_url, known_face_encodings, ids):
  image = urllib.request.urlopen(image_url)
  return get_recognized_ids(face_recognition.load_image_file(image), known_face_encodings, ids)

def get_recognized_ids(image_file, known_face_encodings, ids):
  unknown_face_encodings = face_recognition.face_encodings(image_file)
  
  recognized_ids = np.empty((0,0), int)

  for unknown_face in unknown_face_encodings:
    results = face_recognition.compare_faces(known_face_encodings, unknown_face)

    recognized_ids = np.append(recognized_ids, [ids[i] for i in range(len(results)) if results[i] == True])

  return np.unique(recognized_ids).tolist()

# Imgs

def identify_imgs(client, ids, known_face_encodings):
  log.LogInfo(f"Getting images tagged with '{config.tag_name_identify}'...")

  images = client.findImages(get_scrape_tag_filter(client))
  count = 0
  total = len(images)

  if not total:
    log.LogError(f"No tagged images found. Tag images with '{config.tag_name_identify}', then try again.")
    return
  
  log.LogInfo(f"Found {total} tagged images. Starting identification...")

  for image in images:
    log.LogProgress(count / total)

    try:
      matching_performer_ids = get_recognized_ids_from_path(image['path'], known_face_encodings, ids)
    except IndexError:
      log.LogError(f"No face found in tagged image id {image['id']}. Moving on to next image...")
      continue
    except:
      log.LogError(f"Unknown error comparing tagged image id {image['id']}. Moving on to next image...")
      continue

    if not len(matching_performer_ids):
      log.LogInfo(f"No matching performer found for image id {image['id']}. Moving on to next image...")
      continue

    client.updateImage({
      'id': image['id'],
      'performer_ids': matching_performer_ids
    })

    count += 1
  
  log.LogInfo('Image identification complete!')

# Scenes

def identify_scene_screenshots(client, ids, known_face_encodings):  
  log.LogInfo(f"Getting scenes tagged with '{config.tag_name_identify}'...")

  scenes = client.getScenePaths(get_scrape_tag_filter(client))
  count = 0
  total = len(scenes)

  if not total:
    log.LogError(f"No tagged scenes found. Tag scenes with '{config.tag_name_identify}', then try again.")
    return
  
  log.LogInfo(f"Found {total} tagged scenes. Starting identification...")

  for scene in scenes:
    log.LogProgress(count / total)

    matching_performer_ids = np.empty((0,0), int)
    screenshot = scene['paths']['screenshot']

    try:
      matches = get_recognized_ids_from_url(screenshot, known_face_encodings, ids)
      log.LogInfo(f"{len(matches)} performers identified in scene id {scene['id']}'s screenshot")
      matching_performer_ids = np.append(matching_performer_ids, matches)
    except IndexError:
      log.LogError(f"No face found in screenshot for scene id {scene['id']}. Moving on to next image...")
      continue
    except Exception as error:
      log.LogError(f"Error type = {type(error).__name__} comparing screenshot for scene id {scene['id']}. Moving on to next image...")
      continue

    matching_performer_ids = np.unique(matching_performer_ids).tolist()

    log.LogDebug(f"Found performers in scene id {scene['id']} : {matching_performer_ids}")

    client.addPerformersToScene(scene['id'], matching_performer_ids)

    count += 1
  
  log.LogInfo("Screenshot identification complete!")

main()


# https://github.com/ageitgey/face_recognition
# https://github.com/ageitgey/face_recognition/issues/175