(function () {
  "use strict";
  const api = window.PluginApi;
  const { React, patch, libraries, register } = api;
  const { Link } = libraries.ReactRouterDOM;

  const PLUGIN_ID = "stashRag";

  async function gql(query, variables) {
    const res = await fetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ query, variables }),
    });
    const out = await res.json();
    if (out.errors) throw new Error(out.errors[0].message);
    return out.data;
  }

  async function runOp(args) {
    const d = await gql(
      "mutation($id:ID!,$args:Map){ runPluginOperation(plugin_id:$id, args:$args) }",
      { id: PLUGIN_ID, args }
    );
    const raw = d.runPluginOperation;
    // Stash's "raw" interface returns whatever the script printed to stdout as a JSON string
    // ({"output": ...}); be defensive about the exact shape.
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      return (parsed && parsed.output !== undefined) ? parsed.output : parsed;
    } catch (e) {
      return raw;
    }
  }

  function useOp(args, deps) {
    const [state, setState] = React.useState({ loading: true, data: null, error: null });
    React.useEffect(() => {
      let alive = true;
      setState({ loading: true, data: null, error: null });
      runOp(args)
        .then((data) => alive && setState({ loading: false, data, error: null }))
        .catch((err) => alive && setState({ loading: false, data: null, error: String(err) }));
      return () => {
        alive = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    return state;
  }

  // Browser-side cache (survives a page reload, e.g. iOS Safari discarding a backgrounded tab)
  // so a remounted tab shows the last-known data instantly instead of a blocking spinner.
  function readLocalCache(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function writeLocalCache(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // ignore (private mode, quota, etc.) - falls back to in-memory only
    }
  }

  // Tabs backed by the plugin's local cache: shows whatever was last saved instantly on open
  // (no live network/compute wait), with an explicit Refresh button to recompute on demand.
  // A background refetch (refresh:false, cheap DB read) always runs on mount to stay in sync,
  // but never blanks out already-shown data - only the "no data at all yet" case blocks.
  function useCachedOp(operation) {
    const storageKey = `stashrag:${operation}`;
    const [state, setState] = React.useState(() => {
      const cached = readLocalCache(storageKey);
      return cached
        ? { loading: false, data: cached, error: null }
        : { loading: true, data: null, error: null };
    });

    const fetchIt = React.useCallback(
      (refresh) => {
        setState((prev) => ({ ...prev, loading: true }));
        runOp({ operation, refresh })
          .then((data) => {
            writeLocalCache(storageKey, data);
            setState({ loading: false, data, error: null });
          })
          .catch((err) => setState((prev) => ({ ...prev, loading: false, error: String(err) })));
      },
      [operation, storageKey]
    );

    React.useEffect(() => {
      fetchIt(false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // [state, recompute-and-refresh, cheap-reload-from-cache (e.g. after a row was removed
    // server-side already, no need to pay for a full recompute just to re-read the list)]
    return [state, () => fetchIt(true), () => fetchIt(false)];
  }

  // Feed/site thumbnails can fail for reasons outside our control (expired signed URL, hotlink
  // protection, dead CDN link) - hide the broken-image icon instead of showing it.
  function hideOnError(e) {
    e.currentTarget.style.display = "none";
  }

  const QUALITY_RANK = { "4K": 5, "1440p": 4, "1080p": 3, "720p": 2, "480p": 1 };
  function durationToSeconds(s) {
    if (!s) return 0;
    return s.split(":").reduce((acc, v) => acc * 60 + Number(v), 0);
  }

  function RefreshBar({ state, onRefresh }) {
    const data = state.data || {};
    return React.createElement(
      "div",
      { className: "stashrag-refresh-bar" },
      React.createElement(
        "span",
        { className: "stashrag-updated-at" },
        data.cached && data.updated_at ? `Saved · last updated ${data.updated_at}` : ""
      ),
      React.createElement(
        "button",
        { className: "minimal stashrag-refresh-btn", onClick: onRefresh, disabled: state.loading },
        state.loading ? "..." : "🔄 Refresh"
      )
    );
  }

  // ------------------------------------------------------------------ Search (chat)
  function SearchTab() {
    const [question, setQuestion] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [answer, setAnswer] = React.useState(null);
    const [scenes, setScenes] = React.useState([]);
    const [error, setError] = React.useState(null);

    async function ask(e) {
      e.preventDefault();
      if (!question.trim() || busy) return;
      setBusy(true);
      setError(null);
      try {
        const result = await runOp({ operation: "ask", question });
        setAnswer(result.answer);
        setScenes(result.scenes || []);
      } catch (err) {
        setError(String(err));
      } finally {
        setBusy(false);
      }
    }

    return React.createElement(
      "div",
      { className: "stashrag-tab" },
      React.createElement(
        "form",
        { className: "stashrag-ask-form", onSubmit: ask },
        React.createElement("input", {
          type: "text",
          placeholder: "What are you looking for in your library?",
          value: question,
          onChange: (e) => setQuestion(e.target.value),
        }),
        React.createElement("button", { type: "submit", disabled: busy }, busy ? "..." : "Ask")
      ),
      error ? React.createElement("p", { className: "text-danger" }, error) : null,
      answer ? React.createElement("p", { className: "stashrag-answer" }, answer) : null,
      scenes.length
        ? React.createElement(
            "div",
            { className: "stashrag-scene-list" },
            scenes.map((s, i) =>
              s.type === "external"
                ? React.createElement(
                    "a",
                    {
                      key: `ext-${i}`,
                      href: s.link,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "stashrag-scene-row stashrag-scene-row-external",
                    },
                    React.createElement("span", { className: "stashrag-rec-source" }, s.feed),
                    " ",
                    s.title
                  )
                : React.createElement(
                    Link,
                    { key: s.id, to: `/scenes/${s.id}`, className: "stashrag-scene-row" },
                    s.card
                  )
            )
          )
        : null
    );
  }

  // ------------------------------------------------------------------ Recommended (live StashDB/TPDB)
  function RecommendationsTab() {
    const [state, refresh] = useCachedOp("recommendations");
    const [showImages, setShowImages] = React.useState(false);
    const data = state.data || {};
    return React.createElement(
      "div",
      { className: "stashrag-tab" },
      React.createElement(
        "div",
        { className: "stashrag-refresh-bar" },
        React.createElement(RefreshBar, { state, onRefresh: refresh }),
        React.createElement(
          "button",
          {
            type: "button",
            className: "stashrag-refresh-btn",
            title: showImages ? "Hide images" : "Show images",
            onClick: () => setShowImages((v) => !v),
          },
          showImages ? "🙈 Hide images" : "👁 Show images"
        )
      ),
      !state.data && state.loading
        ? React.createElement("p", null, "Loading...")
        : !state.data && state.error
        ? React.createElement("p", { className: "text-danger" }, state.error)
        : !data.available
        ? React.createElement("p", { className: "stashrag-empty" }, data.reason || "Not available.")
        : !data.items || !data.items.length
        ? React.createElement("p", { className: "stashrag-empty" }, "No results for now.")
        : React.createElement(
            "div",
            { className: "stashrag-rec-list" },
            data.items.map((it, i) =>
              React.createElement(
                "div",
                { key: i, className: "stashrag-rec-row" },
                showImages && it.image
                  ? React.createElement("img", { src: it.image, className: "stashrag-rec-thumb", onError: hideOnError })
                  : null,
                React.createElement("span", { className: "stashrag-rec-source" }, it.source),
                " ",
                it.url
                  ? React.createElement(
                      "a",
                      { href: it.url, target: "_blank", rel: "noopener noreferrer" },
                      it.title
                    )
                  : React.createElement("span", null, it.title),
                it.matched_on
                  ? React.createElement("span", { className: "stashrag-rec-matched" }, ` (via: ${it.matched_on})`)
                  : null
              )
            )
          )
    );
  }

  // ------------------------------------------------------------------ Sites (auto-discovered feed)
  function SitesTab() {
    const [state, refresh, reload] = useCachedOp("sites");
    const [newUrl, setNewUrl] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [addError, setAddError] = React.useState(null);
    const [showImages, setShowImages] = React.useState(false);
    const [selectedTags, setSelectedTags] = React.useState([]);
    const [tagPanelOpen, setTagPanelOpen] = React.useState(false);
    const [clearingCache, setClearingCache] = React.useState(false);
    const [clearMsg, setClearMsg] = React.useState(null);
    const [downloadState, setDownloadState] = React.useState({});
    const [bookmarkedOnly, setBookmarkedOnly] = React.useState(false);
    const [bookmarking, setBookmarking] = React.useState({});
    const caps = useOp({ operation: "capabilities" }, []);
    const ytdlpReady = !!(caps.data && caps.data.ytdlp_available);

    async function addFeed(e) {
      e.preventDefault();
      if (!newUrl.trim() || busy) return;
      setBusy(true);
      setAddError(null);
      try {
        // configurePlugin REPLACES the whole settings blob, it doesn't merge - sending only
        // {siteFeeds: ...} would silently wipe every other setting (LLM provider, download
        // folder, etc). Read the current config and spread it, only overriding siteFeeds.
        const conf = await gql("{ configuration{ plugins } }");
        const currentCfg = (conf.configuration.plugins || {}).stashRag || {};
        const current = currentCfg.siteFeeds || "";
        const updated = current ? `${current}\n${newUrl.trim()}` : newUrl.trim();
        await gql(
          "mutation($id:ID!,$input:Map!){ configurePlugin(plugin_id:$id, input:$input) }",
          { id: PLUGIN_ID, input: { ...currentCfg, siteFeeds: updated } }
        );
        setNewUrl("");
        refresh();
      } catch (err) {
        setAddError(String(err));
      } finally {
        setBusy(false);
      }
    }

    async function clearImageCache() {
      setClearingCache(true);
      setClearMsg(null);
      try {
        const res = await runOp({ operation: "clear_image_cache" });
        setClearMsg(`Cleared ${res.cleared} cached image(s) - will re-download on next refresh.`);
      } catch (err) {
        setClearMsg(String(err));
      } finally {
        setClearingCache(false);
      }
    }

    async function downloadItem(link) {
      setDownloadState((prev) => ({ ...prev, [link]: { busy: true } }));
      try {
        const res = await runOp({ operation: "download", url: link });
        setDownloadState((prev) => ({
          ...prev,
          [link]: { busy: false, ok: res.ok, error: res.error, watchLater: res.watch_later_applied },
        }));
      } catch (err) {
        setDownloadState((prev) => ({ ...prev, [link]: { busy: false, ok: false, error: String(err) } }));
      }
    }

    async function toggleBookmark(link) {
      setBookmarking((prev) => ({ ...prev, [link]: true }));
      try {
        await runOp({ operation: "toggle_bookmark", link });
        reload();
      } finally {
        setBookmarking((prev) => ({ ...prev, [link]: false }));
      }
    }

    const data = state.data || {};
    const allItems = data.items || [];
    const tagCounts = {};
    allItems.forEach((it) => (it.tags || []).forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    }));
    const allTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([t]) => t);
    let items = selectedTags.length
      ? allItems.filter((it) => (it.tags || []).some((t) => selectedTags.includes(t)))
      : allItems;
    if (bookmarkedOnly) items = items.filter((it) => it.bookmarked);
    function toggleTag(t) {
      setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    }

    return React.createElement(
      "div",
      { className: "stashrag-tab" },
      React.createElement(
        "form",
        { className: "stashrag-ask-form", onSubmit: addFeed },
        React.createElement("input", {
          type: "text",
          placeholder: "Add a site, e.g. example.com",
          value: newUrl,
          onChange: (e) => setNewUrl(e.target.value),
        }),
        React.createElement("button", { type: "submit", disabled: busy }, busy ? "..." : "Add")
      ),
      React.createElement(
        "p",
        { className: "stashrag-hint" },
        "Just the site - its RSS/news feed is found automatically. Items seen here stick around even after the site's own feed moves on."
      ),
      !caps.loading && !ytdlpReady
        ? React.createElement(
            "p",
            { className: "stashrag-hint" },
            "Download buttons appear here once you run the \"Install / update yt-dlp\" task (Settings → Tasks → Plugin Tasks → Stash RAG)."
          )
        : null,
      React.createElement(
        "div",
        { className: "stashrag-refresh-bar" },
        React.createElement(RefreshBar, { state, onRefresh: refresh }),
        React.createElement(
          "button",
          {
            type: "button",
            className: "stashrag-refresh-btn",
            title: showImages ? "Hide images" : "Show images",
            onClick: () => setShowImages((v) => !v),
          },
          showImages ? "🙈 Hide images" : "👁 Show images"
        ),
        React.createElement(
          "button",
          {
            type: "button",
            className: "stashrag-refresh-btn" + (bookmarkedOnly ? " stashrag-tag-chip-active" : ""),
            title: "Show only bookmarked items",
            onClick: () => setBookmarkedOnly((v) => !v),
          },
          "🔖 Bookmarked only"
        ),
        React.createElement(
          "button",
          {
            type: "button",
            className: "stashrag-refresh-btn",
            title: "Delete all locally-cached thumbnail images (they'll be re-downloaded as needed)",
            onClick: clearImageCache,
            disabled: clearingCache,
          },
          clearingCache ? "…" : "🧹 Clear image cache"
        )
      ),
      clearMsg ? React.createElement("p", { className: "stashrag-hint" }, clearMsg) : null,
      addError ? React.createElement("p", { className: "text-danger" }, addError) : null,
      !state.data && state.loading
        ? React.createElement("p", null, "Loading...")
        : !state.data && state.error
        ? React.createElement("p", { className: "text-danger" }, state.error)
        : !data.available
        ? React.createElement("p", { className: "stashrag-empty" }, data.reason || "Not available.")
        : React.createElement(
            React.Fragment,
            null,
            (data.errors || []).map((e, i) =>
              React.createElement(
                "p",
                { key: `err-${i}`, className: "text-danger stashrag-feed-error" },
                `❌ ${e.feed}: ${e.error}`
              )
            ),
            allTags.length
              ? React.createElement(
                  "div",
                  { className: "stashrag-tag-filter" },
                  React.createElement(
                    "button",
                    {
                      type: "button",
                      className: "stashrag-refresh-btn",
                      onClick: () => setTagPanelOpen((v) => !v),
                    },
                    `🏷 Tags${selectedTags.length ? ` (${selectedTags.length})` : ""} ${tagPanelOpen ? "▴" : "▾"}`
                  ),
                  selectedTags.length
                    ? React.createElement(
                        "span",
                        { className: "stashrag-tag-row" },
                        selectedTags.map((t) =>
                          React.createElement(
                            "span",
                            { key: t, className: "stashrag-tag-chip stashrag-tag-chip-active", onClick: () => toggleTag(t) },
                            `${t} ✕`
                          )
                        )
                      )
                    : null,
                  tagPanelOpen
                    ? React.createElement(
                        "div",
                        { className: "stashrag-tag-panel" },
                        allTags.map((t) =>
                          React.createElement(
                            "span",
                            {
                              key: t,
                              className: "stashrag-tag-chip" + (selectedTags.includes(t) ? " stashrag-tag-chip-active" : ""),
                              onClick: () => toggleTag(t),
                            },
                            `${t} (${tagCounts[t]})`
                          )
                        )
                      )
                    : null
                )
              : null,
            React.createElement(
              "div",
              { className: "stashrag-rec-list" },
              items.map((it, i) => {
                const dl = downloadState[it.link] || {};
                const externalOnly = it.bookmarked && !it.downloaded;
                return React.createElement(
                  "div",
                  { key: i, className: "stashrag-site-card" + (externalOnly ? " stashrag-site-card-external" : "") },
                  externalOnly
                    ? React.createElement(
                        "div",
                        { className: "stashrag-external-badge" },
                        "🔗 Not downloaded yet - opens on the site, not playable here"
                      )
                    : it.bookmarked
                    ? React.createElement("div", { className: "stashrag-downloaded-badge" }, "✅ Downloaded")
                    : null,
                  React.createElement(
                    "a",
                    { href: it.link, target: "_blank", rel: "noopener noreferrer", className: "stashrag-site-link" },
                    showImages && it.image
                      ? React.createElement(
                          "div",
                          { className: "stashrag-thumb-wrap" },
                          React.createElement("img", { src: it.image, onError: hideOnError }),
                          it.quality
                            ? React.createElement("span", { className: "stashrag-badge stashrag-badge-quality" }, it.quality)
                            : null,
                          it.duration
                            ? React.createElement("span", { className: "stashrag-badge stashrag-badge-duration" }, it.duration)
                            : null
                        )
                      : null,
                    React.createElement("span", { className: "stashrag-rec-source" }, it.feed),
                    " ",
                    React.createElement("span", null, it.title),
                    !showImages && (it.quality || it.duration)
                      ? React.createElement(
                          "div",
                          { className: "stashrag-dup-meta" },
                          [it.quality, it.duration].filter(Boolean).join(" · ")
                        )
                      : null,
                    (it.tags || []).length
                      ? React.createElement("div", { className: "stashrag-site-tags" }, (it.tags || []).slice(0, 6).join(" · "))
                      : null
                  ),
                  React.createElement(
                    "div",
                    { className: "stashrag-item-actions" },
                    React.createElement(
                      "button",
                      {
                        type: "button",
                        className: "mini stashrag-refresh-btn" + (it.bookmarked ? " stashrag-tag-chip-active" : ""),
                        title: it.bookmarked
                          ? "Bookmarked - will be queued to Watch Later once downloaded"
                          : "Bookmark - once downloaded (now or later), it'll be queued to Watch Later",
                        onClick: () => toggleBookmark(it.link),
                        disabled: !!bookmarking[it.link],
                      },
                      it.bookmarked ? "🔖 Bookmarked" : "🔖 Bookmark"
                    ),
                    ytdlpReady
                      ? React.createElement(
                          "button",
                          {
                            type: "button",
                            className: "mini stashrag-refresh-btn stashrag-download-btn",
                            title: "Download this video",
                            onClick: () => downloadItem(it.link),
                            disabled: dl.busy,
                          },
                          dl.busy
                            ? "… downloading"
                            : dl.ok
                            ? dl.watchLater
                              ? "✅ sent to Watch Later"
                              : "✅ downloaded"
                            : dl.ok === false
                            ? `❌ ${dl.error}`
                            : "⬇️ Download"
                        )
                      : null
                  )
                );
              })
            )
          )
    );
  }

  // ------------------------------------------------------------------ Downloads
  function DownloadTab() {
    const [url, setUrl] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [refreshKey, setRefreshKey] = React.useState(0);
    const [armed, setArmed] = React.useState(null);
    const [removing, setRemoving] = React.useState({});
    const [togglingWatchLater, setTogglingWatchLater] = React.useState({});
    const state = useOp({ operation: "download_history" }, [refreshKey]);
    const items = (state.data && state.data.items) || [];
    const caps = useOp({ operation: "capabilities" }, []);
    // Only activates once yt-dlp is already present in Stash's Python env - the plugin never
    // installs it for you (see maybe_update_ytdlp), so until then there's nothing to show here.
    const ytdlpReady = !!(caps.data && caps.data.ytdlp_available);

    async function download(e) {
      e.preventDefault();
      if (!url.trim() || busy) return;
      setBusy(true);
      try {
        await runOp({ operation: "download", url });
        setUrl("");
      } catch (err) {
        // still falls through to a refresh below - do_download always logs the attempt
        // server-side (even on failure), so the history will show what happened.
      } finally {
        setBusy(false);
        setRefreshKey((k) => k + 1);
      }
    }

    async function deleteDownload(id) {
      if (armed !== id) {
        setArmed(id);
        setTimeout(() => setArmed((cur) => (cur === id ? null : cur)), 4000);
        return;
      }
      setArmed(null);
      setRemoving((prev) => ({ ...prev, [id]: true }));
      try {
        await runOp({ operation: "delete_download", id });
        setRefreshKey((k) => k + 1);
      } catch (err) {
        setRemoving((prev) => ({ ...prev, [id]: false }));
      }
    }

    async function toggleWatchLater(id) {
      setTogglingWatchLater((prev) => ({ ...prev, [id]: true }));
      try {
        await runOp({ operation: "toggle_watch_later", id });
        setRefreshKey((k) => k + 1);
      } finally {
        setTogglingWatchLater((prev) => ({ ...prev, [id]: false }));
      }
    }

    return React.createElement(
      "div",
      { className: "stashrag-tab" },
      !caps.loading && !ytdlpReady
        ? React.createElement(
            "p",
            { className: "stashrag-empty" },
            "Download isn't active yet - run the \"Install / update yt-dlp\" task (Settings → Tasks → Plugin Tasks → Stash RAG) to turn it on. It's a one-time, explicit opt-in - this plugin never installs anything on its own."
          )
        : React.createElement(
            React.Fragment,
            null,
            React.createElement(
              "form",
              { className: "stashrag-ask-form", onSubmit: download },
              React.createElement("input", {
                type: "text",
                placeholder: "Paste a URL to download",
                value: url,
                onChange: (e) => setUrl(e.target.value),
              }),
              React.createElement("button", { type: "submit", disabled: busy }, busy ? "..." : "Download")
            ),
            React.createElement(
              "p",
              { className: "stashrag-hint" },
              "Every download (from here or the Sites tab) lands here, with where the file went and whether it worked."
            )
          ),
      React.createElement(
        "div",
        { className: "stashrag-refresh-bar" },
        React.createElement("span"),
        React.createElement(
          "button",
          { type: "button", className: "minimal stashrag-refresh-btn", onClick: () => setRefreshKey((k) => k + 1) },
          state.loading ? "..." : "🔄 Refresh"
        )
      ),
      state.loading && !items.length
        ? React.createElement("p", null, "Loading...")
        : state.error && !items.length
        ? React.createElement("p", { className: "text-danger" }, state.error)
        : !items.length
        ? React.createElement("p", { className: "stashrag-empty" }, "No downloads yet.")
        : React.createElement(
            "div",
            { className: "stashrag-rec-list" },
            items.map((r) =>
              React.createElement(
                "div",
                { key: r.id, className: "stashrag-download-row" },
                React.createElement(
                  "div",
                  { className: "stashrag-download-main" },
                  r.status === "ok"
                    ? React.createElement("span", null, `✅ ${r.title || r.url}`)
                    : React.createElement("span", { className: "text-danger" }, `❌ ${r.error || "failed"}`),
                  r.watch_later ? React.createElement("span", { className: "stashrag-rec-matched" }, " · Watch Later") : null
                ),
                r.path ? React.createElement("div", { className: "stashrag-dup-meta" }, r.path) : null,
                React.createElement("div", { className: "stashrag-history-t" }, r.created_at),
                React.createElement(
                  "div",
                  { className: "stashrag-item-actions" },
                  r.status === "ok" && r.path
                    ? React.createElement(
                        "button",
                        {
                          type: "button",
                          className: "mini stashrag-refresh-btn" + (r.watch_later ? " stashrag-tag-chip-active" : ""),
                          onClick: () => toggleWatchLater(r.id),
                          disabled: !!togglingWatchLater[r.id],
                        },
                        togglingWatchLater[r.id] ? "…" : r.watch_later ? "🔖 Watch Later" : "🔖 Add to Watch Later"
                      )
                    : null,
                  React.createElement(
                    "button",
                    {
                      type: "button",
                      className: "mini stashrag-refresh-btn",
                      onClick: () => deleteDownload(r.id),
                      disabled: !!removing[r.id],
                    },
                    removing[r.id] ? "…" : armed === r.id ? "sure? click again" : "🗑 delete"
                  )
                )
              )
            )
          )
    );
  }

  // ------------------------------------------------------------------ Profile
  function ProfileTab() {
    const [state, refresh] = useCachedOp("profile");
    const names = (state.data && state.data.top_performers) || [];
    return React.createElement(
      "div",
      { className: "stashrag-tab" },
      React.createElement(RefreshBar, { state, onRefresh: refresh }),
      !state.data && state.loading
        ? React.createElement("p", null, "Loading...")
        : !state.data && state.error
        ? React.createElement("p", { className: "text-danger" }, state.error)
        : !names.length
        ? React.createElement("p", { className: "stashrag-empty" }, "No data yet - rate or watch a few scenes.")
        : React.createElement(
            "ol",
            { className: "stashrag-rec-list" },
            names.map((n, i) => React.createElement("li", { key: i, className: "stashrag-rec-row" }, n))
          )
    );
  }

  // ------------------------------------------------------------------ Duplicates
  function DuplicatesTab() {
    const [state, refresh, reload] = useCachedOp("duplicates");
    const [armed, setArmed] = React.useState(null);
    const [removing, setRemoving] = React.useState({});
    const data = state.data || {};

    async function deleteScene(id) {
      if (armed !== id) {
        setArmed(id);
        setTimeout(() => setArmed((cur) => (cur === id ? null : cur)), 4000);
        return;
      }
      setArmed(null);
      setRemoving((prev) => ({ ...prev, [id]: true }));
      try {
        await runOp({ operation: "delete_scene", scene_id: id });
        reload();
      } catch (err) {
        setRemoving((prev) => ({ ...prev, [id]: false }));
      }
    }

    function sideBlock(id, title, thumb, resolution, duration, isBest) {
      return React.createElement(
        "div",
        { className: "stashrag-dup-side" + (isBest ? " stashrag-dup-side-best" : "") },
        React.createElement(
          Link,
          { to: `/scenes/${id}`, className: "stashrag-dup-side-link" },
          React.createElement(
            "div",
            { className: "stashrag-thumb-wrap" },
            thumb ? React.createElement("img", { src: thumb, onError: hideOnError }) : null,
            resolution ? React.createElement("span", { className: "stashrag-badge stashrag-badge-quality" }, resolution) : null,
            duration ? React.createElement("span", { className: "stashrag-badge stashrag-badge-duration" }, duration) : null
          ),
          React.createElement("div", { className: "stashrag-dup-side-title" }, title)
        ),
        isBest ? React.createElement("span", { className: "stashrag-dup-best-tag" }, "⭐ likely better") : null,
        React.createElement(
          "button",
          {
            type: "button",
            className: "mini stashrag-refresh-btn",
            onClick: () => deleteScene(id),
            disabled: !!removing[id],
          },
          removing[id] ? "…" : armed === id ? "sure? click again" : "🗑 delete"
        )
      );
    }

    return React.createElement(
      "div",
      { className: "stashrag-tab" },
      React.createElement(RefreshBar, { state, onRefresh: refresh }),
      !state.data && state.loading
        ? React.createElement("p", null, "Loading...")
        : !state.data && state.error
        ? React.createElement("p", { className: "text-danger" }, state.error)
        : !data.available
        ? React.createElement("p", { className: "stashrag-empty" }, data.reason || "Not available.")
        : !data.pairs || !data.pairs.length
        ? React.createElement("p", { className: "stashrag-empty" }, "No likely duplicates found.")
        : React.createElement(
            "div",
            { className: "stashrag-rec-list" },
            data.pairs.map((p, i) => {
              const rankA = QUALITY_RANK[p.resolution_a] || 0;
              const rankB = QUALITY_RANK[p.resolution_b] || 0;
              let best = null;
              if (rankA !== rankB) {
                best = rankA > rankB ? "a" : "b";
              } else {
                const durA = durationToSeconds(p.duration_a);
                const durB = durationToSeconds(p.duration_b);
                if (durA !== durB) best = durA > durB ? "a" : "b";
              }
              return React.createElement(
                "div",
                { key: i, className: "stashrag-dup-card" },
                React.createElement("div", { className: "stashrag-dup-scorebar" }, `${Math.round(p.score * 100)}% match`),
                React.createElement(
                  "div",
                  { className: "stashrag-dup-compare" },
                  sideBlock(p.id_a, p.title_a, p.thumb_a, p.resolution_a, p.duration_a, best === "a"),
                  React.createElement("div", { className: "stashrag-dup-vs" }, "vs"),
                  sideBlock(p.id_b, p.title_b, p.thumb_b, p.resolution_b, p.duration_b, best === "b")
                )
              );
            })
          )
    );
  }

  // ------------------------------------------------------------------ Chat history
  function HistoryTab() {
    const state = useOp({ operation: "history" }, []);
    if (state.loading) return React.createElement("p", null, "Loading...");
    if (state.error) return React.createElement("p", { className: "text-danger" }, state.error);
    const items = (state.data && state.data.items) || [];
    if (!items.length) {
      return React.createElement("p", { className: "stashrag-empty" }, "No searches yet.");
    }
    return React.createElement(
      "div",
      { className: "stashrag-history-list" },
      items.map((it, i) =>
        React.createElement(
          "div",
          { key: i, className: "stashrag-history-item" },
          React.createElement("div", { className: "stashrag-history-q" }, `❓ ${it.question}`),
          React.createElement("div", { className: "stashrag-history-a" }, it.answer),
          React.createElement("div", { className: "stashrag-history-t" }, it.created_at)
        )
      )
    );
  }

  // ------------------------------------------------------------------ page shell
  const TABS = [
    { key: "search", label: "🔎 Search", Component: SearchTab },
    { key: "recommendations", label: "🔗 Recommended", Component: RecommendationsTab },
    { key: "sites", label: "🌐 Sites", Component: SitesTab },
    { key: "download", label: "⬇️ Download", Component: DownloadTab },
    { key: "duplicates", label: "🗂️ Duplicates", Component: DuplicatesTab },
    { key: "history", label: "💬 History", Component: HistoryTab },
    { key: "profile", label: "👤 Profile", Component: ProfileTab },
  ];

  function StashRagPage() {
    const [active, setActive] = React.useState("search");
    const ActiveComponent = TABS.find((t) => t.key === active).Component;

    return React.createElement(
      "div",
      { className: "stashrag-page" },
      React.createElement(
        "div",
        { className: "stashrag-tabbar" },
        TABS.map((t) =>
          React.createElement(
            "button",
            {
              key: t.key,
              className: "minimal stashrag-tab-btn" + (t.key === active ? " stashrag-tab-btn-active" : ""),
              onClick: () => setActive(t.key),
            },
            t.label
          )
        )
      ),
      React.createElement(ActiveComponent, null)
    );
  }

  register.route("/plugin/stashRag", StashRagPage);

  patch.before("MainNavBar.UtilityItems", function (props) {
    return [
      {
        children: React.createElement(
          React.Fragment,
          null,
          props.children,
          React.createElement(
            Link,
            {
              className: "nav-utility stashrag-nav-link",
              to: "/plugin/stashRag",
              title: "Stash RAG",
            },
            React.createElement(
              "button",
              { className: "minimal d-flex align-items-center h-100" },
              "🧠"
            )
          )
        ),
      },
    ];
  });
})();
