---
title: 'Progress 2026-11-22: feat/melee-sweeps (PR 2 gate round 2 fixes, DEC-333)'
description: 'Phase 4 / sprint 4.4 lane A PR 2, sholtzman + Claude Code: fixed the round-2 critic findings (victimsOf union, inclusive hit window, hit record and takes-no-damage rule on EntityStore as DEC-333), regenerated the ability golden replay for a hash-only change, recorded HC-B35, HC-Q87 and HC-Q88.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/melee-sweeps (PR 2 gate round 2 fixes, DEC-333)

Phase 4 / sprint 4.4 · feat/melee-sweeps · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-57, -58)

- What was done: fixed the findings of pre-PR gate round 2 on head `4bc45305` (architecture
  rework with 0 blockers, correctness approve, ponytail 2 cuts). `EntityStore.victimsOf` is now
  the lock and each other living recent hit (R2-A1). `Combat.hitsAt` counts the last tick of the
  window (correctness m1). The hit record moved from `GameState` to `EntityStore.recordHits`, with
  one attack-speed read (`attackSpeedOf`) and the window `max(attack interval, slowed cooldown)`
  (R2-A5, DEC-333 (1); `GameState` back to 299 lines). One rule `EntityStore.takesNoDamage` serves
  the hit rule, shots, line of fire, the damage step and one-target melee (R2-A9, R2-A14, DEC-333
  (2)). `StateHasher` hashes a hit record with no target (R2-A4). Docs: DEC-322 corrections
  appended, DEC-319 and DEC-317 addendum notes, new DEC-333 row; `INBOX.md` HC-B35, HC-Q87,
  HC-Q88, the DEC-226 item and the Samarjit FYI; architecture 02, 04, 05, 11, 18 and the phase 4
  status sentence. Rejected with reasons in HC-B35: R2-A8 (rest) and R2-A10.
- Golden replay: `abilityCastsSeed11.replay.ts` checkpoints 350 to 450 regenerated. A dump every
  10 ticks of positions, health, motion, facing, statuses, abilities, the RNG and the AI brains
  matched the old code (`4bc45305`) at every tick to 450; only the new hashed `hits` fields
  differed (`eternalus-agent-work/abilities/pr2-sweeps/logs/golden-replay-2026-11-22/`).
- Red first: each new or changed test failed on the old code or under a deliberate break
  (`eternalus-agent-work/abilities/pr2-sweeps/breaks.log`, sections CWA-57 and CWA-58).
- Checks run: `npm run check` on the working tree of the two round-2 commits, before this line
  was filled in → `CHECK_EXIT=0` (format "All matched files use Prettier code style!", core 356
  files / 2315 tests, protocol 1 / 31, client 315 / 2209, server 21 / 85, "Documentation check
  passed."; `eternalus-agent-work/abilities/pr2-sweeps/logs/58-check-worktree.log`). Pre-commit
  hook (`check:quick`) on each commit.
- Next step: commit, critic round 3 (the last, owner limit 3) on the round-2 fix diff, ponytail
  re-check, PR body, push script to the coordinator. Open owner cards that do not block:
  HC-Q87, HC-Q88, HC-B35, `busy-minion-building` (option A built), HC-Q79 `veil-no-damage-hit`.
