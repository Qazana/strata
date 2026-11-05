---
title: Vanilla / HTML
description: Use Qazana Strata in a plain HTML/JS project.
sidebar:
  order: 2
---

Copy `kits`, `tokens`, `fonts`, and `js` from the installed package into your
public `/vendor/strata/` directory. Keep these directories together so CSS imports
and font URLs resolve. Load them with public URLs; browsers do not resolve npm
export names in HTML attributes.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Strata example</title>
    <link rel="stylesheet" href="/vendor/strata/tokens/qazana.tokens.css" />
    <link rel="stylesheet" href="/vendor/strata/kits/app.css" />
  </head>
  <body>
    <button class="btn btn-primary">Save</button>

    <!-- Escape and outside click close the dialog; focus stays inside while open. -->
    <button class="btn btn-outline" data-modal-open="#edit">Edit</button>
    <div class="modal-scrim" id="edit" role="dialog" aria-modal="true" aria-label="Edit item" hidden>
      <div class="modal-dialog"><button data-modal-close>Close</button></div>
    </div>

    <script type="module" src="/vendor/strata/js/qazana.js"></script>
  </body>
</html>
```

## Theming per product

Load product theme overrides after the foundation and before kit CSS. Change
solid colors, their RGB channels, and matching foregrounds together. See
[Brand a product](/guides/brand-a-product/) for a complete example.

Keep product-specific components in the product repo. See
[Build domain components](/guides/domain-components/).

## Dynamic markup

After inserting new behavior markup, call `window.QZ.init(root)` with the inserted
element, or `window.QZ.init()` for the whole document. Existing elements do not
bind twice.

## Switching scheme & density

```html
<html data-theme="dark-knight">   <!-- or "desert-dunes"; unset follows the OS -->
<html data-density="compact">     <!-- orthogonal to colour; great for admin UIs -->
```

A `[data-theme-toggle]` button cycles schemes; `[data-density-toggle]` flips density.
