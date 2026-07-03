"use strict";

/* Fun / spicy metrics. Everything here is derived from the raw scene +
 * performer + tag arrays plus timestamps. Zero external state. */

function toDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function median(xs) {
  const v = xs.filter((x) => x != null && !isNaN(x)).map(Number).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

function maxDur(s) {
  return Math.max.apply(null, (s.files || [{}]).map((f) => f.duration || 0));
}

function firstFile(s) { return (s.files && s.files[0]) || {}; }

// -----------------------------------------------------------------------
// STUDIO LOYALTY INDEX — Herfindahl-Hirschman concentration of your play
// activity across studios. 0 = perfectly spread, 1 = single-studio.
function studioLoyaltyIndex(scenes) {
  const plays = new Map();
  for (const s of scenes) {
    const pc = s.play_count || 0;
    if (!pc || !s.studio) continue;
    plays.set(s.studio.name, (plays.get(s.studio.name) || 0) + pc);
  }
  const total = Array.from(plays.values()).reduce((a, b) => a + b, 0);
  if (!total) return null;
  let hhi = 0;
  for (const v of plays.values()) hhi += Math.pow(v / total, 2);
  const top = Array.from(plays, ([name, p]) => ({ name, plays: p, share: +(p / total).toFixed(3) }))
    .sort((a, b) => b.plays - a.plays).slice(0, 6);
  const loyaltyLabel = hhi > 0.25 ? "Loyal" : hhi > 0.12 ? "Selective" : "Explorer";
  return {
    hhi: +hhi.toFixed(3),
    effectiveStudios: +(1 / hhi).toFixed(2),
    label: loyaltyLabel,
    top,
    totalPlays: total,
  };
}

// -----------------------------------------------------------------------
// PEAK SESSION — longest continuous play session (plays within `gapMin`
// of each other are the same session).
function peakSession(scenes, gapMinutes) {
  const gap = (gapMinutes || 120) * 60000;
  const events = [];
  for (const s of scenes) {
    const history = Array.isArray(s.play_history) ? s.play_history : [];
    for (const ts of history) {
      const d = toDate(ts);
      if (d) events.push({ ts: d.getTime(), sceneId: s.id, title: s.title || ("Scene " + s.id) });
    }
    if (!history.length && s.last_played_at && (s.play_count || 0) > 0) {
      const d = toDate(s.last_played_at);
      if (d) events.push({ ts: d.getTime(), sceneId: s.id, title: s.title || ("Scene " + s.id) });
    }
  }
  if (!events.length) return null;
  events.sort((a, b) => a.ts - b.ts);
  let cur = [events[0]], best = [events[0]];
  for (let i = 1; i < events.length; i++) {
    if (events[i].ts - cur[cur.length - 1].ts <= gap) cur.push(events[i]);
    else { if (cur.length > best.length) best = cur; cur = [events[i]]; }
  }
  if (cur.length > best.length) best = cur;
  return {
    playCount: best.length,
    startTs: new Date(best[0].ts).toISOString(),
    endTs: new Date(best[best.length - 1].ts).toISOString(),
    durationMinutes: Math.round((best[best.length - 1].ts - best[0].ts) / 60000),
    scenes: best.slice(0, 20).map((e) => ({ id: e.sceneId, title: e.title })),
  };
}

// -----------------------------------------------------------------------
// DRY SPELL / BINGE CYCLE — histogram of gaps between consecutive
// play-days.
function drySpellBingeCycle(scenes) {
  const days = new Set();
  for (const s of scenes) {
    const history = Array.isArray(s.play_history) ? s.play_history : [];
    for (const ts of history) {
      const d = toDate(ts);
      if (d) days.add(d.toISOString().slice(0, 10));
    }
    if (!history.length && s.last_played_at && (s.play_count || 0) > 0) {
      const d = toDate(s.last_played_at);
      if (d) days.add(d.toISOString().slice(0, 10));
    }
  }
  const sorted = Array.from(days).sort();
  if (sorted.length < 2) return null;
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1]).getTime();
    const b = new Date(sorted[i]).getTime();
    gaps.push(Math.round((b - a) / 86400000));
  }
  const buckets = { sameDay: 0, nextDay: 0, week: 0, twoWeeks: 0, month: 0, dry: 0 };
  for (const g of gaps) {
    if (g <= 0) buckets.sameDay++;
    else if (g === 1) buckets.nextDay++;
    else if (g <= 7) buckets.week++;
    else if (g <= 14) buckets.twoWeeks++;
    else if (g <= 30) buckets.month++;
    else buckets.dry++;
  }
  const bingeShare = (buckets.sameDay + buckets.nextDay) / gaps.length;
  const drySpellShare = buckets.dry / gaps.length;
  return {
    totalPlayDays: sorted.length,
    longestDrySpellDays: gaps.length ? Math.max.apply(null, gaps) : 0,
    medianGapDays: median(gaps) || 0,
    buckets,
    bingeShare: +bingeShare.toFixed(3),
    drySpellShare: +drySpellShare.toFixed(3),
    style: bingeShare > 0.5 ? "Binge watcher" : drySpellShare > 0.3 ? "Sporadic" : "Steady watcher",
  };
}

// -----------------------------------------------------------------------
// PEAK INTENSITY WINDOW — same DoW × hour grid as the play heatmap but
// cells hold avg O per play (not raw play count). Surfaces when you're
// actually finishing vs when you're just watching.
function peakIntensityWindow(scenes) {
  const sumO = Array.from({ length: 7 }, () => new Array(24).fill(0));
  const playCount = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const s of scenes) {
    const o = s.o_counter || 0;
    const history = Array.isArray(s.play_history) ? s.play_history : [];
    const events = history.length ? history : (s.last_played_at && (s.play_count || 0) > 0 ? [s.last_played_at] : []);
    for (const ts of events) {
      const d = toDate(ts);
      if (!d) continue;
      const dow = (d.getDay() + 6) % 7;
      const hr = d.getHours();
      sumO[dow][hr] += o;
      playCount[dow][hr] += 1;
    }
  }
  const intensity = sumO.map((row, d) =>
    row.map((v, h) => (playCount[d][h] > 0 ? +(v / playCount[d][h]).toFixed(2) : 0)));
  let peakDow = 0, peakHour = 0, peakVal = 0;
  for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) {
    if (intensity[d][h] > peakVal) { peakVal = intensity[d][h]; peakDow = d; peakHour = h; }
  }
  return { intensity, playCount, peakDow, peakHour, peakVal: +peakVal.toFixed(2) };
}

// -----------------------------------------------------------------------
// OPTIMAL DURATION — bucket scenes by duration, compute avg O/scene and
// avg O/play. Which lengths actually deliver.
function optimalDuration(scenes) {
  const defs = [
    { key: "short", name: "Short (< 10m)", min: 0, max: 600 },
    { key: "medium", name: "Medium (10–25m)", min: 600, max: 1500 },
    { key: "long", name: "Long (25–45m)", min: 1500, max: 2700 },
    { key: "feature", name: "Feature (45–75m)", min: 2700, max: 4500 },
    { key: "marathon", name: "Marathon (75m+)", min: 4500, max: Infinity },
  ];
  const buckets = defs.map((d) => ({ ...d, sumO: 0, sceneCount: 0, plays: 0 }));
  for (const s of scenes) {
    const dur = maxDur(s);
    if (!dur) continue;
    const b = buckets.find((x) => dur >= x.min && dur < x.max);
    if (!b) continue;
    b.sceneCount++;
    b.sumO += s.o_counter || 0;
    b.plays += s.play_count || 0;
  }
  return buckets.map((b) => ({
    name: b.name,
    sceneCount: b.sceneCount,
    totalO: b.sumO,
    totalPlays: b.plays,
    avgOPerScene: b.sceneCount ? +(b.sumO / b.sceneCount).toFixed(2) : 0,
    avgOPerPlay: b.plays ? +(b.sumO / b.plays).toFixed(3) : 0,
  }));
}

// -----------------------------------------------------------------------
// KINK EVOLUTION — top 8 played tags per month over the last 12 months.
function kinkEvolution(scenes, monthsBack, topTags) {
  monthsBack = monthsBack || 12;
  topTags = topTags || 8;
  const now = new Date();
  const months = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  const monthSet = new Set(months);
  const perMonth = new Map(months.map((m) => [m, new Map()]));

  for (const s of scenes) {
    const history = Array.isArray(s.play_history) ? s.play_history : [];
    const events = history.length ? history : (s.last_played_at && (s.play_count || 0) > 0
      ? new Array(s.play_count || 1).fill(s.last_played_at) : []);
    for (const ts of events) {
      const m = String(ts).slice(0, 7);
      if (!monthSet.has(m)) continue;
      const t = perMonth.get(m);
      for (const tg of s.tags || []) t.set(tg.name, (t.get(tg.name) || 0) + 1);
    }
  }
  const overall = new Map();
  for (const t of perMonth.values()) for (const [k, v] of t) overall.set(k, (overall.get(k) || 0) + v);
  const top = Array.from(overall.entries()).sort((a, b) => b[1] - a[1]).slice(0, topTags).map(([k]) => k);
  return {
    labels: months,
    series: top.map((tag) => ({
      label: tag,
      values: months.map((m) => perMonth.get(m).get(tag) || 0),
    })),
  };
}

// -----------------------------------------------------------------------
// TIME CAPSULE — top scenes/performers/tags from a ±2 week window
// N months ago.
function timeCapsule(scenes, performers, monthsBack) {
  monthsBack = monthsBack || 6;
  const now = Date.now();
  const target = now - monthsBack * 30 * 86400000;
  const winStart = target - 14 * 86400000;
  const winEnd = target + 14 * 86400000;
  const perfById = new Map(performers.map((p) => [p.id, p]));

  const scenesInWindow = new Map();
  for (const s of scenes) {
    let played = 0;
    const history = Array.isArray(s.play_history) ? s.play_history : [];
    for (const ts of history) {
      const t = new Date(ts).getTime();
      if (!isNaN(t) && t >= winStart && t <= winEnd) played++;
    }
    if (!history.length && s.last_played_at) {
      const t = new Date(s.last_played_at).getTime();
      if (!isNaN(t) && t >= winStart && t <= winEnd) played = s.play_count || 1;
    }
    if (played > 0) scenesInWindow.set(s.id, { scene: s, plays: played });
  }
  if (!scenesInWindow.size) return { monthsBack, empty: true };

  const topScenes = Array.from(scenesInWindow.values())
    .sort((a, b) => b.plays - a.plays).slice(0, 8)
    .map(({ scene, plays }) => ({
      id: scene.id, title: scene.title || ("Scene " + scene.id),
      plays, rating100: scene.rating100,
    }));
  const perfPlays = new Map();
  const tagPlays = new Map();
  for (const { scene, plays } of scenesInWindow.values()) {
    for (const p of scene.performers || []) perfPlays.set(p.id, (perfPlays.get(p.id) || 0) + plays);
    for (const t of scene.tags || []) tagPlays.set(t.name, (tagPlays.get(t.name) || 0) + plays);
  }
  const topPerformers = Array.from(perfPlays.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([id, plays]) => ({ id, name: (perfById.get(id) || {}).name || id, plays }));
  const topTags = Array.from(tagPlays.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, plays]) => ({ name, plays }));
  return { monthsBack, empty: false, topScenes, topPerformers, topTags };
}

// -----------------------------------------------------------------------
// COUNTRY TOURISM — per country: performer count, scene count, play
// count. Sorted by scenes.
function countryTourism(scenes, performers) {
  const perfByCountry = new Map();
  for (const p of performers) {
    const c = p.country;
    if (!c) continue;
    perfByCountry.set(c, (perfByCountry.get(c) || 0) + 1);
  }
  const sceneCount = new Map();
  const playCount = new Map();
  const performerHasCountry = new Map(performers.map((p) => [p.id, p.country]));
  for (const s of scenes) {
    const seen = new Set();
    for (const pp of s.performers || []) {
      const c = performerHasCountry.get(pp.id);
      if (!c || seen.has(c)) continue;
      seen.add(c);
      sceneCount.set(c, (sceneCount.get(c) || 0) + 1);
      playCount.set(c, (playCount.get(c) || 0) + (s.play_count || 0));
    }
  }
  const out = [];
  const allCountries = new Set([...perfByCountry.keys(), ...sceneCount.keys()]);
  for (const c of allCountries) {
    out.push({
      code: c,
      performerCount: perfByCountry.get(c) || 0,
      sceneCount: sceneCount.get(c) || 0,
      playCount: playCount.get(c) || 0,
    });
  }
  out.sort((a, b) => b.sceneCount - a.sceneCount);
  return out;
}

// -----------------------------------------------------------------------
// PERSONALITY READ — plain-English archetype summary derived from other
// computed blocks + raw stats.
function personalityRead(scenes, performers, meta) {
  const traits = [];
  const summary = [];
  const total = scenes.length;
  const played = scenes.filter((s) => (s.play_count || 0) > 0).length;
  const rated = scenes.filter((s) => s.rating100 != null).length;
  const favorited = performers.filter((p) => p.favorite).length;
  const totalPlays = scenes.reduce((s, sc) => s + (sc.play_count || 0), 0);
  const avgPlays = played ? totalPlays / played : 0;
  const uniqueTags = new Set();
  for (const s of scenes) for (const t of s.tags || []) uniqueTags.add(t.name);
  const uniqueCountries = new Set(performers.map((p) => p.country).filter(Boolean));

  // Rewatcher vs Explorer.
  if (avgPlays >= 2.5) { traits.push("Rewatcher"); summary.push("You lean into rewatch — avg " + avgPlays.toFixed(1) + " plays per touched scene."); }
  else if (played / Math.max(1, total) > 0.7 && avgPlays < 1.5) { traits.push("Explorer"); summary.push("You cover ground — " + Math.round(played / total * 100) + "% of your library has at least one play."); }

  // Curator.
  if (rated / Math.max(1, total) > 0.5) { traits.push("Curator"); summary.push("You rate seriously — " + Math.round(rated / total * 100) + "% of scenes carry a rating."); }

  // Loyal / Explorer studios.
  if (meta && meta.studioLoyalty && meta.studioLoyalty.label) {
    if (meta.studioLoyalty.label === "Loyal") summary.push("Studio-loyal — your top " + (meta.studioLoyalty.top[0] ? meta.studioLoyalty.top[0].name : "studio") + " alone drives " + Math.round((meta.studioLoyalty.top[0] || {}).share * 100) + "% of your plays.");
    else if (meta.studioLoyalty.label === "Explorer") summary.push("Studio-wide — you spread across ~" + Math.round(meta.studioLoyalty.effectiveStudios) + " effective studios.");
  }

  // Binge / steady / sporadic.
  if (meta && meta.drySpell && meta.drySpell.style) summary.push(meta.drySpell.style + " — " + Math.round((meta.drySpell.bingeShare || 0) * 100) + "% of gaps between play-days are ≤ 1 day.");

  // Cosmopolitan.
  if (uniqueCountries.size >= 12) { traits.push("Cosmopolitan"); summary.push("Cosmopolitan — " + uniqueCountries.size + " countries represented in your roster."); }

  // Fetish depth.
  if (uniqueTags.size >= 100) summary.push("Tag-rich — " + uniqueTags.size + " unique tags across the library.");

  // Peak time.
  const dowLabels = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];
  if (meta && meta.peakDow != null) summary.push("Peak play window: " + dowLabels[meta.peakDow] + " around " + String(meta.peakHour || 0).padStart(2, "0") + ":00.");

  // Favourites.
  if (favorited > 0) summary.push(favorited + " performers favourited.");

  // Compose an archetype title.
  let archetype = "The Balanced Watcher";
  if (traits.includes("Rewatcher") && traits.includes("Curator")) archetype = "The Loyal Curator";
  else if (traits.includes("Explorer") && traits.includes("Cosmopolitan")) archetype = "The Cosmopolitan Explorer";
  else if (traits.includes("Rewatcher")) archetype = "The Rewatcher";
  else if (traits.includes("Explorer")) archetype = "The Explorer";
  else if (traits.includes("Curator")) archetype = "The Curator";

  return { archetype, traits, summary };
}

module.exports = {
  studioLoyaltyIndex,
  peakSession,
  drySpellBingeCycle,
  peakIntensityWindow,
  optimalDuration,
  kinkEvolution,
  timeCapsule,
  countryTourism,
  personalityRead,
};
