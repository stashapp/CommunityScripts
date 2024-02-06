import stashapi.log as log
from stashapi.tools import human_bytes, human_bits

PRIORITY = ["bitrate_per_pixel", "resolution", "bitrate", "encoding", "size", "age"]
CODEC_PRIORITY = {
    "AV1": 0,
    "H265": 1,
    "HEVC": 1,
    "H264": 2,
    "MPEG4": 3,
    "MPEG1VIDEO": 3,
    "WMV3": 4,
    "WMV2": 5,
    "VC1": 6,
    "SVQ3": 7,
}

KEEP_TAG_NAME = "[PDT: Keep]"
REMOVE_TAG_NAME = "[PDT: Remove]"
UNKNOWN_TAG_NAME = "[PDT: Unknown]"
IGNORE_TAG_NAME = "[PDT: Ignore]"


def compare_bitrate_per_pixel(self, other):

    try:
        self_bpp = self.bitrate / (self.width * self.height * self.frame_rate)
    except ZeroDivisionError:
        log.warning(
            f"scene {self.id} has 0 in file value ({self.width}x{self.height} {self.frame_rate}fps)"
        )
        return
    try:
        other_bpp = other.bitrate / (other.width * other.height * other.frame_rate)
    except ZeroDivisionError:
        log.warning(
            f"scene {other.id} has 0 in file value ({other.width}x{other.height} {other.frame_rate}fps)"
        )
        return

    bpp_diff = abs(self_bpp - other_bpp)
    if bpp_diff <= 0.01:
        return

    if self_bpp > other_bpp:
        better_bpp, worse_bpp = self_bpp, other_bpp
        better, worse = self, other
    else:
        worse_bpp, better_bpp = self_bpp, other_bpp
        worse, better = self, other
    worse.remove_reason = "bitrate_per_pxl"
    message = f"bitrate/pxl {better_bpp:.3f}bpp > {worse_bpp:.3f}bpp Δ:{bpp_diff:.3f}"
    return better, message


def compare_frame_rate(self, other):
    if not self.frame_rate:
        log.warning(f"scene {self.id} has no value for frame_rate")
    if not other.frame_rate:
        log.warning(f"scene {other.id} has no value for frame_rate")

    if abs(self.frame_rate - other.frame_rate) < 5:
        return

    if self.frame_rate > other.frame_rate:
        better, worse = self, other
    else:
        worse, better = self, other
    worse.remove_reason = "frame_rate"
    return better, f"Better FPS {better.frame_rate} vs {worse.frame_rate}"


def compare_resolution(self, other):
    if self.height == other.height:
        return
    if self.height > other.height:
        better, worse = self, other
    else:
        worse, better = self, other
    worse.remove_reason = "resolution"
    return (
        better,
        f"Better Resolution {better.id}:{better.height}p > {worse.id}:{worse.height}p",
    )


def compare_bitrate(self, other):
    if self.bitrate == other.bitrate:
        return
    if self.bitrate > other.bitrate:
        better, worse = self, other
    else:
        worse, better = self, other
    worse.remove_reason = "bitrate"
    return (
        better,
        f"Better Bitrate {human_bits(better.bitrate)}ps > {human_bits(worse.bitrate)}ps Δ:({human_bits(better.bitrate-other.bitrate)}ps)",
    )


def compare_size(self, other):
    if abs(self.size - other.size) <= 100000:  # diff is <= than 0.1 Mb
        return
    if self.size > other.size:
        better, worse = self, other
    else:
        worse, better = self, other
    worse.remove_reason = "file_size"
    return (
        better,
        f"Better Size {human_bytes(better.size)} > {human_bytes(worse.size)} Δ:({human_bytes(better.size-worse.size)})",
    )


def compare_age(self, other):
    if not (self.mod_time and other.mod_time):
        return
    if self.mod_time == other.mod_time:
        return
    if self.mod_time < other.mod_time:
        better, worse = self, other
    else:
        worse, better = self, other
    worse.remove_reason = "age"
    return (
        better,
        f"Choose Oldest: Δ:{worse.mod_time-better.mod_time} | {better.id} older than {worse.id}",
    )


def compare_encoding(self, other):
    if self.codec_priority == other.codec_priority:
        return
    if not (
        isinstance(self.codec_priority, int) and isinstance(other.codec_priority, int)
    ):
        return

    if self.codec_priority < other.codec_priority:
        better, worse = self, other
    else:
        worse, better = self, other
    worse.remove_reason = "video_codec"
    return (
        self,
        f"Prefer Codec {better.codec}({better.id}) over {worse.codec}({worse.id})",
    )
