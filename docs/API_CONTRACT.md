# API contract

Strata is the default UI kit for Qazana products. Treat its public surface like
an API: once a consuming app uses it, changes must be deliberate, versioned, and
documented.

This contract exists to prevent accidental breakage across the fleet and in
public consumers.

## Stability tiers

### Stable

Safe for production use and semver-protected.

Stable surfaces include:

- package exports listed in `package.json`
- token names and required token pairings
- documented kit entrypoints
- documented component class names
- documented DOM anatomy for components
- documented `data-*` behavior hooks
- documented accessibility and keyboard behavior

Changing or removing a stable surface is a breaking change unless the old surface
continues to work.

### Legacy

Supported for compatibility, but not recommended for new work.

Legacy surfaces must remain functional until a documented major release removes
them. New docs and demos should prefer the canonical stable vocabulary unless
they are demonstrating compatibility.

### Experimental

Not semver-stable yet. Experimental surfaces may change in a minor release, but
must be labeled as experimental in the docs and changelog.

Do not treat an exported kit as experimental by default. If a kit is exported and
documented, it is stable unless a specific component, modifier, or behavior is
explicitly marked experimental.

### Internal

Used by Strata's demos, docs, harness, or implementation. Internal surfaces are
not supported for consumer use.

Examples:

- visual-harness helpers
- demo-only theme code
- private implementation classes not documented in `docs/`
- script internals

## Stable kit entrypoints

These package exports are stable public entrypoints:

| Export | File | Contract |
|---|---|---|
| `@qazana/strata/tokens` | `tokens/qazana.tokens.css` | stable |
| `@qazana/strata/tokens.json` | `tokens/tokens.json` | stable |
| `@qazana/strata` | `js/qazana.js` | stable auto-behavior entrypoint |
| `@qazana/strata/js` | `js/qazana.js` | stable auto-behavior entrypoint |
| `@qazana/strata/app` | `kits/app.css` | stable |
| `@qazana/strata/site` | `kits/site.css` | stable |
| `@qazana/strata/content` | `kits/content.css` | stable |
| `@qazana/strata/auth` | `kits/auth.css` | stable |
| `@qazana/strata/media` | `kits/media.css` | stable |
| `@qazana/strata/commerce` | `kits/commerce.css` | stable |
| `@qazana/strata/billing` | `kits/billing.css` | stable |
| `@qazana/strata/docs` | `kits/docs.css` | stable |
| `@qazana/strata/support` | `kits/support.css` | stable |
| `@qazana/strata/email/*` | `kits/email/*` | stable template entrypoints |

Adding a new kit is a minor release. Removing, renaming, or moving a stable kit
entrypoint is a major release unless the old entrypoint continues to work.

## Token contract

Tokens are the source of truth. Public tokens are stable when they are documented
in the README, `docs/components.md`, `docs/typography.md`, or
`tokens/tokens.json`.

Stable token changes:

- adding a new token
- changing a token value without changing its meaning
- adding a derived token that does not replace an existing one

Breaking token changes:

- removing a token
- renaming a token
- changing a token's semantic meaning
- changing a required token type, such as replacing a color with a non-color
- removing a required channel pair, such as `--primary-rgb`

Color tokens that support alpha tints must keep their channel pair:

```css
--primary: #2dd4bf;
--primary-rgb: 45 212 191;
--on-primary: #04241f;
```

A product theme must override the solid token, the `-rgb` channel, and the
matching `--on-*` foreground token together when it changes a solid fill color.

## Component contract

A component is stable when it is documented in `docs/components.md`,
`docs/forms.md`, or the README.

The stable contract includes:

- documented class names
- documented modifier classes
- required child structure
- required ARIA attributes
- documented states, such as `.is-error`, `.active`, `.on`, `.done`
- documented `data-*` hooks

Breaking component changes:

- removing or renaming a documented class
- requiring different markup for an existing stable component
- moving a stable component to another kit without preserving compatibility
- changing a documented state class so it no longer works
- changing keyboard or focus behavior in an observable way

Non-breaking component changes:

- visual refinements that preserve the documented contract
- adding optional modifiers
- adding optional child slots
- adding new components
- fixing accessibility behavior to match the documented intent

## Behavior contract

`js/qazana.js` is a stable auto-behavior entrypoint. Its public contract is the
documented DOM behavior, not private functions inside the file.

Stable behavior hooks include documented attributes such as:

- `data-theme-toggle`
- `data-density-toggle`
- `data-dir-toggle`
- `data-validate`
- `data-persist`
- `data-autosize`
- `data-char-count`
- `data-submit-lock`
- `data-modal-open`
- `data-modal-close`
- `data-popover`
- `data-tip`
- `data-qz-confirm`
- `data-qz-dismiss`
- `data-relative-time`

Behavior changes are breaking when they alter a documented observable contract:

- validation timing
- submit behavior
- focus trap behavior
- focus restoration
- Escape or outside-click dismissal
- persisted storage semantics
- emitted or required attributes
- keyboard navigation

Consumers should not call private functions from `js/qazana.js`. The stable
programmatic surface is the `window.QZ` namespace:

- `QZ.init(root?)` — re-scan `root` (default: the whole document) and bind
  behaviors to matching elements that aren't bound yet. Call it after rendering
  markup dynamically (SPA route change, framework mount, HTMX swap). Idempotent:
  an element is bound to a behavior once, however often init runs. Delegated
  behaviors (modals, popovers, tooltips, confirm, lightbox) listen on `document`
  and need no re-init.
- `QZ.store`, `QZ.i18n`, `QZ.scroll`, `QZ.q`, `QZ.ready`, `QZ.cal` — stable
  aliases of the shared helpers, which also remain available under their
  historical globals (`QZstore`, `QZi18n`, `QZscroll`, `QZq`, `QZready`,
  `QZcal`).

## Form vocabulary

Canonical stable vocabulary for new product forms:

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

Legacy-compatible vocabulary:

- `.field-row`
- `.fld`
- `.ferr`
- `.fhelp`
- `.fok`
- `.field` where scoped by existing auth flows
- `.err` where scoped by existing auth flows

The legacy vocabulary remains supported until a documented major release removes
it. New product code should use the canonical vocabulary.

## Consumer responsibilities

Consumers must:

- pin the Strata version they ship
- follow [`UPGRADING.md`](UPGRADING.md) when moving between releases
- load tokens before kits
- load product theme overrides before kits when overriding root tokens
- load only the kits they use
- avoid undocumented classes and private implementation details
- avoid bare global element styles that accidentally override components
- scope product-specific CSS to product roots
- keep domain components in the product repo, not Strata

Recommended load order:

```html
<link rel="stylesheet" href="@qazana/strata/tokens">
<link rel="stylesheet" href="/theme.css">
<link rel="stylesheet" href="@qazana/strata/app">
<script type="module" src="@qazana/strata"></script>
```

Avoid global rules like:

```css
a { color: var(--primary); }
button { border-radius: 0; }
input { font: inherit; }
```

Prefer scoped or classless-content selectors:

```css
.product-shell a:not([class]) { color: var(--primary); }
.product-shell :where(button:not([class])) { font: inherit; }
```

## Deprecation policy

Deprecations must be documented in the changelog and the relevant docs.

A deprecation entry must include:

- the legacy surface
- the replacement
- whether it still works
- the earliest release where removal may happen

Stable surfaces should not be removed before a major release. Legacy aliases
should remain covered by demos or harness checks while they are supported.

## Changelog policy

Changelog entries should call out contract impact:

- `Contract: stable addition`
- `Contract: stable behavior preserved`
- `Contract: legacy alias deprecated`
- `Contract: breaking change`
- `Contract: experimental`

If a change touches a stable surface and downstream products may need action,
write that action plainly in the changelog.
