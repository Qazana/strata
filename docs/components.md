# Component reference

Every generic component in the library. Classes are vanilla CSS; `data-*` hooks
are wired by `js/qazana.js` on load. The **demo** (`demo/`) is the live spec —
it shows every variant/state. Reduced-motion is respected throughout.

> Tokens are the contract — style with `var(--…)`, never hardcoded values. Brand
> colors are themeable (`--primary`, `--danger`, `--warning`, `--info`, `--accent`).

---

## Foundations
`tokens/qazana.tokens.css` — color (+ `-rgb` channels for tints), surfaces
(`--surface{,-2,-3}`, `--surface-sunken`), `--border-rgb` (line/border channel),
`--radius-{sm,,lg,pill}`, `--shadow{-sm,,-lg}`, `--space-1…10` (+ `_5` half-steps), `--display/--body/--mono`,
`--ease`, `--dur-1…3`. Dark is canonical; light is opt-in via `html[data-theme="light"]`
(or auto via `prefers-color-scheme`) — the tokens set `color-scheme` for you. Override
brand tokens in a `themes/<app>.css`; a `[data-theme-toggle]` button flips the scheme.

## Responsive / breakpoints
Standardized scale (by **convention**, since `var()` does not work inside `@media`
conditions): **sm 640 · md 768 · lg 1024**. New mobile rules use `max-width:640px`.
Existing per-component collapse points (auth two-column at 860, site grids at 880,
docs TOC at 920) are kept where the design needs them.
- Every demo is rendered at **390px (phone) and desktop, in both themes** by the
  harness, which fails on any horizontal page overflow (`scrollWidth > clientWidth`).
- Grid/flex children that hold content carry `min-width:0` so a wide descendant can't
  force horizontal overflow (the classic "grid blowout").
- Long display headings use `overflow-wrap:break-word`; horizontal strips (steps,
  admin sidebar rail, tables) scroll internally rather than widening the page.

## Direction (RTL)
Every kit is direction-aware: set `dir="rtl"` on `<html>` and the whole library
mirrors. The rules, in order of preference:
- **Logical properties by default** — `margin-inline-start`, `inset-inline-end`,
  `border-inline-start`, `padding-inline`, `text-align:start/end` — never physical
  `left/right` for anything that should mirror.
- **Physical stays physical where direction doesn't apply**: centering
  (`left:50%` + `translateX(-50%)` is symmetric), up/down chevrons and tooltip
  arrows (rotated-square border tricks are physical geometry), cursor-anchored
  positioning (context menu).
- **`[dir="rtl"]` refinements** (end of `app.css`, plus one in `base.css`) cover
  what logical properties can't express: the switch knob's `translateX` travel,
  drawer slide-in keyframes, the command-palette accent stripe (inset
  `box-shadow`), side-positioned tooltips/popovers, and the native `<select>`
  chevron (`background-position` has no logical form).
- JS-driven geometry uses logical insets too (dual-range fill sets
  `insetInlineStart/End`, matching the natively-mirroring range inputs).
- A `[data-dir-toggle]` button flips `html[dir]` and persists it — it's on the
  demo index, and doubles as a smoke test for new components.
- The **email kit is intentionally physical** — email clients' support for
  logical properties is too poor; mirror email templates per-locale instead.
- The harness renders every demo page at 390px with `dir="rtl"` and fails if
  layout overflows either edge.

## Buttons
- `.btn` + `.btn-primary` / `.btn-secondary` / `.btn-outline` / `.btn-ghost` / `.btn-danger` / `.btn-link` · `.btn-sm` · `.btn-icon`
- States: `.is-loading` (with `<span class="spin sm">`), `.is-success`, `.is-disabled`
- `.btn-group` (joined) · `.segmented` (single-select) · `.toggle-group` (multi, JS toggles `.on`)

## Forms
- **Inputs** — `.field` or bare `input[type=…]` / `textarea` / `select` (one size, themed focus ring)
- **Input group** — `.input-group` (leading icon + trailing button); paste button `data-paste="#id"`
- **Add-ons** — `.addon-group` with `.addon` prefix/suffix
- **Password** — `.pw` + `.pw-toggle` + `.pwbar`
- **Select** — native, `select[multiple]`, or searchable **combobox** `.combo` + `data-combo`
- **Choice** — `.choice` (radio/checkbox groups, custom dark) · `.switch` · `.check`
- **Range** — `input.slider` · dual-thumb `.dual` + `data-dual` (with `.dual-out`)
- **Numeric** — `.stepper` · `.amount-field` + `data-amount` (currency prefix, thousands format, +/- tone)
- **Tags** — `.tagsinput` + `.tagchip` · **OTP** `.otp` · **upload** `.dropzone`
- **Field anatomy** — `.field-row` + `.label`/`.fld` (+`.req`/`.opt`) + `.fhelp` / `.ferr` / `.fok`; validation `.is-error` / `.is-success`
- **Live validation** — `[data-validate]` on a `<form>`; per-field `required` / `type=email` /
  `minlength` / `data-match="#otherField"`. On submit, invalid fields get `.is-error` + a
  `.ferr` message; a summary `.form-msg` announces the count. Clears on input.

## Pickers
- Date popover — `.picker` + `data-picker` (month/year quick-nav)
- Inline calendar — `.cal-inline` + `data-calendar`
- Date range — `.daterange` + `data-daterange` (two months, range highlight)

## Badges & status
- `.badge` · `.green/.amber/.coral/.info/.neutral`
- `.tier` · `.tier-free/.tier-pro/.tier-unlimited` · `.role-admin`
- `.dot` · `.ok/.warn/.down/.idle` · connection pill `.conn-pill` · `.up/.recon/.down`

## Avatars
`.avatar` (+`.avatar-sm`/`.avatar-lg`) · `.avatar-stack` · `.avatar-wrap` + `.dot`

## Cards
`.card` · `.feature-card` · `.plan` (+`.popular`/`.pop`) · `.pack` · `.rcard` ·
`.cost-preview` · album art `.albumart` (`.xs/.sm/.md/.lg/.xl`)

## Charts (SVG, dependency-free)
- Line / area (polyline + gradient polygon) · multi-series
- Donut (stacked `stroke-dasharray`) · bar `.bars` · stacked `.sbars` · horizontal `.hbar`
- Gauge (semicircle arc) · heatmap `.heatmap` + `data-heatmap` (`data-cols/-rows`) ·
  sparkline `.spark` · candlestick · radial `.radial`
- Card wrapper `.chart` + `.chart-h` + `.legend`

## Stats & data display
`.stats` + `.chip` + `.n` `data-count`/`data-suffix` (count-up) · `.stat-card`
(`.num/.lbl/.delta/.fresh`) · key-value `.kv` · activity timeline `.timeline` +
`.tl-item.in/.out` · quota meter `.quota` (+`.warn`/`.crit`)

## Loading
`.spin` (`.sm/.lg`) · progress bar · indeterminate `.prog-indet` · `.radial` ·
skeletons `.skel` (`.skel-line`) · section `.loading-block` · activity log `.log`
(`.t/.ok/.warn/.cur/.blink`)

## Progress & uploads
- **Step tracker** — `.steps` > `.step` (`.done` / `.active`) + `.sdot`, separated by `.sline`
  (a `.step.done` tints the following `.sline`). Horizontal, token-driven.
- **Upload list** — `.upload-list` > `.upload-row` (`.done`) with `.uicon` / `.uinfo`
  (`.uname` / `.umeta` / `.ubar` > `i`) + `.urm` remove button.
- **Checklist** — `.checklist` > `li` > `label.check` (reuses the `.check` checkbox);
  the done state is pure CSS — `input:checked + span` strikes/dims the label, no JS.
- **Setup card** — `.setup-card` (onboarding/setup): `.setup-head` (title + "N of M"
  + `.setup-prog` > `i` progress bar, `role="progressbar"`) over `.setup-list` > `li`
  (`.done`) with `.sc-ic` (filled check when done) / `.sc-body` (`b` + `span`) and a
  trailing `.btn` action. Progress width/count are author-set markup (no JS).

## Feedback
- Toast `.toast` (`.ok/.err/.warn/.info`) + icon chip; undo via `.undo`; **live**
  trigger `data-toast="msg"` `data-toast-type` (slides into a `.toast-host`)
- `.alert` (`.crit/.warn/.info`) · `.banner` · `.session-bar` · empty `.empty`

## Overlays
All dismissable layers share one behaviour primitive: Esc, outside-click, scroll-lock
and focus-trap are inherited, not re-implemented per component.
- Modal `.modal-scrim` > `.modal-dialog` (`.ok/.danger/.warn/.info`); open/close via
  `data-modal-open="#id"` / `data-modal-close`; footer `.mf`, both-ends `.mf.split`
- Drawer `.drawer-scrim` > `.drawer` (`.left`/`.right`) — slides in; same `data-modal-*` API
- Popover `.popover-wrap` > `[data-popover]` trigger + `.popover` panel; `data-popover-close`
  to dismiss · **Popconfirm** `.popconfirm` (inline confirm/cancel inside a popover)
- Command palette `.cmdk-scrim` > `.cmdk` (⌘K / Ctrl+K); `.cmd-item` in `.cmd-group`,
  type-to-filter, arrow-key nav, empty groups hide
- Sheet `.sheet` (`.right`/`.bottom`) — extends the dialog
- Tooltip `[data-tip="…"]` + `[data-tip-pos="top|bottom|left|right"]` (reveals on hover
  **and** keyboard focus). Add `[data-tip-card]` for the elevated, multi-line card look.
  For **rich content** use the popover form: `.tip` > focusable trigger + `.tip-pop` panel
  with `.tip-row` / `.tip-row.strong` / `.tip-divider` / `.tip-note` inside.
  **Auto-positioning:** one engine (`js/qazana.js`) drives both forms — it renders a single
  floating node at `<body>` level (`position:fixed`) so the tip **escapes `overflow:hidden`
  / transformed ancestors**, treats `data-tip-pos` as the *preferred* side, and **flips +
  shifts** to stay on screen near edges. The pure-CSS rendering is the no-JS fallback
  (suppressed by `.qz-tip-js` on `<html>`). Escape-dismissible; rich tips are hoverable.
- Menu `.menu` + `.menu-item` (+`.danger`, `.menu-sep`, `.menu-label`)
- Context menu `.menu.ctx` + `data-ctx="#id"` (right-click target)
- Tabs `.tabs` + `[data-tabs]` (switch `.tabpanel`) · accordion `.acc` > `<details>`
  (`name=` ⇒ single-open) · hover card `.hc-trigger` > `.hovercard`

## Toasts (positioning)
`.toast-host` is fixed top-right by default; add `.tl` / `.bl` / `.br` for top-left,
bottom-left, bottom-right. Trigger live toasts with `data-toast="msg"` + `data-toast-type`.

## Tree
`.tree` + `[data-tree]` > `.tree-row` (toggle `.tree-children`); full keyboard nav
(Arrow up/down to move, Right/Left to expand/collapse, Enter to activate).

## Navigation

### Universal (base.css)
- **Skip link** — `.skip-link` — first focusable element, jumps to `#main-content`. Hidden until focused.

### Site kit (marketing/landing)
- **Header/Nav** — `.nav` + `.brand` + `.nav-links` + `.nav-actions` — sticky with scroll state
- **Nav states** — `.active` / `[aria-current="page"]` for current page; `.disabled` / `[aria-disabled]` for unavailable
- **Mobile drawer** — `.nav-drawer` + `.nav-drawer-overlay` + `[data-nav-drawer-toggle]` — hamburger-triggered slide-out. `[data-nav-drawer-toggle]` toggles (a second click, the in-drawer close button, the overlay, `Esc`, or any nav link all close it). Keyboard-trapped while open, focus returns to the opener on close, and the opener's `aria-expanded` reflects state — give the panel an `id` and point the opener at it with `aria-controls`. The closed panel is `visibility:hidden` so it stays out of the tab order; the slide respects `prefers-reduced-motion`.
- **Vertical nav** — `.vnav` + `.vnav-section` + `.vnav-nested` — sidebar docs/content navigation
- **Footer** — `.site-foot` + `.foot-grid` + `.foot-col` + `.foot-bottom` + `.foot-news` + `.foot-social` + `.foot-legal`

### App kit (product UI)
- **Header** — `.top` + `.logo` + nav in header
- **Breadcrumb** — `.crumbs` + `.sep` separators
- **Pagination** — `.pager` with `.active` page
- **Sidebar** — `.sidebar` + `.side-item` — collapsible (200px/58px rail) + mobile off-canvas

### Content kit (blog/docs)
- **TOC** — `.toc` + `[data-toc]` scrollspy with `.active` section highlight

## Data table
`.tbl` in `.tbl-wrap` · sortable `[data-table-sort]` + `th.sortable` · select-all
`[data-select-all]` · bulk bar `.bulkbar` + `[data-bulk]` · faceted filters
`.facets`/`.fchip` (`data-fchip` remove, `data-fclear` clear) · `.pager`
- **Advanced** — sticky header `.tbl-wrap.sticky` · type-to-filter `[data-table-filter]`
  · expandable rows: `.row-toggle` button + a following `tr.row-detail` (`.rd-body`),
  `tr.is-open` reveals it

## Admin
Shell `.adminframe` + `.sidebar` (`.collapsed` icon-rail) + `.side-item` ·
stat cards `.stat-grid`/`.stat-card` · service rows `.svc-row` · provider `.pcard` ·
jobs `.jobrow` + `.joblog` · master-detail `.split` + `[data-split]`, drag-resizable
via a `.resizer` element between panes (pointer-drag sets the previous pane's width).
On phones (≤640) the `.sidebar` becomes an **off-canvas drawer**: put a
`[data-sidebar-toggle="<frame selector>"]` hamburger in an `.admin-bar`; it flips
`.nav-open` on the `.adminframe` (backdrop-click, nav-item-click and Esc close it)

## Shared / utility
QR `.qr` · pairing code `.paircode` · color picker `.colorpicker` + `data-colorpicker` ·
drag-reorder `.reorder` + `data-reorder` · currency picker (`.combo`) ·
separator `.separator` (+`.labeled`, `.sep-v`) · `.kbd` · notification bell `.bell` +
`.nbadge` · wizard `.wsteps`/`.wstep` + `[data-wizard]` · `.divider`

## Error pages
`.errpage` (+`.code.amber/.coral`) · grid `.err-grid` > `.errcard`

## Content kit
Docs/long-form layout `.doc-layout` (prose + sticky rail) · **table of contents**
`.toc` + `[data-toc]` with `.toc-h` heading and in-page `<a href="#id">` links;
scrollspy adds `.active` to the link whose section is in view (IntersectionObserver).
See the Content kit demos for `.prose`, `.callout`, blog/article layouts.

## Commerce kit

`kits/commerce.css` — root scope `.shop`. Import `site.css + commerce.css + qazana.js`;
no `app.css` dependency. All prices are static markup; no `Intl.NumberFormat` baked in.

### Product grid & card
`.product-grid` (auto-fill, `--col` default 260 px) · `.product` card (link) →
`.product-media` (aspect-ratio 4/3, scale-on-hover) + `.product-badges` overlay slot +
`.fav` wishlist toggle (`aria-pressed` + `.on`; `.sr` sr-only label) +
`.product-body` → `.product-title` (2-line clamp) · `.product-meta` · `.product-footer`

### Price display
`.price` → `.price-now` (tabular-nums) + `.price-was` (line-through muted).
Sale state: add `.sale` to `.price` → `.price-now` uses `var(--danger)`.

### Badges & stock
`.badge` + modifiers `.sale` / `.new` / `.low` / `.oos` (all use semantic tokens, no literal colors).
`.stock` + `.in-stock` / `.low-stock` / `.out-of-stock` — colored dot via `::before`.

### Star rating (display-only)
```html
<div class="stars" role="img" aria-label="4.5 out of 5 stars">
  <span class="stars-row" aria-hidden="true">
    <i class="fa-solid fa-star on"></i>…
  </span>
  <span class="stars-count">(128)</span>
</div>
```
`role="img"` + `aria-label` on the container; individual stars `aria-hidden`.

### Quantity stepper `[data-stepper]`
```html
<div class="qty" data-stepper>
  <button data-dec aria-label="Decrease quantity">−</button>
  <input type="number" value="1" min="1" max="10" aria-label="Quantity">
  <button data-inc aria-label="Increase quantity">+</button>
</div>
```
JS clamps to `min`/`max`/`step`, disables buttons at bounds, fires native `change`.

### Variant / swatch picker `[data-variant]`
```html
<div class="vchips" data-variant data-variant-label="#label-id" aria-label="Select size">
  <button class="vchip" role="radio" aria-checked="false">M</button>
  <button class="vchip oos" role="radio" aria-checked="false" aria-disabled="true">XL</button>
</div>
```
`role="radiogroup"` set by JS on the container. Arrow keys move selection, skipping `.oos`
options (`aria-disabled="true"` — still focusable and announced, not `disabled`).
Swatch variant: use `.swatches` wrapper + `.sw` buttons with `data-c` or inline `background`.
`data-variant-label="#id"` wires a text label that syncs with the selected `data-value`.

**A11y summary:** radiogroup / radio / aria-checked / aria-disabled; arrow-key navigation;
`.oos` diagonal strike via `::after` pseudo-element.

### PDP gallery (reuses `[data-tabs]`)
`.gallery` → `.gallery-thumbs` (tab bar, each `.tab` is a thumbnail button) +
`.gallery-main` (tabpanel, `aspect-ratio:1`). Keyboard/ARIA come free from the tabs controller.

### Quick-view dialog (reuses `[data-modal-open]`)
`.quickview` — two-column grid (gallery + info). Trigger: `data-modal-open="#id"`.
Focus-trap, Esc-to-close, and focus-restore are provided by the modal controller.

### Cart line items
`.cart-lines` > `.cart-line` (80 px thumb | info | price grid) →
`.cart-thumb` · `.cart-info` → `.cart-name` · `.cart-variant` · `.cart-actions` →
`.cart-rm` remove button · `.cart-price` (`.was` crossed-out line).
Quantity: reuse `[data-stepper]` inside `.cart-actions`.

### Mini-cart drawer (reuses `[data-modal-open]`)
`.minicart-scrim` (drawer scrim, `is-open` class controlled by modal JS) →
`.minicart` → `.minicart-head` + `.minicart-body` (scrollable) + `.minicart-foot`.
`.minicart-count` badge (wrap in `aria-live="polite"` for cart-count announcements — the
announced string is app vocabulary; the kit only provides the styled element).

### Order summary
`.order-summary` → `.os-rows` > `.os-row` (`.os-label` + `.os-val`) +
modifiers `.discount` (danger color) · `.free` (primary color) + `.os-divider` + `.os-total`.

### Promo code
`.promo` (input + button row) · `.promo-applied` pill with × remove button.

### Checkout steps
`.checkout-steps` > `.step` (+ `.done` / `.active`) → `.sdot` + label text + `.sline` connector.
Responsive: label text hidden on narrow viewports, dots and lines remain.

### Pay / ship options (`:has(:checked)`)
`.pay-opts` > `<label class="pay-opt">` → native `<input type="radio">` +
`.pay-opt-icon` · `.pay-opt-body` (`.pay-opt-title` + `.pay-opt-desc`) · `.pay-opt-badge`.
Selected card highlighted via `:has(input:checked)` — **first `:has()` use in repo** (baseline 2023).

### Card field
`.card-field` → `.card-field-row` rows → inputs + `.card-field-icon` + `.card-field-sep`.
Inputs inherit base.css field styles; focus-visible bg lift via `var(--surface-active)`.

### Filter rail
`.filters` → `.filter-head` + `.facet` (`<details>`) groups → `.facet-body` > `.facet-opt`
(checkbox label + `.facet-count`). `.fchips` active chips with `[data-fchip]` remove buttons.
`.sort-row` (label + `<select>`). `.pager` pagination links (`.active` = current page).

### Empty cart state
`.cart-empty` → `.empty-icon` circle + heading + description + CTA button.

### Order page
`.order-confirm` header (confirm icon + heading + `.order-ref` mono badge).
`.timeline` → `.tl-item` (`.done` / `.active`) → `.tl-dot` + `.tl-body` (`.tl-title` + `.tl-meta`).
Order history: standard `table.tbl` rows (see App kit table docs).

## Billing kit

`kits/billing.css` — root scope `.billing`. Import `billing.css + qazana.js`; no `app.css`
dependency. This is the **in-product** subscription surface (Billing & Plans settings), distinct
from `site.css .pricing` (marketing pricing) and `commerce.css` (one-time storefront checkout).
All money is **static markup** — no currency math, no `Intl.NumberFormat`, no payment processing
(provider SDK/iframe, card validation, tax/VAT, and plan/feature copy stay in the consuming app).
Scoped copies of `.btn` / `.badge` / `.tier` / `.plan` / `.quota` / `.stepper` / modal live here so
the kit is self-contained on `base.css`.

### Current-plan summary
`.bill-summary` → `.bs-main` (`.bs-plan` with `.tier` badge + `.bs-meta`) · `.bs-actions`.
Trial variant: add `.trial` (info-tinted) with a `.bs-days` countdown rendered as **static text**.

### Plan switcher + cycle toggle `[data-billing-cycle]`
```html
<div class="cycle" data-billing-cycle="#plan-grid" aria-label="Billing cycle">
  <button role="radio" aria-checked="true"  data-value="month">Monthly</button>
  <button role="radio" aria-checked="false" data-value="year">Annual <span class="save">Save 20%</span></button>
</div>
<div class="plan-switch" id="plan-grid" data-cycle="month">
  <div class="plan current">…<div class="price" data-cy="month">$12<small>/mo</small></div>
       <div class="price" data-cy="year">$120<small>/yr</small></div>…</div>
</div>
```
The controller is a **radiogroup** (arrow-key nav, like `[data-variant]`) that sets `data-cycle`
on the **named target region**; CSS shows the matching `[data-cy]` price spans and reveals
`.only-year` notes. **No math** — both prices live in the markup. Ships `data-cycle="month"` so it
degrades without JS. `.plan` modifiers: `.popular`, `.current` (+ `.is-current` foot label).

### Proration (inline confirm — no modal)
Upgrade is the frictionless path: a native `<details class="switch">` whose `summary.btn` reveals a
`.proration` panel (`.pr-row`, `.pr-row.total`, `.pr-note`) under the chosen plan. Consumer fills the
prorated numbers server-side.

### Invoice history
`table.invoices` (real `th[scope=col]`, tabular-nums `.inv-amt`, `.inv-id` mono, `.inv-dl` download
link with `aria-disabled` when none). Status via scoped `.badge` modifiers: `.paid` (primary) ·
`.open` (warning) · `.past-due` (danger) · `.refunded` (info) · `.void` (muted). Stripe
`uncollectible` → `.past-due`.

### Payment methods (saved state, not a radiogroup)
`.pay-methods` > `.pay-method` (+ `.default` modifier = **server state**) → `.brand` slot (drop your
provider's mark; demo uses Font Awesome `cc-*`) · `.pm-info` (`.pm-num` + `.dots` + `.pm-exp`, add
`.expired` for danger) · `.pm-actions` (Set-default / Edit / Remove). `.pay-add` dashed add button.

### Usage → cost + over-limit nudge
`.usage` > `.usage-row` → `.ur-head` (`.ur-name` + `.ur-cost`) + scoped `.quota` meter
(`.warn` / `.crit`). Add `.crit` to the `.usage-row` to surface `.ur-nudge` (an in-context upgrade
prompt) only when over limit.

### Dunning / failed-payment banner
`.bill-banner` with `role="alert"` → `.bb-icon` + `.bb-text` (static **deadline date**, no live
timer) + `.bb-actions`. Severity: `.warn` (grace period) / `.crit` (suspended) via modifier class.

### Seat management
`.seat-row` → `.sr-info` + `.sr-ctl` (scoped `.stepper` via `[data-stepper]` + `.sr-cost`).

### Cancel / downgrade (reuses `[data-modal-open]`)
Single retention-framed modal: `.cancel-loss` (consequence + end date), `.keep` > `.opt`
alternatives (pause / switch — the prominent path), static `.reasons` chips
(`:has(input:checked)`), and a **de-emphasized** `.cancel-confirm` (friction by design) beside the
primary "Keep my plan". No discount offers baked in — that's per-product business logic.

## Docs kit

`kits/docs.css` — root scope `.docs`. **Pairs with the Content kit**: import
`content.css + docs.css + qazana.js`. The reading column reuses content.css's global `.prose` /
`.toc` / callouts / code; docs.css adds only the chrome content lacks. No baked search modal
(search is provider-supplied — Algolia/Pagefind); sidebar nesting is native `<details>` (correct
nav ARIA, not the app `[data-tree]` widget). Zero new behavior JS.

### Doc shell
`.doc-shell` — 3-column grid (sidebar `.doc-nav` | `<article class="prose">` | `.toc`). Collapses
to 2 columns (TOC hidden) below 1120 px, single column below 860 px.

### Sidebar nav (native `<details>`)
`.doc-nav` → `.doc-search` trigger (with `.dk` ⌘K hint) + `.dn-sec` section labels + flat `<ul>`
link lists + `<details><summary>` collapsible groups (chevron via `.chev`, rotates on `[open]`).
Active page: `aria-current="page"` on the link. Mobile: the rail becomes a bordered block above
the content (pure CSS, no drawer JS).

### Prev / next pager
`.doc-pager` — two link cards (`.prev` / `.next`), `.pl` label + `.pt` title.

### API reference (stacked, collapsible)
`<details class="api-ref">` per endpoint → `<summary>`: `.api-method` verb badge
(`.get`→info · `.post`→primary · `.put`/`.patch`→warning · `.delete`→danger) + `.api-path` (mono) +
`.api-summary`. Body: `.api-params` table (`.pn` name · `.pty` type · `.req` required flag · `.pd`
desc) + `.api-code` request/response samples. No two-panel scroll-sync (that's a page composition).

### Version / locale switcher
`.doc-version` → styled native `<select>` (custom chevron via `::after`). No JS.

### Help center landing
`.help` → `.help-hero` (heading + `.help-search` field — a provider hook, not wired search) +
`.help-cats` category-card grid (`.help-cat` → `.hc-ic` + `h3` + `p` + `.hc-n` count) +
`.help-list` popular-articles rows.

### Help article
`.crumbs` breadcrumb (`a` + `.sep`) → `<article class="prose">` → `.help-vote` ("was this helpful?"
+ `.hv-btns`) → `.help-related` related-article cards.

## Support kit

`kits/support.css` — root scope `.support`. Standalone on base.css (form controls and `.form-field`
come from base). Generic helpdesk UI only — no SLA timers, agent routing, live send, or ticketing
backend (per-product/helpdesk concerns). Zero new behavior JS.

### Contact / ticket form
`.support-form` (flex column; `.row` for side-by-side fields) reuses base `.form-field` + native
controls. `.attach` dashed dropzone. `.support-sent` confirmation state (`.ss-ic` + heading + `.ref`
ticket-number badge).

### Status & priority
Scoped `.badge` status modifiers: `.open`→info · `.pending`→warning · `.solved`→primary ·
`.closed`→muted. `.prio` priority label with a leading dot: `.low`→muted · `.normal`→info ·
`.high`→warning · `.urgent`→danger.

### Ticket list
`.ticket-list` table → `.t-id` (mono) · `.t-subj` (link + `.t-req` requester/category) · status badge ·
`.prio` · `.t-time` (mono). Rows link to the ticket.

### Ticket detail + conversation thread
`.ticket-head` (title + `.th-meta` id/status/priority + `.th-actions`). `.thread` > `.msg` stacked
cards — `.av` avatar + `.bubble` (`.m-head`: `.m-author` + `.m-role` + `.m-time`; `.m-body` prose).
Variants: `.msg.agent` (primary avatar/role) and `.msg.note` (internal note, warning-tinted).

### Reply composer + macros
`.composer` (textarea + `.c-bar` toolbar + `.c-actions`). `.macros` canned-reply picker is a native
`<details>` dropdown (`.macro-menu` opens upward; `.mm-t` + `.mm-d` per entry). Selection/insertion
is consumer-wired.
