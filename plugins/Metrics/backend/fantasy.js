"use strict";

/* Fantasy Builder.
 *
 * Reverse-engineers a preference profile from a "seed" set of performers.
 * The seed defaults to the user's Stash favorites (or top-rated, or
 * top-O, depending on the chosen mode) but can be passed as an explicit
 * id list too.
 *
 * Output:
 *
 *   - derivedProfile: a preference profile compatible with recommender.js.
 *       Categorical axes are populated with the values present in ≥ 50%
 *       of seeds; numeric axes use the median ± one IQR.
 *
 *   - axisHits: per axis, what fraction of seeds had each value. Drives
 *       the visualisation ("75% of your favorites are Blonde, 60% are
 *       Caucasian, …").
 *
 *   - combinations: top combinations of (country, eyeColor, cup) +
 *       (country, ethnicity, cup) that the seed set covered. Useful when
 *       the seed is small and a 50% threshold leaves the derived profile
 *       almost empty.
 *
 *   - rerunHints: the parameters you'd plug into recommender.findMatches()
 *       to run the derived profile.
 *
 * The Fantasy tab plumbs `derivedProfile` straight into the recommender to
 * produce ranked "performers most like your dream profile" / "scenes most
 * like your dream profile" lists. */

const { enrichPerformers, parseCupOrdinal } = require("./correlations");

function median(xs) {
  const v = xs.filter((x) => x != null && !isNaN(x)).map(Number).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

function quartile(xs, q) {
  const v = xs.filter((x) => x != null && !isNaN(x)).map(Number).sort((a, b) => a - b);
  if (!v.length) return null;
  const pos = (v.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return v[base + 1] != null ? v[base] + rest * (v[base + 1] - v[base]) : v[base];
}

function selectSeed(performers, scenes, opts) {
  const explicit = (opts.seedPerformerIds || []).filter(Boolean);
  if (explicit.length) {
    const set = new Set(explicit.map(String));
    return performers.filter((p) => set.has(String(p.id)));
  }
  const mode = opts.mode || "favorites";
  if (mode === "favorites") {
    const favs = performers.filter((p) => p.favorite);
    if (favs.length >= 3) return favs;
    // Fall through to ratings if there aren't enough favourites.
  }
  if (mode === "top-rated" || mode === "favorites") {
    const sorted = performers.filter((p) => p.rating100 != null)
      .sort((a, b) => (b.rating100 || 0) - (a.rating100 || 0))
      .slice(0, Math.max(10, opts.seedSize || 25));
    if (sorted.length) return sorted;
  }
  if (mode === "top-o" || mode === "favorites" || mode === "top-rated") {
    const enriched = enrichPerformers(performers, scenes);
    const sorted = enriched
      .sort((a, b) => b.avgSceneO - a.avgSceneO)
      .slice(0, Math.max(10, opts.seedSize || 25))
      .map((e) => performers.find((p) => p.id === e.id))
      .filter(Boolean);
    return sorted;
  }
  return performers.slice(0, opts.seedSize || 25);
}

function categoricalConsensus(seed, attr, threshold) {
  const counts = new Map();
  let denom = 0;
  for (const p of seed) {
    const v = p[attr];
    if (v == null || v === "") continue;
    counts.set(v, (counts.get(v) || 0) + 1);
    denom++;
  }
  if (!denom) return { values: [], hits: [] };
  const hits = Array.from(counts.entries())
    .map(([value, n]) => ({ value, n, share: +(n / denom).toFixed(3) }))
    .sort((a, b) => b.n - a.n);
  return {
    values: hits.filter((h) => h.share >= threshold).map((h) => h.value),
    hits,
    coverage: +(denom / seed.length).toFixed(3),
  };
}

function combinationCounts(seed, attrA, attrB, attrC, topN) {
  const map = new Map();
  for (const p of seed) {
    const a = p[attrA], b = p[attrB];
    const c = attrC === "cupLetter" ? letterFromMeasurements(p.measurements) : p[attrC];
    if (!a || !b || !c) continue;
    const key = a + " · " + b + " · " + c;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map, ([key, value]) => ({ combination: key, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, topN || 10);
}

function letterFromMeasurements(m) {
  const ord = parseCupOrdinal(m);
  if (!ord) return null;
  return "ABCDEFGHIJK"[ord - 1];
}

function tagConsensus(seed, scenes, threshold, topN) {
  // Per seed performer, the set of all tags from their scenes.
  const tagSetByPerf = new Map();
  for (const s of scenes) {
    for (const p of s.performers || []) {
      const set = tagSetByPerf.get(p.id) || new Set();
      for (const t of s.tags || []) set.add(t.name);
      tagSetByPerf.set(p.id, set);
    }
  }
  const counts = new Map();
  for (const p of seed) {
    const set = tagSetByPerf.get(p.id);
    if (!set) continue;
    for (const t of set) counts.set(t, (counts.get(t) || 0) + 1);
  }
  if (!seed.length) return { values: [], hits: [] };
  const hits = Array.from(counts.entries())
    .map(([value, n]) => ({ value, n, share: +(n / seed.length).toFixed(3) }))
    .sort((a, b) => b.n - a.n);
  return {
    values: hits.filter((h) => h.share >= threshold).slice(0, topN || 10).map((h) => h.value),
    hits: hits.slice(0, topN || 10),
  };
}

// Scene recipes: synthesises one-line "build me a fantasy scene like X"
// blueprints by combining the derived profile's strongest categorical
// values with the top-scoring multi-axis combinations and the most
// common tags. Each recipe is a concrete shopping list: which performer
// types + tag combinations to look for.
function buildSceneRecipes(derivedProfile, axisHits, combinations, opts) {
  opts = opts || {};
  const max = opts.maxRecipes || 6;
  const recipes = [];

  function pushRecipe(label, performerSpec, tagSpec, notes) {
    if (recipes.length >= max) return;
    recipes.push({ label, performerSpec, tagSpec, notes });
  }

  // 1. Recipe from the top consensus axes — the "default" build.
  const cs = derivedProfile.countries || [];
  const es = derivedProfile.ethnicities || [];
  const eyes = derivedProfile.eyeColors || [];
  const cups = derivedProfile.cupSizes || [];
  const tags = derivedProfile.requiredTags || [];
  const tagLabel = tags.length ? tags.slice(0, 3).join(" + ") : "(no tag consensus)";
  if (cs.length || es.length || cups.length) {
    pushRecipe(
      "Default profile",
      [
        cs.length ? "country: " + cs.slice(0, 3).join(" / ") : null,
        es.length ? "ethnicity: " + es.slice(0, 3).join(" / ") : null,
        eyes.length ? "eyes: " + eyes.slice(0, 3).join(" / ") : null,
        cups.length ? "cup: " + cups.slice(0, 3).join(" / ") : null,
        (derivedProfile.minAge != null || derivedProfile.maxAge != null)
          ? "age " + (derivedProfile.minAge || "?") + "–" + (derivedProfile.maxAge || "?") : null,
      ].filter(Boolean).join(" · "),
      tagLabel,
      "exact intersection of the strongest consensus axes"
    );
  }

  // 2. Recipes from the strongest combinations
  for (const combo of (combinations.countryEyeCup || []).slice(0, 3)) {
    const [country, eye, cup] = combo.combination.split(" · ");
    pushRecipe(
      "Combo: " + combo.combination,
      "country " + country + " · " + eye + " eyes · cup " + cup,
      tagLabel,
      "occurs in " + combo.value + " seed performers"
    );
  }
  for (const combo of (combinations.countryEthnicityCup || []).slice(0, 2)) {
    const [country, ethnicity, cup] = combo.combination.split(" · ");
    pushRecipe(
      "Combo: " + combo.combination,
      country + " · " + ethnicity + " · cup " + cup,
      tagLabel,
      "ethnicity-led match, " + combo.value + " seed performers"
    );
  }

  // 3. Tag-pair recipes from the tag consensus list
  const tagHits = (axisHits.tags || []).slice(0, 6);
  if (tagHits.length >= 2) {
    for (let i = 0; i < Math.min(3, tagHits.length - 1); i++) {
      pushRecipe(
        "Tag-pair: " + tagHits[i].value + " + " + tagHits[i + 1].value,
        cs.length ? cs[0] + " base" : "any nationality",
        tagHits[i].value + " + " + tagHits[i + 1].value,
        Math.round(tagHits[i].share * 100) + "% / " +
        Math.round(tagHits[i + 1].share * 100) + "% seed coverage"
      );
    }
  }
  return recipes.slice(0, max);
}

// -----------------------------------------------------------------------
// FANTASY FILM — the ideal scene format the user's seed keeps producing.
// Duration, resolution, cast size, studio mix, rating band, play/O
// intensity, and 20 representative example scenes.
function buildFantasyFilm(seed, scenes) {
  const seedIds = new Set(seed.map((p) => p.id));
  const seedScenes = scenes.filter((s) =>
    (s.performers || []).some((p) => seedIds.has(p.id)));
  if (!seedScenes.length) return null;

  function maxDur(s) {
    return Math.max.apply(null, (s.files || [{}]).map((f) => f.duration || 0));
  }
  function firstFile(s) { return (s.files && s.files[0]) || {}; }
  function resolutionBucket(h) {
    if (!h) return "Unknown";
    if (h >= 2000) return "4K+";
    if (h >= 1080) return "1080p";
    if (h >= 720) return "720p";
    if (h >= 480) return "480p";
    return "<480p";
  }

  const durations = seedScenes.map(maxDur).filter((d) => d > 0);
  const ratings = seedScenes.map((s) => s.rating100).filter((r) => r != null);
  const resolutions = new Map();
  for (const s of seedScenes) {
    const b = resolutionBucket(firstFile(s).height);
    resolutions.set(b, (resolutions.get(b) || 0) + 1);
  }
  const topResolutions = Array.from(resolutions, ([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  const studios = new Map();
  for (const s of seedScenes) {
    const k = s.studio ? s.studio.name : "Unknown";
    studios.set(k, (studios.get(k) || 0) + 1);
  }
  const topStudios = Array.from(studios, ([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value).slice(0, 10);

  const cast = { solo: 0, pair: 0, group: 0 };
  for (const s of seedScenes) {
    const n = (s.performers || []).length;
    if (n <= 1) cast.solo++;
    else if (n === 2) cast.pair++;
    else cast.group++;
  }

  const durMed = median(durations);
  const durLo = quartile(durations, 0.25);
  const durHi = quartile(durations, 0.75);
  const ratMed = median(ratings);
  const ratLo = quartile(ratings, 0.25);
  const ratHi = quartile(ratings, 0.75);

  const avgPlays = seedScenes.reduce((s, sc) => s + (sc.play_count || 0), 0) / seedScenes.length;
  const avgO = seedScenes.reduce((s, sc) => s + (sc.o_counter || 0), 0) / seedScenes.length;

  // Top 20 representative scenes — by rating, then by play_count as tiebreak.
  const exemplars = seedScenes
    .slice()
    .sort((a, b) => (b.rating100 || 0) - (a.rating100 || 0)
      || (b.play_count || 0) - (a.play_count || 0))
    .slice(0, 20)
    .map((s) => ({
      id: s.id,
      title: s.title || ("Scene " + s.id),
      date: s.date,
      studio: s.studio ? s.studio.name : null,
      rating100: s.rating100,
      playCount: s.play_count || 0,
      oCount: s.o_counter || 0,
      durationSec: Math.round(maxDur(s)),
      resolution: resolutionBucket(firstFile(s).height),
      performers: (s.performers || []).map((p) => p.name),
      tags: (s.tags || []).slice(0, 6).map((t) => t.name),
    }));

  return {
    seedSceneCount: seedScenes.length,
    duration: {
      medianSec: durMed != null ? Math.round(durMed) : null,
      iqrSec: [durLo != null ? Math.round(durLo) : null, durHi != null ? Math.round(durHi) : null],
    },
    rating: {
      median: ratMed != null ? Math.round(ratMed) : null,
      iqr: [ratLo != null ? Math.round(ratLo) : null, ratHi != null ? Math.round(ratHi) : null],
      ratedShare: +(ratings.length / seedScenes.length).toFixed(3),
    },
    resolutions: topResolutions,
    topStudios,
    castComposition: cast,
    avgPlays: +avgPlays.toFixed(2),
    avgO: +avgO.toFixed(2),
    exemplars,
  };
}

// -----------------------------------------------------------------------
// FANTASY TAG STACK — the tags that consistently appear across your seed's
// scenes, the pairs that co-occur most, and the tags your seed
// systematically AVOIDS (present library-wide but almost absent in the
// seed).
function buildFantasyTagStack(seed, scenes) {
  const seedIds = new Set(seed.map((p) => p.id));
  const seedScenes = scenes.filter((s) =>
    (s.performers || []).some((p) => seedIds.has(p.id)));
  if (!seedScenes.length) return null;

  // Per-scene tag frequency within the seed's scenes.
  const seedTagCount = new Map();
  for (const s of seedScenes) {
    const uniq = new Set((s.tags || []).map((t) => t.name));
    for (const t of uniq) seedTagCount.set(t, (seedTagCount.get(t) || 0) + 1);
  }
  const totalSeedScenes = seedScenes.length;
  const signature = Array.from(seedTagCount, ([name, count]) => ({
    name, count, share: +(count / totalSeedScenes).toFixed(3),
  })).sort((a, b) => b.count - a.count);

  // Tag pairs — every unordered pair that appears in a seed scene.
  const pairCount = new Map();
  for (const s of seedScenes) {
    const uniq = Array.from(new Set((s.tags || []).map((t) => t.name))).sort();
    for (let i = 0; i < uniq.length; i++) {
      for (let j = i + 1; j < uniq.length; j++) {
        const key = uniq[i] + " " + uniq[j];
        pairCount.set(key, (pairCount.get(key) || 0) + 1);
      }
    }
  }
  const pairs = Array.from(pairCount, ([key, count]) => {
    const [a, b] = key.split(" ");
    return { a, b, count, share: +(count / totalSeedScenes).toFixed(3) };
  }).sort((x, y) => y.count - x.count).slice(0, 25);

  // Tag triples — same idea, top 15.
  const tripleCount = new Map();
  for (const s of seedScenes) {
    const uniq = Array.from(new Set((s.tags || []).map((t) => t.name))).sort();
    if (uniq.length < 3) continue;
    for (let i = 0; i < uniq.length; i++) {
      for (let j = i + 1; j < uniq.length; j++) {
        for (let k = j + 1; k < uniq.length; k++) {
          const key = uniq[i] + " " + uniq[j] + " " + uniq[k];
          tripleCount.set(key, (tripleCount.get(key) || 0) + 1);
        }
      }
    }
  }
  const triples = Array.from(tripleCount, ([key, count]) => {
    const parts = key.split(" ");
    return { a: parts[0], b: parts[1], c: parts[2], count, share: +(count / totalSeedScenes).toFixed(3) };
  }).sort((x, y) => y.count - x.count).slice(0, 15);

  // Anti-tags — tags that are common LIBRARY-WIDE but almost absent in the
  // seed's scenes. Signals what the user's seed systematically skips.
  const libraryTagCount = new Map();
  for (const s of scenes) {
    const uniq = new Set((s.tags || []).map((t) => t.name));
    for (const t of uniq) libraryTagCount.set(t, (libraryTagCount.get(t) || 0) + 1);
  }
  const libraryTotal = scenes.length || 1;
  const antiTags = Array.from(libraryTagCount, ([name, libCount]) => {
    const seedCount = seedTagCount.get(name) || 0;
    const libShare = libCount / libraryTotal;
    const seedShare = seedCount / totalSeedScenes;
    // Only flag tags that are non-trivially present in the library and
    // strongly absent from the seed. Ratio > 5x = library relies on them,
    // seed rarely touches them.
    if (libShare < 0.05 || libCount < 10) return null;
    if (seedShare >= libShare * 0.35) return null;
    return {
      name, seedCount, libraryCount: libCount,
      seedShare: +seedShare.toFixed(3),
      libraryShare: +libShare.toFixed(3),
      relativeAvoidance: +(1 - seedShare / libShare).toFixed(3),
    };
  }).filter(Boolean)
    .sort((a, b) => b.relativeAvoidance - a.relativeAvoidance)
    .slice(0, 15);

  // "Fantasy tag stack" — the compact recipe a user could copy-paste into a
  // Stash filter: signature tags with ≥40% consensus + always-together pairs.
  const strongStack = signature.filter((t) => t.share >= 0.4).slice(0, 12).map((t) => t.name);

  return {
    seedSceneCount: totalSeedScenes,
    signature: signature.slice(0, 30),
    strongStack,
    pairs,
    triples,
    antiTags,
  };
}

function computeFantasy(performers, scenes, opts) {
  opts = opts || {};
  const threshold = opts.consensusThreshold || 0.5;
  const seed = selectSeed(performers, scenes, opts);
  if (!seed.length) {
    return {
      seedMode: opts.mode || "favorites",
      seedSize: 0,
      derivedProfile: {},
      axisHits: {},
      combinations: {},
      message: "No seed performers — favourite some performers, rate them, or pass seedPerformerIds.",
    };
  }

  const country = categoricalConsensus(seed, "country", threshold);
  const ethnicity = categoricalConsensus(seed, "ethnicity", threshold);
  const eyeColor = categoricalConsensus(seed, "eye_color", threshold);
  const hairColor = categoricalConsensus(seed, "hair_color", threshold);
  // Cup is derived from `measurements` so we need a transient field.
  const seedCup = seed.map((p) => Object.assign({}, p, { cupLetter: letterFromMeasurements(p.measurements) }));
  const cup = categoricalConsensus(seedCup, "cupLetter", threshold);
  const tagsHit = tagConsensus(seed, scenes, threshold, 12);

  const heights = seed.map((p) => p.height_cm).filter(Boolean);
  const ages = seed.map((p) => {
    if (!p.birthdate) return null;
    const b = new Date(p.birthdate);
    if (isNaN(b.getTime())) return null;
    return new Date().getFullYear() - b.getFullYear();
  }).filter((a) => a != null);

  const heightMedian = median(heights);
  const heightLo = quartile(heights, 0.25);
  const heightHi = quartile(heights, 0.75);
  const ageMedian = median(ages);
  const ageLo = quartile(ages, 0.25);
  const ageHi = quartile(ages, 0.75);

  // O signal from the enriched seed.
  const enriched = enrichPerformers(seed, scenes);
  const seedAvgO = enriched.length
    ? +(enriched.reduce((s, e) => s + e.avgSceneO, 0) / enriched.length).toFixed(2)
    : 0;

  const derivedProfile = {
    countries: country.values,
    ethnicities: ethnicity.values,
    eyeColors: eyeColor.values,
    hairColors: hairColor.values,
    cupSizes: cup.values,
    requiredTags: tagsHit.values,
    minHeightCm: heightLo != null ? Math.round(heightLo) : null,
    maxHeightCm: heightHi != null ? Math.round(heightHi) : null,
    minAge: ageLo != null ? Math.round(ageLo) : null,
    maxAge: ageHi != null ? Math.round(ageHi) : null,
    minOCount: seedAvgO > 0.3 ? +seedAvgO.toFixed(2) : null,
    weights: {
      country: country.hits.length ? 1.0 : 0,
      ethnicity: ethnicity.hits.length ? 0.8 : 0,
      eyeColor: eyeColor.hits.length ? 0.7 : 0,
      hairColor: hairColor.hits.length ? 0.5 : 0,
      cup: cup.hits.length ? 0.9 : 0,
      height: heightLo != null ? 0.5 : 0,
      age: ageLo != null ? 0.6 : 0,
      oCount: seedAvgO > 0.3 ? 1.2 : 0,
      tagOverlap: tagsHit.values.length ? 1.0 : 0,
      rating: 0.3,
    },
    topMatches: opts.topMatches || 25,
  };

  const axisHits = {
    country: country.hits,
    ethnicity: ethnicity.hits,
    eyeColor: eyeColor.hits,
    hairColor: hairColor.hits,
    cup: cup.hits,
    tags: tagsHit.hits,
  };
  const combinations = {
    countryEyeCup: combinationCounts(
      seed.map((p) => Object.assign({}, p, { cupLetter: letterFromMeasurements(p.measurements) })),
      "country", "eye_color", "cupLetter", 10
    ),
    countryEthnicityCup: combinationCounts(
      seed.map((p) => Object.assign({}, p, { cupLetter: letterFromMeasurements(p.measurements) })),
      "country", "ethnicity", "cupLetter", 10
    ),
  };

  return {
    seedMode: opts.mode || "favorites",
    seedSize: seed.length,
    seedSample: seed.slice(0, 15).map((p) => ({ id: p.id, name: p.name })),
    derivedProfile,
    axisHits,
    statsSummary: {
      heightMedian, heightIQR: [heightLo, heightHi],
      ageMedian, ageIQR: [ageLo, ageHi],
      seedAvgO,
    },
    combinations,
    sceneRecipes: buildSceneRecipes(derivedProfile, axisHits, combinations, { maxRecipes: opts.maxRecipes || 6 }),
    // v1.4 — Fantasy Film + Fantasy Tag Stack derived from the same seed.
    fantasyFilm: buildFantasyFilm(seed, scenes),
    fantasyTagStack: buildFantasyTagStack(seed, scenes),
  };
}

module.exports = { computeFantasy, selectSeed };
