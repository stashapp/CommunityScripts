"""Clip/scene toggle engine for the scene-to-imageclip plugin.

scene_to_imageclip.py is the plugin's one entry point. It reads Stash's input and hands
these modes here: "to_clip" / "to_scene" (the page button, through runPluginOperation)
and "recover" (the "Recover interrupted toggles" task).

args:   {"mode": "to_clip"|"to_scene", "id": <entity id>} or {"mode": "recover"}.
output: the dict returned by run() / run_recover() (see README).
stderr: log lines with Stash's level prefix. Content-free: ids, counts, route names,
        field names, error classes. Never a path, basename or title.

A toggle writes a journal file (plugin folder, `journal/`) before it renames anything and
removes it when it is done. If Stash kills the process part way (the browser request was
cancelled, Stash restarted), the next toggle, or the "Recover interrupted toggles" task,
reads the journal and rolls the toggle back or finishes it.
"""
import contextlib
import errno
import http.client
import ipaddress
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toggle_core as core  # noqa: E402

PLUGIN_ID = "scene-to-imageclip"
JOURNAL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "journal")
SCAN_TIMEOUT_S = 180        # running time allowed once the scan job leaves the queue
SCAN_QUEUE_CAP_S = 15 * 60  # hard cap on time queued (READY) behind other jobs
SETTLE_WAIT_S = 180         # how long to wait for a running scan to end before renaming back
# Errors from os.link that mean "this filesystem has no hard links" (some network shares).
NO_HARDLINKS = {errno.EPERM, errno.ENOTSUP, errno.EOPNOTSUPP, errno.ENOSYS, errno.EMLINK}

CONFIG_QUERY = """query ToggleConfig($ids: [ID!]) {
  configuration {
    general {
      stashes { path excludeVideo excludeImage }
      videoExtensions imageExtensions calculateMD5
    }
    plugins(include: $ids)
  }
}"""
SCENE_QUERY = "query ToggleScene($id: ID!) { findScene(id: $id) { %s } }" % core.SCENE_FIELDS
IMAGE_QUERY = "query ToggleImage($id: ID!) { findImage(id: $id) { %s } }" % core.IMAGE_FIELDS
SCAN_MUTATION = "mutation ToggleScan($input: ScanMetadataInput!) { metadataScan(input: $input) }"
JOB_QUERY = "query ToggleJob($id: ID!) { findJob(input: {id: $id}) { status addTime } }"
STOP_JOB = "mutation ToggleStopJob($id: ID!) { stopJob(job_id: $id) }"
_IMAGES_AT = """query %s($path: String!) {
  findImages(image_filter: {path: {value: $path, modifier: EQUALS}}, filter: {per_page: -1}) {
    images { id visual_files { __typename ... on VideoFile { id path } ... on ImageFile { id path } } }
  }
}"""
_SCENES_AT = """query %s($path: String!) {
  findScenes(scene_filter: {path: {value: $path, modifier: EQUALS}}, filter: {per_page: -1}) {
    scenes { id files { id path } }
  }
}"""
FIND_IMAGES_AT = _IMAGES_AT % "ToggleFindImages"
FIND_SCENES_AT = _SCENES_AT % "ToggleFindScenes"
TARGET_IMAGES_AT = _IMAGES_AT % "ToggleTargetImages"
TARGET_SCENES_AT = _SCENES_AT % "ToggleTargetScenes"
# One lookup per group: findGroups(ids:) fails outright when any id is missing.
GROUP_QUERY = "query ToggleGroup($id: ID!) { findGroup(id: $id) { id } }"
IMAGE_GALLERIES = "query ToggleImageGalleries($id: ID!) { findImage(id: $id) { galleries { id } } }"
SCENE_GALLERIES = "query ToggleSceneGalleries($id: ID!) { findScene(id: $id) { galleries { id } } }"
IMAGE_UPDATE = "mutation ToggleImageUpdate($input: ImageUpdateInput!) { imageUpdate(input: $input) { id } }"
SCENE_UPDATE = "mutation ToggleSceneUpdate($input: SceneUpdateInput!) { sceneUpdate(input: $input) { id } }"
IMAGE_INCREMENT_O = "mutation ToggleImageIncrementO($id: ID!) { imageIncrementO(id: $id) }"
SCENE_ADD_O = ("mutation ToggleSceneAddO($id: ID!, $times: [Timestamp!]) "
               "{ sceneAddO(id: $id, times: $times) { count } }")
SCENE_ADD_PLAY = ("mutation ToggleSceneAddPlay($id: ID!, $times: [Timestamp!]) "
                  "{ sceneAddPlay(id: $id, times: $times) { count } }")
SCENE_SAVE_ACTIVITY = ("mutation ToggleSceneSaveActivity($id: ID!, $resume: Float, $duration: Float) "
                       "{ sceneSaveActivity(id: $id, resume_time: $resume, playDuration: $duration) }")
MARKER_CREATE = ("mutation ToggleMarkerCreate($input: SceneMarkerCreateInput!) "
                 "{ sceneMarkerCreate(input: $input) { id } }")
GENERATE = "mutation ToggleGenerate($input: GenerateMetadataInput!) { metadataGenerate(input: $input) }"
SCENE_DESTROY = "mutation ToggleSceneDestroy($input: SceneDestroyInput!) { sceneDestroy(input: $input) }"
IMAGE_DESTROY = "mutation ToggleImageDestroy($input: ImageDestroyInput!) { imageDestroy(input: $input) }"
# DB rows only. Never deleteFiles, which removes the file from disk.
DESTROY_FILES = "mutation ToggleDestroyFiles($ids: [ID!]!) { destroyFiles(ids: $ids) }"


def log(level, msg):
    """Stash raw-interface log line: \\x01<level>\\x02<msg>. Levels t d i w e."""
    sys.stderr.write("\x01%s\x02%s\n" % (level, msg))
    sys.stderr.flush()


class GraphQLError(Exception):
    """Content-free: carries an HTTP status or the GraphQL field path, never a message body.

    `rejected` is True when Stash answered and refused the request (a GraphQL error);
    False for transport trouble, where the request may or may not have taken effect."""

    def __init__(self, message, rejected=False):
        super().__init__(message)
        self.rejected = rejected


class StepFailed(Exception):
    def __init__(self, code, message):
        super().__init__(code)
        self.code = code
        self.message = message


# ── connection ───────────────────────────────────────────────────────────────

def connect_host(host):
    """The host to call. Stash reports its bind address; 0.0.0.0, :: or empty mean 'any'."""
    h = (host or "").strip()
    if h.startswith("[") and h.endswith("]"):
        h = h[1:-1]
    if h in ("", "0.0.0.0", "::"):
        return "localhost"
    return h


def is_loopback(host):
    if host.lower() == "localhost":
        return True
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


class StashClient:
    def __init__(self, conn, timeout=60):
        scheme = conn.get("Scheme") or "http"
        port = conn.get("Port") or 9999
        host = connect_host(conn.get("Host"))
        shown = "[%s]" % host if ":" in host else host
        self.url = "%s://%s:%s/graphql" % (scheme, shown, port)
        self.timeout = timeout
        self.context = None
        if scheme == "https" and is_loopback(host):
            # Talking to our own Stash over loopback: a self-signed or hostname-bound
            # certificate must not block it. Other hosts keep normal verification.
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            self.context = ctx
        self.headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if conn.get("ApiKey"):
            self.headers["ApiKey"] = conn["ApiKey"]
        else:
            cookie = conn.get("SessionCookie") or {}
            if cookie.get("Value"):
                self.headers["Cookie"] = "%s=%s" % (cookie.get("Name") or "session", cookie["Value"])

    def call(self, query, variables=None):
        body = json.dumps({"query": query, "variables": variables or {}}).encode("utf-8")
        req = urllib.request.Request(self.url, data=body, headers=self.headers, method="POST")
        kwargs = {"timeout": self.timeout}
        if self.context is not None:
            kwargs["context"] = self.context
        try:
            with urllib.request.urlopen(req, **kwargs) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            raise GraphQLError("http %d" % e.code) from None
        except urllib.error.URLError:
            raise GraphQLError("connection failed") from None
        except (OSError, http.client.HTTPException, ValueError) as e:
            raise GraphQLError("transport error (%s)" % e.__class__.__name__) from None
        try:
            errors = payload.get("errors")
            if errors:
                where = ".".join(str(p) for p in (errors[0].get("path") or [])) or "request"
                raise GraphQLError("graphql error at %s" % where, rejected=True)
        except GraphQLError:
            raise
        except Exception:
            raise GraphQLError("malformed response") from None
        return payload.get("data") or {}


def read_input(stream=None):
    return json.loads((stream or sys.stdin).read())


# ── journal ──────────────────────────────────────────────────────────────────

def _try_lock(fh):
    """Exclusive, non-blocking lock on an open file. False when another process holds it."""
    try:
        if os.name == "nt":
            import msvcrt
            fh.seek(0)
            msvcrt.locking(fh.fileno(), msvcrt.LK_NBLCK, 1)
        else:
            import fcntl
            fcntl.flock(fh.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        return True
    except OSError:
        return False


def _unlock(fh):
    try:
        if os.name == "nt":
            import msvcrt
            fh.seek(0)
            msvcrt.locking(fh.fileno(), msvcrt.LK_UNLCK, 1)
        else:
            import fcntl
            fcntl.flock(fh.fileno(), fcntl.LOCK_UN)
    except OSError:
        pass


def _write_json(path, data):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def _remove(path):
    try:
        os.remove(path)
    except FileNotFoundError:
        pass


class Journal:
    """One in-flight toggle. `<id>.lock` is held locked for the life of the process, so
    recovery can tell a live toggle (lock taken) from a killed one (lock free)."""

    def __init__(self, directory, jid, lock_fh, data):
        self.directory, self.id, self.lock_fh, self.data = directory, jid, lock_fh, data
        self.json_path = os.path.join(directory, jid + ".json")
        self.lock_path = os.path.join(directory, jid + ".lock")

    @classmethod
    def start(cls, directory, data):
        os.makedirs(directory, exist_ok=True)
        jid = uuid.uuid4().hex
        lock_fh = open(os.path.join(directory, jid + ".lock"), "a+")
        if not _try_lock(lock_fh):
            lock_fh.close()
            raise OSError(errno.EAGAIN, "journal lock")
        journal = cls(directory, jid, lock_fh, dict(data, v=1))
        journal.update()
        return journal

    def update(self, **fields):
        self.data.update(fields)
        _write_json(self.json_path, self.data)

    def release(self):
        """Let go of the lock but keep the journal for recovery."""
        try:
            _unlock(self.lock_fh)
            self.lock_fh.close()
        except OSError:
            pass

    def finish(self):
        """Remove the journal. Never raises: the toggle's own result matters more than
        tidying up, and a leftover journal is handled by the next recovery pass."""
        try:
            _remove(self.json_path)
        except OSError as e:
            log("w", "journal not removed (%s)" % e.__class__.__name__)
        self.release()
        try:
            _remove(self.lock_path)
        except OSError:
            pass


@contextlib.contextmanager
def plugin_lock(directory):
    """One lock for the whole plugin, held around check-then-rename where hard links are
    not available."""
    os.makedirs(directory, exist_ok=True)
    fh = open(os.path.join(directory, "rename.lock"), "a+")
    try:
        if os.name == "nt":
            import msvcrt
            fh.seek(0)
            msvcrt.locking(fh.fileno(), msvcrt.LK_LOCK, 1)
        else:
            import fcntl
            fcntl.flock(fh.fileno(), fcntl.LOCK_EX)
        yield
    finally:
        _unlock(fh)
        fh.close()


def no_replace_rename(src, dst, *, link=os.link, unlink=os.unlink, rename=os.rename,
                      exists=os.path.lexists, lock_dir=None):
    """Move src to dst, never replacing an existing dst.

    A hard link fails atomically when dst exists; the old name is then removed. Where the
    filesystem has no hard links, check and rename run under one plugin-wide lock, so two
    toggles cannot race each other (another program could still, in that case)."""
    try:
        link(src, dst)
    except FileExistsError:
        raise
    except OSError as e:
        if e.errno not in NO_HARDLINKS:
            raise
        with plugin_lock(lock_dir or JOURNAL_DIR):
            if exists(dst):
                raise FileExistsError(errno.EEXIST, "target exists") from None
            rename(src, dst)
        return
    try:
        unlink(src)
    except OSError:
        try:
            unlink(dst)
        except OSError:
            pass
        raise


# ── Stash steps ──────────────────────────────────────────────────────────────

def plugin_settings(configuration):
    """This plugin's settings from a `configuration { plugins }` answer ({} when none are set)."""
    return ((configuration or {}).get("plugins") or {}).get(PLUGIN_ID) or {}


def clip_ext_setting(configuration):
    """The clipExtension setting with the default applied; a malformed value is logged."""
    ext, malformed = core.clip_ext_from_setting(plugin_settings(configuration).get("clipExtension"))
    if malformed:
        log("w", "clipExtension setting is not 1-16 letters and digits; using %s" % ext)
    return ext


def load_config(client):
    """(configuration.general, destination root, clip extension) with the defaults applied."""
    conf = client.call(CONFIG_QUERY, {"ids": [PLUGIN_ID]})["configuration"]
    settings = plugin_settings(conf)
    general = conf["general"]
    return (general, core.dest_root_from_setting(settings.get("destinationRoot"), general.get("stashes")),
            clip_ext_setting(conf))


def load_scene(client, scene_id):
    return client.call(SCENE_QUERY, {"id": scene_id}).get("findScene")


def load_image(client, image_id):
    return client.call(IMAGE_QUERY, {"id": image_id}).get("findImage")


def load_source(client, mode, source_id):
    return load_scene(client, source_id) if mode == "to_clip" else load_image(client, source_id)


def scan_path(client, path, timeout=SCAN_TIMEOUT_S, queue_cap=SCAN_QUEUE_CAP_S, interval=1.0,
              sleep=time.sleep, clock=time.monotonic, on_job=None):
    """Queue a scan of one exact file and poll findJob until it ends. Returns the job id.

    Stash runs jobs one at a time, so time spent queued (READY) behind other jobs does not
    count against `timeout`; the running deadline starts when the job first leaves the
    queue. `queue_cap` bounds the time spent queued so a stuck queue still fails.
    `on_job(job_id, add_time)` is called once with the id, then again with the job's add
    time (which tells this job apart from a later one that reuses the id after a restart).
    """
    job_id = client.call(SCAN_MUTATION, {"input": {"paths": [path]}})["metadataScan"]
    if on_job is not None:
        on_job(job_id, None)
    start = clock()
    run_deadline = None
    added = None
    while True:
        sleep(interval)
        job = client.call(JOB_QUERY, {"id": job_id}).get("findJob")
        if job is None:
            return job_id  # finished and already pruned from the queue; the lookup verifies
        if added is None and job.get("addTime") and on_job is not None:
            added = job["addTime"]
            on_job(job_id, added)
        status = job.get("status")
        if status == "FINISHED":
            return job_id
        if status in ("FAILED", "CANCELLED"):
            raise StepFailed("scan_failed", "scan job ended %s" % status.lower())
        now = clock()
        if status != "READY" and run_deadline is None:
            run_deadline = now + timeout
        if run_deadline is not None and now >= run_deadline:
            message = "scan did not finish in %ds" % timeout
            break
        if status == "READY" and now - start >= queue_cap:
            message = "scan still queued after %ds" % queue_cap
            break
    try:
        client.call(STOP_JOB, {"id": job_id})  # keep a late scan from adding an orphan
    except GraphQLError:
        pass
    raise StepFailed("scan_timeout", message)


def find_new_entity(client, mode, new_path):
    """Entities whose file path equals new_path exactly. The LIKE-based EQUALS filter only
    narrows the lookup; toggle_core.exact_path_matches decides. Paths stay engine-internal."""
    if mode == "to_clip":
        found = client.call(FIND_IMAGES_AT, {"path": new_path})["findImages"]["images"]
    else:
        found = client.call(FIND_SCENES_AT, {"path": new_path})["findScenes"]["scenes"]
    return core.exact_path_matches(found, new_path, mode)


def records_at(client, path):
    """Ids of every scene or image that already has a file row at exactly `path`."""
    images = client.call(TARGET_IMAGES_AT, {"path": path})["findImages"]["images"]
    scenes = client.call(TARGET_SCENES_AT, {"path": path})["findScenes"]["scenes"]
    return ([e["id"] for e in core.exact_path_matches(images, path, "to_clip")] +
            [e["id"] for e in core.exact_path_matches(scenes, path, "to_scene")])


def checked_rename(src, dst, rename=None, exists=os.path.lexists):
    """Move that never replaces an existing target (see no_replace_rename)."""
    if exists(dst):
        raise FileExistsError(errno.EEXIST, "target exists")
    (rename or no_replace_rename)(src, dst)


def set_galleries(client, kind, entity_id, ids):
    """Add the source's galleries to the new item in their own update.

    The update replaces the gallery list, so it is merged with what the new item already
    has (a scan can put it in a folder gallery). Returns "kept", "rejected" (Stash refused
    it: report galleries as dropped) or "unsure" (no answer: keep the old record)."""
    if not ids:
        return "kept"
    query, key, mutation = ((IMAGE_GALLERIES, "findImage", IMAGE_UPDATE) if kind == "image"
                            else (SCENE_GALLERIES, "findScene", SCENE_UPDATE))
    try:
        current = [str(g["id"]) for g in (client.call(query, {"id": entity_id}).get(key) or {}).get("galleries") or []]
        merged = list(dict.fromkeys(current + [str(i) for i in ids]))
        if merged != current:
            client.call(mutation, {"input": {"id": entity_id, "gallery_ids": merged}})
        return "kept"
    except GraphQLError as e:
        return "rejected" if e.rejected else "unsure"


def apply_galleries(client, kind, entity_id, ids, carried, dropped, incomplete):
    result = set_galleries(client, kind, entity_id, ids)
    if result == "rejected":
        _drop(carried, dropped, "galleries")
    elif result == "unsure":
        _drop(carried, dropped, "galleries")
        incomplete.append("galleries")


def _drop(carried, dropped, name):
    if name in carried:
        carried.remove(name)
    if name not in dropped:
        dropped.append(name)


def transfer_to_image(client, scene, image_id, have_o=0):
    """Copy a scene's fields onto the new image. Returns (carried, dropped, backup_saved, incomplete).

    `have_o` is the image's current O count; only the shortfall is added, so the Transfer
    task can run this again on a clip that already has the scene's O count.
    """
    carried, dropped = core.carried_and_dropped("to_clip", scene)
    incomplete = []
    client.call(IMAGE_UPDATE, {"input": dict(core.scene_to_image_input(scene), id=image_id)})
    apply_galleries(client, "image", image_id, core.gallery_ids(scene), carried, dropped, incomplete)
    for _ in range(max(0, core.o_count(scene.get("o_counter")) - core.o_count(have_o))):
        client.call(IMAGE_INCREMENT_O, {"id": image_id})
    backup = core.build_backup(scene)
    if not core.backup_has_content(backup):
        return carried, dropped, False, incomplete
    client.call(IMAGE_UPDATE, {"input": {"id": image_id, "custom_fields": {
        "partial": {core.BACKUP_KEY: core.encode_backup(backup)}}}})
    return carried, dropped, True, incomplete


def existing_group_ids(client, ids):
    present = set()
    for gid in dict.fromkeys(ids):
        if client.call(GROUP_QUERY, {"id": gid}).get("findGroup"):
            present.add(str(gid))
    return present


def _now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def transfer_to_scene(client, image, scene_id, now=_now):
    """Copy an image's fields (and its backup) onto the new scene.

    Returns (carried, dropped, False, incomplete). `incomplete` names data that could not
    be restored but is still on the old image (scene_markers, damaged backup items, an
    unreadable backup, galleries when Stash did not answer); the caller then keeps the old
    image so nothing is lost. Groups that no longer exist are dropped and reported.
    """
    carried, dropped = core.carried_and_dropped("to_scene", image)
    incomplete = []
    if core.backup_state(image.get("custom_fields")) == "corrupt":
        incomplete.append("backup")
    raw_backup, _user_fields = core.restore_plan(image.get("custom_fields"))
    backup = None
    if raw_backup is not None:
        backup, bad = core.check_backup(raw_backup)
        incomplete += [b for b in bad if b not in incomplete]
    inp = dict(core.image_to_scene_input(image), id=scene_id)
    if backup:
        inp.update(core.backup_scene_input(backup))
        groups = core.backup_groups(backup)
        if groups:
            present = existing_group_ids(client, [g["group_id"] for g in groups])
            kept = [g for g in groups if g["group_id"] in present]
            if len(kept) < len(groups):
                # A deleted group cannot be restored by keeping the old image, so this is
                # reported, not a reason to keep it.
                _drop(carried, dropped, "groups")
            if kept:
                inp["groups"] = kept
    client.call(SCENE_UPDATE, {"input": inp})
    apply_galleries(client, "scene", scene_id, core.gallery_ids(image), carried, dropped, incomplete)
    times, extra = core.o_replay_plan(image.get("o_counter"), backup)
    times = list(times) + [now()] * extra
    if times:
        client.call(SCENE_ADD_O, {"id": scene_id, "times": times})
    if backup:
        plays = list(backup.get("play_history") or [])
        if plays:
            client.call(SCENE_ADD_PLAY, {"id": scene_id, "times": plays})
        resume = backup.get("resume_time") or 0
        duration = backup.get("play_duration") or 0
        if resume or duration:
            client.call(SCENE_SAVE_ACTIVITY, {"id": scene_id, "resume": resume, "duration": duration})
        for marker in backup.get("markers") or []:
            try:
                client.call(MARKER_CREATE, {"input": core.marker_input(scene_id, marker)})
            except GraphQLError:
                if "scene_markers" not in incomplete:
                    incomplete.append("scene_markers")
    for name in incomplete:
        _drop(carried, dropped, name)
    return carried, dropped, False, incomplete


def generate(client, mode, new_id):
    """Queue derivatives for the new entity; do not poll. Returns the job id."""
    if mode == "to_clip":
        inp = {"imageIDs": [new_id], "clipPreviews": True, "imageThumbnails": True, "imagePhashes": True}
    else:
        inp = {"sceneIDs": [new_id], "covers": True, "sprites": True, "previews": True,
               "phashes": True, "markers": True}
    return client.call(GENERATE, {"input": inp})["metadataGenerate"]


def destroy_old(client, mode, old_id, old_file_id, new_file_id):
    """Destroy the old record, never its file. True when Stash confirms the destroy."""
    mutation, key = (SCENE_DESTROY, "sceneDestroy") if mode == "to_clip" else (IMAGE_DESTROY, "imageDestroy")
    inp = {"id": old_id, "delete_file": False, "delete_generated": True,
           "destroy_file_entry": core.destroy_file_entry(old_file_id, new_file_id)}
    return client.call(mutation, {"input": inp}).get(key) is True


def keep_old_record(client, mode, old_id, old_file_id, next_file_id):
    """Final step for a multi-file source: the old record keeps its other files and metadata.

    Promote the next file to primary, then drop the moved file's dead row (DB only).
    True when both steps were confirmed; False leaves the old record as it is.
    """
    mutation, key = (SCENE_UPDATE, "sceneUpdate") if mode == "to_clip" else (IMAGE_UPDATE, "imageUpdate")
    updated = client.call(mutation, {"input": {"id": old_id, "primary_file_id": next_file_id}}).get(key)
    if not updated:
        return False
    return client.call(DESTROY_FILES, {"ids": [old_file_id]}).get("destroyFiles") is True


def kept_old_warning(source_id, incomplete, shared=False):
    saved = [n for n in incomplete if n != "galleries"]
    head = "old item kept: #%s, because %s could not be copied or restored" % (source_id, ", ".join(incomplete))
    if saved:
        head += "; the saved data is still in its %s custom field" % core.BACKUP_KEY
    if "galleries" in incomplete:
        head += "; its galleries are still on it"
    if shared:
        return head + ". It shares its file with the new item; delete it in Stash (keep the file) when done"
    return head + ". Its file has moved, so Stash's Clean task would delete it"


def final_step(client, mode, source_id, old_file_id, new_file_id, remaining, incomplete):
    """Retire the old record. Returns a warning string or None."""
    if remaining:
        try:
            kept_clean = keep_old_record(client, mode, source_id, old_file_id, remaining[0])
        except Exception:
            kept_clean = False
        warning = None if kept_clean else (
            "old record kept with a missing-file row: #%s (run Stash's Clean task)" % source_id)
        if incomplete:
            extra = "%s could not be restored; the saved data is still on old item #%s" % (
                ", ".join(incomplete), source_id)
            warning = extra if warning is None else warning + "; " + extra
        return warning
    if incomplete:
        return kept_old_warning(source_id, incomplete,
                                shared=not core.destroy_file_entry(old_file_id, new_file_id))
    try:
        destroyed = destroy_old(client, mode, source_id, old_file_id, new_file_id)
    except Exception:
        destroyed = False
    return None if destroyed else "old record not destroyed: #%s" % source_id


def rollback(client, mode, path, new_path, new_entity_id, destroy_file_entry=True, rename=None,
             exists=os.path.lexists):
    """Undo a failed toggle. Returns a list of content-free problem names (empty when clean).

    Safe to run twice: a file already back at `path` is not renamed again.
    """
    problems = []
    if new_entity_id is not None:
        mutation, key = (IMAGE_DESTROY, "imageDestroy") if mode == "to_clip" else (SCENE_DESTROY, "sceneDestroy")
        try:
            done = client.call(mutation, {"input": {
                "id": new_entity_id, "delete_file": False, "delete_generated": True,
                "destroy_file_entry": destroy_file_entry}}).get(key) is True
        except Exception:
            done = False
        if not done:
            problems.append("new_entity_kept")
    already_back = exists(path) and not exists(new_path)
    if not already_back:
        try:
            checked_rename(new_path, path, rename, exists)
        except OSError:
            problems.append("rename_back_failed")
            return problems
    try:
        client.call(SCAN_MUTATION, {"input": {"paths": [path]}})
    except Exception:
        problems.append("rescan_not_queued")
    return problems


# ── recovery ─────────────────────────────────────────────────────────────────

def settle_scan(client, job_id, added, in_task, sleep=time.sleep, clock=time.monotonic, trust_id=False):
    """Make sure the toggle's scan job cannot run later. True when it is over or stopped.

    Job ids are a counter that starts again at 1 when Stash restarts, so an id from a
    journal is acted on only when the job's add time matches the one recorded with it.
    Without a recorded add time the job is treated as gone: a scan that still runs later
    finds no file at the new path once it has been renamed back. `trust_id` is for the
    toggle's own process, which cannot outlive a restart.
    """
    if not job_id:
        return True

    def ours(job):
        return trust_id or (added is not None and job.get("addTime") == added)

    try:
        job = client.call(JOB_QUERY, {"id": job_id}).get("findJob")
    except GraphQLError:
        return False
    if job is None or job.get("status") in ("FINISHED", "FAILED", "CANCELLED") or not ours(job):
        return True
    if job.get("status") == "READY":
        try:
            client.call(STOP_JOB, {"id": job_id})
        except GraphQLError:
            return False
        return True
    if in_task:
        return False  # cannot be RUNNING while our task holds the queue; be safe
    deadline = clock() + SETTLE_WAIT_S
    while clock() < deadline:
        sleep(1.0)
        try:
            job = client.call(JOB_QUERY, {"id": job_id}).get("findJob")
        except GraphQLError:
            return False
        if job is None or job.get("status") in ("FINISHED", "FAILED", "CANCELLED") or not ours(job):
            return True
    return False


def roll_back_toggle(client, j, *, in_task=False, trust_id=False, sleep=time.sleep,
                     clock=time.monotonic, rename=None, exists=os.path.lexists):
    """Undo a toggle from its journal data: settle the scan, find what the scan made at the
    new path, destroy it if it is ours, rename the file back, rescan the old path. Used by
    the toggle itself on failure and by recovery. Returns (problems, unsure_code).

    problems: content-free names of steps that did not complete (empty when clean).
    unsure_code: set when the scan result was not one clean new item (ambiguous); nothing
    was destroyed, and a person should look.
    """
    mode, old, new = j["mode"], j["old_path"], j["new_path"]
    old_file_id = str(j["old_file_id"])
    if not settle_scan(client, j.get("scan_job"), j.get("scan_added"), in_task, sleep, clock, trust_id):
        return ["scan_running"], None
    problems, unsure, stray = [], None, None
    new_id, destroy_entry = None, True
    try:
        found = find_new_entity(client, mode, new)
    except GraphQLError:
        found, problems = None, ["lookup_failed"]
    if found is not None:
        eid, fid, refusal = core.classify_found(found, mode, old_file_id)
        if refusal is None:
            new_id, destroy_entry = eid, core.destroy_file_entry(old_file_id, fid)
        elif refusal.code == "duplicate_content":
            stray = core.stray_file_row(found, mode, new)
        elif refusal.code != "new_entity_not_found":
            unsure = refusal.code
    problems += rollback(client, mode, old, new, new_id, destroy_entry, rename, exists)
    if stray and "rename_back_failed" not in problems and not exists(new):
        # The scan added the renamed file to an existing item; the file is back at its old
        # name, so that row now points at nothing. Remove the row (database only).
        try:
            ok = client.call(DESTROY_FILES, {"ids": [stray[1]]}).get("destroyFiles") is True
        except Exception:
            ok = False
        if not ok:
            problems.append("stale_row_kept")
    return problems, unsure


# Problems that may clear on a later try (Stash busy or briefly unreachable, a file
# locked): the journal is kept. Anything else needs a person and the journal is set aside.
RETRYABLE = ("new_entity_kept", "rename_back_failed", "rescan_not_queued", "old_record_kept", "scan_running",
             "lookup_failed", "stale_row_kept")


def recover_one(client, j, *, in_task=False, sleep=time.sleep, clock=time.monotonic,
                rename=None, exists=os.path.lexists):
    """(outcome, problems) for one leftover journal.
    Outcomes: discarded, rolled_back, completed, deferred (kept for a later try), stuck, failed."""
    mode, old, new = j["mode"], j["old_path"], j["new_path"]
    action = core.recovery_action(j, exists(old), exists(new))
    if action == "discard":
        return "discarded", []
    if action == "stuck":
        return "stuck", ["disk_mismatch"]
    source_id, old_file_id = j["source_id"], str(j["old_file_id"])
    if action == "complete":
        if j.get("incomplete"):
            return "completed", []  # old record is kept on purpose
        entity = load_source(client, mode, source_id)
        if entity is None:
            return "completed", []
        if old_file_id not in [str(f.get("id")) for f in core.source_files(mode, entity)]:
            return "completed", []  # final step already ran
        warning = final_step(client, mode, source_id, old_file_id, j.get("new_file_id"),
                             j.get("remaining") or [], [])
        return ("completed", []) if warning is None else ("deferred", ["old_record_kept"])
    problems, unsure = roll_back_toggle(client, j, in_task=in_task, sleep=sleep, clock=clock,
                                        rename=rename, exists=exists)
    if unsure:
        return "failed", [unsure] + problems
    if not problems:
        return "rolled_back", []
    return ("deferred" if all(p in RETRYABLE for p in problems) else "failed"), problems


def recover_all(client, directory=None, *, in_task=False, sleep=time.sleep, clock=time.monotonic,
                rename=None, exists=os.path.lexists):
    """Handle every journal left by a killed toggle. Returns {outcome: count}.

    A journal whose lock is held belongs to a toggle that is still running and is skipped.
    A journal recovery cannot settle is renamed to `.failed` and left for a person.
    """
    directory = directory or JOURNAL_DIR
    counts = {}
    try:
        names = sorted(n for n in os.listdir(directory) if n.endswith(".json"))
    except FileNotFoundError:
        return counts
    for name in names:
        jid = name[:-len(".json")]
        json_path = os.path.join(directory, name)
        lock_path = os.path.join(directory, jid + ".lock")
        try:
            lock_fh = open(lock_path, "a+")
        except OSError:
            continue
        if not _try_lock(lock_fh):
            lock_fh.close()
            counts["in_progress"] = counts.get("in_progress", 0) + 1
            continue
        try:
            j = {}
            try:
                with open(json_path, encoding="utf-8") as f:
                    j = json.load(f)
                outcome, problems = recover_one(client, j, in_task=in_task, sleep=sleep, clock=clock,
                                                rename=rename, exists=exists)
            except FileNotFoundError:
                continue  # finished between the listing and the lock
            except (GraphQLError, OSError) as e:
                # Stash or the disk did not answer this time: keep the journal for a later try.
                outcome, problems = "deferred", [e.__class__.__name__]
            except Exception as e:  # unreadable journal or a bug: set it aside for a person
                outcome, problems = "failed", [e.__class__.__name__]
            if not isinstance(j, dict):
                j = {}
            try:
                if outcome in ("discarded", "rolled_back", "completed"):
                    _remove(json_path)
                elif outcome in ("stuck", "failed"):
                    os.replace(json_path, os.path.join(directory, jid + ".failed"))
            except OSError:
                pass
            counts[outcome] = counts.get(outcome, 0) + 1
            log("w" if outcome in ("stuck", "failed", "deferred") else "i",
                "recover %s #%s outcome=%s problems=%s" % (
                    j.get("mode", "?"), j.get("source_id", "?"), outcome, ",".join(problems) or "-"))
        finally:
            _unlock(lock_fh)
            lock_fh.close()
            if not os.path.exists(json_path):
                try:
                    _remove(lock_path)
                except OSError:
                    pass
    return counts


# ── one toggle ───────────────────────────────────────────────────────────────

def refused(mode, source_id, refusal, problems=()):
    shown_mode = mode if mode in core.MODES else "?"
    log("w", "toggle %s #%s refused code=%s problems=%d" % (shown_mode, source_id, refusal.code, len(problems)))
    message = refusal.message
    if problems:
        message += " (rollback incomplete: %s)" % ", ".join(problems)
    return {"ok": False, "code": refusal.code, "message": message}


def run(args, client, *, sleep=time.sleep, clock=time.monotonic, rename=None,
        isfile=os.path.isfile, exists=os.path.lexists, journal_dir=None):
    """One toggle: recover leftovers, preflight, rename, scan, find, transfer, generate,
    retire the old record. Any failure after the rename rolls back. Returns the `output`."""
    journal_dir = journal_dir or JOURNAL_DIR
    mode = args.get("mode")
    source_id = core.normalize_id(args.get("id"))
    if mode not in core.MODES or source_id is None:
        return refused(mode, source_id, core.Refusal("bad_args", "args need mode to_clip|to_scene and a numeric id"))
    try:
        recovered = recover_all(client, journal_dir, sleep=sleep, clock=clock, rename=rename, exists=exists)
    except Exception:
        recovered = {"failed": 1}
    try:
        general, dest_root, clip_ext = load_config(client)
        entity = load_source(client, mode, source_id)
    except GraphQLError as e:
        return refused(mode, source_id, core.Refusal("load_failed", "could not load (%s)" % e))
    if entity is None:
        return refused(mode, source_id, core.Refusal("not_found", "no item with that id"))
    refusal = core.preflight(mode, entity, general, dest_root, isfile=isfile, clip_ext=clip_ext)
    if refusal is not None:
        return refused(mode, source_id, refusal)
    src = core.primary_file(mode, entity)
    path, old_file_id = src["path"], str(src["id"])
    budget = core.scan_budget(src.get("size"), SCAN_TIMEOUT_S)
    remaining = core.remaining_file_ids(mode, entity)
    root = core.find_root(path, general["stashes"])
    plan = core.plan_route(mode, path, root, dest_root, source_id, exists, clip_ext)
    if isinstance(plan, core.Refusal):
        return refused(mode, source_id, plan)
    try:
        if records_at(client, plan.new_path):
            return refused(mode, source_id, core.Refusal(
                "target_has_record",
                "an item in Stash already points at the target name; run Stash's Clean task, then try again"))
    except GraphQLError as e:
        return refused(mode, source_id, core.Refusal("load_failed", "could not check the target (%s)" % e))

    try:
        journal = Journal.start(journal_dir, {
            "state": "renaming", "mode": mode, "source_id": source_id, "old_path": path,
            "new_path": plan.new_path, "old_file_id": old_file_id, "remaining": remaining,
            "started": int(time.time())})
    except OSError:
        return refused(mode, source_id, core.Refusal(
            "journal_unwritable", "cannot write the journal in the plugin folder"))

    try:
        checked_rename(path, plan.new_path, rename, exists)
    except FileExistsError:
        journal.finish()
        return refused(mode, source_id, core.Refusal("collision", "target name was taken just before the rename"))
    except OSError as e:
        journal.finish()
        if e.errno == errno.EXDEV:
            return refused(mode, source_id, core.Refusal("cross_device", "destination is on another filesystem"))
        return refused(mode, source_id, core.Refusal(
            "rename_failed", "rename failed (%s)" % errno.errorcode.get(e.errno, "OSError")))

    step, new_id, new_file_id, destroy_entry = "scan", None, None, True
    try:
        journal.update(state="renamed")
        scan_path(client, plan.new_path, timeout=budget, sleep=sleep, clock=clock,
                  on_job=lambda job, added: journal.update(state="scanning", scan_job=job, scan_added=added))
        step = "find"
        eid, fid, found_refusal = core.classify_found(
            find_new_entity(client, mode, plan.new_path), mode, old_file_id)
        if found_refusal is not None:
            raise StepFailed(found_refusal.code, found_refusal.message)
        new_id, new_file_id = eid, fid
        destroy_entry = core.destroy_file_entry(old_file_id, new_file_id)
        if not destroy_entry and remaining:
            raise StepFailed("shared_file_row",
                             "Stash moved the file row instead of adding one; multi-file items cannot be converted")
        journal.update(state="found", new_id=new_id, new_file_id=new_file_id)
        step = "transfer"
        if mode == "to_clip":
            carried, dropped, backup_saved, incomplete = transfer_to_image(client, entity, new_id)
        else:
            carried, dropped, backup_saved, incomplete = transfer_to_scene(client, entity, new_id)
        step = "generate"
        generate_job = generate(client, mode, new_id)
        journal.update(state="transferred", incomplete=incomplete)
    except Exception as e:  # every failure after the rename rolls back
        if isinstance(e, StepFailed):
            failure = core.Refusal(e.code, e.message)
        elif isinstance(e, GraphQLError):
            failure = core.Refusal("%s_failed" % step, "%s failed (%s)" % (step, e))
        else:
            failure = core.Refusal("%s_failed" % step, "%s failed (%s)" % (step, e.__class__.__name__))
        try:
            problems, _unsure = roll_back_toggle(client, journal.data, trust_id=True, sleep=sleep,
                                                 clock=clock, rename=rename, exists=exists)
        except Exception as e2:
            problems = [e2.__class__.__name__]
        if problems:
            # Leave the journal (marked by its state) for the next toggle or the Recover task.
            journal.release()
        else:
            journal.finish()
        return refused(mode, source_id, failure, problems)

    # Final step. No rollback from here on: the new entity is complete.
    try:
        warning = final_step(client, mode, source_id, old_file_id, new_file_id, remaining, incomplete)
    except Exception:
        warning = "old record not retired: #%s" % source_id
    journal.finish()
    out = {"ok": True, "mode": mode, "route": plan.kind, "moved": plan.moves,
           "old_id": source_id, "new_id": new_id,
           "new_type": "image" if mode == "to_clip" else "scene",
           "carried": carried, "dropped": dropped, "backup_saved": backup_saved,
           "generate_job": generate_job,
           "multi_file": bool(remaining), "remaining_files": len(remaining),
           "kept_old": bool(remaining or incomplete)}
    if warning:
        out["warning"] = warning
    if recovered:
        out["recovered"] = recovered
    log("i" if not warning else "w", "toggle %s #%s -> #%s route=%s remaining_files=%d dropped=%s%s" % (
        mode, source_id, new_id, plan.kind, len(remaining), ",".join(dropped) or "-",
        (" warning=" + warning) if warning else ""))
    return out


def run_recover(client):
    counts = recover_all(client, in_task=True)
    summary = ", ".join("%s=%d" % kv for kv in sorted(counts.items())) or "nothing to recover"
    log("i", "recover interrupted toggles: %s" % summary)
    return {"ok": True, "recovered": counts}
