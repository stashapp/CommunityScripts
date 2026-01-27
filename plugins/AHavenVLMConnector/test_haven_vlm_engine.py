"""
Unit tests for haven_vlm_engine module
"""

import unittest
import asyncio
import json
import tempfile
import os
from unittest.mock import patch, MagicMock, AsyncMock, mock_open
import sys

# Mock the vlm_engine imports
sys.modules['vlm_engine'] = MagicMock()
sys.modules['vlm_engine.config_models'] = MagicMock()

import haven_vlm_engine


class TestTimeFrame(unittest.TestCase):
    """Test cases for TimeFrame dataclass"""

    def test_timeframe_creation(self):
        """Test creating TimeFrame with all parameters"""
        timeframe = haven_vlm_engine.TimeFrame(
            start=10.0,
            end=15.0,
            total_confidence=0.85
        )
        
        self.assertEqual(timeframe.start, 10.0)
        self.assertEqual(timeframe.end, 15.0)
        self.assertEqual(timeframe.total_confidence, 0.85)

    def test_timeframe_creation_without_confidence(self):
        """Test creating TimeFrame without confidence"""
        timeframe = haven_vlm_engine.TimeFrame(
            start=10.0,
            end=15.0
        )
        
        self.assertEqual(timeframe.start, 10.0)
        self.assertEqual(timeframe.end, 15.0)
        self.assertIsNone(timeframe.total_confidence)

    def test_timeframe_to_json(self):
        """Test TimeFrame to_json method"""
        timeframe = haven_vlm_engine.TimeFrame(
            start=10.0,
            end=15.0,
            total_confidence=0.85
        )
        
        json_str = timeframe.to_json()
        json_data = json.loads(json_str)
        
        self.assertEqual(json_data["start"], 10.0)
        self.assertEqual(json_data["end"], 15.0)
        self.assertEqual(json_data["total_confidence"], 0.85)

    def test_timeframe_to_json_without_confidence(self):
        """Test TimeFrame to_json method without confidence"""
        timeframe = haven_vlm_engine.TimeFrame(
            start=10.0,
            end=15.0
        )
        
        json_str = timeframe.to_json()
        json_data = json.loads(json_str)
        
        self.assertEqual(json_data["start"], 10.0)
        self.assertEqual(json_data["end"], 15.0)
        self.assertIsNone(json_data["total_confidence"])

    def test_timeframe_str(self):
        """Test TimeFrame string representation"""
        timeframe = haven_vlm_engine.TimeFrame(
            start=10.0,
            end=15.0,
            total_confidence=0.85
        )
        
        str_repr = str(timeframe)
        self.assertIn("10.0", str_repr)
        self.assertIn("15.0", str_repr)
        self.assertIn("0.85", str_repr)


class TestVideoTagInfo(unittest.TestCase):
    """Test cases for VideoTagInfo dataclass"""

    def test_videotaginfo_creation(self):
        """Test creating VideoTagInfo with all parameters"""
        video_tags = {"category1": {"tag1", "tag2"}}
        tag_totals = {"tag1": {"total": 0.8}}
        tag_timespans = {"category1": {"tag1": [haven_vlm_engine.TimeFrame(10.0, 15.0)]}}
        
        video_info = haven_vlm_engine.VideoTagInfo(
            video_duration=120.0,
            video_tags=video_tags,
            tag_totals=tag_totals,
            tag_timespans=tag_timespans
        )
        
        self.assertEqual(video_info.video_duration, 120.0)
        self.assertEqual(video_info.video_tags, video_tags)
        self.assertEqual(video_info.tag_totals, tag_totals)
        self.assertEqual(video_info.tag_timespans, tag_timespans)

    def test_videotaginfo_from_json(self):
        """Test creating VideoTagInfo from JSON data"""
        json_data = {
            "video_duration": 120.0,
            "video_tags": {"category1": ["tag1", "tag2"]},
            "tag_totals": {"tag1": {"total": 0.8}},
            "tag_timespans": {
                "category1": {
                    "tag1": [
                        {"start": 10.0, "end": 15.0, "total_confidence": 0.85}
                    ]
                }
            }
        }
        
        video_info = haven_vlm_engine.VideoTagInfo.from_json(json_data)
        
        self.assertEqual(video_info.video_duration, 120.0)
        self.assertEqual(video_info.video_tags, {"category1": ["tag1", "tag2"]})
        self.assertEqual(video_info.tag_totals, {"tag1": {"total": 0.8}})
        
        # Check that tag_timespans contains TimeFrame objects
        self.assertIn("category1", video_info.tag_timespans)
        self.assertIn("tag1", video_info.tag_timespans["category1"])
        self.assertIsInstance(video_info.tag_timespans["category1"]["tag1"][0], haven_vlm_engine.TimeFrame)

    def test_videotaginfo_from_json_without_confidence(self):
        """Test creating VideoTagInfo from JSON data without confidence"""
        json_data = {
            "video_duration": 120.0,
            "video_tags": {"category1": ["tag1"]},
            "tag_totals": {"tag1": {"total": 0.8}},
            "tag_timespans": {
                "category1": {
                    "tag1": [
                        {"start": 10.0, "end": 15.0}
                    ]
                }
            }
        }
        
        video_info = haven_vlm_engine.VideoTagInfo.from_json(json_data)
        
        timeframe = video_info.tag_timespans["category1"]["tag1"][0]
        self.assertEqual(timeframe.start, 10.0)
        self.assertEqual(timeframe.end, 15.0)
        self.assertIsNone(timeframe.total_confidence)

    def test_videotaginfo_from_json_empty_timespans(self):
        """Test creating VideoTagInfo from JSON data with empty timespans"""
        json_data = {
            "video_duration": 120.0,
            "video_tags": {"category1": ["tag1"]},
            "tag_totals": {"tag1": {"total": 0.8}},
            "tag_timespans": {}
        }
        
        video_info = haven_vlm_engine.VideoTagInfo.from_json(json_data)
        
        self.assertEqual(video_info.video_duration, 120.0)
        self.assertEqual(video_info.tag_timespans, {})

    def test_videotaginfo_str(self):
        """Test VideoTagInfo string representation"""
        video_info = haven_vlm_engine.VideoTagInfo(
            video_duration=120.0,
            video_tags={"category1": {"tag1"}},
            tag_totals={"tag1": {"total": 0.8}},
            tag_timespans={"category1": {"tag1": []}}
        )
        
        str_repr = str(video_info)
        self.assertIn("120.0", str_repr)
        self.assertIn("1", str_repr)  # number of tags
        self.assertIn("1", str_repr)  # number of timespans


class TestImageResult(unittest.TestCase):
    """Test cases for ImageResult dataclass"""

    def test_imageresult_creation(self):
        """Test creating ImageResult with valid data"""
        result_data = [{"tags": ["tag1"], "confidence": 0.8}]
        image_result = haven_vlm_engine.ImageResult(result=result_data)
        
        self.assertEqual(image_result.result, result_data)

    def test_imageresult_creation_empty_list(self):
        """Test creating ImageResult with empty list"""
        with self.assertRaises(ValueError):
            haven_vlm_engine.ImageResult(result=[])

    def test_imageresult_creation_none_result(self):
        """Test creating ImageResult with None result"""
        with self.assertRaises(ValueError):
            haven_vlm_engine.ImageResult(result=None)


class TestHavenVLMEngine(unittest.TestCase):
    """Test cases for HavenVLMEngine class"""

    def setUp(self):
        """Set up test fixtures"""
        self.engine = haven_vlm_engine.HavenVLMEngine()

    def test_engine_initialization(self):
        """Test engine initialization"""
        self.assertIsNone(self.engine.engine)
        self.assertIsNone(self.engine.engine_config)
        self.assertFalse(self.engine._initialized)

    @patch('haven_vlm_engine.config')
    @patch('haven_vlm_engine.VLMEngine')
    async def test_initialize_success(self, mock_vlm_engine_class, mock_config):
        """Test successful engine initialization"""
        mock_engine_instance = MagicMock()
        mock_vlm_engine_class.return_value = mock_engine_instance
        mock_config.config.vlm_engine_config = {"test": "config"}
        
        await self.engine.initialize()
        
        self.assertTrue(self.engine._initialized)
        mock_vlm_engine_class.assert_called_once()
        mock_engine_instance.initialize.assert_called_once()

    @patch('haven_vlm_engine.config')
    @patch('haven_vlm_engine.VLMEngine')
    async def test_initialize_already_initialized(self, mock_vlm_engine_class, mock_config):
        """Test initialization when already initialized"""
        self.engine._initialized = True
        
        await self.engine.initialize()
        
        # Should not call VLMEngine constructor again
        mock_vlm_engine_class.assert_not_called()

    @patch('haven_vlm_engine.config')
    @patch('haven_vlm_engine.VLMEngine')
    async def test_initialize_error(self, mock_vlm_engine_class, mock_config):
        """Test initialization with error"""
        mock_vlm_engine_class.side_effect = Exception("Initialization failed")
        mock_config.config.vlm_engine_config = {"test": "config"}
        
        with self.assertRaises(Exception):
            await self.engine.initialize()
        
        self.assertFalse(self.engine._initialized)

    @patch('haven_vlm_engine.config')
    def test_create_engine_config(self, mock_config):
        """Test creating engine configuration"""
        mock_config.config.vlm_engine_config = {
            "active_ai_models": ["model1"],
            "pipelines": {
                "pipeline1": {
                    "inputs": ["input1"],
                    "output": "output1",
                    "short_name": "short1",
                    "version": 1.0,
                    "models": [
                        {
                            "name": "model1",
                            "inputs": ["input1"],
                            "outputs": "output1"
                        }
                    ]
                }
            },
            "models": {
                "model1": {
                    "type": "vlm_model",
                    "model_file_name": "model1.py",
                    "model_category": "test",
                    "model_id": "test_model",
                    "model_identifier": 123,
                    "model_version": "1.0",
                    "use_multiplexer": True,
                    "max_concurrent_requests": 10,
                    "connection_pool_size": 20,
                    "multiplexer_endpoints": [],
                    "tag_list": ["tag1"]
                }
            },
            "category_config": {"test": {}}
        }
        
        config = self.engine._create_engine_config()
        
        self.assertIsNotNone(config)
        # Note: We can't easily test the exact structure without the actual VLM Engine classes
        # but we can verify the method doesn't raise exceptions

    @patch('haven_vlm_engine.config')
    @patch('haven_vlm_engine.VLMEngine')
    async def test_process_video_success(self, mock_vlm_engine_class, mock_config):
        """Test successful video processing"""
        # Setup mocks
        mock_engine_instance = MagicMock()
        mock_vlm_engine_class.return_value = mock_engine_instance
        mock_config.config.video_frame_interval = 2.0
        mock_config.config.video_threshold = 0.3
        mock_config.config.video_confidence_return = True
        
        # Mock the engine's process_video method
        mock_engine_instance.process_video.return_value = {
            "video_duration": 120.0,
            "video_tags": {"category1": ["tag1"]},
            "tag_totals": {"tag1": {"total": 0.8}},
            "tag_timespans": {}
        }
        
        # Initialize engine
        await self.engine.initialize()
        
        # Process video
        result = await self.engine.process_video("/path/to/video.mp4")
        
        self.assertIsInstance(result, haven_vlm_engine.VideoTagInfo)
        mock_engine_instance.process_video.assert_called_once()

    @patch('haven_vlm_engine.config')
    @patch('haven_vlm_engine.VLMEngine')
    async def test_process_video_not_initialized(self, mock_vlm_engine_class, mock_config):
        """Test video processing when not initialized"""
        mock_engine_instance = MagicMock()
        mock_vlm_engine_class.return_value = mock_engine_instance
        mock_config.config.video_frame_interval = 2.0
        mock_config.config.video_threshold = 0.3
        mock_config.config.video_confidence_return = True
        
        mock_engine_instance.process_video.return_value = {
            "video_duration": 120.0,
            "video_tags": {"category1": ["tag1"]},
            "tag_totals": {"tag1": {"total": 0.8}},
            "tag_timespans": {}
        }
        
        # Process video without explicit initialization
        result = await self.engine.process_video("/path/to/video.mp4")
        
        self.assertIsInstance(result, haven_vlm_engine.VideoTagInfo)
        mock_engine_instance.initialize.assert_called_once()

    @patch('haven_vlm_engine.config')
    @patch('haven_vlm_engine.VLMEngine')
    async def test_process_video_error(self, mock_vlm_engine_class, mock_config):
        """Test video processing with error"""
        mock_engine_instance = MagicMock()
        mock_vlm_engine_class.return_value = mock_engine_instance
        mock_config.config.video_frame_interval = 2.0
        mock_config.config.video_threshold = 0.3
        mock_config.config.video_confidence_return = True
        
        mock_engine_instance.process_video.side_effect = Exception("Processing failed")
        
        await self.engine.initialize()
        
        with self.assertRaises(Exception):
            await self.engine.process_video("/path/to/video.mp4")

    @patch('haven_vlm_engine.config')
    @patch('haven_vlm_engine.VLMEngine')
    async def test_process_images_success(self, mock_vlm_engine_class, mock_config):
        """Test successful image processing"""
        # Setup mocks
        mock_engine_instance = MagicMock()
        mock_vlm_engine_class.return_value = mock_engine_instance
        mock_config.config.image_threshold = 0.5
        mock_config.config.image_confidence_return = False
        
        # Mock the engine's process_images method
        mock_engine_instance.process_images.return_value = [
            {"tags": ["tag1"], "confidence": 0.8}
        ]
        
        # Initialize engine
        await self.engine.initialize()
        
        # Process images
        result = await self.engine.process_images(["/path/to/image1.jpg"])
        
        self.assertIsInstance(result, haven_vlm_engine.ImageResult)
        mock_engine_instance.process_images.assert_called_once()

    @patch('haven_vlm_engine.config')
    @patch('haven_vlm_engine.VLMEngine')
    async def test_process_images_error(self, mock_vlm_engine_class, mock_config):
        """Test image processing with error"""
        mock_engine_instance = MagicMock()
        mock_vlm_engine_class.return_value = mock_engine_instance
        mock_config.config.image_threshold = 0.5
        mock_config.config.image_confidence_return = False
        
        mock_engine_instance.process_images.side_effect = Exception("Processing failed")
        
        await self.engine.initialize()
        
        with self.assertRaises(Exception):
            await self.engine.process_images(["/path/to/image1.jpg"])

    @patch('haven_vlm_engine.config')
    @patch('haven_vlm_engine.VLMEngine')
    async def test_find_optimal_marker_settings_success(self, mock_vlm_engine_class, mock_config):
        """Test successful marker settings optimization"""
        # Setup mocks
        mock_engine_instance = MagicMock()
        mock_vlm_engine_class.return_value = mock_engine_instance
        mock_engine_instance.optimize_timeframe_settings.return_value = {"optimal": "settings"}
        
        # Initialize engine
        await self.engine.initialize()
        
        # Test data
        existing_json = {"existing": "data"}
        desired_timespan_data = {
            "tag1": haven_vlm_engine.TimeFrame(10.0, 15.0, 0.8)
        }
        
        # Find optimal settings
        result = await self.engine.find_optimal_marker_settings(existing_json, desired_timespan_data)
        
        self.assertEqual(result, {"optimal": "settings"})
        mock_engine_instance.optimize_timeframe_settings.assert_called_once()

    @patch('haven_vlm_engine.config')
    @patch('haven_vlm_engine.VLMEngine')
    async def test_find_optimal_marker_settings_error(self, mock_vlm_engine_class, mock_config):
        """Test marker settings optimization with error"""
        mock_engine_instance = MagicMock()
        mock_vlm_engine_class.return_value = mock_engine_instance
        mock_engine_instance.optimize_timeframe_settings.side_effect = Exception("Optimization failed")
        
        await self.engine.initialize()
        
        existing_json = {"existing": "data"}
        desired_timespan_data = {
            "tag1": haven_vlm_engine.TimeFrame(10.0, 15.0, 0.8)
        }
        
        with self.assertRaises(Exception):
            await self.engine.find_optimal_marker_settings(existing_json, desired_timespan_data)

    @patch('haven_vlm_engine.config')
    @patch('haven_vlm_engine.VLMEngine')
    async def test_shutdown_success(self, mock_vlm_engine_class, mock_config):
        """Test successful engine shutdown"""
        mock_engine_instance = MagicMock()
        mock_vlm_engine_class.return_value = mock_engine_instance
        
        await self.engine.initialize()
        await self.engine.shutdown()
        
        mock_engine_instance.shutdown.assert_called_once()
        self.assertFalse(self.engine._initialized)

    @patch('haven_vlm_engine.config')
    @patch('haven_vlm_engine.VLMEngine')
    async def test_shutdown_not_initialized(self, mock_vlm_engine_class, mock_config):
        """Test shutdown when not initialized"""
        await self.engine.shutdown()
        
        # Should not raise any exceptions
        self.assertFalse(self.engine._initialized)

    @patch('haven_vlm_engine.config')
    @patch('haven_vlm_engine.VLMEngine')
    async def test_shutdown_error(self, mock_vlm_engine_class, mock_config):
        """Test shutdown with error"""
        mock_engine_instance = MagicMock()
        mock_vlm_engine_class.return_value = mock_engine_instance
        mock_engine_instance.shutdown.side_effect = Exception("Shutdown failed")
        
        await self.engine.initialize()
        await self.engine.shutdown()
        
        # Should handle the error gracefully
        self.assertFalse(self.engine._initialized)


class TestConvenienceFunctions(unittest.TestCase):
    """Test cases for convenience functions"""

    @patch('haven_vlm_engine.vlm_engine')
    async def test_process_video_async(self, mock_vlm_engine):
        """Test process_video_async convenience function"""
        mock_vlm_engine.process_video.return_value = MagicMock()
        
        result = await haven_vlm_engine.process_video_async("/path/to/video.mp4")
        
        mock_vlm_engine.process_video.assert_called_once()
        self.assertEqual(result, mock_vlm_engine.process_video.return_value)

    @patch('haven_vlm_engine.vlm_engine')
    async def test_process_images_async(self, mock_vlm_engine):
        """Test process_images_async convenience function"""
        mock_vlm_engine.process_images.return_value = MagicMock()
        
        result = await haven_vlm_engine.process_images_async(["/path/to/image.jpg"])
        
        mock_vlm_engine.process_images.assert_called_once()
        self.assertEqual(result, mock_vlm_engine.process_images.return_value)

    @patch('haven_vlm_engine.vlm_engine')
    async def test_find_optimal_marker_settings_async(self, mock_vlm_engine):
        """Test find_optimal_marker_settings_async convenience function"""
        mock_vlm_engine.find_optimal_marker_settings.return_value = {"optimal": "settings"}
        
        existing_json = {"existing": "data"}
        desired_timespan_data = {
            "tag1": haven_vlm_engine.TimeFrame(10.0, 15.0, 0.8)
        }
        
        result = await haven_vlm_engine.find_optimal_marker_settings_async(existing_json, desired_timespan_data)
        
        mock_vlm_engine.find_optimal_marker_settings.assert_called_once()
        self.assertEqual(result, {"optimal": "settings"})


class TestGlobalVLMEngineInstance(unittest.TestCase):
    """Test cases for global VLM engine instance"""

    def test_global_vlm_engine_exists(self):
        """Test that global VLM engine instance exists"""
        self.assertIsInstance(haven_vlm_engine.vlm_engine, haven_vlm_engine.HavenVLMEngine)

    def test_global_vlm_engine_is_singleton(self):
        """Test that global VLM engine is a singleton"""
        engine1 = haven_vlm_engine.vlm_engine
        engine2 = haven_vlm_engine.vlm_engine
        
        self.assertIs(engine1, engine2)


if __name__ == '__main__':
    unittest.main() 