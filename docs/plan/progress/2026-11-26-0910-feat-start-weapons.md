---
title: 'Progress 2026-11-26: feat/start-weapons, critic rounds 1 and 2 rework (lane A PR 3, DEC-374)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: Warrior-only dual blades, one weapon class-access rule for spec and class weapons, stronger start-weapon tests, the DEC-374 and 05 §10 records, HC-B48, the #156 merge recipe.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/start-weapons, critic rounds 1 and 2 rework (lane A PR 3, DEC-374)

Phase 4 / sprint 4.2 · feat/start-weapons · sholtzman + Claude Code (PR 3 rework runners for
COMBAT-WEAPONS-ABILITIES-68)

- What was done: the rework of critic rounds 1 and 2 (`critic-r1-7f7240b0-report.md`,
  `critic-r2-4e8787dd-report.md`, in `eternalus-agent-work/abilities/pr3-weapons/`). The dual
  blades are Warrior-only. `content/weapons/isWeaponAllowedFor.ts` is the one class-access rule:
  `SpecWeaponAllowedRule` checks a spec's start weapon, `DefaultWeaponAllowedRule` a class's
  default weapon; `KnownSpecWeaponRule` checks only that the weapon exists. New tests: whole
  attacks, sword arcs and intervals, dual-blades access, `sundered` expiry through the real
  `StatusEffectSystem`. Records: DEC-374 (9) to (15), the 05 §10 note and table, `INBOX.md`
  HC-B48 (2 points). N11 not built (no snapshot carries `Combat.weaponId`). Breaks: `breaks.log`.
- Checks run: pending: the orchestrator runs npm run check
- Next step: the full check, then the push-and-open-PR script (coordinator). #156 merge
  (3667ab1b): conflicts in `Legend.ts`, `defaultContentRules.ts` and its test; keep one `weapons`
  param and both sides' rules; take #156's `basicAttack()` (`Loadout.inHand`) and drop PR 3's
  body, feeding #156's `Loadout` from `primaryWeaponIdOf(spec, definition)`. #156's
  `SecondaryWeaponRule` also uses `isWeaponAllowedFor`.
