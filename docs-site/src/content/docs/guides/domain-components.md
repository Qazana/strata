---
title: Build domain components
description: Where product-specific components live — and how to build them on the foundation.
sidebar:
  order: 2
---

The shared library holds **generic** components only. Anything tied to one
product — a music app's tracklist, a fintech's rate-locks, a media tool's sync
controls — belongs in **that product's repo**, built on the same tokens.

## The rule

> If a component encodes business logic or product vocabulary, it does not go in
> the shared library.

A new *generic* element appearing in a consuming app should be added to the
library **first**, then consumed — never forked into the app. A *domain* element
stays local.

## How to build one locally

Compose from the foundation so your domain component inherits theming and density
for free:

```css
/* in your product repo */
.tracklist-row {
  display: flex;
  gap: var(--space-3);
  padding: var(--row-pad-y) var(--row-pad-x);   /* density-aware */
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  color: var(--text);
}
.tracklist-row.is-match { background: rgb(var(--primary-rgb) / .08); }
```

Reuse the behaviour hooks where they fit (`data-modal-open`, `data-combo`,
`data-reorder`, …) instead of re-implementing keyboard/focus logic.

## Checklist

- Uses tokens, never hardcoded colours/sizes.
- Routes sizing through density tokens so it works in compact mode.
- Reuses a shared behaviour primitive if it needs focus/keyboard logic.
- Respects `prefers-reduced-motion` for any animation.
- Stays in the product repo — not a PR to the library.
