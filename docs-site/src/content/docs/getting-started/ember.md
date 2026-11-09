---
title: Ember
description: Use Strata tokens and DOM behaviors in an Ember app.
sidebar:
  order: 4
---

Import tokens and the required kit through the app's CSS pipeline:

```css
@import '@qazana/strata/tokens';
@import '@qazana/strata/app';
```

Load product theme overrides after tokens and before kits. Load the behavior
script in the browser entry point so the build resolves the package:

```js
import '@qazana/strata';
```

## Initialize rendered markup

Call `window.QZ.init(element)` from the app's modifier or render lifecycle after
inserting behavior markup. Repeat after route changes or updates that add
controls. Existing elements do not bind twice.

Strata works through the rendered DOM. If an Ember component already manages a
control's state, use the documented styles and ARIA relationships without enabling
a second controller through the corresponding `data-*` hook.

## Style product components

Use shared tokens in component styles:

```css
.product-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  color: var(--text);
  padding: var(--space-4);
}
```

Keep business-specific components in the app. See
[Build domain components](/guides/domain-components/) and the
[API contract](https://github.com/Qazana/strata/blob/master/docs/API_CONTRACT.md).
