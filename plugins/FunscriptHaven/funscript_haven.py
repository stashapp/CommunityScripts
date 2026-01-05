"""
Funscript Haven - StashApp Plugin
Generates funscript files from video scenes using optical flow analysis
"""

import gc
import os
import sys
import json
import math
import threading
import concurrent.futures
import random
import subprocess
from multiprocessing import Pool
from typing import Dict, Any, List, Optional, Callable, Tuple

# ----------------- Setup and Dependencies -----------------

# Use PythonDepManager for dependency management
try:
    from PythonDepManager import ensure_import
    
    # Install and ensure all required dependencies with specific versions
    ensure_import(
        "stashapi:stashapp-tools==0.2.58",
        "numpy==1.26.4",
        "opencv-python==4.10.0.84",
        "decord==0.6.0"
    )
    
    # Import the dependencies after ensuring they're available
    import stashapi.log as log
    from stashapi.stashapp import StashInterface
    import numpy as np
    import cv2
    from decord import VideoReader, cpu
    
except ImportError as e:
    print(f"Failed to import PythonDepManager or required dependencies: {e}")
    print("Please ensure PythonDepManager is installed and available.")
    sys.exit(1)
except Exception as e:
    print(f"Error during dependency management: {e}")
    import traceback
    print(f"Stack trace: {traceback.format_exc()}")
    sys.exit(1)

# Import local config
try:
    import funscript_haven_config as config
except ModuleNotFoundError:
    log.error("Please provide a funscript_haven_config.py file with the required variables.")
    raise Exception("Please provide a funscript_haven_config.py file with the required variables.")

# ----------------- Global Variables -----------------

stash: Optional[StashInterface] = None
progress: float = 0.0
total_tasks: int = 0
completed_tasks: int = 0

# ----------------- Optical Flow Functions -----------------

def max_divergence(flow):
    """
    Computes the divergence of the optical flow over the whole image and returns
    the pixel (x, y) with the highest absolute divergence along with its value.
    """
    div = np.gradient(flow[..., 0], axis=0) + np.gradient(flow[..., 1], axis=1)
    y, x = np.unravel_index(np.argmax(np.abs(div)), div.shape)
    return x, y, div[y, x]


def radial_motion_weighted(flow, center, is_cut, pov_mode=False, balance_global=True):
    """
    Computes signed radial motion: positive for outward motion, negative for inward motion.
    Closer pixels have higher weight.
    """
    if is_cut:
        return 0.0
    h, w, _ = flow.shape
    y, x = np.indices((h, w))
    dx = x - center[0]
    dy = y - center[1]

    dot = flow[..., 0] * dx + flow[..., 1] * dy

    if pov_mode or not balance_global:
        return np.mean(dot)
    
    weighted_dot = np.where(x > center[0], dot * (w - x) / w, dot * x / w)
    weighted_dot = np.where(y > center[1], weighted_dot * (h - y) / h, weighted_dot * y / h)

    return np.mean(weighted_dot)


def precompute_flow_info(p0, p1, params):
    """
    Compute optical flow and extract relevant information for funscript generation.
    """
    cut_threshold = params.get("cut_threshold", 7)
    
    flow = cv2.calcOpticalFlowFarneback(p0, p1, None, 0.5, 3, 15, 3, 5, 1.2, 0)
    
    if params.get("pov_mode"):
        max_val = (p0.shape[1] // 2, p0.shape[0] - 1, 0)
    else:
        max_val = max_divergence(flow)
    
    pos_center = max_val[0:2]
    val_pos = max_val[2]
    
    mag, ang = cv2.cartToPolar(flow[..., 0], flow[..., 1])
    mean_mag = np.mean(mag)
    is_cut = mean_mag > cut_threshold

    return {
        "flow": flow,
        "pos_center": pos_center,
        "neg_center": pos_center,
        "val_pos": val_pos,
        "val_neg": val_pos,
        "cut": is_cut,
        "cut_center": pos_center[0],
        "mean_mag": mean_mag
    }


def precompute_wrapper(p, params):
    return precompute_flow_info(p[0], p[1], params)


def probe_video_streams(video_path: str) -> Tuple[bool, Optional[int], Optional[str]]:
    """
    Probe video file to find the correct video stream index.
    Returns (success, video_stream_index, error_message).
    """
    try:
        cmd = [
            "ffprobe",
            "-v", "error",
            "-select_streams", "v",
            "-show_entries", "stream=index,codec_type",
            "-of", "json",
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        
        if result.returncode != 0:
            return False, None, f"ffprobe failed: {result.stderr}"
        
        data = json.loads(result.stdout)
        streams = data.get("streams", [])
        
        # Find the first video stream
        for stream in streams:
            if stream.get("codec_type") == "video":
                stream_index = stream.get("index")
                if stream_index is not None:
                    return True, int(stream_index), None
        
        return False, None, "No video stream found in file"
    except subprocess.TimeoutExpired:
        return False, None, "ffprobe timed out"
    except json.JSONDecodeError as e:
        return False, None, f"Failed to parse ffprobe output: {e}"
    except Exception as e:
        return False, None, f"Error probing video: {e}"


def validate_video_file(video_path: str) -> Tuple[bool, Optional[str]]:
    """
    Validate that a video file can be opened with OpenCV.
    Returns (is_valid, error_message).
    """
    if not os.path.exists(video_path):
        return False, f"Video file does not exist: {video_path}"
    
    if not os.path.isfile(video_path):
        return False, f"Path is not a file: {video_path}"
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        cap.release()
        return False, f"OpenCV cannot open video file: {video_path}"
    
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    cap.release()
    
    if frame_count <= 0:
        return False, f"Video file has no frames: {video_path}"
    
    if fps <= 0:
        return False, f"Video file has invalid FPS: {video_path}"
    
    return True, None


def fetch_frames(video_path, chunk, params):
    """Fetch and preprocess frames from video."""
    frames_gray = []
    vr: Optional[VideoReader] = None
    target_width = 512 if params.get("vr_mode") else 256
    target_height = 512 if params.get("vr_mode") else 256
    
    # Try multiple strategies for VideoReader initialization
    initialization_strategies = [
        # Strategy 1: With width/height (preferred for performance)
        {"width": target_width, "height": target_height, "num_threads": params["threads"]},
        # Strategy 2: Without width/height (will resize frames manually)
        {"num_threads": params["threads"]},
        # Strategy 3: Lower resolution
        {"width": target_width // 2, "height": target_height // 2, "num_threads": params["threads"]},
        # Strategy 4: Single thread
        {"width": target_width, "height": target_height, "num_threads": 1},
        # Strategy 5: Minimal parameters
        {},
    ]
    
    batch_frames = None
    needs_resize = False
    
    for strategy in initialization_strategies:
        vr = None
        try:
            vr = VideoReader(video_path, ctx=cpu(0), **strategy)
            batch_frames = vr.get_batch(chunk).asnumpy()
            # Check if we got frames without the desired size
            if batch_frames.size > 0 and "width" not in strategy:
                needs_resize = True
            # Success - break out of loop, vr will be cleaned up after processing
            break
        except Exception:
            # Failed with this strategy, try next one
            if vr is not None:
                vr = None
            continue
    
    # Clean up VideoReader after getting frames
    if vr is not None:
        vr = None
    gc.collect()
    
    if batch_frames is None or batch_frames.size == 0:
        return frames_gray

    for f in batch_frames:
        # Resize if needed (when VideoReader was initialized without width/height)
        if needs_resize:
            f = cv2.resize(f, (target_width, target_height), interpolation=cv2.INTER_LINEAR)
        
        if params.get("vr_mode"):
            h, w, _ = f.shape
            gray = cv2.cvtColor(f[h // 2:, :w // 2], cv2.COLOR_RGB2GRAY)
        else:
            gray = cv2.cvtColor(f, cv2.COLOR_RGB2GRAY)
        frames_gray.append(gray)

    return frames_gray


# ----------------- OpenSimplex Noise Generator -----------------

class OpenSimplex:
    """OpenSimplex noise generator for smooth, natural random motion."""
    PSIZE = 2048
    PMASK = PSIZE - 1

    def __init__(self, seed=None):
        if seed is None:
            seed = random.randint(0, 2**63 - 1)
        
        self._perm = [0] * self.PSIZE
        self._grad = [(0.0, 0.0)] * self.PSIZE
        
        grad_base = [
            (0.130526192220052, 0.991444861373810),
            (0.382683432365090, 0.923879532511287),
            (0.608761429008721, 0.793353340291235),
            (0.793353340291235, 0.608761429008721),
            (0.923879532511287, 0.382683432365090),
            (0.991444861373810, 0.130526192220051),
            (0.991444861373810, -0.130526192220051),
            (0.923879532511287, -0.382683432365090),
            (0.793353340291235, -0.608761429008720),
            (0.608761429008721, -0.793353340291235),
            (0.382683432365090, -0.923879532511287),
            (0.130526192220052, -0.991444861373810),
            (-0.130526192220052, -0.991444861373810),
            (-0.382683432365090, -0.923879532511287),
            (-0.608761429008721, -0.793353340291235),
            (-0.793353340291235, -0.608761429008721),
            (-0.923879532511287, -0.382683432365090),
            (-0.991444861373810, -0.130526192220052),
            (-0.991444861373810, 0.130526192220051),
            (-0.923879532511287, 0.382683432365090),
            (-0.793353340291235, 0.608761429008721),
            (-0.608761429008721, 0.793353340291235),
            (-0.382683432365090, 0.923879532511287),
            (-0.130526192220052, 0.991444861373810)
        ]
        
        n = 0.05481866495625118
        self._grad_lookup = [(dx / n, dy / n) for dx, dy in grad_base]
        
        source = list(range(self.PSIZE))
        for i in range(self.PSIZE - 1, -1, -1):
            seed = (seed * 6364136223846793005 + 1442695040888963407) & 0xFFFFFFFFFFFFFFFF
            r = int((seed + 31) % (i + 1))
            if r < 0:
                r += i + 1
            self._perm[i] = source[r]
            self._grad[i] = self._grad_lookup[self._perm[i] % len(self._grad_lookup)]
            source[r] = source[i]
    
    def calculate_2d(self, x, y):
        s = 0.366025403784439 * (x + y)
        return self._calculate_2d_impl(x + s, y + s)
    
    def calculate_2d_octaves(self, x, y, octaves=1, persistence=1.0, lacunarity=1.0):
        frequency = 1.0
        amplitude = 1.0
        total_value = 0.0
        total_amplitude = 0.0
        
        for _ in range(octaves):
            total_value += self.calculate_2d(x * frequency, y * frequency) * amplitude
            total_amplitude += amplitude
            amplitude *= persistence
            frequency *= lacunarity
        
        return total_value / total_amplitude if total_amplitude > 0 else 0
    
    def _calculate_2d_impl(self, xs, ys):
        xsb = int(math.floor(xs))
        ysb = int(math.floor(ys))
        xsi = xs - xsb
        ysi = ys - ysb
        
        a = int(xsi + ysi)
        
        ssi = (xsi + ysi) * -0.211324865405187
        xi = xsi + ssi
        yi = ysi + ssi
        
        value = 0.0
        
        value += self._contribute(xsb, ysb, xi, yi)
        value += self._contribute(xsb + 1, ysb + 1, xi - 1 + 2 * 0.211324865405187, yi - 1 + 2 * 0.211324865405187)
        
        if a == 0:
            value += self._contribute(xsb + 1, ysb, xi - 1 + 0.211324865405187, yi + 0.211324865405187)
            value += self._contribute(xsb, ysb + 1, xi + 0.211324865405187, yi - 1 + 0.211324865405187)
        else:
            value += self._contribute(xsb + 2, ysb + 1, xi - 2 + 3 * 0.211324865405187, yi - 1 + 3 * 0.211324865405187)
            value += self._contribute(xsb + 1, ysb + 2, xi - 1 + 3 * 0.211324865405187, yi - 2 + 3 * 0.211324865405187)
        
        return value
    
    def _contribute(self, xsb, ysb, dx, dy):
        attn = 2.0 / 3.0 - dx * dx - dy * dy
        if attn <= 0:
            return 0
        
        pxm = xsb & self.PMASK
        pym = ysb & self.PMASK
        grad = self._grad[self._perm[pxm] ^ pym]
        extrapolation = grad[0] * dx + grad[1] * dy
        
        attn *= attn
        return attn * attn * extrapolation


# ----------------- Multi-Axis Generation -----------------

MULTI_AXIS_CONFIG = {
    "surge": {
        "name": "L1",
        "friendly_name": "Forward/Backward",
        "file_suffix": "surge",
        "default_value": 50,
        "phase_offset": 0.25,
    },
    "sway": {
        "name": "L2", 
        "friendly_name": "Left/Right",
        "file_suffix": "sway",
        "default_value": 50,
        "phase_offset": 0.5,
    },
    "twist": {
        "name": "R0",
        "friendly_name": "Twist",
        "file_suffix": "twist",
        "default_value": 50,
        "phase_offset": 0.0,
    },
    "roll": {
        "name": "R1",
        "friendly_name": "Roll",
        "file_suffix": "roll", 
        "default_value": 50,
        "phase_offset": 0.33,
    },
    "pitch": {
        "name": "R2",
        "friendly_name": "Pitch",
        "file_suffix": "pitch",
        "default_value": 50,
        "phase_offset": 0.66,
    },
}


class MultiAxisGenerator:
    """Generates secondary axis funscripts from primary L0 (stroke) data."""
    
    def __init__(self, settings):
        self.settings = settings
        self.intensity = settings.get("multi_axis_intensity", 0.5)
        self.random_speed = settings.get("random_speed", 0.3)
        self.smart_limit = settings.get("smart_limit", True)
        self.auto_home_delay = settings.get("auto_home_delay", 1.0)
        self.auto_home_duration = settings.get("auto_home_duration", 0.5)
        
        self.noise_generators = {
            axis_name: OpenSimplex(seed=hash(axis_name) & 0xFFFFFFFF)
            for axis_name in MULTI_AXIS_CONFIG.keys()
        }
    
    def generate_all_axes(self, l0_actions, fps, log_func=None):
        if not l0_actions or len(l0_actions) < 2:
            return {}
        
        activity_data = self._analyze_activity(l0_actions)
        
        results = {}
        for axis_name, axis_config in MULTI_AXIS_CONFIG.items():
            if log_func:
                log_func(f"Generating {axis_config['friendly_name']} ({axis_config['name']}) axis...")
            
            axis_actions = self._generate_axis(
                axis_name, 
                axis_config,
                l0_actions, 
                activity_data,
                fps
            )
            
            axis_actions = self._apply_auto_home(axis_actions, activity_data, axis_config)
            results[axis_name] = axis_actions
            
            if log_func:
                log_func(f"  Generated {len(axis_actions)} actions for {axis_config['file_suffix']}")
        
        return results
    
    def _analyze_activity(self, l0_actions):
        velocities = []
        activity_levels = []
        
        for i in range(len(l0_actions)):
            if i == 0:
                velocities.append(0)
            else:
                dt = (l0_actions[i]["at"] - l0_actions[i-1]["at"]) / 1000.0
                if dt > 0:
                    dp = abs(l0_actions[i]["pos"] - l0_actions[i-1]["pos"])
                    velocities.append(dp / dt)
                else:
                    velocities.append(0)
        
        max_vel = max(velocities) if velocities else 1
        if max_vel > 0:
            activity_levels = [min(1.0, v / max_vel) for v in velocities]
        else:
            activity_levels = [0] * len(velocities)
        
        window_size = min(5, len(activity_levels))
        smoothed_activity = []
        for i in range(len(activity_levels)):
            start = max(0, i - window_size // 2)
            end = min(len(activity_levels), i + window_size // 2 + 1)
            smoothed_activity.append(sum(activity_levels[start:end]) / (end - start))
        
        idle_periods = []
        idle_threshold = 0.1
        min_idle_duration_ms = self.auto_home_delay * 1000
        
        idle_start = None
        for i, (action, activity) in enumerate(zip(l0_actions, smoothed_activity)):
            if activity < idle_threshold:
                if idle_start is None:
                    idle_start = action["at"]
            else:
                if idle_start is not None:
                    idle_duration = action["at"] - idle_start
                    if idle_duration >= min_idle_duration_ms:
                        idle_periods.append((idle_start, action["at"]))
                    idle_start = None
        
        if idle_start is not None and l0_actions:
            idle_duration = l0_actions[-1]["at"] - idle_start
            if idle_duration >= min_idle_duration_ms:
                idle_periods.append((idle_start, l0_actions[-1]["at"]))
        
        return {
            "velocities": velocities,
            "activity_levels": smoothed_activity,
            "idle_periods": idle_periods
        }
    
    def _generate_axis(self, axis_name, axis_config, l0_actions, activity_data, fps):
        noise = self.noise_generators[axis_name]
        phase_offset = axis_config["phase_offset"]
        default_value = axis_config["default_value"]
        
        actions = []
        
        for i, l0_action in enumerate(l0_actions):
            timestamp_ms = l0_action["at"]
            time_sec = timestamp_ms / 1000.0
            
            noise_x = time_sec * self.random_speed + phase_offset * 10
            noise_y = time_sec * self.random_speed * 0.7 + phase_offset * 5
            
            noise_value = noise.calculate_2d_octaves(
                noise_x, noise_y, 
                octaves=2, 
                persistence=0.5, 
                lacunarity=2.0
            )
            
            raw_pos = default_value + noise_value * 50 * self.intensity
            
            if self.smart_limit and i < len(activity_data["activity_levels"]):
                activity = activity_data["activity_levels"][i]
                deviation = raw_pos - default_value
                raw_pos = default_value + deviation * activity
            
            pos = int(round(max(0, min(100, raw_pos))))
            actions.append({"at": timestamp_ms, "pos": pos})
        
        return actions
    
    def _apply_auto_home(self, actions, activity_data, axis_config):
        if not actions or not activity_data["idle_periods"]:
            return actions
        
        default_value = axis_config["default_value"]
        home_duration_ms = self.auto_home_duration * 1000
        
        result_actions = []
        idle_periods = activity_data["idle_periods"]
        
        for action in actions:
            timestamp_ms = action["at"]
            
            in_idle = False
            for idle_start, idle_end in idle_periods:
                if idle_start <= timestamp_ms <= idle_end:
                    in_idle = True
                    idle_progress = (timestamp_ms - idle_start) / home_duration_ms
                    idle_progress = min(1.0, idle_progress)
                    
                    ease = 1 - (1 - idle_progress) ** 2
                    current_pos = action["pos"]
                    homed_pos = int(round(current_pos + (default_value - current_pos) * ease))
                    
                    result_actions.append({"at": timestamp_ms, "pos": homed_pos})
                    break
            
            if not in_idle:
                result_actions.append(action)
        
        return result_actions
    
    def save_axis_funscript(self, base_path, axis_name, actions, log_func=None):
        axis_config = MULTI_AXIS_CONFIG.get(axis_name)
        if not axis_config:
            return False
        
        output_path = f"{base_path}.{axis_config['file_suffix']}.funscript"
        
        funscript = {
            "version": "1.0",
            "inverted": False,
            "range": 100,
            "actions": actions
        }
        
        try:
            with open(output_path, "w") as f:
                json.dump(funscript, f, indent=2)
            if log_func:
                log_func(f"Multi-axis funscript saved: {output_path}")
            return True
        except Exception as e:
            if log_func:
                log_func(f"ERROR: Could not save {output_path}: {e}")
            return False


# ----------------- Main Processing Function -----------------

def process_video(video_path: str, params: Dict[str, Any], log_func: Callable, 
                  progress_callback: Optional[Callable] = None, 
                  cancel_flag: Optional[Callable] = None) -> bool:
    """
    Process a video file and generate funscript.
    Returns True if an error occurred, False otherwise.
    """
    error_occurred = False
    base, _ = os.path.splitext(video_path)
    output_path = base + ".funscript"
    
    if os.path.exists(output_path) and not params.get("overwrite", False):
        log_func(f"Skipping: output file exists ({output_path})")
        return error_occurred

    # Validate video file before attempting to process
    is_valid, validation_error = validate_video_file(video_path)
    if not is_valid:
        log_func(f"ERROR: Video validation failed: {validation_error}")
        return True

    log_func(f"Processing video: {video_path}")
    
    # Probe video to get stream information
    probe_success, video_stream_index, probe_error = probe_video_streams(video_path)
    if probe_success and video_stream_index is not None:
        log_func(f"Found video stream at index {video_stream_index}")
    
    # Try multiple initialization strategies for decord VideoReader
    vr: Optional[VideoReader] = None
    initialization_strategies = [
        # Strategy 1: With width/height (original approach)
        {"width": 1024, "height": 1024, "num_threads": params["threads"]},
        # Strategy 2: Without width/height (native resolution, resize later)
        {"num_threads": params["threads"]},
        # Strategy 3: Lower resolution
        {"width": 512, "height": 512, "num_threads": params["threads"]},
        # Strategy 4: Single thread
        {"width": 1024, "height": 1024, "num_threads": 1},
        # Strategy 5: No parameters (minimal)
        {},
    ]
    
    last_error: Optional[str] = None
    for i, strategy in enumerate(initialization_strategies):
        try:
            log_func(f"Trying VideoReader initialization strategy {i+1}/{len(initialization_strategies)}...")
            vr = VideoReader(video_path, ctx=cpu(0), **strategy)
            # Test that we can actually read properties
            _ = len(vr)
            _ = vr.get_avg_fps()
            log_func(f"Successfully opened video with strategy {i+1}")
            break
        except Exception as e:
            error_msg = str(e)
            last_error = error_msg
            if "cannot find video stream" in error_msg or "st_nb" in error_msg:
                # This is the specific error we're trying to fix, try next strategy
                continue
            else:
                # Other errors, try next strategy
                continue
    
    if vr is None:
        error_msg = last_error or "Unknown error"
        log_func(f"ERROR: Unable to open video at {video_path} with any initialization strategy.")
        log_func(f"ERROR: Last error: {error_msg}")
        if probe_success:
            log_func(f"ERROR: Video has valid stream at index {video_stream_index}, but decord cannot access it.")
        return True

    # Get video properties (already validated in initialization loop, but get values)
    try:
        total_frames = len(vr)
        fps = vr.get_avg_fps()
        
        if total_frames <= 0:
            log_func(f"ERROR: Video has no frames: {video_path}")
            return True
        
        if fps <= 0:
            log_func(f"ERROR: Video has invalid FPS: {video_path}")
            return True
    except Exception as e:
        log_func(f"ERROR: Unable to read video properties: {e}")
        return True

    step = max(1, int(math.ceil(fps / 15.0)))
    effective_fps = fps / step
    indices = list(range(0, total_frames, step))
    log_func(f"FPS: {fps:.2f}; downsampled to ~{effective_fps:.2f} fps; {len(indices)} frames selected.")

    step = max(1, int(math.ceil(fps / 30.0)))
    indices = list(range(0, total_frames, step))
    bracket_size = int(params.get("batch_size", 3000))

    final_flow_list = []
    next_batch = None
    fetch_thread = None

    for chunk_start in range(0, len(indices), bracket_size):
        if cancel_flag and cancel_flag():
            log_func("Processing cancelled by user.")
            return error_occurred

        chunk = indices[chunk_start:chunk_start + bracket_size]
        frame_indices = chunk[:-1]
        if len(chunk) < 2:
            continue

        if fetch_thread:
            fetch_thread.join()
            frames_gray = next_batch if next_batch is not None else fetch_frames(video_path, chunk, params)
            next_batch = None
        else:
            frames_gray = fetch_frames(video_path, chunk, params)

        if not frames_gray:
            log_func(f"ERROR: Unable to fetch frames for chunk {chunk_start} - skipping.")
            continue
            
        if chunk_start + bracket_size < len(indices):
            next_chunk = indices[chunk_start + bracket_size:chunk_start + 2 * bracket_size]
            def fetch_and_store():
                global next_batch
                next_batch = fetch_frames(video_path, next_chunk, params)

            fetch_thread = threading.Thread(target=fetch_and_store)
            fetch_thread.start()

        pairs = list(zip(frames_gray[:-1], frames_gray[1:]))

        with Pool(processes=params["threads"]) as pool:
            precomputed = pool.starmap(precompute_wrapper, [(p, params) for p in pairs])

        final_centers = []
        for j, info in enumerate(precomputed):
            center_list = [info["pos_center"]]
            for i in range(1, 7):
                if j - i >= 0:
                    center_list.append(precomputed[j - i]["pos_center"])
                if j + i < len(precomputed):
                    center_list.append(precomputed[j + i]["pos_center"])
            center_list = np.array(center_list)
            center = np.mean(center_list, axis=0)
            final_centers.append(center)

        with concurrent.futures.ProcessPoolExecutor(max_workers=params["threads"]) as ex:
            dot_futures = []
            for j, info in enumerate(precomputed):
                dot_futures.append(ex.submit(
                    radial_motion_weighted, 
                    info["flow"], 
                    final_centers[j], 
                    info["cut"], 
                    params.get("pov_mode", False), 
                    params.get("balance_global", True)
                ))
            dot_vals = [f.result() for f in dot_futures]

        for j, dot_val in enumerate(dot_vals):
            is_cut = precomputed[j]["cut"]
            final_flow_list.append((dot_val, is_cut, frame_indices[j]))

        if progress_callback:
            prog = min(100, int(100 * (chunk_start + len(chunk)) / len(indices)))
            progress_callback(prog)

    # Piecewise Integration
    cum_flow = [0]
    time_stamps = [final_flow_list[0][2]]

    for i in range(1, len(final_flow_list)):
        flow_prev, cut_prev, t_prev = final_flow_list[i - 1]
        flow_curr, cut_curr, t_curr = final_flow_list[i]

        if cut_curr:
            cum_flow.append(0)
        else:
            mid_flow = (flow_prev + flow_curr) / 2
            cum_flow.append(cum_flow[-1] + mid_flow)

        time_stamps.append(t_curr)

    cum_flow = [(cum_flow[i] + cum_flow[i-1]) / 2 if i > 0 else cum_flow[i] for i in range(len(cum_flow))]

    # Detrending & Normalization
    detrend_win = int(params["detrend_window"] * effective_fps)
    disc_threshold = 1000

    detrended_data = np.zeros_like(cum_flow)
    weight_sum = np.zeros_like(cum_flow)

    disc_indices = np.where(np.abs(np.diff(cum_flow)) > disc_threshold)[0] + 1
    segment_boundaries = [0] + list(disc_indices) + [len(cum_flow)]

    overlap = detrend_win // 2

    for i in range(len(segment_boundaries) - 1):
        seg_start = segment_boundaries[i]
        seg_end = segment_boundaries[i + 1]
        seg_length = seg_end - seg_start

        if seg_length < 5:
            detrended_data[seg_start:seg_end] = cum_flow[seg_start:seg_end] - np.mean(cum_flow[seg_start:seg_end])
            continue
        if seg_length <= detrend_win:
            segment = cum_flow[seg_start:seg_end]
            x = np.arange(len(segment))
            trend = np.polyfit(x, segment, 1)
            detrended_segment = segment - np.polyval(trend, x)
            weights = np.hanning(len(segment))
            detrended_data[seg_start:seg_end] += detrended_segment * weights
            weight_sum[seg_start:seg_end] += weights
        else:
            for start in range(seg_start, seg_end - overlap, overlap):
                end = min(start + detrend_win, seg_end)
                segment = cum_flow[start:end]
                x = np.arange(len(segment))
                trend = np.polyfit(x, segment, 1)
                detrended_segment = segment - np.polyval(trend, x)
                weights = np.hanning(len(segment))
                detrended_data[start:end] += detrended_segment * weights
                weight_sum[start:end] += weights

    detrended_data /= np.maximum(weight_sum, 1e-6)

    smoothed_data = np.convolve(detrended_data, [1/16, 1/4, 3/8, 1/4, 1/16], mode='same')
    
    norm_win = int(params["norm_window"] * effective_fps)
    if norm_win % 2 == 0:
        norm_win += 1
    half_norm = norm_win // 2
    norm_rolling = np.empty_like(smoothed_data)
    for i in range(len(smoothed_data)):
        start_idx = max(0, i - half_norm)
        end_idx = min(len(smoothed_data), i + half_norm + 1)
        local_window = smoothed_data[start_idx:end_idx]
        local_min = local_window.min()
        local_max = local_window.max()
        if local_max - local_min == 0:
            norm_rolling[i] = 50
        else:
            norm_rolling[i] = (smoothed_data[i] - local_min) / (local_max - local_min) * 100

    # Keyframe Reduction
    if params.get("keyframe_reduction", True):
        key_indices = [0]
        for i in range(1, len(norm_rolling) - 1):
            d1 = norm_rolling[i] - norm_rolling[i - 1]
            d2 = norm_rolling[i + 1] - norm_rolling[i]
            
            if (d1 < 0) != (d2 < 0):
                key_indices.append(i)
        key_indices.append(len(norm_rolling) - 1)
    else:
        key_indices = range(len(norm_rolling))
    
    actions = []
    for ki in key_indices:
        try:
            timestamp_ms = int(((time_stamps[ki]) / fps) * 1000)
            pos = int(round(norm_rolling[ki]))
            actions.append({"at": timestamp_ms, "pos": 100 - pos})
        except Exception as e:
            log_func(f"Error computing action at segment index {ki}: {e}")
            error_occurred = True

    log_func(f"Keyframe reduction: {len(actions)} actions computed.")

    funscript = {"version": "1.0", "actions": actions}
    try:
        with open(output_path, "w") as f:
            json.dump(funscript, f, indent=2)
        log_func(f"Funscript saved: {output_path}")
    except Exception as e:
        log_func(f"ERROR: Could not write output: {e}")
        error_occurred = True
    
    # Generate multi-axis funscripts if enabled
    if params.get("multi_axis", False) and actions:
        log_func("Generating multi-axis funscripts...")
        multi_gen = MultiAxisGenerator(params)
        secondary_axes = multi_gen.generate_all_axes(actions, fps, log_func)
        
        for axis_name, axis_actions in secondary_axes.items():
            multi_gen.save_axis_funscript(base, axis_name, axis_actions, log_func)
        
        log_func(f"Multi-axis generation complete: {len(secondary_axes)} additional axes created.")
    
    return error_occurred


# ----------------- StashApp Integration -----------------

def initialize_stash(connection: Dict[str, Any]) -> None:
    """Initialize the StashApp interface."""
    global stash
    stash = StashInterface(connection)


def get_scenes_with_tag(tag_name: str) -> List[Dict[str, Any]]:
    """Get all scenes that have a specific tag."""
    tag = stash.find_tag(tag_name, create=False)
    if not tag:
        log.warning(f"Tag '{tag_name}' not found")
        return []
    
    # Use fragment to limit fields and avoid fingerprint errors
    # Only fetch id, files.path, and tags.id/name - avoiding problematic fragments
    scenes = stash.find_scenes(
        f={"tags": {"value": [tag["id"]], "modifier": "INCLUDES"}},
        filter={"per_page": -1},
        fragment="id files { path } tags { id name }"
    )
    return scenes or []


def remove_tag_from_scene(scene_id: str, tag_name: str) -> None:
    """Remove a tag from a scene."""
    tag = stash.find_tag(tag_name, create=False)
    if not tag:
        return
    
    # Use fragment to limit fields and avoid fingerprint errors
    scene = stash.find_scene(scene_id, fragment="id tags { id }")
    if not scene:
        return
    
    current_tags = [t["id"] for t in scene.get("tags", [])]
    if tag["id"] in current_tags:
        current_tags.remove(tag["id"])
        stash.update_scene({"id": scene_id, "tag_ids": current_tags})


def add_tag_to_scene(scene_id: str, tag_name: str) -> None:
    """Add a tag to a scene."""
    tag = stash.find_tag(tag_name, create=True)
    if not tag:
        return
    
    # Use fragment to limit fields and avoid fingerprint errors
    scene = stash.find_scene(scene_id, fragment="id tags { id }")
    if not scene:
        return
    
    current_tags = [t["id"] for t in scene.get("tags", [])]
    if tag["id"] not in current_tags:
        current_tags.append(tag["id"])
        stash.update_scene({"id": scene_id, "tag_ids": current_tags})


def is_vr_scene(scene: Dict[str, Any]) -> bool:
    """Check if a scene is tagged as VR."""
    tags = scene.get("tags", [])
    vr_tag_names = config.vr_tag_names if hasattr(config, 'vr_tag_names') else ["VR", "Virtual Reality"]
    for tag in tags:
        if tag.get("name", "").lower() in [t.lower() for t in vr_tag_names]:
            return True
    return False


def add_scene_marker(scene_id: str, title: str, seconds: float, tag_name: Optional[str] = None) -> None:
    """Add a marker to a scene."""
    marker_data = {
        "scene_id": scene_id,
        "title": title,
        "seconds": seconds,
    }
    
    if tag_name:
        tag = stash.find_tag(tag_name, create=True)
        if tag:
            marker_data["primary_tag_id"] = tag["id"]
    
    stash.create_scene_marker(marker_data)


def get_scene_file_path(scene: Dict[str, Any]) -> Optional[str]:
    """Get the file path for a scene."""
    files = scene.get("files", [])
    if files:
        return files[0].get("path")
    return None


# ----------------- Settings Helper -----------------

def get_plugin_setting(key: str, default: Any = None) -> Any:
    """Get a plugin setting from StashApp, falling back to config file."""
    try:
        settings = stash.get_configuration().get("plugins", {}).get("funscript_haven", {})
        if key in settings and settings[key] is not None:
            return settings[key]
    except Exception:
        pass
    
    # Fall back to config file
    return getattr(config, key, default)


def get_trigger_tag() -> str:
    """Get the trigger tag name."""
    return get_plugin_setting("trigger_tag", "FunscriptHaven_Process")


def get_complete_tag() -> Optional[str]:
    """Get the completion tag name."""
    tag = get_plugin_setting("complete_tag", "FunscriptHaven_Complete")
    return tag if tag else None


def get_error_tag() -> str:
    """Get the error tag name."""
    return get_plugin_setting("error_tag", "FunscriptHaven_Error")


# ----------------- Task Functions -----------------

def process_tagged_scenes() -> None:
    """Process all scenes tagged with the trigger tag."""
    global total_tasks, completed_tasks
    
    trigger_tag = get_trigger_tag()
    scenes = get_scenes_with_tag(trigger_tag)
    if not scenes:
        log.info(f"No scenes found with tag '{trigger_tag}'")
        return
    
    total_tasks = len(scenes)
    completed_tasks = 0
    log.info(f"Found {total_tasks} scenes to process")
    log.progress(0.0)
    
    for scene in scenes:
        scene_id = scene["id"]
        video_path = get_scene_file_path(scene)
        
        if not video_path:
            log.error(f"No file path for scene {scene_id}")
            completed_tasks += 1
            continue
        
        if not os.path.exists(video_path):
            log.error(f"Video file not found: {video_path}")
            completed_tasks += 1
            continue
        
        # Build processing parameters from plugin settings (with config file fallback)
        # Convert 0-10 integer settings to their actual decimal values
        detrend_window_raw = get_plugin_setting('detrend_window', 2)  # Default: 2 (was 1.5)
        norm_window_raw = get_plugin_setting('norm_window', 4)  # Default: 4 (was 4.0)
        multi_axis_intensity_raw = get_plugin_setting('multi_axis_intensity', 5)  # Default: 5 (was 0.5, scale 0-10)
        random_speed_raw = get_plugin_setting('random_speed', 3)  # Default: 3 (was 0.3, scale 0-10)
        auto_home_delay_raw = get_plugin_setting('auto_home_delay', 1)  # Default: 1 (was 1.0)
        auto_home_duration_raw = get_plugin_setting('auto_home_duration', 1)  # Default: 1 (was 0.5, rounded)
        
        params = {
            "threads": int(get_plugin_setting('threads', os.cpu_count() or 4)),
            "detrend_window": float(max(1, min(10, int(detrend_window_raw)))),  # Clamp to 1-10 seconds
            "norm_window": float(max(1, min(10, int(norm_window_raw)))),  # Clamp to 1-10 seconds
            "batch_size": int(get_plugin_setting('batch_size', 3000)),
            "overwrite": bool(get_plugin_setting('overwrite', False)),
            "keyframe_reduction": bool(get_plugin_setting('keyframe_reduction', True)),
            "vr_mode": is_vr_scene(scene),
            "pov_mode": bool(get_plugin_setting('pov_mode', False)),
            "balance_global": bool(get_plugin_setting('balance_global', True)),
            "multi_axis": bool(get_plugin_setting('multi_axis', False)),
            "multi_axis_intensity": float(max(0, min(10, int(multi_axis_intensity_raw))) / 10.0),  # Convert 0-10 to 0.0-1.0
            "random_speed": float(max(0, min(10, int(random_speed_raw))) / 10.0),  # Convert 0-10 to 0.0-1.0
            "auto_home_delay": float(max(0, min(10, int(auto_home_delay_raw)))),  # Clamp to 0-10 seconds
            "auto_home_duration": float(max(0, min(10, int(auto_home_duration_raw)))),  # Clamp to 0-10 seconds
            "smart_limit": bool(get_plugin_setting('smart_limit', True)),
        }
        
        log.info(f"Processing scene {scene_id}: {video_path}")
        
        def progress_cb(prog: int) -> None:
            scene_progress = prog / 100.0
            overall_progress = (completed_tasks + scene_progress) / total_tasks
            log.progress(overall_progress)
        
        try:
            error = process_video(
                video_path,
                params,
                log.info,
                progress_callback=progress_cb
            )
            
            if error:
                log.error(f"Error processing scene {scene_id}")
                add_tag_to_scene(scene_id, get_error_tag())
            else:
                log.info(f"Successfully processed scene {scene_id}")
                
                # Add completion tag if configured
                complete_tag = get_complete_tag()
                if complete_tag:
                    add_tag_to_scene(scene_id, complete_tag)
                
                # Add scene marker if configured
                if get_plugin_setting('add_marker', True):
                    add_scene_marker(scene_id, "Funscript Generated", 0, "Funscript")
            
            # Remove trigger tag
            remove_tag_from_scene(scene_id, trigger_tag)
            
        except Exception as e:
            log.error(f"Exception processing scene {scene_id}: {e}")
            add_tag_to_scene(scene_id, get_error_tag())
        
        completed_tasks += 1
        log.progress(completed_tasks / total_tasks)
    
    log.info(f"Completed processing {total_tasks} scenes")
    log.progress(1.0)


# ----------------- Main Execution -----------------

def main() -> None:
    """Main entry point for the plugin."""
    json_input = read_json_input()
    output = {}
    run(json_input, output)
    out = json.dumps(output)
    print(out + "\n")


def read_json_input() -> Dict[str, Any]:
    """Read JSON input from stdin."""
    json_input = sys.stdin.read()
    return json.loads(json_input)


def run(json_input: Dict[str, Any], output: Dict[str, Any]) -> None:
    """Main execution logic."""
    plugin_args = None
    try:
        log.debug(json_input["server_connection"])
        os.chdir(json_input["server_connection"]["PluginDir"])
        initialize_stash(json_input["server_connection"])
    except Exception as e:
        log.error(f"Failed to initialize: {e}")
        output["output"] = "error"
        return

    try:
        plugin_args = json_input['args'].get("mode")
    except (KeyError, TypeError):
        pass
    
    if plugin_args == "process_scenes":
        process_tagged_scenes()
        output["output"] = "ok"
        return
    
    # Default action: process tagged scenes
    process_tagged_scenes()
    output["output"] = "ok"
    return


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log.info("Plugin interrupted by user")
    except Exception as e:
        log.error(f"Plugin failed: {e}")
        sys.exit(1)
