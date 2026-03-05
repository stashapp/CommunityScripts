(function(){
// SimilarScenes Component
// Mimics the queue tab structure but uses the 'similar_scene' context
// for scene-specific recommendations with dynamic inputs
(function () {
    const w = window;
    // Safer initialization - wait for everything to be ready
    function initializeSimilarScenes() {
        const PluginApi = w.PluginApi;
        if (!PluginApi || !PluginApi.React) {
            console.warn('[SimilarScenes] PluginApi or React not available');
            return;
        }
        const React = PluginApi.React;
        // Validate React hooks are available
        if (!React.useState || !React.useMemo || !React.useEffect || !React.useRef || !React.useCallback) {
            console.warn('[SimilarScenes] React hooks not available');
            return;
        }
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
        function log(...args) { if (w.AIDebug)
            console.log('[SimilarScenes]', ...args); }
        function warn(...args) { if (w.AIDebug)
            console.warn('[SimilarScenes]', ...args); }
        function normalizeScene(sc) {
            if (!sc || typeof sc !== 'object')
                return undefined;
            const arrayFields = ['performers', 'tags', 'markers', 'scene_markers', 'galleries', 'images', 'files', 'groups'];
            arrayFields.forEach(f => {
                if (sc[f] == null)
                    sc[f] = [];
                else if (!Array.isArray(sc[f]))
                    sc[f] = [sc[f]].filter(Boolean);
            });
            if (!sc.studio)
                sc.studio = null;
            if (sc.rating100 == null && typeof sc.rating === 'number')
                sc.rating100 = sc.rating * 20;
            if (sc.rating == null && typeof sc.rating100 === 'number')
                sc.rating = Math.round(sc.rating100 / 20);
            return sc;
        }
        const RECOMMENDATION_CONTEXT = 'similar_scene';
        // Similar to QueueViewer but for similar scenes
        const SimilarScenesViewer = (props) => {
            // Accept either `currentSceneId` (old API) or `sceneId` (integration passes this)
            let currentSceneId = props.currentSceneId || props.sceneId || null;
            if (currentSceneId != null)
                currentSceneId = String(currentSceneId);
            // Early return if no scene ID - don't call hooks
            if (!currentSceneId) {
                return React.createElement('div', { className: 'alert alert-warning' }, 'No scene ID provided for Similar tab');
            }
            const onSceneClicked = props.onSceneClicked;
            const [recommenders, setRecommenders] = useState(null);
            const [recommenderId, setRecommenderId] = useState(null);
            const [scenes, setScenes] = useState([]);
            const [loading, setLoading] = useState(false);
            const [error, setError] = useState(null);
            const [configValues, setConfigValues] = useState({});
            const [offset, setOffset] = useState(0);
            const PAGE_SIZE = 20;
            const [hasMore, setHasMore] = useState(false);
            const LS_SHOW_CONFIG_KEY = 'aiRec.showConfig';
            function readShowConfig() {
                try {
                    const raw = localStorage.getItem(LS_SHOW_CONFIG_KEY);
                    if (raw == null)
                        return true;
                    return raw === '1' || raw === 'true';
                }
                catch (_) {
                    return true;
                }
            }
            const [showConfig, setShowConfig] = useState(() => readShowConfig());
            // Sync showConfig via localStorage + custom event (so changes affect other components in same window)
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
            function toggleShowConfig() { const next = !showConfig; try {
                localStorage.setItem(LS_SHOW_CONFIG_KEY, next ? '1' : '0');
            }
            catch (_) { } try {
                window.dispatchEvent(new CustomEvent('aiRec.showConfig', { detail: next }));
            }
            catch (_) { } setShowConfig(next); }
            // Root ref for the tab content container (used to find the nearest scrollable parent)
            const componentRef = useRef(null);
            const scrollContainerRef = useRef(null);
            const pendingScrollRef = useRef(null);
            const getScrollContainer = useCallback(() => {
                try {
                    const node = (componentRef === null || componentRef === void 0 ? void 0 : componentRef.current) || null;
                    let el = node ? node.parentElement : null;
                    while (el && el !== document.body) {
                        const style = window.getComputedStyle(el);
                        const oy = style.overflowY || style.overflow || '';
                        const scrollable = /(auto|scroll)/.test(oy);
                        if (scrollable && el.scrollHeight > (el.clientHeight + 10)) {
                            return el;
                        }
                        el = el.parentElement;
                    }
                }
                catch (_) { }
                return document.scrollingElement || document.documentElement || window;
            }, [componentRef]);
            useEffect(() => {
                scrollContainerRef.current = getScrollContainer();
            }, [getScrollContainer]);
            const configCacheRef = useRef({});
            const configValuesRef = useRef({});
            const compositeRawRef = useRef({});
            const preferenceSaveTimerRef = useRef(null);
            const lastPersistedSnapshotRef = useRef(null);
            const serverSeedConfigRef = useRef({});
            useEffect(() => { configValuesRef.current = configValues; }, [configValues]);
            useEffect(() => {
                return () => {
                    if (preferenceSaveTimerRef.current) {
                        clearTimeout(preferenceSaveTimerRef.current);
                    }
                };
            }, []);
            const currentRecommender = useMemo(() => { var _a; return (_a = (recommenders || [])) === null || _a === void 0 ? void 0 : _a.find((r) => r.id === recommenderId); }, [recommenders, recommenderId]);
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
                const handler = (event) => {
                    const next = typeof (event === null || event === void 0 ? void 0 : event.detail) === 'string' ? event.detail : resolveBackendBase();
                    setBackendBase(sanitizeBase(next || ''));
                };
                try {
                    window.addEventListener('AIBackendBaseUpdated', handler);
                }
                catch (_) { }
                const timer = !backendBase ? setTimeout(() => setBackendBase(resolveBackendBase() || ''), 0) : null;
                return () => {
                    try {
                        window.removeEventListener('AIBackendBaseUpdated', handler);
                    }
                    catch (_) { }
                    if (timer)
                        clearTimeout(timer);
                };
            }, [backendBase, resolveBackendBase, sanitizeBase]);
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
            function sanitizeConfigPayload(config) {
                const out = {};
                if (config && typeof config === 'object') {
                    Object.keys(config).forEach(key => {
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
            const persistPreference = useCallback(async () => {
                if (!backendBase || !recommenderId || !currentRecommender)
                    return;
                const payload = {
                    context: RECOMMENDATION_CONTEXT,
                    recommenderId,
                    config: sanitizeConfigPayload(buildPersistableConfig(currentRecommender, configValuesRef.current || {})),
                };
                const signature = JSON.stringify(payload);
                if (lastPersistedSnapshotRef.current === signature) {
                    return;
                }
                try {
                    const url = `${backendBase}/api/v1/recommendations/preferences`;
                    await fetch(url, withSharedKeyHeaders({
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }));
                    lastPersistedSnapshotRef.current = signature;
                }
                catch (err) {
                    warn('Failed to persist similar-scene preference', err);
                }
            }, [backendBase, recommenderId, currentRecommender, withSharedKeyHeaders]);
            const schedulePreferencePersist = useCallback((reason, opts) => {
                if (!backendBase || !recommenderId || !currentRecommender)
                    return;
                const delay = reason === 'recommender' ? 25 : ((opts === null || opts === void 0 ? void 0 : opts.debounce) ? 800 : 220);
                if (preferenceSaveTimerRef.current) {
                    clearTimeout(preferenceSaveTimerRef.current);
                }
                preferenceSaveTimerRef.current = setTimeout(() => {
                    preferenceSaveTimerRef.current = null;
                    persistPreference();
                }, delay);
            }, [backendBase, recommenderId, currentRecommender, persistPreference]);
            // Discover available recommenders using the backend recommendations API
            const discoverRecommenders = useCallback(async () => {
                if (!backendBase)
                    return;
                let reportedError = false;
                if (backendHealthApi && typeof backendHealthApi.reportChecking === 'function') {
                    try {
                        backendHealthApi.reportChecking(backendBase);
                    }
                    catch (_) { }
                }
                try {
                    setLoading(true);
                    const recContext = RECOMMENDATION_CONTEXT;
                    const url = `${backendBase}/api/v1/recommendations/recommenders?context=${encodeURIComponent(recContext)}`;
                    const response = await fetch(url, withSharedKeyHeaders());
                    if (!response.ok) {
                        if (backendHealthApi) {
                            if ((response.status >= 500 || response.status === 0) && typeof backendHealthApi.reportError === 'function') {
                                try {
                                    backendHealthApi.reportError(backendBase, `HTTP ${response.status}`);
                                    reportedError = true;
                                }
                                catch (_) { }
                            }
                            else if (typeof backendHealthApi.reportOk === 'function') {
                                try {
                                    backendHealthApi.reportOk(backendBase);
                                }
                                catch (_) { }
                            }
                        }
                        throw new Error(`HTTP ${response.status}`);
                    }
                    const contentType = response.headers && response.headers.get ? response.headers.get('content-type') || '' : '';
                    if (!contentType.includes('application/json')) {
                        const text = await response.text();
                        warn('discoverRecommenders: non-JSON response body (truncated):', text && text.slice ? text.slice(0, 512) : text);
                        if (backendHealthApi && typeof backendHealthApi.reportError === 'function') {
                            try {
                                backendHealthApi.reportError(backendBase, 'Server returned non-JSON response');
                                reportedError = true;
                            }
                            catch (_) { }
                        }
                        setError('Failed to discover recommenders: server returned non-JSON response. See console for details.');
                        setRecommenders(null);
                        return;
                    }
                    const data = await response.json();
                    if (Array.isArray(data.recommenders)) {
                        setRecommenders(data.recommenders);
                        const savedId = typeof data.savedRecommenderId === 'string' ? data.savedRecommenderId : null;
                        const savedDef = savedId ? data.recommenders.find((r) => r.id === savedId) : null;
                        if (savedDef) {
                            const seedConfig = sanitizeConfigPayload(data.savedConfig || {});
                            serverSeedConfigRef.current[savedDef.id] = seedConfig;
                            lastPersistedSnapshotRef.current = JSON.stringify({
                                context: recContext,
                                recommenderId: savedDef.id,
                                config: seedConfig,
                            });
                        }
                        const similarContextRec = data.recommenders.find((r) => { var _a; return (_a = r.contexts) === null || _a === void 0 ? void 0 : _a.includes(RECOMMENDATION_CONTEXT); });
                        const nextId = (savedDef === null || savedDef === void 0 ? void 0 : savedDef.id) || (similarContextRec === null || similarContextRec === void 0 ? void 0 : similarContextRec.id) || null;
                        if (nextId) {
                            setRecommenderId((prev) => prev === nextId ? prev : nextId);
                            if (w.AIDebug)
                                log('Selected recommender for similar_scene:', nextId);
                        }
                        if (backendHealthApi && typeof backendHealthApi.reportOk === 'function') {
                            try {
                                backendHealthApi.reportOk(backendBase);
                            }
                            catch (_) { }
                        }
                    }
                    else {
                        setRecommenders(null);
                    }
                }
                catch (e) {
                    warn('Failed to discover recommenders:', e && e.message ? e.message : e);
                    setError('Failed to discover recommenders: ' + (e && e.message ? e.message : String(e)));
                    if (!reportedError && backendHealthApi && typeof backendHealthApi.reportError === 'function') {
                        try {
                            backendHealthApi.reportError(backendBase, e && e.message ? e.message : undefined, e);
                        }
                        catch (_) { }
                    }
                }
                finally {
                    setLoading(false);
                }
            }, [backendBase, backendHealthApi]);
            // Fetch a page of similar scenes from the unified recommendations query endpoint
            const fetchPage = useCallback(async (pageOffset = 0, append = false) => {
                var _a;
                if (!backendBase || !recommenderId || !currentSceneId)
                    return;
                let reportedError = false;
                try {
                    if (backendHealthApi && typeof backendHealthApi.reportChecking === 'function') {
                        try {
                            backendHealthApi.reportChecking(backendBase);
                        }
                        catch (_) { }
                    }
                    setLoading(true);
                    setError(null);
                    // Snapshot scroll metrics if appending, so we can preserve viewport position
                    if (append) {
                        const sc = scrollContainerRef.current || getScrollContainer();
                        const prevTop = sc && typeof sc.scrollTop === 'number' ? sc.scrollTop : (typeof window !== 'undefined' ? window.scrollY : 0);
                        const prevHeight = sc && typeof sc.scrollHeight === 'number' ? sc.scrollHeight : (((_a = document === null || document === void 0 ? void 0 : document.documentElement) === null || _a === void 0 ? void 0 : _a.scrollHeight) || 0);
                        pendingScrollRef.current = { sc, prevTop, prevHeight };
                    }
                    else {
                        pendingScrollRef.current = null;
                    }
                    const payload = {
                        context: RECOMMENDATION_CONTEXT,
                        recommenderId,
                        seedSceneIds: [Number(currentSceneId)],
                        config: configValuesRef.current || {},
                        limit: PAGE_SIZE,
                        offset: pageOffset
                    };
                    const url = `${backendBase}/api/v1/recommendations/query`;
                    const response = await fetch(url, withSharedKeyHeaders({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    }));
                    if (!response.ok) {
                        if (backendHealthApi) {
                            if ((response.status >= 500 || response.status === 0) && typeof backendHealthApi.reportError === 'function') {
                                try {
                                    backendHealthApi.reportError(backendBase, `HTTP ${response.status}`);
                                    reportedError = true;
                                }
                                catch (_) { }
                            }
                            else if (typeof backendHealthApi.reportOk === 'function') {
                                try {
                                    backendHealthApi.reportOk(backendBase);
                                }
                                catch (_) { }
                            }
                        }
                        throw new Error(`HTTP ${response.status}`);
                    }
                    const contentType = response.headers && response.headers.get ? response.headers.get('content-type') || '' : '';
                    if (!contentType.includes('application/json')) {
                        const text = await response.text();
                        warn('fetchPage: non-JSON response body (truncated):', text && text.slice ? text.slice(0, 512) : text);
                        if (backendHealthApi && typeof backendHealthApi.reportError === 'function') {
                            try {
                                backendHealthApi.reportError(backendBase, 'Server returned non-JSON response');
                                reportedError = true;
                            }
                            catch (_) { }
                        }
                        throw new Error('Server returned non-JSON response');
                    }
                    const data = await response.json();
                    if (data.scenes && Array.isArray(data.scenes)) {
                        const normalizedScenes = data.scenes.map(normalizeScene).filter(Boolean);
                        setScenes((prev) => append ? prev.concat(normalizedScenes) : normalizedScenes);
                        // Update offset and hasMore using API meta when present
                        const meta = data.meta || {};
                        if (typeof meta.hasMore === 'boolean') {
                            setHasMore(Boolean(meta.hasMore));
                        }
                        else if (typeof meta.total === 'number') {
                            const total = meta.total;
                            const known = (append ? (scenes.length) : 0) + normalizedScenes.length;
                            setHasMore(known < total);
                        }
                        else {
                            setHasMore(false);
                        }
                        if (typeof meta.nextOffset === 'number') {
                            setOffset(meta.nextOffset);
                        }
                        else {
                            // Fall back to incrementing by page size
                            setOffset(pageOffset + normalizedScenes.length);
                        }
                        // After DOM updates, restore scroll position to keep viewport stable
                        if (append && pendingScrollRef.current) {
                            const snap = pendingScrollRef.current;
                            const restore = () => {
                                var _a;
                                try {
                                    const sc = snap.sc || scrollContainerRef.current || getScrollContainer();
                                    if (!sc)
                                        return;
                                    const newHeight = sc && typeof sc.scrollHeight === 'number' ? sc.scrollHeight : (((_a = document === null || document === void 0 ? void 0 : document.documentElement) === null || _a === void 0 ? void 0 : _a.scrollHeight) || 0);
                                    const delta = newHeight - (snap.prevHeight || 0);
                                    const baseTop = snap.prevTop || 0;
                                    if (typeof sc.scrollTop === 'number') {
                                        sc.scrollTop = baseTop + (delta > 0 ? delta : 0);
                                    }
                                    else if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
                                        window.scrollTo({ top: baseTop + (delta > 0 ? delta : 0) });
                                    }
                                }
                                catch (_) { }
                                finally {
                                    pendingScrollRef.current = null;
                                }
                            };
                            // Wait two frames to ensure layout has settled
                            if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
                                requestAnimationFrame(() => requestAnimationFrame(restore));
                            }
                            else {
                                setTimeout(restore, 0);
                            }
                        }
                    }
                    else {
                        if (!append)
                            setScenes([]);
                        setHasMore(false);
                        setError('No similar scenes found or unexpected data format');
                    }
                    if (backendHealthApi && typeof backendHealthApi.reportOk === 'function') {
                        try {
                            backendHealthApi.reportOk(backendBase);
                        }
                        catch (_) { }
                    }
                }
                catch (e) {
                    warn('Failed to fetch similar scenes:', e && e.message ? e.message : e);
                    setError('Failed to load similar scenes: ' + (e && e.message ? e.message : String(e)));
                    if (!append)
                        setScenes([]);
                    if (!reportedError && backendHealthApi && typeof backendHealthApi.reportError === 'function') {
                        try {
                            backendHealthApi.reportError(backendBase, e && e.message ? e.message : undefined, e);
                        }
                        catch (_) { }
                    }
                }
                finally {
                    setLoading(false);
                }
            }, [recommenderId, currentSceneId, backendBase, PAGE_SIZE, backendHealthApi]);
            // Auto-discover recommenders on mount
            useEffect(() => {
                if (!backendBase)
                    return;
                discoverRecommenders();
            }, [discoverRecommenders, backendBase]);
            // When the selected recommender changes, initialize config values from its defaults
            useEffect(() => {
                if (!currentRecommender)
                    return;
                const defs = currentRecommender.config || [];
                const defaults = {};
                defs.forEach(f => {
                    if (Object.prototype.hasOwnProperty.call(f, 'default'))
                        defaults[f.name] = f.default;
                    if (f.type === 'tags' || f.type === 'performers') {
                        compositeRawRef.current[f.name] = '';
                    }
                });
                const cached = configCacheRef.current[currentRecommender.id];
                let merged = cached ? { ...defaults, ...cached } : { ...defaults };
                const seed = serverSeedConfigRef.current[currentRecommender.id];
                if (seed) {
                    merged = { ...merged, ...seed };
                    delete serverSeedConfigRef.current[currentRecommender.id];
                }
                configCacheRef.current[currentRecommender.id] = merged;
                setConfigValues({ ...merged });
                configValuesRef.current = merged;
                schedulePreferencePersist('recommender');
            }, [currentRecommender, schedulePreferencePersist]);
            // Fetch first page when recommender or scene changes
            useEffect(() => {
                if (recommenderId && currentSceneId) {
                    fetchPage(0, false);
                }
                // Intentionally exclude fetchPage from deps to avoid re-fetches when it changes identity
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [recommenderId, currentSceneId]);
            // Handle scene click
            const handleSceneClick = useCallback((sceneId, event) => {
                if (event)
                    event.preventDefault();
                if (onSceneClicked) {
                    onSceneClicked(sceneId);
                }
                else {
                    // Default behavior: navigate to scene
                    window.location.href = `/scenes/${sceneId}`;
                }
            }, [onSceneClicked]);
            // Render scene in queue list format (matching the Queue tab exactly)
            const renderQueueScene = useCallback((scene, index) => {
                var _a, _b, _c;
                const title = scene.title || `Scene ${scene.id}`;
                const studio = ((_a = scene.studio) === null || _a === void 0 ? void 0 : _a.name) || '';
                const performers = ((_b = scene.performers) === null || _b === void 0 ? void 0 : _b.map(p => p.name).join(', ')) || '';
                const screenshot = (_c = scene.paths) === null || _c === void 0 ? void 0 : _c.screenshot;
                const date = scene.date || scene.created_at || '';
                return React.createElement('li', {
                    key: scene.id,
                    className: 'my-2'
                }, React.createElement('a', {
                    href: `/scenes/${scene.id}`,
                    onClick: (e) => handleSceneClick(scene.id.toString(), e)
                }, React.createElement('div', {
                    className: 'ml-1 d-flex align-items-center'
                }, [
                    React.createElement('div', {
                        key: 'thumbnail',
                        className: 'thumbnail-container'
                    }, screenshot ? React.createElement('img', {
                        loading: 'lazy',
                        alt: title,
                        src: screenshot
                    }) : null),
                    React.createElement('div', {
                        key: 'details',
                        className: 'queue-scene-details'
                    }, [
                        React.createElement('span', { key: 'title', className: 'queue-scene-title' }, title),
                        React.createElement('span', { key: 'studio', className: 'queue-scene-studio' }, studio),
                        React.createElement('span', { key: 'performers', className: 'queue-scene-performers' }, performers),
                        React.createElement('span', { key: 'date', className: 'queue-scene-date' }, date)
                    ])
                ])));
            }, [handleSceneClick]);
            // Render recommender selector when recommenders are available
            const renderRecommenderSelector = useCallback(() => {
                if (!recommenders || recommenders.length === 0)
                    return null;
                // Prefer recommenders that advertise support for 'similar_scene'. If none do, fall back to all recommenders.
                const similarContextRecommenders = recommenders.filter((r) => (r.contexts || []).includes('similar_scene'));
                const candidates = similarContextRecommenders.length > 0 ? similarContextRecommenders : recommenders;
                // Ensure a default is selected
                if (!recommenderId && candidates.length > 0) {
                    // Defer setting state until next microtask to avoid during render
                    setTimeout(() => {
                        try {
                            setRecommenderId((prev) => prev || candidates[0].id);
                        }
                        catch (_) { }
                    }, 0);
                }
                return React.createElement('div', { className: 'd-flex align-items-center' }, [
                    React.createElement('label', { key: 'label', className: 'me-2 mb-0' }, 'Algorithm: '),
                    React.createElement('select', {
                        key: 'select',
                        className: 'input-control form-control form-control-sm w-select w-180',
                        value: recommenderId || '',
                        onChange: (e) => setRecommenderId(e.target.value)
                    }, candidates.map((rec) => React.createElement('option', { key: rec.id, value: rec.id }, rec.label || rec.id)))
                ]);
            }, [recommenders, recommenderId]);
            // Config state update helper (simple debounce for text inputs)
            const textTimersRef = useRef({});
            const updateConfigField = useCallback((name, value, opts) => {
                setConfigValues((prev) => {
                    const next = { ...prev, [name]: value };
                    if (recommenderId) {
                        configCacheRef.current[recommenderId] = next;
                    }
                    return next;
                });
                configValuesRef.current = { ...configValuesRef.current, [name]: value };
                if (opts && opts.debounce) {
                    if (textTimersRef.current[name])
                        clearTimeout(textTimersRef.current[name]);
                    textTimersRef.current[name] = setTimeout(() => {
                        fetchPage(0, false);
                    }, 300);
                }
                else {
                    // immediate fetch
                    fetchPage(0, false);
                }
                if (currentRecommender && isFieldPersistable(currentRecommender, name)) {
                    schedulePreferencePersist('config', { debounce: !!(opts === null || opts === void 0 ? void 0 : opts.debounce) });
                }
            }, [fetchPage, recommenderId, currentRecommender, schedulePreferencePersist]);
            // Shared config panel using AIRecommendationUtils.buildConfigRows for parity
            const renderConfigPanel = useCallback(() => {
                if (!currentRecommender || !Array.isArray(currentRecommender.config) || !currentRecommender.config.length)
                    return null;
                const defs = currentRecommender.config;
                const utils = w.AIRecommendationUtils || {};
                const buildRows = utils.buildConfigRows;
                const TagIncludeExclude = utils.TagIncludeExclude;
                if (!buildRows)
                    return null;
                const rows = buildRows({ React, defs, configValues, updateConfigField, TagIncludeExclude, compositeRawRef, narrowTagWidth: 300 });
                return React.createElement('div', { className: 'card' }, [
                    React.createElement('div', { key: 'header', className: 'card-header d-flex justify-content-between align-items-center' }, [
                        React.createElement('span', { key: 'title' }, 'Configuration'),
                        React.createElement('button', { key: 'toggle', type: 'button', className: 'btn btn-secondary btn-sm', onClick: () => toggleShowConfig() }, showConfig ? 'Hide' : 'Show')
                    ]),
                    showConfig ? React.createElement('div', { key: 'body', className: 'card-body' }, [
                        React.createElement('div', { key: 'rowwrap', className: 'd-flex flex-column gap-2' }, rows)
                    ]) : null
                ]);
            }, [currentRecommender, configValues, updateConfigField, showConfig]);
            // Note: Zoom slider intentionally omitted for queue-style display
            const retryBackendProbe = useCallback(() => {
                discoverRecommenders();
                if (recommenderId && currentSceneId) {
                    fetchPage(0, false);
                }
            }, [discoverRecommenders, fetchPage, recommenderId, currentSceneId]);
            const backendNotice = backendHealthApi && typeof backendHealthApi.buildNotice === 'function'
                ? backendHealthApi.buildNotice(backendHealthState, { onRetry: retryBackendProbe, dense: true })
                : null;
            // Main render
            return React.createElement('div', {
                className: 'container-fluid similar-scenes-tab',
                ref: componentRef
            }, [
                backendNotice,
                // Algorithm selector (no surrounding background)
                React.createElement('div', { key: 'controls', className: 'd-flex align-items-center gap-3 mb-3 p-0' }, [
                    renderRecommenderSelector()
                ]),
                // Config panel separate block (full width) so it doesn't overflow out of the tab
                currentRecommender ? React.createElement('div', { key: 'configBlock', className: 'mb-3' }, [
                    renderConfigPanel()
                ]) : null,
                // Only show the big loading message when we don't have anything rendered yet
                (loading && scenes.length === 0) ? React.createElement('div', { key: 'loading', className: 'text-center text-muted py-3' }, 'Loading similar scenes...') : null,
                error ? React.createElement('div', { key: 'error', className: 'alert alert-danger' }, error) : null,
                !loading && !error && scenes.length === 0 ?
                    React.createElement('div', { key: 'empty', className: 'text-center text-muted py-3' }, 'No similar scenes found') : null,
                // Keep rendering the list even while loading next page to avoid scroll jumps
                scenes.length > 0 ? (() => {
                    // Use native queue list structure and CSS classes exactly as in the Queue tab
                    return React.createElement('ul', {
                        key: 'queue-list',
                        className: '' // Use default ul styling, no custom classes
                    }, scenes.map(renderQueueScene));
                })() : null,
                // Load more chevron button (centered)
                (hasMore || scenes.length >= PAGE_SIZE) ? (() => {
                    const svg = React.createElement('svg', { 'aria-hidden': 'true', focusable: 'false', 'data-prefix': 'fas', 'data-icon': 'chevron-down', className: 'svg-inline--fa fa-chevron-down fa-icon', role: 'img', xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 448 512' }, React.createElement('path', { fill: 'currentColor', d: "M201.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 338.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" }));
                    const btn = React.createElement('button', { key: 'chev', type: 'button', className: 'btn btn-primary', disabled: !!loading, onClick: (e) => { e.preventDefault(); e.stopPropagation(); if (loading)
                            return; const nextOffset = offset + PAGE_SIZE; fetchPage(nextOffset, true); } }, svg);
                    return React.createElement('div', { key: 'load-more', className: 'd-flex justify-content-center my-3' }, [btn]);
                })() : null
            ]);
        };
        // Export to global namespace for integration
        w.SimilarScenesViewer = SimilarScenesViewer;
        // Exported
    } // End initializeSimilarScenes
    // Wait for dependencies and initialize
    // Initialize immediately; SimilarTabIntegration resolves viewer at render time
    initializeSimilarScenes();
})();
})();

