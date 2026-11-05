---
title: Contributing
description: Maintain the shared library, its public API, and its release checks.
sidebar:
  order: 3
---

[AGENTS.md](https://github.com/Qazana/strata/blob/master/AGENTS.md) contains the
maintenance rules. Read the
[API contract](https://github.com/Qazana/strata/blob/master/docs/API_CONTRACT.md)
before changing exported or documented surfaces.

## Component rules

Use semantic tokens for colors, spacing, type, radii, shadows, and motion.
Keep color/channel/foreground pairs together. Route control sizing through
density tokens. Use `--display` for large headings, `--body` for controls and
copy, and `--mono` for data or code.

Keep components generic. Product vocabulary and business logic belong in the
consuming repo. Behaviors attach through `data-*` hooks, work with a keyboard,
and respect `prefers-reduced-motion`. Reuse existing focus and tooltip helpers
where they fit; document and test the interaction each component needs.

## Updating the library

- Update the relevant demo and reference in `docs/`, plus this site's examples.
- When tokens change, update `tokens/tokens.json` and run
  `node scripts/figma-tokens.mjs`.
- After changing canonical button rules or tokens, run `npm run build:button`.
- Record the change under **Unreleased** in `CHANGELOG.md`, with its semver
  classification and public contract impact.

Bump the package version only when tagging and publishing a release.

For a new kit, add its CSS and package export, a demo, documentation, and coverage
in `harness/_pages.mjs`. Scope kit-specific rules to avoid collisions with other
kits. Check the documented layer behavior when adding a standalone component.

## Verification

Run `npm run test` before committing. For layout changes, also run
`npm run harness` and `npm run visual`, then inspect the affected UI at desktop
and phone widths. Review comfortable and compact density separately; the render
harness does not sweep both densities.

Commit harness scripts, CI configuration, and reviewed visual baselines. Keep
generated captures, diffs, and logs ignored. Follow the
[harness guide](https://github.com/Qazana/strata/blob/master/harness/README.md)
when reviewing or updating baselines.

For docs changes, run `npm --prefix docs-site run build`. It syncs demos and
assets and generates the token reference. Edit the sources rather than copies
under `docs-site/public/` or the generated token page.
