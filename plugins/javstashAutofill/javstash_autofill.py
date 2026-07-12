#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Stash plugin: Performer.Create.Post hook.
When a performer is created, search the configured source (default: the javstash
stash-box) by name, take the best name-matching candidate and fill only the empty
fields (skip if the best score is below THRESHOLD).

The primary-name handling depends on the creation origin (Identify vs. manual;
detected by the presence of stash_ids in the create input):
  - Identify creation -> prefer the scraper's canonical name as primary; the
    created name is demoted to an alias. If a performer with that name already
    exists, the new one is merged into it via performerMerge (scenes re-linked,
    new one removed, the existing one's empty fields filled, the created name kept
    as an alias, and the stash-box id carried over).
  - Manual creation    -> keep the created name as primary; the scraper name is
    added as an alias.
Existing values, existing images and existing aliases are protected (only empty
fields are filled / missing entries appended) unless a per-field overwrite toggle
is enabled. Measurements are normalised from javstash form (91H-56-88) to
(91(H)-56-88). Standard library only.
"""
import sys, json, re, unicodedata, urllib.request, difflib, os, datetime, base64, subprocess, ssl

JAV = "https://javstash.org/graphql"
THRESHOLD = 0.9
LOG = os.path.join(os.path.dirname(__file__), "autofill.log")

def log(msg):
    try:
        with open(LOG, "a") as f:
            f.write(f"{datetime.datetime.now().isoformat()} {msg}\n")
    except Exception:
        pass

# ---------- Stash GraphQL ----------
def make_gql(conn):
    scheme = conn.get("Scheme", "http")
    host = conn.get("Host") or "localhost"
    if host in ("0.0.0.0", ""): host = "localhost"
    port = conn.get("Port", 9999)
    cookie = conn.get("SessionCookie") or {}
    ck = cookie.get("Value")
    url = f"{scheme}://{host}:{port}/graphql"
    def gql(query, variables=None, timeout=90):
        data = json.dumps({"query": query, "variables": variables or {}}).encode()
        headers = {"Content-Type": "application/json"}
        if ck: headers["Cookie"] = f"{cookie.get('Name','session')}={ck}"
        req = urllib.request.Request(url, data=data, headers=headers)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            j = json.loads(r.read())
        if j.get("errors"): raise RuntimeError(j["errors"])
        return j["data"]
    return gql

# ---------- normalisation / matching ----------
def nfc(s):  return unicodedata.normalize("NFC", (s or "").strip())
def norm(s): return nfc(s).lower().replace(" ", "").replace("　", "")
def split_aliases(s):
    if not s: return []
    return [a for a in re.split(r"[,，/、|]", s) if a.strip()]
def match_score(target_names, cand_names):
    tn = {norm(x) for x in target_names if x}
    cn = {norm(x) for x in cand_names if x}
    if tn & cn: return 1.0
    best = 0.0
    for a in tn:
        for b in cn:
            if a and b:
                r = difflib.SequenceMatcher(None, a, b).ratio()
                if r > best: best = r
    return best

# ---------- conversion ----------
def conv_meas(m):
    m = nfc(m)
    mm = re.match(r"^\s*(\d+)\s*([A-Za-z]{1,4})\s*-\s*(\d+)\s*-\s*(\d+)\s*$", m)
    return f"{mm.group(1)}({mm.group(2).upper()})-{mm.group(3)}-{mm.group(4)}" if mm else m
def to_int(s):
    try: return int(re.sub(r"[^\d]", "", str(s)))
    except Exception: return None

# ---------- scraper ----------
JAV_FIELDS = ("name gender birthdate death_date ethnicity country hair_color eye_color "
              "height weight measurements fake_tits career_length tattoos piercings "
              "details twitter instagram aliases images")
def scrape_source(gql, name, source_input):
    q = ("query($s:ScraperSourceInput!,$i:ScrapeSinglePerformerInput!){"
         " scrapeSinglePerformer(source:$s,input:$i){ %s } }" % JAV_FIELDS)
    try:
        return gql(q, {"s": source_input, "i": {"query": name}}).get("scrapeSinglePerformer") or []
    except Exception as e:
        log(f"scrape error: {e}"); return []

def get_settings(gql):
    try:
        plugins = (gql("{ configuration { plugins } }").get("configuration", {}) or {}).get("plugins") or {}
        return plugins.get("javstashAutofill") or {}
    except Exception:
        return {}

def build_source(source_str):
    # A URL is treated as a stash-box endpoint; anything else as a scraper_id.
    s = (source_str or JAV).strip()
    return {"stash_box_endpoint": s} if s.startswith("http") else {"scraper_id": s}

# ---------- performer read / write ----------
PERF_FIELDS = ("id name alias_list gender birthdate death_date ethnicity country hair_color "
               "eye_color height_cm weight measurements fake_tits career_length tattoos "
               "piercings details urls image_path stash_ids{ endpoint stash_id }")
def get_performer(gql, pid):
    q = "query($id:ID!){ findPerformer(id:$id){ %s } }" % PERF_FIELDS
    return gql(q, {"id": pid}).get("findPerformer")
def find_by_name(gql, name, exclude_id):
    q = ("query($n:String!){ findPerformers(performer_filter:{name:{value:$n,modifier:EQUALS}},"
         " filter:{per_page:5}){ performers{ id name } } }")
    try:
        rows = gql(q, {"n": name}).get("findPerformers", {}).get("performers", [])
    except Exception:
        return None
    for p in rows:
        if str(p["id"]) != str(exclude_id) and nfc(p["name"]) == nfc(name):
            return p["id"]
    return None
def performer_update(gql, pid, upd):
    upd = dict(upd); upd["id"] = pid
    q = "mutation($i:PerformerUpdateInput!){ performerUpdate(input:$i){ id } }"
    return gql(q, {"i": upd})
def performer_merge(gql, source_ids, dest_id, values):
    q = "mutation($i:PerformerMergeInput!){ performerMerge(input:$i){ id } }"
    inp = {"source": [str(s) for s in source_ids], "destination": str(dest_id)}
    if values: inp["values"] = values
    return gql(q, {"i": inp})

def has_image(image_path):
    # Stash appends "default=true" to image_path when no custom image is set.
    return bool(image_path) and "default=true" not in image_path

# ---------- build the update (empty-only by default; alias/urls append-merge) ----------
def build_update(perf, cand, primary_name, extra_aliases=None, set_name=False, ow=None):
    ow = ow or {}
    upd = {}
    def empty(f):
        v = perf.get(f)
        return v is None or (isinstance(v, str) and v.strip() == "") or (isinstance(v, list) and len(v) == 0)
    def writable(f):  # write when empty; also write a non-empty field if overwrite (ow) is enabled.
        return empty(f) or bool(ow.get(f))
    simple = {"gender":"gender","birthdate":"birthdate","death_date":"death_date","ethnicity":"ethnicity",
              "country":"country","hair_color":"hair_color","eye_color":"eye_color","fake_tits":"fake_tits",
              "career_length":"career_length","tattoos":"tattoos","piercings":"piercings","details":"details"}
    for pf, cf in simple.items():
        if writable(pf) and cand.get(cf): upd[pf] = cand[cf]
    if writable("height_cm") and cand.get("height"):
        v = to_int(cand["height"])
        if v: upd["height_cm"] = v
    if writable("weight") and cand.get("weight"):
        v = to_int(cand["weight"])
        if v: upd["weight"] = v
    if writable("measurements") and cand.get("measurements"):
        upd["measurements"] = conv_meas(cand["measurements"])
    # Writing twitter/instagram/url into the legacy fields makes performerMerge fail
    # ("Merging legacy performer URLs is not supported"), so use the modern urls list.
    # Overwrite = replace; otherwise keep existing and append the missing ones.
    url_pool = [u.strip() for u in (cand.get("twitter"), cand.get("instagram"), cand.get("url")) if u and u.strip()]
    existing_urls = list(perf.get("urls") or [])
    if ow.get("urls"):
        new_urls = list(dict.fromkeys(url_pool))
        if new_urls and new_urls != existing_urls: upd["urls"] = new_urls
    else:
        useen = {u.strip() for u in existing_urls if u}
        url_adds = [u for u in url_pool if u not in useen]
        if url_adds: upd["urls"] = existing_urls + url_adds
    if set_name:
        upd["name"] = primary_name
    # alias: existing + missing of (scraper name + scraper aliases + extra). Exclude the primary name.
    pool = list(split_aliases(cand.get("aliases")))
    if cand.get("name"): pool.append(cand["name"])
    pool += list(extra_aliases or [])
    base = [] if ow.get("alias_list") else list(perf.get("alias_list") or [])  # overwrite -> drop existing (replace)
    seen = {norm(x) for x in base} | {norm(primary_name)}
    additions = []
    for a in pool:
        a = (a or "").strip()
        if not a: continue
        na = norm(a)
        if na in seen: continue
        seen.add(na); additions.append(a)
    if additions or (ow.get("alias_list") and base != list(perf.get("alias_list") or [])):
        upd["alias_list"] = base + additions
    # NB: the image is NOT included here; a slow fetch would fail the whole update, so it is applied separately.
    return upd

def apply_image_async(conn, target_id, target_perf, cand, overwrite=False):
    """When there is no image (or overwrite is on), download and set it in a detached
    background process, so the hook returns immediately and Stash never blocks on a
    slow remote image fetch."""
    if has_image(target_perf.get("image_path")) and not overwrite: return
    imgs = cand.get("images") or []
    if not imgs: return
    try:
        env = dict(os.environ, JAVSTASH_CONN=json.dumps(conn))
        subprocess.Popen([sys.executable, os.path.abspath(__file__),
                          "--set-image", str(target_id), imgs[0]],
                         env=env, stdin=subprocess.DEVNULL,
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                         start_new_session=True)
    except Exception as e:
        log(f"{target_id}: image spawn skipped ({e})")

def set_image_mode(target_id, image_url):
    """Subprocess entry point: download the image and set it as base64 via performerUpdate
    (so Stash does not perform the slow remote fetch itself)."""
    conn = json.loads(os.environ.get("JAVSTASH_CONN", "{}"))
    gql = make_gql(conn)
    sslctx = ssl.create_default_context()
    sslctx.check_hostname = False
    sslctx.verify_mode = ssl.CERT_NONE  # some Python builds lack CA certs; the image is public
    for attempt in range(3):
        try:
            req = urllib.request.Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=60, context=sslctx) as r:
                raw = r.read()
                ctype = r.headers.get("Content-Type", "image/jpeg")
            b64 = base64.b64encode(raw).decode()
            performer_update(gql, target_id, {"image": f"data:{ctype};base64,{b64}"})
            log(f"{target_id}: image set async ({len(raw)} bytes)")
            return
        except Exception as e:
            log(f"{target_id}: image async attempt {attempt+1} failed ({e})")
    log(f"{target_id}: image async gave up")

def union_stash_ids(dest, source):
    """Add source stash_ids for endpoints the dest does not already have. None if nothing added."""
    by_ep = {s["endpoint"]: {"endpoint": s["endpoint"], "stash_id": s["stash_id"]}
             for s in (dest.get("stash_ids") or [])}
    added = False
    for s in (source.get("stash_ids") or []):
        if s["endpoint"] not in by_ep:
            by_ep[s["endpoint"]] = {"endpoint": s["endpoint"], "stash_id": s["stash_id"]}; added = True
    return list(by_ep.values()) if added else None

# ---------- main ----------
def main():
    try:
        payload = json.loads(sys.stdin.read())
    except Exception:
        print(json.dumps({"output": "no input"})); return
    conn = payload.get("server_connection", {})
    ctx = (payload.get("args", {}) or {}).get("hookContext", {}) or {}
    pid = ctx.get("id")
    htype = ctx.get("type", "")
    if not pid or "Performer.Create" not in htype:
        print(json.dumps({"output": "skip (not performer create)"})); return
    create_input = ctx.get("input") or {}
    from_identify = bool(create_input.get("stash_ids"))

    gql = make_gql(conn)
    try:
        perf = get_performer(gql, pid)
    except Exception as e:
        log(f"get_performer error {pid}: {e}"); print(json.dumps({"output": "skip (fetch error)"})); return
    if not perf or not perf.get("name"):
        print(json.dumps({"output": "skip (no name)"})); return
    name = perf["name"]
    targets = [name] + list(perf.get("alias_list") or [])

    # Settings: per-origin (Identify/manual) source and primary-name policy; match threshold.
    settings = get_settings(gql)
    if from_identify:
        src = settings.get("identifySource")
        use_scraper_name = settings.get("identifyUseScraperName")
        if use_scraper_name is None: use_scraper_name = True   # default: Identify prefers the scraper name
    else:
        src = settings.get("manualSource")
        use_scraper_name = settings.get("manualUseScraperName")
        if use_scraper_name is None: use_scraper_name = False  # default: manual keeps the created name
    source_input = build_source(src)
    try:
        threshold = float(settings.get("threshold"))
        if not (0 < threshold <= 1): threshold = THRESHOLD
    except (TypeError, ValueError):
        threshold = THRESHOLD
    # Per-field overwrite toggles (default all OFF = fill empty only).
    OW_MAP = {"gender":"owGender","birthdate":"owBirthdate","death_date":"owDeathDate","ethnicity":"owEthnicity",
              "country":"owCountry","hair_color":"owHairColor","eye_color":"owEyeColor","fake_tits":"owFakeTits",
              "career_length":"owCareerLength","tattoos":"owTattoos","piercings":"owPiercings","details":"owDetails",
              "height_cm":"owHeight","weight":"owWeight","measurements":"owMeasurements",
              "urls":"owUrls","alias_list":"owAliasList","image":"owImage"}
    ow = {f: bool(settings.get(k)) for f, k in OW_MAP.items()}

    cands = scrape_source(gql, name, source_input)
    if not cands:
        log(f"{pid} '{name}': no candidate ({source_input}) -> skip")
        print(json.dumps({"output": "skip (no candidate)"})); return
    scored = sorted(((match_score(targets, [c.get("name")] + split_aliases(c.get("aliases"))), c)
                     for c in cands), key=lambda x: x[0], reverse=True)
    top_score, top = scored[0]
    if top_score < threshold:
        log(f"{pid} '{name}': best score {top_score:.2f} < {threshold} -> skip")
        print(json.dumps({"output": f"skip (no match {top_score:.2f})"})); return

    cand_name = (top.get("name") or "").strip()
    prefer_scraper = bool(use_scraper_name) and bool(cand_name) and norm(cand_name) != norm(name)
    ctx_label = "identify" if from_identify else "manual"

    try:
        if prefer_scraper:
            dup_id = find_by_name(gql, cand_name, exclude_id=pid)
            if dup_id:
                # duplicate -> merge the new one (pid) into the existing one (dup_id)
                dest = get_performer(gql, dup_id)
                extra = [perf["name"]] + list(perf.get("alias_list") or [])   # carry created name + aliases over
                values = build_update(dest, top, primary_name=dest["name"], extra_aliases=extra, set_name=False, ow=ow)
                sids = union_stash_ids(dest, perf)
                if sids is not None: values["stash_ids"] = sids
                values["id"] = dup_id   # PerformerUpdateInput requires id (the merge destination)
                performer_merge(gql, [pid], dup_id, values)
                apply_image_async(conn, dup_id, dest, top, overwrite=ow.get("image"))
                log(f"{pid} '{name}' [{ctx_label}]: MERGED into {dup_id} '{dest['name']}' "
                    f"(fields={sorted(values.keys())}, score={top_score:.2f})")
                print(json.dumps({"output": f"merged into {dup_id}"})); return
            # no duplicate -> rename to the scraper name (created name kept as alias)
            values = build_update(perf, top, primary_name=cand_name, extra_aliases=[perf["name"]], set_name=True, ow=ow)
            mode = f"{ctx_label}(rename)"
        else:
            # keep the created name as primary; the scraper name becomes an alias
            values = build_update(perf, top, primary_name=name, extra_aliases=[], set_name=False, ow=ow)
            mode = ctx_label
        if values:
            performer_update(gql, pid, values)
        apply_image_async(conn, pid, perf, top, overwrite=ow.get("image"))
        log(f"{pid} '{name}' [{mode}]: filled {sorted(values.keys())} (score={top_score:.2f})")
        print(json.dumps({"output": f"filled {sorted(values.keys())}"}))
    except Exception as e:
        log(f"{pid} '{name}': apply error {e}")
        print(json.dumps({"output": "apply error", "error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) >= 4 and sys.argv[1] == "--set-image":
        set_image_mode(sys.argv[2], sys.argv[3])
    else:
        main()
