"""Image GraphQL queries and tag application."""

from tagai_core import stash_client, stashlog
from tagai_core.config import PER_PAGE_IMAGE_DEFAULT


def get_images(ai_tagged_id, page=1, per_page=PER_PAGE_IMAGE_DEFAULT):
    """Untagged images (excluding those already carrying ``ai_tagged_id``)."""
    q = """
query MyQuery($excludes: [ID!], $page: Int, $per_page: Int) {
  findImages(
    image_filter: { tags: { modifier: INCLUDES_ALL, excludes: $excludes } }
    filter: { page: $page, per_page: $per_page }
  ) {
    images { id files { path } tags { id } }
    count
  }
}"""
    res = stash_client.gql(q, {"excludes": [ai_tagged_id], "page": page, "per_page": per_page})
    if "errors" in res:
        return [], 0
    data = res.get("data", {}).get("findImages") or {}
    return data.get("images") or [], data.get("count") or 0


def get_images_force(page=1, per_page=PER_PAGE_IMAGE_DEFAULT):
    q = """
query MyQuery($page: Int, $per_page: Int) {
  findImages(filter: { page: $page, per_page: $per_page }) {
    images { id files { path } tags { id } }
    count
  }
}"""
    res = stash_client.gql(q, {"page": page, "per_page": per_page})
    if "errors" in res:
        return [], 0
    data = res.get("data", {}).get("findImages") or {}
    return data.get("images") or [], data.get("count") or 0


def get_images_w_tag(flag_tag_id, page=1, per_page=PER_PAGE_IMAGE_DEFAULT):
    q = """
query MyQuery($value: [ID!], $page: Int, $per_page: Int) {
  findImages(
    image_filter: { tags: { modifier: INCLUDES_ALL, value: $value } }
    filter: { page: $page, per_page: $per_page }
  ) {
    images { id files { path } tags { id } }
    count
  }
}"""
    res = stash_client.gql(q, {"value": [flag_tag_id], "page": page, "per_page": per_page})
    if "errors" in res:
        return [], 0
    data = res.get("data", {}).get("findImages") or {}
    return data.get("images") or [], data.get("count") or 0


def apply_tags(img_id, new_tag_ids, exclude_tag_id=None, ai_tagged_id=None):
    """Merge new tags onto an image, dropping ``exclude_tag_id`` and adding
    ``ai_tagged_id``."""
    new_tag_ids = [t for t in new_tag_ids if t]
    if ai_tagged_id:
        new_tag_ids.append(ai_tagged_id)
    if not new_tag_ids:
        stashlog.log.info("No tags to apply.")
        return

    q = """query($id:ID!){ findImage(id:$id){ tags{id} } }"""
    r = stash_client.gql(q, {"id": img_id})
    existing = [
        t["id"]
        for t in r.get("data", {}).get("findImage", {}).get("tags", [])
        if t["id"] != exclude_tag_id
    ]

    final = list(set(existing + new_tag_ids))

    q = """mutation($id:ID!, $tags:[ID!]!){
      imageUpdate(input:{id:$id, tag_ids:$tags}){id}
    }"""
    stash_client.gql(q, {"id": img_id, "tags": final})


# ========================================================================== #
# 5. VIDEO (SCENE) PIPELINE
# ========================================================================== #
