// cropMath.js
// Coordinate math adapted from react-easy-crop (helpers.ts),
// https://github.com/ValentinH/react-easy-crop, used under the MIT License:
//
// MIT License
//
// Copyright (c) 2022 Valentin Hervieu
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
(function (root) {
  "use strict";

  function evenRound(n) {
    if (!isFinite(n) || n < 0) return 0;
    // Round DOWN to even — never exceeds source bounds. The small allowance absorbs
    // floating-point error: a value that should be exactly 404 can arrive as
    // 403.99999999999994, and a plain floor would turn it into 402.
    return 2 * Math.floor((n + 1e-6) / 2);
  }

  // object-fit: contain — scale media to fit container, preserving aspect, centered.
  function getRenderedVideoRect(natural, container) {
    const scale = Math.min(container.w / natural.w, container.h / natural.h);
    const w = natural.w * scale;
    const h = natural.h * scale;
    return { x: (container.w - w) / 2, y: (container.h - h) / 2, w: w, h: h };
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Map an on-screen rectangle (container coords) to source-pixel crop, clamped, even.
  function rectToSourceCrop(rectPx, rendered, natural) {
    const scale = natural.w / rendered.w; // rendered is aspect-preserving, so w & h scale equally
    // rectangle relative to the rendered video, in rendered px
    let rx = rectPx.x - rendered.x;
    let ry = rectPx.y - rendered.y;
    let rw = rectPx.w;
    let rh = rectPx.h;
    // clamp to the rendered media box
    const x0 = clamp(rx, 0, rendered.w);
    const y0 = clamp(ry, 0, rendered.h);
    const x1 = clamp(rx + rw, 0, rendered.w);
    const y1 = clamp(ry + rh, 0, rendered.h);
    return {
      x: evenRound(x0 * scale),
      y: evenRound(y0 * scale),
      width: evenRound((x1 - x0) * scale),
      height: evenRound((y1 - y0) * scale),
    };
  }

  // Stretch mode: the on-screen crop region (baseFrame, undistorted) is dragged to a
  // new on-screen size (frame); the baked output is the crop's source pixels scaled by
  // the per-axis distortion ratio. frame == baseFrame ⇒ crop's native size (crop-only).
  function stretchOutputDims(crop, frame, baseFrame) {
    const sx = baseFrame.w > 0 ? frame.w / baseFrame.w : 1;
    const sy = baseFrame.h > 0 ? frame.h / baseFrame.h : 1;
    return {
      width: evenRound(crop.width * sx),
      height: evenRound(crop.height * sy),
    };
  }

  // Which edges each handle moves. Corners move two; edge-handles one; "move" translates.
  const HANDLE_EDGES = {
    nw: { l: true, t: true }, ne: { r: true, t: true },
    sw: { l: true, b: true }, se: { r: true, b: true },
    n: { t: true }, s: { b: true }, w: { l: true }, e: { r: true },
  };

  // Resize/move a box by a drag delta, clamped to `bounds` and a `minSize` floor.
  // box/bounds are {x,y,w,h}; handle is one of move|n|s|e|w|nw|ne|sw|se. Pure.
  function resizeBox(box, handle, dx, dy, bounds, minSize) {
    const bx0 = bounds.x, by0 = bounds.y;
    const bx1 = bounds.x + bounds.w, by1 = bounds.y + bounds.h;
    let l = box.x, t = box.y, r = box.x + box.w, b = box.y + box.h;

    if (handle === "move") {
      // Translate, clamping the shift so the box stays fully inside bounds.
      const sx = clamp(dx, bx0 - l, bx1 - r);
      const sy = clamp(dy, by0 - t, by1 - b);
      l += sx; r += sx; t += sy; b += sy;
      return { x: l, y: t, w: r - l, h: b - t };
    }

    const edges = HANDLE_EDGES[handle] || {};
    if (edges.l) l = clamp(l + dx, bx0, r - minSize);
    if (edges.r) r = clamp(r + dx, l + minSize, bx1);
    if (edges.t) t = clamp(t + dy, by0, b - minSize);
    if (edges.b) b = clamp(b + dy, t + minSize, by1);
    return { x: l, y: t, w: r - l, h: b - t };
  }

  // Find the sharp (high local detail) region of an RGBA frame, treating both black
  // bars (flat) and blurred padding (low detail) as surround. Returns {x,y,w,h} in
  // frame px. A frame with no clear detail boundary falls back to the full frame.
  //
  // Decoupled gradients on purpose: the ROW profile measures HORIZONTAL detail and the
  // COLUMN profile measures VERTICAL detail. This keeps the seam between a bar and the
  // content (a transition along the *other* axis) from bleeding one bar row/col into the
  // detected box. Forward differences (not central) so 1px-fine texture isn't missed.
  function detectSharpContentBox(data, w, h, k) {
    if (k == null) k = 0.15; // relative threshold: content edge = energy >= k * peak
    const lum = new Float64Array(w * h);
    for (let p = 0; p < w * h; p++) {
      const i = p * 4;
      lum[p] = (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const rowE = new Float64Array(h); // mean horizontal gradient per row
    const colE = new Float64Array(w); // mean vertical gradient per column
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x + 1 < w) {
          const gh = Math.abs(lum[y * w + x + 1] - lum[y * w + x]);
          rowE[y] += gh;
        }
        if (y + 1 < h) {
          const gv = Math.abs(lum[(y + 1) * w + x] - lum[y * w + x]);
          colE[x] += gv;
        }
      }
    }

    // Longest CONTIGUOUS run of indices clearing k * peak (fall back to full span if
    // flat). Longest-run, not first-to-last, so a sharp logo/watermark island out in the
    // blurred margin doesn't stretch the box across the blur to swallow it. A small gap
    // tolerance bridges internal low-detail patches within real content without merging a
    // far-off island (the blur between content and logo is much wider than the bridge).
    function span(energy, n) {
      let peak = 0;
      for (let i = 0; i < n; i++) if (energy[i] > peak) peak = energy[i];
      if (peak <= 0) return { lo: 0, hi: n - 1 };
      const t = k * peak;
      const gap = Math.max(1, Math.round(0.04 * n));
      let bestLo = 0, bestHi = -1, bestLen = 0;
      let runLo = -1, gapRun = 0;
      for (let i = 0; i < n; i++) {
        if (energy[i] >= t) {
          if (runLo < 0) runLo = i;
          gapRun = 0;
          const len = i - runLo + 1;
          if (len > bestLen) { bestLen = len; bestLo = runLo; bestHi = i; }
        } else if (runLo >= 0) {
          gapRun++;
          if (gapRun > gap) { runLo = -1; gapRun = 0; } // gap too wide → end the run
        }
      }
      if (bestHi < 0) return { lo: 0, hi: n - 1 };
      return { lo: bestLo, hi: bestHi };
    }
    const ys = span(rowE, h);
    const xs = span(colE, w);
    return { x: xs.lo, y: ys.lo, w: xs.hi - xs.lo + 1, h: ys.hi - ys.lo + 1 };
  }

  const api = { evenRound: evenRound, getRenderedVideoRect: getRenderedVideoRect, rectToSourceCrop: rectToSourceCrop, stretchOutputDims: stretchOutputDims, resizeBox: resizeBox, detectSharpContentBox: detectSharpContentBox };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.SVECropMath = api;
})(typeof window !== "undefined" ? window : null);
