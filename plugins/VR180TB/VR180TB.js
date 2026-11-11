// SPDX-License-Identifier: AGPL-3.0-only

(() => {
  "use strict";

  const PluginApi = window.PluginApi;

  if (!PluginApi?.Event) {
    return;
  }

  const PLAYER_ID = "VideoJsPlayer";
  const LR_TYPE = "180 LR";
  const TB_TYPE = "180 TB";

  const EPSILON = 0.0001;
  const PLAYER_WAIT_MS = 10000;
  const REMAP_DELAYS_MS = [0, 16, 50, 150, 400];

  function nearlyEqual(a, b) {
    return Math.abs(a - b) <= EPSILON;
  }

  function getUVBounds(uv) {
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;

    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i);
      const v = uv.getY(i);

      minU = Math.min(minU, u);
      maxU = Math.max(maxU, u);
      minV = Math.min(minV, v);
      maxV = Math.max(maxV, v);
    }

    return { minU, maxU, minV, maxV };
  }

  function isLRLeft(bounds) {
    return (
      nearlyEqual(bounds.minU, 0) &&
      nearlyEqual(bounds.maxU, 0.5) &&
      nearlyEqual(bounds.minV, 0) &&
      nearlyEqual(bounds.maxV, 1)
    );
  }

  function isLRRight(bounds) {
    return (
      nearlyEqual(bounds.minU, 0.5) &&
      nearlyEqual(bounds.maxU, 1) &&
      nearlyEqual(bounds.minV, 0) &&
      nearlyEqual(bounds.maxV, 1)
    );
  }

  function isTBLeft(bounds) {
    return (
      nearlyEqual(bounds.minU, 0) &&
      nearlyEqual(bounds.maxU, 1) &&
      nearlyEqual(bounds.minV, 0.5) &&
      nearlyEqual(bounds.maxV, 1)
    );
  }

  function isTBRight(bounds) {
    return (
      nearlyEqual(bounds.minU, 0) &&
      nearlyEqual(bounds.maxU, 1) &&
      nearlyEqual(bounds.minV, 0) &&
      nearlyEqual(bounds.maxV, 0.5)
    );
  }

  function getEyeMeshes(vr) {
    if (vr?.movieScreenLeft?.geometry && vr?.movieScreenRight?.geometry) {
      return {
        left: vr.movieScreenLeft,
        right: vr.movieScreenRight,
      };
    }

    const meshes = vr?.scene?.children?.filter(
      (object) => object?.isMesh && object?.geometry?.attributes?.uv
    );

    if (!meshes || meshes.length !== 2) {
      return null;
    }

    // videojs-vr uses layer 1 (mask 2) for the left eye and
    // layer 2 (mask 4) for the right eye.
    const left = meshes.find((mesh) => mesh.layers?.mask === 2) ?? meshes[0];
    const right = meshes.find((mesh) => mesh.layers?.mask === 4) ?? meshes[1];

    return { left, right };
  }

  function remap180LRtoTB(vr) {
    const eyes = getEyeMeshes(vr);

    if (!eyes) {
      return false;
    }

    const leftUV = eyes.left.geometry?.attributes?.uv;
    const rightUV = eyes.right.geometry?.attributes?.uv;

    if (!leftUV || !rightUV) {
      return false;
    }

    const leftBounds = getUVBounds(leftUV);
    const rightBounds = getUVBounds(rightUV);

    // Already converted. Keeping this idempotent makes delayed retries safe.
    if (isTBLeft(leftBounds) && isTBRight(rightBounds)) {
      return true;
    }

    // Only modify the exact 180 LR layout Stash/videojs-vr currently creates.
    // If those internals change, leave the geometry untouched rather than
    // applying a potentially destructive transform.
    if (!isLRLeft(leftBounds) || !isLRRight(rightBounds)) {
      return false;
    }

    // Left eye:
    //   LR source U 0..0.5, V 0..1
    //   TB source U 0..1,   V 0.5..1
    for (let i = 0; i < leftUV.count; i++) {
      const u = leftUV.getX(i);
      const v = leftUV.getY(i);

      leftUV.setXY(i, u * 2, 0.5 + v * 0.5);
    }
    leftUV.needsUpdate = true;

    // Right eye:
    //   LR source U 0.5..1, V 0..1
    //   TB source U 0..1,   V 0..0.5
    for (let i = 0; i < rightUV.count; i++) {
      const u = rightUV.getX(i);
      const v = rightUV.getY(i);

      rightUV.setXY(i, (u - 0.5) * 2, v * 0.5);
    }
    rightUV.needsUpdate = true;

    return true;
  }

  function scheduleTBRemap(player, vrMenu) {
    const vr = player?.vr?.();

    if (!vr) {
      return;
    }

    for (const delay of REMAP_DELAYS_MS) {
      window.setTimeout(() => {
        // Do not let a delayed retry modify a projection the user selected
        // after leaving 180 TB.
        if (vrMenu?.menu?.selectedType !== TB_TYPE) {
          return;
        }

        remap180LRtoTB(vr);
      }, delay);
    }
  }

  function addTBMenuItem(vrMenu) {
    const menu = vrMenu?.menu;

    if (!menu?.items?.length || typeof menu.update !== "function") {
      return false;
    }

    if (menu.items.some((item) => item?.type === TB_TYPE)) {
      return true;
    }

    const ExistingMenuItem = menu.items[0]?.constructor;

    if (
      typeof ExistingMenuItem !== "function" ||
      typeof menu.onSelected !== "function"
    ) {
      return false;
    }

    // Reuse Stash's own VRMenuItem implementation so 180 TB looks and behaves
    // like the built-in projection choices.
    const tbItem = new ExistingMenuItem(menu, TB_TYPE);

    tbItem.on("selected", () => {
      menu.onSelected(tbItem);
    });

    const lrIndex = menu.items.findIndex((item) => item?.type === LR_TYPE);
    const insertAt = lrIndex >= 0 ? lrIndex + 1 : 1;

    menu.items.splice(insertAt, 0, tbItem);
    menu.update();

    return true;
  }

  function patchPlayer(player) {
    if (!player || typeof player.vr !== "function" || typeof player.vrMenu !== "function") {
      return false;
    }

    /*
     * Initialization order matters here.
     *
     * Initializing videojs-vr before Stash's vrMenu wrapper is the order that
     * produces correct 180 TB playback with the current Stash/videojs-vr
     * combination. Do not reorder these calls without retesting.
     */
    player.vr();
    const vrMenu = player.vrMenu();

    if (!vrMenu) {
      return false;
    }

    if (!vrMenu.__vr180tbPatched) {
      if (typeof vrMenu.loadVR !== "function") {
        return false;
      }

      const originalLoadVR = vrMenu.loadVR.bind(vrMenu);

      vrMenu.loadVR = function vr180tbLoadVR(type) {
        if (type !== TB_TYPE) {
          return originalLoadVR(type);
        }

        // Build the native 180 LR hemisphere pair, then repack its UVs as TB.
        const result = originalLoadVR(LR_TYPE);
        scheduleTBRemap(player, vrMenu);

        return result;
      };

      vrMenu.__vr180tbPatched = true;
    }

    return addTBMenuItem(vrMenu);
  }

  function getPlayer() {
    return document.getElementById(PLAYER_ID)?.player ?? null;
  }

  function patchScenePlayerWhenReady() {
    const deadline = performance.now() + PLAYER_WAIT_MS;

    const attempt = () => {
      const player = getPlayer();

      if (player && patchPlayer(player)) {
        return;
      }

      if (performance.now() < deadline) {
        window.requestAnimationFrame(attempt);
      }
    };

    attempt();
  }

  function isScenePath(pathname) {
    return /^\/scenes\/\d+(?:\/|$)/.test(pathname);
  }

  PluginApi.Event.addEventListener("stash:location", (event) => {
    const pathname = event?.detail?.data?.location?.pathname;

    if (pathname && isScenePath(pathname)) {
      patchScenePlayerWhenReady();
    }
  });

  // The plugin may load after the initial navigation event has already fired.
  if (isScenePath(window.location.pathname)) {
    patchScenePlayerWhenReady();
  }
})();
