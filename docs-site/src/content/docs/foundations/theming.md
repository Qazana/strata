---
title: Theming
description: Color schemes, foreground pairs, and product overrides.
sidebar:
  order: 2
---

Color scheme and [density](/foundations/density/) are independent. Both use
token overrides.

## Named schemes

| Scheme | `data-theme` | Surface | Primary |
| --- | --- | --- | --- |
| Dark Knight | `dark-knight` or `dark` | Near black | Teal |
| Désert Dunes | `desert-dunes` or `light` | Warm cream | Coral |

```html
<html data-theme="dark-knight">  <!-- dark -->
<html data-theme="desert-dunes"> <!-- light -->
<html>                           <!-- follows the OS -->
```

Tokens set `color-scheme` so native controls and scrollbars match. A
`data-theme-toggle` button cycles schemes and saves the choice. Supply a
comma-separated value to choose the cycle:

```html
<button type="button" data-theme-toggle="dark-knight,desert-dunes">Switch theme</button>
```

## Foreground and channel pairs

Use the matching `--on-*` token for text on a solid fill:

```css
.badge-primary {
  background: var(--primary);
  color: var(--on-primary);
}
```

Colors with alpha tints have an RGB channel triple:

```css
background: rgb(var(--primary-rgb) / .12);
```

When changing a fill, update its solid color, channels, and foreground together.
Check emphasis and focus colors too, including `--primary-bright` and
`--focus-ring`. Arbitrary overrides need contrast checks in each scheme.

## Product themes

Each product owns its theme file. Load it after the token foundation and before
kit CSS. Follow [Brand a product](/guides/brand-a-product/) for a complete example,
including the automatic light scheme.

The [live theme switcher](/demo/themes/index.html) uses fictional brands to show
how overrides affect components. Product theme files stay in their own repos.

## Cascade order

Shared tokens and main kits use `@layer qazana`. An unlayered product theme
wins over those rules, even when its selector is simply `:root`.

Broad unlayered app selectors also override kit components. Scope rules such as
`a {}` and `button {}` to the content they should affect, or put app base styles
in an earlier layer:

```css
@layer app-base, qazana;
```

The standalone button, tab, and accordion entries use unlayered component CSS.
See each entry's docs before combining it with app styles.
