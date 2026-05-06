/**
 * Mobile Wall Layout — Stash UI Plugin (display name: scrollFeed)
 * =================================================================
 * Turns the Markers and Images wall into a scrollable mobile feed:
 * full-width single-column layout, play-on-visibility, and DOM-ordered
 * video loading so the top of the page is watchable fast on mobile data.
 *
 * Only active on /scenes/markers and /images; tears down on navigate-away.
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
 *                          Cancels React's parallel src fetches and re-
 *                          issues them top-down so the first clip is
 *                          playable before the 20th has even started.
 *                          The queue advances every _LOAD_ADVANCE_MS
 *                          (fallback) or on canplay (wifi-fast path),
 *                          whichever fires first, so the entire list is
 *                          in-flight within a few seconds — moving into
 *                          a bad-reception area won't strand the bottom
 *                          of the page with zero bytes.
 *   MutationObserver     : watches <body> for SPA navigation and newly
 *                          rendered videos (Stash fills incrementally).
 *
 * Why the load queue exists
 * -------------------------
 *   Stash renders <video autoPlay src="..."> on every marker card, so
 *   the browser fires N parallel HTTP fetches on page mount. Over a
 *   home-NAS → public-internet → cellular-phone path that's N streams
 *   sharing one slow uplink — the top video is as far from playable as
 *   the bottom one. By stripping src at registration (video.load()
 *   aborts the in-flight fetch), pushing to an ordered queue, and
 *   restoring src top-down, the top clips get the first and largest
 *   slice of bandwidth.
 *
 * Retention
 * ---------
 *   react-photo-gallery v8 does NOT virtualize — every photo on the
 *   current page stays in the DOM. A <video>'s downloaded bytes persist
 *   for the page's lifetime, so scrolling back after a network drop
 *   resumes instantly. Stash paginates (min 20/page), so retention
 *   scope is the current page; page-change resets state by design.
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
    // which starves the tail — we want every video to have started fetching
    // within a few seconds of page load so degrading reception doesn't strand
    // the bottom of the page with zero bytes. 500ms × 10 batches = all 20 in
    // flight by ~5s.
    var _LOAD_ADVANCE_MS = 500;

    var _videoSrcs = null;    // WeakMap<HTMLVideoElement, string> — saved src
    var _loadQueue = null;    // Array<HTMLVideoElement>, head = next to load
    var _loading = null;      // Set<HTMLVideoElement>, in-flight
    var _wantsToPlay = null;  // WeakSet<HTMLVideoElement>, currently in view

    function clearVideoSrc(video) {
        var src = video.getAttribute('src');
        if (!src) return;
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

        // canplay: video is playable. Start it if the user is looking at it,
        // and advance the queue early (wifi-fast path).
        var onCanPlay = function () {
            video.removeEventListener('canplay', onCanPlay);
            tryPlay(video);
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
        if (video.readyState < 2) return;  // not enough data yet
        // play() returns a Promise that rejects if interrupted (e.g. paused
        // again immediately). Swallow — nothing actionable.
        var p = video.play();
        if (p && typeof p.catch === 'function') p.catch(function () {});
    }

    // ── Play-on-visibility ────────────────────────────────────────────────────

    var _ioPlay = null;

    function onPlayIntersect(entries) {
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var video = entry.target;
            if (entry.isIntersecting) {
                _wantsToPlay.add(video);
                // User is looking at this clip — prioritize its load.
                bumpToHead(video);
                // iOS Safari may evict decoders under memory pressure, leaving
                // the element with readyState 0. Re-load if so.
                if (video.readyState === 0 && video.getAttribute('src')) {
                    try { video.load(); } catch (e) {}
                }
                tryPlay(video);
            } else {
                _wantsToPlay.delete(video);
                video.pause();
            }
        }
    }

    // Find any <video> in the gallery we haven't observed yet, pause it
    // (defuse the autoplay stampede — Stash sets autoPlay on every card, so
    // a 20-card page fires 20 simultaneous play() calls before our IO's
    // first async callback can land), swap its src into the load queue, and
    // observe it. Called on every MutationObserver tick so newly rendered
    // videos get picked up as Stash fills the DOM.
    var _observedVideos = null;  // WeakSet — dedup MO ticks

    function registerGalleryVideos() {
        if (!_ioPlay || !_observedVideos) return;
        var videos = document.querySelectorAll(
            '.react-photo-gallery--gallery video'
        );
        for (var i = 0; i < videos.length; i++) {
            var video = videos[i];
            if (_observedVideos.has(video)) continue;
            _observedVideos.add(video);

            video.pause();
            _ioPlay.observe(video);

            // Only interpose the load queue if the fetch is still abortable
            // (readyState 0/1 on mobile data — bytes haven't arrived yet).
            // If somehow the video is already playable, don't waste those
            // bytes.
            if (video.readyState < 2 && video.getAttribute('src')) {
                clearVideoSrc(video);
                _loadQueue.push(video);
            }
        }
        processLoadQueue();
    }

    function activateVideoBehavior() {
        if (_ioPlay) return;
        _videoSrcs = new WeakMap();
        _loadQueue = [];
        _loading = new Set();
        _wantsToPlay = new WeakSet();
        _observedVideos = new WeakSet();
        _ioPlay = new IntersectionObserver(onPlayIntersect, { threshold: 0.1 });
    }

    function deactivateVideoBehavior() {
        if (!_ioPlay) return;
        _ioPlay.disconnect();
        _ioPlay = null;
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
        var onTargetPage = path === '/images' || path === '/scenes/markers';

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

    var observer = new MutationObserver(updateForCurrentPage);
    observer.observe(document.body, { childList: true, subtree: true });

    // Run immediately for whichever page loaded first
    updateForCurrentPage();
})();
