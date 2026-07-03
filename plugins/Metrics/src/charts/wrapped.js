(function () {
  "use strict";
  const ns = (window.StashMetrics = window.StashMetrics || {});
  const fmt = ns.format;

  const DOW_LABELS = ["Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays", "Sundays"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Each slide is `{ id, title, primary, secondary, extra?, gradient }`.
  function buildSlides(w) {
    const slides = [];
    slides.push({
      id: "intro", gradient: "linear-gradient(135deg,#4f8ef7 0%, #c98ef7 100%)",
      title: "Your " + w.year, primary: "in Stash",
      secondary: "let's look back",
    });
    slides.push({
      id: "totals", gradient: "linear-gradient(135deg,#3ecf8e 0%, #4f8ef7 100%)",
      title: w.year + " in numbers",
      primary: fmt.int(w.totals.plays) + " plays",
      secondary: w.totals.totalHours + " hours across " + w.totals.daysActive + " active days",
      extra: [
        w.totals.uniqueScenes + " scenes",
        w.totals.uniquePerformers + " performers",
        w.totals.uniqueTags + " tags",
        w.totals.uniqueStudios + " studios",
      ],
    });
    if (w.topScenes && w.topScenes.length) {
      const s = w.topScenes[0];
      slides.push({
        id: "top_scene", gradient: "linear-gradient(135deg,#f76e6e 0%, #f7c948 100%)",
        title: "Your #1 scene",
        primary: s.title,
        secondary: (s.studio ? s.studio + " · " : "") + s.plays + " plays",
        link: s.id ? "/scenes/" + s.id : null,
        extra: w.topScenes.slice(1, 5).map((x) => "· " + x.title + "  (" + x.plays + ")"),
      });
    }
    if (w.topPerformers && w.topPerformers.length) {
      const p = w.topPerformers[0];
      slides.push({
        id: "top_perf", gradient: "linear-gradient(135deg,#c98ef7 0%, #f76ec3 100%)",
        title: "Your #1 performer",
        primary: p.name,
        secondary: (p.country ? p.country + " · " : "") + p.plays + " plays",
        link: p.id ? "/performers/" + p.id : null,
        extra: w.topPerformers.slice(1, 5).map((x) => "· " + x.name + "  (" + x.plays + ")"),
      });
    }
    if (w.topStudios && w.topStudios.length) {
      const st = w.topStudios[0];
      slides.push({
        id: "top_studio", gradient: "linear-gradient(135deg,#f7a26e 0%, #f76e6e 100%)",
        title: "Studio of the year",
        primary: st.name,
        secondary: st.plays + " plays",
        extra: w.topStudios.slice(1, 5).map((x) => "· " + x.name + "  (" + x.plays + ")"),
      });
    }
    if (w.topTags && w.topTags.length) {
      slides.push({
        id: "top_tags", gradient: "linear-gradient(135deg,#6ec3f7 0%, #3ecf8e 100%)",
        title: "You couldn't get enough of…",
        primary: w.topTags[0].name,
        secondary: w.topTags[0].plays + " plays",
        extra: w.topTags.slice(1, 5).map((x) => "· " + x.name + "  (" + x.plays + ")"),
      });
    }
    if (w.peakDay) {
      slides.push({
        id: "peak_day", gradient: "linear-gradient(135deg,#f7c948 0%, #f76ec3 100%)",
        title: "Biggest binge day",
        primary: w.peakDay.date,
        secondary: w.peakDay.plays + " plays in one day",
      });
    }
    if (w.longestStreak && w.longestStreak.length >= 2) {
      slides.push({
        id: "streak", gradient: "linear-gradient(135deg,#f76e6e 0%, #c98ef7 100%)",
        title: "Longest streak",
        primary: w.longestStreak.length + " days",
        secondary: w.longestStreak.start + " → " + w.longestStreak.end,
      });
    }
    slides.push({
      id: "peak_time", gradient: "linear-gradient(135deg,#4f8ef7 0%, #6ec3f7 100%)",
      title: "Prime time",
      primary: DOW_LABELS[w.peakDow] + " @ " + String(w.peakHour).padStart(2, "0") + ":00",
      secondary: "when the world sleeps, you press play",
    });
    if (w.totals.uniqueCountries > 0) {
      slides.push({
        id: "countries", gradient: "linear-gradient(135deg,#3ecf8e 0%, #f7c948 100%)",
        title: "Countries explored",
        primary: w.totals.uniqueCountries + "",
        secondary: "worth of passport stamps",
      });
    }
    if (w.newDiscoveries && w.newDiscoveries.length) {
      slides.push({
        id: "discovery", gradient: "linear-gradient(135deg,#f76ec3 0%, #4f8ef7 100%)",
        title: "Biggest new discovery",
        primary: w.newDiscoveries[0].name,
        secondary: w.newDiscoveries[0].plays + " plays · first year in your rotation",
        link: w.newDiscoveries[0].id ? "/performers/" + w.newDiscoveries[0].id : null,
        extra: w.newDiscoveries.slice(1).map((x) => "· " + x.name + "  (" + x.plays + ")"),
      });
    }
    slides.push({
      id: "vibe", gradient: "linear-gradient(135deg,#c98ef7 0%, #f76e6e 100%)",
      title: "Your " + w.year + " vibe",
      primary: w.vibe,
      secondary: "keep going, see you next year",
    });
    return slides;
  }

  function renderSlide(slide) {
    const el = document.createElement("div");
    el.className = "metrics-wrapped-slide";
    el.style.background = slide.gradient;
    const inner = document.createElement("div");
    inner.className = "metrics-wrapped-slide-inner";

    const title = document.createElement("div");
    title.className = "metrics-wrapped-title";
    title.textContent = slide.title;
    inner.appendChild(title);

    const primary = document.createElement("div");
    primary.className = "metrics-wrapped-primary";
    if (slide.link) {
      const a = document.createElement("a");
      a.href = slide.link;
      a.textContent = slide.primary;
      primary.appendChild(a);
    } else {
      primary.textContent = slide.primary;
    }
    inner.appendChild(primary);

    if (slide.secondary) {
      const secondary = document.createElement("div");
      secondary.className = "metrics-wrapped-secondary";
      secondary.textContent = slide.secondary;
      inner.appendChild(secondary);
    }
    if (slide.extra && slide.extra.length) {
      const ex = document.createElement("ul");
      ex.className = "metrics-wrapped-extra";
      for (const line of slide.extra) {
        const li = document.createElement("li");
        li.textContent = line;
        ex.appendChild(li);
      }
      inner.appendChild(ex);
    }
    el.appendChild(inner);
    return el;
  }

  function render(host, payload, opts) {
    host.innerHTML = "";
    const w = payload && payload.wrapped;
    if (!w || !w.available) {
      const empty = document.createElement("div");
      empty.className = "metrics-empty";
      empty.textContent = (w && w.reason) || "No wrapped available. Run Update Metrics Cache with play history.";
      host.appendChild(empty);
      return;
    }
    const slides = buildSlides(w);
    let idx = 0;

    const container = document.createElement("div");
    container.className = "metrics-wrapped-container";

    const stage = document.createElement("div");
    stage.className = "metrics-wrapped-stage";
    container.appendChild(stage);

    const progress = document.createElement("div");
    progress.className = "metrics-wrapped-progress";
    for (let i = 0; i < slides.length; i++) {
      const bar = document.createElement("div");
      bar.className = "metrics-wrapped-progress-bar";
      progress.appendChild(bar);
    }
    container.appendChild(progress);

    const controls = document.createElement("div");
    controls.className = "metrics-wrapped-controls";
    controls.innerHTML =
      '<button class="metrics-btn" data-act="prev">← Back</button>' +
      '<button class="metrics-btn" data-act="restart">↺ Restart</button>' +
      '<button class="metrics-btn btn-primary" data-act="next">Next →</button>';
    container.appendChild(controls);

    host.appendChild(container);

    function goto(i) {
      idx = Math.max(0, Math.min(slides.length - 1, i));
      stage.innerHTML = "";
      stage.appendChild(renderSlide(slides[idx]));
      const bars = progress.querySelectorAll(".metrics-wrapped-progress-bar");
      bars.forEach((b, j) => b.classList.toggle("active", j <= idx));
      controls.querySelector('[data-act="prev"]').disabled = idx === 0;
      const nextBtn = controls.querySelector('[data-act="next"]');
      nextBtn.textContent = idx === slides.length - 1 ? "Done" : "Next →";
    }
    controls.querySelector('[data-act="prev"]').addEventListener("click", () => goto(idx - 1));
    controls.querySelector('[data-act="next"]').addEventListener("click", () => {
      if (idx < slides.length - 1) goto(idx + 1);
    });
    controls.querySelector('[data-act="restart"]').addEventListener("click", () => goto(0));
    // Keyboard nav.
    container.tabIndex = 0;
    container.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") goto(idx - 1);
      else if (e.key === "ArrowRight" || e.key === " ") { goto(idx + 1); e.preventDefault(); }
    });
    goto(0);
  }

  ns.charts = ns.charts || {};
  ns.charts.wrapped = { render };
})();
