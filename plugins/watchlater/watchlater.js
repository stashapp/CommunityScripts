(function () {
  "use strict";
  const api = window.PluginApi;
  const { React, patch, libraries, register } = api;
  const { faTrash } = libraries.FontAwesomeSolid;
  const { Icon } = api.components;
  // Use Link (not a plain <a href>): a plain <a> triggers a full page load, which hits the
  // server and 404s on /plugin/watchlater (the route only exists client-side, not server-side) -
  // real bug found and fixed by testing live in the browser.
  const { Link } = libraries.ReactRouterDOM;

  const TAG_NAME = "Watch Later";
  const KOFI_URL = "https://ko-fi.com/greenthumb80";
  const FEEDBACK_URL = "https://github.com/spesometro2026/stash-watchlater-plugin/issues/new";
  let tagId = null;
  let tagPromise = null;

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

  function ensureTag() {
    if (tagPromise) return tagPromise;
    tagPromise = (async () => {
      const found = await gql(
        "query($f: TagFilterType) { findTags(tag_filter: $f) { tags { id name } } }",
        { f: { name: { value: TAG_NAME, modifier: "EQUALS" } } }
      );
      if (found.findTags.tags.length) {
        tagId = found.findTags.tags[0].id;
        return tagId;
      }
      const created = await gql(
        "mutation($input: TagCreateInput!) { tagCreate(input: $input) { id } }",
        { input: { name: TAG_NAME, description: "Created by the Watch Later plugin" } }
      );
      tagId = created.tagCreate.id;
      return tagId;
    })();
    return tagPromise;
  }

  async function removeFromWatchLater(scene) {
    const tid = await ensureTag();
    const currentIds = (scene.tags || []).map((t) => t.id);
    await gql(
      "mutation($input: SceneUpdateInput!) { sceneUpdate(input: $input) { id } }",
      { input: { id: scene.id, tag_ids: currentIds.filter((x) => x !== tid) } }
    );
  }

  // ------------------------------------------------------------------ card button (grid)
  function WatchLaterButton({ scene }) {
    // "on" is real React state (not re-derived from scene.tags on every render): mutating
    // scene.tags in place, like the previous version did, does NOT trigger a re-render on its
    // own - that's the root cause of the old "needs a reload to see the change" bug. Now it's
    // flipped explicitly with setOn once the mutation succeeds.
    const [on, setOn] = React.useState(
      !!(tagId && (scene.tags || []).some((t) => t.id === tagId))
    );
    const [busy, setBusy] = React.useState(false);

    React.useEffect(() => {
      let alive = true;
      ensureTag().then((tid) => {
        if (alive) setOn((scene.tags || []).some((t) => t.id === tid));
      });
      return () => {
        alive = false;
      };
    }, []);

    async function toggle(e) {
      e.preventDefault();
      e.stopPropagation();
      if (busy) return;
      setBusy(true);
      const nextOn = !on;
      try {
        const tid = await ensureTag();
        const currentIds = (scene.tags || []).map((t) => t.id);
        const newIds = nextOn
          ? [...currentIds, tid]
          : currentIds.filter((x) => x !== tid);
        await gql(
          "mutation($input: SceneUpdateInput!) { sceneUpdate(input: $input) { id tags { id } } }",
          { input: { id: scene.id, tag_ids: newIds } }
        );
        // Do NOT mutate scene.tags: the object comes from the Apollo cache and is frozen (seen
        // in the console: "Cannot assign to read only property") - setOn alone is enough, "on"
        // is already independent React state, scene itself doesn't need to stay in sync.
        setOn(nextOn);
      } catch (err) {
        console.error("[Watch Later] toggle error:", err);
      } finally {
        setBusy(false);
      }
    }

    return React.createElement(
      "div",
      { className: "watch-later-overlay" },
      React.createElement(
        "button",
        {
          className:
            "watch-later-btn minimal" + (on ? " watch-later-on" : ""),
          title: on ? "Remove from Watch Later" : "Add to Watch Later",
          onClick: toggle,
          disabled: busy,
        },
        "🔖"
      )
    );
  }

  patch.instead("SceneCard.Overlays", function (props, _ctx, orig) {
    return React.createElement(
      React.Fragment,
      null,
      orig(props, _ctx),
      React.createElement(WatchLaterButton, { scene: props.scene })
    );
  });

  // ------------------------------------------------------------------ dedicated page
  function fmtDuration(sec) {
    if (!sec) return "";
    sec = Math.round(sec);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  function WatchLaterCard({ scene, onRemoved }) {
    const [removing, setRemoving] = React.useState(false);
    const file = scene.files && scene.files[0];

    async function remove(e) {
      e.preventDefault();
      e.stopPropagation();
      if (removing) return;
      setRemoving(true);
      try {
        await removeFromWatchLater(scene);
        onRemoved(scene.id);
      } catch (err) {
        console.error("[Watch Later] remove error:", err);
        setRemoving(false);
      }
    }

    return React.createElement(
      "div",
      { className: "watchlater-row" },
      React.createElement(
        Link,
        { to: `/scenes/${scene.id}`, className: "watchlater-row-thumb-link" },
        React.createElement("img", {
          className: "watchlater-row-thumb",
          loading: "lazy",
          src: scene.paths && scene.paths.screenshot,
          alt: "",
        }),
        file && file.duration
          ? React.createElement(
              "span",
              { className: "watchlater-row-duration" },
              fmtDuration(file.duration)
            )
          : null
      ),
      React.createElement(
        "div",
        { className: "watchlater-row-body" },
        React.createElement(
          Link,
          { to: `/scenes/${scene.id}`, className: "watchlater-row-title" },
          scene.title || (file ? file.basename : "") || `Scene #${scene.id}`
        ),
        scene.studio
          ? React.createElement(
              "div",
              { className: "watchlater-row-studio" },
              scene.studio.name
            )
          : null,
        scene.performers && scene.performers.length
          ? React.createElement(
              "div",
              { className: "watchlater-row-performers" },
              scene.performers.map((p) => p.name).join(", ")
            )
          : null,
        // the "Watch Later" tag itself isn't informative here, exclude it from the shown list.
        scene.tags && scene.tags.some((t) => t.id !== tagId)
          ? React.createElement(
              "div",
              { className: "watchlater-row-tags" },
              scene.tags
                .filter((t) => t.id !== tagId)
                .map((t) => t.name)
                .join(" · ")
            )
          : null
      ),
      React.createElement(
        "button",
        {
          className: "watchlater-remove-btn minimal",
          title: "Remove from Watch Later",
          onClick: remove,
          disabled: removing,
        },
        React.createElement(Icon, { icon: faTrash })
      )
    );
  }

  function WatchLaterPage() {
    const [scenes, setScenes] = React.useState(null);
    const [error, setError] = React.useState(null);

    // "updated_at" is used as a stand-in for "date added to Watch Later": Stash doesn't keep a
    // per-tag timestamp, but tagging a scene bumps its updated_at - so the most recently added
    // scene ends up on top, as requested ("sort by when it was added, not by name").
    const load = React.useCallback(async () => {
      try {
        const tid = await ensureTag();
        const d = await gql(
          `query($id: ID!) {
            findScenes(
              scene_filter: { tags: { modifier: INCLUDES, value: [$id] } }
              filter: { per_page: -1, sort: "updated_at", direction: DESC }
            ) {
              count
              scenes {
                id title date
                studio { name }
                files { basename duration }
                paths { screenshot }
                tags { id name }
                performers { id name }
              }
            }
          }`,
          { id: tid }
        );
        setScenes(d.findScenes.scenes);
      } catch (err) {
        console.error("[Watch Later] load error:", err);
        setError(String(err));
      }
    }, []);

    React.useEffect(() => {
      load();
    }, [load]);

    function onRemoved(id) {
      setScenes((prev) => (prev || []).filter((s) => s.id !== id));
    }

    const kofiLink = React.createElement(
      "a",
      {
        className: "watchlater-kofi-link",
        href: KOFI_URL,
        target: "_blank",
        rel: "noopener noreferrer",
        title: "Support this plugin",
      },
      "☕ Buy me a coffee"
    );

    const feedbackLink = React.createElement(
      "a",
      {
        className: "watchlater-kofi-link",
        href: FEEDBACK_URL,
        target: "_blank",
        rel: "noopener noreferrer",
        title: "Suggest a feature or report a bug",
      },
      "💡 Suggest a feature"
    );

    const pageLinks = React.createElement(
      "div",
      { className: "watchlater-page-links" },
      feedbackLink,
      kofiLink
    );

    if (error) {
      return React.createElement(
        "div",
        { className: "watchlater-page" },
        React.createElement("h3", null, "Watch Later"),
        React.createElement("p", { className: "text-danger" }, "Error: " + error)
      );
    }

    if (scenes === null) {
      return React.createElement(
        "div",
        { className: "watchlater-page" },
        React.createElement("h3", null, "Watch Later"),
        React.createElement("p", null, "Loading…")
      );
    }

    return React.createElement(
      "div",
      { className: "watchlater-page" },
      React.createElement(
        "div",
        { className: "watchlater-page-header" },
        React.createElement("h3", null, `Watch Later (${scenes.length})`),
        pageLinks
      ),
      scenes.length === 0
        ? React.createElement(
            "p",
            null,
            "Empty for now. Click the bookmark icon on a scene to add it here."
          )
        : React.createElement(
            "div",
            { className: "watchlater-list" },
            scenes.map((s) =>
              React.createElement(WatchLaterCard, {
                key: s.id,
                scene: s,
                onRemoved,
              })
            )
          )
    );
  }

  register.route("/plugin/watchlater", WatchLaterPage);

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
              className: "nav-utility watchlater-nav-link",
              to: "/plugin/watchlater",
              title: "Watch Later",
            },
            React.createElement(
              "button",
              { className: "minimal d-flex align-items-center h-100" },
              "🔖"
            )
          )
        ),
      },
    ];
  });
})();
