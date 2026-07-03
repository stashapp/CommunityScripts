#!/usr/bin/env node
"use strict";

/* Offline smoke test. Runs the aggregator over a synthetic library and
 * asserts the headline metrics line up. No network / Stash required. */

const assert = require("assert");
const { aggregate } = require("./aggregate");
const { computeCorrelations, parseCupOrdinal, cramersV, pearson } = require("./correlations");
const { findMatches, normalizeProfile, scorePerformer, DEFAULT_WEIGHTS } = require("./recommender");
const { computePlayHistory, buildHeatmap, streakStats } = require("./play_history");
const { computeArchetypes, kmeans, cosineSim } = require("./clustering");
const { computeDiversity, indices } = require("./diversity");
const { computeTemporal } = require("./temporal");
const { computeFantasy } = require("./fantasy");
const { computeYearReview } = require("./year_review");
const { computeQuality, libraryHealth, hiddenGems, completionRates } = require("./quality");

const performers = [
  { id: "p1", name: "Alice", gender: "FEMALE", country: "US", ethnicity: "Caucasian",
    height_cm: 168, weight: 55, measurements: "34B-25-35",
    tattoos: "back", piercings: "navel", career_length: "2018-present",
    birthdate: "1995-06-01", favorite: true, rating100: 85, scene_count: 3 },
  { id: "p2", name: "Bea", gender: "FEMALE", country: "UK", ethnicity: "Caucasian",
    height_cm: 172, weight: 60, measurements: "32C-26-34",
    tattoos: null, piercings: "none", career_length: "2015-2022",
    birthdate: "1990-02-12", favorite: false, rating100: 70, scene_count: 5 },
  { id: "p3", name: "Cody", gender: "MALE", country: "US", ethnicity: "Black",
    height_cm: 183, weight: 80, measurements: null,
    tattoos: "sleeve", piercings: null, career_length: "5y",
    birthdate: "1988-11-22", favorite: false, rating100: 60, scene_count: 4 },
];

const tags = [
  { id: "t1", name: "Outdoor", children: [{ id: "t4", name: "Beach" }], scene_count: 2 },
  { id: "t2", name: "Dialogue", children: [], scene_count: 4 },
  { id: "t3", name: "POV", children: [], scene_count: 3 },
  { id: "t4", name: "Beach", children: [], scene_count: 1 },
];

const studios = [
  { id: "s1", name: "Foo Studio", scene_count: 3 },
  { id: "s2", name: "Bar Studio", scene_count: 2 },
];

const scenes = [
  { id: "sc1", date: "2024-01-12", created_at: "2024-01-15T08:00:00Z", rating100: 80, organized: true, o_counter: 2,
    play_count: 5, play_duration: 7500, last_played_at: "2026-06-20T22:00:00Z",
    play_history: ["2026-06-20T22:00:00Z", "2026-06-21T22:30:00Z", "2026-06-25T23:00:00Z", "2026-06-26T22:15:00Z", "2026-06-29T21:00:00Z"],
    studio: { id: "s1", name: "Foo Studio" },
    performers: [{ id: "p1", name: "Alice", gender: "FEMALE" }, { id: "p3", name: "Cody", gender: "MALE" }],
    tags: [{ id: "t1", name: "Outdoor" }, { id: "t3", name: "POV" }, { id: "t4", name: "Beach" }],
    files: [{ size: 1024 * 1024 * 800, duration: 1500, height: 1080, width: 1920, video_codec: "h264" }] },
  { id: "sc2", date: "2024-02-04", created_at: "2024-02-10T08:00:00Z", rating100: 90, organized: false, o_counter: 3,
    play_count: 2, play_duration: 4800, last_played_at: "2026-06-22T20:00:00Z",
    play_history: ["2026-06-22T20:00:00Z", "2026-06-28T20:15:00Z"],
    studio: { id: "s1", name: "Foo Studio" },
    performers: [{ id: "p2", name: "Bea", gender: "FEMALE" }, { id: "p3", name: "Cody", gender: "MALE" }],
    tags: [{ id: "t2", name: "Dialogue" }, { id: "t3", name: "POV" }],
    files: [{ size: 1024 * 1024 * 1400, duration: 2400, height: 2160, width: 3840, video_codec: "h265" }] },
  { id: "sc3", date: "2024-02-22", created_at: "2024-03-01T08:00:00Z", rating100: null, organized: true, o_counter: 0,
    play_count: 0, play_duration: 0, last_played_at: null, play_history: [],
    studio: { id: "s2", name: "Bar Studio" },
    performers: [{ id: "p1", name: "Alice", gender: "FEMALE" }, { id: "p2", name: "Bea", gender: "FEMALE" }],
    tags: [{ id: "t1", name: "Outdoor" }, { id: "t2", name: "Dialogue" }],
    files: [{ size: 1024 * 1024 * 600, duration: 1800, height: 720, width: 1280, video_codec: "h264" }] },
];

const statsBlock = { scene_count: 3, image_count: 0, gallery_count: 0 };

const p = aggregate(statsBlock, performers, tags, studios, scenes, { ageBuckets: 5, topN: 5 });

assert.strictEqual(p.totals.scenes, 3, "scene count");
assert.strictEqual(p.totals.performers, 3, "performer count");
assert.strictEqual(p.organizedRatio.organized, 2, "organized scenes");
assert.strictEqual(p.organizedRatio.unorganized, 1, "unorganized scenes");

const gender = new Map(p.genderDistribution.map((x) => [x.label, x.value]));
assert.strictEqual(gender.get("FEMALE"), 2, "FEMALE count");
assert.strictEqual(gender.get("MALE"), 1, "MALE count");

const tagFreq = new Map(p.tagFrequency.map((x) => [x.label, x.value]));
assert.strictEqual(tagFreq.get("Outdoor"), 2, "Outdoor appears in 2 scenes");
assert.strictEqual(tagFreq.get("POV"), 2, "POV appears in 2 scenes");

const pair = p.topPerformerPairs.find((x) =>
  (x.a === "Alice" && x.b === "Cody") || (x.a === "Cody" && x.b === "Alice"));
assert(pair, "Alice/Cody co-occur");

const res = new Map(p.resolutionDistribution.map((x) => [x.label, x.value]));
assert.strictEqual(res.get("1080p"), 1);
assert.strictEqual(res.get("4K+"), 1);
assert.strictEqual(res.get("720p"), 1);

assert.strictEqual(p.studioTagHeatmap.studios.length, 2);
assert(p.studioTagHeatmap.matrix.length === 2);

assert(p.scenesPerMonth.labels.includes("2024-01"));
assert(p.scenesPerMonth.labels.includes("2024-02"));

assert.strictEqual(p.kpis.countries, 2, "Two countries represented");

console.log("OK  aggregate() — totals, genders, tag co-occurrence, time series, heatmap");

// ---- Correlations
assert.strictEqual(parseCupOrdinal("34B-25-35"), 2, "cup B parses to 2");
assert.strictEqual(parseCupOrdinal("32C-26-34"), 3, "cup C parses to 3");
assert.strictEqual(parseCupOrdinal(""), null, "empty parses to null");

// Cramér's V on a perfectly associated 2x2 table is 1; on uniform table is 0.
assert.strictEqual(+cramersV({ a: { x: 10 }, b: { y: 10 } }).toFixed(2), 1,
  "perfect association → V = 1");
assert.strictEqual(+cramersV({ a: { x: 5, y: 5 }, b: { x: 5, y: 5 } }).toFixed(2), 0,
  "uniform table → V = 0");

// Pearson on a monotonic increasing sequence should be exactly 1.
assert.strictEqual(+pearson([[1, 2], [2, 4], [3, 6]]).toFixed(2), 1, "perfect line → r = 1");

const corr = computeCorrelations(performers, scenes, { minSupport: 1 });
assert.ok(corr.perAttribute, "perAttribute present");
assert.ok(corr.heatmaps.countryEye, "country×eye heatmap present");
assert.ok(corr.heatmaps.countryCup.rows.length >= 1, "country×cup has rows");
assert.ok(corr.bubbles.length >= 1, "at least one performer bubble");
assert.ok(corr.parallel.lines.length === performers.length, "parallel coords covers all performers");
assert.ok(corr.cramersV.country != null, "cramers V for country");

const corrAgg = aggregate(
  { scene_count: 3, image_count: 0, gallery_count: 0 },
  performers, tags, studios, scenes,
  { enableCorrelations: true, correlationMinSupport: 1 }
);
assert.ok(corrAgg.correlations, "aggregate payload includes correlations");

// ---- Recommender
const profile = normalizeProfile({
  countries: ["US"],
  cupSizes: ["B"],
  requiredTags: ["Outdoor"],
  weights: { country: 1, cup: 1, tagOverlap: 1, ethnicity: 0, eyeColor: 0, hairColor: 0, height: 0, age: 0, oCount: 0, rating: 0 },
});
const enrichedAlice = {
  id: "p1", name: "Alice", country: "US", ethnicity: "Caucasian",
  cupLetter: "B", heightCm: 168, age: 30, avgSceneO: 1, sceneCount: 2,
  performerO: 0, rating100: 85, favorite: true, tagNames: ["Outdoor"],
};
const enrichedCody = {
  id: "p3", name: "Cody", country: "US", ethnicity: "Black",
  cupLetter: null, heightCm: 183, age: 35, avgSceneO: 2.5, sceneCount: 2,
  performerO: 0, rating100: 60, favorite: false, tagNames: ["Outdoor", "POV"],
};
const aliceScored = scorePerformer(enrichedAlice, profile, { includeUnknown: false });
const codyScored = scorePerformer(enrichedCody, profile, { includeUnknown: false });
assert.ok(aliceScored.score > codyScored.score,
  "Alice (US, cup B, Outdoor) outranks Cody (US, no cup, Outdoor) — got " +
  aliceScored.score + " vs " + codyScored.score);
assert.strictEqual(aliceScored.score, 100, "Alice matches every active axis");

const matches = findMatches(performers, scenes, {
  countries: ["US"], cupSizes: ["B"], requiredTags: ["Outdoor"],
  weights: { country: 1, cup: 1, tagOverlap: 1, ethnicity: 0, eyeColor: 0, hairColor: 0, height: 0, age: 0, oCount: 0, rating: 0 },
  topMatches: 10,
}, { matchMinScore: 50, matchIncludeUnknown: false });
assert.ok(matches.performers.length >= 1, "at least one performer match");
assert.strictEqual(matches.performers[0].name, "Alice", "Alice is the top match");
assert.ok(matches.scenes.length >= 1, "at least one scene match");
assert.ok(matches.scenes[0].tagNames.includes("Outdoor"),
  "Top scene match contains required tag");

// Empty profile → rating-only fallback (no other axis is active, default
// weights have rating > 0). Performers without ratings should be omitted
// from the rating contribution; the rest score based on rating100/100.
const noProfile = findMatches(performers, scenes, {}, {});
assert.ok(noProfile.performers.length >= 1, "no-op profile still returns matches");
const alice = noProfile.performers.find((p) => p.name === "Alice");
assert.ok(alice, "Alice present in no-op results");
assert.strictEqual(alice.score, 85, "Empty profile → rating-only score (85/100 for rating 85)");

// Empty profile with all weights zeroed → uniform 50/100 baseline.
const trulyNeutral = findMatches(performers, scenes, {
  weights: { country: 0, ethnicity: 0, eyeColor: 0, hairColor: 0, cup: 0, height: 0, age: 0, oCount: 0, tagOverlap: 0, rating: 0 },
}, {});
assert.ok(trulyNeutral.performers.every((p) => p.score === 50),
  "Zero-weight profile yields the neutral 50/100 baseline");

console.log("OK  correlations — Cramér's V, Pearson, heatmaps, bubbles, parallel");
console.log("OK  recommender — profile scoring, ranking, scene matches, no-op baseline");

// ---- Play history
const ph = computePlayHistory(scenes, performers);
assert.strictEqual(ph.kpis.totalPlays, 7, "total plays summed");
assert.strictEqual(ph.kpis.playedScenes, 2, "two scenes have non-zero play_count");
assert.strictEqual(ph.kpis.unplayedScenes, 1, "one scene has zero play_count");
assert.strictEqual(ph.kpis.hasRichHistory, true, "play_history present");
assert.ok(ph.heatmapTotal === 7, "every play timestamp folded into the heatmap");
assert.ok(ph.mostWatchedScenes[0].id === "sc1", "sc1 is most watched (5 plays)");
assert.ok(ph.mostWatchedPerformers.length >= 1, "ranked performers");
const aliceWatched = ph.mostWatchedPerformers.find((p) => p.name === "Alice");
assert.ok(aliceWatched && aliceWatched.playCount === 5, "Alice has 5 plays via sc1");
const tagPlays = ph.topTagsByPlays.find((t) => t.label === "Outdoor");
assert.ok(tagPlays && tagPlays.value === 5, "Outdoor tag plays sum from sc1 only");

const streaks = streakStats(["2026-06-20T00:00:00Z", "2026-06-21T00:00:00Z", "2026-06-22T00:00:00Z", "2026-06-25T00:00:00Z"]);
assert.strictEqual(streaks.longestStreak, 3, "longest streak = 3 consecutive days");
assert.strictEqual(streaks.uniqueDays, 4, "uniqueDays counts all distinct days");
console.log("OK  play history — totals, heatmap, streaks, most-watched ranking");

// ---- Clustering / archetypes
// Build a synthetic 10-performer set so k-means has enough material.
const synthPerf = [];
for (let i = 0; i < 10; i++) {
  synthPerf.push({
    id: "x" + i, name: "X" + i,
    gender: "FEMALE",
    country: i < 5 ? "US" : "BR",
    ethnicity: i < 5 ? "Caucasian" : "Latin",
    eye_color: i % 2 === 0 ? "Blue" : "Brown",
    hair_color: i % 3 === 0 ? "Blonde" : "Brunette",
    height_cm: 160 + i,
    measurements: (i % 2 === 0 ? "34B" : "32C") + "-25-35",
    birthdate: "199" + (i % 10) + "-01-01",
    favorite: i < 3,
    rating100: 50 + i * 5,
    scene_count: 2,
    tags: [{ id: "t" + (i % 3), name: "Tag" + (i % 3) }],
  });
}
const synthScenes = [];
for (let i = 0; i < 10; i++) {
  synthScenes.push({
    id: "S" + i,
    date: "2024-0" + ((i % 9) + 1) + "-01",
    o_counter: i % 3,
    play_count: i,
    studio: { id: "ss1", name: "Synth Studio" },
    performers: [{ id: synthPerf[i].id, name: synthPerf[i].name }],
    tags: [{ id: "t" + (i % 3), name: "Tag" + (i % 3) }, { id: "tA", name: "Shared" }],
    files: [{ size: 1, duration: 1000, height: 720 }],
  });
}
const arch = computeArchetypes(synthPerf, synthScenes, { k: 3, topSimilar: 3 });
assert.strictEqual(arch.k, 3, "k respected");
assert.strictEqual(arch.clusters.length, 3, "3 clusters produced");
const totalMembers = arch.clusters.reduce((s, c) => s + c.size, 0);
assert.strictEqual(totalMembers, synthPerf.length, "every performer assigned to a cluster");
assert.ok(arch.similarity["x0"] && arch.similarity["x0"].length > 0, "x0 has similar neighbours");
assert.ok(arch.similarity["x0"][0].score >= arch.similarity["x0"][arch.similarity["x0"].length - 1].score,
  "similarity list sorted descending by score");
const kmRes = kmeans([[0, 0], [0, 0.1], [10, 10], [10, 10.1]], 2, { seed: 123 });
const labelA = kmRes.labels[0];
assert.strictEqual(kmRes.labels[1], labelA, "tight cluster A stays together");
assert.notStrictEqual(kmRes.labels[2], labelA, "tight cluster B is separated");
assert.strictEqual(+cosineSim([1, 0, 0], [1, 0, 0]).toFixed(3), 1, "cosine sim self = 1");
assert.strictEqual(+cosineSim([1, 0, 0], [0, 1, 0]).toFixed(3), 0, "cosine sim orthogonal = 0");
console.log("OK  clustering — k-means convergence, cosine similarity, archetypes");

// ---- Diversity
const idx = indices({ counts: new Map([["a", 5], ["b", 5]]) });
assert.strictEqual(+idx.giniSimpson.toFixed(2), 0.5, "two-equal-categories → Gini-Simpson 0.5");
assert.strictEqual(+idx.shannonEvenness.toFixed(2), 1, "two-equal-categories → evenness 1");
const div = computeDiversity(performers, scenes, tags, { minSupport: 2 });
assert.ok(div.diversities.length >= 4, "diversities computed for ≥4 attributes");
assert.ok(div.gaps.coverage.find((c) => c.attribute === "country"), "country coverage row present");
console.log("OK  diversity — Shannon / Gini-Simpson, coverage, gap analysis");

// ---- Temporal
const tmp = computeTemporal(performers, scenes, studios);
assert.ok(tmp.releaseYearHistogram.labels.includes(2024), "2024 in release year histogram");
assert.ok(tmp.activePerformersPerYear.labels.includes(2024), "active performers per year covers 2024");
assert.ok(tmp.careerTimelines.length >= 1, "career timelines computed");
assert.ok(tmp.tagEvolution.labels.includes(2024), "tag evolution covers 2024");
console.log("OK  temporal — release year, active performers, career timelines, tag evolution");

// ---- Fantasy Builder
performers[0].favorite = true;  // Alice
const fantasy = computeFantasy(performers, scenes, { mode: "favorites", consensusThreshold: 0.5 });
assert.ok(fantasy.seedSize >= 1, "seed has at least one performer");
assert.ok(fantasy.derivedProfile, "derived profile produced");
// With only Alice as favourite, 100% of seed shares her country, so country
// must lock in.
assert.deepStrictEqual(fantasy.derivedProfile.countries, ["US"], "Alice's country dominates");
console.log("OK  fantasy — seed selection, consensus thresholds, derived profile");

// ---- Year-in-Review
const yr = computeYearReview(performers, scenes, tags, studios, 2024);
assert.strictEqual(yr.year, 2024, "year set");
assert.ok(yr.summary.totalScenesInYear === 3, "all three scenes counted in 2024");
assert.ok(yr.topPerformers.length > 0, "top performers in year");
assert.ok(yr.topTags.length > 0, "top tags in year");
console.log("OK  year-in-review — summary, top lists");

// ---- Quality
const health = libraryHealth(performers, scenes, tags, {});
assert.ok(health.score > 0 && health.score <= 100, "health score in 0..100");
assert.ok(["A", "A-", "B", "C", "D", "F"].includes(health.grade), "health grade is valid");
assert.ok(health.components.organized > 0, "organized component populated");

// Inject a high-rating, low-play scene to ensure it surfaces as a hidden gem.
const gemScenes = scenes.concat([{
  id: "scGem", title: "Underwatched Treasure", date: "2024-03-30",
  rating100: 95, play_count: 0, o_counter: 0, organized: true,
  studio: { id: "s1", name: "Foo Studio" },
  performers: [{ id: "p2", name: "Bea" }],
  tags: [{ id: "t1", name: "Outdoor" }],
  files: [{ size: 1, duration: 1800, height: 1080, video_codec: "h264" }],
}]);
const gems = hiddenGems(gemScenes, performers, { gemRatingFloor: 80, gemPlayCeiling: 2, topN: 5 });
assert.strictEqual(gems[0].title, "Underwatched Treasure", "highest-rated, zero-play scene leads gem list");
assert.ok(gems[0].gemScore > 100, "gem score includes the never-played bonus");

// Completion rates: sc1 (5 plays, 7500s play, 1500s dur → 1.0 ratio → repeat)
const cr = completionRates(scenes, { topN: 5 });
assert.strictEqual(cr.buckets.repeat, 1, "sc1 counted as a repeat watch");

const fullQuality = computeQuality(performers, scenes, tags, {});
assert.ok(fullQuality.health, "computeQuality returns health");
assert.ok(fullQuality.hiddenGems, "computeQuality returns hidden gems");
assert.ok(fullQuality.completion, "computeQuality returns completion");
console.log("OK  quality — health score, hidden gems, completion, anomalies");

// ---- Fantasy scene recipes
const fantasyRec = require("./fantasy").computeFantasy(performers, scenes, { mode: "favorites" });
assert.ok(Array.isArray(fantasyRec.sceneRecipes), "scene recipes is an array");
console.log("OK  fantasy recipes — array shape");
