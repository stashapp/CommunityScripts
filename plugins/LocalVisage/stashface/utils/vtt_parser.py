from typing import List, Tuple, Generator

def parse_vtt_offsets(vtt_content: bytes) -> Generator[Tuple[int, int, int, int, float], None, None]:
    """
    Parse VTT file content and extract offsets and timestamps.
    
    Parameters:
    vtt_content: Raw VTT file content as bytes
    
    Returns:
    Generator yielding tuples of (left, top, right, bottom, time_seconds)
    """
    time_seconds = 0
    left = top = right = bottom = None
    
    for line in vtt_content.decode("utf-8").split("\n"):
        line = line.strip()

        if "-->" in line:
            # grab the start time
            # 00:00:00.000 --> 00:00:41.000
            start = line.split("-->")[0].strip().split(":")
            # convert to seconds
            time_seconds = (
                int(start[0]) * 3600
                + int(start[1]) * 60
                + float(start[2])
            )
            left = top = right = bottom = None
        elif "xywh=" in line:
            left, top, right, bottom = line.split("xywh=")[-1].split(",")
            left, top, right, bottom = (
                int(left),
                int(top),
                int(right),
                int(bottom),
            )
        else:
            continue

        if not left:
            continue

        yield left, top, right, bottom, time_seconds 