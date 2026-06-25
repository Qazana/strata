# Forms

Live demo: `demo/foundations/forms.html`.

The form **control base** (inputs/select/textarea), **validation states**, the
**`.form-field`** group, and `.fieldset` live in `kits/base.css` — universal, so
every kit's forms match.

## Field group — `.form-field`
```html
<div class="form-field">
  <label for="email">Email <span class="field-req">*</span></label>
  <input id="email" type="email">
  <span class="field-help">We'll never share it.</span>
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
Canonical: **`.is-error`** / **`.is-success`** (alias `.invalid` = error).
Put `.is-error` on the **group** to light up the control border, label, and
error message together; or on a single control directly.
```html
<div class="form-field is-error">
  <label>Password</label>
  <input type="password">
  <span class="field-error">Must be at least 8 characters.</span>
</div>
```
`input[readonly]` (dashed) and `:disabled` (dimmed) are styled automatically.

## Fieldset & summary
- `.fieldset` > `<legend>` — group related fields.
- `.form-msg.error` / `.form-msg.ok` — form-level summary banner.

Compose with the layout primitives (`.l-stack`, `.l-row`, `.l-grid`) for form
layouts — e.g. a two-up city/postcode row with `.l-row`.

> Note: `auth.css` keeps its scoped `.field` *wrapper* + `.err` for the standalone
> auth flows; `.form-field` is the canonical vocabulary going forward. (`.field`
> is no longer a control style-class — that was removed to resolve the conflict.)

## Validation — `[data-validate]`
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
| a11y | sets `aria-invalid`, wires the error via `aria-describedby`, focuses the first invalid field, adds `novalidate` so we own the UX |
| Vocabulary | drives `.form-field`/`.field-error`/`.is-error` (and the legacy `.field-row`/`.ferr`) — resolves whichever wraps the control |
| Valid submit | submits normally if the form has an `action`. An **action-less** form stays put (no reload), and shows the inline `.form-msg.ok` only when opted in with `data-validate="confirm"` — so a JS-handled form never gets an uninvited success banner |

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
<script src="js/qazana.js" defer></script>
```

## Form behaviors
Generic, opt-in, data-attribute behaviors that round out forms:

| Attribute | On | Does |
|-----------|----|------|
| `data-persist[="key"]` | `<form>` | Autosaves non-sensitive fields to storage on input, restores on load. Scope via `data-persist-scope="local"\|"session"`; optional `data-persist-ttl="<ms>"` expires the draft; the blob is version-stamped so a schema change invalidates old drafts. **Never** stores `password`/`file` inputs, `[data-no-persist]`, or fields whose name/id token-matches `pass\|card\|cvv\|cvc\|ssn\|secret\|token\|otp\|pin`. Cleared on a real submit (deferred so a JS/AJAX handler's `preventDefault` is honored). **Privacy:** non-sensitive PII (name, email, free-text) still lands in `localStorage` by default — set `session` scope or a TTL on shared machines. |
| `data-autosize` | `<textarea>` | Grows the textarea to fit its content (a CSS `max-height` still caps it). |
| `data-char-count[="sel"]` | control with `maxlength` | Keeps a counter (`"n / max"`, `aria-live`) in sync; gains `.is-near` close to the limit. Counter is the selector's target, else a `.char-count`/`.counter` in the field, else one is created. |
| `data-submit-lock[="ms"]` | `<form>` | Disables the submit button (`+ .is-loading`, `aria-busy`) once a submit passes validation, blocking double-submits. Unlock seams so a JS-handled submit can't stay stuck: a numeric value auto-unlocks after that many ms; the form also unlocks on a `qz:unlock` event (dispatch it from your AJAX handler), on the next edit, and on `pageshow`. |
