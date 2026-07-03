(function () {
  "use strict";

  const ns = (window.StashMetrics = window.StashMetrics || {});
  const fmt = ns.format;

  function card(grid, title, sub) {
    const el = document.createElement("div");
    el.className = "metrics-card";
    const h = document.createElement("div");
    h.className = "metrics-card-title";
    h.textContent = title;
    el.appendChild(h);
    if (sub) {
      const s = document.createElement("div");
      s.className = "metrics-card-sub";
      s.textContent = sub;
      el.appendChild(s);
    }
    grid.appendChild(el);
    return el;
  }

  function emptyHint(host, text) {
    const e = document.createElement("div");
    e.className = "metrics-empty";
    e.textContent = text;
    host.appendChild(e);
  }

  function badge(text, color) {
    const b = document.createElement("span");
    b.className = "metrics-badge";
    b.textContent = text;
    if (color) { b.style.borderColor = color; b.style.color = color; }
    return b;
  }

  function chartCanvas(host, type, data, options) {
    const c = document.createElement("canvas");
    host.appendChild(c);
    return new window.Chart(c, {
      type, data,
      options: Object.assign({
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#cfd6dc" } } },
        scales: type === "bar" || type === "line" ? {
          x: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
          y: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" }, beginAtZero: true },
        } : undefined,
      }, options || {}),
    });
  }

  function healthRing(host, health) {
    if (!health) { emptyHint(host, "No health score."); return; }
    const wrap = document.createElement("div");
    wrap.className = "metrics-health";
    const ring = document.createElement("div");
    ring.className = "metrics-health-ring";
    const score = Math.max(0, Math.min(100, health.score || 0));
    const color = score >= 80 ? "#3ecf8e" : score >= 60 ? "#f7c948" : score >= 40 ? "#f7a26e" : "#f76e6e";
    ring.style.background = "conic-gradient(" + color + " 0% " + score + "%, #2b3338 " + score + "% 100%)";
    const inner = document.createElement("div");
    inner.className = "metrics-health-inner";
    inner.innerHTML = '<div class="metrics-health-score"></div><div class="metrics-health-grade"></div>';
    inner.querySelector(".metrics-health-score").textContent = score.toFixed(1);
    inner.querySelector(".metrics-health-grade").textContent = "grade " + (health.grade || "?");
    ring.appendChild(inner);
    wrap.appendChild(ring);

    const breakdown = document.createElement("div");
    breakdown.className = "metrics-health-breakdown";
    for (const [k, v] of Object.entries(health.components || {})) {
      const row = document.createElement("div");
      row.className = "metrics-gauge";
      row.innerHTML = '<div class="metrics-gauge-label"></div><div class="metrics-gauge-bar"><div class="metrics-gauge-fill"></div></div><div class="metrics-gauge-val"></div>';
      row.querySelector(".metrics-gauge-label").textContent = humanize(k);
      const w = Math.max(0, Math.min(100, v || 0));
      row.querySelector(".metrics-gauge-fill").style.width = w + "%";
      row.querySelector(".metrics-gauge-fill").style.background = w >= 75 ? "#3ecf8e" : w >= 50 ? "#f7c948" : "#f76e6e";
      row.querySelector(".metrics-gauge-val").textContent = v != null ? v.toFixed(1) + "%" : "—";
      breakdown.appendChild(row);
    }
    wrap.appendChild(breakdown);
    host.appendChild(wrap);
  }

  function humanize(k) {
    return ({
      organized: "Organized scenes",
      rated: "Rated scenes",
      taggedScenes: "Tagged scenes",
      performersOnScenes: "Scenes with cast",
      titled: "Titled scenes",
      performerMetadataDepth: "Performer metadata depth",
      tagRichness: "Tag richness (avg ≥5/scene)",
      tagInventoryHealth: "Tag inventory (no rare noise)",
    })[k] || k;
  }

  function gemList(host, gems) {
    if (!gems || !gems.length) { emptyHint(host, "No hidden gems matched the rating floor / play ceiling thresholds."); return; }
    const ol = document.createElement("ol");
    ol.className = "metrics-list";
    for (const g of gems.slice(0, 30)) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "metrics-list-name";
      a.textContent = g.title;
      a.href = "/scenes/" + encodeURIComponent(g.id);
      li.appendChild(a);
      const tags = document.createElement("div");
      tags.className = "metrics-match-tags";
      tags.appendChild(badge("★ " + g.rating100));
      tags.appendChild(badge(g.playCount + " play" + (g.playCount === 1 ? "" : "s")));
      if (g.studio) tags.appendChild(badge(g.studio));
      if (g.durationSec) tags.appendChild(badge(fmt.duration(g.durationSec)));
      li.appendChild(tags);
      const meta = document.createElement("div");
      meta.className = "metrics-list-sub";
      meta.textContent = "gem score " + g.gemScore + (g.performers && g.performers.length ? " · with " + g.performers.slice(0, 4).join(", ") : "");
      li.appendChild(meta);
      ol.appendChild(li);
    }
    host.appendChild(ol);
  }

  function anomalyList(host, items, kind) {
    if (!items || !items.length) { emptyHint(host, "No " + kind + " items above the z-score threshold."); return; }
    const ol = document.createElement("ol");
    ol.className = "metrics-list";
    for (const x of items) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "metrics-list-name";
      a.textContent = x.title || x.name;
      a.href = (x.title ? "/scenes/" : "/performers/") + encodeURIComponent(x.id);
      li.appendChild(a);
      const sub = document.createElement("div");
      sub.className = "metrics-list-sub";
      const parts = [];
      if (x.rating100 != null) parts.push("★ " + x.rating100);
      if (x.predicted != null) parts.push("predicted " + x.predicted);
      if (x.playCount != null) parts.push(x.playCount + " plays");
      if (x.oCount != null) parts.push("O " + x.oCount);
      if (x.avgSceneO != null) parts.push("avg O " + x.avgSceneO);
      parts.push("z = " + (x.z > 0 ? "+" : "") + x.z);
      sub.textContent = parts.join(" · ");
      li.appendChild(sub);
      ol.appendChild(li);
    }
    host.appendChild(ol);
  }

  function completionView(host, completion) {
    if (!completion) { emptyHint(host, "No completion data."); return; }
    const wrap = document.createElement("div");
    wrap.className = "metrics-completion";

    const donut = document.createElement("div");
    donut.style.height = "240px";
    wrap.appendChild(donut);
    const b = completion.buckets || {};
    chartCanvas(donut, "doughnut", {
      labels: ["Abandoned", "Partial", "Watched", "Repeat"],
      datasets: [{
        data: [b.abandoned || 0, b.partial || 0, b.watched || 0, b.repeat || 0],
        backgroundColor: ["#f76e6e", "#f7c948", "#3ecf8e", "#4f8ef7"],
      }],
    }, { scales: undefined });

    const shares = document.createElement("div");
    shares.className = "metrics-completion-shares";
    const sp = completion.sharesPct || {};
    for (const [k, color] of [["abandoned", "#f76e6e"], ["partial", "#f7c948"], ["watched", "#3ecf8e"], ["repeat", "#4f8ef7"]]) {
      const row = document.createElement("div");
      row.className = "metrics-gauge";
      row.innerHTML = '<div class="metrics-gauge-label"></div><div class="metrics-gauge-bar"><div class="metrics-gauge-fill"></div></div><div class="metrics-gauge-val"></div>';
      row.querySelector(".metrics-gauge-label").textContent = k.charAt(0).toUpperCase() + k.slice(1);
      const w = sp[k] || 0;
      row.querySelector(".metrics-gauge-fill").style.width = w + "%";
      row.querySelector(".metrics-gauge-fill").style.background = color;
      row.querySelector(".metrics-gauge-val").textContent = w + "%";
      shares.appendChild(row);
    }
    wrap.appendChild(shares);

    host.appendChild(wrap);
  }

  function listScenes(host, scenes, formatter) {
    if (!scenes || !scenes.length) { emptyHint(host, "No data."); return; }
    const ol = document.createElement("ol");
    ol.className = "metrics-list";
    for (const s of scenes) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "metrics-list-name";
      a.textContent = s.title;
      a.href = "/scenes/" + encodeURIComponent(s.id);
      li.appendChild(a);
      const v = document.createElement("div");
      v.className = "metrics-list-sub";
      v.textContent = formatter(s);
      li.appendChild(v);
      ol.appendChild(li);
    }
    host.appendChild(ol);
  }

  function render(host, payload) {
    host.innerHTML = "";
    const q = payload && payload.quality;
    if (!q) {
      emptyHint(host, "Quality insights aren't in this cache. Run Update Metrics Cache — or uncheck 'Disable Quality tab' in plugin settings.");
      return;
    }

    // KPI strip
    const kpis = document.createElement("div");
    kpis.className = "metrics-kpi-row";
    host.appendChild(kpis);
    function kpi(label, value, sub) {
      const el = document.createElement("div");
      el.className = "metrics-kpi";
      el.innerHTML = '<div class="metrics-kpi-label"></div><div class="metrics-kpi-value"></div><div class="metrics-kpi-sub"></div>';
      el.querySelector(".metrics-kpi-label").textContent = label;
      el.querySelector(".metrics-kpi-value").textContent = value;
      el.querySelector(".metrics-kpi-sub").textContent = sub || "";
      return el;
    }
    kpis.appendChild(kpi("Library health", q.health.score, "grade " + q.health.grade));
    kpis.appendChild(kpi("Hidden gems", (q.hiddenGems || []).length, "above the rating floor"));
    kpis.appendChild(kpi("Overrated scenes", (q.sceneAnomalies && q.sceneAnomalies.overrated || []).length, "positive z"));
    kpis.appendChild(kpi("Underrated scenes", (q.sceneAnomalies && q.sceneAnomalies.underrated || []).length, "negative z"));
    if (q.completion) {
      kpis.appendChild(kpi("Abandoned share", (q.completion.sharesPct && q.completion.sharesPct.abandoned || 0) + "%", "of played scenes"));
      kpis.appendChild(kpi("Repeat share", (q.completion.sharesPct && q.completion.sharesPct.repeat || 0) + "%", "≥80% & ≥3 plays"));
    }

    // Health + completion side by side
    const top = document.createElement("div");
    top.className = "metrics-matches-cols";
    host.appendChild(top);
    const healthCard = card(top, "Library health score", "weighted average of 8 coverage / quality components");
    healthRing(healthCard, q.health);
    const compCard = card(top, "Completion rates", "play_duration ÷ (file.duration × play_count)");
    completionView(compCard, q.completion);

    // Hidden gems
    const grid = document.createElement("div");
    grid.className = "metrics-grid";
    host.appendChild(grid);
    let c = card(grid, "Hidden gems", "high rating, low (or zero) play count");
    gemList(c, q.hiddenGems);

    // Overrated / underrated
    c = card(grid, "Overrated scenes", "rating ≫ predicted from usage signals");
    anomalyList(c, q.sceneAnomalies && q.sceneAnomalies.overrated, "overrated");

    c = card(grid, "Underrated scenes", "high usage, lower-than-expected rating");
    anomalyList(c, q.sceneAnomalies && q.sceneAnomalies.underrated, "underrated");

    c = card(grid, "Overrated performers", "rating ≫ predicted from avg scene O");
    anomalyList(c, q.performerAnomalies && q.performerAnomalies.overrated, "overrated");

    c = card(grid, "Underrated performers", "high avg O, lower-than-expected rating");
    anomalyList(c, q.performerAnomalies && q.performerAnomalies.underrated, "underrated");

    // Completion lists
    if (q.completion) {
      c = card(grid, "Most abandoned scenes (lowest completion)");
      listScenes(c, q.completion.topAbandoned || [],
        (s) => Math.round(s.completion * 100) + "% watched · " + s.playCount + " plays · " + fmt.duration(s.durationSec));

      c = card(grid, "Repeat watches", "≥80% completion AND played ≥ 3 times");
      listScenes(c, q.completion.topRepeat || [],
        (s) => s.playCount + " plays · " + Math.round(s.completion * 100) + "% completion · " + fmt.duration(s.durationSec));
    }

    // v1.6 — spicier / fun quality surfaces.

    // Guilty pleasures — low rating, high plays.
    c = card(grid, "Guilty pleasures", "you rated it low but watched it a lot");
    if (!(q.guiltyPleasures || []).length) {
      emptyHint(c, "No guilty pleasures — your ratings match your watch habits.");
    } else {
      const ol = document.createElement("ol");
      ol.className = "metrics-list";
      for (const g of q.guiltyPleasures.slice(0, 15)) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "metrics-list-name";
        a.textContent = g.title;
        a.href = "/scenes/" + encodeURIComponent(g.id);
        li.appendChild(a);
        const meta = document.createElement("div");
        meta.className = "metrics-list-sub";
        meta.textContent = "★ " + g.rating100 + " · " + g.playCount + " plays · guilt " + g.guiltScore;
        li.appendChild(meta);
        ol.appendChild(li);
      }
      c.appendChild(ol);
    }

    // Repeat offenders — punishingly rewatched despite low ratings.
    c = card(grid, "Repeat offenders", "rewatched ≥ 5 times despite rating ≤ 55");
    if (!(q.repeatOffenders || []).length) {
      emptyHint(c, "No repeat offenders detected.");
    } else {
      const ol = document.createElement("ol");
      ol.className = "metrics-list";
      for (const r of q.repeatOffenders.slice(0, 10)) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "metrics-list-name";
        a.textContent = r.title;
        a.href = "/scenes/" + encodeURIComponent(r.id);
        li.appendChild(a);
        const meta = document.createElement("div");
        meta.className = "metrics-list-sub";
        meta.textContent = r.playCount + " plays · ★ " + r.rating100;
        li.appendChild(meta);
        ol.appendChild(li);
      }
      c.appendChild(ol);
    }

    // Buried treasure — stricter than hidden gems: old + high-rated + zero plays.
    c = card(grid, "Buried treasure",
      "unwatched, rating ≥ 80, added > 6 months ago");
    if (!(q.buriedTreasure || []).length) {
      emptyHint(c, "No treasure buried — your backlog is fresh.");
    } else {
      const ol = document.createElement("ol");
      ol.className = "metrics-list";
      for (const t of q.buriedTreasure.slice(0, 15)) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "metrics-list-name";
        a.textContent = t.title;
        a.href = "/scenes/" + encodeURIComponent(t.id);
        li.appendChild(a);
        const meta = document.createElement("div");
        meta.className = "metrics-list-sub";
        meta.textContent = "★ " + t.rating100 + " · " + t.ageDays + "d in library · " +
          fmt.duration(t.durationSec) + " · treasure score " + t.treasureScore;
        li.appendChild(meta);
        ol.appendChild(li);
      }
      c.appendChild(ol);
    }

    // One-hit wonders — performers with 1 scene rated ≥ 85.
    c = card(grid, "One-hit wonders",
      "performers with exactly one scene, rated ≥ 85");
    if (!(q.oneHitWonders || []).length) {
      emptyHint(c, "No one-hit wonders.");
    } else {
      const ol = document.createElement("ol");
      ol.className = "metrics-list";
      for (const p of q.oneHitWonders.slice(0, 15)) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "metrics-list-name";
        a.textContent = p.name;
        a.href = "/performers/" + encodeURIComponent(p.id);
        li.appendChild(a);
        const meta = document.createElement("div");
        meta.className = "metrics-list-sub";
        meta.textContent = "★ " + p.rating100 + (p.country ? " · " + p.country : "") + (p.favorite ? " · ★ favorite" : "");
        li.appendChild(meta);
        ol.appendChild(li);
      }
      c.appendChild(ol);
    }

    // Tag potency — avg O per scene per tag.
    c = card(grid, "Tag potency",
      "avg O per scene for tags with ≥ 5 scenes");
    if ((q.tagPotency || []).length) {
      const canvas = document.createElement("canvas");
      c.appendChild(canvas);
      new window.Chart(canvas, {
        type: "bar",
        data: {
          labels: q.tagPotency.slice(0, 20).map((t) => t.label + " (n=" + t.sceneCount + ")"),
          datasets: [{
            label: "Avg O / scene",
            data: q.tagPotency.slice(0, 20).map((t) => t.avgOPerScene),
            backgroundColor: "#f76e9e",
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, indexAxis: "y",
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" }, beginAtZero: true },
            y: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
          },
        },
      });
    } else emptyHint(c, "Not enough scenes with the same tag to compute potency.");

    // Rating drift — avg rating you assign per month.
    c = card(grid, "Rating drift",
      "avg rating you've assigned per month — are you getting harsher or more generous?");
    if (q.ratingDrift && q.ratingDrift.labels && q.ratingDrift.labels.length) {
      const canvas = document.createElement("canvas");
      c.appendChild(canvas);
      new window.Chart(canvas, {
        type: "line",
        data: {
          labels: q.ratingDrift.labels,
          datasets: [{
            label: "Avg rating",
            data: q.ratingDrift.avgRating,
            borderColor: "#4f8ef7",
            backgroundColor: "#4f8ef733",
            tension: 0.25,
            fill: true,
            pointRadius: 2,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
            y: { min: 0, max: 100, ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
          },
        },
      });
    } else emptyHint(c, "No updated_at data on rated scenes — can't reconstruct rating history.");
  }

  ns.charts = ns.charts || {};
  ns.charts.quality = { render };
})();
