# Qazana Strata — maintenance rules

This repo is the **shared, framework-agnostic** UI library for Qazana products.
It ships **semantic design tokens** + **vanilla, data-attribute-driven component
CSS/JS**. Each product themes it and adds its own **domain** components on top.
These rules govern how Claude maintains it.

## Non-negotiables

1. **Tokens are the single source of truth.** Never hardcode a color, radius,
   spacing, shadow, font, or duration in component CSS — reference a token
   (`var(--primary)`, `var(--radius)`, `var(--space-3)`, …). Tokens live in
   `tokens/qazana.tokens.css`.
2. **Brand colors are themeable, named semantically** — `--primary`, `--danger`,
   `--warning`, `--info`, `--accent`. Never `--green`/`--coral`. Alpha tints use
   the channel form: `rgb(var(--primary-rgb) / .12)`, never a literal
   `rgba(29,185,84,…)`. A single per-app override must re-tint everything.
3. **No domain-specific components.** Anything tied to one product (a music
   app's tracklist, a fintech's rate-locks, a media tool's sync controls)
   belongs in that product's repo, not here. If a component encodes business
   logic or product vocabulary, it does not go here.
4. **Vanilla + data-attribute behaviors.** JS attaches via `data-*` hooks
   (`data-combo`, `data-reorder`, …) and works in any framework via the rendered
   DOM. No framework dependencies; no build step required to consume.
5. **Accessibility + motion.** Every interactive component is keyboard-operable
   with sensible ARIA, and every animation respects
   `@media (prefers-reduced-motion: reduce)`.
6. **Type discipline.** `--display` (signature face) is for large headings and
   brand only; everything else is `--body`; data/code is `--mono`.

## When you change anything

- Update the **demo** (`demo/`) so the change is visible.
- Update the relevant **doc** in `docs/`.
- Keep `tokens/tokens.json` in sync with `tokens/qazana.tokens.css`.
- **Bump the version** in `package.json` (semver: patch = fix, minor = additive
  component/token, major = rename/removal/breaking token change). Renaming or
  removing a token is a **breaking** change — note it in the commit.
- A new generic element appearing in a consuming app should be **added here
  first**, then consumed — never forked into the app.

## Consuming projects

Consumed per stack as documented in the README (vanilla, React + Tailwind,
Ember). The product roster, per-product integration notes, and internal plans
live in the **private `qazana-meta` repo** (`strata/consumers.md`,
`strata/plans/`) — product identity stays out of this repo and its history.
Per-product theme files are private and live in qazana-meta (strata/themes/) until each product owns its copy.

Keep this file accurate; it is the contract for reuse.
