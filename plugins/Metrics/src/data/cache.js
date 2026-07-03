(function () {
  "use strict";

  const ns = (window.StashMetrics = window.StashMetrics || {});
  const cache = (ns.cache = {});

  const KEY = "stashMetrics.cache.v1";

  // localStorage-backed cache. The Node backend writes a richer cache to
  // disk at <plugin>/cache/metrics.json which the dashboard prefers; this
  // is a UI fallback used when the backend hasn't been run yet or the
  // user's browser can't reach the plugin asset endpoint.
  cache.read = function () {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.computedAt) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  };

  cache.write = function (payload) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(payload));
    } catch (e) {
      // Quota errors are silent — the cache is an optimisation, not a
      // requirement.
    }
  };

  cache.clear = function () {
    try { window.localStorage.removeItem(KEY); } catch (e) { /* noop */ }
  };

  cache.isFresh = function (entry, ttlMinutes) {
    if (!entry || !entry.computedAt) return false;
    const age = Date.now() - new Date(entry.computedAt).getTime();
    return age <= ttlMinutes * 60 * 1000;
  };

  // Fetch the backend-generated cache. Stash's plugin schema only serves
  // files declared in ui.javascript / ui.css, so the backend writes the
  // cache as a JS file (`assets/metrics-cache.js`) that assigns the
  // payload to `window.__STASH_METRICS_CACHE__`. That file is in the
  // manifest's ui.javascript list, so Stash bundles it into
  // /plugin/Metrics/javascript and it's available at page load.
  //
  // If the global is set → use it. Otherwise, fall back to trying the
  // static-file paths (for older manifests) and finally return null so
  // the dashboard drops through to live GraphQL.
  cache.fetchBackendCache = async function () {
    if (window.__STASH_METRICS_CACHE__ && window.__STASH_METRICS_CACHE__.computedAt) {
      return window.__STASH_METRICS_CACHE__;
    }
    const candidates = [
      "/plugin/Metrics/assets/metrics-cache.json",
      "/plugin/metrics/assets/metrics-cache.json",
      "/plugin/plugin/assets/metrics-cache.json",
      "/plugin/stashappgraph-/assets/metrics-cache.json",
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          if (json && json.computedAt) return json;
        }
      } catch (e) { /* try next */ }
    }
    return null;
  };
})();
