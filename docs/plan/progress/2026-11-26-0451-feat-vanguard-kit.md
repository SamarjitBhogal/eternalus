---
title: 'Progress 2026-11-26: feat/vanguard-kit (#123 c3d9c01c merge, DEC-380 (1) and (2))'
description: 'Phase 3 / sprint 3 work, Claude Code: PR #136 takes #123 at c3d9c01c (phase/3 67dbae61); a Duel Legend starts with its ultimate half-charged; Blade Runner, Shockwave and Slam grow 8% per level.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/vanguard-kit (#123 c3d9c01c merge, DEC-380 (1) and (2))

Phase 3 / sprint 3 work · feat/vanguard-kit · sholtzman + Claude Code

- What was done: merge `3a7f4aba` takes #123 at `c3d9c01c`; its message lists the 42 conflicts, the semantic conflicts and the `ChargeLedger` respawn fix. DEC-380 (1) (`86ae3335`): `DUEL_RULES.ultimateStartCharge` (`content/duel/duelRules.ts`) goes to `ProgressionContent.ultimateStartCharge`, and `UltimateCharge` pays that share at each Legend's spawn (`ultimate-charged`, cause `start`). The Duel round reset leaves the meter as it is. Other abilities start ready (`AbilitySlotRuntime.cooldownUntilTick` is 0 until a cast); a Duel test pins it. DEC-380 (2) (`cf1d4cd0`): `scaling.amount.perLevel` 0.08 in `content/abilities/bladeRunner.ts`, `shockwave.ts` and `slam.ts`; a Slam test pins 738 at level 50. The DEC-380 row is on `feat/legend-level-damage`, not on this branch; the `// TUNE:` comments cite it.
- Checks run: `npm run check` on `3a7f4aba` → EXIT=0. `npm run check` on `cf1d4cd0` → EXIT=0 (core 2202, protocol 32, client 2299, server 163 tests; "Documentation check passed.").
- Next step: architecture 05 §6 does not name the start share yet (owner design text). Then the pre-PR gate for #136 (critic, ponytail), COMBAT-WEAPONS-ABILITIES.
