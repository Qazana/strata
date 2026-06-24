# Qazana Strata — design system

The single source of truth for **how Strata looks and why**. This codifies the
brand thesis that already lives in the tokens; it does not invent a new one.
Tokens (`tokens/qazana.tokens.css`) are the contract — this file is the intent
behind them. Companion reads: `docs/PHILOSOPHY.md` (why the library is built this
way) and `AGENTS.md` (the maintenance non-negotiables).

## Thesis (one line)

**One foundation, every product** — a framework-agnostic, token-driven, vanilla
CSS + data-attribute system that re-skins entirely from a single `:root`
override, and deliberately reads *designed*, not generated.

**The memorable thing:** a product themed with Strata should look like it was made
by people with taste, not assembled from a template. Every decision below serves
that: a committed dominant colour with a sharp accent, distinctive (non-default)
type, and the absence of the tells that mark AI-generated UI.

---

## Typography

Three faces, three jobs. Self-hosted variable WOFF2 (latin), metric-matched
fallbacks so `font-display:swap` shifts ~0 (no CLS).

| Token | Face | Job |
|-------|------|-----|
| `--display` | **Figtree** (300–900) | Large headings + brand wordmark **only** |
| `--body` | **DM Sans** (100–1000) | Everything else — body, UI, controls |
| `--mono` | **JetBrains Mono** (100–800) | Data, code, timestamps, IDs |

Type discipline is a non-negotiable: `--display` never leaks onto body copy or
small headings. A theme may opt into **Syne** for `--display` (shipped, loaded
only on demand).

**Scale** (`--text-*`, fluid at the top via `clamp`): `2xs` 11px · `xs` 12 · `sm`
13 · `md` 14 (base UI) · `base` 16 (reading) · `lg` 18 · `xl` 20 · `2xl` 24
(largest static) · `3xl` 28→36 · `4xl` 36→48 · `5xl` 44→60 · `6xl` 52→72.
Role aliases map intent to scale: `--fs-display` = `6xl`, `--fs-h1` = `5xl`, …,
`--fs-ui` = `md`.

**Weights** `--weight-*`: regular 400 · medium 500 · semibold 600 · bold 700 ·
black 800. Use extremes for hierarchy, not 400-vs-600.

**Tracking** `--tracking-*`: tighten large display (`tighter` −.02em); open small
uppercase labels (`wide` .06em, `caps` .12em for eyebrows).

**Leading** `--leading-*`: tight 1.05 (display/headings) · snug 1.3 · normal 1.5 ·
relaxed 1.7 (prose). Tightens as size grows.

---

## Colour

Brand colours are **semantic and themeable**, never literal. Each has a hex AND an
`-rgb` channel triple, so every soft fill/ring/border is built with
`rgb(var(--primary-rgb) / <alpha>)` and one override re-tints the whole system.

**Two named schemes**, set via `data-theme`, independent of density:

- **Dark Knight** (canonical) — teal `--primary:#2dd4bf` on deep near-black
  surfaces (`--bg:#0a0a0a`), violet `--accent:#a98bff`. Bright fills take dark
  ink (`--on-primary:#04241f`).
- **Désert Dunes** (light) — coral `--primary:#bf5038` on warm cream
  (`--bg:#fff6ef`, `--surface:#fff`), ink `--text:#0b0f1a`. Solid fills take white.

**Semantic roster** (override per brand, never rename): `--primary`, `--danger`
(#f43f5e dark / #c12838 light), `--warning`, `--info`, `--accent`. Neutrals flow
through `--border-rgb` so lines flip with the scheme.

**Foreground pairs.** Every solid fill has an `--on-*` text token (`--on-primary`,
`--on-danger`, …) so contrast is guaranteed, not lucky. White-on-coral and
dark-on-teal both clear AA by construction.

**Derived tints** auto-flow from the channels: `--primary-soft` (.12),
`--primary-ring` (.15, kept subtle), `--primary-line` (.30).

---

## Space, radius, elevation

- **Space** — 4px base, `--space-1`(4) … `--space-10`(80) with half-steps
  (`_5` = 2.5/3.5-style). Component spacing is tokenized; never hardcode px.
- **Radius** — one knob `--radius:8px` scales `--radius-sm` (−2) and `--radius-lg`
  (+4); `--radius-pill:99px` for pills/avatars.
- **Elevation** — `--shadow-sm / --shadow / --shadow-lg`, per-scheme (softer,
  cooler in light). Separation comes from elevation, not heavy borders.

## Motion

- **Durations** `--dur-1:120ms · --dur-2:180ms · --dur-3:250ms`; ease
  `--ease:cubic-bezier(.22,1,.36,1)`.
- Transitions name the properties that change (never `transition:all`).
- **Every** animation respects `@media (prefers-reduced-motion: reduce)`.

## Density

A second orthogonal axis: `data-density` = comfortable (default) / compact.
Same tokens, tighter control padding/size — not a CSS fork.

---

## Aesthetic principles — read *designed*, not generated

Strata actively avoids the tells of AI-generated UI. These are enforced in review:

1. **No coloured left-accent border stripes.** Carry emphasis with a full subtle
   token tint + a coloured title, not a decorative side rail.
2. **No hardcoded brand hex in components** — always a token, so it re-themes.
   (Exception: `@media print` B/W constants and `#fff`/`#000` intentional video
   chrome.)
3. **No decorative gradients** (purple-on-white especially). Functional gradients
   only — grid masks, skeleton shimmer, progress fills, control scrims.
4. **No generic faces** — Inter / Roboto / Arial / system, and the over-used
   "distinctive" pick Space Grotesk, are off the table for `--display`.
5. **Committed dominant + sharp accent** beats a timid, evenly-distributed pastel
   palette. One brand colour leads; one accent answers it.
6. **Atmosphere is allowed, slop is not.** Layered backgrounds, grid textures, and
   contextual glow are fine when functional; glassmorphism stacks and neon
   box-shadow blobs are not.

The fictional demo theme **Cedar** exists as the worked example of this stance.

---

## Theming a product

Ship one `theme.css` — a single `:root` block overriding the brand/semantic
tokens (and optionally `--display`, radius, shadows, surfaces). Because tokens are
the contract and tints are channel-based, that one file re-skins every component
across both schemes. See `demo/themes/*.css` for examples (qazana, aurora,
vermeil, nocturne, cedar, material).

## The contract

The rules that keep this honest live in **`AGENTS.md`** (tokens as truth, semantic
naming, no domain components, vanilla + `data-*` behaviours, a11y + motion, type
discipline). Change tokens there and here together; keep `tokens/tokens.json` and
the Figma export in sync.
