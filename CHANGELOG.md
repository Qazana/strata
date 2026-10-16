# Changelog

All notable changes to `@qazana/strata`. Semver: patch = fix, minor = additive
component/token/kit/behavior, major = rename/removal/breaking public contract
change. Versions here always match what's published on the registry.

## Unreleased

### Minor

- Focus: new `--focus-ring`, `--focus-ring-width` and `--focus-ring-offset`
  tokens, and one `:focus-visible` outline in `base.css` for buttons, links,
  `summary`, checkboxes, radios, ranges, `tabindex="0"` and interactive ARIA
  roles. Before this, most controls fell back to the browser's default ring.
  This changes how focus looks everywhere (observable, not breaking). Override
  `--focus-ring` to re-colour it per app.
- Harness: `npm run focus` (now part of `npm test`) tabs through every demo
  page in both schemes and fails on a missing, browser-default or sub-3:1 focus
  indicator.

### Patch

- Focus fixes where keyboard focus was invisible or close to it: `.switch`,
  `.check`/`.choice`, table select checkboxes, `.tree-row`, confirm-dialog
  buttons, `input.slider`, `.dual` range (now Firefox too), `.stepper` and
  billing `.stepper` inputs, commerce `.qty` and `.card-field`, the support
  `.composer`, and docs `.help-search`. These relied on the 15% `--primary-ring`
  halo alone, which measures about 1.3:1.
- Focus: `.btn-group`, `.stepper`, billing `.stepper` and commerce `.qty` no
  longer use `overflow:hidden`, which clipped the ring. Their end children now
  round their own corners.
- Forms: a focused `input.is-success` showed the danger ring. Fields in an
  error or success state now thicken their state border on focus, so focus
  shows on top of the state ring.
- Focus: content no longer looks like a control. Headings, landmarks and
  modal or drawer panels focused by script (`tabindex="-1"`) show no ring,
  which also hides the browser's default one. Scroll containers and tab panels
  get a quiet 1px line instead of the full ring.
- Tabs: `[data-tabs]` makes a panel a Tab stop only when it has no controls of
  its own, as the ARIA tabs pattern advises. Panels with controls no longer add
  an extra stop before their first control.
- Docs: `figma.md` gave the `-ring` tint as 22%. The code has always used 15%.

- Docs: tagline unified to **"One style base. No build step, no framework."**
  across the README, package description, docs-site config + landing hero, and
  the demo landing page. "Token" stays the technical term in prose but is now
  defined in plain language at first use (named design decisions — color,
  spacing, type, motion — stored as CSS variables). Also fixed the demo hero
  note's stale "v0.0.1 · 7 kits" → "v1.0.0 · 10 kits".
- Docs site: now serves `/llms.txt`, `/llms-full.txt` and `/llms-small.txt`
  (via `starlight-llms-txt`) so coding agents can read the docs as plain
  markdown. `llms.txt` opens with the core usage rules and links the API
  contract.
- Docs site: fixed internal links that still carried the old `/strata/` base
  path and 404'd since the move to `strata.docs.qazana.net`.
- Docs site: added the missing `favicon.svg` (the Strata mark, using the
  token colors for the dark and light schemes).
- Docs site: upgraded to Astro 7.3 and Starlight 0.42, which clears the open
  Astro security advisories. The docs build now needs Node 22.12+. The docs
  site is not part of the published package, so consumers are unaffected.

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
