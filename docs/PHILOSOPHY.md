# Qazana Strata — design philosophy & lessons

Why the library is built the way it is, and the specific lessons we borrowed
from the best component systems. Read this before adding components or changing
the foundation — it's the *intent* behind the rules in `CLAUDE.md`.

## Our stance in one line
**A framework-agnostic, token-driven, vanilla CSS + data-attribute system** — owned
in-house, consumed by every Qazana product, themeable per brand, with density and
accessibility as first-class axes. We take the best *ideas* from the leaders
without taking their *dependencies*.

---

## Core principles

1. **Tokens are the contract.** Components never hardcode a colour/space/radius/
   shadow/font — they reference a token. One override re-skins everything. This
   is what makes themes, density, and per-product brands possible at all.
2. **Two orthogonal axes, both token-driven.** *Colour scheme* (`data-theme`:
   Dark Knight / Désert Dunes) and *density* (`data-density`: comfortable /
   compact) are independent and compose freely. Neither is a fork of the CSS.
3. **Foreground pairs.** Every solid fill has an `--on-*` text token, so contrast
   is guaranteed, not lucky (borrowed from shadcn/Radix conventions).
4. **Behaviour is shared, not per-component.** One dismissable-layer primitive
   (Esc / outside-click / scroll-lock / focus-trap) and one roving-focus +
   typeahead helper power modal, drawer, menu, combobox, command palette, popover.
   Accessibility lives in the primitive, so every component inherits it.
5. **Vanilla + `data-*`.** Behaviours attach via `data-*` hooks and work in any
   framework through the rendered DOM. No build step to consume.
6. **Cascade hygiene.** Kit CSS lives in `@layer qazana` so a consuming app's own
   styles win without specificity battles. Focus rings use `:focus-visible`.
7. **Own the code.** Unlike a copy-paste registry, this is a shared library — the
   right call for a multi-product org where *consistency across products* beats
   per-app customisation.

---

## Lessons borrowed (and the source)

### shadcn/ui — token clarity & ownership
- **Surface→foreground token pairs** (`--primary`/`--primary-foreground`). We
  adopted `--on-*`. *Adopted.*
- **`:focus-visible` everywhere; one `--radius` knob.** *Adopted.*
- **Variant vocabulary** (default/secondary/outline/ghost/destructive/link).
  *Adopted as button variants.*
- What we did **not** copy: the copy-paste/"you own the files" distribution — a
  shared library serves a product suite better.

### Radix UI / React Aria / Ariakit — headless behaviour
- **Accessibility as a state machine**, separate from styling: focus-trap,
  roving-tabindex, typeahead, `aria-activedescendant`, dismissable layers.
- **Lesson:** put a11y in shared primitives, not in each component. *Adopting via
  the behaviour core.* This is the single biggest thing separating a real system
  from a "CSS-only" kit.

### Ant Design — dense, data-heavy enterprise UI
- **The data Table** (sort/filter/row-select/expand/sticky/paginate) and a
  **Form validation** model are the backbone of admin apps.
- A built-in **size system** (small/middle/large via `ConfigProvider`) — validates
  our density axis.
- **Lesson:** the admin story isn't done without a real table + validation.

### Material Design 3 (MUI) — interaction & theming systems
- **State layers** — a single, token-driven hover/press/focus overlay applied
  uniformly instead of ad-hoc per-component hover colours.
- **Tonal palettes** — derive a full ramp from one brand colour.
- **Density** is a documented, first-class concept (precedent for ours).
- **Lesson:** unify interaction feedback; consider generating a ramp from `--primary`.

### Primer (GitHub) — token architecture
- **Base → functional/semantic token tiers** (raw scales feed named roles).
- Strong **design↔code** discipline (Code Connect, Figma variables).
- **Lesson:** formalise base scales beneath our semantic tokens; keep `tokens.json`
  the bridge to Figma.

### Chakra UI — theming ergonomics & a11y
- **Semantic tokens that resolve per colour-mode**; `_hover`/`_focus` state tokens.
- **Lesson:** name state tokens explicitly; we already resolve per-scheme.

### daisyUI — CSS-first theming (our closest analog)
- **Pure-CSS components + a broad named-theme registry**, add a theme in one block.
- **Lesson:** keep themes cheap to add (`data-theme="x"` + a token block); grow a
  theme gallery for marketing/products.

### Bootstrap — our philosophical twin
- **Vanilla CSS + `data-*` behaviours** (`data-bs-toggle`), huge coverage, no
  framework. The model we already follow.
- **Lesson:** keep the `data-*` API conventions consistent and predictable.

### Carbon (IBM) — enterprise rigor
- **Spacing grid** discipline and **motion tiers** (productive vs expressive
  durations); serious data-viz and a11y.
- **Lesson:** name motion by intent; keep a strict spacing scale.

---

## Decision rules (when adding a component)
- **Does it need behaviour?** Build/extend a shared primitive first; don't inline
  focus/keyboard logic per component.
- **Does it introduce a colour fill?** Add/confirm its `--on-*` foreground.
- **Does it have sizing?** Route padding/font through the density tokens
  (`--ctl-*`, `--cell-*`, `--row-*`); add a `[data-density="compact"]` override
  only for fixed-dimension controls.
- **Will consumers override it?** It's already in `@layer qazana` — keep specificity low.
- **Is it domain-specific?** Then it does **not** belong here (see `CLAUDE.md`).
- **Verify both themes AND both densities** in the harness before committing.

## Anti-goals
- No framework dependency; no build step required to consume.
- No domain/product-specific components in the shared library.
- No hardcoded colours/sizes; no `!important` to win the cascade.
- Don't chase visual novelty over correctness — most upgrades here are about
  consistency, accessibility, and consumer ergonomics, which are invisible at rest.

## References
- shadcn/ui · Radix UI · React Aria / Ariakit · Ant Design · Material Design 3 (MUI)
- Primer (GitHub) · Chakra UI · daisyUI · Bootstrap · Carbon (IBM)
