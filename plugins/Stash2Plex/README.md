# Stash2Plex

Sync metadata from Stash to Plex with queue-based reliability.

[![Tests](https://img.shields.io/badge/tests-500%2B-brightgreen)](tests/)
[![Coverage](https://img.shields.io/badge/coverage-%3E80%25-brightgreen)](pytest.ini)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)

## Overview

Stash2Plex is a Stash plugin that automatically syncs scene metadata from Stash to Plex. When you update a scene in Stash (title, studio, performers, tags), Stash2Plex queues the change and syncs it to the matching item in your Plex library.

**Key features:**

- **Persistent queue** - Jobs survive Stash restarts; nothing is lost if Stash crashes
- **Automatic retry** - Failed syncs retry with exponential backoff
- **Circuit breaker** - Protects Plex from being hammered when it's down
- **Crash recovery** - In-progress jobs automatically resume after restart
- **Performance caching** - Reduces Plex API calls with disk-backed caching
- **Selective sync** - Toggle which metadata fields sync to Plex
- **Sync statistics** - Track success rates and timing with batch summaries
- **Batch processing** - Scene data fetched in single queries for large syncs (v1.1.4)
- **Dynamic timeouts** - Processing timeout scales with queue size (v1.1.3)

**Use Stash2Plex if you:**

- Organize your media metadata in Stash
- Want Plex to reflect the same titles, studios, performers, and tags
- Need reliable syncing that handles network issues gracefully

## Quick Start

**Prerequisites:**

- Stash running with [PythonDepManager](https://github.com/stashapp/CommunityScripts/tree/main/plugins/PythonDepManager) plugin installed
- Plex Media Server running and accessible from Stash
- Your Plex authentication token

### Get Your Plex Token

1. Open Plex Web App and sign in
2. Open any item in your library
3. Click the three-dot menu and select "Get Info"
4. Click "View XML"
5. In the URL bar, find `X-Plex-Token=YOUR_TOKEN_HERE`

Alternatively, see [Plex's official guide](https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/).

### Installation

1. **Download Stash2Plex** to your Stash plugins directory:

   ```bash
   cd ~/.stash/plugins
   git clone https://github.com/trek-e/Stash2Plex.git
   ```

   Or download and extract the ZIP from the [releases page](https://github.com/trek-e/Stash2Plex/releases).

2. **Reload plugins** in Stash:

   Settings > Plugins > Reload Plugins

3. **Configure required settings** in Stash:

   Settings > Plugins > Stash2Plex

   | Setting | Value |
   |---------|-------|
   | Plex URL | `http://localhost:32400` (or your Plex server address) |
   | Plex Token | Your X-Plex-Token from above |
   | Plex Library | Name of your Plex library (e.g., `Movies`) |

4. **Test the sync:**

   - Edit any scene in Stash (change the title slightly)
   - Check Plex within 30 seconds - the title should update

That's it! Stash2Plex is now syncing metadata from Stash to Plex.

## How It Works

1. **Hook triggers** - When you update a scene in Stash, Stash2Plex receives a hook event
2. **Job queued** - The sync job is saved to a SQLite-backed persistent queue
3. **Worker syncs** - Background worker matches the scene to Plex and applies metadata
4. **Retry on failure** - If Plex is down, the job retries with exponential backoff
5. **Dead letter queue** - Permanently failed jobs (e.g., no Plex match) go to a DLQ for review

## Documentation

- [Installation Guide](docs/install.md) - Full setup instructions including Docker
- [Configuration Reference](docs/config.md) - All settings explained
- [Troubleshooting](docs/troubleshoot.md) - Common issues and solutions
- [Architecture](docs/ARCHITECTURE.md) - System design and data flow
- [Changelog](CHANGELOG.md) - Version history

## Requirements

- **Stash** - Any recent version
- **Plex Media Server** - Any recent version
- **PythonDepManager** - Stash plugin for managing Python dependencies
- **Python dependencies** - Installed automatically by PythonDepManager:
  - `plexapi` - Plex API client
  - `pydantic` - Data validation
  - `tenacity` - Retry logic
  - `persistqueue` - SQLite-backed queue
  - `diskcache` - Performance caching

## Settings Reference

### Core Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `plex_url` | string | - | Plex server URL (required) |
| `plex_token` | string | - | Plex authentication token (required) |
| `plex_library` | string | - | Plex library name (recommended) |
| `enabled` | boolean | `true` | Enable/disable the plugin |

### Behavior Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `max_retries` | number | `5` | Max retry attempts before DLQ |
| `poll_interval` | number | `30` | Seconds between queue polls |
| `strict_matching` | boolean | `true` | Skip sync when multiple matches found |
| `preserve_plex_edits` | boolean | `false` | Don't overwrite existing Plex values |
| `connect_timeout` | number | `5` | Plex connection timeout (seconds) |
| `read_timeout` | number | `30` | Plex read timeout (seconds) |

### Field Sync Toggles

Control which metadata fields sync from Stash to Plex. All enabled by default.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `sync_master` | boolean | `true` | Master toggle - when OFF, no fields sync |
| `sync_studio` | boolean | `true` | Sync studio name |
| `sync_summary` | boolean | `true` | Sync summary/details |
| `sync_tagline` | boolean | `true` | Sync tagline |
| `sync_date` | boolean | `true` | Sync release date |
| `sync_performers` | boolean | `true` | Sync performers as actors |
| `sync_tags` | boolean | `true` | Sync tags as genres |
| `sync_poster` | boolean | `true` | Sync poster image |
| `sync_background` | boolean | `true` | Sync background/fanart image |
| `sync_collection` | boolean | `true` | Add to collection by studio name |

See [Configuration Reference](docs/config.md) for detailed documentation of all settings.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).
