(function () {
  "use strict";
  const ns = (window.StashMetrics = window.StashMetrics || {});
  const fmt = ns.format;

  function card(host, title, sub) {
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
    host.appendChild(el);
    return el;
  }

  function empty(host, text) {
    const e = document.createElement("div");
    e.className = "metrics-empty";
    e.textContent = text;
    host.appendChild(e);
  }

  function renderScore(host, cleanup) {
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
    const s = cleanup.metadataHealthScore;
    const grade = s >= 90 ? "A" : s >= 80 ? "A-" : s >= 70 ? "B" : s >= 60 ? "C" : s >= 50 ? "D" : "F";
    const scoreKpi = kpi("Metadata health", s, "grade " + grade);
    scoreKpi.classList.add("metrics-cleanup-score");
    scoreKpi.classList.add(s >= 80 ? "good" : s >= 60 ? "mid" : "bad");
    kpis.appendChild(scoreKpi);
    kpis.appendChild(kpi("Performers with gaps", fmt.int(cleanup.performerGapsTotal),
      "at least one missing field"));
    for (const f of cleanup.performerFields) {
      const st = cleanup.performerFieldStats[f.key];
      const pct = st.total ? Math.round(100 * st.missing / st.total) : 0;
      const sub = pct + "% of " + st.total + " performers";
      kpis.appendChild(kpi("Missing " + f.label.toLowerCase(), fmt.int(st.missing), sub));
    }
  }

  function renderFilterBar(cleanup, onChange) {
    const bar = document.createElement("div");
    bar.className = "metrics-cleanup-filter";
    const label = document.createElement("span");
    label.className = "metrics-cleanup-filter-label";
    label.textContent = "Show performers missing:";
    bar.appendChild(label);
    // Default filter = ethnicity if any missing, else the field with the
    // largest gap.
    let defaultKey = "ethnicity";
    if (!cleanup.performerFieldStats.ethnicity.missing) {
      let bestKey = "ethnicity", bestVal = 0;
      for (const f of cleanup.performerFields) {
        const v = cleanup.performerFieldStats[f.key].missing;
        if (v > bestVal) { bestVal = v; bestKey = f.key; }
      }
      defaultKey = bestKey;
    }
    for (const f of cleanup.performerFields) {
      const btn = document.createElement("button");
      btn.className = "metrics-cleanup-chip";
      btn.dataset.key = f.key;
      const missing = cleanup.performerFieldStats[f.key].missing;
      btn.innerHTML = '<span class="metrics-cleanup-chip-label"></span>' +
        '<span class="metrics-cleanup-chip-count"></span>';
      btn.querySelector(".metrics-cleanup-chip-label").textContent = f.label;
      btn.querySelector(".metrics-cleanup-chip-count").textContent = missing;
      if (missing === 0) btn.classList.add("disabled");
      if (f.key === defaultKey) btn.classList.add("active");
      btn.addEventListener("click", function () {
        if (missing === 0) return;
        bar.querySelectorAll(".metrics-cleanup-chip").forEach((c) => c.classList.remove("active"));
        btn.classList.add("active");
        onChange(f.key);
      });
      bar.appendChild(btn);
    }
    return { bar, defaultKey };
  }

  function renderPerformerTable(host, field, list) {
    host.innerHTML = "";
    const c = card(host, "Performers missing " + field.label.toLowerCase(),
      "Sorted: favorites first, then scene count (highest-impact fixes at the top). Click a name to open the editor.");
    if (!list.top.length) {
      empty(c, "No performers missing this field. Nice.");
      return;
    }
    const meta = document.createElement("div");
    meta.className = "metrics-cleanup-meta";
    meta.textContent = "Showing " + list.top.length + " of " + list.total + " performers missing " + field.label.toLowerCase() + ".";
    c.appendChild(meta);
    const table = document.createElement("table");
    table.className = "metrics-table metrics-cleanup-table";
    table.innerHTML =
      "<thead><tr>" +
      "<th></th><th>Performer</th><th>Scenes</th><th>Rating</th><th></th>" +
      "</tr></thead>";
    const tbody = document.createElement("tbody");
    for (const p of list.top) {
      const tr = document.createElement("tr");
      // Favourite star
      const favTd = document.createElement("td");
      if (p.favorite) { favTd.textContent = "★"; favTd.className = "metrics-cleanup-fav"; }
      const nameTd = document.createElement("td");
      const a = document.createElement("a");
      a.href = "/performers/" + encodeURIComponent(p.id);
      a.textContent = p.name;
      nameTd.appendChild(a);
      const sceneTd = document.createElement("td");
      sceneTd.textContent = p.sceneCount;
      const ratingTd = document.createElement("td");
      ratingTd.textContent = p.rating100 != null ? p.rating100 : "—";
      const editTd = document.createElement("td");
      const editA = document.createElement("a");
      editA.href = "/performers/" + encodeURIComponent(p.id) + "?edit=true";
      editA.textContent = "edit";
      editA.className = "metrics-cleanup-edit";
      editTd.appendChild(editA);
      tr.appendChild(favTd);
      tr.appendChild(nameTd);
      tr.appendChild(sceneTd);
      tr.appendChild(ratingTd);
      tr.appendChild(editTd);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    c.appendChild(table);
  }

  function renderMultiGap(host, gaps, fields) {
    const c = card(host, "Performers with the most missing fields",
      "Top-impact cleanup targets — favourites and heavily-used performers first.");
    if (!gaps.length) { empty(c, "No performers with gaps."); return; }
    const table = document.createElement("table");
    table.className = "metrics-table metrics-cleanup-table";
    table.innerHTML =
      "<thead><tr><th></th><th>Performer</th><th>Scenes</th><th>Missing</th><th></th></tr></thead>";
    const labelByKey = new Map(fields.map((f) => [f.key, f.label]));
    const tbody = document.createElement("tbody");
    for (const p of gaps.slice(0, 30)) {
      const tr = document.createElement("tr");
      const favTd = document.createElement("td");
      if (p.favorite) { favTd.textContent = "★"; favTd.className = "metrics-cleanup-fav"; }
      const nameTd = document.createElement("td");
      const a = document.createElement("a");
      a.href = "/performers/" + encodeURIComponent(p.id);
      a.textContent = p.name;
      nameTd.appendChild(a);
      const sceneTd = document.createElement("td");
      sceneTd.textContent = p.sceneCount;
      const missTd = document.createElement("td");
      const badges = document.createElement("div");
      badges.className = "metrics-cleanup-badges";
      for (const key of p.missingFields) {
        const b = document.createElement("span");
        b.className = "metrics-badge metrics-cleanup-badge";
        b.textContent = labelByKey.get(key) || key;
        badges.appendChild(b);
      }
      missTd.appendChild(badges);
      const editTd = document.createElement("td");
      const editA = document.createElement("a");
      editA.href = "/performers/" + encodeURIComponent(p.id) + "?edit=true";
      editA.textContent = "edit";
      editA.className = "metrics-cleanup-edit";
      editTd.appendChild(editA);
      tr.appendChild(favTd);
      tr.appendChild(nameTd);
      tr.appendChild(sceneTd);
      tr.appendChild(missTd);
      tr.appendChild(editTd);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    c.appendChild(table);
  }

  function renderSceneCleanup(host, cleanup) {
    const c = card(host, "Scenes with metadata gaps",
      "Click a field to see the highest-play scenes missing that value. Fix these first — they show up most often on the dashboard.");
    const tabs = document.createElement("div");
    tabs.className = "metrics-cleanup-filter";
    const list = document.createElement("div");
    list.className = "metrics-cleanup-scenes";

    function showField(key) {
      const f = cleanup.sceneFields.find((x) => x.key === key);
      const st = cleanup.sceneByField[key];
      list.innerHTML = "";
      if (!st || !st.top.length) {
        const e = document.createElement("div");
        e.className = "metrics-empty";
        e.textContent = "No scenes missing " + f.label.toLowerCase() + ".";
        list.appendChild(e);
        return;
      }
      const meta = document.createElement("div");
      meta.className = "metrics-cleanup-meta";
      meta.textContent = "Showing " + st.top.length + " of " + st.total + " scenes missing " + f.label.toLowerCase() + ".";
      list.appendChild(meta);
      const table = document.createElement("table");
      table.className = "metrics-table";
      table.innerHTML =
        "<thead><tr><th>Scene</th><th>Studio</th><th>Date</th><th>Plays</th><th></th></tr></thead>";
      const tbody = document.createElement("tbody");
      for (const s of st.top) {
        const tr = document.createElement("tr");
        const t = document.createElement("td");
        const a = document.createElement("a");
        a.href = "/scenes/" + encodeURIComponent(s.id);
        a.textContent = s.title;
        t.appendChild(a);
        const stTd = document.createElement("td");
        stTd.textContent = s.studio || "—";
        const dateTd = document.createElement("td");
        dateTd.textContent = s.date || "—";
        const playTd = document.createElement("td");
        playTd.textContent = s.playCount;
        const editTd = document.createElement("td");
        const editA = document.createElement("a");
        editA.href = "/scenes/" + encodeURIComponent(s.id) + "?edit=true";
        editA.textContent = "edit";
        editA.className = "metrics-cleanup-edit";
        editTd.appendChild(editA);
        tr.appendChild(t); tr.appendChild(stTd); tr.appendChild(dateTd);
        tr.appendChild(playTd); tr.appendChild(editTd);
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      list.appendChild(table);
    }
    // Field chips.
    let firstKey = null;
    for (const f of cleanup.sceneFields) {
      const st = cleanup.sceneFieldStats[f.key];
      const btn = document.createElement("button");
      btn.className = "metrics-cleanup-chip";
      btn.innerHTML = '<span class="metrics-cleanup-chip-label"></span>' +
        '<span class="metrics-cleanup-chip-count"></span>';
      btn.querySelector(".metrics-cleanup-chip-label").textContent = f.label;
      btn.querySelector(".metrics-cleanup-chip-count").textContent = st.missing;
      if (st.missing === 0) btn.classList.add("disabled");
      btn.addEventListener("click", function () {
        if (st.missing === 0) return;
        tabs.querySelectorAll(".metrics-cleanup-chip").forEach((c) => c.classList.remove("active"));
        btn.classList.add("active");
        showField(f.key);
      });
      if (!firstKey && st.missing > 0) {
        firstKey = f.key;
        btn.classList.add("active");
      }
      tabs.appendChild(btn);
    }
    c.appendChild(tabs);
    c.appendChild(list);
    if (firstKey) showField(firstKey);
    else empty(list, "All scenes have complete metadata. Nice.");
  }

  function render(host, payload, opts) {
    host.innerHTML = "";
    const c = payload && payload.cleanup;
    if (!c) {
      empty(host, "Cleanup not in cache. Run Update Metrics Cache.");
      return;
    }
    renderScore(host, c);

    // Performer cleanup — filter bar + auto-refreshing table.
    const perfCard = document.createElement("div");
    perfCard.className = "metrics-card metrics-cleanup-performers";
    const perfTitle = document.createElement("div");
    perfTitle.className = "metrics-card-title";
    perfTitle.textContent = "Performer metadata cleanup";
    perfCard.appendChild(perfTitle);
    const perfSub = document.createElement("div");
    perfSub.className = "metrics-card-sub";
    perfSub.textContent = "Pick a field to focus on. The table lists highest-impact performers first: favorites, then most-used.";
    perfCard.appendChild(perfSub);
    const tableHost = document.createElement("div");

    const { bar, defaultKey } = renderFilterBar(c, function (key) {
      const field = c.performerFields.find((f) => f.key === key);
      renderPerformerTable(tableHost, field, c.performerByField[key]);
    });
    perfCard.appendChild(bar);
    perfCard.appendChild(tableHost);
    host.appendChild(perfCard);

    // Initial render.
    const initialField = c.performerFields.find((f) => f.key === defaultKey);
    renderPerformerTable(tableHost, initialField, c.performerByField[defaultKey]);

    // Multi-gap card.
    const grid = document.createElement("div");
    grid.className = "metrics-grid metrics-cleanup-grid";
    host.appendChild(grid);
    renderMultiGap(grid, c.performerGaps, c.performerFields);
    renderSceneCleanup(grid, c);
  }

  ns.charts = ns.charts || {};
  ns.charts.cleanup = { render };
})();
