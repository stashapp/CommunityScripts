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

  function computeMetrics(groupId, scenes, includeAllScenes) {
    var totalDurationSec = 0;
    var verticalSum = 0;
    var verticalCount = 0;
    var list = scenes || [];
    var durationLines = [];
    var resolutionLines = [];

    for (var i = 0; i < list.length; i++) {
      var scene = list[i];
      var idx = sceneIndexForGroup(scene, groupId);
      if (!includeAllScenes && !isEligibleSceneIndex(idx)) continue;

      var duration = getSceneDurationSeconds(scene);
      totalDurationSec += duration;
      durationLines.push(
        formatSceneTooltipLine(idx, scene && scene.title, duration)
      );

      if (duration > 600) {
        var height = getSceneVerticalPixels(scene);
        if (height > 0) {
          verticalSum += height;
          verticalCount += 1;
          resolutionLines.push(
            formatSceneTooltipLine(idx, scene && scene.title, duration)
          );
        }
      }
    }

    var durationTooltip =
      durationLines.length > 0
        ? durationLines.join("\n")
        : "No scenes in scope.";
    var resolutionTooltip =
      resolutionLines.length > 0
        ? resolutionLines.join("\n")
        : "No scenes over 600s with height data.";

    return {
      totalDurationSec: Math.round(totalDurationSec),
      averageVerticalPixels:
        verticalCount > 0 ? Math.round(verticalSum / verticalCount) : null,
      verticalSampleCount: verticalCount,
      durationTooltip: durationTooltip,
      resolutionTooltip: resolutionTooltip,
    };
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

  function formatVerticalPixels(avgHeight) {
    var n = Number(avgHeight);
    if (!Number.isFinite(n) || n <= 0) return "n/a";
    return String(Math.round(n)) + "p";
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

    var resolutionNode = buildStatNode(
      "gd-stat-right-" + Date.now(),
      formatVerticalPixels(metrics.averageVerticalPixels),
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
