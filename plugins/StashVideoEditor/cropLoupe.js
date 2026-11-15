// cropLoupe.js
// Geometry for the crop modal's magnifier ("loupe"): which source pixels to sample
// for the edge being dragged, where to park the panel, and what to print under it.
//
// Why this exists: the stage is a fixed 720x405 box and the video is drawn
// object-fit: contain, so a 1080p source renders at 0.375x — one screen pixel of
// drag is ~2.7 source pixels, and the crop box's own dimming overlay darkens the
// letterbox bars you are trying to find. Nothing on that stage can tell you where
// a bar actually ends. The loupe shows the edge at 1:1 source resolution with no
// dimming, so it can.
//
// All functions are pure. Two coordinate systems are in play:
//   container px — CSS pixels inside .sve-stage (what `box` and `rendered` use)
//   source px    — the video's own pixels (what the crop sent to ffmpeg uses)
(function (root) {
  "use strict";

  const cropMath = (typeof module !== "undefined" && module.exports)
    ? require("./cropMath.js")
    : root.SVECropMath;

  // Nudge steps are EVEN on purpose. rectToSourceCrop runs every edge through
  // evenRound (h.264 needs even dimensions), which rounds down to even — so an odd
  // step would land on the same even value half the time and the key press would
  // appear to do nothing. Two source pixels is the real resolution of this control.
  const NUDGE_STEP = 2;
  const NUDGE_STEP_COARSE = 10;

  const GAP = 12; // px between the dragged edge and the loupe panel

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Which edges a handle owns, and which side of each keeps content.
  // `dir` points AWAY from the box interior — the loupe goes that way, so it never
  // covers the content you are framing (only the region being cropped off).
  const HANDLES = {
    n:  { edges: { t: true },           dir: { x:  0, y: -1 } },
    s:  { edges: { b: true },           dir: { x:  0, y:  1 } },
    w:  { edges: { l: true },           dir: { x: -1, y:  0 } },
    e:  { edges: { r: true },           dir: { x:  1, y:  0 } },
    nw: { edges: { l: true, t: true },  dir: { x: -1, y: -1 } },
    ne: { edges: { r: true, t: true },  dir: { x:  1, y: -1 } },
    sw: { edges: { l: true, b: true },  dir: { x: -1, y:  1 } },
    se: { edges: { r: true, b: true },  dir: { x:  1, y:  1 } },
  };

  function hasLoupe(handle) { return !!HANDLES[handle]; }

  // The point on the crop box that `handle` drags, in container px.
  function anchorPoint(box, handle) {
    const h = HANDLES[handle];
    if (!h) return null;
    const e = h.edges;
    return {
      x: e.l ? box.x : (e.r ? box.x + box.w : box.x + box.w / 2),
      y: e.t ? box.y : (e.b ? box.y + box.h : box.y + box.h / 2),
    };
  }

  // The source-pixel window to draw into the loupe, plus where the crop edge falls
  // inside it. Normally 1:1 (one source pixel per loupe pixel); the window clamps to
  // the frame near its borders, which slides the hairline off centre rather than
  // showing pixels that do not exist. A source smaller than the loupe scales up.
  //
  // Returns { src:{x,y,w,h}, scaleX, scaleY, hair:{x,y}, keep:{x,y} } in loupe px,
  // where `hair` coordinates are null on an axis the handle does not move and `keep`
  // names the side of the hairline that survives the crop.
  function loupeSample(box, handle, rendered, natural, loupe) {
    const h = HANDLES[handle];
    if (!h) return null;
    const a = anchorPoint(box, handle);
    const scale = natural.w / rendered.w; // rendered preserves aspect: one scale for both axes
    const ax = (a.x - rendered.x) * scale;
    const ay = (a.y - rendered.y) * scale;

    const sw = Math.min(loupe.w, natural.w);
    const sh = Math.min(loupe.h, natural.h);
    const sx = Math.round(clamp(ax - sw / 2, 0, natural.w - sw));
    const sy = Math.round(clamp(ay - sh / 2, 0, natural.h - sh));
    const scaleX = loupe.w / sw;
    const scaleY = loupe.h / sh;

    const e = h.edges;
    return {
      src: { x: sx, y: sy, w: sw, h: sh },
      scaleX: scaleX,
      scaleY: scaleY,
      hair: {
        x: (e.l || e.r) ? Math.round((ax - sx) * scaleX) : null,
        y: (e.t || e.b) ? Math.round((ay - sy) * scaleY) : null,
      },
      keep: {
        x: e.l ? "right" : (e.r ? "left" : null),
        y: e.t ? "below" : (e.b ? "above" : null),
      },
    };
  }

  // Where to put the panel inside the stage. It sits on the far side of the edge
  // being dragged, flipping to the near side when that would run off the stage, and
  // is finally clamped so it is always fully visible.
  function loupePlacement(box, handle, container, loupe, gap) {
    const h = HANDLES[handle];
    if (!h) return null;
    if (gap == null) gap = GAP;
    const a = anchorPoint(box, handle);
    const d = h.dir;

    let left = d.x === 0 ? a.x - loupe.w / 2 : (d.x < 0 ? a.x - gap - loupe.w : a.x + gap);
    let top = d.y === 0 ? a.y - loupe.h / 2 : (d.y < 0 ? a.y - gap - loupe.h : a.y + gap);

    if (d.x < 0 && left < 0) left = a.x + gap;
    if (d.x > 0 && left + loupe.w > container.w) left = a.x - gap - loupe.w;
    if (d.y < 0 && top < 0) top = a.y + gap;
    if (d.y > 0 && top + loupe.h > container.h) top = a.y - gap - loupe.h;

    return {
      left: clamp(left, 0, Math.max(0, container.w - loupe.w)),
      top: clamp(top, 0, Math.max(0, container.h - loupe.h)),
    };
  }

  // The edge's position in source pixels, and how many pixels that edge removes.
  // Derived from rectToSourceCrop so the caption can never disagree with the crop
  // actually handed to ffmpeg — including its even-number rounding.
  function edgeReadout(box, handle, rendered, natural) {
    const h = HANDLES[handle];
    if (!h) return null;
    const c = cropMath.rectToSourceCrop(box, rendered, natural);
    const e = h.edges;
    let x = null, y = null;
    if (e.l) x = { label: "left", value: c.x, cut: c.x };
    else if (e.r) x = { label: "right", value: c.x + c.width, cut: natural.w - (c.x + c.width) };
    if (e.t) y = { label: "top", value: c.y, cut: c.y };
    else if (e.b) y = { label: "bottom", value: c.y + c.height, cut: natural.h - (c.y + c.height) };
    return { x: x, y: y };
  }

  // Compact caption text. A corner moves two edges, so it drops the "cut" figures
  // rather than overflow the panel. Naming the direction ("cut 138px above") is what
  // makes the readout answer "which side of the bar actually goes?" on its own.
  const CUT_SIDE = { top: "above", bottom: "below", left: "left", right: "right" };
  function formatReadout(r) {
    if (!r) return "";
    if (r.x && r.y) return "x " + r.x.value + " · y " + r.y.value;
    const p = r.x || r.y;
    if (!p) return "";
    const axis = r.x ? "x" : "y";
    return p.label + " " + axis + " " + p.value + " · cut " + p.cut + "px " + CUT_SIDE[p.label];
  }

  // Where to paint the "this is being removed" marks, in loupe px.
  //
  // Everything goes on the REMOVED side so the kept pixels are never painted over —
  // the whole point is to judge the first surviving row of real content. `wash` covers
  // the entire doomed region (not a token band, so the answer is unmissable) and `line`
  // is the single pixel row/column at the boundary, which side depends on the edge:
  // a crop's y is the first KEPT row (line goes on y-1), while y+height is the first
  // REMOVED row (line goes on it).
  function cutBands(s, loupe) {
    const washes = [], lines = [];
    if (s.hair.y != null) {
      if (s.keep.y === "below") { // removed region is above the boundary
        washes.push({ x: 0, y: 0, w: loupe.w, h: s.hair.y });
        lines.push({ x: 0, y: Math.max(0, s.hair.y - 1), w: loupe.w, h: 1 });
      } else {
        washes.push({ x: 0, y: s.hair.y, w: loupe.w, h: loupe.h - s.hair.y });
        lines.push({ x: 0, y: Math.min(loupe.h - 1, s.hair.y), w: loupe.w, h: 1 });
      }
    }
    if (s.hair.x != null) {
      if (s.keep.x === "right") { // removed region is left of the boundary
        washes.push({ x: 0, y: 0, w: s.hair.x, h: loupe.h });
        lines.push({ x: Math.max(0, s.hair.x - 1), y: 0, w: 1, h: loupe.h });
      } else {
        washes.push({ x: s.hair.x, y: 0, w: loupe.w - s.hair.x, h: loupe.h });
        lines.push({ x: Math.min(loupe.w - 1, s.hair.x), y: 0, w: 1, h: loupe.h });
      }
    }
    return { washes: washes, lines: lines };
  }

  // Arrow-key nudge, in source px. Returns null for keys we do not handle so the
  // caller can leave the event alone.
  function nudgeDelta(key, shift) {
    const step = shift ? NUDGE_STEP_COARSE : NUDGE_STEP;
    switch (key) {
      case "ArrowUp": return { dx: 0, dy: -step };
      case "ArrowDown": return { dx: 0, dy: step };
      case "ArrowLeft": return { dx: -step, dy: 0 };
      case "ArrowRight": return { dx: step, dy: 0 };
      default: return null;
    }
  }

  const api = {
    NUDGE_STEP: NUDGE_STEP, NUDGE_STEP_COARSE: NUDGE_STEP_COARSE,
    hasLoupe: hasLoupe, anchorPoint: anchorPoint, loupeSample: loupeSample,
    loupePlacement: loupePlacement, edgeReadout: edgeReadout,
    formatReadout: formatReadout, cutBands: cutBands, nudgeDelta: nudgeDelta,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.SVECropLoupe = api;
})(typeof window !== "undefined" ? window : null);
