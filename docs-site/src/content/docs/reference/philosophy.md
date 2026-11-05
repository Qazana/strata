---
title: Philosophy & lessons
description: Why Strata uses shared tokens and vanilla DOM behaviors.
sidebar:
  order: 1
---

Strata keeps generic UI in one library so fixes reach every consumer. Products
own their themes and domain components. The
[design philosophy](https://github.com/Qazana/strata/blob/master/docs/PHILOSOPHY.md)
records the rationale and influences in detail.

## Principles

- **Shared tokens:** components read semantic colors, spacing, type, and motion
  values. Product themes override values without copying component CSS.
- **Independent settings:** color scheme and density can be combined freely.
- **Foreground pairs:** text on a solid fill has a matching token. Theme changes
  still need contrast checks.
- **DOM behaviors:** classes and `data-*` hooks work across frameworks. Reuse
  focus helpers where interactions match and test each component's keyboard rules.
- **Predictable overrides:** main kits use `@layer qazana`; standalone component
  entries document their own layer behavior.
- **Versioned reuse:** the public API follows semver. Legacy aliases stay supported
  until a documented major release removes them.

## Adding a component

Keep generic components in Strata and business-specific components in the product
repo. Use tokens and density-aware sizing. Provide keyboard interaction, labels,
and reduced-motion behavior where needed.

The [contribution guide](/guides/contributing/) covers updates, checks, and
release policy. The
[API contract](https://github.com/Qazana/strata/blob/master/docs/API_CONTRACT.md)
defines what consumers can depend on.
