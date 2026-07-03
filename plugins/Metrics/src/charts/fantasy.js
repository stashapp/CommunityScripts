(function () {
  "use strict";

  const ns = (window.StashMetrics = window.StashMetrics || {});
  const rec = ns.recommender;
  const prefs = ns.preferences;
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

  function shareBar(host, hits) {
    if (!hits || !hits.length) { emptyHint(host, "No consensus."); return; }
    const ul = document.createElement("ul");
    ul.className = "metrics-fantasy-axis";
    for (const h of hits.slice(0, 8)) {
      const li = document.createElement("li");
      li.innerHTML = '<span></span><span class="bar"><span class="fill"></span></span><span class="pct"></span>';
      li.firstChild.textContent = h.value;
      li.querySelector(".fill").style.width = Math.round(h.share * 100) + "%";
      li.querySelector(".pct").textContent = Math.round(h.share * 100) + "%";
      ul.appendChild(li);
    }
    host.appendChild(ul);
  }

  function renderCombinations(host, combos) {
    if (!combos || !combos.length) { emptyHint(host, "No multi-attribute combinations found."); return; }
    const ol = document.createElement("ol");
    ol.className = "metrics-list";
    for (const c of combos) {
      const li = document.createElement("li");
      li.innerHTML = '<span class="metrics-list-name"></span><span class="metrics-list-val"></span>';
      li.firstChild.textContent = c.combination;
      li.lastChild.textContent = "  · " + c.value + " in seed";
      ol.appendChild(li);
    }
    host.appendChild(ol);
  }

  function humanizeSeedMode(mode) {
    return ({
      favorites: "of your favourite performers",
      "top-rated": "of your top-rated performers",
      "top-o": "of your most-watched (high-O) performers",
    })[mode] || "seed performers";
  }

  function sectionHeader(step, title, subtitle) {
    const el = document.createElement("div");
    el.className = "metrics-section-header";
    el.innerHTML =
      '<div class="metrics-section-step">Step ' + step + '</div>' +
      '<div class="metrics-section-title"></div>' +
      '<div class="metrics-section-sub"></div>';
    el.querySelector(".metrics-section-title").textContent = title;
    el.querySelector(".metrics-section-sub").textContent = subtitle || "";
    return el;
  }

  // Turn the consensus data into a plain-English "You're into…" bullet list.
  function buildTasteSummary(fantasy, dp) {
    const bullets = [];
    const ss = fantasy.statsSummary || {};
    const ah = fantasy.axisHits || {};

    function firstTop(hits) {
      if (!hits || !hits.length) return null;
      return hits[0];
    }
    const topEth = firstTop(ah.ethnicity);
    if (topEth) bullets.push({ key: "Ethnicity:", value: topEth.value + " (" + Math.round(topEth.share * 100) + "% of your seed)" });
    const topEye = firstTop(ah.eyeColor);
    if (topEye) bullets.push({ key: "Eye colour:", value: topEye.value + " (" + Math.round(topEye.share * 100) + "%)" });
    const topHair = firstTop(ah.hairColor);
    if (topHair) bullets.push({ key: "Hair:", value: topHair.value + " (" + Math.round(topHair.share * 100) + "%)" });
    const topCountry = firstTop(ah.country);
    if (topCountry && topCountry.share >= 0.15) {
      bullets.push({ key: "Country:", value: topCountry.value + " (" + Math.round(topCountry.share * 100) + "% — but not a strong pattern)" });
    }
    if (ss.heightMedian) {
      bullets.push({ key: "Typical height:", value: Math.round(ss.heightMedian) + " cm (range " + Math.round(ss.heightIQR[0] || 0) + "–" + Math.round(ss.heightIQR[1] || 0) + " cm)" });
    }
    if (ss.ageMedian) {
      bullets.push({ key: "Typical age:", value: Math.round(ss.ageMedian) + " (range " + Math.round(ss.ageIQR[0] || 0) + "–" + Math.round(ss.ageIQR[1] || 0) + ")" });
    }
    const topTags = (ah.tags || []).slice(0, 3).filter((t) => t.share >= 0.5);
    if (topTags.length) {
      bullets.push({ key: "Signature tags:", value: topTags.map((t) => t.value).join(" · ") });
    }

    // Compose a headline.
    const traitParts = [];
    if (topEth && topEth.share >= 0.5) traitParts.push(topEth.value.toLowerCase());
    if (topHair && topHair.share >= 0.4) traitParts.push(topHair.value.toLowerCase());
    if (topEye && topEye.share >= 0.4) traitParts.push(topEye.value.toLowerCase() + "-eyed");
    let title = "Your taste at a glance";
    if (traitParts.length) title = "You gravitate toward " + traitParts.join(", ") + " performers.";
    return { title, bullets };
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

  function render(host, payload, opts) {
    host.innerHTML = "";
    const fantasy = payload && payload.fantasy;
    if (!fantasy || !fantasy.derivedProfile) {
      emptyHint(host, "Fantasy block missing from cache. Run Update Metrics Cache — or if you've turned it off, uncheck 'Disable Fantasy Builder' in plugin settings.");
      return;
    }

    const dp = fantasy.derivedProfile || {};
    const ss = fantasy.statsSummary || {};
    const activeAxes = ["countries", "ethnicities", "eyeColors", "hairColors", "cupSizes", "requiredTags"]
      .filter((k) => (dp[k] || []).length).length;

    // ---- Hero card: plain-language taste snapshot ------------------------
    const hero = document.createElement("div");
    hero.className = "metrics-card metrics-fantasy-hero";
    const heroSummary = buildTasteSummary(fantasy, dp);
    hero.innerHTML =
      '<div class="metrics-fantasy-hero-badge">Fantasy Builder</div>' +
      '<div class="metrics-fantasy-hero-title"></div>' +
      '<div class="metrics-fantasy-hero-sub">' +
      'Based on <b>' + fantasy.seedSize + '</b> ' + humanizeSeedMode(fantasy.seedMode) + ', here\'s what your library says you like:' +
      '</div>' +
      '<ul class="metrics-fantasy-hero-list"></ul>' +
      '<div class="metrics-fantasy-hero-help">' +
      '<details><summary>How does this work?</summary>' +
      '<p>The plugin takes your seed of ' + fantasy.seedSize + ' performers (set by the <code>fantasyMode</code> plugin setting: favorites, top-rated, or top-o) and looks at what they have in common. Anything ≥ 50% of them share becomes a "locked" preference; numeric ranges span the middle half of the seed. You can then rank the whole library against that profile, or hand-tune it in the Matches tab.</p>' +
      '</details></div>';
    hero.querySelector(".metrics-fantasy-hero-title").textContent = heroSummary.title;
    const heroList = hero.querySelector(".metrics-fantasy-hero-list");
    for (const line of heroSummary.bullets) {
      const li = document.createElement("li");
      li.innerHTML = "<b></b><span></span>";
      li.firstChild.textContent = line.key;
      li.lastChild.textContent = " " + line.value;
      heroList.appendChild(li);
    }
    host.appendChild(hero);

    // ---- KPI strip -------------------------------------------------------
    const kpis = document.createElement("div");
    kpis.className = "metrics-kpi-row";
    host.appendChild(kpis);
    kpis.appendChild(kpiCard("Seed size", fantasy.seedSize, humanizeSeedMode(fantasy.seedMode)));
    kpis.appendChild(kpiCard("Median height", ss.heightMedian != null ? Math.round(ss.heightMedian) + " cm" : "—",
      ss.heightIQR && ss.heightIQR[0] != null ? "typical: " + Math.round(ss.heightIQR[0]) + "–" + Math.round(ss.heightIQR[1]) + " cm" : ""));
    kpis.appendChild(kpiCard("Median age", ss.ageMedian != null ? Math.round(ss.ageMedian) + " yrs" : "—",
      ss.ageIQR && ss.ageIQR[0] != null ? "typical: " + Math.round(ss.ageIQR[0]) + "–" + Math.round(ss.ageIQR[1]) + " yrs" : ""));
    kpis.appendChild(kpiCard("Seed avg O", ss.seedAvgO || 0, "per-scene O across seed"));
    kpis.appendChild(kpiCard("Locked traits", activeAxes + "/6", activeAxes >= 3 ? "strong preference detected" : "weak — few common traits"));

    // ---- Section 1 header ------------------------------------------------
    host.appendChild(sectionHeader(1, "What your favourites have in common",
      "Every bar shows the share of your seed that matches. Values above 50% get locked into the derived profile below."));

    // Axis hit breakdown grid
    const grid = document.createElement("div");
    grid.className = "metrics-grid";
    host.appendChild(grid);

    const axisHits = fantasy.axisHits || {};
    let c = card(grid, "Country consensus", "share of seed performers whose country = X");
    shareBar(c, axisHits.country);
    c = card(grid, "Ethnicity consensus");
    shareBar(c, axisHits.ethnicity);
    c = card(grid, "Eye color consensus");
    shareBar(c, axisHits.eyeColor);
    c = card(grid, "Hair color consensus");
    shareBar(c, axisHits.hairColor);
    c = card(grid, "Cup consensus");
    shareBar(c, axisHits.cup);
    c = card(grid, "Tags shared across seed (shaping requiredTags)");
    shareBar(c, axisHits.tags);
    c = card(grid, "Most-common (country, eye, cup) combos");
    renderCombinations(c, (fantasy.combinations || {}).countryEyeCup);
    c = card(grid, "Most-common (country, ethnicity, cup) combos");
    renderCombinations(c, (fantasy.combinations || {}).countryEthnicityCup);

    // ---- Section 2 header
    if (fantasy.sceneRecipes && fantasy.sceneRecipes.length) {
      host.appendChild(sectionHeader(2, "Concrete recipes to look for",
        "Each recipe combines a locked trait set with the tags your seed consistently plays out. Screenshot them, or use them as search filters next time you're browsing."));
    }

    // Scene recipes — one-line "build me a fantasy scene like X" recipes
    // that combine the strongest consensus axes + multi-axis combinations.
    if (fantasy.sceneRecipes && fantasy.sceneRecipes.length) {
      const recipesGrid = document.createElement("div");
      recipesGrid.className = "metrics-grid";
      host.appendChild(recipesGrid);
      c = card(recipesGrid, "Scene recipes",
        "each recipe = a proven-liked combination the plugin lifted from your seed");
      const ol = document.createElement("ol");
      ol.className = "metrics-list metrics-recipes";
      for (const r of fantasy.sceneRecipes) {
        const li = document.createElement("li");
        const head = document.createElement("div");
        head.className = "metrics-recipe-head";
        head.textContent = r.label;
        li.appendChild(head);
        const perf = document.createElement("div");
        perf.className = "metrics-list-sub";
        perf.textContent = "performer: " + r.performerSpec;
        li.appendChild(perf);
        const tag = document.createElement("div");
        tag.className = "metrics-list-sub";
        tag.textContent = "tags: " + r.tagSpec;
        li.appendChild(tag);
        const notes = document.createElement("div");
        notes.className = "metrics-list-sub muted";
        notes.textContent = r.notes;
        li.appendChild(notes);
        ol.appendChild(li);
      }
      c.appendChild(ol);
    }

    // ---- Section 3 header
    host.appendChild(sectionHeader(3, "Take action",
      "The plugin already ranked every performer and scene in your library against this profile — scroll down to see who scored highest. Or tweak the weights in the Matches tab."));

    // Derived profile block — action-first, JSON collapsed.
    const derived = document.createElement("div");
    derived.className = "metrics-card metrics-fantasy-actions-card";
    derived.innerHTML =
      '<div class="metrics-card-title">Your derived preference profile</div>' +
      '<div class="metrics-card-sub">' + activeAxes + '/6 categorical axes locked ' +
      '(≥50% seed consensus) · height and age ranges from seed IQR</div>';

    // Big primary action row.
    const actions = document.createElement("div");
    actions.className = "metrics-fantasy-actions";

    const useBtn = document.createElement("button");
    useBtn.className = "btn btn-primary metrics-btn metrics-btn-hero";
    useBtn.innerHTML = '<span class="metrics-btn-title">Send to Matches tab</span>' +
      '<span class="metrics-btn-sub">Tweak weights, sliders, and ranges live</span>';
    const copyBtn = document.createElement("button");
    copyBtn.className = "btn btn-secondary metrics-btn metrics-btn-hero";
    copyBtn.innerHTML = '<span class="metrics-btn-title">Download JSON</span>' +
      '<span class="metrics-btn-sub">Keep or share the profile</span>';
    const rankBtn = document.createElement("button");
    rankBtn.className = "btn btn-secondary metrics-btn metrics-btn-hero";
    rankBtn.innerHTML = '<span class="metrics-btn-title">Re-rank now</span>' +
      '<span class="metrics-btn-sub">Force the ranking below to refresh</span>';
    actions.appendChild(useBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(rankBtn);
    derived.appendChild(actions);

    // Collapsible technical details.
    const details = document.createElement("details");
    details.className = "metrics-fantasy-details";
    const summary = document.createElement("summary");
    summary.textContent = "Show the raw profile JSON";
    details.appendChild(summary);
    const pre = document.createElement("pre");
    pre.className = "metrics-fantasy-json";
    pre.textContent = JSON.stringify(dp, null, 2);
    details.appendChild(pre);
    derived.appendChild(details);

    host.appendChild(derived);

    useBtn.addEventListener("click", () => {
      if (!prefs || !prefs.writeLocal) return;
      prefs.writeLocal(Object.assign(prefs.defaults(), dp));
      useBtn.innerHTML = '<span class="metrics-btn-title">✓ Saved — click Matches tab</span>' +
        '<span class="metrics-btn-sub">the profile is now in your Matches form</span>';
      useBtn.classList.add("metrics-btn-saved");
    });
    copyBtn.addEventListener("click", () => {
      try {
        const blob = new Blob([JSON.stringify(dp, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "fantasy-profile.json";
        document.body.appendChild(a); a.click(); a.remove();
      } catch (e) { alert(e.message); }
    });

    // ---- Section 4: Fantasy Film — the ideal scene format
    if (fantasy.fantasyFilm) {
      host.appendChild(sectionHeader(4, "Your fantasy film",
        "The format your favourites keep producing — duration, resolution, cast size, studios, and 20 example scenes."));
      renderFantasyFilm(host, fantasy.fantasyFilm);
    }

    // ---- Section 5: Fantasy Tag Stack — signature tag patterns
    if (fantasy.fantasyTagStack) {
      host.appendChild(sectionHeader(5, "Your fantasy tag stack",
        "The tag signature: which tags your seed keeps hitting, which pairs / triples cluster together, and which tags your seed systematically avoids."));
      renderFantasyTagStack(host, fantasy.fantasyTagStack);
    }

    // ---- Section 6: ranked library
    host.appendChild(sectionHeader(6, "Your ranked library",
      "Every performer and scene scored against the derived profile above. Click any name to open it in Stash."));

    // Live rank against derived profile
    const rankWrap = document.createElement("div");
    rankWrap.className = "metrics-matches-cols";
    host.appendChild(rankWrap);
    const perfCard = document.createElement("div");
    perfCard.className = "metrics-card";
    perfCard.innerHTML = '<div class="metrics-card-title">Top performers matching your fantasy</div>';
    const perfList = document.createElement("div");
    perfList.className = "metrics-match-list";
    perfCard.appendChild(perfList);
    rankWrap.appendChild(perfCard);

    const sceneCard = document.createElement("div");
    sceneCard.className = "metrics-card";
    sceneCard.innerHTML = '<div class="metrics-card-title">Top scenes matching your fantasy</div>';
    const sceneList = document.createElement("div");
    sceneList.className = "metrics-match-list";
    sceneCard.appendChild(sceneList);
    rankWrap.appendChild(sceneCard);

    function runRanking() {
      const raw = (payload && payload._raw) || (ns.dashboard && ns.dashboard.rawCache);
      if (!raw || !raw.performers || !raw.scenes) {
        perfList.innerHTML = ""; sceneList.innerHTML = "";
        emptyHint(perfList, "Need full performer/scene data — refresh the dashboard.");
        return;
      }
      const ranked = rec.rankMatches(raw.performers, raw.scenes, dp, {
        matchIncludeUnknown: !!(opts && opts.matchIncludeUnknown),
        matchMinScore: +(opts && opts.matchMinScore) || 0,
      });
      perfList.innerHTML = "";
      sceneList.innerHTML = "";
      for (const m of ranked.performers.slice(0, 20)) perfList.appendChild(performerCard(m));
      for (const sm of ranked.scenes.slice(0, 20)) sceneList.appendChild(sceneCard2(sm));
      if (!ranked.performers.length) emptyHint(perfList, "No performers matched the derived profile.");
      if (!ranked.scenes.length) emptyHint(sceneList, "No scenes matched the derived profile.");
    }
    rankBtn.addEventListener("click", runRanking);
    runRanking();
  }

  function badge(text) {
    const b = document.createElement("span");
    b.className = "metrics-badge";
    b.textContent = text;
    return b;
  }
  function scoreColor(score) {
    if (score >= 75) return "#3ecf8e";
    if (score >= 55) return "#f7c948";
    if (score >= 35) return "#f7a26e";
    return "#f76e6e";
  }
  function performerCard(m) {
    const el = document.createElement("div");
    el.className = "metrics-match-card";
    el.innerHTML = '<div class="metrics-match-head"><a class="metrics-match-name"></a><div class="metrics-match-score"></div></div>';
    const a = el.querySelector("a");
    a.textContent = m.name;
    a.href = "/performers/" + encodeURIComponent(m.id);
    const score = el.querySelector(".metrics-match-score");
    score.textContent = m.score;
    score.style.background = scoreColor(m.score);
    const tags = document.createElement("div");
    tags.className = "metrics-match-tags";
    if (m.country) tags.appendChild(badge(m.country));
    if (m.ethnicity) tags.appendChild(badge(m.ethnicity));
    if (m.eyeColor) tags.appendChild(badge(m.eyeColor + " eyes"));
    if (m.cupLetter) tags.appendChild(badge("cup " + m.cupLetter));
    if (m.heightCm) tags.appendChild(badge(Math.round(m.heightCm) + " cm"));
    if (m.age != null) tags.appendChild(badge(m.age + " yrs"));
    el.appendChild(tags);
    const meta = document.createElement("div");
    meta.className = "metrics-match-meta";
    meta.textContent = m.sceneCount + " scenes · avg scene O " + m.avgSceneO.toFixed(2);
    el.appendChild(meta);
    return el;
  }
  function sceneCard2(s) {
    const el = document.createElement("div");
    el.className = "metrics-match-card";
    el.innerHTML = '<div class="metrics-match-head"><a class="metrics-match-name"></a><div class="metrics-match-score"></div></div>';
    const a = el.querySelector("a");
    a.textContent = s.title;
    a.href = "/scenes/" + encodeURIComponent(s.id);
    const score = el.querySelector(".metrics-match-score");
    score.textContent = s.score;
    score.style.background = scoreColor(s.score);
    const tags = document.createElement("div");
    tags.className = "metrics-match-tags";
    if (s.date) tags.appendChild(badge(s.date));
    if (s.studio) tags.appendChild(badge(s.studio));
    if (s.sceneO) tags.appendChild(badge("O " + s.sceneO));
    el.appendChild(tags);
    const meta = document.createElement("div");
    meta.className = "metrics-match-meta";
    meta.textContent = "with " + (s.performers || []).join(", ");
    el.appendChild(meta);
    return el;
  }

  ns.charts = ns.charts || {};
  // -------- Fantasy Film renderer -------------------------------------
  function renderFantasyFilm(host, film) {
    // KPI strip summarising the ideal film format.
    const kpi = document.createElement("div");
    kpi.className = "metrics-kpi-row";
    host.appendChild(kpi);
    const dur = film.duration || {};
    const durMed = dur.medianSec != null ? fmt.duration(dur.medianSec) : "—";
    const durIQR = dur.iqrSec && dur.iqrSec[0] != null
      ? fmt.duration(dur.iqrSec[0]) + " – " + fmt.duration(dur.iqrSec[1])
      : "";
    kpi.appendChild(kpiCard("Typical duration", durMed, durIQR ? "middle 50% " + durIQR : ""));

    const topRes = (film.resolutions || [])[0];
    kpi.appendChild(kpiCard("Preferred resolution", topRes ? topRes.label : "—",
      topRes ? Math.round((topRes.value / film.seedSceneCount) * 100) + "% of seed's scenes" : ""));

    const rat = film.rating || {};
    kpi.appendChild(kpiCard("Rating band",
      rat.median != null ? "★ " + rat.median : "—",
      rat.iqr && rat.iqr[0] != null ? "typical " + rat.iqr[0] + "–" + rat.iqr[1] : "no ratings"));

    const cast = film.castComposition || {};
    const total = (cast.solo || 0) + (cast.pair || 0) + (cast.group || 0) || 1;
    const dominantCast = (cast.solo || 0) >= (cast.pair || 0) && (cast.solo || 0) >= (cast.group || 0)
      ? "Solo (" + Math.round((cast.solo || 0) / total * 100) + "%)"
      : (cast.pair || 0) >= (cast.group || 0)
        ? "Pair (" + Math.round((cast.pair || 0) / total * 100) + "%)"
        : "Group 3+ (" + Math.round((cast.group || 0) / total * 100) + "%)";
    kpi.appendChild(kpiCard("Cast size", dominantCast,
      (cast.solo || 0) + " solo · " + (cast.pair || 0) + " pair · " + (cast.group || 0) + " group"));

    kpi.appendChild(kpiCard("Avg plays / scene", film.avgPlays != null ? film.avgPlays : "—",
      "how often you rewatch"));
    kpi.appendChild(kpiCard("Avg O / scene", film.avgO != null ? film.avgO : "—",
      "drives oCount weight"));

    // Grid of breakdown cards.
    const grid = document.createElement("div");
    grid.className = "metrics-grid";
    host.appendChild(grid);

    let c = card(grid, "Studios that show up",
      "top studios featuring your seed performers");
    if (film.topStudios && film.topStudios.length) {
      const ul = document.createElement("ol");
      ul.className = "metrics-list";
      for (const s of film.topStudios) {
        const li = document.createElement("li");
        li.innerHTML = '<span class="metrics-list-name"></span><span class="metrics-list-val"></span>';
        li.firstChild.textContent = s.label;
        li.lastChild.textContent = "  · " + s.value + " scenes";
        ul.appendChild(li);
      }
      c.appendChild(ul);
    } else {
      emptyHint(c, "No studios tagged on the seed's scenes.");
    }

    c = card(grid, "Resolution mix",
      "what quality your seed's scenes ship at");
    if (film.resolutions && film.resolutions.length) {
      const ul = document.createElement("ul");
      ul.className = "metrics-fantasy-axis";
      const total = film.seedSceneCount || 1;
      for (const r of film.resolutions) {
        const li = document.createElement("li");
        li.innerHTML = '<span></span><span class="bar"><span class="fill"></span></span><span class="pct"></span>';
        li.firstChild.textContent = r.label;
        li.querySelector(".fill").style.width = Math.round(r.value / total * 100) + "%";
        li.querySelector(".pct").textContent = Math.round(r.value / total * 100) + "%";
        ul.appendChild(li);
      }
      c.appendChild(ul);
    } else {
      emptyHint(c, "No resolution data.");
    }

    // Exemplar scenes — the ranked recipe list.
    const exCard = document.createElement("div");
    exCard.className = "metrics-card";
    exCard.innerHTML =
      '<div class="metrics-card-title">Fantasy film shortlist</div>' +
      '<div class="metrics-card-sub">Your seed\'s top 20 scenes — pattern-match against these to find more.</div>';
    host.appendChild(exCard);
    if (film.exemplars && film.exemplars.length) {
      const ol = document.createElement("ol");
      ol.className = "metrics-list";
      for (const s of film.exemplars) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.className = "metrics-list-name";
        a.textContent = s.title;
        a.href = "/scenes/" + encodeURIComponent(s.id);
        li.appendChild(a);
        const badges = document.createElement("div");
        badges.className = "metrics-match-tags";
        if (s.rating100 != null) badges.appendChild(makeBadge("★ " + s.rating100));
        if (s.durationSec) badges.appendChild(makeBadge(fmt.duration(s.durationSec)));
        if (s.resolution) badges.appendChild(makeBadge(s.resolution));
        if (s.studio) badges.appendChild(makeBadge(s.studio));
        if (s.playCount) badges.appendChild(makeBadge(s.playCount + " plays"));
        if (s.oCount) badges.appendChild(makeBadge("O " + s.oCount));
        li.appendChild(badges);
        if (s.performers && s.performers.length) {
          const meta = document.createElement("div");
          meta.className = "metrics-list-sub";
          meta.textContent = "with " + s.performers.slice(0, 6).join(", ");
          li.appendChild(meta);
        }
        if (s.tags && s.tags.length) {
          const tags = document.createElement("div");
          tags.className = "metrics-list-sub muted";
          tags.textContent = s.tags.join(" · ");
          li.appendChild(tags);
        }
        ol.appendChild(li);
      }
      exCard.appendChild(ol);
    } else {
      emptyHint(exCard, "No scenes matched.");
    }
  }

  function makeBadge(text, color) {
    const b = document.createElement("span");
    b.className = "metrics-badge";
    b.textContent = text;
    if (color) { b.style.borderColor = color; b.style.color = color; }
    return b;
  }

  // -------- Fantasy Tag Stack renderer --------------------------------
  function renderFantasyTagStack(host, stack) {
    // Big "copy-paste-into-Stash-search" summary card.
    const summary = document.createElement("div");
    summary.className = "metrics-card metrics-tag-stack-summary";
    summary.innerHTML =
      '<div class="metrics-card-title">Your signature tag stack</div>' +
      '<div class="metrics-card-sub">The tags that appear in ≥40% of your seed\'s scenes. Paste them into a Stash search.</div>';
    if (stack.strongStack && stack.strongStack.length) {
      const chips = document.createElement("div");
      chips.className = "metrics-match-tags metrics-tag-stack-chips";
      for (const t of stack.strongStack) {
        const chip = document.createElement("a");
        chip.className = "metrics-tag-pill";
        chip.textContent = t;
        chip.style.color = fmt.colorFor(t);
        chip.href = "/tags?q=" + encodeURIComponent(t);
        chips.appendChild(chip);
      }
      summary.appendChild(chips);

      const copyBtn = document.createElement("button");
      copyBtn.className = "btn btn-secondary metrics-btn";
      copyBtn.textContent = "Copy tag list";
      copyBtn.addEventListener("click", () => {
        const text = stack.strongStack.join(", ");
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            copyBtn.textContent = "✓ Copied";
            setTimeout(() => { copyBtn.textContent = "Copy tag list"; }, 2000);
          });
        } else {
          alert(text);
        }
      });
      summary.appendChild(copyBtn);
    } else {
      emptyHint(summary, "No tag consistently appears across the seed. Try a broader seed.");
    }
    host.appendChild(summary);

    // Grid of tag surfaces.
    const grid = document.createElement("div");
    grid.className = "metrics-grid";
    host.appendChild(grid);

    let c = card(grid, "Every tag your seed leans on",
      "share of scenes where the seed's tags include X");
    if (stack.signature && stack.signature.length) {
      const ul = document.createElement("ul");
      ul.className = "metrics-fantasy-axis";
      for (const t of stack.signature.slice(0, 20)) {
        const li = document.createElement("li");
        li.innerHTML = '<span></span><span class="bar"><span class="fill"></span></span><span class="pct"></span>';
        li.firstChild.textContent = t.name;
        li.querySelector(".fill").style.width = Math.round(t.share * 100) + "%";
        li.querySelector(".pct").textContent = Math.round(t.share * 100) + "%";
        ul.appendChild(li);
      }
      c.appendChild(ul);
    }

    c = card(grid, "Tag pairs that keep appearing together",
      "top pair combinations across the seed's scenes");
    if (stack.pairs && stack.pairs.length) {
      const ol = document.createElement("ol");
      ol.className = "metrics-list";
      for (const p of stack.pairs.slice(0, 15)) {
        const li = document.createElement("li");
        li.innerHTML = '<span class="metrics-list-name"></span><span class="metrics-list-val"></span>';
        li.firstChild.textContent = p.a + "  +  " + p.b;
        li.lastChild.textContent = "  · " + p.count + " scenes (" + Math.round(p.share * 100) + "%)";
        ol.appendChild(li);
      }
      c.appendChild(ol);
    } else { emptyHint(c, "Not enough co-occurring tags."); }

    c = card(grid, "Tag triples that cluster together",
      "three-tag combinations in the same scene");
    if (stack.triples && stack.triples.length) {
      const ol = document.createElement("ol");
      ol.className = "metrics-list";
      for (const t of stack.triples.slice(0, 12)) {
        const li = document.createElement("li");
        li.innerHTML = '<span class="metrics-list-name"></span><span class="metrics-list-val"></span>';
        li.firstChild.textContent = t.a + "  +  " + t.b + "  +  " + t.c;
        li.lastChild.textContent = "  · " + t.count + " scenes";
        ol.appendChild(li);
      }
      c.appendChild(ol);
    } else { emptyHint(c, "Not enough tag triples."); }

    c = card(grid, "Anti-tags — what your seed AVOIDS",
      "tags common library-wide but almost absent from the seed's scenes");
    if (stack.antiTags && stack.antiTags.length) {
      const ol = document.createElement("ol");
      ol.className = "metrics-list";
      for (const t of stack.antiTags.slice(0, 12)) {
        const li = document.createElement("li");
        li.innerHTML = '<span class="metrics-list-name"></span><span class="metrics-list-val"></span>';
        li.firstChild.textContent = t.name;
        li.lastChild.textContent = "  · library " + Math.round(t.libraryShare * 100) + "% vs seed " + Math.round(t.seedShare * 100) + "%";
        ol.appendChild(li);
      }
      c.appendChild(ol);
    } else { emptyHint(c, "No obvious anti-tags detected — your seed samples the library evenly."); }
  }

  ns.charts.fantasy = { render };
})();
