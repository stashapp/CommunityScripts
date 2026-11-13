// Infinite Scroll for Stash
//
// How it works, in short:
//   * Stash's list pages render whatever their GraphQL query returns. We add a
//     cache read policy to the find* query fields so that, for a list we are
//     tracking, reading page N returns every loaded page (first..last) merged
//     and de-duplicated. Stash's own grid / list / wall / tagger views then
//     render all loaded items natively - selection, tagging, previews and
//     bulk operations keep working without being re-implemented.
//   * We patch each list's inner renderer (SceneList, ImageList, ...) to add
//     the scroll sentinels, URL/position syncing, and per-view fix-ups.
//   * We patch the card components (SceneCard, ImageCard, ...) to swap far
//     off-screen cards for same-sized placeholders, and unload off-screen
//     videos, so long sessions stay fast.
//
// If anything the plugin depends on is missing (a Stash update renamed it),
// the affected part turns itself off and Stash's normal pagination is used.
(function () {
  "use strict";

  const PLUGIN_ID = "InfiniteScroll";
  const LOG_PREFIX = "[InfiniteScroll]";

  const api = window.PluginApi;
  if (!api || !api.patch || !api.libraries || !api.libraries.Apollo) {
    console.warn(LOG_PREFIX, "PluginApi not available; plugin disabled");
    return;
  }

  const { React } = api;
  const { Apollo, ReactRouterDOM, Intl, Bootstrap } = api.libraries;
  const h = React.createElement;

  const DisplayMode = { Grid: 0, List: 1, Wall: 2, Tagger: 3 };

  // The inner list renderer for each entity type, the GraphQL field its data
  // comes from, and the prop / result key holding the items.
  const LISTS = {
    SceneList: { field: "findScenes", itemsKey: "scenes", prop: "scenes" },
    ImageList: { field: "findImages", itemsKey: "images", prop: "images" },
    GalleryList: { field: "findGalleries", itemsKey: "galleries", prop: "galleries" },
    PerformerList: { field: "findPerformers", itemsKey: "performers", prop: "performers" },
    StudioList: { field: "findStudios", itemsKey: "studios", prop: "studios" },
    TagList: { field: "findTags", itemsKey: "tags", prop: "tags" },
    GroupList: { field: "findGroups", itemsKey: "groups", prop: "groups" },
    SceneMarkerList: { field: "findSceneMarkers", itemsKey: "scene_markers", prop: "markers" },
  };

  // top-level list routes; anything else is a list inside a detail page tab
  const TOP_LEVEL_LIST_PATH =
    /^\/(scenes|scenes\/markers|images|galleries|performers|studios|tags|groups|movies)\/?$/;

  // largest single request made when re-fetching a loaded range
  const MAX_ITEMS_PER_REQUEST = 1000;
  // how far outside the viewport cards stay mounted, in viewport heights
  const WINDOW_SCREENS = 3;
  // how far outside the viewport videos stay loaded (paused), in viewport
  // heights; only videos actually on screen play
  const VIDEO_SCREENS = 0.5;
  const MAX_ENTRIES = 40;
  // Items fetched per request. Benchmarked on a real library, scrolling at a
  // fast human pace with previews playing: smaller batches fall behind (each
  // request is a round trip) and larger ones stutter when they arrive.
  const BATCH_SIZE = 14;
  // most batches in flight at once when scrolling outruns one at a time;
  // browsers open about 6 connections per server, so leave some for
  // thumbnails and previews
  const MAX_PARALLEL = 4;
  // how far ahead to load when scrolling fast: this many seconds of travel
  const LEAD_SECONDS = 0.6;
  const MAX_LEAD_SCREENS = 8;
  // Scrolling faster than this many screen heights a second holds previews
  // back (a card is then on screen for under about a second). Measured in
  // screens, not pixels, so it's the same at every zoom level...
  const FAST_SCREENS_PER_SEC = 1;
  // ...until it has slowed down for this long
  const SETTLE_MS = 150;
  // a failed load is retried automatically after this long
  const RETRY_MS = 5000;
  // a placeholder turning back into a card is drawn within this budget per
  // frame, so a burst of them doesn't freeze the page
  const DRAW_BUDGET_MS = 8;
  const MAX_SIZE_CACHE = 20000;

  // ---------------------------------------------------------------------------
  // settings

  const settings = {
    disableGrid: false,
    disableList: false,
    disableWall: false,
    disableTagger: false,
    disableOnDetailPages: false,
    hidePageJumper: false,
    disableWindowing: false,
    disablePinnedHeader: false,
    prefetchScreens: 1.5,
    taggerConfirmThreshold: 0,
  };

  function getClient() {
    try {
      return api.utils.StashService.getClient();
    } catch (e) {
      return undefined;
    }
  }

  async function loadSettings() {
    const client = getClient();
    if (!client || !api.GQL.ConfigurationDocument) return;
    try {
      const res = await client.query({
        query: api.GQL.ConfigurationDocument,
        fetchPolicy: "cache-first",
      });
      const cfg = (res.data && res.data.configuration && res.data.configuration.plugins &&
        res.data.configuration.plugins[PLUGIN_ID]) || {};
      for (const k of Object.keys(settings)) {
        const v = cfg[k];
        if (v === undefined || v === null) continue;
        if (typeof settings[k] === "number") {
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) settings[k] = n;
        } else {
          settings[k] = !!v;
        }
      }
    } catch (e) {
      console.warn(LOG_PREFIX, "could not load settings", e);
    }
  }

  function modeEnabled(mode) {
    switch (mode) {
      case DisplayMode.Grid:
        return !settings.disableGrid;
      case DisplayMode.List:
        return !settings.disableList;
      case DisplayMode.Wall:
        return !settings.disableWall;
      case DisplayMode.Tagger:
        return !settings.disableTagger;
      default:
        return false;
    }
  }

  // ---------------------------------------------------------------------------
  // small utilities

  function stableStringify(v) {
    if (v === null || typeof v !== "object") return JSON.stringify(v);
    if (Array.isArray(v)) {
      return "[" + v.map((x) => (x === undefined ? "null" : stableStringify(x))).join(",") + "]";
    }
    return (
      "{" +
      Object.keys(v)
        .filter((k) => v[k] !== undefined)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + stableStringify(v[k]))
        .join(",") +
      "}"
    );
  }

  function hashString(s) {
    let h1 = 5381;
    for (let i = 0; i < s.length; i++) h1 = ((h1 << 5) + h1 + s.charCodeAt(i)) | 0;
    return (h1 >>> 0).toString(36);
  }

  // the list identity: the field plus all arguments except the page number
  function keyFor(field, args) {
    const filter = Object.assign({}, args.filter);
    delete filter.page;
    return field + stableStringify(Object.assign({}, args, { filter }));
  }

  function withPage(obj, page, perPage) {
    const filter = Object.assign({}, obj.filter, { page });
    if (perPage !== undefined) filter.per_page = perPage;
    return Object.assign({}, obj, { filter });
  }

  function valueFromNode(node, vars) {
    switch (node.kind) {
      case "Variable":
        return vars ? vars[node.name.value] : undefined;
      case "IntValue":
        return parseInt(node.value, 10);
      case "FloatValue":
        return parseFloat(node.value);
      case "StringValue":
      case "EnumValue":
      case "BooleanValue":
        return node.value;
      case "NullValue":
        return null;
      case "ListValue":
        return node.values.map((n) => valueFromNode(n, vars));
      case "ObjectValue": {
        const o = {};
        for (const f of node.fields) o[f.name.value] = valueFromNode(f.value, vars);
        return o;
      }
      default:
        return undefined;
    }
  }

  // Maps a query's variables to the arguments of `field`, so that the key we
  // compute here matches the args Apollo passes to the field read function.
  function argsFromDocument(doc, field, vars) {
    for (const def of doc.definitions || []) {
      if (def.kind !== "OperationDefinition") continue;
      for (const sel of def.selectionSet.selections) {
        if (sel.kind !== "Field" || sel.name.value !== field) continue;
        const args = {};
        for (const arg of sel.arguments || []) {
          const v = valueFromNode(arg.value, vars);
          if (v !== undefined) args[arg.name.value] = v;
        }
        return args;
      }
    }
    return undefined;
  }

  function navbarBottom() {
    const nav = document.querySelector(".navbar.fixed-top, .top-nav");
    return nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
  }

  function sessionGet(k) {
    try {
      const v = window.sessionStorage.getItem(k);
      return v ? JSON.parse(v) : undefined;
    } catch (e) {
      return undefined;
    }
  }

  function sessionSet(k, v) {
    try {
      window.sessionStorage.setItem(k, JSON.stringify(v));
    } catch (e) {
      // storage unavailable or full; position memory is best-effort
    }
  }

  // ---------------------------------------------------------------------------
  // scroll-to-top suppression
  //
  // Stash scrolls to the top whenever the list's page number changes. When the
  // page number changes because *we* updated the URL to match the page in
  // view, that jump has to be swallowed.

  const nativeScrollTo = window.scrollTo.bind(window);
  let scrollSuppression = null;

  window.scrollTo = function () {
    const s = scrollSuppression;
    if (s && performance.now() < s.until && window.location.pathname === s.path) {
      scrollSuppression = null;
      return;
    }
    return nativeScrollTo.apply(window, arguments);
  };

  // when the plugin itself last scrolled (restoring a position)
  let lastProgrammaticScroll = -Infinity;

  function suppressNextScrollToTop() {
    scrollSuppression = { until: performance.now() + 1500, path: window.location.pathname };
  }

  // ---------------------------------------------------------------------------
  // scroll speed, shared by loading (how far ahead to fetch) and previews
  // (held back while scrolling fast)

  // holding: previews are being held back; set when scrolling turns fast and
  // cleared only when the held previews are released (see settle)
  const speed = { pxPerSec: 0, lastEventAt: -Infinity, fastUntil: 0, timer: 0, lastKey: null, lastY: 0, holding: false };
  const settleListeners = new Set();
  const lastPos = new WeakMap();

  document.addEventListener(
    "scroll",
    (e) => {
      const t = e.target;
      const pageScroll = t === document || t === document.documentElement || t === window;
      const key = pageScroll ? document : t;
      const y = pageScroll ? window.scrollY : t.scrollTop;
      const now = performance.now();
      const prev = lastPos.get(key);
      lastPos.set(key, { y, t: now });
      speed.lastEventAt = now;
      speed.lastKey = key;
      speed.lastY = y;
      // The first event after a real pause has nothing to measure against. (A
      // gap of a few hundred ms is usually a long frame mid-scroll, not a
      // pause, so it still counts.)
      if (!prev || now - prev.t > 1000) return;
      // (displays refresh up to every ~4 ms; only guard against a zero gap)
      const v = (Math.abs(y - prev.y) / Math.max(now - prev.t, 1)) * 1000;
      speed.pxPerSec = speed.pxPerSec * 0.5 + v * 0.5;
      const screen = pageScroll ? window.innerHeight : t.clientHeight || window.innerHeight;
      if (speed.pxPerSec > screen * FAST_SCREENS_PER_SEC) {
        speed.holding = true;
        speed.fastUntil = now + SETTLE_MS;
        if (!speed.timer) speed.timer = window.setTimeout(settle, SETTLE_MS + 10);
      }
    },
    { capture: true, passive: true }
  );

  function settle() {
    speed.timer = 0;
    const wait = speed.fastUntil - performance.now();
    if (wait > 0) {
      speed.timer = window.setTimeout(settle, wait + 10);
      return;
    }
    // A long frame delays scroll events, so a quiet spell may only mean the
    // page was busy. Let two frames render: if scrolling continues, its
    // events arrive in them and push fastUntil out again.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (speed.timer) return;
        // still moving fast, even if its event hasn't been delivered yet
        const k = speed.lastKey;
        if (k) {
          const y = k === document ? window.scrollY : k.scrollTop;
          const screen = k === document ? window.innerHeight : k.clientHeight || window.innerHeight;
          const v = (Math.abs(y - speed.lastY) / Math.max(performance.now() - speed.lastEventAt, 1)) * 1000;
          if (v > screen * FAST_SCREENS_PER_SEC) speed.fastUntil = performance.now() + SETTLE_MS;
        }
        if (performance.now() < speed.fastUntil) {
          speed.timer = window.setTimeout(settle, speed.fastUntil - performance.now() + 10);
          return;
        }
        speed.pxPerSec = 0;
        speed.holding = false;
        speed.settles = (speed.settles || 0) + 1;
        settleListeners.forEach((fn) => fn());
      })
    );
  }

  // true from when scrolling turns fast until held previews are released
  function scrollingFast() {
    return speed.holding;
  }

  function currentSpeed() {
    return performance.now() - speed.lastEventAt > 600 ? 0 : speed.pxPerSec;
  }

  // Stash starts a card's preview (and its download) by calling play() as the
  // card comes on screen. While scrolling fast that call is held, so previews
  // flown past are never downloaded and don't compete with loading; once
  // scrolling slows, the ones on screen then are played.
  const nativePlay = HTMLMediaElement.prototype.play;
  const heldPlays = new Set();

  // a preview unloaded while off-screen gets its source back when played
  function restoreSource(v) {
    if (v.dataset && v.dataset.iscSrc && !v.getAttribute("src")) {
      v.setAttribute("src", v.dataset.iscSrc);
      delete v.dataset.iscSrc;
    }
  }

  HTMLMediaElement.prototype.play = function () {
    if (scrollingFast() && this.tagName === "VIDEO" && this.closest && this.closest(".isc-enabled")) {
      heldPlays.add(this);
      return Promise.resolve();
    }
    heldPlays.delete(this);
    restoreSource(this);
    return nativePlay.apply(this, arguments);
  };

  function onScreen(el) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  }

  settleListeners.add(() => {
    const vids = [...heldPlays];
    heldPlays.clear();
    for (const v of vids) {
      if (v.isConnected && onScreen(v)) {
        restoreSource(v);
        const p = nativePlay.call(v);
        if (p && p.catch) p.catch(() => {});
      }
    }
  });

  // ---------------------------------------------------------------------------
  // list state store
  //
  // One entry per list identity (field + filter without page). Entries live
  // outside React so they survive the list unmounting (navigating to a scene
  // and back), which is what makes position restoring instant.

  const store = new Map();
  const versionVar = Apollo.makeVar(0);
  let rawReads = 0;

  function bump() {
    versionVar(versionVar() + 1);
  }

  function touchEntry(st) {
    store.delete(st.key);
    store.set(st.key, st);
    while (store.size > MAX_ENTRIES) store.delete(store.keys().next().value);
  }

  function totalPages(st) {
    if (st.count === undefined || st.count === null) return Infinity;
    return Math.max(1, Math.ceil(st.count / st.perPage));
  }

  function pageVars(st, page) {
    return withPage(st.vars, page);
  }

  function notify(st) {
    st.listeners.forEach((fn) => fn());
  }

  function resetEntry(st, page) {
    if (window.InfiniteScrollDebug && window.InfiniteScrollDebug.trace) {
      console.debug(LOG_PREFIX, "reset", page, st.first, st.last, new Error().stack);
    }
    st.gen++;
    st.first = page;
    st.last = page;
    st.error = null;
    st.inflight.clear();
    // a refresh still running belongs to the old generation and won't clear
    // this itself; left set, it would block loading for good
    st.refreshing = false;
    st.refreshAgain = false;
    st.anchor = undefined;
    st.pendingAnchor = undefined;
    st.run = { first: page, last: page, starts: [0], length: undefined };
    bump();
  }

  // ---------------------------------------------------------------------------
  // cache read policy

  function makeRead(field, itemsKey) {
    return function (existing, opts) {
      // register the dependency so that bump() re-runs this read
      versionVar();
      if (rawReads > 0 || existing === undefined || store.size === 0) return existing;
      const args = opts.args;
      if (!args || !args.filter) return existing;

      const page = args.filter.page || 1;
      const st = store.get(keyFor(field, args));
      if (!st || page < st.first || page > st.last) return existing;

      st.count = existing.count;
      if (st.first === st.last) {
        st.run = { first: page, last: page, starts: [0], length: (existing[itemsKey] || []).length };
        return existing;
      }

      rawReads++;
      try {
        const pages = new Map([[page, existing]]);
        const readPage = (p) => opts.readField({ fieldName: field, args: withPage(args, p) });
        // only a contiguous run of loaded pages around the requested one
        let lo = page;
        for (let p = page - 1; p >= st.first; p--) {
          const v = readPage(p);
          if (!v) break;
          pages.set(p, v);
          lo = p;
        }
        let hi = page;
        for (let p = page + 1; p <= st.last; p++) {
          const v = readPage(p);
          if (!v) break;
          pages.set(p, v);
          hi = p;
        }

        const seen = new Set();
        const out = [];
        const starts = [];
        for (let p = lo; p <= hi; p++) {
          starts.push(out.length);
          for (const item of pages.get(p)[itemsKey] || []) {
            const id = item && item.__ref;
            if (id) {
              // data can shift between page requests; never show an item twice
              if (seen.has(id)) continue;
              seen.add(id);
            }
            out.push(item);
          }
        }
        st.run = { first: lo, last: hi, starts, length: out.length };
        return Object.assign({}, existing, { [itemsKey]: out });
      } finally {
        rawReads--;
      }
    };
  }

  function installCachePolicies() {
    const client = getClient();
    const policies = client && client.cache && client.cache.policies;
    if (!policies || typeof policies.addTypePolicies !== "function") {
      console.warn(LOG_PREFIX, "Apollo cache policies unavailable; plugin disabled");
      return false;
    }
    const fields = {};
    for (const name of Object.keys(LISTS)) {
      const { field, itemsKey } = LISTS[name];
      fields[field] = { read: makeRead(field, itemsKey) };
    }
    policies.addTypePolicies({ Query: { fields } });
    return true;
  }

  // ---------------------------------------------------------------------------
  // locating the query behind a rendered list

  function findListQuery(cfg, items, filter) {
    const client = getClient();
    if (!client || typeof client.getObservableQueries !== "function") return undefined;
    let best;
    let bestScore = 0;
    client.getObservableQueries("active").forEach((oq) => {
      let data;
      try {
        const res = oq.getCurrentResult();
        data = res && res.data && res.data[cfg.field];
      } catch (e) {
        return;
      }
      if (!data || !Array.isArray(data[cfg.itemsKey])) return;
      const arr = data[cfg.itemsKey];
      let score = 0;
      if (arr === items) {
        score = 3;
      } else {
        const ff = (oq.variables && oq.variables.filter) || {};
        if (ff.per_page !== filter.itemsPerPage || (ff.page || 1) !== filter.currentPage) return;
        score =
          arr.length === items.length && (arr.length === 0 || (items[0] && arr[0].id === items[0].id))
            ? 2
            : 1;
      }
      if (score > bestScore) {
        best = oq;
        bestScore = score;
      }
    });
    return best;
  }

  function getOrCreateEntry(cfg, items, filter) {
    const oq = findListQuery(cfg, items, filter);
    if (!oq || !oq.variables || !oq.variables.filter) return undefined;
    const perPage = oq.variables.filter.per_page;
    if (!perPage || perPage < 1) return undefined;
    const args = argsFromDocument(oq.query, cfg.field, oq.variables);
    if (!args || !args.filter) return undefined;

    const key = keyFor(cfg.field, args);
    let st = store.get(key);
    const page = oq.variables.filter.page || 1;
    if (!st) {
      const vars = JSON.parse(JSON.stringify(oq.variables));
      delete vars.filter.page;
      let count;
      try {
        const d = oq.getCurrentResult().data[cfg.field];
        count = d.count;
      } catch (e) {
        count = undefined;
      }
      st = {
        key,
        storageKey: "isc:" + hashString(key),
        field: cfg.field,
        itemsKey: cfg.itemsKey,
        doc: oq.query,
        vars,
        perPage,
        first: page,
        last: page,
        count,
        ackCount: count,
        gen: 0,
        inflight: new Set(),
        refreshing: false,
        refreshAgain: false,
        error: null,
        anchor: undefined,
        pendingAnchor: undefined,
        urlPage: undefined,
        run: { first: page, last: page, starts: [0], length: items.length },
        // history entry keys this list has been shown at
        keys: new Set(),
        listeners: new Set(),
      };
    }
    touchEntry(st);
    return st;
  }

  // ---------------------------------------------------------------------------
  // loading

  // Starts loading `page`, which must be next to the loaded range. Several
  // pages after the range can load at once; earlier pages load one at a time.
  // Returns whether a load started.
  function loadPage(st, page) {
    if (st.refreshing || st.error) return false;
    if (page < 1 || page > totalPages(st)) return false;
    const prepend = page === st.first - 1;
    if (page === st.last + 1) {
      if (st.inflight.size >= MAX_PARALLEL) return false;
      st.last = page;
    } else if (prepend) {
      if (st.inflight.size > 0) return false;
      st.first = page;
    } else return false;

    st.inflight.add(page);
    st.error = null;
    notify(st);
    fetchPage(st, page, prepend);
    return true;
  }

  async function fetchPage(st, page, prepend) {
    const gen = st.gen;
    const countBefore = st.count;
    try {
      // "no-cache" + writeQuery rather than a cached query: reading the
      // result back would merge every loaded page under this page's
      // variables, and Apollo memoises item results per variables, so it
      // would recompute every loaded item
      const client = getClient();
      const variables = pageVars(st, page);
      const res = await client.query({ query: st.doc, variables, fetchPolicy: "no-cache" });
      if (st.gen !== gen) return;
      client.cache.writeQuery({ query: st.doc, variables, data: res.data });
      const data = res.data && res.data[st.field];
      if (data && countBefore !== undefined && data.count !== countBefore) {
        // items were added or removed since earlier pages were fetched, so page
        // offsets moved: re-fetch the loaded range so nothing is skipped
        st.inflight.delete(page);
        st.ackCount = data.count;
        refreshRange(st);
      }
    } catch (e) {
      if (st.gen !== gen) return;
      console.warn(LOG_PREFIX, "failed to load page", page, e);
      st.pendingAnchor = undefined;
      st.error = e;
      st.errorAt = Date.now();
      // drop the failed page (and any after it) from the range
      if (prepend) {
        if (page === st.first && st.first < st.last) st.first = page + 1;
      } else if (page > st.first && page <= st.last) {
        st.last = page - 1;
      }
    } finally {
      if (st.gen === gen) {
        st.inflight.delete(page);
        bump();
        notify(st);
      }
    }
  }

  // Re-fetches every loaded page in as few requests as possible and writes
  // them back to the cache in one batch (one re-render).
  async function refreshRange(st) {
    if (st.refreshing) {
      st.refreshAgain = true;
      return;
    }
    const client = getClient();
    const gen = st.gen;
    st.refreshing = true;
    st.error = null;
    notify(st);
    try {
      do {
        st.refreshAgain = false;
        const pp = st.perPage;
        const group = Math.max(1, Math.floor(MAX_ITEMS_PER_REQUEST / pp));
        const firstBlock = Math.floor((st.first - 1) / group);
        const lastBlock = Math.floor((st.last - 1) / group);
        const writes = [];
        let count;
        for (let b = firstBlock; b <= lastBlock; b++) {
          const res = await client.query({
            query: st.doc,
            variables: withPage(st.vars, b + 1, pp * group),
            fetchPolicy: "no-cache",
          });
          if (st.gen !== gen) return;
          const data = res.data[st.field];
          const all = data[st.itemsKey] || [];
          count = data.count;
          for (let i = 0; i < group; i++) {
            const p = b * group + i + 1;
            const slice = all.slice(i * pp, (i + 1) * pp);
            if (!slice.length && p > 1) break;
            writes.push({
              variables: pageVars(st, p),
              data: Object.assign({}, res.data, {
                [st.field]: Object.assign({}, data, { [st.itemsKey]: slice }),
              }),
            });
          }
        }
        if (count !== undefined) {
          st.count = count;
          st.ackCount = count;
          const maxPage = totalPages(st);
          if (st.last > maxPage) st.last = Math.max(st.first, maxPage);
        }
        if (st.holdPosition) st.holdPosition();
        const write = (cache) => {
          for (const w of writes) cache.writeQuery({ query: st.doc, variables: w.variables, data: w.data });
        };
        if (typeof client.cache.batch === "function") client.cache.batch({ update: write });
        else write(client.cache);
      } while (st.refreshAgain && st.gen === gen);
    } catch (e) {
      if (st.gen === gen) {
        console.warn(LOG_PREFIX, "failed to refresh loaded pages", e);
        st.pendingAnchor = undefined;
        st.error = e;
        st.errorAt = Date.now();
      }
    } finally {
      if (st.gen === gen) {
        st.refreshing = false;
        bump();
        notify(st);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // registry of mounted infinite lists (used by the Pagination patches and the
  // tagger confirmation)

  const activeLists = new Set();
  const registryListeners = new Set();

  function notifyRegistry() {
    registryListeners.forEach((fn) => fn());
  }

  function useRegistry() {
    const [, force] = React.useReducer((x) => x + 1, 0);
    React.useEffect(() => {
      registryListeners.add(force);
      return () => registryListeners.delete(force);
    }, []);
  }

  function matchActiveList(itemsPerPage, totalItems, currentPage) {
    for (const reg of activeLists) {
      if (
        reg.perPage === itemsPerPage &&
        reg.count === totalItems &&
        currentPage >= reg.run.first &&
        currentPage <= reg.run.last
      ) {
        return reg;
      }
    }
    return undefined;
  }

  // ---------------------------------------------------------------------------
  // windowing: far off-screen cards become same-sized placeholders

  const WindowCtx = React.createContext(null);
  const CARD_COMPONENTS = [
    "SceneCard",
    "ImageCard",
    "GalleryCard",
    "PerformerCard",
    "StudioCard",
    "TagCard",
    "GroupCard",
    "SceneMarkerCard",
  ];
  const sizeCache = new Map();
  const batchedUpdates = (api.ReactDOM && api.ReactDOM.unstable_batchedUpdates) || ((fn) => fn());

  function rememberSize(id, w, hgt) {
    sizeCache.delete(id);
    sizeCache.set(id, { w, h: hgt });
    if (sizeCache.size > MAX_SIZE_CACHE) sizeCache.delete(sizeCache.keys().next().value);
  }

  function createWindowCtl() {
    const callbacks = new Map();
    let io = null;

    // Placeholders waiting to turn back into cards. Drawing a card is the
    // expensive part of scrolling, and fast scrolling brings dozens into range
    // at once, so they're drawn a few per frame (nearest to the screen first)
    // instead of all in one long frame.
    const queue = new Map();
    let frame = 0;
    let chunk = 4;
    const drain = () => {
      frame = 0;
      if (!queue.size) return;
      const vh = window.innerHeight;
      const order = [...queue].map(([el, draw]) => {
        const r = el.getBoundingClientRect();
        return { el, draw, d: r.bottom < 0 ? -r.bottom : r.top > vh ? r.top - vh : 0 };
      });
      order.sort((a, b) => a.d - b.d);
      const now = order.slice(0, chunk);
      now.forEach((x) => queue.delete(x.el));
      const t0 = performance.now();
      batchedUpdates(() => now.forEach((x) => x.draw()));
      // aim each frame's share at the budget
      const took = performance.now() - t0;
      if (took < DRAW_BUDGET_MS * 0.6) chunk = Math.min(chunk + 2, 32);
      else if (took > DRAW_BUDGET_MS) chunk = Math.max(1, Math.floor(chunk / 2));
      if (queue.size) frame = requestAnimationFrame(drain);
    };

    const ctl = {
      enabled: false,
      margin: undefined,
      // ids currently shown as placeholders
      far: new Set(),
      // the latest props for each card, which a skipped (memoised)
      // placeholder needs when it turns back into a real card
      latest: new Map(),
      observe(el, fn) {
        if (!io) {
          io = new IntersectionObserver(
            (entries) =>
              // one render for all the cards that changed, not one each
              batchedUpdates(() => {
                for (const e of entries) {
                  const cb = callbacks.get(e.target);
                  if (cb) cb(e.isIntersecting, e.boundingClientRect);
                }
              }),
            { rootMargin: `${WINDOW_SCREENS * 100}% 0px ${WINDOW_SCREENS * 100}% 0px` }
          );
        }
        callbacks.set(el, fn);
        io.observe(el);
      },
      unobserve(el) {
        callbacks.delete(el);
        queue.delete(el);
        if (io) io.unobserve(el);
      },
      // draw this placeholder's card when there's time
      promote(el, draw) {
        queue.set(el, draw);
        if (!frame) frame = requestAnimationFrame(drain);
      },
      cancel(el) {
        queue.delete(el);
      },
      // synchronous re-evaluation, used right after a programmatic scroll so the
      // cards in view render before the next paint (not queued)
      recheck() {
        const vh = window.innerHeight;
        batchedUpdates(() =>
          callbacks.forEach((cb, el) => {
            const r = el.getBoundingClientRect();
            cb(r.bottom > -WINDOW_SCREENS * vh && r.top < (WINDOW_SCREENS + 1) * vh, r, true);
          })
        );
      },
      destroy() {
        if (io) io.disconnect();
        io = null;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        queue.clear();
        callbacks.clear();
        ctl.far.clear();
        ctl.latest.clear();
      },
    };
    return ctl;
  }

  // Other plugins sometimes wrap a card in their own element, or move it.
  // React then can't find the card where it left it when an off-screen card
  // turns into a placeholder, and removing it throws ("removeChild ... not a
  // child of this node"), which crashes the whole list. Inside our own card
  // cells only, removals and insertions are pointed at the element that's
  // really there: the foreign wrapper, or the card wherever it went.
  (function guardCardCells() {
    const proto = Node.prototype;
    const nativeRemove = proto.removeChild;
    const nativeInsert = proto.insertBefore;
    const isCell = (n) => n && n.nodeType === 1 && n.classList.contains("isc-cell");
    // the direct child of `cell` that holds `node`, if any
    const holder = (cell, node) => {
      let n = node;
      while (n && n.parentNode !== cell) n = n.parentNode;
      return n || null;
    };
    let warned = false;
    const warn = (node) => {
      if (warned) return;
      warned = true;
      const p = node.parentNode;
      console.warn(LOG_PREFIX, "another script moved or wrapped a card; working around it",
        p && p.nodeType === 1 ? p.outerHTML.slice(0, 200) : "(card was removed from the page)");
    };
    proto.removeChild = function (child) {
      if (isCell(this) && child && child.parentNode !== this) {
        warn(child);
        const h = holder(this, child);
        if (h) return nativeRemove.call(this, h), child;
        if (child.parentNode) nativeRemove.call(child.parentNode, child);
        return child;
      }
      return nativeRemove.apply(this, arguments);
    };
    proto.insertBefore = function (node, ref) {
      if (isCell(this) && ref && ref.parentNode !== this) {
        warn(ref);
        return nativeInsert.call(this, node, holder(this, ref));
      }
      return nativeInsert.apply(this, arguments);
    };
  })();

  // renders a component function inline, inside a stable component type
  function Passthrough({ Original, props }) {
    return Original(props);
  }

  // the card's entity, e.g. props.scene for SceneCard: "Scene:123"
  function cardId(props) {
    for (const k of Object.keys(props)) {
      const v = props[k];
      if (v && typeof v === "object" && v.__typename && v.id !== undefined) return v.__typename + ":" + v.id;
    }
    return undefined;
  }

  function WindowedCard({ ctl, id, props: givenProps, Original: givenOriginal }) {
    const latest = id && ctl.latest.get(id);
    const props = latest ? latest.props : givenProps;
    const Original = latest ? latest.Original : givenOriginal;
    const ref = React.useRef(null);
    const [near, setNear] = React.useState(() => !(ctl.enabled && id && sizeCache.has(id)));
    const show = near || !ctl.enabled || !id || !sizeCache.has(id);
    const enabled = ctl.enabled && !!id;

    React.useLayoutEffect(() => {
      const el = show ? ref.current && ref.current.firstElementChild : ref.current;
      if (!el) return undefined;
      if (show) {
        el.setAttribute("data-isc-item", "");
        if (!ctl.margin) ctl.margin = window.getComputedStyle(el).margin;
      }
      if (!enabled) return undefined;
      ctl.observe(el, (isNear, rect, immediate) => {
        if (isNear) {
          if (show) return;
          // placeholders turn back into cards through the queue, unless the
          // view jumped (restoring a position) and they're needed right now
          if (immediate) setNear(true);
          else ctl.promote(el, () => setNear(true));
          return;
        }
        ctl.cancel(el);
        // a hidden card (e.g. inactive tab) has no size; leave it alone
        if (!rect.width || !rect.height) return;
        if (show) rememberSize(id, rect.width, rect.height);
        setNear(false);
      });
      return () => ctl.unobserve(el);
    }, [show, enabled, id, ctl]);

    if (show) {
      if (id) ctl.far.delete(id);
      return h(
        "div",
        { ref, className: "isc-cell", style: { display: "contents" } },
        h(Passthrough, { Original, props })
      );
    }
    ctl.far.add(id);
    const s = sizeCache.get(id);
    const width = props.width || s.w;
    return h("div", {
      ref,
      className: "isc-ph",
      "data-isc-item": "",
      style: { width, height: s.h * (width / s.w), margin: ctl.margin },
    });
  }

  // A placeholder doesn't need to re-render when the list does; with hundreds
  // of cards loaded that is most of the cost of each list update.
  const MemoWindowedCard = React.memo(
    WindowedCard,
    (prev, next) =>
      prev.ctl === next.ctl &&
      prev.id === next.id &&
      !!next.id &&
      next.ctl.enabled &&
      next.ctl.far.has(next.id) &&
      prev.props.width === next.props.width
  );

  // ---------------------------------------------------------------------------
  // videos: only on-screen previews play; nearby ones stay loaded (paused) so
  // they resume instantly, and the rest are unloaded
  //
  // The bands are measured in screen heights, so they already hold fewer
  // videos at larger zoom levels, where each preview is bigger.

  function attachVideoManager(container) {
    const visible = new WeakSet();

    const playIfAllowed = (v) => {
      if (v.autoplay && v.paused && v.getAttribute("src")) v.play().catch(() => {});
    };

    // play / pause on actual visibility
    const viewIo = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target;
        if (e.isIntersecting) {
          visible.add(v);
          playIfAllowed(v);
        } else {
          visible.delete(v);
          if (!v.paused) v.pause();
        }
      }
    });

    const unload = (v) => {
      const src = v.getAttribute("src");
      if (!src) return;
      v.dataset.iscSrc = src;
      v.pause();
      v.removeAttribute("src");
      v.load();
    };
    const reload = (v) => {
      if (!v.getAttribute("src")) {
        v.setAttribute("src", v.dataset.iscSrc);
        v.load();
        if (visible.has(v)) playIfAllowed(v);
      }
      delete v.dataset.iscSrc;
    };
    // Wall videos start downloading as soon as they have a source (they use
    // the autoplay attribute rather than play()), so while scrolling fast
    // they are kept without one until scrolling slows
    const startsByItself = (v) => v.autoplay || v.preload !== "none";
    const waiting = new Set();
    const inBand = (v) => {
      const r = v.getBoundingClientRect();
      const vh = window.innerHeight;
      return r.width > 0 && r.bottom > -VIDEO_SCREENS * vh && r.top < (1 + VIDEO_SCREENS) * vh;
    };
    const onSettle = () => {
      const vids = [...waiting];
      waiting.clear();
      for (const v of vids) if (v.isConnected && v.dataset.iscSrc && inBand(v)) reload(v);
    };
    settleListeners.add(onSettle);

    // Load / unload within a band around the screen. Card previews (which only
    // download once played) are left alone until they've loaded something,
    // and get their source back only when played (see HTMLMediaElement.play
    // above): setting a source makes the browser start a request, and doing
    // that for every card scrolled past clogs the connections that loading
    // needs.
    const loadIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target;
          if (!e.isIntersecting) {
            waiting.delete(v);
            if (startsByItself(v) || v.readyState > 0) unload(v);
          } else if (v.dataset.iscSrc && startsByItself(v)) {
            if (scrollingFast()) waiting.add(v);
            else reload(v);
          }
        }
      },
      { rootMargin: `${VIDEO_SCREENS * 100}% 0px ${VIDEO_SCREENS * 100}% 0px` }
    );

    // the autoplay attribute starts a video as soon as it loads, on screen or
    // not; stop the ones that aren't visible
    const onPlay = (e) => {
      const v = e.target;
      if (v.tagName === "VIDEO" && !visible.has(v)) v.pause();
    };
    container.addEventListener("play", onPlay, true);

    const observed = new WeakSet();
    const scan = (root) => {
      const vids = root.tagName === "VIDEO" ? [root] : root.querySelectorAll ? root.querySelectorAll("video") : [];
      vids.forEach((v) => {
        if (!observed.has(v)) {
          observed.add(v);
          // a new batch arriving mid-scroll shouldn't start its downloads
          if (scrollingFast() && startsByItself(v)) {
            unload(v);
            waiting.add(v);
          }
          viewIo.observe(v);
          loadIo.observe(v);
        }
      });
    };
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => n.nodeType === 1 && scan(n));
        r.removedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          const vids = n.tagName === "VIDEO" ? [n] : n.querySelectorAll("video");
          vids.forEach((v) => {
            viewIo.unobserve(v);
            loadIo.unobserve(v);
            observed.delete(v);
            visible.delete(v);
            waiting.delete(v);
          });
        });
      }
    });
    mo.observe(container, { childList: true, subtree: true });
    scan(container);
    return () => {
      settleListeners.delete(onSettle);
      mo.disconnect();
      viewIo.disconnect();
      loadIo.disconnect();
      container.removeEventListener("play", onPlay, true);
    };
  }

  // ---------------------------------------------------------------------------
  // position helpers

  // item elements in DOM order; the first selector that matches one element per
  // item wins. null when the view's structure isn't recognised.
  const ITEM_SELECTORS = ["[data-isc-item]", ".wall-item", ".search-item", "tbody > tr"];

  function itemElements(container, count) {
    if (!container || !count) return null;
    for (const sel of ITEM_SELECTORS) {
      const els = container.querySelectorAll(sel);
      if (els.length === count) return els;
    }
    return null;
  }

  // index of the first item whose bottom edge is below y
  function firstVisibleIndex(els, y) {
    let lo = 0;
    let hi = els.length - 1;
    let ans = els.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (els[mid].getBoundingClientRect().bottom > y) {
        ans = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    return ans;
  }

  function pageOfIndex(run, index) {
    let p = 0;
    for (let i = 0; i < run.starts.length; i++) {
      if (run.starts[i] <= index) p = i;
      else break;
    }
    return run.first + p;
  }

  // Was this list reached by back / forward, or a reload? Neither the router's
  // history.action nor popstate timing can tell reliably (the router renders
  // before other popstate listeners run, and Stash often normalises the URL
  // with history.replace). Instead: every history entry has a key, and
  // returning to an entry means returning to a key this list already showed.
  // A reload gets a new key (Stash rewrites the URL on load), so the first
  // mount of each list after a reload / back-forward page load matches the
  // saved anchor by its exact URL instead.
  const navEntry = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
  const loadedByRestore = !!navEntry && (navEntry.type === "reload" || navEntry.type === "back_forward");
  const mountedSinceLoad = new Set();

  // The last back / forward or new-page navigation (replacements don't
  // count). Stash re-saves a list's address as the list opens, which gives
  // the history entry a new key, so after going back the key alone can't
  // tell a return visit from a new one.
  let lastNav = null;
  let navTracked = false;
  function trackNavigation(history) {
    if (navTracked || !history || !history.listen) return;
    navTracked = true;
    history.listen((loc, action) => {
      if (action !== "REPLACE") lastNav = { action, pathname: loc.pathname };
    });
  }

  function isReturnVisit(st, location) {
    const firstMount = !mountedSinceLoad.has(st.storageKey);
    mountedSinceLoad.add(st.storageKey);
    // used once: a later filter change on the same page starts fresh
    const popped = !!lastNav && lastNav.action === "POP" && lastNav.pathname === location.pathname;
    if (popped) lastNav = null;
    if (location.key && st.keys.has(location.key)) return true;
    const saved = sessionGet(st.storageKey);
    if (window.InfiniteScrollDebug && window.InfiniteScrollDebug.trace) {
      console.debug(LOG_PREFIX, "return?", popped, saved && saved.search, window.location.search);
    }
    if (!saved) return false;
    if (location.key && saved.key === location.key) return true;
    if (popped && saved.search === window.location.search) return true;
    return loadedByRestore && firstMount && saved.search === window.location.search;
  }

  function urlPage(search) {
    const m = /(?:^|[?&])p=(\d+)/.exec(search || "");
    return m ? parseInt(m[1], 10) : 1;
  }

  // a list that keeps its filter in the URL always has some of these params
  function urlDrivenList(search, filter) {
    return (
      /(?:^|[?&])(sortby|sortdir|disp|perPage|z|c)=/.test(search || "") &&
      urlPage(search) === filter.currentPage
    );
  }

  // Keeps the address bar's page number in step with the view. This goes
  // straight to the browser, not through the router: if Stash saw the page
  // change, it would re-run the list query with new variables and Apollo
  // would recompute every loaded item. Back / forward, reload and copied
  // links still see the page, since they read the real URL.
  function setAddressBarPage(page) {
    const loc = window.location;
    const url = loc.pathname + searchWithPage(loc.search, page) + loc.hash;
    try {
      window.history.replaceState(window.history.state, "", url);
    } catch (e) {
      // replaceState is rate-limited by browsers; the next check retries
    }
  }

  function setSearchParam(search, key, value) {
    const re = new RegExp(`([?&])${key}=[^&]*`);
    if (re.test(search || "")) return search.replace(re, `$1${key}=${value}`);
    return (search ? search + "&" : "?") + `${key}=${value}`;
  }

  function searchWithPage(search, page) {
    let s = (search || "").replace(/([?&])p=\d+(&|$)/, (m, a, b) => (b ? a : ""));
    if (s === "?") s = "";
    if (page > 1) s += (s ? "&" : "?") + "p=" + page;
    return s;
  }

  // ---------------------------------------------------------------------------
  // pinned list header
  //
  // The toolbar, filter tags, page buttons and count stay at the top while the
  // list scrolls under them. They're made sticky in place, so at rest nothing
  // moves or changes size; each one sticks at the spot it starts from.

  const PINNED_HEADER = [".filtered-list-toolbar", ".filter-tags", ".pagination-index-container"];
  // a header starting further below the navbar than this (a list inside a
  // detail page) sticks right under the navbar instead of where it started
  const PIN_MAX_GAP = 80;
  // Detail pages (performer, studio, tag, group) show a compact name bar
  // under the navbar once scrolled ($sticky-detail-header-height, hidden at
  // 576px and narrower). A list on those pages pins below it, as Stash's own
  // sticky toolbar does, or the bar covers the toolbar.
  const DETAIL_HEADER_HEIGHT = 50;
  const detailHeaderSpace = (el) =>
    el.closest(".detail-body") && !window.matchMedia("(max-width: 576px)").matches ? DETAIL_HEADER_HEIGHT : 0;

  function pinListHeader(listEl, onBottom) {
    const pane = listEl.parentElement;
    const find = () =>
      PINNED_HEADER.map((sel) => Array.prototype.find.call(pane.children, (c) => c.matches(sel))).filter(Boolean);
    if (!find().length) return undefined;

    let els = [];
    let frame = 0;
    const relayout = () => {
      if (!frame) {
        frame = window.setTimeout(() => {
          frame = 0;
          layout();
        }, 50);
      }
    };
    // filter tags appearing or wrapping, the sidebar opening
    const ro = new ResizeObserver(relayout);
    // React rewrites an element's whole class list when its classes change
    // (selecting items adds "has-selection" to the toolbar), which drops
    // ours, and it can swap an element for a new one. Re-pin right away,
    // before the next paint, so the header never visibly lets go.
    const mo = new MutationObserver(() => {
      const now = find();
      if (now.length !== els.length || now.some((el, i) => el !== els[i] || !el.classList.contains("isc-pin"))) {
        layout();
      }
    });

    const unpin = (el) => {
      el.classList.remove("isc-pin");
      el.style.removeProperty("--isc-pin-top");
    };

    function layout() {
      const next = find();
      els.forEach((el) => {
        if (!next.includes(el)) {
          ro.unobserve(el);
          unpin(el);
        }
      });
      next.forEach((el) => {
        if (!els.includes(el)) {
          ro.observe(el);
          mo.observe(el, { attributes: true, attributeFilter: ["class"] });
        }
      });
      els = next;
      if (!els.length) {
        onBottom(0);
        return;
      }

      // Measure where everything sits at rest. Stash makes the toolbar sticky
      // on its own while items are selected, so a toolbar stuck at the top of
      // a scrolled list would measure far below its real spot and the rows
      // after it would be pinned over it. Static positioning while measuring
      // takes every sticky rule out of the picture.
      els.forEach((el) => {
        el.classList.remove("isc-pin");
        el.style.setProperty("position", "static", "important");
      });
      const nav = navbarBottom() + detailHeaderSpace(pane);
      const tops = els.map((el) => el.getBoundingClientRect().top + window.scrollY);
      els.forEach((el) => el.style.removeProperty("position"));
      const gap = tops[0] - nav;
      const first = nav + (gap >= 0 && gap < PIN_MAX_GAP ? gap : 0);
      els.forEach((el, i) => {
        el.style.setProperty("--isc-pin-top", `${first + tops[i] - tops[0]}px`);
        el.classList.add("isc-pin");
      });
      const last = els[els.length - 1];
      onBottom(first + tops[els.length - 1] - tops[0] + last.offsetHeight);
    }

    layout();
    mo.observe(pane, { childList: true });
    window.addEventListener("resize", relayout);
    return () => {
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", relayout);
      if (frame) window.clearTimeout(frame);
      els.forEach(unpin);
      onBottom(0);
    };
  }

  // ---------------------------------------------------------------------------
  // the list wrapper

  function useForceUpdate() {
    const [, force] = React.useReducer((x) => x + 1, 0);
    return force;
  }

  // Loading state lives on the entry, not in React state; the loaders subscribe
  // to it themselves so that showing a spinner doesn't re-render the list.
  function useEntryUpdates(st) {
    const force = useForceUpdate();
    React.useEffect(() => {
      st.listeners.add(force);
      return () => st.listeners.delete(force);
    }, [st, force]);
  }

  function Sentinel({ st, run, total, onRetry, sentinelRef, itemCount }) {
    useEntryUpdates(st);
    // Each state has its own key, and text never sits beside other elements,
    // so React swaps whole elements here instead of removing individual text
    // nodes. Page translation (Chrome's Translate) replaces text nodes with
    // its own, and React removing one of ours that's gone throws, which
    // crashed the page ("removeChild ... not a child of this node").
    let content = null;
    if (st.error) {
      content = h(
        "span",
        { key: "error" },
        h("span", null, "Couldn't load more results. "),
        h("button", { type: "button", className: "btn btn-link btn-sm p-0", onClick: onRetry }, "Retry")
      );
    } else if (st.inflight.size > 0 || st.refreshing) {
      content = h(
        "span",
        { key: "loading", className: "isc-loading" },
        h("span", { className: "isc-spinner" }),
        h("span", null, "Loading more…")
      );
    } else if (run.last >= total && st.count !== undefined && itemCount > st.perPage) {
      content = h("span", { key: "end" }, `End of results · ${itemCount.toLocaleString()} loaded`);
    }
    return h("div", { className: "isc-sentinel", ref: sentinelRef }, content);
  }

  // Back to top. Shown once the list is scrolled down more than a screen; it
  // listens to scrolling itself, so showing / hiding it doesn't re-render the
  // list.
  function ScrollTopButton({ getScroller }) {
    const [shown, setShown] = React.useState(false);
    const getRef = React.useRef(getScroller);
    getRef.current = getScroller;

    React.useEffect(() => {
      let timer = 0;
      const update = () => {
        timer = 0;
        const sc = getRef.current();
        const y = sc ? sc.scrollTop : window.scrollY;
        setShown(y > (sc ? sc.clientHeight : window.innerHeight));
      };
      const onScroll = () => {
        if (!timer) timer = window.setTimeout(update, 100);
      };
      document.addEventListener("scroll", onScroll, { capture: true, passive: true });
      update();
      return () => {
        document.removeEventListener("scroll", onScroll, { capture: true });
        if (timer) window.clearTimeout(timer);
      };
    }, []);

    const onClick = () => {
      // ours, so it doesn't count as scrolling up into "load earlier"
      lastProgrammaticScroll = performance.now();
      const sc = getRef.current();
      if (sc) sc.scrollTop = 0;
      nativeScrollTo(0, 0);
    };

    const { ReactFontAwesome, FontAwesomeSolid } = api.libraries;
    const icon =
      ReactFontAwesome && FontAwesomeSolid && FontAwesomeSolid.faArrowUp
        ? h(ReactFontAwesome.FontAwesomeIcon, { icon: FontAwesomeSolid.faArrowUp })
        : "↑";

    return h(
      "button",
      {
        type: "button",
        className: "isc-to-top" + (shown ? "" : " isc-hidden"),
        title: "Back to top",
        "aria-label": "Back to top",
        tabIndex: shown ? 0 : -1,
        onClick,
      },
      icon
    );
  }

  function TopLoader({ st, run, onLoad, topRef }) {
    useEntryUpdates(st);
    if (run.first <= 1) return null;
    const busy = st.inflight.has(run.first - 1);
    return h(
      "div",
      { className: "isc-top", ref: topRef },
      h(
        "button",
        { type: "button", className: "btn btn-secondary btn-sm", onClick: onLoad, disabled: busy },
        busy ? "Loading…" : `Load earlier results (page ${run.first - 1})`
      )
    );
  }

  function InfiniteList({ name, cfg, props, Original }) {
    const history = ReactRouterDOM.useHistory();
    const location = ReactRouterDOM.useLocation();
    trackNavigation(history);
    const containerRef = React.useRef(null);
    const sentinelRef = React.useRef(null);
    const topRef = React.useRef(null);
    const mountedRef = React.useRef(undefined);
    const stateRef = React.useRef({});
    const ctl = React.useMemo(() => createWindowCtl(), []);

    const filter = props.filter;
    const items = props[cfg.prop] || [];
    const mode = filter ? filter.displayMode : undefined;
    const detailPage = !TOP_LEVEL_LIST_PATH.test(location.pathname);
    const allowed = !!filter && modeEnabled(mode) && !(detailPage && settings.disableOnDetailPages);
    // Batches are a fixed size (BATCH_SIZE). A list that keeps its filter in
    // the URL is switched to it first (see the effect below); until then it
    // renders as Stash would. A page past the end (an old link, a list that
    // shrank) comes back empty, and Stash moves it to its last page itself;
    // converting at the same time made the two rewrite the address back and
    // forth until React gave up and the page went blank. So an empty later
    // page waits for Stash's own correction first.
    const pastEnd = filter && filter.currentPage > 1 && items.length === 0;
    const needsBatchSize =
      allowed && !pastEnd && filter.itemsPerPage !== BATCH_SIZE && urlDrivenList(location.search, filter);
    const wanted = allowed && !needsBatchSize && filter.itemsPerPage > 0;

    const st = wanted ? getOrCreateEntry(cfg, items, filter) : undefined;
    const enabled = !!st;
    const run = st
      ? st.run && filter.currentPage >= st.run.first && filter.currentPage <= st.run.last
        ? st.run
        : { first: filter.currentPage, last: filter.currentPage, starts: [0], length: items.length }
      : undefined;

    ctl.enabled = enabled && mode === DisplayMode.Grid && !settings.disableWindowing;

    // everything the event handlers need, without re-binding them each render
    const S = stateRef.current;
    Object.assign(S, { st, run, items, filter, enabled, mode, history, location, name });

    // Lists decide queue positions and lightbox numbering from the filter's
    // page; with several pages merged that has to be the first loaded page.
    const passFilter = React.useMemo(() => {
      if (!enabled || !filter || run.first === filter.currentPage) return filter;
      const f = filter.clone();
      f.currentPage = run.first;
      return f;
    }, [enabled, filter, run && run.first]);

    let passProps = props;
    if (enabled) {
      passProps = Object.assign({}, props, { filter: passFilter });
      // the lightbox walks the merged list itself: no page switching, and no
      // "Page x / y" header (0 pages hides it)
      if (name === "ImageList") passProps.pageCount = 0;
    }

    // --- anchors ---------------------------------------------------------

    // Most views scroll the page, but some (the List view's table) scroll
    // inside their own box. Returns that box, or null for the page.
    function getScroller(els) {
      const c = containerRef.current;
      let el = els && els[0] ? els[0].parentElement : null;
      while (el && el !== c) {
        const oy = window.getComputedStyle(el).overflowY;
        if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) return el;
        el = el.parentElement;
      }
      return null;
    }

    // the top edge items scroll under, and a way to scroll by an amount
    function viewportOf(scroller) {
      if (!scroller) {
        return {
          top: Math.max(navbarBottom(), S.pinBottom || 0),
          scrollBy: (d) => {
            lastProgrammaticScroll = performance.now();
            nativeScrollTo(0, window.scrollY + d);
          },
        };
      }
      const head = scroller.querySelector("thead");
      return {
        top: scroller.getBoundingClientRect().top + (head ? head.getBoundingClientRect().height : 0),
        scrollBy: (d) => {
          lastProgrammaticScroll = performance.now();
          scroller.scrollTop += d;
        },
      };
    }

    function captureAnchor() {
      const { st: s, items: its } = S;
      const els = itemElements(containerRef.current, its.length);
      if (!s || !els) return undefined;
      const idx = firstVisibleIndex(els, viewportOf(getScroller(els)).top);
      const item = its[idx];
      if (!item) return undefined;
      const page = pageOfIndex(S.run, idx);
      return {
        id: item.id,
        offset: els[idx].getBoundingClientRect().top,
        page,
        key: S.location.key,
        // the address bar URL this anchor belongs to (see setAddressBarPage)
        search: searchWithPage(window.location.search, page),
      };
    }

    function restoreAnchor(anchor) {
      const { items: its } = S;
      if (!anchor) return false;
      const idx = its.findIndex((i) => i.id === anchor.id);
      const els = itemElements(containerRef.current, its.length);
      if (idx < 0 || !els) return false;
      const top = els[idx].getBoundingClientRect().top;
      if (Math.abs(top - anchor.offset) > 1) viewportOf(getScroller(els)).scrollBy(top - anchor.offset);
      ctl.recheck();
      return true;
    }

    function scrollToPage(page) {
      const { run: r, items: its } = S;
      const els = itemElements(containerRef.current, its.length);
      const idx = r.starts[page - r.first];
      if (!els || idx === undefined || !els[idx]) return;
      const vp = viewportOf(getScroller(els));
      vp.scrollBy(els[idx].getBoundingClientRect().top - vp.top - 8);
      ctl.recheck();
    }

    // remember the item at the top of the view, to restore after items are
    // inserted above it (loading earlier pages, re-fetching the range)
    if (st) {
      st.holdPosition = () => {
        if (st.pendingAnchor) return;
        const anchor = captureAnchor();
        if (anchor) st.pendingAnchor = { anchor, items: S.items };
      };
    }

    // --- batch size --------------------------------------------------------

    React.useLayoutEffect(() => {
      if (!needsBatchSize) return;
      // keep the same items in view: the first item of the current page lands
      // on the page of BATCH_SIZE that contains it
      const per = filter.itemsPerPage > 0 ? filter.itemsPerPage : BATCH_SIZE;
      const page = Math.floor(((filter.currentPage - 1) * per) / BATCH_SIZE) + 1;
      const loc = history.location;
      const search = searchWithPage(setSearchParam(loc.search, "perPage", String(BATCH_SIZE)), page);
      history.replace(Object.assign({}, loc, { search }));
    }, [needsBatchSize, filter && filter.itemsPerPage, filter && filter.currentPage]);

    // --- mount / page-change handling -----------------------------------

    React.useLayoutEffect(() => {
      if (!enabled) {
        mountedRef.current = undefined;
        return;
      }
      const page = filter.currentPage;
      const prev = mountedRef.current;
      mountedRef.current = { page, st };

      if (!prev || prev.st !== st) {
        // mounting, re-enabling, or the filter changed to another list: only
        // back / forward navigation (or a reload) restores, anything else
        // starts fresh
        const action = isReturnVisit(st, location) ? "POP" : "PUSH";
        const inRange = page >= st.first && page <= st.last;
        if (window.InfiniteScrollDebug && window.InfiniteScrollDebug.trace) {
          console.debug(LOG_PREFIX, "mount", action, page, st.first, st.last, !!prev, location.key);
        }
        st.urlPage = page;
        if (action === "POP" && inRange) {
          // back / forward / reload: put the user back where they were. After a
          // reload only this page is loaded, but the saved anchor still works.
          const anchor = st.anchor || sessionGet(st.storageKey);
          if (anchor && anchor.page === page) {
            // keep re-applying for a few frames while images settle
            st.restoring = true;
            let frames = 0;
            const attempt = () => {
              restoreAnchor(anchor);
              if (++frames < 10) window.setTimeout(attempt, 30);
              else st.restoring = false;
            };
            attempt();
          }
        } else if (!inRange || st.first !== st.last) {
          resetEntry(st, page);
        }
        return;
      }

      if (page === prev.page || page === st.urlPage) return;

      // the page changed from outside: pagination control, keyboard, etc.
      // (Checked against the loaded range itself: `run` falls back to just the
      // current page when that page is outside the range.)
      st.urlPage = page;
      if (page >= st.run.first && page <= st.run.last) {
        suppressNextScrollToTop();
        scrollToPage(page);
      } else {
        resetEntry(st, page);
      }
    }, [enabled, filter && filter.currentPage, st]);

    // --- after every render --------------------------------------------

    React.useLayoutEffect(() => {
      if (!enabled) return;

      // (after the mount handling above, which needs to know whether this key
      // was seen before)
      if (location.key) {
        st.keys.add(location.key);
        if (st.keys.size > 200) st.keys.delete(st.keys.values().next().value);
      }

      // put the remembered item back where it was once the items actually
      // changed (not on the re-render that only shows the loading state)
      if (st.pendingAnchor && st.pendingAnchor.items !== items) {
        const a = st.pendingAnchor.anchor;
        st.pendingAnchor = undefined;
        restoreAnchor(a);
      }

      // count changed underneath us (a refetch after an edit, a deletion...)
      if (st.count !== st.ackCount) {
        st.ackCount = st.count;
        if (st.last > st.first) refreshRange(st);
      }

      // pages in range but missing from the cache (cache reset after a scan,
      // eviction): fetch them again
      if (
        !st.refreshing &&
        st.inflight.size === 0 &&
        !st.error &&
        (run.first > st.first || run.last < st.last) &&
        filter.currentPage >= st.first &&
        filter.currentPage <= st.last
      ) {
        refreshRange(st);
      }

      // The list was handed fewer items than the loaded pages hold. Opening a
      // scene does this: Stash stores its play queue's scenes with fewer
      // fields, so on the way back the merged pages read as incomplete and
      // Stash fetches only the current page. Fetching the loaded range again
      // fills them in; the remembered position is re-applied when they arrive.
      // Once per shortfall, so a range that can't be filled doesn't loop.
      const short =
        st.first < st.last &&
        st.run &&
        items.length < st.run.length &&
        filter.currentPage >= st.first &&
        filter.currentPage <= st.last;
      if (!short) {
        st.shortRefreshed = false;
      } else if (!st.shortRefreshed && !st.refreshing && st.inflight.size === 0 && !st.error) {
        st.shortRefreshed = true;
        refreshRange(st);
      }
    });

    // --- registry ---------------------------------------------------------

    const regRef = React.useRef(null);
    React.useLayoutEffect(() => {
      if (!enabled) return undefined;
      const reg = {
        name,
        mode,
        st,
        perPage: st.perPage,
        count: st.count,
        run,
        itemCount: items.length,
        selectedCount: 0,
        viewPage: undefined,
        scrollToPage: (p) => {
          scrollToPage(p);
          if (urlDrivenList(S.location.search, S.filter)) setAddressBarPage(p);
        },
      };
      regRef.current = reg;
      activeLists.add(reg);
      const container = containerRef.current && containerRef.current.closest(".item-list-container");
      if (container) container.classList.add("isc-active");
      notifyRegistry();
      return () => {
        activeLists.delete(reg);
        regRef.current = null;
        if (container) container.classList.remove("isc-active");
        notifyRegistry();
      };
    }, [enabled, st]);

    React.useLayoutEffect(() => {
      const reg = regRef.current;
      if (!reg) return;
      const sel = props.selectedIds ? props.selectedIds.size : 0;
      if (
        reg.count !== st.count ||
        reg.run.first !== run.first ||
        reg.run.last !== run.last ||
        reg.itemCount !== items.length ||
        reg.mode !== mode ||
        reg.selectedCount !== sel
      ) {
        Object.assign(reg, { count: st.count, run, itemCount: items.length, mode, selectedCount: sel });
        notifyRegistry();
      }
    });

    // --- scrolling -----------------------------------------------------------

    React.useEffect(() => {
      if (!enabled) return undefined;
      let frame = 0;
      let upIntent = 0;
      let lastSave = 0;
      let saved = null;
      let staleSince = 0;
      const save = (s, anchor) => {
        lastSave = Date.now();
        saved = anchor;
        sessionSet(s.storageKey, anchor);
      };

      const check = () => {
        frame = 0;
        const { st: s, run: r, items: its, filter: f } = S;
        const container = containerRef.current;
        if (!s || !container || container.offsetParent === null) return;
        const vh = window.innerHeight;
        const total = totalPages(s);
        const bottom = sentinelRef.current;
        const top = topRef.current;
        const scroller = getScroller(itemElements(container, its.length));
        // How far below the view loaded items should reach: the usual
        // load-ahead distance, or more when scrolling fast (enough travel for a
        // batch to arrive).
        const screen = scroller ? scroller.clientHeight : vh;
        const lead = Math.min(
          MAX_LEAD_SCREENS * screen,
          Math.max(settings.prefetchScreens * screen, currentSpeed() * LEAD_SECONDS)
        );
        let below;
        let nearTop;
        if (scroller) {
          below = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
          nearTop = !!top && scroller.scrollTop < scroller.clientHeight * 0.5;
        } else {
          below = bottom ? bottom.getBoundingClientRect().top - vh : Infinity;
          nearTop = !!top && top.getBoundingClientRect().bottom > -vh * 0.5;
        }
        const idle = !s.error && !s.refreshing && s.inflight.size === 0;

        // Safety net: when several batches land together, Apollo now and then
        // fails to hand the last merged result to the list, which then shows
        // fewer items than the cache holds and "End of results" too early.
        // If that lasts past one check, have the query report again.
        if (idle && its.length < s.run.length) {
          const cfg = LISTS[S.name];
          const oq = cfg && findListQuery(cfg, its, f);
          let held = 0;
          try {
            held = oq.getCurrentResult().data[cfg.field][cfg.itemsKey].length;
          } catch (e) {
            held = 0;
          }
          if (held > its.length) {
            if (staleSince && Date.now() - staleSince > 700) {
              staleSince = 0;
              try {
                oq.resetLastResults();
                Promise.resolve(oq.reobserve()).catch(() => {});
              } catch (e) {
                // older Apollo without these: the next batch re-renders anyway
              }
            } else if (!staleSince) {
              staleSince = Date.now();
            }
          } else {
            staleSince = 0;
          }
        } else {
          staleSince = 0;
        }

        // load ahead: as many batches as it takes to cover the shortfall, a
        // few at a time, counting the ones already on their way
        if (!s.error && !s.refreshing && below < lead && s.last < total) {
          const listHeight = scroller ? scroller.scrollHeight : container.getBoundingClientRect().height;
          const perBatch = its.length ? (listHeight / its.length) * s.perPage : screen;
          const batches = Math.max(1, Math.ceil((lead - below) / Math.max(perBatch, 1)));
          const onTheWay = s.last - r.last;
          for (let i = onTheWay; i < Math.min(batches, MAX_PARALLEL); i++) {
            if (!loadPage(s, s.last + 1)) break;
          }
        }

        // load the previous page when the user scrolls up into the top
        if (idle && nearTop && upIntent > Date.now() - 1000 && r.first === s.first) {
          s.holdPosition();
          loadPage(s, s.first - 1);
        }

        if (s.restoring) return;

        // remember the position, and keep the URL's page in step with the view
        const anchor = captureAnchor();
        if (!anchor) return;
        s.anchor = anchor;
        // throttled, but a new page is saved at once: the saved position has
        // to match the address bar's page, or coming back to this address
        // doesn't count as a return
        if (Date.now() - lastSave > 400 || !saved || saved.page !== anchor.page) save(s, anchor);
        const reg = regRef.current;
        if (reg && reg.viewPage !== anchor.page) {
          reg.viewPage = anchor.page;
          notifyRegistry();
        }
        if (anchor.page !== urlPage(window.location.search) && urlDrivenList(S.location.search, f)) {
          setAddressBarPage(anchor.page);
        }
      };

      const schedule = () => {
        if (!frame) frame = window.setTimeout(check, 30);
      };
      // Safety net: nothing else re-checks a list that's short enough not to
      // scroll if a load finishes without a re-render. Also retries a failed
      // load after a while.
      const safety = window.setInterval(() => {
        const s = S.st;
        if (s && s.error && Date.now() - (s.errorAt || 0) > RETRY_MS) {
          s.error = null;
          notify(s);
        }
        schedule();
      }, 1000);
      // listening on the document in the capture phase also catches scrolling
      // inside elements (scroll events don't bubble)
      const lastY = new WeakMap();
      const onScroll = (e) => {
        const t = e.target;
        const pageScroll = t === document || t === document.documentElement || t === window;
        const key = pageScroll ? document : t;
        const y = pageScroll ? window.scrollY : t.scrollTop;
        // scrolling up toward the top loader; our own restore scrolls don't count
        const ours = performance.now() - lastProgrammaticScroll < 200;
        if (!ours && y < (lastY.has(key) ? lastY.get(key) : y)) upIntent = Date.now();
        lastY.set(key, y);
        schedule();
      };
      const onWheel = (e) => {
        if (e.deltaY < 0) {
          upIntent = Date.now();
          schedule();
        }
      };

      document.addEventListener("scroll", onScroll, { capture: true, passive: true });
      window.addEventListener("resize", schedule, { passive: true });
      window.addEventListener("wheel", onWheel, { passive: true });
      S.schedule = schedule;
      schedule();
      return () => {
        document.removeEventListener("scroll", onScroll, { capture: true });
        window.removeEventListener("resize", schedule);
        window.removeEventListener("wheel", onWheel);
        if (frame) window.clearTimeout(frame);
        window.clearInterval(safety);
        S.schedule = undefined;
        // leaving (opening an item): keep the very latest position
        const s = S.st;
        if (s && s.anchor && s.anchor !== saved && !s.restoring) save(s, s.anchor);
      };
    }, [enabled]);

    // re-check after each render: a short first page, a finished load...
    React.useEffect(() => {
      if (S.schedule) S.schedule();
    });

    // --- pinned list header ------------------------------------------------

    React.useLayoutEffect(() => {
      if (!enabled || settings.disablePinnedHeader || !containerRef.current) return undefined;
      return pinListHeader(containerRef.current, (bottom) => {
        S.pinBottom = bottom;
      });
    }, [enabled]);

    // --- videos -------------------------------------------------------------

    React.useEffect(() => {
      if (!enabled || !containerRef.current) return undefined;
      return attachVideoManager(containerRef.current);
    }, [enabled]);

    // --- lightbox prefetch ----------------------------------------------------

    React.useEffect(() => {
      if (!enabled || name !== "ImageList") return undefined;
      const timer = window.setInterval(() => {
        const { st: s, items: its, run: r } = S;
        const carousel = document.querySelector(".Lightbox-carousel");
        if (!s || !carousel || carousel.children.length !== its.length) return;
        const m = /(-?\d+(?:\.\d+)?)vw/.exec(carousel.style.left || "");
        const index = m ? Math.round(-parseFloat(m[1]) / 100) : 0;
        if (index >= its.length - 3 && r.last === s.last && r.last < totalPages(s)) loadPage(s, s.last + 1);
      }, 400);
      return () => window.clearInterval(timer);
    }, [enabled, name]);

    React.useEffect(() => () => ctl.destroy(), [ctl]);

    // --- render ---------------------------------------------------------------

    const inner = h(WindowCtx.Provider, { value: ctl }, h(Passthrough, { Original, props: passProps }));
    if (!enabled) return h("div", { className: "isc-list", ref: containerRef }, inner);

    return h(
      "div",
      { className: "isc-list isc-enabled", ref: containerRef, "data-isc-mode": mode },
      h(TopLoader, {
        st,
        run,
        topRef,
        onLoad: () => {
          st.holdPosition();
          loadPage(st, st.first - 1);
        },
      }),
      inner,
      h(Sentinel, {
        st,
        run,
        total: totalPages(st),
        itemCount: items.length,
        sentinelRef,
        onRetry: () => {
          st.error = null;
          if (run.first > st.first || run.last < st.last) refreshRange(st);
          else loadPage(st, st.last + 1);
          notify(st);
        },
      }),
      h(ScrollTopButton, {
        getScroller: () => getScroller(itemElements(containerRef.current, S.items.length)),
      })
    );
  }

  // ---------------------------------------------------------------------------
  // pagination patches

  function PaginationProxy({ props, Original }) {
    useRegistry();
    const reg = matchActiveList(props.itemsPerPage, props.totalItems, props.currentPage);
    if (reg) {
      // the footer pagination is replaced by scrolling; the top one stays as a
      // page jumper unless hidden in settings
      if (props.pagePopupPlacement === "top" || settings.hidePageJumper) return null;
      // it shows the page in view, and loaded pages are scrolled to directly
      const jumper = Object.assign({}, props, {
        currentPage: reg.viewPage || props.currentPage,
        onChangePage: (p) => {
          if (p >= reg.run.first && p <= reg.run.last) reg.scrollToPage(p);
          else props.onChangePage(p);
        },
      });
      return h(Passthrough, { Original, props: jumper });
    }
    return h(Passthrough, { Original, props });
  }

  function PaginationIndexProxy({ props, Original }) {
    useRegistry();
    const intl = Intl.useIntl();
    const reg = props.loading ? undefined : matchActiveList(props.itemsPerPage, props.totalItems, props.currentPage);
    if (!reg) return h(Passthrough, { Original, props });
    // with no pages, the count is just the total
    return h(
      "span",
      { className: "filter-container text-muted paginationIndex center-text" },
      // a pill like the filter tags, so it stays readable over the cards when
      // the header is pinned
      h(
        "span",
        { className: "isc-count" },
        // in its own element, so a translated page can't trip React up
        h("span", null, intl.formatNumber(props.totalItems)),
        props.metadataByline
      )
    );
  }

  // ---------------------------------------------------------------------------
  // tagger: confirm "Scrape All" when it would run on many loaded scenes

  let confirmBypass = false;

  function showConfirm(message, onConfirm) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const close = () => {
      api.ReactDOM.unmountComponentAtNode(host);
      host.remove();
    };
    const { Modal, Button } = Bootstrap;
    api.ReactDOM.render(
      h(
        Modal,
        { show: true, onHide: close, centered: true },
        h(Modal.Body, null, message),
        h(
          Modal.Footer,
          null,
          h(Button, { variant: "secondary", onClick: close }, "Cancel"),
          h(
            Button,
            {
              variant: "primary",
              onClick: () => {
                close();
                onConfirm();
              },
            },
            "Continue"
          )
        )
      ),
      host
    );
  }

  function installTaggerConfirm() {
    document.addEventListener(
      "click",
      (e) => {
        if (confirmBypass || !e.target || !e.target.closest) return;
        const btn = e.target.closest(".tagger-container-header .d-flex > div.ml-1 > button");
        if (!btn || btn.disabled) return;
        let reg;
        for (const r of activeLists) {
          if (r.name === "SceneList" && r.mode === DisplayMode.Tagger) reg = r;
        }
        if (!reg || reg.selectedCount > 0) return;
        const threshold = settings.taggerConfirmThreshold || 40;
        if (reg.itemCount <= threshold) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        showConfirm(
          `This will scrape all ${reg.itemCount.toLocaleString()} loaded scenes, not just one page. ` +
            "That sends a request to the scraper for each scene. Continue?",
          () => {
            confirmBypass = true;
            try {
              btn.click();
            } finally {
              confirmBypass = false;
            }
          }
        );
      },
      true
    );
  }

  // ---------------------------------------------------------------------------
  // install

  function lastArg(args) {
    return args[args.length - 1];
  }

  function install() {
    if (!installCachePolicies()) return;

    for (const name of Object.keys(LISTS)) {
      const cfg = LISTS[name];
      api.patch.instead(name, function (props, ...rest) {
        return h(InfiniteList, { name, cfg, props, Original: lastArg(rest) });
      });
    }

    // Windowing is applied per card type rather than on the shared GridCard,
    // so that an off-screen card skips its own (fairly heavy) render as well.
    for (const name of CARD_COMPONENTS) {
      api.patch.instead(name, function (props, ...rest) {
        const Original = lastArg(rest);
        const ctl = React.useContext(WindowCtx);
        if (!ctl) return h(Passthrough, { Original, props });
        const id = cardId(props);
        if (id) ctl.latest.set(id, { props, Original });
        return h(MemoWindowedCard, { ctl, id, props, Original });
      });
    }

    api.patch.instead("Pagination", function (props, ...rest) {
      return h(PaginationProxy, { props, Original: lastArg(rest) });
    });

    api.patch.instead("PaginationIndex", function (props, ...rest) {
      return h(PaginationIndexProxy, { props, Original: lastArg(rest) });
    });

    installTaggerConfirm();
    loadSettings();
    if (api.Event && api.Event.addEventListener) {
      api.Event.addEventListener("stash:location", () => loadSettings());
    }
  }

  install();

  // for troubleshooting from the browser console
  window.InfiniteScrollDebug = { store, settings, activeLists, sizeCache, speed };
})();
