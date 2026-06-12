# Changelog

All notable changes to `@qazana/strata`. Semver: patch = fix, minor = additive
component/token, major = rename/removal/breaking token change.

## 0.0.1 — 2026-06-12

Initial release.

- **Tokens** — semantic design tokens (color, type, space, radius, elevation,
  density) with two schemes: Dark Knight (canonical dark) and Désert Dunes
  (light), OS-auto by default. All token and kit CSS lives in the `qazana`
  cascade layer, so unlayered consumer CSS and per-product theme overrides
  always win.
- **Seven kits** — App, Site, Content, Auth, Email, Media, Commerce. Scoped,
  independently importable, all themed by the same tokens.
- **Behaviors** — one vanilla `data-*`-driven script (`@qazana/strata`), no
  framework dependencies, no build step.
- **Theming** — a product re-brands everything with a single `:root{}` override
  (`--primary` + channel triple, fonts). Self-hosted variable fonts (Figtree
  display, DM Sans body, JetBrains Mono data; Syne available) with
  metric-matched fallbacks for ~0 CLS.
- **Demos as the live spec** — every kit and variant under `demo/`, including
  a live theme switcher with fictional example brands.
