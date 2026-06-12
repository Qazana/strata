# Typography

Live specimen: `demo/foundations/typography.html` (toggle theme + density there).

## Faces (roles)

| Token | Face | Use |
|-------|------|-----|
| `--display` | Figtree | Hero headings + wordmark **only**. Never body. |
| `--body` | DM Sans (variable 100–1000) | All UI, headings, reading text. |
| `--mono` | JetBrains Mono | Data, code, tabular figures. |

Fonts are **self-hosted** (WOFF2, `tokens/qazana.tokens.css` `@font-face`) — no
Google `<link>`, no visitor IP leak. Variable weight ranges, so 700/800 are real
(no faux-bold).

## Scale

Band-aware, pixel-snapped. **UI/body static; display fluid** (`clamp()` keeps a
rem term so browser zoom works).

`--text-2xs` 11 · `--text-xs` 12 · `--text-sm` 13 · `--text-md` 14 (base UI) ·
`--text-base` 16 (reading) · `--text-lg` 18 · `--text-xl` 20 · `--text-2xl` 24 ·
`--text-3xl` 28–36 · `--text-4xl` 36–48 · `--text-5xl` 44–60 · `--text-6xl` 52–72.

**Reference Tier-2 roles, not raw steps**, so the ladder can be retuned without
touching components:
`--fs-display --fs-h1 --fs-h2 --fs-h3 --fs-h4 --fs-title --fs-body --fs-ui
--fs-label --fs-caption --fs-code`.

## Axes (separate tokens, bound together per role)

- **Leading** (unitless): `--leading-none/-tight/-snug/-normal/-relaxed` (1 → 1.7).
- **Tracking** (crossover — small positive, display negative):
  `--tracking-2xs/-xs/-sm/-normal/-tight/-tighter/-wide/-caps`.
  `-wide` (.06em) = small uppercase badges; `-caps` (.12em) = all-caps
  overlines/eyebrows. Kits carry two intentional literals outside the ladder
  (`.errpage .ekick` .2em, `.site .price-card .tier` .02em).
- **Weight**: `--weight-regular/-medium/-semibold/-bold/-black` (400–800).
- **Measure**: `--measure` 65ch · `--measure-narrow` 48ch · `--measure-wide` 75ch.
  Cap prose at `--measure`; never apply it to UI text.

## Heading role classes

`.t-display .t-h1 .t-h2 .t-h3 .t-h4 .t-lead .t-caption` — each binds
size+weight+leading+tracking together (one source per role). **No global
`h1–h6`** (framework-agnostic: won't fight consumer markup). The established
`.title` (hero) and `.eyebrow` (overline) stay.

## Numerics

Auto-applied where correct: `tabular-nums` on `table.tbl`/`.cell-mono`,
`slashed-zero` on `kbd`/`.cell-mono`. Opt-in utilities: `.nums-tabular`
`.nums-proportional` `.zero-slashed` `.ligatures-none`.

## Per-scheme

`-webkit-font-smoothing` is scoped to the **dark** scheme (`--font-smooth`
token) — light-on-dark blooms, so antialiasing thins it back; dark-on-light stays
full.

## Accessibility

rem sizes (zoom), unitless line-height, no `!important` on type, no fixed-height
clipping of text (WCAG 1.4.12 / 1.4.4).
