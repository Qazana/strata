---
title: React + Tailwind
description: Use shared tokens and DOM behaviors in a React app.
sidebar:
  order: 3
---

Load Strata globally in the browser entry. Keep server rendering code separate
from the behavior import, which reads the DOM.

```js
import '@qazana/strata/tokens';
import './theme.css';
import '@qazana/strata/app';
import '@qazana/strata';
```

## Tailwind token mappings

For Tailwind 3 projects using `tailwind.config.js`, map utilities to the same
variables the components use:

```js
export default {
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        danger: 'var(--danger)',
        surface: 'var(--surface)',
        'primary-soft': 'rgb(var(--primary-rgb) / <alpha-value>)',
      },
      borderRadius: { DEFAULT: 'var(--radius)' },
    },
  },
};
```

This is the configuration-file syntax for Tailwind 3. Use your Tailwind version's
theme configuration when it differs; the Strata token names stay the same.
Avoid broad unlayered element styles that override Strata controls.

## Behaviors after rendering

Call `window.QZ.init(root)` after React mounts new behavior markup. This wrapper
initializes its subtree after each render:

```jsx
import { useEffect, useRef } from 'react';

export function StrataRegion({ children }) {
  const root = useRef(null);
  useEffect(() => {
    window.QZ.init(root.current);
  });
  return <div ref={root}>{children}</div>;
}
```

Call init in a descendant too if it inserts controls without rerendering this
wrapper. Repeated effects do not bind existing elements twice.

If React or another component library owns state, use Strata's documented
classes and ARIA relationships and omit the corresponding behavior hook.
See [tabs](/components/disclosure/) for an example of this ownership choice.

## Existing brand variables

Alias the full color family in the product theme:

```css
:root {
  --primary: var(--app-primary);
  --primary-rgb: var(--app-primary-rgb);
  --on-primary: var(--app-on-primary);
  --primary-bright: var(--app-primary-bright);
  --primary-bright-rgb: var(--app-primary-bright-rgb);
}
```

See [Brand a product](/guides/brand-a-product/) for scheme and contrast checks.
