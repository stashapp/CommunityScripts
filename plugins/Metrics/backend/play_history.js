"use strict";

/* Play-history analytics. Two data sources are exploited:
 *
 *   - Scene.play_history (Stash ≥ 0.24): array of ISO timestamps, one per
 *     play. We fold these into a 7×24 day-of-week × hour-of-day heatmap,
 *     a per-month play volume series and a "streak" (consecutive days
 *     with at least one play).
 *
 *   - Scene.play_count + Scene.play_duration (all versions): basic
 *     most-watched ranking. Used as a fallback when play_history is
 *     unavailable.
 *
 * Everything is timezone-naïve — we read the timestamps in the local time
 * of whatever JS engine evaluates this module (Node on the host, or the
 * browser). That's the same time the user saw on the Stash UI when they
 * pressed play, so the heatmap matches their intuition. */

function dayOfWeek(date) {
  // ISO order: 0 = Monday … 6 = Sunday
  const d = date.getDay();
  return (d + 6) % 7;
}

function safeDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d;
}

function buildHeatmap(timestamps) {
  const matrix = Array.from({ length: 7 }, () => new Array(24).fill(0));
  let total = 0;
  let earliest = null, latest = null;
  for (const ts of timestamps) {
    const d = safeDate(ts);
    if (!d) continue;
    matrix[dayOfWeek(d)][d.getHours()]++;
    total++;
    if (!earliest || d < earliest) earliest = d;
    if (!latest || d > latest) latest = d;
  }
  return {
    matrix,
    total,
    earliest: earliest ? earliest.toISOString() : null,
    latest: latest ? latest.toISOString() : null,
  };
}

function streakStats(timestamps) {
  if (!timestamps.length) return { longestStreak: 0, currentStreak: 0, uniqueDays: 0 };
  const days = new Set();
  for (const ts of timestamps) {
    const d = safeDate(ts);
    if (!d) continue;
    days.add(d.toISOString().slice(0, 10));
  }
  const sorted = Array.from(days).sort();
  let longest = 0;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const cur = new Date(sorted[i]);
    if ((cur - prev) / 86400000 <= 1.1) run++;
    else { if (run > longest) longest = run; run = 1; }
  }
  if (run > longest) longest = run;
  // Current streak from the latest day backwards. Compares against "now" so
  // the streak ends if there hasn't been a play today or yesterday.
  let current = 0;
  if (sorted.length) {
    const last = new Date(sorted[sorted.length - 1]);
    const now = new Date();
    const gap = (now - last) / 86400000;
    if (gap <= 1.5) {
      current = 1;
      for (let i = sorted.length - 2; i >= 0; i--) {
        const prev = new Date(sorted[i]);
        const cur = new Date(sorted[i + 1]);
        if ((cur - prev) / 86400000 <= 1.1) current++;
        else break;
      }
    }
  }
  return { longestStreak: longest, currentStreak: current, uniqueDays: sorted.length };
}

function perMonth(timestamps) {
  const map = new Map();
  for (const ts of timestamps) {
    const d = safeDate(ts);
    if (!d) continue;
    const key = d.toISOString().slice(0, 7);
    map.set(key, (map.get(key) || 0) + 1);
  }
  const labels = Array.from(map.keys()).sort();
  return { labels, counts: labels.map((k) => map.get(k)) };
}

function computePlayHistory(scenes, performers, opts) {
  opts = opts || {};
  const topN = opts.topN || 25;

  // Per-scene play timestamps. If play_history is missing, fall back to
  // "play_count plays at last_played_at" so the most-watched rankings
  // still work.
  const allTs = [];
  const sceneTs = new Map();
  let hasRichHistory = false;
  for (const s of scenes) {
    const fromHistory = Array.isArray(s.play_history) ? s.play_history : null;
    if (fromHistory && fromHistory.length) {
      hasRichHistory = true;
      for (const ts of fromHistory) allTs.push(ts);
      sceneTs.set(s.id, fromHistory);
    } else if (s.last_played_at && s.play_count > 0) {
      for (let i = 0; i < s.play_count; i++) allTs.push(s.last_played_at);
      sceneTs.set(s.id, [s.last_played_at]);
    }
  }

  const heatmap = buildHeatmap(allTs);
  const monthly = perMonth(allTs);
  const streaks = streakStats(allTs);

  // Top scenes by play count, falling back to play_duration when no
  // count is available.
  const mostWatchedScenes = scenes
    .map((s) => ({
      id: s.id,
      title: s.title || ("Scene " + s.id),
      date: s.date,
      studio: s.studio ? s.studio.name : null,
      performers: (s.performers || []).map((p) => p.name),
      playCount: s.play_count || 0,
      playDuration: s.play_duration || 0,
      lastPlayedAt: s.last_played_at || null,
      rating100: s.rating100,
    }))
    .filter((s) => s.playCount > 0 || s.playDuration > 0)
    .sort((a, b) => (b.playCount - a.playCount) || (b.playDuration - a.playDuration))
    .slice(0, topN);

  // Per-performer aggregated play volume.
  const playCountByPerf = new Map();
  const playDurationByPerf = new Map();
  const playHistoryByPerf = new Map();
  for (const s of scenes) {
    const pc = s.play_count || 0;
    const pd = s.play_duration || 0;
    const tsList = sceneTs.get(s.id) || [];
    for (const p of s.performers || []) {
      playCountByPerf.set(p.id, (playCountByPerf.get(p.id) || 0) + pc);
      playDurationByPerf.set(p.id, (playDurationByPerf.get(p.id) || 0) + pd);
      if (tsList.length) {
        const arr = playHistoryByPerf.get(p.id) || [];
        for (const t of tsList) arr.push(t);
        playHistoryByPerf.set(p.id, arr);
      }
    }
  }
  const performerById = new Map(performers.map((p) => [p.id, p]));
  const mostWatchedPerformers = Array.from(playCountByPerf.entries())
    .map(([id, count]) => {
      const p = performerById.get(id);
      return {
        id,
        name: p ? p.name : id,
        playCount: count,
        playDuration: playDurationByPerf.get(id) || 0,
        sceneCount: p ? (p.scene_count || 0) : 0,
        country: p ? p.country : null,
        rating100: p ? p.rating100 : null,
        favorite: p ? !!p.favorite : false,
      };
    })
    .filter((p) => p.playCount > 0)
    .sort((a, b) => (b.playCount - a.playCount) || (b.playDuration - a.playDuration))
    .slice(0, topN);

  // Per-tag play volume — folds every play of every tagged scene into the
  // tag bucket so we can show which tags get watched the most, not just
  // tagged the most.
  const playsByTag = new Map();
  const sceneCountByTag = new Map();
  for (const s of scenes) {
    const w = s.play_count || 0;
    for (const t of s.tags || []) {
      if (w > 0) playsByTag.set(t.name, (playsByTag.get(t.name) || 0) + w);
      sceneCountByTag.set(t.name, (sceneCountByTag.get(t.name) || 0) + 1);
    }
  }
  const topTagsByPlays = Array.from(playsByTag, ([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value).slice(0, topN);

  // Scene-count-in-filter per performer — used by both the least-watched
  // performer ranking and the neglect-scored backlog list below.
  const sceneCountInFilterByPerf = new Map();
  for (const s of scenes) {
    for (const p of s.performers || []) {
      sceneCountInFilterByPerf.set(p.id, (sceneCountInFilterByPerf.get(p.id) || 0) + 1);
    }
  }

  // ---- Least-watched rankings — mirror of the most-watched lists.
  //      Every scene / performer / tag is sorted by its play count
  //      ASCENDING and the bottom-N returned. Includes zero-play items
  //      at the top of the list, then 1-play, 2-play, etc. The rating
  //      tiebreak surfaces the highest-value items among ties.
  const leastWatchedScenes = scenes
    .map((s) => ({
      id: s.id,
      title: s.title || ("Scene " + s.id),
      date: s.date,
      studio: s.studio ? s.studio.name : null,
      performers: (s.performers || []).map((p) => p.name),
      playCount: s.play_count || 0,
      playDuration: s.play_duration || 0,
      lastPlayedAt: s.last_played_at || null,
      rating100: s.rating100,
    }))
    .sort((a, b) => (a.playCount - b.playCount) ||
      ((b.rating100 || 0) - (a.rating100 || 0)))
    .slice(0, topN);

  const leastWatchedPerformers = performers
    .map((p) => ({
      id: p.id,
      name: p.name,
      playCount: playCountByPerf.get(p.id) || 0,
      playDuration: playDurationByPerf.get(p.id) || 0,
      sceneCount: sceneCountInFilterByPerf.get(p.id) || 0,
      country: p.country || null,
      rating100: p.rating100,
      favorite: !!p.favorite,
    }))
    // Only include performers who actually have scenes in the current
    // filter — otherwise the ranking is dominated by irrelevant "0 plays,
    // 0 scenes" entries.
    .filter((p) => p.sceneCount > 0)
    .sort((a, b) => (a.playCount - b.playCount) ||
      (b.sceneCount - a.sceneCount) ||
      ((b.rating100 || 0) - (a.rating100 || 0)))
    .slice(0, topN);

  const leastWatchedTags = Array.from(sceneCountByTag.entries())
    .map(([label, sceneCount]) => ({
      label,
      value: playsByTag.get(label) || 0,
      sceneCount,
    }))
    .sort((a, b) => (a.value - b.value) || (b.sceneCount - a.sceneCount))
    .slice(0, topN);

  // ---- BACKLOG NEGLECT-SCORED rankings. Each item gets a NEGLECT SCORE
  //      (0–100, higher = more valuable to watch soon) so the ranking
  //      reads like an inverse of the most-played score. Formula
  //      combines rating (has it been vetted), age (how long it's been
  //      sitting), and either duration (scenes) or scene count
  //      (performers / tags — how much content is waiting).
  function clamp01x100(v) { return Math.max(0, Math.min(100, v)); }
  function daysSince(iso) {
    if (!iso) return 0;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 0;
    return Math.max(0, (Date.now() - d.getTime()) / 86400000);
  }

  const neverPlayedScenes = scenes
    .filter((s) => !(s.play_count > 0))
    .map((s) => {
      const durationSec = Math.max.apply(null, (s.files || [{}]).map((f) => f.duration || 0));
      const rating = s.rating100 != null ? s.rating100 : 50;
      const ageDays = daysSince(s.created_at || s.date);
      const durMin = durationSec / 60;
      // Rating (0–70) + age (0–20 saturating at ~660 days) + duration (0–10).
      const score = clamp01x100(rating * 0.7 + Math.min(20, ageDays * 0.03) + Math.min(10, durMin * 0.25));
      return {
        id: s.id,
        title: s.title || ("Scene " + s.id),
        date: s.date,
        studio: s.studio ? s.studio.name : null,
        performers: (s.performers || []).map((p) => p.name),
        tags: (s.tags || []).slice(0, 5).map((t) => t.name),
        rating100: s.rating100,
        durationSec,
        createdAt: s.created_at || null,
        ageDays: Math.round(ageDays),
        neglectScore: +score.toFixed(1),
      };
    })
    .sort((a, b) => b.neglectScore - a.neglectScore)
    .slice(0, topN);

  // Neglected performers: performers who have scenes but zero of those
  // scenes have been played. Ranked by their scene count (having lots of
  // never-touched content is the most surprising find). Excludes
  // performers with truly no scenes in the current filter.
  const neverPlayedPerformers = Array.from(sceneCountInFilterByPerf.entries())
    .filter(([id]) => !((playCountByPerf.get(id) || 0) > 0))
    .map(([id, sceneCount]) => {
      const p = performerById.get(id);
      const rating = p && p.rating100 != null ? p.rating100 : 50;
      // Rating (0–50) + scene count (0–30 saturating at 10 scenes) +
      // favorite bonus (20) — a favourited performer you've never watched
      // is the highest-signal item.
      const score = clamp01x100(
        rating * 0.5 +
        Math.min(30, sceneCount * 3) +
        (p && p.favorite ? 20 : 0)
      );
      return {
        id,
        name: p ? p.name : id,
        sceneCount,
        totalScenes: p ? (p.scene_count || 0) : 0,
        country: p ? p.country : null,
        rating100: p ? p.rating100 : null,
        favorite: p ? !!p.favorite : false,
        neglectScore: +score.toFixed(1),
      };
    })
    .sort((a, b) => b.neglectScore - a.neglectScore)
    .slice(0, topN);

  // Untouched tag categories: tags present in your scenes but where the
  // total play_count across all scenes carrying the tag is zero. Ranked
  // by scene count so "you have 30 Outdoor scenes and never played one"
  // sits at the top.
  // Untouched tags need average rating of the tag's scenes, so compute
  // once now.
  const ratingSumByTag = new Map();
  const ratingCountByTag = new Map();
  for (const s of scenes) {
    if (s.rating100 == null) continue;
    for (const t of s.tags || []) {
      ratingSumByTag.set(t.name, (ratingSumByTag.get(t.name) || 0) + s.rating100);
      ratingCountByTag.set(t.name, (ratingCountByTag.get(t.name) || 0) + 1);
    }
  }
  const untouchedTags = Array.from(sceneCountByTag.entries())
    .filter(([name]) => !((playsByTag.get(name) || 0) > 0))
    .map(([name, sceneCount]) => {
      const ratedCount = ratingCountByTag.get(name) || 0;
      const avgRating = ratedCount ? (ratingSumByTag.get(name) || 0) / ratedCount : 50;
      // Scene count (0–60 saturating at 30 scenes) + avg rating (0–40).
      const score = clamp01x100(Math.min(60, sceneCount * 2) + avgRating * 0.4);
      return {
        label: name,
        sceneCount,
        avgRating: ratedCount ? +avgRating.toFixed(1) : null,
        neglectScore: +score.toFixed(1),
      };
    })
    .sort((a, b) => b.neglectScore - a.neglectScore)
    .slice(0, topN);

  // KPIs
  const totalPlays = scenes.reduce((s, sc) => s + (sc.play_count || 0), 0);
  const totalPlayDuration = scenes.reduce((s, sc) => s + (sc.play_duration || 0), 0);
  const playedScenes = scenes.filter((s) => (s.play_count || 0) > 0).length;

  // Completion rate per scene: play_duration / (file.duration × play_count).
  // Buckets: <20% = abandoned, 20–80% = partial, ≥80% = watched, ≥80% AND
  // play_count ≥ 3 = repeat watch.
  const completionBuckets = { abandoned: 0, partial: 0, watched: 0, repeat: 0 };
  let completionRatioSum = 0, completionRatioN = 0;
  for (const s of scenes) {
    const dur = Math.max.apply(null, (s.files || [{}]).map((f) => f.duration || 0));
    const pc = s.play_count || 0;
    const pd = s.play_duration || 0;
    if (!dur || pc === 0) continue;
    const ratio = Math.min(2.5, pd / (dur * pc));
    completionRatioSum += ratio;
    completionRatioN++;
    if (ratio < 0.2) completionBuckets.abandoned++;
    else if (ratio < 0.8) completionBuckets.partial++;
    else if (pc >= 3) completionBuckets.repeat++;
    else completionBuckets.watched++;
  }
  const meanCompletion = completionRatioN ? +(completionRatioSum / completionRatioN).toFixed(3) : 0;
  const kpis = {
    totalPlays,
    totalPlayDuration,
    playedScenes,
    unplayedScenes: scenes.length - playedScenes,
    avgPlaysPerPlayedScene: playedScenes ? totalPlays / playedScenes : 0,
    longestStreak: streaks.longestStreak,
    currentStreak: streaks.currentStreak,
    uniqueDays: streaks.uniqueDays,
    earliest: heatmap.earliest,
    latest: heatmap.latest,
    hasRichHistory,
    meanCompletion,
  };

  // Hour-of-day and day-of-week marginals — useful for "I watch most on
  // Thursdays" style insights.
  const byHour = new Array(24).fill(0);
  const byDow = new Array(7).fill(0);
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      byHour[h] += heatmap.matrix[d][h];
      byDow[d] += heatmap.matrix[d][h];
    }
  }
  const peakHour = byHour.indexOf(Math.max.apply(null, byHour));
  const peakDow = byDow.indexOf(Math.max.apply(null, byDow));

  return {
    kpis,
    heatmap: heatmap.matrix,
    heatmapTotal: heatmap.total,
    byHour, byDow, peakHour, peakDow,
    monthly,
    mostWatchedScenes,
    mostWatchedPerformers,
    topTagsByPlays,
    completionBuckets,
    // v1.5 — inverse rankings.
    // Pure "from-lowest" rankings (mirrors the most-watched lists).
    leastWatchedScenes,
    leastWatchedPerformers,
    leastWatchedTags,
    // Never-played + scored (surfaces the high-value backlog).
    neverPlayedScenes,
    neverPlayedPerformers,
    untouchedTags,
  };
}

module.exports = {
  computePlayHistory,
  buildHeatmap,
  streakStats,
};
