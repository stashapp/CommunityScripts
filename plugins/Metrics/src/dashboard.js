(function () {
  "use strict";

  const ns = (window.StashMetrics = window.StashMetrics || {});

  // The Dashboard is plain DOM + Chart.js rather than React. We mount a
  // single <div> from the PluginApi route and drive everything imperatively
  // — this avoids depending on Stash's react-bootstrap component layout,
  // which has shifted across Stash versions.
  ns.dashboard = ns.dashboard || {};

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "performers", label: "Performers" },
    { id: "tags", label: "Tags" },
    { id: "networks", label: "Networks" },
    { id: "timeseries", label: "Trends" },
    { id: "play", label: "Play" },
    { id: "archetypes", label: "Archetypes" },
    { id: "insights", label: "Insights" },
    { id: "correlations", label: "Correlations" },
    { id: "matches", label: "Matches" },
    { id: "fantasy", label: "Fantasy" },
    { id: "quality", label: "Quality" },
    { id: "wrapped", label: "Wrapped" },
    { id: "bingo", label: "Bingo" },
    { id: "tagopt", label: "Tag Optimizer" },
    { id: "cleanup", label: "Cleanup" },
  ];

  function readSettings() {
    // PluginApi exposes plugin config via the loaded Stash config; fall back
    // to defaults that match plugin.yml.
    const defaults = {
      cacheTtlMinutes: 60,
      disableNetworkGraph: false,
      topN: 20,
      ageBuckets: 5,
      heightUnit: "cm",
      excludeTagIds: "",
      excludePerformerIds: "",
      reportFormats: "json,csv,html",
      hideOtherBucket: false,
      disableCorrelations: false,
      correlationMinSupport: 3,
      preferenceProfile: "",
      matchMinScore: 0,
      matchIncludeUnknown: false,
    };
    try {
      const api = window.PluginApi;
      const cfg = api && api.getPluginConfig ? api.getPluginConfig("Metrics") : null;
      if (cfg && typeof cfg === "object") return Object.assign({}, defaults, cfg);
    } catch (e) { /* ignore */ }
    return defaults;
  }

  function settingsToBackendFilter(s) {
    return {
      excludeTagIds: (s.excludeTagIds || "")
        .split(",").map((x) => x.trim()).filter(Boolean),
      excludePerformerIds: (s.excludePerformerIds || "")
        .split(",").map((x) => x.trim()).filter(Boolean),
    };
  }

  // Blocks a "fresh enough" ui-cache must contain before we skip the
  // backend-cache probe. If any of these are missing the localStorage
  // payload predates a plugin upgrade and we must refetch — otherwise
  // tabs like Quality / Fantasy / Archetypes render empty forever.
  const REQUIRED_UI_CACHE_KEYS = [
    "quality", "fantasy", "archetypes", "diversity", "temporal", "playHistory",
  ];
  function uiCacheIsUsable(payload, ttlMinutes) {
    if (!payload || !ns.cache.isFresh(payload, ttlMinutes)) return false;
    for (const k of REQUIRED_UI_CACHE_KEYS) {
      if (!(k in payload)) return false;
    }
    return true;
  }

  async function loadMetrics(force) {
    const settings = readSettings();
    // Always try the backend cache first (it's authoritative + includes
    // every block). Only fall back to the browser localStorage / live
    // GraphQL path when it's unreachable.
    if (!force) {
      try {
        const backend = await ns.cache.fetchBackendCache();
        if (backend) {
          ns.cache.write(backend);
          return { source: "backend-cache", payload: backend };
        }
      } catch (e) { /* fall through */ }
      const ui = ns.cache.read();
      if (uiCacheIsUsable(ui, settings.cacheTtlMinutes || 60)) return { source: "ui-cache", payload: ui };
    } else {
      // Explicit refresh — same priority but ignore the ui-cache entirely.
      try {
        const backend = await ns.cache.fetchBackendCache();
        if (backend) {
          ns.cache.write(backend);
          return { source: "backend-cache", payload: backend };
        }
      } catch (e) { /* fall through */ }
    }

    // Live computation. Heavy on large libraries but keeps the dashboard
    // usable even when the task hasn't been run yet.
    const computed = await computeLive(settings);
    ns.cache.write(computed);
    return { source: "live", payload: computed };
  }

  async function computeLive(settings) {
    const gql = ns.gql;
    const stats = ns.stats;
    const fmt = ns.format;
    const filter = settingsToBackendFilter(settings);
    const excludeTag = new Set(filter.excludeTagIds);
    const excludePerf = new Set(filter.excludePerformerIds);

    const [statsBlock, performers, tags, studios] = await Promise.all([
      gql.stats(),
      gql.fetchAll("performers", gql.PERFORMER_FIELDS, { perPage: 250 }),
      gql.fetchAll("tags", gql.TAG_FIELDS, { perPage: 250 }),
      gql.fetchAll("studios", gql.STUDIO_FIELDS, { perPage: 250 }),
    ]);
    // Scenes are the heaviest entity; page through them last so the user
    // sees progress on the UI before this kicks off.
    const scenes = await gql.fetchAll("scenes", gql.SCENE_FIELDS, { perPage: 250 });

    const includedScenes = scenes.filter((s) => {
      if (s.performers && s.performers.some((p) => excludePerf.has(p.id))) return false;
      return true;
    });

    const payload = ns.aggregate(statsBlock, performers, tags, studios, includedScenes, {
      ageBuckets: Number(settings.ageBuckets) || 5,
      topN: Number(settings.topN) || 20,
      excludeTag,
      excludePerf,
      heightUnit: settings.heightUnit,
      enableCorrelations: !settings.disableCorrelations,
      correlationMinSupport: Number(settings.correlationMinSupport) || 3,
    });
    // Stash the raw entities on the namespace so the Matches tab can rank
    // against full attributes (the dashboard cache is intentionally slim).
    ns.dashboard.rawCache = { performers, tags, studios, scenes: includedScenes };
    payload._raw = ns.dashboard.rawCache;
    return payload;
  }

  // Aggregation lives here so the same code paths drive both live-from-UI
  // and cached-from-backend payloads (the backend renders this whole module
  // server-side and writes the result).
  ns.aggregate = function (statsBlock, performers, tags, studios, scenes, opts) {
    const stats = ns.stats;
    const fmt = ns.format;
    opts = opts || {};
    const topN = opts.topN || 20;

    // Pre-index. Several charts use the same maps.
    const sceneById = new Map(scenes.map((s) => [s.id, s]));
    const tagById = new Map(tags.map((t) => [t.id, t]));
    const perfById = new Map(performers.map((p) => [p.id, p]));

    // -------- TOTALS / OVERVIEW
    const totalDuration = stats.sumBy(scenes, (s) => totalSceneDuration(s));
    const totalSize = stats.sumBy(scenes, (s) => totalSceneSize(s));
    const durations = scenes.map((s) => totalSceneDuration(s)).filter((x) => x > 0);
    const totals = {
      scenes: scenes.length,
      performers: performers.length,
      tags: tags.length,
      studios: studios.length,
      images: statsBlock.image_count,
      galleries: statsBlock.gallery_count,
      totalDuration,
      totalSize,
      avgDuration: stats.avg(durations),
      medianDuration: stats.median(durations),
      performersFavorite: performers.filter((p) => p.favorite).length,
    };

    const durationHistogram = stats.histogram(
      durations.map((s) => s / 60),
      { bins: 14, formatter: (m) => Math.round(m) + "m" }
    );

    // Studio storage (top N then "Other" bucketed by stats.topN downstream)
    const studioStorage = stats.countBy(
      scenes,
      (s) => s.studio ? s.studio.name : "Unknown"
    ).map((row) => {
      // value from countBy is count — replace with byte sum
      const studioName = row.label;
      let sz = 0;
      for (const sc of scenes) {
        if ((sc.studio ? sc.studio.name : "Unknown") === studioName) sz += totalSceneSize(sc);
      }
      return { label: studioName, value: sz };
    }).sort((a, b) => b.value - a.value);

    const resolutionDistribution = stats.countBy(scenes, (s) => {
      const f = (s.files || [])[0];
      if (!f || !f.height) return "Unknown";
      const h = f.height;
      if (h >= 2000) return "4K+";
      if (h >= 1080) return "1080p";
      if (h >= 720) return "720p";
      if (h >= 480) return "480p";
      return "<480p";
    });

    const codecDistribution = stats.countBy(scenes, (s) => {
      const f = (s.files || [])[0];
      return f && f.video_codec ? f.video_codec.toLowerCase() : "Unknown";
    }).slice(0, 12);

    const ratingDistribution = (function () {
      const buckets = [0, 0, 0, 0, 0, 0]; // unrated, 1-star..5-star
      for (const s of scenes) {
        if (s.rating100 == null) { buckets[0]++; continue; }
        const stars = Math.max(1, Math.min(5, Math.ceil(s.rating100 / 20)));
        buckets[stars]++;
      }
      return { labels: ["Unrated", "★", "★★", "★★★", "★★★★", "★★★★★"], counts: buckets };
    })();

    const organizedRatio = {
      organized: scenes.filter((s) => s.organized).length,
      unorganized: scenes.filter((s) => !s.organized).length,
    };

    // -------- PERFORMERS
    const heights = performers.map((p) => p.height_cm).filter((x) => x);
    const tattooedRatio = ratio(performers, (p) => has(p.tattoos));
    const piercedRatio = ratio(performers, (p) => has(p.piercings));
    const countries = new Set(performers.map((p) => p.country).filter(Boolean));

    const ages = performers.map((p) => fmt.age(p.birthdate, p.death_date)).filter((x) => x != null);

    const perfKpis = {
      total: performers.length,
      favorited: performers.filter((p) => p.favorite).length,
      medianAge: stats.median(ages),
      avgHeight: stats.avg(heights),
      tattooedRatio,
      piercedRatio,
      countries: countries.size,
    };

    const genderDistribution = stats.countBy(performers, (p) => p.gender || "UNKNOWN");
    const ethnicityDistribution = stats.countBy(performers, (p) => p.ethnicity || "Unknown");
    const countryDistribution = stats.countBy(performers, (p) => p.country || "Unknown");

    // Age pyramid: bucket by age, split by gender
    const bucketSize = opts.ageBuckets || 5;
    const allBuckets = new Set();
    const series = {};
    for (const p of performers) {
      const age = fmt.age(p.birthdate, p.death_date);
      if (age == null || age < 0) continue;
      const b = fmt.ageBucket(age, bucketSize);
      allBuckets.add(b);
      const g = p.gender || "UNKNOWN";
      if (!series[g]) series[g] = new Map();
      series[g].set(b, (series[g].get(b) || 0) + 1);
    }
    const orderedBuckets = Array.from(allBuckets).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
    const pyramid = {
      buckets: orderedBuckets,
      series: Object.fromEntries(
        Object.entries(series).map(([g, m]) => [g, orderedBuckets.map((b) => m.get(b) || 0)])
      ),
    };

    const heightHistogram = stats.histogram(heights, { bins: 16, formatter: (cm) => Math.round(cm) + "cm" });

    // Career length vs scene count scatter
    const careerVsScenes = performers
      .filter((p) => p.career_length && p.scene_count)
      .map((p) => {
        const yrs = parseCareerYears(p.career_length);
        if (yrs == null) return null;
        return { x: yrs, y: p.scene_count, name: p.name };
      })
      .filter(Boolean);

    const topByScenes = performers
      .slice().sort((a, b) => (b.scene_count || 0) - (a.scene_count || 0))
      .slice(0, topN).map((p) => ({ label: p.name, value: p.scene_count || 0, id: p.id }));

    // Total duration per performer (sum over their scenes)
    const durationByPerf = new Map();
    for (const s of scenes) {
      const d = totalSceneDuration(s);
      for (const p of s.performers || []) {
        durationByPerf.set(p.id, (durationByPerf.get(p.id) || 0) + d);
      }
    }
    const topByDuration = performers.map((p) => ({
      label: p.name, value: durationByPerf.get(p.id) || 0, id: p.id,
    })).sort((a, b) => b.value - a.value).slice(0, topN);

    const topByRating = performers.filter((p) => p.rating100 != null)
      .sort((a, b) => (b.rating100 || 0) - (a.rating100 || 0))
      .slice(0, topN).map((p) => ({ label: p.name, value: p.rating100 || 0, id: p.id }));

    const bodyMods = (function () {
      const labels = ["Tattoos", "Piercings", "Fake tits"];
      const yes = [0, 0, 0]; const no = [0, 0, 0]; const unknown = [0, 0, 0];
      for (const p of performers) {
        bucket(p.tattoos, 0);
        bucket(p.piercings, 1);
        bucket(p.fake_tits, 2);
      }
      function bucket(v, i) {
        if (v == null || v === "") unknown[i]++;
        else if (/^(no|none|n)$/i.test(v.trim())) no[i]++;
        else yes[i]++;
      }
      return { labels, yes, no, unknown };
    })();

    const cupDistribution = (function () {
      const order = "AABBBCDDDDEEFGHIJ".split("").filter((c, i, a) => a.indexOf(c) === i);
      const counts = new Map();
      for (const p of performers) {
        const m = stats.parseMeasurements(p.measurements);
        if (!m || !m.cup) continue;
        const c = m.cup.toUpperCase()[0];
        counts.set(c, (counts.get(c) || 0) + 1);
      }
      return Array.from(counts, ([label, value]) => ({ label, value }))
        .sort((a, b) => a.label.localeCompare(b.label));
    })();

    // -------- TAGS
    const tagFrequency = (function () {
      const out = new Map();
      for (const s of scenes) {
        for (const t of s.tags || []) {
          if (opts.excludeTag && opts.excludeTag.has(t.id)) continue;
          const key = t.id;
          if (!out.has(key)) out.set(key, { id: t.id, label: t.name, value: 0 });
          out.get(key).value++;
        }
      }
      return Array.from(out.values()).sort((a, b) => b.value - a.value);
    })();

    const tagCoOccurrence = stats.coOccurrence(
      scenes.map((s) => ({ items: (s.tags || []).filter((t) => !(opts.excludeTag && opts.excludeTag.has(t.id))) })),
      (t) => t.id
    ).slice(0, 200).map((e) => ({
      a: (tagById.get(e.a) || {}).name || e.a,
      b: (tagById.get(e.b) || {}).name || e.b,
      weight: e.weight,
    }));

    const uniquePairs = tagCoOccurrence.length;
    const parentTags = tags.filter((t) => t.children && t.children.length).length;
    const tagKpis = {
      total: tags.length,
      usedInScenes: tagFrequency.length,
      avgTagsPerScene: scenes.length ? stats.avg(scenes, (s) => (s.tags || []).length) : 0,
      uniquePairs,
      parentTags,
    };

    const topTagNames = tagFrequency.slice(0, 10).map((t) => t.label);
    const tagsByEthnicity = crossTabTags(scenes, performers, topTagNames, (p) => p.ethnicity || "Unknown", 8);
    const tagsByCountry = crossTabTags(scenes, performers, topTagNames, (p) => p.country || "Unknown", 12);
    if (tagsByEthnicity) tagsByEthnicity.tags = topTagNames;
    if (tagsByEthnicity) tagsByEthnicity.ethnicities = tagsByEthnicity.cols;
    if (tagsByCountry) tagsByCountry.tags = topTagNames;
    if (tagsByCountry) tagsByCountry.countries = tagsByCountry.cols;

    const tagHierarchy = tags
      .filter((t) => t.children && t.children.length)
      .sort((a, b) => (b.scene_count || 0) - (a.scene_count || 0))
      .map((t) => ({
        id: t.id, name: t.name, sceneCount: t.scene_count || 0,
        children: t.children.map((c) => {
          const full = tagById.get(c.id);
          return { id: c.id, name: c.name, sceneCount: full ? (full.scene_count || 0) : 0 };
        }).sort((a, b) => b.sceneCount - a.sceneCount),
      }));

    // -------- NETWORKS
    const perfEdges = stats.coOccurrence(
      scenes.map((s) => ({ items: (s.performers || []).filter((p) => !(opts.excludePerf && opts.excludePerf.has(p.id))) })),
      (p) => p.id
    );
    const minWeight = Math.max(1, Math.round(scenes.length / 4000));
    const significantEdges = perfEdges.filter((e) => e.weight >= minWeight).slice(0, 200);
    const nodeIds = new Set();
    significantEdges.forEach((e) => { nodeIds.add(e.a); nodeIds.add(e.b); });
    // Keep at most 50 by degree.
    const degree = new Map();
    for (const e of significantEdges) {
      degree.set(e.a, (degree.get(e.a) || 0) + 1);
      degree.set(e.b, (degree.get(e.b) || 0) + 1);
    }
    const topNodes = Array.from(nodeIds).sort((a, b) => (degree.get(b) || 0) - (degree.get(a) || 0)).slice(0, 50);
    const topSet = new Set(topNodes);
    const performerNetworkNodes = topNodes.map((id) => {
      const p = perfById.get(id);
      return {
        id, label: p ? p.name : id,
        sceneCount: p ? (p.scene_count || 0) : 0,
        degree: degree.get(id) || 0,
      };
    });
    const performerNetworkEdges = significantEdges.filter((e) => topSet.has(e.a) && topSet.has(e.b));

    const topPerformerPairs = perfEdges.slice(0, 50).map((e) => ({
      a: (perfById.get(e.a) || {}).name || e.a,
      b: (perfById.get(e.b) || {}).name || e.b,
      weight: e.weight,
    }));

    const studioTagHeatmap = (function () {
      const topStudios = studios.slice().sort((a, b) => (b.scene_count || 0) - (a.scene_count || 0)).slice(0, 10);
      const tagTop = tagFrequency.slice(0, 12).map((t) => t.label);
      const tagSet = new Set(tagTop);
      const studioIds = new Map(topStudios.map((s) => [s.id, s.name]));
      const matrix = topStudios.map(() => tagTop.map(() => 0));
      const tagIndex = new Map(tagTop.map((t, i) => [t, i]));
      const studioIndex = new Map(topStudios.map((s, i) => [s.id, i]));
      for (const s of scenes) {
        if (!s.studio || !studioIndex.has(s.studio.id)) continue;
        const rIdx = studioIndex.get(s.studio.id);
        for (const t of s.tags || []) {
          if (!tagSet.has(t.name)) continue;
          matrix[rIdx][tagIndex.get(t.name)]++;
        }
      }
      return { studios: topStudios.map((s) => s.name), tags: tagTop, matrix };
    })();

    // -------- TIME SERIES (group by YYYY-MM of scene date)
    const monthBuckets = new Map();
    for (const s of scenes) {
      const d = s.date;
      if (!d) continue;
      const key = d.slice(0, 7);
      const entry = monthBuckets.get(key) || { count: 0, dur: 0 };
      entry.count++;
      entry.dur += totalSceneDuration(s);
      monthBuckets.set(key, entry);
    }
    const monthLabels = Array.from(monthBuckets.keys()).sort();
    const scenesPerMonth = { labels: monthLabels, counts: monthLabels.map((k) => monthBuckets.get(k).count) };
    const durationPerMonth = { labels: monthLabels, hours: monthLabels.map((k) => +(monthBuckets.get(k).dur / 3600).toFixed(2)) };

    const topTagsForTrend = tagFrequency.slice(0, 5).map((t) => t.label);
    const tagTrendMap = new Map(topTagsForTrend.map((t) => [t, new Map()]));
    for (const s of scenes) {
      if (!s.date) continue;
      const key = s.date.slice(0, 7);
      for (const t of s.tags || []) {
        if (!tagTrendMap.has(t.name)) continue;
        tagTrendMap.get(t.name).set(key, (tagTrendMap.get(t.name).get(key) || 0) + 1);
      }
    }
    const tagTrends = {
      labels: monthLabels,
      series: topTagsForTrend.map((name) => ({
        label: name,
        values: monthLabels.map((k) => tagTrendMap.get(name).get(k) || 0),
      })),
    };

    // Performer debuts: first month each performer appears in a scene
    const debutsByPerformer = new Map();
    for (const s of scenes) {
      if (!s.date) continue;
      for (const p of s.performers || []) {
        if (!debutsByPerformer.has(p.id) || s.date < debutsByPerformer.get(p.id)) {
          debutsByPerformer.set(p.id, s.date);
        }
      }
    }
    const debutBuckets = new Map();
    for (const d of debutsByPerformer.values()) {
      const k = d.slice(0, 7);
      debutBuckets.set(k, (debutBuckets.get(k) || 0) + 1);
    }
    const debutLabels = Array.from(debutBuckets.keys()).sort();
    const performerDebutsPerMonth = { labels: debutLabels, counts: debutLabels.map((k) => debutBuckets.get(k)) };

    // Top 5 studios over time
    const topStudios = studios.slice().sort((a, b) => (b.scene_count || 0) - (a.scene_count || 0)).slice(0, 5).map((s) => s.name);
    const studioTrendMap = new Map(topStudios.map((s) => [s, new Map()]));
    for (const s of scenes) {
      if (!s.date || !s.studio) continue;
      if (!studioTrendMap.has(s.studio.name)) continue;
      const key = s.date.slice(0, 7);
      studioTrendMap.get(s.studio.name).set(key, (studioTrendMap.get(s.studio.name).get(key) || 0) + 1);
    }
    const studioOutput = {
      labels: monthLabels,
      series: topStudios.map((name) => ({
        label: name,
        values: monthLabels.map((k) => studioTrendMap.get(name).get(k) || 0),
      })),
    };

    // Browser-side correlations — mirrors backend/correlations.js. Skipped
    // when explicitly disabled in settings to keep refresh fast on huge
    // libraries.
    let correlations = null;
    if (opts.enableCorrelations !== false && ns.correlations && ns.correlations.enrichPerformers) {
      correlations = computeCorrelationsBrowser(performers, scenes, {
        minSupport: opts.correlationMinSupport || 3,
        highOThreshold: opts.highOThreshold || 2,
      });
    }

    return {
      computedAt: new Date().toISOString(),
      totals, durationHistogram, studioStorage, resolutionDistribution,
      codecDistribution, ratingDistribution, organizedRatio,
      kpis: perfKpis,
      genderDistribution, ethnicityDistribution, countryDistribution,
      agePyramid: pyramid, heightHistogram, careerVsScenes,
      topByScenes, topByDuration, topByRating, bodyMods, cupDistribution,
      tagKpis, tagFrequency, tagCoOccurrence, tagsByEthnicity, tagsByCountry, tagHierarchy,
      performerNetworkNodes, performerNetworkEdges, topPerformerPairs,
      studioTagHeatmap,
      scenesPerMonth, durationPerMonth, tagTrends, performerDebutsPerMonth, studioOutput,
      correlations,
    };
  };

  // Browser correlations — slim version that drives the Correlations tab
  // when the dashboard runs without a backend cache. Uses the same enricher
  // and bucketing as the backend so heatmap rows / bubble axes line up
  // 1:1.
  function computeCorrelationsBrowser(performers, scenes, o) {
    const enriched = ns.correlations.enrichPerformers(performers, scenes);
    const minSupport = Math.max(1, o.minSupport || 3);
    const highOThreshold = o.highOThreshold || 2;
    const oBuckets = [1, 2, 4, 8];

    function avg(xs) {
      let s = 0, c = 0;
      for (const x of xs) if (x != null && !isNaN(x)) { s += x; c++; }
      return c ? s / c : null;
    }
    function perAttributeAggregate(attr) {
      const groups = new Map();
      for (const e of enriched) {
        const v = e[attr];
        if (v == null || v === "") continue;
        if (!groups.has(v)) groups.set(v, []);
        groups.get(v).push(e);
      }
      const out = [];
      for (const [value, members] of groups) {
        if (members.length < minSupport) continue;
        out.push({
          value, n: members.length,
          avgPerformerO: avg(members.map((m) => m.performerO)),
          avgSceneO: avg(members.map((m) => m.avgSceneO)),
          shareHighO: members.filter((m) => m.avgSceneO >= highOThreshold).length / members.length,
          totalO: members.reduce((s, m) => s + (m.sceneO || 0), 0),
        });
      }
      return out.sort((a, b) => b.avgSceneO - a.avgSceneO);
    }
    function bucketize(n, edges) {
      if (n == null) return null;
      for (let i = 0; i < edges.length; i++) {
        if (n < edges[i]) return i === 0 ? ("<" + edges[0]) : (edges[i - 1] + "–" + (edges[i] - 1));
      }
      return "≥" + edges[edges.length - 1];
    }
    function buildHeatmap(rowAttr, colAttr, topRows, topCols) {
      const cells = new Map();
      const rowAgg = new Map();
      const colAgg = new Map();
      for (const e of enriched) {
        const r = e[rowAttr], c = e[colAttr];
        if (r == null || r === "" || c == null || c === "") continue;
        const key = r + "||" + c;
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(e);
        rowAgg.set(r, (rowAgg.get(r) || 0) + 1);
        colAgg.set(c, (colAgg.get(c) || 0) + 1);
      }
      const rows = Array.from(rowAgg.entries()).sort((a, b) => b[1] - a[1]).slice(0, topRows).map(([k]) => k);
      const cols = Array.from(colAgg.entries()).sort((a, b) => b[1] - a[1]).slice(0, topCols).map(([k]) => k);
      const matrix = rows.map(() => cols.map(() => null));
      const counts = rows.map(() => cols.map(() => 0));
      for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < cols.length; j++) {
          const bucket = cells.get(rows[i] + "||" + cols[j]) || [];
          counts[i][j] = bucket.length;
          if (bucket.length >= minSupport) {
            const v = avg(bucket.map((m) => m.avgSceneO));
            matrix[i][j] = v != null ? +v.toFixed(2) : null;
          }
        }
      }
      // Sort rows by mean of populated cells, descending.
      const meanByRow = rows.map((_, i) => ({
        i, mean: avg(matrix[i].filter((v) => v != null)) || 0,
      }));
      meanByRow.sort((a, b) => b.mean - a.mean);
      return {
        rows: meanByRow.map(({ i }) => rows[i]),
        cols,
        matrix: meanByRow.map(({ i }) => matrix[i]),
        counts: meanByRow.map(({ i }) => counts[i]),
      };
    }
    function cramersV(table) {
      const rowKeys = Object.keys(table);
      if (!rowKeys.length) return 0;
      const colKeys = Array.from(new Set([].concat.apply([], rowKeys.map((r) => Object.keys(table[r])))));
      if (colKeys.length < 2 || rowKeys.length < 2) return 0;
      const rowTotals = {}; const colTotals = {}; let N = 0;
      for (const r of rowKeys) {
        rowTotals[r] = 0;
        for (const c of colKeys) {
          const v = (table[r] && table[r][c]) || 0;
          rowTotals[r] += v;
          colTotals[c] = (colTotals[c] || 0) + v;
          N += v;
        }
      }
      if (N === 0) return 0;
      let chi2 = 0;
      for (const r of rowKeys) {
        for (const c of colKeys) {
          const expected = (rowTotals[r] * colTotals[c]) / N;
          if (expected === 0) continue;
          const observed = (table[r] && table[r][c]) || 0;
          chi2 += Math.pow(observed - expected, 2) / expected;
        }
      }
      const denom = N * (Math.min(rowKeys.length, colKeys.length) - 1);
      return denom <= 0 ? 0 : Math.sqrt(chi2 / denom);
    }
    function pearson(pairs) {
      const xs = [], ys = [];
      for (const [x, y] of pairs) {
        if (x == null || y == null || isNaN(x) || isNaN(y)) continue;
        xs.push(+x); ys.push(+y);
      }
      const n = xs.length;
      if (n < 3) return null;
      const mx = xs.reduce((a, b) => a + b, 0) / n;
      const my = ys.reduce((a, b) => a + b, 0) / n;
      let num = 0, dx2 = 0, dy2 = 0;
      for (let i = 0; i < n; i++) {
        const dx = xs[i] - mx, dy = ys[i] - my;
        num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
      }
      if (dx2 === 0 || dy2 === 0) return null;
      return num / Math.sqrt(dx2 * dy2);
    }

    const perAttribute = {};
    const cramers = {};
    for (const attr of ["country", "ethnicity", "eyeColor", "hairColor",
                        "cupLetter", "ageBucket", "heightBucket", "gender"]) {
      perAttribute[attr] = perAttributeAggregate(attr);
      const table = {};
      for (const e of enriched) {
        const v = e[attr];
        if (v == null || v === "") continue;
        const oo = bucketize(e.avgSceneO, oBuckets);
        table[v] = table[v] || {};
        table[v][oo] = (table[v][oo] || 0) + 1;
      }
      cramers[attr] = +cramersV(table).toFixed(3);
    }
    const pearsonOrdinal = {
      cup: pearson(enriched.map((e) => [e.cupOrdinal, e.avgSceneO])),
      height: pearson(enriched.map((e) => [e.heightCm, e.avgSceneO])),
      age: pearson(enriched.map((e) => [e.age, e.avgSceneO])),
    };
    for (const k of Object.keys(pearsonOrdinal)) {
      if (pearsonOrdinal[k] != null) pearsonOrdinal[k] = +pearsonOrdinal[k].toFixed(3);
    }
    const heatmaps = {
      countryEye: buildHeatmap("country", "eyeColor", 12, 8),
      countryCup: buildHeatmap("country", "cupLetter", 12, 8),
      ethnicityCup: buildHeatmap("ethnicity", "cupLetter", 10, 8),
      ageCup: buildHeatmap("ageBucket", "cupLetter", 8, 8),
    };
    const bubbles = enriched
      .filter((e) => e.cupOrdinal && e.sceneCount > 0)
      .sort((a, b) => b.avgSceneO - a.avgSceneO)
      .slice(0, 200)
      .map((e) => ({
        x: e.cupOrdinal,
        y: +e.avgSceneO.toFixed(2),
        r: Math.min(20, 3 + Math.sqrt(e.sceneCount) * 1.5),
        country: e.country, eyeColor: e.eyeColor, cupLetter: e.cupLetter,
        name: e.name, id: e.id,
      }));

    function normalize(values) {
      const cleaned = values.filter((v) => v != null && !isNaN(v));
      if (!cleaned.length) return { min: 0, max: 1 };
      const min = Math.min.apply(null, cleaned);
      const max = Math.max.apply(null, cleaned);
      return { min, max: max === min ? min + 1 : max };
    }
    function buildCategoricalScale(attr) {
      const groups = new Map();
      for (const e of enriched) {
        const v = e[attr];
        if (v == null || v === "") continue;
        if (!groups.has(v)) groups.set(v, []);
        groups.get(v).push(e.avgSceneO);
      }
      const sorted = Array.from(groups.entries())
        .map(([k, vs]) => ({ k, mean: avg(vs) || 0 }))
        .sort((a, b) => a.mean - b.mean)
        .map(({ k }) => k);
      return { categories: sorted, index: new Map(sorted.map((k, i) => [k, i])) };
    }
    const axes = ["country", "ethnicity", "eyeColor", "cupLetter", "heightCm", "age", "avgSceneO"];
    const catScales = {
      country: buildCategoricalScale("country"),
      ethnicity: buildCategoricalScale("ethnicity"),
      eyeColor: buildCategoricalScale("eyeColor"),
      cupLetter: buildCategoricalScale("cupLetter"),
    };
    const numScales = {
      heightCm: normalize(enriched.map((e) => e.heightCm)),
      age: normalize(enriched.map((e) => e.age)),
      avgSceneO: normalize(enriched.map((e) => e.avgSceneO)),
    };
    const lines = enriched.slice(0, 400).map((e) => {
      const point = {};
      for (const a of axes) {
        if (catScales[a]) {
          const idx = catScales[a].index.get(e[a]);
          point[a] = idx == null ? null : idx / Math.max(1, catScales[a].categories.length - 1);
        } else {
          const v = e[a];
          if (v == null || isNaN(v)) { point[a] = null; continue; }
          const { min, max } = numScales[a];
          point[a] = (v - min) / (max - min);
        }
      }
      return { id: e.id, name: e.name, country: e.country, avgSceneO: e.avgSceneO, axes: point };
    });

    return {
      minSupport, highOThreshold, oBucketEdges: oBuckets,
      perAttribute, cramersV: cramers, pearsonOrdinal,
      heatmaps, bubbles,
      parallel: { axes, lines,
        categoricalAxes: Object.fromEntries(Object.entries(catScales).map(([k, s]) => [k, s.categories])),
        numericAxes: numScales },
      enrichedCount: enriched.length,
    };
  }

  // ---- Helpers
  function totalSceneDuration(s) {
    if (!s.files || !s.files.length) return 0;
    // A scene can have multiple files (extras / mirror copies). We take the
    // max so a 2-min preview file doesn't shrink an otherwise 30-min scene.
    return Math.max.apply(null, s.files.map((f) => f.duration || 0));
  }

  function totalSceneSize(s) {
    if (!s.files || !s.files.length) return 0;
    return s.files.reduce((sum, f) => sum + (Number(f.size) || 0), 0);
  }

  function has(v) {
    return v != null && v !== "" && !/^(no|none|n)$/i.test(String(v).trim());
  }

  function ratio(arr, fn) {
    if (!arr.length) return 0;
    let y = 0, k = 0;
    for (const x of arr) {
      const v = fn(x);
      if (v == null) continue;
      if (v) y++;
      k++;
    }
    return k ? y / k : 0;
  }

  function parseCareerYears(s) {
    if (!s) return null;
    const range = String(s).match(/(\d{4})\s*[-–]\s*(\d{4}|present|now)?/i);
    if (range) {
      const from = +range[1];
      const to = range[2] && !/present|now/i.test(range[2]) ? +range[2] : new Date().getFullYear();
      return Math.max(0, to - from);
    }
    const yrs = String(s).match(/(\d+)\s*y/i);
    if (yrs) return +yrs[1];
    return null;
  }

  function crossTabTags(scenes, performers, tagNames, perfKeyFn, topCols) {
    const perfById = new Map(performers.map((p) => [p.id, p]));
    const cols = new Map();
    for (const p of performers) {
      const k = perfKeyFn(p);
      cols.set(k, (cols.get(k) || 0) + 1);
    }
    const topColLabels = Array.from(cols.keys())
      .sort((a, b) => cols.get(b) - cols.get(a))
      .slice(0, topCols);
    if (!topColLabels.length || !tagNames.length) return null;
    const matrix = tagNames.map(() => topColLabels.map(() => 0));
    const tagIdx = new Map(tagNames.map((t, i) => [t, i]));
    const colIdx = new Map(topColLabels.map((c, i) => [c, i]));
    for (const s of scenes) {
      for (const p of s.performers || []) {
        const full = perfById.get(p.id);
        if (!full) continue;
        const c = perfKeyFn(full);
        if (!colIdx.has(c)) continue;
        for (const t of s.tags || []) {
          if (!tagIdx.has(t.name)) continue;
          matrix[tagIdx.get(t.name)][colIdx.get(c)]++;
        }
      }
    }
    return { matrix, cols: topColLabels };
  }

  // ---- Top-level mount used by metrics.js
  ns.dashboard.mount = function (container) {
    container.innerHTML = "";
    container.classList.add("metrics-root");
    const head = document.createElement("div");
    head.className = "metrics-head";
    head.innerHTML =
      '<h1>Library Metrics</h1>' +
      '<div class="metrics-actions">' +
      '  <span class="metrics-source" id="metrics-source"></span>' +
      '  <button class="btn btn-secondary" id="metrics-refresh">Refresh</button>' +
      '  <button class="btn btn-secondary" id="metrics-export">Download cached JSON</button>' +
      '</div>';
    container.appendChild(head);

    const tabBar = document.createElement("div");
    tabBar.className = "metrics-tabs";
    for (const t of TABS) {
      const btn = document.createElement("button");
      btn.className = "metrics-tab";
      btn.dataset.tab = t.id;
      btn.textContent = t.label;
      tabBar.appendChild(btn);
    }
    container.appendChild(tabBar);

    const filters = document.createElement("div");
    filters.className = "metrics-filters";
    filters.innerHTML =
      '<label>From <input type="date" id="metrics-from"/></label>' +
      '<label>To <input type="date" id="metrics-to"/></label>' +
      '<label>Performer filter <input type="text" id="metrics-performer-q" placeholder="name contains…"/></label>' +
      '<label>Tag filter <input type="text" id="metrics-tag-q" placeholder="name contains…"/></label>' +
      '<div class="metrics-gender-filter"><span class="metrics-gender-label">Gender</span>' +
      '<label><input type="checkbox" class="metrics-gender-cb" data-g="FEMALE" checked/> ♀ Female</label>' +
      '<label><input type="checkbox" class="metrics-gender-cb" data-g="MALE" checked/> ♂ Male</label>' +
      '<label><input type="checkbox" class="metrics-gender-cb" data-g="TRANSGENDER_FEMALE" checked/> Trans ♀</label>' +
      '<label><input type="checkbox" class="metrics-gender-cb" data-g="TRANSGENDER_MALE" checked/> Trans ♂</label>' +
      '<label><input type="checkbox" class="metrics-gender-cb" data-g="INTERSEX" checked/> Intersex</label>' +
      '<label><input type="checkbox" class="metrics-gender-cb" data-g="NON_BINARY" checked/> Non-binary</label>' +
      '</div>';
    container.appendChild(filters);

    const status = document.createElement("div");
    status.className = "metrics-status";
    status.id = "metrics-status";
    status.textContent = "Loading metrics…";
    container.appendChild(status);

    const body = document.createElement("div");
    body.className = "metrics-body";
    container.appendChild(body);

    let state = { activeTab: "overview", payload: null, filtered: null };

    function setActiveTab(id) {
      state.activeTab = id;
      Array.from(tabBar.children).forEach((b) => b.classList.toggle("active", b.dataset.tab === id));
      renderActive();
    }

    function renderActive() {
      if (!state.filtered) return;
      const settings = readSettings();
      body.innerHTML = "";
      const tab = state.activeTab;
      const charts = ns.charts;
      try {
        if (tab === "overview") charts.overview.render(body, state.filtered, settings);
        if (tab === "performers") charts.performers.render(body, state.filtered, settings);
        if (tab === "tags") charts.tags.render(body, state.filtered, settings);
        if (tab === "networks") charts.networks.render(body, state.filtered, settings);
        if (tab === "timeseries") charts.timeseries.render(body, state.filtered, settings);
        if (tab === "play") charts.play.render(body, state.filtered, settings);
        if (tab === "archetypes") charts.archetypes.render(body, state.filtered, settings);
        if (tab === "insights") charts.insights.render(body, state.filtered, settings);
        if (tab === "correlations") charts.correlations.render(body, state.filtered, settings);
        if (tab === "matches") charts.matches.render(body, state.filtered, settings);
        if (tab === "fantasy") charts.fantasy.render(body, state.filtered, settings);
        if (tab === "quality") charts.quality.render(body, state.filtered, settings);
        if (tab === "wrapped") charts.wrapped.render(body, state.filtered, settings);
        if (tab === "bingo") charts.bingo.render(body, state.filtered, settings);
        if (tab === "tagopt") charts.tagopt.render(body, state.filtered, settings);
        if (tab === "cleanup") charts.cleanup.render(body, state.filtered, settings);
      } catch (e) {
        body.innerHTML = '<div class="metrics-error"></div>';
        body.firstChild.textContent = "Render error: " + (e && e.message ? e.message : e);
      }
    }

    // Which genders are currently checked in the filter bar. Returns null
    // when every checkbox is on (i.e. no filter) so downstream code can
    // short-circuit.
    function selectedGenders() {
      const cbs = filters.querySelectorAll(".metrics-gender-cb");
      const on = [], off = [];
      cbs.forEach((cb) => { (cb.checked ? on : off).push(cb.dataset.g); });
      if (!off.length) return null;
      return new Set(on);
    }

    function applyFilters() {
      if (!state.payload) return;
      const from = filters.querySelector("#metrics-from").value;
      const to = filters.querySelector("#metrics-to").value;
      const perfQ = (filters.querySelector("#metrics-performer-q").value || "").trim().toLowerCase();
      const tagQ = (filters.querySelector("#metrics-tag-q").value || "").trim().toLowerCase();
      const genderSet = selectedGenders();

      // Gender filter needs a full re-aggregation because it affects EVERY
      // downstream chart, not just a couple of series. If any checkboxes
      // are off, run the browser aggregator on a filtered _raw block and
      // splice the fresh aggregate in; keep the backend-computed advanced
      // blocks (quality, fantasy, etc.) alongside so those tabs still
      // work (they'll reflect the last cache task, not the live filter).
      let filtered;
      if (genderSet && state.payload._raw && state.payload._raw.performers) {
        const raw = state.payload._raw;
        const kept = raw.performers.filter((p) => p.gender && genderSet.has(p.gender));
        const keptIds = new Set(kept.map((p) => p.id));
        const scenes = (raw.scenes || []).filter((s) =>
          (s.performers || []).some((p) => keptIds.has(p.id)));
        const stats = state.payload.totals || {};
        const reagg = ns.aggregate(
          { scene_count: scenes.length, image_count: stats.images || 0, gallery_count: stats.galleries || 0 },
          kept, raw.tags || [], raw.studios || [], scenes,
          {
            ageBuckets: 5,
            topN: 20,
            enableCorrelations: true,
            correlationMinSupport: 3,
          }
        );
        filtered = Object.assign({}, state.payload, reagg);
        filtered.activeGenderFilter = Array.from(genderSet);
        filtered._raw = { performers: kept, scenes, tags: raw.tags, studios: raw.studios };
      } else {
        filtered = JSON.parse(JSON.stringify(state.payload));
      }

      function inRange(ymd) {
        if (!ymd) return false;
        if (from && ymd < from.slice(0, 7)) return false;
        if (to && ymd > to.slice(0, 10).slice(0, 7)) return false;
        return true;
      }
      if (from || to) {
        const filterSeries = (obj, valKey) => {
          if (!obj || !obj.labels) return;
          const keep = obj.labels.map((l) => inRange(l));
          obj.labels = obj.labels.filter((_, i) => keep[i]);
          if (valKey === "series") {
            obj.series = obj.series.map((s) => ({ ...s, values: s.values.filter((_, i) => keep[i]) }));
          } else {
            obj[valKey] = (obj[valKey] || []).filter((_, i) => keep[i]);
          }
        };
        filterSeries(filtered.scenesPerMonth, "counts");
        filterSeries(filtered.durationPerMonth, "hours");
        filterSeries(filtered.performerDebutsPerMonth, "counts");
        filterSeries(filtered.tagTrends, "series");
        filterSeries(filtered.studioOutput, "series");
      }

      if (perfQ) {
        ["topByScenes", "topByDuration", "topByRating"].forEach((k) => {
          filtered[k] = (filtered[k] || []).filter((x) => x.label.toLowerCase().includes(perfQ));
        });
        filtered.topPerformerPairs = (filtered.topPerformerPairs || []).filter((p) =>
          p.a.toLowerCase().includes(perfQ) || p.b.toLowerCase().includes(perfQ));
      }
      if (tagQ) {
        filtered.tagFrequency = (filtered.tagFrequency || []).filter((t) => t.label.toLowerCase().includes(tagQ));
        filtered.tagCoOccurrence = (filtered.tagCoOccurrence || []).filter((p) =>
          p.a.toLowerCase().includes(tagQ) || p.b.toLowerCase().includes(tagQ));
      }
      state.filtered = filtered;
      // Live-update the header note so the user sees what's currently
      // applied without waiting for a new cache task.
      const src = head.querySelector("#metrics-source");
      if (src) {
        const gender = filtered.activeGenderFilter;
        const base = "source: " + (state.source || "backend-cache") +
          " · computed " + new Date(state.payload.computedAt).toLocaleString();
        src.textContent = base + (gender && gender.length ? " · gender: " + gender.join("+") : "");
      }
      renderActive();
    }

    async function refresh(force) {
      status.textContent = force ? "Recomputing from GraphQL…" : "Loading metrics…";
      try {
        const r = await loadMetrics(force);
        state.payload = r.payload;
        state.filtered = r.payload;
        state.source = r.source;
        const src = head.querySelector("#metrics-source");
        const gender = r.payload.activeGenderFilter;
        const genderNote = gender && gender.length
          ? " · gender: " + gender.join("+")
          : "";
        src.textContent = "source: " + r.source + " · computed " + new Date(r.payload.computedAt).toLocaleString() + genderNote;
        status.textContent = "";
        // Trigger applyFilters once so the initial state respects any
        // pre-checked gender boxes.
        applyFilters();
      } catch (e) {
        status.innerHTML = "";
        const err = document.createElement("div");
        err.className = "metrics-error";
        err.textContent = "Failed to load metrics: " + (e && e.message ? e.message : e);
        status.appendChild(err);
      }
    }

    tabBar.addEventListener("click", (e) => {
      if (e.target && e.target.dataset && e.target.dataset.tab) setActiveTab(e.target.dataset.tab);
    });
    head.querySelector("#metrics-refresh").addEventListener("click", () => refresh(true));
    head.querySelector("#metrics-export").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state.payload || {}, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "stash-metrics.json";
      document.body.appendChild(a); a.click(); a.remove();
    });
    filters.addEventListener("input", debounce(applyFilters, 250));

    setActiveTab("overview");
    refresh(false);
  };

  function debounce(fn, ms) {
    let t;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(ctx, args), ms);
    };
  }
})();
