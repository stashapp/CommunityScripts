"""Auto Group: creates and assigns Stash Groups from customizable filename regex rules.

Rules are a JSON array of {"pattern": <regex>, "group": <template>}. "pattern" is matched
against each scene's file basename (not the full path) with re.search; named capture groups
(?P<name>...) can be
referenced in "group" as {name}. A capture group literally named "index" is used as the
scene's scene_index inside the group (e.g. an episode number), if present and numeric.
First matching rule wins per scene.
"""
import collections
import json
import os
import re
import sys

import stashapi.log as log
from stashapi.stashapp import StashInterface

# Separators accepted before/after a keyword: space, underscore, hyphen, en/em dash, "(".
SEP = r"[\s_\-\u2013\u2014(]+"

DEFAULT_RULES = [
    # "Title Day 3 (Scene 2)" - the day is the group, the scene number is the position inside it.
    {
        "pattern": r"^(?P<series>.+?)" + SEP + r"Day[\s_.]*#?[\s_.]*(?P<day>\d+)[\s_.\-\u2013\u2014(]*Scene[\s_.]*#?[\s_.]*(?P<index>\d+)\)?",
        "group": "{series} - Day {day}",
    },
    # "Title - Scene 1 - Part 3 - Subtitle" - two-level numbering. Each scene becomes its own group
    # ("Title - Scene 1") and the part number is the position inside it, so parts of different scenes
    # never share an index.
    {
        "pattern": r"^(?P<series>.+?)" + SEP + r"Scene[\s_.]*#?[\s_.]*(?P<scene>\d+)\b.*?"
                   + SEP + r"(?:Part|Pt)[\s_.]*#?[\s_.]*(?P<index>\d+)\)?",
        "group": "{series} - Scene {scene}",
    },
    # "Title - Episode 4" / "Title_Part_6" / "Title (Ep. 1)" / "Title Day 2" / "Title Scene 3" -
    # flexible separators before/after the keyword (space, dash, underscore, dot, parenthesis).
    {
        "pattern": r"^(?P<series>.+?)" + SEP + r"(?:Ep(?:isode)?|Part|Pt|Scene|Day)[\s_.]*#?[\s_.]*(?P<index>\d+)\)?",
        "group": "{series}",
    },
    # "Title 1 feat. Performer" - bare number immediately before "feat." as the anchor.
    {
        "pattern": r"^(?P<series>.+?)\s+(?P<index>\d+)\s+feat\.",
        "group": "{series}",
    },
]

# Characters trimmed from both ends of a generated group name (separators left over by the pattern).
NAME_TRIM = " \t_-\u2013\u2014("

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
    return compile_rules(rules), bool(settings["onlyUngrouped"]), bool(settings["dryRun"])


def compile_rules(rules):
    compiled = []
    for r in rules:
        try:
            compiled.append({"pattern": re.compile(r["pattern"], re.IGNORECASE), "group": r["group"]})
        except Exception as e:
            log.error(f"[AutoGroup] regola scartata (pattern non valido): {r} -> {e}")
    return compiled


# A group name taken from a filename often differs slightly from an existing group's name: other
# capitalisation ("KlikKlok" / "Klikklok"), different spacing ("HookupHotshot" / "Hookup Hotshot"), or a
# studio prefix ("Studio - Show" / "Show"). Names are compared ignoring case and punctuation, and the
# part after the first " - " is also tried (when long enough) so such scenes join the existing group
# instead of creating a near-duplicate that splits the series.
MIN_TAIL_LEN = 6


def norm_name(name):
    return re.sub(r"\W+", "", name.casefold())


class Groups:
    """Resolves group names against existing Stash groups; creates one only when asked to."""

    def __init__(self, stash):
        self.stash = stash
        self.cache = {}   # looked-up name -> group id or None
        self.names = {}   # group id -> the existing group's real name
        self.index = {}   # normalised name -> [{"id", "name"}, ...]
        res = stash.call_GQL("query{ findGroups(filter:{per_page:-1}){ groups { id name } } }")
        for g in res["findGroups"]["groups"]:
            self.index.setdefault(norm_name(g["name"]), []).append(g)

    def similar(self, name):
        candidates = [name]
        _head, sep, tail = name.partition(" - ")
        if sep and len(norm_name(tail)) >= MIN_TAIL_LEN:
            candidates.append(tail)
        for candidate in candidates:
            found = self.index.get(norm_name(candidate), [])
            if len(found) == 1:
                return found[0]
            if len(found) > 1:
                log.warning(f"[AutoGroup] '{name}': più gruppi esistenti con nome simile a '{candidate}', non unisco")
                return None
        return None

    def find(self, name):
        """Existing group id for this name (exact first, then a similar name), else None. Never creates."""
        if name in self.cache:
            return self.cache[name]
        found = self.stash.call_GQL(
            "query($f: GroupFilterType){ findGroups(group_filter:$f){ groups { id name } } }",
            {"f": {"name": {"value": name, "modifier": "EQUALS"}}},
        )["findGroups"]["groups"]
        match = found[0] if found else self.similar(name)
        if match and not found:
            log.info(f"[AutoGroup] '{name}' ~ gruppo esistente '{match['name']}' (nome simile)")
        gid = match["id"] if match else None
        if match:
            self.names[gid] = match["name"]
        self.cache[name] = gid
        return gid

    def create(self, name):
        created = self.stash.call_GQL(
            "mutation($input: GroupCreateInput!){ groupCreate(input:$input){ id } }",
            {"input": {"name": name}},
        )
        gid = created["groupCreate"]["id"]
        log.info(f"[AutoGroup] creato nuovo gruppo: '{name}'")
        self.cache[name] = gid
        self.names[gid] = name
        return gid


def match_rule(rules, path):
    for rule in rules:
        m = rule["pattern"].search(path)
        if not m:
            continue
        gd = m.groupdict()
        fmt = {k: ("" if v is None else v) for k, v in gd.items()}
        try:
            group_name = rule["group"].format(**fmt)
        except KeyError as e:
            log.error(f"[AutoGroup] placeholder {e} assente nel match di '{rule['group']}' su '{path}'")
            continue
        group_name = group_name.strip(NAME_TRIM)
        if not group_name:
            continue
        scene_index = None
        if gd.get("index") is not None:
            try:
                scene_index = int(gd["index"])
            except ValueError:
                pass
        return group_name, scene_index
    return None, None


def run(stash):
    rules, only_ungrouped, dry_run = load_settings(stash)
    if not rules:
        log.error("[AutoGroup] nessuna regola valida configurata, esco")
        return

    skipped_already_grouped = 0
    checked_no_match = 0
    page = 1
    # normalised name -> {names: Counter of spellings, items: [{id, scene_index, existing_groups, basename}]}
    pending = {}

    while True:
        res = stash.call_GQL(
            """query($page:Int!, $per:Int!){
                findScenes(filter:{page:$page, per_page:$per, sort:"id", direction:ASC}) {
                  count
                  scenes { id groups { group { id } scene_index } files { path } }
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
            entry = pending.setdefault(norm_name(group_name), {"names": collections.Counter(), "items": []})
            entry["names"][group_name] += 1
            entry["items"].append(
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
    groups = Groups(stash)
    matched = 0
    created_groups = 0
    skipped_single_no_existing = 0

    for entry in pending.values():
        items = entry["items"]
        spellings = [n for n, _ in entry["names"].most_common()]
        group_name = spellings[0]
        gid = next((g for g in (groups.find(n) for n in spellings) if g), None)
        if len(items) == 1 and gid is None:
            skipped_single_no_existing += 1
            continue

        for item in items:
            matched += 1
            if dry_run:
                idx_note = f" (scene_index={item['scene_index']})" if item["scene_index"] is not None else ""
                target = (f"aggiungerebbe a gruppo '{groups.names.get(gid, group_name)}'" if gid
                          else f"creerebbe gruppo '{group_name}'")
                log.info(f"[AutoGroup] (dry-run) scena {item['id']} '{item['basename']}' -> {target}{idx_note}")
                continue
            if gid is None:
                gid = groups.create(group_name)
                created_groups += 1
            keep = [
                {"group_id": g["group"]["id"], "scene_index": g.get("scene_index")}
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
        f"{skipped_single_no_existing} match singoli scartati (nessun gruppo esistente con nome uguale o simile), "
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
