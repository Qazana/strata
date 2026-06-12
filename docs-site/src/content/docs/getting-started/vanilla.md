---
title: Vanilla / HTML
description: Use Qazana Strata in a plain HTML/JS project.
sidebar:
  order: 2
---

The simplest integration. Load the tokens, a kit,
and the script — then write semantic HTML with the documented classes and
`data-*` hooks.

```html
<!doctype html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="@qazana/strata/tokens" />
    <link rel="stylesheet" href="@qazana/strata/app" />
  </head>
  <body>
    <button class="btn btn-primary">Save</button>

    <!-- a dismissable dialog — Esc / outside-click / focus-trap come for free -->
    <button class="btn btn-outline" data-modal-open="#edit">Edit</button>
    <div class="modal-scrim" id="edit" role="dialog" aria-modal="true" hidden>
      <div class="modal-dialog">…</div>
    </div>

    <script type="module" src="@qazana/strata"></script>
  </body>
</html>
```

## Theming per product

Override the brand tokens once, after the foundation, and everything re-tints —
solid fills, soft tints, rings and borders all flow from the same tokens:

```css
:root {
  --primary: #ff6b4a;
  --primary-rgb: 255 107 74; /* channel form powers rgb(var(--primary-rgb) / .12) tints */
}
```

Add product-specific (domain) components in your own repo — they do **not** go in
the shared library. See [Build domain components](/strata/guides/domain-components/).

## Switching scheme & density

```html
<html data-theme="dark-knight">   <!-- or "desert-dunes"; unset follows the OS -->
<html data-density="compact">     <!-- orthogonal to colour; great for admin UIs -->
```

A `[data-theme-toggle]` button cycles schemes; `[data-density-toggle]` flips density.
