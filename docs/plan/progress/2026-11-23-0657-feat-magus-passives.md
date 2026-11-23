---
title: 'Progress 2026-11-23: feat/magus-passives (PR 8 part 2: Erudition and Necromancy, DEC-330)'
description: 'Phase 4 / sprint 4.1, sholtzman + Claude Code: the Magus passives Erudition and Necromancy as spec data, three new status stats, a modifier scaled by lost health, scenario tests, and the docs for DEC-330 S1, S2, N1 and P1.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/magus-passives (PR 8 part 2: Erudition and Necromancy, DEC-330)

Phase 4 / sprint 4.1 · feat/magus-passives (from `feat/class-passives` eeba668e, then merged
`feat/class-passives` bf34cfcd) · sholtzman + Claude Code (eternalus-146, -147, -148)

- What was done: the owner's answers S1, S2, N1 and P1 of DEC-330.
  - S1 and S2: Erudition (id `erudition`, was `studious`). Its permanent status holds three new
    stats: `abilityDuration` × 1.2 (the statuses an ability's `buff` or `debuff` step applies
    last longer), `abilityPotency` × 1.1 (an ability's `damage` steps) and `ultimateGain` × 1.25
    (each gain of the meter, never a loss). Basic attacks do not change (the S1 card).
  - N1: Necromancy. Its permanent status holds `damageDealt` × 1.3 and `damageTaken` × 0.85, each
    with `byLostHealth: { fullAt: 0.15 }`: nothing at full health, the full value at 15% health or
    less, in a straight line between. `StatusModifierStep` passes each side's health (a shield
    does not count).
  - P1: the sub-class sets the passive. `LegendSpecDefinition.passiveId`: Heretic
    `necromancy`; Catalyst and Oracle `erudition`; both Sentinel specs `wrecking-run` (a passive
    ability with no steps: its effect is the movement numbers, DEC-307); the Vanguard specs
    `null`. `KnownAbilityRefsRule` and `KitInPoolRule` check the ids.
  - `Abilities` holds the passive and a due flag. `AbilitySystem` puts each due passive on first,
    before the queued casts, with no price, no cooldown and no `ability-cast`. A Duel round reset
    makes it due again (`DuelRoundSystem`). `StateHasher` hashes `passive-due` only while it is
    due.
  - Docs: 05 §7 and §12 (Erudition), a 05 §18 note "Magus passives" (where the code differs from
    §3, §6, §7 and §8), 17 R2, and Erudition marked decided in `naming.md`, OQ-08, the classes,
    loadout, lore, requirements and glossary docs; Necromancy numbers in `balancing.md`; the
    phase 4 status line; `INBOX.md` HC-Q73, HC-Q17 and the `passiveOptions` item.
  - Merged the `feat/class-passives` follow-up (local bf34cfcd: F3 slide, HC-B29, the DEC-330
    row). No conflicts.
- Tests: unit tests in the code commit (`StatusEffects`, `loadStatusEffects`,
  `StatusModifierStep`, `DamageEffect`, `BuffEffect`, `DebuffEffect`, `CastInstance`,
  `StatusEffectApplier`, `UltimateCharge`, `loadAbilities`, `KnownAbilityRefsRule`,
  `KitInPoolRule`, the catalogues). Scenario tests in `Simulation.passives.test.ts` (each spec's
  status after the first tick; no cast, aether or cooldown; the Duel reset; a replay) and a
  `StateHasher` test. Each test went red on a deliberate break; every restored file was `cmp`
  identical to its copy. The scenario and hasher breaks:

  | Break | Production file              | Change                              | Red tests                                     |
  | ----- | ---------------------------- | ----------------------------------- | --------------------------------------------- |
  | B1    | `entities/Legend.ts`         | `spec?.passiveId ?? null` to `null` | 5 (three specs, no-cast test, Duel reset)     |
  | B2    | `systems/AbilitySystem.ts`   | skip `putOnPassive`                 | the same 5                                    |
  | B3    | `systems/DuelRoundSystem.ts` | no `rearmPassive()`                 | Duel reset                                    |
  | B4    | `components/Abilities.ts`    | `takeDuePassive` keeps the flag     | Duel reset (523 "necromancy on"), hasher test |
  | B5    | `state/StateHasher.ts`       | no `passive-due` field              | hasher test                                   |
  | B6    | `systems/AbilitySystem.ts`   | `putOnPassive` emits `ability-cast` | no-cast test                                  |
  | B7    | `KnownAbilityRefsRule.ts`    | "is not an passive" again           | 2 message tests                               |

  The replay test is a determinism check: no single break turns it red. The unit-test breaks
  are in `eternalus-agent-work/magus-passives/TEST-BREAKS.md` (sibling folder).

- Checks: `npm run check` on the merged tree (HEAD after the bf34cfcd merge, with this entry):
  EXIT=0. Format, no-js, lint, typecheck, knip and build pass; core 352 files / 2286 tests
  (coverage, all files: 99.11 statements, 93.12 branches, 99.35 functions, 99.22 lines); client
  314 files / 2202 tests; docs check passed (144 files). Log:
  `eternalus-agent-work/magus-passives/check-1.log` (sibling folder).
- Pre-PR gate: (filled in after the critics and ponytail).
- Next: open the PR (base `feat/class-passives`) once the gate passes; tell
  GAME-LOOP-AND-POST-GAME-64. Owner item G (content ids: names or slot ids such as
  `Magus.PassiveOption1`) is open with the coordinator; this branch builds option A.
