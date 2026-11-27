---
title: 'Progress 2026-11-27: feat/tower-ruins-and-routes (phase/3 e8250d6b merge; last red tests fixed; DEC-391)'
description: 'Phase 3 / tower ruins, Sam Holtzman + Claude Code: merged phase/3-sprint-3-work e8250d6b; the fort footprint test now follows the fort split, three map snapshots are updated on purpose, and the lane polyline bound is 2.5% (DEC-391).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/tower-ruins-and-routes (phase/3 e8250d6b merge; DEC-391)

Phase 3 / tower ruins · feat/tower-ruins-and-routes (PR #98) · Sam Holtzman + Claude Code
(sessions eternalus-159 and eternalus-160). The file name uses the UTC time.

- What was done:
  - Merged `phase/3-sprint-3-work` at `e8250d6b` (#153, #173) on SamarjitBhogal's `837028a1`.
    No text conflicts. #173 made `GuardSlot.canLevel` required, so the two guard fixtures of this
    branch take `canLevel: false`, as the phase/3 fixture does.
  - `towerFortFootprints.test.ts` collects the tower object and its 11 `partOf` wall pieces, as
    this PR splits each fort (DEC-227 (Q-C), DEC-217 (12)). It asserts the same 12 footprints and
    adds "11 `wall` pieces". It went red with `partOf` dropped from `MapObjectBuilder`.
  - `mapPreservation.test.ts.snap`: for all 3 seeds only the collision, scenery and towers hashes
    move. A probe compared the maps with phase/3: features and lanes are the same; each tower
    object has 1 footprint, not 12; 132 new `wall` objects with `partOf` keep the same polygons;
    the roofs are renamed `fort-tower-X-Y-roof`; the camps are the same.
  - `LaneFlowFields.test.ts` "agrees with the lane polyline": the bound goes from 2% to 2.5%, by
    the owner's answer (DEC-391, new batch in the owner decisions log). On the 5-lane match grid
    the gap is 2.13% at 2.5 m cells and 1.95% at 5 m cells; the cell size alone causes it. The
    test was red at 2% (0.0213 > 0.02).
- Checks run: the three map test files pass (32 tests); `npm run check` result is in the PR #98
  comment.
- Next step: critic and ponytail, push, then merge this head into #122, #152 and #154.
