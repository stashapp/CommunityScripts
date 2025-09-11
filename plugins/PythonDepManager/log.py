import sys
import re
from functools import partial


def _log(level_char: str, s):
    lvl_char = "\x01{}\x02".format(level_char)
    s = re.sub(r"data:.+?;base64[^'\"]+", "[...]", str(s))
    for line in s.splitlines():
        print(lvl_char, line, file=sys.stderr, flush=True)


trace = partial(_log, "t")
debug = partial(_log, "d")
info = partial(_log, "i")
warning = partial(_log, "w")
error = partial(_log, "e")


def throw(s, e_type=None, e_from=None):
    error(s)

    if e_type and e_from:
        raise e_type(s) from e_from
    elif e_type and not e_from:
        raise e_type(s)
    elif not e_type and e_from:
        raise Exception(s) from e_from
    else:
        raise Exception(s)
