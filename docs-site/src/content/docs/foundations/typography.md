---
title: Typography
description: Three faces with strict roles, a band-aware token scale (static UI, fluid display), and self-hosted variable fonts with CLS-safe fallbacks.
sidebar:
  order: 7
---

Live specimen: `demo/foundations/typography.html`.

## Faces (roles)

| Token | Face | Use |
|-------|------|-----|
| `--display` | Figtree | Hero headings + wordmark **only**. Never body. |
| `--body` | DM Sans (variable 100–1000) | All UI, headings, reading text. |
| `--mono` | JetBrains Mono | Data, code, tabular figures. |

Fonts are **self-hosted** (WOFF2, `@font-face` in the tokens file) — no Google
`<link>`, no visitor-IP leak. Variable weight ranges, so 700/800 are real (no
faux-bold), and each family ships a **metric-matched fallback** so
`font-display:swap` shifts ~0 (CLS).

## Scale

Band-aware, pixel-snapped. **UI/body static; display fluid** (`clamp()` keeps a
rem term so browser zoom works).

`--text-2xs` 11 · `--text-xs` 12 · `--text-sm` 13 · `--text-md` 14 (base UI) ·
`--text-base` 16 (reading) · `--text-lg` 18 · `--text-xl` 20 · `--text-2xl` 24 ·
`--text-3xl` 28–36 · `--text-4xl` 36–48 · `--text-5xl` 44–60 · `--text-6xl` 52–72.

Reference the **Tier-2 role tokens**, not raw steps, so the ladder can be retuned
without touching components: `--fs-display --fs-h1 --fs-h2 --fs-h3 --fs-h4
--fs-title --fs-body --fs-ui --fs-label --fs-caption --fs-code`.

## Axes (separate tokens, bound per role)

- **Leading** (unitless): `--leading-none/-tight/-snug/-normal/-relaxed` (1 → 1.7).
- **Tracking** (crossover — positive small, negative display): `--tracking-2xs/
  -xs/-sm/-normal/-tight/-tighter/-wide/-caps`.
- **Weight**: `--weight-regular/-medium/-semibold/-bold/-black` (400–800).
- **Measure**: `--measure` 65ch · `--measure-narrow` 48ch · `--measure-wide` 75ch.

## Heading roles

`.t-display .t-h1 .t-h2 .t-h3 .t-h4 .t-lead .t-caption` — each binds
size + weight + leading + tracking together. **No global `h1–h6`** (won't fight
consumer markup). `.title` (hero) and `.eyebrow` (overline) stay.

## Numerics & per-scheme

`tabular-nums` auto-applies to `table.tbl` / `.cell-mono`; `slashed-zero` on
`kbd` / mono cells. Utilities: `.nums-tabular` `.nums-proportional` `.zero-slashed`
`.ligatures-none`. `-webkit-font-smoothing:antialiased` is scoped to the **dark**
scheme (light-on-dark blooms; dark-on-light stays full).
