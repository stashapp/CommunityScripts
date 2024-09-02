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
        
    if toRaise:
        raise Exception("Installed required packages, please retry the task.")
    
    try:
        import config
    except ModuleNotFoundError:
        log.error("Please provide a config.py file with the required variables.")
        raise Exception("Please provide a config.py file with the required variables.")
    from ai_video_result import AIVideoResult
    import media_handler
    import ai_server
except:
    log.error("Attempted to install required packages, please retry the task.")
    sys.exit(1)
    raise
        
# ----------------- Variable Definitions -----------------

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

# ----------------- Image Processing -----------------

async def __tag_images(images):
    async with semaphore:
        imagePaths, imageIds, temp_files = media_handler.get_image_paths_and_ids(images)
        mutated_image_paths = []
        for path in imagePaths:
            mutated_path = path
            for key, value in config.path_mutation.items():
                mutated_path = mutated_path.replace(key, value)
            mutated_image_paths.append(mutated_path)
        imagePaths = mutated_image_paths
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
                for id, result in zip(imageIds, results):
                    if 'error' in result:
                        log.error(f"Error processing image: {result['error']}")
                        media_handler.add_error_images([id])
                    else:
                        tags = media_handler.get_all_tags_from_server_result(result)
                        stashtag_ids = media_handler.get_tag_ids(tags)
                        stashtag_ids.append(media_handler.ai_tagged_tag_id)
                        media_handler.add_tags_to_image(id, stashtag_ids)

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
        mutated_path = scenePath
        for key, value in config.path_mutation.items():
            mutated_path = mutated_path.replace(key, value)
        sceneId = scene['id']
        log.debug("files result:" + str(scene['files'][0]))
        phash = scene['files'][0].get('fingerprint', None)
        duration = scene['files'][0].get('duration', None)
        if duration is None:
            log.error(f"Scene {sceneId} has no duration")
            return
        try:
            already_ai_tagged = media_handler.is_scene_tagged(scene.get('tags'))
            ai_file_path = scenePath + ".AI.json"
            ai_video_result = None
            if already_ai_tagged:
                if os.path.exists(ai_file_path):
                    try:
                        ai_video_result = AIVideoResult.from_json_file(ai_file_path)
                        current_pipeline_video = await ai_server.get_current_video_pipeline()
                        if ai_video_result.already_contains_model(current_pipeline_video):
                            log.info(f"Skipping running AI for scene {scenePath} as it has already been processed with the same pipeline version and configuration. Updating tags and markers instead.")
                            ai_video_result.update_stash_tags()
                            ai_video_result.update_stash_markers()
                            return
                    except Exception as e:
                        log.error(f"Failed to load AI results from file: {e}")
                elif os.path.exists(os.path.join(os.path.dirname(scenePath), os.path.splitext(os.path.basename(scenePath))[0] + f"__vid_giddy__1.0.csv")):
                    ai_video_result = AIVideoResult.from_csv_file(os.path.join(os.path.dirname(scenePath), os.path.splitext(os.path.basename(scenePath))[0] + f"__vid_giddy__1.0.csv"), scene_id=sceneId, phash=phash, duration=duration)
                    log.info(f"Loading AI results from CSV file for scene {scenePath}")
                    current_pipeline_video = await ai_server.get_current_video_pipeline()
                    if ai_video_result.already_contains_model(current_pipeline_video):
                        log.info(f"Skipping running AI for scene {scenePath} as it has already been processed with the same pipeline version and configuration. Updating tags and markers instead.")
                        ai_video_result.to_json_file(ai_file_path)
                        ai_video_result.update_stash_tags()
                        ai_video_result.update_stash_markers()
                        return
                elif os.path.exists(os.path.join(os.path.dirname(scenePath), os.path.splitext(os.path.basename(scenePath))[0] + f"__actiondetection__1.0.csv")):
                    ai_video_result = AIVideoResult.from_csv_file(os.path.join(os.path.dirname(scenePath), os.path.splitext(os.path.basename(scenePath))[0] + f"__actiondetection__1.0.csv"), scene_id=sceneId, phash=phash, duration=duration, version=1.0)
                    log.info(f"Loading AI results from CSV file for scene {scenePath}")
                    current_pipeline_video = await ai_server.get_current_video_pipeline()
                    if ai_video_result.already_contains_model(current_pipeline_video):
                        log.info(f"Skipping running AI for scene {scenePath} as it has already been processed with the same pipeline version and configuration. Updating tags and markers instead.")
                        ai_video_result.to_json_file(ai_file_path)
                        ai_video_result.update_stash_tags()
                        ai_video_result.update_stash_markers()
                        return
                elif os.path.exists(os.path.join(os.path.dirname(scenePath), os.path.splitext(os.path.basename(scenePath))[0] + f"__actiondetection__2.0.csv")):
                    ai_video_result = AIVideoResult.from_csv_file(os.path.join(os.path.dirname(scenePath), os.path.splitext(os.path.basename(scenePath))[0] + f"__actiondetection__2.0.csv"), scene_id=sceneId, phash=phash, duration=duration, version=2.0)
                    log.info(f"Loading AI results from CSV file for scene {scenePath}")
                    current_pipeline_video = await ai_server.get_current_video_pipeline()
                    if ai_video_result.already_contains_model(current_pipeline_video):
                        log.info(f"Skipping running AI for scene {scenePath} as it has already been processed with the same pipeline version and configuration. Updating tags and markers instead.")
                        ai_video_result.to_json_file(ai_file_path)
                        ai_video_result.update_stash_tags()
                        ai_video_result.update_stash_markers()
                        return
                else:
                    log.warning(f"Scene {scenePath} is already tagged but has no AI results file. Running AI again.")
            vr_video = media_handler.is_vr_scene(scene.get('tags'))
            if vr_video:
                log.info(f"Processing VR video {scenePath}")
            server_result = await ai_server.process_video_async(mutated_path, vr_video)
            if server_result is None:
                log.error("Server returned no results")
                media_handler.add_error_scene(sceneId)
                media_handler.remove_tagme_tag_from_scene(sceneId)
                return
            server_result = ai_server.VideoResult(**server_result)
            if ai_video_result:
                ai_video_result.add_server_response(server_result)
            else:
                ai_video_result = AIVideoResult.from_server_response(server_result, sceneId, phash, duration)
            ai_video_result.to_json_file(ai_file_path)
            ai_video_result.update_stash_tags()
            ai_video_result.update_stash_markers()
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
    
# ----------------- Utility Functions -----------------

def increment_progress():
    global progress
    global increment
    progress += increment
    log.progress(progress)
asyncio.run(main())
