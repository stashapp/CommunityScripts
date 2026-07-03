"use strict";

/* Metadata cleanup — surfaces performers (and scenes) with missing fields,
 * sorted so the highest-impact fixes bubble up first.
 *
 * "Highest impact" = the performer / scene appears in a lot of your
 * library, so filling the gap benefits the most downstream charts.
 *
 * Read-only: we deep-link to Stash's native editor for each entry. No
 * mutations from the plugin. */

function has(v) {
  return v != null && v !== "" && !/^(no|none|n|null|undefined|unknown)$/i.test(String(v).trim());
}

// Field definitions for the performer scan. Each entry has a display name
// and a predicate that returns true when the field is missing.
const PERFORMER_FIELDS = [
  { key: "ethnicity",   label: "Ethnicity",   missing: (p) => !has(p.ethnicity) },
  { key: "country",     label: "Country",     missing: (p) => !has(p.country) },
  { key: "eye_color",   label: "Eye color",   missing: (p) => !has(p.eye_color) },
  { key: "hair_color",  label: "Hair color",  missing: (p) => !has(p.hair_color) },
  { key: "gender",      label: "Gender",      missing: (p) => !has(p.gender) },
  { key: "birthdate",   label: "Birthdate",   missing: (p) => !has(p.birthdate) },
  { key: "height_cm",   label: "Height",      missing: (p) => !p.height_cm },
  { key: "measurements", label: "Measurements", missing: (p) => !has(p.measurements) },
  { key: "tattoos",     label: "Tattoos",     missing: (p) => p.tattoos == null || p.tattoos === "" },
  { key: "piercings",   label: "Piercings",   missing: (p) => p.piercings == null || p.piercings === "" },
];

const SCENE_FIELDS = [
  { key: "title",    label: "Title",     missing: (s) => !has(s.title) },
  { key: "date",     label: "Date",      missing: (s) => !has(s.date) },
  { key: "studio",   label: "Studio",    missing: (s) => !s.studio || !s.studio.id },
  { key: "rating",   label: "Rating",    missing: (s) => s.rating100 == null },
  { key: "performers", label: "Performers", missing: (s) => !s.performers || !s.performers.length },
  { key: "tags",     label: "Tags",      missing: (s) => !s.tags || !s.tags.length },
];

function computeCleanup(performers, scenes, opts) {
  opts = opts || {};
  const topN = opts.topN || 40;

  // Per-performer scene appearance count from the scene set.
  const perfSceneCount = new Map();
  for (const s of scenes) {
    for (const p of s.performers || []) {
      perfSceneCount.set(p.id, (perfSceneCount.get(p.id) || 0) + 1);
    }
  }

  // Missing-field counts per field.
  const performerFieldStats = {};
  const performerMissingLists = {};
  for (const f of PERFORMER_FIELDS) {
    performerFieldStats[f.key] = { label: f.label, missing: 0, total: performers.length };
    performerMissingLists[f.key] = [];
  }

  // Per-performer: which fields does this one lack?
  const performerGaps = [];
  for (const p of performers) {
    const missingFields = [];
    for (const f of PERFORMER_FIELDS) {
      if (f.missing(p)) {
        performerFieldStats[f.key].missing++;
        performerMissingLists[f.key].push(p);
        missingFields.push(f.key);
      }
    }
    if (missingFields.length) {
      performerGaps.push({
        id: p.id, name: p.name,
        sceneCount: perfSceneCount.get(p.id) || p.scene_count || 0,
        favorite: !!p.favorite,
        rating100: p.rating100 || null,
        missingFields,
        missingCount: missingFields.length,
      });
    }
  }
  performerGaps.sort((a, b) =>
    (b.favorite - a.favorite) ||
    b.sceneCount - a.sceneCount ||
    b.missingCount - a.missingCount ||
    a.name.localeCompare(b.name));

  // Per-field top-N lists — same sort criteria.
  const performerByField = {};
  for (const f of PERFORMER_FIELDS) {
    const list = performerMissingLists[f.key]
      .map((p) => ({
        id: p.id, name: p.name,
        sceneCount: perfSceneCount.get(p.id) || p.scene_count || 0,
        favorite: !!p.favorite,
        rating100: p.rating100 || null,
      }))
      .sort((a, b) =>
        (b.favorite - a.favorite) ||
        b.sceneCount - a.sceneCount ||
        a.name.localeCompare(b.name));
    performerByField[f.key] = {
      label: f.label,
      total: list.length,
      top: list.slice(0, topN),
    };
  }

  // Scene cleanup.
  const sceneFieldStats = {};
  const sceneMissingLists = {};
  for (const f of SCENE_FIELDS) {
    sceneFieldStats[f.key] = { label: f.label, missing: 0, total: scenes.length };
    sceneMissingLists[f.key] = [];
  }
  for (const s of scenes) {
    for (const f of SCENE_FIELDS) {
      if (f.missing(s)) {
        sceneFieldStats[f.key].missing++;
        sceneMissingLists[f.key].push(s);
      }
    }
  }
  const sceneByField = {};
  for (const f of SCENE_FIELDS) {
    sceneByField[f.key] = {
      label: f.label,
      total: sceneMissingLists[f.key].length,
      top: sceneMissingLists[f.key]
        .slice()
        .sort((a, b) => (b.play_count || 0) - (a.play_count || 0) ||
          (b.o_counter || 0) - (a.o_counter || 0))
        .slice(0, topN)
        .map((s) => ({
          id: s.id, title: s.title || ("Scene " + s.id),
          playCount: s.play_count || 0,
          studio: s.studio ? s.studio.name : null,
          date: s.date || null,
        })),
    };
  }

  // Composite metadata-health score: 0 = every performer missing every
  // field, 100 = fully populated. Weighted by "how important" each field
  // is for downstream charts.
  const fieldWeights = {
    ethnicity: 1.5, country: 1.5, eye_color: 1.0, hair_color: 1.0,
    gender: 2.0, birthdate: 1.2, height_cm: 1.0, measurements: 0.6,
    tattoos: 0.3, piercings: 0.3,
  };
  let weightedMissing = 0, weightedTotal = 0;
  for (const f of PERFORMER_FIELDS) {
    const w = fieldWeights[f.key] || 1;
    weightedMissing += performerFieldStats[f.key].missing * w;
    weightedTotal += performers.length * w;
  }
  const metadataHealthScore = weightedTotal
    ? +(100 * (1 - weightedMissing / weightedTotal)).toFixed(1)
    : 100;

  return {
    metadataHealthScore,
    performerFieldStats,
    performerByField,
    performerGaps: performerGaps.slice(0, topN * 2),
    performerGapsTotal: performerGaps.length,
    sceneFieldStats,
    sceneByField,
    performerFields: PERFORMER_FIELDS.map((f) => ({ key: f.key, label: f.label })),
    sceneFields: SCENE_FIELDS.map((f) => ({ key: f.key, label: f.label })),
  };
}

module.exports = { computeCleanup, PERFORMER_FIELDS, SCENE_FIELDS };
