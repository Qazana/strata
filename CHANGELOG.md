# Changelog

All notable changes to `@qazana/strata`. Semver: patch = fix, minor = additive
component/token/kit/behavior, major = rename/removal/breaking public contract
change.

## Unreleased

### Documentation

- **Public API contract.** Added `docs/API_CONTRACT.md` to define Strata's
  stability tiers, semver-protected surfaces, deprecation policy, behavior
  contract, token contract, and consumer responsibilities. Contract: stable
  governance addition.
- **Kit stability labels.** The README now marks every exported, documented kit as
  a stable public entrypoint and links contract changes to the API contract.
  Contract: stable behavior preserved.
- **Form vocabulary policy.** Clarified that `.form-field` is canonical for new
  forms while `.field-row`/`.fld`/`.ferr` and scoped auth `.field`/`.err` remain
  legacy-compatible until a documented major release. Contract: legacy aliases
  preserved.
- **Consumer integration checklist.** Added load-order, version-pinning,
  cascade-safety, and public-surface guidance for downstream apps. Contract:
  stable guidance addition.

### Minor

- **Form behaviors** (base). Four generic, opt-in, data-attribute behaviors in
  `js/qazana.js` driving new universal classes in `base.css`:
  `data-persist` (autosave/restore non-sensitive fields across reload — password/file
  inputs and `pass|card|cvv|cvc|ssn|secret|token|otp|pin` names are never stored; backed
  by a shared namespaced `QZstore` helper, local|session scope), `data-autosize`
  (textarea grow-to-fit), `data-char-count` (live `n / max` counter, `.char-count` /
  `.is-near`), and `data-submit-lock` (disable + `.is-loading` spinner + `aria-busy` on a
  valid submit to block double-submits; numeric value auto-unlocks).
- **`[data-validate]` rebuilt on the native Constraint Validation API.** Now supports
  `required` / `type=email|url` / `minlength` / `maxlength` / `pattern` / `min`/`max`/`step`
  plus cross-field `data-match`, friendly messages (`data-msg` / `data-msg-match`), blur
  validation after touch with live-clear, inline positive feedback (`.is-success` on a valid
  non-empty field), an async/remote seam via `setCustomValidity`, and proper `aria-invalid` +
  `aria-describedby` wiring. A valid submit submits normally; an action-less form stays put
  and only shows the inline `.form-msg.ok` when opted in with `data-validate="confirm"` (so a
  JS-handled form never gets an uninvited success banner). **Fix:** the engine had drifted from
  the documented canonical vocabulary — it now drives `.form-field`/`.field-error`/`.is-error`
  while still resolving the legacy `.field-row`/`.ferr`.
- **i18n seam for the JS behaviors.** All built-in UI strings (`validate` messages, `confirm`
  button/title defaults, `relative-time` units/phrases) read from a shared `QZi18n` table;
  setting `window.QZi18n` before the script loads deep-merges overrides, so non-English
  consumers retheme copy without forking the engine. Per-element `data-*` overrides still win.
- **`[data-qz-confirm]`** (base). Accessible replacement for the blocking native `confirm()`:
  intercepts a link/button click and asks in a body-level `role="alertdialog"` (focus-trap,
  Esc/Cancel/backdrop dismiss, focus restore), re-activating the original element on Confirm
  (submit buttons via `form.requestSubmit()`). `data-qz-confirm-ok`/`-cancel`/`-danger`. New
  `.qz-confirm*` classes. Namespaced `data-qz-*` to avoid colliding with Rails UJS's
  `data-confirm`.
- **`[data-clamp]`** (base). Read-more line clamp to N lines with an accessible
  `.clamp-toggle` (`aria-expanded`), omitted when content already fits; measured after
  `document.fonts.ready` and re-measured when first revealed (IntersectionObserver).
- **`[data-qz-dismiss]`** (base). Dismisses (and optionally remembers, keyed, via `QZstore`) an
  `.alert`/`.banner`/`[data-dismissible]` or the attribute's target. Namespaced `data-qz-*`
  to avoid colliding with Bootstrap's `data-dismiss`.
- **`[data-relative-time]`** (base). Renders "3h ago" / "in 2 days" from a `<time datetime>`
  via `Intl.RelativeTimeFormat` (true localization; QZi18n fallback on older engines),
  refreshing each minute, keeping the absolute time as `title`.
- **Lightbox deep-linking** (Media kit). A `[data-lightbox]` gallery with an `id` now writes
  `#lightbox=<id>/<index>` to the URL, so the viewer is shareable: a shared link opens it on
  load, navigating updates the hash, and the browser Back button closes it. Hash-based to stay
  router-agnostic.
- **Gallery + lightbox** (Media kit). `.media .gallery` responsive tile grid (`.tile`,
  `.tile-cap`, `.tile-badge`) and a `data-lightbox` behavior that builds one full-screen
  viewer at `<body>` level — images **or** video (`data-type="video"` / `.mp4|.webm|.mov|.m4v`),
  prev/next + counter, keyboard (←/→/Esc), focus trap + restore, scroll-lock, `role="dialog"`.
  Re-authored generically from an earlier prototype's Flickr-specific PhotoGrid/ImageViewer (no domain
  logic). Dark chrome uses the kit's intentional black/white constants.
- **Tooltips unified + context-aware.** Both `[data-tip]` (text) and `.tip`/`.tip-pop`
  (rich) now run through one engine in `js/qazana.js` that renders a single floating
  node at `<body>` level (`position:fixed`) — so tooltips **escape `overflow:hidden`/
  transformed ancestors** and **auto-flip/shift** near viewport edges. `data-tip-pos`
  becomes the *preferred* side (backward compatible; default top). Pure-CSS rendering
  is kept as the no-JS fallback, suppressed by `.qz-tip-js` on `<html>`. WCAG 1.4.13:
  Escape-dismissible, `aria-describedby`, rich tips hoverable; respects reduced-motion.

### Demo

- Added a fictional **Material** example theme (`demo/themes/material.css`)
  modelling Material 3 — tonal-purple primary, mauve tertiary, Roboto, 12px
  radius, dual-layer elevation shadows; light-oriented. Registered in the brand
  picker (`demo-nav.js`) and the theme switcher. Demo-only; not shipped in the
  package.

### Minor

- **Checklist** (`.checklist`) — tickable to-do list in the App kit. Reuses the
  existing `.check` checkbox; the done state (dim + strike-through) is pure CSS off
  `input:checked`, no new behaviour JS.
- **Setup card** (`.setup-card`) — onboarding/setup checklist card: header with a
  progress bar (`.setup-prog`, `role="progressbar"`) and `.setup-list` task rows
  (`.done` state, `.sc-ic` check, `.sc-body`, trailing `.btn` action). Progress is
  author-set markup. No new tokens.

### Patch

- **Scroll-lock unified + clobber fixed.** Modal, command palette, nav-drawer, lightbox,
  and confirm now share one ref-counted `QZscroll` body-scroll lock instead of each
  blindly setting `overflow`/`padding-right` and resetting to `''` on close. Fixes two
  bugs: stacked overlays (a confirm over a modal) no longer restore each other's scroll
  state prematurely, and a consumer's pre-existing inline body `overflow`/`padding-right`
  is captured and restored rather than wiped. Surfaced by the dual-voice plan review.
- Video player a11y: `.pcontrols` gained a dark scrim gradient so the white control
  chrome (`.ptime`, icons) keeps AA contrast over a light theme / any video (it was
  failing color-contrast on light), and the audio `.atrack` progressbars got an
  `aria-label` (were failing `aria-progressbar-name`). Surfaced by gating `media/index`
  in the a11y harness.
- Softened the focus ring: `--primary-ring` alpha .22 → .15 and the input/control
  ring spread 3px → 2px (17 rules) so forms and focusable controls glow less.
  Validation (`.is-error`/`.is-success`) rings unchanged.
- `.alert` text (`.at`/`.am`) now wraps long unbreakable tokens (URLs, signatures):
  `overflow-wrap:anywhere` + `min-width:0` on `.alert` so it also breaks when the
  alert is a flex/grid item (where `min-width:auto` previously forced overflow).
- Status dot (`.dot.ok/.warn/.down/.idle`) gains a trailing `margin-inline-end`
  so an inline dot no longer butts its label; flex-gap rows (`.svc-row`,
  `.jobrow`, `.split-item .si-name`) and the positioned avatar overlay reset it,
  and the bare `.dot` separator is untouched.
- Replaced `transition:all` (5 spots: `.remember input`, `.kit-nav a`, `.btn-icon`,
  `.blog .cat`, `.blog .pager a`) with explicit property lists so only the properties
  that actually change animate — no unintended transitions or extra repaints. Same
  visible behaviour and durations; tokenized two stray `.18s` → `var(--dur-2)`.
- Tightened `--leading-tight` 1.1 → 1.05 so large headings (`.t-display`, `.t-h1`,
  `.t-h2`) sit closer; loose line-height read as too airy at display sizes. Token
  value tweak (no rename/removal) — synced `tokens.json`, regenerated the Figma
  export, and updated the typography demo swatch label.

## 0.1.0 — 2026-06-22

First tagged release since 0.0.1. **Minor** — additive (three new kits: Billing,
Docs, Support; a densified spacing scale) plus fixes and internal refactors. No
breaking token changes (no renames or removals).

Internal (no API/output change):

- **Shared month-grid model.** The date maths (days-in-month, Monday-first first
  weekday, month roll, grid cells) was copied across the date picker, inline
  calendar, and date-range behaviors in `js/qazana.js`. Extracted to one pure
  `QZcal` model; the three behaviors are now adapters that render its cells and
  keep only their own selection/header. Date maths is now unit-tested directly
  (`harness/behaviors-forms.mjs` → "month-grid (QZcal)") rather than only through
  DOM clicks; rendered output is unchanged.
- **Shared harness runtime + page manifest.** The throwaway static server + MIME
  map was copied verbatim across seven harness files; three `PAGES` lists had
  diverged (which is how `app/survey` got into the a11y + visual gates but not
  the screenshot sweep). Extracted `harness/_serve.mjs` (one `makeServer`) and
  `harness/_pages.mjs` (one tagged manifest; `a11y`/`visual`/`shoot` derive their
  lists via `pagesFor(tag)`). Adding a demo is now one tagged row. Verified the
  derived lists reproduce all three originals exactly before switching over.
- **Token drift guard extended to the space scale.** The contract test only
  enforced colour-group sync between `qazana.tokens.css` and `tokens.json`, so
  space/radius/type could drift silently (nine space tokens were recently
  hand-added to both files unguarded). Added a `space-sync` check that mirrors
  the scale by **name and value**, bidirectionally (incl. underscore half-steps
  like `--space-1_5`). (Full single-source generation of `tokens.json` from the
  CSS remains a larger follow-up — the value bridge is non-trivial.)

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

- **Alerts/banners/empty-states no longer butt against neighbouring elements.**
  The self-spacing rule only added margin between *consecutive* notices
  (`.alert + .alert`), so a lone alert dropped next to a heading or paragraph
  still collapsed against it. The notice blocks now carry their own
  `margin-block` (margins collapse, so stacked notices still read as one gap),
  neutralized inside the layout primitives + `.demo` wrapper so wrapping never
  double-spaces.
- **`.auth .btn` no longer defaults to full width.** It was the only `.btn` in
  any kit that set `width:100%` by default; now it's `inline-flex` and full-width
  is contextual (`.auth form .btn`, `.auth .oauth .btn` — the narrow form + the
  OAuth grid), matching how every other kit treats full-width as opt-in. The
  form/OAuth buttons render identically; a stray `.auth .btn` is now inline, and
  the `.approw` action button's `margin-inline-start:auto` right-align finally
  works (it was being stretched to 100%).
- **Removed decorative gradients across the kits** (de-AI'd aesthetic). Dropped
  the radial "glow" atmosphere (app `.bg-layer`/`.glow` blobs; site body +
  hero/spotlight/CTA/work glows; auth split-panel glows; media player/thumb +
  album-art radial; content thumb/hero glows) and the soft fade overlays (the
  `.divider` fade → solid rule, the `.log` bottom fade, the video scrim).
  **Kept** gradients that *render a component or encode data* — they're not
  decoration and break if removed: the conic progress ring, the volume-slider
  fill, the swatch/sold-out diagonal, the `.grid-overlay` line texture, and the
  skeleton-shimmer animation.
- **Direction toggle icon now reflects state.** `[data-dir-toggle]` showed a
  static, ambiguous swap glyph (`fa-right-left`); it now mirrors the theme
  toggle's sun/moon pattern — `fa-align-left` in LTR, `fa-align-right` in RTL —
  synced by the dir controller (guarded to only manage the align glyphs, so a
  deliberately chosen icon is left alone). Demo updated to seed `fa-align-left`.
- **Table headers jammed against the top edge.** The hand-authored list tables —
  `.support .ticket-list th` and `.billing .invoices th` — had `padding-top:0`
  (3-value shorthand) while their rows had 14px, so the column labels had no
  breathing room above. Gave both headers symmetric padding (`var(--space-2_5)`
  top/bottom). (The App-kit `table.tbl` already used the symmetric density
  tokens; only these two copies had the bug.)
- **Docs help-center search** focus showed a doubled ring — the wrapper's
  `:focus-within` ring *plus* the inner `<input>`'s own `:focus-visible` glow
  (every input gets one from base.css), reading as a "blue inner border that
  glows". The wrapper now owns the single ring: killed the inner input's
  box-shadow + `surface-active` on focus (the App kit's `.input-group` pattern),
  and dropped the wrapper's border recolor. Visible focus preserved.
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

- **`strata.html` kit gallery + stat-band.** The kit gallery reused the shared
  square `.work` portfolio tile (`aspect-ratio:4/3` → too tall, ~270px); gave
  strata a page-scoped compact tile instead (auto height ~123px, left-aligned
  icon/title/sub, `auto-fit` grid) — the shared `.work` is left untouched for
  the agency portfolio. Listed all **10 kits** (added Billing/Docs/Support; was
  a stale 7) and fixed the stale "7 kits" stat → 10. Also widened the shared
  `.stat-band` gap (`--space-4_5` → `--space-6_5`, 20→40px) to space the stats.
- **Logo wordmark de-gimmicked.** Dropped the accent-coloured last-letter span
  (`Qazan<span class="mk|brand-8">a</span>` → `Qazana`) across all demo headers
  and footers (46 wordmarks, 39 files) and the Strata wordmark on `strata.html`
  — a uniform wordmark instead of the templated coloured-final-letter tell. Also
  completed the admin sidebar logo's empty `.word-txt` (`azana`) so it reads
  "Qazana" in HTML (collapsing to the "Q" monogram), no JS needed.
- **New example theme `cedar`** (`demo/themes/cedar.css`) — a fictional demo
  brand deliberately designed *against* generated-UI tells: Bricolage Grotesque
  display (not Inter/Roboto/Space Grotesk), a committed pine-green dominant + a
  sharp brass accent (not violet gradients / SaaS-blue / mint / timid pastels),
  on the warm cream scheme. One `:root` override; wired into the theme switcher.
- **Survey / questionnaire use case** (`demo/app/survey.html`) — a multi-step
  questionnaire showing how to *compose* existing primitives (no new component):
  the `[data-wizard]` stepper drives the flow; questions use `.choice` radios
  (single-select), `.choice` checkboxes (multi-select), an inline Likert scale
  built from `.choice.inline` radios, and a text field. Added to the demo index
  and the a11y + visual-regression harnesses.
- **Unified demo navigation** (`demo/demo-nav.js`, demo-only — not in the
  published package). Every demo page previously had its own ad-hoc header (no
  consistent "home", brand pointing at different places, kits siloed). One
  injected top bar now gives every page the same chrome — *All demos* (home),
  a kit switcher, the current kit's pages, and a theme toggle — above each kit's
  own header. Single-source (one script + manifest); self-styled with tokens;
  spans grid/flex-bodied layouts (auth) and sits below kit overlays. Also fixed
  a broken `content/blog.html` footer link (`site.html` → `../site/landing.html`).
  The bar also carries a **brand-theme picker** — swap any example brand
  (qazana/aurora/vermeil/nocturne/cedar) onto any demo page (swaps the `theme.css`
  override, lazy-loads non-self-hosted display fonts, applies the brand's scheme,
  persists across pages). Suppressed on `themes/index.html` (its own switcher).

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
