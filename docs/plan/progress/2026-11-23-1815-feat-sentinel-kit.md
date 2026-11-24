---
title: 'Progress 2026-11-23: feat/sentinel-kit (lane B PR 6, the Sentinel kit)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: Rip & Tear with Fear, Shield Wall and Berserk built on #162; HC-Q107 to HC-Q112 and HC-S13 asked; fixes F1 to F4 after the merge of the three slices.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/sentinel-kit (lane B PR 6, the Sentinel kit)

Phase 4 / sprint 4.2 · feat/sentinel-kit (stacked on #162, base `009c8b3f`) · sholtzman + Claude Code (COMBAT-ABILITIES-LANE-2-20 to -22)

- What was done: lane B PR 6 (DEC-301) builds the Sentinel kit of DEC-199 in three slices, built in parallel and merged into `feat/sentinel-kit`.
  - Berserk (DEC-202; `balancing.md` Berserk row): a `berserk` status (12 s; damage dealt × 1.5, damage taken × 0.7, top speed × 1.2, size × 1.3). A new `size` stat scales the body radius through `Transform.resize`, set each tick by the new `BodySizeSystem`; a grown body is pushed out of walls (`CollisionQuery.pushOut`).
  - Rip & Tear (DEC-203, DEC-204, DEC-206, DEC-207): the `cone` shape, health conditions on damage, knock-back and debuff steps, the `execute` effect, the `feared` status with the `flee-source` steering (`StatusSteeringSystem`), status immunity on the class (the Sentinel is immune to Fear), and the HC-B26 (5) load check (a `hit` area only in an `onHit` list, DEC-343). The aim overlay draws the fan in darker blue and the Fear circle in lighter blue.
  - Shield Wall (DEC-330 (7), DEC-307): the `summon` effect places a 4 m × 1 m wall with 800 health 3 m ahead; at most 2 per Legend, a third removes the oldest. `RuntimeWalls` adds the outline to the collision index, the nav grid and the lane flow fields, and removes it when the wall goes. `EntitySnapshot.outline` lets the client draw it. `balancing.md` Shield Wall row updated (DEC-330 (7)).
  - Fixes after the merge: F1, an execute now respects a damage step that blocks the hit fully (an unbreakable gate, a body that takes no damage); a step that only reduces it still does not count. F2, an execute kills units only (`TargetFilter.families`, reading R6). F3, obstacles use the default view on purpose, so a match with a wall logs no "No view for kind" warning. F4, the Slam citations name `balancing.md:187`.
  - Owner questions: HC-Q107 to HC-Q112 (cards "PR6 R1" to "PR6 R6", Owner Calls page v92; each build uses the recommended option, marked `TUNE`). Scheduled: HC-S13 (an online Duel must not send a hidden enemy, with W10).
  - Docs: 05 §8 and §18, 07 §13 and 10 §12 implementation status notes.
- Checks run: after F1 to F4, `npm run check:quick` exit 0; core `npx vitest run`: `Test Files  374 passed (374)`, `Tests  2490 passed (2490)`; client: `Test Files  316 passed (316)`, `Tests  2222 passed (2222)`. The full `npm run check` and the pre-PR gate run next; the PR description records their results.
- Next step: the full `npm run check`, the pre-PR gate (critic, ponytail), then the push and a PR with base `feat/vanguard-hamstring` (#162) through the coordinator's script. Open, not built: no aim-overlay preview for Shield Wall; `NoMapObjectOverlapInvariant` does not check placed walls; a grown Berserk body in a gap narrower than itself may stay partly inside a wall (10 §12).
