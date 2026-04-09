import React from "react";
import type { ChirpierChartRef, ChirpierEmbedOptions } from "../types/types";
export declare const ChirpierChart: React.ForwardRefExoticComponent<Omit<ChirpierEmbedOptions, "style"> & {
    eventId: string;
} & Partial<Pick<import("../types/types").ChirpierEventChartStateInput, "tracker" | "range" | "aggregate" | "variant" | "compare" | "header" | "view">> & {
    loadingFallback?: React.ReactNode;
    errorFallback?: import("../types/types").ChirpierErrorFallback;
    style?: React.CSSProperties | undefined;
} & React.RefAttributes<ChirpierChartRef>>;
//# sourceMappingURL=ChirpierChart.d.ts.map