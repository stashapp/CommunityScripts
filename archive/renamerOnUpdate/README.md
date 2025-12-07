# renamerOnUpdate

Rename and move files based on metadata from your Stash library.

## Table of Contents

- [Requirements](#requirements)
- [Upgrading from 2.5.0](#upgrading-from-250)
- [Installation](#installation)
  - [Manual Installation](#manual-installation)
  - [Installation via Plugin Manager](#installation-via-plugin-manager)
- [Usage](#usage)
- [Configuration](#configuration)
- [Custom Configuration File](#custom-configuration-file)
- [Configuration Explained](#configuration-explained)
  - [Templates](#templates)
  - [Filename Templates](#filename-templates)
  - [Path Templates](#path-templates)
  - [Special Variables](#special-variables)
  - [Advanced Features](#advanced-features)
  - [Options](#options)

## Requirements

- Stash (v0.29+)
- uv package manager (installed and available in PATH)

## Upgrading from 2.5.0

Version 3.0.0 introduces significant changes that require attention when upgrading:

### Installing uv

The plugin now uses `uv` to manage Python dependencies and execution. If `uv` is not already installed, install `uv` following the official instructions at https://docs.astral.sh/uv/getting-started/installation/

**Note**: `uv` creates a separate virtual environment for this plugin with the correct Python version and installs all required dependencies. The first execution may take a moment while `uv` sets up the environment, but subsequent executions will be faster.

### Configuration Changes

#### Consolidated Configuration Options

Several configuration options have been consolidated into `replace_words` and `field_replacer` for simplification and consistency:

**Consolidated Options:**

1. **`removecharac_Filename` → `replace_words`**
   - The `removecharac_Filename` option has been removed
   - **Migration**: If you were using `removecharac_Filename = ",#"`, migrate to:
     ```py
     replace_words = {
         r"[,#]": ["", "regex"]
     }
     ```

2. **`prepositions_list` / `prepositions_removal` → `field_replacer` with regex**
   - Preposition removal is now handled via `field_replacer` with regex support
   - **Migration**: If you were using `prepositions_removal = True` with `prepositions_list = ["The", "A", "An"]`, migrate to:
     ```py
     field_replacer = {
         "$title": {"regex": "^(A|An|The) ", "with": ""}
     }
     ```

3. **Automatic Apostrophe Normalization → `replace_words`**
   - The automatic normalization of apostrophe/quotation mark characters (`’` `‘` `”` `“` → `'`) has been removed
   - **Migration**: If you relied on automatic apostrophe normalization, add this to your `replace_words` configuration:
     ```py
     replace_words = {
         r"[’‘”“]+": ["'", "regex"]
     }
     ```

4. **Automatic Empty Parenthesis and Bracket Cleanup → `replace_words`**
   - The automatic removal of empty parentheses `()` and brackets `[]` has been removed
   - **Migration**: If you relied on automatic empty bracket/parenthesis removal, add this to your `replace_words` configuration:
     ```py
     replace_words = {
         r"\(\s*\)": ["", "regex"],  # Remove empty parentheses
         r"\[\s*\]": ["", "regex"],  # Remove empty brackets
     }
     ```

**Enhanced `field_replacer`:**
- Now supports regex patterns in addition to simple string replacement
- Format: `{"regex": "pattern", "with": "replacement"}` for regex, or `{"replace": "old", "with": "new"}` for simple replacement

**Benefits:**
- Fewer configuration options to manage
- More powerful and flexible (regex support everywhere)
- Consistent replacement system across the plugin

#### Renamed Configuration Options

**`batch_number_scene` → `batch_size`**
- The `batch_number_scene` option has been renamed to `batch_size` to reflect that it applies to both scenes and galleries
- **Migration**: If you have `batch_number_scene` in your config, rename it to `batch_size`:
  ```py
  # Old (2.5.0)
  batch_number_scene = -1

  # New (3.0.0)
  batch_size = -1
  ```
- The functionality remains the same: `-1` processes all items, a positive number limits the batch size

#### Group Variables Replaced Movie Variables

The plugin has migrated from Stash's movie system to the group system. Update your configuration templates:

- **Old variables** (no longer available):
  - `$move_title` → Use `$group_title` instead
  - `$move_year` → Use `$group_year` instead
  - `$move_scene` → Use `$group_scene` instead

- **New variables**:
  - `$group_title` - The name of the group
  - `$group_year` - The year from the group's date
  - `$group_scene` - The scene index within the group (e.g., "scene 1")
  - `$group_hierarchy` - Creates the entire group hierarchy as folders (e.g., `group_a/group_b/group_c/video.mp4`)

#### Example Migration

**Before (2.5.0):**
```py
tag_templates = {
    "plugin_move": "$date $movie_title - $title"
}
p_tag_templates = {
    "plugin_move": r"E:\Movies\$studio_hierarchy"
}
```

**After (3.0.0):**
```py
tag_templates = {
    "plugin_move": "$date $group_title - $title"
}
p_tag_templates = {
    "plugin_move": r"E:\Movies\$studio_hierarchy\$group_hierarchy"
}
```

#### Improved Group Handling

Group handling has been improved to dynamically detect separators and provide more predictable behavior:

- **Dynamic separator detection**: Separators (spaces, `-`, `_`, etc.) within groups are now automatically detected based on the content between variables, eliminating the need for hard-coded separator lists.

- **Entire group removal**: If **any** variable within a group is missing or empty, the **entire group** is removed. This ensures cleaner output and prevents orphaned separators.

**Example:**
```py
tag_templates = {
    "plugin_move": "{$date - $performer }$title{ [$studio]}"
}
```

- If `$date` is missing: The entire `{$date - $performer }` group is removed (even though `$performer` has a value), resulting in `My Title [Studio Name]`
- If `$performer` is missing: The entire `{$date - $performer }` group is removed (even though `$date` has a value), resulting in `My Title [Studio Name]`
- If `$studio` is missing: The entire `{ [$studio]}` group is removed, resulting in `2024-01-01 - Jane Doe My Title`
- If all variables are present: All groups are kept with their separators preserved, resulting in `2024-01-01 - Jane Doe My Title [Studio Name]`

This behavior ensures that groups are only included when all their variables have values, preventing incomplete or malformed filenames.

### Technical Changes

- **GraphQL Migration**: File operations now use GraphQL mutations instead of direct database manipulation. This provides better reliability and compatibility with Stash's API.
- **Dependency Management**: Dependencies are now managed via `uv` and `pyproject.toml` instead of requiring manual installation.
- **Execution Method**: The plugin is executed via `uv run` instead of calling Python directly.

### Improved Empty Folder Removal

The empty folder removal feature has been enhanced to support recursive removal of empty parent directories:

- **Existing behavior**: The `remove_emptyfolder` option (default: `True`) removes the immediate empty parent directory after moving a file.
- **New enhancement**: The `remove_empty_parent_folders` option (default: `False`) extends this to recursively remove all empty parent directories up to the topmost directory in the path.
- **Topmost directory preservation**: When recursively removing parent folders, the plugin stops at the topmost directory in the path to prevent removing important base directories:
  - For **absolute paths** (e.g., `/tank/stash/library/...`): Stops at `/tank` (the first directory after the root)
  - For **relative paths** (e.g., `library/foo/bar/...`): Stops at `library` (the first directory component)

**Example:**
- If a file is moved from `library/studio/group/video.mp4` to a new location:
  - With `remove_emptyfolder = True` (existing behavior): Removes `group/` if empty
  - With `remove_emptyfolder = True` and `remove_empty_parent_folders = True` (new): Removes `group/` and `studio/` if they become empty, but **preserves** `/tank/stash/library/` (the topmost directory in the path)

This ensures that your base library structure remains intact while cleaning up empty directories created during file organization.

**Configuration Option: `remove_empty_parent_folders`**

- **Default**: `False` (disabled)
- **Type**: Boolean
- **Requires**: `remove_emptyfolder` must be enabled

**Example Configuration:**
```py
remove_empty_parent_folders = True
```

**Configuration Option: `remove_emptyfolder_ignore_items`**

When removing empty folders, you can optionally ignore specific files and folders when determining if a folder is empty. Folders containing only items matching this list will be considered empty and removed. The ignored items will be automatically removed before removing the folder. Works for both files and folders - specify the exact name or use regex patterns to match.

- **Default**: `[]` (empty list - no items are ignored)
- **Type**: List of dicts with `"name"` key for exact matches or `"regex"` key for pattern matches

**Format:**
- Each item in the list must be a dict with either `"name"` key for exact match, or `"regex"` key for pattern match
- **Simple name match**: Uses exact string matching
- **Regex pattern**: Uses regular expressions for pattern matching

**Example Configuration:**
```py
# Simple string matches (files and folders)
remove_emptyfolder_ignore_items = [
    {"name": ".DS_Store"},      # macOS system file
    {"name": "Thumbs.db"},      # Windows thumbnail file
    {"name": ".nfo"},           # Media server metadata file
    {"name": ".actors"}         # Media server actor folder
]

# Regex pattern to match variants
remove_emptyfolder_ignore_items = [{"regex": r"^\.DS_Store.*"}]

# Mix of name and regex patterns
remove_emptyfolder_ignore_items = [
    {"name": ".DS_Store"},
    {"regex": r"^\.nfo$|^\.tbn$"},  # Match .nfo or .tbn files
    {"name": ".actors"}
]
```

When configured, the plugin will automatically remove the ignored items before removing the folder, ensuring clean directory cleanup on systems where these files or folders have been created.

### Rating Configuration Changes

Stash now stores ratings on an integer scale from 1-100, where 100 represents 5 stars. The plugin has been updated to support converting these integer ratings to different display formats.

**New Rating Configuration Options:**

- **`rating_display_mode`**: Controls how the integer rating (1-100) is converted for display
  - `None` or `"integer"`: Use the raw integer value (1-100) - **default behavior**
  - `"stars"`: Convert to star rating (0-5 stars)
  - `"decimal"`: Convert to decimal rating (0.0-5.0)

- **`rating_star_precision`**: Precision for star ratings (only used when `rating_display_mode="stars"`)
  - `"full"`: Whole stars only (0, 1, 2, 3, 4, 5) - **default**
  - `"half"`: Half-star increments (0, 0.5, 1, 1.5, ..., 5)
  - `"quarter"`: Quarter-star increments (0, 0.25, 0.5, 0.75, ..., 5)
  - `"tenth"`: Tenth-star increments (0, 0.1, 0.2, ..., 5)

- **`rating_decimal_places`**: Number of decimal places for decimal mode (only used when `rating_display_mode="decimal"`)
  - Default: `1`

**Examples:**

```py
# Use raw integer values (backward compatible - default)
rating_display_mode = None
rating_format = "{}"
# Result: rating100=100 → "100"

# Convert to full stars
rating_display_mode = "stars"
rating_star_precision = "full"
rating_format = "{}"
# Result: rating100=100 → "5"

# Convert to half stars
rating_display_mode = "stars"
rating_star_precision = "half"
rating_format = "{}-stars"
# Result: rating100=50 → "2.5-stars"

# Convert to decimal
rating_display_mode = "decimal"
rating_decimal_places = 1
rating_format = "{}"
# Result: rating100=100 → "5.0"
```

**Migration Notes:**

- The default behavior (`rating_display_mode = None`) maintains backward compatibility and will display raw integer values (1-100)
- If you want to display star ratings, set `rating_display_mode = "stars"` and choose your preferred precision
- The `rating_format` option continues to work as before, but now wraps the converted rating value instead of the raw integer
- If you were previously expecting star ratings (1-5) but are seeing integer values (1-100), you'll need to configure `rating_display_mode` to convert them

**Note**: The plugin cannot automatically detect Stash's rating display preference, so you must configure the conversion mode that matches how you want ratings displayed in your filenames.

### Platform-Specific Path and Filename Limits

The plugin now uses platform-specific limits for path and filename length validation, as well as platform-specific illegal character detection. By default, the plugin auto-detects the current platform and applies the appropriate limits.

**New Configuration Option: `target_platform`**

The `target_platform` option allows you to override the auto-detection and target a specific platform. This is particularly useful when running on one platform but serving files to clients on a different platform (e.g., Linux Samba server serving Windows clients). When set, the plugin will enforce the limits and restrictions of the target platform, ensuring compatibility even when the files are accessed from a different operating system.

- **Default**: `None` (auto-detect current platform)
- **Options**: `None`, `"windows"`, `"linux"`, `"macos"`, `"freebsd"`

**Platform Limits:**

| Platform | Path Length | Filename Length | Measurement | Illegal Characters | Reserved Names |
|----------|-------------|-----------------|-------------|-------------------|----------------|
| Windows  | 260 chars   | 255 chars       | Characters (UTF-16) | `\ / : " * ? < > \|` | CON, PRN, AUX, NUL, COM1-9, LPT1-9 |
| Linux    | 4096 bytes  | 255 bytes       | Bytes (UTF-8) | `/` | `.`, `..` |
| macOS    | 1024 bytes  | 255 bytes       | Bytes (UTF-8) | `/`, `:` | `.`, `..` |
| FreeBSD  | 4096 bytes  | 255 bytes       | Bytes (UTF-8) | `/` | `.`, `..` |

**Additional Platform-Specific Rules:**

- **Windows**:
  - Reserved device names (CON, PRN, AUX, NUL, COM1-9, LPT1-9) are automatically prefixed with underscore
  - Cannot end with period (.) or space
  - ASCII control characters (0-31) are removed
- **Linux/macOS/FreeBSD**:
  - Special entries (`.` and `..`) are automatically prefixed with underscore
  - ASCII control characters (0-31) are removed

**Use Cases:**

- **Samba Server**: If you're running Stash on Linux but serving files to Windows clients via Samba, set `target_platform = "windows"` to ensure filenames comply with Windows limits.
- **Cross-Platform Compatibility**: When organizing files that will be accessed from multiple platforms, you can target the most restrictive platform (typically Windows) to ensure compatibility.

**Example Configuration:**

```py
# Auto-detect platform (default)
target_platform = None

# Explicitly target Windows (useful for Samba servers)
target_platform = "windows"

# Target Linux (useful when running on macOS but serving to Linux)
target_platform = "linux"

# Target FreeBSD
target_platform = "freebsd"
```

**Note:** The previous hardcoded 240-character path limit has been replaced with platform-specific limits. The plugin will now automatically use the appropriate limits and illegal character sets based on your target platform. This ensures that filenames and paths are properly sanitized for the target filesystem.

### Gallery Support (New in 3.0.0)

Version 3.0.0 introduces **full gallery support** for the first time. The plugin can now rename and move both folder-based and zip file-based galleries, similar to how it handles scenes.

**New Gallery Configuration Options:**

The plugin adds separate template configuration options for galleries, mirroring the scene template system:

**Gallery Filename Templates:**
- `gallery_tag_templates` - Templates based on tags (similar to `tag_templates` for scenes)
- `gallery_studio_templates` - Templates based on studio names (similar to `studio_templates` for scenes)
- `use_default_gallery_template` - Enable default template when no tag/studio match (similar to `use_default_template`)
- `default_gallery_template` - Default template for galleries (similar to `default_template`)

**Gallery Path Templates:**
- `p_gallery_tag_templates` - Path templates based on tags (similar to `p_tag_templates` for scenes)
- `p_gallery_studio_templates` - Path templates based on studio names (similar to `p_studio_templates` for scenes)
- `p_gallery_path_templates` - Path templates based on current path (similar to `p_path_templates` for scenes)
- `p_use_default_gallery_template` - Enable default path template (similar to `p_use_default_template`)
- `p_default_gallery_template` - Default path template for galleries (similar to `p_default_template`)

**Example Configuration:**
```py
# Gallery filename templates
gallery_tag_templates = {
    "plugin_move_local": "{$date }$title{ [$performer]}",
    "plugin_move_local_root": "$title",
}
gallery_studio_templates = {}
use_default_gallery_template = False
default_gallery_template = "$date $title"

# Gallery path templates
p_gallery_tag_templates = {
    "plugin_move_local": r"galleries/$studio_hierarchy",
    "plugin_move_local_root": r"galleries",
}
p_gallery_studio_templates = {}
p_gallery_path_templates = {}
p_use_default_gallery_template = False
p_default_gallery_template = r"^*\$performer"
```

**Gallery Types Supported:**
- **Folder Galleries**: Directory-based galleries containing image files. The entire folder is renamed/moved.
- **Zip Galleries**: Zip file-based galleries. The zip file itself is renamed/moved.

**Note**: Manually created galleries (where users freely assign images to galleries without a folder or zip file) are **not supported**. These galleries have no `folder` property and an empty `files` array. The plugin will log a warning and skip these galleries, as there is no file or folder to rename/move.

**Additional Gallery Configuration Options:**

**`metadata_scan_timeout`** - Timeout in seconds for metadata scan operations when moving folder-based galleries. The plugin uses filesystem operations for folder galleries and then triggers a metadata scan to sync Stash's database.

- **Default**: `60` (seconds)
- **Use Case**: Users with very large libraries may need to increase this value if metadata scans take longer

**Example Configuration:**
```py
# Increase timeout for large libraries
metadata_scan_timeout = 120
```

**Note**: Folder galleries are moved via filesystem operations (instead of GraphQL `moveFiles`) to ensure proper synchronization with Stash's database. The metadata scan ensures that gallery folder references are updated correctly after the move operation.

### Emoji Conversion (New in 3.0.0)

Version 3.0.0 introduces **emoji conversion** support, allowing you to replace emojis in filenames and paths with their textual code representations. This is particularly useful for filesystem compatibility, especially on Windows where emojis can cause issues, or when you prefer text-based emoji codes in your filenames.

**How It Works:**

When enabled, emojis in filenames and paths are automatically converted to their code representations (e.g., 😀 → `:smile:`, ❤️ → `:red_heart:`). The conversion uses the `emoji` package and supports multiple languages for emoji descriptions.

**Configuration Options:**

- **`replace_emoji`** - Enable or disable emoji conversion
  - **Default**: `False` (disabled)
  - **Type**: Boolean

- **`emoji_language_override`** - Override the language used for emoji code descriptions
  - **Default**: `None` (uses Stash's interface language setting)
  - **Type**: String (two-letter ISO language code) or `None`
  - **Supported languages**: `ar` (Arabic), `de` (German), `en` (English), `es` (Spanish), `fa` (Farsi/Persian), `fr` (French), `id` (Indonesian), `it` (Italian), `ja` (Japanese), `ko` (Korean), `pt` (Portuguese), `ru` (Russian), `tr` (Turkish), `zh` (Simplified Chinese)
  - If the language is not supported or not set, it falls back to English

- **`emoji_delimiter`** - Custom delimiter for emoji codes
  - **Default**: `None` (uses default colons, e.g., `:smile:`)
  - **Type**: String or `None`
  - **Use Case**: Useful on Windows where colons (`:`) are invalid path characters. Set to `"_"` or `"-"` to use custom delimiters (e.g., `_smile_` or `-smile-`)

**Example Configuration:**

```py
# Enable emoji conversion
replace_emoji = True

# Use Japanese language for emoji codes
emoji_language_override = "ja"

# Use underscores instead of colons (useful for Windows)
emoji_delimiter = "_"
```

**Example Output:**

- **Input**: `My Video 😀❤️.mp4`
- **With default settings** (`replace_emoji = True`): `My Video :grinning_face::red_heart:.mp4`
- **With custom delimiter** (`emoji_delimiter = "_"`): `My Video _grinning_face__red_heart_.mp4`
- **With Japanese language** (`emoji_language_override = "ja"`): `My Video :にっこり笑う::赤いハート:.mp4`

**Note**: When `emoji_language_override` is `None`, the plugin automatically detects and uses Stash's interface language setting. If the detected language is not supported, it falls back to English.

### What to Add to Your Config File

If you're using a custom `config.py` file (to preserve settings across updates), you may need to add new configuration options. Check the latest `renamerOnUpdate_config.py` template to identify any new settings that should be added to your `config.py`, particularly:

- Group-related variables in templates
- New emoji handling options
- Platform-specific path/filename limits (`target_platform` option)
- Apostrophe normalization via `replace_words` (if needed)
- **Gallery support configuration** (all `gallery_*` and `p_gallery_*` template options)
- Empty folder removal options (`remove_emptyfolder_ignore_items`)
- Gallery metadata scan timeout (`metadata_scan_timeout`)
- **Rating configuration options** (`rating_display_mode`, `rating_star_precision`, `rating_decimal_places`)

## Installation

### Installing uv

The plugin uses `uv` to manage Python dependencies and execution. If `uv` is not already installed, install `uv` following the official instructions at https://docs.astral.sh/uv/getting-started/installation/

**Note**: `uv` creates a separate virtual environment for this plugin with the correct Python version and installs all required dependencies. The first execution may take a moment while `uv` sets up the environment, but subsequent executions will be faster.

### Manual Installation

1. Download the entire `renamerOnUpdate` folder (including all Python files, configuration files, and dependency management files)
2. Place it in your Stash **plugins** folder (where the `config.yml` is located)
3. Reload plugins (Settings > Plugins > Reload)
4. The `renamerOnUpdate` plugin should now appear

> **⚠️ Important**: Before configuring, create a copy of `renamerOnUpdate_config.py` and rename it to `config.py` to preserve your settings across updates. Then edit `config.py` to configure the plugin.

### Installation via Plugin Manager

1. Go to Settings > Plugins
2. Find **Available Plugins** and expand the package called **Community (stable)**
3. Select `renamerOnUpdate` and click **Install**

> **⚠️ Important**: Before configuring, create a copy of `renamerOnUpdate_config.py` and rename it to `config.py` to preserve your settings across updates. Then edit `config.py` to configure the plugin.

## Usage

The plugin automatically renames and moves files/folders when scenes or galleries are updated. An update can be triggered by:

- Saving changes in **Scene Edit** or **Gallery Edit**
- Clicking the **Organized** button
- Running a scan that updates the path

You can also manually trigger renaming for all scenes or galleries:

- Use the **Rename scenes** or **Rename galleries** button in the Task menu
  - This will process each of your scenes or galleries respectively
  - **⚠️ Warning**: It's recommended to understand how this plugin works and use **DryRun** mode first

## Configuration

> **⚠️ Important**: Before editing the configuration, you should create a copy of `renamerOnUpdate_config.py` and rename it to `config.py`. This is because plugin updates will replace `renamerOnUpdate_config.py` with a fresh copy, resetting all your custom settings. The plugin will automatically use `config.py` if it exists (it defaults to `renamerOnUpdate_config.py` if not found).
>
> **Note**: Since the `config.py` file is not tracked by the plugin manager, it won't get updated with new configuration options automatically. You will need to manually compare it with the latest `renamerOnUpdate_config.py` template and add any new options when they become available.

### Basic Configuration

Edit your `config.py` file:

- Change template filename/path
- Add `log_file` path
- Configure various options

### Task Menu Options

There are multiple buttons in the Task menu:

- **Enable**: (default) Enable the automatic rename trigger
- **Disable**: Disable the automatic rename trigger
- **Dry-run**: Toggle dry-run mode on/off
- **Rename scenes**: Process all scenes (or up to `batch_size` if configured)
- **Rename galleries**: Process all galleries (or up to `batch_size` if configured)

**Task Batch Processing:**
- The `batch_size` configuration option controls how many items (scenes or galleries) are processed when using the task menu buttons
- Set to `-1` (default) to process all items
- Set to a positive number to limit processing (e.g., `batch_size = 100` processes up to 100 items)

### Dry-run Mode

Dry-run mode prevents actual file modifications and only shows changes in your log:

- This mode can write changes to a file (`renamerOnUpdate_dryrun.txt`)
- You need to set a path for `log_file` in your config file
- The format will be: `item_id|current path|new path` (e.g., `100|C:\Temp\foo.mp4|C:\Temp\bar.mp4` for scenes, or `3|C:\Galleries\folder|C:\Galleries\new_folder` for galleries)
- The file will be overwritten each time the plugin is triggered (unless `dry_run_append` is set to `True`)

## Configuration Explained

### Templates

To modify your path/filename, you can use **variables**. These are elements that will change based on your **metadata**.

- Variables are represented with a word preceded by a `$` symbol (e.g., `$date`)
- If the metadata exists, the variable will be replaced by its value:
  - Scene date = 2006-01-02, `$date` = 2006-01-02
- You can find the complete list of available variables in `renamerOnUpdate_config.py`

**Available Variables:**
- **Scenes**: All variables including scene-specific ones like `$height`, `$resolution`, `$duration`, `$bitrate`, `$video_codec`, `$audio_codec`, `$group_title`, `$group_year`, `$group_scene`, `$stashid_scene`, `$oshash`, `$phash`, `$md5`
- **Galleries**: Common variables like `$date`, `$date_format`, `$year`, `$performer`, `$title`, `$studio`, `$parent_studio`, `$studio_family`, `$rating`, `$tags`, `$stashid_performer`, `$studio_code`, `$md5` (note: galleries only support `$md5` fingerprint, not `$oshash` or `$phash`)

**Limitations:**
- **Multiple Groups**: When a scene is associated with multiple groups, the plugin only references the first group returned by Stash. The `$group_title`, `$group_year`, `$group_scene`, and `$group_hierarchy` variables will all use data from this first group. The order in which Stash returns groups may vary.

**Example:**
- Path: `C:\Temp\QmlnQnVja0J1bm55.mp4`
- This file is [Big Buck Bunny](https://en.wikipedia.org/wiki/Big_Buck_Bunny)

### Filename Templates

Change your filename (e.g., `C:\Temp\**QmlnQnVja0J1bm55.mp4**`)

**Priority**: Tags > Studios > Default

#### Based on a Tag

```py
tag_templates = {
    "rename_tag": "$year $title - $studio $resolution $video_codec",
    "rename_tag2": "$title"
}
```

| tag | new filename |
|-----|-------------|
| rename_tag | `C:\Temp\2008 Big Buck Bunny - Blender Institute 1080p H264.mp4` |
| rename_tag2 | `C:\Temp\Big Buck Bunny.mp4` |

#### Based on a Studio

```py
studio_templates = {
    "Blender Institute": "$date - $title [$studio]",
    "Pixar": "$title [$studio]"
}
```

| studio | new filename |
|--------|-------------|
| Blender Institute | `C:\Temp\2008-05-20 - Big Buck Bunny [Blender Institute].mp4` |
| Pixar | `C:\Temp\Big Buck Bunny [Pixar].mp4` |

#### Change Filename Regardless of Tags/Studios

```py
use_default_template = True
default_template = "$date $title"
```

The file becomes: `C:\Temp\2008-05-20 Big Buck Bunny.mp4`

### Path Templates

Change your path (e.g., **C:\Temp**\QmlnQnVja0J1bm55.mp4)

#### Based on a Tag

```py
p_tag_templates = {
    "rename_tag": r"D:\Video\",
    "rename_tag2": r"E:\Video\$year"
}
```

| tag | new path |
|-----|----------|
| rename_tag | `D:\Video\QmlnQnVja0J1bm55.mp4` |
| rename_tag2 | `E:\Video\2008\QmlnQnVja0J1bm55.mp4` |

#### Based on a Studio

```py
p_studio_templates = {
    "Blender Institute": r"D:\Video\Blender\",
    "Pixar": r"E:\Video\$studio\"
}
```

| studio | new path |
|--------|----------|
| Blender Institute | `D:\Video\Blender\QmlnQnVja0J1bm55.mp4` |
| Pixar | `E:\Video\Pixar\QmlnQnVja0J1bm55.mp4` |

#### Based on a Path

```py
p_path_templates = {
    r"C:\Temp": r"D:\Video\",
    r"C:\Video": r"E:\Video\Win\"
}
```

| file path | new path |
|-----------|----------|
| `C:\Temp` | `D:\Video\QmlnQnVja0J1bm55.mp4` |
| `C:\Video` | `E:\Video\Win\QmlnQnVja0J1bm55.mp4` |

#### Change Path Regardless of Tags/Studios

```py
p_use_default_template = True
p_default_template = r"D:\Video\"
```

The file is moved to: `D:\Video\QmlnQnVja0J1bm55.mp4`

### Gallery Templates

The plugin supports renaming and moving galleries (both folder-based and zip file-based galleries). Gallery templates work similarly to scene templates but use separate configuration options.

#### Gallery Filename Templates

Change your gallery filename/folder name (e.g., `C:\Galleries\**gallery.zip**` or `C:\Galleries\**folder**`)

**Priority**: Tags > Studios > Default

##### Based on a Tag

```py
gallery_tag_templates = {
    "rename_tag": "$year $title - $studio",
    "rename_tag2": "$title"
}
```

| tag | new filename/folder |
|-----|---------------------|
| rename_tag | `C:\Galleries\2008 Big Buck Bunny - Blender Institute.zip` |
| rename_tag2 | `C:\Galleries\Big Buck Bunny.zip` |

##### Based on a Studio

```py
gallery_studio_templates = {
    "Blender Institute": "$date - $title [$studio]",
    "Pixar": "$title [$studio]"
}
```

| studio | new filename/folder |
|--------|---------------------|
| Blender Institute | `C:\Galleries\2008-05-20 - Big Buck Bunny [Blender Institute].zip` |
| Pixar | `C:\Galleries\Big Buck Bunny [Pixar].zip` |

##### Change Filename Regardless of Tags/Studios

```py
use_default_gallery_template = True
default_gallery_template = "$date $title"
```

The gallery becomes: `C:\Galleries\2008-05-20 Big Buck Bunny.zip` (for zip files) or `C:\Galleries\2008-05-20 Big Buck Bunny\` (for folders)

#### Gallery Path Templates

Change your gallery path (e.g., **C:\Galleries**\gallery.zip)

##### Based on a Tag

```py
p_gallery_tag_templates = {
    "rename_tag": r"D:\Galleries\",
    "rename_tag2": r"E:\Galleries\$year"
}
```

| tag | new path |
|-----|----------|
| rename_tag | `D:\Galleries\gallery.zip` |
| rename_tag2 | `E:\Galleries\2008\gallery.zip` |

##### Based on a Studio

```py
p_gallery_studio_templates = {
    "Blender Institute": r"D:\Galleries\Blender\",
    "Pixar": r"E:\Galleries\$studio\"
}
```

| studio | new path |
|--------|----------|
| Blender Institute | `D:\Galleries\Blender\gallery.zip` |
| Pixar | `E:\Galleries\Pixar\gallery.zip` |

##### Based on a Path

```py
p_gallery_path_templates = {
    r"C:\Temp": r"D:\Galleries\",
    r"C:\Galleries": r"E:\Galleries\Win\"
}
```

| gallery path | new path |
|--------------|----------|
| `C:\Temp` | `D:\Galleries\gallery.zip` |
| `C:\Galleries` | `E:\Galleries\Win\gallery.zip` |

##### Change Path Regardless of Tags/Studios

```py
p_use_default_gallery_template = True
p_default_gallery_template = r"D:\Galleries\"
```

The gallery is moved to: `D:\Galleries\gallery.zip`

**Note**: Gallery path templates support the same special variables as scene templates (`$studio_hierarchy`, `^*`, etc.), but do **not** support `$group_hierarchy` (which is scene-specific).

#### Gallery Types

The plugin supports two types of galleries:

- **Folder Galleries**: Directory-based galleries containing image files. The entire folder is renamed/moved.
- **Zip Galleries**: Zip file-based galleries. The zip file itself is renamed/moved.

Both types use the same template system and configuration options.

**Note**: Manually created galleries (where users freely assign images to galleries without a folder or zip file) are **not supported**. These galleries have no `folder` property and an empty `files` array. The plugin will log a warning and skip these galleries, as there is no file or folder to rename/move.

### Special Variables

- **`$studio_hierarchy`** - Creates the entire studio hierarchy as folders (e.g., `../MindGeek/Brazzers/Hot And Mean/video.mp4`). Uses parent studios.

- **`$group_hierarchy`** - Creates the entire group hierarchy as folders (e.g., `group_a/group_b/group_c/video.mp4`). When a group has multiple parents, only the first parent is used. **Note**: Only available for scenes, not galleries.

- **`^*`** - The current directory of the file.
  - **Example**: If `p_default_template = r"^*\$performer"`
  - It creates a folder with a performer name in the current directory where the file is located
  - `C:\Temp\video.mp4` → `^*=C:\Temp\` → Result: `C:\Temp\Jane Doe\video.mp4`
  - If you don't use the `prevent_consecutive` option, the plugin will create a new folder every time (`C:\Temp\Jane Doe\Jane Doe\...\video.mp4`)

### Advanced Features

#### Groups

You can group elements in the template with `{}`. This is used when you want to remove a character if a variable is null.

**Example:**

**With** date in Stash:
- `[$studio] $date - $title` → `[Blender] 2008-05-20 - Big Buck Bunny`

**Without** date in Stash:
- `[$studio] $date - $title` → `[Blender] - Big Buck Bunny`

If you want to use the `-` only when you have the date, you can group the `-` with `$date`:

**Without** date in Stash:
- `[$studio] {$date -} $title` → `[Blender] Big Buck Bunny`

### Options

#### p_tag_option

Options that can be applied when a specific tag is present (works for both scenes and galleries):

- **`clean_tag`**: Remove the tag after the rename operation
- **`inverse_performer`**: Change the performer name format (Jane Doe → Doe, Jane)
- **`dry_run`**: Activate dry-run mode for this specific scene/gallery

**Example:**
```py
p_tag_option = {
    "plugin_move": ["clean_tag"]
}
```

**Note**: The `p_tag_option` configuration applies to both scene path templates and gallery path templates. When a tag is present in either a scene or gallery, the specified options will be applied.

#### field_replacer

Remove or replace characters from specific fields. Supports both simple string replacement and regex, and allows multiple replacements per field:

```py
field_replacer = {
    # Single replacement (dict)
    "$studio": {"replace": "'", "with": ""},
    # Regex replacement
    "$title": {"regex": "^(A|An|The) ", "with": ""},  # Remove leading prepositions
    # Multiple replacements (list) - applied in sequence
    "$title": [
        {"replace": ".", "with": ""},      # Remove periods
        {"replace": "---", "with": "-"},    # Replace --- with - (longer pattern first)
        {"replace": "--", "with": "-"}     # Replace -- with - (shorter pattern second)
    ]
}
# My Dad's Hot Girlfriend → My Dads Hot Girlfriend
# The Big Movie → Big Movie
# Ms. Vamp Gets Stuffed---Title → Ms Vamp Gets Stuffed-Title
```

**Format Options:**
- **Single replacement (dict)**: `{"replace": "old", "with": "new"}` or `{"regex": "pattern", "with": "replacement"}`
- **Multiple replacements (list)**: `[{"replace": "old1", "with": "new1"}, {"regex": "pattern", "with": "replacement"}, ...]` - Applied in sequence
- **Simple replacement**: Replaces exact string matches
- **Regex replacement**: Uses regular expressions for pattern matching

**Note:** When using multiple replacements, they are applied in the order specified. This allows you to handle cases where you need different replacement values for different patterns (e.g., `--` → `-` but `---` → `_`).
```

#### replace_words

Match and replace words or patterns.
```py
replace_words = {
    "Scene": ["Sc.", "word"],           # Replace "Scene" with "Sc." (word match)
    r"S\d+:E\d+": ["", "regex"],         # Remove Sxx:Exx pattern (regex match)
    r"[,#]": ["", "regex"]               # Remove comma and hash
}
```

The second element determines the matching system:
- **`word`**: Match a word (between separators like space, _, -)
- **`regex`**: Match a regular expression pattern
- **`any`**: Match anywhere in the string (default if not specified)

#### performer_limit

Maximum number of performer names in the filename. If there are more performers than this limit, the filename will not include any performer names (unless `performer_limit_keep` is set to `True`):

```py
performer_limit = 5
performer_limit_keep = True  # Use up to the limit instead of discarding all
```
