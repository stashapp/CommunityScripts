(function(){
// Shared helper to determine the backend base URL used by the frontend.
// Exposes a default export and also attaches to window.AIDefaultBackendBase for
// non-module consumers in the minimal build.
getSharedApiKey;
defaultBackendBase;
const PLUGIN_NAME = 'AIOverhaul';
// Local default to keep the UI functional before plugin config loads.
const DEFAULT_BACKEND_BASE = 'http://localhost:4153';
const STORAGE_KEY = 'ai_backend_base_url';
const CONFIG_QUERY = `query AIOverhaulPluginConfig($ids: [ID!]) {
  configuration {
    plugins(include: $ids)
  }
}`;
const SHARED_KEY_EVENT = 'AISharedApiKeyUpdated';
const SHARED_KEY_HEADER = 'x-ai-api-key';
const SHARED_KEY_QUERY = 'api_key';
const SHARED_KEY_STORAGE = 'ai_shared_api_key';
let configLoaded = false;
let configLoading = false;
let sharedApiKeyValue = '';
function getOrigin() {
    try {
        if (typeof location !== 'undefined' && location.origin) {
            return location.origin.replace(/\/$/, '');
        }
    }
    catch { }
    return '';
}
function normalizeBase(raw) {
    if (typeof raw !== 'string')
        return null;
    const trimmed = raw.trim();
    if (!trimmed)
        return '';
    const cleaned = trimmed.replace(/\/$/, '');
    const origin = getOrigin();
    if (origin && cleaned === origin) {
        return '';
    }
    return cleaned;
}
function interpretBool(raw) {
    if (typeof raw === 'boolean')
        return raw;
    if (typeof raw === 'number')
        return raw !== 0;
    if (typeof raw === 'string') {
        const lowered = raw.trim().toLowerCase();
        if (!lowered)
            return false;
        if (['1', 'true', 'yes', 'on'].includes(lowered))
            return true;
        if (['0', 'false', 'no', 'off'].includes(lowered))
            return false;
    }
    return null;
}
function normalizeSharedKey(raw) {
    if (typeof raw !== 'string')
        return '';
    return raw.trim();
}
function setSharedApiKey(raw) {
    const normalized = normalizeSharedKey(raw);
    if (normalized === sharedApiKeyValue)
        return;
    sharedApiKeyValue = normalized;
    try {
        if (normalized) {
            try {
                sessionStorage.setItem(SHARED_KEY_STORAGE, normalized);
            }
            catch { }
        }
        else {
            try {
                sessionStorage.removeItem(SHARED_KEY_STORAGE);
            }
            catch { }
        }
        window.AI_SHARED_API_KEY = normalized;
        window.dispatchEvent(new CustomEvent(SHARED_KEY_EVENT, { detail: normalized }));
    }
    catch { }
}
function getSharedApiKey() {
    if (sharedApiKeyValue)
        return sharedApiKeyValue;
    try {
        const stored = sessionStorage.getItem(SHARED_KEY_STORAGE);
        if (typeof stored === 'string' && stored.trim()) {
            sharedApiKeyValue = stored.trim();
            return sharedApiKeyValue;
        }
    }
    catch { }
    try {
        const globalValue = window.AI_SHARED_API_KEY;
        if (typeof globalValue === 'string') {
            sharedApiKeyValue = globalValue.trim();
            return sharedApiKeyValue;
        }
    }
    catch { }
    return '';
}
function withSharedKeyHeaders(init) {
    const key = getSharedApiKey();
    if (!key)
        return init ? init : {};
    const next = { ...(init || {}) };
    const headers = new Headers((init === null || init === void 0 ? void 0 : init.headers) || {});
    headers.set(SHARED_KEY_HEADER, key);
    next.headers = headers;
    return next;
}
function appendSharedApiKeyQuery(url) {
    const key = getSharedApiKey();
    if (!key)
        return url;
    try {
        const base = getOrigin() || undefined;
        const resolved = new URL(url, url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ws://') || url.startsWith('wss://') ? undefined : base);
        resolved.searchParams.set(SHARED_KEY_QUERY, key);
        return resolved.toString();
    }
    catch {
        const sep = url.includes('?') ? '&' : '?';
        return `${url}${sep}${SHARED_KEY_QUERY}=${encodeURIComponent(key)}`;
    }
}
function applyPluginConfig(base, captureEvents, sharedKey) {
    if (base !== undefined) {
        const normalized = normalizeBase(base);
        if (normalized !== null) {
            const value = normalized || '';
            try {
                window.AI_BACKEND_URL = value;
                try {
                    if (value) {
                        sessionStorage.setItem(STORAGE_KEY, value);
                    }
                    else {
                        sessionStorage.removeItem(STORAGE_KEY);
                    }
                }
                catch { }
                window.dispatchEvent(new CustomEvent('AIBackendBaseUpdated', { detail: value }));
            }
            catch { }
        }
    }
    if (captureEvents !== undefined && captureEvents !== null) {
        const normalized = !!captureEvents;
        try {
            window.__AI_INTERACTIONS_ENABLED__ = normalized;
        }
        catch { }
        try {
            const tracker = window.stashAIInteractionTracker;
            if (tracker) {
                if (typeof tracker.setEnabled === 'function')
                    tracker.setEnabled(normalized);
                else if (typeof tracker.configure === 'function')
                    tracker.configure({ enabled: normalized });
            }
        }
        catch { }
    }
    if (sharedKey !== undefined) {
        setSharedApiKey(sharedKey);
    }
}
async function loadPluginConfig() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (configLoaded || configLoading)
        return;
    configLoading = true;
    try {
        const resp = await fetch('/graphql', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ query: CONFIG_QUERY, variables: { ids: [PLUGIN_NAME] } }),
        });
        if (!resp.ok)
            return;
        const payload = await resp.json().catch(() => null);
        const plugins = (_b = (_a = payload === null || payload === void 0 ? void 0 : payload.data) === null || _a === void 0 ? void 0 : _a.configuration) === null || _b === void 0 ? void 0 : _b.plugins;
        if (plugins && typeof plugins === 'object') {
            const entry = plugins[PLUGIN_NAME];
            if (entry && typeof entry === 'object') {
                const backendBase = (_d = (_c = entry.backend_base_url) !== null && _c !== void 0 ? _c : entry.backendBaseUrl) !== null && _d !== void 0 ? _d : entry.backendBaseURL;
                const captureEvents = (_f = (_e = entry.capture_events) !== null && _e !== void 0 ? _e : entry.captureEvents) !== null && _f !== void 0 ? _f : entry.captureEventsEnabled;
                const sharedKey = (_h = (_g = entry.shared_api_key) !== null && _g !== void 0 ? _g : entry.sharedApiKey) !== null && _h !== void 0 ? _h : entry.sharedKey;
                applyPluginConfig(backendBase, interpretBool(captureEvents), typeof sharedKey === 'string' ? sharedKey : undefined);
            }
        }
    }
    catch { }
    finally {
        configLoaded = true;
        configLoading = false;
    }
}
function defaultBackendBase() {
    try {
        if (!configLoaded)
            loadPluginConfig();
    }
    catch { }
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored && typeof stored === 'string') {
            const normalized = normalizeBase(stored);
            if (normalized !== null && normalized !== undefined) {
                return normalized;
            }
        }
    }
    catch { }
    if (typeof window.AI_BACKEND_URL === 'string') {
        const explicit = normalizeBase(window.AI_BACKEND_URL);
        if (explicit !== null && explicit !== undefined) {
            return explicit;
        }
        return '';
    }
    return DEFAULT_BACKEND_BASE;
}
// Also attach as a global so files that are executed before this module can still
// use the shared function when available.
try {
    window.AIDefaultBackendBase = defaultBackendBase;
    defaultBackendBase.loadPluginConfig = loadPluginConfig;
    defaultBackendBase.applyPluginConfig = applyPluginConfig;
    window.AISharedApiKeyHelper = {
        get: getSharedApiKey,
        withHeaders: withSharedKeyHeaders,
        appendQuery: appendSharedApiKeyQuery,
    };
}
catch { }
})();

