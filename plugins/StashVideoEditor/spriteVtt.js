// spriteVtt.js
// Parse Stash's scene sprite WebVTT (the hover-scrubber thumbnails) so the trim
// timeline can reuse the already-generated sprite sheet as a filmstrip. Pure: no
// DOM, no network. The caller fetches paths.vtt text and the sprite image.
(function (root) {
  "use strict";

  // "HH:MM:SS.mmm" or "MM:SS.mmm" → seconds.
  function parseTimestamp(s) {
    var parts = s.trim().split(":");
    if (parts.length < 2 || parts.length > 3) return NaN;
    var sec = 0;
    for (var i = 0; i < parts.length; i++) sec = sec * 60 + parseFloat(parts[i]);
    return sec;
  }

  // Parse cues of the form:
  //   00:00:05.000 --> 00:00:10.000
  //   <sprite-url>#xywh=160,0,160,90
  // Cues without an #xywh fragment are skipped (not sprite tiles).
  function parseSpriteVTT(text) {
    var cues = [];
    if (!text) return cues;
    var lines = text.replace(/\r/g, "").split("\n");
    for (var i = 0; i < lines.length; i++) {
      var arrow = lines[i].indexOf("-->");
      if (arrow < 0) continue;
      var times = lines[i].split("-->");
      var start = parseTimestamp(times[0]);
      var end = parseTimestamp(times[1]);
      var payload = (lines[i + 1] || "").trim();
      var hashAt = payload.indexOf("#xywh=");
      if (hashAt < 0 || !isFinite(start) || !isFinite(end)) continue;
      var url = payload.slice(0, hashAt);
      var nums = payload.slice(hashAt + 6).split(",").map(Number);
      if (nums.length < 4 || nums.some(function (n) { return !isFinite(n); })) continue;
      cues.push({ start: start, end: end, url: url,
                  x: nums[0], y: nums[1], w: nums[2], h: nums[3] });
    }
    return cues;
  }

  // Full sprite-sheet pixel size, derived from tile extents (no image load needed).
  function spriteSheetSize(cues) {
    var w = 0, h = 0;
    for (var i = 0; i < cues.length; i++) {
      if (cues[i].x + cues[i].w > w) w = cues[i].x + cues[i].w;
      if (cues[i].y + cues[i].h > h) h = cues[i].y + cues[i].h;
    }
    return { w: w, h: h };
  }

  // Tile whose range covers time t; clamps to the first/last tile out of range.
  function cueAt(cues, t) {
    if (!cues || !cues.length) return null;
    if (t <= cues[0].start) return cues[0];
    if (t >= cues[cues.length - 1].end) return cues[cues.length - 1];
    for (var i = 0; i < cues.length; i++) {
      if (t >= cues[i].start && t < cues[i].end) return cues[i];
    }
    return cues[cues.length - 1];
  }

  var api = { parseSpriteVTT: parseSpriteVTT, spriteSheetSize: spriteSheetSize, cueAt: cueAt };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.SVESpriteVtt = api;
})(typeof window !== "undefined" ? window : null);
