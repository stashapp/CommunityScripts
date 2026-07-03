"use strict";

/* Performer clustering. Produces:
 *
 *   - clusters: [{ id, label, size, members, centroid, prominentAttrs }]
 *       k clusters (default 6). label is a human-readable summary derived
 *       from the centroid's strongest features.
 *   - similarity.byPerformer: Map of performerId → [{id, name, score, ...}]
 *       Cosine-similarity ranked "similar to me" list, top-N per performer.
 *   - archetypeNames: short symbolic labels (e.g. "Latin · Brunette · Curvy")
 *
 * The feature space is a normalised numeric vector per performer:
 *
 *   numeric (z-scored to [0..1] across the population):
 *     cupOrdinal, heightCm, age, avgSceneO, rating100
 *
 *   one-hot for the top-K most common values of:
 *     country, ethnicity, eyeColor, hairColor
 *
 *   binary for the top-T global tags (where the performer has played in any
 *     scene tagged with that tag)
 *
 * Algorithm: Lloyd's k-means with k-means++ seeding. Distance is squared
 * Euclidean over the normalised vectors. Converges quickly (~30 iterations)
 * for our typical dimensions (60–120) and population (1k–10k performers).
 */

const { enrichPerformers } = require("./correlations");

function topKValues(rows, attr, k) {
  const counts = new Map();
  for (const r of rows) {
    const v = r[attr];
    if (v == null || v === "") continue;
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, k).map(([v]) => v);
}

function topGlobalTags(scenes, k) {
  const counts = new Map();
  for (const s of scenes) for (const t of s.tags || []) counts.set(t.name, (counts.get(t.name) || 0) + 1);
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, k).map(([v]) => v);
}

function tagsByPerformer(scenes) {
  const out = new Map();
  for (const s of scenes) {
    const tags = (s.tags || []).map((t) => t.name);
    for (const p of s.performers || []) {
      const set = out.get(p.id) || new Set();
      for (const t of tags) set.add(t);
      out.set(p.id, set);
    }
  }
  return out;
}

function buildFeatureSpace(performers, scenes, opts) {
  opts = opts || {};
  const enriched = enrichPerformers(performers, scenes);
  const tagSetByPerf = tagsByPerformer(scenes);
  for (const e of enriched) e.tagSet = tagSetByPerf.get(e.id) || new Set();

  const numericKeys = ["cupOrdinal", "heightCm", "age", "avgSceneO", "rating100"];
  const numericRanges = {};
  for (const k of numericKeys) {
    const vs = enriched.map((e) => e[k]).filter((x) => x != null && !isNaN(x));
    if (!vs.length) { numericRanges[k] = { min: 0, max: 1 }; continue; }
    const min = Math.min.apply(null, vs);
    const max = Math.max.apply(null, vs);
    numericRanges[k] = { min, max: max === min ? min + 1 : max };
  }

  const topCountries = topKValues(enriched, "country", opts.topCountries || 20);
  const topEthnicities = topKValues(enriched, "ethnicity", opts.topEthnicities || 10);
  const topEyeColors = topKValues(enriched, "eyeColor", opts.topEyeColors || 8);
  const topHairColors = topKValues(enriched, "hairColor", opts.topHairColors || 8);
  const topTags = topGlobalTags(scenes, opts.topTags || 20);

  const features = [];
  for (const k of numericKeys) features.push({ kind: "num", key: k });
  for (const v of topCountries) features.push({ kind: "cat", attr: "country", value: v });
  for (const v of topEthnicities) features.push({ kind: "cat", attr: "ethnicity", value: v });
  for (const v of topEyeColors) features.push({ kind: "cat", attr: "eyeColor", value: v });
  for (const v of topHairColors) features.push({ kind: "cat", attr: "hairColor", value: v });
  for (const v of topTags) features.push({ kind: "tag", value: v });

  function vectorise(e) {
    const v = new Array(features.length).fill(0);
    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      if (f.kind === "num") {
        const x = e[f.key];
        if (x == null || isNaN(x)) { v[i] = 0; continue; }
        const { min, max } = numericRanges[f.key];
        v[i] = (x - min) / (max - min);
      } else if (f.kind === "cat") {
        v[i] = e[f.attr] === f.value ? 1 : 0;
      } else if (f.kind === "tag") {
        v[i] = e.tagSet.has(f.value) ? 1 : 0;
      }
    }
    return v;
  }

  const vectors = enriched.map(vectorise);
  return { enriched, features, vectors, numericRanges };
}

function squaredDistance(a, b) {
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    const dx = a[i] - b[i];
    d += dx * dx;
  }
  return d;
}

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

// Deterministic PRNG seeded off the input length so test runs are stable.
function seededRng(seed) {
  let s = seed >>> 0 || 0x9E3779B1;
  return function () {
    s = Math.imul(s ^ (s >>> 15), 0x9E3779B1);
    s ^= s >>> 13;
    s = Math.imul(s, 0x85EBCA6B);
    s ^= s >>> 16;
    return ((s >>> 0) % 0xFFFF) / 0xFFFF;
  };
}

function kmeansPlusPlusSeed(vectors, k, rng) {
  const n = vectors.length;
  if (k >= n) return vectors.slice();
  const firstIdx = Math.floor(rng() * n);
  const centroids = [vectors[firstIdx].slice()];
  const dist2 = new Array(n).fill(Infinity);
  while (centroids.length < k) {
    const last = centroids[centroids.length - 1];
    let totalD = 0;
    for (let i = 0; i < n; i++) {
      const d = squaredDistance(vectors[i], last);
      if (d < dist2[i]) dist2[i] = d;
      totalD += dist2[i];
    }
    let r = rng() * totalD, chosen = 0;
    for (let i = 0; i < n; i++) {
      r -= dist2[i];
      if (r <= 0) { chosen = i; break; }
    }
    centroids.push(vectors[chosen].slice());
  }
  return centroids;
}

function kmeans(vectors, k, opts) {
  opts = opts || {};
  const maxIter = opts.maxIter || 80;
  const rng = seededRng(opts.seed || (vectors.length * 1103515245 + 12345));
  const n = vectors.length;
  if (!n) return { labels: [], centroids: [], inertia: 0 };
  const effectiveK = Math.max(1, Math.min(k, n));
  let centroids = kmeansPlusPlusSeed(vectors, effectiveK, rng);
  let labels = new Array(n).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = 0;
    for (let i = 0; i < n; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = squaredDistance(vectors[i], centroids[c]);
        if (d < bestD) { bestD = d; best = c; }
      }
      if (labels[i] !== best) { labels[i] = best; changed++; }
    }
    const newCentroids = Array.from({ length: centroids.length }, () => null);
    const counts = new Array(centroids.length).fill(0);
    const dim = vectors[0].length;
    for (let c = 0; c < centroids.length; c++) newCentroids[c] = new Array(dim).fill(0);
    for (let i = 0; i < n; i++) {
      const c = labels[i];
      counts[c]++;
      for (let j = 0; j < dim; j++) newCentroids[c][j] += vectors[i][j];
    }
    for (let c = 0; c < centroids.length; c++) {
      if (counts[c] === 0) {
        // Empty cluster — re-seed from a random vector to avoid collapse.
        newCentroids[c] = vectors[Math.floor(rng() * n)].slice();
        continue;
      }
      for (let j = 0; j < dim; j++) newCentroids[c][j] /= counts[c];
    }
    centroids = newCentroids;
    if (!changed) break;
  }
  let inertia = 0;
  for (let i = 0; i < n; i++) inertia += squaredDistance(vectors[i], centroids[labels[i]]);
  return { labels, centroids, inertia };
}

function clusterLabel(centroid, features) {
  // Build a short summary by picking the top categorical feature per axis.
  const pickedByAttr = {};
  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    if (f.kind !== "cat") continue;
    const cur = pickedByAttr[f.attr];
    if (!cur || centroid[i] > cur.weight) pickedByAttr[f.attr] = { value: f.value, weight: centroid[i] };
  }
  const tagPicks = [];
  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    if (f.kind !== "tag") continue;
    tagPicks.push({ value: f.value, weight: centroid[i] });
  }
  tagPicks.sort((a, b) => b.weight - a.weight);
  const top = ["country", "ethnicity", "eyeColor", "hairColor"]
    .map((a) => pickedByAttr[a])
    .filter((p) => p && p.weight > 0.25)
    .map((p) => p.value)
    .slice(0, 2);
  const topTags = tagPicks.filter((t) => t.weight > 0.3).slice(0, 2).map((t) => t.value);
  return [...top, ...topTags].join(" · ") || "Mixed";
}

function prominentAttrs(centroid, features, topN) {
  const items = features.map((f, i) => ({
    key: f.kind === "num" ? f.key : (f.attr || "tag") + ":" + f.value,
    weight: centroid[i],
  }));
  items.sort((a, b) => b.weight - a.weight);
  return items.slice(0, topN || 6);
}

function computeArchetypes(performers, scenes, opts) {
  opts = opts || {};
  const k = Math.max(2, Math.min(12, opts.k || 6));
  const space = buildFeatureSpace(performers, scenes, opts);
  if (!space.vectors.length) {
    return { clusters: [], features: [], similarity: {}, k };
  }
  const { labels, centroids, inertia } = kmeans(space.vectors, k, { maxIter: 80, seed: opts.seed });
  const clusters = centroids.map((centroid, ci) => {
    const memberIdx = labels.map((l, i) => l === ci ? i : -1).filter((i) => i >= 0);
    const members = memberIdx
      .map((i) => ({
        id: space.enriched[i].id,
        name: space.enriched[i].name,
        country: space.enriched[i].country,
        ethnicity: space.enriched[i].ethnicity,
        cupLetter: space.enriched[i].cupLetter,
        rating100: space.enriched[i].rating100,
        avgSceneO: space.enriched[i].avgSceneO,
        sceneCount: space.enriched[i].sceneCount,
        // Distance to centroid so the most representative members can be
        // surfaced.
        distance: Math.sqrt(squaredDistance(space.vectors[i], centroid)),
      }))
      .sort((a, b) => a.distance - b.distance);
    return {
      id: ci,
      label: clusterLabel(centroid, space.features),
      size: members.length,
      members,
      centroid,
      prominentAttrs: prominentAttrs(centroid, space.features, 6),
    };
  });

  // Similar-performer lookup. For every performer, compute cosine
  // similarity against every other and keep the top N. O(n²) — fine for
  // 1000 performers; we cap at 5000 to avoid catastrophic costs.
  const cap = Math.min(space.vectors.length, opts.similarityCap || 5000);
  const topSim = Math.min(15, opts.topSimilar || 10);
  const similarity = {};
  for (let i = 0; i < cap; i++) {
    const candidates = [];
    for (let j = 0; j < space.vectors.length; j++) {
      if (i === j) continue;
      const s = cosineSim(space.vectors[i], space.vectors[j]);
      if (s <= 0) continue;
      candidates.push({ idx: j, score: s });
    }
    candidates.sort((a, b) => b.score - a.score);
    similarity[space.enriched[i].id] = candidates.slice(0, topSim).map((c) => ({
      id: space.enriched[c.idx].id,
      name: space.enriched[c.idx].name,
      country: space.enriched[c.idx].country,
      ethnicity: space.enriched[c.idx].ethnicity,
      cupLetter: space.enriched[c.idx].cupLetter,
      avgSceneO: space.enriched[c.idx].avgSceneO,
      sceneCount: space.enriched[c.idx].sceneCount,
      score: +c.score.toFixed(3),
    }));
  }

  return {
    k, inertia, features: space.features.length,
    clusters: clusters.sort((a, b) => b.size - a.size),
    similarity,
  };
}

module.exports = {
  computeArchetypes,
  buildFeatureSpace,
  kmeans,
  cosineSim,
  squaredDistance,
};
