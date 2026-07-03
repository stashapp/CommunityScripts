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

  function renderCluster(host, cluster) {
    const el = document.createElement("div");
    el.className = "metrics-cluster";
    const head = document.createElement("div");
    head.className = "metrics-cluster-head";
    const name = document.createElement("div");
    name.className = "metrics-cluster-name";
    name.textContent = "Archetype #" + (cluster.id + 1) + " — " + cluster.label;
    head.appendChild(name);
    const size = document.createElement("div");
    size.className = "metrics-cluster-size";
    size.textContent = cluster.size + " performers";
    head.appendChild(size);
    el.appendChild(head);

    const tags = document.createElement("div");
    tags.className = "metrics-match-tags";
    for (const p of (cluster.prominentAttrs || []).slice(0, 6)) {
      const b = document.createElement("span");
      b.className = "metrics-badge";
      b.textContent = p.key + " (" + p.weight.toFixed(2) + ")";
      tags.appendChild(b);
    }
    el.appendChild(tags);

    const rep = document.createElement("div");
    rep.className = "metrics-cluster-rep";
    rep.innerHTML = '<div class="metrics-list-sub">Most representative members:</div>';
    const ul = document.createElement("ul");
    ul.className = "metrics-list metrics-cluster-members";
    for (const m of (cluster.members || []).slice(0, 8)) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "metrics-list-name";
      a.textContent = m.name;
      a.href = "/performers/" + encodeURIComponent(m.id);
      li.appendChild(a);
      const v = document.createElement("span");
      v.className = "metrics-list-val";
      v.textContent = "  " + (m.country || "") + (m.cupLetter ? " · cup " + m.cupLetter : "") +
        " · avg O " + (m.avgSceneO != null ? m.avgSceneO.toFixed(2) : "?");
      li.appendChild(v);
      ul.appendChild(li);
    }
    rep.appendChild(ul);
    el.appendChild(rep);

    host.appendChild(el);
  }

  function renderSimilarityLookup(grid, archetypes, raw) {
    const c = card(grid, "Similar performers", "Cosine similarity over the archetype feature space");
    if (!archetypes.similarity || !Object.keys(archetypes.similarity).length) {
      emptyHint(c, "No similarity index — run Update Metrics Cache.");
      return;
    }

    // Build a searchable performer picker.
    const performers = (raw && raw.performers) || [];
    const byId = new Map(performers.map((p) => [p.id, p]));
    const wrap = document.createElement("div");
    wrap.className = "metrics-similarity";

    const search = document.createElement("input");
    search.type = "text";
    search.className = "metrics-form-input";
    search.placeholder = "Find a performer…";
    wrap.appendChild(search);

    const suggestions = document.createElement("div");
    suggestions.className = "metrics-similarity-suggest";
    wrap.appendChild(suggestions);

    const results = document.createElement("div");
    results.className = "metrics-similarity-results";
    wrap.appendChild(results);

    function selectPerformer(id) {
      results.innerHTML = "";
      const target = byId.get(id);
      if (!target) { results.textContent = "Not found."; return; }
      const head = document.createElement("div");
      head.className = "metrics-similarity-head";
      head.innerHTML = '<span></span>';
      head.firstChild.textContent = "Performers most similar to " + target.name + ":";
      results.appendChild(head);
      const ul = document.createElement("ul");
      ul.className = "metrics-list";
      const hits = archetypes.similarity[id] || [];
      if (!hits.length) {
        const li = document.createElement("li");
        li.textContent = "No close neighbours in the feature space.";
        ul.appendChild(li);
      }
      for (const h of hits) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "metrics-list-name";
        a.textContent = h.name;
        a.href = "/performers/" + encodeURIComponent(h.id);
        li.appendChild(a);
        const v = document.createElement("span");
        v.className = "metrics-list-val";
        v.textContent = "  sim " + h.score.toFixed(3) +
          (h.country ? " · " + h.country : "") +
          (h.cupLetter ? " · cup " + h.cupLetter : "");
        li.appendChild(v);
        ul.appendChild(li);
      }
      results.appendChild(ul);
    }

    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      suggestions.innerHTML = "";
      if (!q) return;
      const matched = performers
        .filter((p) => p.name && p.name.toLowerCase().includes(q))
        .slice(0, 8);
      for (const p of matched) {
        const opt = document.createElement("button");
        opt.className = "metrics-similarity-suggest-btn";
        opt.textContent = p.name + (p.country ? " · " + p.country : "");
        opt.addEventListener("click", () => {
          search.value = p.name;
          suggestions.innerHTML = "";
          selectPerformer(p.id);
        });
        suggestions.appendChild(opt);
      }
    });

    // Pre-load a sensible default — the largest favourite or top-rated.
    const initial = performers.find((p) => p.favorite) ||
      performers.slice().sort((a, b) => (b.rating100 || 0) - (a.rating100 || 0))[0];
    if (initial) {
      search.value = initial.name;
      selectPerformer(initial.id);
    }
    c.appendChild(wrap);
  }

  function render(host, payload) {
    host.innerHTML = "";
    const arch = payload && payload.archetypes;
    if (!arch || !arch.clusters || !arch.clusters.length) {
      emptyHint(host, "Archetypes aren't in this cache. Run Update Metrics Cache — or uncheck 'Disable Archetypes tab' in plugin settings.");
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
    kpis.appendChild(kpi("Clusters", arch.k, "k-means++ seed"));
    kpis.appendChild(kpi("Feature dims", arch.features, "numeric + one-hot + tags"));
    kpis.appendChild(kpi("Largest cluster", arch.clusters[0].size + " performers", arch.clusters[0].label || ""));
    kpis.appendChild(kpi("Smallest cluster", arch.clusters[arch.clusters.length - 1].size + " performers", arch.clusters[arch.clusters.length - 1].label || ""));

    const cluster = document.createElement("div");
    cluster.className = "metrics-card";
    cluster.innerHTML = '<div class="metrics-card-title">Performer archetypes</div><div class="metrics-card-sub">k-means clustering over normalised feature vectors</div>';
    const list = document.createElement("div");
    list.className = "metrics-cluster-list";
    cluster.appendChild(list);
    host.appendChild(cluster);
    for (const c of arch.clusters) renderCluster(list, c);

    const grid = document.createElement("div");
    grid.className = "metrics-grid";
    host.appendChild(grid);
    const raw = (payload && payload._raw) || (ns.dashboard && ns.dashboard.rawCache);
    renderSimilarityLookup(grid, arch, raw);
  }

  ns.charts = ns.charts || {};
  ns.charts.archetypes = { render };
})();
