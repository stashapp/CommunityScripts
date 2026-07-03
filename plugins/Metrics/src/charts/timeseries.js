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
        scales: {
          x: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
          y: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" }, beginAtZero: true },
        },
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

  function render(host, payload) {
    host.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "metrics-grid";
    host.appendChild(grid);

    // Scenes added per month (created_at if cache provides; else scene date)
    let c = card(grid, "Scenes by date (per month)");
    const sm = payload.scenesPerMonth || { labels: [], counts: [] };
    chart(c, "line", {
      labels: sm.labels,
      datasets: [{
        label: "Scenes",
        data: sm.counts,
        borderColor: fmt.color(0),
        backgroundColor: fmt.color(0) + "33",
        tension: 0.25,
        fill: true,
        pointRadius: 2,
      }],
    });

    // Duration added per month
    c = card(grid, "Hours added per month");
    const dm = payload.durationPerMonth || { labels: [], hours: [] };
    chart(c, "bar", {
      labels: dm.labels,
      datasets: [{
        label: "Hours",
        data: dm.hours,
        backgroundColor: fmt.color(2),
      }],
    });

    // Tag popularity trends (top 5 tags, stacked area)
    c = card(grid, "Tag popularity over time (top 5)");
    const tp = payload.tagTrends;
    if (tp && tp.labels && tp.labels.length) {
      chart(c, "line", {
        labels: tp.labels,
        datasets: tp.series.map((s, i) => ({
          label: s.label,
          data: s.values,
          borderColor: fmt.color(i),
          backgroundColor: fmt.color(i) + "55",
          fill: true,
          stack: "tags",
          tension: 0.2,
          pointRadius: 0,
        })),
      }, { scales: { y: { stacked: true, beginAtZero: true, ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } }, x: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } } } });
    } else {
      c.parentNode.innerHTML += '<div class="metrics-empty">No date data on scenes.</div>';
    }

    // Performer debut timeline (number of new performers appearing per month)
    c = card(grid, "Performer debuts per month");
    const pd = payload.performerDebutsPerMonth || { labels: [], counts: [] };
    chart(c, "bar", {
      labels: pd.labels,
      datasets: [{
        label: "New performers",
        data: pd.counts,
        backgroundColor: fmt.color(5),
      }],
    });

    // Studio output over time (top 5 studios stacked)
    c = card(grid, "Studio output (top 5, stacked)");
    const so = payload.studioOutput;
    if (so && so.labels && so.labels.length) {
      chart(c, "bar", {
        labels: so.labels,
        datasets: so.series.map((s, i) => ({
          label: s.label,
          data: s.values,
          backgroundColor: fmt.color(i),
          stack: "studios",
        })),
      }, { scales: { x: { stacked: true, ticks: { color: "#a8b1b8" } }, y: { stacked: true, ticks: { color: "#a8b1b8" } } } });
    }
  }

  ns.charts = ns.charts || {};
  ns.charts.timeseries = { render };
})();
