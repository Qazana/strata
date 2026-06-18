# @qazana/strata

**Qazana Strata** — the shared, framework-agnostic design system for all Qazana
products. One **token + theme foundation**, consumed by a set of composable
**kits**. Vanilla CSS + data-attribute JS. No build step required.

- **Foundation** — semantic design tokens (the single source of truth) and the
  theme schemes (`dark`, `desert-dunes`). Everything is built on these.
- **Kits** — focused component sets that sit on the foundation: the **App kit**
  (in-product UI), the **Site kit** (landing/marketing), and more (below). A
  page loads only the kits it needs; all kits are themed identically because
  they share the tokens.

Brand colours come from qazana.net: a coral primary, with a teal accent on the
dark scheme and a warm-cream "Désert Dunes" light scheme.

**Links:** [Docs](https://strata.docs.qazana.net/) · [Site](https://strata.qazana.net/) · [Figma library](https://www.figma.com/design/bcPBKFlIq3QmtGDPCpd6I2/Qazana-Strata--Design-System?node-id=44-2) · [npm](https://www.npmjs.com/package/@qazana/strata)

---

## Contents

- [Quick start](#quick-start)
- [Kits](#kits)
- [Architecture & layout](#architecture--layout)
- [Theming & schemes](#theming--schemes)
- [Tokens](#tokens)
- [Consuming per stack](#consuming-per-stack)
- [Demos](#demos)
- [Render harness](#render-harness)
- [Extending — add a theme / add a kit](#extending)
- [Versioning & maintaining](#versioning--maintaining)

---

## Quick start

A vanilla page — load the tokens, a kit, and the behaviour layer:

```html
<html>  <!-- add data-theme="desert-dunes" or "dark" to force; unset follows the OS -->
  <head>
    <link rel="stylesheet" href="@qazana/strata/tokens">
    <link rel="stylesheet" href="@qazana/strata/app">   <!-- App kit -->
    <script type="module" src="@qazana/strata"></script>
  </head>
  <body>
    <button class="btn btn-primary">Get started</button>
  </body>
</html>
```

Markup uses plain classes + `data-*` hooks; `qazana.js` auto-initialises on load.
The tokens set `color-scheme` per theme, so native controls match automatically —
no extra setup.

---

## Kits

Every kit is built on the same tokens and is themeable out of the box. Kits are
scoped so they compose without collisions.

| Kit | Status | What it covers | Consumers |
|-----|--------|----------------|-----------|
| **App** | ✅ shipped (`kits/app.css`) | In-product UI — buttons, forms (full coverage), tables, charts, modals, toasts, tabs, admin shell, error pages | product apps |
| **Site** | ✅ shipped (`kits/site.css`) | Landing/marketing — nav, hero, feature grid, spotlight rows, pricing, testimonials, FAQ, CTA band, footer | product homepages |
| **Content** | ✅ shipped (`kits/content.css`) | Long-form — blog list + cards, article/prose typography, callouts, code blocks, author bio | product blogs, help/docs |
| **Auth** | ✅ shipped (`kits/auth.css`) | Login / signup / reset, OAuth buttons, split auth layout, error states | all apps |
| **Email** | ✅ shipped (`kits/email/`) | Transactional + newsletter email (table layout, inlined CSS); palette baked from Désert Dunes tokens (clients lack CSS vars) | all apps |
| **Media** | ✅ shipped (`kits/media.css`) | Video player / responsive embed / video cards; audio player; social share, follow bar, profile card. Composes with Site/Content | all surfaces |
| **Commerce** | ✅ shipped (`kits/commerce.css`) | Catalog → product → cart → checkout → order — product grid/card, price/badges/stock, star rating, filter rail, qty stepper, variant/swatch picker, PDP gallery, quick-view, cart lines, mini-cart, order summary, promo code, checkout steps, pay/ship options | storefronts |
| **Billing** | ✅ shipped (`kits/billing.css`) | In-product subscription — current-plan summary, plan switcher with monthly/annual toggle + proration, invoice history, payment-method cards, usage→cost meters + upgrade nudge, dunning banner, seat management, retention-framed cancel flow | SaaS billing settings |

> Situational kits we may add later: **Status/Changelog** (status page, changelog,
> maintenance), **Docs** (sidebar nav, API reference) if docs outgrow the Content kit.

Each kit is exported from `package.json` so consumers import only what they need
(e.g. `@qazana/strata/site`). A homepage loads `tokens + site`; a
blog adds `content`; an app loads the App kit.

---

## Architecture & layout

```
tokens/
  qazana.tokens.css   foundation — tokens + theme schemes (single source of truth)
  tokens.json         Figma / Style-Dictionary export (mirrors the CSS)
kits/
  app.css             App kit (built on tokens)
  site.css            Site kit (landing/marketing)
  content.css         Content kit (blog, articles, prose)
  auth.css            Auth kit (sign-in/up/reset/2FA)
  media.css           Media kit (video, audio, social)
  commerce.css        Commerce kit (catalog → cart → checkout → order)
  billing.css         Billing kit (plans, invoices, payment methods, usage)
js/
  qazana.js           vanilla behaviours (data-attribute driven; theme switch)
demo/
  index.html          demo gallery (links every kit + variant)
  app/                components.html · admin.html · errors.html
  site/               landing.html · minimal.html
  content/            blog · blog-medium · article · article-plain · article-media
  auth/               sign-in · sign-in-centered · sign-up · reset
  email/              index · transactional · newsletter
  media/              index · video · social
  commerce/           products · product · cart · checkout · order
  billing/            plans · overview · methods · invoices
docs/
  components.md       component reference (the demo is the live spec)
harness/
  shoot.mjs           Playwright render harness (screenshots + probes)
CLAUDE.md             maintenance contract (token discipline, no domain code, a11y)
HANDOFF.md            design → dev handoff notes
```

**Cascade:** each kit's rules are wrapped in `@layer qazana`, so a consuming
app's own (unlayered) CSS overrides the kit without specificity battles. Focus
rings use `:focus-visible` (no ring on mouse-click for non-text controls). Each
semantic colour has an `--on-*` foreground token for text on a solid fill.

**Layering:** `tokens` (foundation) → kits (`kits/app.css`, `kits/*`) →
per-product theme overrides (each product ships its own theme.css). Components never hardcode values — they
reference tokens, so one theme override re-skins everything.

---

## Theming & schemes

Two schemes ship today; both are driven entirely by tokens.

| Scheme | `data-theme` | Look |
|--------|--------------|------|
| **Dark Knight** (canonical) | `dark-knight` (alias `dark`) or unset | deep-navy surfaces, **teal** accent |
| **Désert Dunes** (light) | `desert-dunes` (alias `light`) | warm-cream surface, navy ink, **coral** brand |

Switching is **hybrid** — explicit choice wins, otherwise follow the OS:

```html
<html>                          <!-- follows prefers-color-scheme -->
<html data-theme="desert-dunes"><!-- force light -->
<html data-theme="dark">        <!-- force dark -->
```

- Neutral lines/borders flow through `--border-rgb` (white in dark, navy in
  light), so they flip with the scheme.
- `color-scheme` is set per scheme, so native controls (date pickers, scrollbars)
  match.
- Recessed code/terminal panels use `--surface-sunken`; focused-field lift uses
  `--surface-active`.

**Theme switcher** — any `[data-theme-toggle]` element cycles a comma-separated
theme list and persists the choice to `localStorage`; the icon follows the
resolved `color-scheme`:

```html
<button data-theme-toggle="dark,desert-dunes" aria-label="Switch theme">
  <i class="fa-solid fa-sun"></i>
</button>
```

### Direction (RTL)
The kits are written with CSS logical properties plus targeted `[dir="rtl"]`
refinements, so right-to-left locales need exactly one attribute:

```html
<html dir="rtl">
```

Everything mirrors — sidebars, drawers, tooltips, timelines, form addons, the
switch knob — except things that shouldn't (centered elements, up/down chevrons,
cursor-anchored menus). A `[data-dir-toggle]` button flips and persists the
direction the same way `[data-theme-toggle]` does. The **email kit stays
physical** (email-client support for logical properties is unreliable). See
`docs/components.md` § Direction (RTL) for the conventions.

### Density (compact mode)
**Independent of colour** — a second axis for dense admin/data UIs. Control sizing
(font, padding for buttons, inputs, table cells, rows) flows through density tokens
(`--ctl-*`, `--btn-pad-*`, `--cell-pad-*`, `--row-pad-*`), overridden under
`[data-density="compact"]`. Combine with any theme:

```html
<html data-theme="dark-knight" data-density="compact">   <!-- dense + dark -->
```
Default (unset / `comfortable`) keeps the roomy sizing. A `[data-density-toggle]`
button (wired by `qazana.js`) flips it and persists to `localStorage`.

---

## Tokens

`tokens/qazana.tokens.css` is the single source of truth (mirror it in
`tokens/tokens.json`). Each colour has a solid hex **and** an `-rgb` channel so
alpha tints stay themeable: `rgb(var(--primary-rgb) / .12)`.

| Group | Tokens |
|-------|--------|
| Surfaces | `--bg` `--surface` `--surface-2` `--surface-3` `--surface-sunken` `--surface-active` |
| Lines | `--border-rgb` → `--line` `--line-strong` |
| Text | `--text` `--text-2` `--muted` |
| Brand / semantic | `--primary(+ -bright, -rgb)` `--on-primary` `--danger` `--warning` `--info` `--accent` |
| Tints | `--primary-soft` `--primary-ring` `--primary-line` `--danger-soft` `--warning-soft` `--info-soft` |
| Radius | `--radius-sm` `--radius` `--radius-lg` `--radius-pill` |
| Elevation | `--shadow-sm` `--shadow` `--shadow-lg` |
| Spacing | `--space-1` … `--space-7` (4·8·12·16·24·32·48) |
| Type | `--display` (Figtree, large headings only) · `--body` (DM Sans) · `--mono` |
| Motion | `--ease` · `--dur-1/-2/-3` |

> **Rule:** never hardcode a colour/space/radius/shadow/font in a component —
> reference a token. Brand colours are themeable; neutrals rarely change.

---

## Consuming per stack

### Vanilla / any stack
```html
<link rel="stylesheet" href="@qazana/strata/tokens">
<link rel="stylesheet" href="theme.css">                  <!-- the product's brand override -->
<link rel="stylesheet" href="@qazana/strata/app">
<script type="module" src="@qazana/strata"></script>
```

### React + Tailwind
Load the CSS/tokens globally, then map tokens in `tailwind.config.js`:
```js
theme: { extend: {
  colors: { primary:'var(--primary)', danger:'var(--danger)', warning:'var(--warning)',
            info:'var(--info)', accent:'var(--accent)', bg:'var(--bg)',
            surface:'var(--surface)', 'surface-2':'var(--surface-2)',
            line:'var(--line)', text:'var(--text)', 'text-2':'var(--text-2)', muted:'var(--muted)' },
  borderRadius:{ sm:'var(--radius-sm)', DEFAULT:'var(--radius)', lg:'var(--radius-lg)', pill:'var(--radius-pill)' },
  boxShadow:{ sm:'var(--shadow-sm)', DEFAULT:'var(--shadow)', lg:'var(--shadow-lg)' },
  fontFamily:{ display:['Figtree','sans-serif'], sans:['DM Sans','system-ui','sans-serif'], mono:['SF Mono','monospace'] },
}}
```
If the app has existing brand vars, its theme can alias them: `--primary: var(--app-primary)`.

### Ember
`@import` the tokens + kit CSS in `app/styles/app.scss`, reference `var(--…)` in
component styles.

---

## Demos

```bash
npm run demo     # serves demo/ at http://localhost:4178
```
The demos are the **live spec** — every component variant/state, in both themes
(use the theme toggle in the header). See `docs/components.md` for the reference.

---

## Render harness

A hermetic Playwright harness renders every demo in **both** schemes, screenshots
them, and gates on regressions (no dead tokens, no `var()` in SVG presentation
attributes, chart colours not silently `none`, bg/text contrast flips per theme,
no page errors). It doubles as a CI-style check.

```bash
npm install      # one-time (adds Playwright; the browser is cached)
npm run harness  # writes screenshots to harness/out/ (gitignored); exits non-zero on failure
```

> Why it exists: a single-theme screenshot can't catch a token that breaks in the
> *other* theme, and `var()` in an SVG `fill="…"`/`stroke="…"` attribute silently
> renders as `none` (it only works via `style="…"`). The harness guards both.

---

## Extending

### Add a brand theme
A product re-brands the kit with a single unlayered `:root{}` override —
`--primary` + its `-rgb` channel, `--on-primary`, fonts — shipped as its own
`theme.css`. See the theming docs and the live switcher demo.

### Add a scheme
Override only the tokens that differ from dark, under a `data-theme` selector,
then register the id with the switcher:
```css
:root[data-theme="ocean"]{
  color-scheme:dark;                 /* or light */
  --primary:#38bdf8; --primary-rgb:56 189 248; --on-primary:#04222e;
  --primary-bright:#7dd3fc; --primary-bright-rgb:125 211 252;
}
```
```html
<button data-theme-toggle="dark,desert-dunes,ocean">…</button>
```
Add it to the harness `SCHEMES` list so it's screenshot + contrast-checked too.

### Add a kit
1. Create `kits/<name>.css`, `@import "../tokens/qazana.tokens.css"`, scope all
   rules under a root class (e.g. `.site …`) so it composes collision-free.
2. Build only on tokens — no hardcoded values.
3. Add a `package.json` export (`./<name>`), a `demo/<name>.html` showcase, and
   wire it into the harness.

---

## Versioning & maintaining

- **Semver:** patch = fix · minor = additive component/token/kit · major =
  rename/removal/breaking token change. Renaming/removing a token is breaking.
- Keep `tokens/tokens.json` in sync with `tokens/qazana.tokens.css`.
- Update the relevant `demo/` and `docs/` when you change a component.
- **`CLAUDE.md`** is the maintenance contract (token discipline, semantic naming,
  no domain-specific components, accessibility + reduced-motion). **`HANDOFF.md`**
  covers design → dev.
