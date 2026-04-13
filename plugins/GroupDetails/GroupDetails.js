"use strict";

(function () {
  var ROOT_ID = "root";
  var ROUTE_PREFIX = "/groups";
  var PLUGIN_ID = "GroupDetails";
  var GROUP_METRICS_QUERY =
    "query GroupDetailsMetrics($id: ID!) {" +
    "  findGroup(id: $id) {" +
    "    id " +
    "    scenes { " +
    "      id " +
    "      title " +
    "      files { duration height } " +
    "      groups { group { id } scene_index } " +
    "    } " +
    "  }" +
    "}";

  var state = {
    observer: null,
    attachedRoot: null,
    retryTimer: null,
    applyingDomEnhancements: false,
    cacheByGroupId: new Map(),
    inFlightByGroupId: new Map(),
    includeAllScenes: false,
    tooltipDelegateBound: false,
  };

  async function gql(query, variables) {
    var res = await fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query, variables: variables || {} }),
    });
    var j = await res.json();
    if (j.errors && j.errors.length) {
      throw new Error(
        j.errors.map(function (e) {
          return e.message;
        }).join("; ")
      );
    }
    return j.data;
  }

  function routeMatches() {
    var p = window.location.pathname || "";
    return p === ROUTE_PREFIX || p.indexOf(ROUTE_PREFIX + "/") === 0;
  }

  function parseGroupIdFromHref(href) {
    if (!href) return null;
    var match = String(href).match(/\/groups\/(\d+)/);
    return match ? String(match[1]) : null;
  }

  function parseGroupIdFromCard(card) {
    if (!card) return null;
    var header = card.querySelector("a.group-card-header");
    if (header && header.getAttribute("href")) {
      return parseGroupIdFromHref(header.getAttribute("href"));
    }
    var firstLink = card.querySelector("a[href*='/groups/']");
    if (firstLink && firstLink.getAttribute("href")) {
      return parseGroupIdFromHref(firstLink.getAttribute("href"));
    }
    return null;
  }

  function sceneIndexForGroup(scene, groupId) {
    var groups = (scene && scene.groups) || [];
    var gid = String(groupId);
    for (var i = 0; i < groups.length; i++) {
      var g = groups[i];
      if (g && g.group && String(g.group.id) === gid) return g.scene_index;
    }
    return undefined;
  }

  function isEligibleSceneIndex(idx) {
    if (idx == null) return true;
    var n = Number(idx);
    return Number.isFinite(n) && n >= 0 && n <= 89;
  }

  function readBoolSetting(raw, fallback) {
    if (raw === true || raw === "true") return true;
    if (raw === false || raw === "false") return false;
    return fallback;
  }

  async function loadPluginSettings() {
    try {
      var data = await gql("query GdCfg { configuration { plugins } }");
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
      var next = false;
      if (cfg && typeof cfg === "object") {
        next = readBoolSetting(cfg.includeAllScenes, false);
      }
      if (next !== state.includeAllScenes) {
        state.includeAllScenes = next;
        state.cacheByGroupId.clear();
        state.inFlightByGroupId.clear();
      }
    } catch (e) {
      state.includeAllScenes = false;
    }
  }

  function metricsCacheKey(groupId) {
    return String(groupId) + ":" + (state.includeAllScenes ? "1" : "0");
  }

  function getSceneDurationSeconds(scene) {
    var files = (scene && scene.files) || [];
    var maxDur = 0;
    for (var i = 0; i < files.length; i++) {
      var dur = Number(files[i] && files[i].duration);
      if (Number.isFinite(dur) && dur > maxDur) maxDur = dur;
    }
    return maxDur;
  }

  function getSceneVerticalPixels(scene) {
    var files = (scene && scene.files) || [];
    var maxHeight = 0;
    for (var i = 0; i < files.length; i++) {
      var h = Number(files[i] && files[i].height);
      if (Number.isFinite(h) && h > maxHeight) maxHeight = h;
    }
    return maxHeight;
  }

  function formatDuration(totalSeconds) {
    var s = Math.max(0, Math.round(Number(totalSeconds) || 0));
    var hrs = Math.floor(s / 3600);
    var mins = Math.floor((s % 3600) / 60);
    var secs = s % 60;
    return hrs + ":" + String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }

  function formatSceneTooltipLine(sceneIndex, title, durationSec) {
    var idxLabel =
      sceneIndex == null || sceneIndex === "" ? "null" : String(sceneIndex);
    var t = String(title || "").replace(/\s+/g, " ").trim();
    if (!t) t = "(no title)";
    return "[" + idxLabel + "] " + t + " " + formatDuration(durationSec);
  }

  /** For ordering only: missing index sorts like 90. */
  function sceneIndexSortKey(idx) {
    if (idx == null || idx === "") return 90;
    var n = Number(idx);
    return Number.isFinite(n) ? n : 90;
  }

  function computeMetrics(groupId, scenes, includeAllScenes) {
    var totalDurationSec = 0;
    var verticalSum = 0;
    var verticalCount = 0;
    var totalFileCount = 0;
    var list = scenes || [];
    var applySceneIndexFilter =
      !includeAllScenes && list.length !== 1;
    var rows = [];

    for (var i = 0; i < list.length; i++) {
      var scene = list[i];
      var idx = sceneIndexForGroup(scene, groupId);
      if (applySceneIndexFilter && !isEligibleSceneIndex(idx)) continue;
      var duration = getSceneDurationSeconds(scene);
      rows.push({ scene: scene, idx: idx, duration: duration });
    }

    rows.sort(function (a, b) {
      var ka = sceneIndexSortKey(a.idx);
      var kb = sceneIndexSortKey(b.idx);
      if (ka !== kb) return ka - kb;
      var da = Number(a.duration) || 0;
      var db = Number(b.duration) || 0;
      if (db !== da) return db - da;
      var ida = String((a.scene && a.scene.id) || "");
      var idb = String((b.scene && b.scene.id) || "");
      return ida < idb ? -1 : ida > idb ? 1 : 0;
    });

    for (var fc = 0; fc < rows.length; fc++) {
      var filesForCount = (rows[fc].scene && rows[fc].scene.files) || [];
      totalFileCount += filesForCount.length;
    }
    var bypassDurationFilterForResolution = totalFileCount === 1;

    var durationLines = [];
    for (var j = 0; j < rows.length; j++) {
      var row = rows[j];
      var scene = row.scene;
      var idx = row.idx;
      var duration = row.duration;
      totalDurationSec += duration;
      durationLines.push(
        formatSceneTooltipLine(idx, scene && scene.title, duration)
      );

      if (bypassDurationFilterForResolution || duration > 600) {
        var height = getSceneVerticalPixels(scene);
        if (height > 0) {
          verticalSum += height;
          verticalCount += 1;
        }
      }
    }

    var durationHeader =
      "Scenes in total duration:\n";
    var durationTooltip =
      durationLines.length > 0
        ? durationHeader + durationLines.join("\n")
        : "No eligible scenes for total duration.";
    var avgPx =
      verticalCount > 0 ? Math.round(verticalSum / verticalCount) : null;
    var resolutionTooltip =
      avgPx == null || verticalCount < 1
        ? "Resolution Average: \u2014"
        : "Resolution Average: " + avgPx + "p";

    return {
      totalDurationSec: Math.round(totalDurationSec),
      averageVerticalPixels: avgPx,
      verticalSampleCount: verticalCount,
      totalFileCount: totalFileCount,
      durationTooltip: durationTooltip,
      resolutionTooltip: resolutionTooltip,
    };
  }

  var RESOLUTION_PNG_LADDER = [
    { value: 4320, label: "8k", file: "8k.png" },
    { value: 3160, label: "6k", file: "6k.png" },
    { value: 2880, label: "5k", file: "5k.png" },
    { value: 2160, label: "4k", file: "4k.png" },
    { value: 1440, label: "2k", file: "2k.png" },
    { value: 1080, label: "1080p", file: "1080p.png" },
    { value: 720, label: "720p", file: "720p.png" },
    { value: 480, label: "480p", file: "480p.png" },
    { value: 360, label: "360p", file: "360p.png" },
    { value: 240, label: "240p", file: "240p.png" },
  ];
  var LOWEST_RESOLUTION_PNG = { value: 144, label: "144p", file: "144p.png" };
  var RESOLUTION_MATCH_RATIO = 0.98; // 2% tolerance
  var LOWEST_RESOLUTION_CUTOFF = 234;

  function pickResolutionPngSpec(avgHeightPx) {
    var h = Math.round(Number(avgHeightPx) || 0);
    if (!Number.isFinite(h) || h <= 0) return null;
    if (h < LOWEST_RESOLUTION_CUTOFF) return LOWEST_RESOLUTION_PNG;
    for (var i = 0; i < RESOLUTION_PNG_LADDER.length; i++) {
      var spec = RESOLUTION_PNG_LADDER[i];
      if (h >= Math.round(spec.value * RESOLUTION_MATCH_RATIO)) return spec;
    }
    return LOWEST_RESOLUTION_PNG;
  }

  function getResolutionPngSrcCandidates(fileName) {
    return [
      "/plugin/" + PLUGIN_ID + "/assets/" + fileName,
      "/plugin/" + PLUGIN_ID + "/" + fileName,
      fileName,
    ];
  }

  function createResolutionPng(spec) {
    if (!spec || !spec.file) return null;
    var img = document.createElement("img");
    var candidates = getResolutionPngSrcCandidates(spec.file);
    var idx = 0;
    img.className = "gd-resolution-png";
    img.alt = spec.label;
    img.setAttribute("aria-hidden", "true");
    img.src = candidates[idx];
    img.addEventListener("error", function () {
      idx += 1;
      if (idx < candidates.length) img.src = candidates[idx];
    });
    return img;
  }

  function buildResolutionBucket(id, avgPixels, resolutionTooltip, totalFileCount) {
    var wrap = document.createElement("span");
    wrap.id = id;
    wrap.className = "gd-stat gd-res-bucket";
    wrap.setAttribute("role", "img");
    var tip = resolutionTooltip || "";
    var h = avgPixels == null ? NaN : Math.round(Number(avgPixels));
    if (!Number.isFinite(h) || h <= 0) {
      if ((Number(totalFileCount) || 0) > 1) {
        wrap.textContent = "\u2014";
        applySceneListTooltip(wrap, tip);
      } else {
        // No files (or only one file with no usable height): render nothing.
        wrap.textContent = "";
        applySceneListTooltip(wrap, "");
      }
      return wrap;
    }
    var spec = pickResolutionPngSpec(h);
    if (spec) {
      wrap.setAttribute("data-gd-resolution-tier", spec.label);
    }
    var img = createResolutionPng(spec);
    if (img) wrap.appendChild(img);
    else {
      var fb = document.createElement("span");
      fb.className = "gd-res-bucket-fallback";
      fb.textContent = h + "p";
      wrap.appendChild(fb);
    }
    applySceneListTooltip(wrap, tip);
    return wrap;
  }

  async function fetchMetricsForGroup(groupId) {
    var data = await gql(GROUP_METRICS_QUERY, { id: String(groupId) });
    var group = data && data.findGroup;
    return computeMetrics(
      groupId,
      (group && group.scenes) || [],
      state.includeAllScenes
    );
  }

  async function getMetricsForGroup(groupId) {
    if (!groupId) return null;
    var gid = String(groupId);
    var key = metricsCacheKey(gid);
    if (state.cacheByGroupId.has(key)) return state.cacheByGroupId.get(key);
    if (state.inFlightByGroupId.has(key)) return state.inFlightByGroupId.get(key);

    var p = fetchMetricsForGroup(gid)
      .then(function (metrics) {
        state.cacheByGroupId.set(key, metrics);
        state.inFlightByGroupId.delete(key);
        return metrics;
      })
      .catch(function (e) {
        state.inFlightByGroupId.delete(key);
        throw e;
      });
    state.inFlightByGroupId.set(key, p);
    return p;
  }

  function applySceneListTooltip(el, tip) {
    var s = tip == null ? "" : String(tip);
    if (s.length > 0) {
      el.setAttribute("data-gd-full-title", s);
      el.setAttribute("title", s);
    } else {
      el.removeAttribute("data-gd-full-title");
      el.removeAttribute("title");
    }
  }

  function ensureTooltipRefreshDelegate() {
    if (state.tooltipDelegateBound) return;
    state.tooltipDelegateBound = true;
    document.addEventListener(
      "pointerenter",
      function (ev) {
        var raw = ev.target;
        var el = raw && raw.nodeType === 1 ? raw : raw && raw.parentElement;
        if (!el || !el.closest) return;
        var host = el.closest("[data-gd-full-title]");
        if (!host) return;
        var full = host.getAttribute("data-gd-full-title");
        if (full != null) host.setAttribute("title", full);
      },
      true
    );
  }

  function buildStatNode(id, text, title) {
    var el = document.createElement("span");
    el.id = id;
    el.className = "gd-stat";
    el.textContent = text;
    applySceneListTooltip(el, title);
    return el;
  }

  function injectMetricsIntoCard(card, metrics) {
    if (!card || !metrics) return;
    var popovers = card.querySelector(".card-popovers");
    if (!popovers) return;

    var sceneCount = popovers.querySelector(".scene-count");
    if (!sceneCount) return;

    var oldRow = popovers.querySelector(".gd-metrics-row");
    if (oldRow) {
      var sc = oldRow.querySelector(".scene-count");
      if (sc) popovers.insertBefore(sc, oldRow);
      oldRow.parentNode.removeChild(oldRow);
    }
    var oldLeft = popovers.querySelector(".gd-stat-left");
    if (oldLeft && oldLeft.parentNode) oldLeft.parentNode.removeChild(oldLeft);
    var oldRight = popovers.querySelector(".gd-stat-right");
    if (oldRight && oldRight.parentNode) oldRight.parentNode.removeChild(oldRight);

    var durationNode = buildStatNode(
      "gd-stat-left-" + Date.now(),
      formatDuration(metrics.totalDurationSec),
      metrics.durationTooltip || ""
    );
    durationNode.classList.add("gd-stat-left");

    var resolutionNode = buildResolutionBucket(
      "gd-stat-right-" + Date.now(),
      metrics.averageVerticalPixels,
      metrics.resolutionTooltip || "",
      metrics.totalFileCount
    );
    resolutionNode.classList.add("gd-stat-right");

    var row = document.createElement("div");
    row.className = "gd-metrics-row";
    row.setAttribute("role", "presentation");

    var line1 = document.createElement("div");
    line1.className = "gd-metrics-line1";
    var line2 = document.createElement("div");
    line2.className = "gd-metrics-line2";

    popovers.insertBefore(row, sceneCount);
    line1.appendChild(durationNode);
    line1.appendChild(sceneCount);
    line2.appendChild(resolutionNode);
    row.appendChild(line1);
    row.appendChild(line2);
  }

  async function decorateGroupCard(card) {
    var groupId = parseGroupIdFromCard(card);
    if (!groupId) return;
    var metrics = await getMetricsForGroup(groupId);
    injectMetricsIntoCard(card, metrics);
  }

  function applyDomEnhancements() {
    if (state.applyingDomEnhancements) return;
    state.applyingDomEnhancements = true;

    var cards = Array.prototype.slice.call(
      document.querySelectorAll("div.group-card")
    );
    Promise.all(
      cards.map(function (card) {
        return decorateGroupCard(card).catch(function () {
          // Ignore per-card failures so one bad response does not block others.
        });
      })
    ).finally(function () {
      state.applyingDomEnhancements = false;
    });
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

  function attach() {
    if (!routeMatches()) {
      detachObserver();
      return false;
    }
    ensureTooltipRefreshDelegate();
    var root = document.getElementById(ROOT_ID);
    if (!root) return false;

    if (state.attachedRoot === root && state.observer) {
      loadPluginSettings()
        .then(function () {})
        .catch(function () {})
        .finally(function () {
          applyDomEnhancements();
        });
      return true;
    }

    detachObserver();
    state.cacheByGroupId.clear();
    state.inFlightByGroupId.clear();

    var obs = new MutationObserver(function () {
      applyDomEnhancements();
    });
    obs.observe(root, { childList: true, subtree: true });
    state.observer = obs;
    state.attachedRoot = root;

    loadPluginSettings()
      .then(function () {})
      .catch(function () {})
      .finally(function () {
        applyDomEnhancements();
      });
    return true;
  }

  function scheduleAttachRetries() {
    clearRetryTimer();
    state.retryTimer = setInterval(function () {
      try {
        if (!routeMatches()) {
          detachObserver();
          return;
        }
        if (attach()) clearRetryTimer();
      } catch (e) {
        // Ignore transient route/render timing errors.
      }
    }, 500);
    setTimeout(clearRetryTimer, 60000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      attach();
      scheduleAttachRetries();
    });
  } else {
    attach();
    scheduleAttachRetries();
  }

  window.addEventListener("popstate", function () {
    attach();
    scheduleAttachRetries();
  });
  window.addEventListener("hashchange", function () {
    attach();
    scheduleAttachRetries();
  });
})();
