---
title: Density
description: Compact mode — orthogonal to colour, powerful for admin and data-dense UIs.
sidebar:
  order: 3
---

Density is the second orthogonal axis. It's independent of colour scheme and
composes freely — you can run Dark Knight comfortable, Désert Dunes compact, or
any combination.

```html
<html data-density="compact">   <!-- default is comfortable -->
```

A `[data-density-toggle]` button flips it at runtime.

## What it changes

Compact mode re-routes the control/cell/row sizing tokens — padding, control
font size, table cell and side-row padding — so the change is uniform across
**every** component, including typography. It's not a per-component override;
it's a token swap:

| Token group | Drives |
| --- | --- |
| `--ctl-font`, `--ctl-pad-y/x` | inputs, selects, buttons, composite controls |
| `--btn-pad-y/x` | buttons |
| `--cell-pad-y/x` | table cells |
| `--row-pad-y/x` | side-nav / list rows |

Because the tokens are the source of truth, a component you add today inherits
compact behaviour for free as long as it routes its sizing through these tokens.

## When to use it

Compact is built for **admin panels and data-dense applications** — dashboards,
tables, settings — where vertical rhythm matters more than touch-target
generosity. Comfortable is the default for marketing, content and consumer flows.

## Adding a new component

Route padding/font through the density tokens. Only add an explicit
`[data-density="compact"]` override for fixed-dimension controls that can't be
expressed through the shared tokens — and verify **both** densities (and both
colour schemes) before shipping.
