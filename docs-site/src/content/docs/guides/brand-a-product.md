---
title: Brand a product
description: Override semantic colors while keeping both schemes readable.
sidebar:
  order: 1
---

Keep the product theme in the product repo. Load shared tokens first, then the
unlayered theme, then the kits the page needs.

## Override the color family

This example uses light blue on dark surfaces and deeper blue on light surfaces.
It updates the fill, channels, foreground, and emphasis colors together:

```css
:root {
  --primary: #93c5fd;
  --primary-rgb: 147 197 253;
  --on-primary: #0b1730;
  --primary-bright: #bfdbfe;
  --primary-bright-rgb: 191 219 254;
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]):not([data-theme="dark-knight"]) {
    --primary: #2455a4;
    --primary-rgb: 36 85 164;
    --on-primary: #ffffff;
    --primary-bright: #173e80;
    --primary-bright-rgb: 23 62 128;
  }
}

:root[data-theme="desert-dunes"],
:root[data-theme="light"] {
  --primary: #2455a4;
  --primary-rgb: 36 85 164;
  --on-primary: #ffffff;
  --primary-bright: #173e80;
  --primary-bright-rgb: 23 62 128;
}
```

The media query covers OS-selected light mode. The attribute selectors cover an
explicit choice. Channel values drive soft fills and borders, while the bright
variant supplies emphasis and the default focus-ring color.

Use the same pairing rule for semantic colors such as `--danger` and `--accent`.
If the product already defines brand variables, alias the whole family to those
variables rather than maintaining two sets of values.

## Check the result

Review explicit light and dark modes and the unset, OS-driven mode. Check text
on solid fills, hover states, links on soft surfaces, and keyboard focus rings.
Also review compact density where the product uses it.

The [theme demo](/demo/themes/index.html) shows example override files. To add
another named scheme, define its `:root[data-theme="name"]` token block and include
that name in the `data-theme-toggle` cycle. Set its `color-scheme` for native
controls. Add the scheme to the render harness when maintaining it in this repo.

Renaming or removing a public token is a breaking change. See the
[API contract](https://github.com/Qazana/strata/blob/master/docs/API_CONTRACT.md).
