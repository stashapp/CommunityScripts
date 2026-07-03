(function () {
  "use strict";

  const ns = (window.StashMetrics = window.StashMetrics || {});
  const gql = (ns.gql = {});

  // The full performer field set we aggregate over. Kept in one place so the
  // dashboard, the cache loader and the Node backend stay in sync.
  gql.PERFORMER_FIELDS = `
    id
    name
    disambiguation
    gender
    country
    ethnicity
    eye_color
    hair_color
    height_cm
    weight
    measurements
    fake_tits
    tattoos
    piercings
    career_length
    birthdate
    death_date
    favorite
    rating100
    ignore_auto_tag
    scene_count
    image_count
    gallery_count
    o_counter
    tags { id name }
  `;

  gql.SCENE_FIELDS = `
    id
    title
    date
    rating100
    o_counter
    play_count
    play_duration
    last_played_at
    play_history
    resume_time
    created_at
    updated_at
    organized
    studio { id name }
    performers { id name gender }
    tags { id name }
    files {
      size
      duration
      width
      height
      video_codec
      audio_codec
      frame_rate
      bit_rate
    }
  `;

  // Legacy fallback for Stash < 0.24.
  gql.SCENE_FIELDS_LEGACY = `
    id title date rating100 o_counter play_count organized
    studio { id name }
    performers { id name gender }
    tags { id name }
    files { size duration width height video_codec audio_codec frame_rate bit_rate }
  `;

  gql.TAG_FIELDS = `
    id
    name
    description
    parents { id name }
    children { id name }
    scene_count
    performer_count
    image_count
    gallery_count
  `;

  gql.STUDIO_FIELDS = `
    id
    name
    parent_studio { id name }
    scene_count
    performer_count
    rating100
    favorite
  `;

  // Issue a GraphQL query through Stash's authenticated client. The
  // PluginApi exposes the same Apollo client the UI uses, which already has
  // the API key / session cookie attached.
  gql.query = async function (queryString, variables) {
    const api = window.PluginApi;
    if (!api || !api.GQL) throw new Error("Stash PluginApi.GQL not available");
    // PluginApi.GQL.query was renamed across Stash versions; support both.
    if (typeof api.GQL.query === "function") {
      const r = await api.GQL.query({ query: queryString, variables });
      if (r.errors && r.errors.length) throw new Error(r.errors[0].message);
      return r.data;
    }
    if (api.GQL.client && typeof api.GQL.client.query === "function") {
      const r = await api.GQL.client.query({
        query: api.libraries.GraphQLTag.gql(queryString),
        variables,
        fetchPolicy: "no-cache",
      });
      if (r.errors && r.errors.length) throw new Error(r.errors[0].message);
      return r.data;
    }
    // Fallback: hit /graphql directly. ApiKey from session is already on
    // document.cookie / Authorization header set by Stash.
    const res = await fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ query: queryString, variables }),
    });
    if (!res.ok) throw new Error("GraphQL HTTP " + res.status);
    const r = await res.json();
    if (r.errors && r.errors.length) throw new Error(r.errors[0].message);
    return r.data;
  };

  // Paginated fetch. Stash's findX queries accept filter.per_page=-1 to
  // disable paging but very large libraries can blow up; we page in chunks
  // and let the caller stream / accumulate.
  gql.fetchAll = async function (entity, fields, opts) {
    const o = opts || {};
    const perPage = o.perPage || 250;
    const queryShape = {
      performers: "findPerformers",
      scenes: "findScenes",
      tags: "findTags",
      studios: "findStudios",
      images: "findImages",
      galleries: "findGalleries",
    };
    const root = queryShape[entity];
    if (!root) throw new Error("Unknown entity: " + entity);
    const sortField = {
      scenes: "date", performers: "name", tags: "name",
      studios: "name", images: "date", galleries: "date",
    }[entity];
    const items = [];
    let page = 1;
    let total = Infinity;
    while ((page - 1) * perPage < total) {
      const q = `
        query MetricsFetch($filter: FindFilterType) {
          ${root}(filter: $filter) {
            count
            ${entity} { ${fields} }
          }
        }
      `;
      const data = await gql.query(q, {
        filter: { per_page: perPage, page, sort: sortField, direction: "ASC" },
      });
      const block = data[root];
      total = block.count;
      items.push.apply(items, block[entity]);
      if (typeof o.onProgress === "function") o.onProgress(items.length, total);
      page++;
      if (page > 1000) break; // hard safety stop
    }
    return items;
  };

  gql.stats = async function () {
    const data = await gql.query(`
      query MetricsStats {
        stats {
          scene_count
          scenes_size
          scenes_duration
          image_count
          images_size
          gallery_count
          performer_count
          studio_count
          movie_count
          tag_count
          total_o_count
          total_play_duration
        }
      }
    `);
    return data.stats;
  };
})();
