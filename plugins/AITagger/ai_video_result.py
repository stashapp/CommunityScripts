from copy import deepcopy
import csv
from typing import Dict, List, Optional

from pydantic import BaseModel
import stashapi.log as log
import config
import media_handler

class ModelConfig(BaseModel):
    frame_interval: float
    threshold: float
    def __str__(self):
        return f"ModelConfig(frame_interval={self.frame_interval}, threshold={self.threshold})"
    
class ModelInfo(BaseModel):
    version: float
    ai_model_config: ModelConfig
    def __str__(self):
        return f"ModelInfo(version={self.version}, ai_model_config={self.ai_model_config})"
    
class VideoMetadata(BaseModel):
    video_id: int
    duration: float
    phash: Optional[str]
    models: Dict[str, ModelInfo]
    def __str__(self):
        return f"VideoMetadata(video_id={self.video_id}, duration={self.duration}, phash={self.phash}, models={self.models})"
    
class TagTimeFrame(BaseModel):
    start: float
    end: Optional[float] = None
    confidence: float
    def __str__(self):
        return f"TagTimeFrame(start={self.start}, end={self.end}, confidence={self.confidence})"
    
class TagData(BaseModel):
    ai_model_name: str
    time_frames: List[TagTimeFrame]
    def __str__(self):
        return f"TagData(model_name={self.ai_model_name}, time_frames={self.time_frames})"
    
class AIVideoResult(BaseModel):
    video_metadata: VideoMetadata
    tags: Dict[str, TagData]

    def add_server_response(self, response):
        frame_interval = response.frame_interval
        model_name = response.pipeline_short_name
        if model_name in self.video_metadata.models:
            self.tags = {tag_name: tag_data for tag_name, tag_data in self.tags.items() if tag_data.ai_model_name != model_name}
        model_info = ModelInfo(version=response.pipeline_version, ai_model_config=ModelConfig(frame_interval=frame_interval, threshold=response.threshold))
        self.video_metadata.models[model_name] = model_info
        tagsToAdd = AIVideoResult.__mutate_server_result_tags(response.result, model_name, frame_interval)
        for tag_name, tag_data in tagsToAdd.items():
            self.tags[tag_name] = tag_data

    def update_stash_tags(self):
        tagsToAdd = []

        for tag_name, tag_data in self.tags.items():
            if media_handler.is_ai_tag(tag_name):
                requiredDuration = media_handler.get_required_duration(tag_name, self.video_metadata.duration)

                # To disable making tags for certain tags, set RequiredDuration to above 100%
                if requiredDuration <= self.video_metadata.duration:
                    totalDuration = 0.0
                    frame_interval = self.video_metadata.models[tag_data.ai_model_name].ai_model_config.frame_interval
                    tag_threshold = media_handler.get_tag_threshold(tag_name)
                    tag_id = media_handler.get_tag_id(tag_name)
                    for time_frame in tag_data.time_frames:
                        if time_frame.end is None and time_frame.confidence >= tag_threshold:
                            totalDuration += frame_interval
                        elif time_frame.confidence >= tag_threshold:
                            totalDuration += time_frame.end - time_frame.start + frame_interval
                    if totalDuration >= requiredDuration:
                        tagsToAdd.append(tag_id)

        media_handler.remove_ai_tags_from_video(self.video_metadata.video_id, True)
        media_handler.add_tags_to_video(self.video_metadata.video_id, tagsToAdd, True)

    def update_stash_markers(self):
        if not config.CREATE_MARKERS:
            log.debug("Not creating markers since marker creation is disabled")
            return
        media_handler.remove_ai_markers_from_video(self.video_metadata.video_id)

        for tag_name, tag_data in self.tags.items():
            if media_handler.is_ai_marker_supported(tag_name):
                tag_threshold = media_handler.get_tag_threshold(tag_name)
                frame_interval = self.video_metadata.models[tag_data.ai_model_name].ai_model_config.frame_interval
                tag_id = media_handler.get_tag_id(tag_name)
                max_gap = media_handler.get_max_gap(tag_name)
                min_duration = media_handler.get_min_duration(tag_name)
                merged_time_frames = []
                for time_frame in tag_data.time_frames:
                    if time_frame.confidence < tag_threshold:
                        continue

                    if not merged_time_frames:
                        merged_time_frames.append(deepcopy(time_frame))
                        continue
                    else:
                        last_time_frame = merged_time_frames[-1]
                        if last_time_frame.end is None:
                            if (time_frame.start - last_time_frame.start - frame_interval) <= max_gap:
                                last_time_frame.end = time_frame.end or time_frame.start
                            else:
                                merged_time_frames.append(deepcopy(time_frame))
                        else:
                            if (time_frame.start - last_time_frame.end - frame_interval) <= max_gap:
                                last_time_frame.end = time_frame.end or time_frame.start
                            else:
                                merged_time_frames.append(deepcopy(time_frame))
                merged_time_frames = [tf for tf in merged_time_frames if (tf.end - tf.start + frame_interval if tf.end else frame_interval) >= min_duration]
                media_handler.add_markers_to_video(self.video_metadata.video_id, tag_id, tag_name, merged_time_frames)

    def already_contains_model(self, model_config):
        correspondingModelInfo = self.video_metadata.models.get(model_config.pipeline_short_name)
        toReturn = (correspondingModelInfo is not None and correspondingModelInfo.version == model_config.pipeline_version and
                            correspondingModelInfo.ai_model_config.frame_interval == model_config.frame_interval and
                            correspondingModelInfo.ai_model_config.threshold == model_config.threshold)
        log.debug(f"Already contains model: {toReturn}, {correspondingModelInfo is not None}, {correspondingModelInfo.version == model_config.pipeline_version}, {correspondingModelInfo.ai_model_config.frame_interval == model_config.frame_interval}, {correspondingModelInfo.ai_model_config.threshold == model_config.threshold}")
        return toReturn

    def __str__(self):
        return f"AIVideoResult(video_metadata={self.video_metadata}, tags={self.tags})"

    def to_json_file(self, json_file):
        with open(json_file, 'w') as f:
            f.write(self.model_dump_json(exclude_none=True))

    @classmethod
    def from_server_response(cls, response, sceneId, phash, duration):
        frame_interval = response.frame_interval
        model_name = response.pipeline_short_name
        model_info = ModelInfo(version=response.pipeline_version, ai_model_config=ModelConfig(frame_interval=frame_interval, threshold=response.threshold))
        video_metadata = VideoMetadata(video_id=sceneId, phash=phash, models={model_name : model_info}, duration=duration)
        tags = AIVideoResult.__mutate_server_result_tags(response.result, model_name, frame_interval)

        return cls(video_metadata=video_metadata, tags=tags)
    
    @classmethod
    def __mutate_server_result_tags(cls, server_result, model_name, frame_interval):
        tags = {}
        for result in server_result:
            frame_index = result["frame_index"]
            actions = result["actions"]
            for action in actions:
                tag_name, confidence = action
                if tag_name not in tags:
                    tags[tag_name] = TagData(ai_model_name=model_name, time_frames=[TagTimeFrame(start=frame_index, end=None, confidence=confidence)])
                else:
                    last_time_frame = tags[tag_name].time_frames[-1]

                    if last_time_frame.end is None:
                        if frame_index - last_time_frame.start == frame_interval and last_time_frame.confidence == confidence:
                            last_time_frame.end = frame_index
                        else:
                            tags[tag_name].time_frames.append(TagTimeFrame(start=frame_index, end=None, confidence=confidence))
                    elif last_time_frame.confidence == confidence and frame_index - last_time_frame.end == frame_interval:
                        last_time_frame.end = frame_index
                    else:
                        tags[tag_name].time_frames.append(TagTimeFrame(start=frame_index, end=None, confidence=confidence))
        return tags


    @classmethod
    def from_json_file(cls, json_file):
        with open(json_file, 'r') as f:
            return cls.model_validate_json(f.read())
        
    @classmethod
    def from_csv_file(cls, csv_file, scene_id, phash, duration, version=1.0):
        server_results = []
        frame_interval = None
        last_frame_index = None
        with open(csv_file, 'r') as f:
            reader = csv.reader(f)
            for row in reader:
                frame_index = float(row[0])
                if last_frame_index is not None and frame_interval is None:
                    log.debug(f"Calculating frame interval: {frame_index} - {last_frame_index}")
                    frame_interval = frame_index - last_frame_index
                for tag_name in row[1:]:  # Skip the first column (frame_indexes)
                    if tag_name:  # If the cell is not empty
                        server_results.append({"frame_index": frame_index, "actions": [(tag_name, 1.0)]})
                last_frame_index = frame_index
        tags = cls.__mutate_server_result_tags(server_results, "actiondetection", frame_interval)
        model_info = ModelInfo(version=version, ai_model_config=ModelConfig(frame_interval=frame_interval, threshold=0.3))
        video_metadata = VideoMetadata(video_id=scene_id, phash=phash, models={"actiondetection" : model_info}, duration=duration)
        return cls(video_metadata=video_metadata, tags=tags)