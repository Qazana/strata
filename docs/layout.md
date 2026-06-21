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

## Stacked cards

Spacing belongs on the container, not the component — so card surfaces carry no
margin. Wrapping a stack in `.l-stack` / `.l-grid` is the preferred path.

As a safety net for hand- or AI-authored markup that emits bare sibling cards
with no wrapper, **adjacent card surfaces self-space**: an owl rule adds
`--space-4` of top margin (matching `.l-stack`'s default gap) between adjacent
`.card`, `.feature-card`, `.plan`, and `.pack` (same-type or mixed). This margin
is **neutralized** inside `.l-stack`, `.l-grid`, and `.l-row`, which already own
spacing via `gap`, so wrapping never double-spaces.

Caveat: the reset only covers Strata's own primitives. If you hand-roll a
`display:grid;gap` (or flex) container with bare cards instead of `.l-grid`,
zero the margin yourself, e.g. `your-grid > .card + .card{margin-block-start:0}`.
