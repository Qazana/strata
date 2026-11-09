# Tabs and accordions

The separate `tabs` and `accordion` exports are available from **1.1.0**. See
[the changelog](../CHANGELOG.md) for release details.

Use tabs to switch between views. Use accordions for optional detail within a view.
The App kit includes both. Component imports let an existing UI use them
without loading the App kit's page reset:

```css
@import "@qazana/strata/tokens";
@import "@qazana/strata/tabs";
@import "@qazana/strata/accordion";
```

These entries use the standard Strata tokens. They add no root, body, or bare
button styles. The component rules are unlayered when imported directly;
the App kit imports the same files into its existing `qazana` layer.

## Tabs

```html
<div data-tabs>
  <div class="tabs line" aria-label="Workspace views">
    <button class="tab active">Overview <span class="tab-count">12</span></button>
    <button class="tab">Activity</button>
  </div>
  <div class="tabpanel">Overview content</div>
  <div class="tabpanel" hidden>Activity content</div>
</div>
```

Load `@qazana/strata/js` for vanilla behavior and call `QZ.init(root)` after
inserting new groups. Tabs and panels pair in document order within their own
`data-tabs` group. Nested groups keep their own selection. The controller sets
roles, IDs, `aria-controls`, `aria-labelledby`, `aria-selected`, roving focus,
and panel visibility. An existing enabled `.active` or selected tab opens first;
otherwise the first enabled tab opens. All-disabled groups have no active panel.

The default style is a segmented bar. `.tabs.line` adds an underline style.
Use `.tab-count` for optional counts. Long bars scroll within the available width.
`aria-orientation="vertical"` on `.tabs` changes layout and arrow keys.
Native `disabled` and `aria-disabled="true"` tabs cannot activate.

Horizontal tabs use Left and Right, respecting text direction. Vertical tabs
use Up and Down. Home and End move to the first and last enabled tabs. The
other arrow pair keeps its normal scrolling behavior. Add
`data-tabs-activation="manual"` to the group when opening a view is expensive:
arrows move focus, and Enter or Space activates it. Tab leaves the tab bar.

Frameworks can own selection and visibility. Use the same classes and ARIA
relationships, style selection with `aria-selected="true"`, and omit `data-tabs`
so two controllers do not manage the same DOM. A React app can pair these
classes with Radix Tabs. Strata does not depend on React or Radix.

## Accordions

```html
<div class="acc">
  <details>
    <summary>
      <span class="acc-heading">
        <span class="acc-title">Advanced options</span>
        <span class="acc-hint">Optional fields and connection settings.</span>
      </span>
      <span class="acc-meta">2 options</span>
    </summary>
    <div class="acc-body">Settings controls</div>
  </details>
</div>
```

`details` and `summary` provide open state and keyboard interaction without JS.
Give sibling details the same unique `name` when only one should be open. Omit
`name` to allow several open sections. Do not put buttons, links, or other
controls in the summary; place them in `.acc-body`.

Title, hint, and metadata slots are optional. Plain summary text still works.
At 640px and below, metadata moves below the heading to leave room for longer
titles and hints. The body resets its first and last child margins so nested
content does not add space beyond the component padding.
`.acc.flush` removes the outer border for sections inside an existing card.
Nested accordions keep independent open indicators. Focus rings stay inside
the clipped border, and chevrons stop animating under reduced motion.

See [the demo](../demo/app/disclosure.html). `node harness/disclosure.mjs`
checks these patterns in Chromium and WebKit. Keyboard conventions follow the
[ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).
