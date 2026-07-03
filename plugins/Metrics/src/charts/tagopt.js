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

  function tagLink(t) {
    const a = document.createElement("a");
    a.className = "metrics-tag-pill";
    a.href = "/tags/" + encodeURIComponent(t.id);
    a.textContent = t.name;
    if (t.sceneCount != null) a.title = t.sceneCount + " scenes";
    return a;
  }

  function tagWithCount(t) {
    const wrap = document.createElement("span");
    wrap.className = "metrics-tagopt-tag";
    wrap.appendChild(tagLink(t));
    if (t.sceneCount != null) {
      const c = document.createElement("span");
      c.className = "metrics-tagopt-count";
      c.textContent = "×" + t.sceneCount;
      wrap.appendChild(c);
    }
    return wrap;
  }

  function editBtn(t) {
    const a = document.createElement("a");
    a.className = "metrics-tagopt-edit";
    a.href = "/tags/" + encodeURIComponent(t.id) + "?edit=true";
    a.textContent = "edit";
    a.title = "Open " + t.name + " in Stash's tag editor";
    return a;
  }

  function renderSummary(host, t) {
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
    const s = t.summary;
    const cs = t.cleanupScore;
    const grade = cs >= 90 ? "A" : cs >= 80 ? "A-" : cs >= 70 ? "B" : cs >= 60 ? "C" : cs >= 50 ? "D" : "F";
    const scoreKpi = kpi("Cleanup score", cs, "grade " + grade);
    scoreKpi.classList.add("metrics-tagopt-score");
    scoreKpi.classList.add(cs >= 80 ? "good" : cs >= 60 ? "mid" : "bad");
    kpis.appendChild(scoreKpi);
    kpis.appendChild(kpi("Total tags", fmt.int(s.totalTags), s.taggedScenes + " tagged scenes"));
    kpis.appendChild(kpi("Near-duplicate clusters", s.nearDuplicateClusters, "candidates to merge"));
    kpis.appendChild(kpi("Orphan tags", s.orphans, "0 scenes attached"));
    kpis.appendChild(kpi("Rare tags", s.rareTags, "< " + t.rareThreshold + " scenes"));
    kpis.appendChild(kpi("Merge pairs", s.mergeCandidatePairs, "Jaccard ≥ 0.95"));
    kpis.appendChild(kpi("Specialisation pairs", s.specialisationPairs, "A implies B"));
    kpis.appendChild(kpi("Under-tagged scenes", s.undertaggedScenes, "≤ " + t.underThreshold + " tags"));
    kpis.appendChild(kpi("Over-tagged scenes", s.overtaggedScenes, "≥ " + t.overThreshold + " tags"));
    kpis.appendChild(kpi("Case/format buckets", s.inconsistentBuckets, "same word, mixed casing"));
    kpis.appendChild(kpi("Hierarchy gaps", s.hierarchyIssues, "child scenes missing parent"));
  }

  function renderDuplicates(host, clusters) {
    const c = card(host, "Near-duplicate clusters",
      "Tags that look like typos of each other. Merge the smaller ones into the largest via Stash → Tags → Merge.");
    if (!clusters.length) { empty(c, "No near-duplicates — nice."); return; }
    const list = document.createElement("ul");
    list.className = "metrics-tagopt-clusters";
    for (const cl of clusters.slice(0, 40)) {
      const li = document.createElement("li");
      const kind = document.createElement("span");
      kind.className = "metrics-tagopt-kind";
      kind.textContent = cl.kind === "identical_normalised" ? "same-normalised"
        : cl.kind === "levenshtein_close" ? "typo-close" : "singular/plural";
      li.appendChild(kind);
      const chips = document.createElement("span");
      chips.className = "metrics-tagopt-chips";
      for (const t of cl.tags) chips.appendChild(tagWithCount(t));
      li.appendChild(chips);
      const suggested = cl.tags[0]; // largest
      const note = document.createElement("span");
      note.className = "metrics-tagopt-suggest";
      note.textContent = "→ suggest keeping " + suggested.name;
      li.appendChild(note);
      list.appendChild(li);
    }
    c.appendChild(list);
  }

  function renderOrphans(host, orphans) {
    const c = card(host, "Orphan tags — 0 scenes attached",
      "Safe to delete unless you're staging future taxonomy.");
    if (!orphans.length) { empty(c, "No orphans."); return; }
    const chips = document.createElement("div");
    chips.className = "metrics-tagopt-chips";
    for (const t of orphans.slice(0, 200)) {
      chips.appendChild(tagLink({ ...t, sceneCount: 0 }));
    }
    if (orphans.length > 200) {
      const more = document.createElement("div");
      more.className = "metrics-tagopt-more";
      more.textContent = "…and " + (orphans.length - 200) + " more.";
      c.appendChild(chips); c.appendChild(more);
    } else c.appendChild(chips);
  }

  function renderRare(host, rare, threshold) {
    const c = card(host, "Rare tags — < " + threshold + " scenes",
      "Frequently typos or one-offs. Merge into a broader tag or delete.");
    if (!rare.length) { empty(c, "No rare tags below threshold."); return; }
    const chips = document.createElement("div");
    chips.className = "metrics-tagopt-chips";
    for (const t of rare.slice(0, 150)) chips.appendChild(tagWithCount(t));
    c.appendChild(chips);
    if (rare.length > 150) {
      const more = document.createElement("div");
      more.className = "metrics-tagopt-more";
      more.textContent = "…and " + (rare.length - 150) + " more.";
      c.appendChild(more);
    }
  }

  function pairRow(li, pair, note) {
    li.innerHTML =
      '<span class="metrics-tagopt-pair"></span>' +
      '<span class="metrics-tagopt-metrics"></span>' +
      '<span class="metrics-tagopt-suggest"></span>';
    const pairEl = li.querySelector(".metrics-tagopt-pair");
    pairEl.appendChild(tagWithCount(pair.a));
    pairEl.appendChild(document.createTextNode(" × "));
    pairEl.appendChild(tagWithCount(pair.b));
    li.querySelector(".metrics-tagopt-metrics").textContent =
      "J=" + pair.jaccard + " · A→B " + Math.round(pair.impliesAtoB * 100) + "% · B→A " + Math.round(pair.impliesBtoA * 100) + "% · shared " + pair.intersection;
    li.querySelector(".metrics-tagopt-suggest").textContent = note;
    return li;
  }

  function renderMerges(host, merges) {
    const c = card(host, "Always-together pairs (merge candidates)",
      "Jaccard ≥ 0.95 — two tags that basically travel together. Pick one and merge.");
    if (!merges.length) { empty(c, "No merge candidates."); return; }
    const ul = document.createElement("ul");
    ul.className = "metrics-tagopt-pairs";
    for (const m of merges) {
      const li = document.createElement("li");
      // Suggest keeping the larger of the two.
      const keep = m.a.sceneCount >= m.b.sceneCount ? m.a : m.b;
      ul.appendChild(pairRow(li, m, "→ suggest merging into " + keep.name));
    }
    c.appendChild(ul);
  }

  function renderSpecialisations(host, specs) {
    const c = card(host, "Specialisation pairs",
      "Tag A implies tag B nearly 100% (but not the reverse). Consider making B a parent of A, or dropping B if A already carries the meaning.");
    if (!specs.length) { empty(c, "No strict specialisation pairs."); return; }
    const ul = document.createElement("ul");
    ul.className = "metrics-tagopt-pairs";
    for (const s of specs) {
      const li = document.createElement("li");
      const note = s.specific.name + " ⊂ " + s.general.name + "  · make " + s.general.name + " a parent of " + s.specific.name;
      ul.appendChild(pairRow(li, s, note));
    }
    c.appendChild(ul);
  }

  function renderScenesTable(c, rows, colTitle) {
    if (!rows.length) { empty(c, "None."); return; }
    const table = document.createElement("table");
    table.className = "metrics-table";
    table.innerHTML = "<thead><tr><th>Scene</th><th>Studio</th><th>" + colTitle + "</th><th></th></tr></thead>";
    const tbody = document.createElement("tbody");
    for (const r of rows) {
      const tr = document.createElement("tr");
      const titleTd = document.createElement("td");
      const a = document.createElement("a");
      a.href = "/scenes/" + encodeURIComponent(r.id);
      a.textContent = r.title;
      titleTd.appendChild(a);
      const studioTd = document.createElement("td");
      studioTd.textContent = r.studio || "—";
      const countTd = document.createElement("td");
      countTd.textContent = r.tagCount;
      const editTd = document.createElement("td");
      const editA = document.createElement("a");
      editA.href = "/scenes/" + encodeURIComponent(r.id) + "?edit=true";
      editA.textContent = "edit";
      editA.className = "metrics-tagopt-edit";
      editTd.appendChild(editA);
      tr.appendChild(titleTd); tr.appendChild(studioTd);
      tr.appendChild(countTd); tr.appendChild(editTd);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    c.appendChild(table);
  }

  function renderUnderOver(host, t) {
    const cU = card(host, "Under-tagged scenes (≤ " + t.underThreshold + " tags)",
      "Prime candidates for the auto-tagger or manual tagging pass.");
    renderScenesTable(cU, t.undertagged, "tags");
    const cO = card(host, "Over-tagged scenes (≥ " + t.overThreshold + " tags)",
      "Usually auto-tagger noise. Consider trimming.");
    renderScenesTable(cO, t.overtagged, "tags");
  }

  function renderInconsistency(host, list) {
    const c = card(host, "Naming inconsistency",
      "Same word, different casing/punctuation/separator variants. Pick a canonical form.");
    if (!list.length) { empty(c, "No case/format inconsistencies."); return; }
    const ul = document.createElement("ul");
    ul.className = "metrics-tagopt-clusters";
    for (const f of list.slice(0, 40)) {
      const li = document.createElement("li");
      const kind = document.createElement("span");
      kind.className = "metrics-tagopt-kind";
      kind.textContent = "same-normalised";
      li.appendChild(kind);
      const chips = document.createElement("span");
      chips.className = "metrics-tagopt-chips";
      for (const form of f.forms) chips.appendChild(tagWithCount(form));
      li.appendChild(chips);
      ul.appendChild(li);
    }
    c.appendChild(ul);
  }

  function renderHierarchy(host, list) {
    const c = card(host, "Hierarchy gaps",
      "Children whose scenes don't all carry the parent tag. Enable parent-tag auto-propagation in Stash or add the parent manually.");
    if (!list.length) { empty(c, "No hierarchy issues."); return; }
    const ul = document.createElement("ul");
    ul.className = "metrics-tagopt-hierarchy";
    for (const f of list) {
      const li = document.createElement("li");
      const kind = document.createElement("span");
      kind.className = "metrics-tagopt-kind";
      kind.textContent = f.kind === "empty_child" ? "empty child" : "child ⊄ parent";
      li.appendChild(kind);
      const label = document.createElement("span");
      label.className = "metrics-tagopt-chips";
      const parent = document.createElement("a");
      parent.href = "/tags/" + encodeURIComponent(f.parent.id);
      parent.className = "metrics-tag-pill";
      parent.textContent = f.parent.name + " (parent)";
      label.appendChild(parent);
      const child = document.createElement("a");
      child.href = "/tags/" + encodeURIComponent(f.child.id);
      child.className = "metrics-tag-pill";
      child.textContent = f.child.name + " (child)";
      label.appendChild(child);
      li.appendChild(label);
      if (f.kind === "child_missing_parent") {
        const note = document.createElement("span");
        note.className = "metrics-tagopt-suggest";
        note.textContent = f.childWithoutParent + " of " + f.childScenes + " child scenes (" +
          Math.round(f.share * 100) + "%) are missing the parent";
        li.appendChild(note);
      }
      ul.appendChild(li);
    }
    c.appendChild(ul);
  }

  function render(host, payload, opts) {
    host.innerHTML = "";
    const t = payload && payload.tagopt;
    if (!t) {
      empty(host, "Tag optimizer disabled or not in cache. Run Update Metrics Cache with enableTagOptimizer=true.");
      return;
    }
    renderSummary(host, t);

    const grid = document.createElement("div");
    grid.className = "metrics-grid metrics-tagopt-grid";
    host.appendChild(grid);
    renderDuplicates(grid, t.nearDuplicates);
    renderInconsistency(grid, t.namingInconsistency);
    renderMerges(grid, t.merges);
    renderSpecialisations(grid, t.specialisations);
    renderOrphans(grid, t.orphans);
    renderRare(grid, t.rare, t.rareThreshold);
    renderUnderOver(grid, t);
    renderHierarchy(grid, t.hierarchyIssues);
  }

  ns.charts = ns.charts || {};
  ns.charts.tagopt = { render };
})();
