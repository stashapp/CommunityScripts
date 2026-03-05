"""
Unit tests for Haven Media Handler Module
Tests StashApp media operations and tag management
"""

import unittest
from unittest.mock import Mock, patch, MagicMock
from typing import List, Dict, Any, Optional
import sys
import os

# Add the current directory to the path to import the module
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Mock the dependencies before importing the module
sys.modules['PythonDepManager'] = Mock()
sys.modules['stashapi.stashapp'] = Mock()
sys.modules['stashapi.log'] = Mock()
sys.modules['haven_vlm_config'] = Mock()

# Import the module after mocking dependencies
import haven_media_handler


class TestHavenMediaHandler(unittest.TestCase):
    """Test cases for Haven Media Handler"""

    def setUp(self) -> None:
        """Set up test fixtures"""
        # Mock the stash interface
        self.mock_stash = Mock()
        self.mock_stash.find_tag.return_value = {"id": 1}
        self.mock_stash.get_configuration.return_value = {"ui": {"vrTag": "VR"}}
        self.mock_stash.stash_version.return_value = Mock()
        
        # Mock the log module
        self.mock_log = Mock()
        
        # Patch the global variables
        haven_media_handler.stash = self.mock_stash
        haven_media_handler.log = self.mock_log
        
        # Mock tag IDs
        haven_media_handler.vlm_errored_tag_id = 1
        haven_media_handler.vlm_tagme_tag_id = 2
        haven_media_handler.vlm_base_tag_id = 3
        haven_media_handler.vlm_tagged_tag_id = 4
        haven_media_handler.vr_tag_id = 5
        haven_media_handler.vlm_incorrect_tag_id = 6

    def tearDown(self) -> None:
        """Clean up after tests"""
        # Clear any cached data
        haven_media_handler.tag_id_cache.clear()
        haven_media_handler.vlm_tag_ids_cache.clear()

    def test_clear_all_tags_from_video_with_tags(self) -> None:
        """Test clearing all tags from a video that has tags"""
        # Mock scene with tags
        mock_scene = {
            "id": 123,
            "tags": [
                {"id": 10, "name": "Tag1"},
                {"id": 20, "name": "Tag2"},
                {"id": 30, "name": "Tag3"}
            ]
        }
        # Call the function
        haven_media_handler.clear_all_tags_from_video(mock_scene)
        # Verify tags were removed
        self.mock_stash.update_scenes.assert_called_once_with({
            "ids": [123],
            "tag_ids": {"ids": [10, 20, 30], "mode": "REMOVE"}
        })
        # Verify log message
        self.mock_log.info.assert_called_once_with("Cleared 3 tags from scene 123")

    def test_clear_all_tags_from_video_no_tags(self) -> None:
        """Test clearing all tags from a video that has no tags"""
        # Mock scene without tags
        mock_scene = {"id": 123, "tags": []}
        # Call the function
        haven_media_handler.clear_all_tags_from_video(mock_scene)
        # Verify no update was called since there are no tags
        self.mock_stash.update_scenes.assert_not_called()
        # Verify no log message
        self.mock_log.info.assert_not_called()

    def test_clear_all_tags_from_video_scene_without_tags_key(self) -> None:
        """Test clearing all tags from a scene that doesn't have a tags key"""
        # Mock scene without tags key
        mock_scene = {"id": 123}
        # Call the function
        haven_media_handler.clear_all_tags_from_video(mock_scene)
        # Verify no update was called
        self.mock_stash.update_scenes.assert_not_called()

    @patch('haven_media_handler.get_scene_markers')
    @patch('haven_media_handler.delete_markers')
    def test_clear_all_markers_from_video_with_markers(self, mock_delete_markers: Mock, mock_get_markers: Mock) -> None:
        """Test clearing all markers from a video that has markers"""
        # Mock markers
        mock_markers = [
            {"id": 1, "title": "Marker1"},
            {"id": 2, "title": "Marker2"}
        ]
        mock_get_markers.return_value = mock_markers
        
        # Call the function
        haven_media_handler.clear_all_markers_from_video(123)
        
        # Verify markers were retrieved
        mock_get_markers.assert_called_once_with(123)
        
        # Verify markers were deleted
        mock_delete_markers.assert_called_once_with(mock_markers)
        
        # Verify log message
        self.mock_log.info.assert_called_once_with("Cleared all 2 markers from scene 123")

    @patch('haven_media_handler.get_scene_markers')
    @patch('haven_media_handler.delete_markers')
    def test_clear_all_markers_from_video_no_markers(self, mock_delete_markers: Mock, mock_get_markers: Mock) -> None:
        """Test clearing all markers from a video that has no markers"""
        # Mock no markers
        mock_get_markers.return_value = []
        
        # Call the function
        haven_media_handler.clear_all_markers_from_video(123)
        
        # Verify markers were retrieved
        mock_get_markers.assert_called_once_with(123)
        
        # Verify no deletion was called
        mock_delete_markers.assert_not_called()
        
        # Verify no log message
        self.mock_log.info.assert_not_called()

    def test_add_tags_to_video_with_tagged(self) -> None:
        """Test adding tags to video with tagged flag enabled"""
        # Call the function
        haven_media_handler.add_tags_to_video(123, [10, 20, 30], add_tagged=True)
        
        # Verify tags were added (including tagged tag)
        self.mock_stash.update_scenes.assert_called_once_with({
            "ids": [123],
            "tag_ids": {"ids": [10, 20, 30, 4], "mode": "ADD"}
        })

    def test_add_tags_to_video_without_tagged(self) -> None:
        """Test adding tags to video with tagged flag disabled"""
        # Call the function
        haven_media_handler.add_tags_to_video(123, [10, 20, 30], add_tagged=False)
        
        # Verify tags were added (without tagged tag)
        self.mock_stash.update_scenes.assert_called_once_with({
            "ids": [123],
            "tag_ids": {"ids": [10, 20, 30], "mode": "ADD"}
        })

    @patch('haven_media_handler.get_vlm_tags')
    def test_remove_vlm_tags_from_video(self, mock_get_vlm_tags: Mock) -> None:
        """Test removing VLM tags from video"""
        # Mock VLM tags
        mock_get_vlm_tags.return_value = [100, 200, 300]
        
        # Call the function
        haven_media_handler.remove_vlm_tags_from_video(123, remove_tagme=True, remove_errored=True)
        
        # Verify VLM tags were retrieved
        mock_get_vlm_tags.assert_called_once()
        
        # Verify tags were removed (including tagme and errored tags)
        self.mock_stash.update_scenes.assert_called_once_with({
            "ids": [123],
            "tag_ids": {"ids": [100, 200, 300, 2, 1], "mode": "REMOVE"}
        })

    def test_get_tagme_scenes(self) -> None:
        """Test getting scenes tagged with VLM_TagMe"""
        # Mock scenes
        mock_scenes = [{"id": 1}, {"id": 2}]
        self.mock_stash.find_scenes.return_value = mock_scenes
        
        # Call the function
        result = haven_media_handler.get_tagme_scenes()
        
        # Verify scenes were found
        self.mock_stash.find_scenes.assert_called_once_with(
            f={"tags": {"value": 2, "modifier": "INCLUDES"}},
            fragment="id tags {id} files {path duration fingerprint(type: \"phash\")}"
        )
        
        # Verify result
        self.assertEqual(result, mock_scenes)

    def test_add_error_scene(self) -> None:
        """Test adding error tag to a scene"""
        # Call the function
        haven_media_handler.add_error_scene(123)
        
        # Verify error tag was added
        self.mock_stash.update_scenes.assert_called_once_with({
            "ids": [123],
            "tag_ids": {"ids": [1], "mode": "ADD"}
        })

    def test_remove_tagme_tag_from_scene(self) -> None:
        """Test removing VLM_TagMe tag from a scene"""
        # Call the function
        haven_media_handler.remove_tagme_tag_from_scene(123)
        
        # Verify tagme tag was removed
        self.mock_stash.update_scenes.assert_called_once_with({
            "ids": [123],
            "tag_ids": {"ids": [2], "mode": "REMOVE"}
        })

    def test_is_scene_tagged_true(self) -> None:
        """Test checking if a scene is tagged (true case)"""
        # Mock tags including tagged tag
        tags = [
            {"id": 10, "name": "Tag1"},
            {"id": 4, "name": "VLM_Tagged"},  # This is the tagged tag
            {"id": 20, "name": "Tag2"}
        ]
        
        # Call the function
        result = haven_media_handler.is_scene_tagged(tags)
        
        # Verify result
        self.assertTrue(result)

    def test_is_scene_tagged_false(self) -> None:
        """Test checking if a scene is tagged (false case)"""
        # Mock tags without tagged tag
        tags = [
            {"id": 10, "name": "Tag1"},
            {"id": 20, "name": "Tag2"}
        ]
        
        # Call the function
        result = haven_media_handler.is_scene_tagged(tags)
        
        # Verify result
        self.assertFalse(result)

    def test_is_vr_scene_true(self) -> None:
        """Test checking if a scene is VR (true case)"""
        # Mock tags including VR tag
        tags = [
            {"id": 10, "name": "Tag1"},
            {"id": 5, "name": "VR"},  # This is the VR tag
            {"id": 20, "name": "Tag2"}
        ]
        
        # Call the function
        result = haven_media_handler.is_vr_scene(tags)
        
        # Verify result
        self.assertTrue(result)

    def test_is_vr_scene_false(self) -> None:
        """Test checking if a scene is VR (false case)"""
        # Mock tags without VR tag
        tags = [
            {"id": 10, "name": "Tag1"},
            {"id": 20, "name": "Tag2"}
        ]
        
        # Call the function
        result = haven_media_handler.is_vr_scene(tags)
        
        # Verify result
        self.assertFalse(result)

    def test_get_tag_id_existing(self) -> None:
        """Test getting tag ID for existing tag"""
        # Mock existing tag
        self.mock_stash.find_tag.return_value = {"id": 123, "name": "TestTag"}
        
        # Call the function
        result = haven_media_handler.get_tag_id("TestTag", create=False)
        
        # Verify tag was found
        self.mock_stash.find_tag.assert_called_once_with("TestTag")
        
        # Verify result
        self.assertEqual(result, 123)

    def test_get_tag_id_not_existing_no_create(self) -> None:
        """Test getting tag ID for non-existing tag without create"""
        # Mock non-existing tag
        self.mock_stash.find_tag.return_value = None
        
        # Call the function
        result = haven_media_handler.get_tag_id("TestTag", create=False)
        
        # Verify tag was searched
        self.mock_stash.find_tag.assert_called_once_with("TestTag")
        
        # Verify result is None
        self.assertIsNone(result)

    def test_get_tag_id_create_new(self) -> None:
        """Test getting tag ID for non-existing tag with create"""
        # Mock non-existing tag
        self.mock_stash.find_tag.return_value = None
        
        # Mock created tag
        self.mock_stash.create_tag.return_value = {"id": 456, "name": "TestTag"}
        
        # Call the function
        result = haven_media_handler.get_tag_id("TestTag", create=True)
        
        # Verify tag was searched
        self.mock_stash.find_tag.assert_called_once_with("TestTag")
        
        # Verify tag was created
        self.mock_stash.create_tag.assert_called_once_with({
            "name": "TestTag",
            "ignore_auto_tag": True,
            "parent_ids": [3]
        })
        
        # Verify result
        self.assertEqual(result, 456)

    def test_get_tag_ids(self) -> None:
        """Test getting multiple tag IDs"""
        # Mock tag IDs
        with patch('haven_media_handler.get_tag_id') as mock_get_tag_id:
            mock_get_tag_id.side_effect = [10, 20, 30]
            
            # Call the function
            result = haven_media_handler.get_tag_ids(["Tag1", "Tag2", "Tag3"], create=True)
            
            # Verify individual tag IDs were retrieved
            self.assertEqual(mock_get_tag_id.call_count, 3)
            mock_get_tag_id.assert_any_call("Tag1", True)
            mock_get_tag_id.assert_any_call("Tag2", True)
            mock_get_tag_id.assert_any_call("Tag3", True)
            
            # Verify result
            self.assertEqual(result, [10, 20, 30])

    @patch('haven_media_handler.vlm_tag_ids_cache')
    def test_get_vlm_tags_from_cache(self, mock_cache: Mock) -> None:
        """Test getting VLM tags from cache"""
        # Mock cached tags
        mock_cache.__len__.return_value = 3
        mock_cache.__iter__.return_value = iter([100, 200, 300])
        
        # Call the function
        result = haven_media_handler.get_vlm_tags()
        
        # Verify result from cache
        self.assertEqual(result, [100, 200, 300])

    def test_get_vlm_tags_from_stash(self) -> None:
        """Test getting VLM tags from stash when cache is empty"""
        # Mock empty cache
        haven_media_handler.vlm_tag_ids_cache.clear()
        
        # Mock stash tags
        mock_tags = [
            {"id": 100, "name": "VLM_Tag1"},
            {"id": 200, "name": "VLM_Tag2"}
        ]
        self.mock_stash.find_tags.return_value = mock_tags
        
        # Call the function
        result = haven_media_handler.get_vlm_tags()
        
        # Verify tags were found
        self.mock_stash.find_tags.assert_called_once_with(
            f={"parents": {"value": 3, "modifier": "INCLUDES"}},
            fragment="id"
        )
        
        # Verify result
        self.assertEqual(result, [100, 200])


if __name__ == '__main__':
    unittest.main() 