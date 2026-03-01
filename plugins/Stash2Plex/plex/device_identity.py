"""
Device identity management for persistent Plex device recognition.

This module ensures Stash2Plex appears as a consistent, named device in Plex
rather than generating "new device" notifications on each connection.

The issue: plexapi defaults to using a MAC-address-derived UUID which can
change between runs, causing Plex to show "new device connected" notifications
and cluttering the Plex devices list.

The fix: Generate a UUID once, persist it to disk, and configure plexapi
to use this persistent identifier along with friendly device names.

CRITICAL: configure_plex_device_identity() MUST be called before any
PlexServer connections are created, as plexapi captures the identifier
values when building connection headers.
"""

import json
import logging
import os
import uuid

logger = logging.getLogger('Stash2Plex.device')


def load_or_create_device_id(data_dir: str) -> str:
    """
    Load persistent device ID or create a new one.

    The device ID ensures Plex recognizes Stash2Plex as the same device
    across restarts, avoiding "new device" notifications.

    Args:
        data_dir: Path to plugin data directory for persisting device_id.json

    Returns:
        Device ID string (UUID format)
    """
    # Ensure data directory exists
    os.makedirs(data_dir, exist_ok=True)

    id_file = os.path.join(data_dir, 'device_id.json')

    # Try to load existing device ID
    if os.path.exists(id_file):
        try:
            with open(id_file, 'r') as f:
                data = json.load(f)
                device_id = data.get('device_id')
                if device_id:
                    logger.debug(f"Loaded existing device ID: {device_id[:8]}...")
                    return device_id
        except (json.JSONDecodeError, KeyError, IOError) as e:
            logger.warning(f"Corrupt device_id.json, regenerating: {e}")

    # Generate new UUID v4 (random, good for device IDs)
    device_id = str(uuid.uuid4())
    logger.info(f"Generated new device ID: {device_id[:8]}...")

    # Persist for future use
    with open(id_file, 'w') as f:
        json.dump({'device_id': device_id}, f, indent=2)

    return device_id


def configure_plex_device_identity(data_dir: str) -> str:
    """
    Configure plexapi module-level variables for device identification.

    This sets:
    - X_PLEX_IDENTIFIER: Persistent UUID for device recognition
    - X_PLEX_PRODUCT: Product name shown in Plex UI
    - X_PLEX_DEVICE_NAME: Device name shown in Plex UI

    MUST be called before any PlexServer connections are created.
    The plexapi module captures these values when building connection
    headers, so changing them after connection has no effect.

    Args:
        data_dir: Path to plugin data directory for device_id.json

    Returns:
        The device ID being used
    """
    device_id = load_or_create_device_id(data_dir)

    # Import plexapi at call time to avoid import order issues
    import plexapi
    import plexapi.config

    # Set module-level variables (affects all future connections)
    plexapi.X_PLEX_IDENTIFIER = device_id
    plexapi.X_PLEX_PRODUCT = 'Stash2Plex'
    plexapi.X_PLEX_DEVICE_NAME = 'Stash2Plex Plugin'

    # Rebuild BASE_HEADERS to pick up new values
    plexapi.BASE_HEADERS = plexapi.config.reset_base_headers()

    logger.debug(f"Configured Plex device identity: {device_id[:8]}...")

    return device_id
