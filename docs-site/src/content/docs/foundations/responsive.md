---
title: Responsive
description: Breakpoints, the mobile-tested harness, and the rules that keep every surface phone-safe.
sidebar:
  order: 6
---

Mobile isn't a separate kit — it's the same token-driven components reflowing.
Every demo is verified at phone width, so "works on mobile" is enforced, not hoped.

## Breakpoints

A standardized scale, used by **convention** (CSS `var()` does **not** work inside
`@media` conditions, so breakpoints can't be tokens — they're documented constants):

| Name | Width | Typical use |
| --- | --- | --- |
| `sm` | 640px | phone — new mobile rules target `max-width: 640px` |
| `md` | 768px | small tablet |
| `lg` | 1024px | small laptop |

A few components keep a purpose-built collapse point where the design needs it:
the auth two-column stacks at 860, site grids at 880, and the docs TOC rail joins
the prose at 920. Those are intentional, not drift.

## The harness tests mobile

`harness/shoot.mjs` renders **every page at 390×844 (phone) and at desktop, in both
themes**, and **fails the run on horizontal page overflow** (`scrollWidth > clientWidth`).
It also reports a tap-target advisory for button-like controls. Run `npm run harness`.

The overflow check ignores elements inside legitimate horizontal scrollers (carousels,
`.tbl-wrap`) so it names the element that actually widens the document — not a card you
were always meant to scroll to.

## Rules that keep surfaces phone-safe

- **Grid/flex children carry `min-width: 0`** so a wide descendant (a code block, a long
  token) can't force the column — and the page — wider. This is the classic "grid blowout"
  and it's the single most common mobile-overflow cause.
- **Long display headings use `overflow-wrap: break-word`**; hero font sizes clamp down far
  enough to fit a phone.
- **Horizontal strips scroll internally** rather than widening the page: the step tracker,
  the admin sidebar rail, and data tables (`overflow-x: auto`) all scroll within their box.
- **Navigation shrinks and wraps** before it clips: the marketing nav drops its secondary
  CTA and reduces sizing so the primary action is never cut off.
- **The admin sidebar becomes an off-canvas drawer** on phones — a `[data-sidebar-toggle]`
  hamburger flips `.nav-open` on the `.adminframe`; backdrop-click, nav-item-click and Esc
  close it.
- **`overflow-x: clip` only on a decoration's own band**, never on `body` — clipping the
  page root hides real overflow from the harness instead of fixing it.

## Verifying a change

Before shipping anything that affects layout, run `npm run harness` and confirm it passes
at **both viewports and both themes**. A desktop-only screenshot can't catch a phone
overflow, and a single-theme shot can't catch a token that breaks in the other scheme.
