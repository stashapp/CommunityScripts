"use strict";

const fs = require("fs");
const path = require("path");

/* Standalone-HTML report generator. The HTML embeds Chart.js from the same
 * vendored bundle the dashboard uses (so the report opens offline) and
 * inlines all chart configs as a JSON blob the boot script wires up. */

function writeCsv(file, rows, columns) {
  const esc = (v) => {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [columns.join(",")];
  for (const r of rows) lines.push(columns.map((c) => esc(r[c])).join(","));
  fs.writeFileSync(file, lines.join("\n"), "utf8");
}

function writeCsvBundle(dir, payload) {
  fs.mkdirSync(dir, { recursive: true });
  writeCsv(path.join(dir, "tag_frequency.csv"),
    payload.tagFrequency || [], ["id", "label", "value"]);
  writeCsv(path.join(dir, "tag_co_occurrence.csv"),
    payload.tagCoOccurrence || [], ["a", "b", "weight"]);
  writeCsv(path.join(dir, "top_performers_by_scenes.csv"),
    payload.topByScenes || [], ["id", "label", "value"]);
  writeCsv(path.join(dir, "top_performers_by_duration.csv"),
    (payload.topByDuration || []).map((p) => ({ ...p, minutes: Math.round(p.value / 60) })),
    ["id", "label", "value", "minutes"]);
  writeCsv(path.join(dir, "top_performers_by_rating.csv"),
    payload.topByRating || [], ["id", "label", "value"]);
  writeCsv(path.join(dir, "gender_distribution.csv"),
    payload.genderDistribution || [], ["label", "value"]);
  writeCsv(path.join(dir, "country_distribution.csv"),
    payload.countryDistribution || [], ["label", "value"]);
  writeCsv(path.join(dir, "ethnicity_distribution.csv"),
    payload.ethnicityDistribution || [], ["label", "value"]);
  writeCsv(path.join(dir, "scenes_per_month.csv"),
    (payload.scenesPerMonth?.labels || []).map((l, i) => ({
      month: l, count: payload.scenesPerMonth.counts[i],
    })), ["month", "count"]);
  writeCsv(path.join(dir, "studio_storage.csv"),
    (payload.studioStorage || []).map((s) => ({ ...s, gigabytes: +(s.value / (1024 ** 3)).toFixed(2) })),
    ["label", "value", "gigabytes"]);
  writeCsv(path.join(dir, "performer_pairs.csv"),
    payload.topPerformerPairs || [], ["a", "b", "weight"]);

  // ---- Correlation exports (only if computed)
  const corr = payload.correlations;
  if (corr) {
    for (const attr of Object.keys(corr.perAttribute || {})) {
      writeCsv(path.join(dir, "correlations_" + attr + ".csv"),
        corr.perAttribute[attr],
        ["value", "n", "avgPerformerO", "avgSceneO", "shareHighO", "totalO"]);
    }
    writeCsv(path.join(dir, "correlations_cramers_v.csv"),
      Object.entries(corr.cramersV || {}).map(([attr, v]) => ({ attr, cramersV: v })),
      ["attr", "cramersV"]);
    writeCsv(path.join(dir, "correlations_pearson.csv"),
      Object.entries(corr.pearsonOrdinal || {}).map(([attr, r]) => ({ attr, pearsonR: r })),
      ["attr", "pearsonR"]);
  }
}

function writeHtml(file, payload, opts) {
  const chartJsPath = (opts && opts.chartJsUrl) || "../../assets/lib/chart.umd.min.js";
  const generated = new Date().toISOString();
  const data = JSON.stringify(payload).replace(/</g, "\\u003c");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Stash Metrics Report — ${generated}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         background: #11151a; color: #cfd6dc; margin: 0; padding: 24px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #8e98a0; font-size: 12px; margin-bottom: 24px; }
  .kpi-row { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); margin-bottom: 16px; }
  .kpi { background: #1c2126; border: 1px solid #2b3338; border-radius: 8px; padding: 12px 14px; }
  .kpi-label { color: #8e98a0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
  .kpi-value { color: #fff; font-size: 22px; font-weight: 600; }
  .grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); }
  .card { background: #1c2126; border: 1px solid #2b3338; border-radius: 8px; padding: 14px; }
  .card h2 { font-size: 13px; margin: 0 0 10px; letter-spacing: 0.3px; text-transform: uppercase; color: #cfd6dc; }
  .card canvas { width: 100% !important; height: 320px !important; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border-bottom: 1px solid #2b3338; padding: 4px 6px; text-align: left; }
  th { color: #8e98a0; font-weight: 600; }
  details summary { cursor: pointer; color: #4f8ef7; margin: 16px 0 8px; }
</style>
</head>
<body>
  <h1>Stash Library Metrics</h1>
  <div class="sub">Generated ${generated}</div>

  <div class="kpi-row" id="kpis"></div>

  <div class="grid">
    <div class="card"><h2>Scene duration distribution</h2><canvas id="durHist"></canvas></div>
    <div class="card"><h2>Storage by studio (top 10)</h2><canvas id="studioSize"></canvas></div>
    <div class="card"><h2>Resolution</h2><canvas id="res"></canvas></div>
    <div class="card"><h2>Video codecs</h2><canvas id="codecs"></canvas></div>
    <div class="card"><h2>Scene ratings</h2><canvas id="ratings"></canvas></div>
    <div class="card"><h2>Organization</h2><canvas id="org"></canvas></div>

    <div class="card"><h2>Gender distribution</h2><canvas id="gender"></canvas></div>
    <div class="card"><h2>Top 10 countries</h2><canvas id="countries"></canvas></div>
    <div class="card"><h2>Top 10 ethnicities</h2><canvas id="ethnicities"></canvas></div>
    <div class="card"><h2>Height distribution</h2><canvas id="heights"></canvas></div>
    <div class="card"><h2>Top performers (scene count)</h2><canvas id="topPerf"></canvas></div>
    <div class="card"><h2>Top performers (total minutes)</h2><canvas id="topDur"></canvas></div>

    <div class="card"><h2>Most used tags</h2><canvas id="tags"></canvas></div>
    <div class="card"><h2>Tag co-occurrence (top 20)</h2><canvas id="tagco"></canvas></div>
    <div class="card"><h2>Scenes by month</h2><canvas id="scenesMonth"></canvas></div>
    <div class="card"><h2>Hours per month</h2><canvas id="hoursMonth"></canvas></div>
  </div>

  <details>
    <summary>Top performer collaborations (table)</summary>
    <table id="pairs"><thead><tr><th>#</th><th>Performer A</th><th>Performer B</th><th>Shared scenes</th></tr></thead><tbody></tbody></table>
  </details>

  <script>window.__METRICS__ = ${data};</script>
  <script src="${chartJsPath}"></script>
  <script>
    (function () {
      const d = window.__METRICS__;
      if (!window.Chart || typeof window.Chart !== "function") {
        document.body.insertAdjacentHTML("afterbegin",
          '<div style="background:#3a1f1f;border:1px solid #6b2e2e;color:#f8cccc;padding:8px 12px;border-radius:6px;margin-bottom:12px;">Chart.js not loaded — vendor the libraries via <code>npm install</code> inside the plugin.</div>');
        return;
      }
      const palette = ["#4f8ef7","#f76e6e","#3ecf8e","#f7c948","#c98ef7","#6ec3f7","#f7a26e","#9ee06e","#f76ec3","#6e7df7","#f7e26e","#6ef7d7"];
      const color = (i) => palette[i % palette.length];
      const baseScales = {
        x: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
        y: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" }, beginAtZero: true },
      };
      function bar(id, labels, data, c) {
        new window.Chart(document.getElementById(id), {
          type: "bar",
          data: { labels, datasets: [{ label: "", data, backgroundColor: c || color(0) }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: baseScales },
        });
      }
      function hbar(id, items, c) {
        new window.Chart(document.getElementById(id), {
          type: "bar",
          data: { labels: items.map(x => x.label), datasets: [{ data: items.map(x => x.value), backgroundColor: c || color(0) }] },
          options: { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: baseScales },
        });
      }
      function pie(id, items, type) {
        new window.Chart(document.getElementById(id), {
          type: type || "pie",
          data: { labels: items.map(x => x.label), datasets: [{ data: items.map(x => x.value), backgroundColor: items.map((_, i) => color(i)) }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#cfd6dc" } } } },
        });
      }
      function line(id, labels, data, c) {
        new window.Chart(document.getElementById(id), {
          type: "line",
          data: { labels, datasets: [{ data, borderColor: c || color(0), backgroundColor: (c || color(0)) + "33", fill: true, tension: 0.25, pointRadius: 1 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: baseScales },
        });
      }

      // KPIs
      const kpis = document.getElementById("kpis");
      function kpi(label, value, sub) {
        const el = document.createElement("div");
        el.className = "kpi";
        el.innerHTML = '<div class="kpi-label">'+label+'</div><div class="kpi-value">'+value+'</div><div class="kpi-label">'+(sub||"")+'</div>';
        kpis.appendChild(el);
      }
      const t = d.totals || {};
      const k = d.kpis || {};
      kpi("Scenes", (t.scenes||0).toLocaleString(), (Math.round((t.totalDuration||0)/3600))+" hours");
      kpi("Performers", (t.performers||0).toLocaleString(), (t.performersFavorite||0)+" favorited");
      kpi("Tags", (t.tags||0).toLocaleString(), "");
      kpi("Studios", (t.studios||0).toLocaleString(), "");
      kpi("Median age", k.medianAge != null ? k.medianAge+" yrs" : "—", "");
      kpi("Countries", (k.countries||0)+"", "represented");

      bar("durHist", (d.durationHistogram||{labels:[]}).labels, (d.durationHistogram||{counts:[]}).counts);
      pie("studioSize", (d.studioStorage||[]).slice(0, 10), "doughnut");
      bar("res", (d.resolutionDistribution||[]).map(x=>x.label), (d.resolutionDistribution||[]).map(x=>x.value), color(2));
      pie("codecs", (d.codecDistribution||[]).slice(0, 8), "pie");
      bar("ratings", (d.ratingDistribution||{labels:[]}).labels, (d.ratingDistribution||{counts:[]}).counts, color(3));
      pie("org", [{label:"Organized",value:(d.organizedRatio||{}).organized||0},{label:"Unorganized",value:(d.organizedRatio||{}).unorganized||0}], "doughnut");
      pie("gender", (d.genderDistribution||[]).slice(0, 8), "pie");
      hbar("countries", (d.countryDistribution||[]).slice(0, 10), color(5));
      hbar("ethnicities", (d.ethnicityDistribution||[]).slice(0, 10), color(4));
      bar("heights", (d.heightHistogram||{labels:[]}).labels, (d.heightHistogram||{counts:[]}).counts, color(6));
      hbar("topPerf", (d.topByScenes||[]).slice(0, 15), color(0));
      hbar("topDur", (d.topByDuration||[]).slice(0, 15).map(x=>({label:x.label,value:Math.round(x.value/60)})), color(1));
      hbar("tags", (d.tagFrequency||[]).slice(0, 20), color(0));
      hbar("tagco", (d.tagCoOccurrence||[]).slice(0, 20).map(p=>({label:p.a+" ↔ "+p.b,value:p.weight})), color(2));
      line("scenesMonth", (d.scenesPerMonth||{labels:[]}).labels, (d.scenesPerMonth||{counts:[]}).counts);
      bar("hoursMonth", (d.durationPerMonth||{labels:[]}).labels, (d.durationPerMonth||{hours:[]}).hours, color(2));

      const tbody = document.querySelector("#pairs tbody");
      (d.topPerformerPairs||[]).slice(0, 30).forEach((p, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = '<td>'+(i+1)+'</td><td></td><td></td><td>'+p.weight+'</td>';
        tr.children[1].textContent = p.a;
        tr.children[2].textContent = p.b;
        tbody.appendChild(tr);
      });
    })();
  </script>
</body>
</html>`;
  fs.writeFileSync(file, html, "utf8");
}

function writeMatchesHtml(file, matches, opts) {
  const chartJsPath = (opts && opts.chartJsUrl) || "../../assets/lib/chart.umd.min.js";
  const data = JSON.stringify(matches).replace(/</g, "\\u003c");
  const generated = new Date().toISOString();
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Stash Matches Report — ${generated}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         background: #11151a; color: #cfd6dc; margin: 0; padding: 24px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .sub { color: #8e98a0; font-size: 12px; margin-bottom: 24px; }
  .kpi-row { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); margin-bottom: 20px; }
  .kpi { background: #1c2126; border: 1px solid #2b3338; border-radius: 8px; padding: 12px 14px; }
  .kpi-label { color: #8e98a0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; }
  .kpi-value { color: #fff; font-size: 22px; font-weight: 600; }
  .grid { display: grid; gap: 14px; grid-template-columns: 1fr 1fr; }
  .card { background: #1c2126; border: 1px solid #2b3338; border-radius: 8px; padding: 14px; }
  h2 { font-size: 13px; margin: 0 0 10px; letter-spacing: 0.3px; text-transform: uppercase; color: #cfd6dc; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border-bottom: 1px solid #2b3338; padding: 6px 6px; text-align: left; vertical-align: top; }
  th { color: #8e98a0; font-weight: 600; }
  .score { font-weight: 600; color: #3ecf8e; }
  .muted { color: #8e98a0; }
  details { background: #11151a; padding: 6px 8px; border-radius: 4px; margin-top: 4px; }
  details summary { cursor: pointer; color: #4f8ef7; font-size: 11px; }
  pre { margin: 4px 0 0; font-size: 11px; color: #cfd6dc; white-space: pre-wrap; }
  .profile { font-size: 12px; }
  .profile pre { background: #11151a; padding: 8px; border-radius: 4px; max-height: 240px; overflow: auto; }
  @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
  <h1>Preference matches</h1>
  <div class="sub">Generated ${generated}</div>

  <div class="kpi-row" id="kpis"></div>

  <details class="profile" open>
    <summary>Preference profile</summary>
    <pre id="profile"></pre>
  </details>

  <div class="grid" style="margin-top:18px;">
    <div class="card">
      <h2>Top performer matches</h2>
      <table id="perf"><thead><tr><th>#</th><th>Performer</th><th>Country</th><th>Cup</th><th>Avg O</th><th>Score</th></tr></thead><tbody></tbody></table>
    </div>
    <div class="card">
      <h2>Top scene matches</h2>
      <table id="scene"><thead><tr><th>#</th><th>Title</th><th>Performers</th><th>Tags</th><th>O</th><th>Score</th></tr></thead><tbody></tbody></table>
    </div>
  </div>

  <script>window.__MATCHES__ = ${data};</script>
  <script>
    (function () {
      const m = window.__MATCHES__;
      function kpi(label, v, sub) {
        const el = document.createElement("div");
        el.className = "kpi";
        el.innerHTML = '<div class="kpi-label">'+label+'</div><div class="kpi-value">'+v+'</div><div class="kpi-label">'+(sub||"")+'</div>';
        document.getElementById("kpis").appendChild(el);
      }
      const s = m.summary || {};
      kpi("Performers considered", (s.totalPerformersConsidered||0).toLocaleString(), "");
      kpi("Performers above cutoff", (s.performersAboveThreshold||0).toLocaleString(), "min score "+(m.matchMinScore||0));
      kpi("Best performer", (s.bestPerformerScore!=null?s.bestPerformerScore:"—")+"/100", "");
      kpi("Scenes considered", (s.totalScenesConsidered||0).toLocaleString(), "");
      kpi("Scenes above cutoff", (s.scenesAboveThreshold||0).toLocaleString(), "");
      kpi("Best scene", (s.bestSceneScore!=null?s.bestSceneScore:"—")+"/100", "");

      document.getElementById("profile").textContent = JSON.stringify(m.profile || {}, null, 2);

      const pBody = document.querySelector("#perf tbody");
      (m.performers||[]).forEach((p, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = '<td>'+(i+1)+'</td>' +
          '<td></td>' +
          '<td></td>' +
          '<td>'+ (p.cupLetter||"—") +'</td>' +
          '<td>'+ (p.avgSceneO!=null ? p.avgSceneO.toFixed(2) : "—") +'</td>' +
          '<td><span class="score">'+ p.score +'</span></td>';
        tr.children[1].textContent = p.name;
        tr.children[2].textContent = p.country || "";
        pBody.appendChild(tr);
      });

      const sBody = document.querySelector("#scene tbody");
      (m.scenes||[]).forEach((sc, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = '<td>'+(i+1)+'</td>' +
          '<td></td><td class="muted"></td><td class="muted"></td>' +
          '<td>'+ (sc.sceneO||0) +'</td>' +
          '<td><span class="score">'+ sc.score +'</span></td>';
        tr.children[1].textContent = sc.title;
        tr.children[2].textContent = (sc.performers||[]).join(", ");
        tr.children[3].textContent = (sc.tagNames||[]).slice(0, 6).join(", ");
        sBody.appendChild(tr);
      });
    })();
  </script>
</body>
</html>`;
  fs.writeFileSync(file, html, "utf8");
}

module.exports = { writeCsvBundle, writeHtml, writeMatchesHtml };
