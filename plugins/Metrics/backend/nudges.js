"use strict";

/* Nudges — a small pool of "hey, try this" suggestions rendered on the
 * Overview tab as a rotating banner.
 *
 * Each nudge is `{ id, kind, title, action, target }`:
 *   - kind:   short category slug (buried_treasure, neglected_perf, …)
 *   - title:  bold headline of the banner
 *   - action: one-line CTA describing what to do
 *   - target: { kind: "scene" | "performer" | "country", id?, name }
 * The UI picks one at random per session and shows it. */

function daysAgo(iso) {
  if (!iso) return Infinity;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return Infinity;
  return Math.round((Date.now() - t) / 86400000);
}

function computeNudges(scenes, performers, tags, ctx) {
  const out = [];
  const perfById = new Map(performers.map((p) => [p.id, p]));

  // 1. Buried treasure — first entry from quality.buriedTreasure if present.
  const buried = ctx && ctx.quality && ctx.quality.buriedTreasure;
  if (Array.isArray(buried) && buried.length) {
    const b = buried[0];
    out.push({
      id: "buried_" + b.id, kind: "buried_treasure",
      title: "Buried treasure alert",
      action: "You never played \"" + b.title + "\" — but you rated it " + Math.round(b.rating100 / 20 * 10) / 10 + "★.",
      target: { kind: "scene", id: b.id, name: b.title },
    });
  }

  // 2. Neglected favorite performer — favourited but no play in 90+ days.
  const favPerfPlays = new Map();
  const lastPerfPlay = new Map();
  for (const s of scenes) {
    const played = (s.play_count || 0) > 0;
    if (!played) continue;
    for (const p of s.performers || []) {
      favPerfPlays.set(p.id, (favPerfPlays.get(p.id) || 0) + (s.play_count || 0));
      const t = s.last_played_at ? new Date(s.last_played_at).getTime() : 0;
      if (t && (!lastPerfPlay.has(p.id) || t > lastPerfPlay.get(p.id))) {
        lastPerfPlay.set(p.id, t);
      }
    }
  }
  const neglected = performers
    .filter((p) => p.favorite && favPerfPlays.get(p.id) && (Date.now() - (lastPerfPlay.get(p.id) || 0)) > 90 * 86400000)
    .sort((a, b) => (lastPerfPlay.get(a.id) || 0) - (lastPerfPlay.get(b.id) || 0));
  if (neglected.length) {
    const n = neglected[0];
    const last = lastPerfPlay.get(n.id);
    const days = last ? Math.round((Date.now() - last) / 86400000) : null;
    out.push({
      id: "neglected_" + n.id, kind: "neglected_favorite",
      title: "You're missing a favorite",
      action: n.name + " hasn't been played in " + (days ? days + " days" : "a while") + ".",
      target: { kind: "performer", id: n.id, name: n.name },
    });
  }

  // 3. Untried high-rated performer.
  const untriedTop = performers
    .filter((p) => !favPerfPlays.get(p.id) && (p.rating100 || 0) >= 85)
    .sort((a, b) => (b.rating100 || 0) - (a.rating100 || 0));
  if (untriedTop.length) {
    const u = untriedTop[0];
    out.push({
      id: "untried_" + u.id, kind: "untried_top_performer",
      title: "New face to try",
      action: "You rated " + u.name + " " + Math.round(u.rating100 / 20 * 10) / 10 + "★ but never watched them.",
      target: { kind: "performer", id: u.id, name: u.name },
    });
  }

  // 4. Country you haven't visited in a while.
  const countryLast = new Map();
  for (const s of scenes) {
    if (!s.last_played_at) continue;
    const t = new Date(s.last_played_at).getTime();
    for (const p of s.performers || []) {
      const full = perfById.get(p.id);
      if (!full || !full.country) continue;
      const prev = countryLast.get(full.country) || 0;
      if (t > prev) countryLast.set(full.country, t);
    }
  }
  const staleCountry = Array.from(countryLast.entries())
    .filter(([, t]) => (Date.now() - t) > 60 * 86400000)
    .sort((a, b) => a[1] - b[1])[0];
  if (staleCountry) {
    const [code, t] = staleCountry;
    const days = Math.round((Date.now() - t) / 86400000);
    out.push({
      id: "country_" + code, kind: "stale_country",
      title: "Passport check",
      action: "You haven't watched anyone from " + code + " in " + days + " days.",
      target: { kind: "country", name: code },
    });
  }

  // 5. Studio blind spot — a studio with 3+ scenes but 0 plays.
  const studioSceneCount = new Map();
  const studioPlays = new Map();
  for (const s of scenes) {
    if (!s.studio) continue;
    studioSceneCount.set(s.studio.name, (studioSceneCount.get(s.studio.name) || 0) + 1);
    studioPlays.set(s.studio.name, (studioPlays.get(s.studio.name) || 0) + (s.play_count || 0));
  }
  const blindSpot = Array.from(studioSceneCount.entries())
    .filter(([name, cnt]) => cnt >= 3 && (studioPlays.get(name) || 0) === 0)
    .sort((a, b) => b[1] - a[1])[0];
  if (blindSpot) {
    out.push({
      id: "studio_" + blindSpot[0], kind: "studio_blindspot",
      title: "Studio blind spot",
      action: "You have " + blindSpot[1] + " scenes from " + blindSpot[0] + " but haven't played any.",
      target: { kind: "studio", name: blindSpot[0] },
    });
  }

  // 6. Hidden gem — from quality if present.
  const gems = ctx && ctx.quality && ctx.quality.hiddenGems;
  if (Array.isArray(gems) && gems.length) {
    const g = gems[0];
    out.push({
      id: "gem_" + g.id, kind: "hidden_gem",
      title: "Hidden gem",
      action: "\"" + g.title + "\" — " + Math.round((g.rating100 || 0) / 20 * 10) / 10 + "★, only " + (g.playCount || 0) + " plays.",
      target: { kind: "scene", id: g.id, name: g.title },
    });
  }

  return out;
}

module.exports = { computeNudges };
