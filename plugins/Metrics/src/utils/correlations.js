(function () {
  "use strict";

  // Browser mirror of backend/correlations.js + backend/recommender.js.
  // The two implementations are intentionally duplicated; the README's
  // Extending section calls this out. Behaviour MUST match the backend
  // exactly so the dashboard renders the same numbers regardless of which
  // side produced the cache.

  const ns = (window.StashMetrics = window.StashMetrics || {});
  const corr = (ns.correlations = {});
  const rec = (ns.recommender = {});

  const CUP_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
  const CUP_INDEX = new Map(CUP_ORDER.map((c, i) => [c, i + 1]));
  corr.CUP_ORDER = CUP_ORDER;

  function parseCupOrdinal(measurements) {
    if (!measurements || typeof measurements !== "string") return null;
    const m = measurements.replace(/\s+/g, "").match(/^(\d{2,3})([a-zA-Z]+)?-(\d{2,3})-(\d{2,3})$/);
    if (!m || !m[2]) return null;
    return CUP_INDEX.get(m[2].toUpperCase()[0]) || null;
  }
  corr.parseCupOrdinal = parseCupOrdinal;

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
        id: p.id, name: p.name,
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
        tagNames: (p.tags || []).map((t) => t.name),
      };
    });
  }
  corr.enrichPerformers = enrichPerformers;

  // --- Recommender (browser side) -----------------------------------------

  const DEFAULT_WEIGHTS = {
    country: 1.0, ethnicity: 0.8, eyeColor: 0.7, hairColor: 0.5,
    cup: 0.9, height: 0.5, age: 0.6,
    oCount: 1.2, tagOverlap: 1.0, rating: 0.3,
  };
  rec.DEFAULT_WEIGHTS = DEFAULT_WEIGHTS;

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

  rec.normalizeProfile = function (raw) {
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
  };

  function categoricalMatch(value, preferred, includeUnknown) {
    if (!preferred.length) return null;
    if (value == null || value === "") return includeUnknown ? 0.5 : 0;
    return preferred.includes(value) ? 1 : 0;
  }

  function numericRangeMatch(value, min, max, tail, includeUnknown) {
    if (min == null && max == null) return null;
    if (value == null || isNaN(value)) return includeUnknown ? 0.5 : 0;
    const lo = min == null ? -Infinity : min;
    const hi = max == null ? Infinity : max;
    if (value >= lo && value <= hi) return 1;
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

  rec.scorePerformer = function (e, profile, opts) {
    const w = profile.weights;
    const contributions = {};
    let num = 0, denom = 0;
    function add(key, m) {
      if (m == null) return;
      contributions[key] = { match: +m.toFixed(3), weight: w[key] || 0 };
      num += (w[key] || 0) * m;
      denom += w[key] || 0;
    }
    const includeUnknown = !!(opts && opts.includeUnknown);
    add("country", categoricalMatch(e.country, profile.countries, includeUnknown));
    add("ethnicity", categoricalMatch(e.ethnicity, profile.ethnicities, includeUnknown));
    add("eyeColor", categoricalMatch(e.eyeColor, profile.eyeColors, includeUnknown));
    add("hairColor", categoricalMatch(e.hairColor, profile.hairColors, includeUnknown));
    add("cup", categoricalMatch(e.cupLetter, profile.cupSizes, includeUnknown));
    add("height", numericRangeMatch(e.heightCm, profile.minHeightCm, profile.maxHeightCm, 10, includeUnknown));
    add("age", numericRangeMatch(e.age, profile.minAge, profile.maxAge, 5, includeUnknown));
    if (profile.minOCount != null) {
      const ratio = Math.min(1, e.avgSceneO / Math.max(0.01, profile.minOCount));
      add("oCount", ratio);
    }
    if (profile.requiredTags.length || profile.excludedTags.length) {
      add("tagOverlap", tagOverlapMatch(e.tagNames || [], profile.requiredTags, profile.excludedTags));
    }
    if (w.rating > 0 && e.rating100 != null) {
      add("rating", e.rating100 / 100);
    } else if (w.rating > 0 && includeUnknown) {
      add("rating", 0.5);
    }
    const score = denom === 0 ? 50 : (100 * num / denom);
    return { score: +score.toFixed(2), contributions };
  };

  rec.rankMatches = function (performers, scenes, rawProfile, opts) {
    const profile = rec.normalizeProfile(rawProfile);
    const o = opts || {};
    const includeUnknown = !!o.matchIncludeUnknown;
    const minScore = +o.matchMinScore || 0;
    const enriched = enrichPerformers(performers, scenes);

    const perfResults = enriched
      .map((e) => {
        const { score, contributions } = rec.scorePerformer(e, profile, { includeUnknown });
        return {
          id: e.id, name: e.name, country: e.country, ethnicity: e.ethnicity,
          eyeColor: e.eyeColor, hairColor: e.hairColor, cupLetter: e.cupLetter,
          heightCm: e.heightCm, age: e.age, avgSceneO: +e.avgSceneO.toFixed(2),
          sceneCount: e.sceneCount, performerO: e.performerO,
          rating100: e.rating100, favorite: e.favorite,
          score, contributions,
        };
      })
      .filter((m) => m.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, profile.topMatches);

    const perfScoreById = new Map(perfResults.map((p) => [p.id, p.score]));
    const required = new Set(profile.requiredTags);
    const excluded = new Set(profile.excludedTags);
    const w = profile.weights;
    const sceneResults = [];

    for (const s of scenes) {
      const tagNames = (s.tags || []).map((t) => t.name);
      if (tagNames.some((t) => excluded.has(t))) continue;
      const perfScores = (s.performers || []).map((p) => perfScoreById.get(p.id)).filter((x) => x != null);
      if (!perfScores.length) continue;
      const maxPerf = Math.max.apply(null, perfScores);
      const meanPerf = perfScores.reduce((a, b) => a + b, 0) / perfScores.length;
      const sceneO = s.o_counter || 0;
      const oMatch = profile.minOCount != null
        ? Math.min(1, sceneO / Math.max(0.01, profile.minOCount))
        : null;
      const tagsMatch = required.size
        ? tagNames.filter((t) => required.has(t)).length / required.size
        : null;

      let num = 0, denom = 0;
      const contributions = {};
      function add(key, weight, m) {
        if (m == null) return;
        contributions[key] = { match: +m.toFixed(3), weight };
        num += weight * m;
        denom += weight;
      }
      add("performerMean", 1.0, meanPerf / 100);
      add("tagOverlap", w.tagOverlap || 1, tagsMatch);
      add("sceneOCount", (w.oCount || 1) * 0.5, oMatch);
      add("rating", w.rating || 0.3, s.rating100 != null ? s.rating100 / 100 : (includeUnknown ? 0.5 : 0));
      const score = denom === 0 ? meanPerf : (100 * num / denom);
      if (score < minScore) continue;
      sceneResults.push({
        id: s.id, title: s.title || ("Scene " + s.id), date: s.date,
        studio: s.studio ? s.studio.name : null,
        tagNames, performers: (s.performers || []).map((p) => p.name),
        performerIds: (s.performers || []).map((p) => p.id),
        sceneO, rating100: s.rating100,
        score: +score.toFixed(2),
        maxPerformerScore: +maxPerf.toFixed(2),
        meanPerformerScore: +meanPerf.toFixed(2),
        contributions,
      });
    }
    sceneResults.sort((a, b) => b.score - a.score);
    return {
      computedAt: new Date().toISOString(),
      profile,
      matchMinScore: minScore,
      includeUnknown,
      performers: perfResults,
      scenes: sceneResults.slice(0, profile.topMatches),
      summary: {
        totalPerformersConsidered: enriched.length,
        totalScenesConsidered: scenes.length,
        performersAboveThreshold: perfResults.length,
        scenesAboveThreshold: sceneResults.length,
        bestPerformerScore: perfResults[0] ? perfResults[0].score : null,
        bestSceneScore: sceneResults[0] ? sceneResults[0].score : null,
      },
    };
  };
})();
