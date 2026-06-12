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
