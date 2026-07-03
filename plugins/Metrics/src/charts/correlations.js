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

  function chartCanvas(host, type, data, options) {
    const c = document.createElement("canvas");
    host.appendChild(c);
    return new window.Chart(c, {
      type, data,
      options: Object.assign({
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#cfd6dc" } } },
        scales: type === "bar" || type === "scatter" || type === "bubble" ? {
          x: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
          y: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" }, beginAtZero: true },
        } : undefined,
      }, options || {}),
    });
  }

  function renderHeatmap(host, title, h) {
    const c = card(host, title, "cells with fewer than minSupport entries are blanked");
    if (!h || !h.rows.length || !h.cols.length) { emptyHint(c, "Not enough data."); return; }
    const wrap = document.createElement("div");
    wrap.className = "metrics-heatmap";
    const grid = document.createElement("div");
    grid.className = "metrics-heatmap-grid";
    grid.style.gridTemplateColumns = "160px repeat(" + h.cols.length + ", 1fr)";

    const corner = document.createElement("div");
    corner.className = "metrics-heatmap-corner";
    corner.textContent = "row \\ col";
    grid.appendChild(corner);
    for (const col of h.cols) {
      const ch = document.createElement("div");
      ch.className = "metrics-heatmap-col-head";
      ch.textContent = col;
      ch.title = col;
      grid.appendChild(ch);
    }
    // Color scale anchored to the max non-null value, clamped to a minimum
    // so a uniform dataset doesn't render fully transparent.
    let max = 0;
    for (const row of h.matrix) for (const v of row) if (v != null) max = Math.max(max, v);
    if (max === 0) max = 1;

    for (let r = 0; r < h.rows.length; r++) {
      const rh = document.createElement("div");
      rh.className = "metrics-heatmap-row-head";
      rh.textContent = h.rows[r];
      rh.title = h.rows[r];
      grid.appendChild(rh);
      for (let cc = 0; cc < h.cols.length; cc++) {
        const v = h.matrix[r][cc];
        const n = h.counts[r][cc];
        const cell = document.createElement("div");
        cell.className = "metrics-heatmap-cell";
        if (v == null) {
          cell.style.background = "rgba(255,255,255,0.04)";
          cell.style.color = "#56606b";
          cell.textContent = n > 0 ? "·" : "";
        } else {
          const a = Math.min(1, v / max);
          cell.style.background = "rgba(247, 110, 110, " + (a * 0.85 + 0.1).toFixed(3) + ")";
          cell.textContent = v.toFixed(2);
        }
        cell.title = h.rows[r] + " × " + h.cols[cc] + "  →  " +
          (v == null ? "n/a" : "avg O = " + v.toFixed(2)) + "  (n=" + n + ")";
        grid.appendChild(cell);
      }
    }
    wrap.appendChild(grid);
    c.appendChild(wrap);
  }

  function renderPerAttributeTable(host, attr, rows) {
    const c = card(host, "O-count by " + prettyAttr(attr), "avg O = total O / scenes containing performers in the group");
    if (!rows || !rows.length) { emptyHint(c, "Not enough data."); return; }
    const table = document.createElement("table");
    table.className = "metrics-table";
    const thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>" + prettyAttr(attr) + "</th><th>n</th><th>avg scene O</th><th>share ≥2</th><th>total O</th></tr>";
    table.appendChild(thead);
    const tbody = document.createElement("tbody");
    for (const r of rows.slice(0, 15)) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td></td><td>" + r.n + "</td>" +
        "<td>" + (r.avgSceneO != null ? r.avgSceneO.toFixed(2) : "—") + "</td>" +
        "<td>" + (r.shareHighO != null ? Math.round(r.shareHighO * 100) + "%" : "—") + "</td>" +
        "<td>" + r.totalO + "</td>";
      tr.firstChild.textContent = String(r.value);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    c.appendChild(table);
  }

  function prettyAttr(a) {
    return ({
      country: "Country", ethnicity: "Ethnicity", eyeColor: "Eye color",
      hairColor: "Hair color", cupLetter: "Cup", ageBucket: "Age",
      heightBucket: "Height", gender: "Gender",
    })[a] || a;
  }

  function renderBubble(host, bubbles) {
    const c = card(host, "Per-performer bubble — cup × avg scene O",
      "bubble size = scene count; colour = country");
    if (!bubbles || !bubbles.length) { emptyHint(c, "Not enough measurements."); return; }

    // Group by country so each shows up in the legend.
    const groups = new Map();
    for (const b of bubbles) {
      const k = b.country || "Unknown";
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(b);
    }
    const datasets = [];
    let i = 0;
    for (const [country, points] of groups) {
      datasets.push({
        label: country,
        data: points.map((p) => ({ x: p.x, y: p.y, r: p.r, name: p.name, country: p.country, eye: p.eyeColor, cup: p.cupLetter })),
        backgroundColor: fmt.color(i),
      });
      i++;
    }
    chartCanvas(c, "bubble", { datasets }, {
      scales: {
        x: {
          ticks: { color: "#a8b1b8", callback: (v) => {
            const arr = ns.correlations.CUP_ORDER;
            return v >= 1 && v <= arr.length ? arr[v - 1] : v;
          } },
          title: { display: true, text: "Cup size (ordinal)", color: "#cfd6dc" },
          grid: { color: "#2b3338" },
          min: 0.5,
          max: 11.5,
        },
        y: {
          title: { display: true, text: "Avg O per scene", color: "#cfd6dc" },
          ticks: { color: "#a8b1b8" },
          grid: { color: "#2b3338" },
          beginAtZero: true,
        },
      },
      plugins: {
        legend: { labels: { color: "#cfd6dc" } },
        tooltip: { callbacks: { label: (ctx) => {
          const r = ctx.raw;
          return r.name + " — cup " + r.cup + ", avg O " + r.y.toFixed(2) +
            (r.country ? ", " + r.country : "") + (r.eye ? ", " + r.eye + " eyes" : "");
        } } },
      },
    });
  }

  function renderParallel(host, parallel) {
    const c = card(host, "Parallel coordinates — per performer (top 400)",
      "categorical axes ordered by mean avg O");
    if (!parallel || !parallel.lines.length) { emptyHint(c, "Not enough data."); return; }
    const axes = parallel.axes;
    const W = 760, H = 380, pad = 36;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", String(H));
    svg.setAttribute("class", "metrics-parallel");

    const xs = axes.map((_, i) => pad + i * ((W - 2 * pad) / (axes.length - 1)));

    // Axis lines + labels
    for (let i = 0; i < axes.length; i++) {
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", xs[i]); line.setAttribute("x2", xs[i]);
      line.setAttribute("y1", pad); line.setAttribute("y2", H - pad);
      line.setAttribute("stroke", "#2b3338"); line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
      const label = document.createElementNS(svgNS, "text");
      label.setAttribute("x", xs[i]); label.setAttribute("y", H - 8);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", "#cfd6dc"); label.setAttribute("font-size", "11");
      label.textContent = prettyAttr(axes[i]);
      svg.appendChild(label);
    }

    // Color by avgSceneO bucket so the eye picks out high-O lines.
    const maxO = parallel.lines.reduce((m, l) => Math.max(m, l.avgSceneO || 0), 0) || 1;

    for (const line of parallel.lines) {
      let d = "";
      let started = false;
      for (let i = 0; i < axes.length; i++) {
        const v = line.axes[axes[i]];
        if (v == null) continue;
        const x = xs[i];
        const y = pad + (1 - v) * (H - 2 * pad);
        d += (started ? " L " : "M ") + x + " " + y;
        started = true;
      }
      if (!d) continue;
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      const intensity = Math.min(1, (line.avgSceneO || 0) / maxO);
      path.setAttribute("stroke", "rgba(247, 110, 110, " + (0.15 + 0.65 * intensity).toFixed(2) + ")");
      path.setAttribute("stroke-width", "1.2");
      const t = document.createElementNS(svgNS, "title");
      t.textContent = line.name + " — avg O " + (line.avgSceneO || 0).toFixed(2) + (line.country ? " · " + line.country : "");
      path.appendChild(t);
      svg.appendChild(path);
    }
    c.appendChild(svg);
  }

  function renderCorrelationStrength(host, cramers, pearson) {
    const c = card(host, "Correlation strength vs avg scene O",
      "Cramér's V for categoricals, Pearson r for numerics");
    const labels = [];
    const v = [];
    const colors = [];
    for (const [k, val] of Object.entries(cramers || {})) {
      labels.push(prettyAttr(k));
      v.push(val);
      colors.push(fmt.color(0));
    }
    for (const [k, r] of Object.entries(pearson || {})) {
      if (r == null) continue;
      labels.push(prettyAttr(k) + " (r)");
      v.push(Math.abs(r));
      colors.push(fmt.color(2));
    }
    if (!labels.length) { emptyHint(c, "Not enough data."); return; }
    chartCanvas(c, "bar", {
      labels,
      datasets: [{ label: "strength", data: v, backgroundColor: colors }],
    }, {
      indexAxis: "y",
      scales: {
        x: { min: 0, max: 1, ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
        y: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
      },
      plugins: { legend: { display: false } },
    });
  }

  // Rating × attribute heatmap. Built on the fly from raw performers/scenes
  // when the cache exposes them — keeps the cache slim while still giving
  // the Correlations tab a "rating correlations" surface.
  function buildRatingHeatmap(raw, rowAttr) {
    if (!raw || !raw.performers || !raw.scenes) return null;
    const perfById = new Map(raw.performers.map((p) => [p.id, p]));
    const buckets = new Map();
    for (const s of raw.scenes) {
      if (s.rating100 == null) continue;
      const bucket = String(Math.floor((s.rating100 || 0) / 20) * 20) + "–" + String(Math.floor((s.rating100 || 0) / 20) * 20 + 19);
      for (const p of s.performers || []) {
        const full = perfById.get(p.id);
        if (!full) continue;
        const v = rowAttr === "country" ? full.country
          : rowAttr === "ethnicity" ? full.ethnicity
          : rowAttr === "eyeColor" ? full.eye_color
          : rowAttr === "hairColor" ? full.hair_color
          : null;
        if (v == null || v === "") continue;
        const key = v + "||" + bucket;
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }
    }
    const rowSet = new Map();
    const colSet = new Map();
    for (const [k, n] of buckets) {
      const [r, c] = k.split("||");
      rowSet.set(r, (rowSet.get(r) || 0) + n);
      colSet.set(c, (colSet.get(c) || 0) + n);
    }
    const rows = Array.from(rowSet.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k]) => k);
    const cols = Array.from(colSet.keys()).sort();
    const matrix = rows.map((r) => cols.map((c) => buckets.get(r + "||" + c) || 0));
    const counts = matrix.map((row) => row.slice());
    // For rating, the "value" we colour by IS the count — higher rating
    // cells with more scenes are the interesting ones.
    return { rows, cols, matrix: matrix.map((row) => row.map((v) => v > 0 ? v : null)), counts };
  }

  // Body-type calibration — cup × height bucket, cells hold avg O per
  // scene. Which body shapes actually deliver.
  function buildBodyTypeCalibration(raw, opts) {
    if (!raw || !raw.performers || !raw.scenes) return null;
    const minSupport = (opts && opts.minSupport) || 3;
    const perfById = new Map(raw.performers.map((p) => [p.id, p]));
    // Cup extraction — accept p.cupLetter (enriched) or parse measurements.
    function cup(p) {
      if (p.cupLetter) return p.cupLetter.toUpperCase()[0];
      const m = String(p.measurements || "").replace(/\s+/g, "")
        .match(/^(\d{2,3})([a-zA-Z]+)?-/);
      return m && m[2] ? m[2].toUpperCase()[0] : null;
    }
    function heightBucket(cm) {
      if (!cm) return null;
      if (cm < 155) return "<155cm";
      if (cm < 160) return "155–160cm";
      if (cm < 165) return "160–165cm";
      if (cm < 170) return "165–170cm";
      if (cm < 175) return "170–175cm";
      return "175cm+";
    }
    const buckets = new Map();
    for (const s of raw.scenes) {
      for (const p of s.performers || []) {
        const full = perfById.get(p.id);
        if (!full) continue;
        const c = cup(full);
        const h = heightBucket(full.height_cm);
        if (!c || !h) continue;
        const key = c + "||" + h;
        const b = buckets.get(key) || { sumO: 0, sumRating: 0, ratedCount: 0, count: 0 };
        b.sumO += s.o_counter || 0;
        if (s.rating100 != null) { b.sumRating += s.rating100; b.ratedCount++; }
        b.count++;
        buckets.set(key, b);
      }
    }
    const rowSet = new Set();
    const colSet = new Set();
    for (const key of buckets.keys()) {
      const [c, h] = key.split("||");
      rowSet.add(c); colSet.add(h);
    }
    const rows = Array.from(rowSet).sort();
    const cols = ["<155cm", "155–160cm", "160–165cm", "165–170cm", "170–175cm", "175cm+"]
      .filter((c) => colSet.has(c));
    const matrix = rows.map((r) => cols.map((c) => {
      const b = buckets.get(r + "||" + c);
      if (!b || b.count < minSupport) return null;
      return +(b.sumO / b.count).toFixed(2);
    }));
    const counts = rows.map((r) => cols.map((c) => {
      const b = buckets.get(r + "||" + c);
      return b ? b.count : 0;
    }));
    return { rows, cols, matrix, counts };
  }

  // Top tags by their average scene rating.
  function topTagsByRating(raw, minSupport, n) {
    if (!raw || !raw.scenes) return [];
    const ratingByTag = new Map();
    const countByTag = new Map();
    for (const s of raw.scenes) {
      if (s.rating100 == null) continue;
      for (const t of s.tags || []) {
        ratingByTag.set(t.name, (ratingByTag.get(t.name) || 0) + s.rating100);
        countByTag.set(t.name, (countByTag.get(t.name) || 0) + 1);
      }
    }
    const out = [];
    for (const [name, total] of ratingByTag) {
      const count = countByTag.get(name) || 0;
      if (count < (minSupport || 3)) continue;
      out.push({ label: name, value: +(total / count).toFixed(2), n: count });
    }
    return out.sort((a, b) => b.value - a.value).slice(0, n || 15);
  }

  function render(host, payload, opts) {
    host.innerHTML = "";
    const corr = payload && payload.correlations;
    if (!corr) {
      emptyHint(host, "Correlations aren't in this cache. Run Update Metrics Cache — or uncheck 'Disable correlations tab' in plugin settings.");
      return;
    }
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
    kpi.bind = null;
    kpis.appendChild(kpi("Performers", corr.enrichedCount, ""));
    kpis.appendChild(kpi("Min support", corr.minSupport, "drops smaller buckets"));
    const strongest = strongest_(corr.cramersV);
    kpis.appendChild(kpi("Strongest categorical", strongest.attr || "—", strongest.v != null ? "V=" + strongest.v : ""));
    kpis.appendChild(kpi("Cup vs O (Pearson r)",
      corr.pearsonOrdinal && corr.pearsonOrdinal.cup != null ? corr.pearsonOrdinal.cup : "—", ""));
    kpis.appendChild(kpi("Age vs O (Pearson r)",
      corr.pearsonOrdinal && corr.pearsonOrdinal.age != null ? corr.pearsonOrdinal.age : "—", ""));
    kpis.appendChild(kpi("Height vs O (Pearson r)",
      corr.pearsonOrdinal && corr.pearsonOrdinal.height != null ? corr.pearsonOrdinal.height : "—", ""));

    const grid = document.createElement("div");
    grid.className = "metrics-grid";
    host.appendChild(grid);

    renderHeatmap(grid, "Country × Eye color (avg scene O)", corr.heatmaps.countryEye);
    renderHeatmap(grid, "Country × Cup (avg scene O)", corr.heatmaps.countryCup);
    renderHeatmap(grid, "Ethnicity × Cup (avg scene O)", corr.heatmaps.ethnicityCup);
    renderHeatmap(grid, "Age × Cup (avg scene O)", corr.heatmaps.ageCup);
    renderBubble(grid, corr.bubbles);
    renderParallel(grid, corr.parallel);
    renderCorrelationStrength(grid, corr.cramersV, corr.pearsonOrdinal);

    for (const attr of ["country", "ethnicity", "eyeColor", "cupLetter"]) {
      const rows = (corr.perAttribute || {})[attr];
      if (rows && rows.length) renderPerAttributeTable(grid, attr, rows);
    }

    // v1.2 — rating correlations. Built live off the raw cache if present.
    const raw = (payload && payload._raw) || (ns.dashboard && ns.dashboard.rawCache);
    if (raw) {
      renderHeatmap(grid, "Country × rating bucket (scene counts)",
        buildRatingHeatmap(raw, "country"));
      renderHeatmap(grid, "Ethnicity × rating bucket",
        buildRatingHeatmap(raw, "ethnicity"));
      renderHeatmap(grid, "Eye color × rating bucket",
        buildRatingHeatmap(raw, "eyeColor"));
      // v1.6 — body type calibration heatmap.
      const bodyH = buildBodyTypeCalibration(raw, { minSupport: opts && opts.correlationMinSupport || 3 });
      if (bodyH && bodyH.rows.length && bodyH.cols.length) {
        const c = card(grid, "Body type calibration — cup × height (avg scene O)",
          "cells with fewer than minSupport scenes are blanked");
        c.classList.add("metrics-bodytype-heatmap");
        const wrap = document.createElement("div");
        wrap.className = "metrics-heatmap";
        const gridEl = document.createElement("div");
        gridEl.className = "metrics-heatmap-grid";
        gridEl.style.gridTemplateColumns = "80px repeat(" + bodyH.cols.length + ", 1fr)";
        const corner = document.createElement("div");
        corner.className = "metrics-heatmap-corner";
        corner.textContent = "cup \\ ht";
        gridEl.appendChild(corner);
        for (const col of bodyH.cols) {
          const ch = document.createElement("div");
          ch.className = "metrics-heatmap-col-head";
          ch.textContent = col;
          gridEl.appendChild(ch);
        }
        let max = 0;
        for (const row of bodyH.matrix) for (const v of row) if (v != null) max = Math.max(max, v);
        if (max === 0) max = 1;
        for (let r = 0; r < bodyH.rows.length; r++) {
          const rh = document.createElement("div");
          rh.className = "metrics-heatmap-row-head";
          rh.textContent = bodyH.rows[r];
          gridEl.appendChild(rh);
          for (let cc = 0; cc < bodyH.cols.length; cc++) {
            const v = bodyH.matrix[r][cc];
            const n = bodyH.counts[r][cc];
            const cell = document.createElement("div");
            cell.className = "metrics-heatmap-cell";
            if (v == null) {
              cell.style.background = "rgba(255,255,255,0.04)";
              cell.style.color = "#56606b";
              cell.textContent = n > 0 ? "·" : "";
            } else {
              const a = Math.min(1, v / max);
              cell.style.background = "rgba(201, 142, 247, " + (a * 0.85 + 0.1).toFixed(3) + ")";
              cell.textContent = v.toFixed(2);
            }
            cell.title = bodyH.rows[r] + " × " + bodyH.cols[cc] + " → avg O " +
              (v == null ? "n/a" : v.toFixed(2)) + " (n=" + n + ")";
            gridEl.appendChild(cell);
          }
        }
        wrap.appendChild(gridEl);
        c.appendChild(wrap);
      }
      const tagsByRating = topTagsByRating(raw, opts && opts.correlationMinSupport, 15);
      if (tagsByRating.length) {
        const c = card(grid, "Top tags by avg scene rating", "min support: " + (opts && opts.correlationMinSupport || 3) + " scenes");
        const canvas = document.createElement("canvas");
        c.appendChild(canvas);
        new window.Chart(canvas, {
          type: "bar",
          data: {
            labels: tagsByRating.map((x) => x.label + " (n=" + x.n + ")"),
            datasets: [{ label: "Avg rating", data: tagsByRating.map((x) => x.value), backgroundColor: fmt.color(3) }],
          },
          options: {
            indexAxis: "y", responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { min: 0, max: 100, ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
              y: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
            },
          },
        });
      }
    }
  }

  function strongest_(map) {
    let best = { attr: null, v: null };
    for (const [k, v] of Object.entries(map || {})) {
      if (v == null) continue;
      if (best.v == null || v > best.v) best = { attr: prettyAttr(k), v };
    }
    return best;
  }

  ns.charts = ns.charts || {};
  ns.charts.correlations = { render };
})();
