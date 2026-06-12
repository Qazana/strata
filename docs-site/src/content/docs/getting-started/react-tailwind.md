---
title: React + Tailwind
description: Use Qazana Strata in a React + Tailwind app.
sidebar:
  order: 3
---

For a React + Tailwind app, load the Qazana CSS/tokens globally and map
the tokens into Tailwind so utilities and Qazana components share one palette.

## 1. Load tokens + kit globally

```ts
// app entry (e.g. main.tsx)
import '@qazana/strata/tokens';
import '@qazana/strata/app';
import '@qazana/strata';
```

## 2. Map tokens in `tailwind.config.js`

```js
export default {
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        danger: 'var(--danger)',
        surface: 'var(--surface)',
        // tints use the channel form:
        'primary-soft': 'rgb(var(--primary-rgb) / <alpha-value>)',
      },
      borderRadius: { DEFAULT: 'var(--radius)' },
    },
  },
};
```

Now `bg-primary` / `text-danger` / `rounded` resolve to the same tokens Qazana
components use — no drift between Tailwind utilities and library components.

## Existing `--wis-*` variables

If the app already defines its own brand vars, alias the Qazana tokens to them
in your theme so one source drives both:

```css
:root {
  --primary: var(--wis-primary);
  --danger: var(--wis-danger);
}
```

## Behaviours in React

The `data-*` behaviours attach on load to the rendered DOM, so they work with
React-rendered markup. For content that mounts after first paint, the dismissable
layers and command palette are delegated/global; component-scoped behaviours
(combobox, tree) initialise on `DOMContentLoaded` — re-run their setup after a
late mount if needed, or render the markup on the initial pass.
