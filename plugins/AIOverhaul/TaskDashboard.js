(function(){
// TaskDashboard (cleaned)
// Minimal responsibilities:
//  - Show active top-level tasks (no children listed) with progress inferred from children.
//  - Manual history fetch.
//  - Cancel queued/running parent tasks (single base URL resolution).
//  - Expand failed history rows to view/copy error.
function resolveBackendBase() {
    try {
        const globalFn = window.AIDefaultBackendBase;
        if (typeof globalFn === 'function') {
            const value = globalFn();
            if (typeof value === 'string')
                return value;
        }
    }
    catch { }
    try {
        const raw = window.AI_BACKEND_URL;
        if (typeof raw === 'string')
            return raw.replace(/\/$/, '');
    }
    catch {
        return '';
    }
    return '';
}
const debug = () => !!window.AIDebug;
const dlog = (...a) => { if (debug())
    console.debug('[TaskDashboard]', ...a); };
function getSharedApiKey() {
    try {
        const helper = window.AISharedApiKeyHelper;
        if (helper && typeof helper.get === 'function') {
            const value = helper.get();
            if (typeof value === 'string')
                return value.trim();
        }
    }
    catch { }
    const raw = window.AI_SHARED_API_KEY;
    return typeof raw === 'string' ? raw.trim() : '';
}
function withSharedKeyHeaders(init) {
    const helper = window.AISharedApiKeyHelper;
    if (helper && typeof helper.withHeaders === 'function') {
        return helper.withHeaders(init || {});
    }
    const key = getSharedApiKey();
    if (!key)
        return init || {};
    const headers = { ...(init && init.headers ? init.headers : {}) };
    headers['x-ai-api-key'] = key;
    return { ...(init || {}), headers };
}
function appendSharedKeyQuery(url) {
    const helper = window.AISharedApiKeyHelper;
    if (helper && typeof helper.appendQuery === 'function') {
        return helper.appendQuery(url);
    }
    const key = getSharedApiKey();
    if (!key)
        return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}api_key=${encodeURIComponent(key)}`;
}
function ensureWS(baseHttp) {
    var _a, _b, _c, _d;
    const g = window;
    if (!baseHttp) {
        try {
            (_b = (_a = g.__AI_TASK_WS__) === null || _a === void 0 ? void 0 : _a.close) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
        catch { }
        g.__AI_TASK_WS__ = null;
        g.__AI_TASK_WS_BASE__ = null;
        g.__AI_TASK_WS_INIT__ = false;
        return;
    }
    if (g.__AI_TASK_WS_BASE__ && g.__AI_TASK_WS_BASE__ !== baseHttp) {
        try {
            (_d = (_c = g.__AI_TASK_WS__) === null || _c === void 0 ? void 0 : _c.close) === null || _d === void 0 ? void 0 : _d.call(_c);
        }
        catch { }
        g.__AI_TASK_WS__ = null;
        g.__AI_TASK_WS_INIT__ = false;
    }
    if (g.__AI_TASK_WS__ && g.__AI_TASK_WS__.readyState === 1 && g.__AI_TASK_WS_BASE__ === baseHttp)
        return;
    if (g.__AI_TASK_WS_INIT__)
        return;
    g.__AI_TASK_WS_INIT__ = true;
    g.__AI_TASK_WS_BASE__ = baseHttp;
    const base = baseHttp.replace(/^http/, 'ws');
    const candidates = [`${base}/api/v1/ws/tasks`, `${base}/ws/tasks`];
    const urls = candidates.map((u) => appendSharedKeyQuery(u));
    let connected = false;
    for (const u of urls) {
        try {
            const sock = new WebSocket(u);
            g.__AI_TASK_WS__ = sock;
            if (!g.__AI_TASK_CACHE__)
                g.__AI_TASK_CACHE__ = {};
            if (!g.__AI_TASK_WS_LISTENERS__)
                g.__AI_TASK_WS_LISTENERS__ = {};
            if (!g.__AI_TASK_ANY_LISTENERS__)
                g.__AI_TASK_ANY_LISTENERS__ = [];
            sock.onmessage = (evt) => {
                var _a;
                try {
                    const m = JSON.parse(evt.data);
                    const task = m.task || ((_a = m.data) === null || _a === void 0 ? void 0 : _a.task) || m.data || m;
                    if (!(task === null || task === void 0 ? void 0 : task.id))
                        return;
                    g.__AI_TASK_CACHE__[task.id] = task;
                    const ls = g.__AI_TASK_WS_LISTENERS__[task.id];
                    if (ls)
                        ls.forEach((fn) => fn(task));
                    const anyLs = g.__AI_TASK_ANY_LISTENERS__;
                    if (anyLs)
                        anyLs.forEach((fn) => { try {
                            fn(task);
                        }
                        catch { } });
                }
                catch { }
            };
            sock.onclose = () => { if (g.__AI_TASK_WS__ === sock)
                g.__AI_TASK_WS__ = null; g.__AI_TASK_WS_INIT__ = false; };
            connected = true;
            break;
        }
        catch { }
    }
    if (!connected) {
        g.__AI_TASK_WS_INIT__ = false;
    }
}
function listActiveParents(cache) {
    const tasks = Object.values(cache || {});
    return tasks.filter(t => !t.group_id && !['completed', 'failed', 'cancelled'].includes(t.status))
        .sort((a, b) => (a.submitted_at || 0) - (b.submitted_at || 0));
}
function computeProgress(task) {
    const g = window;
    const cache = g.__AI_TASK_CACHE__ || {};
    const children = Object.values(cache).filter((c) => c.group_id === task.id);
    if (!children.length)
        return null;
    let done = 0, running = 0, queued = 0, failed = 0, cancelled = 0;
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
const TaskDashboard = () => {
    var _a;
    const React = ((_a = window.PluginApi) === null || _a === void 0 ? void 0 : _a.React) || window.React;
    if (!React) {
        console.error('[TaskDashboard] React not found');
        return null;
    }
    const [backendBase, setBackendBase] = React.useState(() => resolveBackendBase());
    const [active, setActive] = React.useState([]);
    const [history, setHistory] = React.useState([]);
    const [loadingHistory, setLoadingHistory] = React.useState(false);
    const [filterService, setFilterService] = React.useState(null);
    const [expanded, setExpanded] = React.useState(new Set());
    const [cancelling, setCancelling] = React.useState(new Set());
    React.useEffect(() => { ensureWS(backendBase); }, [backendBase]);
    React.useEffect(() => {
        const handleBaseUpdate = () => {
            const next = resolveBackendBase();
            setBackendBase((prev) => (next === prev ? prev : next));
        };
        try {
            window.addEventListener('AIBackendBaseUpdated', handleBaseUpdate);
        }
        catch { }
        return () => { try {
            window.removeEventListener('AIBackendBaseUpdated', handleBaseUpdate);
        }
        catch { } };
    }, []);
    // Active tasks tracking
    React.useEffect(() => {
        const g = window;
        if (!g.__AI_TASK_ANY_LISTENERS__)
            g.__AI_TASK_ANY_LISTENERS__ = [];
        const pull = () => { const cache = g.__AI_TASK_CACHE__ || {}; setActive(listActiveParents(cache)); };
        pull();
        const listener = () => pull();
        g.__AI_TASK_ANY_LISTENERS__.push(listener);
        return () => { g.__AI_TASK_ANY_LISTENERS__ = (g.__AI_TASK_ANY_LISTENERS__ || []).filter((fn) => fn !== listener); };
    }, []);
    const fetchHistory = React.useCallback(async () => {
        if (!backendBase) {
            setLoadingHistory(false);
            setHistory([]);
            return;
        }
        setLoadingHistory(true);
        try {
            const url = new URL(`${backendBase}/api/v1/tasks/history`);
            url.searchParams.set('limit', '50');
            if (filterService)
                url.searchParams.set('service', filterService);
            if (debug())
                dlog('Fetch history URL:', url.toString());
            const res = await fetch(url.toString(), withSharedKeyHeaders());
            if (!res.ok)
                return;
            const ct = (res.headers.get('content-type') || '').toLowerCase();
            if (!ct.includes('application/json'))
                return;
            const data = await res.json();
            if (data && Array.isArray(data.history))
                setHistory(data.history);
        }
        finally {
            setLoadingHistory(false);
        }
    }, [backendBase, filterService]);
    React.useEffect(() => { fetchHistory(); }, [fetchHistory]);
    function toggleExpand(id) { setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
    function copyToClipboard(text) { var _a; try {
        (_a = navigator.clipboard) === null || _a === void 0 ? void 0 : _a.writeText(text);
    }
    catch {
        try {
            window.prompt('Copy error text manually:', text);
        }
        catch { }
    } }
    async function cancelTask(id) {
        if (!backendBase) {
            alert('AI backend URL is not configured.');
            return;
        }
        setCancelling((prev) => { const n = new Set(prev); n.add(id); return n; });
        try {
            const res = await fetch(`${backendBase}/api/v1/tasks/${id}/cancel`, withSharedKeyHeaders({ method: 'POST' }));
            if (!res.ok)
                throw new Error('Cancel failed HTTP ' + res.status);
        }
        catch (e) {
            setCancelling((prev) => { const n = new Set(prev); n.delete(id); return n; });
            alert('Cancel failed: ' + (e.message || 'unknown'));
        }
    }
    const formatTs = (v) => v ? new Date(v * 1000).toLocaleTimeString() : '-';
    const services = Array.from(new Set(history.map(h => h.service).concat(active.map(a => a.service))));
    // ---- Render (structure & classNames intentionally unchanged) ----
    return React.createElement('div', { className: 'ai-task-dashboard' }, [
        React.createElement('div', { key: 'hdr', className: 'ai-task-dash__header' }, [
            React.createElement('h3', { key: 'title' }, 'AI Tasks'),
            React.createElement('div', { key: 'filters', className: 'ai-task-dash__filters' }, [
                React.createElement('select', { key: 'svc', value: filterService || '', onChange: (e) => setFilterService(e.target.value || null) }, [
                    React.createElement('option', { key: 'all', value: '' }, 'All Services'),
                    ...services.map(s => React.createElement('option', { key: s, value: s }, s))
                ]),
                React.createElement('button', { key: 'refresh', onClick: fetchHistory, disabled: loadingHistory }, loadingHistory ? 'Refreshing…' : 'Refresh')
            ])
        ]),
        React.createElement('div', { key: 'active', className: 'ai-task-dash__section' }, [
            React.createElement('h4', { key: 'lbl' }, 'Active'),
            active.length === 0 && React.createElement('div', { key: 'none', className: 'ai-task-dash__empty' }, 'No active tasks'),
            ...active.map((t) => {
                const prog = computeProgress(t);
                const isCancelling = cancelling.has(t.id);
                return React.createElement('div', { key: t.id, className: 'ai-task-row' }, [
                    React.createElement('div', { key: 'svc', className: 'ai-task-row__svc' }, t.service),
                    React.createElement('div', { key: 'act', className: 'ai-task-row__action' }, t.action_id),
                    React.createElement('div', { key: 'status', className: 'ai-task-row__status' }, t.status + (isCancelling ? ' (cancelling...)' : '')),
                    React.createElement('div', { key: 'progress', className: 'ai-task-row__progress' }, prog != null ? `${Math.round(prog * 100)}%` : ''),
                    React.createElement('div', { key: 'times', className: 'ai-task-row__times' }, formatTs(t.started_at)),
                    (t.status === 'queued' || t.status === 'running') && React.createElement('button', { key: 'cancel', disabled: isCancelling, className: 'ai-task-row__cancel', onClick: () => cancelTask(t.id), style: { marginLeft: 8 } }, isCancelling ? 'Cancelling…' : 'Cancel')
                ]);
            })
        ]),
        React.createElement('div', { key: 'hist', className: 'ai-task-dash__section' }, [
            React.createElement('h4', { key: 'lbl' }, 'Recent History'),
            history.length === 0 && React.createElement('div', { key: 'none', className: 'ai-task-dash__empty' }, 'No recent tasks'),
            ...history.map(h => {
                const isFailed = h.status === 'failed';
                const isExpanded = expanded.has(h.task_id);
                const rowClasses = ['ai-task-row', 'ai-task-row--history'];
                if (isFailed)
                    rowClasses.push('ai-task-row--failed');
                if (isExpanded)
                    rowClasses.push('ai-task-row--expanded');
                return React.createElement(React.Fragment, { key: h.task_id }, [
                    React.createElement('div', { key: 'row', className: rowClasses.join(' '), onClick: () => { if (isFailed)
                            toggleExpand(h.task_id); }, style: isFailed ? { cursor: 'pointer' } : undefined }, [
                        React.createElement('div', { key: 'svc', className: 'ai-task-row__svc' }, h.service),
                        React.createElement('div', { key: 'act', className: 'ai-task-row__action' }, h.action_id),
                        React.createElement('div', { key: 'status', className: 'ai-task-row__status' }, h.status + (isFailed ? (isExpanded ? ' ▲' : ' ▼') : '')),
                        React.createElement('div', { key: 'dur', className: 'ai-task-row__progress' }, h.duration_ms != null ? `${h.duration_ms}ms` : ''),
                        React.createElement('div', { key: 'time', className: 'ai-task-row__times' }, formatTs(h.finished_at || h.started_at))
                    ]),
                    isFailed && isExpanded && h.error && React.createElement('div', { key: 'err', className: 'ai-task-row__errorDetail' }, [
                        React.createElement('pre', { key: 'pre', style: { margin: 0, whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.3', background: '#330', color: '#fdd', padding: '6px', borderRadius: '4px', maxHeight: '200px', overflow: 'auto' } }, h.error),
                        React.createElement('div', { key: 'btns', style: { marginTop: '4px', display: 'flex', gap: '8px' } }, [
                            React.createElement('button', { key: 'copy', onClick: (e) => { e.stopPropagation(); copyToClipboard(h.error); } }, 'Copy Error'),
                            React.createElement('button', { key: 'close', onClick: (e) => { e.stopPropagation(); toggleExpand(h.task_id); } }, 'Close')
                        ])
                    ])
                ]);
            })
        ])
    ]);
};
window.TaskDashboard = TaskDashboard;
window.AITaskDashboard = TaskDashboard;
window.AITaskDashboardMount = function (container) {
    var _a, _b;
    const React = ((_a = window.PluginApi) === null || _a === void 0 ? void 0 : _a.React) || window.React;
    const ReactDOM = window.ReactDOM || ((_b = window.PluginApi) === null || _b === void 0 ? void 0 : _b.ReactDOM);
    if (!React || !ReactDOM) {
        console.error('[TaskDashboard] React or ReactDOM not available');
        return;
    }
    ReactDOM.render(React.createElement(TaskDashboard, {}), container);
};
TaskDashboard;
})();

