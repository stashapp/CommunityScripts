"""
Haven VLM Engine Integration Module
Provides integration with the Haven VLM Engine for video and image processing
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional, Set, Union, Callable
from dataclasses import dataclass
from datetime import datetime
import json

# Use PythonDepManager for dependency management
from vlm_engine import VLMEngine
from vlm_engine.config_models import (
    EngineConfig, 
    PipelineConfig, 
    ModelConfig, 
    PipelineModelConfig
)

import haven_vlm_config as config

# Configure logging
logging.basicConfig(level=logging.CRITICAL)
logger = logging.getLogger(__name__)

@dataclass
class TimeFrame:
    """Represents a time frame with start and end times"""
    start: float
    end: float
    total_confidence: Optional[float] = None

    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps({
            "start": self.start,
            "end": self.end,
            "total_confidence": self.total_confidence
        })

    def __str__(self) -> str:
        return f"TimeFrame(start={self.start}, end={self.end}, confidence={self.total_confidence})"

@dataclass
class VideoTagInfo:
    """Represents video tagging information"""
    video_duration: float
    video_tags: Dict[str, Set[str]]
    tag_totals: Dict[str, Dict[str, float]]
    tag_timespans: Dict[str, Dict[str, List[TimeFrame]]]

    @classmethod
    def from_json(cls, json_data: Dict[str, Any]) -> 'VideoTagInfo':
        """Create VideoTagInfo from JSON data"""
        logger.debug(f"Creating VideoTagInfo from JSON: {json_data}")
        
        # Convert tag_timespans to TimeFrame objects
        tag_timespans = {}
        for category, tags in json_data.get("tag_timespans", {}).items():
            tag_timespans[category] = {}
            for tag_name, timeframes in tags.items():
                tag_timespans[category][tag_name] = [
                    TimeFrame(
                        start=tf["start"],
                        end=tf["end"],
                        total_confidence=tf.get("total_confidence")
                    ) for tf in timeframes
                ]
        
        return cls(
            video_duration=json_data.get("video_duration", 0.0),
            video_tags=json_data.get("video_tags", {}),
            tag_totals=json_data.get("tag_totals", {}),
            tag_timespans=tag_timespans
        )

    def __str__(self) -> str:
        return f"VideoTagInfo(duration={self.video_duration}, tags={len(self.video_tags)}, timespans={len(self.tag_timespans)})"

class HavenVLMEngine:
    """Main VLM Engine integration class"""
    
    def __init__(self):
        self.engine: Optional[VLMEngine] = None
        self.engine_config: Optional[EngineConfig] = None
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize the VLM Engine with configuration"""
        if self._initialized:
            return

        try:
            logger.info("Initializing Haven VLM Engine...")
            
            # Convert config dict to EngineConfig objects
            self.engine_config = self._create_engine_config()
            
            # Create and initialize the engine
            self.engine = VLMEngine(config=self.engine_config)
            await self.engine.initialize()
            
            self._initialized = True
            logger.info("Haven VLM Engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize VLM Engine: {e}")
            raise

    def _create_engine_config(self) -> EngineConfig:
        """Create EngineConfig from the configuration"""
        vlm_config = config.config.vlm_engine_config
        
        # Create pipeline configs
        pipelines = {}
        for pipeline_name, pipeline_data in vlm_config["pipelines"].items():
            models = [
                PipelineModelConfig(
                    name=model["name"],
                    inputs=model["inputs"],
                    outputs=model["outputs"]
                ) for model in pipeline_data["models"]
            ]
            
            pipelines[pipeline_name] = PipelineConfig(
                inputs=pipeline_data["inputs"],
                output=pipeline_data["output"],
                short_name=pipeline_data["short_name"],
                version=pipeline_data["version"],
                models=models
            )

        # Create model configs with new architectural changes
        models = {}
        for model_name, model_data in vlm_config["models"].items():
            if model_data["type"] == "vlm_model":
                # Process multiplexer_endpoints and validate max_concurrent
                multiplexer_endpoints = []
                for endpoint in model_data.get("multiplexer_endpoints", []):
                    # Validate that max_concurrent is present
                    if "max_concurrent" not in endpoint:
                        raise ValueError(f"Endpoint '{endpoint.get('name', 'unnamed')}' is missing required 'max_concurrent' parameter")
                    
                    multiplexer_endpoints.append({
                        "base_url": endpoint["base_url"],
                        "api_key": endpoint.get("api_key", ""),
                        "name": endpoint["name"],
                        "weight": endpoint.get("weight", 5),
                        "is_fallback": endpoint.get("is_fallback", False),
                        "max_concurrent": endpoint["max_concurrent"]
                    })
                
                models[model_name] = ModelConfig(
                    type=model_data["type"],
                    model_file_name=model_data["model_file_name"],
                    model_category=model_data["model_category"],
                    model_id=model_data["model_id"],
                    model_identifier=model_data["model_identifier"],
                    model_version=model_data["model_version"],
                    use_multiplexer=model_data.get("use_multiplexer", False),
                    max_concurrent_requests=model_data.get("max_concurrent_requests", 10),
                    instance_count=model_data.get("instance_count",1),
                    max_batch_size=model_data.get("max_batch_size",1),
                    multiplexer_endpoints=multiplexer_endpoints,
                    tag_list=model_data.get("tag_list", [])
                )
            else:
                models[model_name] = ModelConfig(
                    type=model_data["type"],
                    model_file_name=model_data["model_file_name"]
                )

        return EngineConfig(
            active_ai_models=vlm_config["active_ai_models"],
            pipelines=pipelines,
            models=models,
            category_config=vlm_config["category_config"]
        )

    async def process_video(
        self,
        video_path: str,
        vr_video: bool = False,
        frame_interval: Optional[float] = None,
        threshold: Optional[float] = None,
        return_confidence: Optional[bool] = None,
        existing_json: Optional[Dict[str, Any]] = None,
        progress_callback: Optional[Callable[[int], None]] = None
    ) -> VideoTagInfo:
        """Process a video using the VLM Engine"""
        if not self._initialized:
            await self.initialize()

        try:
            logger.info(f"Processing video: {video_path}")
            
            # Use config defaults if not provided
            frame_interval = frame_interval or config.config.video_frame_interval
            threshold = threshold or config.config.video_threshold
            return_confidence = return_confidence if return_confidence is not None else config.config.video_confidence_return

            # Process video through the engine
            results = await self.engine.process_video(
                video_path,
                frame_interval=frame_interval,
                progress_callback=progress_callback
            )
            
            logger.info(f"Video processing completed for: {video_path}")
            logger.debug(f"Raw results structure: {type(results)}")
            
            # Extract video_tag_info from the nested structure
            if isinstance(results, dict) and 'video_tag_info' in results:
                video_tag_data = results['video_tag_info']
                logger.debug(f"Using video_tag_info from results: {video_tag_data.keys()}")
            else:
                # Fallback: assume results is already in the correct format
                video_tag_data = results
                logger.debug(f"Using results directly: {video_tag_data.keys() if isinstance(video_tag_data, dict) else type(video_tag_data)}")
            
            return VideoTagInfo.from_json(video_tag_data)
            
        except Exception as e:
            logger.error(f"Error processing video {video_path}: {e}")
            raise

    async def find_optimal_marker_settings(
        self,
        existing_json: Dict[str, Any],
        desired_timespan_data: Dict[str, TimeFrame]
    ) -> Dict[str, Any]:
        """Find optimal marker settings based on existing data"""
        if not self._initialized:
            await self.initialize()

        try:
            logger.info("Finding optimal marker settings...")
            
            # Convert TimeFrame objects to dict format
            desired_data = {}
            for key, timeframe in desired_timespan_data.items():
                desired_data[key] = {
                    "start": timeframe.start,
                    "end": timeframe.end,
                    "total_confidence": timeframe.total_confidence
                }

            # Call the engine's optimization method
            results = await self.engine.optimize_timeframe_settings(
                existing_json_data=existing_json,
                desired_timespan_data=desired_data
            )
            
            logger.info("Optimal marker settings found")
            return results
            
        except Exception as e:
            logger.error(f"Error finding optimal marker settings: {e}")
            raise

    async def shutdown(self) -> None:
        """Shutdown the VLM Engine"""
        if self.engine and self._initialized:
            try:
                # VLMEngine doesn't have a shutdown method, just perform basic cleanup
                logger.info("VLM Engine cleanup completed")
                self._initialized = False
                
            except Exception as e:
                logger.error(f"Error during VLM Engine cleanup: {e}")
                self._initialized = False

# Global VLM Engine instance
vlm_engine = HavenVLMEngine()

# Convenience functions for backward compatibility
async def process_video_async(
    video_path: str,
    vr_video: bool = False,
    frame_interval: Optional[float] = None,
    threshold: Optional[float] = None,
    return_confidence: Optional[bool] = None,
    existing_json: Optional[Dict[str, Any]] = None,
    progress_callback: Optional[Callable[[int], None]] = None
) -> VideoTagInfo:
    """Process video asynchronously"""
    return await vlm_engine.process_video(
        video_path, vr_video, frame_interval, threshold, return_confidence, existing_json,
        progress_callback=progress_callback
    )

async def find_optimal_marker_settings_async(
    existing_json: Dict[str, Any],
    desired_timespan_data: Dict[str, TimeFrame]
) -> Dict[str, Any]:
    """Find optimal marker settings asynchronously"""
    return await vlm_engine.find_optimal_marker_settings(existing_json, desired_timespan_data)
