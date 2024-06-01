import os
import sys
import json
import subprocess
import csv
from typing import Any

# ----------------- Setup -----------------

def install(package):
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
    except Exception as e:
        log.error(f"Failed to install {package}: {e}. If you're running in docker or a" + 
                   "venv you may need to pip install dependencies manually using the provided requirements.txt")
        raise Exception(f"Failed to install {package}")

try:
    toRaise = False
    try:
        import stashapi.log as log
        from stashapi.stashapp import StashInterface
    except ModuleNotFoundError:
        install('stashapp-tools')
        toRaise = True

    try:
        import aiohttp
    except ModuleNotFoundError:
        install('aiohttp')
        toRaise = True

    try:
        import asyncio
    except ModuleNotFoundError:
        install('asyncio')
        toRaise = True
    
    try:
        import pydantic
    except ModuleNotFoundError:
        install('pydantic')
        toRaise = True
        
    if toRaise:
        raise Exception("Installed required packages, please retry the task.")
    
    try:
        import config
    except ModuleNotFoundError:
        log.error("Please provide a config.py file with the required variables.")
        raise Exception("Please provide a config.py file with the required variables.")

except:
    log.error("Attempted to install required packages, please retry the task.")
    sys.exit(1)
    raise
        
# ----------------- Variable Definitions -----------------

tagid_mappings = {}
tagname_mappings = {}
max_gaps = {}
min_durations = {}
required_durations = {}
semaphore = asyncio.Semaphore(config.CONCURRENT_TASK_LIMIT)
progress = 0
increment = 0.0

# ----------------- Main Execution -----------------

async def main():
    json_input = read_json_input()
    output = {}
    await run(json_input, output)
    out = json.dumps(output)
    print(out + "\n")

def read_json_input():
    json_input = sys.stdin.read()
    return json.loads(json_input)

async def run(json_input, output):
    PLUGIN_ARGS = False
    HOOKCONTEXT = False

    global stash
    global aierroed_tag_id
    global tagme_tag_id
    global ai_base_tag_id
    global ai_tagged_tag_id
    global updateme_tag_id
    try:
        log.debug(json_input["server_connection"])
        os.chdir(json_input["server_connection"]["PluginDir"])
        stash = StashInterface(json_input["server_connection"])
        aierroed_tag_id = stash.find_tag(config.aierrored_tag_name, create=True)["id"]
        tagme_tag_id = stash.find_tag(config.tagme_tag_name, create=True)["id"]
        ai_base_tag_id = stash.find_tag(config.ai_base_tag_name, create=True)["id"]
        ai_tagged_tag_id = stash.find_tag(config.aitagged_tag_name, create=True)["id"]
        updateme_tag_id = stash.find_tag(config.updateme_tag_name, create=True)["id"]
    except Exception:
        raise

    try:
        parse_csv("tag_mappings.csv")
    except Exception as e:
        log.error("Failed to parse tag_mappings.csv: {e}")

    try:
        PLUGIN_ARGS = json_input['args']["mode"]
    except:
        pass
    if PLUGIN_ARGS == "tag_images":
        await tag_images()
        output["output"] = "ok"
        return
    elif PLUGIN_ARGS == "tag_scenes":
        await tag_scenes()
        output["output"] = "ok"
        return
    output["output"] = "ok"
    return


# ----------------- High Level Calls -----------------

async def tag_images():
    global increment
    images = stash.find_images(f={"tags": {"value":tagme_tag_id, "modifier":"INCLUDES"}}, fragment="id files {path}")
    if images:
        image_batches = [images[i:i + config.IMAGE_REQUEST_BATCH_SIZE] for i in range(0, len(images), config.IMAGE_REQUEST_BATCH_SIZE)]
        increment = 1.0 / len(image_batches)
        tasks = [__tag_images(batch) for batch in image_batches]
        await asyncio.gather(*tasks)
    else:
        log.info("No images to tag")


async def tag_scenes():
    global increment
    scenes = stash.find_scenes(f={"tags": {"value":tagme_tag_id, "modifier":"INCLUDES"}}, fragment="id files {path}")
    increment = 1.0 / len(scenes)
    if scenes:
        tasks = [__tag_scene(scene) for scene in scenes]
        await asyncio.gather(*tasks)
    else:
        log.info("No scenes to tag")

# ----------------- Image Processing -----------------

def add_error_images(image_ids):
    stash.update_images({"ids": image_ids, "tag_ids": {"ids": [aierroed_tag_id], "mode": "ADD"}})

async def __tag_images(images):
    async with semaphore:
        imagePaths = [image['files'][0]['path'] for image in images]
        imageIds = [image['id'] for image in images]
        #TODO
        try:
            server_results = ImageResult(**await process_images_async(imagePaths))
            process_server_image_results(server_results, imageIds)
        except Exception as e:
            log.error(f"Failed to process images: {e}")
            add_error_images(imageIds)
            stash.update_images({"ids": imageIds, "tag_ids": {"ids": [tagme_tag_id], "mode": "REMOVE"}})
        finally:
            increment_progress()
        


def process_server_image_results(server_results, imageIds):
    results = server_results.result
    if results is None:
        add_error_images(imageIds)
    elif len(results) == 0:
        log.error("Server returned no results")
        add_error_images(imageIds)
    elif len(results) != len(imageIds):
        log.error("Server returned incorrect number of results")
        add_error_images(imageIds)
    else:
        for id, result in zip(imageIds, results):
            if 'error' in result:
                log.error(f"Error processing image: {result['error']}")
                stash.update_images({"ids": [id], "tag_ids": {"ids": [aierroed_tag_id], "mode": "ADD"}})
            else:
                actions = result['actions']
                action_stashtag_ids = [tagid_mappings[action] for action in actions if action in tagid_mappings]
                action_stashtag_ids.append(ai_tagged_tag_id)
                stash.update_images({"ids": [id], "tag_ids": {"ids": action_stashtag_ids, "mode": "ADD"}})

    log.info(f"Tagged {len(imageIds)} images")
    stash.update_images({"ids": imageIds, "tag_ids": {"ids": [tagme_tag_id], "mode": "REMOVE"}})

# ----------------- Scene Processing -----------------

def add_error_scene(scene_id):
    stash.update_scenes({"ids": [scene_id], "tag_ids": {"ids": [aierroed_tag_id], "mode": "ADD"}})

async def __tag_scene(scene):
    async with semaphore:
        scenePath = scene['files'][0]['path']
        sceneId = scene['id']
        try:
            server_result = VideoResult(**await process_video_async(scenePath))
            process_server_video_result(server_result, sceneId, scenePath)
        except Exception as e:
            log.error(f"Failed to process video: {e}")
            add_error_scene(sceneId)
            stash.update_scenes({"ids": [sceneId], "tag_ids": {"ids": [tagme_tag_id], "mode": "REMOVE"}})
            return
        finally:
            increment_progress()
        

def process_server_video_result(server_result, sceneId, scenePath):
    results = server_result.result
    if results is None:
        add_error_scene(sceneId)    
    elif len(results) == 0:
        log.error("Server returned no results")
        add_error_scene(sceneId)
    else:
        # Get the directory of the scene file
        directory = os.path.dirname(scenePath)
        # Get the base name of the scene file (without the extension)
        base_name = os.path.splitext(os.path.basename(scenePath))[0]
        # Create the CSV file path
        csv_path = os.path.join(directory, base_name + f"__{server_result.pipeline_short_name}__{server_result.pipeline_version}.csv")
        save_to_csv(csv_path, results)

        # Step 1: Group results by tag
        timespan = results[1]['frame_index'] - results[0]['frame_index']
        log.info(f"Timespan: {timespan}")
        tag_timestamps = {}
        for result in results:
            for action in result['actions']:
                if action not in tag_timestamps:
                    tag_timestamps[action] = []
                tag_timestamps[action].append(result['frame_index'])

        # Step 2: Process each tag
        tag_durations = {}
        for tag, timestamps in tag_timestamps.items():
            start = timestamps[0]
            total_duration = 0
            for i in range(1, len(timestamps)):
                if timestamps[i] - timestamps[i - 1] > timespan + max_gaps.get(tag, 0):
                    # End of current marker, start of new one
                    duration = timestamps[i - 1] - start

                    min_duration_temp = min_durations.get(tag, 0)
                    min_duration_temp = min_duration_temp if min_duration_temp > timespan else timespan
                    if duration >= min_duration_temp:
                        # The marker is long enough, add its duration
                        total_duration += duration

                        # README: This code works for generating markers but stash markers don't have a way to be deleted in batch and are missing a lot of other 
                        # needed features so this code will remain disabled until stash adds the needed features.

                        # log.debug(f"Creating marker for {tagname_mappings[tag]} with range {start} - {timestamps[i - 1]}")
                        # stash.create_scene_marker({"scene_id": sceneId, "primary_tag_id":tagid_mappings[tag], "tag_ids": [tagid_mappings[tag]], "seconds": start, "title":tagname_mappings[tag]})
                    start = timestamps[i]
            # Check the last marker
            duration = timestamps[-1] - start
            if duration >= min_durations.get(tag, 0):
                total_duration += duration

                # README: This code works for generating markers but stash markers don't have a way to be deleted in batch and are missing a lot of other 
                # needed features so this code will remain disabled until stash adds the needed features.

                # log.debug(f"Creating marker for {tagname_mappings[tag]} with range {start} - {timestamps[-1]}")
                # stash.create_scene_marker({"scene_id": sceneId, "primary_tag_id":tagid_mappings[tag], "tag_ids": [tagid_mappings[tag]], "seconds": start, "title":tagname_mappings[tag]})
            tag_durations[tag] = total_duration
        scene_duration = results[-1]['frame_index']

        # Step 3: Check if each tag meets the required duration

        tags_to_add = [ai_tagged_tag_id]
        for tag, duration in tag_durations.items():
            required_duration = required_durations.get(tag, "0s")
            if required_duration.endswith("s"):
                required_duration = float(required_duration[:-1])
            elif required_duration.endswith("%"):
                required_duration = float(required_duration[:-1]) / 100 * scene_duration
            if duration < required_duration:
                log.debug(f"Tag {tagname_mappings[tag]} does not meet the required duration of {required_duration}s. It only has a duration of {duration}s.")
            else:
                log.debug(f"Tag {tagname_mappings[tag]} meets the required duration of {required_duration}s. It has a duration of {duration}s.")
                tags_to_add.append(tagid_mappings[tag])

    log.info(f"Processed video with {len(results)} AI tagged frames")
    stash.update_scenes({"ids": [sceneId], "tag_ids": {"ids": [tagme_tag_id], "mode": "REMOVE"}})
    stash.update_scenes({"ids": [sceneId], "tag_ids": {"ids": tags_to_add, "mode": "ADD"}})

# ----------------- AI Server Calling Functions -----------------

async def call_api_async(session, endpoint, payload):
    url = f'{config.API_BASE_URL}/{endpoint}'
    try:
        async with session.post(url, json=payload) as response:
            if response.status == 200:
                return await response.json()
            else:
                log.error(f"Failed to process {endpoint} status_code: {response.status}")
                return None
    except aiohttp.ClientConnectionError as e:
        log.error(f"Failed to connect to AI server. Is the AI server running at {config.API_BASE_URL}?   {e}")
        raise Exception(f"Failed to connect to AI server. Is the AI server running at {config.API_BASE_URL}?")

async def process_images_async(image_paths):
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=1800)) as session:
        return await call_api_async(session, 'process_images/', {"paths": image_paths})
    
async def process_video_async(video_path):
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=1800)) as session:
        return await call_api_async(session, 'process_video/', {"path": video_path})
    
class VideoResult(pydantic.BaseModel):
    result: Any
    pipeline_short_name: str
    pipeline_version: float

class ImageResult(pydantic.BaseModel):
    result: Any
    pipeline_short_name: str
    pipeline_version: float
    
# ----------------- Utility Functions -----------------

def save_to_csv(file_path, server_result):
    with open(file_path, mode='w', newline='') as outfile:
        writer = csv.writer(outfile)
        for result in server_result:
            timestamp = result["frame_index"]
            row = [timestamp] + result['actions']
            writer.writerow(row)
                
def parse_csv(file_path):
    global tagid_mappings
    global tagname_mappings
    global max_gaps
    global min_durations
    global required_durations

    with open(file_path, mode='r') as infile:
        reader = csv.DictReader(infile)
        for row in reader:
            server_tag = row['ServerTag']
            stash_tag = row['StashTag']
            min_duration = float(row['MinDuration'])
            max_gap = float(row['MaxGap'])
            required_duration = row['RequiredDuration']

            tag = stash.find_tag(stash_tag)
            if not tag:
                tag = stash.create_tag({"name":stash_tag, "ignore_auto_tag": True, "parent_ids":[ai_base_tag_id]})
            
            tagid_mappings[server_tag] = tag["id"]
            tagname_mappings[server_tag] = stash_tag
            min_durations[server_tag] = min_duration
            max_gaps[server_tag] = max_gap
            required_durations[server_tag] = required_duration

def increment_progress():
    global progress
    global increment
    progress += increment
    log.progress(progress)
asyncio.run(main())
