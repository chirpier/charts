# Releasing `@chirpier/charts` and `@chirpier/embed`

## Package Roles

- `@chirpier/embed`: framework-agnostic source of truth for the hosted iframe client
- `@chirpier/charts`: React wrapper built on top of `@chirpier/embed`

Release them together when the shared client API changes.

## Versioning Policy

- Keep `@chirpier/embed` and `@chirpier/charts` on the same version for now.
- Bump both packages in the same PR.
- Use semver across both packages:
  - patch: fixes, docs, tests, non-breaking internal changes
  - minor: new non-breaking options, events, helpers
  - major: protocol or API breaking changes

## Release Checklist

1. Update versions in `package.json` and `embed/package.json`
2. Update docs/examples if the public API changed
3. Run `npm install` in the repo root if dependencies changed
4. Run `npm run release:check`
5. Review `npm pack --dry-run` output for both packages
6. Publish `@chirpier/embed` first
7. Publish `@chirpier/charts` second

## Commands

From the repo root:

```bash
npm run release:check
```

Publish order:

```bash
npm --prefix ./embed publish
npm publish
```

If you want a manual preflight only:

```bash
npm run pack:embed
npm run pack:react
```

## Notes

- `@chirpier/charts` depends on `@chirpier/embed`, so publish `@chirpier/embed` first.
- Keep the iframe protocol changes documented in both package READMEs when behavior changes.
