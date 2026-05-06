from typing import Any, Dict, List, Optional, Set
import aiohttp
import pydantic
import config
import stashapi.log as log

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
    
async def process_video_async(video_path, vr_video=False, frame_interval=config.FRAME_INTERVAL,threshold=config.AI_VIDEO_THRESHOLD, return_confidence=True, existing_json=None):
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=config.SERVER_TIMEOUT)) as session:
        return await post_api_async(session, 'process_video/', {"path": video_path, "frame_interval": frame_interval, "threshold": threshold, "return_confidence": return_confidence, "vr_video": vr_video, "existing_json_data": existing_json})

async def find_optimal_marker_settings(existing_json, desired_timespan_data):
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=config.SERVER_TIMEOUT)) as session:
        return await post_api_async(session, 'optimize_timeframe_settings/', {"existing_json_data": existing_json, "desired_timespan_data": desired_timespan_data})


class VideoResult(pydantic.BaseModel):
    result: Dict[str, Any]

class TimeFrame(pydantic.BaseModel):
    start: float
    end: float
    totalConfidence: Optional[float]

    def to_json(self):
        return self.model_dump_json(exclude_none=True)

    def __str__(self):
        return f"TimeFrame(start={self.start}, end={self.end})"

class VideoTagInfo(pydantic.BaseModel):
    video_duration: float
    video_tags: Dict[str, Set[str]]
    tag_totals: Dict[str, Dict[str, float]]
    tag_timespans: Dict[str, Dict[str, List[TimeFrame]]]

    @classmethod
    def from_json(cls, json_str: str):
        log.info(f"json_str: {json_str}")
        log.info(f"video_duration: {json_str['video_duration']}, video_tags: {json_str['video_tags']}, tag_totals: {json_str['tag_totals']}, tag_timespans: {json_str['tag_timespans']}")
        return cls(video_duration=json_str["video_duration"], video_tags=json_str["video_tags"], tag_totals=json_str["tag_totals"], tag_timespans=json_str["tag_timespans"])

    def __str__(self):
        return f"VideoTagInfo(video_duration={self.video_duration}, video_tags={self.video_tags}, tag_totals={self.tag_totals}, tag_timespans={self.tag_timespans})"
    
class ImageResult(pydantic.BaseModel):
    result: List[Dict[str, Any]] = pydantic.Field(..., min_items=1)

class OptimizeMarkerSettings(pydantic.BaseModel):
    existing_json_data: Any = None
    desired_timespan_data: Dict[str, TimeFrame]