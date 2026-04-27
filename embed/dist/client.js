import { DEFAULT_CHIRPIER_EVENT_CHART_STATE, } from "./types";
const CHIRPIER_EMBED_SOURCE = "chirpier-embed";
const CHIRPIER_EMBED_VERSION = "1.0";
function normalizeBaseUrl(baseUrl) {
    return baseUrl.replace(/\/+$/, "");
}
function getDefaultBaseUrl() {
    return "https://www.chirpier.co";
}
function resolveEventChartState(state) {
    return {
        ...DEFAULT_CHIRPIER_EVENT_CHART_STATE,
        ...state,
        tracker: {
            ...DEFAULT_CHIRPIER_EVENT_CHART_STATE.tracker,
            ...state?.tracker,
        },
    };
}
function applyCanonicalStateToUrl(url, state) {
    const resolvedState = resolveEventChartState(state);
    if (resolvedState.range !== DEFAULT_CHIRPIER_EVENT_CHART_STATE.range) {
        url.searchParams.set("range", resolvedState.range);
    }
    if (resolvedState.aggregate !== DEFAULT_CHIRPIER_EVENT_CHART_STATE.aggregate) {
        url.searchParams.set("aggregate", resolvedState.aggregate);
    }
    if (resolvedState.variant !== DEFAULT_CHIRPIER_EVENT_CHART_STATE.variant) {
        url.searchParams.set("variant", resolvedState.variant);
    }
    if (resolvedState.compare !== DEFAULT_CHIRPIER_EVENT_CHART_STATE.compare) {
        url.searchParams.set("compare", "true");
    }
    if (resolvedState.header !== DEFAULT_CHIRPIER_EVENT_CHART_STATE.header) {
        url.searchParams.set("header", "false");
    }
    if (resolvedState.view !== DEFAULT_CHIRPIER_EVENT_CHART_STATE.view) {
        url.searchParams.set("view", resolvedState.view);
    }
    if (resolvedState.tracker.condition !== DEFAULT_CHIRPIER_EVENT_CHART_STATE.tracker.condition) {
        url.searchParams.set("trackerCondition", resolvedState.tracker.condition);
    }
    if (resolvedState.tracker.threshold !== DEFAULT_CHIRPIER_EVENT_CHART_STATE.tracker.threshold) {
        url.searchParams.set("trackerThreshold", String(resolvedState.tracker.threshold));
    }
}
function buildIframeUrl(baseUrl, eventId, shareToken, embedId, state) {
    const url = new URL(`${baseUrl}/events/${eventId}`);
    url.searchParams.set("embed", "1");
    url.searchParams.set("embedId", embedId);
    if (shareToken) {
        url.searchParams.set("share", shareToken);
    }
    applyCanonicalStateToUrl(url, state);
    return url.toString();
}
function getOrigin(baseUrl) {
    return new URL(baseUrl).origin;
}
function toCssDimension(value, fallback) {
    if (value === undefined)
        return fallback;
    return typeof value === "number" ? `${value}px` : String(value);
}
function resolveResizeMode(options) {
    if (options.resizeMode)
        return options.resizeMode;
    if (options.autoResize === false)
        return "fixed";
    return "auto";
}
function applySizing(iframe, options) {
    const resizeMode = resolveResizeMode(options);
    const width = toCssDimension(options.width, "100%") ?? "100%";
    const height = toCssDimension(options.height, resizeMode === "fixed" ? "400px" : undefined);
    const minHeight = toCssDimension(options.minHeight);
    const maxHeight = toCssDimension(options.maxHeight);
    iframe.width = String(options.width ?? "100%");
    iframe.style.width = width;
    iframe.style.maxWidth = "100%";
    if (height) {
        iframe.height = String(options.height ?? 400);
        iframe.style.height = height;
    }
    else {
        iframe.style.removeProperty("height");
    }
    if (minHeight) {
        iframe.style.minHeight = minHeight;
    }
    else {
        iframe.style.removeProperty("min-height");
    }
    if (maxHeight) {
        iframe.style.maxHeight = maxHeight;
    }
    else {
        iframe.style.removeProperty("max-height");
    }
    if (options.aspectRatio !== undefined) {
        iframe.style.aspectRatio = String(options.aspectRatio);
    }
    else {
        iframe.style.removeProperty("aspect-ratio");
    }
    if (resizeMode === "fill") {
        iframe.style.display = "block";
        iframe.style.height = height ?? "100%";
    }
}
function createEmbedId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `chirpier-${Math.random().toString(36).slice(2, 10)}`;
}
function isEmbedMessage(value) {
    if (!value || typeof value !== "object")
        return false;
    const candidate = value;
    return (candidate.source === CHIRPIER_EMBED_SOURCE &&
        candidate.version === CHIRPIER_EMBED_VERSION &&
        typeof candidate.embedId === "string" &&
        typeof candidate.type === "string" &&
        typeof candidate.payload === "object");
}
function toEmbedError(payload) {
    const error = new Error(payload.message ?? "Chirpier embed error");
    error.code = payload.code;
    error.retryable = payload.retryable;
    return error;
}
function emitEmbedError(onError, payload) {
    onError?.(toEmbedError(payload));
}
function postMessageToIframe(iframe, targetOrigin, message) {
    iframe.contentWindow?.postMessage(message, targetOrigin);
}
function getStructuralUrl(options, embedId) {
    return buildIframeUrl(normalizeBaseUrl(options.baseUrl ?? getDefaultBaseUrl()), options.eventId, options.shareToken, embedId, options.state);
}
function syncTheme(iframe, targetOrigin, embedId, theme) {
    if (!theme)
        return;
    postMessageToIframe(iframe, targetOrigin, {
        source: CHIRPIER_EMBED_SOURCE,
        version: CHIRPIER_EMBED_VERSION,
        embedId,
        type: "updateTheme",
        payload: { theme },
    });
}
function syncVisibility(iframe, targetOrigin, embedId, inView) {
    postMessageToIframe(iframe, targetOrigin, {
        source: CHIRPIER_EMBED_SOURCE,
        version: CHIRPIER_EMBED_VERSION,
        embedId,
        type: "updateVisibility",
        payload: { inView: inView ?? true },
    });
}
export function mountChirpierChart(container, options) {
    const root = typeof container === "string"
        ? document.querySelector(container)
        : container;
    if (!root) {
        throw new Error("Chirpier mount container not found");
    }
    const iframe = document.createElement("iframe");
    const embedId = createEmbedId();
    const normalizedBaseUrl = normalizeBaseUrl(options.baseUrl ?? getDefaultBaseUrl());
    let currentOptions = { ...options, baseUrl: normalizedBaseUrl };
    let isDestroyed = false;
    iframe.src = getStructuralUrl({ ...options, baseUrl: normalizedBaseUrl }, embedId);
    iframe.style.border = "none";
    iframe.setAttribute("scrolling", "no");
    iframe.style.overflow = "hidden";
    applySizing(iframe, currentOptions);
    if (options.className)
        iframe.className = options.className;
    if (options.style)
        Object.assign(iframe.style, options.style);
    iframe.title = `Chirpier event ${options.eventId}`;
    const handleMessage = (event) => {
        const targetOrigin = getOrigin(currentOptions.baseUrl ?? getDefaultBaseUrl());
        if (event.origin !== targetOrigin || !isEmbedMessage(event.data))
            return;
        if (event.data.embedId !== embedId)
            return;
        if (event.data.type === "rendered") {
            if (resolveResizeMode(currentOptions) === "auto") {
                iframe.height = String(event.data.payload.height);
                iframe.style.height = `${event.data.payload.height}px`;
            }
            syncTheme(iframe, targetOrigin, embedId, currentOptions.theme);
            currentOptions.onRendered?.(event.data.payload);
            return;
        }
        if (event.data.type === "resize") {
            if (resolveResizeMode(currentOptions) === "auto") {
                iframe.height = String(event.data.payload.height);
                iframe.style.height = `${event.data.payload.height}px`;
            }
            currentOptions.onResize?.(event.data.payload);
            return;
        }
        if (event.data.type === "interaction") {
            currentOptions.onInteraction?.(event.data.payload);
            return;
        }
        if (event.data.type === "error") {
            emitEmbedError(currentOptions.onError, event.data.payload);
        }
    };
    const handleLoad = () => {
        const targetOrigin = getOrigin(currentOptions.baseUrl ?? getDefaultBaseUrl());
        syncTheme(iframe, targetOrigin, embedId, currentOptions.theme);
        syncVisibility(iframe, targetOrigin, embedId, currentOptions.inView);
    };
    window.addEventListener("message", handleMessage);
    iframe.addEventListener("load", handleLoad);
    root.appendChild(iframe);
    const update = (next) => {
        if (isDestroyed)
            return;
        const previousStructuralUrl = getStructuralUrl(currentOptions, embedId);
        currentOptions = {
            ...currentOptions,
            ...next,
            baseUrl: next.baseUrl
                ? normalizeBaseUrl(next.baseUrl)
                : currentOptions.baseUrl,
            state: next.state
                ? {
                    ...currentOptions.state,
                    ...next.state,
                    tracker: {
                        ...currentOptions.state?.tracker,
                        ...next.state.tracker,
                    },
                }
                : currentOptions.state,
        };
        applySizing(iframe, currentOptions);
        const nextStructuralUrl = getStructuralUrl(currentOptions, embedId);
        if (previousStructuralUrl !== nextStructuralUrl) {
            iframe.src = nextStructuralUrl;
            return;
        }
        if (next.theme) {
            const targetOrigin = getOrigin(currentOptions.baseUrl ?? getDefaultBaseUrl());
            syncTheme(iframe, targetOrigin, embedId, next.theme);
            syncVisibility(iframe, targetOrigin, embedId, currentOptions.inView);
            return;
        }
        if (next.inView !== undefined) {
            const targetOrigin = getOrigin(currentOptions.baseUrl ?? getDefaultBaseUrl());
            syncVisibility(iframe, targetOrigin, embedId, currentOptions.inView);
        }
    };
    const destroy = () => {
        if (isDestroyed)
            return;
        isDestroyed = true;
        const targetOrigin = getOrigin(currentOptions.baseUrl ?? getDefaultBaseUrl());
        postMessageToIframe(iframe, targetOrigin, {
            source: CHIRPIER_EMBED_SOURCE,
            version: CHIRPIER_EMBED_VERSION,
            embedId,
            type: "destroy",
            payload: {},
        });
        window.removeEventListener("message", handleMessage);
        iframe.removeEventListener("load", handleLoad);
        iframe.remove();
    };
    return {
        iframe,
        update,
        updateState(state) {
            update({ state });
        },
        updateTheme(theme) {
            update({ theme });
        },
        destroy,
    };
}
