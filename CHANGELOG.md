# Changelog

All notable changes to `@qazana/strata`. Semver: patch = fix, minor = additive
component/token/kit/behavior, major = rename/removal/breaking public contract
change. Versions here always match what's published on the registry.

## Unreleased

### Patch

- Docs: tagline unified to **"One style base. No build step, no framework."**
  across the README, package description, docs-site config + landing hero, and
  the demo landing page. "Token" stays the technical term in prose but is now
  defined in plain language at first use (named design decisions — color,
  spacing, type, motion — stored as CSS variables). Also fixed the demo hero
  note's stale "v0.0.1 · 7 kits" → "v1.0.0 · 10 kits".

## 1.0.0 — 2026-07-04

First stable release, and the baseline for this changelog. Everything before
this point is pre-history; changes are logged in detail from here forward.

What ships in 1.0.0:

- **Tokens** — semantic design tokens (color, type, space, radius, elevation,
  density, motion) in `tokens/qazana.tokens.css`, mirrored in `tokens.json` and
  the Figma export. Two schemes (dark canonical, light), OS-auto by default.
  Everything lives in the `qazana` cascade layer so consumer CSS and per-product
  theme overrides always win. A product re-brands with a single `:root{}`
  override.
- **Ten kits** — App, Site, Content, Auth, Email, Media, Commerce, Billing,
  Docs, Support. Scoped, independently importable, all themed by the same
  tokens.
- **Behaviors** — one vanilla `data-*`-driven script (`js/qazana.js`), no
  framework dependencies, no build step. Public `QZ` namespace with
  `QZ.init(root?)` for markup rendered after load (SPA mounts, HTMX swaps);
  built-in UI strings are overridable via `QZi18n`.
- **Accessibility** — every interactive component is keyboard-operable with
  ARIA wiring; animation respects `prefers-reduced-motion`; the demo suite
  gates on axe (WCAG 2 A/AA) in both schemes.
- **Governance** — the public API contract (`docs/API_CONTRACT.md`) defines the
  semver-protected surfaces: exported kits, documented tokens, classes, DOM
  anatomy, and `data-*` hooks. `docs/UPGRADING.md` covers consumer upgrades.
- **Fonts** — self-hosted variable fonts (Figtree display, DM Sans body,
  JetBrains Mono data; Syne available) with metric-matched fallbacks.

## 0.0.1 — 2026-06-12

Early preview publish. Superseded by 1.0.0.
