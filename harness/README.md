# Test harness

The harness is part of the repository. Commit its source, shared page manifest,
CI configuration, and reviewed images in `baseline/` with the changes they test.
Generated captures, diffs, logs, and reports are local artifacts.

## Setup

From the repository root:

```bash
npm ci
npx playwright install chromium webkit
```

Linux CI uses `npx playwright install --with-deps chromium webkit`.
Each browser harness starts a local static server. Stop an existing demo server
if it occupies the same port.

## Checks

| Command | Coverage |
| --- | --- |
| `npm run test` | Contract and generated-file checks, browser behaviors, release regressions, axe scans, keyboard focus checks |
| `npm run harness` | Demo rendering in both schemes at desktop and phone widths, plus a phone RTL pass; token/SVG probes and overflow checks |
| `npm run visual` | Representative pages in both schemes compared with committed baselines |
| `npm run a11y` | Axe scans of the pages selected in `_pages.mjs` |
| `npm run focus` | Keyboard focus indicators across the selected demos |

The [CI workflow](../.github/workflows/test.yml) runs `npm test` on Linux.
Disclosure and release behavior checks use Chromium and WebKit. Other browser
checks use Chromium. The render harness does not sweep compact density; review
both densities when changing control or row sizing.

Visual comparisons are a separate local check. Font rendering varies by OS and
browser version, so compare on an environment matching the reviewed baselines.
A passing automated run still needs review of the affected UI and interactions.

## Review visual changes

1. Run `npm run visual` before updating baselines.
2. Inspect current captures, diffs, and `report.json` in `harness/out/visual/`.
   Review both schemes, including size changes that cannot produce a pixel diff.
3. For intended changes, run `npm run visual:baseline` and inspect the changed
   images in `harness/baseline/` before committing them.
4. Run `npm run visual` again to confirm the reviewed result is reproducible.

Do not regenerate baselines just to clear a failure. Fix unintended changes first.

## Files in Git

| Commit | Keep ignored |
| --- | --- |
| Harness scripts and this guide | `harness/out/` captures, diffs, reports |
| `harness/_pages.mjs` | `harness/artifacts/` diagnostic screenshots |
| `harness/baseline/*.png` after review | Logs and temporary audit scripts |
| Package scripts, lockfile, CI workflow | Installed browsers and dependencies |

Harness files are development tools. The npm package's `files` list excludes
this directory and CI configuration.
