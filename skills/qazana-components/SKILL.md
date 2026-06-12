---
name: qazana-components
description: Use when building or extending UI in a Qazana app that consumes the shared @qazana/strata — adding/using components, theming a product, deciding generic-vs-domain, and keeping token discipline. Trigger on UI/component/design-system/theming work in those repos.
---

# Working with the Qazana component library

The shared library (`qazana-strata`, sibling repo) is the source of
truth for **generic** UI: semantic themeable tokens + vanilla, data-attribute
component CSS/JS. Each app **themes** it and adds its own **domain** components on
top. Full element list: `docs/components.md`. Maintenance contract: `CLAUDE.md`.

## 1. Decide: generic or domain?
- **Generic** (buttons, forms, tables, modals, charts, toasts, admin shell, …) →
  lives in the **shared library**. If it's missing, add it *there first*, then use
  it. Never fork a generic component into the app.
- **Domain** (product-specific: a music app's tracklist, a fintech's rate-locks,
  a media tool's sync controls) → lives in the **app**, built *on the tokens*.
If a component encodes business vocabulary or logic, it's domain.

## 2. Consume it
Load tokens + a theme + the CSS/JS once, then use classes + `data-*` hooks:
```html
<html style="color-scheme:dark">
<link rel="stylesheet" href="<lib>/tokens/qazana.tokens.css">
<link rel="stylesheet" href="<lib>/themes/<app>.css">   <!-- brand override -->
<link rel="stylesheet" href="<lib>/css/qazana.css">
<script type="module" src="<lib>/js/qazana.js"></script>
```
- **Tailwind:** load the CSS/tokens globally; map tokens in
  `tailwind.config.js` (see the lib README). The theme aliases brand to the app's
  existing vars, e.g. `--primary: var(--wis-primary)`.
- **Ember:** `@import` tokens + css in `app/styles`; reference `var(--…)`.
- Behaviors are framework-agnostic: render the markup (classes + `data-*`) and
  `qazana.js` wires it via the DOM. In React/Ember, render the DOM and re-run the
  init (or call the relevant setup) after mount.

## 3. Token discipline (non-negotiable)
- Style with `var(--…)` only — **never** hardcode a color/radius/spacing/shadow.
- Brand colors are themeable: `--primary` (not `--green`), `--danger`, `--warning`,
  `--info`, `--accent`. Alpha tints use the channel form
  `rgb(var(--primary-rgb) / .12)` so one brand override re-tints everything.
- Type: `--display` for large headings only; `--body` elsewhere; `--mono` for data.
- Every animation respects `@media (prefers-reduced-motion: reduce)`.

## 4. Theming a product
Add `themes/<product>.css` overriding `--primary` (+ `--primary-rgb`),
`--on-primary`, and fonts. Verify the demo under the new theme. Mirror it as a
Figma mode (see `HANDOFF.md`).

## 5. Adding/changing a component (in the shared lib)
Update the relevant kit CSS (+ `js/qazana.js` if interactive), the **demo**, the doc in
`docs/components.md`, and `tokens/tokens.json` if tokens changed. Bump the version
(semver; renaming/removing a token is **breaking**). A PR adding a generic
user-facing element without a library entry is incomplete.

## 6. Kits quick-reference

| Kit | Scope class | Import |
|-----|------------|--------|
| App | (none — used inside `.app`/product shell) | `@qazana/strata/app` |
| Site | `.site` | `@qazana/strata/site` |
| Content | `.prose` / `.doc-layout` | `@qazana/strata/content` |
| Auth | `.auth` | `@qazana/strata/auth` |
| Email | (table-based, no scope class) | `@qazana/strata/email/*` |
| Media | `.media-block` / `.audio` | `@qazana/strata/media` |
| Commerce | `.shop` | `@qazana/strata/commerce` |

**Commerce kit** (`v0.21.0`): catalog → PDP → cart → checkout → order.
JS hooks: `[data-stepper]` (qty stepper) and `[data-variant]` (radiogroup variant/swatch).
No new tokens; no `app.css` dependency; composes with `site.css`.

## Common pitfalls
- A bare `<input>` (no `type`) doesn't match `input[type=text]` rules → black text
  on dark. Give text inputs an explicit `type` or use `.field`.
- Don't reuse popover styles (`.cal`, `.menu`) as static blocks — they carry
  absolute positioning + shadow. Use the dedicated inline variant.
- Native controls need `color-scheme:dark` to render dark (date pickers, selects).
