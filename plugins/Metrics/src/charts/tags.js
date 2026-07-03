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
        scales: type === "bar" || type === "line" ? {
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
    grid.appendChild(el);
    return el;
  }

  // Cheap tag cloud: SVG-ish stack of inline-block spans whose font-size
  // scales linearly with frequency. Anchored to a Stash search route so a
  // click goes straight to the tag page.
  function tagCloud(host, tags, ttlTopN, hideOther) {
    const list = stats.topN(tags || [], ttlTopN || 80, hideOther ? false : undefined);
    if (!list.length) {
      const e = document.createElement("div");
      e.className = "metrics-empty";
      e.textContent = "No tags.";
      host.appendChild(e);
      return;
    }
    const max = list[0].value;
    const min = list[list.length - 1].value;
    const span = Math.max(1, max - min);
    const wrap = document.createElement("div");
    wrap.className = "metrics-tagcloud";
    for (const t of list) {
      const a = document.createElement("a");
      a.className = "metrics-tag-pill";
      a.textContent = t.label;
      a.title = t.label + " — " + t.value + " scenes";
      a.style.fontSize = (12 + 22 * ((t.value - min) / span)).toFixed(1) + "px";
      a.style.color = fmt.colorFor(t.label);
      if (t.id) a.href = "/tags/" + encodeURIComponent(t.id);
      wrap.appendChild(a);
    }
    host.appendChild(wrap);
  }

  function treemap(host, tags, hideOther) {
    // Tiny hand-rolled treemap that doesn't need an extra Chart.js plugin.
    // Strip layout: rows sized proportionally, items packed left to right.
    const items = stats.topN(tags || [], 30, hideOther ? false : undefined);
    if (!items.length) {
      host.appendChild(emptyHint("No tags."));
      return;
    }
    const total = items.reduce((s, x) => s + x.value, 0);
    const wrap = document.createElement("div");
    wrap.className = "metrics-treemap";
    for (const t of items) {
      const cell = document.createElement("div");
      cell.className = "metrics-treemap-cell";
      const ratio = t.value / total;
      cell.style.flex = Math.max(0.04, ratio).toFixed(4);
      cell.style.minHeight = Math.max(36, ratio * 280).toFixed(0) + "px";
      cell.style.background = fmt.colorFor(t.label);
      cell.title = t.label + " — " + t.value;
      const inner = document.createElement("div");
      inner.className = "metrics-treemap-cell-inner";
      inner.innerHTML = '<span class="name"></span><span class="val"></span>';
      inner.querySelector(".name").textContent = t.label;
      inner.querySelector(".val").textContent = t.value;
      cell.appendChild(inner);
      wrap.appendChild(cell);
    }
    host.appendChild(wrap);
  }

  function emptyHint(text) {
    const e = document.createElement("div");
    e.className = "metrics-empty";
    e.textContent = text;
    return e;
  }

  // Heatmap rendered as a CSS grid. Each cell's background opacity scales
  // with weight. Tooltips show raw counts. Used for tag×ethnicity and
  // tag×country cross-analyses.
  function heatmap(host, matrix, rowLabels, colLabels, title) {
    const cont = document.createElement("div");
    cont.className = "metrics-heatmap";

    const max = matrix.reduce((m, row) => row.reduce((mm, v) => Math.max(mm, v), m), 0) || 1;

    const grid = document.createElement("div");
    grid.className = "metrics-heatmap-grid";
    grid.style.gridTemplateColumns = "120px repeat(" + colLabels.length + ", 1fr)";

    grid.appendChild(corner(title || ""));
    for (const cl of colLabels) {
      const h = document.createElement("div");
      h.className = "metrics-heatmap-col-head";
      h.textContent = cl;
      h.title = cl;
      grid.appendChild(h);
    }

    for (let r = 0; r < rowLabels.length; r++) {
      const rh = document.createElement("div");
      rh.className = "metrics-heatmap-row-head";
      rh.textContent = rowLabels[r];
      rh.title = rowLabels[r];
      grid.appendChild(rh);
      for (let c = 0; c < colLabels.length; c++) {
        const v = matrix[r][c] || 0;
        const cell = document.createElement("div");
        cell.className = "metrics-heatmap-cell";
        const a = v / max;
        cell.style.background = "rgba(79, 142, 247, " + (a * 0.9 + 0.05).toFixed(3) + ")";
        cell.textContent = v ? v : "";
        cell.title = rowLabels[r] + " × " + colLabels[c] + " — " + v;
        grid.appendChild(cell);
      }
    }
    cont.appendChild(grid);
    host.appendChild(cont);
  }

  function corner(text) {
    const d = document.createElement("div");
    d.className = "metrics-heatmap-corner";
    d.textContent = text;
    return d;
  }

  function render(host, payload, opts) {
    host.innerHTML = "";

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
    const k = payload.kpis || {};
    kpis.appendChild(kpi("Tags", fmt.int(k.total || 0), (k.usedInScenes || 0) + " used in scenes"));
    kpis.appendChild(kpi("Avg tags/scene", (k.avgTagsPerScene || 0).toFixed(1), "across all scenes"));
    kpis.appendChild(kpi("Unique tag pairs", fmt.int(k.uniquePairs || 0), "co-occurring"));
    kpis.appendChild(kpi("Hierarchies", fmt.int(k.parentTags || 0), "parent tags"));

    const grid = document.createElement("div");
    grid.className = "metrics-grid";
    host.appendChild(grid);

    const hideOther = !!(opts && opts.hideOtherBucket);

    // Tag cloud
    let c = card(grid, "Tag cloud (top 80 by scene count)");
    tagCloud(c, payload.tagFrequency || [], 80, hideOther);

    // Tag treemap
    c = card(grid, "Top tag treemap");
    treemap(c, payload.tagFrequency || [], hideOther);

    // Top tags bar
    c = card(grid, "Most used tags");
    const canvas = document.createElement("canvas");
    c.appendChild(canvas);
    const top = stats.topN(payload.tagFrequency || [], 20, hideOther ? false : undefined);
    chart(canvas, "bar", {
      labels: top.map((x) => x.label),
      datasets: [{ label: "Scenes", data: top.map((x) => x.value), backgroundColor: fmt.color(0) }],
    }, { indexAxis: "y" });

    // Co-occurrence (top 20 edges) as a horizontal bar — clearer than a
    // dense heatmap on the typical 1k-tag library.
    c = card(grid, "Tag co-occurrence (top 20 pairs)");
    const c2 = document.createElement("canvas");
    c.appendChild(c2);
    const pairs = (payload.tagCoOccurrence || []).slice(0, 20);
    chart(c2, "bar", {
      labels: pairs.map((p) => p.a + " ↔ " + p.b),
      datasets: [{ label: "Scenes", data: pairs.map((p) => p.weight), backgroundColor: fmt.color(2) }],
    }, { indexAxis: "y" });

    // Tags × ethnicity cross-analysis heatmap
    if (payload.tagsByEthnicity) {
      c = card(grid, "Tags × ethnicity (heatmap)");
      heatmap(c, payload.tagsByEthnicity.matrix, payload.tagsByEthnicity.tags, payload.tagsByEthnicity.ethnicities);
    }

    // Tags × country
    if (payload.tagsByCountry) {
      c = card(grid, "Tags × country (top 12 countries)");
      heatmap(c, payload.tagsByCountry.matrix, payload.tagsByCountry.tags, payload.tagsByCountry.countries);
    }

    // Hierarchical tag drill-down — list parent tags with their children.
    if (payload.tagHierarchy && payload.tagHierarchy.length) {
      c = card(grid, "Tag hierarchy");
      const ul = document.createElement("ul");
      ul.className = "metrics-hierarchy";
      for (const node of payload.tagHierarchy.slice(0, 25)) {
        const li = document.createElement("li");
        const head = document.createElement("div");
        head.className = "metrics-hierarchy-parent";
        head.innerHTML = '<span></span><span class="muted"></span>';
        head.querySelector("span").textContent = node.name;
        head.querySelector(".muted").textContent = " (" + node.sceneCount + ")";
        li.appendChild(head);
        if (node.children && node.children.length) {
          const cul = document.createElement("ul");
          for (const ch of node.children.slice(0, 12)) {
            const cli = document.createElement("li");
            cli.textContent = ch.name + " (" + ch.sceneCount + ")";
            cul.appendChild(cli);
          }
          li.appendChild(cul);
        }
        ul.appendChild(li);
      }
      c.appendChild(ul);
    }
  }

  ns.charts = ns.charts || {};
  ns.charts.tags = { render };
})();
