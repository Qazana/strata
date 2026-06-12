---
title: Changelog
description: Notable changes to Qazana Strata.
sidebar:
  order: 2
---

Semantic versioning: **patch** = fix · **minor** = additive component/token/kit ·
**major** = rename/removal/breaking token change.

## 0.0.1

Initial release.

- **Tokens** — semantic design tokens (color, type, space, radius, elevation,
  density) with two schemes: Dark Knight (canonical dark) and Désert Dunes
  (light), OS-auto by default. Tokens and kits live in the `qazana` cascade
  layer, so unlayered consumer CSS and theme overrides always win.
- **Seven kits** — App, Site, Content, Auth, Email, Media, Commerce. Scoped,
  independently importable, all themed by the same tokens.
- **Behaviors** — one vanilla `data-*`-driven script, no framework
  dependencies, no build step.
- **Theming** — one `:root{}` override re-brands everything. Self-hosted
  variable fonts (Figtree display, DM Sans body, JetBrains Mono data; Syne
  available) with metric-matched fallbacks for ~0 CLS.
- **Demos as the live spec** — every kit and variant, including a live theme
  switcher.

The full commit-level history lives in the
[repository](https://github.com/qazana/strata/commits/).
