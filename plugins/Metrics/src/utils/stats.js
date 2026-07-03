(function () {
  "use strict";

  const ns = (window.StashMetrics = window.StashMetrics || {});
  const stats = (ns.stats = {});

  // Build {key: count} → sorted array of {label, value}, descending. Optional
  // limit takes top-N; the rest can be bucketed into "Other".
  stats.countBy = function (items, keyFn) {
    const out = new Map();
    for (const it of items) {
      const k = keyFn(it);
      if (k == null) continue;
      const keys = Array.isArray(k) ? k : [k];
      for (const kk of keys) {
        if (kk == null || kk === "") continue;
        out.set(kk, (out.get(kk) || 0) + 1);
      }
    }
    return Array.from(out, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Take top-N; the rest can be aggregated into an "Other" bucket OR
  // dropped entirely when otherLabel is the sentinel false (used to hide
  // the noisy tail in tag / country / studio charts).
  stats.topN = function (sorted, n, otherLabel) {
    if (!n || n <= 0 || sorted.length <= n) return sorted.slice();
    const top = sorted.slice(0, n);
    if (otherLabel === false) return top;
    const restSum = sorted.slice(n).reduce((s, x) => s + x.value, 0);
    if (restSum > 0) top.push({ label: otherLabel || "Other", value: restSum, _other: true });
    return top;
  };

  stats.sumBy = function (items, fn) {
    let s = 0;
    for (const it of items) {
      const v = fn(it);
      if (v != null && !isNaN(v)) s += Number(v);
    }
    return s;
  };

  stats.avg = function (items, fn) {
    let s = 0, c = 0;
    for (const it of items) {
      const v = fn ? fn(it) : it;
      if (v != null && !isNaN(v)) { s += Number(v); c++; }
    }
    return c ? s / c : null;
  };

  stats.median = function (values) {
    const v = values.filter((x) => x != null && !isNaN(x)).map(Number).sort((a, b) => a - b);
    if (!v.length) return null;
    const mid = Math.floor(v.length / 2);
    return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
  };

  // Bucketize numeric values into N equal-width bins between [min, max] (or
  // detected). Returns {labels, counts}.
  stats.histogram = function (values, opts) {
    const o = opts || {};
    const cleaned = values.filter((x) => x != null && !isNaN(x)).map(Number);
    if (!cleaned.length) return { labels: [], counts: [] };
    const min = o.min != null ? o.min : Math.min.apply(null, cleaned);
    const max = o.max != null ? o.max : Math.max.apply(null, cleaned);
    const bins = Math.max(1, o.bins || 12);
    const width = (max - min) / bins || 1;
    const counts = new Array(bins).fill(0);
    for (const v of cleaned) {
      let i = Math.floor((v - min) / width);
      if (i >= bins) i = bins - 1;
      if (i < 0) i = 0;
      counts[i]++;
    }
    const labels = [];
    const fmt = o.formatter || ((x) => Math.round(x));
    for (let i = 0; i < bins; i++) {
      labels.push(fmt(min + i * width) + "–" + fmt(min + (i + 1) * width));
    }
    return { labels, counts, min, max, width };
  };

  // Edge list of {a, b, weight} for every pair of items that co-occur in the
  // same group. Used for performer collaboration and tag co-occurrence.
  stats.coOccurrence = function (groups, idFn) {
    const edges = new Map();
    for (const g of groups) {
      const ids = (Array.isArray(g) ? g : g.items || []).map(idFn).filter(Boolean);
      const uniq = Array.from(new Set(ids)).sort();
      for (let i = 0; i < uniq.length; i++) {
        for (let j = i + 1; j < uniq.length; j++) {
          const k = uniq[i] + "|" + uniq[j];
          edges.set(k, (edges.get(k) || 0) + 1);
        }
      }
    }
    return Array.from(edges, ([k, w]) => {
      const [a, b] = k.split("|");
      return { a, b, weight: w };
    }).sort((x, y) => y.weight - x.weight);
  };

  // Pearson correlation — used by the dashboard's "physical attributes"
  // tab (e.g. height vs. scene count). Pairs with null skipped.
  stats.pearson = function (pairs) {
    const xs = [], ys = [];
    for (const [x, y] of pairs) {
      if (x != null && y != null && !isNaN(x) && !isNaN(y)) {
        xs.push(Number(x)); ys.push(Number(y));
      }
    }
    const n = xs.length;
    if (n < 2) return null;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, dx2 = 0, dy2 = 0;
    for (let i = 0; i < n; i++) {
      const dx = xs[i] - mx, dy = ys[i] - my;
      num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
    }
    if (dx2 === 0 || dy2 === 0) return null;
    return num / Math.sqrt(dx2 * dy2);
  };

  // Parse the "32-26-36" measurements field. Returns null if it doesn't match
  // the bust-waist-hips pattern. Bust may have a cup suffix.
  stats.parseMeasurements = function (s) {
    if (!s || typeof s !== "string") return null;
    const m = s.replace(/\s+/g, "").match(/^(\d{2,3})([a-zA-Z]+)?-(\d{2,3})-(\d{2,3})$/);
    if (!m) return null;
    return { bust: +m[1], cup: m[2] || null, waist: +m[3], hips: +m[4] };
  };

  // Country code → flag emoji. Stash stores ISO 3166-1 alpha-2 codes.
  stats.countryFlag = function (cc) {
    if (!cc || cc.length !== 2) return "";
    const A = 0x1F1E6;
    return String.fromCodePoint(A + cc.toUpperCase().charCodeAt(0) - 65) +
           String.fromCodePoint(A + cc.toUpperCase().charCodeAt(1) - 65);
  };

  stats.groupBy = function (items, keyFn) {
    const out = new Map();
    for (const it of items) {
      const k = keyFn(it);
      if (k == null) continue;
      if (!out.has(k)) out.set(k, []);
      out.get(k).push(it);
    }
    return out;
  };
})();
