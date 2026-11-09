# UI release fixes: 5 November 2026

The pricing, accordion, and behavior fixes build on `41621e3`. Existing work was
preserved. The package version remains `1.0.0` until the next release is published.

Pricing features now align with their headings. Marketing cards share a button
baseline. Expanding a billing plan changes only that card. Sections retain their
page gutters. FAQ answers and nested accordion content no longer add browser
margins to component padding. Rich accordion metadata moves below the heading
on narrow screens.

The wider sweep also corrected mobile step indicators, card grids, the editor
demo, and media layouts. Admin and product controls have accessible names, and
the reported light-theme contrast failures are resolved.

The split auth panel has a theme-aware gradient and curved line texture. Its
demo navigation spans both columns even when the kit stylesheet loads after the
navigation script. Chromium and WebKit checks cover the delayed stylesheet case
and 24 sign-in, signup, and reset layouts across both schemes and phone widths.

The [October review](2026-10-16-code-review.md) is closed:

| Findings | Fix and regression coverage |
| --- | --- |
| R01 | Autosave checks name and ID independently, removes unsafe old values, and rechecks fields on each save. |
| R02, R15 | Module startup completes before opening a lightbox deep link. Compatibility globals are exported explicitly. |
| R03, R17 | Only the top dialog handles Tab and Escape. Hidden lightbox controls are excluded; confirmation buttons have explicit tab stops. |
| R04, R05 | Submit locking preserves native and synchronous FormData payloads, uses the actual submitter, and blocks repeated submissions. |
| R06, R07 | Validation reads current controls. Date selections emit input and change events for autosave. |
| R08, R09 | Site styles preserve floating overlays. Commerce ships its own quick-view scrim. |
| R10, R12 | Canned replies remain clickable. Tall dialogs scroll within short viewports. |
| R11 | Range controls retain an outline under forced colors. |
| R13, R14 | Variants preserve the authored selection and handle groups with no available options. |
| R16 | Closing a lightbox restores the previous URL fragment. |
| R18 | Plain HTML examples use public file URLs and explain the directory structure to copy. |

`harness/release.mjs` covers the behavior fixes and spacing in Chromium and
WebKit, with additional Chromium checks for forced colors and narrow layouts.
CI now installs both browsers. The accessibility manifest includes Admin,
Product, Checkout, and Billing Plans.

Validation:

- `npm run test`: passed, including 28 release scenarios, 34 axe page/theme
  scans with zero findings, and 3,364 keyboard-focus stops.
- `npm run visual`: all 22 captures match the reviewed baselines. Baselines
  include the spacing changes and added demos. Current captures are saved under
  `harness/out/visual/` for future comparisons.
- `npm --prefix docs-site run build` and `npm pack --dry-run`: passed.
- Pricing and accordions were inspected at 1280, 900, 768, 390, and 320px.
- The 59-page layout sweep passed all 354 page/width/theme checks, with no
  horizontal overflow, page exceptions, missing local assets, or broken images.

This covers browser rendering and automated accessibility checks. Firefox,
physical devices, screen readers, and the remote CI run were not tested.
