# Changelog

All notable changes to `@qazana/strata`. Semver: patch = fix, minor = additive
component/token, major = rename/removal/breaking token change.

## Unreleased

Accumulated since 0.0.1 and **not yet published** — the registry still has only
0.0.1. This will ship as one release: a **minor** (all additive kits plus fixes,
no breaking changes). Versioned + dated when actually tagged and published.

Additive — three new kits since 0.0.1:

- **Billing kit** (`@qazana/strata/billing`, scope `.billing`) — in-product
  subscription surfaces, themed by the same tokens: current-plan summary
  (+ trial), plan switcher with a monthly/annual cycle toggle and inline
  proration confirm, invoice history with five status states (paid / open /
  past-due / refunded / void), saved-state payment-method cards, metered usage →
  cost with an over-limit upgrade nudge, a dunning (failed-payment) banner, seat
  management, and a retention-framed cancel modal. Money is always static markup
  — no currency math or `Intl`. One new vanilla controller `[data-billing-cycle]`
  (monthly/annual radiogroup flipping `data-cycle`); cancel reuses
  `[data-modal-open]`, seats reuse `[data-stepper]`. No payment processing,
  provider SDK/iframe, card validation, or plan/feature copy — those stay in the
  consuming app.
- **Docs kit** (`@qazana/strata/docs`, scope `.docs`) — documentation surface
  that **pairs with the Content kit** (load `content.css + docs.css`): a 3-column
  doc shell (collapsible sidebar nav, prose, TOC), stacked API-reference blocks
  (verb badges, params tables, request/response samples), a version/locale
  switcher, prev/next pager, and a help-center landing (search hero, category
  grid, popular articles, breadcrumb, "was this helpful?", related articles).
  Zero new behavior JS — sidebar nesting is native `<details>`, the TOC reuses
  `[data-toc]` scrollspy, search is a provider hook (Algolia/Pagefind). Also
  linked the previously-missing **Commerce** kit in the docs-site sidebar.
- **Support kit** (`@qazana/strata/support`, scope `.support`) — helpdesk
  surface, standalone on base.css: a contact/ticket form (base form controls)
  with attachment dropzone and confirmation state; a ticket-list table with
  status badges (open/pending/solved/closed) and priority dots; and a
  ticket-detail view with a conversation thread of stacked message cards
  (customer / agent / internal-note), a reply composer, and a canned-reply
  (macro) picker. Zero new behavior JS (macro picker is native `<details>`;
  status/priority are CSS-only). No SLA timers, agent routing, live send, or
  ticketing backend.

Fixes / refinements (no API changes):

- Removed coloured left-accent border stripes in favour of the repo's
  established pattern (full subtle tint + coloured title/filled-pill active
  state): content `.callout` (note/tip/warn) and the docs sidebar/TOC active
  states. Tinted chip/title text now mixes toward `--text` via `color-mix` so it
  clears AA contrast in both themes.
- Content `.prose h1` was unstyled (browser default). Added the display-face
  title treatment (`clamp(1.9–2.4rem)`, `--display`, tight tracking,
  `margin-top:0`) so article/help-article titles read as the top of the
  hierarchy. Affects every prose article (Content + Docs kits).
- Bare stacked card surfaces (`.card`, `.feature-card`, `.plan`, `.pack`) no
  longer collapse together. Added a `:is(...) + :is(...)` owl rule adding
  `--space-4` top margin (matching `.l-stack`'s default gap) between adjacent
  card surfaces, neutralized inside `.l-stack`/`.l-grid`/`.l-row` so wrapping
  never double-spaces. `.l-stack`/`.l-grid` remain the preferred path; this is a
  safety net for hand- or AI-authored markup. See `docs/layout.md` → Stacked
  cards.

## 0.0.1 — 2026-06-12

Initial release.

- **Tokens** — semantic design tokens (color, type, space, radius, elevation,
  density) with two schemes: Dark Knight (canonical dark) and Désert Dunes
  (light), OS-auto by default. All token and kit CSS lives in the `qazana`
  cascade layer, so unlayered consumer CSS and per-product theme overrides
  always win.
- **Seven kits** — App, Site, Content, Auth, Email, Media, Commerce. Scoped,
  independently importable, all themed by the same tokens.
- **Behaviors** — one vanilla `data-*`-driven script (`@qazana/strata`), no
  framework dependencies, no build step.
- **Theming** — a product re-brands everything with a single `:root{}` override
  (`--primary` + channel triple, fonts). Self-hosted variable fonts (Figtree
  display, DM Sans body, JetBrains Mono data; Syne available) with
  metric-matched fallbacks for ~0 CLS.
- **Demos as the live spec** — every kit and variant under `demo/`, including
  a live theme switcher with fictional example brands.
