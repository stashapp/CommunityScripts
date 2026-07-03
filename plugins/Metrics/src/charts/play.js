(function () {
  "use strict";

  const ns = (window.StashMetrics = window.StashMetrics || {});
  const fmt = ns.format;

  const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));

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

  // Day-of-week × hour-of-day heatmap rendered via CSS grid. Each cell's
  // background opacity scales with play count. Empty cells stay near-black
  // so peaks are immediately legible.
  function renderHeatmap(host, matrix) {
    const wrap = document.createElement("div");
    wrap.className = "metrics-heatmap metrics-playhist";
    const grid = document.createElement("div");
    grid.className = "metrics-heatmap-grid";
    grid.style.gridTemplateColumns = "70px repeat(24, 1fr)";

    const corner = document.createElement("div");
    corner.className = "metrics-heatmap-corner";
    corner.textContent = "DoW \\ Hr";
    grid.appendChild(corner);
    for (const h of HOUR_LABELS) {
      const ch = document.createElement("div");
      ch.className = "metrics-heatmap-col-head";
      ch.textContent = h;
      grid.appendChild(ch);
    }

    let max = 0;
    for (const row of matrix) for (const v of row) if (v > max) max = v;
    if (max === 0) max = 1;

    for (let d = 0; d < 7; d++) {
      const rh = document.createElement("div");
      rh.className = "metrics-heatmap-row-head";
      rh.textContent = DOW_LABELS[d];
      grid.appendChild(rh);
      for (let h = 0; h < 24; h++) {
        const v = matrix[d][h] || 0;
        const cell = document.createElement("div");
        cell.className = "metrics-heatmap-cell";
        const a = v / max;
        cell.style.background = "rgba(78, 168, 255, " + (a * 0.85 + 0.04).toFixed(3) + ")";
        cell.textContent = v ? v : "";
        cell.title = DOW_LABELS[d] + " " + HOUR_LABELS[h] + ":00 — " + v + " play" + (v === 1 ? "" : "s");
        grid.appendChild(cell);
      }
    }
    wrap.appendChild(grid);
    host.appendChild(wrap);
  }

  function rankingList(host, items, valueFmt, secondaryFmt, emptyText) {
    if (!items || !items.length) {
      emptyHint(host, emptyText || "No data in this cache. Run Update Metrics Cache in Stash's Tasks page.");
      return;
    }
    const ol = document.createElement("ol");
    ol.className = "metrics-list";
    for (const it of items.slice(0, 25)) {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.className = "metrics-list-name";
      a.textContent = it.name || it.title;
      if (it.id && it.title != null) a.href = "/scenes/" + encodeURIComponent(it.id);
      else if (it.id) a.href = "/performers/" + encodeURIComponent(it.id);
      li.appendChild(a);
      const v = document.createElement("span");
      v.className = "metrics-list-val";
      v.textContent = "  " + valueFmt(it);
      li.appendChild(v);
      if (secondaryFmt) {
        const s = document.createElement("div");
        s.className = "metrics-list-sub";
        s.textContent = secondaryFmt(it);
        li.appendChild(s);
      }
      ol.appendChild(li);
    }
    host.appendChild(ol);
  }

  function render(host, payload) {
    host.innerHTML = "";
    const ph = payload && payload.playHistory;
    if (!ph) {
      emptyHint(host, "Play history isn't in this cache. Run Update Metrics Cache (or upgrade Stash to ≥ 0.24 for the full hour-of-day heatmap).");
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
    const k = ph.kpis || {};
    kpis.appendChild(kpi("Total plays", fmt.int(k.totalPlays), ""));
    kpis.appendChild(kpi("Watched scenes", fmt.int(k.playedScenes), fmt.int(k.unplayedScenes) + " untouched"));
    kpis.appendChild(kpi("Avg plays / watched scene", (k.avgPlaysPerPlayedScene || 0).toFixed(2), ""));
    kpis.appendChild(kpi("Total watch time", fmt.duration(k.totalPlayDuration), ""));
    kpis.appendChild(kpi("Longest streak", k.longestStreak + "d", k.uniqueDays + " unique days"));
    kpis.appendChild(kpi("Current streak", k.currentStreak + "d", ""));
    if (k.hasRichHistory) {
      kpis.appendChild(kpi("Peak hour", String(ph.peakHour || 0).padStart(2, "0") + ":00", ""));
      kpis.appendChild(kpi("Peak day", DOW_LABELS[ph.peakDow || 0], ""));
    }
    if (payload.fun && payload.fun.peakSession) {
      const ps = payload.fun.peakSession;
      kpis.appendChild(kpi("Peak session", ps.playCount + " plays",
        fmt.duration(ps.durationMinutes * 60) + " on " + String(ps.startTs).slice(0, 10)));
    }
    if (payload.fun && payload.fun.drySpell) {
      const dry = payload.fun.drySpell;
      kpis.appendChild(kpi("Watch style", dry.style,
        dry.longestDrySpellDays + "d longest dry spell"));
    }

    // Roulette / Surprise-me — a small card that picks a random unwatched
    // high-value scene each time you press the button.
    const raw = (payload && payload._raw) || (ns.dashboard && ns.dashboard.rawCache);
    if (raw && raw.scenes) {
      const rouletteCard = document.createElement("div");
      rouletteCard.className = "metrics-card metrics-roulette";
      rouletteCard.innerHTML =
        '<div class="metrics-card-title">🎲 Surprise me</div>' +
        '<div class="metrics-card-sub">Random pick weighted toward unwatched, highly rated scenes.</div>' +
        '<button class="btn btn-primary metrics-btn metrics-btn-hero">' +
        '<span class="metrics-btn-title">Spin the roulette</span>' +
        '<span class="metrics-btn-sub">Click to pick a scene right now</span></button>' +
        '<div class="metrics-roulette-result"></div>';
      const btn = rouletteCard.querySelector("button");
      const result = rouletteCard.querySelector(".metrics-roulette-result");
      function spin() {
        // Weight = rating × (1 / (1 + play_count)) — unwatched + high-rating
        // scenes are more likely to come up.
        const candidates = raw.scenes.filter((s) => s.rating100 != null);
        if (!candidates.length) { result.textContent = "No rated scenes to draw from."; return; }
        const weighted = candidates.map((s) => ({
          s, w: s.rating100 * (1 / (1 + (s.play_count || 0))),
        }));
        const total = weighted.reduce((a, b) => a + b.w, 0);
        let r = Math.random() * total;
        let pick = weighted[0].s;
        for (const w of weighted) { r -= w.w; if (r <= 0) { pick = w.s; break; } }
        result.innerHTML = "";
        const a = document.createElement("a");
        a.className = "metrics-list-name";
        a.textContent = pick.title || ("Scene " + pick.id);
        a.href = "/scenes/" + encodeURIComponent(pick.id);
        result.appendChild(a);
        const meta = document.createElement("div");
        meta.className = "metrics-list-sub";
        meta.textContent = "★ " + (pick.rating100 || 0) + " · " +
          (pick.play_count || 0) + " plays · " +
          (pick.performers || []).slice(0, 3).map((p) => p.name).join(", ");
        result.appendChild(meta);
      }
      btn.addEventListener("click", spin);
      host.appendChild(rouletteCard);

      // Blind pick — same weighted roulette but hides names/thumb. Reveal
      // button uncovers the pick.
      const blindCard = document.createElement("div");
      blindCard.className = "metrics-card metrics-blind";
      blindCard.innerHTML =
        '<div class="metrics-card-title">🎭 Blind pick</div>' +
        '<div class="metrics-card-sub">Peek at tags + length only. Reveal or reroll before committing.</div>' +
        '<button class="btn btn-primary metrics-btn metrics-btn-hero" data-act="blind-spin">' +
        '<span class="metrics-btn-title">Draw a mystery scene</span>' +
        '<span class="metrics-btn-sub">Tags + duration only — you decide sight-unseen</span></button>' +
        '<div class="metrics-blind-result"></div>';
      const blindResult = blindCard.querySelector(".metrics-blind-result");
      let currentBlindPick = null;
      function blindSpin() {
        const candidates = raw.scenes.filter((s) => s.rating100 != null && (s.tags || []).length >= 2);
        if (!candidates.length) { blindResult.textContent = "Not enough tagged scenes to draw from."; return; }
        const weighted = candidates.map((s) => ({ s, w: s.rating100 * (1 / (1 + (s.play_count || 0))) }));
        const total = weighted.reduce((a, b) => a + b.w, 0);
        let r = Math.random() * total;
        let pick = weighted[0].s;
        for (const w of weighted) { r -= w.w; if (r <= 0) { pick = w.s; break; } }
        currentBlindPick = pick;
        const dur = Math.max.apply(null, (pick.files || [{}]).map((f) => f.duration || 0));
        const durMin = dur ? Math.round(dur / 60) + " min" : "—";
        const tags = (pick.tags || []).slice(0, 8).map((t) => t.name);
        blindResult.innerHTML = "";
        const mask = document.createElement("div");
        mask.className = "metrics-blind-mask";
        mask.innerHTML =
          '<div class="metrics-blind-mystery">??? </div>' +
          '<div class="metrics-blind-meta"><span></span> · <span></span> plays · ★<span></span></div>' +
          '<div class="metrics-blind-tags"></div>' +
          '<div class="metrics-blind-actions">' +
          '<button class="metrics-btn" data-act="blind-reveal">Reveal</button> ' +
          '<button class="metrics-btn" data-act="blind-reroll">Reroll</button></div>';
        const metaSpans = mask.querySelectorAll(".metrics-blind-meta span");
        metaSpans[0].textContent = durMin;
        metaSpans[1].textContent = pick.play_count || 0;
        metaSpans[2].textContent = Math.round((pick.rating100 || 0) / 20 * 10) / 10;
        const tagsEl = mask.querySelector(".metrics-blind-tags");
        for (const t of tags) {
          const b = document.createElement("span");
          b.className = "metrics-badge";
          b.textContent = t;
          tagsEl.appendChild(b);
        }
        mask.querySelector('[data-act="blind-reveal"]').addEventListener("click", () => {
          if (!currentBlindPick) return;
          blindResult.innerHTML = "";
          const a = document.createElement("a");
          a.className = "metrics-list-name";
          a.textContent = currentBlindPick.title || ("Scene " + currentBlindPick.id);
          a.href = "/scenes/" + encodeURIComponent(currentBlindPick.id);
          blindResult.appendChild(a);
          const perfMeta = document.createElement("div");
          perfMeta.className = "metrics-list-sub";
          perfMeta.textContent = (currentBlindPick.studio ? currentBlindPick.studio.name + " · " : "") +
            (currentBlindPick.performers || []).slice(0, 3).map((p) => p.name).join(", ");
          blindResult.appendChild(perfMeta);
        });
        mask.querySelector('[data-act="blind-reroll"]').addEventListener("click", blindSpin);
        blindResult.appendChild(mask);
      }
      blindCard.querySelector('[data-act="blind-spin"]').addEventListener("click", blindSpin);
      host.appendChild(blindCard);
    }

    const grid = document.createElement("div");
    grid.className = "metrics-grid";
    host.appendChild(grid);

    // Day × hour heatmap
    let c = card(grid, "When you watch — day-of-week × hour", k.hasRichHistory ? null : "Only last-played timestamps available; install Stash ≥ 0.24 for the full per-play heatmap.");
    if (ph.heatmapTotal > 0) renderHeatmap(c, ph.heatmap);
    else emptyHint(c, "No play timestamps yet.");

    // Hour-of-day marginal
    c = card(grid, "By hour of day");
    chart(c, "bar", {
      labels: HOUR_LABELS,
      datasets: [{ label: "Plays", data: ph.byHour || [], backgroundColor: fmt.color(0) }],
    });

    // Day-of-week marginal
    c = card(grid, "By day of week");
    chart(c, "bar", {
      labels: DOW_LABELS,
      datasets: [{ label: "Plays", data: ph.byDow || [], backgroundColor: fmt.color(2) }],
    });

    // Play volume per month
    c = card(grid, "Plays per month");
    const m = ph.monthly || { labels: [], counts: [] };
    chart(c, "line", {
      labels: m.labels,
      datasets: [{
        label: "Plays",
        data: m.counts,
        borderColor: fmt.color(0),
        backgroundColor: fmt.color(0) + "33",
        tension: 0.25,
        fill: true,
        pointRadius: 2,
      }],
    });

    // Most-watched scenes
    c = card(grid, "Most-watched scenes",
      "click a title to open the scene");
    rankingList(c, ph.mostWatchedScenes || [],
      (s) => s.playCount + " plays · " + fmt.duration(s.playDuration),
      (s) => (s.performers || []).join(", "),
      "Nothing played yet.");

    // Most-watched performers
    c = card(grid, "Most-watched performers");
    rankingList(c, ph.mostWatchedPerformers || [],
      (p) => p.playCount + " plays · " + fmt.duration(p.playDuration),
      (p) => [p.country, p.favorite ? "★ favorite" : "", (p.rating100 || 0) > 0 ? "★ " + p.rating100 : ""].filter(Boolean).join(" · "),
      "Nothing played yet.");

    // Most-watched tags
    c = card(grid, "Most-watched tags",
      "tag plays = Σ play_count of scenes that carry the tag");
    chart(c, "bar", {
      labels: (ph.topTagsByPlays || []).map((t) => t.label),
      datasets: [{ label: "Plays", data: (ph.topTagsByPlays || []).map((t) => t.value), backgroundColor: fmt.color(3) }],
    }, { indexAxis: "y" });

    // ---- Least-watched trio — mirror of the most-watched lists ranked
    //      from lowest play count upward. Different from the neglect-
    //      scored backlog below: this one includes rarely-played items,
    //      not just never-played.
    c = card(grid, "Least-watched scenes",
      "bottom 25 by play count — 0-plays first, then 1, then 2, …");
    rankingList(c, ph.leastWatchedScenes || [],
      (s) => s.playCount + " play" + (s.playCount === 1 ? "" : "s") +
        (s.rating100 != null ? " · ★ " + s.rating100 : ""),
      (s) => (s.performers || []).slice(0, 4).join(", "));

    c = card(grid, "Least-watched performers",
      "who's featured on scenes you never open — includes 0-play performers");
    rankingList(c, ph.leastWatchedPerformers || [],
      (p) => p.playCount + " play" + (p.playCount === 1 ? "" : "s") +
        " · " + p.sceneCount + " scene" + (p.sceneCount === 1 ? "" : "s"),
      (p) => [p.country, p.favorite ? "★ favorite" : "",
        p.rating100 != null ? "★ " + p.rating100 : ""].filter(Boolean).join(" · "));

    c = card(grid, "Least-watched tags",
      "tag plays ranked ascending — 0-play tags first");
    chart(c, "bar", {
      labels: (ph.leastWatchedTags || []).map((t) => t.label +
        (t.sceneCount ? " (" + t.sceneCount + " scenes)" : "")),
      datasets: [{
        label: "Plays",
        data: (ph.leastWatchedTags || []).map((t) => t.value),
        backgroundColor: fmt.color(1),
      }],
    }, { indexAxis: "y" });

    // Peak intensity window — the O-weighted DoW×hour heatmap.
    if (payload.fun && payload.fun.peakIntensity) {
      c = card(grid, "Peak intensity window",
        "avg O per play — when your body actually engages. Cell = avg o_counter of scenes played in that hour.");
      const pi = payload.fun.peakIntensity;
      const wrap = document.createElement("div");
      wrap.className = "metrics-heatmap metrics-playhist";
      const gridEl = document.createElement("div");
      gridEl.className = "metrics-heatmap-grid";
      gridEl.style.gridTemplateColumns = "70px repeat(24, 1fr)";
      const corner = document.createElement("div");
      corner.className = "metrics-heatmap-corner";
      corner.textContent = "DoW \\ Hr";
      gridEl.appendChild(corner);
      for (const h of HOUR_LABELS) {
        const ch = document.createElement("div");
        ch.className = "metrics-heatmap-col-head";
        ch.textContent = h;
        gridEl.appendChild(ch);
      }
      let max = 0;
      for (const row of pi.intensity) for (const v of row) if (v > max) max = v;
      if (!max) max = 1;
      for (let d = 0; d < 7; d++) {
        const rh = document.createElement("div");
        rh.className = "metrics-heatmap-row-head";
        rh.textContent = DOW_LABELS[d];
        gridEl.appendChild(rh);
        for (let h = 0; h < 24; h++) {
          const v = pi.intensity[d][h] || 0;
          const cell = document.createElement("div");
          cell.className = "metrics-heatmap-cell";
          const a = v / max;
          cell.style.background = "rgba(247, 110, 158, " + (a * 0.85 + 0.04).toFixed(3) + ")";
          cell.textContent = v > 0 ? v.toFixed(1) : "";
          cell.title = DOW_LABELS[d] + " " + HOUR_LABELS[h] + ":00 — avg O " + v.toFixed(2) +
            " over " + pi.playCount[d][h] + " plays";
          gridEl.appendChild(cell);
        }
      }
      wrap.appendChild(gridEl);
      c.appendChild(wrap);
    }

    // Dry-spell / binge cycle histogram — gaps between play days.
    if (payload.fun && payload.fun.drySpell) {
      c = card(grid, "Dry spell / binge cycle",
        "gap between consecutive play-days");
      const dry = payload.fun.drySpell;
      chart(c, "bar", {
        labels: ["Same day", "Next day", "≤ 1 week", "≤ 2 weeks", "≤ 1 month", "> 1 month"],
        datasets: [{
          label: "Play-day pairs",
          data: [dry.buckets.sameDay, dry.buckets.nextDay, dry.buckets.week,
            dry.buckets.twoWeeks, dry.buckets.month, dry.buckets.dry],
          backgroundColor: ["#3ecf8e", "#66d99a", "#f7c948", "#f7a26e", "#f76e6e", "#56606b"],
        }],
      });
    }

    // Optimal duration — avg O per duration bucket.
    if (payload.fun && payload.fun.optimalDuration) {
      c = card(grid, "Optimal duration",
        "avg O per scene per duration bucket — which lengths deliver");
      const od = payload.fun.optimalDuration;
      chart(c, "bar", {
        labels: od.map((b) => b.name),
        datasets: [{
          label: "Avg O / scene",
          data: od.map((b) => b.avgOPerScene),
          backgroundColor: fmt.color(3),
        }],
      });
    }

    // Completion rate donut — surfaces what share of plays actually finish.
    if (ph.completionBuckets) {
      c = card(grid, "Completion rate", "play_duration / (scene duration × play count)");
      const b = ph.completionBuckets;
      chart(c, "doughnut", {
        labels: ["Abandoned (<20%)", "Partial (20–80%)", "Watched (≥80%)", "Repeat (≥3 plays)"],
        datasets: [{
          data: [b.abandoned || 0, b.partial || 0, b.watched || 0, b.repeat || 0],
          backgroundColor: ["#f76e6e", "#f7c948", "#3ecf8e", "#4f8ef7"],
        }],
      }, { scales: undefined });
    }

    // ---- Section header for the "backlog" / never-played view ---------
    const divider = document.createElement("div");
    divider.className = "metrics-section-header";
    divider.innerHTML =
      '<div class="metrics-section-step">Backlog</div>' +
      '<div class="metrics-section-title">What you haven\'t watched yet</div>' +
      '<div class="metrics-section-sub">Scenes, performers, and tags with zero recorded plays. Each item scored 0–100 — higher = more valuable to watch soon. Score combines rating, how long it\'s been on the shelf, and how much content is waiting.</div>';
    host.appendChild(divider);

    // Colour band for the neglect score badge.
    function scoreColor(score) {
      if (score >= 75) return "#3ecf8e";  // green — high-value backlog
      if (score >= 55) return "#f7c948";  // yellow
      if (score >= 35) return "#f7a26e";  // orange
      return "#8e98a0";                    // grey — low priority
    }
    function scoreBadge(score) {
      const s = document.createElement("div");
      s.className = "metrics-match-score";
      s.style.background = scoreColor(score);
      s.textContent = score;
      s.title = "Neglect score — higher = more valuable to watch";
      return s;
    }
    function headWithScore(nameEl, score) {
      const head = document.createElement("div");
      head.className = "metrics-match-head";
      head.appendChild(nameEl);
      head.appendChild(scoreBadge(score));
      return head;
    }

    const backlogGrid = document.createElement("div");
    backlogGrid.className = "metrics-grid";
    host.appendChild(backlogGrid);

    // Never-played scenes.
    c = card(backlogGrid, "Never-played scenes",
      "top " + Math.min(25, (ph.neverPlayedScenes || []).length) + " · sorted by neglect score");
    if (!(ph.neverPlayedScenes || []).length) {
      emptyHint(c, "Everything's been played at least once. Impressive.");
    } else {
      const list = document.createElement("div");
      list.className = "metrics-match-list";
      for (const s of ph.neverPlayedScenes.slice(0, 25)) {
        const card = document.createElement("div");
        card.className = "metrics-match-card";
        const a = document.createElement("a");
        a.className = "metrics-match-name";
        a.textContent = s.title;
        a.href = "/scenes/" + encodeURIComponent(s.id);
        card.appendChild(headWithScore(a, s.neglectScore));
        const badges = document.createElement("div");
        badges.className = "metrics-match-tags";
        if (s.rating100 != null) badges.appendChild(makeBadge("★ " + s.rating100));
        if (s.durationSec) badges.appendChild(makeBadge(fmt.duration(s.durationSec)));
        if (s.studio) badges.appendChild(makeBadge(s.studio));
        if (s.ageDays) badges.appendChild(makeBadge(s.ageDays + "d in library"));
        card.appendChild(badges);
        if (s.performers && s.performers.length) {
          const meta = document.createElement("div");
          meta.className = "metrics-match-meta";
          meta.textContent = "with " + s.performers.slice(0, 5).join(", ");
          card.appendChild(meta);
        }
        list.appendChild(card);
      }
      c.appendChild(list);
    }

    // Neglected performers.
    c = card(backlogGrid, "Neglected performers",
      "have scenes in your library but you've never watched any");
    if (!(ph.neverPlayedPerformers || []).length) {
      emptyHint(c, "Every performer with content has been watched. Well done.");
    } else {
      const list = document.createElement("div");
      list.className = "metrics-match-list";
      for (const p of ph.neverPlayedPerformers.slice(0, 25)) {
        const card = document.createElement("div");
        card.className = "metrics-match-card";
        const a = document.createElement("a");
        a.className = "metrics-match-name";
        a.textContent = p.name;
        a.href = "/performers/" + encodeURIComponent(p.id);
        card.appendChild(headWithScore(a, p.neglectScore));
        const badges = document.createElement("div");
        badges.className = "metrics-match-tags";
        badges.appendChild(makeBadge(p.sceneCount + " scene" + (p.sceneCount === 1 ? "" : "s")));
        if (p.rating100 != null) badges.appendChild(makeBadge("★ " + p.rating100));
        if (p.country) badges.appendChild(makeBadge(p.country));
        if (p.favorite) badges.appendChild(makeBadge("★ favorite"));
        card.appendChild(badges);
        list.appendChild(card);
      }
      c.appendChild(list);
    }

    // Untouched tags.
    c = card(backlogGrid, "Untouched tag categories",
      "tags on scenes you have but never played");
    if (!(ph.untouchedTags || []).length) {
      emptyHint(c, "Every tag category has at least one recorded play.");
    } else {
      const list = document.createElement("div");
      list.className = "metrics-match-list";
      for (const t of ph.untouchedTags.slice(0, 30)) {
        const card = document.createElement("div");
        card.className = "metrics-match-card";
        const name = document.createElement("div");
        name.className = "metrics-match-name";
        name.textContent = t.label;
        card.appendChild(headWithScore(name, t.neglectScore));
        const badges = document.createElement("div");
        badges.className = "metrics-match-tags";
        badges.appendChild(makeBadge(t.sceneCount + " scene" + (t.sceneCount === 1 ? "" : "s") + " waiting"));
        if (t.avgRating != null) badges.appendChild(makeBadge("avg ★ " + t.avgRating));
        card.appendChild(badges);
        list.appendChild(card);
      }
      c.appendChild(list);
    }
  }

  function makeBadge(text) {
    const b = document.createElement("span");
    b.className = "metrics-badge";
    b.textContent = text;
    return b;
  }

  ns.charts = ns.charts || {};
  ns.charts.play = { render };
})();
