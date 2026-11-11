#!/usr/bin/env python3
"""
stash_metadata_embed.py
Stash plugin: Embed scene metadata into MKV/MP4 files using ffmpeg.
"""

import sys
import json
import os
import shutil
import subprocess
import tempfile
import urllib.request
import urllib.error


# ---------------------------------------------------------------------------
# Logging helpers (Stash raw interface log level prefixes)
# ---------------------------------------------------------------------------

def log_trace(msg):    print(f"\x01trace\x02{msg}", file=sys.stderr)
def log_debug(msg):    print(f"\x01debug\x02{msg}", file=sys.stderr)
def log_info(msg):     print(f"\x01info\x02{msg}",  file=sys.stderr)
def log_warn(msg):     print(f"\x01warn\x02{msg}",  file=sys.stderr)
def log_error(msg):    print(f"\x01error\x02{msg}", file=sys.stderr)
def log_progress(pct): print(f"\x01progress\x02{pct}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Locate ffmpeg
# ---------------------------------------------------------------------------

FFMPEG_SEARCH_PATHS = [
    "/usr/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/bin/ffmpeg",
]

def find_ffmpeg() -> str:
    """Return path to ffmpeg binary, or empty string if not found."""
    # Check PATH first
    found = shutil.which("ffmpeg")
    if found:
        return found
    # Fall back to known locations
    for p in FFMPEG_SEARCH_PATHS:
        if os.path.isfile(p) and os.access(p, os.X_OK):
            return p
    return ""


# ---------------------------------------------------------------------------
# Stash GraphQL helpers
# ---------------------------------------------------------------------------

SCENES_QUERY = """
query FindAllScenes($page: Int!) {
  findScenes(
    filter: { per_page: 100, page: $page, sort: "id", direction: ASC }
  ) {
    count
    scenes {
      id
      title
      details
      date
      rating100
      files {
        path
      }
      paths {
        screenshot
      }
      studio {
        name
      }
      performers {
        name
      }
      tags {
        name
      }
      urls
    }
  }
}
"""


def build_headers(session_cookie: dict) -> dict:
    headers = {"Content-Type": "application/json"}
    cookie_name  = session_cookie.get("Name", "session")
    cookie_value = session_cookie.get("Value", "")
    if cookie_value:
        headers["Cookie"] = f"{cookie_name}={cookie_value}"
    return headers


def gql(server_url: str, session_cookie: dict, query: str, variables: dict = None):
    payload = json.dumps({"query": query, "variables": variables or {}}).encode()
    req = urllib.request.Request(
        f"{server_url}/graphql",
        data=payload,
        headers=build_headers(session_cookie),
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def fetch_all_scenes(server_url: str, session_cookie: dict) -> list:
    scenes = []
    page = 1
    while True:
        result = gql(server_url, session_cookie, SCENES_QUERY, {"page": page})
        batch = result["data"]["findScenes"]["scenes"]
        scenes.extend(batch)
        total = result["data"]["findScenes"]["count"]
        log_info(f"Fetched page {page} ({len(scenes)}/{total} scenes)")
        if len(scenes) >= total:
            break
        page += 1
    return scenes


# ---------------------------------------------------------------------------
# ffmpeg embedding
# ---------------------------------------------------------------------------

def download_image(url: str, dest_path: str, session_cookie: dict) -> bool:
    try:
        headers = {}
        cookie_value = session_cookie.get("Value", "")
        if cookie_value:
            headers["Cookie"] = f"{session_cookie.get('Name', 'session')}={cookie_value}"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            with open(dest_path, "wb") as f:
                f.write(resp.read())
        return True
    except Exception as e:
        log_warn(f"Could not download cover image: {e}")
        return False


def embed_metadata(
    video_path: str,
    scene: dict,
    server_url: str,
    session_cookie: dict,
    embed_cover: bool,
    dry_run: bool,
    ffmpeg_path: str,
) -> bool:
    ext = os.path.splitext(video_path)[1].lower()
    if ext not in (".mkv", ".mp4"):
        log_debug(f"Skipping non-MKV/MP4 file: {video_path}")
        return False

    title       = scene.get("title") or ""
    comment     = scene.get("details") or ""
    date        = scene.get("date") or ""
    rating      = scene.get("rating100")
    studio      = (scene.get("studio") or {}).get("name", "")
    performers  = ", ".join(p["name"] for p in (scene.get("performers") or []))
    tags        = ", ".join(t["name"] for t in (scene.get("tags") or []))
    url         = (scene.get("urls") or [None])[0] or ""
    rating_str  = f"{rating / 10:.1f}" if rating is not None else ""

    log_info(f"Processing: {video_path}")
    if dry_run:
        log_info(
            f"  [DRY RUN] Would embed → title={title!r} date={date!r} "
            f"studio={studio!r} performers={performers!r} tags={tags!r}"
        )
        return True

    # Create temp dir on the same filesystem as the video to avoid cross-device issues
    tmp_dir    = tempfile.mkdtemp(dir=os.path.dirname(video_path))
    out_path   = os.path.join(tmp_dir, os.path.basename(video_path))
    cover_path = None

    try:
        screenshot_url = (scene.get("paths") or {}).get("screenshot", "")
        has_cover = False
        if embed_cover and screenshot_url:
            raw_cover  = os.path.join(tmp_dir, "cover_raw")
            cover_path = os.path.join(tmp_dir, "cover.jpg")
            if download_image(screenshot_url, raw_cover, session_cookie):
                # Always convert to JPEG — Stash serves WebP which MP4 cannot hold.
                conv = subprocess.run(
                    [ffmpeg_path, "-y", "-i", raw_cover,
                     "-vframes", "1", "-q:v", "2", cover_path],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                )
                if conv.returncode == 0 and os.path.isfile(cover_path):
                    has_cover = True
                else:
                    log_warn("Cover image conversion to JPEG failed, skipping cover")
                try: os.unlink(raw_cover)
                except Exception: pass

        cmd = [ffmpeg_path, "-y", "-i", video_path]

        if has_cover:
            cmd += ["-i", cover_path]

        cmd += ["-map", "0"]

        if has_cover:
            if ext == ".mkv":
                cmd += ["-map", "1",
                        "-attach", cover_path,
                        "-metadata:s:t", "mimetype=image/jpeg",
                        "-metadata:s:t", "filename=cover.jpg"]
            else:
                cmd += ["-map", "1", "-disposition:v:1", "attached_pic"]

        cmd += ["-c", "copy"]

        meta = {
            "title":        title,
            "comment":      comment,
            "date":         date,
            "artist":       performers,
            "album_artist": studio,
            "genre":        tags,
            "rating":       rating_str,
        }
        if url:
            meta["purl"] = url

        for k, v in meta.items():
            if v:
                cmd += ["-metadata", f"{k}={v}"]

        if ext == ".mp4":
            cmd += ["-movflags", "+faststart"]

        cmd.append(out_path)

        log_debug(f"ffmpeg cmd: {' '.join(cmd)}")
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        if result.returncode != 0:
            stderr_out = result.stderr.decode(errors="replace")
            log_error(f"ffmpeg failed (exit {result.returncode}) for {video_path}:\n{stderr_out}")
            return False

        # os.replace fails across different filesystems (e.g. Docker volumes).
        # Copy then delete is safe in all cases.
        try:
            os.replace(out_path, video_path)
        except OSError:
            shutil.copy2(out_path, video_path)
            os.unlink(out_path)
        log_info("  ✓ Metadata embedded successfully")
        return True

    except Exception as e:
        log_error(f"Unexpected error embedding {video_path}: {type(e).__name__}: {e}")
        return False

    finally:
        for f in [cover_path]:
            if f and os.path.exists(f):
                try: os.unlink(f)
                except Exception: pass
        if os.path.exists(out_path):
            try: os.unlink(out_path)
            except Exception: pass
        try: os.rmdir(tmp_dir)
        except Exception: pass


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    raw_input    = sys.stdin.read()
    plugin_input = {}
    if raw_input.strip():
        try:
            plugin_input = json.loads(raw_input)
        except json.JSONDecodeError:
            log_error("Failed to parse plugin input JSON")

    server_conn    = plugin_input.get("server_connection", {})
    session_cookie = server_conn.get("SessionCookie") or {}

    scheme = server_conn.get("Scheme", "http")
    port   = server_conn.get("Port", 9999)
    host   = server_conn.get("Host", "127.0.0.1")
    if host in ("0.0.0.0", ""):
        host = "127.0.0.1"

    server_url = f"{scheme}://{host}:{port}"

    args        = plugin_input.get("args", {})
    dry_run     = str(args.get("dry_run",     "false")).lower() in ("true", "1", "yes")
    embed_cover = str(args.get("embed_cover", "true")).lower() not in ("false", "0", "no")

    log_info("=== Stash Metadata Embedder starting ===")
    log_info(f"Server: {server_url}  |  dry_run={dry_run}  |  embed_cover={embed_cover}")

    # Locate ffmpeg and fail early with a clear message if missing
    ffmpeg_path = find_ffmpeg()
    if not ffmpeg_path:
        log_error(
            "ffmpeg not found! Checked PATH and: " + ", ".join(FFMPEG_SEARCH_PATHS) +
            "\nInstall ffmpeg or add it to PATH."
        )
        sys.exit(1)
    log_info(f"Using ffmpeg: {ffmpeg_path}")

    try:
        scenes = fetch_all_scenes(server_url, session_cookie)
    except Exception as e:
        log_error(f"Failed to fetch scenes from Stash: {e}")
        sys.exit(1)

    log_info(f"Found {len(scenes)} scene(s) to process")

    success_count = 0
    skip_count    = 0
    fail_count    = 0

    for idx, scene in enumerate(scenes):
        log_progress(idx / max(len(scenes), 1))

        files = scene.get("files") or []
        if not files:
            log_warn(f"Scene {scene['id']} has no files, skipping")
            skip_count += 1
            continue

        for file_info in files:
            video_path = file_info.get("path", "")
            if not video_path or not os.path.isfile(video_path):
                log_warn(f"File not found on disk: {video_path!r}")
                skip_count += 1
                continue

            ok = embed_metadata(
                video_path=video_path,
                scene=scene,
                server_url=server_url,
                session_cookie=session_cookie,
                embed_cover=embed_cover,
                dry_run=dry_run,
                ffmpeg_path=ffmpeg_path,
            )
            if ok:
                success_count += 1
            else:
                fail_count += 1

    log_progress(1.0)
    log_info(f"=== Done: {success_count} embedded, {skip_count} skipped, {fail_count} failed ===")

    print(json.dumps({
        "output": {
            "success": success_count,
            "skipped": skip_count,
            "failed":  fail_count,
        }
    }))


if __name__ == "__main__":
    main()
