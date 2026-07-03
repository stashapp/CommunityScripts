"use strict";

/* Preference-driven match scoring.
 *
 * The profile is a single object owned by the user (stored in plugin
 * settings, editable inline from the dashboard). Every field is optional;
 * an empty profile produces a uniform score of 50/100 (i.e. "neutral
 * baseline — we have nothing to filter on").
 *
 * Profile shape:
 *
 *   {
 *     countries: ["US", "CZ"],
 *     ethnicities: ["Caucasian", "Latin"],
 *     eyeColors: ["Blue", "Green"],
 *     hairColors: ["Blonde"],
 *     cupSizes: ["C", "D", "E"],
 *     requiredTags: ["Outdoor", "POV"],
 *     excludedTags: ["Solo"],
 *     minHeightCm: 160, maxHeightCm: 180,
 *     minAge: 22, maxAge: 35,
 *     minOCount: 1,
 *     weights: {
 *       country: 1.0, ethnicity: 0.8, eyeColor: 0.7, hairColor: 0.5,
 *       cup: 0.9, height: 0.5, age: 0.6,
 *       oCount: 1.2, tagOverlap: 1.0, rating: 0.3
 *     },
 *     topMatches: 25
 *   }
 *
 * Score formula (per performer):
 *
 *   score = 100 * Σ (weight_i * match_i) / Σ weight_i
 *
 * match_i is in [0, 1]:
 *
 *   categorical (country, ethnicity, eye, hair, cup):
 *       1 if the performer's value is in the preferred set
 *       0 otherwise (or 0.5 if matchIncludeUnknown is on and the value is null)
 *   numeric ranges (height, age):
 *       1 if inside [min, max]
 *       linear falloff to 0 over a one-bucket-wide tail outside the range
 *   oCount:
 *       clip(performer.avgSceneO / max(minOCount,1), 0, 1)
 *   tagOverlap:
 *       |performer.tagSet ∩ requiredTagSet| / |requiredTagSet|
 *       (or 1 if requiredTagSet is empty; 0 if any excludedTag matches)
 *   rating:
 *       performer.rating100 / 100 (null → 0.5 fallback if matchIncludeUnknown)
 *
 * Scenes are scored independently — see scoreScene().
 */

const { enrichPerformers, parseCupOrdinal, CUP_ORDER } = require("./correlations");

const DEFAULT_WEIGHTS = {
  country: 1.0, ethnicity: 0.8, eyeColor: 0.7, hairColor: 0.5,
  cup: 0.9, height: 0.5, age: 0.6,
  oCount: 1.2, tagOverlap: 1.0, rating: 0.3,
};

function normalizeProfile(raw) {
  const p = raw && typeof raw === "object" ? raw : {};
  return {
    countries: arr(p.countries),
    ethnicities: arr(p.ethnicities),
    eyeColors: arr(p.eyeColors),
    hairColors: arr(p.hairColors),
    cupSizes: arr(p.cupSizes).map((c) => String(c).toUpperCase().slice(0, 1)),
    requiredTags: arr(p.requiredTags),
    excludedTags: arr(p.excludedTags),
    minHeightCm: numOrNull(p.minHeightCm),
    maxHeightCm: numOrNull(p.maxHeightCm),
    minAge: numOrNull(p.minAge),
    maxAge: numOrNull(p.maxAge),
    minOCount: numOrNull(p.minOCount),
    weights: Object.assign({}, DEFAULT_WEIGHTS, (p.weights && typeof p.weights === "object") ? p.weights : {}),
    topMatches: Math.max(1, Math.min(500, +p.topMatches || 25)),
  };
}

function arr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);
  if (typeof v === "string") return v.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}

function numOrNull(v) {
  if (v == null || v === "") return null;
  const n = +v;
  return isNaN(n) ? null : n;
}

function categoricalMatch(value, preferred, opts) {
  if (!preferred.length) return null;          // not constraining; drops out of denom
  if (value == null || value === "") return opts.includeUnknown ? 0.5 : 0;
  return preferred.includes(value) ? 1 : 0;
}

function numericRangeMatch(value, min, max, tail, opts) {
  if (min == null && max == null) return null;
  if (value == null || isNaN(value)) return opts.includeUnknown ? 0.5 : 0;
  const lo = min == null ? -Infinity : min;
  const hi = max == null ? Infinity : max;
  if (value >= lo && value <= hi) return 1;
  // Linear falloff outside the range, dropping to 0 once we're tail away.
  const dist = value < lo ? lo - value : value - hi;
  return Math.max(0, 1 - dist / tail);
}

function tagOverlapMatch(tagNames, required, excluded) {
  if (excluded.length && tagNames.some((t) => excluded.includes(t))) return 0;
  if (!required.length) return null;
  const set = new Set(tagNames);
  let hit = 0;
  for (const t of required) if (set.has(t)) hit++;
  return hit / required.length;
}

function scorePerformer(e, profile, opts) {
  const w = profile.weights;
  const contributions = {};
  let num = 0, denom = 0;

  function add(key, m) {
    if (m == null) return;
    contributions[key] = { match: +m.toFixed(3), weight: w[key] || 0 };
    num += (w[key] || 0) * m;
    denom += w[key] || 0;
  }

  add("country", categoricalMatch(e.country, profile.countries, opts));
  add("ethnicity", categoricalMatch(e.ethnicity, profile.ethnicities, opts));
  add("eyeColor", categoricalMatch(e.eyeColor, profile.eyeColors, opts));
  add("hairColor", categoricalMatch(e.hairColor, profile.hairColors, opts));
  add("cup", categoricalMatch(e.cupLetter, profile.cupSizes, opts));
  add("height", numericRangeMatch(e.heightCm, profile.minHeightCm, profile.maxHeightCm, 10, opts));
  add("age", numericRangeMatch(e.age, profile.minAge, profile.maxAge, 5, opts));
  if (profile.minOCount != null) {
    const ratio = Math.min(1, e.avgSceneO / Math.max(0.01, profile.minOCount));
    add("oCount", ratio);
  }
  if (profile.requiredTags.length || profile.excludedTags.length) {
    add("tagOverlap", tagOverlapMatch(e.tagNames || [], profile.requiredTags, profile.excludedTags));
  }
  if (w.rating > 0 && e.rating100 != null) {
    add("rating", e.rating100 / 100);
  } else if (w.rating > 0 && opts.includeUnknown) {
    add("rating", 0.5);
  }

  const score = denom === 0 ? 50 : (100 * num / denom);
  return { score: +score.toFixed(2), contributions };
}

function attachPerformerTags(enriched, performers) {
  const tagsById = new Map(performers.map((p) => [p.id, (p.tags || []).map((t) => t.name)]));
  for (const e of enriched) e.tagNames = tagsById.get(e.id) || [];
}

function rankPerformers(enriched, profile, opts, minScore) {
  return enriched
    .map((e) => {
      const { score, contributions } = scorePerformer(e, profile, opts);
      return {
        id: e.id, name: e.name, country: e.country, ethnicity: e.ethnicity,
        eyeColor: e.eyeColor, hairColor: e.hairColor, cupLetter: e.cupLetter,
        heightCm: e.heightCm, age: e.age, avgSceneO: +e.avgSceneO.toFixed(2),
        sceneCount: e.sceneCount, performerO: e.performerO,
        rating100: e.rating100, favorite: e.favorite,
        score, contributions,
      };
    })
    .filter((m) => m.score >= (minScore || 0))
    .sort((a, b) => b.score - a.score)
    .slice(0, profile.topMatches);
}

function rankScenes(scenes, scoredPerformers, profile, opts, minScore) {
  const perfScoreById = new Map(scoredPerformers.map((p) => [p.id, p.score]));
  const requiredTags = new Set(profile.requiredTags);
  const excludedTags = new Set(profile.excludedTags);
  const w = profile.weights;
  const out = [];

  for (const s of scenes) {
    const tagNames = (s.tags || []).map((t) => t.name);
    if (tagNames.some((t) => excludedTags.has(t))) continue;
    if (s.performers && s.performers.some((p) => false)) continue; // placeholder for future per-performer exclusion

    // Tag overlap match
    const tagsMatch = requiredTags.size
      ? tagNames.filter((t) => requiredTags.has(t)).length / requiredTags.size
      : null;

    // Performer-driven score = max of any scored performer (most flattering),
    // mean = how well the cast as a whole matches. Both are surfaced.
    const perfScores = (s.performers || [])
      .map((p) => perfScoreById.get(p.id))
      .filter((x) => x != null);
    if (!perfScores.length) continue;
    const maxPerf = Math.max.apply(null, perfScores);
    const meanPerf = perfScores.reduce((a, b) => a + b, 0) / perfScores.length;

    // O-count match for the scene specifically
    const sceneO = s.o_counter || 0;
    const oMatch = profile.minOCount != null
      ? Math.min(1, sceneO / Math.max(0.01, profile.minOCount))
      : null;

    let num = 0, denom = 0;
    const contribs = {};
    function add(key, weight, m, suffix) {
      if (m == null) return;
      contribs[key] = { match: +m.toFixed(3), weight };
      num += weight * m;
      denom += weight;
    }
    // Performer match contributes via meanPerf (so casts with one good
    // match and three weak ones don't blow past genuinely well-matched
    // scenes). maxPerf is shown as a tie-breaker.
    add("performerMean", 1.0, meanPerf / 100);
    add("tagOverlap", w.tagOverlap || 1, tagsMatch);
    add("sceneOCount", (w.oCount || 1) * 0.5, oMatch);
    add("rating", w.rating || 0.3, s.rating100 != null ? s.rating100 / 100 : (opts.includeUnknown ? 0.5 : 0));

    const score = denom === 0 ? meanPerf : (100 * num / denom);
    if (score < (minScore || 0)) continue;

    out.push({
      id: s.id, title: s.title || ("Scene " + s.id), date: s.date,
      studio: s.studio ? s.studio.name : null,
      tagNames, performers: (s.performers || []).map((p) => p.name),
      performerIds: (s.performers || []).map((p) => p.id),
      sceneO, rating100: s.rating100,
      score: +score.toFixed(2),
      maxPerformerScore: +maxPerf.toFixed(2),
      meanPerformerScore: +meanPerf.toFixed(2),
      contributions: contribs,
    });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, profile.topMatches);
}

function findMatches(performers, scenes, rawProfile, opts) {
  const profile = normalizeProfile(rawProfile);
  const settings = opts || {};
  const matchOpts = { includeUnknown: !!settings.matchIncludeUnknown };
  const minScore = +settings.matchMinScore || 0;

  const enriched = enrichPerformers(performers, scenes);
  attachPerformerTags(enriched, performers);
  const performersRanked = rankPerformers(enriched, profile, matchOpts, minScore);
  const scenesRanked = rankScenes(scenes, performersRanked.length ? performersRanked : enriched.map((e) => ({
    id: e.id, name: e.name, score: 50,
  })), profile, matchOpts, minScore);

  return {
    computedAt: new Date().toISOString(),
    profile,
    matchMinScore: minScore,
    includeUnknown: matchOpts.includeUnknown,
    performers: performersRanked,
    scenes: scenesRanked,
    summary: {
      totalPerformersConsidered: enriched.length,
      totalScenesConsidered: scenes.length,
      performersAboveThreshold: performersRanked.length,
      scenesAboveThreshold: scenesRanked.length,
      meanPerformerScore: avg(performersRanked.map((p) => p.score)),
      bestPerformerScore: performersRanked[0] ? performersRanked[0].score : null,
      bestSceneScore: scenesRanked[0] ? scenesRanked[0].score : null,
    },
  };
}

function avg(arr) {
  if (!arr.length) return null;
  return +(arr.reduce((s, x) => s + x, 0) / arr.length).toFixed(2);
}

module.exports = {
  findMatches,
  normalizeProfile,
  scorePerformer,
  DEFAULT_WEIGHTS,
};
