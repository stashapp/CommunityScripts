"""Stash plugin logging (stashapi.log) with a stderr fallback."""

import sys


try:
    import stashapi.log as log
except ImportError:  # pragma: no cover - only hit when deps are missing
    class _FallbackLog:
        def _emit(self, level, *args):
            try:
                sys.stderr.write(
                    f"[tagAI][{level}] " + " ".join(str(a) for a in args) + "\n"
                )
                sys.stderr.flush()
            except Exception:
                pass

        def info(self, *a):
            self._emit("info", *a)

        def error(self, *a):
            self._emit("error", *a)

        def warning(self, *a):
            self._emit("warning", *a)

        def debug(self, *a):
            self._emit("debug", *a)

        def progress(self, *a):
            self._emit("progress", *a)

    log = _FallbackLog()


# --------------------------------------------------------------------------- #
# Defensive heavy-dependency import. numpy / requests / Pillow must be present
# in the interpreter Stash uses to run plugins (which is *not* necessarily the
# one on your shell PATH). Record the failure and report it cleanly from
# ``main`` instead of crashing at import time with a bare traceback.
# --------------------------------------------------------------------------- #
