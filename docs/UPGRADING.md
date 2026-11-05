# Upgrading existing consumers

Check [CHANGELOG.md](../CHANGELOG.md) for the target release and required migration
steps. These docs describe the current checkout; **Unreleased** entries are not
available from a published package yet.

Exported kits and documented tokens, classes, markup, and behavior hooks are
semver-protected unless marked experimental. See the
[API contract](API_CONTRACT.md) for stability and deprecation rules.

## Before upgrading

Note the installed version, imported kits, product theme, and any vendored
assets. Check custom CSS that targets Strata classes. Broad unlayered selectors
such as `a {}` and `button {}` override layered kit styles. Scope them to
classless content or place them in a layer ordered before `qazana`.

Read the release notes for changes to behavior hooks and experimental entries.
Keep a record of the previous version so rollback is straightforward.

## Update the dependency

Install the chosen published version and commit the dependency and lockfile
changes together. For example, to pin the 1.0.0 release:

```bash
npm install --save-exact @qazana/strata@1.0.0
```

For local development with a `file:../qazana-strata` dependency, refresh the
installation after updating the library checkout. A local dependency may contain
unreleased changes; it does not establish release availability.

Keep tokens, kits, fonts, and JavaScript on the same version.

### Bundled applications

Use package exports in the browser entry point:

```js
import '@qazana/strata/tokens';
import './theme.css';
import '@qazana/strata/app';
import '@qazana/strata';
```

Keep Tailwind token mappings pointed at CSS variables. In Ember, import tokens
and kits through the app's CSS pipeline and load the script in the browser entry.
After a route transition or framework mount inserts new behavior markup, call
`window.QZ.init(root)`. Repeated calls do not double-bind existing elements.

### Static HTML and vendored assets

Copy the matching `tokens`, `kits`, `fonts`, and `js` directories from the
installed package into the site's public `vendor/strata/` directory. Preserve
the relative paths. Use public file URLs in HTML:

```html
<link rel="stylesheet" href="/vendor/strata/tokens/qazana.tokens.css">
<link rel="stylesheet" href="/theme.css">
<link rel="stylesheet" href="/vendor/strata/kits/site.css">
<script type="module" src="/vendor/strata/js/qazana.js"></script>
```

If the site has a `sync-strata` script, run it after updating the dependency.
That script belongs to the consuming site; Strata does not provide it. Keep
product overrides outside the generated vendor directory. Commit refreshed
vendored files with the dependency update when the site tracks them.

WordPress and PHP consumers should enqueue the same versioned assets in this
order: tokens, product theme, kits, then JavaScript.

## Compatibility notes

### Forms

Use `.form-field`, `.field-label`, `.field-req`, `.field-optional`, `.field-help`,
and `.field-error` for new forms. Existing `.field-row`, `.fld`, `.ferr`,
`.fhelp`, `.fok`, and scoped auth `.field` / `.err` patterns remain supported.
An upgrade alone does not require rewriting working forms. See [Forms](forms.md)
for markup and accessible label/error relationships.

### Validation

`data-validate` uses the native Constraint Validation API. Use standard attributes
such as `required`, `type="email"`, and `minlength`, or `data-match="#password"`
for a matching field. Dynamically inserted and newly enabled controls participate
in validation; disabled controls do not.

A valid form with an `action` submits normally. Without an `action`, it stays on
the page. Use `data-validate="confirm"` to opt into the inline success summary.

### Form persistence

`data-persist` needs an explicit storage key or a form ID. It defaults to
`localStorage`; session scope and a TTL are optional:

```html
<form data-persist="contact-draft" data-persist-scope="session" data-persist-ttl="3600000">
  <label for="subject">Subject</label>
  <input id="subject" name="subject" type="text">
</form>
```

The engine excludes password/file inputs, `data-no-persist` fields, and sensitive
name or ID patterns. Names, email addresses, and free text can still be stored.
Use `data-no-persist` on any field the application must exclude.

### Submit locks

`data-submit-lock` blocks repeat submissions and marks the submitting button
as loading. It defers disabling submit buttons until the current submit event
finishes, preserving native submitter values and action overrides.

In a JavaScript handler, build `new FormData(form, event.submitter)` synchronously,
before awaiting a request. Dispatch `qz:unlock` on the form when the request
finishes. See [Submit locks](forms.md#submit-locks) for the complete contract.

### Overlays and tooltips

Modal, drawer, command palette, lightbox, and confirm share scroll locking.
Verify stacked overlays before removing product workarounds for body overflow
or focus restoration.

Text `data-tip` and rich `.tip > .tip-pop` tooltips use one floating node under
`body`. Review screens with clipping or transform workarounds; those workarounds
may no longer be needed.

### Relative time

`data-relative-time` reads a `<time>` element's `datetime` and updates every
minute. Keep `datetime` machine-readable.

## Verify the consumer

Run the app's tests and build. At desktop and phone widths, exercise the surfaces
it uses: theme and density switching, RTL layout, forms, overlays, keyboard
navigation, and any kit-specific interactions such as billing or checkout.
Check framework route transitions as well as the initial page load.

The library's [harness](../harness/README.md) covers its demos. It does not replace
checks against the consumer's theme, markup, and CSS.

## Rollback

Restore the previous pinned dependency and lockfile, plus the matching vendored
assets if used. Report a regression with the versions before and after, affected
kit, minimal markup, and reproduction steps. Include a screenshot for visual
issues. Keep private product details out of public issue reports.
