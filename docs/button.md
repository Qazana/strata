# Standalone buttons (experimental)

This entry is **Unreleased**. Check [the changelog](../CHANGELOG.md) for availability.

Import `@qazana/strata/button` for incremental adoption in an existing app.
This entry is experimental and may change in a minor release. It loads only
unlayered, namespaced button CSS and button-local tokens. Existing kit exports
keep their layered behavior. No JavaScript, root styles, font files or global
reset are loaded.

```html
<button class="qz-button qz-button-primary" data-qz-theme="light">Save</button>
<button class="qz-button qz-button-secondary" data-qz-theme="light">Cancel</button>
```

Use `.qz-button` with exactly one modifier: `qz-button-primary`,
`qz-button-secondary`, `qz-button-danger`, `qz-button-outline`,
`qz-button-ghost` or `qz-button-link`. Use native buttons for actions and anchors
with `href` for navigation. There is no implicit variant. Sizing is comfortable;
compact density, icon buttons and loading indicators are outside this entry.

Set `data-qz-theme="light"` or `"dark"` on each button. Unset follows the OS.
Ancestor `data-theme` and `data-density` do not affect these buttons. The host
must provide a matching surface: a dark button's focus ring and transparent
variants need a dark background. An OS-themed region can use
`color-scheme: light dark; background: Canvas; color: CanvasText`. Explicit light
or dark regions should set the corresponding `color-scheme`. The host also owns
focus styles for its other controls and programmatic content targets; the button
entry deliberately leaves those elements unchanged.

Native
`disabled` prevents activation; `.is-disabled` only supplies visual styling and
must not replace native semantics. Frameworks retain event and loading ownership.

Override local tokens on the button after the import. Ancestor token overrides
do not replace button-local defaults. For example:

```css
.qz-button {
  --qz-button-body: 'Product Sans', sans-serif;
  --qz-button-primary: #2455a4;
  --qz-button-primary-bright: #173e80;
  --qz-button-on-primary: #fff;
}
```

The default font stack comes from Strata's body token. It uses already available
DM Sans or its fallback, then system sans-serif. This entry does not load fonts.
Products supply their own font assets. The entry uses rem units, so document
text sizing still applies. Explicit local line-height, tracking, box sizing and
margin protect geometry from inherited app styles. Native buttons keep normal
line-height and automatic appearance, matching the full kit. Anchors keep the
body leading token.

Token names are the canonical dependency names prefixed with `--qz-button-`.
The generated `tokens/button.tokens.css` lists the complete set. Common overrides
are `body`, `primary`, `primary-bright`, `on-primary`, `danger`, `danger-rgb`,
`on-danger`, `focus-ring`, `radius`, `ctl-font`, `btn-pad-x` and `btn-pad-y`.
Keep danger and its RGB channel paired. Check contrast after changing colors.
Unlayered app selectors with greater specificity or important declarations can
still override these buttons; this is a migration entry, not style isolation.

Run `npm run build:button` after editing canonical app/base rules or tokens.
`npm test` checks generated output and dependency closure. Do not edit the
generated files directly. Existing `app` button markup remains unchanged.
