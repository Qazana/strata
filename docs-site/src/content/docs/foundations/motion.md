---
title: Motion
description: Named durations and easing, reduced-motion by default.
sidebar:
  order: 5
---

Motion is tokenised and named by intent, not scattered as magic numbers.

| Token | Value | Use |
| --- | --- | --- |
| `--dur-1` | 120ms | micro-interactions (hover, toggle) |
| `--dur-2` | 180ms | overlays appearing (modal, popover, cmdk) |
| `--dur-3` | 250ms | larger transitions (drawer, sheet) |
| `--ease` | `cubic-bezier(.22,1,.36,1)` | the house easing curve |

```css
transition: transform var(--dur-1) var(--ease);
```

## Reduced motion is a first-class state

Every animation is wrapped so it collapses to nothing when the user asks for it:

```css
@media (prefers-reduced-motion: reduce) {
  .modal-scrim.is-open,
  .modal-scrim.is-open .modal-dialog { animation: none; }
}
```

Follow the same pattern for any new animated component — the harness and review
expect it.

## Principles

- **High-impact moments over scattered micro-interactions.** One well-orchestrated
  reveal beats ten twitchy ones.
- **Transform/opacity only** for anything that animates frequently — keep it on
  the compositor, off the layout thread.
