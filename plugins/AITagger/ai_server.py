from typing import Any, Dict, List
import aiohttp
import pydantic
import config
import stashapi.log as log

current_videopipeline = None

# ----------------- AI Server Calling Functions -----------------

async def post_api_async(session, endpoint, payload):
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
        raise e
    
async def get_api_async(session, endpoint, params=None):
    url = f'{config.API_BASE_URL}/{endpoint}'
    try:
        async with session.get(url, params=params) as response:
            if response.status == 200:
                return await response.json()
            else:
                log.error(f"Failed to process {endpoint} status_code: {response.status}")
                return None
    except aiohttp.ClientConnectionError as e:
        log.error(f"Failed to connect to AI server. Is the AI server running at {config.API_BASE_URL}?   {e}")
        raise e

async def process_images_async(image_paths, threshold=config.IMAGE_THRESHOLD, return_confidence=False):
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=config.SERVER_TIMEOUT)) as session:
        return await post_api_async(session, 'process_images/', {"paths": image_paths, "threshold": threshold, "return_confidence": return_confidence})
    
async def process_video_async(video_path, frame_interval=config.FRAME_INTERVAL,threshold=config.AI_VIDEO_THRESHOLD, return_confidence=True ,vr_video=False):
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=config.SERVER_TIMEOUT)) as session:
        return await post_api_async(session, 'process_video/', {"path": video_path, "frame_interval": frame_interval, "threshold": threshold, "return_confidence": return_confidence, "vr_video": vr_video})
    
async def get_image_config_async(threshold=config.IMAGE_THRESHOLD):
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=config.SERVER_TIMEOUT)) as session:
        return await get_api_async(session, f'image_pipeline_info/?threshold={threshold}')

async def get_video_config_async(frame_interval=config.FRAME_INTERVAL, threshold=config.AI_VIDEO_THRESHOLD):
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=config.SERVER_TIMEOUT)) as session:
        return await get_api_async(session, f'video_pipeline_info/?frame_interval={frame_interval}&threshold={threshold}&return_confidence=True')
    
class VideoResult(pydantic.BaseModel):
    result: List[Dict[str, Any]] = pydantic.Field(..., min_items=1)
    pipeline_short_name: str
    pipeline_version: float
    threshold: float
    frame_interval: float
    return_confidence: bool

class ImageResult(pydantic.BaseModel):
    result: List[Dict[str, Any]] = pydantic.Field(..., min_items=1)
    pipeline_short_name: str
    pipeline_version: float
    threshold: float
    return_confidence: bool

class ImagePipelineInfo(pydantic.BaseModel):
    pipeline_short_name: str
    pipeline_version: float
    threshold: float
    return_confidence: bool

class VideoPipelineInfo(pydantic.BaseModel):
    pipeline_short_name: str
    pipeline_version: float
    threshold: float
    frame_interval: float
    return_confidence: bool

async def get_current_video_pipeline():
    global current_videopipeline
    if current_videopipeline is not None:
        return current_videopipeline
    try:
        current_videopipeline = VideoPipelineInfo(**await get_video_config_async())
    except aiohttp.ClientConnectionError as e:
            log.error(f"Failed to connect to AI server. Is the AI server running at {config.API_BASE_URL}?   {e}")
    except Exception as e:
        log.error(f"Failed to get pipeline info: {e}. Ensure the AI server is running with at least version 1.3.1!")
        raise
    return current_videopipeline