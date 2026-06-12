---
title: Install
description: Add Qazana Strata to any project — tokens, a kit, and the behaviour script.
sidebar:
  order: 1
---

Qazana Strata ships as three layers you opt into:

1. **Tokens** — the design contract (`@qazana/strata/tokens`). Always load this first.
2. **A kit** — a focused component set on top of the tokens (`/app`, `/site`, `/content`, `/auth`, `/media`, `/email/*`).
3. **The behaviour script** — wires `data-*` hooks (`@qazana/strata`). One file, no framework.

## From npm

```bash
npm install @qazana/strata
```

```html
<link rel="stylesheet" href="@qazana/strata/tokens" />
<link rel="stylesheet" href="@qazana/strata/app" />
<script type="module" src="@qazana/strata"></script>
```

The package exposes named exports so you only ship what you use:

| Export | File |
| --- | --- |
| `@qazana/strata/tokens` | the token foundation (load first) |
| `@qazana/strata/app` | App kit (buttons, forms, tables, overlays…) |
| `@qazana/strata/site` | Site kit (landing/marketing) |
| `@qazana/strata/content` | Content kit (blog/article/docs) |
| `@qazana/strata/auth` | Auth kit (sign-in/up/reset/2FA…) |
| `@qazana/strata/media` | Media kit (video/social) |
| `@qazana/strata/email/*` | Email templates |
| `@qazana/strata` | the behaviour script (default import) |

## No build step required

The CSS is plain CSS and the JS is a single ES module — drop them into any page.
There's nothing to compile to *consume* the library. The kit CSS lives in
`@layer qazana`, so your app's own styles win without specificity battles.

## Pick your framework

- [Vanilla / HTML](/strata/getting-started/vanilla/)
- [React + Tailwind](/strata/getting-started/react-tailwind/)
- [Ember](/strata/getting-started/ember/)
