---
title: 'Progress 2026-11-23: feat/magus-passives (HC-B40 better designs built, DEC-361)'
description: 'Phase 4 / sprint 4.1, sholtzman + Claude Code: seven better-than-design items of the Magus passives built (class default passive, PassiveInOptionsRule, passive load check, fixed-duration statuses, 05 §7, castStatsOf, durationFor), the critic round-2 and round-3 fixes, fail-first breaks B13-B35 and full checks.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/magus-passives (HC-B40 better designs built, DEC-361)

Phase 4 / sprint 4.1 · feat/magus-passives (commits `cc1927e2`, `67c87b7e`, `29bbd50b` code;
`0ba80f43`, `c7ea5ced` docs; on `9e84bd1e`) · sholtzman + Claude Code (eternalus-150 to
eternalus-152)

- What was done: the five HC-B40 items of the architecture critic, round 1, built under the
  standing rule of DEC-223. The decisions log row is DEC-361.
  - F7: each Legend class names a default passive (`LegendDefinition.defaultPassiveId`: Sentinel
    `wrecking-run`, Vanguard and Magus `null`). A spec's `passiveId: null` now means "the class
    default", as `kit: null` does. `passiveOf` (beside `kitOf`) is the one place of this rule, and
    `Legend` uses it. So a developer spawn with no spec gets the class default. This replaces
    DEC-338 (3). The Colossus and Juggernaut specs now say `null`.
  - F9: `PassiveInOptionsRule` checks the passive against the class's `passiveOptions`, in both
    rule lists. `KitInPoolRule` checks only the kit.
  - F12: at boot, `checkStatusLinks` rejects a passive step that is not a `buff`, a buff with a
    time of its own, and a buff of a status that ends.
  - F13: a status can have `hasFixedDuration`. Erudition's `abilityDuration` does not stretch
    it. Fury's wind-up has it, because its time matches the dash step.
  - F6: 05 §7 says who puts a passive on (`AbilitySystem`, first in its pass; `DuelRoundSystem`
    makes it due again after a round reset). The 05 §18 note keeps only what still differs. Also
    04 §9, 17 R2 and R8, `01-classes-and-subclasses.md` and `INBOX.md` HC-B40.
  - Not built: F8 (a cast says where it comes from, not the `default-action` slot). PRs #162 and
    #163 rewrite `HitEffects.ts`, so F8 is a follow-up PR after they merge.
- Tests: `passiveOf.test.ts`, `PassiveInOptionsRule.test.ts` and `checkStatusLinks.test.ts`
  (new), plus new cases in `Legend.test.ts`, `CastInstance.test.ts`,
  `StatusEffectApplier.test.ts` and `defaultContentRules.test.ts`. Each new test went red on a
  deliberate break. The script copied each file first and restored it from the copy; every
  restored file was `cmp` identical. Script and logs: `eternalus-agent-work/magus-passives/breaks3/`
  (sibling folder).

  | Break | Production file                              | Change                                        | Red test (assertion)                                                  |
  | ----- | -------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------- |
  | B13   | `content/legends/specs/passiveOf.ts`         | `?? legend.defaultPassiveId` to `?? null`     | 2 `passiveOf` tests ("expected null to be 'wrecking-run'")            |
  | B14   | `entities/Legend.ts`                         | `passiveOf(...)` to `spec?.passiveId ?? null` | Legend: class default passive ("expected null to be 'class-passive'") |
  | B15   | `content/validation/PassiveInOptionsRule.ts` | the options check always passes               | 2 rule tests ("expected [] to deeply equal [ Array(1) ]")             |
  | B16   | `content/validation/kitSubjectOf.ts`         | class `passiveId: null`                       | rule test: class default outside its options                          |
  | B17   | `abilities/checkStatusLinks.ts`              | the passive check never runs                  | "expected [Function] to throw an error"                               |
  | B18   | `abilities/checkStatusLinks.ts`              | a buff with its own time passes               | "expected [Function] to throw an error"                               |
  | B19   | `abilities/CastInstance.ts`                  | always stretch                                | Fury's wind-up time ("expected 11 to be 9")                           |
  | B20   | `combat/StatusEffectApplier.ts`              | `hasFixedDuration === false`                  | "expected false to be true"                                           |
  | B21   | `content/status-effects/furyWindup.ts`       | `hasFixedDuration: false`                     | Fury's wind-up time ("expected 11 to be 9")                           |
  | B22   | `content/defaultContentRules.ts`             | rule left out of the list                     | "lists every shipped rule"                                            |

- Checks run (HEAD `0ba80f43` with this entry, before the round-2 fixes): `npm run check`:
  `exit 0`. Format, no-js, lint, typecheck, knip and build pass (knip prints its usual
  configuration hint, "Remove from ignoreDependencies"); core 354 files / 2301 tests (coverage, all
  files: 99.14 statements, 93.12 branches, 99.4 functions, 99.24 lines); protocol 1 file / 31
  tests; client 314 files / 2202 tests; server 21 files / 85 tests; "Checked 145 Markdown files
  under docs/. Documentation check passed." Log: `eternalus-agent-work/magus-passives/check-2.log`
  (sibling folder).
- Pre-PR gate, round 2 (eternalus-151), on `21db88d3..0ba80f43`. Reports in
  `eternalus-agent-work/magus-passives/` (sibling folder): `critic-arch-r2.md`,
  `critic-correctness-r2.md`, `ponytail-r2.md`.
  - Architecture critic: pass with fixes, no blocker, no major; three minors (R2-1 to R2-3).
    Round-1 F1 to F17 fixed, recorded or built (F8 is the follow-up). Correctness critic: no
    blocker, no code defect; its ten breaks in a scratch copy all went red, and the replays
    reproduce. Ponytail: no structural cut.
  - Fixed: R2-1 and C1 (the `specId` TSDoc: no spec = the class's `defaultKit` and
    `defaultPassiveId`); R2-2 (the `CHECK-2` line of the earlier entry points here); R2-3 (a test
    for a class `defaultPassiveId` that is not a passive); R2-4 and ponytail (2) (three TSDoc
    lines over 100 characters); R2-5 and C3 (04 §9, the 05 §18 note, FR-053 and `AbilitySlotKind`
    name the class default too, and a passive may have no steps); R2-6 (DEC-361 now uses the
    item numbers of `INBOX.md` HC-B40); R2-7 (a passive buff that waits, or has a time of its
    own, gets its own message); C2 (`BuffEffect` and `DebuffEffect` TSDoc name `hasFixedDuration`
    and the cast's `stretch`); C4 (a test that a later step reads the stats on its own tick); the
    round-1 F7 note (`wreckingRun.ts`: a loadout that drops Wrecking Run must drop the momentum).
  - Better than the design, built under DEC-223 and added to HC-B40 and DEC-361: (7) R2-8 and
    ponytail (3), `castStatsOf` is the one read of a caster's ability stats (`AbilitySystem` and
    the test fixture); (8) R2-9, `StatusEffectApplier.durationFor` holds the stretch rule beside
    the status data and replaces the methods `durationOf` and `hasFixedDuration` (the status field
    `hasFixedDuration` stays).
  - Rejected: ponytail (1), delete the early return in `StatusEffects.multiplier`. It is the
    round-1 architecture fix F10 (the hot path of NFR-023); the architecture outranks ponytail,
    and the architecture critic would keep it. Ponytail (4) to (7) asked for no cut; (7) is the
    round-1 fixes F1 and F15.
  - New tests went red on these breaks. The script copied each file first and restored it from
    the copy; every restored file was `cmp` identical, and `git diff --stat` was unchanged after
    the run. Script and logs: `eternalus-agent-work/magus-passives/breaks4/` (sibling folder).

  | Break | Production file                      | Change                               | Red test (assertion)                           |
  | ----- | ------------------------------------ | ------------------------------------ | ---------------------------------------------- |
  | B23   | `abilities/castStatsOf.ts`           | potency reads `abilityDuration`      | "expected 1.2 to be close to 1.1"              |
  | B24   | `abilities/castStatsOf.ts`           | `stretch: 1`                         | "expected 1 to be close to 1.2"                |
  | B25   | `systems/AbilitySystem.ts`           | a later step reads no stats          | later step: "expected 1 to be close to 1.1"    |
  | B26   | `combat/StatusEffectApplier.ts`      | ignore `hasFixedDuration`            | Fury's wind-up: "expected 11 to be 9"          |
  | B27   | `combat/StatusEffectApplier.ts`      | no 1-tick floor                      | "expected +0 to be 1"                          |
  | B28   | `combat/StatusEffectApplier.ts`      | ignore the step's own time           | 3 `durationFor` tests                          |
  | B29   | `abilities/checkStatusLinks.ts`      | a passive step may wait              | "expected [Function] to throw an error"        |
  | B30   | `abilities/checkStatusLinks.ts`      | a passive buff may have its own time | "expected [Function] to throw an error"        |
  | B31   | `validation/KnownAbilityRefsRule.ts` | skip a class's passive               | "expected [] to have a length of 1 but got +0" |
  | B32   | `abilities/CastInstance.ts`          | `durationFor(..., 1)`                | "expected 90 to be 108"                        |

- Pre-PR gate, round 3 (the last; the owner allows three), on `0ba80f43..c7ea5ced`. Reports in
  `eternalus-agent-work/magus-passives/` (sibling folder): `critic-arch-r3.md`,
  `critic-correctness-r3.md`, `ponytail-r3.md`.
  - Architecture critic: pass with fixes, no blocker, no major, no code defect. Correctness
    critic: no blocker, no code defect; of its 18 breaks in a scratch copy, two stayed green (N2,
    N3: test gaps). Ponytail: no structural cut.
  - Fixed in `29bbd50b` and this commit: R3-2 and N1 (a passive step with `delayTicks: 0` runs at
    the cast, so it passes); N2 (a test that 7.2 ticks rounds down to 7); N3 (`durationFor`
    returns `undefined` only when neither the step nor the status has a time; a test for a step
    time on a permanent status); R3-1 (the check line below); R3-3 (the methods `durationOf` and
    `hasFixedDuration` went, the status field stays); R3-4 (this entry's description); R3-5 and N4
    (the decisions-log batch intro); R3-6 (the applier's class TSDoc names `durationFor`); R3-7 and
    N5 (a short line in the `AbilitySystem` TSDoc); R3-8 (`CastContext.statusDuration` points to
    `durationFor`).
  - Not changed: R3-9 (this entry is longer than the 15 lines of the progress README, as are the
    other entries of this branch; no action unless the owner asks). Ponytail (1), push into an
    array instead of three spreads: style only, kept. Ponytail (2), `EffectStep` as the parameter
    type: rejected, `EffectStep` has no `delayTicks`. Ponytail (3), read `delayTicks` after the
    `isBuff` guard: rejected, the guard narrows the step to `BuffSpec`, which has no `delayTicks`.
  - New tests went red on these breaks. Same method as `breaks4/`: every restored file was `cmp`
    identical, and `git diff --stat` was unchanged after the run. Script and logs:
    `eternalus-agent-work/magus-passives/breaks5/` (sibling folder).

  | Break | Production file                 | Change                                 | Red test (assertion)                        |
  | ----- | ------------------------------- | -------------------------------------- | ------------------------------------------- |
  | B33   | `abilities/checkStatusLinks.ts` | `delayTicks: 0` counts as a delay      | "expected [Function] to not throw an error" |
  | B34   | `combat/StatusEffectApplier.ts` | `Math.ceil` in place of `Math.round`   | "expected 8 to be 7"                        |
  | B35   | `combat/StatusEffectApplier.ts` | a permanent status ignores a step time | "expected undefined to be 36"               |

- Checks run (after the round-3 fixes, check-4): `npm run check` on `29bbd50b` with this entry
  and the INBOX and decisions-log edits: `exit 0`. Format, no-js, lint, typecheck, knip and build
  pass (knip prints its usual configuration hint, "Remove from ignoreDependencies"); core 355 files
  / 2306 tests (coverage, all files: 99.14 statements, 93.16 branches, 99.4 functions, 99.24
  lines); protocol 1 file / 31 tests; client 314 files / 2202 tests; server 21 files / 85 tests;
  "Checked 145 Markdown files under docs/. Documentation check passed." Log:
  `eternalus-agent-work/magus-passives/check-4.log` (sibling folder). After the check, only this
  line changed.
- check-3 (`npm run check` on `c7ea5ced`, eternalus-151) is not a record: it ran while these fixes
  and break B33 were in the tree. It ended `exit 1`; its one failure (2305 of 2306 core tests
  passed) is the new `delayTicks: 0` case under break B33. Log: `check-3.log` (sibling folder).
- Next step: the revised HC-B40 card to the coordinator (Sam signs off what is built). Then the
  PR (base `feat/class-passives`, after origin has GL's `bf34cfcd`), pushed by a script that the
  coordinator gives to Sam; tell GAME-LOOP-AND-POST-GAME the PR number. Then the F8 follow-up
  after #162 and #163 merge.
