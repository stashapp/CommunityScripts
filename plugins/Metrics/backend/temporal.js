"use strict";

/* Temporal trends.
 *
 * - releaseYearHistogram: scenes by their `date` year.
 * - releaseYearByStudio: stacked years × top studios (top 6).
 * - activePerformersPerYear: distinct performers who had at least one scene
 *   release in each year. Surfaces both "the roster is growing" and "we
 *   bought a back catalogue".
 * - careerTimelines: per top-N performer, first-scene-date through
 *   last-scene-date as a Gantt-style strip. Surfaces career arcs.
 * - performerBirthYearHistogram: when our roster was born.
 * - addedVsReleased: scenes added (created_at year) vs released (date year)
 *   so you can see catalog acquisition vs new content.
 * - tagEvolution: per top-K tag, normalised share over time (one line per
 *   tag, area-stack-friendly).
 * - newTagsByYear: tags whose first scene was tagged in each year. */

function year(iso) {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})/);
  return m ? +m[1] : null;
}

function histogram(yearArray) {
  const m = new Map();
  for (const y of yearArray) {
    if (y == null) continue;
    m.set(y, (m.get(y) || 0) + 1);
  }
  const labels = Array.from(m.keys()).sort((a, b) => a - b);
  return { labels, counts: labels.map((l) => m.get(l)) };
}

function computeTemporal(performers, scenes, studios, opts) {
  opts = opts || {};
  const topN = opts.topN || 20;

  const releaseYearHistogram = histogram(scenes.map((s) => year(s.date)));
  const performerBirthYearHistogram = histogram(performers.map((p) => year(p.birthdate)));

  // Catalog acquisition vs release dates
  const created = histogram(scenes.map((s) => year(s.created_at)));
  const addedVsReleased = {
    labels: union(releaseYearHistogram.labels, created.labels),
  };
  addedVsReleased.released = addedVsReleased.labels.map((y) =>
    releaseYearHistogram.labels.indexOf(y) >= 0
      ? releaseYearHistogram.counts[releaseYearHistogram.labels.indexOf(y)]
      : 0);
  addedVsReleased.added = addedVsReleased.labels.map((y) =>
    created.labels.indexOf(y) >= 0
      ? created.counts[created.labels.indexOf(y)]
      : 0);

  // Top 6 studios stacked by year
  const topStudios = studios.slice().sort((a, b) => (b.scene_count || 0) - (a.scene_count || 0)).slice(0, 6).map((s) => s.name);
  const studioSet = new Set(topStudios);
  const yearStudioMap = new Map();
  for (const s of scenes) {
    const y = year(s.date);
    if (y == null || !s.studio || !studioSet.has(s.studio.name)) continue;
    const sk = s.studio.name;
    const m = yearStudioMap.get(y) || new Map();
    m.set(sk, (m.get(sk) || 0) + 1);
    yearStudioMap.set(y, m);
  }
  const allYears = Array.from(yearStudioMap.keys()).sort((a, b) => a - b);
  const releaseYearByStudio = {
    labels: allYears,
    series: topStudios.map((name) => ({
      label: name,
      values: allYears.map((y) => (yearStudioMap.get(y) || new Map()).get(name) || 0),
    })),
  };

  // Active performers per year
  const activeByYear = new Map();
  for (const s of scenes) {
    const y = year(s.date);
    if (y == null) continue;
    const set = activeByYear.get(y) || new Set();
    for (const p of s.performers || []) set.add(p.id);
    activeByYear.set(y, set);
  }
  const activeYears = Array.from(activeByYear.keys()).sort((a, b) => a - b);
  const activePerformersPerYear = {
    labels: activeYears,
    counts: activeYears.map((y) => activeByYear.get(y).size),
  };

  // Career timelines for top-N performers by scene count.
  const firstLastByPerf = new Map();
  for (const s of scenes) {
    if (!s.date) continue;
    for (const p of s.performers || []) {
      const cur = firstLastByPerf.get(p.id) || { id: p.id, name: p.name, first: s.date, last: s.date, count: 0 };
      if (s.date < cur.first) cur.first = s.date;
      if (s.date > cur.last) cur.last = s.date;
      cur.count++;
      firstLastByPerf.set(p.id, cur);
    }
  }
  const careerTimelines = Array.from(firstLastByPerf.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((p) => ({
      id: p.id, name: p.name,
      firstYear: year(p.first), lastYear: year(p.last),
      lengthYears: (year(p.last) || 0) - (year(p.first) || 0) + 1,
      sceneCount: p.count,
    }));

  // Tag evolution: top 10 tags by frequency, share-of-year as percentage.
  const tagFreq = new Map();
  for (const s of scenes) for (const t of s.tags || []) tagFreq.set(t.name, (tagFreq.get(t.name) || 0) + 1);
  const topTags = Array.from(tagFreq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k]) => k);
  const topTagSet = new Set(topTags);
  const yearTagMap = new Map();
  const yearTotalScenes = new Map();
  for (const s of scenes) {
    const y = year(s.date);
    if (y == null) continue;
    yearTotalScenes.set(y, (yearTotalScenes.get(y) || 0) + 1);
    for (const t of s.tags || []) {
      if (!topTagSet.has(t.name)) continue;
      const m = yearTagMap.get(y) || new Map();
      m.set(t.name, (m.get(t.name) || 0) + 1);
      yearTagMap.set(y, m);
    }
  }
  const evolutionYears = Array.from(yearTotalScenes.keys()).sort((a, b) => a - b);
  const tagEvolution = {
    labels: evolutionYears,
    series: topTags.map((name) => ({
      label: name,
      // Raw counts per year — easier to compare than shares (which compress
      // when the catalog grows).
      counts: evolutionYears.map((y) => (yearTagMap.get(y) || new Map()).get(name) || 0),
      // Share-of-year as a percentage so the chart can also render an
      // "elevated share" view.
      shareOfYear: evolutionYears.map((y) => {
        const total = yearTotalScenes.get(y) || 0;
        return total ? +(((yearTagMap.get(y) || new Map()).get(name) || 0) / total * 100).toFixed(1) : 0;
      }),
    })),
  };

  // Year a tag was first seen.
  const firstYearByTag = new Map();
  for (const s of scenes) {
    const y = year(s.date);
    if (y == null) continue;
    for (const t of s.tags || []) {
      if (!firstYearByTag.has(t.name) || y < firstYearByTag.get(t.name)) firstYearByTag.set(t.name, y);
    }
  }
  const newTagsByYearMap = new Map();
  for (const y of firstYearByTag.values()) newTagsByYearMap.set(y, (newTagsByYearMap.get(y) || 0) + 1);
  const newYears = Array.from(newTagsByYearMap.keys()).sort((a, b) => a - b);
  const newTagsByYear = { labels: newYears, counts: newYears.map((y) => newTagsByYearMap.get(y)) };

  return {
    releaseYearHistogram,
    performerBirthYearHistogram,
    addedVsReleased,
    releaseYearByStudio,
    activePerformersPerYear,
    careerTimelines,
    tagEvolution,
    newTagsByYear,
  };
}

function union(a, b) {
  const s = new Set([].concat(a, b));
  return Array.from(s).sort((x, y) => x - y);
}

module.exports = { computeTemporal };
