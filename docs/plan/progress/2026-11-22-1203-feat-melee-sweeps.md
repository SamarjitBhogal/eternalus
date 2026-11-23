---
title: 'Progress 2026-11-22: feat/melee-sweeps (PR 2 gate round 3 fixes)'
description: 'Phase 4 / sprint 4.4 lane A PR 2, sholtzman + Claude Code: fixed the round-3 critic findings (tests pin the hit tick at three callers, wording of the hit window, two decisions-log notes, TSDoc wrap) and logged the rule-1 break; corrects "every tick" in the 11:12 entry to every tenth tick.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/melee-sweeps (PR 2 gate round 3 fixes)

Phase 4 / sprint 4.4 · feat/melee-sweeps · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-59)

- What was done: fixed the findings of pre-PR gate round 3 (the last; owner limit 3) on head
  `86e004c1`: architecture approve (0 blockers, 0 major, 2 minor, 8 nits), correctness approve
  (0, 0, 1 minor, 5 nits), ponytail 0 cuts. Correctness m1: the tests of `ProjectileSystem`,
  `MeleeSweepAttackStrategy` and `MeleeAttackStrategy` now land the hit after one attack interval
  and check `hitsUntilTick`, so a wrong `tick` argument to `EntityStore.recordHits` fails.
  Wording: the hit window is "one attack interval, or the slowed cooldown when that is longer"
  in architecture 11 §4.3, 18 §6.1 and the `Combat.hitsAt` TSDoc (R3-A1); 05 names
  `EntityStore.recordHits` (R3-A2); the DEC-322 correction gets a file-column note (R3-A3); our
  unpublished DEC-317 addendum note on (7) is reworded in place (R3-A4); the golden-replay fixture
  TSDoc says "every tenth tick" (R3-A5). Five TSDoc lines are rewrapped to 100 columns (R3-A7).
  The changes are tests and wording only, so no critic re-run.
- Correction to the 11:12 entry (`2026-11-22-1112-feat-melee-sweeps.md`, "Golden replay"): the
  dump matched the old code at every tenth tick to 450, not at every tick. The round-3
  correctness critic then hashed the full state on every tick to 450 with the old hasher minus
  its `hits` line: identical. So the claim holds at every tick.
- Red first: M13 (`ProjectileSystem` records at tick 0), M15 (sweep at `state.tick - 1`) and M16
  (one-target melee at `state.tick - 1`) each turn the changed test red; removing rule 1 in
  `AreaHitQuery.find` turns 8 tests red (R3-A6). Each file was restored by copy with an equal
  checksum (`eternalus-agent-work/abilities/pr2-sweeps/breaks.log`, section CWA-59).
- Checks run: `npm run check:quick` → exit 0. `npm run check` on the working tree of the
  round-3 commits, before this line was filled in → `CHECK_EXIT=0` (format "All matched files use
  Prettier code style!", core 356 files / 2315 tests, protocol 1 / 31, client 315 / 2209, server
  21 / 85, "Documentation check passed.";
  `eternalus-agent-work/abilities/pr2-sweeps/logs/59-check-worktree.log`). Pre-commit hook
  (`check:quick`) on each commit.
- Next step: PR body, push script to the coordinator, then the origin SHA to lane B (with the
  R3-A10 note: `GameState.recordHits` is gone), PR 4 and PR 9. Open owner cards that do not
  block: HC-Q87, HC-Q88, HC-B35, `busy-minion-building` (option A built), HC-Q79
  `veil-no-damage-hit`.
