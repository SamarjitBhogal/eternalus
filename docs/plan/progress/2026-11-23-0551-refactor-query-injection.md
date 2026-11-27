---
title: 'Progress 2026-11-23: refactor/query-injection (HC-B35 follow-up, DEC-344 (3))'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: ReachQuery and AreaHitQuery become constructor parameters built once in Simulation; the lane leaves move out of BotLeaves.ts; no behaviour change.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: refactor/query-injection (HC-B35 follow-up, DEC-344 (3))

Phase 4 / sprint 4.2 · refactor/query-injection · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-60, -61 and a runner)

- What was done: the two critic items of PR 2 round 2 that DEC-333 did not build, which the owner
  asked for in a follow-up (HC-B35 answer B, DEC-344 (3)). (R2-A8) `Simulation` builds one
  `ReachQuery` and one `AreaHitQuery` and passes them to `CombatSystem`, `PathingSystem`,
  `StuckSystem`, `LineOfFire`, `ProjectileSystem`, `TargetQuery`, `HitEffects`, `AbilitySystem`
  and the bot content; `AreaHitQuery.stopsShot` is an instance method. (R2-A10) `findHorde` and
  `findLanePoint` move to the new `ai/BotLaneLeaves.ts`; `BotLeaves.ts` goes from 328 to 287
  lines. R2-A14 needed no change: `MeleeAttackStrategy` already checks `takesNoDamage`. No
  behaviour, fixture or hash change. Architecture 05 and 10 updated.
- Checks run: `npm run check` → `CHECK_EXIT=0` (core 356 files / 2315 tests, protocol 1 / 31,
  client 315 / 2209, server 21 / 85, "Documentation check passed.";
  `eternalus-agent-work/abilities/hc-b35/logs/builder-check.log`, on `ae419473`).
- Next step: the pre-PR gate (critic on base `fabe45ad`, ponytail, re-check), then push and open
  the PR on base `feat/melee-sweeps` (#159) through the coordinator.
