---
title: 0027. Legend sprite atlas budgets
description: The accepted byte budgets for the eight Legend sprite sheets of PR 170 (one sheet per sub-class; every Legend's sheet loads, DEC-378), lossless as written, with lossy WebP at quality 90 or more only if in-game performance drops; read this before changing a sprite sheet or its budget.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [adr, assets, legends]
related:
  - docs/reference/legend-sprite-provenance.md
  - docs/reference/magus-sprite-provenance.md
  - docs/architecture/14-persistence-and-resources.md
---

# 0027. Legend sprite atlas budgets

- Status: accepted 2026-11-26 by the product owner (DEC-378 (3), Owner Calls card PR170 (3)):
  option A, lossless as written; option C (lossy WebP at quality 90 or more) only if in-game
  performance drops noticeably. Proposed 2026-11-25 (first draft 2026-11-22).
- Date: 2026-11-26

## Context

DEC-298 (6), the owner's words: "Decide after the cuts; the author brings one budget ADR with the
real numbers." The first cut was that one local match loads only the player's sheet. DEC-378 (2)
supersedes that cut: every Legend in the match gets its sprite. So `match-loading` loads the
sheet of every Legend in the filled rosters after the `match` group (`matchAssetGroups`). Each sheet loads once, however many Legends share it. Each of the eight
sub-classes with art has one sheet in its own asset group (`atlas-<sub-class>`). A sheet is a 6 x 10 grid of
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

In the worst case one match has all eight sub-classes, so it loads all eight sheets: 2,268,838 B
(1x) or 7,945,868 B (2x). A match with only the player's sub-class loads one sheet, at most
426,890 B (1x) or 1,487,658 B (2x). The repository holds 10,214,706 B of sheets. The existing
selection and HUD budgets stay in force.

## Options

- **A. Accept the sizes above as the budgets.** The sheets stay lossless with all ten rows.
- **B. Cut rows 6 to 9 until the kit PRs need them.** Each sheet becomes 6 x 6 cells, 40 % fewer
  pixels. The exact bytes are not measured yet. The kit PRs add the rows back with their budget.
- **C. Encode the 2x sheets as lossy WebP at quality 90 or more**, as the PR #134 review asked for
  the 2x portraits. The 2x downloads get smaller. Pixel art can show small colour changes. The
  exact bytes are not measured yet.
- **D. Another limit.** The owner names it.

## Decision

Option A, with option C as the fallback. The owner's words on Owner Calls card PR170 (3)
(Owner Calls v98, DEC-378 (3); the card's letters are not this record's): "B: accept it, but
encode the high-density sheets lossy (quality 90 or more) first — accept lossy if performance
starts dropping noticeably in-game. otherwise, as written". His note reads as follows. The
budgets are the sizes above, lossless as written (option A). Nobody re-encodes a sheet now. Only
if in-game performance drops noticeably, the high-density sheets become lossy WebP at quality 90
or more (option C).

## Consequences

- A sheet that grows fails the budget test, as every other group does. The budget test pins the
  sizes above as accepted budgets.
- If in-game performance drops noticeably, the author re-encodes the 2x sheets (quality 90 or
  more), measures the bytes, and updates the manifest, the budget rows and this record. The bot
  fallback of DEC-378 (2) is the other lever: the owner said only that the bots "can drop a
  little (only if necessary)". For example, the bots draw at 1x or at a lower frame rate.
  Architecture 08 §11 names it.
- A new Legend sheet adds one group, one manifest entry and one budget row (see the
  better-than-design item on one atlas group family in `INBOX.md`).
