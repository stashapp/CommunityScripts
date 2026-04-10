"use strict";

(function () {
  var ROOT_ID = "root";
  var ROUTE_PREFIX = "/groups";
  var GROUP_METRICS_QUERY =
    "query GroupDetailsMetrics($id: ID!) {" +
    "  findGroup(id: $id) {" +
    "    id " +
    "    scenes { " +
    "      id " +
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

  function computeMetrics(groupId, scenes) {
    var totalDurationSec = 0;
    var verticalSum = 0;
    var verticalCount = 0;
    var list = scenes || [];

    for (var i = 0; i < list.length; i++) {
      var scene = list[i];
      var idx = sceneIndexForGroup(scene, groupId);
      if (!isEligibleSceneIndex(idx)) continue;

      var duration = getSceneDurationSeconds(scene);
      totalDurationSec += duration;

      if (duration > 600) {
        var height = getSceneVerticalPixels(scene);
        if (height > 0) {
          verticalSum += height;
          verticalCount += 1;
        }
      }
    }

    return {
      totalDurationSec: Math.round(totalDurationSec),
      averageVerticalPixels:
        verticalCount > 0 ? Math.round(verticalSum / verticalCount) : null,
      verticalSampleCount: verticalCount,
    };
  }

  async function fetchMetricsForGroup(groupId) {
    var data = await gql(GROUP_METRICS_QUERY, { id: String(groupId) });
    var group = data && data.findGroup;
    return computeMetrics(groupId, (group && group.scenes) || []);
  }

  async function getMetricsForGroup(groupId) {
    if (!groupId) return null;
    var gid = String(groupId);
    if (state.cacheByGroupId.has(gid)) return state.cacheByGroupId.get(gid);
    if (state.inFlightByGroupId.has(gid)) return state.inFlightByGroupId.get(gid);

    var p = fetchMetricsForGroup(gid)
      .then(function (metrics) {
        state.cacheByGroupId.set(gid, metrics);
        state.inFlightByGroupId.delete(gid);
        return metrics;
      })
      .catch(function (e) {
        state.inFlightByGroupId.delete(gid);
        throw e;
      });
    state.inFlightByGroupId.set(gid, p);
    return p;
  }

  function formatDuration(totalSeconds) {
    var s = Math.max(0, Math.round(Number(totalSeconds) || 0));
    var hrs = Math.floor(s / 3600);
    var mins = Math.floor((s % 3600) / 60);
    var secs = s % 60;
    return hrs + ":" + String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }

  function formatVerticalPixels(avgHeight) {
    var n = Number(avgHeight);
    if (!Number.isFinite(n) || n <= 0) return "n/a";
    return String(Math.round(n)) + "p";
  }

  function buildStatNode(id, text, title) {
    var el = document.createElement("span");
    el.id = id;
    el.className = "gd-stat";
    el.textContent = text;
    if (title) el.title = title;
    return el;
  }

  function injectMetricsIntoCard(card, metrics) {
    if (!card || !metrics) return;
    var popovers = card.querySelector(".card-popovers");
    if (!popovers) return;

    var sceneCount = popovers.querySelector(".scene-count");
    if (!sceneCount) return;

    var oldLeft = popovers.querySelector(".gd-stat-left");
    if (oldLeft && oldLeft.parentNode) oldLeft.parentNode.removeChild(oldLeft);
    var oldRight = popovers.querySelector(".gd-stat-right");
    if (oldRight && oldRight.parentNode) oldRight.parentNode.removeChild(oldRight);

    var durationNode = buildStatNode(
      "gd-stat-left-" + Date.now(),
      formatDuration(metrics.totalDurationSec),
      "Total duration for scenes with scene_index null or 0..89"
    );
    durationNode.classList.add("gd-stat-left");

    var resolutionNode = buildStatNode(
      "gd-stat-right-" + Date.now(),
      formatVerticalPixels(metrics.averageVerticalPixels),
      "Average vertical resolution for those scenes with duration > 600s"
    );
    resolutionNode.classList.add("gd-stat-right");

    popovers.insertBefore(durationNode, sceneCount);
    if (sceneCount.nextSibling) popovers.insertBefore(resolutionNode, sceneCount.nextSibling);
    else popovers.appendChild(resolutionNode);
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
    var root = document.getElementById(ROOT_ID);
    if (!root) return false;

    if (state.attachedRoot === root && state.observer) {
      applyDomEnhancements();
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

    applyDomEnhancements();
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
