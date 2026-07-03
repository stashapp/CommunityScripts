(function () {
  "use strict";

  // Entry point. Stash loads this file in the main UI bundle (see
  // ui.javascript in plugin.yml). The PluginApi object is what Stash exposes
  // to plugins: React, ReactDOM, react-bootstrap, react-router-dom, an Apollo
  // GraphQL client and a tiny patch/register API.
  function bootstrap() {
    const api = window.PluginApi;
    if (!api) {
      // Stash is still hydrating. Try again shortly.
      window.setTimeout(bootstrap, 250);
      return;
    }
    const React = api.React;
    const NS = window.StashMetrics;
    if (!NS || !NS.dashboard) {
      // Our other JS files haven't loaded yet (script ordering is not
      // guaranteed across Stash versions). Wait a tick and retry.
      window.setTimeout(bootstrap, 200);
      return;
    }

    // ---- Custom route /plugins/metrics
    const MetricsPage = function () {
      const ref = React.useRef(null);
      React.useEffect(function () {
        if (ref.current) NS.dashboard.mount(ref.current);
      }, []);
      return React.createElement("div", { ref, className: "metrics-page-host" });
    };

    if (api.register && api.register.route) {
      api.register.route("/plugins/metrics", MetricsPage);
    } else if (api.routes && typeof api.routes.add === "function") {
      api.routes.add("/plugins/metrics", MetricsPage);
    }

    // ---- Navigation entry — patch the main nav. Stash's PluginApi has
    // shifted patch points across versions; we try the documented one first
    // and fall back to wiring directly into the existing nav DOM.
    const navItem = function () {
      const ReactRouterDOM = api.libraries && api.libraries.ReactRouterDOM;
      if (!ReactRouterDOM) return null;
      return React.createElement(
        ReactRouterDOM.NavLink,
        { to: "/plugins/metrics", className: "nav-utility nav-link", title: "Library Metrics" },
        React.createElement(
          "span",
          { className: "btn btn-primary", style: { background: "#4f8ef7", border: "none" } },
          "Metrics"
        )
      );
    };

    const patched = (function () {
      if (!api.patch || !api.patch.before) return false;
      try {
        api.patch.before("MainNavBar.UtilityItems", function (props) {
          return [{
            children: React.createElement(
              React.Fragment, null,
              props.children,
              navItem()
            ),
          }];
        });
        return true;
      } catch (e) {
        return false;
      }
    })();

    if (!patched) {
      // Fallback: inject a button into the nav once the DOM is ready.
      const tryInject = function () {
        const utility = document.querySelector(".navbar .navbar-buttons, .navbar-utility, .main-nav-utility");
        if (!utility || utility.querySelector(".metrics-nav-link")) return;
        const a = document.createElement("a");
        a.className = "btn btn-primary metrics-nav-link";
        a.style.marginLeft = "8px";
        a.textContent = "Metrics";
        a.href = "/plugins/metrics";
        a.addEventListener("click", function (ev) {
          ev.preventDefault();
          window.location.hash = "/plugins/metrics";
        });
        utility.appendChild(a);
      };
      tryInject();
      // Re-run periodically — Stash re-renders the navbar after auth and
      // on theme switches.
      const observer = new MutationObserver(tryInject);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // ---- Enhance the built-in /stats page with a "Open full Metrics
    // dashboard" CTA so users discover the plugin.
    if (api.patch && api.patch.after) {
      try {
        api.patch.after("Stats", function (props, value) {
          const ReactRouterDOM = api.libraries && api.libraries.ReactRouterDOM;
          if (!ReactRouterDOM) return value;
          return [React.createElement(
            React.Fragment, null,
            value,
            React.createElement(
              "div", { className: "metrics-stats-cta" },
              React.createElement(
                ReactRouterDOM.Link,
                { to: "/plugins/metrics", className: "btn btn-primary" },
                "Open full Metrics dashboard →"
              )
            )
          )];
        });
      } catch (e) { /* ignore */ }
    }
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    bootstrap();
  } else {
    document.addEventListener("DOMContentLoaded", bootstrap);
  }
})();
