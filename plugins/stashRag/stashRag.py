"""Stash RAG: semantic chat/search over your own Stash library, plus best-effort content
fetching via yt-dlp. Bring your own LLM (local Ollama/Unsloth, or a cloud API).

Two invocation modes, both read a JSON blob from stdin (Stash's "raw" plugin interface):
  - Task mode (Settings > Tasks > Plugin Tasks): args.mode in {"reindex", "index"}.
  - Operation mode (called by the JS chat tab via runPluginOperation): args.operation in
    {"ask", "download"}. Stateless request/response - no background daemon, no persistent
    process: every call is a fresh script invocation, so there's nothing that can be left
    running and fight itself over a lock (see this plugin's README for why that matters).
"""
import base64
import datetime
import hashlib
import html.parser
import io
import json
import os
import re
import sqlite3
import struct
import sys
import time
import urllib.parse
import urllib.request

import numpy as np
import stashapi.log as log
from stashapi.stashapp import StashInterface

DB_FILENAME = "stashrag.sqlite3"
EMBED_DIM_DEFAULT = 768
TOP_K = 12


# ------------------------------------------------------------------ settings / paths
def load_settings(stash):
    cfg = stash.get_configuration().get("plugins", {}).get("stashRag", {})
    s = {
        "llmProvider": "ollama",
        "llmBaseUrl": "http://127.0.0.1:11434/v1",
        "llmApiKey": "",
        "llmModel": "qwen3:14b",
        "embedProvider": "",
        "embedBaseUrl": "",
        "embedApiKey": "",
        "embedModel": "nomic-embed-text",
        "downloadPath": "",
        "siteFeeds": "",
    }
    s.update({k: v for k, v in cfg.items() if v})
    if not s["embedProvider"]:
        s["embedProvider"] = s["llmProvider"]
    if not s["embedBaseUrl"]:
        s["embedBaseUrl"] = s["llmBaseUrl"]
    if not s["embedApiKey"]:
        s["embedApiKey"] = s["llmApiKey"]
    return s


def db_path(stash):
    conf = stash.get_configuration()
    stash_paths = (conf.get("general") or {}).get("stashes") or []
    base = stash_paths[0]["path"] if stash_paths else "."
    d = os.path.join(base, ".stashRag")
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, DB_FILENAME)


def db_connect(stash):
    con = sqlite3.connect(db_path(stash))
    con.execute(
        "CREATE TABLE IF NOT EXISTS scenes "
        "(id TEXT PRIMARY KEY, card TEXT, embedding BLOB, updated_at TEXT)"
    )
    con.execute("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)")
    con.execute(
        "CREATE TABLE IF NOT EXISTS conversations "
        "(id INTEGER PRIMARY KEY AUTOINCREMENT, question TEXT, answer TEXT, created_at TEXT)"
    )
    con.execute(
        "CREATE TABLE IF NOT EXISTS duplicate_pairs "
        "(id_a TEXT, id_b TEXT, score REAL, computed_at TEXT, PRIMARY KEY (id_a, id_b))"
    )
    con.execute(
        "CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, data TEXT, updated_at TEXT)"
    )
    # Small locally re-hosted copies of remote feed thumbnails (data: URI source bytes) - this is
    # what actually fixes broken images from feeds whose CDN URLs carry a signed token that
    # expires in ~24h: once cached, we no longer care whether the original URL still works.
    con.execute(
        "CREATE TABLE IF NOT EXISTS image_cache "
        "(key TEXT PRIMARY KEY, content_type TEXT, data BLOB, cached_at TEXT)"
    )
    # Sites tab accumulates every item ever seen across polls (deduped by link), rather than
    # mirroring only the live feed snapshot - so something already seen stays visible even after
    # the source site's own feed moves on.
    con.execute(
        "CREATE TABLE IF NOT EXISTS site_items "
        "(link TEXT PRIMARY KEY, title TEXT, date TEXT, feed TEXT, image TEXT, "
        "duration TEXT, quality TEXT, tags TEXT, first_seen TEXT, last_seen TEXT)"
    )
    # Bookmarking a not-yet-downloaded site item is our own concept (there's no Stash scene to
    # tag yet) - do_download checks this flag and, if set, applies the real Watch Later Stash
    # tag once the file actually becomes a scene, bridging the two.
    try:
        con.execute("ALTER TABLE site_items ADD COLUMN bookmarked INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        pass
    # Lets chat search cover external, not-yet-downloaded Sites items too, not just the library.
    try:
        con.execute("ALTER TABLE site_items ADD COLUMN embedding BLOB")
    except sqlite3.OperationalError:
        pass
    # Downloads that should land in Watch Later: we can't tag the resulting scene right away (it
    # doesn't exist until Stash scans the new file), so we queue it here and resolve it
    # opportunistically on a later call instead of blocking this one on a scan job.
    con.execute(
        "CREATE TABLE IF NOT EXISTS pending_tags "
        "(path TEXT PRIMARY KEY, tag_name TEXT, created_at TEXT)"
    )
    # Every download attempt, whether started from this tab or the Sites tab's icon - a single
    # shared history so there's one place to see where files landed, whether they succeeded, and
    # to delete them again.
    con.execute(
        "CREATE TABLE IF NOT EXISTS downloads "
        "(id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT, title TEXT, path TEXT, "
        "status TEXT, error TEXT, watch_later INTEGER, created_at TEXT)"
    )
    return con


def cache_get(con, key):
    row = con.execute("SELECT data, updated_at FROM cache WHERE key=?", (key,)).fetchone()
    if not row:
        return None, None
    return json.loads(row[0]), row[1]


def cache_set(con, key, data):
    con.execute(
        "INSERT OR REPLACE INTO cache(key, data, updated_at) VALUES (?,?,datetime('now'))",
        (key, json.dumps(data)),
    )
    con.commit()


def cached_or_compute(con, key, refresh, compute_fn, max_age_hours=None):
    """Loading-tabs-that-stay-loading fix: show whatever was last computed and saved instantly
    (even if stale), only actually recompute (slow: live network calls out to StashDB/TPDB, RSS
    feeds, etc.) when the caller explicitly asks to refresh - or, if max_age_hours is given, when
    the cached blob has aged past it (some sources, like RSS thumbnail URLs, embed a signed token
    that expires within a day, so an indefinitely-stale cache would start showing broken images)."""
    if not refresh:
        cached, updated_at = cache_get(con, key)
        if cached is not None:
            stale = False
            if max_age_hours is not None and updated_at:
                try:
                    age_hours = (
                        datetime.datetime.utcnow() - datetime.datetime.strptime(updated_at, "%Y-%m-%d %H:%M:%S")
                    ).total_seconds() / 3600
                    stale = age_hours > max_age_hours
                except ValueError:
                    stale = False
            if not stale:
                return {**cached, "cached": True, "updated_at": updated_at}
    result = compute_fn()
    cache_set(con, key, result)
    return {**result, "cached": False, "updated_at": None}


def pack_vec(v):
    return struct.pack(f"{len(v)}f", *v)


def unpack_vec(b):
    n = len(b) // 4
    return list(struct.unpack(f"{n}f", b))


def normalize(v):
    n = sum(x * x for x in v) ** 0.5
    return [x / n for x in v] if n > 0 else v


# ------------------------------------------------------------------ LLM providers
def _http_json(url, payload, headers, timeout=120):
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json", **headers}
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def embed_texts(settings, texts):
    provider = settings["embedProvider"]
    base = settings["embedBaseUrl"].rstrip("/")
    model = settings["embedModel"]
    headers = {}
    if settings["embedApiKey"]:
        headers["Authorization"] = f"Bearer {settings['embedApiKey']}"

    if provider == "ollama":
        # Ollama's native embed endpoint - not the OpenAI-compatible one, different shape.
        root = base[:-3] if base.endswith("/v1") else base
        out = _http_json(f"{root}/api/embed", {"model": model, "input": texts}, headers)
        return [normalize(v) for v in out["embeddings"]]

    out = _http_json(f"{base}/embeddings", {"model": model, "input": texts}, headers)
    return [normalize(d["embedding"]) for d in out["data"]]


def chat_completion(settings, system_prompt, user_prompt):
    provider = settings["llmProvider"]
    base = settings["llmBaseUrl"].rstrip("/")
    model = settings["llmModel"]

    if provider == "anthropic":
        headers = {
            "x-api-key": settings["llmApiKey"],
            "anthropic-version": "2023-06-01",
        }
        out = _http_json(
            "https://api.anthropic.com/v1/messages",
            {
                "model": model,
                "max_tokens": 1024,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_prompt}],
            },
            headers,
            timeout=240,
        )
        return "".join(b.get("text", "") for b in out.get("content", []))

    headers = {}
    if settings["llmApiKey"]:
        headers["Authorization"] = f"Bearer {settings['llmApiKey']}"
    if provider == "openai" and not base.rstrip("/").endswith("openai.com/v1"):
        base = "https://api.openai.com/v1"
    # Generation is inherently slower than embedding, more so on a small local model under load -
    # a real "highest rated"-style question with a longer combined prompt (library + Sites
    # candidates) timed out at the default 120s during testing, killing the whole answer instead
    # of just taking longer.
    out = _http_json(
        f"{base}/chat/completions",
        {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        },
        headers,
        timeout=240,
    )
    return out["choices"][0]["message"]["content"]


# ------------------------------------------------------------------ indexing
def scene_card(s):
    title = s.get("title") or (s.get("files") or [{}])[0].get("basename") or f"Scene {s['id']}"
    studio = (s.get("studio") or {}).get("name")
    performers = [p["name"] for p in (s.get("performers") or [])]
    tags = [t["name"] for t in (s.get("tags") or [])]
    parts = [title]
    if studio:
        parts.append(f"Studio: {studio}")
    if performers:
        parts.append("Performers: " + ", ".join(performers))
    if tags:
        parts.append("Tags: " + ", ".join(tags))
    if s.get("details"):
        parts.append(s["details"][:400])
    return ". ".join(parts)


def do_index(stash, settings, full):
    con = db_connect(stash)
    if full:
        con.execute("DELETE FROM scenes")
        con.commit()

    watermark = "" if full else (con.execute(
        "SELECT value FROM meta WHERE key='watermark'"
    ).fetchone() or [""])[0]

    page, per_page, total, done = 1, 100, None, 0
    while True:
        res = stash.call_GQL(
            """query($page:Int!, $per:Int!){
                findScenes(filter:{page:$page, per_page:$per, sort:"updated_at", direction:ASC}) {
                  count
                  scenes { id title details updated_at studio{name}
                    performers{name} tags{name} files{basename} }
                }
            }""",
            {"page": page, "per": per_page},
        )
        data = res["findScenes"]
        total = total or data["count"]
        scenes = data["scenes"]
        if not scenes:
            break
        # incremental: stop once we're back into already-indexed territory
        batch = [s for s in scenes if not watermark or s["updated_at"] > watermark]
        if batch:
            cards = [scene_card(s) for s in batch]
            vectors = embed_texts(settings, cards)
            for s, card, vec in zip(batch, cards, vectors):
                con.execute(
                    "INSERT OR REPLACE INTO scenes(id, card, embedding, updated_at) VALUES (?,?,?,?)",
                    (s["id"], card, pack_vec(vec), s["updated_at"]),
                )
            done += len(batch)
            con.execute(
                "INSERT OR REPLACE INTO meta(key, value) VALUES ('watermark', ?)",
                (scenes[-1]["updated_at"],),
            )
            con.commit()
        if len(scenes) < per_page:
            break
        page += 1

    log.info(f"[Stash RAG] index {'rebuilt' if full else 'updated'}: {done} scenes embedded out of {total} total")

    dup_count = compute_and_store_duplicates(con)
    con.execute("INSERT OR REPLACE INTO meta(key, value) VALUES ('duplicates_computed', datetime('now'))")
    con.commit()
    log.info(f"[Stash RAG] duplicates: {dup_count} likely pairs found")


# ------------------------------------------------------------------ ask
def load_matrix(con):
    """All scene ids/cards/embeddings as a single numpy matrix - vectors are stored already
    L2-normalized, so a plain dot product IS the cosine similarity, no extra normalization
    needed here."""
    rows = con.execute("SELECT id, card, embedding FROM scenes").fetchall()
    ids = [r[0] for r in rows]
    cards = [r[1] for r in rows]
    # np.frombuffer per row (zero-copy reinterpret of the packed floats) instead of Python-level
    # struct.unpack + list + np.array(list-of-lists): this was the actual bottleneck behind the
    # ~40s "Duplicates" response - the matrix multiply itself is fast, loading wasn't.
    mat = np.stack([np.frombuffer(r[2], dtype=np.float32) for r in rows]) if rows else np.empty((0, 0), dtype=np.float32)
    return ids, cards, mat


def cosine_topk(query_vec, con, k):
    ids, cards, mat = load_matrix(con)
    if mat.shape[0] == 0:
        return []
    scores = mat @ np.array(query_vec, dtype=np.float32)
    top_idx = np.argsort(-scores)[:k]
    return [(float(scores[i]), ids[i], cards[i]) for i in top_idx]


def site_item_card(title, feed, tags):
    parts = [title]
    if feed:
        parts.append(f"Site: {feed}")
    if tags:
        parts.append("Tags: " + ", ".join(tags))
    return ". ".join(parts)


def ensure_site_item_embeddings(con, settings):
    """Embeds any Sites items that don't have one yet (new since the last ask, or from before
    this feature existed) - cheap no-op when there's nothing new, so safe to call on every ask."""
    rows = con.execute(
        "SELECT link, title, feed, tags FROM site_items WHERE embedding IS NULL"
    ).fetchall()
    if not rows:
        return
    cards = [site_item_card(r[1], r[2], json.loads(r[3]) if r[3] else []) for r in rows]
    try:
        vectors = embed_texts(settings, cards)
    except Exception as e:
        log.error(f"[Stash RAG] could not embed site items: {e}")
        return
    for (link, *_rest), vec in zip(rows, vectors):
        con.execute("UPDATE site_items SET embedding=? WHERE link=?", (pack_vec(vec), link))
    con.commit()


def cosine_topk_site_items(query_vec, con, k):
    rows = con.execute(
        "SELECT link, title, feed FROM site_items WHERE embedding IS NOT NULL"
    ).fetchall()
    if not rows:
        return []
    emb_rows = con.execute(
        "SELECT link, embedding FROM site_items WHERE embedding IS NOT NULL"
    ).fetchall()
    mat = np.stack([np.frombuffer(r[1], dtype=np.float32) for r in emb_rows])
    scores = mat @ np.array(query_vec, dtype=np.float32)
    top_idx = np.argsort(-scores)[:k]
    by_link = {r[0]: (r[1], r[2]) for r in rows}
    out = []
    for i in top_idx:
        link = emb_rows[i][0]
        title, feed = by_link[link]
        out.append((float(scores[i]), link, title, feed))
    return out


STRUCTURED_INTENTS = [
    ("rating", "DESC", re.compile(r"highest.?rat|best.?rat|top.?rat", re.I)),
    ("rating", "ASC", re.compile(r"lowest.?rat|worst.?rat", re.I)),
    ("o_counter", "DESC", re.compile(r"most (played|watched|viewed)|highest.*(play|watch|view).?count", re.I)),
    ("play_count", "DESC", re.compile(r"play.?count|times.*(played|watched)", re.I)),
    ("duration", "DESC", re.compile(r"longest", re.I)),
    ("duration", "ASC", re.compile(r"shortest", re.I)),
    ("date", "DESC", re.compile(r"newest|most recent|latest", re.I)),
    ("date", "ASC", re.compile(r"oldest", re.I)),
]


def detect_structured_intent(question):
    for field, direction, pattern in STRUCTURED_INTENTS:
        if pattern.search(question):
            return field, direction
    return None


def do_structured_ask(stash, settings, con, question, field, direction):
    """Semantic search has zero signal for numeric/sort questions ('highest rated', 'longest') -
    tried leaving it to the LLM and it confidently invented a rating that didn't exist. This
    answers those with Stash's own real sort/filter instead, so the numbers are actually true."""
    try:
        res = stash.call_GQL(
            """query($per:Int!,$sort:String!,$dir:SortDirectionEnum!){
                findScenes(filter:{per_page:$per, sort:$sort, direction:$dir}){
                  scenes{ id title rating100 o_counter play_count date files{duration} } } }""",
            {"per": 5, "sort": field, "dir": direction},
        )
    except Exception as e:
        return {"answer": f"Couldn't look that up: {e}", "scenes": []}
    scenes = res["findScenes"]["scenes"]
    lines = []
    for s in scenes:
        dur = (s.get("files") or [{}])[0].get("duration")
        title = s.get("title") or f"Scene {s['id']}"
        lines.append(
            f"- id {s['id']}: {title} (rating: {s.get('rating100')}, o_counter: {s.get('o_counter')}, "
            f"play_count: {s.get('play_count')}, date: {s.get('date')}, duration: {fmt_duration(dur)})"
        )
    system_prompt = (
        "You answer a question about the user's Stash library using ONLY the exact data given "
        "below - it's already correctly sorted and the numbers are real, taken straight from "
        "Stash. Never estimate or invent a number. Reply in the same language as the question, "
        "citing the relevant titles and their real values."
    )
    user_prompt = f"Question: {question}\n\nActual data from Stash (correctly sorted):\n" + "\n".join(lines)
    answer = chat_completion(settings, system_prompt, user_prompt)
    con.execute(
        "INSERT INTO conversations(question, answer, created_at) VALUES (?,?,datetime('now'))",
        (question, answer),
    )
    con.commit()
    return {"answer": answer, "scenes": [{"type": "library", "id": s["id"], "card": s.get("title") or f"Scene {s['id']}"} for s in scenes]}


def do_ask(stash, settings, question):
    if not question.strip():
        # The UI already blocks submitting an empty question, but the "raw" operation interface
        # is reachable directly (e.g. a manual GraphQL call) - guard here too, since an empty
        # question would otherwise still pay for a full embed+LLM round-trip for a meaningless
        # "answer" (embedding an empty string isn't a real query, it's closer to noise).
        return {"answer": "Ask me something about your library!", "scenes": []}
    con = db_connect(stash)
    n = con.execute("SELECT COUNT(*) FROM scenes").fetchone()[0]
    if n == 0:
        return {"answer": "The index is empty: run the \"Rebuild index\" task in the plugin's tasks first.", "scenes": []}

    intent = detect_structured_intent(question)
    if intent:
        field, direction = intent
        return do_structured_ask(stash, settings, con, question, field, direction)

    q_vec = embed_texts(settings, [question])[0]
    top = cosine_topk(q_vec, con, TOP_K)
    listing = "\n".join(f"- id {sid}: {card}" for _, sid, card in top)

    # Also search Sites items (external, not-yet-downloaded content) so the chat can point out
    # "seen this on <site>, not in your library yet" too - kept as a clearly separate listing so
    # the LLM never blurs "already yours" with "found online". Best-effort: this enrichment must
    # never take down the core library search if it fails for any reason.
    site_top = []
    try:
        ensure_site_item_embeddings(con, settings)
        site_top = cosine_topk_site_items(q_vec, con, 5)
    except Exception as e:
        log.error(f"[Stash RAG] site-items search skipped: {e}")
    site_listing = "\n".join(f"- {title} (site: {feed})" for _, _, title, feed in site_top)

    system_prompt = (
        "You help find videos for the user. You're given two separate lists: scenes already in "
        "their Stash library, and items seen on external sites they follow but not downloaded "
        "yet. Reply in the same language as the question, conversationally and concisely, citing "
        "relevant titles - and always make clear which list a title came from (their library vs "
        "found online, not downloaded). If nothing in either list is actually relevant, say so "
        "honestly instead of making something up."
    )
    user_prompt = (
        f"Question: {question}\n\nIn the user's library:\n{listing or '(none)'}\n\n"
        f"Seen on external sites (not downloaded):\n{site_listing or '(none)'}"
    )
    answer = chat_completion(settings, system_prompt, user_prompt)
    con.execute(
        "INSERT INTO conversations(question, answer, created_at) VALUES (?,?,datetime('now'))",
        (question, answer),
    )
    con.commit()
    result_scenes = [{"type": "library", "id": sid, "card": card} for _, sid, card in top]
    result_scenes += [{"type": "external", "link": link, "title": title, "feed": feed} for _, link, title, feed in site_top]
    return {"answer": answer, "scenes": result_scenes}


# ------------------------------------------------------------------ storico chat
def do_history(stash, limit=30):
    con = db_connect(stash)
    rows = con.execute(
        "SELECT question, answer, created_at FROM conversations ORDER BY id DESC LIMIT ?", (limit,)
    ).fetchall()
    return {"items": [{"question": q, "answer": a, "created_at": t} for q, a, t in rows]}


# ------------------------------------------------------------------ duplicates
# Near-duplicate detection reuses the same embeddings built for search: two scenes whose cards
# (title+studio+performers+tags+details) end up almost identical in meaning score very high on
# cosine similarity - catches re-encoded/renamed duplicates that pure title/duration matching
# would miss. Computed once per index run (persisted in duplicate_pairs), not live per click -
# a live all-pairs scan over the whole library was the slow part of an earlier version of this
# plugin, not something worth re-running every time the tab is opened.
def compute_and_store_duplicates(con, threshold=0.97, max_per_scene=3):
    ids, _, mat = load_matrix(con)
    n = len(ids)
    con.execute("DELETE FROM duplicate_pairs")
    if n < 2:
        con.commit()
        return 0

    sims = mat @ mat.T
    np.fill_diagonal(sims, -1)
    seen = set()
    rows = []
    for i in range(n):
        # top matches for this scene above threshold, capped so one generic card doesn't flood
        # the result with dozens of weak matches
        row = sims[i]
        idxs = np.argsort(-row)[:max_per_scene]
        for j in idxs:
            j = int(j)
            score = float(row[j])
            if score < threshold or j <= i:
                continue
            key = (ids[i], ids[j])
            if key in seen:
                continue
            seen.add(key)
            rows.append((ids[i], ids[j], score))
    con.executemany(
        "INSERT OR REPLACE INTO duplicate_pairs(id_a, id_b, score, computed_at) "
        "VALUES (?,?,?,datetime('now'))",
        rows,
    )
    con.commit()
    return len(rows)


def to_relative_url(url):
    """Stash echoes back whatever host the request came in on (here, the plugin's own loopback
    connection to Stash) when it builds asset URLs like screenshot paths - useless in a browser
    hitting Stash through its real hostname. Strip scheme+host so the browser resolves it against
    the page's own origin instead, exactly like Stash's own UI does for these assets."""
    if not url:
        return None
    parts = urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit(("", "", parts.path, parts.query, parts.fragment))


def quality_label(width, height):
    if not width or not height:
        return None
    long_edge = max(width, height)
    if long_edge >= 3800:
        return "4K"
    if long_edge >= 2500:
        return "1440p"
    if long_edge >= 1900:
        return "1080p"
    if long_edge >= 1260:
        return "720p"
    if long_edge >= 620:
        return "480p"
    return f"{width}x{height}"


def fmt_duration(seconds):
    if not seconds:
        return None
    seconds = int(seconds)
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m}:{s:02d}"


def do_duplicates(stash, refresh=False):
    con = db_connect(stash)
    if con.execute("SELECT COUNT(*) FROM scenes").fetchone()[0] == 0:
        return {"available": False,
                "reason": "The search index is empty - run \"Rebuild index\" first (needed for search too).",
                "pairs": [], "cached": False, "updated_at": None}

    computed = con.execute("SELECT value FROM meta WHERE key='duplicates_computed'").fetchone()
    if refresh or not computed:
        # First call (or an explicit refresh) computes and saves; every later call just reads
        # the table below - no more "please run a task first".
        compute_and_store_duplicates(con)
        con.execute("INSERT OR REPLACE INTO meta(key, value) VALUES ('duplicates_computed', datetime('now'))")
        con.commit()
    updated_at = con.execute("SELECT value FROM meta WHERE key='duplicates_computed'").fetchone()[0]

    rows = con.execute(
        "SELECT id_a, id_b, score FROM duplicate_pairs ORDER BY score DESC"
    ).fetchall()

    # Thumbnail/quality/duration reflect Stash's CURRENT state (not a stale snapshot from
    # whenever the pair was computed), fetched in one batched call for every scene involved.
    ids = sorted({str(r[0]) for r in rows} | {str(r[1]) for r in rows})
    scene_meta = {}
    if ids:
        try:
            res = stash.call_GQL(
                """query($ids:[ID!]){ findScenes(ids:$ids){ scenes{
                    id title paths{screenshot} files{width height duration} } } }""",
                {"ids": ids},
            )
        except Exception as e:
            log.error(f"[Stash RAG] could not fetch duplicate scene metadata: {e}")
            res = {"findScenes": {"scenes": []}}
        for sc in res["findScenes"]["scenes"]:
            f = (sc.get("files") or [{}])[0]
            scene_meta[sc["id"]] = {
                "title": sc.get("title") or f"Scene {sc['id']}",
                "thumb": to_relative_url((sc.get("paths") or {}).get("screenshot")),
                "resolution": quality_label(f.get("width"), f.get("height")),
                "duration": fmt_duration(f.get("duration")),
            }

    pairs = []
    for id_a, id_b, score in rows:
        a = scene_meta.get(str(id_a), {})
        b = scene_meta.get(str(id_b), {})
        pairs.append({
            "id_a": id_a, "title_a": a.get("title", f"Scene {id_a}"),
            "thumb_a": a.get("thumb"), "resolution_a": a.get("resolution"), "duration_a": a.get("duration"),
            "id_b": id_b, "title_b": b.get("title", f"Scene {id_b}"),
            "thumb_b": b.get("thumb"), "resolution_b": b.get("resolution"), "duration_b": b.get("duration"),
            "score": round(score, 4),
        })
    return {"available": True, "pairs": pairs, "cached": not refresh, "updated_at": updated_at}


def do_delete_scene(stash, scene_id):
    try:
        stash.call_GQL(
            "mutation($id:ID!){ sceneDestroy(input:{id:$id, delete_file:true, delete_generated:true}) }",
            {"id": scene_id},
        )
    except Exception as e:
        # stashapi raises on a GraphQL error (e.g. scene_id no longer exists) instead of
        # returning one - let the caller show a message instead of the whole operation crashing.
        return {"ok": False, "error": str(e)}
    con = db_connect(stash)
    con.execute("DELETE FROM duplicate_pairs WHERE id_a=? OR id_b=?", (scene_id, scene_id))
    con.execute("DELETE FROM scenes WHERE id=?", (scene_id,))
    con.commit()
    return {"ok": True}


# ------------------------------------------------------------------ download
YTDLP_UPDATE_COOLDOWN_DAYS = 7


def ytdlp_available():
    try:
        import yt_dlp  # noqa: F401
        return True
    except ImportError:
        return False


def _pip_install_ytdlp():
    """The actual pip call, shared by the silent cooldown-gated upgrade (maybe_update_ytdlp,
    only ever runs if yt-dlp is already present) and the explicit "Install / update yt-dlp" task
    (do_install_ytdlp, the one deliberate path that installs it fresh) - kept as one place so the
    two behave identically once they do run pip."""
    import subprocess
    # --break-system-packages: this host's system Python is PEP 668 "externally managed" - plain
    # `pip install --upgrade` was failing outright every time (silently: check=False swallowed it
    # and the old code logged "done" regardless of the actual exit code), so yt-dlp was stuck on
    # whatever version was first installed.
    # curl_cffi lets yt-dlp impersonate a real browser's TLS fingerprint - some sites now reject
    # the plain urllib requests yt-dlp otherwise falls back to, with a deceptive 410 "Gone" that
    # looks like the content was removed but isn't - confirmed live by installing this and
    # re-testing a URL that was failing.
    result = subprocess.run(
        [sys.executable, "-m", "pip", "install", "--upgrade", "--quiet",
         "--break-system-packages", "yt-dlp", "curl_cffi"],
        timeout=120, check=False, capture_output=True, text=True,
    )
    if result.returncode == 0:
        log.info("[Stash RAG] yt-dlp: installed/updated successfully")
        return True, None
    err = (result.stderr or "")[-500:]
    log.error(f"[Stash RAG] yt-dlp install/update failed (exit {result.returncode}): {err}")
    return False, err


def do_install_ytdlp(stash):
    """Handler for the explicit "Install / update yt-dlp" plugin task - the only path that
    installs yt-dlp fresh if it's missing, always on the user's own deliberate click, never as a
    side effect of using Download."""
    ok, err = _pip_install_ytdlp()
    con = db_connect(stash)
    con.execute(
        "INSERT OR REPLACE INTO meta(key, value) VALUES ('ytdlp_last_update_check', ?)", (str(time.time()),)
    )
    con.commit()
    if not ok:
        log.error(f"[Stash RAG] Install / update yt-dlp task failed: {err}")


def maybe_update_ytdlp(stash):
    # Only ever upgrades an install the user already has - the plugin never installs yt-dlp for
    # them. Download is meant to activate once the "Install / update yt-dlp" task has been run
    # deliberately (see do_install_ytdlp), not something that happens as a side effect of
    # clicking Download.
    if not ytdlp_available():
        return
    con = db_connect(stash)
    last = con.execute("SELECT value FROM meta WHERE key='ytdlp_last_update_check'").fetchone()
    now = time.time()
    if last and now - float(last[0]) < YTDLP_UPDATE_COOLDOWN_DAYS * 86400:
        return
    con.execute(
        "INSERT OR REPLACE INTO meta(key, value) VALUES ('ytdlp_last_update_check', ?)", (str(now),)
    )
    con.commit()
    try:
        _pip_install_ytdlp()
    except Exception as e:
        log.error(f"[Stash RAG] yt-dlp update failed (continuing with the current version): {e}")


WATCH_LATER_TAG = "Watch Later"


def find_or_create_tag(stash, name):
    """Same find-or-create convention the Watch Later plugin itself uses for its root tag - a
    plain Stash tag, nothing plugin-specific, so tagging a scene with it here is all it takes
    for that scene to show up there too."""
    res = stash.call_GQL(
        "query($f:TagFilterType){ findTags(tag_filter:$f){ tags{id name} } }",
        {"f": {"name": {"value": name, "modifier": "EQUALS"}}},
    )
    tags = res["findTags"]["tags"]
    if tags:
        return tags[0]["id"]
    created = stash.call_GQL(
        "mutation($input:TagCreateInput!){ tagCreate(input:$input){ id } }",
        {"input": {"name": name}},
    )
    return created["tagCreate"]["id"]


def enqueue_watch_later_tag(con, path):
    con.execute(
        "INSERT OR REPLACE INTO pending_tags(path, tag_name, created_at) VALUES (?,?,datetime('now'))",
        (path, WATCH_LATER_TAG),
    )
    con.commit()


def process_pending_tags(stash):
    """A downloaded file isn't a Stash scene until Stash scans it - which happens async in
    Stash's own job queue - so we can't tag it inside do_download without blocking on that scan
    (and Stash appears to serialize plugin operations, so a multi-second block there would stall
    every other tab too). Instead this runs opportunistically on the NEXT plugin call and just
    checks whether the scan caught up yet; entries older than 2h are dropped (scan never
    happened, e.g. the download folder isn't inside any configured Stash library path)."""
    con = db_connect(stash)
    rows = con.execute("SELECT path, tag_name, created_at FROM pending_tags").fetchall()
    if not rows:
        return
    for path, tag_name, created_at in rows:
        try:
            age_hours = (
                datetime.datetime.utcnow() - datetime.datetime.strptime(created_at, "%Y-%m-%d %H:%M:%S")
            ).total_seconds() / 3600
        except ValueError:
            age_hours = 0
        if age_hours > 2:
            con.execute("DELETE FROM pending_tags WHERE path=?", (path,))
            con.commit()
            continue
        try:
            res = stash.call_GQL(
                "query($p:String!){ findScenes(scene_filter:{path:{value:$p, modifier:EQUALS}}){ scenes{id tags{id}} } }",
                {"p": path},
            )
            scenes = res["findScenes"]["scenes"]
            if not scenes:
                continue
            tag_id = find_or_create_tag(stash, tag_name)
            scene = scenes[0]
            tag_ids = list({t["id"] for t in (scene.get("tags") or [])} | {tag_id})
            stash.call_GQL(
                "mutation($input:SceneUpdateInput!){ sceneUpdate(input:$input){ id } }",
                {"input": {"id": scene["id"], "tag_ids": tag_ids}},
            )
            con.execute("DELETE FROM pending_tags WHERE path=?", (path,))
            con.commit()
        except Exception as e:
            log.error(f"[Stash RAG] pending Watch Later tag failed for {path}: {e}")


def watch_later_plugin_available(stash):
    """Tagging a scene "Watch Later" is pointless if that plugin isn't installed and enabled -
    there'd be nothing to show it, just a tag sitting there with no visible effect. Check first
    so do_download can be honest about what it actually did."""
    try:
        res = stash.call_GQL("query{ plugins{ id enabled } }")
        return any(p["id"] == "watchlater" and p.get("enabled") for p in res["plugins"])
    except Exception:
        return False


def _log_download(con, url, title, path, status, error, watch_later):
    if status == "error":
        # Persisted in the downloads table for the Downloads tab's history either way, but also
        # goes through Stash's own plugin log (like every other error path in this plugin) so
        # yt-dlp failures are visible from Settings -> Logs too, not just inside the plugin's UI.
        log.error(f"[Stash RAG] download failed for {url}: {error}")
    con.execute(
        "INSERT INTO downloads(url, title, path, status, error, watch_later, created_at) "
        "VALUES (?,?,?,?,?,?,datetime('now'))",
        (url, title, path, status, error, int(bool(watch_later))),
    )
    con.commit()


def do_download(stash, settings, url):
    con = db_connect(stash)
    if not settings["downloadPath"]:
        err = "No download folder configured in the plugin's settings."
        _log_download(con, url, None, None, "error", err, False)
        return {"ok": False, "error": err}
    maybe_update_ytdlp(stash)
    try:
        import yt_dlp
    except ImportError:
        err = "yt-dlp is not installed in Stash's Python environment."
        _log_download(con, url, None, None, "error", err, False)
        return {"ok": False, "error": err}

    opts = {
        "outtmpl": os.path.join(settings["downloadPath"], "%(title)s.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
        # quiet only silences yt-dlp's logger - the progress bar writes straight to stdout via a
        # separate path and was leaking into the JSON this script prints on stdout, breaking the
        # frontend's parsing (confirmed with a real download: raw output was progress-bar text
        # followed by the JSON, not valid JSON on its own).
        "noprogress": True,
    }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
        path = ydl.prepare_filename(info)
        title = info.get("title")
        # Downloading never auto-tags Watch Later by itself - it only follows from having
        # bookmarked the item on the Sites tab beforehand (bridging our own "not downloaded yet"
        # bookmark concept to the real Stash tag once there's finally a scene to put it on).
        bookmark_row = con.execute("SELECT bookmarked FROM site_items WHERE link=?", (url,)).fetchone()
        wants_watch_later = bool(bookmark_row and bookmark_row[0])
        applied = wants_watch_later and watch_later_plugin_available(stash)
        if applied:
            # Fire-and-forget: enqueues Stash's own scan job and returns immediately, we don't
            # wait for it here - see process_pending_tags for how the tag actually gets applied.
            try:
                stash.call_GQL(
                    "mutation($input:ScanMetadataInput!){ metadataScan(input:$input) }",
                    {"input": {"paths": [os.path.dirname(path)]}},
                )
            except Exception as e:
                log.error(f"[Stash RAG] could not trigger a scan after download: {e}")
            enqueue_watch_later_tag(con, path)
        _log_download(con, url, title, path, "ok", None, applied)
        return {"ok": True, "title": title, "path": path, "watch_later_applied": applied}
    except Exception as e:
        _log_download(con, url, None, None, "error", str(e), False)
        return {"ok": False, "error": str(e)}


def do_toggle_watch_later(stash, download_id):
    """Manual Watch Later toggle for an already-downloaded file (Downloads tab) - independent of
    the Sites bookmark bridge above, for files that were never a bookmarked Sites item (e.g.
    pasted directly into the Download tab's URL box)."""
    con = db_connect(stash)
    row = con.execute("SELECT path, watch_later FROM downloads WHERE id=?", (download_id,)).fetchone()
    if not row or not row[0]:
        return {"ok": False, "error": "download not found or has no file path"}
    path, currently = row
    if not watch_later_plugin_available(stash):
        return {"ok": False, "error": "Watch Later plugin is not installed or enabled"}
    new_state = not bool(currently)
    try:
        tag_id = find_or_create_tag(stash, WATCH_LATER_TAG)
        res = stash.call_GQL(
            "query($p:String!){ findScenes(scene_filter:{path:{value:$p, modifier:EQUALS}}){ scenes{id tags{id}} } }",
            {"p": path},
        )
    except Exception as e:
        return {"ok": False, "error": str(e)}
    scenes = res["findScenes"]["scenes"]
    if scenes:
        scene = scenes[0]
        tag_ids = {t["id"] for t in (scene.get("tags") or [])}
        if new_state:
            tag_ids.add(tag_id)
        else:
            tag_ids.discard(tag_id)
        try:
            stash.call_GQL(
                "mutation($input:SceneUpdateInput!){ sceneUpdate(input:$input){ id } }",
                {"input": {"id": scene["id"], "tag_ids": list(tag_ids)}},
            )
        except Exception as e:
            return {"ok": False, "error": str(e)}
    elif new_state:
        # Not scanned into Stash yet - queue it (nothing to un-tag if turning it off in this case).
        try:
            stash.call_GQL(
                "mutation($input:ScanMetadataInput!){ metadataScan(input:$input) }",
                {"input": {"paths": [os.path.dirname(path)]}},
            )
        except Exception as e:
            log.error(f"[Stash RAG] could not trigger a scan for Watch Later toggle: {e}")
        enqueue_watch_later_tag(con, path)
    con.execute("UPDATE downloads SET watch_later=? WHERE id=?", (int(new_state), download_id))
    con.commit()
    return {"ok": True, "watch_later": new_state}


def do_download_history(stash, limit=50):
    con = db_connect(stash)
    rows = con.execute(
        "SELECT id, url, title, path, status, error, watch_later, created_at "
        "FROM downloads ORDER BY id DESC LIMIT ?",
        (limit,),
    ).fetchall()
    items = [
        {"id": r[0], "url": r[1], "title": r[2], "path": r[3], "status": r[4],
         "error": r[5], "watch_later": bool(r[6]), "created_at": r[7]}
        for r in rows
    ]
    return {"items": items}


def do_delete_download(stash, download_id):
    con = db_connect(stash)
    row = con.execute("SELECT path FROM downloads WHERE id=?", (download_id,)).fetchone()
    path = row[0] if row else None
    if path:
        try:
            # If Stash already scanned it in as a scene, let sceneDestroy remove the file (it
            # also cleans up generated covers/previews) - otherwise just delete it directly.
            res = stash.call_GQL(
                "query($p:String!){ findScenes(scene_filter:{path:{value:$p, modifier:EQUALS}}){ scenes{id} } }",
                {"p": path},
            )
            scenes = res["findScenes"]["scenes"]
            if scenes:
                stash.call_GQL(
                    "mutation($id:ID!){ sceneDestroy(input:{id:$id, delete_file:true, delete_generated:true}) }",
                    {"id": scenes[0]["id"]},
                )
            elif os.path.exists(path):
                os.remove(path)
        except Exception as e:
            log.error(f"[Stash RAG] failed to delete download {path}: {e}")
            return {"ok": False, "error": str(e)}
        con.execute("DELETE FROM pending_tags WHERE path=?", (path,))
    con.execute("DELETE FROM downloads WHERE id=?", (download_id,))
    con.commit()
    return {"ok": True}


# ------------------------------------------------------------------ recommendations (live StashDB/TPDB)
def local_taste_profile(stash, top_n=5):
    """Top-liked performers from the user's own library (rating/o_counter as weight) - used to
    query StashDB/TPDB, never stored or sent anywhere except back to the user's own stash-box."""
    res = stash.call_GQL(
        "{ findScenes(filter:{per_page:-1}){ scenes { rating100 o_counter performers{name} } } }"
    )
    scores = {}
    for s in res["findScenes"]["scenes"]:
        w = (s.get("rating100") or 0) / 20.0 + (s.get("o_counter") or 0) * 3.0
        if w <= 0:
            continue
        for p in s.get("performers") or []:
            scores[p["name"]] = scores.get(p["name"], 0) + w
    return [name for name, _ in sorted(scores.items(), key=lambda x: -x[1])[:top_n]]


def do_profile(stash, refresh=False):
    con = db_connect(stash)
    return cached_or_compute(
        con, "profile", refresh,
        lambda: {"top_performers": local_taste_profile(stash, top_n=15)},
    )


def do_recommendations(stash, refresh=False):
    con = db_connect(stash)

    def compute():
        return _compute_recommendations(stash)

    return cached_or_compute(con, "recommendations", refresh, compute)


def _compute_recommendations(stash):
    conf = stash.get_configuration()
    boxes = (conf.get("general") or {}).get("stashBoxes") or []
    if not boxes:
        return {"available": False,
                "reason": "No StashDB/TPDB configured in Stash (Settings > Metadata Providers).",
                "items": []}

    names = local_taste_profile(stash)
    if not names:
        return {"available": False,
                "reason": "No taste data yet (rate or watch a few scenes in your library).",
                "items": []}

    def box_gql(box, query, variables):
        body = json.dumps({"query": query, "variables": variables}).encode()
        req = urllib.request.Request(
            box["endpoint"], data=body,
            headers={
                "Content-Type": "application/json",
                "ApiKey": box["api_key"],
                # Some stash-box instances (TPDB) sit behind Cloudflare bot-detection that
                # rejects requests without a browser-looking User-Agent (error 1010).
                "User-Agent": "Mozilla/5.0 (compatible; StashRAG-plugin)",
            },
        )
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read())

    def scene_url(box, scene_id):
        # Generic: the stash-box's own scene page is conventionally {site}/scenes/{id}, derived
        # from its GraphQL endpoint rather than hardcoding known sources by name.
        base = box["endpoint"].rsplit("/graphql", 1)[0]
        return f"{base}/scenes/{scene_id}"

    items = []
    for box in boxes:
        for name in names[:3]:
            # Not every stash-box implementation shares the exact same schema: StashDB has
            # "searchScenes(term,limit){ scenes{...} count }", TPDB instead has the singular
            # "searchScene(term)" returning a flat list. Try the StashDB shape first, fall back
            # to TPDB's on a schema-validation error rather than assuming one or the other.
            try:
                out = box_gql(
                    box,
                    "query($t:String!){ searchScenes(term:$t, limit:5){ scenes{id title date images{url}} } }",
                    {"t": name},
                )
                if out.get("errors"):
                    raise RuntimeError(out["errors"][0]["message"])
                for sc in out["data"]["searchScenes"]["scenes"]:
                    imgs = sc.get("images") or []
                    items.append({"source": box["name"], "id": sc["id"], "title": sc["title"],
                                  "date": sc.get("date"), "matched_on": name,
                                  "image": imgs[0]["url"] if imgs else None,
                                  "url": scene_url(box, sc["id"])})
                continue
            except Exception:
                pass
            try:
                out = box_gql(box, "query($t:String!){ searchScene(term:$t){ id title date images{url} } }", {"t": name})
                if out.get("errors"):
                    raise RuntimeError(out["errors"][0]["message"])
                for sc in out["data"]["searchScene"][:5]:
                    imgs = sc.get("images") or []
                    items.append({"source": box["name"], "id": sc["id"], "title": sc["title"],
                                  "date": sc.get("date"), "matched_on": name,
                                  "image": imgs[0]["url"] if imgs else None,
                                  "url": scene_url(box, sc["id"])})
            except Exception as e:
                log.error(f"[Stash RAG] query error on {box['name']}: {e}")
    return {"available": True, "items": items}


# ------------------------------------------------------------------ user sites (auto-discovered RSS)
class _FeedLinkFinder(html.parser.HTMLParser):
    """Looks for <link rel="alternate" type="application/rss+xml|atom+xml" href="..."> in a
    page's <head> - the standard way sites self-declare their feed, no site-specific code."""

    def __init__(self):
        super().__init__()
        self.feed_href = None

    def handle_starttag(self, tag, attrs):
        if self.feed_href or tag != "link":
            return
        d = dict(attrs)
        rel = (d.get("rel") or "").lower()
        typ = (d.get("type") or "").lower()
        if "alternate" in rel and ("rss" in typ or "atom" in typ) and d.get("href"):
            self.feed_href = d["href"]


def discover_feed_url(page_url, html_bytes):
    parser = _FeedLinkFinder()
    try:
        parser.feed(html_bytes.decode("utf-8", errors="ignore"))
    except Exception:
        return None
    if not parser.feed_href:
        return None
    from urllib.parse import urljoin
    return urljoin(page_url, parser.feed_href)


def _fetch(url, timeout=15, referer=None):
    headers = {"User-Agent": "Mozilla/5.0"}
    if referer:
        headers["Referer"] = referer
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.headers.get("Content-Type", ""), r.read()


THUMB_MAX_SIZE = (160, 90)
THUMB_JPEG_QUALITY = 50
THUMB_SOURCE_MAX_BYTES = 5 * 1024 * 1024


def cache_thumbnail(con, image_url, referer=None):
    """Downloads a remote thumbnail once and re-hosts a small local copy as a data: URI, stored
    in our own SQLite DB - this is what actually fixes broken images from feeds whose CDN URLs
    carry a signed token that expires in ~24h (see do_sites_feed): once cached, we no longer
    care whether the original URL still works. Resized small on purpose (not meant to be a full
    quality copy, just enough to recognize the scene) to keep the local DB and the browser's own
    cache of this data small. referer should be the site's own origin - some CDNs hotlink-check
    it, the same way a real browser would send it when the image is embedded in that site's page."""
    if not image_url:
        return None
    key = hashlib.sha256(image_url.encode("utf-8")).hexdigest()
    row = con.execute("SELECT content_type, data FROM image_cache WHERE key=?", (key,)).fetchone()
    if row:
        content_type, data = row
        return f"data:{content_type};base64,{base64.b64encode(data).decode('ascii')}"

    try:
        content_type, body = _fetch(image_url, referer=referer)
        if len(body) > THUMB_SOURCE_MAX_BYTES:
            return None
        out_type = (content_type.split(";")[0] or "image/jpeg").strip()
        out_bytes = body
        try:
            from PIL import Image
            img = Image.open(io.BytesIO(body)).convert("RGB")
            img.thumbnail(THUMB_MAX_SIZE)
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=THUMB_JPEG_QUALITY)
            out_bytes = buf.getvalue()
            out_type = "image/jpeg"
        except Exception as e:
            log.warning(f"[Stash RAG] thumbnail resize skipped ({e}) - caching original bytes")
        con.execute(
            "INSERT OR REPLACE INTO image_cache(key, content_type, data, cached_at) VALUES (?,?,?,datetime('now'))",
            (key, out_type, out_bytes),
        )
        con.commit()
        return f"data:{out_type};base64,{base64.b64encode(out_bytes).decode('ascii')}"
    except Exception as e:
        log.error(f"[Stash RAG] thumbnail fetch failed for {image_url}: {e}")
        return None


def do_clear_image_cache(stash):
    con = db_connect(stash)
    n = con.execute("SELECT COUNT(*) FROM image_cache").fetchone()[0]
    con.execute("DELETE FROM image_cache")
    con.commit()
    return {"ok": True, "cleared": n}


def do_toggle_bookmark(stash, link):
    con = db_connect(stash)
    row = con.execute("SELECT bookmarked FROM site_items WHERE link=?", (link,)).fetchone()
    if not row:
        return {"ok": False, "error": "item not found"}
    new_state = 0 if row[0] else 1
    con.execute("UPDATE site_items SET bookmarked=? WHERE link=?", (new_state, link))
    con.commit()
    return {"ok": True, "bookmarked": bool(new_state)}


def do_sites_feed(stash, settings, refresh=False):
    con = db_connect(stash)
    urls = [u.strip() for u in (settings.get("siteFeeds") or "").splitlines() if u.strip()]
    if not urls:
        return {"available": False, "reason": "No site added yet - add one from this tab.",
                "items": [], "errors": [], "cached": False, "updated_at": None}

    last_poll = con.execute("SELECT value FROM meta WHERE key='sites_last_poll'").fetchone()
    stale = True
    if last_poll and not refresh:
        try:
            age_hours = (
                datetime.datetime.utcnow() - datetime.datetime.strptime(last_poll[0], "%Y-%m-%d %H:%M:%S")
            ).total_seconds() / 3600
            stale = age_hours > 6
        except ValueError:
            stale = True

    errors = []
    if refresh or stale:
        errors = _poll_sites_feed(con, urls)
        con.execute("INSERT OR REPLACE INTO meta(key, value) VALUES ('sites_last_poll', datetime('now'))")
        con.commit()

    # Accumulated across every poll ever done (deduped by link) - not just the current live
    # feed snapshot, so something already seen stays visible even after the site's own feed
    # moves on. Not filtered to the currently-configured feed URLs either: removing a site from
    # settings only stops new polling, it doesn't erase what was already found from it.
    rows = con.execute(
        "SELECT title, link, date, feed, image, duration, quality, tags, bookmarked "
        "FROM site_items ORDER BY first_seen DESC"
    ).fetchall()
    downloaded_urls = {
        r[0] for r in con.execute("SELECT DISTINCT url FROM downloads WHERE status='ok'").fetchall()
    }
    items = [
        {"title": r[0], "link": r[1], "date": r[2], "feed": r[3], "image": r[4],
         "duration": r[5], "quality": r[6], "tags": json.loads(r[7]) if r[7] else [],
         "bookmarked": bool(r[8]), "downloaded": r[1] in downloaded_urls}
        for r in rows
    ]
    updated_row = con.execute("SELECT value FROM meta WHERE key='sites_last_poll'").fetchone()
    return {"available": True, "items": items, "errors": errors,
            "cached": not (refresh or stale), "updated_at": updated_row[0] if updated_row else None}


MEDIA_RSS_NS = "{http://search.yahoo.com/mrss/}"


def extract_item_image(item):
    """Best-effort thumbnail for a generic RSS <item>: tries the common conventions in order
    (plain enclosure, media RSS thumbnail/content, then a raw <img> inside the description)
    since there's no single standard for it across sites."""
    enc = item.find("enclosure")
    if enc is not None:
        url = enc.get("url")
        typ = enc.get("type") or ""
        if url and (typ.startswith("image") or not typ):
            return url
    thumb = item.find(f"{MEDIA_RSS_NS}thumbnail")
    if thumb is not None and thumb.get("url"):
        return thumb.get("url")
    content = item.find(f"{MEDIA_RSS_NS}content")
    if content is not None and content.get("url"):
        if content.get("medium") == "image" or (content.get("type") or "").startswith("image") or content.get("medium") is None:
            return content.get("url")
    thumb_tag = (item.findtext("thumb") or "").strip()
    if thumb_tag:
        return thumb_tag
    desc = item.findtext("description") or item.findtext("{http://purl.org/rss/1.0/modules/content/}encoded") or ""
    m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', desc)
    if m:
        return m.group(1)
    return None


ITUNES_NS = "{http://www.itunes.com/dtds/podcast-1.0.dtd}"


def extract_item_duration(item):
    """Seconds, from whichever convention the feed actually uses - a plain <duration> (common
    on tube-style feeds), Media RSS's duration attribute, or a podcast-style itunes:duration
    (mm:ss or hh:mm:ss)."""
    raw = (item.findtext("duration") or "").strip()
    if raw:
        try:
            return float(raw)
        except ValueError:
            pass
    content = item.find(f"{MEDIA_RSS_NS}content")
    if content is not None and content.get("duration"):
        try:
            return float(content.get("duration"))
        except ValueError:
            pass
    itunes_dur = (item.findtext(f"{ITUNES_NS}duration") or "").strip()
    if itunes_dur:
        try:
            secs = 0.0
            for part in itunes_dur.split(":"):
                secs = secs * 60 + float(part)
            return secs
        except ValueError:
            pass
    return None


def extract_item_quality(item):
    """Resolution isn't part of any RSS convention, but Media RSS's width/height attributes are
    common enough to be worth checking - absent on most feeds, so this is best-effort only."""
    content = item.find(f"{MEDIA_RSS_NS}content")
    if content is not None:
        try:
            w, h = content.get("width"), content.get("height")
            if w and h:
                return quality_label(int(w), int(h))
        except ValueError:
            pass
    return None


def extract_item_tags(item):
    """Tags via RSS's standard <category> elements first, falling back to a comma-separated
    <keywords> (common on tube-style feeds, not part of the RSS spec)."""
    tags = [(c.text or "").strip() for c in item.findall("category")]
    tags = [t for t in tags if t]
    if not tags:
        kw = (item.findtext("keywords") or "").strip()
        if kw:
            tags = [t.strip() for t in kw.split(",") if t.strip()]
    return tags[:12]


def _poll_sites_feed(con, urls):
    """Fetches every configured feed and upserts its items into site_items (insert new ones,
    refresh metadata on ones already seen) - the accumulation itself, as opposed to do_sites_feed
    which just decides whether it's time to call this and then reads the accumulated table."""
    import xml.etree.ElementTree as ET
    errors = []
    for url in urls:
        fetch_url = url if "://" in url else f"https://{url}"
        origin = urllib.parse.urlsplit(fetch_url).scheme + "://" + urllib.parse.urlsplit(fetch_url).netloc + "/"
        try:
            content_type, body = _fetch(fetch_url)
            looks_like_xml = "xml" in content_type or body.lstrip().startswith(b"<?xml") or body.lstrip().startswith(b"<rss")
            if not looks_like_xml:
                # not a feed - try to auto-discover the site's real feed URL from the page itself
                feed_url = discover_feed_url(fetch_url, body)
                if not feed_url:
                    raise ValueError(
                        "no RSS/Atom feed found on this page (no <link rel=\"alternate\"> declared) - "
                        "this site may not publish one"
                    )
                content_type, body = _fetch(feed_url)
            root = ET.fromstring(body)
            found = 0
            for item in root.iter("item"):
                title = (item.findtext("title") or "").strip()
                link = (item.findtext("link") or "").strip()
                pub = (item.findtext("pubDate") or "").strip()
                if title and link:
                    image = cache_thumbnail(con, extract_item_image(item), referer=origin)
                    duration = fmt_duration(extract_item_duration(item))
                    quality = extract_item_quality(item)
                    tags = extract_item_tags(item)
                    con.execute(
                        """INSERT INTO site_items(link, title, date, feed, image, duration, quality, tags, first_seen, last_seen)
                           VALUES (?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))
                           ON CONFLICT(link) DO UPDATE SET
                             title=excluded.title, date=excluded.date, feed=excluded.feed,
                             image=COALESCE(excluded.image, site_items.image),
                             duration=excluded.duration,
                             quality=excluded.quality, tags=excluded.tags, last_seen=excluded.last_seen""",
                        (link, title, pub, url, image, duration, quality, json.dumps(tags)),
                    )
                    found += 1
            con.commit()
            if found == 0:
                raise ValueError("fetched a feed but found no <item> entries in it")
        except Exception as e:
            log.error(f"[Stash RAG] feed error on {url}: {e}")
            errors.append({"feed": url, "error": str(e)})
    return errors


def main():
    json_input = json.loads(sys.stdin.read())
    stash = StashInterface(json_input["server_connection"])
    args = json_input.get("args") or {}
    settings = load_settings(stash)

    mode = args.get("mode")
    if mode == "reindex":
        do_index(stash, settings, full=True)
        return
    if mode == "index":
        do_index(stash, settings, full=False)
        return
    if mode == "install_ytdlp":
        do_install_ytdlp(stash)
        return

    # Cheap (usually a no-op empty table) - piggybacks pending Watch Later tagging onto whatever
    # call happens to come in next, instead of needing a background daemon.
    process_pending_tags(stash)

    operation = args.get("operation")
    if operation == "capabilities":
        print(json.dumps({"output": {"ytdlp_available": ytdlp_available()}}))
        return
    if operation == "ask":
        result = do_ask(stash, settings, args.get("question", ""))
        print(json.dumps({"output": result}))
        return
    if operation == "download":
        result = do_download(stash, settings, args.get("url", ""))
        print(json.dumps({"output": result}))
        return
    if operation == "clear_image_cache":
        result = do_clear_image_cache(stash)
        print(json.dumps({"output": result}))
        return
    if operation == "download_history":
        result = do_download_history(stash)
        print(json.dumps({"output": result}))
        return
    if operation == "delete_download":
        result = do_delete_download(stash, args.get("id"))
        print(json.dumps({"output": result}))
        return
    if operation == "toggle_watch_later":
        result = do_toggle_watch_later(stash, args.get("id"))
        print(json.dumps({"output": result}))
        return
    if operation == "toggle_bookmark":
        result = do_toggle_bookmark(stash, args.get("link", ""))
        print(json.dumps({"output": result}))
        return
    refresh = bool(args.get("refresh"))
    if operation == "recommendations":
        result = do_recommendations(stash, refresh)
        print(json.dumps({"output": result}))
        return
    if operation == "profile":
        result = do_profile(stash, refresh)
        print(json.dumps({"output": result}))
        return
    if operation == "sites":
        result = do_sites_feed(stash, settings, refresh)
        print(json.dumps({"output": result}))
        return
    if operation == "history":
        result = do_history(stash)
        print(json.dumps({"output": result}))
        return
    if operation == "duplicates":
        result = do_duplicates(stash, refresh)
        print(json.dumps({"output": result}))
        return
    if operation == "delete_scene":
        result = do_delete_scene(stash, args.get("scene_id"))
        print(json.dumps({"output": result}))
        return

    log.error(f"[Stash RAG] unknown mode/operation: mode={mode!r} operation={operation!r}")


if __name__ == "__main__":
    main()
