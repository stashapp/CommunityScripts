// cf-tag-filter
// =============
// Hide tags that are marked via a custom field from manual tag entry (scene
// editing) and from scraper results.
//
// Unlike the original "tag-filter" plugin, the list of hidden tags is NOT stored
// in the browser's localStorage. Instead the marking lives on the tag in the
// stash backend (a custom field), so it is shared across browsers and survives
// clearing the browser cache.
//
// This plugin is fully self-contained: it does not depend on any helper plugins
// (0gql-intercept, forbiddenConfig, wfke, fontawesome-js). It inlines a minimal
// GraphQL fetch interceptor and reads its own settings via GraphQL.
//
// It does no background polling: the hidden-tag list is fetched lazily once —
// the first time a tag-select dropdown or scrape result is shown — and then
// reused for the rest of the page session. This mirrors Stash's own cache-first
// behavior: just viewing or browsing generates no traffic, and changes made
// elsewhere (e.g. in another tab) are picked up after a page reload, same as the
// rest of the UI.

(function () {
  "use strict";

  const PLUGIN_ID = "cf-tag-filter";

  // IDs (as strings) of all tags currently considered "hidden".
  let hiddenTagIds = new Set();
  // Cached settings.
  let settings = { fieldName: "", fieldValue: "", hideScrape: false };
  // Cached API key (fallback auth; same-origin requests usually use the cookie).
  let apiKey = null;

  // --- GraphQL helper -----------------------------------------------------

  // Note: we keep a reference to the *original* fetch so our own requests are
  // not re-processed by our interceptor (and to avoid any chance of recursion).
  const originalFetch = window.fetch.bind(window);

  async function gqlRequest(query, variables, operationName) {
    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["ApiKey"] = apiKey;

    const res = await originalFetch("/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables, operationName }),
    });
    return res.json();
  }

  // --- settings + hidden tag refresh --------------------------------------

  async function loadSettings() {
    const query = `query CfTagFilterConfig {
      configuration {
        general { apiKey }
        plugins(include: ["${PLUGIN_ID}"])
      }
    }`;
    try {
      const json = await gqlRequest(query, {}, "CfTagFilterConfig");
      const cfg = json?.data?.configuration;
      apiKey = cfg?.general?.apiKey || apiKey;
      const s = cfg?.plugins?.[PLUGIN_ID] || {};
      settings = {
        fieldName: (s.customFieldName || "").trim(),
        fieldValue: (s.customFieldValue || "").trim(),
        hideScrape: !!s.hideScrape,
      };
    } catch (e) {
      console.error("[cf-tag-filter] failed to load settings", e);
    }
  }

  // A tag is hidden when it has the configured custom field set (NOT_NULL). If a
  // value is also configured, only tags whose field equals that value are hidden.
  async function refreshHiddenTags() {
    const field = settings.fieldName;
    if (!field) {
      hiddenTagIds = new Set();
      return;
    }

    const query = `query CfTagFilterFindTags($filter: FindFilterType, $tag_filter: TagFilterType) {
      findTags(filter: $filter, tag_filter: $tag_filter) {
        tags { id custom_fields }
      }
    }`;
    const variables = {
      filter: { per_page: -1 },
      tag_filter: { custom_fields: [{ field, modifier: "NOT_NULL" }] },
    };

    try {
      const json = await gqlRequest(query, variables, "CfTagFilterFindTags");
      let tags = json?.data?.findTags?.tags ?? [];

      // optional exact value match (compared as string to avoid number/string
      // coercion surprises)
      const wanted = settings.fieldValue;
      if (wanted) {
        tags = tags.filter((tag) => {
          const v = tag.custom_fields?.[field];
          return v !== undefined && v !== null && String(v) === wanted;
        });
      }

      hiddenTagIds = new Set(tags.map((tag) => String(tag.id)));
    } catch (e) {
      console.error("[cf-tag-filter] failed to refresh hidden tags", e);
    }
  }

  // --- GraphQL response interceptors --------------------------------------

  // hide tags from the scene tag select dropdown / scraper search
  function tagSelectInterceptor(data, query) {
    if (!data?.data?.findTags) return data;
    if (query?.operationName !== "FindTagsForSelect") return data;
    // never hide tags while browsing the /tags pages themselves
    if (location.pathname.startsWith("/tags")) return data;

    const filtered = data.data.findTags.tags.filter(
      (tag) => !hiddenTagIds.has(String(tag.id))
    );
    data.data.findTags.tags = filtered;
    data.data.findTags.count = filtered.length;
    return data;
  }

  function stripSceneTags(scene) {
    if (scene && Array.isArray(scene.tags)) {
      scene.tags = scene.tags.filter(
        (tag) => !hiddenTagIds.has(String(tag.stored_id))
      );
    }
    return scene;
  }

  // hide tags from scraper results.
  // scrapeSingleScene -> [ScrapedScene]
  // scrapeMultiScenes -> [[ScrapedScene]]  (note the nested arrays)
  function scraperInterceptor(data, query) {
    if (!settings.hideScrape) return data;
    if (!data?.data) return data;

    const op = query?.operationName;
    if (op !== "ScrapeSingleScene" && op !== "ScrapeMultiScenes") return data;

    const key = op === "ScrapeSingleScene" ? "scrapeSingleScene" : "scrapeMultiScenes";
    const result = data.data[key];
    if (!Array.isArray(result)) return data;

    data.data[key] = result.map((entry) =>
      Array.isArray(entry) ? entry.map(stripSceneTags) : stripSceneTags(entry)
    );
    return data;
  }

  // --- fetch monkeypatch --------------------------------------------------

  function isGraphqlJson(response) {
    const contentType = response.headers.get("Content-Type") || "";
    return (
      (contentType.includes("application/json") ||
        contentType.includes("application/graphql-response+json")) &&
      response.url.endsWith("/graphql")
    );
  }

  async function interceptResponse(response, request) {
    if (!response.ok || !isGraphqlJson(response)) return response;

    const query = request?.body ? JSON.parse(request.body) : undefined;
    const op = query?.operationName;

    // We only ever touch the tag-select and scene-scrape operations. Anything
    // else (including simply viewing or browsing scenes) is passed straight
    // through untouched, so the plugin does no work and makes no requests while
    // you browse.
    const relevant =
      op === "FindTagsForSelect" ||
      op === "ScrapeSingleScene" ||
      op === "ScrapeMultiScenes";
    if (!relevant) return response;

    // Lazily load our hidden-tag list once, the first time it actually matters.
    await ensureLoaded();

    let data = await response.clone().json();
    data = tagSelectInterceptor(data, query);
    data = scraperInterceptor(data, query);

    return new Response(JSON.stringify(data), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  function installFetchPatch() {
    if (window.__cfTagFilterPatched) return;
    window.__cfTagFilterPatched = true;

    window.fetch = async (...args) => {
      const [, config] = args;
      const response = await originalFetch(...args);
      try {
        return await interceptResponse(response, config);
      } catch (e) {
        return response;
      }
    };
  }

  // --- one-time load ------------------------------------------------------

  // The hidden-tag list is loaded lazily the first time it is actually needed
  // (a tag-select dropdown or scrape result), then reused for the rest of the
  // page session. There is no background polling and no periodic refresh, which
  // mirrors Stash's own cache-first behavior: changes made elsewhere (e.g. in
  // another tab) show up after a page reload, just like the rest of the UI.
  let loadPromise = null;

  async function refreshAll() {
    // loadSettings/refreshHiddenTags swallow their own errors, so this never
    // rejects; a failed attempt simply leaves the (empty) cache in place.
    await loadSettings();
    await refreshHiddenTags();
  }

  function ensureLoaded() {
    // cache the promise so concurrent callers share a single load, and so the
    // queries run only once per page session
    if (!loadPromise) loadPromise = refreshAll();
    return loadPromise;
  }

  // --- bootstrap ----------------------------------------------------------

  installFetchPatch();
})();
