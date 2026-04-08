/**
 * SmartResolve — Scene Duplicate Checker helper.
 * Smart Select: rule-based checks on Stash’s native row checkboxes.
 * Sync Data: mergeless sceneUpdate merge from sibling duplicates.
 */
(function () {
  "use strict";

  var ROUTE = "/sceneDuplicateChecker";
  var ROOT_ID = "scene-duplicate-checker";
  var PLUGIN_ID = "SmartResolve";

  function defaultRuleToggles() {
    return {
      step_01_total_pixels: true,
      step_02_framerate: true,
      step_03_codec: true,
      step_upgrade_token: true,
      step_04_duration: true,
      step_05_smaller_size: true,
      step_06_older_date: true,
      step_07_more_groups: true,
      step_08_has_stashid: true,
      step_09_more_performers: true,
      step_10_more_markers: true,
      step_11_more_tags: true,
      step_12_less_associated_files: true,
      step_13_more_metadata_cardinality: true,
    };
  }

  function defaultProtectionToggles() {
    return {
      protect_o_count: true,
      protect_group_association: true,
      protect_performer_mismatch: true,
      protect_tag_loss_gt_1_non_stashed: true,
      protect_older_date: true,
      protect_ignore_smart_resolve_tag: true,
    };
  }

  var state = {
    groups: null,
    lastPlan: null,
    loading: false,
    autoCheckDefault: true,
    applyingDomEnhancements: false,
    lastBadgePageKey: "",
    ruleToggles: defaultRuleToggles(),
    protectionToggles: defaultProtectionToggles(),
    /** True after user runs Select Smart Resolve — sync/other refreshes preserve UI when set. */
    smartResolveUiActive: false,
    observer: null,
    attachedRoot: null,
    retryTimer: null,
  };

  function parseParams() {
    var q = new URLSearchParams(window.location.search);
    return {
      page: Math.max(1, parseInt(q.get("page") || "1", 10) || 1),
      size: Math.max(1, parseInt(q.get("size") || "20", 10) || 20),
      distance: parseInt(q.get("distance") || "0", 10) || 0,
      durationDiff: parseFloat(q.get("durationDiff") || "1"),
    };
  }

  /** Same green/red banners Stash uses for “Updated scene” etc. (see hooks/Toast.tsx). */
  var stashInlineNotifyRef = null;
  var stashInlineNotifyBridgeInstalled = false;

  /** Must be a stable function identity — defining inside patch.after() remounts every App render and breaks the UI. */
  function DuplicateResolverStashNotifyMount() {
    var P = window.PluginApi;
    var R = P.React;
    var t = P.hooks.useToast();
    R.useEffect(
      function () {
        stashInlineNotifyRef = t;
        return function () {
          stashInlineNotifyRef = null;
        };
      },
      [t]
    );
    return null;
  }

  function installStashInlineNotifyBridge() {
    if (stashInlineNotifyBridgeInstalled || typeof window.PluginApi === "undefined") return;
    var P = window.PluginApi;
    if (!P.patch || !P.patch.after || !P.React || !P.hooks || !P.hooks.useToast) return;
    stashInlineNotifyBridgeInstalled = true;
    P.patch.after("App", function () {
      var R = P.React;
      /** Patch passes afterFn(...originalArgs, renderedTree). Last arg is always App output; arity can be 1 if a before() cleared args. */
      var prevTree = arguments[arguments.length - 1];
      return R.createElement(
        R.Fragment,
        null,
        R.createElement(DuplicateResolverStashNotifyMount, null),
        prevTree
      );
    });
  }

  function notifyStashSuccess(message) {
    if (stashInlineNotifyRef) stashInlineNotifyRef.success(message);
    else window.alert(message);
  }

  function notifyStashError(err) {
    if (stashInlineNotifyRef) stashInlineNotifyRef.error(err);
    else
      window.alert(
        err && err.message ? err.message : typeof err === "string" ? err : String(err)
      );
  }

  function notifyStashWarning(message) {
    if (stashInlineNotifyRef && stashInlineNotifyRef.toast)
      stashInlineNotifyRef.toast({ content: message, variant: "warning" });
    else window.alert(message);
  }

  async function gql(query, variables) {
    var res = await fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query, variables: variables || {} }),
    });
    var j = await res.json();
    if (j.errors && j.errors.length)
      throw new Error(j.errors.map(function (e) { return e.message; }).join("; "));
    return j.data;
  }

  var DUPLICATE_QUERY =
    "query FindDuplicateScenesDr($distance: Int, $duration_diff: Float) {" +
    "  findDuplicateScenes(distance: $distance, duration_diff: $duration_diff) {" +
    "    id title code details director urls date rating100" +
    "    o_counter" +
    "    paths { screenshot }" +
    "    files { id path size width height video_codec bit_rate duration }" +
    "    scene_markers { id }" +
    "    studio { id name }" +
    "    tags { id name }" +
    "    performers { id name }" +
    "    groups { group { id name } scene_index }" +
    "    galleries { id title }" +
    "    stash_ids { endpoint stash_id }" +
    "  }" +
    "}";

  function groupTotalSize(group) {
    return group.reduce(function (acc, s) {
      return (
        acc +
        (s.files || []).reduce(function (a, f) {
          return a + (f.size || 0);
        }, 0)
      );
    }, 0);
  }

  function sortGroupsLikeStash(groups) {
    return groups.slice().sort(function (a, b) {
      return groupTotalSize(b) - groupTotalSize(a);
    });
  }

  function codecRank(codec) {
    var c = (codec || "").toLowerCase();
    if (c.indexOf("av01") !== -1 || c.indexOf("av1") !== -1) return 5;
    if (c.indexOf("hevc") !== -1 || c.indexOf("h265") !== -1) return 4;
    if (c.indexOf("vp9") !== -1) return 3;
    if (c.indexOf("h264") !== -1 || c.indexOf("avc") !== -1) return 2;
    return 1;
  }

  function primaryFile(scene) {
    return (scene.files && scene.files[0]) || {};
  }

  function countSignals(scene) {
    return {
      tags: (scene.tags || []).length,
      performers: (scene.performers || []).length,
      groups: (scene.groups || []).length,
      markers: (scene.scene_markers || []).length,
      oCount: scene.o_counter || 0,
    };
  }

  function isNearlySameDuration(a, b) {
    var da = Math.max(0, a || 0);
    var db = Math.max(0, b || 0);
    if (!da || !db) return false;
    var diff = Math.abs(da - db);
    var max = Math.max(da, db);
    return diff <= 2 || diff / max <= 0.02;
  }

  function efficiencyWinner(a, b) {
    var fa = primaryFile(a);
    var fb = primaryFile(b);
    var aPixels = (fa.width || 0) * (fa.height || 0);
    var bPixels = (fb.width || 0) * (fb.height || 0);
    if (!aPixels || !bPixels || aPixels !== bPixels) return null;
    if (!isNearlySameDuration(fa.duration || 0, fb.duration || 0)) return null;

    var aCodec = codecRank(fa.video_codec);
    var bCodec = codecRank(fb.video_codec);
    if (aCodec === bCodec) return null;

    var aSize = fa.size || 0;
    var bSize = fb.size || 0;
    var aRate = fa.bit_rate || 0;
    var bRate = fb.bit_rate || 0;

    var aMuchSmaller = !!(aSize && bSize && aSize <= bSize * 0.75);
    var bMuchSmaller = !!(aSize && bSize && bSize <= aSize * 0.75);
    var aLowerRate = !!(aRate && bRate && aRate <= bRate * 0.8);
    var bLowerRate = !!(aRate && bRate && bRate <= aRate * 0.8);

    if (aCodec > bCodec && (aMuchSmaller || aLowerRate)) return "a";
    if (bCodec > aCodec && (bMuchSmaller || bLowerRate)) return "b";
    return null;
  }

  // Returns "a" or "b" when one side is >= across all categories and > in at least one.
  function unanimousCategoryWinner(a, b) {
    var ka = countSignals(a);
    var kb = countSignals(b);
    // Tags are noisy/drift-prone; keep them out of decisive unanimity.
    var keys = ["performers", "groups", "markers", "oCount"];
    var aGeAll = true;
    var bGeAll = true;
    var aGtAny = false;
    var bGtAny = false;
    keys.forEach(function (k) {
      if (ka[k] < kb[k]) aGeAll = false;
      if (kb[k] < ka[k]) bGeAll = false;
      if (ka[k] > kb[k]) aGtAny = true;
      if (kb[k] > ka[k]) bGtAny = true;
    });
    if (aGeAll && aGtAny) return "a";
    if (bGeAll && bGtAny) return "b";
    return null;
  }

  function compareKeeper(a, b) {
    // O-count is a hard guard: never prefer deleting an O-count scene.
    var oa = a.o_counter || 0;
    var ob = b.o_counter || 0;
    if (!!oa !== !!ob) return ob - oa;

    // Prefer the best source file first; metadata can be synced.
    var af = primaryFile(a);
    var bf = primaryFile(b);
    var aPixels = (af.width || 0) * (af.height || 0);
    var bPixels = (bf.width || 0) * (bf.height || 0);
    if (aPixels !== bPixels) return bPixels - aPixels;

    // If one side clearly wins category-by-category, keep it.
    var unanimous = unanimousCategoryWinner(a, b);
    if (unanimous === "a") return -1;
    if (unanimous === "b") return 1;

    var ga = (a.groups && a.groups.length) || 0;
    var gb = (b.groups && b.groups.length) || 0;
    if (ga !== gb) return gb - ga;

    var sa = (a.stash_ids && a.stash_ids.length) || 0;
    var sb = (b.stash_ids && b.stash_ids.length) || 0;
    if (sa !== sb) return sb - sa;

    // Prefer clearly better encoding efficiency at equivalent visual profile.
    var eff = efficiencyWinner(a, b);
    if (eff === "a") return -1;
    if (eff === "b") return 1;

    var aCounts = countSignals(a);
    var bCounts = countSignals(b);
    if (aCounts.groups !== bCounts.groups) return bCounts.groups - aCounts.groups;
    if (aCounts.performers !== bCounts.performers) return bCounts.performers - aCounts.performers;
    if (aCounts.markers !== bCounts.markers) return bCounts.markers - aCounts.markers;
    if (aCounts.tags !== bCounts.tags) return bCounts.tags - aCounts.tags;

    var fa = primaryFile(a);
    var fb = primaryFile(b);
    var aCodec = codecRank(fa.video_codec);
    var bCodec = codecRank(fb.video_codec);
    if (aCodec !== bCodec) return bCodec - aCodec;

    var pa = (fa.width || 0) * (fa.height || 0);
    var pb = (fb.width || 0) * (fb.height || 0);
    if (pa !== pb) return pb - pa;

    var za = fa.size || 0;
    var zb = fb.size || 0;
    if (za !== zb) return zb - za;

    return String(a.id).localeCompare(String(b.id));
  }

  function pickKeeper(group) {
    return group.slice().sort(compareKeeper)[0];
  }

  function reasonAgainst(keeper, other) {
    if (!keeper || !other) return "deterministic fallback";

    function dataSignals(scene) {
      return {
        hasTitle: !!(scene.title && String(scene.title).trim()),
        hasCode: !!(scene.code && String(scene.code).trim()),
        hasDetails: !!(scene.details && String(scene.details).trim()),
        hasDirector: !!(scene.director && String(scene.director).trim()),
        hasDate: !!(scene.date && String(scene.date).trim()),
        tagCount: (scene.tags || []).length,
        performerCount: (scene.performers || []).length,
        groupCount: (scene.groups || []).length,
        stashIdCount: (scene.stash_ids || []).length,
        urlCount: (scene.urls || []).length,
        galleryCount: (scene.galleries || []).length,
        hasStudio: !!(scene.studio && scene.studio.id),
      };
    }

    function isSparse(sig) {
      return (
        !sig.hasTitle &&
        !sig.hasCode &&
        !sig.hasDetails &&
        !sig.hasDirector &&
        !sig.hasDate &&
        sig.tagCount === 0 &&
        sig.performerCount === 0 &&
        sig.groupCount === 0 &&
        sig.stashIdCount === 0 &&
        sig.urlCount === 0 &&
        sig.galleryCount === 0 &&
        !sig.hasStudio
      );
    }

    function groupIdSafe(g) {
      return g && g.group && g.group.id != null ? String(g.group.id) : null;
    }

    function groupSummary(scene) {
      var groups = scene.groups || [];
      var ids = groups
        .map(function (g) { return groupIdSafe(g); })
        .filter(function (id) { return !!id; });
      var idxMap = new Map();
      groups.forEach(function (g) {
        var id = groupIdSafe(g);
        if (id) idxMap.set(id, g.scene_index);
      });
      return { ids: ids, idxMap: idxMap };
    }

    function haveSameGroupSet(aSummary, bSummary) {
      if (aSummary.ids.length !== bSummary.ids.length) return false;
      var setB = new Set(bSummary.ids);
      for (var i = 0; i < aSummary.ids.length; i++) {
        if (!setB.has(aSummary.ids[i])) return false;
      }
      return true;
    }

    function groupReasonPrefix() {
      var kg = groupSummary(keeper);
      var og = groupSummary(other);
      if (!kg.ids.length && !og.ids.length) return "";
      if (!!kg.ids.length !== !!og.ids.length) {
        return "Group presence differs";
      }
      var overlap = kg.ids.filter(function (id) { return og.ids.indexOf(id) !== -1; });
      if (!overlap.length) return "Different groups";
      var details = overlap.map(function (id) {
        var kIdx = kg.idxMap.get(id);
        var oIdx = og.idxMap.get(id);
        return "(" + id + "," + String(kIdx) + "/" + String(oIdx) + ")";
      });
      return "Same group(s) " + details.join(", ");
    }

    function withGroupContext(msg) {
      var ctx = groupReasonPrefix();
      return ctx ? ctx + ", " + msg : msg;
    }

    var kSig = dataSignals(keeper);
    var oSig = dataSignals(other);
    var kCounts = countSignals(keeper);
    var oCounts = countSignals(other);
    var kg = groupSummary(keeper);
    var og = groupSummary(other);
    var kf = primaryFile(keeper);
    var of = primaryFile(other);
    var kPixels = (kf.width || 0) * (kf.height || 0);
    var oPixels = (of.width || 0) * (of.height || 0);

    // Never auto-resolve by deleting a better source file.
    if (oPixels > kPixels) {
      return withGroupContext(
        "duplicate has higher resolution (" +
          (of.width || 0) +
          "x" +
          (of.height || 0) +
          " vs " +
          (kf.width || 0) +
          "x" +
          (kf.height || 0) +
          "). Recommend synch data from duplicate."
      );
    }

    // Keeper has substantive metadata while duplicate is sparse -> keep keeper.
    if (!isSparse(kSig) && isSparse(oSig)) {
      return (
        "Keep scene with data."
      );
    }

    // Different group sets are a hard sync case to avoid losing group associations.
    if (!haveSameGroupSet(kg, og)) {
      return withGroupContext(
        "different group associations. Recommend synch data from duplicate."
      );
    }

    var kGroups = (keeper.groups || []).length;
    var oGroups = (other.groups || []).length;
    // Group cardinality differs -> keep group-richer scene, but sync to avoid loss.
    if (kGroups !== oGroups) {
      if (kGroups > oGroups) {
        return "Keep Scene with Group Association.";
      }
      return "Duplicate has additional Group Association. Recommend synch data from duplicate.";
    }

    var kStash = (keeper.stash_ids && keeper.stash_ids.length) || 0;
    var oStash = (other.stash_ids && other.stash_ids.length) || 0;
    // External IDs differ -> prefer scene with more confirmed IDs.
    if (kStash !== oStash) {
      return withGroupContext(
        "keep scene with confirmed IDs while duplicate has fewer/none."
      );
    }

    // One side has O-count and the other does not -> keep O-count anchor, sync remaining deltas.
    if (!!kCounts.oCount !== !!oCounts.oCount) {
      return withGroupContext(
        "keep scene with O-count signal. Recommend synch data from duplicate."
      );
    }

    // Both scenes are stashed.
    // No discernable difference in metadata beyond tags
    // Chosing scene with more tags.
    var stashLinked = ((keeper.stash_ids || []).length + (other.stash_ids || []).length) > 0;
    var highValueEqual =
      kCounts.performers === oCounts.performers &&
      kCounts.groups === oCounts.groups &&
      kCounts.markers === oCounts.markers &&
      kCounts.oCount === oCounts.oCount;
    // Both scenes are stashed and only tags differ -> de-prioritize tags noise, keep tag-richer scene.
    if (stashLinked && highValueEqual && kCounts.tags !== oCounts.tags) {
      return withGroupContext(
        "All scenes stashed, tag-only difference; keep scene with more tags."
      );
    }

    // Non-stashed variant of tag-only delta -> keep tag-richer scene.
    if (highValueEqual && kCounts.tags !== oCounts.tags) {
      return withGroupContext(
        "tag-only difference; keep scene with more tags."
      );
    }

    // No metadata signal separates them -> keeper came from deterministic ordering.
    if (
      highValueEqual &&
      kCounts.tags === oCounts.tags
    ) {
      return withGroupContext(
        "no meaningful metadata delta; deterministic keeper tie-break."
      );
    }

    var effWinner = efficiencyWinner(keeper, other);
    // Same visual profile but keeper is clearly more efficient codec/bitrate/size -> sync then delete duplicate.
    if (effWinner === "a") {
      return withGroupContext(
        "codec/efficiency winner at equivalent resolution/duration. Recommend synch data from duplicate."
      );
    }
    // Duplicate is more efficient while current keeper remained selected by ordering -> sync recommended.
    if (effWinner === "b") {
      return withGroupContext(
        "duplicate is codec/efficiency winner at equivalent resolution/duration. Recommend synch data from duplicate."
      );
    }

    var unanimous = unanimousCategoryWinner(keeper, other);
    // Keeper is >= duplicate across decisive categories -> safe keep decision.
    if (unanimous === "a") {
      return withGroupContext(
        "unanimous category winner (tags/performers/groups/markers/o-count)."
      );
    }
    // Duplicate is unanimous winner, but keeper was chosen by upstream ordering -> sync before cleanup.
    if (unanimous === "b") {
      return withGroupContext(
        "duplicate is unanimous category winner; keeper chosen by deterministic fallback. Recommend synch data from duplicate."
      );
    }

    // Category split means potential data loss either way -> force sync recommendation.
    return withGroupContext(
      "category split (tags/performers/groups/markers/o-count). Recommend synch data from duplicate."
    );
  }

  async function loadDuplicateGroups() {
    var p = parseParams();
    var data = await gql(DUPLICATE_QUERY, {
      distance: p.distance,
      duration_diff: p.durationDiff,
    });
    state.groups = sortGroupsLikeStash(data.findDuplicateScenes || []);
    return state.groups;
  }

  async function refreshPlanAndDecorations() {
    var scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    await loadDuplicateGroups();
    state.lastPlan = buildPlan();
    renderInlineReasons(state.lastPlan);
    renderSyncRecommendations(state.lastPlan);
    if (
      state.smartResolveUiActive &&
      state.lastPlan &&
      state.lastPlan.entries &&
      state.lastPlan.entries.length
    ) {
      ensureMatchSetAnchors();
      renderPlanDetailsIntoDrawer(state.lastPlan);
      updateUnresolvedButton(state.lastPlan, true);
      setSmartResolveDetailsVisible(true, false);
    }
    if (typeof window !== "undefined") {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          window.scrollTo(0, scrollY);
        });
      });
    }
  }

  function shouldRefreshAfterSync() {
    var p = parseParams();
    var distance = Number(p && p.distance) || 0;
    var durationDiff = Number(p && p.durationDiff);
    if (!Number.isFinite(durationDiff)) durationDiff = 1;
    // Near-dupe mode can make duplicate query expensive; let user refresh manually.
    return !(distance > 0 && durationDiff > 1);
  }

  function visibleGroups(groups) {
    var p = parseParams();
    var start = (p.page - 1) * p.size;
    return groups.slice(start, start + p.size);
  }

  function parseDateForComparison(v) {
    if (v == null) return new Date("2999-12-31T00:00:00Z").getTime();
    var s = String(v).trim();
    if (!s) return new Date("2999-12-31T00:00:00Z").getTime();
    if (/^\d{4}$/.test(s)) s = s + "-12-31";
    else if (/^\d{4}-\d{2}$/.test(s)) {
      var y = parseInt(s.slice(0, 4), 10);
      var m = parseInt(s.slice(5, 7), 10);
      var lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
      s = s + "-" + String(lastDay).padStart(2, "0");
    }
    var t = Date.parse(s);
    if (Number.isNaN(t)) return new Date("2999-12-31T00:00:00Z").getTime();
    return t;
  }

  var EARLIER_DATE_BUFFER_MS = 36 * 60 * 60 * 1000; // 1.5 days

  function roundedDurationSeconds(v) {
    var n = Number(v || 0) || 0;
    return Math.round(n);
  }

  function fileHasUpgradeToken(scene) {
    var f = primaryFile(scene);
    var p = String(f.path || "").toUpperCase();
    return p.indexOf("UPGRADE") !== -1;
  }

  function metadataCardinality(scene) {
    var score = 0;
    function hasText(v) {
      return !!(v != null && String(v).trim());
    }
    if (hasText(scene.title)) score += 1;
    if (hasText(scene.code)) score += 1;
    if ((scene.urls || []).length) score += (scene.urls || []).length;
    if (hasText(scene.date)) score += 1;
    if (hasText(scene.director)) score += 1;
    if ((scene.galleries || []).length) score += (scene.galleries || []).length;
    if (scene.studio && scene.studio.id != null) score += 1;
    if ((scene.performers || []).length) score += (scene.performers || []).length;
    if ((scene.groups || []).length) score += (scene.groups || []).length;
    if ((scene.tags || []).length) score += (scene.tags || []).length;
    if (hasText(scene.details)) score += 1;
    return score;
  }

  function eliminateByMetric(candidates, metricFn, mode) {
    if (!candidates.length) return candidates;
    var vals = candidates.map(metricFn);
    var target = mode === "min" ? Math.min.apply(null, vals) : Math.max.apply(null, vals);
    return candidates.filter(function (s) {
      return metricFn(s) === target;
    });
  }

  function eliminateByMaxWithinPercent(candidates, metricFn, tolerancePercent) {
    if (!candidates.length) return candidates;
    var vals = candidates.map(metricFn);
    var maxVal = Math.max.apply(null, vals);
    if (maxVal <= 0) return candidates.slice();
    var tolerance = Math.max(0, Number(tolerancePercent || 0)) / 100;
    var minAllowed = maxVal * (1 - tolerance);
    return candidates.filter(function (s) {
      return metricFn(s) >= minAllowed;
    });
  }

  function eliminateByEarliestDateWithBuffer(candidates) {
    if (!candidates.length) return candidates;
    var vals = candidates.map(function (s) {
      return parseDateForComparison(s.date);
    });
    var minVal = Math.min.apply(null, vals);
    return candidates.filter(function (s) {
      return parseDateForComparison(s.date) <= minVal + EARLIER_DATE_BUFFER_MS;
    });
  }

  function chooseKeeperBySpec(group) {
    var candidates = group.slice();
    var decision = "step_14_scene_id";
    var toggles = state.ruleToggles || defaultRuleToggles();
    function enabled(key) {
      return toggles[key] !== false;
    }
    function step(code, reducer) {
      if (candidates.length <= 1) return;
      var next = reducer(candidates);
      if (next.length < candidates.length) {
        decision = code;
      }
      candidates = next;
    }

    if (enabled("step_01_total_pixels")) step("step_01_total_pixels", function (arr) {
      return eliminateByMaxWithinPercent(
        arr,
        function (s) {
          var f = primaryFile(s);
          return (f.width || 0) * (f.height || 0);
        },
        1
      );
    });
    if (enabled("step_02_framerate")) step("step_02_framerate", function (arr) {
      return eliminateByMetric(
        arr,
        function (s) {
          var f = primaryFile(s);
          return Number(f.frame_rate || f.framerate || 0) || 0;
        },
        "max"
      );
    });
    if (enabled("step_03_codec")) step("step_03_codec", function (arr) {
      return eliminateByMetric(
        arr,
        function (s) {
          return codecRank(primaryFile(s).video_codec);
        },
        "max"
      );
    });
    if (enabled("step_upgrade_token")) step("step_upgrade_token", function (arr) {
      return eliminateByMetric(
        arr,
        function (s) { return fileHasUpgradeToken(s) ? 1 : 0; },
        "max"
      );
    });
    if (enabled("step_04_duration")) step("step_04_duration", function (arr) {
      return eliminateByMetric(
        arr,
        function (s) {
          return roundedDurationSeconds(primaryFile(s).duration || 0);
        },
        "max"
      );
    });
    if (enabled("step_05_smaller_size")) step("step_05_smaller_size", function (arr) {
      var minSize = Math.min.apply(
        null,
        arr.map(function (s) { return Number(primaryFile(s).size || 0) || 0; })
      );
      var sizeTolerance = Math.max(1024 * 1024, minSize * 0.01);
      return arr.filter(function (s) {
        var size = Number(primaryFile(s).size || 0) || 0;
        return size <= minSize + sizeTolerance || fileHasUpgradeToken(s);
      });
    });
    if (enabled("step_06_older_date")) step("step_06_older_date", function (arr) {
      return eliminateByEarliestDateWithBuffer(arr);
    });
    if (enabled("step_07_more_groups")) step("step_07_more_groups", function (arr) {
      return eliminateByMetric(arr, function (s) { return (s.groups || []).length; }, "max");
    });
    if (enabled("step_08_has_stashid")) step("step_08_has_stashid", function (arr) {
      return eliminateByMetric(
        arr,
        function (s) { return (s.stash_ids || []).length > 0 ? 1 : 0; },
        "max"
      );
    });
    if (enabled("step_09_more_performers")) step("step_09_more_performers", function (arr) {
      return eliminateByMetric(arr, function (s) { return (s.performers || []).length; }, "max");
    });
    if (enabled("step_10_more_markers")) step("step_10_more_markers", function (arr) {
      return eliminateByMetric(arr, function (s) { return (s.scene_markers || []).length; }, "max");
    });
    if (enabled("step_11_more_tags")) step("step_11_more_tags", function (arr) {
      return eliminateByMetric(arr, function (s) { return (s.tags || []).length; }, "max");
    });
    if (enabled("step_12_less_associated_files")) step("step_12_less_associated_files", function (arr) {
      return eliminateByMetric(arr, function (s) { return (s.files || []).length; }, "min");
    });
    if (enabled("step_13_more_metadata_cardinality")) step("step_13_more_metadata_cardinality", function (arr) {
      return eliminateByMetric(arr, metadataCardinality, "max");
    });
    // Step 14 is intentionally always on as deterministic fallback.
    step("step_14_scene_id", function (arr) {
      return eliminateByMetric(
        arr,
        function (s) { return parseInt(String(s.id), 10) || 0; },
        "min"
      );
    });

    var keeper = candidates[0] || group[0];
    return { keeper: keeper, decisionCode: decision };
  }

  function groupEntries(scene) {
    return (scene.groups || [])
      .map(function (g) {
        if (!g || !g.group || g.group.id == null) return null;
        return {
          id: String(g.group.id),
          index: g.scene_index == null ? null : Number(g.scene_index),
        };
      })
      .filter(function (x) { return !!x; });
  }

  function containsAllGroupEntries(keeper, other) {
    var k = groupEntries(keeper);
    var n = groupEntries(other);
    return n.every(function (ne) {
      return k.some(function (ke) {
        return ke.id === ne.id && ke.index === ne.index;
      });
    });
  }

  function missingGroupEntries(keeper, other) {
    var k = groupEntries(keeper);
    var n = groupEntries(other);
    return n.filter(function (ne) {
      return !k.some(function (ke) {
        return ke.id === ne.id && ke.index === ne.index;
      });
    });
  }

  function performerIds(scene) {
    var seen = {};
    return (scene.performers || [])
      .map(function (p) {
        if (!p || p.id == null) return null;
        return String(p.id);
      })
      .filter(function (id) {
        if (!id || seen[id]) return false;
        seen[id] = true;
        return true;
      });
  }

  function missingPerformerIds(keeper, other) {
    var kIds = performerIds(keeper);
    var nIds = performerIds(other);
    return nIds.filter(function (id) {
      return kIds.indexOf(id) === -1;
    });
  }

  function decisionReasonFromCode(code) {
    var map = {
      step_01_total_pixels: "keeper selected by highest total pixel resolution.",
      step_02_framerate: "keeper selected by highest framerate.",
      step_03_codec: "keeper selected by best codec tier.",
      step_upgrade_token: "keeper selected by upgrade token preference.",
      step_04_duration: "keeper selected by greater duration.",
      step_05_smaller_size: "keeper selected by smaller file size.",
      step_06_older_date: "keeper selected by older scene date.",
      step_07_more_groups: "keeper selected by greater group count.",
      step_08_has_stashid: "keeper selected by stash ID presence.",
      step_09_more_performers: "keeper selected by greater performer count.",
      step_10_more_markers: "keeper selected by greater marker count.",
      step_11_more_tags: "keeper selected by greater tag count.",
      step_12_less_associated_files: "keeper selected by fewer associated files.",
      step_13_more_metadata_cardinality: "keeper selected by richer metadata cardinality.",
      step_14_scene_id: "keeper selected by deterministic scene ID tie-break.",
    };
    return map[code] || "keeper selected by deterministic rule ordering.";
  }

  function evaluateNonKeeperProtection(keeper, nonKeeper) {
    var res = {
      markForDeletion: true,
      markParentForSync: false,
      exceptions: [],
    };
    var toggles = state.protectionToggles || defaultProtectionToggles();
    function enabled(key) {
      return toggles[key] !== false;
    }

    if (enabled("protect_o_count") && (nonKeeper.o_counter || 0) > 0) {
      res.markForDeletion = false;
      res.exceptions.push("protect_o_count");
    }
    var hasIgnoreSmartResolveTag = (nonKeeper.tags || []).some(function (t) {
      return (
        t &&
        t.name != null &&
        String(t.name).trim().toLowerCase() === "ignore:smart resolve"
      );
    });
    if (enabled("protect_ignore_smart_resolve_tag") && hasIgnoreSmartResolveTag) {
      res.markForDeletion = false;
      res.exceptions.push("protect_ignore_smart_resolve_tag");
    }
    if (enabled("protect_group_association") && !containsAllGroupEntries(keeper, nonKeeper)) {
      res.markForDeletion = false;
      res.markParentForSync = true;
      res.exceptions.push("protect_group_association");
    }

    var missingPerfs = missingPerformerIds(keeper, nonKeeper);
    if (enabled("protect_performer_mismatch") && missingPerfs.length > 0) {
      res.markForDeletion = false;
      res.markParentForSync = true;
      res.exceptions.push("protect_performer_mismatch");
    }

    var nStashed = (nonKeeper.stash_ids || []).length > 0;
    var kTags = (keeper.tags || []).length;
    var nTags = (nonKeeper.tags || []).length;
    if (enabled("protect_tag_loss_gt_1_non_stashed") && !nStashed && nTags - kTags > 1) {
      res.markForDeletion = false;
      res.markParentForSync = true;
      res.exceptions.push("protect_tag_loss_gt_1_non_stashed");
    }

    var kd = parseDateForComparison(keeper.date);
    var nd = parseDateForComparison(nonKeeper.date);
    var keeperRaw = keeper.date;
    var nonRaw = nonKeeper.date;
    if (
      enabled("protect_older_date") &&
      ((keeperRaw == null && nonRaw != null) || kd - nd > EARLIER_DATE_BUFFER_MS)
    ) {
      res.markForDeletion = false;
      res.markParentForSync = true;
      res.exceptions.push("protect_older_date");
    }
    return res;
  }

  function formatExceptionMessages(keeper, nonKeeper, exceptions) {
    if (!exceptions || !exceptions.length) return [];
    return exceptions.map(function (code) {
      if (code === "protect_o_count") {
        return "Non-keeper has O-count and is protected from deletion.";
      }
      if (code === "protect_ignore_smart_resolve_tag") {
        return 'Target is tagged "Ignore:Smart Resolve" and is protected from deletion.';
      }
      if (code === "protect_group_association") {
        var missing = missingGroupEntries(keeper, nonKeeper);
        var details = missing.length
          ? missing
              .map(function (m) {
                return m.id + ":" + (m.index == null ? "null" : String(m.index));
              })
              .join(", ")
          : "unknown";
        return "Target has unmatched group associations (" + details + ").";
      }
      if (code === "protect_performer_mismatch") {
        var missingPerfIds = missingPerformerIds(keeper, nonKeeper);
        return missingPerfIds.length
          ? "Target has unmatched performer IDs (" + missingPerfIds.join(", ") + ")."
          : "Target has unmatched performer IDs.";
      }
      if (code === "protect_tag_loss_gt_1_non_stashed") {
        var kTags = (keeper.tags || []).length;
        var nTags = (nonKeeper.tags || []).length;
        return (
          "Target has more than 1 additional tag than keeper (" +
          nTags +
          " vs " +
          kTags +
          ")."
        );
      }
      if (code === "protect_older_date") {
        return "Target has an older date than keeper.";
      }
      return code;
    });
  }

  function buildPlan() {
    var groups = state.groups;
    if (!groups || !groups.length)
      return { entries: [], checks: {}, reasonsBySceneId: {}, syncRecommendedTargets: {} };
    var vis = visibleGroups(groups);
    var entries = [];
    var checks = {};
    var reasonsBySceneId = {};
    var syncRecommendedTargets = {};
    var unresolvedHighlightSceneIds = {};
    vis.forEach(function (group, gi) {
      if (!group || group.length < 2) return;
      var keeperDecision = chooseKeeperBySpec(group);
      var keeper = keeperDecision.keeper;
      var baseReason = decisionReasonFromCode(keeperDecision.decisionCode);
      var nonKeepers = group.filter(function (s) { return s.id !== keeper.id; });
      var deleteIds = [];
      var keeperNeedsSync = false;
      nonKeepers.forEach(function (loser) {
        var pr = evaluateNonKeeperProtection(keeper, loser);
        if (pr.markForDeletion) deleteIds.push(loser.id);
        else checks[loser.id] = false;
        if (pr.markParentForSync || pr.exceptions.length) keeperNeedsSync = true;
        var loserReason = baseReason;
        if (pr.exceptions.length) {
          var pretty = formatExceptionMessages(keeper, loser, pr.exceptions);
          loserReason +=
            " Exceptions: " +
            pretty.join(" ") +
            ". Recommend synch data from duplicate.";
        }
        reasonsBySceneId[String(loser.id)] = loserReason;
      });
      if (keeperNeedsSync) {
        syncRecommendedTargets[String(keeper.id)] = true;
        group.forEach(function (s) {
          unresolvedHighlightSceneIds[String(s.id)] = true;
        });
      }
      entries.push({
        setNumber: gi + 1,
        keeperId: keeper.id,
        deleteIds: deleteIds,
        reason:
          baseReason +
          (keeperNeedsSync ? " Recommend synch data from duplicate." : ""),
      });
      group.forEach(function (s) {
        if (s.id === keeper.id) {
          checks[s.id] = false;
          return;
        }
        if (!Object.prototype.hasOwnProperty.call(checks, s.id)) {
          checks[s.id] = deleteIds.indexOf(s.id) !== -1;
        }
      });
    });
    return {
      entries: entries,
      checks: checks,
      reasonsBySceneId: reasonsBySceneId,
      syncRecommendedTargets: syncRecommendedTargets,
      unresolvedHighlightSceneIds: unresolvedHighlightSceneIds,
    };
  }

  function ensureMatchSetAnchors() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    var rows = root.querySelectorAll("table.duplicate-checker-table tbody tr");
    var setNum = 0;
    Array.prototype.forEach.call(rows, function (tr) {
      if (tr.classList.contains("duplicate-group")) {
        setNum += 1;
        tr.id = "dr-match-set-" + setNum;
      }
    });
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderPreviewHtml(plan) {
    if (!plan || !plan.entries || !plan.entries.length) {
      return "No duplicate pairs on this results page.";
    }
    return plan.entries
      .map(function (e) {
        return (
          '<a href="#dr-match-set-' +
          e.setNumber +
          '" class="dr-match-link" data-target="dr-match-set-' +
          e.setNumber +
          '">' +
          "Match Set " +
          e.setNumber +
          "</a>" +
          ": KEEP " +
          escapeHtml(e.keeperId) +
          " | Select for DELETE " +
          escapeHtml(e.deleteIds.join(", ")) +
          " | Reason: " +
          escapeHtml(e.reason)
        );
      })
      .join("<br/>");
  }

  function bindPreviewLinks(previewEl) {
    var links = previewEl.querySelectorAll(".dr-match-link");
    Array.prototype.forEach.call(links, function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        var id = a.getAttribute("data-target");
        if (!id) return;
        var target = document.getElementById(id);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  function sceneIdFromRow(tr) {
    var a = tr.querySelector('td a[href^="/scenes/"]');
    if (!a || !a.getAttribute("href")) return null;
    var m = a.getAttribute("href").match(/\/scenes\/(\d+)/);
    return m ? m[1] : null;
  }

  function setCheckboxForRow(tr, wantChecked) {
    var inp = tr.querySelector("input[type=checkbox]");
    if (!inp) return;
    var cur = !!inp.checked;
    if (cur !== wantChecked) {
      inp.click();
    }
  }

  function applyChecks(checkMap) {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    var rows = root.querySelectorAll("table.duplicate-checker-table tbody tr");
    rows.forEach(function (tr) {
      if (tr.classList.contains("separator")) return;
      var sid = sceneIdFromRow(tr);
      if (!sid || !Object.prototype.hasOwnProperty.call(checkMap, sid)) return;
      setCheckboxForRow(tr, checkMap[sid]);
    });
  }

  function clearInlineReasons() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    root.querySelectorAll(".dr-inline-reason").forEach(function (el) {
      el.remove();
    });
    root
      .querySelectorAll("table.duplicate-checker-table tbody tr.dr-unresolved-highlight")
      .forEach(function (tr) {
        tr.classList.remove("dr-unresolved-highlight");
      });
  }

  function renderInlineReasons(plan) {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    clearInlineReasons();
    if (!plan || !plan.reasonsBySceneId) return;
    var highlightMap = (plan && plan.unresolvedHighlightSceneIds) || {};

    var rows = root.querySelectorAll("table.duplicate-checker-table tbody tr");
    rows.forEach(function (tr) {
      if (tr.classList.contains("separator")) return;
      var sid = sceneIdFromRow(tr);
      if (!sid) return;
      if (highlightMap[String(sid)]) {
        tr.classList.add("dr-unresolved-highlight");
      }
      var reason = plan.reasonsBySceneId[String(sid)];
      if (!reason) return;

      var titleCell = tr.querySelector("td.text-left");
      if (!titleCell) return;
      var p = document.createElement("p");
      p.className = "scene-path dr-inline-reason";
      p.textContent = "Smart Resolve: " + reason;
      titleCell.appendChild(p);
    });
  }

  function renderSyncRecommendations(plan) {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    var targets = (plan && plan.syncRecommendedTargets) || {};
    root.querySelectorAll(".duplicate-resolver-sync-btn").forEach(function (btn) {
      var sid = String(btn.getAttribute("data-scene-id") || "");
      var recommend = !!targets[sid];
      var desiredLabel = recommend ? "Sync rec." : "Sync data";
      var desiredTitle = recommend
        ? "Recommended: sync data from duplicate into this scene."
        : "";
      var hasWarning = btn.classList.contains("btn-warning");
      var hasSecondary = btn.classList.contains("btn-secondary");
      var classMismatch = recommend
        ? !hasWarning || hasSecondary
        : hasWarning || !hasSecondary;

      // Only mutate DOM if state actually changed (prevents observer churn loops).
      if (classMismatch) {
        btn.classList.remove("btn-secondary", "btn-warning");
        btn.classList.add(recommend ? "btn-warning" : "btn-secondary");
      }
      if (btn.textContent !== desiredLabel) btn.textContent = desiredLabel;
      if ((btn.getAttribute("title") || "") !== desiredTitle) btn.setAttribute("title", desiredTitle);
    });
  }

  function buildSmartResolveChecks(plan) {
    var checks = {};
    if (!plan || !plan.entries || !plan.entries.length) return checks;
    var syncTargets = (plan && plan.syncRecommendedTargets) || {};
    plan.entries.forEach(function (entry) {
      var keeperId = String(entry.keeperId);
      if (syncTargets[keeperId]) return;
      (entry.deleteIds || []).forEach(function (id) {
        checks[String(id)] = true;
      });
    });
    return checks;
  }

  function unresolvedInfo(plan) {
    var info = { count: 0, firstSetNumber: null };
    if (!plan || !plan.entries || !plan.entries.length) return info;
    var syncTargets = (plan && plan.syncRecommendedTargets) || {};
    plan.entries.forEach(function (entry) {
      if (!syncTargets[String(entry.keeperId)]) return;
      info.count += 1;
      if (info.firstSetNumber == null) info.firstSetNumber = entry.setNumber;
    });
    return info;
  }

  function updateUnresolvedButton(plan, show) {
    var btn = document.getElementById("dr-btn-unresolved");
    if (!btn) return;
    if (!show) {
      btn.hidden = true;
      btn.disabled = true;
      btn.removeAttribute("data-target-set");
      return;
    }

    var info = unresolvedInfo(plan);
    btn.hidden = false;
    btn.textContent = info.count + " Unresolved";
    btn.disabled = info.count === 0;
    if (info.firstSetNumber == null) {
      btn.removeAttribute("data-target-set");
      btn.setAttribute("title", "No unresolved sync recommendations on this page.");
    } else {
      btn.setAttribute("data-target-set", String(info.firstSetNumber));
      btn.setAttribute("title", "Jump to first unresolved match set.");
    }
  }

  function setProcessingIndicator(mode) {
    var el = document.getElementById("dr-processing-indicator");
    if (!el) return;
    var spinner = el.querySelector(".dr-processing-spinner");
    var bar = el.querySelector(".dr-processing-bar");
    var label = el.querySelector(".dr-processing-label");
    var normalized = mode === "bar" || mode === "spinner" ? mode : "none";
    if (normalized === "none") {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    if (spinner) spinner.hidden = normalized !== "spinner";
    if (bar) bar.hidden = normalized !== "bar";
    if (label) label.textContent = "Processing…";
  }

  function goToFirstUnresolved(plan) {
    ensureMatchSetAnchors();
    var info = unresolvedInfo(plan);
    if (info.firstSetNumber == null) return;
    var target = document.getElementById("dr-match-set-" + info.firstSetNumber);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderPlanDetailsIntoDrawer(plan) {
    var prev = document.getElementById("dr-preview-out");
    if (!prev) return;
    prev.innerHTML = renderPreviewHtml(plan);
    bindPreviewLinks(prev);
  }

  function ensureCoreSelectSmartResolveOption() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    var menuItems = root.querySelectorAll(".dropdown-menu .dropdown-item");
    if (!menuItems || !menuItems.length) return;

    var anchor = null;
    menuItems.forEach(function (item) {
      if ((item.textContent || "").trim() === "Select None") anchor = item;
    });
    if (!anchor) return;

    var menu = anchor.closest(".dropdown-menu");
    if (!menu || menu.querySelector("#dr-smart-resolve-option")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "dr-smart-resolve-option";
    btn.className = "dropdown-item";
    btn.textContent = "Select Smart Resolve";
    btn.onclick = async function () {
      setProcessingIndicator("spinner");
      try {
        // Always refresh to avoid stale state after SPA table changes (pagination/deletes).
        await loadDuplicateGroups();
        // Use URL page-size for indicator mode. If absent/unparseable, assume 20.
        var pageSize = parseParams().size || 20;
        if (pageSize > 20) {
          setProcessingIndicator("bar");
        }
        state.smartResolveUiActive = true;
        // Let the processing indicator paint before running heavier rule evaluation.
        await new Promise(function (resolve) {
          requestAnimationFrame(resolve);
        });
        state.lastPlan = buildPlan();
        ensureMatchSetAnchors();
        renderPlanDetailsIntoDrawer(state.lastPlan);
        renderInlineReasons(state.lastPlan);
        renderSyncRecommendations(state.lastPlan);
        applyChecks(buildSmartResolveChecks(state.lastPlan));
        updateUnresolvedButton(state.lastPlan, true);
        setSmartResolveDetailsVisible(true, false);
      } catch (e) {
        notifyStashError(e);
      } finally {
        setProcessingIndicator("none");
      }
    };
    anchor.parentNode.insertBefore(btn, anchor.nextSibling);
  }

  function placeToolbarButtonsInCoreRow() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    var bar = document.getElementById("duplicate-resolver-toolbar");
    if (!bar) return;
    var unresolvedBtn = bar.querySelector("#dr-btn-unresolved");
    var processingIndicator = bar.querySelector("#dr-processing-indicator");
    var autoBtn = bar.querySelector("#dr-btn-apply");
    var resetBtn = bar.querySelector("#dr-btn-reset");
    if (!unresolvedBtn || !processingIndicator || !autoBtn || !resetBtn) return;
    var toggle = root.querySelector(".dropdown .dropdown-toggle");
    if (!toggle || !toggle.parentNode) return;

    var host = document.getElementById("dr-core-actions");
    if (!host) {
      host = document.createElement("span");
      host.id = "dr-core-actions";
      host.className = "dr-core-actions";
      toggle.parentNode.insertBefore(host, toggle.nextSibling);
    }

    host.appendChild(unresolvedBtn);
    host.appendChild(processingIndicator);
    host.appendChild(resetBtn);
    host.appendChild(autoBtn);
  }

  function setSmartResolveDetailsVisible(show, expandDrawer) {
    var bar = document.getElementById("duplicate-resolver-toolbar");
    if (!bar) return;
    var drawerToggle = bar.querySelector("#dr-drawer-toggle");
    var drawerPanel = bar.querySelector("#dr-drawer-panel");
    var resetBtn = bar.querySelector("#dr-btn-reset");
    var unresolvedBtn = bar.querySelector("#dr-btn-unresolved");
    var processingIndicator = bar.querySelector("#dr-processing-indicator");
    if (!drawerToggle || !drawerPanel) return;

    bar.hidden = !show;
    drawerToggle.hidden = !show;
    if (resetBtn) resetBtn.hidden = !show;
    if (unresolvedBtn) unresolvedBtn.hidden = !show;
    if (processingIndicator) processingIndicator.hidden = !show;
    if (!show) {
      state.smartResolveUiActive = false;
      drawerPanel.hidden = true;
      drawerToggle.setAttribute("aria-expanded", "false");
      drawerToggle.textContent = "Match Details: \u25b6";
      updateUnresolvedButton(null, false);
      return;
    }

    if (expandDrawer) {
      drawerPanel.hidden = false;
      drawerToggle.setAttribute("aria-expanded", "true");
      drawerToggle.textContent = "Match Details: \u25bc";
    }
  }

  async function loadPluginSetting() {
    try {
      var data = await gql(
        "query DrCfg { configuration { plugins } }"
      );
      var plug = data.configuration && data.configuration.plugins;
      var cfg = null;
      if (plug && typeof plug === "object") {
        cfg = plug[PLUGIN_ID] || null;
        if (!cfg) {
          var k = Object.keys(plug).find(function (key) {
            return String(key).toLowerCase() === String(PLUGIN_ID).toLowerCase();
          });
          if (k) cfg = plug[k];
        }
      }
      if (cfg && typeof cfg === "object") {
        var v = cfg.autoCheckAfterSync;
        if (v === true || v === "true") state.autoCheckDefault = true;
        else if (v === false || v === "false") state.autoCheckDefault = false;
        function boolOrDefault(key, fallback) {
          var raw = cfg[key];
          if (raw === true || raw === "true") return true;
          if (raw === false || raw === "false") return false;
          return fallback;
        }
        state.ruleToggles = {
          step_01_total_pixels: !boolOrDefault("ignoreRule01TotalPixels", false),
          step_02_framerate: !boolOrDefault("ignoreRule02Framerate", false),
          step_03_codec: !boolOrDefault("ignoreRule03Codec", false),
          step_upgrade_token: !boolOrDefault("ignoreRule05bUpgradeToken", false),
          step_04_duration: !boolOrDefault("ignoreRule04Duration", false),
          step_05_smaller_size: !boolOrDefault("ignoreRule05SmallerSize", false),
          step_06_older_date: !boolOrDefault("ignoreRule06OlderDate", false),
          step_07_more_groups: !boolOrDefault("ignoreRule07MoreGroups", false),
          step_08_has_stashid: !boolOrDefault("ignoreRule08HasStashId", false),
          step_09_more_performers: !boolOrDefault("ignoreRule09MorePerformers", false),
          step_10_more_markers: !boolOrDefault("ignoreRule10MoreMarkers", false),
          step_11_more_tags: !boolOrDefault("ignoreRule11MoreTags", false),
          step_12_less_associated_files: !boolOrDefault("ignoreRule12LessAssociatedFiles", false),
          step_13_more_metadata_cardinality: !boolOrDefault(
            "ignoreRule13MoreMetadataCardinality",
            false
          ),
        };
        state.protectionToggles = {
          protect_o_count: !boolOrDefault("unprotectAOCount", false),
          protect_group_association: !boolOrDefault("unprotectBGroupAssociation", false),
          protect_performer_mismatch: !boolOrDefault("unprotectCPerformerMismatch", false),
          protect_tag_loss_gt_1_non_stashed: !boolOrDefault("unprotectDTagLossGt1NonStashed", false),
          protect_older_date: !boolOrDefault("unprotectEOlderDate", false),
          protect_ignore_smart_resolve_tag: !boolOrDefault("unprotectFIgnoreSmartResolveTag", false),
        };
      }
    } catch (e) {
      state.autoCheckDefault = true;
      state.ruleToggles = defaultRuleToggles();
      state.protectionToggles = defaultProtectionToggles();
    }
  }

  function mergeIds(target, additions) {
    var set = new Set();
    (target || []).forEach(function (x) { set.add(String(x)); });
    (additions || []).forEach(function (x) { set.add(String(x)); });
    return Array.from(set);
  }

  function mergeStashIds(target, additions) {
    var map = new Map();
    (target || []).forEach(function (s) {
      if (!s || !s.endpoint || !s.stash_id) return;
      // Stash enforces UNIQUE(scene_id, endpoint): keep one stash_id per endpoint.
      // Prefer existing target value when endpoint already exists.
      if (!map.has(s.endpoint)) {
        map.set(s.endpoint, { endpoint: s.endpoint, stash_id: s.stash_id });
      }
    });
    (additions || []).forEach(function (s) {
      if (!s || !s.endpoint || !s.stash_id) return;
      if (!map.has(s.endpoint)) {
        map.set(s.endpoint, { endpoint: s.endpoint, stash_id: s.stash_id });
      }
    });
    return Array.from(map.values()).map(function (s) {
      return { endpoint: s.endpoint, stash_id: s.stash_id };
    });
  }

  /**
   * Image URL/base64 for the scene *cover* (UI + sceneUpdate `cover_image`).
   * Stash `/scene/{id}/webp` is an animated *stream preview*, not cover — do not use.
   * `/scene/{id}/screenshot` is served from the cover store first (see Stash SceneServer.ServeScreenshot).
   */
  function sceneCoverDataUrl(scene) {
    if (!scene) return "";
    var c = scene.cover_image;
    if (c && String(c).trim()) return String(c).trim();
    var p = scene.paths || {};
    var shot = p.screenshot;
    return shot && String(shot).trim() ? String(shot).trim() : "";
  }

  function sceneResolution(scene) {
    var f = primaryFile(scene);
    var w = Number(f.width || 0) || 0;
    var h = Number(f.height || 0) || 0;
    return { width: w, height: h, totalPixels: w * h };
  }

  function sceneResolutionLabel(scene) {
    var r = sceneResolution(scene);
    if (r.width > 0 && r.height > 0) {
      return r.width + "px x " + r.height + "px";
    }
    return "resolution unknown";
  }

  function mergeGroups(target, additions) {
    var map = new Map();
    (target || []).forEach(function (g) {
      map.set(String(g.group.id), {
        group_id: g.group.id,
        scene_index: g.scene_index != null ? g.scene_index : null,
      });
    });
    (additions || []).forEach(function (g) {
      var id = String(g.group.id);
      if (!map.has(id))
        map.set(id, {
          group_id: g.group.id,
          scene_index: g.scene_index != null ? g.scene_index : null,
        });
    });
    return Array.from(map.values());
  }

  /** Union groups from target + sources (scene `groups` shape). */
  function collectMergedGroups(target, sources, enabled) {
    if (!enabled) return mergeGroups(target.groups, []);
    var map = new Map();
    function addAll(arr) {
      (arr || []).forEach(function (g) {
        var id = String(g.group.id);
        if (!map.has(id))
          map.set(id, {
            group_id: g.group.id,
            scene_index: g.scene_index != null ? g.scene_index : null,
          });
      });
    }
    addAll(target.groups);
    sources.forEach(function (s) {
      addAll(s.groups);
    });
    return Array.from(map.values());
  }

  function buildSceneUpdateInput(target, sources, opt) {
    var tag_ids = (target.tags || []).map(function (t) { return t.id; });
    var performer_ids = (target.performers || []).map(function (t) { return t.id; });
    var gallery_ids = (target.galleries || []).map(function (t) { return t.id; });
    var urls = (target.urls || []).slice();
    var stash_ids = target.stash_ids || [];

    sources.forEach(function (src) {
      if (opt.tags)
        tag_ids = mergeIds(
          tag_ids,
          (src.tags || []).map(function (t) { return t.id; })
        );
      if (opt.performers)
        performer_ids = mergeIds(
          performer_ids,
          (src.performers || []).map(function (t) { return t.id; })
        );
      if (opt.galleries)
        gallery_ids = mergeIds(
          gallery_ids,
          (src.galleries || []).map(function (t) { return t.id; })
        );
      if (opt.urls) {
        (src.urls || []).forEach(function (u) {
          if (urls.indexOf(u) === -1) urls.push(u);
        });
      }
      if (opt.stash_ids)
        stash_ids = mergeStashIds(stash_ids, src.stash_ids || []);
    });

    var groups = collectMergedGroups(target, sources, opt.groups);

    var input = {
      id: target.id,
      tag_ids: tag_ids,
      performer_ids: performer_ids,
      gallery_ids: gallery_ids,
      groups: groups,
      urls: urls,
      stash_ids: stash_ids,
    };

    function hasText(v) {
      return !!String(v || "").trim();
    }
    function sceneHasStashId(s) {
      return !!((s && s.stash_ids && s.stash_ids.length) || 0);
    }
    function dateUpperBoundParts(raw) {
      if (!raw || !String(raw).trim()) return null;
      var m = String(raw).trim().match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
      if (!m) return null;
      var y = parseInt(m[1], 10);
      var mo = m[2] ? parseInt(m[2], 10) : 12;
      var d;
      if (m[3]) {
        d = parseInt(m[3], 10);
      } else {
        d = new Date(y, mo, 0).getDate();
      }
      return [y, mo, d];
    }
    function isDateBefore(a, b) {
      var pa = dateUpperBoundParts(a);
      var pb = dateUpperBoundParts(b);
      if (!pa && !pb) return false;
      if (!pa) return false;
      if (!pb) return true;
      if (pa[0] !== pb[0]) return pa[0] < pb[0];
      if (pa[1] !== pb[1]) return pa[1] < pb[1];
      return pa[2] < pb[2];
    }
    function pickSourceValue(field) {
      var candidates = sources.filter(function (s) {
        if (field === "studio") return !!(s.studio && s.studio.id);
        if (field === "cover_image") return !!sceneCoverDataUrl(s);
        return hasText(s[field]);
      });
      if (!candidates.length) return null;
      if (field === "date") {
        return candidates.reduce(function (best, cur) {
          return isDateBefore(cur.date, best.date) ? cur : best;
        }).date;
      }
      if (field === "cover_image") {
        var bestCover = candidates.reduce(function (best, cur) {
          var b = sceneResolution(best).totalPixels;
          var c = sceneResolution(cur).totalPixels;
          if (c !== b) return c > b ? cur : best;
          var bestStash = sceneHasStashId(best) ? 1 : 0;
          var curStash = sceneHasStashId(cur) ? 1 : 0;
          if (curStash !== bestStash) return curStash > bestStash ? cur : best;
          return best;
        });
        return sceneCoverDataUrl(bestCover);
      }
      var stashPreferred = candidates.find(sceneHasStashId);
      var chosen = stashPreferred || candidates[0];
      if (field === "studio") return chosen.studio.id;
      if (field === "cover_image") return sceneCoverDataUrl(chosen);
      return chosen[field];
    }

    var scalarWins = opt.scalarWins || {};
    if (scalarWins.title === "source") {
      var srcTitle = pickSourceValue("title");
      if (hasText(srcTitle)) input.title = srcTitle;
    }
    if (scalarWins.code === "source") {
      var srcCode = pickSourceValue("code");
      if (hasText(srcCode)) input.code = srcCode;
    }
    if (scalarWins.director === "source") {
      var srcDirector = pickSourceValue("director");
      if (hasText(srcDirector)) input.director = srcDirector;
    }
    if (scalarWins.details === "source") {
      var srcDetails = pickSourceValue("details");
      if (hasText(srcDetails)) input.details = srcDetails;
    }
    if (scalarWins.date === "source") {
      var srcDate = pickSourceValue("date");
      if (hasText(srcDate)) input.date = srcDate;
    }
    if (scalarWins.studio === "source") {
      var srcStudio = pickSourceValue("studio");
      if (srcStudio) input.studio_id = srcStudio;
    }
    if (scalarWins.cover_image === "source") {
      var srcCover = pickSourceValue("cover_image");
      if (hasText(srcCover)) input.cover_image = srcCover;
    }

    return input;
  }

  /**
   * Stash resolves `cover_image` URLs on the *server*. If the server cannot
   * reach its public hostname (split DNS / hairpin), fetch here in the browser
   * and send base64 data instead.
   */
  function absolutizeMediaUrl(u) {
    var s = String(u || "").trim();
    if (!s) return s;
    if (s.indexOf("/") === 0) return window.location.origin + s;
    return s;
  }

  function fetchUrlAsDataUrl(url) {
    var abs = absolutizeMediaUrl(url);
    return fetch(abs, { credentials: "include" }).then(function (res) {
      if (!res.ok)
        throw new Error("Could not load cover image (" + res.status + ")");
      return res.blob();
    }).then(function (blob) {
      return new Promise(function (resolve, reject) {
        var r = new FileReader();
        r.onload = function () {
          resolve(r.result);
        };
        r.onerror = function () {
          reject(new Error("Could not read cover image data"));
        };
        r.readAsDataURL(blob);
      });
    });
  }

  async function inlineRemoteCoverImages(input) {
    var c = input && input.cover_image;
    if (!c || typeof c !== "string") return;
    var t = c.trim();
    if (!t) return;
    if (t.toLowerCase().indexOf("data:image") === 0) return;
    if (
      t.indexOf("http://") === 0 ||
      t.indexOf("https://") === 0 ||
      t.indexOf("/") === 0
    ) {
      input.cover_image = await fetchUrlAsDataUrl(t);
    }
  }

  async function runSceneUpdate(input) {
    var mut =
      "mutation DrSceneUpdate($input: SceneUpdateInput!) { sceneUpdate(input: $input) { id } }";
    await gql(mut, { input: input });
  }

  function showModal(target, group) {
    var sources = group.filter(function (s) { return s.id !== target.id; });
    var overlay = document.createElement("div");
    overlay.id = "duplicate-resolver-modal-overlay";

    var autoId = "dr-auto-check";
    var opt = {
      tags: true,
      performers: true,
      groups: true,
      galleries: true,
      urls: true,
      stash_ids: true,
      scalarWins: {},
    };

    function hasText(v) {
      return !!String(v || "").trim();
    }
    function sceneHasStashId(s) {
      return !!((s && s.stash_ids && s.stash_ids.length) || 0);
    }
    function dateUpperBoundParts(raw) {
      if (!raw || !String(raw).trim()) return null;
      var m = String(raw).trim().match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
      if (!m) return null;
      var y = parseInt(m[1], 10);
      var mo = m[2] ? parseInt(m[2], 10) : 12;
      var d;
      if (m[3]) {
        d = parseInt(m[3], 10);
      } else {
        d = new Date(y, mo, 0).getDate();
      }
      return [y, mo, d];
    }
    function isDateBefore(a, b) {
      var pa = dateUpperBoundParts(a);
      var pb = dateUpperBoundParts(b);
      if (!pa && !pb) return false;
      if (!pa) return false;
      if (!pb) return true;
      if (pa[0] !== pb[0]) return pa[0] < pb[0];
      if (pa[1] !== pb[1]) return pa[1] < pb[1];
      return pa[2] < pb[2];
    }
    function pickSourceScene(field) {
      var candidates = sources.filter(function (s) {
        if (field === "studio") return !!(s.studio && s.studio.id);
        if (field === "cover_image") return !!sceneCoverDataUrl(s);
        return hasText(s[field]);
      });
      if (!candidates.length) return null;
      if (field === "date") {
        return candidates.reduce(function (best, cur) {
          return isDateBefore(cur.date, best.date) ? cur : best;
        });
      }
      if (field === "cover_image") {
        return candidates.reduce(function (best, cur) {
          var b = sceneResolution(best).totalPixels;
          var c = sceneResolution(cur).totalPixels;
          if (c !== b) return c > b ? cur : best;
          var bestStash = sceneHasStashId(best) ? 1 : 0;
          var curStash = sceneHasStashId(cur) ? 1 : 0;
          if (curStash !== bestStash) return curStash > bestStash ? cur : best;
          return best;
        });
      }
      var stashPreferred = candidates.find(sceneHasStashId);
      return stashPreferred || candidates[0];
    }
    function sourceValueForField(field) {
      var s = pickSourceScene(field);
      if (!s) return "";
      if (field === "studio") {
        if (s.studio && s.studio.name) return s.studio.name;
        if (s.studio && s.studio.id) return "Studio " + s.studio.id;
        return "";
      }
      if (field === "cover_image") return sceneCoverDataUrl(s);
      return String(s[field] || "").trim();
    }
    function defaultScalarWinner(field) {
      var targetHas = sceneHasStashId(target);
      var sourceHasAny = sources.some(sceneHasStashId);
      if (field === "date") {
        var targetDate = String(target.date || "").trim();
        var sourceDate = sourceValueForField("date");
        if (!targetDate && sourceDate) return "source";
        if (targetDate && sourceDate && isDateBefore(sourceDate, targetDate)) return "source";
        return "dest";
      }
      if (field === "cover_image") {
        var tc = sceneCoverDataUrl(target);
        var sc = sourceValueForField("cover_image");
        var sourceScene = pickSourceScene("cover_image");
        var sourcePixels = sourceScene ? sceneResolution(sourceScene).totalPixels : 0;
        var targetPixels = sceneResolution(target).totalPixels;
        if (sourcePixels > targetPixels) return "source";
        if (targetPixels > sourcePixels) return "dest";
        if (!tc && sc) return "source";
        if (!targetHas && sourceHasAny && sc) return "source";
        return "dest";
      }
      // For text/scalar fields (including title/details), prefer source when destination is blank.
      var targetFieldHasValue =
        field === "studio"
          ? !!(target.studio && target.studio.id)
          : hasText(target[field]);
      if (!targetFieldHasValue && hasText(sourceValueForField(field))) return "source";
      if (!targetHas && sourceHasAny && hasText(sourceValueForField(field))) return "source";
      return "dest";
    }

    function row(name, key) {
      var lab = document.createElement("label");
      lab.className = "dr-field-title";
      var toggle = choicePrepend(!!opt[key], "Toggle " + name);
      toggle.root.style.marginRight = "0.45rem";
      toggle.button.onclick = function () {
        opt[key] = !opt[key];
        toggle.button.innerHTML = opt[key]
          ? '<span class="text-success">✓</span>'
          : '<span class="text-muted">✕</span>';
        if (hint) hint.hidden = !opt[key];
      };
      lab.appendChild(toggle.root);
      lab.appendChild(document.createTextNode(name));
      var unionKeys = {
        tags: true,
        performers: true,
        groups: true,
        galleries: true,
        urls: true,
        stash_ids: true,
      };
      var hint = null;
      if (unionKeys[key]) {
        hint = document.createElement("span");
        hint.className = "dr-opt-hint";
        hint.textContent = " union all";
        hint.hidden = !opt[key];
        lab.appendChild(hint);
      }
      return lab;
    }

    var modal = document.createElement("div");
    modal.className = "dr-modal";
    modal.innerHTML =
      '<div class="modal-header dr-modal-header">' +
      '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="pencil" class="svg-inline--fa fa-pencil fa-icon" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
      '<path fill="currentColor" d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1 0 32c0 8.8 7.2 16 16 16l32 0zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>' +
      "</svg>" +
      "<span>Sync</span>" +
      "</div>";
    function textOrFallback(v, fallback) {
      return v && String(v).trim() ? String(v).trim() : fallback;
    }

    function groupLabel(g) {
      var gid = g && g.group && g.group.id != null ? String(g.group.id) : null;
      var gname = g && g.group && g.group.name ? String(g.group.name).trim() : "";
      if (gname) return gname;
      if (gid) return "Group " + gid;
      return "Group (unknown)";
    }

    function destListFor(key) {
      if (key === "tags") return (target.tags || []).map(function (t) { return t.name; });
      if (key === "performers")
        return (target.performers || []).map(function (x) { return x.name; });
      if (key === "groups")
        return (target.groups || []).map(function (g) {
          return groupLabel(g);
        });
      if (key === "galleries")
        return (target.galleries || []).map(function (g) {
          return textOrFallback(g.title, "Gallery " + g.id);
        });
      if (key === "urls") return (target.urls || []).slice();
      if (key === "stash_ids")
        return (target.stash_ids || []).map(function (s) {
          return s.endpoint + ":" + s.stash_id;
        });
      return [];
    }

    function sourceUnionFor(key) {
      var set = new Set();
      sources.forEach(function (s) {
        if (key === "tags") (s.tags || []).forEach(function (t) { set.add(t.name); });
        if (key === "performers")
          (s.performers || []).forEach(function (x) { set.add(x.name); });
        if (key === "groups")
          (s.groups || []).forEach(function (g) {
            set.add(groupLabel(g));
          });
        if (key === "galleries")
          (s.galleries || []).forEach(function (g) {
            set.add(textOrFallback(g.title, "Gallery " + g.id));
          });
        if (key === "urls") (s.urls || []).forEach(function (u) { set.add(u); });
        if (key === "stash_ids")
          (s.stash_ids || []).forEach(function (x) { set.add(x.endpoint + ":" + x.stash_id); });
      });
      return Array.from(set);
    }

    function destDisplayFor(key) {
      if (key === "stash_ids") {
        return (target.stash_ids || []).map(function (s) {
          return {
            text: s.stash_id || "",
            title: s.endpoint || "",
          };
        });
      }
      if (key !== "groups") return destListFor(key);
      return (target.groups || []).map(function (g) {
        var label = groupLabel(g);
        var idx =
          g && g.scene_index != null && String(g.scene_index).trim()
            ? String(g.scene_index)
            : "?";
        return { text: label, title: "Scene number: " + idx };
      });
    }

    function sourceUnionDisplayFor(key) {
      if (key === "stash_ids") {
        var map = new Map();
        sources.forEach(function (s) {
          (s.stash_ids || []).forEach(function (x) {
            var endpoint = x.endpoint || "";
            var stashId = x.stash_id || "";
            var k = endpoint + "\0" + stashId;
            if (!map.has(k)) {
              map.set(k, {
                text: stashId,
                title: endpoint,
              });
            }
          });
        });
        return Array.from(map.values());
      }
      if (key !== "groups") return sourceUnionFor(key);
      var byLabel = new Map();
      sources.forEach(function (s) {
        (s.groups || []).forEach(function (g) {
          var label = groupLabel(g);
          if (!byLabel.has(label)) byLabel.set(label, new Set());
          var idx =
            g && g.scene_index != null && String(g.scene_index).trim()
              ? String(g.scene_index)
              : "?";
          byLabel.get(label).add(idx);
        });
      });
      return Array.from(byLabel.entries()).map(function (entry) {
        var label = entry[0];
        var indices = Array.from(entry[1]).sort();
        return {
          text: label,
          title: "Scene number(s): " + indices.join(", "),
        };
      });
    }

    function choicePrepend(selected, title) {
      var pre = document.createElement("div");
      pre.className = "input-group-prepend";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-secondary";
      btn.title = title || "";
      btn.innerHTML = selected
        ? '<span class="text-success">✓</span>'
        : '<span class="text-muted">✕</span>';
      pre.appendChild(btn);
      return { root: pre, button: btn };
    }

    function renderListControl(values, placeholder, isReadOnly) {
      var wrap = document.createElement("div");
      wrap.className = "dr-list-control";
      var list = values || [];
      if (!list.length) list = [""];
      list.slice(0, 20).forEach(function (v) {
        var inputGroup = document.createElement("div");
        inputGroup.className = "input-group";
        var input = document.createElement("input");
        input.className = "text-input form-control";
        input.placeholder = placeholder;
        if (v && typeof v === "object") {
          input.value = v.text || "";
          if (v.title) input.title = v.title;
        } else {
          input.value = String(v || "");
        }
        input.readOnly = !!isReadOnly;
        inputGroup.appendChild(input);
        wrap.appendChild(inputGroup);
      });
      if ((values || []).length > 20) {
        var more = document.createElement("div");
        more.className = "dr-empty";
        more.textContent = "+" + (values.length - 20) + " more";
        wrap.appendChild(more);
      }
      return wrap;
    }

    function renderChipList(values, emptyText) {
      var wrap = document.createElement("div");
      wrap.className = "dr-chip-list";
      if (!values || !values.length) {
        var em = document.createElement("span");
        em.className = "dr-empty";
        em.textContent = emptyText;
        wrap.appendChild(em);
        return wrap;
      }
      values.forEach(function (v) {
        var chip = document.createElement("span");
        chip.className = "tag-item badge badge-secondary dr-chip";
        if (v && typeof v === "object") {
          chip.textContent = v.text || "";
          if (v.title) chip.title = v.title;
        } else {
          chip.textContent = String(v || "");
        }
        wrap.appendChild(chip);
      });
      return wrap;
    }

    function renderScalarInput(value, placeholder, isReadOnly, multiline) {
      if (multiline) {
        var ta = document.createElement("textarea");
        ta.className = "bg-secondary text-white border-secondary scene-description form-control";
        ta.placeholder = placeholder;
        ta.value = String(value || "");
        ta.readOnly = !!isReadOnly;
        ta.rows = 4;
        return ta;
      }
      var input = document.createElement("input");
      input.className = "bg-secondary text-white border-secondary form-control";
      input.placeholder = placeholder;
      input.value = String(value || "");
      input.readOnly = !!isReadOnly;
      return input;
    }

    function appendCoverValueToGroup(group, value, placeholder) {
      var outer = document.createElement("div");
      outer.className = "dr-cover-value flex-grow-1";
      var v = String(value || "").trim();
      var caption = placeholder || "Cover";
      if (!v) {
        var emptyPh = document.createElement("div");
        emptyPh.className = "dr-cover-placeholder";
        emptyPh.textContent = "No cover";
        outer.appendChild(emptyPh);
        var cap0 = document.createElement("div");
        cap0.className = "dr-cover-caption";
        cap0.textContent = caption;
        outer.appendChild(cap0);
      } else {
        var wrap = document.createElement("div");
        wrap.className = "dr-cover-frame";
        var img = document.createElement("img");
        img.className = "dr-cover-thumb";
        img.alt = caption;
        img.loading = "lazy";
        img.src = v;
        img.onerror = function () {
          wrap.style.display = "none";
          var capEl = outer.querySelector(".dr-cover-caption");
          if (capEl) capEl.style.display = "none";
          if (outer.querySelector("[data-dr-cover-fail]")) return;
          var fail = document.createElement("div");
          fail.className = "dr-cover-placeholder";
          fail.setAttribute("data-dr-cover-fail", "1");
          fail.textContent = "Preview unavailable";
          outer.appendChild(fail);
        };
        wrap.appendChild(img);
        outer.appendChild(wrap);
        var cap = document.createElement("div");
        cap.className = "dr-cover-caption";
        cap.textContent = caption;
        outer.appendChild(cap);
      }
      group.appendChild(outer);
    }

    function uniqueSorted(values) {
      return Array.from(new Set((values || []).map(function (v) { return String(v); }))).sort();
    }

    function setsEqual(a, b) {
      var aa = uniqueSorted(a);
      var bb = uniqueSorted(b);
      if (aa.length !== bb.length) return false;
      for (var i = 0; i < aa.length; i++) {
        if (aa[i] !== bb[i]) return false;
      }
      return true;
    }

    var compare = document.createElement("div");
    compare.className = "dr-sync-compare";
    compare.innerHTML =
      '<div class="dr-col">' +
      '<h4>Sources (data to union)</h4>' +
      "<p>" +
      sources.length +
      " scene(s): " +
      sources.map(function (s) { return s.id; }).join(", ") +
      "</p>" +
      "</div>" +
      '<div class="dr-col">' +
      '<h4>Destination (target scene)</h4>' +
      "<p>ID " +
      target.id +
      " - " +
      textOrFallback(target.title, "(no title)") +
      "</p>" +
      "</div>";
    modal.appendChild(compare);

    var opts = document.createElement("div");
    opts.className = "dr-modal-options";
    function addFieldRow(label, key, desc) {
      var sourceVals = [];
      var destVals = [];
      var sourceDisplayVals = [];
      var destDisplayVals = [];
      var isComparable =
        key === "tags" ||
        key === "performers" ||
        key === "groups" ||
        key === "galleries" ||
        key === "urls" ||
        key === "stash_ids";

      if (isComparable) {
        sourceVals = sourceUnionFor(key);
        destVals = destListFor(key);
        sourceDisplayVals = sourceUnionDisplayFor(key);
        destDisplayVals = destDisplayFor(key);
        // Suppress rows where both sides are effectively the same set.
        if (setsEqual(sourceVals, destVals)) return;
      }

      var wrapper = document.createElement("div");
      wrapper.className = "dr-field-row";
      var top = row(label, key);
      wrapper.appendChild(top);
      if (desc) {
        var d = document.createElement("div");
        d.className = "dr-field-desc";
        d.textContent = desc;
        wrapper.appendChild(d);
      }
      if (
        isComparable
      ) {
        var useChips = key === "tags" || key === "performers" || key === "groups";
        var grid = document.createElement("div");
        grid.className = "dr-field-grid";
        var left = document.createElement("div");
        left.className = "dr-field-col";
        var right = document.createElement("div");
        right.className = "dr-field-col";
        if (useChips) {
          left.appendChild(renderChipList(sourceDisplayVals, "none"));
          right.appendChild(renderChipList(destDisplayVals, "none"));
        } else {
          left.appendChild(renderListControl(sourceDisplayVals, label, true));
          right.appendChild(renderListControl(destDisplayVals, label, true));
        }
        grid.appendChild(left);
        grid.appendChild(right);
        wrapper.appendChild(grid);
      }
      opts.appendChild(wrapper);
    }
    // Scalar field preview (shown only when different/non-empty on at least one side).
    function scalarFieldRow(label, fieldKey, destValue, sourceValues) {
      var srcJoined = uniqueSorted(
        (sourceValues || []).filter(function (v) { return !!String(v || "").trim(); })
      );
      var destText = String(destValue || "").trim();
      var sourceText = srcJoined.join(" | ");
      if (!destText && !sourceText) return;
      if (sourceText && sourceText.split(" | ").indexOf(destText) !== -1 && srcJoined.length === 1) {
        return;
      }

      var wrapper = document.createElement("div");
      wrapper.className = "dr-field-row";
      var title = document.createElement("div");
      title.className = "dr-field-title";
      title.textContent = label;
      wrapper.appendChild(title);

      var grid = document.createElement("div");
      grid.className = "dr-field-grid";
      var left = document.createElement("div");
      left.className = "dr-field-col";
      var right = document.createElement("div");
      right.className = "dr-field-col";
      var leftGroup = document.createElement("div");
      leftGroup.className = "input-group";
      var rightGroup = document.createElement("div");
      rightGroup.className = "input-group";
      var leftPre = choicePrepend(false, "Use source");
      var rightPre = choicePrepend(false, "Keep destination");
      leftGroup.appendChild(leftPre.root);
      rightGroup.appendChild(rightPre.root);
      var srcValue = srcJoined.length ? srcJoined[0] : "";
      leftGroup.appendChild(
        renderScalarInput(srcValue, label, true, fieldKey === "details")
      );
      rightGroup.appendChild(
        renderScalarInput(destText, label, true, fieldKey === "details")
      );
      left.appendChild(leftGroup);
      right.appendChild(rightGroup);
      grid.appendChild(left);
      grid.appendChild(right);
      wrapper.appendChild(grid);
      var winner = defaultScalarWinner(fieldKey);
      opt.scalarWins[fieldKey] = winner;
      function setChoiceHeads() {
        var destOn = opt.scalarWins[fieldKey] === "dest";
        leftPre.button.innerHTML = !destOn
          ? '<span class="text-success">✓</span>'
          : '<span class="text-muted">✕</span>';
        rightPre.button.innerHTML = destOn
          ? '<span class="text-success">✓</span>'
          : '<span class="text-muted">✕</span>';
      }
      rightPre.button.onclick = function () {
        opt.scalarWins[fieldKey] = "dest";
        setChoiceHeads();
      };
      leftPre.button.onclick = function () {
        opt.scalarWins[fieldKey] = "source";
        setChoiceHeads();
      };
      setChoiceHeads();
      opts.appendChild(wrapper);
    }

    function coverImageFieldRow() {
      var srcJoined = uniqueSorted(
        sources
          .map(function (s) { return sceneCoverDataUrl(s); })
          .filter(function (v) { return hasText(v); })
      );
      var destText = sceneCoverDataUrl(target);
      var sourceText = srcJoined.join(" | ");
      if (!destText && !sourceText) return;
      if (
        sourceText &&
        sourceText.split(" | ").indexOf(destText) !== -1 &&
        srcJoined.length === 1
      ) {
        return;
      }

      var wrapper = document.createElement("div");
      wrapper.className = "dr-field-row";
      var titleEl = document.createElement("div");
      titleEl.className = "dr-field-title";
      titleEl.textContent = "Cover";
      wrapper.appendChild(titleEl);

      var grid = document.createElement("div");
      grid.className = "dr-field-grid";
      var left = document.createElement("div");
      left.className = "dr-field-col";
      var right = document.createElement("div");
      right.className = "dr-field-col";
      var leftGroup = document.createElement("div");
      leftGroup.className = "input-group";
      var rightGroup = document.createElement("div");
      rightGroup.className = "input-group";
      var leftPre = choicePrepend(false, "Use source cover");
      var rightPre = choicePrepend(false, "Keep destination cover");
      leftGroup.appendChild(leftPre.root);
      rightGroup.appendChild(rightPre.root);
      var bestSourceCoverScene = pickSourceScene("cover_image");
      appendCoverValueToGroup(
        leftGroup,
        bestSourceCoverScene ? sceneCoverDataUrl(bestSourceCoverScene) : (srcJoined.length ? srcJoined[0] : ""),
        sceneResolutionLabel(bestSourceCoverScene)
      );
      appendCoverValueToGroup(
        rightGroup,
        destText,
        sceneResolutionLabel(target)
      );
      left.appendChild(leftGroup);
      right.appendChild(rightGroup);
      grid.appendChild(left);
      grid.appendChild(right);
      wrapper.appendChild(grid);

      var fieldKey = "cover_image";
      var winner = defaultScalarWinner(fieldKey);
      opt.scalarWins[fieldKey] = winner;
      function setChoiceHeads() {
        var destOn = opt.scalarWins[fieldKey] === "dest";
        leftPre.button.innerHTML = !destOn
          ? '<span class="text-success">✓</span>'
          : '<span class="text-muted">✕</span>';
        rightPre.button.innerHTML = destOn
          ? '<span class="text-success">✓</span>'
          : '<span class="text-muted">✕</span>';
      }
      rightPre.button.onclick = function () {
        opt.scalarWins[fieldKey] = "dest";
        setChoiceHeads();
      };
      leftPre.button.onclick = function () {
        opt.scalarWins[fieldKey] = "source";
        setChoiceHeads();
      };
      setChoiceHeads();
      opts.appendChild(wrapper);
    }

    scalarFieldRow(
      "Title",
      "title",
      target.title,
      sources.map(function (s) { return s.title; })
    );
    scalarFieldRow(
      "Studio Code",
      "code",
      target.code,
      sources.map(function (s) { return s.code; })
    );
    addFieldRow("URLs", "urls");
    scalarFieldRow(
      "Date",
      "date",
      target.date,
      sources.map(function (s) { return s.date; })
    );
    scalarFieldRow(
      "Director",
      "director",
      target.director,
      sources.map(function (s) { return s.director; })
    );
    scalarFieldRow(
      "Studio",
      "studio",
      target.studio && (target.studio.name || ("Studio " + target.studio.id)),
      sources.map(function (s) {
        return s.studio && (s.studio.name || ("Studio " + s.studio.id));
      })
    );
    addFieldRow("Performers", "performers");
    addFieldRow("Groups", "groups");
    addFieldRow("Tags", "tags");
    scalarFieldRow(
      "Details",
      "details",
      target.details,
      sources.map(function (s) { return s.details; })
    );
    coverImageFieldRow();
    addFieldRow("Stash IDs", "stash_ids");
    addFieldRow("Galleries", "galleries");

    modal.appendChild(opts);

    var autoLab = document.createElement("label");
    var autoCb = document.createElement("input");
    autoCb.type = "checkbox";
    autoCb.id = autoId;
    autoCb.checked = state.autoCheckDefault;
    autoLab.appendChild(autoCb);
    autoLab.appendChild(
      document.createTextNode(
        " On Sync, mark source scene as duplicate."
      )
    );
    modal.appendChild(autoLab);

    var actions = document.createElement("div");
    actions.className = "dr-modal-actions";

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    var btnCancel = document.createElement("button");
    btnCancel.className = "btn btn-secondary";
    btnCancel.textContent = "Cancel";
    btnCancel.onclick = close;

    var btnOk = document.createElement("button");
    btnOk.className = "btn btn-primary";
    btnOk.textContent = "Sync";
    btnOk.onclick = async function () {
      btnOk.disabled = true;
      try {
        var input = buildSceneUpdateInput(target, sources, opt);
        await inlineRemoteCoverImages(input);
        await runSceneUpdate(input);
        if (shouldRefreshAfterSync()) {
          await refreshPlanAndDecorations();
        }
        ensureStashIdBadges();
        if (autoCb.checked) {
          var m = {};
          sources.forEach(function (s) {
            m[s.id] = true;
          });
          applyChecks(m);
        }
        close();
        notifyStashSuccess("Sync completed for scene " + target.id);
      } catch (e) {
        notifyStashError(e);
        btnOk.disabled = false;
      }
    };

    actions.appendChild(btnCancel);
    actions.appendChild(btnOk);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    overlay.addEventListener("click", function (ev) {
      if (ev.target === overlay) close();
    });
    document.body.appendChild(overlay);
  }

  function sceneByIdInVisible(sid) {
    var vis = visibleGroups(state.groups || []);
    for (var i = 0; i < vis.length; i++) {
      var g = vis[i];
      for (var j = 0; j < g.length; j++) {
        if (String(g[j].id) === String(sid)) return { group: g, scene: g[j] };
      }
    }
    return null;
  }

  function stashIdCountForScene(sceneId) {
    return stashIdsForScene(sceneId).length;
  }

  function stashIdsForScene(sceneId) {
    if (!state.groups || !sceneId) return [];
    var sid = String(sceneId);
    for (var i = 0; i < state.groups.length; i++) {
      var g = state.groups[i] || [];
      for (var j = 0; j < g.length; j++) {
        var s = g[j];
        if (String(s.id) === sid) return (s.stash_ids || []).slice();
      }
    }
    return [];
  }

  function stashEndpointToSceneBase(endpoint) {
    var e = String(endpoint || "").trim();
    if (!e) return "";
    if (/\/graphql\/?$/i.test(e)) return e.replace(/\/graphql\/?$/i, "/scenes");
    return e.replace(/\/+$/, "") + "/scenes";
  }

  function createStashIdBoxIcon() {
    // Prefer the exact icon Stash already renders (faBox) so style matches 1:1.
    var existingFaBox = document.querySelector(
      "#scene-duplicate-checker td.scene-details svg[data-icon='box']"
    );
    if (existingFaBox) {
      var cloned = existingFaBox.cloneNode(true);
      cloned.removeAttribute("width");
      cloned.removeAttribute("height");
      cloned.setAttribute("class", "dr-stashid-box-icon");
      return cloned;
    }
    // Fallback: original custom Stash-style box icon from prior script.
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("viewBox", "0 0 444.185 444.184");
    svg.setAttribute("class", "dr-stashid-box-icon");
    [
      "M404.198,205.738c-0.917-0.656-2.096-0.83-3.165-0.467c0,0-119.009,40.477-122.261,41.598 c-2.725,0.938-4.487-1.42-4.487-1.42l-37.448-46.254c-0.935-1.154-2.492-1.592-3.89-1.098c-1.396,0.494-2.332,1.816-2.332,3.299 v167.891c0,1.168,0.583,2.26,1.556,2.91c0.584,0.391,1.263,0.59,1.945,0.59c0.451,0,0.906-0.088,1.336-0.267l168.045-69.438 c1.31-0.541,2.163-1.818,2.163-3.234v-91.266C405.66,207.456,405.116,206.397,404.198,205.738z",
      "M443.487,168.221l-32.07-42.859c-0.46-0.615-1.111-1.061-1.852-1.27L223.141,71.456c-0.622-0.176-1.465-0.125-2.096,0.049 L34.62,124.141c-0.739,0.209-1.391,0.654-1.851,1.27L0.698,168.271c-0.672,0.898-0.872,2.063-0.541,3.133 c0.332,1.07,1.157,1.918,2.219,2.279l157.639,53.502c0.369,0.125,0.749,0.187,1.125,0.187c1.035,0,2.041-0.462,2.718-1.296 l44.128-54.391l13.082,3.6c0.607,0.168,1.249,0.168,1.857,0v-0.008c0.064-0.016,0.13-0.023,0.192-0.041l13.082-3.6l44.129,54.391 c0.677,0.834,1.683,1.295,2.718,1.295c0.376,0,0.756-0.061,1.125-0.186l157.639-53.502c1.062-0.361,1.887-1.209,2.219-2.279 C444.359,170.283,444.159,169.119,443.487,168.221z M222.192,160.381L88.501,123.856l133.691-37.527l133.494,37.479 L222.192,160.381z",
      "M211.238,198.147c-1.396-0.494-2.955-0.057-3.889,1.098L169.901,245.5c0,0-1.764,2.356-4.488,1.42 c-3.252-1.121-122.26-41.598-122.26-41.598c-1.07-0.363-2.248-0.189-3.165,0.467c-0.918,0.658-1.462,1.717-1.462,2.846v91.267 c0,1.416,0.854,2.692,2.163,3.233l168.044,69.438c0.43,0.178,0.885,0.266,1.336,0.266c0.684,0,1.362-0.199,1.946-0.59 c0.972-0.65,1.555-1.742,1.555-2.91V201.445C213.57,199.963,212.635,198.641,211.238,198.147z"
    ].forEach(function (d) {
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d);
      p.setAttribute("fill", "currentColor");
      svg.appendChild(p);
    });
    return svg;
  }

  function ensureStashIdBadges() {
    try {
      var root = document.getElementById(ROOT_ID);
      if (!root || !state.groups) return;
      var rows = root.querySelectorAll("table.duplicate-checker-table tbody tr");
      rows.forEach(function (tr) {
        if (tr.classList.contains("separator")) return;
        var sid = sceneIdFromRow(tr);
        if (!sid) return;
        var stashIds = stashIdsForScene(sid).filter(function (s) {
          return s && s.endpoint && s.stash_id;
        });
        var count = stashIds.length;
        var detailsTd = tr.querySelector("td.scene-details");
        if (!detailsTd) return;
        var btnGroup = detailsTd.querySelector(".btn-group");
        if (!btnGroup) return;

        var existing = detailsTd.querySelector(".dr-stashid-btn");
        if (count <= 0) {
          if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
          return;
        }
        if (!existing) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "minimal dr-stashid-btn";
          btn.setAttribute("title", "Stash IDs");
          btn.appendChild(createStashIdBoxIcon());
          var c = document.createElement("span");
          c.className = "dr-stashid-count";
          btn.appendChild(c);
          btnGroup.insertBefore(btn, btnGroup.firstChild);
          existing = btn;
        }
        var endpointList = Array.from(
          new Set(
            stashIds.map(function (s) {
              return String(s.endpoint || "").trim();
            })
          )
        ).filter(function (x) { return !!x; });
        var title = endpointList.length
          ? "Stash IDs:\n" + endpointList.join("\n")
          : "Stash IDs";
        existing.setAttribute("title", title);
        existing.classList.remove("dr-stashid-btn-link");
        existing.onclick = null;
        existing.removeAttribute("aria-label");
        if (stashIds.length === 1) {
          var single = stashIds[0];
          var sceneUrl =
            stashEndpointToSceneBase(single.endpoint) + "/" + String(single.stash_id).trim();
          existing.classList.add("dr-stashid-btn-link");
          existing.setAttribute("aria-label", "Open stash scene");
          existing.onclick = function (ev) {
            ev.preventDefault();
            window.open(sceneUrl, "_blank", "noopener,noreferrer");
          };
        }

        var countEl = existing.querySelector(".dr-stashid-count");
        if (countEl) countEl.textContent = String(count);
      });
    } catch (_e) {
      // Do not let badge rendering break duplicate checker page.
    }
  }

  function ensureToolbar() {
    var root = document.getElementById(ROOT_ID);
    if (!root) return;
    var table = root.querySelector("table.duplicate-checker-table");
    if (!table || document.getElementById("duplicate-resolver-toolbar")) return;

    var bar = document.createElement("div");
    bar.id = "duplicate-resolver-toolbar";
    bar.hidden = true;
    bar.innerHTML =
      '<div class="dr-toolbar-title">Smart Resolve</div>' +
      '<div class="dr-btn-row">' +
      '<button type="button" class="btn btn-sm btn-primary" id="dr-btn-unresolved" hidden disabled>0 Unresolved</button>' +
      '<div id="dr-processing-indicator" class="dr-processing-indicator" hidden>' +
      '<span class="dr-processing-spinner" hidden aria-hidden="true"></span>' +
      '<span class="dr-processing-bar" hidden aria-hidden="true"><span class="dr-processing-bar-fill"></span></span>' +
      '<span class="dr-processing-label">Processing…</span>' +
      "</div>" +
      '<button type="button" class="btn btn-sm btn-outline-secondary" id="dr-btn-reset" hidden>Reset</button>' +
      '<button type="button" class="btn btn-sm btn-outline-primary" id="dr-btn-apply" hidden>Auto Select</button>' +
      "</div>" +
      '<div class="dr-drawer">' +
      '<button type="button" class="btn btn-sm btn-link dr-drawer-toggle" id="dr-drawer-toggle" aria-expanded="false" hidden>' +
      "Match Details: \u25b6" +
      "</button>" +
      '<div class="dr-drawer-panel" id="dr-drawer-panel" hidden>' +
      '<div class="dr-preview" id="dr-preview-out"></div>' +
      "</div>" +
      "</div>";

    table.parentNode.insertBefore(bar, table);

    var drawerPanel = bar.querySelector("#dr-drawer-panel");
    var drawerToggle = bar.querySelector("#dr-drawer-toggle");
    drawerToggle.onclick = function () {
      var open = drawerPanel.hidden;
      drawerPanel.hidden = !open;
      drawerToggle.setAttribute("aria-expanded", open ? "true" : "false");
      drawerToggle.textContent = open ? "Match Details: \u25bc" : "Match Details: \u25b6";
    };
    function setAutoSelectVisible(show) {
      var b = bar.querySelector("#dr-btn-apply");
      if (!b) return;
      b.hidden = !show;
    }

    function setResetVisible(show) {
      var b = bar.querySelector("#dr-btn-reset");
      if (!b) return;
      b.hidden = !show;
    }

    bar.querySelector("#dr-btn-reset").onclick = async function () {
      var prev = bar.querySelector("#dr-preview-out");
      prev.textContent = "Loading…";
      state.loading = true;
      setAutoSelectVisible(false);
      updateUnresolvedButton(null, false);
      setResetVisible(true);
      try {
        await loadDuplicateGroups();
        prev.textContent =
          "Loaded " + (state.groups || []).length + " duplicate group(s).";
        state.lastPlan = buildPlan();
      } catch (e) {
        prev.textContent = "Error: " + (e.message || e);
      }
      state.loading = false;
    };

    bar.querySelector("#dr-btn-apply").onclick = async function () {
      if (!state.lastPlan || !state.lastPlan.checks) return;
      applyChecks(state.lastPlan.checks);
      renderInlineReasons(state.lastPlan);
      renderSyncRecommendations(state.lastPlan);
    };

    bar.querySelector("#dr-btn-unresolved").onclick = function () {
      goToFirstUnresolved(state.lastPlan);
    };
  }

  function ensureRowButtons() {
    var root = document.getElementById(ROOT_ID);
    if (!root || !state.groups) return;
    var table = root.querySelector("table.duplicate-checker-table");
    if (!table) return;

    var rows = table.querySelectorAll("tbody tr");
    rows.forEach(function (tr) {
      if (tr.classList.contains("separator")) return;
      var sid = sceneIdFromRow(tr);
      if (!sid) return;
      if (tr.querySelector(".duplicate-resolver-sync-btn")) return;

      var td = tr.querySelector("td:last-child");
      if (!td) return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-sm btn-secondary duplicate-resolver-sync-btn";
      btn.textContent = "Sync data";
      btn.setAttribute("data-scene-id", sid);
      btn.onclick = function () {
        if (!state.groups) {
          loadDuplicateGroups()
            .then(function () {
              var info = sceneByIdInVisible(sid);
              if (!info) {
                notifyStashWarning(
                  "Scene not in current page groups — use Reset in the log drawer or change page."
                );
                return;
              }
              showModal(info.scene, info.group);
            })
            .catch(function (e) {
              notifyStashError(e);
            });
          return;
        }
        var info = sceneByIdInVisible(sid);
        if (!info) {
          notifyStashWarning(
            "Scene not in current page groups — use Reset in the log drawer or change page."
          );
          return;
        }
        showModal(info.scene, info.group);
      };
      td.appendChild(btn);
    });
  }

  function routeMatches() {
    var p = window.location.pathname || "";
    return p === ROUTE || p.endsWith(ROUTE);
  }

  function detachObserver() {
    if (state.observer) {
      state.observer.disconnect();
      state.observer = null;
    }
    state.attachedRoot = null;
  }

  function clearRetryTimer() {
    if (state.retryTimer) {
      clearInterval(state.retryTimer);
      state.retryTimer = null;
    }
  }

  function currentPageKey() {
    var p = parseParams();
    return [p.page, p.size, p.distance, p.durationDiff].join("|");
  }

  function maybeRenderStashIdBadgesForPageChange() {
    var key = currentPageKey();
    if (state.lastBadgePageKey === key) return;
    state.lastBadgePageKey = key;
    // New page/filter context: clear stale smart-resolve UI/plan and reload groups.
    state.smartResolveUiActive = false;
    state.lastPlan = null;
    state.groups = null;
    clearInlineReasons();
    renderSyncRecommendations(null);
    setSmartResolveDetailsVisible(false, false);
    loadDuplicateGroups()
      .then(function () {
        ensureStashIdBadges();
      })
      .catch(function () {
        // Keep UI responsive even if data refresh fails transiently.
      });
  }

  function applyDomEnhancements() {
    if (state.applyingDomEnhancements) return;
    state.applyingDomEnhancements = true;
    try {
      ensureToolbar();
      placeToolbarButtonsInCoreRow();
      ensureCoreSelectSmartResolveOption();
      ensureRowButtons();
    } finally {
      state.applyingDomEnhancements = false;
    }
  }

  function attach() {
    if (!routeMatches()) {
      detachObserver();
      return;
    }
    var root = document.getElementById(ROOT_ID);
    if (!root) return false;
    if (state.attachedRoot === root && state.observer) {
      applyDomEnhancements();
      maybeRenderStashIdBadgesForPageChange();
      return true;
    }

    loadPluginSetting();

    detachObserver();
    var obs = new MutationObserver(function () {
      if (state.applyingDomEnhancements) return;
      applyDomEnhancements();
      maybeRenderStashIdBadgesForPageChange();
    });
    obs.observe(root, { childList: true, subtree: true });
    state.observer = obs;
    state.attachedRoot = root;

    applyDomEnhancements();
    loadDuplicateGroups()
      .then(function () {
        applyDomEnhancements();
        state.lastBadgePageKey = "";
        maybeRenderStashIdBadgesForPageChange();
      })
      .catch(function () {
        /* table may still load */
      });
    return true;
  }

  function scheduleAttachRetries() {
    clearRetryTimer();
    // Stash is a SPA; route content can render after plugin script executes.
    state.retryTimer = setInterval(function () {
      try {
        if (!routeMatches()) {
          detachObserver();
          return;
        }
        if (attach()) {
          clearRetryTimer();
        }
      } catch (e) {
        // Keep trying; do not permanently fail on transient render timing.
      }
    }, 500);
    // Stop background retries after a minute if route never appears.
    setTimeout(clearRetryTimer, 60000);
  }

  installStashInlineNotifyBridge();

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", function () {
      attach();
      scheduleAttachRetries();
    });
  else {
    attach();
    scheduleAttachRetries();
  }

  // Stash UI is a SPA; route changes do not reload plugin scripts.
  window.addEventListener("stash:location", function () {
    // Route changed: attempt immediate attach and keep retrying briefly.
    setTimeout(function () {
      attach();
      scheduleAttachRetries();
    }, 0);
  });
})();
