"use strict";

/* Tiny GraphQL client for the Stash server. Uses only Node 18+ built-ins
 * (global fetch). Reads server URL + API key from the environment Stash
 * passes to plugin scripts:
 *
 *   STASH_SERVER_HOST  (e.g. "localhost")
 *   STASH_SERVER_PORT  (e.g. "9999")
 *   STASH_SERVER_SCHEME ("http"|"https")
 *   STASH_API_KEY     (set if API key is configured in Stash)
 *
 * When running outside Stash (e.g. `npm run compute` from a dev machine),
 * the same vars can be exported manually or placed in a .env file in the
 * plugin root. */

const fs = require("fs");
const path = require("path");

function loadDotEnv() {
  const f = path.resolve(__dirname, "..", ".env");
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
}

function serverUrl() {
  loadDotEnv();
  const scheme = process.env.STASH_SERVER_SCHEME || "http";
  const host = process.env.STASH_SERVER_HOST || "localhost";
  const port = process.env.STASH_SERVER_PORT || "9999";
  return scheme + "://" + host + ":" + port + "/graphql";
}

async function query(q, variables) {
  const url = serverUrl();
  const headers = { "Content-Type": "application/json" };
  if (process.env.STASH_API_KEY) headers["ApiKey"] = process.env.STASH_API_KEY;
  // Stash forwards a session cookie when it invokes plugins — attach it
  // so authenticated instances don't 401 us.
  if (process.env.STASH_SESSION_COOKIE) headers["Cookie"] = "session=" + process.env.STASH_SESSION_COOKIE;
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: q, variables }),
    });
  } catch (e) {
    throw new Error("GraphQL request to " + url + " failed: " + e.message);
  }
  if (!res.ok) throw new Error("GraphQL HTTP " + res.status + " " + res.statusText);
  const json = await res.json();
  if (json.errors && json.errors.length) {
    throw new Error("GraphQL error: " + json.errors.map((e) => e.message).join("; "));
  }
  return json.data;
}

const PERFORMER_FIELDS = `
  id name disambiguation gender country ethnicity eye_color hair_color
  height_cm weight measurements fake_tits tattoos piercings
  career_length birthdate death_date favorite rating100 ignore_auto_tag
  scene_count image_count gallery_count o_counter
  tags { id name }
`;
const SCENE_FIELDS = `
  id title date rating100 o_counter play_count play_duration
  last_played_at play_history resume_time created_at updated_at organized
  studio { id name } performers { id name gender } tags { id name }
  files { size duration width height video_codec audio_codec frame_rate bit_rate }
`;

// Fallback for Stash < 0.24 — `play_history` / `last_played_at` / `play_duration`
// don't exist there. The fetchAll path retries with this set if the schema
// rejects the rich query.
const SCENE_FIELDS_LEGACY = `
  id title date rating100 o_counter play_count organized
  studio { id name } performers { id name gender } tags { id name }
  files { size duration width height video_codec audio_codec frame_rate bit_rate }
`;
const TAG_FIELDS = `
  id name description parents { id name } children { id name }
  scene_count performer_count image_count gallery_count
`;
const STUDIO_FIELDS = `
  id name parent_studio { id name } scene_count performer_count rating100 favorite
`;

async function fetchAll(entity, fields, perPage, log) {
  const root = ({
    performers: "findPerformers", scenes: "findScenes",
    tags: "findTags", studios: "findStudios",
  })[entity];
  if (!root) throw new Error("Unknown entity: " + entity);
  const sortField = ({
    scenes: "date", performers: "name", tags: "name", studios: "name",
  })[entity];
  const all = [];
  let page = 1, total = Infinity;
  let activeFields = fields;
  while ((page - 1) * perPage < total) {
    try {
      const data = await query(`
        query Page($filter: FindFilterType) {
          ${root}(filter: $filter) {
            count
            ${entity} { ${activeFields} }
          }
        }`, {
        filter: { per_page: perPage, page, sort: sortField, direction: "ASC" },
      });
      total = data[root].count;
      all.push.apply(all, data[root][entity]);
      if (log) log(entity + " " + all.length + "/" + total);
      page++;
      if (page > 1000) break;
    } catch (e) {
      // If we're scenes-page-1 and the schema rejected our rich field set,
      // fall back to the legacy fields so older Stash installs still work.
      if (page === 1 && entity === "scenes" && activeFields === SCENE_FIELDS &&
          /(Cannot query|Unknown field|undefined field)/i.test(e.message)) {
        if (log) log("scenes: schema lacks play_history/last_played_at — retrying with legacy fields");
        activeFields = SCENE_FIELDS_LEGACY;
        continue;
      }
      throw e;
    }
  }
  return all;
}

async function stats() {
  const data = await query(`
    query { stats {
      scene_count scenes_size scenes_duration
      image_count images_size gallery_count
      performer_count studio_count movie_count tag_count
      total_o_count total_play_duration
    } }`);
  return data.stats;
}

module.exports = {
  query, fetchAll, stats,
  PERFORMER_FIELDS, SCENE_FIELDS, SCENE_FIELDS_LEGACY, TAG_FIELDS, STUDIO_FIELDS,
};
