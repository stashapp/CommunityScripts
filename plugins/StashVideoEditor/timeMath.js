// timeMath.js
// Pure helpers for the lossless/precision trim in/out range. No DOM, no Stash.
(function (root) {
  "use strict";

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Seconds → "M:SS" (or "H:MM:SS" past an hour). Floors fractional seconds.
  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    var total = Math.floor(seconds);
    var s = total % 60;
    var m = Math.floor(total / 60) % 60;
    var h = Math.floor(total / 3600);
    var ss = s < 10 ? "0" + s : "" + s;
    if (h > 0) {
      var mm = m < 10 ? "0" + m : "" + m;
      return h + ":" + mm + ":" + ss;
    }
    return m + ":" + ss;
  }

  // Is [inT, outT] a usable trim range? Returns {valid, reason} so the UI can
  // both gate the submit button and explain why it's disabled.
  function validateRange(inT, outT, duration, minLen) {
    if (![inT, outT, duration].every(isFinite)) {
      return { valid: false, reason: "In/out points are not set." };
    }
    if (inT < 0 || outT > duration) {
      return { valid: false, reason: "Range must lie within the clip." };
    }
    if (inT >= outT) {
      return { valid: false, reason: "In point must come before out point." };
    }
    if (outT - inT < minLen) {
      return { valid: false, reason: "Selection is shorter than the minimum length." };
    }
    return { valid: true, reason: "" };
  }

  // Move the in-handle to time `t`, clamped into [0, out - minLen] — the in-point
  // can never reach or cross the out-point (out stays put). Used by the draggable
  // in-bar and the "Set In @ playhead" button alike.
  function clampIn(range, t, duration, minLen) {
    return { in: clamp(t, 0, Math.max(0, range.out - minLen)), out: range.out };
  }

  // Move the out-handle to time `t`, clamped into [in + minLen, duration].
  function clampOut(range, t, duration, minLen) {
    return { in: range.in, out: clamp(t, Math.min(duration, range.in + minLen), duration) };
  }

  var api = { formatTime: formatTime, validateRange: validateRange,
              clampIn: clampIn, clampOut: clampOut, clamp: clamp };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.SVETimeMath = api;
})(typeof window !== "undefined" ? window : null);
