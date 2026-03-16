(function () {
  // Inject CSS to make scene Details respect newlines
  function injectStyle() {
    if (document.getElementById("scene-better-details-style")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "scene-better-details-style";
    style.type = "text/css";

    style.textContent = `
      /* Affect any pre-formatted details paragraph */
      p.pre {
        white-space: pre-wrap !important; /* preserve newlines, override inline */
      }
    `;

    document.head.appendChild(style);
  }

  function fixInlineStyles() {
    // Some Stash builds set white-space inline on <p class="pre">;
    // override it directly so our line breaks are respected.
    document
      .querySelectorAll("p.pre")
      .forEach((el) => {
        el.style.whiteSpace = "pre-wrap";
      });
  }

  function apply() {
    injectStyle();
    fixInlineStyles();
  }

  function start() {
    apply();

    // Also re-apply on SPA route changes / re-renders
    const observer = new MutationObserver(() => {
      apply();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  // UI plugin return value (not strictly needed, but conventional)
  return {};
})();

