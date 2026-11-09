---
title: Install
description: Load Strata tokens, a kit, and the behavior script.
sidebar:
  order: 1
---

```bash
npm install @qazana/strata
```

These docs follow the repository. Check the [changelog](/reference/changelog/)
for release availability, especially additions marked **Unreleased**.

## With a bundler

Load the foundation and required kit in the browser entry point:

```js
import '@qazana/strata/tokens';
import '@qazana/strata/app';
import '@qazana/strata';
```

Load product theme overrides after tokens and before kit CSS. The script runs
in the browser and initializes existing `data-*` behavior markup.

## Plain HTML

Copy the package's `kits`, `tokens`, `fonts`, and `js` directories into your
public `/vendor/strata/` directory. Preserve their relative paths so CSS imports
and self-hosted font URLs resolve:

```html
<link rel="stylesheet" href="/vendor/strata/tokens/qazana.tokens.css" />
<link rel="stylesheet" href="/vendor/strata/kits/app.css" />
<script type="module" src="/vendor/strata/js/qazana.js"></script>
```

Browsers need public file URLs in `href` and `src`. npm export names work through
a bundler, not directly in those HTML attributes.

## Exports

Each path below follows `@qazana/strata/`:

| Path | Purpose |
| --- | --- |
| `tokens` | Shared CSS tokens and self-hosted fonts |
| `tokens.json` | Token data |
| `app` | Forms, tables, charts, overlays, admin UI |
| `site` | Marketing and landing pages |
| `content` | Articles, blog lists, prose |
| `auth` | Sign-in, signup, password reset, two-factor flows |
| `media` | Video, audio, social components |
| `commerce` | Catalog, product, cart, checkout |
| `billing` | Plans, invoices, payment methods, usage |
| `docs` | Documentation and help-center layouts |
| `support` | Contact forms, tickets, conversations |
| `email/*` | Email templates |
| `js` | Behavior script, also available as `@qazana/strata` |
| `tabs`, `accordion` | Component styles with shared tokens; since 1.1.0 |
| `button` | Experimental standalone buttons; since 1.1.0 |

The main kits use `@layer qazana`, so unlayered app styles override them.
Direct component imports are unlayered and document their own requirements:
[tabs and accordions](/components/disclosure/) and
[standalone buttons](/components/buttons/#standalone-buttons-experimental).

See the [API contract](https://github.com/Qazana/strata/blob/master/docs/API_CONTRACT.md)
for stability rules.

## Framework guides

- [Vanilla / HTML](/getting-started/vanilla/)
- [React + Tailwind](/getting-started/react-tailwind/)
- [Ember](/getting-started/ember/)

After inserting behavior markup dynamically, call `window.QZ.init(root)`.
Repeated initialization does not double-bind an element.
