---
title: Theming
description: How colour schemes work — Dark Knight, Désert Dunes, and per-product brands.
sidebar:
  order: 2
---

Colour is one of the two orthogonal axes (the other is
[density](/strata/foundations/density/)). A scheme is just
a block of token overrides — no CSS fork.

## The two named schemes

| Scheme | `data-theme` | Surface | Accent |
| --- | --- | --- | --- |
| **Dark Knight** (canonical) | `dark-knight` (alias `dark`) | deep navy | teal |
| **Désert Dunes** | `desert-dunes` (alias `light`) | warm cream | coral |

```html
<html data-theme="dark-knight">   <!-- force dark -->
<html data-theme="desert-dunes">  <!-- force light -->
<html>                            <!-- unset → follows OS via prefers-color-scheme -->
```

The tokens set `color-scheme` for you, so native form controls and scrollbars
match. A `[data-theme-toggle]` button cycles the schemes.

## Foreground pairs

Every solid fill has an `--on-*` text token (`--on-primary`, `--on-danger`, …),
so contrast is guaranteed rather than lucky. Use them whenever you fill with a
brand colour:

```css
.badge-primary { background: var(--primary); color: var(--on-primary); }
```

## Alpha tints — always the channel form

Each colour also ships an `-rgb` channel triple. Build soft fills, rings and
hover states from it so they re-tint with the brand:

```css
background: rgb(var(--primary-rgb) / .12);   /* soft fill */
box-shadow: 0 0 0 3px rgb(var(--primary-rgb) / .22); /* focus ring */
```

Never write a literal `rgba(45, 212, 191, …)` — it won't follow a brand override.

## Adding a product brand

Override the brand/semantic tokens after the foundation. One block re-skins
everything:

```css
:root {
  --primary: #ff6b4a;
  --primary-rgb: 255 107 74;
  --on-primary: #ffffff;
}
```

Neutral lines and borders flow through `--border-rgb`, so they flip with the
scheme automatically. See [Brand a product](/strata/guides/brand-a-product/)
for the full recipe.

## Product themes are private

Each consuming product owns its `theme.css` — a single `:root{}` override
shipped in the product's own repo, not published with the kit. The pattern is
demonstrated with fictional example brands:

| Example theme | Brand | Type |
| --- | --- | --- |
| `qazana` (umbrella) | coral | Fraunces · Space Grotesk |
| `aurora` | polar mint | Space Grotesk |
| `vermeil` | vermilion | Fraunces |
| `nocturne` | indigo | Bricolage Grotesque |

Try them in the [live theme switcher](/strata/demo/themes/index.html) —
picking a theme swaps a real override file onto the page.

## Theme overrides always win

The tokens and kits live in the `qazana` cascade layer; theme files and your
app's CSS are unlayered. Unlayered CSS beats layered CSS regardless of selector
specificity, so a plain `:root{}` theme outranks even the tokens'
higher-specificity scheme blocks (`:root[data-theme=…]`) — in both schemes,
with no `!important` and no selector games.
