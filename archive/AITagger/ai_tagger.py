import os
import sys
import json
import subprocess
import shutil
import traceback
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

    try:
        import imageio
    except ModuleNotFoundError:
        install('imageio[ffmpeg]')
        
        toRaise = True
        
    if toRaise:
        raise Exception("Installed required packages, please retry the task.")
    
    try:
        import config
    except ModuleNotFoundError:
        log.error("Please provide a config.py file with the required variables.")
        raise Exception("Please provide a config.py file with the required variables.")
    import media_handler
    import ai_server
    import utility
    from datetime import datetime
except:
    log.error("Attempted to install required packages, please retry the task.")
    log.error(f"Stack trace {traceback.format_exc()}")
    sys.exit(1)
    raise
        
log.debug("Python instance is running at: " + sys.executable)
# ----------------- Variable Definitions -----------------

semaphore = None
progress = 0
increment = 0.0

# ----------------- Main Execution -----------------

async def main():
    global semaphore
    semaphore = asyncio.Semaphore(config.CONCURRENT_TASK_LIMIT)
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
    try:
        log.debug(json_input["server_connection"])
        os.chdir(json_input["server_connection"]["PluginDir"])
        media_handler.initialize(json_input["server_connection"])
    except Exception:
        raise

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
    elif PLUGIN_ARGS == "find_marker_settings":
        await find_marker_settings()
    elif PLUGIN_ARGS == "collect_incorrect_markers":
        collect_incorrect_markers_and_images()
    output["output"] = "ok"
    return

# ----------------- High Level Calls -----------------

async def tag_images():
    global increment
    images = media_handler.get_tagme_images()
    if images:
        image_batches = [images[i:i + config.IMAGE_REQUEST_BATCH_SIZE] for i in range(0, len(images), config.IMAGE_REQUEST_BATCH_SIZE)]
        increment = 1.0 / len(image_batches)
        tasks = [__tag_images(batch) for batch in image_batches]
        await asyncio.gather(*tasks)
    else:
        log.info("No images to tag. Have you tagged any images with the AI_TagMe tag to get processed?")


async def tag_scenes():
    global increment
    scenes = media_handler.get_tagme_scenes()
    if scenes:
        increment = 1.0 / len(scenes)
        tasks = [__tag_scene(scene) for scene in scenes]
        await asyncio.gather(*tasks)
    else:
        log.info("No scenes to tag. Have you tagged any scenes with the AI_TagMe tag to get processed?")

async def find_marker_settings():
    scenes = media_handler.get_tagme_scenes()
    if len(scenes) != 1:
        log.error("Please tag exactly one scene with the AI_TagMe tag to get processed.")
        return
    scene = scenes[0]
    await __find_marker_settings(scene)

def collect_incorrect_markers_and_images():
    incorrect_images = media_handler.get_incorrect_images()
    imagePaths, imageIds, temp_files = media_handler.get_image_paths_and_ids(incorrect_images)
    incorrect_markers = media_handler.get_incorrect_markers()
    if not (len(incorrect_images) > 0 or len(incorrect_markers) > 0):
        log.info("No incorrect images or markers to collect.")
        return
    current_time = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    try:
        image_folder = os.path.join(config.output_data_dir, "images")
        os.makedirs(image_folder, exist_ok=True)
        for imagePath in imagePaths:
            try:
                shutil.copy(imagePath, image_folder)
            except Exception as e:
                log.error(f"Failed to copy image {imagePath} to {image_folder}: {e}")
    except Exception as e:
        log.error(f"Failed to process images: {e}")
        raise e
    finally:
        for temp_file in temp_files:
                try:
                    if os.path.isdir(temp_file):
                        shutil.rmtree(temp_file)
                    else:
                        os.remove(temp_file)
                except Exception as e:
                    log.debug(f"Failed to remove temp file {temp_file}: {e}")
    

    scene_folder = os.path.join(config.output_data_dir, "scenes")
    os.makedirs(scene_folder, exist_ok=True)
    tag_folders = {}
    for marker in incorrect_markers:
        scene_path = marker['scene']['files'][0]['path']
        if not scene_path:
            log.error(f"Marker {marker['id']} has no scene path")
            continue
        try:
            tag_name = marker['primary_tag']['name']
            if tag_name not in tag_folders:
                tag_folders[tag_name] = os.path.join(scene_folder, tag_name)
                os.makedirs(tag_folders[tag_name], exist_ok=True)
            media_handler.write_scene_marker_to_file(marker, scene_path, tag_folders[tag_name])

        except Exception as e:
            log.error(f"Failed to collect scene: {e}")
    image_ids = [image['id'] for image in incorrect_images]
    media_handler.remove_incorrect_tag_from_images(image_ids)

    if config.delete_incorrect_markers:
        media_handler.delete_markers(incorrect_markers)
    else:
        media_handler.remove_incorrect_tag_from_markers(incorrect_markers)

    destination_folder = "./send_to_Skier"
    os.makedirs(destination_folder, exist_ok=True)
    # Zip the entire output data directory
    output_zip_path = os.path.join(destination_folder, f"{current_time}.zip")

    shutil.make_archive(output_zip_path.replace('.zip', ''), 'zip', config.output_data_dir)
    shutil.rmtree(config.output_data_dir)
    log.info(f"Please send the following file to Skier to help improve the AI: {os.path.abspath(output_zip_path)}")


# ----------------- Image Processing -----------------

async def __tag_images(images):
    async with semaphore:
        imagePaths, imageIds, temp_files = media_handler.get_image_paths_and_ids(images)
        imagePaths = [utility.mutate_path(path) for path in imagePaths]
        try:
            server_result = await ai_server.process_images_async(imagePaths)
            if server_result is None:
                log.error("Server returned no results")
                media_handler.add_error_images(imageIds)
                media_handler.remove_tagme_tags_from_images(imageIds)
                return
            server_results = ai_server.ImageResult(**server_result)
            results = server_results.result
            if len(results) != len(imageIds):
                log.error("Server returned incorrect number of results")
                media_handler.add_error_images(imageIds)
            else:
                media_handler.remove_ai_tags_from_images(imageIds, remove_tagme=False)

                for id, result in zip(imageIds, results):
                    if 'error' in result:
                        log.error(f"Error processing image: {result['error']}")
                        media_handler.add_error_images([id])
                    else:
                        tags_list = []
                        for _, tags in result.items():
                            stashtag_ids = media_handler.get_tag_ids(tags, create=True)
                            stashtag_ids.append(media_handler.ai_tagged_tag_id)
                            tags_list.extend(stashtag_ids)
                        media_handler.add_tags_to_image(id, tags_list)

            log.info(f"Tagged {len(imageIds)} images")
            media_handler.remove_tagme_tags_from_images(imageIds)
        except aiohttp.ClientConnectionError as e:
            log.error(f"Failed to connect to AI server. Is the AI server running at {config.API_BASE_URL}?   {e}")
        except asyncio.TimeoutError as a:
            log.error(f"Timeout processing images: {a}")
        except Exception as e:
            log.error(f"Failed to process images: {e}Stack trace: {traceback.format_exc()}")
            media_handler.add_error_images(imageIds)
            media_handler.remove_tagme_tags_from_images(imageIds)
        finally:
            increment_progress()
            for temp_file in temp_files:
                try:
                    if os.path.isdir(temp_file):
                        shutil.rmtree(temp_file)
                    else:
                        os.remove(temp_file)
                except Exception as e:
                    log.debug(f"Failed to remove temp file {temp_file}: {e}")


# ----------------- Scene Processing -----------------
async def __tag_scene(scene):
    async with semaphore:
        scenePath = scene['files'][0]['path']
        sceneId = scene['id']
        duration = scene['files'][0].get('duration', None)
        log.debug("files result:" + str(scene['files'][0]))
        if duration is None:
            log.error(f"Scene {sceneId} has no duration")
            return

        mutated_path = utility.mutate_path(scenePath)

        try:
            already_ai_tagged = media_handler.is_scene_tagged(scene.get('tags'))
            ai_file_path = scenePath + ".AI.json"
            saved_json = None
            if already_ai_tagged:
                if os.path.exists(ai_file_path):
                    try:
                        saved_json = utility.read_json_from_file(ai_file_path)
                    except Exception as e:
                        log.error(f"Failed to load AI results from file: {e}")
                else:
                    log.warning(f"Scene {scenePath} is already tagged but has no AI results file. Running AI again.")
            vr_video = media_handler.is_vr_scene(scene.get('tags'))
            if vr_video:
                log.info(f"Processing VR video {scenePath}")
            server_result = await ai_server.process_video_async(video_path=mutated_path, vr_video=vr_video, existing_json=saved_json)

            if server_result is None:
                log.error("Server returned no results")
                media_handler.add_error_scene(sceneId)
                media_handler.remove_tagme_tag_from_scene(sceneId)
                return
            server_result = ai_server.VideoResult(**server_result)

            result = server_result.result
            json_to_write = result['json_result']
            if json_to_write:
                utility.write_json_to_file(ai_file_path, json_to_write)
            video_tag_info = ai_server.VideoTagInfo(**result['video_tag_info'])

            media_handler.remove_ai_tags_from_video(sceneId, remove_tagme=True)
            allTags = []
            for _, tag_set in video_tag_info.video_tags.items():
                allTags.extend(tag_set)
            tagIdsToAdd = media_handler.get_tag_ids(allTags, create=True)
            media_handler.add_tags_to_video(sceneId, tagIdsToAdd)

            #TODO: find a good place to store total durations of tags in a video and ideally be able to query them and see them in stash's UI (via custom plugin db fields?)
            #todo = video_tag_info.tag_totals

            if config.CREATE_MARKERS:
                media_handler.remove_ai_markers_from_video(sceneId)
                media_handler.add_markers_to_video_from_dict(sceneId, video_tag_info.tag_timespans)
            log.info(f"Server Result: {server_result}")
            log.info(f"Processed video with {len(server_result.result)} AI tagged frames")
        except aiohttp.ClientConnectionError as e:
            log.error(f"Failed to connect to AI server. Is the AI server running at {config.API_BASE_URL}?   {e}")
        except asyncio.TimeoutError as a:
            log.error(f"Timeout processing scene: {a}")
        except Exception as e:
            log.error(f"Failed to process video: {e}\n{traceback.format_exc()}")
            media_handler.add_error_scene(sceneId)
            media_handler.remove_tagme_tag_from_scene(sceneId)
            return
        finally:
            increment_progress()
  

# ----------------- Find Marker Settings -------------

async def __find_marker_settings(scene):
    scenePath = scene['files'][0]['path']

    already_ai_tagged = media_handler.is_scene_tagged(scene.get('tags'))
    ai_file_path = scenePath + ".AI.json"
    saved_json = None
    if already_ai_tagged:
        if os.path.exists(ai_file_path):
            try:
                saved_json = utility.read_json_from_file(ai_file_path)
            except Exception as e:
                log.error(f"Failed to load AI results from file: {e}")
        else:
            log.warning(f"Scene {scenePath} is already tagged but has no AI results file. Running AI again.")
    if saved_json is None:
        log.error(f"Scene {scenePath} has no AI results to optimize. Run the AI on this scene first and tune the markers manually.")
        return
    sorted_markers = media_handler.get_scene_markers_by_tag(scene['id'])

    for tag in sorted_markers:
        sorted_markers[tag].sort(key=lambda x: x['seconds'])

    tag_timespans = {}
    for tag, markers in sorted_markers.items():
        timeframes = [(ai_server.TimeFrame(start=marker['seconds'], end=marker['end_seconds'], totalConfidence=None)).to_json() for marker in markers]
        tag_timespans[tag] = timeframes
    log.info(f"Sending {tag_timespans} to AI server to optimize marker settings")
    await ai_server.find_optimal_marker_settings(saved_json, tag_timespans)
    

# ----------------- Utility Functions ----------------

def increment_progress():
    global progress
    global increment
    progress += increment
    log.progress(progress)
asyncio.run(main())
