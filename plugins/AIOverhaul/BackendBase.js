(function(){
// Shared helper to determine the backend base URL used by the frontend.
// Exposes a default export and also attaches to window.AIDefaultBackendBase for
// non-module consumers in the minimal build.
defaultBackendBase;
const PLUGIN_NAME = 'AIOverhaul';
// Local default to keep the UI functional before plugin config loads.
const DEFAULT_BACKEND_BASE = 'http://localhost:4153';
const CONFIG_QUERY = `query AIOverhaulPluginConfig($ids: [ID!]) {
  configuration {
    plugins(include: $ids)
  }
}`;
let configLoaded = false;
let configLoading = false;
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
function applyPluginConfig(base, captureEvents) {
    if (base !== undefined) {
        const normalized = normalizeBase(base);
        if (normalized !== null) {
            const value = normalized || '';
            try {
                window.AI_BACKEND_URL = value;
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
}
async function loadPluginConfig() {
    var _a, _b, _c, _d, _e, _f;
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
                applyPluginConfig(backendBase, interpretBool(captureEvents));
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
}
catch { }
})();

