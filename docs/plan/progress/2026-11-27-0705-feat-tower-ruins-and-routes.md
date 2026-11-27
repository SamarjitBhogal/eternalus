---
title: 'Progress 2026-11-27: feat/tower-ruins-and-routes (phase/3 e8250d6b merge; last red tests fixed; DEC-391)'
description: 'Phase 3 / tower ruins, Sam Holtzman + Claude Code: merged phase/3-sprint-3-work e8250d6b; the fort footprint test now follows the fort split, three map snapshots are updated on purpose, and the 5-lane match grid polyline bound is 2.5% (DEC-391).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/tower-ruins-and-routes (phase/3 e8250d6b merge; last red tests fixed; DEC-391)

Phase 3 / tower ruins · feat/tower-ruins-and-routes (PR #98) · Sam Holtzman + Claude Code
(sessions eternalus-159 and eternalus-160). The file name uses the UTC time.

- What was done:
  - Merged `phase/3-sprint-3-work` `e8250d6b` (#153, #173) on `837028a1`. No text conflicts; the
    two guard fixtures of this branch take `canLevel: false` (#173 made it required).
  - `towerFortFootprints.test.ts`: the 11 fort walls are `wall` objects with `partOf` (DEC-227
    (Q-C)); the test checks their 11 footprints and the keep on the tower object, in order. Red
    first: with `partOf` dropped from `MapObjectBuilder`, and with the keep expected first.
  - `mapPreservation.test.ts.snap` (3 seeds): only the collision, scenery and towers hashes move
    (the fort split and the roof id rename); a probe found features, lanes and camps unchanged.
  - `LaneFlowFields.test.ts`: the 5-lane match grid case allows 2.5% (DEC-391); the other cases
    keep 2%. Red first: 0.0213 > 0.02 with the old bound. Critic round 1: PASS WITH NITS; S1 and
    N1 to N5 fixed.
- Checks run: `npm run check` (Node 24.21.0): Prettier passes; core `Tests  1971 passed (1971)`,
  protocol `31 passed`, client `2263 passed`, server `163 passed`, builds pass; then docs:check
  "2 documentation error(s)" (title does not match H1, here and in the 2026-11-26-2330 entry).
  Both H1 lines now match their titles (the old entry's only change); `npm run format:check` and
  `npm run docs:check` re-run on the final tree: see the PR #98 comment.
- Next step: push, then merge this head into #122, #152 and #154 (Sam Holtzman's sessions).
