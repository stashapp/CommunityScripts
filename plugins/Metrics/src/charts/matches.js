(function () {
  "use strict";

  const ns = (window.StashMetrics = window.StashMetrics || {});
  const fmt = ns.format;
  const prefs = ns.preferences;
  const rec = ns.recommender;

  // The Matches tab keeps a small per-tab state separate from the global
  // dashboard so re-renders are cheap. Re-scoring runs live in the browser
  // (no GraphQL roundtrip).
  function row(label, control) {
    const r = document.createElement("div");
    r.className = "metrics-form-row";
    const l = document.createElement("label");
    l.className = "metrics-form-label";
    l.textContent = label;
    r.appendChild(l);
    r.appendChild(control);
    return r;
  }

  function csvInput(value, placeholder) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "metrics-form-input";
    input.placeholder = placeholder || "";
    input.value = (value || []).join(", ");
    input.dataset.kind = "csv";
    return input;
  }

  function numInput(value, placeholder) {
    const input = document.createElement("input");
    input.type = "number";
    input.className = "metrics-form-input metrics-form-num";
    input.placeholder = placeholder || "";
    if (value != null) input.value = value;
    input.dataset.kind = "num";
    return input;
  }

  function rangeWeight(value, key) {
    const wrap = document.createElement("div");
    wrap.className = "metrics-weight-row";
    const range = document.createElement("input");
    range.type = "range"; range.min = "0"; range.max = "2"; range.step = "0.1";
    range.value = String(value);
    range.dataset.weight = key;
    const num = document.createElement("span");
    num.className = "metrics-weight-value";
    num.textContent = (+value).toFixed(1);
    range.addEventListener("input", () => { num.textContent = (+range.value).toFixed(1); });
    wrap.appendChild(range);
    wrap.appendChild(num);
    return wrap;
  }

  function buildForm(profile, onChange) {
    const root = document.createElement("div");
    root.className = "metrics-form";

    const cols = document.createElement("div");
    cols.className = "metrics-form-cols";
    root.appendChild(cols);

    const colLeft = document.createElement("div");
    colLeft.className = "metrics-form-col";
    cols.appendChild(colLeft);
    const colRight = document.createElement("div");
    colRight.className = "metrics-form-col";
    cols.appendChild(colRight);

    const inputs = {};
    function add(col, label, key, control) {
      inputs[key] = control;
      col.appendChild(row(label, control));
    }

    add(colLeft, "Countries (comma separated, ISO-2)", "countries", csvInput(profile.countries, "US, CZ, BR"));
    add(colLeft, "Ethnicities", "ethnicities", csvInput(profile.ethnicities, "Caucasian, Latin"));
    add(colLeft, "Eye colors", "eyeColors", csvInput(profile.eyeColors, "Blue, Green"));
    add(colLeft, "Hair colors", "hairColors", csvInput(profile.hairColors, "Blonde, Brunette"));
    add(colLeft, "Cup sizes (A,B,C…)", "cupSizes", csvInput(profile.cupSizes, "C, D, E"));
    add(colLeft, "Required tags", "requiredTags", csvInput(profile.requiredTags, "Outdoor, POV"));
    add(colLeft, "Excluded tags", "excludedTags", csvInput(profile.excludedTags, "Solo"));

    const heightRow = document.createElement("div");
    heightRow.className = "metrics-form-row";
    heightRow.innerHTML = '<label class="metrics-form-label">Height (cm)</label>';
    const minH = numInput(profile.minHeightCm, "min");
    const maxH = numInput(profile.maxHeightCm, "max");
    heightRow.appendChild(minH); heightRow.appendChild(maxH);
    inputs.minHeightCm = minH; inputs.maxHeightCm = maxH;
    colRight.appendChild(heightRow);

    const ageRow = document.createElement("div");
    ageRow.className = "metrics-form-row";
    ageRow.innerHTML = '<label class="metrics-form-label">Age</label>';
    const minA = numInput(profile.minAge, "min");
    const maxA = numInput(profile.maxAge, "max");
    ageRow.appendChild(minA); ageRow.appendChild(maxA);
    inputs.minAge = minA; inputs.maxAge = maxA;
    colRight.appendChild(ageRow);

    add(colRight, "Min O-count (per scene)", "minOCount", numInput(profile.minOCount, "0"));
    add(colRight, "Top matches", "topMatches", numInput(profile.topMatches || 25, "25"));

    const wHeader = document.createElement("div");
    wHeader.className = "metrics-form-section";
    wHeader.textContent = "Attribute weights";
    colRight.appendChild(wHeader);
    const weightKeys = ["country", "ethnicity", "eyeColor", "hairColor", "cup", "height", "age", "oCount", "tagOverlap", "rating"];
    for (const k of weightKeys) {
      colRight.appendChild(row(weightLabel(k), rangeWeight(profile.weights[k] != null ? profile.weights[k] : 1, k)));
    }

    const actions = document.createElement("div");
    actions.className = "metrics-form-actions";
    const apply = btn("Apply & rank", "primary");
    const reset = btn("Reset to defaults", "secondary");
    const save = btn("Save profile", "secondary");
    const importBtn = btn("Import JSON…", "secondary");
    const exportBtn = btn("Export JSON", "secondary");
    actions.appendChild(apply);
    actions.appendChild(save);
    actions.appendChild(reset);
    actions.appendChild(importBtn);
    actions.appendChild(exportBtn);
    root.appendChild(actions);

    function readProfile() {
      const out = {
        countries: parseCsv(inputs.countries.value),
        ethnicities: parseCsv(inputs.ethnicities.value),
        eyeColors: parseCsv(inputs.eyeColors.value),
        hairColors: parseCsv(inputs.hairColors.value),
        cupSizes: parseCsv(inputs.cupSizes.value).map((s) => s.toUpperCase().slice(0, 1)),
        requiredTags: parseCsv(inputs.requiredTags.value),
        excludedTags: parseCsv(inputs.excludedTags.value),
        minHeightCm: numOrNull(inputs.minHeightCm.value),
        maxHeightCm: numOrNull(inputs.maxHeightCm.value),
        minAge: numOrNull(inputs.minAge.value),
        maxAge: numOrNull(inputs.maxAge.value),
        minOCount: numOrNull(inputs.minOCount.value),
        topMatches: Math.max(1, +inputs.topMatches.value || 25),
        weights: {},
      };
      root.querySelectorAll("input[type=range][data-weight]").forEach((el) => {
        out.weights[el.dataset.weight] = +el.value;
      });
      return out;
    }

    apply.addEventListener("click", () => onChange(readProfile(), { rerank: true, persist: false }));
    save.addEventListener("click", () => onChange(readProfile(), { rerank: true, persist: true }));
    reset.addEventListener("click", () => {
      const d = prefs.defaults();
      onChange(d, { rerank: true, persist: true, replaceForm: true });
    });
    exportBtn.addEventListener("click", () => {
      const blob = new Blob([prefs.exportJson(readProfile())], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "stash-metrics-preferences.json";
      document.body.appendChild(a); a.click(); a.remove();
    });
    importBtn.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "file"; input.accept = "application/json,.json";
      input.addEventListener("change", () => {
        const f = input.files && input.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const imported = prefs.importJson(String(reader.result));
            onChange(imported, { rerank: true, persist: true, replaceForm: true });
          } catch (e) { alert("Import failed: " + e.message); }
        };
        reader.readAsText(f);
      });
      input.click();
    });

    return root;
  }

  function btn(label, kind) {
    const b = document.createElement("button");
    b.className = "btn btn-" + (kind || "secondary") + " metrics-btn";
    b.textContent = label;
    return b;
  }

  function weightLabel(k) {
    return ({
      country: "Country", ethnicity: "Ethnicity", eyeColor: "Eye color",
      hairColor: "Hair color", cup: "Cup size", height: "Height (range)",
      age: "Age (range)", oCount: "O-count signal", tagOverlap: "Tag overlap",
      rating: "Rating",
    })[k] || k;
  }

  function parseCsv(s) {
    return String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
  }
  function numOrNull(s) {
    if (s === "" || s == null) return null;
    const n = +s;
    return isNaN(n) ? null : n;
  }

  function kpiCard(label, value, sub) {
    const el = document.createElement("div");
    el.className = "metrics-kpi";
    el.innerHTML = '<div class="metrics-kpi-label"></div><div class="metrics-kpi-value"></div><div class="metrics-kpi-sub"></div>';
    el.querySelector(".metrics-kpi-label").textContent = label;
    el.querySelector(".metrics-kpi-value").textContent = value;
    el.querySelector(".metrics-kpi-sub").textContent = sub || "";
    return el;
  }

  function badge(text, color) {
    const b = document.createElement("span");
    b.className = "metrics-badge";
    b.textContent = text;
    if (color) b.style.borderColor = color;
    return b;
  }

  function performerCard(m, sceneCount) {
    const el = document.createElement("div");
    el.className = "metrics-match-card";

    const header = document.createElement("div");
    header.className = "metrics-match-head";
    const link = document.createElement("a");
    link.href = "/performers/" + encodeURIComponent(m.id);
    link.className = "metrics-match-name";
    link.textContent = m.name;
    header.appendChild(link);
    const scoreEl = document.createElement("div");
    scoreEl.className = "metrics-match-score";
    scoreEl.style.background = scoreColor(m.score);
    scoreEl.textContent = m.score;
    header.appendChild(scoreEl);
    el.appendChild(header);

    const tags = document.createElement("div");
    tags.className = "metrics-match-tags";
    if (m.country) tags.appendChild(badge(m.country));
    if (m.ethnicity) tags.appendChild(badge(m.ethnicity));
    if (m.eyeColor) tags.appendChild(badge(m.eyeColor + " eyes"));
    if (m.hairColor) tags.appendChild(badge(m.hairColor + " hair"));
    if (m.cupLetter) tags.appendChild(badge("cup " + m.cupLetter));
    if (m.heightCm) tags.appendChild(badge(Math.round(m.heightCm) + " cm"));
    if (m.age != null) tags.appendChild(badge(m.age + " yrs"));
    if (m.rating100 != null) tags.appendChild(badge("★ " + m.rating100));
    if (m.favorite) tags.appendChild(badge("★ favorite", "#f7c948"));
    el.appendChild(tags);

    const meta = document.createElement("div");
    meta.className = "metrics-match-meta";
    meta.textContent = m.sceneCount + " scenes · avg scene O " + m.avgSceneO.toFixed(2);
    el.appendChild(meta);

    const det = document.createElement("details");
    det.className = "metrics-match-details";
    det.innerHTML = '<summary>Score breakdown</summary>';
    const ul = document.createElement("ul");
    ul.className = "metrics-match-breakdown";
    for (const [k, v] of Object.entries(m.contributions || {})) {
      const li = document.createElement("li");
      li.innerHTML = '<span></span><span></span>';
      li.firstChild.textContent = weightLabel(k);
      li.lastChild.textContent = "w=" + v.weight.toFixed(2) + "  ·  match " + Math.round(v.match * 100) + "%";
      ul.appendChild(li);
    }
    det.appendChild(ul);
    el.appendChild(det);
    return el;
  }

  function sceneCard(s) {
    const el = document.createElement("div");
    el.className = "metrics-match-card";
    const header = document.createElement("div");
    header.className = "metrics-match-head";
    const link = document.createElement("a");
    link.href = "/scenes/" + encodeURIComponent(s.id);
    link.className = "metrics-match-name";
    link.textContent = s.title;
    header.appendChild(link);
    const score = document.createElement("div");
    score.className = "metrics-match-score";
    score.style.background = scoreColor(s.score);
    score.textContent = s.score;
    header.appendChild(score);
    el.appendChild(header);

    const tags = document.createElement("div");
    tags.className = "metrics-match-tags";
    if (s.date) tags.appendChild(badge(s.date));
    if (s.studio) tags.appendChild(badge(s.studio));
    if (s.sceneO) tags.appendChild(badge("O " + s.sceneO));
    if (s.rating100 != null) tags.appendChild(badge("★ " + s.rating100));
    el.appendChild(tags);

    const perf = document.createElement("div");
    perf.className = "metrics-match-meta";
    perf.textContent = "with " + (s.performers || []).join(", ");
    el.appendChild(perf);

    const tg = document.createElement("div");
    tg.className = "metrics-match-meta muted";
    tg.textContent = (s.tagNames || []).slice(0, 8).join(" · ");
    el.appendChild(tg);

    const det = document.createElement("details");
    det.className = "metrics-match-details";
    det.innerHTML = '<summary>Score breakdown — best cast member ' + s.maxPerformerScore + ', mean ' + s.meanPerformerScore + '</summary>';
    const ul = document.createElement("ul");
    ul.className = "metrics-match-breakdown";
    for (const [k, v] of Object.entries(s.contributions || {})) {
      const li = document.createElement("li");
      li.innerHTML = '<span></span><span></span>';
      li.firstChild.textContent = ({
        performerMean: "Cast match (mean)", tagOverlap: "Tag overlap",
        sceneOCount: "O-count signal", rating: "Rating",
      })[k] || k;
      li.lastChild.textContent = "w=" + v.weight.toFixed(2) + "  ·  match " + Math.round(v.match * 100) + "%";
      ul.appendChild(li);
    }
    det.appendChild(ul);
    el.appendChild(det);
    return el;
  }

  function scoreColor(score) {
    if (score >= 75) return "#3ecf8e";
    if (score >= 55) return "#f7c948";
    if (score >= 35) return "#f7a26e";
    return "#f76e6e";
  }

  function render(host, payload, opts) {
    host.innerHTML = "";
    const raw = (payload && payload._raw) || (ns.dashboard && ns.dashboard.rawCache);
    if (!raw || !raw.performers || !raw.scenes) {
      const e = document.createElement("div");
      e.className = "metrics-empty";
      e.textContent = "Raw performer/scene data not available in cache. Click Refresh on the dashboard to fetch live, or run the Update Metrics Cache task — the matches tab needs full attributes that aren't kept in the slim cache.";
      host.appendChild(e);
      return;
    }

    let profile = prefs.load();
    const head = document.createElement("div");
    head.className = "metrics-card";
    head.innerHTML = '<div class="metrics-card-title">Preference profile</div>';
    host.appendChild(head);

    const formContainer = document.createElement("div");
    head.appendChild(formContainer);

    const kpiRow = document.createElement("div");
    kpiRow.className = "metrics-kpi-row";
    host.appendChild(kpiRow);

    const cols = document.createElement("div");
    cols.className = "metrics-matches-cols";
    host.appendChild(cols);

    const perfWrap = document.createElement("div");
    perfWrap.className = "metrics-card";
    perfWrap.innerHTML = '<div class="metrics-card-title">Top performer matches</div>';
    const perfList = document.createElement("div");
    perfList.className = "metrics-match-list";
    perfWrap.appendChild(perfList);
    cols.appendChild(perfWrap);

    const sceneWrap = document.createElement("div");
    sceneWrap.className = "metrics-card";
    sceneWrap.innerHTML = '<div class="metrics-card-title">Top scene matches</div>';
    const sceneList = document.createElement("div");
    sceneList.className = "metrics-match-list";
    sceneWrap.appendChild(sceneList);
    cols.appendChild(sceneWrap);

    function rerank(p) {
      const opts2 = {
        matchIncludeUnknown: !!(opts && opts.matchIncludeUnknown),
        matchMinScore: +(opts && opts.matchMinScore) || 0,
      };
      const ranked = rec.rankMatches(raw.performers, raw.scenes, p, opts2);
      kpiRow.innerHTML = "";
      const s = ranked.summary;
      kpiRow.appendChild(kpiCard("Performers above cutoff", s.performersAboveThreshold, "min " + opts2.matchMinScore));
      kpiRow.appendChild(kpiCard("Best performer", s.bestPerformerScore != null ? s.bestPerformerScore + "/100" : "—", ""));
      kpiRow.appendChild(kpiCard("Scenes above cutoff", s.scenesAboveThreshold, ""));
      kpiRow.appendChild(kpiCard("Best scene", s.bestSceneScore != null ? s.bestSceneScore + "/100" : "—", ""));
      kpiRow.appendChild(kpiCard("Profile axes active", activeAxes(p), "non-empty constraints"));

      perfList.innerHTML = "";
      for (const m of ranked.performers) perfList.appendChild(performerCard(m));
      if (!ranked.performers.length) emptyList(perfList, "No performers passed the score threshold.");
      sceneList.innerHTML = "";
      for (const sm of ranked.scenes) sceneList.appendChild(sceneCard(sm));
      if (!ranked.scenes.length) emptyList(sceneList, "No scenes passed the score threshold.");
    }

    function buildAndAttachForm() {
      formContainer.innerHTML = "";
      formContainer.appendChild(buildForm(profile, (newProfile, options) => {
        profile = newProfile;
        if (options.persist) prefs.writeLocal(profile);
        if (options.replaceForm) buildAndAttachForm();
        if (options.rerank) rerank(profile);
      }));
    }
    buildAndAttachForm();
    rerank(profile);
  }

  function activeAxes(p) {
    let n = 0;
    for (const k of ["countries", "ethnicities", "eyeColors", "hairColors", "cupSizes",
                     "requiredTags", "excludedTags"]) {
      if ((p[k] || []).length) n++;
    }
    for (const k of ["minHeightCm", "maxHeightCm", "minAge", "maxAge", "minOCount"]) {
      if (p[k] != null) n++;
    }
    return n;
  }

  function emptyList(host, text) {
    const e = document.createElement("div");
    e.className = "metrics-empty";
    e.textContent = text;
    host.appendChild(e);
  }

  ns.charts = ns.charts || {};
  ns.charts.matches = { render };
})();
