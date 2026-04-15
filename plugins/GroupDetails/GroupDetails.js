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
    "      performers { id name image_path } " +
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
    includePerformers: false,
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
      var nextPerformers = false;
      if (cfg && typeof cfg === "object") {
        next = readBoolSetting(cfg.includeAllScenes, false);
        nextPerformers = readBoolSetting(cfg.includePerformers, false);
      }
      if (
        next !== state.includeAllScenes ||
        nextPerformers !== state.includePerformers
      ) {
        state.includeAllScenes = next;
        state.includePerformers = nextPerformers;
        state.cacheByGroupId.clear();
        state.inFlightByGroupId.clear();
      }
    } catch (e) {
      state.includeAllScenes = false;
      state.includePerformers = false;
    }
  }

  function metricsCacheKey(groupId) {
    return (
      String(groupId) +
      ":" +
      (state.includeAllScenes ? "1" : "0") +
      ":" +
      (state.includePerformers ? "1" : "0")
    );
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
    var t = String(title || "").replace(/\s+/g, " ").trim();
    if (!t) t = "(no title)";
    var hasIndex = !(sceneIndex == null || sceneIndex === "");
    if (hasIndex) return String(sceneIndex) + ". " + t + " " + formatDuration(durationSec);
    return t + " " + formatDuration(durationSec);
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
    var performerById = new Map();
    for (var j = 0; j < rows.length; j++) {
      var row = rows[j];
      var scene = row.scene;
      var idx = row.idx;
      var duration = row.duration;
      totalDurationSec += duration;
      durationLines.push(
        formatSceneTooltipLine(idx, scene && scene.title, duration)
      );

      if (bypassDurationFilterForResolution || duration > 360) {
        var height = getSceneVerticalPixels(scene);
        if (height > 0) {
          verticalSum += height;
          verticalCount += 1;
        }
      }

      var perfs = (scene && scene.performers) || [];
      for (var p = 0; p < perfs.length; p++) {
        var perf = perfs[p];
        if (!perf) continue;
        var pid = String(perf.id || perf.name || "");
        if (!pid) continue;
        if (!performerById.has(pid)) {
          performerById.set(pid, {
            id: String(perf.id || ""),
            name: String(perf.name || "").trim() || "(unknown performer)",
            imagePath: String(perf.image_path || ""),
          });
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
      performers: Array.from(performerById.values()).sort(function (a, b) {
        return a.name.localeCompare(b.name);
      }),
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

  function getEmbeddedResolutionImage(fileName) {
    var map =
      typeof window !== "undefined" && window.GroupDetailsImages
        ? window.GroupDetailsImages
        : null;
    if (!map) return "";
    var key = String(fileName || "");
    var uri = map[key];
    return typeof uri === "string" ? uri : "";
  }

  function createResolutionPng(spec) {
    if (!spec || !spec.file) return null;
    var src = getEmbeddedResolutionImage(spec.file);
    if (!src) return null;
    var img = document.createElement("img");
    img.className = "gd-resolution-png";
    img.alt = spec.label;
    img.setAttribute("aria-hidden", "true");
    img.src = src;
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

  function normalizePerformerImageUrl(path) {
    var p = String(path || "");
    if (!p) return "";
    if (/^https?:\/\//i.test(p)) return p;
    if (p.indexOf("/") === 0) return p;
    return "/" + p;
  }

  function buildPerformerChip(id, performers) {
    var list = Array.isArray(performers) ? performers : [];
    if (list.length === 0) return null;

    var wrap = document.createElement("span");
    wrap.id = id;
    wrap.className = "gd-performer-count performer-count";
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", "Performers: " + list.length);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "minimal btn btn-primary";
    btn.tabIndex = -1;
    btn.setAttribute("aria-hidden", "true");

    var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    icon.setAttribute("data-prefix", "fas");
    icon.setAttribute("data-icon", "user");
    icon.setAttribute("class", "svg-inline--fa fa-user fa-icon");
    icon.setAttribute("role", "img");
    icon.setAttribute("viewBox", "0 0 448 512");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"
    );
    path.setAttribute("fill", "currentColor");
    icon.appendChild(path);

    var count = document.createElement("span");
    count.textContent = String(list.length);

    btn.appendChild(icon);
    btn.appendChild(count);
    wrap.appendChild(btn);

    var pop = document.createElement("div");
    pop.className = "gd-performer-popover";
    for (var i = 0; i < list.length; i++) {
      var perf = list[i];
      var item = document.createElement("div");
      item.className = "gd-performer-item";
      var img = document.createElement("img");
      img.className = "gd-performer-image";
      img.alt = perf.name;
      var src = normalizePerformerImageUrl(perf.imagePath);
      if (src) img.src = src;
      else img.style.display = "none";
      var name = document.createElement("div");
      name.className = "gd-performer-name";
      name.textContent = perf.name;
      item.appendChild(img);
      item.appendChild(name);
      pop.appendChild(item);
    }
    wrap.appendChild(pop);
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

  function findDateLineInCard(card) {
    if (!card || !card.querySelectorAll) return null;
    var re = /^\d{4}-\d{2}-\d{2}$/;
    var nodes = card.querySelectorAll("time, small, span, div, p");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el || !el.textContent) continue;
      if (el.closest && el.closest(".card-popovers")) continue;
      if (el.querySelector && el.querySelector(".gd-date-duration")) continue;
      var raw = String(el.textContent || "").trim();
      if (re.test(raw)) return el;
    }
    return null;
  }

  function mountDurationOnDateLine(card, durationNode) {
    if (!card || !durationNode) return false;
    var old = card.querySelectorAll(".gd-date-duration");
    for (var i = 0; i < old.length; i++) {
      if (old[i] && old[i].parentNode) old[i].parentNode.removeChild(old[i]);
    }
    var line = findDateLineInCard(card);
    if (!line) return false;

    line.classList.add("gd-date-line");
    var textSpan = line.querySelector(".gd-date-text");
    if (!textSpan) {
      var original = String(line.textContent || "").trim();
      line.textContent = "";
      textSpan = document.createElement("span");
      textSpan.className = "gd-date-text";
      textSpan.textContent = original;
      line.appendChild(textSpan);
    }
    durationNode.classList.add("gd-date-duration");
    line.appendChild(durationNode);
    return true;
  }

  function injectMetricsIntoCard(card, metrics) {
    if (!card || !metrics) return;
    var popovers = card.querySelector(".card-popovers");
    if (!popovers) return;
    var sceneCount = popovers.querySelector(".scene-count");
    if (!sceneCount) return;

    var oldRow = popovers.querySelector(".gd-metrics-row");
    if (oldRow && oldRow.parentNode) oldRow.parentNode.removeChild(oldRow);
    var oldRight = popovers.querySelector(".gd-stat-right");
    if (oldRight && oldRight.parentNode) oldRight.parentNode.removeChild(oldRight);
    var oldPerf = popovers.querySelector(".gd-performer-count");
    if (oldPerf && oldPerf.parentNode) oldPerf.parentNode.removeChild(oldPerf);

    var durationNode = buildStatNode(
      "gd-stat-duration-" + Date.now(),
      formatDuration(metrics.totalDurationSec),
      metrics.durationTooltip || ""
    );
    durationNode.classList.add("gd-duration");

    var resolutionNode = buildResolutionBucket(
      "gd-stat-right-" + Date.now(),
      metrics.averageVerticalPixels,
      metrics.resolutionTooltip || "",
      metrics.totalFileCount
    );
    resolutionNode.classList.add("gd-stat-right");
    resolutionNode.classList.add("chip");
    if (state.includePerformers) {
      var performerNode = buildPerformerChip(
        "gd-performer-" + Date.now(),
        metrics.performers
      );
      if (performerNode) popovers.appendChild(performerNode);
    }
    popovers.appendChild(resolutionNode);

    mountDurationOnDateLine(card, durationNode);
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
