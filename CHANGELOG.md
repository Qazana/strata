# Changelog

All notable changes to `@qazana/strata`. Semver: patch = fix, minor = additive
component/token/kit/behavior, major = rename/removal/breaking public contract
change. Versions here always match what's published on the registry.

## Unreleased

## 1.1.0 - 2026-11-05

### Minor

- Add the themeable `--overlay` backdrop color, shared across modal kits.

- Add component-only `tabs` and `accordion` CSS exports, underline and vertical
  tab styles, count labels, manual tab activation, and accordion title, hint,
  and metadata slots. Existing App kit classes remain supported.

- Contract: stable addition. Add independent success feedback tokens with
  compatibility defaults that alias the existing brand colors. Field success,
  positive help, confirmation messages and saved buttons use the new family;
  existing classes and behavior remain unchanged. Override all four success
  tokens together when separating feedback from brand.

- Calendar: add `.calendar-select` for a date button beside event links inside
  a noninteractive `.calendar-day`. This fixes nested controls in the demo and
  preserves existing day-button markup and states.

- Experimental `@qazana/strata/button`: an opt-in unlayered button entry with
  namespaced local tokens and six existing variants. Generated from canonical
  button rules; no global reset, font loading or JavaScript.

- Calendar: `.calendar` (+`data-view`) with `.calendar-dow`, `.calendar-grid`, `button.calendar-day` states, `.calendar-num`, `.calendar-count`, `.calendar-event` tones and `.calendar-more`. A month or week grid with events, distinct from the `.cal` date picker. First consumer is an editorial calendar that had drawn its own grid.
- Admin shell: `.adminframe.full` (viewport-filling variant with `.adminmain`,
  `.topbar` and a scrolling `.adminbody`), `.side-label` sidebar section
  headers and `.side-foot`. First consumer is a React app shell where the
  framed demo layout did not fit.
- Overlays: `.panel` (+`.sm`), a floating surface with no positioning of its
  own for overlays a script places, and a `button.menu-item` reset so menu
  items can be buttons.
- Pager: `.pager button` is styled like `.pager a` (with a disabled state), so
  script-driven pagination can use real buttons.
- Media grid: `.media-grid` + `.media-card` (thumbnail, select box, type badge,
  hover actions, meta strip). Dropzone: `.is-active` and `.is-disabled` states
  for script-driven drag and upload locks.
- Forms: `button.addon` so an add-on can be a picker or clear button.
- Forms: `.check.disabled` dims a checkbox label whose input is disabled.
- Media grid: `button.media-card` reset and a `[aria-pressed=true]` selected state, so a tile can be a pick button.
- Utility: `.sr-only` for visually hidden text that assistive tech still reads.
- Rich text editor frame: `.rte` with `.rte-toolbar` / `.rte-body` / `.rte-foot`
  and the bare `.rte-title` input, for apps that bring their own editing engine.
- Focus: new `--focus-ring`, `--focus-ring-width` and `--focus-ring-offset`
  tokens, and one `:focus-visible` outline in `base.css` for buttons, links,
  `summary`, checkboxes, radios, ranges, `tabindex="0"` and interactive ARIA
  roles. Before this, most controls fell back to the browser's default ring.
  This changes how focus looks everywhere (observable, not breaking). Override
  `--focus-ring` to re-colour it per app.
- Harness: `npm run focus` (now part of `npm test`) tabs through every demo
  page in both schemes and fails on a missing, browser-default or sub-3:1 focus
  indicator.

### Patch

- Add a theme-aware background and curved line texture to the split auth brand
  panel. Keep demo navigation above the split layout when kit styles load late.
  Existing component markup and mobile behavior stay supported.
- Refresh installation, theming, framework, and maintenance docs. Document
  harness files and baseline review, and link the site to the canonical changelog.
- Align marketing pricing actions and feature lists. Keep billing expansion local
  to its plan, restore section gutters, and normalize FAQ and accordion spacing.
- Preserve submitter payloads, block repeat submissions, validate dynamic fields,
  and send date selections to autosave. Check both field identifiers before saving.
- Fix module lightbox startup, compatibility globals, close URLs, and stacked
  dialog focus. Ship Commerce scrims and keep tall dialogs and reply menus reachable.
- Fix narrow layouts, demo labels and contrast, and forced-colors range focus.
  Add Chromium/WebKit regressions, expand axe coverage, and install WebKit in CI.
- Keep card margins out of legacy grids and give the rich-text editor demo its
  own row.
- Correct plain-HTML installation URLs; npm exports remain available for bundlers.

- Tabs isolate nested groups, skip disabled items, normalize initial selection,
  and follow orientation and text direction. Accordion chevrons and borders
  stay scoped to their own details element.

- Contract: stable behavior preserved. Match single-line input and select sizing
  in comfortable and compact density, including auth forms.

- Context menus: existing `data-ctx` targets support keyboard opening,
  navigation, disabled items, Escape and focus return. Menus fit the viewport
  and reposition on resize. Documented separate ownership for modal, popover
  and context-menu behavior. Contract: stable behavior preserved; patch fixes
  keyboard accessibility and clipped menus without changing existing hooks.
  Targets retain their existing semantics without an imposed role or expanded
  state.

- Forms: corrected fields remove auto-cleared errors from `aria-describedby`
  while retaining help text and author-owned sticky errors. Field examples now
  associate labels, help and error text explicitly. Contract: stable behavior
  preserved; patch fixes stale validation descriptions.

- Docs: retain the 16 October 2026 code review with reproduction details,
  validation limits, and resolution status. All 18 findings are now closed.
  Contract: stable behavior preserved.
- Focus fixes where keyboard focus was invisible or close to it: `.switch`,
  `.check`/`.choice`, table select checkboxes, `.tree-row`, confirm-dialog
  buttons, `input.slider`, `.dual` range (now Firefox too), `.stepper` and
  billing `.stepper` inputs, commerce `.qty` and `.card-field`, the support
  `.composer`, and docs `.help-search`. These relied on the 15% `--primary-ring`
  halo alone, which measures about 1.3:1.
- Focus: `.btn-group`, `.stepper`, billing `.stepper` and commerce `.qty` no
  longer use `overflow:hidden`, which clipped the ring. Their end children now
  round their own corners.
- Forms: a focused `input.is-success` showed the danger ring. Fields in an
  error or success state now thicken their state border on focus, so focus
  shows on top of the state ring.
- Focus: content no longer looks like a control. Headings, landmarks and
  modal or drawer panels focused by script (`tabindex="-1"`) show no ring,
  which also hides the browser's default one. Scroll containers and tab panels
  get a quiet 1px line instead of the full ring.
- Tabs: `[data-tabs]` makes a panel a Tab stop only when it has no controls of
  its own, as the ARIA tabs pattern advises. Panels with controls no longer add
  an extra stop before their first control.
- Docs: `figma.md` gave the `-ring` tint as 22%. The code has always used 15%.

- Docs: tagline unified to **"One style base. No build step, no framework."**
  across the README, package description, docs-site config + landing hero, and
  the demo landing page. "Token" stays the technical term in prose but is now
  defined in plain language at first use (named design decisions — color,
  spacing, type, motion — stored as CSS variables). Also fixed the demo hero
  note's stale "v0.0.1 · 7 kits" → "v1.0.0 · 10 kits".
- Docs site: now serves `/llms.txt`, `/llms-full.txt` and `/llms-small.txt`
  (via `starlight-llms-txt`) so coding agents can read the docs as plain
  markdown. `llms.txt` opens with the core usage rules and links the API
  contract.
- Docs site: fixed internal links that still carried the old `/strata/` base
  path and 404'd since the move to `strata.docs.qazana.net`.
- Docs site: added the missing `favicon.svg` (the Strata mark, using the
  token colors for the dark and light schemes).
- Docs site: upgraded to Astro 7.3 and Starlight 0.42, which clears the open
  Astro security advisories. The docs build now needs Node 22.12+. The docs
  site is not part of the published package, so consumers are unaffected.

## 1.0.0 — 2026-07-04

First stable release, and the baseline for this changelog. Everything before
this point is pre-history; changes are logged in detail from here forward.

What ships in 1.0.0:

- **Tokens** — semantic design tokens (color, type, space, radius, elevation,
  density, motion) in `tokens/qazana.tokens.css`, mirrored in `tokens.json` and
  the Figma export. Two schemes (dark canonical, light), OS-auto by default.
  Everything lives in the `qazana` cascade layer so consumer CSS and per-product
  theme overrides always win. A product re-brands with a single `:root{}`
  override.
- **Ten kits** — App, Site, Content, Auth, Email, Media, Commerce, Billing,
  Docs, Support. Scoped, independently importable, all themed by the same
  tokens.
- **Behaviors** — one vanilla `data-*`-driven script (`js/qazana.js`), no
  framework dependencies, no build step. Public `QZ` namespace with
  `QZ.init(root?)` for markup rendered after load (SPA mounts, HTMX swaps);
  built-in UI strings are overridable via `QZi18n`.
- **Accessibility** — every interactive component is keyboard-operable with
  ARIA wiring; animation respects `prefers-reduced-motion`; the demo suite
  gates on axe (WCAG 2 A/AA) in both schemes.
- **Governance** — the public API contract (`docs/API_CONTRACT.md`) defines the
  semver-protected surfaces: exported kits, documented tokens, classes, DOM
  anatomy, and `data-*` hooks. `docs/UPGRADING.md` covers consumer upgrades.
- **Fonts** — self-hosted variable fonts (Figtree display, DM Sans body,
  JetBrains Mono data; Syne available) with metric-matched fallbacks.

## 0.0.1 — 2026-06-12

Early preview publish. Superseded by 1.0.0.
