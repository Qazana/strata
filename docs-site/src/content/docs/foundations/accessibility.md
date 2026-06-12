---
title: Accessibility
description: A11y lives in shared behaviour primitives, so every component inherits it.
sidebar:
  order: 4
---

The single biggest thing separating a real system from a CSS-only kit is that
**accessibility lives in the behaviour primitive, not in each component**. One
dismissable-layer + roving-focus core powers modal, drawer, menu, combobox,
command palette and popover — so they all inherit the same keyboard and ARIA
support.

## What the primitives provide

- **Dismissable layers** — Escape, outside-click, scroll-lock and focus-trap for
  modal, drawer, popover, command palette.
- **Roving focus + typeahead** — arrow-key navigation, Home/End, `aria-expanded`
  / `aria-activedescendant` for tabs, combobox, tree, command palette.
- **`:focus-visible` everywhere** — keyboard focus shows a strong ring; mouse
  focus doesn't clutter the UI.

## Keyboard reference

| Component | Keys |
| --- | --- |
| Modal / Drawer / Popover | `Esc` closes; focus is trapped; returns focus on close |
| Tabs | `←`/`→` move, roving tabindex |
| Combobox | `↑`/`↓`/`Home`/`End` navigate, `Enter` choose, `Esc` close |
| Command palette | `⌘K`/`Ctrl+K` open, `↑`/`↓` navigate, `Enter` select, `Esc` close |
| Tree | `↑`/`↓` move, `→`/`←` expand/collapse, `Enter` activate |

## Motion

Every animation respects `@media (prefers-reduced-motion: reduce)` — see
[Motion](/strata/foundations/motion/).

## Verifying

The repo's Playwright harness renders every demo in **both** schemes and probes
contrast (background vs text luminance), dead tokens and SVG colour bugs. Run
`npm run harness` before shipping any change.
