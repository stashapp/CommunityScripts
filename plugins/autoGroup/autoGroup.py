"""Auto Group: creates and assigns Stash Groups from customizable filename regex rules.

Rules are a JSON array of {"pattern": <regex>, "group": <template>}. "pattern" is matched
against each scene's file basename (not the full path) with re.search; named capture groups
(?P<name>...) can be
referenced in "group" as {name}. A capture group literally named "index" is used as the
scene's scene_index inside the group (e.g. an episode number), if present and numeric.
First matching rule wins per scene.
"""
import json
import os
import re
import sys

import stashapi.log as log
from stashapi.stashapp import StashInterface

DEFAULT_RULES = [
    # "Title - Episode 4" / "Title_Part_6" / "Title (Ep. 1)" / "Title Day 2" / "Title Scene 3" -
    # flexible separators before/after the keyword (space, dash, underscore, dot, parenthesis).
    {
        "pattern": r"^(?P<series>.+?)[\s_\-(]+(?:Ep(?:isode)?|Part|Pt|Scene|Day)[\s_.]*#?[\s_.]*(?P<index>\d+)\)?",
        "group": "{series}",
    },
    # "Title 1 feat. Performer" - bare number immediately before "feat." as the anchor.
    {
        "pattern": r"^(?P<series>.+?)\s+(?P<index>\d+)\s+feat\.",
        "group": "{series}",
    },
]

PER_PAGE = 100


def load_settings(stash):
    config = stash.get_configuration().get("plugins", {}).get("autoGroup", {})
    settings = {"rules": None, "onlyUngrouped": True, "dryRun": True}
    settings.update({k: v for k, v in config.items() if v is not None})
    rules = DEFAULT_RULES
    if settings["rules"]:
        try:
            parsed = json.loads(settings["rules"])
            if isinstance(parsed, list) and parsed:
                rules = parsed
            else:
                log.warning("[AutoGroup] 'rules' non è una lista JSON valida, uso il default")
        except Exception as e:
            log.error(f"[AutoGroup] JSON delle regole non valido, uso il default: {e}")
    compiled = []
    for r in rules:
        try:
            compiled.append({"pattern": re.compile(r["pattern"], re.IGNORECASE), "group": r["group"]})
        except Exception as e:
            log.error(f"[AutoGroup] regola scartata (pattern non valido): {r} -> {e}")
    return compiled, bool(settings["onlyUngrouped"]), bool(settings["dryRun"])


def find_group(stash, name, cache):
    """Looks up an existing group by exact name only - never creates one."""
    if name in cache:
        return cache[name]
    found = stash.call_GQL(
        "query($f: GroupFilterType){ findGroups(group_filter:$f){ groups { id name } } }",
        {"f": {"name": {"value": name, "modifier": "EQUALS"}}},
    )
    groups = found["findGroups"]["groups"]
    gid = groups[0]["id"] if groups else None
    cache[name] = gid
    return gid


def create_group(stash, name, cache):
    created = stash.call_GQL(
        "mutation($input: GroupCreateInput!){ groupCreate(input:$input){ id } }",
        {"input": {"name": name}},
    )
    gid = created["groupCreate"]["id"]
    log.info(f"[AutoGroup] creato nuovo gruppo: '{name}'")
    cache[name] = gid
    return gid


def match_rule(rules, path):
    for rule in rules:
        m = rule["pattern"].search(path)
        if not m:
            continue
        gd = m.groupdict()
        try:
            group_name = rule["group"].format(**gd)
        except KeyError as e:
            log.error(f"[AutoGroup] placeholder {e} assente nel match di '{rule['group']}' su '{path}'")
            continue
        if not group_name.strip():
            continue
        scene_index = None
        if gd.get("index") is not None:
            try:
                scene_index = int(gd["index"])
            except ValueError:
                pass
        return group_name.strip(), scene_index
    return None, None


def run(stash):
    rules, only_ungrouped, dry_run = load_settings(stash)
    if not rules:
        log.error("[AutoGroup] nessuna regola valida configurata, esco")
        return

    skipped_already_grouped = 0
    checked_no_match = 0
    page = 1
    # name -> list of {id, scene_index, existing_groups, basename}
    pending = {}

    while True:
        res = stash.call_GQL(
            """query($page:Int!, $per:Int!){
                findScenes(filter:{page:$page, per_page:$per, sort:"id", direction:ASC}) {
                  count
                  scenes { id groups { group { id } } files { path } }
                }
            }""",
            {"page": page, "per": PER_PAGE},
        )
        scenes = res["findScenes"]["scenes"]
        if not scenes:
            break

        for s in scenes:
            existing_groups = s.get("groups") or []
            if only_ungrouped and existing_groups:
                skipped_already_grouped += 1
                continue
            files = s.get("files") or []
            if not files:
                continue
            path = files[0].get("path") or ""
            basename = os.path.basename(path)
            group_name, scene_index = match_rule(rules, basename)
            if not group_name:
                checked_no_match += 1
                continue
            pending.setdefault(group_name, []).append(
                {"id": s["id"], "scene_index": scene_index,
                 "existing_groups": existing_groups, "basename": basename}
            )

        if len(scenes) < PER_PAGE:
            break
        page += 1

    # A single new match only joins a group that already exists (e.g. one more episode of a
    # series already grouped); it never creates a brand new group on its own - a Group with one
    # scene in it is noise, not organization. 2+ new matches under the same name are enough
    # evidence of a real series to create (or reuse) the group for all of them.
    group_cache = {}
    matched = 0
    created_groups = 0
    skipped_single_no_existing = 0

    for group_name, items in pending.items():
        if len(items) == 1:
            gid = find_group(stash, group_name, group_cache)
            if gid is None:
                skipped_single_no_existing += 1
                continue
        else:
            gid = group_cache.get(group_name) or find_group(stash, group_name, group_cache)

        for item in items:
            matched += 1
            if dry_run:
                idx_note = f" (scene_index={item['scene_index']})" if item["scene_index"] is not None else ""
                verb = "aggiungerebbe a" if gid else "creerebbe"
                log.info(
                    f"[AutoGroup] (dry-run) scena {item['id']} '{item['basename']}' -> "
                    f"{verb} gruppo '{group_name}'{idx_note}"
                )
                continue
            if gid is None:
                gid = create_group(stash, group_name, group_cache)
                created_groups += 1
            keep = [
                {"group_id": g["group"]["id"], "scene_index": None}
                for g in item["existing_groups"]
                if g["group"]["id"] != gid
            ]
            stash.call_GQL(
                "mutation($input: SceneUpdateInput!){ sceneUpdate(input:$input){ id } }",
                {
                    "input": {
                        "id": item["id"],
                        "groups": keep + [{"group_id": gid, "scene_index": item["scene_index"]}],
                    }
                },
            )

    suffix = " (dry-run: nessuna modifica scritta)" if dry_run else ""
    log.info(
        f"[AutoGroup] fatto: {matched} scene assegnate ({created_groups} gruppi nuovi creati), "
        f"{skipped_single_no_existing} match singoli scartati (nessun gruppo esistente con quel nome), "
        f"{skipped_already_grouped} scene saltate perché già in un gruppo, "
        f"{checked_no_match} controllate ma nessuna regola combaciava{suffix}"
    )


def main():
    json_input = json.loads(sys.stdin.read())
    stash = StashInterface(json_input["server_connection"])
    mode = (json_input.get("args") or {}).get("mode")
    if mode == "run":
        run(stash)
    else:
        log.error(f"[AutoGroup] modalità sconosciuta: {mode!r}")


if __name__ == "__main__":
    main()
