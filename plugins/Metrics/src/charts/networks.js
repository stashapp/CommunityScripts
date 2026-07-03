(function () {
  "use strict";
  const ns = (window.StashMetrics = window.StashMetrics || {});
  const fmt = ns.format;

  // Label-propagation community detection. Tight-knit groups of performers
  // end up with the same community id, which we colour identically to make
  // the graph read as clusters instead of a hairball.
  function detectCommunities(nodes, edges) {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const adj = new Map(nodes.map((n) => [n.id, []]));
    for (const e of edges) {
      if (byId.has(e.a) && byId.has(e.b)) {
        adj.get(e.a).push({ id: e.b, w: e.weight });
        adj.get(e.b).push({ id: e.a, w: e.weight });
      }
    }
    // Every node starts as its own community.
    const label = new Map(nodes.map((n, i) => [n.id, i]));
    // 20 passes of label propagation. Each node adopts the label with the
    // highest sum of edge weights among its neighbours.
    for (let pass = 0; pass < 20; pass++) {
      let changed = 0;
      // Shuffle traversal order for stability.
      const order = nodes.map((n) => n.id).sort(() => 0.5 - ((pass * 31 + Math.sin(pass * 7)) % 1));
      for (const id of order) {
        const votes = new Map();
        for (const nbr of adj.get(id)) {
          const lab = label.get(nbr.id);
          votes.set(lab, (votes.get(lab) || 0) + nbr.w);
        }
        if (!votes.size) continue;
        let best = label.get(id), bestW = -1;
        for (const [lab, w] of votes) if (w > bestW) { bestW = w; best = lab; }
        if (best !== label.get(id)) { label.set(id, best); changed++; }
      }
      if (!changed) break;
    }
    // Compress labels to a compact [0..K-1] range.
    const remap = new Map();
    for (const id of nodes.map((n) => n.id)) {
      const l = label.get(id);
      if (!remap.has(l)) remap.set(l, remap.size);
      label.set(id, remap.get(l));
    }
    return { label, numCommunities: remap.size };
  }

  // Force-directed layout with community-aware initial placement.
  // Nodes in the same community get placed near each other before the
  // simulation runs — dramatically reduces settling time and produces
  // visually distinct clusters.
  function layoutForce(nodes, edges, opts) {
    const o = opts || {};
    const width = o.width || 720;
    const height = o.height || 480;
    const iter = o.iterations || 300;
    const communities = o.communities || { label: new Map(), numCommunities: 1 };

    const N = nodes.length;
    // Community-clustered initial layout: each community gets a wedge of
    // the circle; nodes are placed randomly within their wedge.
    const K = Math.max(1, communities.numCommunities);
    for (let i = 0; i < N; i++) {
      const n = nodes[i];
      const c = communities.label.get(n.id) || 0;
      const wedge = (2 * Math.PI) / K;
      const theta = c * wedge + (Math.random() * 0.8 + 0.1) * wedge;
      const r = Math.min(width, height) * (0.2 + 0.15 * Math.random());
      n.x = width / 2 + Math.cos(theta) * r;
      n.y = height / 2 + Math.sin(theta) * r;
      n.vx = 0; n.vy = 0;
    }
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const links = edges.map((e) => ({
      source: byId.get(e.a), target: byId.get(e.b), weight: e.weight,
    })).filter((l) => l.source && l.target);

    const k = 55;
    for (let step = 0; step < iter; step++) {
      // Repulsion between every pair (Coulomb-like). Same-community pairs
      // get a slightly weaker repulsion so clusters stay tight.
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) d2 = 1;
          const sameCommunity = communities.label.get(a.id) === communities.label.get(b.id);
          const strength = sameCommunity ? 0.55 : 1.0;
          const f = strength * (k * k) / d2;
          const d = Math.sqrt(d2);
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          a.vx += fx; a.vy += fy;
          b.vx -= fx; b.vy -= fy;
        }
      }
      // Attraction along edges (Hooke-like spring). Log-scaled weight.
      for (const l of links) {
        const dx = l.source.x - l.target.x;
        const dy = l.source.y - l.target.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const springLen = 45;
        const f = (d - springLen) * 0.05 * Math.min(2, Math.log(1 + l.weight));
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        l.source.vx -= fx; l.source.vy -= fy;
        l.target.vx += fx; l.target.vy += fy;
      }
      // Weak centering — keeps disconnected components on-screen.
      for (const n of nodes) {
        n.vx += (width / 2 - n.x) * 0.002;
        n.vy += (height / 2 - n.y) * 0.002;
      }
      // Integrate with cooling.
      const cooling = 0.9 * (1 - step / iter) + 0.1;
      for (const n of nodes) {
        n.x += n.vx * cooling * 0.3;
        n.y += n.vy * cooling * 0.3;
        n.x = Math.max(30, Math.min(width - 30, n.x));
        n.y = Math.max(30, Math.min(height - 30, n.y));
        n.vx *= 0.72; n.vy *= 0.72;
      }
    }
    return { nodes, links, width, height };
  }

  // A vivid categorical palette for community colouring. Chosen for
  // legibility against the dark background.
  const COMMUNITY_COLOURS = [
    "#4f8ef7", "#3ecf8e", "#f7c948", "#f76e6e", "#c98ef7",
    "#f7a26e", "#6ec3f7", "#f76ec3", "#9ee06e", "#6e7df7",
    "#f7e26e", "#6ef7d7", "#f76ea0", "#a8f76e",
  ];

  function emptyHint(host, text) {
    const e = document.createElement("div");
    e.className = "metrics-empty";
    e.textContent = text;
    host.appendChild(e);
  }

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

  // v1.6 — Two-performer compatibility widget. Score composed of:
  //   40%  tag overlap (Jaccard across the performers' scene-tag bags)
  //   30%  studio overlap (Jaccard)
  //   20%  attribute similarity (country/ethnicity/eye/hair matches)
  //   10%  cup/height closeness
  function renderCompatibility(host, raw) {
    const perfs = raw.performers.slice().sort((a, b) => (b.scene_count || 0) - (a.scene_count || 0));
    const wrap = document.createElement("div");
    wrap.className = "metrics-compat";

    const picker = document.createElement("div");
    picker.className = "metrics-compat-picker";

    function makeSelect(defaultId) {
      const sel = document.createElement("select");
      const blank = document.createElement("option");
      blank.value = ""; blank.textContent = "—";
      sel.appendChild(blank);
      for (const p of perfs.slice(0, 400)) {
        const o = document.createElement("option");
        o.value = p.id;
        o.textContent = p.name + (p.scene_count ? " (" + p.scene_count + ")" : "");
        sel.appendChild(o);
      }
      if (defaultId) sel.value = defaultId;
      return sel;
    }
    const s1 = makeSelect(perfs[0] && perfs[0].id);
    const s2 = makeSelect(perfs[1] && perfs[1].id);
    picker.appendChild(s1);
    picker.appendChild(document.createTextNode(" × "));
    picker.appendChild(s2);
    wrap.appendChild(picker);

    const result = document.createElement("div");
    result.className = "metrics-compat-result";
    wrap.appendChild(result);
    host.appendChild(wrap);

    // Pre-index each performer's tag bag and studio bag from raw.scenes.
    const tagsByPerf = new Map();
    const studiosByPerf = new Map();
    for (const s of raw.scenes || []) {
      const studio = s.studio ? s.studio.name : null;
      for (const p of s.performers || []) {
        if (!tagsByPerf.has(p.id)) tagsByPerf.set(p.id, new Set());
        if (!studiosByPerf.has(p.id)) studiosByPerf.set(p.id, new Set());
        for (const t of s.tags || []) tagsByPerf.get(p.id).add(t.name);
        if (studio) studiosByPerf.get(p.id).add(studio);
      }
    }
    const byId = new Map(perfs.map((p) => [p.id, p]));

    function jaccard(a, b) {
      if (!a || !b || (!a.size && !b.size)) return 0;
      let inter = 0;
      const small = a.size < b.size ? a : b;
      const big = small === a ? b : a;
      for (const x of small) if (big.has(x)) inter++;
      const union = a.size + b.size - inter || 1;
      return inter / union;
    }
    function attrScore(pa, pb) {
      let matches = 0, total = 0;
      const keys = ["country", "ethnicity", "eye_color", "hair_color"];
      for (const k of keys) {
        if (pa[k] && pb[k]) {
          total++;
          if (String(pa[k]).toLowerCase() === String(pb[k]).toLowerCase()) matches++;
        }
      }
      return total ? matches / total : 0;
    }
    function cupHeight(pa, pb) {
      // Cup similarity 1 - |ord(a) - ord(b)| / 8, height 1 - |ha - hb| / 30 cm.
      function cupOrd(m) {
        const s = String(m || "").replace(/\s+/g, "").match(/^\d+([a-zA-Z]+)/);
        return s ? Math.max(0, s[1].toUpperCase().charCodeAt(0) - 64) : null;
      }
      const ca = cupOrd(pa.measurements), cb = cupOrd(pb.measurements);
      const ha = pa.height_cm, hb = pb.height_cm;
      let comps = 0, s = 0;
      if (ca != null && cb != null) { s += Math.max(0, 1 - Math.abs(ca - cb) / 8); comps++; }
      if (ha != null && hb != null) { s += Math.max(0, 1 - Math.abs(ha - hb) / 30); comps++; }
      return comps ? s / comps : 0;
    }

    function scoreClass(x) {
      if (x >= 70) return "";
      if (x >= 40) return "mid";
      return "low";
    }

    function compute() {
      const a = byId.get(s1.value);
      const b = byId.get(s2.value);
      if (!a || !b || a.id === b.id) {
        result.innerHTML = '<div class="metrics-empty">Pick two different performers.</div>';
        return;
      }
      const tagOverlap = jaccard(tagsByPerf.get(a.id) || new Set(), tagsByPerf.get(b.id) || new Set());
      const studioOverlap = jaccard(studiosByPerf.get(a.id) || new Set(), studiosByPerf.get(b.id) || new Set());
      const attr = attrScore(a, b);
      const body = cupHeight(a, b);
      const score = Math.round(100 * (0.4 * tagOverlap + 0.3 * studioOverlap + 0.2 * attr + 0.1 * body));
      const cls = scoreClass(score);
      const scoreEl = document.createElement("div");
      scoreEl.className = "metrics-compat-score" + (cls ? " " + cls : "");
      scoreEl.textContent = score;
      const breakdown = document.createElement("div");
      breakdown.className = "metrics-compat-breakdown";
      breakdown.innerHTML =
        '<div><b></b> <span class="muted">×</span> <b></b></div>' +
        '<div>Tag overlap <span class="muted">' + Math.round(tagOverlap * 100) + '%</span></div>' +
        '<div>Studio overlap <span class="muted">' + Math.round(studioOverlap * 100) + '%</span></div>' +
        '<div>Attribute similarity <span class="muted">' + Math.round(attr * 100) + '%</span></div>' +
        '<div>Body-type closeness <span class="muted">' + Math.round(body * 100) + '%</span></div>';
      const names = breakdown.querySelectorAll("b");
      names[0].textContent = a.name;
      names[1].textContent = b.name;
      result.innerHTML = "";
      result.appendChild(scoreEl);
      result.appendChild(breakdown);
    }
    s1.addEventListener("change", compute);
    s2.addEventListener("change", compute);
    compute();
  }

  function renderGraph(host, nodes, edges) {
    if (!nodes.length) {
      emptyHint(host, "Not enough collaborations to graph.");
      return;
    }

    // Detect communities BEFORE layout so the initial placement can use
    // them.
    const communities = detectCommunities(nodes, edges);
    for (const n of nodes) n.community = communities.label.get(n.id) || 0;

    // Adjacency table used later for hover-to-focus (dim non-neighbours).
    const adjacency = new Map(nodes.map((n) => [n.id, new Set([n.id])]));
    for (const e of edges) {
      if (adjacency.has(e.a) && adjacency.has(e.b)) {
        adjacency.get(e.a).add(e.b);
        adjacency.get(e.b).add(e.a);
      }
    }

    const laid = layoutForce(nodes, edges, {
      width: 960, height: 640, iterations: 400, communities,
    });

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 " + laid.width + " " + laid.height);
    svg.setAttribute("class", "metrics-network-svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    // SVG defs for a subtle glow filter used on hover.
    const defs = document.createElementNS(svgNS, "defs");
    defs.innerHTML =
      '<filter id="metrics-network-glow" x="-50%" y="-50%" width="200%" height="200%">' +
      '<feGaussianBlur stdDeviation="3" result="blur"/>' +
      '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>' +
      '</filter>';
    svg.appendChild(defs);

    // Draw edges as gentle quadratic curves. Straight lines make the
    // graph look like a wire mesh; curves keep multi-edges from overlapping
    // and give the graph an organic feel. Control point offset perpendicular
    // to the line by ~15% of its length.
    const maxW = laid.links.reduce((m, l) => Math.max(m, l.weight), 1);
    const edgeGroup = document.createElementNS(svgNS, "g");
    edgeGroup.setAttribute("class", "metrics-network-edges");
    const edgeElByPair = new Map();
    // Draw weaker edges first so strong ones paint on top.
    const sortedLinks = laid.links.slice().sort((a, b) => a.weight - b.weight);
    for (const l of sortedLinks) {
      const dx = l.target.x - l.source.x;
      const dy = l.target.y - l.source.y;
      const mx = (l.source.x + l.target.x) / 2;
      const my = (l.source.y + l.target.y) / 2;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      // Perpendicular offset for the control point.
      const nx = -dy / dist;
      const ny = dx / dist;
      const bend = dist * 0.14;
      const cx = mx + nx * bend;
      const cy = my + ny * bend;

      const strength = l.weight / maxW;
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d",
        "M" + l.source.x.toFixed(1) + "," + l.source.y.toFixed(1) +
        " Q" + cx.toFixed(1) + "," + cy.toFixed(1) + " " +
        l.target.x.toFixed(1) + "," + l.target.y.toFixed(1)
      );
      // Blend blue → cyan → green as edge strength climbs.
      let r, g, b;
      if (strength < 0.5) {
        const t = strength / 0.5;
        r = Math.round(79 + (48 - 79) * t);
        g = Math.round(142 + (200 - 142) * t);
        b = Math.round(247 + (220 - 247) * t);
      } else {
        const t = (strength - 0.5) / 0.5;
        r = Math.round(48 + (62 - 48) * t);
        g = Math.round(200 + (207 - 200) * t);
        b = Math.round(220 + (142 - 220) * t);
      }
      path.setAttribute("stroke", "rgb(" + r + "," + g + "," + b + ")");
      path.setAttribute("stroke-opacity", (0.28 + 0.55 * strength).toFixed(2));
      path.setAttribute("stroke-width", (0.7 + 3.5 * strength).toFixed(2));
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("class", "metrics-network-edge");
      path.dataset.a = l.source.id;
      path.dataset.b = l.target.id;
      edgeGroup.appendChild(path);
      edgeElByPair.set(l.source.id + "|" + l.target.id, path);
      edgeElByPair.set(l.target.id + "|" + l.source.id, path);
    }
    svg.appendChild(edgeGroup);

    // Nodes
    const maxDeg = nodes.reduce((m, n) => Math.max(m, n.degree || 1), 1);
    const labelThreshold = nodes.slice().sort((a, b) => (b.degree || 0) - (a.degree || 0))[Math.min(nodes.length - 1, 20)];
    const labelCutoff = labelThreshold ? labelThreshold.degree : 0;

    const nodeGroup = document.createElementNS(svgNS, "g");
    nodeGroup.setAttribute("class", "metrics-network-nodes");
    const nodeElById = new Map();
    for (const n of laid.nodes) {
      const gEl = document.createElementNS(svgNS, "g");
      gEl.setAttribute("class", "metrics-network-node");
      gEl.dataset.id = n.id;

      const a = document.createElementNS(svgNS, "a");
      a.setAttributeNS("http://www.w3.org/1999/xlink", "href", "/performers/" + encodeURIComponent(n.id));
      a.setAttribute("href", "/performers/" + encodeURIComponent(n.id));

      const radius = 7 + 22 * Math.sqrt((n.degree || 1) / maxDeg);
      const fill = COMMUNITY_COLOURS[(n.community || 0) % COMMUNITY_COLOURS.length];

      // Halo behind the main circle for depth.
      const halo = document.createElementNS(svgNS, "circle");
      halo.setAttribute("cx", n.x);
      halo.setAttribute("cy", n.y);
      halo.setAttribute("r", radius + 4);
      halo.setAttribute("fill", fill);
      halo.setAttribute("fill-opacity", "0.12");
      halo.setAttribute("class", "metrics-network-halo");
      a.appendChild(halo);

      const c = document.createElementNS(svgNS, "circle");
      c.setAttribute("cx", n.x);
      c.setAttribute("cy", n.y);
      c.setAttribute("r", radius);
      c.setAttribute("fill", fill);
      c.setAttribute("stroke", "#0b0e12");
      c.setAttribute("stroke-width", "2");
      c.setAttribute("class", "metrics-network-circle");
      a.appendChild(c);

      // Label with underlay shadow, only for high-degree nodes.
      if ((n.degree || 0) >= labelCutoff) {
        const shadow = document.createElementNS(svgNS, "text");
        shadow.setAttribute("x", n.x);
        shadow.setAttribute("y", n.y - radius - 8);
        shadow.setAttribute("text-anchor", "middle");
        shadow.setAttribute("fill", "none");
        shadow.setAttribute("stroke", "#0b0e12");
        shadow.setAttribute("stroke-width", "4");
        shadow.setAttribute("stroke-linejoin", "round");
        shadow.setAttribute("font-size", "11");
        shadow.setAttribute("font-weight", "700");
        shadow.setAttribute("pointer-events", "none");
        shadow.textContent = n.label;
        gEl.appendChild(shadow);
        const t = document.createElementNS(svgNS, "text");
        t.setAttribute("x", n.x);
        t.setAttribute("y", n.y - radius - 8);
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("fill", "#f0f4f8");
        t.setAttribute("font-size", "11");
        t.setAttribute("font-weight", "700");
        t.setAttribute("pointer-events", "none");
        t.textContent = n.label;
        gEl.appendChild(t);
      }

      const title = document.createElementNS(svgNS, "title");
      title.textContent = n.label + " — " + (n.sceneCount || 0) + " scenes · " + (n.degree || 0) + " collaborators (click to open)";
      a.appendChild(title);
      gEl.appendChild(a);
      nodeGroup.appendChild(gEl);
      nodeElById.set(n.id, gEl);
    }
    svg.appendChild(nodeGroup);
    host.appendChild(svg);

    // Hover-to-focus: dim non-neighbours, brighten the hovered node's
    // neighbourhood.
    function setFocus(nodeId) {
      if (nodeId == null) {
        svg.classList.remove("metrics-network-focused");
        nodeElById.forEach((el) => el.classList.remove("adjacent", "focused"));
        edgeGroup.querySelectorAll(".metrics-network-edge").forEach((p) => p.classList.remove("adjacent"));
        return;
      }
      svg.classList.add("metrics-network-focused");
      const neighbours = adjacency.get(nodeId) || new Set([nodeId]);
      nodeElById.forEach((el, id) => {
        el.classList.toggle("adjacent", neighbours.has(id));
        el.classList.toggle("focused", id === nodeId);
      });
      edgeGroup.querySelectorAll(".metrics-network-edge").forEach((p) => {
        const a = p.dataset.a, b = p.dataset.b;
        p.classList.toggle("adjacent", a === nodeId || b === nodeId);
      });
    }
    nodeElById.forEach((el, id) => {
      el.addEventListener("mouseenter", () => setFocus(id));
      el.addEventListener("mouseleave", () => setFocus(null));
    });

    // Legend + interactivity hint.
    const legend = document.createElement("div");
    legend.className = "metrics-network-legend";
    legend.innerHTML =
      '<span><span class="dot" style="background:#4f8ef7"></span> weak link</span>' +
      '<span><span class="dot" style="background:#3ecf8e"></span> strong link</span>' +
      '<span>· ' + communities.numCommunities + ' communities detected (colour-grouped)</span>' +
      '<span>· node size = collaborator count</span>' +
      '<span>· hover a node to isolate its neighbours · click to open in Stash</span>';
    host.appendChild(legend);
  }

  function render(host, payload, opts) {
    host.innerHTML = "";
    const enabled = !opts || !opts.disableNetworkGraph;
    if (!enabled) {
      const note = document.createElement("div");
      note.className = "metrics-empty";
      note.textContent = "Network graph disabled in plugin settings.";
      host.appendChild(note);
      return;
    }
    const grid = document.createElement("div");
    grid.className = "metrics-grid";
    host.appendChild(grid);

    let c = card(grid, "Performer collaboration network");
    renderGraph(c, payload.performerNetworkNodes || [], payload.performerNetworkEdges || []);

    // v1.6 — Compatibility score widget.
    const raw = (payload && payload._raw) || (ns.dashboard && ns.dashboard.rawCache);
    if (raw && raw.performers && raw.performers.length >= 2) {
      c = card(grid, "Compatibility score — pick two performers",
        "0–100 blend of shared studios, tag overlap, and attribute similarity");
      renderCompatibility(c, raw);
    }

    c = card(grid, "Top performer pairs");
    const ul = document.createElement("ol");
    ul.className = "metrics-list";
    for (const p of (payload.topPerformerPairs || []).slice(0, 25)) {
      const li = document.createElement("li");
      li.innerHTML =
        '<span class="metrics-list-name"></span> + ' +
        '<span class="metrics-list-name"></span> ' +
        '<span class="metrics-list-val"></span>';
      const names = li.querySelectorAll(".metrics-list-name");
      names[0].textContent = p.a;
      names[1].textContent = p.b;
      li.querySelector(".metrics-list-val").textContent = p.weight + " shared scenes";
      ul.appendChild(li);
    }
    c.appendChild(ul);

    c = card(grid, "Studio × tag heatmap (top studios × top tags)",
      "cell = number of scenes at that studio carrying that tag");
    if (payload.studioTagHeatmap && payload.studioTagHeatmap.studios &&
        payload.studioTagHeatmap.studios.length && payload.studioTagHeatmap.tags &&
        payload.studioTagHeatmap.tags.length) {
      const m = payload.studioTagHeatmap;
      const total = m.matrix.reduce((sum, row) => sum + row.reduce((s, v) => s + v, 0), 0);
      if (total === 0) {
        emptyHint(c, "No overlap between the top studios and top tags in the current filter.");
      } else {
      const wrap = document.createElement("div");
      wrap.className = "metrics-heatmap";
      const gridEl = document.createElement("div");
      gridEl.className = "metrics-heatmap-grid";
      gridEl.style.gridTemplateColumns = "160px repeat(" + m.tags.length + ", 1fr)";
      const corner = document.createElement("div");
      corner.className = "metrics-heatmap-corner";
      corner.textContent = "Studio \\ Tag";
      gridEl.appendChild(corner);
      for (const t of m.tags) {
        const h = document.createElement("div");
        h.className = "metrics-heatmap-col-head";
        h.textContent = t;
        h.title = t;
        gridEl.appendChild(h);
      }
      const max = m.matrix.reduce((mm, row) => row.reduce((mx, v) => Math.max(mx, v), mm), 0) || 1;
      for (let r = 0; r < m.studios.length; r++) {
        const rh = document.createElement("div");
        rh.className = "metrics-heatmap-row-head";
        rh.textContent = m.studios[r];
        rh.title = m.studios[r];
        gridEl.appendChild(rh);
        for (let cc = 0; cc < m.tags.length; cc++) {
          const v = m.matrix[r][cc] || 0;
          const cell = document.createElement("div");
          cell.className = "metrics-heatmap-cell";
          cell.style.background = "rgba(62, 207, 142, " + (v / max * 0.9 + 0.05).toFixed(3) + ")";
          cell.textContent = v ? v : "";
          cell.title = m.studios[r] + " × " + m.tags[cc] + " — " + v;
          gridEl.appendChild(cell);
        }
      }
      wrap.appendChild(gridEl);
      c.appendChild(wrap);
      }  // close total>0 branch
    } else {
      emptyHint(c, "Studio × tag heatmap not in cache. Run Update Metrics Cache.");
    }
  }

  ns.charts = ns.charts || {};
  ns.charts.networks = { render };
})();
