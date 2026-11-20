---
title: 0027. Additional Legend asset budget
description: Approved byte allowance for five character atlases and selection portraits.
audience: [humans, agents]
status: draft
owner: gurshaan
last-reviewed: 2026-11-12
tags: [adr, assets, rendering]
related: [docs/architecture/14-persistence-and-resources.md]
---

# 0027. Additional Legend asset budget

- Status: proposed; byte allowance approved by Gurshaan on 2026-11-12
- Date: 2026-11-12

## Context

Gurshaan requested sprites and selection portraits for Zealot, Templar, Paladin, Colossus
and Bulwark, and explicitly approved the additional sprite and portrait asset budget.
The existing group totals are pinned by `ResourceController.manifest.test.ts`.

## Decision

Add five uniform animation atlases to the match group, totalling 1,843,116 bytes at standard
density and 6,463,366 bytes at high density. Match totals become 3,155,782 and 10,912,836 bytes.
Add five contained selection portraits with native-size card, refraction, mini and roster
renditions, totalling 2,739,436 and 8,664,466 bytes; selection totals become 6,844,804 and
10,687,858 bytes. Keep exact byte assertions and all file-integrity checks.

This is a specific allowance under the asset-budget guardrail in `docs/process/guardrails.md`,
not a change to its human-approval requirement. Asset provenance remains independently checked.

Alternatives: keep placeholders, which does not meet the requested character art; reduce
pose count or resolution, which reduces animation detail.

## Consequences

More bytes are downloaded during selection and match loading. All assets retain manifest-based
loading and release, two density variants and the existing fallback when an atlas is unavailable.
No dependencies are added. Permission confirmation and hashes are recorded separately in the
Legend sprite provenance record.
