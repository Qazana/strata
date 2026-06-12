---
title: Ember
description: Use Qazana Strata in an Ember app.
sidebar:
  order: 4
---

For an Ember app, import the tokens and a kit in your app styles, then
reference `var(--…)` in component styles like any other CSS custom property.

## 1. Import in `app/styles/app.css`

```css
@import '@qazana/strata/tokens';
@import '@qazana/strata/app';
```

## 2. Load the behaviour script

Add the module to your `index.html` (or via your build's vendor pipeline):

```html
<script type="module" src="@qazana/strata"></script>
```

## 3. Reference tokens in component styles

```css
.rate-lock {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--text);
}
```

## Glimmer gotchas worth knowing

- Bind boolean attributes directly — `draggable={{@cond}}` — not
  `draggable="{{if @cond 'true' 'false'}}"`. The string `'false'` is truthy on
  the IDL property, so the element stays draggable.
- `<select>` value isn't two-way bound by default; use a modifier or set it
  explicitly in the component.

These are Ember/Glimmer behaviours, not Qazana ones, but they bite when wiring
the `data-*` hooks to dynamic state.
