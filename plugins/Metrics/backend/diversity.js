"use strict";

/* Diversity and gap analysis.
 *
 * Three diversity indices per categorical attribute:
 *
 *   Shannon entropy        H = -Σ p_i log(p_i)
 *   Shannon evenness       H / log(S)              (0..1, where S = #categories)
 *   Simpson's index        D = Σ p_i²              (lower = more diverse)
 *   Gini-Simpson           1 - D                   (0..1, higher = more diverse)
 *
 * Effective number of categories (also called "Hill number of order 1") is
 * exp(H) — interpretable as "the equivalent number of equally-likely
 * categories that would produce the same entropy". Surfaced because raw
 * Shannon is dimensionless and hard to compare across attributes.
 *
 * Gap analysis flags:
 *
 *   1. Missing-attribute coverage: per attribute, what fraction of
 *      performers have no value? Sparse coverage means the metric is
 *      unreliable.
 *
 *   2. Under-represented values: the bottom-N categories that have at
 *      least 1 but fewer than `minSupport` performers. These are
 *      reasonable hooks to expand the collection on.
 *
 *   3. Tag gaps: tags used in <3 scenes — likely typos, one-offs, or
 *      genuinely rare categories worth a second look. */

function counts(items, keyFn) {
  const m = new Map();
  let nullN = 0;
  for (const it of items) {
    const v = keyFn(it);
    if (v == null || v === "") { nullN++; continue; }
    m.set(v, (m.get(v) || 0) + 1);
  }
  return { counts: m, nullN, total: items.length };
}

function indices(c) {
  const total = Array.from(c.counts.values()).reduce((s, v) => s + v, 0);
  if (total === 0) return null;
  const probs = Array.from(c.counts.values()).map((v) => v / total);
  let H = 0;
  for (const p of probs) if (p > 0) H -= p * Math.log(p);
  const S = c.counts.size;
  const evenness = S > 1 ? H / Math.log(S) : 0;
  let D = 0;
  for (const p of probs) D += p * p;
  const giniSimpson = 1 - D;
  const effectiveN = Math.exp(H);
  return {
    shannon: +H.toFixed(3),
    shannonEvenness: +evenness.toFixed(3),
    simpson: +D.toFixed(3),
    giniSimpson: +giniSimpson.toFixed(3),
    effectiveN: +effectiveN.toFixed(2),
    categories: S,
    sampleSize: total,
  };
}

function attributeDiversity(performers, attr) {
  const c = counts(performers, (p) => p[attr]);
  const idx = indices(c);
  return {
    attribute: attr,
    coverage: performers.length ? +(1 - c.nullN / performers.length).toFixed(3) : 0,
    indices: idx,
    distribution: Array.from(c.counts, ([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
  };
}

function gapAnalysis(performers, scenes, opts) {
  opts = opts || {};
  const minSupport = opts.minSupport || 3;

  const attrs = ["country", "ethnicity", "eye_color", "hair_color", "gender"];
  const coverage = attrs.map((a) => ({
    attribute: a,
    populated: performers.filter((p) => p[a] != null && p[a] !== "").length,
    missing: performers.filter((p) => p[a] == null || p[a] === "").length,
  })).map((row) => Object.assign(row, {
    coverage: performers.length ? +(row.populated / performers.length).toFixed(3) : 0,
  }));

  const underRepresented = {};
  for (const attr of ["country", "ethnicity", "eye_color", "hair_color"]) {
    const c = counts(performers, (p) => p[attr]);
    underRepresented[attr] = Array.from(c.counts, ([label, value]) => ({ label, value }))
      .filter((r) => r.value < minSupport)
      .sort((a, b) => a.value - b.value)
      .slice(0, 12);
  }

  // Tag gaps: tags with low scene support.
  const tagSceneCount = new Map();
  for (const s of scenes) {
    for (const t of s.tags || []) tagSceneCount.set(t.name, (tagSceneCount.get(t.name) || 0) + 1);
  }
  const tagGaps = Array.from(tagSceneCount, ([label, value]) => ({ label, value }))
    .filter((r) => r.value < minSupport)
    .sort((a, b) => a.value - b.value)
    .slice(0, 20);
  const unusedTags = (opts.allTags || []).filter((t) => !tagSceneCount.has(t.name)).map((t) => ({ label: t.name, id: t.id }));

  return { coverage, underRepresented, tagGaps, unusedTagsCount: unusedTags.length, unusedTagsSample: unusedTags.slice(0, 12) };
}

function computeDiversity(performers, scenes, tags, opts) {
  opts = opts || {};
  const diversities = ["country", "ethnicity", "eye_color", "hair_color"]
    .map((a) => attributeDiversity(performers, a));

  // Tag diversity — top tags by scene count
  const tagCounts = new Map();
  for (const s of scenes) for (const t of s.tags || []) tagCounts.set(t.name, (tagCounts.get(t.name) || 0) + 1);
  const tagBag = Array.from(tagCounts, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  const tagIdx = indices({ counts: tagCounts });
  diversities.push({
    attribute: "tags",
    coverage: scenes.length ? +(scenes.filter((s) => (s.tags || []).length > 0).length / scenes.length).toFixed(3) : 0,
    indices: tagIdx,
    distribution: tagBag.slice(0, 50),
  });

  return {
    diversities,
    gaps: gapAnalysis(performers, scenes, Object.assign({}, opts, { allTags: tags })),
  };
}

module.exports = { computeDiversity, indices, attributeDiversity, gapAnalysis };
