---
title: 'Progress 2026-11-23: feat/shots-over-lava pre-PR gate round 3 (HC-Q89, DEC-360)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: critic round 3 (the last) PASS WITH NITS; the sweep and the fire test share one contact rule (contactWith); doesShapeStopShot takes the shape; wording and doc fixes; DEC-360 addendum, HC-B41 item (4).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/shots-over-lava pre-PR gate round 3 (HC-Q89, DEC-360)

Phase 4 / sprint 4.2 · feat/shots-over-lava · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-63)

- What was done: critic round 3 (the last of 3) on the round 2 delta: **PASS WITH NITS**, no
  blockers (`eternalus-agent-work/abilities/hc-q89/critic-r3.md`). Q89-R3-1 (better than design)
  built: `CollisionResolver.touches` and `firstContact` share `startsInside` and the new
  `contactWith`, so the fire test and the sweep use one bridge-deck rule (DEC-360 addendum,
  `INBOX.md` HC-B41 (4)). The ponytail P1 rejection reason was wrong; the critic showed it.
  Q89-R3-3: `doesShapeStopShot` takes the shape (its passages and `canShotsCross`), not a
  positional boolean. Q89-R3-2, -4: wording in `CollisionResolver` and a test title. Q89-R3-5:
  10 §7 now says a shot's walls come from `CollisionQuery.shotReach` (DEC-154: docs wrong about
  critic-verified code are corrected), and the 10 §12 note names the 2026-11-20 note too.
  Q89-R3-6: one sentence in 10 §7 no longer starts with "And". Q89-R3-7, -8: acceptable, no change.
- Checks run: full `npm run check` on the round 2 code (`4d726190`): `CHECK_EXIT=0`
  (`logs/63-r2-check.log`: core 372 files / 2503 tests, protocol 1/31, client 315/2210, server
  21/85, documentation check passed). On the round 3 edits: core test typecheck clean; eslint on
  the changed files clean; targeted vitest 68 files / 526 tests passed (`logs/r3-green.log`).
  Deliberate break (deck rule in `contactWith` reversed): 2 failed, one mover test and one
  `lightsShot` test (`logs/r3-red-1-contactwith-deck.log`); file restored (`cmp`).
- Next step: merge the local #163 head `da6bba6b` (keep both row sets in `INBOX.md`, the
  decisions log and 06 §10), full `npm run check` on the merge, then the push script for the
  coordinator. The round 3 edits get no fourth critic round (the owner's limit is 3).
