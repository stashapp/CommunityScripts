(function(){
// =============================================================================
// Page Context Utility (Minimal Reset Version)
// Exposes window.AIPageContext with detection + subscription helpers
// =============================================================================
detectPageContext;
subscribe;
// Enable verbose debug logging by setting window.AIPageContextDebug = true in the console
function debugLog(...args) {
    if (window.AIPageContextDebug) {
        // eslint-disable-next-line no-console
        console.log('[AIPageContext]', ...args);
    }
}
const PAGE_DEFS = [
    { key: 'scenes', segment: '/scenes', label: 'Scenes', detailLabel: id => id ? `Scene #${id}` : 'Scene Library' },
    { key: 'galleries', segment: '/galleries', label: 'Galleries', detailLabel: id => id ? `Gallery #${id}` : 'Gallery Library' },
    { key: 'images', segment: '/images', label: 'Images', detailLabel: id => id ? `Image #${id}` : 'Image Library' },
    { key: 'groups', segment: '/groups', label: 'Groups', detailLabel: id => id ? `Group #${id}` : 'Group Library' },
    { key: 'performers', segment: '/performers', label: 'Performers', detailLabel: id => id ? `Performer #${id}` : 'Performer Library' },
    { key: 'studios', segment: '/studios', label: 'Studios', detailLabel: id => id ? `Studio #${id}` : 'Studio Library' },
    { key: 'tags', segment: '/tags', label: 'Tags', detailLabel: id => id ? `Tag #${id}` : 'Tag Library' }
];
const ENTITY_PAGES = new Set(['scenes', 'performers', 'galleries', 'images', 'studios', 'tags', 'groups']);
function extractId(path, segment) {
    const regex = new RegExp(`${segment}/(\\d+)`);
    const match = path.match(regex);
    return match ? match[1] : null;
}
// Consolidated multi-select detection (cleaned up from legacy detectMultiSelectContext + earlier heuristic)
// Returns an array of numeric IDs (as strings) for currently selected entities on list pages.
// Detection strategy (in order):
//  1. Checked selection checkboxes inside known card containers.
//  2. Fallback to data-id on card containers.
//  3. Fallback to elements marked with selected/is-selected classes carrying data-id.
function collectSelectedIds(page) {
    try {
        const ids = new Set();
        // 1. Checked selection checkboxes inside cards
        const checkboxSelectors = [
            '.grid-card .card-check:checked',
            '.scene-card .card-check:checked',
            '.scene-grid-card .card-check:checked',
            '.scene-result input[type="checkbox"]:checked',
            'tr[data-id] input[type="checkbox"]:checked',
            '.performer-card .card-check:checked',
            '.gallery-card .card-check:checked',
            '.image-card .card-check:checked'
        ].join(', ');
        const checked = document.querySelectorAll(checkboxSelectors);
        checked.forEach(cb => {
            const card = cb.closest('.grid-card, .scene-card, .scene-grid-card, .scene-result, tr[data-id], li[data-id], .performer-card, .gallery-card, .image-card');
            if (!card)
                return;
            // Prefer extracting from inner anchor href (stable route pattern)
            const link = card.querySelector('a[href*="/scenes/"], a[href*="/performers/"], a[href*="/galleries/"], a[href*="/images/"], a[href*="/studios/"], a[href*="/tags/"], a[href*="/groups/"]');
            if (link) {
                const href = link.getAttribute('href') || link.href;
                const m = href.match(/\/(scenes|performers|galleries|images|studios|tags|groups)\/(\d+)/);
                if (m)
                    ids.add(m[2]);
            }
            // Fallback: data-id attribute on card
            if (card instanceof HTMLElement) {
                const dataId = card.getAttribute('data-id');
                if (dataId && /^\d+$/.test(dataId))
                    ids.add(dataId);
            }
        });
        // 2. If none via checkboxes, look for cards explicitly marked selected with data-id
        if (ids.size === 0) {
            const attrSelected = document.querySelectorAll('[data-id].selected, [data-id].is-selected, .is-selected [data-id], tr[data-id].table-active, tr[data-id].selected');
            attrSelected.forEach(el => {
                const id = el.getAttribute('data-id');
                if (id && /^\d+$/.test(id))
                    ids.add(id);
            });
        }
        // 3. (Optional) Checkbox pattern with data-id directly (legacy pattern)
        if (ids.size === 0) {
            const legacyChecked = document.querySelectorAll('input[type="checkbox"][data-id]:checked');
            legacyChecked.forEach(el => {
                const id = el.getAttribute('data-id');
                if (id && /^\d+$/.test(id))
                    ids.add(id);
            });
        }
        const finalIds = ids.size ? Array.from(ids) : undefined;
        debugLog('collectSelectedIds', { page, count: (finalIds === null || finalIds === void 0 ? void 0 : finalIds.length) || 0, ids: finalIds });
        return finalIds;
    }
    catch {
        return undefined;
    }
}
function resolveElementId(card, expectedPage) {
    if (!(card instanceof HTMLElement))
        return null;
    // Prefer anchor href patterns (stable across layouts)
    const link = card.querySelector('a[href*="/scenes/"], a[href*="/performers/"], a[href*="/galleries/"], a[href*="/images/"], a[href*="/studios/"], a[href*="/tags/"], a[href*="/groups/"]');
    if (link) {
        const href = link.getAttribute('href') || link.href;
        const match = href.match(/\/(scenes|performers|galleries|images|studios|tags|groups)\/(\d+)/);
        if (match) {
            if (!expectedPage || expectedPage === 'markers' || !ENTITY_PAGES.has(expectedPage) || match[1] === expectedPage) {
                return match[2];
            }
        }
    }
    const dataId = card.getAttribute('data-id');
    if (dataId && /^\d+$/.test(dataId))
        return dataId;
    return null;
}
function collectVisibleIds(page) {
    try {
        const ids = new Set();
        const cardSelectors = '.grid-card, .scene-card, .scene-grid-card, .scene-result, tr[data-id], li[data-id], .performer-card, .gallery-card, .image-card';
        document.querySelectorAll(cardSelectors).forEach(card => {
            const id = resolveElementId(card, page);
            if (id)
                ids.add(id);
        });
        // Fallback for anchors directly under list/table views
        if (ids.size === 0) {
            document.querySelectorAll('a[href*="/scenes/"], a[href*="/performers/"], a[href*="/galleries/"], a[href*="/images/"], a[href*="/studios/"], a[href*="/tags/"]').forEach(link => {
                const href = link.getAttribute('href') || link.href;
                const match = href.match(/\/(scenes|performers|galleries|images|studios|tags|groups)\/(\d+)/);
                if (match) {
                    if (!page || page === 'markers' || !ENTITY_PAGES.has(page) || match[1] === page)
                        ids.add(match[2]);
                }
            });
        }
        const finalIds = ids.size ? Array.from(ids) : undefined;
        debugLog('collectVisibleIds', { page, count: (finalIds === null || finalIds === void 0 ? void 0 : finalIds.length) || 0, ids: finalIds });
        return finalIds;
    }
    catch {
        return undefined;
    }
}
// (Removed legacy detectMultiSelectContext in favor of unified collectSelectedIds)
function detectPageContext() {
    const path = window.location.pathname;
    const cleanPath = path.split('?')[0];
    const segments = cleanPath.split('/').filter(Boolean); // e.g. performers / 1962 / scenes
    // Home / empty
    if (segments.length === 0 || segments[0] === 'home') {
        const ctx = {
            page: 'home',
            entityId: null,
            isDetailView: false,
            contextLabel: 'Home',
            detailLabel: 'Dashboard',
        };
        return ctx;
    }
    if (segments[0] === 'settings') {
        const ctx = {
            page: 'settings',
            entityId: null,
            isDetailView: false,
            contextLabel: 'Settings',
            detailLabel: 'Settings',
        };
        return ctx;
    }
    // Primary determination from first segment only
    const primarySegment = '/' + segments[0];
    let def = PAGE_DEFS.find(d => d.segment === primarySegment);
    // SPECIAL CASES:
    // Performer detail sub-routes like /performers/:id/scenes should remain performers
    if (segments[0] === 'performers' && segments[1] && /^\d+$/.test(segments[1])) {
        def = PAGE_DEFS.find(d => d.key === 'performers');
    }
    // Studios detail sub-routes /studios/:id/scenes
    if (segments[0] === 'studios' && segments[1] && /^\d+$/.test(segments[1])) {
        def = PAGE_DEFS.find(d => d.key === 'studios');
    }
    // Tags detail sub-routes /tags/:id/scenes
    if (segments[0] === 'tags' && segments[1] && /^\d+$/.test(segments[1])) {
        def = PAGE_DEFS.find(d => d.key === 'tags');
    }
    // MARKERS: treated as a virtual page when under /scenes/markers or /scenes?foo containing markers view.
    // If first segment is 'scenes' and second is 'markers' we expose page=markers (no entity detail)
    if (segments[0] === 'scenes' && segments[1] === 'markers') {
        const ctx = {
            page: 'markers',
            entityId: null,
            isDetailView: false,
            contextLabel: 'Markers',
            detailLabel: 'Markers Browser',
            selectedIds: collectSelectedIds('markers'),
            visibleIds: collectVisibleIds('markers')
        };
        debugLog('detectPageContext -> markers special', ctx, { segments });
        return ctx;
    }
    if (def) {
        // Determine detail ID (second segment numeric) ignoring trailing library-like segments
        let id = null;
        if (segments[1] && /^\d+$/.test(segments[1])) {
            id = segments[1];
        }
        else {
            id = extractId(cleanPath, def.segment);
        }
        const isDetail = !!id;
        const ctx = {
            page: def.key,
            entityId: id,
            isDetailView: isDetail,
            contextLabel: def.label,
            detailLabel: def.detailLabel(id),
            selectedIds: !isDetail ? collectSelectedIds(def.key) : undefined,
            visibleIds: !isDetail ? collectVisibleIds(def.key) : undefined
        };
        debugLog('detectPageContext -> match', ctx, { segments });
        return ctx;
    }
    const unknown = {
        page: 'unknown',
        entityId: null,
        isDetailView: false,
        contextLabel: 'Unknown Page',
        detailLabel: 'Unknown Location',
        selectedIds: undefined,
        visibleIds: undefined
    };
    debugLog('detectPageContext -> unknown', unknown, { segments });
    return unknown;
}
// Simple pub/sub for changes (future friendly)
const listeners = [];
let currentContext = detectPageContext();
let refreshTimer;
function notify() {
    listeners.forEach(l => {
        try {
            l(currentContext);
        }
        catch (_) { /* ignore */ }
    });
}
function scheduleRefresh(delay = 75) {
    if (refreshTimer !== undefined) {
        window.clearTimeout(refreshTimer);
    }
    refreshTimer = window.setTimeout(() => {
        refreshTimer = undefined;
        refreshContext();
    }, delay);
}
function hashIds(ids) {
    return ids && ids.length ? ids.slice().sort().join(',') : '';
}
function refreshContext() {
    const next = detectPageContext();
    const changed = (next.page !== currentContext.page ||
        next.entityId !== currentContext.entityId ||
        next.isDetailView !== currentContext.isDetailView ||
        hashIds(next.selectedIds) !== hashIds(currentContext.selectedIds) ||
        hashIds(next.visibleIds) !== hashIds(currentContext.visibleIds));
    if (changed) {
        debugLog('Context changed', { from: currentContext, to: next });
        currentContext = next;
        notify();
    }
}
function subscribe(listener) {
    listeners.push(listener);
    // immediate sync
    listener(currentContext);
    return () => {
        const idx = listeners.indexOf(listener);
        if (idx >= 0)
            listeners.splice(idx, 1);
    };
}
// Observe navigation changes
window.addEventListener('popstate', () => scheduleRefresh(50));
const mutationObserver = new MutationObserver(() => scheduleRefresh(100));
mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'aria-selected', 'data-selected', 'data-id', 'checked']
});
// Selection toggles often fire only change events; ensure we refresh context after them.
document.addEventListener('change', (event) => {
    const target = event.target;
    if (!target)
        return;
    if (target.matches('input[type="checkbox"], input[type="radio"], [data-id]')) {
        scheduleRefresh(75);
    }
}, true);
// Expose on window
;
window.AIPageContext = {
    detect: detectPageContext,
    subscribe,
    get: () => currentContext,
    forceRefresh: () => refreshContext()
};
})();

