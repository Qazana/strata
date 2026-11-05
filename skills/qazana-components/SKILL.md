---
name: qazana-components
description: Use when building or extending UI in an app that consumes @qazana/strata, including components, product themes, generic-versus-domain decisions, and token discipline.
---

# Working with Strata components

Strata owns generic UI, shared tokens, and vanilla DOM behaviors. Each consuming
app owns its theme and domain components. Read the library's
[API contract](../../docs/API_CONTRACT.md) before changing public surfaces.
Maintenance rules live in [AGENTS.md](../../AGENTS.md); examples and references
start at [docs/README.md](../../docs/README.md).

## Choose where the component belongs

A reusable button, table, or dialog belongs in Strata. Add a missing generic
component here before consuming it. A component that encodes product vocabulary
or business logic belongs in the product repo, styled with shared tokens.

## Load the library

Use package exports in a bundler's browser entry:

```js
import '@qazana/strata/tokens';
import './theme.css';
import '@qazana/strata/app';
import '@qazana/strata';
```

For plain HTML, copy `tokens`, `kits`, `fonts`, and `js` to a public
`/vendor/strata/` directory, preserving their relative paths. Use those public
URLs in `href` and `src`; browsers do not resolve npm export names there.

The script initializes existing markup. After a framework mount or dynamic
insertion, call `window.QZ.init(root)`. Calls are idempotent. When a framework owns
a control's state, omit its Strata behavior hook and maintain the documented
ARIA relationships yourself.

## Use tokens

Use variables for colors, radii, spacing, shadows, fonts, and durations. Name
brand colors semantically: `--primary`, `--danger`, `--warning`, `--info`,
`--accent`. Tints use channels such as `rgb(var(--primary-rgb) / .12)`.

Use `--display` for large headings, `--body` for controls and copy, and `--mono`
for data or code. Route control sizes through density tokens. Animations must
respect `prefers-reduced-motion`.

Product theme files stay in the product repo. Override a solid color, its RGB
channels, and its foreground together; check bright variants and focus colors.
Test explicit light/dark themes and OS-selected mode. Tokens set `color-scheme`
for native controls. See [Figma](../../docs/figma.md) for token export instructions.

## Choose an entry

Main kits: `app`, `site`, `content`, `auth`, `media`, `commerce`, `billing`, `docs`,
`support`, and `email/*`. Load only the kits needed by the page.

The `tabs` and `accordion` component exports require shared tokens. Direct imports
are unlayered and omit the App kit's page reset. The experimental `button` export
uses namespaced classes and local tokens. Check [the changelog](../../CHANGELOG.md)
for release availability before suggesting a new export to a published consumer.

## Maintain the library

Update the demo, reference docs, and docs-site examples with each component
change. If tokens change, update `tokens/tokens.json` and regenerate
`tokens/tokens.figma.json` with `node scripts/figma-tokens.mjs`. Run
`npm run build:button` after editing canonical button rules or tokens.

Add an entry under **Unreleased** in `CHANGELOG.md`, classified as patch, minor,
or major. Bump the package version only when tagging and publishing a release.
Renaming or removing a stable token, class, export, markup pattern, or hook is
breaking. Follow the [harness guide](../../harness/README.md) for verification
and visual baseline review.

For demo chrome inside a grid, declare known placement in CSS. A startup read of
`getComputedStyle(body).display` can miss a stylesheet that arrives later and
leave the navigation in a content column. The `auth demo navigation` regression
in `harness/release.mjs` loads the kit after the navigation script. It checks
column placement as well as overflow; a misplaced grid can still fit the viewport.

## Common integration mistakes

- Broad unlayered `a`, `button`, or `input` rules override layered kit components.
  Scope them or place app base styles in an earlier cascade layer.
- Use `.form-field` for new forms. Scoped auth `.field` is a wrapper.
- Popover classes carry positioning and shadows. Use documented inline variants
  for static content.
- Never copy demo-only helpers or private implementation functions into a product.
