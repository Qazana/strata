---
title: Philosophy & lessons
description: Why the library is built this way, and the lessons borrowed from the best systems.
sidebar:
  order: 1
---

The full rationale lives in the repo at `docs/PHILOSOPHY.md`. This is the short version.

## Our stance in one line

A framework-agnostic, token-driven, vanilla CSS + data-attribute system — owned
in-house, consumed by every Qazana product, themeable per brand, with density and
accessibility as first-class axes. We take the best *ideas* from the leaders
without taking their *dependencies*.

## Core principles

1. **Tokens are the contract.** One override re-skins everything.
2. **Two orthogonal axes, both token-driven** — colour scheme and density compose freely.
3. **Foreground pairs** — every fill has an `--on-*` text token (contrast guaranteed, not lucky).
4. **Behaviour is shared, not per-component** — one dismissable-layer + roving-focus core.
5. **Vanilla + `data-*`** — works in any framework through the rendered DOM.
6. **Cascade hygiene** — kit CSS lives in `@layer qazana`; focus uses `:focus-visible`.
7. **Own the code** — a shared library beats copy-paste for a multi-product org.

## Lessons borrowed

| Source | What we took |
| --- | --- |
| **shadcn/ui** | surface→foreground token pairs (`--on-*`), variant vocabulary, `:focus-visible`, one `--radius` knob |
| **Radix / React Aria / Ariakit** | a11y as a state machine in shared primitives, not per component |
| **Ant Design** | the data table + form validation as the admin backbone; a size system (→ density) |
| **Material 3 (MUI)** | unified state layers; tonal ramps from one brand colour; density as first-class |
| **Primer (GitHub)** | base → semantic token tiers; `tokens.json` as the Figma bridge |
| **Chakra** | semantic tokens that resolve per colour-mode; named state tokens |
| **daisyUI** | CSS-first theming — add a theme in one block; grow a theme gallery |
| **Bootstrap** | our philosophical twin — vanilla CSS + `data-*`, broad coverage, no framework |
| **Carbon (IBM)** | strict spacing grid; motion named by intent |

## Anti-goals

- No framework dependency; no build step to consume.
- No domain/product-specific components.
- No hardcoded colours/sizes; no `!important` to win the cascade.
- Don't chase visual novelty over correctness — most upgrades here are about
  consistency, accessibility and consumer ergonomics, which are invisible at rest.
