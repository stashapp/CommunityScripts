"""
Funscript Haven - Configuration File
Edit these settings to customize the plugin behavior
"""

# ----------------- Tag Configuration -----------------

# Tag name that triggers processing (add this tag to scenes you want to process)
trigger_tag = "FunscriptHaven_Process"

# Tag name added when processing completes successfully (set to None to disable)
complete_tag = "FunscriptHaven_Complete"

# Tag name added when an error occurs during processing
error_tag = "FunscriptHaven_Error"

# Tag names that indicate a VR scene (case-insensitive)
vr_tag_names = ["VR", "Virtual Reality", "180°", "360°"]


# ----------------- Processing Settings -----------------

# Number of threads for optical flow computation (default: CPU count)
import os
threads = os.cpu_count() or 4

# Detrend window - controls drift removal aggressiveness (integer 1-10)
# Higher values work better for stable cameras (recommended: 1-10)
# Note: StashApp UI only accepts integers 0-10
detrend_window = 2

# Normalization window in seconds - time window to calibrate motion range (integer 1-10)
# Shorter values amplify motion but may cause artifacts in long thrusts
# Note: StashApp UI only accepts integers 0-10
norm_window = 4

# Batch size in frames - higher values are faster but use more RAM
batch_size = 3000

# Overwrite existing funscript files
overwrite = False

# Enable keyframe reduction (reduces file size while maintaining quality)
keyframe_reduction = True


# ----------------- Mode Settings -----------------

# POV Mode - improves stability for POV videos
pov_mode = False

# Balance Global Motion - tries to cancel out camera motion
# Disable for scenes with no camera movement
balance_global = True


# ----------------- Multi-Axis Settings -----------------

# Generate additional funscript files for secondary axes
# (Roll, Pitch, Twist, Surge, Sway)
multi_axis = False

# Intensity of secondary axis motion (0-10, where 10 = maximum)
# Higher values = more movement
# Note: StashApp UI only accepts integers 0-10, converted to 0.0-1.0 internally
multi_axis_intensity = 5

# Speed of random motion variation (0-10, where 10 = fastest)
# Higher values = faster changes
# Note: StashApp UI only accepts integers 0-10, converted to 0.0-1.0 internally
random_speed = 3

# Seconds of inactivity before returning to center position (integer 0-10)
# Note: StashApp UI only accepts integers 0-10
auto_home_delay = 1

# Time to smoothly return to center position in seconds (integer 0-10)
# Note: StashApp UI only accepts integers 0-10
auto_home_duration = 1

# Scale secondary axis movement with primary stroke activity
smart_limit = True


# ----------------- Marker Settings -----------------

# Add a scene marker when funscript generation completes
add_marker = True
