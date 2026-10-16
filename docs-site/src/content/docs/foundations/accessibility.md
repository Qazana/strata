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
- **`:focus-visible` everywhere** — keyboard focus shows one solid ring; mouse
  focus doesn't clutter the UI.

## Focus ring

Every focusable control gets the same 2px outline in `--focus-ring` (default
`--primary-bright`), set once in `base.css`. Text fields signal focus with a
`--primary-bright` border instead. Content is not a control, so it never gets
that ring. Scroll containers and tab panels that take focus get a quiet 1px
line, and headings or panels focused by script get none. Override `--focus-ring` to re-colour focus
for one app, and keep it at 3:1 or more against your page background.

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
[Motion](/foundations/motion/).

## Verifying

The repo's Playwright harness renders every demo in **both** schemes and probes
contrast (background vs text luminance), dead tokens and SVG colour bugs. Run
`npm run harness` before shipping any change. `npm run focus` tabs through every
demo and fails on any focus stop without a visible, 3:1 indicator.
