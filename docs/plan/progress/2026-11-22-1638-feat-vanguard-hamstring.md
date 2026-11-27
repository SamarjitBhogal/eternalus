---
title: 'Progress 2026-11-22: feat/vanguard-hamstring (merge critic round 1 fixes)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: fixed the seven items of the Hamstring merge critic round 1 (M1-1 to M1-7) after the merge of #150.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/vanguard-hamstring (merge critic round 1 fixes)

Phase 4 / sprint 4.2 · feat/vanguard-hamstring · sholtzman + Claude Code (COMBAT-ABILITIES-LANE-2-18, COMBAT-ABILITIES-LANE-2-19)

- What was done: the merge critic of the #150 merge (`90490af2`) gave "approve with nits", items M1-1 to M1-7.
  - M1-1 (`584f9e20`): the aim-point test of a walk-on outline (`AreaHitQuery.isEnemyUnitAt`) skips a hidden unit, as `findUnitAt` does, so an aim at the floor under a Veiled enemy names the floor (DEC-322 (1), DEC-266). New `aimedBodyOf` test.
  - M1-3 (`584f9e20`): a Veil scenario: an enemy sweep aimed at the Veiled Vanguard hits it and ends Veil; one aimed away leaves it hidden (DEC-327).
  - M1-2: 05 §18 "Untargetable" now states the merged aim attack in the present tense; the "Hidden" bullet states the M1-1 rule.
  - M1-4: `ProjectileEffect` TSDoc rewrapped to 100 columns. M1-5: a `ProjectileEffect` unit test for a walk-on outline under the aim point; the old case is renamed.
  - M1-6 (better than the design, not built: it changes bot behaviour): 05 §18 "Launch" no longer says the blade picks its target "as for a weapon's shot"; a dated note under `INBOX.md` HC-B26 (2) adds the one shot-target rule to that item.
  - M1-7: a dated note on `INBOX.md` HC-Q79: the outcome is the same; such hits are now dropped before the damage step (DEC-333 (2)). Not asked again.
- Checks run: break proofs H37 to H40 in `eternalus-agent-work/abilities/hamstring-breaks.log` (each new test went red, then the code was restored and checked with `cmp`). Targeted runs: `AreaHitQuery.test.ts` 17/17, `veil.test.ts` 7/7, `ProjectileEffect.test.ts` 5/5. The full `npm run check` runs after merge critic round 2.
- Next step: merge critic round 2, a full `npm run check`, then the owner's push script opens the Hamstring PR on #150.
