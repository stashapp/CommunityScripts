"use strict";

/* Correlations between performer/scene attributes and the O-count signal.
 *
 * We avoid statistical claims we can't defend on small libraries: every
 * aggregate respects a `minSupport` floor (default 3) so a single
 * 50-O-count outlier in a one-performer bucket doesn't dominate the
 * heatmap.
 *
 * Surfaced metrics:
 *
 *   - perAttribute: {attr → [{value, n, avgPerformerO, avgSceneO,
 *                              shareHighO, totalO}]}
 *       Where "high O" is a scene with o_counter ≥ highOThreshold (default 2).
 *
 *   - cramersV: {attrPair → V}  Cramér's V over [attr × oBucket] contingency
 *       table. 0..1; higher = stronger non-linear association.
 *
 *   - pearsonOrdinal: {attr → r}  Pearson correlation between an ordinal
 *       encoding of the attribute (cup A→1, B→2, …) and o-count. Only
 *       defined for attributes we can reasonably order.
 *
 *   - heatmaps:
 *       countryEye:   country × eye color cells, value = avg scene o-count
 *       countryCup:   country × cup            cells, value = avg performer o
 *       ethnicityCup: ethnicity × cup          cells, value = avg performer o
 *       ageCup:       age bucket × cup         cells, value = avg performer o
 *
 *   - bubbles: per-performer points {x=cupOrdinal, y=avgSceneO, r=sceneCount,
 *       country, eyeColor, name, id} for the bubble chart.
 *
 *   - parallel: per-performer encoded axes [country, eye, cup, height, age,
 *       o-count] normalised to 0..1 so the parallel-coordinates SVG renderer
 *       can draw lines directly. */

const CUP_ORDER = "AABBBCDDDDEEFFFGGGGHIJK".split("").filter((c, i, a) => a.indexOf(c) === i);
const CUP_INDEX = new Map(CUP_ORDER.map((c, i) => [c, i + 1]));

function parseCupOrdinal(measurements) {
  if (!measurements || typeof measurements !== "string") return null;
  const m = measurements.replace(/\s+/g, "").match(/^(\d{2,3})([a-zA-Z]+)?-(\d{2,3})-(\d{2,3})$/);
  if (!m || !m[2]) return null;
  const letter = m[2].toUpperCase()[0];
  return CUP_INDEX.get(letter) || null;
}

function ageOf(birthdate, asOf) {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  if (isNaN(b.getTime())) return null;
  const now = asOf ? new Date(asOf) : new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

function bucketize(n, edges) {
  if (n == null) return null;
  for (let i = 0; i < edges.length; i++) {
    if (n < edges[i]) return i === 0 ? ("<" + edges[0]) : (edges[i - 1] + "–" + (edges[i] - 1));
  }
  return "≥" + edges[edges.length - 1];
}

function average(xs) {
  let s = 0, c = 0;
  for (const x of xs) if (x != null && !isNaN(x)) { s += x; c++; }
  return c ? s / c : null;
}

/* Cramér's V over an attribute × o-bucket contingency table.
 *   V = sqrt( χ² / (N * (min(r,c) - 1)) )
 * Returns 0 when the table is degenerate. */
function cramersV(table) {
  const rowKeys = Object.keys(table);
  if (!rowKeys.length) return 0;
  const colKeys = Array.from(new Set([].concat(...rowKeys.map((r) => Object.keys(table[r])))));
  if (colKeys.length < 2 || rowKeys.length < 2) return 0;
  const rowTotals = {}; const colTotals = {}; let N = 0;
  for (const r of rowKeys) {
    rowTotals[r] = 0;
    for (const c of colKeys) {
      const v = (table[r] && table[r][c]) || 0;
      rowTotals[r] += v;
      colTotals[c] = (colTotals[c] || 0) + v;
      N += v;
    }
  }
  if (N === 0) return 0;
  let chi2 = 0;
  for (const r of rowKeys) {
    for (const c of colKeys) {
      const expected = (rowTotals[r] * colTotals[c]) / N;
      if (expected === 0) continue;
      const observed = (table[r] && table[r][c]) || 0;
      chi2 += Math.pow(observed - expected, 2) / expected;
    }
  }
  const denom = N * (Math.min(rowKeys.length, colKeys.length) - 1);
  if (denom <= 0) return 0;
  return Math.sqrt(chi2 / denom);
}

function pearson(pairs) {
  const xs = [], ys = [];
  for (const [x, y] of pairs) {
    if (x == null || y == null || isNaN(x) || isNaN(y)) continue;
    xs.push(+x); ys.push(+y);
  }
  const n = xs.length;
  if (n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  if (dx2 === 0 || dy2 === 0) return null;
  return num / Math.sqrt(dx2 * dy2);
}

/* The same per-performer enrichment ends up driving every correlation
 * surface. Build it once, reuse everywhere. */
function enrichPerformers(performers, scenes) {
  const sceneOByPerf = new Map();
  const sceneCountByPerf = new Map();
  for (const s of scenes) {
    const o = s.o_counter || 0;
    for (const p of s.performers || []) {
      sceneOByPerf.set(p.id, (sceneOByPerf.get(p.id) || 0) + o);
      sceneCountByPerf.set(p.id, (sceneCountByPerf.get(p.id) || 0) + 1);
    }
  }
  return performers.map((p) => {
    const cup = parseCupOrdinal(p.measurements);
    const age = ageOf(p.birthdate, p.death_date);
    const sceneCount = sceneCountByPerf.get(p.id) || p.scene_count || 0;
    const totalSceneO = sceneOByPerf.get(p.id) || 0;
    return {
      id: p.id,
      name: p.name,
      country: p.country || null,
      ethnicity: p.ethnicity || null,
      eyeColor: p.eye_color || null,
      hairColor: p.hair_color || null,
      cupOrdinal: cup,
      cupLetter: cup ? CUP_ORDER[cup - 1] : null,
      heightCm: p.height_cm || null,
      age,
      ageBucket: bucketize(age, [18, 25, 30, 35, 40, 50, 60]),
      heightBucket: bucketize(p.height_cm, [150, 160, 165, 170, 175, 180, 190]),
      gender: p.gender || null,
      favorite: !!p.favorite,
      rating100: p.rating100,
      performerO: p.o_counter || 0,
      sceneO: totalSceneO,
      sceneCount,
      avgSceneO: sceneCount ? totalSceneO / sceneCount : 0,
    };
  });
}

/* Build a {attrLabel → [{value, n, avgPerformerO, avgSceneO,
 *                       shareHighO, totalO}]} aggregate. */
function perAttributeAggregate(enriched, attr, minSupport, highOThreshold) {
  const groups = new Map();
  for (const e of enriched) {
    const v = e[attr];
    if (v == null || v === "") continue;
    if (!groups.has(v)) groups.set(v, []);
    groups.get(v).push(e);
  }
  const out = [];
  for (const [value, members] of groups) {
    if (members.length < minSupport) continue;
    const avgPerformerO = average(members.map((m) => m.performerO));
    const avgSceneO = average(members.map((m) => m.avgSceneO));
    const shareHighO = members.filter((m) => m.avgSceneO >= highOThreshold).length / members.length;
    const totalO = members.reduce((s, m) => s + (m.sceneO || 0), 0);
    out.push({ value, n: members.length, avgPerformerO, avgSceneO, shareHighO, totalO });
  }
  return out.sort((a, b) => b.avgSceneO - a.avgSceneO);
}

function contingency(enriched, attr, oBuckets) {
  const table = {};
  for (const e of enriched) {
    const v = e[attr];
    if (v == null || v === "") continue;
    const o = bucketize(e.avgSceneO, oBuckets);
    table[v] = table[v] || {};
    table[v][o] = (table[v][o] || 0) + 1;
  }
  return table;
}

function buildHeatmap(enriched, rowAttr, colAttr, valueFn, minSupport, topRows, topCols) {
  const cells = new Map();
  const rowAgg = new Map();
  const colAgg = new Map();
  for (const e of enriched) {
    const r = e[rowAttr], c = e[colAttr];
    if (r == null || r === "" || c == null || c === "") continue;
    const key = r + "||" + c;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(e);
    rowAgg.set(r, (rowAgg.get(r) || 0) + 1);
    colAgg.set(c, (colAgg.get(c) || 0) + 1);
  }
  const rows = Array.from(rowAgg.entries()).sort((a, b) => b[1] - a[1]).slice(0, topRows).map(([k]) => k);
  const cols = Array.from(colAgg.entries()).sort((a, b) => b[1] - a[1]).slice(0, topCols).map(([k]) => k);
  const matrix = rows.map(() => cols.map(() => null));
  const counts = rows.map(() => cols.map(() => 0));
  for (let i = 0; i < rows.length; i++) {
    for (let j = 0; j < cols.length; j++) {
      const bucket = cells.get(rows[i] + "||" + cols[j]) || [];
      counts[i][j] = bucket.length;
      if (bucket.length >= minSupport) matrix[i][j] = valueFn(bucket);
    }
  }
  return { rows, cols, matrix, counts };
}

function computeCorrelations(performers, scenes, opts) {
  opts = opts || {};
  const minSupport = Math.max(1, opts.minSupport || 3);
  const highOThreshold = opts.highOThreshold || 2;
  const oBuckets = opts.oBuckets || [1, 2, 4, 8]; // 0, 1, 2-3, 4-7, ≥8

  const enriched = enrichPerformers(performers, scenes);

  // Per-attribute aggregates
  const perAttribute = {};
  for (const attr of ["country", "ethnicity", "eyeColor", "hairColor",
                      "cupLetter", "ageBucket", "heightBucket", "gender"]) {
    perAttribute[attr] = perAttributeAggregate(enriched, attr, minSupport, highOThreshold);
  }

  // Cramér's V vs avgSceneO bucket
  const cramers = {};
  for (const attr of ["country", "ethnicity", "eyeColor", "hairColor",
                      "cupLetter", "ageBucket", "heightBucket", "gender"]) {
    cramers[attr] = +cramersV(contingency(enriched, attr, oBuckets)).toFixed(3);
  }

  // Pearson r — cup, height, age against avgSceneO
  const pearsonOrdinal = {
    cup: pearson(enriched.map((e) => [e.cupOrdinal, e.avgSceneO])),
    height: pearson(enriched.map((e) => [e.heightCm, e.avgSceneO])),
    age: pearson(enriched.map((e) => [e.age, e.avgSceneO])),
  };
  for (const k of Object.keys(pearsonOrdinal)) {
    if (pearsonOrdinal[k] != null) pearsonOrdinal[k] = +pearsonOrdinal[k].toFixed(3);
  }

  // Heatmaps
  const heatmaps = {
    countryEye: buildHeatmap(enriched, "country", "eyeColor",
      (b) => +average(b.map((m) => m.avgSceneO)).toFixed(2), minSupport, 12, 8),
    countryCup: buildHeatmap(enriched, "country", "cupLetter",
      (b) => +average(b.map((m) => m.avgSceneO)).toFixed(2), minSupport, 12, 8),
    ethnicityCup: buildHeatmap(enriched, "ethnicity", "cupLetter",
      (b) => +average(b.map((m) => m.avgSceneO)).toFixed(2), minSupport, 10, 8),
    ageCup: buildHeatmap(enriched, "ageBucket", "cupLetter",
      (b) => +average(b.map((m) => m.avgSceneO)).toFixed(2), minSupport, 8, 8),
  };

  // Sort heatmap rows so the row with the highest mean lands at the top.
  for (const h of Object.values(heatmaps)) {
    const meanByRow = h.rows.map((_, i) => ({
      i, mean: average(h.matrix[i].filter((v) => v != null)) || 0,
    }));
    meanByRow.sort((a, b) => b.mean - a.mean);
    h.rows = meanByRow.map(({ i }) => h.rows[i]);
    h.matrix = meanByRow.map(({ i }) => h.matrix[i]);
    h.counts = meanByRow.map(({ i }) => h.counts[i]);
  }

  // Bubble points — cap to top 200 by avgSceneO so the chart stays usable.
  const bubbles = enriched
    .filter((e) => e.cupOrdinal && e.sceneCount > 0)
    .sort((a, b) => b.avgSceneO - a.avgSceneO)
    .slice(0, 200)
    .map((e) => ({
      x: e.cupOrdinal,
      y: +e.avgSceneO.toFixed(2),
      r: Math.min(20, 3 + Math.sqrt(e.sceneCount) * 1.5),
      country: e.country,
      eyeColor: e.eyeColor,
      cupLetter: e.cupLetter,
      name: e.name,
      id: e.id,
    }));

  // Parallel coordinates — map each enriched performer to normalised
  // 0..1 positions along 6 axes. Categorical axes are encoded by sorting
  // categories by their mean avgSceneO so curves cluster by similar O.
  const parallel = buildParallelData(enriched);

  return {
    minSupport, highOThreshold, oBucketEdges: oBuckets,
    perAttribute, cramersV: cramers, pearsonOrdinal,
    heatmaps, bubbles, parallel,
    enrichedCount: enriched.length,
  };
}

function buildParallelData(enriched) {
  const axes = ["country", "ethnicity", "eyeColor", "cupLetter", "heightCm", "age", "avgSceneO"];

  function buildCategoricalScale(attr) {
    const groups = new Map();
    for (const e of enriched) {
      const v = e[attr];
      if (v == null || v === "") continue;
      if (!groups.has(v)) groups.set(v, []);
      groups.get(v).push(e.avgSceneO);
    }
    const sorted = Array.from(groups.entries())
      .map(([k, vs]) => ({ k, mean: average(vs) || 0 }))
      .sort((a, b) => a.mean - b.mean)
      .map(({ k }) => k);
    const idx = new Map(sorted.map((k, i) => [k, i]));
    return { categories: sorted, index: idx };
  }

  function normalize(values) {
    const cleaned = values.filter((v) => v != null && !isNaN(v));
    if (!cleaned.length) return { min: 0, max: 1 };
    const min = Math.min.apply(null, cleaned);
    const max = Math.max.apply(null, cleaned);
    return { min, max: max === min ? min + 1 : max };
  }

  const catScales = {
    country: buildCategoricalScale("country"),
    ethnicity: buildCategoricalScale("ethnicity"),
    eyeColor: buildCategoricalScale("eyeColor"),
    cupLetter: buildCategoricalScale("cupLetter"),
  };
  const numScales = {
    heightCm: normalize(enriched.map((e) => e.heightCm)),
    age: normalize(enriched.map((e) => e.age)),
    avgSceneO: normalize(enriched.map((e) => e.avgSceneO)),
  };

  const lines = enriched.slice(0, 400).map((e) => {
    const point = {};
    for (const a of axes) {
      if (catScales[a]) {
        const idx = catScales[a].index.get(e[a]);
        point[a] = idx == null ? null : idx / Math.max(1, catScales[a].categories.length - 1);
      } else {
        const v = e[a];
        if (v == null || isNaN(v)) { point[a] = null; continue; }
        const { min, max } = numScales[a];
        point[a] = (v - min) / (max - min);
      }
    }
    return { id: e.id, name: e.name, country: e.country, avgSceneO: e.avgSceneO, axes: point };
  });

  return {
    axes,
    categoricalAxes: Object.fromEntries(Object.entries(catScales).map(([k, s]) => [k, s.categories])),
    numericAxes: numScales,
    lines,
  };
}

module.exports = {
  computeCorrelations,
  enrichPerformers,
  parseCupOrdinal,
  cramersV,
  pearson,
  CUP_ORDER,
};
