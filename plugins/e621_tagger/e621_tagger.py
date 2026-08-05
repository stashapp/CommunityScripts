import hashlib
import json
import re
import sys
import time
from typing import List, Optional, Set

import requests
import stashapi.log as log
from stashapi.stashapp import StashInterface

PLUGIN_ID = "e621_tagger"

MD5_RE = re.compile(r"^[a-f0-9]{32}$")

TAG_DONE = "e621_tagged"
TAG_FAILED = "e621_tag_failed"
TAG_NOT_FOUND = "e621_not_found"

# e621 rejects requests whose User-Agent lacks a descriptive project + contact
# component. Anything generic (curl/*, python-requests/*, bare project names,
# or an impersonated browser string) gets a 403 and an HTML "API misuse" page.
DEFAULT_USER_AGENT = "Stash-e621-Tagger/1.1 (by anonymous on e621)"
DEFAULT_DELAY_MS = 1000
MIN_DELAY_MS = 500  # e621 hard-caps at 2 req/s

# Custom GraphQL fragments to avoid stashapi's default fragments which reference
# fields that have been removed/renamed in newer Stash versions:
#   - `Folder.basename`   (removed)
#   - `Image.checksum`    (removed; now on file fingerprints)
#   - `Scene.checksum`    (deprecated/removed; now on file fingerprints)
IMAGE_FRAGMENT = """
id
organized
visual_files {
  ... on ImageFile {
    id
    path
    basename
    fingerprints {
      type
      value
    }
  }
  ... on VideoFile {
    id
    path
    basename
    fingerprints {
      type
      value
    }
  }
}
tags {
  id
  name
}
"""

SCENE_FRAGMENT = """
id
organized
files {
  id
  path
  basename
  fingerprints {
    type
    value
  }
}
tags {
  id
  name
}
"""


# ---------------------------------------------------------------------------
# e621 transport
# ---------------------------------------------------------------------------

class E621Blocked(Exception):
    """Transport-level rejection (403/429/503/HTML block page).

    This is NOT a per-item failure -- it means every subsequent request will
    fail too, so the run aborts instead of poisoning the library with
    e621_tag_failed tags.
    """


E621_SESSION = requests.Session()
_request_delay = DEFAULT_DELAY_MS / 1000.0
_last_request_ts = 0.0


def configure_e621(user_agent, delay_ms) -> None:
    global _request_delay

    ua = (user_agent or "").strip() or DEFAULT_USER_AGENT
    E621_SESSION.headers.update({"User-Agent": ua, "Accept": "application/json"})

    try:
        delay_ms = int(delay_ms)
    except (TypeError, ValueError):
        delay_ms = DEFAULT_DELAY_MS
    if delay_ms < MIN_DELAY_MS:
        log.warning(
            f"RequestDelayMs={delay_ms} is below e621's rate cap; clamping to {MIN_DELAY_MS}ms"
        )
        delay_ms = MIN_DELAY_MS
    _request_delay = delay_ms / 1000.0

    log.info(f"e621 configured: UA={ua!r}, delay={_request_delay:.2f}s")
    if "(" not in ua:
        log.warning(
            "User-Agent has no '(by <name> on e621)' component -- e621 will "
            "likely reject every request with a 403."
        )


def _throttle() -> None:
    global _last_request_ts
    wait = _request_delay - (time.monotonic() - _last_request_ts)
    if wait > 0:
        time.sleep(wait)
    _last_request_ts = time.monotonic()


def e621_lookup(md5: str) -> Optional[dict]:
    """Return the post dict for an md5, or None if e621 has no such post.

    Raises E621Blocked when the request is refused at the transport level.
    """
    _throttle()
    try:
        r = E621_SESSION.get(
            "https://e621.net/posts.json", params={"md5": md5}, timeout=15
        )
    except requests.RequestException as e:
        raise E621Blocked(f"network error: {e}") from e

    if r.status_code in (403, 429, 503):
        raise E621Blocked(f"HTTP {r.status_code}")
    if r.status_code == 404:
        return None
    if r.status_code >= 400:
        raise E621Blocked(f"HTTP {r.status_code}")

    if "application/json" not in (r.headers.get("Content-Type") or ""):
        raise E621Blocked("non-JSON response (block page)")

    try:
        body = r.json()
    except ValueError as e:
        raise E621Blocked(f"malformed JSON: {e}") from e

    post = body.get("post")
    if post:
        return post
    posts = body.get("posts") or []
    return posts[0] if posts else None


# ---------------------------------------------------------------------------
# Stash helpers
# ---------------------------------------------------------------------------

def _update_image_minimal(stash: StashInterface, payload: dict) -> dict:
    """Direct GraphQL update that only returns `id` so we don't depend on
    stashapi's default mutation fragments (which reference removed fields)."""
    query = """
    mutation ImageUpdate($input: ImageUpdateInput!) {
        imageUpdate(input: $input) { id }
    }
    """
    return stash.call_GQL(query, {"input": payload})


def _update_scene_minimal(stash: StashInterface, payload: dict) -> dict:
    query = """
    mutation SceneUpdate($input: SceneUpdateInput!) {
        sceneUpdate(input: $input) { id }
    }
    """
    return stash.call_GQL(query, {"input": payload})


def _get_item(stash: StashInterface, item_type: str, item_id: str) -> Optional[dict]:
    if item_type == "image":
        return stash.find_image(item_id, fragment=IMAGE_FRAGMENT)
    return stash.find_scene(item_id, fragment=SCENE_FRAGMENT)


def _update_item(stash: StashInterface, item_type: str, payload: dict) -> dict:
    if item_type == "image":
        return _update_image_minimal(stash, payload)
    return _update_scene_minimal(stash, payload)


def _item_files(item_type: str, obj: dict) -> list:
    if item_type == "image":
        return obj.get("visual_files") or []
    return obj.get("files") or obj.get("scene_files") or []


def _extract_file_md5(file_data: dict) -> Optional[str]:
    """Pull a valid MD5 string from a file dict via the modern `fingerprints`
    array. Falls back to a legacy `checksum` field if it happens to exist."""
    if not file_data:
        return None
    for fp in file_data.get("fingerprints") or []:
        fp_type = (fp.get("type") or "").lower()
        fp_value = fp.get("value") or ""
        if fp_type == "md5" and MD5_RE.match(fp_value):
            return fp_value
    cs = file_data.get("checksum")
    if cs and MD5_RE.match(cs):
        return cs
    return None


def _md5_candidates(item_type: str, obj: dict, item_id: str) -> List[str]:
    """Ordered, de-duplicated MD5s to try against e621.

    Fingerprint first (it is the actual content hash Stash computed), then the
    filename stem -- files downloaded from e621 are named by md5, and that name
    survives re-encoding when the content hash would not.
    """
    files = _item_files(item_type, obj)
    if not files:
        log.error(f"No files found for {item_type} {item_id}; cannot compute md5")
        return []

    file_data = files[0]
    candidates: List[str] = []

    fp_md5 = _extract_file_md5(file_data)
    if fp_md5:
        candidates.append(fp_md5)

    basename = file_data.get("basename") or ""
    name_md5 = basename.split(".")[0].lower() if basename else ""
    if MD5_RE.match(name_md5) and name_md5 not in candidates:
        candidates.append(name_md5)

    if candidates:
        return candidates

    path = file_data.get("path")
    if not path:
        log.error(f"No path for {item_type} {item_id}; cannot compute md5")
        return []
    try:
        md5_hash = hashlib.md5()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                md5_hash.update(chunk)
        computed = md5_hash.hexdigest()
        log.info(f"Generated content MD5 for {item_type} {item_id}: {computed}")
        return [computed]
    except Exception as e:
        log.error(f"Failed to generate MD5 for {item_type} {item_id}: {e}")
        return []


# ---------------------------------------------------------------------------
# Tag / studio / performer resolution (cached)
# ---------------------------------------------------------------------------

_TAG_CACHE = {}
_STUDIO_CACHE = {}
_PERFORMER_CACHE = {}


def get_or_create_tag(stash: StashInterface, tag_name: str) -> Optional[dict]:
    tag_name = (tag_name or "").strip()
    if not tag_name:
        log.error("Attempted to create tag with empty name")
        return None

    if tag_name in _TAG_CACHE:
        return _TAG_CACHE[tag_name]

    existing = stash.find_tags(f={"name": {"value": tag_name, "modifier": "EQUALS"}})
    if existing:
        _TAG_CACHE[tag_name] = existing[0]
        return existing[0]

    parts = tag_name.split(":")
    parent_id = None
    for i in range(len(parts)):
        current_name = ":".join(parts[: i + 1]).strip()
        if not current_name:
            continue

        if current_name in _TAG_CACHE:
            parent_id = _TAG_CACHE[current_name]["id"]
            continue

        existing = stash.find_tags(
            f={"name": {"value": current_name, "modifier": "EQUALS"}}
        )
        if not existing:
            create_data = {"name": current_name}
            if parent_id:
                create_data["parent_ids"] = [parent_id]
            try:
                new_tag = stash.create_tag(create_data)
                if not new_tag:
                    log.error(f"Failed to create tag: {current_name}")
                    return None
                parent_id = new_tag["id"]
            except Exception as e:
                log.error(f"Error creating tag {current_name}: {e}")
                return None
        else:
            parent_id = existing[0]["id"]
        _TAG_CACHE[current_name] = {"id": parent_id}

    result = {"id": parent_id}
    _TAG_CACHE[tag_name] = result
    return result


def get_or_create_studio(stash: StashInterface, name: str) -> Optional[dict]:
    name = (name or "").strip()
    if not name:
        return None
    if name in _STUDIO_CACHE:
        return _STUDIO_CACHE[name]
    studios = stash.find_studios(f={"name": {"value": name, "modifier": "EQUALS"}})
    studio = studios[0] if studios else stash.create_studio({"name": name})
    _STUDIO_CACHE[name] = studio
    return studio


def get_or_create_performer(stash: StashInterface, name: str) -> Optional[dict]:
    name = (name or "").strip()
    if not name:
        return None
    if name in _PERFORMER_CACHE:
        return _PERFORMER_CACHE[name]
    performers = stash.find_performers(
        f={"name": {"value": name, "modifier": "EQUALS"}}
    )
    performer = performers[0] if performers else stash.create_performer({"name": name})
    _PERFORMER_CACHE[name] = performer
    return performer


# ---------------------------------------------------------------------------
# Item processing
# ---------------------------------------------------------------------------

def _mark_with_tag(
    stash: StashInterface, item_type: str, item_id: str, obj: dict, tag_name: str
) -> bool:
    """Add a bookkeeping tag while preserving the item's existing tags."""
    marker = get_or_create_tag(stash, tag_name)
    if not marker:
        return False
    tag_ids = {marker["id"]} | {t["id"] for t in obj.get("tags") or []}
    try:
        _update_item(stash, item_type, {"id": item_id, "tag_ids": list(tag_ids)})
        log.info(f"Marked {item_type} {item_id} as {tag_name}")
        return True
    except Exception as e:
        log.error(f"Failed to mark {item_type} {item_id} as {tag_name}: {e}")
        return False


def _apply_post(
    stash: StashInterface, item_type: str, item_id: str, obj: dict, post: dict
) -> bool:
    post_tags = post.get("tags") or {}
    post_url = f"https://e621.net/posts/{post['id']}"

    done_tag = get_or_create_tag(stash, TAG_DONE)
    tag_ids = {done_tag["id"]} if done_tag else set()

    for cat in ("general", "species", "artist", "copyright", "meta"):
        for tag in post_tags.get(cat) or []:
            clean_tag = (tag or "").strip()
            if not clean_tag:
                continue
            stash_tag = get_or_create_tag(stash, clean_tag)
            if stash_tag and stash_tag.get("id"):
                tag_ids.add(stash_tag["id"])

    studio_id = None
    artists = post_tags.get("artist") or []
    if artists:
        studio = get_or_create_studio(stash, artists[0])
        if studio:
            studio_id = studio["id"]

    performer_ids = []
    for char in post_tags.get("character") or []:
        perf = get_or_create_performer(stash, char)
        if perf:
            performer_ids.append(perf["id"])

    payload = {
        "id": item_id,
        "organized": True,
        "urls": [post_url],
        "tag_ids": list(tag_ids),
        "performer_ids": performer_ids,
    }
    if studio_id:
        payload["studio_id"] = studio_id

    try:
        _update_item(stash, item_type, payload)
        log.info(f"Tagged {item_type} {item_id} from {post_url}")
        return True
    except Exception as e:
        log.error(f"Update failed for {item_type} {item_id}: {e}")
        return False


def process_item(
    stash: StashInterface, item_type: str, item_id: str, skip_tag_ids: Set[str]
) -> bool:
    """Return True if the item was updated or marked, False if left untouched.

    Propagates E621Blocked so the caller can abort the whole run.
    """
    obj = _get_item(stash, item_type, item_id)
    if not obj:
        return False

    current_tag_ids = {t["id"] for t in obj.get("tags") or []}
    if current_tag_ids & skip_tag_ids:
        log.debug(f"Skipping {item_type} {item_id} - already has a skip tag")
        return False

    candidates = _md5_candidates(item_type, obj, item_id)
    if not candidates:
        return _mark_with_tag(stash, item_type, item_id, obj, TAG_FAILED)

    post = None
    for md5 in candidates:
        post = e621_lookup(md5)
        if post:
            break

    if not post:
        # Marked so it is not re-queried on every subsequent pass. Remove the
        # e621_not_found tag in the UI to retry these later.
        return _mark_with_tag(stash, item_type, item_id, obj, TAG_NOT_FOUND)

    return _apply_post(stash, item_type, item_id, obj, post)


# ---------------------------------------------------------------------------
# Scanning
# ---------------------------------------------------------------------------

def _build_filter(skip_tag_ids, exclude_organized):
    f = {}
    if skip_tag_ids:
        f["tags"] = {
            "value": [],
            "excludes": list(skip_tag_ids),
            "modifier": "INCLUDES_ALL",
            "depth": -1,
        }
    if exclude_organized:
        f["organized"] = False
    return f


def count_items(
    client: StashInterface, item_type: str, skip_tag_ids, exclude_organized: bool
) -> int:
    item_filter = _build_filter(skip_tag_ids, exclude_organized)
    pagination = {"page": 1, "per_page": 0, "sort": "created_at", "direction": "ASC"}
    try:
        if item_type == "image":
            total, _ = client.find_images(
                f=item_filter, filter=pagination, get_count=True, fragment=IMAGE_FRAGMENT
            )
        else:
            total, _ = client.find_scenes(
                f=item_filter, filter=pagination, get_count=True, fragment=SCENE_FRAGMENT
            )
        return total
    except Exception as e:
        log.error(f"Failed to count {item_type}s: {e}")
        return 0


def find_page(
    client: StashInterface,
    item_type: str,
    skip_tag_ids,
    exclude_organized: bool,
    page: int,
    per_page: int,
) -> list:
    pagination = {
        "page": page,
        "per_page": per_page,
        "sort": "created_at",
        "direction": "ASC",
    }
    item_filter = _build_filter(skip_tag_ids, exclude_organized)
    if item_type == "image":
        return client.find_images(
            f=item_filter, filter=pagination, fragment=IMAGE_FRAGMENT
        )
    return client.find_scenes(f=item_filter, filter=pagination, fragment=SCENE_FRAGMENT)


def _load_settings(stash: StashInterface) -> dict:
    defaults = {
        "SkipTags": f"{TAG_DONE}, {TAG_FAILED}, {TAG_NOT_FOUND}",
        "ExcludeOrganized": False,
        "UserAgent": DEFAULT_USER_AGENT,
        "RequestDelayMs": DEFAULT_DELAY_MS,
    }
    try:
        raw = (stash.get_configuration().get("plugins") or {}).get(PLUGIN_ID) or {}
    except Exception as e:
        log.error(f"Could not read plugin configuration, using defaults: {e}")
        return defaults

    merged = dict(defaults)
    for key, value in raw.items():
        if key not in defaults or value is None:
            continue
        if isinstance(value, str) and not value.strip():
            continue
        merged[key] = value
    return merged


def main() -> None:
    log.info("Starting e621 tagger...")
    json_input = json.loads(sys.stdin.read())
    stash = StashInterface(json_input["server_connection"])

    settings = _load_settings(stash)
    configure_e621(settings["UserAgent"], settings["RequestDelayMs"])
    exclude_organized = bool(settings["ExcludeOrganized"])

    skip_tag_ids: Set[str] = set()
    for name in {TAG_DONE, TAG_FAILED, TAG_NOT_FOUND}:
        tag = get_or_create_tag(stash, name)
        if tag and tag.get("id"):
            skip_tag_ids.add(tag["id"])

    for name in [n.strip() for n in str(settings["SkipTags"]).split(",") if n.strip()]:
        found = stash.find_tags(f={"name": {"value": name, "modifier": "EQUALS"}})
        if found:
            skip_tag_ids.add(found[0]["id"])
        else:
            log.warning(f"SkipTags entry {name!r} does not exist in Stash; ignoring")

    per_page = 50

    log.info("Counting items...")
    num_images = count_items(stash, "image", skip_tag_ids, exclude_organized)
    num_scenes = count_items(stash, "scene", skip_tag_ids, exclude_organized)
    total = (num_images + num_scenes) or 1
    log.info(f"Items to process: {num_images} images + {num_scenes} scenes = {total}")

    processed_count = 0
    pass_num = 0
    blocked = False

    # Each pass re-queries from page 1 because tagging an item removes it from
    # the filtered result set, which shifts pagination underneath us.
    while not blocked:
        pass_num += 1
        pass_updated = 0
        log.info(f"Starting scanning pass #{pass_num}")

        for item_type in ("image", "scene"):
            page = 1
            while not blocked:
                try:
                    items = find_page(
                        stash, item_type, skip_tag_ids, exclude_organized, page, per_page
                    )
                except Exception as e:
                    log.error(f"[pass {pass_num}] failed to fetch {item_type} page {page}: {e}")
                    break

                if not items:
                    break
                log.info(
                    f"[pass {pass_num}] fetched {item_type} page {page}, count={len(items)}"
                )

                for item in items:
                    item_id = item.get("id")
                    if not item_id:
                        log.error(f"[pass {pass_num}] {item_type} without id on page {page}")
                        continue

                    try:
                        updated = process_item(stash, item_type, item_id, skip_tag_ids)
                    except E621Blocked as e:
                        log.error(
                            f"e621 refused the request ({e}). Aborting -- no items "
                            f"marked as failed. Check the UserAgent setting; it must "
                            f"look like 'Project/1.0 (by <name> on e621)'."
                        )
                        blocked = True
                        break
                    except Exception as e:
                        log.error(f"[pass {pass_num}] error on {item_type} {item_id}: {e}")
                        updated = False

                    if updated:
                        processed_count += 1
                        pass_updated += 1
                        log.progress(min(float(processed_count) / float(total), 1.0))

                if len(items) < per_page:
                    break
                page += 1

        log.info(f"Pass #{pass_num} finished. Items updated this pass: {pass_updated}")
        if pass_updated == 0:
            log.info("No items updated in last pass; finishing scan.")
            break

    if blocked:
        log.error(f"Run aborted after {processed_count} items.")
    else:
        log.info(f"Done. {processed_count} items processed.")
    log.progress(1.0)


if __name__ == "__main__":
    main()
