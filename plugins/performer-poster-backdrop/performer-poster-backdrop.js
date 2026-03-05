(function () {
  const HERO_CLASS = "pb-hero";
  const PLUGIN_ID = "performer-poster-backdrop";

  // HARD DEFAULTS (used when fields are blank)
  const DEFAULTS = {
    opacity: 1,   // 0..1
    blur: 10,     // px
    y: 20,        // %
  };

  let opacity = DEFAULTS.opacity;
  let blur = DEFAULTS.blur;
  let defaultY = DEFAULTS.y;
  let overrides = new Map();

  let lastSettingsFetch = 0;

  const isBlank = (v) =>
    v === null || v === undefined || String(v).trim() === "";

  function isPerformerRoute() {
    return /^\/performers\/\d+/.test(location.pathname);
  }

  function getPerformerIdFromPath() {
    const m = location.pathname.match(/^\/performers\/(\d+)/);
    return m ? String(Number(m[1])) : null;
  }

  function getHeader() {
    return document.querySelector("#performer-page .detail-header.full-width");
  }

  function getStickyHeader() {
    return document.querySelector("#performer-page .sticky.detail-header");
  }

  function getPosterImg() {
    return (
      document.querySelector("#performer-page .detail-header-image img.performer") ||
      document.querySelector("#performer-page img.performer")
    );
  }

  function clamp(n, min, max, fallback) {
    const x = Number(n);
    if (!Number.isFinite(x)) return fallback;
    return Math.min(max, Math.max(min, x));
  }

  // COMMA-SEPARATED overrides: "142:35, 219:20"
  function parseOverrides(text) {
    const map = new Map();
    if (isBlank(text)) return map;

    text.split(",").forEach((chunk) => {
      const s = chunk.trim();
      if (!s) return;

      // Accept 142:35, 142-35, 142=35
      const m = s.match(/^(\d+)\s*[:=-]\s*(\d{1,3})$/);
      if (!m) return;

      const id = String(Number(m[1]));
      const pct = clamp(m[2], 0, 100, DEFAULTS.y);
      map.set(id, pct);
    });

    return map;
  }

  function removeHero(el) {
    el?.querySelector("." + HERO_CLASS)?.remove();
  }

  function upsertHero(header, url) {
    let hero = header.querySelector("." + HERO_CLASS);
    if (!hero) {
      hero = document.createElement("div");
      hero.className = HERO_CLASS;
      header.prepend(hero);
    }
    hero.style.backgroundImage = `url("${url}")`;
    return hero;
  }

  function apply(hero) {
    hero.style.setProperty("--pb-opacity", opacity);
    hero.style.setProperty("--pb-blur", `${blur}px`);

    const pid = getPerformerIdFromPath();
    const y = pid && overrides.has(pid) ? overrides.get(pid) : defaultY;
    hero.style.setProperty("--pb-y", `${y}%`);
  }

  async function refreshSettings() {
    if (Date.now() - lastSettingsFetch < 5000) return;
    lastSettingsFetch = Date.now();

    try {
      const res = await fetch("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `{ configuration { plugins } }`,
        }),
      });

      if (!res.ok) return;

      const cfg = (await res.json())
        ?.data?.configuration?.plugins?.[PLUGIN_ID];

      if (!cfg) return;

      opacity = isBlank(cfg.opacity)
        ? DEFAULTS.opacity
        : clamp(cfg.opacity, 0, 1, DEFAULTS.opacity);

      blur = isBlank(cfg.blur)
        ? DEFAULTS.blur
        : clamp(cfg.blur, 0, 100, DEFAULTS.blur);

      defaultY = isBlank(cfg.defaultYOffset)
        ? DEFAULTS.y
        : clamp(cfg.defaultYOffset, 0, 100, DEFAULTS.y);

      overrides = isBlank(cfg.perPerformerOffsets)
        ? new Map()
        : parseOverrides(cfg.perPerformerOffsets);

      const hero = getHeader()?.querySelector("." + HERO_CLASS);
      if (hero) apply(hero);
    } catch {
      // silent fail — plugin should never break UI
    }
  }

  function run() {
    removeHero(getStickyHeader());

    const header = getHeader();
    if (!header || !isPerformerRoute()) return removeHero(header);

    const img = getPosterImg();
    if (!img) return;

    const hero = upsertHero(header, img.currentSrc || img.src);
    apply(hero);
    refreshSettings();
  }

  new MutationObserver(run).observe(document.body, {
    childList: true,
    subtree: true,
  });

  ["load", "resize", "popstate"].forEach((e) =>
    window.addEventListener(e, () => setTimeout(run, 50))
  );

  setTimeout(run, 50);
})();
