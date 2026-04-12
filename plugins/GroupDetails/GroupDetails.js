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

      if (duration > 600) {
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
        ? "Resolution average: \u2014"
        : "Resolution average: " + avgPx + "p";

    return {
      totalDurationSec: Math.round(totalDurationSec),
      averageVerticalPixels: avgPx,
      verticalSampleCount: verticalCount,
      durationTooltip: durationTooltip,
      resolutionTooltip: resolutionTooltip,
    };
  }

  function resolutionBucketTier(avgHeightPx) {
    var h = Math.round(Number(avgHeightPx) || 0);
    if (h <= 0) return -1;
    if (h < 480) return 0;
    if (h < 720) return 1;
    if (h <= 1081) return 2;
    return 3;
  }

  // Inlined svgPathData from @fortawesome/free-solid-svg-icons@6.5.2 so each
  // bucket always gets a distinct glyph. Stash’s PluginApi FA exports are
  // incomplete (tree-shaken), which made every tier fall through to the same
  // fallback. Pro-only names (SD/HD/4K rectangle) are not bundled in Free.
  // Tier order: display, film, gauge-high (HD-ish), maximize. Deliberately not
  // using faExpand for HD: same bucket (e.g. 1080p) correctly reuses one icon,
  // but expand reads like “fullscreen” and is often confused with a bug.
  var BUNDLED_RESOLUTION_ICONS = [
    {
      w: 576,
      h: 512,
      d:
        "M64 0C28.7 0 0 28.7 0 64V352c0 35.3 28.7 64 64 64H240l-10.7 32H160c-17.7 0-32 14.3-32 32s14.3 32 32 32H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H346.7L336 416H512c35.3 0 64-28.7 64-64V64c0-35.3-28.7-64-64-64H64zM512 64V352H64V64H512z",
    },
    {
      w: 512,
      h: 512,
      d:
        "M0 96C0 60.7 28.7 32 64 32H448c35.3 0 64 28.7 64 64V416c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V96zM48 368v32c0 8.8 7.2 16 16 16H96c8.8 0 16-7.2 16-16V368c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16zm368-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V368c0-8.8-7.2-16-16-16H416zM48 240v32c0 8.8 7.2 16 16 16H96c8.8 0 16-7.2 16-16V240c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16zm368-16c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V240c0-8.8-7.2-16-16-16H416zM48 112v32c0 8.8 7.2 16 16 16H96c8.8 0 16-7.2 16-16V112c0-8.8-7.2-16-16-16H64c-8.8 0-16 7.2-16 16zM416 96c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16V112c0-8.8-7.2-16-16-16H416zM160 128v64c0 17.7 14.3 32 32 32H320c17.7 0 32-14.3 32-32V128c0-17.7-14.3-32-32-32H192c-17.7 0-32 14.3-32 32zm32 160c-17.7 0-32 14.3-32 32v64c0 17.7 14.3 32 32 32H320c17.7 0 32-14.3 32-32V320c0-17.7-14.3-32-32-32H192z",
    },
    {
      w: 512,
      h: 512,
      d:
        "M0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM288 96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM256 416c35.3 0 64-28.7 64-64c0-17.4-6.9-33.1-18.1-44.6L366 161.7c5.3-12.1-.2-26.3-12.3-31.6s-26.3 .2-31.6 12.3L257.9 288c-.6 0-1.3 0-1.9 0c-35.3 0-64 28.7-64 64s28.7 64 64 64zM176 144a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM96 288a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm352-32a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z",
    },
    {
      w: 512,
      h: 512,
      d:
        "M200 32H56C42.7 32 32 42.7 32 56V200c0 9.7 5.8 18.5 14.8 22.2s19.3 1.7 26.2-5.2l40-40 79 79-79 79L73 295c-6.9-6.9-17.2-8.9-26.2-5.2S32 302.3 32 312V456c0 13.3 10.7 24 24 24H200c9.7 0 18.5-5.8 22.2-14.8s1.7-19.3-5.2-26.2l-40-40 79-79 79 79-40 40c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8H456c13.3 0 24-10.7 24-24V312c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2l-40 40-79-79 79-79 40 40c6.9 6.9 17.2 8.9 26.2 5.2s14.8-12.5 14.8-22.2V56c0-13.3-10.7-24-24-24H312c-9.7 0-18.5 5.8-22.2 14.8s-1.7 19.3 5.2 26.2l40 40-79 79-79-79 40-40c6.9-6.9 8.9-17.2 5.2-26.2S209.7 32 200 32z",
    },
  ];

  function createResolutionTierSvg(tier) {
    var b = BUNDLED_RESOLUTION_ICONS[tier];
    if (!b || typeof b.d !== "string") return null;
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + b.w + " " + b.h);
    svg.setAttribute("class", "fa-icon gd-resolution-fa");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS(NS, "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("d", b.d);
    svg.appendChild(path);
    return svg;
  }

  function buildResolutionBucket(id, avgPixels, resolutionTooltip) {
    var wrap = document.createElement("span");
    wrap.id = id;
    wrap.className = "gd-stat gd-res-bucket";
    wrap.setAttribute("role", "img");
    var tip = resolutionTooltip || "";
    var h = avgPixels == null ? NaN : Math.round(Number(avgPixels));
    if (!Number.isFinite(h) || h <= 0) {
      wrap.textContent = "\u2014";
      applySceneListTooltip(wrap, tip);
      return wrap;
    }
    var tier = resolutionBucketTier(h);
    wrap.setAttribute("data-gd-resolution-tier", String(tier));
    var svg = createResolutionTierSvg(tier);
    if (svg) wrap.appendChild(svg);
    else {
      var fb = document.createElement("span");
      fb.className = "gd-res-bucket-fallback";
      fb.textContent = ["<480", "SD", "HD", "4K"][tier] || "?";
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
      metrics.resolutionTooltip || ""
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
