# Upgrading existing consumers

This guide is for apps that already consume `@qazana/strata` and need to move to
the `1.0.0` stable release.

Strata is now governed as a stable public API. Exported kits, documented tokens,
documented classes, documented DOM anatomy, and documented `data-*` hooks are
semver-protected unless explicitly marked otherwise. Read
[`API_CONTRACT.md`](API_CONTRACT.md) before changing public surfaces.

## Upgrade target

```bash
npm install @qazana/strata@^1.0.0
```

If the app uses a lockfile, commit the lockfile update with the app change.

## Before upgrading

Inventory how the app consumes Strata:

- package version currently installed
- kits imported (`app`, `site`, `content`, `auth`, `media`, `commerce`,
  `billing`, `docs`, `support`, `email/*`)
- product theme file and token overrides
- custom CSS that targets Strata classes
- legacy form vocabulary in use (`.field-row`, `.fld`, `.ferr`, `.fhelp`,
  `.fok`)
- any vendored copy of `kits`, `tokens`, `fonts`, or `js`

Check for broad unlayered selectors that can override Strata components:

```css
a { ... }
button { ... }
input { ... }
select { ... }
textarea { ... }
```

Prefer scoped or classless-content selectors:

```css
.product-shell a:not([class]) { color: var(--primary); }
.product-shell :where(button:not([class])) { font: inherit; }
```

## NPM consumers

For apps that install Strata from npm:

```bash
npm install @qazana/strata@^1.0.0
```

Then run the app's normal checks:

```bash
npm test
npm run build
```

Use the same CSS entrypoints as before. Public exports are stable:

```html
<link rel="stylesheet" href="@qazana/strata/tokens">
<link rel="stylesheet" href="/theme.css">
<link rel="stylesheet" href="@qazana/strata/app">
<script type="module" src="@qazana/strata"></script>
```

## File dependency consumers

For local apps that consume Strata through a `file:` dependency:

```json
{
  "dependencies": {
    "@qazana/strata": "file:../qazana-strata"
  }
}
```

Run:

```bash
npm install
npm test
npm run build
```

Commit any lockfile change in the consuming app.

## Vendored static-site consumers

Some static sites copy Strata files into a checked-in `vendor/strata/` directory
so deployment does not depend on a symlink or install step. For those apps:

```bash
npm install
npm run sync-strata
npm test
```

`sync-strata` is a site-specific script. It deletes the existing
`vendor/strata/` directory and recreates it from the installed
`node_modules/@qazana/strata` package, copying only the assets that static site
needs. It is a replace operation, not a merge.

Commit both:

- dependency/lockfile changes
- refreshed `vendor/strata/*` files

`qazana-strata-site` is the reference example for this pattern.

## Stack notes

### Vanilla / static HTML

Keep load order:

```html
<link rel="stylesheet" href="@qazana/strata/tokens">
<link rel="stylesheet" href="/theme.css">
<link rel="stylesheet" href="@qazana/strata/site">
<script type="module" src="@qazana/strata"></script>
```

If you copy files manually, copy the matching `tokens`, `kits`, `fonts`, and `js`
from the same package version.

### React / Tailwind

Keep Strata CSS loaded globally. Token mappings in Tailwind should continue to
point at CSS variables:

```js
colors: {
  primary: 'var(--primary)',
  surface: 'var(--surface)',
  text: 'var(--text)',
}
```

Do not duplicate Strata component classes in React components unless the class
and DOM anatomy are documented.

### Ember

Import the tokens and kit CSS in the app stylesheet, then keep component styles
token-based:

```scss
@import '@qazana/strata/tokens';
@import '@qazana/strata/app';
```

If route transitions insert Strata behavior markup after initial page load,
verify the relevant `data-*` behavior initializes in that route.

### WordPress / PHP

Enqueue the same versioned assets together. Do not mix a new `qazana.js` with old
kit CSS or old tokens.

Recommended order:

1. tokens
2. product theme
3. kit CSS
4. `qazana.js`

## Compatibility notes

### Forms

Canonical vocabulary for new forms:

- `.form-field`
- `.field-label`
- `.field-req`
- `.field-optional`
- `.field-help`
- `.field-error`
- `.is-error`
- `.is-success`
- `.form-msg`
- `.fieldset`

Legacy vocabulary remains supported:

- `.field-row`
- `.fld`
- `.ferr`
- `.fhelp`
- `.fok`
- scoped auth `.field`
- scoped auth `.err`

Do not rewrite existing working forms just to upgrade. Use the canonical
vocabulary for new work and touch legacy forms only when you are already editing
that screen.

### Validation

`[data-validate]` now uses the native Constraint Validation API. Prefer standard
HTML validation attributes:

```html
<input type="email" required>
<input minlength="8">
<input data-match="#password">
```

If a form has no `action`, successful validation does not reload the page and
only shows the success summary when opted in with:

```html
<form data-validate="confirm">
```

### Form persistence

`data-persist` stores non-sensitive fields in `localStorage` by default.
Sensitive fields are skipped by type/name heuristics, but non-sensitive PII such
as names and emails can still be stored.

For shared machines or privacy-sensitive forms, prefer:

```html
<form data-persist data-persist-scope="session">
```

or set a TTL:

```html
<form data-persist data-persist-ttl="3600000">
```

### Overlays and scroll lock

Modal, drawer, command palette, lightbox, and confirm now share the same
ref-counted scroll lock. If a product previously worked around overlay scroll
bugs with custom body `overflow` code, remove that workaround during upgrade and
verify stacked overlays manually.

### Tooltips

`[data-tip]` and rich `.tip > .tip-pop` use one body-level floating tooltip
engine. If a product had custom overflow/transform workarounds for clipped
tooltips, verify those screens again; the workaround may no longer be needed.

### Relative time

`[data-relative-time]` renders from `<time datetime="...">` and updates every
minute. Keep the `datetime` value machine-readable.

## Verification checklist

Run the app's normal gates, then smoke-test these surfaces if used:

- theme switching
- density switching
- RTL toggle or `dir="rtl"` pages
- forms with validation
- forms with autosave/persistence
- submit-lock forms
- modal/drawer/popover/tooltip flows
- command palette
- date picker/calendar/date range
- tables with sorting/filtering/row expansion
- billing cycle toggle
- cart/checkout flow
- docs/help navigation
- support ticket flow

Check at desktop and mobile widths.

## Rollback

If the RC exposes a blocker, roll the consuming app back to the previous pinned
version:

```bash
npm install @qazana/strata@<previous-version>
```

For vendored consumers, restore the previous `vendor/strata/*` files from git.

Report the blocker against the RC branch with:

- consuming app
- Strata version before and after
- kit(s) involved
- minimal markup or screenshot
- whether the issue is visual, behavior, accessibility, or packaging
