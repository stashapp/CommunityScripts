import re, sys, copy


# Log messages sent from a plugin instance are transmitted via stderr and are
# encoded with a prefix consisting of special character SOH, then the log
# level (one of t, d, i, w, e, or p - corresponding to trace, debug, info,
# warning, error and progress levels respectively), then special character
# STX.
#
# The LogTrace, LogDebug, LogInfo, LogWarning, and LogError methods, and their equivalent
# formatted methods are intended for use by plugin instances to transmit log
# messages. The LogProgress method is also intended for sending progress data.
#

def __prefix(level_char):
	start_level_char = b'\x01'
	end_level_char = b'\x02'

	ret = start_level_char + level_char + end_level_char
	return ret.decode()



def __log(levelChar, s):
    
    s_out = copy.deepcopy(s)
    if not isinstance(s_out, str):
        s_out = str(s_out)
    s_out = re.sub(r'(?<=")(data:image.+?;base64).+?(?=")', r'\1;truncated', s_out)

    if levelChar == "":
        return

    print(__prefix(levelChar) + s_out + "\n", file=sys.stderr, flush=True)


def trace(s):
	__log(b't', s)


def debug(s):
	__log(b'd', s)


def info(s):
	__log(b'i', s)


def warning(s):
	__log(b'w', s)


def error(s):
	__log(b'e', s)


def progress(p):
	progress = min(max(0, p), 1)
	__log(b'p', str(progress))
