// playability.js
// Deciding whether the editor can work with what the <video> element received.
//
// The modal loads a scene's DIRECT stream (/scene/:id/stream) because the crop
// box is drawn against the source's own pixels. If the browser has no decoder
// for that codec — mpeg4, hevc, some vp9 — the element renders nothing and the
// stage sits empty. Stash's own player hides this by falling back to a
// server-side transcode, so the file "plays fine" everywhere else, which makes
// a silent blank editor especially confusing. These helpers turn that into a
// stated reason.
(function (root) {
  "use strict";

  // MediaError codes. 1/2 are transient (aborted, network); 3/4 mean the bytes
  // arrived and the browser could not make video out of them.
  const MEDIA_ERR_DECODE = 3;
  const MEDIA_ERR_SRC_NOT_SUPPORTED = 4;

  const UNPLAYABLE =
    "This file can't be edited here — your browser has no decoder for its " +
    "video, so the editor can't show or measure frames. (Stash still plays it " +
    "by transcoding on the fly, which is why it looks fine elsewhere.) " +
    "Convert it to H.264/MP4 first, then reopen this editor.";

  // A message when the failure means the SOURCE is un-editable, or null when the
  // failure is transient — claiming "un-editable" for a dropped connection would
  // send someone off to transcode a file that needs no transcoding.
  function unplayableMessage(mediaError) {
    if (!mediaError || typeof mediaError.code !== "number") return null;
    if (mediaError.code === MEDIA_ERR_DECODE ||
        mediaError.code === MEDIA_ERR_SRC_NOT_SUPPORTED) {
      return UNPLAYABLE;
    }
    return null;
  }

  // Some browsers stall instead of firing `error`, leaving no event to react to.
  // No metadata after the grace period means the same thing in practice.
  function stalledWithoutMetadata(state) {
    const s = state || {};
    if (s.hasMetadata) return false;
    return (s.elapsedMs || 0) > (s.timeoutMs || 0);
  }

  // Same cause, same remedy — one message, so two failure shapes don't have to
  // be told apart to know what to do.
  function stalledMessage() {
    return UNPLAYABLE;
  }

  const api = {
    unplayableMessage: unplayableMessage,
    stalledWithoutMetadata: stalledWithoutMetadata,
    stalledMessage: stalledMessage,
    METADATA_TIMEOUT_MS: 8000,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.SVEPlayability = api;
})(typeof window !== "undefined" ? window : null);
