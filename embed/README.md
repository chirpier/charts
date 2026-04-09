# @chirpier/embed

Framework-agnostic Chirpier hosted event embed client.

This package wraps the hosted public event page at `/events/:eventId`.

Use this package for vanilla JS, other frontend frameworks, or when building your own wrapper. Use `@chirpier/charts` only for the React component.

## Usage

```ts
import { mountChirpierChart } from "@chirpier/embed";

const chart = mountChirpierChart("#chart-root", {
  eventId: "your-event-id",
  state: {
    range: "1d",
    compare: true,
    view: "timeseries",
  },
  autoResize: true,
});

chart.updateState({ range: "1w", compare: false, view: "summary" });
chart.updateTheme("light");
```

## Public event embeds

- Public embeds are mounted with the hosted event `eventId`.
- Initial state comes from the canonical hosted event page `state`.
- Runtime updates reload the iframe for canonical state changes and use `postMessage` for theme and resize.

## Examples

- Vanilla example: `../examples/embed-basic/index.html`
- React wrapper example: `../examples/react-basic/App.tsx`

## Release

- Run `npm run pack` inside `embed/` to verify the package contents.
- Use the repo-level release flow in `../docs/releasing.md` when publishing both packages together.
