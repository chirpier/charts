# @chirpier/charts

React wrapper for the hosted Chirpier public event embed runtime.

This repo now contains two package entrypoints:

- `@chirpier/charts`: React wrapper
- `@chirpier/embed`: framework-agnostic client in `embed/`

The React package now consumes the shared client definitions and runtime from `embed/`, so the non-React package is the source of truth.

## Install

<!-- docs:start install -->
```bash
npm install @chirpier/charts
```
<!-- docs:end install -->

For non-React dashboards, install `@chirpier/embed` instead.

## Usage

<!-- docs:start react-usage -->
```tsx
import { ChirpierChart } from "@chirpier/charts";

export function RevenueWidget() {
  return (
    <ChirpierChart
      eventId="your-event-id"
      shareToken="your-share-token"
      range="1d"
      compare
      header={false}
      view="timeseries"
      variant="line"
      autoResize
      minHeight={320}
      theme="light"
      loadingFallback={<div>Loading chart...</div>}
      onError={(error) => {
        console.error(error.code, error.message);
      }}
    />
  );
}
```
<!-- docs:end react-usage -->

## Framework-Agnostic Client

<!-- docs:start framework-agnostic -->
```ts
import { mountChirpierChart } from "@chirpier/embed";

const chart = mountChirpierChart("#chart-root", {
  eventId: "your-event-id",
  state: {
    range: "1m",
    compare: true,
    view: "timeseries",
    variant: "bar",
  },
  autoResize: true,
});

chart.updateState({ range: "1w", compare: false, view: "summary" });
chart.updateTheme("light");
```
<!-- docs:end framework-agnostic -->

Use `@chirpier/embed` for vanilla JS, Web Components, or framework wrappers outside React.

## Period Semantics

The charts layer may expose UI date-range shortcuts like `30d`, but the Chirpier backend rollup contract remains:

- `minute`
- `hour`
- `day`

Treat date ranges as chart/embed filters and backend periods as separate concepts.

## Examples

- React example: `examples/react-basic/App.tsx`
- Vanilla example: `examples/embed-basic/index.html`

## Release Workflow

- `npm test`: runs embed client and React wrapper tests
- `npm run release:check`: runs tests, typechecks, builds, and `npm pack --dry-run` for both packages
- GitHub Actions config lives in `charts/.github/workflows/charts-ci.yml` and `charts/.github/workflows/charts-release-check.yml`
- Full release/versioning notes live in `docs/releasing.md`

## Props

- `eventId`: hosted event identifier
- `state`: canonical hosted event page state
- `range`, `aggregate`, `variant`, `compare`, `header`, `view`, `tracker`: optional React-only aliases that map into `state`
- `state.range`: hosted event range selector (`1h`, `1d`, `1w`, `1m`)
- `state.aggregate`: aggregate mode (`sum`, `average`)
- `state.variant`: timeseries variant (`line`, `bar`)
- `state.compare`: toggles previous-period comparison
- `state.header`: show or hide the hosted event header
- `state.view`: page view (`all`, `summary`, `timeseries`, `tracker`)
- `state.tracker.condition` / `state.tracker.threshold`: tracker rule configuration
- `autoResize`: sync iframe height to the hosted event content
- `loadingFallback` / `errorFallback`: optional React-only host fallbacks for load and error states
- `onRendered`, `onResize`, `onError`, `onInteraction`: lifecycle hooks

## Helpers

- `DEFAULT_CHIRPIER_EVENT_CHART_STATE`: canonical default embed state
- `DEFAULT_CHIRPIER_EVENT_TRACKER_RULE`: canonical default tracker rule
- `createChirpierChartState(input)`: merge partial chart state with the defaults

## Host Layout

Prefer bare usage in examples and app code:

```tsx
<ChirpierChart eventId="your-event-id" view="timeseries" variant="line" />
```

Keep titles, cards, placeholders, and branded empty states in the host app. Those concerns are app-specific, while `@chirpier/charts` is responsible for rendering and updating the hosted embed.

## Public Event Embeds

- `@chirpier/charts` embeds the hosted public page at `/events/:eventId`.
- Initial chart state comes from canonical event-page URL params derived from `state`.
- Runtime updates use iframe reloads for canonical state changes and `postMessage` for resize and theme changes.
