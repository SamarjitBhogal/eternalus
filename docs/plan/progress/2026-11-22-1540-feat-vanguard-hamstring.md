---
title: 'Progress 2026-11-22: feat/vanguard-hamstring (PR 2 merge and C3: the blade hits the Stronghold)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: lane A PR 2 (#159) merged in; Hamstring blade names the walk-on outline its aim point is on, so it hits the Stronghold and gates (C3).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/vanguard-hamstring (PR 2 merge and C3: the blade hits the Stronghold)

Phase 4 / sprint 4.2 · feat/vanguard-hamstring · sholtzman + Claude Code (COMBAT-ABILITIES-LANE-2-17)

- What was done: merged lane A PR 2 (`feat/melee-sweeps` 400fa046, PR #159) into this branch as
  `84df8e95`. 15 files conflicted (Veil's untargetable rule against PR 2's aim, reach and leash
  changes; both test additions); each kept both sides (the commit message lists them). Then C3:
  `ProjectileEffect` sets the blade's `targetId` to `AreaHitQuery.aimedBodyOf` of the cast's aim
  point, as the weapon's shot does, so a blade aimed at the enemy palace floor from outside hits
  the Stronghold for 80 x 0.3 and one aimed past it flies over (DEC-314 (6), DEC-322 (1)). 05 §18
  Launch states the rule; its "Not built yet" sentence is gone. The handoff's trap (the on-hit
  cast's aim) needed no change: `HitEffects.runSteps` already aims the cast at the struck body.
- Tests: the Hamstring scenario adds the Stronghold test (r1-correctness S7, with the palace map
  object that gives the Stronghold its walk-on outline). Break H35: red before the fix (0, not 24).
  Break H36: every walk-on outline stops a shot, so the aimed-past throw hit (24, not 0); restored
  (`cmp`). Log `eternalus-agent-work/abilities/hamstring-breaks.log`.
- Checks run: on the merge, one full `npm run check` (2026-11-22 15:20:45 to 15:29:55 MST) `EXIT=0`:
  core 361 files / 2383 tests, protocol 1 / 31, client 316 / 2219, server 21 / 85, "Documentation
  check passed." (`eternalus-agent-work/abilities/hamstring-c3-merge-check.log`). On the C3 change,
  one full `npm run check` (15:40:21 to 15:49:53 MST): every test passed (core 361 / 2384, protocol
  1 / 31, client 316 / 2219, server 21 / 85), but `EXIT=1` from `docs:check` (this entry's H1 did
  not match its title). Fixed; `npm run docs:check` re-run: "Documentation check passed." `EXIT=0`
  (`hamstring-c3-check.log`).
- Next step: the owner pushes #150 (after its #136 `7d0fd9a7` merge) and this branch (PR base
  `feat/vanguard-veil-hamstring`; until PR 2 reaches that base, this PR's diff also shows PR 2).
  The owner answers HC-B26 (1), (2), (4), (5) and HC-Q79.
