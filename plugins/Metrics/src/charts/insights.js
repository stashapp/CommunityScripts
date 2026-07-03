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

  function chart(host, type, data, options) {
    const c = document.createElement("canvas");
    host.appendChild(c);
    return new window.Chart(c, {
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

  function emptyHint(host, text) {
    const e = document.createElement("div");
    e.className = "metrics-empty";
    e.textContent = text;
    host.appendChild(e);
  }

  function renderDiversityBars(host, diversities) {
    if (!diversities || !diversities.length) { emptyHint(host, "No diversity data."); return; }
    const c = document.createElement("canvas");
    host.appendChild(c);
    new window.Chart(c, {
      type: "bar",
      data: {
        labels: diversities.map((d) => d.attribute),
        datasets: [
          { label: "Gini-Simpson", data: diversities.map((d) => d.indices ? d.indices.giniSimpson : 0), backgroundColor: fmt.color(0) },
          { label: "Shannon evenness", data: diversities.map((d) => d.indices ? d.indices.shannonEvenness : 0), backgroundColor: fmt.color(2) },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: "#cfd6dc" } } },
        scales: {
          x: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } },
          y: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" }, beginAtZero: true, max: 1 },
        },
      },
    });
  }

  function renderDiversityTable(host, diversities) {
    if (!diversities || !diversities.length) { emptyHint(host, "No data."); return; }
    const table = document.createElement("table");
    table.className = "metrics-table";
    table.innerHTML = "<thead><tr><th>Attribute</th><th>Coverage</th><th>Categories</th><th>Effective N</th><th>Shannon H</th><th>Gini-Simpson</th></tr></thead>";
    const tbody = document.createElement("tbody");
    for (const d of diversities) {
      const idx = d.indices || {};
      const tr = document.createElement("tr");
      tr.innerHTML = "<td>" + d.attribute + "</td>" +
        "<td>" + Math.round((d.coverage || 0) * 100) + "%</td>" +
        "<td>" + (idx.categories || 0) + "</td>" +
        "<td>" + (idx.effectiveN != null ? idx.effectiveN : "—") + "</td>" +
        "<td>" + (idx.shannon != null ? idx.shannon : "—") + "</td>" +
        "<td>" + (idx.giniSimpson != null ? idx.giniSimpson : "—") + "</td>";
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    host.appendChild(table);
  }

  function renderGaps(host, gaps) {
    const wrap = document.createElement("div");
    wrap.className = "metrics-gaps";
    const cov = document.createElement("div");
    cov.className = "metrics-gaps-coverage";
    cov.innerHTML = "<div class=\"metrics-card-sub\">Coverage per attribute (higher is better)</div>";
    for (const c of (gaps.coverage || [])) {
      const row = document.createElement("div");
      row.className = "metrics-gauge";
      row.innerHTML = '<div class="metrics-gauge-label"></div><div class="metrics-gauge-bar"><div class="metrics-gauge-fill"></div></div><div class="metrics-gauge-val"></div>';
      row.querySelector(".metrics-gauge-label").textContent = c.attribute;
      row.querySelector(".metrics-gauge-fill").style.width = Math.round(c.coverage * 100) + "%";
      row.querySelector(".metrics-gauge-fill").style.background = c.coverage >= 0.6 ? "#3ecf8e" : c.coverage >= 0.3 ? "#f7c948" : "#f76e6e";
      row.querySelector(".metrics-gauge-val").textContent = Math.round(c.coverage * 100) + "%";
      cov.appendChild(row);
    }
    wrap.appendChild(cov);

    for (const [attr, items] of Object.entries(gaps.underRepresented || {})) {
      if (!items.length) continue;
      const sec = document.createElement("div");
      sec.className = "metrics-gaps-section";
      sec.innerHTML = '<div class="metrics-card-sub">Under-represented ' + attr + " (n &lt; minSupport)</div>";
      const tags = document.createElement("div");
      tags.className = "metrics-match-tags";
      for (const it of items.slice(0, 12)) {
        const b = document.createElement("span");
        b.className = "metrics-badge";
        b.textContent = it.label + " · " + it.value;
        tags.appendChild(b);
      }
      sec.appendChild(tags);
      wrap.appendChild(sec);
    }

    if ((gaps.tagGaps || []).length) {
      const sec = document.createElement("div");
      sec.className = "metrics-gaps-section";
      sec.innerHTML = '<div class="metrics-card-sub">Rare tags (potential gaps or typos)</div>';
      const tags = document.createElement("div");
      tags.className = "metrics-match-tags";
      for (const it of gaps.tagGaps.slice(0, 20)) {
        const b = document.createElement("span");
        b.className = "metrics-badge";
        b.textContent = it.label + " · " + it.value;
        tags.appendChild(b);
      }
      sec.appendChild(tags);
      wrap.appendChild(sec);
    }
    if (gaps.unusedTagsCount > 0) {
      const sec = document.createElement("div");
      sec.className = "metrics-gaps-section";
      sec.innerHTML = '<div class="metrics-card-sub">Unused tags (' + gaps.unusedTagsCount + ' total, sample below)</div>';
      const tags = document.createElement("div");
      tags.className = "metrics-match-tags";
      for (const it of gaps.unusedTagsSample || []) {
        const b = document.createElement("span");
        b.className = "metrics-badge";
        b.textContent = it.label;
        tags.appendChild(b);
      }
      sec.appendChild(tags);
      wrap.appendChild(sec);
    }
    host.appendChild(wrap);
  }

  function renderCareerTimelines(host, timelines) {
    // Render as a Gantt-strip SVG. Y axis = performers, X axis = year span.
    if (!timelines || !timelines.length) { emptyHint(host, "No career data."); return; }
    const years = timelines.map((t) => [t.firstYear, t.lastYear]).flat().filter(Boolean);
    if (!years.length) { emptyHint(host, "No date data on scenes."); return; }
    const minYear = Math.min.apply(null, years);
    const maxYear = Math.max.apply(null, years);
    const span = Math.max(1, maxYear - minYear);
    const rowH = 18;
    const padL = 140, padR = 20, padT = 20, padB = 26;
    const W = 760;
    const H = padT + padB + rowH * timelines.length;
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", String(H));
    svg.setAttribute("class", "metrics-careers");
    // X-axis labels (every ~5 years)
    for (let y = Math.ceil(minYear / 5) * 5; y <= maxYear; y += 5) {
      const x = padL + ((y - minYear) / span) * (W - padL - padR);
      const t = document.createElementNS(svgNS, "text");
      t.setAttribute("x", x); t.setAttribute("y", H - padB + 14);
      t.setAttribute("fill", "#a8b1b8"); t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-size", "10");
      t.textContent = y;
      svg.appendChild(t);
      const gl = document.createElementNS(svgNS, "line");
      gl.setAttribute("x1", x); gl.setAttribute("x2", x);
      gl.setAttribute("y1", padT); gl.setAttribute("y2", H - padB);
      gl.setAttribute("stroke", "#2b3338"); gl.setAttribute("stroke-width", "0.5");
      svg.appendChild(gl);
    }
    timelines.forEach((t, i) => {
      const y = padT + i * rowH;
      const x1 = padL + ((t.firstYear - minYear) / span) * (W - padL - padR);
      const x2 = padL + ((t.lastYear - minYear) / span) * (W - padL - padR);
      const lbl = document.createElementNS(svgNS, "text");
      lbl.setAttribute("x", padL - 6); lbl.setAttribute("y", y + 13);
      lbl.setAttribute("fill", "#cfd6dc"); lbl.setAttribute("text-anchor", "end");
      lbl.setAttribute("font-size", "11");
      lbl.textContent = t.name;
      svg.appendChild(lbl);
      const bar = document.createElementNS(svgNS, "rect");
      bar.setAttribute("x", Math.min(x1, x2) - 2);
      bar.setAttribute("y", y + 4);
      bar.setAttribute("width", Math.max(4, Math.abs(x2 - x1)));
      bar.setAttribute("height", 10);
      bar.setAttribute("fill", fmt.colorFor(t.name));
      bar.setAttribute("rx", 3);
      const tt = document.createElementNS(svgNS, "title");
      tt.textContent = t.name + " · " + t.firstYear + "–" + t.lastYear + " · " + t.sceneCount + " scenes";
      bar.appendChild(tt);
      svg.appendChild(bar);
    });
    host.appendChild(svg);
  }

  function render(host, payload) {
    host.innerHTML = "";
    const div = payload && payload.diversity;
    const tmp = payload && payload.temporal;

    if (!div && !tmp) {
      emptyHint(host, "Insights aren't in this cache. Run Update Metrics Cache.");
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
    if (div && div.diversities) {
      const country = div.diversities.find((d) => d.attribute === "country");
      const tagsDiv = div.diversities.find((d) => d.attribute === "tags");
      const eye = div.diversities.find((d) => d.attribute === "eye_color");
      if (country && country.indices) kpis.appendChild(kpi("Country diversity", country.indices.giniSimpson, country.indices.effectiveN + " effective"));
      if (tagsDiv && tagsDiv.indices) kpis.appendChild(kpi("Tag diversity", tagsDiv.indices.giniSimpson, tagsDiv.indices.effectiveN + " effective"));
      if (eye && eye.indices) kpis.appendChild(kpi("Eye-color diversity", eye.indices.giniSimpson, ""));
    }
    if (tmp && tmp.releaseYearHistogram && tmp.releaseYearHistogram.labels.length) {
      const yr = tmp.releaseYearHistogram;
      const peak = yr.counts.indexOf(Math.max.apply(null, yr.counts));
      kpis.appendChild(kpi("Peak release year", yr.labels[peak], yr.counts[peak] + " scenes"));
      kpis.appendChild(kpi("Catalog span", yr.labels[0] + "–" + yr.labels[yr.labels.length - 1], (yr.labels[yr.labels.length - 1] - yr.labels[0] + 1) + " years"));
    }

    const grid = document.createElement("div");
    grid.className = "metrics-grid";
    host.appendChild(grid);

    if (div) {
      let c = card(grid, "Diversity indices", "Shannon evenness vs Gini-Simpson per attribute");
      renderDiversityBars(c, div.diversities);
      c = card(grid, "Diversity table");
      renderDiversityTable(c, div.diversities);
      c = card(grid, "Coverage & gaps", "Low coverage = sparse metadata → metric is less reliable");
      renderGaps(c, div.gaps);
    }
    if (tmp) {
      let c = card(grid, "Releases by year");
      chart(c, "bar", {
        labels: tmp.releaseYearHistogram.labels,
        datasets: [{ label: "Scenes", data: tmp.releaseYearHistogram.counts, backgroundColor: fmt.color(0) }],
      });
      c = card(grid, "Added vs released by year", "blue = release year, orange = catalog acquisition year");
      chart(c, "bar", {
        labels: tmp.addedVsReleased.labels,
        datasets: [
          { label: "Released", data: tmp.addedVsReleased.released, backgroundColor: fmt.color(0) },
          { label: "Added", data: tmp.addedVsReleased.added, backgroundColor: fmt.color(6) },
        ],
      });
      c = card(grid, "Performer birth years");
      chart(c, "bar", {
        labels: tmp.performerBirthYearHistogram.labels,
        datasets: [{ label: "Performers", data: tmp.performerBirthYearHistogram.counts, backgroundColor: fmt.color(4) }],
      });
      c = card(grid, "Active performers per year");
      chart(c, "line", {
        labels: tmp.activePerformersPerYear.labels,
        datasets: [{
          label: "Distinct performers",
          data: tmp.activePerformersPerYear.counts,
          borderColor: fmt.color(2),
          backgroundColor: fmt.color(2) + "33",
          fill: true,
          tension: 0.25,
        }],
      });
      c = card(grid, "Studio output by year (stacked, top 6)");
      const studios = tmp.releaseYearByStudio;
      chart(c, "bar", {
        labels: studios.labels,
        datasets: studios.series.map((s, i) => ({
          label: s.label,
          data: s.values,
          backgroundColor: fmt.color(i),
          stack: "studios",
        })),
      }, { scales: { x: { stacked: true, ticks: { color: "#a8b1b8" } }, y: { stacked: true, ticks: { color: "#a8b1b8" } } } });
      c = card(grid, "Career timelines (top 20 performers)");
      renderCareerTimelines(c, tmp.careerTimelines);
      c = card(grid, "Tag evolution — counts per year (top 10)");
      chart(c, "line", {
        labels: tmp.tagEvolution.labels,
        datasets: tmp.tagEvolution.series.map((s, i) => ({
          label: s.label, data: s.counts,
          borderColor: fmt.color(i), backgroundColor: fmt.color(i) + "33",
          tension: 0.2, pointRadius: 1, fill: false,
        })),
      });
      c = card(grid, "Tag evolution — share of year (top 10, %)");
      chart(c, "line", {
        labels: tmp.tagEvolution.labels,
        datasets: tmp.tagEvolution.series.map((s, i) => ({
          label: s.label, data: s.shareOfYear,
          borderColor: fmt.color(i), backgroundColor: fmt.color(i) + "33",
          tension: 0.2, pointRadius: 1, fill: false,
        })),
      });
      c = card(grid, "New tags discovered per year");
      chart(c, "bar", {
        labels: tmp.newTagsByYear.labels,
        datasets: [{ label: "New tags", data: tmp.newTagsByYear.counts, backgroundColor: fmt.color(5) }],
      });
    }

    // v1.6 fun blocks.
    const funBlock = payload && payload.fun;
    if (!funBlock) return;

    // Kink evolution — top played tags per month over the last 12 months.
    if (funBlock.kinkEvolution && funBlock.kinkEvolution.labels && funBlock.kinkEvolution.labels.length) {
      let c = card(grid, "Kink evolution — last 12 months",
        "top 8 played tags per month; watch your taste shift over time");
      const ke = funBlock.kinkEvolution;
      chart(c, "line", {
        labels: ke.labels,
        datasets: ke.series.map((s, i) => ({
          label: s.label, data: s.values,
          borderColor: fmt.color(i), backgroundColor: fmt.color(i) + "55",
          tension: 0.25, pointRadius: 1, fill: false, stack: "kinks",
        })),
      }, { scales: { y: { stacked: false, ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" }, beginAtZero: true }, x: { ticks: { color: "#a8b1b8" }, grid: { color: "#2b3338" } } } });
    }

    // Time capsule — what you were into 6 months ago.
    if (funBlock.timeCapsule) {
      const tc = funBlock.timeCapsule;
      let c = card(grid, "Time capsule · " + tc.monthsBack + " months ago",
        "what you were watching in the ±2 week window around that date");
      if (tc.empty) {
        emptyHint(c, "No play history from that window.");
      } else {
        const wrap = document.createElement("div");
        wrap.className = "metrics-timecapsule";
        function subsection(label, items, renderItem) {
          const h = document.createElement("div");
          h.className = "metrics-card-sub";
          h.textContent = label;
          wrap.appendChild(h);
          const ol = document.createElement("ol");
          ol.className = "metrics-list";
          for (const it of items) ol.appendChild(renderItem(it));
          wrap.appendChild(ol);
        }
        subsection("Scenes you were playing:", tc.topScenes || [], (s) => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.className = "metrics-list-name";
          a.textContent = s.title;
          a.href = "/scenes/" + encodeURIComponent(s.id);
          li.appendChild(a);
          const meta = document.createElement("span");
          meta.className = "metrics-list-val";
          meta.textContent = "  · " + s.plays + " plays" + (s.rating100 != null ? " · ★ " + s.rating100 : "");
          li.appendChild(meta);
          return li;
        });
        subsection("Performers you were into:", tc.topPerformers || [], (p) => {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.className = "metrics-list-name";
          a.textContent = p.name;
          a.href = "/performers/" + encodeURIComponent(p.id);
          li.appendChild(a);
          const meta = document.createElement("span");
          meta.className = "metrics-list-val";
          meta.textContent = "  · " + p.plays + " plays";
          li.appendChild(meta);
          return li;
        });
        subsection("Tags dominating:", tc.topTags || [], (t) => {
          const li = document.createElement("li");
          li.innerHTML = '<span class="metrics-list-name"></span><span class="metrics-list-val"></span>';
          li.firstChild.textContent = t.name;
          li.lastChild.textContent = "  · " + t.plays;
          return li;
        });
        c.appendChild(wrap);
      }
    }

    // Country tourism — grid of country cards with flag + counts.
    if (funBlock.countryTourism && funBlock.countryTourism.length) {
      let c = card(grid, "Country tourism map",
        "which countries your library represents · sorted by scenes");
      const wrap = document.createElement("div");
      wrap.className = "metrics-country-tour";
      const maxScenes = funBlock.countryTourism.reduce((m, r) => Math.max(m, r.sceneCount), 0) || 1;
      for (const row of funBlock.countryTourism.slice(0, 30)) {
        const cell = document.createElement("div");
        cell.className = "metrics-country-tile";
        const flag = ns.stats.countryFlag ? ns.stats.countryFlag(row.code) : "";
        cell.innerHTML =
          '<div class="metrics-country-flag"></div>' +
          '<div class="metrics-country-code"></div>' +
          '<div class="metrics-country-bar"><div class="metrics-country-fill"></div></div>' +
          '<div class="metrics-country-stats"></div>';
        cell.querySelector(".metrics-country-flag").textContent = flag;
        cell.querySelector(".metrics-country-code").textContent = row.code;
        cell.querySelector(".metrics-country-fill").style.width =
          Math.round(row.sceneCount / maxScenes * 100) + "%";
        cell.querySelector(".metrics-country-stats").textContent =
          row.performerCount + "p · " + row.sceneCount + "s · " + row.playCount + "▶";
        wrap.appendChild(cell);
      }
      c.appendChild(wrap);
    }
  }

  ns.charts = ns.charts || {};
  ns.charts.insights = { render };
})();
