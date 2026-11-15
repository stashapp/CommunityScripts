// Image Matcher - the operations, as sequences of ordinary Stash GraphQL calls.
// No database writes and no filesystem assumptions: merging works by stamping the files
// with a shared custom fingerprint, detaching the lesser image record and letting Stash's
// own scanner attach its file to the kept image.
// License: AGPL-3.0-or-later.
(function (root) {
  "use strict";

  var PLUGIN_ID = "image-matcher";
  var FILE_FIELDS = "id path size width height fingerprints { type value }";
  var FILES = "visual_files { __typename ... on ImageFile { " + FILE_FIELDS + " zip_file { id } } ... on VideoFile { " + FILE_FIELDS + " zip_file { id } } }";
  var LIGHT = "id " + FILES;
  var META = "id rating100 organized o_counter title code date details photographer urls studio { id } tags { id } performers { id } " +
    "galleries { id folder { path } files { id } } " + FILES;
  var GALLERY_META = "id rating100 organized title code date details photographer urls studio { id } tags { id } performers { id } scenes { id }";

  function createOps(gql, core, options) {
    options = options || {};
    var sleep = options.sleep || function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var q = JSON.stringify; // GraphQL string literals

    // ---- configuration (stored in Stash's plugin settings, not in the browser) ----
    function parseList(v) {
      if (Array.isArray(v)) return v;
      try { var p = JSON.parse(v || "[]"); return Array.isArray(p) ? p : []; } catch (e) { return []; }
    }
    function loadConfig() {
      return gql("{ configuration { plugins } }").then(function (d) {
        var raw = ((d.configuration || {}).plugins || {})[PLUGIN_ID] || {};
        return {
          distance: typeof raw.distance === "number" ? raw.distance : 4,
          folderRules: core.normalizeRules(parseList(raw.folderRules)),
          dismissed: parseList(raw.dismissed),
          setSkip: core.normalizeSkips(parseList(raw.setSkip)),
        };
      });
    }
    function saveConfig(cfg) {
      var input = {
        distance: cfg.distance,
        folderRules: JSON.stringify(core.normalizeRules(cfg.folderRules)),
        dismissed: JSON.stringify(cfg.dismissed || []),
        setSkip: JSON.stringify(core.normalizeSkips(cfg.setSkip)),
      };
      return gql("mutation($id: ID!, $input: Map!) { configurePlugin(plugin_id: $id, input: $input) }", { id: PLUGIN_ID, input: input });
    }

    // ---- reading ----
    // Images inside an archive (cbz, zip) are left out: a file in an archive cannot be deleted,
    // detached or rescanned on its own, so neither merge nor delete can work on it.
    // The returned list carries .archived, the number left out.
    function loadImages(onProgress) {
      var per = options.pageSize || 1000, items = [], seen = 0;
      items.archived = 0;
      function page(p) {
        return gql("query($p: Int!, $n: Int!) { findImages(filter: { page: $p, per_page: $n, sort: \"id\", direction: ASC }) { count images { " + LIGHT + " } } }", { p: p, n: per })
          .then(function (d) {
            var imgs = d.findImages.images;
            imgs.forEach(function (im) { var it = core.toItem(im); if (it.archived) items.archived++; else items.push(it); });
            seen += imgs.length;
            if (onProgress) onProgress(seen, d.findImages.count);
            if (imgs.length < per || seen >= d.findImages.count) return items;
            return page(p + 1);
          });
      }
      return page(1);
    }

    function aliased(prefix, ids, body) {
      return ids.map(function (id) { return prefix + id + ": " + body(id); }).join("\n");
    }
    function chunked(ids, size, fn) {
      var out = {}, chain = Promise.resolve();
      for (var i = 0; i < ids.length; i += size) (function (part) {
        chain = chain.then(function () { return fn(part); }).then(function (d) { Object.assign(out, d); });
      })(ids.slice(i, i + size));
      return chain.then(function () { return out; });
    }

    function imageMeta(ids) {
      return chunked(ids, 40, function (part) {
        return gql("{ " + aliased("i", part, function (id) { return "findImage(id: " + q(id) + ") { " + META + " }"; }) + " }");
      }).then(function (d) {
        var out = {};
        ids.forEach(function (id) {
          if (!d["i" + id]) throw new Error("image " + id + " no longer exists; run Find matches again");
          out[id] = d["i" + id];
        });
        return out;
      });
    }

    function fileInfo(fileIds) {
      return chunked(fileIds, 60, function (part) {
        return gql("{ " + aliased("f", part, function (id) {
          return "findFile(id: " + q(id) + ") { __typename ... on ImageFile { id fingerprints { type value } } ... on VideoFile { id fingerprints { type value } } }";
        }) + " }");
      }).then(function (d) {
        var out = {};
        fileIds.forEach(function (id) { out[id] = d["f" + id]; });
        return out;
      });
    }

    // Which images hold each file. Newer Stash answers directly (ImageFile.images); older
    // releases are asked which images have a file at that path.
    // A VideoFile (an image clip) has no such field on any version, so it always goes by path.
    var hasFileImages = null;
    function fileOwners(files) { // [{ id, path, type? }] -> { fileId: [imageId, ...] }
      var ready = hasFileImages !== null ? Promise.resolve() : gql('{ __type(name: "ImageFile") { fields { name } } }').then(function (d) {
        hasFileImages = (((d.__type || {}).fields) || []).some(function (f) { return f.name === "images"; });
      });
      return ready.then(function () {
        var idx = files.map(function (f, i) { return i; });
        return chunked(idx, 40, function (part) {
          return gql("{ " + part.map(function (i) {
            return hasFileImages && files[i].type !== "VideoFile"
              ? "o" + i + ": findFile(id: " + q(files[i].id) + ") { ... on ImageFile { images { id } } }"
              : "o" + i + ": findImages(image_filter: { path: { value: " + q(files[i].path) + ", modifier: EQUALS } }, filter: { per_page: -1 }) { images { id } }";
          }).join("\n") + " }");
        }).then(function (d) {
          var out = {};
          files.forEach(function (f, i) { out[f.id] = (((d["o" + i] || {}).images) || []).map(function (im) { return im.id; }); });
          return out;
        });
      });
    }

    function setFingerprints(entries) { // [{ fileId, fps: [{type, value|null}] }]
      if (!entries.length) return Promise.resolve();
      return chunked(entries.map(function (e, i) { return i; }), 60, function (part) {
        return gql("mutation { " + part.map(function (i) {
          var e = entries[i];
          var fps = e.fps.map(function (f) { return "{ type: " + q(f.type) + ", value: " + (f.value == null ? "null" : q(f.value)) + " }"; }).join(", ");
          return "s" + i + ": fileSetFingerprints(input: { id: " + q(e.fileId) + ", fingerprints: [" + fps + "] })";
        }).join("\n") + " }");
      });
    }

    function waitForJob(jobId) {
      var started = Date.now(), delay = 150;
      function poll() {
        return gql("query($id: ID!) { findJob(input: { id: $id }) { status error } }", { id: jobId }).then(function (d) {
          var job = d.findJob;
          if (!job || job.status === "FINISHED") return;
          if (job.status === "FAILED" || job.status === "CANCELLED") throw new Error("Stash scan " + job.status.toLowerCase() + (job.error ? ": " + job.error : ""));
          if (Date.now() - started > (options.jobTimeout || 30 * 60 * 1000)) throw new Error("timed out waiting for the Stash scan");
          delay = Math.min(delay * 1.5, 1500);
          return sleep(delay).then(poll);
        });
      }
      return poll();
    }

    // Scans exactly these files, 50 per job. Never their folders: a folder scan is recursive and
    // would walk (and import from) everything under a large folder.
    function scanPaths(paths) {
      var chain = Promise.resolve();
      for (var i = 0; i < paths.length; i += 50) (function (part) {
        chain = chain.then(function () {
          return gql("mutation($paths: [String!]) { metadataScan(input: { paths: $paths }) }", { paths: part })
            .then(function (d) { return waitForJob(d.metadataScan); });
        });
      })(paths.slice(i, i + 50));
      return chain;
    }

    // ---- shared: copy what the lesser records know onto the kept one ----
    function transferMeta(plan, meta) {
      var keeper = meta[plan.keeperId], losers = plan.loserIds.map(function (id) { return meta[id]; });
      var patch = core.mergeMeta(keeper, losers), chain = Promise.resolve();
      if (Object.keys(patch).length) {
        patch.id = keeper.id;
        chain = chain.then(function () { return gql("mutation($input: ImageUpdateInput!) { imageUpdate(input: $input) { id } }", { input: patch }); });
      }
      // hand-made galleries only: folder and zip galleries follow the files and cannot be edited
      var have = keeper.galleries.map(function (g) { return g.id; }), manual = [];
      losers.forEach(function (l) {
        l.galleries.forEach(function (g) {
          if (!g.folder && !(g.files || []).length && have.indexOf(g.id) < 0 && manual.indexOf(g.id) < 0) manual.push(g.id);
        });
      });
      manual.forEach(function (gid) {
        chain = chain.then(function () {
          return gql("mutation($g: ID!, $i: [ID!]!) { addGalleryImages(input: { gallery_id: $g, image_ids: $i }) }", { g: gid, i: [keeper.id] });
        });
      });
      var extraO = Math.min(100, losers.reduce(function (t, l) { return t + (l.o_counter || 0); }, 0));
      for (var n = 0; n < extraO; n++) chain = chain.then(function () { return gql("mutation($id: ID!) { imageIncrementO(id: $id) }", { id: keeper.id }); });
      return chain;
    }

    function checkPlans(plans) {
      var seen = {};
      plans.forEach(function (p) {
        [p.keeperId].concat(p.loserIds).forEach(function (id) {
          if (seen[id]) throw new Error("image " + id + " appears in two merges at once");
          seen[id] = true;
        });
        if (!p.loserIds.length) throw new Error("nothing to fold into image " + p.keeperId);
      });
    }
    function allIds(plans) { return plans.reduce(function (a, p) { return a.concat([p.keeperId], p.loserIds); }, []); }

    // ---- merge: one image record, every file kept where it is, keeper's file stays primary ----
    function mergeImages(plans, onStep) {
      var step = onStep || function () {};
      var meta, work = [], restore = [], detached = false;
      return Promise.resolve().then(function () {
        checkPlans(plans);
        return imageMeta(allIds(plans));
      }).then(function (m) {
        meta = m;
        var entries = [];
        plans.forEach(function (plan) {
          // A fresh stamp for every merge: one left behind by an earlier, failed merge must never match.
          var keeper = meta[plan.keeperId];
          var stamp = "im-" + keeper.id + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
          keeper.visual_files.forEach(function (f) { entries.push({ fileId: f.id, fps: [{ type: core.STAMP, value: stamp }] }); });
          var w = { keeperId: keeper.id, primaryFileId: keeper.visual_files[0].id, stamp: stamp, loserFiles: [] };
          plan.loserIds.forEach(function (id) {
            meta[id].visual_files.forEach(function (f) {
              var fps = [{ type: core.STAMP, value: stamp }], ph = core.fingerprint(f, "phash");
              // The scanner attaches a detached file to every image sharing any fingerprint.
              // Hide the phash for the moment so only the stamp can match, then put it back.
              if (ph) { fps.push({ type: "phash", value: null }); restore.push({ fileId: f.id, fps: [{ type: "phash", value: ph }] }); }
              entries.push({ fileId: f.id, fps: fps });
              w.loserFiles.push({ id: f.id, path: f.path, type: f.__typename });
            });
          });
          work.push(w);
        });
        step("Marking files");
        return setFingerprints(entries);
      }).then(function () {
        var ids = work.reduce(function (a, w) { return a.concat(w.loserFiles.map(function (f) { return f.id; })); }, []);
        return fileInfo(ids).then(function (info) {
          work.forEach(function (w) {
            w.loserFiles.forEach(function (f) {
              var fi = info[f.id];
              if (!fi || core.fingerprint(fi, core.STAMP) !== w.stamp || core.fingerprint(fi, "phash"))
                throw new Error("could not mark file " + f.id + "; nothing was merged");
            });
          });
        });
      }).then(function () {
        step("Copying tags and ratings");
        return plans.reduce(function (c, plan) { return c.then(function () { return transferMeta(plan, meta); }); }, Promise.resolve());
      }).then(function () {
        step("Detaching the lesser records");
        var ids = plans.reduce(function (a, p) { return a.concat(p.loserIds); }, []);
        // From here on assume the records are gone: a destroy whose answer was lost may still
        // have happened, and putting the phashes back on loose files is the dangerous mistake.
        detached = true;
        return gql("mutation($ids: [ID!]!) { imagesDestroy(input: { ids: $ids, delete_file: false, delete_generated: true }) }", { ids: ids });
      }).then(function () {
        step("Rescanning so Stash attaches the files");
        var paths = [];
        work.forEach(function (w) { w.loserFiles.forEach(function (f) { if (paths.indexOf(f.path) < 0) paths.push(f.path); }); });
        return scanPaths(paths);
      }).then(function () {
        step("Checking the result");
        var files = work.reduce(function (a, w) { return a.concat(w.loserFiles); }, []);
        return fileOwners(files).then(function (info) {
          var bad = [], badIds = {}, loose = 0;
          work.forEach(function (w) {
            w.loserFiles.forEach(function (f) {
              var owners = info[f.id] || [];
              if (owners.length === 1 && owners[0] === w.keeperId) return;
              badIds[f.id] = true;
              if (!owners.length) loose++;
              bad.push("file " + f.id + (owners.length ? " is on image(s) [" + owners.join(", ") + "]" : " is on no image") + ", expected " + w.keeperId);
            });
          });
          // the hash goes back on every file that landed; only the ones that did not stay hidden
          var ok = restore.filter(function (r) { return !badIds[r.fileId]; });
          restore = restore.filter(function (r) { return badIds[r.fileId]; });
          return setFingerprints(ok).then(function () {
            if (!bad.length) { detached = false; return; }
            var e = new Error("merge did not land cleanly: " + bad.join("; ") + ".");
            e.loose = loose; e.misplaced = bad.length - loose;
            throw e;
          });
        });
      }).then(function () {
        // the kept image's own file must still be the one shown
        return imageMeta(work.map(function (w) { return w.keeperId; })).then(function (now) {
          return work.reduce(function (c, w) {
            if (now[w.keeperId].visual_files[0].id === w.primaryFileId) return c;
            return c.then(function () {
              return gql("mutation($input: ImageUpdateInput!) { imageUpdate(input: $input) { id } }", { input: { id: w.keeperId, primary_file_id: w.primaryFileId } });
            });
          }, Promise.resolve());
        });
      }).then(function () {
        return { merged: work.reduce(function (t, w) { return t + w.loserFiles.length; }, 0), images: plans.length };
      }).catch(function (err) {
        // Before the detach nothing has changed, so the hidden phashes go straight back.
        // After it they must stay hidden: a detached file with its phash back would attach to
        // every equal-phash image on the next scan. Stamp-only, it can only join the kept image.
        if (!detached) return setFingerprints(restore).catch(function () {}).then(function () { throw err; });
        if (!/[.!?]$/.test(err.message)) err.message += ".";
        if (err.misplaced) err.message += " A file that is on another image needs sorting out by hand in Stash.";
        if (err.loose || err.misplaced === undefined) err.message += " Files still on no image stay marked, so a scan of their folder attaches them to the kept image." +
          " Afterwards run Generate with image perceptual hashes on, to rebuild the hashes that were set aside.";
        throw err;
      });
    }

    // ---- dedupe: keep one copy, delete the others from disk ----
    // Deleting an image deletes all of its files. A lesser image holding more than one file (one
    // that was merged, here or elsewhere) is left alone and counted in `skipped`; merging is the
    // right action for it. Works from what Stash says now, not from what the page loaded earlier.
    function dedupeImages(plans, onStep) {
      var step = onStep || function () {}, meta, skipped = 0;
      return Promise.resolve().then(function () {
        checkPlans(plans);
        return imageMeta(allIds(plans));
      }).then(function (m) {
        meta = m;
        plans = plans.map(function (p) {
          return { keeperId: p.keeperId, loserIds: p.loserIds.filter(function (id) {
            if (meta[id].visual_files.length > 1) { skipped++; return false; }
            return true;
          }) };
        }).filter(function (p) { return p.loserIds.length; });
        if (!plans.length) return { deleted: 0, images: 0, skipped: skipped, plans: plans };
        return dedupeNow(plans, meta, step).then(function (res) { res.skipped = skipped; res.plans = plans; return res; });
      });
    }
    function dedupeNow(plans, meta, step) {
      return Promise.resolve().then(function () {
        step("Copying tags and ratings");
        return plans.reduce(function (c, plan) { return c.then(function () { return transferMeta(plan, meta); }); }, Promise.resolve());
      }).then(function () {
        step("Deleting the lesser copies");
        var ids = plans.reduce(function (a, p) { return a.concat(p.loserIds); }, []);
        return gql("mutation($ids: [ID!]!) { imagesDestroy(input: { ids: $ids, delete_file: true, delete_generated: true }) }", { ids: ids })
          .then(function () { return { deleted: ids.length, images: plans.length }; });
      });
    }

    // One operation at a time. A merge restamps the kept image's files, so a second merge that
    // shares a keeper would orphan the files the first one has already detached.
    var running = false;
    function exclusive(fn) {
      return function () {
        if (running) return Promise.reject(new Error("Another merge or delete is still running. Wait for it to finish."));
        running = true;
        var done = function () { running = false; };
        var p;
        try { p = Promise.resolve(fn.apply(null, arguments)); } catch (err) { p = Promise.reject(err); }
        return p.then(function (r) { done(); return r; }, function (err) { done(); throw err; });
      };
    }

    // ---- folder pairs ----
    function folderGalleryIds(meta, folder) {
      var ids = [];
      Object.keys(meta).forEach(function (id) {
        meta[id].galleries.forEach(function (g) { if (g.folder && g.folder.path === folder && ids.indexOf(g.id) < 0) ids.push(g.id); });
      });
      return ids;
    }

    // Gallery "merge" = both folder galleries end up knowing the same things.
    // Their contents converge on their own once the images are merged.
    function syncGalleries(keepIds, otherIds, bothWays) {
      var ids = keepIds.concat(otherIds);
      if (!keepIds.length || !otherIds.length) return Promise.resolve(0);
      return gql("{ " + aliased("g", ids, function (id) { return "findGallery(id: " + q(id) + ") { " + GALLERY_META + " }"; }) + " }").then(function (d) {
        var keep = keepIds.map(function (id) { return d["g" + id]; }).filter(Boolean);
        var other = otherIds.map(function (id) { return d["g" + id]; }).filter(Boolean);
        var updates = [];
        keep.forEach(function (g) { var p = core.mergeMeta(g, other); if (Object.keys(p).length) { p.id = g.id; updates.push(p); } });
        if (bothWays) other.forEach(function (g) { var p = core.mergeMeta(g, keep); if (Object.keys(p).length) { p.id = g.id; updates.push(p); } });
        return updates.reduce(function (c, input) {
          return c.then(function () { return gql("mutation($input: GalleryUpdateInput!) { galleryUpdate(input: $input) { id } }", { input: input }); });
        }, Promise.resolve()).then(function () { return updates.length; });
      });
    }

    function runSet(plans, keepFolder, otherFolder, mode, onStep) {
      var keepG, otherG;
      return imageMeta(allIds(plans)).then(function (meta) {
        keepG = folderGalleryIds(meta, keepFolder);
        otherG = folderGalleryIds(meta, otherFolder);
        return mode === "merge" ? mergeImages(plans, onStep) : dedupeImages(plans, onStep);
      }).then(function (res) {
        res.skipped = res.skipped || 0; res.plans = res.plans || plans;
        if (onStep) onStep("Syncing gallery details");
        return syncGalleries(keepG, otherG, mode === "merge").then(function (n) { res.galleriesUpdated = n; return res; });
      });
    }
    function mergeSet(plans, keepFolder, otherFolder, onStep) { return runSet(plans, keepFolder, otherFolder, "merge", onStep); }
    function dedupeSet(plans, keepFolder, otherFolder, onStep) { return runSet(plans, keepFolder, otherFolder, "dedupe", onStep); }

    return {
      loadConfig: loadConfig, saveConfig: saveConfig, loadImages: loadImages, imageMeta: imageMeta, fileInfo: fileInfo, fileOwners: fileOwners,
      mergeImages: exclusive(mergeImages), dedupeImages: exclusive(dedupeImages), mergeSet: exclusive(mergeSet), dedupeSet: exclusive(dedupeSet), scanPaths: scanPaths,
    };
  }

  var api = { createOps: createOps, PLUGIN_ID: PLUGIN_ID };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ImageMatcher = root.ImageMatcher || {};
  root.ImageMatcher.ops = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
