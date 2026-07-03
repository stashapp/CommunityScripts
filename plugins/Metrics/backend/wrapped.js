"use strict";

/* Yearly Wrapped — Spotify-style slideshow summary of a single year of
 * activity. Computes everything needed for the slides from the raw scene +
 * performer arrays. If there's no activity in the requested year, we fall
 * back to the most recent year that has any plays. */

function toDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function pickBestYear(scenes, preferredYear) {
  const byYear = new Map();
  for (const s of scenes) {
    const events = collectPlayEvents(s);
    for (const t of events) {
      const y = new Date(t).getFullYear();
      byYear.set(y, (byYear.get(y) || 0) + 1);
    }
  }
  if (preferredYear && byYear.get(preferredYear)) return preferredYear;
  if (!byYear.size) return null;
  return Array.from(byYear.entries()).sort((a, b) => b[1] - a[1])[0][0];
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

function inYear(ts, year) {
  const d = new Date(ts);
  return d.getFullYear() === year;
}

// Duration of a scene's longest file, in seconds.
function maxDur(s) {
  return Math.max.apply(null, (s.files || [{}]).map((f) => f.duration || 0));
}

function computeWrapped(scenes, performers, tags, opts) {
  opts = opts || {};
  const year = opts.year || pickBestYear(scenes, opts.preferredYear);
  if (year == null) return { available: false, reason: "No play history yet." };

  const perfById = new Map(performers.map((p) => [p.id, p]));

  // Per-year aggregations.
  let totalPlays = 0, totalSeconds = 0;
  const scenePlays = new Map();
  const perfPlays = new Map();
  const studioPlays = new Map();
  const tagPlays = new Map();
  const dayCounts = new Map();       // "YYYY-MM-DD" → plays
  const hourCounts = new Array(24).fill(0);
  const dowCounts = new Array(7).fill(0);
  const countryPlays = new Map();
  const monthCounts = new Array(12).fill(0);

  for (const s of scenes) {
    const events = collectPlayEvents(s).filter((t) => inYear(t, year));
    if (!events.length) continue;
    const dur = maxDur(s);
    for (const t of events) {
      totalPlays++;
      totalSeconds += dur;
      const d = new Date(t);
      const key = d.toISOString().slice(0, 10);
      dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
      hourCounts[d.getHours()]++;
      dowCounts[(d.getDay() + 6) % 7]++;
      monthCounts[d.getMonth()]++;
    }
    scenePlays.set(s.id, (scenePlays.get(s.id) || 0) + events.length);
    if (s.studio) studioPlays.set(s.studio.name, (studioPlays.get(s.studio.name) || 0) + events.length);
    for (const p of s.performers || []) {
      perfPlays.set(p.id, (perfPlays.get(p.id) || 0) + events.length);
      const full = perfById.get(p.id);
      if (full && full.country) countryPlays.set(full.country, (countryPlays.get(full.country) || 0) + events.length);
    }
    for (const t of s.tags || []) tagPlays.set(t.name, (tagPlays.get(t.name) || 0) + events.length);
  }

  if (!totalPlays) return { available: false, reason: "No plays in " + year, year };

  // Top scenes / performers / tags / studios.
  const sceneById = new Map(scenes.map((s) => [s.id, s]));
  const topScenes = Array.from(scenePlays.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, plays]) => {
      const s = sceneById.get(id) || {};
      return {
        id, plays,
        title: s.title || ("Scene " + id),
        studio: s.studio ? s.studio.name : null,
        rating100: s.rating100 != null ? s.rating100 : null,
      };
    });
  const topPerformers = Array.from(perfPlays.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, plays]) => {
      const p = perfById.get(id) || {};
      return { id, plays, name: p.name || id, country: p.country || null };
    });
  const topStudios = Array.from(studioPlays.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, plays]) => ({ name, plays }));
  const topTags = Array.from(tagPlays.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, plays]) => ({ name, plays }));

  // Peak day.
  let peakDay = null;
  for (const [day, count] of dayCounts) {
    if (!peakDay || count > peakDay.plays) peakDay = { date: day, plays: count };
  }

  // Longest streak of consecutive play-days.
  const days = Array.from(dayCounts.keys()).sort();
  let bestStreak = { length: 0, start: null, end: null };
  let cur = { length: 1, start: days[0], end: days[0] };
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]).getTime();
    const now = new Date(days[i]).getTime();
    if (Math.round((now - prev) / 86400000) === 1) {
      cur.length++;
      cur.end = days[i];
    } else {
      if (cur.length > bestStreak.length) bestStreak = { ...cur };
      cur = { length: 1, start: days[i], end: days[i] };
    }
  }
  if (cur.length > bestStreak.length) bestStreak = { ...cur };

  // Peak hour / day-of-week.
  let peakHour = 0, peakHourVal = 0;
  for (let h = 0; h < 24; h++) if (hourCounts[h] > peakHourVal) { peakHourVal = hourCounts[h]; peakHour = h; }
  let peakDow = 0, peakDowVal = 0;
  for (let d = 0; d < 7; d++) if (dowCounts[d] > peakDowVal) { peakDowVal = dowCounts[d]; peakDow = d; }

  // Biggest new discovery — a performer with plays this year but no plays
  // any prior year.
  const priorPerfPlays = new Set();
  for (const s of scenes) {
    const priorEvents = collectPlayEvents(s).filter((t) => new Date(t).getFullYear() < year);
    if (!priorEvents.length) continue;
    for (const p of s.performers || []) priorPerfPlays.add(p.id);
  }
  const newDiscoveries = Array.from(perfPlays.entries())
    .filter(([id]) => !priorPerfPlays.has(id))
    .sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([id, plays]) => {
      const p = perfById.get(id) || {};
      return { id, name: p.name || id, plays, country: p.country || null };
    });

  const totalMinutes = Math.round(totalSeconds / 60);
  const totalHours = +(totalSeconds / 3600).toFixed(1);
  const daysActive = dayCounts.size;

  // A cute one-line vibe based on totals.
  let vibe = "The Contented Watcher";
  if (totalPlays >= 500 && bestStreak.length >= 7) vibe = "The All-In Enthusiast";
  else if (topPerformers.length && topPerformers[0].plays >= 20) vibe = "The Loyal Devotee";
  else if (topTags.length >= 5 && countryPlays.size >= 8) vibe = "The Globe-Trotting Explorer";
  else if (daysActive >= 200) vibe = "The Daily Regular";
  else if (peakDay && peakDay.plays >= 8) vibe = "The Weekend Warrior";

  return {
    available: true,
    year,
    totals: {
      plays: totalPlays,
      totalSeconds,
      totalMinutes,
      totalHours,
      uniqueScenes: scenePlays.size,
      uniquePerformers: perfPlays.size,
      uniqueStudios: studioPlays.size,
      uniqueTags: tagPlays.size,
      uniqueCountries: countryPlays.size,
      daysActive,
    },
    topScenes, topPerformers, topStudios, topTags,
    peakDay,
    longestStreak: bestStreak.length ? bestStreak : null,
    peakHour, peakDow,
    monthlyPlays: monthCounts,
    newDiscoveries,
    vibe,
  };
}

module.exports = { computeWrapped };
