export const DEFAULT_CHIRPIER_EVENT_TRACKER_RULE = {
    condition: "gt",
    threshold: 0,
};
export const DEFAULT_CHIRPIER_EVENT_CHART_STATE = {
    range: "1h",
    aggregate: "sum",
    variant: "line",
    compare: false,
    header: true,
    view: "all",
    tracker: DEFAULT_CHIRPIER_EVENT_TRACKER_RULE,
};
