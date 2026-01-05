# Funscript Haven

A StashApp plugin that automatically generates funscript files from video scenes using optical flow analysis.

## Overview

Funscript Haven analyzes video content using computer vision techniques to detect motion patterns and automatically generate funscript files compatible with interactive devices. The plugin integrates seamlessly with StashApp, allowing you to queue scenes for processing by simply adding a tag.

## Features

- **Automatic Funscript Generation** - Analyzes video motion using optical flow algorithms to generate accurate funscript files
- **Tag-Based Workflow** - Simply tag scenes with a trigger tag to queue them for processing
- **VR Support** - Automatically detects VR content and adjusts processing accordingly
- **Multi-Axis Output** - Optional generation of secondary axis funscripts (Roll, Pitch, Twist, Surge, Sway)
- **POV Mode** - Specialized processing mode for POV content
- **Keyframe Reduction** - Intelligent compression to reduce file size while maintaining quality
- **Batch Processing** - Process multiple scenes in sequence with progress tracking
- **Configurable Settings** - Extensive options available through StashApp UI or config file
- **Enjoying Funscript Haven?** Check out more tools and projects at https://github.com/Haven-hvn

## Requirements

- **StashApp** - This plugin requires a running StashApp instance
- **Python 3.8+** - Python interpreter with pip
- **Dependencies** (automatically installed):
  - `stashapp-tools` (>=0.2.58)
  - `numpy` (v1.26.4)
  - `opencv-python` (v4.10.0.84)
  - `decord` (v0.6.0)

## Installation

1. Copy the plugin files to your StashApp plugins directory:
   ```
   <StashApp>/plugins/funscript_haven/
   ├── funscript_haven.py
   ├── funscript_haven.yml
   └── funscript_haven_config.py
   ```

2. Reload plugins in StashApp (Settings → Plugins → Reload Plugins)

3. Configure plugin settings as needed (Settings → Plugins → Funscript Haven)

## Usage

### Basic Usage

1. **Tag a Scene**: Add the tag `FunscriptHaven_Process` to any scene you want to process
2. **Run the Plugin**: Go to Settings → Tasks → Run Plugin Task → Funscript Haven → "Process Tagged Scenes"
3. **Wait for Processing**: The plugin will process each tagged scene and generate funscript files
4. **Check Results**: Funscript files are saved alongside the video files with `.funscript` extension

### Tag Workflow

| Tag | Purpose |
|-----|---------|
| `FunscriptHaven_Process` | Add to scenes to queue them for processing |
| `FunscriptHaven_Complete` | Automatically added when processing succeeds |
| `FunscriptHaven_Error` | Automatically added if an error occurs |

## Configuration

Settings can be configured in two ways:
1. **StashApp UI** (Settings → Plugins → Funscript Haven) - Takes priority
2. **Config File** (`funscript_haven_config.py`) - Fallback defaults

### Processing Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `threads` | CPU count | Number of threads for optical flow computation |
| `detrend_window` | 2 | Detrend window in seconds - controls drift removal (integer 1-10) |
| `norm_window` | 4 | Normalization window in seconds - calibrates motion range (integer 1-10) |
| `batch_size` | 3000 | Frames per batch - higher is faster but uses more RAM |
| `overwrite` | false | Whether to overwrite existing funscript files |
| `keyframe_reduction` | true | Enable intelligent keyframe reduction |

**Note:** StashApp UI only accepts integer values 0-10 for NUMBER type settings. Decimal values are converted internally.

### Mode Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `pov_mode` | false | Improves stability for POV videos |
| `balance_global` | true | Attempts to cancel out camera motion |

### Multi-Axis Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `multi_axis` | false | Generate secondary axis funscripts |
| `multi_axis_intensity` | 5 | Intensity of secondary axis motion (0-10, where 10 = maximum) |
| `random_speed` | 3 | Speed of random motion variation (0-10, where 10 = fastest) |
| `auto_home_delay` | 1 | Seconds of inactivity before returning to center (integer 0-10) |
| `auto_home_duration` | 1 | Time to smoothly return to center position in seconds (integer 0-10) |
| `smart_limit` | true | Scale secondary axis with primary stroke activity |

**Note:** Settings like `multi_axis_intensity` and `random_speed` use 0-10 integer scale in the UI but are converted to 0.0-1.0 decimal values internally.

### VR Detection

The plugin automatically detects VR content by checking for these tags (case-insensitive):
- VR
- Virtual Reality
- 180°
- 360°

You can customize VR tag detection in `funscript_haven_config.py`.

## Multi-Axis Output

When `multi_axis` is enabled, the plugin generates additional funscript files for secondary axes:

| Axis | File Suffix | Description |
|------|-------------|-------------|
| L1 (Surge) | `.surge.funscript` | Forward/Backward motion |
| L2 (Sway) | `.sway.funscript` | Left/Right motion |
| R0 (Twist) | `.twist.funscript` | Rotational twist |
| R1 (Roll) | `.roll.funscript` | Roll rotation |
| R2 (Pitch) | `.pitch.funscript` | Pitch rotation |

Secondary axes use OpenSimplex noise generation for natural, organic motion patterns that correlate with the primary stroke activity.

## Technical Details

### Algorithm Overview

1. **Frame Extraction** - Video frames are extracted and downsampled using decord
2. **Optical Flow** - Farneback optical flow algorithm detects motion between frames
3. **Divergence Analysis** - Maximum divergence points identify primary motion centers
4. **Radial Motion** - Weighted radial motion calculation extracts stroke direction
5. **Integration** - Piecewise integration of motion values
6. **Detrending** - Rolling window detrending removes drift artifacts
7. **Normalization** - Local normalization scales output to 0-100 range
8. **Keyframe Reduction** - Direction changes are used to reduce keyframe count

### Performance Tips

- **RAM Usage**: Lower `batch_size` if running out of memory
- **Speed**: Increase `threads` to match available CPU cores
- **Quality**: Adjust `detrend_window` and `norm_window` based on video content
- **File Size**: Keep `keyframe_reduction` enabled for smaller files

## Troubleshooting

### Common Issues

**"No scenes found with tag"**
- Ensure the trigger tag exists and is applied to scenes
- Check tag name matches exactly (case-sensitive)

**"Video file not found"**
- Verify the scene has a valid file path in StashApp
- Check file permissions

**Processing is slow**
- Reduce `batch_size` to lower memory usage
- Ensure sufficient CPU threads are allocated
- VR content takes longer due to higher resolution processing

**Poor funscript quality**
- Try adjusting `detrend_window` (higher for stable cameras)
- Enable `pov_mode` for POV content
- Disable `balance_global` if camera doesn't move

### Log Messages

Check StashApp logs for detailed processing information and error messages.

## License

This project is part of the StashApp Community Scripts collection.

## Credits

- Uses OpenCV for optical flow computation
- Uses decord for efficient video frame extraction
- OpenSimplex noise algorithm for multi-axis generation
- Built for integration with StashApp
