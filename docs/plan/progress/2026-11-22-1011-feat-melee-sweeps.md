---
title: 'Progress 2026-11-22: feat/melee-sweeps (DEC-322, DEC-326 build, ReachQuery split, #148 merge)'
description: 'Phase 4 / sprint 4.4 lane A PR 2, sholtzman + Claude Code: built the owner answers DEC-322, the DEC-317 addendum and DEC-326, moved the reach rule into ReachQuery, merged #148 9cb3a31e; full check passed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/melee-sweeps (DEC-322, DEC-326 build, ReachQuery split, #148 merge)

Phase 4 / sprint 4.4 · feat/melee-sweeps · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-55, -56)

- What was done: built the owner answers of Owner Calls v40 (DEC-322, the DEC-317 addendum,
  DEC-326), which close HC-Q76 to HC-Q78. Weapon and ability areas share one hit rule
  (`AreaHitQuery`): a walk-on outline is hit only when the hit aims at it, and a body that takes
  no damage now is never hit and stops a shot. The AI sees aimed hits: `GameState.recordHits` is
  the one contact record point, and `EntityStore.victimsOf` / `isAttacking` read it. A busy unit
  keeps its fight (`LeashBehaviour.engage`). An aimed shot picks a structure before a map object
  (`aimedBodyOf`). `ProjectileSystem` and `LineOfFire` use one shot-stop rule
  (`AreaHitQuery.stopsShot`). The client draws an arrow on an arc (`ProjectileSnapshot.flownShare`).
  Design text 03, 05, 10, 11 and 18 and the decisions-log readings were updated. The reach rule
  (`isInReach`, `aimPointOf`, `facingPointOf`) moved from `EntityStore` to the new
  `state/ReachQuery.ts`, the `AreaHitQuery` pattern (EntityStore 346 → 256 lines; closes R1-A13);
  architecture 04 and 18 name the new home. Merged `feat/ranged-attacks` `9cb3a31e` (#148's two
  progress entries, no conflict) in `c73ed867`. Earlier entries of this branch are in
  `PROGRESS.md` (before the DEC-277 cut-over).
- Checks run: `npm run check` on `c73ed867` plus the Prettier fix in this commit → `CHECK_EXIT=0`
  (format check "All matched files use Prettier code style!", core 356 files / 2312 tests,
  protocol 1 / 31, client 315 / 2209, server 21 / 85, "Documentation check passed.";
  `eternalus-agent-work/abilities/pr2-sweeps/logs/56-check-c73ed867-fmt.log`). The run before it
  on `c73ed867` failed on format only: "[warn] packages/core/src/ai/BotLegendController.test.ts"
  (a line the split made longer), fixed with `prettier --write`. Pre-commit hook on each commit.
- Next step: pre-PR gate round 2 (architecture critic, correctness critic, ponytail) on base
  `9cb3a31e`, then the push script to the coordinator; the owner pushes `feat/melee-sweeps` and
  opens the PR on `feat/ranged-attacks`. Open owner cards that do not block: `busy-minion-building`
  (option A built) and HC-Q79 `veil-no-damage-hit` (decides lane B's F8).
