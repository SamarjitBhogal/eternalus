---
title: 0027. Selected Legend sprite atlas budgets
description: Proposed byte budgets for the eight Legend sprite sheets of PR 170 (one sheet per sub-class, only the player's sheet loads), with the options the owner decides between; read this before changing a sprite sheet or its budget.
audience: [humans, agents]
status: draft
owner: sholtzman
last-reviewed: 2026-11-25
tags: [adr, assets, legends]
related:
  - docs/reference/legend-sprite-provenance.md
  - docs/reference/magus-sprite-provenance.md
  - docs/architecture/14-persistence-and-resources.md
---

# 0027. Selected Legend sprite atlas budgets

- Status: proposed (draft). The owner decides on Owner Calls card PR170 (3).
- Date: 2026-11-25 (first draft 2026-11-22)

## Context

DEC-298 (6), the owner's words: "Decide after the cuts; the author brings one budget ADR with the
real numbers." The cut is made: one local match loads only the player's sheet, in
`match-loading` after the `match` group (`matchAssetGroups`). Each of the eight sub-classes with
art has one sheet in its own asset group (`atlas-<sub-class>`). A sheet is a 6 x 10 grid of
64 x 64 px cells at 1x (128 x 128 px at 2x), lossless WebP pixel art. Rows 0 to 5 hold idle,
walk (four directions) and attack; the code plays only these. Rows 6 to 9 hold ability previews.
No code plays them until the kit PRs bring the abilities (DEC-298 (2)).

The sizes today (bytes, from the manifest; `ResourceController.manifest.test.ts` pins them):

| Atlas               | Standard bytes | High-density bytes |
| ------------------- | -------------: | -----------------: |
| assassin-sprites    |         150240 |             519994 |
| catalyst-sprites    |         399098 |            1391908 |
| colossus-sprites    |         245878 |             873836 |
| juggernaut-sprites  |         264830 |             934970 |
| knight-sprites      |         202298 |             700854 |
| necromancer-sprites |         345032 |            1210002 |
| oracle-sprites      |         426890 |            1487658 |
| paladin-sprites     |         234572 |             826646 |

One match loads at most 426,890 B (1x) or 1,487,658 B (2x). The repository holds 10,214,706 B
of sheets. The existing selection and HUD budgets stay in force.

## Options

- **A. Accept the sizes above as the budgets.** The sheets stay lossless with all ten rows.
- **B. Cut rows 6 to 9 until the kit PRs need them.** Each sheet becomes 6 x 6 cells, 40 % fewer
  pixels. The exact bytes are not measured yet. The kit PRs add the rows back with their budget.
- **C. Encode the 2x sheets as lossy WebP at quality 90 or more**, as the PR #134 review asked for
  the 2x portraits. The 2x downloads get smaller. Pixel art can show small colour changes. The
  exact bytes are not measured yet.
- **D. Another limit.** The owner names it.

## Decision

None yet. The owner picks an option on card PR170 (3). Until then, the budget test pins the
sizes above and marks them "proposed, not accepted".

## Consequences

- With A, a sheet that grows fails the budget test, as every other group does.
- With B or C, the author re-encodes the sheets, measures the bytes, and updates the manifest,
  the budget rows and this record.
- A new Legend sheet adds one group, one manifest entry and one budget row (see the
  better-than-design item on one atlas group family in `INBOX.md`).
