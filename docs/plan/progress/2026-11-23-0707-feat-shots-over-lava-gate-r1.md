---
title: 'Progress 2026-11-23: feat/shots-over-lava pre-PR gate round 1 (HC-Q89, DEC-360)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: critic round 1 rework of the shots-over-lava work; one shot stop rule, lava test up to the hit, reference burn numbers, flag names by effect; records DEC-360, HC-B41, DEC-345 and DEC-334 corrections.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/shots-over-lava pre-PR gate round 1 (HC-Q89, DEC-360)

Phase 4 / sprint 4.2 · feat/shots-over-lava · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-61, -62 and a runner)

- What was done: the critic round 1 rework (verdict REWORK, blockers Q89-R1-1 to -3). R1-1 and
  BTD2: one function, `utils/geometry` `doesShapeStopShot`, decides whether a map shape stops a
  shot. `CollisionResolver.reach` and `WorldObjectStore.blockingAt` both call it, so
  `NoMapObjectOverlapInvariant` no longer flags a shot over a lake. R1-2: a shot's move is tested
  for lava only up to the body it lands on. R1-3 and R1-7: `burn` takes the numbers of the
  reference table (`docs/reference/suggestions/more-abilities.md` §7), and the arrow's step uses
  the status's own duration. BTD1: the flags are `canShotsCross` and `canLightShots`, the query
  is `CollisionQuery.lightsShot`; `physics/` declares its own flag fields (R1-4). R1-5: the hash
  adds a field only for a lit shot. R1-6: `checkAttackLinks` checks each projectile's `litOnHit`
  steps at boot. R1-8: dated notes in architecture 03, 06, 07 §13 and 10 §12. Nits R1-10 to -14.
  Not built: a "shot mode" on `CollisionQuery.reach` (half of BTD2; reason in DEC-360). Records:
  DEC-360 (new), corrections on DEC-345 and DEC-334, `INBOX.md` HC-B41 (sign-off) and the
  HC-Q105 confirm lines. Fail-first: 10 tests, all red first
  (`eternalus-agent-work/abilities/hc-q89/r1-fail-first.md`).
- Checks run: `npm run check` → `CHECK_EXIT=0` (core 372 files / 2503 tests, protocol 1 / 31,
  client 315 / 2210, server 21 / 85, "Documentation check passed.";
  `eternalus-agent-work/abilities/hc-q89/logs/r1-fix-check.log`, on the code of this round before
  the records).
- Next step: critic round 2 on the rework, ponytail, re-check, merge the #163 head, then push and
  open the PR on base `feat/wall-turrets` through the coordinator. HC-Q105 and HC-B41 wait on
  the owner.
