# Changelog

All notable changes to `@qazana/strata`. Semver: patch = fix, minor = additive
component/token, major = rename/removal/breaking token change.

## Unreleased

Accumulated since 0.0.1 and **not yet published** — the registry still has only
0.0.1. This will ship as one release: a **minor** (all additive kits plus fixes,
no breaking changes). Versioned + dated when actually tagged and published.

Internal (no API/output change):

- **Shared month-grid model.** The date maths (days-in-month, Monday-first first
  weekday, month roll, grid cells) was copied across the date picker, inline
  calendar, and date-range behaviors in `js/qazana.js`. Extracted to one pure
  `QZcal` model; the three behaviors are now adapters that render its cells and
  keep only their own selection/header. Date maths is now unit-tested directly
  (`harness/behaviors-forms.mjs` → "month-grid (QZcal)") rather than only through
  DOM clicks; rendered output is unchanged.

Additive — spacing scale densified + spacing fully tokenized:

- **Densified the spacing scale** with half-steps (`_5`, à la Tailwind 2.5/3.5)
  and three larger steps — added `--space-1_5`/`2_5`/`3_5`/`4_5`/`5_5`/`6_5`
  (6/10/14/20/28/40px) and `--space-8`/`9`/`10` (56/64/80px). Existing
  `--space-1…7` values are unchanged (non-breaking). Mirrored into
  `tokens.json` + regenerated the Figma export.
- **Tokenized box-model spacing in `kits/*.css`** — raw px in
  padding/margin/gap now references `--space-*` (script:
  `scripts/snap-spacing.mjs`). Exact matches are unchanged visually; off-scale
  values (18/9/11/7/5/13/22/26…px) were **snapped to the nearest step, ties
  rounding up**, a deliberate spacing-rhythm tightening. Borders, box-shadows,
  transforms, dimensions, radii and 1–2px optical nudges were left untouched.
  Net effect is a slightly roomier, on-scale rhythm; visual baselines
  recaptured. The intentional control-density tokens
  (`--ctl/--btn/--row/--cell-pad`) are unchanged.
- **Positioning offsets stay literal px.** `top`/`right`/`bottom`/`left`/`inset*`
  are placement/geometry, not rhythm — an earlier pass tokenized them, which
  shifted absolutely positioned glyphs (the checkbox checkmark, `.split .resizer`
  bar, `.toast-host` corners). Reverted all 53 to their exact original px and
  excluded these properties from the tokenizer.

Fixes:

- **Drawer header/body/footer were unstyled.** `.mh`/`.mb`/`.mf`/`.mclose` were
  scoped to `.modal-dialog` only, so a `.drawer` reusing the same markup got no
  padding/borders. Broadened to `:is(.modal-dialog,.drawer)`.
- **`.split` resizer didn't size or drag.** `.split` was `display:grid` while the
  `.resizer` sizes via `flex-basis` and the drag JS sets `flex` on the previous
  pane — so the handle was ignored and the detail pane wrapped to a second row.
  Switched `.split` to `display:flex` (`.split-list` `flex:0 0 240px`,
  `.split-detail` `flex:1`; mobile stacks via `flex-direction:column`).

- **Article layout spine was misaligned.** `.doc-layout` (content kit) used a
  `1fr 220px` grid, so the prose sat in the left column ~130px left-of-centre
  while the article head, hero, and footer were all centred — the body jutted
  out and lined up with nothing. Simplified `.doc-layout` to a single centred
  reading column (740px) on the same spine as the head/footer, and **dropped the
  TOC from the article** — a centred reading column plus a beside-the-body TOC
  can't both fit under ~1250px, and articles are short. The scrollspy TOC rail
  remains the docs kit's job (`.doc-shell`); `.toc` is unchanged there. Added
  `demo/content/article.html` to the a11y + visual harnesses (it was uncovered,
  which is why this slipped through).

Demos:

- **Survey / questionnaire use case** (`demo/app/survey.html`) — a multi-step
  questionnaire showing how to *compose* existing primitives (no new component):
  the `[data-wizard]` stepper drives the flow; questions use `.choice` radios
  (single-select), `.choice` checkboxes (multi-select), an inline Likert scale
  built from `.choice.inline` radios, and a text field. Added to the demo index
  and the a11y + visual-regression harnesses.

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
  surfaces.
- Extended the same self-spacing safety net to the **notice/feedback block**
  family — `.alert`, `.banner`, `.empty` (App kit) and `.bill-banner` (Billing
  kit) — since these are emitted standalone and were collapsing when stacked
  bare. Neutralized inside the layout primitives plus the `.demo` gallery
  wrapper. Scoped to free-standing surfaces only: row/list families that ship
  inside a dedicated gap container (`.upload-row`/`.upload-list`, `.msg`/
  `.thread`, etc.) are intentionally excluded to avoid double-spacing, as are
  `.prose .callout` (already spaced by `.prose > * + *`).
- Tokenized a stray `margin-bottom:18px` literal on the auth `.form-msg` banner
  (`auth.css`) to `var(--space-4)` — off-scale px snapped to the spacing scale,
  per the tokens-are-the-source-of-truth rule.

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
