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
`--radius-{sm,,lg,pill}`, `--shadow{-sm,,-lg}`, `--space-1…7`, `--display/--body/--mono`,
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
- Tooltip `[data-tip="…"]` + `[data-tip-pos="top|bottom|left|right"]` (arrow points at
  trigger; reveals on hover **and** keyboard focus). Add `[data-tip-card]` for the elevated,
  multi-line card look (soft shadow, wraps at a max-width). For **rich content** use the
  popover form: `.tip` > focusable trigger + `.tip-pop[role=tooltip]` panel (`data-tip-pos`
  for direction) with `.tip-row` / `.tip-row.strong` / `.tip-divider` / `.tip-note` inside
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
