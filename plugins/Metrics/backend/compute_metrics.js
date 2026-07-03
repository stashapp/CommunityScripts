#!/usr/bin/env node
"use strict";

/* Stash plugin entry script. Wired up from plugin.yml in two roles:
 *
 *   - As a runnable task (`Generate Full Metrics Report`,
 *     `Update Metrics Cache`) — invoked with --mode=full-report or
 *     --mode=cache-refresh.
 *   - As a hook (Scan.Complete.Post, Generate.Complete.Post) — invoked with
 *     --mode=hook --hook=scan|generate.
 *
 * Stash passes a JSON payload on stdin describing the trigger; we mostly
 * ignore its contents but consume it so the parent doesn't block on a pipe.
 *
 * Output goes to:
 *   <plugin>/assets/metrics-cache.json   (read by the UI)
 *   <plugin>/cache/reports/<ts>/report.html
 *   <plugin>/cache/reports/<ts>/csv/*.csv
 *   <plugin>/cache/reports/<ts>/metrics.json
 */

const fs = require("fs");
const path = require("path");
const stash = require("./stash_client");
const { aggregate } = require("./aggregate");
const report = require("./report");
const { findMatches } = require("./recommender");
const { computeYearReview, writeYearReviewHtml } = require("./year_review");
const excel = require("./excel");

const ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const out = { mode: "cache-refresh" };
  for (const a of argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
    else if (a.startsWith("--")) out[a.slice(2)] = true;
  }
  return out;
}

function readSettings() {
  // Stash provides plugin settings as a JSON env var when invoking tasks.
  // The actual variable name has shifted across Stash versions — check
  // both. Fall back to an empty object.
  const raw = process.env.PLUGIN_SETTINGS_JSON || process.env.PLUGIN_DIR_SETTINGS;
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* ignore */ }
  }
  // Try Stash's stdin payload (some versions ship settings there).
  return {};
}

function readStdinJson() {
  try {
    if (process.stdin.isTTY) return null;
    // Blocking read of the whole stdin stream — Stash writes a single JSON
    // document and closes the pipe. fs.readFileSync(0) is the simplest
    // primitive that handles both short and multi-buffer payloads.
    const raw = fs.readFileSync(0, "utf8");
    if (!raw || !raw.trim()) return null;
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function log(msg) {
  // Stash watches stdout/stderr for progress. Prefix so it's grep-able in
  // the task log.
  process.stderr.write("[metrics] " + msg + "\n");
}

function progressFor(entity) {
  return (loaded, total) => log(entity + ": " + loaded + "/" + total);
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); return p; }

// When Stash invokes a plugin script it passes a `server_connection` block
// describing where the local Stash lives + the API key. Push those values
// into the environment so backend/stash_client.js picks them up the same
// way the CLI code path does.
function applyStashConnection(sc) {
  if (!sc) return;
  if (sc.Scheme) process.env.STASH_SERVER_SCHEME = String(sc.Scheme).toLowerCase();
  if (sc.Port) process.env.STASH_SERVER_PORT = String(sc.Port);
  if (sc.Host) process.env.STASH_SERVER_HOST = String(sc.Host);
  else if (sc.Scheme || sc.Port) process.env.STASH_SERVER_HOST = process.env.STASH_SERVER_HOST || "localhost";
  if (sc.SessionCookie && sc.SessionCookie.Value) {
    process.env.STASH_SESSION_COOKIE = sc.SessionCookie.Value;
  }
  if (sc.ApiKey) process.env.STASH_API_KEY = String(sc.ApiKey);
}

function tsSlug() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + pad(d.getHours()) + pad(d.getMinutes());
}

async function compute(settings) {
  log("fetching stats");
  const statsBlock = await stash.stats();
  log("fetching tags");
  const tags = await stash.fetchAll("tags", stash.TAG_FIELDS, 500, progressFor("tags"));
  log("fetching studios");
  const studios = await stash.fetchAll("studios", stash.STUDIO_FIELDS, 500, progressFor("studios"));
  log("fetching performers");
  const performers = await stash.fetchAll("performers", stash.PERFORMER_FIELDS, 250, progressFor("performers"));
  log("fetching scenes");
  const scenes = await stash.fetchAll("scenes", stash.SCENE_FIELDS, 250, progressFor("scenes"));

  const excludeTagIds = String(settings.excludeTagIds || "").split(",").map((s) => s.trim()).filter(Boolean);
  const excludePerformerIds = String(settings.excludePerformerIds || "").split(",").map((s) => s.trim()).filter(Boolean);
  const ageBuckets = Number(settings.ageBuckets) || 5;
  const topN = Number(settings.topN) || 20;

  log("aggregating");
  // Feature blocks default to ON. Stash's plugin.yml BOOLEAN settings ship
  // as `false` when untouched, so my old `!== false` check silently
  // disabled everything on first install. Users can opt OUT via the
  // matching `disable*` toggle in plugin settings.
  // Apply the gender filter here too, so the payload._raw block the
  // Matches / Fantasy tabs read is scoped consistently with everything
  // else the dashboard renders.
  const genderRaw = String(settings.genderFilter || "").trim().toUpperCase();
  const allowedGenders = genderRaw && genderRaw !== "ALL"
    ? new Set(genderRaw.split(",").map((g) => g.trim()).filter(Boolean))
    : null;
  let filteredPerformers = performers;
  let filteredScenesForRaw = scenes;
  if (allowedGenders) {
    filteredPerformers = performers.filter((p) => p.gender && allowedGenders.has(p.gender));
    filteredScenesForRaw = scenes.filter((s) =>
      (s.performers || []).some((p) => p.gender && allowedGenders.has(p.gender)));
    log("gender filter: kept " + filteredPerformers.length + "/" + performers.length +
        " performers, " + filteredScenesForRaw.length + "/" + scenes.length + " scenes");
  }
  const payload = aggregate(statsBlock, filteredPerformers, tags, studios, filteredScenesForRaw, {
    excludeTagIds, excludePerformerIds, ageBuckets, topN,
    genderFilter: settings.genderFilter,
    enableCorrelations: !settings.disableCorrelations,
    correlationMinSupport: Number(settings.correlationMinSupport) || 3,
    enablePlayHistory: !settings.disablePlayHistory,
    enableArchetypes: !settings.disableArchetypes,
    archetypeClusters: Number(settings.archetypeClusters) || 6,
    enableDiversity: !settings.disableDiversity,
    enableTemporal: !settings.disableTemporal,
    enableFantasy: !settings.disableFantasy,
    fantasyMode: settings.fantasyMode || "favorites",
    fantasyConsensus: Number(settings.fantasyConsensus) || 0.5,
    enableQuality: !settings.disableQuality,
    gemRatingFloor: Number(settings.gemRatingFloor) || 80,
    gemPlayCeiling: settings.gemPlayCeiling != null ? Number(settings.gemPlayCeiling) : 2,
    qualityZThreshold: Number(settings.qualityZThreshold) || 1.0,
    qualityMinScenes: Number(settings.qualityMinScenes) || 2,
  });
  payload._raw = {
    performers: filteredPerformers,
    tags,
    studios,
    scenes: filteredScenesForRaw,
  };
  return payload;
}

function readProfile(settings) {
  const raw = settings.preferenceProfile;
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch (e) {
    log("preferenceProfile is not valid JSON — ignoring (" + e.message + ")");
    return {};
  }
}

// Slim raw entities the browser Matches / Fantasy tabs need to re-score
// against a preference profile in-flight. We strip the huge fields (per-file
// metadata, descriptions) but keep every attribute the recommender reads.
// Trades ~300 KiB for interactive re-ranking without a live GraphQL
// roundtrip.
function slimRaw(payload) {
  const raw = payload._raw || {};
  const performers = (raw.performers || []).map((p) => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    country: p.country,
    ethnicity: p.ethnicity,
    eye_color: p.eye_color,
    hair_color: p.hair_color,
    height_cm: p.height_cm,
    weight: p.weight,
    measurements: p.measurements,
    fake_tits: p.fake_tits,
    tattoos: p.tattoos,
    piercings: p.piercings,
    career_length: p.career_length,
    birthdate: p.birthdate,
    death_date: p.death_date,
    favorite: p.favorite,
    rating100: p.rating100,
    scene_count: p.scene_count,
    o_counter: p.o_counter,
    tags: (p.tags || []).map((t) => ({ id: t.id, name: t.name })),
  }));
  const scenes = (raw.scenes || []).map((s) => ({
    id: s.id,
    title: s.title,
    date: s.date,
    rating100: s.rating100,
    o_counter: s.o_counter,
    play_count: s.play_count,
    play_duration: s.play_duration,
    last_played_at: s.last_played_at,
    organized: s.organized,
    studio: s.studio ? { id: s.studio.id, name: s.studio.name } : null,
    performers: (s.performers || []).map((p) => ({ id: p.id, name: p.name, gender: p.gender })),
    tags: (s.tags || []).map((t) => ({ id: t.id, name: t.name })),
    // Keep a single-element files array so avg-duration and resolution
    // charts in live mode still work; drop everything else.
    files: (s.files || []).slice(0, 1).map((f) => ({
      size: f.size, duration: f.duration, width: f.width, height: f.height, video_codec: f.video_codec,
    })),
  }));
  return { performers, scenes };
}

function writeCache(payload) {
  ensureDir(path.join(ROOT, "assets"));
  const slim = Object.assign({}, payload);
  // Preserve a compact _raw so the Matches / Fantasy tabs can re-score
  // against user-tweaked preference profiles without hitting GraphQL.
  slim._raw = slimRaw(payload);
  const jsonStr = JSON.stringify(slim);

  // 1) JSON on disk — for CLI users and as a backup.
  const outJson = path.join(ROOT, "assets", "metrics-cache.json");
  fs.writeFileSync(outJson, jsonStr, "utf8");
  log("wrote " + outJson + " (" + Math.round(fs.statSync(outJson).size / 1024) + " KiB)");

  // 2) JS bootstrap — Stash's plugin schema only serves files declared in
  //    ui.javascript, so we ship the cache as a JS file that assigns the
  //    parsed JSON to a global variable. The dashboard reads this global
  //    at load time and bypasses fetch() entirely.
  const outJs = path.join(ROOT, "assets", "metrics-cache.js");
  const escaped = jsonStr.replace(/</g, "\\u003c");
  fs.writeFileSync(outJs, "window.__STASH_METRICS_CACHE__ = " + escaped + ";\n", "utf8");
  log("wrote " + outJs);
}

function writeMatches(matches) {
  const out = path.join(ROOT, "assets", "matches-cache.json");
  ensureDir(path.dirname(out));
  fs.writeFileSync(out, JSON.stringify(matches), "utf8");
  log("wrote " + out);
}

function writeFullReport(payload, settings) {
  const formats = String(settings.reportFormats || "json,csv,html")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  const dir = ensureDir(path.join(ROOT, "cache", "reports", tsSlug()));
  if (formats.includes("json")) {
    fs.writeFileSync(path.join(dir, "metrics.json"), JSON.stringify(payload, null, 2), "utf8");
    log("wrote " + dir + "/metrics.json");
  }
  if (formats.includes("csv")) {
    report.writeCsvBundle(path.join(dir, "csv"), payload);
    log("wrote " + dir + "/csv/*.csv");
  }
  if (formats.includes("html")) {
    report.writeHtml(path.join(dir, "report.html"), payload, {
      chartJsUrl: "../../assets/lib/chart.umd.min.js",
    });
    log("wrote " + dir + "/report.html");
  }
  // Write/update a "latest" symlink-style copy for easy linking.
  try {
    const latestHtml = path.join(ROOT, "cache", "reports", "latest.html");
    fs.copyFileSync(path.join(dir, "report.html"), latestHtml);
  } catch (e) { /* ignore */ }
}

async function main() {
  const cliArgs = parseArgs(process.argv);
  const stdin = readStdinJson();
  // Stash-invoked path: stdin JSON carries defaultArgs under args, plus a
  // server_connection block used to configure the GraphQL client.
  const stdinArgs = (stdin && stdin.args) || {};
  const args = Object.assign({}, cliArgs, stdinArgs);
  if (!args.mode) args.mode = "cache-refresh";
  if (stdin && stdin.server_connection) applyStashConnection(stdin.server_connection);
  // Settings are merged from the env var (older Stash) and from
  // stdin.args.pluginSettings (newer Stash forwards them there).
  const settings = Object.assign(
    {},
    readSettings(),
    (stdinArgs && stdinArgs.pluginSettings) || {}
  );
  log("mode=" + args.mode + (args.hook ? " hook=" + args.hook : ""));
  // One-line diagnostic — surfaces exactly which enable/disable flags are
  // in play so support requests are trivial to triage.
  const flagKeys = Object.keys(settings).filter((k) => /^(disable|enable)/i.test(k));
  const flagSnapshot = flagKeys.length
    ? flagKeys.map((k) => k + "=" + settings[k]).join(", ")
    : "(no feature flags — all defaults)";
  log("settings: " + flagSnapshot);

  if (args.mode === "hook") {
    // Only refresh if the corresponding toggle is on. Falls through to a
    // cache refresh; never produces a full report from hook context to
    // avoid hammering the server after every scan.
    const ok = args.hook === "scan"
      ? !!settings.refreshOnScanComplete
      : args.hook === "generate"
        ? !!settings.refreshOnMetadataUpdate
        : false;
    if (!ok) { log("hook " + args.hook + " disabled in settings — exiting"); return; }
    const payload = await compute(settings);
    writeCache(payload);
    return;
  }

  if (args.mode === "cache-refresh") {
    const payload = await compute(settings);
    writeCache(payload);
    return;
  }

  if (args.mode === "full-report") {
    const payload = await compute(settings);
    writeCache(payload);
    writeFullReport(payload, settings);
    return;
  }

  if (args.mode === "year-review") {
    const year = args.year ? +args.year : (new Date().getFullYear() - 1);
    log("year-in-review for " + year);
    const payload = await compute(settings);
    writeCache(payload);
    const review = computeYearReview(
      payload._raw.performers, payload._raw.scenes,
      payload._raw.tags, payload._raw.studios, year, {}
    );
    const dir = ensureDir(path.join(ROOT, "cache", "reports", tsSlug() + "-" + year));
    fs.writeFileSync(path.join(dir, "year-review.json"), JSON.stringify(review, null, 2), "utf8");
    writeYearReviewHtml(path.join(dir, "year-review.html"), review, {
      chartJsUrl: "../../assets/lib/chart.umd.min.js",
    });
    log("wrote " + dir);
    try {
      fs.copyFileSync(path.join(dir, "year-review.html"),
        path.join(ROOT, "cache", "reports", "latest-year-review.html"));
    } catch (e) { /* ignore */ }
    return;
  }

  if (args.mode === "excel-export") {
    const payload = await compute(settings);
    writeCache(payload);
    // Bake the user's profile-based matches into the workbook if requested
    // and a profile is configured.
    const profile = readProfile(settings);
    if (profile && Object.keys(profile).length) {
      try {
        payload.matches = findMatches(payload._raw.performers, payload._raw.scenes, profile, {
          matchIncludeUnknown: !!settings.matchIncludeUnknown,
          matchMinScore: Number(settings.matchMinScore) || 0,
        });
      } catch (e) { log("match generation skipped: " + e.message); }
    }
    const dir = ensureDir(path.join(ROOT, "cache", "reports", tsSlug()));
    const file = path.join(dir, "library-export.xlsx");
    excel.writeWorkbook(file, payload, settings, payload._raw);
    log("wrote " + file);
    try {
      fs.copyFileSync(file, path.join(ROOT, "cache", "reports", "latest-library-export.xlsx"));
    } catch (e) { /* ignore */ }
    return;
  }

  if (args.mode === "match") {
    const payload = await compute(settings);
    writeCache(payload);
    const profile = readProfile(settings);
    const matches = findMatches(payload._raw.performers, payload._raw.scenes, profile, {
      matchIncludeUnknown: !!settings.matchIncludeUnknown,
      matchMinScore: Number(settings.matchMinScore) || 0,
    });
    writeMatches(matches);
    log("ranked " + matches.performers.length + " performers / " + matches.scenes.length + " scenes");
    const dir = ensureDir(path.join(ROOT, "cache", "reports", tsSlug()));
    fs.writeFileSync(path.join(dir, "matches.json"), JSON.stringify(matches, null, 2), "utf8");
    report.writeMatchesHtml(path.join(dir, "matches.html"), matches, {
      chartJsUrl: "../../assets/lib/chart.umd.min.js",
    });
    try {
      fs.copyFileSync(path.join(dir, "matches.html"),
        path.join(ROOT, "cache", "reports", "latest-matches.html"));
    } catch (e) { /* ignore */ }
    return;
  }

  throw new Error("Unknown mode: " + args.mode);
}

main().then(() => {
  log("done");
  process.exit(0);
}).catch((e) => {
  log("ERROR " + (e && e.stack ? e.stack : e));
  process.exit(1);
});
