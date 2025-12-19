(function(){
// =============================================================================
// Unified Integration for AI Button + Task Dashboard
//  - Injects MinimalAIButton into MainNavBar.UtilityItems
//  - Registers /plugins/ai-tasks route mounting TaskDashboard
//  - Adds SettingsToolsSection entry linking to the dashboard
//  - Adds simple "AI" nav utility link (in case button not visible)
//  - All logging gated by window.AIDebug
// =============================================================================
(function () {
    var _a, _b, _c;
    const g = window;
    const PluginApi = g.PluginApi;
    if (!PluginApi) {
        console.warn('[AIIntegration] PluginApi not ready');
        return;
    }
    const React = PluginApi.React;
    const debug = !!g.AIDebug;
    const dlog = (...a) => { if (debug)
        console.log('[AIIntegration]', ...a); };
    // Helper to safely get components
    const Button = ((_b = (_a = PluginApi.libraries) === null || _a === void 0 ? void 0 : _a.Bootstrap) === null || _b === void 0 ? void 0 : _b.Button) || ((p) => React.createElement('button', p, p.children));
    const { Link, NavLink } = ((_c = PluginApi.libraries) === null || _c === void 0 ? void 0 : _c.ReactRouterDOM) || {};
    function getMinimalButton() { return g.MinimalAIButton || g.AIButton; }
    function getTaskDashboard() { return g.TaskDashboard || g.AITaskDashboard; }
    function getPluginSettings() { return g.AIPluginSettings; }
    // Main nav utility items: inject AI button + nav link
    try {
        PluginApi.patch.before('MainNavBar.UtilityItems', function (props) {
            const MinimalAIButton = getMinimalButton();
            const children = [props.children];
            if (MinimalAIButton) {
                children.push(React.createElement('div', { key: 'ai-btn-wrap', style: { marginRight: 8, display: 'flex', alignItems: 'center' } }, React.createElement(MinimalAIButton)));
            }
            return [{ children }];
        });
        dlog('Patched MainNavBar.UtilityItems');
    }
    catch (e) {
        if (debug)
            console.warn('[AIIntegration] main nav patch failed', e);
    }
    // Register dashboard route
    try {
        PluginApi.register.route('/plugins/ai-tasks', () => {
            const Dash = getTaskDashboard();
            return Dash ? React.createElement(Dash, {}) : React.createElement('div', { style: { padding: 16 } }, 'Loading AI Tasks...');
        });
        dlog('Registered /plugins/ai-tasks route');
    }
    catch (e) {
        if (debug)
            console.warn('[AIIntegration] route register failed', e);
    }
    // Register settings route (event-driven, no polling)
    try {
        const SettingsWrapper = () => {
            const [Comp, setComp] = React.useState(() => getPluginSettings());
            React.useEffect(() => {
                if (Comp)
                    return; // already there
                const handler = () => {
                    const found = getPluginSettings();
                    if (found) {
                        if (debug)
                            console.debug('[AIIntegration] AIPluginSettingsReady event captured');
                        setComp(() => found);
                    }
                };
                window.addEventListener('AIPluginSettingsReady', handler);
                // one immediate async attempt (in case script loaded right after)
                setTimeout(handler, 0);
                return () => window.removeEventListener('AIPluginSettingsReady', handler);
            }, [Comp]);
            const C = Comp;
            return C ? React.createElement(C, {}) : React.createElement('div', { style: { padding: 16 } }, 'Loading AI Overhaul Settings...');
        };
        PluginApi.register.route('/plugins/ai-settings', () => React.createElement(SettingsWrapper));
        dlog('Registered /plugins/ai-settings route (event)');
    }
    catch (e) {
        if (debug)
            console.warn('[AIIntegration] settings route register failed', e);
    }
    // Settings tools entry
    try {
        PluginApi.patch.before('SettingsToolsSection', function (props) {
            var _a;
            const Setting = (_a = PluginApi.components) === null || _a === void 0 ? void 0 : _a.Setting;
            if (!Setting)
                return props;
            return [{ children: (React.createElement(React.Fragment, null,
                        props.children,
                        React.createElement(Setting, { heading: Link ? React.createElement(Link, { to: "/plugins/ai-tasks" },
                                React.createElement(Button, null, "AI Tasks")) : React.createElement(Button, { onClick: () => (location.href = '/plugins/ai-tasks') }, 'AI Tasks') }),
                        React.createElement(Setting, { heading: Link ? React.createElement(Link, { to: "/plugins/ai-settings" },
                                React.createElement(Button, null, "AI Overhaul Settings")) : React.createElement(Button, { onClick: () => (location.href = '/plugins/ai-settings') }, 'AI Overhaul Settings') }))) }];
        });
        dlog('Patched SettingsToolsSection');
    }
    catch (e) {
        if (debug)
            console.warn('[AIIntegration] settings tools patch failed', e);
    }
    if (debug)
        console.log('[AIIntegration] Unified integration loaded');
})();
})();

