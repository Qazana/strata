---
title: Accessibility
description: Keyboard behavior, focus indicators, and accessibility checks.
sidebar:
  order: 4
---

Strata's behaviors manage keyboard interaction and ARIA state for the markup
they control. Authors still provide labels, meaningful content, and the documented
DOM structure. Framework-owned controls must maintain their own state and ARIA
relationships.

## Keyboard reference

| Component | Behavior |
| --- | --- |
| Modal / drawer | Trap focus while open; Escape closes the active dialog and restores focus |
| Command palette | Cmd+K or Ctrl+K opens; arrows navigate; Enter selects; Escape closes; focus stays inside while open |
| Popover | Escape or outside click closes; Escape and explicit close return focus to the trigger; focus is not trapped |
| Tabs | Arrows follow orientation and text direction; Home/End choose endpoints; manual activation uses Enter or Space |
| Accordion | Native summary receives focus; Enter or Space toggles its details |
| Combobox | Up/Down/Home/End navigate; Enter chooses; Escape closes |
| Tree | Up/Down move; Right/Left expand or collapse; Enter activates |
| Tooltip | Escape dismisses; rich content stays hoverable; the trigger references the tip with `aria-describedby` |

Dialog-like overlays share focus and scroll-lock helpers. Popovers, menus, and
comboboxes have their own interaction rules. See [Overlays](/components/overlays/)
and [Tabs and accordions](/components/disclosure/) for markup.

## Focus indicators

The main kits use `:focus-visible` with `--focus-ring`, `--focus-ring-width`, and
`--focus-ring-offset`. The default control outline is 2px. Text fields also use
a contrasting border. Scroll regions and focusable content have quieter rules
than controls.

After overriding colors, check focus indicators against the surfaces they touch.
Keep at least 3:1 contrast for the indicator. A foreground token gives you a
place to set contrast; it does not make an arbitrary brand color accessible.

## Motion

Respect `prefers-reduced-motion` in new component animations. See
[Motion](/foundations/motion/).

## Verification

`npm run a11y` runs axe on the selected demo pages. `npm run focus` checks keyboard
focus indicators. Both run as part of `npm run test`. The separate render harness
checks layout and theme rendering; it is not a full accessibility audit.

Review keyboard flows, labels, and screen-reader output in the consuming app.
See the [harness guide](https://github.com/Qazana/strata/blob/master/harness/README.md)
for coverage and its limits.
