---
title: 'Progress 2026-11-23: feat/shots-over-lava pre-PR gate round 2 and ponytail (HC-Q89, DEC-360)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: critic round 2 PASS WITH NITS; the shot sweep gets its own port method (shotReach); ponytail cuts P3, P4, P6; DEC-360 addendum, HC-B41 item (3).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/shots-over-lava pre-PR gate round 2 and ponytail (HC-Q89, DEC-360)

Phase 4 / sprint 4.2 · feat/shots-over-lava · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-62)

- What was done: critic round 2 on the round 1 rework: **PASS WITH NITS**, no blockers
  (`eternalus-agent-work/abilities/hc-q89/critic-r2.md`). Q89-R2-1 (better than design) built:
  the `CollisionQuery` port has `reach` for movers and dashes and `shotReach` for shots, whose
  launch point is required (DEC-360 addendum, `INBOX.md` HC-B41 (3)). Q89-R2-2 (`utils/` holds
  `doesShapeStopShot`) explained in the 10 §12 note. Q89-R2-4: the lit cast is named after the
  weapon that fired the shot (wording in `HitEffects`, `ProjectileSystem`, 05 §10). Q89-R2-5
  (positional boolean) not applied: `blockingAt` has one footprint polygon per call and the flags
  on the object, so there is no one shape object to pass. Ponytail (`ponytail-r1.md`): P3, P4,
  P6 applied (shorter `StepRunner` and `lightsShot` docs, no empty-steps guard in `runSteps`); P1,
  P2, P5, P7 rejected (reasons in the PR body). Fail-first for the split: two deliberate breaks,
  both red (`logs/r2-red-1-shot-uses-reach.log`: 4 failed; `logs/r2-red-2-dash-uses-shotreach.log`:
  3 failed).
- Checks run: targeted vitest on the 13 touched core test files: 196 passed
  (`logs/r2-green.log`); eslint on the changed files: clean; core test typecheck
  (`tsc -p tsconfig.test.json`): clean. Full `npm run check` runs next.
- Next step: critic round 3 on the round 2 delta (the port split changed structure), full
  `npm run check`, merge the #163 head, then the push script for the coordinator.
