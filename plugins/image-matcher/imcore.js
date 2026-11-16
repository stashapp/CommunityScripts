// Image Matcher - pure matching and decision logic (no network, no DOM).
// Runs in the browser as part of the Stash UI plugin and under node for tests.
// License: AGPL-3.0-or-later.
(function (root) {
  "use strict";

  var STAMP = "imagematch"; // custom fingerprint type that marks files a person merged

  function dirname(p) {
    var i = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
    if (i < 0) return "";
    return i === 0 ? p.slice(0, 1) : p.slice(0, i);
  }

  // Stash deletes a file by first renaming it to "<name>.delete" (stashapp/stash#3664), so a file
  // whose name is within 7 bytes of the usual 255-byte limit cannot be deleted through Stash.
  var NAME_MAX = 255, DELETE_SUFFIX = ".delete";
  function utf8Length(s) {
    var n = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c < 0x80) n += 1;
      else if (c < 0x800) n += 2;
      else if (c >= 0xd800 && c < 0xdc00 && i + 1 < s.length) { n += 4; i++; }
      else n += 3;
    }
    return n;
  }
  function tooLongToDelete(p) {
    p = p || "";
    var name = p.slice(Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\")) + 1);
    return name.length > 0 && utf8Length(name) + DELETE_SUFFIX.length > NAME_MAX;
  }

  function popcount32(v) {
    v = v - ((v >>> 1) & 0x55555555);
    v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
    return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
  }

  // "c0b7a1ee10ea7c3a" -> [hi, lo] as unsigned 32-bit numbers
  function parseHash(hex) {
    if (typeof hex !== "string" || !/^[0-9a-fA-F]{1,16}$/.test(hex)) return null;
    var s = hex.padStart(16, "0");
    return [parseInt(s.slice(0, 8), 16) >>> 0, parseInt(s.slice(8), 16) >>> 0];
  }

  function hashDistance(a, b) {
    return popcount32((a[0] ^ b[0]) >>> 0) + popcount32((a[1] ^ b[1]) >>> 0);
  }

  function fingerprint(file, type) {
    var fps = (file && file.fingerprints) || [];
    for (var i = 0; i < fps.length; i++) if (fps[i].type === type) return fps[i].value;
    return null;
  }

  // GraphQL image (id + visual_files) -> the small record the matcher works on.
  // The first visual file is the primary one.
  function toItem(image) {
    var files = (image.visual_files || []).filter(function (f) { return f && f.id; }).map(function (f) {
      return {
        id: String(f.id), path: f.path || "", size: Number(f.size) || 0,
        width: f.width || 0, height: f.height || 0, phash: fingerprint(f, "phash"),
        archived: !!(f.zip_file && f.zip_file.id), longName: tooLongToDelete(f.path),
      };
    });
    var primary = files[0] || { path: "", size: 0, width: 0, height: 0 };
    var hash = null;
    for (var i = 0; i < files.length && !hash; i++) hash = parseHash(files[i].phash);
    var folders = [];
    files.forEach(function (f) { var d = dirname(f.path); if (folders.indexOf(d) < 0) folders.push(d); });
    return {
      id: String(image.id), files: files, folder: dirname(primary.path), folders: folders,
      area: primary.width * primary.height, width: primary.width, height: primary.height,
      size: primary.size, phash: hash,
      archived: files.some(function (f) { return f.archived; }), // any file inside a cbz or zip
      longName: files.some(function (f) { return f.longName; }), // a file Stash cannot delete
    };
  }

  // Groups items whose hashes are within maxDist bits of each other (connected components).
  // Pigeonhole banding: split the 64 bits into maxDist+1 bands; two hashes within maxDist
  // must agree exactly on at least one band, so only items sharing a band value are compared.
  function findGroups(items, maxDist) {
    var pos = [];
    for (var i = 0; i < items.length; i++) if (items[i].phash) pos.push(i);
    var n = pos.length, hi = new Uint32Array(n), lo = new Uint32Array(n), k;
    for (k = 0; k < n; k++) { hi[k] = items[pos[k]].phash[0]; lo[k] = items[pos[k]].phash[1]; }

    var parent = new Int32Array(n);
    for (k = 0; k < n; k++) parent[k] = k;
    function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
    function union(a, b) { a = find(a); b = find(b); if (a !== b) parent[b < a ? a : b] = b < a ? b : a; }

    // collapse exact-equal hashes first so large runs of identical hashes cost nothing later
    var exact = new Map(), uniq = [];
    for (k = 0; k < n; k++) {
      var key = hi[k] + ":" + lo[k], rep = exact.get(key);
      if (rep === undefined) { exact.set(key, k); uniq.push(k); } else union(rep, k);
    }

    var compared = 0;
    if (maxDist > 0) {
      var bands = maxDist + 1;
      for (var b = 0; b < bands; b++) {
        var start = Math.floor((b * 64) / bands), end = Math.floor(((b + 1) * 64) / bands);
        var buckets = new Map();
        for (var u = 0; u < uniq.length; u++) {
          var p = uniq[u], bk = bandKey(hi[p], lo[p], start, end), arr = buckets.get(bk);
          if (arr) arr.push(p); else buckets.set(bk, [p]);
        }
        buckets.forEach(function (arr) {
          for (var x = 0; x < arr.length; x++) {
            var ax = arr[x], hx = hi[ax], lx = lo[ax];
            for (var y = x + 1; y < arr.length; y++) {
              var ay = arr[y];
              compared++;
              if (popcount32((hx ^ hi[ay]) >>> 0) + popcount32((lx ^ lo[ay]) >>> 0) <= maxDist) union(ax, ay);
            }
          }
        });
      }
    }

    var byRoot = new Map();
    for (k = 0; k < n; k++) {
      var r = find(k), g = byRoot.get(r);
      if (g) g.push(pos[k]); else byRoot.set(r, [pos[k]]);
    }
    var groups = [];
    byRoot.forEach(function (g) { if (g.length > 1) groups.push(g); });
    return { groups: groups, hashed: n, skipped: items.length - n, compared: compared };
  }

  // value of bits [start, end) of the 64-bit hash, bit 0 being the top bit of hi (width <= 32)
  function bandKey(hi, lo, start, end) {
    var width = end - start;
    if (end <= 32) return width === 32 ? hi : (hi >>> (32 - end)) & ((1 << width) - 1);
    if (start >= 32) return width === 32 ? lo : (lo >>> (64 - end)) & ((1 << width) - 1);
    var hiBits = 32 - start, loBits = end - 32;
    var top = hiBits === 32 ? hi : hi & ((1 << hiBits) - 1);
    return top * Math.pow(2, loBits) + (lo >>> (32 - loBits));
  }

  // Folder rules: an ordered list of folder paths, first wins. A rule covers its subfolders.
  function normalizeRules(rules) {
    var out = [];
    (rules || []).forEach(function (r) {
      r = String(r || "").trim().replace(/[\/\\]+$/, "");
      if (r && out.indexOf(r) < 0) out.push(r);
    });
    return out;
  }

  function folderRank(folder, rules) {
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (folder === r || folder.indexOf(r + "/") === 0 || folder.indexOf(r + "\\") === 0) return i;
    }
    return Infinity;
  }

  var REASONS = ["lowest id", "larger file", "larger resolution", "in colour", "folder rule"];

  // Do two look-alikes differ in one place? a and b are brightness grids (n x n bytes) of the two
  // thumbnails. A resized or recompressed copy differs a little everywhere; two drawings that differ
  // in one detail differ a lot in a few neighbouring cells and hardly at all elsewhere.
  // When the pictures differ nearly everywhere (the typical window is far off, or a fifth of the
  // windows are hot) they are different pictures, not copies: that is `different`.
  // Returns { spot, different, flag, hot, peak, base, box }; flag is spot or different, and box is
  // the differing area of a spot as fractions of the picture.
  var DIFF_N = 128, DIFF_CELL = 4, HOT_MIN = 22, HOT_RATIO = 8, HOT_MAX_SHARE = 0.2, DIFFERENT_BASE = 8;
  function localDiff(a, b, n, cell) {
    n = n || DIFF_N; cell = cell || DIFF_CELL;
    var per = n / cell, fine = new Float64Array(per * per), len = n * n, sum = 0, i, x, y;
    // an overall change of brightness or contrast is not a local difference: fit b = gain * a + lift
    // (least squares) and look at what is left over
    var ma = 0, mb = 0, cov = 0, va = 0;
    for (i = 0; i < len; i++) { ma += a[i]; mb += b[i]; }
    ma /= len; mb /= len;
    for (i = 0; i < len; i++) { cov += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) * (a[i] - ma); }
    var gain = va > 0 ? cov / va : 1, lift = mb - gain * ma;
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) {
      i = y * n + x;
      fine[Math.floor(y / cell) * per + Math.floor(x / cell)] += Math.abs(b[i] - gain * a[i] - lift);
    }
    // overlapping windows of 2 x 2 cells, so a small detail that straddles a cell edge still counts whole
    var wper = per - 1, wins = new Float64Array(wper * wper), sorted = [], peak = 0, area = cell * cell * 4;
    for (y = 0; y < wper; y++) for (x = 0; x < wper; x++) {
      var v = (fine[y * per + x] + fine[y * per + x + 1] + fine[(y + 1) * per + x] + fine[(y + 1) * per + x + 1]) / area;
      wins[y * wper + x] = v; sorted.push(v); if (v > peak) peak = v;
    }
    sorted.sort(function (p, q) { return p - q; });
    var base = sorted[Math.floor(sorted.length / 2)], limit = Math.max(HOT_MIN, base * HOT_RATIO);
    var hot = 0, x0 = wper, y0 = wper, x1 = -1, y1 = -1;
    for (i = 0; i < wins.length; i++) {
      if (wins[i] <= limit) continue;
      hot++;
      var cx = i % wper, cy = Math.floor(i / wper);
      if (cx < x0) x0 = cx; if (cx > x1) x1 = cx; if (cy < y0) y0 = cy; if (cy > y1) y1 = cy;
    }
    // judged against a fixed limit too, because a high median raises the relative one out of reach
    var hotFixed = 0;
    for (i = 0; i < wins.length; i++) if (wins[i] > HOT_MIN) hotFixed++;
    var different = base > DIFFERENT_BASE || hotFixed > wins.length * HOT_MAX_SHARE;
    var spot = !different && hot >= 1 && hot <= wins.length * HOT_MAX_SHARE;
    return { spot: spot, different: different, flag: spot || different, hot: hot, peak: peak, base: base,
      box: spot ? { x: x0 / per, y: y0 / per, w: (x1 - x0 + 2) / per, h: (y1 - y0 + 2) / per } : null };
  }
  // canvas rgba -> brightness bytes
  function luminance(rgba) {
    var out = new Uint8Array(rgba.length / 4);
    for (var i = 0, j = 0; i + 3 < rgba.length; i += 4, j++) out[j] = Math.round(0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]);
    return out;
  }

  // Is a picture in colour? rgba is canvas pixel data (4 bytes per pixel). The perceptual hash
  // only sees brightness, so a black-and-white copy matches its colour original; this tells them apart.
  // A toned print (sepia) counts as colour.
  function isColor(rgba) {
    var total = 0, n = 0;
    for (var i = 0; i + 3 < rgba.length; i += 4) {
      var r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
      total += Math.max(r, g, b) - Math.min(r, g, b); n++;
    }
    return n > 0 && total / n > 6;
  }

  // negative result means a is the better copy
  function compareItems(a, b, rules) {
    var ra = folderRank(a.folder, rules), rb = folderRank(b.folder, rules);
    if (ra !== rb) return { result: ra < rb ? -1 : 1, reason: "folder rule" };
    // colour beats black and white, unless the black-and-white copy has more than twice the pixels.
    // color is true/false once the page has looked at the thumbnail, and absent before that.
    if (typeof a.color === "boolean" && typeof b.color === "boolean" && a.color !== b.color) {
      var col = a.color ? a : b, grey = a.color ? b : a;
      if (grey.area <= col.area * 2) return { result: a.color ? -1 : 1, reason: "in colour" };
    }
    if (a.area !== b.area) return { result: a.area > b.area ? -1 : 1, reason: "larger resolution" };
    if (a.size !== b.size) return { result: a.size > b.size ? -1 : 1, reason: "larger file" };
    return { result: Number(a.id) < Number(b.id) ? -1 : 1, reason: "lowest id" };
  }

  // Which copy to keep: folder rule first, then colour over black and white, then resolution, then file size, then lowest id.
  function chooseKeeper(members, rules) {
    rules = rules || [];
    var best = members[0];
    for (var i = 1; i < members.length; i++) if (compareItems(members[i], best, rules).result < 0) best = members[i];
    var reason = members.length > 1 ? "lowest id" : "only copy";
    members.forEach(function (m) {
      if (m === best) return;
      var r = compareItems(best, m, rules).reason;
      if (REASONS.indexOf(r) > REASONS.indexOf(reason)) reason = r;
    });
    return { keeper: best, reason: reason };
  }

  // "Always prefer this folder": put the kept folder where it actually outranks the other one.
  // Rules are first-match and cover subfolders, so it goes ahead of the first rule that already
  // covers either folder; with no such rule it goes last.
  function rememberRule(rules, keepFolder, otherFolder) {
    var out = normalizeRules(rules).filter(function (r) { return r !== keepFolder; });
    var at = Math.min(folderRank(keepFolder, out), folderRank(otherFolder, out));
    out.splice(at === Infinity ? out.length : at, 0, keepFolder);
    return out;
  }

  function setKey(a, b) { return "set:" + (a < b ? a + "|" + b : b + "|" + a); }
  function groupKey(ids) { return ids.map(Number).sort(function (a, b) { return a - b; }).join("-"); }

  function defaultKeepSide(set, items, rules) {
    var ra = folderRank(set.folderA, rules), rb = folderRank(set.folderB, rules);
    if (ra !== rb) return { side: ra < rb ? "A" : "B", reason: "folder rule" };
    var a = 0, b = 0;
    set.matches.forEach(function (m) {
      var ka = chooseKeeper(m.a.map(function (i) { return items[i]; }), []).keeper;
      var kb = chooseKeeper(m.b.map(function (i) { return items[i]; }), []).keeper;
      var c = compareItems(ka, kb, []);
      if (c.reason === "lowest id") return;
      if (c.result < 0) a++; else b++;
    });
    if (a === b) return { side: "A", reason: "no difference found" };
    return { side: a > b ? "A" : "B", reason: "better copies in " + Math.max(a, b) + " of " + set.matches.length };
  }

  // Folder pairs that share look-alike images: "the same set in two places".
  // How far apart a folder-set match is: the worst phash distance between any image on one side
  // and any image on the other, so a label never understates. null when a hash is missing.
  function matchDistance(items, match) {
    var worst = null;
    match.a.forEach(function (i) {
      match.b.forEach(function (j) {
        if (!items[i].phash || !items[j].phash) return;
        var d = hashDistance(items[i].phash, items[j].phash);
        if (worst === null || d > worst) worst = d;
      });
    });
    return worst;
  }
  // The mix of a set: pairs with the same hash, pairs that differ, and the largest difference.
  function distanceMix(distances) {
    var mix = { same: 0, near: 0, max: 0, unknown: 0 };
    distances.forEach(function (d) {
      if (d === null) mix.unknown++; else if (d === 0) mix.same++; else { mix.near++; if (d > mix.max) mix.max = d; }
    });
    return mix;
  }

  // A look-alike group can hold several images in each of two folders (two different pictures
  // that happen to be close, each present in both folders). Treating that as one match would
  // merge them all into one image, so pair each image with its nearest counterpart instead.
  // One image against several on the other side stays one match (copies of the same picture).
  function splitMatch(items, m) {
    if (m.a.length < 2 || m.b.length < 2) return [m];
    var cross = [];
    m.a.forEach(function (i) {
      m.b.forEach(function (j) {
        var d = items[i].phash && items[j].phash ? hashDistance(items[i].phash, items[j].phash) : 65;
        cross.push({ i: i, j: j, d: d });
      });
    });
    cross.sort(function (p, q) { return p.d - q.d || p.i - q.i || p.j - q.j; });
    var subOfA = new Map(), subOfB = new Map(), subs = [];
    cross.forEach(function (c) {
      if (subOfA.has(c.i) || subOfB.has(c.j)) return;
      var sub = { group: m.group, a: [c.i], b: [c.j] };
      subs.push(sub); subOfA.set(c.i, sub); subOfB.set(c.j, sub);
    });
    cross.forEach(function (c) { // sides of unequal size: a leftover joins its nearest counterpart's pair
      if (!subOfA.has(c.i) && subOfB.has(c.j)) { subOfB.get(c.j).a.push(c.i); subOfA.set(c.i, subOfB.get(c.j)); }
      else if (!subOfB.has(c.j) && subOfA.has(c.i)) { subOfA.get(c.i).b.push(c.j); subOfB.set(c.j, subOfA.get(c.i)); }
    });
    return subs;
  }
  // stable name for one match of a set, used to leave it out of an action
  function pairKey(items, m) { return groupKey(m.a.concat(m.b).map(function (i) { return items[i].id; })); }

  // Is this folder left out of folder sets? A line names one folder exactly (its subfolders still
  // count); a line ending in /* covers the folder and everything under it.
  function folderSkipped(folder, skip) {
    for (var i = 0; i < skip.length; i++) {
      var s = skip[i];
      if (s.slice(-2) === "/*") { var root = s.slice(0, -2); if (folder === root || folder.indexOf(root + "/") === 0 || folder.indexOf(root + "\\") === 0) return true; }
      else if (folder === s) return true;
    }
    return false;
  }
  function normalizeSkips(list) {
    var out = [];
    (list || []).forEach(function (r) {
      r = String(r || "").trim();
      var deep = /[\/\\]\*$/.test(r);
      r = r.replace(/[\/\\]\*$/, "").replace(/[\/\\]+$/, "");
      if (r && deep) r += "/*";
      if (r && out.indexOf(r) < 0) out.push(r);
    });
    return out;
  }

  function buildSets(items, groups, rules, minMatches, skip) {
    rules = rules || []; skip = skip || [];
    minMatches = minMatches || 2;
    var folderCounts = new Map();
    // an image already merged across folders counts in each folder that holds one of its files
    function foldersOf(it) { return it.folders && it.folders.length ? it.folders : [it.folder]; }
    items.forEach(function (it) { foldersOf(it).forEach(function (f) { folderCounts.set(f, (folderCounts.get(f) || 0) + 1); }); });

    var sets = new Map();
    groups.forEach(function (group, gi) {
      var byFolder = new Map();
      group.forEach(function (idx) {
        foldersOf(items[idx]).forEach(function (f) {
          if (skip.length && folderSkipped(f, skip)) return;
          var arr = byFolder.get(f);
          if (arr) arr.push(idx); else byFolder.set(f, [idx]);
        });
      });
      var folders = Array.from(byFolder.keys()).sort();
      for (var x = 0; x < folders.length; x++) {
        for (var y = x + 1; y < folders.length; y++) {
          // an image holding files in both folders is already merged across them; a match
          // needs a different image on the other side
          var a = byFolder.get(folders[x]), b = byFolder.get(folders[y]);
          var bOnly = b.filter(function (i) { return a.indexOf(i) < 0; }), aOnly = a.filter(function (i) { return b.indexOf(i) < 0; });
          var match = bOnly.length ? { group: gi, a: a, b: bOnly } : aOnly.length ? { group: gi, a: aOnly, b: b } : null;
          if (!match) continue;
          var key = setKey(folders[x], folders[y]), s = sets.get(key);
          if (!s) { s = { key: key, folderA: folders[x], folderB: folders[y], matches: [] }; sets.set(key, s); }
          splitMatch(items, match).forEach(function (sub) { s.matches.push(sub); });
        }
      }
    });

    var out = [];
    sets.forEach(function (s) {
      if (s.matches.length < minMatches) return;
      s.countA = folderCounts.get(s.folderA) || 0;
      s.countB = folderCounts.get(s.folderB) || 0;
      s.matchedA = s.matches.reduce(function (t, m) { return t + m.a.length; }, 0);
      s.matchedB = s.matches.reduce(function (t, m) { return t + m.b.length; }, 0);
      var pick = defaultKeepSide(s, items, rules);
      s.keep = pick.side; s.reason = pick.reason;
      out.push(s);
    });
    out.sort(function (p, q) { return q.matches.length - p.matches.length || (p.key < q.key ? -1 : 1); });
    return out;
  }

  // For one folder pair: which image is kept and which are folded in, per match.
  // skip: optional { pairKey: true } of matches to leave out
  function setPlans(set, items, keepSide, skip) {
    return set.matches.filter(function (m) { return !(skip && skip[pairKey(items, m)]); }).map(function (m) {
      var keepIdx = keepSide === "A" ? m.a : m.b, loseIdx = keepSide === "A" ? m.b : m.a;
      var keeper = chooseKeeper(keepIdx.map(function (i) { return items[i]; }), []).keeper;
      return { keeperId: keeper.id, loserIds: loseIdx.map(function (i) { return items[i].id; }) };
    });
  }

  function unionList(lists) {
    var out = [];
    lists.forEach(function (l) { l.forEach(function (v) { if (out.indexOf(v) < 0) out.push(v); }); });
    return out;
  }

  // What the kept record should absorb from the others. Returns only the fields that change.
  // Works for images and galleries (same field names in Stash).
  function mergeMeta(keeper, losers) {
    var patch = {}, all = [keeper].concat(losers);

    var ratings = all.map(function (m) { return m.rating100; }).filter(function (r) { return r != null; });
    if (ratings.length) {
      var max = Math.max.apply(null, ratings);
      if (max !== keeper.rating100) patch.rating100 = max;
    }
    if (!keeper.organized && losers.some(function (m) { return m.organized; })) patch.organized = true;

    ["title", "code", "date", "photographer"].forEach(function (f) {
      if (keeper[f]) return;
      for (var i = 0; i < losers.length; i++) if (losers[i][f]) { patch[f] = losers[i][f]; return; }
    });

    var details = [];
    all.forEach(function (m) { var d = (m.details || "").trim(); if (d && details.indexOf(d) < 0) details.push(d); });
    var joined = details.join("\n\n");
    if (joined !== (keeper.details || "").trim()) patch.details = joined;

    var urls = unionList(all.map(function (m) { return m.urls || []; }));
    if (urls.length !== (keeper.urls || []).length) patch.urls = urls;

    if (!keeper.studio) {
      for (var s = 0; s < losers.length; s++) if (losers[s].studio) { patch.studio_id = losers[s].studio.id; break; }
    }

    [["tags", "tag_ids"], ["performers", "performer_ids"], ["scenes", "scene_ids"]].forEach(function (pair) {
      if (!all.some(function (m) { return m[pair[0]]; })) return;
      var ids = unionList(all.map(function (m) { return (m[pair[0]] || []).map(function (t) { return t.id; }); }));
      if (ids.length !== (keeper[pair[0]] || []).length) patch[pair[1]] = ids;
    });
    return patch;
  }

  var api = {
    STAMP: STAMP, dirname: dirname, popcount32: popcount32, parseHash: parseHash, hashDistance: hashDistance,
    fingerprint: fingerprint, toItem: toItem, tooLongToDelete: tooLongToDelete, findGroups: findGroups, bandKey: bandKey,
    normalizeRules: normalizeRules, folderRank: folderRank, chooseKeeper: chooseKeeper, compareItems: compareItems,
    buildSets: buildSets, matchDistance: matchDistance, isColor: isColor, rememberRule: rememberRule, folderRank: folderRank, folderSkipped: folderSkipped, normalizeSkips: normalizeSkips, localDiff: localDiff, luminance: luminance, DIFF_N: DIFF_N, splitMatch: splitMatch, pairKey: pairKey, distanceMix: distanceMix, setKey: setKey, groupKey: groupKey, setPlans: setPlans, mergeMeta: mergeMeta,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ImageMatcher = root.ImageMatcher || {};
  root.ImageMatcher.core = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
