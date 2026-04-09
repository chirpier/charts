import type React from "react";
import type { ChirpierChartRange, ChirpierEmbedError, ChirpierEmbedInstance, ChirpierEmbedOptions, ChirpierEmbedUpdateOptions, ChirpierEventAggregateMode, ChirpierEventChartState, ChirpierEventChartStateInput, ChirpierEventChartView, ChirpierEventTimeseriesVariant, ChirpierEventTrackerCondition, ChirpierEventTrackerRule, ChirpierInteractionEvent, ChirpierResizeMode, ChirpierRenderedEvent, ChirpierResizeEvent, ChirpierTheme } from "@chirpier/embed";
export type { ChirpierChartRange, ChirpierEmbedError, ChirpierEmbedInstance, ChirpierEmbedOptions, ChirpierEmbedUpdateOptions, ChirpierEventAggregateMode, ChirpierEventChartState, ChirpierEventChartStateInput, ChirpierEventChartView, ChirpierEventTimeseriesVariant, ChirpierEventTrackerCondition, ChirpierEventTrackerRule, ChirpierInteractionEvent, ChirpierResizeMode, ChirpierRenderedEvent, ChirpierResizeEvent, ChirpierTheme, };
export declare const DEFAULT_CHIRPIER_EVENT_CHART_STATE: ChirpierEventChartState;
export declare const DEFAULT_CHIRPIER_EVENT_TRACKER_RULE: ChirpierEventTrackerRule;
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
export declare function createChirpierChartState(input?: ChirpierChartStateAliases): ChirpierEventChartState;
export interface ChirpierChartRef {
    refresh(): void;
    resize(): void;
    updateState(state: ChirpierEventChartStateInput): void;
    updateTheme(theme: ChirpierTheme): void;
    getIframe(): HTMLIFrameElement | null;
}
//# sourceMappingURL=types.d.ts.map