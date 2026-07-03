"use strict";

/* Excel (.xlsx) exporter. Uses SheetJS `xlsx` — installed as a dependency
 * (see package.json) and resolved off node_modules. Falls back to a
 * human-readable error if the dep isn't present so the rest of the
 * compute_metrics CLI still works without the heavy install.
 *
 * Sheets produced (in order):
 *
 *   1. Library Overview        — KPI block + totals
 *   2. Scenes                  — one row per scene, every available field
 *   3. Performers              — one row per performer, every available field
 *   4. Tags                    — one row per tag with usage stats
 *   5. Studios                 — one row per studio
 *   6. Scene × Performer       — many-to-many junction (pivot-ready)
 *   7. Scene × Tag             — many-to-many junction (pivot-ready)
 *   8. Tag Co-occurrence       — top pairs from the aggregator
 *   9. Top Matches             — current ranked matches if a profile is set
 *  10. Correlations            — per-attribute average O-count summaries
 *  11. Quality                 — hidden gems, overrated/underrated, health
 *
 * Every data sheet gets:
 *   - autofilter on the header row
 *   - frozen header row
 *   - sensible per-column widths
 *   - boolean values written as TRUE/FALSE strings (Excel-friendly) */

const fs = require("fs");
const path = require("path");

function loadXLSX() {
  try {
    return require("xlsx");
  } catch (e) {
    throw new Error(
      "SheetJS (`xlsx`) not installed — run `npm install` inside the plugin directory. " +
      "Underlying error: " + e.message
    );
  }
}

function bytes(n) {
  if (!n) return 0;
  return Math.round(n);
}

function maxFileDuration(s) {
  if (!s.files || !s.files.length) return 0;
  return Math.max.apply(null, s.files.map((f) => f.duration || 0));
}

function sumFileSize(s) {
  if (!s.files || !s.files.length) return 0;
  return s.files.reduce((sum, f) => sum + (Number(f.size) || 0), 0);
}

function firstFile(s) { return (s.files && s.files[0]) || {}; }

function bool(v) { return v ? "TRUE" : "FALSE"; }

function configSheet(ws, columnWidths) {
  if (!ws["!ref"]) return;
  const decode = require("xlsx").utils.decode_range;
  const range = decode(ws["!ref"]);
  // Auto-filter over the header row.
  ws["!autofilter"] = { ref: ws["!ref"] };
  // Frozen header pane.
  ws["!freeze"] = { ySplit: 1 };
  ws["!views"] = [{ ySplit: 1 }];
  // Column widths.
  if (columnWidths && columnWidths.length) {
    ws["!cols"] = columnWidths.map((wch) => ({ wch }));
  } else {
    const cols = [];
    for (let c = range.s.c; c <= range.e.c; c++) cols.push({ wch: 18 });
    ws["!cols"] = cols;
  }
}

function libraryOverviewSheet(XLSX, payload) {
  const totals = payload.totals || {};
  const kpi = payload.kpis || {};
  const rows = [
    { metric: "Scenes",                value: totals.scenes || 0 },
    { metric: "Performers",            value: totals.performers || 0 },
    { metric: "Tags",                  value: totals.tags || 0 },
    { metric: "Studios",               value: totals.studios || 0 },
    { metric: "Images",                value: totals.images || 0 },
    { metric: "Galleries",             value: totals.galleries || 0 },
    { metric: "Total scene duration (s)", value: Math.round(totals.totalDuration || 0) },
    { metric: "Total scene storage (bytes)", value: bytes(totals.totalSize) },
    { metric: "Avg scene duration (s)",   value: Math.round(totals.avgDuration || 0) },
    { metric: "Median scene duration (s)", value: Math.round(totals.medianDuration || 0) },
    { metric: "Favorited performers",    value: totals.performersFavorite || 0 },
    { metric: "Median performer age",    value: kpi.medianAge || "—" },
    { metric: "Avg performer height (cm)", value: kpi.avgHeight ? Math.round(kpi.avgHeight) : "—" },
    { metric: "Countries represented",   value: kpi.countries || 0 },
    { metric: "Library health score",    value: payload.quality && payload.quality.health ? payload.quality.health.score : "—" },
    { metric: "Library health grade",    value: payload.quality && payload.quality.health ? payload.quality.health.grade : "—" },
  ];
  const ws = XLSX.utils.json_to_sheet(rows, { header: ["metric", "value"] });
  configSheet(ws, [40, 20]);
  return ws;
}

function scenesSheet(XLSX, scenes) {
  const rows = scenes.map((s) => {
    const f = firstFile(s);
    return {
      id: s.id,
      title: s.title || "",
      studio: s.studio ? s.studio.name : "",
      date: s.date || "",
      rating100: s.rating100 != null ? s.rating100 : "",
      o_counter: s.o_counter || 0,
      play_count: s.play_count || 0,
      play_duration_s: Math.round(s.play_duration || 0),
      last_played_at: s.last_played_at || "",
      organized: bool(s.organized),
      duration_s: Math.round(maxFileDuration(s)),
      size_bytes: bytes(sumFileSize(s)),
      width: f.width || "",
      height: f.height || "",
      resolution: f.height ? (f.height >= 2000 ? "4K+" : f.height >= 1080 ? "1080p" : f.height >= 720 ? "720p" : f.height >= 480 ? "480p" : "<480p") : "",
      video_codec: f.video_codec || "",
      audio_codec: f.audio_codec || "",
      frame_rate: f.frame_rate || "",
      bit_rate: f.bit_rate || "",
      performers: (s.performers || []).map((p) => p.name).join("; "),
      performer_count: (s.performers || []).length,
      tags: (s.tags || []).map((t) => t.name).join("; "),
      tag_count: (s.tags || []).length,
      created_at: s.created_at || "",
      updated_at: s.updated_at || "",
    };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  configSheet(ws, [10, 48, 26, 12, 9, 10, 10, 14, 22, 10, 11, 13, 8, 8, 11, 11, 11, 10, 10, 50, 14, 50, 9, 22, 22]);
  return ws;
}

function performersSheet(XLSX, performers, scenes) {
  // Aggregate per-performer scene metrics — same enrichment the dashboard
  // uses so the spreadsheet matches what the user sees.
  const sceneOByPerf = new Map();
  const sceneCountByPerf = new Map();
  const playCountByPerf = new Map();
  const playDurByPerf = new Map();
  for (const s of scenes) {
    for (const p of s.performers || []) {
      sceneOByPerf.set(p.id, (sceneOByPerf.get(p.id) || 0) + (s.o_counter || 0));
      sceneCountByPerf.set(p.id, (sceneCountByPerf.get(p.id) || 0) + 1);
      playCountByPerf.set(p.id, (playCountByPerf.get(p.id) || 0) + (s.play_count || 0));
      playDurByPerf.set(p.id, (playDurByPerf.get(p.id) || 0) + (s.play_duration || 0));
    }
  }
  const rows = performers.map((p) => {
    const sceneCount = sceneCountByPerf.get(p.id) || p.scene_count || 0;
    const totalO = sceneOByPerf.get(p.id) || 0;
    return {
      id: p.id,
      name: p.name,
      disambiguation: p.disambiguation || "",
      gender: p.gender || "",
      country: p.country || "",
      ethnicity: p.ethnicity || "",
      eye_color: p.eye_color || "",
      hair_color: p.hair_color || "",
      height_cm: p.height_cm || "",
      weight_kg: p.weight || "",
      measurements: p.measurements || "",
      fake_tits: p.fake_tits || "",
      tattoos: p.tattoos || "",
      piercings: p.piercings || "",
      career_length: p.career_length || "",
      birthdate: p.birthdate || "",
      death_date: p.death_date || "",
      favorite: bool(p.favorite),
      rating100: p.rating100 != null ? p.rating100 : "",
      ignore_auto_tag: bool(p.ignore_auto_tag),
      stash_scene_count: p.scene_count || 0,
      stash_image_count: p.image_count || 0,
      stash_gallery_count: p.gallery_count || 0,
      o_counter: p.o_counter || 0,
      scenes_in_library: sceneCount,
      total_scene_o: totalO,
      avg_scene_o: sceneCount ? +(totalO / sceneCount).toFixed(2) : 0,
      total_play_count: playCountByPerf.get(p.id) || 0,
      total_play_duration_s: Math.round(playDurByPerf.get(p.id) || 0),
      tag_count: (p.tags || []).length,
      tags: (p.tags || []).map((t) => t.name).join("; "),
    };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  configSheet(ws, [8, 28, 22, 10, 8, 16, 12, 12, 9, 10, 16, 10, 32, 22, 18, 12, 12, 9, 10, 13, 14, 14, 16, 9, 14, 14, 13, 14, 20, 9, 50]);
  return ws;
}

function tagsSheet(XLSX, tags, payload) {
  const freqMap = new Map((payload.tagFrequency || []).map((t) => [t.id || t.label, t.value]));
  // Compute the top-3 co-occurring tags for each tag in the dataset.
  const coOcc = new Map();
  for (const p of payload.tagCoOccurrence || []) {
    for (const k of [p.a, p.b]) {
      const partner = k === p.a ? p.b : p.a;
      const arr = coOcc.get(k) || [];
      arr.push({ partner, weight: p.weight });
      coOcc.set(k, arr);
    }
  }
  const rows = tags.map((t) => {
    const partners = (coOcc.get(t.name) || []).sort((a, b) => b.weight - a.weight).slice(0, 5);
    return {
      id: t.id,
      name: t.name,
      description: t.description || "",
      scene_count: t.scene_count || 0,
      performer_count: t.performer_count || 0,
      image_count: t.image_count || 0,
      gallery_count: t.gallery_count || 0,
      parents: (t.parents || []).map((x) => x.name).join("; "),
      children: (t.children || []).map((x) => x.name).join("; "),
      observed_scene_count: freqMap.get(t.id) || freqMap.get(t.name) || 0,
      top_co_tags: partners.map((x) => x.partner + " (" + x.weight + ")").join("; "),
    };
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  configSheet(ws, [8, 28, 60, 12, 14, 12, 12, 40, 40, 18, 60]);
  return ws;
}

function studiosSheet(XLSX, studios) {
  const rows = studios.map((s) => ({
    id: s.id,
    name: s.name,
    parent: s.parent_studio ? s.parent_studio.name : "",
    scene_count: s.scene_count || 0,
    performer_count: s.performer_count || 0,
    rating100: s.rating100 != null ? s.rating100 : "",
    favorite: bool(s.favorite),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  configSheet(ws, [8, 32, 32, 12, 14, 9, 9]);
  return ws;
}

function scenePerformerSheet(XLSX, scenes) {
  const rows = [];
  for (const s of scenes) {
    for (const p of s.performers || []) {
      rows.push({
        scene_id: s.id,
        scene_title: s.title || "",
        scene_date: s.date || "",
        performer_id: p.id,
        performer_name: p.name,
        performer_gender: p.gender || "",
      });
    }
  }
  const ws = XLSX.utils.json_to_sheet(rows);
  configSheet(ws, [10, 48, 12, 12, 28, 10]);
  return ws;
}

function sceneTagSheet(XLSX, scenes) {
  const rows = [];
  for (const s of scenes) {
    for (const t of s.tags || []) {
      rows.push({
        scene_id: s.id,
        scene_title: s.title || "",
        scene_date: s.date || "",
        tag_id: t.id,
        tag_name: t.name,
      });
    }
  }
  const ws = XLSX.utils.json_to_sheet(rows);
  configSheet(ws, [10, 48, 12, 10, 28]);
  return ws;
}

function tagCoOccurrenceSheet(XLSX, payload) {
  const rows = (payload.tagCoOccurrence || []).map((p) => ({
    tag_a: p.a, tag_b: p.b, shared_scenes: p.weight,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  configSheet(ws, [28, 28, 14]);
  return ws;
}

function topMatchesSheet(XLSX, payload, settings) {
  const matches = (payload.matches) || null;
  if (!matches) return null;
  const rows = (matches.performers || []).map((m, i) => ({
    rank: i + 1,
    name: m.name,
    score: m.score,
    country: m.country || "",
    ethnicity: m.ethnicity || "",
    eye_color: m.eyeColor || "",
    hair_color: m.hairColor || "",
    cup: m.cupLetter || "",
    height_cm: m.heightCm || "",
    age: m.age || "",
    avg_scene_o: m.avgSceneO,
    scenes: m.sceneCount || 0,
    rating100: m.rating100 != null ? m.rating100 : "",
    favorite: bool(m.favorite),
  }));
  if (!rows.length) return null;
  const ws = XLSX.utils.json_to_sheet(rows);
  configSheet(ws, [6, 28, 8, 10, 16, 12, 14, 6, 10, 6, 12, 8, 9, 9]);
  return ws;
}

function correlationsSheet(XLSX, payload) {
  const corr = payload.correlations;
  if (!corr) return null;
  const rows = [];
  for (const [attr, list] of Object.entries(corr.perAttribute || {})) {
    for (const r of list) {
      rows.push({
        attribute: attr,
        value: r.value,
        n: r.n,
        avg_performer_o: r.avgPerformerO != null ? +r.avgPerformerO.toFixed(2) : "",
        avg_scene_o: r.avgSceneO != null ? +r.avgSceneO.toFixed(2) : "",
        share_high_o: r.shareHighO != null ? +(r.shareHighO * 100).toFixed(1) : "",
        total_o: r.totalO || 0,
      });
    }
  }
  rows.push({});  // spacer
  rows.push({ attribute: "Cramér's V" });
  for (const [attr, v] of Object.entries(corr.cramersV || {})) {
    rows.push({ attribute: attr, value: "V = " + v });
  }
  rows.push({});
  rows.push({ attribute: "Pearson r (vs avg scene O)" });
  for (const [attr, v] of Object.entries(corr.pearsonOrdinal || {})) {
    if (v == null) continue;
    rows.push({ attribute: attr, value: "r = " + v });
  }
  const ws = XLSX.utils.json_to_sheet(rows, { header: ["attribute", "value", "n", "avg_performer_o", "avg_scene_o", "share_high_o", "total_o"] });
  configSheet(ws, [22, 22, 8, 16, 14, 14, 12]);
  return ws;
}

function qualitySheet(XLSX, payload) {
  const q = payload.quality;
  if (!q) return null;
  const rows = [];
  rows.push({ section: "Health", key: "score", value: q.health.score });
  rows.push({ section: "Health", key: "grade", value: q.health.grade });
  for (const [k, v] of Object.entries(q.health.components || {})) {
    rows.push({ section: "Health components", key: k, value: v });
  }
  rows.push({});
  rows.push({ section: "Completion rates (% of played scenes)" });
  for (const [k, v] of Object.entries((q.completion && q.completion.sharesPct) || {})) {
    rows.push({ section: "Completion", key: k, value: v + "%" });
  }
  rows.push({});
  rows.push({ section: "Hidden gems (top)" });
  for (const g of (q.hiddenGems || []).slice(0, 20)) {
    rows.push({ section: "Hidden gem", key: g.title, value: "rating " + g.rating100 + " · " + g.playCount + " plays · gem score " + g.gemScore });
  }
  rows.push({});
  rows.push({ section: "Overrated scenes (positive z)" });
  for (const o of (q.sceneAnomalies && q.sceneAnomalies.overrated) || []) {
    rows.push({ section: "Overrated", key: o.title, value: "rating " + o.rating100 + " · predicted " + o.predicted + " · z=" + o.z });
  }
  rows.push({});
  rows.push({ section: "Underrated scenes (negative z)" });
  for (const u of (q.sceneAnomalies && q.sceneAnomalies.underrated) || []) {
    rows.push({ section: "Underrated", key: u.title, value: "rating " + u.rating100 + " · predicted " + u.predicted + " · z=" + u.z });
  }
  rows.push({});
  rows.push({ section: "Overrated performers" });
  for (const o of (q.performerAnomalies && q.performerAnomalies.overrated) || []) {
    rows.push({ section: "Overrated", key: o.name, value: "rating " + o.rating100 + " · avg O " + o.avgSceneO + " · z=" + o.z });
  }
  rows.push({});
  rows.push({ section: "Underrated performers" });
  for (const u of (q.performerAnomalies && q.performerAnomalies.underrated) || []) {
    rows.push({ section: "Underrated", key: u.name, value: "rating " + u.rating100 + " · avg O " + u.avgSceneO + " · z=" + u.z });
  }
  const ws = XLSX.utils.json_to_sheet(rows, { header: ["section", "key", "value"] });
  configSheet(ws, [30, 36, 60]);
  return ws;
}

function writeWorkbook(file, payload, settings, raw) {
  const XLSX = loadXLSX();
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, libraryOverviewSheet(XLSX, payload), "Library Overview");
  XLSX.utils.book_append_sheet(wb, scenesSheet(XLSX, raw.scenes), "Scenes");
  XLSX.utils.book_append_sheet(wb, performersSheet(XLSX, raw.performers, raw.scenes), "Performers");
  XLSX.utils.book_append_sheet(wb, tagsSheet(XLSX, raw.tags, payload), "Tags");
  XLSX.utils.book_append_sheet(wb, studiosSheet(XLSX, raw.studios), "Studios");
  XLSX.utils.book_append_sheet(wb, scenePerformerSheet(XLSX, raw.scenes), "Scene × Performer");
  XLSX.utils.book_append_sheet(wb, sceneTagSheet(XLSX, raw.scenes), "Scene × Tag");
  XLSX.utils.book_append_sheet(wb, tagCoOccurrenceSheet(XLSX, payload), "Tag Co-occurrence");
  const tm = topMatchesSheet(XLSX, payload, settings);
  if (tm) XLSX.utils.book_append_sheet(wb, tm, "Top Matches");
  const cs = correlationsSheet(XLSX, payload);
  if (cs) XLSX.utils.book_append_sheet(wb, cs, "Correlations");
  const qs = qualitySheet(XLSX, payload);
  if (qs) XLSX.utils.book_append_sheet(wb, qs, "Quality");

  // Workbook metadata
  wb.Props = {
    Title: "Stash Library Metrics",
    Subject: "Full library export",
    CreatedDate: new Date(),
    Application: "stash-metrics-plugin",
  };

  fs.mkdirSync(path.dirname(file), { recursive: true });
  XLSX.writeFile(wb, file);
  return file;
}

module.exports = { writeWorkbook };
