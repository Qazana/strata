# Qazana Strata — maintenance rules

This repo is the **shared, framework-agnostic** UI library for Qazana products.
It ships **semantic design tokens** + **vanilla, data-attribute-driven component
CSS/JS**. Each product themes it and adds its own **domain** components on top.
These rules govern how coding agents maintain it.

This repo is consumed across Qazana products and released publicly. The public
API contract lives in `docs/API_CONTRACT.md`: exported kits, documented tokens,
documented classes, documented DOM anatomy, and documented `data-*` hooks are
stable unless explicitly labeled otherwise. Read that contract before adding,
renaming, deprecating, or removing public surface area.

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
7. **Tooltips are one engine, auto-positioned.** Both authoring forms —
   `[data-tip="…"]` (text) and `.tip > .tip-pop` (rich markup) — are driven by a
   single behavior in `js/qazana.js` that renders **one floating node in `<body>`
   (`position:fixed`)**, so it escapes any `overflow:hidden`/`clip` or
   `transform`/`filter` ancestor, and **auto-positions**: `data-tip-pos` is the
   *preferred* side (default top); the engine flips to the opposite side when the
   preferred one would clip the viewport and shifts along the cross axis to stay
   in view. The pure-CSS `::before`/`::after` rendering is the **no-JS fallback**,
   suppressed by `.qz-tip-js` on `<html>`. Keep both content forms going through
   this engine — don't add a third tooltip mechanism. WCAG 1.4.13: rich tips are
   hoverable, all are `Escape`-dismissible and wired via `aria-describedby`; motion
   respects `prefers-reduced-motion`.

## When you change anything

- Update the **demo** (`demo/`) so the change is visible.
- Update the relevant **doc** in `docs/`.
- Keep `tokens/tokens.json` in sync with `tokens/qazana.tokens.css`, then
  regenerate the Figma export (`node scripts/figma-tokens.mjs` →
  `tokens/tokens.figma.json`; see `docs/figma.md`).
- **Log the change under `## Unreleased`** in `CHANGELOG.md` — do **not** bump
  `package.json` per change. The version is bumped and dated **only when a
  release is actually tagged + published**, at which point `## Unreleased`
  becomes the new version heading. This keeps the version honest: it always
  matches what's on the registry (gaps from unreleased churn are the bug we're
  avoiding). Classify the entry by semver (patch = fix, minor = additive
  component/token/kit/behavior, major = rename/removal/breaking public contract
  change) so the release bump is obvious. Renaming or removing a token, class,
  kit export, required markup pattern, or documented behavior hook is a
  **breaking** change — note it in the commit.
- A new generic element appearing in a consuming app should be **added here
  first**, then consumed — never forked into the app.

## Consuming projects

Consumed per stack as documented in the README (vanilla, React + Tailwind,
Ember). The product roster, per-product integration notes, internal plans, and
per-product theme files live in a **private companion repo** — product
identity (names included) stays out of this public repo and its history. The
pointer to that repo lives in local, untracked context (`CLAUDE.local.md`).

Keep this file accurate; it is the contract for reuse.
