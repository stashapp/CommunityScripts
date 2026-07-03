"use strict";

/* Quality insights.
 *
 * Five concrete surfaces, plus a composite library-health score:
 *
 *   - hiddenGems: high-rated scenes (rating100 ≥ gemRatingFloor) that have
 *       been played few times (or never). Surfaces underwatched-but-loved
 *       content. Ranked by `gem_score = rating100 × (1 + 1 / (1 + play_count))`
 *       — biases towards never-played first, but still respects rating.
 *
 *   - overratedScenes: scenes whose rating is materially higher than their
 *       O-count + play_count would suggest. We compute a z-score on
 *       `(rating100 - expectedRatingFromUsage)` and surface the top
 *       positive z's. The expected rating is fit by simple linear
 *       regression over scenes with both signals present.
 *
 *   - underratedScenes: same z-score, opposite sign — heavily played
 *       and/or high-O scenes that carry a sub-par rating.
 *
 *   - overratedPerformers / underratedPerformers: per-performer
 *       `rating100` vs `avgSceneO`. Same z-score logic.
 *
 *   - libraryHealth: composite 0..100 score derived from coverage,
 *       diversity, organization, rating completeness, tag richness and
 *       performer metadata depth. Each component is independently
 *       reported so you can see *why* a number is low. */

const { enrichPerformers } = require("./correlations");

function median(xs) {
  const v = xs.filter((x) => x != null && !isNaN(x)).map(Number).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

function mean(xs) {
  let s = 0, c = 0;
  for (const x of xs) if (x != null && !isNaN(x)) { s += x; c++; }
  return c ? s / c : null;
}

function stdev(xs) {
  const m = mean(xs);
  if (m == null) return null;
  let acc = 0, c = 0;
  for (const x of xs) {
    if (x == null || isNaN(x)) continue;
    acc += (x - m) ** 2; c++;
  }
  return c < 2 ? 0 : Math.sqrt(acc / (c - 1));
}

// Simple least-squares fit for y = a + b·x. Returns {a, b} or null.
function fitLine(pairs) {
  let n = 0, sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const [x, y] of pairs) {
    if (x == null || y == null || isNaN(x) || isNaN(y)) continue;
    n++; sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x;
  }
  if (n < 3) return null;
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  const b = (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;
  return { a, b, n };
}

function hiddenGems(scenes, performers, opts) {
  const ratingFloor = opts.gemRatingFloor || 80;
  const playCeiling = opts.gemPlayCeiling != null ? opts.gemPlayCeiling : 2;
  const perfById = new Map(performers.map((p) => [p.id, p]));
  const candidates = [];
  for (const s of scenes) {
    if (s.rating100 == null || s.rating100 < ratingFloor) continue;
    if ((s.play_count || 0) > playCeiling) continue;
    const gemScore = s.rating100 * (1 + 1 / (1 + (s.play_count || 0)));
    candidates.push({
      id: s.id,
      title: s.title || ("Scene " + s.id),
      date: s.date,
      studio: s.studio ? s.studio.name : null,
      performers: (s.performers || []).map((p) => (perfById.get(p.id) || p).name).filter(Boolean),
      tags: (s.tags || []).slice(0, 6).map((t) => t.name),
      rating100: s.rating100,
      playCount: s.play_count || 0,
      lastPlayedAt: s.last_played_at || null,
      durationSec: maxFileDuration(s),
      gemScore: +gemScore.toFixed(2),
    });
  }
  candidates.sort((a, b) => b.gemScore - a.gemScore);
  return candidates.slice(0, opts.topN || 30);
}

function maxFileDuration(s) {
  if (!s.files || !s.files.length) return 0;
  return Math.max.apply(null, s.files.map((f) => f.duration || 0));
}

function sceneUsageSignal(s) {
  // Combine play count + O-count + play_duration ratio into a single 0..1
  // "usage" signal so we can fit rating against it.
  const dur = maxFileDuration(s);
  const completion = dur && s.play_duration
    ? Math.min(1, s.play_duration / Math.max(1, dur * Math.max(1, s.play_count || 1)))
    : 0;
  return 0.4 * Math.tanh((s.play_count || 0) / 5) +
         0.4 * Math.tanh((s.o_counter || 0) / 3) +
         0.2 * completion;
}

function ratedScenesAnomalies(scenes, opts) {
  const usagePairs = [];
  const enriched = [];
  for (const s of scenes) {
    if (s.rating100 == null) continue;
    const usage = sceneUsageSignal(s);
    usagePairs.push([usage, s.rating100]);
    enriched.push({ s, usage, rating: s.rating100 });
  }
  const line = fitLine(usagePairs);
  if (!line || enriched.length < 5) return { overrated: [], underrated: [] };
  const residuals = enriched.map((e) => ({
    ...e, predicted: line.a + line.b * e.usage,
    residual: e.rating - (line.a + line.b * e.usage),
  }));
  const sigma = stdev(residuals.map((r) => r.residual)) || 1;
  for (const r of residuals) r.z = +(r.residual / sigma).toFixed(2);
  const overrated = residuals.slice().sort((a, b) => b.z - a.z).slice(0, opts.topN || 15)
    .filter((r) => r.z >= (opts.zThreshold || 1.0))
    .map((r) => sceneLine(r));
  const underrated = residuals.slice().sort((a, b) => a.z - b.z).slice(0, opts.topN || 15)
    .filter((r) => r.z <= -(opts.zThreshold || 1.0))
    .map((r) => sceneLine(r));
  return { overrated, underrated, fit: line, sigma: +sigma.toFixed(2) };
}

function sceneLine(r) {
  return {
    id: r.s.id,
    title: r.s.title || ("Scene " + r.s.id),
    date: r.s.date,
    rating100: r.rating,
    playCount: r.s.play_count || 0,
    oCount: r.s.o_counter || 0,
    predicted: +r.predicted.toFixed(1),
    residual: +r.residual.toFixed(1),
    z: r.z,
    performers: (r.s.performers || []).map((p) => p.name),
  };
}

function performerAnomalies(performers, scenes, opts) {
  const enriched = enrichPerformers(performers, scenes);
  const rows = enriched.filter((e) => e.rating100 != null && e.sceneCount >= (opts.minScenes || 2));
  if (rows.length < 5) return { overrated: [], underrated: [] };
  const line = fitLine(rows.map((e) => [e.avgSceneO, e.rating100]));
  if (!line) return { overrated: [], underrated: [] };
  const residuals = rows.map((e) => {
    const predicted = line.a + line.b * e.avgSceneO;
    return { e, predicted, residual: e.rating100 - predicted };
  });
  const sigma = stdev(residuals.map((r) => r.residual)) || 1;
  for (const r of residuals) r.z = +(r.residual / sigma).toFixed(2);
  const fmtRow = (r) => ({
    id: r.e.id, name: r.e.name, country: r.e.country,
    rating100: r.e.rating100, avgSceneO: +r.e.avgSceneO.toFixed(2),
    sceneCount: r.e.sceneCount, predicted: +r.predicted.toFixed(1),
    residual: +r.residual.toFixed(1), z: r.z,
  });
  const overrated = residuals.slice().sort((a, b) => b.z - a.z).slice(0, opts.topN || 15)
    .filter((r) => r.z >= (opts.zThreshold || 1.0)).map(fmtRow);
  const underrated = residuals.slice().sort((a, b) => a.z - b.z).slice(0, opts.topN || 15)
    .filter((r) => r.z <= -(opts.zThreshold || 1.0)).map(fmtRow);
  return { overrated, underrated, fit: line, sigma: +sigma.toFixed(2) };
}

// Composite library health. Each component is in [0, 100]; the headline
// score is their weighted average. All component scores are surfaced so a
// low headline can be diagnosed.
function libraryHealth(performers, scenes, tags, opts) {
  const n = performers.length || 1;
  const sN = scenes.length || 1;
  function pct(num, denom) { return denom ? +(100 * num / denom).toFixed(1) : 0; }

  const coverageCountry = pct(performers.filter((p) => p.country).length, n);
  const coverageEthnicity = pct(performers.filter((p) => p.ethnicity).length, n);
  const coverageEye = pct(performers.filter((p) => p.eye_color).length, n);
  const coverageHeight = pct(performers.filter((p) => p.height_cm).length, n);
  const coverageBirthdate = pct(performers.filter((p) => p.birthdate).length, n);
  const performerMetadataDepth = +((coverageCountry + coverageEthnicity + coverageEye + coverageHeight + coverageBirthdate) / 5).toFixed(1);

  const organized = pct(scenes.filter((s) => s.organized).length, sN);
  const rated = pct(scenes.filter((s) => s.rating100 != null).length, sN);
  const taggedScenes = pct(scenes.filter((s) => (s.tags || []).length > 0).length, sN);
  const performersOnScenes = pct(scenes.filter((s) => (s.performers || []).length > 0).length, sN);

  // Tag richness — encourages average ≥ 5 tags per scene.
  const avgTagsPerScene = scenes.reduce((s, sc) => s + (sc.tags || []).length, 0) / sN;
  const tagRichness = Math.min(100, +(avgTagsPerScene / 5 * 100).toFixed(1));

  // Naming completeness for scenes (have a non-empty title).
  const titled = pct(scenes.filter((s) => s.title && String(s.title).trim()).length, sN);

  // Tag inventory health — too many one-off tags suggests typo noise.
  const tagSceneCount = new Map();
  for (const s of scenes) for (const t of s.tags || []) tagSceneCount.set(t.name, (tagSceneCount.get(t.name) || 0) + 1);
  const rareTags = Array.from(tagSceneCount.values()).filter((v) => v < 3).length;
  const tagSpread = tagSceneCount.size;
  const tagInventoryHealth = tagSpread === 0 ? 0 : Math.max(0, 100 - (rareTags / tagSpread) * 100);

  const components = {
    organized, rated, taggedScenes, performersOnScenes, titled,
    performerMetadataDepth, tagRichness, tagInventoryHealth,
  };
  const weights = {
    organized: 1.0, rated: 1.2, taggedScenes: 1.2, performersOnScenes: 0.8,
    titled: 0.6, performerMetadataDepth: 1.4, tagRichness: 0.8, tagInventoryHealth: 0.6,
  };
  let num = 0, denom = 0;
  for (const k of Object.keys(components)) {
    num += components[k] * (weights[k] || 1);
    denom += (weights[k] || 1);
  }
  const score = +(num / denom).toFixed(1);
  return {
    score,
    grade: gradeFromScore(score),
    components,
    weights,
    detail: {
      coverageCountry, coverageEthnicity, coverageEye,
      coverageHeight, coverageBirthdate,
      avgTagsPerScene: +avgTagsPerScene.toFixed(2),
      tagSpread, rareTags,
    },
  };
}

function gradeFromScore(s) {
  if (s >= 90) return "A";
  if (s >= 80) return "A-";
  if (s >= 70) return "B";
  if (s >= 60) return "C";
  if (s >= 50) return "D";
  return "F";
}

function completionRates(scenes, opts) {
  const buckets = { abandoned: 0, partial: 0, watched: 0, repeat: 0 };
  const perScene = [];
  for (const s of scenes) {
    const dur = maxFileDuration(s);
    const pc = s.play_count || 0;
    const pd = s.play_duration || 0;
    if (!dur || (!pc && !pd)) continue;
    // ratio per play
    const perPlay = pc > 0 ? (pd / (dur * pc)) : 0;
    let bucket;
    if (perPlay < 0.2) bucket = "abandoned";
    else if (perPlay < 0.8) bucket = "partial";
    else bucket = "watched";
    if (pc >= 3 && perPlay >= 0.8) bucket = "repeat";
    buckets[bucket]++;
    perScene.push({
      id: s.id,
      title: s.title || ("Scene " + s.id),
      durationSec: dur,
      playCount: pc,
      playDuration: pd,
      completion: +perPlay.toFixed(3),
      bucket,
    });
  }
  const total = buckets.abandoned + buckets.partial + buckets.watched + buckets.repeat || 1;
  const topAbandoned = perScene.filter((s) => s.bucket === "abandoned")
    .sort((a, b) => a.completion - b.completion).slice(0, opts.topN || 15);
  const topRepeat = perScene.filter((s) => s.bucket === "repeat")
    .sort((a, b) => b.playCount - a.playCount).slice(0, opts.topN || 15);
  return {
    buckets,
    sharesPct: {
      abandoned: +(100 * buckets.abandoned / total).toFixed(1),
      partial: +(100 * buckets.partial / total).toFixed(1),
      watched: +(100 * buckets.watched / total).toFixed(1),
      repeat: +(100 * buckets.repeat / total).toFixed(1),
    },
    topAbandoned,
    topRepeat,
  };
}

function guiltyPleasures(scenes, performerById, opts) {
  const ratingCeiling = (opts && opts.ratingCeiling) || 60;
  const minPlays = (opts && opts.minPlays) || 3;
  return scenes
    .filter((s) => s.rating100 != null && s.rating100 <= ratingCeiling && (s.play_count || 0) >= minPlays)
    .map((s) => ({
      id: s.id,
      title: s.title || ("Scene " + s.id),
      rating100: s.rating100,
      playCount: s.play_count || 0,
      oCount: s.o_counter || 0,
      // Guilt score: high plays despite low rating.
      guiltScore: +((s.play_count || 0) * 15 - s.rating100).toFixed(1),
      performers: (s.performers || []).map((p) => p.name),
    }))
    .sort((a, b) => b.guiltScore - a.guiltScore)
    .slice(0, (opts && opts.topN) || 15);
}

function repeatOffenders(scenes, opts) {
  // Same idea as guilty pleasures but harsher: rewatched a lot AND rated
  // below average.
  const rewatch = (opts && opts.rewatchFloor) || 5;
  const ratingMax = (opts && opts.ratingCeiling) || 55;
  return scenes
    .filter((s) => (s.play_count || 0) >= rewatch && s.rating100 != null && s.rating100 <= ratingMax)
    .map((s) => ({
      id: s.id,
      title: s.title || ("Scene " + s.id),
      rating100: s.rating100,
      playCount: s.play_count || 0,
      performers: (s.performers || []).map((p) => p.name),
    }))
    .sort((a, b) => b.playCount - a.playCount || (a.rating100 || 0) - (b.rating100 || 0))
    .slice(0, (opts && opts.topN) || 10);
}

function oneHitWonders(performers, scenes, opts) {
  const ratingFloor = (opts && opts.ratingFloor) || 85;
  const sceneCountByPerf = new Map();
  for (const s of scenes) for (const p of s.performers || []) {
    sceneCountByPerf.set(p.id, (sceneCountByPerf.get(p.id) || 0) + 1);
  }
  return performers
    .filter((p) => (sceneCountByPerf.get(p.id) || 0) === 1 && (p.rating100 || 0) >= ratingFloor)
    .map((p) => ({
      id: p.id, name: p.name,
      rating100: p.rating100,
      country: p.country,
      favorite: !!p.favorite,
    }))
    .sort((a, b) => (b.rating100 || 0) - (a.rating100 || 0))
    .slice(0, (opts && opts.topN) || 15);
}

function tagPotency(scenes, opts) {
  const minSupport = (opts && opts.minSupport) || 5;
  const sumO = new Map();
  const sceneCount = new Map();
  const sumPlays = new Map();
  for (const s of scenes) {
    for (const t of s.tags || []) {
      sumO.set(t.name, (sumO.get(t.name) || 0) + (s.o_counter || 0));
      sceneCount.set(t.name, (sceneCount.get(t.name) || 0) + 1);
      sumPlays.set(t.name, (sumPlays.get(t.name) || 0) + (s.play_count || 0));
    }
  }
  const rows = [];
  for (const [name, n] of sceneCount) {
    if (n < minSupport) continue;
    const o = sumO.get(name) || 0;
    const plays = sumPlays.get(name) || 0;
    rows.push({
      label: name,
      sceneCount: n,
      totalO: o,
      totalPlays: plays,
      avgOPerScene: +(o / n).toFixed(2),
      avgOPerPlay: plays ? +(o / plays).toFixed(3) : 0,
    });
  }
  return rows
    .sort((a, b) => b.avgOPerScene - a.avgOPerScene)
    .slice(0, (opts && opts.topN) || 20);
}

function buriedTreasure(scenes, opts) {
  const floor = (opts && opts.ratingFloor) || 80;
  const minAgeDays = (opts && opts.minAgeDays) || 180;
  const now = Date.now();
  return scenes
    .filter((s) => {
      if ((s.play_count || 0) > 0) return false;
      if (s.rating100 == null || s.rating100 < floor) return false;
      if (!s.created_at) return false;
      const days = (now - new Date(s.created_at).getTime()) / 86400000;
      return days >= minAgeDays;
    })
    .map((s) => {
      const days = Math.round((now - new Date(s.created_at).getTime()) / 86400000);
      return {
        id: s.id,
        title: s.title || ("Scene " + s.id),
        rating100: s.rating100,
        ageDays: days,
        durationSec: Math.max.apply(null, (s.files || [{}]).map((f) => f.duration || 0)),
        performers: (s.performers || []).map((p) => p.name),
        // Age × rating — surfaces old + highly rated first.
        treasureScore: +(s.rating100 + Math.min(50, days * 0.05)).toFixed(1),
      };
    })
    .sort((a, b) => b.treasureScore - a.treasureScore)
    .slice(0, (opts && opts.topN) || 15);
}

function ratingDrift(scenes) {
  // Group scenes by their updated_at month (proxy for when you rated
  // them). Compute avg rating per month.
  const monthly = new Map();
  for (const s of scenes) {
    if (s.rating100 == null || !s.updated_at) continue;
    const m = String(s.updated_at).slice(0, 7);
    const b = monthly.get(m) || { sum: 0, count: 0 };
    b.sum += s.rating100; b.count++;
    monthly.set(m, b);
  }
  const labels = Array.from(monthly.keys()).sort();
  return {
    labels,
    avgRating: labels.map((m) => +(monthly.get(m).sum / monthly.get(m).count).toFixed(1)),
    counts: labels.map((m) => monthly.get(m).count),
  };
}

function computeQuality(performers, scenes, tags, opts) {
  opts = opts || {};
  const performerById = new Map(performers.map((p) => [p.id, p]));
  return {
    health: libraryHealth(performers, scenes, tags, opts),
    hiddenGems: hiddenGems(scenes, performers, {
      gemRatingFloor: opts.gemRatingFloor || 80,
      gemPlayCeiling: opts.gemPlayCeiling != null ? opts.gemPlayCeiling : 2,
      topN: opts.topN || 30,
    }),
    sceneAnomalies: ratedScenesAnomalies(scenes, { topN: opts.topN || 15, zThreshold: opts.zThreshold || 1.0 }),
    performerAnomalies: performerAnomalies(performers, scenes, { topN: opts.topN || 15, zThreshold: opts.zThreshold || 1.0, minScenes: opts.minScenes || 2 }),
    completion: completionRates(scenes, { topN: opts.topN || 15 }),
    guiltyPleasures: guiltyPleasures(scenes, performerById, { topN: 15 }),
    repeatOffenders: repeatOffenders(scenes, { topN: 10 }),
    oneHitWonders: oneHitWonders(performers, scenes, { topN: 15 }),
    tagPotency: tagPotency(scenes, { minSupport: 5, topN: 20 }),
    buriedTreasure: buriedTreasure(scenes, { topN: 15 }),
    ratingDrift: ratingDrift(scenes),
  };
}

module.exports = {
  computeQuality,
  libraryHealth,
  hiddenGems,
  completionRates,
  ratedScenesAnomalies,
  performerAnomalies,
  fitLine,
};
