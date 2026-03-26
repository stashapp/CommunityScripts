/**
 * Mobile Layout Fix — Stash UI Plugin
 * =====================================
 * Forces full-width single-column layout on the Markers and Images (wall mode)
 * pages, where react-photo-gallery sets inline position:absolute offsets that
 * cause items to overlap or overflow on mobile.
 *
 * Fix: inject a <style> tag with !important rules that override the library's
 * inline styles, making the layout rendering-order-independent. A JS-based
 * approach (setting el.style directly) loses to library re-renders; CSS wins
 * unconditionally.
 *
 * The style tag is added when entering /images or /scenes/markers and removed
 * on navigation away, so it never affects other views.
 *
 * Architecture:
 *   A single MutationObserver watches for DOM changes caused by Stash's SPA
 *   navigation and re-evaluates which page is active.
 */

// ── Images + Markers pages: CSS injection for mobile full-width layout ────────
// Both /images (wall mode) and /scenes/markers use react-photo-gallery, which
// sets inline position:absolute styles. A <style> tag with !important beats
// inline styles regardless of render timing, avoiding the race condition that
// JS-based inline overrides suffer from.
//
// The 960px threshold covers all current phones including large flagships in
// landscape (e.g. iPhone 16 Pro Max: 932px, Galaxy S24 Ultra: 915px) while
// excluding tablets (iPad mini landscape: 1024px). The resize listener ensures
// the fix is applied/removed correctly on orientation change.

var _imagesStyleTag = null;

// Uses !important throughout so these rules win over react-photo-gallery's
// inline `style="position:absolute; top:Xpx; left:Ypx"` attributes.
var _IMAGES_CSS = [
    'div.react-photo-gallery--gallery {',
    '    display: block !important;',
    '}',
    '.wall-item {',
    '    position: relative !important;',  /* pull items back into normal flow */
    '    width:    100%   !important;',
    '    height:   auto   !important;',
    '    top:      auto   !important;',    /* neutralise calculated pixel offsets */
    '    left:     auto   !important;',
    '    display:  block  !important;',
    '    margin-bottom: 10px !important;',
    '}',
    '.wall-item img, .wall-item video {',
    '    width:       100%    !important;',
    '    height:      auto    !important;',
    '    object-fit:  contain !important;',
    '}'
].join('\n');

function updateImagesPageFix() {
    var href = window.location.href;
    var onTargetPage = (href.includes('/images') || href.includes('scenes/markers'))
        && window.innerWidth <= 960;

    if (onTargetPage && !_imagesStyleTag) {
        // Entering images or markers page — inject the fix
        _imagesStyleTag = document.createElement('style');
        _imagesStyleTag.id = 'mobile-layout-fix-images';
        _imagesStyleTag.textContent = _IMAGES_CSS;
        document.head.appendChild(_imagesStyleTag);
    } else if (!onTargetPage && _imagesStyleTag) {
        // Leaving — clean up so other pages are unaffected
        _imagesStyleTag.remove();
        _imagesStyleTag = null;
    }
}

// ── Shared MutationObserver ───────────────────────────────────────────────────
// Stash is a React SPA; page "navigation" is DOM mutation, not a real load.
// Observing childList + subtree on body catches both navigation and lazy-
// loaded gallery content without needing a polling interval.

var observer = new MutationObserver(updateImagesPageFix);
observer.observe(document.body, { childList: true, subtree: true });

// Re-evaluate on orientation change (portrait ↔ landscape)
window.addEventListener('resize', updateImagesPageFix);

// Run immediately for whichever page is loaded first
updateImagesPageFix();
