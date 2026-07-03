"use strict";

const fs = require("fs");
const path = require("path");

/* Year-in-Review report. Produces a standalone, offline-friendly HTML
 * summary scoped to one calendar year. */

function inYear(iso, year) {
  if (!iso) return false;
  return String(iso).slice(0, 4) === String(year);
}

function bytes(n) {
  if (!n) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let v = n, i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return v.toFixed(v >= 100 || i === 0 ? 0 : 1) + " " + units[i];
}
function duration(seconds) {
  if (!seconds) return "0s";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return h + "h " + m + "m";
  return m + "m";
}

function computeYearReview(performers, scenes, tags, studios, year, opts) {
  opts = opts || {};
  const yr = year || (new Date().getFullYear() - 1);
  const inYr = scenes.filter((s) => inYear(s.created_at, yr) || inYear(s.date, yr));
  const addedInYr = scenes.filter((s) => inYear(s.created_at, yr));
  const releasedInYr = scenes.filter((s) => inYear(s.date, yr));

  const totalDuration = inYr.reduce((sum, s) => sum + maxFileDuration(s), 0);
  const totalSize = inYr.reduce((sum, s) => sum + sumFileSize(s), 0);
  const totalPlays = inYr.reduce((sum, s) => sum + (s.play_count || 0), 0);

  // Top performers in year — by scene count appearance.
  const perfCount = new Map();
  for (const s of inYr) for (const p of s.performers || []) {
    perfCount.set(p.id, (perfCount.get(p.id) || 0) + 1);
  }
  const performerById = new Map(performers.map((p) => [p.id, p]));
  const topPerformers = Array.from(perfCount.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([id, n]) => ({
      id, name: (performerById.get(id) || {}).name || id, scenes: n,
    }));

  // Top studios
  const studioCount = new Map();
  for (const s of inYr) if (s.studio) studioCount.set(s.studio.name, (studioCount.get(s.studio.name) || 0) + 1);
  const topStudios = Array.from(studioCount.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, n]) => ({ name, scenes: n }));

  // Top tags
  const tagCount = new Map();
  for (const s of inYr) for (const t of s.tags || []) tagCount.set(t.name, (tagCount.get(t.name) || 0) + 1);
  const topTags = Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 15)
    .map(([name, n]) => ({ name, scenes: n }));

  // Top played scenes in year
  const topPlayed = inYr.slice()
    .filter((s) => (s.play_count || 0) > 0)
    .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
    .slice(0, 10)
    .map((s) => ({
      id: s.id, title: s.title || ("Scene " + s.id),
      playCount: s.play_count || 0,
      performers: (s.performers || []).map((p) => p.name),
    }));

  // Highest-rated scenes added in year
  const topRated = addedInYr.slice()
    .filter((s) => s.rating100 != null)
    .sort((a, b) => (b.rating100 || 0) - (a.rating100 || 0))
    .slice(0, 10)
    .map((s) => ({
      id: s.id, title: s.title || ("Scene " + s.id),
      rating100: s.rating100 || 0,
    }));

  // Performer debuts in year (first scene date)
  const firstByPerf = new Map();
  for (const s of scenes) {
    if (!s.date) continue;
    for (const p of s.performers || []) {
      if (!firstByPerf.has(p.id) || s.date < firstByPerf.get(p.id)) {
        firstByPerf.set(p.id, s.date);
      }
    }
  }
  const debuts = Array.from(firstByPerf.entries())
    .filter(([_, d]) => inYear(d, yr))
    .map(([id]) => ({ id, name: (performerById.get(id) || {}).name || id }))
    .slice(0, 15);

  // Tags first seen in year
  const tagFirst = new Map();
  for (const s of scenes) {
    if (!s.date) continue;
    for (const t of s.tags || []) {
      if (!tagFirst.has(t.name) || s.date < tagFirst.get(t.name)) tagFirst.set(t.name, s.date);
    }
  }
  const newTags = Array.from(tagFirst.entries())
    .filter(([_, d]) => inYear(d, yr))
    .map(([name]) => name)
    .slice(0, 20);

  return {
    year: yr,
    summary: {
      totalScenesInYear: inYr.length,
      addedScenes: addedInYr.length,
      releasedScenes: releasedInYr.length,
      totalDuration,
      totalSize,
      totalPlays,
      uniquePerformers: perfCount.size,
      uniqueStudios: studioCount.size,
      uniqueTags: tagCount.size,
    },
    topPerformers, topStudios, topTags, topPlayed, topRated,
    debuts, newTags,
  };
}

function maxFileDuration(s) {
  if (!s.files || !s.files.length) return 0;
  return Math.max.apply(null, s.files.map((f) => f.duration || 0));
}
function sumFileSize(s) {
  if (!s.files || !s.files.length) return 0;
  return s.files.reduce((sum, f) => sum + (Number(f.size) || 0), 0);
}

function writeYearReviewHtml(file, payload, opts) {
  const chartJsPath = (opts && opts.chartJsUrl) || "../../assets/lib/chart.umd.min.js";
  const data = JSON.stringify(payload).replace(/</g, "\\u003c");
  const generated = new Date().toISOString();
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Stash Year in Review — ${payload.year}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         background: #11151a; color: #cfd6dc; margin: 0; padding: 24px; }
  h1 { font-size: 28px; margin: 0; }
  h1 .yr { color: #4f8ef7; }
  .sub { color: #8e98a0; font-size: 12px; margin-bottom: 24px; }
  h2 { font-size: 15px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.4px; color: #cfd6dc; }
  .kpi-row { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); margin-bottom: 20px; }
  .kpi { background: #1c2126; border: 1px solid #2b3338; border-radius: 8px; padding: 12px 14px; }
  .kpi-label { color: #8e98a0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
  .kpi-value { color: #fff; font-size: 22px; font-weight: 600; }
  .grid { display: grid; gap: 14px; grid-template-columns: 1fr 1fr; }
  .card { background: #1c2126; border: 1px solid #2b3338; border-radius: 8px; padding: 14px; }
  ol, ul { padding-left: 18px; margin: 0; }
  ol li, ul li { margin-bottom: 4px; line-height: 1.45; color: #cfd6dc; }
  .muted { color: #8e98a0; font-size: 11px; }
  .badge {
    display: inline-block; background: #11151a; border: 1px solid #2b3338;
    border-radius: 10px; padding: 1px 8px; margin: 1px; font-size: 11px; color: #cfd6dc;
  }
  .hero { text-align: center; padding: 14px 0 24px; }
  .hero .num { font-size: 64px; font-weight: 700; color: #4f8ef7; line-height: 1; }
  .hero .lbl { font-size: 14px; color: #8e98a0; text-transform: uppercase; letter-spacing: 0.5px; }
  @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
  <h1>Year in Review — <span class="yr">${payload.year}</span></h1>
  <div class="sub">Generated ${generated}</div>

  <div class="hero">
    <div class="num" id="hero-scenes"></div>
    <div class="lbl">scenes added in ${payload.year}</div>
  </div>

  <div class="kpi-row" id="kpis"></div>

  <div class="grid">
    <div class="card"><h2>Top performers</h2><ol id="top-performers"></ol></div>
    <div class="card"><h2>Top tags</h2><div id="top-tags"></div></div>
    <div class="card"><h2>Top studios</h2><ol id="top-studios"></ol></div>
    <div class="card"><h2>Most played scenes</h2><ol id="top-played"></ol></div>
    <div class="card"><h2>Top rated additions</h2><ol id="top-rated"></ol></div>
    <div class="card"><h2>Performer debuts</h2><ul id="debuts"></ul></div>
    <div class="card"><h2>New tags discovered</h2><div id="new-tags"></div></div>
  </div>

  <script>window.__YR__ = ${data};</script>
  <script>
    (function () {
      const d = window.__YR__;
      const s = d.summary || {};
      document.getElementById("hero-scenes").textContent = (s.addedScenes||0).toLocaleString();
      function kpi(label, value, sub) {
        const el = document.createElement("div");
        el.className = "kpi";
        el.innerHTML = '<div class="kpi-label">'+label+'</div><div class="kpi-value">'+value+'</div><div class="kpi-label">'+(sub||"")+'</div>';
        document.getElementById("kpis").appendChild(el);
      }
      kpi("Released", (s.releasedScenes||0).toLocaleString(), "scenes dated " + d.year);
      kpi("Watch time", Math.round((s.totalDuration||0)/3600)+"h", "across in-year scenes");
      kpi("Plays", (s.totalPlays||0).toLocaleString(), "");
      kpi("Storage", (function(n){if(!n)return"0 B";const u=["B","KiB","MiB","GiB","TiB"];let v=n,i=0;while(v>=1024&&i<u.length-1){v/=1024;i++}return v.toFixed(v>=100||i===0?0:1)+" "+u[i];})(s.totalSize), "");
      kpi("Performers", (s.uniquePerformers||0).toLocaleString(), "unique");
      kpi("Tags", (s.uniqueTags||0).toLocaleString(), "unique");

      const tp = document.getElementById("top-performers");
      (d.topPerformers||[]).forEach(p => {
        const li = document.createElement("li");
        li.innerHTML = '<span></span> <span class="muted"></span>';
        li.children[0].textContent = p.name;
        li.children[1].textContent = " · " + p.scenes + " scenes";
        tp.appendChild(li);
      });
      const ts = document.getElementById("top-studios");
      (d.topStudios||[]).forEach(p => {
        const li = document.createElement("li");
        li.innerHTML = '<span></span> <span class="muted"></span>';
        li.children[0].textContent = p.name;
        li.children[1].textContent = " · " + p.scenes + " scenes";
        ts.appendChild(li);
      });
      const tt = document.getElementById("top-tags");
      (d.topTags||[]).forEach(t => {
        const b = document.createElement("span");
        b.className = "badge";
        b.textContent = t.name + " (" + t.scenes + ")";
        tt.appendChild(b);
      });
      const top = document.getElementById("top-played");
      (d.topPlayed||[]).forEach(p => {
        const li = document.createElement("li");
        li.innerHTML = '<span></span> <span class="muted"></span>';
        li.children[0].textContent = p.title;
        li.children[1].textContent = " · " + p.playCount + " plays";
        top.appendChild(li);
      });
      const tr = document.getElementById("top-rated");
      (d.topRated||[]).forEach(p => {
        const li = document.createElement("li");
        li.innerHTML = '<span></span> <span class="muted"></span>';
        li.children[0].textContent = p.title;
        li.children[1].textContent = " · ★ " + p.rating100;
        tr.appendChild(li);
      });
      const dbts = document.getElementById("debuts");
      (d.debuts||[]).forEach(p => {
        const li = document.createElement("li");
        li.textContent = p.name;
        dbts.appendChild(li);
      });
      const nt = document.getElementById("new-tags");
      (d.newTags||[]).forEach(name => {
        const b = document.createElement("span");
        b.className = "badge";
        b.textContent = name;
        nt.appendChild(b);
      });
    })();
  </script>
</body>
</html>`;
  fs.writeFileSync(file, html, "utf8");
}

module.exports = { computeYearReview, writeYearReviewHtml };
