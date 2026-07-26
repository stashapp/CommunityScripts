#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mosaic Poster - generation backend (Stash plugin, raw interface)
================================================================
Invoked by Stash via `runPluginOperation` / `runPluginTask`. Reads a JSON
payload on stdin ({server_connection, args}) and writes a JSON result on
stdout ({output|error}).

It generates a 5x5 contact sheet (whole-video overview) for a scene by
sampling 25 frames from the real video with ffmpeg, and writes it to
`<pluginDir>/generated/<oshash>.jpg`. Stash serves that folder statically
(via `ui.assets` in the manifest) at:
    /plugin/MosaicPoster/assets/generated/<oshash>.jpg
so the frontend can display it with normal HTTP caching. No standalone
daemon, no fixed port, no OS-specific service.

Paths (ffmpeg/ffprobe, generated dir) are read from Stash's own
configuration, so it works on any machine/OS. When ffmpegPath is unset,
Stash uses its bundled binary in the config directory; we locate it.

Modes (args.mode):
  generate  scene_id=<id> | scene_ids=[...]  -> generate sheets, return {done,missing}
  prune                                       -> enforce LRU cache cap
  backfill  [limit=N]                         -> generate missing sheets library-wide (task)
  debug                                       -> return resolved paths/keys (diagnostics)
"""
import sys
import os
import json
import shutil
import subprocess
import urllib.request

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
GEN_DIR = os.path.join(SCRIPT_DIR, "generated")

CELL_W, CELL_H = 384, 216          # per cell (16:9); an N x N grid stays 16:9 overall
JPEG_Q = "3"                       # ffmpeg -q:v (2..5, lower = better)
DEFAULT_GRID = 5                   # N for an N x N sheet (N*N frames)
MIN_GRID, MAX_GRID = 2, 8          # clamp range for the requested grid size
DEFAULT_CACHE_MAX = 250            # LRU cap (files). ~0.3MB each -> ~75MB. 0 = unlimited.

def clamp_grid(value):
    try:
        n = int(value)
    except (TypeError, ValueError):
        return DEFAULT_GRID
    return max(MIN_GRID, min(MAX_GRID, n))

# ---- stdin/stdout (Stash raw plugin protocol) -------------------------
def read_payload():
    raw = sys.stdin.read()
    return json.loads(raw) if raw.strip() else {}

def emit_output(obj):
    sys.stdout.write(json.dumps({"output": obj}))

def emit_error(msg):
    sys.stdout.write(json.dumps({"error": str(msg)}))

# ---- talk back to Stash GraphQL --------------------------------------
class Stash:
    def __init__(self, sc):
        scheme = sc.get("Scheme") or "http"
        host = sc.get("Host") or "127.0.0.1"
        if host in ("0.0.0.0", "", None):
            host = "127.0.0.1"
        port = int(sc.get("Port") or 9999)
        self.url = "%s://%s:%d/graphql" % (scheme, host, port)
        self.headers = {"Content-Type": "application/json"}
        cookie = sc.get("SessionCookie") or {}
        if cookie.get("Name") and cookie.get("Value"):
            self.headers["Cookie"] = "%s=%s" % (cookie["Name"], cookie["Value"])
        api_key = sc.get("ApiKey")
        if api_key:
            self.headers["ApiKey"] = api_key

    def call(self, query, variables=None):
        body = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
        req = urllib.request.Request(self.url, data=body, headers=self.headers)
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)

# ---- path resolution (config-driven, cross-platform) ------------------
def get_general_config(stash):
    q = "{configuration{general{ffmpegPath ffprobePath generatedPath}}}"
    return stash.call(q)["data"]["configuration"]["general"]

def resolve_binary(name, configured, generated_path):
    """Locate ffmpeg/ffprobe. Prefer Stash's configured path; else the bundled
    binary in the config dir; else PATH. Handles the .exe suffix on Windows."""
    cands = []
    if configured:
        cands.append(configured)
    if generated_path:
        # Stash downloads bundled ffmpeg into the config dir. When generatedPath
        # is the default (<configdir>/generated), its parent is the config dir.
        cands.append(os.path.join(os.path.dirname(generated_path), name))
    home = os.path.expanduser("~")
    cands.append(os.path.join(home, ".stash", name))
    cands.append(os.path.join(home, ".config", "stash", name))
    on_path = shutil.which(name)
    if on_path:
        cands.append(on_path)
    for c in cands:
        if not c:
            continue
        if os.path.isfile(c):
            return c
        if os.path.isfile(c + ".exe"):
            return c + ".exe"
    return None

# ---- scene lookup -----------------------------------------------------
def scene_info(stash, scene_id):
    q = ("query($id:ID!){findScene(id:$id){files{path fingerprints{type value}}}}")
    d = stash.call(q, {"id": str(scene_id)})
    node = (d.get("data") or {}).get("findScene") or {}
    files = node.get("files") or []
    if not files:
        return None, None
    f = files[0]
    oshash = None
    for fp in (f.get("fingerprints") or []):
        if fp.get("type") == "oshash":
            oshash = fp.get("value")
            break
    return f.get("path"), oshash

# ---- generation (N*N input-seeks -> tile=NxN) -------------------------
def probe_duration(ffprobe, path):
    try:
        s = subprocess.check_output(
            [ffprobe, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", path],
            stderr=subprocess.DEVNULL).decode().strip()
        return float(s)
    except Exception:
        return 0.0

def out_path(oshash, grid):
    # Grid size is part of the filename so different sizes cache independently.
    return os.path.join(GEN_DIR, "%s_%dx%d.jpg" % (oshash, grid, grid))

def generate_sheet(ffmpeg, ffprobe, path, oshash, grid):
    """Build the N x N contact sheet; return its path, or None (unmounted/failed)."""
    if not oshash:
        return None
    dst = out_path(oshash, grid)
    if os.path.exists(dst):
        return dst
    if not path or not os.path.isfile(path):
        return None  # drive not mounted etc. -> retry next time
    dur = probe_duration(ffprobe, path)
    if dur <= 0:
        return None
    os.makedirs(GEN_DIR, exist_ok=True)
    tmp = os.path.join(GEN_DIR, ".%s_%d.tmp" % (oshash, grid))
    os.makedirs(tmp, exist_ok=True)
    try:
        cells = grid * grid
        vf_cell = ("scale=%d:%d:force_original_aspect_ratio=decrease,"
                   "pad=%d:%d:(ow-iw)/2:(oh-ih)/2:color=black"
                   % (CELL_W, CELL_H, CELL_W, CELL_H))
        for i in range(cells):
            t = dur * (i + 0.5) / cells  # cell midpoint (avoid opening black / end credits)
            subprocess.run(
                [ffmpeg, "-v", "error", "-y", "-ss", "%.3f" % t, "-i", path,
                 "-frames:v", "1", "-vf", vf_cell, "-q:v", JPEG_Q,
                 os.path.join(tmp, "f_%03d.jpg" % i)],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(
            [ffmpeg, "-v", "error", "-y", "-framerate", "1",
             "-i", os.path.join(tmp, "f_%03d.jpg"),
             "-vf", "tile=%dx%d" % (grid, grid),
             "-frames:v", "1", "-q:v", JPEG_Q, dst],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return dst if os.path.exists(dst) else None

# ---- LRU cache --------------------------------------------------------
def prune(cache_max):
    if cache_max <= 0 or not os.path.isdir(GEN_DIR):
        return 0
    entries = []
    for fn in os.listdir(GEN_DIR):
        if not fn.endswith(".jpg"):
            continue
        p = os.path.join(GEN_DIR, fn)
        try:
            entries.append((os.stat(p).st_mtime, p))
        except OSError:
            pass
    excess = len(entries) - cache_max
    if excess <= 0:
        return 0
    entries.sort()  # oldest mtime first
    removed = 0
    for _mtime, p in entries[:excess]:
        try:
            os.remove(p)
            removed += 1
        except OSError:
            pass
    return removed

# ---- plugin settings --------------------------------------------------
def _plugin_settings(stash):
    try:
        d = stash.call('{configuration{plugins}}')
        plugins = (d.get("data") or {}).get("configuration", {}).get("plugins") or {}
        return plugins.get("MosaicPoster") or {}
    except Exception:
        return {}

def get_cache_max(stash, args):
    if args.get("cache_max") is not None:
        try:
            return int(args["cache_max"])
        except (TypeError, ValueError):
            pass
    val = _plugin_settings(stash).get("cacheMax")
    if val is not None:
        try:
            return int(val)
        except (TypeError, ValueError):
            pass
    return DEFAULT_CACHE_MAX

def get_grid(stash, args):
    # Prefer an explicit per-call grid (frontend passes it); otherwise use the
    # gridSize plugin setting (so the Backfill task honours the configured size).
    if args.get("n") is not None:
        return clamp_grid(args.get("n"))
    return clamp_grid(_plugin_settings(stash).get("gridSize"))

# ---- backfill (task) --------------------------------------------------
def backfill(stash, ffmpeg, ffprobe, limit, grid):
    per, page, made = 100, 1, 0
    while True:
        q = ("query($p:Int!,$n:Int!){findScenes(filter:{per_page:$n,page:$p}){"
             "scenes{id files{path fingerprints{type value}}}}}")
        scenes = (((stash.call(q, {"p": page, "n": per}).get("data") or {})
                   .get("findScenes") or {}).get("scenes") or [])
        if not scenes:
            break
        for s in scenes:
            files = s.get("files") or []
            if not files:
                continue
            f = files[0]
            oshash = None
            for fp in (f.get("fingerprints") or []):
                if fp.get("type") == "oshash":
                    oshash = fp.get("value")
                    break
            if not oshash or os.path.exists(out_path(oshash, grid)):
                continue
            if generate_sheet(ffmpeg, ffprobe, f.get("path"), oshash, grid):
                made += 1
                if limit and made >= limit:
                    return made
        page += 1
    return made

# ---- dispatch ---------------------------------------------------------
def main():
    payload = read_payload()
    args = payload.get("args") or {}
    sc = payload.get("server_connection") or {}
    mode = args.get("mode") or "generate"

    try:
        stash = Stash(sc)
        cfg = get_general_config(stash)
    except Exception as e:
        return emit_error("config error: %s" % e)

    ffmpeg = resolve_binary("ffmpeg", cfg.get("ffmpegPath"), cfg.get("generatedPath"))
    ffprobe = resolve_binary("ffprobe", cfg.get("ffprobePath"), cfg.get("generatedPath"))
    cache_max = get_cache_max(stash, args)

    if mode == "debug":
        return emit_output({
            "server_conn_keys": sorted(sc.keys()),
            "ffmpeg": ffmpeg, "ffprobe": ffprobe,
            "gen_dir": GEN_DIR, "cache_max": cache_max, "config": cfg,
        })

    if mode == "prune":
        return emit_output({"removed": prune(cache_max)})

    grid = get_grid(stash, args)

    if mode == "backfill":
        if not ffmpeg or not ffprobe:
            return emit_error("ffmpeg/ffprobe not found")
        try:
            limit = int(args.get("limit")) if args.get("limit") else None
        except (TypeError, ValueError):
            limit = None
        made = backfill(stash, ffmpeg, ffprobe, limit, grid)
        prune(cache_max)
        return emit_output({"made": made, "grid": grid})

    if mode in ("generate", "warm"):
        ids = args.get("scene_ids")
        if not ids:
            one = args.get("scene_id")
            ids = [one] if one else []
        if not ids:
            return emit_error("scene_id or scene_ids required")
        if not ffmpeg or not ffprobe:
            return emit_error("ffmpeg/ffprobe not found")
        done, missing = [], []
        for sid in ids:
            path, oshash = scene_info(stash, sid)
            if not oshash:
                missing.append(sid)
                continue
            if generate_sheet(ffmpeg, ffprobe, path, oshash, grid):
                done.append(oshash)
            else:
                missing.append(sid)
        prune(cache_max)
        return emit_output({"done": done, "missing": missing, "grid": grid})

    return emit_error("unknown mode: %s" % mode)

if __name__ == "__main__":
    main()
