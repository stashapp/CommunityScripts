"""
Unit tests for haven_vlm_utility module
"""

import unittest
import tempfile
import os
import shutil
import time
from unittest.mock import patch, mock_open, MagicMock
import yaml

import haven_vlm_utility


class TestPathMutations(unittest.TestCase):
    """Test cases for path mutation functions"""

    def test_apply_path_mutations_with_mutations(self):
        """Test applying path mutations with valid mutations"""
        mutations = {"E:": "F:", "G:": "D:"}
        path = "E:\\videos\\test.mp4"
        
        result = haven_vlm_utility.apply_path_mutations(path, mutations)
        
        self.assertEqual(result, "F:\\videos\\test.mp4")

    def test_apply_path_mutations_without_mutations(self):
        """Test applying path mutations with empty mutations"""
        mutations = {}
        path = "E:\\videos\\test.mp4"
        
        result = haven_vlm_utility.apply_path_mutations(path, mutations)
        
        self.assertEqual(result, path)

    def test_apply_path_mutations_with_none_mutations(self):
        """Test applying path mutations with None mutations"""
        mutations = None
        path = "E:\\videos\\test.mp4"
        
        result = haven_vlm_utility.apply_path_mutations(path, mutations)
        
        self.assertEqual(result, path)

    def test_apply_path_mutations_no_match(self):
        """Test applying path mutations when no mutation matches"""
        mutations = {"E:": "F:", "G:": "D:"}
        path = "C:\\videos\\test.mp4"
        
        result = haven_vlm_utility.apply_path_mutations(path, mutations)
        
        self.assertEqual(result, path)

    def test_apply_path_mutations_multiple_matches(self):
        """Test applying path mutations with multiple possible matches"""
        mutations = {"E:": "F:", "E:\\videos": "F:\\movies"}
        path = "E:\\videos\\test.mp4"
        
        result = haven_vlm_utility.apply_path_mutations(path, mutations)
        
        # Should use the first match
        self.assertEqual(result, "F:\\videos\\test.mp4")


class TestDirectoryOperations(unittest.TestCase):
    """Test cases for directory operations"""

    def test_ensure_directory_exists_new_directory(self):
        """Test creating a new directory"""
        with tempfile.TemporaryDirectory() as temp_dir:
            new_dir = os.path.join(temp_dir, "test_subdir")
            
            haven_vlm_utility.ensure_directory_exists(new_dir)
            
            self.assertTrue(os.path.exists(new_dir))
            self.assertTrue(os.path.isdir(new_dir))

    def test_ensure_directory_exists_existing_directory(self):
        """Test ensuring directory exists when it already exists"""
        with tempfile.TemporaryDirectory() as temp_dir:
            haven_vlm_utility.ensure_directory_exists(temp_dir)
            
            self.assertTrue(os.path.exists(temp_dir))
            self.assertTrue(os.path.isdir(temp_dir))

    def test_ensure_directory_exists_nested_directories(self):
        """Test creating nested directories"""
        with tempfile.TemporaryDirectory() as temp_dir:
            nested_dir = os.path.join(temp_dir, "level1", "level2", "level3")
            
            haven_vlm_utility.ensure_directory_exists(nested_dir)
            
            self.assertTrue(os.path.exists(nested_dir))
            self.assertTrue(os.path.isdir(nested_dir))


class TestSafeFileOperations(unittest.TestCase):
    """Test cases for safe file operations"""

    def test_safe_file_operation_success(self):
        """Test successful file operation"""
        def test_func(a, b, c=10):
            return a + b + c
        
        result = haven_vlm_utility.safe_file_operation(test_func, 1, 2, c=5)
        
        self.assertEqual(result, 8)

    def test_safe_file_operation_os_error(self):
        """Test file operation with OSError"""
        def test_func():
            raise OSError("File not found")
        
        result = haven_vlm_utility.safe_file_operation(test_func)
        
        self.assertIsNone(result)

    def test_safe_file_operation_io_error(self):
        """Test file operation with IOError"""
        def test_func():
            raise IOError("Permission denied")
        
        result = haven_vlm_utility.safe_file_operation(test_func)
        
        self.assertIsNone(result)

    def test_safe_file_operation_unexpected_error(self):
        """Test file operation with unexpected error"""
        def test_func():
            raise ValueError("Unexpected error")
        
        result = haven_vlm_utility.safe_file_operation(test_func)
        
        self.assertIsNone(result)


class TestYamlConfigOperations(unittest.TestCase):
    """Test cases for YAML configuration operations"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_config = {
            "video_frame_interval": 2.0,
            "video_threshold": 0.3,
            "image_threshold": 0.5,
            "endpoints": [
                {"url": "http://localhost:1234", "weight": 5},
                {"url": "https://cloud.example.com", "weight": 1}
            ]
        }

    def test_load_yaml_config_success(self):
        """Test successfully loading YAML configuration"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
            yaml.dump(self.test_config, f)
            config_path = f.name

        try:
            result = haven_vlm_utility.load_yaml_config(config_path)
            
            self.assertEqual(result, self.test_config)
        finally:
            os.unlink(config_path)

    def test_load_yaml_config_file_not_found(self):
        """Test loading YAML configuration from nonexistent file"""
        result = haven_vlm_utility.load_yaml_config("nonexistent_file.yml")
        
        self.assertIsNone(result)

    def test_load_yaml_config_invalid_yaml(self):
        """Test loading YAML configuration with invalid YAML"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
            f.write("invalid: yaml: content: [")
            config_path = f.name

        try:
            result = haven_vlm_utility.load_yaml_config(config_path)
            
            self.assertIsNone(result)
        finally:
            os.unlink(config_path)

    def test_load_yaml_config_permission_error(self):
        """Test loading YAML configuration with permission error"""
        with patch('builtins.open', side_effect=PermissionError("Permission denied")):
            result = haven_vlm_utility.load_yaml_config("test.yml")
            
            self.assertIsNone(result)

    def test_save_yaml_config_success(self):
        """Test successfully saving YAML configuration"""
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, "test_config.yml")
            
            result = haven_vlm_utility.save_yaml_config(self.test_config, config_path)
            
            self.assertTrue(result)
            self.assertTrue(os.path.exists(config_path))
            
            # Verify the saved content
            with open(config_path, 'r') as f:
                loaded_config = yaml.safe_load(f)
            
            self.assertEqual(loaded_config, self.test_config)

    def test_save_yaml_config_with_nested_directories(self):
        """Test saving YAML configuration to nested directory"""
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, "nested", "dir", "test_config.yml")
            
            result = haven_vlm_utility.save_yaml_config(self.test_config, config_path)
            
            self.assertTrue(result)
            self.assertTrue(os.path.exists(config_path))

    def test_save_yaml_config_permission_error(self):
        """Test saving YAML configuration with permission error"""
        with patch('builtins.open', side_effect=PermissionError("Permission denied")):
            result = haven_vlm_utility.save_yaml_config(self.test_config, "test.yml")
            
            self.assertFalse(result)


class TestFileValidation(unittest.TestCase):
    """Test cases for file validation functions"""

    def test_validate_file_path_existing_file(self):
        """Test validating an existing file path"""
        with tempfile.NamedTemporaryFile(delete=False) as f:
            file_path = f.name

        try:
            result = haven_vlm_utility.validate_file_path(file_path)
            self.assertTrue(result)
        finally:
            os.unlink(file_path)

    def test_validate_file_path_nonexistent_file(self):
        """Test validating a nonexistent file path"""
        result = haven_vlm_utility.validate_file_path("nonexistent_file.txt")
        self.assertFalse(result)

    def test_validate_file_path_directory(self):
        """Test validating a directory path"""
        with tempfile.TemporaryDirectory() as temp_dir:
            result = haven_vlm_utility.validate_file_path(temp_dir)
            self.assertFalse(result)

    def test_validate_file_path_permission_error(self):
        """Test validating file path with permission error"""
        with patch('os.path.isfile', side_effect=OSError("Permission denied")):
            result = haven_vlm_utility.validate_file_path("test.txt")
            self.assertFalse(result)


class TestFileExtensionFunctions(unittest.TestCase):
    """Test cases for file extension functions"""

    def test_get_file_extension_with_extension(self):
        """Test getting file extension from file with extension"""
        result = haven_vlm_utility.get_file_extension("test.mp4")
        self.assertEqual(result, ".mp4")

    def test_get_file_extension_without_extension(self):
        """Test getting file extension from file without extension"""
        result = haven_vlm_utility.get_file_extension("test")
        self.assertEqual(result, "")

    def test_get_file_extension_multiple_dots(self):
        """Test getting file extension from file with multiple dots"""
        result = haven_vlm_utility.get_file_extension("test.backup.mp4")
        self.assertEqual(result, ".mp4")

    def test_get_file_extension_uppercase(self):
        """Test getting file extension from file with uppercase extension"""
        result = haven_vlm_utility.get_file_extension("test.MP4")
        self.assertEqual(result, ".mp4")

    def test_is_video_file_valid_extensions(self):
        """Test video file detection with valid extensions"""
        video_files = ["test.mp4", "test.avi", "test.mkv", "test.mov", "test.wmv", "test.flv", "test.webm", "test.m4v"]
        
        for video_file in video_files:
            result = haven_vlm_utility.is_video_file(video_file)
            self.assertTrue(result, f"Failed for {video_file}")

    def test_is_video_file_invalid_extensions(self):
        """Test video file detection with invalid extensions"""
        non_video_files = ["test.jpg", "test.txt", "test.pdf", "test.exe"]
        
        for non_video_file in non_video_files:
            result = haven_vlm_utility.is_video_file(non_video_file)
            self.assertFalse(result, f"Failed for {non_video_file}")

    def test_is_image_file_valid_extensions(self):
        """Test image file detection with valid extensions"""
        image_files = ["test.jpg", "test.jpeg", "test.png", "test.gif", "test.bmp", "test.tiff", "test.webp"]
        
        for image_file in image_files:
            result = haven_vlm_utility.is_image_file(image_file)
            self.assertTrue(result, f"Failed for {image_file}")

    def test_is_image_file_invalid_extensions(self):
        """Test image file detection with invalid extensions"""
        non_image_files = ["test.mp4", "test.txt", "test.pdf", "test.exe"]
        
        for non_image_file in non_image_files:
            result = haven_vlm_utility.is_image_file(non_image_file)
            self.assertFalse(result, f"Failed for {non_image_file}")


class TestFormattingFunctions(unittest.TestCase):
    """Test cases for formatting functions"""

    def test_format_duration_seconds(self):
        """Test formatting duration in seconds"""
        result = haven_vlm_utility.format_duration(45.5)
        self.assertEqual(result, "45.5s")

    def test_format_duration_minutes(self):
        """Test formatting duration in minutes"""
        result = haven_vlm_utility.format_duration(125.3)
        self.assertEqual(result, "2m 5.3s")

    def test_format_duration_hours(self):
        """Test formatting duration in hours"""
        result = haven_vlm_utility.format_duration(7325.7)
        self.assertEqual(result, "2h 2m 5.7s")

    def test_format_duration_zero(self):
        """Test formatting zero duration"""
        result = haven_vlm_utility.format_duration(0)
        self.assertEqual(result, "0.0s")

    def test_format_file_size_bytes(self):
        """Test formatting file size in bytes"""
        result = haven_vlm_utility.format_file_size(512)
        self.assertEqual(result, "512.0 B")

    def test_format_file_size_kilobytes(self):
        """Test formatting file size in kilobytes"""
        result = haven_vlm_utility.format_file_size(1536)
        self.assertEqual(result, "1.5 KB")

    def test_format_file_size_megabytes(self):
        """Test formatting file size in megabytes"""
        result = haven_vlm_utility.format_file_size(1572864)
        self.assertEqual(result, "1.5 MB")

    def test_format_file_size_gigabytes(self):
        """Test formatting file size in gigabytes"""
        result = haven_vlm_utility.format_file_size(1610612736)
        self.assertEqual(result, "1.5 GB")

    def test_format_file_size_zero(self):
        """Test formatting zero file size"""
        result = haven_vlm_utility.format_file_size(0)
        self.assertEqual(result, "0.0 B")


class TestSanitizationFunctions(unittest.TestCase):
    """Test cases for sanitization functions"""

    def test_sanitize_filename_valid(self):
        """Test sanitizing a valid filename"""
        result = haven_vlm_utility.sanitize_filename("valid_filename.txt")
        self.assertEqual(result, "valid_filename.txt")

    def test_sanitize_filename_invalid_chars(self):
        """Test sanitizing filename with invalid characters"""
        result = haven_vlm_utility.sanitize_filename("file<name>:with/invalid\\chars|?*")
        self.assertEqual(result, "file_name__with_invalid_chars___")

    def test_sanitize_filename_leading_trailing_spaces(self):
        """Test sanitizing filename with leading/trailing spaces"""
        result = haven_vlm_utility.sanitize_filename("  filename.txt  ")
        self.assertEqual(result, "filename.txt")

    def test_sanitize_filename_leading_trailing_dots(self):
        """Test sanitizing filename with leading/trailing dots"""
        result = haven_vlm_utility.sanitize_filename("...filename.txt...")
        self.assertEqual(result, "filename.txt")

    def test_sanitize_filename_empty(self):
        """Test sanitizing empty filename"""
        result = haven_vlm_utility.sanitize_filename("")
        self.assertEqual(result, "unnamed")

    def test_sanitize_filename_only_spaces(self):
        """Test sanitizing filename with only spaces"""
        result = haven_vlm_utility.sanitize_filename("   ")
        self.assertEqual(result, "unnamed")


class TestBackupFunctions(unittest.TestCase):
    """Test cases for backup functions"""

    def test_create_backup_file_success(self):
        """Test successfully creating a backup file"""
        with tempfile.NamedTemporaryFile(delete=False) as f:
            original_file = f.name
            f.write(b"test content")

        try:
            result = haven_vlm_utility.create_backup_file(original_file)
            
            self.assertIsNotNone(result)
            self.assertTrue(os.path.exists(result))
            self.assertTrue(result.endswith(".backup"))
            
            # Verify backup content
            with open(result, 'rb') as f:
                content = f.read()
            self.assertEqual(content, b"test content")
            
            # Clean up backup
            os.unlink(result)
        finally:
            os.unlink(original_file)

    def test_create_backup_file_custom_suffix(self):
        """Test creating backup file with custom suffix"""
        with tempfile.NamedTemporaryFile(delete=False) as f:
            original_file = f.name
            f.write(b"test content")

        try:
            result = haven_vlm_utility.create_backup_file(original_file, ".custom")
            
            self.assertIsNotNone(result)
            self.assertTrue(result.endswith(".custom"))
            
            # Clean up backup
            os.unlink(result)
        finally:
            os.unlink(original_file)

    def test_create_backup_file_nonexistent(self):
        """Test creating backup of nonexistent file"""
        result = haven_vlm_utility.create_backup_file("nonexistent_file.txt")
        self.assertIsNone(result)

    def test_create_backup_file_permission_error(self):
        """Test creating backup file with permission error"""
        with patch('shutil.copy2', side_effect=PermissionError("Permission denied")):
            with tempfile.NamedTemporaryFile(delete=False) as f:
                original_file = f.name

            try:
                result = haven_vlm_utility.create_backup_file(original_file)
                self.assertIsNone(result)
            finally:
                os.unlink(original_file)


class TestDictionaryOperations(unittest.TestCase):
    """Test cases for dictionary operations"""

    def test_merge_dictionaries_simple(self):
        """Test simple dictionary merging"""
        dict1 = {"a": 1, "b": 2}
        dict2 = {"c": 3, "d": 4}
        
        result = haven_vlm_utility.merge_dictionaries(dict1, dict2)
        
        expected = {"a": 1, "b": 2, "c": 3, "d": 4}
        self.assertEqual(result, expected)

    def test_merge_dictionaries_overwrite(self):
        """Test dictionary merging with overwrite"""
        dict1 = {"a": 1, "b": 2}
        dict2 = {"b": 3, "c": 4}
        
        result = haven_vlm_utility.merge_dictionaries(dict1, dict2, overwrite=True)
        
        expected = {"a": 1, "b": 3, "c": 4}
        self.assertEqual(result, expected)

    def test_merge_dictionaries_no_overwrite(self):
        """Test dictionary merging without overwrite"""
        dict1 = {"a": 1, "b": 2}
        dict2 = {"b": 3, "c": 4}
        
        result = haven_vlm_utility.merge_dictionaries(dict1, dict2, overwrite=False)
        
        expected = {"a": 1, "b": 2, "c": 4}
        self.assertEqual(result, expected)

    def test_merge_dictionaries_nested(self):
        """Test merging nested dictionaries"""
        dict1 = {"a": 1, "b": {"x": 10, "y": 20}}
        dict2 = {"c": 3, "b": {"y": 25, "z": 30}}
        
        result = haven_vlm_utility.merge_dictionaries(dict1, dict2, overwrite=True)
        
        expected = {"a": 1, "b": {"x": 10, "y": 25, "z": 30}, "c": 3}
        self.assertEqual(result, expected)

    def test_merge_dictionaries_empty(self):
        """Test merging with empty dictionaries"""
        dict1 = {}
        dict2 = {"a": 1, "b": 2}
        
        result = haven_vlm_utility.merge_dictionaries(dict1, dict2)
        
        self.assertEqual(result, dict2)


class TestListOperations(unittest.TestCase):
    """Test cases for list operations"""

    def test_chunk_list_even_chunks(self):
        """Test chunking list into even chunks"""
        lst = [1, 2, 3, 4, 5, 6]
        result = haven_vlm_utility.chunk_list(lst, 2)
        
        expected = [[1, 2], [3, 4], [5, 6]]
        self.assertEqual(result, expected)

    def test_chunk_list_uneven_chunks(self):
        """Test chunking list into uneven chunks"""
        lst = [1, 2, 3, 4, 5]
        result = haven_vlm_utility.chunk_list(lst, 2)
        
        expected = [[1, 2], [3, 4], [5]]
        self.assertEqual(result, expected)

    def test_chunk_list_empty_list(self):
        """Test chunking empty list"""
        lst = []
        result = haven_vlm_utility.chunk_list(lst, 3)
        
        expected = []
        self.assertEqual(result, expected)

    def test_chunk_list_chunk_size_larger_than_list(self):
        """Test chunking when chunk size is larger than list"""
        lst = [1, 2, 3]
        result = haven_vlm_utility.chunk_list(lst, 5)
        
        expected = [[1, 2, 3]]
        self.assertEqual(result, expected)


class TestRetryOperations(unittest.TestCase):
    """Test cases for retry operations"""

    def test_retry_operation_success_first_try(self):
        """Test retry operation that succeeds on first try"""
        def test_func():
            return "success"
        
        result = haven_vlm_utility.retry_operation(test_func)
        
        self.assertEqual(result, "success")

    def test_retry_operation_success_after_retries(self):
        """Test retry operation that succeeds after some retries"""
        call_count = 0
        
        def test_func():
            nonlocal call_count
            call_count += 1
            if call_count < 3:
                raise ValueError("Temporary error")
            return "success"
        
        result = haven_vlm_utility.retry_operation(test_func, max_retries=3, delay=0.1)
        
        self.assertEqual(result, "success")
        self.assertEqual(call_count, 3)

    def test_retry_operation_all_retries_fail(self):
        """Test retry operation that fails all retries"""
        def test_func():
            raise ValueError("Persistent error")
        
        result = haven_vlm_utility.retry_operation(test_func, max_retries=2, delay=0.1)
        
        self.assertIsNone(result)

    def test_retry_operation_with_arguments(self):
        """Test retry operation with function arguments"""
        def test_func(a, b, c=10):
            return a + b + c
        
        result = haven_vlm_utility.retry_operation(test_func, max_retries=1, delay=0.1, 1, 2, c=5)
        
        self.assertEqual(result, 8)

    def test_retry_operation_with_keyword_arguments(self):
        """Test retry operation with keyword arguments"""
        def test_func(**kwargs):
            return kwargs.get('value', 0)
        
        result = haven_vlm_utility.retry_operation(test_func, max_retries=1, delay=0.1, value=42)
        
        self.assertEqual(result, 42)


if __name__ == '__main__':
    unittest.main() 