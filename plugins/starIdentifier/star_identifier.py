# https://github.com/axxeman23/star_identifier

# built-in
import json
import sys
import os
import pathlib
from concurrent.futures import ProcessPoolExecutor

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

  futures_list = []

  with ProcessPoolExecutor(max_workers=10) as executor:
    for performer in performers:
      futures_list.append(executor.submit(encode_performer_from_url, performer))

    for future in futures_list:
      log.LogProgress(count / total)

      try:
        result = future.result()
        outputDict[result['id']] = result['encodings']
      except IndexError:
        log.LogInfo(f"No face found for {result['name']}")
        errorList.append({ 'id': result['id'], 'name': result['name'] })

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

# Encoding

def encode_performer_from_url(performer):
  image = face_recognition.load_image_file(urllib.request.urlopen(performer['image_path']))
  performer['encodings'] = face_recognition.face_encodings(image)[0]
  return performer


# Matching

def get_recognized_ids_from_image(image, known_face_encodings, ids):
  image['matched_ids'] = get_recognized_ids(face_recognition.load_image_file(image['path']), known_face_encodings, ids)

  return image

def get_recognized_ids_from_scene_screenshot(scene, known_face_encodings, ids):
  image = urllib.request.urlopen(scene['paths']['screenshot'])
  scene['matched_ids'] = get_recognized_ids(face_recognition.load_image_file(image), known_face_encodings, ids)

  return scene

def get_recognized_ids(image_file, known_face_encodings, ids):
  unknown_face_encodings = face_recognition.face_encodings(image_file)
  
  recognized_ids = np.empty((0,0), int)

  for unknown_face in unknown_face_encodings:
    results = face_recognition.compare_faces(known_face_encodings, unknown_face, tolerance=config.tolerance)

    recognized_ids = np.append(recognized_ids, [ids[i] for i in range(len(results)) if results[i] == True])

  return np.unique(recognized_ids).tolist()

# Execution

def execute_identification_list(known_face_encodings, ids, args):
  count = 0
  futures_list = []

  with ProcessPoolExecutor(max_workers=10) as executor:
    for item in args['items']:
      futures_list.append(executor.submit(args['executor_func'], *[item, known_face_encodings, ids]))

    for future in futures_list:
      log.LogProgress(count / args['total'])

      debug_print(future)

      try:
        result = future.result()

        if not len(result['matched_ids']):
          log.LogInfo(f"No matching performer found for {args['name']} id {result['id']}. Moving on to next {args['name']}...")
        else:
          log.LogDebug(f"updating {args['name']} {result['id']} with ")
          args['submit_func'](result['id'], result['matched_ids'])
      except IndexError:
        log.LogError(f"No face found in tagged {args['name']} id {result['id']}. Moving on to next {args['name']}...")
      except:
        log.LogError(f"Unknown error comparing tagged {args['name']} id {result['id']}. Moving on to next {args['name']}...")

      count += 1

# Imgs

def identify_imgs(client, ids, known_face_encodings):
  log.LogInfo(f"Getting images tagged with '{config.tag_name_identify}'...")

  images = client.findImages(get_scrape_tag_filter(client))
  total = len(images)

  if not total:
    log.LogError(f"No tagged images found. Tag images with '{config.tag_name_identify}', then try again.")
    return
  
  log.LogInfo(f"Found {total} tagged images. Starting identification...")

  execution_args = {
    'name': 'image',
    'items': images,
    'total': total,
    'executor_func': get_recognized_ids_from_image,
    'submit_func': client.addPerformersToImage
  }

  execute_identification_list(
    known_face_encodings, 
    ids,
    execution_args
    )
  
  log.LogInfo('Image identification complete!')

# Scenes

def identify_scene_screenshots(client, ids, known_face_encodings):  
  log.LogInfo(f"Getting scenes tagged with '{config.tag_name_identify}'...")

  scenes = client.getScenePaths(get_scrape_tag_filter(client))
  total = len(scenes)

  if not total:
    log.LogError(f"No tagged scenes found. Tag scenes with '{config.tag_name_identify}', then try again.")
    return
  
  log.LogInfo(f"Found {total} tagged scenes. Starting identification...")

  execution_args = {
    'name': 'scene',
    'items': scenes,
    'total': total,
    'executor_func': get_recognized_ids_from_scene_screenshot,
    'submit_func': client.addPerformersToScene
  }

  execute_identification_list(
    known_face_encodings, 
    ids,
    execution_args
    )

  log.LogInfo("Scene screenshot identification complete!")

if __name__ == "__main__":
  main()


# https://github.com/ageitgey/face_recognition
# https://github.com/ageitgey/face_recognition/issues/175