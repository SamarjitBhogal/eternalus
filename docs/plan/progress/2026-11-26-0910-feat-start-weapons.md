---
title: 'Progress 2026-11-26: feat/start-weapons, critic round 1 rework (lane A PR 3, DEC-374)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: the dual blades are Warrior-only, KnownSpecWeaponRule checks class access, whole-attack and sundered-expiry tests, the DEC-374 and 05 §10 records, HC-B48, the #156 merge recipe.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/start-weapons, critic round 1 rework (lane A PR 3, DEC-374)

Phase 4 / sprint 4.2 · feat/start-weapons · sholtzman + Claude Code (PR 3 rework runner for
COMBAT-WEAPONS-ABILITIES-68)

- What was done: the rework of critic round 1 (report `critic-r1-7f7240b0-report.md`, the
  dispositions in `rework-r1-brief.md`, both in `eternalus-agent-work/abilities/pr3-weapons/`).
  B1: the dual blades are Warrior-only (`allowedClasses: ['warrior']`, `uniqueTo: 'warrior'`;
  reference 07, DEC-64, 05 §10). BD2: `KnownSpecWeaponRule` also rejects a spec weapon that the
  spec's class may not use (the spec part of 05 §12 `WeaponAllowedRule`). S4: the start-weapon
  tests check the whole attack of the knight, the paladin and the long-sword, and that `sundered`
  wears off after 4 s. S3 (b): the Warrior class fallback stays `raptor-talons`, with the reason
  in its comment. Comment fixes N3, N4, N5, N6, N8, N9. Records: DEC-374 (9) to (14) and the N1
  and N2 fixes; the 05 §10 table rows of the dual blades, the long sword and the great sword, and
  the D1 to D3 and D6 list in the 05 §10 dated note; the `INBOX.md` "Weapons — numbers and
  default weapons" note for point (2) (N7); `INBOX.md` HC-B48 (BD1, sign-off asked). Not built:
  N11 (a `Simulation` test of the weapon of a human and a bot slot), because `Simulation` shows
  no `Combat.weaponId`: no snapshot field and no state access carries it, so the test needs a
  staged fight. Deliberate breaks: the rework part of `breaks.log` (4 breaks, each red, each
  names its red test).
- Merge recipe for #156 (`feat/zealot-weapon-swap`, 3667ab1b), from the critic's
  `git merge-tree` (S6): the spec files and `legendSpecs.types.ts` merge clean. Three files
  conflict: `Legend.ts`, `defaultContentRules.ts` and `defaultContentRules.test.ts`. In
  `Legend.ts`, keep #156's `Loadout` construction, and give it the primary weapon from
  `primaryWeaponIdOf(spec, definition)`, not from `definition.defaultLoadout.primaryWeaponId`.
  If you take #156's side, the spec weapon is lost (the `Legend.startWeapon` tests catch it). In
  `createLegendSpecRules`, both branches add a `weapons` param: keep one `weapons` param, with
  `has` and `get` (`KnownSpecWeaponRule` needs `get`), and pass it to both spec rules
  (`KnownSpecWeaponRule` and #156's `SecondaryWeaponRule`). In `defaultContentRules.test.ts`,
  keep both rules in the list.
- Checks run: pending: the orchestrator runs npm run check
- Next step: critic round 2 on the rework, ponytail, the full `npm run check`, then the
  push-and-open-PR script for the coordinator.
