---
title: 'Progress 2026-11-23: feat/shots-over-lava (HC-Q89, DEC-345)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: shots fly over lakes and lava rivers; an arrow that crosses lava catches fire and burns what it hits; records DEC-345, HC-Q89 answered, HC-Q105 asked.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/shots-over-lava (HC-Q89, DEC-345)

Phase 4 / sprint 4.2 · feat/shots-over-lava · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-60, -61 and a runner)

- What was done: the owner's HC-Q89 answer B (Owner Calls v68). Lakes and lava rivers carry an
  `isLowGround` flag, lava rivers also `isFire`. `CollisionResolver.reach` lets a shot (a call
  with a launch point) pass low ground; units still stop there. `touchesFire` tells
  `ProjectileSystem` when a shot's move crosses lava; a projectile with `litOnHit` steps (only
  the `arrow`) then stays lit and applies the new `burn` status when it lands, credited to the
  shooter. `HitEffects.runSteps` behind a new `StepRunner` port runs the steps. The lit flag is
  hashed, snapshotted and drawn in a fire colour (TUNE). Three DEC-334 lava-bridge tests changed
  to the new rule; architecture 10 has a dated note. Records: DEC-345 (with a correction note on
  DEC-334), `INBOX.md` HC-Q89 answered and HC-Q105 (camp fires) asked. Fail-first: 23 breaks,
  all red (`eternalus-agent-work/abilities/hc-q89/breaks.log`).
- Checks run: `npm run check` → `CHECK_EXIT=0` (core 372 files / 2498 tests, protocol 1 / 31,
  client 315 / 2210, server 21 / 85, "Documentation check passed.";
  `eternalus-agent-work/abilities/hc-q89/logs/61-check-records.log`, on the tree of this commit).
- Next step: the pre-PR gate (critic on base `80f2e2f4`, ponytail, re-check), then push and open
  the PR on base `feat/wall-turrets` (#163) through the coordinator. HC-Q105 waits on the owner.
