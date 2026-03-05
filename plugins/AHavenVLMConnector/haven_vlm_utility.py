"""
Haven VLM Utility Module
Utility functions for the A Haven VLM Connector plugin
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import yaml

logger = logging.getLogger(__name__)

def apply_path_mutations(path: str, mutations: Dict[str, str]) -> str:
    """
    Apply path mutations for different environments
    
    Args:
        path: Original file path
        mutations: Dictionary of path mutations (e.g., {"E:": "F:", "G:": "D:"})
    
    Returns:
        Mutated path string
    """
    if not mutations:
        return path
    
    mutated_path = path
    for old_path, new_path in mutations.items():
        if mutated_path.startswith(old_path):
            mutated_path = mutated_path.replace(old_path, new_path, 1)
            break

    return mutated_path

def ensure_directory_exists(directory_path: str) -> None:
    """
    Ensure a directory exists, creating it if necessary
    
    Args:
        directory_path: Path to the directory
    """
    Path(directory_path).mkdir(parents=True, exist_ok=True)

def safe_file_operation(operation_func, *args, **kwargs) -> Optional[Any]:
    """
    Safely execute a file operation with error handling
    
    Args:
        operation_func: Function to execute
        *args: Arguments for the function
        **kwargs: Keyword arguments for the function
    
    Returns:
        Result of the operation or None if failed
    """
    try:
        return operation_func(*args, **kwargs)
    except (OSError, IOError) as e:
        logger.error(f"File operation failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error in file operation: {e}")
        return None

def load_yaml_config(config_path: str) -> Optional[Dict[str, Any]]:
    """
    Load configuration from YAML file
    
    Args:
        config_path: Path to the YAML configuration file
    
    Returns:
        Configuration dictionary or None if failed
    """
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
        logger.info(f"Configuration loaded from {config_path}")
        return config
    except FileNotFoundError:
        logger.warning(f"Configuration file not found: {config_path}")
        return None
    except yaml.YAMLError as e:
        logger.error(f"Error parsing YAML configuration: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error loading configuration: {e}")
        return None

def save_yaml_config(config: Dict[str, Any], config_path: str) -> bool:
    """
    Save configuration to YAML file
    
    Args:
        config: Configuration dictionary
        config_path: Path to save the configuration file
    
    Returns:
        True if successful, False otherwise
    """
    try:
        ensure_directory_exists(os.path.dirname(config_path))
        with open(config_path, 'w', encoding='utf-8') as f:
            yaml.dump(config, f, default_flow_style=False, indent=2)
        logger.info(f"Configuration saved to {config_path}")
        return True
    except Exception as e:
        logger.error(f"Error saving configuration: {e}")
        return False

def validate_file_path(file_path: str) -> bool:
    """
    Validate if a file path exists and is accessible
    
    Args:
        file_path: Path to validate
    
    Returns:
        True if file exists and is accessible, False otherwise
    """
    try:
        return os.path.isfile(file_path) and os.access(file_path, os.R_OK)
    except Exception:
        return False

def get_file_extension(file_path: str) -> str:
    """
    Get the file extension from a file path
    
    Args:
        file_path: Path to the file
    
    Returns:
        File extension (including the dot)
    """
    return Path(file_path).suffix.lower()

def is_video_file(file_path: str) -> bool:
    """
    Check if a file is a video file based on its extension
    
    Args:
        file_path: Path to the file
    
    Returns:
        True if it's a video file, False otherwise
    """
    video_extensions = {'.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'}
    return get_file_extension(file_path) in video_extensions

def is_image_file(file_path: str) -> bool:
    """
    Check if a file is an image file based on its extension
    
    Args:
        file_path: Path to the file
    
    Returns:
        True if it's an image file, False otherwise
    """
    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'}
    return get_file_extension(file_path) in image_extensions

def format_duration(seconds: float) -> str:
    """
    Format duration in seconds to human-readable string
    
    Args:
        seconds: Duration in seconds
    
    Returns:
        Formatted duration string (e.g., "1h 23m 45s")
    """
    if seconds < 60:
        return f"{seconds:.1f}s"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        remaining_seconds = seconds % 60
        return f"{minutes}m {remaining_seconds:.1f}s"
    else:
        hours = int(seconds // 3600)
        remaining_minutes = int((seconds % 3600) // 60)
        remaining_seconds = seconds % 60
        return f"{hours}h {remaining_minutes}m {remaining_seconds:.1f}s"

def format_file_size(bytes_size: int) -> str:
    """
    Format file size in bytes to human-readable string
    
    Args:
        bytes_size: Size in bytes
    
    Returns:
        Formatted size string (e.g., "1.5 MB")
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} PB"

def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename by removing or replacing invalid characters
    
    Args:
        filename: Original filename
    
    Returns:
        Sanitized filename
    """
    # Replace invalid characters with underscores
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    
    # Remove leading/trailing spaces and dots
    filename = filename.strip(' .')
    
    # Ensure filename is not empty
    if not filename:
        filename = "unnamed"
    
    return filename

def create_backup_file(file_path: str, backup_suffix: str = ".backup") -> Optional[str]:
    """
    Create a backup of a file
    
    Args:
        file_path: Path to the file to backup
        backup_suffix: Suffix for the backup file
    
    Returns:
        Path to the backup file or None if failed
    """
    try:
        if not os.path.exists(file_path):
            logger.warning(f"File does not exist: {file_path}")
            return None
        
        backup_path = file_path + backup_suffix
        import shutil
        shutil.copy2(file_path, backup_path)
        logger.info(f"Backup created: {backup_path}")
        return backup_path
    except Exception as e:
        logger.error(f"Failed to create backup: {e}")
        return None

def merge_dictionaries(dict1: Dict[str, Any], dict2: Dict[str, Any], overwrite: bool = True) -> Dict[str, Any]:
    """
    Merge two dictionaries, with option to overwrite existing keys
    
    Args:
        dict1: First dictionary
        dict2: Second dictionary
        overwrite: Whether to overwrite existing keys in dict1
    
    Returns:
        Merged dictionary
    """
    result = dict1.copy()
    
    for key, value in dict2.items():
        if key not in result or overwrite:
            result[key] = value
        elif isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = merge_dictionaries(result[key], value, overwrite)
    
    return result

def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """
    Split a list into chunks of specified size
    
    Args:
        lst: List to chunk
        chunk_size: Size of each chunk
    
    Returns:
        List of chunks
    """
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]

def retry_operation(operation_func, max_retries: int = 3, delay: float = 1.0, *args, **kwargs) -> Optional[Any]:
    """
    Retry an operation with exponential backoff
    
    Args:
        operation_func: Function to retry
        max_retries: Maximum number of retries
        delay: Initial delay between retries
        *args: Arguments for the function
        **kwargs: Keyword arguments for the function
    
    Returns:
        Result of the operation or None if all retries failed
    """
    import time
    
    for attempt in range(max_retries + 1):
        try:
            return operation_func(*args, **kwargs)
        except Exception as e:
            if attempt == max_retries:
                logger.error(f"Operation failed after {max_retries} retries: {e}")
                return None
            
            wait_time = delay * (2 ** attempt)
            logger.warning(f"Operation failed (attempt {attempt + 1}/{max_retries + 1}), retrying in {wait_time}s: {e}")
            time.sleep(wait_time)
    
    return None 