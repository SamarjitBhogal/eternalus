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
`feat/class-passives` bf34cfcd) · sholtzman + Claude Code (eternalus-146 to -149)

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

- Checks run (before the gate): `npm run check` on the merged tree (HEAD after the bf34cfcd
  merge, with this entry): EXIT=0. Format, no-js, lint, typecheck, knip and build pass; core 352
  files / 2286 tests (coverage, all files: 99.11 statements, 93.12 branches, 99.35 functions,
  99.22 lines); client 314 files / 2202 tests; docs check passed (144 files). Log:
  `eternalus-agent-work/magus-passives/check-1.log` (sibling folder).
- Pre-PR gate, round 1 (eternalus-148; fixes by eternalus-149). Reports in
  `eternalus-agent-work/magus-passives/` (sibling folder).
  - Architecture critic: pass with fixes, no blocker, one major (F1). Correctness critic: no
    blocker. Ponytail: no structural cut.
  - Fixed: arch F1 and corr F1 (the DEC-337 and DEC-338 rows; the code cites them where a value
    is a reading); F2 (`ScaledModifier` in `StatusEffects.types.ts`); F3 (`CastFacts` carries
    `potency` and `stretch`: `AbilitySystem` reads the caster's, `HitEffects` gives 1, so an
    on-hit step of a basic attack does not change); F4 (unit tests for `Abilities` and
    `AbilitySystem`; the Legend spec and the Duel rearm stay covered by the scenario tests, B1
    and B3); F5, F11 and F17 (04, 17 R8, 06 FR-053, 01, 05 §18); F10 (`multiplier` returns early
    when no modifier scales by health); F14 (these labels); F15, F16 and corr F5 (TSDoc).
  - Corr F3: the steps that fire on one tick share the caster's stats; the 05 §18 note now says
    so (DEC-337 (7)). Corr F4 and arch F6 (a Legend spawned later in a tick, the Duel reset
    tick): DEC-338 (4) and the 05 §18 note.
  - Corr F2 (a knock-back's `staggered` and `knockup` are not stretched): kept as built, recorded
    as DEC-337 (4), and sent to the coordinator as an Owner Calls card.
  - Better than the design (arch F6, F7, F8, F9, F12, F13): `INBOX.md` HC-B40, for Sam.
  - Ponytail: accepted (2) `UltimateCharge.gainOf` and (6) the TSDoc reflow. Rejected (1) and
    corr F6 (a required `passiveId`; a required health for the scaled stats): `null` is a real
    value ("no passive"), the one production caller (`Legend`) always passes it, and
    `StatusModifierStep` is the one reader of the scaled stats. Rejected (3) one message form: it
    changes the existing "an ability" and "an ultimate" messages for one word. Items (4), (5),
    (7), (8) and (9) asked for no cut.
  - New tests went red on these breaks; each restored file was `cmp` identical to its copy:

  | Break | Production file            | Change                                       | Red test                        |
  | ----- | -------------------------- | -------------------------------------------- | ------------------------------- |
  | B8    | `abilities/HitEffects.ts`  | reads the attacker's `abilityPotency` again  | HitEffects: 11 instead of 10    |
  | B9    | `systems/AbilitySystem.ts` | passes `potency: 1`                          | AbilitySystem: 1 instead of 1.1 |
  | B10   | `systems/AbilitySystem.ts` | no sort of the due passives                  | AbilitySystem: passive id order |
  | B11   | `components/Abilities.ts`  | `takeDuePassive` keeps the flag              | Abilities: given out once       |
  | B12   | `components/Abilities.ts`  | `rearmPassive` sets the flag with no passive | Abilities: no passive, no rearm |

- Checks run (after the gate fixes): see `2026-11-23-0731-feat-magus-passives.md`, which also
  records the HC-B40 build (DEC-361, eternalus-150) and critic round 2 (eternalus-151).
- Next step: critic round 2 on the fix commits; then the PR (base `feat/class-passives`, after
  origin has GL's bf34cfcd), pushed by a script that the coordinator gives to Sam; tell
  GAME-LOOP-AND-POST-GAME-64 the PR number. Owner item G (content ids: names or slot ids such as
  `Magus.PassiveOption1`) is open with the coordinator; this branch builds option A.
