---
title: 'Progress 2026-11-22: feat/zealot-weapon-swap (PR 2 merged into PR 9, merge critic)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: PR 2 (feat/melee-sweeps 400fa046) merged into PR 9; critic r2 F8 done (class reach for both weapons, equip keeps the aim point); merge critic approve with 0 blockers, F1 (a melee aim held through a swap) and F2 (owner card facts) fixed; breaks red; full check passed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/zealot-weapon-swap (PR 2 merged into PR 9, merge critic)

Phase 4 / sprint 4.2 · feat/zealot-weapon-swap · sholtzman + Claude Code (PR-38-HELPER-49, -50)

- What was done: `c7ddea51` merges `feat/melee-sweeps` `400fa046` (PR 2, #159) into PR 9 (merge,
  not rebase; only `Combat.test.ts` conflicted, both sides kept). It does critic r2 F8 (DEC-305,
  DEC-319): `Legend.heldWeapon` passes the class's `meleeReach` for both weapons; `Combat.equip`
  keeps the aim point, the last swing and the recorded hits; tests "keeps the aim point, the last
  swing and the recorded hits" and "keeps the class reach on the talons after a swap back, and
  adds none to the bow". A focused critic pass on the merge diff (one pass, not a fourth round):
  approve, 0 blockers (`eternalus-agent-work/dec-288/pr9-critic-merge-pr2.md`). Fixed from it:
  F1, a melee aim held through a swap made the bow shoot at the old point, because `setAim`
  refuses `melee` for the bow; `equip` now stops an aim whose mode the new weapon lacks, so F
  does nothing with the bow out in either key order (`INBOX.md` HC-Q82, option A as built; new
  test "stops an aim held with a mode the new attacks do not have"). F2: HC-Q86 (1) and the
  HC-Q82 note said the talons reach 1.5 m and only hit more surely; after PR 2 they reach 3 m
  and sweep a quarter circle (DEC-305, DEC-319). F3: `heldWeapon` takes the definition it
  already has. F4: the `SwapWeaponEffect` TSDoc names the aim point. Rejected: F5 (the
  `Combat.test.ts` equip fixture keeps the strategy `melee`; `equip` does not read the
  strategy). The 05 §18 note says "the same target or aim point" and that a held melee aim
  stops.
- Checks run: deliberate breaks, each restored, each turned its test red:
  `pr9-breaks-merge-pr2.log` on `c7ddea51` ((a) `equip` clears the aim point, (b) clears the
  hits, (c) `heldWeapon` drops `meleeReach`: 1, 1 and 4 tests failed) and
  `pr9-breaks-merge-pr2-f1.log` on the fixes ((d) the F1 line removed, (e) every aim dropped,
  (b), (c): 1, 1, 1 and 4 tests failed; restored 41 / 41). `npm run check` → `CHECK EXIT 0`
  on `c7ddea51` plus these fixes (the same diff as the commits): core 361 files / 2353 tests,
  protocol 1 / 31, client 315 / 2215, server 21 / 85, "Documentation check passed."
  (`pr9-check-7.log`; `pr9-check-6` was stopped in lint when F1 came in).
- Next step: push (`push-pr9-merge-pr2.sh`, run by the coordinator), then a #156 comment. When
  #148 merges, retarget #156 to `phase/3-sprint-3-work`. DEC row once the owner's HC-Q80..HC-Q86
  and HC-B34 answers are final.
