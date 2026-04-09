import { useEffect, useMemo, useRef, useState } from "react";
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
export function useChirpierChartSizing(options = {}) {
    const { mobileBreakpoint = 768, tabletBreakpoint = 1024, mobileRatio = 0.68, tabletRatio = 0.52, desktopRatio = 0.42, minHeight = 240, maxHeight = 520, } = options;
    const ref = useRef(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const element = ref.current;
        if (!element || typeof ResizeObserver === "undefined")
            return;
        const observer = new ResizeObserver(([entry]) => {
            const nextWidth = Math.round(entry.contentRect.width);
            setWidth((current) => (current === nextWidth ? current : nextWidth));
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);
    const height = useMemo(() => {
        if (!width)
            return minHeight;
        const ratio = width < mobileBreakpoint ? mobileRatio : width < tabletBreakpoint ? tabletRatio : desktopRatio;
        return clamp(Math.round(width * ratio), minHeight, maxHeight);
    }, [desktopRatio, maxHeight, minHeight, mobileBreakpoint, mobileRatio, tabletBreakpoint, tabletRatio, width]);
    return { ref, width, height };
}
