"""
Unit tests for haven_vlm_connector module
"""

import unittest
import asyncio
import json
import tempfile
import os
from unittest.mock import patch, MagicMock, AsyncMock, mock_open
import sys

# Mock the stashapi imports
sys.modules['stashapi.log'] = MagicMock()
sys.modules['stashapi.stashapp'] = MagicMock()

# Mock the vlm_engine imports
sys.modules['vlm_engine'] = MagicMock()
sys.modules['vlm_engine.config_models'] = MagicMock()

import haven_vlm_connector


class TestMainExecution(unittest.TestCase):
    """Test cases for main execution functions"""

    def setUp(self):
        """Set up test fixtures"""
        self.sample_json_input = {
            "server_connection": {
                "PluginDir": "/tmp/plugin"
            },
            "args": {
                "mode": "tag_videos"
            }
        }

    @patch('haven_vlm_connector.media_handler')
    @patch('haven_vlm_connector.tag_videos')
    @patch('haven_vlm_connector.os.chdir')
    def test_run_tag_videos(self, mock_chdir, mock_tag_videos, mock_media_handler):
        """Test running tag_videos mode"""
        output = {}
        
        with patch('haven_vlm_connector.read_json_input', return_value=self.sample_json_input):
            asyncio.run(haven_vlm_connector.run(self.sample_json_input, output))
        
        mock_chdir.assert_called_once_with("/tmp/plugin")
        mock_media_handler.initialize.assert_called_once_with(self.sample_json_input["server_connection"])
        mock_tag_videos.assert_called_once()
        self.assertEqual(output["output"], "ok")

    @patch('haven_vlm_connector.media_handler')
    @patch('haven_vlm_connector.tag_images')
    @patch('haven_vlm_connector.os.chdir')
    def test_run_tag_images(self, mock_chdir, mock_tag_images, mock_media_handler):
        """Test running tag_images mode"""
        json_input = self.sample_json_input.copy()
        json_input["args"]["mode"] = "tag_images"
        output = {}
        
        asyncio.run(haven_vlm_connector.run(json_input, output))
        
        mock_tag_images.assert_called_once()
        self.assertEqual(output["output"], "ok")

    @patch('haven_vlm_connector.media_handler')
    @patch('haven_vlm_connector.find_marker_settings')
    @patch('haven_vlm_connector.os.chdir')
    def test_run_find_marker_settings(self, mock_chdir, mock_find_marker_settings, mock_media_handler):
        """Test running find_marker_settings mode"""
        json_input = self.sample_json_input.copy()
        json_input["args"]["mode"] = "find_marker_settings"
        output = {}
        
        asyncio.run(haven_vlm_connector.run(json_input, output))
        
        mock_find_marker_settings.assert_called_once()
        self.assertEqual(output["output"], "ok")

    @patch('haven_vlm_connector.media_handler')
    @patch('haven_vlm_connector.collect_incorrect_markers_and_images')
    @patch('haven_vlm_connector.os.chdir')
    def test_run_collect_incorrect_markers(self, mock_chdir, mock_collect, mock_media_handler):
        """Test running collect_incorrect_markers mode"""
        json_input = self.sample_json_input.copy()
        json_input["args"]["mode"] = "collect_incorrect_markers"
        output = {}
        
        asyncio.run(haven_vlm_connector.run(json_input, output))
        
        mock_collect.assert_called_once()
        self.assertEqual(output["output"], "ok")

    @patch('haven_vlm_connector.media_handler')
    @patch('haven_vlm_connector.os.chdir')
    def test_run_no_mode(self, mock_chdir, mock_media_handler):
        """Test running with no mode specified"""
        json_input = self.sample_json_input.copy()
        del json_input["args"]["mode"]
        output = {}
        
        asyncio.run(haven_vlm_connector.run(json_input, output))
        
        self.assertEqual(output["output"], "ok")

    @patch('haven_vlm_connector.media_handler')
    def test_run_media_handler_initialization_error(self, mock_media_handler):
        """Test handling media handler initialization error"""
        mock_media_handler.initialize.side_effect = Exception("Initialization failed")
        output = {}
        
        with self.assertRaises(Exception):
            asyncio.run(haven_vlm_connector.run(self.sample_json_input, output))

    def test_read_json_input(self):
        """Test reading JSON input from stdin"""
        test_input = '{"test": "data"}'
        
        with patch('sys.stdin.read', return_value=test_input):
            result = haven_vlm_connector.read_json_input()
        
        self.assertEqual(result, {"test": "data"})


class TestHighLevelProcessingFunctions(unittest.TestCase):
    """Test cases for high-level processing functions"""

    @patch('haven_vlm_connector.media_handler')
    @patch('haven_vlm_connector.__tag_images')
    @patch('haven_vlm_connector.asyncio.gather')
    def test_tag_images_with_images(self, mock_gather, mock_tag_images, mock_media_handler):
        """Test tagging images when images are available"""
        mock_images = [{"id": 1}, {"id": 2}, {"id": 3}]
        mock_media_handler.get_tagme_images.return_value = mock_images
        
        asyncio.run(haven_vlm_connector.tag_images())
        
        mock_media_handler.get_tagme_images.assert_called_once()
        mock_gather.assert_called_once()

    @patch('haven_vlm_connector.media_handler')
    def test_tag_images_no_images(self, mock_media_handler):
        """Test tagging images when no images are available"""
        mock_media_handler.get_tagme_images.return_value = []
        
        asyncio.run(haven_vlm_connector.tag_images())
        
        mock_media_handler.get_tagme_images.assert_called_once()

    @patch('haven_vlm_connector.media_handler')
    @patch('haven_vlm_connector.__tag_video')
    @patch('haven_vlm_connector.asyncio.gather')
    def test_tag_videos_with_scenes(self, mock_gather, mock_tag_video, mock_media_handler):
        """Test tagging videos when scenes are available"""
        mock_scenes = [{"id": 1}, {"id": 2}]
        mock_media_handler.get_tagme_scenes.return_value = mock_scenes
        
        asyncio.run(haven_vlm_connector.tag_videos())
        
        mock_media_handler.get_tagme_scenes.assert_called_once()
        mock_gather.assert_called_once()

    @patch('haven_vlm_connector.media_handler')
    def test_tag_videos_no_scenes(self, mock_media_handler):
        """Test tagging videos when no scenes are available"""
        mock_media_handler.get_tagme_scenes.return_value = []
        
        asyncio.run(haven_vlm_connector.tag_videos())
        
        mock_media_handler.get_tagme_scenes.assert_called_once()

    @patch('haven_vlm_connector.media_handler')
    @patch('haven_vlm_connector.__find_marker_settings')
    def test_find_marker_settings_single_scene(self, mock_find_settings, mock_media_handler):
        """Test finding marker settings with single scene"""
        mock_scenes = [{"id": 1}]
        mock_media_handler.get_tagme_scenes.return_value = mock_scenes
        
        asyncio.run(haven_vlm_connector.find_marker_settings())
        
        mock_media_handler.get_tagme_scenes.assert_called_once()
        mock_find_settings.assert_called_once_with(mock_scenes[0])

    @patch('haven_vlm_connector.media_handler')
    def test_find_marker_settings_no_scenes(self, mock_media_handler):
        """Test finding marker settings with no scenes"""
        mock_media_handler.get_tagme_scenes.return_value = []
        
        asyncio.run(haven_vlm_connector.find_marker_settings())
        
        mock_media_handler.get_tagme_scenes.assert_called_once()

    @patch('haven_vlm_connector.media_handler')
    def test_find_marker_settings_multiple_scenes(self, mock_media_handler):
        """Test finding marker settings with multiple scenes"""
        mock_scenes = [{"id": 1}, {"id": 2}]
        mock_media_handler.get_tagme_scenes.return_value = mock_scenes
        
        asyncio.run(haven_vlm_connector.find_marker_settings())
        
        mock_media_handler.get_tagme_scenes.assert_called_once()

    @patch('haven_vlm_connector.media_handler')
    @patch('haven_vlm_connector.os.makedirs')
    @patch('haven_vlm_connector.shutil.copy')
    def test_collect_incorrect_markers_and_images_with_data(self, mock_copy, mock_makedirs, mock_media_handler):
        """Test collecting incorrect markers and images with data"""
        mock_images = [{"id": 1, "files": [{"path": "/path/to/image.jpg"}]}]
        mock_markers = [{"id": 1, "scene": {"files": [{"path": "/path/to/video.mp4"}]}, "primary_tag": {"name": "test"}}]
        mock_media_handler.get_incorrect_images.return_value = mock_images
        mock_media_handler.get_incorrect_markers.return_value = mock_markers
        mock_media_handler.get_image_paths_and_ids.return_value = (["/path/to/image.jpg"], [1], [])
        
        haven_vlm_connector.collect_incorrect_markers_and_images()
        
        mock_media_handler.get_incorrect_images.assert_called_once()
        mock_media_handler.get_incorrect_markers.assert_called_once()
        mock_media_handler.remove_incorrect_tag_from_images.assert_called_once()

    @patch('haven_vlm_connector.media_handler')
    def test_collect_incorrect_markers_and_images_no_data(self, mock_media_handler):
        """Test collecting incorrect markers and images with no data"""
        mock_media_handler.get_incorrect_images.return_value = []
        mock_media_handler.get_incorrect_markers.return_value = []
        
        haven_vlm_connector.collect_incorrect_markers_and_images()
        
        mock_media_handler.get_incorrect_images.assert_called_once()
        mock_media_handler.get_incorrect_markers.assert_called_once()


class TestLowLevelProcessingFunctions(unittest.TestCase):
    """Test cases for low-level processing functions"""

    @patch('haven_vlm_connector.vlm_engine')
    @patch('haven_vlm_connector.media_handler')
    @patch('haven_vlm_connector.semaphore')
    def test_tag_images_success(self, mock_semaphore, mock_media_handler, mock_vlm_engine):
        """Test successful image tagging"""
        mock_images = [{"id": 1}, {"id": 2}]
        mock_media_handler.get_image_paths_and_ids.return_value = (["/path1.jpg", "/path2.jpg"], [1, 2], [])
        mock_vlm_engine.process_images_async.return_value = MagicMock(result=[{"tags": ["tag1"]}, {"tags": ["tag2"]}])
        mock_media_handler.get_tag_ids.return_value = [100, 200]
        
        # Mock semaphore context manager
        mock_semaphore.__aenter__ = AsyncMock()
        mock_semaphore.__aexit__ = AsyncMock()
        
        asyncio.run(haven_vlm_connector.__tag_images(mock_images))
        
        mock_media_handler.get_image_paths_and_ids.assert_called_once_with(mock_images)
        mock_vlm_engine.process_images_async.assert_called_once()
        mock_media_handler.remove_tagme_tags_from_images.assert_called_once()

    @patch('haven_vlm_connector.vlm_engine')
    @patch('haven_vlm_connector.media_handler')
    @patch('haven_vlm_connector.semaphore')
    def test_tag_images_error(self, mock_semaphore, mock_media_handler, mock_vlm_engine):
        """Test image tagging with error"""
        mock_images = [{"id": 1}]
        mock_vlm_engine.process_images_async.side_effect = Exception("Processing error")
        
        # Mock semaphore context manager
        mock_semaphore.__aenter__ = AsyncMock()
        mock_semaphore.__aexit__ = AsyncMock()
        
        asyncio.run(haven_vlm_connector.__tag_images(mock_images))
        
        mock_media_handler.add_error_images.assert_called_once()

    @patch('haven_vlm_connector.vlm_engine')
    @patch('haven_vlm_connector.media_handler')
    @patch('haven_vlm_connector.semaphore')
    def test_tag_video_success(self, mock_semaphore, mock_media_handler, mock_vlm_engine):
        """Test successful video tagging"""
        mock_scene = {
            "id": 1,
            "files": [{"path": "/path/to/video.mp4"}],
            "tags": []
        }
        mock_vlm_engine.process_video_async.return_value = MagicMock(
            video_tags={"category": ["tag1", "tag2"]},
            tag_timespans={}
        )
        mock_media_handler.is_vr_scene.return_value = False
        mock_media_handler.get_tag_ids.return_value = [100, 200]
        
        # Mock semaphore context manager
        mock_semaphore.__aenter__ = AsyncMock()
        mock_semaphore.__aexit__ = AsyncMock()
        
        asyncio.run(haven_vlm_connector.__tag_video(mock_scene))
        
        mock_vlm_engine.process_video_async.assert_called_once()
        
        # Verify tags and markers were cleared before adding new ones
        mock_media_handler.clear_all_tags_from_video.assert_called_once_with(1)
        mock_media_handler.clear_all_markers_from_video.assert_called_once_with(1)
        
        mock_media_handler.add_tags_to_video.assert_called_once()
        mock_media_handler.remove_tagme_tag_from_scene.assert_called_once()

    @patch('haven_vlm_connector.vlm_engine')
    @patch('haven_vlm_connector.media_handler')
    @patch('haven_vlm_connector.semaphore')
    def test_tag_video_error(self, mock_semaphore, mock_media_handler, mock_vlm_engine):
        """Test video tagging with error"""
        mock_scene = {
            "id": 1,
            "files": [{"path": "/path/to/video.mp4"}],
            "tags": []
        }
        mock_vlm_engine.process_video_async.side_effect = Exception("Processing error")
        
        # Mock semaphore context manager
        mock_semaphore.__aenter__ = AsyncMock()
        mock_semaphore.__aexit__ = AsyncMock()
        
        asyncio.run(haven_vlm_connector.__tag_video(mock_scene))
        
        mock_media_handler.add_error_scene.assert_called_once()

    @patch('haven_vlm_connector.vlm_engine')
    @patch('haven_vlm_connector.media_handler')
    def test_find_marker_settings_success(self, mock_media_handler, mock_vlm_engine):
        """Test successful marker settings finding"""
        mock_scene = {
            "id": 1,
            "files": [{"path": "/path/to/video.mp4"}]
        }
        mock_markers = [
            {
                "primary_tag": {"name": "tag1"},
                "seconds": 10.0,
                "end_seconds": 15.0
            }
        ]
        mock_media_handler.get_scene_markers.return_value = mock_markers
        mock_vlm_engine.find_optimal_marker_settings_async.return_value = {"optimal": "settings"}
        
        asyncio.run(haven_vlm_connector.__find_marker_settings(mock_scene))
        
        mock_media_handler.get_scene_markers.assert_called_once_with(1)
        mock_vlm_engine.find_optimal_marker_settings_async.assert_called_once()

    @patch('haven_vlm_connector.media_handler')
    def test_find_marker_settings_error(self, mock_media_handler):
        """Test marker settings finding with error"""
        mock_scene = {
            "id": 1,
            "files": [{"path": "/path/to/video.mp4"}]
        }
        mock_media_handler.get_scene_markers.side_effect = Exception("Marker error")
        
        asyncio.run(haven_vlm_connector.__find_marker_settings(mock_scene))
        
        mock_media_handler.get_scene_markers.assert_called_once()


class TestUtilityFunctions(unittest.TestCase):
    """Test cases for utility functions"""

    def test_increment_progress(self):
        """Test progress increment"""
        haven_vlm_connector.progress = 0.0
        haven_vlm_connector.increment = 0.1
        
        haven_vlm_connector.increment_progress()
        
        self.assertEqual(haven_vlm_connector.progress, 0.1)

    @patch('haven_vlm_connector.vlm_engine')
    async def test_cleanup(self, mock_vlm_engine):
        """Test cleanup function"""
        mock_vlm_engine.vlm_engine = MagicMock()
        
        await haven_vlm_connector.cleanup()
        
        mock_vlm_engine.vlm_engine.shutdown.assert_called_once()


class TestMainFunction(unittest.TestCase):
    """Test cases for main function"""

    @patch('haven_vlm_connector.run')
    @patch('haven_vlm_connector.read_json_input')
    @patch('haven_vlm_connector.json.dumps')
    @patch('builtins.print')
    def test_main_success(self, mock_print, mock_json_dumps, mock_read_input, mock_run):
        """Test successful main execution"""
        mock_read_input.return_value = {"test": "data"}
        mock_json_dumps.return_value = '{"output": "ok"}'
        
        asyncio.run(haven_vlm_connector.main())
        
        mock_read_input.assert_called_once()
        mock_run.assert_called_once()
        mock_json_dumps.assert_called_once()
        mock_print.assert_called()


class TestErrorHandling(unittest.TestCase):
    """Test cases for error handling"""

    @patch('haven_vlm_connector.media_handler')
    def test_tag_images_empty_paths(self, mock_media_handler):
        """Test image tagging with empty paths"""
        mock_images = [{"id": 1}]
        mock_media_handler.get_image_paths_and_ids.return_value = ([], [1], [])
        
        # Mock semaphore context manager
        with patch('haven_vlm_connector.semaphore') as mock_semaphore:
            mock_semaphore.__aenter__ = AsyncMock()
            mock_semaphore.__aexit__ = AsyncMock()
            
            asyncio.run(haven_vlm_connector.__tag_images(mock_images))
        
        mock_media_handler.get_image_paths_and_ids.assert_called_once()

    @patch('haven_vlm_connector.vlm_engine')
    @patch('haven_vlm_connector.media_handler')
    def test_tag_video_no_detected_tags(self, mock_media_handler, mock_vlm_engine):
        """Test video tagging with no detected tags"""
        mock_scene = {
            "id": 1,
            "files": [{"path": "/path/to/video.mp4"}],
            "tags": []
        }
        mock_vlm_engine.process_video_async.return_value = MagicMock(
            video_tags={},
            tag_timespans={}
        )
        mock_media_handler.is_vr_scene.return_value = False
        
        # Mock semaphore context manager
        with patch('haven_vlm_connector.semaphore') as mock_semaphore:
            mock_semaphore.__aenter__ = AsyncMock()
            mock_semaphore.__aexit__ = AsyncMock()
            
            asyncio.run(haven_vlm_connector.__tag_video(mock_scene))
        
        # Verify clearing functions are NOT called when no tags are detected
        mock_media_handler.clear_all_tags_from_video.assert_not_called()
        mock_media_handler.clear_all_markers_from_video.assert_not_called()
        
        mock_media_handler.remove_tagme_tag_from_scene.assert_called_once()


if __name__ == '__main__':
    unittest.main() 