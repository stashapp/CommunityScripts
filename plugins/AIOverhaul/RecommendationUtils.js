(function(){
// Shared utilities for recommendation components
// Extracted from RecommendedScenes.tsx for reuse in SimilarScenes.tsx
(function () {
    const w = window;
    // Safer initialization - wait for everything to be ready
    function initializeRecommendationUtils() {
        const PluginApi = w.PluginApi;
        if (!PluginApi || !PluginApi.React) {
            console.warn('[RecommendationUtils] PluginApi or React not available');
            return;
        }
        // Validate React hooks are available
        if (!PluginApi.React.useState || !PluginApi.React.useMemo || !PluginApi.React.useEffect || !PluginApi.React.useRef) {
            console.warn('[RecommendationUtils] React hooks not available');
            return;
        }
        const React = PluginApi.React;
        const { useState, useMemo, useEffect, useRef } = React;
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
                    if (entries && entries.length > 0) {
                        callback(entries[0]);
                    }
                });
                ro.observe(target.current);
                return () => ro.disconnect();
            }, [target, callback]);
        }
        function calculateCardWidth(containerWidth, preferredWidth) {
            const root = typeof window !== 'undefined' ? window.getComputedStyle(document.documentElement) : null;
            const containerPadding = root ? parseFloat(root.getPropertyValue('--ai-rec-container-padding')) : 30;
            const cardMargin = root ? parseFloat(root.getPropertyValue('--ai-rec-card-margin')) : 10;
            const maxUsableWidth = containerWidth - containerPadding;
            const maxElementsOnRow = Math.ceil(maxUsableWidth / preferredWidth);
            const width = maxUsableWidth / maxElementsOnRow - cardMargin;
            return width;
        }
        function useContainerDimensions(sensitivityThreshold = 20) {
            const target = useRef(null);
            const [dimension, setDimension] = useState({ width: 0, height: 0 });
            const debouncedSetDimension = useDebounce((entry) => {
                if (!entry.contentBoxSize || !entry.contentBoxSize.length)
                    return;
                const { inlineSize: width, blockSize: height } = entry.contentBoxSize[0];
                let difference = Math.abs(dimension.width - width);
                if (difference > sensitivityThreshold) {
                    setDimension({ width, height });
                }
            }, 50);
            useResizeObserver(target, debouncedSetDimension);
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
                const isMobile = window.innerWidth <= 768;
                if (isMobile)
                    return undefined;
                const effectiveWidth = (containerWidth ? containerWidth : 1200);
                if (zoomIndex === undefined || zoomIndex < 0 || zoomIndex >= zoomWidths.length) {
                    return undefined;
                }
                const preferredCardWidth = zoomWidths[zoomIndex];
                return calculateCardWidth(effectiveWidth, preferredCardWidth);
            }, [containerWidth, zoomIndex, zoomWidths]);
        }
        // Constraint Editor Component
        function ConstraintEditor({ tagId, constraint, tagName, value, fieldName, onSave, onCancel, allowedConstraintTypes, entity: popupEntity, compositeRawRef, popupPosition }) {
            const [localConstraint, setLocalConstraint] = React.useState(constraint);
            const localConstraintRef = React.useRef(localConstraint);
            React.useEffect(() => { localConstraintRef.current = localConstraint; }, [localConstraint]);
            const canceledRef = React.useRef(false);
            function lookupLocalName(id, forEntity) {
                try {
                    const ent = forEntity || popupEntity || 'tag';
                    const key = fieldName + '__' + (ent === 'performer' ? 'performerNameMap' : 'tagNameMap');
                    const map = compositeRawRef && compositeRawRef.current ? (compositeRawRef.current[key] || {}) : {};
                    return map[id] || (ent === 'performer' ? `Performer ${id}` : `Tag ${id}`);
                }
                catch (_) {
                    return forEntity === 'performer' ? `Performer ${id}` : `Tag ${id}`;
                }
            }
            React.useEffect(() => { setLocalConstraint(constraint); }, [constraint]);
            const allConstraintTypes = [
                { value: 'presence', label: 'Include/Exclude' },
                { value: 'duration', label: 'Duration Filter' },
                { value: 'overlap', label: 'Co-occurrence' },
                { value: 'importance', label: 'Importance Weight' }
            ];
            const constraintTypes = Array.isArray(allowedConstraintTypes) && allowedConstraintTypes.length > 0
                ? allConstraintTypes.filter(ct => allowedConstraintTypes.includes(ct.value))
                : allConstraintTypes;
            const overlapTagData = React.useMemo(() => {
                if (localConstraint.type !== 'overlap')
                    return { availableTags: [] };
                const allCoPrimaries = new Set();
                [...((value === null || value === void 0 ? void 0 : value.include) || []), ...((value === null || value === void 0 ? void 0 : value.exclude) || [])].forEach(id => {
                    var _a, _b;
                    const c = ((value === null || value === void 0 ? void 0 : value.constraints) || {})[id] || { type: 'presence' };
                    if (c.type === 'overlap' && ((_b = (_a = c.overlap) === null || _a === void 0 ? void 0 : _a.coTags) === null || _b === void 0 ? void 0 : _b.length) > 0 && id !== tagId) {
                        allCoPrimaries.add(id);
                    }
                });
                const availableTags = [...((value === null || value === void 0 ? void 0 : value.include) || []), ...((value === null || value === void 0 ? void 0 : value.exclude) || [])]
                    .filter(id => id !== tagId && !allCoPrimaries.has(id));
                return { availableTags };
            }, [localConstraint.type, value === null || value === void 0 ? void 0 : value.include, value === null || value === void 0 ? void 0 : value.exclude, value === null || value === void 0 ? void 0 : value.constraints, tagId]);
            function handleTypeChange(newType) {
                let nc = { type: newType };
                switch (newType) {
                    case 'presence':
                        nc.presence = 'include';
                        break;
                    case 'duration':
                        nc.duration = { min: 10, max: 60, unit: 'percent' };
                        break;
                    case 'overlap':
                        nc.overlap = { minDuration: 5, maxDuration: 30, unit: 'percent' };
                        break;
                    case 'importance':
                        nc.importance = 0.5;
                        break;
                }
                setLocalConstraint(nc);
            }
            function renderOptions() {
                var _a, _b, _c, _d, _e, _f, _g;
                switch (localConstraint.type) {
                    case 'presence':
                        return React.createElement('div', { className: 'constraint-options' }, [
                            React.createElement('label', { key: 'lbl' }, 'Mode: '),
                            React.createElement('select', { key: 'sel', value: localConstraint.presence || 'include', onChange: (e) => setLocalConstraint((p) => ({ ...p, presence: e.target.value })) }, [
                                React.createElement('option', { key: 'inc', value: 'include' }, 'Include'),
                                React.createElement('option', { key: 'exc', value: 'exclude' }, 'Exclude')
                            ])
                        ]);
                    case 'duration':
                        return React.createElement('div', { className: 'constraint-options' }, [
                            React.createElement('div', { key: 'range' }, [
                                React.createElement('label', { key: 'lbl' }, 'Duration: '),
                                React.createElement('input', { key: 'min', type: 'number', placeholder: 'Min', value: ((_a = localConstraint.duration) === null || _a === void 0 ? void 0 : _a.min) || '', onChange: (e) => setLocalConstraint((p) => ({ ...p, duration: { ...p.duration, min: e.target.value ? Number(e.target.value) : undefined } })) }),
                                React.createElement('span', { key: 'dash' }, ' - '),
                                React.createElement('input', { key: 'max', type: 'number', placeholder: 'Max', value: ((_b = localConstraint.duration) === null || _b === void 0 ? void 0 : _b.max) || '', onChange: (e) => setLocalConstraint((p) => ({ ...p, duration: { ...p.duration, max: e.target.value ? Number(e.target.value) : undefined } })) })
                            ]),
                            React.createElement('div', { key: 'unit' }, [
                                React.createElement('label', { key: 'lbl' }, 'Unit: '),
                                React.createElement('select', { key: 'sel', value: ((_c = localConstraint.duration) === null || _c === void 0 ? void 0 : _c.unit) || 'percent', onChange: (e) => setLocalConstraint((p) => ({ ...p, duration: { ...p.duration, unit: e.target.value } })) }, [
                                    React.createElement('option', { key: 'pct', value: 'percent' }, '% of video'),
                                    React.createElement('option', { key: 'sec', value: 'seconds' }, 'Seconds')
                                ])
                            ])
                        ]);
                    case 'overlap': {
                        const available = overlapTagData.availableTags;
                        const selected = ((_d = localConstraint.overlap) === null || _d === void 0 ? void 0 : _d.coTags) || [];
                        const entity = popupEntity || localConstraint._entity || 'tag';
                        return React.createElement('div', { className: 'constraint-options' }, [
                            React.createElement('div', { key: 'info' }, `Co-occurrence with other selected ${entity === 'performer' ? 'performers' : 'tags'}`),
                            React.createElement('div', { key: 'selwrap' }, [
                                React.createElement('label', { key: 'lbl' }, 'Selected for co-occurrence: '),
                                React.createElement('div', { key: 'selected', className: 'constraint-selected-tags' }, selected.length ? selected.map((cid) => {
                                    const nm = lookupLocalName(cid, entity);
                                    return React.createElement('span', { key: cid, className: 'constraint-cochip-tag' }, [
                                        nm,
                                        React.createElement('button', { key: 'rm', onClick: () => { const n = selected.filter((i) => i !== cid); setLocalConstraint((p) => ({ ...p, overlap: { ...p.overlap, coTags: n } })); }, className: 'constraint-cochip-remove' }, '×')
                                    ]);
                                }) : React.createElement('span', { className: 'constraint-selected-empty' }, 'No tags selected for co-occurrence')),
                                available.length ? React.createElement('div', { key: 'avail', className: 'constraint-available-tags' }, available.map((cid) => { if (selected.includes(cid))
                                    return null; const nm = lookupLocalName(cid, entity); return React.createElement('button', { key: cid, className: 'constraint-tag-button', onClick: () => { const n = [...selected, cid]; setLocalConstraint((p) => ({ ...p, overlap: { ...p.overlap, coTags: n } })); } }, nm); })) : null
                            ]),
                            React.createElement('div', { key: 'range' }, [
                                React.createElement('label', { key: 'lbl' }, 'Overlap duration: '),
                                React.createElement('input', { key: 'min', type: 'number', placeholder: 'Min', value: ((_e = localConstraint.overlap) === null || _e === void 0 ? void 0 : _e.minDuration) || '', onChange: (e) => setLocalConstraint((p) => ({ ...p, overlap: { ...p.overlap, minDuration: e.target.value ? Number(e.target.value) : undefined } })) }),
                                React.createElement('span', { key: 'dash' }, ' - '),
                                React.createElement('input', { key: 'max', type: 'number', placeholder: 'Max', value: ((_f = localConstraint.overlap) === null || _f === void 0 ? void 0 : _f.maxDuration) || '', onChange: (e) => setLocalConstraint((p) => ({ ...p, overlap: { ...p.overlap, maxDuration: e.target.value ? Number(e.target.value) : undefined } })) })
                            ]),
                            React.createElement('div', { key: 'unit' }, [
                                React.createElement('label', { key: 'lbl' }, 'Unit: '),
                                React.createElement('select', { key: 'sel', value: ((_g = localConstraint.overlap) === null || _g === void 0 ? void 0 : _g.unit) || 'percent', onChange: (e) => setLocalConstraint((p) => ({ ...p, overlap: { ...p.overlap, unit: e.target.value } })) }, [
                                    React.createElement('option', { key: 'pct', value: 'percent' }, '% of video'),
                                    React.createElement('option', { key: 'sec', value: 'seconds' }, 'Seconds')
                                ])
                            ])
                        ]);
                    }
                    case 'importance':
                        return React.createElement('div', { className: 'constraint-options' }, [
                            React.createElement('label', { key: 'lbl' }, 'Weight (0.0 - 1.0): '),
                            React.createElement('input', { key: 'in', type: 'number', step: '0.1', min: '0', max: '1', value: localConstraint.importance || 0.5, onChange: (e) => setLocalConstraint((p) => ({ ...p, importance: Number(e.target.value) })) })
                        ]);
                    default: return null;
                }
            }
            React.useEffect(() => { return () => { try {
                if (!canceledRef.current)
                    onSave(localConstraintRef.current);
            }
            catch (_) { } }; }, [onSave]);
            React.useEffect(() => { function onKey(e) { if (e.key === 'Escape') {
                canceledRef.current = true;
                onCancel();
            } } document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey); }, [onCancel]);
            return React.createElement('div', { className: 'constraint-popup-overlay' }, [
                React.createElement('div', { key: 'popup', className: 'constraint-popup', style: popupPosition ? { position: 'absolute', left: popupPosition.x, top: popupPosition.y, zIndex: 9999 } : {} }, [
                    React.createElement('div', { key: 'title', className: 'constraint-title' }, `Configure: ${tagName || lookupLocalName(tagId)}`),
                    React.createElement('div', { key: 'type', className: 'constraint-type' }, [
                        React.createElement('label', { key: 'lbl' }, 'Type: '),
                        React.createElement('select', { key: 'sel', value: localConstraint.type, onChange: (e) => handleTypeChange(e.target.value) }, constraintTypes.map(ct => React.createElement('option', { key: ct.value, value: ct.value }, ct.label)))
                    ]),
                    renderOptions(),
                    React.createElement('div', { key: 'actions', className: 'constraint-actions' }, [
                        React.createElement('button', { key: 'save', className: 'btn-constraint btn-save', onClick: (e) => { e.stopPropagation(); onSave(localConstraint); } }, 'Save')
                    ])
                ])
            ]);
        }
        // Tag Selector Component
        function createTagSelector(options) {
            const { value: v, onChange, entity = 'tag', fieldName, label = entity === 'performer' ? 'Performers' : 'Tags', allowedConstraintTypes, allowedCombinationModes, initialTagCombination, compositeRawRef } = options;
            const include = Array.isArray(v) ? v : Array.isArray(v === null || v === void 0 ? void 0 : v.include) ? v.include : [];
            const exclude = Array.isArray(v) ? [] : Array.isArray(v === null || v === void 0 ? void 0 : v.exclude) ? v.exclude : [];
            const constraints = (v === null || v === void 0 ? void 0 : v.constraints) || {};
            // Combination mode logic
            const normalizeMode = (m) => (m == null ? undefined : String(m).toLowerCase());
            const allowedNorm = Array.isArray(allowedCombinationModes) && allowedCombinationModes.length > 0
                ? allowedCombinationModes.map(normalizeMode).filter(Boolean)
                : [];
            const initLC = typeof initialTagCombination === 'string' ? normalizeMode(initialTagCombination) : undefined;
            const resolvedAllowedModes = (allowedNorm.length > 0 ? allowedNorm : (typeof initLC !== 'undefined' ? [initLC] : ['and', 'or']));
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
            const [constraintPopup, setConstraintPopup] = React.useState(null);
            const nameMapKey = fieldName + '__' + (entity === 'performer' ? 'performerNameMap' : 'tagNameMap');
            if (!compositeRawRef.current[nameMapKey]) {
                compositeRawRef.current[nameMapKey] = {};
            }
            const tagNameMap = compositeRawRef.current[nameMapKey];
            function lookupName(id, forEntity) {
                const ent = forEntity || entity || 'tag';
                const key = fieldName + '__' + (ent === 'performer' ? 'performerNameMap' : 'tagNameMap');
                const map = compositeRawRef.current[key] || {};
                return map[id] || (ent === 'performer' ? `Performer ${id}` : `Tag ${id}`);
            }
            const debounceTimerRef = React.useRef(null);
            const tagInputRef = React.useRef(null);
            // Return the complete tag selector component
            return {
                lookupName,
                searchState,
                setSearchState,
                constraintPopup,
                setConstraintPopup,
                tagInputRef,
                instanceIdRef,
                resolvedAllowedModes,
                include,
                exclude,
                constraints
            };
        }
        // Advanced Tag Include/Exclude Selector with constraints (extracted from RecommendedScenes)
        function TagIncludeExclude({ value, onChange, fieldName, initialTagCombination, allowedConstraintTypes, allowedCombinationModes, entity = 'tag', compositeRawRef: extCompositeRef }) {
            const React = PluginApi.React;
            const compositeRef = extCompositeRef || React.useRef({});
            const v = value || {};
            const include = Array.isArray(v) ? v : Array.isArray(v.include) ? v.include : [];
            const exclude = Array.isArray(v) ? [] : Array.isArray(v.exclude) ? v.exclude : [];
            const constraints = v.constraints || {};
            const normalizeMode = (m) => (m == null ? undefined : String(m).toLowerCase());
            const allowedNorm = Array.isArray(allowedCombinationModes) && allowedCombinationModes.length > 0
                ? allowedCombinationModes.map(normalizeMode).filter(Boolean)
                : [];
            const initLC = typeof initialTagCombination === 'string' ? normalizeMode(initialTagCombination) : undefined;
            const resolvedAllowedModes = (allowedNorm.length > 0 ? allowedNorm : (typeof initLC !== 'undefined' ? [initLC] : ['and', 'or']));
            const rawValueMode = (v && Object.prototype.hasOwnProperty.call(v, 'tag_combination')) ? v.tag_combination : undefined;
            const valueMode = normalizeMode(rawValueMode);
            const isValidMode = (m) => m === 'and' || m === 'or' || m === 'not-applicable';
            const initialMode = (isValidMode(valueMode) ? valueMode : (isValidMode(initLC) ? initLC : resolvedAllowedModes[0]));
            const [searchState, setSearchState] = React.useState({ search: '', suggestions: [], loading: false, error: null, showDropdown: false, combinationMode: initialMode });
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
            React.useEffect(() => { function onOtherOpen(ev) { try {
                const otherId = ev && ev.detail && ev.detail.id;
                if (otherId && otherId !== instanceIdRef.current) {
                    setSearchState((prev) => ({ ...prev, showDropdown: false }));
                }
            }
            catch (_) { } } document.addEventListener('ai-tag-fallback-open', onOtherOpen); return () => document.removeEventListener('ai-tag-fallback-open', onOtherOpen); }, []);
            React.useEffect(() => { const externalModeRaw = v && Object.prototype.hasOwnProperty.call(v, 'tag_combination') ? v.tag_combination : undefined; const externalMode = normalizeMode(externalModeRaw); if (externalMode && externalMode !== searchState.combinationMode && (externalMode === 'and' || externalMode === 'or' || externalMode === 'not-applicable')) {
                setSearchState((prev) => ({ ...prev, combinationMode: externalMode }));
            } }, [v && v.tag_combination]);
            const [constraintPopup, setConstraintPopup] = React.useState(null);
            const nameMapKey = fieldName + '__' + (entity === 'performer' ? 'performerNameMap' : 'tagNameMap');
            if (!compositeRef.current[nameMapKey]) {
                compositeRef.current[nameMapKey] = {};
            }
            const tagNameMap = compositeRef.current[nameMapKey];
            function lookupName(id, forEntity) { const ent = forEntity || entity || 'tag'; const key = fieldName + '__' + (ent === 'performer' ? 'performerNameMap' : 'tagNameMap'); const map = compositeRef.current[key] || {}; return map[id] || (ent === 'performer' ? `Performer ${id}` : `Tag ${id}`); }
            const debounceTimerRef = React.useRef(null);
            function removeTag(id, list) { const nextInclude = list === 'include' ? include.filter(i => i !== id) : include; const nextExclude = list === 'exclude' ? exclude.filter(i => i !== id) : exclude; const nextConstraints = { ...constraints }; delete nextConstraints[id]; onChange({ include: nextInclude, exclude: nextExclude, constraints: nextConstraints, tag_combination: searchState.combinationMode }); }
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
                // Ensure primary tag is present in include list for non-presence constraints
                if (!nextInclude.includes(tagId) && !nextExclude.includes(tagId)) {
                    nextInclude.push(tagId);
                }
                onChange({ include: nextInclude, exclude: nextExclude, constraints: nextConstraints, tag_combination: searchState.combinationMode });
            }
            function getTagConstraint(tagId) { return constraints[tagId] || { type: 'presence', presence: include.includes(tagId) ? 'include' : 'exclude' }; }
            function showConstraintPopup(tagId, event, popupEntity) { const rect = event.target.getBoundingClientRect(); setConstraintPopup({ tagId, entity: popupEntity || entity, position: { x: rect.left, y: rect.bottom + 5 } }); event.stopPropagation(); }
            const tagInputRef = React.useRef(null);
            function addTag(id, name) { if (!include.includes(id) && !exclude.includes(id)) {
                onChange({ include: [...include, id], exclude, constraints, tag_combination: searchState.combinationMode });
            } if (name)
                tagNameMap[id] = name; if (debounceTimerRef.current)
                clearTimeout(debounceTimerRef.current); setSearchState((prev) => ({ ...prev, search: '', suggestions: [], showDropdown: false })); }
            function search(term) { if (debounceTimerRef.current)
                clearTimeout(debounceTimerRef.current); setSearchState((prev) => ({ ...prev, search: term })); const q = term.trim(); const immediate = q === ''; const run = async () => { var _a, _b, _c, _d; setSearchState((prev) => ({ ...prev, loading: true, error: null })); try {
                let gql;
                if (entity === 'performer') {
                    gql = q ? `query PerformerSuggest($term: String!) { findPerformers(filter: { per_page: 20 }, performer_filter: { name: { value: $term, modifier: INCLUDES } }) { performers { id name } } }` : `query PerformerSuggest { findPerformers(filter: { per_page: 20 }) { performers { id name } } }`;
                }
                else {
                    gql = q ? `query TagSuggest($term: String!) { findTags(filter: { per_page: 20 }, tag_filter: { name: { value: $term, modifier: INCLUDES } }) { tags { id name } } }` : `query TagSuggest { findTags(filter: { per_page: 20 }) { tags { id name } } }`;
                }
                const variables = q ? { term: q } : {};
                const res = await fetch('/graphql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: gql, variables }) });
                if (!res.ok)
                    throw new Error('HTTP ' + res.status);
                const json = await res.json();
                if (json.errors)
                    throw new Error(json.errors.map((e) => e.message).join('; '));
                const suggestions = entity === 'performer' ? (((_b = (_a = json === null || json === void 0 ? void 0 : json.data) === null || _a === void 0 ? void 0 : _a.findPerformers) === null || _b === void 0 ? void 0 : _b.performers) || []) : (((_d = (_c = json === null || json === void 0 ? void 0 : json.data) === null || _c === void 0 ? void 0 : _c.findTags) === null || _d === void 0 ? void 0 : _d.tags) || []);
                try {
                    suggestions.forEach((s) => { const sid = parseInt(s.id, 10); if (!isNaN(sid))
                        tagNameMap[sid] = s.name; });
                }
                catch (e) { }
                setSearchState((prev) => ({ ...prev, suggestions, loading: false, error: suggestions.length ? null : null }));
            }
            catch (e) {
                setSearchState((prev) => ({ ...prev, error: 'Search failed', loading: false }));
            } }; if (immediate)
                run();
            else {
                debounceTimerRef.current = setTimeout(run, 200);
            } }
            function onInputFocus() { if (!searchState.showDropdown) {
                try {
                    document.dispatchEvent(new CustomEvent('ai-tag-fallback-open', { detail: { id: instanceIdRef.current } }));
                }
                catch (e) { }
                setSearchState((prev) => ({ ...prev, showDropdown: true }));
                if (!searchState.suggestions.length && !searchState.loading) {
                    search('');
                }
            } }
            React.useEffect(() => { function handleClickOutside(event) { const target = event.target; if (!target.closest('.ai-tag-fallback.unified')) {
                setSearchState((prev) => ({ ...prev, showDropdown: false }));
            } if (!target.closest('.constraint-popup') && !target.closest('.constraint-btn')) {
                setConstraintPopup(null);
            } } if (searchState.showDropdown || constraintPopup) {
                document.addEventListener('click', handleClickOutside);
                return () => document.removeEventListener('click', handleClickOutside);
            } }, [searchState.showDropdown, constraintPopup]);
            function onKeyDown(e) { if (e.key === 'Enter') {
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
            } }
            const showCombinationToggle = resolvedAllowedModes.length > 0 && resolvedAllowedModes.every(m => m !== 'not-applicable');
            const toggleClickable = resolvedAllowedModes.length > 1;
            const combinationToggle = showCombinationToggle ? React.createElement('button', { key: 'combo-toggle', type: 'button', className: `combination-toggle ${searchState.combinationMode}${toggleClickable ? '' : ' disabled'}`, disabled: !toggleClickable, onClick: toggleClickable ? (e) => { e.stopPropagation(); const currentIdx = resolvedAllowedModes.indexOf(searchState.combinationMode); const nextIdx = (currentIdx + 1) % resolvedAllowedModes.length; const nextMode = resolvedAllowedModes[nextIdx]; setSearchState((prev) => ({ ...prev, combinationMode: nextMode })); onChange({ include, exclude, constraints, tag_combination: nextMode }); } : undefined, title: toggleClickable ? `Toggle combination mode (current: ${searchState.combinationMode})` : `Combination mode: ${searchState.combinationMode} (fixed)` }, (searchState.combinationMode ? String(searchState.combinationMode).toUpperCase() : '')) : null;
            // Enhanced chip rendering with co-occurrence grouping + constraint indicators
            const chips = [];
            const processedOverlapGroups = new Set();
            function createCoOccurrenceChip(primaryId, group, setType, chipEntity = 'tag') {
                const primaryName = lookupName(primaryId, chipEntity);
                const coTags = group.coTags || [];
                const allTagIds = [primaryId, ...coTags];
                const allTagNames = allTagIds.map((id) => lookupName(id, chipEntity));
                const min = group.minDuration || 0;
                const max = group.maxDuration || '∞';
                const unit = group.unit === 'percent' ? '%' : 's';
                const chipClass = `tag-chip overlap ${setType}`;
                const groupKey = allTagIds.slice().sort().join('-');
                return React.createElement('span', { key: `co-${setType}-${groupKey}`, className: `${chipClass} co-chip` }, [
                    React.createElement('span', { key: 'constraint-prefix', className: 'co-constraint-info' }, `[${min}-${max}${unit}]`),
                    React.createElement('span', { key: 'tags', className: 'co-tags' }, allTagNames.map((name, idx) => React.createElement('span', { key: allTagIds[idx], className: 'co-tag-item' }, [
                        React.createElement('span', { key: 'n', className: 'co-tag-name', title: name }, name),
                        React.createElement('button', { key: 'x', onClick: (e) => { e.stopPropagation(); const tagIdToRemove = allTagIds[idx]; if (tagIdToRemove === primaryId) {
                                removeTag(primaryId, setType);
                            }
                            else {
                                const updatedCoTags = coTags.filter((id) => id !== tagIdToRemove);
                                updateTagConstraint(primaryId, { type: 'overlap', overlap: { ...group, coTags: updatedCoTags } });
                            } }, className: 'co-tag-remove', title: `Remove ${name} from group` }, '×')
                    ]))),
                    React.createElement('span', { key: 'actions', className: 'co-actions' }, [
                        React.createElement('button', { key: 'gear', className: 'constraint-btn', onClick: (e) => showConstraintPopup(primaryId, e, entity), title: 'Configure group constraint' }, '⚙'),
                        React.createElement('button', { key: 'remove-group', onClick: (e) => { e.stopPropagation(); removeTag(primaryId, setType); }, className: 'co-chip-remove', title: 'Remove entire group' }, '×')
                    ])
                ]);
            }
            // Include chips
            include.forEach(id => {
                const constraint = getTagConstraint(id);
                if (constraint.type === 'overlap' && constraint.overlap) {
                    const coTags = constraint.overlap.coTags || [];
                    const groupKey = [id, ...coTags].slice().sort().join('-');
                    if (processedOverlapGroups.has(groupKey))
                        return; // already rendered
                    processedOverlapGroups.add(groupKey);
                    chips.push(createCoOccurrenceChip(id, constraint.overlap, 'include', entity));
                    return;
                }
                const tagName = lookupName(id, entity);
                const chipClass = `tag-chip ${constraint.type === 'presence' ? 'include' : constraint.type}`;
                let constraintText = '';
                if (constraint.type === 'duration' && constraint.duration) {
                    const min = constraint.duration.min || 0;
                    const max = constraint.duration.max || '∞';
                    const unit = constraint.duration.unit === 'percent' ? '%' : 's';
                    constraintText = ` [${min}-${max}${unit}]`;
                }
                else if (constraint.type === 'importance' && constraint.importance !== undefined) {
                    try {
                        constraintText = ` [×${Number(constraint.importance).toFixed(1)}]`;
                    }
                    catch (_) {
                        constraintText = ` [×${constraint.importance}]`;
                    }
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
            // Exclude chips
            exclude.forEach(id => {
                const constraint = getTagConstraint(id);
                if (constraint.type === 'overlap' && constraint.overlap) {
                    const coTags = constraint.overlap.coTags || [];
                    const groupKey = [id, ...coTags].slice().sort().join('-');
                    if (processedOverlapGroups.has(groupKey))
                        return;
                    processedOverlapGroups.add(groupKey);
                    chips.push(createCoOccurrenceChip(id, constraint.overlap, 'exclude', entity));
                    return;
                }
                const tagName = lookupName(id, entity);
                const chipClass = `tag-chip ${constraint.type === 'presence' ? 'exclude' : constraint.type}`;
                let constraintText = '';
                if (constraint.type === 'duration' && constraint.duration) {
                    const min = constraint.duration.min || 0;
                    const max = constraint.duration.max || '∞';
                    const unit = constraint.duration.unit === 'percent' ? '%' : 's';
                    constraintText = ` [${min}-${max}${unit}]`;
                }
                else if (constraint.type === 'importance' && constraint.importance !== undefined) {
                    try {
                        constraintText = ` [×${Number(constraint.importance).toFixed(1)}]`;
                    }
                    catch (_) {
                        constraintText = ` [×${constraint.importance}]`;
                    }
                }
                chips.push(React.createElement('span', { key: 'e' + id, className: `${chipClass} tag-chip-flex` }, [
                    React.createElement('span', { key: 'text', className: 'tag-chip-text' }, tagName),
                    constraintText ? React.createElement('span', { key: 'constraint', className: 'tag-chip-constraint' }, constraintText) : null,
                    React.createElement('div', { key: 'actions', className: 'tag-chip-actions' }, [
                        React.createElement('button', { key: 'gear', className: 'constraint-btn', onClick: (e) => showConstraintPopup(id, e, entity), title: 'Configure constraint' }, '⚙'),
                        React.createElement('button', { key: 'x', onClick: (e) => { e.stopPropagation(); removeTag(id, 'exclude'); }, title: 'Remove', className: 'tag-chip-remove' }, '×')
                    ])
                ].filter(Boolean)));
            });
            const suggestionsList = (searchState.showDropdown || searchState.search) && (searchState.suggestions.length || searchState.loading || searchState.error) ? React.createElement('div', { className: 'suggestions-list', key: 'list' }, searchState.loading ? React.createElement('div', { className: 'empty-suggest' }, 'Searching…') : searchState.error ? React.createElement('div', { className: 'empty-suggest' }, searchState.error) : searchState.suggestions.length ? searchState.suggestions.map((tg) => React.createElement('div', { key: tg.id, onClick: (e) => { e.stopPropagation(); addTag(parseInt(tg.id, 10), tg.name); } }, tg.name + ' (#' + tg.id + ')')) : React.createElement('div', { className: 'empty-suggest' }, 'No matches')) : null;
            const constraintPopupEl = constraintPopup ? React.createElement('div', { className: 'constraint-popup', style: { left: constraintPopup.position.x + 'px', top: constraintPopup.position.y + 'px' }, onClick: (e) => e.stopPropagation() }, [React.createElement(ConstraintEditor, { key: 'editor', tagId: constraintPopup.tagId, constraint: constraintPopup.initialConstraint || getTagConstraint(constraintPopup.tagId), tagName: lookupName(constraintPopup.tagId, constraintPopup && constraintPopup.entity), value: v, fieldName: fieldName, entity: constraintPopup.entity, allowedConstraintTypes, compositeRawRef: compositeRef, onSave: (constraint) => { updateTagConstraint(constraintPopup.tagId, constraint); setConstraintPopup(null); }, onCancel: () => setConstraintPopup(null), onClose: () => setConstraintPopup(null) })]) : null;
            return React.createElement('div', { className: 'ai-tag-fallback unified w-100', onClick: () => { if (tagInputRef.current)
                    tagInputRef.current.focus(); } }, [combinationToggle, chips.length ? chips : React.createElement('span', { key: 'ph', className: 'text-muted small' }, 'No tags'), React.createElement('input', { key: 'inp', type: 'text', className: 'tag-input', value: searchState.search, placeholder: 'Search tags…', onChange: (e) => search(e.target.value), onKeyDown, onFocus: onInputFocus, onClick: (e) => e.stopPropagation(), ref: tagInputRef }), suggestionsList, constraintPopupEl]);
        }
        // Build standardized config control rows (shared between RecommendedScenes & SimilarScenes)
        function buildConfigRows(params) {
            const { React, defs, configValues, updateConfigField, TagIncludeExclude, compositeRawRef, narrowTagWidth } = params;
            return defs.map(field => {
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
                    case 'boolean':
                        control = React.createElement('div', { className: 'custom-control custom-switch' }, [
                            React.createElement('input', { key: 'chk', id, type: 'checkbox', className: 'custom-control-input', checked: !!val, onChange: (e) => updateConfigField(field.name, e.target.checked) }),
                            React.createElement('label', { key: 'lb', htmlFor: id, className: 'custom-control-label' }, '')
                        ]);
                        break;
                    case 'text':
                        control = React.createElement('input', { id, type: 'text', className: 'text-input form-control form-control-sm w-text w-180', value: val !== null && val !== void 0 ? val : '', placeholder: field.help || '', onChange: (e) => updateConfigField(field.name, e.target.value, { debounce: true, field }) });
                        break;
                    case 'search':
                        control = React.createElement('div', { className: 'clearable-input-group search-term-input w-180' }, [
                            React.createElement('input', { key: 'in', id, type: 'text', className: 'clearable-text-field form-control form-control-sm w-180', value: val !== null && val !== void 0 ? val : '', placeholder: field.help || 'Search…', onChange: (e) => updateConfigField(field.name, e.target.value, { debounce: true, field }) })
                        ]);
                        break;
                    case 'tags': {
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
                        control = React.createElement('div', { className: 'w-tags' }, TagIncludeExclude ? React.createElement(TagIncludeExclude, { compositeRawRef, fieldName: field.name, value: { include: includeIds, exclude: excludeIds, constraints, tag_combination: val === null || val === void 0 ? void 0 : val.tag_combination }, onChange: (next) => updateConfigField(field.name, next), initialTagCombination: field.tag_combination, allowedConstraintTypes: field.constraint_types, allowedCombinationModes: field.allowed_combination_modes }) : React.createElement('div', { className: 'text-muted small' }, 'Tag selector unavailable'));
                        break;
                    }
                    case 'performers': {
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
                        control = React.createElement('div', { className: 'w-tags' }, TagIncludeExclude ? React.createElement(TagIncludeExclude, { compositeRawRef, fieldName: field.name, value: { include: includeIds, exclude: excludeIds, constraints, tag_combination: val === null || val === void 0 ? void 0 : val.tag_combination }, onChange: (next) => updateConfigField(field.name, next), initialTagCombination: field.tag_combination, allowedConstraintTypes: field.constraint_types, allowedCombinationModes: field.allowed_combination_modes, entity: 'performer' }) : React.createElement('div', { className: 'text-muted small' }, 'Performer selector unavailable'));
                        break;
                    }
                    default:
                        control = React.createElement('div', { className: 'text-muted small' }, 'Unsupported: ' + field.type);
                }
                const showLabelAbove = true;
                const capWidth = (field.type === 'tags' || field.type === 'performers') ? (narrowTagWidth !== null && narrowTagWidth !== void 0 ? narrowTagWidth : 400) : (field.type === 'slider' ? 92 : (['text', 'search', 'select', 'enum'].includes(field.type) ? 180 : undefined));
                const labelStyle = capWidth ? { display: 'inline-block', width: capWidth + 'px', maxWidth: capWidth + 'px' } : undefined;
                const labelProps = { htmlFor: id, className: 'form-label d-flex justify-content-between mb-0', style: labelStyle };
                if (field.help)
                    labelProps.title = field.help;
                const labelNode = showLabelAbove ? React.createElement('label', labelProps, [React.createElement('span', { key: 't', className: 'label-text' }, field.label || field.name)]) : null;
                const compactTypes = ['number', 'select', 'enum', 'boolean', 'slider', 'text', 'search', 'tags', 'performers'];
                const colClass = compactTypes.includes(field.type) ? 'col-auto mb-1' : 'col-lg-4 col-md-6 col-12 mb-1';
                return React.createElement('div', { key: field.name, className: colClass }, [
                    React.createElement('div', { className: 'form-group mb-0' }, [
                        labelNode,
                        React.createElement('div', { key: 'ctrlwrap', style: labelStyle, className: 'control-wrap' }, control)
                    ])
                ]);
            });
        }
        // Export utilities to global namespace
        w.AIRecommendationUtils = {
            useDebounce,
            useResizeObserver,
            calculateCardWidth,
            useContainerDimensions,
            useCardWidth,
            ConstraintEditor,
            createTagSelector,
            TagIncludeExclude,
            buildConfigRows
        };
    } // End initializeRecommendationUtils
    // Wait for dependencies and initialize
    function waitAndInitialize() {
        if (w.PluginApi && w.PluginApi.React) {
            console.log('[RecommendationUtils] Dependencies ready, initializing...');
            initializeRecommendationUtils();
        }
        else {
            console.log('[RecommendationUtils] Waiting for PluginApi and React...');
            setTimeout(waitAndInitialize, 100);
        }
    }
    waitAndInitialize();
})();
})();

