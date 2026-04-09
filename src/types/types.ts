import type React from "react";
import type {
  ChirpierChartRange,
  ChirpierEmbedError,
  ChirpierEmbedInstance,
  ChirpierEmbedOptions,
  ChirpierEmbedUpdateOptions,
  ChirpierEventAggregateMode,
  ChirpierEventChartState,
  ChirpierEventChartStateInput,
  ChirpierEventChartView,
  ChirpierEventTimeseriesVariant,
  ChirpierEventTrackerCondition,
  ChirpierEventTrackerRule,
  ChirpierInteractionEvent,
  ChirpierResizeMode,
  ChirpierRenderedEvent,
  ChirpierResizeEvent,
  ChirpierTheme,
} from "@chirpier/embed";
import {
  DEFAULT_CHIRPIER_EVENT_CHART_STATE as DEFAULT_CHIRPIER_EVENT_CHART_STATE_VALUE,
  DEFAULT_CHIRPIER_EVENT_TRACKER_RULE as DEFAULT_CHIRPIER_EVENT_TRACKER_RULE_VALUE,
} from "@chirpier/embed";

export type {
  ChirpierChartRange,
  ChirpierEmbedError,
  ChirpierEmbedInstance,
  ChirpierEmbedOptions,
  ChirpierEmbedUpdateOptions,
  ChirpierEventAggregateMode,
  ChirpierEventChartState,
  ChirpierEventChartStateInput,
  ChirpierEventChartView,
  ChirpierEventTimeseriesVariant,
  ChirpierEventTrackerCondition,
  ChirpierEventTrackerRule,
  ChirpierInteractionEvent,
  ChirpierResizeMode,
  ChirpierRenderedEvent,
  ChirpierResizeEvent,
  ChirpierTheme,
};

export const DEFAULT_CHIRPIER_EVENT_CHART_STATE = DEFAULT_CHIRPIER_EVENT_CHART_STATE_VALUE;
export const DEFAULT_CHIRPIER_EVENT_TRACKER_RULE = DEFAULT_CHIRPIER_EVENT_TRACKER_RULE_VALUE;

export type ChirpierChartStateAliases = Partial<Pick<ChirpierEventChartStateInput, "range" | "aggregate" | "variant" | "compare" | "header" | "view" | "tracker">>;

export type ChirpierErrorFallback = React.ReactNode | ((error: ChirpierEmbedError) => React.ReactNode);

type BaseChirpierProps = Omit<ChirpierEmbedOptions, "style"> & {
  eventId: string;
};

export type ChirpierProps = BaseChirpierProps & ChirpierChartStateAliases & {
  loadingFallback?: React.ReactNode;
  errorFallback?: ChirpierErrorFallback;
  style?: React.CSSProperties;
};

export function createChirpierChartState(input: ChirpierChartStateAliases = {}): ChirpierEventChartState {
  return {
    ...DEFAULT_CHIRPIER_EVENT_CHART_STATE_VALUE,
    ...input,
    tracker: {
      ...DEFAULT_CHIRPIER_EVENT_TRACKER_RULE_VALUE,
      ...input.tracker,
    },
  };
}

export interface ChirpierChartRef {
  refresh(): void;
  resize(): void;
  updateState(state: ChirpierEventChartStateInput): void;
  updateTheme(theme: ChirpierTheme): void;
  getIframe(): HTMLIFrameElement | null;
}
