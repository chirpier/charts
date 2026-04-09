import type {
  ChirpierEmbedError,
  ChirpierEmbedInstance,
  ChirpierEmbedOptions,
  ChirpierEmbedUpdateOptions,
  ChirpierEventChartState,
  ChirpierEventChartStateInput,
  ChirpierResizeMode,
  ChirpierTheme,
} from "./types";
import {
  DEFAULT_CHIRPIER_EVENT_CHART_STATE,
} from "./types";

const CHIRPIER_EMBED_SOURCE = "chirpier-embed";
const CHIRPIER_EMBED_VERSION = "1.0";

type ChirpierIframeMessage =
  | {
      source: typeof CHIRPIER_EMBED_SOURCE;
      version: typeof CHIRPIER_EMBED_VERSION;
      embedId: string;
      type: "rendered";
      payload: { eventId: string; chart?: "summary" | "line" | "bar" | "tracker"; height: number };
    }
  | {
      source: typeof CHIRPIER_EMBED_SOURCE;
      version: typeof CHIRPIER_EMBED_VERSION;
      embedId: string;
      type: "resize";
      payload: { height: number };
    }
  | {
      source: typeof CHIRPIER_EMBED_SOURCE;
      version: typeof CHIRPIER_EMBED_VERSION;
      embedId: string;
      type: "error";
      payload: { code: string; message: string; retryable: boolean };
    }
  | {
      source: typeof CHIRPIER_EMBED_SOURCE;
      version: typeof CHIRPIER_EMBED_VERSION;
      embedId: string;
      type: "interaction";
      payload: Record<string, unknown>;
    };

type ChirpierParentMessage =
  | {
      source: typeof CHIRPIER_EMBED_SOURCE;
      version: typeof CHIRPIER_EMBED_VERSION;
      embedId: string;
      type: "updateTheme";
      payload: { theme: ChirpierTheme };
    }
  | {
      source: typeof CHIRPIER_EMBED_SOURCE;
      version: typeof CHIRPIER_EMBED_VERSION;
      embedId: string;
      type: "resizeRequest";
      payload: Record<string, never>;
    }
  | {
      source: typeof CHIRPIER_EMBED_SOURCE;
      version: typeof CHIRPIER_EMBED_VERSION;
      embedId: string;
      type: "destroy";
      payload: Record<string, never>;
    };

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function getDefaultBaseUrl() {
  return "https://www.chirpier.co";
}

function resolveEventChartState(state?: ChirpierEventChartStateInput): ChirpierEventChartState {
  return {
    ...DEFAULT_CHIRPIER_EVENT_CHART_STATE,
    ...state,
    tracker: {
      ...DEFAULT_CHIRPIER_EVENT_CHART_STATE.tracker,
      ...state?.tracker,
    },
  };
}

function applyCanonicalStateToUrl(url: URL, state?: ChirpierEventChartStateInput) {
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

function buildIframeUrl(
  baseUrl: string,
  eventId: string,
  shareToken: string | undefined,
  embedId: string,
  state?: ChirpierEventChartStateInput,
) {
  const url = new URL(`${baseUrl}/events/${eventId}`);
  url.searchParams.set("embed", "1");
  url.searchParams.set("embedId", embedId);

  if (shareToken) {
    url.searchParams.set("share", shareToken);
  }

  applyCanonicalStateToUrl(url, state);
  return url.toString();
}

function getOrigin(baseUrl: string) {
  return new URL(baseUrl).origin;
}

function toCssDimension(value: number | string | undefined, fallback?: string) {
  if (value === undefined) return fallback;
  return typeof value === "number" ? `${value}px` : String(value);
}

function resolveResizeMode(options: Pick<ChirpierEmbedOptions, "resizeMode" | "autoResize">) {
  if (options.resizeMode) return options.resizeMode;
  if (options.autoResize === false) return "fixed" as ChirpierResizeMode;
  return "auto" as ChirpierResizeMode;
}

function applySizing(
  iframe: HTMLIFrameElement,
  options: Pick<
    ChirpierEmbedOptions,
    "resizeMode" | "autoResize" | "width" | "height" | "minHeight" | "maxHeight" | "aspectRatio"
  >,
) {
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
  } else {
    iframe.style.removeProperty("height");
  }

  if (minHeight) {
    iframe.style.minHeight = minHeight;
  } else {
    iframe.style.removeProperty("min-height");
  }

  if (maxHeight) {
    iframe.style.maxHeight = maxHeight;
  } else {
    iframe.style.removeProperty("max-height");
  }

  if (options.aspectRatio !== undefined) {
    iframe.style.aspectRatio = String(options.aspectRatio);
  } else {
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

function isEmbedMessage(value: unknown): value is ChirpierIframeMessage {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    candidate.source === CHIRPIER_EMBED_SOURCE &&
    candidate.version === CHIRPIER_EMBED_VERSION &&
    typeof candidate.embedId === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.payload === "object"
  );
}

function toEmbedError(payload: { code?: string; message?: string; retryable?: boolean }): ChirpierEmbedError {
  const error = new Error(payload.message ?? "Chirpier embed error") as ChirpierEmbedError;
  error.code = payload.code;
  error.retryable = payload.retryable;
  return error;
}

function emitEmbedError(
  onError: ChirpierEmbedOptions["onError"],
  payload: { code?: string; message?: string; retryable?: boolean },
) {
  onError?.(toEmbedError(payload));
}

function postMessageToIframe(
  iframe: HTMLIFrameElement,
  targetOrigin: string,
  message: ChirpierParentMessage,
) {
  iframe.contentWindow?.postMessage(message, targetOrigin);
}

function getStructuralUrl(options: ChirpierEmbedOptions, embedId: string) {
  return buildIframeUrl(
    normalizeBaseUrl(options.baseUrl ?? getDefaultBaseUrl()),
    options.eventId,
    options.shareToken,
    embedId,
    options.state,
  );
}

function syncTheme(iframe: HTMLIFrameElement, targetOrigin: string, embedId: string, theme?: ChirpierTheme) {
  if (!theme) return;

  postMessageToIframe(iframe, targetOrigin, {
    source: CHIRPIER_EMBED_SOURCE,
    version: CHIRPIER_EMBED_VERSION,
    embedId,
    type: "updateTheme",
    payload: { theme },
  });
}

export function mountChirpierChart(
  container: HTMLElement | string,
  options: ChirpierEmbedOptions,
): ChirpierEmbedInstance {
  const root =
    typeof container === "string"
      ? document.querySelector<HTMLElement>(container)
      : container;

  if (!root) {
    throw new Error("Chirpier mount container not found");
  }

  const iframe = document.createElement("iframe");
  const embedId = createEmbedId();
  const normalizedBaseUrl = normalizeBaseUrl(options.baseUrl ?? getDefaultBaseUrl());

  let currentOptions: ChirpierEmbedOptions = { ...options, baseUrl: normalizedBaseUrl };
  let isDestroyed = false;

  iframe.src = getStructuralUrl({ ...options, baseUrl: normalizedBaseUrl }, embedId);
  iframe.style.border = "none";
  iframe.setAttribute("scrolling", "no");
  iframe.style.overflow = "hidden";
  applySizing(iframe, currentOptions);
  if (options.className) iframe.className = options.className;
  if (options.style) Object.assign(iframe.style, options.style);
  iframe.title = `Chirpier event ${options.eventId}`;

  const handleMessage = (event: MessageEvent) => {
    const targetOrigin = getOrigin(currentOptions.baseUrl ?? getDefaultBaseUrl());
    if (event.origin !== targetOrigin || !isEmbedMessage(event.data)) return;
    if (event.data.embedId !== embedId) return;

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
  };

  window.addEventListener("message", handleMessage);
  iframe.addEventListener("load", handleLoad);
  root.appendChild(iframe);

  const update = (next: ChirpierEmbedUpdateOptions) => {
    if (isDestroyed) return;

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
    }
  };

  const destroy = () => {
    if (isDestroyed) return;
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
    updateState(state: ChirpierEventChartStateInput) {
      update({ state });
    },
    updateTheme(theme: ChirpierTheme) {
      update({ theme });
    },
    destroy,
  };
}
