(function () {
    'use strict';

    const React$h = window.PluginApi.React;
    const { createContext, useContext, useReducer, useCallback: useCallback$7 } = React$h;
    const initialState = {
        scenario: null,
        scenarioId: null,
        selectedFaceId: null,
        matches: [],
        facesData: [],
        loading: {},
        showMatchModal: false,
        showFrameSelector: false,
        showSpriteModal: false,
        frameSelectorUrl: '',
        spriteResult: null,
        detectionMode: 'sprite',
        scanProgress: 0,
        scanProgressDesc: '',
        errorDialog: null,
        healthBanner: null,
        settingsOpen: false,
    };
    function visageReducer(state, action) {
        switch (action.type) {
            case 'SET_SCENARIO':
                return { ...state, scenario: action.scenario, scenarioId: action.id };
            case 'SET_MATCHES':
                return { ...state, matches: action.matches, showMatchModal: true };
            case 'SET_FACES_DATA':
                return { ...state, facesData: action.data, frameSelectorUrl: action.url, showFrameSelector: true };
            case 'SET_SELECTED_FACE':
                return { ...state, selectedFaceId: action.id };
            case 'SET_LOADING': {
                return { ...state, loading: { ...state.loading, [action.key]: action.value } };
            }
            case 'CLEAR_LOADING': {
                const newLoading = { ...state.loading };
                delete newLoading[action.key];
                return { ...state, loading: newLoading };
            }
            case 'SHOW_MATCH_MODAL':
                return { ...state, showMatchModal: action.show };
            case 'SHOW_FRAME_SELECTOR':
                return { ...state, showFrameSelector: action.show };
            case 'SHOW_SPRITE_MODAL':
                return { ...state, showSpriteModal: action.show };
            case 'CLEAR_MATCHES':
                return { ...state, matches: [], showMatchModal: false };
            case 'START_MATCH_SEARCH':
                return { ...state, matches: [], showMatchModal: true };
            case 'SET_SPRITE_RESULT':
                return { ...state, spriteResult: action.result, showSpriteModal: true };
            case 'CLEAR_SPRITE_RESULT':
                return { ...state, spriteResult: null, showSpriteModal: false, scanProgress: 0, scanProgressDesc: '' };
            case 'SET_DETECTION_MODE':
                return { ...state, detectionMode: action.mode };
            case 'SHOW_ERROR_DIALOG':
                return { ...state, errorDialog: { message: action.message, variant: action.variant } };
            case 'HIDE_ERROR_DIALOG':
                return { ...state, errorDialog: null };
            case 'SHOW_HEALTH_BANNER':
                return { ...state, healthBanner: action.message };
            case 'HIDE_HEALTH_BANNER':
                return { ...state, healthBanner: null };
            case 'SHOW_SETTINGS':
                return { ...state, settingsOpen: true };
            case 'HIDE_SETTINGS':
                return { ...state, settingsOpen: false };
            case 'SET_SCAN_PROGRESS':
                return { ...state, scanProgress: action.progress, scanProgressDesc: action.desc };
            case 'RESET':
                return { ...initialState, scanProgress: 0, scanProgressDesc: '' };
            default:
                return state;
        }
    }
    const VisageContext = createContext(null);
    function VisageProvider({ children, scenario, scenarioId }) {
        const [state, dispatch] = useReducer(visageReducer, {
            ...initialState,
            scenario: scenario || null,
            scenarioId: scenarioId || null,
        });
        const setScenario = useCallback$7((scenario, id) => {
            dispatch({ type: 'SET_SCENARIO', scenario, id });
        }, []);
        const setMatches = useCallback$7((matches) => {
            dispatch({ type: 'SET_MATCHES', matches });
        }, []);
        const setFacesData = useCallback$7((data, url) => {
            dispatch({ type: 'SET_FACES_DATA', data, url });
        }, []);
        const setSelectedFace = useCallback$7((id) => {
            dispatch({ type: 'SET_SELECTED_FACE', id });
        }, []);
        const setLoading = useCallback$7((key, value) => {
            dispatch({ type: 'SET_LOADING', key, value });
        }, []);
        const clearLoading = useCallback$7((key) => {
            dispatch({ type: 'CLEAR_LOADING', key });
        }, []);
        const showMatchModalFn = useCallback$7((show) => {
            dispatch({ type: 'SHOW_MATCH_MODAL', show });
        }, []);
        const showFrameSelectorFn = useCallback$7((show) => {
            dispatch({ type: 'SHOW_FRAME_SELECTOR', show });
        }, []);
        const showSpriteModalFn = useCallback$7((show) => {
            dispatch({ type: 'SHOW_SPRITE_MODAL', show });
        }, []);
        const clearMatches = useCallback$7(() => {
            dispatch({ type: 'CLEAR_MATCHES' });
        }, []);
        const startMatchSearch = useCallback$7(() => {
            dispatch({ type: 'START_MATCH_SEARCH' });
        }, []);
        const setSpriteResult = useCallback$7((result) => {
            dispatch({ type: 'SET_SPRITE_RESULT', result });
        }, []);
        const clearSpriteResult = useCallback$7(() => {
            dispatch({ type: 'CLEAR_SPRITE_RESULT' });
        }, []);
        const setDetectionMode = useCallback$7((mode) => {
            dispatch({ type: 'SET_DETECTION_MODE', mode });
        }, []);
        const setScanProgress = useCallback$7((progress, desc) => {
            dispatch({ type: 'SET_SCAN_PROGRESS', progress, desc });
        }, []);
        const reset = useCallback$7(() => {
            dispatch({ type: 'RESET' });
        }, []);
        const showError = useCallback$7((message) => {
            dispatch({ type: 'SHOW_ERROR_DIALOG', message, variant: 'error' });
        }, []);
        const showWarning = useCallback$7((message) => {
            dispatch({ type: 'SHOW_ERROR_DIALOG', message, variant: 'warning' });
        }, []);
        const showSuccess = useCallback$7((message) => {
            dispatch({ type: 'SHOW_ERROR_DIALOG', message, variant: 'success' });
        }, []);
        const hideErrorDialog = useCallback$7(() => {
            dispatch({ type: 'HIDE_ERROR_DIALOG' });
        }, []);
        const showHealthBanner = useCallback$7((message) => {
            dispatch({ type: 'SHOW_HEALTH_BANNER', message });
        }, []);
        const hideHealthBanner = useCallback$7(() => {
            dispatch({ type: 'HIDE_HEALTH_BANNER' });
        }, []);
        const openSettings = useCallback$7(() => {
            dispatch({ type: 'SHOW_SETTINGS' });
        }, []);
        const closeSettings = useCallback$7(() => {
            dispatch({ type: 'HIDE_SETTINGS' });
        }, []);
        const value = {
            state,
            dispatch,
            setScenario,
            setMatches,
            setFacesData,
            setSelectedFace,
            setLoading,
            clearLoading,
            showMatchModal: showMatchModalFn,
            showFrameSelector: showFrameSelectorFn,
            showSpriteModal: showSpriteModalFn,
            clearMatches,
            startMatchSearch,
            setSpriteResult,
            clearSpriteResult,
            setDetectionMode,
            setScanProgress,
            reset,
            showError,
            showWarning,
            showSuccess,
            hideErrorDialog,
            showHealthBanner,
            hideHealthBanner,
            openSettings,
            closeSettings,
        };
        return React$h.createElement(VisageContext.Provider, { value }, children);
    }
    function useVisage() {
        const context = useContext(VisageContext);
        if (!context) {
            throw new Error('useVisage must be used within a VisageProvider');
        }
        return context;
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /*!
     * html2canvas 1.4.1 <https://html2canvas.hertzen.com>
     * Copyright (c) 2022 Niklas von Hertzen <https://hertzen.com>
     * Released under MIT License
     */

    var html2canvas = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
        module.exports = factory() ;
    }(commonjsGlobal, (function () {
        /*! *****************************************************************************
        Copyright (c) Microsoft Corporation.

        Permission to use, copy, modify, and/or distribute this software for any
        purpose with or without fee is hereby granted.

        THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
        REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
        AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
        INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
        LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
        OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
        PERFORMANCE OF THIS SOFTWARE.
        ***************************************************************************** */
        /* global Reflect, Promise */

        var extendStatics = function(d, b) {
            extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
            return extendStatics(d, b);
        };

        function __extends(d, b) {
            if (typeof b !== "function" && b !== null)
                throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
            extendStatics(d, b);
            function __() { this.constructor = d; }
            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        }

        var __assign = function() {
            __assign = Object.assign || function __assign(t) {
                for (var s, i = 1, n = arguments.length; i < n; i++) {
                    s = arguments[i];
                    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                }
                return t;
            };
            return __assign.apply(this, arguments);
        };

        function __awaiter(thisArg, _arguments, P, generator) {
            function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
            return new (P || (P = Promise))(function (resolve, reject) {
                function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
                function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
                function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
                step((generator = generator.apply(thisArg, _arguments || [])).next());
            });
        }

        function __generator(thisArg, body) {
            var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
            return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
            function verb(n) { return function (v) { return step([n, v]); }; }
            function step(op) {
                if (f) throw new TypeError("Generator is already executing.");
                while (_) try {
                    if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                    if (y = 0, t) op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0: case 1: t = op; break;
                        case 4: _.label++; return { value: op[1], done: false };
                        case 5: _.label++; y = op[1]; op = [0]; continue;
                        case 7: op = _.ops.pop(); _.trys.pop(); continue;
                        default:
                            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                            if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                            if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                            if (t[2]) _.ops.pop();
                            _.trys.pop(); continue;
                    }
                    op = body.call(thisArg, _);
                } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
                if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
            }
        }

        function __spreadArray(to, from, pack) {
            if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
                if (ar || !(i in from)) {
                    if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                    ar[i] = from[i];
                }
            }
            return to.concat(ar || from);
        }

        var Bounds = /** @class */ (function () {
            function Bounds(left, top, width, height) {
                this.left = left;
                this.top = top;
                this.width = width;
                this.height = height;
            }
            Bounds.prototype.add = function (x, y, w, h) {
                return new Bounds(this.left + x, this.top + y, this.width + w, this.height + h);
            };
            Bounds.fromClientRect = function (context, clientRect) {
                return new Bounds(clientRect.left + context.windowBounds.left, clientRect.top + context.windowBounds.top, clientRect.width, clientRect.height);
            };
            Bounds.fromDOMRectList = function (context, domRectList) {
                var domRect = Array.from(domRectList).find(function (rect) { return rect.width !== 0; });
                return domRect
                    ? new Bounds(domRect.left + context.windowBounds.left, domRect.top + context.windowBounds.top, domRect.width, domRect.height)
                    : Bounds.EMPTY;
            };
            Bounds.EMPTY = new Bounds(0, 0, 0, 0);
            return Bounds;
        }());
        var parseBounds = function (context, node) {
            return Bounds.fromClientRect(context, node.getBoundingClientRect());
        };
        var parseDocumentSize = function (document) {
            var body = document.body;
            var documentElement = document.documentElement;
            if (!body || !documentElement) {
                throw new Error("Unable to get document size");
            }
            var width = Math.max(Math.max(body.scrollWidth, documentElement.scrollWidth), Math.max(body.offsetWidth, documentElement.offsetWidth), Math.max(body.clientWidth, documentElement.clientWidth));
            var height = Math.max(Math.max(body.scrollHeight, documentElement.scrollHeight), Math.max(body.offsetHeight, documentElement.offsetHeight), Math.max(body.clientHeight, documentElement.clientHeight));
            return new Bounds(0, 0, width, height);
        };

        /*
         * css-line-break 2.1.0 <https://github.com/niklasvh/css-line-break#readme>
         * Copyright (c) 2022 Niklas von Hertzen <https://hertzen.com>
         * Released under MIT License
         */
        var toCodePoints$1 = function (str) {
            var codePoints = [];
            var i = 0;
            var length = str.length;
            while (i < length) {
                var value = str.charCodeAt(i++);
                if (value >= 0xd800 && value <= 0xdbff && i < length) {
                    var extra = str.charCodeAt(i++);
                    if ((extra & 0xfc00) === 0xdc00) {
                        codePoints.push(((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000);
                    }
                    else {
                        codePoints.push(value);
                        i--;
                    }
                }
                else {
                    codePoints.push(value);
                }
            }
            return codePoints;
        };
        var fromCodePoint$1 = function () {
            var codePoints = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                codePoints[_i] = arguments[_i];
            }
            if (String.fromCodePoint) {
                return String.fromCodePoint.apply(String, codePoints);
            }
            var length = codePoints.length;
            if (!length) {
                return '';
            }
            var codeUnits = [];
            var index = -1;
            var result = '';
            while (++index < length) {
                var codePoint = codePoints[index];
                if (codePoint <= 0xffff) {
                    codeUnits.push(codePoint);
                }
                else {
                    codePoint -= 0x10000;
                    codeUnits.push((codePoint >> 10) + 0xd800, (codePoint % 0x400) + 0xdc00);
                }
                if (index + 1 === length || codeUnits.length > 0x4000) {
                    result += String.fromCharCode.apply(String, codeUnits);
                    codeUnits.length = 0;
                }
            }
            return result;
        };
        var chars$2 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        // Use a lookup table to find the index.
        var lookup$2 = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
        for (var i$2 = 0; i$2 < chars$2.length; i$2++) {
            lookup$2[chars$2.charCodeAt(i$2)] = i$2;
        }

        /*
         * utrie 1.0.2 <https://github.com/niklasvh/utrie>
         * Copyright (c) 2022 Niklas von Hertzen <https://hertzen.com>
         * Released under MIT License
         */
        var chars$1$1 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        // Use a lookup table to find the index.
        var lookup$1$1 = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
        for (var i$1$1 = 0; i$1$1 < chars$1$1.length; i$1$1++) {
            lookup$1$1[chars$1$1.charCodeAt(i$1$1)] = i$1$1;
        }
        var decode$1 = function (base64) {
            var bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
            if (base64[base64.length - 1] === '=') {
                bufferLength--;
                if (base64[base64.length - 2] === '=') {
                    bufferLength--;
                }
            }
            var buffer = typeof ArrayBuffer !== 'undefined' &&
                typeof Uint8Array !== 'undefined' &&
                typeof Uint8Array.prototype.slice !== 'undefined'
                ? new ArrayBuffer(bufferLength)
                : new Array(bufferLength);
            var bytes = Array.isArray(buffer) ? buffer : new Uint8Array(buffer);
            for (i = 0; i < len; i += 4) {
                encoded1 = lookup$1$1[base64.charCodeAt(i)];
                encoded2 = lookup$1$1[base64.charCodeAt(i + 1)];
                encoded3 = lookup$1$1[base64.charCodeAt(i + 2)];
                encoded4 = lookup$1$1[base64.charCodeAt(i + 3)];
                bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
                bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
                bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
            }
            return buffer;
        };
        var polyUint16Array$1 = function (buffer) {
            var length = buffer.length;
            var bytes = [];
            for (var i = 0; i < length; i += 2) {
                bytes.push((buffer[i + 1] << 8) | buffer[i]);
            }
            return bytes;
        };
        var polyUint32Array$1 = function (buffer) {
            var length = buffer.length;
            var bytes = [];
            for (var i = 0; i < length; i += 4) {
                bytes.push((buffer[i + 3] << 24) | (buffer[i + 2] << 16) | (buffer[i + 1] << 8) | buffer[i]);
            }
            return bytes;
        };

        /** Shift size for getting the index-2 table offset. */
        var UTRIE2_SHIFT_2$1 = 5;
        /** Shift size for getting the index-1 table offset. */
        var UTRIE2_SHIFT_1$1 = 6 + 5;
        /**
         * Shift size for shifting left the index array values.
         * Increases possible data size with 16-bit index values at the cost
         * of compactability.
         * This requires data blocks to be aligned by UTRIE2_DATA_GRANULARITY.
         */
        var UTRIE2_INDEX_SHIFT$1 = 2;
        /**
         * Difference between the two shift sizes,
         * for getting an index-1 offset from an index-2 offset. 6=11-5
         */
        var UTRIE2_SHIFT_1_2$1 = UTRIE2_SHIFT_1$1 - UTRIE2_SHIFT_2$1;
        /**
         * The part of the index-2 table for U+D800..U+DBFF stores values for
         * lead surrogate code _units_ not code _points_.
         * Values for lead surrogate code _points_ are indexed with this portion of the table.
         * Length=32=0x20=0x400>>UTRIE2_SHIFT_2. (There are 1024=0x400 lead surrogates.)
         */
        var UTRIE2_LSCP_INDEX_2_OFFSET$1 = 0x10000 >> UTRIE2_SHIFT_2$1;
        /** Number of entries in a data block. 32=0x20 */
        var UTRIE2_DATA_BLOCK_LENGTH$1 = 1 << UTRIE2_SHIFT_2$1;
        /** Mask for getting the lower bits for the in-data-block offset. */
        var UTRIE2_DATA_MASK$1 = UTRIE2_DATA_BLOCK_LENGTH$1 - 1;
        var UTRIE2_LSCP_INDEX_2_LENGTH$1 = 0x400 >> UTRIE2_SHIFT_2$1;
        /** Count the lengths of both BMP pieces. 2080=0x820 */
        var UTRIE2_INDEX_2_BMP_LENGTH$1 = UTRIE2_LSCP_INDEX_2_OFFSET$1 + UTRIE2_LSCP_INDEX_2_LENGTH$1;
        /**
         * The 2-byte UTF-8 version of the index-2 table follows at offset 2080=0x820.
         * Length 32=0x20 for lead bytes C0..DF, regardless of UTRIE2_SHIFT_2.
         */
        var UTRIE2_UTF8_2B_INDEX_2_OFFSET$1 = UTRIE2_INDEX_2_BMP_LENGTH$1;
        var UTRIE2_UTF8_2B_INDEX_2_LENGTH$1 = 0x800 >> 6; /* U+0800 is the first code point after 2-byte UTF-8 */
        /**
         * The index-1 table, only used for supplementary code points, at offset 2112=0x840.
         * Variable length, for code points up to highStart, where the last single-value range starts.
         * Maximum length 512=0x200=0x100000>>UTRIE2_SHIFT_1.
         * (For 0x100000 supplementary code points U+10000..U+10ffff.)
         *
         * The part of the index-2 table for supplementary code points starts
         * after this index-1 table.
         *
         * Both the index-1 table and the following part of the index-2 table
         * are omitted completely if there is only BMP data.
         */
        var UTRIE2_INDEX_1_OFFSET$1 = UTRIE2_UTF8_2B_INDEX_2_OFFSET$1 + UTRIE2_UTF8_2B_INDEX_2_LENGTH$1;
        /**
         * Number of index-1 entries for the BMP. 32=0x20
         * This part of the index-1 table is omitted from the serialized form.
         */
        var UTRIE2_OMITTED_BMP_INDEX_1_LENGTH$1 = 0x10000 >> UTRIE2_SHIFT_1$1;
        /** Number of entries in an index-2 block. 64=0x40 */
        var UTRIE2_INDEX_2_BLOCK_LENGTH$1 = 1 << UTRIE2_SHIFT_1_2$1;
        /** Mask for getting the lower bits for the in-index-2-block offset. */
        var UTRIE2_INDEX_2_MASK$1 = UTRIE2_INDEX_2_BLOCK_LENGTH$1 - 1;
        var slice16$1 = function (view, start, end) {
            if (view.slice) {
                return view.slice(start, end);
            }
            return new Uint16Array(Array.prototype.slice.call(view, start, end));
        };
        var slice32$1 = function (view, start, end) {
            if (view.slice) {
                return view.slice(start, end);
            }
            return new Uint32Array(Array.prototype.slice.call(view, start, end));
        };
        var createTrieFromBase64$1 = function (base64, _byteLength) {
            var buffer = decode$1(base64);
            var view32 = Array.isArray(buffer) ? polyUint32Array$1(buffer) : new Uint32Array(buffer);
            var view16 = Array.isArray(buffer) ? polyUint16Array$1(buffer) : new Uint16Array(buffer);
            var headerLength = 24;
            var index = slice16$1(view16, headerLength / 2, view32[4] / 2);
            var data = view32[5] === 2
                ? slice16$1(view16, (headerLength + view32[4]) / 2)
                : slice32$1(view32, Math.ceil((headerLength + view32[4]) / 4));
            return new Trie$1(view32[0], view32[1], view32[2], view32[3], index, data);
        };
        var Trie$1 = /** @class */ (function () {
            function Trie(initialValue, errorValue, highStart, highValueIndex, index, data) {
                this.initialValue = initialValue;
                this.errorValue = errorValue;
                this.highStart = highStart;
                this.highValueIndex = highValueIndex;
                this.index = index;
                this.data = data;
            }
            /**
             * Get the value for a code point as stored in the Trie.
             *
             * @param codePoint the code point
             * @return the value
             */
            Trie.prototype.get = function (codePoint) {
                var ix;
                if (codePoint >= 0) {
                    if (codePoint < 0x0d800 || (codePoint > 0x0dbff && codePoint <= 0x0ffff)) {
                        // Ordinary BMP code point, excluding leading surrogates.
                        // BMP uses a single level lookup.  BMP index starts at offset 0 in the Trie2 index.
                        // 16 bit data is stored in the index array itself.
                        ix = this.index[codePoint >> UTRIE2_SHIFT_2$1];
                        ix = (ix << UTRIE2_INDEX_SHIFT$1) + (codePoint & UTRIE2_DATA_MASK$1);
                        return this.data[ix];
                    }
                    if (codePoint <= 0xffff) {
                        // Lead Surrogate Code Point.  A Separate index section is stored for
                        // lead surrogate code units and code points.
                        //   The main index has the code unit data.
                        //   For this function, we need the code point data.
                        // Note: this expression could be refactored for slightly improved efficiency, but
                        //       surrogate code points will be so rare in practice that it's not worth it.
                        ix = this.index[UTRIE2_LSCP_INDEX_2_OFFSET$1 + ((codePoint - 0xd800) >> UTRIE2_SHIFT_2$1)];
                        ix = (ix << UTRIE2_INDEX_SHIFT$1) + (codePoint & UTRIE2_DATA_MASK$1);
                        return this.data[ix];
                    }
                    if (codePoint < this.highStart) {
                        // Supplemental code point, use two-level lookup.
                        ix = UTRIE2_INDEX_1_OFFSET$1 - UTRIE2_OMITTED_BMP_INDEX_1_LENGTH$1 + (codePoint >> UTRIE2_SHIFT_1$1);
                        ix = this.index[ix];
                        ix += (codePoint >> UTRIE2_SHIFT_2$1) & UTRIE2_INDEX_2_MASK$1;
                        ix = this.index[ix];
                        ix = (ix << UTRIE2_INDEX_SHIFT$1) + (codePoint & UTRIE2_DATA_MASK$1);
                        return this.data[ix];
                    }
                    if (codePoint <= 0x10ffff) {
                        return this.data[this.highValueIndex];
                    }
                }
                // Fall through.  The code point is outside of the legal range of 0..0x10ffff.
                return this.errorValue;
            };
            return Trie;
        }());

        /*
         * base64-arraybuffer 1.0.2 <https://github.com/niklasvh/base64-arraybuffer>
         * Copyright (c) 2022 Niklas von Hertzen <https://hertzen.com>
         * Released under MIT License
         */
        var chars$3 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        // Use a lookup table to find the index.
        var lookup$3 = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
        for (var i$3 = 0; i$3 < chars$3.length; i$3++) {
            lookup$3[chars$3.charCodeAt(i$3)] = i$3;
        }

        var base64$1 = 'KwAAAAAAAAAACA4AUD0AADAgAAACAAAAAAAIABAAGABAAEgAUABYAGAAaABgAGgAYgBqAF8AZwBgAGgAcQB5AHUAfQCFAI0AlQCdAKIAqgCyALoAYABoAGAAaABgAGgAwgDKAGAAaADGAM4A0wDbAOEA6QDxAPkAAQEJAQ8BFwF1AH0AHAEkASwBNAE6AUIBQQFJAVEBWQFhAWgBcAF4ATAAgAGGAY4BlQGXAZ8BpwGvAbUBvQHFAc0B0wHbAeMB6wHxAfkBAQIJAvEBEQIZAiECKQIxAjgCQAJGAk4CVgJeAmQCbAJ0AnwCgQKJApECmQKgAqgCsAK4ArwCxAIwAMwC0wLbAjAA4wLrAvMC+AIAAwcDDwMwABcDHQMlAy0DNQN1AD0DQQNJA0kDSQNRA1EDVwNZA1kDdQB1AGEDdQBpA20DdQN1AHsDdQCBA4kDkQN1AHUAmQOhA3UAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AKYDrgN1AHUAtgO+A8YDzgPWAxcD3gPjA+sD8wN1AHUA+wMDBAkEdQANBBUEHQQlBCoEFwMyBDgEYABABBcDSARQBFgEYARoBDAAcAQzAXgEgASIBJAEdQCXBHUAnwSnBK4EtgS6BMIEyAR1AHUAdQB1AHUAdQCVANAEYABgAGAAYABgAGAAYABgANgEYADcBOQEYADsBPQE/AQEBQwFFAUcBSQFLAU0BWQEPAVEBUsFUwVbBWAAYgVgAGoFcgV6BYIFigWRBWAAmQWfBaYFYABgAGAAYABgAKoFYACxBbAFuQW6BcEFwQXHBcEFwQXPBdMF2wXjBeoF8gX6BQIGCgYSBhoGIgYqBjIGOgZgAD4GRgZMBmAAUwZaBmAAYABgAGAAYABgAGAAYABgAGAAYABgAGIGYABpBnAGYABgAGAAYABgAGAAYABgAGAAYAB4Bn8GhQZgAGAAYAB1AHcDFQSLBmAAYABgAJMGdQA9A3UAmwajBqsGqwaVALMGuwbDBjAAywbSBtIG1QbSBtIG0gbSBtIG0gbdBuMG6wbzBvsGAwcLBxMHAwcbByMHJwcsBywHMQcsB9IGOAdAB0gHTgfSBkgHVgfSBtIG0gbSBtIG0gbSBtIG0gbSBiwHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAdgAGAALAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAdbB2MHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsB2kH0gZwB64EdQB1AHUAdQB1AHUAdQB1AHUHfQdgAIUHjQd1AHUAlQedB2AAYAClB6sHYACzB7YHvgfGB3UAzgfWBzMB3gfmB1EB7gf1B/0HlQENAQUIDQh1ABUIHQglCBcDLQg1CD0IRQhNCEEDUwh1AHUAdQBbCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIaQhjCGQIZQhmCGcIaAhpCGMIZAhlCGYIZwhoCGkIYwhkCGUIZghnCGgIcAh3CHoIMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwAIIIggiCCIIIggiCCIIIggiCCIIIggiCCIIIggiCCIIIggiCCIIIggiCCIIIggiCCIIIggiCCIIIggiCCIIIgggwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAALAcsBywHLAcsBywHLAcsBywHLAcsB4oILAcsB44I0gaWCJ4Ipgh1AHUAqgiyCHUAdQB1AHUAdQB1AHUAdQB1AHUAtwh8AXUAvwh1AMUIyQjRCNkI4AjoCHUAdQB1AO4I9gj+CAYJDgkTCS0HGwkjCYIIggiCCIIIggiCCIIIggiCCIIIggiCCIIIggiCCIIIggiCCIIIggiCCIIIggiCCIIIggiCCIIIggiCCIIIggiAAIAAAAFAAYABgAGIAXwBgAHEAdQBFAJUAogCyAKAAYABgAEIA4ABGANMA4QDxAMEBDwE1AFwBLAE6AQEBUQF4QkhCmEKoQrhCgAHIQsAB0MLAAcABwAHAAeDC6ABoAHDCwMMAAcABwAHAAdDDGMMAAcAB6MM4wwjDWMNow3jDaABoAGgAaABoAGgAaABoAGgAaABoAGgAaABoAGgAaABoAGgAaABoAEjDqABWw6bDqABpg6gAaABoAHcDvwOPA+gAaABfA/8DvwO/A78DvwO/A78DvwO/A78DvwO/A78DvwO/A78DvwO/A78DvwO/A78DvwO/A78DvwO/A78DpcPAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcAB9cPKwkyCToJMAB1AHUAdQBCCUoJTQl1AFUJXAljCWcJawkwADAAMAAwAHMJdQB2CX4JdQCECYoJjgmWCXUAngkwAGAAYABxAHUApgn3A64JtAl1ALkJdQDACTAAMAAwADAAdQB1AHUAdQB1AHUAdQB1AHUAowYNBMUIMAAwADAAMADICcsJ0wnZCRUE4QkwAOkJ8An4CTAAMAB1AAAKvwh1AAgKDwoXCh8KdQAwACcKLgp1ADYKqAmICT4KRgowADAAdQB1AE4KMAB1AFYKdQBeCnUAZQowADAAMAAwADAAMAAwADAAMAAVBHUAbQowADAAdQC5CXUKMAAwAHwBxAijBogEMgF9CoQKiASMCpQKmgqIBKIKqgquCogEDQG2Cr4KxgrLCjAAMADTCtsKCgHjCusK8Qr5CgELMAAwADAAMAB1AIsECQsRC3UANAEZCzAAMAAwADAAMAB1ACELKQswAHUANAExCzkLdQBBC0kLMABRC1kLMAAwADAAMAAwADAAdQBhCzAAMAAwAGAAYABpC3ELdwt/CzAAMACHC4sLkwubC58Lpwt1AK4Ltgt1APsDMAAwADAAMAAwADAAMAAwAL4LwwvLC9IL1wvdCzAAMADlC+kL8Qv5C/8LSQswADAAMAAwADAAMAAwADAAMAAHDDAAMAAwADAAMAAODBYMHgx1AHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1ACYMMAAwADAAdQB1AHUALgx1AHUAdQB1AHUAdQA2DDAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwAHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AD4MdQBGDHUAdQB1AHUAdQB1AEkMdQB1AHUAdQB1AFAMMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwAHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AHUAdQBYDHUAdQB1AF8MMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAB1AHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AHUA+wMVBGcMMAAwAHwBbwx1AHcMfwyHDI8MMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAYABgAJcMMAAwADAAdQB1AJ8MlQClDDAAMACtDCwHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsB7UMLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHdQB1AHUAdQB1AHUAdQB1AHUAdQB1AHUAdQB1AA0EMAC9DDAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAsBywHLAcsBywHLAcsBywHLQcwAMEMyAwsBywHLAcsBywHLAcsBywHLAcsBywHzAwwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwAHUAdQB1ANQM2QzhDDAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMABgAGAAYABgAGAAYABgAOkMYADxDGAA+AwADQYNYABhCWAAYAAODTAAMAAwADAAFg1gAGAAHg37AzAAMAAwADAAYABgACYNYAAsDTQNPA1gAEMNPg1LDWAAYABgAGAAYABgAGAAYABgAGAAUg1aDYsGVglhDV0NcQBnDW0NdQ15DWAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAlQCBDZUAiA2PDZcNMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAnw2nDTAAMAAwADAAMAAwAHUArw23DTAAMAAwADAAMAAwADAAMAAwADAAMAB1AL8NMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAB1AHUAdQB1AHUAdQDHDTAAYABgAM8NMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAA1w11ANwNMAAwAD0B5A0wADAAMAAwADAAMADsDfQN/A0EDgwOFA4wABsOMAAwADAAMAAwADAAMAAwANIG0gbSBtIG0gbSBtIG0gYjDigOwQUuDsEFMw7SBjoO0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIGQg5KDlIOVg7SBtIGXg5lDm0OdQ7SBtIGfQ6EDooOjQ6UDtIGmg6hDtIG0gaoDqwO0ga0DrwO0gZgAGAAYADEDmAAYAAkBtIGzA5gANIOYADaDokO0gbSBt8O5w7SBu8O0gb1DvwO0gZgAGAAxA7SBtIG0gbSBtIGYABgAGAAYAAED2AAsAUMD9IG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIGFA8sBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAccD9IGLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHJA8sBywHLAcsBywHLAccDywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywPLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAc0D9IG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIGLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAccD9IG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIGFA8sBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHLAcsBywHPA/SBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gbSBtIG0gYUD0QPlQCVAJUAMAAwADAAMACVAJUAlQCVAJUAlQCVAEwPMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAA//8EAAQABAAEAAQABAAEAAQABAANAAMAAQABAAIABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQACgATABcAHgAbABoAHgAXABYAEgAeABsAGAAPABgAHABLAEsASwBLAEsASwBLAEsASwBLABgAGAAeAB4AHgATAB4AUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQABYAGwASAB4AHgAeAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAWAA0AEQAeAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAAQABAAEAAQABAAFAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAJABYAGgAbABsAGwAeAB0AHQAeAE8AFwAeAA0AHgAeABoAGwBPAE8ADgBQAB0AHQAdAE8ATwAXAE8ATwBPABYAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAB0AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAdAFAAUABQAFAAUABQAFAAUAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAFAAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAeAB4AHgAeAFAATwBAAE8ATwBPAEAATwBQAFAATwBQAB4AHgAeAB4AHgAeAB0AHQAdAB0AHgAdAB4ADgBQAFAAUABQAFAAHgAeAB4AHgAeAB4AHgBQAB4AUAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4ABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAJAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAkACQAJAAkACQAJAAkABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAeAB4AHgAeAFAAHgAeAB4AKwArAFAAUABQAFAAGABQACsAKwArACsAHgAeAFAAHgBQAFAAUAArAFAAKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4ABAAEAAQABAAEAAQABAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAUAAeAB4AHgAeAB4AHgBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAYAA0AKwArAB4AHgAbACsABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQADQAEAB4ABAAEAB4ABAAEABMABAArACsAKwArACsAKwArACsAVgBWAFYAVgBWAFYAVgBWAFYAVgBWAFYAVgBWAFYAVgBWAFYAVgBWAFYAVgBWAFYAVgBWAFYAKwArACsAKwBWAFYAVgBWAB4AHgArACsAKwArACsAKwArACsAKwArACsAHgAeAB4AHgAeAB4AHgAeAB4AGgAaABoAGAAYAB4AHgAEAAQABAAEAAQABAAEAAQABAAEAAQAEwAEACsAEwATAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABABLAEsASwBLAEsASwBLAEsASwBLABoAGQAZAB4AUABQAAQAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQABMAUAAEAAQABAAEAAQABAAEAB4AHgAEAAQABAAEAAQABABQAFAABAAEAB4ABAAEAAQABABQAFAASwBLAEsASwBLAEsASwBLAEsASwBQAFAAUAAeAB4AUAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwAeAFAABABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEAAQABAAEAFAAKwArACsAKwArACsAKwArACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEAAQAUABQAB4AHgAYABMAUAArACsABAAbABsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAFAABAAEAAQABAAEAFAABAAEAAQAUAAEAAQABAAEAAQAKwArAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAArACsAHgArAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwArACsAKwArAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAB4ABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAFAABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAUAAEAAQABAAEAAQABAAEAFAAUABQAFAAUABQAFAAUABQAFAABAAEAA0ADQBLAEsASwBLAEsASwBLAEsASwBLAB4AUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAArAFAAUABQAFAAUABQAFAAUAArACsAUABQACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQACsAUAArACsAKwBQAFAAUABQACsAKwAEAFAABAAEAAQABAAEAAQABAArACsABAAEACsAKwAEAAQABABQACsAKwArACsAKwArACsAKwAEACsAKwArACsAUABQACsAUABQAFAABAAEACsAKwBLAEsASwBLAEsASwBLAEsASwBLAFAAUAAaABoAUABQAFAAUABQAEwAHgAbAFAAHgAEACsAKwAEAAQABAArAFAAUABQAFAAUABQACsAKwArACsAUABQACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQACsAUABQACsAUABQACsAUABQACsAKwAEACsABAAEAAQABAAEACsAKwArACsABAAEACsAKwAEAAQABAArACsAKwAEACsAKwArACsAKwArACsAUABQAFAAUAArAFAAKwArACsAKwArACsAKwBLAEsASwBLAEsASwBLAEsASwBLAAQABABQAFAAUAAEAB4AKwArACsAKwArACsAKwArACsAKwAEAAQABAArAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQACsAUABQACsAUABQAFAAUABQACsAKwAEAFAABAAEAAQABAAEAAQABAAEACsABAAEAAQAKwAEAAQABAArACsAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAABAAEACsAKwBLAEsASwBLAEsASwBLAEsASwBLAB4AGwArACsAKwArACsAKwArAFAABAAEAAQABAAEAAQAKwAEAAQABAArAFAAUABQAFAAUABQAFAAUAArACsAUABQACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAAQABAArACsABAAEACsAKwAEAAQABAArACsAKwArACsAKwArAAQABAAEACsAKwArACsAUABQACsAUABQAFAABAAEACsAKwBLAEsASwBLAEsASwBLAEsASwBLAB4AUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArAAQAUAArAFAAUABQAFAAUABQACsAKwArAFAAUABQACsAUABQAFAAUAArACsAKwBQAFAAKwBQACsAUABQACsAKwArAFAAUAArACsAKwBQAFAAUAArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArAAQABAAEAAQABAArACsAKwAEAAQABAArAAQABAAEAAQAKwArAFAAKwArACsAKwArACsABAArACsAKwArACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAUABQAFAAHgAeAB4AHgAeAB4AGwAeACsAKwArACsAKwAEAAQABAAEAAQAUABQAFAAUABQAFAAUABQACsAUABQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAUAAEAAQABAAEAAQABAAEACsABAAEAAQAKwAEAAQABAAEACsAKwArACsAKwArACsABAAEACsAUABQAFAAKwArACsAKwArAFAAUAAEAAQAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsAKwAOAFAAUABQAFAAUABQAFAAHgBQAAQABAAEAA4AUABQAFAAUABQAFAAUABQACsAUABQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAKwArAAQAUAAEAAQABAAEAAQABAAEACsABAAEAAQAKwAEAAQABAAEACsAKwArACsAKwArACsABAAEACsAKwArACsAKwArACsAUAArAFAAUAAEAAQAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwBQAFAAKwArACsAKwArACsAKwArACsAKwArACsAKwAEAAQABAAEAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAFAABAAEAAQABAAEAAQABAArAAQABAAEACsABAAEAAQABABQAB4AKwArACsAKwBQAFAAUAAEAFAAUABQAFAAUABQAFAAUABQAFAABAAEACsAKwBLAEsASwBLAEsASwBLAEsASwBLAFAAUABQAFAAUABQAFAAUABQABoAUABQAFAAUABQAFAAKwAEAAQABAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUABQACsAUAArACsAUABQAFAAUABQAFAAUAArACsAKwAEACsAKwArACsABAAEAAQABAAEAAQAKwAEACsABAAEAAQABAAEAAQABAAEACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArAAQABAAeACsAKwArACsAKwArACsAKwArACsAKwArAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXAAqAFwAXAAqACoAKgAqACoAKgAqACsAKwArACsAGwBcAFwAXABcAFwAXABcACoAKgAqACoAKgAqACoAKgAeAEsASwBLAEsASwBLAEsASwBLAEsADQANACsAKwArACsAKwBcAFwAKwBcACsAXABcAFwAXABcACsAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcACsAXAArAFwAXABcAFwAXABcAFwAXABcAFwAKgBcAFwAKgAqACoAKgAqACoAKgAqACoAXAArACsAXABcAFwAXABcACsAXAArACoAKgAqACoAKgAqACsAKwBLAEsASwBLAEsASwBLAEsASwBLACsAKwBcAFwAXABcAFAADgAOAA4ADgAeAA4ADgAJAA4ADgANAAkAEwATABMAEwATAAkAHgATAB4AHgAeAAQABAAeAB4AHgAeAB4AHgBLAEsASwBLAEsASwBLAEsASwBLAFAAUABQAFAAUABQAFAAUABQAFAADQAEAB4ABAAeAAQAFgARABYAEQAEAAQAUABQAFAAUABQAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQADQAEAAQABAAEAAQADQAEAAQAUABQAFAAUABQAAQABAAEAAQABAAEAAQABAAEAAQABAArAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAArAA0ADQAeAB4AHgAeAB4AHgAEAB4AHgAeAB4AHgAeACsAHgAeAA4ADgANAA4AHgAeAB4AHgAeAAkACQArACsAKwArACsAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgBcAEsASwBLAEsASwBLAEsASwBLAEsADQANAB4AHgAeAB4AXABcAFwAXABcAFwAKgAqACoAKgBcAFwAXABcACoAKgAqAFwAKgAqACoAXABcACoAKgAqACoAKgAqACoAXABcAFwAKgAqACoAKgBcAFwAXABcAFwAXABcAFwAXABcAFwAXABcACoAKgAqACoAKgAqACoAKgAqACoAKgAqAFwAKgBLAEsASwBLAEsASwBLAEsASwBLACoAKgAqACoAKgAqAFAAUABQAFAAUABQACsAUAArACsAKwArACsAUAArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAHgBQAFAAUABQAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAUAArACsAUABQAFAAUABQAFAAUAArAFAAKwBQAFAAUABQACsAKwBQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAKwArAFAAUABQAFAAUABQAFAAKwBQACsAUABQAFAAUAArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsABAAEAAQAHgANAB4AHgAeAB4AHgAeAB4AUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAHgAeAB4AHgAeAB4AHgAeAB4AHgArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwBQAFAAUABQAFAAUAArACsADQBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAHgAeAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAANAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAWABEAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAA0ADQANAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAAQABAAEACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAANAA0AKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEACsAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAUAArAAQABAArACsAKwArACsAKwArACsAKwArACsAKwBcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqAA0ADQAVAFwADQAeAA0AGwBcACoAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwAeAB4AEwATAA0ADQAOAB4AEwATAB4ABAAEAAQACQArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArAFAAUABQAFAAUAAEAAQAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQAUAArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwAEAAQABAAEAAQABAAEAAQABAAEAAQABAArACsAKwArAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsAKwArACsAHgArACsAKwATABMASwBLAEsASwBLAEsASwBLAEsASwBcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXAArACsAXABcAFwAXABcACsAKwArACsAKwArACsAKwArACsAKwBcAFwAXABcAFwAXABcAFwAXABcAFwAXAArACsAKwArAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAXAArACsAKwAqACoAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAAQABAArACsAHgAeAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcACoAKgAqACoAKgAqACoAKgAqACoAKwAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKwArAAQASwBLAEsASwBLAEsASwBLAEsASwArACsAKwArACsAKwBLAEsASwBLAEsASwBLAEsASwBLACsAKwArACsAKwArACoAKgAqACoAKgAqACoAXAAqACoAKgAqACoAKgArACsABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsABAAEAAQABAAEAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAAQABABQAFAAUABQAFAAUABQACsAKwArACsASwBLAEsASwBLAEsASwBLAEsASwANAA0AHgANAA0ADQANAB4AHgAeAB4AHgAeAB4AHgAeAB4ABAAEAAQABAAEAAQABAAEAAQAHgAeAB4AHgAeAB4AHgAeAB4AKwArACsABAAEAAQAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEAAQABAAEAAQABABQAFAASwBLAEsASwBLAEsASwBLAEsASwBQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsAKwArACsAKwArACsAKwAeAB4AHgAeAFAAUABQAFAABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsAKwArAA0ADQANAA0ADQBLAEsASwBLAEsASwBLAEsASwBLACsAKwArAFAAUABQAEsASwBLAEsASwBLAEsASwBLAEsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAA0ADQBQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwBQAFAAUAAeAB4AHgAeAB4AHgAeAB4AKwArACsAKwArACsAKwArAAQABAAEAB4ABAAEAAQABAAEAAQABAAEAAQABAAEAAQABABQAFAAUABQAAQAUABQAFAAUABQAFAABABQAFAABAAEAAQAUAArACsAKwArACsABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsABAAEAAQABAAEAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwArAFAAUABQAFAAUABQACsAKwBQAFAAUABQAFAAUABQAFAAKwBQACsAUAArAFAAKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeACsAKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArAB4AHgAeAB4AHgAeAB4AHgBQAB4AHgAeAFAAUABQACsAHgAeAB4AHgAeAB4AHgAeAB4AHgBQAFAAUABQACsAKwAeAB4AHgAeAB4AHgArAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwArAFAAUABQACsAHgAeAB4AHgAeAB4AHgAOAB4AKwANAA0ADQANAA0ADQANAAkADQANAA0ACAAEAAsABAAEAA0ACQANAA0ADAAdAB0AHgAXABcAFgAXABcAFwAWABcAHQAdAB4AHgAUABQAFAANAAEAAQAEAAQABAAEAAQACQAaABoAGgAaABoAGgAaABoAHgAXABcAHQAVABUAHgAeAB4AHgAeAB4AGAAWABEAFQAVABUAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4ADQAeAA0ADQANAA0AHgANAA0ADQAHAB4AHgAeAB4AKwAEAAQABAAEAAQABAAEAAQABAAEAFAAUAArACsATwBQAFAAUABQAFAAHgAeAB4AFgARAE8AUABPAE8ATwBPAFAAUABQAFAAUAAeAB4AHgAWABEAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArABsAGwAbABsAGwAbABsAGgAbABsAGwAbABsAGwAbABsAGwAbABsAGwAbABsAGgAbABsAGwAbABoAGwAbABoAGwAbABsAGwAbABsAGwAbABsAGwAbABsAGwAbABsAGwAbAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAHgAeAFAAGgAeAB0AHgBQAB4AGgAeAB4AHgAeAB4AHgAeAB4AHgBPAB4AUAAbAB4AHgBQAFAAUABQAFAAHgAeAB4AHQAdAB4AUAAeAFAAHgBQAB4AUABPAFAAUAAeAB4AHgAeAB4AHgAeAFAAUABQAFAAUAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAFAAHgBQAFAAUABQAE8ATwBQAFAAUABQAFAATwBQAFAATwBQAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAFAAUABQAFAATwBPAE8ATwBPAE8ATwBPAE8ATwBQAFAAUABQAFAAUABQAFAAUAAeAB4AUABQAFAAUABPAB4AHgArACsAKwArAB0AHQAdAB0AHQAdAB0AHQAdAB0AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB0AHgAdAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAdAB4AHQAdAB4AHgAeAB0AHQAeAB4AHQAeAB4AHgAdAB4AHQAbABsAHgAdAB4AHgAeAB4AHQAeAB4AHQAdAB0AHQAeAB4AHQAeAB0AHgAdAB0AHQAdAB0AHQAeAB0AHgAeAB4AHgAeAB0AHQAdAB0AHgAeAB4AHgAdAB0AHgAeAB4AHgAeAB4AHgAeAB4AHgAdAB4AHgAeAB0AHgAeAB4AHgAeAB0AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAdAB0AHgAeAB0AHQAdAB0AHgAeAB0AHQAeAB4AHQAdAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB0AHQAeAB4AHQAdAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHQAeAB4AHgAdAB4AHgAeAB4AHgAeAB4AHQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB0AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AFAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeABYAEQAWABEAHgAeAB4AHgAeAB4AHQAeAB4AHgAeAB4AHgAeACUAJQAeAB4AHgAeAB4AHgAeAB4AHgAWABEAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AJQAlACUAJQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAFAAHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHgAeAB4AHgAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAeAB4AHQAdAB0AHQAeAB4AHgAeAB4AHgAeAB4AHgAeAB0AHQAeAB0AHQAdAB0AHQAdAB0AHgAeAB4AHgAeAB4AHgAeAB0AHQAeAB4AHQAdAB4AHgAeAB4AHQAdAB4AHgAeAB4AHQAdAB0AHgAeAB0AHgAeAB0AHQAdAB0AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAdAB0AHQAdAB4AHgAeAB4AHgAeAB4AHgAeAB0AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAlACUAJQAlAB4AHQAdAB4AHgAdAB4AHgAeAB4AHQAdAB4AHgAeAB4AJQAlAB0AHQAlAB4AJQAlACUAIAAlACUAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAlACUAJQAeAB4AHgAeAB0AHgAdAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAdAB0AHgAdAB0AHQAeAB0AJQAdAB0AHgAdAB0AHgAdAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeACUAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHQAdAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAlACUAJQAlACUAJQAlACUAJQAlACUAJQAdAB0AHQAdACUAHgAlACUAJQAdACUAJQAdAB0AHQAlACUAHQAdACUAHQAdACUAJQAlAB4AHQAeAB4AHgAeAB0AHQAlAB0AHQAdAB0AHQAdACUAJQAlACUAJQAdACUAJQAgACUAHQAdACUAJQAlACUAJQAlACUAJQAeAB4AHgAlACUAIAAgACAAIAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB0AHgAeAB4AFwAXABcAFwAXABcAHgATABMAJQAeAB4AHgAWABEAFgARABYAEQAWABEAFgARABYAEQAWABEATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeABYAEQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAWABEAFgARABYAEQAWABEAFgARAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AFgARABYAEQAWABEAFgARABYAEQAWABEAFgARABYAEQAWABEAFgARABYAEQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAWABEAFgARAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AFgARAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAdAB0AHQAdAB0AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArACsAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AUABQAFAAUAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAEAAQABAAeAB4AKwArACsAKwArABMADQANAA0AUAATAA0AUABQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAUAANACsAKwArACsAKwArACsAKwArACsAKwArACsAKwAEAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQACsAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQACsAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXAA0ADQANAA0ADQANAA0ADQAeAA0AFgANAB4AHgAXABcAHgAeABcAFwAWABEAFgARABYAEQAWABEADQANAA0ADQATAFAADQANAB4ADQANAB4AHgAeAB4AHgAMAAwADQANAA0AHgANAA0AFgANAA0ADQANAA0ADQANAA0AHgANAB4ADQANAB4AHgAeACsAKwArACsAKwArACsAKwArACsAKwArACsAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACsAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAKwArACsAKwArACsAKwArACsAKwArACsAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwAlACUAJQAlACUAJQAlACUAJQAlACUAJQArACsAKwArAA0AEQARACUAJQBHAFcAVwAWABEAFgARABYAEQAWABEAFgARACUAJQAWABEAFgARABYAEQAWABEAFQAWABEAEQAlAFcAVwBXAFcAVwBXAFcAVwBXAAQABAAEAAQABAAEACUAVwBXAFcAVwA2ACUAJQBXAFcAVwBHAEcAJQAlACUAKwBRAFcAUQBXAFEAVwBRAFcAUQBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFEAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBRAFcAUQBXAFEAVwBXAFcAVwBXAFcAUQBXAFcAVwBXAFcAVwBRAFEAKwArAAQABAAVABUARwBHAFcAFQBRAFcAUQBXAFEAVwBRAFcAUQBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFEAVwBRAFcAUQBXAFcAVwBXAFcAVwBRAFcAVwBXAFcAVwBXAFEAUQBXAFcAVwBXABUAUQBHAEcAVwArACsAKwArACsAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAKwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAKwAlACUAVwBXAFcAVwAlACUAJQAlACUAJQAlACUAJQAlACsAKwArACsAKwArACsAKwArACsAKwArAFEAUQBRAFEAUQBRAFEAUQBRAFEAUQBRAFEAUQBRAFEAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQArAFcAVwBXAFcAVwBXAFcAVwBXAFcAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQBPAE8ATwBPAE8ATwBPAE8AJQBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXACUAJQAlAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAEcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAKwArACsAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAADQATAA0AUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABLAEsASwBLAEsASwBLAEsASwBLAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAFAABAAEAAQABAAeAAQABAAEAAQABAAEAAQABAAEAAQAHgBQAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AUABQAAQABABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAeAA0ADQANAA0ADQArACsAKwArACsAKwArACsAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAFAAUABQAFAAUABQAFAAUABQAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AUAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgBQAB4AHgAeAB4AHgAeAFAAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArACsAHgAeAB4AHgAeAB4AHgAeAB4AKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwAeAB4AUABQAFAAUABQAFAAUABQAFAAUABQAAQAUABQAFAABABQAFAAUABQAAQAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAAQABAAeAB4AHgAeAAQAKwArACsAUABQAFAAUABQAFAAHgAeABoAHgArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAADgAOABMAEwArACsAKwArACsAKwArACsABAAEAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAAQABAAEACsAKwArACsAKwArACsAKwANAA0ASwBLAEsASwBLAEsASwBLAEsASwArACsAKwArACsAKwAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABABQAFAAUABQAFAAUAAeAB4AHgBQAA4AUABQAAQAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEAA0ADQBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAKwArACsAKwArACsAKwArACsAKwArAB4AWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYAFgAWABYACsAKwArAAQAHgAeAB4AHgAeAB4ADQANAA0AHgAeAB4AHgArAFAASwBLAEsASwBLAEsASwBLAEsASwArACsAKwArAB4AHgBcAFwAXABcAFwAKgBcAFwAXABcAFwAXABcAFwAXABcAEsASwBLAEsASwBLAEsASwBLAEsAXABcAFwAXABcACsAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsAKwArACsAKwArACsAKwArAFAAUABQAAQAUABQAFAAUABQAFAAUABQAAQABAArACsASwBLAEsASwBLAEsASwBLAEsASwArACsAHgANAA0ADQBcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAKgAqACoAXAAqACoAKgBcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXAAqAFwAKgAqACoAXABcACoAKgBcAFwAXABcAFwAKgAqAFwAKgBcACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAFwAXABcACoAKgBQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAA0ADQBQAFAAUAAEAAQAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUAArACsAUABQAFAAUABQAFAAKwArAFAAUABQAFAAUABQACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAHgAeACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAAQADQAEAAQAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsAVABVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBUAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVAFUAVQBVACsAKwArACsAKwArACsAKwArACsAKwArAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAWQBZAFkAKwArACsAKwBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAWgBaAFoAKwArACsAKwAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYABgAGAAYAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXACUAJQBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAJQAlACUAJQAlACUAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAKwArACsAKwArAFYABABWAFYAVgBWAFYAVgBWAFYAVgBWAB4AVgBWAFYAVgBWAFYAVgBWAFYAVgBWAFYAVgArAFYAVgBWAFYAVgArAFYAKwBWAFYAKwBWAFYAKwBWAFYAVgBWAFYAVgBWAFYAVgBWAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAEQAWAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUAAaAB4AKwArAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAGAARABEAGAAYABMAEwAWABEAFAArACsAKwArACsAKwAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACUAJQAlACUAJQAWABEAFgARABYAEQAWABEAFgARABYAEQAlACUAFgARACUAJQAlACUAJQAlACUAEQAlABEAKwAVABUAEwATACUAFgARABYAEQAWABEAJQAlACUAJQAlACUAJQAlACsAJQAbABoAJQArACsAKwArAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArAAcAKwATACUAJQAbABoAJQAlABYAEQAlACUAEQAlABEAJQBXAFcAVwBXAFcAVwBXAFcAVwBXABUAFQAlACUAJQATACUAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXABYAJQARACUAJQAlAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwAWACUAEQAlABYAEQARABYAEQARABUAVwBRAFEAUQBRAFEAUQBRAFEAUQBRAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAEcARwArACsAVwBXAFcAVwBXAFcAKwArAFcAVwBXAFcAVwBXACsAKwBXAFcAVwBXAFcAVwArACsAVwBXAFcAKwArACsAGgAbACUAJQAlABsAGwArAB4AHgAeAB4AHgAeAB4AKwArACsAKwArACsAKwArACsAKwAEAAQABAAQAB0AKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsADQANAA0AKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArAB4AHgAeAB4AHgAeAB4AHgAeAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgBQAFAAHgAeAB4AKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAAQAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwAEAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAA0AUABQAFAAUAArACsAKwArAFAAUABQAFAAUABQAFAAUAANAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAKwArACsAKwAeACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAKwArAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUAArACsAKwBQACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwANAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAeAB4AUABQAFAAUABQAFAAUAArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUAArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArAA0AUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwAeAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAUABQAFAAUABQAAQABAAEACsABAAEACsAKwArACsAKwAEAAQABAAEAFAAUABQAFAAKwBQAFAAUAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArAAQABAAEACsAKwArACsABABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArAA0ADQANAA0ADQANAA0ADQAeACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAeAFAAUABQAFAAUABQAFAAUAAeAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAArACsAKwArAFAAUABQAFAAUAANAA0ADQANAA0ADQAUACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsADQANAA0ADQANAA0ADQBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArAB4AHgAeAB4AKwArACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArAFAAUABQAFAAUABQAAQABAAEAAQAKwArACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUAArAAQABAANACsAKwBQAFAAKwArACsAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAAQABAAEAAQABAAEAAQABAAEAAQABABQAFAAUABQAB4AHgAeAB4AHgArACsAKwArACsAKwAEAAQABAAEAAQABAAEAA0ADQAeAB4AHgAeAB4AKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsABABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAQABAAEAAQABAAEAAQABAAEAAQABAAeAB4AHgANAA0ADQANACsAKwArACsAKwArACsAKwArACsAKwAeACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwBLAEsASwBLAEsASwBLAEsASwBLACsAKwArACsAKwArAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEACsASwBLAEsASwBLAEsASwBLAEsASwANAA0ADQANAFAABAAEAFAAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAeAA4AUAArACsAKwArACsAKwArACsAKwAEAFAAUABQAFAADQANAB4ADQAEAAQABAAEAB4ABAAEAEsASwBLAEsASwBLAEsASwBLAEsAUAAOAFAADQANAA0AKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAAQABAAEAAQABAANAA0AHgANAA0AHgAEACsAUABQAFAAUABQAFAAUAArAFAAKwBQAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAA0AKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAAQABAAEAAQAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsABAAEAAQABAArAFAAUABQAFAAUABQAFAAUAArACsAUABQACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQACsAUABQACsAUABQAFAAUABQACsABAAEAFAABAAEAAQABAAEAAQABAArACsABAAEACsAKwAEAAQABAArACsAUAArACsAKwArACsAKwAEACsAKwArACsAKwBQAFAAUABQAFAABAAEACsAKwAEAAQABAAEAAQABAAEACsAKwArAAQABAAEAAQABAArACsAKwArACsAKwArACsAKwArACsABAAEAAQABAAEAAQABABQAFAAUABQAA0ADQANAA0AHgBLAEsASwBLAEsASwBLAEsASwBLAA0ADQArAB4ABABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwAEAAQABAAEAFAAUAAeAFAAKwArACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAArACsABAAEAAQABAAEAAQABAAEAAQADgANAA0AEwATAB4AHgAeAA0ADQANAA0ADQANAA0ADQANAA0ADQANAA0ADQANAFAAUABQAFAABAAEACsAKwAEAA0ADQAeAFAAKwArACsAKwArACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAFAAKwArACsAKwArACsAKwBLAEsASwBLAEsASwBLAEsASwBLACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAXABcAFwAKwArACoAKgAqACoAKgAqACoAKgAqACoAKgAqACoAKgAqACsAKwArACsASwBLAEsASwBLAEsASwBLAEsASwBcAFwADQANAA0AKgBQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAeACsAKwArACsASwBLAEsASwBLAEsASwBLAEsASwBQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAKwArAFAAKwArAFAAUABQAFAAUABQAFAAUAArAFAAUAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQAKwAEAAQAKwArAAQABAAEAAQAUAAEAFAABAAEAA0ADQANACsAKwArACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAArACsABAAEAAQABAAEAAQABABQAA4AUAAEACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAFAABAAEAAQABAAEAAQABAAEAAQABABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAFAABAAEAAQABAAOAB4ADQANAA0ADQAOAB4ABAArACsAKwArACsAKwArACsAUAAEAAQABAAEAAQABAAEAAQABAAEAAQAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAA0ADQANAFAADgAOAA4ADQANACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAEAAQABAAEACsABAAEAAQABAAEAAQABAAEAFAADQANAA0ADQANACsAKwArACsAKwArACsAKwArACsASwBLAEsASwBLAEsASwBLAEsASwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwAOABMAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAArAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQACsAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAArACsAKwAEACsABAAEACsABAAEAAQABAAEAAQABABQAAQAKwArACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsAUABQAFAAUABQAFAAKwBQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQAKwAEAAQAKwAEAAQABAAEAAQAUAArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAABAAEAAQABAAeAB4AKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAB4AHgAeAB4AHgAeAB4AHgAaABoAGgAaAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArACsAKwArACsAKwArACsAKwArACsAKwArAA0AUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsADQANAA0ADQANACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAASABIAEgAQwBDAEMAUABQAFAAUABDAFAAUABQAEgAQwBIAEMAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAASABDAEMAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwAJAAkACQAJAAkACQAJABYAEQArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABIAEMAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwANAA0AKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArAAQABAAEAAQABAANACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEAA0ADQANAB4AHgAeAB4AHgAeAFAAUABQAFAADQAeACsAKwArACsAKwArACsAKwArACsASwBLAEsASwBLAEsASwBLAEsASwArAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAANAA0AHgAeACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwAEAFAABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAKwArACsAKwArACsAKwAEAAQABAAEAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAARwBHABUARwAJACsAKwArACsAKwArACsAKwArACsAKwAEAAQAKwArACsAKwArACsAKwArACsAKwArACsAKwArAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXACsAKwArACsAKwArACsAKwBXAFcAVwBXAFcAVwBXAFcAVwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAUQBRAFEAKwArACsAKwArACsAKwArACsAKwArACsAKwBRAFEAUQBRACsAKwArACsAKwArACsAKwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUAArACsAHgAEAAQADQAEAAQABAAEACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArACsAKwArACsAKwArACsAKwArAB4AHgAeAB4AHgAeAB4AKwArAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAAQABAAEAAQABAAeAB4AHgAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAB4AHgAEAAQABAAEAAQABAAEAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4ABAAEAAQABAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4ABAAEAAQAHgArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwArACsAKwArACsAKwArACsAKwArAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArACsAKwArACsAKwArACsAKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwBQAFAAKwArAFAAKwArAFAAUAArACsAUABQAFAAUAArAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeACsAUAArAFAAUABQAFAAUABQAFAAKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwBQAFAAUABQACsAKwBQAFAAUABQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQACsAHgAeAFAAUABQAFAAUAArAFAAKwArACsAUABQAFAAUABQAFAAUAArAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAHgBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgBQAFAAUABQAFAAUABQAFAAUABQAFAAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAB4AHgAeAB4AHgAeAB4AHgAeACsAKwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAEsASwBLAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAeAB4AHgAeAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAeAB4AHgAeAB4AHgAeAB4ABAAeAB4AHgAeAB4AHgAeAB4AHgAeAAQAHgAeAA0ADQANAA0AHgArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwAEAAQABAAEAAQAKwAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAAQABAAEAAQABAAEAAQAKwAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAKwArAAQABAAEAAQABAAEAAQAKwAEAAQAKwAEAAQABAAEAAQAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwAEAAQABAAEAAQABAAEAFAAUABQAFAAUABQAFAAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwBQAB4AKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArABsAUABQAFAAUABQACsAKwBQAFAAUABQAFAAUABQAFAAUAAEAAQABAAEAAQABAAEACsAKwArACsAKwArACsAKwArAB4AHgAeAB4ABAAEAAQABAAEAAQABABQACsAKwArACsASwBLAEsASwBLAEsASwBLAEsASwArACsAKwArABYAFgArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAGgBQAFAAUAAaAFAAUABQAFAAKwArACsAKwArACsAKwArACsAKwArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAeAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQACsAKwBQAFAAUABQACsAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwBQAFAAKwBQACsAKwBQACsAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAKwBQACsAUAArACsAKwArACsAKwBQACsAKwArACsAUAArAFAAKwBQACsAUABQAFAAKwBQAFAAKwBQACsAKwBQACsAUAArAFAAKwBQACsAUAArAFAAUAArAFAAKwArAFAAUABQAFAAKwBQAFAAUABQAFAAUABQACsAUABQAFAAUAArAFAAUABQAFAAKwBQACsAUABQAFAAUABQAFAAUABQAFAAUAArAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAArACsAKwArACsAUABQAFAAKwBQAFAAUABQAFAAKwBQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwAeAB4AKwArACsAKwArACsAKwArACsAKwArACsAKwArAE8ATwBPAE8ATwBPAE8ATwBPAE8ATwBPAE8AJQAlACUAHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHgAeAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB4AHgAeACUAJQAlAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAdAB0AHQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQApACkAKQApACkAKQApACkAKQApACkAKQApACkAKQApACkAKQApACkAKQApACkAKQApACkAJQAlACUAJQAlACAAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAeAB4AJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlAB4AHgAlACUAJQAlACUAHgAlACUAJQAlACUAIAAgACAAJQAlACAAJQAlACAAIAAgACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACEAIQAhACEAIQAlACUAIAAgACUAJQAgACAAIAAgACAAIAAgACAAIAAgACAAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAJQAlACUAIAAlACUAJQAlACAAIAAgACUAIAAgACAAJQAlACUAJQAlACUAJQAgACUAIAAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAHgAlAB4AJQAeACUAJQAlACUAJQAgACUAJQAlACUAHgAlAB4AHgAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlAB4AHgAeAB4AHgAeAB4AJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAeAB4AHgAeAB4AHgAeAB4AHgAeACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACAAIAAlACUAJQAlACAAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACAAJQAlACUAJQAgACAAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAHgAeAB4AHgAeAB4AHgAeACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAeAB4AHgAeAB4AHgAlACUAJQAlACUAJQAlACAAIAAgACUAJQAlACAAIAAgACAAIAAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeABcAFwAXABUAFQAVAB4AHgAeAB4AJQAlACUAIAAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACAAIAAgACUAJQAlACUAJQAlACUAJQAlACAAJQAlACUAJQAlACUAJQAlACUAJQAlACAAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AJQAlACUAJQAlACUAJQAlACUAJQAlACUAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AJQAlACUAJQAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeACUAJQAlACUAJQAlACUAJQAeAB4AHgAeAB4AHgAeAB4AHgAeACUAJQAlACUAJQAlAB4AHgAeAB4AHgAeAB4AHgAlACUAJQAlACUAJQAlACUAHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAgACUAJQAgACUAJQAlACUAJQAlACUAJQAgACAAIAAgACAAIAAgACAAJQAlACUAJQAlACUAIAAlACUAJQAlACUAJQAlACUAJQAgACAAIAAgACAAIAAgACAAIAAgACUAJQAgACAAIAAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAgACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACAAIAAlACAAIAAlACAAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAgACAAIAAlACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAJQAlAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AKwAeAB4AHgAeAB4AHgAeAB4AHgAeAB4AHgArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAEsASwBLAEsASwBLAEsASwBLAEsAKwArACsAKwArACsAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAKwArAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXACUAJQBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwAlACUAJQAlACUAJQAlACUAJQAlACUAVwBXACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQBXAFcAVwBXAFcAVwBXAFcAVwBXAFcAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAJQAlACUAKwAEACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArACsAKwArAA==';

        var LETTER_NUMBER_MODIFIER = 50;
        // Non-tailorable Line Breaking Classes
        var BK = 1; //  Cause a line break (after)
        var CR$1 = 2; //  Cause a line break (after), except between CR and LF
        var LF$1 = 3; //  Cause a line break (after)
        var CM = 4; //  Prohibit a line break between the character and the preceding character
        var NL = 5; //  Cause a line break (after)
        var WJ = 7; //  Prohibit line breaks before and after
        var ZW = 8; //  Provide a break opportunity
        var GL = 9; //  Prohibit line breaks before and after
        var SP = 10; // Enable indirect line breaks
        var ZWJ$1 = 11; // Prohibit line breaks within joiner sequences
        // Break Opportunities
        var B2 = 12; //  Provide a line break opportunity before and after the character
        var BA = 13; //  Generally provide a line break opportunity after the character
        var BB = 14; //  Generally provide a line break opportunity before the character
        var HY = 15; //  Provide a line break opportunity after the character, except in numeric context
        var CB = 16; //   Provide a line break opportunity contingent on additional information
        // Characters Prohibiting Certain Breaks
        var CL = 17; //  Prohibit line breaks before
        var CP = 18; //  Prohibit line breaks before
        var EX = 19; //  Prohibit line breaks before
        var IN = 20; //  Allow only indirect line breaks between pairs
        var NS = 21; //  Allow only indirect line breaks before
        var OP = 22; //  Prohibit line breaks after
        var QU = 23; //  Act like they are both opening and closing
        // Numeric Context
        var IS = 24; //  Prevent breaks after any and before numeric
        var NU = 25; //  Form numeric expressions for line breaking purposes
        var PO = 26; //  Do not break following a numeric expression
        var PR = 27; //  Do not break in front of a numeric expression
        var SY = 28; //  Prevent a break before; and allow a break after
        // Other Characters
        var AI = 29; //  Act like AL when the resolvedEAW is N; otherwise; act as ID
        var AL = 30; //  Are alphabetic characters or symbols that are used with alphabetic characters
        var CJ = 31; //  Treat as NS or ID for strict or normal breaking.
        var EB = 32; //  Do not break from following Emoji Modifier
        var EM = 33; //  Do not break from preceding Emoji Base
        var H2 = 34; //  Form Korean syllable blocks
        var H3 = 35; //  Form Korean syllable blocks
        var HL = 36; //  Do not break around a following hyphen; otherwise act as Alphabetic
        var ID = 37; //  Break before or after; except in some numeric context
        var JL = 38; //  Form Korean syllable blocks
        var JV = 39; //  Form Korean syllable blocks
        var JT = 40; //  Form Korean syllable blocks
        var RI$1 = 41; //  Keep pairs together. For pairs; break before and after other classes
        var SA = 42; //  Provide a line break opportunity contingent on additional, language-specific context analysis
        var XX = 43; //  Have as yet unknown line breaking behavior or unassigned code positions
        var ea_OP = [0x2329, 0xff08];
        var BREAK_MANDATORY = '!';
        var BREAK_NOT_ALLOWED$1 = '×';
        var BREAK_ALLOWED$1 = '÷';
        var UnicodeTrie$1 = createTrieFromBase64$1(base64$1);
        var ALPHABETICS = [AL, HL];
        var HARD_LINE_BREAKS = [BK, CR$1, LF$1, NL];
        var SPACE$1 = [SP, ZW];
        var PREFIX_POSTFIX = [PR, PO];
        var LINE_BREAKS = HARD_LINE_BREAKS.concat(SPACE$1);
        var KOREAN_SYLLABLE_BLOCK = [JL, JV, JT, H2, H3];
        var HYPHEN = [HY, BA];
        var codePointsToCharacterClasses = function (codePoints, lineBreak) {
            if (lineBreak === void 0) { lineBreak = 'strict'; }
            var types = [];
            var indices = [];
            var categories = [];
            codePoints.forEach(function (codePoint, index) {
                var classType = UnicodeTrie$1.get(codePoint);
                if (classType > LETTER_NUMBER_MODIFIER) {
                    categories.push(true);
                    classType -= LETTER_NUMBER_MODIFIER;
                }
                else {
                    categories.push(false);
                }
                if (['normal', 'auto', 'loose'].indexOf(lineBreak) !== -1) {
                    // U+2010, – U+2013, 〜 U+301C, ゠ U+30A0
                    if ([0x2010, 0x2013, 0x301c, 0x30a0].indexOf(codePoint) !== -1) {
                        indices.push(index);
                        return types.push(CB);
                    }
                }
                if (classType === CM || classType === ZWJ$1) {
                    // LB10 Treat any remaining combining mark or ZWJ as AL.
                    if (index === 0) {
                        indices.push(index);
                        return types.push(AL);
                    }
                    // LB9 Do not break a combining character sequence; treat it as if it has the line breaking class of
                    // the base character in all of the following rules. Treat ZWJ as if it were CM.
                    var prev = types[index - 1];
                    if (LINE_BREAKS.indexOf(prev) === -1) {
                        indices.push(indices[index - 1]);
                        return types.push(prev);
                    }
                    indices.push(index);
                    return types.push(AL);
                }
                indices.push(index);
                if (classType === CJ) {
                    return types.push(lineBreak === 'strict' ? NS : ID);
                }
                if (classType === SA) {
                    return types.push(AL);
                }
                if (classType === AI) {
                    return types.push(AL);
                }
                // For supplementary characters, a useful default is to treat characters in the range 10000..1FFFD as AL
                // and characters in the ranges 20000..2FFFD and 30000..3FFFD as ID, until the implementation can be revised
                // to take into account the actual line breaking properties for these characters.
                if (classType === XX) {
                    if ((codePoint >= 0x20000 && codePoint <= 0x2fffd) || (codePoint >= 0x30000 && codePoint <= 0x3fffd)) {
                        return types.push(ID);
                    }
                    else {
                        return types.push(AL);
                    }
                }
                types.push(classType);
            });
            return [indices, types, categories];
        };
        var isAdjacentWithSpaceIgnored = function (a, b, currentIndex, classTypes) {
            var current = classTypes[currentIndex];
            if (Array.isArray(a) ? a.indexOf(current) !== -1 : a === current) {
                var i = currentIndex;
                while (i <= classTypes.length) {
                    i++;
                    var next = classTypes[i];
                    if (next === b) {
                        return true;
                    }
                    if (next !== SP) {
                        break;
                    }
                }
            }
            if (current === SP) {
                var i = currentIndex;
                while (i > 0) {
                    i--;
                    var prev = classTypes[i];
                    if (Array.isArray(a) ? a.indexOf(prev) !== -1 : a === prev) {
                        var n = currentIndex;
                        while (n <= classTypes.length) {
                            n++;
                            var next = classTypes[n];
                            if (next === b) {
                                return true;
                            }
                            if (next !== SP) {
                                break;
                            }
                        }
                    }
                    if (prev !== SP) {
                        break;
                    }
                }
            }
            return false;
        };
        var previousNonSpaceClassType = function (currentIndex, classTypes) {
            var i = currentIndex;
            while (i >= 0) {
                var type = classTypes[i];
                if (type === SP) {
                    i--;
                }
                else {
                    return type;
                }
            }
            return 0;
        };
        var _lineBreakAtIndex = function (codePoints, classTypes, indicies, index, forbiddenBreaks) {
            if (indicies[index] === 0) {
                return BREAK_NOT_ALLOWED$1;
            }
            var currentIndex = index - 1;
            if (Array.isArray(forbiddenBreaks) && forbiddenBreaks[currentIndex] === true) {
                return BREAK_NOT_ALLOWED$1;
            }
            var beforeIndex = currentIndex - 1;
            var afterIndex = currentIndex + 1;
            var current = classTypes[currentIndex];
            // LB4 Always break after hard line breaks.
            // LB5 Treat CR followed by LF, as well as CR, LF, and NL as hard line breaks.
            var before = beforeIndex >= 0 ? classTypes[beforeIndex] : 0;
            var next = classTypes[afterIndex];
            if (current === CR$1 && next === LF$1) {
                return BREAK_NOT_ALLOWED$1;
            }
            if (HARD_LINE_BREAKS.indexOf(current) !== -1) {
                return BREAK_MANDATORY;
            }
            // LB6 Do not break before hard line breaks.
            if (HARD_LINE_BREAKS.indexOf(next) !== -1) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB7 Do not break before spaces or zero width space.
            if (SPACE$1.indexOf(next) !== -1) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB8 Break before any character following a zero-width space, even if one or more spaces intervene.
            if (previousNonSpaceClassType(currentIndex, classTypes) === ZW) {
                return BREAK_ALLOWED$1;
            }
            // LB8a Do not break after a zero width joiner.
            if (UnicodeTrie$1.get(codePoints[currentIndex]) === ZWJ$1) {
                return BREAK_NOT_ALLOWED$1;
            }
            // zwj emojis
            if ((current === EB || current === EM) && UnicodeTrie$1.get(codePoints[afterIndex]) === ZWJ$1) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB11 Do not break before or after Word joiner and related characters.
            if (current === WJ || next === WJ) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB12 Do not break after NBSP and related characters.
            if (current === GL) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB12a Do not break before NBSP and related characters, except after spaces and hyphens.
            if ([SP, BA, HY].indexOf(current) === -1 && next === GL) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB13 Do not break before ‘]’ or ‘!’ or ‘;’ or ‘/’, even after spaces.
            if ([CL, CP, EX, IS, SY].indexOf(next) !== -1) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB14 Do not break after ‘[’, even after spaces.
            if (previousNonSpaceClassType(currentIndex, classTypes) === OP) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB15 Do not break within ‘”[’, even with intervening spaces.
            if (isAdjacentWithSpaceIgnored(QU, OP, currentIndex, classTypes)) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB16 Do not break between closing punctuation and a nonstarter (lb=NS), even with intervening spaces.
            if (isAdjacentWithSpaceIgnored([CL, CP], NS, currentIndex, classTypes)) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB17 Do not break within ‘——’, even with intervening spaces.
            if (isAdjacentWithSpaceIgnored(B2, B2, currentIndex, classTypes)) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB18 Break after spaces.
            if (current === SP) {
                return BREAK_ALLOWED$1;
            }
            // LB19 Do not break before or after quotation marks, such as ‘ ” ’.
            if (current === QU || next === QU) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB20 Break before and after unresolved CB.
            if (next === CB || current === CB) {
                return BREAK_ALLOWED$1;
            }
            // LB21 Do not break before hyphen-minus, other hyphens, fixed-width spaces, small kana, and other non-starters, or after acute accents.
            if ([BA, HY, NS].indexOf(next) !== -1 || current === BB) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB21a Don't break after Hebrew + Hyphen.
            if (before === HL && HYPHEN.indexOf(current) !== -1) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB21b Don’t break between Solidus and Hebrew letters.
            if (current === SY && next === HL) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB22 Do not break before ellipsis.
            if (next === IN) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB23 Do not break between digits and letters.
            if ((ALPHABETICS.indexOf(next) !== -1 && current === NU) || (ALPHABETICS.indexOf(current) !== -1 && next === NU)) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB23a Do not break between numeric prefixes and ideographs, or between ideographs and numeric postfixes.
            if ((current === PR && [ID, EB, EM].indexOf(next) !== -1) ||
                ([ID, EB, EM].indexOf(current) !== -1 && next === PO)) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB24 Do not break between numeric prefix/postfix and letters, or between letters and prefix/postfix.
            if ((ALPHABETICS.indexOf(current) !== -1 && PREFIX_POSTFIX.indexOf(next) !== -1) ||
                (PREFIX_POSTFIX.indexOf(current) !== -1 && ALPHABETICS.indexOf(next) !== -1)) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB25 Do not break between the following pairs of classes relevant to numbers:
            if (
            // (PR | PO) × ( OP | HY )? NU
            ([PR, PO].indexOf(current) !== -1 &&
                (next === NU || ([OP, HY].indexOf(next) !== -1 && classTypes[afterIndex + 1] === NU))) ||
                // ( OP | HY ) × NU
                ([OP, HY].indexOf(current) !== -1 && next === NU) ||
                // NU ×	(NU | SY | IS)
                (current === NU && [NU, SY, IS].indexOf(next) !== -1)) {
                return BREAK_NOT_ALLOWED$1;
            }
            // NU (NU | SY | IS)* × (NU | SY | IS | CL | CP)
            if ([NU, SY, IS, CL, CP].indexOf(next) !== -1) {
                var prevIndex = currentIndex;
                while (prevIndex >= 0) {
                    var type = classTypes[prevIndex];
                    if (type === NU) {
                        return BREAK_NOT_ALLOWED$1;
                    }
                    else if ([SY, IS].indexOf(type) !== -1) {
                        prevIndex--;
                    }
                    else {
                        break;
                    }
                }
            }
            // NU (NU | SY | IS)* (CL | CP)? × (PO | PR))
            if ([PR, PO].indexOf(next) !== -1) {
                var prevIndex = [CL, CP].indexOf(current) !== -1 ? beforeIndex : currentIndex;
                while (prevIndex >= 0) {
                    var type = classTypes[prevIndex];
                    if (type === NU) {
                        return BREAK_NOT_ALLOWED$1;
                    }
                    else if ([SY, IS].indexOf(type) !== -1) {
                        prevIndex--;
                    }
                    else {
                        break;
                    }
                }
            }
            // LB26 Do not break a Korean syllable.
            if ((JL === current && [JL, JV, H2, H3].indexOf(next) !== -1) ||
                ([JV, H2].indexOf(current) !== -1 && [JV, JT].indexOf(next) !== -1) ||
                ([JT, H3].indexOf(current) !== -1 && next === JT)) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB27 Treat a Korean Syllable Block the same as ID.
            if ((KOREAN_SYLLABLE_BLOCK.indexOf(current) !== -1 && [IN, PO].indexOf(next) !== -1) ||
                (KOREAN_SYLLABLE_BLOCK.indexOf(next) !== -1 && current === PR)) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB28 Do not break between alphabetics (“at”).
            if (ALPHABETICS.indexOf(current) !== -1 && ALPHABETICS.indexOf(next) !== -1) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB29 Do not break between numeric punctuation and alphabetics (“e.g.”).
            if (current === IS && ALPHABETICS.indexOf(next) !== -1) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB30 Do not break between letters, numbers, or ordinary symbols and opening or closing parentheses.
            if ((ALPHABETICS.concat(NU).indexOf(current) !== -1 &&
                next === OP &&
                ea_OP.indexOf(codePoints[afterIndex]) === -1) ||
                (ALPHABETICS.concat(NU).indexOf(next) !== -1 && current === CP)) {
                return BREAK_NOT_ALLOWED$1;
            }
            // LB30a Break between two regional indicator symbols if and only if there are an even number of regional
            // indicators preceding the position of the break.
            if (current === RI$1 && next === RI$1) {
                var i = indicies[currentIndex];
                var count = 1;
                while (i > 0) {
                    i--;
                    if (classTypes[i] === RI$1) {
                        count++;
                    }
                    else {
                        break;
                    }
                }
                if (count % 2 !== 0) {
                    return BREAK_NOT_ALLOWED$1;
                }
            }
            // LB30b Do not break between an emoji base and an emoji modifier.
            if (current === EB && next === EM) {
                return BREAK_NOT_ALLOWED$1;
            }
            return BREAK_ALLOWED$1;
        };
        var cssFormattedClasses = function (codePoints, options) {
            if (!options) {
                options = { lineBreak: 'normal', wordBreak: 'normal' };
            }
            var _a = codePointsToCharacterClasses(codePoints, options.lineBreak), indicies = _a[0], classTypes = _a[1], isLetterNumber = _a[2];
            if (options.wordBreak === 'break-all' || options.wordBreak === 'break-word') {
                classTypes = classTypes.map(function (type) { return ([NU, AL, SA].indexOf(type) !== -1 ? ID : type); });
            }
            var forbiddenBreakpoints = options.wordBreak === 'keep-all'
                ? isLetterNumber.map(function (letterNumber, i) {
                    return letterNumber && codePoints[i] >= 0x4e00 && codePoints[i] <= 0x9fff;
                })
                : undefined;
            return [indicies, classTypes, forbiddenBreakpoints];
        };
        var Break = /** @class */ (function () {
            function Break(codePoints, lineBreak, start, end) {
                this.codePoints = codePoints;
                this.required = lineBreak === BREAK_MANDATORY;
                this.start = start;
                this.end = end;
            }
            Break.prototype.slice = function () {
                return fromCodePoint$1.apply(void 0, this.codePoints.slice(this.start, this.end));
            };
            return Break;
        }());
        var LineBreaker = function (str, options) {
            var codePoints = toCodePoints$1(str);
            var _a = cssFormattedClasses(codePoints, options), indicies = _a[0], classTypes = _a[1], forbiddenBreakpoints = _a[2];
            var length = codePoints.length;
            var lastEnd = 0;
            var nextIndex = 0;
            return {
                next: function () {
                    if (nextIndex >= length) {
                        return { done: true, value: null };
                    }
                    var lineBreak = BREAK_NOT_ALLOWED$1;
                    while (nextIndex < length &&
                        (lineBreak = _lineBreakAtIndex(codePoints, classTypes, indicies, ++nextIndex, forbiddenBreakpoints)) ===
                            BREAK_NOT_ALLOWED$1) { }
                    if (lineBreak !== BREAK_NOT_ALLOWED$1 || nextIndex === length) {
                        var value = new Break(codePoints, lineBreak, lastEnd, nextIndex);
                        lastEnd = nextIndex;
                        return { value: value, done: false };
                    }
                    return { done: true, value: null };
                },
            };
        };

        // https://www.w3.org/TR/css-syntax-3
        var FLAG_UNRESTRICTED = 1 << 0;
        var FLAG_ID = 1 << 1;
        var FLAG_INTEGER = 1 << 2;
        var FLAG_NUMBER = 1 << 3;
        var LINE_FEED = 0x000a;
        var SOLIDUS = 0x002f;
        var REVERSE_SOLIDUS = 0x005c;
        var CHARACTER_TABULATION = 0x0009;
        var SPACE = 0x0020;
        var QUOTATION_MARK = 0x0022;
        var EQUALS_SIGN = 0x003d;
        var NUMBER_SIGN = 0x0023;
        var DOLLAR_SIGN = 0x0024;
        var PERCENTAGE_SIGN = 0x0025;
        var APOSTROPHE = 0x0027;
        var LEFT_PARENTHESIS = 0x0028;
        var RIGHT_PARENTHESIS = 0x0029;
        var LOW_LINE = 0x005f;
        var HYPHEN_MINUS = 0x002d;
        var EXCLAMATION_MARK = 0x0021;
        var LESS_THAN_SIGN = 0x003c;
        var GREATER_THAN_SIGN = 0x003e;
        var COMMERCIAL_AT = 0x0040;
        var LEFT_SQUARE_BRACKET = 0x005b;
        var RIGHT_SQUARE_BRACKET = 0x005d;
        var CIRCUMFLEX_ACCENT = 0x003d;
        var LEFT_CURLY_BRACKET = 0x007b;
        var QUESTION_MARK = 0x003f;
        var RIGHT_CURLY_BRACKET = 0x007d;
        var VERTICAL_LINE = 0x007c;
        var TILDE = 0x007e;
        var CONTROL = 0x0080;
        var REPLACEMENT_CHARACTER = 0xfffd;
        var ASTERISK = 0x002a;
        var PLUS_SIGN = 0x002b;
        var COMMA = 0x002c;
        var COLON = 0x003a;
        var SEMICOLON = 0x003b;
        var FULL_STOP = 0x002e;
        var NULL = 0x0000;
        var BACKSPACE = 0x0008;
        var LINE_TABULATION = 0x000b;
        var SHIFT_OUT = 0x000e;
        var INFORMATION_SEPARATOR_ONE = 0x001f;
        var DELETE = 0x007f;
        var EOF = -1;
        var ZERO = 0x0030;
        var a = 0x0061;
        var e = 0x0065;
        var f = 0x0066;
        var u = 0x0075;
        var z = 0x007a;
        var A = 0x0041;
        var E = 0x0045;
        var F = 0x0046;
        var U = 0x0055;
        var Z = 0x005a;
        var isDigit = function (codePoint) { return codePoint >= ZERO && codePoint <= 0x0039; };
        var isSurrogateCodePoint = function (codePoint) { return codePoint >= 0xd800 && codePoint <= 0xdfff; };
        var isHex = function (codePoint) {
            return isDigit(codePoint) || (codePoint >= A && codePoint <= F) || (codePoint >= a && codePoint <= f);
        };
        var isLowerCaseLetter = function (codePoint) { return codePoint >= a && codePoint <= z; };
        var isUpperCaseLetter = function (codePoint) { return codePoint >= A && codePoint <= Z; };
        var isLetter = function (codePoint) { return isLowerCaseLetter(codePoint) || isUpperCaseLetter(codePoint); };
        var isNonASCIICodePoint = function (codePoint) { return codePoint >= CONTROL; };
        var isWhiteSpace = function (codePoint) {
            return codePoint === LINE_FEED || codePoint === CHARACTER_TABULATION || codePoint === SPACE;
        };
        var isNameStartCodePoint = function (codePoint) {
            return isLetter(codePoint) || isNonASCIICodePoint(codePoint) || codePoint === LOW_LINE;
        };
        var isNameCodePoint = function (codePoint) {
            return isNameStartCodePoint(codePoint) || isDigit(codePoint) || codePoint === HYPHEN_MINUS;
        };
        var isNonPrintableCodePoint = function (codePoint) {
            return ((codePoint >= NULL && codePoint <= BACKSPACE) ||
                codePoint === LINE_TABULATION ||
                (codePoint >= SHIFT_OUT && codePoint <= INFORMATION_SEPARATOR_ONE) ||
                codePoint === DELETE);
        };
        var isValidEscape = function (c1, c2) {
            if (c1 !== REVERSE_SOLIDUS) {
                return false;
            }
            return c2 !== LINE_FEED;
        };
        var isIdentifierStart = function (c1, c2, c3) {
            if (c1 === HYPHEN_MINUS) {
                return isNameStartCodePoint(c2) || isValidEscape(c2, c3);
            }
            else if (isNameStartCodePoint(c1)) {
                return true;
            }
            else if (c1 === REVERSE_SOLIDUS && isValidEscape(c1, c2)) {
                return true;
            }
            return false;
        };
        var isNumberStart = function (c1, c2, c3) {
            if (c1 === PLUS_SIGN || c1 === HYPHEN_MINUS) {
                if (isDigit(c2)) {
                    return true;
                }
                return c2 === FULL_STOP && isDigit(c3);
            }
            if (c1 === FULL_STOP) {
                return isDigit(c2);
            }
            return isDigit(c1);
        };
        var stringToNumber = function (codePoints) {
            var c = 0;
            var sign = 1;
            if (codePoints[c] === PLUS_SIGN || codePoints[c] === HYPHEN_MINUS) {
                if (codePoints[c] === HYPHEN_MINUS) {
                    sign = -1;
                }
                c++;
            }
            var integers = [];
            while (isDigit(codePoints[c])) {
                integers.push(codePoints[c++]);
            }
            var int = integers.length ? parseInt(fromCodePoint$1.apply(void 0, integers), 10) : 0;
            if (codePoints[c] === FULL_STOP) {
                c++;
            }
            var fraction = [];
            while (isDigit(codePoints[c])) {
                fraction.push(codePoints[c++]);
            }
            var fracd = fraction.length;
            var frac = fracd ? parseInt(fromCodePoint$1.apply(void 0, fraction), 10) : 0;
            if (codePoints[c] === E || codePoints[c] === e) {
                c++;
            }
            var expsign = 1;
            if (codePoints[c] === PLUS_SIGN || codePoints[c] === HYPHEN_MINUS) {
                if (codePoints[c] === HYPHEN_MINUS) {
                    expsign = -1;
                }
                c++;
            }
            var exponent = [];
            while (isDigit(codePoints[c])) {
                exponent.push(codePoints[c++]);
            }
            var exp = exponent.length ? parseInt(fromCodePoint$1.apply(void 0, exponent), 10) : 0;
            return sign * (int + frac * Math.pow(10, -fracd)) * Math.pow(10, expsign * exp);
        };
        var LEFT_PARENTHESIS_TOKEN = {
            type: 2 /* LEFT_PARENTHESIS_TOKEN */
        };
        var RIGHT_PARENTHESIS_TOKEN = {
            type: 3 /* RIGHT_PARENTHESIS_TOKEN */
        };
        var COMMA_TOKEN = { type: 4 /* COMMA_TOKEN */ };
        var SUFFIX_MATCH_TOKEN = { type: 13 /* SUFFIX_MATCH_TOKEN */ };
        var PREFIX_MATCH_TOKEN = { type: 8 /* PREFIX_MATCH_TOKEN */ };
        var COLUMN_TOKEN = { type: 21 /* COLUMN_TOKEN */ };
        var DASH_MATCH_TOKEN = { type: 9 /* DASH_MATCH_TOKEN */ };
        var INCLUDE_MATCH_TOKEN = { type: 10 /* INCLUDE_MATCH_TOKEN */ };
        var LEFT_CURLY_BRACKET_TOKEN = {
            type: 11 /* LEFT_CURLY_BRACKET_TOKEN */
        };
        var RIGHT_CURLY_BRACKET_TOKEN = {
            type: 12 /* RIGHT_CURLY_BRACKET_TOKEN */
        };
        var SUBSTRING_MATCH_TOKEN = { type: 14 /* SUBSTRING_MATCH_TOKEN */ };
        var BAD_URL_TOKEN = { type: 23 /* BAD_URL_TOKEN */ };
        var BAD_STRING_TOKEN = { type: 1 /* BAD_STRING_TOKEN */ };
        var CDO_TOKEN = { type: 25 /* CDO_TOKEN */ };
        var CDC_TOKEN = { type: 24 /* CDC_TOKEN */ };
        var COLON_TOKEN = { type: 26 /* COLON_TOKEN */ };
        var SEMICOLON_TOKEN = { type: 27 /* SEMICOLON_TOKEN */ };
        var LEFT_SQUARE_BRACKET_TOKEN = {
            type: 28 /* LEFT_SQUARE_BRACKET_TOKEN */
        };
        var RIGHT_SQUARE_BRACKET_TOKEN = {
            type: 29 /* RIGHT_SQUARE_BRACKET_TOKEN */
        };
        var WHITESPACE_TOKEN = { type: 31 /* WHITESPACE_TOKEN */ };
        var EOF_TOKEN = { type: 32 /* EOF_TOKEN */ };
        var Tokenizer = /** @class */ (function () {
            function Tokenizer() {
                this._value = [];
            }
            Tokenizer.prototype.write = function (chunk) {
                this._value = this._value.concat(toCodePoints$1(chunk));
            };
            Tokenizer.prototype.read = function () {
                var tokens = [];
                var token = this.consumeToken();
                while (token !== EOF_TOKEN) {
                    tokens.push(token);
                    token = this.consumeToken();
                }
                return tokens;
            };
            Tokenizer.prototype.consumeToken = function () {
                var codePoint = this.consumeCodePoint();
                switch (codePoint) {
                    case QUOTATION_MARK:
                        return this.consumeStringToken(QUOTATION_MARK);
                    case NUMBER_SIGN:
                        var c1 = this.peekCodePoint(0);
                        var c2 = this.peekCodePoint(1);
                        var c3 = this.peekCodePoint(2);
                        if (isNameCodePoint(c1) || isValidEscape(c2, c3)) {
                            var flags = isIdentifierStart(c1, c2, c3) ? FLAG_ID : FLAG_UNRESTRICTED;
                            var value = this.consumeName();
                            return { type: 5 /* HASH_TOKEN */, value: value, flags: flags };
                        }
                        break;
                    case DOLLAR_SIGN:
                        if (this.peekCodePoint(0) === EQUALS_SIGN) {
                            this.consumeCodePoint();
                            return SUFFIX_MATCH_TOKEN;
                        }
                        break;
                    case APOSTROPHE:
                        return this.consumeStringToken(APOSTROPHE);
                    case LEFT_PARENTHESIS:
                        return LEFT_PARENTHESIS_TOKEN;
                    case RIGHT_PARENTHESIS:
                        return RIGHT_PARENTHESIS_TOKEN;
                    case ASTERISK:
                        if (this.peekCodePoint(0) === EQUALS_SIGN) {
                            this.consumeCodePoint();
                            return SUBSTRING_MATCH_TOKEN;
                        }
                        break;
                    case PLUS_SIGN:
                        if (isNumberStart(codePoint, this.peekCodePoint(0), this.peekCodePoint(1))) {
                            this.reconsumeCodePoint(codePoint);
                            return this.consumeNumericToken();
                        }
                        break;
                    case COMMA:
                        return COMMA_TOKEN;
                    case HYPHEN_MINUS:
                        var e1 = codePoint;
                        var e2 = this.peekCodePoint(0);
                        var e3 = this.peekCodePoint(1);
                        if (isNumberStart(e1, e2, e3)) {
                            this.reconsumeCodePoint(codePoint);
                            return this.consumeNumericToken();
                        }
                        if (isIdentifierStart(e1, e2, e3)) {
                            this.reconsumeCodePoint(codePoint);
                            return this.consumeIdentLikeToken();
                        }
                        if (e2 === HYPHEN_MINUS && e3 === GREATER_THAN_SIGN) {
                            this.consumeCodePoint();
                            this.consumeCodePoint();
                            return CDC_TOKEN;
                        }
                        break;
                    case FULL_STOP:
                        if (isNumberStart(codePoint, this.peekCodePoint(0), this.peekCodePoint(1))) {
                            this.reconsumeCodePoint(codePoint);
                            return this.consumeNumericToken();
                        }
                        break;
                    case SOLIDUS:
                        if (this.peekCodePoint(0) === ASTERISK) {
                            this.consumeCodePoint();
                            while (true) {
                                var c = this.consumeCodePoint();
                                if (c === ASTERISK) {
                                    c = this.consumeCodePoint();
                                    if (c === SOLIDUS) {
                                        return this.consumeToken();
                                    }
                                }
                                if (c === EOF) {
                                    return this.consumeToken();
                                }
                            }
                        }
                        break;
                    case COLON:
                        return COLON_TOKEN;
                    case SEMICOLON:
                        return SEMICOLON_TOKEN;
                    case LESS_THAN_SIGN:
                        if (this.peekCodePoint(0) === EXCLAMATION_MARK &&
                            this.peekCodePoint(1) === HYPHEN_MINUS &&
                            this.peekCodePoint(2) === HYPHEN_MINUS) {
                            this.consumeCodePoint();
                            this.consumeCodePoint();
                            return CDO_TOKEN;
                        }
                        break;
                    case COMMERCIAL_AT:
                        var a1 = this.peekCodePoint(0);
                        var a2 = this.peekCodePoint(1);
                        var a3 = this.peekCodePoint(2);
                        if (isIdentifierStart(a1, a2, a3)) {
                            var value = this.consumeName();
                            return { type: 7 /* AT_KEYWORD_TOKEN */, value: value };
                        }
                        break;
                    case LEFT_SQUARE_BRACKET:
                        return LEFT_SQUARE_BRACKET_TOKEN;
                    case REVERSE_SOLIDUS:
                        if (isValidEscape(codePoint, this.peekCodePoint(0))) {
                            this.reconsumeCodePoint(codePoint);
                            return this.consumeIdentLikeToken();
                        }
                        break;
                    case RIGHT_SQUARE_BRACKET:
                        return RIGHT_SQUARE_BRACKET_TOKEN;
                    case CIRCUMFLEX_ACCENT:
                        if (this.peekCodePoint(0) === EQUALS_SIGN) {
                            this.consumeCodePoint();
                            return PREFIX_MATCH_TOKEN;
                        }
                        break;
                    case LEFT_CURLY_BRACKET:
                        return LEFT_CURLY_BRACKET_TOKEN;
                    case RIGHT_CURLY_BRACKET:
                        return RIGHT_CURLY_BRACKET_TOKEN;
                    case u:
                    case U:
                        var u1 = this.peekCodePoint(0);
                        var u2 = this.peekCodePoint(1);
                        if (u1 === PLUS_SIGN && (isHex(u2) || u2 === QUESTION_MARK)) {
                            this.consumeCodePoint();
                            this.consumeUnicodeRangeToken();
                        }
                        this.reconsumeCodePoint(codePoint);
                        return this.consumeIdentLikeToken();
                    case VERTICAL_LINE:
                        if (this.peekCodePoint(0) === EQUALS_SIGN) {
                            this.consumeCodePoint();
                            return DASH_MATCH_TOKEN;
                        }
                        if (this.peekCodePoint(0) === VERTICAL_LINE) {
                            this.consumeCodePoint();
                            return COLUMN_TOKEN;
                        }
                        break;
                    case TILDE:
                        if (this.peekCodePoint(0) === EQUALS_SIGN) {
                            this.consumeCodePoint();
                            return INCLUDE_MATCH_TOKEN;
                        }
                        break;
                    case EOF:
                        return EOF_TOKEN;
                }
                if (isWhiteSpace(codePoint)) {
                    this.consumeWhiteSpace();
                    return WHITESPACE_TOKEN;
                }
                if (isDigit(codePoint)) {
                    this.reconsumeCodePoint(codePoint);
                    return this.consumeNumericToken();
                }
                if (isNameStartCodePoint(codePoint)) {
                    this.reconsumeCodePoint(codePoint);
                    return this.consumeIdentLikeToken();
                }
                return { type: 6 /* DELIM_TOKEN */, value: fromCodePoint$1(codePoint) };
            };
            Tokenizer.prototype.consumeCodePoint = function () {
                var value = this._value.shift();
                return typeof value === 'undefined' ? -1 : value;
            };
            Tokenizer.prototype.reconsumeCodePoint = function (codePoint) {
                this._value.unshift(codePoint);
            };
            Tokenizer.prototype.peekCodePoint = function (delta) {
                if (delta >= this._value.length) {
                    return -1;
                }
                return this._value[delta];
            };
            Tokenizer.prototype.consumeUnicodeRangeToken = function () {
                var digits = [];
                var codePoint = this.consumeCodePoint();
                while (isHex(codePoint) && digits.length < 6) {
                    digits.push(codePoint);
                    codePoint = this.consumeCodePoint();
                }
                var questionMarks = false;
                while (codePoint === QUESTION_MARK && digits.length < 6) {
                    digits.push(codePoint);
                    codePoint = this.consumeCodePoint();
                    questionMarks = true;
                }
                if (questionMarks) {
                    var start_1 = parseInt(fromCodePoint$1.apply(void 0, digits.map(function (digit) { return (digit === QUESTION_MARK ? ZERO : digit); })), 16);
                    var end = parseInt(fromCodePoint$1.apply(void 0, digits.map(function (digit) { return (digit === QUESTION_MARK ? F : digit); })), 16);
                    return { type: 30 /* UNICODE_RANGE_TOKEN */, start: start_1, end: end };
                }
                var start = parseInt(fromCodePoint$1.apply(void 0, digits), 16);
                if (this.peekCodePoint(0) === HYPHEN_MINUS && isHex(this.peekCodePoint(1))) {
                    this.consumeCodePoint();
                    codePoint = this.consumeCodePoint();
                    var endDigits = [];
                    while (isHex(codePoint) && endDigits.length < 6) {
                        endDigits.push(codePoint);
                        codePoint = this.consumeCodePoint();
                    }
                    var end = parseInt(fromCodePoint$1.apply(void 0, endDigits), 16);
                    return { type: 30 /* UNICODE_RANGE_TOKEN */, start: start, end: end };
                }
                else {
                    return { type: 30 /* UNICODE_RANGE_TOKEN */, start: start, end: start };
                }
            };
            Tokenizer.prototype.consumeIdentLikeToken = function () {
                var value = this.consumeName();
                if (value.toLowerCase() === 'url' && this.peekCodePoint(0) === LEFT_PARENTHESIS) {
                    this.consumeCodePoint();
                    return this.consumeUrlToken();
                }
                else if (this.peekCodePoint(0) === LEFT_PARENTHESIS) {
                    this.consumeCodePoint();
                    return { type: 19 /* FUNCTION_TOKEN */, value: value };
                }
                return { type: 20 /* IDENT_TOKEN */, value: value };
            };
            Tokenizer.prototype.consumeUrlToken = function () {
                var value = [];
                this.consumeWhiteSpace();
                if (this.peekCodePoint(0) === EOF) {
                    return { type: 22 /* URL_TOKEN */, value: '' };
                }
                var next = this.peekCodePoint(0);
                if (next === APOSTROPHE || next === QUOTATION_MARK) {
                    var stringToken = this.consumeStringToken(this.consumeCodePoint());
                    if (stringToken.type === 0 /* STRING_TOKEN */) {
                        this.consumeWhiteSpace();
                        if (this.peekCodePoint(0) === EOF || this.peekCodePoint(0) === RIGHT_PARENTHESIS) {
                            this.consumeCodePoint();
                            return { type: 22 /* URL_TOKEN */, value: stringToken.value };
                        }
                    }
                    this.consumeBadUrlRemnants();
                    return BAD_URL_TOKEN;
                }
                while (true) {
                    var codePoint = this.consumeCodePoint();
                    if (codePoint === EOF || codePoint === RIGHT_PARENTHESIS) {
                        return { type: 22 /* URL_TOKEN */, value: fromCodePoint$1.apply(void 0, value) };
                    }
                    else if (isWhiteSpace(codePoint)) {
                        this.consumeWhiteSpace();
                        if (this.peekCodePoint(0) === EOF || this.peekCodePoint(0) === RIGHT_PARENTHESIS) {
                            this.consumeCodePoint();
                            return { type: 22 /* URL_TOKEN */, value: fromCodePoint$1.apply(void 0, value) };
                        }
                        this.consumeBadUrlRemnants();
                        return BAD_URL_TOKEN;
                    }
                    else if (codePoint === QUOTATION_MARK ||
                        codePoint === APOSTROPHE ||
                        codePoint === LEFT_PARENTHESIS ||
                        isNonPrintableCodePoint(codePoint)) {
                        this.consumeBadUrlRemnants();
                        return BAD_URL_TOKEN;
                    }
                    else if (codePoint === REVERSE_SOLIDUS) {
                        if (isValidEscape(codePoint, this.peekCodePoint(0))) {
                            value.push(this.consumeEscapedCodePoint());
                        }
                        else {
                            this.consumeBadUrlRemnants();
                            return BAD_URL_TOKEN;
                        }
                    }
                    else {
                        value.push(codePoint);
                    }
                }
            };
            Tokenizer.prototype.consumeWhiteSpace = function () {
                while (isWhiteSpace(this.peekCodePoint(0))) {
                    this.consumeCodePoint();
                }
            };
            Tokenizer.prototype.consumeBadUrlRemnants = function () {
                while (true) {
                    var codePoint = this.consumeCodePoint();
                    if (codePoint === RIGHT_PARENTHESIS || codePoint === EOF) {
                        return;
                    }
                    if (isValidEscape(codePoint, this.peekCodePoint(0))) {
                        this.consumeEscapedCodePoint();
                    }
                }
            };
            Tokenizer.prototype.consumeStringSlice = function (count) {
                var SLICE_STACK_SIZE = 50000;
                var value = '';
                while (count > 0) {
                    var amount = Math.min(SLICE_STACK_SIZE, count);
                    value += fromCodePoint$1.apply(void 0, this._value.splice(0, amount));
                    count -= amount;
                }
                this._value.shift();
                return value;
            };
            Tokenizer.prototype.consumeStringToken = function (endingCodePoint) {
                var value = '';
                var i = 0;
                do {
                    var codePoint = this._value[i];
                    if (codePoint === EOF || codePoint === undefined || codePoint === endingCodePoint) {
                        value += this.consumeStringSlice(i);
                        return { type: 0 /* STRING_TOKEN */, value: value };
                    }
                    if (codePoint === LINE_FEED) {
                        this._value.splice(0, i);
                        return BAD_STRING_TOKEN;
                    }
                    if (codePoint === REVERSE_SOLIDUS) {
                        var next = this._value[i + 1];
                        if (next !== EOF && next !== undefined) {
                            if (next === LINE_FEED) {
                                value += this.consumeStringSlice(i);
                                i = -1;
                                this._value.shift();
                            }
                            else if (isValidEscape(codePoint, next)) {
                                value += this.consumeStringSlice(i);
                                value += fromCodePoint$1(this.consumeEscapedCodePoint());
                                i = -1;
                            }
                        }
                    }
                    i++;
                } while (true);
            };
            Tokenizer.prototype.consumeNumber = function () {
                var repr = [];
                var type = FLAG_INTEGER;
                var c1 = this.peekCodePoint(0);
                if (c1 === PLUS_SIGN || c1 === HYPHEN_MINUS) {
                    repr.push(this.consumeCodePoint());
                }
                while (isDigit(this.peekCodePoint(0))) {
                    repr.push(this.consumeCodePoint());
                }
                c1 = this.peekCodePoint(0);
                var c2 = this.peekCodePoint(1);
                if (c1 === FULL_STOP && isDigit(c2)) {
                    repr.push(this.consumeCodePoint(), this.consumeCodePoint());
                    type = FLAG_NUMBER;
                    while (isDigit(this.peekCodePoint(0))) {
                        repr.push(this.consumeCodePoint());
                    }
                }
                c1 = this.peekCodePoint(0);
                c2 = this.peekCodePoint(1);
                var c3 = this.peekCodePoint(2);
                if ((c1 === E || c1 === e) && (((c2 === PLUS_SIGN || c2 === HYPHEN_MINUS) && isDigit(c3)) || isDigit(c2))) {
                    repr.push(this.consumeCodePoint(), this.consumeCodePoint());
                    type = FLAG_NUMBER;
                    while (isDigit(this.peekCodePoint(0))) {
                        repr.push(this.consumeCodePoint());
                    }
                }
                return [stringToNumber(repr), type];
            };
            Tokenizer.prototype.consumeNumericToken = function () {
                var _a = this.consumeNumber(), number = _a[0], flags = _a[1];
                var c1 = this.peekCodePoint(0);
                var c2 = this.peekCodePoint(1);
                var c3 = this.peekCodePoint(2);
                if (isIdentifierStart(c1, c2, c3)) {
                    var unit = this.consumeName();
                    return { type: 15 /* DIMENSION_TOKEN */, number: number, flags: flags, unit: unit };
                }
                if (c1 === PERCENTAGE_SIGN) {
                    this.consumeCodePoint();
                    return { type: 16 /* PERCENTAGE_TOKEN */, number: number, flags: flags };
                }
                return { type: 17 /* NUMBER_TOKEN */, number: number, flags: flags };
            };
            Tokenizer.prototype.consumeEscapedCodePoint = function () {
                var codePoint = this.consumeCodePoint();
                if (isHex(codePoint)) {
                    var hex = fromCodePoint$1(codePoint);
                    while (isHex(this.peekCodePoint(0)) && hex.length < 6) {
                        hex += fromCodePoint$1(this.consumeCodePoint());
                    }
                    if (isWhiteSpace(this.peekCodePoint(0))) {
                        this.consumeCodePoint();
                    }
                    var hexCodePoint = parseInt(hex, 16);
                    if (hexCodePoint === 0 || isSurrogateCodePoint(hexCodePoint) || hexCodePoint > 0x10ffff) {
                        return REPLACEMENT_CHARACTER;
                    }
                    return hexCodePoint;
                }
                if (codePoint === EOF) {
                    return REPLACEMENT_CHARACTER;
                }
                return codePoint;
            };
            Tokenizer.prototype.consumeName = function () {
                var result = '';
                while (true) {
                    var codePoint = this.consumeCodePoint();
                    if (isNameCodePoint(codePoint)) {
                        result += fromCodePoint$1(codePoint);
                    }
                    else if (isValidEscape(codePoint, this.peekCodePoint(0))) {
                        result += fromCodePoint$1(this.consumeEscapedCodePoint());
                    }
                    else {
                        this.reconsumeCodePoint(codePoint);
                        return result;
                    }
                }
            };
            return Tokenizer;
        }());

        var Parser = /** @class */ (function () {
            function Parser(tokens) {
                this._tokens = tokens;
            }
            Parser.create = function (value) {
                var tokenizer = new Tokenizer();
                tokenizer.write(value);
                return new Parser(tokenizer.read());
            };
            Parser.parseValue = function (value) {
                return Parser.create(value).parseComponentValue();
            };
            Parser.parseValues = function (value) {
                return Parser.create(value).parseComponentValues();
            };
            Parser.prototype.parseComponentValue = function () {
                var token = this.consumeToken();
                while (token.type === 31 /* WHITESPACE_TOKEN */) {
                    token = this.consumeToken();
                }
                if (token.type === 32 /* EOF_TOKEN */) {
                    throw new SyntaxError("Error parsing CSS component value, unexpected EOF");
                }
                this.reconsumeToken(token);
                var value = this.consumeComponentValue();
                do {
                    token = this.consumeToken();
                } while (token.type === 31 /* WHITESPACE_TOKEN */);
                if (token.type === 32 /* EOF_TOKEN */) {
                    return value;
                }
                throw new SyntaxError("Error parsing CSS component value, multiple values found when expecting only one");
            };
            Parser.prototype.parseComponentValues = function () {
                var values = [];
                while (true) {
                    var value = this.consumeComponentValue();
                    if (value.type === 32 /* EOF_TOKEN */) {
                        return values;
                    }
                    values.push(value);
                    values.push();
                }
            };
            Parser.prototype.consumeComponentValue = function () {
                var token = this.consumeToken();
                switch (token.type) {
                    case 11 /* LEFT_CURLY_BRACKET_TOKEN */:
                    case 28 /* LEFT_SQUARE_BRACKET_TOKEN */:
                    case 2 /* LEFT_PARENTHESIS_TOKEN */:
                        return this.consumeSimpleBlock(token.type);
                    case 19 /* FUNCTION_TOKEN */:
                        return this.consumeFunction(token);
                }
                return token;
            };
            Parser.prototype.consumeSimpleBlock = function (type) {
                var block = { type: type, values: [] };
                var token = this.consumeToken();
                while (true) {
                    if (token.type === 32 /* EOF_TOKEN */ || isEndingTokenFor(token, type)) {
                        return block;
                    }
                    this.reconsumeToken(token);
                    block.values.push(this.consumeComponentValue());
                    token = this.consumeToken();
                }
            };
            Parser.prototype.consumeFunction = function (functionToken) {
                var cssFunction = {
                    name: functionToken.value,
                    values: [],
                    type: 18 /* FUNCTION */
                };
                while (true) {
                    var token = this.consumeToken();
                    if (token.type === 32 /* EOF_TOKEN */ || token.type === 3 /* RIGHT_PARENTHESIS_TOKEN */) {
                        return cssFunction;
                    }
                    this.reconsumeToken(token);
                    cssFunction.values.push(this.consumeComponentValue());
                }
            };
            Parser.prototype.consumeToken = function () {
                var token = this._tokens.shift();
                return typeof token === 'undefined' ? EOF_TOKEN : token;
            };
            Parser.prototype.reconsumeToken = function (token) {
                this._tokens.unshift(token);
            };
            return Parser;
        }());
        var isDimensionToken = function (token) { return token.type === 15 /* DIMENSION_TOKEN */; };
        var isNumberToken = function (token) { return token.type === 17 /* NUMBER_TOKEN */; };
        var isIdentToken = function (token) { return token.type === 20 /* IDENT_TOKEN */; };
        var isStringToken = function (token) { return token.type === 0 /* STRING_TOKEN */; };
        var isIdentWithValue = function (token, value) {
            return isIdentToken(token) && token.value === value;
        };
        var nonWhiteSpace = function (token) { return token.type !== 31 /* WHITESPACE_TOKEN */; };
        var nonFunctionArgSeparator = function (token) {
            return token.type !== 31 /* WHITESPACE_TOKEN */ && token.type !== 4 /* COMMA_TOKEN */;
        };
        var parseFunctionArgs = function (tokens) {
            var args = [];
            var arg = [];
            tokens.forEach(function (token) {
                if (token.type === 4 /* COMMA_TOKEN */) {
                    if (arg.length === 0) {
                        throw new Error("Error parsing function args, zero tokens for arg");
                    }
                    args.push(arg);
                    arg = [];
                    return;
                }
                if (token.type !== 31 /* WHITESPACE_TOKEN */) {
                    arg.push(token);
                }
            });
            if (arg.length) {
                args.push(arg);
            }
            return args;
        };
        var isEndingTokenFor = function (token, type) {
            if (type === 11 /* LEFT_CURLY_BRACKET_TOKEN */ && token.type === 12 /* RIGHT_CURLY_BRACKET_TOKEN */) {
                return true;
            }
            if (type === 28 /* LEFT_SQUARE_BRACKET_TOKEN */ && token.type === 29 /* RIGHT_SQUARE_BRACKET_TOKEN */) {
                return true;
            }
            return type === 2 /* LEFT_PARENTHESIS_TOKEN */ && token.type === 3 /* RIGHT_PARENTHESIS_TOKEN */;
        };

        var isLength = function (token) {
            return token.type === 17 /* NUMBER_TOKEN */ || token.type === 15 /* DIMENSION_TOKEN */;
        };

        var isLengthPercentage = function (token) {
            return token.type === 16 /* PERCENTAGE_TOKEN */ || isLength(token);
        };
        var parseLengthPercentageTuple = function (tokens) {
            return tokens.length > 1 ? [tokens[0], tokens[1]] : [tokens[0]];
        };
        var ZERO_LENGTH = {
            type: 17 /* NUMBER_TOKEN */,
            number: 0,
            flags: FLAG_INTEGER
        };
        var FIFTY_PERCENT = {
            type: 16 /* PERCENTAGE_TOKEN */,
            number: 50,
            flags: FLAG_INTEGER
        };
        var HUNDRED_PERCENT = {
            type: 16 /* PERCENTAGE_TOKEN */,
            number: 100,
            flags: FLAG_INTEGER
        };
        var getAbsoluteValueForTuple = function (tuple, width, height) {
            var x = tuple[0], y = tuple[1];
            return [getAbsoluteValue(x, width), getAbsoluteValue(typeof y !== 'undefined' ? y : x, height)];
        };
        var getAbsoluteValue = function (token, parent) {
            if (token.type === 16 /* PERCENTAGE_TOKEN */) {
                return (token.number / 100) * parent;
            }
            if (isDimensionToken(token)) {
                switch (token.unit) {
                    case 'rem':
                    case 'em':
                        return 16 * token.number; // TODO use correct font-size
                    case 'px':
                    default:
                        return token.number;
                }
            }
            return token.number;
        };

        var DEG = 'deg';
        var GRAD = 'grad';
        var RAD = 'rad';
        var TURN = 'turn';
        var angle = {
            name: 'angle',
            parse: function (_context, value) {
                if (value.type === 15 /* DIMENSION_TOKEN */) {
                    switch (value.unit) {
                        case DEG:
                            return (Math.PI * value.number) / 180;
                        case GRAD:
                            return (Math.PI / 200) * value.number;
                        case RAD:
                            return value.number;
                        case TURN:
                            return Math.PI * 2 * value.number;
                    }
                }
                throw new Error("Unsupported angle type");
            }
        };
        var isAngle = function (value) {
            if (value.type === 15 /* DIMENSION_TOKEN */) {
                if (value.unit === DEG || value.unit === GRAD || value.unit === RAD || value.unit === TURN) {
                    return true;
                }
            }
            return false;
        };
        var parseNamedSide = function (tokens) {
            var sideOrCorner = tokens
                .filter(isIdentToken)
                .map(function (ident) { return ident.value; })
                .join(' ');
            switch (sideOrCorner) {
                case 'to bottom right':
                case 'to right bottom':
                case 'left top':
                case 'top left':
                    return [ZERO_LENGTH, ZERO_LENGTH];
                case 'to top':
                case 'bottom':
                    return deg(0);
                case 'to bottom left':
                case 'to left bottom':
                case 'right top':
                case 'top right':
                    return [ZERO_LENGTH, HUNDRED_PERCENT];
                case 'to right':
                case 'left':
                    return deg(90);
                case 'to top left':
                case 'to left top':
                case 'right bottom':
                case 'bottom right':
                    return [HUNDRED_PERCENT, HUNDRED_PERCENT];
                case 'to bottom':
                case 'top':
                    return deg(180);
                case 'to top right':
                case 'to right top':
                case 'left bottom':
                case 'bottom left':
                    return [HUNDRED_PERCENT, ZERO_LENGTH];
                case 'to left':
                case 'right':
                    return deg(270);
            }
            return 0;
        };
        var deg = function (deg) { return (Math.PI * deg) / 180; };

        var color$1 = {
            name: 'color',
            parse: function (context, value) {
                if (value.type === 18 /* FUNCTION */) {
                    var colorFunction = SUPPORTED_COLOR_FUNCTIONS[value.name];
                    if (typeof colorFunction === 'undefined') {
                        throw new Error("Attempting to parse an unsupported color function \"" + value.name + "\"");
                    }
                    return colorFunction(context, value.values);
                }
                if (value.type === 5 /* HASH_TOKEN */) {
                    if (value.value.length === 3) {
                        var r = value.value.substring(0, 1);
                        var g = value.value.substring(1, 2);
                        var b = value.value.substring(2, 3);
                        return pack(parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16), 1);
                    }
                    if (value.value.length === 4) {
                        var r = value.value.substring(0, 1);
                        var g = value.value.substring(1, 2);
                        var b = value.value.substring(2, 3);
                        var a = value.value.substring(3, 4);
                        return pack(parseInt(r + r, 16), parseInt(g + g, 16), parseInt(b + b, 16), parseInt(a + a, 16) / 255);
                    }
                    if (value.value.length === 6) {
                        var r = value.value.substring(0, 2);
                        var g = value.value.substring(2, 4);
                        var b = value.value.substring(4, 6);
                        return pack(parseInt(r, 16), parseInt(g, 16), parseInt(b, 16), 1);
                    }
                    if (value.value.length === 8) {
                        var r = value.value.substring(0, 2);
                        var g = value.value.substring(2, 4);
                        var b = value.value.substring(4, 6);
                        var a = value.value.substring(6, 8);
                        return pack(parseInt(r, 16), parseInt(g, 16), parseInt(b, 16), parseInt(a, 16) / 255);
                    }
                }
                if (value.type === 20 /* IDENT_TOKEN */) {
                    var namedColor = COLORS[value.value.toUpperCase()];
                    if (typeof namedColor !== 'undefined') {
                        return namedColor;
                    }
                }
                return COLORS.TRANSPARENT;
            }
        };
        var isTransparent = function (color) { return (0xff & color) === 0; };
        var asString = function (color) {
            var alpha = 0xff & color;
            var blue = 0xff & (color >> 8);
            var green = 0xff & (color >> 16);
            var red = 0xff & (color >> 24);
            return alpha < 255 ? "rgba(" + red + "," + green + "," + blue + "," + alpha / 255 + ")" : "rgb(" + red + "," + green + "," + blue + ")";
        };
        var pack = function (r, g, b, a) {
            return ((r << 24) | (g << 16) | (b << 8) | (Math.round(a * 255) << 0)) >>> 0;
        };
        var getTokenColorValue = function (token, i) {
            if (token.type === 17 /* NUMBER_TOKEN */) {
                return token.number;
            }
            if (token.type === 16 /* PERCENTAGE_TOKEN */) {
                var max = i === 3 ? 1 : 255;
                return i === 3 ? (token.number / 100) * max : Math.round((token.number / 100) * max);
            }
            return 0;
        };
        var rgb = function (_context, args) {
            var tokens = args.filter(nonFunctionArgSeparator);
            if (tokens.length === 3) {
                var _a = tokens.map(getTokenColorValue), r = _a[0], g = _a[1], b = _a[2];
                return pack(r, g, b, 1);
            }
            if (tokens.length === 4) {
                var _b = tokens.map(getTokenColorValue), r = _b[0], g = _b[1], b = _b[2], a = _b[3];
                return pack(r, g, b, a);
            }
            return 0;
        };
        function hue2rgb(t1, t2, hue) {
            if (hue < 0) {
                hue += 1;
            }
            if (hue >= 1) {
                hue -= 1;
            }
            if (hue < 1 / 6) {
                return (t2 - t1) * hue * 6 + t1;
            }
            else if (hue < 1 / 2) {
                return t2;
            }
            else if (hue < 2 / 3) {
                return (t2 - t1) * 6 * (2 / 3 - hue) + t1;
            }
            else {
                return t1;
            }
        }
        var hsl = function (context, args) {
            var tokens = args.filter(nonFunctionArgSeparator);
            var hue = tokens[0], saturation = tokens[1], lightness = tokens[2], alpha = tokens[3];
            var h = (hue.type === 17 /* NUMBER_TOKEN */ ? deg(hue.number) : angle.parse(context, hue)) / (Math.PI * 2);
            var s = isLengthPercentage(saturation) ? saturation.number / 100 : 0;
            var l = isLengthPercentage(lightness) ? lightness.number / 100 : 0;
            var a = typeof alpha !== 'undefined' && isLengthPercentage(alpha) ? getAbsoluteValue(alpha, 1) : 1;
            if (s === 0) {
                return pack(l * 255, l * 255, l * 255, 1);
            }
            var t2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
            var t1 = l * 2 - t2;
            var r = hue2rgb(t1, t2, h + 1 / 3);
            var g = hue2rgb(t1, t2, h);
            var b = hue2rgb(t1, t2, h - 1 / 3);
            return pack(r * 255, g * 255, b * 255, a);
        };
        var SUPPORTED_COLOR_FUNCTIONS = {
            hsl: hsl,
            hsla: hsl,
            rgb: rgb,
            rgba: rgb
        };
        var parseColor = function (context, value) {
            return color$1.parse(context, Parser.create(value).parseComponentValue());
        };
        var COLORS = {
            ALICEBLUE: 0xf0f8ffff,
            ANTIQUEWHITE: 0xfaebd7ff,
            AQUA: 0x00ffffff,
            AQUAMARINE: 0x7fffd4ff,
            AZURE: 0xf0ffffff,
            BEIGE: 0xf5f5dcff,
            BISQUE: 0xffe4c4ff,
            BLACK: 0x000000ff,
            BLANCHEDALMOND: 0xffebcdff,
            BLUE: 0x0000ffff,
            BLUEVIOLET: 0x8a2be2ff,
            BROWN: 0xa52a2aff,
            BURLYWOOD: 0xdeb887ff,
            CADETBLUE: 0x5f9ea0ff,
            CHARTREUSE: 0x7fff00ff,
            CHOCOLATE: 0xd2691eff,
            CORAL: 0xff7f50ff,
            CORNFLOWERBLUE: 0x6495edff,
            CORNSILK: 0xfff8dcff,
            CRIMSON: 0xdc143cff,
            CYAN: 0x00ffffff,
            DARKBLUE: 0x00008bff,
            DARKCYAN: 0x008b8bff,
            DARKGOLDENROD: 0xb886bbff,
            DARKGRAY: 0xa9a9a9ff,
            DARKGREEN: 0x006400ff,
            DARKGREY: 0xa9a9a9ff,
            DARKKHAKI: 0xbdb76bff,
            DARKMAGENTA: 0x8b008bff,
            DARKOLIVEGREEN: 0x556b2fff,
            DARKORANGE: 0xff8c00ff,
            DARKORCHID: 0x9932ccff,
            DARKRED: 0x8b0000ff,
            DARKSALMON: 0xe9967aff,
            DARKSEAGREEN: 0x8fbc8fff,
            DARKSLATEBLUE: 0x483d8bff,
            DARKSLATEGRAY: 0x2f4f4fff,
            DARKSLATEGREY: 0x2f4f4fff,
            DARKTURQUOISE: 0x00ced1ff,
            DARKVIOLET: 0x9400d3ff,
            DEEPPINK: 0xff1493ff,
            DEEPSKYBLUE: 0x00bfffff,
            DIMGRAY: 0x696969ff,
            DIMGREY: 0x696969ff,
            DODGERBLUE: 0x1e90ffff,
            FIREBRICK: 0xb22222ff,
            FLORALWHITE: 0xfffaf0ff,
            FORESTGREEN: 0x228b22ff,
            FUCHSIA: 0xff00ffff,
            GAINSBORO: 0xdcdcdcff,
            GHOSTWHITE: 0xf8f8ffff,
            GOLD: 0xffd700ff,
            GOLDENROD: 0xdaa520ff,
            GRAY: 0x808080ff,
            GREEN: 0x008000ff,
            GREENYELLOW: 0xadff2fff,
            GREY: 0x808080ff,
            HONEYDEW: 0xf0fff0ff,
            HOTPINK: 0xff69b4ff,
            INDIANRED: 0xcd5c5cff,
            INDIGO: 0x4b0082ff,
            IVORY: 0xfffff0ff,
            KHAKI: 0xf0e68cff,
            LAVENDER: 0xe6e6faff,
            LAVENDERBLUSH: 0xfff0f5ff,
            LAWNGREEN: 0x7cfc00ff,
            LEMONCHIFFON: 0xfffacdff,
            LIGHTBLUE: 0xadd8e6ff,
            LIGHTCORAL: 0xf08080ff,
            LIGHTCYAN: 0xe0ffffff,
            LIGHTGOLDENRODYELLOW: 0xfafad2ff,
            LIGHTGRAY: 0xd3d3d3ff,
            LIGHTGREEN: 0x90ee90ff,
            LIGHTGREY: 0xd3d3d3ff,
            LIGHTPINK: 0xffb6c1ff,
            LIGHTSALMON: 0xffa07aff,
            LIGHTSEAGREEN: 0x20b2aaff,
            LIGHTSKYBLUE: 0x87cefaff,
            LIGHTSLATEGRAY: 0x778899ff,
            LIGHTSLATEGREY: 0x778899ff,
            LIGHTSTEELBLUE: 0xb0c4deff,
            LIGHTYELLOW: 0xffffe0ff,
            LIME: 0x00ff00ff,
            LIMEGREEN: 0x32cd32ff,
            LINEN: 0xfaf0e6ff,
            MAGENTA: 0xff00ffff,
            MAROON: 0x800000ff,
            MEDIUMAQUAMARINE: 0x66cdaaff,
            MEDIUMBLUE: 0x0000cdff,
            MEDIUMORCHID: 0xba55d3ff,
            MEDIUMPURPLE: 0x9370dbff,
            MEDIUMSEAGREEN: 0x3cb371ff,
            MEDIUMSLATEBLUE: 0x7b68eeff,
            MEDIUMSPRINGGREEN: 0x00fa9aff,
            MEDIUMTURQUOISE: 0x48d1ccff,
            MEDIUMVIOLETRED: 0xc71585ff,
            MIDNIGHTBLUE: 0x191970ff,
            MINTCREAM: 0xf5fffaff,
            MISTYROSE: 0xffe4e1ff,
            MOCCASIN: 0xffe4b5ff,
            NAVAJOWHITE: 0xffdeadff,
            NAVY: 0x000080ff,
            OLDLACE: 0xfdf5e6ff,
            OLIVE: 0x808000ff,
            OLIVEDRAB: 0x6b8e23ff,
            ORANGE: 0xffa500ff,
            ORANGERED: 0xff4500ff,
            ORCHID: 0xda70d6ff,
            PALEGOLDENROD: 0xeee8aaff,
            PALEGREEN: 0x98fb98ff,
            PALETURQUOISE: 0xafeeeeff,
            PALEVIOLETRED: 0xdb7093ff,
            PAPAYAWHIP: 0xffefd5ff,
            PEACHPUFF: 0xffdab9ff,
            PERU: 0xcd853fff,
            PINK: 0xffc0cbff,
            PLUM: 0xdda0ddff,
            POWDERBLUE: 0xb0e0e6ff,
            PURPLE: 0x800080ff,
            REBECCAPURPLE: 0x663399ff,
            RED: 0xff0000ff,
            ROSYBROWN: 0xbc8f8fff,
            ROYALBLUE: 0x4169e1ff,
            SADDLEBROWN: 0x8b4513ff,
            SALMON: 0xfa8072ff,
            SANDYBROWN: 0xf4a460ff,
            SEAGREEN: 0x2e8b57ff,
            SEASHELL: 0xfff5eeff,
            SIENNA: 0xa0522dff,
            SILVER: 0xc0c0c0ff,
            SKYBLUE: 0x87ceebff,
            SLATEBLUE: 0x6a5acdff,
            SLATEGRAY: 0x708090ff,
            SLATEGREY: 0x708090ff,
            SNOW: 0xfffafaff,
            SPRINGGREEN: 0x00ff7fff,
            STEELBLUE: 0x4682b4ff,
            TAN: 0xd2b48cff,
            TEAL: 0x008080ff,
            THISTLE: 0xd8bfd8ff,
            TOMATO: 0xff6347ff,
            TRANSPARENT: 0x00000000,
            TURQUOISE: 0x40e0d0ff,
            VIOLET: 0xee82eeff,
            WHEAT: 0xf5deb3ff,
            WHITE: 0xffffffff,
            WHITESMOKE: 0xf5f5f5ff,
            YELLOW: 0xffff00ff,
            YELLOWGREEN: 0x9acd32ff
        };

        var backgroundClip = {
            name: 'background-clip',
            initialValue: 'border-box',
            prefix: false,
            type: 1 /* LIST */,
            parse: function (_context, tokens) {
                return tokens.map(function (token) {
                    if (isIdentToken(token)) {
                        switch (token.value) {
                            case 'padding-box':
                                return 1 /* PADDING_BOX */;
                            case 'content-box':
                                return 2 /* CONTENT_BOX */;
                        }
                    }
                    return 0 /* BORDER_BOX */;
                });
            }
        };

        var backgroundColor = {
            name: "background-color",
            initialValue: 'transparent',
            prefix: false,
            type: 3 /* TYPE_VALUE */,
            format: 'color'
        };

        var parseColorStop = function (context, args) {
            var color = color$1.parse(context, args[0]);
            var stop = args[1];
            return stop && isLengthPercentage(stop) ? { color: color, stop: stop } : { color: color, stop: null };
        };
        var processColorStops = function (stops, lineLength) {
            var first = stops[0];
            var last = stops[stops.length - 1];
            if (first.stop === null) {
                first.stop = ZERO_LENGTH;
            }
            if (last.stop === null) {
                last.stop = HUNDRED_PERCENT;
            }
            var processStops = [];
            var previous = 0;
            for (var i = 0; i < stops.length; i++) {
                var stop_1 = stops[i].stop;
                if (stop_1 !== null) {
                    var absoluteValue = getAbsoluteValue(stop_1, lineLength);
                    if (absoluteValue > previous) {
                        processStops.push(absoluteValue);
                    }
                    else {
                        processStops.push(previous);
                    }
                    previous = absoluteValue;
                }
                else {
                    processStops.push(null);
                }
            }
            var gapBegin = null;
            for (var i = 0; i < processStops.length; i++) {
                var stop_2 = processStops[i];
                if (stop_2 === null) {
                    if (gapBegin === null) {
                        gapBegin = i;
                    }
                }
                else if (gapBegin !== null) {
                    var gapLength = i - gapBegin;
                    var beforeGap = processStops[gapBegin - 1];
                    var gapValue = (stop_2 - beforeGap) / (gapLength + 1);
                    for (var g = 1; g <= gapLength; g++) {
                        processStops[gapBegin + g - 1] = gapValue * g;
                    }
                    gapBegin = null;
                }
            }
            return stops.map(function (_a, i) {
                var color = _a.color;
                return { color: color, stop: Math.max(Math.min(1, processStops[i] / lineLength), 0) };
            });
        };
        var getAngleFromCorner = function (corner, width, height) {
            var centerX = width / 2;
            var centerY = height / 2;
            var x = getAbsoluteValue(corner[0], width) - centerX;
            var y = centerY - getAbsoluteValue(corner[1], height);
            return (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2);
        };
        var calculateGradientDirection = function (angle, width, height) {
            var radian = typeof angle === 'number' ? angle : getAngleFromCorner(angle, width, height);
            var lineLength = Math.abs(width * Math.sin(radian)) + Math.abs(height * Math.cos(radian));
            var halfWidth = width / 2;
            var halfHeight = height / 2;
            var halfLineLength = lineLength / 2;
            var yDiff = Math.sin(radian - Math.PI / 2) * halfLineLength;
            var xDiff = Math.cos(radian - Math.PI / 2) * halfLineLength;
            return [lineLength, halfWidth - xDiff, halfWidth + xDiff, halfHeight - yDiff, halfHeight + yDiff];
        };
        var distance = function (a, b) { return Math.sqrt(a * a + b * b); };
        var findCorner = function (width, height, x, y, closest) {
            var corners = [
                [0, 0],
                [0, height],
                [width, 0],
                [width, height]
            ];
            return corners.reduce(function (stat, corner) {
                var cx = corner[0], cy = corner[1];
                var d = distance(x - cx, y - cy);
                if (closest ? d < stat.optimumDistance : d > stat.optimumDistance) {
                    return {
                        optimumCorner: corner,
                        optimumDistance: d
                    };
                }
                return stat;
            }, {
                optimumDistance: closest ? Infinity : -Infinity,
                optimumCorner: null
            }).optimumCorner;
        };
        var calculateRadius = function (gradient, x, y, width, height) {
            var rx = 0;
            var ry = 0;
            switch (gradient.size) {
                case 0 /* CLOSEST_SIDE */:
                    // The ending shape is sized so that that it exactly meets the side of the gradient box closest to the gradient’s center.
                    // If the shape is an ellipse, it exactly meets the closest side in each dimension.
                    if (gradient.shape === 0 /* CIRCLE */) {
                        rx = ry = Math.min(Math.abs(x), Math.abs(x - width), Math.abs(y), Math.abs(y - height));
                    }
                    else if (gradient.shape === 1 /* ELLIPSE */) {
                        rx = Math.min(Math.abs(x), Math.abs(x - width));
                        ry = Math.min(Math.abs(y), Math.abs(y - height));
                    }
                    break;
                case 2 /* CLOSEST_CORNER */:
                    // The ending shape is sized so that that it passes through the corner of the gradient box closest to the gradient’s center.
                    // If the shape is an ellipse, the ending shape is given the same aspect-ratio it would have if closest-side were specified.
                    if (gradient.shape === 0 /* CIRCLE */) {
                        rx = ry = Math.min(distance(x, y), distance(x, y - height), distance(x - width, y), distance(x - width, y - height));
                    }
                    else if (gradient.shape === 1 /* ELLIPSE */) {
                        // Compute the ratio ry/rx (which is to be the same as for "closest-side")
                        var c = Math.min(Math.abs(y), Math.abs(y - height)) / Math.min(Math.abs(x), Math.abs(x - width));
                        var _a = findCorner(width, height, x, y, true), cx = _a[0], cy = _a[1];
                        rx = distance(cx - x, (cy - y) / c);
                        ry = c * rx;
                    }
                    break;
                case 1 /* FARTHEST_SIDE */:
                    // Same as closest-side, except the ending shape is sized based on the farthest side(s)
                    if (gradient.shape === 0 /* CIRCLE */) {
                        rx = ry = Math.max(Math.abs(x), Math.abs(x - width), Math.abs(y), Math.abs(y - height));
                    }
                    else if (gradient.shape === 1 /* ELLIPSE */) {
                        rx = Math.max(Math.abs(x), Math.abs(x - width));
                        ry = Math.max(Math.abs(y), Math.abs(y - height));
                    }
                    break;
                case 3 /* FARTHEST_CORNER */:
                    // Same as closest-corner, except the ending shape is sized based on the farthest corner.
                    // If the shape is an ellipse, the ending shape is given the same aspect ratio it would have if farthest-side were specified.
                    if (gradient.shape === 0 /* CIRCLE */) {
                        rx = ry = Math.max(distance(x, y), distance(x, y - height), distance(x - width, y), distance(x - width, y - height));
                    }
                    else if (gradient.shape === 1 /* ELLIPSE */) {
                        // Compute the ratio ry/rx (which is to be the same as for "farthest-side")
                        var c = Math.max(Math.abs(y), Math.abs(y - height)) / Math.max(Math.abs(x), Math.abs(x - width));
                        var _b = findCorner(width, height, x, y, false), cx = _b[0], cy = _b[1];
                        rx = distance(cx - x, (cy - y) / c);
                        ry = c * rx;
                    }
                    break;
            }
            if (Array.isArray(gradient.size)) {
                rx = getAbsoluteValue(gradient.size[0], width);
                ry = gradient.size.length === 2 ? getAbsoluteValue(gradient.size[1], height) : rx;
            }
            return [rx, ry];
        };

        var linearGradient = function (context, tokens) {
            var angle$1 = deg(180);
            var stops = [];
            parseFunctionArgs(tokens).forEach(function (arg, i) {
                if (i === 0) {
                    var firstToken = arg[0];
                    if (firstToken.type === 20 /* IDENT_TOKEN */ && firstToken.value === 'to') {
                        angle$1 = parseNamedSide(arg);
                        return;
                    }
                    else if (isAngle(firstToken)) {
                        angle$1 = angle.parse(context, firstToken);
                        return;
                    }
                }
                var colorStop = parseColorStop(context, arg);
                stops.push(colorStop);
            });
            return { angle: angle$1, stops: stops, type: 1 /* LINEAR_GRADIENT */ };
        };

        var prefixLinearGradient = function (context, tokens) {
            var angle$1 = deg(180);
            var stops = [];
            parseFunctionArgs(tokens).forEach(function (arg, i) {
                if (i === 0) {
                    var firstToken = arg[0];
                    if (firstToken.type === 20 /* IDENT_TOKEN */ &&
                        ['top', 'left', 'right', 'bottom'].indexOf(firstToken.value) !== -1) {
                        angle$1 = parseNamedSide(arg);
                        return;
                    }
                    else if (isAngle(firstToken)) {
                        angle$1 = (angle.parse(context, firstToken) + deg(270)) % deg(360);
                        return;
                    }
                }
                var colorStop = parseColorStop(context, arg);
                stops.push(colorStop);
            });
            return {
                angle: angle$1,
                stops: stops,
                type: 1 /* LINEAR_GRADIENT */
            };
        };

        var webkitGradient = function (context, tokens) {
            var angle = deg(180);
            var stops = [];
            var type = 1 /* LINEAR_GRADIENT */;
            var shape = 0 /* CIRCLE */;
            var size = 3 /* FARTHEST_CORNER */;
            var position = [];
            parseFunctionArgs(tokens).forEach(function (arg, i) {
                var firstToken = arg[0];
                if (i === 0) {
                    if (isIdentToken(firstToken) && firstToken.value === 'linear') {
                        type = 1 /* LINEAR_GRADIENT */;
                        return;
                    }
                    else if (isIdentToken(firstToken) && firstToken.value === 'radial') {
                        type = 2 /* RADIAL_GRADIENT */;
                        return;
                    }
                }
                if (firstToken.type === 18 /* FUNCTION */) {
                    if (firstToken.name === 'from') {
                        var color = color$1.parse(context, firstToken.values[0]);
                        stops.push({ stop: ZERO_LENGTH, color: color });
                    }
                    else if (firstToken.name === 'to') {
                        var color = color$1.parse(context, firstToken.values[0]);
                        stops.push({ stop: HUNDRED_PERCENT, color: color });
                    }
                    else if (firstToken.name === 'color-stop') {
                        var values = firstToken.values.filter(nonFunctionArgSeparator);
                        if (values.length === 2) {
                            var color = color$1.parse(context, values[1]);
                            var stop_1 = values[0];
                            if (isNumberToken(stop_1)) {
                                stops.push({
                                    stop: { type: 16 /* PERCENTAGE_TOKEN */, number: stop_1.number * 100, flags: stop_1.flags },
                                    color: color
                                });
                            }
                        }
                    }
                }
            });
            return type === 1 /* LINEAR_GRADIENT */
                ? {
                    angle: (angle + deg(180)) % deg(360),
                    stops: stops,
                    type: type
                }
                : { size: size, shape: shape, stops: stops, position: position, type: type };
        };

        var CLOSEST_SIDE = 'closest-side';
        var FARTHEST_SIDE = 'farthest-side';
        var CLOSEST_CORNER = 'closest-corner';
        var FARTHEST_CORNER = 'farthest-corner';
        var CIRCLE = 'circle';
        var ELLIPSE = 'ellipse';
        var COVER = 'cover';
        var CONTAIN = 'contain';
        var radialGradient = function (context, tokens) {
            var shape = 0 /* CIRCLE */;
            var size = 3 /* FARTHEST_CORNER */;
            var stops = [];
            var position = [];
            parseFunctionArgs(tokens).forEach(function (arg, i) {
                var isColorStop = true;
                if (i === 0) {
                    var isAtPosition_1 = false;
                    isColorStop = arg.reduce(function (acc, token) {
                        if (isAtPosition_1) {
                            if (isIdentToken(token)) {
                                switch (token.value) {
                                    case 'center':
                                        position.push(FIFTY_PERCENT);
                                        return acc;
                                    case 'top':
                                    case 'left':
                                        position.push(ZERO_LENGTH);
                                        return acc;
                                    case 'right':
                                    case 'bottom':
                                        position.push(HUNDRED_PERCENT);
                                        return acc;
                                }
                            }
                            else if (isLengthPercentage(token) || isLength(token)) {
                                position.push(token);
                            }
                        }
                        else if (isIdentToken(token)) {
                            switch (token.value) {
                                case CIRCLE:
                                    shape = 0 /* CIRCLE */;
                                    return false;
                                case ELLIPSE:
                                    shape = 1 /* ELLIPSE */;
                                    return false;
                                case 'at':
                                    isAtPosition_1 = true;
                                    return false;
                                case CLOSEST_SIDE:
                                    size = 0 /* CLOSEST_SIDE */;
                                    return false;
                                case COVER:
                                case FARTHEST_SIDE:
                                    size = 1 /* FARTHEST_SIDE */;
                                    return false;
                                case CONTAIN:
                                case CLOSEST_CORNER:
                                    size = 2 /* CLOSEST_CORNER */;
                                    return false;
                                case FARTHEST_CORNER:
                                    size = 3 /* FARTHEST_CORNER */;
                                    return false;
                            }
                        }
                        else if (isLength(token) || isLengthPercentage(token)) {
                            if (!Array.isArray(size)) {
                                size = [];
                            }
                            size.push(token);
                            return false;
                        }
                        return acc;
                    }, isColorStop);
                }
                if (isColorStop) {
                    var colorStop = parseColorStop(context, arg);
                    stops.push(colorStop);
                }
            });
            return { size: size, shape: shape, stops: stops, position: position, type: 2 /* RADIAL_GRADIENT */ };
        };

        var prefixRadialGradient = function (context, tokens) {
            var shape = 0 /* CIRCLE */;
            var size = 3 /* FARTHEST_CORNER */;
            var stops = [];
            var position = [];
            parseFunctionArgs(tokens).forEach(function (arg, i) {
                var isColorStop = true;
                if (i === 0) {
                    isColorStop = arg.reduce(function (acc, token) {
                        if (isIdentToken(token)) {
                            switch (token.value) {
                                case 'center':
                                    position.push(FIFTY_PERCENT);
                                    return false;
                                case 'top':
                                case 'left':
                                    position.push(ZERO_LENGTH);
                                    return false;
                                case 'right':
                                case 'bottom':
                                    position.push(HUNDRED_PERCENT);
                                    return false;
                            }
                        }
                        else if (isLengthPercentage(token) || isLength(token)) {
                            position.push(token);
                            return false;
                        }
                        return acc;
                    }, isColorStop);
                }
                else if (i === 1) {
                    isColorStop = arg.reduce(function (acc, token) {
                        if (isIdentToken(token)) {
                            switch (token.value) {
                                case CIRCLE:
                                    shape = 0 /* CIRCLE */;
                                    return false;
                                case ELLIPSE:
                                    shape = 1 /* ELLIPSE */;
                                    return false;
                                case CONTAIN:
                                case CLOSEST_SIDE:
                                    size = 0 /* CLOSEST_SIDE */;
                                    return false;
                                case FARTHEST_SIDE:
                                    size = 1 /* FARTHEST_SIDE */;
                                    return false;
                                case CLOSEST_CORNER:
                                    size = 2 /* CLOSEST_CORNER */;
                                    return false;
                                case COVER:
                                case FARTHEST_CORNER:
                                    size = 3 /* FARTHEST_CORNER */;
                                    return false;
                            }
                        }
                        else if (isLength(token) || isLengthPercentage(token)) {
                            if (!Array.isArray(size)) {
                                size = [];
                            }
                            size.push(token);
                            return false;
                        }
                        return acc;
                    }, isColorStop);
                }
                if (isColorStop) {
                    var colorStop = parseColorStop(context, arg);
                    stops.push(colorStop);
                }
            });
            return { size: size, shape: shape, stops: stops, position: position, type: 2 /* RADIAL_GRADIENT */ };
        };

        var isLinearGradient = function (background) {
            return background.type === 1 /* LINEAR_GRADIENT */;
        };
        var isRadialGradient = function (background) {
            return background.type === 2 /* RADIAL_GRADIENT */;
        };
        var image = {
            name: 'image',
            parse: function (context, value) {
                if (value.type === 22 /* URL_TOKEN */) {
                    var image_1 = { url: value.value, type: 0 /* URL */ };
                    context.cache.addImage(value.value);
                    return image_1;
                }
                if (value.type === 18 /* FUNCTION */) {
                    var imageFunction = SUPPORTED_IMAGE_FUNCTIONS[value.name];
                    if (typeof imageFunction === 'undefined') {
                        throw new Error("Attempting to parse an unsupported image function \"" + value.name + "\"");
                    }
                    return imageFunction(context, value.values);
                }
                throw new Error("Unsupported image type " + value.type);
            }
        };
        function isSupportedImage(value) {
            return (!(value.type === 20 /* IDENT_TOKEN */ && value.value === 'none') &&
                (value.type !== 18 /* FUNCTION */ || !!SUPPORTED_IMAGE_FUNCTIONS[value.name]));
        }
        var SUPPORTED_IMAGE_FUNCTIONS = {
            'linear-gradient': linearGradient,
            '-moz-linear-gradient': prefixLinearGradient,
            '-ms-linear-gradient': prefixLinearGradient,
            '-o-linear-gradient': prefixLinearGradient,
            '-webkit-linear-gradient': prefixLinearGradient,
            'radial-gradient': radialGradient,
            '-moz-radial-gradient': prefixRadialGradient,
            '-ms-radial-gradient': prefixRadialGradient,
            '-o-radial-gradient': prefixRadialGradient,
            '-webkit-radial-gradient': prefixRadialGradient,
            '-webkit-gradient': webkitGradient
        };

        var backgroundImage = {
            name: 'background-image',
            initialValue: 'none',
            type: 1 /* LIST */,
            prefix: false,
            parse: function (context, tokens) {
                if (tokens.length === 0) {
                    return [];
                }
                var first = tokens[0];
                if (first.type === 20 /* IDENT_TOKEN */ && first.value === 'none') {
                    return [];
                }
                return tokens
                    .filter(function (value) { return nonFunctionArgSeparator(value) && isSupportedImage(value); })
                    .map(function (value) { return image.parse(context, value); });
            }
        };

        var backgroundOrigin = {
            name: 'background-origin',
            initialValue: 'border-box',
            prefix: false,
            type: 1 /* LIST */,
            parse: function (_context, tokens) {
                return tokens.map(function (token) {
                    if (isIdentToken(token)) {
                        switch (token.value) {
                            case 'padding-box':
                                return 1 /* PADDING_BOX */;
                            case 'content-box':
                                return 2 /* CONTENT_BOX */;
                        }
                    }
                    return 0 /* BORDER_BOX */;
                });
            }
        };

        var backgroundPosition = {
            name: 'background-position',
            initialValue: '0% 0%',
            type: 1 /* LIST */,
            prefix: false,
            parse: function (_context, tokens) {
                return parseFunctionArgs(tokens)
                    .map(function (values) { return values.filter(isLengthPercentage); })
                    .map(parseLengthPercentageTuple);
            }
        };

        var backgroundRepeat = {
            name: 'background-repeat',
            initialValue: 'repeat',
            prefix: false,
            type: 1 /* LIST */,
            parse: function (_context, tokens) {
                return parseFunctionArgs(tokens)
                    .map(function (values) {
                    return values
                        .filter(isIdentToken)
                        .map(function (token) { return token.value; })
                        .join(' ');
                })
                    .map(parseBackgroundRepeat);
            }
        };
        var parseBackgroundRepeat = function (value) {
            switch (value) {
                case 'no-repeat':
                    return 1 /* NO_REPEAT */;
                case 'repeat-x':
                case 'repeat no-repeat':
                    return 2 /* REPEAT_X */;
                case 'repeat-y':
                case 'no-repeat repeat':
                    return 3 /* REPEAT_Y */;
                case 'repeat':
                default:
                    return 0 /* REPEAT */;
            }
        };

        var BACKGROUND_SIZE;
        (function (BACKGROUND_SIZE) {
            BACKGROUND_SIZE["AUTO"] = "auto";
            BACKGROUND_SIZE["CONTAIN"] = "contain";
            BACKGROUND_SIZE["COVER"] = "cover";
        })(BACKGROUND_SIZE || (BACKGROUND_SIZE = {}));
        var backgroundSize = {
            name: 'background-size',
            initialValue: '0',
            prefix: false,
            type: 1 /* LIST */,
            parse: function (_context, tokens) {
                return parseFunctionArgs(tokens).map(function (values) { return values.filter(isBackgroundSizeInfoToken); });
            }
        };
        var isBackgroundSizeInfoToken = function (value) {
            return isIdentToken(value) || isLengthPercentage(value);
        };

        var borderColorForSide = function (side) { return ({
            name: "border-" + side + "-color",
            initialValue: 'transparent',
            prefix: false,
            type: 3 /* TYPE_VALUE */,
            format: 'color'
        }); };
        var borderTopColor = borderColorForSide('top');
        var borderRightColor = borderColorForSide('right');
        var borderBottomColor = borderColorForSide('bottom');
        var borderLeftColor = borderColorForSide('left');

        var borderRadiusForSide = function (side) { return ({
            name: "border-radius-" + side,
            initialValue: '0 0',
            prefix: false,
            type: 1 /* LIST */,
            parse: function (_context, tokens) {
                return parseLengthPercentageTuple(tokens.filter(isLengthPercentage));
            }
        }); };
        var borderTopLeftRadius = borderRadiusForSide('top-left');
        var borderTopRightRadius = borderRadiusForSide('top-right');
        var borderBottomRightRadius = borderRadiusForSide('bottom-right');
        var borderBottomLeftRadius = borderRadiusForSide('bottom-left');

        var borderStyleForSide = function (side) { return ({
            name: "border-" + side + "-style",
            initialValue: 'solid',
            prefix: false,
            type: 2 /* IDENT_VALUE */,
            parse: function (_context, style) {
                switch (style) {
                    case 'none':
                        return 0 /* NONE */;
                    case 'dashed':
                        return 2 /* DASHED */;
                    case 'dotted':
                        return 3 /* DOTTED */;
                    case 'double':
                        return 4 /* DOUBLE */;
                }
                return 1 /* SOLID */;
            }
        }); };
        var borderTopStyle = borderStyleForSide('top');
        var borderRightStyle = borderStyleForSide('right');
        var borderBottomStyle = borderStyleForSide('bottom');
        var borderLeftStyle = borderStyleForSide('left');

        var borderWidthForSide = function (side) { return ({
            name: "border-" + side + "-width",
            initialValue: '0',
            type: 0 /* VALUE */,
            prefix: false,
            parse: function (_context, token) {
                if (isDimensionToken(token)) {
                    return token.number;
                }
                return 0;
            }
        }); };
        var borderTopWidth = borderWidthForSide('top');
        var borderRightWidth = borderWidthForSide('right');
        var borderBottomWidth = borderWidthForSide('bottom');
        var borderLeftWidth = borderWidthForSide('left');

        var color = {
            name: "color",
            initialValue: 'transparent',
            prefix: false,
            type: 3 /* TYPE_VALUE */,
            format: 'color'
        };

        var direction = {
            name: 'direction',
            initialValue: 'ltr',
            prefix: false,
            type: 2 /* IDENT_VALUE */,
            parse: function (_context, direction) {
                switch (direction) {
                    case 'rtl':
                        return 1 /* RTL */;
                    case 'ltr':
                    default:
                        return 0 /* LTR */;
                }
            }
        };

        var display = {
            name: 'display',
            initialValue: 'inline-block',
            prefix: false,
            type: 1 /* LIST */,
            parse: function (_context, tokens) {
                return tokens.filter(isIdentToken).reduce(function (bit, token) {
                    return bit | parseDisplayValue(token.value);
                }, 0 /* NONE */);
            }
        };
        var parseDisplayValue = function (display) {
            switch (display) {
                case 'block':
                case '-webkit-box':
                    return 2 /* BLOCK */;
                case 'inline':
                    return 4 /* INLINE */;
                case 'run-in':
                    return 8 /* RUN_IN */;
                case 'flow':
                    return 16 /* FLOW */;
                case 'flow-root':
                    return 32 /* FLOW_ROOT */;
                case 'table':
                    return 64 /* TABLE */;
                case 'flex':
                case '-webkit-flex':
                    return 128 /* FLEX */;
                case 'grid':
                case '-ms-grid':
                    return 256 /* GRID */;
                case 'ruby':
                    return 512 /* RUBY */;
                case 'subgrid':
                    return 1024 /* SUBGRID */;
                case 'list-item':
                    return 2048 /* LIST_ITEM */;
                case 'table-row-group':
                    return 4096 /* TABLE_ROW_GROUP */;
                case 'table-header-group':
                    return 8192 /* TABLE_HEADER_GROUP */;
                case 'table-footer-group':
                    return 16384 /* TABLE_FOOTER_GROUP */;
                case 'table-row':
                    return 32768 /* TABLE_ROW */;
                case 'table-cell':
                    return 65536 /* TABLE_CELL */;
                case 'table-column-group':
                    return 131072 /* TABLE_COLUMN_GROUP */;
                case 'table-column':
                    return 262144 /* TABLE_COLUMN */;
                case 'table-caption':
                    return 524288 /* TABLE_CAPTION */;
                case 'ruby-base':
                    return 1048576 /* RUBY_BASE */;
                case 'ruby-text':
                    return 2097152 /* RUBY_TEXT */;
                case 'ruby-base-container':
                    return 4194304 /* RUBY_BASE_CONTAINER */;
                case 'ruby-text-container':
                    return 8388608 /* RUBY_TEXT_CONTAINER */;
                case 'contents':
                    return 16777216 /* CONTENTS */;
                case 'inline-block':
                    return 33554432 /* INLINE_BLOCK */;
                case 'inline-list-item':
                    return 67108864 /* INLINE_LIST_ITEM */;
                case 'inline-table':
                    return 134217728 /* INLINE_TABLE */;
                case 'inline-flex':
                    return 268435456 /* INLINE_FLEX */;
                case 'inline-grid':
                    return 536870912 /* INLINE_GRID */;
            }
            return 0 /* NONE */;
        };

        var float = {
            name: 'float',
            initialValue: 'none',
            prefix: false,
            type: 2 /* IDENT_VALUE */,
            parse: function (_context, float) {
                switch (float) {
                    case 'left':
                        return 1 /* LEFT */;
                    case 'right':
                        return 2 /* RIGHT */;
                    case 'inline-start':
                        return 3 /* INLINE_START */;
                    case 'inline-end':
                        return 4 /* INLINE_END */;
                }
                return 0 /* NONE */;
            }
        };

        var letterSpacing = {
            name: 'letter-spacing',
            initialValue: '0',
            prefix: false,
            type: 0 /* VALUE */,
            parse: function (_context, token) {
                if (token.type === 20 /* IDENT_TOKEN */ && token.value === 'normal') {
                    return 0;
                }
                if (token.type === 17 /* NUMBER_TOKEN */) {
                    return token.number;
                }
                if (token.type === 15 /* DIMENSION_TOKEN */) {
                    return token.number;
                }
                return 0;
            }
        };

        var LINE_BREAK;
        (function (LINE_BREAK) {
            LINE_BREAK["NORMAL"] = "normal";
            LINE_BREAK["STRICT"] = "strict";
        })(LINE_BREAK || (LINE_BREAK = {}));
        var lineBreak = {
            name: 'line-break',
            initialValue: 'normal',
            prefix: false,
            type: 2 /* IDENT_VALUE */,
            parse: function (_context, lineBreak) {
                switch (lineBreak) {
                    case 'strict':
                        return LINE_BREAK.STRICT;
                    case 'normal':
                    default:
                        return LINE_BREAK.NORMAL;
                }
            }
        };

        var lineHeight = {
            name: 'line-height',
            initialValue: 'normal',
            prefix: false,
            type: 4 /* TOKEN_VALUE */
        };
        var computeLineHeight = function (token, fontSize) {
            if (isIdentToken(token) && token.value === 'normal') {
                return 1.2 * fontSize;
            }
            else if (token.type === 17 /* NUMBER_TOKEN */) {
                return fontSize * token.number;
            }
            else if (isLengthPercentage(token)) {
                return getAbsoluteValue(token, fontSize);
            }
            return fontSize;
        };

        var listStyleImage = {
            name: 'list-style-image',
            initialValue: 'none',
            type: 0 /* VALUE */,
            prefix: false,
            parse: function (context, token) {
                if (token.type === 20 /* IDENT_TOKEN */ && token.value === 'none') {
                    return null;
                }
                return image.parse(context, token);
            }
        };

        var listStylePosition = {
            name: 'list-style-position',
            initialValue: 'outside',
            prefix: false,
            type: 2 /* IDENT_VALUE */,
            parse: function (_context, position) {
                switch (position) {
                    case 'inside':
                        return 0 /* INSIDE */;
                    case 'outside':
                    default:
                        return 1 /* OUTSIDE */;
                }
            }
        };

        var listStyleType = {
            name: 'list-style-type',
            initialValue: 'none',
            prefix: false,
            type: 2 /* IDENT_VALUE */,
            parse: function (_context, type) {
                switch (type) {
                    case 'disc':
                        return 0 /* DISC */;
                    case 'circle':
                        return 1 /* CIRCLE */;
                    case 'square':
                        return 2 /* SQUARE */;
                    case 'decimal':
                        return 3 /* DECIMAL */;
                    case 'cjk-decimal':
                        return 4 /* CJK_DECIMAL */;
                    case 'decimal-leading-zero':
                        return 5 /* DECIMAL_LEADING_ZERO */;
                    case 'lower-roman':
                        return 6 /* LOWER_ROMAN */;
                    case 'upper-roman':
                        return 7 /* UPPER_ROMAN */;
                    case 'lower-greek':
                        return 8 /* LOWER_GREEK */;
                    case 'lower-alpha':
                        return 9 /* LOWER_ALPHA */;
                    case 'upper-alpha':
                        return 10 /* UPPER_ALPHA */;
                    case 'arabic-indic':
                        return 11 /* ARABIC_INDIC */;
                    case 'armenian':
                        return 12 /* ARMENIAN */;
                    case 'bengali':
                        return 13 /* BENGALI */;
                    case 'cambodian':
                        return 14 /* CAMBODIAN */;
                    case 'cjk-earthly-branch':
                        return 15 /* CJK_EARTHLY_BRANCH */;
                    case 'cjk-heavenly-stem':
                        return 16 /* CJK_HEAVENLY_STEM */;
                    case 'cjk-ideographic':
                        return 17 /* CJK_IDEOGRAPHIC */;
                    case 'devanagari':
                        return 18 /* DEVANAGARI */;
                    case 'ethiopic-numeric':
                        return 19 /* ETHIOPIC_NUMERIC */;
                    case 'georgian':
                        return 20 /* GEORGIAN */;
                    case 'gujarati':
                        return 21 /* GUJARATI */;
                    case 'gurmukhi':
                        return 22 /* GURMUKHI */;
                    case 'hebrew':
                        return 22 /* HEBREW */;
                    case 'hiragana':
                        return 23 /* HIRAGANA */;
                    case 'hiragana-iroha':
                        return 24 /* HIRAGANA_IROHA */;
                    case 'japanese-formal':
                        return 25 /* JAPANESE_FORMAL */;
                    case 'japanese-informal':
                        return 26 /* JAPANESE_INFORMAL */;
                    case 'kannada':
                        return 27 /* KANNADA */;
                    case 'katakana':
                        return 28 /* KATAKANA */;
                    case 'katakana-iroha':
                        return 29 /* KATAKANA_IROHA */;
                    case 'khmer':
                        return 30 /* KHMER */;
                    case 'korean-hangul-formal':
                        return 31 /* KOREAN_HANGUL_FORMAL */;
                    case 'korean-hanja-formal':
                        return 32 /* KOREAN_HANJA_FORMAL */;
                    case 'korean-hanja-informal':
                        return 33 /* KOREAN_HANJA_INFORMAL */;
                    case 'lao':
                        return 34 /* LAO */;
                    case 'lower-armenian':
                        return 35 /* LOWER_ARMENIAN */;
                    case 'malayalam':
                        return 36 /* MALAYALAM */;
                    case 'mongolian':
                        return 37 /* MONGOLIAN */;
                    case 'myanmar':
                        return 38 /* MYANMAR */;
                    case 'oriya':
                        return 39 /* ORIYA */;
                    case 'persian':
                        return 40 /* PERSIAN */;
                    case 'simp-chinese-formal':
                        return 41 /* SIMP_CHINESE_FORMAL */;
                    case 'simp-chinese-informal':
                        return 42 /* SIMP_CHINESE_INFORMAL */;
                    case 'tamil':
                        return 43 /* TAMIL */;
                    case 'telugu':
                        return 44 /* TELUGU */;
                    case 'thai':
                        return 45 /* THAI */;
                    case 'tibetan':
                        return 46 /* TIBETAN */;
                    case 'trad-chinese-formal':
                        return 47 /* TRAD_CHINESE_FORMAL */;
                    case 'trad-chinese-informal':
                        return 48 /* TRAD_CHINESE_INFORMAL */;
                    case 'upper-armenian':
                        return 49 /* UPPER_ARMENIAN */;
                    case 'disclosure-open':
                        return 50 /* DISCLOSURE_OPEN */;
                    case 'disclosure-closed':
                        return 51 /* DISCLOSURE_CLOSED */;
                    case 'none':
                    default:
                        return -1 /* NONE */;
                }
            }
        };

        var marginForSide = function (side) { return ({
            name: "margin-" + side,
            initialValue: '0',
            prefix: false,
            type: 4 /* TOKEN_VALUE */
        }); };
        var marginTop = marginForSide('top');
        var marginRight = marginForSide('right');
        var marginBottom = marginForSide('bottom');
        var marginLeft = marginForSide('left');

        var overflow = {
            name: 'overflow',
            initialValue: 'visible',
            prefix: false,
            type: 1 /* LIST */,
            parse: function (_context, tokens) {
                return tokens.filter(isIdentToken).map(function (overflow) {
                    switch (overflow.value) {
                        case 'hidden':
                            return 1 /* HIDDEN */;
                        case 'scroll':
                            return 2 /* SCROLL */;
                        case 'clip':
                            return 3 /* CLIP */;
                        case 'auto':
                            return 4 /* AUTO */;
                        case 'visible':
                        default:
                            return 0 /* VISIBLE */;
                    }
                });
            }
        };

        var overflowWrap = {
            name: 'overflow-wrap',
            initialValue: 'normal',
            prefix: false,
            type: 2 /* IDENT_VALUE */,
            parse: function (_context, overflow) {
                switch (overflow) {
                    case 'break-word':
                        return "break-word" /* BREAK_WORD */;
                    case 'normal':
                    default:
                        return "normal" /* NORMAL */;
                }
            }
        };

        var paddingForSide = function (side) { return ({
            name: "padding-" + side,
            initialValue: '0',
            prefix: false,
            type: 3 /* TYPE_VALUE */,
            format: 'length-percentage'
        }); };
        var paddingTop = paddingForSide('top');
        var paddingRight = paddingForSide('right');
        var paddingBottom = paddingForSide('bottom');
        var paddingLeft = paddingForSide('left');

        var textAlign = {
            name: 'text-align',
            initialValue: 'left',
            prefix: false,
            type: 2 /* IDENT_VALUE */,
            parse: function (_context, textAlign) {
                switch (textAlign) {
                    case 'right':
                        return 2 /* RIGHT */;
                    case 'center':
                    case 'justify':
                        return 1 /* CENTER */;
                    case 'left':
                    default:
                        return 0 /* LEFT */;
                }
            }
        };

        var position = {
            name: 'position',
            initialValue: 'static',
            prefix: false,
            type: 2 /* IDENT_VALUE */,
            parse: function (_context, position) {
                switch (position) {
                    case 'relative':
                        return 1 /* RELATIVE */;
                    case 'absolute':
                        return 2 /* ABSOLUTE */;
                    case 'fixed':
                        return 3 /* FIXED */;
                    case 'sticky':
                        return 4 /* STICKY */;
                }
                return 0 /* STATIC */;
            }
        };

        var textShadow = {
            name: 'text-shadow',
            initialValue: 'none',
            type: 1 /* LIST */,
            prefix: false,
            parse: function (context, tokens) {
                if (tokens.length === 1 && isIdentWithValue(tokens[0], 'none')) {
                    return [];
                }
                return parseFunctionArgs(tokens).map(function (values) {
                    var shadow = {
                        color: COLORS.TRANSPARENT,
                        offsetX: ZERO_LENGTH,
                        offsetY: ZERO_LENGTH,
                        blur: ZERO_LENGTH
                    };
                    var c = 0;
                    for (var i = 0; i < values.length; i++) {
                        var token = values[i];
                        if (isLength(token)) {
                            if (c === 0) {
                                shadow.offsetX = token;
                            }
                            else if (c === 1) {
                                shadow.offsetY = token;
                            }
                            else {
                                shadow.blur = token;
                            }
                            c++;
                        }
                        else {
                            shadow.color = color$1.parse(context, token);
                        }
                    }
                    return shadow;
                });
            }
        };

        var textTransform = {
            name: 'text-transform',
            initialValue: 'none',
            prefix: false,
            type: 2 /* IDENT_VALUE */,
            parse: function (_context, textTransform) {
                switch (textTransform) {
                    case 'uppercase':
                        return 2 /* UPPERCASE */;
                    case 'lowercase':
                        return 1 /* LOWERCASE */;
                    case 'capitalize':
                        return 3 /* CAPITALIZE */;
                }
                return 0 /* NONE */;
            }
        };

        var transform$1 = {
            name: 'transform',
            initialValue: 'none',
            prefix: true,
            type: 0 /* VALUE */,
            parse: function (_context, token) {
                if (token.type === 20 /* IDENT_TOKEN */ && token.value === 'none') {
                    return null;
                }
                if (token.type === 18 /* FUNCTION */) {
                    var transformFunction = SUPPORTED_TRANSFORM_FUNCTIONS[token.name];
                    if (typeof transformFunction === 'undefined') {
                        throw new Error("Attempting to parse an unsupported transform function \"" + token.name + "\"");
                    }
                    return transformFunction(token.values);
                }
                return null;
            }
        };
        var matrix = function (args) {
            var values = args.filter(function (arg) { return arg.type === 17 /* NUMBER_TOKEN */; }).map(function (arg) { return arg.number; });
            return values.length === 6 ? values : null;
        };
        // doesn't support 3D transforms at the moment
        var matrix3d = function (args) {
            var values = args.filter(function (arg) { return arg.type === 17 /* NUMBER_TOKEN */; }).map(function (arg) { return arg.number; });
            var a1 = values[0], b1 = values[1]; values[2]; values[3]; var a2 = values[4], b2 = values[5]; values[6]; values[7]; values[8]; values[9]; values[10]; values[11]; var a4 = values[12], b4 = values[13]; values[14]; values[15];
            return values.length === 16 ? [a1, b1, a2, b2, a4, b4] : null;
        };
        var SUPPORTED_TRANSFORM_FUNCTIONS = {
            matrix: matrix,
            matrix3d: matrix3d
        };

        var DEFAULT_VALUE = {
            type: 16 /* PERCENTAGE_TOKEN */,
            number: 50,
            flags: FLAG_INTEGER
        };
        var DEFAULT = [DEFAULT_VALUE, DEFAULT_VALUE];
        var transformOrigin = {
            name: 'transform-origin',
            initialValue: '50% 50%',
            prefix: true,
            type: 1 /* LIST */,
            parse: function (_context, tokens) {
                var origins = tokens.filter(isLengthPercentage);
                if (origins.length !== 2) {
                    return DEFAULT;
                }
                return [origins[0], origins[1]];
            }
        };

        var visibility = {
            name: 'visible',
            initialValue: 'none',
            prefix: false,
            type: 2 /* IDENT_VALUE */,
            parse: function (_context, visibility) {
                switch (visibility) {
                    case 'hidden':
                        return 1 /* HIDDEN */;
                    case 'collapse':
                        return 2 /* COLLAPSE */;
                    case 'visible':
                    default:
                        return 0 /* VISIBLE */;
                }
            }
        };

        var WORD_BREAK;
        (function (WORD_BREAK) {
            WORD_BREAK["NORMAL"] = "normal";
            WORD_BREAK["BREAK_ALL"] = "break-all";
            WORD_BREAK["KEEP_ALL"] = "keep-all";
        })(WORD_BREAK || (WORD_BREAK = {}));
        var wordBreak = {
            name: 'word-break',
            initialValue: 'normal',
            prefix: false,
            type: 2 /* IDENT_VALUE */,
            parse: function (_context, wordBreak) {
                switch (wordBreak) {
                    case 'break-all':
                        return WORD_BREAK.BREAK_ALL;
                    case 'keep-all':
                        return WORD_BREAK.KEEP_ALL;
                    case 'normal':
                    default:
                        return WORD_BREAK.NORMAL;
                }
            }
        };

        var zIndex = {
            name: 'z-index',
            initialValue: 'auto',
            prefix: false,
            type: 0 /* VALUE */,
            parse: function (_context, token) {
                if (token.type === 20 /* IDENT_TOKEN */) {
                    return { auto: true, order: 0 };
                }
                if (isNumberToken(token)) {
                    return { auto: false, order: token.number };
                }
                throw new Error("Invalid z-index number parsed");
            }
        };

        var time = {
            name: 'time',
            parse: function (_context, value) {
                if (value.type === 15 /* DIMENSION_TOKEN */) {
                    switch (value.unit.toLowerCase()) {
                        case 's':
                            return 1000 * value.number;
                        case 'ms':
                            return value.number;
                    }
                }
                throw new Error("Unsupported time type");
            }
        };

        var opacity = {
            name: 'opacity',
            initialValue: '1',
            type: 0 /* VALUE */,
            prefix: false,
            parse: function (_context, token) {
                if (isNumberToken(token)) {
                    return token.number;
                }
                return 1;
            }
        };

        var textDecorationColor = {
            name: "text-decoration-color",
            initialValue: 'transparent',
            prefix: false,
            type: 3 /* TYPE_VALUE */,
            format: 'color'
        };

        var textDecorationLine = {
            name: 'text-decoration-line',
            initialValue: 'none',
            prefix: false,
            type: 1 /* LIST */,
            parse: function (_context, tokens) {
                return tokens
                    .filter(isIdentToken)
                    .map(function (token) {
                    switch (token.value) {
                        case 'underline':
                            return 1 /* UNDERLINE */;
                        case 'overline':
                            return 2 /* OVERLINE */;
                        case 'line-through':
                            return 3 /* LINE_THROUGH */;
                        case 'none':
                            return 4 /* BLINK */;
                    }
                    return 0 /* NONE */;
                })
                    .filter(function (line) { return line !== 0 /* NONE */; });
            }
        };

        var fontFamily = {
            name: "font-family",
            initialValue: '',
            prefix: false,
            type: 1 /* LIST */,
            parse: function (_context, tokens) {
                var accumulator = [];
                var results = [];
                tokens.forEach(function (token) {
                    switch (token.type) {
                        case 20 /* IDENT_TOKEN */:
                        case 0 /* STRING_TOKEN */:
                            accumulator.push(token.value);
                            break;
                        case 17 /* NUMBER_TOKEN */:
                            accumulator.push(token.number.toString());
                            break;
                        case 4 /* COMMA_TOKEN */:
                            results.push(accumulator.join(' '));
                            accumulator.length = 0;
                            break;
                    }
                });
                if (accumulator.length) {
                    results.push(accumulator.join(' '));
                }
                return results.map(function (result) { return (result.indexOf(' ') === -1 ? result : "'" + result + "'"); });
            }
        };

        var fontSize = {
            name: "font-size",
            initialValue: '0',
            prefix: false,
            type: 3 /* TYPE_VALUE */,
            format: 'length'
        };

        var fontWeight = {
            name: 'font-weight',
            initialValue: 'normal',
            type: 0 /* VALUE */,
            prefix: false,
            parse: function (_context, token) {
                if (isNumberToken(token)) {
                    return token.number;
                }
                if (isIdentToken(token)) {
                    switch (token.value) {
                        case 'bold':
                            return 700;
                        case 'normal':
                        default:
                            return 400;
                    }
                }
                return 400;
            }
        };

        var fontVariant = {
            name: 'font-variant',
            initialValue: 'none',
            type: 1 /* LIST */,
            prefix: false,
            parse: function (_context, tokens) {
                return tokens.filter(isIdentToken).map(function (token) { return token.value; });
            }
        };

        var fontStyle = {
            name: 'font-style',
            initialValue: 'normal',
            prefix: false,
            type: 2 /* IDENT_VALUE */,
            parse: function (_context, overflow) {
                switch (overflow) {
                    case 'oblique':
                        return "oblique" /* OBLIQUE */;
                    case 'italic':
                        return "italic" /* ITALIC */;
                    case 'normal':
                    default:
                        return "normal" /* NORMAL */;
                }
            }
        };

        var contains = function (bit, value) { return (bit & value) !== 0; };

        var content = {
            name: 'content',
            initialValue: 'none',
            type: 1 /* LIST */,
            prefix: false,
            parse: function (_context, tokens) {
                if (tokens.length === 0) {
                    return [];
                }
                var first = tokens[0];
                if (first.type === 20 /* IDENT_TOKEN */ && first.value === 'none') {
                    return [];
                }
                return tokens;
            }
        };

        var counterIncrement = {
            name: 'counter-increment',
            initialValue: 'none',
            prefix: true,
            type: 1 /* LIST */,
            parse: function (_context, tokens) {
                if (tokens.length === 0) {
                    return null;
                }
                var first = tokens[0];
                if (first.type === 20 /* IDENT_TOKEN */ && first.value === 'none') {
                    return null;
                }
                var increments = [];
                var filtered = tokens.filter(nonWhiteSpace);
                for (var i = 0; i < filtered.length; i++) {
                    var counter = filtered[i];
                    var next = filtered[i + 1];
                    if (counter.type === 20 /* IDENT_TOKEN */) {
                        var increment = next && isNumberToken(next) ? next.number : 1;
                        increments.push({ counter: counter.value, increment: increment });
                    }
                }
                return increments;
            }
        };

        var counterReset = {
            name: 'counter-reset',
            initialValue: 'none',
            prefix: true,
            type: 1 /* LIST */,
            parse: function (_context, tokens) {
                if (tokens.length === 0) {
                    return [];
                }
                var resets = [];
                var filtered = tokens.filter(nonWhiteSpace);
                for (var i = 0; i < filtered.length; i++) {
                    var counter = filtered[i];
                    var next = filtered[i + 1];
                    if (isIdentToken(counter) && counter.value !== 'none') {
                        var reset = next && isNumberToken(next) ? next.number : 0;
                        resets.push({ counter: counter.value, reset: reset });
                    }
                }
                return resets;
            }
        };

        var duration = {
            name: 'duration',
            initialValue: '0s',
            prefix: false,
            type: 1 /* LIST */,
            parse: function (context, tokens) {
                return tokens.filter(isDimensionToken).map(function (token) { return time.parse(context, token); });
            }
        };

        var quotes = {
            name: 'quotes',
            initialValue: 'none',
            prefix: true,
            type: 1 /* LIST */,
            parse: function (_context, tokens) {
                if (tokens.length === 0) {
                    return null;
                }
                var first = tokens[0];
                if (first.type === 20 /* IDENT_TOKEN */ && first.value === 'none') {
                    return null;
                }
                var quotes = [];
                var filtered = tokens.filter(isStringToken);
                if (filtered.length % 2 !== 0) {
                    return null;
                }
                for (var i = 0; i < filtered.length; i += 2) {
                    var open_1 = filtered[i].value;
                    var close_1 = filtered[i + 1].value;
                    quotes.push({ open: open_1, close: close_1 });
                }
                return quotes;
            }
        };
        var getQuote = function (quotes, depth, open) {
            if (!quotes) {
                return '';
            }
            var quote = quotes[Math.min(depth, quotes.length - 1)];
            if (!quote) {
                return '';
            }
            return open ? quote.open : quote.close;
        };

        var boxShadow = {
            name: 'box-shadow',
            initialValue: 'none',
            type: 1 /* LIST */,
            prefix: false,
            parse: function (context, tokens) {
                if (tokens.length === 1 && isIdentWithValue(tokens[0], 'none')) {
                    return [];
                }
                return parseFunctionArgs(tokens).map(function (values) {
                    var shadow = {
                        color: 0x000000ff,
                        offsetX: ZERO_LENGTH,
                        offsetY: ZERO_LENGTH,
                        blur: ZERO_LENGTH,
                        spread: ZERO_LENGTH,
                        inset: false
                    };
                    var c = 0;
                    for (var i = 0; i < values.length; i++) {
                        var token = values[i];
                        if (isIdentWithValue(token, 'inset')) {
                            shadow.inset = true;
                        }
                        else if (isLength(token)) {
                            if (c === 0) {
                                shadow.offsetX = token;
                            }
                            else if (c === 1) {
                                shadow.offsetY = token;
                            }
                            else if (c === 2) {
                                shadow.blur = token;
                            }
                            else {
                                shadow.spread = token;
                            }
                            c++;
                        }
                        else {
                            shadow.color = color$1.parse(context, token);
                        }
                    }
                    return shadow;
                });
            }
        };

        var paintOrder = {
            name: 'paint-order',
            initialValue: 'normal',
            prefix: false,
            type: 1 /* LIST */,
            parse: function (_context, tokens) {
                var DEFAULT_VALUE = [0 /* FILL */, 1 /* STROKE */, 2 /* MARKERS */];
                var layers = [];
                tokens.filter(isIdentToken).forEach(function (token) {
                    switch (token.value) {
                        case 'stroke':
                            layers.push(1 /* STROKE */);
                            break;
                        case 'fill':
                            layers.push(0 /* FILL */);
                            break;
                        case 'markers':
                            layers.push(2 /* MARKERS */);
                            break;
                    }
                });
                DEFAULT_VALUE.forEach(function (value) {
                    if (layers.indexOf(value) === -1) {
                        layers.push(value);
                    }
                });
                return layers;
            }
        };

        var webkitTextStrokeColor = {
            name: "-webkit-text-stroke-color",
            initialValue: 'currentcolor',
            prefix: false,
            type: 3 /* TYPE_VALUE */,
            format: 'color'
        };

        var webkitTextStrokeWidth = {
            name: "-webkit-text-stroke-width",
            initialValue: '0',
            type: 0 /* VALUE */,
            prefix: false,
            parse: function (_context, token) {
                if (isDimensionToken(token)) {
                    return token.number;
                }
                return 0;
            }
        };

        var CSSParsedDeclaration = /** @class */ (function () {
            function CSSParsedDeclaration(context, declaration) {
                var _a, _b;
                this.animationDuration = parse(context, duration, declaration.animationDuration);
                this.backgroundClip = parse(context, backgroundClip, declaration.backgroundClip);
                this.backgroundColor = parse(context, backgroundColor, declaration.backgroundColor);
                this.backgroundImage = parse(context, backgroundImage, declaration.backgroundImage);
                this.backgroundOrigin = parse(context, backgroundOrigin, declaration.backgroundOrigin);
                this.backgroundPosition = parse(context, backgroundPosition, declaration.backgroundPosition);
                this.backgroundRepeat = parse(context, backgroundRepeat, declaration.backgroundRepeat);
                this.backgroundSize = parse(context, backgroundSize, declaration.backgroundSize);
                this.borderTopColor = parse(context, borderTopColor, declaration.borderTopColor);
                this.borderRightColor = parse(context, borderRightColor, declaration.borderRightColor);
                this.borderBottomColor = parse(context, borderBottomColor, declaration.borderBottomColor);
                this.borderLeftColor = parse(context, borderLeftColor, declaration.borderLeftColor);
                this.borderTopLeftRadius = parse(context, borderTopLeftRadius, declaration.borderTopLeftRadius);
                this.borderTopRightRadius = parse(context, borderTopRightRadius, declaration.borderTopRightRadius);
                this.borderBottomRightRadius = parse(context, borderBottomRightRadius, declaration.borderBottomRightRadius);
                this.borderBottomLeftRadius = parse(context, borderBottomLeftRadius, declaration.borderBottomLeftRadius);
                this.borderTopStyle = parse(context, borderTopStyle, declaration.borderTopStyle);
                this.borderRightStyle = parse(context, borderRightStyle, declaration.borderRightStyle);
                this.borderBottomStyle = parse(context, borderBottomStyle, declaration.borderBottomStyle);
                this.borderLeftStyle = parse(context, borderLeftStyle, declaration.borderLeftStyle);
                this.borderTopWidth = parse(context, borderTopWidth, declaration.borderTopWidth);
                this.borderRightWidth = parse(context, borderRightWidth, declaration.borderRightWidth);
                this.borderBottomWidth = parse(context, borderBottomWidth, declaration.borderBottomWidth);
                this.borderLeftWidth = parse(context, borderLeftWidth, declaration.borderLeftWidth);
                this.boxShadow = parse(context, boxShadow, declaration.boxShadow);
                this.color = parse(context, color, declaration.color);
                this.direction = parse(context, direction, declaration.direction);
                this.display = parse(context, display, declaration.display);
                this.float = parse(context, float, declaration.cssFloat);
                this.fontFamily = parse(context, fontFamily, declaration.fontFamily);
                this.fontSize = parse(context, fontSize, declaration.fontSize);
                this.fontStyle = parse(context, fontStyle, declaration.fontStyle);
                this.fontVariant = parse(context, fontVariant, declaration.fontVariant);
                this.fontWeight = parse(context, fontWeight, declaration.fontWeight);
                this.letterSpacing = parse(context, letterSpacing, declaration.letterSpacing);
                this.lineBreak = parse(context, lineBreak, declaration.lineBreak);
                this.lineHeight = parse(context, lineHeight, declaration.lineHeight);
                this.listStyleImage = parse(context, listStyleImage, declaration.listStyleImage);
                this.listStylePosition = parse(context, listStylePosition, declaration.listStylePosition);
                this.listStyleType = parse(context, listStyleType, declaration.listStyleType);
                this.marginTop = parse(context, marginTop, declaration.marginTop);
                this.marginRight = parse(context, marginRight, declaration.marginRight);
                this.marginBottom = parse(context, marginBottom, declaration.marginBottom);
                this.marginLeft = parse(context, marginLeft, declaration.marginLeft);
                this.opacity = parse(context, opacity, declaration.opacity);
                var overflowTuple = parse(context, overflow, declaration.overflow);
                this.overflowX = overflowTuple[0];
                this.overflowY = overflowTuple[overflowTuple.length > 1 ? 1 : 0];
                this.overflowWrap = parse(context, overflowWrap, declaration.overflowWrap);
                this.paddingTop = parse(context, paddingTop, declaration.paddingTop);
                this.paddingRight = parse(context, paddingRight, declaration.paddingRight);
                this.paddingBottom = parse(context, paddingBottom, declaration.paddingBottom);
                this.paddingLeft = parse(context, paddingLeft, declaration.paddingLeft);
                this.paintOrder = parse(context, paintOrder, declaration.paintOrder);
                this.position = parse(context, position, declaration.position);
                this.textAlign = parse(context, textAlign, declaration.textAlign);
                this.textDecorationColor = parse(context, textDecorationColor, (_a = declaration.textDecorationColor) !== null && _a !== void 0 ? _a : declaration.color);
                this.textDecorationLine = parse(context, textDecorationLine, (_b = declaration.textDecorationLine) !== null && _b !== void 0 ? _b : declaration.textDecoration);
                this.textShadow = parse(context, textShadow, declaration.textShadow);
                this.textTransform = parse(context, textTransform, declaration.textTransform);
                this.transform = parse(context, transform$1, declaration.transform);
                this.transformOrigin = parse(context, transformOrigin, declaration.transformOrigin);
                this.visibility = parse(context, visibility, declaration.visibility);
                this.webkitTextStrokeColor = parse(context, webkitTextStrokeColor, declaration.webkitTextStrokeColor);
                this.webkitTextStrokeWidth = parse(context, webkitTextStrokeWidth, declaration.webkitTextStrokeWidth);
                this.wordBreak = parse(context, wordBreak, declaration.wordBreak);
                this.zIndex = parse(context, zIndex, declaration.zIndex);
            }
            CSSParsedDeclaration.prototype.isVisible = function () {
                return this.display > 0 && this.opacity > 0 && this.visibility === 0 /* VISIBLE */;
            };
            CSSParsedDeclaration.prototype.isTransparent = function () {
                return isTransparent(this.backgroundColor);
            };
            CSSParsedDeclaration.prototype.isTransformed = function () {
                return this.transform !== null;
            };
            CSSParsedDeclaration.prototype.isPositioned = function () {
                return this.position !== 0 /* STATIC */;
            };
            CSSParsedDeclaration.prototype.isPositionedWithZIndex = function () {
                return this.isPositioned() && !this.zIndex.auto;
            };
            CSSParsedDeclaration.prototype.isFloating = function () {
                return this.float !== 0 /* NONE */;
            };
            CSSParsedDeclaration.prototype.isInlineLevel = function () {
                return (contains(this.display, 4 /* INLINE */) ||
                    contains(this.display, 33554432 /* INLINE_BLOCK */) ||
                    contains(this.display, 268435456 /* INLINE_FLEX */) ||
                    contains(this.display, 536870912 /* INLINE_GRID */) ||
                    contains(this.display, 67108864 /* INLINE_LIST_ITEM */) ||
                    contains(this.display, 134217728 /* INLINE_TABLE */));
            };
            return CSSParsedDeclaration;
        }());
        var CSSParsedPseudoDeclaration = /** @class */ (function () {
            function CSSParsedPseudoDeclaration(context, declaration) {
                this.content = parse(context, content, declaration.content);
                this.quotes = parse(context, quotes, declaration.quotes);
            }
            return CSSParsedPseudoDeclaration;
        }());
        var CSSParsedCounterDeclaration = /** @class */ (function () {
            function CSSParsedCounterDeclaration(context, declaration) {
                this.counterIncrement = parse(context, counterIncrement, declaration.counterIncrement);
                this.counterReset = parse(context, counterReset, declaration.counterReset);
            }
            return CSSParsedCounterDeclaration;
        }());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        var parse = function (context, descriptor, style) {
            var tokenizer = new Tokenizer();
            var value = style !== null && typeof style !== 'undefined' ? style.toString() : descriptor.initialValue;
            tokenizer.write(value);
            var parser = new Parser(tokenizer.read());
            switch (descriptor.type) {
                case 2 /* IDENT_VALUE */:
                    var token = parser.parseComponentValue();
                    return descriptor.parse(context, isIdentToken(token) ? token.value : descriptor.initialValue);
                case 0 /* VALUE */:
                    return descriptor.parse(context, parser.parseComponentValue());
                case 1 /* LIST */:
                    return descriptor.parse(context, parser.parseComponentValues());
                case 4 /* TOKEN_VALUE */:
                    return parser.parseComponentValue();
                case 3 /* TYPE_VALUE */:
                    switch (descriptor.format) {
                        case 'angle':
                            return angle.parse(context, parser.parseComponentValue());
                        case 'color':
                            return color$1.parse(context, parser.parseComponentValue());
                        case 'image':
                            return image.parse(context, parser.parseComponentValue());
                        case 'length':
                            var length_1 = parser.parseComponentValue();
                            return isLength(length_1) ? length_1 : ZERO_LENGTH;
                        case 'length-percentage':
                            var value_1 = parser.parseComponentValue();
                            return isLengthPercentage(value_1) ? value_1 : ZERO_LENGTH;
                        case 'time':
                            return time.parse(context, parser.parseComponentValue());
                    }
                    break;
            }
        };

        var elementDebuggerAttribute = 'data-html2canvas-debug';
        var getElementDebugType = function (element) {
            var attribute = element.getAttribute(elementDebuggerAttribute);
            switch (attribute) {
                case 'all':
                    return 1 /* ALL */;
                case 'clone':
                    return 2 /* CLONE */;
                case 'parse':
                    return 3 /* PARSE */;
                case 'render':
                    return 4 /* RENDER */;
                default:
                    return 0 /* NONE */;
            }
        };
        var isDebugging = function (element, type) {
            var elementType = getElementDebugType(element);
            return elementType === 1 /* ALL */ || type === elementType;
        };

        var ElementContainer = /** @class */ (function () {
            function ElementContainer(context, element) {
                this.context = context;
                this.textNodes = [];
                this.elements = [];
                this.flags = 0;
                if (isDebugging(element, 3 /* PARSE */)) {
                    debugger;
                }
                this.styles = new CSSParsedDeclaration(context, window.getComputedStyle(element, null));
                if (isHTMLElementNode(element)) {
                    if (this.styles.animationDuration.some(function (duration) { return duration > 0; })) {
                        element.style.animationDuration = '0s';
                    }
                    if (this.styles.transform !== null) {
                        // getBoundingClientRect takes transforms into account
                        element.style.transform = 'none';
                    }
                }
                this.bounds = parseBounds(this.context, element);
                if (isDebugging(element, 4 /* RENDER */)) {
                    this.flags |= 16 /* DEBUG_RENDER */;
                }
            }
            return ElementContainer;
        }());

        /*
         * text-segmentation 1.0.3 <https://github.com/niklasvh/text-segmentation>
         * Copyright (c) 2022 Niklas von Hertzen <https://hertzen.com>
         * Released under MIT License
         */
        var base64 = 'AAAAAAAAAAAAEA4AGBkAAFAaAAACAAAAAAAIABAAGAAwADgACAAQAAgAEAAIABAACAAQAAgAEAAIABAACAAQAAgAEAAIABAAQABIAEQATAAIABAACAAQAAgAEAAIABAAVABcAAgAEAAIABAACAAQAGAAaABwAHgAgACIAI4AlgAIABAAmwCjAKgAsAC2AL4AvQDFAMoA0gBPAVYBWgEIAAgACACMANoAYgFkAWwBdAF8AX0BhQGNAZUBlgGeAaMBlQGWAasBswF8AbsBwwF0AcsBYwHTAQgA2wG/AOMBdAF8AekB8QF0AfkB+wHiAHQBfAEIAAMC5gQIAAsCEgIIAAgAFgIeAggAIgIpAggAMQI5AkACygEIAAgASAJQAlgCYAIIAAgACAAKBQoFCgUTBRMFGQUrBSsFCAAIAAgACAAIAAgACAAIAAgACABdAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACABoAmgCrwGvAQgAbgJ2AggAHgEIAAgACADnAXsCCAAIAAgAgwIIAAgACAAIAAgACACKAggAkQKZAggAPADJAAgAoQKkAqwCsgK6AsICCADJAggA0AIIAAgACAAIANYC3gIIAAgACAAIAAgACABAAOYCCAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAkASoB+QIEAAgACAA8AEMCCABCBQgACABJBVAFCAAIAAgACAAIAAgACAAIAAgACABTBVoFCAAIAFoFCABfBWUFCAAIAAgACAAIAAgAbQUIAAgACAAIAAgACABzBXsFfQWFBYoFigWKBZEFigWKBYoFmAWfBaYFrgWxBbkFCAAIAAgACAAIAAgACAAIAAgACAAIAMEFCAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAMgFCADQBQgACAAIAAgACAAIAAgACAAIAAgACAAIAO4CCAAIAAgAiQAIAAgACABAAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAD0AggACAD8AggACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIANYFCAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAMDvwAIAAgAJAIIAAgACAAIAAgACAAIAAgACwMTAwgACAB9BOsEGwMjAwgAKwMyAwsFYgE3A/MEPwMIAEUDTQNRAwgAWQOsAGEDCAAIAAgACAAIAAgACABpAzQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFOgU0BTUFNgU3BTgFOQU6BTQFNQU2BTcFOAU5BToFNAU1BTYFNwU4BTkFIQUoBSwFCAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACABtAwgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACABMAEwACAAIAAgACAAIABgACAAIAAgACAC/AAgACAAyAQgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACACAAIAAwAAgACAAIAAgACAAIAAgACAAIAAAARABIAAgACAAIABQASAAIAAgAIABwAEAAjgCIABsAqAC2AL0AigDQAtwC+IJIQqVAZUBWQqVAZUBlQGVAZUBlQGrC5UBlQGVAZUBlQGVAZUBlQGVAXsKlQGVAbAK6wsrDGUMpQzlDJUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAZUBlQGVAfAKAAuZA64AtwCJALoC6ADwAAgAuACgA/oEpgO6AqsD+AAIAAgAswMIAAgACAAIAIkAuwP5AfsBwwPLAwgACAAIAAgACADRA9kDCAAIAOED6QMIAAgACAAIAAgACADuA/YDCAAIAP4DyQAIAAgABgQIAAgAXQAOBAgACAAIAAgACAAIABMECAAIAAgACAAIAAgACAD8AAQBCAAIAAgAGgQiBCoECAExBAgAEAEIAAgACAAIAAgACAAIAAgACAAIAAgACAA4BAgACABABEYECAAIAAgATAQYAQgAVAQIAAgACAAIAAgACAAIAAgACAAIAFoECAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgAOQEIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAB+BAcACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAEABhgSMBAgACAAIAAgAlAQIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAwAEAAQABAADAAMAAwADAAQABAAEAAQABAAEAAQABHATAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgAdQMIAAgACAAIAAgACAAIAMkACAAIAAgAfQMIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACACFA4kDCAAIAAgACAAIAOcBCAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAIcDCAAIAAgACAAIAAgACAAIAAgACAAIAJEDCAAIAAgACADFAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACABgBAgAZgQIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgAbAQCBXIECAAIAHkECAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACABAAJwEQACjBKoEsgQIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAC6BMIECAAIAAgACAAIAAgACABmBAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgAxwQIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAGYECAAIAAgAzgQIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgAigWKBYoFigWKBYoFigWKBd0FXwUIAOIF6gXxBYoF3gT5BQAGCAaKBYoFigWKBYoFigWKBYoFigWKBYoFigXWBIoFigWKBYoFigWKBYoFigWKBYsFEAaKBYoFigWKBYoFigWKBRQGCACKBYoFigWKBQgACAAIANEECAAIABgGigUgBggAJgYIAC4GMwaKBYoF0wQ3Bj4GigWKBYoFigWKBYoFigWKBYoFigWKBYoFigUIAAgACAAIAAgACAAIAAgAigWKBYoFigWKBYoFigWKBYoFigWKBYoFigWKBYoFigWKBYoFigWKBYoFigWKBYoFigWKBYoFigWKBYoFigWLBf///////wQABAAEAAQABAAEAAQABAAEAAQAAwAEAAQAAgAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAQADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAUABQAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAAAUAAAAFAAUAAAAFAAUAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEAAQABAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAUABQAFAAUABQAFAAUABQAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAUABQAFAAUAAQAAAAUABQAFAAUABQAFAAAAAAAFAAUAAAAFAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAFAAUABQAFAAUABQAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAFAAUABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAFAAUAAQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABwAFAAUABQAFAAAABwAHAAcAAAAHAAcABwAFAAEAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAcABwAFAAUABQAFAAcABwAFAAUAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAQABAAAAAAAAAAAAAAAFAAUABQAFAAAABwAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAHAAcABwAHAAcAAAAHAAcAAAAAAAUABQAHAAUAAQAHAAEABwAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAUABQAFAAUABwABAAUABQAFAAUAAAAAAAAAAAAAAAEAAQABAAEAAQABAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABwAFAAUAAAAAAAAAAAAAAAAABQAFAAUABQAFAAUAAQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQABQANAAQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQABAAEAAQABAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEAAQABAAEAAQABAAEAAQABAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAQABAAEAAQABAAEAAQABAAAAAAAAAAAAAAAAAAAAAAABQAHAAUABQAFAAAAAAAAAAcABQAFAAUABQAFAAQABAAEAAQABAAEAAQABAAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAEAAQABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAUAAAAFAAUABQAFAAUAAAAFAAUABQAAAAUABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAAAAAAAAAAAAUABQAFAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAHAAUAAAAHAAcABwAFAAUABQAFAAUABQAFAAUABwAHAAcABwAFAAcABwAAAAUABQAFAAUABQAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABwAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAUABwAHAAUABQAFAAUAAAAAAAcABwAAAAAABwAHAAUAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAABQAFAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAABwAHAAcABQAFAAAAAAAAAAAABQAFAAAAAAAFAAUABQAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAFAAUABQAFAAUAAAAFAAUABwAAAAcABwAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAFAAUABwAFAAUABQAFAAAAAAAHAAcAAAAAAAcABwAFAAAAAAAAAAAAAAAAAAAABQAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAcABwAAAAAAAAAHAAcABwAAAAcABwAHAAUAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAABQAHAAcABwAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABwAHAAcABwAAAAUABQAFAAAABQAFAAUABQAAAAAAAAAAAAAAAAAAAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAcABQAHAAcABQAHAAcAAAAFAAcABwAAAAcABwAFAAUAAAAAAAAAAAAAAAAAAAAFAAUAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAcABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAAAAUABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAFAAcABwAFAAUABQAAAAUAAAAHAAcABwAHAAcABwAHAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAHAAUABQAFAAUABQAFAAUAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAUABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAABwAFAAUABQAFAAUABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAUABQAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAUAAAAFAAAAAAAAAAAABwAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABwAFAAUABQAFAAUAAAAFAAUAAAAAAAAAAAAAAAUABQAFAAUABQAFAAUABQAFAAUABQAAAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAUABwAFAAUABQAFAAUABQAAAAUABQAHAAcABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAcABQAFAAAAAAAAAAAABQAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAcABQAFAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAHAAUABQAFAAUABQAFAAUABwAHAAcABwAHAAcABwAHAAUABwAHAAUABQAFAAUABQAFAAUABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAUABwAHAAcABwAFAAUABwAHAAcAAAAAAAAAAAAHAAcABQAHAAcABwAHAAcABwAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAcABwAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcABQAHAAUABQAFAAUABQAFAAUAAAAFAAAABQAAAAAABQAFAAUABQAFAAUABQAFAAcABwAHAAcABwAHAAUABQAFAAUABQAFAAUABQAFAAUAAAAAAAUABQAFAAUABQAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAUABQAFAAUABwAFAAcABwAHAAcABwAFAAcABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAFAAUABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAUABQAFAAUABwAHAAUABQAHAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAcABQAFAAcABwAHAAUABwAFAAUABQAHAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAHAAcABwAHAAcABwAHAAUABQAFAAUABQAFAAUABQAHAAcABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAUAAAAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAcABQAFAAUABQAFAAUABQAAAAAAAAAAAAUAAAAAAAAAAAAAAAAABQAAAAAABwAFAAUAAAAAAAAAAAAAAAAABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAAABQAFAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAUABQAFAAUADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAUAAAAFAAUABQAFAAUABQAFAAUABQAFAAAAAAAAAAAABQAAAAAAAAAFAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAHAAUABQAHAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcABwAHAAcABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAABQAFAAUABQAFAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAUABQAFAAUABQAFAAUABQAHAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAcABwAFAAUABQAFAAcABwAFAAUABwAHAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAUABQAFAAcABwAFAAUABwAHAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAFAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAFAAUABQAAAAAABQAFAAAAAAAAAAAAAAAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcABQAFAAcABwAAAAAAAAAAAAAABwAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcABwAFAAcABwAFAAcABwAAAAcABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAUABQAAAAAAAAAAAAAAAAAFAAUABQAAAAUABQAAAAAAAAAAAAAABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcABQAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAFAAUABwAFAAUABQAFAAUABQAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAHAAcABQAFAAUABQAFAAUABQAFAAUABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAcABwAFAAUABQAHAAcABQAHAAUABQAAAAAAAAAAAAAAAAAFAAAABwAHAAcABQAFAAUABQAFAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABwAHAAcABwAAAAAABwAHAAAAAAAHAAcABwAAAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAHAAAAAAAFAAUABQAFAAUABQAFAAAAAAAAAAUABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAcABwAFAAUABQAFAAUABQAFAAUABwAHAAUABQAFAAcABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAHAAcABQAFAAUABQAFAAUABwAFAAcABwAFAAcABQAFAAcABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAHAAcABQAFAAUABQAAAAAABwAHAAcABwAFAAUABwAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcABwAHAAUABQAFAAUABQAFAAUABQAHAAcABQAHAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABwAFAAcABwAFAAUABQAFAAUABQAHAAUAAAAAAAAAAAAAAAAAAAAAAAcABwAFAAUABQAFAAcABQAFAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAcABwAFAAUABQAFAAUABQAFAAUABQAHAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAcABwAFAAUABQAFAAAAAAAFAAUABwAHAAcABwAFAAAAAAAAAAcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAFAAUABQAFAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAUABQAFAAUABwAHAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcABQAFAAUABQAFAAUABQAAAAUABQAFAAUABQAFAAcABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUAAAAHAAUABQAFAAUABQAFAAUABwAFAAUABwAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAUABQAFAAUAAAAAAAAABQAAAAUABQAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAcABwAHAAcAAAAFAAUAAAAHAAcABQAHAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABwAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAFAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAAAAAAAAAAAAAAAAAAABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAAAAUABQAFAAAAAAAFAAUABQAFAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAAAAAAAAAAABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUABQAFAAUABQAAAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAUABQAFAAUABQAAAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAFAAUABQAAAAAABQAFAAUABQAFAAUABQAAAAUABQAAAAUABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFAAUABQAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABQAFAAUABQAFAAUABQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAFAAUABQAFAAUADgAOAA4ADgAOAA4ADwAPAA8ADwAPAA8ADwAPAA8ADwAPAA8ADwAPAA8ADwAPAA8ADwAPAA8ADwAPAA8ADwAPAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAgACAAIAAAAAAAAAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAKAAoACgAKAAoACgAKAAoACgAKAAoACgAKAAoACgAKAAoACgAKAAoACgAKAAoACgAMAAwADAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAAAAAAAAAAAAKAAoACgAKAAoACgAKAAoACgAKAAoACgAKAAoACgAKAAoACgAKAAoACgAKAAoACgAKAAoACgAKAAoACgAKAAoACgAAAAAAAAAAAAsADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwACwAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAMAAwADAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAA4ADgAOAA4ADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4ADgAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAOAA4ADgAOAA4ADgAOAA4ADgAOAAAAAAAAAAAADgAOAA4AAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAOAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAOAA4ADgAAAA4ADgAOAA4ADgAOAAAADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4AAAAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4AAAAAAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAAAA4AAAAOAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAA4ADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAADgAAAAAAAAAAAA4AAAAOAAAAAAAAAAAADgAOAA4AAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAA4ADgAOAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAA4ADgAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4ADgAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAA4ADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4ADgAOAA4ADgAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4ADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAADgAOAA4ADgAOAA4ADgAOAA4ADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAAAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAA4ADgAOAA4ADgAOAA4ADgAOAAAADgAOAA4ADgAAAAAAAAAAAAAAAAAAAAAAAAAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4AAAAAAAAAAAAAAAAADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAA4ADgAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAOAA4ADgAOAA4ADgAOAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAOAA4ADgAOAA4AAAAAAAAAAAAAAAAAAAAAAA4ADgAOAA4ADgAOAA4ADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4AAAAOAA4ADgAOAA4ADgAAAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4AAAAAAAAAAAA=';

        /*
         * utrie 1.0.2 <https://github.com/niklasvh/utrie>
         * Copyright (c) 2022 Niklas von Hertzen <https://hertzen.com>
         * Released under MIT License
         */
        var chars$1 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        // Use a lookup table to find the index.
        var lookup$1 = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
        for (var i$1 = 0; i$1 < chars$1.length; i$1++) {
            lookup$1[chars$1.charCodeAt(i$1)] = i$1;
        }
        var decode = function (base64) {
            var bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
            if (base64[base64.length - 1] === '=') {
                bufferLength--;
                if (base64[base64.length - 2] === '=') {
                    bufferLength--;
                }
            }
            var buffer = typeof ArrayBuffer !== 'undefined' &&
                typeof Uint8Array !== 'undefined' &&
                typeof Uint8Array.prototype.slice !== 'undefined'
                ? new ArrayBuffer(bufferLength)
                : new Array(bufferLength);
            var bytes = Array.isArray(buffer) ? buffer : new Uint8Array(buffer);
            for (i = 0; i < len; i += 4) {
                encoded1 = lookup$1[base64.charCodeAt(i)];
                encoded2 = lookup$1[base64.charCodeAt(i + 1)];
                encoded3 = lookup$1[base64.charCodeAt(i + 2)];
                encoded4 = lookup$1[base64.charCodeAt(i + 3)];
                bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
                bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
                bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
            }
            return buffer;
        };
        var polyUint16Array = function (buffer) {
            var length = buffer.length;
            var bytes = [];
            for (var i = 0; i < length; i += 2) {
                bytes.push((buffer[i + 1] << 8) | buffer[i]);
            }
            return bytes;
        };
        var polyUint32Array = function (buffer) {
            var length = buffer.length;
            var bytes = [];
            for (var i = 0; i < length; i += 4) {
                bytes.push((buffer[i + 3] << 24) | (buffer[i + 2] << 16) | (buffer[i + 1] << 8) | buffer[i]);
            }
            return bytes;
        };

        /** Shift size for getting the index-2 table offset. */
        var UTRIE2_SHIFT_2 = 5;
        /** Shift size for getting the index-1 table offset. */
        var UTRIE2_SHIFT_1 = 6 + 5;
        /**
         * Shift size for shifting left the index array values.
         * Increases possible data size with 16-bit index values at the cost
         * of compactability.
         * This requires data blocks to be aligned by UTRIE2_DATA_GRANULARITY.
         */
        var UTRIE2_INDEX_SHIFT = 2;
        /**
         * Difference between the two shift sizes,
         * for getting an index-1 offset from an index-2 offset. 6=11-5
         */
        var UTRIE2_SHIFT_1_2 = UTRIE2_SHIFT_1 - UTRIE2_SHIFT_2;
        /**
         * The part of the index-2 table for U+D800..U+DBFF stores values for
         * lead surrogate code _units_ not code _points_.
         * Values for lead surrogate code _points_ are indexed with this portion of the table.
         * Length=32=0x20=0x400>>UTRIE2_SHIFT_2. (There are 1024=0x400 lead surrogates.)
         */
        var UTRIE2_LSCP_INDEX_2_OFFSET = 0x10000 >> UTRIE2_SHIFT_2;
        /** Number of entries in a data block. 32=0x20 */
        var UTRIE2_DATA_BLOCK_LENGTH = 1 << UTRIE2_SHIFT_2;
        /** Mask for getting the lower bits for the in-data-block offset. */
        var UTRIE2_DATA_MASK = UTRIE2_DATA_BLOCK_LENGTH - 1;
        var UTRIE2_LSCP_INDEX_2_LENGTH = 0x400 >> UTRIE2_SHIFT_2;
        /** Count the lengths of both BMP pieces. 2080=0x820 */
        var UTRIE2_INDEX_2_BMP_LENGTH = UTRIE2_LSCP_INDEX_2_OFFSET + UTRIE2_LSCP_INDEX_2_LENGTH;
        /**
         * The 2-byte UTF-8 version of the index-2 table follows at offset 2080=0x820.
         * Length 32=0x20 for lead bytes C0..DF, regardless of UTRIE2_SHIFT_2.
         */
        var UTRIE2_UTF8_2B_INDEX_2_OFFSET = UTRIE2_INDEX_2_BMP_LENGTH;
        var UTRIE2_UTF8_2B_INDEX_2_LENGTH = 0x800 >> 6; /* U+0800 is the first code point after 2-byte UTF-8 */
        /**
         * The index-1 table, only used for supplementary code points, at offset 2112=0x840.
         * Variable length, for code points up to highStart, where the last single-value range starts.
         * Maximum length 512=0x200=0x100000>>UTRIE2_SHIFT_1.
         * (For 0x100000 supplementary code points U+10000..U+10ffff.)
         *
         * The part of the index-2 table for supplementary code points starts
         * after this index-1 table.
         *
         * Both the index-1 table and the following part of the index-2 table
         * are omitted completely if there is only BMP data.
         */
        var UTRIE2_INDEX_1_OFFSET = UTRIE2_UTF8_2B_INDEX_2_OFFSET + UTRIE2_UTF8_2B_INDEX_2_LENGTH;
        /**
         * Number of index-1 entries for the BMP. 32=0x20
         * This part of the index-1 table is omitted from the serialized form.
         */
        var UTRIE2_OMITTED_BMP_INDEX_1_LENGTH = 0x10000 >> UTRIE2_SHIFT_1;
        /** Number of entries in an index-2 block. 64=0x40 */
        var UTRIE2_INDEX_2_BLOCK_LENGTH = 1 << UTRIE2_SHIFT_1_2;
        /** Mask for getting the lower bits for the in-index-2-block offset. */
        var UTRIE2_INDEX_2_MASK = UTRIE2_INDEX_2_BLOCK_LENGTH - 1;
        var slice16 = function (view, start, end) {
            if (view.slice) {
                return view.slice(start, end);
            }
            return new Uint16Array(Array.prototype.slice.call(view, start, end));
        };
        var slice32 = function (view, start, end) {
            if (view.slice) {
                return view.slice(start, end);
            }
            return new Uint32Array(Array.prototype.slice.call(view, start, end));
        };
        var createTrieFromBase64 = function (base64, _byteLength) {
            var buffer = decode(base64);
            var view32 = Array.isArray(buffer) ? polyUint32Array(buffer) : new Uint32Array(buffer);
            var view16 = Array.isArray(buffer) ? polyUint16Array(buffer) : new Uint16Array(buffer);
            var headerLength = 24;
            var index = slice16(view16, headerLength / 2, view32[4] / 2);
            var data = view32[5] === 2
                ? slice16(view16, (headerLength + view32[4]) / 2)
                : slice32(view32, Math.ceil((headerLength + view32[4]) / 4));
            return new Trie(view32[0], view32[1], view32[2], view32[3], index, data);
        };
        var Trie = /** @class */ (function () {
            function Trie(initialValue, errorValue, highStart, highValueIndex, index, data) {
                this.initialValue = initialValue;
                this.errorValue = errorValue;
                this.highStart = highStart;
                this.highValueIndex = highValueIndex;
                this.index = index;
                this.data = data;
            }
            /**
             * Get the value for a code point as stored in the Trie.
             *
             * @param codePoint the code point
             * @return the value
             */
            Trie.prototype.get = function (codePoint) {
                var ix;
                if (codePoint >= 0) {
                    if (codePoint < 0x0d800 || (codePoint > 0x0dbff && codePoint <= 0x0ffff)) {
                        // Ordinary BMP code point, excluding leading surrogates.
                        // BMP uses a single level lookup.  BMP index starts at offset 0 in the Trie2 index.
                        // 16 bit data is stored in the index array itself.
                        ix = this.index[codePoint >> UTRIE2_SHIFT_2];
                        ix = (ix << UTRIE2_INDEX_SHIFT) + (codePoint & UTRIE2_DATA_MASK);
                        return this.data[ix];
                    }
                    if (codePoint <= 0xffff) {
                        // Lead Surrogate Code Point.  A Separate index section is stored for
                        // lead surrogate code units and code points.
                        //   The main index has the code unit data.
                        //   For this function, we need the code point data.
                        // Note: this expression could be refactored for slightly improved efficiency, but
                        //       surrogate code points will be so rare in practice that it's not worth it.
                        ix = this.index[UTRIE2_LSCP_INDEX_2_OFFSET + ((codePoint - 0xd800) >> UTRIE2_SHIFT_2)];
                        ix = (ix << UTRIE2_INDEX_SHIFT) + (codePoint & UTRIE2_DATA_MASK);
                        return this.data[ix];
                    }
                    if (codePoint < this.highStart) {
                        // Supplemental code point, use two-level lookup.
                        ix = UTRIE2_INDEX_1_OFFSET - UTRIE2_OMITTED_BMP_INDEX_1_LENGTH + (codePoint >> UTRIE2_SHIFT_1);
                        ix = this.index[ix];
                        ix += (codePoint >> UTRIE2_SHIFT_2) & UTRIE2_INDEX_2_MASK;
                        ix = this.index[ix];
                        ix = (ix << UTRIE2_INDEX_SHIFT) + (codePoint & UTRIE2_DATA_MASK);
                        return this.data[ix];
                    }
                    if (codePoint <= 0x10ffff) {
                        return this.data[this.highValueIndex];
                    }
                }
                // Fall through.  The code point is outside of the legal range of 0..0x10ffff.
                return this.errorValue;
            };
            return Trie;
        }());

        /*
         * base64-arraybuffer 1.0.2 <https://github.com/niklasvh/base64-arraybuffer>
         * Copyright (c) 2022 Niklas von Hertzen <https://hertzen.com>
         * Released under MIT License
         */
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        // Use a lookup table to find the index.
        var lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
        for (var i = 0; i < chars.length; i++) {
            lookup[chars.charCodeAt(i)] = i;
        }

        var Prepend = 1;
        var CR = 2;
        var LF = 3;
        var Control = 4;
        var Extend = 5;
        var SpacingMark = 7;
        var L = 8;
        var V = 9;
        var T = 10;
        var LV = 11;
        var LVT = 12;
        var ZWJ = 13;
        var Extended_Pictographic = 14;
        var RI = 15;
        var toCodePoints = function (str) {
            var codePoints = [];
            var i = 0;
            var length = str.length;
            while (i < length) {
                var value = str.charCodeAt(i++);
                if (value >= 0xd800 && value <= 0xdbff && i < length) {
                    var extra = str.charCodeAt(i++);
                    if ((extra & 0xfc00) === 0xdc00) {
                        codePoints.push(((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000);
                    }
                    else {
                        codePoints.push(value);
                        i--;
                    }
                }
                else {
                    codePoints.push(value);
                }
            }
            return codePoints;
        };
        var fromCodePoint = function () {
            var codePoints = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                codePoints[_i] = arguments[_i];
            }
            if (String.fromCodePoint) {
                return String.fromCodePoint.apply(String, codePoints);
            }
            var length = codePoints.length;
            if (!length) {
                return '';
            }
            var codeUnits = [];
            var index = -1;
            var result = '';
            while (++index < length) {
                var codePoint = codePoints[index];
                if (codePoint <= 0xffff) {
                    codeUnits.push(codePoint);
                }
                else {
                    codePoint -= 0x10000;
                    codeUnits.push((codePoint >> 10) + 0xd800, (codePoint % 0x400) + 0xdc00);
                }
                if (index + 1 === length || codeUnits.length > 0x4000) {
                    result += String.fromCharCode.apply(String, codeUnits);
                    codeUnits.length = 0;
                }
            }
            return result;
        };
        var UnicodeTrie = createTrieFromBase64(base64);
        var BREAK_NOT_ALLOWED = '×';
        var BREAK_ALLOWED = '÷';
        var codePointToClass = function (codePoint) { return UnicodeTrie.get(codePoint); };
        var _graphemeBreakAtIndex = function (_codePoints, classTypes, index) {
            var prevIndex = index - 2;
            var prev = classTypes[prevIndex];
            var current = classTypes[index - 1];
            var next = classTypes[index];
            // GB3 Do not break between a CR and LF
            if (current === CR && next === LF) {
                return BREAK_NOT_ALLOWED;
            }
            // GB4 Otherwise, break before and after controls.
            if (current === CR || current === LF || current === Control) {
                return BREAK_ALLOWED;
            }
            // GB5
            if (next === CR || next === LF || next === Control) {
                return BREAK_ALLOWED;
            }
            // Do not break Hangul syllable sequences.
            // GB6
            if (current === L && [L, V, LV, LVT].indexOf(next) !== -1) {
                return BREAK_NOT_ALLOWED;
            }
            // GB7
            if ((current === LV || current === V) && (next === V || next === T)) {
                return BREAK_NOT_ALLOWED;
            }
            // GB8
            if ((current === LVT || current === T) && next === T) {
                return BREAK_NOT_ALLOWED;
            }
            // GB9 Do not break before extending characters or ZWJ.
            if (next === ZWJ || next === Extend) {
                return BREAK_NOT_ALLOWED;
            }
            // Do not break before SpacingMarks, or after Prepend characters.
            // GB9a
            if (next === SpacingMark) {
                return BREAK_NOT_ALLOWED;
            }
            // GB9a
            if (current === Prepend) {
                return BREAK_NOT_ALLOWED;
            }
            // GB11 Do not break within emoji modifier sequences or emoji zwj sequences.
            if (current === ZWJ && next === Extended_Pictographic) {
                while (prev === Extend) {
                    prev = classTypes[--prevIndex];
                }
                if (prev === Extended_Pictographic) {
                    return BREAK_NOT_ALLOWED;
                }
            }
            // GB12 Do not break within emoji flag sequences.
            // That is, do not break between regional indicator (RI) symbols
            // if there is an odd number of RI characters before the break point.
            if (current === RI && next === RI) {
                var countRI = 0;
                while (prev === RI) {
                    countRI++;
                    prev = classTypes[--prevIndex];
                }
                if (countRI % 2 === 0) {
                    return BREAK_NOT_ALLOWED;
                }
            }
            return BREAK_ALLOWED;
        };
        var GraphemeBreaker = function (str) {
            var codePoints = toCodePoints(str);
            var length = codePoints.length;
            var index = 0;
            var lastEnd = 0;
            var classTypes = codePoints.map(codePointToClass);
            return {
                next: function () {
                    if (index >= length) {
                        return { done: true, value: null };
                    }
                    var graphemeBreak = BREAK_NOT_ALLOWED;
                    while (index < length &&
                        (graphemeBreak = _graphemeBreakAtIndex(codePoints, classTypes, ++index)) === BREAK_NOT_ALLOWED) { }
                    if (graphemeBreak !== BREAK_NOT_ALLOWED || index === length) {
                        var value = fromCodePoint.apply(null, codePoints.slice(lastEnd, index));
                        lastEnd = index;
                        return { value: value, done: false };
                    }
                    return { done: true, value: null };
                },
            };
        };
        var splitGraphemes = function (str) {
            var breaker = GraphemeBreaker(str);
            var graphemes = [];
            var bk;
            while (!(bk = breaker.next()).done) {
                if (bk.value) {
                    graphemes.push(bk.value.slice());
                }
            }
            return graphemes;
        };

        var testRangeBounds = function (document) {
            var TEST_HEIGHT = 123;
            if (document.createRange) {
                var range = document.createRange();
                if (range.getBoundingClientRect) {
                    var testElement = document.createElement('boundtest');
                    testElement.style.height = TEST_HEIGHT + "px";
                    testElement.style.display = 'block';
                    document.body.appendChild(testElement);
                    range.selectNode(testElement);
                    var rangeBounds = range.getBoundingClientRect();
                    var rangeHeight = Math.round(rangeBounds.height);
                    document.body.removeChild(testElement);
                    if (rangeHeight === TEST_HEIGHT) {
                        return true;
                    }
                }
            }
            return false;
        };
        var testIOSLineBreak = function (document) {
            var testElement = document.createElement('boundtest');
            testElement.style.width = '50px';
            testElement.style.display = 'block';
            testElement.style.fontSize = '12px';
            testElement.style.letterSpacing = '0px';
            testElement.style.wordSpacing = '0px';
            document.body.appendChild(testElement);
            var range = document.createRange();
            testElement.innerHTML = typeof ''.repeat === 'function' ? '&#128104;'.repeat(10) : '';
            var node = testElement.firstChild;
            var textList = toCodePoints$1(node.data).map(function (i) { return fromCodePoint$1(i); });
            var offset = 0;
            var prev = {};
            // ios 13 does not handle range getBoundingClientRect line changes correctly #2177
            var supports = textList.every(function (text, i) {
                range.setStart(node, offset);
                range.setEnd(node, offset + text.length);
                var rect = range.getBoundingClientRect();
                offset += text.length;
                var boundAhead = rect.x > prev.x || rect.y > prev.y;
                prev = rect;
                if (i === 0) {
                    return true;
                }
                return boundAhead;
            });
            document.body.removeChild(testElement);
            return supports;
        };
        var testCORS = function () { return typeof new Image().crossOrigin !== 'undefined'; };
        var testResponseType = function () { return typeof new XMLHttpRequest().responseType === 'string'; };
        var testSVG = function (document) {
            var img = new Image();
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            if (!ctx) {
                return false;
            }
            img.src = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'></svg>";
            try {
                ctx.drawImage(img, 0, 0);
                canvas.toDataURL();
            }
            catch (e) {
                return false;
            }
            return true;
        };
        var isGreenPixel = function (data) {
            return data[0] === 0 && data[1] === 255 && data[2] === 0 && data[3] === 255;
        };
        var testForeignObject = function (document) {
            var canvas = document.createElement('canvas');
            var size = 100;
            canvas.width = size;
            canvas.height = size;
            var ctx = canvas.getContext('2d');
            if (!ctx) {
                return Promise.reject(false);
            }
            ctx.fillStyle = 'rgb(0, 255, 0)';
            ctx.fillRect(0, 0, size, size);
            var img = new Image();
            var greenImageSrc = canvas.toDataURL();
            img.src = greenImageSrc;
            var svg = createForeignObjectSVG(size, size, 0, 0, img);
            ctx.fillStyle = 'red';
            ctx.fillRect(0, 0, size, size);
            return loadSerializedSVG$1(svg)
                .then(function (img) {
                ctx.drawImage(img, 0, 0);
                var data = ctx.getImageData(0, 0, size, size).data;
                ctx.fillStyle = 'red';
                ctx.fillRect(0, 0, size, size);
                var node = document.createElement('div');
                node.style.backgroundImage = "url(" + greenImageSrc + ")";
                node.style.height = size + "px";
                // Firefox 55 does not render inline <img /> tags
                return isGreenPixel(data)
                    ? loadSerializedSVG$1(createForeignObjectSVG(size, size, 0, 0, node))
                    : Promise.reject(false);
            })
                .then(function (img) {
                ctx.drawImage(img, 0, 0);
                // Edge does not render background-images
                return isGreenPixel(ctx.getImageData(0, 0, size, size).data);
            })
                .catch(function () { return false; });
        };
        var createForeignObjectSVG = function (width, height, x, y, node) {
            var xmlns = 'http://www.w3.org/2000/svg';
            var svg = document.createElementNS(xmlns, 'svg');
            var foreignObject = document.createElementNS(xmlns, 'foreignObject');
            svg.setAttributeNS(null, 'width', width.toString());
            svg.setAttributeNS(null, 'height', height.toString());
            foreignObject.setAttributeNS(null, 'width', '100%');
            foreignObject.setAttributeNS(null, 'height', '100%');
            foreignObject.setAttributeNS(null, 'x', x.toString());
            foreignObject.setAttributeNS(null, 'y', y.toString());
            foreignObject.setAttributeNS(null, 'externalResourcesRequired', 'true');
            svg.appendChild(foreignObject);
            foreignObject.appendChild(node);
            return svg;
        };
        var loadSerializedSVG$1 = function (svg) {
            return new Promise(function (resolve, reject) {
                var img = new Image();
                img.onload = function () { return resolve(img); };
                img.onerror = reject;
                img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
            });
        };
        var FEATURES = {
            get SUPPORT_RANGE_BOUNDS() {
                var value = testRangeBounds(document);
                Object.defineProperty(FEATURES, 'SUPPORT_RANGE_BOUNDS', { value: value });
                return value;
            },
            get SUPPORT_WORD_BREAKING() {
                var value = FEATURES.SUPPORT_RANGE_BOUNDS && testIOSLineBreak(document);
                Object.defineProperty(FEATURES, 'SUPPORT_WORD_BREAKING', { value: value });
                return value;
            },
            get SUPPORT_SVG_DRAWING() {
                var value = testSVG(document);
                Object.defineProperty(FEATURES, 'SUPPORT_SVG_DRAWING', { value: value });
                return value;
            },
            get SUPPORT_FOREIGNOBJECT_DRAWING() {
                var value = typeof Array.from === 'function' && typeof window.fetch === 'function'
                    ? testForeignObject(document)
                    : Promise.resolve(false);
                Object.defineProperty(FEATURES, 'SUPPORT_FOREIGNOBJECT_DRAWING', { value: value });
                return value;
            },
            get SUPPORT_CORS_IMAGES() {
                var value = testCORS();
                Object.defineProperty(FEATURES, 'SUPPORT_CORS_IMAGES', { value: value });
                return value;
            },
            get SUPPORT_RESPONSE_TYPE() {
                var value = testResponseType();
                Object.defineProperty(FEATURES, 'SUPPORT_RESPONSE_TYPE', { value: value });
                return value;
            },
            get SUPPORT_CORS_XHR() {
                var value = 'withCredentials' in new XMLHttpRequest();
                Object.defineProperty(FEATURES, 'SUPPORT_CORS_XHR', { value: value });
                return value;
            },
            get SUPPORT_NATIVE_TEXT_SEGMENTATION() {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                var value = !!(typeof Intl !== 'undefined' && Intl.Segmenter);
                Object.defineProperty(FEATURES, 'SUPPORT_NATIVE_TEXT_SEGMENTATION', { value: value });
                return value;
            }
        };

        var TextBounds = /** @class */ (function () {
            function TextBounds(text, bounds) {
                this.text = text;
                this.bounds = bounds;
            }
            return TextBounds;
        }());
        var parseTextBounds = function (context, value, styles, node) {
            var textList = breakText(value, styles);
            var textBounds = [];
            var offset = 0;
            textList.forEach(function (text) {
                if (styles.textDecorationLine.length || text.trim().length > 0) {
                    if (FEATURES.SUPPORT_RANGE_BOUNDS) {
                        var clientRects = createRange(node, offset, text.length).getClientRects();
                        if (clientRects.length > 1) {
                            var subSegments = segmentGraphemes(text);
                            var subOffset_1 = 0;
                            subSegments.forEach(function (subSegment) {
                                textBounds.push(new TextBounds(subSegment, Bounds.fromDOMRectList(context, createRange(node, subOffset_1 + offset, subSegment.length).getClientRects())));
                                subOffset_1 += subSegment.length;
                            });
                        }
                        else {
                            textBounds.push(new TextBounds(text, Bounds.fromDOMRectList(context, clientRects)));
                        }
                    }
                    else {
                        var replacementNode = node.splitText(text.length);
                        textBounds.push(new TextBounds(text, getWrapperBounds(context, node)));
                        node = replacementNode;
                    }
                }
                else if (!FEATURES.SUPPORT_RANGE_BOUNDS) {
                    node = node.splitText(text.length);
                }
                offset += text.length;
            });
            return textBounds;
        };
        var getWrapperBounds = function (context, node) {
            var ownerDocument = node.ownerDocument;
            if (ownerDocument) {
                var wrapper = ownerDocument.createElement('html2canvaswrapper');
                wrapper.appendChild(node.cloneNode(true));
                var parentNode = node.parentNode;
                if (parentNode) {
                    parentNode.replaceChild(wrapper, node);
                    var bounds = parseBounds(context, wrapper);
                    if (wrapper.firstChild) {
                        parentNode.replaceChild(wrapper.firstChild, wrapper);
                    }
                    return bounds;
                }
            }
            return Bounds.EMPTY;
        };
        var createRange = function (node, offset, length) {
            var ownerDocument = node.ownerDocument;
            if (!ownerDocument) {
                throw new Error('Node has no owner document');
            }
            var range = ownerDocument.createRange();
            range.setStart(node, offset);
            range.setEnd(node, offset + length);
            return range;
        };
        var segmentGraphemes = function (value) {
            if (FEATURES.SUPPORT_NATIVE_TEXT_SEGMENTATION) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                var segmenter = new Intl.Segmenter(void 0, { granularity: 'grapheme' });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return Array.from(segmenter.segment(value)).map(function (segment) { return segment.segment; });
            }
            return splitGraphemes(value);
        };
        var segmentWords = function (value, styles) {
            if (FEATURES.SUPPORT_NATIVE_TEXT_SEGMENTATION) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                var segmenter = new Intl.Segmenter(void 0, {
                    granularity: 'word'
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return Array.from(segmenter.segment(value)).map(function (segment) { return segment.segment; });
            }
            return breakWords(value, styles);
        };
        var breakText = function (value, styles) {
            return styles.letterSpacing !== 0 ? segmentGraphemes(value) : segmentWords(value, styles);
        };
        // https://drafts.csswg.org/css-text/#word-separator
        var wordSeparators = [0x0020, 0x00a0, 0x1361, 0x10100, 0x10101, 0x1039, 0x1091];
        var breakWords = function (str, styles) {
            var breaker = LineBreaker(str, {
                lineBreak: styles.lineBreak,
                wordBreak: styles.overflowWrap === "break-word" /* BREAK_WORD */ ? 'break-word' : styles.wordBreak
            });
            var words = [];
            var bk;
            var _loop_1 = function () {
                if (bk.value) {
                    var value = bk.value.slice();
                    var codePoints = toCodePoints$1(value);
                    var word_1 = '';
                    codePoints.forEach(function (codePoint) {
                        if (wordSeparators.indexOf(codePoint) === -1) {
                            word_1 += fromCodePoint$1(codePoint);
                        }
                        else {
                            if (word_1.length) {
                                words.push(word_1);
                            }
                            words.push(fromCodePoint$1(codePoint));
                            word_1 = '';
                        }
                    });
                    if (word_1.length) {
                        words.push(word_1);
                    }
                }
            };
            while (!(bk = breaker.next()).done) {
                _loop_1();
            }
            return words;
        };

        var TextContainer = /** @class */ (function () {
            function TextContainer(context, node, styles) {
                this.text = transform(node.data, styles.textTransform);
                this.textBounds = parseTextBounds(context, this.text, styles, node);
            }
            return TextContainer;
        }());
        var transform = function (text, transform) {
            switch (transform) {
                case 1 /* LOWERCASE */:
                    return text.toLowerCase();
                case 3 /* CAPITALIZE */:
                    return text.replace(CAPITALIZE, capitalize);
                case 2 /* UPPERCASE */:
                    return text.toUpperCase();
                default:
                    return text;
            }
        };
        var CAPITALIZE = /(^|\s|:|-|\(|\))([a-z])/g;
        var capitalize = function (m, p1, p2) {
            if (m.length > 0) {
                return p1 + p2.toUpperCase();
            }
            return m;
        };

        var ImageElementContainer = /** @class */ (function (_super) {
            __extends(ImageElementContainer, _super);
            function ImageElementContainer(context, img) {
                var _this = _super.call(this, context, img) || this;
                _this.src = img.currentSrc || img.src;
                _this.intrinsicWidth = img.naturalWidth;
                _this.intrinsicHeight = img.naturalHeight;
                _this.context.cache.addImage(_this.src);
                return _this;
            }
            return ImageElementContainer;
        }(ElementContainer));

        var CanvasElementContainer = /** @class */ (function (_super) {
            __extends(CanvasElementContainer, _super);
            function CanvasElementContainer(context, canvas) {
                var _this = _super.call(this, context, canvas) || this;
                _this.canvas = canvas;
                _this.intrinsicWidth = canvas.width;
                _this.intrinsicHeight = canvas.height;
                return _this;
            }
            return CanvasElementContainer;
        }(ElementContainer));

        var SVGElementContainer = /** @class */ (function (_super) {
            __extends(SVGElementContainer, _super);
            function SVGElementContainer(context, img) {
                var _this = _super.call(this, context, img) || this;
                var s = new XMLSerializer();
                var bounds = parseBounds(context, img);
                img.setAttribute('width', bounds.width + "px");
                img.setAttribute('height', bounds.height + "px");
                _this.svg = "data:image/svg+xml," + encodeURIComponent(s.serializeToString(img));
                _this.intrinsicWidth = img.width.baseVal.value;
                _this.intrinsicHeight = img.height.baseVal.value;
                _this.context.cache.addImage(_this.svg);
                return _this;
            }
            return SVGElementContainer;
        }(ElementContainer));

        var LIElementContainer = /** @class */ (function (_super) {
            __extends(LIElementContainer, _super);
            function LIElementContainer(context, element) {
                var _this = _super.call(this, context, element) || this;
                _this.value = element.value;
                return _this;
            }
            return LIElementContainer;
        }(ElementContainer));

        var OLElementContainer = /** @class */ (function (_super) {
            __extends(OLElementContainer, _super);
            function OLElementContainer(context, element) {
                var _this = _super.call(this, context, element) || this;
                _this.start = element.start;
                _this.reversed = typeof element.reversed === 'boolean' && element.reversed === true;
                return _this;
            }
            return OLElementContainer;
        }(ElementContainer));

        var CHECKBOX_BORDER_RADIUS = [
            {
                type: 15 /* DIMENSION_TOKEN */,
                flags: 0,
                unit: 'px',
                number: 3
            }
        ];
        var RADIO_BORDER_RADIUS = [
            {
                type: 16 /* PERCENTAGE_TOKEN */,
                flags: 0,
                number: 50
            }
        ];
        var reformatInputBounds = function (bounds) {
            if (bounds.width > bounds.height) {
                return new Bounds(bounds.left + (bounds.width - bounds.height) / 2, bounds.top, bounds.height, bounds.height);
            }
            else if (bounds.width < bounds.height) {
                return new Bounds(bounds.left, bounds.top + (bounds.height - bounds.width) / 2, bounds.width, bounds.width);
            }
            return bounds;
        };
        var getInputValue = function (node) {
            var value = node.type === PASSWORD ? new Array(node.value.length + 1).join('\u2022') : node.value;
            return value.length === 0 ? node.placeholder || '' : value;
        };
        var CHECKBOX = 'checkbox';
        var RADIO = 'radio';
        var PASSWORD = 'password';
        var INPUT_COLOR = 0x2a2a2aff;
        var InputElementContainer = /** @class */ (function (_super) {
            __extends(InputElementContainer, _super);
            function InputElementContainer(context, input) {
                var _this = _super.call(this, context, input) || this;
                _this.type = input.type.toLowerCase();
                _this.checked = input.checked;
                _this.value = getInputValue(input);
                if (_this.type === CHECKBOX || _this.type === RADIO) {
                    _this.styles.backgroundColor = 0xdededeff;
                    _this.styles.borderTopColor =
                        _this.styles.borderRightColor =
                            _this.styles.borderBottomColor =
                                _this.styles.borderLeftColor =
                                    0xa5a5a5ff;
                    _this.styles.borderTopWidth =
                        _this.styles.borderRightWidth =
                            _this.styles.borderBottomWidth =
                                _this.styles.borderLeftWidth =
                                    1;
                    _this.styles.borderTopStyle =
                        _this.styles.borderRightStyle =
                            _this.styles.borderBottomStyle =
                                _this.styles.borderLeftStyle =
                                    1 /* SOLID */;
                    _this.styles.backgroundClip = [0 /* BORDER_BOX */];
                    _this.styles.backgroundOrigin = [0 /* BORDER_BOX */];
                    _this.bounds = reformatInputBounds(_this.bounds);
                }
                switch (_this.type) {
                    case CHECKBOX:
                        _this.styles.borderTopRightRadius =
                            _this.styles.borderTopLeftRadius =
                                _this.styles.borderBottomRightRadius =
                                    _this.styles.borderBottomLeftRadius =
                                        CHECKBOX_BORDER_RADIUS;
                        break;
                    case RADIO:
                        _this.styles.borderTopRightRadius =
                            _this.styles.borderTopLeftRadius =
                                _this.styles.borderBottomRightRadius =
                                    _this.styles.borderBottomLeftRadius =
                                        RADIO_BORDER_RADIUS;
                        break;
                }
                return _this;
            }
            return InputElementContainer;
        }(ElementContainer));

        var SelectElementContainer = /** @class */ (function (_super) {
            __extends(SelectElementContainer, _super);
            function SelectElementContainer(context, element) {
                var _this = _super.call(this, context, element) || this;
                var option = element.options[element.selectedIndex || 0];
                _this.value = option ? option.text || '' : '';
                return _this;
            }
            return SelectElementContainer;
        }(ElementContainer));

        var TextareaElementContainer = /** @class */ (function (_super) {
            __extends(TextareaElementContainer, _super);
            function TextareaElementContainer(context, element) {
                var _this = _super.call(this, context, element) || this;
                _this.value = element.value;
                return _this;
            }
            return TextareaElementContainer;
        }(ElementContainer));

        var IFrameElementContainer = /** @class */ (function (_super) {
            __extends(IFrameElementContainer, _super);
            function IFrameElementContainer(context, iframe) {
                var _this = _super.call(this, context, iframe) || this;
                _this.src = iframe.src;
                _this.width = parseInt(iframe.width, 10) || 0;
                _this.height = parseInt(iframe.height, 10) || 0;
                _this.backgroundColor = _this.styles.backgroundColor;
                try {
                    if (iframe.contentWindow &&
                        iframe.contentWindow.document &&
                        iframe.contentWindow.document.documentElement) {
                        _this.tree = parseTree(context, iframe.contentWindow.document.documentElement);
                        // http://www.w3.org/TR/css3-background/#special-backgrounds
                        var documentBackgroundColor = iframe.contentWindow.document.documentElement
                            ? parseColor(context, getComputedStyle(iframe.contentWindow.document.documentElement).backgroundColor)
                            : COLORS.TRANSPARENT;
                        var bodyBackgroundColor = iframe.contentWindow.document.body
                            ? parseColor(context, getComputedStyle(iframe.contentWindow.document.body).backgroundColor)
                            : COLORS.TRANSPARENT;
                        _this.backgroundColor = isTransparent(documentBackgroundColor)
                            ? isTransparent(bodyBackgroundColor)
                                ? _this.styles.backgroundColor
                                : bodyBackgroundColor
                            : documentBackgroundColor;
                    }
                }
                catch (e) { }
                return _this;
            }
            return IFrameElementContainer;
        }(ElementContainer));

        var LIST_OWNERS = ['OL', 'UL', 'MENU'];
        var parseNodeTree = function (context, node, parent, root) {
            for (var childNode = node.firstChild, nextNode = void 0; childNode; childNode = nextNode) {
                nextNode = childNode.nextSibling;
                if (isTextNode(childNode) && childNode.data.trim().length > 0) {
                    parent.textNodes.push(new TextContainer(context, childNode, parent.styles));
                }
                else if (isElementNode(childNode)) {
                    if (isSlotElement(childNode) && childNode.assignedNodes) {
                        childNode.assignedNodes().forEach(function (childNode) { return parseNodeTree(context, childNode, parent, root); });
                    }
                    else {
                        var container = createContainer(context, childNode);
                        if (container.styles.isVisible()) {
                            if (createsRealStackingContext(childNode, container, root)) {
                                container.flags |= 4 /* CREATES_REAL_STACKING_CONTEXT */;
                            }
                            else if (createsStackingContext(container.styles)) {
                                container.flags |= 2 /* CREATES_STACKING_CONTEXT */;
                            }
                            if (LIST_OWNERS.indexOf(childNode.tagName) !== -1) {
                                container.flags |= 8 /* IS_LIST_OWNER */;
                            }
                            parent.elements.push(container);
                            childNode.slot;
                            if (childNode.shadowRoot) {
                                parseNodeTree(context, childNode.shadowRoot, container, root);
                            }
                            else if (!isTextareaElement(childNode) &&
                                !isSVGElement(childNode) &&
                                !isSelectElement(childNode)) {
                                parseNodeTree(context, childNode, container, root);
                            }
                        }
                    }
                }
            }
        };
        var createContainer = function (context, element) {
            if (isImageElement(element)) {
                return new ImageElementContainer(context, element);
            }
            if (isCanvasElement(element)) {
                return new CanvasElementContainer(context, element);
            }
            if (isSVGElement(element)) {
                return new SVGElementContainer(context, element);
            }
            if (isLIElement(element)) {
                return new LIElementContainer(context, element);
            }
            if (isOLElement(element)) {
                return new OLElementContainer(context, element);
            }
            if (isInputElement(element)) {
                return new InputElementContainer(context, element);
            }
            if (isSelectElement(element)) {
                return new SelectElementContainer(context, element);
            }
            if (isTextareaElement(element)) {
                return new TextareaElementContainer(context, element);
            }
            if (isIFrameElement(element)) {
                return new IFrameElementContainer(context, element);
            }
            return new ElementContainer(context, element);
        };
        var parseTree = function (context, element) {
            var container = createContainer(context, element);
            container.flags |= 4 /* CREATES_REAL_STACKING_CONTEXT */;
            parseNodeTree(context, element, container, container);
            return container;
        };
        var createsRealStackingContext = function (node, container, root) {
            return (container.styles.isPositionedWithZIndex() ||
                container.styles.opacity < 1 ||
                container.styles.isTransformed() ||
                (isBodyElement(node) && root.styles.isTransparent()));
        };
        var createsStackingContext = function (styles) { return styles.isPositioned() || styles.isFloating(); };
        var isTextNode = function (node) { return node.nodeType === Node.TEXT_NODE; };
        var isElementNode = function (node) { return node.nodeType === Node.ELEMENT_NODE; };
        var isHTMLElementNode = function (node) {
            return isElementNode(node) && typeof node.style !== 'undefined' && !isSVGElementNode(node);
        };
        var isSVGElementNode = function (element) {
            return typeof element.className === 'object';
        };
        var isLIElement = function (node) { return node.tagName === 'LI'; };
        var isOLElement = function (node) { return node.tagName === 'OL'; };
        var isInputElement = function (node) { return node.tagName === 'INPUT'; };
        var isHTMLElement = function (node) { return node.tagName === 'HTML'; };
        var isSVGElement = function (node) { return node.tagName === 'svg'; };
        var isBodyElement = function (node) { return node.tagName === 'BODY'; };
        var isCanvasElement = function (node) { return node.tagName === 'CANVAS'; };
        var isVideoElement = function (node) { return node.tagName === 'VIDEO'; };
        var isImageElement = function (node) { return node.tagName === 'IMG'; };
        var isIFrameElement = function (node) { return node.tagName === 'IFRAME'; };
        var isStyleElement = function (node) { return node.tagName === 'STYLE'; };
        var isScriptElement = function (node) { return node.tagName === 'SCRIPT'; };
        var isTextareaElement = function (node) { return node.tagName === 'TEXTAREA'; };
        var isSelectElement = function (node) { return node.tagName === 'SELECT'; };
        var isSlotElement = function (node) { return node.tagName === 'SLOT'; };
        // https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
        var isCustomElement = function (node) { return node.tagName.indexOf('-') > 0; };

        var CounterState = /** @class */ (function () {
            function CounterState() {
                this.counters = {};
            }
            CounterState.prototype.getCounterValue = function (name) {
                var counter = this.counters[name];
                if (counter && counter.length) {
                    return counter[counter.length - 1];
                }
                return 1;
            };
            CounterState.prototype.getCounterValues = function (name) {
                var counter = this.counters[name];
                return counter ? counter : [];
            };
            CounterState.prototype.pop = function (counters) {
                var _this = this;
                counters.forEach(function (counter) { return _this.counters[counter].pop(); });
            };
            CounterState.prototype.parse = function (style) {
                var _this = this;
                var counterIncrement = style.counterIncrement;
                var counterReset = style.counterReset;
                var canReset = true;
                if (counterIncrement !== null) {
                    counterIncrement.forEach(function (entry) {
                        var counter = _this.counters[entry.counter];
                        if (counter && entry.increment !== 0) {
                            canReset = false;
                            if (!counter.length) {
                                counter.push(1);
                            }
                            counter[Math.max(0, counter.length - 1)] += entry.increment;
                        }
                    });
                }
                var counterNames = [];
                if (canReset) {
                    counterReset.forEach(function (entry) {
                        var counter = _this.counters[entry.counter];
                        counterNames.push(entry.counter);
                        if (!counter) {
                            counter = _this.counters[entry.counter] = [];
                        }
                        counter.push(entry.reset);
                    });
                }
                return counterNames;
            };
            return CounterState;
        }());
        var ROMAN_UPPER = {
            integers: [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1],
            values: ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I']
        };
        var ARMENIAN = {
            integers: [
                9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100, 90, 80, 70,
                60, 50, 40, 30, 20, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
            ],
            values: [
                'Ք',
                'Փ',
                'Ւ',
                'Ց',
                'Ր',
                'Տ',
                'Վ',
                'Ս',
                'Ռ',
                'Ջ',
                'Պ',
                'Չ',
                'Ո',
                'Շ',
                'Ն',
                'Յ',
                'Մ',
                'Ճ',
                'Ղ',
                'Ձ',
                'Հ',
                'Կ',
                'Ծ',
                'Խ',
                'Լ',
                'Ի',
                'Ժ',
                'Թ',
                'Ը',
                'Է',
                'Զ',
                'Ե',
                'Դ',
                'Գ',
                'Բ',
                'Ա'
            ]
        };
        var HEBREW = {
            integers: [
                10000, 9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000, 400, 300, 200, 100, 90, 80, 70, 60, 50, 40, 30, 20,
                19, 18, 17, 16, 15, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
            ],
            values: [
                'י׳',
                'ט׳',
                'ח׳',
                'ז׳',
                'ו׳',
                'ה׳',
                'ד׳',
                'ג׳',
                'ב׳',
                'א׳',
                'ת',
                'ש',
                'ר',
                'ק',
                'צ',
                'פ',
                'ע',
                'ס',
                'נ',
                'מ',
                'ל',
                'כ',
                'יט',
                'יח',
                'יז',
                'טז',
                'טו',
                'י',
                'ט',
                'ח',
                'ז',
                'ו',
                'ה',
                'ד',
                'ג',
                'ב',
                'א'
            ]
        };
        var GEORGIAN = {
            integers: [
                10000, 9000, 8000, 7000, 6000, 5000, 4000, 3000, 2000, 1000, 900, 800, 700, 600, 500, 400, 300, 200, 100, 90,
                80, 70, 60, 50, 40, 30, 20, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1
            ],
            values: [
                'ჵ',
                'ჰ',
                'ჯ',
                'ჴ',
                'ხ',
                'ჭ',
                'წ',
                'ძ',
                'ც',
                'ჩ',
                'შ',
                'ყ',
                'ღ',
                'ქ',
                'ფ',
                'ჳ',
                'ტ',
                'ს',
                'რ',
                'ჟ',
                'პ',
                'ო',
                'ჲ',
                'ნ',
                'მ',
                'ლ',
                'კ',
                'ი',
                'თ',
                'ჱ',
                'ზ',
                'ვ',
                'ე',
                'დ',
                'გ',
                'ბ',
                'ა'
            ]
        };
        var createAdditiveCounter = function (value, min, max, symbols, fallback, suffix) {
            if (value < min || value > max) {
                return createCounterText(value, fallback, suffix.length > 0);
            }
            return (symbols.integers.reduce(function (string, integer, index) {
                while (value >= integer) {
                    value -= integer;
                    string += symbols.values[index];
                }
                return string;
            }, '') + suffix);
        };
        var createCounterStyleWithSymbolResolver = function (value, codePointRangeLength, isNumeric, resolver) {
            var string = '';
            do {
                if (!isNumeric) {
                    value--;
                }
                string = resolver(value) + string;
                value /= codePointRangeLength;
            } while (value * codePointRangeLength >= codePointRangeLength);
            return string;
        };
        var createCounterStyleFromRange = function (value, codePointRangeStart, codePointRangeEnd, isNumeric, suffix) {
            var codePointRangeLength = codePointRangeEnd - codePointRangeStart + 1;
            return ((value < 0 ? '-' : '') +
                (createCounterStyleWithSymbolResolver(Math.abs(value), codePointRangeLength, isNumeric, function (codePoint) {
                    return fromCodePoint$1(Math.floor(codePoint % codePointRangeLength) + codePointRangeStart);
                }) +
                    suffix));
        };
        var createCounterStyleFromSymbols = function (value, symbols, suffix) {
            if (suffix === void 0) { suffix = '. '; }
            var codePointRangeLength = symbols.length;
            return (createCounterStyleWithSymbolResolver(Math.abs(value), codePointRangeLength, false, function (codePoint) { return symbols[Math.floor(codePoint % codePointRangeLength)]; }) + suffix);
        };
        var CJK_ZEROS = 1 << 0;
        var CJK_TEN_COEFFICIENTS = 1 << 1;
        var CJK_TEN_HIGH_COEFFICIENTS = 1 << 2;
        var CJK_HUNDRED_COEFFICIENTS = 1 << 3;
        var createCJKCounter = function (value, numbers, multipliers, negativeSign, suffix, flags) {
            if (value < -9999 || value > 9999) {
                return createCounterText(value, 4 /* CJK_DECIMAL */, suffix.length > 0);
            }
            var tmp = Math.abs(value);
            var string = suffix;
            if (tmp === 0) {
                return numbers[0] + string;
            }
            for (var digit = 0; tmp > 0 && digit <= 4; digit++) {
                var coefficient = tmp % 10;
                if (coefficient === 0 && contains(flags, CJK_ZEROS) && string !== '') {
                    string = numbers[coefficient] + string;
                }
                else if (coefficient > 1 ||
                    (coefficient === 1 && digit === 0) ||
                    (coefficient === 1 && digit === 1 && contains(flags, CJK_TEN_COEFFICIENTS)) ||
                    (coefficient === 1 && digit === 1 && contains(flags, CJK_TEN_HIGH_COEFFICIENTS) && value > 100) ||
                    (coefficient === 1 && digit > 1 && contains(flags, CJK_HUNDRED_COEFFICIENTS))) {
                    string = numbers[coefficient] + (digit > 0 ? multipliers[digit - 1] : '') + string;
                }
                else if (coefficient === 1 && digit > 0) {
                    string = multipliers[digit - 1] + string;
                }
                tmp = Math.floor(tmp / 10);
            }
            return (value < 0 ? negativeSign : '') + string;
        };
        var CHINESE_INFORMAL_MULTIPLIERS = '十百千萬';
        var CHINESE_FORMAL_MULTIPLIERS = '拾佰仟萬';
        var JAPANESE_NEGATIVE = 'マイナス';
        var KOREAN_NEGATIVE = '마이너스';
        var createCounterText = function (value, type, appendSuffix) {
            var defaultSuffix = appendSuffix ? '. ' : '';
            var cjkSuffix = appendSuffix ? '、' : '';
            var koreanSuffix = appendSuffix ? ', ' : '';
            var spaceSuffix = appendSuffix ? ' ' : '';
            switch (type) {
                case 0 /* DISC */:
                    return '•' + spaceSuffix;
                case 1 /* CIRCLE */:
                    return '◦' + spaceSuffix;
                case 2 /* SQUARE */:
                    return '◾' + spaceSuffix;
                case 5 /* DECIMAL_LEADING_ZERO */:
                    var string = createCounterStyleFromRange(value, 48, 57, true, defaultSuffix);
                    return string.length < 4 ? "0" + string : string;
                case 4 /* CJK_DECIMAL */:
                    return createCounterStyleFromSymbols(value, '〇一二三四五六七八九', cjkSuffix);
                case 6 /* LOWER_ROMAN */:
                    return createAdditiveCounter(value, 1, 3999, ROMAN_UPPER, 3 /* DECIMAL */, defaultSuffix).toLowerCase();
                case 7 /* UPPER_ROMAN */:
                    return createAdditiveCounter(value, 1, 3999, ROMAN_UPPER, 3 /* DECIMAL */, defaultSuffix);
                case 8 /* LOWER_GREEK */:
                    return createCounterStyleFromRange(value, 945, 969, false, defaultSuffix);
                case 9 /* LOWER_ALPHA */:
                    return createCounterStyleFromRange(value, 97, 122, false, defaultSuffix);
                case 10 /* UPPER_ALPHA */:
                    return createCounterStyleFromRange(value, 65, 90, false, defaultSuffix);
                case 11 /* ARABIC_INDIC */:
                    return createCounterStyleFromRange(value, 1632, 1641, true, defaultSuffix);
                case 12 /* ARMENIAN */:
                case 49 /* UPPER_ARMENIAN */:
                    return createAdditiveCounter(value, 1, 9999, ARMENIAN, 3 /* DECIMAL */, defaultSuffix);
                case 35 /* LOWER_ARMENIAN */:
                    return createAdditiveCounter(value, 1, 9999, ARMENIAN, 3 /* DECIMAL */, defaultSuffix).toLowerCase();
                case 13 /* BENGALI */:
                    return createCounterStyleFromRange(value, 2534, 2543, true, defaultSuffix);
                case 14 /* CAMBODIAN */:
                case 30 /* KHMER */:
                    return createCounterStyleFromRange(value, 6112, 6121, true, defaultSuffix);
                case 15 /* CJK_EARTHLY_BRANCH */:
                    return createCounterStyleFromSymbols(value, '子丑寅卯辰巳午未申酉戌亥', cjkSuffix);
                case 16 /* CJK_HEAVENLY_STEM */:
                    return createCounterStyleFromSymbols(value, '甲乙丙丁戊己庚辛壬癸', cjkSuffix);
                case 17 /* CJK_IDEOGRAPHIC */:
                case 48 /* TRAD_CHINESE_INFORMAL */:
                    return createCJKCounter(value, '零一二三四五六七八九', CHINESE_INFORMAL_MULTIPLIERS, '負', cjkSuffix, CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS | CJK_HUNDRED_COEFFICIENTS);
                case 47 /* TRAD_CHINESE_FORMAL */:
                    return createCJKCounter(value, '零壹貳參肆伍陸柒捌玖', CHINESE_FORMAL_MULTIPLIERS, '負', cjkSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS | CJK_HUNDRED_COEFFICIENTS);
                case 42 /* SIMP_CHINESE_INFORMAL */:
                    return createCJKCounter(value, '零一二三四五六七八九', CHINESE_INFORMAL_MULTIPLIERS, '负', cjkSuffix, CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS | CJK_HUNDRED_COEFFICIENTS);
                case 41 /* SIMP_CHINESE_FORMAL */:
                    return createCJKCounter(value, '零壹贰叁肆伍陆柒捌玖', CHINESE_FORMAL_MULTIPLIERS, '负', cjkSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS | CJK_HUNDRED_COEFFICIENTS);
                case 26 /* JAPANESE_INFORMAL */:
                    return createCJKCounter(value, '〇一二三四五六七八九', '十百千万', JAPANESE_NEGATIVE, cjkSuffix, 0);
                case 25 /* JAPANESE_FORMAL */:
                    return createCJKCounter(value, '零壱弐参四伍六七八九', '拾百千万', JAPANESE_NEGATIVE, cjkSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS);
                case 31 /* KOREAN_HANGUL_FORMAL */:
                    return createCJKCounter(value, '영일이삼사오육칠팔구', '십백천만', KOREAN_NEGATIVE, koreanSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS);
                case 33 /* KOREAN_HANJA_INFORMAL */:
                    return createCJKCounter(value, '零一二三四五六七八九', '十百千萬', KOREAN_NEGATIVE, koreanSuffix, 0);
                case 32 /* KOREAN_HANJA_FORMAL */:
                    return createCJKCounter(value, '零壹貳參四五六七八九', '拾百千', KOREAN_NEGATIVE, koreanSuffix, CJK_ZEROS | CJK_TEN_COEFFICIENTS | CJK_TEN_HIGH_COEFFICIENTS);
                case 18 /* DEVANAGARI */:
                    return createCounterStyleFromRange(value, 0x966, 0x96f, true, defaultSuffix);
                case 20 /* GEORGIAN */:
                    return createAdditiveCounter(value, 1, 19999, GEORGIAN, 3 /* DECIMAL */, defaultSuffix);
                case 21 /* GUJARATI */:
                    return createCounterStyleFromRange(value, 0xae6, 0xaef, true, defaultSuffix);
                case 22 /* GURMUKHI */:
                    return createCounterStyleFromRange(value, 0xa66, 0xa6f, true, defaultSuffix);
                case 22 /* HEBREW */:
                    return createAdditiveCounter(value, 1, 10999, HEBREW, 3 /* DECIMAL */, defaultSuffix);
                case 23 /* HIRAGANA */:
                    return createCounterStyleFromSymbols(value, 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわゐゑをん');
                case 24 /* HIRAGANA_IROHA */:
                    return createCounterStyleFromSymbols(value, 'いろはにほへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせす');
                case 27 /* KANNADA */:
                    return createCounterStyleFromRange(value, 0xce6, 0xcef, true, defaultSuffix);
                case 28 /* KATAKANA */:
                    return createCounterStyleFromSymbols(value, 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヰヱヲン', cjkSuffix);
                case 29 /* KATAKANA_IROHA */:
                    return createCounterStyleFromSymbols(value, 'イロハニホヘトチリヌルヲワカヨタレソツネナラムウヰノオクヤマケフコエテアサキユメミシヱヒモセス', cjkSuffix);
                case 34 /* LAO */:
                    return createCounterStyleFromRange(value, 0xed0, 0xed9, true, defaultSuffix);
                case 37 /* MONGOLIAN */:
                    return createCounterStyleFromRange(value, 0x1810, 0x1819, true, defaultSuffix);
                case 38 /* MYANMAR */:
                    return createCounterStyleFromRange(value, 0x1040, 0x1049, true, defaultSuffix);
                case 39 /* ORIYA */:
                    return createCounterStyleFromRange(value, 0xb66, 0xb6f, true, defaultSuffix);
                case 40 /* PERSIAN */:
                    return createCounterStyleFromRange(value, 0x6f0, 0x6f9, true, defaultSuffix);
                case 43 /* TAMIL */:
                    return createCounterStyleFromRange(value, 0xbe6, 0xbef, true, defaultSuffix);
                case 44 /* TELUGU */:
                    return createCounterStyleFromRange(value, 0xc66, 0xc6f, true, defaultSuffix);
                case 45 /* THAI */:
                    return createCounterStyleFromRange(value, 0xe50, 0xe59, true, defaultSuffix);
                case 46 /* TIBETAN */:
                    return createCounterStyleFromRange(value, 0xf20, 0xf29, true, defaultSuffix);
                case 3 /* DECIMAL */:
                default:
                    return createCounterStyleFromRange(value, 48, 57, true, defaultSuffix);
            }
        };

        var IGNORE_ATTRIBUTE = 'data-html2canvas-ignore';
        var DocumentCloner = /** @class */ (function () {
            function DocumentCloner(context, element, options) {
                this.context = context;
                this.options = options;
                this.scrolledElements = [];
                this.referenceElement = element;
                this.counters = new CounterState();
                this.quoteDepth = 0;
                if (!element.ownerDocument) {
                    throw new Error('Cloned element does not have an owner document');
                }
                this.documentElement = this.cloneNode(element.ownerDocument.documentElement, false);
            }
            DocumentCloner.prototype.toIFrame = function (ownerDocument, windowSize) {
                var _this = this;
                var iframe = createIFrameContainer(ownerDocument, windowSize);
                if (!iframe.contentWindow) {
                    return Promise.reject("Unable to find iframe window");
                }
                var scrollX = ownerDocument.defaultView.pageXOffset;
                var scrollY = ownerDocument.defaultView.pageYOffset;
                var cloneWindow = iframe.contentWindow;
                var documentClone = cloneWindow.document;
                /* Chrome doesn't detect relative background-images assigned in inline <style> sheets when fetched through getComputedStyle
                 if window url is about:blank, we can assign the url to current by writing onto the document
                 */
                var iframeLoad = iframeLoader(iframe).then(function () { return __awaiter(_this, void 0, void 0, function () {
                    var onclone, referenceElement;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                this.scrolledElements.forEach(restoreNodeScroll);
                                if (cloneWindow) {
                                    cloneWindow.scrollTo(windowSize.left, windowSize.top);
                                    if (/(iPad|iPhone|iPod)/g.test(navigator.userAgent) &&
                                        (cloneWindow.scrollY !== windowSize.top || cloneWindow.scrollX !== windowSize.left)) {
                                        this.context.logger.warn('Unable to restore scroll position for cloned document');
                                        this.context.windowBounds = this.context.windowBounds.add(cloneWindow.scrollX - windowSize.left, cloneWindow.scrollY - windowSize.top, 0, 0);
                                    }
                                }
                                onclone = this.options.onclone;
                                referenceElement = this.clonedReferenceElement;
                                if (typeof referenceElement === 'undefined') {
                                    return [2 /*return*/, Promise.reject("Error finding the " + this.referenceElement.nodeName + " in the cloned document")];
                                }
                                if (!(documentClone.fonts && documentClone.fonts.ready)) return [3 /*break*/, 2];
                                return [4 /*yield*/, documentClone.fonts.ready];
                            case 1:
                                _a.sent();
                                _a.label = 2;
                            case 2:
                                if (!/(AppleWebKit)/g.test(navigator.userAgent)) return [3 /*break*/, 4];
                                return [4 /*yield*/, imagesReady(documentClone)];
                            case 3:
                                _a.sent();
                                _a.label = 4;
                            case 4:
                                if (typeof onclone === 'function') {
                                    return [2 /*return*/, Promise.resolve()
                                            .then(function () { return onclone(documentClone, referenceElement); })
                                            .then(function () { return iframe; })];
                                }
                                return [2 /*return*/, iframe];
                        }
                    });
                }); });
                documentClone.open();
                documentClone.write(serializeDoctype(document.doctype) + "<html></html>");
                // Chrome scrolls the parent document for some reason after the write to the cloned window???
                restoreOwnerScroll(this.referenceElement.ownerDocument, scrollX, scrollY);
                documentClone.replaceChild(documentClone.adoptNode(this.documentElement), documentClone.documentElement);
                documentClone.close();
                return iframeLoad;
            };
            DocumentCloner.prototype.createElementClone = function (node) {
                if (isDebugging(node, 2 /* CLONE */)) {
                    debugger;
                }
                if (isCanvasElement(node)) {
                    return this.createCanvasClone(node);
                }
                if (isVideoElement(node)) {
                    return this.createVideoClone(node);
                }
                if (isStyleElement(node)) {
                    return this.createStyleClone(node);
                }
                var clone = node.cloneNode(false);
                if (isImageElement(clone)) {
                    if (isImageElement(node) && node.currentSrc && node.currentSrc !== node.src) {
                        clone.src = node.currentSrc;
                        clone.srcset = '';
                    }
                    if (clone.loading === 'lazy') {
                        clone.loading = 'eager';
                    }
                }
                if (isCustomElement(clone)) {
                    return this.createCustomElementClone(clone);
                }
                return clone;
            };
            DocumentCloner.prototype.createCustomElementClone = function (node) {
                var clone = document.createElement('html2canvascustomelement');
                copyCSSStyles(node.style, clone);
                return clone;
            };
            DocumentCloner.prototype.createStyleClone = function (node) {
                try {
                    var sheet = node.sheet;
                    if (sheet && sheet.cssRules) {
                        var css = [].slice.call(sheet.cssRules, 0).reduce(function (css, rule) {
                            if (rule && typeof rule.cssText === 'string') {
                                return css + rule.cssText;
                            }
                            return css;
                        }, '');
                        var style = node.cloneNode(false);
                        style.textContent = css;
                        return style;
                    }
                }
                catch (e) {
                    // accessing node.sheet.cssRules throws a DOMException
                    this.context.logger.error('Unable to access cssRules property', e);
                    if (e.name !== 'SecurityError') {
                        throw e;
                    }
                }
                return node.cloneNode(false);
            };
            DocumentCloner.prototype.createCanvasClone = function (canvas) {
                var _a;
                if (this.options.inlineImages && canvas.ownerDocument) {
                    var img = canvas.ownerDocument.createElement('img');
                    try {
                        img.src = canvas.toDataURL();
                        return img;
                    }
                    catch (e) {
                        this.context.logger.info("Unable to inline canvas contents, canvas is tainted", canvas);
                    }
                }
                var clonedCanvas = canvas.cloneNode(false);
                try {
                    clonedCanvas.width = canvas.width;
                    clonedCanvas.height = canvas.height;
                    var ctx = canvas.getContext('2d');
                    var clonedCtx = clonedCanvas.getContext('2d');
                    if (clonedCtx) {
                        if (!this.options.allowTaint && ctx) {
                            clonedCtx.putImageData(ctx.getImageData(0, 0, canvas.width, canvas.height), 0, 0);
                        }
                        else {
                            var gl = (_a = canvas.getContext('webgl2')) !== null && _a !== void 0 ? _a : canvas.getContext('webgl');
                            if (gl) {
                                var attribs = gl.getContextAttributes();
                                if ((attribs === null || attribs === void 0 ? void 0 : attribs.preserveDrawingBuffer) === false) {
                                    this.context.logger.warn('Unable to clone WebGL context as it has preserveDrawingBuffer=false', canvas);
                                }
                            }
                            clonedCtx.drawImage(canvas, 0, 0);
                        }
                    }
                    return clonedCanvas;
                }
                catch (e) {
                    this.context.logger.info("Unable to clone canvas as it is tainted", canvas);
                }
                return clonedCanvas;
            };
            DocumentCloner.prototype.createVideoClone = function (video) {
                var canvas = video.ownerDocument.createElement('canvas');
                canvas.width = video.offsetWidth;
                canvas.height = video.offsetHeight;
                var ctx = canvas.getContext('2d');
                try {
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        if (!this.options.allowTaint) {
                            ctx.getImageData(0, 0, canvas.width, canvas.height);
                        }
                    }
                    return canvas;
                }
                catch (e) {
                    this.context.logger.info("Unable to clone video as it is tainted", video);
                }
                var blankCanvas = video.ownerDocument.createElement('canvas');
                blankCanvas.width = video.offsetWidth;
                blankCanvas.height = video.offsetHeight;
                return blankCanvas;
            };
            DocumentCloner.prototype.appendChildNode = function (clone, child, copyStyles) {
                if (!isElementNode(child) ||
                    (!isScriptElement(child) &&
                        !child.hasAttribute(IGNORE_ATTRIBUTE) &&
                        (typeof this.options.ignoreElements !== 'function' || !this.options.ignoreElements(child)))) {
                    if (!this.options.copyStyles || !isElementNode(child) || !isStyleElement(child)) {
                        clone.appendChild(this.cloneNode(child, copyStyles));
                    }
                }
            };
            DocumentCloner.prototype.cloneChildNodes = function (node, clone, copyStyles) {
                var _this = this;
                for (var child = node.shadowRoot ? node.shadowRoot.firstChild : node.firstChild; child; child = child.nextSibling) {
                    if (isElementNode(child) && isSlotElement(child) && typeof child.assignedNodes === 'function') {
                        var assignedNodes = child.assignedNodes();
                        if (assignedNodes.length) {
                            assignedNodes.forEach(function (assignedNode) { return _this.appendChildNode(clone, assignedNode, copyStyles); });
                        }
                    }
                    else {
                        this.appendChildNode(clone, child, copyStyles);
                    }
                }
            };
            DocumentCloner.prototype.cloneNode = function (node, copyStyles) {
                if (isTextNode(node)) {
                    return document.createTextNode(node.data);
                }
                if (!node.ownerDocument) {
                    return node.cloneNode(false);
                }
                var window = node.ownerDocument.defaultView;
                if (window && isElementNode(node) && (isHTMLElementNode(node) || isSVGElementNode(node))) {
                    var clone = this.createElementClone(node);
                    clone.style.transitionProperty = 'none';
                    var style = window.getComputedStyle(node);
                    var styleBefore = window.getComputedStyle(node, ':before');
                    var styleAfter = window.getComputedStyle(node, ':after');
                    if (this.referenceElement === node && isHTMLElementNode(clone)) {
                        this.clonedReferenceElement = clone;
                    }
                    if (isBodyElement(clone)) {
                        createPseudoHideStyles(clone);
                    }
                    var counters = this.counters.parse(new CSSParsedCounterDeclaration(this.context, style));
                    var before = this.resolvePseudoContent(node, clone, styleBefore, PseudoElementType.BEFORE);
                    if (isCustomElement(node)) {
                        copyStyles = true;
                    }
                    if (!isVideoElement(node)) {
                        this.cloneChildNodes(node, clone, copyStyles);
                    }
                    if (before) {
                        clone.insertBefore(before, clone.firstChild);
                    }
                    var after = this.resolvePseudoContent(node, clone, styleAfter, PseudoElementType.AFTER);
                    if (after) {
                        clone.appendChild(after);
                    }
                    this.counters.pop(counters);
                    if ((style && (this.options.copyStyles || isSVGElementNode(node)) && !isIFrameElement(node)) ||
                        copyStyles) {
                        copyCSSStyles(style, clone);
                    }
                    if (node.scrollTop !== 0 || node.scrollLeft !== 0) {
                        this.scrolledElements.push([clone, node.scrollLeft, node.scrollTop]);
                    }
                    if ((isTextareaElement(node) || isSelectElement(node)) &&
                        (isTextareaElement(clone) || isSelectElement(clone))) {
                        clone.value = node.value;
                    }
                    return clone;
                }
                return node.cloneNode(false);
            };
            DocumentCloner.prototype.resolvePseudoContent = function (node, clone, style, pseudoElt) {
                var _this = this;
                if (!style) {
                    return;
                }
                var value = style.content;
                var document = clone.ownerDocument;
                if (!document || !value || value === 'none' || value === '-moz-alt-content' || style.display === 'none') {
                    return;
                }
                this.counters.parse(new CSSParsedCounterDeclaration(this.context, style));
                var declaration = new CSSParsedPseudoDeclaration(this.context, style);
                var anonymousReplacedElement = document.createElement('html2canvaspseudoelement');
                copyCSSStyles(style, anonymousReplacedElement);
                declaration.content.forEach(function (token) {
                    if (token.type === 0 /* STRING_TOKEN */) {
                        anonymousReplacedElement.appendChild(document.createTextNode(token.value));
                    }
                    else if (token.type === 22 /* URL_TOKEN */) {
                        var img = document.createElement('img');
                        img.src = token.value;
                        img.style.opacity = '1';
                        anonymousReplacedElement.appendChild(img);
                    }
                    else if (token.type === 18 /* FUNCTION */) {
                        if (token.name === 'attr') {
                            var attr = token.values.filter(isIdentToken);
                            if (attr.length) {
                                anonymousReplacedElement.appendChild(document.createTextNode(node.getAttribute(attr[0].value) || ''));
                            }
                        }
                        else if (token.name === 'counter') {
                            var _a = token.values.filter(nonFunctionArgSeparator), counter = _a[0], counterStyle = _a[1];
                            if (counter && isIdentToken(counter)) {
                                var counterState = _this.counters.getCounterValue(counter.value);
                                var counterType = counterStyle && isIdentToken(counterStyle)
                                    ? listStyleType.parse(_this.context, counterStyle.value)
                                    : 3 /* DECIMAL */;
                                anonymousReplacedElement.appendChild(document.createTextNode(createCounterText(counterState, counterType, false)));
                            }
                        }
                        else if (token.name === 'counters') {
                            var _b = token.values.filter(nonFunctionArgSeparator), counter = _b[0], delim = _b[1], counterStyle = _b[2];
                            if (counter && isIdentToken(counter)) {
                                var counterStates = _this.counters.getCounterValues(counter.value);
                                var counterType_1 = counterStyle && isIdentToken(counterStyle)
                                    ? listStyleType.parse(_this.context, counterStyle.value)
                                    : 3 /* DECIMAL */;
                                var separator = delim && delim.type === 0 /* STRING_TOKEN */ ? delim.value : '';
                                var text = counterStates
                                    .map(function (value) { return createCounterText(value, counterType_1, false); })
                                    .join(separator);
                                anonymousReplacedElement.appendChild(document.createTextNode(text));
                            }
                        }
                        else ;
                    }
                    else if (token.type === 20 /* IDENT_TOKEN */) {
                        switch (token.value) {
                            case 'open-quote':
                                anonymousReplacedElement.appendChild(document.createTextNode(getQuote(declaration.quotes, _this.quoteDepth++, true)));
                                break;
                            case 'close-quote':
                                anonymousReplacedElement.appendChild(document.createTextNode(getQuote(declaration.quotes, --_this.quoteDepth, false)));
                                break;
                            default:
                                // safari doesn't parse string tokens correctly because of lack of quotes
                                anonymousReplacedElement.appendChild(document.createTextNode(token.value));
                        }
                    }
                });
                anonymousReplacedElement.className = PSEUDO_HIDE_ELEMENT_CLASS_BEFORE + " " + PSEUDO_HIDE_ELEMENT_CLASS_AFTER;
                var newClassName = pseudoElt === PseudoElementType.BEFORE
                    ? " " + PSEUDO_HIDE_ELEMENT_CLASS_BEFORE
                    : " " + PSEUDO_HIDE_ELEMENT_CLASS_AFTER;
                if (isSVGElementNode(clone)) {
                    clone.className.baseValue += newClassName;
                }
                else {
                    clone.className += newClassName;
                }
                return anonymousReplacedElement;
            };
            DocumentCloner.destroy = function (container) {
                if (container.parentNode) {
                    container.parentNode.removeChild(container);
                    return true;
                }
                return false;
            };
            return DocumentCloner;
        }());
        var PseudoElementType;
        (function (PseudoElementType) {
            PseudoElementType[PseudoElementType["BEFORE"] = 0] = "BEFORE";
            PseudoElementType[PseudoElementType["AFTER"] = 1] = "AFTER";
        })(PseudoElementType || (PseudoElementType = {}));
        var createIFrameContainer = function (ownerDocument, bounds) {
            var cloneIframeContainer = ownerDocument.createElement('iframe');
            cloneIframeContainer.className = 'html2canvas-container';
            cloneIframeContainer.style.visibility = 'hidden';
            cloneIframeContainer.style.position = 'fixed';
            cloneIframeContainer.style.left = '-10000px';
            cloneIframeContainer.style.top = '0px';
            cloneIframeContainer.style.border = '0';
            cloneIframeContainer.width = bounds.width.toString();
            cloneIframeContainer.height = bounds.height.toString();
            cloneIframeContainer.scrolling = 'no'; // ios won't scroll without it
            cloneIframeContainer.setAttribute(IGNORE_ATTRIBUTE, 'true');
            ownerDocument.body.appendChild(cloneIframeContainer);
            return cloneIframeContainer;
        };
        var imageReady = function (img) {
            return new Promise(function (resolve) {
                if (img.complete) {
                    resolve();
                    return;
                }
                if (!img.src) {
                    resolve();
                    return;
                }
                img.onload = resolve;
                img.onerror = resolve;
            });
        };
        var imagesReady = function (document) {
            return Promise.all([].slice.call(document.images, 0).map(imageReady));
        };
        var iframeLoader = function (iframe) {
            return new Promise(function (resolve, reject) {
                var cloneWindow = iframe.contentWindow;
                if (!cloneWindow) {
                    return reject("No window assigned for iframe");
                }
                var documentClone = cloneWindow.document;
                cloneWindow.onload = iframe.onload = function () {
                    cloneWindow.onload = iframe.onload = null;
                    var interval = setInterval(function () {
                        if (documentClone.body.childNodes.length > 0 && documentClone.readyState === 'complete') {
                            clearInterval(interval);
                            resolve(iframe);
                        }
                    }, 50);
                };
            });
        };
        var ignoredStyleProperties = [
            'all',
            'd',
            'content' // Safari shows pseudoelements if content is set
        ];
        var copyCSSStyles = function (style, target) {
            // Edge does not provide value for cssText
            for (var i = style.length - 1; i >= 0; i--) {
                var property = style.item(i);
                if (ignoredStyleProperties.indexOf(property) === -1) {
                    target.style.setProperty(property, style.getPropertyValue(property));
                }
            }
            return target;
        };
        var serializeDoctype = function (doctype) {
            var str = '';
            if (doctype) {
                str += '<!DOCTYPE ';
                if (doctype.name) {
                    str += doctype.name;
                }
                if (doctype.internalSubset) {
                    str += doctype.internalSubset;
                }
                if (doctype.publicId) {
                    str += "\"" + doctype.publicId + "\"";
                }
                if (doctype.systemId) {
                    str += "\"" + doctype.systemId + "\"";
                }
                str += '>';
            }
            return str;
        };
        var restoreOwnerScroll = function (ownerDocument, x, y) {
            if (ownerDocument &&
                ownerDocument.defaultView &&
                (x !== ownerDocument.defaultView.pageXOffset || y !== ownerDocument.defaultView.pageYOffset)) {
                ownerDocument.defaultView.scrollTo(x, y);
            }
        };
        var restoreNodeScroll = function (_a) {
            var element = _a[0], x = _a[1], y = _a[2];
            element.scrollLeft = x;
            element.scrollTop = y;
        };
        var PSEUDO_BEFORE = ':before';
        var PSEUDO_AFTER = ':after';
        var PSEUDO_HIDE_ELEMENT_CLASS_BEFORE = '___html2canvas___pseudoelement_before';
        var PSEUDO_HIDE_ELEMENT_CLASS_AFTER = '___html2canvas___pseudoelement_after';
        var PSEUDO_HIDE_ELEMENT_STYLE = "{\n    content: \"\" !important;\n    display: none !important;\n}";
        var createPseudoHideStyles = function (body) {
            createStyles(body, "." + PSEUDO_HIDE_ELEMENT_CLASS_BEFORE + PSEUDO_BEFORE + PSEUDO_HIDE_ELEMENT_STYLE + "\n         ." + PSEUDO_HIDE_ELEMENT_CLASS_AFTER + PSEUDO_AFTER + PSEUDO_HIDE_ELEMENT_STYLE);
        };
        var createStyles = function (body, styles) {
            var document = body.ownerDocument;
            if (document) {
                var style = document.createElement('style');
                style.textContent = styles;
                body.appendChild(style);
            }
        };

        var CacheStorage = /** @class */ (function () {
            function CacheStorage() {
            }
            CacheStorage.getOrigin = function (url) {
                var link = CacheStorage._link;
                if (!link) {
                    return 'about:blank';
                }
                link.href = url;
                link.href = link.href; // IE9, LOL! - http://jsfiddle.net/niklasvh/2e48b/
                return link.protocol + link.hostname + link.port;
            };
            CacheStorage.isSameOrigin = function (src) {
                return CacheStorage.getOrigin(src) === CacheStorage._origin;
            };
            CacheStorage.setContext = function (window) {
                CacheStorage._link = window.document.createElement('a');
                CacheStorage._origin = CacheStorage.getOrigin(window.location.href);
            };
            CacheStorage._origin = 'about:blank';
            return CacheStorage;
        }());
        var Cache = /** @class */ (function () {
            function Cache(context, _options) {
                this.context = context;
                this._options = _options;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this._cache = {};
            }
            Cache.prototype.addImage = function (src) {
                var result = Promise.resolve();
                if (this.has(src)) {
                    return result;
                }
                if (isBlobImage(src) || isRenderable(src)) {
                    (this._cache[src] = this.loadImage(src)).catch(function () {
                        // prevent unhandled rejection
                    });
                    return result;
                }
                return result;
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Cache.prototype.match = function (src) {
                return this._cache[src];
            };
            Cache.prototype.loadImage = function (key) {
                return __awaiter(this, void 0, void 0, function () {
                    var isSameOrigin, useCORS, useProxy, src;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                isSameOrigin = CacheStorage.isSameOrigin(key);
                                useCORS = !isInlineImage(key) && this._options.useCORS === true && FEATURES.SUPPORT_CORS_IMAGES && !isSameOrigin;
                                useProxy = !isInlineImage(key) &&
                                    !isSameOrigin &&
                                    !isBlobImage(key) &&
                                    typeof this._options.proxy === 'string' &&
                                    FEATURES.SUPPORT_CORS_XHR &&
                                    !useCORS;
                                if (!isSameOrigin &&
                                    this._options.allowTaint === false &&
                                    !isInlineImage(key) &&
                                    !isBlobImage(key) &&
                                    !useProxy &&
                                    !useCORS) {
                                    return [2 /*return*/];
                                }
                                src = key;
                                if (!useProxy) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.proxy(src)];
                            case 1:
                                src = _a.sent();
                                _a.label = 2;
                            case 2:
                                this.context.logger.debug("Added image " + key.substring(0, 256));
                                return [4 /*yield*/, new Promise(function (resolve, reject) {
                                        var img = new Image();
                                        img.onload = function () { return resolve(img); };
                                        img.onerror = reject;
                                        //ios safari 10.3 taints canvas with data urls unless crossOrigin is set to anonymous
                                        if (isInlineBase64Image(src) || useCORS) {
                                            img.crossOrigin = 'anonymous';
                                        }
                                        img.src = src;
                                        if (img.complete === true) {
                                            // Inline XML images may fail to parse, throwing an Error later on
                                            setTimeout(function () { return resolve(img); }, 500);
                                        }
                                        if (_this._options.imageTimeout > 0) {
                                            setTimeout(function () { return reject("Timed out (" + _this._options.imageTimeout + "ms) loading image"); }, _this._options.imageTimeout);
                                        }
                                    })];
                            case 3: return [2 /*return*/, _a.sent()];
                        }
                    });
                });
            };
            Cache.prototype.has = function (key) {
                return typeof this._cache[key] !== 'undefined';
            };
            Cache.prototype.keys = function () {
                return Promise.resolve(Object.keys(this._cache));
            };
            Cache.prototype.proxy = function (src) {
                var _this = this;
                var proxy = this._options.proxy;
                if (!proxy) {
                    throw new Error('No proxy defined');
                }
                var key = src.substring(0, 256);
                return new Promise(function (resolve, reject) {
                    var responseType = FEATURES.SUPPORT_RESPONSE_TYPE ? 'blob' : 'text';
                    var xhr = new XMLHttpRequest();
                    xhr.onload = function () {
                        if (xhr.status === 200) {
                            if (responseType === 'text') {
                                resolve(xhr.response);
                            }
                            else {
                                var reader_1 = new FileReader();
                                reader_1.addEventListener('load', function () { return resolve(reader_1.result); }, false);
                                reader_1.addEventListener('error', function (e) { return reject(e); }, false);
                                reader_1.readAsDataURL(xhr.response);
                            }
                        }
                        else {
                            reject("Failed to proxy resource " + key + " with status code " + xhr.status);
                        }
                    };
                    xhr.onerror = reject;
                    var queryString = proxy.indexOf('?') > -1 ? '&' : '?';
                    xhr.open('GET', "" + proxy + queryString + "url=" + encodeURIComponent(src) + "&responseType=" + responseType);
                    if (responseType !== 'text' && xhr instanceof XMLHttpRequest) {
                        xhr.responseType = responseType;
                    }
                    if (_this._options.imageTimeout) {
                        var timeout_1 = _this._options.imageTimeout;
                        xhr.timeout = timeout_1;
                        xhr.ontimeout = function () { return reject("Timed out (" + timeout_1 + "ms) proxying " + key); };
                    }
                    xhr.send();
                });
            };
            return Cache;
        }());
        var INLINE_SVG = /^data:image\/svg\+xml/i;
        var INLINE_BASE64 = /^data:image\/.*;base64,/i;
        var INLINE_IMG = /^data:image\/.*/i;
        var isRenderable = function (src) { return FEATURES.SUPPORT_SVG_DRAWING || !isSVG(src); };
        var isInlineImage = function (src) { return INLINE_IMG.test(src); };
        var isInlineBase64Image = function (src) { return INLINE_BASE64.test(src); };
        var isBlobImage = function (src) { return src.substr(0, 4) === 'blob'; };
        var isSVG = function (src) { return src.substr(-3).toLowerCase() === 'svg' || INLINE_SVG.test(src); };

        var Vector = /** @class */ (function () {
            function Vector(x, y) {
                this.type = 0 /* VECTOR */;
                this.x = x;
                this.y = y;
            }
            Vector.prototype.add = function (deltaX, deltaY) {
                return new Vector(this.x + deltaX, this.y + deltaY);
            };
            return Vector;
        }());

        var lerp = function (a, b, t) {
            return new Vector(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
        };
        var BezierCurve = /** @class */ (function () {
            function BezierCurve(start, startControl, endControl, end) {
                this.type = 1 /* BEZIER_CURVE */;
                this.start = start;
                this.startControl = startControl;
                this.endControl = endControl;
                this.end = end;
            }
            BezierCurve.prototype.subdivide = function (t, firstHalf) {
                var ab = lerp(this.start, this.startControl, t);
                var bc = lerp(this.startControl, this.endControl, t);
                var cd = lerp(this.endControl, this.end, t);
                var abbc = lerp(ab, bc, t);
                var bccd = lerp(bc, cd, t);
                var dest = lerp(abbc, bccd, t);
                return firstHalf ? new BezierCurve(this.start, ab, abbc, dest) : new BezierCurve(dest, bccd, cd, this.end);
            };
            BezierCurve.prototype.add = function (deltaX, deltaY) {
                return new BezierCurve(this.start.add(deltaX, deltaY), this.startControl.add(deltaX, deltaY), this.endControl.add(deltaX, deltaY), this.end.add(deltaX, deltaY));
            };
            BezierCurve.prototype.reverse = function () {
                return new BezierCurve(this.end, this.endControl, this.startControl, this.start);
            };
            return BezierCurve;
        }());
        var isBezierCurve = function (path) { return path.type === 1 /* BEZIER_CURVE */; };

        var BoundCurves = /** @class */ (function () {
            function BoundCurves(element) {
                var styles = element.styles;
                var bounds = element.bounds;
                var _a = getAbsoluteValueForTuple(styles.borderTopLeftRadius, bounds.width, bounds.height), tlh = _a[0], tlv = _a[1];
                var _b = getAbsoluteValueForTuple(styles.borderTopRightRadius, bounds.width, bounds.height), trh = _b[0], trv = _b[1];
                var _c = getAbsoluteValueForTuple(styles.borderBottomRightRadius, bounds.width, bounds.height), brh = _c[0], brv = _c[1];
                var _d = getAbsoluteValueForTuple(styles.borderBottomLeftRadius, bounds.width, bounds.height), blh = _d[0], blv = _d[1];
                var factors = [];
                factors.push((tlh + trh) / bounds.width);
                factors.push((blh + brh) / bounds.width);
                factors.push((tlv + blv) / bounds.height);
                factors.push((trv + brv) / bounds.height);
                var maxFactor = Math.max.apply(Math, factors);
                if (maxFactor > 1) {
                    tlh /= maxFactor;
                    tlv /= maxFactor;
                    trh /= maxFactor;
                    trv /= maxFactor;
                    brh /= maxFactor;
                    brv /= maxFactor;
                    blh /= maxFactor;
                    blv /= maxFactor;
                }
                var topWidth = bounds.width - trh;
                var rightHeight = bounds.height - brv;
                var bottomWidth = bounds.width - brh;
                var leftHeight = bounds.height - blv;
                var borderTopWidth = styles.borderTopWidth;
                var borderRightWidth = styles.borderRightWidth;
                var borderBottomWidth = styles.borderBottomWidth;
                var borderLeftWidth = styles.borderLeftWidth;
                var paddingTop = getAbsoluteValue(styles.paddingTop, element.bounds.width);
                var paddingRight = getAbsoluteValue(styles.paddingRight, element.bounds.width);
                var paddingBottom = getAbsoluteValue(styles.paddingBottom, element.bounds.width);
                var paddingLeft = getAbsoluteValue(styles.paddingLeft, element.bounds.width);
                this.topLeftBorderDoubleOuterBox =
                    tlh > 0 || tlv > 0
                        ? getCurvePoints(bounds.left + borderLeftWidth / 3, bounds.top + borderTopWidth / 3, tlh - borderLeftWidth / 3, tlv - borderTopWidth / 3, CORNER.TOP_LEFT)
                        : new Vector(bounds.left + borderLeftWidth / 3, bounds.top + borderTopWidth / 3);
                this.topRightBorderDoubleOuterBox =
                    tlh > 0 || tlv > 0
                        ? getCurvePoints(bounds.left + topWidth, bounds.top + borderTopWidth / 3, trh - borderRightWidth / 3, trv - borderTopWidth / 3, CORNER.TOP_RIGHT)
                        : new Vector(bounds.left + bounds.width - borderRightWidth / 3, bounds.top + borderTopWidth / 3);
                this.bottomRightBorderDoubleOuterBox =
                    brh > 0 || brv > 0
                        ? getCurvePoints(bounds.left + bottomWidth, bounds.top + rightHeight, brh - borderRightWidth / 3, brv - borderBottomWidth / 3, CORNER.BOTTOM_RIGHT)
                        : new Vector(bounds.left + bounds.width - borderRightWidth / 3, bounds.top + bounds.height - borderBottomWidth / 3);
                this.bottomLeftBorderDoubleOuterBox =
                    blh > 0 || blv > 0
                        ? getCurvePoints(bounds.left + borderLeftWidth / 3, bounds.top + leftHeight, blh - borderLeftWidth / 3, blv - borderBottomWidth / 3, CORNER.BOTTOM_LEFT)
                        : new Vector(bounds.left + borderLeftWidth / 3, bounds.top + bounds.height - borderBottomWidth / 3);
                this.topLeftBorderDoubleInnerBox =
                    tlh > 0 || tlv > 0
                        ? getCurvePoints(bounds.left + (borderLeftWidth * 2) / 3, bounds.top + (borderTopWidth * 2) / 3, tlh - (borderLeftWidth * 2) / 3, tlv - (borderTopWidth * 2) / 3, CORNER.TOP_LEFT)
                        : new Vector(bounds.left + (borderLeftWidth * 2) / 3, bounds.top + (borderTopWidth * 2) / 3);
                this.topRightBorderDoubleInnerBox =
                    tlh > 0 || tlv > 0
                        ? getCurvePoints(bounds.left + topWidth, bounds.top + (borderTopWidth * 2) / 3, trh - (borderRightWidth * 2) / 3, trv - (borderTopWidth * 2) / 3, CORNER.TOP_RIGHT)
                        : new Vector(bounds.left + bounds.width - (borderRightWidth * 2) / 3, bounds.top + (borderTopWidth * 2) / 3);
                this.bottomRightBorderDoubleInnerBox =
                    brh > 0 || brv > 0
                        ? getCurvePoints(bounds.left + bottomWidth, bounds.top + rightHeight, brh - (borderRightWidth * 2) / 3, brv - (borderBottomWidth * 2) / 3, CORNER.BOTTOM_RIGHT)
                        : new Vector(bounds.left + bounds.width - (borderRightWidth * 2) / 3, bounds.top + bounds.height - (borderBottomWidth * 2) / 3);
                this.bottomLeftBorderDoubleInnerBox =
                    blh > 0 || blv > 0
                        ? getCurvePoints(bounds.left + (borderLeftWidth * 2) / 3, bounds.top + leftHeight, blh - (borderLeftWidth * 2) / 3, blv - (borderBottomWidth * 2) / 3, CORNER.BOTTOM_LEFT)
                        : new Vector(bounds.left + (borderLeftWidth * 2) / 3, bounds.top + bounds.height - (borderBottomWidth * 2) / 3);
                this.topLeftBorderStroke =
                    tlh > 0 || tlv > 0
                        ? getCurvePoints(bounds.left + borderLeftWidth / 2, bounds.top + borderTopWidth / 2, tlh - borderLeftWidth / 2, tlv - borderTopWidth / 2, CORNER.TOP_LEFT)
                        : new Vector(bounds.left + borderLeftWidth / 2, bounds.top + borderTopWidth / 2);
                this.topRightBorderStroke =
                    tlh > 0 || tlv > 0
                        ? getCurvePoints(bounds.left + topWidth, bounds.top + borderTopWidth / 2, trh - borderRightWidth / 2, trv - borderTopWidth / 2, CORNER.TOP_RIGHT)
                        : new Vector(bounds.left + bounds.width - borderRightWidth / 2, bounds.top + borderTopWidth / 2);
                this.bottomRightBorderStroke =
                    brh > 0 || brv > 0
                        ? getCurvePoints(bounds.left + bottomWidth, bounds.top + rightHeight, brh - borderRightWidth / 2, brv - borderBottomWidth / 2, CORNER.BOTTOM_RIGHT)
                        : new Vector(bounds.left + bounds.width - borderRightWidth / 2, bounds.top + bounds.height - borderBottomWidth / 2);
                this.bottomLeftBorderStroke =
                    blh > 0 || blv > 0
                        ? getCurvePoints(bounds.left + borderLeftWidth / 2, bounds.top + leftHeight, blh - borderLeftWidth / 2, blv - borderBottomWidth / 2, CORNER.BOTTOM_LEFT)
                        : new Vector(bounds.left + borderLeftWidth / 2, bounds.top + bounds.height - borderBottomWidth / 2);
                this.topLeftBorderBox =
                    tlh > 0 || tlv > 0
                        ? getCurvePoints(bounds.left, bounds.top, tlh, tlv, CORNER.TOP_LEFT)
                        : new Vector(bounds.left, bounds.top);
                this.topRightBorderBox =
                    trh > 0 || trv > 0
                        ? getCurvePoints(bounds.left + topWidth, bounds.top, trh, trv, CORNER.TOP_RIGHT)
                        : new Vector(bounds.left + bounds.width, bounds.top);
                this.bottomRightBorderBox =
                    brh > 0 || brv > 0
                        ? getCurvePoints(bounds.left + bottomWidth, bounds.top + rightHeight, brh, brv, CORNER.BOTTOM_RIGHT)
                        : new Vector(bounds.left + bounds.width, bounds.top + bounds.height);
                this.bottomLeftBorderBox =
                    blh > 0 || blv > 0
                        ? getCurvePoints(bounds.left, bounds.top + leftHeight, blh, blv, CORNER.BOTTOM_LEFT)
                        : new Vector(bounds.left, bounds.top + bounds.height);
                this.topLeftPaddingBox =
                    tlh > 0 || tlv > 0
                        ? getCurvePoints(bounds.left + borderLeftWidth, bounds.top + borderTopWidth, Math.max(0, tlh - borderLeftWidth), Math.max(0, tlv - borderTopWidth), CORNER.TOP_LEFT)
                        : new Vector(bounds.left + borderLeftWidth, bounds.top + borderTopWidth);
                this.topRightPaddingBox =
                    trh > 0 || trv > 0
                        ? getCurvePoints(bounds.left + Math.min(topWidth, bounds.width - borderRightWidth), bounds.top + borderTopWidth, topWidth > bounds.width + borderRightWidth ? 0 : Math.max(0, trh - borderRightWidth), Math.max(0, trv - borderTopWidth), CORNER.TOP_RIGHT)
                        : new Vector(bounds.left + bounds.width - borderRightWidth, bounds.top + borderTopWidth);
                this.bottomRightPaddingBox =
                    brh > 0 || brv > 0
                        ? getCurvePoints(bounds.left + Math.min(bottomWidth, bounds.width - borderLeftWidth), bounds.top + Math.min(rightHeight, bounds.height - borderBottomWidth), Math.max(0, brh - borderRightWidth), Math.max(0, brv - borderBottomWidth), CORNER.BOTTOM_RIGHT)
                        : new Vector(bounds.left + bounds.width - borderRightWidth, bounds.top + bounds.height - borderBottomWidth);
                this.bottomLeftPaddingBox =
                    blh > 0 || blv > 0
                        ? getCurvePoints(bounds.left + borderLeftWidth, bounds.top + Math.min(leftHeight, bounds.height - borderBottomWidth), Math.max(0, blh - borderLeftWidth), Math.max(0, blv - borderBottomWidth), CORNER.BOTTOM_LEFT)
                        : new Vector(bounds.left + borderLeftWidth, bounds.top + bounds.height - borderBottomWidth);
                this.topLeftContentBox =
                    tlh > 0 || tlv > 0
                        ? getCurvePoints(bounds.left + borderLeftWidth + paddingLeft, bounds.top + borderTopWidth + paddingTop, Math.max(0, tlh - (borderLeftWidth + paddingLeft)), Math.max(0, tlv - (borderTopWidth + paddingTop)), CORNER.TOP_LEFT)
                        : new Vector(bounds.left + borderLeftWidth + paddingLeft, bounds.top + borderTopWidth + paddingTop);
                this.topRightContentBox =
                    trh > 0 || trv > 0
                        ? getCurvePoints(bounds.left + Math.min(topWidth, bounds.width + borderLeftWidth + paddingLeft), bounds.top + borderTopWidth + paddingTop, topWidth > bounds.width + borderLeftWidth + paddingLeft ? 0 : trh - borderLeftWidth + paddingLeft, trv - (borderTopWidth + paddingTop), CORNER.TOP_RIGHT)
                        : new Vector(bounds.left + bounds.width - (borderRightWidth + paddingRight), bounds.top + borderTopWidth + paddingTop);
                this.bottomRightContentBox =
                    brh > 0 || brv > 0
                        ? getCurvePoints(bounds.left + Math.min(bottomWidth, bounds.width - (borderLeftWidth + paddingLeft)), bounds.top + Math.min(rightHeight, bounds.height + borderTopWidth + paddingTop), Math.max(0, brh - (borderRightWidth + paddingRight)), brv - (borderBottomWidth + paddingBottom), CORNER.BOTTOM_RIGHT)
                        : new Vector(bounds.left + bounds.width - (borderRightWidth + paddingRight), bounds.top + bounds.height - (borderBottomWidth + paddingBottom));
                this.bottomLeftContentBox =
                    blh > 0 || blv > 0
                        ? getCurvePoints(bounds.left + borderLeftWidth + paddingLeft, bounds.top + leftHeight, Math.max(0, blh - (borderLeftWidth + paddingLeft)), blv - (borderBottomWidth + paddingBottom), CORNER.BOTTOM_LEFT)
                        : new Vector(bounds.left + borderLeftWidth + paddingLeft, bounds.top + bounds.height - (borderBottomWidth + paddingBottom));
            }
            return BoundCurves;
        }());
        var CORNER;
        (function (CORNER) {
            CORNER[CORNER["TOP_LEFT"] = 0] = "TOP_LEFT";
            CORNER[CORNER["TOP_RIGHT"] = 1] = "TOP_RIGHT";
            CORNER[CORNER["BOTTOM_RIGHT"] = 2] = "BOTTOM_RIGHT";
            CORNER[CORNER["BOTTOM_LEFT"] = 3] = "BOTTOM_LEFT";
        })(CORNER || (CORNER = {}));
        var getCurvePoints = function (x, y, r1, r2, position) {
            var kappa = 4 * ((Math.sqrt(2) - 1) / 3);
            var ox = r1 * kappa; // control point offset horizontal
            var oy = r2 * kappa; // control point offset vertical
            var xm = x + r1; // x-middle
            var ym = y + r2; // y-middle
            switch (position) {
                case CORNER.TOP_LEFT:
                    return new BezierCurve(new Vector(x, ym), new Vector(x, ym - oy), new Vector(xm - ox, y), new Vector(xm, y));
                case CORNER.TOP_RIGHT:
                    return new BezierCurve(new Vector(x, y), new Vector(x + ox, y), new Vector(xm, ym - oy), new Vector(xm, ym));
                case CORNER.BOTTOM_RIGHT:
                    return new BezierCurve(new Vector(xm, y), new Vector(xm, y + oy), new Vector(x + ox, ym), new Vector(x, ym));
                case CORNER.BOTTOM_LEFT:
                default:
                    return new BezierCurve(new Vector(xm, ym), new Vector(xm - ox, ym), new Vector(x, y + oy), new Vector(x, y));
            }
        };
        var calculateBorderBoxPath = function (curves) {
            return [curves.topLeftBorderBox, curves.topRightBorderBox, curves.bottomRightBorderBox, curves.bottomLeftBorderBox];
        };
        var calculateContentBoxPath = function (curves) {
            return [
                curves.topLeftContentBox,
                curves.topRightContentBox,
                curves.bottomRightContentBox,
                curves.bottomLeftContentBox
            ];
        };
        var calculatePaddingBoxPath = function (curves) {
            return [
                curves.topLeftPaddingBox,
                curves.topRightPaddingBox,
                curves.bottomRightPaddingBox,
                curves.bottomLeftPaddingBox
            ];
        };

        var TransformEffect = /** @class */ (function () {
            function TransformEffect(offsetX, offsetY, matrix) {
                this.offsetX = offsetX;
                this.offsetY = offsetY;
                this.matrix = matrix;
                this.type = 0 /* TRANSFORM */;
                this.target = 2 /* BACKGROUND_BORDERS */ | 4 /* CONTENT */;
            }
            return TransformEffect;
        }());
        var ClipEffect = /** @class */ (function () {
            function ClipEffect(path, target) {
                this.path = path;
                this.target = target;
                this.type = 1 /* CLIP */;
            }
            return ClipEffect;
        }());
        var OpacityEffect = /** @class */ (function () {
            function OpacityEffect(opacity) {
                this.opacity = opacity;
                this.type = 2 /* OPACITY */;
                this.target = 2 /* BACKGROUND_BORDERS */ | 4 /* CONTENT */;
            }
            return OpacityEffect;
        }());
        var isTransformEffect = function (effect) {
            return effect.type === 0 /* TRANSFORM */;
        };
        var isClipEffect = function (effect) { return effect.type === 1 /* CLIP */; };
        var isOpacityEffect = function (effect) { return effect.type === 2 /* OPACITY */; };

        var equalPath = function (a, b) {
            if (a.length === b.length) {
                return a.some(function (v, i) { return v === b[i]; });
            }
            return false;
        };
        var transformPath = function (path, deltaX, deltaY, deltaW, deltaH) {
            return path.map(function (point, index) {
                switch (index) {
                    case 0:
                        return point.add(deltaX, deltaY);
                    case 1:
                        return point.add(deltaX + deltaW, deltaY);
                    case 2:
                        return point.add(deltaX + deltaW, deltaY + deltaH);
                    case 3:
                        return point.add(deltaX, deltaY + deltaH);
                }
                return point;
            });
        };

        var StackingContext = /** @class */ (function () {
            function StackingContext(container) {
                this.element = container;
                this.inlineLevel = [];
                this.nonInlineLevel = [];
                this.negativeZIndex = [];
                this.zeroOrAutoZIndexOrTransformedOrOpacity = [];
                this.positiveZIndex = [];
                this.nonPositionedFloats = [];
                this.nonPositionedInlineLevel = [];
            }
            return StackingContext;
        }());
        var ElementPaint = /** @class */ (function () {
            function ElementPaint(container, parent) {
                this.container = container;
                this.parent = parent;
                this.effects = [];
                this.curves = new BoundCurves(this.container);
                if (this.container.styles.opacity < 1) {
                    this.effects.push(new OpacityEffect(this.container.styles.opacity));
                }
                if (this.container.styles.transform !== null) {
                    var offsetX = this.container.bounds.left + this.container.styles.transformOrigin[0].number;
                    var offsetY = this.container.bounds.top + this.container.styles.transformOrigin[1].number;
                    var matrix = this.container.styles.transform;
                    this.effects.push(new TransformEffect(offsetX, offsetY, matrix));
                }
                if (this.container.styles.overflowX !== 0 /* VISIBLE */) {
                    var borderBox = calculateBorderBoxPath(this.curves);
                    var paddingBox = calculatePaddingBoxPath(this.curves);
                    if (equalPath(borderBox, paddingBox)) {
                        this.effects.push(new ClipEffect(borderBox, 2 /* BACKGROUND_BORDERS */ | 4 /* CONTENT */));
                    }
                    else {
                        this.effects.push(new ClipEffect(borderBox, 2 /* BACKGROUND_BORDERS */));
                        this.effects.push(new ClipEffect(paddingBox, 4 /* CONTENT */));
                    }
                }
            }
            ElementPaint.prototype.getEffects = function (target) {
                var inFlow = [2 /* ABSOLUTE */, 3 /* FIXED */].indexOf(this.container.styles.position) === -1;
                var parent = this.parent;
                var effects = this.effects.slice(0);
                while (parent) {
                    var croplessEffects = parent.effects.filter(function (effect) { return !isClipEffect(effect); });
                    if (inFlow || parent.container.styles.position !== 0 /* STATIC */ || !parent.parent) {
                        effects.unshift.apply(effects, croplessEffects);
                        inFlow = [2 /* ABSOLUTE */, 3 /* FIXED */].indexOf(parent.container.styles.position) === -1;
                        if (parent.container.styles.overflowX !== 0 /* VISIBLE */) {
                            var borderBox = calculateBorderBoxPath(parent.curves);
                            var paddingBox = calculatePaddingBoxPath(parent.curves);
                            if (!equalPath(borderBox, paddingBox)) {
                                effects.unshift(new ClipEffect(paddingBox, 2 /* BACKGROUND_BORDERS */ | 4 /* CONTENT */));
                            }
                        }
                    }
                    else {
                        effects.unshift.apply(effects, croplessEffects);
                    }
                    parent = parent.parent;
                }
                return effects.filter(function (effect) { return contains(effect.target, target); });
            };
            return ElementPaint;
        }());
        var parseStackTree = function (parent, stackingContext, realStackingContext, listItems) {
            parent.container.elements.forEach(function (child) {
                var treatAsRealStackingContext = contains(child.flags, 4 /* CREATES_REAL_STACKING_CONTEXT */);
                var createsStackingContext = contains(child.flags, 2 /* CREATES_STACKING_CONTEXT */);
                var paintContainer = new ElementPaint(child, parent);
                if (contains(child.styles.display, 2048 /* LIST_ITEM */)) {
                    listItems.push(paintContainer);
                }
                var listOwnerItems = contains(child.flags, 8 /* IS_LIST_OWNER */) ? [] : listItems;
                if (treatAsRealStackingContext || createsStackingContext) {
                    var parentStack = treatAsRealStackingContext || child.styles.isPositioned() ? realStackingContext : stackingContext;
                    var stack = new StackingContext(paintContainer);
                    if (child.styles.isPositioned() || child.styles.opacity < 1 || child.styles.isTransformed()) {
                        var order_1 = child.styles.zIndex.order;
                        if (order_1 < 0) {
                            var index_1 = 0;
                            parentStack.negativeZIndex.some(function (current, i) {
                                if (order_1 > current.element.container.styles.zIndex.order) {
                                    index_1 = i;
                                    return false;
                                }
                                else if (index_1 > 0) {
                                    return true;
                                }
                                return false;
                            });
                            parentStack.negativeZIndex.splice(index_1, 0, stack);
                        }
                        else if (order_1 > 0) {
                            var index_2 = 0;
                            parentStack.positiveZIndex.some(function (current, i) {
                                if (order_1 >= current.element.container.styles.zIndex.order) {
                                    index_2 = i + 1;
                                    return false;
                                }
                                else if (index_2 > 0) {
                                    return true;
                                }
                                return false;
                            });
                            parentStack.positiveZIndex.splice(index_2, 0, stack);
                        }
                        else {
                            parentStack.zeroOrAutoZIndexOrTransformedOrOpacity.push(stack);
                        }
                    }
                    else {
                        if (child.styles.isFloating()) {
                            parentStack.nonPositionedFloats.push(stack);
                        }
                        else {
                            parentStack.nonPositionedInlineLevel.push(stack);
                        }
                    }
                    parseStackTree(paintContainer, stack, treatAsRealStackingContext ? stack : realStackingContext, listOwnerItems);
                }
                else {
                    if (child.styles.isInlineLevel()) {
                        stackingContext.inlineLevel.push(paintContainer);
                    }
                    else {
                        stackingContext.nonInlineLevel.push(paintContainer);
                    }
                    parseStackTree(paintContainer, stackingContext, realStackingContext, listOwnerItems);
                }
                if (contains(child.flags, 8 /* IS_LIST_OWNER */)) {
                    processListItems(child, listOwnerItems);
                }
            });
        };
        var processListItems = function (owner, elements) {
            var numbering = owner instanceof OLElementContainer ? owner.start : 1;
            var reversed = owner instanceof OLElementContainer ? owner.reversed : false;
            for (var i = 0; i < elements.length; i++) {
                var item = elements[i];
                if (item.container instanceof LIElementContainer &&
                    typeof item.container.value === 'number' &&
                    item.container.value !== 0) {
                    numbering = item.container.value;
                }
                item.listValue = createCounterText(numbering, item.container.styles.listStyleType, true);
                numbering += reversed ? -1 : 1;
            }
        };
        var parseStackingContexts = function (container) {
            var paintContainer = new ElementPaint(container, null);
            var root = new StackingContext(paintContainer);
            var listItems = [];
            parseStackTree(paintContainer, root, root, listItems);
            processListItems(paintContainer.container, listItems);
            return root;
        };

        var parsePathForBorder = function (curves, borderSide) {
            switch (borderSide) {
                case 0:
                    return createPathFromCurves(curves.topLeftBorderBox, curves.topLeftPaddingBox, curves.topRightBorderBox, curves.topRightPaddingBox);
                case 1:
                    return createPathFromCurves(curves.topRightBorderBox, curves.topRightPaddingBox, curves.bottomRightBorderBox, curves.bottomRightPaddingBox);
                case 2:
                    return createPathFromCurves(curves.bottomRightBorderBox, curves.bottomRightPaddingBox, curves.bottomLeftBorderBox, curves.bottomLeftPaddingBox);
                case 3:
                default:
                    return createPathFromCurves(curves.bottomLeftBorderBox, curves.bottomLeftPaddingBox, curves.topLeftBorderBox, curves.topLeftPaddingBox);
            }
        };
        var parsePathForBorderDoubleOuter = function (curves, borderSide) {
            switch (borderSide) {
                case 0:
                    return createPathFromCurves(curves.topLeftBorderBox, curves.topLeftBorderDoubleOuterBox, curves.topRightBorderBox, curves.topRightBorderDoubleOuterBox);
                case 1:
                    return createPathFromCurves(curves.topRightBorderBox, curves.topRightBorderDoubleOuterBox, curves.bottomRightBorderBox, curves.bottomRightBorderDoubleOuterBox);
                case 2:
                    return createPathFromCurves(curves.bottomRightBorderBox, curves.bottomRightBorderDoubleOuterBox, curves.bottomLeftBorderBox, curves.bottomLeftBorderDoubleOuterBox);
                case 3:
                default:
                    return createPathFromCurves(curves.bottomLeftBorderBox, curves.bottomLeftBorderDoubleOuterBox, curves.topLeftBorderBox, curves.topLeftBorderDoubleOuterBox);
            }
        };
        var parsePathForBorderDoubleInner = function (curves, borderSide) {
            switch (borderSide) {
                case 0:
                    return createPathFromCurves(curves.topLeftBorderDoubleInnerBox, curves.topLeftPaddingBox, curves.topRightBorderDoubleInnerBox, curves.topRightPaddingBox);
                case 1:
                    return createPathFromCurves(curves.topRightBorderDoubleInnerBox, curves.topRightPaddingBox, curves.bottomRightBorderDoubleInnerBox, curves.bottomRightPaddingBox);
                case 2:
                    return createPathFromCurves(curves.bottomRightBorderDoubleInnerBox, curves.bottomRightPaddingBox, curves.bottomLeftBorderDoubleInnerBox, curves.bottomLeftPaddingBox);
                case 3:
                default:
                    return createPathFromCurves(curves.bottomLeftBorderDoubleInnerBox, curves.bottomLeftPaddingBox, curves.topLeftBorderDoubleInnerBox, curves.topLeftPaddingBox);
            }
        };
        var parsePathForBorderStroke = function (curves, borderSide) {
            switch (borderSide) {
                case 0:
                    return createStrokePathFromCurves(curves.topLeftBorderStroke, curves.topRightBorderStroke);
                case 1:
                    return createStrokePathFromCurves(curves.topRightBorderStroke, curves.bottomRightBorderStroke);
                case 2:
                    return createStrokePathFromCurves(curves.bottomRightBorderStroke, curves.bottomLeftBorderStroke);
                case 3:
                default:
                    return createStrokePathFromCurves(curves.bottomLeftBorderStroke, curves.topLeftBorderStroke);
            }
        };
        var createStrokePathFromCurves = function (outer1, outer2) {
            var path = [];
            if (isBezierCurve(outer1)) {
                path.push(outer1.subdivide(0.5, false));
            }
            else {
                path.push(outer1);
            }
            if (isBezierCurve(outer2)) {
                path.push(outer2.subdivide(0.5, true));
            }
            else {
                path.push(outer2);
            }
            return path;
        };
        var createPathFromCurves = function (outer1, inner1, outer2, inner2) {
            var path = [];
            if (isBezierCurve(outer1)) {
                path.push(outer1.subdivide(0.5, false));
            }
            else {
                path.push(outer1);
            }
            if (isBezierCurve(outer2)) {
                path.push(outer2.subdivide(0.5, true));
            }
            else {
                path.push(outer2);
            }
            if (isBezierCurve(inner2)) {
                path.push(inner2.subdivide(0.5, true).reverse());
            }
            else {
                path.push(inner2);
            }
            if (isBezierCurve(inner1)) {
                path.push(inner1.subdivide(0.5, false).reverse());
            }
            else {
                path.push(inner1);
            }
            return path;
        };

        var paddingBox = function (element) {
            var bounds = element.bounds;
            var styles = element.styles;
            return bounds.add(styles.borderLeftWidth, styles.borderTopWidth, -(styles.borderRightWidth + styles.borderLeftWidth), -(styles.borderTopWidth + styles.borderBottomWidth));
        };
        var contentBox = function (element) {
            var styles = element.styles;
            var bounds = element.bounds;
            var paddingLeft = getAbsoluteValue(styles.paddingLeft, bounds.width);
            var paddingRight = getAbsoluteValue(styles.paddingRight, bounds.width);
            var paddingTop = getAbsoluteValue(styles.paddingTop, bounds.width);
            var paddingBottom = getAbsoluteValue(styles.paddingBottom, bounds.width);
            return bounds.add(paddingLeft + styles.borderLeftWidth, paddingTop + styles.borderTopWidth, -(styles.borderRightWidth + styles.borderLeftWidth + paddingLeft + paddingRight), -(styles.borderTopWidth + styles.borderBottomWidth + paddingTop + paddingBottom));
        };

        var calculateBackgroundPositioningArea = function (backgroundOrigin, element) {
            if (backgroundOrigin === 0 /* BORDER_BOX */) {
                return element.bounds;
            }
            if (backgroundOrigin === 2 /* CONTENT_BOX */) {
                return contentBox(element);
            }
            return paddingBox(element);
        };
        var calculateBackgroundPaintingArea = function (backgroundClip, element) {
            if (backgroundClip === 0 /* BORDER_BOX */) {
                return element.bounds;
            }
            if (backgroundClip === 2 /* CONTENT_BOX */) {
                return contentBox(element);
            }
            return paddingBox(element);
        };
        var calculateBackgroundRendering = function (container, index, intrinsicSize) {
            var backgroundPositioningArea = calculateBackgroundPositioningArea(getBackgroundValueForIndex(container.styles.backgroundOrigin, index), container);
            var backgroundPaintingArea = calculateBackgroundPaintingArea(getBackgroundValueForIndex(container.styles.backgroundClip, index), container);
            var backgroundImageSize = calculateBackgroundSize(getBackgroundValueForIndex(container.styles.backgroundSize, index), intrinsicSize, backgroundPositioningArea);
            var sizeWidth = backgroundImageSize[0], sizeHeight = backgroundImageSize[1];
            var position = getAbsoluteValueForTuple(getBackgroundValueForIndex(container.styles.backgroundPosition, index), backgroundPositioningArea.width - sizeWidth, backgroundPositioningArea.height - sizeHeight);
            var path = calculateBackgroundRepeatPath(getBackgroundValueForIndex(container.styles.backgroundRepeat, index), position, backgroundImageSize, backgroundPositioningArea, backgroundPaintingArea);
            var offsetX = Math.round(backgroundPositioningArea.left + position[0]);
            var offsetY = Math.round(backgroundPositioningArea.top + position[1]);
            return [path, offsetX, offsetY, sizeWidth, sizeHeight];
        };
        var isAuto = function (token) { return isIdentToken(token) && token.value === BACKGROUND_SIZE.AUTO; };
        var hasIntrinsicValue = function (value) { return typeof value === 'number'; };
        var calculateBackgroundSize = function (size, _a, bounds) {
            var intrinsicWidth = _a[0], intrinsicHeight = _a[1], intrinsicProportion = _a[2];
            var first = size[0], second = size[1];
            if (!first) {
                return [0, 0];
            }
            if (isLengthPercentage(first) && second && isLengthPercentage(second)) {
                return [getAbsoluteValue(first, bounds.width), getAbsoluteValue(second, bounds.height)];
            }
            var hasIntrinsicProportion = hasIntrinsicValue(intrinsicProportion);
            if (isIdentToken(first) && (first.value === BACKGROUND_SIZE.CONTAIN || first.value === BACKGROUND_SIZE.COVER)) {
                if (hasIntrinsicValue(intrinsicProportion)) {
                    var targetRatio = bounds.width / bounds.height;
                    return targetRatio < intrinsicProportion !== (first.value === BACKGROUND_SIZE.COVER)
                        ? [bounds.width, bounds.width / intrinsicProportion]
                        : [bounds.height * intrinsicProportion, bounds.height];
                }
                return [bounds.width, bounds.height];
            }
            var hasIntrinsicWidth = hasIntrinsicValue(intrinsicWidth);
            var hasIntrinsicHeight = hasIntrinsicValue(intrinsicHeight);
            var hasIntrinsicDimensions = hasIntrinsicWidth || hasIntrinsicHeight;
            // If the background-size is auto or auto auto:
            if (isAuto(first) && (!second || isAuto(second))) {
                // If the image has both horizontal and vertical intrinsic dimensions, it's rendered at that size.
                if (hasIntrinsicWidth && hasIntrinsicHeight) {
                    return [intrinsicWidth, intrinsicHeight];
                }
                // If the image has no intrinsic dimensions and has no intrinsic proportions,
                // it's rendered at the size of the background positioning area.
                if (!hasIntrinsicProportion && !hasIntrinsicDimensions) {
                    return [bounds.width, bounds.height];
                }
                // TODO If the image has no intrinsic dimensions but has intrinsic proportions, it's rendered as if contain had been specified instead.
                // If the image has only one intrinsic dimension and has intrinsic proportions, it's rendered at the size corresponding to that one dimension.
                // The other dimension is computed using the specified dimension and the intrinsic proportions.
                if (hasIntrinsicDimensions && hasIntrinsicProportion) {
                    var width_1 = hasIntrinsicWidth
                        ? intrinsicWidth
                        : intrinsicHeight * intrinsicProportion;
                    var height_1 = hasIntrinsicHeight
                        ? intrinsicHeight
                        : intrinsicWidth / intrinsicProportion;
                    return [width_1, height_1];
                }
                // If the image has only one intrinsic dimension but has no intrinsic proportions,
                // it's rendered using the specified dimension and the other dimension of the background positioning area.
                var width_2 = hasIntrinsicWidth ? intrinsicWidth : bounds.width;
                var height_2 = hasIntrinsicHeight ? intrinsicHeight : bounds.height;
                return [width_2, height_2];
            }
            // If the image has intrinsic proportions, it's stretched to the specified dimension.
            // The unspecified dimension is computed using the specified dimension and the intrinsic proportions.
            if (hasIntrinsicProportion) {
                var width_3 = 0;
                var height_3 = 0;
                if (isLengthPercentage(first)) {
                    width_3 = getAbsoluteValue(first, bounds.width);
                }
                else if (isLengthPercentage(second)) {
                    height_3 = getAbsoluteValue(second, bounds.height);
                }
                if (isAuto(first)) {
                    width_3 = height_3 * intrinsicProportion;
                }
                else if (!second || isAuto(second)) {
                    height_3 = width_3 / intrinsicProportion;
                }
                return [width_3, height_3];
            }
            // If the image has no intrinsic proportions, it's stretched to the specified dimension.
            // The unspecified dimension is computed using the image's corresponding intrinsic dimension,
            // if there is one. If there is no such intrinsic dimension,
            // it becomes the corresponding dimension of the background positioning area.
            var width = null;
            var height = null;
            if (isLengthPercentage(first)) {
                width = getAbsoluteValue(first, bounds.width);
            }
            else if (second && isLengthPercentage(second)) {
                height = getAbsoluteValue(second, bounds.height);
            }
            if (width !== null && (!second || isAuto(second))) {
                height =
                    hasIntrinsicWidth && hasIntrinsicHeight
                        ? (width / intrinsicWidth) * intrinsicHeight
                        : bounds.height;
            }
            if (height !== null && isAuto(first)) {
                width =
                    hasIntrinsicWidth && hasIntrinsicHeight
                        ? (height / intrinsicHeight) * intrinsicWidth
                        : bounds.width;
            }
            if (width !== null && height !== null) {
                return [width, height];
            }
            throw new Error("Unable to calculate background-size for element");
        };
        var getBackgroundValueForIndex = function (values, index) {
            var value = values[index];
            if (typeof value === 'undefined') {
                return values[0];
            }
            return value;
        };
        var calculateBackgroundRepeatPath = function (repeat, _a, _b, backgroundPositioningArea, backgroundPaintingArea) {
            var x = _a[0], y = _a[1];
            var width = _b[0], height = _b[1];
            switch (repeat) {
                case 2 /* REPEAT_X */:
                    return [
                        new Vector(Math.round(backgroundPositioningArea.left), Math.round(backgroundPositioningArea.top + y)),
                        new Vector(Math.round(backgroundPositioningArea.left + backgroundPositioningArea.width), Math.round(backgroundPositioningArea.top + y)),
                        new Vector(Math.round(backgroundPositioningArea.left + backgroundPositioningArea.width), Math.round(height + backgroundPositioningArea.top + y)),
                        new Vector(Math.round(backgroundPositioningArea.left), Math.round(height + backgroundPositioningArea.top + y))
                    ];
                case 3 /* REPEAT_Y */:
                    return [
                        new Vector(Math.round(backgroundPositioningArea.left + x), Math.round(backgroundPositioningArea.top)),
                        new Vector(Math.round(backgroundPositioningArea.left + x + width), Math.round(backgroundPositioningArea.top)),
                        new Vector(Math.round(backgroundPositioningArea.left + x + width), Math.round(backgroundPositioningArea.height + backgroundPositioningArea.top)),
                        new Vector(Math.round(backgroundPositioningArea.left + x), Math.round(backgroundPositioningArea.height + backgroundPositioningArea.top))
                    ];
                case 1 /* NO_REPEAT */:
                    return [
                        new Vector(Math.round(backgroundPositioningArea.left + x), Math.round(backgroundPositioningArea.top + y)),
                        new Vector(Math.round(backgroundPositioningArea.left + x + width), Math.round(backgroundPositioningArea.top + y)),
                        new Vector(Math.round(backgroundPositioningArea.left + x + width), Math.round(backgroundPositioningArea.top + y + height)),
                        new Vector(Math.round(backgroundPositioningArea.left + x), Math.round(backgroundPositioningArea.top + y + height))
                    ];
                default:
                    return [
                        new Vector(Math.round(backgroundPaintingArea.left), Math.round(backgroundPaintingArea.top)),
                        new Vector(Math.round(backgroundPaintingArea.left + backgroundPaintingArea.width), Math.round(backgroundPaintingArea.top)),
                        new Vector(Math.round(backgroundPaintingArea.left + backgroundPaintingArea.width), Math.round(backgroundPaintingArea.height + backgroundPaintingArea.top)),
                        new Vector(Math.round(backgroundPaintingArea.left), Math.round(backgroundPaintingArea.height + backgroundPaintingArea.top))
                    ];
            }
        };

        var SMALL_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        var SAMPLE_TEXT = 'Hidden Text';
        var FontMetrics = /** @class */ (function () {
            function FontMetrics(document) {
                this._data = {};
                this._document = document;
            }
            FontMetrics.prototype.parseMetrics = function (fontFamily, fontSize) {
                var container = this._document.createElement('div');
                var img = this._document.createElement('img');
                var span = this._document.createElement('span');
                var body = this._document.body;
                container.style.visibility = 'hidden';
                container.style.fontFamily = fontFamily;
                container.style.fontSize = fontSize;
                container.style.margin = '0';
                container.style.padding = '0';
                container.style.whiteSpace = 'nowrap';
                body.appendChild(container);
                img.src = SMALL_IMAGE;
                img.width = 1;
                img.height = 1;
                img.style.margin = '0';
                img.style.padding = '0';
                img.style.verticalAlign = 'baseline';
                span.style.fontFamily = fontFamily;
                span.style.fontSize = fontSize;
                span.style.margin = '0';
                span.style.padding = '0';
                span.appendChild(this._document.createTextNode(SAMPLE_TEXT));
                container.appendChild(span);
                container.appendChild(img);
                var baseline = img.offsetTop - span.offsetTop + 2;
                container.removeChild(span);
                container.appendChild(this._document.createTextNode(SAMPLE_TEXT));
                container.style.lineHeight = 'normal';
                img.style.verticalAlign = 'super';
                var middle = img.offsetTop - container.offsetTop + 2;
                body.removeChild(container);
                return { baseline: baseline, middle: middle };
            };
            FontMetrics.prototype.getMetrics = function (fontFamily, fontSize) {
                var key = fontFamily + " " + fontSize;
                if (typeof this._data[key] === 'undefined') {
                    this._data[key] = this.parseMetrics(fontFamily, fontSize);
                }
                return this._data[key];
            };
            return FontMetrics;
        }());

        var Renderer = /** @class */ (function () {
            function Renderer(context, options) {
                this.context = context;
                this.options = options;
            }
            return Renderer;
        }());

        var MASK_OFFSET = 10000;
        var CanvasRenderer = /** @class */ (function (_super) {
            __extends(CanvasRenderer, _super);
            function CanvasRenderer(context, options) {
                var _this = _super.call(this, context, options) || this;
                _this._activeEffects = [];
                _this.canvas = options.canvas ? options.canvas : document.createElement('canvas');
                _this.ctx = _this.canvas.getContext('2d');
                if (!options.canvas) {
                    _this.canvas.width = Math.floor(options.width * options.scale);
                    _this.canvas.height = Math.floor(options.height * options.scale);
                    _this.canvas.style.width = options.width + "px";
                    _this.canvas.style.height = options.height + "px";
                }
                _this.fontMetrics = new FontMetrics(document);
                _this.ctx.scale(_this.options.scale, _this.options.scale);
                _this.ctx.translate(-options.x, -options.y);
                _this.ctx.textBaseline = 'bottom';
                _this._activeEffects = [];
                _this.context.logger.debug("Canvas renderer initialized (" + options.width + "x" + options.height + ") with scale " + options.scale);
                return _this;
            }
            CanvasRenderer.prototype.applyEffects = function (effects) {
                var _this = this;
                while (this._activeEffects.length) {
                    this.popEffect();
                }
                effects.forEach(function (effect) { return _this.applyEffect(effect); });
            };
            CanvasRenderer.prototype.applyEffect = function (effect) {
                this.ctx.save();
                if (isOpacityEffect(effect)) {
                    this.ctx.globalAlpha = effect.opacity;
                }
                if (isTransformEffect(effect)) {
                    this.ctx.translate(effect.offsetX, effect.offsetY);
                    this.ctx.transform(effect.matrix[0], effect.matrix[1], effect.matrix[2], effect.matrix[3], effect.matrix[4], effect.matrix[5]);
                    this.ctx.translate(-effect.offsetX, -effect.offsetY);
                }
                if (isClipEffect(effect)) {
                    this.path(effect.path);
                    this.ctx.clip();
                }
                this._activeEffects.push(effect);
            };
            CanvasRenderer.prototype.popEffect = function () {
                this._activeEffects.pop();
                this.ctx.restore();
            };
            CanvasRenderer.prototype.renderStack = function (stack) {
                return __awaiter(this, void 0, void 0, function () {
                    var styles;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                styles = stack.element.container.styles;
                                if (!styles.isVisible()) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.renderStackContent(stack)];
                            case 1:
                                _a.sent();
                                _a.label = 2;
                            case 2: return [2 /*return*/];
                        }
                    });
                });
            };
            CanvasRenderer.prototype.renderNode = function (paint) {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (contains(paint.container.flags, 16 /* DEBUG_RENDER */)) {
                                    debugger;
                                }
                                if (!paint.container.styles.isVisible()) return [3 /*break*/, 3];
                                return [4 /*yield*/, this.renderNodeBackgroundAndBorders(paint)];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, this.renderNodeContent(paint)];
                            case 2:
                                _a.sent();
                                _a.label = 3;
                            case 3: return [2 /*return*/];
                        }
                    });
                });
            };
            CanvasRenderer.prototype.renderTextWithLetterSpacing = function (text, letterSpacing, baseline) {
                var _this = this;
                if (letterSpacing === 0) {
                    this.ctx.fillText(text.text, text.bounds.left, text.bounds.top + baseline);
                }
                else {
                    var letters = segmentGraphemes(text.text);
                    letters.reduce(function (left, letter) {
                        _this.ctx.fillText(letter, left, text.bounds.top + baseline);
                        return left + _this.ctx.measureText(letter).width;
                    }, text.bounds.left);
                }
            };
            CanvasRenderer.prototype.createFontStyle = function (styles) {
                var fontVariant = styles.fontVariant
                    .filter(function (variant) { return variant === 'normal' || variant === 'small-caps'; })
                    .join('');
                var fontFamily = fixIOSSystemFonts(styles.fontFamily).join(', ');
                var fontSize = isDimensionToken(styles.fontSize)
                    ? "" + styles.fontSize.number + styles.fontSize.unit
                    : styles.fontSize.number + "px";
                return [
                    [styles.fontStyle, fontVariant, styles.fontWeight, fontSize, fontFamily].join(' '),
                    fontFamily,
                    fontSize
                ];
            };
            CanvasRenderer.prototype.renderTextNode = function (text, styles) {
                return __awaiter(this, void 0, void 0, function () {
                    var _a, font, fontFamily, fontSize, _b, baseline, middle, paintOrder;
                    var _this = this;
                    return __generator(this, function (_c) {
                        _a = this.createFontStyle(styles), font = _a[0], fontFamily = _a[1], fontSize = _a[2];
                        this.ctx.font = font;
                        this.ctx.direction = styles.direction === 1 /* RTL */ ? 'rtl' : 'ltr';
                        this.ctx.textAlign = 'left';
                        this.ctx.textBaseline = 'alphabetic';
                        _b = this.fontMetrics.getMetrics(fontFamily, fontSize), baseline = _b.baseline, middle = _b.middle;
                        paintOrder = styles.paintOrder;
                        text.textBounds.forEach(function (text) {
                            paintOrder.forEach(function (paintOrderLayer) {
                                switch (paintOrderLayer) {
                                    case 0 /* FILL */:
                                        _this.ctx.fillStyle = asString(styles.color);
                                        _this.renderTextWithLetterSpacing(text, styles.letterSpacing, baseline);
                                        var textShadows = styles.textShadow;
                                        if (textShadows.length && text.text.trim().length) {
                                            textShadows
                                                .slice(0)
                                                .reverse()
                                                .forEach(function (textShadow) {
                                                _this.ctx.shadowColor = asString(textShadow.color);
                                                _this.ctx.shadowOffsetX = textShadow.offsetX.number * _this.options.scale;
                                                _this.ctx.shadowOffsetY = textShadow.offsetY.number * _this.options.scale;
                                                _this.ctx.shadowBlur = textShadow.blur.number;
                                                _this.renderTextWithLetterSpacing(text, styles.letterSpacing, baseline);
                                            });
                                            _this.ctx.shadowColor = '';
                                            _this.ctx.shadowOffsetX = 0;
                                            _this.ctx.shadowOffsetY = 0;
                                            _this.ctx.shadowBlur = 0;
                                        }
                                        if (styles.textDecorationLine.length) {
                                            _this.ctx.fillStyle = asString(styles.textDecorationColor || styles.color);
                                            styles.textDecorationLine.forEach(function (textDecorationLine) {
                                                switch (textDecorationLine) {
                                                    case 1 /* UNDERLINE */:
                                                        // Draws a line at the baseline of the font
                                                        // TODO As some browsers display the line as more than 1px if the font-size is big,
                                                        // need to take that into account both in position and size
                                                        _this.ctx.fillRect(text.bounds.left, Math.round(text.bounds.top + baseline), text.bounds.width, 1);
                                                        break;
                                                    case 2 /* OVERLINE */:
                                                        _this.ctx.fillRect(text.bounds.left, Math.round(text.bounds.top), text.bounds.width, 1);
                                                        break;
                                                    case 3 /* LINE_THROUGH */:
                                                        // TODO try and find exact position for line-through
                                                        _this.ctx.fillRect(text.bounds.left, Math.ceil(text.bounds.top + middle), text.bounds.width, 1);
                                                        break;
                                                }
                                            });
                                        }
                                        break;
                                    case 1 /* STROKE */:
                                        if (styles.webkitTextStrokeWidth && text.text.trim().length) {
                                            _this.ctx.strokeStyle = asString(styles.webkitTextStrokeColor);
                                            _this.ctx.lineWidth = styles.webkitTextStrokeWidth;
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            _this.ctx.lineJoin = !!window.chrome ? 'miter' : 'round';
                                            _this.ctx.strokeText(text.text, text.bounds.left, text.bounds.top + baseline);
                                        }
                                        _this.ctx.strokeStyle = '';
                                        _this.ctx.lineWidth = 0;
                                        _this.ctx.lineJoin = 'miter';
                                        break;
                                }
                            });
                        });
                        return [2 /*return*/];
                    });
                });
            };
            CanvasRenderer.prototype.renderReplacedElement = function (container, curves, image) {
                if (image && container.intrinsicWidth > 0 && container.intrinsicHeight > 0) {
                    var box = contentBox(container);
                    var path = calculatePaddingBoxPath(curves);
                    this.path(path);
                    this.ctx.save();
                    this.ctx.clip();
                    this.ctx.drawImage(image, 0, 0, container.intrinsicWidth, container.intrinsicHeight, box.left, box.top, box.width, box.height);
                    this.ctx.restore();
                }
            };
            CanvasRenderer.prototype.renderNodeContent = function (paint) {
                return __awaiter(this, void 0, void 0, function () {
                    var container, curves, styles, _i, _a, child, image, image, iframeRenderer, canvas, size, _b, fontFamily, fontSize, baseline, bounds, x, textBounds, img, image, url, fontFamily, bounds;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                this.applyEffects(paint.getEffects(4 /* CONTENT */));
                                container = paint.container;
                                curves = paint.curves;
                                styles = container.styles;
                                _i = 0, _a = container.textNodes;
                                _c.label = 1;
                            case 1:
                                if (!(_i < _a.length)) return [3 /*break*/, 4];
                                child = _a[_i];
                                return [4 /*yield*/, this.renderTextNode(child, styles)];
                            case 2:
                                _c.sent();
                                _c.label = 3;
                            case 3:
                                _i++;
                                return [3 /*break*/, 1];
                            case 4:
                                if (!(container instanceof ImageElementContainer)) return [3 /*break*/, 8];
                                _c.label = 5;
                            case 5:
                                _c.trys.push([5, 7, , 8]);
                                return [4 /*yield*/, this.context.cache.match(container.src)];
                            case 6:
                                image = _c.sent();
                                this.renderReplacedElement(container, curves, image);
                                return [3 /*break*/, 8];
                            case 7:
                                _c.sent();
                                this.context.logger.error("Error loading image " + container.src);
                                return [3 /*break*/, 8];
                            case 8:
                                if (container instanceof CanvasElementContainer) {
                                    this.renderReplacedElement(container, curves, container.canvas);
                                }
                                if (!(container instanceof SVGElementContainer)) return [3 /*break*/, 12];
                                _c.label = 9;
                            case 9:
                                _c.trys.push([9, 11, , 12]);
                                return [4 /*yield*/, this.context.cache.match(container.svg)];
                            case 10:
                                image = _c.sent();
                                this.renderReplacedElement(container, curves, image);
                                return [3 /*break*/, 12];
                            case 11:
                                _c.sent();
                                this.context.logger.error("Error loading svg " + container.svg.substring(0, 255));
                                return [3 /*break*/, 12];
                            case 12:
                                if (!(container instanceof IFrameElementContainer && container.tree)) return [3 /*break*/, 14];
                                iframeRenderer = new CanvasRenderer(this.context, {
                                    scale: this.options.scale,
                                    backgroundColor: container.backgroundColor,
                                    x: 0,
                                    y: 0,
                                    width: container.width,
                                    height: container.height
                                });
                                return [4 /*yield*/, iframeRenderer.render(container.tree)];
                            case 13:
                                canvas = _c.sent();
                                if (container.width && container.height) {
                                    this.ctx.drawImage(canvas, 0, 0, container.width, container.height, container.bounds.left, container.bounds.top, container.bounds.width, container.bounds.height);
                                }
                                _c.label = 14;
                            case 14:
                                if (container instanceof InputElementContainer) {
                                    size = Math.min(container.bounds.width, container.bounds.height);
                                    if (container.type === CHECKBOX) {
                                        if (container.checked) {
                                            this.ctx.save();
                                            this.path([
                                                new Vector(container.bounds.left + size * 0.39363, container.bounds.top + size * 0.79),
                                                new Vector(container.bounds.left + size * 0.16, container.bounds.top + size * 0.5549),
                                                new Vector(container.bounds.left + size * 0.27347, container.bounds.top + size * 0.44071),
                                                new Vector(container.bounds.left + size * 0.39694, container.bounds.top + size * 0.5649),
                                                new Vector(container.bounds.left + size * 0.72983, container.bounds.top + size * 0.23),
                                                new Vector(container.bounds.left + size * 0.84, container.bounds.top + size * 0.34085),
                                                new Vector(container.bounds.left + size * 0.39363, container.bounds.top + size * 0.79)
                                            ]);
                                            this.ctx.fillStyle = asString(INPUT_COLOR);
                                            this.ctx.fill();
                                            this.ctx.restore();
                                        }
                                    }
                                    else if (container.type === RADIO) {
                                        if (container.checked) {
                                            this.ctx.save();
                                            this.ctx.beginPath();
                                            this.ctx.arc(container.bounds.left + size / 2, container.bounds.top + size / 2, size / 4, 0, Math.PI * 2, true);
                                            this.ctx.fillStyle = asString(INPUT_COLOR);
                                            this.ctx.fill();
                                            this.ctx.restore();
                                        }
                                    }
                                }
                                if (isTextInputElement(container) && container.value.length) {
                                    _b = this.createFontStyle(styles), fontFamily = _b[0], fontSize = _b[1];
                                    baseline = this.fontMetrics.getMetrics(fontFamily, fontSize).baseline;
                                    this.ctx.font = fontFamily;
                                    this.ctx.fillStyle = asString(styles.color);
                                    this.ctx.textBaseline = 'alphabetic';
                                    this.ctx.textAlign = canvasTextAlign(container.styles.textAlign);
                                    bounds = contentBox(container);
                                    x = 0;
                                    switch (container.styles.textAlign) {
                                        case 1 /* CENTER */:
                                            x += bounds.width / 2;
                                            break;
                                        case 2 /* RIGHT */:
                                            x += bounds.width;
                                            break;
                                    }
                                    textBounds = bounds.add(x, 0, 0, -bounds.height / 2 + 1);
                                    this.ctx.save();
                                    this.path([
                                        new Vector(bounds.left, bounds.top),
                                        new Vector(bounds.left + bounds.width, bounds.top),
                                        new Vector(bounds.left + bounds.width, bounds.top + bounds.height),
                                        new Vector(bounds.left, bounds.top + bounds.height)
                                    ]);
                                    this.ctx.clip();
                                    this.renderTextWithLetterSpacing(new TextBounds(container.value, textBounds), styles.letterSpacing, baseline);
                                    this.ctx.restore();
                                    this.ctx.textBaseline = 'alphabetic';
                                    this.ctx.textAlign = 'left';
                                }
                                if (!contains(container.styles.display, 2048 /* LIST_ITEM */)) return [3 /*break*/, 20];
                                if (!(container.styles.listStyleImage !== null)) return [3 /*break*/, 19];
                                img = container.styles.listStyleImage;
                                if (!(img.type === 0 /* URL */)) return [3 /*break*/, 18];
                                image = void 0;
                                url = img.url;
                                _c.label = 15;
                            case 15:
                                _c.trys.push([15, 17, , 18]);
                                return [4 /*yield*/, this.context.cache.match(url)];
                            case 16:
                                image = _c.sent();
                                this.ctx.drawImage(image, container.bounds.left - (image.width + 10), container.bounds.top);
                                return [3 /*break*/, 18];
                            case 17:
                                _c.sent();
                                this.context.logger.error("Error loading list-style-image " + url);
                                return [3 /*break*/, 18];
                            case 18: return [3 /*break*/, 20];
                            case 19:
                                if (paint.listValue && container.styles.listStyleType !== -1 /* NONE */) {
                                    fontFamily = this.createFontStyle(styles)[0];
                                    this.ctx.font = fontFamily;
                                    this.ctx.fillStyle = asString(styles.color);
                                    this.ctx.textBaseline = 'middle';
                                    this.ctx.textAlign = 'right';
                                    bounds = new Bounds(container.bounds.left, container.bounds.top + getAbsoluteValue(container.styles.paddingTop, container.bounds.width), container.bounds.width, computeLineHeight(styles.lineHeight, styles.fontSize.number) / 2 + 1);
                                    this.renderTextWithLetterSpacing(new TextBounds(paint.listValue, bounds), styles.letterSpacing, computeLineHeight(styles.lineHeight, styles.fontSize.number) / 2 + 2);
                                    this.ctx.textBaseline = 'bottom';
                                    this.ctx.textAlign = 'left';
                                }
                                _c.label = 20;
                            case 20: return [2 /*return*/];
                        }
                    });
                });
            };
            CanvasRenderer.prototype.renderStackContent = function (stack) {
                return __awaiter(this, void 0, void 0, function () {
                    var _i, _a, child, _b, _c, child, _d, _e, child, _f, _g, child, _h, _j, child, _k, _l, child, _m, _o, child;
                    return __generator(this, function (_p) {
                        switch (_p.label) {
                            case 0:
                                if (contains(stack.element.container.flags, 16 /* DEBUG_RENDER */)) {
                                    debugger;
                                }
                                // https://www.w3.org/TR/css-position-3/#painting-order
                                // 1. the background and borders of the element forming the stacking context.
                                return [4 /*yield*/, this.renderNodeBackgroundAndBorders(stack.element)];
                            case 1:
                                // https://www.w3.org/TR/css-position-3/#painting-order
                                // 1. the background and borders of the element forming the stacking context.
                                _p.sent();
                                _i = 0, _a = stack.negativeZIndex;
                                _p.label = 2;
                            case 2:
                                if (!(_i < _a.length)) return [3 /*break*/, 5];
                                child = _a[_i];
                                return [4 /*yield*/, this.renderStack(child)];
                            case 3:
                                _p.sent();
                                _p.label = 4;
                            case 4:
                                _i++;
                                return [3 /*break*/, 2];
                            case 5: 
                            // 3. For all its in-flow, non-positioned, block-level descendants in tree order:
                            return [4 /*yield*/, this.renderNodeContent(stack.element)];
                            case 6:
                                // 3. For all its in-flow, non-positioned, block-level descendants in tree order:
                                _p.sent();
                                _b = 0, _c = stack.nonInlineLevel;
                                _p.label = 7;
                            case 7:
                                if (!(_b < _c.length)) return [3 /*break*/, 10];
                                child = _c[_b];
                                return [4 /*yield*/, this.renderNode(child)];
                            case 8:
                                _p.sent();
                                _p.label = 9;
                            case 9:
                                _b++;
                                return [3 /*break*/, 7];
                            case 10:
                                _d = 0, _e = stack.nonPositionedFloats;
                                _p.label = 11;
                            case 11:
                                if (!(_d < _e.length)) return [3 /*break*/, 14];
                                child = _e[_d];
                                return [4 /*yield*/, this.renderStack(child)];
                            case 12:
                                _p.sent();
                                _p.label = 13;
                            case 13:
                                _d++;
                                return [3 /*break*/, 11];
                            case 14:
                                _f = 0, _g = stack.nonPositionedInlineLevel;
                                _p.label = 15;
                            case 15:
                                if (!(_f < _g.length)) return [3 /*break*/, 18];
                                child = _g[_f];
                                return [4 /*yield*/, this.renderStack(child)];
                            case 16:
                                _p.sent();
                                _p.label = 17;
                            case 17:
                                _f++;
                                return [3 /*break*/, 15];
                            case 18:
                                _h = 0, _j = stack.inlineLevel;
                                _p.label = 19;
                            case 19:
                                if (!(_h < _j.length)) return [3 /*break*/, 22];
                                child = _j[_h];
                                return [4 /*yield*/, this.renderNode(child)];
                            case 20:
                                _p.sent();
                                _p.label = 21;
                            case 21:
                                _h++;
                                return [3 /*break*/, 19];
                            case 22:
                                _k = 0, _l = stack.zeroOrAutoZIndexOrTransformedOrOpacity;
                                _p.label = 23;
                            case 23:
                                if (!(_k < _l.length)) return [3 /*break*/, 26];
                                child = _l[_k];
                                return [4 /*yield*/, this.renderStack(child)];
                            case 24:
                                _p.sent();
                                _p.label = 25;
                            case 25:
                                _k++;
                                return [3 /*break*/, 23];
                            case 26:
                                _m = 0, _o = stack.positiveZIndex;
                                _p.label = 27;
                            case 27:
                                if (!(_m < _o.length)) return [3 /*break*/, 30];
                                child = _o[_m];
                                return [4 /*yield*/, this.renderStack(child)];
                            case 28:
                                _p.sent();
                                _p.label = 29;
                            case 29:
                                _m++;
                                return [3 /*break*/, 27];
                            case 30: return [2 /*return*/];
                        }
                    });
                });
            };
            CanvasRenderer.prototype.mask = function (paths) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, 0);
                this.ctx.lineTo(this.canvas.width, 0);
                this.ctx.lineTo(this.canvas.width, this.canvas.height);
                this.ctx.lineTo(0, this.canvas.height);
                this.ctx.lineTo(0, 0);
                this.formatPath(paths.slice(0).reverse());
                this.ctx.closePath();
            };
            CanvasRenderer.prototype.path = function (paths) {
                this.ctx.beginPath();
                this.formatPath(paths);
                this.ctx.closePath();
            };
            CanvasRenderer.prototype.formatPath = function (paths) {
                var _this = this;
                paths.forEach(function (point, index) {
                    var start = isBezierCurve(point) ? point.start : point;
                    if (index === 0) {
                        _this.ctx.moveTo(start.x, start.y);
                    }
                    else {
                        _this.ctx.lineTo(start.x, start.y);
                    }
                    if (isBezierCurve(point)) {
                        _this.ctx.bezierCurveTo(point.startControl.x, point.startControl.y, point.endControl.x, point.endControl.y, point.end.x, point.end.y);
                    }
                });
            };
            CanvasRenderer.prototype.renderRepeat = function (path, pattern, offsetX, offsetY) {
                this.path(path);
                this.ctx.fillStyle = pattern;
                this.ctx.translate(offsetX, offsetY);
                this.ctx.fill();
                this.ctx.translate(-offsetX, -offsetY);
            };
            CanvasRenderer.prototype.resizeImage = function (image, width, height) {
                var _a;
                if (image.width === width && image.height === height) {
                    return image;
                }
                var ownerDocument = (_a = this.canvas.ownerDocument) !== null && _a !== void 0 ? _a : document;
                var canvas = ownerDocument.createElement('canvas');
                canvas.width = Math.max(1, width);
                canvas.height = Math.max(1, height);
                var ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height);
                return canvas;
            };
            CanvasRenderer.prototype.renderBackgroundImage = function (container) {
                return __awaiter(this, void 0, void 0, function () {
                    var index, _loop_1, this_1, _i, _a, backgroundImage;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                index = container.styles.backgroundImage.length - 1;
                                _loop_1 = function (backgroundImage) {
                                    var image, url, _c, path, x, y, width, height, pattern, _d, path, x, y, width, height, _e, lineLength, x0, x1, y0, y1, canvas, ctx, gradient_1, pattern, _f, path, left, top_1, width, height, position, x, y, _g, rx, ry, radialGradient_1, midX, midY, f, invF;
                                    return __generator(this, function (_h) {
                                        switch (_h.label) {
                                            case 0:
                                                if (!(backgroundImage.type === 0 /* URL */)) return [3 /*break*/, 5];
                                                image = void 0;
                                                url = backgroundImage.url;
                                                _h.label = 1;
                                            case 1:
                                                _h.trys.push([1, 3, , 4]);
                                                return [4 /*yield*/, this_1.context.cache.match(url)];
                                            case 2:
                                                image = _h.sent();
                                                return [3 /*break*/, 4];
                                            case 3:
                                                _h.sent();
                                                this_1.context.logger.error("Error loading background-image " + url);
                                                return [3 /*break*/, 4];
                                            case 4:
                                                if (image) {
                                                    _c = calculateBackgroundRendering(container, index, [
                                                        image.width,
                                                        image.height,
                                                        image.width / image.height
                                                    ]), path = _c[0], x = _c[1], y = _c[2], width = _c[3], height = _c[4];
                                                    pattern = this_1.ctx.createPattern(this_1.resizeImage(image, width, height), 'repeat');
                                                    this_1.renderRepeat(path, pattern, x, y);
                                                }
                                                return [3 /*break*/, 6];
                                            case 5:
                                                if (isLinearGradient(backgroundImage)) {
                                                    _d = calculateBackgroundRendering(container, index, [null, null, null]), path = _d[0], x = _d[1], y = _d[2], width = _d[3], height = _d[4];
                                                    _e = calculateGradientDirection(backgroundImage.angle, width, height), lineLength = _e[0], x0 = _e[1], x1 = _e[2], y0 = _e[3], y1 = _e[4];
                                                    canvas = document.createElement('canvas');
                                                    canvas.width = width;
                                                    canvas.height = height;
                                                    ctx = canvas.getContext('2d');
                                                    gradient_1 = ctx.createLinearGradient(x0, y0, x1, y1);
                                                    processColorStops(backgroundImage.stops, lineLength).forEach(function (colorStop) {
                                                        return gradient_1.addColorStop(colorStop.stop, asString(colorStop.color));
                                                    });
                                                    ctx.fillStyle = gradient_1;
                                                    ctx.fillRect(0, 0, width, height);
                                                    if (width > 0 && height > 0) {
                                                        pattern = this_1.ctx.createPattern(canvas, 'repeat');
                                                        this_1.renderRepeat(path, pattern, x, y);
                                                    }
                                                }
                                                else if (isRadialGradient(backgroundImage)) {
                                                    _f = calculateBackgroundRendering(container, index, [
                                                        null,
                                                        null,
                                                        null
                                                    ]), path = _f[0], left = _f[1], top_1 = _f[2], width = _f[3], height = _f[4];
                                                    position = backgroundImage.position.length === 0 ? [FIFTY_PERCENT] : backgroundImage.position;
                                                    x = getAbsoluteValue(position[0], width);
                                                    y = getAbsoluteValue(position[position.length - 1], height);
                                                    _g = calculateRadius(backgroundImage, x, y, width, height), rx = _g[0], ry = _g[1];
                                                    if (rx > 0 && ry > 0) {
                                                        radialGradient_1 = this_1.ctx.createRadialGradient(left + x, top_1 + y, 0, left + x, top_1 + y, rx);
                                                        processColorStops(backgroundImage.stops, rx * 2).forEach(function (colorStop) {
                                                            return radialGradient_1.addColorStop(colorStop.stop, asString(colorStop.color));
                                                        });
                                                        this_1.path(path);
                                                        this_1.ctx.fillStyle = radialGradient_1;
                                                        if (rx !== ry) {
                                                            midX = container.bounds.left + 0.5 * container.bounds.width;
                                                            midY = container.bounds.top + 0.5 * container.bounds.height;
                                                            f = ry / rx;
                                                            invF = 1 / f;
                                                            this_1.ctx.save();
                                                            this_1.ctx.translate(midX, midY);
                                                            this_1.ctx.transform(1, 0, 0, f, 0, 0);
                                                            this_1.ctx.translate(-midX, -midY);
                                                            this_1.ctx.fillRect(left, invF * (top_1 - midY) + midY, width, height * invF);
                                                            this_1.ctx.restore();
                                                        }
                                                        else {
                                                            this_1.ctx.fill();
                                                        }
                                                    }
                                                }
                                                _h.label = 6;
                                            case 6:
                                                index--;
                                                return [2 /*return*/];
                                        }
                                    });
                                };
                                this_1 = this;
                                _i = 0, _a = container.styles.backgroundImage.slice(0).reverse();
                                _b.label = 1;
                            case 1:
                                if (!(_i < _a.length)) return [3 /*break*/, 4];
                                backgroundImage = _a[_i];
                                return [5 /*yield**/, _loop_1(backgroundImage)];
                            case 2:
                                _b.sent();
                                _b.label = 3;
                            case 3:
                                _i++;
                                return [3 /*break*/, 1];
                            case 4: return [2 /*return*/];
                        }
                    });
                });
            };
            CanvasRenderer.prototype.renderSolidBorder = function (color, side, curvePoints) {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        this.path(parsePathForBorder(curvePoints, side));
                        this.ctx.fillStyle = asString(color);
                        this.ctx.fill();
                        return [2 /*return*/];
                    });
                });
            };
            CanvasRenderer.prototype.renderDoubleBorder = function (color, width, side, curvePoints) {
                return __awaiter(this, void 0, void 0, function () {
                    var outerPaths, innerPaths;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!(width < 3)) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.renderSolidBorder(color, side, curvePoints)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                            case 2:
                                outerPaths = parsePathForBorderDoubleOuter(curvePoints, side);
                                this.path(outerPaths);
                                this.ctx.fillStyle = asString(color);
                                this.ctx.fill();
                                innerPaths = parsePathForBorderDoubleInner(curvePoints, side);
                                this.path(innerPaths);
                                this.ctx.fill();
                                return [2 /*return*/];
                        }
                    });
                });
            };
            CanvasRenderer.prototype.renderNodeBackgroundAndBorders = function (paint) {
                return __awaiter(this, void 0, void 0, function () {
                    var styles, hasBackground, borders, backgroundPaintingArea, side, _i, borders_1, border;
                    var _this = this;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                this.applyEffects(paint.getEffects(2 /* BACKGROUND_BORDERS */));
                                styles = paint.container.styles;
                                hasBackground = !isTransparent(styles.backgroundColor) || styles.backgroundImage.length;
                                borders = [
                                    { style: styles.borderTopStyle, color: styles.borderTopColor, width: styles.borderTopWidth },
                                    { style: styles.borderRightStyle, color: styles.borderRightColor, width: styles.borderRightWidth },
                                    { style: styles.borderBottomStyle, color: styles.borderBottomColor, width: styles.borderBottomWidth },
                                    { style: styles.borderLeftStyle, color: styles.borderLeftColor, width: styles.borderLeftWidth }
                                ];
                                backgroundPaintingArea = calculateBackgroundCurvedPaintingArea(getBackgroundValueForIndex(styles.backgroundClip, 0), paint.curves);
                                if (!(hasBackground || styles.boxShadow.length)) return [3 /*break*/, 2];
                                this.ctx.save();
                                this.path(backgroundPaintingArea);
                                this.ctx.clip();
                                if (!isTransparent(styles.backgroundColor)) {
                                    this.ctx.fillStyle = asString(styles.backgroundColor);
                                    this.ctx.fill();
                                }
                                return [4 /*yield*/, this.renderBackgroundImage(paint.container)];
                            case 1:
                                _a.sent();
                                this.ctx.restore();
                                styles.boxShadow
                                    .slice(0)
                                    .reverse()
                                    .forEach(function (shadow) {
                                    _this.ctx.save();
                                    var borderBoxArea = calculateBorderBoxPath(paint.curves);
                                    var maskOffset = shadow.inset ? 0 : MASK_OFFSET;
                                    var shadowPaintingArea = transformPath(borderBoxArea, -maskOffset + (shadow.inset ? 1 : -1) * shadow.spread.number, (shadow.inset ? 1 : -1) * shadow.spread.number, shadow.spread.number * (shadow.inset ? -2 : 2), shadow.spread.number * (shadow.inset ? -2 : 2));
                                    if (shadow.inset) {
                                        _this.path(borderBoxArea);
                                        _this.ctx.clip();
                                        _this.mask(shadowPaintingArea);
                                    }
                                    else {
                                        _this.mask(borderBoxArea);
                                        _this.ctx.clip();
                                        _this.path(shadowPaintingArea);
                                    }
                                    _this.ctx.shadowOffsetX = shadow.offsetX.number + maskOffset;
                                    _this.ctx.shadowOffsetY = shadow.offsetY.number;
                                    _this.ctx.shadowColor = asString(shadow.color);
                                    _this.ctx.shadowBlur = shadow.blur.number;
                                    _this.ctx.fillStyle = shadow.inset ? asString(shadow.color) : 'rgba(0,0,0,1)';
                                    _this.ctx.fill();
                                    _this.ctx.restore();
                                });
                                _a.label = 2;
                            case 2:
                                side = 0;
                                _i = 0, borders_1 = borders;
                                _a.label = 3;
                            case 3:
                                if (!(_i < borders_1.length)) return [3 /*break*/, 13];
                                border = borders_1[_i];
                                if (!(border.style !== 0 /* NONE */ && !isTransparent(border.color) && border.width > 0)) return [3 /*break*/, 11];
                                if (!(border.style === 2 /* DASHED */)) return [3 /*break*/, 5];
                                return [4 /*yield*/, this.renderDashedDottedBorder(border.color, border.width, side, paint.curves, 2 /* DASHED */)];
                            case 4:
                                _a.sent();
                                return [3 /*break*/, 11];
                            case 5:
                                if (!(border.style === 3 /* DOTTED */)) return [3 /*break*/, 7];
                                return [4 /*yield*/, this.renderDashedDottedBorder(border.color, border.width, side, paint.curves, 3 /* DOTTED */)];
                            case 6:
                                _a.sent();
                                return [3 /*break*/, 11];
                            case 7:
                                if (!(border.style === 4 /* DOUBLE */)) return [3 /*break*/, 9];
                                return [4 /*yield*/, this.renderDoubleBorder(border.color, border.width, side, paint.curves)];
                            case 8:
                                _a.sent();
                                return [3 /*break*/, 11];
                            case 9: return [4 /*yield*/, this.renderSolidBorder(border.color, side, paint.curves)];
                            case 10:
                                _a.sent();
                                _a.label = 11;
                            case 11:
                                side++;
                                _a.label = 12;
                            case 12:
                                _i++;
                                return [3 /*break*/, 3];
                            case 13: return [2 /*return*/];
                        }
                    });
                });
            };
            CanvasRenderer.prototype.renderDashedDottedBorder = function (color, width, side, curvePoints, style) {
                return __awaiter(this, void 0, void 0, function () {
                    var strokePaths, boxPaths, startX, startY, endX, endY, length, dashLength, spaceLength, useLineDash, multiplier, numberOfDashes, minSpace, maxSpace, path1, path2, path1, path2;
                    return __generator(this, function (_a) {
                        this.ctx.save();
                        strokePaths = parsePathForBorderStroke(curvePoints, side);
                        boxPaths = parsePathForBorder(curvePoints, side);
                        if (style === 2 /* DASHED */) {
                            this.path(boxPaths);
                            this.ctx.clip();
                        }
                        if (isBezierCurve(boxPaths[0])) {
                            startX = boxPaths[0].start.x;
                            startY = boxPaths[0].start.y;
                        }
                        else {
                            startX = boxPaths[0].x;
                            startY = boxPaths[0].y;
                        }
                        if (isBezierCurve(boxPaths[1])) {
                            endX = boxPaths[1].end.x;
                            endY = boxPaths[1].end.y;
                        }
                        else {
                            endX = boxPaths[1].x;
                            endY = boxPaths[1].y;
                        }
                        if (side === 0 || side === 2) {
                            length = Math.abs(startX - endX);
                        }
                        else {
                            length = Math.abs(startY - endY);
                        }
                        this.ctx.beginPath();
                        if (style === 3 /* DOTTED */) {
                            this.formatPath(strokePaths);
                        }
                        else {
                            this.formatPath(boxPaths.slice(0, 2));
                        }
                        dashLength = width < 3 ? width * 3 : width * 2;
                        spaceLength = width < 3 ? width * 2 : width;
                        if (style === 3 /* DOTTED */) {
                            dashLength = width;
                            spaceLength = width;
                        }
                        useLineDash = true;
                        if (length <= dashLength * 2) {
                            useLineDash = false;
                        }
                        else if (length <= dashLength * 2 + spaceLength) {
                            multiplier = length / (2 * dashLength + spaceLength);
                            dashLength *= multiplier;
                            spaceLength *= multiplier;
                        }
                        else {
                            numberOfDashes = Math.floor((length + spaceLength) / (dashLength + spaceLength));
                            minSpace = (length - numberOfDashes * dashLength) / (numberOfDashes - 1);
                            maxSpace = (length - (numberOfDashes + 1) * dashLength) / numberOfDashes;
                            spaceLength =
                                maxSpace <= 0 || Math.abs(spaceLength - minSpace) < Math.abs(spaceLength - maxSpace)
                                    ? minSpace
                                    : maxSpace;
                        }
                        if (useLineDash) {
                            if (style === 3 /* DOTTED */) {
                                this.ctx.setLineDash([0, dashLength + spaceLength]);
                            }
                            else {
                                this.ctx.setLineDash([dashLength, spaceLength]);
                            }
                        }
                        if (style === 3 /* DOTTED */) {
                            this.ctx.lineCap = 'round';
                            this.ctx.lineWidth = width;
                        }
                        else {
                            this.ctx.lineWidth = width * 2 + 1.1;
                        }
                        this.ctx.strokeStyle = asString(color);
                        this.ctx.stroke();
                        this.ctx.setLineDash([]);
                        // dashed round edge gap
                        if (style === 2 /* DASHED */) {
                            if (isBezierCurve(boxPaths[0])) {
                                path1 = boxPaths[3];
                                path2 = boxPaths[0];
                                this.ctx.beginPath();
                                this.formatPath([new Vector(path1.end.x, path1.end.y), new Vector(path2.start.x, path2.start.y)]);
                                this.ctx.stroke();
                            }
                            if (isBezierCurve(boxPaths[1])) {
                                path1 = boxPaths[1];
                                path2 = boxPaths[2];
                                this.ctx.beginPath();
                                this.formatPath([new Vector(path1.end.x, path1.end.y), new Vector(path2.start.x, path2.start.y)]);
                                this.ctx.stroke();
                            }
                        }
                        this.ctx.restore();
                        return [2 /*return*/];
                    });
                });
            };
            CanvasRenderer.prototype.render = function (element) {
                return __awaiter(this, void 0, void 0, function () {
                    var stack;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (this.options.backgroundColor) {
                                    this.ctx.fillStyle = asString(this.options.backgroundColor);
                                    this.ctx.fillRect(this.options.x, this.options.y, this.options.width, this.options.height);
                                }
                                stack = parseStackingContexts(element);
                                return [4 /*yield*/, this.renderStack(stack)];
                            case 1:
                                _a.sent();
                                this.applyEffects([]);
                                return [2 /*return*/, this.canvas];
                        }
                    });
                });
            };
            return CanvasRenderer;
        }(Renderer));
        var isTextInputElement = function (container) {
            if (container instanceof TextareaElementContainer) {
                return true;
            }
            else if (container instanceof SelectElementContainer) {
                return true;
            }
            else if (container instanceof InputElementContainer && container.type !== RADIO && container.type !== CHECKBOX) {
                return true;
            }
            return false;
        };
        var calculateBackgroundCurvedPaintingArea = function (clip, curves) {
            switch (clip) {
                case 0 /* BORDER_BOX */:
                    return calculateBorderBoxPath(curves);
                case 2 /* CONTENT_BOX */:
                    return calculateContentBoxPath(curves);
                case 1 /* PADDING_BOX */:
                default:
                    return calculatePaddingBoxPath(curves);
            }
        };
        var canvasTextAlign = function (textAlign) {
            switch (textAlign) {
                case 1 /* CENTER */:
                    return 'center';
                case 2 /* RIGHT */:
                    return 'right';
                case 0 /* LEFT */:
                default:
                    return 'left';
            }
        };
        // see https://github.com/niklasvh/html2canvas/pull/2645
        var iOSBrokenFonts = ['-apple-system', 'system-ui'];
        var fixIOSSystemFonts = function (fontFamilies) {
            return /iPhone OS 15_(0|1)/.test(window.navigator.userAgent)
                ? fontFamilies.filter(function (fontFamily) { return iOSBrokenFonts.indexOf(fontFamily) === -1; })
                : fontFamilies;
        };

        var ForeignObjectRenderer = /** @class */ (function (_super) {
            __extends(ForeignObjectRenderer, _super);
            function ForeignObjectRenderer(context, options) {
                var _this = _super.call(this, context, options) || this;
                _this.canvas = options.canvas ? options.canvas : document.createElement('canvas');
                _this.ctx = _this.canvas.getContext('2d');
                _this.options = options;
                _this.canvas.width = Math.floor(options.width * options.scale);
                _this.canvas.height = Math.floor(options.height * options.scale);
                _this.canvas.style.width = options.width + "px";
                _this.canvas.style.height = options.height + "px";
                _this.ctx.scale(_this.options.scale, _this.options.scale);
                _this.ctx.translate(-options.x, -options.y);
                _this.context.logger.debug("EXPERIMENTAL ForeignObject renderer initialized (" + options.width + "x" + options.height + " at " + options.x + "," + options.y + ") with scale " + options.scale);
                return _this;
            }
            ForeignObjectRenderer.prototype.render = function (element) {
                return __awaiter(this, void 0, void 0, function () {
                    var svg, img;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                svg = createForeignObjectSVG(this.options.width * this.options.scale, this.options.height * this.options.scale, this.options.scale, this.options.scale, element);
                                return [4 /*yield*/, loadSerializedSVG(svg)];
                            case 1:
                                img = _a.sent();
                                if (this.options.backgroundColor) {
                                    this.ctx.fillStyle = asString(this.options.backgroundColor);
                                    this.ctx.fillRect(0, 0, this.options.width * this.options.scale, this.options.height * this.options.scale);
                                }
                                this.ctx.drawImage(img, -this.options.x * this.options.scale, -this.options.y * this.options.scale);
                                return [2 /*return*/, this.canvas];
                        }
                    });
                });
            };
            return ForeignObjectRenderer;
        }(Renderer));
        var loadSerializedSVG = function (svg) {
            return new Promise(function (resolve, reject) {
                var img = new Image();
                img.onload = function () {
                    resolve(img);
                };
                img.onerror = reject;
                img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(svg));
            });
        };

        var Logger = /** @class */ (function () {
            function Logger(_a) {
                var id = _a.id, enabled = _a.enabled;
                this.id = id;
                this.enabled = enabled;
                this.start = Date.now();
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Logger.prototype.debug = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                if (this.enabled) {
                    // eslint-disable-next-line no-console
                    if (typeof window !== 'undefined' && window.console && typeof console.debug === 'function') {
                        // eslint-disable-next-line no-console
                        console.debug.apply(console, __spreadArray([this.id, this.getTime() + "ms"], args));
                    }
                    else {
                        this.info.apply(this, args);
                    }
                }
            };
            Logger.prototype.getTime = function () {
                return Date.now() - this.start;
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Logger.prototype.info = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                if (this.enabled) {
                    // eslint-disable-next-line no-console
                    if (typeof window !== 'undefined' && window.console && typeof console.info === 'function') {
                        // eslint-disable-next-line no-console
                        console.info.apply(console, __spreadArray([this.id, this.getTime() + "ms"], args));
                    }
                }
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Logger.prototype.warn = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                if (this.enabled) {
                    // eslint-disable-next-line no-console
                    if (typeof window !== 'undefined' && window.console && typeof console.warn === 'function') {
                        // eslint-disable-next-line no-console
                        console.warn.apply(console, __spreadArray([this.id, this.getTime() + "ms"], args));
                    }
                    else {
                        this.info.apply(this, args);
                    }
                }
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Logger.prototype.error = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                if (this.enabled) {
                    // eslint-disable-next-line no-console
                    if (typeof window !== 'undefined' && window.console && typeof console.error === 'function') {
                        // eslint-disable-next-line no-console
                        console.error.apply(console, __spreadArray([this.id, this.getTime() + "ms"], args));
                    }
                    else {
                        this.info.apply(this, args);
                    }
                }
            };
            Logger.instances = {};
            return Logger;
        }());

        var Context = /** @class */ (function () {
            function Context(options, windowBounds) {
                var _a;
                this.windowBounds = windowBounds;
                this.instanceName = "#" + Context.instanceCount++;
                this.logger = new Logger({ id: this.instanceName, enabled: options.logging });
                this.cache = (_a = options.cache) !== null && _a !== void 0 ? _a : new Cache(this, options);
            }
            Context.instanceCount = 1;
            return Context;
        }());

        var html2canvas = function (element, options) {
            if (options === void 0) { options = {}; }
            return renderElement(element, options);
        };
        if (typeof window !== 'undefined') {
            CacheStorage.setContext(window);
        }
        var renderElement = function (element, opts) { return __awaiter(void 0, void 0, void 0, function () {
            var ownerDocument, defaultView, resourceOptions, contextOptions, windowOptions, windowBounds, context, foreignObjectRendering, cloneOptions, documentCloner, clonedElement, container, _a, width, height, left, top, backgroundColor, renderOptions, canvas, renderer, root, renderer;
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
            return __generator(this, function (_u) {
                switch (_u.label) {
                    case 0:
                        if (!element || typeof element !== 'object') {
                            return [2 /*return*/, Promise.reject('Invalid element provided as first argument')];
                        }
                        ownerDocument = element.ownerDocument;
                        if (!ownerDocument) {
                            throw new Error("Element is not attached to a Document");
                        }
                        defaultView = ownerDocument.defaultView;
                        if (!defaultView) {
                            throw new Error("Document is not attached to a Window");
                        }
                        resourceOptions = {
                            allowTaint: (_b = opts.allowTaint) !== null && _b !== void 0 ? _b : false,
                            imageTimeout: (_c = opts.imageTimeout) !== null && _c !== void 0 ? _c : 15000,
                            proxy: opts.proxy,
                            useCORS: (_d = opts.useCORS) !== null && _d !== void 0 ? _d : false
                        };
                        contextOptions = __assign({ logging: (_e = opts.logging) !== null && _e !== void 0 ? _e : true, cache: opts.cache }, resourceOptions);
                        windowOptions = {
                            windowWidth: (_f = opts.windowWidth) !== null && _f !== void 0 ? _f : defaultView.innerWidth,
                            windowHeight: (_g = opts.windowHeight) !== null && _g !== void 0 ? _g : defaultView.innerHeight,
                            scrollX: (_h = opts.scrollX) !== null && _h !== void 0 ? _h : defaultView.pageXOffset,
                            scrollY: (_j = opts.scrollY) !== null && _j !== void 0 ? _j : defaultView.pageYOffset
                        };
                        windowBounds = new Bounds(windowOptions.scrollX, windowOptions.scrollY, windowOptions.windowWidth, windowOptions.windowHeight);
                        context = new Context(contextOptions, windowBounds);
                        foreignObjectRendering = (_k = opts.foreignObjectRendering) !== null && _k !== void 0 ? _k : false;
                        cloneOptions = {
                            allowTaint: (_l = opts.allowTaint) !== null && _l !== void 0 ? _l : false,
                            onclone: opts.onclone,
                            ignoreElements: opts.ignoreElements,
                            inlineImages: foreignObjectRendering,
                            copyStyles: foreignObjectRendering
                        };
                        context.logger.debug("Starting document clone with size " + windowBounds.width + "x" + windowBounds.height + " scrolled to " + -windowBounds.left + "," + -windowBounds.top);
                        documentCloner = new DocumentCloner(context, element, cloneOptions);
                        clonedElement = documentCloner.clonedReferenceElement;
                        if (!clonedElement) {
                            return [2 /*return*/, Promise.reject("Unable to find element in cloned iframe")];
                        }
                        return [4 /*yield*/, documentCloner.toIFrame(ownerDocument, windowBounds)];
                    case 1:
                        container = _u.sent();
                        _a = isBodyElement(clonedElement) || isHTMLElement(clonedElement)
                            ? parseDocumentSize(clonedElement.ownerDocument)
                            : parseBounds(context, clonedElement), width = _a.width, height = _a.height, left = _a.left, top = _a.top;
                        backgroundColor = parseBackgroundColor(context, clonedElement, opts.backgroundColor);
                        renderOptions = {
                            canvas: opts.canvas,
                            backgroundColor: backgroundColor,
                            scale: (_o = (_m = opts.scale) !== null && _m !== void 0 ? _m : defaultView.devicePixelRatio) !== null && _o !== void 0 ? _o : 1,
                            x: ((_p = opts.x) !== null && _p !== void 0 ? _p : 0) + left,
                            y: ((_q = opts.y) !== null && _q !== void 0 ? _q : 0) + top,
                            width: (_r = opts.width) !== null && _r !== void 0 ? _r : Math.ceil(width),
                            height: (_s = opts.height) !== null && _s !== void 0 ? _s : Math.ceil(height)
                        };
                        if (!foreignObjectRendering) return [3 /*break*/, 3];
                        context.logger.debug("Document cloned, using foreign object rendering");
                        renderer = new ForeignObjectRenderer(context, renderOptions);
                        return [4 /*yield*/, renderer.render(clonedElement)];
                    case 2:
                        canvas = _u.sent();
                        return [3 /*break*/, 5];
                    case 3:
                        context.logger.debug("Document cloned, element located at " + left + "," + top + " with size " + width + "x" + height + " using computed rendering");
                        context.logger.debug("Starting DOM parsing");
                        root = parseTree(context, clonedElement);
                        if (backgroundColor === root.styles.backgroundColor) {
                            root.styles.backgroundColor = COLORS.TRANSPARENT;
                        }
                        context.logger.debug("Starting renderer for element at " + renderOptions.x + "," + renderOptions.y + " with size " + renderOptions.width + "x" + renderOptions.height);
                        renderer = new CanvasRenderer(context, renderOptions);
                        return [4 /*yield*/, renderer.render(root)];
                    case 4:
                        canvas = _u.sent();
                        _u.label = 5;
                    case 5:
                        if ((_t = opts.removeContainer) !== null && _t !== void 0 ? _t : true) {
                            if (!DocumentCloner.destroy(container)) {
                                context.logger.error("Cannot detach cloned iframe as it is not in the DOM anymore");
                            }
                        }
                        context.logger.debug("Finished rendering");
                        return [2 /*return*/, canvas];
                }
            });
        }); };
        var parseBackgroundColor = function (context, element, backgroundColorOverride) {
            var ownerDocument = element.ownerDocument;
            // http://www.w3.org/TR/css3-background/#special-backgrounds
            var documentBackgroundColor = ownerDocument.documentElement
                ? parseColor(context, getComputedStyle(ownerDocument.documentElement).backgroundColor)
                : COLORS.TRANSPARENT;
            var bodyBackgroundColor = ownerDocument.body
                ? parseColor(context, getComputedStyle(ownerDocument.body).backgroundColor)
                : COLORS.TRANSPARENT;
            var defaultBackgroundColor = typeof backgroundColorOverride === 'string'
                ? parseColor(context, backgroundColorOverride)
                : backgroundColorOverride === null
                    ? COLORS.TRANSPARENT
                    : 0xffffffff;
            return element === ownerDocument.documentElement
                ? isTransparent(documentBackgroundColor)
                    ? isTransparent(bodyBackgroundColor)
                        ? defaultBackgroundColor
                        : bodyBackgroundColor
                    : documentBackgroundColor
                : defaultBackgroundColor;
        };

        return html2canvas;

    })));

    });

    let _cancelled = false;
    function cancelDetection() { _cancelled = true; }
    function resetCancelled() { _cancelled = false; }
    function isCancelled() { return _cancelled; }

    let MAX_RESULTS = 20;
    const SEARCH_THRESHOLD = 20;
    const STORAGE_KEY = 'visage_api_endpoint';
    const VISAGE_API_URL = 'https://cc1234-stashface-onnx.hf.space';
    function getApiEndpoint() {
        var _a;
        if (typeof window !== 'undefined' && ((_a = window.visageConfig) === null || _a === void 0 ? void 0 : _a.apiEndpoint)) {
            return window.visageConfig.apiEndpoint;
        }
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored)
                return stored;
        }
        catch (e) {
            console.warn('Could not read API endpoint from localStorage:', e);
        }
        return VISAGE_API_URL;
    }
    /**
     * Probe the backend's `/health` endpoint. Resolves the health status when the
     * backend is up, `null` only when it is genuinely unreachable (network error
     * or a non-404 error response). Used to surface a "backend offline" state
     * proactively instead of failing on the first scan. Never throws.
     *
     * A `404` on `/health` is treated as reachable-and-healthy: some backends (the
     * hosted Hugging Face cloud app) don't expose a `/health` route, but a 404
     * proves the server itself answered, so we must not report it as unreachable.
     */
    async function checkHealth(endpoint = getApiEndpoint()) {
        try {
            const res = await fetch(`${endpoint}/health`, { method: 'GET' });
            if (res.status === 404) {
                return { status: 'ready', index_docs: null, models_loaded: true };
            }
            if (!res.ok)
                return null;
            return (await res.json());
        }
        catch (_a) {
            return null;
        }
    }
    function setApiEndpoint(endpoint) {
        try {
            localStorage.setItem(STORAGE_KEY, endpoint);
        }
        catch (e) {
            console.warn('Could not save API endpoint to localStorage:', e);
        }
    }
    function isPrivateIPv4(octets) {
        const [a, b, c] = octets.map(Number);
        if (a === 127)
            return true;
        if (a === 10)
            return true;
        if (a === 192 && b === 168)
            return true;
        if (a === 172 && b >= 16 && b <= 31)
            return true;
        if (a === 169 && b === 254)
            return true;
        return false;
    }
    function isLocalEndpoint(endpoint) {
        let hostname;
        try {
            hostname = new URL(endpoint).hostname;
        }
        catch (_a) {
            return false;
        }
        if (!hostname)
            return false;
        const lower = hostname.toLowerCase();
        if (lower === 'localhost')
            return true;
        if (lower.endsWith('.local'))
            return true;
        const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(lower);
        if (ipv4)
            return isPrivateIPv4(ipv4.slice(1));
        if (!lower.includes('.') && !/[0-9]/.test(lower))
            return true;
        return false;
    }
    async function getStashStatus(endpoint = getApiEndpoint()) {
        try {
            const res = await fetch(`${endpoint}/api/stash/status`, { method: 'GET' });
            if (!res.ok)
                return null;
            return (await res.json());
        }
        catch (_a) {
            return null;
        }
    }
    async function triggerStashSync(endpoint = getApiEndpoint()) {
        const res = await fetch(`${endpoint}/api/stash/sync`, { method: 'POST' });
        if (res.status === 409)
            throw new Error('already_running');
        if (!res.ok)
            throw new Error(`Sync failed: ${res.status}`);
        const data = await res.json();
        return data.event_id;
    }
    function dataUrlToBlob(dataUrl) {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }
    const MAX_LONG_SIDE$1 = 400;
    const JPEG_QUALITY$1 = 0.85;
    function optimizeCanvas(source) {
        let { width, height } = source;
        if (width > MAX_LONG_SIDE$1 || height > MAX_LONG_SIDE$1) {
            const scale = Math.min(MAX_LONG_SIDE$1 / width, MAX_LONG_SIDE$1 / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Failed to get canvas context');
        ctx.drawImage(source, 0, 0, width, height);
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))), 'image/jpeg', JPEG_QUALITY$1);
        });
    }
    const API_PREFIX = '/gradio_api';
    async function uploadFile(baseUrl, file, name) {
        const formData = new FormData();
        formData.append('files', file, name);
        const res = await fetch(`${baseUrl}${API_PREFIX}/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'omit',
        });
        if (!res.ok)
            throw new Error(`Upload failed: ${res.status}`);
        const paths = await res.json();
        return paths[0];
    }
    async function ssePredict(baseUrl, endpoint, data, onProgress) {
        var _a, _b;
        const res = await fetch(`${baseUrl}${API_PREFIX}/call/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data }),
            credentials: 'omit',
        });
        if (!res.ok)
            throw new Error(`Predict failed: ${res.status}`);
        const { event_id } = await res.json();
        const events = await fetch(`${baseUrl}${API_PREFIX}/call/${endpoint}/${event_id}`, {
            credentials: 'omit',
        });
        const reader = (_a = events.body) === null || _a === void 0 ? void 0 : _a.getReader();
        if (!reader)
            throw new Error('No response body');
        const decoder = new TextDecoder();
        let buffer = '';
        let result = null;
        while (true) {
            if (isCancelled()) {
                reader.cancel();
                break;
            }
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (!line.startsWith('data: '))
                    continue;
                try {
                    const data = JSON.parse(line.slice(6));
                    if (data === null)
                        continue;
                    // Gradio 5 generator yields values as array elements: [value]
                    const value = Array.isArray(data) && data.length === 1 ? data[0] : data;
                    // Generator progress yield: {"progress": 0.5, "desc": "..."}
                    if ((value === null || value === void 0 ? void 0 : value.progress) !== undefined) {
                        if (onProgress)
                            onProgress(value.progress, value.desc || '');
                        continue;
                    }
                    // Generator result yield or Gradio 4 structured response: {"data": [...]}
                    if ('data' in value) {
                        result = value.data;
                        continue;
                    }
                    // Legacy array-wrapped response: [{"data": [...]}]
                    if (Array.isArray(value) && value.length > 0 && ((_b = value[0]) === null || _b === void 0 ? void 0 : _b.data) !== undefined) {
                        result = value[0].data;
                        continue;
                    }
                    result = value;
                }
                catch (_c) { }
            }
        }
        return result;
    }
    async function identifySpritePerformers(spriteImg, vttFile, onProgress) {
        const baseUrl = getApiEndpoint();
        const spritePath = await uploadFile(baseUrl, spriteImg, 'sprite.jpg');
        const vttPath = await uploadFile(baseUrl, vttFile, 'thumbs.vtt');
        const apiFile = (path) => ({ path, meta: { _type: 'gradio.FileData' } });
        const raw = await ssePredict(baseUrl, 'identify_sprite_performers', [
            apiFile(spritePath),
            apiFile(vttPath),
            SEARCH_THRESHOLD,
        ], onProgress);
        // ssePredict unwraps Gradio 5's array wrapping [value] → value.
        // Callers expect result.data[0], so wrap non-array values.
        return { data: Array.isArray(raw) ? raw : [raw] };
    }
    async function callGradioAPI(endpoint, inputs, onProgress) {
        var _a;
        try {
            const baseUrl = getApiEndpoint();
            const processed = await Promise.all(inputs.map(async (input) => {
                if (input instanceof Blob || input instanceof File) {
                    const name = input instanceof File ? input.name : 'file';
                    const path = await uploadFile(baseUrl, input, name);
                    return { path, meta: { _type: 'gradio.FileData' } };
                }
                return input;
            }));
            const raw = await ssePredict(baseUrl, endpoint, processed, onProgress);
            return { data: Array.isArray(raw) ? raw : [raw] };
        }
        catch (error) {
            const msg = (_a = error === null || error === void 0 ? void 0 : error.message) !== null && _a !== void 0 ? _a : (typeof error === 'string' ? error : JSON.stringify(error));
            throw new Error(`Gradio API call failed: ${msg}`);
        }
    }

    const MAX_LONG_SIDE = 400;
    const JPEG_QUALITY = 0.85;
    const DEBUG = typeof location !== 'undefined' && location.search.includes('visage_capture_debug=1');
    function findMediaElement(cx, cy) {
        const els = document.elementsFromPoint(cx, cy);
        for (const el of els) {
            if (el instanceof HTMLVideoElement || el instanceof HTMLImageElement || el instanceof HTMLCanvasElement) {
                const r = el.getBoundingClientRect();
                return { el, rect: { x: r.left, y: r.top, w: r.width, h: r.height } };
            }
        }
        return null;
    }
    function getIntrinsicSize(el) {
        if (el instanceof HTMLVideoElement)
            return { w: el.videoWidth, h: el.videoHeight };
        if (el instanceof HTMLImageElement)
            return { w: el.naturalWidth, h: el.naturalHeight };
        return { w: el.width, h: el.height };
    }
    function getContentRect(el, disp) {
        const int = getIntrinsicSize(el);
        if (int.w === 0 || int.h === 0)
            return { ...disp };
        const objFit = (el instanceof HTMLVideoElement || el instanceof HTMLImageElement)
            ? getComputedStyle(el).objectFit
            : 'fill';
        let contentW, contentH;
        switch (objFit) {
            case 'contain': {
                const scale = Math.min(disp.w / int.w, disp.h / int.h);
                contentW = int.w * scale;
                contentH = int.h * scale;
                break;
            }
            case 'cover': {
                const scale = Math.max(disp.w / int.w, disp.h / int.h);
                contentW = int.w * scale;
                contentH = int.h * scale;
                break;
            }
            case 'none': {
                contentW = int.w;
                contentH = int.h;
                break;
            }
            case 'scale-down': {
                const containScale = Math.min(disp.w / int.w, disp.h / int.h);
                const scale = Math.min(containScale, 1);
                contentW = int.w * scale;
                contentH = int.h * scale;
                break;
            }
            default: {
                contentW = disp.w;
                contentH = disp.h;
            }
        }
        return {
            x: disp.x + (disp.w - contentW) / 2,
            y: disp.y + (disp.h - contentH) / 2,
            w: contentW,
            h: contentH,
        };
    }
    function clampSelToContent(sel, content) {
        const x = Math.max(sel.x, content.x);
        const y = Math.max(sel.y, content.y);
        const r = Math.min(sel.x + sel.w, content.x + content.w);
        const b = Math.min(sel.y + sel.h, content.y + content.h);
        return { x, y, w: Math.max(0, r - x), h: Math.max(0, b - y) };
    }
    function mapToIntrinsic(el, sel, content) {
        const int = getIntrinsicSize(el);
        return {
            sx: (sel.x - content.x) * (int.w / content.w),
            sy: (sel.y - content.y) * (int.h / content.h),
            sw: sel.w * (int.w / content.w),
            sh: sel.h * (int.h / content.h),
        };
    }
    async function drawFromMedia(el, sx, sy, sw, sh) {
        const scale = Math.min(MAX_LONG_SIDE / sw, MAX_LONG_SIDE / sh, 1);
        const dw = Math.max(1, Math.round(sw * scale));
        const dh = Math.max(1, Math.round(sh * scale));
        const canvas = document.createElement('canvas');
        canvas.width = dw;
        canvas.height = dh;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Failed to get 2D context');
        ctx.drawImage(el, sx, sy, sw, sh, 0, 0, dw, dh);
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                blob ? resolve(blob) : reject(new Error('toBlob returned null'));
            }, 'image/jpeg', JPEG_QUALITY);
        });
    }
    function debugPaint(blob, sel) {
        if (!DEBUG)
            return;
        const url = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.src = url;
        img.style.cssText = [
            `position:fixed`,
            `left:${sel.x}px`,
            `top:${sel.y}px`,
            `width:${sel.w}px`,
            `height:${sel.h}px`,
            `opacity:0.5`,
            `pointer-events:none`,
            `z-index:2147483647`,
            `border:1px solid #00ff00`,
        ].join(';');
        document.body.appendChild(img);
        setTimeout(() => { img.remove(); URL.revokeObjectURL(url); }, 3000);
    }
    function waitForVideoReady(video, timeoutMs = 2000) {
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0)
            return Promise.resolve(true);
        return new Promise((resolve) => {
            let done = false;
            const finish = (ok) => {
                if (done)
                    return;
                done = true;
                clearTimeout(timer);
                video.removeEventListener('loadeddata', onData);
                video.removeEventListener('loadedmetadata', onData);
                video.removeEventListener('canplay', onData);
                video.removeEventListener('error', onError);
                resolve(ok);
            };
            const onData = () => finish(video.videoWidth > 0 && video.videoHeight > 0);
            const onError = () => finish(false);
            const timer = setTimeout(() => finish(false), timeoutMs);
            video.addEventListener('loadeddata', onData);
            video.addEventListener('loadedmetadata', onData);
            video.addEventListener('canplay', onData);
            video.addEventListener('error', onError);
            try {
                video.load();
            }
            catch ( /* ignore */_a) { /* ignore */ }
        });
    }
    function findPosterUrl(video) {
        var _a;
        if (video.poster)
            return video.poster;
        const poster = (_a = video.parentElement) === null || _a === void 0 ? void 0 : _a.querySelector('.vjs-poster');
        if (poster) {
            const bg = getComputedStyle(poster).backgroundImage;
            const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
            if (m)
                return m[1];
        }
        return null;
    }
    async function capturePoster(video, crop) {
        const posterUrl = findPosterUrl(video);
        if (!posterUrl)
            return null;
        console.warn('[Visage] Video not loaded, capturing poster:', posterUrl);
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = posterUrl;
            await new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Poster image failed to load'));
            });
            if (!crop) {
                const bitmap = await createImageBitmap(img);
                const blob = await optimizeCanvas(bitmap);
                return blob !== null && blob !== void 0 ? blob : null;
            }
            const nw = img.naturalWidth, nh = img.naturalHeight;
            if (!nw || !nh)
                return null;
            const vr = crop.videoRect;
            const sx = Math.max(0, Math.min(((crop.bounds.x - vr.x) / vr.w) * nw, nw));
            const sy = Math.max(0, Math.min(((crop.bounds.y - vr.y) / vr.h) * nh, nh));
            const sw = Math.min((crop.bounds.w / vr.w) * nw, nw - sx);
            const sh = Math.min((crop.bounds.h / vr.h) * nh, nh - sy);
            if (sw < 4 || sh < 4)
                return null;
            const scale = Math.min(MAX_LONG_SIDE / sw, MAX_LONG_SIDE / sh, 1);
            const dw = Math.max(1, Math.round(sw * scale));
            const dh = Math.max(1, Math.round(sh * scale));
            const canvas = document.createElement('canvas');
            canvas.width = dw;
            canvas.height = dh;
            const ctx = canvas.getContext('2d');
            if (!ctx)
                return null;
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
            return await new Promise((resolve) => {
                canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY);
            });
        }
        catch (e) {
            console.warn('[Visage] Poster capture failed:', e);
            return null;
        }
    }
    async function fallbackCapture(bounds) {
        const canvas = await html2canvas(document.documentElement, {
            x: bounds.x, y: bounds.y, width: bounds.w, height: bounds.h,
            scale: 1, useCORS: true, allowTaint: false,
        });
        const scale = Math.min(MAX_LONG_SIDE / canvas.width, MAX_LONG_SIDE / canvas.height, 1);
        const dw = Math.max(1, Math.round(canvas.width * scale));
        const dh = Math.max(1, Math.round(canvas.height * scale));
        const out = document.createElement('canvas');
        out.width = dw;
        out.height = dh;
        const ctx = out.getContext('2d');
        if (!ctx)
            throw new Error('Failed to get 2D context in fallback');
        ctx.drawImage(canvas, 0, 0, dw, dh);
        return new Promise((resolve, reject) => {
            out.toBlob((blob) => {
                blob ? resolve(blob) : reject(new Error('Fallback toBlob returned null'));
            }, 'image/jpeg', JPEG_QUALITY);
        });
    }
    function findLargestMedia() {
        const els = Array.from(document.querySelectorAll('video, img, canvas'));
        const vw = window.innerWidth, vh = window.innerHeight;
        let bestVideo = null;
        let bestVideoArea = 0;
        let bestOther = null;
        let bestOtherArea = 0;
        for (const el of els) {
            const r = el.getBoundingClientRect();
            const vx = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
            const vy = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
            const area = vx * vy;
            if (area < 2500)
                continue;
            const int = getIntrinsicSize(el);
            const entry = { el, rect: { x: r.left, y: r.top, w: r.width, h: r.height } };
            if (el instanceof HTMLVideoElement) {
                if (area > bestVideoArea) {
                    bestVideoArea = area;
                    bestVideo = entry;
                }
                continue;
            }
            if ((int.w === 0 || int.h === 0))
                continue;
            if (area > bestOtherArea) {
                bestOtherArea = area;
                bestOther = entry;
            }
        }
        return bestVideo || bestOther;
    }
    // Capture the whole content of the primary media element on screen (the playing
    // video, or the preview/image being viewed), not the entire browser viewport.
    async function captureWholeFrame() {
        const found = findLargestMedia();
        if (!found) {
            console.warn('[Visage] captureWholeFrame: no media element found');
            return null;
        }
        const int = getIntrinsicSize(found.el);
        if (found.el instanceof HTMLVideoElement && (int.w === 0 || int.h === 0)) {
            const poster = await capturePoster(found.el);
            if (poster)
                return poster;
            return fallbackCapture(found.rect);
        }
        const content = getContentRect(found.el, found.rect);
        return captureRegion({ x: content.x, y: content.y, w: content.w, h: content.h });
    }
    async function captureRegion(bounds) {
        const cx = bounds.x + bounds.w / 2;
        const cy = bounds.y + bounds.h / 2;
        const found = findMediaElement(cx, cy);
        if (!found) {
            const alt = findLargestMedia();
            if (alt) {
                const intSize = getIntrinsicSize(alt.el);
                if (intSize.w > 0 && intSize.h > 0) {
                    const contentRect = getContentRect(alt.el, alt.rect);
                    const clamped = clampSelToContent(bounds, contentRect);
                    if (clamped.w >= 4 && clamped.h >= 4) {
                        const { sx, sy, sw, sh } = mapToIntrinsic(alt.el, clamped, contentRect);
                        try {
                            return await drawFromMedia(alt.el, sx, sy, sw, sh);
                        }
                        catch (_a) { }
                    }
                }
            }
            console.warn('[Visage] No media element at center, falling back');
            return fallbackCapture(bounds);
        }
        const intSize = getIntrinsicSize(found.el);
        if (intSize.w === 0 || intSize.h === 0) {
            if (found.el instanceof HTMLVideoElement) {
                // Capture the visible poster/thumbnail FIRST. Calling video.load() (via
                // waitForVideoReady) can hide or clear the poster, so grab it before the
                // video has a chance to disturb the DOM.
                const poster = await capturePoster(found.el, { bounds, videoRect: found.rect });
                if (poster)
                    return poster;
                const ready = await waitForVideoReady(found.el);
                if (ready && found.el.videoWidth > 0 && found.el.videoHeight > 0) {
                    const contentRect = getContentRect(found.el, found.rect);
                    const clamped = clampSelToContent(bounds, contentRect);
                    if (clamped.w >= 4 && clamped.h >= 4) {
                        const { sx, sy, sw, sh } = mapToIntrinsic(found.el, clamped, contentRect);
                        try {
                            const blob = await drawFromMedia(found.el, sx, sy, sw, sh);
                            if (blob)
                                return blob;
                        }
                        catch ( /* fall through */_b) { /* fall through */ }
                    }
                }
            }
            console.warn('[Visage] Media has no intrinsic size (not loaded yet), falling back');
            return fallbackCapture(bounds);
        }
        const contentRect = getContentRect(found.el, found.rect);
        const clamped = clampSelToContent(bounds, contentRect);
        if (clamped.w < 4 || clamped.h < 4) {
            console.warn('[Visage] Selection too small after content clamp, falling back');
            return fallbackCapture(bounds);
        }
        const { sx, sy, sw, sh } = mapToIntrinsic(found.el, clamped, contentRect);
        console.warn('[Visage] Direct capture mapped:', { sx, sy, sw, sh });
        try {
            const blob = await drawFromMedia(found.el, sx, sy, sw, sh);
            debugPaint(blob, clamped);
            return blob;
        }
        catch (err) {
            console.warn('[Visage] Direct capture threw, falling back:', err);
            return fallbackCapture(bounds);
        }
    }

    const GQL = window.PluginApi.GQL;
    const getClient = () => window.PluginApi.utils.StashService.getClient();
    async function getPerformers(performer_id) {
        const result = await getClient().query({
            query: GQL.FindPerformersDocument,
            variables: {
                performer_filter: {
                    stash_id_endpoint: {
                        endpoint: "",
                        stash_id: performer_id,
                        modifier: "EQUALS"
                    }
                }
            }
        });
        return result.data.findPerformers.performers;
    }
    async function getPerformersForScene(scene_id) {
        const result = await getClient().query({
            query: GQL.FindSceneDocument,
            variables: { id: scene_id }
        });
        return result.data.findScene.performers.map((p) => p.id);
    }
    async function getPerformersForImage(image_id) {
        const result = await getClient().query({
            query: GQL.FindImageDocument,
            variables: { id: image_id }
        });
        return result.data.findImage.performers.map((p) => p.id);
    }
    async function updateScene(scene_id, performer_ids) {
        return getClient().mutate({
            mutation: GQL.SceneUpdateDocument,
            variables: { input: { id: scene_id, performer_ids: performer_ids } }
        });
    }
    async function updateImage(image_id, performer_ids) {
        return getClient().mutate({
            mutation: GQL.ImageUpdateDocument,
            variables: { input: { id: image_id, performer_ids: performer_ids } }
        });
    }
    const STASHBOX_DOCS_URL = 'https://docs.stashapp.cc/metadata-sources/stash-box-instances/';
    function getStashBoxIndex(boxes, sourceName) {
        if (sourceName) {
            const idx = boxes.findIndex(b => { var _a; return (_a = b.name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(sourceName.toLowerCase()); });
            if (idx >= 0)
                return idx;
        }
        const idx = boxes.findIndex(b => { var _a; return (_a = b.name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('stashdb'); });
        return idx >= 0 ? idx : 0;
    }
    async function getStashboxEndpoint(sourceName) {
        var _a, _b, _c;
        const result = await getClient().query({
            query: GQL.ConfigurationDocument
        });
        const boxes = (_c = (_b = (_a = result.data) === null || _a === void 0 ? void 0 : _a.configuration) === null || _b === void 0 ? void 0 : _b.general) === null || _c === void 0 ? void 0 : _c.stashBoxes;
        if (!(boxes === null || boxes === void 0 ? void 0 : boxes.length))
            return null;
        return boxes[getStashBoxIndex(boxes, sourceName)].endpoint;
    }
    // The active Stash UI locale, read from the server-side configuration the same
    // way the Stash frontend does (App.tsx reads configuration.interface.language).
    // Falls back to 'en'. Note: Stash does not reflect the locale in <html lang>.
    async function getStashLanguage() {
        var _a, _b, _c;
        try {
            const result = await getClient().query({
                query: GQL.ConfigurationDocument,
            });
            const lang = (_c = (_b = (_a = result.data) === null || _a === void 0 ? void 0 : _a.configuration) === null || _b === void 0 ? void 0 : _b.interface) === null || _c === void 0 ? void 0 : _c.language;
            return typeof lang === 'string' && lang ? lang : 'en';
        }
        catch (err) {
            console.warn('[Visage] Failed to read Stash language:', err);
            return 'en';
        }
    }
    async function getStashboxStatus() {
        var _a, _b, _c;
        const result = await getClient().query({
            query: GQL.ConfigurationDocument
        });
        const boxes = (_c = (_b = (_a = result.data) === null || _a === void 0 ? void 0 : _a.configuration) === null || _b === void 0 ? void 0 : _b.general) === null || _c === void 0 ? void 0 : _c.stashBoxes;
        if (!(boxes === null || boxes === void 0 ? void 0 : boxes.length))
            return 'empty';
        const hasStashdb = boxes.some(b => { var _a; return (_a = b.name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('stashdb'); });
        return hasStashdb ? 'configured' : 'mismatch';
    }
    async function getPerformerDataFromStashID(stash_id, sourceName) {
        var _a, _b, _c, _d;
        const endpointResult = await getClient().query({
            query: GQL.ConfigurationDocument
        });
        const boxes = ((_c = (_b = (_a = endpointResult.data) === null || _a === void 0 ? void 0 : _a.configuration) === null || _b === void 0 ? void 0 : _b.general) === null || _c === void 0 ? void 0 : _c.stashBoxes) || [];
        const boxIdx = getStashBoxIndex(boxes, sourceName);
        try {
            const result = await getClient().query({
                query: GQL.ScrapeSinglePerformerDocument,
                variables: {
                    source: {
                        stash_box_index: boxIdx
                    },
                    input: {
                        query: stash_id
                    }
                }
            });
            if (result.errors) {
                console.warn('[Visage] GraphQL errors in scrapeSinglePerformer:', result.errors);
            }
            if (!((_d = result.data) === null || _d === void 0 ? void 0 : _d.scrapeSinglePerformer)) {
                return undefined;
            }
            return result.data.scrapeSinglePerformer.filter((p) => p.remote_site_id === stash_id)[0];
        }
        catch (error) {
            console.warn('[Visage] Exception in scrapeSinglePerformer:', error);
            return undefined;
        }
    }
    async function createPerformer(performer) {
        return getClient().mutate({
            mutation: GQL.PerformerCreateDocument,
            variables: { input: performer }
        });
    }
    async function findPerformerByName(name, disambiguation) {
        var _a;
        if (!name)
            return undefined;
        const result = await getClient().query({
            query: GQL.FindPerformersDocument,
            variables: {
                performer_filter: {
                    name: { value: name, modifier: "EQUALS" },
                    ...(disambiguation ? { disambiguation: { value: disambiguation, modifier: "EQUALS" } } : {}),
                },
            },
        });
        return (_a = result.data.findPerformers.performers) === null || _a === void 0 ? void 0 : _a[0];
    }
    async function createOrGetPerformer(scraped, stashId, sourceName) {
        var _a;
        const performerData = await scrapedPerformerToInput(scraped, stashId, sourceName);
        const result = await createPerformer(performerData);
        if (result.errors) {
            const msg = ((_a = result.errors[0]) === null || _a === void 0 ? void 0 : _a.message) || '';
            if (!msg.toLowerCase().includes('already exists')) {
                throw new Error(msg);
            }
            const existing = await findPerformerByName(performerData.name, performerData.disambiguation);
            if (existing) {
                return { performerId: existing.id, created: false };
            }
            throw new Error(msg);
        }
        return { performerId: result.data.performerCreate.id, created: true };
    }
    async function getScenePath(scene_id, pathKey) {
        var _a;
        const result = await getClient().query({
            query: GQL.FindSceneDocument,
            variables: { id: scene_id }
        });
        return (_a = result.data.findScene.paths[pathKey]) !== null && _a !== void 0 ? _a : null;
    }
    async function getUrlSprite(scene_id) {
        const url = await getScenePath(scene_id, 'sprite');
        if (!url)
            return null;
        const response = await fetch(url);
        return response.ok ? url : null;
    }
    async function getImagePath(image_id, pathKey = 'image') {
        var _a, _b;
        const result = await getClient().query({
            query: GQL.FindImageDocument,
            variables: { id: image_id }
        });
        const path = (_b = (_a = result.data.findImage.paths) === null || _a === void 0 ? void 0 : _a[pathKey]) !== null && _b !== void 0 ? _b : null;
        if (!path)
            return null;
        if (typeof path === 'string' && path.startsWith('/')) {
            return `${window.location.origin}${path}`;
        }
        return path;
    }
    async function getImageUrl(image_id) {
        return getImagePath(image_id, 'image');
    }
    async function getUrlPreview(scene_id) {
        return getScenePath(scene_id, 'preview');
    }
    async function scrapedPerformerToInput(scraped, stashId, sourceName) {
        const { images, height, aliases, remote_site_id, stored_id, __typename, tags, ...rest } = scraped;
        const endpoint = await getStashboxEndpoint(sourceName);
        return {
            ...rest,
            image: images === null || images === void 0 ? void 0 : images[0],
            height_cm: height,
            alias_list: aliases,
            stash_ids: endpoint ? [{ endpoint, stash_id: stashId }] : undefined,
        };
    }
    async function addPerformerToContent(scenario, contentId, performerId) {
        const getIds = scenario === 'scenes' ? getPerformersForScene : getPerformersForImage;
        const update = scenario === 'scenes' ? updateScene : updateImage;
        const currentIds = await getIds(contentId);
        if (!currentIds.includes(performerId)) {
            currentIds.push(performerId);
            await update(contentId, currentIds);
        }
    }

    function getScenarioAndID() {
        const result = document.URL.match(/(scenes|images)\/(\d+)/);
        if (!result) {
            throw new Error('Could not parse scenario and ID from URL');
        }
        const scenario = result[1];
        const scenario_id = result[2];
        return [scenario, scenario_id];
    }
    async function downloadAsDataUrl(url) {
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`Failed to fetch ${url}: ${response.status}`);
        const vblob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(vblob);
        });
    }
    function closeDropdown() {
        var _a;
        const menu = document.querySelector('.dropdown-menu.show');
        if (!menu)
            return;
        menu.classList.remove('show');
        const toggle = (_a = menu.closest('.dropdown')) === null || _a === void 0 ? void 0 : _a.querySelector('[data-toggle="dropdown"], .dropdown-toggle');
        if (toggle)
            toggle.setAttribute('aria-expanded', 'false');
    }
    function isOpsMenu(menu) {
        var _a;
        return menu.getAttribute('aria-labelledby') === 'operation-menu'
            || !!((_a = menu.closest('.dropdown')) === null || _a === void 0 ? void 0 : _a.querySelector('[id="operation-menu"]'));
    }
    function injectMenu(menu) {
        const divider = document.createElement('hr');
        divider.className = 'visage-menu-divider dropdown-divider';
        menu.insertBefore(divider, menu.firstElementChild);
        const div = document.createElement('div');
        div.style.cssText = 'display:flex;flex-direction:column;flex-shrink:0;';
        menu.insertBefore(div, divider);
        return div;
    }

    function getErrorMessage(error, fallback = 'Unknown error') {
        return error instanceof Error ? error.message : fallback;
    }

    // English source dictionary. Every user-facing string in the plugin lives here.
    // Keys are namespaced by component. `{var}` tokens are interpolated via t().
    // Adding a new string: add it here with an English value; every locale dict is
    // Partial, so missing keys fall back to English automatically.
    const en = {
        // ---- BackendSettings.tsx ----
        'backendSettings.title': 'Backend settings',
        'backendSettings.closeAria': 'Close settings',
        'backendSettings.backendAria': 'Backend settings',
        'backendSettings.changeBackend': 'Change backend',
        'backendSettings.backendLabel': 'Backend',
        'backendSettings.local': 'Local',
        'backendSettings.cloud': 'Cloud (Hugging Face)',
        'backendSettings.cloudNote': 'Images are sent to the Hugging Face cloud service.',
        'backendSettings.hintPrefix': 'Want your images to stay on your network?',
        'backendSettings.hintLink': 'Run a private server via Patreon',
        'backendSettings.urlLabel': 'URL',
        'backendSettings.csp1': "The browser's security policy (CSP) only allows",
        'backendSettings.csp2': 'by default. To reach a local backend on another address (e.g. your LAN IP), add it to the',
        'backendSettings.csp3': 'list in the',
        'backendSettings.csp4': 'file inside your Stash plugins folder, otherwise requests will be blocked. Note: updating Visage reinstalls',
        'backendSettings.csp5': ', so this must be reapplied after every update.',
        'backendSettings.testing': 'Testing connection…',
        'backendSettings.testConnection': 'Test connection',
        'backendSettings.testingShort': 'Testing…',
        'backendSettings.cancel': 'Cancel',
        'backendSettings.save': 'Save',
        'backendSettings.feedback.reachable': 'Connection successful. Backend is ready.',
        'backendSettings.feedback.degraded': 'Backend reachable but degraded (models or index not loaded).',
        'backendSettings.feedback.unreachable': 'Backend unreachable. Check the URL and that the backend is running.',
        'backendSettings.sync.title': 'Stash Sync',
        'backendSettings.sync.lastSynced': 'Last synced: {time}',
        'backendSettings.sync.neverSynced': 'Never synced',
        'backendSettings.sync.performers': '{count} performers in index',
        'backendSettings.sync.button': 'Sync',
        'backendSettings.sync.syncing': 'Syncing…',
        'backendSettings.sync.done': 'Done',
        'backendSettings.sync.alreadyRunning': 'Sync already in progress',
        'backendSettings.sync.error': 'Sync failed',
        'backendSettings.sync.connectionLost': 'Connection lost',
        // ---- FaceMatchModal.tsx ----
        'faceMatch.title': 'CURRENT FRAME',
        'faceMatch.close': 'Close',
        'faceMatch.facesSelected': '{faces} faces found · {selected} selected',
        'faceMatch.inScene': '· {count} in scene',
        'faceMatch.stashboxMissing': 'No stash-box configured.',
        'faceMatch.stashboxMissingBody': ' Add a stash-box provider in Settings → Metadata Providers to enable performer import.',
        'faceMatch.stashboxWrongName': 'No "StashDB" provider found.',
        'faceMatch.stashboxWrongNameBody': ' Performer import requires a provider named "StashDB". Rename your provider in Settings → Metadata Providers.',
        'faceMatch.learnMore': 'Learn more.',
        'faceMatch.scanning': 'Scanning • face recognition…',
        'faceMatch.faceAlt': 'Face {index}',
        'faceMatch.minConf': 'Min conf.',
        'faceMatch.minConfTitle': 'Minimum confidence: {percent}%',
        'faceMatch.detected': 'Detected',
        'faceMatch.detectedFaceAlt': 'Detected face',
        'faceMatch.vs': 'vs',
        'faceMatch.supportPatreon': 'Support on Patreon',
        'faceMatch.ofSelected': '{selected} of {total} selected',
        'faceMatch.allInScene': '{total} faces found · all in scene',
        'faceMatch.clickToSelect': '{total} faces found · click to select',
        'faceMatch.kbSwitch': 'Switch faces',
        'faceMatch.kbSelect': 'Select performers',
        'faceMatch.kbToggle': 'Toggle select',
        'faceMatch.kbAddInstant': 'Shift+click to add instantly',
        'faceMatch.selectBest': 'Select Best Matches',
        'faceMatch.adding': 'Adding...',
        'faceMatch.done': 'Done ({count})',
        'faceMatch.toast.added': 'Added performer to the {target}.',
        'faceMatch.toast.addError': 'Failed to add performer: {error}',
        'faceMatch.toast.noStashbox': 'No stash-box configured. Add a stash-box provider in Settings → Metadata Providers to enable performer import. See {url}',
        'faceMatch.toast.noProvider': 'No provider named "StashDB" found. Rename your provider to "StashDB" in Settings → Metadata Providers to enable performer import.',
        'faceMatch.toast.configureProvider': 'Configure a stash-box provider in Settings → Metadata Providers to enable performer import.',
        'faceMatch.toast.addedMultiple': 'Added {count} performer{s} to the {target}.',
        // ---- SpriteResultModal.tsx ----
        'sprite.title': 'SCENE PERFORMERS',
        'sprite.close': 'Close',
        'sprite.foundConfirmed': '{found} found · {confirmed} confirmed',
        'sprite.confidence': 'confidence',
        'sprite.name': 'name',
        'sprite.hits': 'hits',
        'sprite.minConf': 'Min conf.',
        'sprite.minConfTitle': 'Minimum confidence: {percent}%',
        'sprite.scanning': 'Visage Scanning…',
        'sprite.cancel': 'Cancel',
        'sprite.empty': 'No performers identified in this sprite.',
        'sprite.detectedFaceAlt': 'Detected face',
        'sprite.spriteLabel': 'SPRITE',
        'sprite.stashLabel': 'STASH',
        'sprite.vs': 'vs',
        'sprite.inScene': 'In scene',
        'sprite.hitsCount': '{count} hit{s}',
        'sprite.totalTime': '{time} total',
        'sprite.alreadyInScene': 'Already in scene',
        'sprite.clickToConfirm': 'Click to confirm',
        'sprite.confirmed': 'Confirmed',
        'sprite.supportPatreon': 'Support on Patreon',
        'sprite.confirmedCount': '{confirmed} of {total} confirmed',
        'sprite.shownHint': '{shown} shown ({total} total) · click to confirm · ←→ navigate · Enter confirm',
        'sprite.confirmHint': 'Click to confirm · ←→ navigate · Enter confirm',
        'sprite.adding': 'Adding...',
        'sprite.done': 'Done ({count})',
        // ---- PerformerCard.tsx ----
        'gender.male': 'Male',
        'gender.female': 'Female',
        'gender.transMale': 'Transgender male',
        'gender.transFemale': 'Transgender female',
        'gender.nonBinary': 'Non-binary',
        'gender.intersex': 'Intersex',
        'card.excellent': 'Excellent match',
        'card.good': 'Good match',
        'card.uncertain': 'Uncertain match',
        'card.select': 'Select {name}',
        'card.deselect': 'Deselect {name}',
        'card.openOn': 'Open on {source}',
        // ---- FaceSearchButton.tsx ----
        'search.overlayHint': 'Drag to select a face — Enter to scan the whole frame — Esc to cancel',
        'search.noFaces': 'No faces found in that selection. Try a tighter crop, or press Enter to scan the whole frame.',
        'search.captureMediaFail': 'Could not capture media. Please ensure the scene/image is fully loaded.',
        'search.healthBanner': 'Face recognition API is not reachable. Start the backend and try again.',
        'search.failed': 'Face search failed: {error}',
        'search.fetchImageFail': 'Could not fetch image from Stash.',
        'search.captureFail': 'Failed to capture image: {error}',
        'search.selectFaceImage': 'Select a face within the image.',
        'search.captureFrameFail': 'Could not capture the current frame.',
        'search.captureFrameFail2': 'Failed to capture the current frame.',
        'search.selectFaceVideo': 'Select a face within the video player area.',
        'search.menuItemTitle': 'Drag a box around a face, or press Enter to scan the whole frame, to search StashDB for matches',
        'search.currentFrame': 'Visage: Current Frame',
        // ---- SceneScanButton.tsx ----
        'scene.noSprite': 'No sprite sheet or preview video found for this scene. Generate them in Scene settings, then try again.',
        'scene.noFaces': 'No faces or performers found in this scene’s sprite sheet or preview video.',
        'scene.healthBanner': 'Face recognition API is not reachable. Start the backend and try again.',
        'scene.failed': 'Scene scan failed: {error}',
        'scene.menuItemTitle': 'Identify every performer in the scene (needs a generated sprite sheet or preview video)',
        'scene.wholeScene': 'Visage: Whole Scene',
        // ---- BackendHealthBanner.tsx ----
        'banner.changeBackend': 'Change backend',
        'banner.dismiss': 'Dismiss',
        // ---- ErrorDialog.tsx ----
        'error.dismiss': 'Dismiss',
        // ---- FirstRunDialog.tsx ----
        'firstRun.title': 'Set up your Visage backend',
        'firstRun.subtitle': 'Visage sends face images to a backend for recognition. Choose where to run it.',
        'firstRun.cloud': 'Use Hugging Face cloud',
        'firstRun.cloudNote': 'Zero setup. Images are sent to the Hugging Face cloud service.',
        'firstRun.local': 'Use my own server',
        'firstRun.localNote': 'Run the private binary on your own machine or network.',
        'firstRun.skip': 'Skip for now',
        // ---- BackendBadge.tsx ----
        'badge.local': 'Local',
        'badge.cloud': 'Cloud (Hugging Face)',
        'badge.title': 'Visage backend: {label}',
        // ---- DonateFooter.tsx ----
        'donate.enjoying': 'Enjoying Visage? Help keep it alive',
        'donate.supportPatreon': 'Support on Patreon',
        // ---- FaceFrameSelector.tsx ----
        'frame.close': 'Close frame selector',
        'frame.seekFail': 'Failed to seek video player.',
        'frame.selectAt': 'Select face frame at {time}s',
    };

    // All locale dicts registered by the loader. `en` is always present.
    const dicts = {
        en,
    };
    function registerLocale(code, dict) {
        dicts[code.toLowerCase()] = dict;
    }
    // The active locale, defaulting to English. Stash does NOT sync the <html lang>
    // attribute to the UI locale (it stays "en"), so the real locale is read from
    // the Stash configuration via GraphQL (see services/stash.getStashLanguage) and
    // applied here through setActiveLocale.
    let currentLocale = { code: 'en', language: 'en' };
    // Returns the active locale. Defaults to English until setActiveLocale is called.
    function getLocale() {
        return currentLocale;
    }
    // Updates the active locale used by t(). Called once the real Stash language is
    // resolved from the GraphQL configuration.
    function setActiveLocale(locale) {
        currentLocale = locale;
    }
    function normalizeLocale(lang) {
        const trimmed = lang.trim().toLowerCase();
        if (!trimmed)
            return { code: 'en', language: 'en' };
        // Stash uses full BCP-47 tags (e.g. "nl-NL"); also tolerate bare "nl".
        const [language, region] = trimmed.split('-');
        return { code: trimmed, language, region };
    }
    // Translate a key with optional {var} interpolation. Unknown keys fall back
    // to English (or the raw key if even en lacks it) — never throws.
    function t(key, vars) {
        var _a, _b;
        const locale = getLocale();
        let value = (_b = (_a = lookup(locale.code, key)) !== null && _a !== void 0 ? _a : en[key]) !== null && _b !== void 0 ? _b : key;
        if (vars) {
            for (const [k, v] of Object.entries(vars)) {
                value = value.split(`{${k}}`).join(String(v));
            }
        }
        return value;
    }
    function lookup(code, key) {
        var _a;
        const dict = dicts[code];
        if (dict === null || dict === void 0 ? void 0 : dict[key])
            return dict[key];
        const { language } = normalizeLocale(code);
        if (language && language !== code) {
            const langDict = dicts[language];
            if (langDict === null || langDict === void 0 ? void 0 : langDict[key])
                return langDict[key];
        }
        // If the active code is bare (e.g. "nl"), fall back to any dict whose
        // registered region code shares that language prefix (e.g. "nl-NL").
        const prefixDict = Object.keys(dicts).find((k) => { var _a; return k.startsWith(language + '-') && ((_a = dicts[k]) === null || _a === void 0 ? void 0 : _a[key]); });
        if (prefixDict)
            return (_a = dicts[prefixDict]) === null || _a === void 0 ? void 0 : _a[key];
        return undefined;
    }

    // React via Stash PluginApi, matching the pattern used across the plugin.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const React$g = window.PluginApi.React;
    // Re-renders the component when the active locale changes. Stash does not sync
    // the <html lang> attribute to the UI locale, so the real locale is resolved
    // from the GraphQL configuration (configuration.interface.language) and applied
    // via setActiveLocale. Stash reloads the page when the language changes, so a
    // mount-time fetch is sufficient.
    function useLocale() {
        const [locale, setLocale] = React$g.useState(() => getLocale());
        React$g.useEffect(() => {
            let cancelled = false;
            (async () => {
                const lang = await getStashLanguage();
                if (cancelled)
                    return;
                const next = normalizeLocale(lang);
                const current = getLocale();
                if (next.code !== current.code || next.language !== current.language) {
                    setActiveLocale(next);
                    setLocale(next);
                }
            })().catch(() => {
                // Swallow: default to English if the locale can't be resolved.
            });
            return () => {
                cancelled = true;
            };
        }, []);
        return locale;
    }

    const React$f = window.PluginApi.React;
    const { useCallback: useCallback$6 } = React$f;
    let overlayDiv = null;
    let selectionDiv = null;
    let keyHandler = null;
    let startX = 0, startY = 0;
    let isSelecting = false;
    let _capturing = false;
    function makeOverlay(onComplete, onCancel, capture) {
        removeOverlay();
        _capturing = false;
        const capRegion = (capture === null || capture === void 0 ? void 0 : capture.region) || captureRegion;
        const capWhole = (capture === null || capture === void 0 ? void 0 : capture.whole) || captureWholeFrame;
        overlayDiv = document.createElement('div');
        overlayDiv.style.cssText = 'position:fixed;inset:0;z-index:2147483647;cursor:crosshair;background:rgba(0,0,0,0.12);';
        const instructions = document.createElement('div');
        instructions.textContent = t('search.overlayHint');
        instructions.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);background:#07070f;color:rgba(255,255,255,0.8);padding:10px 24px;border-radius:8px;font:13px/1.4 system-ui,sans-serif;border:1px solid rgba(255,255,255,0.07);box-shadow:0 4px 20px rgba(0,0,0,0.5);pointer-events:none;z-index:2147483648;';
        overlayDiv.appendChild(instructions);
        selectionDiv = document.createElement('div');
        selectionDiv.style.cssText = 'position:fixed;display:none;outline:2px solid #5695ff;outline-offset:-2px;background:rgba(86,149,255,0.08);pointer-events:none;z-index:2147483649;';
        overlayDiv.appendChild(selectionDiv);
        document.body.appendChild(overlayDiv);
        function onMouseDown(e) {
            if (e.button !== 0)
                return;
            isSelecting = true;
            startX = e.clientX;
            startY = e.clientY;
            selectionDiv.style.cssText = `position:fixed;display:block;left:${startX}px;top:${startY}px;width:0;height:0;outline:2px solid #5695ff;outline-offset:-2px;background:rgba(86,149,255,0.08);pointer-events:none;z-index:2147483649;`;
            overlayDiv.addEventListener('mousemove', onMouseMove);
            overlayDiv.addEventListener('mouseup', onMouseUp);
        }
        function onMouseMove(e) {
            if (!isSelecting)
                return;
            const x = Math.min(startX, e.clientX), y = Math.min(startY, e.clientY);
            const w = Math.abs(e.clientX - startX), h = Math.abs(e.clientY - startY);
            selectionDiv.style.cssText = `position:fixed;display:block;left:${x}px;top:${y}px;width:${w}px;height:${h}px;outline:2px solid #5695ff;outline-offset:-2px;background:rgba(86,149,255,0.08);pointer-events:none;z-index:2147483649;`;
        }
        function onMouseUp(e) {
            isSelecting = false;
            overlayDiv.removeEventListener('mousemove', onMouseMove);
            overlayDiv.removeEventListener('mouseup', onMouseUp);
            if (_capturing)
                return;
            _capturing = true;
            const sr = selectionDiv.getBoundingClientRect();
            if (sr.width < 10 || sr.height < 10) {
                removeOverlay();
                onCancel();
                _capturing = false;
                return;
            }
            overlayDiv.style.display = 'none';
            capRegion({ x: sr.left, y: sr.top, w: sr.width, h: sr.height }).then((blob) => {
                removeOverlay();
                if (blob)
                    onComplete(blob);
                else
                    onCancel();
            }).catch(() => { removeOverlay(); onCancel(); });
        }
        function onKeyDown(e) {
            if (e.key === 'Escape') {
                removeOverlay();
                onCancel();
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (isSelecting || _capturing)
                    return;
                _capturing = true;
                overlayDiv.style.display = 'none';
                capWhole().then((blob) => {
                    removeOverlay();
                    if (blob)
                        onComplete(blob);
                    else
                        onCancel();
                }).catch(() => { removeOverlay(); onCancel(); });
            }
        }
        overlayDiv.addEventListener('mousedown', onMouseDown);
        keyHandler = onKeyDown;
        document.addEventListener('keydown', onKeyDown);
    }
    function removeOverlay() {
        if (keyHandler) {
            document.removeEventListener('keydown', keyHandler);
            keyHandler = null;
        }
        if (overlayDiv) {
            overlayDiv.remove();
            overlayDiv = null;
            selectionDiv = null;
        }
    }
    const IS_MOBILE = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    async function fetchImageBlob(scenarioId) {
        const imageUrl = await getImageUrl(scenarioId);
        if (!imageUrl)
            return null;
        try {
            const response = await fetch(imageUrl);
            if (!response.ok)
                return null;
            const blob = await response.blob();
            if (!blob.type) {
                return new Blob([blob], { type: 'image/jpeg' });
            }
            return blob;
        }
        catch (_a) {
            return null;
        }
    }
    function getImageContentRect(el, naturalW, naturalH) {
        const r = el.getBoundingClientRect();
        const objFit = getComputedStyle(el).objectFit;
        let contentW = r.width, contentH = r.height;
        if (naturalW > 0 && naturalH > 0) {
            if (objFit === 'contain' || objFit === 'scale-down') {
                const s = Math.min(r.width / naturalW, r.height / naturalH);
                contentW = naturalW * s;
                contentH = naturalH * s;
            }
            else if (objFit === 'cover') {
                const s = Math.max(r.width / naturalW, r.height / naturalH);
                contentW = naturalW * s;
                contentH = naturalH * s;
            }
        }
        return {
            x: r.left + (r.width - contentW) / 2,
            y: r.top + (r.height - contentH) / 2,
            w: contentW, h: contentH,
        };
    }
    async function cropBlob(blob, bounds) {
        try {
            const bitmap = await createImageBitmap(blob);
            const cx = bounds.x + bounds.w / 2, cy = bounds.y + bounds.h / 2;
            const els = document.elementsFromPoint(cx, cy);
            let imgEl = null;
            for (const el of els) {
                if (el instanceof HTMLImageElement) {
                    imgEl = el;
                    break;
                }
            }
            const content = imgEl
                ? getImageContentRect(imgEl, bitmap.width, bitmap.height)
                : { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
            const relX = Math.max(bounds.x, content.x);
            const relY = Math.max(bounds.y, content.y);
            const relR = Math.min(bounds.x + bounds.w, content.x + content.w);
            const relB = Math.min(bounds.y + bounds.h, content.y + content.h);
            if (relX >= relR || relY >= relB)
                return null;
            const selW = relR - relX, selH = relB - relY;
            if (selW < 4 || selH < 4)
                return null;
            const sx = ((relX - content.x) / content.w) * bitmap.width;
            const sy = ((relY - content.y) / content.h) * bitmap.height;
            const sw = (selW / content.w) * bitmap.width;
            const sh = (selH / content.h) * bitmap.height;
            const canvas = document.createElement('canvas');
            const maxSide = 400;
            const scale = Math.min(maxSide / sw, maxSide / sh, 1);
            canvas.width = Math.max(1, Math.round(sw * scale));
            canvas.height = Math.max(1, Math.round(sh * scale));
            const ctx = canvas.getContext('2d');
            if (!ctx)
                return null;
            ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            bitmap.close();
            return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85));
        }
        catch (_a) {
            return null;
        }
    }
    async function dispatchBlob(blob, showWarning, showError, showHealthBanner, setLoading, setMatches, setScenario, loadingKey, startMatchSearch, showMatchModal) {
        setLoading(loadingKey, true);
        const [scenario, scenarioId] = getScenarioAndID();
        setScenario(scenario, scenarioId);
        // Open the modal up front: the trigger lives in a dropdown that closes on
        // click, so the modal is the only place the scanning state stays visible.
        startMatchSearch();
        let succeeded = false;
        try {
            const result = await callGradioAPI('multiple_image_search', [blob, MAX_RESULTS]);
            const matchData = result.data;
            if (!matchData || typeof matchData !== 'object') {
                showWarning(t('search.noFaces'));
                return;
            }
            const first = Array.isArray(matchData) ? matchData[0] : matchData;
            if (first === null || first === void 0 ? void 0 : first.error) {
                showWarning(first.error);
                return;
            }
            if (!Array.isArray(matchData) || matchData.length === 0) {
                showWarning(t('search.noFaces'));
                return;
            }
            setMatches(matchData);
            succeeded = true;
        }
        catch (error) {
            const message = getErrorMessage(error);
            if (message.includes('Could not find element')) {
                showError(t('search.captureMediaFail'));
            }
            else if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
                showHealthBanner(t('search.healthBanner'));
            }
            else {
                showError(t('search.failed', { error: message }));
            }
        }
        finally {
            setLoading(loadingKey, false);
            if (!succeeded)
                showMatchModal(false);
        }
    }
    function FaceSearchButton({ menuItem }) {
        useLocale();
        const { state, setLoading, setMatches, setScenario, showWarning, showError, showHealthBanner, startMatchSearch, showMatchModal } = useVisage();
        const loadingKey = 'face-search';
        const isLoading = state.loading[loadingKey] || false;
        const recognize = useCallback$6(async () => {
            if (isLoading)
                return;
            const [scenario, scenarioId] = getScenarioAndID();
            setScenario(scenario, scenarioId);
            if (scenario === 'images') {
                if (IS_MOBILE) {
                    setLoading(loadingKey, true);
                    try {
                        const blob = await fetchImageBlob(scenarioId);
                        if (!blob) {
                            showWarning(t('search.fetchImageFail'));
                            setLoading(loadingKey, false);
                            return;
                        }
                        await dispatchBlob(blob, showWarning, showError, showHealthBanner, setLoading, setMatches, setScenario, loadingKey, startMatchSearch, showMatchModal);
                    }
                    catch (error) {
                        showError(t('search.captureFail', { error: getErrorMessage(error) }));
                        setLoading(loadingKey, false);
                    }
                    return;
                }
                makeOverlay((blob) => {
                    dispatchBlob(blob, showWarning, showError, showHealthBanner, setLoading, setMatches, setScenario, loadingKey, startMatchSearch, showMatchModal);
                }, () => {
                    showWarning(t('search.selectFaceImage'));
                }, {
                    region: async (bounds) => {
                        const b = await fetchImageBlob(scenarioId);
                        if (!b)
                            return null;
                        return cropBlob(b, bounds);
                    },
                    whole: () => fetchImageBlob(scenarioId),
                });
                return;
            }
            if (IS_MOBILE) {
                setLoading(loadingKey, true);
                try {
                    const blob = await captureWholeFrame();
                    if (!blob) {
                        showWarning(t('search.captureFrameFail'));
                        setLoading(loadingKey, false);
                        return;
                    }
                    await dispatchBlob(blob, showWarning, showError, showHealthBanner, setLoading, setMatches, setScenario, loadingKey, startMatchSearch, showMatchModal);
                }
                catch (error) {
                    console.warn('[Visage] captureWholeFrame failed:', error);
                    showError(t('search.captureFrameFail2'));
                    setLoading(loadingKey, false);
                }
                return;
            }
            makeOverlay((blob) => {
                dispatchBlob(blob, showWarning, showError, showHealthBanner, setLoading, setMatches, setScenario, loadingKey, startMatchSearch, showMatchModal);
            }, () => {
                showWarning(t('search.selectFaceVideo'));
            });
        }, [setLoading, setMatches, setScenario, isLoading, showWarning, showError, showHealthBanner, startMatchSearch, showMatchModal]);
        if (menuItem) {
            return React$f.createElement('a', {
                href: '#',
                className: 'bg-secondary text-white dropdown-item',
                role: 'button',
                title: t('search.menuItemTitle'),
                onClick: (e) => { e.preventDefault(); closeDropdown(); recognize(); },
            }, t('search.currentFrame'));
        }
        return React$f.createElement('button', {
            id: 'visage-frame-search',
            className: `visage-toolbar-button${isLoading ? ' visage-scanning' : ''}`,
            onClick: recognize,
            disabled: isLoading,
            title: t('search.currentFrame'),
        }, React$f.createElement('svg', {
            width: 20, height: 20, viewBox: '0 0 24 24',
            fill: 'currentColor', xmlns: 'http://www.w3.org/2000/svg',
        }, React$f.createElement('path', {
            d: 'M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z',
        })));
    }

    function pad(n, width = 2) {
        return String(n).padStart(width, '0');
    }
    function formatVttTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
        return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
    }
    async function extractFramesFromPreview(previewUrl, frameCount = 12, tileWidth = 640, tileHeight = 360) {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        video.src = previewUrl;
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Preview video load timed out')), 15000);
            video.onloadedmetadata = () => {
                clearTimeout(timeout);
                resolve();
            };
            video.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Failed to load preview video'));
            };
            video.load();
        });
        await video.play();
        video.pause();
        const duration = video.duration;
        if (!duration || duration <= 0)
            throw new Error('Invalid preview video duration');
        const interval = duration / frameCount;
        const extractCanvas = document.createElement('canvas');
        extractCanvas.width = tileWidth;
        extractCanvas.height = tileHeight;
        const extractCtx = extractCanvas.getContext('2d');
        const cols = 4;
        const rows = Math.ceil(frameCount / cols);
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = cols * tileWidth;
        spriteCanvas.height = rows * tileHeight;
        const spriteCtx = spriteCanvas.getContext('2d');
        const cues = [];
        const halfStep = interval / 2;
        for (let i = 0; i < frameCount; i++) {
            if (isCancelled())
                break;
            const time = Math.min(i * interval + halfStep, duration - 0.001);
            video.currentTime = time;
            await new Promise((resolve) => {
                video.onseeked = () => resolve();
            });
            extractCtx.drawImage(video, 0, 0, tileWidth, tileHeight);
            const col = i % cols;
            const row = Math.floor(i / cols);
            spriteCtx.drawImage(extractCanvas, col * tileWidth, row * tileHeight);
            cues.push(`${formatVttTime(time)} --> ${formatVttTime(Math.min(time + interval, duration))}\n` +
                `sprite.jpg#xywh=${col * tileWidth},${row * tileHeight},${tileWidth},${tileHeight}`);
        }
        const spriteBlob = await new Promise((resolve, reject) => {
            spriteCanvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.85);
        });
        const vtt = 'WEBVTT\n\n' + cues.map((c, i) => `${i + 1}\n${c}`).join('\n\n');
        video.remove();
        extractCanvas.remove();
        spriteCanvas.remove();
        return { sprite: spriteBlob, vtt };
    }

    function hasPerformers(data) {
        return !!(data === null || data === void 0 ? void 0 : data.performers) && Object.keys(data.performers).length > 0;
    }
    async function trySprite(sceneId, onProgress) {
        var _a;
        const spriteUrl = await getUrlSprite(sceneId);
        if (!spriteUrl)
            return null;
        const vttUrl = spriteUrl.replace(/_sprite\.jpg$/, '_thumbs.vtt');
        const image = await downloadAsDataUrl(spriteUrl);
        const vttResponse = await fetch(vttUrl);
        if (!vttResponse.ok) {
            console.warn('[Visage] sprite VTT fetch failed', vttUrl, vttResponse.status);
            return null;
        }
        const vttBlob = await vttResponse.blob();
        const imageBlob = dataUrlToBlob(image);
        const result = await identifySpritePerformers(imageBlob, vttBlob, onProgress);
        const data = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a[0];
        if (data === null || data === void 0 ? void 0 : data.error) {
            console.warn('[Visage] sprite identification error:', data.error);
            return null;
        }
        return hasPerformers(data) ? data : null;
    }
    async function tryPreview(sceneId, onProgress) {
        var _a;
        if (isCancelled())
            return null;
        const previewUrl = await getUrlPreview(sceneId);
        if (!previewUrl)
            return null;
        if (isCancelled())
            return null;
        const { sprite, vtt } = await extractFramesFromPreview(previewUrl);
        if (isCancelled())
            return null;
        const vttBlob = new Blob([vtt], { type: 'text/vtt' });
        const result = await identifySpritePerformers(sprite, vttBlob, onProgress);
        const data = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a[0];
        if (data === null || data === void 0 ? void 0 : data.error) {
            console.warn('[Visage] preview identification error:', data.error);
            return null;
        }
        return hasPerformers(data) ? data : null;
    }

    const React$e = window.PluginApi.React;
    const { useCallback: useCallback$5 } = React$e;
    function SceneScanButton({ menuItem }) {
        useLocale();
        const { state, setLoading, setSpriteResult, showSpriteModal, setDetectionMode, setScanProgress, showWarning, showError, showHealthBanner } = useVisage();
        const loadingKey = 'face-detection';
        const isLoading = state.loading[loadingKey] || false;
        const scanScene = useCallback$5(async () => {
            resetCancelled();
            try {
                setLoading(loadingKey, true);
                showSpriteModal(true);
                const [scenario, sceneId] = getScenarioAndID();
                if (scenario !== 'scenes') {
                    showSpriteModal(false);
                    return;
                }
                setDetectionMode('sprite');
                const spriteData = await trySprite(sceneId, (p, d) => setScanProgress(p, d));
                if (isCancelled())
                    return;
                if (spriteData) {
                    setSpriteResult(spriteData);
                    return;
                }
                setDetectionMode('preview');
                const previewData = await tryPreview(sceneId, (p, d) => setScanProgress(p, d));
                if (isCancelled())
                    return;
                if (previewData) {
                    setSpriteResult(previewData);
                    return;
                }
                showSpriteModal(false);
                const spriteUrl = await getUrlSprite(sceneId);
                const previewUrl = await getUrlPreview(sceneId);
                if (!spriteUrl && !previewUrl) {
                    showWarning(t('scene.noSprite'));
                }
                else {
                    showWarning(t('scene.noFaces'));
                }
            }
            catch (error) {
                console.error('[Visage] scene scan error:', error);
                showSpriteModal(false);
                const message = getErrorMessage(error);
                if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
                    showHealthBanner(t('scene.healthBanner'));
                }
                else {
                    showError(t('scene.failed', { error: message }));
                }
            }
            finally {
                setLoading(loadingKey, false);
            }
        }, [setLoading, setSpriteResult, showSpriteModal, setDetectionMode, setScanProgress, showWarning, showError, showHealthBanner]);
        if (menuItem) {
            return React$e.createElement('a', {
                href: '#',
                className: 'bg-secondary text-white dropdown-item',
                role: 'button',
                title: t('scene.menuItemTitle'),
                onClick: (e) => { e.preventDefault(); closeDropdown(); scanScene(); },
            }, t('scene.wholeScene'));
        }
        return React$e.createElement('button', {
            id: 'visage-scene-scan',
            className: `visage-toolbar-button${isLoading ? ' visage-scanning' : ''}`,
            onClick: scanScene,
            disabled: isLoading,
            title: t('scene.wholeScene'),
        }, React$e.createElement('svg', {
            width: 20, height: 20, viewBox: '0 0 24 24',
            fill: 'currentColor', xmlns: 'http://www.w3.org/2000/svg',
        }, React$e.createElement('path', {
            d: 'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z',
        })));
    }

    const React$d = window.PluginApi.React;
    const { useState: useState$4, useEffect: useEffect$6, useCallback: useCallback$4 } = React$d;
    function useKeyboardNav({ faceCount, getPerformerCount, onAssign, enabled }) {
        const [selectedFaceIndex, setSelectedFaceIndex] = useState$4(0);
        const [selectedCardIndex, setSelectedCardIndex] = useState$4(0);
        const [hasNavigated, setHasNavigated] = useState$4(false);
        const handleKeydown = useCallback$4((event) => {
            if (!enabled)
                return;
            const performerCount = getPerformerCount(selectedFaceIndex);
            switch (event.key) {
                case 'ArrowRight':
                    event.preventDefault();
                    setHasNavigated(true);
                    if (selectedCardIndex < performerCount - 1) {
                        setSelectedCardIndex(selectedCardIndex + 1);
                    }
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    setHasNavigated(true);
                    if (selectedCardIndex > 0) {
                        setSelectedCardIndex(selectedCardIndex - 1);
                    }
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    setHasNavigated(true);
                    if (selectedFaceIndex < faceCount - 1) {
                        setSelectedFaceIndex(selectedFaceIndex + 1);
                        setSelectedCardIndex(0);
                    }
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setHasNavigated(true);
                    if (selectedFaceIndex > 0) {
                        setSelectedFaceIndex(selectedFaceIndex - 1);
                        setSelectedCardIndex(0);
                    }
                    break;
                case 'Enter':
                case ' ':
                    event.preventDefault();
                    setHasNavigated(true);
                    onAssign(selectedFaceIndex, selectedCardIndex);
                    break;
            }
        }, [enabled, faceCount, selectedFaceIndex, selectedCardIndex, getPerformerCount, onAssign]);
        useEffect$6(() => {
            if (!enabled)
                return;
            document.addEventListener('keydown', handleKeydown);
            return () => document.removeEventListener('keydown', handleKeydown);
        }, [handleKeydown, enabled]);
        return {
            selectedFaceIndex,
            selectedCardIndex,
            hasNavigated,
            setSelectedFaceIndex,
            setSelectedCardIndex,
        };
    }

    const React$c = window.PluginApi.React;
    const { useEffect: useEffect$5 } = React$c;
    const FOCUSABLE_SELECTOR = 'a, button, input, [tabindex]:not([tabindex="-1"])';
    function useModalShell(onClose, active = true) {
        const ref = React$c.useRef(null);
        useEffect$5(() => {
            if (!active)
                return;
            const container = ref.current;
            if (!container)
                return;
            const previouslyFocused = document.activeElement;
            const focusFirst = () => {
                const focusables = container.querySelectorAll(FOCUSABLE_SELECTOR);
                if (focusables.length > 0) {
                    focusables[0].focus();
                }
                else {
                    if (!container.hasAttribute('tabindex')) {
                        container.setAttribute('tabindex', '-1');
                    }
                    container.focus();
                }
            };
            focusFirst();
            const handleKeyDown = (e) => {
                if (!ref.current)
                    return;
                if (e.key === 'Escape') {
                    e.preventDefault();
                    onClose();
                    return;
                }
                if (e.key === 'Tab') {
                    const focusables = Array.from(ref.current.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => !el.hasAttribute('disabled'));
                    if (focusables.length === 0) {
                        e.preventDefault();
                        return;
                    }
                    const first = focusables[0];
                    const last = focusables[focusables.length - 1];
                    const current = document.activeElement;
                    if (e.shiftKey) {
                        if (current === first || !ref.current.contains(current)) {
                            e.preventDefault();
                            last.focus();
                        }
                    }
                    else {
                        if (current === last || !ref.current.contains(current)) {
                            e.preventDefault();
                            first.focus();
                        }
                    }
                }
            };
            document.addEventListener('keydown', handleKeyDown, true);
            return () => {
                document.removeEventListener('keydown', handleKeyDown, true);
                if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                    previouslyFocused.focus();
                }
            };
        }, [active, onClose]);
        return ref;
    }

    const React$b = window.PluginApi.React;
    const { useCallback: useCallback$3 } = React$b;
    function useSmoothLoad(duration = 400) {
        return useCallback$3((node) => {
            if (!node)
                return;
            node.style.opacity = '0';
            node.style.transition = `opacity ${duration}ms ease`;
            if (node.complete && node.naturalWidth > 0) {
                node.style.opacity = '1';
                return;
            }
            node.addEventListener('load', () => {
                node.style.opacity = '1';
            }, { once: true });
            node.addEventListener('error', () => {
                node.style.opacity = '1';
            }, { once: true });
        }, [duration]);
    }

    const React$a = window.PluginApi.React;
    const SOURCE_BASE_URLS = {
        stashdb: 'https://stashdb.org',
        javstash: 'https://javstash.org',
        fansdb: 'https://fansdb.cc',
    };
    const performerUrl = (id, source) => {
        const base = SOURCE_BASE_URLS[(source || '').toLowerCase()] || SOURCE_BASE_URLS.stashdb;
        return `${base}/performers/${id}`;
    };
    const imgSrc$1 = (value, fallback = '') => {
        if (!value)
            return fallback;
        if (value.startsWith('data:') || /^https?:\/\//.test(value))
            return value;
        return `data:image/jpeg;base64,${value}`;
    };
    const GENDER_CONFIG = {
        MALE: { symbol: '♂', label: 'gender.male', className: 'visage-gender-male' },
        FEMALE: { symbol: '♀', label: 'gender.female', className: 'visage-gender-female' },
        TRANSGENDER_MALE: { symbol: '⚧', label: 'gender.transMale', className: 'visage-gender-transgender-male' },
        TRANSGENDER_FEMALE: { symbol: '⚧', label: 'gender.transFemale', className: 'visage-gender-transgender-female' },
        NON_BINARY: { symbol: '⚦', label: 'gender.nonBinary', className: 'visage-gender-non-binary' },
        INTERSEX: { symbol: '⚥', label: 'gender.intersex', className: 'visage-gender-intersex' },
    };
    const genderBadge = (gender) => {
        if (!gender)
            return null;
        const cfg = GENDER_CONFIG[gender];
        if (!cfg)
            return null;
        const label = t(cfg.label);
        return React$a.createElement('span', {
            className: `visage-gender-badge ${cfg.className}`,
            title: label,
            'aria-label': label,
        }, cfg.symbol);
    };
    function PerformerCard({ performer, isLoading, isKeyboardSelected, isSelected, onToggle, onQuickAdd }) {
        useLocale();
        const imgRef = useSmoothLoad();
        const confidence = performer.confidence || 0;
        const confidenceClass = confidence >= 90
            ? 'visage-confidence-excellent'
            : confidence >= 70
                ? 'visage-confidence-good'
                : 'visage-confidence-uncertain';
        const confidenceLabel = confidence >= 90
            ? t('card.excellent')
            : confidence >= 70
                ? t('card.good')
                : t('card.uncertain');
        const cardClasses = [
            'visage-performer-card',
            isLoading ? 'visage-loading' : '',
            isKeyboardSelected ? 'visage-keyboard-selected' : '',
            isSelected ? 'visage-performer-selected' : '',
        ].filter(Boolean).join(' ');
        function handleClick(e) {
            if (isLoading)
                return;
            if ((e.shiftKey || e.ctrlKey || e.metaKey) && onQuickAdd) {
                e.preventDefault();
                e.stopPropagation();
                onQuickAdd(performer.id, performer.source);
            }
            else {
                onToggle(performer.id);
            }
        }
        function handleKeyDown(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(e);
            }
        }
        return React$a.createElement('div', {
            className: cardClasses,
            'data-performer-id': performer.id,
            onClick: handleClick,
            onKeyDown: handleKeyDown,
            role: 'button',
            tabIndex: isKeyboardSelected ? 0 : -1,
            'aria-pressed': isSelected,
            'aria-label': t(isSelected ? 'card.deselect' : 'card.select', { name: performer.name }),
        }, 
        // Portrait image area
        React$a.createElement('div', { className: 'visage-card-portrait' }, React$a.createElement('img', {
            ref: imgRef,
            className: 'visage-portrait-img',
            alt: performer.name,
            src: imgSrc$1(performer.image),
        }), 
        // Gradient overlay
        React$a.createElement('div', { className: 'visage-card-img-overlay' }), 
        // Confidence strip at bottom edge
        React$a.createElement('div', {
            className: `visage-confidence-strip ${confidenceClass}`,
            style: { width: `${confidence}%` },
        }), 
        // Country flag
        performer.country && React$a.createElement('span', {
            className: `visage-country-flag fi fi-${performer.country.toLowerCase()}`,
        }), 
        // Source badge
        performer.source && React$a.createElement('span', {
            className: `visage-source-badge visage-source-${performer.source}`,
            title: performer.source,
        }, performer.source[0].toUpperCase()), 
        // Gender badge
        genderBadge(performer.gender), 
        // Selected check badge
        isSelected && React$a.createElement('div', { className: 'visage-card-check-badge' }, React$a.createElement('svg', {
            width: 16, height: 16, viewBox: '0 0 24 24',
            fill: 'none', stroke: 'currentColor', strokeWidth: 3,
        }, React$a.createElement('polyline', { points: '20 6 9 17 4 12' }))), 
        // Text overlay: name + confidence
        React$a.createElement('div', { className: 'visage-card-meta' }, React$a.createElement('a', {
            href: performerUrl(performer.id, performer.source),
            title: t('card.openOn', { source: (performer.source || 'stashdb').toLowerCase() }),
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'visage-performer-name',
            onClick: (e) => e.stopPropagation(),
        }, performer.name), React$a.createElement('div', { className: 'visage-card-stats' }, React$a.createElement('div', { className: `visage-confidence-dot ${confidenceClass}` }), React$a.createElement('span', { className: 'visage-confidence-pct' }, `${confidence}%`), React$a.createElement('span', { className: 'visage-confidence-lbl' }, confidenceLabel)))));
    }

    const React$9 = window.PluginApi.React;
    const { useEffect: useEffect$4, useState: useState$3 } = React$9;
    const CLOUD_URL = VISAGE_API_URL;
    const LOCAL_DEFAULT = 'http://localhost:7860';
    function hostOf(url) {
        try {
            return new URL(url).hostname;
        }
        catch (_a) {
            return '';
        }
    }
    function isLocalHost(url) {
        const host = hostOf(url);
        return host === 'localhost' || host === '127.0.0.1' || host === '::1';
    }
    const TEST_FEEDBACK = {
        reachable: 'backendSettings.feedback.reachable',
        degraded: 'backendSettings.feedback.degraded',
        unreachable: 'backendSettings.feedback.unreachable',
    };
    function SettingsCloseButton({ onClick }) {
        useLocale();
        return React$9.createElement('button', {
            className: 'visage-backend-settings-close',
            onClick,
            'aria-label': t('backendSettings.closeAria'),
        }, React$9.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React$9.createElement('line', { x1: 18, y1: 6, x2: 6, y2: 18 }), React$9.createElement('line', { x1: 6, y1: 6, x2: 18, y2: 18 })));
    }
    function SettingsButton({ onClick }) {
        useLocale();
        return React$9.createElement('button', {
            className: 'visage-modal-settings',
            onClick,
            'aria-label': t('backendSettings.backendAria'),
            title: t('backendSettings.changeBackend'),
        }, React$9.createElement('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React$9.createElement('path', { d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' }), React$9.createElement('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' })));
    }
    function BackendSettings({ onClose, initialMode }) {
        useLocale();
        const current = getApiEndpoint();
        const [mode, setMode] = useState$3(() => {
            if (initialMode)
                return initialMode;
            try {
                return isLocalEndpoint(current) ? 'local' : 'cloud';
            }
            catch (_a) {
                return 'cloud';
            }
        });
        const [url, setUrl] = useState$3(() => {
            if (initialMode === 'local')
                return isLocalEndpoint(current) ? current : LOCAL_DEFAULT;
            return current || LOCAL_DEFAULT;
        });
        const [testStatus, setTestStatus] = useState$3(null);
        const [stashStatus, setStashStatus] = useState$3(null);
        const [syncStatus, setSyncStatus] = useState$3('idle');
        const [syncError, setSyncError] = useState$3('');
        useEffect$4(() => {
            function onKey(e) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                }
            }
            document.addEventListener('keydown', onKey, true);
            return () => document.removeEventListener('keydown', onKey, true);
        }, [onClose]);
        useEffect$4(() => {
            if (mode !== 'local') {
                setStashStatus(null);
                return;
            }
            let cancelled = false;
            const timer = setTimeout(() => {
                getStashStatus(url.trim()).then((status) => {
                    if (cancelled)
                        return;
                    if (status && status.stash_url) {
                        setStashStatus({
                            configured: true,
                            lastSyncAt: status.last_sync_at,
                            performerCount: status.performer_count,
                            linkedCount: status.linked_count,
                        });
                    }
                    else {
                        setStashStatus({ configured: false, lastSyncAt: null, performerCount: 0, linkedCount: 0 });
                    }
                }).catch(() => {
                    if (!cancelled)
                        setStashStatus(null);
                });
            }, 300);
            return () => { cancelled = true; clearTimeout(timer); };
        }, [mode, url]);
        function selectMode(next) {
            setMode(next);
            if (next === 'cloud') {
                setUrl(CLOUD_URL);
            }
            else {
                let cur;
                try {
                    cur = getApiEndpoint();
                }
                catch (_a) {
                    cur = LOCAL_DEFAULT;
                }
                setUrl(isLocalEndpoint(cur) ? cur : LOCAL_DEFAULT);
            }
            setTestStatus(null);
        }
        async function handleTest() {
            setTestStatus('testing');
            let status = 'unreachable';
            try {
                const health = await checkHealth(url.trim());
                if (health === null) {
                    status = 'unreachable';
                }
                else if (health.models_loaded === false || health.status !== 'ready') {
                    status = 'degraded';
                }
                else {
                    status = 'reachable';
                }
            }
            catch (_a) {
                status = 'unreachable';
            }
            setTestStatus(status);
        }
        function handleSave() {
            setApiEndpoint(url.trim());
            onClose();
        }
        async function handleSync() {
            setSyncStatus('syncing');
            setSyncError('');
            try {
                const eventId = await triggerStashSync(url.trim());
                const sseUrl = `${url.trim()}/api/stash/sync/${eventId}`;
                const evtSource = new EventSource(sseUrl);
                evtSource.addEventListener('complete', () => {
                    evtSource.close();
                    setSyncStatus('done');
                    // Re-fetch status to update counts
                    getStashStatus(url.trim()).then((s) => {
                        if (s && s.stash_url) {
                            setStashStatus({ configured: true, lastSyncAt: s.last_sync_at, performerCount: s.performer_count, linkedCount: s.linked_count });
                        }
                    });
                    setTimeout(() => setSyncStatus('idle'), 2000);
                });
                evtSource.addEventListener('error', (e) => {
                    evtSource.close();
                    let data = null;
                    try {
                        data = e.data ? JSON.parse(e.data) : null;
                    }
                    catch ( /* ignore */_a) { /* ignore */ }
                    setSyncStatus('error');
                    setSyncError((data === null || data === void 0 ? void 0 : data.error) || t('backendSettings.sync.error'));
                });
                evtSource.onerror = () => {
                    evtSource.close();
                    setSyncStatus('error');
                    setSyncError(t('backendSettings.sync.connectionLost'));
                };
            }
            catch (err) {
                if (err.message === 'already_running') {
                    setSyncStatus('already_running');
                }
                else {
                    setSyncStatus('error');
                    setSyncError(err.message || t('backendSettings.sync.error'));
                }
            }
        }
        const statusText = testStatus === 'testing'
            ? t('backendSettings.testing')
            : (testStatus ? t(TEST_FEEDBACK[testStatus]) : '');
        const showNonLocalhostWarn = mode === 'local' && url.trim() !== '' && !isLocalHost(url.trim());
        return React$9.createElement('div', {
            className: 'visage-backend-settings-backdrop',
            onClick: (e) => { if (e.target === e.currentTarget)
                onClose(); },
        }, React$9.createElement('div', {
            className: 'visage-backend-settings',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': t('backendSettings.backendAria'),
        }, React$9.createElement('div', { className: 'visage-backend-settings-header' }, React$9.createElement('h2', { className: 'visage-backend-settings-title' }, t('backendSettings.title')), React$9.createElement(SettingsCloseButton, { onClick: onClose })), React$9.createElement('div', { className: 'visage-backend-settings-body' }, React$9.createElement('div', { className: 'visage-backend-settings-field' }, React$9.createElement('span', { className: 'visage-backend-settings-label' }, t('backendSettings.backendLabel')), React$9.createElement('div', { className: 'visage-backend-settings-seg' }, React$9.createElement('button', {
            className: `visage-backend-seg-opt${mode === 'local' ? ' visage-backend-seg-active' : ''}`,
            onClick: () => selectMode('local'),
        }, t('backendSettings.local')), React$9.createElement('button', {
            className: `visage-backend-seg-opt${mode === 'cloud' ? ' visage-backend-seg-active' : ''}`,
            onClick: () => selectMode('cloud'),
        }, t('backendSettings.cloud')))), mode === 'cloud' && React$9.createElement('div', { className: 'visage-backend-settings-note' }, t('backendSettings.cloudNote')), mode === 'cloud' && React$9.createElement('p', { className: 'visage-backend-settings-hint' }, t('backendSettings.hintPrefix'), React$9.createElement('a', {
            className: 'visage-backend-settings-hint-link',
            href: 'https://www.patreon.com/cw/cc12340',
            target: '_blank',
            rel: 'noopener noreferrer',
        }, t('backendSettings.hintLink')), '.'), React$9.createElement('div', { className: 'visage-backend-settings-field' }, React$9.createElement('label', { className: 'visage-backend-settings-label', htmlFor: 'visage-backend-url' }, t('backendSettings.urlLabel')), mode === 'local'
            ? React$9.createElement('input', {
                id: 'visage-backend-url',
                className: 'visage-backend-settings-input',
                type: 'text',
                value: url,
                onChange: (e) => { setUrl(e.target.value); setTestStatus(null); },
                placeholder: LOCAL_DEFAULT,
            })
            : React$9.createElement('div', { className: 'visage-backend-settings-cloud-url' }, url)), showNonLocalhostWarn && React$9.createElement('div', { className: 'visage-backend-settings-warn' }, t('backendSettings.csp1'), React$9.createElement('code', null, 'http://localhost:7860'), t('backendSettings.csp2'), React$9.createElement('code', null, 'connect-src'), t('backendSettings.csp3'), React$9.createElement('code', null, 'visage.yml'), t('backendSettings.csp4'), React$9.createElement('code', null, 'visage.yml'), t('backendSettings.csp5')), React$9.createElement('div', {
            className: `visage-backend-settings-status${testStatus ? ` visage-backend-${testStatus}` : ''}`,
            role: 'status',
        }, statusText), (stashStatus === null || stashStatus === void 0 ? void 0 : stashStatus.configured) && React$9.createElement('div', { className: 'visage-backend-settings-sync' }, React$9.createElement('div', { className: 'visage-backend-settings-field' }, React$9.createElement('span', { className: 'visage-backend-settings-label' }, t('backendSettings.sync.title')), React$9.createElement('div', { className: 'visage-sync-info' }, React$9.createElement('div', { className: 'visage-sync-last' }, stashStatus.lastSyncAt
            ? t('backendSettings.sync.lastSynced', { time: new Date(stashStatus.lastSyncAt).toLocaleString() })
            : t('backendSettings.sync.neverSynced')), React$9.createElement('div', { className: 'visage-sync-count' }, t('backendSettings.sync.performers', { count: String(stashStatus.performerCount) }))), React$9.createElement('div', { className: 'visage-sync-actions' }, React$9.createElement('button', {
            className: `visage-btn visage-btn-secondary${syncStatus === 'syncing' ? ' visage-syncing' : ''}`,
            onClick: handleSync,
            disabled: syncStatus === 'syncing',
        }, syncStatus === 'syncing'
            ? t('backendSettings.sync.syncing')
            : syncStatus === 'done'
                ? t('backendSettings.sync.done')
                : t('backendSettings.sync.button')), syncStatus === 'already_running' && React$9.createElement('span', { className: 'visage-sync-note' }, t('backendSettings.sync.alreadyRunning')), syncStatus === 'error' && React$9.createElement('span', { className: 'visage-sync-error' }, syncError))))), React$9.createElement('div', { className: 'visage-backend-settings-actions' }, React$9.createElement('button', {
            className: 'visage-btn visage-btn-secondary',
            onClick: handleTest,
            disabled: testStatus === 'testing',
        }, testStatus === 'testing' ? t('backendSettings.testingShort') : t('backendSettings.testConnection')), React$9.createElement('button', {
            className: 'visage-btn visage-btn-secondary',
            onClick: onClose,
        }, t('backendSettings.cancel')), React$9.createElement('button', {
            className: 'visage-btn visage-btn-primary',
            onClick: handleSave,
        }, t('backendSettings.save')))));
    }

    const React$8 = window.PluginApi.React;
    /**
     * Passive indicator of the resolved active backend, shown in the result modal
     * header next to the settings gear. Never guesses Local: on any error it falls
     * back to showing Cloud (Hugging Face). Not interactive - the adjacent gear
     * button opens the backend settings.
     */
    function BackendBadge() {
        useLocale();
        let isLocal;
        try {
            isLocal = isLocalEndpoint(getApiEndpoint());
        }
        catch (_a) {
            isLocal = false;
        }
        const label = isLocal ? t('badge.local') : t('badge.cloud');
        const variant = isLocal ? 'local' : 'cloud';
        const title = t('badge.title', { label });
        return React$8.createElement('span', {
            className: `visage-backend-badge visage-backend-${variant}`,
            'aria-label': title,
            title,
        }, label);
    }

    const React$7 = window.PluginApi.React;
    const { useCallback: useCallback$2, useEffect: useEffect$3, useRef: useRef$3, useState: useState$2 } = React$7;
    const imgSrc = (value, fallback = '') => {
        if (!value)
            return fallback;
        if (value.startsWith('data:') || /^https?:\/\//.test(value))
            return value;
        return `data:image/jpeg;base64,${value}`;
    };
    function FaceMatchModal() {
        var _a, _b, _c, _d, _e;
        useLocale();
        const { state, setLoading, showMatchModal, showError, showSuccess, showWarning, openSettings } = useVisage();
        const { matches: rawMatches, loading: loadingState } = state;
        const matches = Array.isArray(rawMatches) ? rawMatches : [];
        const [activeFaceIndex, setActiveFaceIndex] = React$7.useState(0);
        const [selectedPerformer, setSelectedPerformer] = useState$2(new Map());
        const [adding, setAdding] = useState$2(false);
        const [visible, setVisible] = useState$2(false);
        const [sceneStashIds, setSceneStashIds] = useState$2(new Set());
        const [stashboxStatus, setStashboxStatus] = useState$2(null);
        // null means "auto": derive the threshold from the matches whenever they arrive.
        // Kept derived (not seeded into state on mount) because the modal opens before
        // the search returns, when `matches` is still empty. Not persisted: every search
        // recalibrates, and the slider only overrides the current result set.
        const [confidenceOverride, setConfidenceOverride] = useState$2(null);
        const [thresholdFor, setThresholdFor] = useState$2(rawMatches);
        if (thresholdFor !== rawMatches) {
            setThresholdFor(rawMatches);
            setConfidenceOverride(null);
        }
        // Threshold low enough that every face keeps at least three performers:
        // take each face's 3rd-best score and use the smallest of those.
        const autoConfidence = React$7.useMemo(() => {
            let threshold = Infinity;
            for (const face of matches) {
                const scores = face.performers
                    .map(p => p.confidence || 0)
                    .filter(c => c > 0)
                    .sort((a, b) => b - a);
                if (scores.length === 0)
                    continue;
                threshold = Math.min(threshold, scores[Math.min(2, scores.length - 1)]);
            }
            return Number.isFinite(threshold) ? threshold : 0;
        }, [matches]);
        const minConfidence = confidenceOverride !== null && confidenceOverride !== void 0 ? confidenceOverride : autoConfidence;
        const close = useCallback$2(() => {
            setVisible(false);
            setTimeout(() => showMatchModal(false), 300);
        }, []);
        const modalRef = useModalShell(close, state.showMatchModal);
        const abortRef = useRef$3(false);
        useEffect$3(() => {
            requestAnimationFrame(() => setVisible(true));
            const [scenario, id] = getScenarioAndID();
            if (scenario === 'scenes') {
                (async () => {
                    var _a, _b, _c, _d;
                    try {
                        const GQL = window.PluginApi.GQL;
                        const client = window.PluginApi.utils.StashService.getClient();
                        const res = await client.query({
                            query: GQL.FindSceneDocument,
                            variables: { id },
                        });
                        const stashIds = new Set();
                        for (const p of (_c = (_b = (_a = res.data) === null || _a === void 0 ? void 0 : _a.findScene) === null || _b === void 0 ? void 0 : _b.performers) !== null && _c !== void 0 ? _c : []) {
                            for (const s of (_d = p.stash_ids) !== null && _d !== void 0 ? _d : []) {
                                if (s.stash_id)
                                    stashIds.add(s.stash_id);
                            }
                        }
                        if (!abortRef.current)
                            setSceneStashIds(stashIds);
                    }
                    catch (_e) { }
                })();
            }
            (async () => {
                try {
                    const status = await getStashboxStatus();
                    if (!abortRef.current)
                        setStashboxStatus(status);
                }
                catch (_a) {
                    if (!abortRef.current)
                        setStashboxStatus('empty');
                }
            })();
            return () => { abortRef.current = true; };
        }, []);
        const getPerformerCount = useCallback$2((faceIndex) => {
            var _a;
            const face = matches[faceIndex];
            return ((_a = face === null || face === void 0 ? void 0 : face.performers) === null || _a === void 0 ? void 0 : _a.filter((p) => (p.confidence || 0) >= minConfidence).length) || 0;
        }, [matches, minConfidence]);
        const handleSelectFromKeyboard = useCallback$2((faceIndex, cardIndex) => {
            const face = matches[faceIndex];
            if (!face)
                return;
            const performer = face.performers[cardIndex];
            if (performer && !loadingState[`add-performer-${performer.id}`]) {
                selectPerformer(faceIndex, performer.id);
            }
        }, [matches, loadingState]);
        const handleQuickAddCard = useCallback$2(async (stashId, source) => {
            if (adding || sceneStashIds.has(stashId))
                return;
            const [scenario] = getScenarioAndID();
            setAdding(true);
            try {
                const ok = await addSinglePerformer(stashId, source);
                if (ok) {
                    showSuccess(t('faceMatch.toast.added', { target: scenario === 'scenes' ? 'scene' : 'image' }));
                    close();
                }
            }
            catch (error) {
                console.warn('[Visage] quick-add error:', error);
                showError(t('faceMatch.toast.addError', { error: getErrorMessage(error) }));
            }
            finally {
                setAdding(false);
            }
        }, [adding, sceneStashIds]);
        const { selectedFaceIndex, selectedCardIndex, hasNavigated } = useKeyboardNav({
            faceCount: matches.length,
            getPerformerCount,
            onAssign: handleSelectFromKeyboard,
            enabled: state.showMatchModal,
        });
        useEffect$3(() => {
            setActiveFaceIndex(selectedFaceIndex);
        }, [selectedFaceIndex]);
        function selectPerformer(faceIndex, stashId) {
            if (sceneStashIds.has(stashId))
                return;
            setSelectedPerformer(prev => {
                var _a, _b;
                const next = new Map(prev);
                const current = next.get(faceIndex);
                if ((current === null || current === void 0 ? void 0 : current.id) === stashId) {
                    next.delete(faceIndex);
                }
                else {
                    const face = matches[faceIndex];
                    const source = (_b = (_a = face === null || face === void 0 ? void 0 : face.performers) === null || _a === void 0 ? void 0 : _a.find((p) => p.id === stashId)) === null || _b === void 0 ? void 0 : _b.source;
                    next.set(faceIndex, { id: stashId, source });
                }
                return next;
            });
        }
        async function addSinglePerformer(stashId, source) {
            const [scenario, scenarioId] = getScenarioAndID();
            const loadingKey = `add-performer-${stashId}`;
            setLoading(loadingKey, true);
            try {
                if (source === 'stash') {
                    await addPerformerToContent(scenario, scenarioId, stashId);
                    return true;
                }
                let performers = await getPerformers(stashId);
                let performerId = stashId;
                if (performers.length === 0) {
                    const performer = await getPerformerDataFromStashID(stashId, source);
                    if (!performer)
                        return false;
                    const { performerId: pid } = await createOrGetPerformer(performer, stashId, source);
                    performerId = pid;
                }
                else {
                    performerId = performers[0].id;
                }
                await addPerformerToContent(scenario, scenarioId, performerId);
                return true;
            }
            finally {
                setLoading(loadingKey, false);
            }
        }
        async function addConfirmed() {
            const entries = Array.from(selectedPerformer.values()).filter(e => !sceneStashIds.has(e.id));
            if (entries.length === 0) {
                close();
                return;
            }
            const [scenario] = getScenarioAndID();
            setAdding(true);
            let addedCount = 0;
            try {
                for (const { id: stashId, source: sourceName } of entries) {
                    const ok = await addSinglePerformer(stashId, sourceName);
                    if (ok)
                        addedCount++;
                }
                if (addedCount === 0) {
                    const msg = stashboxStatus === 'empty'
                        ? t('faceMatch.toast.noStashbox', { url: STASHBOX_DOCS_URL })
                        : stashboxStatus === 'mismatch'
                            ? t('faceMatch.toast.noProvider')
                            : t('faceMatch.toast.configureProvider');
                    showWarning(msg);
                    return;
                }
                showSuccess(t('faceMatch.toast.addedMultiple', { count: addedCount, s: addedCount !== 1 ? 's' : '', target: scenario === 'scenes' ? 'scene' : 'image' }));
                close();
            }
            catch (error) {
                console.warn('[Visage] addConfirmed error:', error);
                showError(t('faceMatch.toast.addError', { error: getErrorMessage(error) }));
            }
            finally {
                setAdding(false);
            }
        }
        function hasHighConfidenceMatches() {
            return matches.some((face) => face.performers.some(p => { var _a; return p.confidence >= 90 && !sceneStashIds.has(p.id) && ((_a = selectedPerformer.get(activeFaceIndex)) === null || _a === void 0 ? void 0 : _a.id) !== p.id; }));
        }
        async function assignConfidentMatches() {
            for (let i = 0; i < matches.length; i++) {
                const face = matches[i];
                const bestMatch = face.performers
                    .filter(p => { var _a; return p.confidence >= 90 && !sceneStashIds.has(p.id) && ((_a = selectedPerformer.get(i)) === null || _a === void 0 ? void 0 : _a.id) !== p.id; })
                    .sort((a, b) => b.confidence - a.confidence)[0];
                if (bestMatch) {
                    selectPerformer(i, bestMatch.id);
                }
            }
        }
        const isSearching = loadingState['face-search'] && matches.length === 0;
        const activeFace = matches[activeFaceIndex];
        const selectedId = (_a = selectedPerformer.get(activeFaceIndex)) === null || _a === void 0 ? void 0 : _a.id;
        const inSceneIdx = (_c = (_b = activeFace === null || activeFace === void 0 ? void 0 : activeFace.performers) === null || _b === void 0 ? void 0 : _b.findIndex((p) => sceneStashIds.has(p.id))) !== null && _c !== void 0 ? _c : -1;
        const previewIdx = hasNavigated
            ? selectedCardIndex
            : selectedId
                ? (_e = (_d = activeFace === null || activeFace === void 0 ? void 0 : activeFace.performers) === null || _d === void 0 ? void 0 : _d.findIndex((p) => p.id === selectedId)) !== null && _e !== void 0 ? _e : 0
                : inSceneIdx >= 0 ? inSceneIdx : 0;
        return React$7.createElement('div', {
            className: `visage-modal-backdrop ${visible ? 'visage-visible' : ''}`,
            onClick: (e) => { if (e.target === e.currentTarget)
                close(); },
        }, React$7.createElement('div', {
            ref: modalRef,
            className: `visage-modal ${visible ? 'visage-visible' : ''}`,
            role: 'dialog',
            'aria-modal': 'true',
            tabIndex: -1,
        }, React$7.createElement('div', { className: 'visage-modal-header' }, React$7.createElement('div', { className: 'visage-modal-title' }, React$7.createElement('h2', null, t('faceMatch.title')), !isSearching && React$7.createElement('span', { className: 'visage-match-count' }, t('faceMatch.facesSelected', { faces: matches.length, selected: selectedPerformer.size }) + (sceneStashIds.size > 0 ? ' ' + t('faceMatch.inScene', { count: sceneStashIds.size }) : ''))), React$7.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, React$7.createElement(BackendBadge, null), React$7.createElement(SettingsButton, { onClick: openSettings }), React$7.createElement('button', {
            className: 'visage-modal-close',
            onClick: close,
            'aria-label': t('faceMatch.close'),
        }, React$7.createElement('svg', {
            width: 20, height: 20, viewBox: '0 0 24 24',
            fill: 'none', stroke: 'currentColor', strokeWidth: 2,
        }, React$7.createElement('line', { x1: 18, y1: 6, x2: 6, y2: 18 }), React$7.createElement('line', { x1: 6, y1: 6, x2: 18, y2: 18 }))))), stashboxStatus !== null && stashboxStatus !== 'configured' && React$7.createElement('div', { className: 'visage-stashbox-banner' }, React$7.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React$7.createElement('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }), React$7.createElement('line', { x1: 12, y1: 9, x2: 12, y2: 13 }), React$7.createElement('line', { x1: 12, y1: 17, x2: 12.01, y2: 17 })), React$7.createElement('span', { className: 'visage-stashbox-banner-text' }, React$7.createElement('strong', null, stashboxStatus === 'empty' ? t('faceMatch.stashboxMissing') : t('faceMatch.stashboxWrongName')), stashboxStatus === 'empty'
            ? t('faceMatch.stashboxMissingBody')
            : t('faceMatch.stashboxWrongNameBody'), React$7.createElement('a', { href: STASHBOX_DOCS_URL, target: '_blank', rel: 'noopener noreferrer' }, t('faceMatch.learnMore')))), isSearching
            ? React$7.createElement('div', { className: 'visage-modal-loading' }, React$7.createElement('div', { className: 'visage-face-scan' }, React$7.createElement('span', { className: 'visage-face-scan-corner' }), React$7.createElement('span', { className: 'visage-face-scan-corner' }), React$7.createElement('span', { className: 'visage-face-scan-corner' }), React$7.createElement('span', { className: 'visage-face-scan-corner' }), React$7.createElement('svg', {
                viewBox: '0 0 100 120',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 1.5,
                strokeLinecap: 'round',
            }, React$7.createElement('path', { d: 'M50 7 C29 7 15 22 16 45 C16.5 57 20 65 24 71' }), React$7.createElement('path', { d: 'M50 7 C71 7 85 22 84 45 C83.5 57 80 65 76 71' }), React$7.createElement('path', { strokeWidth: 1.2, d: 'M50 15 C37 15 27 26 27 42' }), React$7.createElement('path', { strokeWidth: 1.2, d: 'M50 15 C63 15 73 26 73 42' }), React$7.createElement('path', { d: 'M27 42 C27 61 34 77 43 85 C46 88 54 88 57 85 C66 77 73 61 73 42' }), React$7.createElement('path', { d: 'M33 52 C36.5 55 42.5 55 46 52' }), React$7.createElement('path', { d: 'M54 52 C57.5 55 63.5 55 67 52' }), React$7.createElement('path', { strokeWidth: 1.2, d: 'M35 54.6 L33.8 57 M39.5 55.6 L39 58.2 M44 54.6 L45 57' }), React$7.createElement('path', { strokeWidth: 1.2, d: 'M56 54.6 L55 57 M60.5 55.6 L61 58.2 M65 54.6 L66.2 57' }), React$7.createElement('path', { strokeWidth: 1.2, d: 'M32 46 C36 43.6 43 43.6 47 46' }), React$7.createElement('path', { strokeWidth: 1.2, d: 'M53 46 C57 43.6 64 43.6 68 46' }), React$7.createElement('path', { strokeWidth: 1.2, d: 'M50 54 C50 60 49.4 63 48.8 65.2 C49.6 66.4 50.4 66.4 51.2 65.2' }), React$7.createElement('path', { d: 'M42 75 C45 72.5 48 73.8 50 74.8 C52 73.8 55 72.5 58 75 C55 79.5 45 79.5 42 75 Z' }), React$7.createElement('path', { strokeWidth: 1.2, d: 'M44.5 80.5 C47 82.5 53 82.5 55.5 80.5' }), React$7.createElement('path', { strokeWidth: 1.2, d: 'M42 87.5 C42 94 40.5 99 38 104' }), React$7.createElement('path', { strokeWidth: 1.2, d: 'M58 87.5 C58 94 59.5 99 62 104' }), ...([
                [25, 52], [75, 52], [35, 68], [65, 68], [60.5, 82],
            ].map(([cx, cy], i) => React$7.createElement('circle', {
                key: i, className: 'visage-face-scan-dot', cx, cy, r: i === 4 ? 1.5 : 1.8, stroke: 'none',
            })))), React$7.createElement('div', { className: 'visage-face-scan-beam' })), React$7.createElement('span', { className: 'visage-loading-label' }, t('faceMatch.scanning')))
            : React$7.createElement(React$7.Fragment, null, React$7.createElement('div', { className: 'visage-face-tabs' }, matches.map((face, idx) => {
                if (getPerformerCount(idx) === 0)
                    return null;
                return React$7.createElement('button', {
                    key: idx,
                    className: `visage-face-tab ${idx === activeFaceIndex ? 'visage-face-tab-active' : ''}`,
                    onClick: () => setActiveFaceIndex(idx),
                }, React$7.createElement('img', {
                    src: `data:image/jpg;base64,${face.image}`,
                    alt: t('faceMatch.faceAlt', { index: idx + 1 }),
                    className: 'visage-face-tab-image',
                }));
            })), React$7.createElement('div', { className: 'visage-sprite-toolbar', style: { padding: '0.5rem 1.5rem' } }, React$7.createElement('div', { className: 'visage-sprite-threshold' }, React$7.createElement('span', { className: 'visage-threshold-text' }, t('faceMatch.minConf')), React$7.createElement('input', {
                type: 'range', min: 0, max: 100, step: 5,
                value: minConfidence,
                onChange: (e) => {
                    const value = Number(e.target.value);
                    setConfidenceOverride(value);
                },
                title: t('faceMatch.minConfTitle', { percent: minConfidence }),
            }), React$7.createElement('span', { className: 'visage-sprite-threshold-label' }, `${minConfidence}%`))), React$7.createElement('div', { className: 'visage-modal-body' }, React$7.createElement('div', { className: 'visage-left-panel' }, activeFace && React$7.createElement(React$7.Fragment, null, React$7.createElement('div', null, React$7.createElement('span', { className: 'visage-section-label' }, t('faceMatch.detected')), React$7.createElement('div', { className: 'visage-detect-frame' }, React$7.createElement('img', {
                src: `data:image/jpg;base64,${activeFace.image}`,
                alt: t('faceMatch.detectedFaceAlt'),
                className: 'visage-detect-image',
            }))), activeFace.performers[previewIdx] && React$7.createElement(React$7.Fragment, null, React$7.createElement('div', { className: 'visage-vs-divider' }, t('faceMatch.vs')), React$7.createElement('div', null, React$7.createElement('span', { className: 'visage-section-label-name' }, activeFace.performers[previewIdx].name), React$7.createElement('div', { className: 'visage-match-frame' }, React$7.createElement('img', {
                src: imgSrc(activeFace.performers[previewIdx].image),
                alt: activeFace.performers[previewIdx].name,
                className: 'visage-match-image',
            })))))), React$7.createElement('div', { className: 'visage-right-panel' }, React$7.createElement('div', { className: 'visage-performer-grid' }, activeFace === null || activeFace === void 0 ? void 0 : activeFace.performers.filter((p) => (p.confidence || 0) >= minConfidence).map((performer, cardIdx) => {
                var _a;
                return React$7.createElement(PerformerCard, {
                    key: performer.id,
                    performer,
                    isLoading: loadingState[`add-performer-${performer.id}`] || false,
                    isKeyboardSelected: hasNavigated && selectedFaceIndex === activeFaceIndex && selectedCardIndex === cardIdx,
                    isSelected: sceneStashIds.has(performer.id) || ((_a = selectedPerformer.get(activeFaceIndex)) === null || _a === void 0 ? void 0 : _a.id) === performer.id,
                    onToggle: (stashId) => selectPerformer(activeFaceIndex, stashId),
                    onQuickAdd: handleQuickAddCard,
                });
            })))), React$7.createElement('div', { className: 'visage-modal-footer' }, React$7.createElement('div', { className: 'visage-footer-main' }, React$7.createElement('a', {
                className: 'visage-ext-patreon-btn',
                href: 'https://www.patreon.com/cw/cc12340',
                target: '_blank',
                rel: 'noopener noreferrer',
            }, React$7.createElement('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'currentColor' }, React$7.createElement('circle', { cx: 15, cy: 9, r: 7 }), React$7.createElement('rect', { x: 2, y: 2, width: 4, height: 20, rx: 1 })), t('faceMatch.supportPatreon')), React$7.createElement('div', { className: 'visage-progress-info' }, React$7.createElement('span', { className: 'visage-matches-assigned' }, selectedPerformer.size > 0
                ? t('faceMatch.ofSelected', { selected: selectedPerformer.size, total: matches.length })
                : sceneStashIds.size > 0
                    ? t('faceMatch.allInScene', { total: matches.length })
                    : t('faceMatch.clickToSelect', { total: matches.length })), React$7.createElement('div', { className: 'visage-keyboard-hints' }, React$7.createElement('kbd', null, '\u2191\u2193'), ' ' + t('faceMatch.kbSwitch') + ' \u2022 ', React$7.createElement('kbd', null, '\u2190\u2192'), ' ' + t('faceMatch.kbSelect') + ' \u2022 ', React$7.createElement('kbd', null, 'Enter'), ' ' + t('faceMatch.kbToggle') + ' \u2022 ', t('faceMatch.kbAddInstant'))), React$7.createElement('div', { className: 'visage-button-group' }, hasHighConfidenceMatches() && React$7.createElement('button', {
                className: 'visage-btn visage-btn-secondary',
                onClick: assignConfidentMatches,
            }, React$7.createElement('svg', {
                width: 16, height: 16, viewBox: '0 0 24 24',
                fill: 'none', stroke: 'currentColor', strokeWidth: 2,
            }, React$7.createElement('path', { d: 'M9 11l3 3 8-8' })), t('faceMatch.selectBest')), React$7.createElement('button', {
                className: 'visage-btn visage-btn-primary',
                onClick: addConfirmed,
                disabled: selectedPerformer.size === 0 || adding,
            }, adding ? t('faceMatch.adding') : t('faceMatch.done', { count: selectedPerformer.size }))))))));
    }

    function formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0)
            return '-:--';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function getConfidenceClass(confidence) {
        return confidence >= 90
            ? 'visage-confidence-excellent'
            : confidence >= 70
                ? 'visage-confidence-good'
                : 'visage-confidence-uncertain';
    }

    const React$6 = window.PluginApi.React;
    function ConfidenceRing({ confidence, confClass }) {
        const size = 46;
        const stroke = 4;
        const r = (size - stroke) / 2;
        const circumference = 2 * Math.PI * r;
        const offset = circumference * (1 - confidence / 100);
        return React$6.createElement('div', { className: 'visage-sprite-ring' }, React$6.createElement('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}` }, React$6.createElement('circle', {
            cx: size / 2, cy: size / 2, r,
            fill: 'none', stroke: 'rgba(255,255,255,0.08)', strokeWidth: stroke,
        }), React$6.createElement('circle', {
            className: `visage-sprite-ring-fill ${confClass}`,
            cx: size / 2, cy: size / 2, r,
            fill: 'none', strokeWidth: stroke,
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            strokeLinecap: 'round',
            transform: `rotate(-90 ${size / 2} ${size / 2})`,
        })), React$6.createElement('span', { className: 'visage-sprite-ring-label' }, `${confidence}%`));
    }

    const React$5 = window.PluginApi.React;
    const { useEffect: useEffect$2, useMemo: useMemo$1, useState: useState$1, useRef: useRef$2, useCallback: useCallback$1 } = React$5;
    function useSpriteModalData(spriteResult, onError) {
        const [performerCache, setPerformerCache] = useState$1({});
        const [loadingPerformers, setLoadingPerformers] = useState$1(new Set());
        const [sceneStashIds, setSceneStashIds] = useState$1(new Set());
        const [stashboxStatus, setStashboxStatus] = useState$1(null);
        const abortRef = useRef$2(false);
        const performers = useMemo$1(() => {
            if (!(spriteResult === null || spriteResult === void 0 ? void 0 : spriteResult.performers))
                return [];
            return Object.values(spriteResult.performers).sort((a, b) => b.confidence - a.confidence);
        }, [spriteResult]);
        const maxEndTime = useMemo$1(() => {
            var _a, _b, _c;
            let max = 0;
            for (const p of performers) {
                const entries = Array.isArray(p.time_ranges) ? p.time_ranges : Object.values((_a = p.time_ranges) !== null && _a !== void 0 ? _a : {});
                for (const r of entries) {
                    const rr = r;
                    const end = Number((_c = (_b = rr === null || rr === void 0 ? void 0 : rr[1]) !== null && _b !== void 0 ? _b : rr === null || rr === void 0 ? void 0 : rr.end) !== null && _c !== void 0 ? _c : 0);
                    if (end > max)
                        max = end;
                }
            }
            return max || 600;
        }, [performers]);
        const fetchStashData = useCallback$1(async (stashId, sourceName) => {
            var _a;
            try {
                const existing = await getPerformers(stashId);
                if (abortRef.current)
                    return;
                if (existing.length > 0) {
                    setPerformerCache(prev => ({ ...prev, [stashId]: { id: existing[0].id, image: `/performer/${existing[0].id}/image`, gender: existing[0].gender, country: existing[0].country } }));
                    return;
                }
                const scraped = await getPerformerDataFromStashID(stashId, sourceName);
                if (abortRef.current)
                    return;
                if ((_a = scraped === null || scraped === void 0 ? void 0 : scraped.images) === null || _a === void 0 ? void 0 : _a[0]) {
                    setPerformerCache(prev => ({ ...prev, [stashId]: { id: stashId, image: scraped.images[0], gender: scraped.gender, country: scraped.country } }));
                }
                else {
                    setPerformerCache(prev => ({ ...prev, [stashId]: { id: stashId, image: null, gender: scraped === null || scraped === void 0 ? void 0 : scraped.gender, country: scraped === null || scraped === void 0 ? void 0 : scraped.country } }));
                }
            }
            catch (_b) {
                if (!abortRef.current) {
                    setPerformerCache(prev => ({ ...prev, [stashId]: { id: stashId, image: null } }));
                }
            }
            finally {
                if (!abortRef.current) {
                    setLoadingPerformers(prev => {
                        const next = new Set(prev);
                        next.delete(stashId);
                        return next;
                    });
                }
            }
        }, []);
        useEffect$2(() => {
            const [scenario, id] = getScenarioAndID();
            if (scenario === 'scenes') {
                (async () => {
                    var _a, _b, _c, _d;
                    try {
                        const GQL = window.PluginApi.GQL;
                        const client = window.PluginApi.utils.StashService.getClient();
                        const res = await client.query({
                            query: GQL.FindSceneDocument,
                            variables: { id },
                        });
                        const stashIds = new Set();
                        for (const p of (_c = (_b = (_a = res.data) === null || _a === void 0 ? void 0 : _a.findScene) === null || _b === void 0 ? void 0 : _b.performers) !== null && _c !== void 0 ? _c : []) {
                            for (const s of (_d = p.stash_ids) !== null && _d !== void 0 ? _d : []) {
                                if (s.stash_id)
                                    stashIds.add(s.stash_id);
                            }
                        }
                        if (!abortRef.current)
                            setSceneStashIds(stashIds);
                    }
                    catch (_e) { }
                })();
            }
            (async () => {
                try {
                    const status = await getStashboxStatus();
                    if (!abortRef.current)
                        setStashboxStatus(status);
                }
                catch (_a) {
                    if (!abortRef.current)
                        setStashboxStatus('empty');
                }
            })();
            return () => { abortRef.current = true; };
        }, []);
        useEffect$2(() => {
            for (const p of performers) {
                if (p.id in performerCache || loadingPerformers.has(p.id))
                    continue;
                setLoadingPerformers(prev => new Set(prev).add(p.id));
                fetchStashData(p.id, p.source);
            }
        }, [performers, performerCache, loadingPerformers, fetchStashData]);
        return {
            performers,
            maxEndTime,
            performerCache,
            loadingPerformers,
            sceneStashIds,
            stashboxStatus,
        };
    }

    const React$4 = window.PluginApi.React;
    const { useEffect: useEffect$1, useMemo, useState, useRef: useRef$1, useCallback } = React$4;
    const GENDER_SYMBOLS = {
        MALE: '\u2642',
        FEMALE: '\u2640',
        TRANSGENDER_MALE: '\u26A7',
        TRANSGENDER_FEMALE: '\u26A7',
        NON_BINARY: '\u26A6',
        INTERSEX: '\u26A5',
    };
    const GENDER_NAME_KEY = {
        MALE: 'gender.male',
        FEMALE: 'gender.female',
        TRANSGENDER_MALE: 'gender.transMale',
        TRANSGENDER_FEMALE: 'gender.transFemale',
        NON_BINARY: 'gender.nonBinary',
        INTERSEX: 'gender.intersex',
    };
    function SpriteResultModal() {
        useLocale();
        const { state, showSpriteModal, clearSpriteResult, setLoading, showError, showSuccess, showWarning, openSettings } = useVisage();
        const { spriteResult, loading: loadingState, scanProgress, scanProgressDesc } = state;
        const [visible, setVisible] = useState(false);
        const [confirmedIds, setConfirmedIds] = useState(new Set());
        const [adding, setAdding] = useState(false);
        const [sortBy, setSortBy] = useState('confidence');
        const [minConfidence, setMinConfidence] = useState(() => {
            const raw = localStorage.getItem('visage:minConfidence:sprite');
            const parsed = raw === null ? NaN : Number(raw);
            return Number.isFinite(parsed) ? parsed : 20;
        });
        const [focusedIndex, setFocusedIndex] = useState(0);
        const isProcessing = loadingState['face-detection'] && spriteResult === null;
        const abortRef = useRef$1(false);
        const { performers, maxEndTime, performerCache, loadingPerformers, sceneStashIds, stashboxStatus, } = useSpriteModalData(spriteResult);
        useEffect$1(() => {
            requestAnimationFrame(() => setVisible(true));
            return () => { abortRef.current = true; };
        }, []);
        const visiblePerformers = useMemo(() => {
            var _a;
            let list = Object.values((_a = spriteResult === null || spriteResult === void 0 ? void 0 : spriteResult.performers) !== null && _a !== void 0 ? _a : {});
            if (minConfidence > 0) {
                list = list.filter(p => p.confidence >= minConfidence);
            }
            const sorted = [...list];
            switch (sortBy) {
                case 'name':
                    sorted.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'hits':
                    sorted.sort((a, b) => b.hit_count - a.hit_count);
                    break;
                default: sorted.sort((a, b) => b.confidence - a.confidence);
            }
            return sorted;
        }, [spriteResult, minConfidence, sortBy]);
        useEffect$1(() => {
            if (!visible)
                return;
            const count = visiblePerformers.length;
            if (!count)
                return;
            function onKey(e) {
                var _a;
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    setFocusedIndex(i => (i + 1) % count);
                }
                else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    setFocusedIndex(i => (i - 1 + count) % count);
                }
                else if (e.key === ' ' || e.key === 'Enter') {
                    if (((_a = e.target) === null || _a === void 0 ? void 0 : _a.tagName) === 'INPUT')
                        return;
                    e.preventDefault();
                    const p = visiblePerformers[focusedIndex];
                    if (p)
                        toggleConfirm(p.id);
                }
            }
            document.addEventListener('keydown', onKey);
            return () => document.removeEventListener('keydown', onKey);
        }, [visible, visiblePerformers, focusedIndex]);
        function toggleConfirm(stashId) {
            setConfirmedIds(prev => {
                const next = new Set(prev);
                if (next.has(stashId))
                    next.delete(stashId);
                else
                    next.add(stashId);
                return next;
            });
        }
        async function spriteQuickAdd(stashId) {
            if (adding || sceneStashIds.has(stashId))
                return;
            setAdding(true);
            const [scenario, scenarioId] = getScenarioAndID();
            try {
                const cached = performerCache[stashId];
                let pid = cached === null || cached === void 0 ? void 0 : cached.id;
                if (!pid || pid === stashId) {
                    if ((cached === null || cached === void 0 ? void 0 : cached.image) && cached.id !== stashId) {
                        pid = cached.id;
                    }
                    else {
                        const existing = await getPerformers(stashId);
                        if (existing.length > 0) {
                            pid = existing[0].id;
                        }
                        else {
                            const sourceName = getSpriteSource(stashId);
                            const scraped = await getPerformerDataFromStashID(stashId, sourceName);
                            if (!scraped) {
                                setAdding(false);
                                return;
                            }
                            const { performerId: pid2 } = await createOrGetPerformer(scraped, stashId, sourceName);
                            pid = pid2;
                        }
                    }
                }
                await addPerformerToContent(scenario, scenarioId, pid);
                showSuccess(t('faceMatch.toast.added', { target: scenario === 'scenes' ? 'scene' : 'image' }));
                close();
            }
            catch (e) {
                console.error('[Visage] sprite quick add error:', e);
                showError(t('faceMatch.toast.addError', { error: getErrorMessage(e) }));
            }
            finally {
                setAdding(false);
            }
        }
        function getSpriteSource(stashId) {
            var _a;
            return (_a = performers.find(p => p.id === stashId)) === null || _a === void 0 ? void 0 : _a.source;
        }
        async function addConfirmed() {
            if (confirmedIds.size === 0)
                return;
            setAdding(true);
            const [scenario, scenarioId] = getScenarioAndID();
            const ids = Array.from(confirmedIds).filter(id => !sceneStashIds.has(id));
            if (ids.length === 0) {
                close();
                return;
            }
            let addedCount = 0;
            try {
                for (const stashId of ids) {
                    const key = `sprite-add-${stashId}`;
                    setLoading(key, true);
                    try {
                        let cached = performerCache[stashId];
                        let pid = cached === null || cached === void 0 ? void 0 : cached.id;
                        if (!pid || pid === stashId) {
                            if ((cached === null || cached === void 0 ? void 0 : cached.image) && cached.id !== stashId) {
                                pid = cached.id;
                            }
                            else {
                                const existing = await getPerformers(stashId);
                                if (existing.length > 0) {
                                    pid = existing[0].id;
                                }
                                else {
                                    const sourceName = getSpriteSource(stashId);
                                    const scraped = await getPerformerDataFromStashID(stashId, sourceName);
                                    if (!scraped) {
                                        continue;
                                    }
                                    const { performerId: pid2 } = await createOrGetPerformer(scraped, stashId, sourceName);
                                    pid = pid2;
                                }
                            }
                        }
                        await addPerformerToContent(scenario, scenarioId, pid);
                        addedCount++;
                    }
                    finally {
                        setLoading(key, false);
                    }
                }
                if (addedCount === 0) {
                    const msg = stashboxStatus === 'empty'
                        ? t('faceMatch.toast.noStashbox', { url: STASHBOX_DOCS_URL })
                        : stashboxStatus === 'mismatch'
                            ? t('faceMatch.toast.noProvider')
                            : t('faceMatch.toast.configureProvider');
                    showWarning(msg);
                    return;
                }
                showSuccess(t('faceMatch.toast.addedMultiple', { count: addedCount, s: addedCount !== 1 ? 's' : '', target: scenario === 'scenes' ? 'scene' : 'image' }));
                close();
            }
            catch (e) {
                console.error('[Visage] add performers error:', e);
                showError(t('faceMatch.toast.addError', { error: getErrorMessage(e) }));
            }
            finally {
                setAdding(false);
            }
        }
        function jumpToTime(seconds) {
            const [scenario, id] = getScenarioAndID();
            if (scenario !== 'scenes')
                return;
            setVisible(false);
            setTimeout(() => {
                clearSpriteResult();
                showSpriteModal(false);
                window.location.href = `${window.location.pathname}?t=${Math.floor(seconds)}`;
            }, 300);
        }
        function close() {
            setVisible(false);
            setTimeout(() => {
                clearSpriteResult();
                showSpriteModal(false);
            }, 300);
        }
        const shellRef = useModalShell(close, true);
        function getSegments(timeRanges) {
            const entries = Array.isArray(timeRanges) ? timeRanges : Object.values(timeRanges !== null && timeRanges !== void 0 ? timeRanges : {});
            return entries.map((r) => {
                var _a, _b, _c, _d, _e, _f;
                return ({
                    left: (Number((_b = (_a = r === null || r === void 0 ? void 0 : r[0]) !== null && _a !== void 0 ? _a : r === null || r === void 0 ? void 0 : r.start) !== null && _b !== void 0 ? _b : 0) / maxEndTime) * 100,
                    width: Math.max(((Number((_d = (_c = r === null || r === void 0 ? void 0 : r[1]) !== null && _c !== void 0 ? _c : r === null || r === void 0 ? void 0 : r.end) !== null && _d !== void 0 ? _d : 0) - Number((_f = (_e = r === null || r === void 0 ? void 0 : r[0]) !== null && _e !== void 0 ? _e : r === null || r === void 0 ? void 0 : r.start) !== null && _f !== void 0 ? _f : 0)) / maxEndTime) * 100, 0.3),
                });
            });
        }
        function getTimelineEntries(timeRanges) {
            const entries = Array.isArray(timeRanges) ? timeRanges : Object.values(timeRanges !== null && timeRanges !== void 0 ? timeRanges : {});
            return [...entries].sort((a, b) => { var _a, _b, _c, _d; return Number((_b = (_a = a === null || a === void 0 ? void 0 : a[0]) !== null && _a !== void 0 ? _a : a === null || a === void 0 ? void 0 : a.start) !== null && _b !== void 0 ? _b : 0) - Number((_d = (_c = b === null || b === void 0 ? void 0 : b[0]) !== null && _c !== void 0 ? _c : b === null || b === void 0 ? void 0 : b.start) !== null && _d !== void 0 ? _d : 0); });
        }
        return React$4.createElement('div', {
            className: `visage-modal-backdrop ${visible ? 'visage-visible' : ''}`,
            onClick: (e) => { if (e.target === e.currentTarget)
                close(); },
        }, React$4.createElement('div', {
            ref: shellRef,
            className: `visage-modal visage-sprite-modal ${visible ? 'visage-visible' : ''}`,
            role: 'dialog',
            'aria-modal': 'true',
        }, React$4.createElement('div', { className: 'visage-modal-header' }, React$4.createElement('div', { className: 'visage-modal-title' }, React$4.createElement('h2', null, t('sprite.title')), !isProcessing && React$4.createElement('span', { className: 'visage-match-count' }, t('sprite.foundConfirmed', { found: performers.length, confirmed: confirmedIds.size }))), React$4.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, React$4.createElement(BackendBadge, null), React$4.createElement(SettingsButton, { onClick: openSettings }), React$4.createElement('button', {
            className: 'visage-modal-close',
            onClick: close,
            'aria-label': t('sprite.close'),
        }, React$4.createElement('svg', {
            width: 20, height: 20, viewBox: '0 0 24 24',
            fill: 'none', stroke: 'currentColor', strokeWidth: 2,
        }, React$4.createElement('line', { x1: 18, y1: 6, x2: 6, y2: 18 }), React$4.createElement('line', { x1: 6, y1: 6, x2: 18, y2: 18 })))), !isProcessing && React$4.createElement('div', { className: 'visage-sprite-toolbar' }, React$4.createElement('div', { className: 'visage-sprite-sort' }, ['confidence', 'name', 'hits'].map(s => {
            const label = s === 'confidence' ? t('sprite.confidence') : s === 'name' ? t('sprite.name') : t('sprite.hits');
            return React$4.createElement('button', {
                key: s,
                className: `visage-sprite-sort-btn${sortBy === s ? ' visage-active' : ''}`,
                onClick: () => { setSortBy(s); setFocusedIndex(0); },
            }, label);
        })), React$4.createElement('div', { className: 'visage-sprite-threshold' }, React$4.createElement('span', { className: 'visage-threshold-text' }, t('sprite.minConf')), React$4.createElement('input', {
            type: 'range', min: 0, max: 100, step: 5,
            value: minConfidence,
            onChange: (e) => {
                const value = Number(e.target.value);
                setMinConfidence(value);
                localStorage.setItem('visage:minConfidence:sprite', String(value));
            },
            title: t('sprite.minConfTitle', { percent: minConfidence }),
        }), React$4.createElement('span', { className: 'visage-sprite-threshold-label' }, `${minConfidence}%`)))), stashboxStatus !== null && stashboxStatus !== 'configured' && React$4.createElement('div', { className: 'visage-stashbox-banner' }, React$4.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React$4.createElement('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }), React$4.createElement('line', { x1: 12, y1: 9, x2: 12, y2: 13 }), React$4.createElement('line', { x1: 12, y1: 17, x2: 12.01, y2: 17 })), React$4.createElement('span', { className: 'visage-stashbox-banner-text' }, React$4.createElement('strong', null, stashboxStatus === 'empty' ? t('faceMatch.stashboxMissing') : t('faceMatch.stashboxWrongName')), stashboxStatus === 'empty'
            ? t('faceMatch.stashboxMissingBody')
            : t('faceMatch.stashboxWrongNameBody'), React$4.createElement('a', { href: STASHBOX_DOCS_URL, target: '_blank', rel: 'noopener noreferrer' }, t('faceMatch.learnMore')))), isProcessing
            ? React$4.createElement('div', { className: 'visage-modal-loading' }, React$4.createElement('div', { className: 'visage-conveyor' }, React$4.createElement('div', { className: 'visage-conveyor-track' }, Array.from({ length: 14 }, (_, i) => React$4.createElement('div', { key: i, className: 'visage-conveyor-frame' }))), React$4.createElement('div', { className: 'visage-conveyor-beam' }), React$4.createElement('div', { className: 'visage-conveyor-rail' })), (scanProgress > 0 || scanProgressDesc) && React$4.createElement('div', { className: 'visage-scan-progress' }, React$4.createElement('div', { className: 'visage-scan-progress-bar' }, React$4.createElement('div', {
                className: 'visage-scan-progress-fill',
                style: { width: `${Math.round(scanProgress * 100)}%` },
            }))), React$4.createElement('span', { className: 'visage-loading-label' }, scanProgressDesc || t('sprite.scanning')), React$4.createElement('button', {
                className: 'visage-btn visage-btn-secondary',
                onClick: () => {
                    cancelDetection();
                    setLoading('face-detection', false);
                    close();
                },
                style: { marginTop: 12 },
            }, t('sprite.cancel')))
            : React$4.createElement(React$4.Fragment, null, React$4.createElement('div', { className: 'visage-sprite-body' }, performers.length === 0
                ? React$4.createElement('div', { className: 'visage-sprite-empty' }, React$4.createElement('p', null, t('sprite.empty')))
                : React$4.createElement('div', { className: 'visage-sprite-grid' }, visiblePerformers.map((p, idx) => {
                    const alreadyInScene = sceneStashIds.has(p.id);
                    const isConfirmed = confirmedIds.has(p.id) || alreadyInScene;
                    const isFocused = idx === focusedIndex;
                    const cached = performerCache[p.id];
                    const stashImg = cached === null || cached === void 0 ? void 0 : cached.image;
                    const isLoadingImg = loadingPerformers.has(p.id);
                    const confClass = getConfidenceClass(p.confidence);
                    const sortedRanges = getTimelineEntries(p.time_ranges);
                    const segments = getSegments(sortedRanges);
                    const cardClass = [
                        'visage-sprite-card',
                        isConfirmed ? 'visage-sprite-confirmed' : '',
                        isFocused ? 'visage-sprite-focused' : '',
                        adding ? 'visage-sprite-disabled' : '',
                    ].filter(Boolean).join(' ');
                    function onSpriteCardClick(e) {
                        if (e.shiftKey || e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            e.stopPropagation();
                            spriteQuickAdd(p.id);
                        }
                        else {
                            toggleConfirm(p.id);
                        }
                    }
                    return React$4.createElement('div', {
                        key: p.id,
                        className: cardClass,
                        onClick: onSpriteCardClick,
                        role: 'button',
                        tabIndex: 0,
                        'aria-pressed': isConfirmed,
                    }, React$4.createElement('div', { className: 'visage-sprite-compare' }, React$4.createElement('div', { className: 'visage-sprite-face' }, React$4.createElement('img', {
                        src: `data:image/jpeg;base64,${p.thumbnail}`,
                        alt: t('sprite.detectedFaceAlt'),
                        className: 'visage-sprite-face-img',
                    }), React$4.createElement('span', { className: 'visage-sprite-label' }, t('sprite.spriteLabel'))), React$4.createElement('div', { className: 'visage-sprite-vs' }, React$4.createElement('span', null, t('sprite.vs'))), React$4.createElement('div', { className: 'visage-sprite-performer-img' }, React$4.createElement('div', { className: 'visage-sprite-img-placeholder' }, React$4.createElement('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React$4.createElement('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }), React$4.createElement('circle', { cx: 12, cy: 7, r: 4 }))), isLoadingImg && React$4.createElement('div', { className: 'visage-sprite-img-loading' }), stashImg && React$4.createElement('img', {
                        src: stashImg,
                        alt: p.name,
                        className: 'visage-sprite-performer-img-src',
                        onError: (e) => { e.target.remove(); },
                    }), React$4.createElement('span', { className: 'visage-sprite-label' }, t('sprite.stashLabel')), (cached === null || cached === void 0 ? void 0 : cached.gender) && React$4.createElement('span', {
                        className: 'visage-sprite-gender-badge visage-gender-badge visage-gender-' + cached.gender.toLowerCase().replace(/_/g, '-'),
                        title: GENDER_NAME_KEY[cached.gender]
                            ? t(GENDER_NAME_KEY[cached.gender])
                            : cached.gender.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
                    }, GENDER_SYMBOLS[cached.gender] || '?'), (cached === null || cached === void 0 ? void 0 : cached.country) && React$4.createElement('span', {
                        className: 'visage-sprite-country-flag fi fi-' + cached.country.toLowerCase(),
                    })), alreadyInScene && React$4.createElement('div', { className: 'visage-sprite-in-scene' }, t('sprite.inScene')), isConfirmed && !alreadyInScene && React$4.createElement('div', { className: 'visage-sprite-check-badge' }, React$4.createElement('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 3 }, React$4.createElement('polyline', { points: '20 6 9 17 4 12' })))), React$4.createElement('div', { className: 'visage-sprite-info' }, React$4.createElement('div', { className: 'visage-sprite-summary' }, ConfidenceRing({ confidence: p.confidence, confClass }), React$4.createElement('div', { className: 'visage-sprite-summary-text' }, React$4.createElement('a', {
                        href: p.performer_url,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'visage-sprite-performer-link',
                        onClick: (e) => e.stopPropagation(),
                    }, p.name), React$4.createElement('div', { className: 'visage-sprite-stats-row' }, React$4.createElement('span', { className: 'visage-sprite-stat' }, t('sprite.hitsCount', { count: p.hit_count, s: p.hit_count !== 1 ? 's' : '' })), React$4.createElement('span', { className: 'visage-sprite-stat-sep' }, '\u00B7'), React$4.createElement('span', { className: 'visage-sprite-stat' }, t('sprite.totalTime', { time: formatTime(sortedRanges.reduce((sum, r) => {
                            var _a, _b, _c, _d;
                            const end = Number((_b = (_a = r === null || r === void 0 ? void 0 : r[1]) !== null && _a !== void 0 ? _a : r === null || r === void 0 ? void 0 : r.end) !== null && _b !== void 0 ? _b : 0);
                            const start = Number((_d = (_c = r === null || r === void 0 ? void 0 : r[0]) !== null && _c !== void 0 ? _c : r === null || r === void 0 ? void 0 : r.start) !== null && _d !== void 0 ? _d : 0);
                            return sum + (end - start);
                        }, 0)) }))))), React$4.createElement('div', { className: 'visage-sprite-timeline-wrap' }, React$4.createElement('div', { className: 'visage-sprite-timeline' }, segments.map((seg, i) => {
                        var _a, _b, _c, _d;
                        const range = sortedRanges[i];
                        const start = Number((_b = (_a = range === null || range === void 0 ? void 0 : range[0]) !== null && _a !== void 0 ? _a : range === null || range === void 0 ? void 0 : range.start) !== null && _b !== void 0 ? _b : 0);
                        const end = Number((_d = (_c = range === null || range === void 0 ? void 0 : range[1]) !== null && _c !== void 0 ? _c : range === null || range === void 0 ? void 0 : range.end) !== null && _d !== void 0 ? _d : 0);
                        return React$4.createElement('div', {
                            key: i,
                            className: `visage-sprite-timeline-seg ${confClass}`,
                            style: { left: `${seg.left}%`, width: `${seg.width}%` },
                            onClick: (e) => { e.stopPropagation(); jumpToTime(start); },
                            title: `${formatTime(start)}\u2013${formatTime(end)}`,
                        });
                    })), React$4.createElement('div', { className: 'visage-sprite-timeline-labels' }, React$4.createElement('span', null, '00:00'), React$4.createElement('span', null, formatTime(maxEndTime)))), alreadyInScene && React$4.createElement('div', { className: 'visage-sprite-hint visage-sprite-hint-done' }, React$4.createElement('span', null, t('sprite.alreadyInScene'))), !isConfirmed && !alreadyInScene && React$4.createElement('div', { className: 'visage-sprite-hint' }, React$4.createElement('span', null, t('sprite.clickToConfirm'))), isConfirmed && !alreadyInScene && React$4.createElement('div', { className: 'visage-sprite-hint visage-sprite-hint-done' }, React$4.createElement('span', null, t('sprite.confirmed')))));
                }))), React$4.createElement('div', { className: 'visage-modal-footer' }, React$4.createElement('div', { className: 'visage-footer-main' }, React$4.createElement('a', {
                className: 'visage-ext-patreon-btn',
                href: 'https://www.patreon.com/cw/cc12340',
                target: '_blank',
                rel: 'noopener noreferrer',
            }, React$4.createElement('svg', { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'currentColor' }, React$4.createElement('circle', { cx: 15, cy: 9, r: 7 }), React$4.createElement('rect', { x: 2, y: 2, width: 4, height: 20, rx: 1 })), t('sprite.supportPatreon')), React$4.createElement('div', { className: 'visage-progress-info' }, confirmedIds.size > 0
                ? React$4.createElement('span', { className: 'visage-matches-assigned' }, t('sprite.confirmedCount', { confirmed: confirmedIds.size, total: performers.length }))
                : React$4.createElement('span', { className: 'visage-matches-assigned' }, visiblePerformers.length < performers.length
                    ? t('sprite.shownHint', { shown: visiblePerformers.length, total: performers.length })
                    : t('sprite.confirmHint'))), React$4.createElement('div', { className: 'visage-button-group' }, React$4.createElement('button', {
                className: 'visage-btn visage-btn-primary',
                onClick: addConfirmed,
                disabled: confirmedIds.size === 0 || adding,
            }, adding ? t('sprite.adding') : t('sprite.done', { count: confirmedIds.size }))))))));
    }

    const React$3 = window.PluginApi.React;
    const { useEffect, useRef } = React$3;
    const ICONS = {
        error: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
        warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V8h2v6z',
        success: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    };
    function ErrorDialog() {
        useLocale();
        const { state, hideErrorDialog } = useVisage();
        const dialogRef = useRef(null);
        const timerRef = useRef(null);
        useEffect(() => {
            var _a;
            if (!state.errorDialog)
                return;
            if (timerRef.current)
                clearTimeout(timerRef.current);
            timerRef.current = setTimeout(hideErrorDialog, 10000);
            (_a = dialogRef.current) === null || _a === void 0 ? void 0 : _a.focus();
            return () => {
                if (timerRef.current)
                    clearTimeout(timerRef.current);
            };
        }, [state.errorDialog]);
        useEffect(() => {
            if (!state.errorDialog)
                return;
            function onKey(e) {
                if (e.key === 'Escape' || e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    hideErrorDialog();
                }
            }
            document.addEventListener('keydown', onKey, true);
            return () => document.removeEventListener('keydown', onKey, true);
        }, [state.errorDialog, hideErrorDialog]);
        if (!state.errorDialog)
            return null;
        const { message, variant } = state.errorDialog;
        return React$3.createElement('div', {
            className: `visage-error-backdrop`,
            onClick: (e) => { if (e.target === e.currentTarget)
                hideErrorDialog(); },
        }, React$3.createElement('div', {
            ref: dialogRef,
            className: `visage-error-dialog visage-error-${variant}`,
            role: 'alertdialog',
            'aria-modal': 'true',
            tabIndex: -1,
        }, React$3.createElement('div', { className: 'visage-error-icon' }, React$3.createElement('svg', { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'currentColor' }, React$3.createElement('path', { d: ICONS[variant] }))), React$3.createElement('div', { className: 'visage-error-message' }, message), React$3.createElement('button', {
            className: 'visage-error-close',
            onClick: hideErrorDialog,
            'aria-label': t('error.dismiss'),
        }, React$3.createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, React$3.createElement('line', { x1: 18, y1: 6, x2: 6, y2: 18 }), React$3.createElement('line', { x1: 6, y1: 6, x2: 18, y2: 18 }))), React$3.createElement('div', { className: 'visage-error-timer' })));
    }

    const { React: React$2 } = PluginApi;
    /**
     * Surfaces a dismissible warning when a search action hits a backend that is
     * unreachable or degraded. Unlike the previous version, this does NOT poll
     * `/health` on page load: it only renders when a button (scene scan or face
     * search) fails because the backend is down. The message comes from context
     * state and is cleared by the dismiss button. Clicking the banner or the
     * "Change backend" link opens the backend settings panel via `onOpen`.
     */
    function BackendHealthBanner({ onOpen }) {
        useLocale();
        const { state, hideHealthBanner } = useVisage();
        if (!state.healthBanner)
            return null;
        const openSettings = (e) => {
            e.stopPropagation();
            onOpen === null || onOpen === void 0 ? void 0 : onOpen();
        };
        return React$2.createElement('div', {
            className: 'visage-health-banner',
            role: 'button',
            tabIndex: 0,
            onClick: openSettings,
            onKeyDown: (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openSettings(e);
                }
            },
        }, React$2.createElement('span', null, state.healthBanner), onOpen && React$2.createElement('a', {
            className: 'visage-health-banner-action',
            onClick: openSettings,
        }, t('banner.changeBackend')), React$2.createElement('button', {
            className: 'visage-health-banner-close',
            onClick: (e) => {
                e.stopPropagation();
                hideHealthBanner();
            },
            'aria-label': t('banner.dismiss'),
        }, '×'));
    }

    const { React: React$1 } = PluginApi;
    function FirstRunDialog({ onComplete }) {
        useLocale();
        const [showSettings, setShowSettings] = React$1.useState(false);
        if (showSettings) {
            return React$1.createElement(BackendSettings, { onClose: onComplete, initialMode: 'local' });
        }
        return React$1.createElement('div', { className: 'visage-firstrun-backdrop' }, React$1.createElement('div', {
            className: 'visage-firstrun-dialog',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': t('firstRun.title'),
        }, React$1.createElement('h2', { className: 'visage-firstrun-heading' }, t('firstRun.title')), React$1.createElement('p', { className: 'visage-firstrun-sub' }, t('firstRun.subtitle')), React$1.createElement('button', {
            className: 'visage-btn visage-btn-primary visage-firstrun-cloud',
            onClick: onComplete,
        }, t('firstRun.cloud')), React$1.createElement('div', { className: 'visage-firstrun-note' }, t('firstRun.cloudNote')), React$1.createElement('button', {
            className: 'visage-btn visage-btn-secondary visage-firstrun-server',
            onClick: () => setShowSettings(true),
        }, t('firstRun.local')), React$1.createElement('div', { className: 'visage-firstrun-note' }, t('firstRun.localNote')), React$1.createElement('button', {
            className: 'visage-firstrun-skip',
            onClick: onComplete,
        }, t('firstRun.skip'))));
    }

    function detectTheme() {
        const styles = getComputedStyle(document.documentElement);
        const accent = styles.getPropertyValue('--accent').trim() || '#5991f6';
        return {
            '--visage-accent': accent,
            '--visage-accent-rgb': hexToRgb(accent),
            '--visage-border': '#3a3a4a',
        };
    }
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : '89, 145, 246';
    }

    // Dutch. Missing keys fall back to English automatically.
    const nl = {
        // ---- BackendSettings.tsx ----
        'backendSettings.title': `Backend-instellingen`,
        'backendSettings.closeAria': `Instellingen sluiten`,
        'backendSettings.backendAria': `Backend-instellingen`,
        'backendSettings.changeBackend': `Backend wijzigen`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Lokaal`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Afbeeldingen worden naar de Hugging Face cloudservice gestuurd.`,
        'backendSettings.hintPrefix': `Wil je dat je afbeeldingen in jouw netwerk blijven?`,
        'backendSettings.hintLink': `Draai een privéserver via Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `Het beveiligingsbeleid (CSP) van de browser staat alleen toe`,
        'backendSettings.csp2': `standaard. Voeg om een lokale backend op een ander adres (bijv. je LAN-IP) te bereiken dit toe aan de`,
        'backendSettings.csp3': `lijst in het`,
        'backendSettings.csp4': `bestand in je Stash-pluginsmap, anders worden verzoeken geblokkeerd. Let op: een update van Visage installeert`,
        'backendSettings.csp5': `opnieuw, dus dit moet na elke update opnieuw worden toegepast.`,
        'backendSettings.testing': `Verbinding testen…`,
        'backendSettings.testConnection': `Verbinding testen`,
        'backendSettings.testingShort': `Testen…`,
        'backendSettings.cancel': `Annuleren`,
        'backendSettings.save': `Opslaan`,
        'backendSettings.feedback.reachable': `Verbinding geslaagd. De backend is klaar.`,
        'backendSettings.feedback.degraded': `Backend bereikbaar maar gedegradeerd (modellen of index niet geladen).`,
        'backendSettings.feedback.unreachable': `Backend niet bereikbaar. Controleer de URL en of de backend actief is.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        // ---- FaceMatchModal.tsx ----
        'faceMatch.title': `HUIDIG FRAME`,
        'faceMatch.close': `Sluiten`,
        'faceMatch.facesSelected': `{faces} gezichten gevonden · {selected} geselecteerd`,
        'faceMatch.inScene': `· {count} in de scène`,
        'faceMatch.stashboxMissing': `Geen stash-box geconfigureerd.`,
        'faceMatch.stashboxMissingBody': ` Voeg een stash-boxprovider toe in Instellingen → Metadata-providers om het importeren van performers in te schakelen.`,
        'faceMatch.stashboxWrongName': `Geen provider genaamd "StashDB" gevonden.`,
        'faceMatch.stashboxWrongNameBody': ` Het importeren van performers vereist een provider genaamd "StashDB". Hernoem je provider in Instellingen → Metadata-providers.`,
        'faceMatch.learnMore': `Meer informatie.`,
        'faceMatch.scanning': `Scannen • gezichtsherkenning…`,
        'faceMatch.faceAlt': `Gezicht {index}`,
        'faceMatch.minConf': `Min. betr.`,
        'faceMatch.minConfTitle': `Minimale zekerheid: {percent}%`,
        'faceMatch.detected': `Gedetecteerd`,
        'faceMatch.detectedFaceAlt': `Gedetecteerd gezicht`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Steun op Patreon`,
        'faceMatch.ofSelected': `{selected} van {total} geselecteerd`,
        'faceMatch.allInScene': `{total} gezichten gevonden · allemaal in de scène`,
        'faceMatch.clickToSelect': `{total} gezichten gevonden · klik om te selecteren`,
        'faceMatch.kbSwitch': `Wissel gezichten`,
        'faceMatch.kbSelect': `Selecteer performers`,
        'faceMatch.kbToggle': `Selectie wisselen`,
        'faceMatch.kbAddInstant': `Shift+klik om direct toe te voegen`,
        'faceMatch.selectBest': `Beste overeenkomsten selecteren`,
        'faceMatch.adding': `Toevoegen...`,
        'faceMatch.done': `Klaar ({count})`,
        'faceMatch.toast.added': `Performer toegevoegd aan de {target}.`,
        'faceMatch.toast.addError': `Kon performer niet toevoegen: {error}`,
        'faceMatch.toast.noStashbox': `Geen stash-box geconfigureerd. Voeg een stash-boxprovider toe in Instellingen → Metadata-providers om het importeren van performers in te schakelen. Zie {url}`,
        'faceMatch.toast.noProvider': `Geen provider genaamd "StashDB" gevonden. Hernoem je provider naar "StashDB" in Instellingen → Metadata-providers om het importeren van performers in te schakelen.`,
        'faceMatch.toast.configureProvider': `Configureer een stash-boxprovider in Instellingen → Metadata-providers om het importeren van performers in te schakelen.`,
        'faceMatch.toast.addedMultiple': `{count} performer{s} toegevoegd aan de {target}.`,
        // ---- SpriteResultModal.tsx ----
        'sprite.title': `SCÈNE-PERFORMERS`,
        'sprite.close': `Sluiten`,
        'sprite.foundConfirmed': `{found} gevonden · {confirmed} bevestigd`,
        'sprite.confidence': `zekerheid`,
        'sprite.name': `naam`,
        'sprite.hits': `treffers`,
        'sprite.minConf': `Min. betr.`,
        'sprite.minConfTitle': `Minimale zekerheid: {percent}%`,
        'sprite.scanning': `Visage scannen…`,
        'sprite.cancel': `Annuleren`,
        'sprite.empty': `Geen performers geïdentificeerd in deze sprite.`,
        'sprite.detectedFaceAlt': `Gedetecteerd gezicht`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `In de scène`,
        'sprite.hitsCount': `{count} treffer{s}`,
        'sprite.totalTime': `{time} totaal`,
        'sprite.alreadyInScene': `Al in de scène`,
        'sprite.clickToConfirm': `Klik om te bevestigen`,
        'sprite.confirmed': `Bevestigd`,
        'sprite.supportPatreon': `Steun op Patreon`,
        'sprite.confirmedCount': `{confirmed} van {total} bevestigd`,
        'sprite.shownHint': `{shown} getoond ({total} totaal) · klik om te bevestigen · ←→ navigeren · Enter bevestigen`,
        'sprite.confirmHint': `Klik om te bevestigen · ←→ navigeren · Enter bevestigen`,
        'sprite.adding': `Toevoegen...`,
        'sprite.done': `Klaar ({count})`,
        // ---- PerformerCard.tsx ----
        'gender.male': `Mannelijk`,
        'gender.female': `Vrouwelijk`,
        'gender.transMale': `Transgender man`,
        'gender.transFemale': `Transgender vrouw`,
        'gender.nonBinary': `Non-binair`,
        'gender.intersex': `Intersekse`,
        'card.excellent': `Uitstekende overeenkomst`,
        'card.good': `Goede overeenkomst`,
        'card.uncertain': `Onzekere overeenkomst`,
        'card.select': `{name} selecteren`,
        'card.deselect': `{name} deselecteren`,
        'card.openOn': `Openen op {source}`,
        // ---- FaceSearchButton.tsx ----
        'search.overlayHint': `Sleep om een gezicht te selecteren — Enter om het hele frame te scannen — Esc om te annuleren`,
        'search.noFaces': `Geen gezichten gevonden in die selectie. Probeer een kleinere uitsnede of druk op Enter om het hele frame te scannen.`,
        'search.captureMediaFail': `Kan media niet vastleggen. Zorg ervoor dat de scène/afbeelding volledig is geladen.`,
        'search.healthBanner': `De gezichtsherkennings-API is niet bereikbaar. Start de backend en probeer het opnieuw.`,
        'search.failed': `Gezichtszoekopdracht mislukt: {error}`,
        'search.fetchImageFail': `Kan afbeelding niet van Stash ophalen.`,
        'search.captureFail': `Kan afbeelding niet vastleggen: {error}`,
        'search.selectFaceImage': `Selecteer een gezicht binnen de afbeelding.`,
        'search.captureFrameFail': `Kan het huidige frame niet vastleggen.`,
        'search.captureFrameFail2': `Kan het huidige frame niet vastleggen.`,
        'search.selectFaceVideo': `Selecteer een gezicht binnen het videoplayergebied.`,
        'search.menuItemTitle': `Sleep een kader rond een gezicht, of druk op Enter om het hele frame te scannen, om in StashDB naar overeenkomsten te zoeken`,
        'search.currentFrame': `Visage: Huidig frame`,
        // ---- SceneScanButton.tsx ----
        'scene.noSprite': `Geen sprite sheet of voorbeeldvideo gevonden voor deze scène. Genereer ze in de scène-instellingen en probeer het opnieuw.`,
        'scene.noFaces': `Geen gezichten of performers gevonden in het sprite sheet of de voorbeeldvideo van deze scène.`,
        'scene.healthBanner': `De gezichtsherkennings-API is niet bereikbaar. Start de backend en probeer het opnieuw.`,
        'scene.failed': `Scènescan mislukt: {error}`,
        'scene.menuItemTitle': `Identificeer elke performer in de scène (vereist een gegenereerd sprite sheet of voorbeeldvideo)`,
        'scene.wholeScene': `Visage: Hele scène`,
        // ---- BackendHealthBanner.tsx ----
        'banner.changeBackend': `Backend wijzigen`,
        'banner.dismiss': `Negeren`,
        // ---- ErrorDialog.tsx ----
        'error.dismiss': `Negeren`,
        // ---- FirstRunDialog.tsx ----
        'firstRun.title': `Stel je Visage-backend in`,
        'firstRun.subtitle': `Visage stuurt gezichtsafbeeldingen naar een backend voor herkenning. Kies waar je het wilt draaien.`,
        'firstRun.cloud': `Hugging Face cloud gebruiken`,
        'firstRun.cloudNote': `Geen installatie nodig. Afbeeldingen worden naar de Hugging Face cloudservice gestuurd.`,
        'firstRun.local': `Mijn eigen server gebruiken`,
        'firstRun.localNote': `Draai het privébinary op je eigen machine of netwerk.`,
        'firstRun.skip': `Voor nu overslaan`,
        // ---- BackendBadge.tsx ----
        'badge.local': `Lokaal`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Visage-backend: {label}`,
        // ---- DonateFooter.tsx ----
        'donate.enjoying': `Geniet je van Visage? Help het in leven te houden`,
        'donate.supportPatreon': `Steun op Patreon`,
        // ---- FaceFrameSelector.tsx ----
        'frame.close': `Frameselector sluiten`,
        'frame.seekFail': `Kan niet zoeken in de videospeler.`,
        'frame.selectAt': `Gezichtsframe selecteren op {time}s`,
    };

    const he = {
        'backendSettings.title': `הגדרות צד-שרת`,
        'backendSettings.closeAria': `סגירת ההגדרות`,
        'backendSettings.backendAria': `הגדרות צד-שרת`,
        'backendSettings.changeBackend': `החלפת צד-שרת`,
        'backendSettings.backendLabel': `צד-שרת`,
        'backendSettings.local': `מקומי`,
        'backendSettings.cloud': `ענן (Hugging Face)`,
        'backendSettings.cloudNote': `התמונות נשלחות לשירות הענן של Hugging Face.`,
        'backendSettings.hintPrefix': `רוצה שהתמונות יישארו בתוך הרשת שלך?`,
        'backendSettings.hintLink': `הרץ שרת פרטי דרך Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `מדיניות האבטחה של הדפדפן (CSP) מאפשרת רק`,
        'backendSettings.csp2': `כברירת מחדל. כדי לגשת לצד-שרת מקומי בכתובת אחרת (למשל IP הרשת המקומית שלך), הוסף אותו אל`,
        'backendSettings.csp3': `ב`,
        'backendSettings.csp4': `בתוך תיקיית התוספים של Stash, אחרת הבקשות ייחסמו. הערה: עדכון של Visage מתקין מחדש את`,
        'backendSettings.csp5': `, ולכן יש ליישם זאת שוב אחרי כל עדכון.`,
        'backendSettings.testing': `בודק חיבור…`,
        'backendSettings.testConnection': `בדיקת חיבור`,
        'backendSettings.testingShort': `בודק…`,
        'backendSettings.cancel': `ביטול`,
        'backendSettings.save': `שמירה`,
        'backendSettings.feedback.reachable': `החיבור הצליח. צד-השרת מוכן.`,
        'backendSettings.feedback.degraded': `צד-השרת נגיש אך מוגבל (המודלים או המדד אינם נטענים).`,
        'backendSettings.feedback.unreachable': `צד-השרת אינו נגיש. בדוק את ה-URL וודא שצד-השרת פועל.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `הפריים הנוכחי`,
        'faceMatch.close': `סגירה`,
        'faceMatch.facesSelected': `נמצאו {faces} פנים · נבחרו {selected}`,
        'faceMatch.inScene': `· {count} בסצנה`,
        'faceMatch.stashboxMissing': `לא הוגדר stash-box.`,
        'faceMatch.stashboxMissingBody': ` הוסף ספק stash-box בהגדרות ← ספקי מטא-נתונים כדי להפעיל ייבוא מבצעים.`,
        'faceMatch.stashboxWrongName': `לא נמצא ספק "StashDB".`,
        'faceMatch.stashboxWrongNameBody': ` ייבוא מבצעים דורש ספק בשם "StashDB". שנה את שם הספק שלך בהגדרות ← ספקי מטא-נתונים.`,
        'faceMatch.learnMore': `מידע נוסף.`,
        'faceMatch.scanning': `סורק • זיהוי פנים…`,
        'faceMatch.faceAlt': `פנים {index}`,
        'faceMatch.minConf': `מינ. ביטחון`,
        'faceMatch.minConfTitle': `ביטחון מינימלי: {percent}%`,
        'faceMatch.detected': `זוהה`,
        'faceMatch.detectedFaceAlt': `פנים שזוהו`,
        'faceMatch.vs': `מול`,
        'faceMatch.supportPatreon': `תמיכה ב-Patreon`,
        'faceMatch.ofSelected': `נבחרו {selected} מתוך {total}`,
        'faceMatch.allInScene': `נמצאו {total} פנים · כולם בסצנה`,
        'faceMatch.clickToSelect': `נמצאו {total} פנים · לחץ לבחירה`,
        'faceMatch.kbSwitch': `מעבר בין פנים`,
        'faceMatch.kbSelect': `בחירת מבצעים`,
        'faceMatch.kbToggle': `החלפת בחירה`,
        'faceMatch.kbAddInstant': `Shift+לחיצה להוספה מיידית`,
        'faceMatch.selectBest': `בחירת ההתאמות הטובות ביותר`,
        'faceMatch.adding': `מוסיף...`,
        'faceMatch.done': `בוצע ({count})`,
        'faceMatch.toast.added': `המבצע נוסף אל {target}.`,
        'faceMatch.toast.addError': `הוספת המבצע נכשלה: {error}`,
        'faceMatch.toast.noStashbox': `לא הוגדר stash-box. הוסף ספק stash-box בהגדרות ← ספקי מטא-נתונים כדי להפעיל ייבוא מבצעים. ראה {url}`,
        'faceMatch.toast.noProvider': `לא נמצא ספק בשם "StashDB". שנה את שם הספק שלך ל-"StashDB" בהגדרות ← ספקי מטא-נתונים כדי להפעיל ייבוא מבצעים.`,
        'faceMatch.toast.configureProvider': `הגדר ספק stash-box בהגדרות ← ספקי מטא-נתונים כדי להפעיל ייבוא מבצעים.`,
        'faceMatch.toast.addedMultiple': `נוספו {count} מבצעים{s} אל {target}.`,
        'sprite.title': `מבצעי הסצנה`,
        'sprite.close': `סגירה`,
        'sprite.foundConfirmed': `נמצאו {found} · אושרו {confirmed}`,
        'sprite.confidence': `ביטחון`,
        'sprite.name': `שם`,
        'sprite.hits': `פגיעות`,
        'sprite.minConf': `מינ. ביטחון`,
        'sprite.minConfTitle': `ביטחון מינימלי: {percent}%`,
        'sprite.scanning': `Visage סורק…`,
        'sprite.cancel': `ביטול`,
        'sprite.empty': `לא זוהו מבצעים בספייריט זה.`,
        'sprite.detectedFaceAlt': `פנים שזוהו`,
        'sprite.spriteLabel': `ספייריט`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `מול`,
        'sprite.inScene': `בסצנה`,
        'sprite.hitsCount': `{count} פגיעות{s}`,
        'sprite.totalTime': `{time} בסך הכול`,
        'sprite.alreadyInScene': `כבר בסצנה`,
        'sprite.clickToConfirm': `לחץ לאישור`,
        'sprite.confirmed': `אושר`,
        'sprite.supportPatreon': `תמיכה ב-Patreon`,
        'sprite.confirmedCount': `אושרו {confirmed} מתוך {total}`,
        'sprite.shownHint': `מוצגים {shown} (מתוך {total} בסך הכול) · לחץ לאישור · ←→ ניווט · Enter לאישור`,
        'sprite.confirmHint': `לחץ לאישור · ←→ ניווט · Enter לאישור`,
        'sprite.adding': `מוסיף...`,
        'sprite.done': `בוצע ({count})`,
        'gender.male': `זכר`,
        'gender.female': `נקבה`,
        'gender.transMale': `גבר טרנסג׳נדר`,
        'gender.transFemale': `אישה טרנסג׳נדרית`,
        'gender.nonBinary': `לא-בינארי`,
        'gender.intersex': `אינטרסקס`,
        'card.excellent': `התאמה מצוינת`,
        'card.good': `התאמה טובה`,
        'card.uncertain': `התאמה לא ודאית`,
        'card.select': `בחירת {name}`,
        'card.deselect': `ביטול בחירת {name}`,
        'card.openOn': `פתיחה ב-{source}`,
        'search.overlayHint': `גרור כדי לבחור פנים — Enter לסריקת הפריים כולו — Esc לביטול`,
        'search.noFaces': `לא נמצאו פנים בבחירה זו. נסה חיתוך הדוק יותר, או לחץ Enter כדי לסרוק את כל הפריים.`,
        'search.captureMediaFail': `לא ניתן היה ללכוד מדיה. ודא שהסצנה/התמונה נטענה במלואה.`,
        'search.healthBanner': `ממשק זיהוי הפנים אינו נגיש. הפעל את צד-השרת ונסה שוב.`,
        'search.failed': `חיפוש הפנים נכשל: {error}`,
        'search.fetchImageFail': `לא ניתן היה לאחזר תמונה מ-Stash.`,
        'search.captureFail': `לכידת התמונה נכשלה: {error}`,
        'search.selectFaceImage': `בחר פנים בתוך התמונה.`,
        'search.captureFrameFail': `לא ניתן היה ללכוד את הפריים הנוכחי.`,
        'search.captureFrameFail2': `לכידת הפריים הנוכחי נכשלה.`,
        'search.selectFaceVideo': `בחר פנים בתוך אזור נגן הווידאו.`,
        'search.menuItemTitle': `גרור תיבה סביב פנים, או לחץ Enter לסריקת הפריים כולו, כדי לחפש התאמות ב-StashDB`,
        'search.currentFrame': `Visage: פריים נוכחי`,
        'scene.noSprite': `אין גיליון ספייריט או וידאו תצוגה מקדימה לסצנה זו. צור אותם בהגדרות הסצנה, ואז נסה שוב.`,
        'scene.noFaces': `לא נמצאו פנים או מבצעים בגיליון הספייריט או בווידאו התצוגה המקדימה של סצנה זו.`,
        'scene.healthBanner': `ממשק זיהוי הפנים אינו נגיש. הפעל את צד-השרת ונסה שוב.`,
        'scene.failed': `סריקת הסצנה נכשלה: {error}`,
        'scene.menuItemTitle': `זהה כל מבצע בסצנה (דורש גיליון ספייריט או וידאו תצוגה מקדימה שנוצר)`,
        'scene.wholeScene': `Visage: כל הסצנה`,
        'banner.changeBackend': `החלפת צד-שרת`,
        'banner.dismiss': `סגירה`,
        'error.dismiss': `סגירה`,
        'firstRun.title': `הגדרת צד-השרת של Visage`,
        'firstRun.subtitle': `Visage שולח תמונות פנים לצד-השרת לצורך זיהוי. בחר היכן להריץ אותו.`,
        'firstRun.cloud': `שימוש בענן של Hugging Face`,
        'firstRun.cloudNote': `ללא התקנה. התמונות נשלחות לשירות הענן של Hugging Face.`,
        'firstRun.local': `שימוש בשרת שלי`,
        'firstRun.localNote': `הרץ את הקובץ הפרטי על המחשב או הרשת שלך.`,
        'firstRun.skip': `דלג בינתיים`,
        'badge.local': `מקומי`,
        'badge.cloud': `ענן (Hugging Face)`,
        'badge.title': `צד-שרת Visage: {label}`,
        'donate.enjoying': `נהנה מ-Visage? עזור לשמור עליו בחיים`,
        'donate.supportPatreon': `תמיכה ב-Patreon`,
        'frame.close': `סגירת בורר הפריים`,
        'frame.seekFail': `ניווט בנגן הווידאו נכשל.`,
        'frame.selectAt': `בחירת פריים פנים ב-{time} שניות`,
    };

    const lt = {
        'backendSettings.title': `Pamatinės sistemos nustatymai`,
        'backendSettings.closeAria': `Uždaryti nustatymus`,
        'backendSettings.backendAria': `Pamatinės sistemos nustatymai`,
        'backendSettings.changeBackend': `Keisti pamatinę sistemą`,
        'backendSettings.backendLabel': `Pamatinė sistema`,
        'backendSettings.local': `Vietinė`,
        'backendSettings.cloud': `Debesis (Hugging Face)`,
        'backendSettings.cloudNote': `Vaizdai siunčiami į Hugging Face debesų paslaugą.`,
        'backendSettings.hintPrefix': `Ar norite, kad jūsų vaizdai liktų jūsų tinkle?`,
        'backendSettings.hintLink': `Paleiskite privatų serverį per Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `Naršyklės saugumo politika (CSP) pagal numatytuosius nustatymus leidžia tik`,
        'backendSettings.csp2': `. Norėdami pasiekti vietinę pamatinę sistemą kitu adresu (pvz., savo LAN IP), pridėkite jį prie`,
        'backendSettings.csp3': `sąrašo`,
        'backendSettings.csp4': `faile „Stash“ papildinių aplanke, kitaip užklausos bus užblokuotos. Pastaba: atnaujinus „Visage“ sistema įdiegiama iš naujo`,
        'backendSettings.csp5': `, todėl tai reikia pakartoti po kiekvieno atnaujinimo.`,
        'backendSettings.testing': `Tikrinamas ryšys…`,
        'backendSettings.testConnection': `Patikrinti ryšį`,
        'backendSettings.testingShort': `Tikrinama…`,
        'backendSettings.cancel': `Atšaukti`,
        'backendSettings.save': `Išsaugoti`,
        'backendSettings.feedback.reachable': `Ryšys sėkmingas. Pamatinė sistema paruošta.`,
        'backendSettings.feedback.degraded': `Pamatinė sistema pasiekiama, bet sumažintu režimu (modeliai arba indeksas neįkelti).`,
        'backendSettings.feedback.unreachable': `Pamatinė sistema nepasiekiama. Patikrinkite URL ir įsitikinkite, kad sistema veikia.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `DABARTINIS KADRAS`,
        'faceMatch.close': `Uždaryti`,
        'faceMatch.facesSelected': `Rasta veidų: {faces} · pasirinkta: {selected}`,
        'faceMatch.inScene': `· {count} scenoje`,
        'faceMatch.stashboxMissing': `Stash-box nesukonfigūruotas.`,
        'faceMatch.stashboxMissingBody': ` Pridėkite stash-box teikėją programoje Settings → Metadata Providers, kad įgalintumėte atlikėjų importavimą.`,
        'faceMatch.stashboxWrongName': `Teikėjas „StashDB“ nerastas.`,
        'faceMatch.stashboxWrongNameBody': ` Atlikėjų importavimui reikia teikėjo, pavadinto „StashDB“. Pervadinkite teikėją programoje Settings → Metadata Providers.`,
        'faceMatch.learnMore': `Sužinoti daugiau.`,
        'faceMatch.scanning': `Skenuojama • veidų atpažinimas…`,
        'faceMatch.faceAlt': `Veidas {index}`,
        'faceMatch.minConf': `Min. patik.`,
        'faceMatch.minConfTitle': `Minimalus patikimumas: {percent}%`,
        'faceMatch.detected': `Aptikta`,
        'faceMatch.detectedFaceAlt': `Aptiktas veidas`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Paremkite per Patreon`,
        'faceMatch.ofSelected': `Pasirinkta {selected} iš {total}`,
        'faceMatch.allInScene': `Rasta veidų: {total} · visi scenoje`,
        'faceMatch.clickToSelect': `Rasta veidų: {total} · spustelėkite, kad pasirinktumėte`,
        'faceMatch.kbSwitch': `Veidų perjungimas`,
        'faceMatch.kbSelect': `Atlikėjų pasirinkimas`,
        'faceMatch.kbToggle': `Perjungti pasirinkimą`,
        'faceMatch.kbAddInstant': `Shift+spustelėjimas, kad pridėtumėte iš karto`,
        'faceMatch.selectBest': `Pasirinkti geriausius atitikmenis`,
        'faceMatch.adding': `Pridedama...`,
        'faceMatch.done': `Atlikta ({count})`,
        'faceMatch.toast.added': `Atlikėjas pridėtas į {target}.`,
        'faceMatch.toast.addError': `Nepavyko pridėti atlikėjo: {error}`,
        'faceMatch.toast.noStashbox': `Stash-box nesukonfigūruotas. Pridėkite stash-box teikėją programoje Settings → Metadata Providers, kad įgalintumėte atlikėjų importavimą. Žr. {url}`,
        'faceMatch.toast.noProvider': `Teikėjas „StashDB“ nerastas. Pervadinkite teikėją į „StashDB“ programoje Settings → Metadata Providers, kad įgalintumėte atlikėjų importavimą.`,
        'faceMatch.toast.configureProvider': `Sukonfigūruokite stash-box teikėją programoje Settings → Metadata Providers, kad įgalintumėte atlikėjų importavimą.`,
        'faceMatch.toast.addedMultiple': `Pridėta atlikėjų: {count} į {target}.`,
        'sprite.title': `SCENOS ATLIKĖJAI`,
        'sprite.close': `Uždaryti`,
        'sprite.foundConfirmed': `Rasta: {found} · patvirtinta: {confirmed}`,
        'sprite.confidence': `patikimumas`,
        'sprite.name': `vardas`,
        'sprite.hits': `pataikymai`,
        'sprite.minConf': `Min. patik.`,
        'sprite.minConfTitle': `Minimalus patikimumas: {percent}%`,
        'sprite.scanning': `Visage skenavimas…`,
        'sprite.cancel': `Atšaukti`,
        'sprite.empty': `Šiame sprite neidentifikuota atlikėjų.`,
        'sprite.detectedFaceAlt': `Aptiktas veidas`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `Scenoje`,
        'sprite.hitsCount': `Pataikymų: {count}`,
        'sprite.totalTime': `Iš viso {time}`,
        'sprite.alreadyInScene': `Jau scenoje`,
        'sprite.clickToConfirm': `Spustelėkite, kad patvirtintumėte`,
        'sprite.confirmed': `Patvirtinta`,
        'sprite.supportPatreon': `Paremkite per Patreon`,
        'sprite.confirmedCount': `Patvirtinta {confirmed} iš {total}`,
        'sprite.shownHint': `Rodyta: {shown} (iš viso {total}) · spustelėkite, kad patvirtintumėte · ←→ navigacija · Enter patvirtinimas`,
        'sprite.confirmHint': `Spustelėkite, kad patvirtintumėte · ←→ navigacija · Enter patvirtinimas`,
        'sprite.adding': `Pridedama...`,
        'sprite.done': `Atlikta ({count})`,
        'gender.male': `Vyras`,
        'gender.female': `Moteris`,
        'gender.transMale': `Translytis vyras`,
        'gender.transFemale': `Translytė moteris`,
        'gender.nonBinary': `Ne dvinaris`,
        'gender.intersex': `Interseksas`,
        'card.excellent': `Puikus atitikmuo`,
        'card.good': `Geras atitikmuo`,
        'card.uncertain': `Neaiškus atitikmuo`,
        'card.select': `Pasirinkti {name}`,
        'card.deselect': `Panaikinti {name} pasirinkimą`,
        'card.openOn': `Atidaryti svetainėje {source}`,
        'search.overlayHint': `Vilkite, kad pasirinktumėte veidą — Enter, kad nuskaitytumėte visą kadrą — Esc, kad atšauktumėte`,
        'search.noFaces': `Pasirinktoje srityje veidų nerasta. Bandykite tankesnį kadrą arba paspauskite Enter, kad nuskaitytumėte visą kadrą.`,
        'search.captureMediaFail': `Nepavyko užfiksuoti medijos. Įsitikinkite, kad scena/vaizdas visiškai įkeltas.`,
        'search.healthBanner': `Veidų atpažinimo API nepasiekiama. Paleiskite pamatinę sistemą ir bandykite dar kartą.`,
        'search.failed': `Veido paieška nepavyko: {error}`,
        'search.fetchImageFail': `Nepavyko gauti vaizdo iš Stash.`,
        'search.captureFail': `Nepavyko užfiksuoti vaizdo: {error}`,
        'search.selectFaceImage': `Pasirinkite veidą vaizde.`,
        'search.captureFrameFail': `Nepavyko užfiksuoti dabartinio kadro.`,
        'search.captureFrameFail2': `Klaida fiksuojant dabartinį kadrą.`,
        'search.selectFaceVideo': `Pasirinkite veidą vaizdo grotuvo srityje.`,
        'search.menuItemTitle': `Vilkite langelį aplink veidą arba paspauskite Enter, kad nuskaitytumėte visą kadrą, ir ieškokite atitikmenų StashDB`,
        'search.currentFrame': `Visage: dabartinis kadras`,
        'scene.noSprite': `Šiai scenai nerastas nei sprite lapas, nei peržiūros vaizdo įrašas. Sugeneruokite juos scenos nustatymuose ir bandykite dar kartą.`,
        'scene.noFaces': `Šios scenos sprite lape arba peržiūros vaizdo įraše nerasta veidų ar atlikėjų.`,
        'scene.healthBanner': `Veidų atpažinimo API nepasiekiama. Paleiskite pamatinę sistemą ir bandykite dar kartą.`,
        'scene.failed': `Scenos nuskaitymas nepavyko: {error}`,
        'scene.menuItemTitle': `Identifikuokite kiekvieną atlikėją scenoje (reikia sugeneruoto sprite lapo arba peržiūros vaizdo įrašo)`,
        'scene.wholeScene': `Visage: visa scena`,
        'banner.changeBackend': `Keisti pamatinę sistemą`,
        'banner.dismiss': `Atmesti`,
        'error.dismiss': `Atmesti`,
        'firstRun.title': `Nustatykite savo Visage pamatinę sistemą`,
        'firstRun.subtitle': `Visage siunčia veidų vaizdus į pamatinę sistemą atpažinimui. Pasirinkite, kur ją paleisti.`,
        'firstRun.cloud': `Naudoti Hugging Face debesį`,
        'firstRun.cloudNote': `Be jokios sąrankos. Vaizdai siunčiami į Hugging Face debesų paslaugą.`,
        'firstRun.local': `Naudoti savo serverį`,
        'firstRun.localNote': `Paleiskite privatų vykdomąjį failą savo kompiuteryje arba tinkle.`,
        'firstRun.skip': `Praleisti kol kas`,
        'badge.local': `Vietinė`,
        'badge.cloud': `Debesis (Hugging Face)`,
        'badge.title': `Visage pamatinė sistema: {label}`,
        'donate.enjoying': `Patinka Visage? Padėkite jį išlaikyti`,
        'donate.supportPatreon': `Paremkite per Patreon`,
        'frame.close': `Uždaryti kadro pasirinkiklį`,
        'frame.seekFail': `Nepavyko persukti vaizdo grotuvo.`,
        'frame.selectAt': `Pasirinkti veido kadrą {time} s`,
    };

    // Spanish. Missing keys fall back to English automatically.
    const es = {
        // ---- BackendSettings.tsx ----
        'backendSettings.title': `Configuración del backend`,
        'backendSettings.closeAria': `Cerrar configuración`,
        'backendSettings.backendAria': `Configuración del backend`,
        'backendSettings.changeBackend': `Cambiar backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Local`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Las imágenes se envían al servicio en la nube de Hugging Face.`,
        'backendSettings.hintPrefix': `¿Quieres que tus imágenes permanezcan en tu red?`,
        'backendSettings.hintLink': `Ejecuta un servidor privado mediante Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `La política de seguridad (CSP) del navegador solo permite`,
        'backendSettings.csp2': `por defecto. Para alcanzar un backend local en otra dirección (p. ej. tu IP LAN), añádela a la`,
        'backendSettings.csp3': `lista en el`,
        'backendSettings.csp4': `archivo dentro de tu carpeta de plugins de Stash; de lo contrario, las solicitudes se bloquearán. Nota: actualizar Visage reinstala`,
        'backendSettings.csp5': `, por lo que esto debe volver a aplicarse tras cada actualización.`,
        'backendSettings.testing': `Probando la conexión…`,
        'backendSettings.testConnection': `Probar conexión`,
        'backendSettings.testingShort': `Probando…`,
        'backendSettings.cancel': `Cancelar`,
        'backendSettings.save': `Guardar`,
        'backendSettings.feedback.reachable': `Conexión exitosa. El backend está listo.`,
        'backendSettings.feedback.degraded': `Backend accesible pero degradado (modelos o índice no cargados).`,
        'backendSettings.feedback.unreachable': `Backend inaccesible. Comprueba la URL y que el backend esté en ejecución.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        // ---- FaceMatchModal.tsx ----
        'faceMatch.title': `FOTO ACTUAL`,
        'faceMatch.close': `Cerrar`,
        'faceMatch.facesSelected': `{faces} caras encontradas · {selected} seleccionadas`,
        'faceMatch.inScene': `· {count} en la escena`,
        'faceMatch.stashboxMissing': `No hay stash-box configurado.`,
        'faceMatch.stashboxMissingBody': ` Añade un proveedor stash-box en Configuración → Proveedores de metadatos para activar la importación de intérpretes.`,
        'faceMatch.stashboxWrongName': `No se encontró ningún proveedor llamado "StashDB".`,
        'faceMatch.stashboxWrongNameBody': ` La importación de intérpretes requiere un proveedor llamado "StashDB". Renombra tu proveedor en Configuración → Proveedores de metadatos.`,
        'faceMatch.learnMore': `Más información.`,
        'faceMatch.scanning': `Escaneando • reconocimiento facial…`,
        'faceMatch.faceAlt': `Cara {index}`,
        'faceMatch.minConf': `Conf. mín.`,
        'faceMatch.minConfTitle': `Confianza mínima: {percent}%`,
        'faceMatch.detected': `Detectada`,
        'faceMatch.detectedFaceAlt': `Cara detectada`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Apoyar en Patreon`,
        'faceMatch.ofSelected': `{selected} de {total} seleccionadas`,
        'faceMatch.allInScene': `{total} caras encontradas · todas en la escena`,
        'faceMatch.clickToSelect': `{total} caras encontradas · haz clic para seleccionar`,
        'faceMatch.kbSwitch': `Cambiar caras`,
        'faceMatch.kbSelect': `Seleccionar intérpretes`,
        'faceMatch.kbToggle': `Alternar selección`,
        'faceMatch.kbAddInstant': `Mayús+clic para añadir al instante`,
        'faceMatch.selectBest': `Seleccionar mejores coincidencias`,
        'faceMatch.adding': `Añadiendo...`,
        'faceMatch.done': `Hecho ({count})`,
        'faceMatch.toast.added': `Intérprete añadido a {target}.`,
        'faceMatch.toast.addError': `Error al añadir el intérprete: {error}`,
        'faceMatch.toast.noStashbox': `No hay stash-box configurado. Añade un proveedor stash-box en Configuración → Proveedores de metadatos para activar la importación de intérpretes. Ver {url}`,
        'faceMatch.toast.noProvider': `No se encontró ningún proveedor llamado "StashDB". Renombra tu proveedor a "StashDB" en Configuración → Proveedores de metadatos para activar la importación de intérpretes.`,
        'faceMatch.toast.configureProvider': `Configura un proveedor stash-box en Configuración → Proveedores de metadatos para activar la importación de intérpretes.`,
        'faceMatch.toast.addedMultiple': `{count} intérprete{s} añadido{s} a {target}.`,
        // ---- SpriteResultModal.tsx ----
        'sprite.title': `INTÉRPRETES DE LA ESCENA`,
        'sprite.close': `Cerrar`,
        'sprite.foundConfirmed': `{found} encontrados · {confirmed} confirmados`,
        'sprite.confidence': `confianza`,
        'sprite.name': `nombre`,
        'sprite.hits': `aciertos`,
        'sprite.minConf': `Conf. mín.`,
        'sprite.minConfTitle': `Confianza mínima: {percent}%`,
        'sprite.scanning': `Visage escaneando…`,
        'sprite.cancel': `Cancelar`,
        'sprite.empty': `No se identificaron intérpretes en este sprite.`,
        'sprite.detectedFaceAlt': `Cara detectada`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `En la escena`,
        'sprite.hitsCount': `{count} acierto{s}`,
        'sprite.totalTime': `{time} en total`,
        'sprite.alreadyInScene': `Ya en la escena`,
        'sprite.clickToConfirm': `Haz clic para confirmar`,
        'sprite.confirmed': `Confirmado`,
        'sprite.supportPatreon': `Apoyar en Patreon`,
        'sprite.confirmedCount': `{confirmed} de {total} confirmados`,
        'sprite.shownHint': `{shown} mostrados ({total} en total) · haz clic para confirmar · ←→ navegar · Enter confirmar`,
        'sprite.confirmHint': `Haz clic para confirmar · ←→ navegar · Enter confirmar`,
        'sprite.adding': `Añadiendo...`,
        'sprite.done': `Hecho ({count})`,
        // ---- PerformerCard.tsx ----
        'gender.male': `Masculino`,
        'gender.female': `Femenino`,
        'gender.transMale': `Hombre transgénero`,
        'gender.transFemale': `Mujer transgénero`,
        'gender.nonBinary': `No binario`,
        'gender.intersex': `Intersexual`,
        'card.excellent': `Coincidencia excelente`,
        'card.good': `Buena coincidencia`,
        'card.uncertain': `Coincidencia incierta`,
        'card.select': `Seleccionar a {name}`,
        'card.deselect': `Deseleccionar a {name}`,
        'card.openOn': `Abrir en {source}`,
        // ---- FaceSearchButton.tsx ----
        'search.overlayHint': `Arrastra para seleccionar una cara — Enter para escanear toda la foto — Esc para cancelar`,
        'search.noFaces': `No se encontraron caras en esa selección. Prueba con un recorte más ajustado o pulsa Enter para escanear toda la foto.`,
        'search.captureMediaFail': `No se pudo capturar el medio. Asegúrate de que la escena/imagen esté completamente cargada.`,
        'search.healthBanner': `La API de reconocimiento facial no está accesible. Inicia el backend e inténtalo de nuevo.`,
        'search.failed': `La búsqueda de caras falló: {error}`,
        'search.fetchImageFail': `No se pudo obtener la imagen desde Stash.`,
        'search.captureFail': `Error al capturar la imagen: {error}`,
        'search.selectFaceImage': `Selecciona una cara dentro de la imagen.`,
        'search.captureFrameFail': `No se pudo capturar el fotograma actual.`,
        'search.captureFrameFail2': `Error al capturar el fotograma actual.`,
        'search.selectFaceVideo': `Selecciona una cara dentro del área del reproductor de vídeo.`,
        'search.menuItemTitle': `Arrastra un recuadro alrededor de una cara o pulsa Enter para escanear toda la foto, para buscar coincidencias en StashDB`,
        'search.currentFrame': `Visage: Fotograma actual`,
        // ---- SceneScanButton.tsx ----
        'scene.noSprite': `No se encontró ninguna hoja de sprites ni vídeo de vista previa para esta escena. Genéralos en la configuración de la escena y vuelve a intentarlo.`,
        'scene.noFaces': `No se encontraron caras ni intérpretes en la hoja de sprites o el vídeo de vista previa de esta escena.`,
        'scene.healthBanner': `La API de reconocimiento facial no está accesible. Inicia el backend e inténtalo de nuevo.`,
        'scene.failed': `El escaneo de la escena falló: {error}`,
        'scene.menuItemTitle': `Identificar a cada intérprete de la escena (requiere una hoja de sprites o un vídeo de vista previa generados)`,
        'scene.wholeScene': `Visage: Escena completa`,
        // ---- BackendHealthBanner.tsx ----
        'banner.changeBackend': `Cambiar backend`,
        'banner.dismiss': `Descartar`,
        // ---- ErrorDialog.tsx ----
        'error.dismiss': `Descartar`,
        // ---- FirstRunDialog.tsx ----
        'firstRun.title': `Configura tu backend de Visage`,
        'firstRun.subtitle': `Visage envía imágenes de caras a un backend para su reconocimiento. Elige dónde ejecutarlo.`,
        'firstRun.cloud': `Usar el cloud de Hugging Face`,
        'firstRun.cloudNote': `Sin configuración. Las imágenes se envían al servicio en la nube de Hugging Face.`,
        'firstRun.local': `Usar mi propio servidor`,
        'firstRun.localNote': `Ejecuta el binario privado en tu propia máquina o red.`,
        'firstRun.skip': `Omitir por ahora`,
        // ---- BackendBadge.tsx ----
        'badge.local': `Local`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Backend de Visage: {label}`,
        // ---- DonateFooter.tsx ----
        'donate.enjoying': `¿Te gusta Visage? Ayuda a mantenerlo vivo`,
        'donate.supportPatreon': `Apoyar en Patreon`,
        // ---- FaceFrameSelector.tsx ----
        'frame.close': `Cerrar selector de fotograma`,
        'frame.seekFail': `Error al buscar en el reproductor de vídeo.`,
        'frame.selectAt': `Seleccionar cara en {time}s`,
    };

    const ar = {
        'backendSettings.title': `إعدادات الواجهة الخلفية`,
        'backendSettings.closeAria': `إغلاق الإعدادات`,
        'backendSettings.backendAria': `إعدادات الواجهة الخلفية`,
        'backendSettings.changeBackend': `تغيير الواجهة الخلفية`,
        'backendSettings.backendLabel': `الواجهة الخلفية`,
        'backendSettings.local': `محلي`,
        'backendSettings.cloud': `سحابة (Hugging Face)`,
        'backendSettings.cloudNote': `يتم إرسال الصور إلى خدمة سحابة Hugging Face.`,
        'backendSettings.hintPrefix': `تريد إبقاء صورك داخل شبكتك؟`,
        'backendSettings.hintLink': `شغّل خادمًا خاصًا عبر Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `تسمح سياسة أمان المتصفح (CSP) فقط بـ`,
        'backendSettings.csp2': `افتراضيًا. للوصول إلى واجهة خلفية محلية على عنوان آخر (مثل IP شبكة LAN الخاصة بك)، أضفها إلى`,
        'backendSettings.csp3': `في`,
        'backendSettings.csp4': `داخل مجلد إضافات Stash لديك، وإلا فسيتم حظر الطلبات. ملاحظة: تحديث Visage يعيد تثبيت`,
        'backendSettings.csp5': `، لذا يجب إعادة تطبيق هذا بعد كل تحديث.`,
        'backendSettings.testing': `جارٍ اختبار الاتصال…`,
        'backendSettings.testConnection': `اختبار الاتصال`,
        'backendSettings.testingShort': `جارٍ الاختبار…`,
        'backendSettings.cancel': `إلغاء`,
        'backendSettings.save': `حفظ`,
        'backendSettings.feedback.reachable': `تم الاتصال بنجاح. الواجهة الخلفية جاهزة.`,
        'backendSettings.feedback.degraded': `الواجهة الخلفية قابلة للوصول لكنها متدهورة (النماذج أو الفهرس غير محمّل).`,
        'backendSettings.feedback.unreachable': `الواجهة الخلفية غير قابلة للوصول. تحقق من URL وتأكد من أن الواجهة الخلفية تعمل.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `الإطار الحالي`,
        'faceMatch.close': `إغلاق`,
        'faceMatch.facesSelected': `تم العثور على {faces} وجهًا · تم اختيار {selected}`,
        'faceMatch.inScene': `· {count} في المشهد`,
        'faceMatch.stashboxMissing': `لا يوجد stash-box مُهيأ.`,
        'faceMatch.stashboxMissingBody': ` أضف موفّر stash-box في الإعدادات ← موفّرو البيانات الوصفية لتفعيل استيراد المؤدين.`,
        'faceMatch.stashboxWrongName': `لم يتم العثور على موفّر "StashDB".`,
        'faceMatch.stashboxWrongNameBody': ` يتطلب استيراد المؤدين موفّرًا باسم "StashDB". أعد تسمية الموفّر لديك في الإعدادات ← موفّرو البيانات الوصفية.`,
        'faceMatch.learnMore': `اعرف المزيد.`,
        'faceMatch.scanning': `جارٍ المسح • التعرف على الوجوه…`,
        'faceMatch.faceAlt': `الوجه {index}`,
        'faceMatch.minConf': `أدنى ثقة`,
        'faceMatch.minConfTitle': `أدنى ثقة: {percent}%`,
        'faceMatch.detected': `تم اكتشافه`,
        'faceMatch.detectedFaceAlt': `الوجه المكتشف`,
        'faceMatch.vs': `ضد`,
        'faceMatch.supportPatreon': `ادعمنا على Patreon`,
        'faceMatch.ofSelected': `تم اختيار {selected} من أصل {total}`,
        'faceMatch.allInScene': `تم العثور على {total} وجهًا · جميعها في المشهد`,
        'faceMatch.clickToSelect': `تم العثور على {total} وجهًا · انقر للاختيار`,
        'faceMatch.kbSwitch': `تبديل الوجوه`,
        'faceMatch.kbSelect': `اختيار المؤدين`,
        'faceMatch.kbToggle': `تبديل التحديد`,
        'faceMatch.kbAddInstant': `Shift+نقرة للإضافة فورًا`,
        'faceMatch.selectBest': `اختيار أفضل التطابقات`,
        'faceMatch.adding': `جارٍ الإضافة...`,
        'faceMatch.done': `تم ({count})`,
        'faceMatch.toast.added': `تمت إضافة المؤدي إلى {target}.`,
        'faceMatch.toast.addError': `فشل إضافة المؤدي: {error}`,
        'faceMatch.toast.noStashbox': `لا يوجد stash-box مُهيأ. أضف موفّر stash-box في الإعدادات ← موفّرو البيانات الوصفية لتفعيل استيراد المؤدين. انظر {url}`,
        'faceMatch.toast.noProvider': `لم يتم العثور على موفّر باسم "StashDB". أعد تسمية الموفّر لديك إلى "StashDB" في الإعدادات ← موفّرو البيانات الوصفية لتفعيل استيراد المؤدين.`,
        'faceMatch.toast.configureProvider': `هيّئ موفّر stash-box في الإعدادات ← موفّرو البيانات الوصفية لتفعيل استيراد المؤدين.`,
        'faceMatch.toast.addedMultiple': `تمت إضافة {count} من المؤدين{s} إلى {target}.`,
        'sprite.title': `مؤدو المشهد`,
        'sprite.close': `إغلاق`,
        'sprite.foundConfirmed': `تم العثور على {found} · تم تأكيد {confirmed}`,
        'sprite.confidence': `الثقة`,
        'sprite.name': `الاسم`,
        'sprite.hits': `الإصابات`,
        'sprite.minConf': `أدنى ثقة`,
        'sprite.minConfTitle': `أدنى ثقة: {percent}%`,
        'sprite.scanning': `Visage يمسح…`,
        'sprite.cancel': `إلغاء`,
        'sprite.empty': `لم يتم تحديد أي مؤدٍ في هذه اللقطة (sprite).`,
        'sprite.detectedFaceAlt': `الوجه المكتشف`,
        'sprite.spriteLabel': `اللقطة`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `ضد`,
        'sprite.inScene': `في المشهد`,
        'sprite.hitsCount': `{count} إصابة{s}`,
        'sprite.totalTime': `{time} إجمالي`,
        'sprite.alreadyInScene': `موجود بالفعل في المشهد`,
        'sprite.clickToConfirm': `انقر للتأكيد`,
        'sprite.confirmed': `مؤكد`,
        'sprite.supportPatreon': `ادعمنا على Patreon`,
        'sprite.confirmedCount': `تم تأكيد {confirmed} من أصل {total}`,
        'sprite.shownHint': `يُعرض {shown} (إجمالي {total}) · انقر للتأكيد · ←→ تنقّل · Enter للتأكيد`,
        'sprite.confirmHint': `انقر للتأكيد · ←→ تنقّل · Enter للتأكيد`,
        'sprite.adding': `جارٍ الإضافة...`,
        'sprite.done': `تم ({count})`,
        'gender.male': `ذكر`,
        'gender.female': `أنثى`,
        'gender.transMale': `رجل متحول جنسيًا`,
        'gender.transFemale': `امرأة متحولة جنسيًا`,
        'gender.nonBinary': `غير ثنائي`,
        'gender.intersex': `ثنائيو الجنس`,
        'card.excellent': `تطابق ممتاز`,
        'card.good': `تطابق جيد`,
        'card.uncertain': `تطابق غير مؤكد`,
        'card.select': `اختيار {name}`,
        'card.deselect': `إلغاء اختيار {name}`,
        'card.openOn': `فتح على {source}`,
        'search.overlayHint': `اسحب لتحديد وجه — Enter لمسح الإطار بأكمله — Esc للإلغاء`,
        'search.noFaces': `لم يتم العثور على وجوه في هذا التحديد. جرّب اقتصاصًا أدق، أو اضغط Enter لمسح الإطار بأكمله.`,
        'search.captureMediaFail': `تعذّر التقاط الوسائط. يرجى التأكد من تحميل المشهد/الصورة بالكامل.`,
        'search.healthBanner': `واجهة برمجة تطبيقات التعرف على الوجوه غير قابلة للوصول. ابدأ الواجهة الخلفية وحاول مرة أخرى.`,
        'search.failed': `فشل البحث عن الوجوه: {error}`,
        'search.fetchImageFail': `تعذّر جلب الصورة من Stash.`,
        'search.captureFail': `فشل التقاط الصورة: {error}`,
        'search.selectFaceImage': `اختر وجهًا داخل الصورة.`,
        'search.captureFrameFail': `تعذّر التقاط الإطار الحالي.`,
        'search.captureFrameFail2': `فشل التقاط الإطار الحالي.`,
        'search.selectFaceVideo': `اختر وجهًا داخل منطقة مشغّل الفيديو.`,
        'search.menuItemTitle': `اسحب صندوقًا حول وجه، أو اضغط Enter لمسح الإطار بأكمله، للبحث عن تطابقات في StashDB`,
        'search.currentFrame': `Visage: الإطار الحالي`,
        'scene.noSprite': `لا توجد لوحة لقطات (sprite sheet) أو فيديو معاينة لهذا المشهد. أنشئها في إعدادات المشهد، ثم حاول مرة أخرى.`,
        'scene.noFaces': `لم يتم العثور على وجوه أو مؤدين في لوحة اللقطات أو فيديو المعاينة لهذا المشهد.`,
        'scene.healthBanner': `واجهة برمجة تطبيقات التعرف على الوجوه غير قابلة للوصول. ابدأ الواجهة الخلفية وحاول مرة أخرى.`,
        'scene.failed': `فشل مسح المشهد: {error}`,
        'scene.menuItemTitle': `حدد كل مؤدٍ في المشهد (يتطلب لوحة لقطات أو فيديو معاينة مُنشأ)`,
        'scene.wholeScene': `Visage: المشهد بأكمله`,
        'banner.changeBackend': `تغيير الواجهة الخلفية`,
        'banner.dismiss': `إغلاق`,
        'error.dismiss': `إغلاق`,
        'firstRun.title': `إعداد الواجهة الخلفية لـ Visage`,
        'firstRun.subtitle': `يرسل Visage صور الوجوه إلى الواجهة الخلفية للتعرف عليها. اختر مكان تشغيلها.`,
        'firstRun.cloud': `استخدام سحابة Hugging Face`,
        'firstRun.cloudNote': `بدون أي إعداد. تُرسل الصور إلى خدمة سحابة Hugging Face.`,
        'firstRun.local': `استخدام الخادم الخاص بي`,
        'firstRun.localNote': `شغّل البرنامج الخاص على جهازك أو شبكتك.`,
        'firstRun.skip': `تخطي الآن`,
        'badge.local': `محلي`,
        'badge.cloud': `سحابة (Hugging Face)`,
        'badge.title': `الواجهة الخلفية لـ Visage: {label}`,
        'donate.enjoying': `تستمتع بـ Visage؟ ساعد في إبقائه حيًا`,
        'donate.supportPatreon': `ادعمنا على Patreon`,
        'frame.close': `إغلاق محدد الإطار`,
        'frame.seekFail': `فشل الانتقال في مشغّل الفيديو.`,
        'frame.selectAt': `اختر إطار الوجه عند {time} ثانية`,
    };

    // French. Missing keys fall back to English automatically.
    const fr = {
        // ---- BackendSettings.tsx ----
        'backendSettings.title': `Paramètres du backend`,
        'backendSettings.closeAria': `Fermer les paramètres`,
        'backendSettings.backendAria': `Paramètres du backend`,
        'backendSettings.changeBackend': `Changer de backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Local`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Les images sont envoyées au service cloud Hugging Face.`,
        'backendSettings.hintPrefix': `Vous voulez que vos images restent sur votre réseau ?`,
        'backendSettings.hintLink': `Exécuter un serveur privé via Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `La politique de sécurité (CSP) du navigateur n'autorise que`,
        'backendSettings.csp2': `par défaut. Pour joindre un backend local sur une autre adresse (p. ex. votre IP LAN), ajoutez-la à la`,
        'backendSettings.csp3': `liste dans le`,
        'backendSettings.csp4': `fichier dans votre dossier de plugins Stash, sinon les requêtes seront bloquées. Remarque : une mise à jour de Visage réinstalle`,
        'backendSettings.csp5': `, donc cela doit être réappliqué après chaque mise à jour.`,
        'backendSettings.testing': `Test de la connexion…`,
        'backendSettings.testConnection': `Tester la connexion`,
        'backendSettings.testingShort': `Test en cours…`,
        'backendSettings.cancel': `Annuler`,
        'backendSettings.save': `Enregistrer`,
        'backendSettings.feedback.reachable': `Connexion réussie. Le backend est prêt.`,
        'backendSettings.feedback.degraded': `Backend joignable mais dégradé (modèles ou index non chargés).`,
        'backendSettings.feedback.unreachable': `Backend injoignable. Vérifiez l'URL et que le backend est en cours d'exécution.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        // ---- FaceMatchModal.tsx ----
        'faceMatch.title': `IMAGE ACTUELLE`,
        'faceMatch.close': `Fermer`,
        'faceMatch.facesSelected': `{faces} visages trouvés · {selected} sélectionnés`,
        'faceMatch.inScene': `· {count} dans la scène`,
        'faceMatch.stashboxMissing': `Aucun stash-box configuré.`,
        'faceMatch.stashboxMissingBody': ` Ajoutez un fournisseur stash-box dans Paramètres → Fournisseurs de métadonnées pour activer l'import d'interprètes.`,
        'faceMatch.stashboxWrongName': `Aucun fournisseur nommé « StashDB » trouvé.`,
        'faceMatch.stashboxWrongNameBody': ` L'import d'interprètes nécessite un fournisseur nommé « StashDB ». Renommez votre fournisseur dans Paramètres → Fournisseurs de métadonnées.`,
        'faceMatch.learnMore': `En savoir plus.`,
        'faceMatch.scanning': `Analyse • reconnaissance faciale…`,
        'faceMatch.faceAlt': `Visage {index}`,
        'faceMatch.minConf': `Conf. min.`,
        'faceMatch.minConfTitle': `Confiance minimale : {percent}%`,
        'faceMatch.detected': `Détecté`,
        'faceMatch.detectedFaceAlt': `Visage détecté`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Soutenir sur Patreon`,
        'faceMatch.ofSelected': `{selected} sur {total} sélectionnés`,
        'faceMatch.allInScene': `{total} visages trouvés · tous dans la scène`,
        'faceMatch.clickToSelect': `{total} visages trouvés · cliquer pour sélectionner`,
        'faceMatch.kbSwitch': `Changer de visage`,
        'faceMatch.kbSelect': `Sélectionner les interprètes`,
        'faceMatch.kbToggle': `Basculer la sélection`,
        'faceMatch.kbAddInstant': `Maj+clic pour ajouter instantanément`,
        'faceMatch.selectBest': `Sélectionner les meilleures correspondances`,
        'faceMatch.adding': `Ajout...`,
        'faceMatch.done': `Terminé ({count})`,
        'faceMatch.toast.added': `Interprète ajouté à la {target}.`,
        'faceMatch.toast.addError': `Échec de l'ajout de l'interprète : {error}`,
        'faceMatch.toast.noStashbox': `Aucun stash-box configuré. Ajoutez un fournisseur stash-box dans Paramètres → Fournisseurs de métadonnées pour activer l'import d'interprètes. Voir {url}`,
        'faceMatch.toast.noProvider': `Aucun fournisseur nommé « StashDB » trouvé. Renommez votre fournisseur en « StashDB » dans Paramètres → Fournisseurs de métadonnées pour activer l'import d'interprètes.`,
        'faceMatch.toast.configureProvider': `Configurez un fournisseur stash-box dans Paramètres → Fournisseurs de métadonnées pour activer l'import d'interprètes.`,
        'faceMatch.toast.addedMultiple': `{count} interprète{s} ajouté{s} à la {target}.`,
        // ---- SpriteResultModal.tsx ----
        'sprite.title': `INTERPRÈTES DE LA SCÈNE`,
        'sprite.close': `Fermer`,
        'sprite.foundConfirmed': `{found} trouvé{s} · {confirmed} confirmé{s}`,
        'sprite.confidence': `confiance`,
        'sprite.name': `nom`,
        'sprite.hits': `occurrences`,
        'sprite.minConf': `Conf. min.`,
        'sprite.minConfTitle': `Confiance minimale : {percent}%`,
        'sprite.scanning': `Analyse Visage…`,
        'sprite.cancel': `Annuler`,
        'sprite.empty': `Aucun interprète identifié dans ce sprite.`,
        'sprite.detectedFaceAlt': `Visage détecté`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `Dans la scène`,
        'sprite.hitsCount': `{count} occurrence{s}`,
        'sprite.totalTime': `{time} au total`,
        'sprite.alreadyInScene': `Déjà dans la scène`,
        'sprite.clickToConfirm': `Cliquer pour confirmer`,
        'sprite.confirmed': `Confirmé`,
        'sprite.supportPatreon': `Soutenir sur Patreon`,
        'sprite.confirmedCount': `{confirmed} sur {total} confirmés`,
        'sprite.shownHint': `{shown} affiché{s} ({total} au total) · cliquer pour confirmer · ←→ naviguer · Enter pour confirmer`,
        'sprite.confirmHint': `Cliquer pour confirmer · ←→ naviguer · Enter pour confirmer`,
        'sprite.adding': `Ajout...`,
        'sprite.done': `Terminé ({count})`,
        // ---- PerformerCard.tsx ----
        'gender.male': `Homme`,
        'gender.female': `Femme`,
        'gender.transMale': `Homme transgenre`,
        'gender.transFemale': `Femme transgenre`,
        'gender.nonBinary': `Non-binaire`,
        'gender.intersex': `Intersexe`,
        'card.excellent': `Correspondance excellente`,
        'card.good': `Bonne correspondance`,
        'card.uncertain': `Correspondance incertaine`,
        'card.select': `Sélectionner {name}`,
        'card.deselect': `Désélectionner {name}`,
        'card.openOn': `Ouvrir sur {source}`,
        // ---- FaceSearchButton.tsx ----
        'search.overlayHint': `Faites glisser pour sélectionner un visage — Enter pour analyser toute l'image — Esc pour annuler`,
        'search.noFaces': `Aucun visage trouvé dans cette sélection. Essayez un recadrage plus serré ou appuyez sur Enter pour analyser toute l'image.`,
        'search.captureMediaFail': `Impossible de capturer le média. Assurez-vous que la scène/l'image est entièrement chargée.`,
        'search.healthBanner': `L'API de reconnaissance faciale n'est pas joignable. Démarrez le backend et réessayez.`,
        'search.failed': `Échec de la recherche de visage : {error}`,
        'search.fetchImageFail': `Impossible de récupérer l'image depuis Stash.`,
        'search.captureFail': `Échec de la capture de l'image : {error}`,
        'search.selectFaceImage': `Sélectionnez un visage dans l'image.`,
        'search.captureFrameFail': `Impossible de capturer l'image actuelle.`,
        'search.captureFrameFail2': `Échec de la capture de l'image actuelle.`,
        'search.selectFaceVideo': `Sélectionnez un visage dans la zone du lecteur vidéo.`,
        'search.menuItemTitle': `Tracez un cadre autour d'un visage ou appuyez sur Enter pour analyser toute l'image, afin de rechercher des correspondances dans StashDB`,
        'search.currentFrame': `Visage : Image actuelle`,
        // ---- SceneScanButton.tsx ----
        'scene.noSprite': `Aucune feuille de sprite ou vidéo d'aperçu trouvée pour cette scène. Générez-les dans les paramètres de la scène, puis réessayez.`,
        'scene.noFaces': `Aucun visage ou interprète trouvé dans la feuille de sprite ou la vidéo d'aperçu de cette scène.`,
        'scene.healthBanner': `L'API de reconnaissance faciale n'est pas joignable. Démarrez le backend et réessayez.`,
        'scene.failed': `Échec de l'analyse de la scène : {error}`,
        'scene.menuItemTitle': `Identifier chaque interprète de la scène (nécessite une feuille de sprite ou une vidéo d'aperçu générée)`,
        'scene.wholeScene': `Visage : Scène entière`,
        // ---- BackendHealthBanner.tsx ----
        'banner.changeBackend': `Changer de backend`,
        'banner.dismiss': `Ignorer`,
        // ---- ErrorDialog.tsx ----
        'error.dismiss': `Ignorer`,
        // ---- FirstRunDialog.tsx ----
        'firstRun.title': `Configurer votre backend Visage`,
        'firstRun.subtitle': `Visage envoie des images de visage à un backend pour reconnaissance. Choisissez où l'exécuter.`,
        'firstRun.cloud': `Utiliser le cloud Hugging Face`,
        'firstRun.cloudNote': `Aucune configuration requise. Les images sont envoyées au service cloud Hugging Face.`,
        'firstRun.local': `Utiliser mon propre serveur`,
        'firstRun.localNote': `Exécutez le binaire privé sur votre propre machine ou réseau.`,
        'firstRun.skip': `Ignorer pour l'instant`,
        // ---- BackendBadge.tsx ----
        'badge.local': `Local`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Backend Visage : {label}`,
        // ---- DonateFooter.tsx ----
        'donate.enjoying': `Visage vous plaît ? Aidez à le garder en vie`,
        'donate.supportPatreon': `Soutenir sur Patreon`,
        // ---- FaceFrameSelector.tsx ----
        'frame.close': `Fermer le sélecteur d'image`,
        'frame.seekFail': `Échec de la navigation dans le lecteur vidéo.`,
        'frame.selectAt': `Sélectionner le visage à {time}s`,
    };

    // Norwegian Nynorsk.
    const nn = {
        'backendSettings.title': `Backend-innstillingar`,
        'backendSettings.closeAria': `Lukk innstillingar`,
        'backendSettings.backendAria': `Backend-innstillingar`,
        'backendSettings.changeBackend': `Byt backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Lokal`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Bilete vert sende til Hugging Face sky-tenesta.`,
        'backendSettings.hintPrefix': `Vil du at bileta dine skal bli på nettverket ditt?`,
        'backendSettings.hintLink': `Køyr ein privat server via Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': "Sikkerheitspolitikken til nettlesaren (CSP) tillèt berre",
        'backendSettings.csp2': `som standard. For å nå ein lokal backend på ei anna adresse (t.d. LAN-IP-en din) må du leggje han til i`,
        'backendSettings.csp3': `lista i`,
        'backendSettings.csp4': `-fila i Stash-plugins-mappa di, elles vert førespurnadane blokkerte. Merk: oppdatering av Visage installerer`,
        'backendSettings.csp5': `på nytt, så dette må gjerast på nytt etter kvar oppdatering.`,
        'backendSettings.testing': `Testar tilkopling…`,
        'backendSettings.testConnection': `Test tilkopling`,
        'backendSettings.testingShort': `Testar…`,
        'backendSettings.cancel': `Avbryt`,
        'backendSettings.save': `Lagre`,
        'backendSettings.feedback.reachable': `Tilkopling vellukka. Backend er klar.`,
        'backendSettings.feedback.degraded': `Backend er tilgjengeleg, men redusert (modellar eller indeks er ikkje lasta inn).`,
        'backendSettings.feedback.unreachable': `Backend er utilgjengeleg. Sjekk URL-en og at backend køyrer.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `GJELDANDE RAME`,
        'faceMatch.close': `Lukk`,
        'faceMatch.facesSelected': `{faces} andlet funne · {selected} valt`,
        'faceMatch.inScene': `· {count} i scene`,
        'faceMatch.stashboxMissing': `Ingen stash-box konfigurert.`,
        'faceMatch.stashboxMissingBody': ` Legg til ein stash-box-leverandør under Innstillingar → Metadata-leverandørar for å aktivere performer-import.`,
        'faceMatch.stashboxWrongName': `Fann ingen "StashDB"-leverandør.`,
        'faceMatch.stashboxWrongNameBody': ` Performer-import krev ein leverandør som heiter "StashDB". Gje leverandøren nytt namn under Innstillingar → Metadata-leverandørar.`,
        'faceMatch.learnMore': `Les meir.`,
        'faceMatch.scanning': `Skannar • andletsattkjenning…`,
        'faceMatch.faceAlt': `Andlet {index}`,
        'faceMatch.minConf': `Min. konf.`,
        'faceMatch.minConfTitle': `Minimumssikkerheit: {percent}%`,
        'faceMatch.detected': `Funne`,
        'faceMatch.detectedFaceAlt': `Funnent andlet`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Støtt på Patreon`,
        'faceMatch.ofSelected': `{selected} av {total} valt`,
        'faceMatch.allInScene': `{total} andlet funne · alle i scene`,
        'faceMatch.clickToSelect': `{total} andlet funne · klikk for å velje`,
        'faceMatch.kbSwitch': `Bytt andlet`,
        'faceMatch.kbSelect': `Vel performarar`,
        'faceMatch.kbToggle': `Veksle markering`,
        'faceMatch.kbAddInstant': `Shift+klikk for å leggje til med ein gong`,
        'faceMatch.selectBest': `Vel beste treff`,
        'faceMatch.adding': `Legg til...`,
        'faceMatch.done': `Ferdig ({count})`,
        'faceMatch.toast.added': `La til performer i {target}.`,
        'faceMatch.toast.addError': `Kunne ikkje leggje til performer: {error}`,
        'faceMatch.toast.noStashbox': `Ingen stash-box konfigurert. Legg til ein stash-box-leverandør under Innstillingar → Metadata-leverandørar for å aktivere performer-import. Sjå {url}`,
        'faceMatch.toast.noProvider': `Fann ingen leverandør som heiter "StashDB". Gje leverandøren nytt namn til "StashDB" under Innstillingar → Metadata-leverandørar for å aktivere performer-import.`,
        'faceMatch.toast.configureProvider': `Konfigurer ein stash-box-leverandør under Innstillingar → Metadata-leverandørar for å aktivere performer-import.`,
        'faceMatch.toast.addedMultiple': `La til {count} performarar i {target}.`,
        'sprite.title': `SCENE-PERFORMARAR`,
        'sprite.close': `Lukk`,
        'sprite.foundConfirmed': `{found} funne · {confirmed} stadfesta`,
        'sprite.confidence': `sikkerheit`,
        'sprite.name': `namn`,
        'sprite.hits': `treff`,
        'sprite.minConf': `Min. konf.`,
        'sprite.minConfTitle': `Minimumssikkerheit: {percent}%`,
        'sprite.scanning': `Visage skannar…`,
        'sprite.cancel': `Avbryt`,
        'sprite.empty': `Ingen performarar identifisert i denne spriten.`,
        'sprite.detectedFaceAlt': `Funnent andlet`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `I scene`,
        'sprite.hitsCount': `{count} treff`,
        'sprite.totalTime': `{time} totalt`,
        'sprite.alreadyInScene': `Allereie i scene`,
        'sprite.clickToConfirm': `Klikk for å stadfeste`,
        'sprite.confirmed': `Stadfesta`,
        'sprite.supportPatreon': `Støtt på Patreon`,
        'sprite.confirmedCount': `{confirmed} av {total} stadfesta`,
        'sprite.shownHint': `{shown} vist ({total} totalt) · klikk for å stadfeste · ←→ naviger · Enter stadfest`,
        'sprite.confirmHint': `Klikk for å stadfeste · ←→ naviger · Enter stadfest`,
        'sprite.adding': `Legg til...`,
        'sprite.done': `Ferdig ({count})`,
        'gender.male': `Mann`,
        'gender.female': `Kvinne`,
        'gender.transMale': `Transmann`,
        'gender.transFemale': `Transkvinne`,
        'gender.nonBinary': `Ikkje-binær`,
        'gender.intersex': `Intersex`,
        'card.excellent': `Utmerka treff`,
        'card.good': `Godt treff`,
        'card.uncertain': `Usikkert treff`,
        'card.select': `Vel {name}`,
        'card.deselect': `Fravel {name}`,
        'card.openOn': `Opne på {source}`,
        'search.overlayHint': `Dra for å velje eit andlet — Enter for å skanne heile rama — Esc for å avbryte`,
        'search.noFaces': `Ingen andlet funne i utvalet. Prøv ein tettare utskjering, eller trykk Enter for å skanne heile rama.`,
        'search.captureMediaFail': `Kunne ikkje fange mediet. Kontroller at scenen/biletet er fullasta.`,
        'search.healthBanner': `Andletsattkjenning-API-et er ikkje tilgjengeleg. Start backend og prøv igjen.`,
        'search.failed': `Andletsøk mislukkast: {error}`,
        'search.fetchImageFail': `Kunne ikkje hente bilete frå Stash.`,
        'search.captureFail': `Kunne ikkje fange bilete: {error}`,
        'search.selectFaceImage': `Vel eit andlet i biletet.`,
        'search.captureFrameFail': `Kunne ikkje fange gjeldande rame.`,
        'search.captureFrameFail2': `Innfanging av gjeldande rame mislukkast.`,
        'search.selectFaceVideo': `Vel eit andlet i videoavspelarområdet.`,
        'search.menuItemTitle': `Dra ein boks rundt eit andlet, eller trykk Enter for å skanne heile rama, for å søkje StashDB etter treff`,
        'search.currentFrame': `Visage: Gjeldande rame`,
        'scene.noSprite': `Fann ingen sprite-ark eller forhåndsvisingsvideo for denne scenen. Generer dei i Scene-innstillingane, og prøv igjen.`,
        'scene.noFaces': `Fann ingen andlet eller performarar i sprite-arket eller forhåndsvisingsvideoen til denne scenen.`,
        'scene.healthBanner': `Andletsattkjenning-API-et er ikkje tilgjengeleg. Start backend og prøv igjen.`,
        'scene.failed': `Scene-skanning mislukkast: {error}`,
        'scene.menuItemTitle': `Identifiser kvar performer i scenen (krev eit generert sprite-ark eller ein forhåndsvisingsvideo)`,
        'scene.wholeScene': `Visage: Heile scenen`,
        'banner.changeBackend': `Byt backend`,
        'banner.dismiss': `Avvis`,
        'error.dismiss': `Avvis`,
        'firstRun.title': `Set opp Visage-backend-en din`,
        'firstRun.subtitle': `Visage sender andletsbilete til ein backend for attkjenning. Vel kor han skal køyre.`,
        'firstRun.cloud': `Bruk Hugging Face cloud`,
        'firstRun.cloudNote': `Ingen oppsett. Bilete vert sende til Hugging Face sky-tenesta.`,
        'firstRun.local': `Bruk min eigen server`,
        'firstRun.localNote': `Køyr den private binæren på di eiga maskin eller ditt nettverk.`,
        'firstRun.skip': `Hopp over for no`,
        'badge.local': `Lokal`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Visage-backend: {label}`,
        'donate.enjoying': `Liker du Visage? Hjelp å halde det i live`,
        'donate.supportPatreon': `Støtt på Patreon`,
        'frame.close': `Lukk rammeveljaren`,
        'frame.seekFail': `Kunne ikkje søkje i videoavspelaren.`,
        'frame.selectAt': `Vel andletsrame ved {time}s`,
    };

    const ko = {
        'backendSettings.title': `백엔드 설정`,
        'backendSettings.closeAria': `설정 닫기`,
        'backendSettings.backendAria': `백엔드 설정`,
        'backendSettings.changeBackend': `백엔드 변경`,
        'backendSettings.backendLabel': `백엔드`,
        'backendSettings.local': `로컬`,
        'backendSettings.cloud': `클라우드(Hugging Face)`,
        'backendSettings.cloudNote': `이미지는 Hugging Face 클라우드 서비스로 전송됩니다.`,
        'backendSettings.hintPrefix': `이미지를 네트워크 내에 유지하고 싶으신가요?`,
        'backendSettings.hintLink': `Patreon을 통해 개인 서버 실행`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `브라우저의 보안 정책(CSP)은 기본적으로`,
        'backendSettings.csp2': `만 허용합니다. 다른 주소(예: LAN IP)에 있는 로컬 백엔드에 연결하려면 해당 주소를`,
        'backendSettings.csp3': `의`,
        'backendSettings.csp4': `파일 목록에 추가하세요. 이 파일은 Stash 플러그인 폴더에 있습니다. 추가하지 않으면 요청이 차단됩니다. 참고: Visage를 업데이트하면`,
        'backendSettings.csp5': `이(가) 다시 설치되므로 업데이트할 때마다 다시 적용해야 합니다.`,
        'backendSettings.testing': `연결 테스트 중…`,
        'backendSettings.testConnection': `연결 테스트`,
        'backendSettings.testingShort': `테스트 중…`,
        'backendSettings.cancel': `취소`,
        'backendSettings.save': `저장`,
        'backendSettings.feedback.reachable': `연결에 성공했습니다. 백엔드가 준비되었습니다.`,
        'backendSettings.feedback.degraded': `백엔드에 연결할 수 있지만 성능이 저하되었습니다(모델 또는 인덱스가 로드되지 않음).`,
        'backendSettings.feedback.unreachable': `백엔드에 연결할 수 없습니다. URL을 확인하고 백엔드가 실행 중인지 확인하세요.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `현재 프레임`,
        'faceMatch.close': `닫기`,
        'faceMatch.facesSelected': `얼굴 {faces}개 발견 · {selected}개 선택됨`,
        'faceMatch.inScene': `· 장면 내 {count}`,
        'faceMatch.stashboxMissing': `stash-box가 설정되어 있지 않습니다.`,
        'faceMatch.stashboxMissingBody': ` 설정 → 메타데이터 공급자에서 stash-box 공급자를 추가하면 출연자 가져오기를 활성화할 수 있습니다.`,
        'faceMatch.stashboxWrongName': `"StashDB" 공급자를 찾을 수 없습니다.`,
        'faceMatch.stashboxWrongNameBody': ` 출연자 가져오기에는 "StashDB"라는 이름의 공급자가 필요합니다. 설정 → 메타데이터 공급자에서 공급자 이름을 변경하세요.`,
        'faceMatch.learnMore': `자세히 알아보기.`,
        'faceMatch.scanning': `스캔 중 · 얼굴 인식…`,
        'faceMatch.faceAlt': `얼굴 {index}`,
        'faceMatch.minConf': `최소 신뢰도`,
        'faceMatch.minConfTitle': `최소 신뢰도: {percent}%`,
        'faceMatch.detected': `감지됨`,
        'faceMatch.detectedFaceAlt': `감지된 얼굴`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Patreon에서 지원`,
        'faceMatch.ofSelected': `{total}개 중 {selected}개 선택됨`,
        'faceMatch.allInScene': `얼굴 {total}개 발견 · 모두 장면 내`,
        'faceMatch.clickToSelect': `얼굴 {total}개 발견 · 클릭하여 선택`,
        'faceMatch.kbSwitch': `얼굴 전환`,
        'faceMatch.kbSelect': `출연자 선택`,
        'faceMatch.kbToggle': `선택 전환`,
        'faceMatch.kbAddInstant': `Shift+클릭으로 즉시 추가`,
        'faceMatch.selectBest': `최적 일치 선택`,
        'faceMatch.adding': `추가 중...`,
        'faceMatch.done': `완료({count})`,
        'faceMatch.toast.added': `{target}에 출연자를 추가했습니다.`,
        'faceMatch.toast.addError': `출연자 추가 실패: {error}`,
        'faceMatch.toast.noStashbox': `stash-box가 설정되어 있지 않습니다. 설정 → 메타데이터 공급자에서 stash-box 공급자를 추가하면 출연자 가져오기를 활성화할 수 있습니다. 참조: {url}`,
        'faceMatch.toast.noProvider': `"StashDB"라는 이름의 공급자를 찾을 수 없습니다. 설정 → 메타데이터 공급자에서 공급자 이름을 "StashDB"로 변경하면 출연자 가져오기를 활성화할 수 있습니다.`,
        'faceMatch.toast.configureProvider': `설정 → 메타데이터 공급자에서 stash-box 공급자를 구성하면 출연자 가져오기를 활성화할 수 있습니다.`,
        'faceMatch.toast.addedMultiple': `{target}에 {count}명의 출연자{s}를 추가했습니다.`,
        'sprite.title': `장면 출연자`,
        'sprite.close': `닫기`,
        'sprite.foundConfirmed': `{found}개 발견 · {confirmed}개 확인됨`,
        'sprite.confidence': `신뢰도`,
        'sprite.name': `이름`,
        'sprite.hits': `조회수`,
        'sprite.minConf': `최소 신뢰도`,
        'sprite.minConfTitle': `최소 신뢰도: {percent}%`,
        'sprite.scanning': `Visage 스캔 중…`,
        'sprite.cancel': `취소`,
        'sprite.empty': `이 스프라이트에서 확인된 출연자가 없습니다.`,
        'sprite.detectedFaceAlt': `감지된 얼굴`,
        'sprite.spriteLabel': `스프라이트`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `장면 내`,
        'sprite.hitsCount': `조회수 {count}회{s}`,
        'sprite.totalTime': `총 {time}`,
        'sprite.alreadyInScene': `이미 장면에 있음`,
        'sprite.clickToConfirm': `클릭하여 확인`,
        'sprite.confirmed': `확인됨`,
        'sprite.supportPatreon': `Patreon에서 지원`,
        'sprite.confirmedCount': `{total}개 중 {confirmed}개 확인됨`,
        'sprite.shownHint': `{shown}개 표시됨(총 {total}개) · 클릭하여 확인 · ←→ 탐색 · Enter 확인`,
        'sprite.confirmHint': `클릭하여 확인 · ←→ 탐색 · Enter 확인`,
        'sprite.adding': `추가 중...`,
        'sprite.done': `완료({count})`,
        'gender.male': `남성`,
        'gender.female': `여성`,
        'gender.transMale': `트랜스젠더 남성`,
        'gender.transFemale': `트랜스젠더 여성`,
        'gender.nonBinary': `논바이너리`,
        'gender.intersex': `간성`,
        'card.excellent': `최상의 일치`,
        'card.good': `좋은 일치`,
        'card.uncertain': `불확실한 일치`,
        'card.select': `{name} 선택`,
        'card.deselect': `{name} 선택 해제`,
        'card.openOn': `{source}에서 열기`,
        'search.overlayHint': `얼굴을 드래그하여 선택 — Enter로 전체 프레임 스캔 — Esc로 취소`,
        'search.noFaces': `해당 선택 영역에서 얼굴을 찾을 수 없습니다. 더 좁게 자르거나 Enter를 눌러 전체 프레임을 스캔하세요.`,
        'search.captureMediaFail': `미디어를 캡처할 수 없습니다. 장면/이미지가 완전히 로드되었는지 확인하세요.`,
        'search.healthBanner': `얼굴 인식 API에 연결할 수 없습니다. 백엔드를 시작한 후 다시 시도하세요.`,
        'search.failed': `얼굴 검색 실패: {error}`,
        'search.fetchImageFail': `Stash에서 이미지를 가져올 수 없습니다.`,
        'search.captureFail': `이미지 캡처 실패: {error}`,
        'search.selectFaceImage': `이미지 내에서 얼굴을 선택하세요.`,
        'search.captureFrameFail': `현재 프레임을 캡처할 수 없습니다.`,
        'search.captureFrameFail2': `현재 프레임 캡처에 실패했습니다.`,
        'search.selectFaceVideo': `비디오 플레이어 영역 내에서 얼굴을 선택하세요.`,
        'search.menuItemTitle': `얼굴 주위에 박스를 드래그하거나 Enter를 눌러 전체 프레임을 스캔하여 StashDB에서 일치 항목을 검색합니다`,
        'search.currentFrame': `Visage: 현재 프레임`,
        'scene.noSprite': `이 장면에는 스프라이트 시트나 미리보기 비디오가 없습니다. 장면 설정에서 생성한 후 다시 시도하세요.`,
        'scene.noFaces': `이 장면의 스프라이트 시트나 미리보기 비디오에서 얼굴이나 출연자를 찾을 수 없습니다.`,
        'scene.healthBanner': `얼굴 인식 API에 연결할 수 없습니다. 백엔드를 시작한 후 다시 시도하세요.`,
        'scene.failed': `장면 스캔 실패: {error}`,
        'scene.menuItemTitle': `장면의 모든 출연자를 식별합니다(생성된 스프라이트 시트 또는 미리보기 비디오 필요)`,
        'scene.wholeScene': `Visage: 전체 장면`,
        'banner.changeBackend': `백엔드 변경`,
        'banner.dismiss': `닫기`,
        'error.dismiss': `닫기`,
        'firstRun.title': `Visage 백엔드 설정`,
        'firstRun.subtitle': `Visage는 얼굴 이미지를 백엔드로 전송하여 인식합니다. 실행 위치를 선택하세요.`,
        'firstRun.cloud': `Hugging Face 클라우드 사용`,
        'firstRun.cloudNote': `설정이 필요 없습니다. 이미지는 Hugging Face 클라우드 서비스로 전송됩니다.`,
        'firstRun.local': `내 서버 사용`,
        'firstRun.localNote': `개인 바이너리를 자신의 머신 또는 네트워크에서 실행합니다.`,
        'firstRun.skip': `나중에 건너뛰기`,
        'badge.local': `로컬`,
        'badge.cloud': `클라우드(Hugging Face)`,
        'badge.title': `Visage 백엔드: {label}`,
        'donate.enjoying': `Visage가 마음에 드시나요? 유지에 도움을 주세요`,
        'donate.supportPatreon': `Patreon에서 지원`,
        'frame.close': `프레임 선택기 닫기`,
        'frame.seekFail': `비디오 플레이어를 탐색하지 못했습니다.`,
        'frame.selectAt': `{time}초에서 얼굴 프레임 선택`,
    };

    const zhCn = {
        'backendSettings.title': `后端设置`,
        'backendSettings.closeAria': `关闭设置`,
        'backendSettings.backendAria': `后端设置`,
        'backendSettings.changeBackend': `更换后端`,
        'backendSettings.backendLabel': `后端`,
        'backendSettings.local': `本地`,
        'backendSettings.cloud': `云端（Hugging Face）`,
        'backendSettings.cloudNote': `图像会被发送到 Hugging Face 云服务。`,
        'backendSettings.hintPrefix': `希望图像保留在你的网络中？`,
        'backendSettings.hintLink': `通过 Patreon 运行私有服务器`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `浏览器的安全策略（CSP）仅允许`,
        'backendSettings.csp2': `默认情况下。要访问其他地址（例如你的局域网 IP）上的本地后端，请将其添加到`,
        'backendSettings.csp3': `中的`,
        'backendSettings.csp4': `文件的列表里，该文件位于你的 Stash 插件文件夹中，否则请求将被阻止。注意：更新 Visage 会重新安装`,
        'backendSettings.csp5': `，因此每次更新后都必须重新应用此设置。`,
        'backendSettings.testing': `正在测试连接…`,
        'backendSettings.testConnection': `测试连接`,
        'backendSettings.testingShort': `正在测试…`,
        'backendSettings.cancel': `取消`,
        'backendSettings.save': `保存`,
        'backendSettings.feedback.reachable': `连接成功。后端已就绪。`,
        'backendSettings.feedback.degraded': `后端可访问但已降级（模型或索引未加载）。`,
        'backendSettings.feedback.unreachable': `后端不可访问。请检查 URL 并确认后端正在运行。`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `当前帧`,
        'faceMatch.close': `关闭`,
        'faceMatch.facesSelected': `发现 {faces} 张人脸 · 已选择 {selected}`,
        'faceMatch.inScene': `· {count} 在场景中`,
        'faceMatch.stashboxMissing': `未配置 stash-box。`,
        'faceMatch.stashboxMissingBody': ` 请在设置 → 元数据提供程序中添加 stash-box 提供程序，以启用表演者导入。`,
        'faceMatch.stashboxWrongName': `未找到 "StashDB" 提供程序。`,
        'faceMatch.stashboxWrongNameBody': ` 表演者导入需要一个名为 "StashDB" 的提供程序。请在设置 → 元数据提供程序中重命名你的提供程序。`,
        'faceMatch.learnMore': `了解更多。`,
        'faceMatch.scanning': `正在扫描 · 人脸识别…`,
        'faceMatch.faceAlt': `人脸 {index}`,
        'faceMatch.minConf': `最小置信度`,
        'faceMatch.minConfTitle': `最低置信度：{percent}%`,
        'faceMatch.detected': `已检测到`,
        'faceMatch.detectedFaceAlt': `检测到的人脸`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `在 Patreon 上支持`,
        'faceMatch.ofSelected': `已选择 {total} 中的 {selected}`,
        'faceMatch.allInScene': `发现 {total} 张人脸 · 全部在场景中`,
        'faceMatch.clickToSelect': `发现 {total} 张人脸 · 点击以选择`,
        'faceMatch.kbSwitch': `切换人脸`,
        'faceMatch.kbSelect': `选择表演者`,
        'faceMatch.kbToggle': `切换选择`,
        'faceMatch.kbAddInstant': `Shift+点击立即添加`,
        'faceMatch.selectBest': `选择最佳匹配`,
        'faceMatch.adding': `正在添加...`,
        'faceMatch.done': `完成（{count}）`,
        'faceMatch.toast.added': `已将表演者添加到 {target}。`,
        'faceMatch.toast.addError': `添加表演者失败：{error}`,
        'faceMatch.toast.noStashbox': `未配置 stash-box。请在设置 → 元数据提供程序中添加 stash-box 提供程序以启用表演者导入。参见 {url}`,
        'faceMatch.toast.noProvider': `未找到名为 "StashDB" 的提供程序。请在设置 → 元数据提供程序中重命名你的提供程序，使其为 "StashDB"，以启用表演者导入。`,
        'faceMatch.toast.configureProvider': `请在设置 → 元数据提供程序中配置 stash-box 提供程序，以启用表演者导入。`,
        'faceMatch.toast.addedMultiple': `已将 {count} 位表演者{s}添加到 {target}。`,
        'sprite.title': `场景表演者`,
        'sprite.close': `关闭`,
        'sprite.foundConfirmed': `找到 {found} · 已确认 {confirmed}`,
        'sprite.confidence': `置信度`,
        'sprite.name': `姓名`,
        'sprite.hits': `命中`,
        'sprite.minConf': `最小置信度`,
        'sprite.minConfTitle': `最低置信度：{percent}%`,
        'sprite.scanning': `Visage 正在扫描…`,
        'sprite.cancel': `取消`,
        'sprite.empty': `此精灵图中未识别出任何表演者。`,
        'sprite.detectedFaceAlt': `检测到的人脸`,
        'sprite.spriteLabel': `精灵图`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `在场景中`,
        'sprite.hitsCount': `{count} 次命中{s}`,
        'sprite.totalTime': `共 {time}`,
        'sprite.alreadyInScene': `已在场景中`,
        'sprite.clickToConfirm': `点击以确认`,
        'sprite.confirmed': `已确认`,
        'sprite.supportPatreon': `在 Patreon 上支持`,
        'sprite.confirmedCount': `已确认 {total} 中的 {confirmed}`,
        'sprite.shownHint': `显示 {shown}（共 {total} 个）· 点击以确认 · ←→ 导航 · Enter 确认`,
        'sprite.confirmHint': `点击以确认 · ←→ 导航 · Enter 确认`,
        'sprite.adding': `正在添加...`,
        'sprite.done': `完成（{count}）`,
        'gender.male': `男性`,
        'gender.female': `女性`,
        'gender.transMale': `跨性别男性`,
        'gender.transFemale': `跨性别女性`,
        'gender.nonBinary': `非二元性别`,
        'gender.intersex': `双性人`,
        'card.excellent': `极佳匹配`,
        'card.good': `良好匹配`,
        'card.uncertain': `不确定匹配`,
        'card.select': `选择 {name}`,
        'card.deselect': `取消选择 {name}`,
        'card.openOn': `在 {source} 上打开`,
        'search.overlayHint': `拖动以选择人脸 — Enter 扫描整个画面 — Esc 取消`,
        'search.noFaces': `该选择中未找到人脸。请尝试更紧的裁剪，或按 Enter 扫描整个画面。`,
        'search.captureMediaFail': `无法捕获媒体。请确保场景/图像已完全加载。`,
        'search.healthBanner': `人脸识别 API 不可访问。请启动后端并重试。`,
        'search.failed': `人脸搜索失败：{error}`,
        'search.fetchImageFail': `无法从 Stash 获取图像。`,
        'search.captureFail': `捕获图像失败：{error}`,
        'search.selectFaceImage': `在图像中选择一张人脸。`,
        'search.captureFrameFail': `无法捕获当前帧。`,
        'search.captureFrameFail2': `捕获当前帧失败。`,
        'search.selectFaceVideo': `在视频播放器区域内选择一张人脸。`,
        'search.menuItemTitle': `拖动框选一张人脸，或按 Enter 扫描整个画面，以在 StashDB 中搜索匹配项`,
        'search.currentFrame': `Visage：当前帧`,
        'scene.noSprite': `此场景没有精灵图或预览视频。请在场景设置中生成它们，然后重试。`,
        'scene.noFaces': `在此场景的精灵图或预览视频中未找到人脸或表演者。`,
        'scene.healthBanner': `人脸识别 API 不可访问。请启动后端并重试。`,
        'scene.failed': `场景扫描失败：{error}`,
        'scene.menuItemTitle': `识别场景中的每个表演者（需要生成的精灵图或预览视频）`,
        'scene.wholeScene': `Visage：整个场景`,
        'banner.changeBackend': `更换后端`,
        'banner.dismiss': `关闭`,
        'error.dismiss': `关闭`,
        'firstRun.title': `设置你的 Visage 后端`,
        'firstRun.subtitle': `Visage 会将人脸图像发送到后端进行识别。选择在哪里运行它。`,
        'firstRun.cloud': `使用 Hugging Face 云端`,
        'firstRun.cloudNote': `零设置。图像会被发送到 Hugging Face 云服务。`,
        'firstRun.local': `使用我自己的服务器`,
        'firstRun.localNote': `在你的电脑或网络上运行私有二进制文件。`,
        'firstRun.skip': `暂时跳过`,
        'badge.local': `本地`,
        'badge.cloud': `云端（Hugging Face）`,
        'badge.title': `Visage 后端：{label}`,
        'donate.enjoying': `喜欢 Visage？帮助它保持运行`,
        'donate.supportPatreon': `在 Patreon 上支持`,
        'frame.close': `关闭帧选择器`,
        'frame.seekFail': `无法快进视频播放器。`,
        'frame.selectAt': `选择 {time} 秒处的人脸帧`,
    };

    const bg = {
        'backendSettings.title': `Настройки на бекенда`,
        'backendSettings.closeAria': `Затваряне на настройките`,
        'backendSettings.backendAria': `Настройки на бекенда`,
        'backendSettings.changeBackend': `Смяна на бекенда`,
        'backendSettings.backendLabel': `Бекенд`,
        'backendSettings.local': `Локален`,
        'backendSettings.cloud': `Облак (Hugging Face)`,
        'backendSettings.cloudNote': `Изображенията се изпращат към облачната услуга Hugging Face.`,
        'backendSettings.hintPrefix': `Искате ли изображенията ви да останат във вашата мрежа?`,
        'backendSettings.hintLink': `Стартирайте частен сървър чрез Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `Политиката за сигурност на браузъра (CSP) по подразбиране позволява само`,
        'backendSettings.csp2': `. За да достигнете до локален бекенд на друг адрес (напр. IP на вашата LAN), добавете го към`,
        'backendSettings.csp3': `списъка в`,
        'backendSettings.csp4': `файла в папката за плъгини на Stash, в противен случай заявките ще бъдат блокирани. Забележка: актуализирането на Visage преинсталира`,
        'backendSettings.csp5': `, така че това трябва да се приложи отново след всяка актуализация.`,
        'backendSettings.testing': `Тестване на връзката…`,
        'backendSettings.testConnection': `Тествай връзката`,
        'backendSettings.testingShort': `Тестване…`,
        'backendSettings.cancel': `Отказ`,
        'backendSettings.save': `Запазване`,
        'backendSettings.feedback.reachable': `Връзката е успешна. Бекендът е готов.`,
        'backendSettings.feedback.degraded': `Бекендът е достъпен, но деградиран (моделите или индексът не са заредени).`,
        'backendSettings.feedback.unreachable': `Бекендът е недостъпен. Проверете URL адреса и се уверете, че бекендът работи.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `ТЕКУЩ КАДЪР`,
        'faceMatch.close': `Затваряне`,
        'faceMatch.facesSelected': `Намерени лица: {faces} · избрани: {selected}`,
        'faceMatch.inScene': `· {count} в сцената`,
        'faceMatch.stashboxMissing': `Не е конфигуриран stash-box.`,
        'faceMatch.stashboxMissingBody': ` Добавете доставчик на stash-box в Settings → Metadata Providers, за да активирате импортирането на изпълнители.`,
        'faceMatch.stashboxWrongName': `Не е намерен доставчик "StashDB".`,
        'faceMatch.stashboxWrongNameBody': ` Импортирането на изпълнители изисква доставчик с име "StashDB". Преименувайте доставчика в Settings → Metadata Providers.`,
        'faceMatch.learnMore': `Научете повече.`,
        'faceMatch.scanning': `Сканиране • разпознаване на лица…`,
        'faceMatch.faceAlt': `Лице {index}`,
        'faceMatch.minConf': `Мин. ув.`,
        'faceMatch.minConfTitle': `Минимална увереност: {percent}%`,
        'faceMatch.detected': `Открито`,
        'faceMatch.detectedFaceAlt': `Открито лице`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Подкрепа в Patreon`,
        'faceMatch.ofSelected': `Избрани {selected} от {total}`,
        'faceMatch.allInScene': `Намерени лица: {total} · всички в сцената`,
        'faceMatch.clickToSelect': `Намерени лица: {total} · щракнете, за да изберете`,
        'faceMatch.kbSwitch': `Превключване на лица`,
        'faceMatch.kbSelect': `Избор на изпълнители`,
        'faceMatch.kbToggle': `Превключване на избора`,
        'faceMatch.kbAddInstant': `Shift+щракване за незабавно добавяне`,
        'faceMatch.selectBest': `Изберете най-добрите съвпадения`,
        'faceMatch.adding': `Добавяне...`,
        'faceMatch.done': `Готово ({count})`,
        'faceMatch.toast.added': `Изпълнителят е добавен към {target}.`,
        'faceMatch.toast.addError': `Неуспешно добавяне на изпълнител: {error}`,
        'faceMatch.toast.noStashbox': `Не е конфигуриран stash-box. Добавете доставчик на stash-box в Settings → Metadata Providers, за да активирате импортирането на изпълнители. Вижте {url}`,
        'faceMatch.toast.noProvider': `Не е намерен доставчик "StashDB". Преименувайте доставчика на "StashDB" в Settings → Metadata Providers, за да активирате импортирането на изпълнители.`,
        'faceMatch.toast.configureProvider': `Конфигурирайте доставчик на stash-box в Settings → Metadata Providers, за да активирате импортирането на изпълнители.`,
        'faceMatch.toast.addedMultiple': `Добавени изпълнители: {count} към {target}.`,
        'sprite.title': `ИЗПЪЛНИТЕЛИ НА СЦЕНАТА`,
        'sprite.close': `Затвори`,
        'sprite.foundConfirmed': `Намерени: {found} · потвърдени: {confirmed}`,
        'sprite.confidence': `увереност`,
        'sprite.name': `име`,
        'sprite.hits': `съвпадения`,
        'sprite.minConf': `Мин. ув.`,
        'sprite.minConfTitle': `Минимална увереност: {percent}%`,
        'sprite.scanning': `Сканиране на Visage…`,
        'sprite.cancel': `Отказ`,
        'sprite.empty': `В този спрайт не са идентифицирани изпълнители.`,
        'sprite.detectedFaceAlt': `Открито лице`,
        'sprite.spriteLabel': `СПРАЙТ`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `В сцената`,
        'sprite.hitsCount': `Съвпадения: {count}`,
        'sprite.totalTime': `Общо {time}`,
        'sprite.alreadyInScene': `Вече в сцената`,
        'sprite.clickToConfirm': `Щракнете, за да потвърдите`,
        'sprite.confirmed': `Потвърдено`,
        'sprite.supportPatreon': `Подкрепа в Patreon`,
        'sprite.confirmedCount': `Потвърдени {confirmed} от {total}`,
        'sprite.shownHint': `Показани: {shown} (общо {total}) · щракнете за потвърждение · ←→ навигация · Enter потвърждение`,
        'sprite.confirmHint': `Щракнете за потвърждение · ←→ навигация · Enter потвърждение`,
        'sprite.adding': `Добавяне...`,
        'sprite.done': `Готово ({count})`,
        'gender.male': `Мъж`,
        'gender.female': `Жена`,
        'gender.transMale': `Трансджендър мъж`,
        'gender.transFemale': `Трансджендър жена`,
        'gender.nonBinary': `Небинарен`,
        'gender.intersex': `Интерсекс`,
        'card.excellent': `Отлично съвпадение`,
        'card.good': `Добро съвпадение`,
        'card.uncertain': `Несигурно съвпадение`,
        'card.select': `Изберете {name}`,
        'card.deselect': `Отмяна на избора на {name}`,
        'card.openOn': `Отваряне в {source}`,
        'search.overlayHint': `Плъзнете, за да изберете лице — Enter, за да сканирате целия кадър — Esc, за да отмените`,
        'search.noFaces': `В избраната област не са открити лица. Опитайте по-плътно изрязване или натиснете Enter, за да сканирате целия кадър.`,
        'search.captureMediaFail': `Неуспешно заснемане на медията. Уверете се, че сцената/изображението е напълно заредено.`,
        'search.healthBanner': `API за разпознаване на лица е недостъпен. Стартирайте бекенда и опитайте отново.`,
        'search.failed': `Търсенето на лице се провали: {error}`,
        'search.fetchImageFail': `Неуспешно извличане на изображение от Stash.`,
        'search.captureFail': `Неуспешно заснемане на изображение: {error}`,
        'search.selectFaceImage': `Изберете лице в изображението.`,
        'search.captureFrameFail': `Неуспешно заснемане на текущия кадър.`,
        'search.captureFrameFail2': `Грешка при заснемане на текущия кадър.`,
        'search.selectFaceVideo': `Изберете лице в областта на видеоплейъра.`,
        'search.menuItemTitle': `Плъзнете рамка около лице или натиснете Enter, за да сканирате целия кадър, за да потърсите съвпадения в StashDB`,
        'search.currentFrame': `Visage: текущ кадър`,
        'scene.noSprite': `За тази сцена не е намерен нито спрайт лист, нито превю видео. Генерирайте ги в настройките на сцената и опитайте отново.`,
        'scene.noFaces': `В спрайт листа или превю видеото на тази сцена не са открити лица или изпълнители.`,
        'scene.healthBanner': `API за разпознаване на лица е недостъпен. Стартирайте бекенда и опитайте отново.`,
        'scene.failed': `Сканирането на сцената се провали: {error}`,
        'scene.menuItemTitle': `Идентифицирайте всеки изпълнител в сцената (изисква генериран спрайт лист или превю видео)`,
        'scene.wholeScene': `Visage: цялата сцена`,
        'banner.changeBackend': `Смяна на бекенда`,
        'banner.dismiss': `Отхвърляне`,
        'error.dismiss': `Отхвърляне`,
        'firstRun.title': `Настройте бекенда на Visage`,
        'firstRun.subtitle': `Visage изпраща изображения на лица към бекенда за разпознаване. Изберете къде да го стартирате.`,
        'firstRun.cloud': `Използване на облака Hugging Face`,
        'firstRun.cloudNote': `Без настройка. Изображенията се изпращат към облачната услуга Hugging Face.`,
        'firstRun.local': `Използване на собствен сървър`,
        'firstRun.localNote': `Стартирайте частния двоичен файл на вашата машина или в мрежата.`,
        'firstRun.skip': `Пропусни засега`,
        'badge.local': `Локален`,
        'badge.cloud': `Облак (Hugging Face)`,
        'badge.title': `Бекенд на Visage: {label}`,
        'donate.enjoying': `Харесвате ли Visage? Помогнете да остане жив`,
        'donate.supportPatreon': `Подкрепа в Patreon`,
        'frame.close': `Затваряне на избора на кадър`,
        'frame.seekFail': `Неуспешно превъртане на видеоплейъра.`,
        'frame.selectAt': `Изберете кадър с лице на {time} s`,
    };

    const ru = {
        'backendSettings.title': `Настройки бэкенда`,
        'backendSettings.closeAria': `Закрыть настройки`,
        'backendSettings.backendAria': `Настройки бэкенда`,
        'backendSettings.changeBackend': `Сменить бэкенд`,
        'backendSettings.backendLabel': `Бэкенд`,
        'backendSettings.local': `Локальный`,
        'backendSettings.cloud': `Облако (Hugging Face)`,
        'backendSettings.cloudNote': `Изображения отправляются в облачный сервис Hugging Face.`,
        'backendSettings.hintPrefix': `Хотите, чтобы изображения оставались в вашей сети?`,
        'backendSettings.hintLink': `Запустите частный сервер через Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `Политика безопасности браузера (CSP) по умолчанию разрешает только`,
        'backendSettings.csp2': `. Чтобы получить доступ к локальному бэкенду по другому адресу (например, IP вашей локальной сети), добавьте его в`,
        'backendSettings.csp3': `список в`,
        'backendSettings.csp4': `файле в папке плагинов Stash, иначе запросы будут заблокированы. Примечание: обновление Visage переустанавливает`,
        'backendSettings.csp5': `, поэтому это нужно повторять после каждого обновления.`,
        'backendSettings.testing': `Проверка подключения…`,
        'backendSettings.testConnection': `Проверить подключение`,
        'backendSettings.testingShort': `Проверка…`,
        'backendSettings.cancel': `Отмена`,
        'backendSettings.save': `Сохранить`,
        'backendSettings.feedback.reachable': `Подключение успешно. Бэкенд готов.`,
        'backendSettings.feedback.degraded': `Бэкенд доступен, но работает с ограничениями (модели или индекс не загружены).`,
        'backendSettings.feedback.unreachable': `Бэкенд недоступен. Проверьте URL и убедитесь, что бэкенд запущен.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `ТЕКУЩИЙ КАДР`,
        'faceMatch.close': `Закрыть`,
        'faceMatch.facesSelected': `Найдено лиц: {faces} · выбрано: {selected}`,
        'faceMatch.inScene': `· {count} в сцене`,
        'faceMatch.stashboxMissing': `Stash-box не настроен.`,
        'faceMatch.stashboxMissingBody': ` Добавьте провайдера stash-box в Settings → Metadata Providers, чтобы включить импорт исполнителей.`,
        'faceMatch.stashboxWrongName': `Провайдер "StashDB" не найден.`,
        'faceMatch.stashboxWrongNameBody': ` Импорт исполнителей требует провайдера с именем "StashDB". Переименуйте провайдера в Settings → Metadata Providers.`,
        'faceMatch.learnMore': `Подробнее.`,
        'faceMatch.scanning': `Сканирование • распознавание лиц…`,
        'faceMatch.faceAlt': `Лицо {index}`,
        'faceMatch.minConf': `Мин. дост.`,
        'faceMatch.minConfTitle': `Минимальная достоверность: {percent}%`,
        'faceMatch.detected': `Обнаружено`,
        'faceMatch.detectedFaceAlt': `Обнаруженное лицо`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Поддержать на Patreon`,
        'faceMatch.ofSelected': `Выбрано {selected} из {total}`,
        'faceMatch.allInScene': `Найдено лиц: {total} · все в сцене`,
        'faceMatch.clickToSelect': `Найдено лиц: {total} · нажмите, чтобы выбрать`,
        'faceMatch.kbSwitch': `Переключение лиц`,
        'faceMatch.kbSelect': `Выбор исполнителей`,
        'faceMatch.kbToggle': `Переключить выбор`,
        'faceMatch.kbAddInstant': `Shift+клик, чтобы добавить сразу`,
        'faceMatch.selectBest': `Выбрать лучшие совпадения`,
        'faceMatch.adding': `Добавление...`,
        'faceMatch.done': `Готово ({count})`,
        'faceMatch.toast.added': `Исполнитель добавлен в {target}.`,
        'faceMatch.toast.addError': `Не удалось добавить исполнителя: {error}`,
        'faceMatch.toast.noStashbox': `Stash-box не настроен. Добавьте провайдера stash-box в Settings → Metadata Providers, чтобы включить импорт исполнителей. См. {url}`,
        'faceMatch.toast.noProvider': `Провайдер "StashDB" не найден. Переименуйте провайдера в "StashDB" в Settings → Metadata Providers, чтобы включить импорт исполнителей.`,
        'faceMatch.toast.configureProvider': `Настройте провайдера stash-box в Settings → Metadata Providers, чтобы включить импорт исполнителей.`,
        'faceMatch.toast.addedMultiple': `Добавлено исполнителей: {count} в {target}.`,
        'sprite.title': `ИСПОЛНИТЕЛИ СЦЕНЫ`,
        'sprite.close': `Закрыть`,
        'sprite.foundConfirmed': `Найдено: {found} · подтверждено: {confirmed}`,
        'sprite.confidence': `достоверность`,
        'sprite.name': `имя`,
        'sprite.hits': `совпадения`,
        'sprite.minConf': `Мин. дост.`,
        'sprite.minConfTitle': `Минимальная достоверность: {percent}%`,
        'sprite.scanning': `Сканирование Visage…`,
        'sprite.cancel': `Отмена`,
        'sprite.empty': `В этом спрайте исполнители не обнаружены.`,
        'sprite.detectedFaceAlt': `Обнаруженное лицо`,
        'sprite.spriteLabel': `СПРАЙТ`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `В сцене`,
        'sprite.hitsCount': `Совпадений: {count}`,
        'sprite.totalTime': `Всего {time}`,
        'sprite.alreadyInScene': `Уже в сцене`,
        'sprite.clickToConfirm': `Нажмите для подтверждения`,
        'sprite.confirmed': `Подтверждено`,
        'sprite.supportPatreon': `Поддержать на Patreon`,
        'sprite.confirmedCount': `Подтверждено {confirmed} из {total}`,
        'sprite.shownHint': `Показано: {shown} (всего {total}) · нажмите для подтверждения · ←→ навигация · Enter подтверждение`,
        'sprite.confirmHint': `Нажмите для подтверждения · ←→ навигация · Enter подтверждение`,
        'sprite.adding': `Добавление...`,
        'sprite.done': `Готово ({count})`,
        'gender.male': `Мужчина`,
        'gender.female': `Женщина`,
        'gender.transMale': `Трансгендерный мужчина`,
        'gender.transFemale': `Трансгендерная женщина`,
        'gender.nonBinary': `Небинарный`,
        'gender.intersex': `Интерсекс`,
        'card.excellent': `Отличное совпадение`,
        'card.good': `Хорошее совпадение`,
        'card.uncertain': `Неуверенное совпадение`,
        'card.select': `Выбрать {name}`,
        'card.deselect': `Снять выбор с {name}`,
        'card.openOn': `Открыть на {source}`,
        'search.overlayHint': `Перетащите, чтобы выделить лицо — Enter, чтобы просканировать весь кадр — Esc, чтобы отменить`,
        'search.noFaces': `В выбранной области лица не найдены. Попробуйте более плотный кадр или нажмите Enter, чтобы просканировать весь кадр.`,
        'search.captureMediaFail': `Не удалось захватить медиа. Убедитесь, что сцена/изображение полностью загружены.`,
        'search.healthBanner': `API распознавания лиц недоступен. Запустите бэкенд и попробуйте снова.`,
        'search.failed': `Поиск лиц не удался: {error}`,
        'search.fetchImageFail': `Не удалось получить изображение из Stash.`,
        'search.captureFail': `Не удалось захватить изображение: {error}`,
        'search.selectFaceImage': `Выделите лицо в изображении.`,
        'search.captureFrameFail': `Не удалось захватить текущий кадр.`,
        'search.captureFrameFail2': `Ошибка при захвате текущего кадра.`,
        'search.selectFaceVideo': `Выделите лицо в области видеоплеера.`,
        'search.menuItemTitle': `Перетащите рамку вокруг лица или нажмите Enter, чтобы просканировать весь кадр и выполнить поиск совпадений в StashDB`,
        'search.currentFrame': `Visage: текущий кадр`,
        'scene.noSprite': `Для этой сцены не найдено ни спрайт-листа, ни превью-видео. Создайте их в настройках сцены и попробуйте снова.`,
        'scene.noFaces': `В спрайт-листе или превью-видео этой сцены не найдено лиц или исполнителей.`,
        'scene.healthBanner': `API распознавания лиц недоступен. Запустите бэкенд и попробуйте снова.`,
        'scene.failed': `Сканирование сцены не удалось: {error}`,
        'scene.menuItemTitle': `Определите каждого исполнителя в сцене (требуется сгенерированный спрайт-лист или превью-видео)`,
        'scene.wholeScene': `Visage: вся сцена`,
        'banner.changeBackend': `Сменить бэкенд`,
        'banner.dismiss': `Отклонить`,
        'error.dismiss': `Отклонить`,
        'firstRun.title': `Настройте бэкенд Visage`,
        'firstRun.subtitle': `Visage отправляет изображения лиц в бэкенд для распознавания. Выберите, где его запустить.`,
        'firstRun.cloud': `Использовать облако Hugging Face`,
        'firstRun.cloudNote': `Без настройки. Изображения отправляются в облачный сервис Hugging Face.`,
        'firstRun.local': `Использовать свой сервер`,
        'firstRun.localNote': `Запустите частный бинарник на своей машине или в своей сети.`,
        'firstRun.skip': `Пропустить`,
        'badge.local': `Локальный`,
        'badge.cloud': `Облако (Hugging Face)`,
        'badge.title': `Бэкенд Visage: {label}`,
        'donate.enjoying': `Нравится Visage? Помогите сохранить его`,
        'donate.supportPatreon': `Поддержать на Patreon`,
        'frame.close': `Закрыть выбор кадра`,
        'frame.seekFail': `Не удалось перемотать видеоплеер.`,
        'frame.selectAt': `Выбрать кадр лица на {time} с`,
    };

    const id = {
        'backendSettings.title': `Pengaturan backend`,
        'backendSettings.closeAria': `Tutup pengaturan`,
        'backendSettings.backendAria': `Pengaturan backend`,
        'backendSettings.changeBackend': `Ganti backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Lokal`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Gambar dikirim ke layanan cloud Hugging Face.`,
        'backendSettings.hintPrefix': `Ingin gambar tetap berada di jaringan Anda?`,
        'backendSettings.hintLink': `Jalankan server pribadi melalui Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `Kebijakan keamanan browser (CSP) hanya mengizinkan`,
        'backendSettings.csp2': `secara default. Untuk menjangkau backend lokal di alamat lain (mis. IP LAN Anda), tambahkan ke`,
        'backendSettings.csp3': `di dalam`,
        'backendSettings.csp4': `di dalam folder plugin Stash Anda, jika tidak, permintaan akan diblokir. Catatan: memperbarui Visage akan menginstal ulang`,
        'backendSettings.csp5': `, jadi ini harus diterapkan ulang setelah setiap pembaruan.`,
        'backendSettings.testing': `Menguji koneksi…`,
        'backendSettings.testConnection': `Uji koneksi`,
        'backendSettings.testingShort': `Menguji…`,
        'backendSettings.cancel': `Batal`,
        'backendSettings.save': `Simpan`,
        'backendSettings.feedback.reachable': `Koneksi berhasil. Backend siap.`,
        'backendSettings.feedback.degraded': `Backend terjangkau tetapi menurun (model atau indeks tidak dimuat).`,
        'backendSettings.feedback.unreachable': `Backend tidak terjangkau. Periksa URL dan pastikan backend berjalan.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `BINGKAI SAAT INI`,
        'faceMatch.close': `Tutup`,
        'faceMatch.facesSelected': `{faces} wajah ditemukan · {selected} dipilih`,
        'faceMatch.inScene': `· {count} dalam scene`,
        'faceMatch.stashboxMissing': `Tidak ada stash-box yang dikonfigurasi.`,
        'faceMatch.stashboxMissingBody': ` Tambahkan penyedia stash-box di Pengaturan → Penyedia Metadata untuk mengaktifkan impor pemain.`,
        'faceMatch.stashboxWrongName': `Tidak ditemukan penyedia "StashDB".`,
        'faceMatch.stashboxWrongNameBody': ` Impor pemain memerlukan penyedia bernama "StashDB". Ganti nama penyedia Anda di Pengaturan → Penyedia Metadata.`,
        'faceMatch.learnMore': `Pelajari lebih lanjut.`,
        'faceMatch.scanning': `Memindai • pengenalan wajah…`,
        'faceMatch.faceAlt': `Wajah {index}`,
        'faceMatch.minConf': `Kepercayaan min.`,
        'faceMatch.minConfTitle': `Kepercayaan minimum: {percent}%`,
        'faceMatch.detected': `Terdeteksi`,
        'faceMatch.detectedFaceAlt': `Wajah terdeteksi`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Dukung di Patreon`,
        'faceMatch.ofSelected': `{selected} dari {total} dipilih`,
        'faceMatch.allInScene': `{total} wajah ditemukan · semua dalam scene`,
        'faceMatch.clickToSelect': `{total} wajah ditemukan · klik untuk memilih`,
        'faceMatch.kbSwitch': `Ganti wajah`,
        'faceMatch.kbSelect': `Pilih pemain`,
        'faceMatch.kbToggle': `Alihkan pemilihan`,
        'faceMatch.kbAddInstant': `Shift+klik untuk menambah langsung`,
        'faceMatch.selectBest': `Pilih Kecocokan Terbaik`,
        'faceMatch.adding': `Menambahkan...`,
        'faceMatch.done': `Selesai ({count})`,
        'faceMatch.toast.added': `Pemain ditambahkan ke {target}.`,
        'faceMatch.toast.addError': `Gagal menambah pemain: {error}`,
        'faceMatch.toast.noStashbox': `Tidak ada stash-box yang dikonfigurasi. Tambahkan penyedia stash-box di Pengaturan → Penyedia Metadata untuk mengaktifkan impor pemain. Lihat {url}`,
        'faceMatch.toast.noProvider': `Tidak ditemukan penyedia bernama "StashDB". Ganti nama penyedia Anda menjadi "StashDB" di Pengaturan → Penyedia Metadata untuk mengaktifkan impor pemain.`,
        'faceMatch.toast.configureProvider': `Konfigurasi penyedia stash-box di Pengaturan → Penyedia Metadata untuk mengaktifkan impor pemain.`,
        'faceMatch.toast.addedMultiple': `{count} pemain{s} ditambahkan ke {target}.`,
        'sprite.title': `PEMERAN SCENE`,
        'sprite.close': `Tutup`,
        'sprite.foundConfirmed': `{found} ditemukan · {confirmed} dikonfirmasi`,
        'sprite.confidence': `kepercayaan`,
        'sprite.name': `nama`,
        'sprite.hits': `hit`,
        'sprite.minConf': `Kepercayaan min.`,
        'sprite.minConfTitle': `Kepercayaan minimum: {percent}%`,
        'sprite.scanning': `Visage Memindai…`,
        'sprite.cancel': `Batal`,
        'sprite.empty': `Tidak ada pemain yang teridentifikasi dalam sprite ini.`,
        'sprite.detectedFaceAlt': `Wajah terdeteksi`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `Dalam scene`,
        'sprite.hitsCount': `{count} hit{s}`,
        'sprite.totalTime': `{time} total`,
        'sprite.alreadyInScene': `Sudah dalam scene`,
        'sprite.clickToConfirm': `Klik untuk konfirmasi`,
        'sprite.confirmed': `Dikonfirmasi`,
        'sprite.supportPatreon': `Dukung di Patreon`,
        'sprite.confirmedCount': `{confirmed} dari {total} dikonfirmasi`,
        'sprite.shownHint': `{shown} ditampilkan ({total} total) · klik untuk konfirmasi · ←→ navigasi · Enter konfirmasi`,
        'sprite.confirmHint': `Klik untuk konfirmasi · ←→ navigasi · Enter konfirmasi`,
        'sprite.adding': `Menambahkan...`,
        'sprite.done': `Selesai ({count})`,
        'gender.male': `Pria`,
        'gender.female': `Wanita`,
        'gender.transMale': `Pria transgender`,
        'gender.transFemale': `Wanita transgender`,
        'gender.nonBinary': `Non-biner`,
        'gender.intersex': `Interseks`,
        'card.excellent': `Kecocokan sangat baik`,
        'card.good': `Kecocokan baik`,
        'card.uncertain': `Kecocokan tidak pasti`,
        'card.select': `Pilih {name}`,
        'card.deselect': `Batalkan pilihan {name}`,
        'card.openOn': `Buka di {source}`,
        'search.overlayHint': `Seret untuk memilih wajah — Enter untuk memindai seluruh bingkai — Esc untuk membatalkan`,
        'search.noFaces': `Tidak ada wajah yang ditemukan pada pilihan tersebut. Coba potongan yang lebih rapat, atau tekan Enter untuk memindai seluruh bingkai.`,
        'search.captureMediaFail': `Tidak dapat menangkap media. Pastikan scene/gambar telah dimuat sepenuhnya.`,
        'search.healthBanner': `API pengenalan wajah tidak dapat dijangkau. Mulai backend dan coba lagi.`,
        'search.failed': `Pencarian wajah gagal: {error}`,
        'search.fetchImageFail': `Tidak dapat mengambil gambar dari Stash.`,
        'search.captureFail': `Gagal menangkap gambar: {error}`,
        'search.selectFaceImage': `Pilih wajah di dalam gambar.`,
        'search.captureFrameFail': `Tidak dapat menangkap bingkai saat ini.`,
        'search.captureFrameFail2': `Gagal menangkap bingkai saat ini.`,
        'search.selectFaceVideo': `Pilih wajah di dalam area pemutar video.`,
        'search.menuItemTitle': `Seret kotak di sekitar wajah, atau tekan Enter untuk memindai seluruh bingkai, untuk mencari kecocokan di StashDB`,
        'search.currentFrame': `Visage: Bingkai Saat Ini`,
        'scene.noSprite': `Tidak ada sprite sheet atau video pratinjau untuk scene ini. Buat di pengaturan Scene, lalu coba lagi.`,
        'scene.noFaces': `Tidak ada wajah atau pemain yang ditemukan di sprite sheet atau video pratinjau scene ini.`,
        'scene.healthBanner': `API pengenalan wajah tidak dapat dijangkau. Mulai backend dan coba lagi.`,
        'scene.failed': `Pemindaian scene gagal: {error}`,
        'scene.menuItemTitle': `Identifikasi setiap pemain dalam scene (membutuhkan sprite sheet atau video pratinjau yang dibuat)`,
        'scene.wholeScene': `Visage: Seluruh Scene`,
        'banner.changeBackend': `Ganti backend`,
        'banner.dismiss': `Tutup`,
        'error.dismiss': `Tutup`,
        'firstRun.title': `Siapkan backend Visage Anda`,
        'firstRun.subtitle': `Visage mengirim gambar wajah ke backend untuk pengenalan. Pilih tempat menjalankannya.`,
        'firstRun.cloud': `Gunakan cloud Hugging Face`,
        'firstRun.cloudNote': `Tanpa pengaturan. Gambar dikirim ke layanan cloud Hugging Face.`,
        'firstRun.local': `Gunakan server saya sendiri`,
        'firstRun.localNote': `Jalankan biner pribadi di mesin atau jaringan Anda sendiri.`,
        'firstRun.skip': `Lewati untuk saat ini`,
        'badge.local': `Lokal`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Backend Visage: {label}`,
        'donate.enjoying': `Menikmati Visage? Bantu tetap berjalan`,
        'donate.supportPatreon': `Dukung di Patreon`,
        'frame.close': `Tutup pemilih bingkai`,
        'frame.seekFail': `Gagal menavigasi pemutar video.`,
        'frame.selectAt': `Pilih bingkai wajah pada {time} detik`,
    };

    const cs = {
        'backendSettings.title': `Nastavení backendu`,
        'backendSettings.closeAria': `Zavřít nastavení`,
        'backendSettings.backendAria': `Nastavení backendu`,
        'backendSettings.changeBackend': `Změnit backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Místní`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Obrázky jsou odesílány do cloudové služby Hugging Face.`,
        'backendSettings.hintPrefix': `Chcete, aby vaše obrázky zůstaly ve vaší síti?`,
        'backendSettings.hintLink': `Spusťte soukromý server přes Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `Bezpečnostní politika prohlížeče (CSP) ve výchozím nastavení povoluje pouze`,
        'backendSettings.csp2': `. Chcete-li se dostat k místnímu backendu na jiné adrese (např. IP vaší LAN), přidejte ji do`,
        'backendSettings.csp3': `seznamu v`,
        'backendSettings.csp4': `souboru ve složce pluginů Stash, jinak budou požadavky zablokovány. Poznámka: aktualizace Visage přeinstaluje`,
        'backendSettings.csp5': `, takže to musíte provést znovu po každé aktualizaci.`,
        'backendSettings.testing': `Testování připojení…`,
        'backendSettings.testConnection': `Otestovat připojení`,
        'backendSettings.testingShort': `Testování…`,
        'backendSettings.cancel': `Zrušit`,
        'backendSettings.save': `Uložit`,
        'backendSettings.feedback.reachable': `Připojení úspěšné. Backend je připraven.`,
        'backendSettings.feedback.degraded': `Backend dosažitelný, ale degradovaný (modely nebo index nejsou načteny).`,
        'backendSettings.feedback.unreachable': `Backend je nedosažitelný. Zkontrolujte URL a ujistěte se, že backend běží.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `AKTUÁLNÍ SNÍMEK`,
        'faceMatch.close': `Zavřít`,
        'faceMatch.facesSelected': `Nalezeno tváří: {faces} · vybráno: {selected}`,
        'faceMatch.inScene': `· {count} ve scéně`,
        'faceMatch.stashboxMissing': `Není nakonfigurován stash-box.`,
        'faceMatch.stashboxMissingBody': ` Přidejte poskytovatele stash-box v Settings → Metadata Providers, abyste povolili import performerů.`,
        'faceMatch.stashboxWrongName': `Poskytovatel "StashDB" nebyl nalezen.`,
        'faceMatch.stashboxWrongNameBody': ` Import performerů vyžaduje poskytovatele s názvem "StashDB". Přejmenujte poskytovatele v Settings → Metadata Providers.`,
        'faceMatch.learnMore': `Zjistit více.`,
        'faceMatch.scanning': `Skenování • rozpoznávání tváří…`,
        'faceMatch.faceAlt': `Tvář {index}`,
        'faceMatch.minConf': `Min. jist.`,
        'faceMatch.minConfTitle': `Minimální jistota: {percent}%`,
        'faceMatch.detected': `Zjištěno`,
        'faceMatch.detectedFaceAlt': `Zjištěná tvář`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Podpořit na Patreon`,
        'faceMatch.ofSelected': `Vybráno {selected} z {total}`,
        'faceMatch.allInScene': `Nalezeno tváří: {total} · všechny ve scéně`,
        'faceMatch.clickToSelect': `Nalezeno tváří: {total} · klikněte pro výběr`,
        'faceMatch.kbSwitch': `Přepínání tváří`,
        'faceMatch.kbSelect': `Výběr performerů`,
        'faceMatch.kbToggle': `Přepnout výběr`,
        'faceMatch.kbAddInstant': `Shift+klik pro okamžité přidání`,
        'faceMatch.selectBest': `Vybrat nejlepší shody`,
        'faceMatch.adding': `Přidávání...`,
        'faceMatch.done': `Hotovo ({count})`,
        'faceMatch.toast.added': `Performer byl přidán do {target}.`,
        'faceMatch.toast.addError': `Nepodařilo se přidat performera: {error}`,
        'faceMatch.toast.noStashbox': `Není nakonfigurován stash-box. Přidejte poskytovatele stash-box v Settings → Metadata Providers, abyste povolili import performerů. Viz {url}`,
        'faceMatch.toast.noProvider': `Poskytovatel "StashDB" nebyl nalezen. Přejmenujte poskytovatele na "StashDB" v Settings → Metadata Providers, abyste povolili import performerů.`,
        'faceMatch.toast.configureProvider': `Nakonfigurujte poskytovatele stash-box v Settings → Metadata Providers, abyste povolili import performerů.`,
        'faceMatch.toast.addedMultiple': `Přidáno performerů: {count} do {target}.`,
        'sprite.title': `PERFORMERI SCÉNY`,
        'sprite.close': `Zavřít`,
        'sprite.foundConfirmed': `Nalezeno: {found} · potvrzeno: {confirmed}`,
        'sprite.confidence': `jistota`,
        'sprite.name': `jméno`,
        'sprite.hits': `shody`,
        'sprite.minConf': `Min. jist.`,
        'sprite.minConfTitle': `Minimální jistota: {percent}%`,
        'sprite.scanning': `Skenování Visage…`,
        'sprite.cancel': `Zrušit`,
        'sprite.empty': `V tomto sprite nebyli identifikováni žádní performeři.`,
        'sprite.detectedFaceAlt': `Zjištěná tvář`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `Ve scéně`,
        'sprite.hitsCount': `Shod: {count}`,
        'sprite.totalTime': `Celkem {time}`,
        'sprite.alreadyInScene': `Již ve scéně`,
        'sprite.clickToConfirm': `Klikněte pro potvrzení`,
        'sprite.confirmed': `Potvrzeno`,
        'sprite.supportPatreon': `Podpořit na Patreon`,
        'sprite.confirmedCount': `Potvrzeno {confirmed} z {total}`,
        'sprite.shownHint': `Zobrazeno: {shown} (celkem {total}) · klikněte pro potvrzení · ←→ navigace · Enter potvrzení`,
        'sprite.confirmHint': `Klikněte pro potvrzení · ←→ navigace · Enter potvrzení`,
        'sprite.adding': `Přidávání...`,
        'sprite.done': `Hotovo ({count})`,
        'gender.male': `Muž`,
        'gender.female': `Žena`,
        'gender.transMale': `Transgender muž`,
        'gender.transFemale': `Transgender žena`,
        'gender.nonBinary': `Ne-binární`,
        'gender.intersex': `Intersex`,
        'card.excellent': `Výborná shoda`,
        'card.good': `Dobrá shoda`,
        'card.uncertain': `Nejistá shoda`,
        'card.select': `Vybrat {name}`,
        'card.deselect': `Zrušit výběr {name}`,
        'card.openOn': `Otevřít na {source}`,
        'search.overlayHint': `Přetáhněte pro výběr tváře — Enter pro skenování celého snímku — Esc pro zrušení`,
        'search.noFaces': `Ve vybrané oblasti nebyly nalezeny žádné tváře. Zkuste užší ořez nebo stiskněte Enter pro skenování celého snímku.`,
        'search.captureMediaFail': `Nepodařilo se zachytit média. Ujistěte se, že scéna/obrázek je plně načten.`,
        'search.healthBanner': `API pro rozpoznávání tváří je nedosažitelné. Spusťte backend a zkuste to znovu.`,
        'search.failed': `Hledání tváře se nezdařilo: {error}`,
        'search.fetchImageFail': `Nepodařilo se načíst obrázek ze Stash.`,
        'search.captureFail': `Nepodařilo se zachytit obrázek: {error}`,
        'search.selectFaceImage': `Vyberte tvář v obrázku.`,
        'search.captureFrameFail': `Nepodařilo se zachytit aktuální snímek.`,
        'search.captureFrameFail2': `Chyba při zachycení aktuálního snímku.`,
        'search.selectFaceVideo': `Vyberte tvář v oblasti přehrávače videa.`,
        'search.menuItemTitle': `Přetáhněte rámeček kolem tváře nebo stiskněte Enter pro skenování celého snímku, abyste vyhledali shody v StashDB`,
        'search.currentFrame': `Visage: aktuální snímek`,
        'scene.noSprite': `Pro tuto scénu nebyl nalezen žádný sprite list ani náhledové video. Vygenerujte je v nastavení scény a zkuste to znovu.`,
        'scene.noFaces': `Ve sprite listu nebo náhledovém videu této scény nebyly nalezeny žádné tváře ani performeři.`,
        'scene.healthBanner': `API pro rozpoznávání tváří je nedosažitelné. Spusťte backend a zkuste to znovu.`,
        'scene.failed': `Skenování scény se nezdařilo: {error}`,
        'scene.menuItemTitle': `Identifikujte každého performera ve scéně (vyžaduje vygenerovaný sprite list nebo náhledové video)`,
        'scene.wholeScene': `Visage: celá scéna`,
        'banner.changeBackend': `Změnit backend`,
        'banner.dismiss': `Zavřít`,
        'error.dismiss': `Zavřít`,
        'firstRun.title': `Nastavte backend Visage`,
        'firstRun.subtitle': `Visage odesílá obrázky tváří do backendu pro rozpoznání. Vyberte, kde jej spustit.`,
        'firstRun.cloud': `Použít cloud Hugging Face`,
        'firstRun.cloudNote': `Bez nastavování. Obrázky jsou odesílány do cloudové služby Hugging Face.`,
        'firstRun.local': `Použít vlastní server`,
        'firstRun.localNote': `Spusťte soukromý binární soubor na vlastním počítači nebo v síti.`,
        'firstRun.skip': `Přeskočit prozatím`,
        'badge.local': `Místní`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Backend Visage: {label}`,
        'donate.enjoying': `Líbí se vám Visage? Pomozte ho udržet`,
        'donate.supportPatreon': `Podpořit na Patreon`,
        'frame.close': `Zavřít výběr snímku`,
        'frame.seekFail': `Nepodařilo se přetočit přehrávač videa.`,
        'frame.selectAt': `Vybrat snímek tváře v {time} s`,
    };

    const hr = {
        'backendSettings.title': `Postavke pozadinskog poslužitelja`,
        'backendSettings.closeAria': `Zatvori postavke`,
        'backendSettings.backendAria': `Postavke pozadinskog poslužitelja`,
        'backendSettings.changeBackend': `Promijeni pozadinski poslužitelj`,
        'backendSettings.backendLabel': `Pozadinski poslužitelj`,
        'backendSettings.local': `Lokalno`,
        'backendSettings.cloud': `Oblak (Hugging Face)`,
        'backendSettings.cloudNote': `Slike se šalju u oblačnu uslugu Hugging Face.`,
        'backendSettings.hintPrefix': `Želite li da vaše slike ostanu u vašoj mreži?`,
        'backendSettings.hintLink': `Pokrenite privatni poslužitelj putem Patreona`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `Sigurnosna politika preglednika (CSP) prema zadanim postavkama dopušta samo`,
        'backendSettings.csp2': `. Da biste dohvatili lokalni pozadinski poslužitelj na drugoj adresi (npr. IP vaše lokalne mreže), dodajte ga u`,
        'backendSettings.csp3': `popis u`,
        'backendSettings.csp4': `datoteci u mapi dodataka Stash, inače će zahtjevi biti blokirani. Napomena: ažuriranje Visagea ponovno instalira`,
        'backendSettings.csp5': `, pa to morate ponoviti nakon svakog ažuriranja.`,
        'backendSettings.testing': `Testiranje veze…`,
        'backendSettings.testConnection': `Testiraj vezu`,
        'backendSettings.testingShort': `Testiranje…`,
        'backendSettings.cancel': `Odustani`,
        'backendSettings.save': `Spremi`,
        'backendSettings.feedback.reachable': `Veza uspješna. Pozadinski poslužitelj je spreman.`,
        'backendSettings.feedback.degraded': `Pozadinski poslužitelj je dostupan, ali smanjenih performansi (modeli ili indeks nisu učitani).`,
        'backendSettings.feedback.unreachable': `Pozadinski poslužitelj je nedostupan. Provjerite URL i uvjerite se da poslužitelj radi.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `TRENUTNI OKVIR`,
        'faceMatch.close': `Zatvori`,
        'faceMatch.facesSelected': `Pronađena lica: {faces} · odabrano: {selected}`,
        'faceMatch.inScene': `· {count} u sceni`,
        'faceMatch.stashboxMissing': `Stash-box nije konfiguriran.`,
        'faceMatch.stashboxMissingBody': ` Dodajte pružatelja stash-box u Settings → Metadata Providers da biste omogućili uvoz izvođača.`,
        'faceMatch.stashboxWrongName': `Pružatelj "StashDB" nije pronađen.`,
        'faceMatch.stashboxWrongNameBody': ` Uvoz izvođača zahtijeva pružatelja naziva "StashDB". Preimenujte pružatelja u Settings → Metadata Providers.`,
        'faceMatch.learnMore': `Saznajte više.`,
        'faceMatch.scanning': `Skeniranje • prepoznavanje lica…`,
        'faceMatch.faceAlt': `Lice {index}`,
        'faceMatch.minConf': `Min. povj.`,
        'faceMatch.minConfTitle': `Minimalna pouzdanost: {percent}%`,
        'faceMatch.detected': `Otkriveno`,
        'faceMatch.detectedFaceAlt': `Otkriveno lice`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Podržite na Patreonu`,
        'faceMatch.ofSelected': `Odabrano {selected} od {total}`,
        'faceMatch.allInScene': `Pronađena lica: {total} · sva u sceni`,
        'faceMatch.clickToSelect': `Pronađena lica: {total} · kliknite za odabir`,
        'faceMatch.kbSwitch': `Promjena lica`,
        'faceMatch.kbSelect': `Odabir izvođača`,
        'faceMatch.kbToggle': `Uključi/isključi odabir`,
        'faceMatch.kbAddInstant': `Shift+klik za trenutno dodavanje`,
        'faceMatch.selectBest': `Odaberi najbolja podudaranja`,
        'faceMatch.adding': `Dodavanje...`,
        'faceMatch.done': `Gotovo ({count})`,
        'faceMatch.toast.added': `Izvođač je dodan u {target}.`,
        'faceMatch.toast.addError': `Neuspješno dodavanje izvođača: {error}`,
        'faceMatch.toast.noStashbox': `Stash-box nije konfiguriran. Dodajte pružatelja stash-box u Settings → Metadata Providers da biste omogućili uvoz izvođača. Pogledajte {url}`,
        'faceMatch.toast.noProvider': `Pružatelj "StashDB" nije pronađen. Preimenujte pružatelja u "StashDB" u Settings → Metadata Providers da biste omogućili uvoz izvođača.`,
        'faceMatch.toast.configureProvider': `Konfigurirajte pružatelja stash-box u Settings → Metadata Providers da biste omogućili uvoz izvođača.`,
        'faceMatch.toast.addedMultiple': `Dodano izvođača: {count} u {target}.`,
        'sprite.title': `IZVOĐAČI SCENE`,
        'sprite.close': `Zatvori`,
        'sprite.foundConfirmed': `Pronađeno: {found} · potvrđeno: {confirmed}`,
        'sprite.confidence': `pouzdanost`,
        'sprite.name': `ime`,
        'sprite.hits': `podudaranja`,
        'sprite.minConf': `Min. povj.`,
        'sprite.minConfTitle': `Minimalna pouzdanost: {percent}%`,
        'sprite.scanning': `Visage skeniranje…`,
        'sprite.cancel': `Odustani`,
        'sprite.empty': `U ovom spriteu nisu identificirani izvođači.`,
        'sprite.detectedFaceAlt': `Otkriveno lice`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `U sceni`,
        'sprite.hitsCount': `Podudaranja: {count}`,
        'sprite.totalTime': `Ukupno {time}`,
        'sprite.alreadyInScene': `Već u sceni`,
        'sprite.clickToConfirm': `Kliknite za potvrdu`,
        'sprite.confirmed': `Potvrđeno`,
        'sprite.supportPatreon': `Podržite na Patreonu`,
        'sprite.confirmedCount': `Potvrđeno {confirmed} od {total}`,
        'sprite.shownHint': `Prikazano: {shown} (ukupno {total}) · kliknite za potvrdu · ←→ navigacija · Enter potvrda`,
        'sprite.confirmHint': `Kliknite za potvrdu · ←→ navigacija · Enter potvrda`,
        'sprite.adding': `Dodavanje...`,
        'sprite.done': `Gotovo ({count})`,
        'gender.male': `Muško`,
        'gender.female': `Žensko`,
        'gender.transMale': `Transrodno muško`,
        'gender.transFemale': `Transrodno žensko`,
        'gender.nonBinary': `Nebinarno`,
        'gender.intersex': `Interseks`,
        'card.excellent': `Izvrsno podudaranje`,
        'card.good': `Dobro podudaranje`,
        'card.uncertain': `Nesigurno podudaranje`,
        'card.select': `Odaberi {name}`,
        'card.deselect': `Poništi odabir {name}`,
        'card.openOn': `Otvori na {source}`,
        'search.overlayHint': `Povucite za odabir lica — Enter za skeniranje cijelog okvira — Esc za odustajanje`,
        'search.noFaces': `U odabranom području nisu pronađena lica. Pokušajte s užim kadrom ili pritisnite Enter za skeniranje cijelog okvira.`,
        'search.captureMediaFail': `Neuspješno snimanje medija. Provjerite je li scena/slika u potpunosti učitana.`,
        'search.healthBanner': `API za prepoznavanje lica nije dostupan. Pokrenite pozadinski poslužitelj i pokušajte ponovno.`,
        'search.failed': `Pretraga lica nije uspjela: {error}`,
        'search.fetchImageFail': `Neuspješno dohvaćanje slike iz Stasha.`,
        'search.captureFail': `Neuspješno snimanje slike: {error}`,
        'search.selectFaceImage': `Odaberite lice unutar slike.`,
        'search.captureFrameFail': `Neuspješno snimanje trenutnog okvira.`,
        'search.captureFrameFail2': `Greška pri snimanju trenutnog okvira.`,
        'search.selectFaceVideo': `Odaberite lice unutar područja video playera.`,
        'search.menuItemTitle': `Povucite okvir oko lica ili pritisnite Enter za skeniranje cijelog okvira, da biste pretražili podudaranja u StashDB`,
        'search.currentFrame': `Visage: trenutni okvir`,
        'scene.noSprite': `Za ovu scenu nije pronađen sprite sheet ni video pregled. Generirajte ih u postavkama scene i pokušajte ponovno.`,
        'scene.noFaces': `U sprite sheetu ili videu pregleda ove scene nisu pronađena lica ni izvođači.`,
        'scene.healthBanner': `API za prepoznavanje lica nije dostupan. Pokrenite pozadinski poslužitelj i pokušajte ponovno.`,
        'scene.failed': `Skeniranje scene nije uspjelo: {error}`,
        'scene.menuItemTitle': `Identificirajte svakog izvođača u sceni (zahtijeva generirani sprite sheet ili video pregled)`,
        'scene.wholeScene': `Visage: cijela scena`,
        'banner.changeBackend': `Promijeni pozadinski poslužitelj`,
        'banner.dismiss': `Odbaci`,
        'error.dismiss': `Odbaci`,
        'firstRun.title': `Postavite svoj Visage pozadinski poslužitelj`,
        'firstRun.subtitle': `Visage šalje slike lica pozadinskom poslužitelju na prepoznavanje. Odaberite gdje ga pokrenuti.`,
        'firstRun.cloud': `Koristi oblak Hugging Face`,
        'firstRun.cloudNote': `Bez postavljanja. Slike se šalju u oblačnu uslugu Hugging Face.`,
        'firstRun.local': `Koristi vlastiti poslužitelj`,
        'firstRun.localNote': `Pokrenite privatnu datoteku na svojem računalu ili u svojoj mreži.`,
        'firstRun.skip': `Preskoči za sada`,
        'badge.local': `Lokalno`,
        'badge.cloud': `Oblak (Hugging Face)`,
        'badge.title': `Visage pozadinski poslužitelj: {label}`,
        'donate.enjoying': `Sviđa vam se Visage? Pomozite ga održati na životu`,
        'donate.supportPatreon': `Podržite na Patreonu`,
        'frame.close': `Zatvori odabir okvira`,
        'frame.seekFail': `Neuspješno pomicanje video playera.`,
        'frame.selectAt': `Odaberite okvir lica na {time} s`,
    };

    const th = {
        'backendSettings.title': `การตั้งค่าแบ็กเอนด์`,
        'backendSettings.closeAria': `ปิดการตั้งค่า`,
        'backendSettings.backendAria': `การตั้งค่าแบ็กเอนด์`,
        'backendSettings.changeBackend': `เปลี่ยนแบ็กเอนด์`,
        'backendSettings.backendLabel': `แบ็กเอนด์`,
        'backendSettings.local': `ภายในเครื่อง`,
        'backendSettings.cloud': `คลาวด์ (Hugging Face)`,
        'backendSettings.cloudNote': `รูปภาพจะถูกส่งไปยังบริการคลาวด์ Hugging Face`,
        'backendSettings.hintPrefix': `ต้องการเก็บรูปภาพไว้ในเครือข่ายของคุณหรือไม่`,
        'backendSettings.hintLink': `เรียกใช้เซิร์ฟเวอร์ส่วนตัวผ่าน Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `นโยบายความปลอดภัยของเบราว์เซอร์ (CSP) อนุญาตเฉพาะ`,
        'backendSettings.csp2': `ตามค่าเริ่มต้น หากต้องการเข้าถึงแบ็กเอนด์ภายในเครื่องที่อยู่ที่อยู่อื่น (เช่น IP แลนของคุณ) ให้เพิ่มลงใน`,
        'backendSettings.csp3': `ใน`,
        'backendSettings.csp4': `ภายในโฟลเดอร์ปลั๊กอิน Stash ของคุณ มิฉะนั้นคำขอจะถูกบล็อก หมายเหตุ: การอัปเดต Visage จะติดตั้ง`,
        'backendSettings.csp5': `ใหม่ ดังนั้นต้องนำกลับมาใช้ใหม่หลังจากการอัปเดตทุกครั้ง`,
        'backendSettings.testing': `กำลังทดสอบการเชื่อมต่อ…`,
        'backendSettings.testConnection': `ทดสอบการเชื่อมต่อ`,
        'backendSettings.testingShort': `กำลังทดสอบ…`,
        'backendSettings.cancel': `ยกเลิก`,
        'backendSettings.save': `บันทึก`,
        'backendSettings.feedback.reachable': `เชื่อมต่อสำเร็จ แบ็กเอนด์พร้อมใช้งานแล้ว`,
        'backendSettings.feedback.degraded': `เข้าถึงแบ็กเอนด์ได้แต่ประสิทธิภาพลดลง (โมเดลหรือดัชนียังไม่โหลด)`,
        'backendSettings.feedback.unreachable': `ไม่สามารถเข้าถึงแบ็กเอนด์ได้ ตรวจสอบ URL และยืนยันว่าแบ็กเอนด์กำลังทำงาน`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `เฟรมปัจจุบัน`,
        'faceMatch.close': `ปิด`,
        'faceMatch.facesSelected': `พบใบหน้า {faces} ใบ · เลือกแล้ว {selected}`,
        'faceMatch.inScene': `· {count} ในฉาก`,
        'faceMatch.stashboxMissing': `ยังไม่ได้กำหนดค่า stash-box`,
        'faceMatch.stashboxMissingBody': ` เพิ่มผู้ให้บริการ stash-box ในการตั้งค่า → ผู้ให้บริการเมตาดาต้าเพื่อเปิดใช้งานการนำเข้านักแสดง`,
        'faceMatch.stashboxWrongName': `ไม่พบผู้ให้บริการ "StashDB"`,
        'faceMatch.stashboxWrongNameBody': ` การนำเข้านักแสดงต้องมีผู้ให้บริการชื่อ "StashDB" เปลี่ยนชื่อผู้ให้บริการของคุณในการตั้งค่า → ผู้ให้บริการเมตาดาต้า`,
        'faceMatch.learnMore': `เรียนรู้เพิ่มเติม`,
        'faceMatch.scanning': `กำลังสแกน · การจดจำใบหน้า…`,
        'faceMatch.faceAlt': `ใบหน้า {index}`,
        'faceMatch.minConf': `ความมั่นใจต่ำสุด`,
        'faceMatch.minConfTitle': `ความมั่นใจต่ำสุด: {percent}%`,
        'faceMatch.detected': `ตรวจพบแล้ว`,
        'faceMatch.detectedFaceAlt': `ใบหน้าที่ตรวจพบ`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `สนับสนุนบน Patreon`,
        'faceMatch.ofSelected': `เลือก {selected} จาก {total}`,
        'faceMatch.allInScene': `พบใบหน้า {total} ใบ · ทั้งหมดในฉาก`,
        'faceMatch.clickToSelect': `พบใบหน้า {total} ใบ · คลิกเพื่อเลือก`,
        'faceMatch.kbSwitch': `สลับใบหน้า`,
        'faceMatch.kbSelect': `เลือกนักแสดง`,
        'faceMatch.kbToggle': `สลับการเลือก`,
        'faceMatch.kbAddInstant': `Shift+คลิกเพื่อเพิ่มทันที`,
        'faceMatch.selectBest': `เลือกผลลัพธ์ที่ดีที่สุด`,
        'faceMatch.adding': `กำลังเพิ่ม...`,
        'faceMatch.done': `เสร็จสิ้น ({count})`,
        'faceMatch.toast.added': `เพิ่มนักแสดงลงใน {target} แล้ว`,
        'faceMatch.toast.addError': `เพิ่มนักแสดงไม่สำเร็จ: {error}`,
        'faceMatch.toast.noStashbox': `ยังไม่ได้กำหนดค่า stash-box เพิ่มผู้ให้บริการ stash-box ในการตั้งค่า → ผู้ให้บริการเมตาดาต้าเพื่อเปิดใช้งานการนำเข้านักแสดง ดู {url}`,
        'faceMatch.toast.noProvider': `ไม่พบผู้ให้บริการชื่อ "StashDB" เปลี่ยนชื่อผู้ให้บริการของคุณเป็น "StashDB" ในการตั้งค่า → ผู้ให้บริการเมตาดาต้าเพื่อเปิดใช้งานการนำเข้านักแสดง`,
        'faceMatch.toast.configureProvider': `กำหนดค่าผู้ให้บริการ stash-box ในการตั้งค่า → ผู้ให้บริการเมตาดาต้าเพื่อเปิดใช้งานการนำเข้านักแสดง`,
        'faceMatch.toast.addedMultiple': `เพิ่มนักแสดง {count} คน{s}ลงใน {target} แล้ว`,
        'sprite.title': `นักแสดงในฉาก`,
        'sprite.close': `ปิด`,
        'sprite.foundConfirmed': `พบ {found} · ยืนยันแล้ว {confirmed}`,
        'sprite.confidence': `ความมั่นใจ`,
        'sprite.name': `ชื่อ`,
        'sprite.hits': `การเข้าชม`,
        'sprite.minConf': `ความมั่นใจต่ำสุด`,
        'sprite.minConfTitle': `ความมั่นใจต่ำสุด: {percent}%`,
        'sprite.scanning': `Visage กำลังสแกน…`,
        'sprite.cancel': `ยกเลิก`,
        'sprite.empty': `ไม่พบนักแสดงที่ระบุในสไปรต์นี้`,
        'sprite.detectedFaceAlt': `ใบหน้าที่ตรวจพบ`,
        'sprite.spriteLabel': `สไปรต์`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `ในฉาก`,
        'sprite.hitsCount': `เข้าชม {count} ครั้ง{s}`,
        'sprite.totalTime': `รวม {time}`,
        'sprite.alreadyInScene': `อยู่ในฉากแล้ว`,
        'sprite.clickToConfirm': `คลิกเพื่อยืนยัน`,
        'sprite.confirmed': `ยืนยันแล้ว`,
        'sprite.supportPatreon': `สนับสนุนบน Patreon`,
        'sprite.confirmedCount': `ยืนยัน {confirmed} จาก {total}`,
        'sprite.shownHint': `แสดง {shown} (รวม {total}) · คลิกเพื่อยืนยัน · ←→ นำทาง · Enter ยืนยัน`,
        'sprite.confirmHint': `คลิกเพื่อยืนยัน · ←→ นำทาง · Enter ยืนยัน`,
        'sprite.adding': `กำลังเพิ่ม...`,
        'sprite.done': `เสร็จสิ้น ({count})`,
        'gender.male': `ชาย`,
        'gender.female': `หญิง`,
        'gender.transMale': `ชายข้ามเพศ`,
        'gender.transFemale': `หญิงข้ามเพศ`,
        'gender.nonBinary': `ไม่ใช่สองเพศ`,
        'gender.intersex': `ภาวะเพศกำกวม`,
        'card.excellent': `การจับคู่ที่ดีเยี่ยม`,
        'card.good': `การจับคู่ที่ดี`,
        'card.uncertain': `การจับคู่ที่ไม่แน่นอน`,
        'card.select': `เลือก {name}`,
        'card.deselect': `ยกเลิกการเลือก {name}`,
        'card.openOn': `เปิดบน {source}`,
        'search.overlayHint': `ลากเพื่อเลือกใบหน้า — Enter เพื่อสแกนทั้งเฟรม — Esc เพื่อยกเลิก`,
        'search.noFaces': `ไม่พบใบหน้าในการเลือกนั้น ลองครอบให้แคบลง หรือกด Enter เพื่อสแกนทั้งเฟรม`,
        'search.captureMediaFail': `ไม่สามารถจับภาพสื่อได้ โปรดตรวจสอบว่าฉาก/รูปภาพโหลดเสร็จสมบูรณ์`,
        'search.healthBanner': `ไม่สามารถเข้าถึง API การจดจำใบหน้า เริ่มแบ็กเอนด์แล้วลองอีกครั้ง`,
        'search.failed': `การค้นหาใบหน้าล้มเหลว: {error}`,
        'search.fetchImageFail': `ไม่สามารถดึงรูปภาพจาก Stash ได้`,
        'search.captureFail': `การจับภาพล้มเหลว: {error}`,
        'search.selectFaceImage': `เลือกใบหน้าภายในรูปภาพ`,
        'search.captureFrameFail': `ไม่สามารถจับภาพเฟรมปัจจุบันได้`,
        'search.captureFrameFail2': `การจับภาพเฟรมปัจจุบันล้มเหลว`,
        'search.selectFaceVideo': `เลือกใบหน้าภายในพื้นที่เครื่องเล่นวิดีโอ`,
        'search.menuItemTitle': `ลากกล่องรอบใบหน้า หรือกด Enter เพื่อสแกนทั้งเฟรม เพื่อค้นหาการจับคู่บน StashDB`,
        'search.currentFrame': `Visage: เฟรมปัจจุบัน`,
        'scene.noSprite': `ไม่พบสไปรต์ชีตหรือวิดีโอตัวอย่างสำหรับฉากนี้ สร้างในการตั้งค่าฉาก แล้วลองอีกครั้ง`,
        'scene.noFaces': `ไม่พบใบหน้าหรือนักแสดงในสไปรต์ชีตหรือวิดีโอตัวอย่างของฉากนี้`,
        'scene.healthBanner': `ไม่สามารถเข้าถึง API การจดจำใบหน้า เริ่มแบ็กเอนด์แล้วลองอีกครั้ง`,
        'scene.failed': `การสแกนฉากล้มเหลว: {error}`,
        'scene.menuItemTitle': `ระบุนักแสดงทุกคนในฉาก (ต้องมีสไปรต์ชีตหรือวิดีโอตัวอย่างที่สร้างแล้ว)`,
        'scene.wholeScene': `Visage: ทั้งฉาก`,
        'banner.changeBackend': `เปลี่ยนแบ็กเอนด์`,
        'banner.dismiss': `ปิด`,
        'error.dismiss': `ปิด`,
        'firstRun.title': `ตั้งค่าแบ็กเอนด์ Visage ของคุณ`,
        'firstRun.subtitle': `Visage ส่งภาพใบหน้าไปยังแบ็กเอนด์เพื่อการจดจำ เลือกสถานที่ที่จะเรียกใช้`,
        'firstRun.cloud': `ใช้คลาวด์ Hugging Face`,
        'firstRun.cloudNote': `ไม่ต้องตั้งค่าใดๆ รูปภาพจะถูกส่งไปยังบริการคลาวด์ Hugging Face`,
        'firstRun.local': `ใช้เซิร์ฟเวอร์ของฉันเอง`,
        'firstRun.localNote': `เรียกใช้ไฟล์ส่วนตัวบนเครื่องหรือเครือข่ายของคุณเอง`,
        'firstRun.skip': `ข้ามไปก่อน`,
        'badge.local': `ภายในเครื่อง`,
        'badge.cloud': `คลาวด์ (Hugging Face)`,
        'badge.title': `แบ็กเอนด์ Visage: {label}`,
        'donate.enjoying': `ชอบ Visage หรือไม่ ช่วยสนับสนุนให้มันคงอยู่ต่อไป`,
        'donate.supportPatreon': `สนับสนุนบน Patreon`,
        'frame.close': `ปิดตัวเลือกเฟรม`,
        'frame.seekFail': `ไม่สามารถเลื่อนไปยังตำแหน่งในเครื่องเล่นวิดีโอได้`,
        'frame.selectAt': `เลือกเฟรมใบหน้าที่ {time} วินาที`,
    };

    // Brazilian Portuguese. Missing keys fall back to English automatically.
    const pt = {
        // ---- BackendSettings.tsx ----
        'backendSettings.title': `Configurações do backend`,
        'backendSettings.closeAria': `Fechar configurações`,
        'backendSettings.backendAria': `Configurações do backend`,
        'backendSettings.changeBackend': `Alterar backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Local`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `As imagens são enviadas ao serviço de nuvem Hugging Face.`,
        'backendSettings.hintPrefix': `Quer que suas imagens permaneçam na sua rede?`,
        'backendSettings.hintLink': `Execute um servidor privado via Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `A política de segurança do navegador (CSP) só permite`,
        'backendSettings.csp2': `por padrão. Para acessar um backend local em outro endereço (por exemplo, seu IP LAN), adicione-o à`,
        'backendSettings.csp3': `lista no arquivo`,
        'backendSettings.csp4': `dentro da sua pasta de plugins do Stash; caso contrário, as solicitações serão bloqueadas. Observação: atualizar o Visage reinstala`,
        'backendSettings.csp5': `, então isso deve ser reaplicado após cada atualização.`,
        'backendSettings.testing': `Testando a conexão…`,
        'backendSettings.testConnection': `Testar conexão`,
        'backendSettings.testingShort': `Testando…`,
        'backendSettings.cancel': `Cancelar`,
        'backendSettings.save': `Salvar`,
        'backendSettings.feedback.reachable': `Conexão bem-sucedida. O backend está pronto.`,
        'backendSettings.feedback.degraded': `Backend acessível, mas degradado (modelos ou índice não carregados).`,
        'backendSettings.feedback.unreachable': `Backend inacessível. Verifique a URL e se o backend está em execução.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        // ---- FaceMatchModal.tsx ----
        'faceMatch.title': `QUADRO ATUAL`,
        'faceMatch.close': `Fechar`,
        'faceMatch.facesSelected': `{faces} rostos encontrados · {selected} selecionados`,
        'faceMatch.inScene': `· {count} na cena`,
        'faceMatch.stashboxMissing': `Nenhum stash-box configurado.`,
        'faceMatch.stashboxMissingBody': ` Adicione um provedor de stash-box em Configurações → Provedores de metadados para ativar a importação de artistas.`,
        'faceMatch.stashboxWrongName': `Nenhum provedor chamado "StashDB" encontrado.`,
        'faceMatch.stashboxWrongNameBody': ` A importação de artistas requer um provedor chamado "StashDB". Renomeie seu provedor em Configurações → Provedores de metadados.`,
        'faceMatch.learnMore': `Saiba mais.`,
        'faceMatch.scanning': `Escaneando • reconhecimento facial…`,
        'faceMatch.faceAlt': `Rosto {index}`,
        'faceMatch.minConf': `Conf. mín.`,
        'faceMatch.minConfTitle': `Confiança mínima: {percent}%`,
        'faceMatch.detected': `Detectado`,
        'faceMatch.detectedFaceAlt': `Rosto detectado`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Apoiar no Patreon`,
        'faceMatch.ofSelected': `{selected} de {total} selecionados`,
        'faceMatch.allInScene': `{total} rostos encontrados · todos na cena`,
        'faceMatch.clickToSelect': `{total} rostos encontrados · clique para selecionar`,
        'faceMatch.kbSwitch': `Alternar rostos`,
        'faceMatch.kbSelect': `Selecionar artistas`,
        'faceMatch.kbToggle': `Alternar seleção`,
        'faceMatch.kbAddInstant': `Shift+clique para adicionar instantaneamente`,
        'faceMatch.selectBest': `Selecionar melhores correspondências`,
        'faceMatch.adding': `Adicionando...`,
        'faceMatch.done': `Concluir ({count})`,
        'faceMatch.toast.added': `Artista adicionado ao {target}.`,
        'faceMatch.toast.addError': `Falha ao adicionar o artista: {error}`,
        'faceMatch.toast.noStashbox': `Nenhum stash-box configurado. Adicione um provedor de stash-box em Configurações → Provedores de metadados para ativar a importação de artistas. Veja {url}`,
        'faceMatch.toast.noProvider': `Nenhum provedor chamado "StashDB" encontrado. Renomeie seu provedor para "StashDB" em Configurações → Provedores de metadados para ativar a importação de artistas.`,
        'faceMatch.toast.configureProvider': `Configure um provedor de stash-box em Configurações → Provedores de metadados para ativar a importação de artistas.`,
        'faceMatch.toast.addedMultiple': `{count} artista{s} adicionado{s} ao {target}.`,
        // ---- SpriteResultModal.tsx ----
        'sprite.title': `ARTISTAS DA CENA`,
        'sprite.close': `Fechar`,
        'sprite.foundConfirmed': `{found} encontrados · {confirmed} confirmados`,
        'sprite.confidence': `confiança`,
        'sprite.name': `nome`,
        'sprite.hits': `acertos`,
        'sprite.minConf': `Conf. mín.`,
        'sprite.minConfTitle': `Confiança mínima: {percent}%`,
        'sprite.scanning': `Visage escaneando…`,
        'sprite.cancel': `Cancelar`,
        'sprite.empty': `Nenhum artista identificado neste sprite.`,
        'sprite.detectedFaceAlt': `Rosto detectado`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `Na cena`,
        'sprite.hitsCount': `{count} acerto{s}`,
        'sprite.totalTime': `{time} no total`,
        'sprite.alreadyInScene': `Já na cena`,
        'sprite.clickToConfirm': `Clique para confirmar`,
        'sprite.confirmed': `Confirmado`,
        'sprite.supportPatreon': `Apoiar no Patreon`,
        'sprite.confirmedCount': `{confirmed} de {total} confirmados`,
        'sprite.shownHint': `{shown} exibidos ({total} no total) · clique para confirmar · ←→ navegar · Enter confirmar`,
        'sprite.confirmHint': `Clique para confirmar · ←→ navegar · Enter confirmar`,
        'sprite.adding': `Adicionando...`,
        'sprite.done': `Concluir ({count})`,
        // ---- PerformerCard.tsx ----
        'gender.male': `Masculino`,
        'gender.female': `Feminino`,
        'gender.transMale': `Homem transgênero`,
        'gender.transFemale': `Mulher transgênero`,
        'gender.nonBinary': `Não binário`,
        'gender.intersex': `Intersexo`,
        'card.excellent': `Correspondência excelente`,
        'card.good': `Boa correspondência`,
        'card.uncertain': `Correspondência incerta`,
        'card.select': `Selecionar {name}`,
        'card.deselect': `Desselecionar {name}`,
        'card.openOn': `Abrir em {source}`,
        // ---- FaceSearchButton.tsx ----
        'search.overlayHint': `Arraste para selecionar um rosto — Enter para escanear a imagem inteira — Esc para cancelar`,
        'search.noFaces': `Nenhum rosto encontrado nessa seleção. Tente um recorte mais fechado ou pressione Enter para escanear a imagem inteira.`,
        'search.captureMediaFail': `Não foi possível capturar a mídia. Certifique-se de que a cena/imagem está totalmente carregada.`,
        'search.healthBanner': `A API de reconhecimento facial não está acessível. Inicie o backend e tente novamente.`,
        'search.failed': `A busca facial falhou: {error}`,
        'search.fetchImageFail': `Não foi possível buscar a imagem no Stash.`,
        'search.captureFail': `Falha ao capturar a imagem: {error}`,
        'search.selectFaceImage': `Selecione um rosto dentro da imagem.`,
        'search.captureFrameFail': `Não foi possível capturar o quadro atual.`,
        'search.captureFrameFail2': `Falha ao capturar o quadro atual.`,
        'search.selectFaceVideo': `Selecione um rosto dentro da área do player de vídeo.`,
        'search.menuItemTitle': `Arraste uma caixa ao redor de um rosto ou pressione Enter para escanear a imagem inteira, para buscar correspondências no StashDB`,
        'search.currentFrame': `Visage: Quadro atual`,
        // ---- SceneScanButton.tsx ----
        'scene.noSprite': `Nenhuma folha de sprites ou vídeo de prévia encontrado para esta cena. Gere-os nas configurações da cena e tente novamente.`,
        'scene.noFaces': `Nenhum rosto ou artista encontrado na folha de sprites ou no vídeo de prévia desta cena.`,
        'scene.healthBanner': `A API de reconhecimento facial não está acessível. Inicie o backend e tente novamente.`,
        'scene.failed': `A varredura da cena falhou: {error}`,
        'scene.menuItemTitle': `Identificar cada artista na cena (requer uma folha de sprites ou um vídeo de prévia gerados)`,
        'scene.wholeScene': `Visage: Cena inteira`,
        // ---- BackendHealthBanner.tsx ----
        'banner.changeBackend': `Alterar backend`,
        'banner.dismiss': `Dispensar`,
        // ---- ErrorDialog.tsx ----
        'error.dismiss': `Dispensar`,
        // ---- FirstRunDialog.tsx ----
        'firstRun.title': `Configure seu backend do Visage`,
        'firstRun.subtitle': `O Visage envia imagens de rostos a um backend para reconhecimento. Escolha onde executá-lo.`,
        'firstRun.cloud': `Usar o cloud Hugging Face`,
        'firstRun.cloudNote': `Sem configuração. As imagens são enviadas ao serviço de nuvem Hugging Face.`,
        'firstRun.local': `Usar meu próprio servidor`,
        'firstRun.localNote': `Execute o binário privado na sua própria máquina ou rede.`,
        'firstRun.skip': `Pular por enquanto`,
        // ---- BackendBadge.tsx ----
        'badge.local': `Local`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Backend do Visage: {label}`,
        // ---- DonateFooter.tsx ----
        'donate.enjoying': `Gostando do Visage? Ajude a mantê-lo vivo`,
        'donate.supportPatreon': `Apoiar no Patreon`,
        // ---- FaceFrameSelector.tsx ----
        'frame.close': `Fechar seletor de quadro`,
        'frame.seekFail': `Falha ao buscar no player de vídeo.`,
        'frame.selectAt': `Selecionar rosto em {time}s`,
    };

    // Danish.
    const da = {
        'backendSettings.title': `Backend-indstillinger`,
        'backendSettings.closeAria': `Luk indstillinger`,
        'backendSettings.backendAria': `Backend-indstillinger`,
        'backendSettings.changeBackend': `Skift backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Lokal`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Billeder sendes til Hugging Face cloud-tjenesten.`,
        'backendSettings.hintPrefix': `Vil du have dine billeder til at blive på dit netværk?`,
        'backendSettings.hintLink': `Kør en privat server via Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': "Browserens sikkerhedspolitik (CSP) tillader kun",
        'backendSettings.csp2': `som standard. For at nå en lokal backend på en anden adresse (f.eks. din LAN-IP) skal du tilføje den til`,
        'backendSettings.csp3': `listen i`,
        'backendSettings.csp4': `filen i din Stash plugins-mappe, ellers blokeres anmodningerne. Bemærk: opdatering af Visage geninstallerer`,
        'backendSettings.csp5': `, så dette skal gøres igen efter hver opdatering.`,
        'backendSettings.testing': `Tester forbindelse…`,
        'backendSettings.testConnection': `Test forbindelse`,
        'backendSettings.testingShort': `Tester…`,
        'backendSettings.cancel': `Annullér`,
        'backendSettings.save': `Gem`,
        'backendSettings.feedback.reachable': `Forbindelsen lykkedes. Backend er klar.`,
        'backendSettings.feedback.degraded': `Backend er tilgængelig, men forringet (modeller eller indeks er ikke indlæst).`,
        'backendSettings.feedback.unreachable': `Backend er utilgængelig. Tjek URL'en, og at backend kører.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `AKTUELLE RAMME`,
        'faceMatch.close': `Luk`,
        'faceMatch.facesSelected': `{faces} ansigter fundet · {selected} valgt`,
        'faceMatch.inScene': `· {count} i scene`,
        'faceMatch.stashboxMissing': `Ingen stash-box konfigureret.`,
        'faceMatch.stashboxMissingBody': ` Tilføj en stash-box-udbyder under Indstillinger → Metadata-udbydere for at aktivere performer-import.`,
        'faceMatch.stashboxWrongName': `Ingen "StashDB"-udbyder fundet.`,
        'faceMatch.stashboxWrongNameBody': ` Performer-import kræver en udbyder kaldet "StashDB". Omdøb din udbyder under Indstillinger → Metadata-udbydere.`,
        'faceMatch.learnMore': `Lær mere.`,
        'faceMatch.scanning': `Scanner • ansigtsgenkendelse…`,
        'faceMatch.faceAlt': `Ansigt {index}`,
        'faceMatch.minConf': `Min. konf.`,
        'faceMatch.minConfTitle': `Minimums-sikkerhed: {percent}%`,
        'faceMatch.detected': `Registreret`,
        'faceMatch.detectedFaceAlt': `Registreret ansigt`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Støt på Patreon`,
        'faceMatch.ofSelected': `{selected} af {total} valgt`,
        'faceMatch.allInScene': `{total} ansigter fundet · alle i scene`,
        'faceMatch.clickToSelect': `{total} ansigter fundet · klik for at vælge`,
        'faceMatch.kbSwitch': `Skift ansigter`,
        'faceMatch.kbSelect': `Vælg performere`,
        'faceMatch.kbToggle': `Skift markering`,
        'faceMatch.kbAddInstant': `Shift+klik for at tilføje med det samme`,
        'faceMatch.selectBest': `Vælg bedste matches`,
        'faceMatch.adding': `Tilføjer...`,
        'faceMatch.done': `Færdig ({count})`,
        'faceMatch.toast.added': `Tilføjede performer til {target}.`,
        'faceMatch.toast.addError': `Kunne ikke tilføje performer: {error}`,
        'faceMatch.toast.noStashbox': `Ingen stash-box konfigureret. Tilføj en stash-box-udbyder under Indstillinger → Metadata-udbydere for at aktivere performer-import. Se {url}`,
        'faceMatch.toast.noProvider': `Ingen udbyder kaldet "StashDB" fundet. Omdøb din udbyder til "StashDB" under Indstillinger → Metadata-udbydere for at aktivere performer-import.`,
        'faceMatch.toast.configureProvider': `Konfigurér en stash-box-udbyder under Indstillinger → Metadata-udbydere for at aktivere performer-import.`,
        'faceMatch.toast.addedMultiple': `Tilføjede {count} performere til {target}.`,
        'sprite.title': `SCENE-PERFORMERE`,
        'sprite.close': `Luk`,
        'sprite.foundConfirmed': `{found} fundet · {confirmed} bekræftet`,
        'sprite.confidence': `sikkerhed`,
        'sprite.name': `navn`,
        'sprite.hits': `hit`,
        'sprite.minConf': `Min. konf.`,
        'sprite.minConfTitle': `Minimums-sikkerhed: {percent}%`,
        'sprite.scanning': `Visage scanner…`,
        'sprite.cancel': `Annullér`,
        'sprite.empty': `Ingen performere identificeret i denne sprite.`,
        'sprite.detectedFaceAlt': `Registreret ansigt`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `I scene`,
        'sprite.hitsCount': `{count} hit`,
        'sprite.totalTime': `{time} i alt`,
        'sprite.alreadyInScene': `Allerede i scene`,
        'sprite.clickToConfirm': `Klik for at bekræfte`,
        'sprite.confirmed': `Bekræftet`,
        'sprite.supportPatreon': `Støt på Patreon`,
        'sprite.confirmedCount': `{confirmed} af {total} bekræftet`,
        'sprite.shownHint': `{shown} vist ({total} i alt) · klik for at bekræfte · ←→ navigér · Enter bekræft`,
        'sprite.confirmHint': `Klik for at bekræfte · ←→ navigér · Enter bekræft`,
        'sprite.adding': `Tilføjer...`,
        'sprite.done': `Færdig ({count})`,
        'gender.male': `Mand`,
        'gender.female': `Kvinde`,
        'gender.transMale': `Transkønnet mand`,
        'gender.transFemale': `Transkønnet kvinde`,
        'gender.nonBinary': `Ikke-binær`,
        'gender.intersex': `Intersex`,
        'card.excellent': `Fremragende match`,
        'card.good': `Godt match`,
        'card.uncertain': `Usikkert match`,
        'card.select': `Vælg {name}`,
        'card.deselect': `Fravælg {name}`,
        'card.openOn': `Åbn på {source}`,
        'search.overlayHint': `Træk for at vælge et ansigt — Enter for at scanne hele rammen — Esc for at annullere`,
        'search.noFaces': `Ingen ansigter fundet i dette udsnit. Prøv en tættere beskæring, eller tryk på Enter for at scanne hele rammen.`,
        'search.captureMediaFail': `Kunne ikke optage mediet. Sørg for, at scenen/billedet er fuldt indlæst.`,
        'search.healthBanner': `Ansigtsgenkendelses-API'en er ikke tilgængelig. Start backend og prøv igen.`,
        'search.failed': `Ansigtssøgning mislykkedes: {error}`,
        'search.fetchImageFail': `Kunne ikke hente billede fra Stash.`,
        'search.captureFail': `Kunne ikke optage billede: {error}`,
        'search.selectFaceImage': `Vælg et ansigt i billedet.`,
        'search.captureFrameFail': `Kunne ikke optage den aktuelle ramme.`,
        'search.captureFrameFail2': `Optagelse af den aktuelle ramme mislykkedes.`,
        'search.selectFaceVideo': `Vælg et ansigt inden for videoafspillerområdet.`,
        'search.menuItemTitle': `Træk en boks om et ansigt, eller tryk på Enter for at scanne hele rammen, for at søge StashDB efter matches`,
        'search.currentFrame': `Visage: Aktuelle ramme`,
        'scene.noSprite': `Ingen sprite-ark eller forhåndsvisningsvideo fundet for denne scene. Generér dem i Scene-indstillingerne, og prøv igen.`,
        'scene.noFaces': `Ingen ansigter eller performere fundet i denne scenes sprite-ark eller forhåndsvisningsvideo.`,
        'scene.healthBanner': `Ansigtsgenkendelses-API'en er ikke tilgængelig. Start backend og prøv igen.`,
        'scene.failed': `Scene-scanning mislykkedes: {error}`,
        'scene.menuItemTitle': `Identificér hver performer i scenen (kræver et genereret sprite-ark eller en forhåndsvisningsvideo)`,
        'scene.wholeScene': `Visage: Hele scenen`,
        'banner.changeBackend': `Skift backend`,
        'banner.dismiss': `Afvis`,
        'error.dismiss': `Afvis`,
        'firstRun.title': `Konfigurér din Visage-backend`,
        'firstRun.subtitle': `Visage sender ansigtsbilleder til en backend til genkendelse. Vælg, hvor den skal køre.`,
        'firstRun.cloud': `Brug Hugging Face cloud`,
        'firstRun.cloudNote': `Ingen opsætning. Billeder sendes til Hugging Face cloud-tjenesten.`,
        'firstRun.local': `Brug min egen server`,
        'firstRun.localNote': `Kør den private binær på din egen maskine eller dit netværk.`,
        'firstRun.skip': `Spring over for nu`,
        'badge.local': `Lokal`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Visage-backend: {label}`,
        'donate.enjoying': `Kan du lide Visage? Hjælp med at holde det i live`,
        'donate.supportPatreon': `Støt på Patreon`,
        'frame.close': `Luk ramme-vælgeren`,
        'frame.seekFail': `Kunne ikke søge i videoafspilleren.`,
        'frame.selectAt': `Vælg ansigtsramme ved {time}s`,
    };

    // Hungarian.
    const hu = {
        'backendSettings.title': `Backend beállítások`,
        'backendSettings.closeAria': `Beállítások bezárása`,
        'backendSettings.backendAria': `Backend beállítások`,
        'backendSettings.changeBackend': `Backend módosítása`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Helyi`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `A képeket a Hugging Face felhőszolgáltatásba küldjük.`,
        'backendSettings.hintPrefix': `Szeretnéd, hogy a képeid a hálózatodon maradjanak?`,
        'backendSettings.hintLink': `Privát szerver futtatása a Patreon segítségével`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': "A böngésző biztonsági szabályzata (CSP) alapértelmezés szerint csak a következőt engedélyezi:",
        'backendSettings.csp2': `Ha egy másik címen található helyi backendet szeretnél elérni (pl. a LAN-IP-d), add hozzá a`,
        'backendSettings.csp3': `listához a`,
        'backendSettings.csp4': `fájlban a Stash plugin-mappádban, különben a kérések blokkolva lesznek. Megjegyzés: a Visage frissítése újratelepíti a`,
        'backendSettings.csp5': `fájlt, ezért ezt minden frissítés után újra el kell végezni.`,
        'backendSettings.testing': `Kapcsolat tesztelése…`,
        'backendSettings.testConnection': `Kapcsolat tesztelése`,
        'backendSettings.testingShort': `Tesztelés…`,
        'backendSettings.cancel': `Mégse`,
        'backendSettings.save': `Mentés`,
        'backendSettings.feedback.reachable': `A kapcsolat sikeres. A backend készen áll.`,
        'backendSettings.feedback.degraded': `A backend elérhető, de korlátozott (a modellek vagy az index nincs betöltve).`,
        'backendSettings.feedback.unreachable': `A backend nem érhető el. Ellenőrizd az URL-t, és hogy a backend fut-e.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `AKTUÁLIS KERET`,
        'faceMatch.close': `Bezárás`,
        'faceMatch.facesSelected': `{faces} arc található · {selected} kiválasztva`,
        'faceMatch.inScene': `· {count} a jelenetben`,
        'faceMatch.stashboxMissing': `Nincs stash-box konfigurálva.`,
        'faceMatch.stashboxMissingBody': ` Az előadó-importálás engedélyezéséhez adj hozzá egy stash-box szolgáltatót a Beállítások → Metaadatszolgáltatók alatt.`,
        'faceMatch.stashboxWrongName': `Nem található "StashDB" szolgáltató.`,
        'faceMatch.stashboxWrongNameBody': ` Az előadó-importáláshoz "StashDB" nevű szolgáltató szükséges. Nevezd át a szolgáltatót a Beállítások → Metaadatszolgáltatók alatt.`,
        'faceMatch.learnMore': `További információk.`,
        'faceMatch.scanning': `Vizsgálat • arcfelismerés…`,
        'faceMatch.faceAlt': `{index}. arc`,
        'faceMatch.minConf': `Min. konf.`,
        'faceMatch.minConfTitle': `Minimális megbízhatóság: {percent}%`,
        'faceMatch.detected': `Észlelve`,
        'faceMatch.detectedFaceAlt': `Észlelt arc`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Támogatás a Patreonon`,
        'faceMatch.ofSelected': `{total} közül {selected} kiválasztva`,
        'faceMatch.allInScene': `{total} arc található · mind a jelenetben`,
        'faceMatch.clickToSelect': `{total} arc található · kattints a kiválasztáshoz`,
        'faceMatch.kbSwitch': `Arcváltás`,
        'faceMatch.kbSelect': `Előadók kiválasztása`,
        'faceMatch.kbToggle': `Kijelölés váltása`,
        'faceMatch.kbAddInstant': `Shift+kattintás az azonnali hozzáadáshoz`,
        'faceMatch.selectBest': `Legjobb egyezések kiválasztása`,
        'faceMatch.adding': `Hozzáadás...`,
        'faceMatch.done': `Kész ({count})`,
        'faceMatch.toast.added': `Előadó hozzáadva ehhez: {target}.`,
        'faceMatch.toast.addError': `Az előadó hozzáadása sikertelen: {error}`,
        'faceMatch.toast.noStashbox': `Nincs stash-box konfigurálva. Az előadó-importálás engedélyezéséhez adj hozzá egy stash-box szolgáltatót a Beállítások → Metaadatszolgáltatók alatt. Lásd: {url}`,
        'faceMatch.toast.noProvider': `Nem található "StashDB" nevű szolgáltató. Az előadó-importálás engedélyezéséhez nevezd át a szolgáltatót "StashDB"-re a Beállítások → Metaadatszolgáltatók alatt.`,
        'faceMatch.toast.configureProvider': `Az előadó-importálás engedélyezéséhez konfigurálj egy stash-box szolgáltatót a Beállítások → Metaadatszolgáltatók alatt.`,
        'faceMatch.toast.addedMultiple': `{count} előadó hozzáadva ehhez: {target}.`,
        'sprite.title': `JELENET ELŐADÓI`,
        'sprite.close': `Bezárás`,
        'sprite.foundConfirmed': `{found} található · {confirmed} megerősítve`,
        'sprite.confidence': `megbízhatóság`,
        'sprite.name': `név`,
        'sprite.hits': `találat`,
        'sprite.minConf': `Min. konf.`,
        'sprite.minConfTitle': `Minimális megbízhatóság: {percent}%`,
        'sprite.scanning': `Visage vizsgál…`,
        'sprite.cancel': `Mégse`,
        'sprite.empty': `Ebben a sprite-ban nem azonosítható előadó.`,
        'sprite.detectedFaceAlt': `Észlelt arc`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `A jelenetben`,
        'sprite.hitsCount': `{count} találat`,
        'sprite.totalTime': `{time} összesen`,
        'sprite.alreadyInScene': `Már a jelenetben van`,
        'sprite.clickToConfirm': `Kattints a megerősítéshez`,
        'sprite.confirmed': `Megerősítve`,
        'sprite.supportPatreon': `Támogatás a Patreonon`,
        'sprite.confirmedCount': `{total} közül {confirmed} megerősítve`,
        'sprite.shownHint': `{shown} megjelenítve ({total} összesen) · kattints a megerősítéshez · ←→ navigálás · Enter megerősít`,
        'sprite.confirmHint': `Kattints a megerősítéshez · ←→ navigálás · Enter megerősít`,
        'sprite.adding': `Hozzáadás...`,
        'sprite.done': `Kész ({count})`,
        'gender.male': `Férfi`,
        'gender.female': `Nő`,
        'gender.transMale': `Transznemű férfi`,
        'gender.transFemale': `Transznemű nő`,
        'gender.nonBinary': `Nem-bináris`,
        'gender.intersex': `Interszex`,
        'card.excellent': `Kiváló egyezés`,
        'card.good': `Jó egyezés`,
        'card.uncertain': `Bizonytalan egyezés`,
        'card.select': `{name} kiválasztása`,
        'card.deselect': `{name} kijelölésének törlése`,
        'card.openOn': `Megnyitás ezen: {source}`,
        'search.overlayHint': `Húzd az arc kijelöléséhez — Enter az egész keret vizsgálatához — Esc a megszakításhoz`,
        'search.noFaces': `Ebben a kijelölésben nincs arc. Próbálj szorosabb vágást, vagy nyomj Entert az egész keret vizsgálatához.`,
        'search.captureMediaFail': `A média rögzítése nem sikerült. Győződj meg róla, hogy a jelenet/kép teljesen betöltött.`,
        'search.healthBanner': `Az arcfelismerő API nem érhető el. Indítsd el a backendet, és próbáld újra.`,
        'search.failed': `Arckeresés sikertelen: {error}`,
        'search.fetchImageFail': `A kép lekérése a Stashból nem sikerült.`,
        'search.captureFail': `A kép rögzítése nem sikerült: {error}`,
        'search.selectFaceImage': `Válassz egy arcot a képen.`,
        'search.captureFrameFail': `Az aktuális keret rögzítése nem sikerült.`,
        'search.captureFrameFail2': `Az aktuális keret rögzítése nem sikerült.`,
        'search.selectFaceVideo': `Válassz egy arcot a videolejátszó területén belül.`,
        'search.menuItemTitle': `Húzz egy keretet egy arc köré, vagy nyomj Entert az egész keret vizsgálatához, hogy egyezéseket keress a StashDB-ben`,
        'search.currentFrame': `Visage: Aktuális keret`,
        'scene.noSprite': `Ehhez a jelenethez nem található sprite-lap vagy előnézeti videó. Hozd létre őket a Scene beállításokban, majd próbáld újra.`,
        'scene.noFaces': `A jelenet sprite-lapjában vagy előnézeti videójában nem található arc vagy előadó.`,
        'scene.healthBanner': `Az arcfelismerő API nem érhető el. Indítsd el a backendet, és próbáld újra.`,
        'scene.failed': `Jelenetvizsgálat sikertelen: {error}`,
        'scene.menuItemTitle': `Azonosítsd a jelenet minden előadóját (létrehozott sprite-lap vagy előnézeti videó szükséges)`,
        'scene.wholeScene': `Visage: Teljes jelenet`,
        'banner.changeBackend': `Backend módosítása`,
        'banner.dismiss': `Elutasítás`,
        'error.dismiss': `Elutasítás`,
        'firstRun.title': `A Visage backend beállítása`,
        'firstRun.subtitle': `A Visage arc-képeket küld egy backendnek felismerés céljából. Válaszd ki, hol futtatod.`,
        'firstRun.cloud': `Hugging Face cloud használata`,
        'firstRun.cloudNote': `Nincs beállítás szükséges. A képeket a Hugging Face felhőszolgáltatásba küldjük.`,
        'firstRun.local': `A saját szerverem használata`,
        'firstRun.localNote': `Futtasd a privát binárist a saját gépeden vagy hálózatodon.`,
        'firstRun.skip': `Kihagyás most`,
        'badge.local': `Helyi`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Visage backend: {label}`,
        'donate.enjoying': `Tetszik a Visage? Segíts életben tartani`,
        'donate.supportPatreon': `Támogatás a Patreonon`,
        'frame.close': `Keretválasztó bezárása`,
        'frame.seekFail': `A videolejátszóban való keresés nem sikerült.`,
        'frame.selectAt': `Arckeret kiválasztása itt: {time}s`,
    };

    const uk = {
        'backendSettings.title': `Налаштування бекенду`,
        'backendSettings.closeAria': `Закрити налаштування`,
        'backendSettings.backendAria': `Налаштування бекенду`,
        'backendSettings.changeBackend': `Змінити бекенд`,
        'backendSettings.backendLabel': `Бекенд`,
        'backendSettings.local': `Локальний`,
        'backendSettings.cloud': `Хмара (Hugging Face)`,
        'backendSettings.cloudNote': `Зображення надсилаються до хмарного сервісу Hugging Face.`,
        'backendSettings.hintPrefix': `Хочете, щоб зображення залишалися у вашій мережі?`,
        'backendSettings.hintLink': `Запустіть приватний сервер через Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `Політика безпеки браузера (CSP) за замовчуванням дозволяє лише`,
        'backendSettings.csp2': `. Щоб отримати доступ до локального бекенду за іншою адресою (наприклад, IP вашої локальної мережі), додайте його до`,
        'backendSettings.csp3': `списку у`,
        'backendSettings.csp4': `файлі у папці плагінів Stash, інакше запити будуть заблоковані. Примітка: оновлення Visage перевстановлює`,
        'backendSettings.csp5': `, тому це потрібно повторювати після кожного оновлення.`,
        'backendSettings.testing': `Перевірка підключення…`,
        'backendSettings.testConnection': `Перевірити підключення`,
        'backendSettings.testingShort': `Перевірка…`,
        'backendSettings.cancel': `Скасувати`,
        'backendSettings.save': `Зберегти`,
        'backendSettings.feedback.reachable': `Підключення успішне. Бекенд готовий.`,
        'backendSettings.feedback.degraded': `Бекенд доступний, але працює з обмеженнями (моделі або індекс не завантажені).`,
        'backendSettings.feedback.unreachable': `Бекенд недоступний. Перевірте URL і переконайтеся, що бекенд запущено.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `ПОТОЧНИЙ КАДР`,
        'faceMatch.close': `Закрити`,
        'faceMatch.facesSelected': `Знайдено облич: {faces} · вибрано: {selected}`,
        'faceMatch.inScene': `· {count} у сцені`,
        'faceMatch.stashboxMissing': `Stash-box не налаштовано.`,
        'faceMatch.stashboxMissingBody': ` Додайте провайдера stash-box у Settings → Metadata Providers, щоб увімкнути імпорт виконавців.`,
        'faceMatch.stashboxWrongName': `Провайдера "StashDB" не знайдено.`,
        'faceMatch.stashboxWrongNameBody': ` Імпорт виконавців потребує провайдера з назвою "StashDB". Перейменуйте провайдера у Settings → Metadata Providers.`,
        'faceMatch.learnMore': `Дізнатися більше.`,
        'faceMatch.scanning': `Сканування • розпізнавання облич…`,
        'faceMatch.faceAlt': `Обличчя {index}`,
        'faceMatch.minConf': `Мін. дост.`,
        'faceMatch.minConfTitle': `Мінімальна достовірність: {percent}%`,
        'faceMatch.detected': `Виявлено`,
        'faceMatch.detectedFaceAlt': `Виявлене обличчя`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Підтримати на Patreon`,
        'faceMatch.ofSelected': `Вибрано {selected} з {total}`,
        'faceMatch.allInScene': `Знайдено облич: {total} · усі у сцені`,
        'faceMatch.clickToSelect': `Знайдено облич: {total} · натисніть, щоб вибрати`,
        'faceMatch.kbSwitch': `Перемикання облич`,
        'faceMatch.kbSelect': `Вибір виконавців`,
        'faceMatch.kbToggle': `Перемкнути вибір`,
        'faceMatch.kbAddInstant': `Shift+клік, щоб додати одразу`,
        'faceMatch.selectBest': `Вибрати найкращі збіги`,
        'faceMatch.adding': `Додавання...`,
        'faceMatch.done': `Готово ({count})`,
        'faceMatch.toast.added': `Виконавця додано до {target}.`,
        'faceMatch.toast.addError': `Не вдалося додати виконавця: {error}`,
        'faceMatch.toast.noStashbox': `Stash-box не налаштовано. Додайте провайдера stash-box у Settings → Metadata Providers, щоб увімкнути імпорт виконавців. Див. {url}`,
        'faceMatch.toast.noProvider': `Провайдера "StashDB" не знайдено. Перейменуйте провайдера на "StashDB" у Settings → Metadata Providers, щоб увімкнути імпорт виконавців.`,
        'faceMatch.toast.configureProvider': `Налаштуйте провайдера stash-box у Settings → Metadata Providers, щоб увімкнути імпорт виконавців.`,
        'faceMatch.toast.addedMultiple': `Додано виконавців: {count} у {target}.`,
        'sprite.title': `ВИКОНАВЦІ СЦЕНИ`,
        'sprite.close': `Закрити`,
        'sprite.foundConfirmed': `Знайдено: {found} · підтверджено: {confirmed}`,
        'sprite.confidence': `достовірність`,
        'sprite.name': `ім'я`,
        'sprite.hits': `збіги`,
        'sprite.minConf': `Мін. дост.`,
        'sprite.minConfTitle': `Мінімальна достовірність: {percent}%`,
        'sprite.scanning': `Сканування Visage…`,
        'sprite.cancel': `Скасувати`,
        'sprite.empty': `У цьому спрайті виконавців не виявлено.`,
        'sprite.detectedFaceAlt': `Виявлене обличчя`,
        'sprite.spriteLabel': `СПРАЙТ`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `У сцені`,
        'sprite.hitsCount': `Збігів: {count}`,
        'sprite.totalTime': `Усього {time}`,
        'sprite.alreadyInScene': `Уже у сцені`,
        'sprite.clickToConfirm': `Натисніть для підтвердження`,
        'sprite.confirmed': `Підтверджено`,
        'sprite.supportPatreon': `Підтримати на Patreon`,
        'sprite.confirmedCount': `Підтверджено {confirmed} з {total}`,
        'sprite.shownHint': `Показано: {shown} (усього {total}) · натисніть для підтвердження · ←→ навігація · Enter підтвердження`,
        'sprite.confirmHint': `Натисніть для підтвердження · ←→ навігація · Enter підтвердження`,
        'sprite.adding': `Додавання...`,
        'sprite.done': `Готово ({count})`,
        'gender.male': `Чоловік`,
        'gender.female': `Жінка`,
        'gender.transMale': `Трансгендерний чоловік`,
        'gender.transFemale': `Трансгендерна жінка`,
        'gender.nonBinary': `Небінарний`,
        'gender.intersex': `Інтерсекс`,
        'card.excellent': `Відмінний збіг`,
        'card.good': `Хороший збіг`,
        'card.uncertain': `Невпевнений збіг`,
        'card.select': `Вибрати {name}`,
        'card.deselect': `Зняти вибір з {name}`,
        'card.openOn': `Відкрити на {source}`,
        'search.overlayHint': `Перетягніть, щоб виділити обличчя — Enter, щоб просканувати весь кадр — Esc, щоб скасувати`,
        'search.noFaces': `У вибраній області облич не знайдено. Спробуйте щільніший кадр або натисніть Enter, щоб просканувати весь кадр.`,
        'search.captureMediaFail': `Не вдалося захопити медіа. Переконайтеся, що сцена/зображення повністю завантажені.`,
        'search.healthBanner': `API розпізнавання облич недоступний. Запустіть бекенд і спробуйте знову.`,
        'search.failed': `Пошук облич не вдався: {error}`,
        'search.fetchImageFail': `Не вдалося отримати зображення з Stash.`,
        'search.captureFail': `Не вдалося захопити зображення: {error}`,
        'search.selectFaceImage': `Виділіть обличчя в зображенні.`,
        'search.captureFrameFail': `Не вдалося захопити поточний кадр.`,
        'search.captureFrameFail2': `Помилка під час захоплення поточного кадру.`,
        'search.selectFaceVideo': `Виділіть обличчя в області відеоплеєра.`,
        'search.menuItemTitle': `Перетягніть рамку навколо обличчя або натисніть Enter, щоб просканувати весь кадр і виконати пошук збігів у StashDB`,
        'search.currentFrame': `Visage: поточний кадр`,
        'scene.noSprite': `Для цієї сцени не знайдено ані спрайт-листа, ані прев'ю-відео. Створіть їх у налаштуваннях сцени та спробуйте знову.`,
        'scene.noFaces': `У спрайт-листі або прев'ю-відео цієї сцени не знайдено облич або виконавців.`,
        'scene.healthBanner': `API розпізнавання облич недоступний. Запустіть бекенд і спробуйте знову.`,
        'scene.failed': `Сканування сцени не вдалося: {error}`,
        'scene.menuItemTitle': `Визначте кожного виконавця у сцені (потрібен згенерований спрайт-лист або прев'ю-відео)`,
        'scene.wholeScene': `Visage: вся сцена`,
        'banner.changeBackend': `Змінити бекенд`,
        'banner.dismiss': `Відхилити`,
        'error.dismiss': `Відхилити`,
        'firstRun.title': `Налаштуйте бекенд Visage`,
        'firstRun.subtitle': `Visage надсилає зображення облич до бекенду для розпізнавання. Виберіть, де його запустити.`,
        'firstRun.cloud': `Використовувати хмару Hugging Face`,
        'firstRun.cloudNote': `Без налаштування. Зображення надсилаються до хмарного сервісу Hugging Face.`,
        'firstRun.local': `Використовувати свій сервер`,
        'firstRun.localNote': `Запустіть приватний бінарник на власній машині або у власній мережі.`,
        'firstRun.skip': `Пропустити`,
        'badge.local': `Локальний`,
        'badge.cloud': `Хмара (Hugging Face)`,
        'badge.title': `Бекенд Visage: {label}`,
        'donate.enjoying': `Подобається Visage? Допоможіть зберегти його`,
        'donate.supportPatreon': `Підтримати на Patreon`,
        'frame.close': `Закрити вибір кадру`,
        'frame.seekFail': `Не вдалося перемотати відеоплеєр.`,
        'frame.selectAt': `Вибрати кадр обличчя на {time} с`,
    };

    // German. Missing keys fall back to English automatically.
    const de = {
        // ---- BackendSettings.tsx ----
        'backendSettings.title': `Backend-Einstellungen`,
        'backendSettings.closeAria': `Einstellungen schließen`,
        'backendSettings.backendAria': `Backend-Einstellungen`,
        'backendSettings.changeBackend': `Backend ändern`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Lokal`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Bilder werden an den Hugging Face Cloud-Dienst gesendet.`,
        'backendSettings.hintPrefix': `Möchtest du, dass deine Bilder in deinem Netzwerk bleiben?`,
        'backendSettings.hintLink': `Einen privaten Server über Patreon betreiben`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `Die Sicherheitsrichtlinie (CSP) des Browsers erlaubt nur`,
        'backendSettings.csp2': `standardmäßig. Um ein lokales Backend unter einer anderen Adresse (z. B. deiner LAN-IP) zu erreichen, füge es zur`,
        'backendSettings.csp3': `Liste in der`,
        'backendSettings.csp4': `Datei in deinem Stash-Plugins-Ordner hinzu, sonst werden Anfragen blockiert. Hinweis: Ein Update von Visage installiert`,
        'backendSettings.csp5': `neu, daher muss dies nach jedem Update erneut angewendet werden.`,
        'backendSettings.testing': `Verbindung wird getestet…`,
        'backendSettings.testConnection': `Verbindung testen`,
        'backendSettings.testingShort': `Testen…`,
        'backendSettings.cancel': `Abbrechen`,
        'backendSettings.save': `Speichern`,
        'backendSettings.feedback.reachable': `Verbindung erfolgreich. Das Backend ist bereit.`,
        'backendSettings.feedback.degraded': `Backend erreichbar, aber eingeschränkt (Modelle oder Index nicht geladen).`,
        'backendSettings.feedback.unreachable': `Backend nicht erreichbar. Prüfe die URL und ob das Backend läuft.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        // ---- FaceMatchModal.tsx ----
        'faceMatch.title': `AKTUELLES BILD`,
        'faceMatch.close': `Schließen`,
        'faceMatch.facesSelected': `{faces} Gesichter gefunden · {selected} ausgewählt`,
        'faceMatch.inScene': `· {count} in der Szene`,
        'faceMatch.stashboxMissing': `Kein Stash-box konfiguriert.`,
        'faceMatch.stashboxMissingBody': ` Füge in Einstellungen → Metadaten-Anbieter einen Stash-box-Anbieter hinzu, um den Performer-Import zu aktivieren.`,
        'faceMatch.stashboxWrongName': `Kein Anbieter namens "StashDB" gefunden.`,
        'faceMatch.stashboxWrongNameBody': ` Der Performer-Import erfordert einen Anbieter namens "StashDB". Benenne deinen Anbieter in Einstellungen → Metadaten-Anbieter um.`,
        'faceMatch.learnMore': `Mehr erfahren.`,
        'faceMatch.scanning': `Scannen • Gesichtserkennung…`,
        'faceMatch.faceAlt': `Gesicht {index}`,
        'faceMatch.minConf': `Min. Konf.`,
        'faceMatch.minConfTitle': `Minimale Konfidenz: {percent}%`,
        'faceMatch.detected': `Erkannt`,
        'faceMatch.detectedFaceAlt': `Erkanntes Gesicht`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Auf Patreon unterstützen`,
        'faceMatch.ofSelected': `{selected} von {total} ausgewählt`,
        'faceMatch.allInScene': `{total} Gesichter gefunden · alle in der Szene`,
        'faceMatch.clickToSelect': `{total} Gesichter gefunden · zum Auswählen klicken`,
        'faceMatch.kbSwitch': `Gesichter wechseln`,
        'faceMatch.kbSelect': `Performer auswählen`,
        'faceMatch.kbToggle': `Auswahl umschalten`,
        'faceMatch.kbAddInstant': `Umschalt+Klick zum sofortigen Hinzufügen`,
        'faceMatch.selectBest': `Beste Treffer auswählen`,
        'faceMatch.adding': `Hinzufügen...`,
        'faceMatch.done': `Fertig ({count})`,
        'faceMatch.toast.added': `Performer zum {target} hinzugefügt.`,
        'faceMatch.toast.addError': `Performer konnte nicht hinzugefügt werden: {error}`,
        'faceMatch.toast.noStashbox': `Kein Stash-box konfiguriert. Füge in Einstellungen → Metadaten-Anbieter einen Stash-box-Anbieter hinzu, um den Performer-Import zu aktivieren. Siehe {url}`,
        'faceMatch.toast.noProvider': `Kein Anbieter namens "StashDB" gefunden. Benenne deinen Anbieter in Einstellungen → Metadaten-Anbieter in "StashDB" um, um den Performer-Import zu aktivieren.`,
        'faceMatch.toast.configureProvider': `Konfiguriere in Einstellungen → Metadaten-Anbieter einen Stash-box-Anbieter, um den Performer-Import zu aktivieren.`,
        'faceMatch.toast.addedMultiple': `{count} Performer{s} zum {target} hinzugefügt.`,
        // ---- SpriteResultModal.tsx ----
        'sprite.title': `SZENEN-PERFORMER`,
        'sprite.close': `Schließen`,
        'sprite.foundConfirmed': `{found} gefunden · {confirmed} bestätigt`,
        'sprite.confidence': `Konfidenz`,
        'sprite.name': `Name`,
        'sprite.hits': `Treffer`,
        'sprite.minConf': `Min. Konf.`,
        'sprite.minConfTitle': `Minimale Konfidenz: {percent}%`,
        'sprite.scanning': `Visage wird gescannt…`,
        'sprite.cancel': `Abbrechen`,
        'sprite.empty': `In diesem Sprite wurden keine Performer identifiziert.`,
        'sprite.detectedFaceAlt': `Erkanntes Gesicht`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `In der Szene`,
        'sprite.hitsCount': `{count} Treffer{s}`,
        'sprite.totalTime': `{time} gesamt`,
        'sprite.alreadyInScene': `Bereits in der Szene`,
        'sprite.clickToConfirm': `Zum Bestätigen klicken`,
        'sprite.confirmed': `Bestätigt`,
        'sprite.supportPatreon': `Auf Patreon unterstützen`,
        'sprite.confirmedCount': `{confirmed} von {total} bestätigt`,
        'sprite.shownHint': `{shown} angezeigt ({total} gesamt) · zum Bestätigen klicken · ←→ navigieren · Enter bestätigen`,
        'sprite.confirmHint': `Zum Bestätigen klicken · ←→ navigieren · Enter bestätigen`,
        'sprite.adding': `Hinzufügen...`,
        'sprite.done': `Fertig ({count})`,
        // ---- PerformerCard.tsx ----
        'gender.male': `Männlich`,
        'gender.female': `Weiblich`,
        'gender.transMale': `Transgender-Mann`,
        'gender.transFemale': `Transgender-Frau`,
        'gender.nonBinary': `Nicht-binär`,
        'gender.intersex': `Intergeschlechtlich`,
        'card.excellent': `Hervorragende Übereinstimmung`,
        'card.good': `Gute Übereinstimmung`,
        'card.uncertain': `Unsichere Übereinstimmung`,
        'card.select': `{name} auswählen`,
        'card.deselect': `{name} abwählen`,
        'card.openOn': `Auf {source} öffnen`,
        // ---- FaceSearchButton.tsx ----
        'search.overlayHint': `Ziehen, um ein Gesicht auszuwählen — Enter, um das ganze Bild zu scannen — Esc zum Abbrechen`,
        'search.noFaces': `In dieser Auswahl wurden keine Gesichter gefunden. Versuche einen engeren Zuschnitt oder drücke Enter, um das ganze Bild zu scannen.`,
        'search.captureMediaFail': `Medien konnten nicht erfasst werden. Stelle sicher, dass Szene/Bild vollständig geladen ist.`,
        'search.healthBanner': `Die Gesichtserkennungs-API ist nicht erreichbar. Starte das Backend und versuche es erneut.`,
        'search.failed': `Gesichtssuche fehlgeschlagen: {error}`,
        'search.fetchImageFail': `Bild konnte nicht von Stash abgerufen werden.`,
        'search.captureFail': `Bildaufnahme fehlgeschlagen: {error}`,
        'search.selectFaceImage': `Wähle ein Gesicht im Bild aus.`,
        'search.captureFrameFail': `Aktuelles Bild konnte nicht erfasst werden.`,
        'search.captureFrameFail2': `Aktuelles Bild konnte nicht erfasst werden.`,
        'search.selectFaceVideo': `Wähle ein Gesicht im Videoplayer-Bereich aus.`,
        'search.menuItemTitle': `Ziehe ein Feld um ein Gesicht oder drücke Enter, um das ganze Bild zu scannen, um in StashDB nach Übereinstimmungen zu suchen`,
        'search.currentFrame': `Visage: Aktuelles Bild`,
        // ---- SceneScanButton.tsx ----
        'scene.noSprite': `Für diese Szene wurde kein Sprite-Sheet oder Vorschaubild gefunden. Erzeuge sie in den Szene-Einstellungen und versuche es erneut.`,
        'scene.noFaces': `Im Sprite-Sheet oder Vorschaubild dieser Szene wurden keine Gesichter oder Performer gefunden.`,
        'scene.healthBanner': `Die Gesichtserkennungs-API ist nicht erreichbar. Starte das Backend und versuche es erneut.`,
        'scene.failed': `Szenen-Scan fehlgeschlagen: {error}`,
        'scene.menuItemTitle': `Jeden Performer in der Szene identifizieren (benötigt ein erzeugtes Sprite-Sheet oder Vorschaubild)`,
        'scene.wholeScene': `Visage: Gesamte Szene`,
        // ---- BackendHealthBanner.tsx ----
        'banner.changeBackend': `Backend ändern`,
        'banner.dismiss': `Ausblenden`,
        // ---- ErrorDialog.tsx ----
        'error.dismiss': `Ausblenden`,
        // ---- FirstRunDialog.tsx ----
        'firstRun.title': `Richte dein Visage-Backend ein`,
        'firstRun.subtitle': `Visage sendet Gesichtsbilder zur Erkennung an ein Backend. Wähle, wo es ausgeführt werden soll.`,
        'firstRun.cloud': `Hugging Face Cloud verwenden`,
        'firstRun.cloudNote': `Keine Einrichtung nötig. Bilder werden an den Hugging Face Cloud-Dienst gesendet.`,
        'firstRun.local': `Eigene Server verwenden`,
        'firstRun.localNote': `Führe das private Programm auf deinem eigenen Rechner oder Netzwerk aus.`,
        'firstRun.skip': `Vorerst überspringen`,
        // ---- BackendBadge.tsx ----
        'badge.local': `Lokal`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Visage-Backend: {label}`,
        // ---- DonateFooter.tsx ----
        'donate.enjoying': `Gefällt dir Visage? Hilf mit, es am Leben zu halten`,
        'donate.supportPatreon': `Auf Patreon unterstützen`,
        // ---- FaceFrameSelector.tsx ----
        'frame.close': `Bildauswahl schließen`,
        'frame.seekFail': `Der Videoplayer konnte nicht gesucht werden.`,
        'frame.selectAt': `Gesichtsbild bei {time}s auswählen`,
    };

    // Finnish.
    const fi = {
        'backendSettings.title': `Backend-asetukset`,
        'backendSettings.closeAria': `Sulje asetukset`,
        'backendSettings.backendAria': `Backend-asetukset`,
        'backendSettings.changeBackend': `Vaihda backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Paikallinen`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Kuvat lähetetään Hugging Face -pilvipalveluun.`,
        'backendSettings.hintPrefix': `Haluatko, että kuvasi pysyvät verkossasi?`,
        'backendSettings.hintLink': `Aja yksityinen palvelin Patreonin kautta`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': "Selaimen suojauskäytäntö (CSP) sallii oletuksena vain",
        'backendSettings.csp2': `Jos haluat käyttää paikallista backendia toisessa osoitteessa (esim. LAN-IP-osoitteessasi), lisää se`,
        'backendSettings.csp3': `luetteloon`,
        'backendSettings.csp4': `-tiedostossa Stash-liitännäiskansiossasi, muuten pyynnöt estetään. Huomio: Visagen päivitys asentaa`,
        'backendSettings.csp5': `:n uudelleen, joten tämä on tehtävä uudelleen jokaisen päivityksen jälkeen.`,
        'backendSettings.testing': `Testataan yhteyttä…`,
        'backendSettings.testConnection': `Testaa yhteys`,
        'backendSettings.testingShort': `Testataan…`,
        'backendSettings.cancel': `Peruuta`,
        'backendSettings.save': `Tallenna`,
        'backendSettings.feedback.reachable': `Yhteys onnistui. Backend on valmis.`,
        'backendSettings.feedback.degraded': `Backend on tavoitettavissa mutta heikentynyt (mallit tai indeksi ei ole ladattu).`,
        'backendSettings.feedback.unreachable': `Backend ei ole tavoitettavissa. Tarkista URL ja että backend on käynnissä.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `NYKYINEN RUUTU`,
        'faceMatch.close': `Sulje`,
        'faceMatch.facesSelected': `{faces} kasvoa löydetty · {selected} valittu`,
        'faceMatch.inScene': `· {count} kohtauksessa`,
        'faceMatch.stashboxMissing': `Stash-boxia ei ole määritetty.`,
        'faceMatch.stashboxMissingBody': ` Lisää stash-box-palveluntarjoaja kohdassa Asetukset → Metadatan tarjoajat aktivoidaksesi esiintyjien tuonnin.`,
        'faceMatch.stashboxWrongName': `Palveluntarjoajaa "StashDB" ei löytynyt.`,
        'faceMatch.stashboxWrongNameBody': ` Esiintyjien tuonti edellyttää palveluntarjoajaa nimeltä "StashDB". Nimeä palveluntarjoaja uudelleen kohdassa Asetukset → Metadatan tarjoajat.`,
        'faceMatch.learnMore': `Lue lisää.`,
        'faceMatch.scanning': `Skannataan • kasvojentunnistus…`,
        'faceMatch.faceAlt': `Kasvot {index}`,
        'faceMatch.minConf': `Min. luot.`,
        'faceMatch.minConfTitle': `Minimiluottamus: {percent}%`,
        'faceMatch.detected': `Havaittu`,
        'faceMatch.detectedFaceAlt': `Havaittu kasvot`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Tue Patreonissa`,
        'faceMatch.ofSelected': `{selected} / {total} valittu`,
        'faceMatch.allInScene': `{total} kasvoa löydetty · kaikki kohtauksessa`,
        'faceMatch.clickToSelect': `{total} kasvoa löydetty · valitse napsauttamalla`,
        'faceMatch.kbSwitch': `Vaihda kasvoja`,
        'faceMatch.kbSelect': `Valitse esiintyjät`,
        'faceMatch.kbToggle': `Vaihda valintaa`,
        'faceMatch.kbAddInstant': `Shift+klikkaus lisää välittömästi`,
        'faceMatch.selectBest': `Valitse parhaat osumat`,
        'faceMatch.adding': `Lisätään...`,
        'faceMatch.done': `Valmis ({count})`,
        'faceMatch.toast.added': `Esiintyjä lisätty kohteeseen {target}.`,
        'faceMatch.toast.addError': `Esiintyjän lisääminen epäonnistui: {error}`,
        'faceMatch.toast.noStashbox': `Stash-boxia ei ole määritetty. Lisää stash-box-palveluntarjoaja kohdassa Asetukset → Metadatan tarjoajat aktivoidaksesi esiintyjien tuonnin. Katso {url}`,
        'faceMatch.toast.noProvider': `Palveluntarjoajaa nimeltä "StashDB" ei löytynyt. Nimeä palveluntarjoaja uudelleen "StashDB":ksi kohdassa Asetukset → Metadatan tarjoajat aktivoidaksesi esiintyjien tuonnin.`,
        'faceMatch.toast.configureProvider': `Määritä stash-box-palveluntarjoaja kohdassa Asetukset → Metadatan tarjoajat aktivoidaksesi esiintyjien tuonnin.`,
        'faceMatch.toast.addedMultiple': `Lisätty {count} esiintyjää kohteeseen {target}.`,
        'sprite.title': `KOHTAUKSEN ESIINTYJÄT`,
        'sprite.close': `Sulje`,
        'sprite.foundConfirmed': `{found} löydetty · {confirmed} vahvistettu`,
        'sprite.confidence': `luottamus`,
        'sprite.name': `nimi`,
        'sprite.hits': `osumat`,
        'sprite.minConf': `Min. luot.`,
        'sprite.minConfTitle': `Minimiluottamus: {percent}%`,
        'sprite.scanning': `Visage skannaa…`,
        'sprite.cancel': `Peruuta`,
        'sprite.empty': `Tästä spritestä ei tunnistettu esiintyjiä.`,
        'sprite.detectedFaceAlt': `Havaittu kasvot`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `Kohtauksessa`,
        'sprite.hitsCount': `{count} osuma`,
        'sprite.totalTime': `{time} yhteensä`,
        'sprite.alreadyInScene': `Jo kohtauksessa`,
        'sprite.clickToConfirm': `Vahvista napsauttamalla`,
        'sprite.confirmed': `Vahvistettu`,
        'sprite.supportPatreon': `Tue Patreonissa`,
        'sprite.confirmedCount': `{confirmed} / {total} vahvistettu`,
        'sprite.shownHint': `{shown} näytetty ({total} yhteensä) · vahvista napsauttamalla · ←→ navigoi · Enter vahvista`,
        'sprite.confirmHint': `Vahvista napsauttamalla · ←→ navigoi · Enter vahvista`,
        'sprite.adding': `Lisätään...`,
        'sprite.done': `Valmis ({count})`,
        'gender.male': `Mies`,
        'gender.female': `Nainen`,
        'gender.transMale': `Transmies`,
        'gender.transFemale': `Transnainen`,
        'gender.nonBinary': `Muunsukupuolinen`,
        'gender.intersex': `Intersukupuolinen`,
        'card.excellent': `Erinomainen osuma`,
        'card.good': `Hyvä osuma`,
        'card.uncertain': `Epävarma osuma`,
        'card.select': `Valitse {name}`,
        'card.deselect': `Poista valinta {name}`,
        'card.openOn': `Avaa kohteessa {source}`,
        'search.overlayHint': `Valitse kasvot vetämällä — Enter skannaa koko ruudun — Esc peruuttaa`,
        'search.noFaces': `Valinnasta ei löytynyt kasvoja. Kokeile tarkempaa rajausta tai paina Enter skannataksesi koko ruudun.`,
        'search.captureMediaFail': `Median tallentaminen epäonnistui. Varmista, että kohtaus/kuva on täysin ladattu.`,
        'search.healthBanner': `Kasvojentunnistuksen API ei ole tavoitettavissa. Käynnistä backend ja yritä uudelleen.`,
        'search.failed': `Kasvohaku epäonnistui: {error}`,
        'search.fetchImageFail': `Kuvan noutaminen Stashista epäonnistui.`,
        'search.captureFail': `Kuvan tallentaminen epäonnistui: {error}`,
        'search.selectFaceImage': `Valitse kasvot kuvasta.`,
        'search.captureFrameFail': `Nykyisen ruudun tallentaminen epäonnistui.`,
        'search.captureFrameFail2': `Nykyisen ruudun tallentaminen ei onnistunut.`,
        'search.selectFaceVideo': `Valitse kasvot videotoistimen alueelta.`,
        'search.menuItemTitle': `Vedä laatikko kasvojen ympärille tai paina Enter skannataksesi koko ruudun hakeaksesi osumia StashDB:stä`,
        'search.currentFrame': `Visage: Nykyinen ruutu`,
        'scene.noSprite': `Tälle kohtaukselle ei löytynyt sprite-arkkia tai esikatseluvideota. Luo ne Scene-asetuksissa ja yritä sitten uudelleen.`,
        'scene.noFaces': `Tämän kohtauksen sprite-arkista tai esikatseluvideosta ei löytynyt kasvoja tai esiintyjiä.`,
        'scene.healthBanner': `Kasvojentunnistuksen API ei ole tavoitettavissa. Käynnistä backend ja yritä uudelleen.`,
        'scene.failed': `Kohtauksen skannaus epäonnistui: {error}`,
        'scene.menuItemTitle': `Tunnista jokainen kohtauksen esiintyjä (edellyttää luotua sprite-arkkia tai esikatseluvideota)`,
        'scene.wholeScene': `Visage: Koko kohtaus`,
        'banner.changeBackend': `Vaihda backend`,
        'banner.dismiss': `Hylkää`,
        'error.dismiss': `Hylkää`,
        'firstRun.title': `Määritä Visage-backendisi`,
        'firstRun.subtitle': `Visage lähettää kasvokuvia backendille tunnistusta varten. Valitse, missä se suoritetaan.`,
        'firstRun.cloud': `Käytä Hugging Face cloudia`,
        'firstRun.cloudNote': `Ei asennusta. Kuvat lähetetään Hugging Face -pilvipalveluun.`,
        'firstRun.local': `Käytä omaa palvelintani`,
        'firstRun.localNote': `Aja yksityinen binääri omalla koneellasi tai verkossasi.`,
        'firstRun.skip': `Ohita toistaiseksi`,
        'badge.local': `Paikallinen`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Visage-backend: {label}`,
        'donate.enjoying': `Pidätkö Visagesta? Auta pitämään se hengissä`,
        'donate.supportPatreon': `Tue Patreonissa`,
        'frame.close': `Sulje ruutuvalitsin`,
        'frame.seekFail': `Videotoistimen siirtyminen epäonnistui.`,
        'frame.selectAt': `Valitse kasvoruutu kohdassa {time}s`,
    };

    const lv = {
        'backendSettings.title': `Pamata pakalpojuma iestatījumi`,
        'backendSettings.closeAria': `Aizvērt iestatījumus`,
        'backendSettings.backendAria': `Pamata pakalpojuma iestatījumi`,
        'backendSettings.changeBackend': `Mainīt pamata pakalpojumu`,
        'backendSettings.backendLabel': `Pamata pakalpojums`,
        'backendSettings.local': `Lokāls`,
        'backendSettings.cloud': `Mākonis (Hugging Face)`,
        'backendSettings.cloudNote': `Attēli tiek nosūtīti uz Hugging Face mākoņpakalpojumu.`,
        'backendSettings.hintPrefix': `Vai vēlaties, lai jūsu attēli paliktu jūsu tīklā?`,
        'backendSettings.hintLink': `Palaidiet privātu serveri, izmantojot Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `Pārlūka drošības politika (CSP) pēc noklusējuma atļauj tikai`,
        'backendSettings.csp2': `. Lai sasniegtu lokālu pamata pakalpojumu citā adresē (piemēram, jūsu LAN IP), pievienojiet to`,
        'backendSettings.csp3': `sarakstam failā`,
        'backendSettings.csp4': `Stash spraudņu mapē, pretējā gadījumā pieprasījumi tiks bloķēti. Ņemiet vērā: Visage atjaunināšana pārinstalē`,
        'backendSettings.csp5': `, tāpēc tas ir jāatkārto pēc katra atjauninājuma.`,
        'backendSettings.testing': `Savienojuma pārbaude…`,
        'backendSettings.testConnection': `Pārbaudīt savienojumu`,
        'backendSettings.testingShort': `Pārbaude…`,
        'backendSettings.cancel': `Atcelt`,
        'backendSettings.save': `Saglabāt`,
        'backendSettings.feedback.reachable': `Savienojums izdevies. Pamata pakalpojums ir gatavs.`,
        'backendSettings.feedback.degraded': `Pamata pakalpojums sasniedzams, bet samazinātā režīmā (modeļi vai indekss nav ielādēti).`,
        'backendSettings.feedback.unreachable': `Pamata pakalpojums nesasniedzams. Pārbaudiet URL un pārliecinieties, ka pakalpojums darbojas.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `PAŠREIZĒJAIS KADRĪTIS`,
        'faceMatch.close': `Aizvērt`,
        'faceMatch.facesSelected': `Atrastas sejas: {faces} · atlasītas: {selected}`,
        'faceMatch.inScene': `· {count} ainā`,
        'faceMatch.stashboxMissing': `Nav konfigurēts stash-box.`,
        'faceMatch.stashboxMissingBody': ` Pievienojiet stash-box nodrošinātāju vietnē Settings → Metadata Providers, lai iespējotu izpildītāju importēšanu.`,
        'faceMatch.stashboxWrongName': `Nodrošinātājs "StashDB" nav atrasts.`,
        'faceMatch.stashboxWrongNameBody': ` Izpildītāju importēšanai nepieciešams nodrošinātājs ar nosaukumu "StashDB". Pārdēvējiet nodrošinātāju vietnē Settings → Metadata Providers.`,
        'faceMatch.learnMore': `Uzziniet vairāk.`,
        'faceMatch.scanning': `Skenēšana • seju atpazīšana…`,
        'faceMatch.faceAlt': `Seja {index}`,
        'faceMatch.minConf': `Min. ticam.`,
        'faceMatch.minConfTitle': `Minimālā ticamība: {percent}%`,
        'faceMatch.detected': `Atklāts`,
        'faceMatch.detectedFaceAlt': `Atklātā seja`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Atbalstīt pakalpojumā Patreon`,
        'faceMatch.ofSelected': `Atlasītas {selected} no {total}`,
        'faceMatch.allInScene': `Atrastas sejas: {total} · visas ainā`,
        'faceMatch.clickToSelect': `Atrastas sejas: {total} · noklikšķiniet, lai atlasītu`,
        'faceMatch.kbSwitch': `Seju pārslēgšana`,
        'faceMatch.kbSelect': `Izpildītāju atlase`,
        'faceMatch.kbToggle': `Pārslēgt atlasi`,
        'faceMatch.kbAddInstant': `Shift+klikšķis, lai pievienotu uzreiz`,
        'faceMatch.selectBest': `Izvēlēties labākās atbilstības`,
        'faceMatch.adding': `Pievienošana...`,
        'faceMatch.done': `Gatavs ({count})`,
        'faceMatch.toast.added': `Izpildītājs pievienots {target}.`,
        'faceMatch.toast.addError': `Neizdevās pievienot izpildītāju: {error}`,
        'faceMatch.toast.noStashbox': `Nav konfigurēts stash-box. Pievienojiet stash-box nodrošinātāju vietnē Settings → Metadata Providers, lai iespējotu izpildītāju importēšanu. Skatiet {url}`,
        'faceMatch.toast.noProvider': `Nodrošinātājs "StashDB" nav atrasts. Pārdēvējiet nodrošinātāju uz "StashDB" vietnē Settings → Metadata Providers, lai iespējotu izpildītāju importēšanu.`,
        'faceMatch.toast.configureProvider': `Konfigurējiet stash-box nodrošinātāju vietnē Settings → Metadata Providers, lai iespējotu izpildītāju importēšanu.`,
        'faceMatch.toast.addedMultiple': `Pievienoti izpildītāji: {count} uz {target}.`,
        'sprite.title': `AINAS IZPILDĪTĀJI`,
        'sprite.close': `Aizvērt`,
        'sprite.foundConfirmed': `Atrasti: {found} · apstiprināti: {confirmed}`,
        'sprite.confidence': `ticamība`,
        'sprite.name': `vārds`,
        'sprite.hits': `trāpījumi`,
        'sprite.minConf': `Min. ticam.`,
        'sprite.minConfTitle': `Minimālā ticamība: {percent}%`,
        'sprite.scanning': `Visage skenēšana…`,
        'sprite.cancel': `Atcelt`,
        'sprite.empty': `Šajā spraitā nav identificēti izpildītāji.`,
        'sprite.detectedFaceAlt': `Atklātā seja`,
        'sprite.spriteLabel': `SPRAITS`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `Ainā`,
        'sprite.hitsCount': `Trāpījumi: {count}`,
        'sprite.totalTime': `Kopā {time}`,
        'sprite.alreadyInScene': `Jau ainā`,
        'sprite.clickToConfirm': `Noklikšķiniet, lai apstiprinātu`,
        'sprite.confirmed': `Apstiprināts`,
        'sprite.supportPatreon': `Atbalstīt pakalpojumā Patreon`,
        'sprite.confirmedCount': `Apstiprināti {confirmed} no {total}`,
        'sprite.shownHint': `Rādīti: {shown} (kopā {total}) · noklikšķiniet, lai apstiprinātu · ←→ navigācija · Enter apstiprināšana`,
        'sprite.confirmHint': `Noklikšķiniet, lai apstiprinātu · ←→ navigācija · Enter apstiprināšana`,
        'sprite.adding': `Pievienošana...`,
        'sprite.done': `Gatavs ({count})`,
        'gender.male': `Vīrietis`,
        'gender.female': `Sieviete`,
        'gender.transMale': `Transpersona vīrietis`,
        'gender.transFemale': `Transpersona sieviete`,
        'gender.nonBinary': `Ne-binārs`,
        'gender.intersex': `Interdzimums`,
        'card.excellent': `Lieliska atbilstība`,
        'card.good': `Laba atbilstība`,
        'card.uncertain': `Nenoteikta atbilstība`,
        'card.select': `Atlasīt {name}`,
        'card.deselect': `Noņemt atlasi {name}`,
        'card.openOn': `Atvērt vietnē {source}`,
        'search.overlayHint': `Velciet, lai atlasītu seju — Enter, lai skenētu visu kadrīti — Esc, lai atceltu`,
        'search.noFaces': `Atlasītajā apgabalā nav atrastas sejas. Mēģiniet ar ciešāku apgriešanu vai nospiediet Enter, lai skenētu visu kadrīti.`,
        'search.captureMediaFail': `Neizdevās notvert medijus. Pārliecinieties, ka aina/attēls ir pilnībā ielādēta.`,
        'search.healthBanner': `Seju atpazīšanas API nesasniedzams. Palaidiet pamata pakalpojumu un mēģiniet vēlreiz.`,
        'search.failed': `Sejas meklēšana neizdevās: {error}`,
        'search.fetchImageFail': `Neizdevās iegūt attēlu no Stash.`,
        'search.captureFail': `Neizdevās notvert attēlu: {error}`,
        'search.selectFaceImage': `Atlasiet seju attēlā.`,
        'search.captureFrameFail': `Neizdevās notvert pašreizējo kadrīti.`,
        'search.captureFrameFail2': `Kļūda, notverot pašreizējo kadrīti.`,
        'search.selectFaceVideo': `Atlasiet seju video atskaņotāja apgabalā.`,
        'search.menuItemTitle': `Velciet rāmi ap seju vai nospiediet Enter, lai skenētu visu kadrīti, lai meklētu atbilstības StashDB`,
        'search.currentFrame': `Visage: pašreizējais kadrītis`,
        'scene.noSprite': `Šai ainai nav atrasts sprite lapa vai priekšskatījuma video. Ģenerējiet tos ainas iestatījumos un mēģiniet vēlreiz.`,
        'scene.noFaces': `Šīs ainas sprite lapā vai priekšskatījuma video nav atrastas sejas vai izpildītāji.`,
        'scene.healthBanner': `Seju atpazīšanas API nesasniedzams. Palaidiet pamata pakalpojumu un mēģiniet vēlreiz.`,
        'scene.failed': `Ainas skenēšana neizdevās: {error}`,
        'scene.menuItemTitle': `Identificējiet katru izpildītāju ainā (nepieciešama ģenerēta sprite lapa vai priekšskatījuma video)`,
        'scene.wholeScene': `Visage: visa aina`,
        'banner.changeBackend': `Mainīt pamata pakalpojumu`,
        'banner.dismiss': `Noraidīt`,
        'error.dismiss': `Noraidīt`,
        'firstRun.title': `Iestatiet savu Visage pamata pakalpojumu`,
        'firstRun.subtitle': `Visage nosūta seju attēlus pamata pakalpojumam atpazīšanai. Izvēlieties, kur to palaist.`,
        'firstRun.cloud': `Izmantot Hugging Face mākoni`,
        'firstRun.cloudNote': `Bez iestatīšanas. Attēli tiek nosūtīti uz Hugging Face mākoņpakalpojumu.`,
        'firstRun.local': `Izmantot savu serveri`,
        'firstRun.localNote': `Palaidiet privāto izpildāmo failu savā datorā vai tīklā.`,
        'firstRun.skip': `Izlaist pagaidām`,
        'badge.local': `Lokāls`,
        'badge.cloud': `Mākonis (Hugging Face)`,
        'badge.title': `Visage pamata pakalpojums: {label}`,
        'donate.enjoying': `Patīk Visage? Palīdziet to uzturēt`,
        'donate.supportPatreon': `Atbalstīt pakalpojumā Patreon`,
        'frame.close': `Aizvērt kadrīša atlasītāju`,
        'frame.seekFail': `Neizdevās pārtīt video atskaņotāju.`,
        'frame.selectAt': `Atlasīt sejas kadrīti {time} s`,
    };

    const vi = {
        'backendSettings.title': `Cài đặt backend`,
        'backendSettings.closeAria': `Đóng cài đặt`,
        'backendSettings.backendAria': `Cài đặt backend`,
        'backendSettings.changeBackend': `Đổi backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Cục bộ`,
        'backendSettings.cloud': `Đám mây (Hugging Face)`,
        'backendSettings.cloudNote': `Hình ảnh được gửi đến dịch vụ đám mây Hugging Face.`,
        'backendSettings.hintPrefix': `Muốn giữ hình ảnh trong mạng của bạn?`,
        'backendSettings.hintLink': `Chạy máy chủ riêng qua Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `Chính sách bảo mật của trình duyệt (CSP) chỉ cho phép`,
        'backendSettings.csp2': `theo mặc định. Để truy cập backend cục bộ tại địa chỉ khác (ví dụ: IP LAN của bạn), hãy thêm nó vào`,
        'backendSettings.csp3': `trong`,
        'backendSettings.csp4': `bên trong thư mục plugin Stash của bạn, nếu không các yêu cầu sẽ bị chặn. Lưu ý: cập nhật Visage sẽ cài lại`,
        'backendSettings.csp5': `, vì vậy phải áp dụng lại sau mỗi lần cập nhật.`,
        'backendSettings.testing': `Đang kiểm tra kết nối…`,
        'backendSettings.testConnection': `Kiểm tra kết nối`,
        'backendSettings.testingShort': `Đang kiểm tra…`,
        'backendSettings.cancel': `Hủy`,
        'backendSettings.save': `Lưu`,
        'backendSettings.feedback.reachable': `Kết nối thành công. Backend đã sẵn sàng.`,
        'backendSettings.feedback.degraded': `Backend truy cập được nhưng bị suy giảm (mô hình hoặc chỉ mục chưa được tải).`,
        'backendSettings.feedback.unreachable': `Không thể truy cập backend. Kiểm tra URL và đảm bảo backend đang chạy.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `KHUNG HÌNH HIỆN TẠI`,
        'faceMatch.close': `Đóng`,
        'faceMatch.facesSelected': `Tìm thấy {faces} khuôn mặt · đã chọn {selected}`,
        'faceMatch.inScene': `· {count} trong cảnh`,
        'faceMatch.stashboxMissing': `Chưa cấu hình stash-box.`,
        'faceMatch.stashboxMissingBody': ` Thêm nhà cung cấp stash-box trong Cài đặt → Nhà cung cấp siêu dữ liệu để bật nhập diễn viên.`,
        'faceMatch.stashboxWrongName': `Không tìm thấy nhà cung cấp "StashDB".`,
        'faceMatch.stashboxWrongNameBody': ` Việc nhập diễn viên yêu cầu nhà cung cấp tên là "StashDB". Đổi tên nhà cung cấp của bạn trong Cài đặt → Nhà cung cấp siêu dữ liệu.`,
        'faceMatch.learnMore': `Tìm hiểu thêm.`,
        'faceMatch.scanning': `Đang quét · nhận dạng khuôn mặt…`,
        'faceMatch.faceAlt': `Khuôn mặt {index}`,
        'faceMatch.minConf': `Độ tin cậy tối thiểu`,
        'faceMatch.minConfTitle': `Độ tin cậy tối thiểu: {percent}%`,
        'faceMatch.detected': `Đã phát hiện`,
        'faceMatch.detectedFaceAlt': `Khuôn mặt được phát hiện`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Ủng hộ trên Patreon`,
        'faceMatch.ofSelected': `Đã chọn {selected} trong tổng {total}`,
        'faceMatch.allInScene': `Tìm thấy {total} khuôn mặt · tất cả trong cảnh`,
        'faceMatch.clickToSelect': `Tìm thấy {total} khuôn mặt · bấm để chọn`,
        'faceMatch.kbSwitch': `Chuyển khuôn mặt`,
        'faceMatch.kbSelect': `Chọn diễn viên`,
        'faceMatch.kbToggle': `Bật/tắt chọn`,
        'faceMatch.kbAddInstant': `Shift+bấm để thêm ngay`,
        'faceMatch.selectBest': `Chọn kết quả khớp tốt nhất`,
        'faceMatch.adding': `Đang thêm...`,
        'faceMatch.done': `Xong ({count})`,
        'faceMatch.toast.added': `Đã thêm diễn viên vào {target}.`,
        'faceMatch.toast.addError': `Không thêm được diễn viên: {error}`,
        'faceMatch.toast.noStashbox': `Chưa cấu hình stash-box. Thêm nhà cung cấp stash-box trong Cài đặt → Nhà cung cấp siêu dữ liệu để bật nhập diễn viên. Xem {url}`,
        'faceMatch.toast.noProvider': `Không tìm thấy nhà cung cấp tên "StashDB". Đổi tên nhà cung cấp của bạn thành "StashDB" trong Cài đặt → Nhà cung cấp siêu dữ liệu để bật nhập diễn viên.`,
        'faceMatch.toast.configureProvider': `Cấu hình nhà cung cấp stash-box trong Cài đặt → Nhà cung cấp siêu dữ liệu để bật nhập diễn viên.`,
        'faceMatch.toast.addedMultiple': `Đã thêm {count} diễn viên{s} vào {target}.`,
        'sprite.title': `DIỄN VIÊN TRONG CẢNH`,
        'sprite.close': `Đóng`,
        'sprite.foundConfirmed': `Tìm thấy {found} · đã xác nhận {confirmed}`,
        'sprite.confidence': `độ tin cậy`,
        'sprite.name': `tên`,
        'sprite.hits': `lượt khớp`,
        'sprite.minConf': `Độ tin cậy tối thiểu`,
        'sprite.minConfTitle': `Độ tin cậy tối thiểu: {percent}%`,
        'sprite.scanning': `Visage đang quét…`,
        'sprite.cancel': `Hủy`,
        'sprite.empty': `Không xác định được diễn viên nào trong sprite này.`,
        'sprite.detectedFaceAlt': `Khuôn mặt được phát hiện`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `Trong cảnh`,
        'sprite.hitsCount': `{count} lượt khớp{s}`,
        'sprite.totalTime': `tổng {time}`,
        'sprite.alreadyInScene': `Đã có trong cảnh`,
        'sprite.clickToConfirm': `Bấm để xác nhận`,
        'sprite.confirmed': `Đã xác nhận`,
        'sprite.supportPatreon': `Ủng hộ trên Patreon`,
        'sprite.confirmedCount': `Đã xác nhận {confirmed} trong tổng {total}`,
        'sprite.shownHint': `Hiển thị {shown} (tổng {total}) · bấm để xác nhận · ←→ điều hướng · Enter xác nhận`,
        'sprite.confirmHint': `Bấm để xác nhận · ←→ điều hướng · Enter xác nhận`,
        'sprite.adding': `Đang thêm...`,
        'sprite.done': `Xong ({count})`,
        'gender.male': `Nam`,
        'gender.female': `Nữ`,
        'gender.transMale': `Nam chuyển giới`,
        'gender.transFemale': `Nữ chuyển giới`,
        'gender.nonBinary': `Phi nhị nguyên`,
        'gender.intersex': `Liên giới tính`,
        'card.excellent': `Khớp xuất sắc`,
        'card.good': `Khớp tốt`,
        'card.uncertain': `Khớp không chắc chắn`,
        'card.select': `Chọn {name}`,
        'card.deselect': `Bỏ chọn {name}`,
        'card.openOn': `Mở trên {source}`,
        'search.overlayHint': `Kéo để chọn khuôn mặt — Enter để quét toàn bộ khung hình — Esc để hủy`,
        'search.noFaces': `Không tìm thấy khuôn mặt nào trong vùng chọn đó. Hãy thử cắt hẹp hơn hoặc nhấn Enter để quét toàn bộ khung hình.`,
        'search.captureMediaFail': `Không thể chụp phương tiện. Vui lòng đảm bảo cảnh/hình ảnh đã được tải hoàn toàn.`,
        'search.healthBanner': `API nhận dạng khuôn mặt không truy cập được. Hãy khởi động backend và thử lại.`,
        'search.failed': `Tìm kiếm khuôn mặt thất bại: {error}`,
        'search.fetchImageFail': `Không thể lấy hình ảnh từ Stash.`,
        'search.captureFail': `Chụp hình ảnh thất bại: {error}`,
        'search.selectFaceImage': `Chọn một khuôn mặt trong hình ảnh.`,
        'search.captureFrameFail': `Không thể chụp khung hình hiện tại.`,
        'search.captureFrameFail2': `Chụp khung hình hiện tại thất bại.`,
        'search.selectFaceVideo': `Chọn một khuôn mặt trong vùng trình phát video.`,
        'search.menuItemTitle': `Kéo một khung quanh khuôn mặt hoặc nhấn Enter để quét toàn bộ khung hình nhằm tìm kiếm kết quả khớp trên StashDB`,
        'search.currentFrame': `Visage: Khung hình hiện tại`,
        'scene.noSprite': `Không có sprite sheet hoặc video xem trước cho cảnh này. Hãy tạo chúng trong Cài đặt cảnh, rồi thử lại.`,
        'scene.noFaces': `Không tìm thấy khuôn mặt hoặc diễn viên nào trong sprite sheet hoặc video xem trước của cảnh này.`,
        'scene.healthBanner': `API nhận dạng khuôn mặt không truy cập được. Hãy khởi động backend và thử lại.`,
        'scene.failed': `Quét cảnh thất bại: {error}`,
        'scene.menuItemTitle': `Xác định mọi diễn viên trong cảnh (cần sprite sheet hoặc video xem trước đã tạo)`,
        'scene.wholeScene': `Visage: Toàn bộ cảnh`,
        'banner.changeBackend': `Đổi backend`,
        'banner.dismiss': `Bỏ qua`,
        'error.dismiss': `Bỏ qua`,
        'firstRun.title': `Thiết lập backend Visage của bạn`,
        'firstRun.subtitle': `Visage gửi hình ảnh khuôn mặt đến backend để nhận dạng. Chọn nơi chạy nó.`,
        'firstRun.cloud': `Dùng đám mây Hugging Face`,
        'firstRun.cloudNote': `Không cần thiết lập. Hình ảnh được gửi đến dịch vụ đám mây Hugging Face.`,
        'firstRun.local': `Dùng máy chủ của riêng tôi`,
        'firstRun.localNote': `Chạy tệp nhị phân riêng trên máy hoặc mạng của bạn.`,
        'firstRun.skip': `Tạm bỏ qua`,
        'badge.local': `Cục bộ`,
        'badge.cloud': `Đám mây (Hugging Face)`,
        'badge.title': `Backend Visage: {label}`,
        'donate.enjoying': `Đang dùng Visage? Giúp giữ nó hoạt động`,
        'donate.supportPatreon': `Ủng hộ trên Patreon`,
        'frame.close': `Đóng trình chọn khung hình`,
        'frame.seekFail': `Không thể tua trình phát video.`,
        'frame.selectAt': `Chọn khung hình khuôn mặt tại {time} giây`,
    };

    // Estonian.
    const et = {
        'backendSettings.title': `Backend-seaded`,
        'backendSettings.closeAria': `Sule seaded`,
        'backendSettings.backendAria': `Backend-seaded`,
        'backendSettings.changeBackend': `Vaheta backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Kohalik`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Pildid saadetakse Hugging Face pilveteenusesse.`,
        'backendSettings.hintPrefix': `Kas soovid, et su pildid jääksid sinu võrku?`,
        'backendSettings.hintLink': `Käivita privaatne server Patreoni kaudu`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': "Brauseri turvapoliitika (CSP) lubab vaikimisi ainult",
        'backendSettings.csp2': `Teise aadressiga (nt oma LAN-IP) kohaliku backendini jõudmiseks lisa see`,
        'backendSettings.csp3': `loendisse failis`,
        'backendSettings.csp4': `oma Stash pluginade kaustas, muidu päringud blokeeritakse. Märkus: Visage värskendamine installib`,
        'backendSettings.csp5': `uuesti, nii et seda tuleb iga värskenduse järel uuesti teha.`,
        'backendSettings.testing': `Ühenduse testimine…`,
        'backendSettings.testConnection': `Testi ühendust`,
        'backendSettings.testingShort': `Testimine…`,
        'backendSettings.cancel': `Tühista`,
        'backendSettings.save': `Salvesta`,
        'backendSettings.feedback.reachable': `Ühendus õnnestus. Backend on valmis.`,
        'backendSettings.feedback.degraded': `Backend on kättesaadav, kuid halvendatud (mudelid või indeks pole laaditud).`,
        'backendSettings.feedback.unreachable': `Backend ei ole kättesaadav. Kontrolli URL-i ja et backend töötab.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `PRAEGUNE KAADER`,
        'faceMatch.close': `Sule`,
        'faceMatch.facesSelected': `Leitud {faces} nägu · valitud {selected}`,
        'faceMatch.inScene': `· {count} stseenis`,
        'faceMatch.stashboxMissing': `Stash-box pole konfigureeritud.`,
        'faceMatch.stashboxMissingBody': ` Lisa esinejate impordi lubamiseks stash-box-pakkuja jaotises Seaded → Metaandmete pakkujad.`,
        'faceMatch.stashboxWrongName': `Pakkujat "StashDB" ei leitud.`,
        'faceMatch.stashboxWrongNameBody': ` Esinejate import nõuab pakkujat nimega "StashDB". Nimeta oma pakkuja ümber jaotises Seaded → Metaandmete pakkujad.`,
        'faceMatch.learnMore': `Lisateave.`,
        'faceMatch.scanning': `Skannimine • näotuvastus…`,
        'faceMatch.faceAlt': `Nägu {index}`,
        'faceMatch.minConf': `Min. kindl.`,
        'faceMatch.minConfTitle': `Minimaalne kindlus: {percent}%`,
        'faceMatch.detected': `Tuvastatud`,
        'faceMatch.detectedFaceAlt': `Tuvastatud nägu`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Toeta Patreonis`,
        'faceMatch.ofSelected': `Valitud {selected}/{total}`,
        'faceMatch.allInScene': `Leitud {total} nägu · kõik stseenis`,
        'faceMatch.clickToSelect': `Leitud {total} nägu · valimiseks klõpsa`,
        'faceMatch.kbSwitch': `Vaheta nägusid`,
        'faceMatch.kbSelect': `Vali esinejad`,
        'faceMatch.kbToggle': `Vaheta valikut`,
        'faceMatch.kbAddInstant': `Shift+klõps lisab kohe`,
        'faceMatch.selectBest': `Vali parimad vasted`,
        'faceMatch.adding': `Lisamine...`,
        'faceMatch.done': `Valmis ({count})`,
        'faceMatch.toast.added': `Esineja lisatud sihtkohta {target}.`,
        'faceMatch.toast.addError': `Esineja lisamine ebaõnnestus: {error}`,
        'faceMatch.toast.noStashbox': `Stash-box pole konfigureeritud. Lisa esinejate impordi lubamiseks stash-box-pakkuja jaotises Seaded → Metaandmete pakkujad. Vaata {url}`,
        'faceMatch.toast.noProvider': `Pakkujat nimega "StashDB" ei leitud. Nimeta esinejate impordi lubamiseks oma pakkuja ümber "StashDB"-ks jaotises Seaded → Metaandmete pakkujad.`,
        'faceMatch.toast.configureProvider': `Konfigureeri stash-box-pakkuja jaotises Seaded → Metaandmete pakkujad esinejate impordi lubamiseks.`,
        'faceMatch.toast.addedMultiple': `Sihtkohta {target} lisati {count} esinejat.`,
        'sprite.title': `STSEENI ESINEJAD`,
        'sprite.close': `Sulge`,
        'sprite.foundConfirmed': `Leitud {found} · kinnitatud {confirmed}`,
        'sprite.confidence': `kindlus`,
        'sprite.name': `nimi`,
        'sprite.hits': `tabamused`,
        'sprite.minConf': `Min. kindl.`,
        'sprite.minConfTitle': `Minimaalne kindlus: {percent}%`,
        'sprite.scanning': `Visage skannib…`,
        'sprite.cancel': `Tühista`,
        'sprite.empty': `Selles sprites ei tuvastatud ühtegi esinejat.`,
        'sprite.detectedFaceAlt': `Tuvastatud nägu`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `Stseenis`,
        'sprite.hitsCount': `{count} tabamus`,
        'sprite.totalTime': `{time} kokku`,
        'sprite.alreadyInScene': `Juba stseenis`,
        'sprite.clickToConfirm': `Kinnitamiseks klõpsa`,
        'sprite.confirmed': `Kinnitatud`,
        'sprite.supportPatreon': `Toeta Patreonis`,
        'sprite.confirmedCount': `Kinnitatud {confirmed}/{total}`,
        'sprite.shownHint': `Näidatud {shown} ({total} kokku) · kinnitamiseks klõpsa · ←→ navigeerimine · Enter kinnitab`,
        'sprite.confirmHint': `Kinnitamiseks klõpsa · ←→ navigeerimine · Enter kinnitab`,
        'sprite.adding': `Lisamine...`,
        'sprite.done': `Valmis ({count})`,
        'gender.male': `Mees`,
        'gender.female': `Naine`,
        'gender.transMale': `Transmees`,
        'gender.transFemale': `Transnaine`,
        'gender.nonBinary': `Mittebinaarne`,
        'gender.intersex': `Intersooline`,
        'card.excellent': `Suurepärane vaste`,
        'card.good': `Hea vaste`,
        'card.uncertain': `Ebamäärane vaste`,
        'card.select': `Vali {name}`,
        'card.deselect': `Tühista valik {name}`,
        'card.openOn': `Ava saidil {source}`,
        'search.overlayHint': `Näo valimiseks lohista — Enter skannib kogu kaadri — Esc tühistab`,
        'search.noFaces': `Sellest valikust ei leitud ühtegi nägu. Proovi täpsemat kärpimist või vajuta Enter, et skannida kogu kaader.`,
        'search.captureMediaFail': `Meedia jäädvustamine ebaõnnestus. Veendu, et stseen/pilt on täielikult laaditud.`,
        'search.healthBanner': `Näotuvastuse API ei ole kättesaadav. Käivita backend ja proovi uuesti.`,
        'search.failed': `Näootsing ebaõnnestus: {error}`,
        'search.fetchImageFail': `Pildi toomine Stashist ebaõnnestus.`,
        'search.captureFail': `Pildi jäädvustamine ebaõnnestus: {error}`,
        'search.selectFaceImage': `Vali pildilt nägu.`,
        'search.captureFrameFail': `Praeguse kaadri jäädvustamine ebaõnnestus.`,
        'search.captureFrameFail2': `Praeguse kaadri jäädvustamine ei õnnestunud.`,
        'search.selectFaceVideo': `Vali nägu videopleieri piirkonnast.`,
        'search.menuItemTitle': `Lohista kast ümber näo või vajuta Enter kogu kaadri skannimiseks, et otsida StashDB-st vasted`,
        'search.currentFrame': `Visage: praegune kaader`,
        'scene.noSprite': `Selle stseeni jaoks ei leitud sprite-lehte ega eelvaatuse videot. Genereeri need Scene-seadetes ja proovi siis uuesti.`,
        'scene.noFaces': `Selle stseeni sprite-lehest või eelvaatuse videost ei leitud ühtegi nägu ega esinejat.`,
        'scene.healthBanner': `Näotuvastuse API ei ole kättesaadav. Käivita backend ja proovi uuesti.`,
        'scene.failed': `Stseeni skannimine ebaõnnestus: {error}`,
        'scene.menuItemTitle': `Tuvasta iga esineja stseenis (nõuab genereeritud sprite-lehte või eelvaatuse videot)`,
        'scene.wholeScene': `Visage: kogu stseen`,
        'banner.changeBackend': `Vaheta backend`,
        'banner.dismiss': `Lükka tagasi`,
        'error.dismiss': `Lükka tagasi`,
        'firstRun.title': `Seadista oma Visage backend`,
        'firstRun.subtitle': `Visage saadab näopildid tuvastamiseks backendile. Vali, kus seda käitada.`,
        'firstRun.cloud': `Kasuta Hugging Face cloudi`,
        'firstRun.cloudNote': `Pole seadistamist vaja. Pildid saadetakse Hugging Face pilveteenusesse.`,
        'firstRun.local': `Kasuta oma serverit`,
        'firstRun.localNote': `Käivita privaatne binaar oma masinas või võrgus.`,
        'firstRun.skip': `Jäta praegu vahele`,
        'badge.local': `Kohalik`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Visage backend: {label}`,
        'donate.enjoying': `Kas Visage meeldib sulle? Aita seda elus hoida`,
        'donate.supportPatreon': `Toeta Patreonis`,
        'frame.close': `Sule kaadrivalija`,
        'frame.seekFail': `Videopleieris navigeerimine ebaõnnestus.`,
        'frame.selectAt': `Vali näokaader kohas {time}s`,
    };

    // Norwegian Bokmål.
    const nb = {
        'backendSettings.title': `Backend-innstillinger`,
        'backendSettings.closeAria': `Lukk innstillinger`,
        'backendSettings.backendAria': `Backend-innstillinger`,
        'backendSettings.changeBackend': `Bytt backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Lokal`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Bilder sendes til Hugging Face sky-tjenesten.`,
        'backendSettings.hintPrefix': `Vil du at bildene dine skal bli på nettverket ditt?`,
        'backendSettings.hintLink': `Kjør en privat server via Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': "Nettleserens sikkerhetspolicy (CSP) tillater bare",
        'backendSettings.csp2': `som standard. For å nå en lokal backend på en annen adresse (f.eks. LAN-IP-en din) må du legge den til i`,
        'backendSettings.csp3': `listen i`,
        'backendSettings.csp4': `-filen i Stash-plugins-mappen din, ellers blokkeres forespørslene. Merk: oppdatering av Visage installerer`,
        'backendSettings.csp5': `på nytt, så dette må gjøres på nytt etter hver oppdatering.`,
        'backendSettings.testing': `Tester tilkobling…`,
        'backendSettings.testConnection': `Test tilkobling`,
        'backendSettings.testingShort': `Tester…`,
        'backendSettings.cancel': `Avbryt`,
        'backendSettings.save': `Lagre`,
        'backendSettings.feedback.reachable': `Tilkobling vellykket. Backend er klar.`,
        'backendSettings.feedback.degraded': `Backend er tilgjengelig, men redusert (modeller eller indeks er ikke lastet inn).`,
        'backendSettings.feedback.unreachable': `Backend er utilgjengelig. Sjekk URL-en og at backend kjører.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `GJELDENDE RAMME`,
        'faceMatch.close': `Lukk`,
        'faceMatch.facesSelected': `{faces} ansikter funnet · {selected} valgt`,
        'faceMatch.inScene': `· {count} i scene`,
        'faceMatch.stashboxMissing': `Ingen stash-box konfigurert.`,
        'faceMatch.stashboxMissingBody': ` Legg til en stash-box-leverandør under Innstillinger → Metadata-leverandører for å aktivere performer-import.`,
        'faceMatch.stashboxWrongName': `Fant ingen "StashDB"-leverandør.`,
        'faceMatch.stashboxWrongNameBody': ` Performer-import krever en leverandør kalt "StashDB". Gi leverandøren nytt navn under Innstillinger → Metadata-leverandører.`,
        'faceMatch.learnMore': `Les mer.`,
        'faceMatch.scanning': `Skanner • ansiktsgjenkjenning…`,
        'faceMatch.faceAlt': `Ansikt {index}`,
        'faceMatch.minConf': `Min. konf.`,
        'faceMatch.minConfTitle': `Minimumskonfidens: {percent}%`,
        'faceMatch.detected': `Oppdaget`,
        'faceMatch.detectedFaceAlt': `Oppdaget ansikt`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Støtt på Patreon`,
        'faceMatch.ofSelected': `{selected} av {total} valgt`,
        'faceMatch.allInScene': `{total} ansikter funnet · alle i scene`,
        'faceMatch.clickToSelect': `{total} ansikter funnet · klikk for å velge`,
        'faceMatch.kbSwitch': `Bytt ansikter`,
        'faceMatch.kbSelect': `Velg performere`,
        'faceMatch.kbToggle': `Veksle markering`,
        'faceMatch.kbAddInstant': `Shift+klikk for å legge til umiddelbart`,
        'faceMatch.selectBest': `Velg beste treff`,
        'faceMatch.adding': `Legger til...`,
        'faceMatch.done': `Ferdig ({count})`,
        'faceMatch.toast.added': `La til performer i {target}.`,
        'faceMatch.toast.addError': `Kunne ikke legge til performer: {error}`,
        'faceMatch.toast.noStashbox': `Ingen stash-box konfigurert. Legg til en stash-box-leverandør under Innstillinger → Metadata-leverandører for å aktivere performer-import. Se {url}`,
        'faceMatch.toast.noProvider': `Fant ingen leverandør kalt "StashDB". Gi leverandøren nytt navn til "StashDB" under Innstillinger → Metadata-leverandører for å aktivere performer-import.`,
        'faceMatch.toast.configureProvider': `Konfigurer en stash-box-leverandør under Innstillinger → Metadata-leverandører for å aktivere performer-import.`,
        'faceMatch.toast.addedMultiple': `La til {count} performere i {target}.`,
        'sprite.title': `SCENE-PERFORMERE`,
        'sprite.close': `Lukk`,
        'sprite.foundConfirmed': `{found} funnet · {confirmed} bekreftet`,
        'sprite.confidence': `konfidens`,
        'sprite.name': `navn`,
        'sprite.hits': `treff`,
        'sprite.minConf': `Min. konf.`,
        'sprite.minConfTitle': `Minimumskonfidens: {percent}%`,
        'sprite.scanning': `Visage skanner…`,
        'sprite.cancel': `Avbryt`,
        'sprite.empty': `Ingen performere identifisert i denne spriten.`,
        'sprite.detectedFaceAlt': `Oppdaget ansikt`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `I scene`,
        'sprite.hitsCount': `{count} treff`,
        'sprite.totalTime': `{time} totalt`,
        'sprite.alreadyInScene': `Allerede i scene`,
        'sprite.clickToConfirm': `Klikk for å bekrefte`,
        'sprite.confirmed': `Bekreftet`,
        'sprite.supportPatreon': `Støtt på Patreon`,
        'sprite.confirmedCount': `{confirmed} av {total} bekreftet`,
        'sprite.shownHint': `{shown} vist ({total} totalt) · klikk for å bekrefte · ←→ naviger · Enter bekreft`,
        'sprite.confirmHint': `Klikk for å bekrefte · ←→ naviger · Enter bekreft`,
        'sprite.adding': `Legger til...`,
        'sprite.done': `Ferdig ({count})`,
        'gender.male': `Mann`,
        'gender.female': `Kvinne`,
        'gender.transMale': `Transmann`,
        'gender.transFemale': `Transkvinne`,
        'gender.nonBinary': `Ikke-binær`,
        'gender.intersex': `Intersex`,
        'card.excellent': `Utmerket treff`,
        'card.good': `Godt treff`,
        'card.uncertain': `Usikkert treff`,
        'card.select': `Velg {name}`,
        'card.deselect': `Fravelg {name}`,
        'card.openOn': `Åpne på {source}`,
        'search.overlayHint': `Dra for å velge et ansikt — Enter for å skanne hele rammen — Esc for å avbryte`,
        'search.noFaces': `Ingen ansikter funnet i utvalget. Prøv en tettere beskjæring, eller trykk Enter for å skanne hele rammen.`,
        'search.captureMediaFail': `Kunne ikke fange mediet. Kontroller at scenen/bildet er fullastet.`,
        'search.healthBanner': `Ansiktsgjenkjennings-API-et er ikke tilgjengelig. Start backend og prøv igjen.`,
        'search.failed': `Ansiktssøk mislyktes: {error}`,
        'search.fetchImageFail': `Kunne ikke hente bilde fra Stash.`,
        'search.captureFail': `Kunne ikke fange bilde: {error}`,
        'search.selectFaceImage': `Velg et ansikt i bildet.`,
        'search.captureFrameFail': `Kunne ikke fange gjeldende ramme.`,
        'search.captureFrameFail2': `Innfanging av gjeldende ramme mislyktes.`,
        'search.selectFaceVideo': `Velg et ansikt i videoavspillerområdet.`,
        'search.menuItemTitle': `Dra en boks rundt et ansikt, eller trykk Enter for å skanne hele rammen, for å søke StashDB etter treff`,
        'search.currentFrame': `Visage: Gjeldende ramme`,
        'scene.noSprite': `Fant ingen sprite-ark eller forhåndsvisningsvideo for denne scenen. Generer dem i Scene-innstillingene, og prøv igjen.`,
        'scene.noFaces': `Fant ingen ansikter eller performere i denne scenens sprite-ark eller forhåndsvisningsvideo.`,
        'scene.healthBanner': `Ansiktsgjenkjennings-API-et er ikke tilgjengelig. Start backend og prøv igjen.`,
        'scene.failed': `Scene-skanning mislyktes: {error}`,
        'scene.menuItemTitle': `Identifiser hver performer i scenen (krever et generert sprite-ark eller en forhåndsvisningsvideo)`,
        'scene.wholeScene': `Visage: Hele scenen`,
        'banner.changeBackend': `Bytt backend`,
        'banner.dismiss': `Avvis`,
        'error.dismiss': `Avvis`,
        'firstRun.title': `Sett opp Visage-backend-en din`,
        'firstRun.subtitle': `Visage sender ansiktsbilder til en backend for gjenkjenning. Velg hvor den skal kjøres.`,
        'firstRun.cloud': `Bruk Hugging Face cloud`,
        'firstRun.cloudNote': `Ingen oppsett. Bilder sendes til Hugging Face sky-tjenesten.`,
        'firstRun.local': `Bruk min egen server`,
        'firstRun.localNote': `Kjør den private binæren på din egen maskin eller ditt nettverk.`,
        'firstRun.skip': `Hopp over for nå`,
        'badge.local': `Lokal`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Visage-backend: {label}`,
        'donate.enjoying': `Liker du Visage? Hjelp å holde det i live`,
        'donate.supportPatreon': `Støtt på Patreon`,
        'frame.close': `Lukk rammevelgeren`,
        'frame.seekFail': `Kunne ikke søke i videoavspilleren.`,
        'frame.selectAt': `Velg ansiktsramme ved {time}s`,
    };

    // Turkish.
    const tr = {
        'backendSettings.title': `Backend ayarları`,
        'backendSettings.closeAria': `Ayarları kapat`,
        'backendSettings.backendAria': `Backend ayarları`,
        'backendSettings.changeBackend': `Backend değiştir`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Yerel`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Görseller Hugging Face bulut hizmetine gönderilir.`,
        'backendSettings.hintPrefix': `Görsellerinizin ağınızda kalmasını ister misiniz?`,
        'backendSettings.hintLink': `Patreon üzerinden özel bir sunucu çalıştırın`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': "Tarayıcının güvenlik politikası (CSP) varsayılan olarak yalnızca",
        'backendSettings.csp2': `adreslerine izin verir. Başka bir adresteki (örn. LAN IP'niz) yerel bir backend\u2019e ulaşmak için onu`,
        'backendSettings.csp3': `dosyasındaki`,
        'backendSettings.csp4': `listesine ekleyin, aksi halde istekler engellenir. Not: Visage güncellemesi`,
        'backendSettings.csp5': `dosyasını yeniden yükler, bu nedenle bu işlemin her güncellemeden sonra tekrarlanması gerekir.`,
        'backendSettings.testing': `Bağlantı test ediliyor…`,
        'backendSettings.testConnection': `Bağlantıyı test et`,
        'backendSettings.testingShort': `Test ediliyor…`,
        'backendSettings.cancel': `İptal`,
        'backendSettings.save': `Kaydet`,
        'backendSettings.feedback.reachable': `Bağlantı başarılı. Backend hazır.`,
        'backendSettings.feedback.degraded': `Backend erişilebilir ancak düşük performanslı (modeller veya dizin yüklenmemiş).`,
        'backendSettings.feedback.unreachable': `Backend\u2019e ulaşılamıyor. URL'yi ve backend\u2019in çalıştığını kontrol edin.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `MEVCUT KARE`,
        'faceMatch.close': `Kapat`,
        'faceMatch.facesSelected': `{faces} yüz bulundu · {selected} seçildi`,
        'faceMatch.inScene': `· sahnede {count}`,
        'faceMatch.stashboxMissing': `stash-box yapılandırılmadı.`,
        'faceMatch.stashboxMissingBody': ` Oyuncu içe aktarmayı etkinleştirmek için Ayarlar → Meta Veri Sağlayıcıları altına bir stash-box sağlayıcısı ekleyin.`,
        'faceMatch.stashboxWrongName': `"StashDB" sağlayıcısı bulunamadı.`,
        'faceMatch.stashboxWrongNameBody': ` Oyuncu içe aktarma, "StashDB" adında bir sağlayıcı gerektirir. Sağlayıcınızı Ayarlar → Meta Veri Sağlayıcıları altında yeniden adlandırın.`,
        'faceMatch.learnMore': `Daha fazla bilgi.`,
        'faceMatch.scanning': `Taranıyor • yüz tanıma…`,
        'faceMatch.faceAlt': `Yüz {index}`,
        'faceMatch.minConf': `Min. güv.`,
        'faceMatch.minConfTitle': `Minimum güven: {percent}%`,
        'faceMatch.detected': `Algılandı`,
        'faceMatch.detectedFaceAlt': `Algılanan yüz`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Patreon\u2019da destekle`,
        'faceMatch.ofSelected': `{total} içinden {selected} seçildi`,
        'faceMatch.allInScene': `{total} yüz bulundu · tümü sahnede`,
        'faceMatch.clickToSelect': `{total} yüz bulundu · seçmek için tıklayın`,
        'faceMatch.kbSwitch': `Yüzleri değiştir`,
        'faceMatch.kbSelect': `Oyuncuları seç`,
        'faceMatch.kbToggle': `Seçimi değiştir`,
        'faceMatch.kbAddInstant': `Anında eklemek için Shift+tıklayın`,
        'faceMatch.selectBest': `En İyi Eşleşmeleri Seç`,
        'faceMatch.adding': `Ekleniyor...`,
        'faceMatch.done': `Bitti ({count})`,
        'faceMatch.toast.added': `{target} konumuna oyuncu eklendi.`,
        'faceMatch.toast.addError': `Oyuncu eklenemedi: {error}`,
        'faceMatch.toast.noStashbox': `stash-box yapılandırılmadı. Oyuncu içe aktarmayı etkinleştirmek için Ayarlar → Meta Veri Sağlayıcıları altına bir stash-box sağlayıcısı ekleyin. {url} adresine bakın`,
        'faceMatch.toast.noProvider': `"StashDB" adında bir sağlayıcı bulunamadı. Oyuncu içe aktarmayı etkinleştirmek için sağlayıcınızı Ayarlar → Meta Veri Sağlayıcıları altında "StashDB" olarak yeniden adlandırın.`,
        'faceMatch.toast.configureProvider': `Oyuncu içe aktarmayı etkinleştirmek için Ayarlar → Meta Veri Sağlayıcıları altında bir stash-box sağlayıcısı yapılandırın.`,
        'faceMatch.toast.addedMultiple': `{target} konumuna {count} oyuncu eklendi.`,
        'sprite.title': `SAHNE OYUNCULARI`,
        'sprite.close': `Kapat`,
        'sprite.foundConfirmed': `{found} bulundu · {confirmed} onaylandı`,
        'sprite.confidence': `güven`,
        'sprite.name': `ad`,
        'sprite.hits': `eşleşme`,
        'sprite.minConf': `Min. güv.`,
        'sprite.minConfTitle': `Minimum güven: {percent}%`,
        'sprite.scanning': `Visage taranıyor…`,
        'sprite.cancel': `İptal`,
        'sprite.empty': `Bu spritede oyuncu tanımlanmadı.`,
        'sprite.detectedFaceAlt': `Algılanan yüz`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `Sahnede`,
        'sprite.hitsCount': `{count} eşleşme`,
        'sprite.totalTime': `toplam {time}`,
        'sprite.alreadyInScene': `Zaten sahnede`,
        'sprite.clickToConfirm': `Onaylamak için tıklayın`,
        'sprite.confirmed': `Onaylandı`,
        'sprite.supportPatreon': `Patreon\u2019da destekle`,
        'sprite.confirmedCount': `{total} içinden {confirmed} onaylandı`,
        'sprite.shownHint': `{shown} gösterildi (toplam {total}) · onaylamak için tıklayın · ←→ gezin · Enter onayla`,
        'sprite.confirmHint': `Onaylamak için tıklayın · ←→ gezin · Enter onayla`,
        'sprite.adding': `Ekleniyor...`,
        'sprite.done': `Bitti ({count})`,
        'gender.male': `Erkek`,
        'gender.female': `Kadın`,
        'gender.transMale': `Trans erkek`,
        'gender.transFemale': `Trans kadın`,
        'gender.nonBinary': `İkili olmayan`,
        'gender.intersex': `İnterseks`,
        'card.excellent': `Mükemmel eşleşme`,
        'card.good': `İyi eşleşme`,
        'card.uncertain': `Belirsiz eşleşme`,
        'card.select': `{name} seç`,
        'card.deselect': `{name} seçimini kaldır`,
        'card.openOn': `{source} üzerinde aç`,
        'search.overlayHint': `Bir yüz seçmek için sürükleyin — tüm kareyi taramak için Enter — iptal için Esc`,
        'search.noFaces': `Bu seçimde yüz bulunamadı. Daha dar bir kırpma deneyin veya tüm kareyi taramak için Enter\u2019a basın.`,
        'search.captureMediaFail': `Medya yakalanamadı. Sahnenin/görselin tamamen yüklendiğinden emin olun.`,
        'search.healthBanner': `Yüz tanıma API\u2019sine ulaşılamıyor. Backend\u2019i başlatın ve tekrar deneyin.`,
        'search.failed': `Yüz araması başarısız: {error}`,
        'search.fetchImageFail': `Stash\u2019tan görsel alınamadı.`,
        'search.captureFail': `Görsel yakalanamadı: {error}`,
        'search.selectFaceImage': `Görsel içinde bir yüz seçin.`,
        'search.captureFrameFail': `Geçerli kare yakalanamadı.`,
        'search.captureFrameFail2': `Geçerli kare yakalanamadı.`,
        'search.selectFaceVideo': `Video oynatıcı alanı içinde bir yüz seçin.`,
        'search.menuItemTitle': `StashDB\u2019de eşleşme aramak için bir yüzün etrafına kutu çizin veya tüm kareyi taramak için Enter\u2019a basın`,
        'search.currentFrame': `Visage: Geçerli Kare`,
        'scene.noSprite': `Bu sahne için sprite sayfası veya önizleme videosu bulunamadı. Scene ayarlarından oluşturun, ardından tekrar deneyin.`,
        'scene.noFaces': `Bu sahnenin sprite sayfasında veya önizleme videosunda yüz veya oyuncu bulunamadı.`,
        'scene.healthBanner': `Yüz tanıma API\u2019sine ulaşılamıyor. Backend\u2019i başlatın ve tekrar deneyin.`,
        'scene.failed': `Sahne taraması başarısız: {error}`,
        'scene.menuItemTitle': `Sahnedeki her oyuncuyu tanımlayın (oluşturulmuş bir sprite sayfası veya önizleme videosu gerektirir)`,
        'scene.wholeScene': `Visage: Tüm Sahne`,
        'banner.changeBackend': `Backend değiştir`,
        'banner.dismiss': `Kapat`,
        'error.dismiss': `Kapat`,
        'firstRun.title': `Visage backend\u2019inizi kurun`,
        'firstRun.subtitle': `Visage, tanıma için yüz görsellerini bir backend\u2019e gönderir. Nerede çalıştırılacağını seçin.`,
        'firstRun.cloud': `Hugging Face cloud kullan`,
        'firstRun.cloudNote': `Kurulum gerekmez. Görseller Hugging Face bulut hizmetine gönderilir.`,
        'firstRun.local': `Kendi sunucumu kullan`,
        'firstRun.localNote': `Özel ikili dosyayı kendi makinenizde veya ağınızda çalıştırın.`,
        'firstRun.skip': `Şimdilik atla`,
        'badge.local': `Yerel`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Visage backend: {label}`,
        'donate.enjoying': `Visage hoşunuza mı gitti? Hayatta kalmasına yardım edin`,
        'donate.supportPatreon': `Patreon\u2019da destekle`,
        'frame.close': `Kare seçiciyi kapat`,
        'frame.seekFail': `Video oynatıcıya atlanamadı.`,
        'frame.selectAt': `{time}s konumunda yüz karesi seçin`,
    };

    const zhTw = {
        'backendSettings.title': `後端設定`,
        'backendSettings.closeAria': `關閉設定`,
        'backendSettings.backendAria': `後端設定`,
        'backendSettings.changeBackend': `更換後端`,
        'backendSettings.backendLabel': `後端`,
        'backendSettings.local': `本機`,
        'backendSettings.cloud': `雲端（Hugging Face）`,
        'backendSettings.cloudNote': `影像會被傳送至 Hugging Face 雲端服務。`,
        'backendSettings.hintPrefix': `希望影像留在你的網路內？`,
        'backendSettings.hintLink': `透過 Patreon 執行私人伺服器`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `瀏覽器的安全政策（CSP）僅允許`,
        'backendSettings.csp2': `依預設情況下。若要連線位於其他位址（例如你的 LAN IP）的本機後端，請將其加入`,
        'backendSettings.csp3': `中的`,
        'backendSettings.csp4': `檔案清單，該檔案位於你的 Stash 外掛資料夾內，否則請求將被阻止。注意：更新 Visage 會重新安裝`,
        'backendSettings.csp5': `，因此每次更新後都必須重新套用此設定。`,
        'backendSettings.testing': `正在測試連線…`,
        'backendSettings.testConnection': `測試連線`,
        'backendSettings.testingShort': `正在測試…`,
        'backendSettings.cancel': `取消`,
        'backendSettings.save': `儲存`,
        'backendSettings.feedback.reachable': `連線成功。後端已就緒。`,
        'backendSettings.feedback.degraded': `後端可連線但已降級（模型或索引未載入）。`,
        'backendSettings.feedback.unreachable': `後端無法連線。請檢查 URL 並確認後端正在執行。`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `目前影格`,
        'faceMatch.close': `關閉`,
        'faceMatch.facesSelected': `找到 {faces} 張臉 · 已選擇 {selected}`,
        'faceMatch.inScene': `· {count} 在場景中`,
        'faceMatch.stashboxMissing': `未設定 stash-box。`,
        'faceMatch.stashboxMissingBody': ` 請在設定 → 中繼資料提供者中新增 stash-box 提供者，以啟用表演者匯入。`,
        'faceMatch.stashboxWrongName': `找不到「StashDB」提供者。`,
        'faceMatch.stashboxWrongNameBody': ` 表演者匯入需要名為「StashDB」的提供者。請在設定 → 中繼資料提供者中重新命名你的提供者。`,
        'faceMatch.learnMore': `深入瞭解。`,
        'faceMatch.scanning': `正在掃描 · 人臉辨識…`,
        'faceMatch.faceAlt': `臉 {index}`,
        'faceMatch.minConf': `最小信心值`,
        'faceMatch.minConfTitle': `最低信心值：{percent}%`,
        'faceMatch.detected': `已偵測到`,
        'faceMatch.detectedFaceAlt': `偵測到的人臉`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `在 Patreon 上支持`,
        'faceMatch.ofSelected': `已選擇 {total} 中的 {selected}`,
        'faceMatch.allInScene': `找到 {total} 張臉 · 全部在場景中`,
        'faceMatch.clickToSelect': `找到 {total} 張臉 · 按一下以選擇`,
        'faceMatch.kbSwitch': `切換人臉`,
        'faceMatch.kbSelect': `選擇表演者`,
        'faceMatch.kbToggle': `切換選擇`,
        'faceMatch.kbAddInstant': `Shift+按一下立即新增`,
        'faceMatch.selectBest': `選擇最佳相符項目`,
        'faceMatch.adding': `正在新增...`,
        'faceMatch.done': `完成（{count}）`,
        'faceMatch.toast.added': `已將表演者加入 {target}。`,
        'faceMatch.toast.addError': `新增表演者失敗：{error}`,
        'faceMatch.toast.noStashbox': `未設定 stash-box。請在設定 → 中繼資料提供者中新增 stash-box 提供者以啟用表演者匯入。參見 {url}`,
        'faceMatch.toast.noProvider': `找不到名為「StashDB」的提供者。請在設定 → 中繼資料提供者中重新命名你的提供者，使其為「StashDB」，以啟用表演者匯入。`,
        'faceMatch.toast.configureProvider': `請在設定 → 中繼資料提供者中設定 stash-box 提供者，以啟用表演者匯入。`,
        'faceMatch.toast.addedMultiple': `已將 {count} 位表演者{s}加入 {target}。`,
        'sprite.title': `場景表演者`,
        'sprite.close': `關閉`,
        'sprite.foundConfirmed': `找到 {found} · 已確認 {confirmed}`,
        'sprite.confidence': `信心值`,
        'sprite.name': `名稱`,
        'sprite.hits': `命中`,
        'sprite.minConf': `最小信心值`,
        'sprite.minConfTitle': `最低信心值：{percent}%`,
        'sprite.scanning': `Visage 正在掃描…`,
        'sprite.cancel': `取消`,
        'sprite.empty': `此精靈圖中未識別出任何表演者。`,
        'sprite.detectedFaceAlt': `偵測到的人臉`,
        'sprite.spriteLabel': `精靈圖`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `在場景中`,
        'sprite.hitsCount': `{count} 次命中{s}`,
        'sprite.totalTime': `共 {time}`,
        'sprite.alreadyInScene': `已在場景中`,
        'sprite.clickToConfirm': `按一下以確認`,
        'sprite.confirmed': `已確認`,
        'sprite.supportPatreon': `在 Patreon 上支持`,
        'sprite.confirmedCount': `已確認 {total} 中的 {confirmed}`,
        'sprite.shownHint': `顯示 {shown}（共 {total} 個）· 按一下以確認 · ←→ 導覽 · Enter 確認`,
        'sprite.confirmHint': `按一下以確認 · ←→ 導覽 · Enter 確認`,
        'sprite.adding': `正在新增...`,
        'sprite.done': `完成（{count}）`,
        'gender.male': `男性`,
        'gender.female': `女性`,
        'gender.transMale': `跨性別男性`,
        'gender.transFemale': `跨性別女性`,
        'gender.nonBinary': `非二元性別`,
        'gender.intersex': `雙性人`,
        'card.excellent': `極佳相符`,
        'card.good': `良好相符`,
        'card.uncertain': `不確定的相符`,
        'card.select': `選擇 {name}`,
        'card.deselect': `取消選擇 {name}`,
        'card.openOn': `在 {source} 上開啟`,
        'search.overlayHint': `拖曳以選擇一張臉 — Enter 掃描整個畫面 — Esc 取消`,
        'search.noFaces': `該選擇中找不到人臉。請嘗試更緊密的裁剪，或按 Enter 掃描整個畫面。`,
        'search.captureMediaFail': `無法擷取媒體。請確認場景/影像已完全載入。`,
        'search.healthBanner': `人臉辨識 API 無法連線。請啟動後端並重試。`,
        'search.failed': `人臉搜尋失敗：{error}`,
        'search.fetchImageFail': `無法從 Stash 取得影像。`,
        'search.captureFail': `擷取影像失敗：{error}`,
        'search.selectFaceImage': `請在影像中選擇一張人臉。`,
        'search.captureFrameFail': `無法擷取目前影格。`,
        'search.captureFrameFail2': `擷取目前影格失敗。`,
        'search.selectFaceVideo': `請在影片播放器區域內選擇一張人臉。`,
        'search.menuItemTitle': `拖曳框選一張人臉，或按 Enter 掃描整個畫面，以在 StashDB 中搜尋相符項目`,
        'search.currentFrame': `Visage：目前影格`,
        'scene.noSprite': `此場景沒有精靈圖或預覽影片。請在場景設定中產生它們，然後重試。`,
        'scene.noFaces': `在此場景的精靈圖或預覽影片中找不到人臉或表演者。`,
        'scene.healthBanner': `人臉辨識 API 無法連線。請啟動後端並重試。`,
        'scene.failed': `場景掃描失敗：{error}`,
        'scene.menuItemTitle': `識別場景中的每個表演者（需要產生的精靈圖或預覽影片）`,
        'scene.wholeScene': `Visage：整個場景`,
        'banner.changeBackend': `更換後端`,
        'banner.dismiss': `關閉`,
        'error.dismiss': `關閉`,
        'firstRun.title': `設定你的 Visage 後端`,
        'firstRun.subtitle': `Visage 會將人臉影像傳送至後端進行識別。選擇要在哪裡執行它。`,
        'firstRun.cloud': `使用 Hugging Face 雲端`,
        'firstRun.cloudNote': `零設定。影像會被傳送至 Hugging Face 雲端服務。`,
        'firstRun.local': `使用我自己的伺服器`,
        'firstRun.localNote': `在你的電腦或網路上執行私人二進位檔。`,
        'firstRun.skip': `暫時略過`,
        'badge.local': `本機`,
        'badge.cloud': `雲端（Hugging Face）`,
        'badge.title': `Visage 後端：{label}`,
        'donate.enjoying': `喜歡 Visage？幫助它持續運作`,
        'donate.supportPatreon': `在 Patreon 上支持`,
        'frame.close': `關閉影格選擇器`,
        'frame.seekFail': `無法快轉影片播放器。`,
        'frame.selectAt': `選擇 {time} 秒處的人臉影格`,
    };

    // Romanian.
    const ro = {
        'backendSettings.title': `Setări backend`,
        'backendSettings.closeAria': `Închide setările`,
        'backendSettings.backendAria': `Setări backend`,
        'backendSettings.changeBackend': `Schimbă backend-ul`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Local`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Imaginile sunt trimise către serviciul cloud Hugging Face.`,
        'backendSettings.hintPrefix': `Vrei ca imaginile tale să rămână în rețeaua ta?`,
        'backendSettings.hintLink': `Rulează un server privat prin Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': "Politica de securitate a browserului (CSP) permite doar",
        'backendSettings.csp2': `în mod implicit. Pentru a ajunge la un backend local la altă adresă (de ex. IP-ul tău LAN), adaugă-l în`,
        'backendSettings.csp3': `lista din`,
        'backendSettings.csp4': `fișierul din folderul tău de plugin-uri Stash, altfel cererile vor fi blocate. Notă: actualizarea Visage reinstalează`,
        'backendSettings.csp5': `, deci acest lucru trebuie refăcut după fiecare actualizare.`,
        'backendSettings.testing': `Se testează conexiunea…`,
        'backendSettings.testConnection': `Testează conexiunea`,
        'backendSettings.testingShort': `Se testează…`,
        'backendSettings.cancel': `Anulează`,
        'backendSettings.save': `Salvează`,
        'backendSettings.feedback.reachable': `Conexiune reușită. Backend-ul este pregătit.`,
        'backendSettings.feedback.degraded': `Backend-ul este accesibil, dar degradat (modelele sau indexul nu sunt încărcate).`,
        'backendSettings.feedback.unreachable': `Backend-ul este inaccesibil. Verifică URL-ul și că backend-ul rulează.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `CADRUL CURENT`,
        'faceMatch.close': `Închide`,
        'faceMatch.facesSelected': `{faces} fețe găsite · {selected} selectate`,
        'faceMatch.inScene': `· {count} în scenă`,
        'faceMatch.stashboxMissing': `Niciun stash-box configurat.`,
        'faceMatch.stashboxMissingBody': ` Adaugă un furnizor stash-box în Setări → Furnizori de metadate pentru a activa importul de performeri.`,
        'faceMatch.stashboxWrongName': `Niciun furnizor "StashDB" găsit.`,
        'faceMatch.stashboxWrongNameBody': ` Importul de performeri necesită un furnizor numit "StashDB". Redenumește furnizorul în Setări → Furnizori de metadate.`,
        'faceMatch.learnMore': `Află mai multe.`,
        'faceMatch.scanning': `Se scanează • recunoaștere facială…`,
        'faceMatch.faceAlt': `Față {index}`,
        'faceMatch.minConf': `Min. conf.`,
        'faceMatch.minConfTitle': `Încredere minimă: {percent}%`,
        'faceMatch.detected': `Detectat`,
        'faceMatch.detectedFaceAlt': `Față detectată`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Susține pe Patreon`,
        'faceMatch.ofSelected': `{selected} din {total} selectate`,
        'faceMatch.allInScene': `{total} fețe găsite · toate în scenă`,
        'faceMatch.clickToSelect': `{total} fețe găsite · faceți clic pentru a selecta`,
        'faceMatch.kbSwitch': `Schimbă fețele`,
        'faceMatch.kbSelect': `Selectează performeri`,
        'faceMatch.kbToggle': `Comută selecția`,
        'faceMatch.kbAddInstant': `Shift+clic pentru a adăuga instant`,
        'faceMatch.selectBest': `Selectează cele mai bune potriviri`,
        'faceMatch.adding': `Se adaugă...`,
        'faceMatch.done': `Gata ({count})`,
        'faceMatch.toast.added': `Performer adăugat în {target}.`,
        'faceMatch.toast.addError': `Nu s-a reușit adăugarea performerului: {error}`,
        'faceMatch.toast.noStashbox': `Niciun stash-box configurat. Adaugă un furnizor stash-box în Setări → Furnizori de metadate pentru a activa importul de performeri. Vezi {url}`,
        'faceMatch.toast.noProvider': `Niciun furnizor numit "StashDB" găsit. Redenumește furnizorul în "StashDB" în Setări → Furnizori de metadate pentru a activa importul de performeri.`,
        'faceMatch.toast.configureProvider': `Configurează un furnizor stash-box în Setări → Furnizori de metadate pentru a activa importul de performeri.`,
        'faceMatch.toast.addedMultiple': `S-au adăugat {count} performeri în {target}.`,
        'sprite.title': `PERFORMERI DIN SCENĂ`,
        'sprite.close': `Închide`,
        'sprite.foundConfirmed': `{found} găsite · {confirmed} confirmate`,
        'sprite.confidence': `încredere`,
        'sprite.name': `nume`,
        'sprite.hits': `potriviri`,
        'sprite.minConf': `Min. conf.`,
        'sprite.minConfTitle': `Încredere minimă: {percent}%`,
        'sprite.scanning': `Visage scanează…`,
        'sprite.cancel': `Anulează`,
        'sprite.empty': `Niciun performer identificat în acest sprite.`,
        'sprite.detectedFaceAlt': `Față detectată`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `În scenă`,
        'sprite.hitsCount': `{count} potriviri`,
        'sprite.totalTime': `{time} total`,
        'sprite.alreadyInScene': `Deja în scenă`,
        'sprite.clickToConfirm': `Faceți clic pentru a confirma`,
        'sprite.confirmed': `Confirmat`,
        'sprite.supportPatreon': `Susține pe Patreon`,
        'sprite.confirmedCount': `{confirmed} din {total} confirmate`,
        'sprite.shownHint': `{shown} afișate ({total} total) · faceți clic pentru a confirma · ←→ navigare · Enter confirmă`,
        'sprite.confirmHint': `Faceți clic pentru a confirma · ←→ navigare · Enter confirmă`,
        'sprite.adding': `Se adaugă...`,
        'sprite.done': `Gata ({count})`,
        'gender.male': `Bărbat`,
        'gender.female': `Femeie`,
        'gender.transMale': `Bărbat trans`,
        'gender.transFemale': `Femeie trans`,
        'gender.nonBinary': `Non-binar`,
        'gender.intersex': `Intersex`,
        'card.excellent': `Potrivire excelentă`,
        'card.good': `Potrivire bună`,
        'card.uncertain': `Potrivire incertă`,
        'card.select': `Selectează {name}`,
        'card.deselect': `Deselectează {name}`,
        'card.openOn': `Deschide pe {source}`,
        'search.overlayHint': `Trageți pentru a selecta o față — Enter pentru a scana întregul cadru — Esc pentru a anula`,
        'search.noFaces': `Nicio față găsită în această selecție. Încearcă o decupare mai strânsă sau apasă Enter pentru a scana întregul cadru.`,
        'search.captureMediaFail': `Nu s-a putut captura media. Asigură-te că scena/imaginea este complet încărcată.`,
        'search.healthBanner': `API-ul de recunoaștere facială nu este accesibil. Pornește backend-ul și încearcă din nou.`,
        'search.failed': `Căutarea feței a eșuat: {error}`,
        'search.fetchImageFail': `Nu s-a putut prelua imaginea din Stash.`,
        'search.captureFail': `Nu s-a reușit capturarea imaginii: {error}`,
        'search.selectFaceImage': `Selectează o față în imagine.`,
        'search.captureFrameFail': `Nu s-a putut captura cadrul curent.`,
        'search.captureFrameFail2': `Nu s-a reușit capturarea cadrului curent.`,
        'search.selectFaceVideo': `Selectează o față în zona playerului video.`,
        'search.menuItemTitle': `Trageți o casetă în jurul unei fețe, sau apăsați Enter pentru a scana întregul cadru, pentru a căuta potriviri în StashDB`,
        'search.currentFrame': `Visage: Cadrul curent`,
        'scene.noSprite': `Nu s-a găsit nicio foaie de sprite sau video de previzualizare pentru această scenă. Generează-le în Setările scenei, apoi încearcă din nou.`,
        'scene.noFaces': `Nu s-au găsit fețe sau performeri în foaia de sprite sau video-ul de previzualizare al acestei scene.`,
        'scene.healthBanner': `API-ul de recunoaștere facială nu este accesibil. Pornește backend-ul și încearcă din nou.`,
        'scene.failed': `Scanarea scenei a eșuat: {error}`,
        'scene.menuItemTitle': `Identifică fiecare performer din scenă (necesită o foaie de sprite generată sau un video de previzualizare)`,
        'scene.wholeScene': `Visage: Toată scena`,
        'banner.changeBackend': `Schimbă backend-ul`,
        'banner.dismiss': `Închide`,
        'error.dismiss': `Închide`,
        'firstRun.title': `Configurează backend-ul Visage`,
        'firstRun.subtitle': `Visage trimite imagini cu fețe către un backend pentru recunoaștere. Alege unde să-l rulezi.`,
        'firstRun.cloud': `Folosește cloud Hugging Face`,
        'firstRun.cloudNote': `Fără configurare. Imaginile sunt trimise către serviciul cloud Hugging Face.`,
        'firstRun.local': `Folosește propriul server`,
        'firstRun.localNote': `Rulează binarul privat pe propria mașină sau rețea.`,
        'firstRun.skip': `Sari pentru acum`,
        'badge.local': `Local`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Backend Visage: {label}`,
        'donate.enjoying': `Îți place Visage? Ajută să rămână în viață`,
        'donate.supportPatreon': `Susține pe Patreon`,
        'frame.close': `Închide selectorul de cadru`,
        'frame.seekFail': `Nu s-a reușit căutarea în playerul video.`,
        'frame.selectAt': `Selectează cadrul feței la {time}s`,
    };

    const sk = {
        'backendSettings.title': `Nastavenia backendu`,
        'backendSettings.closeAria': `Zavrieť nastavenia`,
        'backendSettings.backendAria': `Nastavenia backendu`,
        'backendSettings.changeBackend': `Zmeniť backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Lokálny`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Obrázky sa odosielajú do cloudovej služby Hugging Face.`,
        'backendSettings.hintPrefix': `Chcete, aby vaše obrázky zostali vo vašej sieti?`,
        'backendSettings.hintLink': `Spustite súkromný server cez Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `Bezpečnostná politika prehliadača (CSP) v predvolenom nastavení povoľuje iba`,
        'backendSettings.csp2': `. Ak sa chcete dostať k lokálnemu backendu na inej adrese (napr. IP vašej LAN), pridajte ju do`,
        'backendSettings.csp3': `zoznamu v`,
        'backendSettings.csp4': `súbore v priečinku pluginov Stash, inak budú požiadavky zablokované. Poznámka: aktualizácia Visage preinštaluje`,
        'backendSettings.csp5': `, takže to musíte vykonať znova po každej aktualizácii.`,
        'backendSettings.testing': `Testovanie pripojenia…`,
        'backendSettings.testConnection': `Otestovať pripojenie`,
        'backendSettings.testingShort': `Testovanie…`,
        'backendSettings.cancel': `Zrušiť`,
        'backendSettings.save': `Uložiť`,
        'backendSettings.feedback.reachable': `Pripojenie úspešné. Backend je pripravený.`,
        'backendSettings.feedback.degraded': `Backend dosiahnuteľný, ale degradovaný (modely alebo index nie sú načítané).`,
        'backendSettings.feedback.unreachable': `Backend je nedosiahnuteľný. Skontrolujte URL a uistite sa, že backend beží.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `AKTUÁLNY SNÍMOK`,
        'faceMatch.close': `Zavrieť`,
        'faceMatch.facesSelected': `Nájdených tvárí: {faces} · vybratých: {selected}`,
        'faceMatch.inScene': `· {count} v scéne`,
        'faceMatch.stashboxMissing': `Nie je nakonfigurovaný stash-box.`,
        'faceMatch.stashboxMissingBody': ` Pridajte poskytovateľa stash-box v Settings → Metadata Providers, aby ste povolili import performerov.`,
        'faceMatch.stashboxWrongName': `Poskytovateľ "StashDB" nebol nájdený.`,
        'faceMatch.stashboxWrongNameBody': ` Import performerov vyžaduje poskytovateľa s názvom "StashDB". Premenujte poskytovateľa v Settings → Metadata Providers.`,
        'faceMatch.learnMore': `Zistiť viac.`,
        'faceMatch.scanning': `Skenovanie • rozpoznávanie tvárí…`,
        'faceMatch.faceAlt': `Tvár {index}`,
        'faceMatch.minConf': `Min. ist.`,
        'faceMatch.minConfTitle': `Minimálna istota: {percent}%`,
        'faceMatch.detected': `Zistené`,
        'faceMatch.detectedFaceAlt': `Zistená tvár`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Podporiť na Patreon`,
        'faceMatch.ofSelected': `Vybratých {selected} z {total}`,
        'faceMatch.allInScene': `Nájdených tvárí: {total} · všetky v scéne`,
        'faceMatch.clickToSelect': `Nájdených tvárí: {total} · kliknite pre výber`,
        'faceMatch.kbSwitch': `Prepínanie tvárí`,
        'faceMatch.kbSelect': `Výber performerov`,
        'faceMatch.kbToggle': `Prepínať výber`,
        'faceMatch.kbAddInstant': `Shift+klik pre okamžité pridanie`,
        'faceMatch.selectBest': `Vybrať najlepšie zhody`,
        'faceMatch.adding': `Pridávanie...`,
        'faceMatch.done': `Hotovo ({count})`,
        'faceMatch.toast.added': `Performer bol pridaný do {target}.`,
        'faceMatch.toast.addError': `Nepodarilo sa pridať performera: {error}`,
        'faceMatch.toast.noStashbox': `Nie je nakonfigurovaný stash-box. Pridajte poskytovateľa stash-box v Settings → Metadata Providers, aby ste povolili import performerov. Pozri {url}`,
        'faceMatch.toast.noProvider': `Poskytovateľ "StashDB" nebol nájdený. Premenujte poskytovateľa na "StashDB" v Settings → Metadata Providers, aby ste povolili import performerov.`,
        'faceMatch.toast.configureProvider': `Nakonfigurujte poskytovateľa stash-box v Settings → Metadata Providers, aby ste povolili import performerov.`,
        'faceMatch.toast.addedMultiple': `Pridaní performeri: {count} do {target}.`,
        'sprite.title': `PERFORMERI SCÉNY`,
        'sprite.close': `Zavrieť`,
        'sprite.foundConfirmed': `Nájdených: {found} · potvrdených: {confirmed}`,
        'sprite.confidence': `istota`,
        'sprite.name': `meno`,
        'sprite.hits': `zhody`,
        'sprite.minConf': `Min. ist.`,
        'sprite.minConfTitle': `Minimálna istota: {percent}%`,
        'sprite.scanning': `Skenovanie Visage…`,
        'sprite.cancel': `Zrušiť`,
        'sprite.empty': `V tomto sprite neboli identifikovaní žiadni performeri.`,
        'sprite.detectedFaceAlt': `Zistená tvár`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `V scéne`,
        'sprite.hitsCount': `Zhôd: {count}`,
        'sprite.totalTime': `Spolu {time}`,
        'sprite.alreadyInScene': `Už v scéne`,
        'sprite.clickToConfirm': `Kliknite pre potvrdenie`,
        'sprite.confirmed': `Potvrdené`,
        'sprite.supportPatreon': `Podporiť na Patreon`,
        'sprite.confirmedCount': `Potvrdených {confirmed} z {total}`,
        'sprite.shownHint': `Zobrazených: {shown} (spolu {total}) · kliknite pre potvrdenie · ←→ navigácia · Enter potvrdenie`,
        'sprite.confirmHint': `Kliknite pre potvrdenie · ←→ navigácia · Enter potvrdenie`,
        'sprite.adding': `Pridávanie...`,
        'sprite.done': `Hotovo ({count})`,
        'gender.male': `Muž`,
        'gender.female': `Žena`,
        'gender.transMale': `Transgender muž`,
        'gender.transFemale': `Transgender žena`,
        'gender.nonBinary': `Ne-binárny`,
        'gender.intersex': `Intersex`,
        'card.excellent': `Výborná zhoda`,
        'card.good': `Dobrá zhoda`,
        'card.uncertain': `Neistá zhoda`,
        'card.select': `Vybrať {name}`,
        'card.deselect': `Zrušiť výber {name}`,
        'card.openOn': `Otvoriť na {source}`,
        'search.overlayHint': `Pretiahnite pre výber tváre — Enter pre skenovanie celého snímku — Esc pre zrušenie`,
        'search.noFaces': `Vo vybranej oblasti neboli nájdené žiadne tváre. Skúste užší orez alebo stlačte Enter pre skenovanie celého snímku.`,
        'search.captureMediaFail': `Nepodarilo sa zachytiť médiá. Uistite sa, že scéna/obrázok je plne načítaný.`,
        'search.healthBanner': `API pre rozpoznávanie tvárí je nedosiahnuteľné. Spustite backend a skúste to znova.`,
        'search.failed': `Hľadanie tváre zlyhalo: {error}`,
        'search.fetchImageFail': `Nepodarilo sa načítať obrázok zo Stash.`,
        'search.captureFail': `Nepodarilo sa zachytiť obrázok: {error}`,
        'search.selectFaceImage': `Vyberte tvár v obrázku.`,
        'search.captureFrameFail': `Nepodarilo sa zachytiť aktuálny snímok.`,
        'search.captureFrameFail2': `Chyba pri zachytení aktuálneho snímku.`,
        'search.selectFaceVideo': `Vyberte tvár v oblasti prehrávača videa.`,
        'search.menuItemTitle': `Pretiahnite rámček okolo tváre alebo stlačte Enter pre skenovanie celého snímku, aby ste vyhľadali zhody v StashDB`,
        'search.currentFrame': `Visage: aktuálny snímok`,
        'scene.noSprite': `Pre túto scénu sa nenašiel žiadny sprite list ani náhľadové video. Vygenerujte ich v nastaveniach scény a skúste to znova.`,
        'scene.noFaces': `V sprite liste alebo náhľadovom videu tejto scény sa nenašli žiadne tváre ani performeri.`,
        'scene.healthBanner': `API pre rozpoznávanie tvárí je nedosiahnuteľné. Spustite backend a skúste to znova.`,
        'scene.failed': `Skenovanie scény zlyhalo: {error}`,
        'scene.menuItemTitle': `Identifikujte každého performera v scéne (vyžaduje vygenerovaný sprite list alebo náhľadové video)`,
        'scene.wholeScene': `Visage: celá scéna`,
        'banner.changeBackend': `Zmeniť backend`,
        'banner.dismiss': `Zavrieť`,
        'error.dismiss': `Zavrieť`,
        'firstRun.title': `Nastavte backend Visage`,
        'firstRun.subtitle': `Visage odosiela obrázky tvárí do backendu na rozpoznanie. Vyberte, kde ho spustiť.`,
        'firstRun.cloud': `Použiť cloud Hugging Face`,
        'firstRun.cloudNote': `Bez nastavovania. Obrázky sa odosielajú do cloudovej služby Hugging Face.`,
        'firstRun.local': `Použiť vlastný server`,
        'firstRun.localNote': `Spustite súkromný binárny súbor na vlastnom počítači alebo v sieti.`,
        'firstRun.skip': `Zatiaľ preskočiť`,
        'badge.local': `Lokálny`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Backend Visage: {label}`,
        'donate.enjoying': `Páči sa vám Visage? Pomôžte ho udržať`,
        'donate.supportPatreon': `Podporiť na Patreon`,
        'frame.close': `Zavrieť výber snímku`,
        'frame.seekFail': `Nepodarilo sa pretočiť prehrávač videa.`,
        'frame.selectAt': `Vybrať snímok tváre v {time} s`,
    };

    const pl = {
        'backendSettings.title': `Ustawienia backendu`,
        'backendSettings.closeAria': `Zamknij ustawienia`,
        'backendSettings.backendAria': `Ustawienia backendu`,
        'backendSettings.changeBackend': `Zmień backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Lokalny`,
        'backendSettings.cloud': `Chmura (Hugging Face)`,
        'backendSettings.cloudNote': `Obrazy są wysyłane do usługi w chmurze Hugging Face.`,
        'backendSettings.hintPrefix': `Chcesz, aby Twoje obrazy pozostały w Twojej sieci?`,
        'backendSettings.hintLink': `Uruchom prywatny serwer przez Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `Polityka bezpieczeństwa przeglądarki (CSP) domyślnie zezwala tylko na`,
        'backendSettings.csp2': `. Aby uzyskać dostęp do lokalnego backendu na innym adresie (np. IP Twojej sieci LAN), dodaj go do`,
        'backendSettings.csp3': `listy w`,
        'backendSettings.csp4': `pliku w folderze wtyczek Stash, w przeciwnym razie żądania zostaną zablokowane. Uwaga: aktualizacja Visage ponownie instaluje`,
        'backendSettings.csp5': `, więc należy to powtórzyć po każdej aktualizacji.`,
        'backendSettings.testing': `Testowanie połączenia…`,
        'backendSettings.testConnection': `Przetestuj połączenie`,
        'backendSettings.testingShort': `Testowanie…`,
        'backendSettings.cancel': `Anuluj`,
        'backendSettings.save': `Zapisz`,
        'backendSettings.feedback.reachable': `Połączenie udane. Backend jest gotowy.`,
        'backendSettings.feedback.degraded': `Backend osiągalny, ale zdegradowany (modele lub indeks nie zostały załadowane).`,
        'backendSettings.feedback.unreachable': `Backend nieosiągalny. Sprawdź URL i upewnij się, że backend działa.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `AKTUALNA KLATKA`,
        'faceMatch.close': `Zamknij`,
        'faceMatch.facesSelected': `Znaleziono twarzy: {faces} · wybrano: {selected}`,
        'faceMatch.inScene': `· {count} w scenie`,
        'faceMatch.stashboxMissing': `Brak skonfigurowanego stash-box.`,
        'faceMatch.stashboxMissingBody': ` Dodaj dostawcę stash-box w Settings → Metadata Providers, aby włączyć import wykonawców.`,
        'faceMatch.stashboxWrongName': `Nie znaleziono dostawcy "StashDB".`,
        'faceMatch.stashboxWrongNameBody': ` Import wykonawców wymaga dostawcy o nazwie "StashDB". Zmień nazwę dostawcy w Settings → Metadata Providers.`,
        'faceMatch.learnMore': `Dowiedz się więcej.`,
        'faceMatch.scanning': `Skanowanie • rozpoznawanie twarzy…`,
        'faceMatch.faceAlt': `Twarz {index}`,
        'faceMatch.minConf': `Min. pew.`,
        'faceMatch.minConfTitle': `Minimalna pewność: {percent}%`,
        'faceMatch.detected': `Wykryto`,
        'faceMatch.detectedFaceAlt': `Wykryta twarz`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Wesprzyj na Patreon`,
        'faceMatch.ofSelected': `Wybrano {selected} z {total}`,
        'faceMatch.allInScene': `Znaleziono twarzy: {total} · wszystkie w scenie`,
        'faceMatch.clickToSelect': `Znaleziono twarzy: {total} · kliknij, aby wybrać`,
        'faceMatch.kbSwitch': `Przełączanie twarzy`,
        'faceMatch.kbSelect': `Wybór wykonawców`,
        'faceMatch.kbToggle': `Przełącz wybór`,
        'faceMatch.kbAddInstant': `Shift+klik, aby dodać natychmiast`,
        'faceMatch.selectBest': `Wybierz najlepsze dopasowania`,
        'faceMatch.adding': `Dodawanie...`,
        'faceMatch.done': `Gotowe ({count})`,
        'faceMatch.toast.added': `Dodano wykonawcę do {target}.`,
        'faceMatch.toast.addError': `Nie udało się dodać wykonawcy: {error}`,
        'faceMatch.toast.noStashbox': `Brak skonfigurowanego stash-box. Dodaj dostawcę stash-box w Settings → Metadata Providers, aby włączyć import wykonawców. Zobacz {url}`,
        'faceMatch.toast.noProvider': `Nie znaleziono dostawcy "StashDB". Zmień nazwę dostawcy na "StashDB" w Settings → Metadata Providers, aby włączyć import wykonawców.`,
        'faceMatch.toast.configureProvider': `Skonfiguruj dostawcę stash-box w Settings → Metadata Providers, aby włączyć import wykonawców.`,
        'faceMatch.toast.addedMultiple': `Dodano wykonawców: {count} do {target}.`,
        'sprite.title': `WYKONAWCY SCENY`,
        'sprite.close': `Zamknij`,
        'sprite.foundConfirmed': `Znaleziono: {found} · potwierdzono: {confirmed}`,
        'sprite.confidence': `pewność`,
        'sprite.name': `nazwa`,
        'sprite.hits': `trafienia`,
        'sprite.minConf': `Min. pew.`,
        'sprite.minConfTitle': `Minimalna pewność: {percent}%`,
        'sprite.scanning': `Skanowanie Visage…`,
        'sprite.cancel': `Anuluj`,
        'sprite.empty': `W tym sprite nie zidentyfikowano wykonawców.`,
        'sprite.detectedFaceAlt': `Wykryta twarz`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `W scenie`,
        'sprite.hitsCount': `Trafień: {count}`,
        'sprite.totalTime': `Łącznie {time}`,
        'sprite.alreadyInScene': `Już w scenie`,
        'sprite.clickToConfirm': `Kliknij, aby potwierdzić`,
        'sprite.confirmed': `Potwierdzono`,
        'sprite.supportPatreon': `Wesprzyj na Patreon`,
        'sprite.confirmedCount': `Potwierdzono {confirmed} z {total}`,
        'sprite.shownHint': `Pokazano: {shown} (łącznie {total}) · kliknij, aby potwierdzić · ←→ nawigacja · Enter potwierdzenie`,
        'sprite.confirmHint': `Kliknij, aby potwierdzić · ←→ nawigacja · Enter potwierdzenie`,
        'sprite.adding': `Dodawanie...`,
        'sprite.done': `Gotowe ({count})`,
        'gender.male': `Mężczyzna`,
        'gender.female': `Kobieta`,
        'gender.transMale': `Transpłciowy mężczyzna`,
        'gender.transFemale': `Transpłciowa kobieta`,
        'gender.nonBinary': `Niebinarny`,
        'gender.intersex': `Interpłciowy`,
        'card.excellent': `Doskonałe dopasowanie`,
        'card.good': `Dobre dopasowanie`,
        'card.uncertain': `Niepewne dopasowanie`,
        'card.select': `Wybierz {name}`,
        'card.deselect': `Odznacz {name}`,
        'card.openOn': `Otwórz na {source}`,
        'search.overlayHint': `Przeciągnij, aby wybrać twarz — Enter, aby przeskanować całą klatkę — Esc, aby anulować`,
        'search.noFaces': `W wybranym obszarze nie znaleziono twarzy. Spróbuj ciaśniejszego kadru lub naciśnij Enter, aby przeskanować całą klatkę.`,
        'search.captureMediaFail': `Nie udało się przechwycić mediów. Upewnij się, że scena/obraz jest w pełni załadowany.`,
        'search.healthBanner': `API rozpoznawania twarzy jest nieosiągalne. Uruchom backend i spróbuj ponownie.`,
        'search.failed': `Wyszukiwanie twarzy nie powiodło się: {error}`,
        'search.fetchImageFail': `Nie udało się pobrać obrazu ze Stash.`,
        'search.captureFail': `Nie udało się przechwycić obrazu: {error}`,
        'search.selectFaceImage': `Zaznacz twarz w obrazie.`,
        'search.captureFrameFail': `Nie udało się przechwycić bieżącej klatki.`,
        'search.captureFrameFail2': `Błąd podczas przechwytywania bieżącej klatki.`,
        'search.selectFaceVideo': `Zaznacz twarz w obszarze odtwarzacza wideo.`,
        'search.menuItemTitle': `Przeciągnij ramkę wokół twarzy lub naciśnij Enter, aby przeskanować całą klatkę i wyszukać dopasowania w StashDB`,
        'search.currentFrame': `Visage: bieżąca klatka`,
        'scene.noSprite': `Nie znaleziono arkusza sprite ani wideo podglądu dla tej sceny. Wygeneruj je w ustawieniach sceny, a następnie spróbuj ponownie.`,
        'scene.noFaces': `Nie znaleziono twarzy ani wykonawców w arkuszu sprite lub wideo podglądu tej sceny.`,
        'scene.healthBanner': `API rozpoznawania twarzy jest nieosiągalne. Uruchom backend i spróbuj ponownie.`,
        'scene.failed': `Skanowanie sceny nie powiodło się: {error}`,
        'scene.menuItemTitle': `Zidentyfikuj każdego wykonawcę w scenie (wymaga wygenerowanego arkusza sprite lub wideo podglądu)`,
        'scene.wholeScene': `Visage: cała scena`,
        'banner.changeBackend': `Zmień backend`,
        'banner.dismiss': `Odrzuć`,
        'error.dismiss': `Odrzuć`,
        'firstRun.title': `Skonfiguruj backend Visage`,
        'firstRun.subtitle': `Visage wysyła obrazy twarzy do backendu w celu rozpoznania. Wybierz, gdzie go uruchomić.`,
        'firstRun.cloud': `Użyj chmury Hugging Face`,
        'firstRun.cloudNote': `Bez konfiguracji. Obrazy są wysyłane do usługi w chmurze Hugging Face.`,
        'firstRun.local': `Użyj własnego serwera`,
        'firstRun.localNote': `Uruchom prywatny plik binarny na własnej maszynie lub w sieci.`,
        'firstRun.skip': `Pomiń na razie`,
        'badge.local': `Lokalny`,
        'badge.cloud': `Chmura (Hugging Face)`,
        'badge.title': `Backend Visage: {label}`,
        'donate.enjoying': `Podoba Ci się Visage? Pomóż utrzymać go przy życiu`,
        'donate.supportPatreon': `Wesprzyj na Patreon`,
        'frame.close': `Zamknij wybór klatki`,
        'frame.seekFail': `Nie udało się przewinąć odtwarzacza wideo.`,
        'frame.selectAt': `Wybierz klatkę twarzy w {time} s`,
    };

    // Greek.
    const el = {
        'backendSettings.title': `Ρυθμίσεις backend`,
        'backendSettings.closeAria': `Κλείσιμο ρυθμίσεων`,
        'backendSettings.backendAria': `Ρυθμίσεις backend`,
        'backendSettings.changeBackend': `Αλλαγή backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Τοπικό`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Οι εικόνες αποστέλλονται στην υπηρεσία cloud του Hugging Face.`,
        'backendSettings.hintPrefix': `Θέλετε οι εικόνες σας να παραμείνουν στο δίκτυό σας;`,
        'backendSettings.hintLink': `Εκτελέστε έναν ιδιωτικό διακομιστή μέσω του Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': "Η πολιτική ασφαλείας του προγράμματος περιήγησης (CSP) επιτρέπει από προεπιλογή μόνο",
        'backendSettings.csp2': `Για να προσεγγίσετε ένα τοπικό backend σε άλλη διεύθυνση (π.χ. τη LAN IP σας), προσθέστε το στη`,
        'backendSettings.csp3': `λίστα στο`,
        'backendSettings.csp4': `αρχείο μέσα στον φάκελο plugins του Stash, διαφορετικά τα αιτήματα θα αποκλειστούν. Σημείωση: η ενημέρωση του Visage επανεγκαθιστά το`,
        'backendSettings.csp5': `, οπότε αυτό πρέπει να εφαρμοστεί ξανά μετά από κάθε ενημέρωση.`,
        'backendSettings.testing': `Έλεγχος σύνδεσης…`,
        'backendSettings.testConnection': `Έλεγχος σύνδεσης`,
        'backendSettings.testingShort': `Έλεγχος…`,
        'backendSettings.cancel': `Ακύρωση`,
        'backendSettings.save': `Αποθήκευση`,
        'backendSettings.feedback.reachable': `Η σύνδεση ήταν επιτυχής. Το backend είναι έτοιμο.`,
        'backendSettings.feedback.degraded': `Το backend είναι προσβάσιμο αλλά υποβαθμισμένο (τα μοντέλα ή το ευρετήριο δεν έχουν φορτωθεί).`,
        'backendSettings.feedback.unreachable': `Το backend δεν είναι προσβάσιμο. Ελέγξτε το URL και ότι το backend εκτελείται.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `ΤΡΕΧΟΝ ΚΑΡΕ`,
        'faceMatch.close': `Κλείσιμο`,
        'faceMatch.facesSelected': `{faces} πρόσωπα βρέθηκαν · {selected} επιλέχθηκαν`,
        'faceMatch.inScene': `· {count} στη σκηνή`,
        'faceMatch.stashboxMissing': `Δεν έχει διαμορφωθεί stash-box.`,
        'faceMatch.stashboxMissingBody': ` Προσθέστε έναν πάροχο stash-box στις Ρυθμίσεις → Πάροχοι μεταδεδομένων για να ενεργοποιήσετε την εισαγωγή ερμηνευτών.`,
        'faceMatch.stashboxWrongName': `Δεν βρέθηκε πάροχος "StashDB".`,
        'faceMatch.stashboxWrongNameBody': ` Η εισαγωγή ερμηνευτών απαιτεί έναν πάροχο με το όνομα "StashDB". Μετονομάστε τον πάροχό σας στις Ρυθμίσεις → Πάροχοι μεταδεδομένων.`,
        'faceMatch.learnMore': `Μάθετε περισσότερα.`,
        'faceMatch.scanning': `Σάρωση • αναγνώριση προσώπου…`,
        'faceMatch.faceAlt': `Πρόσωπο {index}`,
        'faceMatch.minConf': `Ελάχ. εμπ.`,
        'faceMatch.minConfTitle': `Ελάχιστη εμπιστοσύνη: {percent}%`,
        'faceMatch.detected': `Εντοπίστηκε`,
        'faceMatch.detectedFaceAlt': `Πρόσωπο που εντοπίστηκε`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Υποστήριξη στο Patreon`,
        'faceMatch.ofSelected': `{selected} από {total} επιλέχθηκαν`,
        'faceMatch.allInScene': `{total} πρόσωπα βρέθηκαν · όλα στη σκηνή`,
        'faceMatch.clickToSelect': `{total} πρόσωπα βρέθηκαν · κάντε κλικ για επιλογή`,
        'faceMatch.kbSwitch': `Αλλαγή προσώπων`,
        'faceMatch.kbSelect': `Επιλογή ερμηνευτών`,
        'faceMatch.kbToggle': `Εναλλαγή επιλογής`,
        'faceMatch.kbAddInstant': `Shift+κλικ για άμεση προσθήκη`,
        'faceMatch.selectBest': `Επιλογή καλύτερων αντιστοιχιών`,
        'faceMatch.adding': `Προσθήκη...`,
        'faceMatch.done': `Τέλος ({count})`,
        'faceMatch.toast.added': `Προστέθηκε ερμηνευτής στο {target}.`,
        'faceMatch.toast.addError': `Αποτυχία προσθήκης ερμηνευτή: {error}`,
        'faceMatch.toast.noStashbox': `Δεν έχει διαμορφωθεί stash-box. Προσθέστε έναν πάροχο stash-box στις Ρυθμίσεις → Πάροχοι μεταδεδομένων για να ενεργοποιήσετε την εισαγωγή ερμηνευτών. Δείτε {url}`,
        'faceMatch.toast.noProvider': `Δεν βρέθηκε πάροχος με το όνομα "StashDB". Μετονομάστε τον πάροχό σας σε "StashDB" στις Ρυθμίσεις → Πάροχοι μεταδεδομένων για να ενεργοποιήσετε την εισαγωγή ερμηνευτών.`,
        'faceMatch.toast.configureProvider': `Διαμορφώστε έναν πάροχο stash-box στις Ρυθμίσεις → Πάροχοι μεταδεδομένων για να ενεργοποιήσετε την εισαγωγή ερμηνευτών.`,
        'faceMatch.toast.addedMultiple': `Προστέθηκαν {count} ερμηνευτές στο {target}.`,
        'sprite.title': `ΕΡΜΗΝΕΥΤΕΣ ΣΚΗΝΗΣ`,
        'sprite.close': `Κλείσιμο`,
        'sprite.foundConfirmed': `{found} βρέθηκαν · {confirmed} επιβεβαιώθηκαν`,
        'sprite.confidence': `εμπιστοσύνη`,
        'sprite.name': `όνομα`,
        'sprite.hits': `αντιστοιχίες`,
        'sprite.minConf': `Ελάχ. εμπ.`,
        'sprite.minConfTitle': `Ελάχιστη εμπιστοσύνη: {percent}%`,
        'sprite.scanning': `Σάρωση Visage…`,
        'sprite.cancel': `Ακύρωση`,
        'sprite.empty': `Δεν ταυτοποιήθηκαν ερμηνευτές σε αυτό το sprite.`,
        'sprite.detectedFaceAlt': `Πρόσωπο που εντοπίστηκε`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `Στη σκηνή`,
        'sprite.hitsCount': `{count} αντιστοιχίες`,
        'sprite.totalTime': `{time} συνολικά`,
        'sprite.alreadyInScene': `Ήδη στη σκηνή`,
        'sprite.clickToConfirm': `Κάντε κλικ για επιβεβαίωση`,
        'sprite.confirmed': `Επιβεβαιώθηκε`,
        'sprite.supportPatreon': `Υποστήριξη στο Patreon`,
        'sprite.confirmedCount': `{confirmed} από {total} επιβεβαιώθηκαν`,
        'sprite.shownHint': `{shown} εμφανίζονται ({total} συνολικά) · κάντε κλικ για επιβεβαίωση · ←→ πλοήγηση · Enter επιβεβαίωση`,
        'sprite.confirmHint': `Κάντε κλικ για επιβεβαίωση · ←→ πλοήγηση · Enter επιβεβαίωση`,
        'sprite.adding': `Προσθήκη...`,
        'sprite.done': `Τέλος ({count})`,
        'gender.male': `Άνδρας`,
        'gender.female': `Γυναίκα`,
        'gender.transMale': `Τρανς άνδρας`,
        'gender.transFemale': `Τρανς γυναίκα`,
        'gender.nonBinary': `Μη δυαδικό`,
        'gender.intersex': `Ίντερσεξ`,
        'card.excellent': `Εξαιρετική αντιστοιχία`,
        'card.good': `Καλή αντιστοιχία`,
        'card.uncertain': `Αβέβαιη αντιστοιχία`,
        'card.select': `Επιλογή {name}`,
        'card.deselect': `Αποεπιλογή {name}`,
        'card.openOn': `Άνοιγμα στο {source}`,
        'search.overlayHint': `Σύρετε για να επιλέξετε ένα πρόσωπο — Enter για σάρωση ολόκληρου του καρέ — Esc για ακύρωση`,
        'search.noFaces': `Δεν βρέθηκαν πρόσωπα σε αυτή την επιλογή. Δοκιμάστε στενότερη περικοπή ή πατήστε Enter για σάρωση ολόκληρου του καρέ.`,
        'search.captureMediaFail': `Δεν ήταν δυνατή η λήψη του μέσου. Βεβαιωθείτε ότι η σκηνή/εικόνα έχει φορτωθεί πλήρως.`,
        'search.healthBanner': `Το API αναγνώρισης προσώπου δεν είναι προσβάσιμο. Εκκινήστε το backend και δοκιμάστε ξανά.`,
        'search.failed': `Η αναζήτηση προσώπου απέτυχε: {error}`,
        'search.fetchImageFail': `Δεν ήταν δυνατή η λήψη εικόνας από το Stash.`,
        'search.captureFail': `Αποτυχία λήψης εικόνας: {error}`,
        'search.selectFaceImage': `Επιλέξτε ένα πρόσωπο στην εικόνα.`,
        'search.captureFrameFail': `Δεν ήταν δυνατή η λήψη του τρέχοντος καρέ.`,
        'search.captureFrameFail2': `Αποτυχία λήψης του τρέχοντος καρέ.`,
        'search.selectFaceVideo': `Επιλέξτε ένα πρόσωπο στην περιοχή του προγράμματος αναπαραγωγής βίντεο.`,
        'search.menuItemTitle': `Σύρετε ένα πλαίσιο γύρω από ένα πρόσωπο ή πατήστε Enter για σάρωση ολόκληρου του καρέ, για αναζήτηση αντιστοιχιών στο StashDB`,
        'search.currentFrame': `Visage: Τρέχον καρέ`,
        'scene.noSprite': `Δεν βρέθηκε φύλλο sprite ή βίντεο προεπισκόπησης για αυτή τη σκηνή. Δημιουργήστε τα στις ρυθμίσεις Scene και δοκιμάστε ξανά.`,
        'scene.noFaces': `Δεν βρέθηκαν πρόσωπα ή ερμηνευτές στο φύλλο sprite ή στο βίντεο προεπισκόπησης αυτής της σκηνής.`,
        'scene.healthBanner': `Το API αναγνώρισης προσώπου δεν είναι προσβάσιμο. Εκκινήστε το backend και δοκιμάστε ξανά.`,
        'scene.failed': `Η σάρωση σκηνής απέτυχε: {error}`,
        'scene.menuItemTitle': `Ταυτοποιήστε κάθε ερμηνευτή στη σκηνή (απαιτεί δημιουργημένο φύλλο sprite ή βίντεο προεπισκόπησης)`,
        'scene.wholeScene': `Visage: Ολόκληρη σκηνή`,
        'banner.changeBackend': `Αλλαγή backend`,
        'banner.dismiss': `Απόρριψη`,
        'error.dismiss': `Απόρριψη`,
        'firstRun.title': `Ρυθμίστε το backend του Visage`,
        'firstRun.subtitle': `Το Visage στέλνει εικόνες προσώπων σε ένα backend για αναγνώριση. Επιλέξτε πού θα το εκτελέσετε.`,
        'firstRun.cloud': `Χρήση cloud Hugging Face`,
        'firstRun.cloudNote': `Καμία εγκατάσταση. Οι εικόνες αποστέλλονται στην υπηρεσία cloud του Hugging Face.`,
        'firstRun.local': `Χρήση του δικού μου διακομιστή`,
        'firstRun.localNote': `Εκτελέστε το ιδιωτικό δυαδικό αρχείο στη δική σας μηχανή ή δίκτυο.`,
        'firstRun.skip': `Παράβλεψη για τώρα`,
        'badge.local': `Τοπικό`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Backend Visage: {label}`,
        'donate.enjoying': `Σας αρέσει το Visage; Βοηθήστε να παραμείνει ζωντανό`,
        'donate.supportPatreon': `Υποστήριξη στο Patreon`,
        'frame.close': `Κλείσιμο επιλογέα καρέ`,
        'frame.seekFail': `Αποτυχία μετάβασης στο πρόγραμμα αναπαραγωγής βίντεο.`,
        'frame.selectAt': `Επιλογή καρέ προσώπου στο {time}s`,
    };

    const ja = {
        'backendSettings.title': `バックエンド設定`,
        'backendSettings.closeAria': `設定を閉じる`,
        'backendSettings.backendAria': `バックエンド設定`,
        'backendSettings.changeBackend': `バックエンドを変更`,
        'backendSettings.backendLabel': `バックエンド`,
        'backendSettings.local': `ローカル`,
        'backendSettings.cloud': `クラウド（Hugging Face）`,
        'backendSettings.cloudNote': `画像は Hugging Face のクラウドサービスに送信されます。`,
        'backendSettings.hintPrefix': `画像を自分のネットワーク内に留めたいですか？`,
        'backendSettings.hintLink': `Patreon でプライベートサーバーを実行`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `ブラウザのセキュリティポリシー（CSP）は既定で`,
        'backendSettings.csp2': `のみ許可します。別のアドレス（例：LAN IP）にあるローカルバックエンドに接続するには、それを`,
        'backendSettings.csp3': `内の`,
        'backendSettings.csp4': `ファイルのリストに追加してください。このファイルは Stash プラグインフォルダにあります。追加しないとリクエストはブロックされます。注意：Visage を更新すると`,
        'backendSettings.csp5': `が再インストールされるため、更新のたびに再適用する必要があります。`,
        'backendSettings.testing': `接続をテスト中…`,
        'backendSettings.testConnection': `接続をテスト`,
        'backendSettings.testingShort': `テスト中…`,
        'backendSettings.cancel': `キャンセル`,
        'backendSettings.save': `保存`,
        'backendSettings.feedback.reachable': `接続に成功しました。バックエンドは利用可能です。`,
        'backendSettings.feedback.degraded': `バックエンドには接続できますが、機能が制限されています（モデルまたはインデックスが読み込まれていません）。`,
        'backendSettings.feedback.unreachable': `バックエンドに接続できません。URL を確認し、バックエンドが実行中であることを確認してください。`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `現在のフレーム`,
        'faceMatch.close': `閉じる`,
        'faceMatch.facesSelected': `{faces} 個の顔を検出 · {selected} 個を選択`,
        'faceMatch.inScene': `· シーン内 {count}`,
        'faceMatch.stashboxMissing': `stash-box が設定されていません。`,
        'faceMatch.stashboxMissingBody': ` 設定 → メタデータプロバイダーで stash-box プロバイダーを追加すると、パフォーマーのインポートが可能になります。`,
        'faceMatch.stashboxWrongName': `「StashDB」プロバイダーが見つかりません。`,
        'faceMatch.stashboxWrongNameBody': ` パフォーマーのインポートには「StashDB」という名前のプロバイダーが必要です。設定 → メタデータプロバイダーでプロバイダーの名前を変更してください。`,
        'faceMatch.learnMore': `詳細はこちら。`,
        'faceMatch.scanning': `スキャン中 · 顔認識…`,
        'faceMatch.faceAlt': `顔 {index}`,
        'faceMatch.minConf': `最小信頼度`,
        'faceMatch.minConfTitle': `最小信頼度：{percent}%`,
        'faceMatch.detected': `検出済み`,
        'faceMatch.detectedFaceAlt': `検出された顔`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Patreon で支援する`,
        'faceMatch.ofSelected': `{total} 個中 {selected} 個を選択`,
        'faceMatch.allInScene': `{total} 個の顔を検出 · すべてシーン内`,
        'faceMatch.clickToSelect': `{total} 個の顔を検出 · クリックして選択`,
        'faceMatch.kbSwitch': `顔を切り替え`,
        'faceMatch.kbSelect': `パフォーマーを選択`,
        'faceMatch.kbToggle': `選択を切り替え`,
        'faceMatch.kbAddInstant': `Shift+クリックで即座に追加`,
        'faceMatch.selectBest': `最良の一致を選択`,
        'faceMatch.adding': `追加中...`,
        'faceMatch.done': `完了（{count}）`,
        'faceMatch.toast.added': `パフォーマーを {target} に追加しました。`,
        'faceMatch.toast.addError': `パフォーマーの追加に失敗しました：{error}`,
        'faceMatch.toast.noStashbox': `stash-box が設定されていません。設定 → メタデータプロバイダーで stash-box プロバイダーを追加すると、パフォーマーのインポートが可能になります。参照：{url}`,
        'faceMatch.toast.noProvider': `「StashDB」という名前のプロバイダーが見つかりません。設定 → メタデータプロバイダーでプロバイダーの名前を「StashDB」に変更すると、パフォーマーのインポートが可能になります。`,
        'faceMatch.toast.configureProvider': `設定 → メタデータプロバイダーで stash-box プロバイダーを設定すると、パフォーマーのインポートが可能になります。`,
        'faceMatch.toast.addedMultiple': `{count} 人のパフォーマー{s}を {target} に追加しました。`,
        'sprite.title': `シーンのパフォーマー`,
        'sprite.close': `閉じる`,
        'sprite.foundConfirmed': `{found} 件検出 · {confirmed} 件確定`,
        'sprite.confidence': `信頼度`,
        'sprite.name': `名前`,
        'sprite.hits': `ヒット`,
        'sprite.minConf': `最小信頼度`,
        'sprite.minConfTitle': `最小信頼度：{percent}%`,
        'sprite.scanning': `Visage スキャン中…`,
        'sprite.cancel': `キャンセル`,
        'sprite.empty': `このスプライトで特定されたパフォーマーはありません。`,
        'sprite.detectedFaceAlt': `検出された顔`,
        'sprite.spriteLabel': `スプライト`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `シーン内`,
        'sprite.hitsCount': `{count} ヒット{s}`,
        'sprite.totalTime': `合計 {time}`,
        'sprite.alreadyInScene': `すでにシーン内`,
        'sprite.clickToConfirm': `クリックして確定`,
        'sprite.confirmed': `確定済み`,
        'sprite.supportPatreon': `Patreon で支援する`,
        'sprite.confirmedCount': `{total} 件中 {confirmed} 件を確定`,
        'sprite.shownHint': `{shown} 件を表示（計 {total} 件）· クリックして確定 · ←→ ナビゲート · Enter で確定`,
        'sprite.confirmHint': `クリックして確定 · ←→ ナビゲート · Enter で確定`,
        'sprite.adding': `追加中...`,
        'sprite.done': `完了（{count}）`,
        'gender.male': `男性`,
        'gender.female': `女性`,
        'gender.transMale': `トランスジェンダー男性`,
        'gender.transFemale': `トランスジェンダー女性`,
        'gender.nonBinary': `ノンバイナリー`,
        'gender.intersex': `インターセックス`,
        'card.excellent': `非常に良い一致`,
        'card.good': `良い一致`,
        'card.uncertain': `不明な一致`,
        'card.select': `{name} を選択`,
        'card.deselect': `{name} の選択を解除`,
        'card.openOn': `{source} で開く`,
        'search.overlayHint': `ドラッグして顔を選択 — Enter でフレーム全体をスキャン — Esc でキャンセル`,
        'search.noFaces': `その選択範囲では顔が見つかりませんでした。より狭く切り取ってみるか、Enter を押してフレーム全体をスキャンしてください。`,
        'search.captureMediaFail': `メディアをキャプチャできませんでした。シーン/画像が完全に読み込まれていることを確認してください。`,
        'search.healthBanner': `顔認識 API に接続できません。バックエンドを起動して、もう一度お試しください。`,
        'search.failed': `顔の検索に失敗しました：{error}`,
        'search.fetchImageFail': `Stash から画像を取得できませんでした。`,
        'search.captureFail': `画像のキャプチャに失敗しました：{error}`,
        'search.selectFaceImage': `画像内の顔を選択してください。`,
        'search.captureFrameFail': `現在のフレームをキャプチャできませんでした。`,
        'search.captureFrameFail2': `現在のフレームのキャプチャに失敗しました。`,
        'search.selectFaceVideo': `ビデオプレーヤー領域内の顔を選択してください。`,
        'search.menuItemTitle': `顔の周りにボックスをドラッグするか、Enter を押してフレーム全体をスキャンし、StashDB で一致を検索します`,
        'search.currentFrame': `Visage：現在のフレーム`,
        'scene.noSprite': `このシーンにはスプライトシートまたはプレビュービデオがありません。シーン設定で生成してから、もう一度お試しください。`,
        'scene.noFaces': `このシーンのスプライトシートまたはプレビュービデオに顔やパフォーマーが見つかりませんでした。`,
        'scene.healthBanner': `顔認識 API に接続できません。バックエンドを起動して、もう一度お試しください。`,
        'scene.failed': `シーンのスキャンに失敗しました：{error}`,
        'scene.menuItemTitle': `シーン内のすべてのパフォーマーを特定します（生成されたスプライトシートまたはプレビュービデオが必要です）`,
        'scene.wholeScene': `Visage：シーン全体`,
        'banner.changeBackend': `バックエンドを変更`,
        'banner.dismiss': `閉じる`,
        'error.dismiss': `閉じる`,
        'firstRun.title': `Visage バックエンドを設定する`,
        'firstRun.subtitle': `Visage は顔画像をバックエンドに送信して認識を行います。実行場所を選択してください。`,
        'firstRun.cloud': `Hugging Face クラウドを使用`,
        'firstRun.cloudNote': `セットアップ不要。画像は Hugging Face のクラウドサービスに送信されます。`,
        'firstRun.local': `自分のサーバーを使用`,
        'firstRun.localNote': `プライベートバイナリを自分のマシンまたはネットワークで実行します。`,
        'firstRun.skip': `今はスキップ`,
        'badge.local': `ローカル`,
        'badge.cloud': `クラウド（Hugging Face）`,
        'badge.title': `Visage バックエンド：{label}`,
        'donate.enjoying': `Visage をお楽しみですか？運営の継続を支援する`,
        'donate.supportPatreon': `Patreon で支援する`,
        'frame.close': `フレームセレクターを閉じる`,
        'frame.seekFail': `ビデオプレーヤーをシークできませんでした。`,
        'frame.selectAt': `{time} 秒の顔フレームを選択`,
    };

    // Swedish.
    const sv = {
        'backendSettings.title': `Backend-inställningar`,
        'backendSettings.closeAria': `Stäng inställningar`,
        'backendSettings.backendAria': `Backend-inställningar`,
        'backendSettings.changeBackend': `Byt backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Lokal`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Bilder skickas till Hugging Face molntjänsten.`,
        'backendSettings.hintPrefix': `Vill du att dina bilder ska stanna i ditt nätverk?`,
        'backendSettings.hintLink': `Kör en privat server via Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': "Webbläsarens säkerhetspolicy (CSP) tillåter endast",
        'backendSettings.csp2': `som standard. För att nå en lokal backend på en annan adress (t.ex. din LAN-IP) måste du lägga till den i`,
        'backendSettings.csp3': `listan i`,
        'backendSettings.csp4': `-filen i din Stash plugins-mapp, annars blockeras förfrågningarna. Observera: uppdatering av Visage installerar om`,
        'backendSettings.csp5': `, så detta måste göras om efter varje uppdatering.`,
        'backendSettings.testing': `Testar anslutning…`,
        'backendSettings.testConnection': `Testa anslutning`,
        'backendSettings.testingShort': `Testar…`,
        'backendSettings.cancel': `Avbryt`,
        'backendSettings.save': `Spara`,
        'backendSettings.feedback.reachable': `Anslutningen lyckades. Backend är redo.`,
        'backendSettings.feedback.degraded': `Backend är nåbar men försämrad (modeller eller index är inte inlästa).`,
        'backendSettings.feedback.unreachable': `Backend är onåbar. Kontrollera URL:en och att backend körs.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        'faceMatch.title': `AKTUELL RUTA`,
        'faceMatch.close': `Stäng`,
        'faceMatch.facesSelected': `{faces} ansikten hittade · {selected} valda`,
        'faceMatch.inScene': `· {count} i scen`,
        'faceMatch.stashboxMissing': `Ingen stash-box konfigurerad.`,
        'faceMatch.stashboxMissingBody': ` Lägg till en stash-box-leverantör under Inställningar → Metadata-leverantörer för att aktivera performer-import.`,
        'faceMatch.stashboxWrongName': `Ingen "StashDB"-leverantör hittades.`,
        'faceMatch.stashboxWrongNameBody': ` Performer-import kräver en leverantör med namnet "StashDB". Byt namn på leverantören under Inställningar → Metadata-leverantörer.`,
        'faceMatch.learnMore': `Läs mer.`,
        'faceMatch.scanning': `Skannar • ansiktsigenkänning…`,
        'faceMatch.faceAlt': `Ansikte {index}`,
        'faceMatch.minConf': `Min. konf.`,
        'faceMatch.minConfTitle': `Minsta förtroende: {percent}%`,
        'faceMatch.detected': `Upptäckt`,
        'faceMatch.detectedFaceAlt': `Upptäckt ansikte`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Stöd på Patreon`,
        'faceMatch.ofSelected': `{selected} av {total} valda`,
        'faceMatch.allInScene': `{total} ansikten hittade · alla i scen`,
        'faceMatch.clickToSelect': `{total} ansikten hittade · klicka för att välja`,
        'faceMatch.kbSwitch': `Byt ansikten`,
        'faceMatch.kbSelect': `Välj performers`,
        'faceMatch.kbToggle': `Växla markering`,
        'faceMatch.kbAddInstant': `Shift+klick för att lägga till direkt`,
        'faceMatch.selectBest': `Välj bästa matchningar`,
        'faceMatch.adding': `Lägger till...`,
        'faceMatch.done': `Klar ({count})`,
        'faceMatch.toast.added': `Lade till performer i {target}.`,
        'faceMatch.toast.addError': `Misslyckades att lägga till performer: {error}`,
        'faceMatch.toast.noStashbox': `Ingen stash-box konfigurerad. Lägg till en stash-box-leverantör under Inställningar → Metadata-leverantörer för att aktivera performer-import. Se {url}`,
        'faceMatch.toast.noProvider': `Ingen leverantör med namnet "StashDB" hittades. Byt namn på leverantören till "StashDB" under Inställningar → Metadata-leverantörer för att aktivera performer-import.`,
        'faceMatch.toast.configureProvider': `Konfigurera en stash-box-leverantör under Inställningar → Metadata-leverantörer för att aktivera performer-import.`,
        'faceMatch.toast.addedMultiple': `Lade till {count} performers i {target}.`,
        'sprite.title': `SCEN-PERFORMERS`,
        'sprite.close': `Stäng`,
        'sprite.foundConfirmed': `{found} hittade · {confirmed} bekräftade`,
        'sprite.confidence': `förtroende`,
        'sprite.name': `namn`,
        'sprite.hits': `träffar`,
        'sprite.minConf': `Min. konf.`,
        'sprite.minConfTitle': `Minsta förtroende: {percent}%`,
        'sprite.scanning': `Visage skannar…`,
        'sprite.cancel': `Avbryt`,
        'sprite.empty': `Inga performers identifierades i denna sprite.`,
        'sprite.detectedFaceAlt': `Upptäckt ansikte`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `I scen`,
        'sprite.hitsCount': `{count} träff`,
        'sprite.totalTime': `{time} totalt`,
        'sprite.alreadyInScene': `Redan i scen`,
        'sprite.clickToConfirm': `Klicka för att bekräfta`,
        'sprite.confirmed': `Bekräftad`,
        'sprite.supportPatreon': `Stöd på Patreon`,
        'sprite.confirmedCount': `{confirmed} av {total} bekräftade`,
        'sprite.shownHint': `{shown} visade ({total} totalt) · klicka för att bekräfta · ←→ navigera · Enter bekräfta`,
        'sprite.confirmHint': `Klicka för att bekräfta · ←→ navigera · Enter bekräfta`,
        'sprite.adding': `Lägger till...`,
        'sprite.done': `Klar ({count})`,
        'gender.male': `Man`,
        'gender.female': `Kvinna`,
        'gender.transMale': `Transperson man`,
        'gender.transFemale': `Transperson kvinna`,
        'gender.nonBinary': `Icke-binär`,
        'gender.intersex': `Intersex`,
        'card.excellent': `Utmärkt matchning`,
        'card.good': `Bra matchning`,
        'card.uncertain': `Osäker matchning`,
        'card.select': `Välj {name}`,
        'card.deselect': `Avmarkera {name}`,
        'card.openOn': `Öppna på {source}`,
        'search.overlayHint': `Dra för att välja ett ansikte — Enter för att skanna hela rutan — Esc för att avbryta`,
        'search.noFaces': `Inga ansikten hittades i det valet. Prova en tätare beskärning, eller tryck Enter för att skanna hela rutan.`,
        'search.captureMediaFail': `Kunde inte fånga media. Se till att scenen/bilden är fullständigt inläst.`,
        'search.healthBanner': `Ansiktsigenkännings-API:et är inte nåbart. Starta backend och försök igen.`,
        'search.failed': `Ansiktssökning misslyckades: {error}`,
        'search.fetchImageFail': `Kunde inte hämta bild från Stash.`,
        'search.captureFail': `Kunde inte fånga bild: {error}`,
        'search.selectFaceImage': `Välj ett ansikte i bilden.`,
        'search.captureFrameFail': `Kunde inte fånga den aktuella rutan.`,
        'search.captureFrameFail2': `Misslyckades att fånga den aktuella rutan.`,
        'search.selectFaceVideo': `Välj ett ansikte i videoavspelarområdet.`,
        'search.menuItemTitle': `Dra en ruta runt ett ansikte, eller tryck Enter för att skanna hela rutan, för att söka StashDB efter matchningar`,
        'search.currentFrame': `Visage: Aktuell ruta`,
        'scene.noSprite': `Ingen sprite-ark eller förhandsvisningsvideo hittades för denna scen. Generera dem i Scene-inställningarna och försök igen.`,
        'scene.noFaces': `Inga ansikten eller performers hittades i denna scen sprite-ark eller förhandsvisningsvideo.`,
        'scene.healthBanner': `Ansiktsigenkännings-API:et är inte nåbart. Starta backend och försök igen.`,
        'scene.failed': `Scen-skanning misslyckades: {error}`,
        'scene.menuItemTitle': `Identifiera varje performer i scenen (kräver ett genererat sprite-ark eller en förhandsvisningsvideo)`,
        'scene.wholeScene': `Visage: Hela scenen`,
        'banner.changeBackend': `Byt backend`,
        'banner.dismiss': `Avvisa`,
        'error.dismiss': `Avvisa`,
        'firstRun.title': `Konfigurera din Visage-backend`,
        'firstRun.subtitle': `Visage skickar ansiktsbilder till en backend för igenkänning. Välj var den ska köras.`,
        'firstRun.cloud': `Använd Hugging Face cloud`,
        'firstRun.cloudNote': `Ingen installation. Bilder skickas till Hugging Face molntjänsten.`,
        'firstRun.local': `Använd min egen server`,
        'firstRun.localNote': `Kör den privata binären på din egen maskin eller ditt nätverk.`,
        'firstRun.skip': `Hoppa över för nu`,
        'badge.local': `Lokal`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Visage-backend: {label}`,
        'donate.enjoying': `Gillar du Visage? Hjälp till att hålla det vid liv`,
        'donate.supportPatreon': `Stöd på Patreon`,
        'frame.close': `Stäng rutväljaren`,
        'frame.seekFail': `Kunde inte söka i videoavspelaren.`,
        'frame.selectAt': `Välj ansiktsruta vid {time}s`,
    };

    // Italian. Missing keys fall back to English automatically.
    const it = {
        // ---- BackendSettings.tsx ----
        'backendSettings.title': `Impostazioni backend`,
        'backendSettings.closeAria': `Chiudi impostazioni`,
        'backendSettings.backendAria': `Impostazioni backend`,
        'backendSettings.changeBackend': `Cambia backend`,
        'backendSettings.backendLabel': `Backend`,
        'backendSettings.local': `Locale`,
        'backendSettings.cloud': `Cloud (Hugging Face)`,
        'backendSettings.cloudNote': `Le immagini vengono inviate al servizio cloud Hugging Face.`,
        'backendSettings.hintPrefix': `Vuoi che le tue immagini restino nella tua rete?`,
        'backendSettings.hintLink': `Esegui un server privato tramite Patreon`,
        'backendSettings.urlLabel': `URL`,
        'backendSettings.csp1': `La politica di sicurezza del browser (CSP) consente solo`,
        'backendSettings.csp2': `per impostazione predefinita. Per raggiungere un backend locale su un altro indirizzo (ad es. il tuo IP LAN), aggiungilo alla`,
        'backendSettings.csp3': `elenco nel file`,
        'backendSettings.csp4': `all'interno della tua cartella plugin di Stash, altrimenti le richieste verranno bloccate. Nota: aggiornare Visage reinstallerà`,
        'backendSettings.csp5': `, quindi questo va riapplicato dopo ogni aggiornamento.`,
        'backendSettings.testing': `Verifica della connessione…`,
        'backendSettings.testConnection': `Verifica connessione`,
        'backendSettings.testingShort': `Verifica…`,
        'backendSettings.cancel': `Annulla`,
        'backendSettings.save': `Salva`,
        'backendSettings.feedback.reachable': `Connessione riuscita. Il backend è pronto.`,
        'backendSettings.feedback.degraded': `Backend raggiungibile ma degradato (modelli o indice non caricati).`,
        'backendSettings.feedback.unreachable': `Backend non raggiungibile. Controlla l'URL e che il backend sia in esecuzione.`,
        // ---- Stash Sync ----
        'backendSettings.sync.title': `Stash Sync`,
        'backendSettings.sync.lastSynced': `Last synced: {time}`,
        'backendSettings.sync.neverSynced': `Never synced`,
        'backendSettings.sync.performers': `{count} performers in index`,
        'backendSettings.sync.button': `Sync`,
        'backendSettings.sync.syncing': `Syncing\u2026`,
        'backendSettings.sync.done': `Done`,
        'backendSettings.sync.alreadyRunning': `Sync already in progress`,
        'backendSettings.sync.error': `Sync failed`,
        'backendSettings.sync.connectionLost': `Connection lost`,
        // ---- FaceMatchModal.tsx ----
        'faceMatch.title': `FOTO CORRENTE`,
        'faceMatch.close': `Chiudi`,
        'faceMatch.facesSelected': `{faces} volti trovati · {selected} selezionati`,
        'faceMatch.inScene': `· {count} nella scena`,
        'faceMatch.stashboxMissing': `Nessuno stash-box configurato.`,
        'faceMatch.stashboxMissingBody': ` Aggiungi un provider stash-box in Impostazioni → Provider di metadati per attivare l'importazione dei performer.`,
        'faceMatch.stashboxWrongName': `Nessun provider chiamato "StashDB" trovato.`,
        'faceMatch.stashboxWrongNameBody': ` L'importazione dei performer richiede un provider chiamato "StashDB". Rinomina il tuo provider in Impostazioni → Provider di metadati.`,
        'faceMatch.learnMore': `Scopri di più.`,
        'faceMatch.scanning': `Scansione • riconoscimento facciale…`,
        'faceMatch.faceAlt': `Volto {index}`,
        'faceMatch.minConf': `Conf. min.`,
        'faceMatch.minConfTitle': `Confidenza minima: {percent}%`,
        'faceMatch.detected': `Rilevato`,
        'faceMatch.detectedFaceAlt': `Volto rilevato`,
        'faceMatch.vs': `vs`,
        'faceMatch.supportPatreon': `Supporta su Patreon`,
        'faceMatch.ofSelected': `{selected} di {total} selezionati`,
        'faceMatch.allInScene': `{total} volti trovati · tutti nella scena`,
        'faceMatch.clickToSelect': `{total} volti trovati · fai clic per selezionare`,
        'faceMatch.kbSwitch': `Cambia volti`,
        'faceMatch.kbSelect': `Seleziona performer`,
        'faceMatch.kbToggle': `Attiva/disattiva selezione`,
        'faceMatch.kbAddInstant': `Maiusc+clic per aggiungere all'istante`,
        'faceMatch.selectBest': `Seleziona migliori corrispondenze`,
        'faceMatch.adding': `Aggiunta...`,
        'faceMatch.done': `Fatto ({count})`,
        'faceMatch.toast.added': `Performer aggiunto alla {target}.`,
        'faceMatch.toast.addError': `Impossibile aggiungere il performer: {error}`,
        'faceMatch.toast.noStashbox': `Nessuno stash-box configurato. Aggiungi un provider stash-box in Impostazioni → Provider di metadati per attivare l'importazione dei performer. Vedi {url}`,
        'faceMatch.toast.noProvider': `Nessun provider chiamato "StashDB" trovato. Rinomina il tuo provider in "StashDB" in Impostazioni → Provider di metadati per attivare l'importazione dei performer.`,
        'faceMatch.toast.configureProvider': `Configura un provider stash-box in Impostazioni → Provider di metadati per attivare l'importazione dei performer.`,
        'faceMatch.toast.addedMultiple': `{count} performer{s} aggiunti alla {target}.`,
        // ---- SpriteResultModal.tsx ----
        'sprite.title': `PERFORMER DELLA SCENA`,
        'sprite.close': `Chiudi`,
        'sprite.foundConfirmed': `{found} trovati · {confirmed} confermati`,
        'sprite.confidence': `confidenza`,
        'sprite.name': `nome`,
        'sprite.hits': `corrispondenze`,
        'sprite.minConf': `Conf. min.`,
        'sprite.minConfTitle': `Confidenza minima: {percent}%`,
        'sprite.scanning': `Scansione Visage…`,
        'sprite.cancel': `Annulla`,
        'sprite.empty': `Nessun performer identificato in questo sprite.`,
        'sprite.detectedFaceAlt': `Volto rilevato`,
        'sprite.spriteLabel': `SPRITE`,
        'sprite.stashLabel': `STASH`,
        'sprite.vs': `vs`,
        'sprite.inScene': `Nella scena`,
        'sprite.hitsCount': `{count} corrispondenza{s}`,
        'sprite.totalTime': `{time} in totale`,
        'sprite.alreadyInScene': `Già nella scena`,
        'sprite.clickToConfirm': `Fai clic per confermare`,
        'sprite.confirmed': `Confermato`,
        'sprite.supportPatreon': `Supporta su Patreon`,
        'sprite.confirmedCount': `{confirmed} di {total} confermati`,
        'sprite.shownHint': `{shown} mostrati ({total} in totale) · fai clic per confermare · ←→ naviga · Invio conferma`,
        'sprite.confirmHint': `Fai clic per confermare · ←→ naviga · Invio conferma`,
        'sprite.adding': `Aggiunta...`,
        'sprite.done': `Fatto ({count})`,
        // ---- PerformerCard.tsx ----
        'gender.male': `Maschio`,
        'gender.female': `Femmina`,
        'gender.transMale': `Uomo transgender`,
        'gender.transFemale': `Donna transgender`,
        'gender.nonBinary': `Non binario`,
        'gender.intersex': `Intersessuale`,
        'card.excellent': `Corrispondenza eccellente`,
        'card.good': `Buona corrispondenza`,
        'card.uncertain': `Corrispondenza incerta`,
        'card.select': `Seleziona {name}`,
        'card.deselect': `Deseleziona {name}`,
        'card.openOn': `Apri su {source}`,
        // ---- FaceSearchButton.tsx ----
        'search.overlayHint': `Trascina per selezionare un volto — Invio per scansionare l'intera immagine — Esc per annullare`,
        'search.noFaces': `Nessun volto trovato in questa selezione. Prova con un ritaglio più stretto oppure premi Invio per scansionare l'intera immagine.`,
        'search.captureMediaFail': `Impossibile acquisire il media. Assicurati che la scena/l'immagine sia completamente caricata.`,
        'search.healthBanner': `L'API di riconoscimento facciale non è raggiungibile. Avvia il backend e riprova.`,
        'search.failed': `Ricerca volto non riuscita: {error}`,
        'search.fetchImageFail': `Impossibile recuperare l'immagine da Stash.`,
        'search.captureFail': `Impossibile acquisire l'immagine: {error}`,
        'search.selectFaceImage': `Seleziona un volto all'interno dell'immagine.`,
        'search.captureFrameFail': `Impossibile acquisire il fotogramma corrente.`,
        'search.captureFrameFail2': `Impossibile acquisire il fotogramma corrente.`,
        'search.selectFaceVideo': `Seleziona un volto all'interno dell'area del lettore video.`,
        'search.menuItemTitle': `Trascina una casella attorno a un volto oppure premi Invio per scansionare l'intera immagine, per cercare corrispondenze in StashDB`,
        'search.currentFrame': `Visage: Fotogramma corrente`,
        // ---- SceneScanButton.tsx ----
        'scene.noSprite': `Nessuno sprite sheet o video di anteprima trovato per questa scena. Generali nelle impostazioni della scena, poi riprova.`,
        'scene.noFaces': `Nessun volto o performer trovato nello sprite sheet o nel video di anteprima di questa scena.`,
        'scene.healthBanner': `L'API di riconoscimento facciale non è raggiungibile. Avvia il backend e riprova.`,
        'scene.failed': `Scansione della scena non riuscita: {error}`,
        'scene.menuItemTitle': `Identifica ogni performer nella scena (richiede uno sprite sheet o un video di anteprima generati)`,
        'scene.wholeScene': `Visage: Intera scena`,
        // ---- BackendHealthBanner.tsx ----
        'banner.changeBackend': `Cambia backend`,
        'banner.dismiss': `Ignora`,
        // ---- ErrorDialog.tsx ----
        'error.dismiss': `Ignora`,
        // ---- FirstRunDialog.tsx ----
        'firstRun.title': `Configura il tuo backend Visage`,
        'firstRun.subtitle': `Visage invia immagini di volti a un backend per il riconoscimento. Scegli dove eseguirlo.`,
        'firstRun.cloud': `Usa il cloud Hugging Face`,
        'firstRun.cloudNote': `Nessuna configurazione. Le immagini vengono inviate al servizio cloud Hugging Face.`,
        'firstRun.local': `Usa il mio server`,
        'firstRun.localNote': `Esegui il binario privato sulla tua macchina o rete.`,
        'firstRun.skip': `Salta per ora`,
        // ---- BackendBadge.tsx ----
        'badge.local': `Locale`,
        'badge.cloud': `Cloud (Hugging Face)`,
        'badge.title': `Backend Visage: {label}`,
        // ---- DonateFooter.tsx ----
        'donate.enjoying': `Ti piace Visage? Aiuta a mantenerlo vivo`,
        'donate.supportPatreon': `Supporta su Patreon`,
        // ---- FaceFrameSelector.tsx ----
        'frame.close': `Chiudi selettore fotogramma`,
        'frame.seekFail': `Impossibile cercare nel lettore video.`,
        'frame.selectAt': `Seleziona il volto a {time}s`,
    };

    registerLocale('en', en);
    registerLocale('nl-NL', nl);
    registerLocale('he-IL', he);
    registerLocale('lt-LT', lt);
    registerLocale('es-ES', es);
    registerLocale('ar', ar);
    registerLocale('fr-FR', fr);
    registerLocale('nn-NO', nn);
    registerLocale('ko-KR', ko);
    registerLocale('zh-CN', zhCn);
    registerLocale('bg-BG', bg);
    registerLocale('ru-RU', ru);
    registerLocale('id-ID', id);
    registerLocale('cs-CZ', cs);
    registerLocale('hr-HR', hr);
    registerLocale('th-TH', th);
    registerLocale('pt-BR', pt);
    registerLocale('da-DK', da);
    registerLocale('hu-HU', hu);
    registerLocale('uk-UA', uk);
    registerLocale('de-DE', de);
    registerLocale('fi-FI', fi);
    registerLocale('lv-LV', lv);
    registerLocale('vi-VN', vi);
    registerLocale('et-EE', et);
    registerLocale('nb-NO', nb);
    registerLocale('tr-TR', tr);
    registerLocale('zh-TW', zhTw);
    registerLocale('ro-RO', ro);
    registerLocale('sk-SK', sk);
    registerLocale('pl-PL', pl);
    registerLocale('el-GR', el);
    registerLocale('ja-JP', ja);
    registerLocale('sv-SE', sv);
    registerLocale('it-IT', it);

    const { React, ReactDOM } = PluginApi;
    function extractIdFromProps(props) {
        var _a, _b;
        if (props === null || props === void 0 ? void 0 : props.id)
            return String(props.id);
        if ((_b = (_a = props === null || props === void 0 ? void 0 : props.match) === null || _a === void 0 ? void 0 : _a.params) === null || _b === void 0 ? void 0 : _b.id)
            return props.match.params.id;
        const match = window.location.pathname.match(/\/(scenes|images)\/(\d+)/);
        return match ? match[2] : null;
    }
    function useMenuPortal(renderContent) {
        const [anchor, setAnchor] = React.useState(null);
        React.useEffect(() => {
            function tryInject() {
                for (const menu of document.querySelectorAll('.dropdown-menu')) {
                    if (!isOpsMenu(menu))
                        continue;
                    if (menu.querySelector('.visage-menu-root'))
                        continue;
                    const div = injectMenu(menu);
                    div.className = 'visage-menu-root';
                    setAnchor(div);
                    return true;
                }
                return false;
            }
            if (tryInject())
                return;
            const poll = setInterval(() => {
                if (tryInject()) {
                    clearInterval(poll);
                    obs.disconnect();
                }
            }, 300);
            const obs = new MutationObserver(() => {
                if (tryInject()) {
                    clearInterval(poll);
                    obs.disconnect();
                }
            });
            obs.observe(document.body, { childList: true, subtree: true });
            return () => { clearInterval(poll); obs.disconnect(); };
        }, []);
        if (!anchor)
            return null;
        return ReactDOM.createPortal(renderContent(anchor), anchor);
    }
    function OperationsMenuPortal() {
        return useMenuPortal((anchor) => React.createElement(React.Fragment, null, React.createElement(FaceSearchButton, { menuItem: true }), React.createElement(SceneScanButton, { menuItem: true })));
    }
    function ImageOperationsMenuPortal() {
        return useMenuPortal((anchor) => React.createElement(FaceSearchButton, { menuItem: true }));
    }
    function ModalRoot() {
        const { state, openSettings, closeSettings } = useVisage();
        return ReactDOM.createPortal(React.createElement(React.Fragment, null, state.showMatchModal && React.createElement(FaceMatchModal, null), state.showSpriteModal && React.createElement(SpriteResultModal, null), React.createElement(ErrorDialog, null), React.createElement(BackendHealthBanner, { onOpen: openSettings }), state.settingsOpen && React.createElement(BackendSettings, { onClose: closeSettings })), document.body);
    }
    const ONBOARDED_KEY = 'visage_onboarded';
    function isOnboarded() {
        try {
            return !!localStorage.getItem(ONBOARDED_KEY);
        }
        catch (_a) {
            return true;
        }
    }
    function markOnboarded() {
        try {
            localStorage.setItem(ONBOARDED_KEY, '1');
        }
        catch ( /* ignore */_a) { /* ignore */ }
    }
    function FirstRunDialogRoot() {
        const [show, setShow] = React.useState(() => !isOnboarded());
        if (!show)
            return null;
        return ReactDOM.createPortal(React.createElement(FirstRunDialog, { onComplete: () => { markOnboarded(); setShow(false); } }), document.body);
    }
    function ThemeDetector() {
        React.useEffect(() => {
            function poll() {
                const root = getComputedStyle(document.documentElement);
                const dim = root.getPropertyValue('--color-dim').trim();
                if (dim) {
                    const themeVars = detectTheme();
                    for (const [key, value] of Object.entries(themeVars)) {
                        document.documentElement.style.setProperty(key, value);
                    }
                    return true;
                }
                return false;
            }
            // Delay initial check slightly to let external theme CSS load
            const initialCheck = setTimeout(poll, 200);
            const interval = setInterval(() => {
                if (poll())
                    clearInterval(interval);
            }, 600);
            const safety = setTimeout(() => clearInterval(interval), 15000);
            return () => {
                clearTimeout(initialCheck);
                clearInterval(interval);
                clearTimeout(safety);
            };
        }, []);
        return null;
    }
    function ImageVisageWrapper({ scenarioId }) {
        return React.createElement(VisageProvider, { scenario: 'images', scenarioId }, React.createElement(ThemeDetector, null), React.createElement(ImageOperationsMenuPortal, null), React.createElement(ModalRoot, null));
    }
    let imageContainer = null;
    function mountImage(scenarioId) {
        if (imageContainer) {
            ReactDOM.unmountComponentAtNode(imageContainer);
            imageContainer.remove();
        }
        imageContainer = document.createElement('div');
        imageContainer.id = 'visage-image-root';
        imageContainer.style.display = 'contents';
        document.body.appendChild(imageContainer);
        ReactDOM.render(React.createElement(ImageVisageWrapper, { scenarioId }), imageContainer);
    }
    function cleanup() {
        if (imageContainer) {
            ReactDOM.unmountComponentAtNode(imageContainer);
            imageContainer.remove();
            imageContainer = null;
        }
    }
    PluginApi.patch.after('ScenePage', (props, _, result) => {
        const scenarioId = extractIdFromProps(props);
        if (!scenarioId)
            return result;
        return React.createElement(VisageProvider, { scenario: 'scenes', scenarioId }, React.createElement(ThemeDetector, null), result, React.createElement(OperationsMenuPortal, null), React.createElement(ModalRoot, null));
    });
    PluginApi.Event.addEventListener('stash:page:image', (e) => {
        var _a, _b, _c;
        const pathname = ((_c = (_b = (_a = e.detail) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.location) === null || _c === void 0 ? void 0 : _c.pathname) || '';
        const match = pathname.match(/\/images\/(\d+)/);
        if (match) {
            requestAnimationFrame(() => mountImage(match[1]));
        }
    });
    PluginApi.Event.addEventListener('stash:location', (e) => {
        var _a, _b, _c;
        const pathname = ((_c = (_b = (_a = e.detail) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.location) === null || _c === void 0 ? void 0 : _c.pathname) || '';
        const imageMatch = pathname.match(/\/images\/(\d+)/);
        if (imageMatch) {
            requestAnimationFrame(() => mountImage(imageMatch[1]));
        }
        else {
            cleanup();
        }
    });
    const initialPath = window.location.pathname;
    const imageMatch = initialPath.match(/\/images\/(\d+)/);
    if (imageMatch) {
        requestAnimationFrame(() => mountImage(imageMatch[1]));
    }
    const firstRunRoot = document.createElement('div');
    firstRunRoot.id = 'visage-firstrun-root';
    firstRunRoot.style.display = 'contents';
    document.body.appendChild(firstRunRoot);
    if (typeof (ReactDOM === null || ReactDOM === void 0 ? void 0 : ReactDOM.render) === 'function') {
        ReactDOM.render(React.createElement(FirstRunDialogRoot, null), firstRunRoot);
    }

})();
