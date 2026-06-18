# Changelog

All notable changes to `@qazana/strata`. Semver: patch = fix, minor = additive
component/token, major = rename/removal/breaking token change.

## 0.3.2 — 2026-06-18

- Content `.prose h1` was unstyled (browser default — no design-system tracking,
  line-height, scale step, and a stray UA top margin). Added the display-face
  title treatment (`clamp(1.9–2.4rem)`, `--display`, tight tracking, `margin-top:0`)
  so article/help-article titles read as the top of the hierarchy above the
  body-font section headings. Affects every prose article (Content + Docs kits).

## 0.3.1 — 2026-06-18

Aesthetic refinement (no API changes):

- Removed coloured left-accent border stripes in favour of the repo's established
  pattern (full subtle tint + coloured title/filled-pill active state): content
  `.callout` (note/tip/warn) and the docs sidebar/TOC active states no longer use
  a coloured side border. Tinted chip/title text now mixes toward `--text` via
  `color-mix` so it clears AA contrast in both themes.

## 0.3.0 — 2026-06-18

Additive: a new **Support kit** (`@qazana/strata/support`, scope `.support`). No breaking changes.

- **Support kit** — helpdesk surface, standalone on base.css: a contact/ticket
  form (reusing base form controls) with attachment dropzone and a confirmation
  state; a ticket-list table with status badges (open/pending/solved/closed) and
  priority dots (low/normal/high/urgent); and a ticket-detail view with a
  conversation thread of stacked message cards (customer / agent / internal-note
  variants), a reply composer, and a canned-reply (macro) picker.
- **Zero new behavior JS** — the macro picker is a native `<details>` dropdown;
  status/priority are CSS-only. No SLA timers, agent routing, live send, or
  ticketing backend — those are per-product/helpdesk concerns kept out of the kit.

## 0.2.0 — 2026-06-18

Additive: a new **Docs kit** (`@qazana/strata/docs`, scope `.docs`). No breaking changes.

- **Docs kit** — documentation surface that **pairs with the Content kit** (load
  `content.css + docs.css`): a 3-column doc shell (collapsible sidebar nav, prose,
  TOC), stacked API-reference blocks (verb badges, params tables, request/response
  samples), a version/locale switcher, prev/next pager, and a help-center landing
  (search hero, category grid, popular articles, breadcrumb, "was this helpful?",
  related articles). The reading column reuses content.css's prose/callouts/code.
- **Zero new behavior JS** — sidebar nesting is native `<details>` (correct nav
  ARIA, not a tree widget); the TOC reuses the existing `[data-toc]` scrollspy.
  Search is a provider hook (Algolia/Pagefind), not a baked modal.
- Also linked the previously-missing **Commerce** kit in the docs-site sidebar.

## 0.1.0 — 2026-06-18

Additive: a new **Billing kit** (`@qazana/strata/billing`, scope `.billing`) —
the eighth kit. No breaking changes.

- **Billing kit** — in-product subscription surfaces, themed by the same tokens:
  current-plan summary (+ trial), plan switcher with a monthly/annual cycle
  toggle and inline proration confirm, invoice history with five status states
  (paid / open / past-due / refunded / void), saved-state payment-method cards,
  metered usage → cost with an over-limit upgrade nudge, a dunning
  (failed-payment) banner, seat management, and a retention-framed cancel modal.
  Money is always static markup — no currency math or `Intl` in the kit.
- **Behavior** — one new vanilla controller, `[data-billing-cycle]`: a
  monthly/annual radiogroup that flips `data-cycle` on a named target so CSS
  swaps the pre-rendered price spans. Cancel reuses `[data-modal-open]`; seats
  reuse `[data-stepper]`.
- **Boundary** — no payment processing, no provider SDK/iframe, no card
  validation, no plan/feature copy; those stay in the consuming app.

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
