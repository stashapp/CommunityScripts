(function () {
  "use strict";

  // localStorage-backed preference profile. The dashboard reads this on
  // mount and writes it back every time the user tweaks the form. We also
  // try to read the Stash plugin setting `preferenceProfile` on cold start
  // so a value configured via Settings → Plugins → Metrics is honoured.

  const ns = (window.StashMetrics = window.StashMetrics || {});
  const KEY = "stashMetrics.preferences.v1";

  const prefs = (ns.preferences = {});

  prefs.defaults = function () {
    return {
      countries: [],
      ethnicities: [],
      eyeColors: [],
      hairColors: [],
      cupSizes: [],
      requiredTags: [],
      excludedTags: [],
      minHeightCm: null,
      maxHeightCm: null,
      minAge: null,
      maxAge: null,
      minOCount: null,
      weights: {
        country: 1.0, ethnicity: 0.8, eyeColor: 0.7, hairColor: 0.5,
        cup: 0.9, height: 0.5, age: 0.6,
        oCount: 1.2, tagOverlap: 1.0, rating: 0.3,
      },
      topMatches: 25,
    };
  };

  prefs.readLocal = function () {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  };

  prefs.writeLocal = function (profile) {
    try { window.localStorage.setItem(KEY, JSON.stringify(profile)); }
    catch (e) { /* quota — silent */ }
  };

  prefs.clearLocal = function () {
    try { window.localStorage.removeItem(KEY); } catch (e) { /* noop */ }
  };

  prefs.readPluginSetting = function () {
    try {
      const api = window.PluginApi;
      const cfg = api && api.getPluginConfig ? api.getPluginConfig("Metrics") : null;
      if (!cfg) return null;
      const raw = cfg.preferenceProfile;
      if (!raw) return null;
      if (typeof raw === "object") return raw;
      if (typeof raw === "string") {
        try { return JSON.parse(raw); } catch (e) { return null; }
      }
    } catch (e) { /* ignore */ }
    return null;
  };

  prefs.load = function () {
    const local = prefs.readLocal();
    if (local) return Object.assign(prefs.defaults(), local, {
      weights: Object.assign({}, prefs.defaults().weights, local.weights || {}),
    });
    const remote = prefs.readPluginSetting();
    if (remote) return Object.assign(prefs.defaults(), remote, {
      weights: Object.assign({}, prefs.defaults().weights, remote.weights || {}),
    });
    return prefs.defaults();
  };

  prefs.exportJson = function (profile) {
    return JSON.stringify(profile, null, 2);
  };

  prefs.importJson = function (text) {
    const obj = JSON.parse(text);
    if (!obj || typeof obj !== "object") throw new Error("expected an object");
    return Object.assign(prefs.defaults(), obj, {
      weights: Object.assign({}, prefs.defaults().weights, obj.weights || {}),
    });
  };
})();
