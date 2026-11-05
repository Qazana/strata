# @qazana/strata

Qazana Strata is a shared UI library: semantic CSS tokens, composable kits,
and vanilla JavaScript behaviors attached through `data-*` attributes.
It works with plain HTML or framework-rendered DOM, with no build step to consume.

[Docs](https://strata.docs.qazana.net/) · [Demo gallery](https://strata.docs.qazana.net/demo/index.html) · [npm](https://www.npmjs.com/package/@qazana/strata) · [Figma](https://www.figma.com/design/bcPBKFlIq3QmtGDPCpd6I2/Qazana-Strata--Design-System?node-id=44-2) · [Agent docs](https://strata.docs.qazana.net/llms.txt)

These docs describe the current checkout. Check [CHANGELOG.md](CHANGELOG.md)
for release availability. Entries under **Unreleased** are not yet published.

## Quick start

```bash
npm install @qazana/strata
```

With a bundler, load the tokens, a kit, and the behavior script in the browser entry:

```js
import '@qazana/strata/tokens';
import '@qazana/strata/app';
import '@qazana/strata';
```

For plain HTML, copy the package's `kits`, `tokens`, `fonts`, and `js` directories
to your public `/vendor/strata/` directory. Keep their relative paths so CSS
imports and self-hosted fonts resolve. Use public URLs in HTML:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Strata example</title>
    <link rel="stylesheet" href="/vendor/strata/tokens/qazana.tokens.css">
    <link rel="stylesheet" href="/vendor/strata/kits/app.css">
    <script type="module" src="/vendor/strata/js/qazana.js"></script>
  </head>
  <body>
    <button type="button" class="btn btn-primary">Save</button>
  </body>
</html>
```

The script initializes existing markup. After a framework mount or dynamic
insertion, call `window.QZ.init(subtree)`, or `window.QZ.init()` for the whole
document. Repeated calls do not bind an element twice.

## Kits

Load only the kits a page needs. Each uses the shared tokens; component selectors
can overlap, so check the [API contract](docs/API_CONTRACT.md) when combining entries.

| Export after `@qazana/strata/` | Covers |
| --- | --- |
| `app` | Forms, tables, charts, overlays, tabs, accordions, admin shells |
| `site` | Marketing navigation, heroes, pricing, testimonials, FAQs |
| `content` | Articles, blog lists, prose, callouts, code blocks |
| `auth` | Sign-in, signup, password reset, two-factor flows |
| `media` | Video and audio players, social and profile components |
| `commerce` | Catalog, product, cart, checkout, order |
| `billing` | Plans, invoices, payment methods, usage, cancellation |
| `docs` | Documentation shell, API reference, help center; pairs with `content` |
| `support` | Contact forms, tickets, conversations, reply composer |
| `email/*` | Table-based email templates with inlined colors |

### Component imports

[Tabs and accordions](docs/disclosure.md) have separate `tabs` and `accordion`
exports. Import the shared tokens first. Their rules are unlayered when loaded
directly and do not include the App kit's page reset.

The [experimental `button` export](docs/button.md) uses `.qz-button` classes and
local tokens. It needs neither shared tokens nor JavaScript. It may change in a
minor release. These three exports are available from **1.1.0**.

## Architecture & layout

| Path | Purpose |
| --- | --- |
| `tokens/` | CSS tokens, JSON mirror, generated Figma export |
| `kits/` | Kit and component CSS |
| `js/qazana.js` | Shared DOM behaviors |
| `fonts/` | Self-hosted fonts |
| `demo/` | Live component examples |
| `docs/` | API and integration references |
| `docs-site/` | Browsable guides and embedded demos |
| `harness/` | Tests, render probes, reviewed visual baselines |

Main kits use `@layer qazana`. Unlayered product styles override them, including
broad rules such as `a {}` or `button {}`. Scope those rules to avoid changing
kit controls, or put app base styles in an earlier layer:

```css
@layer app-base, qazana;
```

Standalone component imports document their own layer behavior.

## Theming & schemes

| Scheme | `data-theme` | Colors |
| --- | --- | --- |
| Dark Knight | `dark-knight` or `dark` | Near-black surfaces, teal primary |
| Désert Dunes | `desert-dunes` or `light` | Warm cream, coral primary |

With no `data-theme`, the scheme follows the OS. Tokens set `color-scheme` so
native controls match. A `data-theme-toggle` button switches and saves the choice.

Product themes belong in the consuming repo. Load the theme after tokens and
before kit CSS. Override a fill, its RGB channels, and its foreground together;
check hover, text, and focus colors too. See [Theming](https://strata.docs.qazana.net/foundations/theming/).

### Density (compact mode)

Set `data-density="compact"` on `<html>` for smaller controls, rows, and cells.
The default is comfortable. Density works with either color scheme;
`data-density-toggle` switches and saves it.

### Direction (RTL)

Set `dir="rtl"` on `<html>`, or use `data-dir-toggle`. See
[Direction (RTL)](docs/components.md#direction-rtl) for layout conventions.
Email templates use physical properties for client compatibility.

## Tokens

[tokens/qazana.tokens.css](tokens/qazana.tokens.css) is the source of truth.
[tokens/tokens.json](tokens/tokens.json) mirrors it. Use semantic variables such
as `--primary`, `--surface`, `--space-3`, and `--radius` in components.
Alpha tints use the channel form: `rgb(var(--primary-rgb) / .12)`.

Use `--display` for large headings, `--body` for controls and copy, and `--mono`
for data or code. See the [token reference](https://strata.docs.qazana.net/foundations/tokens/)
and [typography guide](docs/typography.md).

## Public contract

Exported kits and documented tokens, classes, markup, and behavior hooks are
semver-protected unless marked experimental. Legacy aliases stay supported until
a documented major release removes them. Demo helpers and harness internals are
not consumer API. Read [API_CONTRACT.md](docs/API_CONTRACT.md) before changing a
public surface.

## Upgrading existing apps

Follow [UPGRADING.md](docs/UPGRADING.md). Commit the consumer's dependency and
lockfile changes together. Refresh vendored assets from the same package version.

## Consuming per stack

- [Vanilla / HTML](https://strata.docs.qazana.net/getting-started/vanilla/)
- [React + Tailwind](https://strata.docs.qazana.net/getting-started/react-tailwind/)
- [Ember](https://strata.docs.qazana.net/getting-started/ember/)

Keep product components and themes in the product repo. Use the canonical
[form vocabulary](docs/forms.md) for new forms. Call `QZ.init(root)` after
inserting behavior markup; framework-owned controls can omit the behavior hook.

## Demos

```bash
npm run demo
```

Open [localhost:4178/demo/](http://localhost:4178/demo/). Demos show the supported
markup and states. See the [documentation index](docs/README.md) for references.

## Render harness

```bash
npm ci
npx playwright install chromium webkit
npm run test
npm run harness
npm run visual
```

Commit harness source, CI configuration, and reviewed `harness/baseline/` images.
Generated captures, diffs, and reports stay ignored. The
[harness guide](harness/README.md) explains coverage and baseline review.

## Extending

Add generic components here before consuming them in a product. Keep domain
logic in the product repo. Follow [AGENTS.md](AGENTS.md) and the
[contribution guide](https://strata.docs.qazana.net/guides/contributing/).
The [design philosophy](docs/PHILOSOPHY.md) explains the tradeoffs.

## Versioning & maintaining

Record changes under **Unreleased** in [CHANGELOG.md](CHANGELOG.md): patch for
fixes, minor for additions, major for breaking public contract changes. Bump the
package version only when tagging and publishing a release.

Update the relevant demo and docs. When tokens change, update the JSON mirror
and regenerate Figma tokens with `node scripts/figma-tokens.mjs`. After changing
canonical button rules or tokens, run `npm run build:button`.

Build the docs with `npm --prefix docs-site run build`; it syncs demo assets and
regenerates the token reference first. See [docs/README.md](docs/README.md) for
source ownership and [release review evidence](docs/reviews/2026-11-05-release-fixes.md).
