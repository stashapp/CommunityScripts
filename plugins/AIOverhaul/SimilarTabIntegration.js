(function(){
// Similar Tab Integration
// Adds a "Similar" tab to the scene details page using PluginApi patches
// Based on the official React component plugin example from Stash
(function () {
    'use strict';
    const w = window;
    const PluginApi = w.PluginApi;
    // Basic sanity checks
    if (!PluginApi || !PluginApi.React) {
        console.warn('[SimilarTabIntegration] PluginApi or React not available');
        return;
    }
    const React = PluginApi.React;
    const { Nav, Tab } = PluginApi.libraries.Bootstrap;
    if (!Nav || !Tab) {
        console.warn('[SimilarTabIntegration] Bootstrap Nav/Tab components not available');
        return;
    }
    function initializePatches() {
        console.log('[SimilarTabIntegration] Registering patches...');
        // Final safety check - make sure everything is available
        if (!PluginApi.patch || !PluginApi.patch.before) {
            console.error('[SimilarTabIntegration] PluginApi.patch.before not available');
            return;
        }
        try {
            // Add tab to navigation - insert before the Queue tab when possible
            PluginApi.patch.before("ScenePage.Tabs", function (props) {
                try {
                    const childrenArray = props && props.children ? (Array.isArray(props.children) ? props.children.slice() : [props.children]) : [];
                    // Helper to extract nested runtime event key from NavItem children.
                    // In Stash 1.0+, the anchor rendered inside NavItem carries a data-rb-event-key attribute.
                    function findNestedEventKey(c) {
                        try {
                            if (!c || !c.props)
                                return undefined;
                            // Direct props.eventKey
                            if (c.props.eventKey)
                                return c.props.eventKey;
                            // data-event-key variants
                            if (c.props['data-event-key'])
                                return c.props['data-event-key'];
                            if (c.props['data-eventKey'])
                                return c.props['data-eventKey'];
                            const ch = c.props.children;
                            const candidates = Array.isArray(ch) ? ch : [ch];
                            for (const item of candidates) {
                                if (!item)
                                    continue;
                                if (item.props) {
                                    // Check common RB attribute where React-Bootstrap stores the key
                                    if (item.props['data-rb-event-key'])
                                        return item.props['data-rb-event-key'];
                                    if (item.props['data-rb-eventKey'])
                                        return item.props['data-rb-eventKey'];
                                    if (item.props['data-event-key'])
                                        return item.props['data-event-key'];
                                    if (item.props.eventKey)
                                        return item.props.eventKey;
                                }
                            }
                        }
                        catch (e) { /* ignore */ }
                        return undefined;
                    }
                    // Try to place after 'Details' tab by looking for the runtime event key used on the anchor
                    let insertIndex = -1;
                    const detailsIndex = childrenArray.findIndex((c) => {
                        const ek = findNestedEventKey(c);
                        return ek === 'scene-details-panel' || (ek && ek.toLowerCase().includes('details'));
                    });
                    if (detailsIndex >= 0) {
                        insertIndex = detailsIndex + 1;
                        console.log('[SimilarTabIntegration] Inserting Similar Nav.Item after Details at index', insertIndex);
                    }
                    else {
                        // Fallback: detect Queue by runtime key and insert before it
                        const queueIndex = childrenArray.findIndex((c) => {
                            const ek = findNestedEventKey(c);
                            return ek === 'scene-queue-panel' || (ek && ek.toLowerCase().includes('queue'));
                        });
                        if (queueIndex >= 0) {
                            insertIndex = queueIndex;
                            console.log('[SimilarTabIntegration] Inserting Similar Nav.Item before Queue at index', insertIndex);
                        }
                    }
                    // If still not found, we will attempt to detect by legacy eventKey or append
                    if (insertIndex < 0) {
                        const targetEventKey = 'scene-queue-panel';
                        insertIndex = childrenArray.findIndex((c) => {
                            const ek = findNestedEventKey(c);
                            return ek === targetEventKey;
                        });
                    }
                    const navItem = React.createElement(Nav.Item, { key: 'similar-nav-item' }, React.createElement(Nav.Link, { eventKey: "similar-tab", key: 'similar-nav-link' }, "Similar"));
                    // Insert navItem at the computed insertIndex (if >= 0) or append
                    if (insertIndex >= 0) {
                        childrenArray.splice(insertIndex, 0, navItem);
                        console.log('[SimilarTabIntegration] Similar Nav.Item inserted at', insertIndex);
                    }
                    else {
                        childrenArray.push(navItem);
                        console.warn('[SimilarTabIntegration] Similar Nav.Item appended to end');
                    }
                    const newChildren = React.createElement(React.Fragment, null, ...childrenArray);
                    return [{ children: newChildren }];
                }
                catch (e) {
                    console.error('[SimilarTabIntegration] Error in ScenePage.Tabs patch:', e);
                    return [];
                }
            });
            // Add tab content - insert before the queue pane when possible
            PluginApi.patch.before("ScenePage.TabContent", function (props) {
                var _a;
                try {
                    // Handle case where props is completely undefined
                    if (!props) {
                        console.warn('[SimilarTabIntegration] TabContent patch called with undefined props');
                        return [];
                    }
                    const childrenArray = props.children ? (Array.isArray(props.children) ? props.children.slice() : [props.children]) : [];
                    // Extract scene ID safely - sometimes props.scene is undefined during render
                    const sceneId = ((_a = props.scene) === null || _a === void 0 ? void 0 : _a.id) || null;
                    console.log('[SimilarTabIntegration] TabContent patch called with scene:', sceneId);
                    // Only render if we have a scene ID and viewer is available
                    const Viewer = w.SimilarScenesViewer;
                    const content = (sceneId && Viewer) ?
                        React.createElement(Viewer, { sceneId: sceneId, key: `similar-${sceneId}` }) :
                        React.createElement('div', { className: 'similar-scenes-error' }, 'Loading scene data...');
                    const pane = React.createElement(Tab.Pane, { eventKey: "similar-tab", key: `similar-pane-${sceneId || 'loading'}` }, content);
                    const targetEventKey = 'scene-queue-panel';
                    let insertIndex = childrenArray.findIndex((c) => c && c.props && (c.props.eventKey === targetEventKey || c.props['data-event-key'] === targetEventKey || c.props['data-eventKey'] === targetEventKey));
                    if (insertIndex >= 0) {
                        childrenArray.splice(insertIndex, 0, pane);
                        console.log('[SimilarTabIntegration] Inserted Similar Tab.Pane before queue pane at index', insertIndex, 'for scene', sceneId);
                    }
                    else {
                        childrenArray.push(pane);
                        console.warn('[SimilarTabIntegration] Queue pane not found; appended Similar Tab.Pane to end for scene', sceneId);
                    }
                    const newChildren = React.createElement(React.Fragment, null, ...childrenArray);
                    return [{ children: newChildren }];
                }
                catch (e) {
                    console.error('[SimilarTabIntegration] Error in ScenePage.TabContent patch:', e);
                    return [];
                }
            });
            console.log('[SimilarTabIntegration] Patches registered successfully');
        }
        catch (error) {
            console.error('[SimilarTabIntegration] Error registering patches:', error);
        }
    }
    // Initialize immediately; viewer is resolved lazily at render time
    initializePatches();
})();
})();

