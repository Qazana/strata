---
title: Changelog
description: Release history and versioning policy.
sidebar:
  order: 2
---

[CHANGELOG.md](https://github.com/Qazana/strata/blob/master/CHANGELOG.md) is the
canonical release history. It records published versions and pending changes
under **Unreleased**. These docs follow the repository, so an example may use
an addition that has not been published yet.

- **Patch:** fixes that preserve the public contract.
- **Minor:** additive components, tokens, kits, or behaviors.
- **Major:** breaking changes to a stable export, token, class, markup pattern,
  or behavior hook.

Experimental entries may change in a minor release. See the
[API contract](https://github.com/Qazana/strata/blob/master/docs/API_CONTRACT.md)
for stability and deprecation rules, and the
[upgrade guide](https://github.com/Qazana/strata/blob/master/docs/UPGRADING.md)
when updating a consumer.

Maintainers add entries under Unreleased. The package version changes only when
a release is tagged and published.
