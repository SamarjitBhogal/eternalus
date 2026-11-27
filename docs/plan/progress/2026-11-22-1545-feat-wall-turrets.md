---
title: 'Progress 2026-11-22: feat/wall-turrets (PR 4 part 2)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: wall turrets fire through Combat (TurretState, switch-ammo, attack-aim); attack-level onHit; the launch-shape rule (DEC-334) lets a bolt leave its pylon and wall.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/wall-turrets (PR 4 part 2)

Phase 4 / sprint 4.2 · feat/wall-turrets · sholtzman + Claude Code (PR-REVIEW-ASSIST-33 and its runners 2 to 4)

- What was done: on `82f5f395` (PR 2 final `400fa046` merged), uncommitted on top of the work in
  progress commit `7ed1ae87`. Attack-level `onHit` (`AttackBase` `onHit`, `attackInTicks`,
  `HitRunner.afterHit(..., attack)`, `checkAttackLinks` at boot). Turret ammo on the structure
  definition, `TurretState`, the `switch-ammo` command, and `TurretController` firing through
  `switch-ammo` and `attack-aim` (its brain keeps only the target). The launch-shape rule
  (DEC-334): a blocking shape whose blocking area holds a shot's launch point does not stop the
  shot (`CollisionQuery.reach` launch argument, `ProjectileSystem`, `LineOfFire`,
  `WorldObjectStore.blockingAt`, `NoMapObjectOverlapInvariant`). Status notes in architecture 05
  §10, 07 §13, 10 §12 and 11 §10. Fail-first: breaks 38 to 69
  (`eternalus-agent-work/wall-turrets/fail-first.md`).
- Checks run: `npm run check` → `EXIT=0` (core 366 files / 2421 tests, protocol 1 / 31, client
  315 / 2209, server 21 / 85, "Documentation check passed.";
  `eternalus-agent-work/wall-turrets/check-3.log`).
- Next step: the DEC-334 decisions-log row (orchestrator), then the pre-PR gate (critic,
  ponytail). Open: owner card "WT bolt stop", manual control, `turret-fired` and
  `turret-control-changed` events, tower orbs.
