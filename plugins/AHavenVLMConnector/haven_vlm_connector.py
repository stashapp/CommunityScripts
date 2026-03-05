"""
A Haven VLM Connector
A StashApp plugin for Vision-Language Model based content tagging
"""

import os
import sys
import json
import shutil
import traceback
import asyncio
import logging
import time
from typing import Dict, Any, List, Optional
from datetime import datetime

# Import and install sys.exit tracking FIRST (before any other imports that might call sys.exit)
try:
    from exit_tracker import install_exit_tracker
    import stashapi.log as log
    install_exit_tracker(log)
except ImportError as e:
    print(f"Warning: exit_tracker not available: {e}")
    print("sys.exit tracking will not be available")

# ----------------- Setup and Dependencies -----------------

# Use PythonDepManager for dependency management
try:
    from PythonDepManager import ensure_import
    
    # Install and ensure all required dependencies with specific versions
    ensure_import(
        "stashapi:stashapp-tools==0.2.58",
        "aiohttp==3.12.13",
        "pydantic==2.11.7",
        "vlm-engine==0.9.3",
        "pyyaml==6.0.2"
    )
    
    # Import the dependencies after ensuring they're available
    import stashapi.log as log
    from stashapi.stashapp import StashInterface
    import aiohttp
    import pydantic
    import yaml
    
except ImportError as e:
    print(f"Failed to import PythonDepManager or required dependencies: {e}")
    print("Please ensure PythonDepManager is installed and available.")
    sys.exit(1)
except Exception as e:
    print(f"Error during dependency management: {e}")
    print(f"Stack trace: {traceback.format_exc()}")
    sys.exit(1)

# Import local modules
try:
    import haven_vlm_config as config
except ModuleNotFoundError:
    log.error("Please provide a haven_vlm_config.py file with the required variables.")
    raise Exception("Please provide a haven_vlm_config.py file with the required variables.")

import haven_media_handler as media_handler
import haven_vlm_engine as vlm_engine
from haven_vlm_engine import TimeFrame

log.debug("Python instance is running at: " + sys.executable)

# ----------------- Global Variables -----------------

semaphore: Optional[asyncio.Semaphore] = None
progress: float = 0.0
increment: float = 0.0
completed_tasks: int = 0
total_tasks: int = 0
video_progress: Dict[str, float] = {}

# ----------------- Main Execution -----------------

async def main() -> None:
    """Main entry point for the plugin"""
    global semaphore
    
    # Semaphore initialization logging for hypothesis A
    log.debug(f"[DEBUG_HYPOTHESIS_A] Initializing semaphore with limit {config.config.concurrent_task_limit}")
    
    semaphore = asyncio.Semaphore(config.config.concurrent_task_limit)
    
    # Post-semaphore creation logging
    log.debug(f"[DEBUG_HYPOTHESIS_A] Semaphore created successfully (limit: {config.config.concurrent_task_limit})")
    
    json_input = read_json_input()
    output = {}
    await run(json_input, output)
    out = json.dumps(output)
    print(out + "\n")

def read_json_input() -> Dict[str, Any]:
    """Read JSON input from stdin"""
    json_input = sys.stdin.read()
    return json.loads(json_input)

async def run(json_input: Dict[str, Any], output: Dict[str, Any]) -> None:
    """Main execution logic"""
    plugin_args = None
    try:
        log.debug(json_input["server_connection"])
        os.chdir(json_input["server_connection"]["PluginDir"])
        media_handler.initialize(json_input["server_connection"])
    except Exception as e:
        log.error(f"Failed to initialize media handler: {e}")
        raise

    try:
        plugin_args = json_input['args']["mode"]
    except KeyError:
        pass

    if plugin_args == "tag_videos":
        await tag_videos()
        output["output"] = "ok"
        return
    elif plugin_args == "find_marker_settings":
        await find_marker_settings()
        output["output"] = "ok"
        return
    elif plugin_args == "collect_incorrect_markers":
        collect_incorrect_markers_and_images()
        output["output"] = "ok"
        return
    
    output["output"] = "ok"
    return

# ----------------- High Level Processing Functions -----------------

async def tag_videos() -> None:
    """Tag videos with VLM analysis using improved async orchestration"""
    global completed_tasks, total_tasks

    scenes = media_handler.get_tagme_scenes()
    if not scenes:
        log.info("No videos to tag. Have you tagged any scenes with the VLM_TagMe tag to get processed?")
        return
    
    total_tasks = len(scenes)
    completed_tasks = 0
    
    video_progress.clear()
    for scene in scenes:
        video_progress[scene.get('id', 'unknown')] = 0.0
    log.progress(0.0)
    
    log.info(f"🚀 Starting video processing for {total_tasks} scenes with semaphore limit of {config.config.concurrent_task_limit}")

    # Create tasks with proper indexing for debugging
    tasks = []
    for i, scene in enumerate(scenes):
        # Pre-task creation logging for hypothesis A (semaphore deadlock) and E (signal termination)
        scene_id = scene.get('id')
        log.debug(f"[DEBUG_HYPOTHESIS_A] Creating task {i+1}/{total_tasks} for scene {scene_id}, semaphore limit: {config.config.concurrent_task_limit}")
        
        task = asyncio.create_task(__tag_video_with_timing(scene, i))
        tasks.append(task)
    
    # Use asyncio.as_completed to process results as they finish (proves concurrency)
    completed_task_futures = asyncio.as_completed(tasks)
    
    batch_start_time = asyncio.get_event_loop().time()
    
    for completed_task in completed_task_futures:
        try:
            await completed_task
            completed_tasks += 1

        except Exception as e:
            completed_tasks += 1
            # Exception logging for hypothesis E (signal termination)
            error_type = type(e).__name__
            log.debug(f"[DEBUG_HYPOTHESIS_E] Task failed with exception: {error_type}: {str(e)} (Task {completed_tasks}/{total_tasks})")

            log.error(f"❌ Task failed: {e}")

    total_time = asyncio.get_event_loop().time() - batch_start_time

    log.info(f"🎉 All {total_tasks} videos completed in {total_time:.2f}s (avg: {total_time/total_tasks:.2f}s/video)")
    log.progress(1.0)

async def find_marker_settings() -> None:
    """Find optimal marker settings based on a single tagged video"""
    scenes = media_handler.get_tagme_scenes()
    if len(scenes) != 1:
        log.error("Please tag exactly one scene with the VLM_TagMe tag to get processed.")
        return
    scene = scenes[0]
    await __find_marker_settings(scene)

def collect_incorrect_markers_and_images() -> None:
    """Collect data from incorrectly tagged markers and images"""
    incorrect_images = media_handler.get_incorrect_images()
    image_paths, image_ids, temp_files = media_handler.get_image_paths_and_ids(incorrect_images)
    incorrect_markers = media_handler.get_incorrect_markers()
    
    if not (len(incorrect_images) > 0 or len(incorrect_markers) > 0):
        log.info("No incorrect images or markers to collect.")
        return
    
    current_time = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    
    try:
        # Process images
        image_folder = os.path.join(config.config.output_data_dir, "images")
        os.makedirs(image_folder, exist_ok=True)
        for image_path in image_paths:
            try:
                shutil.copy(image_path, image_folder)
            except Exception as e:
                log.error(f"Failed to copy image {image_path} to {image_folder}: {e}")
    except Exception as e:
        log.error(f"Failed to process images: {e}")
        raise e
    finally:
        # Clean up temp files
        for temp_file in temp_files:
            try:
                if os.path.isdir(temp_file):
                    shutil.rmtree(temp_file)
                else:
                    os.remove(temp_file)
            except Exception as e:
                log.debug(f"Failed to remove temp file {temp_file}: {e}")

    # Process markers
    scene_folder = os.path.join(config.config.output_data_dir, "scenes")
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
    
    # Remove incorrect tags from images
    image_ids = [image['id'] for image in incorrect_images]
    media_handler.remove_incorrect_tag_from_images(image_ids)

# ----------------- Low Level Processing Functions -----------------

async def __tag_video_with_timing(scene: Dict[str, Any], scene_index: int) -> None:
    """Tag a single video scene with timing diagnostics"""
    start_time = asyncio.get_event_loop().time()
    scene_id = scene.get('id', 'unknown')
    
    log.info(f"🎬 Starting video {scene_index + 1}: Scene {scene_id}")
    
    try:
        await __tag_video(scene)
        end_time = asyncio.get_event_loop().time()
        duration = end_time - start_time
        log.info(f"✅ Completed video {scene_index + 1} (Scene {scene_id}) in {duration:.2f}s")
        
    except Exception as e:
        end_time = asyncio.get_event_loop().time()
        duration = end_time - start_time
        log.error(f"❌ Failed video {scene_index + 1} (Scene {scene_id}) after {duration:.2f}s: {e}")
        raise

async def __tag_video(scene: Dict[str, Any]) -> None:
    """Tag a single video scene with semaphore timing instrumentation"""
    scene_id = scene.get('id')
    
    # Pre-semaphore acquisition logging for hypothesis A (semaphore deadlock)
    task_start_time = asyncio.get_event_loop().time()
    acquisition_start_time = task_start_time
    log.debug(f"[DEBUG_HYPOTHESIS_A] Task starting for scene {scene_id} at {task_start_time:.3f}s")
    
    async with semaphore:
        try:
            # Semaphore acquisition successful logging
            acquisition_end_time = asyncio.get_event_loop().time()
            acquisition_time = acquisition_end_time - acquisition_start_time
            log.debug(f"[DEBUG_HYPOTHESIS_A] Semaphore acquired for scene {scene_id} after {acquisition_time:.3f}s")
        
            if scene_id is None:
                log.error("Scene missing 'id' field")
                return
            
            files = scene.get('files', [])
            if not files:
                log.error(f"Scene {scene_id} has no files")
                return
            
            scene_file = files[0].get('path')
            if scene_file is None:
                log.error(f"Scene {scene_id} file has no path")
                return
            
            # Check if scene is VR
            is_vr = media_handler.is_vr_scene(scene.get('tags', []))
            
            def progress_cb(p: int) -> None:
                global video_progress, total_tasks
                video_progress[scene_id] = p / 100.0
                total_prog = sum(video_progress.values()) / total_tasks
                log.progress(total_prog)
            
            # Process video through VLM Engine with HTTP timing for hypothesis B
            processing_start_time = asyncio.get_event_loop().time()
            
            # HTTP request lifecycle tracking start
            log.debug(f"[DEBUG_HYPOTHESIS_B] Starting VLM processing for scene {scene_id}: {scene_file}")
            
            video_result = await vlm_engine.process_video_async(
                scene_file,
                vr_video=is_vr,
                frame_interval=config.config.video_frame_interval,
                threshold=config.config.video_threshold,
                return_confidence=config.config.video_confidence_return,
                progress_callback=progress_cb
            )

            # Extract detected tags
            detected_tags = set()
            for category_tags in video_result.video_tags.values():
                detected_tags.update(category_tags)

            # Post-VLM processing logging
            processing_end_time = asyncio.get_event_loop().time()
            processing_duration = processing_end_time - processing_start_time
            log.debug(f"[DEBUG_HYPOTHESIS_B] VLM processing completed for scene {scene_id} in {processing_duration:.2f}s ({len(detected_tags)} detected tags)")

            if detected_tags:
                # Clear all existing tags and markers before adding new ones
                media_handler.clear_all_tags_from_video(scene)
                media_handler.clear_all_markers_from_video(scene_id)
                
                # Add tags to scene
                tag_ids = media_handler.get_tag_ids(list(detected_tags), create=True)
                media_handler.add_tags_to_video(scene_id, tag_ids)
                log.info(f"Added tags {list(detected_tags)} to scene {scene_id}")

                # Add markers if enabled
                if config.config.create_markers:
                    media_handler.add_markers_to_video_from_dict(scene_id, video_result.tag_timespans)
                    log.info(f"Added markers to scene {scene_id}")

            # Remove VLM_TagMe tag from processed scene
            media_handler.remove_tagme_tag_from_scene(scene_id)
            
            # Task completion logging
            task_end_time = asyncio.get_event_loop().time()
            total_task_time = task_end_time - task_start_time
            log.debug(f"[DEBUG_HYPOTHESIS_A] Task completed for scene {scene_id} in {total_task_time:.2f}s")
            
        except Exception as e:
            # Exception handling with detailed logging for hypothesis E
            exception_time = asyncio.get_event_loop().time()
            error_type = type(e).__name__
            log.debug(f"[DEBUG_HYPOTHESIS_E] Task exception for scene {scene_id}: {error_type}: {str(e)} at {exception_time:.3f}s")
                
            scene_id = scene.get('id', 'unknown')
            log.error(f"Error processing video scene {scene_id}: {e}")
            # Add error tag to failed scene if we have a valid ID
            if scene_id != 'unknown':
                media_handler.add_error_scene(scene_id)

async def __find_marker_settings(scene: Dict[str, Any]) -> None:
    """Find optimal marker settings for a scene"""
    try:
        scene_id = scene.get('id')
        if scene_id is None:
            log.error("Scene missing 'id' field")
            return
        
        files = scene.get('files', [])
        if not files:
            log.error(f"Scene {scene_id} has no files")
            return
        
        scene_file = files[0].get('path')
        if scene_file is None:
            log.error(f"Scene {scene_id} file has no path")
            return
        
        # Get existing markers for the scene
        existing_markers = media_handler.get_scene_markers(scene_id)
        
        # Convert markers to desired timespan format
        desired_timespan_data = {}
        for marker in existing_markers:
            tag_name = marker['primary_tag']['name']
            desired_timespan_data[tag_name] = TimeFrame(
                start=marker['seconds'],
                end=marker.get('end_seconds', marker['seconds'] + 1),
                total_confidence=1.0
            )

        # Find optimal settings
        optimal_settings = await vlm_engine.find_optimal_marker_settings_async(
            existing_json={},  # No existing JSON data
            desired_timespan_data=desired_timespan_data
        )

        # Output results
        log.info(f"Optimal marker settings found for scene {scene_id}:")
        log.info(json.dumps(optimal_settings, indent=2))
        
    except Exception as e:
        scene_id = scene.get('id', 'unknown')
        log.error(f"Error finding marker settings for scene {scene_id}: {e}")

# ----------------- Cleanup -----------------

async def cleanup() -> None:
    """Cleanup resources"""
    if vlm_engine.vlm_engine:
        await vlm_engine.vlm_engine.shutdown()

# Run main function if script is executed directly
if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        log.info("Plugin interrupted by user")
        sys.exit(0)
    except SystemExit as e:
        # Re-raise system exit with the exit code
        log.debug(f"[DEBUG_EXIT_CODE] Caught SystemExit with code: {e.code}")
        raise
    except Exception as e:
        log.error(f"Plugin failed: {e}")
        sys.exit(1)
    finally:
        asyncio.run(cleanup())
