(function () {
  "use strict";
  const ns = (window.StashMetrics = window.StashMetrics || {});

  const SEED_KEY = "stashmetrics_bingo_seed";

  function render(host, payload, opts) {
    host.innerHTML = "";
    const bingo = payload && payload.bingo;
    if (!bingo || !bingo.cells) {
      const empty = document.createElement("div");
      empty.className = "metrics-empty";
      empty.textContent = "Bingo not in cache. Run Update Metrics Cache.";
      host.appendChild(empty);
      return;
    }

    // KPI row.
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
    kpis.appendChild(kpi("Squares completed", bingo.completed + " / " + bingo.total, bingo.blackout ? "BLACKOUT!" : ""));
    kpis.appendChild(kpi("Lines completed", bingo.completedLines,
      bingo.hasBingo ? "BINGO 🎉" : "closest 5-in-a-row"));
    kpis.appendChild(kpi("Card seed", bingo.seed, "same seed = same card"));

    // Controls.
    const controls = document.createElement("div");
    controls.className = "metrics-bingo-controls";
    controls.innerHTML =
      '<button class="metrics-btn" data-act="reshuffle">🎲 New card</button> ' +
      '<span class="metrics-bingo-hint">Shuffle picks a fresh 24-of-N challenge set. Your current progress is derived from library state, not saved.</span>';
    host.appendChild(controls);
    controls.querySelector('[data-act="reshuffle"]').addEventListener("click", function () {
      // Persist a fresh seed so the next cache rebuild picks a new card.
      const newSeed = Math.floor(Math.random() * 9000) + 1000;
      try { window.localStorage.setItem(SEED_KEY, String(newSeed)); } catch (e) { /* ignore */ }
      alert("New card seed saved (" + newSeed + "). Re-run Update Metrics Cache to apply.");
    });

    // Grid.
    const wrap = document.createElement("div");
    wrap.className = "metrics-card";
    const title = document.createElement("div");
    title.className = "metrics-card-title";
    title.textContent = "Your bingo card";
    wrap.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "metrics-bingo-grid";
    for (const cell of bingo.cells) {
      const c = document.createElement("div");
      c.className = "metrics-bingo-cell" + (cell.done ? " done" : "") + (cell.id === "free" ? " free" : "");
      const t = document.createElement("div");
      t.className = "metrics-bingo-cell-title";
      t.textContent = cell.title;
      c.appendChild(t);
      if (cell.hint) {
        const h = document.createElement("div");
        h.className = "metrics-bingo-cell-hint";
        h.textContent = cell.hint;
        c.appendChild(h);
      }
      if (cell.done && cell.id !== "free") {
        const badge = document.createElement("div");
        badge.className = "metrics-bingo-check";
        badge.textContent = "✓";
        c.appendChild(badge);
      }
      grid.appendChild(c);
    }
    wrap.appendChild(grid);
    host.appendChild(wrap);
  }

  ns.charts = ns.charts || {};
  ns.charts.bingo = { render };
})();
