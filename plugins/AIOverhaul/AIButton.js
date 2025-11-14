(function(){
// AIButton (MinimalAIButton)
// Contract:
//  - Provides a single floating/contextual button that lists available AI actions for current page context.
//  - No polling: actions fetched on open + context change; task progress via shared websocket + global cache.
//  - Supports multiple concurrent parent/controller tasks; shows aggregate count or single progress ring.
//  - Exposes global aliases: window.AIButton & window.MinimalAIButton for integrations to mount.
//  - Debug logging gated by window.AIDebug = true.
//  - Assumes backend REST under /api/v1 and websocket under /api/v1/ws/tasks (with legacy fallback /ws/tasks).
//  - Only parent/controller task IDs are tracked in activeTasks; child task events still drive progress inference.
// ---- Small internal helpers (pure / non-visual) ----
const sanitizeBackendBase = (value) => {
    if (typeof value !== 'string')
        return '';
    const trimmed = value.trim();
    if (!trimmed)
        return '';
    const cleaned = trimmed.replace(/\/$/, '');
    try {
        if (typeof location !== 'undefined' && location.origin) {
            const origin = location.origin.replace(/\/$/, '');
            if (cleaned === origin)
                return '';
        }
    }
    catch { }
    return cleaned;
};
const getBackendBase = () => {
    const fn = window.AIDefaultBackendBase;
    if (typeof fn !== 'function')
        throw new Error('AIDefaultBackendBase not initialized. Ensure backendBase is loaded first.');
    return sanitizeBackendBase(fn());
};
const debugEnabled = () => !!window.AIDebug;
const dlog = (...a) => { if (debugEnabled())
    console.log('[AIButton]', ...a); };
const parseActionsChanged = (prev, next) => {
    if (!prev || prev.length !== next.length)
        return true;
    for (let i = 0; i < next.length; i++) {
        const p = prev[i];
        const n = next[i];
        if (p.id !== n.id || p.label !== n.label || p.result_kind !== n.result_kind)
            return true;
    }
    return false;
};
const computeSingleProgress = (activeIds) => {
    if (activeIds.length !== 1)
        return null;
    try {
        const g = window;
        const tid = activeIds[0];
        const cache = g.__AI_TASK_CACHE__ || {};
        const tasks = Object.values(cache);
        const children = tasks.filter(t => t.group_id === tid);
        if (!children.length)
            return 0; // show ring at 0%, matches previous UX
        let done = 0, running = 0, queued = 0, failed = 0, cancelled = 0; // cancelled intentionally excluded from denominator
        for (const c of children) {
            switch (c.status) {
                case 'completed':
                    done++;
                    break;
                case 'running':
                    running++;
                    break;
                case 'queued':
                    queued++;
                    break;
                case 'failed':
                    failed++;
                    break;
                case 'cancelled':
                    cancelled++;
                    break;
            }
        }
        const effectiveTotal = done + running + queued + failed;
        if (!effectiveTotal)
            return 0;
        const weighted = done + failed + running * 0.5;
        return Math.min(1, weighted / effectiveTotal);
    }
    catch {
        return null;
    }
};
const ensureTaskWebSocket = (backendBase) => {
    const g = window;
    dlog('ensureWS invoked');
    if (g.__AI_TASK_WS__ && g.__AI_TASK_WS__.readyState === 1)
        return g.__AI_TASK_WS__;
    if (g.__AI_TASK_WS_INIT__)
        return g.__AI_TASK_WS__;
    g.__AI_TASK_WS_INIT__ = true;
    const base = backendBase.replace(/^http/, 'ws');
    const paths = [`${base}/api/v1/ws/tasks`, `${base}/ws/tasks`];
    for (const url of paths) {
        try {
            dlog('Attempt WS connect', url);
            const sock = new WebSocket(url);
            g.__AI_TASK_WS__ = sock;
            wireSocket(sock);
            return sock;
        }
        catch (e) {
            if (debugEnabled())
                console.warn('[AIButton] WS connect failed candidate', url, e);
        }
    }
    g.__AI_TASK_WS_INIT__ = false;
    return null;
};
function wireSocket(sock) {
    const g = window;
    if (!g.__AI_TASK_WS_LISTENERS__)
        g.__AI_TASK_WS_LISTENERS__ = {};
    if (!g.__AI_TASK_ANY_LISTENERS__)
        g.__AI_TASK_ANY_LISTENERS__ = [];
    if (!g.__AI_TASK_CACHE__)
        g.__AI_TASK_CACHE__ = {};
    sock.onopen = () => { dlog('WS open', sock.url); };
    sock.onmessage = (evt) => {
        var _a;
        dlog('WS raw message', evt.data);
        try {
            const m = JSON.parse(evt.data);
            const task = m.task || ((_a = m.data) === null || _a === void 0 ? void 0 : _a.task) || m.data || m;
            if (!(task === null || task === void 0 ? void 0 : task.id)) {
                dlog('Message without task id ignored', m);
                return;
            }
            g.__AI_TASK_CACHE__[task.id] = task;
            const ls = g.__AI_TASK_WS_LISTENERS__[task.id];
            if (ls)
                ls.forEach((fn) => fn(task));
            const anyLs = g.__AI_TASK_ANY_LISTENERS__;
            if (anyLs && anyLs.length)
                anyLs.forEach((fn) => { try {
                    fn(task);
                }
                catch { } });
        }
        catch (err) {
            if (debugEnabled())
                console.error('[AIButton] Failed parse WS message', err);
        }
    };
    const cleanup = (ev) => { if (debugEnabled())
        console.warn('[AIButton] WS closed/error', ev === null || ev === void 0 ? void 0 : ev.code, ev === null || ev === void 0 ? void 0 : ev.reason); if (window.__AI_TASK_WS__ === sock)
        window.__AI_TASK_WS__ = null; window.__AI_TASK_WS_INIT__ = false; };
    sock.onclose = cleanup;
    sock.onerror = cleanup;
}
const MinimalAIButton = () => {
    var _a, _b;
    const React = ((_a = window.PluginApi) === null || _a === void 0 ? void 0 : _a.React) || window.React;
    if (!React) {
        console.error('[AIButton] React not found on window.PluginApi.React');
        return null;
    }
    const pageAPI = window.AIPageContext;
    if (!pageAPI) {
        console.error('[AIButton] AIPageContext missing on window');
        return null;
    }
    const [context, setContext] = React.useState(pageAPI.get());
    const [showTooltip, setShowTooltip] = React.useState(false);
    const [openMenu, setOpenMenu] = React.useState(false);
    const [loadingActions, setLoadingActions] = React.useState(false);
    const [actions, setActions] = React.useState([]);
    const [activeTasks, setActiveTasks] = React.useState([]);
    const [recentlyFinished, setRecentlyFinished] = React.useState([]); // retained for potential future UX
    const [backendBase, setBackendBase] = React.useState(() => getBackendBase());
    React.useEffect(() => {
        const updateBase = (event) => {
            const customEvent = event;
            const detail = customEvent === null || customEvent === void 0 ? void 0 : customEvent.detail;
            if (typeof detail === 'string') {
                setBackendBase(sanitizeBackendBase(detail));
            }
            else {
                setBackendBase(getBackendBase());
            }
        };
        updateBase();
        window.addEventListener('AIBackendBaseUpdated', updateBase);
        return () => window.removeEventListener('AIBackendBaseUpdated', updateBase);
    }, []);
    const actionsRef = React.useRef(null);
    React.useEffect(() => pageAPI.subscribe((ctx) => setContext(ctx)), []);
    const refetchActions = React.useCallback(async (ctx, opts = {}) => {
        if (!backendBase) {
            if (!opts.silent)
                setLoadingActions(false);
            setActions([]);
            return;
        }
        if (!opts.silent)
            setLoadingActions(true);
        try {
            const res = await fetch(`${backendBase}/api/v1/actions/available`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: {
                        page: ctx.page,
                        entityId: ctx.entityId,
                        isDetailView: ctx.isDetailView,
                        selectedIds: ctx.selectedIds || [],
                        visibleIds: ctx.visibleIds || []
                    }
                })
            });
            if (!res.ok)
                throw new Error('Failed to load actions');
            const data = await res.json();
            if (parseActionsChanged(actionsRef.current, data)) {
                actionsRef.current = data;
                setActions(data);
            }
        }
        catch {
            if (!opts.silent)
                setActions([]);
        }
        finally {
            if (!opts.silent)
                setLoadingActions(false);
        }
    }, [backendBase]);
    React.useEffect(() => { refetchActions(context); }, [context, refetchActions]);
    // Websocket ensure
    React.useEffect(() => {
        if (!backendBase)
            return;
        ensureTaskWebSocket(backendBase);
    }, [backendBase]);
    const executeAction = async (actionId) => {
        var _a, _b, _c;
        if (!backendBase) {
            alert('AI backend URL is not configured. Update it under AI Overhaul settings.');
            return;
        }
        dlog('Execute action', actionId, 'context', context);
        ensureTaskWebSocket(backendBase);
        try {
            const g = window;
            let liveContext = context;
            try {
                if (pageAPI.forceRefresh)
                    pageAPI.forceRefresh();
                if (pageAPI.get) {
                    liveContext = pageAPI.get();
                    setContext(liveContext);
                }
            }
            catch { /* fall back to current state */ }
            const actionMeta = (_a = actionsRef.current) === null || _a === void 0 ? void 0 : _a.find((a) => a.id === actionId);
            const resultKind = (actionMeta === null || actionMeta === void 0 ? void 0 : actionMeta.result_kind) || 'none';
            const res = await fetch(`${backendBase}/api/v1/actions/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action_id: actionId,
                    context: {
                        page: liveContext.page,
                        entityId: liveContext.entityId,
                        isDetailView: liveContext.isDetailView,
                        selectedIds: liveContext.selectedIds || [],
                        visibleIds: liveContext.visibleIds || []
                    },
                    params: {}
                })
            });
            if (!res.ok) {
                let message = 'Submit failed';
                try {
                    const err = await res.json();
                    if (err === null || err === void 0 ? void 0 : err.detail) {
                        if (typeof err.detail === 'string') {
                            message = err.detail;
                        }
                        else if (typeof ((_b = err.detail) === null || _b === void 0 ? void 0 : _b.message) === 'string') {
                            message = err.detail.message;
                        }
                    }
                }
                catch { }
                throw new Error(message);
            }
            const { task_id: taskId } = await res.json();
            if (!g.__AI_TASK_WS_LISTENERS__)
                g.__AI_TASK_WS_LISTENERS__ = {};
            if (!g.__AI_TASK_WS_LISTENERS__[taskId])
                g.__AI_TASK_WS_LISTENERS__[taskId] = [];
            setActiveTasks((prev) => prev.includes(taskId) ? prev : [...prev, taskId]);
            const finalize = (t) => {
                if (t.status === 'completed') {
                    if (resultKind === 'dialog' || resultKind === 'notification') {
                        alert(`Action ${actionId} result:\n` + JSON.stringify(t.result, null, 2));
                    }
                }
                else if (t.status === 'failed') {
                    alert(`Action ${actionId} failed: ${t.error || 'unknown error'}`);
                }
                setActiveTasks((prev) => prev.filter((id) => id !== t.id));
                setRecentlyFinished((prev) => [t.id, ...prev].slice(0, 20));
            };
            const listener = (t) => { if (t.id !== taskId)
                return; if (["completed", "failed", "cancelled"].includes(t.status)) {
                finalize(t);
                g.__AI_TASK_WS_LISTENERS__[taskId] = (g.__AI_TASK_WS_LISTENERS__[taskId] || []).filter((fn) => fn !== listener);
            } };
            g.__AI_TASK_WS_LISTENERS__[taskId].push(listener);
            if ((_c = g.__AI_TASK_CACHE__) === null || _c === void 0 ? void 0 : _c[taskId])
                listener(g.__AI_TASK_CACHE__[taskId]);
        }
        catch (e) {
            alert(`Action ${actionId} failed: ${e.message}`);
        }
    };
    // Any-task listener for progress updates
    React.useEffect(() => {
        const g = window;
        if (!g.__AI_TASK_ANY_LISTENERS__)
            g.__AI_TASK_ANY_LISTENERS__ = [];
        const listener = (t) => { if (!activeTasks.length)
            return; if (activeTasks.includes(t.id) || activeTasks.includes(t.group_id))
            setProgressVersion((v) => v + 1); };
        g.__AI_TASK_ANY_LISTENERS__.push(listener);
        return () => { g.__AI_TASK_ANY_LISTENERS__ = (g.__AI_TASK_ANY_LISTENERS__ || []).filter((fn) => fn !== listener); };
    }, [activeTasks]);
    const [progressVersion, setProgressVersion] = React.useState(0); // triggers re-render on child task activity
    const singleProgress = computeSingleProgress(activeTasks);
    const progressPct = singleProgress != null ? Math.round(singleProgress * 100) : null;
    const toggleMenu = () => {
        if (!openMenu) {
            let liveContext = context;
            try {
                if (pageAPI.forceRefresh)
                    pageAPI.forceRefresh();
                if (pageAPI.get) {
                    liveContext = pageAPI.get();
                    setContext(liveContext);
                }
            }
            catch { /* best effort */ }
            refetchActions(liveContext, { silent: true });
        }
        setOpenMenu((o) => !o);
    };
    const getButtonIcon = () => { switch (context.page) {
        case 'scenes': return '🎬';
        case 'galleries':
        case 'images': return '🖼️';
        case 'performers': return '👤';
        case 'studios': return '🏢';
        case 'tags': return '🔖';
        case 'markers': return '⏱️';
        case 'home': return '🏠';
        case 'settings': return '⚙️';
        default: return '🤖';
    } };
    // Map page keys to more compact labels where necessary (e.g. 'performers' -> 'Actors')
    const getButtonLabel = () => {
        if (!context || !context.page)
            return 'AI';
        switch (context.page) {
            case 'performers':
                return 'Actors';
            default:
                return context.page;
        }
    };
    const colorClass = context.isDetailView ? 'ai-btn--detail' : `ai-btn--${context.page}`;
    // Build children (unchanged structure / classes)
    const elems = [];
    const activeCount = activeTasks.length;
    const progressRing = (singleProgress != null && activeCount === 1) ? React.createElement('div', { key: 'ring', className: 'ai-btn__progress-ring', style: { ['--ai-progress']: `${progressPct}%` } }) : null;
    elems.push(React.createElement('button', { key: 'ai-btn', className: `ai-btn ${colorClass}` + (singleProgress != null ? ' ai-btn--progress' : ''), onClick: toggleMenu, onMouseEnter: () => setShowTooltip(true), onMouseLeave: () => setShowTooltip(false), disabled: loadingActions }, [
        progressRing,
        React.createElement('div', { key: 'icon', className: 'ai-btn__icon' }, activeCount === 0 ? getButtonIcon() : (activeCount === 1 && progressPct != null ? `${progressPct}%` : '⏳')),
        React.createElement('div', { key: 'lbl', className: 'ai-btn__label' }, String(getButtonLabel() || 'AI').toUpperCase()),
        activeCount > 1 && React.createElement('span', { key: 'badge', className: 'ai-btn__badge' }, String(activeCount))
    ]));
    if (showTooltip && !openMenu) {
        elems.push(React.createElement('div', { key: 'tip', className: 'ai-btn__tooltip' }, [
            React.createElement('div', { key: 'main', className: 'ai-btn__tooltip-main' }, context.contextLabel),
            React.createElement('div', { key: 'detail', className: 'ai-btn__tooltip-detail' }, context.detailLabel || ''),
            context.entityId && React.createElement('div', { key: 'id', className: 'ai-btn__tooltip-id' }, `ID: ${context.entityId}`),
            ((_b = context.selectedIds) === null || _b === void 0 ? void 0 : _b.length) && React.createElement('div', { key: 'sel', className: 'ai-btn__tooltip-sel' }, `Selected: ${context.selectedIds.length}`)
        ]));
    }
    if (openMenu) {
        elems.push(React.createElement('div', { key: 'menu', className: 'ai-actions-menu' }, [
            loadingActions && React.createElement('div', { key: 'loading', className: 'ai-actions-menu__status' }, 'Loading actions...'),
            !loadingActions && actions.length === 0 && React.createElement('div', { key: 'none', className: 'ai-actions-menu__status' }, 'No actions'),
            !loadingActions && actions.map((a) => {
                var _a, _b;
                return React.createElement('button', { key: a.id, onClick: () => executeAction(a.id), className: 'ai-actions-menu__item' }, [
                    React.createElement('span', { key: 'svc', className: 'ai-actions-menu__svc' }, ((_b = (_a = a.service) === null || _a === void 0 ? void 0 : _a.toUpperCase) === null || _b === void 0 ? void 0 : _b.call(_a)) || a.service),
                    React.createElement('span', { key: 'albl', style: { flexGrow: 1 } }, a.label),
                    a.result_kind === 'dialog' && React.createElement('span', { key: 'rk', className: 'ai-actions-menu__rk' }, '↗')
                ]);
            })
        ]));
    }
    return React.createElement('div', { className: 'minimal-ai-button', style: { position: 'relative', display: 'inline-block' } }, elems);
};
window.MinimalAIButton = MinimalAIButton;
window.AIButton = MinimalAIButton; // alias for integrations expecting AIButton
if (!window.__AI_BUTTON_LOADED__) {
    window.__AI_BUTTON_LOADED__ = true;
    if (window.AIDebug)
        console.log('[AIButton] Component loaded and globals registered');
}
MinimalAIButton;
})();

