// scene-to-imageclip UI: "Convert to clip" on scene pages, "Convert to scene" on image-clip
// pages. Calls the plugin (scene_to_imageclip.py, which hands the toggle to toggle.py)
// through runPluginOperation. No other plugin needed.
(function () {
  "use strict";
  const PluginApi = window.PluginApi;
  if (!PluginApi) { console.warn("[scene-to-imageclip] PluginApi not ready"); return; }

  // The toggle used to be a separate plugin, clip-scene-toggle. If that plugin is still
  // installed and enabled, its script tag is on the page (Stash adds every enabled plugin's
  // script before any of them runs), and its buttons are already there. Stand down rather
  // than add a second set; the README says to remove the old plugin.
  if (document.querySelector('script[src*="/plugin/clip-scene-toggle/"]')) {
    console.warn("[scene-to-imageclip] the old clip-scene-toggle plugin is enabled; " +
      "its buttons are used instead of these. Remove it to use this plugin's toggle.");
    return;
  }

  const React = PluginApi.React; // core API, safe at load time
  const { useState } = React;

  const PLUGIN_ID = "scene-to-imageclip";
  const IMAGE_MOUNT_ID = "s2i-image-toggle-mount";
  const MUTATION = "mutation($id:ID!,$args:Map!){ runPluginOperation(plugin_id:$id, args:$args) }";
  const LABELS = { to_clip: "Convert to clip", to_scene: "Convert to scene" };

  // Stash serves its UI under a path prefix when it runs behind a reverse proxy; the
  // prefix is in <base href>. Every URL the plugin builds starts from it.
  function basePath() {
    const el = document.querySelector("base");
    let href = (el && el.getAttribute("href")) || "/";
    try { href = new URL(href, window.location.origin).pathname; } catch (e) { href = "/"; }
    return href.endsWith("/") ? href : href + "/";
  }

  function appUrl(rel) {
    return basePath() + rel;
  }

  async function callGQL(query, variables) {
    const res = await fetch(appUrl("graphql"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query, variables: variables }),
    });
    if (!res.ok) throw new Error("http " + res.status);
    const body = await res.json();
    if (body.errors && body.errors.length) throw new Error("graphql error");
    return body.data;
  }

  // runPluginOperation returns the engine's `output` object as-is. Accept a nested
  // {output: {...}} as well so either server shape works.
  function unwrapOutput(data) {
    const raw = data && data.runPluginOperation;
    if (raw && typeof raw === "object" && raw.output && typeof raw.output === "object") return raw.output;
    return raw && typeof raw === "object" ? raw : null;
  }

  async function runToggle(mode, id) {
    return unwrapOutput(await callGQL(MUTATION, { id: PLUGIN_ID, args: { mode: mode, id: String(id) } }));
  }

  function destination(out) {
    return appUrl((out.new_type === "image" ? "images/" : "scenes/") + out.new_id);
  }

  function failureText(out) {
    if (!out) return "no result from the plugin";
    if (out.code) return out.code + (out.message ? ": " + out.message : "");
    return out.message || "conversion failed";
  }

  const NAMES = {
    cover_image: "cover image", captions: "captions", interactive: "interactive",
    galleries: "galleries", groups: "groups", scene_markers: "markers", backup: "saved data",
  };

  function reportText(out) {
    const parts = [];
    const dropped = (out.dropped || []).map(function (d) { return NAMES[d] || d; });
    if (dropped.length) parts.push("Not carried over: " + dropped.join(", ") + ".");
    if (out.warning) parts.push("Warning: " + out.warning + ".");
    return parts.join(" ");
  }

  // The image id is read from the URL when the button is pressed, not when it was built.
  function imageIdFromLocation() {
    const path = window.location.pathname;
    const prefix = basePath() + "images/";
    if (!path.startsWith(prefix)) return null;
    const m = path.slice(prefix.length).match(/^(\d+)(?:\/|$)/);
    return m ? m[1] : null;
  }

  function isClipPage() {
    return !!document.querySelector("video.image-image"); // clips only; stills render <img>
  }

  function ToggleButton(props) {
    const { Button } = PluginApi.libraries.Bootstrap; // lazy: ready at render, not at load
    const [state, setState] = useState("idle"); // idle | busy | failed | done
    const [message, setMessage] = useState("");
    const [target, setTarget] = useState(null);

    const onClick = async () => {
      let id = props.id;
      if (props.mode === "to_scene") {
        id = imageIdFromLocation();
        if (!id || !isClipPage()) {
          setMessage("page changed; reload and try again");
          setState("failed");
          return;
        }
      }
      setState("busy");
      setMessage("");
      let out = null;
      try {
        out = await runToggle(props.mode, id);
      } catch (err) {
        console.error("[scene-to-imageclip] request failed", err);
        setMessage("request failed");
        setState("failed");
        return;
      }
      if (out && out.ok === true && out.new_id) {
        const report = reportText(out);
        if (!report) {
          window.location.assign(destination(out));
          return;
        }
        console.warn("[scene-to-imageclip] converted with notes:", out.dropped, out.warning || "");
        setTarget(destination(out));
        setMessage(report);
        setState("done");
        return;
      }
      setMessage(failureText(out));
      setState("failed");
    };

    let button;
    if (state === "done") {
      const label = props.mode === "to_clip" ? "Open the new clip" : "Open the new scene";
      button = React.createElement(Button, {
        variant: "primary", className: "s2i-toggle-btn",
        onClick: function () { window.location.assign(target); },
      }, label);
    } else {
      const label = state === "busy" ? "Converting…" : state === "failed" ? "Convert failed" : LABELS[props.mode];
      button = React.createElement(Button, {
        variant: "secondary",
        className: "s2i-toggle-btn" + (props.mode === "to_clip" ? " s2i-scene-btn" : ""),
        disabled: state === "busy", onClick: onClick,
      }, label);
    }
    const msgClass = "s2i-toggle-msg " + (state === "done" ? "text-warning" : "text-danger");
    const msg = message ? React.createElement("span", { className: msgClass }, message) : null;
    // Scene page: no wrapper, so the button sits beside other plugins' buttons.
    if (props.mode === "to_clip") return React.createElement(React.Fragment, null, button, msg);
    return React.createElement("span", { className: "s2i-toggle" }, button, msg);
  }

  function removeImageMount() {
    const el = document.getElementById(IMAGE_MOUNT_ID);
    if (!el) return;
    PluginApi.ReactDOM.unmountComponentAtNode(el);
    el.remove();
  }

  // One check: a button on an image-clip page, none anywhere else.
  function syncImageButton() {
    const imageId = imageIdFromLocation();
    const toolbar = document.querySelector(".image-toolbar");
    const existing = document.getElementById(IMAGE_MOUNT_ID);
    if (!imageId || !isClipPage() || !toolbar) {
      if (existing) removeImageMount();
      return;
    }
    if (existing && toolbar.contains(existing) && existing.dataset.imageId === imageId) return;
    if (existing) removeImageMount();
    const mount = document.createElement("span");
    mount.id = IMAGE_MOUNT_ID;
    mount.className = "image-toolbar-group";
    mount.dataset.imageId = imageId;
    toolbar.appendChild(mount);
    PluginApi.ReactDOM.render(React.createElement(ToggleButton, { mode: "to_scene" }), mount);
  }

  // On an image page, watch the page for changes (the video and toolbar render late, and
  // the toolbar can be rebuilt) and re-check after each burst. Off image pages, nothing runs.
  let observer = null;
  let pending = false;
  function scheduleSync() {
    if (pending) return;
    pending = true;
    setTimeout(function () { pending = false; syncImageButton(); }, 50);
  }

  function onLocation() {
    if (!imageIdFromLocation()) {
      if (observer) { observer.disconnect(); observer = null; }
      removeImageMount();
      return;
    }
    if (!observer) {
      observer = new MutationObserver(scheduleSync);
      observer.observe(document.getElementById("root") || document.body, { childList: true, subtree: true });
    }
    scheduleSync();
  }

  // Guard registration so a plugin error can never block Stash's UI bootstrap.
  try {
    PluginApi.patch.before("ScenePage.TabContent", function (props) {
      const sceneId = props.scene && props.scene.id;
      if (!sceneId) return [props];
      let children = Array.isArray(props.children) ? props.children.slice() : [props.children];
      // Another plugin's earlier patch may return a Fragment; flatten it so ours lands after its buttons.
      if (children.length === 1 && children[0] && children[0].type === React.Fragment) {
        const inner = children[0].props.children;
        children = Array.isArray(inner) ? inner.slice() : [inner];
      }
      children.push(React.createElement(ToggleButton, { key: "s2i-toggle-btn-" + sceneId, mode: "to_clip", id: sceneId }));
      return [{ ...props, children: React.createElement(React.Fragment, null, ...children) }];
    });
    PluginApi.Event.addEventListener("stash:location", onLocation);
    onLocation();
    console.log("[scene-to-imageclip] loaded");
  } catch (e) {
    console.error("[scene-to-imageclip] registration failed (UI unaffected)", e);
  }
})();
