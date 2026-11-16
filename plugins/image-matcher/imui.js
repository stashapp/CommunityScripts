// Image Matcher - the page. Every look-alike group and every folder pair ends in an action:
// merge (one image, all files kept), delete the lesser copies, or "not a match".
// License: AGPL-3.0-or-later.
(function () {
  "use strict";
  var PluginApi = window.PluginApi;
  if (!PluginApi || !window.ImageMatcher || !window.ImageMatcher.core || !window.ImageMatcher.ops) return;

  var React = PluginApi.React, h = React.createElement;
  var core = window.ImageMatcher.core;
  // not under /plugin/: Stash serves plugin assets there, so a refresh of the page would 404
  var ROUTE = "/image-matcher";
  var LEVELS = [[0, "Exact"], [4, "High"], [8, "Medium"], [10, "Low"]];
  var SETS_PER_PAGE = 8, GROUPS_PER_PAGE = 20;

  function url(path) { return new URL(path, document.baseURI).toString(); }
  function gql(query, variables) {
    return fetch(url("graphql"), {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query, variables: variables }),
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.errors && j.errors.length) throw new Error(j.errors.map(function (e) { return e.message; }).join("; "));
      return j.data;
    });
  }
  var ops = window.ImageMatcher.ops.createOps(gql, core);

  // thumbnail zoom is a per-browser convenience, so it lives in localStorage, not the plugin settings
  var ZOOM_KEY = "imageMatcherZoom", ZOOM_MIN = 1, ZOOM_MAX = 4;
  function readZoom() {
    try { var z = Number(window.localStorage.getItem(ZOOM_KEY)); return z >= ZOOM_MIN && z <= ZOOM_MAX ? z : 1; } catch (err) { return 1; }
  }
  function writeZoom(z) { try { window.localStorage.setItem(ZOOM_KEY, String(z)); } catch (err) { /* private window: zoom just isn't remembered */ } }

  // Thumbnail check: draw the thumbnail small and measure it (in colour or not, and a brightness
  // grid for comparing two look-alikes). Results are kept per image id; a few at a time.
  var colorCache = {}, colorQueue = [], colorActive = 0;
  function pumpColor() {
    while (colorActive < 4 && colorQueue.length) {
      colorActive++;
      colorQueue.shift()();
    }
  }
  function colorOf(id) {
    if (!colorCache[id]) colorCache[id] = new Promise(function (resolve) {
      colorQueue.push(function () {
        var img = new Image(), done = function (v) { colorActive--; resolve(v); pumpColor(); };
        img.onload = function () {
          try {
            var n = core.DIFF_N, c = document.createElement("canvas"); c.width = n; c.height = n;
            var ctx = c.getContext("2d", { willReadFrequently: true }); ctx.drawImage(img, 0, 0, n, n);
            var px = ctx.getImageData(0, 0, n, n).data;
            done({ color: core.isColor(px), lum: core.luminance(px) });
          } catch (err) { done(null); }
        };
        img.onerror = function () { done(null); };
        img.src = url("image/" + id + "/thumbnail");
      });
      pumpColor();
    });
    return colorCache[id];
  }

  // the comparison of two items, or null while either thumbnail is still being read (or could not be)
  function diffOf(a, b) { return a.lum && b.lum ? core.localDiff(a.lum, b.lum) : null; }
  function checking(list) { return list.filter(function (it) { return it.lum === undefined || it.lum === 0; }).length; }
  var SPOT_TEXT = "differs in one area", DIFFERENT_TEXT = "looks like a different picture";
  function diffText(d) { return d.different ? DIFFERENT_TEXT : SPOT_TEXT; }

  function fmtSize(b) {
    if (b >= 1048576) return (b / 1048576).toFixed(1) + " MB";
    if (b >= 1024) return Math.round(b / 1024) + " KB";
    return b + " B";
  }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many || one + "s"); }
  // what a delete left alone, and why; merging is the way out
  function leftAlone(res) {
    var t = "";
    if (res.tooLong) t += " Left " + plural(res.tooLong, "image") + " alone because " + (res.tooLong === 1 ? "its file name is" : "their file names are") + " too long for Stash to delete; merge " + (res.tooLong === 1 ? "it" : "those") + " instead.";
    return t;
  }
  var LONG_TEXT = "Name too long for Stash to delete; merge instead";
  // every folder an image's files are in, with a count where a folder holds more than one
  function folderList(m) {
    var counts = {}, order = [];
    m.files.forEach(function (f) { var d = core.dirname(f.path); if (!counts[d]) { counts[d] = 0; order.push(d); } counts[d]++; });
    return order.map(function (d) { return counts[d] > 1 ? d + " (" + counts[d] + " files)" : d; });
  }
  // the folders of the images that hold several files, for a delete warning; "" when there are none
  function severalFiles(images, except) {
    var multi = images.filter(function (m) { return m.files.length > 1; }), dirs = [];
    multi.forEach(function (m) { m.files.forEach(function (f) { var d = core.dirname(f.path); if (d !== except && dirs.indexOf(d) < 0) dirs.push(d); }); });
    if (!multi.length) return "";
    return (multi.length === 1 ? "One of these images holds" : plural(multi.length, "of these images", "of these images") + " hold") + " several files; all of them go" +
      (dirs.length ? ", including files in " + dirs.join(", ") : "") + ". ";
  }
  // "Deleted 2 copies (3 files)" when merged images took extra files with them
  function deletedText(res, where) {
    return "Deleted " + plural(res.deleted, "copy", "copies") + (res.files > res.deleted ? " (" + plural(res.files, "file") + ")" : "") + where;
  }

  // The picture sits in a box of its own shape inside the thumbnail frame, so a marker placed by
  // fractions of the picture lands on the right spot at any zoom.
  function Thumb(props) {
    var it = props.item, box = props.box, pad = 0.03;
    return h("a", { href: url("images/" + it.id), target: "_blank", rel: "noreferrer", className: "imt-thumb" + (props.small ? " imt-thumb-sm" : ""), title: "Open image " + it.id },
      h("span", { className: "imt-fit", style: { "--imt-ar": it.width && it.height ? it.width / it.height : 1 } },
        h("img", { src: url("image/" + it.id + "/thumbnail"), loading: "lazy", alt: "" }),
        box ? h("span", { className: "imt-spot", style: {
          left: Math.max(0, box.x - pad) * 100 + "%", top: Math.max(0, box.y - pad) * 100 + "%",
          width: Math.min(1, box.w + pad * 2) * 100 + "%", height: Math.min(1, box.h + pad * 2) * 100 + "%" } }) : null));
  }

  // The guide: open on a first visit, closed once the reader has closed it (remembered per browser).
  var HELP_KEY = "imageMatcherHelpSeen";
  function helpSeen() { try { return window.localStorage.getItem(HELP_KEY) === "1"; } catch (err) { return false; } }
  var HELP = [
    ["What it finds", [
      "Images whose pictures look the same, using the perceptual hash Stash already stores. It finds resized and recompressed copies well. It mostly misses crops, rotations and mirror images.",
      "Accuracy sets how close two hashes must be. Exact means identical hashes. High, Medium and Low allow 4, 8 and 10 bits of difference, and each step finds more copies and more false matches.",
      "Images with no perceptual hash are skipped. Create them in Settings, Tasks, Generate, with image perceptual hashes ticked.",
    ]],
    ["The two tabs", [
      "Images lists each group of look-alikes on its own card.",
      "Folder sets lists pairs of folders that share two or more look-alikes, so the same set saved in two places can be handled in one go. A folder set is a guess. Two folders of unrelated pictures can share look-alikes by chance. Use Show all to look at the pairs before acting on a set, and leave folders of loose pictures out under Folder rules.",
    ]],
    ["What the buttons do", [
      "Merge turns the look-alikes into one image in Stash. No file is deleted or moved. The kept copy is the one shown, and the image appears in each folder's gallery.",
      "Delete keeps one copy and deletes the other files from disk for good. Tags, ratings and details move to the kept copy first.",
      "A copy that holds several files (one merged earlier) lists every folder they are in. Delete removes all of them, and the warning names those folders.",
      "Not a match hides the group or set from now on.",
      "Leave out drops one pair or one image from the merge or delete. Put back undoes it.",
      "There is no undo for a merge or a delete. One runs at a time.",
    ]],
    ["Which copy is kept", [
      "The green Keep badge marks the copy that stays, with the reason. The order is: a folder rule, then colour over black and white, then the larger resolution, then the larger file. Choose another with Keep this one, or the other folder on a set card.",
      "Folder rules is an ordered list of folders that always win. The first one listed wins.",
    ]],
    ["The labels", [
      "Same hash: the two pictures hash identically. The files can still differ in size or quality.",
      "N bits off: the hashes differ by that much. The larger the number, the more reason to look.",
      "Differs in one area: the two thumbnails differ strongly in one place, marked with a red box. This is typical of two drawings with one changed detail. These are left out until you put them back. A very small or faint change can go unnoticed.",
      "Looks like a different picture: the thumbnails differ nearly everywhere. Also left out.",
      "Colour / B&W: one copy is in colour and the other is not.",
    ]],
    ["What is left out", [
      "Images inside zip and cbz archives, because a file inside an archive cannot be merged or deleted on its own.",
      "A copy whose file name is too long for Stash to delete (over 248 bytes) is left out of Delete and labelled. Merge it instead.",
    ]],
  ];
  function Help(props) {
    return h("div", { className: "card imt-card imt-help" },
      HELP.map(function (sec) {
        return h("div", { key: sec[0] }, h("h5", null, sec[0]), h("ul", null, sec[1].map(function (line, i) { return h("li", { key: i }, line); })));
      }),
      h("div", { className: "imt-actions" }, h("button", { className: "btn btn-secondary btn-sm", onClick: props.onClose }, "Close")));
  }

  function Pager(props) {
    var pages = Math.ceil(props.total / props.per);
    if (pages <= 1) return null;
    var from = props.page * props.per + 1, to = Math.min(props.total, (props.page + 1) * props.per);
    return h("div", { className: "imt-pager" },
      h("button", { className: "btn btn-secondary btn-sm", disabled: props.page === 0, onClick: function () { props.onPage(props.page - 1); } }, "Previous"),
      h("span", null, from + "–" + to + " of " + props.total),
      h("button", { className: "btn btn-secondary btn-sm", disabled: props.page >= pages - 1, onClick: function () { props.onPage(props.page + 1); } }, "Next"));
  }

  function Actions(props) {
    // shared footer: the three ways a card can end, plus the delete confirmation
    var s = React.useState(false), confirm = s[0], setConfirm = s[1];
    if (props.busy) return h("div", { className: "imt-busy" }, h("span", { className: "imt-spinner" }), props.busy + "…");
    return h("div", null,
      props.error ? h("div", { className: "imt-error" }, props.error) : null,
      confirm
        ? h("div", { className: "imt-confirm" },
            h("p", null, props.deleteWarning),
            h("button", { className: "btn btn-danger btn-sm", onClick: function () { setConfirm(false); props.onDelete(); } }, props.deleteConfirmLabel),
            h("button", { className: "btn btn-secondary btn-sm", onClick: function () { setConfirm(false); } }, "Cancel"))
        : h("div", { className: "imt-actions" },
            h("button", { className: "btn btn-primary btn-sm", disabled: !!props.disabled, onClick: props.onMerge, title: "One image in Stash. Every file stays where it is; the kept copy is the one shown." }, props.mergeLabel),
            h("button", { className: "btn btn-outline-danger btn-sm", disabled: !!props.disabled || !!props.deleteDisabled, title: props.deleteTitle, onClick: function () { setConfirm(true); } }, props.deleteLabel),
            props.onDismiss ? h("button", { className: "btn btn-link btn-sm", onClick: props.onDismiss }, props.dismissLabel) : null,
            props.extra || null));
  }

  function GroupCard(props) {
    var items = props.items, members = props.group.map(function (i) { return items[i]; });
    React.useEffect(function () { props.needColors(props.group); }, [props.group]);
    var suggestion = React.useMemo(function () { return core.chooseKeeper(members, props.rules); }, [props.group, props.rules, props.colorTick]);
    // until a copy is picked by hand, the card follows the suggestion (which can change once colour is known)
    var k = React.useState(null), pickedId = k[0], setKeeperId = k[1];
    var keeperId = pickedId || suggestion.keeper.id;
    var mixedColor = members.some(function (m) { return m.color === true; }) && members.some(function (m) { return m.color === false; });
    // the page runs one operation at a time and holds its progress, so a card that is redrawn
    // mid-run still shows it, and every other card is locked meanwhile
    var planKey = core.groupKey(members.map(function (m) { return m.id; }));
    var busy = props.op && props.op.key === "group:" + planKey ? props.op.text : null, locked = !!props.op && !busy;
    var e = React.useState(null), error = e[0], setError = e[1];
    var keeper = members.filter(function (m) { return m.id === keeperId; })[0] || suggestion.keeper;
    // image ids left out of the action: true/false once chosen by hand; until then, an image that
    // differs from the kept copy in one area is left out
    var x = React.useState({}), picked = x[0], setOut = x[1];
    var diffs = {}, out = {};
    members.forEach(function (m) {
      if (m === keeper) return;
      diffs[m.id] = diffOf(keeper, m);
      out[m.id] = picked[m.id] !== undefined ? picked[m.id] : !!(diffs[m.id] && diffs[m.id].flag);
    });
    var waiting = checking(members);
    var losers = members.filter(function (m) { return m !== keeper && !out[m.id]; });
    var deletable = losers.filter(function (m) { return !m.longName; });
    function toggleOut(id) { var next = Object.assign({}, picked); next[id] = !out[id]; setOut(next); }
    // choosing another copy to keep changes nothing else: every copy keeps its current in or out,
    // and the copy that was kept joins the action. Without this, the old kept copy is compared
    // against the new one, and a one-area difference leaves it out again.
    function pickKeeper(id) {
      var next = {};
      members.forEach(function (o) { if (o.id !== id) next[o.id] = o === keeper ? false : !!out[o.id]; });
      setOut(next);
      setKeeperId(id);
    }

    // tell the page what this card would do, for the "all on this page" buttons
    React.useEffect(function () {
      props.registerPlan(planKey, busy ? null : { waiting: waiting > 0, keeperId: keeper.id,
        loserIds: losers.map(function (m) { return m.id; }), deletable: deletable.map(function (m) { return m.id; }),
        files: deletable.reduce(function (t, m) { return t + m.files.length; }, 0) });
    });
    React.useEffect(function () { return function () { props.registerPlan(planKey, undefined); }; }, [planKey]);

    function run(mode) {
      var plans = [{ keeperId: keeper.id, loserIds: losers.map(function (m) { return m.id; }) }];
      setError(null);
      props.runOp("group:" + planKey, function (step) { return mode === "merge" ? ops.mergeImages(plans, step) : ops.dedupeImages(plans, step); }).then(function (res) {
        props.onDone(res.plans || plans, mode, mode === "merge"
          ? "Merged " + plural(res.merged, "file") + " into image " + keeper.id + "."
          : deletedText(res, "; kept image " + keeper.id + ".") + leftAlone(res));
      }).catch(function (err) { setError(String(err.message || err)); });
    }

    return h("div", { className: "card imt-card" },
      h("div", { className: "imt-tiles" }, members.map(function (m) {
        var isKeeper = m === keeper, dist = m.phash && keeper.phash ? core.hashDistance(m.phash, keeper.phash) : null;
        return h("div", { key: m.id, className: "imt-tile" + (isKeeper ? " imt-keep" : "") + (!isKeeper && out[m.id] ? " imt-out" : "") },
          h(Thumb, { item: m, box: !isKeeper && diffs[m.id] && diffs[m.id].flag ? diffs[m.id].box : null }),
          !isKeeper && diffs[m.id] && diffs[m.id].flag ? h("div", { className: "imt-diff" }, diffs[m.id].different ? DIFFERENT_TEXT + " than the kept copy" : SPOT_TEXT + " from the kept copy") : null,
          !isKeeper && m.longName ? h("div", { className: "imt-long" }, LONG_TEXT) : null,
          h("div", { className: "imt-facts" },
            h("div", null, m.width + "×" + m.height + " · " + fmtSize(m.size) + (mixedColor ? (m.color === false ? " · black and white" : m.color === true ? " · colour" : "") : "")),
            m.files.length > 1
              ? h("div", { className: "imt-path imt-folders" }, h("div", null, plural(m.files.length, "file") + " in:"),
                  folderList(m).map(function (t) { return h("div", { key: t }, t); }))
              : h("div", { className: "imt-path", title: m.folder }, m.folder),
            isKeeper ? null : h("div", { className: "imt-muted" }, dist === 0 ? "same hash" : plural(dist, "bit") + " off")),
          isKeeper
            ? h("span", { className: "imt-badge" }, "Keep" + (m === suggestion.keeper ? " · " + suggestion.reason : ""))
            : h("div", { className: "imt-tile-btns" },
                h("button", { className: "btn btn-secondary btn-sm", disabled: !!busy, onClick: function () { pickKeeper(m.id); } }, "Keep this one"),
                h("button", { className: "btn btn-link btn-sm", disabled: !!busy, onClick: function () { toggleOut(m.id); } }, out[m.id] ? "Put back" : "Leave out")));
      })),
      h(Actions, {
        busy: busy, error: error, disabled: losers.length === 0 || waiting > 0 || locked,
        mergeLabel: waiting ? "Comparing pictures…" : "Merge into one", onMerge: function () { run("merge"); },
        deleteDisabled: deletable.length === 0,
        deleteTitle: deletable.length === 0 && losers.length ? LONG_TEXT : undefined,
        deleteLabel: losers.length === 0 ? "Delete the other copies…" : deletable.length === 0 ? "Can't delete: name too long" : "Delete the other " + (deletable.length === 1 ? "copy" : deletable.length + " copies") + "…",
        deleteWarning: "This deletes " + plural(deletable.length, "image") + " and " +
          plural(deletable.reduce(function (t, m) { return t + m.files.length; }, 0), "file") + " from disk for good. " + severalFiles(deletable) + "Tags, ratings and details move to the kept copy first. " +
          (deletable.length < losers.length ? plural(losers.length - deletable.length, "copy", "copies") + " with a name too long for Stash to delete " + (losers.length - deletable.length === 1 ? "stays" : "stay") + "; merge to deal with " + (losers.length - deletable.length === 1 ? "it" : "them") + ". " : "") +
          "There is no undo.",
        deleteConfirmLabel: "Delete " + plural(deletable.length, "copy", "copies"), onDelete: function () { run("dedupe"); },
        dismissLabel: "Not a match", onDismiss: function () { props.onDismiss(core.groupKey(members.map(function (m) { return m.id; }))); },
      }));
  }

  function SetCard(props) {
    var set = props.set, items = props.items;
    React.useEffect(function () {
      var all = [];
      set.matches.forEach(function (m) { all = all.concat(m.a, m.b); });
      props.needColors(all);
    }, [set]);
    // until a side is picked by hand, the card follows the suggestion (which can change once colour is known)
    var k = React.useState(null), pickedKeep = k[0], setKeep = k[1];
    var keep = pickedKeep || set.keep;
    var r = React.useState(false), remember = r[0], setRemember = r[1];
    var busy = props.op && props.op.key === set.key ? props.op.text : null, locked = !!props.op && !busy;
    var e = React.useState(null), error = e[0], setError = e[1];
    var keepFolder = keep === "A" ? set.folderA : set.folderB, otherFolder = keep === "A" ? set.folderB : set.folderA;
    var otherTotal = keep === "A" ? set.countB : set.countA;
    // pair keys left out of the action: true/false once chosen by hand; until then, a pair whose
    // pictures differ in one area is left out
    var x = React.useState({}), picked = x[0], setOut = x[1];
    function toggleOut(key) { var next = Object.assign({}, picked); next[key] = !out[key]; setOut(next); }

    function run(mode) {
      var plans = core.setPlans(set, items, keep, out);
      setError(null);
      if (remember) props.onRemember(keepFolder, otherFolder);
      props.runOp(set.key, function (step) { return mode === "merge" ? ops.mergeSet(plans, keepFolder, otherFolder, step) : ops.dedupeSet(plans, keepFolder, otherFolder, step); }).then(function (res) {
        props.onDone(res.plans || plans, mode, mode === "merge"
          ? "Merged " + plural(res.merged, "file") + " from " + otherFolder + " into " + plural(res.images, "image") + " kept in " + keepFolder + "."
          : deletedText(res, " from " + otherFolder + "; kept " + keepFolder + ".") + leftAlone(res));
      }).catch(function (err) { setError(String(err.message || err)); });
    }

    function side(which) {
      var folder = which === "A" ? set.folderA : set.folderB, matched = which === "A" ? set.matchedA : set.matchedB, total = which === "A" ? set.countA : set.countB;
      var only = Math.max(0, total - matched), id = "imt-" + set.key + which;
      return h("label", { className: "imt-side" + (keep === which ? " imt-keep" : ""), htmlFor: id },
        h("input", { type: "radio", id: id, checked: keep === which, disabled: !!busy, onChange: function () { setKeep(which); } }),
        h("div", null,
          h("div", { className: "imt-path", title: folder }, folder),
          h("div", { className: "imt-muted" }, matched + " of " + plural(total, "image") + " matched" + (only ? " · " + only + " only here" : "")),
          keep === which ? h("span", { className: "imt-badge" }, "Keep" + (set.keep === which ? " · " + set.reason : "")) : null,
          h("button", { className: "btn btn-link btn-sm imt-skip", disabled: !!busy, title: "Stop comparing this folder as a set. Its subfolders are still compared, and its images still show on the Images tab. Undo under Folder rules.",
            onClick: function (ev) { ev.preventDefault(); ev.stopPropagation(); props.onSkipFolder(folder); } }, "Leave this folder out of sets")));
    }

    // every pair with how far apart its hashes are, furthest first, so the ones worth a look lead.
    // A copy: set.matches itself is read by setPlans and must keep its order.
    var sa = React.useState(false), showAll = sa[0], setShowAll = sa[1];
    var pairs = React.useMemo(function () {
      return set.matches.map(function (m, i) {
        var cols = m.a.concat(m.b).map(function (x) { return items[x].color; });
        // the clearest local difference between any picture on one side and any on the other
        var diff = null;
        m.a.forEach(function (ia) { m.b.forEach(function (ib) {
          var d = diffOf(items[ia], items[ib]);
          if (d && (!diff || (d.flag && !diff.flag) || (d.flag === diff.flag && d.peak > diff.peak))) diff = d;
        }); });
        return { m: m, i: i, key: core.pairKey(items, m), dist: core.matchDistance(items, m), diff: diff,
          mixed: cols.indexOf(true) >= 0 && cols.indexOf(false) >= 0 };
      })
        .sort(function (p, q) { return (q.diff && q.diff.flag ? 1 : 0) - (p.diff && p.diff.flag ? 1 : 0) || (q.dist || 0) - (p.dist || 0) || p.i - q.i; });
    }, [set, items, props.colorTick]);
    var out = {}, spots = 0, others = 0;
    pairs.forEach(function (p) {
      var spot = !!(p.diff && p.diff.flag);
      if (spot) spots++;
      if (spot && p.diff.different) others++;
      out[p.key] = picked[p.key] !== undefined ? picked[p.key] : spot;
    });
    var waiting = 0;
    set.matches.forEach(function (m) { waiting += checking(m.a.concat(m.b).map(function (x) { return items[x]; })); });
    var included = pairs.filter(function (p) { return !out[p.key]; }), leftOut = pairs.length - included.length;
    var otherImgs = [], longOnes = 0;
    included.forEach(function (p) { (keep === "A" ? p.m.b : p.m.a).forEach(function (i) { if (items[i].longName) longOnes++; else otherImgs.push(items[i]); }); });
    var otherMatched = otherImgs.length, otherFiles = otherImgs.reduce(function (t, m) { return t + m.files.length; }, 0);
    var strays = Math.max(0, otherTotal - otherMatched - longOnes);
    var mix = core.distanceMix(included.map(function (p) { return p.dist; }));
    var PREVIEW = 8, visible = showAll ? pairs : pairs.slice(0, PREVIEW);
    var mixText = included.length === 0 ? "Every pair is left out" : (mix.near === 0 && mix.unknown === 0
      ? (included.length === 1 ? "The pair has" : included.length === 2 ? "Both pairs have" : "All " + included.length + " pairs have") + " the same hash"
      : [mix.same ? mix.same + " same hash" : null,
         mix.near ? mix.near + " within " + plural(mix.max, "bit") : null,
         mix.unknown ? mix.unknown + " not measured" : null].filter(Boolean).join(" · ")) +
      (leftOut && included.length ? " · " + leftOut + " left out" : "") +
      (spots - others ? " · " + (spots - others) + " " + (spots - others === 1 ? "differs" : "differ") + " in one area" : "") +
      (others ? " · " + others + " " + (others === 1 ? "looks like a different picture" : "look like different pictures") : "") +
      (waiting ? " · comparing pictures…" : "");
    return h("div", { className: "card imt-card" },
      h("div", { className: "imt-sides" }, side("A"), side("B")),
      // a pair of folders that mostly do not match is probably not one set saved twice
      Math.max(set.countA ? set.matchedA / set.countA : 0, set.countB ? set.matchedB / set.countB : 0) < 0.5
        ? h("div", { className: "imt-caution" }, "Most of each folder has no match in the other, so these may be unrelated folders that share a few look-alikes. " +
            "Look at the pairs before merging or deleting, or leave a folder of loose pictures out of sets.")
        : null,
      h("div", { className: "imt-pairs" }, visible.map(function (p) {
        // every image of the match is drawn: the kept folder's on top, the other folder's below,
        // each of those with its own marker against the first kept one
        var m = p.m, tops = keep === "A" ? m.a : m.b, bottoms = keep === "A" ? m.b : m.a;
        var boxes = bottoms.map(function (i) { var d = diffOf(items[tops[0]], items[i]); return d && d.flag ? d.box : null; });
        var box = boxes.filter(Boolean)[0] || null;
        return h("div", { key: p.key, className: "imt-pair" + (out[p.key] ? " imt-out" : ""),
            "data-ids": items[m.a[0]].id + "," + items[m.b[0]].id, "data-peak": p.diff ? p.diff.peak.toFixed(1) : "", "data-base": p.diff ? p.diff.base.toFixed(1) : "", "data-hot": p.diff ? p.diff.hot : "" },
          h("div", { className: "imt-pair-row" }, tops.map(function (i, n) { return h(Thumb, { key: i, item: items[i], small: true, box: n === 0 ? box : null }); })),
          h("div", { className: "imt-pair-row" }, bottoms.map(function (i, n) { return h(Thumb, { key: i, item: items[i], small: true, box: boxes[n] }); })),
          p.diff && p.diff.flag ? h("div", { className: "imt-pair-dist imt-diff" }, diffText(p.diff)) : null,
          tops.length + bottoms.length > 2 ? h("div", { className: "imt-pair-dist" }, tops.length + bottoms.length + " images") : null,
          h("div", { className: "imt-pair-dist" + (p.dist ? " imt-pair-off" : "") }, p.dist === null ? "not measured" : p.dist === 0 ? "same hash" : plural(p.dist, "bit") + " off"),
          p.mixed ? h("div", { className: "imt-pair-dist imt-pair-off" }, "colour / B&W") : null,
          bottoms.some(function (i) { return items[i].longName; }) ? h("div", { className: "imt-pair-dist imt-pair-off", title: LONG_TEXT }, "name too long to delete") : null,
          bottoms.filter(function (i) { return items[i].files.length > 1; }).map(function (i) {
            return h("div", { key: "f" + i, className: "imt-pair-dist imt-pair-off imt-pair-files", title: folderList(items[i]).join("\n") }, plural(items[i].files.length, "file") + " in " + plural(folderList(items[i]).length, "folder"));
          }),
          h("button", { className: "btn btn-link btn-sm imt-pair-out", disabled: !!busy, title: "Leave this pair out of the merge or delete",
            onClick: function () { toggleOut(p.key); } }, out[p.key] ? "Put back" : "Leave out"));
      }), pairs.length > PREVIEW
        ? h("button", { className: "btn btn-link btn-sm imt-more", onClick: function () { setShowAll(!showAll); } },
            showAll ? "Show fewer" : "Show all " + pairs.length + " pairs")
        : null),
      h("div", { className: "imt-mix", title: "The hash describes how a picture looks. Two files with the same hash look alike; the files themselves can still differ in size or quality." }, mixText),
      h(Actions, {
        busy: busy, error: error, disabled: included.length === 0 || waiting > 0 || locked,
        mergeLabel: "Merge set (" + included.length + ")", onMerge: function () { run("merge"); },
        deleteLabel: "Delete duplicates from the other folder…",
        deleteWarning: "This deletes " + plural(otherMatched, "image") + (otherFiles > otherMatched ? " (" + plural(otherFiles, "file") + ")" : "") + " from " + otherFolder + " for good, so they leave that folder's gallery. " +
          severalFiles(otherImgs, otherFolder) + "Tags, ratings and gallery details move to " + keepFolder + " first. " +
          (strays ? plural(strays, "other image") + " in " + otherFolder + " " + (strays === 1 ? "stays" : "stay") + ". " : "") +
          (longOnes ? plural(longOnes, "file") + " with a name too long for Stash to delete " + (longOnes === 1 ? "stays" : "stay") + "; merge to deal with " + (longOnes === 1 ? "it" : "them") + ". " : "") + "There is no undo.",
        deleteDisabled: otherMatched === 0,
        deleteConfirmLabel: "Delete " + plural(otherFiles, "file"), onDelete: function () { run("dedupe"); },
        dismissLabel: "Not the same set", onDismiss: function () { props.onDismiss(set.key); },
        extra: h("label", { className: "imt-remember" },
          h("input", { type: "checkbox", checked: remember, onChange: function (ev) { setRemember(ev.target.checked); } }),
          " Always prefer this folder"),
      }));
  }

  function RulesPanel(props) {
    var t = React.useState(props.rules.join("\n")), text = t[0], setText = t[1];
    var sk = React.useState(props.skip.join("\n")), skipText = sk[0], setSkipText = sk[1];
    return h("div", { className: "card imt-card imt-rules" },
      h("h5", null, "Folders that win"),
      h("p", { className: "imt-muted" }, "One folder per line. The first folder listed wins, and a folder covers its subfolders. " +
        "When no rule applies, the larger resolution wins, then the larger file."),
      h("textarea", { className: "form-control text-input", rows: 6, value: text, spellCheck: false, onChange: function (ev) { setText(ev.target.value); } }),
      h("h5", null, "Folders left out of folder sets"),
      h("p", { className: "imt-muted" }, "One folder per line. A folder listed here is never compared as a set, which suits a folder of loose, unrelated images such as a year folder. " +
        "Its subfolders are still compared; end the line with /* to leave those out too. Its images still show on the Images tab."),
      h("textarea", { className: "form-control text-input imt-skip-list", rows: 4, value: skipText, spellCheck: false, onChange: function (ev) { setSkipText(ev.target.value); } }),
      props.found && props.found.length ? h("div", null,
        h("p", { className: "imt-muted" }, "Or tick them here. These are the folders in the sets found, the ones in the most sets first."),
        h("div", { className: "imt-found" }, props.found.map(function (f) {
          var lines = core.normalizeSkips(skipText.split("\n")), on = lines.indexOf(f.folder) >= 0;
          return h("label", { key: f.folder, className: "imt-found-row" },
            h("input", { type: "checkbox", checked: on, onChange: function () {
              setSkipText((on ? lines.filter(function (l) { return l !== f.folder; }) : lines.concat([f.folder])).join("\n"));
            } }),
            h("span", { className: "imt-path" }, f.folder),
            h("span", { className: "imt-muted" }, "in " + plural(f.sets, "set")));
        }))) : null,
      h("div", { className: "imt-actions" },
        h("button", { className: "btn btn-primary btn-sm", onClick: function () { props.onSave(text.split("\n"), skipText.split("\n")); } }, "Save"),
        h("button", { className: "btn btn-secondary btn-sm", onClick: props.onClose }, "Close")));
  }

  function Page() {
    var c = React.useState(null), cfg = c[0], setCfg = c[1];
    var p = React.useState({ status: "idle" }), phase = p[0], setPhase = p[1];
    var d = React.useState(null), data = d[0], setData = d[1];
    var t = React.useState("sets"), tab = t[0], setTab = t[1];
    var pg = React.useState(0), page = pg[0], setPage = pg[1];
    var sr = React.useState(false), showRules = sr[0], setShowRules = sr[1];
    var m = React.useState(null), message = m[0], setMessage = m[1];
    var z = React.useState(readZoom), zoom = z[0], setZoom = z[1];
    var hp = React.useState(function () { return !helpSeen(); }), showHelp = hp[0], setShowHelp = hp[1];
    function toggleHelp() {
      if (showHelp) { try { window.localStorage.setItem(HELP_KEY, "1"); } catch (err) { /* stays open next visit */ } }
      setShowHelp(!showHelp);
    }
    var ct = React.useState(0), colorTick = ct[0], setColorTick = ct[1];
    var tickTimer = React.useRef(null), itemsRef = React.useRef(null);
    itemsRef.current = data ? data.items : null;
    // cards ask for the colour check of the images they show; answers land on the items and the
    // suggestions are worked out again (batched, so a card of many pairs redraws a few times, not hundreds)
    function needColors(indices) {
      var items = itemsRef.current;
      if (!items) return;
      indices.forEach(function (i) {
        var it = items[i];
        if (!it || it.lum !== undefined) return;
        it.lum = 0; // 0: being read; null: could not be read
        colorOf(it.id).then(function (v) {
          it.color = v ? v.color : null; it.lum = v ? v.lum : null;
          if (tickTimer.current) return;
          tickTimer.current = setTimeout(function () { tickTimer.current = null; setColorTick(function (n) { return n + 1; }); }, 150);
        });
      });
    }

    React.useEffect(function () {
      ops.loadConfig().then(setCfg).catch(function (err) { setPhase({ status: "error", text: String(err.message || err) }); });
    }, []);

    function saveCfg(next) {
      setCfg(next);
      ops.saveConfig(next).catch(function (err) { setMessage("Could not save settings: " + (err.message || err)); });
    }

    function find() {
      setMessage(null); setPage(0);
      setPhase({ status: "loading", text: "Reading the image list" });
      ops.loadImages(function (done, total) { setPhase({ status: "loading", text: "Reading the image list: " + done + " of " + total }); }).then(function (items) {
        setPhase({ status: "loading", text: "Comparing " + items.length + " images" });
        setTimeout(function () {
          var res = core.findGroups(items, cfg.distance);
          setData({ items: items, groups: res.groups, skipped: res.skipped, archived: items.archived || 0 });
          setPhase({ status: "ready" });
        }, 30);
      }).catch(function (err) { setPhase({ status: "error", text: String(err.message || err) }); });
    }

    var view = React.useMemo(function () {
      if (!data || !cfg) return null;
      var dismissed = {};
      cfg.dismissed.forEach(function (key) { dismissed[key] = true; });
      var groups = data.groups.filter(function (g) { return !dismissed[core.groupKey(g.map(function (i) { return data.items[i].id; }))]; });
      var sets = core.buildSets(data.items, groups, cfg.folderRules, 2, cfg.setSkip).filter(function (s) { return !dismissed[s.key]; });
      // every folder that is in a set when nothing is left out, for the tick list under Folder rules
      var counts = {};
      core.buildSets(data.items, groups, cfg.folderRules, 2).forEach(function (s) {
        if (dismissed[s.key]) return;
        counts[s.folderA] = (counts[s.folderA] || 0) + 1; counts[s.folderB] = (counts[s.folderB] || 0) + 1;
      });
      var found = Object.keys(counts).map(function (f) { return { folder: f, sets: counts[f] }; })
        .sort(function (p, q) { return q.sets - p.sets || (p.folder < q.folder ? -1 : 1); });
      return { groups: groups, sets: sets, found: found };
    }, [data, cfg, colorTick]);

    // Works from the list as it is when the operation ends, not as it was when it began.
    function onDone(plans, mode, text) {
      setData(function (d) {
        if (!d) return d;
        var gone = {}, byId = {};
        d.items.forEach(function (it) { byId[it.id] = it; });
        plans.forEach(function (pl) {
          var keeper = byId[pl.keeperId];
          pl.loserIds.forEach(function (id) {
            gone[id] = true;
            // after a merge the kept image holds the other image's files too
            if (mode === "merge" && keeper && byId[id]) {
              keeper.files = keeper.files.concat(byId[id].files);
              (byId[id].folders || []).forEach(function (f) { if (keeper.folders.indexOf(f) < 0) keeper.folders.push(f); });
            }
          });
        });
        var groups = d.groups.map(function (g) { return g.filter(function (i) { return !gone[d.items[i].id]; }); }).filter(function (g) { return g.length > 1; });
        return { items: d.items, groups: groups, skipped: d.skipped, archived: d.archived };
      });
      setMessage(text);
    }
    // one merge or delete at a time, page-wide
    var o = React.useState(null), op = o[0], setOp = o[1], opRef = React.useRef(null);
    function runOp(key, start) {
      if (opRef.current) return Promise.reject(new Error("Another merge or delete is still running. Wait for it to finish."));
      opRef.current = key; setOp({ key: key, text: "Starting" }); setMessage(null);
      var done = function () { opRef.current = null; setOp(null); };
      var p;
      try { p = Promise.resolve(start(function (t) { if (opRef.current === key) setOp({ key: key, text: t }); })); } catch (err) { p = Promise.reject(err); }
      return p.then(function (r) { done(); return r; }, function (err) { done(); throw err; });
    }
    function onDismiss(key) { saveCfg(Object.assign({}, cfg, { dismissed: cfg.dismissed.concat([key]) })); }
    function onRemember(keepFolder, otherFolder) {
      saveCfg(Object.assign({}, cfg, { folderRules: core.rememberRule(cfg.folderRules, keepFolder, otherFolder) }));
    }
    function switchTab(next) { setTab(next); setPage(0); }
    function onSkipFolder(folder) {
      saveCfg(Object.assign({}, cfg, { setSkip: core.normalizeSkips(cfg.setSkip.concat([folder])) }));
      setMessage(folder + " is left out of folder sets from now on. Undo under Folder rules.");
    }

    // every group card on screen reports its plan here; the bar under the list acts on all of them
    var pagePlans = React.useRef({});
    var pt = React.useState(0), setPlanTick = pt[1];
    var bulkBusy = op && op.key === "bulk" ? op.text : null;
    var be = React.useState(null), bulkError = be[0], setBulkError = be[1];
    function registerPlan(key, plan) {
      var was = JSON.stringify(pagePlans.current[key]), now = JSON.stringify(plan);
      if (was === now) return;
      if (plan === undefined) delete pagePlans.current[key]; else pagePlans.current[key] = plan;
      setPlanTick(function (n) { return n + 1; });
    }
    function runAll(mode, plans) {
      setBulkError(null);
      runOp("bulk", function (step) { return mode === "merge" ? ops.mergeImages(plans, step) : ops.dedupeImages(plans, step); }).then(function (res) {
        var did = res.plans || plans;
        onDone(did, mode, mode === "merge"
          ? "Merged " + plural(res.merged, "file") + " into " + plural(did.length, "image") + " on this page."
          : deletedText(res, " on this page; kept " + plural(did.length, "image") + ".") + leftAlone(res));
        goPage(page);
      }).catch(function (err) { setBulkError(String(err.message || err)); });
    }
    // a new page of cards starts at the top, whichever element Stash scrolls
    function goPage(n) {
      setPage(n);
      try {
        window.scrollTo(0, 0);
        for (var el = document.querySelector(".imt-page"); el; el = el.parentElement) el.scrollTop = 0;
      } catch (err) { /* scrolling is a convenience */ }
    }

    if (!cfg) return h("div", { className: "imt-page" }, phase.status === "error" ? h("div", { className: "imt-error" }, phase.text) : "Loading…");

    var list = view ? (tab === "sets" ? view.sets : view.groups) : [];
    var per = tab === "sets" ? SETS_PER_PAGE : GROUPS_PER_PAGE;
    var safePage = Math.min(page, Math.max(0, Math.ceil(list.length / per) - 1));
    var shown = list.slice(safePage * per, (safePage + 1) * per);

    return h("div", { className: "imt-page", style: { "--imt-zoom": zoom } },
      h("h3", null, "Image Matcher"),
      h("p", { className: "imt-muted" }, "Finds images that look the same. Merge keeps every file and shows them as one image; delete removes the lesser copies from disk. Neither can be undone. ",
        h("button", { className: "btn btn-link btn-sm imt-help-link", onClick: toggleHelp }, showHelp ? "Hide the guide" : "How this works")),
      showHelp ? h(Help, { onClose: toggleHelp }) : null,
      h("div", { className: "imt-toolbar" },
        h("label", null, "Accuracy ",
          h("select", { className: "form-control input-control", value: cfg.distance, disabled: phase.status === "loading",
            onChange: function (ev) { saveCfg(Object.assign({}, cfg, { distance: Number(ev.target.value) })); } },
            LEVELS.map(function (l) { return h("option", { key: l[0], value: l[0] }, l[1]); }))),
        h("button", { className: "btn btn-primary", disabled: phase.status === "loading" || !!op, onClick: find }, data ? "Find matches again" : "Find matches"),
        h("button", { className: "btn btn-secondary", onClick: function () { setShowRules(!showRules); } },
          "Folder rules" + (cfg.folderRules.length + cfg.setSkip.length ? " (" + (cfg.folderRules.length + cfg.setSkip.length) + ")" : "")),
        h("label", { className: "imt-zoom" }, "Zoom",
          h("input", { type: "range", min: ZOOM_MIN, max: ZOOM_MAX, step: 0.25, value: zoom, title: "Thumbnail size",
            onChange: function (ev) { var v = Number(ev.target.value); setZoom(v); writeZoom(v); } }))),
      showRules ? h(RulesPanel, { key: cfg.setSkip.join("\n"), rules: cfg.folderRules, skip: cfg.setSkip, found: view ? view.found : null, onClose: function () { setShowRules(false); },
        onSave: function (rules, skip) { saveCfg(Object.assign({}, cfg, { folderRules: core.normalizeRules(rules), setSkip: core.normalizeSkips(skip) })); setShowRules(false); } }) : null,
      phase.status === "loading" ? h("div", { className: "imt-busy" }, h("span", { className: "imt-spinner" }), phase.text + "…") : null,
      phase.status === "error" ? h("div", { className: "imt-error" }, phase.text) : null,
      // results show in a bar fixed to the bottom of the screen, so they are seen wherever the button was
      message ? h("div", { className: "imt-toast", role: "status" },
        h("div", { className: "imt-message" }, message),
        h("button", { className: "btn btn-link btn-sm imt-toast-close", "aria-label": "Close", onClick: function () { setMessage(null); } }, "×")) : null,
      view ? h("div", null,
        h("p", { className: "imt-summary" },
          plural(data.items.length, "image") + " checked" +
          (data.archived ? " · " + data.archived + " inside archives (cbz, zip) left out" : "") +
          (data.skipped ? " · " + data.skipped + " skipped (no perceptual hash yet; run Generate with image perceptual hashes on)" : "")),
        h("div", { className: "imt-tabs" },
          h("button", { className: "btn btn-sm " + (tab === "sets" ? "btn-primary" : "btn-secondary"), onClick: function () { switchTab("sets"); } }, "Folder sets (" + view.sets.length + ")"),
          h("button", { className: "btn btn-sm " + (tab === "images" ? "btn-primary" : "btn-secondary"), onClick: function () { switchTab("images"); } }, "Images (" + view.groups.length + ")")),
        list.length === 0 ? h("p", { className: "imt-muted" }, tab === "sets" ? "No two folders share more than one look-alike image." : "No look-alike images left at this accuracy.") : null,
        shown.map(function (entry) {
          return tab === "sets"
            ? h(SetCard, { key: entry.key, op: op, runOp: runOp, onSkipFolder: onSkipFolder, needColors: needColors, colorTick: colorTick, set: entry, items: data.items, onDone: onDone, onDismiss: onDismiss, onRemember: onRemember })
            : h(GroupCard, { key: core.groupKey(entry.map(function (i) { return data.items[i].id; })) + "|" + cfg.folderRules.join("\n"), op: op, runOp: runOp, registerPlan: registerPlan, needColors: needColors, colorTick: colorTick, group: entry, items: data.items, rules: cfg.folderRules, onDone: onDone, onDismiss: onDismiss });
        }),
        tab === "images" && shown.length > 1 ? (function () {
          // only the groups listed right now: a card that has just left the page may not have signed off yet
          var all = shown.map(function (g) { return pagePlans.current[core.groupKey(g.map(function (i) { return data.items[i].id; }))]; }).filter(Boolean);
          if (all.length < shown.length) all.push({ waiting: true, loserIds: [], deletable: [], files: 0 });
          var waiting = all.some(function (pl) { return pl.waiting; });
          var plans = all.filter(function (pl) { return pl.loserIds.length > 0; }).map(function (pl) { return { keeperId: pl.keeperId, loserIds: pl.loserIds }; });
          var images = plans.reduce(function (t, pl) { return t + pl.loserIds.length; }, 0);
          var delImages = [];
          all.forEach(function (pl) { pl.deletable.forEach(function (id) { delImages.push(data.items.filter(function (it) { return it.id === id; })[0]); }); });
          delImages = delImages.filter(Boolean);
          var files = delImages.reduce(function (t, m) { return t + m.files.length; }, 0), stuck = images - delImages.length;
          return h("div", { className: "card imt-card imt-bulk" },
            h("div", { className: "imt-mix" }, waiting ? "Comparing pictures…"
              : "Everything on this page, as the cards above are set: " + plural(plans.length, "group") + ", " + plural(images, "copy", "copies") + ". Images left out stay as they are."),
            h(Actions, {
              busy: bulkBusy, error: bulkError, disabled: waiting || plans.length === 0 || (!!op && !bulkBusy),
              mergeLabel: "Merge all " + plans.length + " on this page", onMerge: function () { runAll("merge", plans); },
              deleteLabel: "Delete the other copies in all " + plans.length + "…",
              deleteDisabled: delImages.length === 0,
              deleteWarning: "This deletes " + plural(delImages.length, "image") + " and " + plural(files, "file") + " from disk for good, across " + plural(plans.length, "group") +
                " on this page. " + severalFiles(delImages) + "Tags, ratings and details move to the kept copies first. " +
                (stuck ? plural(stuck, "copy", "copies") + " with a name too long for Stash to delete " + (stuck === 1 ? "stays" : "stay") + "; merge to deal with " + (stuck === 1 ? "it" : "them") + ". " : "") + "There is no undo.",
              deleteConfirmLabel: "Delete " + plural(delImages.length, "copy", "copies"), onDelete: function () { runAll("dedupe", plans); },
            }));
        })() : null,
        h(Pager, { page: safePage, per: per, total: list.length, onPage: goPage })) : null);
  }

  PluginApi.register.route(ROUTE, Page);

  // a button in the top bar; wrapped so a change in Stash's nav can never break the bar itself
  try {
    PluginApi.patch.before("MainNavBar.UtilityItems", function (props) {
      try {
        var NavLink = PluginApi.libraries.ReactRouterDOM.NavLink, Button = PluginApi.libraries.Bootstrap.Button;
        var Icon = PluginApi.components.Icon, faClone = PluginApi.libraries.FontAwesomeSolid.faClone;
        return [{ children: h(React.Fragment, null, props.children,
          h(NavLink, { className: "nav-utility", exact: true, to: ROUTE },
            h(Button, { className: "minimal d-flex align-items-center h-100", title: "Image Matcher" }, h(Icon, { icon: faClone })))) }];
      } catch (err) { return [props]; }
    });
  } catch (err) { /* older Stash without this patch point: the page is still at /image-matcher */ }
})();
