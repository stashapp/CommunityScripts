"""Video frame time computation and ffmpeg frame extraction."""

from tagai_core import stashlog
from tagai_core.config import (
    FRAME_COUNT_DEFAULT, FRAME_INTERVAL_DEFAULT, FRAME_LONG_SIDE, FRAME_WORKERS_DEFAULT,
    MAX_FRAMES_DEFAULT,
)
from concurrent.futures import ThreadPoolExecutor
import os
import subprocess


def compute_frame_times(duration, frame_count=FRAME_COUNT_DEFAULT,
                        frame_interval=FRAME_INTERVAL_DEFAULT,
                        max_frames=MAX_FRAMES_DEFAULT):
    """Return sample timestamps (seconds) inside the 10%-90% duration band.

    ``frame_interval > 0`` samples one frame roughly every ``frame_interval``
    seconds; otherwise ``frame_count`` frames are spread evenly. The number of
    samples is always capped at ``max_frames`` so long videos stay cheap.
    """
    if not duration or duration <= 0:
        return []

    try:
        max_frames = max(1, int(max_frames))
    except (TypeError, ValueError):
        max_frames = MAX_FRAMES_DEFAULT

    lo = 0.1 * float(duration)
    span = 0.8 * float(duration)

    if frame_interval and float(frame_interval) > 0:
        n = int(span // float(frame_interval)) + 1
    else:
        try:
            n = int(frame_count)
        except (TypeError, ValueError):
            n = FRAME_COUNT_DEFAULT
        n = n if n > 0 else 1

    n = max(1, min(n, max_frames))
    return [lo + span * (i + 0.5) / n for i in range(n)]


def extract_frames(video_path, times, out_dir, ffmpeg_path="ffmpeg",
                    long_side=FRAME_LONG_SIDE, workers=FRAME_WORKERS_DEFAULT,
                    include_times=False):
    """Extract one frame per timestamp in ``times`` (seconds).

    Frames are written at an aspect-preserving ``long_side`` without padding so
    each model family can apply its own final transform. With ``workers > 1``
    the per-timestamp ffmpeg processes run concurrently, which mostly hides the
    seek latency of slow/networked storage.

    With ``include_times`` the returned list holds ``(path, seconds)`` pairs so
    callers can map a frame back to its position in the video (used to place
    scene markers); the default keeps the historical list of paths.
    """
    frames = []
    if not video_path or times is None:
        return frames
    times = list(times)
    if not times:
        return frames
    if not os.path.isfile(video_path):
        stashlog.log.error(f"Video file not found: {video_path}")
        return frames

    try:
        workers = max(1, int(workers))
    except (TypeError, ValueError):
        workers = 1

    vf = (
        f"scale='if(gt(iw,ih),{long_side},-2)'"
        f":'if(gt(iw,ih),-2,{long_side})'"
    )

    def extract_one(index, t):
        """Run one ffmpeg invocation; returns (ok, index, message)."""
        t = float(t)
        out = os.path.join(out_dir, f"frame_{index:03d}.jpg")
        cmd = [
            ffmpeg_path, "-v", "error",
            "-ss", f"{t:.3f}",
            "-i", video_path,
            "-vf", vf,
            "-frames:v", "1",
            "-y", out,
        ]
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True)
        except FileNotFoundError:
            return ("ffmpeg_missing", index, ffmpeg_path)

        if proc.returncode != 0 or not os.path.isfile(out):
            return ("failed", index, f"t={t:.3f}s: {proc.stderr.strip()}")
        return ("ok", index, out)

    jobs = list(enumerate(times))
    if workers > 1 and len(jobs) > 1:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            outcomes = list(pool.map(lambda job: extract_one(*job), jobs))
    else:
        outcomes = [extract_one(*job) for job in jobs]

    if any(status == "ffmpeg_missing" for status, _i, _m in outcomes):
        stashlog.log.error(
            f"ffmpeg not found ({ffmpeg_path}); cannot extract frames. "
            "Install ffmpeg or pass the ffmpeg_path argument."
        )
        return frames

    for status, index, message in sorted(outcomes, key=lambda item: item[1]):
        if status == "ok":
            if include_times:
                frames.append((message, float(times[index])))
            else:
                frames.append(message)
        else:
            stashlog.log.error(f"ffmpeg failed for {video_path} at {message}")

    return frames
