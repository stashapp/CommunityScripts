"use strict";

/* Bingo — 5×5 achievement grid. 24 challenges + free space in the middle.
 * Each cell is a `{ id, title, done, hint }` object. `done` is computed
 * from current library state.
 *
 * Card selection is deterministic per (library, seed) — so refreshing the
 * cache doesn't reshuffle the card. The seed is a small integer we accept
 * via opts.seed; the UI stores it in localStorage. */

function toDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function collectPlayEvents(s) {
  const history = Array.isArray(s.play_history) ? s.play_history : [];
  if (history.length) return history.map(toDate).filter(Boolean).map((d) => d.getTime());
  if (s.last_played_at && (s.play_count || 0) > 0) {
    const d = toDate(s.last_played_at);
    if (d) return new Array(s.play_count || 1).fill(d.getTime());
  }
  return [];
}

function maxDur(s) {
  return Math.max.apply(null, (s.files || [{}]).map((f) => f.duration || 0));
}

// Precompute per-library facts so each challenge check is O(1).
function summarize(scenes, performers, tags) {
  const perfById = new Map(performers.map((p) => [p.id, p]));
  const playDays = new Map();
  const hoursSeen = new Set();
  const dowSeen = new Set();
  const playedStudios = new Set();
  const playedCountries = new Set();
  const playedEthnicities = new Set();
  const playedTagNames = new Set();
  const playedPerformers = new Set();
  let anyPlay4K = false, anyPlayMarathon = false, anyCompletion90 = false;
  let anySoloPlay = false, any3PerfPlay = false, any10TagsPlay = false;
  let anyLatenight = false, anyMorning = false;
  const scenesRatedHigh = new Set(), scenesRatedLow = new Set();
  let maxSceneRating = 0, maxScenePlays = 0;
  let ratedCount = 0, favoritedPerformers = 0;
  let biggestBinge = 0;
  let anyRewatchSameDay = false;

  for (const s of scenes) {
    const dur = maxDur(s);
    const events = collectPlayEvents(s);
    if (s.rating100 != null) {
      ratedCount++;
      if (s.rating100 >= 90) scenesRatedHigh.add(s.id);
      if (s.rating100 <= 20) scenesRatedLow.add(s.id);
      if (s.rating100 > maxSceneRating) maxSceneRating = s.rating100;
    }
    if ((s.play_count || 0) > maxScenePlays) maxScenePlays = s.play_count || 0;
    if (events.length) {
      playedTagNames.add(...(s.tags || []).map((t) => t.name));
      for (const t of s.tags || []) playedTagNames.add(t.name);
      if (s.studio) playedStudios.add(s.studio.name);
      for (const p of s.performers || []) {
        playedPerformers.add(p.id);
        const full = perfById.get(p.id);
        if (full) {
          if (full.country) playedCountries.add(full.country);
          if (full.ethnicity) playedEthnicities.add(full.ethnicity);
        }
      }
      const f = (s.files || [])[0];
      if (f && f.height && f.height >= 2000) anyPlay4K = true;
      if (dur >= 4500) anyPlayMarathon = true;
      // Completion score.
      if (dur && s.play_duration && s.play_count > 0) {
        const perPlay = s.play_duration / (dur * s.play_count);
        if (perPlay >= 0.9) anyCompletion90 = true;
      }
      const perfCount = (s.performers || []).length;
      if (perfCount === 1) anySoloPlay = true;
      if (perfCount >= 3) any3PerfPlay = true;
      if ((s.tags || []).length >= 10) any10TagsPlay = true;
    }
    // Day / hour distribution.
    const perDayLocal = new Map();
    for (const t of events) {
      const d = new Date(t);
      const key = d.toISOString().slice(0, 10);
      playDays.set(key, (playDays.get(key) || 0) + 1);
      hoursSeen.add(d.getHours());
      dowSeen.add((d.getDay() + 6) % 7);
      const h = d.getHours();
      if (h >= 0 && h < 5) anyLatenight = true;
      if (h >= 5 && h < 9) anyMorning = true;
      perDayLocal.set(key, (perDayLocal.get(key) || 0) + 1);
    }
    // Same-day rewatch?
    for (const c of perDayLocal.values()) if (c >= 2) anyRewatchSameDay = true;
  }
  for (const p of performers) if (p.favorite) favoritedPerformers++;
  for (const c of playDays.values()) if (c > biggestBinge) biggestBinge = c;

  // Longest consecutive-day streak.
  const days = Array.from(playDays.keys()).sort();
  let longestStreak = days.length ? 1 : 0, cur = 1;
  for (let i = 1; i < days.length; i++) {
    const gap = Math.round((new Date(days[i]).getTime() - new Date(days[i - 1]).getTime()) / 86400000);
    if (gap === 1) { cur++; if (cur > longestStreak) longestStreak = cur; }
    else cur = 1;
  }

  return {
    playedTagNames, playedStudios, playedCountries, playedEthnicities,
    playedPerformers, playDays, hoursSeen, dowSeen,
    biggestBinge, longestStreak,
    anyPlay4K, anyPlayMarathon, anyCompletion90,
    anySoloPlay, any3PerfPlay, any10TagsPlay,
    anyLatenight, anyMorning, anyRewatchSameDay,
    scenesRatedHigh, scenesRatedLow,
    maxScenePlays, ratedCount, favoritedPerformers, maxSceneRating,
  };
}

// A challenge template. `check(summary)` returns a boolean; `hint` is a
// short user-visible progress hint like "8 / 10 countries".
function T(id, title, check, hint) {
  return { id, title, check, hint };
}

const TEMPLATES = [
  T("rate_5star", "Give a scene a full 5★",
    (x) => x.maxSceneRating >= 100,
    (x) => "top rating: " + Math.round(x.maxSceneRating / 20 * 10) / 10 + "★"),
  T("rewatch_5x", "Rewatch a scene 5+ times",
    (x) => x.maxScenePlays >= 5,
    (x) => "most plays: " + x.maxScenePlays),
  T("ten_countries", "Play scenes from 10+ countries",
    (x) => x.playedCountries.size >= 10,
    (x) => x.playedCountries.size + " / 10 countries"),
  T("marathon", "Watch a 75-minute+ scene",
    (x) => x.anyPlayMarathon,
    () => "marathon = 75m+"),
  T("finish_a_scene", "Watch a scene to completion (≥90%)",
    (x) => x.anyCompletion90,
    () => "≥ 90% of duration"),
  T("five_studios", "Play from 5+ different studios",
    (x) => x.playedStudios.size >= 5,
    (x) => x.playedStudios.size + " / 5 studios"),
  T("binge_day", "Play 3+ scenes in one day",
    (x) => x.biggestBinge >= 3,
    (x) => "biggest day: " + x.biggestBinge),
  T("binge_5", "Play 5+ scenes in one day",
    (x) => x.biggestBinge >= 5,
    (x) => "biggest day: " + x.biggestBinge),
  T("rated_10", "Rate 10+ scenes",
    (x) => x.ratedCount >= 10,
    (x) => x.ratedCount + " / 10 rated"),
  T("rated_50", "Rate 50+ scenes",
    (x) => x.ratedCount >= 50,
    (x) => x.ratedCount + " / 50 rated"),
  T("tag_master", "Play 50+ unique tags",
    (x) => x.playedTagNames.size >= 50,
    (x) => x.playedTagNames.size + " / 50 tags"),
  T("all_dow", "Play on every day of the week",
    (x) => x.dowSeen.size >= 7,
    (x) => x.dowSeen.size + " / 7 weekdays"),
  T("all_hours", "Play across 12+ different hours",
    (x) => x.hoursSeen.size >= 12,
    (x) => x.hoursSeen.size + " / 12 hours"),
  T("4k_scene", "Play a 4K scene",
    (x) => x.anyPlay4K,
    () => "height ≥ 2000px"),
  T("latenight", "Play after midnight",
    (x) => x.anyLatenight,
    () => "0–4am"),
  T("morning", "Play in the morning",
    (x) => x.anyMorning,
    () => "5–9am"),
  T("fav_10", "Favorite 10+ performers",
    (x) => x.favoritedPerformers >= 10,
    (x) => x.favoritedPerformers + " / 10 favorites"),
  T("streak_7", "Play 7 days in a row",
    (x) => x.longestStreak >= 7,
    (x) => "longest streak: " + x.longestStreak),
  T("diverse", "Play performers from 5+ ethnicities",
    (x) => x.playedEthnicities.size >= 5,
    (x) => x.playedEthnicities.size + " / 5 ethnicities"),
  T("solo", "Play a solo scene",
    (x) => x.anySoloPlay,
    () => "exactly 1 performer"),
  T("group", "Play a group scene (3+ performers)",
    (x) => x.any3PerfPlay,
    () => "≥ 3 performers"),
  T("tag_stack", "Play a scene with 10+ tags",
    (x) => x.any10TagsPlay,
    () => "well-tagged only"),
  T("rewatch_same_day", "Rewatch a scene twice on the same day",
    (x) => x.anyRewatchSameDay,
    () => "same-day repeat"),
  T("both_extremes", "Have both a 5★ and a 1★ scene",
    (x) => x.scenesRatedHigh.size > 0 && x.scenesRatedLow.size > 0,
    () => "5★ and 1★ both"),
  T("hundred_plays", "100+ total plays across the library",
    (x) => {
      let total = 0;
      for (const v of x.playDays.values()) total += v;
      return total >= 100;
    },
    (x) => {
      let total = 0;
      for (const v of x.playDays.values()) total += v;
      return total + " / 100 plays";
    }),
  T("hundred_scenes", "Explore 100+ different scenes",
    (x) => x.playedPerformers.size >= 100,
    (x) => x.playedPerformers.size + " performers touched"),
  T("wide_studios", "Play from 15+ different studios",
    (x) => x.playedStudios.size >= 15,
    (x) => x.playedStudios.size + " / 15 studios"),
  T("wide_countries", "Play from 20+ different countries",
    (x) => x.playedCountries.size >= 20,
    (x) => x.playedCountries.size + " / 20 countries"),
];

// Deterministic pseudo-random shuffle from a small integer seed.
function shuffleDet(arr, seed) {
  const out = arr.slice();
  let s = seed | 0;
  function next() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function computeBingo(scenes, performers, tags, opts) {
  const seed = (opts && opts.seed) || 42;
  const summary = summarize(scenes, performers, tags);
  const shuffled = shuffleDet(TEMPLATES, seed);
  const picked = shuffled.slice(0, 24);
  const cells = picked.map((t) => {
    let done = false, hint = "";
    try { done = !!t.check(summary); } catch (e) { done = false; }
    try { hint = t.hint ? t.hint(summary) : ""; } catch (e) { hint = ""; }
    return { id: t.id, title: t.title, done, hint };
  });
  // 5×5 grid; middle cell (index 12) is a free space.
  const grid = [];
  let ci = 0;
  for (let i = 0; i < 25; i++) {
    if (i === 12) grid.push({ id: "free", title: "★ FREE SPACE", done: true, hint: "on the house" });
    else grid.push(cells[ci++]);
  }
  const completed = grid.filter((c) => c.done).length;
  const rows = 5, cols = 5;
  // Any completed line (row / col / diagonal)?
  const idx = (r, c) => r * cols + c;
  const lines = [];
  for (let r = 0; r < rows; r++) lines.push(Array.from({ length: cols }, (_, c) => idx(r, c)));
  for (let c = 0; c < cols; c++) lines.push(Array.from({ length: rows }, (_, r) => idx(r, c)));
  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);
  const completedLines = lines.filter((line) => line.every((i) => grid[i].done)).length;
  return {
    seed,
    cells: grid,
    completed,
    total: grid.length,
    completedLines,
    hasBingo: completedLines > 0,
    blackout: completed === grid.length,
  };
}

module.exports = { computeBingo, TEMPLATES };
