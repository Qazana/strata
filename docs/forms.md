# Forms

Live demo: [forms](../demo/foundations/forms.html).

The form **control base** (inputs/select/textarea), **validation states**, the
**`.form-field`** group, and `.fieldset` live in `kits/base.css` — universal, so
every kit's forms match.

Single-line inputs and selects share font size, line-height and padding through
`--ctl-font`, `--leading-normal`, `--ctl-pad-y` and `--ctl-pad-x`. Their heights
match in comfortable and compact density, including side-by-side layouts. Widths
follow the layout. Textareas and multiple selects retain their multi-row sizing.

## Contract status

`.form-field` is the canonical stable vocabulary for new product forms. The
legacy `.field-row` / `.fld` / `.ferr` family remains supported for existing
consumers, and scoped auth-flow `.field` / `.err` usage remains supported inside
`auth.css` patterns.

New product code, docs, and demos should use the canonical vocabulary unless
they are intentionally demonstrating legacy compatibility. Legacy aliases must
not be removed before a documented major release. See
[`API_CONTRACT.md`](API_CONTRACT.md) for the stability and deprecation policy.

## Field group: `.form-field`
```html
<div class="form-field">
  <label for="email">Email <span class="field-req" aria-hidden="true">*</span></label>
  <input id="email" type="email" required aria-describedby="email-help">
  <span id="email-help" class="field-help">We'll never share it.</span>
</div>
```
| Part | Class |
|------|-------|
| Group wrapper (label + control + help/error) | `.form-field` |
| Label | `<label>` (or `.field-label`) |
| Required marker | `.field-req` |
| Optional marker | `.field-optional` |
| Help text | `.field-help` |
| Error message | `.field-error` |

## Validation states

Success feedback has its own token family: `--success`, `--success-rgb`,
`--success-bright` and `--on-success`. Defaults alias the primary brand tokens,
so existing themes keep their colors. To make success independent of brand,
override all four on the same theme root. The solid/channel pair controls field
borders and halos; bright controls feedback text and saved-button fills; the
foreground must contrast with that fill. Classes and validation behavior do not
change. The components demo includes an independent green success example.

These tokens style successful fields, `.fok`, `.form-msg.ok` and
`.btn.is-success`. Navigation and progress styling still use brand tokens.

Canonical: **`.is-error`** / **`.is-success`** (alias `.invalid` = error).
Put `.is-error` on the **group** to light up the control border, label, and
error message together; or on a single control directly.
```html
<div class="form-field is-error">
  <label for="password">Password</label>
  <input id="password" type="password" aria-invalid="true" aria-describedby="password-error">
  <span id="password-error" class="field-error">Must be at least 8 characters.</span>
</div>
```
CSS classes style the state; they do not create accessible relationships. Give
controls unique IDs and associate visible labels with `for`. Reference help and
current error IDs in `aria-describedby` (space-separated when both apply), and
set `aria-invalid="true"` only while invalid. When an error clears, remove its ID
from the description and retain the help IDs. A visible label normally makes an
additional `aria-label` unnecessary; that attribute would override the label.
Framework-controlled forms own these attributes without enabling `data-validate`.

`input[readonly]` (dashed) and `:disabled` (dimmed) are styled automatically.

## Fieldset & summary
- `.fieldset` > `<legend>` — group related fields.
- `.form-msg.error` / `.form-msg.ok` — form-level summary banner.

Compose with the layout primitives (`.l-stack`, `.l-row`, `.l-grid`) for form
layouts — e.g. a two-up city/postcode row with `.l-row`.

> Note: `auth.css` keeps its scoped `.field` *wrapper* + `.err` for the standalone
> auth flows; `.form-field` is the canonical vocabulary for new product forms.
> (`.field` is no longer a control style-class — that was removed to resolve the
> conflict.)

## Validation: `[data-validate]`
Put `data-validate` on a `<form>` and the engine validates it through the **native
[Constraint Validation API](https://developer.mozilla.org/docs/Web/API/Constraint_validation)** —
no rule DSL. Declare rules with standard HTML attributes:

```html
<form data-validate>
  <div class="form-field">
    <label for="em">Email <span class="field-req">*</span></label>
    <input id="em" name="email" type="email" required>
  </div>
  <div class="form-field">
    <label for="pw">Password</label>
    <input id="pw" type="password" required minlength="8">
  </div>
  <div class="form-field">
    <label for="pw2">Confirm</label>
    <input id="pw2" type="password" data-match="#pw">
  </div>
  <button type="submit" class="btn">Create</button>
</form>
```

| Concern | How |
|---------|-----|
| Rules | `required`, `type="email"/"url"`, `minlength`, `maxlength`, `pattern`, `min`/`max`/`step` |
| Cross-field | `data-match="#otherField"` (e.g. confirm-password) |
| Custom message | `data-msg="…"` (whole field) or `data-msg-match="…"`; global defaults via `window.QZi18n.validate` |
| Async / remote | call `input.setCustomValidity(msg)` — it renders through the **same** error node |
| Timing | validates on submit, on **blur** after a field is touched, then live-clears once fixed |
| Positive feedback | a valid **non-empty** field gains `.is-success` (empty optional fields stay neutral) |
| a11y | sets `aria-invalid`, appends the error ID to `aria-describedby` while preserving help IDs, removes the auto-cleared error ID after correction, focuses the first invalid field, adds `novalidate` so we own the UX |
| Vocabulary | drives canonical `.form-field`/`.field-error`/`.is-error` and legacy-compatible `.field-row`/`.ferr` — resolves whichever wraps the control |
| Valid submit | submits normally if the form has an `action`. An **action-less** form stays put (no reload), and shows the inline `.form-msg.ok` only when opted in with `data-validate="confirm"` — so a JS-handled form never gets an uninvited success banner |

Author-owned errors marked `data-auto="0"` remain visible and associated after
native validation clears. The application owns their message and lifetime.

Validation reads the current controls on every submit. Newly inserted fields and
fields enabled after initialization participate without rebinding the form.
Disabled controls are excluded. Date-picker selections emit bubbling `input`
and `change` events, so they reach validation and autosave.

### Localizing copy
The built-in strings for `[data-validate]`, `[data-qz-confirm]`, and `[data-relative-time]`
live in a shared `QZi18n` table. Override them by setting `window.QZi18n` **before**
`js/qazana.js` loads (deep-merged with the defaults); per-element `data-*` attributes
still win over the global table.

```html
<script>
  window.QZi18n = {
    validate: { required: 'Champ obligatoire.', email: 'E-mail invalide.' },
    confirm:  { ok: 'Confirmer', cancel: 'Annuler' },   // [data-qz-confirm] dialog
    locale:   'fr',                                      // optional — Intl.RelativeTimeFormat locale
  };
</script>
<script type="module" src="/vendor/strata/js/qazana.js"></script>
```

## Form behaviors

### Draft persistence

Use an explicit `data-persist` key or a form ID. Without either, the behavior
does not save. Keys should be unique to the form within the site's storage:

```html
<form data-persist="contact-draft" data-persist-scope="session" data-persist-ttl="3600000">
  <label for="subject">Subject</label>
  <input id="subject" name="subject" type="text">
</form>
```

The engine saves eligible fields on input and restores them during initialization.
`data-persist-scope` selects `local` (the default) or `session` storage.
`data-persist-ttl` expires the draft after that many milliseconds. Saved data has
a schema version so incompatible drafts can be discarded.

Password and file inputs, `data-no-persist` controls, and sensitive name or ID
patterns are excluded. The engine checks both identifiers independently for
terms such as `pass`, `card`, `cvv`, `cvc`, `ssn`, `secret`, `token`, `otp`, and
`pin`, including unambiguous compounds such as `creditcard` and `mypassword`.
Names, email addresses, and free text can still be stored. Mark any additional
private fields with `data-no-persist`; choose session scope or a TTL where needed.

A native submit clears the draft. A JavaScript handler that prevents submission
keeps it; clearing is deferred so `preventDefault()` takes effect first.

### Submit locks

Add `data-submit-lock` to block repeated submissions while a request is pending.
The actual submitter receives `.is-loading` and `aria-busy`. All submit buttons
are disabled after the current event finishes, so native submissions retain the
submitter's name, value, and action overrides.

A JavaScript submit handler should call `preventDefault()` and build
`new FormData(form, event.submitter)` synchronously, before awaiting a request.
When the request finishes, dispatch `qz:unlock` on the form, including on failure:

```js
form.dispatchEvent(new Event('qz:unlock'));
```

A numeric attribute value, such as `data-submit-lock="5000"`, unlocks after that
many milliseconds. The next edit and `pageshow` also unlock the form. Unlocking
restores controls that were enabled before submission and leaves author-disabled
controls disabled.

### Textarea sizing and counters

| Attribute | Element | Behavior |
| --- | --- | --- |
| `data-autosize` | `textarea` | Grows to fit content, capped by CSS `max-height` |
| `data-char-count[="selector"]` | Control with `maxlength` | Updates an `aria-live` counter and adds `.is-near` near the limit |

The counter uses the selector's target, then a `.char-count` or `.counter` in
the field. If none exists, the behavior creates one.
