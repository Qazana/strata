# Layout primitives

Live demo: `demo/foundations/layout.html`.

Composable, framework-agnostic building blocks that replace hand-rolled
flex/grid. Prefixed `.l-*` so they never collide with consumer markup. Universal
— defined in `kits/base.css`, which every kit `@import`s, so they're available on
every page. Gap is **token-driven** via `--gap` (default per primitive); set it
inline (`style="--gap:var(--space-2)"`) or with a `.gap-1…7` helper.

| Class | Does | Knobs |
|-------|------|-------|
| `.l-container` | Max-width + centered + inline padding | `--container` (def 72rem), `--gutter` (def `--space-5`) |
| `.l-stack` | Vertical flow with gap | `--gap` (def `--space-4`) |
| `.l-row` | Horizontal, wraps, `align-items:center` | `--gap` (def `--space-3`) + `.between/.center/.end/.start/.baseline` |
| `.l-grid` | Responsive **auto-fit** grid | `--gap` (def `--space-4`), `--col` (min col, def 16rem) |
| `.l-spacer` | Flexible space (`flex:1`) — push items apart in `.l-row` | — |

`.l-grid` uses `repeat(auto-fit, minmax(min(var(--col),100%), 1fr))` — intrinsically
responsive with **no media queries**, and the `min(...,100%)` guard means it
never overflows a narrow viewport.

## Examples
```html
<!-- toolbar: items left, action pushed right -->
<div class="l-row gap-3">
  <span>Logo</span><span>Nav</span>
  <span class="l-spacer"></span>
  <button class="btn btn-primary">Action</button>
</div>

<!-- responsive card grid, wider min column -->
<div class="l-grid" style="--col:18rem">
  <div class="card">…</div><div class="card">…</div><div class="card">…</div>
</div>

<!-- centered reading column -->
<div class="l-container" style="--container:46rem">
  <div class="l-stack gap-4">…</div>
</div>
```

## Gap

Gaps map to the spacing scale (`.gap-1`→`--space-1` … `.gap-7`→`--space-7`), or
set `--gap` directly. Keep gaps on the scale rather than hardcoding px.

The spacing scale is a 4px base with **half-steps** (`_5`, à la Tailwind's
`2.5`/`3.5`): `--space-1` 4 · `--space-1_5` 6 · `--space-2` 8 · `--space-2_5` 10 ·
`--space-3` 12 · `--space-3_5` 14 · `--space-4` 16 · `--space-4_5` 20 ·
`--space-5` 24 · `--space-5_5` 28 · `--space-6` 32 · `--space-6_5` 40 ·
`--space-7` 48 · `--space-8` 56 · `--space-9` 64 · `--space-10` 80 (px). All
component padding/margin/gap references a step — no raw px in spacing properties
(the `.gap-N` helpers stay on the whole steps `1…7`). Sub-4px optical nudges
(1–2px) are intentionally left as literals.

## Stacked surfaces

Spacing belongs on the container, not the component — so card and notice
surfaces carry no margin. Wrapping a stack in `.l-stack` / `.l-grid` is the
preferred path.

As a safety net for hand- or AI-authored markup that emits bare sibling surfaces
with no wrapper, **adjacent surfaces self-space**: an owl rule adds `--space-4`
of top margin (matching `.l-stack`'s default gap) between adjacent surfaces of
the same family (same-type or mixed). Covered families:

- **Cards** (App kit): `.card`, `.feature-card`, `.plan`, `.pack`.
- **Notice/feedback blocks**: `.alert`, `.banner`, `.empty` (App kit) and
  `.bill-banner` (Billing kit).

The margin is **neutralized** inside `.l-stack`, `.l-grid`, and `.l-row` (and,
for the notice blocks, the `.demo` gallery wrapper) — these own spacing via
`gap`, so wrapping never double-spaces.

The owl is scoped to *free-standing* surfaces only — components that ship inside
a dedicated gap container (e.g. `.upload-row` in `.upload-list`, `.msg` in
`.thread`, the message/list/row families) are deliberately left out, since their
container already spaces them and an owl would double up. Stack those with
`.l-stack`/`.l-grid` when composing your own layouts.

In-article callouts (`.prose .callout`) need nothing here — `.prose > * + *`
already spaces every prose child.

Caveat: the reset only covers Strata's own primitives (plus `.demo`). If you
hand-roll a `display:grid;gap` (or flex) container with bare surfaces instead of
`.l-grid`, zero the margin yourself, e.g.
`your-grid > .card + .card{margin-block-start:0}`.
