#!/usr/bin/env python3
"""
autoScraper.py

External raw plugin for Stash that:
- Triggers on group hooks (e.g. Group.Create.Post).
- If the group has at least one URL, calls ScrapeGroupURL on the first URL.
- Merges scraped data back into the group via GroupUpdate:
  * Uses scraped values when present, otherwise keeps existing ones.
  * For studio/tags, only uses scraped entries where stored_id is not null.
  * Tag ids from scraped data are merged with existing tag ids (unique).

This script is designed to be run by Stash as a raw external plugin and
expects its input JSON on stdin (the standard Stash plugin FRAGMENT format).

Requires:
  - Python 3.7+
  - requests (pip install requests)
"""

import sys
import json
import time
from typing import Any, Dict, List, Optional

import requests
import stashapi.log as log
from stashapi.stashapp import StashInterface


START_TIME = time.time()


def exit_plugin(msg: Optional[str] = None, err: Optional[str] = None) -> None:
    if msg is None and err is None:
        msg = "plugin ended"
    log.debug(f"Execution time: {round(time.time() - START_TIME, 5)}s")
    output_json = {"output": msg, "error": err}
    print(json.dumps(output_json))
    sys.exit(0 if err is None else 1)


def load_fragment() -> Dict[str, Any]:
    try:
        raw = sys.stdin.read()
        fragment = json.loads(raw)
    except Exception as exc:
        log.error(f"Failed to read/parse plugin input: {exc}")
        exit_plugin(err="invalid plugin input")
    return fragment


def build_graphql_client(server: Dict[str, Any]) -> Dict[str, Any]:
    scheme = server.get("Scheme", "http")
    host = server.get("Host", "localhost")
    port = str(server.get("Port", "9999"))
    if host == "0.0.0.0":
        host = "localhost"

    url = f"{scheme}://{host}:{port}/graphql"
    cookies = {}
    session = server.get("SessionCookie") or {}
    if session.get("Value"):
        cookies["session"] = session["Value"]

    headers = {
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "DNT": "1",
    }

    return {"url": url, "headers": headers, "cookies": cookies}


def graphql_request(
    client: Dict[str, Any], query: str, variables: Dict[str, Any]
) -> Dict[str, Any]:
    payload = {"query": query, "variables": variables}
    try:
        resp = requests.post(
            client["url"],
            json=payload,
            headers=client["headers"],
            cookies=client["cookies"],
            timeout=20,
        )
    except Exception as exc:
        log.error(f"Error calling GraphQL: {exc}")
        exit_plugin(err="graphql request failed")

    if resp.status_code != 200:
        log.error(
            f"GraphQL HTTP {resp.status_code}: {resp.content!r}"
        )
        exit_plugin(err="graphql http error")

    data = resp.json()
    if "errors" in data and data["errors"]:
        log.error(f"GraphQL errors: {data['errors']}")
        exit_plugin(err="graphql errors")
    return data.get("data", {})


def seconds_from_duration(duration: Optional[str]) -> Optional[int]:
    """
    Convert a duration string like "3:16:00" or "16:00" into seconds.
    Returns None if duration is falsy or cannot be parsed.
    """
    if not duration:
        return None
    parts = duration.split(":")
    if not all(p.isdigit() for p in parts):
        return None
    try:
        if len(parts) == 3:
            h, m, s = map(int, parts)
        elif len(parts) == 2:
            h = 0
            m, s = map(int, parts)
        elif len(parts) == 1:
            h = 0
            m = 0
            s = int(parts[0])
        else:
            return None
    except ValueError:
        return None
    return h * 3600 + m * 60 + s


def coalesce(new_val: Any, old_val: Any) -> Any:
    """Return new_val if it is not None, otherwise old_val."""
    return new_val if new_val is not None else old_val


def build_group_update_input(
    group_id: int,
    existing: Dict[str, Any],
    scraped: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Build the GroupUpdateInput payload, merging scraped data with existing.
    """
    input_obj: Dict[str, Any] = {"id": str(group_id)}

    # Basic scalar fields
    input_obj["name"] = coalesce(scraped.get("name"), existing.get("name"))

    # aliases: scraped may be list or string; convert list -> comma separated string
    scraped_aliases = scraped.get("aliases")
    if isinstance(scraped_aliases, list):
        aliases_str = ", ".join(a for a in scraped_aliases if a)
    else:
        aliases_str = scraped_aliases
    input_obj["aliases"] = coalesce(aliases_str, existing.get("aliases") or "")

    # duration: convert scraped duration string to seconds; keep existing if scrape missing
    scraped_duration_seconds = seconds_from_duration(scraped.get("duration"))
    if scraped_duration_seconds is not None:
        input_obj["duration"] = scraped_duration_seconds
    elif existing.get("duration") is not None:
        input_obj["duration"] = existing.get("duration")

    input_obj["date"] = coalesce(scraped.get("date"), existing.get("date"))

    # Director
    input_obj["director"] = coalesce(scraped.get("director"), existing.get("director"))

    # URLs: prefer scraped urls when non-empty
    scraped_urls = scraped.get("urls") or []
    existing_urls = existing.get("urls") or []
    if scraped_urls:
        input_obj["urls"] = scraped_urls
    elif existing_urls:
        input_obj["urls"] = existing_urls

    # Synopsis
    input_obj["synopsis"] = coalesce(scraped.get("synopsis"), existing.get("synopsis"))

    # Studio: use scraped.studio.stored_id when present, else existing studio.id
    existing_studio = existing.get("studio") or {}
    existing_studio_id = existing_studio.get("id")
    scraped_studio = scraped.get("studio") or {}
    scraped_studio_id = scraped_studio.get("stored_id")
    studio_id = coalesce(scraped_studio_id, existing_studio_id)
    if studio_id is not None:
        input_obj["studio_id"] = str(studio_id)

    # Tags: union of existing tag ids and scraped tags with stored_id, filtering nulls
    existing_tags = existing.get("tags") or []
    existing_tag_ids: List[str] = [str(t.get("id")) for t in existing_tags if t.get("id") is not None]

    scraped_tags = scraped.get("tags") or []
    scraped_tag_ids: List[str] = [
        str(t.get("stored_id"))
        for t in scraped_tags
        if t.get("stored_id") is not None
    ]

    if existing_tag_ids or scraped_tag_ids:
        merged_ids: List[str] = []
        for tid in existing_tag_ids + scraped_tag_ids:
            if tid not in merged_ids:
                merged_ids.append(tid)
        input_obj["tag_ids"] = merged_ids

    # Images: only send when we actually have scraped data URIs; otherwise omit so we
    # don't overwrite existing images with null.
    front_image = scraped.get("front_image")
    if front_image:
        input_obj["front_image"] = front_image
    back_image = scraped.get("back_image")
    if back_image:
        input_obj["back_image"] = back_image

    return input_obj


def main() -> None:
    fragment = load_fragment()
    server = fragment.get("server_connection") or {}
    client = build_graphql_client(server)
    # Create StashInterface instance for consistency with other plugins,
    # even though this plugin currently uses direct GraphQL requests.
    _stash = StashInterface(server)

    args = fragment.get("args") or {}

    # When triggered by a hook, we get hookContext with type/id
    hook_ctx = args.get("hookContext") or {}
    hook_type = hook_ctx.get("type")
    hook_id = hook_ctx.get("id")

    if not hook_type or not hook_id:
        # Not a hook invocation – nothing to do.
        exit_plugin("No hook context; skipping.")

    if hook_type not in ("Group.Create.Post", "Group.Update.Post"):
        # Only act on group create/update
        exit_plugin(f"Ignoring hook type {hook_type}")

    try:
        group_id = int(hook_id)
    except (TypeError, ValueError):
        log.error(f"Invalid group id in hookContext: {hook_id!r}")
        exit_plugin(err="invalid group id")

    log.debug(f"Running GroupAutoScraper for group id {group_id} ({hook_type})")

    # 1. Fetch existing group
    find_group_query = """
    query FindGroup($id: ID!) {
      findGroup(id: $id) {
        id
        name
        aliases
        duration
        date
        director
        urls
        synopsis
        front_image_path
        back_image_path
        studio {
          id
        }
        tags {
          id
        }
        containing_groups {
          group {
            id
          }
          description
        }
      }
    }
    """

    data = graphql_request(client, find_group_query, {"id": str(group_id)})
    group = data.get("findGroup")
    if not group:
        log.error(f"No group found with id {group_id}")
        exit_plugin(err="group not found")

    urls = group.get("urls") or []
    if not urls:
        # Nothing to scrape, but not an error
        log.info(f"Group {group_id} has no URLs; nothing to do.")
        exit_plugin("group has no URLs; skipped")

    target_url = urls[0]

    # Only handle AdultDVD Empire URLs
    if "adultdvdempire.com/" not in target_url:
        log.info("AutoGroup only uses AdultDVDEmpire URLS. Exiting.")
        exit_plugin("non-AdultDVDEmpire URL; skipped")

    # 2. Scrape group URL
    scrape_query = """
    query ScrapeGroupURL($url: String!) {
      scrapeGroupURL(url: $url) {
        name
        aliases
        duration
        date
        rating
        director
        urls
        synopsis
        front_image
        back_image
        studio {
          stored_id
          name
          urls
        }
        tags {
          stored_id
          name
          remote_site_id
        }
      }
    }
    """

    scrape_data = graphql_request(client, scrape_query, {"url": target_url})
    scraped = scrape_data.get("scrapeGroupURL")
    if not scraped:
        log.error(f"ScrapeGroupURL returned no data for URL {target_url}")
        exit_plugin(err="scrapeGroupURL returned no data")

    # 3. Build GroupUpdate input
    # Compute tag additions and studio status for logging.
    existing_tags = group.get("tags") or []
    existing_tag_ids = {str(t.get("id")) for t in existing_tags if t.get("id") is not None}

    scraped_tags = scraped.get("tags") or []
    scraped_tag_ids = [
        str(t.get("stored_id"))
        for t in scraped_tags
        if t.get("stored_id") is not None
    ]
    tags_added_count = sum(1 for tid in scraped_tag_ids if tid not in existing_tag_ids)

    scraped_studio = scraped.get("studio") or {}
    scraped_studio_name = scraped_studio.get("name")
    scraped_studio_id = scraped_studio.get("stored_id")
    if scraped_studio_id is not None:
        studio_msg = "set studio"
    elif scraped_studio_name:
        studio_msg = f"could not set studio '{scraped_studio_name}', not found in studios"
    else:
        studio_msg = "no studio in scrape"

    update_input = build_group_update_input(group_id, group, scraped)

    # 4. Perform GroupUpdate
    update_query = """
    mutation GroupUpdate($input: GroupUpdateInput!) {
      groupUpdate(input: $input) {
        id
        name
      }
    }
    """

    result = graphql_request(client, update_query, {"input": update_input})
    updated = result.get("groupUpdate")
    if not updated:
        log.error("GroupUpdate did not return a group")
        exit_plugin(err="groupUpdate failed")

    log.info(
        f"Group {updated.get('id')} '{updated.get('name')}' updated. "
        f"Added {tags_added_count} tag(s), {studio_msg}."
    )
    exit_plugin(
        msg=f"Updated group {updated.get('id')} '{updated.get('name')}' from {target_url}"
    )


if __name__ == "__main__":
    main()

