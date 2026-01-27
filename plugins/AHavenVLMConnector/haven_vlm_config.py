"""
Configuration for A Haven VLM Connector
A StashApp plugin for Vision-Language Model based content tagging
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
import os
import yaml

# ----------------- Core Settings -----------------

# VLM Engine Configuration
VLM_ENGINE_CONFIG = {
    "active_ai_models": ["vlm_multiplexer_model"],
    "pipelines": {
        "video_pipeline_dynamic": {
            "inputs": [
                "video_path",
                "return_timestamps",
                "time_interval",
                "threshold",
                "return_confidence",
                "vr_video",
                "existing_video_data",
                "skipped_categories",
            ],
            "output": "results",
            "short_name": "dynamic_video",
            "version": 1.0,
            "models": [
                {
                    "name": "dynamic_video_ai",
                    "inputs": [
                        "video_path", "return_timestamps", "time_interval", 
                        "threshold", "return_confidence", "vr_video", 
                        "existing_video_data", "skipped_categories"
                    ],
                    "outputs": "results",
                },
            ],
        }
    },
    "models": {
        "binary_search_processor_dynamic": {
            "type": "binary_search_processor", 
            "model_file_name": "binary_search_processor_dynamic"
        },
        "vlm_multiplexer_model": {
            "type": "vlm_model",
            "model_file_name": "vlm_multiplexer_model",
            "model_category": "actiondetection",
            "model_id": "zai-org/glm-4.6v-flash",
            "model_identifier": 93848,
            "model_version": "1.0",
            "use_multiplexer": True,
            "max_concurrent_requests": 13,
            "instance_count": 10,
            "max_batch_size": 4,
            "multiplexer_endpoints": [
                {
                    "base_url": "http://localhost:1234/v1",
                    "api_key": "",
                    "name": "lm-studio-primary",
                    "weight": 9,
                    "is_fallback": False,
                    "max_concurrent": 10
                },
                {
                    "base_url": "https://cloudagnostic.com:443/v1",
                    "api_key": "",
                    "name": "cloud-fallback",
                    "weight": 1,
                    "is_fallback": True,
                    "max_concurrent": 2
                }
            ],
            "tag_list": [
                "Anal Fucking", "Ass Licking", "Ass Penetration", "Ball Licking/Sucking", "Blowjob", "Cum on Person",
                "Cum Swapping", "Cumshot", "Deepthroat", "Double Penetration", "Fingering", "Fisting", "Footjob",
                "Gangbang", "Gloryhole", "Grabbing Ass", "Grabbing Boobs", "Grabbing Hair/Head", "Handjob", "Kissing",
                "Licking Penis", "Masturbation", "Pissing", "Pussy Licking (Clearly Visible)", "Pussy Licking",
                "Pussy Rubbing", "Sucking Fingers", "Sucking Toy/Dildo", "Wet (Genitals)", "Titjob", "Tribbing/Scissoring",
                "Undressing", "Vaginal Penetration", "Vaginal Fucking", "Vibrating"
            ]
        },
        "result_coalescer": {
            "type": "python", 
            "model_file_name": "result_coalescer"
        },
        "result_finisher": {
            "type": "python", 
            "model_file_name": "result_finisher"
        },
        "batch_awaiter": {
            "type": "python", 
            "model_file_name": "batch_awaiter"
        },
        "video_result_postprocessor": {
            "type": "python", 
            "model_file_name": "video_result_postprocessor"
        },
    },
    "category_config": {
        "actiondetection": {
            "69": {
                "RenamedTag": "69",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Anal Fucking": {
                "RenamedTag": "Anal Fucking",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Ass Licking": {
                "RenamedTag": "Ass Licking",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Ass Penetration": {
                "RenamedTag": "Ass Penetration",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Ball Licking/Sucking": {
                "RenamedTag": "Ball Licking/Sucking",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Blowjob": {
                "RenamedTag": "Blowjob",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Cum on Person": {
                "RenamedTag": "Cum on Person",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Cum Swapping": {
                "RenamedTag": "Cum Swapping",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Cumshot": {
                "RenamedTag": "Cumshot",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Deepthroat": {
                "RenamedTag": "Deepthroat",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Double Penetration": {
                "RenamedTag": "Double Penetration",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Fingering": {
                "RenamedTag": "Fingering",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Fisting": {
                "RenamedTag": "Fisting",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Footjob": {
                "RenamedTag": "Footjob",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Gangbang": {
                "RenamedTag": "Gangbang",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Gloryhole": {
                "RenamedTag": "Gloryhole",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Grabbing Ass": {
                "RenamedTag": "Grabbing Ass",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Grabbing Boobs": {
                "RenamedTag": "Grabbing Boobs",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Grabbing Hair/Head": {
                "RenamedTag": "Grabbing Hair/Head",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Handjob": {
                "RenamedTag": "Handjob",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Kissing": {
                "RenamedTag": "Kissing",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Licking Penis": {
                "RenamedTag": "Licking Penis",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Masturbation": {
                "RenamedTag": "Masturbation",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Pissing": {
                "RenamedTag": "Pissing",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Pussy Licking (Clearly Visible)": {
                "RenamedTag": "Pussy Licking (Clearly Visible)",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Pussy Licking": {
                "RenamedTag": "Pussy Licking",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Pussy Rubbing": {
                "RenamedTag": "Pussy Rubbing",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Sucking Fingers": {
                "RenamedTag": "Sucking Fingers",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Sucking Toy/Dildo": {
                "RenamedTag": "Sucking Toy/Dildo",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Wet (Genitals)": {
                "RenamedTag": "Wet (Genitals)",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Titjob": {
                "RenamedTag": "Titjob",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Tribbing/Scissoring": {
                "RenamedTag": "Tribbing/Scissoring",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Undressing": {
                "RenamedTag": "Undressing",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Vaginal Penetration": {
                "RenamedTag": "Vaginal Penetration",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Vaginal Fucking": {
                "RenamedTag": "Vaginal Fucking",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            },
            "Vibrating": {
                "RenamedTag": "Vibrating",
                "MinMarkerDuration": "1s",
                "MaxGap": "30s",
                "RequiredDuration": "1s",
                "TagThreshold": 0.5,
            }
        }
    }
}

# ----------------- Processing Settings -----------------

# Video processing settings
VIDEO_FRAME_INTERVAL = 80  # Process every 80 seconds
VIDEO_THRESHOLD = 0.3
VIDEO_CONFIDENCE_RETURN = True

# Concurrency settings
CONCURRENT_TASK_LIMIT = 20  # Increased for better parallel video processing
SERVER_TIMEOUT = 3700

# ----------------- Tag Configuration -----------------

# Tag names for StashApp integration
VLM_BASE_TAG_NAME = "VLM"
VLM_TAGME_TAG_NAME = "VLM_TagMe"
VLM_UPDATEME_TAG_NAME = "VLM_UpdateMe"
VLM_TAGGED_TAG_NAME = "VLM_Tagged"
VLM_ERRORED_TAG_NAME = "VLM_Errored"
VLM_INCORRECT_TAG_NAME = "VLM_Incorrect"

# ----------------- File System Settings -----------------

# Directory paths
OUTPUT_DATA_DIR = "./output_data"

# File management
DELETE_INCORRECT_MARKERS = True
CREATE_MARKERS = True

# Path mutations for different environments
PATH_MUTATION = {}

# ----------------- Configuration Loading -----------------

@dataclass
class VLMConnectorConfig:
    """Configuration class for the VLM Connector"""
    vlm_engine_config: Dict
    video_frame_interval: float
    video_threshold: float
    video_confidence_return: bool
    concurrent_task_limit: int
    server_timeout: int
    vlm_base_tag_name: str
    vlm_tagme_tag_name: str
    vlm_updateme_tag_name: str
    vlm_tagged_tag_name: str
    vlm_errored_tag_name: str
    vlm_incorrect_tag_name: str
    output_data_dir: str
    delete_incorrect_markers: bool
    create_markers: bool
    path_mutation: Dict

def load_config_from_yaml(config_path: Optional[str] = None) -> VLMConnectorConfig:
    """Load configuration from YAML file or use defaults"""
    if config_path and os.path.exists(config_path):
        with open(config_path, 'r') as f:
            yaml_config = yaml.safe_load(f)
            return VLMConnectorConfig(**yaml_config)
    
    # Return default configuration
    return VLMConnectorConfig(
        vlm_engine_config=VLM_ENGINE_CONFIG,
        video_frame_interval=VIDEO_FRAME_INTERVAL,
        video_threshold=VIDEO_THRESHOLD,
        video_confidence_return=VIDEO_CONFIDENCE_RETURN,
        concurrent_task_limit=CONCURRENT_TASK_LIMIT,
        server_timeout=SERVER_TIMEOUT,
        vlm_base_tag_name=VLM_BASE_TAG_NAME,
        vlm_tagme_tag_name=VLM_TAGME_TAG_NAME,
        vlm_updateme_tag_name=VLM_UPDATEME_TAG_NAME,
        vlm_tagged_tag_name=VLM_TAGGED_TAG_NAME,
        vlm_errored_tag_name=VLM_ERRORED_TAG_NAME,
        vlm_incorrect_tag_name=VLM_INCORRECT_TAG_NAME,
        output_data_dir=OUTPUT_DATA_DIR,
        delete_incorrect_markers=DELETE_INCORRECT_MARKERS,
        create_markers=CREATE_MARKERS,
        path_mutation=PATH_MUTATION
    )

# Global configuration instance
config = load_config_from_yaml()
