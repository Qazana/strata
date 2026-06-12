---
title: Brand a product
description: Re-skin the whole system for a product by overriding a handful of tokens.
sidebar:
  order: 1
---

Because tokens are the contract, branding a product is a token override — not a
component fork. One block re-tints solid fills, soft tints, rings and borders
together.

## 1. Load the foundation, then override

```css
@import '@qazana/strata/tokens';

:root {
  /* brand — always provide BOTH the hex and the channel triple */
  --primary: #ff6b4a;
  --primary-rgb: 255 107 74;
  --on-primary: #ffffff;      /* guaranteed-contrast text on --primary */

  /* optional: semantic accents */
  --danger: #d92d3f;
  --accent: #7c5cff;
}
```

The `-rgb` triple is what powers `rgb(var(--primary-rgb) / .12)` tints — without
it, soft fills and focus rings won't follow your brand.

## 2. Keep both schemes correct

If you override per scheme, set the values inside the matching selector so Dark
Knight and Désert Dunes each get the right brand value:

```css
:root[data-theme='desert-dunes'] { --primary: #e0552f; }
```

## 3. Alias existing brand variables

If your app already has brand vars (e.g. an existing `--app-*` set), alias rather
than duplicate:

```css
:root { --primary: var(--wis-primary); }
```

## 4. Verify both schemes

A single-theme screenshot can't catch a token that breaks in the other scheme.
Render light **and** dark before shipping — the repo harness does this for the
library itself.

:::caution
Renaming or removing a token is a **breaking** change for every consumer. Add new
tokens; don't repurpose existing ones.
:::
