/**
 * Mobile Wall Layout — Stash UI Plugin (display name: scrollFeed)
 * =================================================================
 * Turns the Markers, Images and Scenes wall into a scrollable mobile feed:
 * full-width single-column layout, play-on-visibility, and DOM-ordered
 * video loading so the top of the page is watchable fast on mobile data.
 *
 * Only active on /scenes/markers, /images and /scenes; tears down on
 * navigate-away. The layout CSS applies to touch devices only
 * (pointer: coarse); the video behaviour runs on every device.
 *
 * Architecture
 * ------------
 *   <style> tag          : overrides react-photo-gallery's absolute-
 *                          positioned brick layout with a full-width
 *                          single-column flow on touch devices.
 *   IntersectionObserver : plays each <video> at 0.1 visibility, pauses
 *                          below. Allows 2–3 concurrent playbacks, well
 *                          under iOS Safari's ~20-simultaneous-<video>
 *                          ceiling that this plugin exists to stay under.
 *   Load queue           : DOM-ordered, concurrency-capped (2 in flight).
 *                          Cancels React's src fetches for clips more
 *                          than two screens away and re-issues them
 *                          top-down as they come within reach.
 *                          The queue advances every _LOAD_ADVANCE_MS
 *                          (fallback) or on canplay (wifi-fast path),
 *                          whichever fires first, so a slow clip does
 *                          not hold up the ones behind it.
 *   Near/far observers   : release the decoder and buffer of clips more
 *                          than five screens away, and queue clips for
 *                          loading when they come within two screens.
 *   Stall watchdog       : restarts looping clips that freeze on their
 *                          last frame (seen in Safari).
 *   MutationObserver     : watches <body> for SPA navigation and newly
 *                          rendered videos (Stash fills incrementally).
 *
 * Why the load queue exists
 * -------------------------
 *   Stash renders <video autoPlay src="..."> on every marker card, so
 *   the browser fires N parallel HTTP fetches on page mount. Over a
 *   home-NAS → public-internet → cellular-phone path that's N streams
 *   sharing one slow uplink — the top video is as far from playable as
 *   the bottom one. Clips within two screens of the viewport keep the
 *   src React gave them. Clips further away have their src stripped at
 *   registration (video.load() aborts the in-flight fetch) and restored
 *   top-down through the ordered queue as they come within reach.
 *
 * Retention
 * ---------
 *   react-photo-gallery v8 does NOT virtualize — every photo on the
 *   current page stays in the DOM. A <video>'s downloaded bytes persist
 *   while it stays within five screens of the viewport, so scrolling
 *   back a short way after a network drop resumes instantly. Clips
 *   further away are released to free decoders and memory, and refetch
 *   when they come back within two screens. Stash paginates (min
 *   20/page); page-change resets state by design.
 *
 * Style
 * -----
 *   This file uses ES5 idiom (var, function declarations) for broad
 *   compatibility and because the original pre-scrollFeed plugin did.
 *   The whole file is wrapped in an IIFE to keep its vars and
 *   functions out of the global scope — Stash loads every enabled
 *   UI plugin into the same document, so name collisions between
 *   plugins would otherwise be possible.
 */

(function () {
    'use strict';

    // ── CSS injection: full-width single-column layout on touch devices ───────
    // Stash's wall uses react-photo-gallery, which sets inline position:absolute
    // offsets for a multi-column brick layout. On narrow viewports those offsets
    // cause items to overlap or overflow. A <style> tag with !important beats
    // inline styles regardless of render timing, avoiding the race condition
    // that direct JS style manipulation suffers from.
    //
    // pointer:coarse (touchscreens) is a stricter device test than
    // window.innerWidth — a width-only check also triggers on narrow desktop
    // windows.

    var _styleTag = null;

    var _CSS = [
        '@media (pointer: coarse) {',
        '    div.react-photo-gallery--gallery {',
        '        display: block !important;',
        '    }',
        '    .wall-item {',
        '        position: relative !important;',  /* pull items back into normal flow */
        '        width:    100%   !important;',
        '        height:   auto   !important;',
        '        top:      auto   !important;',    /* neutralise calculated pixel offsets */
        '        left:     auto   !important;',
        '        display:  block  !important;',
        '        margin-bottom: 10px !important;',
        '        max-width:  100%  !important;',   /* Stash's .wall caps items at 450px / 20% */
        '        max-height: none  !important;',   /* and 253px / 11.25vw */
        '    }',
        /* Stash's older .wall markup (Wall/WallItem.tsx): the item's container
           and anchor fill the fixed-height card and the container scales 2x
           on :hover, which a tap triggers on touch. The /scenes wall in
           current Stash is react-photo-gallery, so these rules are a
           safeguard for that markup rather than the main scene-wall fix. */
        '    .wall-item-container, .wall-item-anchor {',
        '        width:     100%  !important;',
        '        height:    auto  !important;',
        '        transform: none  !important;',
        '    }',
        '    .wall-item img, .wall-item video {',
        '        width:       100%    !important;',
        '        height:      auto    !important;',
        '        object-fit:  contain !important;',
        '    }',
        '}'
    ].join('\n');

    // ── Load queue: cancel the parallel-fetch storm, re-issue in DOM order ────

    // Concurrency cap. Top _MAX_CONCURRENT_LOADS videos start with the most
    // uncontested bandwidth; higher values re-split the pipe sooner.
    var _MAX_CONCURRENT_LOADS = 2;

    // How long a video holds a concurrency slot before the queue advances past
    // it, regardless of canplay. On cellular, canplay can take 3–5s per video,
    // which would starve the clips queued behind it; with this fallback each
    // queued clip starts fetching within a fraction of a second of reaching
    // the head of the queue. Only clips that come within _NEAR_SCREENS of
    // the viewport are queued (see the near/far section).
    var _LOAD_ADVANCE_MS = 500;

    // Every wall <video> we manage: the react-photo-gallery walls (markers,
    // images, scenes) and any .wall-item card. Wall items do not virtualise,
    // and in "video" wall playback mode every scene card is
    // <video autoPlay loop muted> with no visibility gating at all.
    var _VIDEO_SELECTOR = '.react-photo-gallery--gallery video, .wall-item video';

    var _videoSrcs = null;    // WeakMap<HTMLVideoElement, string> — saved src
    var _loadQueue = null;    // Array<HTMLVideoElement>, head = next to load
    var _loading = null;      // Set<HTMLVideoElement>, in-flight
    var _wantsToPlay = null;  // WeakSet<HTMLVideoElement>, currently in view

    function clearVideoSrc(video) {
        var src = video.getAttribute('src');
        if (!src) return;
        // Always the current src: React may have set a new one since the
        // last release, and restoring an older one would undo it.
        _videoSrcs.set(video, src);
        video.removeAttribute('src');
        // load() on a src-less element resets media state AND cancels any
        // pending network request the browser had started for the old src.
        // Wrapped in try/catch because some browsers throw if load() is
        // called during a pending media state transition; swallowing is
        // safe because we're explicitly resetting anyway.
        try { video.load(); } catch (e) {}
    }

    function restoreVideoSrc(video) {
        if (video.getAttribute('src')) return;
        var src = _videoSrcs.get(video);
        if (!src) return;
        video.setAttribute('preload', 'auto');
        video.setAttribute('src', src);
        try { video.load(); } catch (e) {}
    }

    function beginLoading(video) {
        if (_loading.has(video)) return;
        _loading.add(video);
        restoreVideoSrc(video);

        // Capture the current _loading Set so a stale advance (e.g. if the
        // plugin deactivates before the timeout fires) can detect it and
        // no-op, instead of mutating a freshly-constructed successor Set.
        var loading = _loading;
        var advanced = false;
        var advance = function () {
            if (advanced) return;
            advanced = true;
            if (loading !== _loading) return;  // plugin deactivated / reset
            loading.delete(video);
            processLoadQueue();
        };

        // canplay: video is playable, so advance the queue early (wifi-fast
        // path). Starting playback is onVideoReady's job, not this one-shot.
        var onCanPlay = function () {
            video.removeEventListener('canplay', onCanPlay);
            advance();
        };
        video.addEventListener('canplay', onCanPlay);

        // Fallback for slow networks: advance even if canplay is still many
        // seconds away, so the tail of the queue starts fetching in time.
        setTimeout(advance, _LOAD_ADVANCE_MS);
    }

    function processLoadQueue() {
        if (!_loading || !_loadQueue) return;
        while (_loading.size < _MAX_CONCURRENT_LOADS && _loadQueue.length > 0) {
            var video = _loadQueue.shift();
            if (!video.isConnected) continue;         // React unmounted it
            if (video.getAttribute('src')) continue;  // already has a src
            beginLoading(video);
        }
    }

    // If the user scrolls past the current load window to a video that hasn't
    // loaded yet, move it to the head of the queue so the scheduler picks it
    // up as soon as a slot frees. Doesn't pre-empt an in-flight load — just
    // reorders the waiting list.
    function bumpToHead(video) {
        if (!_loadQueue) return;
        var idx = _loadQueue.indexOf(video);
        if (idx <= 0) return;
        _loadQueue.splice(idx, 1);
        _loadQueue.unshift(video);
        processLoadQueue();
    }

    function tryPlay(video) {
        if (!_wantsToPlay || !_wantsToPlay.has(video)) return;
        // No readyState gate: iOS Safari fetches a paused clip's metadata
        // (readyState 1), then sets networkState to IDLE and waits for
        // play() before it buffers more. Waiting for readyState 2 here
        // left in-view clips that kept React's src blank until scrolled
        // far away and back (seen on iOS 27, 2026-11-27). play() is what
        // makes Safari resume the fetch; it resolves once the clip plays.
        // A clip with no src is still waiting in the load queue.
        if (!video.getAttribute('src')) return;
        // play() returns a Promise that rejects if interrupted (e.g. paused
        // again immediately). Swallow — nothing actionable.
        var p = video.play();
        if (p && typeof p.catch === 'function') p.catch(function () {});
    }

    // Persistent canplay listener on every observed video. canplay fires on
    // EVERY transition to playable, not just the first load: after an iOS
    // decoder-eviction re-load, after a stall recovers, after a src restore.
    // Without it a clip that was in view but not ready when the IO edge
    // fired, and missed the queue's one-shot canplay, sat paused until the
    // user scrolled it out and back. tryPlay's own _wantsToPlay check
    // makes it a no-op for off-screen clips. One shared function
    // reference, so addEventListener dedups any repeat registration.
    function onVideoReady(e) {
        tryPlay(e.currentTarget);
    }

    // ── End-of-clip stall watchdog (WebKit) ───────────────────────────────────
    // In the author's testing, Safari (iOS 27 and macOS) stalls Stash's
    // VP9/WebM image-clip previews on their last frame: currentTime reaches
    // duration, paused stays false, and neither the native loop nor an
    // 'ended' event ever fires (loop=false was tested too; no 'ended'). No
    // event marks the stall, so poll: an in-view looping clip whose
    // currentTime sits at its end and hasn't moved since the last tick is
    // stuck, and a seek to 0 restarts it. A clip
    // that is still playing always advances between ticks, so it never matches.
    // Chrome loops these files natively and never trips the check.
    var _STALL_POLL_MS = 500;
    var _STALL_END_SLACK_S = 0.25;
    var _stallTimer = null;
    var _lastTimes = null;  // WeakMap<HTMLVideoElement, number>

    function checkStalledLoops() {
        if (!_wantsToPlay) return;
        var videos = document.querySelectorAll(_VIDEO_SELECTOR);
        for (var i = 0; i < videos.length; i++) {
            var video = videos[i];
            if (!_wantsToPlay.has(video) || !video.loop || video.paused) continue;
            var t = video.currentTime;
            var atEnd = isFinite(video.duration) &&
                t >= video.duration - _STALL_END_SLACK_S;
            if (atEnd && _lastTimes.get(video) === t) {
                video.currentTime = 0;
                var p = video.play();
                if (p && typeof p.catch === 'function') p.catch(function () {});
            }
            _lastTimes.set(video, video.currentTime);
        }
    }

    // ── Play-on-visibility ────────────────────────────────────────────────────

    var _ioPlay = null;

    function onPlayIntersect(entries) {
        if (!_wantsToPlay) return;
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var video = entry.target;
            if (entry.isIntersecting) {
                _wantsToPlay.add(video);
                // User is looking at this clip — prioritize its load.
                bumpToHead(video);
                // iOS Safari may evict decoders under memory pressure, leaving
                // the element with readyState 0. Re-load if so, but not while
                // the first fetch is still running (readyState is 0 then
                // too), or load() would restart it.
                if (video.readyState === 0 && video.getAttribute('src') &&
                        video.networkState !== video.NETWORK_LOADING) {
                    try { video.load(); } catch (e) {}
                }
                tryPlay(video);
            } else {
                _wantsToPlay.delete(video);
                video.pause();
            }
        }
    }

    // ── Near/far decoder release ──────────────────────────────────────────────
    // A paused <video> that still has a src keeps its decoder and buffer alive
    // on iOS, and twenty of those per page cost memory and power. Two more
    // observers with generous margins classify each clip as near (within
    // _NEAR_MARGIN of the viewport) or far (beyond _FAR_MARGIN). Far clips
    // get their src stripped and load()ed, which frees the decoder and the
    // buffered bytes; clips coming back into the near zone re-enter the
    // ordered load queue.
    //
    // Two margins, not one: loading starts at _NEAR_MARGIN but release only
    // happens beyond _FAR_MARGIN. With a single boundary a clip that sat on
    // it was released and re-fetched on every small scroll, which felt like
    // a slow server (3.4, 2026-10-12). Between the two margins a clip keeps
    // whatever state it has.
    // Distances in viewport heights past each edge of the screen.
    var _NEAR_SCREENS = 2;
    var _FAR_SCREENS = 5;
    var _NEAR_MARGIN = (_NEAR_SCREENS * 100) + '% 0px';
    var _FAR_MARGIN = (_FAR_SCREENS * 100) + '% 0px';
    var _ioNear = null;
    var _ioFar = null;

    function onNearIntersect(entries) {
        if (!_loadQueue) return;
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var video = entry.target;
            if (!entry.isIntersecting) continue;
            if (video.getAttribute('src')) continue;      // already loaded
            if (!_videoSrcs.has(video)) continue;         // nothing to restore
            if (_loading.has(video)) continue;
            if (_loadQueue.indexOf(video) !== -1) continue;
            _loadQueue.push(video);
        }
        processLoadQueue();
    }

    function onFarIntersect(entries) {
        if (!_loadQueue) return;
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var video = entry.target;
            if (entry.isIntersecting) continue;           // still within reach
            var idx = _loadQueue.indexOf(video);
            if (idx !== -1) _loadQueue.splice(idx, 1);
            // Free its queue slot too: onNearIntersect skips clips still in
            // _loading, so a clip released mid-load and scrolled straight
            // back would otherwise never be queued again and stay blank.
            _loading.delete(video);
            _wantsToPlay.delete(video);
            video.pause();
            clearVideoSrc(video);  // no-op if already src-less
        }
        processLoadQueue();
    }

    // Find any <video> in the gallery we haven't observed yet, pause it
    // (defuse the autoplay stampede — Stash sets autoPlay on every card, so
    // a 20-card page fires 20 simultaneous play() calls before our IO's
    // first async callback can land), strip its src if it is far from the
    // viewport, and observe it. Called on every MutationObserver tick so
    // newly rendered videos get picked up as Stash fills the DOM.
    var _observedVideos = null;  // WeakSet — dedup MO ticks

    function registerGalleryVideos() {
        if (!_ioPlay || !_observedVideos) return;
        var videos = document.querySelectorAll(_VIDEO_SELECTOR);
        // Same reach as _NEAR_MARGIN, computed synchronously so registration
        // can tell near from far before the observers' first async callback.
        var nearPx = window.innerHeight * _NEAR_SCREENS;
        for (var i = 0; i < videos.length; i++) {
            var video = videos[i];
            if (_observedVideos.has(video)) continue;
            _observedVideos.add(video);

            video.pause();
            // Stash sets autoPlay on every card. The attribute re-arms on
            // every load(), so a clip whose src we restore off-screen would
            // start itself and run until the next IO edge. Strip it: the
            // play observer is the only thing that starts playback. React
            // only re-applies the prop if its value changes, which it never
            // does for a mounted card.
            video.autoplay = false;  // also removes the attribute
            video.addEventListener('canplay', onVideoReady);

            // Only interpose the load queue if the fetch is still abortable
            // (readyState 0/1 on mobile data — bytes haven't arrived yet).
            // If somehow the video is already playable, don't waste those
            // bytes. Clips already within the near zone keep the src React
            // gave them: every strip-then-restore is two media player
            // teardowns on iOS, and a list refetch remounts all 20 cards at
            // once, which stalled the UI for a second or more (3.4-3.6,
            // 2026-10-12). Far clips are stripped and re-enter the ordered
            // queue when they come within reach.
            if (video.readyState < 2 && video.getAttribute('src')) {
                var r = video.getBoundingClientRect();
                var near = r.bottom > -nearPx &&
                    r.top < window.innerHeight + nearPx;
                if (!near) clearVideoSrc(video);
            }
            _ioNear.observe(video);
            _ioFar.observe(video);
            _ioPlay.observe(video);
        }
    }

    function activateVideoBehavior() {
        if (_ioPlay) return;
        _videoSrcs = new WeakMap();
        _loadQueue = [];
        _loading = new Set();
        _wantsToPlay = new WeakSet();
        _observedVideos = new WeakSet();
        // Created before _ioPlay on purpose: observers deliver in creation
        // order within one update, so the near pass has queued a clip
        // before the play pass tries to bump it to the head.
        _ioNear = new IntersectionObserver(onNearIntersect, {
            threshold: 0, rootMargin: _NEAR_MARGIN
        });
        _ioFar = new IntersectionObserver(onFarIntersect, {
            threshold: 0, rootMargin: _FAR_MARGIN
        });
        _ioPlay = new IntersectionObserver(onPlayIntersect, { threshold: 0.1 });
        _lastTimes = new WeakMap();
        _stallTimer = setInterval(checkStalledLoops, _STALL_POLL_MS);
    }

    function deactivateVideoBehavior() {
        if (!_ioPlay) return;
        _ioPlay.disconnect();
        _ioPlay = null;
        _ioNear.disconnect();
        _ioNear = null;
        _ioFar.disconnect();
        _ioFar = null;
        clearInterval(_stallTimer);
        _stallTimer = null;
        _lastTimes = null;
        // Nulling _loading here makes any still-pending `advance` closures
        // inert: their captured `loading` ref no longer === _loading, so
        // they return without mutating the new plugin state.
        _videoSrcs = null;
        _loadQueue = null;
        _loading = null;
        _wantsToPlay = null;
        _observedVideos = null;
    }

    // ── Page change + DOM mutation entry point ────────────────────────────────
    // Stash is a React SPA; "navigation" is a DOM mutation, not a page load.
    // One observer on <body> catches both navigation and incremental gallery
    // rendering, so there's no need for a polling interval. The WeakSet dedup
    // in registerGalleryVideos keeps the per-tick cost to a single
    // querySelectorAll.

    function updateForCurrentPage() {
        var path = window.location.pathname;
        // /scenes in grid mode has no .wall-item elements, so the CSS
        // matches nothing and registration finds nothing.
        var onTargetPage = path === '/images' || path === '/scenes/markers' ||
            path === '/scenes';

        if (onTargetPage) {
            if (!_styleTag) {
                _styleTag = document.createElement('style');
                _styleTag.id = 'mobileWallLayout-style';
                _styleTag.textContent = _CSS;
                document.head.appendChild(_styleTag);
            }
            activateVideoBehavior();
            registerGalleryVideos();
        } else {
            if (_styleTag) {
                _styleTag.remove();
                _styleTag = null;
            }
            deactivateVideoBehavior();
        }
    }

    // ── AV1 decode-failure fallback (WebKit) ──────────────────────────────────
    // In the author's testing, Safari's AV1 decoder can wedge mid-session:
    // every AV1 <video> then fails with MEDIA_ERR_DECODE (code 3) until
    // Safari restarts, while VP9 and H.264 keep working. An image clip's
    // full file (/image/<id>/image) may be AV1; its generated preview
    // (/image/<id>/preview) is VP9 at full clip length. On a decode error,
    // swap to the preview so the lightbox / image page shows the clip at
    // lower resolution instead of an empty box. Global, not tied to the
    // wall: the lightbox and the image page both render the full file.
    // 'error' on media doesn't bubble, so listen in the capture phase.
    //
    // The swap happens only after a 1-byte request shows the preview
    // exists. The original src is kept: if the preview fails anyway, the
    // original goes back, leaving the element as Stash rendered it. The
    // element keeps the original's pixel size, because Stash's lightbox
    // scales it from the full file's dimensions. It is resumed only if it
    // was playing or is on screen, since the lightbox keeps its neighbour
    // slides mounted and paused off screen.
    var _MEDIA_ERR_DECODE = 3;
    var _clipOriginals = new WeakMap();  // <video> -> full-file src swapped away

    document.addEventListener('error', function (e) {
        var video = e.target;
        if (!video || video.tagName !== 'VIDEO') return;
        var src = video.getAttribute('src') || '';
        var original = _clipOriginals.get(video);
        if (original === src) return;  // already tried this file
        if (original && src === previewOf(original)) {
            video.setAttribute('src', original);  // the preview failed too
            return;
        }
        if (!video.error || video.error.code !== _MEDIA_ERR_DECODE) return;
        var preview = previewOf(src);
        if (!preview) return;  // not an image clip's full file
        _clipOriginals.set(video, src);
        var wasPlaying = !video.paused;
        var w = video.videoWidth, h = video.videoHeight;
        fetch(preview, { headers: { Range: 'bytes=0-0' } }).then(function (res) {
            if (!res.ok) return;
            if (video.getAttribute('src') !== src) return;  // moved on
            if (w && h && !video.style.width && !video.style.height) {
                video.style.width = w + 'px';
                video.style.height = h + 'px';
            }
            video.setAttribute('src', preview);  // starts the load itself
            var r = video.getBoundingClientRect();
            var onScreen = r.width > 0 && r.right > 0 && r.left < window.innerWidth &&
                r.bottom > 0 && r.top < window.innerHeight;
            if (wasPlaying || onScreen) {
                var p = video.play();
                if (p && typeof p.catch === 'function') p.catch(function () {});
            }
        }).catch(function () {});
    }, true);

    function previewOf(src) {
        var m = src.match(/^(.*\/image\/\d+)\/image(\?.*)?$/);
        return m ? m[1] + '/preview' + (m[2] || '') : null;
    }

    var observer = new MutationObserver(updateForCurrentPage);
    observer.observe(document.body, { childList: true, subtree: true });

    // Run immediately for whichever page loaded first
    updateForCurrentPage();
})();
