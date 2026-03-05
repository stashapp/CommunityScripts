(function(){
// Recommended Scenes (Full UI Restored w/ cleanup)
// Visual parity with the richer version you preferred:
//  • Algorithm & min score controls
//  • Zoom slider + dynamic card width (upstream parity logic)
//  • Native‑style pagination (top + bottom) w/ dropdown
//  • Duration + size aggregate stats
//  • Adaptive GraphQL fetch & schema pruning
//  • Independent persistence (aiRec.* keys) + shareable URL params + cross‑tab sync
// Cleanup changes:
//  • Extracted helpers & constants
//  • Added light typing & defensive guards
//  • Reduced duplicated pagination calculations
//  • Centralized fetch + prune logic
//  • Wrapped debug logs behind w.AIDebug
(function () {
    const BUILD_VERSION = 'rec-pagination-v2-' + new Date().toISOString();
    try {
        console.info('[RecommendedScenes] Loaded bundle version', BUILD_VERSION);
    }
    catch (_) { }
    const w = window;
    // Safer initialization - wait for everything to be ready
    function initializeRecommendedScenes() {
        const PluginApi = w.PluginApi;
        if (!PluginApi || !PluginApi.React) {
            console.warn('[RecommendedScenes] PluginApi or React not available');
            return;
        }
        // Validate React hooks are available
        if (!PluginApi.React.useState || !PluginApi.React.useMemo || !PluginApi.React.useEffect || !PluginApi.React.useRef) {
            console.warn('[RecommendedScenes] React hooks not available');
            return;
        }
        const React = PluginApi.React;
        const { useState, useMemo, useEffect, useRef, useCallback } = React;
        const getSharedApiKey = () => {
            try {
                const helper = w.AISharedApiKeyHelper;
                if (helper && typeof helper.get === 'function') {
                    const value = helper.get();
                    if (typeof value === 'string')
                        return value.trim();
                }
            }
            catch { }
            const raw = w.AI_SHARED_API_KEY;
            return typeof raw === 'string' ? raw.trim() : '';
        };
        const withSharedKeyHeaders = (init) => {
            const helper = w.AISharedApiKeyHelper;
            if (helper && typeof helper.withHeaders === 'function') {
                return helper.withHeaders(init || {});
            }
            const key = getSharedApiKey();
            if (!key)
                return init || {};
            const headers = { ...(init && init.headers ? init.headers : {}) };
            headers['x-ai-api-key'] = key;
            return { ...(init || {}), headers };
        };
        // Using only the new backend hydrated recommendations API.
        // const GQL = {} as any; // (legacy GraphQL client removed)
        // Upstream grid hooks copied from GridCard.tsx for exact parity
        function useDebounce(fn, delay) {
            const timeoutRef = useRef(null);
            return useMemo(() => (...args) => {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => fn(...args), delay);
            }, [fn, delay]);
        }
        function useResizeObserver(target, callback) {
            useEffect(() => {
                if (!target.current || typeof ResizeObserver === 'undefined')
                    return;
                const ro = new ResizeObserver((entries) => {
                    // ResizeObserver passes an array of entries
                    if (entries && entries.length > 0) {
                        callback(entries[0]);
                    }
                });
                ro.observe(target.current);
                return () => ro.disconnect();
            }, [target, callback]);
        }
        function calculateCardWidth(containerWidth, preferredWidth) {
            // Use CSS variables for layout values
            const root = typeof window !== 'undefined' ? window.getComputedStyle(document.documentElement) : null;
            const containerPadding = root ? parseFloat(root.getPropertyValue('--ai-rec-container-padding')) : 30;
            const cardMargin = root ? parseFloat(root.getPropertyValue('--ai-rec-card-margin')) : 10;
            const maxUsableWidth = containerWidth - containerPadding;
            const maxElementsOnRow = Math.ceil(maxUsableWidth / preferredWidth);
            const width = maxUsableWidth / maxElementsOnRow - cardMargin;
            calculateCardWidth._last = { maxElementsOnRow, preferredWidth, width, containerWidth };
            return width;
        }
        function useContainerDimensions(sensitivityThreshold = 20) {
            const target = useRef(null);
            const [dimension, setDimension] = useState({ width: 0, height: 0 });
            const debouncedSetDimension = useDebounce((entry) => {
                // SafeGuard against undefined contentBoxSize
                if (!entry.contentBoxSize || !entry.contentBoxSize.length)
                    return;
                const { inlineSize: width, blockSize: height } = entry.contentBoxSize[0];
                let difference = Math.abs(dimension.width - width);
                if (difference > sensitivityThreshold) {
                    setDimension({ width, height });
                }
            }, 50);
            useResizeObserver(target, debouncedSetDimension);
            // Initialize with current size if available
            useEffect(() => {
                if (target.current && dimension.width === 0) {
                    const rect = target.current.getBoundingClientRect();
                    if (rect.width > 0) {
                        setDimension({ width: rect.width, height: rect.height });
                    }
                }
            }, []);
            return [target, dimension];
        }
        function useCardWidth(containerWidth, zoomIndex, zoomWidths) {
            return useMemo(() => {
                // Check for mobile - upstream returns undefined for mobile devices
                const isMobile = window.innerWidth <= 768; // Simple mobile check
                if (isMobile)
                    return undefined;
                // Provide a reasonable fallback if container width is not yet measured
                // Upstream measures a parent whose visual width includes the row's negative margins expanding into outer padding.
                // Our ref is on the .row itself (content box not enlarged by negative margins). Add 30px (15px each side) so
                // the effective width fed to the algorithm matches native measurement and prevents an extra trailing gap.
                const effectiveWidth = (containerWidth ? containerWidth : 1200); // use raw row width; padding provided by outer wrapper
                if (zoomIndex === undefined || zoomIndex < 0 || zoomIndex >= zoomWidths.length) {
                    return undefined; // Return undefined instead of empty return
                }
                const preferredCardWidth = zoomWidths[zoomIndex];
                return calculateCardWidth(effectiveWidth, preferredCardWidth);
            }, [containerWidth, zoomIndex, zoomWidths]);
        }
        const { NavLink } = PluginApi.libraries.ReactRouterDOM || {};
        const Bootstrap = PluginApi.libraries.Bootstrap || {};
        const Button = Bootstrap.Button || ((p) => React.createElement('button', p, p.children));
        const ROUTE = '/plugins/recommended-scenes';
        const RECOMMENDATION_CONTEXT = 'global_feed';
        const LS_PER_PAGE_KEY = 'aiRec.perPage';
        const LS_ZOOM_KEY = 'aiRec.zoom';
        const LS_PAGE_KEY = 'aiRec.page';
        // All scenes arrive hydrated from backend recommender query.
        function log(...args) { if (w.AIDebug)
            console.log('[RecommendedScenes]', ...args); }
        function warn(...args) { if (w.AIDebug)
            console.warn('[RecommendedScenes]', ...args); }
        function normalizeScene(sc) {
            if (!sc || typeof sc !== 'object')
                return undefined;
            const arrayFields = ['performers', 'tags', 'markers', 'scene_markers', 'galleries', 'images', 'files', 'groups'];
            arrayFields.forEach(f => { if (sc[f] == null)
                sc[f] = [];
            else if (!Array.isArray(sc[f]))
                sc[f] = [sc[f]].filter(Boolean); });
            if (!sc.studio)
                sc.studio = null;
            if (sc.rating100 == null && typeof sc.rating === 'number')
                sc.rating100 = sc.rating * 20;
            if (sc.rating == null && typeof sc.rating100 === 'number')
                sc.rating = Math.round(sc.rating100 / 20);
            return sc;
        }
        //
        // Interaction Tracking (Usage Example Only - non-invasive):
        // After rendering a scene detail or when user navigates to one, you can call:
        //   (window as any).stashAIInteractionTracker?.trackSceneView(String(sceneId), { title: scene.title });
        // If you have access to the HTMLVideoElement of the scene playback you can instrument it once:
        //   const videoEl = document.querySelector('video');
        //   (window as any).stashAIInteractionTracker?.instrumentSceneVideo(String(sceneId), videoEl as HTMLVideoElement);
        // This file does not automatically track to avoid assumptions about when a scene detail view is active.
        // Integrations should be placed where the actual scene detail/player component mounts.
        //
        const RecommendedScenesPage = () => {
            var _a, _b, _c, _d;
            function readInitial(key, urlParam, fallback) {
                try {
                    const usp = new URLSearchParams(location.search);
                    const v = usp.get(urlParam);
                    if (v != null) {
                        const n = parseInt(v, 10);
                        if (!isNaN(n))
                            return n;
                    }
                }
                catch (_) { }
                try {
                    const raw = localStorage.getItem(key);
                    if (raw != null) {
                        const n = parseInt(raw, 10);
                        if (!isNaN(n))
                            return n;
                    }
                }
                catch (_) { }
                return fallback;
            }
            //
            const [recommenders, setRecommenders] = useState(null);
            const [recommenderId, setRecommenderId] = useState(null);
            const [zoomIndex, setZoomIndex] = useState(() => readInitial(LS_ZOOM_KEY, 'z', 1));
            const [itemsPerPage, setItemsPerPage] = useState(() => readInitial(LS_PER_PAGE_KEY, 'perPage', 40));
            const [page, setPage] = useState(() => readInitial(LS_PAGE_KEY, 'p', 1));
            // Scenes for current page only (server paginated)
            const [scenes, setScenes] = useState([]);
            const [total, setTotal] = useState(0);
            const [loading, setLoading] = useState(false);
            const [hasMore, setHasMore] = useState(false);
            const [error, setError] = useState(null);
            const zoomWidths = [280, 340, 480, 640];
            const [componentRef, { width: containerWidth }] = useContainerDimensions();
            const cardWidth = useCardWidth(containerWidth, zoomIndex, zoomWidths);
            // fetch IDs (mock until new backend recommender query flow integrated)
            //
            const [discoveryAttempted, setDiscoveryAttempted] = useState(false);
            const pageAPI = w.AIPageContext; // for contextual recommendation requests
            // ---------------- Config State (per recommender) -----------------
            const [configValues, setConfigValues] = useState({});
            const configCacheRef = useRef({});
            const configValuesRef = useRef({});
            const LS_SHOW_CONFIG_KEY = 'aiRec.showConfig';
            function readShowConfigRec() { try {
                const raw = localStorage.getItem(LS_SHOW_CONFIG_KEY);
                if (raw == null)
                    return true;
                return raw === '1' || raw === 'true';
            }
            catch (_) {
                return true;
            } }
            const [showConfig, setShowConfig] = useState(() => readShowConfigRec());
            useEffect(() => {
                function onStorage(e) { try {
                    if (e.key === LS_SHOW_CONFIG_KEY) {
                        const v = e.newValue;
                        const next = v === '1' || v === 'true';
                        setShowConfig(next);
                    }
                }
                catch (_) { } }
                function onCustom(ev) { try {
                    if (ev && ev.detail !== undefined)
                        setShowConfig(Boolean(ev.detail));
                }
                catch (_) { } }
                window.addEventListener('storage', onStorage);
                window.addEventListener('aiRec.showConfig', onCustom);
                return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('aiRec.showConfig', onCustom); };
            }, []);
            function toggleShowConfigRec() { const next = !showConfig; try {
                localStorage.setItem(LS_SHOW_CONFIG_KEY, next ? '1' : '0');
            }
            catch (_) { } try {
                window.dispatchEvent(new CustomEvent('aiRec.showConfig', { detail: next }));
            }
            catch (_) { } setShowConfig(next); }
            // Generic tick to force config panel rerender (for tag mode changes)
            const [configRerenderTick, setConfigRerenderTick] = useState(0);
            function forceConfigRerender() { setConfigRerenderTick((t) => t + 1); }
            const textDebounceTimersRef = useRef({});
            const compositeRawRef = useRef({}); // raw text for tags/performers inputs
            useEffect(() => { configValuesRef.current = configValues; }, [configValues]);
            const currentRecommender = React.useMemo(() => { var _a; return (_a = (recommenders || [])) === null || _a === void 0 ? void 0 : _a.find((r) => r.id === recommenderId); }, [recommenders, recommenderId]);
            const preferenceSaveTimerRef = useRef(null);
            const lastPersistedSnapshotRef = useRef(null);
            const serverSeedConfigRef = useRef({});
            const backendBaseRef = useRef('');
            useEffect(() => {
                return () => {
                    if (preferenceSaveTimerRef.current) {
                        clearTimeout(preferenceSaveTimerRef.current);
                    }
                };
            }, []);
            function sanitizeConfigPayload(config) {
                const out = {};
                if (config && typeof config === 'object') {
                    Object.keys(config).forEach((key) => {
                        const value = config[key];
                        if (value !== undefined) {
                            out[key] = value;
                        }
                    });
                }
                return out;
            }
            function shouldPersistField(field) {
                if (!field)
                    return true;
                if (typeof field.persist === 'undefined')
                    return true;
                return Boolean(field.persist);
            }
            function isFieldPersistable(definition, fieldName) {
                if (!definition || !Array.isArray(definition.config))
                    return false;
                const field = definition.config.find((f) => f.name === fieldName);
                if (!field)
                    return false;
                return shouldPersistField(field);
            }
            function buildPersistableConfig(definition, values) {
                if (!definition || !Array.isArray(definition.config))
                    return {};
                const out = {};
                definition.config.forEach((field) => {
                    if (!shouldPersistField(field))
                        return;
                    if (values && Object.prototype.hasOwnProperty.call(values, field.name)) {
                        const value = values[field.name];
                        if (value !== undefined) {
                            out[field.name] = value;
                        }
                    }
                });
                return out;
            }
            const persistPreference = React.useCallback(async () => {
                const base = backendBaseRef.current;
                if (!base || !recommenderId || !currentRecommender)
                    return;
                const persistable = sanitizeConfigPayload(buildPersistableConfig(currentRecommender, configValuesRef.current || {}));
                const payload = {
                    context: RECOMMENDATION_CONTEXT,
                    recommenderId,
                    config: persistable,
                };
                const signature = JSON.stringify(payload);
                if (lastPersistedSnapshotRef.current === signature) {
                    return;
                }
                try {
                    const url = `${base}/api/v1/recommendations/preferences`;
                    await fetch(url, withSharedKeyHeaders({
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }));
                    lastPersistedSnapshotRef.current = signature;
                }
                catch (err) {
                    warn('Failed to persist recommender preference', err);
                }
            }, [recommenderId, currentRecommender, withSharedKeyHeaders]);
            const schedulePreferencePersist = React.useCallback((reason, opts) => {
                if (!backendBaseRef.current || !recommenderId || !currentRecommender)
                    return;
                const delay = reason === 'recommender' ? 25 : ((opts === null || opts === void 0 ? void 0 : opts.debounce) ? 800 : 220);
                if (preferenceSaveTimerRef.current) {
                    clearTimeout(preferenceSaveTimerRef.current);
                }
                preferenceSaveTimerRef.current = setTimeout(() => {
                    preferenceSaveTimerRef.current = null;
                    persistPreference();
                }, delay);
            }, [recommenderId, currentRecommender, persistPreference]);
            // ---------------- Tag Include/Exclude Selector (Unified) -----------------
            // Sole implementation: single bar with inline mode toggle (+ include / - exclude) and chips inline.
            // Enhanced Constraint Editor Component with auto-save and advanced co-occurrence support
            function ConstraintEditor({ tagId, constraint, tagName, value, fieldName, onSave, onCancel, allowedConstraintTypes, entity: popupEntity }) {
                const [localConstraint, setLocalConstraint] = React.useState(constraint);
                // Local name lookup helper (ConstraintEditor is defined before the outer lookupName),
                // uses the same compositeRawRef maps keyed by fieldName
                function lookupLocalName(id, forEntity) {
                    const ent = forEntity || popupEntity || 'tag';
                    const key = fieldName + '__' + (ent === 'performer' ? 'performerNameMap' : 'tagNameMap');
                    const map = compositeRawRef.current[key] || {};
                    return map[id] || (ent === 'performer' ? `Performer ${id}` : `Tag ${id}`);
                }
                // Reset local state when constraint prop changes (e.g., when switching constraint types)
                React.useEffect(() => {
                    setLocalConstraint(constraint);
                }, [constraint]);
                const allConstraintTypes = [
                    { value: 'presence', label: 'Include/Exclude' },
                    { value: 'duration', label: 'Duration Filter' },
                    { value: 'overlap', label: 'Co-occurrence' },
                    { value: 'importance', label: 'Importance Weight' }
                ];
                // If the backend supplied allowedConstraintTypes, filter available types accordingly
                const constraintTypes = Array.isArray(allowedConstraintTypes) && allowedConstraintTypes.length > 0
                    ? allConstraintTypes.filter(ct => allowedConstraintTypes.includes(ct.value))
                    : allConstraintTypes;
                // Memoize expensive tag computations for overlap constraint
                const overlapTagData = React.useMemo(() => {
                    if (localConstraint.type !== 'overlap')
                        return { allCoOccurrencePrimaries: new Set(), availableTags: [] };
                    // Get all currently selected tags (include + exclude) for co-occurrence selection
                    // Exclude primary tags from other co-occurrence groups
                    const allCoOccurrencePrimaries = new Set();
                    [...((value === null || value === void 0 ? void 0 : value.include) || []), ...((value === null || value === void 0 ? void 0 : value.exclude) || [])].forEach(id => {
                        var _a, _b;
                        const constraint = ((value === null || value === void 0 ? void 0 : value.constraints) || {})[id] || { type: 'presence' };
                        if (constraint.type === 'overlap' && ((_b = (_a = constraint.overlap) === null || _a === void 0 ? void 0 : _a.coTags) === null || _b === void 0 ? void 0 : _b.length) > 0 && id !== tagId) {
                            allCoOccurrencePrimaries.add(id);
                        }
                    });
                    const entity = popupEntity || localConstraint._entity || 'tag';
                    const availableTags = [...((value === null || value === void 0 ? void 0 : value.include) || []), ...((value === null || value === void 0 ? void 0 : value.exclude) || [])]
                        .filter(id => id !== tagId && !allCoOccurrencePrimaries.has(id));
                    return { allCoOccurrencePrimaries, availableTags };
                }, [localConstraint.type, value === null || value === void 0 ? void 0 : value.include, value === null || value === void 0 ? void 0 : value.exclude, value === null || value === void 0 ? void 0 : value.constraints, tagId]);
                function handleTypeChange(newType) {
                    let newConstraint = { type: newType };
                    // Initialize default values for each constraint type
                    switch (newType) {
                        case 'presence':
                            newConstraint.presence = 'include';
                            break;
                        case 'duration':
                            newConstraint.duration = { min: 10, max: 60, unit: 'percent' };
                            break;
                        case 'overlap':
                            newConstraint.overlap = { minDuration: 5, maxDuration: 30, unit: 'percent' };
                            break;
                        case 'importance':
                            newConstraint.importance = 0.5;
                            break;
                    }
                    setLocalConstraint(newConstraint);
                }
                function renderOptions() {
                    var _a, _b, _c, _d, _e, _f, _g;
                    switch (localConstraint.type) {
                        case 'presence':
                            return React.createElement('div', { className: 'constraint-options' }, [
                                React.createElement('label', { key: 'label' }, 'Mode: '),
                                React.createElement('select', {
                                    key: 'select',
                                    value: localConstraint.presence || 'include',
                                    onChange: (e) => setLocalConstraint((prev) => ({ ...prev, presence: e.target.value }))
                                }, [
                                    React.createElement('option', { key: 'inc', value: 'include' }, 'Include'),
                                    React.createElement('option', { key: 'exc', value: 'exclude' }, 'Exclude')
                                ])
                            ]);
                        case 'duration':
                            return React.createElement('div', { className: 'constraint-options' }, [
                                React.createElement('div', { key: 'range' }, [
                                    React.createElement('label', { key: 'label' }, 'Duration: '),
                                    React.createElement('input', {
                                        key: 'min', type: 'number', placeholder: 'Min',
                                        value: ((_a = localConstraint.duration) === null || _a === void 0 ? void 0 : _a.min) || '',
                                        onChange: (e) => setLocalConstraint((prev) => ({
                                            ...prev,
                                            duration: { ...prev.duration, min: e.target.value ? Number(e.target.value) : undefined }
                                        }))
                                    }),
                                    React.createElement('span', { key: 'dash' }, ' - '),
                                    React.createElement('input', {
                                        key: 'max', type: 'number', placeholder: 'Max',
                                        value: ((_b = localConstraint.duration) === null || _b === void 0 ? void 0 : _b.max) || '',
                                        onChange: (e) => setLocalConstraint((prev) => ({
                                            ...prev,
                                            duration: { ...prev.duration, max: e.target.value ? Number(e.target.value) : undefined }
                                        }))
                                    })
                                ]),
                                React.createElement('div', { key: 'unit' }, [
                                    React.createElement('label', { key: 'label' }, 'Unit: '),
                                    React.createElement('select', {
                                        key: 'select',
                                        value: ((_c = localConstraint.duration) === null || _c === void 0 ? void 0 : _c.unit) || 'percent',
                                        onChange: (e) => setLocalConstraint((prev) => ({
                                            ...prev,
                                            duration: { ...prev.duration, unit: e.target.value }
                                        }))
                                    }, [
                                        React.createElement('option', { key: 'pct', value: 'percent' }, '% of video'),
                                        React.createElement('option', { key: 'sec', value: 'seconds' }, 'Seconds')
                                    ])
                                ])
                            ]);
                        case 'overlap':
                            // Use memoized tag data to avoid expensive recomputation on every render
                            const { availableTags } = overlapTagData;
                            const selectedCoTags = ((_d = localConstraint.overlap) === null || _d === void 0 ? void 0 : _d.coTags) || [];
                            const entity = popupEntity || localConstraint._entity || 'tag';
                            return React.createElement('div', { className: 'constraint-options' }, [
                                React.createElement('div', { key: 'info' }, `Co-occurrence with other selected ${entity === 'performer' ? 'performers' : 'tags'}`),
                                React.createElement('div', { key: 'tags-section' }, [
                                    React.createElement('label', { key: 'label' }, 'Selected for co-occurrence: '),
                                    React.createElement('div', { key: 'selected-tags', className: 'constraint-selected-tags' }, selectedCoTags.length > 0 ? selectedCoTags.map((coTagId) => {
                                        const coTagName = lookupLocalName(coTagId, entity);
                                        return React.createElement('span', {
                                            key: coTagId,
                                            className: 'constraint-cochip-tag'
                                        }, [
                                            coTagName,
                                            React.createElement('button', {
                                                key: 'remove',
                                                onClick: () => {
                                                    const newCoTags = selectedCoTags.filter((id) => id !== coTagId);
                                                    setLocalConstraint((prev) => ({
                                                        ...prev,
                                                        overlap: { ...prev.overlap, coTags: newCoTags }
                                                    }));
                                                },
                                                className: 'constraint-cochip-remove'
                                            }, '×')
                                        ]);
                                    }) : React.createElement('span', { className: 'constraint-selected-empty' }, 'No tags selected for co-occurrence')),
                                    availableTags.length > 0 ? React.createElement('div', { key: 'available-tags', className: 'constraint-available-tags' }, availableTags.map((coTagId) => {
                                        const coTagName = lookupLocalName(coTagId, entity);
                                        const isSelected = selectedCoTags.includes(coTagId);
                                        if (isSelected)
                                            return null; // Don't show already selected tags
                                        return React.createElement('button', {
                                            key: coTagId,
                                            onClick: () => {
                                                const newCoTags = [...selectedCoTags, coTagId];
                                                setLocalConstraint((prev) => ({
                                                    ...prev,
                                                    overlap: { ...prev.overlap, coTags: newCoTags }
                                                }));
                                            },
                                            className: 'constraint-tag-button'
                                        }, coTagName);
                                    })) : null
                                ]),
                                React.createElement('div', { key: 'range' }, [
                                    React.createElement('label', { key: 'label' }, 'Overlap duration: '),
                                    React.createElement('input', {
                                        key: 'min', type: 'number', placeholder: 'Min',
                                        value: ((_e = localConstraint.overlap) === null || _e === void 0 ? void 0 : _e.minDuration) || '',
                                        onChange: (e) => setLocalConstraint((prev) => ({
                                            ...prev,
                                            overlap: { ...prev.overlap, minDuration: e.target.value ? Number(e.target.value) : undefined }
                                        }))
                                    }),
                                    React.createElement('span', { key: 'dash' }, ' - '),
                                    React.createElement('input', {
                                        key: 'max', type: 'number', placeholder: 'Max',
                                        value: ((_f = localConstraint.overlap) === null || _f === void 0 ? void 0 : _f.maxDuration) || '',
                                        onChange: (e) => setLocalConstraint((prev) => ({
                                            ...prev,
                                            overlap: { ...prev.overlap, maxDuration: e.target.value ? Number(e.target.value) : undefined }
                                        }))
                                    })
                                ]),
                                React.createElement('div', { key: 'unit' }, [
                                    React.createElement('label', { key: 'label' }, 'Unit: '),
                                    React.createElement('select', {
                                        key: 'select',
                                        value: ((_g = localConstraint.overlap) === null || _g === void 0 ? void 0 : _g.unit) || 'percent',
                                        onChange: (e) => setLocalConstraint((prev) => ({
                                            ...prev,
                                            overlap: { ...prev.overlap, unit: e.target.value }
                                        }))
                                    }, [
                                        React.createElement('option', { key: 'pct', value: 'percent' }, '% of video'),
                                        React.createElement('option', { key: 'sec', value: 'seconds' }, 'Seconds')
                                    ])
                                ])
                            ]);
                        case 'importance':
                            return React.createElement('div', { className: 'constraint-options' }, [
                                React.createElement('label', { key: 'label' }, 'Weight (0.0 - 1.0): '),
                                React.createElement('input', {
                                    key: 'input', type: 'number', step: '0.1', min: '0', max: '1',
                                    value: localConstraint.importance || 0.5,
                                    onChange: (e) => setLocalConstraint((prev) => ({ ...prev, importance: Number(e.target.value) }))
                                })
                            ]);
                        default:
                            return null;
                    }
                }
                // Auto-save on unmount (click-out) without saving on every change
                const localConstraintRef = React.useRef(localConstraint);
                const canceledRef = React.useRef(false);
                React.useEffect(() => { localConstraintRef.current = localConstraint; }, [localConstraint]);
                React.useEffect(() => {
                    // save once on unmount unless canceled via Escape
                    return () => {
                        try {
                            if (!canceledRef.current)
                                onSave(localConstraintRef.current);
                        }
                        catch (e) { }
                    };
                }, [onSave]);
                React.useEffect(() => {
                    function onKey(e) { if (e.key === 'Escape') {
                        canceledRef.current = true;
                        onCancel();
                    } }
                    document.addEventListener('keydown', onKey);
                    return () => document.removeEventListener('keydown', onKey);
                }, [onCancel]);
                return React.createElement('div', { className: 'constraint-popup' }, [
                    React.createElement('div', { key: 'title', className: 'constraint-title' }, `Configure: ${tagName}`),
                    React.createElement('div', { key: 'type', className: 'constraint-type' }, [
                        React.createElement('label', { key: 'label' }, 'Type: '),
                        React.createElement('select', {
                            key: 'select',
                            value: localConstraint.type,
                            onChange: (e) => handleTypeChange(e.target.value)
                        }, constraintTypes.map(ct => React.createElement('option', { key: ct.value, value: ct.value }, ct.label)))
                    ]),
                    renderOptions(),
                    React.createElement('div', { key: 'actions', className: 'constraint-actions' }, [
                        React.createElement('button', {
                            key: 'save',
                            className: 'btn-constraint btn-save',
                            onClick: (e) => {
                                e.stopPropagation();
                                onSave(localConstraint);
                            },
                            title: 'Save changes'
                        }, 'Save')
                    ])
                ]);
            }
            const TagIncludeExclude = ({ value, onChange, fieldName, initialTagCombination, allowedConstraintTypes, allowedCombinationModes, entity = 'tag' }) => {
                const v = value || {};
                const include = Array.isArray(v) ? v : Array.isArray(v.include) ? v.include : [];
                const exclude = Array.isArray(v) ? [] : Array.isArray(v.exclude) ? v.exclude : [];
                // Enhanced value structure for constraints
                const constraints = v.constraints || {};
                // Use React state instead of ref-based state to avoid focus issues
                // Determine allowed combination modes: default to ['and','or'] unless field restricts.
                // Normalize and resolve allowed modes: prefer explicit allowedCombinationModes; else use initialTagCombination; else default ['and','or'].
                const normalizeMode = (m) => (m == null ? undefined : String(m).toLowerCase());
                const allowedNorm = Array.isArray(allowedCombinationModes) && allowedCombinationModes.length > 0
                    ? allowedCombinationModes.map(normalizeMode).filter(Boolean)
                    : [];
                const initLC = typeof initialTagCombination === 'string' ? normalizeMode(initialTagCombination) : undefined;
                const resolvedAllowedModes = (allowedNorm.length > 0 ? allowedNorm : (typeof initLC !== 'undefined' ? [initLC] : ['and', 'or']));
                // Determine initial mode from provided value or defaults; treat null/undefined/invalid as first allowed.
                const rawValueMode = (v && Object.prototype.hasOwnProperty.call(v, 'tag_combination')) ? v.tag_combination : undefined;
                const valueMode = normalizeMode(rawValueMode);
                const isValidMode = (m) => m === 'and' || m === 'or' || m === 'not-applicable';
                const initialMode = (isValidMode(valueMode) ? valueMode : (isValidMode(initLC) ? initLC : resolvedAllowedModes[0]));
                const [searchState, setSearchState] = React.useState({
                    search: '',
                    suggestions: [],
                    loading: false,
                    error: null,
                    showDropdown: false,
                    combinationMode: initialMode
                });
                // Debug: log initial props and resolved modes to help diagnose behavior
                // (Debug log removed)
                // Instance id for coordinating dropdowns between multiple tag selectors on the page
                const instanceIdRef = React.useRef(null);
                if (!instanceIdRef.current) {
                    try {
                        w.__aiTagFallbackCounter = (w.__aiTagFallbackCounter || 0) + 1;
                        instanceIdRef.current = w.__aiTagFallbackCounter;
                    }
                    catch (e) {
                        instanceIdRef.current = Math.floor(Math.random() * 1000000);
                    }
                }
                // When any instance opens, other instances should close their dropdowns
                React.useEffect(() => {
                    function onOtherOpen(ev) {
                        try {
                            const otherId = ev && ev.detail && ev.detail.id;
                            const myId = instanceIdRef.current;
                            if (w.AIDebug) {
                                console.log('[TagFallback] Received open event. Other ID:', otherId, 'My ID:', myId);
                            }
                            if (otherId && otherId !== myId) {
                                if (w.AIDebug) {
                                    console.log('[TagFallback] Closing dropdown for instance', myId);
                                }
                                setSearchState((prev) => ({ ...prev, showDropdown: false }));
                            }
                        }
                        catch (e) {
                            if (w.AIDebug) {
                                console.warn('[TagFallback] Error handling open event:', e);
                            }
                        }
                    }
                    document.addEventListener('ai-tag-fallback-open', onOtherOpen);
                    return () => document.removeEventListener('ai-tag-fallback-open', onOtherOpen);
                }, []);
                // Sync combinationMode from external value changes (persisted value may arrive asynchronously)
                React.useEffect(() => {
                    const externalModeRaw = v && Object.prototype.hasOwnProperty.call(v, 'tag_combination') ? v.tag_combination : undefined;
                    const externalMode = normalizeMode(externalModeRaw);
                    if (externalMode && externalMode !== searchState.combinationMode && (externalMode === 'and' || externalMode === 'or' || externalMode === 'not-applicable')) {
                        setSearchState((prev) => ({ ...prev, combinationMode: externalMode }));
                        if (w.AIDebug) {
                            console.log('[TagFallback] synced combinationMode from value:', externalMode);
                        }
                    }
                }, [v && v.tag_combination]);
                const [constraintPopup, setConstraintPopup] = React.useState(null);
                const nameMapKey = fieldName + '__' + (entity === 'performer' ? 'performerNameMap' : 'tagNameMap');
                if (!compositeRawRef.current[nameMapKey]) {
                    compositeRawRef.current[nameMapKey] = {};
                }
                const tagNameMap = compositeRawRef.current[nameMapKey];
                // Helper to look up a name for an id for a given entity
                function lookupName(id, forEntity) {
                    const ent = forEntity || entity || 'tag';
                    const key = fieldName + '__' + (ent === 'performer' ? 'performerNameMap' : 'tagNameMap');
                    const map = compositeRawRef.current[key] || {};
                    return map[id] || (ent === 'performer' ? `Performer ${id}` : `Tag ${id}`);
                }
                const debounceTimerRef = React.useRef(null);
                function removeTag(id, list) {
                    const nextInclude = list === 'include' ? include.filter((i) => i !== id) : include;
                    const nextExclude = list === 'exclude' ? exclude.filter((i) => i !== id) : exclude;
                    // Also remove constraints for this tag
                    const nextConstraints = { ...constraints };
                    delete nextConstraints[id];
                    onChange({ include: nextInclude, exclude: nextExclude, constraints: nextConstraints, tag_combination: searchState.combinationMode });
                }
                function updateTagConstraint(tagId, constraint) {
                    const nextConstraints = { ...constraints };
                    let nextInclude = [...include];
                    let nextExclude = [...exclude];
                    nextConstraints[tagId] = constraint;
                    // If this is overlap with coTags, make sure those co-occurrence tags are included so they get hydrated
                    if (constraint.type === 'overlap' && constraint.overlap && constraint.overlap.coTags) {
                        constraint.overlap.coTags.forEach((coTagId) => {
                            if (!nextInclude.includes(coTagId) && !nextExclude.includes(coTagId)) {
                                nextInclude.push(coTagId);
                            }
                        });
                    }
                    // If this is a presence constraint, ensure tag is placed in the right set and removed from the other
                    if (constraint.type === 'presence') {
                        // remove from both then add to the selected list
                        nextInclude = nextInclude.filter(id => id !== tagId);
                        nextExclude = nextExclude.filter(id => id !== tagId);
                        if (constraint.presence === 'exclude') {
                            nextExclude.push(tagId);
                        }
                        else {
                            nextInclude.push(tagId);
                        }
                        // store constraint and persist
                        nextConstraints[tagId] = constraint;
                        onChange({ include: nextInclude, exclude: nextExclude, constraints: nextConstraints, tag_combination: searchState.combinationMode });
                        return;
                    }
                    // If this is an overlap constraint with coTags, remove those coTags from include/exclude lists
                    if (constraint.type === 'overlap' && constraint.overlap && constraint.overlap.coTags) {
                        const coTags = constraint.overlap.coTags;
                        nextInclude = nextInclude.filter(id => !coTags.includes(id));
                        nextExclude = nextExclude.filter(id => !coTags.includes(id));
                        // Also remove constraints for the co-occurrence tags since they're now part of this tag's constraint
                        coTags.forEach((coTagId) => {
                            delete nextConstraints[coTagId];
                        });
                    }
                    if (w.AIDebug) {
                        console.log('New constraints object:', { include: nextInclude, exclude: nextExclude, constraints: nextConstraints });
                    }
                    // Ensure primary tag is present in include list for non-presence constraints
                    if (!nextInclude.includes(tagId) && !nextExclude.includes(tagId)) {
                        nextInclude.push(tagId);
                    }
                    onChange({ include: nextInclude, exclude: nextExclude, constraints: nextConstraints, tag_combination: searchState.combinationMode });
                }
                function getTagConstraint(tagId) {
                    const constraint = constraints[tagId] || { type: 'presence', presence: include.includes(tagId) ? 'include' : 'exclude' };
                    if (w.AIDebug) {
                        console.log('Getting constraint for tag', tagId, ':', constraint);
                    }
                    return constraint;
                }
                function showConstraintPopup(tagId, event, popupEntity) {
                    const rect = event.target.getBoundingClientRect();
                    setConstraintPopup({
                        tagId,
                        entity: popupEntity || entity,
                        position: { x: rect.left, y: rect.bottom + 5 }
                    });
                    event.stopPropagation();
                }
                // Use a ref for the tag input for focus and positioning
                const tagInputRef = React.useRef(null);
                function addTag(id, name) {
                    const supportsPresence = !Array.isArray(allowedConstraintTypes) || allowedConstraintTypes.length === 0 || allowedConstraintTypes.includes('presence');
                    if (!supportsPresence) {
                        const preferredType = (Array.isArray(allowedConstraintTypes) && allowedConstraintTypes.length > 0) ? allowedConstraintTypes[0] : 'overlap';
                        const init = { type: preferredType };
                        if (preferredType === 'presence')
                            init.presence = 'include';
                        if (preferredType === 'duration')
                            init.duration = { min: 10, max: 60, unit: 'percent' };
                        if (preferredType === 'overlap')
                            init.overlap = { minDuration: 5, maxDuration: 30, unit: 'percent', coTags: [] };
                        if (preferredType === 'importance')
                            init.importance = 0.5;
                        let position = { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 80 };
                        if (tagInputRef.current) {
                            const rect = tagInputRef.current.getBoundingClientRect();
                            position = { x: rect.left, y: rect.bottom + 5 };
                        }
                        setConstraintPopup({
                            tagId: id,
                            entity: entity,
                            position,
                            initialConstraint: init
                        });
                        if (name)
                            tagNameMap[id] = name;
                        return;
                    }
                    if (!include.includes(id) && !exclude.includes(id)) {
                        onChange({ include: [...include, id], exclude, constraints, tag_combination: searchState.combinationMode });
                    }
                    if (name) {
                        tagNameMap[id] = name;
                    }
                    if (debounceTimerRef.current)
                        clearTimeout(debounceTimerRef.current);
                    setSearchState((prev) => ({ ...prev, search: '', suggestions: [], showDropdown: false }));
                }
                function search(term) {
                    if (debounceTimerRef.current)
                        clearTimeout(debounceTimerRef.current);
                    setSearchState((prev) => ({ ...prev, search: term }));
                    const q = term.trim();
                    const immediate = q === '';
                    const run = async () => {
                        var _a, _b, _c, _d;
                        setSearchState((prev) => ({ ...prev, loading: true, error: null }));
                        try {
                            let gql;
                            if (entity === 'performer') {
                                gql = q
                                    ? `query PerformerSuggest($term: String!) { findPerformers(filter: { per_page: 20 }, performer_filter: { name: { value: $term, modifier: INCLUDES } }) { performers { id name } } }`
                                    : `query PerformerSuggest { findPerformers(filter: { per_page: 20 }) { performers { id name } } }`;
                            }
                            else {
                                gql = q
                                    ? `query TagSuggest($term: String!) { findTags(filter: { per_page: 20 }, tag_filter: { name: { value: $term, modifier: INCLUDES } }) { tags { id name } } }`
                                    : `query TagSuggest { findTags(filter: { per_page: 20 }) { tags { id name } } }`;
                            }
                            const variables = q ? { term: q } : {};
                            const res = await fetch('/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: gql, variables }) });
                            if (!res.ok)
                                throw new Error('HTTP ' + res.status);
                            const json = await res.json();
                            if (json.errors) {
                                throw new Error(json.errors.map((e) => e.message).join('; '));
                            }
                            const suggestions = entity === 'performer' ? (((_b = (_a = json === null || json === void 0 ? void 0 : json.data) === null || _a === void 0 ? void 0 : _a.findPerformers) === null || _b === void 0 ? void 0 : _b.performers) || []) : (((_d = (_c = json === null || json === void 0 ? void 0 : json.data) === null || _c === void 0 ? void 0 : _c.findTags) === null || _d === void 0 ? void 0 : _d.tags) || []);
                            // populate name map so other UI (co-occurrence chips, popups) shows proper names
                            try {
                                suggestions.forEach((s) => { const sid = parseInt(s.id, 10); if (!isNaN(sid))
                                    tagNameMap[sid] = s.name; });
                            }
                            catch (e) { }
                            setSearchState((prev) => ({ ...prev, suggestions, loading: false, error: suggestions.length ? null : null }));
                        }
                        catch (e) {
                            setSearchState((prev) => ({ ...prev, error: 'Search failed', loading: false }));
                        }
                    };
                    if (immediate) {
                        run();
                    }
                    else {
                        debounceTimerRef.current = setTimeout(run, 200);
                    }
                }
                function onInputFocus() {
                    if (!searchState.showDropdown) {
                        try {
                            document.dispatchEvent(new CustomEvent('ai-tag-fallback-open', { detail: { id: instanceIdRef.current } }));
                        }
                        catch (e) { }
                        setSearchState((prev) => ({ ...prev, showDropdown: true }));
                        if (!searchState.suggestions.length && !searchState.loading) {
                            search('');
                        }
                    }
                }
                // Close dropdown when clicking outside
                React.useEffect(() => {
                    function handleClickOutside(event) {
                        const target = event.target;
                        if (!target.closest('.ai-tag-fallback.unified')) {
                            setSearchState((prev) => ({ ...prev, showDropdown: false }));
                        }
                        // Close constraint popup when clicking outside
                        if (!target.closest('.constraint-popup') && !target.closest('.constraint-btn')) {
                            setConstraintPopup(null);
                        }
                    }
                    if (searchState.showDropdown || constraintPopup) {
                        document.addEventListener('click', handleClickOutside);
                        return () => document.removeEventListener('click', handleClickOutside);
                    }
                }, [searchState.showDropdown, constraintPopup]);
                const chips = [];
                const processedOverlapGroups = new Set();
                // Helper function to create co-occurrence group chip
                function createCoOccurrenceChip(primaryId, group, setType, chipEntity = 'tag') {
                    const primaryName = lookupName(primaryId, chipEntity);
                    const coTags = group.coTags || [];
                    const allTagIds = [primaryId, ...coTags];
                    const allTagNames = allTagIds.map((id) => lookupName(id, chipEntity));
                    const min = group.minDuration || 0;
                    const max = group.maxDuration || '∞';
                    const unit = group.unit === 'percent' ? '%' : 's';
                    const chipClass = `tag-chip overlap ${setType}`;
                    const groupKey = allTagIds.sort().join('-');
                    return React.createElement('span', { key: `co-${setType}-${groupKey}`, className: `${chipClass} co-chip` }, [
                        React.createElement('span', { key: 'constraint-prefix', className: 'co-constraint-info' }, `[${min}-${max}${unit}]`),
                        React.createElement('span', { key: 'tags', className: 'co-tags' }, allTagNames.map((name, idx) => React.createElement('span', {
                            key: allTagIds[idx],
                            className: 'co-tag-item'
                        }, [
                            React.createElement('span', { key: 'n', className: 'co-tag-name', title: name }, name),
                            React.createElement('button', {
                                key: 'x',
                                onClick: (e) => {
                                    e.stopPropagation();
                                    const tagIdToRemove = allTagIds[idx];
                                    if (tagIdToRemove === primaryId) {
                                        removeTag(primaryId, setType);
                                    }
                                    else {
                                        const updatedCoTags = coTags.filter((id) => id !== tagIdToRemove);
                                        updateTagConstraint(primaryId, {
                                            type: 'overlap',
                                            overlap: { ...group, coTags: updatedCoTags }
                                        });
                                    }
                                },
                                className: 'co-tag-remove',
                                title: `Remove ${name} from group`
                            }, '×')
                        ]))),
                        React.createElement('span', { key: 'actions', className: 'co-actions' }, [
                            React.createElement('button', {
                                key: 'gear',
                                className: 'constraint-btn',
                                onClick: (e) => showConstraintPopup(primaryId, e, entity),
                                title: 'Configure group constraint'
                            }, '⚙'),
                            React.createElement('button', {
                                key: 'remove-group',
                                onClick: (e) => {
                                    e.stopPropagation();
                                    removeTag(primaryId, setType);
                                },
                                className: 'co-chip-remove',
                                title: 'Remove entire group'
                            }, '×')
                        ])
                    ]);
                }
                include.forEach(id => {
                    const constraint = getTagConstraint(id);
                    // Skip if this tag is part of a co-occurrence group already processed, or if it's ANY overlap constraint
                    if (constraint.type === 'overlap' && constraint.overlap) {
                        const coTags = constraint.overlap.coTags || [];
                        const groupKey = [id, ...coTags].sort().join('-');
                        if (processedOverlapGroups.has(groupKey)) {
                            return; // Skip, already rendered as part of the group
                        }
                        processedOverlapGroups.add(groupKey);
                        chips.push(createCoOccurrenceChip(id, constraint.overlap, 'include', entity));
                        return;
                    }
                    const tagName = lookupName(id, entity);
                    const chipClass = `tag-chip ${constraint.type === 'presence' ? 'include' : constraint.type}`;
                    // Add constraint indicator text
                    let constraintText = '';
                    if (constraint.type === 'duration' && constraint.duration) {
                        const min = constraint.duration.min || 0;
                        const max = constraint.duration.max || '∞';
                        const unit = constraint.duration.unit === 'percent' ? '%' : 's';
                        constraintText = ` [${min}-${max}${unit}]`;
                    }
                    else if (constraint.type === 'importance' && constraint.importance !== undefined) {
                        constraintText = ` [×${constraint.importance.toFixed(1)}]`;
                    }
                    chips.push(React.createElement('span', { key: 'i' + id, className: `${chipClass} tag-chip-flex` }, [
                        React.createElement('span', { key: 'text', className: 'tag-chip-text' }, tagName),
                        constraintText ? React.createElement('span', { key: 'constraint', className: 'tag-chip-constraint' }, constraintText) : null,
                        React.createElement('div', { key: 'actions', className: 'tag-chip-actions' }, [
                            React.createElement('button', { key: 'gear', className: 'constraint-btn', onClick: (e) => showConstraintPopup(id, e, entity), title: 'Configure constraint' }, '⚙'),
                            React.createElement('button', { key: 'x', onClick: (e) => { e.stopPropagation(); removeTag(id, 'include'); }, title: 'Remove', className: 'tag-chip-remove' }, '×')
                        ])
                    ].filter(Boolean)));
                });
                exclude.forEach(id => {
                    const constraint = getTagConstraint(id);
                    // Skip if this tag is part of a co-occurrence group already processed, or if it's ANY overlap constraint
                    if (constraint.type === 'overlap' && constraint.overlap) {
                        const coTags = constraint.overlap.coTags || [];
                        const groupKey = [id, ...coTags].sort().join('-');
                        if (processedOverlapGroups.has(groupKey)) {
                            return; // Skip, already rendered as part of the group
                        }
                        processedOverlapGroups.add(groupKey);
                        chips.push(createCoOccurrenceChip(id, constraint.overlap, 'exclude', entity));
                        return;
                    }
                    const tagName = lookupName(id, entity);
                    const chipClass = `tag-chip ${constraint.type === 'presence' ? 'exclude' : constraint.type}`;
                    // Add constraint indicator text
                    let constraintText = '';
                    if (constraint.type === 'duration' && constraint.duration) {
                        const min = constraint.duration.min || 0;
                        const max = constraint.duration.max || '∞';
                        const unit = constraint.duration.unit === 'percent' ? '%' : 's';
                        constraintText = ` [${min}-${max}${unit}]`;
                    }
                    else if (constraint.type === 'importance' && constraint.importance !== undefined) {
                        constraintText = ` [×${constraint.importance.toFixed(1)}]`;
                    }
                    // Use consistent spacing - all constraints get the same padding
                    chips.push(React.createElement('span', { key: 'e' + id, className: `${chipClass} tag-chip-flex` }, [
                        React.createElement('span', { key: 'text', className: 'tag-chip-text' }, tagName),
                        constraintText ? React.createElement('span', { key: 'constraint', className: 'tag-chip-constraint' }, constraintText) : null,
                        React.createElement('div', { key: 'actions', className: 'tag-chip-actions' }, [
                            React.createElement('button', { key: 'gear', className: 'constraint-btn', onClick: (e) => showConstraintPopup(id, e, entity), title: 'Configure constraint' }, '⚙'),
                            React.createElement('button', { key: 'x', onClick: (e) => { e.stopPropagation(); removeTag(id, 'exclude'); }, title: 'Remove', className: 'tag-chip-remove' }, '×')
                        ])
                    ].filter(Boolean)));
                });
                const suggestionsList = (searchState.showDropdown || searchState.search) && (searchState.suggestions.length || searchState.loading || searchState.error) ? React.createElement('div', { className: 'suggestions-list', key: 'list' }, searchState.loading ? React.createElement('div', { className: 'empty-suggest' }, 'Searching…') :
                    searchState.error ? React.createElement('div', { className: 'empty-suggest' }, searchState.error) :
                        searchState.suggestions.length ? searchState.suggestions.map((tg) => React.createElement('div', { key: tg.id, onClick: (e) => { e.stopPropagation(); addTag(parseInt(tg.id, 10), tg.name); } }, tg.name + ' (#' + tg.id + ')')) :
                            React.createElement('div', { className: 'empty-suggest' }, 'No matches')) : null;
                function onKeyDown(e) {
                    if (e.key === 'Enter') {
                        if (searchState.suggestions.length) {
                            const firstTag = searchState.suggestions[0];
                            addTag(parseInt(firstTag.id, 10), firstTag.name);
                            e.preventDefault();
                            return;
                        }
                        const raw = searchState.search.trim();
                        if (/^[0-9]+$/.test(raw)) {
                            addTag(parseInt(raw, 10));
                            e.preventDefault();
                            return;
                        }
                    }
                    else if (e.key === 'Backspace' && !searchState.search) {
                        // Remove the last tag from either include or exclude (prefer include first)
                        e.preventDefault();
                        if (include.length) {
                            removeTag(include[include.length - 1], 'include');
                        }
                        else if (exclude.length) {
                            removeTag(exclude[exclude.length - 1], 'exclude');
                        }
                    }
                    else if (e.key === 'Escape') {
                        if (constraintPopup) {
                            setConstraintPopup(null);
                        }
                        else {
                            setSearchState((prev) => ({ ...prev, showDropdown: false, search: '', suggestions: [] }));
                        }
                    }
                }
                // Determine if combination toggle should be shown (show unless 'not-applicable')
                const showCombinationToggle = resolvedAllowedModes.length > 0 && resolvedAllowedModes.every(m => m !== 'not-applicable');
                const toggleClickable = resolvedAllowedModes.length > 1;
                // Debug: log combination toggle visibility
                // (Debug log removed)
                const combinationToggle = showCombinationToggle ? React.createElement('button', {
                    key: 'combo-toggle',
                    type: 'button',
                    className: `combination-toggle ${searchState.combinationMode}${toggleClickable ? '' : ' disabled'}`,
                    disabled: !toggleClickable,
                    onClick: toggleClickable ? (e) => {
                        e.stopPropagation();
                        const currentIdx = resolvedAllowedModes.indexOf(searchState.combinationMode);
                        const nextIdx = (currentIdx + 1) % resolvedAllowedModes.length;
                        const nextMode = resolvedAllowedModes[nextIdx];
                        setSearchState((prev) => ({ ...prev, combinationMode: nextMode }));
                        // Immediately persist the mode change
                        onChange({ include, exclude, constraints, tag_combination: nextMode });
                    } : undefined,
                    title: toggleClickable ? `Toggle combination mode (current: ${searchState.combinationMode})` : `Combination mode: ${searchState.combinationMode} (fixed)`
                }, (searchState.combinationMode ? String(searchState.combinationMode).toUpperCase() : '')) : null;
                // Constraint popup component
                const constraintPopupEl = constraintPopup ? React.createElement('div', {
                    className: 'constraint-popup',
                    style: { left: constraintPopup.position.x + 'px', top: constraintPopup.position.y + 'px' },
                    onClick: (e) => e.stopPropagation()
                }, [
                    React.createElement(ConstraintEditor, {
                        key: 'editor',
                        tagId: constraintPopup.tagId,
                        constraint: constraintPopup.initialConstraint || getTagConstraint(constraintPopup.tagId),
                        tagName: lookupName(constraintPopup.tagId, constraintPopup && constraintPopup.entity),
                        value: v,
                        fieldName: fieldName,
                        entity: constraintPopup.entity,
                        allowedConstraintTypes,
                        onSave: (constraint) => {
                            updateTagConstraint(constraintPopup.tagId, constraint);
                            setConstraintPopup(null);
                        },
                        onCancel: () => setConstraintPopup(null),
                        onClose: () => setConstraintPopup(null)
                    })
                ]) : null;
                return React.createElement('div', {
                    className: 'ai-tag-fallback unified w-100',
                    onClick: () => { if (tagInputRef.current)
                        tagInputRef.current.focus(); }
                }, [
                    combinationToggle,
                    chips.length ? chips : React.createElement('span', { key: 'ph', className: 'text-muted small' }, 'No tags'),
                    React.createElement('input', {
                        key: 'inp',
                        type: 'text',
                        className: 'tag-input',
                        value: searchState.search,
                        placeholder: 'Search tags…',
                        onChange: (e) => search(e.target.value),
                        onKeyDown,
                        onFocus: onInputFocus,
                        onClick: (e) => e.stopPropagation(),
                        ref: tagInputRef
                    }),
                    suggestionsList,
                    constraintPopupEl
                ]);
            };
            // Initialize defaults when recommender changes
            useEffect(() => {
                if (!currentRecommender)
                    return;
                const defs = currentRecommender.config || [];
                const base = {};
                for (const field of defs) {
                    base[field.name] = field.default;
                    if (field.type === 'tags' || field.type === 'performers') {
                        compositeRawRef.current[field.name] = '';
                    }
                }
                const existing = configCacheRef.current[currentRecommender.id];
                let merged = existing ? { ...base, ...existing } : { ...base };
                const seeded = serverSeedConfigRef.current[currentRecommender.id];
                if (seeded) {
                    merged = { ...merged, ...seeded };
                    delete serverSeedConfigRef.current[currentRecommender.id];
                }
                configCacheRef.current[currentRecommender.id] = merged;
                setConfigValues({ ...merged });
                configValuesRef.current = merged;
                schedulePreferencePersist('recommender');
            }, [currentRecommender, schedulePreferencePersist]);
            function scheduleFetchAfterConfigChange(previousPage) {
                // If page changed to 1 because of config change, we rely on page effect; otherwise manual fetch
                if (previousPage === 1) {
                    // manual fetch to reflect immediate change
                    queueMicrotask(() => fetchRecommendations());
                }
            }
            function applyConfigImmediate(update) {
                setConfigValues((v) => { const next = { ...v, ...update }; configValuesRef.current = next; if (recommenderId) {
                    configCacheRef.current[recommenderId] = next;
                } return next; });
            }
            function updateConfigField(name, value, opts) {
                const field = opts === null || opts === void 0 ? void 0 : opts.field;
                const prevPage = page;
                // Debounced text fields: update local state immediately but delay fetch
                if (opts === null || opts === void 0 ? void 0 : opts.debounce) {
                    applyConfigImmediate({ [name]: value });
                    if (textDebounceTimersRef.current[name])
                        clearTimeout(textDebounceTimersRef.current[name]);
                    textDebounceTimersRef.current[name] = setTimeout(() => {
                        // ensure still active recommender
                        scheduleFetchAfterConfigChange(prevPage);
                    }, 400);
                }
                else {
                    applyConfigImmediate({ [name]: value });
                    scheduleFetchAfterConfigChange(prevPage);
                }
                if (currentRecommender && isFieldPersistable(currentRecommender, name)) {
                    schedulePreferencePersist('config', { debounce: !!(opts === null || opts === void 0 ? void 0 : opts.debounce) });
                }
            }
            function parseIdList(raw) {
                return raw.split(',').map(s => s.trim()).filter(s => s.length > 0).map(s => parseInt(s, 10)).filter(n => !isNaN(n) && n >= 0);
            }
            function renderConfigPanel() {
                if (!currentRecommender || !Array.isArray(currentRecommender.config) || !currentRecommender.config.length)
                    return null;
                const defs = currentRecommender.config;
                const rows = defs.map(field => {
                    var _a, _b, _c;
                    const val = configValues[field.name];
                    const id = 'cfg_' + field.name;
                    let control = null;
                    switch (field.type) {
                        case 'number':
                            control = React.createElement('input', { id, type: 'number', className: 'text-input form-control form-control-sm w-num', value: val !== null && val !== void 0 ? val : '', min: field.min, max: field.max, step: field.step || 1, onChange: (e) => updateConfigField(field.name, e.target.value === '' ? null : Number(e.target.value)) });
                            break;
                        case 'slider':
                            control = React.createElement('div', { className: 'range-wrapper' }, [
                                React.createElement('input', { key: 'rng', id, type: 'range', className: 'zoom-slider', value: (_a = val !== null && val !== void 0 ? val : field.default) !== null && _a !== void 0 ? _a : 0, min: field.min, max: field.max, step: field.step || 1, onChange: (e) => updateConfigField(field.name, Number(e.target.value)) }),
                                React.createElement('div', { key: 'val', className: 'range-value' }, String((_b = val !== null && val !== void 0 ? val : field.default) !== null && _b !== void 0 ? _b : 0))
                            ]);
                            break;
                        case 'select':
                        case 'enum':
                            control = React.createElement('select', { id, className: 'input-control form-control form-control-sm w-select w-180', value: (_c = val !== null && val !== void 0 ? val : field.default) !== null && _c !== void 0 ? _c : '', onChange: (e) => updateConfigField(field.name, e.target.value) }, (field.options || []).map((o) => React.createElement('option', { key: o.value, value: o.value }, o.label || o.value)));
                            break;
                        case 'boolean': {
                            // Ensure the checkbox has an accessible description (help) and the visible label is rendered above via labelNode.
                            // Keep the internal switch label empty so the above label (labelNode) is the visible caption
                            control = React.createElement('div', { className: 'custom-control custom-switch' }, [
                                React.createElement('input', { key: 'chk', id, type: 'checkbox', className: 'custom-control-input', checked: !!val, onChange: (e) => updateConfigField(field.name, e.target.checked) }),
                                React.createElement('label', { key: 'lb', htmlFor: id, className: 'custom-control-label' }, '')
                            ]);
                            break;
                        }
                        case 'text':
                            control = React.createElement('input', { id, type: 'text', className: 'text-input form-control form-control-sm w-text w-180', value: val !== null && val !== void 0 ? val : '', placeholder: field.help || '', onChange: (e) => updateConfigField(field.name, e.target.value, { debounce: true, field }) });
                            break;
                        case 'search':
                            control = React.createElement('div', { className: 'clearable-input-group search-term-input w-180' }, [
                                React.createElement('input', { key: 'in', id, type: 'text', className: 'clearable-text-field form-control form-control-sm w-180', value: val !== null && val !== void 0 ? val : '', placeholder: field.help || 'Search…', onChange: (e) => updateConfigField(field.name, e.target.value, { debounce: true, field }) })
                            ]);
                            break;
                        case 'tags': {
                            // Always use custom fallback - no native TagSelect/TagIDSelect components
                            let includeIds = [];
                            let excludeIds = [];
                            let constraints = {};
                            if (Array.isArray(val)) {
                                includeIds = val;
                            }
                            else if (val && typeof val === 'object') {
                                includeIds = Array.isArray(val.include) ? val.include : [];
                                excludeIds = Array.isArray(val.exclude) ? val.exclude : [];
                                constraints = val.constraints || {};
                            }
                            // Custom searchable include/exclude selector with chips.
                            control = React.createElement('div', { className: 'w-tags' }, React.createElement(TagIncludeExclude, {
                                fieldName: field.name,
                                value: { include: includeIds, exclude: excludeIds, constraints, tag_combination: val === null || val === void 0 ? void 0 : val.tag_combination },
                                onChange: (next) => updateConfigField(field.name, next),
                                initialTagCombination: field.tag_combination,
                                allowedConstraintTypes: field.constraint_types,
                                allowedCombinationModes: field.allowed_combination_modes
                            }));
                            break;
                        }
                        case 'performers': {
                            // Use the unified selector for performers (reuses tag selector UI/behavior)
                            let includeIds = [];
                            let excludeIds = [];
                            let constraints = {};
                            if (Array.isArray(val)) {
                                includeIds = val;
                            }
                            else if (val && typeof val === 'object') {
                                includeIds = Array.isArray(val.include) ? val.include : [];
                                excludeIds = Array.isArray(val.exclude) ? val.exclude : [];
                                constraints = val.constraints || {};
                            }
                            control = React.createElement('div', { className: 'w-tags' }, React.createElement(TagIncludeExclude, {
                                fieldName: field.name,
                                value: { include: includeIds, exclude: excludeIds, constraints, tag_combination: val === null || val === void 0 ? void 0 : val.tag_combination },
                                onChange: (next) => updateConfigField(field.name, next),
                                initialTagCombination: field.tag_combination,
                                allowedConstraintTypes: field.constraint_types,
                                allowedCombinationModes: field.allowed_combination_modes,
                                entity: 'performer'
                            }));
                            break;
                        }
                        default:
                            control = React.createElement('div', { className: 'text-muted small' }, 'Unsupported: ' + field.type);
                    }
                    // Render labels above every control (including boolean switches) so layout is consistent
                    const showLabelAbove = true;
                    // Make labels inline-block and only as wide as the control beneath to prevent blocking layout
                    const capWidth = (field.type === 'tags' || field.type === 'performers') ? 400 : (field.type === 'slider' ? 92 : (['text', 'search', 'select', 'enum'].includes(field.type) ? 180 : undefined));
                    const labelStyle = capWidth ? { display: 'inline-block', width: capWidth + 'px', maxWidth: capWidth + 'px' } : undefined;
                    const labelProps = { htmlFor: id, className: 'form-label d-flex justify-content-between mb-0', style: labelStyle };
                    if (field.help)
                        labelProps.title = field.help;
                    const labelNode = showLabelAbove ? React.createElement('label', labelProps, [
                        React.createElement('span', { key: 't', className: 'label-text' }, field.label || field.name)
                    ]) : null;
                    // Use auto-width columns for compact fields; let large/complex fields take normal grid width
                    const compactTypes = ['number', 'select', 'enum', 'boolean', 'slider', 'text', 'search', 'tags', 'performers'];
                    const colClass = compactTypes.includes(field.type) ? 'col-auto mb-1' : 'col-lg-4 col-md-6 col-12 mb-1';
                    return React.createElement('div', { key: field.name, className: colClass }, [
                        React.createElement('div', { className: 'form-group mb-0' }, [
                            labelNode,
                            // Wrap control so it can be constrained to the same width as the label and centered
                            React.createElement('div', { key: 'ctrlwrap', style: labelStyle, className: 'control-wrap' }, control)
                        ])
                    ]);
                });
                return React.createElement('div', { className: 'ai-rec-config mb-1' }, [
                    React.createElement('div', { key: 'hdr', className: 'd-flex justify-content-between align-items-center mb-1' }, [
                        React.createElement('strong', { key: 't', className: 'small' }),
                        React.createElement('div', { key: 'actions', className: 'd-flex align-items-center gap-2' }, [
                            React.createElement('button', { key: 'tgl', className: 'btn btn-secondary btn-sm', onClick: () => toggleShowConfigRec() }, showConfig ? 'Hide' : 'Show')
                        ])
                    ]),
                    showConfig ? React.createElement('div', { key: 'body', className: 'config-row row' }, rows) : null
                ]);
            }
            // filtered scenes (placeholder for future filters/search)
            const filteredScenes = useMemo(() => scenes, [scenes]);
            // totalPages is heuristic if hasMore: allow navigating one page past current computed value repeatedly
            const totalPages = useMemo(() => {
                const base = Math.max(1, Math.ceil(total / itemsPerPage));
                if (hasMore) {
                    // Allow navigating to the next page when backend indicates more data.
                    return Math.max(base, page + 1);
                }
                return base;
            }, [total, itemsPerPage, hasMore, page]);
            // Sync & persist
            useEffect(() => { try {
                const usp = new URLSearchParams(location.search);
                usp.set('perPage', String(itemsPerPage));
                usp.set('z', String(zoomIndex));
                if (page > 1)
                    usp.set('p', String(page));
                else
                    usp.delete('p');
                const qs = usp.toString();
                const desired = location.pathname + (qs ? ('?' + qs) : '');
                if (desired !== location.pathname + location.search)
                    history.replaceState(null, '', desired);
                localStorage.setItem(LS_PER_PAGE_KEY, String(itemsPerPage));
                localStorage.setItem(LS_ZOOM_KEY, String(zoomIndex));
                localStorage.setItem(LS_PAGE_KEY, String(page));
            }
            catch (_) { } }, [itemsPerPage, zoomIndex, page]);
            useEffect(() => { function onStorage(e) { if (!e.key)
                return; if (e.key === LS_PER_PAGE_KEY) {
                const n = parseInt(String(e.newValue || ''), 10);
                if (!isNaN(n))
                    setItemsPerPage(n);
            } if (e.key === LS_ZOOM_KEY) {
                const n = parseInt(String(e.newValue || ''), 10);
                if (!isNaN(n))
                    setZoomIndex(n);
            } if (e.key === LS_PAGE_KEY) {
                const n = parseInt(String(e.newValue || ''), 10);
                if (!isNaN(n))
                    setPage(n);
            } } window.addEventListener('storage', onStorage); return () => window.removeEventListener('storage', onStorage); }, []);
            const sanitizeBase = useCallback((value) => {
                const origin = (() => {
                    try {
                        return typeof location !== 'undefined' && location.origin ? location.origin.replace(/\/$/, '') : '';
                    }
                    catch {
                        return '';
                    }
                })();
                if (typeof value !== 'string')
                    return '';
                const trimmed = value.trim();
                if (!trimmed)
                    return '';
                const cleaned = trimmed.replace(/\/$/, '');
                return origin && cleaned === origin ? '' : cleaned;
            }, []);
            const resolveBackendBase = useCallback(() => {
                const fn = w.AIDefaultBackendBase;
                if (typeof fn !== 'function')
                    return '';
                try {
                    const value = fn();
                    return sanitizeBase(typeof value === 'string' ? value : '');
                }
                catch {
                    return '';
                }
            }, [sanitizeBase]);
            const [backendBase, setBackendBase] = useState(() => resolveBackendBase());
            useEffect(() => {
                backendBaseRef.current = backendBase || '';
            }, [backendBase]);
            const applyBackendBase = useCallback((nextRaw) => {
                const next = sanitizeBase(nextRaw || '');
                let changed = false;
                setBackendBase((prev) => {
                    if (prev === next)
                        return prev;
                    changed = true;
                    return next;
                });
                if (changed) {
                    setDiscoveryAttempted(false);
                }
            }, [sanitizeBase, setDiscoveryAttempted]);
            useEffect(() => {
                const handler = (event) => {
                    const next = typeof (event === null || event === void 0 ? void 0 : event.detail) === 'string' ? event.detail : resolveBackendBase();
                    applyBackendBase(next || '');
                };
                try {
                    window.addEventListener('AIBackendBaseUpdated', handler);
                }
                catch (_) { }
                const timer = !backendBase ? setTimeout(() => applyBackendBase(resolveBackendBase() || ''), 0) : null;
                return () => {
                    try {
                        window.removeEventListener('AIBackendBaseUpdated', handler);
                    }
                    catch (_) { }
                    if (timer)
                        clearTimeout(timer);
                };
            }, [backendBase, resolveBackendBase, applyBackendBase]);
            const backendHealthApi = w.AIBackendHealth;
            const backendHealthEvent = (backendHealthApi === null || backendHealthApi === void 0 ? void 0 : backendHealthApi.EVENT_NAME) || 'AIBackendHealthChange';
            const [backendHealthTick, setBackendHealthTick] = useState(0);
            useEffect(() => {
                if (!backendHealthApi || !backendHealthEvent)
                    return;
                const handler = () => setBackendHealthTick((t) => t + 1);
                try {
                    window.addEventListener(backendHealthEvent, handler);
                }
                catch (_) { }
                return () => { try {
                    window.removeEventListener(backendHealthEvent, handler);
                }
                catch (_) { } ; };
            }, [backendHealthApi, backendHealthEvent]);
            const backendHealthState = useMemo(() => {
                if (backendHealthApi && typeof backendHealthApi.getState === 'function') {
                    return backendHealthApi.getState();
                }
                return null;
            }, [backendHealthApi, backendHealthTick]);
            const discoverRecommenders = React.useCallback(async () => {
                var _a, _b;
                if (!backendBase) {
                    return { success: false, recommenderId: null };
                }
                try {
                    if (backendHealthApi && typeof backendHealthApi.reportChecking === 'function') {
                        try {
                            backendHealthApi.reportChecking(backendBase);
                        }
                        catch (_) { }
                    }
                    const ctxPage = (_b = (_a = pageAPI === null || pageAPI === void 0 ? void 0 : pageAPI.get) === null || _a === void 0 ? void 0 : _a.call(pageAPI)) === null || _b === void 0 ? void 0 : _b.page;
                    const recContext = RECOMMENDATION_CONTEXT;
                    const url = `${backendBase}/api/v1/recommendations/recommenders?context=${encodeURIComponent(recContext)}`;
                    const res = await fetch(url, withSharedKeyHeaders());
                    if (!res.ok)
                        throw new Error('status ' + res.status);
                    const j = await res.json();
                    if (j && Array.isArray(j.recommenders)) {
                        const defs = j.recommenders;
                        setRecommenders(defs);
                        setDiscoveryAttempted(true);
                        if (defs.length === 0) {
                            if (backendHealthApi && typeof backendHealthApi.reportOk === 'function') {
                                try {
                                    backendHealthApi.reportOk(backendBase);
                                }
                                catch (_) { }
                            }
                            setRecommenderId(null);
                            setScenes([]);
                            setTotal(0);
                            setHasMore(false);
                            setError(null);
                            return { success: true, recommenderId: null };
                        }
                        let savedId = typeof j.savedRecommenderId === 'string' ? j.savedRecommenderId : null;
                        let savedDef = savedId ? defs.find(r => r.id === savedId) : null;
                        if (savedDef) {
                            const seedConfig = sanitizeConfigPayload(j.savedConfig || {});
                            serverSeedConfigRef.current[savedDef.id] = seedConfig;
                            lastPersistedSnapshotRef.current = JSON.stringify({
                                context: recContext,
                                recommenderId: savedDef.id,
                                config: seedConfig,
                            });
                        }
                        else {
                            savedId = null;
                        }
                        const existingMatch = recommenderId && defs.find(r => r.id === recommenderId);
                        const defaultDef = (j.defaultRecommenderId && defs.find(r => r.id === j.defaultRecommenderId)) || defs[0];
                        let nextId = null;
                        if (savedDef) {
                            nextId = savedDef.id;
                        }
                        else if (existingMatch) {
                            nextId = existingMatch.id;
                        }
                        else if (defaultDef) {
                            if (w.AIDebug)
                                console.log('[RecommendedScenes] default recommender', defaultDef.id);
                            nextId = defaultDef.id;
                        }
                        if (nextId) {
                            setRecommenderId((prev) => prev === nextId ? prev : nextId);
                        }
                        if (backendHealthApi && typeof backendHealthApi.reportOk === 'function') {
                            try {
                                backendHealthApi.reportOk(backendBase);
                            }
                            catch (_) { }
                        }
                        return { success: true, recommenderId: nextId || (defaultDef ? defaultDef.id : null) };
                    }
                    throw new Error('Unexpected discovery response');
                }
                catch (e) {
                    const message = e && e.message ? e.message : 'failed to discover recommenders';
                    if (backendHealthApi && typeof backendHealthApi.reportError === 'function') {
                        try {
                            backendHealthApi.reportError(backendBase, message, e);
                        }
                        catch (_) { }
                    }
                    setRecommenders([]);
                    setDiscoveryAttempted(true);
                    return { success: false, recommenderId: null };
                }
            }, [backendBase, pageAPI, backendHealthApi, recommenderId]);
            // Attempt new recommender discovery first; fallback to legacy algorithms if unavailable
            useEffect(() => {
                if (discoveryAttempted || !backendBase)
                    return;
                discoverRecommenders();
            }, [discoveryAttempted, discoverRecommenders, backendBase]);
            // (legacy algorithm effects removed)
            // Unified function to request recommendations (first page)
            const latestRequestIdRef = React.useRef(0);
            const fetchRecommendations = React.useCallback(async (overrideId) => {
                if (!backendBase)
                    return;
                const myId = ++latestRequestIdRef.current;
                setLoading(true);
                setError(null);
                try {
                    const activeRecommenderId = overrideId !== null && overrideId !== void 0 ? overrideId : recommenderId;
                    if (!activeRecommenderId) {
                        return;
                    }
                    if (backendHealthApi && typeof backendHealthApi.reportChecking === 'function') {
                        try {
                            backendHealthApi.reportChecking(backendBase);
                        }
                        catch (_) { }
                    }
                    const ctx = (pageAPI === null || pageAPI === void 0 ? void 0 : pageAPI.get) ? pageAPI.get() : null; // reserved for future context mapping
                    const offset = (page - 1) * itemsPerPage;
                    const body = { context: RECOMMENDATION_CONTEXT, recommenderId: activeRecommenderId, limit: itemsPerPage, offset, config: configValuesRef.current || {} };
                    if (ctx) {
                        body.context = RECOMMENDATION_CONTEXT;
                    }
                    const url = `${backendBase}/api/v1/recommendations/query`;
                    if (w.AIDebug)
                        console.log('[RecommendedScenes] query', body);
                    const res = await fetch(url, withSharedKeyHeaders({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
                    if (!res.ok) {
                        if (myId === latestRequestIdRef.current) {
                            if (backendHealthApi && typeof backendHealthApi.reportError === 'function' && (res.status >= 500 || res.status === 0)) {
                                try {
                                    backendHealthApi.reportError(backendBase, `HTTP ${res.status}`);
                                }
                                catch (_) { }
                            }
                            else if (backendHealthApi && typeof backendHealthApi.reportOk === 'function') {
                                try {
                                    backendHealthApi.reportOk(backendBase);
                                }
                                catch (_) { }
                            }
                        }
                        throw new Error('HTTP ' + res.status);
                    }
                    const j = await res.json();
                    if (myId !== latestRequestIdRef.current) {
                        if (w.AIDebug)
                            console.log('[RecommendedScenes] stale response ignored', { myId, current: latestRequestIdRef.current });
                        return;
                    }
                    if (!Array.isArray(j.scenes)) {
                        throw new Error('Unexpected response format');
                    }
                    const norm = j.scenes.map((s) => normalizeScene(s)).filter(Boolean);
                    setScenes(norm);
                    const serverTotal = (j.meta && typeof j.meta.total === 'number') ? j.meta.total : norm.length;
                    const floorTotal = offset + norm.length;
                    const metaTotal = serverTotal < floorTotal ? floorTotal : serverTotal;
                    setTotal(metaTotal);
                    const nextOffset = j.meta && typeof j.meta.nextOffset === 'number' ? j.meta.nextOffset : null;
                    const hm = j.meta && typeof j.meta.hasMore === 'boolean' ? Boolean(j.meta.hasMore) : (nextOffset != null ? nextOffset > offset : offset + norm.length < metaTotal);
                    setHasMore(hm);
                    if (w.AIDebug)
                        console.log('[RecommendedScenes] meta', j.meta, { page, itemsPerPage, computedPages: Math.ceil(metaTotal / itemsPerPage), hasMore: hm });
                    if (myId === latestRequestIdRef.current && backendHealthApi && typeof backendHealthApi.reportOk === 'function') {
                        try {
                            backendHealthApi.reportOk(backendBase);
                        }
                        catch (_) { }
                    }
                }
                catch (e) {
                    if (myId !== latestRequestIdRef.current) {
                        return;
                    }
                    const message = e && e.message ? e.message : 'unknown error';
                    if (backendHealthApi && typeof backendHealthApi.reportError === 'function') {
                        try {
                            backendHealthApi.reportError(backendBase, message, e);
                        }
                        catch (_) { }
                    }
                    setError('Failed to load scenes: ' + message);
                }
                finally {
                    if (myId === latestRequestIdRef.current) {
                        setLoading(false);
                    }
                }
            }, [recommenderId, backendBase, pageAPI, page, itemsPerPage, backendHealthApi]);
            // Fetch whenever recommender changes
            // When recommender changes, reset page then fetch (single sequence without double calling prior fetch)
            const prevRecommenderRef = React.useRef(null);
            useEffect(() => {
                if (!discoveryAttempted)
                    return;
                if (!recommenderId)
                    return;
                if (prevRecommenderRef.current !== recommenderId) {
                    prevRecommenderRef.current = recommenderId;
                    setPage(1);
                    // fetch after synchronous state update using microtask
                    queueMicrotask(() => fetchRecommendations());
                    return;
                }
            }, [recommenderId, discoveryAttempted, fetchRecommendations]);
            // Expose manual refresh
            const manualRefresh = React.useCallback(() => {
                if (w.AIDebug)
                    console.log('[RecommendedScenes] manual refresh');
                (async () => {
                    const needDiscovery = !discoveryAttempted || !recommenderId || (Array.isArray(recommenders) && recommenders.length === 0);
                    if (needDiscovery) {
                        const result = await discoverRecommenders();
                        if (!result.success) {
                            return;
                        }
                        const idToUse = result.recommenderId || recommenderId;
                        if (idToUse) {
                            await fetchRecommendations(idToUse);
                        }
                        return;
                    }
                    await fetchRecommendations();
                })().catch((err) => { if (w.AIDebug)
                    console.warn('[RecommendedScenes] refresh failed', err); });
            }, [discoverRecommenders, fetchRecommendations, discoveryAttempted, recommenderId, recommenders]);
            const backendNotice = backendHealthApi && typeof backendHealthApi.buildNotice === 'function'
                ? backendHealthApi.buildNotice(backendHealthState, { onRetry: manualRefresh, dense: true })
                : null;
            // Clamp page when per-page changes
            useEffect(() => {
                if (loading)
                    return; // avoid clamp while fetch pending
                if (!hasMore) {
                    const maxPages = Math.max(1, Math.ceil(total / itemsPerPage));
                    if (page > maxPages) {
                        if (w.AIDebug)
                            console.log('[RecommendedScenes] clamp page', { page, maxPages });
                        setPage(maxPages);
                    }
                }
            }, [itemsPerPage, total, page, hasMore, loading]);
            useEffect(() => { if (w.AIDebug)
                console.log('[RecommendedScenes] page change', { page, itemsPerPage, total, hasMore }); }, [page, itemsPerPage, total, hasMore]);
            // Fetch when page or itemsPerPage change (offset-based pagination)
            useEffect(() => { if (!discoveryAttempted)
                return; if (!recommenderId)
                return; fetchRecommendations(); }, [page, itemsPerPage, discoveryAttempted, recommenderId, fetchRecommendations]);
            const paginatedScenes = filteredScenes; // server already paginated
            const startIndex = useMemo(() => (total ? (page - 1) * itemsPerPage + 1 : 0), [total, page, itemsPerPage]);
            const endIndex = useMemo(() => Math.min(total, page * itemsPerPage), [total, page, itemsPerPage]);
            const { totalDuration, totalSizeBytes } = useMemo(() => { let duration = 0, size = 0; for (const sc of filteredScenes) {
                const files = sc.files || [];
                let longest = 0;
                for (const f of files) {
                    if (typeof (f === null || f === void 0 ? void 0 : f.duration) === 'number')
                        longest = Math.max(longest, f.duration);
                    if (typeof (f === null || f === void 0 ? void 0 : f.size) === 'number')
                        size += f.size;
                }
                duration += longest;
            } return { totalDuration: duration, totalSizeBytes: size }; }, [filteredScenes]);
            function formatDuration(seconds) { if (!seconds)
                return '0s'; const MIN = 60, H = 3600, D = 86400, M = 30 * D; let rem = seconds; const months = Math.floor(rem / M); rem %= M; const days = Math.floor(rem / D); rem %= D; const hours = Math.floor(rem / H); rem %= H; const mins = Math.floor(rem / MIN); const parts = []; if (months)
                parts.push(months + 'M'); if (days)
                parts.push(days + 'D'); if (hours)
                parts.push(hours + 'h'); if (mins)
                parts.push(mins + 'm'); return parts.length ? parts.join(' ') : seconds + 's'; }
            function formatSize(bytes) { if (!bytes)
                return '0 B'; const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']; let i = 0, val = bytes; while (val > 1024 && i < units.length - 1) {
                val /= 1024;
                i++;
            } return (i >= 3 ? val.toFixed(1) : Math.round(val)) + ' ' + units[i]; }
            const componentsToLoad = [
                (_a = PluginApi.loadableComponents) === null || _a === void 0 ? void 0 : _a.SceneCard,
                // Attempt to also pre-load Tag selectors if they are loadable (some builds expose these)
                ((_b = PluginApi.loadableComponents) === null || _b === void 0 ? void 0 : _b.TagIDSelect) || ((_c = PluginApi.loadableComponents) === null || _c === void 0 ? void 0 : _c.TagSelect)
            ].filter(Boolean);
            const componentsLoading = ((_d = PluginApi.hooks) === null || _d === void 0 ? void 0 : _d.useLoadComponents) ? PluginApi.hooks.useLoadComponents(componentsToLoad) : false;
            const { SceneCard, TagIDSelect, TagSelect } = PluginApi.components || {};
            // Attempt alternate resolution if not found (some builds may expose under different keys or on window)
            const _w = window;
            const ResolvedTagIDSelect = TagIDSelect || _w.TagIDSelect || _w.TagSelectID || null;
            const ResolvedTagSelect = TagSelect || _w.TagSelect || null;
            if (w.AIDebug && !ResolvedTagIDSelect && !ResolvedTagSelect) {
                console.debug('[RecommendedScenes] Tag selector components not found; falling back to text input');
            }
            const grid = useMemo(() => {
                if (loading || componentsLoading)
                    return React.createElement('div', { className: 'scene-grid-loading' }, 'Loading scenes...');
                if (error)
                    return React.createElement('div', { className: 'scene-grid-error' }, error);
                if (!paginatedScenes.length)
                    return React.createElement('div', { className: 'scene-grid-empty' }, 'No scenes');
                if (cardWidth === undefined)
                    return React.createElement('div', { className: 'scene-grid-calculating' }, 'Calculating layout...');
                const children = paginatedScenes.map((s, i) => React.createElement('div', { key: s.id + '_' + i, style: { display: 'contents' } }, SceneCard ? React.createElement(SceneCard, { scene: s, zoomIndex, queue: undefined, index: i }) : null));
                return React.createElement('div', { className: 'row ai-rec-grid d-flex flex-wrap justify-content-center', ref: componentRef, style: { ['--ai-card-width']: cardWidth + 'px' } }, children);
            }, [loading, componentsLoading, error, paginatedScenes, SceneCard, cardWidth, zoomIndex]);
            useEffect(() => { if (w.AIDebug && cardWidth)
                log('layout', { containerWidth, zoomIndex, preferredWidth: zoomWidths[zoomIndex], cardWidth }); }, [containerWidth, zoomIndex, cardWidth, paginatedScenes]);
            function PaginationControl({ position }) {
                const disabledFirst = page <= 1;
                const disabledLast = page >= totalPages && !hasMore;
                const controls = React.createElement('div', { key: 'pc', role: 'group', className: 'pagination btn-group' }, [
                    React.createElement('button', { key: 'first', disabled: disabledFirst, className: 'btn btn-secondary', onClick: () => setPage(1) }, '«'),
                    React.createElement('button', { key: 'prev', disabled: disabledFirst, className: 'btn btn-secondary', onClick: () => setPage((p) => Math.max(1, p - 1)) }, '<'),
                    React.createElement('div', { key: 'cnt', className: 'page-count-container' }, [
                        React.createElement('div', { key: 'grp', role: 'group', className: 'btn-group' }, [
                            React.createElement('button', { key: 'lbl', type: 'button', className: 'page-count btn btn-secondary' }, `${page} of ${totalPages}`)
                        ])
                    ]),
                    React.createElement('button', { key: 'next', disabled: disabledLast, className: 'btn btn-secondary', onClick: () => setPage((p) => Math.min(totalPages, p + 1)) }, '>'),
                    React.createElement('button', { key: 'last', disabled: disabledLast, className: 'btn btn-secondary', onClick: () => setPage(totalPages) }, '»')
                ]);
                const statsFragment = totalDuration > 0 ? ` (${formatDuration(totalDuration)} - ${formatSize(totalSizeBytes)})` : '';
                const info = React.createElement('span', { key: 'info', className: 'filter-container text-muted paginationIndex center-text w-100 text-center mt-1' }, `${startIndex}-${endIndex} of ${total}${statsFragment}`);
                return React.createElement('div', { className: 'd-flex flex-column align-items-center w-100 pagination-footer mt-2' }, position === 'top' ? [controls, info] : [info, controls]);
            }
            const recSelect = React.createElement('select', { key: 'rec', className: 'btn-secondary form-control form-control-sm', value: recommenderId || '', onChange: (e) => { setRecommenderId(e.target.value); } }, (recommenders || []).map((r) => React.createElement('option', { key: r.id, value: r.id }, r.label || r.id)));
            const toolbar = React.createElement('div', { key: 'toolbar', role: 'toolbar', className: 'filtered-list-toolbar btn-toolbar flex-wrap w-100 mb-1 justify-content-center' }, [
                React.createElement('div', { key: 'cluster', className: 'd-flex flex-wrap justify-content-center align-items-center gap-2' }, [
                    React.createElement('div', { key: 'recGroup', role: 'group', className: 'mr-2 mb-2 btn-group' }, [recSelect]),
                    React.createElement('div', { key: 'ps', className: 'page-size-selector mr-2 mb-2' }, React.createElement('select', { className: 'btn-secondary form-control form-control-sm', value: itemsPerPage, onChange: (e) => { setItemsPerPage(Number(e.target.value)); setPage(1); } }, [20, 40, 80, 100].map(n => React.createElement('option', { key: n, value: n }, n)))),
                    React.createElement('div', { key: 'zoomWrap', className: 'mx-2 mb-2 d-inline-flex align-items-center' }, [
                        React.createElement('input', { key: 'zr', min: 0, max: 3, type: 'range', className: 'zoom-slider ml-1 form-control-range', value: zoomIndex, onChange: (e) => setZoomIndex(Number(e.target.value)) })
                    ]),
                    React.createElement('div', { key: 'act', role: 'group', className: 'mb-2 btn-group' }, [
                        React.createElement(Button, { key: 'refresh', className: 'btn btn-secondary minimal', disabled: loading, title: 'Refresh', onClick: manualRefresh }, '↻')
                    ])
                ])
            ]);
            // While recommender discovery hasn't finished, suppress legacy UI to avoid flash
            if (!discoveryAttempted) {
                return React.createElement('div', { className: 'text-center mt-4' }, 'Loading recommendation engine…');
            }
            if (discoveryAttempted && !backendNotice && Array.isArray(recommenders) && recommenders.length === 0) {
                return React.createElement('div', { className: 'ai-rec-empty-state text-center mt-4' }, [
                    React.createElement('div', { key: 'no-recommenders', className: 'alert alert-info d-inline-block text-left', style: { maxWidth: 520, margin: '12px auto' } }, [
                        React.createElement('div', { key: 'title', style: { fontWeight: 600, marginBottom: 6 } }, 'No recommendation plugins installed'),
                        React.createElement('div', { key: 'body' }, 'Install a recommender plugin under Settings → Tools → AI Overhaul Settings.')
                    ])
                ]);
            }
            return React.createElement(React.Fragment, null, [
                backendNotice,
                toolbar,
                renderConfigPanel(),
                React.createElement(PaginationControl, { key: 'pgt', position: 'top' }),
                grid,
                React.createElement(PaginationControl, { key: 'pgb', position: 'bottom' })
            ]);
        };
        try {
            PluginApi.register.route(ROUTE, RecommendedScenesPage);
        }
        catch { }
        // Single canonical patch key based on provided MainNavbar source
        try {
            PluginApi.patch.before('MainNavBar.MenuItems', function (props) {
                // Duplicate guard
                try {
                    const arr = React.Children.toArray(props.children);
                    if (arr.some((c) => { var _a, _b, _c, _d; return ((_c = (_b = (_a = c === null || c === void 0 ? void 0 : c.props) === null || _a === void 0 ? void 0 : _a.children) === null || _b === void 0 ? void 0 : _b.props) === null || _c === void 0 ? void 0 : _c.to) === ROUTE || ((_d = c === null || c === void 0 ? void 0 : c.props) === null || _d === void 0 ? void 0 : _d.to) === ROUTE; }))
                        return props;
                }
                catch { }
                const label = 'Recommended Scenes';
                let qs = '';
                try {
                    const pp = localStorage.getItem(LS_PER_PAGE_KEY);
                    const z = localStorage.getItem(LS_ZOOM_KEY);
                    const p = localStorage.getItem(LS_PAGE_KEY);
                    const params = new URLSearchParams();
                    if (pp)
                        params.set('perPage', pp);
                    if (z)
                        params.set('z', z);
                    if (p && p !== '1')
                        params.set('p', p);
                    const s = params.toString();
                    if (s)
                        qs = '?' + s;
                }
                catch (_) { }
                const node = React.createElement('div', { key: 'recommended-scenes-link', className: 'col-4 col-sm-3 col-md-2 col-lg-auto' }, NavLink ? (React.createElement(NavLink, {
                    exact: true,
                    to: ROUTE + qs,
                    activeClassName: 'active',
                    className: 'btn minimal p-4 p-xl-2 d-flex d-xl-inline-block flex-column justify-content-between align-items-center'
                }, label)) : (React.createElement('a', { href: '#' + ROUTE, className: 'btn minimal p-4 p-xl-2 d-flex d-xl-inline-block flex-column justify-content-between align-items-center' }, label)));
                return [{ children: (React.createElement(React.Fragment, null,
                            props.children,
                            node)) }];
            });
        }
        catch { }
        w.RecommendedScenesPage = RecommendedScenesPage;
    } // End initializeRecommendedScenes
    // Wait for dependencies and initialize
    function waitAndInitialize() {
        if (w.PluginApi && w.PluginApi.React) {
            console.log('[RecommendedScenes] Dependencies ready, initializing...');
            initializeRecommendedScenes();
        }
        else {
            console.log('[RecommendedScenes] Waiting for PluginApi and React...');
            setTimeout(waitAndInitialize, 100);
        }
    }
    waitAndInitialize();
})();
})();

