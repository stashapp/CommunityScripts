(function(){
// Shared backend connectivity tracking & notice helpers for the AI Overhaul frontend.
// Each bundle is built as an isolated IIFE, so we expose a small global helper
// (`window.AIBackendHealth`) that provides three core pieces:
//   • reportOk / reportError for callers performing fetches
//   • useBackendHealth hook for React components to subscribe to status changes
//   • buildNotice helper to render a consistent user-facing outage banner
// The goal is to provide a single, user-friendly experience whenever the
// backend cannot be reached instead of bespoke inline error badges.
(function initBackendHealth() {
    const w = window;
    const listeners = new Set();
    const EVENT_NAME = 'AIBackendHealthChange';
    function now() { return Date.now ? Date.now() : new Date().getTime(); }
    function getOrigin() {
        try {
            if (typeof location !== 'undefined' && location.origin) {
                return location.origin.replace(/\/$/, '');
            }
        }
        catch (_) { }
        return '';
    }
    function normalizeBase(base) {
        if (base === undefined || base === null)
            return current.backendBase || '';
        try {
            const str = String(base || '').trim();
            if (!str)
                return '';
            const cleaned = str.replace(/\/$/, '');
            const origin = getOrigin();
            return origin && cleaned === origin ? '' : cleaned;
        }
        catch (_) {
            return '';
        }
    }
    function fallbackBase() {
        try {
            const fn = (w.AIDefaultBackendBase || w.defaultBackendBase);
            if (typeof fn === 'function') {
                const base = fn();
                if (typeof base === 'string') {
                    const normalized = normalizeBase(base);
                    if (normalized)
                        return normalized;
                }
            }
        }
        catch (_) { }
        return '';
    }
    function emit(state) {
        listeners.forEach((fn) => {
            try {
                fn(state);
            }
            catch (err) {
                if (w.AIDebug)
                    console.warn('[BackendHealth] listener error', err);
            }
        });
        try {
            w.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: state }));
        }
        catch (_) { }
    }
    let current = {
        status: 'idle',
        backendBase: fallbackBase(),
        lastUpdated: now(),
        message: undefined,
        lastError: undefined
    };
    function update(partial) {
        var _a, _b;
        const next = {
            ...current,
            ...partial,
            backendBase: normalizeBase((_b = (_a = partial.backendBase) !== null && _a !== void 0 ? _a : current.backendBase) !== null && _b !== void 0 ? _b : fallbackBase()),
            lastUpdated: now()
        };
        const changed = next.status !== current.status ||
            next.backendBase !== current.backendBase ||
            next.message !== current.message ||
            next.lastError !== current.lastError;
        current = next;
        if (changed)
            emit(current);
    }
    function describeErrorMessage(message, baseHint) {
        const baseLabel = baseHint ? baseHint : (current.backendBase || fallbackBase());
        const prefix = "Can't reach the AI Overhaul backend";
        const suffix = baseLabel ? ` at ${baseLabel}.` : '.';
        const detail = message ? (message.endsWith('.') ? message : `${message}.`) : '';
        const instruction = ' Check that the AI server is running and update the URL under Settings → Tools → AI Overhaul Settings.';
        return `${prefix}${suffix}${detail ? ` ${detail}` : ''}${instruction}`;
    }
    function reportOk(base) {
        const baseUrl = normalizeBase(base);
        update({ status: 'ok', backendBase: baseUrl, message: undefined, lastError: undefined, details: undefined });
    }
    function reportChecking(base) {
        const baseUrl = normalizeBase(base);
        update({ status: 'checking', backendBase: baseUrl });
    }
    function reportError(base, message, details) {
        const baseUrl = normalizeBase(base);
        const friendly = describeErrorMessage(message, baseUrl || undefined);
        const lastError = typeof details === 'string' ? details : (details && details.message) ? details.message : message;
        update({ status: 'error', backendBase: baseUrl, message: friendly, lastError, details });
    }
    function subscribe(fn) {
        listeners.add(fn);
        fn(current);
        return () => listeners.delete(fn);
    }
    function getReact() {
        var _a;
        return ((_a = w.PluginApi) === null || _a === void 0 ? void 0 : _a.React) || w.React;
    }
    function useBackendHealth() {
        const React = getReact();
        if (!React || !React.useState || !React.useEffect) {
            // React may not be ready yet; return the latest state directly
            return current;
        }
        const { useEffect, useState } = React;
        const [state, setState] = useState(current);
        useEffect(() => subscribe(setState), []);
        return state;
    }
    function buildNotice(state, options = {}) {
        const React = getReact();
        if (!React || !React.createElement)
            return null;
        const snapshot = state || current;
        if (!snapshot || snapshot.status !== 'error')
            return null;
        const retryHandler = options.onRetry;
        const message = options.messageOverride || snapshot.message || describeErrorMessage(snapshot.lastError, snapshot.backendBase);
        const containerStyle = options.dense ? {
            padding: '8px 12px',
            borderRadius: 6,
            marginBottom: 12,
            background: 'rgba(120,0,0,0.35)',
            border: '1px solid rgba(255,80,80,0.4)',
            color: '#ffd7d7',
            fontSize: '13px'
        } : {
            padding: '12px 16px',
            borderRadius: 8,
            margin: '12px 0',
            background: 'rgba(120,0,0,0.35)',
            border: '1px solid rgba(255,80,80,0.4)',
            color: '#ffd7d7',
            fontSize: '14px',
            lineHeight: 1.5,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.2) inset'
        };
        const children = [
            React.createElement('div', { key: 'title', style: { fontWeight: 600, marginBottom: 6 } }, "Can't reach AI Overhaul backend"),
            React.createElement('div', { key: 'body', style: { whiteSpace: 'pre-wrap' } }, message)
        ];
        if (retryHandler) {
            children.push(React.createElement('div', { key: 'actions', style: { marginTop: options.dense ? 8 : 12 } }, React.createElement('button', {
                type: 'button',
                onClick: retryHandler,
                style: {
                    background: '#c33',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 4,
                    padding: options.dense ? '4px 10px' : '6px 14px',
                    cursor: 'pointer',
                    fontSize: options.dense ? '12px' : '13px'
                }
            }, options.retryLabel || 'Retry now')));
        }
        return React.createElement('div', {
            key: options.key || 'ai-backend-offline',
            className: options.className || 'ai-backend-offline-alert',
            style: containerStyle
        }, children);
    }
    const api = {
        reportOk,
        reportChecking,
        reportError,
        useBackendHealth,
        buildNotice,
        getState: () => current,
        subscribe,
        EVENT_NAME
    };
    w.AIBackendHealth = api;
})();
})();

