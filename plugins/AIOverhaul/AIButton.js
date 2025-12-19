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
const showFullDetailsModal = (payload, type = "success") => {
    const modalId = `ai-details-modal-${Date.now()}`;
    const overlay = document.createElement("div");
    overlay.id = modalId;
    overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 20000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease-out;
  `;
    const modal = document.createElement("div");
    modal.style.cssText = `
    background: #1a1a1a;
    border: 1px solid ${type === "success" ? "rgba(72, 180, 97, 0.3)" : "rgba(220, 53, 69, 0.3)"};
    border-radius: 8px;
    padding: 24px;
    max-width: 80vw;
    max-height: 80vh;
    overflow: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.3s ease-out;
  `;
    const header = document.createElement("div");
    header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  `;
    const title = document.createElement("h3");
    title.textContent = "Full Details";
    title.style.cssText = `
    margin: 0;
    color: ${type === "success" ? "#d4edda" : "#f8d7da"};
    font-size: 18px;
    font-weight: 600;
  `;
    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.cssText = `
    background: transparent;
    border: none;
    color: ${type === "success" ? "#d4edda" : "#f8d7da"};
    font-size: 28px;
    font-weight: bold;
    line-height: 1;
    padding: 0;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.8;
    transition: opacity 0.2s;
  `;
    closeButton.onmouseenter = () => {
        closeButton.style.opacity = "1";
    };
    closeButton.onmouseleave = () => {
        closeButton.style.opacity = "0.8";
    };
    const content = document.createElement("pre");
    content.style.cssText = `
    margin: 0;
    color: #e0e0e0;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: 'Courier New', monospace;
    background: rgba(0, 0, 0, 0.3);
    padding: 16px;
    border-radius: 4px;
    overflow-x: auto;
  `;
    content.textContent = JSON.stringify(payload, null, 2);
    const closeModal = () => {
        overlay.style.animation = "fadeOut 0.2s ease-out";
        modal.style.animation = "slideDown 0.3s ease-out";
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 300);
    };
    closeButton.onclick = closeModal;
    overlay.onclick = (e) => {
        if (e.target === overlay)
            closeModal();
    };
    header.appendChild(title);
    header.appendChild(closeButton);
    modal.appendChild(header);
    modal.appendChild(content);
    overlay.appendChild(modal);
    // Add modal animations if not already present
    if (!document.getElementById("ai-modal-styles")) {
        const style = document.createElement("style");
        style.id = "ai-modal-styles";
        style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      @keyframes slideDown {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(20px);
          opacity: 0;
        }
      }
    `;
        document.head.appendChild(style);
    }
    document.body.appendChild(overlay);
};
const showToast = (options) => {
    const { message, type = "success", link, timeout, fullDetails } = options;
    const toastId = `ai-toast-${Date.now()}`;
    const toast = document.createElement("div");
    toast.id = toastId;
    toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === "success" ? "#2d5016" : "#5a1a1a"};
    color: ${type === "success" ? "#d4edda" : "#f8d7da"};
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    font-size: 14px;
    line-height: 1.4;
    max-width: 400px;
    word-wrap: break-word;
    animation: slideIn 0.3s ease-out;
    border: 1px solid ${type === "success" ? "rgba(72, 180, 97, 0.3)" : "rgba(220, 53, 69, 0.3)"};
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;
    // Add animation keyframes if not already present
    if (!document.getElementById("ai-toast-styles")) {
        const style = document.createElement("style");
        style.id = "ai-toast-styles";
        style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
        document.head.appendChild(style);
    }
    // Create dismiss button
    const dismissButton = document.createElement("button");
    dismissButton.textContent = "×";
    dismissButton.style.cssText = `
    background: transparent;
    border: none;
    color: ${type === "success" ? "#d4edda" : "#f8d7da"};
    font-size: 20px;
    font-weight: bold;
    line-height: 1;
    padding: 0;
    width: 20px;
    height: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    opacity: 0.8;
    transition: opacity 0.2s;
  `;
    dismissButton.onmouseenter = () => {
        dismissButton.style.opacity = "1";
    };
    dismissButton.onmouseleave = () => {
        dismissButton.style.opacity = "0.8";
    };
    // Create top row container (message + link + dismiss button)
    const topRow = document.createElement("div");
    topRow.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  `;
    // Create message container
    const messageContainer = document.createElement("div");
    messageContainer.style.cssText = `
    flex: 1;
    word-wrap: break-word;
    display: flex;
    gap: 8px;
    align-items: center;
  `;
    const messageText = document.createElement("div");
    messageText.textContent = message;
    messageContainer.appendChild(messageText);
    // Add link if provided
    if (link) {
        const linkElement = document.createElement("a");
        linkElement.href = link.url;
        linkElement.textContent = link.text;
        linkElement.style.cssText = `
      color: ${type === "success" ? "#90ee90" : "#ffb3b3"};
      text-decoration: underline;
      cursor: pointer;
      font-weight: 500;
    `;
        linkElement.onmouseenter = () => {
            linkElement.style.opacity = "0.8";
        };
        linkElement.onmouseleave = () => {
            linkElement.style.opacity = "1";
        };
        messageContainer.appendChild(linkElement);
    }
    topRow.appendChild(messageContainer);
    topRow.appendChild(dismissButton);
    // Add "show full details" button if fullDetails provided (on separate row)
    if (fullDetails !== undefined) {
        const detailsButton = document.createElement("button");
        detailsButton.textContent = "show full details";
        detailsButton.style.cssText = `
      background: transparent;
      border: 1px solid ${type === "success" ? "#90ee90" : "#ffb3b3"};
      color: ${type === "success" ? "#90ee90" : "#ffb3b3"};
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      width: 100%;
      transition: background 0.2s, opacity 0.2s;
    `;
        detailsButton.onmouseenter = () => {
            detailsButton.style.background = type === "success" ? "rgba(144, 238, 144, 0.2)" : "rgba(255, 179, 179, 0.2)";
        };
        detailsButton.onmouseleave = () => {
            detailsButton.style.background = "transparent";
        };
        detailsButton.onclick = (e) => {
            e.stopPropagation();
            showFullDetailsModal(fullDetails, type);
        };
        toast.appendChild(topRow);
        toast.appendChild(detailsButton);
    }
    else {
        toast.appendChild(topRow);
    }
    document.body.appendChild(toast);
    // Dismiss function
    let dismissTimeout = null;
    const dismissToast = () => {
        if (dismissTimeout) {
            clearTimeout(dismissTimeout);
            dismissTimeout = null;
        }
        toast.style.animation = "slideOut 0.3s ease-out";
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    };
    dismissButton.onclick = dismissToast;
    // Auto-dismiss after timeout if provided
    if (timeout && timeout > 0) {
        dismissTimeout = window.setTimeout(() => {
            dismissToast();
        }, timeout);
    }
};
// ---- Small internal helpers (pure / non-visual) ----
const sanitizeBackendBase = (value) => {
    if (typeof value !== "string")
        return "";
    const trimmed = value.trim();
    if (!trimmed)
        return "";
    const cleaned = trimmed.replace(/\/$/, "");
    try {
        if (typeof location !== "undefined" && location.origin) {
            const origin = location.origin.replace(/\/$/, "");
            if (cleaned === origin)
                return "";
        }
    }
    catch { }
    return cleaned;
};
const getBackendBase = () => {
    const fn = window.AIDefaultBackendBase;
    if (typeof fn !== "function")
        throw new Error("AIDefaultBackendBase not initialized. Ensure backendBase is loaded first.");
    return sanitizeBackendBase(fn());
};
const debugEnabled = () => !!window.AIDebug;
const dlog = (...a) => {
    if (debugEnabled())
        console.log("[AIButton]", ...a);
};
const getSharedApiKey = () => {
    try {
        const helper = window.AISharedApiKeyHelper;
        if (helper && typeof helper.get === "function") {
            const value = helper.get();
            if (typeof value === "string")
                return value.trim();
        }
    }
    catch { }
    const raw = window.AI_SHARED_API_KEY;
    return typeof raw === "string" ? raw.trim() : "";
};
const withSharedHeaders = (init) => {
    const helper = window.AISharedApiKeyHelper;
    if (helper && typeof helper.withHeaders === "function") {
        return helper.withHeaders(init || {});
    }
    const key = getSharedApiKey();
    if (!key)
        return init || {};
    const next = { ...(init || {}) };
    const headers = new Headers((init === null || init === void 0 ? void 0 : init.headers) || {});
    headers.set("x-ai-api-key", key);
    next.headers = headers;
    return next;
};
const appendSharedKeyQuery = (url) => {
    var _a;
    const helper = window.AISharedApiKeyHelper;
    if (helper && typeof helper.appendQuery === "function") {
        return helper.appendQuery(url);
    }
    const key = getSharedApiKey();
    if (!key)
        return url;
    const hasProto = /^https?:\/\//i.test(url) || /^wss?:\/\//i.test(url);
    try {
        const resolved = new URL(url, hasProto ? undefined : ((_a = window.location) === null || _a === void 0 ? void 0 : _a.origin) || undefined);
        resolved.searchParams.set("api_key", key);
        return resolved.toString();
    }
    catch {
        const sep = url.includes("?") ? "&" : "?";
        return `${url}${sep}api_key=${encodeURIComponent(key)}`;
    }
};
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
        const children = tasks.filter((t) => t.group_id === tid);
        if (!children.length)
            return 0; // show ring at 0%, matches previous UX
        let done = 0, running = 0, queued = 0, failed = 0, cancelled = 0; // cancelled intentionally excluded from denominator
        for (const c of children) {
            switch (c.status) {
                case "completed":
                    done++;
                    break;
                case "running":
                    running++;
                    break;
                case "queued":
                    queued++;
                    break;
                case "failed":
                    failed++;
                    break;
                case "cancelled":
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
    dlog("ensureWS invoked");
    if (g.__AI_TASK_WS__ && g.__AI_TASK_WS__.readyState === 1)
        return g.__AI_TASK_WS__;
    if (g.__AI_TASK_WS_INIT__)
        return g.__AI_TASK_WS__;
    g.__AI_TASK_WS_INIT__ = true;
    const base = backendBase.replace(/^http/, "ws");
    const paths = [`${base}/api/v1/ws/tasks`, `${base}/ws/tasks`].map((candidate) => appendSharedKeyQuery(candidate));
    for (const url of paths) {
        try {
            dlog("Attempt WS connect", url);
            const sock = new WebSocket(url);
            g.__AI_TASK_WS__ = sock;
            wireSocket(sock);
            return sock;
        }
        catch (e) {
            if (debugEnabled())
                console.warn("[AIButton] WS connect failed candidate", url, e);
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
    sock.onopen = () => {
        dlog("WS open", sock.url);
    };
    sock.onmessage = (evt) => {
        var _a;
        dlog("WS raw message", evt.data);
        try {
            const m = JSON.parse(evt.data);
            const task = m.task || ((_a = m.data) === null || _a === void 0 ? void 0 : _a.task) || m.data || m;
            if (!(task === null || task === void 0 ? void 0 : task.id)) {
                dlog("Message without task id ignored", m);
                return;
            }
            g.__AI_TASK_CACHE__[task.id] = task;
            const ls = g.__AI_TASK_WS_LISTENERS__[task.id];
            if (ls)
                ls.forEach((fn) => fn(task));
            const anyLs = g.__AI_TASK_ANY_LISTENERS__;
            if (anyLs && anyLs.length)
                anyLs.forEach((fn) => {
                    try {
                        fn(task);
                    }
                    catch { }
                });
        }
        catch (err) {
            if (debugEnabled())
                console.error("[AIButton] Failed parse WS message", err);
        }
    };
    const cleanup = (ev) => {
        if (debugEnabled())
            console.warn("[AIButton] WS closed/error", ev === null || ev === void 0 ? void 0 : ev.code, ev === null || ev === void 0 ? void 0 : ev.reason);
        if (window.__AI_TASK_WS__ === sock)
            window.__AI_TASK_WS__ = null;
        window.__AI_TASK_WS_INIT__ = false;
    };
    sock.onclose = cleanup;
    sock.onerror = cleanup;
}
const MinimalAIButton = () => {
    var _a, _b;
    const React = ((_a = window.PluginApi) === null || _a === void 0 ? void 0 : _a.React) || window.React;
    if (!React) {
        console.error("[AIButton] React not found on window.PluginApi.React");
        return null;
    }
    const pageAPI = window.AIPageContext;
    if (!pageAPI) {
        console.error("[AIButton] AIPageContext missing on window");
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
            if (typeof detail === "string") {
                setBackendBase(sanitizeBackendBase(detail));
            }
            else {
                setBackendBase(getBackendBase());
            }
        };
        updateBase();
        window.addEventListener("AIBackendBaseUpdated", updateBase);
        return () => window.removeEventListener("AIBackendBaseUpdated", updateBase);
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
            const res = await fetch(`${backendBase}/api/v1/actions/available`, withSharedHeaders({
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    context: {
                        page: ctx.page,
                        entityId: ctx.entityId,
                        isDetailView: ctx.isDetailView,
                        selectedIds: ctx.selectedIds || [],
                        visibleIds: ctx.visibleIds || [],
                    },
                }),
            }));
            if (!res.ok)
                throw new Error("Failed to load actions");
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
    React.useEffect(() => {
        refetchActions(context);
    }, [context, refetchActions]);
    const executeAction = React.useCallback(async (actionId) => {
        var _a, _b, _c;
        dlog("Execute action", actionId, "context", context);
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
            catch {
                /* fall back to current state */
            }
            const actionMeta = (_a = actionsRef.current) === null || _a === void 0 ? void 0 : _a.find((a) => a.id === actionId);
            const resultKind = (actionMeta === null || actionMeta === void 0 ? void 0 : actionMeta.result_kind) || "none";
            const res = await fetch(`${backendBase}/api/v1/actions/submit`, withSharedHeaders({
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action_id: actionId,
                    context: {
                        page: liveContext.page,
                        entityId: liveContext.entityId,
                        isDetailView: liveContext.isDetailView,
                        selectedIds: liveContext.selectedIds || [],
                        visibleIds: liveContext.visibleIds || [],
                    },
                    params: {},
                }),
            }));
            if (!res.ok) {
                let message = "Submit failed";
                try {
                    const err = await res.json();
                    if (err === null || err === void 0 ? void 0 : err.detail) {
                        if (typeof err.detail === "string") {
                            message = err.detail;
                        }
                        else if (typeof ((_b = err.detail) === null || _b === void 0 ? void 0 : _b.message) === "string") {
                            message = err.detail.message;
                        }
                    }
                }
                catch { }
                throw new Error(message);
            }
            // Close menu and show success toast after successful POST
            setOpenMenu(false);
            const toastMsg = `Action ${actionId} started`;
            showToast({ message: toastMsg, type: "success", timeout: 1500 });
            const { task_id: taskId } = await res.json();
            if (!g.__AI_TASK_WS_LISTENERS__)
                g.__AI_TASK_WS_LISTENERS__ = {};
            if (!g.__AI_TASK_WS_LISTENERS__[taskId])
                g.__AI_TASK_WS_LISTENERS__[taskId] = [];
            setActiveTasks((prev) => prev.includes(taskId) ? prev : [...prev, taskId]);
            const finalize = (t) => {
                if (t.status === "completed") {
                    if (resultKind === "dialog" || resultKind === "notification") {
                        const result = t.result;
                        let message = "";
                        // Check if it's a single scene result
                        if (result &&
                            typeof result === "object" &&
                            "scene_id" in result &&
                            "tags_applied" in result) {
                            const singleResult = result;
                            const tagsCount = singleResult.tags_applied || 0;
                            const sceneId = singleResult.scene_id;
                            console.log("got single tag results", singleResult);
                            message = `Applied ${tagsCount} tag${tagsCount !== 1 ? "s" : ""} to scene`;
                            // Construct scene URL from current origin
                            const sceneUrl = `${window.location.origin}/scenes/${sceneId}/`;
                            showToast({ message, type: "success", link: { url: sceneUrl, text: "view" }, fullDetails: t.result });
                            return; // Early return to avoid showing toast twice
                        }
                        // Check if it's a multiple scenes result
                        else if (result &&
                            typeof result === "object" &&
                            "scenes_completed" in result) {
                            const multiResult = result;
                            const scenesCount = multiResult.scenes_completed || 0;
                            const scenesFailed = multiResult.scenes_failed || 0;
                            console.log("got multiple tag results", multiResult);
                            let messageSuccessPart = `${scenesCount} scene${scenesCount !== 1 ? "s" : ""} tagged`;
                            let messageFailedPart = `${scenesFailed} scene${scenesFailed !== 1 ? "s" : ""} failed`;
                            let fullMessage = "";
                            if (scenesFailed > 0 && scenesCount > 0) {
                                fullMessage = `${messageSuccessPart}, ${messageFailedPart}`;
                            }
                            else if (scenesFailed > 0) {
                                fullMessage = messageFailedPart;
                            }
                            else {
                                fullMessage = messageSuccessPart;
                            }
                            message = fullMessage;
                            // No link for multi-scene tagging (no way to construct list page from array of IDs)
                            showToast({ message, type: "success", fullDetails: t.result });
                            return; // Early return to avoid showing toast twice
                        }
                        // Fallback for other result types
                        else {
                            message = `Action ${actionId} completed`;
                        }
                        if (message) {
                            showToast({ message, type: "success", fullDetails: t.result });
                        }
                    }
                }
                else if (t.status === "failed") {
                    showToast({
                        message: `Action ${actionId} failed: ${t.error || "unknown error"}. Is the nsfw_ai_model_server (usually port 8000) running?`,
                        type: "error",
                        fullDetails: { error: t.error, task: t },
                    });
                }
                setActiveTasks((prev) => prev.filter((id) => id !== t.id));
                setRecentlyFinished((prev) => [t.id, ...prev].slice(0, 20));
            };
            const listener = (t) => {
                if (t.id !== taskId)
                    return;
                if (["completed", "failed", "cancelled"].includes(t.status)) {
                    finalize(t);
                    g.__AI_TASK_WS_LISTENERS__[taskId] = (g.__AI_TASK_WS_LISTENERS__[taskId] || []).filter((fn) => fn !== listener);
                }
            };
            g.__AI_TASK_WS_LISTENERS__[taskId].push(listener);
            if ((_c = g.__AI_TASK_CACHE__) === null || _c === void 0 ? void 0 : _c[taskId])
                listener(g.__AI_TASK_CACHE__[taskId]);
        }
        catch (e) {
            setOpenMenu(false);
            showToast({
                message: `Action ${actionId} failed: ${e.message}. Is the nsfw_ai_model_server (usually port 8000) running?`,
                type: "error",
            });
        }
    }, [backendBase, context, pageAPI]);
    // Any-task listener for progress updates
    React.useEffect(() => {
        const g = window;
        if (!g.__AI_TASK_ANY_LISTENERS__)
            g.__AI_TASK_ANY_LISTENERS__ = [];
        const listener = (t) => {
            if (!activeTasks.length)
                return;
            if (activeTasks.includes(t.id) || activeTasks.includes(t.group_id))
                setProgressVersion((v) => v + 1);
        };
        g.__AI_TASK_ANY_LISTENERS__.push(listener);
        return () => {
            g.__AI_TASK_ANY_LISTENERS__ = (g.__AI_TASK_ANY_LISTENERS__ || []).filter((fn) => fn !== listener);
        };
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
            catch {
                /* best effort */
            }
            refetchActions(liveContext, { silent: true });
        }
        setOpenMenu((o) => !o);
    };
    const getButtonIcon = () => {
        switch (context.page) {
            case "scenes":
                return "🎬";
            case "galleries":
            case "images":
                return "🖼️";
            case "performers":
                return "⭐";
            default:
                return "🤖";
        }
    };
    // Map page keys to more compact labels where necessary (e.g. 'performers' -> 'Actors')
    const getButtonLabel = () => {
        if (!context || !context.page)
            return "AI";
        switch (context.page) {
            case "performers":
                return "Actors";
            default:
                return context.page;
        }
    };
    const colorClass = context.isDetailView
        ? "ai-btn--detail"
        : `ai-btn--${context.page}`;
    // Build children (unchanged structure / classes)
    const elems = [];
    const activeCount = activeTasks.length;
    const progressRing = singleProgress != null && activeCount === 1
        ? React.createElement("div", {
            key: "ring",
            className: "ai-btn__progress-ring",
            style: { ["--ai-progress"]: `${progressPct}%` },
        })
        : null;
    elems.push(React.createElement("button", {
        key: "ai-btn",
        className: `ai-btn ${colorClass}` +
            (singleProgress != null ? " ai-btn--progress" : ""),
        onClick: toggleMenu,
        onMouseEnter: () => setShowTooltip(true),
        onMouseLeave: () => setShowTooltip(false),
        disabled: loadingActions,
    }, [
        progressRing,
        React.createElement("div", { key: "icon", className: "ai-btn__icon" }, activeCount === 0
            ? getButtonIcon()
            : activeCount === 1 && progressPct != null
                ? `${progressPct}%`
                : "⏳"),
        React.createElement("div", { key: "lbl", className: "ai-btn__label" }, String(getButtonLabel() || "AI").toUpperCase()),
        activeCount > 1 &&
            React.createElement("span", { key: "badge", className: "ai-btn__badge" }, String(activeCount)),
    ]));
    if (showTooltip && !openMenu) {
        elems.push(React.createElement("div", { key: "tip", className: "ai-btn__tooltip" }, [
            React.createElement("div", { key: "main", className: "ai-btn__tooltip-main" }, context.contextLabel),
            React.createElement("div", { key: "detail", className: "ai-btn__tooltip-detail" }, context.detailLabel || ""),
            context.entityId &&
                React.createElement("div", { key: "id", className: "ai-btn__tooltip-id" }, `ID: ${context.entityId}`),
            ((_b = context.selectedIds) === null || _b === void 0 ? void 0 : _b.length) &&
                React.createElement("div", { key: "sel", className: "ai-btn__tooltip-sel" }, `Selected: ${context.selectedIds.length}`),
        ]));
    }
    if (openMenu) {
        elems.push(React.createElement("div", { key: "menu", className: "ai-actions-menu" }, [
            loadingActions &&
                React.createElement("div", { key: "loading", className: "ai-actions-menu__status" }, "Loading actions..."),
            !loadingActions &&
                actions.length === 0 &&
                React.createElement("div", { key: "none", className: "ai-actions-menu__status" }, "No actions"),
            !loadingActions &&
                actions.map((a) => {
                    var _a, _b;
                    return React.createElement("button", {
                        key: a.id,
                        onClick: () => executeAction(a.id),
                        className: "ai-actions-menu__item",
                    }, [
                        React.createElement("span", { key: "svc", className: "ai-actions-menu__svc" }, ((_b = (_a = a.service) === null || _a === void 0 ? void 0 : _a.toUpperCase) === null || _b === void 0 ? void 0 : _b.call(_a)) || a.service),
                        React.createElement("span", { key: "albl", style: { flexGrow: 1 } }, a.label),
                        a.result_kind === "dialog" &&
                            React.createElement("span", { key: "rk", className: "ai-actions-menu__rk" }, "↗"),
                    ]);
                }),
        ]));
    }
    return React.createElement("div", {
        className: "minimal-ai-button",
        style: { position: "relative", display: "inline-block" },
    }, elems);
};
window.MinimalAIButton = MinimalAIButton;
window.AIButton = MinimalAIButton; // alias for integrations expecting AIButton
if (!window.__AI_BUTTON_LOADED__) {
    window.__AI_BUTTON_LOADED__ = true;
    if (window.AIDebug)
        console.log("[AIButton] Component loaded and globals registered");
}
MinimalAIButton;
})();

