(function () {
  "use strict";
  const ns = (window.StashMetrics = window.StashMetrics || {});
  const fmt = ns.format;
  const stats = ns.stats;

  function chart(ctx, type, data, options) {
    if (!window.Chart) throw new Error("Chart.js failed to load");
    return new window.Chart(ctx, {
      type,
      data,
      options: Object.assign({
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 250 },
        plugins: {
          legend: { labels: { color: "#cfd6dc" } },
          tooltip: { mode: "index", intersect: false },
        },
        scales: type === "bar" || type === "line" ? {
          x: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
          y: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" }, beginAtZero: true },
        } : undefined,
      }, options || {}),
    });
  }

  function kpiCard(label, value, sub) {
    const el = document.createElement("div");
    el.className = "metrics-kpi";
    el.innerHTML =
      '<div class="metrics-kpi-label"></div>' +
      '<div class="metrics-kpi-value"></div>' +
      '<div class="metrics-kpi-sub"></div>';
    el.querySelector(".metrics-kpi-label").textContent = label;
    el.querySelector(".metrics-kpi-value").textContent = value;
    el.querySelector(".metrics-kpi-sub").textContent = sub || "";
    return el;
  }

  function ensureCanvas(host, id) {
    let card = host.querySelector("#" + id);
    if (!card) {
      card = document.createElement("div");
      card.id = id;
      card.className = "metrics-card";
      host.appendChild(card);
    }
    card.innerHTML = "";
    const canvas = document.createElement("canvas");
    card.appendChild(canvas);
    return canvas;
  }

  function header(host, title) {
    const h = document.createElement("div");
    h.className = "metrics-card-title";
    h.textContent = title;
    host.appendChild(h);
  }

  function render(host, payload, opts) {
    host.innerHTML = "";

    // v1.7 — Nudge banner. Pick one at random per render. Skipped when
    // the pool is empty (fresh library / no history).
    if (Array.isArray(payload.nudges) && payload.nudges.length) {
      const nudge = payload.nudges[Math.floor(Math.random() * payload.nudges.length)];
      const banner = document.createElement("div");
      banner.className = "metrics-nudge";
      const targetHref = nudge.target && nudge.target.kind === "scene" && nudge.target.id
        ? "/scenes/" + encodeURIComponent(nudge.target.id)
        : nudge.target && nudge.target.kind === "performer" && nudge.target.id
        ? "/performers/" + encodeURIComponent(nudge.target.id) : null;
      banner.innerHTML =
        '<div class="metrics-nudge-icon">💡</div>' +
        '<div class="metrics-nudge-body">' +
        '<div class="metrics-nudge-title"></div>' +
        '<div class="metrics-nudge-action"></div>' +
        '</div>' +
        (targetHref ? '<a class="metrics-btn btn-primary metrics-nudge-cta"></a>' : "") +
        '<button class="metrics-nudge-dismiss" aria-label="dismiss">×</button>';
      banner.querySelector(".metrics-nudge-title").textContent = nudge.title;
      banner.querySelector(".metrics-nudge-action").textContent = nudge.action;
      if (targetHref) {
        const cta = banner.querySelector(".metrics-nudge-cta");
        cta.href = targetHref;
        cta.textContent = "Open →";
      }
      banner.querySelector(".metrics-nudge-dismiss").addEventListener("click", function () {
        banner.remove();
      });
      host.appendChild(banner);
    }

    const kpiRow = document.createElement("div");
    kpiRow.className = "metrics-kpi-row";
    host.appendChild(kpiRow);

    const totals = payload.totals || {};
    kpiRow.appendChild(kpiCard("Scenes", fmt.int(totals.scenes), fmt.duration(totals.totalDuration) + " total"));
    kpiRow.appendChild(kpiCard("Performers", fmt.int(totals.performers), totals.performersFavorite + " favorited"));
    kpiRow.appendChild(kpiCard("Tags", fmt.int(totals.tags), "across the library"));
    kpiRow.appendChild(kpiCard("Studios", fmt.int(totals.studios), ""));
    kpiRow.appendChild(kpiCard("Images", fmt.int(totals.images), ""));
    kpiRow.appendChild(kpiCard("Galleries", fmt.int(totals.galleries), ""));
    kpiRow.appendChild(kpiCard("Storage", fmt.bytes(totals.totalSize), "scenes + images"));
    kpiRow.appendChild(kpiCard("Avg scene", fmt.duration(totals.avgDuration), "median " + fmt.duration(totals.medianDuration)));
    if (payload.quality && payload.quality.health) {
      kpiRow.appendChild(kpiCard("Library health", payload.quality.health.score,
        "grade " + (payload.quality.health.grade || "?") + " — open Quality tab for breakdown"));
    }
    if (payload.fun && payload.fun.studioLoyalty) {
      const sl = payload.fun.studioLoyalty;
      kpiRow.appendChild(kpiCard("Studio loyalty", sl.label,
        "~" + sl.effectiveStudios + " effective studios · HHI " + sl.hhi));
    }

    // Personality read hero card — placed above the chart grid so it's
    // the first thing you see on the Overview tab.
    if (payload.fun && payload.fun.personality && payload.fun.personality.archetype) {
      const p = payload.fun.personality;
      const hero = document.createElement("div");
      hero.className = "metrics-card metrics-personality-hero";
      hero.innerHTML =
        '<div class="metrics-personality-badge">Your archetype</div>' +
        '<div class="metrics-personality-title"></div>' +
        '<div class="metrics-personality-traits"></div>' +
        '<ul class="metrics-personality-list"></ul>';
      hero.querySelector(".metrics-personality-title").textContent = p.archetype;
      const traits = hero.querySelector(".metrics-personality-traits");
      for (const t of (p.traits || [])) {
        const span = document.createElement("span");
        span.className = "metrics-badge metrics-personality-trait";
        span.textContent = t;
        traits.appendChild(span);
      }
      const ul = hero.querySelector(".metrics-personality-list");
      for (const line of (p.summary || [])) {
        const li = document.createElement("li");
        li.textContent = line;
        ul.appendChild(li);
      }
      host.appendChild(hero);
    }

    const grid = document.createElement("div");
    grid.className = "metrics-grid";
    host.appendChild(grid);

    // ----- 1. Scene duration histogram
    let card = document.createElement("div");
    card.className = "metrics-card";
    header(card, "Scene duration distribution");
    let canvas = document.createElement("canvas");
    card.appendChild(canvas);
    grid.appendChild(card);
    const dur = payload.durationHistogram || { labels: [], counts: [] };
    chart(canvas, "bar", {
      labels: dur.labels,
      datasets: [{
        label: "Scenes",
        data: dur.counts,
        backgroundColor: fmt.color(0),
      }],
    });

    // ----- 2. Storage breakdown by studio (top 10 + Other)
    card = document.createElement("div");
    card.className = "metrics-card";
    header(card, "Storage by studio (top 10)");
    canvas = document.createElement("canvas");
    card.appendChild(canvas);
    grid.appendChild(card);
    const hideOther = !!(opts && opts.hideOtherBucket);
    const studios = stats.topN(payload.studioStorage || [], 10, hideOther ? false : undefined);
    chart(canvas, "doughnut", {
      labels: studios.map((s) => s.label),
      datasets: [{
        data: studios.map((s) => s.value),
        backgroundColor: studios.map((_, i) => fmt.color(i)),
      }],
    }, { scales: undefined });

    // ----- 3. Resolution breakdown (bar)
    card = document.createElement("div");
    card.className = "metrics-card";
    header(card, "Resolution");
    canvas = document.createElement("canvas");
    card.appendChild(canvas);
    grid.appendChild(card);
    const res = payload.resolutionDistribution || [];
    chart(canvas, "bar", {
      labels: res.map((r) => r.label),
      datasets: [{ label: "Scenes", data: res.map((r) => r.value), backgroundColor: fmt.color(2) }],
    });

    // ----- 4. Codec breakdown (pie)
    card = document.createElement("div");
    card.className = "metrics-card";
    header(card, "Video codecs");
    canvas = document.createElement("canvas");
    card.appendChild(canvas);
    grid.appendChild(card);
    const codecs = payload.codecDistribution || [];
    chart(canvas, "pie", {
      labels: codecs.map((c) => c.label),
      datasets: [{
        data: codecs.map((c) => c.value),
        backgroundColor: codecs.map((_, i) => fmt.color(i)),
      }],
    }, { scales: undefined });

    // ----- 5. Ratings histogram
    card = document.createElement("div");
    card.className = "metrics-card";
    header(card, "Scene ratings");
    canvas = document.createElement("canvas");
    card.appendChild(canvas);
    grid.appendChild(card);
    const ratings = payload.ratingDistribution || { labels: [], counts: [] };
    chart(canvas, "bar", {
      labels: ratings.labels,
      datasets: [{ label: "Scenes", data: ratings.counts, backgroundColor: fmt.color(3) }],
    });

    // ----- 6. Organized vs unorganized (donut)
    card = document.createElement("div");
    card.className = "metrics-card";
    header(card, "Organization status");
    canvas = document.createElement("canvas");
    card.appendChild(canvas);
    grid.appendChild(card);
    const org = payload.organizedRatio || { organized: 0, unorganized: 0 };
    chart(canvas, "doughnut", {
      labels: ["Organized", "Unorganized"],
      datasets: [{
        data: [org.organized, org.unorganized],
        backgroundColor: [fmt.color(2), fmt.color(1)],
      }],
    }, { scales: undefined });
  }

  ns.charts = ns.charts || {};
  ns.charts.overview = { render };
})();
