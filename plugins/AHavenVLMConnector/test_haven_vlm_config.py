"""
Unit tests for haven_vlm_config module
"""

import unittest
import tempfile
import os
import yaml
from unittest.mock import patch, mock_open
from dataclasses import dataclass

import haven_vlm_config


class TestVLMConnectorConfig(unittest.TestCase):
    """Test cases for VLMConnectorConfig dataclass"""

    def test_vlm_connector_config_creation(self):
        """Test creating VLMConnectorConfig with all required fields"""
        config = haven_vlm_config.VLMConnectorConfig(
            vlm_engine_config={"test": "config"},
            video_frame_interval=2.0,
            video_threshold=0.3,
            video_confidence_return=True,
            image_threshold=0.5,
            image_batch_size=320,
            image_confidence_return=False,
            concurrent_task_limit=10,
            server_timeout=3700,
            vlm_base_tag_name="VLM",
            vlm_tagme_tag_name="VLM_TagMe",
            vlm_updateme_tag_name="VLM_UpdateMe",
            vlm_tagged_tag_name="VLM_Tagged",
            vlm_errored_tag_name="VLM_Errored",
            vlm_incorrect_tag_name="VLM_Incorrect",
            temp_image_dir="./temp_images",
            output_data_dir="./output_data",
            delete_incorrect_markers=True,
            create_markers=True,
            path_mutation={}
        )
        
        self.assertEqual(config.video_frame_interval, 2.0)
        self.assertEqual(config.video_threshold, 0.3)
        self.assertEqual(config.image_threshold, 0.5)
        self.assertEqual(config.concurrent_task_limit, 10)
        self.assertEqual(config.vlm_base_tag_name, "VLM")
        self.assertEqual(config.temp_image_dir, "./temp_images")

    def test_vlm_connector_config_defaults(self):
        """Test VLMConnectorConfig with minimal required fields"""
        config = haven_vlm_config.VLMConnectorConfig(
            vlm_engine_config={},
            video_frame_interval=1.0,
            video_threshold=0.1,
            video_confidence_return=False,
            image_threshold=0.1,
            image_batch_size=100,
            image_confidence_return=False,
            concurrent_task_limit=5,
            server_timeout=1000,
            vlm_base_tag_name="TEST",
            vlm_tagme_tag_name="TEST_TagMe",
            vlm_updateme_tag_name="TEST_UpdateMe",
            vlm_tagged_tag_name="TEST_Tagged",
            vlm_errored_tag_name="TEST_Errored",
            vlm_incorrect_tag_name="TEST_Incorrect",
            temp_image_dir="./test_temp",
            output_data_dir="./test_output",
            delete_incorrect_markers=False,
            create_markers=False,
            path_mutation={"test": "mutation"}
        )
        
        self.assertEqual(config.video_frame_interval, 1.0)
        self.assertEqual(config.video_threshold, 0.1)
        self.assertEqual(config.path_mutation, {"test": "mutation"})


class TestLoadConfigFromYaml(unittest.TestCase):
    """Test cases for load_config_from_yaml function"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_config = {
            "vlm_engine_config": {
                "active_ai_models": ["test_model"],
                "pipelines": {},
                "models": {},
                "category_config": {}
            },
            "video_frame_interval": 3.0,
            "video_threshold": 0.4,
            "video_confidence_return": True,
            "image_threshold": 0.6,
            "image_batch_size": 500,
            "image_confidence_return": True,
            "concurrent_task_limit": 15,
            "server_timeout": 5000,
            "vlm_base_tag_name": "TEST_VLM",
            "vlm_tagme_tag_name": "TEST_VLM_TagMe",
            "vlm_updateme_tag_name": "TEST_VLM_UpdateMe",
            "vlm_tagged_tag_name": "TEST_VLM_Tagged",
            "vlm_errored_tag_name": "TEST_VLM_Errored",
            "vlm_incorrect_tag_name": "TEST_VLM_Incorrect",
            "temp_image_dir": "./test_temp_images",
            "output_data_dir": "./test_output_data",
            "delete_incorrect_markers": False,
            "create_markers": False,
            "path_mutation": {"E:": "F:"}
        }

    def test_load_config_from_yaml_with_valid_file(self):
        """Test loading configuration from a valid YAML file"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
            yaml.dump(self.test_config, f)
            config_path = f.name

        try:
            config = haven_vlm_config.load_config_from_yaml(config_path)
            
            self.assertIsInstance(config, haven_vlm_config.VLMConnectorConfig)
            self.assertEqual(config.video_frame_interval, 3.0)
            self.assertEqual(config.video_threshold, 0.4)
            self.assertEqual(config.image_threshold, 0.6)
            self.assertEqual(config.concurrent_task_limit, 15)
            self.assertEqual(config.vlm_base_tag_name, "TEST_VLM")
            self.assertEqual(config.path_mutation, {"E:": "F:"})
        finally:
            os.unlink(config_path)

    def test_load_config_from_yaml_with_nonexistent_file(self):
        """Test loading configuration with nonexistent file path"""
        config = haven_vlm_config.load_config_from_yaml("nonexistent_file.yml")
        
        # Should return default configuration
        self.assertIsInstance(config, haven_vlm_config.VLMConnectorConfig)
        self.assertEqual(config.video_frame_interval, haven_vlm_config.VIDEO_FRAME_INTERVAL)
        self.assertEqual(config.video_threshold, haven_vlm_config.VIDEO_THRESHOLD)

    def test_load_config_from_yaml_with_none_path(self):
        """Test loading configuration with None path"""
        config = haven_vlm_config.load_config_from_yaml(None)
        
        # Should return default configuration
        self.assertIsInstance(config, haven_vlm_config.VLMConnectorConfig)
        self.assertEqual(config.video_frame_interval, haven_vlm_config.VIDEO_FRAME_INTERVAL)

    def test_load_config_from_yaml_with_invalid_yaml(self):
        """Test loading configuration with invalid YAML content"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
            f.write("invalid: yaml: content: [")
            config_path = f.name

        try:
            config = haven_vlm_config.load_config_from_yaml(config_path)
            
            # Should return default configuration on YAML error
            self.assertIsInstance(config, haven_vlm_config.VLMConnectorConfig)
            self.assertEqual(config.video_frame_interval, haven_vlm_config.VIDEO_FRAME_INTERVAL)
        finally:
            os.unlink(config_path)

    def test_load_config_from_yaml_with_file_permission_error(self):
        """Test loading configuration with file permission error"""
        with patch('builtins.open', side_effect=PermissionError("Permission denied")):
            config = haven_vlm_config.load_config_from_yaml("test.yml")
            
            # Should return default configuration on file error
            self.assertIsInstance(config, haven_vlm_config.VLMConnectorConfig)
            self.assertEqual(config.video_frame_interval, haven_vlm_config.VIDEO_FRAME_INTERVAL)


class TestConfigurationConstants(unittest.TestCase):
    """Test cases for configuration constants"""

    def test_vlm_engine_config_structure(self):
        """Test that VLM_ENGINE_CONFIG has the expected structure"""
        config = haven_vlm_config.VLM_ENGINE_CONFIG
        
        # Check required top-level keys
        self.assertIn("active_ai_models", config)
        self.assertIn("pipelines", config)
        self.assertIn("models", config)
        self.assertIn("category_config", config)
        
        # Check active_ai_models is a list
        self.assertIsInstance(config["active_ai_models"], list)
        self.assertIn("vlm_multiplexer_model", config["active_ai_models"])
        
        # Check pipelines structure
        self.assertIn("video_pipeline_dynamic", config["pipelines"])
        pipeline = config["pipelines"]["video_pipeline_dynamic"]
        self.assertIn("inputs", pipeline)
        self.assertIn("output", pipeline)
        self.assertIn("models", pipeline)
        
        # Check models structure
        self.assertIn("vlm_multiplexer_model", config["models"])
        model = config["models"]["vlm_multiplexer_model"]
        self.assertIn("type", model)
        self.assertIn("multiplexer_endpoints", model)
        self.assertIn("tag_list", model)

    def test_processing_settings(self):
        """Test that processing settings have valid values"""
        self.assertGreater(haven_vlm_config.VIDEO_FRAME_INTERVAL, 0)
        self.assertGreaterEqual(haven_vlm_config.VIDEO_THRESHOLD, 0)
        self.assertLessEqual(haven_vlm_config.VIDEO_THRESHOLD, 1)
        self.assertGreaterEqual(haven_vlm_config.IMAGE_THRESHOLD, 0)
        self.assertLessEqual(haven_vlm_config.IMAGE_THRESHOLD, 1)
        self.assertGreater(haven_vlm_config.IMAGE_BATCH_SIZE, 0)
        self.assertGreater(haven_vlm_config.CONCURRENT_TASK_LIMIT, 0)
        self.assertGreater(haven_vlm_config.SERVER_TIMEOUT, 0)

    def test_tag_names(self):
        """Test that tag names are valid strings"""
        tag_names = [
            haven_vlm_config.VLM_BASE_TAG_NAME,
            haven_vlm_config.VLM_TAGME_TAG_NAME,
            haven_vlm_config.VLM_UPDATEME_TAG_NAME,
            haven_vlm_config.VLM_TAGGED_TAG_NAME,
            haven_vlm_config.VLM_ERRORED_TAG_NAME,
            haven_vlm_config.VLM_INCORRECT_TAG_NAME
        ]
        
        for tag_name in tag_names:
            self.assertIsInstance(tag_name, str)
            self.assertGreater(len(tag_name), 0)

    def test_directory_paths(self):
        """Test that directory paths are valid strings"""
        self.assertIsInstance(haven_vlm_config.TEMP_IMAGE_DIR, str)
        self.assertIsInstance(haven_vlm_config.OUTPUT_DATA_DIR, str)
        self.assertGreater(len(haven_vlm_config.TEMP_IMAGE_DIR), 0)
        self.assertGreater(len(haven_vlm_config.OUTPUT_DATA_DIR), 0)

    def test_boolean_settings(self):
        """Test that boolean settings are valid"""
        self.assertIsInstance(haven_vlm_config.DELETE_INCORRECT_MARKERS, bool)
        self.assertIsInstance(haven_vlm_config.CREATE_MARKERS, bool)

    def test_path_mutation(self):
        """Test that path mutation is a dictionary"""
        self.assertIsInstance(haven_vlm_config.PATH_MUTATION, dict)


class TestGlobalConfigInstance(unittest.TestCase):
    """Test cases for the global config instance"""

    def test_global_config_exists(self):
        """Test that the global config instance exists and is valid"""
        self.assertIsInstance(haven_vlm_config.config, haven_vlm_config.VLMConnectorConfig)

    def test_global_config_has_required_attributes(self):
        """Test that the global config has all required attributes"""
        config = haven_vlm_config.config
        
        # Check that all required attributes exist
        required_attrs = [
            'vlm_engine_config', 'video_frame_interval', 'video_threshold',
            'video_confidence_return', 'image_threshold', 'image_batch_size',
            'image_confidence_return', 'concurrent_task_limit', 'server_timeout',
            'vlm_base_tag_name', 'vlm_tagme_tag_name', 'vlm_updateme_tag_name',
            'vlm_tagged_tag_name', 'vlm_errored_tag_name', 'vlm_incorrect_tag_name',
            'temp_image_dir', 'output_data_dir', 'delete_incorrect_markers',
            'create_markers', 'path_mutation'
        ]
        
        for attr in required_attrs:
            self.assertTrue(hasattr(config, attr), f"Missing attribute: {attr}")

    def test_global_config_values(self):
        """Test that the global config has expected default values"""
        config = haven_vlm_config.config
        
        self.assertEqual(config.video_frame_interval, haven_vlm_config.VIDEO_FRAME_INTERVAL)
        self.assertEqual(config.video_threshold, haven_vlm_config.VIDEO_THRESHOLD)
        self.assertEqual(config.image_threshold, haven_vlm_config.IMAGE_THRESHOLD)
        self.assertEqual(config.concurrent_task_limit, haven_vlm_config.CONCURRENT_TASK_LIMIT)
        self.assertEqual(config.vlm_base_tag_name, haven_vlm_config.VLM_BASE_TAG_NAME)
        self.assertEqual(config.temp_image_dir, haven_vlm_config.TEMP_IMAGE_DIR)


if __name__ == '__main__':
    unittest.main() 