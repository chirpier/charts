export type ChirpierTheme = "light" | "dark" | "system";
export type ChirpierResizeMode = "auto" | "fixed" | "fill";
export type ChirpierChartRange = "1h" | "1d" | "1w" | "1m";
export type ChirpierEventAggregateMode = "sum" | "average";
export type ChirpierEventTimeseriesVariant = "line" | "bar";
export type ChirpierEventChartView = "all" | "summary" | "timeseries" | "tracker";
export type ChirpierEventTrackerCondition = "gt" | "gte" | "lt" | "lte" | "eq";

export interface ChirpierEventTrackerRule {
  condition: ChirpierEventTrackerCondition;
  threshold: number;
}

export interface ChirpierEventChartState {
  range: ChirpierChartRange;
  aggregate: ChirpierEventAggregateMode;
  variant: ChirpierEventTimeseriesVariant;
  compare: boolean;
  header: boolean;
  view: ChirpierEventChartView;
  tracker: ChirpierEventTrackerRule;
}

export type ChirpierEventChartStateInput = Partial<Omit<ChirpierEventChartState, "tracker">> & {
  tracker?: Partial<ChirpierEventTrackerRule>;
};

export const DEFAULT_CHIRPIER_EVENT_TRACKER_RULE: ChirpierEventTrackerRule = {
  condition: "gt",
  threshold: 0,
};

export const DEFAULT_CHIRPIER_EVENT_CHART_STATE: ChirpierEventChartState = {
  range: "1h",
  aggregate: "sum",
  variant: "line",
  compare: false,
  header: true,
  view: "all",
  tracker: DEFAULT_CHIRPIER_EVENT_TRACKER_RULE,
};

export interface ChirpierRenderedEvent {
  eventId: string;
  chart?: "summary" | "line" | "bar" | "tracker";
  height: number;
}

export interface ChirpierResizeEvent {
  height: number;
}

export interface ChirpierInteractionEvent {
  [key: string]: unknown;
}

export interface ChirpierEmbedError extends Error {
  code?: string;
  retryable?: boolean;
}

export interface ChirpierEmbedOptions {
  eventId: string;
  shareToken?: string;
  inView?: boolean;
  state?: ChirpierEventChartStateInput;
  resizeMode?: ChirpierResizeMode;
  width?: number | string;
  height?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
  aspectRatio?: number | string;
  baseUrl?: string;
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  autoResize?: boolean;
  theme?: ChirpierTheme;
  onRendered?: (event: ChirpierRenderedEvent) => void;
  onResize?: (event: ChirpierResizeEvent) => void;
  onError?: (error: ChirpierEmbedError) => void;
  onInteraction?: (event: ChirpierInteractionEvent) => void;
}

export interface ChirpierEmbedUpdateOptions {
  eventId?: string;
  shareToken?: string;
  inView?: boolean;
  state?: ChirpierEventChartStateInput;
  baseUrl?: string;
  theme?: ChirpierTheme;
  resizeMode?: ChirpierResizeMode;
  width?: number | string;
  height?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
  aspectRatio?: number | string;
}

export interface ChirpierEmbedInstance {
  iframe: HTMLIFrameElement;
  update(next: ChirpierEmbedUpdateOptions): void;
  updateState(state: ChirpierEventChartStateInput): void;
  updateTheme(theme: ChirpierTheme): void;
  destroy(): void;
}
