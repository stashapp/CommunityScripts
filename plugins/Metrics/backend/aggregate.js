"use strict";

/* Pure aggregation: takes the raw GraphQL entities, returns the
 * dashboard-shaped payload. Node-side mirror of src/dashboard.js's
 * ns.aggregate() — kept independent because importing browser JS into Node
 * would require a build step we don't want. */

const { computeCorrelations } = require("./correlations");
const { computePlayHistory } = require("./play_history");
const { computeArchetypes } = require("./clustering");
const { computeDiversity } = require("./diversity");
const { computeTemporal } = require("./temporal");
const { computeFantasy } = require("./fantasy");
const { computeQuality } = require("./quality");
const fun = require("./fun");
const { computeWrapped } = require("./wrapped");
const { computeBingo } = require("./bingo");
const { computeNudges } = require("./nudges");
const { computeTagOptimization } = require("./tagopt");
const { computeCleanup } = require("./cleanup");

function totalSceneDuration(s) {
  if (!s.files || !s.files.length) return 0;
  return Math.max.apply(null, s.files.map((f) => f.duration || 0));
}
function totalSceneSize(s) {
  if (!s.files || !s.files.length) return 0;
  return s.files.reduce((sum, f) => sum + (Number(f.size) || 0), 0);
}
function has(v) { return v != null && v !== "" && !/^(no|none|n)$/i.test(String(v).trim()); }
function avg(arr, fn) {
  let s = 0, c = 0;
  for (const x of arr) {
    const v = fn ? fn(x) : x;
    if (v != null && !isNaN(v)) { s += Number(v); c++; }
  }
  return c ? s / c : null;
}
function median(values) {
  const v = values.filter((x) => x != null && !isNaN(x)).map(Number).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}
function histogram(values, opts) {
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
}
function countBy(items, keyFn) {
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
}
function coOccurrence(groups, idFn) {
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
}
function parseMeasurements(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.replace(/\s+/g, "").match(/^(\d{2,3})([a-zA-Z]+)?-(\d{2,3})-(\d{2,3})$/);
  if (!m) return null;
  return { bust: +m[1], cup: m[2] || null, waist: +m[3], hips: +m[4] };
}
function age(birthdate, asOf) {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  if (isNaN(b.getTime())) return null;
  const now = asOf ? new Date(asOf) : new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}
function ageBucket(a, size) {
  if (a == null) return null;
  const s = size && size > 0 ? size : 5;
  const lo = Math.floor(a / s) * s;
  return lo + "–" + (lo + s - 1);
}
function parseCareerYears(s) {
  if (!s) return null;
  const range = String(s).match(/(\d{4})\s*[-–]\s*(\d{4}|present|now)?/i);
  if (range) {
    const from = +range[1];
    const to = range[2] && !/present|now/i.test(range[2]) ? +range[2] : new Date().getFullYear();
    return Math.max(0, to - from);
  }
  const yrs = String(s).match(/(\d+)\s*y/i);
  if (yrs) return +yrs[1];
  return null;
}

function crossTabTags(scenes, performers, tagNames, perfKeyFn, topCols) {
  const perfById = new Map(performers.map((p) => [p.id, p]));
  const cols = new Map();
  for (const p of performers) {
    const k = perfKeyFn(p);
    cols.set(k, (cols.get(k) || 0) + 1);
  }
  const topColLabels = Array.from(cols.keys())
    .sort((a, b) => cols.get(b) - cols.get(a))
    .slice(0, topCols);
  if (!topColLabels.length || !tagNames.length) return null;
  const matrix = tagNames.map(() => topColLabels.map(() => 0));
  const tagIdx = new Map(tagNames.map((t, i) => [t, i]));
  const colIdx = new Map(topColLabels.map((c, i) => [c, i]));
  for (const s of scenes) {
    for (const p of s.performers || []) {
      const full = perfById.get(p.id);
      if (!full) continue;
      const c = perfKeyFn(full);
      if (!colIdx.has(c)) continue;
      for (const t of s.tags || []) {
        if (!tagIdx.has(t.name)) continue;
        matrix[tagIdx.get(t.name)][colIdx.get(c)]++;
      }
    }
  }
  return { matrix, cols: topColLabels };
}

function aggregate(statsBlock, performers, tags, studios, scenes, opts) {
  opts = opts || {};
  const bucketSize = opts.ageBuckets || 5;
  const topN = opts.topN || 20;
  const excludeTag = new Set((opts.excludeTagIds || []).map(String));
  const excludePerf = new Set((opts.excludePerformerIds || []).map(String));

  // Gender filter — scopes every downstream aggregate to specific genders.
  // Empty / "all" / unset means no filter. Case-insensitive; accepts
  // FEMALE, MALE, TRANSGENDER_FEMALE, TRANSGENDER_MALE, INTERSEX,
  // NON_BINARY. Scenes are kept when they contain at least one performer
  // of an allowed gender — so mixed-gender scenes still appear in the
  // female-only view but scenes with zero female performers drop out.
  const genderRaw = String(opts.genderFilter || "").trim().toUpperCase();
  const allowedGenders = genderRaw && genderRaw !== "ALL"
    ? new Set(genderRaw.split(",").map((g) => g.trim()).filter(Boolean))
    : null;
  // Keep the pre-filter arrays for surfaces (like Cleanup) that must
  // scan the entire library regardless of the current gender scope.
  const allPerformers = performers;
  const allScenes = scenes;
  performers = allowedGenders
    ? performers.filter((p) => p.gender && allowedGenders.has(p.gender))
    : performers;

  const filteredScenes = scenes.filter((s) => {
    if (s.performers && s.performers.some((p) => excludePerf.has(p.id))) return false;
    if (allowedGenders) {
      const perfs = s.performers || [];
      if (!perfs.length) return false;
      if (!perfs.some((p) => p.gender && allowedGenders.has(p.gender))) return false;
    }
    return true;
  });

  const tagById = new Map(tags.map((t) => [t.id, t]));
  const perfById = new Map(performers.map((p) => [p.id, p]));

  // ---- Totals
  const durations = filteredScenes.map(totalSceneDuration).filter((d) => d > 0);
  const totals = {
    scenes: filteredScenes.length,
    performers: performers.length,
    tags: tags.length,
    studios: studios.length,
    images: statsBlock.image_count,
    galleries: statsBlock.gallery_count,
    totalDuration: durations.reduce((s, d) => s + d, 0),
    totalSize: filteredScenes.reduce((s, sc) => s + totalSceneSize(sc), 0),
    avgDuration: avg(durations),
    medianDuration: median(durations),
    performersFavorite: performers.filter((p) => p.favorite).length,
  };

  const durationHistogram = histogram(durations.map((d) => d / 60), {
    bins: 14, formatter: (m) => Math.round(m) + "m",
  });

  const studioStorage = (function () {
    const map = new Map();
    for (const s of filteredScenes) {
      const k = s.studio ? s.studio.name : "Unknown";
      map.set(k, (map.get(k) || 0) + totalSceneSize(s));
    }
    return Array.from(map, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  })();

  const resolutionDistribution = countBy(filteredScenes, (s) => {
    const f = (s.files || [])[0];
    if (!f || !f.height) return "Unknown";
    if (f.height >= 2000) return "4K+";
    if (f.height >= 1080) return "1080p";
    if (f.height >= 720) return "720p";
    if (f.height >= 480) return "480p";
    return "<480p";
  });

  const codecDistribution = countBy(filteredScenes, (s) => {
    const f = (s.files || [])[0];
    return f && f.video_codec ? f.video_codec.toLowerCase() : "Unknown";
  }).slice(0, 12);

  const ratingDistribution = (function () {
    const buckets = [0, 0, 0, 0, 0, 0];
    for (const s of filteredScenes) {
      if (s.rating100 == null) { buckets[0]++; continue; }
      const stars = Math.max(1, Math.min(5, Math.ceil(s.rating100 / 20)));
      buckets[stars]++;
    }
    return { labels: ["Unrated", "★", "★★", "★★★", "★★★★", "★★★★★"], counts: buckets };
  })();

  const organizedRatio = {
    organized: filteredScenes.filter((s) => s.organized).length,
    unorganized: filteredScenes.filter((s) => !s.organized).length,
  };

  // ---- Performers
  const heights = performers.map((p) => p.height_cm).filter((x) => x);
  const ages = performers.map((p) => age(p.birthdate, p.death_date)).filter((x) => x != null);

  const perfKpis = {
    total: performers.length,
    favorited: performers.filter((p) => p.favorite).length,
    medianAge: median(ages),
    avgHeight: avg(heights),
    tattooedRatio: ratioOf(performers, (p) => has(p.tattoos)),
    piercedRatio: ratioOf(performers, (p) => has(p.piercings)),
    countries: new Set(performers.map((p) => p.country).filter(Boolean)).size,
  };

  const genderDistribution = countBy(performers, (p) => p.gender || "UNKNOWN");
  const ethnicityDistribution = countBy(performers, (p) => p.ethnicity || "Unknown");
  const countryDistribution = countBy(performers, (p) => p.country || "Unknown");

  const allBuckets = new Set();
  const series = {};
  for (const p of performers) {
    const a = age(p.birthdate, p.death_date);
    if (a == null || a < 0) continue;
    const b = ageBucket(a, bucketSize);
    allBuckets.add(b);
    const g = p.gender || "UNKNOWN";
    if (!series[g]) series[g] = new Map();
    series[g].set(b, (series[g].get(b) || 0) + 1);
  }
  const orderedBuckets = Array.from(allBuckets).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  const agePyramid = {
    buckets: orderedBuckets,
    series: Object.fromEntries(
      Object.entries(series).map(([g, m]) => [g, orderedBuckets.map((b) => m.get(b) || 0)])
    ),
  };

  const heightHistogram = histogram(heights, { bins: 16, formatter: (cm) => Math.round(cm) + "cm" });

  const careerVsScenes = performers
    .filter((p) => p.career_length && p.scene_count)
    .map((p) => {
      const yrs = parseCareerYears(p.career_length);
      if (yrs == null) return null;
      return { x: yrs, y: p.scene_count, name: p.name };
    })
    .filter(Boolean);

  const topByScenes = performers
    .slice().sort((a, b) => (b.scene_count || 0) - (a.scene_count || 0))
    .slice(0, topN).map((p) => ({ label: p.name, value: p.scene_count || 0, id: p.id }));

  const durationByPerf = new Map();
  for (const s of filteredScenes) {
    const d = totalSceneDuration(s);
    for (const p of s.performers || []) {
      durationByPerf.set(p.id, (durationByPerf.get(p.id) || 0) + d);
    }
  }
  const topByDuration = performers.map((p) => ({
    label: p.name, value: durationByPerf.get(p.id) || 0, id: p.id,
  })).sort((a, b) => b.value - a.value).slice(0, topN);

  const topByRating = performers.filter((p) => p.rating100 != null)
    .sort((a, b) => (b.rating100 || 0) - (a.rating100 || 0))
    .slice(0, topN).map((p) => ({ label: p.name, value: p.rating100 || 0, id: p.id }));

  const bodyMods = (function () {
    const labels = ["Tattoos", "Piercings", "Fake tits"];
    const yes = [0, 0, 0]; const no = [0, 0, 0]; const unknown = [0, 0, 0];
    function bucket(v, i) {
      if (v == null || v === "") unknown[i]++;
      else if (/^(no|none|n)$/i.test(v.trim())) no[i]++;
      else yes[i]++;
    }
    for (const p of performers) {
      bucket(p.tattoos, 0);
      bucket(p.piercings, 1);
      bucket(p.fake_tits, 2);
    }
    return { labels, yes, no, unknown };
  })();

  const cupDistribution = (function () {
    const counts = new Map();
    for (const p of performers) {
      const m = parseMeasurements(p.measurements);
      if (!m || !m.cup) continue;
      const c = m.cup.toUpperCase()[0];
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    return Array.from(counts, ([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  })();

  // ---- Tags
  const tagFrequency = (function () {
    const out = new Map();
    for (const s of filteredScenes) {
      for (const t of s.tags || []) {
        if (excludeTag.has(t.id)) continue;
        if (!out.has(t.id)) out.set(t.id, { id: t.id, label: t.name, value: 0 });
        out.get(t.id).value++;
      }
    }
    return Array.from(out.values()).sort((a, b) => b.value - a.value);
  })();

  const tagCoOccurrence = coOccurrence(
    filteredScenes.map((s) => ({ items: (s.tags || []).filter((t) => !excludeTag.has(t.id)) })),
    (t) => t.id
  ).slice(0, 200).map((e) => ({
    a: (tagById.get(e.a) || {}).name || e.a,
    b: (tagById.get(e.b) || {}).name || e.b,
    weight: e.weight,
  }));

  const topTagNames = tagFrequency.slice(0, 10).map((t) => t.label);
  const tbe = crossTabTags(filteredScenes, performers, topTagNames, (p) => p.ethnicity || "Unknown", 8);
  const tbc = crossTabTags(filteredScenes, performers, topTagNames, (p) => p.country || "Unknown", 12);
  const tagsByEthnicity = tbe ? { matrix: tbe.matrix, tags: topTagNames, ethnicities: tbe.cols } : null;
  const tagsByCountry = tbc ? { matrix: tbc.matrix, tags: topTagNames, countries: tbc.cols } : null;

  const tagHierarchy = tags
    .filter((t) => t.children && t.children.length)
    .sort((a, b) => (b.scene_count || 0) - (a.scene_count || 0))
    .map((t) => ({
      id: t.id, name: t.name, sceneCount: t.scene_count || 0,
      children: t.children.map((c) => {
        const full = tagById.get(c.id);
        return { id: c.id, name: c.name, sceneCount: full ? (full.scene_count || 0) : 0 };
      }).sort((a, b) => b.sceneCount - a.sceneCount),
    }));

  const tagKpis = {
    total: tags.length,
    usedInScenes: tagFrequency.length,
    avgTagsPerScene: filteredScenes.length ? avg(filteredScenes, (s) => (s.tags || []).length) : 0,
    uniquePairs: tagCoOccurrence.length,
    parentTags: tags.filter((t) => t.children && t.children.length).length,
  };

  // ---- Networks
  const perfEdges = coOccurrence(
    filteredScenes.map((s) => ({ items: (s.performers || []).filter((p) => !excludePerf.has(p.id)) })),
    (p) => p.id
  );
  const minWeight = Math.max(1, Math.round(filteredScenes.length / 4000));
  const significantEdges = perfEdges.filter((e) => e.weight >= minWeight).slice(0, 200);
  const nodeIds = new Set();
  significantEdges.forEach((e) => { nodeIds.add(e.a); nodeIds.add(e.b); });
  const degree = new Map();
  for (const e of significantEdges) {
    degree.set(e.a, (degree.get(e.a) || 0) + 1);
    degree.set(e.b, (degree.get(e.b) || 0) + 1);
  }
  const topNodes = Array.from(nodeIds).sort((a, b) => (degree.get(b) || 0) - (degree.get(a) || 0)).slice(0, 50);
  const topSet = new Set(topNodes);
  const performerNetworkNodes = topNodes.map((id) => {
    const p = perfById.get(id);
    return {
      id, label: p ? p.name : id,
      sceneCount: p ? (p.scene_count || 0) : 0,
      degree: degree.get(id) || 0,
    };
  });
  const performerNetworkEdges = significantEdges.filter((e) => topSet.has(e.a) && topSet.has(e.b));

  const topPerformerPairs = perfEdges.slice(0, 50).map((e) => ({
    a: (perfById.get(e.a) || {}).name || e.a,
    b: (perfById.get(e.b) || {}).name || e.b,
    weight: e.weight,
  }));

  const studioTagHeatmap = (function () {
    const topStudios = studios.slice().sort((a, b) => (b.scene_count || 0) - (a.scene_count || 0)).slice(0, 10);
    const tagTop = tagFrequency.slice(0, 12).map((t) => t.label);
    const tagSet = new Set(tagTop);
    const matrix = topStudios.map(() => tagTop.map(() => 0));
    const studioIndex = new Map(topStudios.map((s, i) => [s.id, i]));
    const tagIndex = new Map(tagTop.map((t, i) => [t, i]));
    for (const s of filteredScenes) {
      if (!s.studio || !studioIndex.has(s.studio.id)) continue;
      const rIdx = studioIndex.get(s.studio.id);
      for (const t of s.tags || []) {
        if (!tagSet.has(t.name)) continue;
        matrix[rIdx][tagIndex.get(t.name)]++;
      }
    }
    return { studios: topStudios.map((s) => s.name), tags: tagTop, matrix };
  })();

  // ---- Time series
  const monthBuckets = new Map();
  for (const s of filteredScenes) {
    if (!s.date) continue;
    const key = s.date.slice(0, 7);
    const e = monthBuckets.get(key) || { count: 0, dur: 0 };
    e.count++; e.dur += totalSceneDuration(s);
    monthBuckets.set(key, e);
  }
  const monthLabels = Array.from(monthBuckets.keys()).sort();
  const scenesPerMonth = { labels: monthLabels, counts: monthLabels.map((k) => monthBuckets.get(k).count) };
  const durationPerMonth = { labels: monthLabels, hours: monthLabels.map((k) => +(monthBuckets.get(k).dur / 3600).toFixed(2)) };

  const topTagsForTrend = tagFrequency.slice(0, 5).map((t) => t.label);
  const tagTrendMap = new Map(topTagsForTrend.map((t) => [t, new Map()]));
  for (const s of filteredScenes) {
    if (!s.date) continue;
    const key = s.date.slice(0, 7);
    for (const t of s.tags || []) {
      if (!tagTrendMap.has(t.name)) continue;
      tagTrendMap.get(t.name).set(key, (tagTrendMap.get(t.name).get(key) || 0) + 1);
    }
  }
  const tagTrends = {
    labels: monthLabels,
    series: topTagsForTrend.map((name) => ({
      label: name,
      values: monthLabels.map((k) => tagTrendMap.get(name).get(k) || 0),
    })),
  };

  const debutsByPerformer = new Map();
  for (const s of filteredScenes) {
    if (!s.date) continue;
    for (const p of s.performers || []) {
      if (!debutsByPerformer.has(p.id) || s.date < debutsByPerformer.get(p.id)) {
        debutsByPerformer.set(p.id, s.date);
      }
    }
  }
  const debutBuckets = new Map();
  for (const d of debutsByPerformer.values()) {
    const k = d.slice(0, 7);
    debutBuckets.set(k, (debutBuckets.get(k) || 0) + 1);
  }
  const debutLabels = Array.from(debutBuckets.keys()).sort();
  const performerDebutsPerMonth = { labels: debutLabels, counts: debutLabels.map((k) => debutBuckets.get(k)) };

  const topStudioNames = studios.slice().sort((a, b) => (b.scene_count || 0) - (a.scene_count || 0)).slice(0, 5).map((s) => s.name);
  const studioTrendMap = new Map(topStudioNames.map((s) => [s, new Map()]));
  for (const s of filteredScenes) {
    if (!s.date || !s.studio) continue;
    if (!studioTrendMap.has(s.studio.name)) continue;
    const key = s.date.slice(0, 7);
    studioTrendMap.get(s.studio.name).set(key, (studioTrendMap.get(s.studio.name).get(key) || 0) + 1);
  }
  const studioOutput = {
    labels: monthLabels,
    series: topStudioNames.map((name) => ({
      label: name,
      values: monthLabels.map((k) => studioTrendMap.get(name).get(k) || 0),
    })),
  };

  // Correlations & recommender inputs — optional (enableCorrelations toggle
  // controls whether we compute them at all on big libraries). The
  // dashboard's Correlations tab degrades gracefully when this block is
  // absent.
  let correlations = null;
  if (opts.enableCorrelations !== false) {
    correlations = computeCorrelations(performers, filteredScenes, {
      minSupport: opts.correlationMinSupport || 3,
      highOThreshold: opts.highOThreshold || 2,
    });
  }

  // v1.2 — additional analytics blocks. Each has a kill-switch in the
  // opts object so big libraries can disable the heavy ones.
  const playHistory = opts.enablePlayHistory === false
    ? null : computePlayHistory(filteredScenes, performers, { topN: opts.topN || 25 });
  const archetypes = opts.enableArchetypes === false
    ? null : computeArchetypes(performers, filteredScenes, {
        k: opts.archetypeClusters || 6,
        topSimilar: 10,
        similarityCap: opts.archetypeSimilarityCap || 5000,
      });
  const diversity = opts.enableDiversity === false
    ? null : computeDiversity(performers, filteredScenes, tags, { minSupport: opts.correlationMinSupport || 3 });
  const temporal = opts.enableTemporal === false
    ? null : computeTemporal(performers, filteredScenes, studios, { topN: opts.topN || 20 });
  const fantasy = opts.enableFantasy === false
    ? null : computeFantasy(performers, filteredScenes, {
        mode: opts.fantasyMode || "favorites",
        consensusThreshold: opts.fantasyConsensus || 0.5,
        seedSize: opts.fantasySeedSize || 25,
        topMatches: opts.topN || 25,
      });
  const quality = opts.enableQuality === false
    ? null : computeQuality(performers, filteredScenes, tags, {
        gemRatingFloor: opts.gemRatingFloor || 80,
        gemPlayCeiling: opts.gemPlayCeiling != null ? opts.gemPlayCeiling : 2,
        topN: opts.topN || 30,
        zThreshold: opts.qualityZThreshold || 1.0,
        minScenes: opts.qualityMinScenes || 2,
      });

  return {
    computedAt: new Date().toISOString(),
    // Surface the active gender filter so the dashboard header can
    // annotate "showing FEMALE, MALE" etc.
    activeGenderFilter: allowedGenders ? Array.from(allowedGenders) : null,
    totals, durationHistogram, studioStorage, resolutionDistribution,
    codecDistribution, ratingDistribution, organizedRatio,
    kpis: perfKpis,
    genderDistribution, ethnicityDistribution, countryDistribution,
    agePyramid, heightHistogram, careerVsScenes,
    topByScenes, topByDuration, topByRating, bodyMods, cupDistribution,
    tagKpis, tagFrequency, tagCoOccurrence, tagsByEthnicity, tagsByCountry, tagHierarchy,
    performerNetworkNodes, performerNetworkEdges, topPerformerPairs,
    studioTagHeatmap,
    scenesPerMonth, durationPerMonth, tagTrends, performerDebutsPerMonth, studioOutput,
    correlations,
    playHistory, archetypes, diversity, temporal, fantasy, quality,
    // v1.6 — Fun / spicy blocks. Cheap to compute; always emitted.
    fun: (function () {
      const studioLoyalty = fun.studioLoyaltyIndex(filteredScenes);
      const dry = fun.drySpellBingeCycle(filteredScenes);
      const peakIntensity = fun.peakIntensityWindow(filteredScenes);
      return {
        studioLoyalty,
        peakSession: fun.peakSession(filteredScenes, 120),
        drySpell: dry,
        peakIntensity,
        optimalDuration: fun.optimalDuration(filteredScenes),
        kinkEvolution: fun.kinkEvolution(filteredScenes, 12, 8),
        timeCapsule: fun.timeCapsule(filteredScenes, performers, 6),
        countryTourism: fun.countryTourism(filteredScenes, performers),
        personality: fun.personalityRead(filteredScenes, performers, {
          studioLoyalty,
          drySpell: dry,
          peakDow: peakIntensity ? peakIntensity.peakDow : null,
          peakHour: peakIntensity ? peakIntensity.peakHour : null,
        }),
      };
    })(),
    // v1.7 — Wrapped, Bingo, Nudges.
    wrapped: computeWrapped(filteredScenes, performers, tags, { preferredYear: opts.wrappedYear }),
    bingo: computeBingo(filteredScenes, performers, tags, { seed: opts.bingoSeed || 42 }),
    nudges: computeNudges(filteredScenes, performers, tags, { quality }),
    // v1.8 — Tag optimizer. Uses full scene set (pre-filter) for tag
    // inventory analysis so gender/exclude filters don't skew the counts.
    tagopt: opts.enableTagOptimizer === false
      ? null : computeTagOptimization(tags, scenes, {
          rareThreshold: opts.tagoptRareThreshold || 3,
          pairMinSupport: opts.tagoptPairMinSupport || 5,
          underTaggedMax: opts.tagoptUndertagMax != null ? opts.tagoptUndertagMax : 2,
          overTaggedMin: opts.tagoptOvertagMin || 20,
        }),
    // v1.9 — Metadata cleanup. Uses the pre-filter performer + scene sets
    // so we surface EVERY performer missing metadata, not only those in
    // the current gender scope.
    cleanup: computeCleanup(allPerformers, allScenes,
      { topN: opts.cleanupTopN || 40 }),
  };
}

function ratioOf(arr, fn) {
  if (!arr.length) return 0;
  let y = 0, k = 0;
  for (const x of arr) {
    const v = fn(x);
    if (v == null) continue;
    if (v) y++;
    k++;
  }
  return k ? y / k : 0;
}

module.exports = { aggregate };
