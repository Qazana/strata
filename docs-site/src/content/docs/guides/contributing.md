---
title: Contributing
description: The maintenance contract for adding to or changing the library.
sidebar:
  order: 3
---

These are the non-negotiables from the repo's `CLAUDE.md` — the contract for
keeping the library reusable.

## Non-negotiables

1. **Tokens are the single source of truth.** Never hardcode a colour, radius,
   spacing, shadow, font or duration — reference a token.
2. **Brand colours are themeable and semantic** — `--primary`, `--danger`, … ;
   never `--green`/`--coral`. Alpha tints use the channel form
   `rgb(var(--primary-rgb) / .12)`.
3. **No domain-specific components.** Product vocabulary stays in the product repo.
4. **Vanilla + `data-*` behaviours.** No framework dependency; no build step to consume.
5. **Accessibility + motion.** Keyboard-operable with sensible ARIA; every
   animation respects `prefers-reduced-motion`.
6. **Type discipline.** `--display` for large headings/brand only; everything else
   `--body`; data/code `--mono`.

## When you change anything

- Update the **demo** (`demo/`) so the change is visible.
- Update the relevant **doc** (and this site).
- Keep `tokens/tokens.json` in sync with `tokens/qazana.tokens.css`.
- **Bump the version** (semver: patch = fix, minor = additive component/token,
  major = rename/removal/breaking token change).
- Verify **both schemes and both densities** with `npm run harness` before committing.

## Adding a component — decision rules

- **Needs behaviour?** Extend a shared primitive; don't inline focus/keyboard logic.
- **Introduces a fill?** Add/confirm its `--on-*` foreground.
- **Has sizing?** Route padding/font through density tokens.
- **Domain-specific?** Then it doesn't belong here.

See [Philosophy & lessons](/strata/reference/philosophy/) for the *why*.
