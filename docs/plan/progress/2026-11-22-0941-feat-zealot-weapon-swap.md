---
title: 'Progress 2026-11-22: feat/zealot-weapon-swap (PR 9 critic round 1 fixes, shared Combat.equip)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: PR 9 critic r1 fixes (bots skip by ability, weapon-in-hand invariant, HUD gadget frames, HC-Q80..Q84, HC-B30); merged the shared Combat.equip commit 9fe2c678; 27 breaks red; full check passed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/zealot-weapon-swap (PR 9 critic round 1 fixes, shared Combat.equip)

Phase 4 / sprint 4.2 · feat/zealot-weapon-swap · sholtzman + Claude Code (PR-38-HELPER-45 to -47)

- What was done: the critic round 1 findings of combat PR 9 (DEC-303). `f37d60b4`:
  `SecondaryWeaponRule` (a spec has a second weapon exactly when an artifact swaps weapons) and
  one weapon load at spawn. `48954d53`: a Legend's artifacts name its HUD gadget frames.
  `3e37e243`: bots skip an ability authored `canBotCast: false` (`SlotReadiness.canBotCast`),
  not the gadget slots; `WeaponInHandMatchesCombatInvariant`; code comments cite `INBOX.md`
  HC-Q80..HC-Q84. `5ac78022`: `INBOX.md` HC-Q80..HC-Q84 and HC-B30 (one ability catalogue for
  artifacts, better than the design), and the 04, 05 §18 and 11 notes. `e93e6ad7` merges
  `9fe2c678` (`feat/combat-equip`, on #148 `9cb3a31e`): one `Combat.equip(attacks, weaponId |
null)` that PR 4's turret ammo switch merges too (COMBAT-WEAPONS-ABILITIES-55). Rejected: a
  duplicate-artifact check, which 05 §12 gives to the designed `LoadoutValidator`.
- Checks run: deliberate breaks, each restored, each turned its tests red: core B1–B12 and
  B14–B21 (`eternalus-agent-work/dec-288/pr9-breaks-r1.run.log`), B13 by hand (`f37d60b4`),
  client C1–C6 (`pr9-client-breaks.log`), `equip` E1–E6 (`combat-equip-breaks.log`).
  `npm run check` → `CHECK EXIT 0` on `e93e6ad7`: core 353 files / 2217 tests, protocol 1 / 31,
  client 314 / 2208, server 21 / 85, "Documentation check passed." (`pr9-check-3.log`).
- Next step: critic round 2 on `e93e6ad7` approved with 0 blockers
  (`eternalus-agent-work/dec-288/pr9-critic-r2.md`); apply its should-fix items and nits, then
  ponytail, re-check and the PR (base `feat/ranged-attacks` until #148 merges). Merge PR 2 (`feat/melee-sweeps`) when pushed. DEC row once the owner's
  HC-Q80..HC-Q84 and HC-B30 answers are final.
