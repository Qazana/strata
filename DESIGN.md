# Qazana Strata design system

The single source of truth for how Strata looks and why. It codifies the brand
thesis that already lives in the tokens; it does not invent a new one. Tokens
(`tokens/qazana.tokens.css`) are the contract, and this file is the intent behind
them. Companion reads: `docs/PHILOSOPHY.md` (why the library is built this way)
and `AGENTS.md` (the maintenance rules).

## Thesis (one line)

One foundation, every product. A framework-agnostic, token-driven system of
vanilla CSS plus data-attribute behaviours that re-skins entirely from a single
`:root` override, and aims to read as designed rather than generated.

The thing to remember: a product themed with Strata should look like people with
taste made it, not like it came off a template. Every decision below serves that
goal: a committed dominant colour with a sharp accent, distinctive type instead of
the defaults, and none of the tells that mark AI-generated UI.

---

## Typography

Three faces, three jobs. Self-hosted variable WOFF2 (latin), with metric-matched
fallbacks so `font-display:swap` shifts close to zero (no CLS).

| Token | Face | Job |
|-------|------|-----|
| `--display` | Figtree (300 to 900) | Large headings and brand wordmark only |
| `--body` | DM Sans (100 to 1000) | Everything else: body, UI, controls |
| `--mono` | JetBrains Mono (100 to 800) | Data, code, timestamps, IDs |

Type discipline is a rule, not a suggestion: `--display` never leaks onto body
copy or small headings. A theme may opt into Syne for `--display` (it ships, and
loads only on demand).

Scale (`--text-*`, fluid at the top via `clamp`): `2xs` 11px, `xs` 12, `sm` 13,
`md` 14 (base UI), `base` 16 (reading), `lg` 18, `xl` 20, `2xl` 24 (largest
static), `3xl` 28 to 36, `4xl` 36 to 48, `5xl` 44 to 60, `6xl` 52 to 72. Role
aliases map intent to scale: `--fs-display` is `6xl`, `--fs-h1` is `5xl`, on down
to `--fs-ui` at `md`.

Weights (`--weight-*`): regular 400, medium 500, semibold 600, bold 700, black
800. Reach for the extremes to build hierarchy, not 400 against 600.

Tracking (`--tracking-*`): tighten large display (`tighter` is -.02em); open small
uppercase labels (`wide` .06em, `caps` .12em for eyebrows).

Leading (`--leading-*`): tight 1.05 for display and headings, snug 1.3, normal
1.5, relaxed 1.7 for prose. It tightens as size grows.

---

## Colour

Brand colours are semantic tokens you can theme; components never hardcode a
literal value. Each one carries a hex plus an `-rgb` channel triple, so every soft
fill, ring, and border is built with `rgb(var(--primary-rgb) / <alpha>)`, and one
override re-tints the whole system.

Two named schemes, set via `data-theme`, independent of density:

- Dark Knight (canonical): teal `--primary:#2dd4bf` on deep near-black surfaces
  (`--bg:#0a0a0a`), with a violet `--accent:#a98bff`. Bright fills take dark ink
  (`--on-primary:#04241f`).
- Désert Dunes (light): coral `--primary:#bf5038` on warm cream (`--bg:#fff6ef`,
  `--surface:#fff`), with ink `--text:#0b0f1a`. Solid fills take white.

Semantic roster (override per brand, never rename): `--primary`, `--danger`
(#f43f5e dark, #c12838 light), `--warning`, `--info`, `--accent`. Neutrals flow
through `--border-rgb`, so lines flip with the scheme.

Foreground pairs: every solid fill has an `--on-*` text token (`--on-primary`,
`--on-danger`, and so on), so contrast is guaranteed rather than left to chance.
White on coral and dark on teal both clear AA by construction.

Derived tints auto-flow from the channels: `--primary-soft` at .12,
`--primary-ring` at .15 (kept subtle), `--primary-line` at .30.

---

## Space, radius, elevation

- Space: 4px base, from `--space-1` (4) up to `--space-10` (80), with half-steps
  (`_5` gives the 2.5/3.5-style values). Component spacing is tokenized; never
  hardcode px.
- Radius: one knob, `--radius:8px`. `--radius-sm` is 6px, `--radius-lg` 12px, and
  `--radius-pill` 99px for pills and avatars.
- Elevation: `--shadow-sm`, `--shadow`, `--shadow-lg`, set per scheme (softer and
  cooler in light). Cards separate by elevation, not by heavy borders.

## Motion

- Durations: `--dur-1:120ms`, `--dur-2:180ms`, `--dur-3:250ms`. Ease is
  `--ease:cubic-bezier(.22,1,.36,1)`.
- Transitions name the properties that change. Avoid `transition:all`.
- Every animation respects `@media (prefers-reduced-motion: reduce)`.

## Density

A second axis, orthogonal to colour: `data-density` is comfortable (default) or
compact. It uses the same tokens with tighter control padding and size, not a
separate CSS fork.

---

## Aesthetic principles: read designed, not generated

Strata avoids the tells of AI-generated UI. Review enforces these:

1. No coloured left-accent border stripes. Carry emphasis with a full subtle token
   tint plus a coloured title, not a decorative side rail.
2. No hardcoded brand hex in components; always a token, so it re-themes. The one
   exception is `@media print` black-and-white constants and the intentional
   `#fff`/`#000` video chrome.
3. No decorative gradients, purple-on-white most of all. Functional gradients are
   fine: grid masks, skeleton shimmer, progress fills, control scrims.
4. No generic faces. Inter, Roboto, Arial, the system stack, and the over-used
   "distinctive" pick Space Grotesk are all off the table for `--display`.
5. A committed dominant plus a sharp accent beats a timid, evenly distributed
   pastel palette. One brand colour leads; one accent answers it.
6. Atmosphere is allowed; slop is not. Layered backgrounds, grid textures, and
   contextual glow are fine when they do a job. Glassmorphism stacks and neon
   box-shadow blobs are not.

The fictional demo theme Cedar is the worked example of this stance.

---

## Theming a product

Ship one `theme.css`: a single `:root` block overriding the brand and semantic
tokens, and optionally `--display`, radius, shadows, and surfaces. Because tokens
are the contract and tints are channel-based, that one file re-skins every
component across both schemes. See `demo/themes/*.css` for examples: qazana,
aurora, vermeil, nocturne, cedar, material.

## The contract

The rules that keep this honest live in `AGENTS.md`: tokens as truth, semantic
naming, no domain components, vanilla `data-*` behaviours, accessibility and
motion, type discipline. Change tokens there and here together, and keep
`tokens/tokens.json` and the Figma export in sync.
