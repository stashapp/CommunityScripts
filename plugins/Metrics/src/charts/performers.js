(function () {
  "use strict";
  const ns = (window.StashMetrics = window.StashMetrics || {});
  const fmt = ns.format;
  const stats = ns.stats;

  function chart(ctx, type, data, options) {
    return new window.Chart(ctx, {
      type, data,
      options: Object.assign({
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#cfd6dc" } } },
        scales: type === "bar" || type === "line" || type === "scatter" ? {
          x: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
          y: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" }, beginAtZero: true },
        } : undefined,
      }, options || {}),
    });
  }

  function card(grid, title) {
    const el = document.createElement("div");
    el.className = "metrics-card";
    const h = document.createElement("div");
    h.className = "metrics-card-title";
    h.textContent = title;
    el.appendChild(h);
    const c = document.createElement("canvas");
    el.appendChild(c);
    grid.appendChild(el);
    return c;
  }

  // The age pyramid renders as two stacked horizontal bar series — males on
  // the negative axis, females positive — so any binary-presenting genders
  // sit on opposite sides for easy comparison. Non-binary / unknown are
  // stacked as separate datasets on the positive side.
  function agePyramid(host, payload) {
    const c = card(host, "Age pyramid");
    const data = payload.agePyramid;
    if (!data || !data.buckets || !data.buckets.length) {
      c.parentNode.querySelector(".metrics-card-title").after(emptyHint("No birthdates available."));
      return;
    }
    const labels = data.buckets;
    const series = data.series || {};
    const datasets = [];
    const order = ["MALE", "FEMALE", "TRANSGENDER_MALE", "TRANSGENDER_FEMALE", "INTERSEX", "NON_BINARY"];
    let colorIdx = 0;
    for (const g of order) {
      if (!series[g]) continue;
      const sign = g === "MALE" || g === "TRANSGENDER_MALE" ? -1 : 1;
      datasets.push({
        label: prettyGender(g),
        data: series[g].map((v) => v * sign),
        backgroundColor: fmt.color(colorIdx++),
        stack: sign < 0 ? "left" : "right",
      });
    }
    chart(c, "bar", { labels, datasets }, {
      indexAxis: "y",
      scales: {
        x: {
          stacked: true,
          ticks: { color: "#a8b1b8", callback: (v) => Math.abs(v) },
          grid: { color: "#2b3338" },
        },
        y: { stacked: true, ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
      },
      plugins: {
        legend: { labels: { color: "#cfd6dc" } },
        tooltip: { callbacks: { label: (ctx) => ctx.dataset.label + ": " + Math.abs(ctx.parsed.x) } },
      },
    });
  }

  function prettyGender(g) {
    if (!g) return "Unknown";
    return g.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function emptyHint(text) {
    const e = document.createElement("div");
    e.className = "metrics-empty";
    e.textContent = text;
    return e;
  }

  function rankingChart(host, title, items, valueLabel, color) {
    const c = card(host, title);
    if (!items || !items.length) {
      c.parentNode.appendChild(emptyHint("No data"));
      return;
    }
    chart(c, "bar", {
      labels: items.map((x) => x.label),
      datasets: [{ label: valueLabel, data: items.map((x) => x.value), backgroundColor: color }],
    }, { indexAxis: "y" });
  }

  function render(host, payload, opts) {
    host.innerHTML = "";

    // Top KPI strip
    const kpis = document.createElement("div");
    kpis.className = "metrics-kpi-row";
    host.appendChild(kpis);
    const k = payload.kpis || {};
    function kpi(label, value, sub) {
      const el = document.createElement("div");
      el.className = "metrics-kpi";
      el.innerHTML = '<div class="metrics-kpi-label"></div><div class="metrics-kpi-value"></div><div class="metrics-kpi-sub"></div>';
      el.querySelector(".metrics-kpi-label").textContent = label;
      el.querySelector(".metrics-kpi-value").textContent = value;
      el.querySelector(".metrics-kpi-sub").textContent = sub || "";
      return el;
    }
    kpis.appendChild(kpi("Performers", fmt.int(k.total || 0), (k.favorited || 0) + " favorited"));
    kpis.appendChild(kpi("Median age", k.medianAge != null ? k.medianAge + " yrs" : "—", "based on birthdates"));
    kpis.appendChild(kpi("Avg height", fmt.height(k.avgHeight, opts && opts.heightUnit), "across known"));
    kpis.appendChild(kpi("With tattoos", fmt.pct(k.tattooedRatio || 0), ""));
    kpis.appendChild(kpi("With piercings", fmt.pct(k.piercedRatio || 0), ""));
    kpis.appendChild(kpi("Countries", fmt.int(k.countries || 0), "represented"));

    const grid = document.createElement("div");
    grid.className = "metrics-grid";
    host.appendChild(grid);

    // ---- Gender distribution
    let c = card(grid, "Gender distribution");
    const gd = payload.genderDistribution || [];
    chart(c, "pie", {
      labels: gd.map((x) => prettyGender(x.label)),
      datasets: [{
        data: gd.map((x) => x.value),
        backgroundColor: gd.map((_, i) => fmt.color(i)),
      }],
    }, { scales: undefined });

    // ---- Ethnicity distribution
    c = card(grid, "Ethnicity");
    const hideOther = !!(opts && opts.hideOtherBucket);
    const et = stats.topN(payload.ethnicityDistribution || [], 10, hideOther ? false : undefined);
    chart(c, "bar", {
      labels: et.map((x) => x.label),
      datasets: [{ label: "Performers", data: et.map((x) => x.value), backgroundColor: fmt.color(4) }],
    }, { indexAxis: "y" });

    // ---- Countries (top 15)
    c = card(grid, "Countries (top 15)");
    const cn = stats.topN(payload.countryDistribution || [], 15, hideOther ? false : undefined);
    chart(c, "bar", {
      labels: cn.map((x) => (stats.countryFlag(x.label) + " " + x.label).trim()),
      datasets: [{ label: "Performers", data: cn.map((x) => x.value), backgroundColor: fmt.color(5) }],
    }, { indexAxis: "y" });

    // ---- Age pyramid (joined card)
    agePyramid(grid, payload);

    // ---- Height histogram
    c = card(grid, "Height distribution");
    const h = payload.heightHistogram || { labels: [], counts: [] };
    chart(c, "bar", {
      labels: h.labels,
      datasets: [{ label: "Performers", data: h.counts, backgroundColor: fmt.color(6) }],
    });

    // ---- Career length scatter (career_length parsed → years, vs scene count)
    c = card(grid, "Career length vs scene count");
    const careerPoints = payload.careerVsScenes || [];
    chart(c, "scatter", {
      datasets: [{
        label: "Performer",
        data: careerPoints,
        backgroundColor: fmt.color(7),
        pointRadius: 3,
      }],
    }, {
      scales: {
        x: { title: { display: true, text: "Career length (years)", color: "#cfd6dc" }, ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
        y: { title: { display: true, text: "Scene count", color: "#cfd6dc" }, ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => c.raw && c.raw.name ? c.raw.name + " — " + c.raw.y + " scenes, " + c.raw.x + " yrs" : "" } },
      },
    });

    // ---- Top performers by scene count
    rankingChart(grid, "Top performers by scene count", payload.topByScenes || [], "Scenes", fmt.color(0));

    // ---- Top performers by total duration
    const topDur = (payload.topByDuration || []).map((x) => ({ label: x.label, value: Math.round(x.value / 60) }));
    rankingChart(grid, "Top performers by total minutes", topDur, "Minutes", fmt.color(1));

    // ---- Top performers by rating
    rankingChart(grid, "Top performers by rating", payload.topByRating || [], "Rating /100", fmt.color(8));

    // ---- Body mods prevalence (tattoos / piercings / fake_tits)
    c = card(grid, "Body modifications");
    const bm = payload.bodyMods || { labels: [], yes: [], no: [], unknown: [] };
    chart(c, "bar", {
      labels: bm.labels,
      datasets: [
        { label: "Yes", data: bm.yes, backgroundColor: fmt.color(0), stack: "s" },
        { label: "No", data: bm.no, backgroundColor: fmt.color(1), stack: "s" },
        { label: "Unknown", data: bm.unknown, backgroundColor: "#56606b", stack: "s" },
      ],
    }, { scales: { x: { stacked: true, ticks: { color: "#a8b1b8" } }, y: { stacked: true, ticks: { color: "#a8b1b8" } } } });

    // ---- Measurements (cup distribution if parsed)
    c = card(grid, "Bust cup distribution");
    const cups = payload.cupDistribution || [];
    if (!cups.length) {
      c.parentNode.appendChild(emptyHint("No parsable measurements."));
    } else {
      chart(c, "bar", {
        labels: cups.map((x) => x.label),
        datasets: [{ label: "Performers", data: cups.map((x) => x.value), backgroundColor: fmt.color(9) }],
      });
    }
  }

  ns.charts = ns.charts || {};
  ns.charts.performers = { render };
})();
