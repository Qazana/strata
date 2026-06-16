# Qazana Strata — Figma library plan

How the code design system is mirrored into a Figma library that **designers and
product developers** can use without it drifting from the code. The code is the
single source of truth; Figma mirrors it.

## Decisions (settled)

1. **Plan tier:** Figma **Professional**. Variable **modes** work (Dark/Light);
   **Code Connect is out** (needs Org/Enterprise) — deferred. Mode cap is **4
   per collection**.
2. **Token architecture: flat semantic** — mirrors the code. There is no
   primitive ramp; `:root` defines `--primary` etc. directly, and a brand
   override touches ~5 tokens.
3. **Tints via opacity, not variables (the key rule).** The code derives tints
   at use-time: `--primary-soft = rgb(var(--primary-rgb) / .12)`,
   `--primary-ring` = `/.22`, `--line` = `rgb(var(--border-rgb) / .08)`. Figma
   variables can't compute "color at alpha." So **only base colors are
   variables**; a soft fill is the base variable bound at **12% layer opacity**,
   a ring at 22%, a line is `border` at 8%/14%. Changing the one `primary`
   variable re-tints everything — the Figma analog of the single `:root`
   override. **Never bake `-soft`/`-ring`/`-line` as variables** (that would
   break rebrand).
4. **Modes = Dark | Light of the default Qazana brand.** Brands are NOT modes.
   A product rebrands by overriding ~5 base variables (`primary`,
   `primary-bright`, `on-primary`, `accent`, display font) in its **own** Figma
   library — mirroring "product identity stays out of core." The fictional demo
   themes (aurora/vermeil/nocturne) are not library content.
5. **Token sync: generated `tokens.figma.json` + Tokens Studio.** A generator
   emits a Figma-shaped token set from the code (base solids + a resolved
   `border` per mode; tints excluded). Designers import via the Tokens Studio
   plugin. Code stays source of truth; designers can re-pull. Regen belongs in
   the AGENTS.md "when you change anything" checklist.
6. **Components: hand-structured, token-faithful, states-as-variants.** Not raw
   auto-generation. Clean auto-layout; every paint/radius/space/type bound to a
   variable (rule 3); modifier classes → component properties with placeable
   state variants. **Button is built first as the signed-off pattern**, then
   replicated. Fidelity bar = token-faithful (colors/space/radius/type exact via
   variables), layout mirrors the demo — not pixel-peeping.

## Figma variable collections (the (B) model)

- **Color** — modes **Dark | Light**. Base solids only:
  `bg, surface, surface-2, surface-3, surface-sunken, surface-active, skeleton,
  text, text-2, muted, primary, primary-bright, on-primary, danger, on-danger,
  warning, on-warning, info, on-info, accent, on-accent`, plus **`border`**
  (resolved from `--border-rgb`: `#ffffff` dark / `#0b0f1a` light). No `line`,
  no `-soft`/`-ring`/`-line`, no `-rgb` channels.
- **Radius** — `sm, base, lg, pill` (number).
- **Spacing** — `1..7` (number).
- **Typography** — number variables for `fontSize.*`, `lineHeight.*`,
  `letterSpacing.*`, `fontWeight.*`, `measure`; composed **text styles** per
  `fontRole` (display, h1–h4, title, body, ui, label, caption, code).
- **Elevation** — `shadow.sm/base/lg` as **effect styles**.
- **Motion** — `motion.*` durations as number variables (easing documented; Figma
  can't bind easing).

### Tint convention (document on the Foundations page)
| Use | Base variable | Opacity |
|---|---|---|
| soft fill (`-soft`) | the semantic color | 12% |
| focus ring (`-ring`) | the semantic color | 22% |
| brand line (`-line`) | the semantic color | 30% |
| hairline (`--line`) | `border` | 8% |
| strong line (`--line-strong`) | `border` | 14% |

## File structure (one published library)

- **Cover / About** — version (pinned to the npm package version), how-to, the
  tint convention, the sync rule.
- **Foundations** — color (modes), type scale, spacing, radius, elevation, motion.
- **Components** — one page per kit (App, Site, Content, Auth, Media, Commerce).
- **Patterns** — assembled demo screens, both schemes (v2).

## Phasing

- **v1**
  - **P1 Foundations** — `tokens.figma.json` generator → variables (Dark/Light),
    text styles, effect styles, Foundations specimen page.
  - **P2 Button** — canonical pattern, signed off before anything else.
  - **P3 Core primitives** (cross-kit, mostly base+app): Field/Input,
    Select/Combobox, Checkbox/Radio/Switch, Card, Badge/Tag, Avatar, Tabs, Table,
    Modal/Sheet, Toast, Tooltip/Popover, Menu/Dropdown, Nav (top + drawer).
- **v2+** — kit-specific (commerce cart/product, media player/waveform, auth
  flows, email blocks, content/blog, site marketing sections) + the Patterns page.

## Sync / anti-drift

- **Tokens** — regenerate `tokens.figma.json` from the code, re-import via Tokens
  Studio. One-way, code-source-of-truth. (Add to AGENTS.md checklist.)
- **Components** — curated mirror; per-release review checklist. (Code Connect
  would automate the code mapping — revisit if Figma goes Org/Enterprise.)
- **Versioning** — Figma library version tracks `package.json` version.
