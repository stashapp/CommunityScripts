# Architecture

A short tour of how the plugin is wired up, why things sit where they do, and what the load-time / runtime / data flow looks like.

The plugin currently ships 16 dashboard tabs (Overview, Performers, Tags, Networks, Trends, Play, Archetypes, Insights, Correlations, Matches, Fantasy, Quality, Wrapped, Bingo, Tag Optimizer, Cleanup) and 5 runnable tasks, all backed by a single pure aggregator run either in-browser (`src/dashboard.js`) or Node (`backend/aggregate.js`).

## Big picture

```
                       ┌──────────────────────┐
                       │  Stash server (Go)   │
                       │  GraphQL /graphql    │
                       └─────────┬────────────┘
                                 │ (UMD JS + CSS served from <plugin>/)
        ┌────────────────────────┴────────────────────────────┐
        │                                                     │
┌───────▼────────┐                                  ┌─────────▼──────────┐
│ Browser (UI)   │                                  │ Node tasks/hooks   │
│ ──────────────│                                  │ ────────────────── │
│  metrics.js   │   reads/writes  ┌──────────────┐ │  compute_metrics.js│
│   ↓ patches   │ ─────────────►  │ assets/      │ │   ↓                │
│  dashboard.js │                 │ metrics-     │◄│  aggregate.js      │
│   ↓ uses      │                 │ cache.json   │ │   ↓ writes         │
│  charts/*.js  │                 └──────────────┘ │  report.{html,csv} │
│  data/*.js    │                                  │  stash_client.js   │
│  utils/*.js   │                                  └────────────────────┘
└────────────────┘
```

Two equally-capable computation paths:

- **Live** — the dashboard's `loadMetrics()` calls Stash GraphQL directly through the `PluginApi.GQL` client, runs `ns.aggregate()`, caches the result in `localStorage`.
- **Cached** — the Node task / hook runs the same aggregator over the same field set, writes `assets/metrics-cache.json`. The dashboard prefers this file on every page load (cheap fetch, no GraphQL hits) and falls back to live only if the file is missing or older than `cacheTtlMinutes`.

Both paths produce the **exact same payload shape**, so the chart modules don't need to know which side computed the data.

## Module map

| File | Role | Notes |
| --- | --- | --- |
| `Metrics.yml` | Manifest. Declares JS/CSS loads, runnable tasks, hooks, and the typed settings UI. | This is the only file Stash actually reads to discover the plugin. Filename derives the pluginID → mount URL is `/plugin/Metrics/…`. **Stash's YAML schema rejects unknown top-level keys** (`author:`, `license:`, etc.) — the whole plugin fails to load, so stick to the documented fields. |
| `src/metrics.js` | Entry point. Registers the `/plugins/metrics` SPA route (plural — `/plugin/` is reserved by Stash for static plugin files) and patches the nav. | Defers until `window.PluginApi` exists — Stash's bundle loads after our scripts on a cold start. |
| `src/dashboard.js` | Imperative mount. Also hosts `ns.aggregate()` — the same code the Node side runs. | DOM-driven (no React tree) so it's robust against Stash's evolving React component layout. |
| `src/charts/*.js` | One module per dashboard tab. Each exposes `render(host, payload, opts)`. | Pure consumers — they never touch GraphQL. v1.1 adds `correlations.js` (heatmaps, bubble, parallel coords, Cramér's V / Pearson bar) and `matches.js` (preference form, live re-rank). |
| `src/utils/correlations.js` | Browser mirror of `backend/correlations.js` + `backend/recommender.js`. | Same algorithm both sides; the Matches tab re-ranks in-browser when the user tweaks weights. |
| `src/data/preferences.js` | localStorage-backed preference profile loader. Falls back to the `preferenceProfile` plugin setting. | Owns serialisation, defaults, import/export. |
| `backend/correlations.js` | Cramér's V + Pearson r + heatmaps + bubble + parallel coordinates. | Pure; smoke-tested. |
| `backend/recommender.js` | Profile normaliser + per-performer scoring + per-scene scoring. | Pure; smoke-tested. |
| `backend/play_history.js` | DoW × hour-of-day heatmap, streak math, most-watched rankings. | Pure; smoke-tested. v1.2. |
| `backend/clustering.js` | k-means++ + Lloyd's algorithm + cosine similarity over a normalised attribute + tag feature vector. | Pure; deterministic PRNG seeded off population length. v1.2. |
| `backend/diversity.js` | Shannon / Simpson / Gini-Simpson + coverage and gap analysis. | Pure; smoke-tested. v1.2. |
| `backend/temporal.js` | Release year + career timelines + tag evolution + active-performers-per-year. | Pure. v1.2. |
| `backend/fantasy.js` | Seed selection + consensus rule + multi-axis combinations + derived profile. | Pure. v1.2. |
| `backend/year_review.js` | Calendar-year aggregation + standalone offline HTML. | Pure. v1.2. |
| `backend/quality.js` | Composite library-health score + hidden-gem ranking + over/underrated z-scores + completion-rate buckets. Extended in v1.6 with guilty pleasures, repeat offenders, buried treasure, one-hit wonders, tag potency, rating drift. | Pure; smoke-tested. |
| `backend/fun.js` | Nine fun/spicy computations: studio loyalty (HHI), peak session (gap-clustered), dry-spell / binge-cycle, peak-intensity heatmap (avg O per play), optimal duration, kink evolution, time capsule, country tourism, personality read. | Pure. v1.6. |
| `backend/wrapped.js` | Yearly Wrapped payload builder: auto-picks the best year, aggregates plays / performers / tags / studios / days / streaks / discoveries, picks a vibe label. | Pure. v1.7. |
| `backend/bingo.js` | 28+ challenge templates + a deterministic seeded shuffle. Precomputes a per-library summary so each cell's check is O(1). | Pure. v1.7. |
| `backend/nudges.js` | Six-source suggestion pool for the Overview banner. Reads the Quality block for buried-treasure and hidden-gem input. | Pure. v1.7. |
| `backend/tagopt.js` | Near-duplicate clustering (identical-normalised + Levenshtein ≤ 2 + singular/plural), always-together pair analysis via Jaccard + asymmetric implication, hierarchy audit, cleanup-score composite. | Pure. v1.8. |
| `backend/cleanup.js` | Per-performer + per-scene missing-field scan across 10 performer fields + 6 scene fields. Sorts favourites-first / by scene count for highest-impact fixes. Uses the pre-filter arrays so the gender filter doesn't hide gaps. | Pure. v1.9. |
| `backend/excel.js` | Multi-sheet `.xlsx` writer (SheetJS) — Scenes, Performers, Tags, Studios, junctions, co-occurrence, correlations, top matches, quality. | Loads `xlsx` lazily with a helpful error if it's not installed. v1.3. |
| `src/data/graphql.js` | Wraps `PluginApi.GQL` plus a `fetch` fallback. Defines paginated `fetchAll(entity, fields)`. | Field sets duplicated in `backend/stash_client.js`; see "Why duplicate?". |
| `src/data/cache.js` | localStorage helpers + backend-cache fetcher. | Tries a couple of plugin-slug URLs (`/plugin/Metrics/...`, `/plugin/metrics/...`) because Stash's served slug isn't deterministic across configs. |
| `src/utils/*.js` | Tiny stats library + formatting helpers + a fixed dark-theme palette. | No external deps. |
| `backend/stash_client.js` | Node GraphQL client over global `fetch`. Reads `STASH_*` env vars. | Same pagination loop as the browser. |
| `backend/aggregate.js` | Pure aggregator. | Independent module so `npm test` can exercise it offline. |
| `backend/report.js` | Writes the CSV bundle + standalone HTML report. | The HTML loads the same vendored Chart.js (`../../assets/lib/chart.umd.min.js`). |
| `backend/compute_metrics.js` | Entry script for the runnable tasks and hooks. | Reads stdin (Stash sends a small JSON blob) but doesn't depend on it. |

## Why duplicate the GraphQL field sets?

The same field list exists in `src/data/graphql.js` and `backend/stash_client.js`. There's no build step, so a shared import isn't possible without introducing one — and a build step would force every change to be re-bundled before Stash could pick it up. The duplication is cheap (~30 lines) and is documented in the README's "Extending the plugin" section so contributors update both.

## Why no React tree?

`PluginApi.React` and `PluginApi.libraries.Bootstrap` are exposed by Stash, but the Bootstrap component shape has shifted across Stash versions, and writing JSX without a bundler is awkward. The plugin uses a thin React shell (just enough to register a `<Route>`) and then mounts the dashboard imperatively. The chart libraries (Chart.js) are themselves DOM-driven, so the React vs. plain-DOM choice has no perf consequence.

## Cache lifecycle

```
   On dashboard load:
     1. cache.read()           ← localStorage
     2. if fresh per TTL       → render
     3. else cache.fetchBackendCache()   ← /plugin/.../assets/metrics-cache.json
     4. if returned            → localStorage.write + render
     5. else computeLive()     ← live GraphQL, then localStorage.write + render
```

```
   On task / hook invocation:
     1. backend/stash_client    ← paginated GraphQL
     2. backend/aggregate       ← pure compute
     3. write assets/metrics-cache.json   (every mode)
     4. if full-report:
          write cache/reports/<ts>/metrics.json
          write cache/reports/<ts>/report.html
          write cache/reports/<ts>/csv/*.csv
          copy report.html → cache/reports/latest.html
```

## Performance notes

- **Pagination**: backend pages performers at 250/page, scenes at 250/page, tags/studios at 500/page. The hard safety stop is 1000 pages (250 000 scenes / 500 000 tags) — well past the typical library.
- **Co-occurrence is O(n²) on tags/performers per scene.** For a scene with ~25 tags that's 300 pairs; for a 30k-scene library that's ~9M increments — comfortable in Node, but in the browser we cap the co-occurrence ranking at the top 200 pairs.
- **Network graph is capped at 50 nodes** with a degree-weighted selection; the vanilla force-directed layout runs ~250 iterations and finishes well under 50 ms for that node count.
- **No frame-by-frame animation**: Chart.js animations are kept at 250 ms (`animation.duration` override) so large charts don't lag.

## What the plugin intentionally doesn't do

- **No DB writes.** Everything is read-only against Stash; the only files the plugin touches are inside its own plugin directory.
- **No headless browser dependency** for the HTML report. The report is a single self-contained HTML file that references the already-vendored Chart.js; no Puppeteer / wkhtmltopdf.
- **No real PDF export.** A future version could add Puppeteer-based PDF rendering, but it's not pulled in by default because the dep is heavy and most users are happy printing the HTML.
- **No background polling.** The dashboard doesn't auto-refresh. Refresh is explicit (button) or task-driven.

## Extending

See README → [Extending the plugin](../README.md#extending-the-plugin). The three-step recipe is: add to `aggregate.js` → render in `charts/*.js` → export in `report.js`.

## Version log

| Version | Highlights |
| --- | --- |
| 1.0 | Overview / Performers / Tags / Networks / Trends. JSON + CSV + HTML report task. |
| 1.1 | Correlations tab (Cramér's V / Pearson / heatmaps / bubbles / parallel coords) + Matches tab (preference profile + weighted scoring). |
| 1.2 | Play / Archetypes / Insights / Fantasy tabs. Year-in-Review task. Rating-vs-attribute heatmaps on Correlations. |
| 1.3 | Quality tab (health score, hidden gems, over/under z-scores, completion). Scene recipes on Fantasy. Excel export task (SheetJS). Library-health KPI on Overview. |
| 1.6 | 18 fun/spicy metrics: personality read, studio loyalty, peak session, dry-spell / binge-cycle, peak-intensity heatmap, optimal duration, kink evolution, time capsule, country tourism map, body-type calibration, compatibility widget. Quality-tab extensions: guilty pleasures, repeat offenders, buried treasure, one-hit wonders, tag potency, rating drift. |
| 1.7 | Wrapped tab (yearly slideshow), Bingo tab (5×5 achievement grid), Blind Pick (Play), Nudge banner (Overview). |
| 1.8 | Tag Optimizer tab — near-duplicate clusters, merge / specialisation pair analysis, hierarchy audit, cleanup score. |
| 1.9 | Cleanup tab — performer + scene metadata gap finder with chip filter bar (ethnicity default), favourites-first sort, edit deep-links, metadata-health score. |
