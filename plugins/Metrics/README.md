# Stash Metrics Plugin

A community plugin for [Stash](https://github.com/stashapp/stash) that turns your library into a rich, interactive analytics dashboard. The plugin adds a dedicated **Metrics** tab in the main nav, plus five runnable tasks (full report exporter, cache refresher, match finder, Year-in-Review, Excel export).

The dashboard is **performer- and tag-centric**: it cross-tabs every available performer attribute (gender, country, ethnicity, age, height, body modifications, career length, measurements) with tag and scene activity, surfaces collaboration networks, and tracks library growth over time.

**Version 1.1** adds an **advanced correlations module** and a **preference-driven "perfect match" finder**: configure your ideal mix of countries / eye colors / cup sizes / tags / O-count and the plugin scores every performer and every scene against the profile in real time.

**Version 1.2** adds four more tabs and a Year-in-Review task: **Play** (day-of-week × hour-of-day heatmaps, most-watched performers/scenes/tags, streaks), **Archetypes** (k-means clustering of performers + cosine-similarity "similar to me" lookup), **Insights** (Shannon / Gini-Simpson diversity, gap analysis, release-year + career-timeline charts, tag evolution), and **Fantasy Builder** (reverse-engineers an ideal preference profile from a seed set of your favourites / top-rated / top-O performers and ranks the library against it). The **Correlations** tab also gains rating-vs-attribute heatmaps and a top-tags-by-rating ranking.

**Version 1.3** adds a **Quality** tab (composite library-health score, hidden gems, over-/underrated scene + performer anomalies via residual z-scores, **completion-rate** buckets), **scene recipes** in the Fantasy tab, completion-rate aggregation in the Play tab, a library-health KPI on the Overview tab, and a powerful **Export Full Library to Excel** task — a multi-sheet `.xlsx` workbook (Scenes, Performers, Tags, Studios, Scene × Performer + Scene × Tag junctions, Tag Co-occurrence, Correlations, Top Matches, Quality) with auto-filters and frozen headers on every sheet.

**Version 1.6** adds an **18-metric fun/spicy layer**: personality archetype read on the Overview tab, studio loyalty (HHI-based), a peak-session detector (longest continuous play run), a dry-spell / binge-cycle histogram, a **peak-intensity heatmap** (DoW × hour cells hold avg O per play, not raw play count), optimal-duration buckets, kink-evolution timeline (top 8 tags per month), a **time capsule** (top scenes / performers / tags from ±14 days six months ago), a **country tourism map** (flag-tile grid), a **body-type calibration heatmap** on Correlations (cup × height → avg O), a **compatibility widget** on Networks (pick two performers → 0-100 score with breakdown), and Quality-tab additions: guilty pleasures, repeat offenders, buried treasure, one-hit wonders, tag potency, rating drift.

**Version 1.7** adds four fun features: a **Wrapped tab** (Spotify-style yearly slideshow with keyboard nav), a **Bingo tab** (5×5 achievement grid seeded from 28+ challenge templates, cells auto-mark done from library state, detects lines and blackout), a **Blind Pick** on the Play tab (Roulette variant that hides names/thumbs, shows only duration/rating/tags with reveal + reroll), and a rotating **Nudge banner** on the Overview tab (draws from buried treasure / neglected favourites / untried high-rated / stale country / studio blindspot / hidden gem).

**Version 1.8** adds a **Tag Optimizer tab** — read-only inventory analysis with a composite cleanup score. Six surfaces of cleanup targets: **near-duplicate clusters** (three passes: identical-normalised, Levenshtein-close ≤2 edits, singular/plural), **rare** (< threshold scenes) and **orphan** tags (0 scenes), **always-together merge candidates** (Jaccard ≥ 0.95), **specialisation pairs** (A → B implies ≥ 98% but not the reverse), **under-tagged** (≤ 2 tags) and **over-tagged** (≥ 20 tags) scenes, **naming inconsistency** buckets (same word, mixed casing/hyphens/spaces), and a **hierarchy audit** (children whose scenes don't all carry the parent). Every finding is deep-linked to Stash's native tag/scene editor.

**Version 1.9** adds a **Cleanup tab** — metadata-gap finder for performers and scenes. A **chip filter bar** lets you focus on any missing field (ethnicity, country, eye color, hair color, gender, birthdate, height, measurements, tattoos, piercings — ethnicity is selected by default). The performer table sorts favourites first, then by scene count so highest-impact fixes surface at the top; every row has a direct edit deep-link. A **worst-offenders** table lists performers missing the most fields, and a **scene cleanup** section applies the same pattern to title / date / studio / rating / performers / tags gaps, ranked by play_count. Includes a composite **metadata-health score** 0-100 with letter grade.

---

## Contents

- [Highlights](#highlights)
- [Installation](#installation)
- [Configuration (plugin settings)](#configuration-plugin-settings)
- [Runnable tasks](#runnable-tasks)
- [Dashboard tour](#dashboard-tour)
- [How each metric is computed](#how-each-metric-is-computed)
- [Correlations module](#correlations-module)
- [Preference profile + match finder](#preference-profile--match-finder)
- [Play analytics](#play-analytics)
- [Archetypes and similarity](#archetypes-and-similarity)
- [Diversity and gap analysis](#diversity-and-gap-analysis)
- [Temporal trends](#temporal-trends)
- [Fantasy Builder](#fantasy-builder)
- [Quality insights](#quality-insights)
- [Fun / spicy metrics (v1.6)](#fun--spicy-metrics-v16)
- [Wrapped, Bingo, Blind pick, Nudges (v1.7)](#wrapped-bingo-blind-pick-nudges-v17)
- [Tag Optimizer (v1.8)](#tag-optimizer-v18)
- [Cleanup tab (v1.9)](#cleanup-tab-v19)
- [Year-in-Review](#year-in-review)
- [Excel export](#excel-export)
- [GraphQL examples](#graphql-examples)
- [Repository layout](#repository-layout)
- [Testing on a local Stash instance](#testing-on-a-local-stash-instance)
- [Troubleshooting](#troubleshooting)
- [Extending the plugin](#extending-the-plugin)

---

## Highlights

- **Overview tab** — KPIs (scenes, performers, tags, studios, images, galleries, storage), scene duration histogram, storage by studio (doughnut), resolution / codec / rating distributions, organization ratio.
- **Performers tab** — gender pie, ethnicity & country rankings, **age pyramid** by gender, height histogram, career-length vs. scene-count scatter, top-N rankings by scenes / total minutes / rating, body-modification stacks, parsed-measurement cup distribution.
- **Tags tab** — **tag cloud** + **treemap** + sorted top-N bar, **co-occurrence ranking**, two cross-tab **heatmaps** (tag × ethnicity, tag × country), interactive **tag hierarchy** drill-down.
- **Networks tab** — force-directed **performer collaboration graph** (vanilla-JS layout — no D3 dep), top performer pairs ranking, **studio × tag heatmap**.
- **Trends tab** — scenes / hours added per month, **tag popularity** stacked area, **performer debut** timeline, top-studio stacked output.
- **Correlations tab (v1.1+)** — `Country × Eye color`, `Country × Cup`, `Ethnicity × Cup`, `Age × Cup` **O-count heatmaps**, a per-performer **bubble chart** (cup × avg-O, sized by scene count, coloured by country), **parallel-coordinates SVG** across all 6 attribute axes, and a **Cramér's V / Pearson r correlation-strength** ranking. v1.2 adds **rating-vs-attribute heatmaps** (country/ethnicity/eye × rating bucket) and a **top-tags-by-rating** ranking.
- **Matches tab (v1.1)** — preference form with weight sliders for every axis, live-re-ranked **top performer** and **top scene** match lists with per-axis score breakdowns, import / export of the preference profile as JSON.
- **Play tab (v1.2)** — **day-of-week × hour-of-day heatmap** from `Scene.play_history`, by-hour and by-day-of-week marginal bars, plays-per-month line chart, **most-watched scenes / performers / tags** rankings, longest and current play streaks.
- **Archetypes tab (v1.2)** — **k-means clustering** of performers over a normalised attribute + tag feature space, one card per cluster with prominent attributes and the most representative members, plus a **cosine-similarity** "similar performers" lookup that finds neighbours for any performer you search for.
- **Insights tab (v1.2)** — **Shannon / Gini-Simpson diversity** per attribute, attribute **coverage gauges**, **under-represented and unused-tag gaps**, **release-year histogram**, **added-vs-released catalogue acquisition** chart, **active-performers-per-year** trend, **career-timeline Gantt strips**, **tag-evolution** counts + share-of-year, **new-tags-discovered-per-year**.
- **Fantasy Builder tab (v1.2+)** — reverse-engineers an ideal preference profile from a seed set (favorites / top-rated / top-O), shows axis-by-axis consensus bars, surfaces the strongest multi-axis combinations, and live-ranks the entire library against the derived profile. One click copies the profile into the Matches tab. v1.3 adds **scene recipes** — concrete "go and find me one of these" blueprints derived from the seed.
- **Quality tab (v1.3+)** — composite **library-health score** (0–100 + letter grade), **completion-rate** donut (abandoned / partial / watched / repeat), **hidden gems** ranking (high rating × low play count), **overrated** and **underrated** scenes and performers identified via residual z-scores from a linear-regression fit between rating and usage signals. v1.6 adds **guilty pleasures** (low-rated + heavily played), **repeat offenders** (rewatched a lot AND poorly rated), **buried treasure** (highly rated + old + unwatched), **one-hit wonders** (single-scene 85+ rated performers), **tag potency** (avg O per tag), and **rating drift** (avg rating per updated_at month).
- **Fun / spicy metrics (v1.6)** — 18 additional analytics scattered across Overview / Play / Insights / Correlations / Networks: personality archetype card, studio loyalty (HHI), peak session, dry-spell / binge-cycle, peak-intensity heatmap (avg O per play), optimal-duration buckets, kink evolution timeline, time capsule, country tourism map, body-type calibration heatmap, and a two-performer compatibility widget.
- **Wrapped tab (v1.7)** — Spotify-style yearly slideshow: auto-picks your most active year and cycles totals → top scene → top performer → top studio → top tags → biggest binge day → longest streak → prime time → countries explored → biggest new discovery → your vibe. Arrow-key navigation.
- **Bingo tab (v1.7)** — 5×5 achievement grid, 24 challenges + free space, drawn from 28+ templates via a seeded shuffle. Cells auto-mark green from library state, with progress hints. Detects lines and blackout. "🎲 New card" reshuffles the seed via localStorage.
- **Blind Pick (v1.7, Play tab)** — variant of Roulette that hides the scene name and shows only duration / rating / tags. Reveal or reroll before committing.
- **Nudge banner (v1.7, Overview)** — rotating "hey, try this" card pulled from buried treasure / neglected favourite / untried high-rated performer / stale country / studio blindspot / hidden gem.
- **Tag Optimizer tab (v1.8)** — read-only inventory analysis: near-duplicate clusters (identical-normalised / Levenshtein-close / singular/plural), rare & orphan tags, always-together merge candidates, specialisation pairs, under/over-tagged scenes, naming inconsistency, hierarchy audit — every finding deep-linked to Stash's native editor. Composite cleanup score.
- **Cleanup tab (v1.9)** — metadata-gap finder: chip filter bar for missing fields on performers (ethnicity / country / eye / hair / gender / birthdate / height / measurements / tattoos / piercings) and scenes (title / date / studio / rating / performers / tags). Ethnicity is the default focus. Table sorts favourites first, then by scene count. Every row has an edit deep-link. Composite metadata-health score.
- **Live filtering** — global date range + performer-name and tag-name fuzzy filters re-render every chart instantly.
- **Two-tier caching** — in-browser localStorage for snappy reloads, plus a disk cache produced by the Node backend so the UI loads in milliseconds even on multi-thousand-scene libraries.
- **Offline-friendly** — Chart.js is vendored from `node_modules` (no CDN dependency), and the exported HTML report opens directly in any browser.

---

## Installation

### 1. Drop the plugin into Stash's plugin directory

By default Stash reads plugins from `~/.stash/plugins/` (Linux/macOS) or `%APPDATA%/stash/plugins/` (Windows). Clone the repo into a subdirectory there:

```sh
cd ~/.stash/plugins/
git clone https://github.com/kangooaus/stashappgraph- Metrics
cd Metrics
```

### 2. Vendor third-party libraries

The plugin uses Chart.js and a couple of plugins, bundled via npm. Running `npm install` triggers a `postinstall` script that copies the UMD bundles into `assets/lib/` so the Stash UI can serve them.

```sh
npm install
```

(Node 18+ required. If your Stash host has no Node, run `npm install` on any machine and copy the populated `assets/lib/` folder over.)

### 3. Reload plugins in Stash

In the Stash UI: **Settings → Plugins → Reload plugins**.

You should see a new **Metrics** entry in the plugin list, a **Metrics** button in the main nav, and two tasks (**Generate Full Metrics Report**, **Update Metrics Cache**) under **Settings → Tasks → Plugin Tasks → Metrics**.

### 4. (Optional) Pre-populate the cache

Run **Update Metrics Cache** once. This writes `assets/metrics-cache.json` and makes the dashboard load instantly. The dashboard will fall back to live GraphQL if the cache is missing or stale (see [Cache TTL](#configuration-plugin-settings)).

---

## Configuration (plugin settings)

All settings live in **Settings → Plugins → Metrics**. They're also exposed to the Node backend as `PLUGIN_SETTINGS_JSON`.

| Setting | Type | Default | What it does |
| --- | --- | --- | --- |
| `cacheTtlMinutes` | number | 60 | How long the UI considers the cached payload fresh before refetching. |
| `enableNetworkGraph` | boolean | true | Disable to skip the heavy force-directed graph on slow clients. |
| `topN` | number | 20 | Rows in every "Top N" ranking. |
| `ageBuckets` | number | 5 | Granularity of the age pyramid (5 = 5-year buckets). |
| `heightUnit` | string | `cm` | `cm` or `in`. Affects axis labels in height charts. |
| `excludeTagIds` | string | `""` | Comma-separated tag IDs to remove from every aggregation. Useful for hiding moderation tags. |
| `excludePerformerIds` | string | `""` | Comma-separated performer IDs to skip. |
| `reportFormats` | string | `json,csv,html` | Comma-separated list. The full-report task only writes the formats listed. |
| `enableCorrelations` | boolean | true | Toggle the Correlations tab and the correlation block written to the cache. |
| `correlationMinSupport` | number | 3 | Drop attribute groups with fewer entries than this so single-sample buckets don't dominate the heatmaps. |
| `preferenceProfile` | string (JSON) | `""` | Default preference profile loaded by the Matches tab and the *Find Matches* task. See [Preference profile + match finder](#preference-profile--match-finder). |
| `matchMinScore` | number | 0 | Drop performers/scenes whose weighted match score is below this threshold (0–100). |
| `matchIncludeUnknown` | boolean | false | When ON, missing attribute values contribute `0.5 × weight` instead of `0`. Useful on libraries with sparse metadata. |
| `enablePlayHistory` | boolean | true | Toggle the Play tab and its play-history aggregations. |
| `enableArchetypes` | boolean | true | Toggle the Archetypes tab (k-means clustering + similarity lookup). |
| `archetypeClusters` | number | 6 | Number of performer-archetype clusters to compute. 2–12. |
| `enableDiversity` | boolean | true | Toggle the diversity + gap-analysis blocks on the Insights tab. |
| `enableTemporal` | boolean | true | Toggle release-year, career-timeline, and tag-evolution blocks on the Insights tab. |
| `enableFantasy` | boolean | true | Toggle the Fantasy Builder tab. |
| `fantasyMode` | string | `favorites` | How to pick the seed performers. One of `favorites`, `top-rated`, `top-o`. |
| `fantasyConsensus` | number | 0.5 | Fraction of seed performers that must share a value before it locks into the derived profile (0.3 = loose, 0.7 = strict). |
| `enableQuality` | boolean | true | Toggle the Quality tab (hidden gems, anomalies, library-health score). |
| `gemRatingFloor` | number | 80 | Minimum `rating100` for a scene to qualify as a hidden gem. |
| `gemPlayCeiling` | number | 2 | Maximum `play_count` a scene can have and still count as a hidden gem. |
| `qualityZThreshold` | number | 1.0 | Residual z-score threshold for the over- / underrated lists (\|z\| > threshold). |
| `qualityMinScenes` | number | 2 | Minimum scenes a performer must have before being eligible for performer-anomaly lists. |

---

## Runnable tasks

Both tasks live under **Settings → Tasks → Plugin Tasks → Metrics**. They're plain Node scripts (`backend/compute_metrics.js`) — you can also run them from a shell:

```sh
node backend/compute_metrics.js --mode=cache-refresh
node backend/compute_metrics.js --mode=full-report
```

When invoked outside Stash, the script reads connection info from environment variables (or a `.env` file in the plugin root):

```env
STASH_SERVER_SCHEME=http
STASH_SERVER_HOST=localhost
STASH_SERVER_PORT=9999
STASH_API_KEY=...
```

### Generate Full Metrics Report

Computes everything, writes the dashboard cache **and** persists a dated bundle to `cache/reports/<YYYYMMDD-HHMM>/`:

```
cache/reports/20260630-1700/
├── metrics.json         # full payload — same as assets/metrics-cache.json
├── report.html          # standalone, self-contained HTML report (opens offline)
└── csv/
    ├── tag_frequency.csv
    ├── tag_co_occurrence.csv
    ├── top_performers_by_scenes.csv
    ├── top_performers_by_duration.csv
    ├── top_performers_by_rating.csv
    ├── gender_distribution.csv
    ├── country_distribution.csv
    ├── ethnicity_distribution.csv
    ├── scenes_per_month.csv
    ├── studio_storage.csv
    └── performer_pairs.csv
```

A copy of the latest HTML is also placed at `cache/reports/latest.html` for easy linking.

### Update Metrics Cache

Cheap version — recomputes the JSON cache used by the dashboard but skips CSV and HTML.

### Find Matches Based on My Preferences

Reads the `preferenceProfile` setting (or the inline profile saved from the Matches tab), runs the recommender, and writes:

```
cache/reports/<YYYYMMDD-HHMM>/
├── matches.json   # full ranked match payload (performers + scenes + breakdowns)
└── matches.html   # standalone visual report with score breakdowns
```

…plus a `cache/reports/latest-matches.html` shortcut. The same payload also lands at `assets/matches-cache.json` so the dashboard's Matches tab opens instantly without re-ranking in the browser.

### Generate Year-in-Review

Reads the dashboard cache, builds a calendar-year summary (top performers, tags, studios, most-played + highest-rated scenes, performer debuts, new-tag discoveries) and writes a standalone HTML report. Defaults to last year:

```sh
node backend/compute_metrics.js --mode=year-review            # last calendar year
node backend/compute_metrics.js --mode=year-review --year=2024
```

Output goes to `cache/reports/<YYYYMMDD-HHMM>-<year>/year-review.{json,html}` plus a `cache/reports/latest-year-review.html` shortcut for easy linking.

### Export Full Library to Excel

Renders a multi-sheet `.xlsx` workbook over the entire library:

```sh
node backend/compute_metrics.js --mode=excel-export
```

Output: `cache/reports/<YYYYMMDD-HHMM>/library-export.xlsx` plus a `cache/reports/latest-library-export.xlsx` shortcut. See the [Excel export](#excel-export) section for sheet-by-sheet details.

---

## Dashboard tour

Open the dashboard from the **Metrics** button in the navbar or by navigating to `/plugins/metrics` (plural — `/plugin/…` is Stash's static-file server prefix and returns a hard 404 for non-file paths). The page has a single source-of-truth strip at the top:

```
[ source: backend-cache · computed 6/30/2026, 17:02 ]  [ Refresh ]  [ Download cached JSON ]
```

Filters apply globally:

- **From / To** — date range filter applied to time-series charts.
- **Performer filter** — substring filter on performer names. Narrows ranking tables and the collaboration pairs list.
- **Tag filter** — substring filter on tag names. Narrows the tag cloud, treemap, top-tags bar, and co-occurrence list.

Heavy attribute charts (gender, age pyramid, ethnicity) intentionally **don't** narrow with date filters — they aggregate over performers, not scenes, so a date filter would be misleading.

---

## How each metric is computed

The same aggregator runs in both the browser (`src/dashboard.js → ns.aggregate`) and Node (`backend/aggregate.js → aggregate`). The Node version is exercised by `npm test`.

Each scene's duration uses `max(file.duration)` across the scene's files (so a 2-minute preview file doesn't shrink an otherwise 30-minute scene). Storage is `sum(file.size)`.

| Metric | Formula |
| --- | --- |
| Avg / median scene duration | mean / median of per-scene durations (zero-duration scenes excluded) |
| Storage by studio | `Σ scene.fileSize` grouped by `scene.studio.name`. |
| Resolution distribution | Bucketed off `file.height`: `<480 / 480 / 720 / 1080 / 4K+`. |
| Codec distribution | `count` over `file.video_codec`, lowercased, top 12. |
| Scene ratings | `ceil(rating100 / 20)` → 1..5 stars; `rating100=null` → "Unrated". |
| Organized ratio | `count(scene.organized) / total`. |
| Performer age | `today - birthdate` (or `death_date` if set). |
| Median performer age | median over performers with a parseable `birthdate`. |
| Age pyramid | bucket performers by `age // bucketSize`, split by `gender`. |
| Height histogram | 16-bin equal-width histogram over `height_cm`. |
| Career length | parses `"YYYY-YYYY"`, `"YYYY-present"`, `"N years"` from `career_length`. |
| Career vs scenes scatter | `(parsedCareerYears, scene_count)` per performer. |
| Top by scenes | sort performers by `scene_count desc`. |
| Top by total minutes | per performer, `Σ duration` across scenes they appear in. |
| Top by rating | sort performers by `rating100 desc` (nulls excluded). |
| Body mods | yes/no/unknown buckets over `tattoos`, `piercings`, `fake_tits`. Anything matching `/^(no|none|n)$/i` is "No"; non-empty otherwise is "Yes". |
| Cup distribution | parses `measurements` against `^\d{2,3}[A-Z]+-\d{2,3}-\d{2,3}$`, counts first letter of cup. |
| Tag frequency | `count` of `(scene, tag)` pairs. |
| Co-occurrence | every unordered pair `(a, b)` of tags (or performers) that appear in the same scene; weight = number of scenes. |
| Tag × ethnicity / country | for each scene, for each performer, increment `(tag.name, performer.attr)`. |
| Tag hierarchy | tags with non-empty `children`, sorted by `scene_count`. |
| Performer network | top 50 performers by degree among edges with `weight ≥ max(1, totalScenes / 4000)`. |
| Studio × tag heatmap | top 10 studios × top 12 tags, counted by scene. |
| Scenes / hours per month | group scenes by `date.slice(0,7)`. |
| Performer debuts | first scene `date` per performer, bucketed by month. |
| Tag trends | top 5 tags by frequency, counted per month. |
| Studio trends | top 5 studios by `scene_count`, counted per month. |

---

## Correlations module

The Correlations tab surfaces statistical relationships between every performer attribute and the O-count signal. The same numbers are written into `assets/metrics-cache.json` under `correlations.*` so the report HTML and CSV bundle can ship them.

**Per-performer enrichment.** Every performer is enriched with:

| Field | Source / formula |
| --- | --- |
| `cupOrdinal` / `cupLetter` | First letter of `measurements` parsed against `\d{2,3}[A-Z]+-\d{2,3}-\d{2,3}`, mapped A→1 .. K→11. |
| `age`, `ageBucket` | `today − birthdate`, bucketed at `[18, 25, 30, 35, 40, 50, 60]`. |
| `heightBucket` | `[150, 160, 165, 170, 175, 180, 190]` cm buckets. |
| `performerO` | `Performer.o_counter` (total across the performer's history). |
| `sceneO`, `avgSceneO` | `Σ scene.o_counter` over scenes the performer appears in, and that sum / their scene count. |

**Surfaces produced:**

- `perAttribute[attr]` — for every value of `country`, `ethnicity`, `eyeColor`, `hairColor`, `cupLetter`, `ageBucket`, `heightBucket`, `gender`:
  - `n` — number of performers in the bucket (must be ≥ `correlationMinSupport`),
  - `avgPerformerO`, `avgSceneO`,
  - `shareHighO` — fraction of performers whose `avgSceneO ≥ highOThreshold` (default 2),
  - `totalO`.
- `cramersV[attr]` — Cramér's V on an [attribute × O-bucket] contingency table. 0–1 scale; higher = stronger association. Bucket edges: `[0, 1, 2, 4, 8]`.
- `pearsonOrdinal.{cup,height,age}` — Pearson r between the ordinal attribute and `avgSceneO`. Returns `null` when fewer than 3 valid pairs.
- `heatmaps.{countryEye, countryCup, ethnicityCup, ageCup}` — `{rows, cols, matrix, counts}` with `matrix[i][j] = mean(avgSceneO)` over the bucket. Cells with `counts < minSupport` blank out. Rows are sorted by row mean so the strongest correlations land at the top.
- `bubbles` — top 200 performers (by `avgSceneO`) as `{x=cupOrdinal, y=avgSceneO, r=√sceneCount, country, eyeColor, cupLetter, name, id}`.
- `parallel.{axes, lines, categoricalAxes, numericAxes}` — every performer encoded as a normalised `[0..1]` point on six axes: `country`, `ethnicity`, `eyeColor`, `cupLetter`, `heightCm`, `age`, `avgSceneO`. Categorical axes are sorted by mean `avgSceneO` so high-O lines cluster visually.

**Formulas:**

```
Cramér's V = √( χ² / (N × (min(rows, cols) − 1)) )
Pearson r  = Σ((x−x̄)(y−ȳ)) / √(Σ(x−x̄)² × Σ(y−ȳ)²)
shareHighO = |{ p : p.avgSceneO ≥ highOThreshold }| / |group|
```

The Correlations tab also drops a KPI strip showing the strongest categorical association (highest Cramér's V) and the Pearson r between cup / age / height and `avgSceneO` so you can read the "weak/moderate/strong" relationship at a glance.

The `cache/reports/<ts>/csv/` bundle includes one `correlations_<attr>.csv` per attribute plus `correlations_cramers_v.csv` and `correlations_pearson.csv`.

---

## Preference profile + match finder

The Matches tab lets you describe an ideal performer profile and ranks the entire library against it. Profiles are plain JSON — editable inline, importable, exportable, and also settable as the `preferenceProfile` plugin setting so the **Find Matches Based on My Preferences** task can run unattended.

### Profile schema

```json
{
  "countries":     ["US", "CZ", "BR"],
  "ethnicities":   ["Caucasian", "Latin"],
  "eyeColors":     ["Blue", "Green"],
  "hairColors":    ["Blonde"],
  "cupSizes":      ["C", "D", "E"],
  "requiredTags":  ["Outdoor", "POV"],
  "excludedTags":  ["Solo"],
  "minHeightCm":   160, "maxHeightCm": 180,
  "minAge":        22,  "maxAge":      35,
  "minOCount":     1,
  "weights": {
    "country":     1.0, "ethnicity":   0.8,
    "eyeColor":    0.7, "hairColor":   0.5,
    "cup":         0.9, "height":      0.5, "age": 0.6,
    "oCount":      1.2, "tagOverlap":  1.0, "rating": 0.3
  },
  "topMatches":    25
}
```

Every field is optional; omitted axes are silently dropped from the score denominator so an empty profile is well-defined (it yields the rating-only fallback). Use the **Reset to defaults** button on the form to start over.

### Match scoring

Each performer is scored against the profile axis-by-axis. Per-axis match values are in `[0, 1]`:

| Axis | Match value |
| --- | --- |
| `country`, `ethnicity`, `eyeColor`, `hairColor`, `cup` | `1` if the performer's value is in the preferred set, else `0` (or `0.5` if `matchIncludeUnknown` is on **and** the value is null). |
| `height`, `age` (numeric ranges) | `1` if inside `[min, max]`. Linearly falls off to `0` over a one-bucket tail (10 cm for height, 5 years for age). |
| `oCount` | `clip(performer.avgSceneO / max(minOCount, 0.01), 0, 1)`. |
| `tagOverlap` | `|performer.tags ∩ requiredTags| / |requiredTags|`, or `0` if any `excludedTag` is on the performer. |
| `rating` | `performer.rating100 / 100` (or `0.5` fallback if `matchIncludeUnknown`). |

The performer score is the weighted average across **active** axes, scaled to 0–100:

```
score_performer = 100 × Σ(weight_i × match_i) / Σ(weight_i)
```

Scenes are scored separately:

```
score_scene = 100 × (
    1.0 × (meanCastScore / 100)
  + tagOverlapWeight × tagOverlap
  + 0.5 × oCountWeight × oCountMatch
  + ratingWeight × ratingMatch
) / Σ(weights)
```

`meanCastScore` is the **average** of the scored cast members (so a scene with one perfect match and three weak ones can't outrank a scene with four solid matches). `maxPerformerScore` is shown alongside as a tie-breaker.

Both performer and scene cards expose a **Score breakdown** disclosure that lists each axis with its `weight` and `match` so it's clear which axes pulled the score up or down.

### Running the finder

Three equivalent paths:

1. **Dashboard → Matches tab.** Edit the form, hit **Apply & rank** (in-browser, no GraphQL roundtrip). Optionally **Save profile** to localStorage, or **Export JSON** to share.
2. **Tasks → Plugin Tasks → Metrics → Find Matches Based on My Preferences.** Reads `preferenceProfile` from plugin settings; writes `cache/reports/<ts>/matches.{json,html}` and the dashboard-side `assets/matches-cache.json`.
3. **CLI:**
   ```sh
   node backend/compute_metrics.js --mode=match
   ```
   Honours `STASH_SERVER_HOST` / `STASH_API_KEY` from `.env` (see [Testing on a local Stash instance](#testing-on-a-local-stash-instance)).

### Sparse-data behaviour

Many community libraries have very partial performer metadata (no birthdate, no measurements, country only on half the cast). The recommender handles this in two ways:

- **Inactive axes drop out.** An empty `eyeColors` list contributes `null` to the score, so `denom` excludes its weight — the performer isn't penalised for a non-constraint.
- **`matchIncludeUnknown`** toggles whether *known* preferred values vs. *unknown* performer values count as 0 (default — strict) or 0.5 (lenient). Turn the toggle on for libraries with sparse `eye_color` / `country` / `ethnicity` so the ranking isn't dominated by the few thoroughly-tagged performers.

### Privacy

The preference profile never leaves the plugin directory. localStorage is browser-local. Plugin settings live in the same Stash config Stash already owns. The Node task only writes files inside `cache/reports/<ts>/` and `assets/matches-cache.json`. No external network calls.

---

## Play analytics

The Play tab folds every play event Stash has logged into a few complementary views.

**Data source.** Stash ≥ 0.24 exposes `Scene.play_history: [Time!]!` — one timestamp per recorded play. The plugin requests this field; if your Stash install is older the GraphQL query falls back to `Scene.play_count` + `Scene.last_played_at` automatically (see `SCENE_FIELDS_LEGACY` in `backend/stash_client.js`). With only the legacy fields the heatmap collapses to a single point per scene at `last_played_at`, but the most-watched rankings still work.

**Computed surfaces:**

- `heatmap[7][24]` — counts of plays indexed by day-of-week (Mon → Sun, ISO order) and hour-of-day (00 → 23) in the local timezone of whoever produced the cache.
- `byHour[24]` and `byDow[7]` — marginal counts for the bar charts.
- `peakHour` / `peakDow` — the hour/day with the most plays.
- `monthly.{labels, counts}` — plays grouped by `YYYY-MM`.
- `mostWatchedScenes`, `mostWatchedPerformers`, `topTagsByPlays` — ranked by `play_count` (with `play_duration` as a tie-breaker). Tag plays sum the `play_count` of every scene that carries the tag.
- `kpis.longestStreak`, `kpis.currentStreak`, `kpis.uniqueDays` — daily streak math. `longestStreak` is the maximum run of consecutive days with at least one play. `currentStreak` ends at "today" — it requires a play within the last ~36 hours.

A play in the same hour-bucket on the heatmap can come from multiple scenes; tooltips show the raw count.

---

## Archetypes and similarity

The Archetypes tab groups performers into k clusters and exposes a per-performer similarity lookup.

**Feature space (per performer):**

| Block | Source | Dim |
| --- | --- | --- |
| numeric (normalised) | `cupOrdinal`, `heightCm`, `age`, `avgSceneO`, `rating100` | 5 |
| categorical one-hot | top K of `country`, `ethnicity`, `eye_color`, `hair_color` | ~46 (default Ks of 20/10/8/8) |
| tag binary | top T globally-frequent tags the performer has appeared in | 20 |

All numeric features are min-max normalised across the population to `[0, 1]` so they sit on the same scale as the binary features. Sparse-on-purpose: a performer whose attribute is unknown contributes 0 in the corresponding column instead of a fabricated value.

**Algorithm:** Lloyd's k-means with k-means++ seeding and a deterministic PRNG seeded off the population length, so the same library always produces the same clustering. Distance is squared Euclidean. Convergence stops on no-change or after 80 iterations (we typically converge in ~25). Empty clusters are re-seeded from a random point to avoid collapse. `prominentAttrs` per cluster lists the feature indices with the highest centroid weights — that's what the chips on each card show.

**Similarity:** cosine similarity between any two performer vectors. The dashboard's per-performer lookup loads the top 10 neighbours for the searched performer. Computation is O(n²) — capped at 5000 performers via the `similarityCap` option to avoid catastrophic costs on very large libraries.

**Cluster labels.** The string at the top of each archetype card is derived by picking the strongest categorical feature per axis (country, ethnicity, eye, hair) — with weight ≥ 0.25 — and concatenating them, plus the two strongest tag features. Examples that come out of typical libraries: `US · Caucasian · Blonde`, `BR · Latin · Brunette · Outdoor`, `JP · Asian · Black-hair`. If no axis is dominant the label falls back to `Mixed`.

---

## Diversity and gap analysis

The Insights tab quantifies how varied your collection's metadata is, and where the gaps are.

**Indices (per categorical attribute):**

```
Shannon entropy       H = -Σ p_i × ln(p_i)
Shannon evenness      H / ln(S)                  where S = # categories
Simpson's index       D = Σ p_i²
Gini-Simpson          1 - D                       (0..1, higher = more diverse)
Effective N           exp(H)                      Hill number of order 1
```

`effectiveN` is the most readable single number — it answers "if your library had this many equally-likely categories, it would have the same entropy as it actually does". A library with 200 countries but 95% US performers might still have `effectiveN ≈ 4` because the long tail is empty.

**Computed for:** `country`, `ethnicity`, `eye_color`, `hair_color`, and `tags` (where `tags` uses scene-count weights, not performer-count).

**Coverage row.** Per attribute we report `populated / (populated + missing)`. Low coverage on `country` or `ethnicity` means the diversity indices are unreliable — a 30%-coverage attribute might look concentrated only because the missing 70% was the diversity. The gauge bars are coloured green ≥ 60%, amber ≥ 30%, red below that.

**Gap surfaces:**

- `underRepresented` — per categorical attribute, values that appear at least once but in fewer than `correlationMinSupport` (default 3) performers. These are good hooks for "I should grab another performer from country X".
- `tagGaps` — tags whose scene count is below `correlationMinSupport`. Often typos or one-offs worth a cleanup; sometimes genuinely rare tags worth more content.
- `unusedTagsCount` + `unusedTagsSample` — tags that exist in Stash's tag library but are attached to zero scenes.

---

## Temporal trends

Six chart surfaces on the Insights tab cover when scenes were made, when they entered your catalogue, and how the cast and tags evolved.

| Chart | What's plotted |
| --- | --- |
| `releaseYearHistogram` | Scenes grouped by `date.slice(0, 4)`. Surfaces the calendar-year distribution of the actual content. |
| `addedVsReleased` | Two bars per year: scenes whose `date` falls in that year ("Released") vs scenes whose `created_at` (Stash's import timestamp) falls in that year ("Added"). Catches catalogue acquisition vs. organic new content. |
| `releaseYearByStudio` | Stacked bars per year × top 6 studios. Lets you see which studio dominated which years. |
| `activePerformersPerYear` | Line chart of distinct performers with at least one scene released in each year. |
| `performerBirthYearHistogram` | Birth-year distribution of your roster. A different generational view than the Performers tab's age pyramid. |
| `careerTimelines` | SVG Gantt-style strips, one per top-N performer, spanning their first-scene year to their last. Hover for scene count. |
| `tagEvolution` | Two views of the top 10 tags: raw `counts` per year and `shareOfYear` percentages. Share-of-year is interesting because raw counts compress when the catalogue grows. |
| `newTagsByYear` | Bar chart of how many tags first showed up in each year — useful for spotting taxonomy drift / spurts of curation activity. |

All of these read the scene's `date` (release date) and `created_at` (Stash's first-seen timestamp). Scenes with no `date` are dropped from the chronological views; scenes with no `created_at` are dropped only from "Added".

---

## Fantasy Builder

A tool that *infers* a preference profile from a seed set of performers rather than asking you to specify one. Surfaces what your library tells the recommender about your taste.

**Seed selection.** Driven by `fantasyMode` setting:

| Mode | What it seeds |
| --- | --- |
| `favorites` | Every performer with `favorite = true`. Falls through to `top-rated` if you have fewer than 3 favourites. |
| `top-rated` | Top 25 by `rating100`. |
| `top-o` | Top 25 by `avgSceneO` (sum of scene O-counts divided by appearance count). |

You can also pass an explicit `seedPerformerIds: ["123", "456"]` array in the profile JSON to use any custom set.

**Consensus rule.** For each categorical axis (country, ethnicity, eye, hair, cup, requiredTags) the builder counts what fraction of the seed shares each value. Values above `fantasyConsensus` (default 0.5) are locked into the derived profile. Below the threshold they're surfaced in the consensus bars but not added.

For numeric axes (height, age) it uses the seed's median ± one IQR — `minHeightCm = ⌊Q1⌋`, `maxHeightCm = ⌈Q3⌉`. This means the derived range covers the middle 50% of the seed rather than the full span.

**Combinations.** Two extra surfaces help when the seed is small and the simple "≥ 50% share" thresholds don't lock many axes:

- `combinations.countryEyeCup` — top 10 most frequent `(country, eye, cup)` triplets in the seed.
- `combinations.countryEthnicityCup` — same with ethnicity instead of eye.

These tell you "even though no single eye colour passes the 50% threshold, the (US, Brown, C-cup) combo shows up in 6 of your favourites".

**Output → recommender.** The `derivedProfile` object is shaped exactly like the schema in the [Preference profile + match finder](#preference-profile--match-finder) section — there's a one-click button to copy it into the Matches tab, or you can save it as JSON.

Weights are auto-assigned based on which axes locked: a fully-consensual axis gets the default weight (`country: 1.0`, etc.), an empty axis gets `0` so it doesn't contribute to the denominator.

---

## Quality insights

The Quality tab is a single-screen "is this collection healthy?" view. Four surfaces, each tied to a concrete formula.

### Library health score

A composite 0–100 score with a letter grade (`A`, `A-`, `B`, `C`, `D`, `F`). Eight components each contribute 0–100; the headline is their weighted average. All components are surfaced — a low headline is always diagnosable.

| Component | Definition | Weight |
| --- | --- | --- |
| `organized` | % of scenes with `organized = true`. | 1.0 |
| `rated` | % of scenes with a `rating100`. | 1.2 |
| `taggedScenes` | % of scenes with at least one tag. | 1.2 |
| `performersOnScenes` | % of scenes with at least one performer. | 0.8 |
| `titled` | % of scenes with a non-empty title. | 0.6 |
| `performerMetadataDepth` | Average of `country`, `ethnicity`, `eye_color`, `height_cm`, `birthdate` coverage. | 1.4 |
| `tagRichness` | `min(100, avgTagsPerScene / 5 × 100)`. Encourages ≥ 5 tags / scene. | 0.8 |
| `tagInventoryHealth` | `100 − (rareTags / tagSpread) × 100`. Penalises taxonomies with lots of one-off tags (likely typos). | 0.6 |

Grade buckets: ≥ 90 = A · ≥ 80 = A- · ≥ 70 = B · ≥ 60 = C · ≥ 50 = D · < 50 = F.

The headline score also lands as a KPI on the Overview tab so you see it without opening Quality.

### Completion rates

For every scene with `play_count > 0` and a known `file.duration` we compute:

```
ratio_per_play = play_duration / (file.duration × play_count)
```

…and bucket each scene:

- **abandoned** — `ratio < 0.2`
- **partial** — `0.2 ≤ ratio < 0.8`
- **watched** — `ratio ≥ 0.8`
- **repeat** — `ratio ≥ 0.8` **and** `play_count ≥ 3`

The donut shows the four shares; the gauge bars give exact percentages. Two ranking lists surface the **most abandoned** scenes (sorted by `ratio` ascending) and the **most-rewatched** scenes (sorted by `play_count` descending among the `repeat` bucket).

### Hidden gems

Scenes that are rated highly but barely watched. Ranked by:

```
gem_score = rating100 × (1 + 1 / (1 + play_count))
```

A never-played 95-rated scene scores 95 × (1 + 1/1) = **190**, while a 5-times-watched 95-rated scene scores 95 × (1 + 1/6) ≈ **111**. The "never played" bonus dominates without ignoring rating entirely. Default thresholds: `rating100 ≥ gemRatingFloor` (default 80) and `play_count ≤ gemPlayCeiling` (default 2) — both tunable in plugin settings.

### Overrated / underrated anomalies

The plugin fits a simple linear regression `rating = a + b × usage` over scenes with both signals present, where:

```
usage = 0.4 × tanh(play_count / 5)
      + 0.4 × tanh(o_counter / 3)
      + 0.2 × completion_ratio
```

`tanh` flattens the long tail so a single 100-plays scene doesn't pin the slope. Every rated scene's residual `(rating − predicted)` is z-scored against the residual stdev; scenes with `|z| ≥ qualityZThreshold` (default 1.0) are surfaced:

- **Overrated** — `z ≥ +threshold`. The scene is rated higher than its play+O usage would predict.
- **Underrated** — `z ≤ −threshold`. Heavily used, but rated below the curve.

The same approach runs over performers using `rating100 = a + b × avgSceneO` (capped at `qualityMinScenes`-or-more appearances so a one-scene performer can't pollute the ranking).

These aren't moral judgements — they're statistical anomalies useful for catching rating drift ("I rated this 95 a year ago and never bothered watching it"). Both lists show the predicted rating, the residual, and the z-score so you can re-rate with full context.

---

## Fun / spicy metrics (v1.6)

The `fun {}` block is always emitted by the aggregator (cheap to compute) and drives extra widgets across five tabs:

- **Personality read (Overview hero card)** — auto-composed archetype (Rewatcher / Explorer / Curator / Cosmopolitan hybrids) with plain-English summary bullets covering rewatch rate, curation habits, studio loyalty, binge style, country diversity, tag depth, and peak play window.
- **Studio loyalty KPI (Overview)** — Herfindahl-Hirschman index of your play activity across studios. Effective-studio count (1 / HHI) and a label: **Loyal** (HHI > 0.25), **Selective** (> 0.12), **Explorer** (≤ 0.12).
- **Peak session KPI (Play)** — longest continuous session, computed by clustering play events with a 120-minute gap threshold. Reports play count, duration, start/end timestamps, and sample scenes.
- **Peak intensity heatmap (Play)** — DoW × hour grid, but cells hold **avg O per play**, not raw counts. Reveals when you're actually finishing versus just watching.
- **Dry-spell / binge-cycle (Play)** — histogram of gaps between consecutive play-days (same-day / next-day / week / two-weeks / month / dry). Reports longest gap, median gap, binge share, and style label (Binge watcher / Sporadic / Steady watcher).
- **Optimal duration buckets (Play)** — five duration bands (short / medium / long / feature / marathon) with scene count, total O, plays, avg O per scene and avg O per play. Which lengths deliver.
- **Kink evolution (Insights)** — top 8 played tags per month over the last 12 months, rendered as a multi-line chart.
- **Time capsule (Insights)** — top scenes / performers / tags from a ±14-day window six months back. Nostalgia tab.
- **Country tourism map (Insights)** — flag-tile grid: per-country performer count, scene count, play count. Bars scale to max scene count.
- **Body-type calibration (Correlations)** — cup × height-bucket heatmap where cells hold avg scene O. Which body shapes actually deliver.
- **Compatibility widget (Networks)** — two-performer picker returns a 0-100 score composed of tag-overlap (40%) + studio-overlap (30%) + attribute similarity (20%) + cup/height closeness (10%), with a full breakdown.

Extended quality surfaces (also v1.6):

- **Guilty pleasures** — scenes with `rating100 ≤ 60` AND `play_count ≥ 3`. Ranked by `guiltScore = plays × 15 − rating100`.
- **Repeat offenders** — `play_count ≥ 5` AND `rating100 ≤ 55`. Harsher variant.
- **Buried treasure** — unwatched (`play_count = 0`) + `rating100 ≥ 80` + created > 180 days ago. Ranked by `treasureScore = rating + min(50, ageDays × 0.05)`.
- **One-hit wonders** — performers with exactly 1 scene AND `rating100 ≥ 85`.
- **Tag potency** — per tag with min-support 5 scenes: avg O per scene, avg O per play. Which tags actually pay off.
- **Rating drift** — avg rating grouped by `updated_at` month. Line chart of how your rating standards have shifted over time.

---

## Wrapped, Bingo, Blind pick, Nudges (v1.7)

### Wrapped tab

Spotify-Wrapped-style yearly slideshow. Backend picks the year with the most plays (or accepts `wrappedYear` in plugin settings). Slides:

1. Intro with your archetype-year tagline
2. Totals — plays, hours, unique scenes / performers / tags / studios, countries, active days
3. Top scene of the year
4. Top performer of the year
5. Top studio of the year
6. Top 5 tags
7. Biggest binge day (peak plays in 24h)
8. Longest streak of consecutive play-days
9. Prime time (day-of-week + hour combination)
10. Countries explored
11. Biggest new discovery — a performer with plays this year but zero in any prior year
12. Vibe (auto-selected: The All-In Enthusiast / Loyal Devotee / Globe-Trotting Explorer / Daily Regular / Weekend Warrior / Contented Watcher)

Arrow keys / space navigate, a progress bar tracks position, controls include prev / next / restart.

### Bingo tab

5×5 achievement grid with a free space in the middle. 24 challenges are picked from a pool of 28+ templates via a **seeded shuffle** (the seed lives in localStorage, so the same seed → the same card until you press **New card**). Templates cover ratings, streaks, countries, marathons, latenight / morning plays, blackout, etc. Each cell:

- **Green + ✓** if the challenge is done, computed from current library state.
- Progress hint underneath (e.g. `8 / 10 countries`) when the check is a count.
- Detects completed lines (rows / columns / diagonals) and blackout (all 24 done).

The check functions are deterministic — refreshing the cache doesn't reshuffle the card unless the seed changes.

### Blind Pick (Play tab)

Variant of Roulette. Same weighted random pick (`rating × 1/(1+plays)`) from tagged scenes, but the display shows only:

- Duration in minutes
- Star rating
- Play count
- 8 tags

Two buttons: **Reveal** (uncovers the scene name + performers + studio, keeps the deep-link), **Reroll** (draws a new one). Useful for breaking rating anchoring bias.

### Nudge banner (Overview)

Rotating "hey, try this" card at the top of Overview. Pool draws from up to six sources, one per render (random):

- **Buried treasure alert** — you never played this high-rated scene
- **Neglected favourite** — a favourited performer with no plays in 90+ days
- **Untried high-rated** — a performer you rated 85+ but never watched
- **Passport check** — a country with no play in 60+ days
- **Studio blind spot** — a studio with 3+ scenes but 0 plays
- **Hidden gem** — first entry from the Quality tab's hidden-gem list

Each nudge has a deep-link **Open →** button when the target has an id, and a dismiss × that hides it for this session.

---

## Tag Optimizer (v1.8)

Read-only tag inventory analysis. All findings deep-link to Stash's native tag/scene editor — the plugin never mutates tags.

### Cleanup score

Composite 0-100 with a letter grade, penalising:

- Near-duplicate clusters × 2 (capped 30)
- Orphans × 0.5 (capped 20)
- Rare-tag ratio × 100 (capped 15)
- Under-tagged ratio × 100 (capped 20)
- Inconsistent buckets × 1.5 (capped 15)

### Six cleanup surfaces

- **Near-duplicate clusters** — three passes:
  - *Identical-normalised* — tags collapsing to the same normalised form after lowercasing / punctuation-stripping (`Big Tits` / `big-tits` / `bigtits`).
  - *Levenshtein-close* — remaining tags with normalised-form edit distance ≤ 2 and both ≥ 4 characters (`amateur` / `amatuer`).
  - *Singular/plural* — remaining tags with the same crude-singularised form (`cowgirl` / `cowgirls`).
  Each cluster suggests keeping the highest-scene-count tag as canonical.
- **Rare tags** — used fewer than `tagoptRareThreshold` (default 3) times.
- **Orphan tags** — declared but attached to 0 scenes.
- **Always-together pairs** — for pairs with `|A ∩ B| ≥ tagoptPairMinSupport`: Jaccard = `|A ∩ B| / |A ∪ B|`, and asymmetric implication `P(B|A)` and `P(A|B)`. Pairs with `jaccard ≥ 0.95` are surfaced as merge candidates.
- **Specialisation pairs** — `P(B|A) ≥ 0.98` but `P(A|B) < 0.9`. A strictly implies B, so B is a good parent of A (or A carries all the info B does).
- **Under/over-tagged scenes** — scenes with ≤ 2 tags (or ≥ 20 tags), ranked ascending / descending. Table has direct edit links.
- **Naming inconsistency** — buckets of tags with the same normalised form (case / punctuation / separators only) — different display forms of the same word.
- **Hierarchy audit** — for every declared parent → child relationship, count child scenes that don't carry the parent. Surfaces `empty_child` (child has 0 scenes) and `child_missing_parent` (share > 0%).

### Plugin settings

- `disableTagOptimizer` — kill switch
- `tagoptRareThreshold` — default 3
- `tagoptPairMinSupport` — default 5
- `tagoptUndertagMax` — default 2
- `tagoptOvertagMin` — default 20

---

## Cleanup tab (v1.9)

Performer + scene metadata-gap finder. All findings deep-link to Stash's editor via `?edit=true`.

### Performer cleanup

Chip filter bar — one chip per field with a live count of performers missing it:

- Ethnicity (default selection)
- Country
- Eye color
- Hair color
- Gender
- Birthdate
- Height
- Measurements
- Tattoos
- Piercings

Click a chip to swap the table. The table sort priority is:

1. Favourites first
2. Then by scene count (highest impact)
3. Then by missing-field count
4. Alphabetical tiebreaker

Every row shows: fav star, name (link → performer page), scene count, rating, and an **edit** deep-link that opens Stash's performer editor.

Below that, a **worst-offenders** table lists performers missing the most fields with a chip cloud per row, so you can knock out full profiles in one pass.

### Scene cleanup

Same chip pattern for: title, date, studio, rating, performers, tags. Table sorted by `play_count` desc so heavily-used gaps rise first.

### Metadata health score

Composite 0-100 weighted by "how important" each field is downstream:

- gender × 2.0
- ethnicity, country × 1.5
- birthdate × 1.2
- eye_color, hair_color, height_cm × 1.0
- measurements × 0.6
- tattoos, piercings × 0.3

### Cleanup implementation note

The cleanup tab uses the **pre-filter** performer + scene arrays, so the header gender filter and exclude-list settings **never hide someone who needs cleaning**.

### Plugin settings

- `cleanupTopN` — how many rows to surface per field (default 40)

---

## Year-in-Review

A calendar-year summary report. Standalone HTML, no JS dependencies beyond Chart.js (which is already vendored), opens offline.

Run via the **Generate Year-in-Review** plugin task or from the CLI:

```sh
node backend/compute_metrics.js --mode=year-review
node backend/compute_metrics.js --mode=year-review --year=2024
```

Without `--year` it defaults to *last* calendar year (so a run on 2026-01-05 produces the 2025 report — the typical Spotify-Wrapped pattern).

Contents:

- Hero count of scenes added in the target year.
- KPI strip: released vs added, total watch time, plays, storage, unique performers, unique tags.
- Top 10 performers, studios, played scenes, highest-rated scenes.
- Top 15 tags by scene count.
- Performer debuts (their first-ever scene in your library landed in the target year).
- New tags discovered (first scene tagged with that tag in the target year).

A scene counts as "in the target year" if **either** its release `date` **or** its `created_at` (Stash's import timestamp) falls in that year — the report tells the dual story of "what you bought" vs "what was released".

---

## Excel export

A multi-sheet `.xlsx` workbook covering every entity in the library. Built with [SheetJS](https://sheetjs.com/). Every sheet has auto-filters on the header row, a frozen header pane, and sensible per-column widths. Run via:

```sh
# Plugin task (from the Stash UI)
Settings → Tasks → Plugin Tasks → Metrics → Export Full Library to Excel

# From the CLI
node backend/compute_metrics.js --mode=excel-export
```

Output lands at `cache/reports/<YYYYMMDD-HHMM>/library-export.xlsx`, with a `cache/reports/latest-library-export.xlsx` shortcut updated on every run.

### Sheets

| # | Sheet | Rows | Columns |
| --- | --- | --- | --- |
| 1 | **Library Overview** | KPI rows (scenes, performers, tags, storage, library-health score + grade) | `metric`, `value` |
| 2 | **Scenes** | One row per scene | id, title, studio, date, rating100, o_counter, play_count, play_duration_s, last_played_at, organized, duration_s, size_bytes, width, height, resolution, video_codec, audio_codec, frame_rate, bit_rate, performers (semicolon-joined), performer_count, tags (semicolon-joined), tag_count, created_at, updated_at |
| 3 | **Performers** | One row per performer | All Stash fields (name, gender, country, ethnicity, eye_color, hair_color, height_cm, weight_kg, measurements, fake_tits, tattoos, piercings, career_length, birthdate, death_date, favorite, rating100, ignore_auto_tag) **plus** plugin-computed `scenes_in_library`, `total_scene_o`, `avg_scene_o`, `total_play_count`, `total_play_duration_s`, tag list, tag count |
| 4 | **Tags** | One row per tag | id, name, description, scene_count, performer_count, image_count, gallery_count, parents, children, observed_scene_count (from `tagFrequency`), top_co_tags (top 5 co-occurring tags with weights) |
| 5 | **Studios** | One row per studio | id, name, parent, scene_count, performer_count, rating100, favorite |
| 6 | **Scene × Performer** | Junction table (many-to-many) | scene_id, scene_title, scene_date, performer_id, performer_name, performer_gender — **pivot-ready** |
| 7 | **Scene × Tag** | Junction table (many-to-many) | scene_id, scene_title, scene_date, tag_id, tag_name |
| 8 | **Tag Co-occurrence** | One row per pair | tag_a, tag_b, shared_scenes |
| 9 | **Top Matches** | Only present when a `preferenceProfile` is set | rank, name, score, country, ethnicity, eye_color, hair_color, cup, height_cm, age, avg_scene_o, scenes, rating100, favorite |
| 10 | **Correlations** | Per-attribute means + Cramér's V + Pearson r | attribute, value, n, avg_performer_o, avg_scene_o, share_high_o, total_o |
| 11 | **Quality** | Health components + completion shares + top hidden gems + over/underrated rankings | section, key, value (long-format — pivot-friendly) |

The Junction sheets (#6, #7) are the magic for spreadsheet-driven analysis: drop them into a Pivot Table and you can slice tag usage by studio, performer activity by date, etc., without writing any formulas.

### Pivot examples

| Question | Pivot recipe |
| --- | --- |
| Tag mix by studio | Sheet 7 (Scene × Tag) + Sheet 1 (Scenes) joined on `scene_id`. Rows = studio, Columns = tag_name, Values = COUNT(scene_id). |
| Average rating by performer's country | Sheet 6 (Scene × Performer) + Sheet 1 (Scenes) + Sheet 3 (Performers). Rows = performer.country, Values = AVG(scene.rating100). |
| Plays by hour-of-day | Use the Play tab's heatmap CSV (`cache/reports/<ts>/csv/scenes_per_month.csv` and the play exports — or just import the Scenes sheet and parse `last_played_at`). |
| Hidden-gem ROI | Sheet 11 Quality "Hidden gem" rows are already ranked; sort by gem score. |

### Behaviour notes

- The Excel export task runs **after** the standard compute pass, so the workbook reflects the current cache (and includes the Quality + Correlations blocks if those are enabled).
- If a `preferenceProfile` plugin setting is configured, the workbook embeds the current ranked matches as the **Top Matches** sheet. Empty profile → no Top Matches sheet.
- Booleans are written as `TRUE` / `FALSE` strings so Excel's filter widgets render them properly.
- Filenames are stable enough to overwrite (`latest-library-export.xlsx`) but timestamped exports never overwrite each other.

### Why SheetJS

SheetJS handles `!autofilter`, `!cols`, frozen-pane views, and proper XLSX serialisation without us building anything by hand. The package is added to `dependencies` in `package.json` and installed automatically by `npm install` (alongside Chart.js). If `xlsx` isn't installed when the export task runs, `backend/excel.js` errors with a clear *"run `npm install` in the plugin directory"* message rather than crashing.

---

## GraphQL examples

The plugin queries Stash's standard GraphQL endpoint (`/graphql`) — no schema extensions needed. The full performer / scene / tag / studio field sets live in `src/data/graphql.js` and `backend/stash_client.js` (kept in sync).

A minimal query for the headline KPIs:

```graphql
query MetricsStats {
  stats {
    scene_count
    scenes_size
    scenes_duration
    image_count
    performer_count
    tag_count
    studio_count
  }
}
```

Paginated performer query (the plugin pages in 250s):

```graphql
query PageOfPerformers($filter: FindFilterType) {
  findPerformers(filter: $filter) {
    count
    performers {
      id name gender country ethnicity
      height_cm weight measurements
      tattoos piercings career_length birthdate
      favorite rating100 scene_count
      tags { id name }
    }
  }
}
```

With variables:

```json
{ "filter": { "per_page": 250, "page": 1, "sort": "name", "direction": "ASC" } }
```

A typical paginated scene fetch used for the time-series + co-occurrence work:

```graphql
query PageOfScenes($filter: FindFilterType) {
  findScenes(filter: $filter) {
    count
    scenes {
      id title date rating100 organized
      studio { id name }
      performers { id name gender }
      tags { id name }
      files { size duration width height video_codec }
    }
  }
}
```

If you want to do live exploratory queries, Stash exposes a GraphQL playground at `http://localhost:9999/playground` (with `Settings → Security → API key` if enabled).

---

## Repository layout

```
.
├── Metrics.yml               # Stash plugin manifest (UI, tasks, settings)
├── package.json              # Node deps + vendor + test scripts
├── scripts/
│   └── vendor-libs.js        # Copies Chart.js etc. into assets/lib/
├── src/                      # Browser side (loaded by Stash UI)
│   ├── metrics.js            # Entry point — registers route + nav patch
│   ├── dashboard.js          # Imperative dashboard mount + aggregator + correlations
│   ├── styles.css
│   ├── data/
│   │   ├── graphql.js        # GraphQL helpers + field sets
│   │   ├── cache.js          # localStorage / backend cache loader
│   │   └── preferences.js    # v1.1 — preference profile load/save/import/export
│   ├── utils/
│   │   ├── format.js         # bytes, duration, color palette, country flag
│   │   ├── stats.js          # countBy / histogram / co-occurrence / median
│   │   └── correlations.js   # v1.1 — Cramér's V, Pearson, recommender (browser mirror)
│   └── charts/
│       ├── overview.js
│       ├── performers.js
│       ├── tags.js
│       ├── networks.js       # Force-directed graph + heatmap renderer
│       ├── timeseries.js
│       ├── correlations.js   # v1.1 — heatmaps, bubble, parallel coords (+ rating heatmaps v1.2)
│       ├── matches.js        # v1.1 — preference form + ranked matches
│       ├── play.js           # v1.2 — DoW × hour heatmap + most-watched
│       ├── archetypes.js     # v1.2 — k-means clusters + similar performers
│       ├── insights.js       # v1.2 — diversity + gaps + temporal + careers
│       ├── fantasy.js        # v1.2 — Fantasy Builder UI (+ recipes v1.3)
│       ├── quality.js        # v1.3+ — health + gems + anomalies + guilty/repeat/treasure/potency/drift (v1.6)
│       ├── wrapped.js        # v1.7 — Spotify-style yearly slideshow
│       ├── bingo.js          # v1.7 — 5×5 achievement grid
│       ├── tagopt.js         # v1.8 — Tag Optimizer UI
│       └── cleanup.js        # v1.9 — Performer/scene metadata gap finder
├── backend/                  # Node side (tasks)
│   ├── stash_client.js       # Tiny GraphQL client over `fetch` (+ legacy field fallback v1.2)
│   ├── aggregate.js          # Pure aggregator (mirrors UI's ns.aggregate)
│   ├── correlations.js       # v1.1 — Cramér's V / Pearson / heatmaps / bubbles / parallel
│   ├── recommender.js        # v1.1 — preference scoring for performers + scenes
│   ├── play_history.js       # v1.2 — DoW × hour heatmap + streaks + most-watched (+ completion v1.3)
│   ├── clustering.js         # v1.2 — k-means++ + cosine similarity
│   ├── diversity.js          # v1.2 — Shannon / Simpson / gap analysis
│   ├── temporal.js           # v1.2 — release years + career timelines + tag evolution
│   ├── fantasy.js            # v1.2 — Fantasy Builder backend (+ scene recipes v1.3)
│   ├── year_review.js        # v1.2 — Year-in-Review computation + standalone HTML
│   ├── quality.js            # v1.3+ — health + gems + anomalies + guilty/repeat/treasure/potency/drift (v1.6)
│   ├── fun.js                # v1.6 — 9 fun/spicy computations (studio loyalty, peak session, dry spell, personality…)
│   ├── wrapped.js            # v1.7 — Yearly Wrapped payload builder
│   ├── bingo.js              # v1.7 — Bingo card generator (deterministic seeded shuffle)
│   ├── nudges.js             # v1.7 — Overview nudge banner pool
│   ├── tagopt.js             # v1.8 — Near-duplicate + always-together + hierarchy audit
│   ├── cleanup.js            # v1.9 — Performer + scene metadata gap analysis
│   ├── excel.js              # v1.3 — multi-sheet .xlsx writer (SheetJS)
│   ├── report.js             # HTML + CSV writers (incl. matches.html)
│   ├── compute_metrics.js    # Task entry — wired up in Metrics.yml
│   └── test_aggregate.js     # Offline smoke test (`npm test`)
├── assets/
│   ├── icons/icon.svg
│   ├── lib/                  # Vendored UMD bundles (populated by npm install)
│   └── metrics-cache.json    # Written by the cache-refresh task
└── cache/
    └── reports/<ts>/         # Dated full reports (.json + .html + csv/)
```

---

## Testing on a local Stash instance

1. **Have a Stash instance running**. Default is `http://localhost:9999`. If your install uses an API key, copy it from **Settings → Security → API Key**.
2. **Clone the plugin** into your Stash plugin directory and run `npm install` (see [Installation](#installation)).
3. **Reload plugins** — the **Metrics** entry should appear.
4. **Run the smoke test** (no Stash needed):

   ```sh
   npm test
   ```

   This runs `backend/test_aggregate.js` over a synthetic library and confirms the aggregator returns the expected totals, gender split, co-occurrence pairs, time series, and heatmap dimensions.

5. **Run the cache task once** from **Tasks → Plugin Tasks → Metrics → Update Metrics Cache**. Watch the task log; it should report `[metrics] tags: N/N`, `[metrics] performers: N/N`, etc., and finish with `[metrics] wrote …/assets/metrics-cache.json (X KiB)`.
6. **Open the dashboard** from the Metrics nav button. Source should read `backend-cache`.
7. **(Optional)** Run **Generate Full Metrics Report**. Look in `cache/reports/<timestamp>/report.html` and open it in any browser — it works fully offline.
### Running the backend against a remote Stash

Drop a `.env` in the plugin root:

```env
STASH_SERVER_SCHEME=http
STASH_SERVER_HOST=192.168.1.42
STASH_SERVER_PORT=9999
STASH_API_KEY=...
```

Then `npm run compute` or `node backend/compute_metrics.js --mode=cache-refresh`.

---

## Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| Dashboard says "Chart.js failed to load" | `npm install` hasn't been run inside the plugin dir, so `assets/lib/chart.umd.min.js` is still the placeholder stub. |
| "Failed to load metrics: GraphQL HTTP 401" in the dashboard | API key changed — reload the page so Stash's UI re-attaches the auth header. |
| Dashboard shows source `live` and takes forever | The backend cache hasn't been written. Run **Update Metrics Cache** once. |
| Dashboard stays on source `live` even though the cache task ran | The cache JSON isn't reachable. Test `http://<stash>/plugin/Metrics/assets/metrics-cache.json` directly — a 404 means the `ui.assets` mapping isn't active. The mapping must be `/: assets` (Stash strips its own `/plugin/<id>/assets/` prefix before matching keys), and **manifest changes need a full Stash restart** — the Plugins → Reload button re-reads JS but not `Metrics.yml`. |
| Archetypes / Matches / Fantasy / Quality / Tag Optimizer / Cleanup tabs say "not in this cache" | Those blocks are backend-computed and exist only in `metrics-cache.json` — in `source: live` mode they can't render. Fix the cache serving (row above), then hard-refresh. |
| "Chart.js not vendored" after a git checkout / restore | The files under `assets/lib/` are tiny placeholder stubs in git; the real UMD bundles are vendored by `npm install`. Any `git restore` / `git checkout` touching `assets/lib/` reverts them to stubs — re-run `npm install` to restore the real libraries. |
| Age pyramid is empty | None of your performers have `birthdate` filled in. The chart only counts performers with a valid birthdate. |
| Cup distribution is empty | `measurements` is free-text; the plugin only counts entries matching `34B-25-35` style. |
| Network graph is missing performers | The plugin only graphs edges with `weight ≥ max(1, totalScenes / 4000)` to keep the graph readable. Disable the filter by lowering `topN` won't help; edit `aggregate.js` if you want every pair shown. |
| Correlations tab is empty | `enableCorrelations` is off, or the cache pre-dates v1.1 — run **Update Metrics Cache** to refresh. |
| Heatmap cells show dots / blanks | Cell sample size is below `correlationMinSupport`. Either drop the threshold (e.g. to 2) or accept that the sparse cell isn't reliable. |
| Matches tab says "raw data not available" | The dashboard slim cache doesn't carry full performer/scene attributes — click **Refresh** on the dashboard so the browser re-fetches via GraphQL (or run **Update Metrics Cache** then reload). |
| Every performer scores ~50 | Profile is empty or all weights are zero. The Matches tab is showing the neutral baseline; add at least one preference. |
| Default weights don't suit my workflow | Adjust the sliders in the form and **Save profile** — or set `preferenceProfile` in plugin settings to a JSON document you control. |
| Play tab heatmap shows only a few cells | Your Stash is older than 0.24 — `Scene.play_history` doesn't exist, so we fall back to `last_played_at` (one cell per played scene). Upgrade for the full hour-of-day heatmap. |
| Archetype cluster sizes look uneven | k-means is sensitive to the population's actual structure. Try a different `archetypeClusters` value (3–8 typically gives the cleanest results). |
| Similarity lookup returns the same handful of performers | Most of your library shares the same top categorical values, so the feature vectors collapse. Add more tag diversity in your library, or accept the homogeneity. |
| Diversity gauges read very low | Coverage is low — check the "Coverage & gaps" card. The indices need at least 60% non-null coverage on an attribute to be meaningful. |
| Career timelines are empty | None of your scenes have `date` set. The chart needs scene release dates to compute first/last appearance per performer. |
| Fantasy Builder produces an almost-empty derived profile | The `fantasyConsensus` threshold (default 0.5) is too tight for your seed size. Try 0.3 — or check the combinations card for multi-axis patterns the simple threshold misses. |
| Year-in-Review shows zero scenes | Your scenes have neither `date` nor `created_at` populated. Run Stash's scan + metadata generation to backfill them. |
| Excel export task fails with "SheetJS not installed" | Run `npm install` in the plugin directory — `xlsx` is a dependency and the postinstall step also copies the UMD bundle into `assets/lib/`. |
| Quality tab is empty | `enableQuality` is off, or your cache pre-dates v1.3 — toggle the setting on and run **Update Metrics Cache**. |
| Hidden gems list is empty | Your `gemRatingFloor` (default 80) is higher than any of your scene ratings, or `gemPlayCeiling` (default 2) is lower than the play count of every rated scene. Drop either threshold. |
| Health score reads C-/D even though the library looks good | Open the Quality tab and look at the component bars — usually the culprit is `performerMetadataDepth` (sparse `country`/`ethnicity`/`birthdate` fields) or `tagInventoryHealth` (lots of one-off tags). |
| Over/underrated lists are empty | Your library has fewer than 5 scenes with both a rating AND a play_count/o_counter signal. The regression refuses to fit on too-few points. |
| Excel workbook is missing the Top Matches sheet | No `preferenceProfile` is configured (or the profile evaluates to no axes). Set one in plugin settings — or save one from the Matches tab and re-run the export. |

---

## Extending the plugin

Adding a new chart is three steps:

1. **Compute the data** in `backend/aggregate.js` (and mirror it in `src/dashboard.js` if you want it to work without the backend cache). Add it to the return object.
2. **Render** it from one of the chart modules in `src/charts/` (or a new module — register it in `plugin.yml`'s `ui.javascript` and in the tab map in `src/dashboard.js`).
3. **Export** it from `backend/report.js` if you want it in the CSV bundle / standalone HTML report.

If you add a new GraphQL field, update **both** `src/data/graphql.js` and `backend/stash_client.js` (the two field sets are intentionally duplicated — there is no build step that could share them).

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the deeper rationale.

---

## License

MIT — see `LICENSE` if present, otherwise this repository's GitHub license metadata.
