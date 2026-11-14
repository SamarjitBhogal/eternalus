---
title: 0026. Magus sprite asset budget
description: Proposed match asset budget increase for three owner-reference Magus animation atlases.
audience: [humans, agents]
status: draft
owner: gurshaan
last-reviewed: 2026-11-11
tags: [adr, assets, rendering, magus]
related: [docs/architecture/14-persistence-and-resources.md]
---

# 0026. Magus sprite asset budget

- Status: proposed; byte allowance approved by Gurshaan in the task on 2026-11-11
- Date: 2026-11-11

## Context

The user requested generated character animations for Catalyst, Oracle and Heretic using the
existing owner-licensed selection art. The match manifest's accepted byte totals are pinned in
`ResourceController.manifest.test.ts`; the generated sheets exceed those totals.

## Decision

The human approved adding the three atlases to the existing match group and raising its declared totals
from 141,646 to 1,312,666 bytes at standard density, and from 359,902 to 4,449,470 bytes at high
density. The additional files total 1,171,020 and 4,089,568 bytes respectively.

Register the approved atlas files and retain exact byte assertions in
`ResourceController.manifest.test.ts`, and record the approval alongside those totals. No test
is removed or relaxed. The guardrails process remains unchanged; this decision records a
specific asset budget exception rather than changing its approval rule.

Alternatives: reduce sheet resolution and pose count, which reduces animation quality; retain
the current Legend fallback, which does not fulfil the requested character artwork.

## Consequences

The sheets reuse the existing resource facade, match-loading lifetime and licence provenance.
Match loading transfers more data. Decoded bitmaps are shared and closed when the match group
is released; prepared frame variants remain bounded and are cleared when the renderer ends.
The approved atlas files are registered in the match manifest.
