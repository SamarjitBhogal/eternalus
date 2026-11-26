---
title: 'Progress 2026-11-25: feat/ability-framework (three phase/3 merges, FR-117 respawn fix)'
description: 'Phase 3 / sprint 3 work, Claude Code: PR #123 takes phase/3 three times (1145cf6b, e29ecec5, 67dbae61), a returning Legend gets every ability but the ultimate ready (FR-117), and the Esc key reads the aim and the Duel from the store; merge critics r1-r3 and the full check.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/ability-framework (three phase/3 merges, FR-117 respawn fix)

Phase 3 / sprint 3 work · feat/ability-framework · Claude Code (sessions CWA-63 to CWA-65)

- What was done: PR #123 took `phase/3-sprint-3-work` three times, because phase/3 moved during
  the work. Every merge resolution keeps both sides; each merge commit lists its conflicts.
  - `fe3515c0` merges `1145cf6b` (17 conflicted files): `LegendSpawner.spawn` takes
    `{ controller, specId }`, the command handlers get the cast rule, `LegendReset` ends pushes.
  - `8e5792fd` fixes FR-117: `RespawnSystem` brought a Legend back with its ability cooldowns
    still running. `Abilities.endCooldownsButUltimate()` now readies every ability but the
    ultimate, which keeps its cooldown and charge. The Duel round reset is not changed
    (`INBOX.md` HC-Q55, open). Red without the call.
  - `a1418c61` merges `e29ecec5` (7 PRs, 6 conflicted files): the Esc key handles both the aimed
    ability (DEC-209 (3)) and the Duel leave confirmation (#118); the Duel arena's map objects
    (#145) feed `buildWorld`.
  - `c4629dfe` merges `67dbae61` (#132, the hittable Cathedral gem; 11 conflicted files and 4
    semantic conflicts that typecheck found, fixed in the merge). A fifth semantic conflict showed
    only in the full check: #132 began hashing `LastEnemyHit` (DEC-346), and ability hits add it,
    so the ability golden replay diverged at tick 350. Fixed in `599f10f2` (below).
  - Merge critic r1 (`fe3515c0`, `8e5792fd`): APPROVE; fixed in `64f5ba18` (a respawn ends a push
    under way, TSDoc).
  - Merge critic r2 (`a1418c61`, `64f5ba18`): APPROVE; fixed in `98cd6394`. S1 was built as the
    critic's better-than-design BTD-1: `usePauseMenuKey` reads both the aim and the Duel from the
    store, and `pressPauseMenuKey` takes `{ isAiming, isDuel }`, so a swap of the two flags fails
    a test (sign-off item in `INBOX.md`). Nits: doc 13, the pipeline TSDoc order, the
    `RespawnSystem` citations.
  - Merge critic r3 (`c4629dfe`, `98cd6394`): REQUEST CHANGES (one blocker, two should-fix
    items, three nits); fixed in `599f10f2`:
    - B1: checkpoints 350, 400 and 450 of `abilityCastsSeed11.replay.ts` re-recorded with
      `recordReplay`; the commands and checkpoints 0 to 300 are unchanged. With the
      `last-enemy-hit` hash field left out, the old hashes reproduced (the critic's scratch copy),
      so the hash format changed, not the behaviour.
    - S1: `abilities/scenarios/cathedralGem.test.ts`: Shockwave over the gem stuns and burns the
      caster, and the gem takes no damage (DEC-292). Red with `TargetQuery` skipping neutral
      entities. Doc 07's implementation note says ability areas reach the gem.
    - N1, N2: TSDoc wrapping; doc 13's `MatchScreen` row names `selectAimingSlot`,
      `selectIsDuel` and `cancel-aim`.
    - N3 (a stray `Simulation.duel.test.ts.orig` on phase/3) is out of this PR's scope and went to
      the coordinator.
  - Critic re-check of `599f10f2`: APPROVE. B1, S1, N1 and N2 fixed; 3 of 3 mutants on the gem
    test killed. Its two optional doc 07 nits (the clause names only damaging, non-ally areas; one
    long line re-wrapped) are applied with this entry.
- Checks run: `npm run check` on `98cd6394` failed (core 1 failed, 2091 passed: the replay, B1).
  `npm run check` on `599f10f2`: EXIT=0. core "Test Files 341 passed (341) Tests 2093 passed
  (2093)"; protocol "Tests 31 passed (31)"; client "Test Files 326 passed (326) Tests 2271 passed
  (2271)"; server "Test Files 29 passed (29) Tests 163 passed (163)"; "Documentation check
  passed." Logs in `eternalus-agent-work/abilities/pr123-merge/logs/`.
- Next step: push `feat/ability-framework` through the coordinator's script (fast-forward from
  `f08cb7d0`); CI on the new head; one teammate approval on #123. Then the PRs stacked on #123
  take it in order: #136, #148, #159, #163, #169, and #165 on #159.
