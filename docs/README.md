# Documentation

These references describe the current checkout. Check [the changelog](../CHANGELOG.md)
for release availability; **Unreleased** changes are not yet published.

| Reference | Use |
| --- | --- |
| [API contract](API_CONTRACT.md) | Stable, legacy, experimental, and internal surfaces |
| [Upgrading](UPGRADING.md) | Update an existing consumer and verify it |
| [Components](components.md) | Classes, markup, behavior hooks |
| [Forms](forms.md) | Field anatomy, validation, persistence, submit locks |
| [Tabs and accordions](disclosure.md) | Component imports, keyboard behavior, spacing |
| [Standalone buttons](button.md) | Experimental button entry and local tokens |
| [Layout](layout.md) | Shared layout utilities |
| [Typography](typography.md) | Font roles and text sizing |
| [Figma](figma.md) | Generate and import design tokens |
| [Design philosophy](PHILOSOPHY.md) | Reasons behind the library conventions |

The [docs site](https://strata.docs.qazana.net/) adds installation guides and live
demos. Its source is `docs-site/src/content/docs/`. Keep examples there aligned
with these references when changing documented behavior.

## Building the site

```bash
npm --prefix docs-site ci
npm --prefix docs-site run build
```

The build copies demos and library assets into `docs-site/public/` and generates
`foundations/tokens.md` from `tokens/tokens.json`. Edit the source files, not those
generated copies. Build output and synced assets stay ignored.

## Maintenance and evidence

Follow [AGENTS.md](../AGENTS.md) and the [harness guide](../harness/README.md).
Record changes in the root changelog; the site's changelog page links to it.

Reviews are dated evidence, not the current API specification:

- [October code review](reviews/2026-10-16-code-review.md), with resolution status
- [November release fixes and validation](reviews/2026-11-05-release-fixes.md)
