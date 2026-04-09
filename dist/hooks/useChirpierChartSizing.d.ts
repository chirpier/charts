import type { RefObject } from "react";
export interface ChirpierChartSizingOptions {
    mobileBreakpoint?: number;
    tabletBreakpoint?: number;
    mobileRatio?: number;
    tabletRatio?: number;
    desktopRatio?: number;
    minHeight?: number;
    maxHeight?: number;
}
export interface ChirpierChartSizingResult {
    ref: RefObject<HTMLDivElement>;
    width: number;
    height: number;
}
export declare function useChirpierChartSizing(options?: ChirpierChartSizingOptions): ChirpierChartSizingResult;
//# sourceMappingURL=useChirpierChartSizing.d.ts.map