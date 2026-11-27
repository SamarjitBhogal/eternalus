---
title: 'Progress 2026-11-26: feat/tower-ruins-and-routes (phase/3 merge after #82, #84, #90, #170; 7 tests left red)'
description: "Phase 3 / tower ruins, SamarjitBhogal + Claude Code: merged phase/3-sprint-3-work 47ae8606; six conflicts resolved; seven tests from #82 and #90 fail on this PR's fort model and are left to the author."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/tower-ruins-and-routes (phase/3 merge after #82, #84, #90, #170)

Phase 3 / tower ruins and routes · feat/tower-ruins-and-routes (PR #98) · SamarjitBhogal + Claude Code

- What was done: merged `phase/3-sprint-3-work` at `47ae8606` (after #82, #84, #90 and #170) for the
  acting owner, who hands the rest to the author. Six conflicts, both sides kept:
  - `state/PathQuery.types.ts`: this PR's `exitWaypoint` and #84's `isLineClear`;
    `ai/BotLeaves.test.ts`: every `PathQuery` stub has both (#84's `counting` stub needed
    `exitWaypoint` without a text conflict).
  - `map/AStarPathfinder.ts` TSDoc: this PR's court paragraph and #84's `ponytail:` remark.
  - `systems/DefaultSystemPipeline.ts`: #82's `DamagePipeline`, built after the lane fields with
    the `LaneProgressOf` port and #132's `KillCredit`; the `entity-removed` reopening handler
    stays out (this PR moved it to `MapDestructionSystem` / `MatchGrid`, DEC-235 B3).
  - Doc 06 status table: this PR's grid-resolution row and #82's `FlowField.progressAt` sentence.
  - `docs/plan/PROGRESS.md` archive: both sides, the base's first.
- **Not done: seven core tests fail** on the merged tree and are the author's call (PR #98
  hand-off comment): `towerFortFootprints.test.ts` (3 seeds, #90: expects 12 footprints on the
  tower object; this PR splits the fort into 11 wall objects plus the core),
  `mapPreservation.test.ts` (3 seeds, #90: collision, scenery and tower hashes move; counts do
  not), and `LaneFlowFields.test.ts` 5 lanes match grid (#82: largest gap 0.0213 against the 2%
  bound).
- Checks run: `npm run check` on Node 24.21.0: core `Tests  7 failed | 1936 passed (1943)`;
  protocol 31, client 2263, server 163 passed. `check:quick` passes.
- Next step: the author updates or answers the three tests; then #122 and #152 merge this head.
