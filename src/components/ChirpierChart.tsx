import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { mountChirpierChart } from "../embed/client";
import type {
  ChirpierChartRef,
  ChirpierEmbedError,
  ChirpierEmbedInstance,
  ChirpierEmbedOptions,
  ChirpierProps,
  ChirpierRenderedEvent,
} from "../types/types";

type ChirpierChartComponentProps = React.PropsWithoutRef<ChirpierProps>;

function resolveChirpierChartState(props: ChirpierChartComponentProps) {
  const { state, range, aggregate, variant, compare, header, view, tracker } = props;
  const hasAliases = [range, aggregate, variant, compare, header, view, tracker].some((value) => value !== undefined);

  if (!state && !hasAliases) return undefined;

  return {
    ...state,
    ...(range !== undefined ? { range } : {}),
    ...(aggregate !== undefined ? { aggregate } : {}),
    ...(variant !== undefined ? { variant } : {}),
    ...(compare !== undefined ? { compare } : {}),
    ...(header !== undefined ? { header } : {}),
    ...(view !== undefined ? { view } : {}),
    ...(tracker !== undefined ? { tracker: { ...state?.tracker, ...tracker } } : {}),
  };
}

function toEmbedOptions(props: ChirpierChartComponentProps): ChirpierEmbedOptions {
  const {
    aggregate,
    compare,
    errorFallback,
    header,
    loadingFallback,
    range,
    tracker,
    variant,
    view,
    ...embedProps
  } = props;
  const resolvedState = resolveChirpierChartState(props);

  return {
    ...embedProps,
    state: resolvedState,
    style: embedProps.style as unknown as Partial<CSSStyleDeclaration> | undefined,
  };
}

function toCssDimension(value: number | string | undefined, fallback?: string) {
  if (value === undefined) return fallback;
  return typeof value === "number" ? `${value}px` : String(value);
}

function resolveResizeMode(props: ChirpierChartComponentProps) {
  if (props.resizeMode) return props.resizeMode;
  if (props.autoResize === false) return "fixed" as const;
  return "auto" as const;
}

function applyIframeSizing(
  iframe: HTMLIFrameElement,
  props: ChirpierChartComponentProps,
  resizeMode: ReturnType<typeof resolveResizeMode>,
) {
  iframe.width = String(props.width ?? "100%");
  iframe.style.width = toCssDimension(props.width, "100%") ?? "100%";
  iframe.style.maxWidth = "100%";

  const height = toCssDimension(props.height);
  const minHeight = toCssDimension(props.minHeight);
  const maxHeight = toCssDimension(props.maxHeight);

  if (height) {
    iframe.height = String(props.height);
    iframe.style.height = height;
  }
  if (minHeight) iframe.style.minHeight = minHeight;
  if (maxHeight) iframe.style.maxHeight = maxHeight;
  if (props.aspectRatio !== undefined) iframe.style.aspectRatio = String(props.aspectRatio);
  if (resizeMode === "fill" && !height) iframe.style.height = "100%";
}

export const ChirpierChart = forwardRef<ChirpierChartRef, ChirpierProps>(function ChirpierChart(props, ref) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ChirpierEmbedInstance | null>(null);
  const resizeMode = resolveResizeMode(props);
  const resolvedState = useMemo(() => resolveChirpierChartState(props), [props.aggregate, props.compare, props.header, props.range, props.state, props.tracker, props.variant, props.view]);
  const [hasRendered, setHasRendered] = useState(false);
  const [renderError, setRenderError] = useState<ChirpierEmbedError | null>(null);
  const [observedInView, setObservedInView] = useState(true);
  const onRenderedRef = useRef(props.onRendered);
  const onErrorRef = useRef(props.onError);
  const resolvedInView = props.inView ?? observedInView;

  useEffect(() => {
    onRenderedRef.current = props.onRendered;
    onErrorRef.current = props.onError;
  }, [props.onError, props.onRendered]);

  useEffect(() => {
    if (props.inView !== undefined) {
      setObservedInView(props.inView);
      return;
    }

    const element = wrapperRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setObservedInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setObservedInView(entry.isIntersecting && entry.intersectionRatio > 0);
      },
      { threshold: 0.01 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [props.inView]);

  const wrapperStyle = useMemo(() => {
    const style: React.CSSProperties = {
      display: "block",
      position: props.loadingFallback || props.errorFallback ? "relative" : undefined,
      width: toCssDimension(props.width, "100%"),
      maxWidth: "100%",
    };

    const height = toCssDimension(props.height);
    const minHeight = toCssDimension(props.minHeight);
    const maxHeight = toCssDimension(props.maxHeight);

    if (height) style.height = height;
    if (minHeight) style.minHeight = minHeight;
    if (maxHeight) style.maxHeight = maxHeight;
    if (props.aspectRatio !== undefined) style.aspectRatio = String(props.aspectRatio);
    if (resizeMode === "fill" && !height) style.height = "100%";

    return style;
  }, [props.aspectRatio, props.errorFallback, props.height, props.loadingFallback, props.maxHeight, props.minHeight, props.width, resizeMode]);

  useEffect(() => {
    setHasRendered(false);
    setRenderError(null);
  }, [props.baseUrl, props.eventId, props.shareToken, resizeMode, resolvedState]);

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = mountChirpierChart(containerRef.current, toEmbedOptions({
      ...props,
      inView: resolvedInView,
      onError: (error: ChirpierEmbedError) => {
        setRenderError(error);
        onErrorRef.current?.(error);
      },
      onRendered: (event: ChirpierRenderedEvent) => {
        setHasRendered(true);
        setRenderError(null);
        onRenderedRef.current?.(event);
      },
      state: resolvedState,
      resizeMode,
    }));
    instanceRef.current = instance;

    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [props.baseUrl, props.eventId, props.shareToken, resizeMode]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;

    instance.update({
      eventId: props.eventId,
      shareToken: props.shareToken,
      inView: resolvedInView,
      state: resolvedState,
      theme: props.theme,
      resizeMode,
      width: props.width,
      height: props.height,
      minHeight: props.minHeight,
      maxHeight: props.maxHeight,
      aspectRatio: props.aspectRatio,
    });

    applyIframeSizing(instance.iframe, props, resizeMode);
    instance.iframe.className = props.className ?? "";
    instance.iframe.style.border = "none";
    if (props.style) {
      Object.assign(instance.iframe.style, props.style);
    }
  }, [
    props.aspectRatio,
    props.className,
    props.eventId,
    props.height,
    resolvedInView,
    props.maxHeight,
    props.minHeight,
    props.shareToken,
    props.style,
    props.theme,
    props.width,
    resizeMode,
    resolvedState,
  ]);

  useImperativeHandle(ref, () => ({
    refresh() {
      const instance = instanceRef.current;
      if (!instance) return;
      instance.update({ eventId: props.eventId, shareToken: props.shareToken, state: resolvedState });
    },
    resize() {
      const instance = instanceRef.current;
      if (!instance) return;
      const iframe = instance.iframe;
      iframe.style.width = toCssDimension(props.width, "100%") ?? "100%";
      if (props.height !== undefined) {
        const height = toCssDimension(props.height);
        if (height) iframe.style.height = height;
      }
    },
    updateState(state) {
      instanceRef.current?.updateState(state);
    },
    updateTheme(theme) {
      instanceRef.current?.updateTheme(theme);
    },
    getIframe() {
      return instanceRef.current?.iframe ?? null;
    },
  }), [props.eventId, props.height, props.shareToken, props.width, resolvedState]);

  const showLoadingFallback = Boolean(props.loadingFallback) && !hasRendered && !renderError;
  const showErrorFallback = Boolean(props.errorFallback) && renderError;
  let renderedErrorFallback: React.ReactNode = null;
  if (renderError) {
    renderedErrorFallback = typeof props.errorFallback === "function"
      ? props.errorFallback(renderError)
      : props.errorFallback ?? null;
  }

  return (
    <div ref={wrapperRef} style={wrapperStyle}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          display: showErrorFallback ? "none" : "block",
        }}
      />
      {showLoadingFallback ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "stretch",
          }}
        >
          {props.loadingFallback}
        </div>
      ) : null}
      {showErrorFallback ? renderedErrorFallback : null}
    </div>
  );
});
