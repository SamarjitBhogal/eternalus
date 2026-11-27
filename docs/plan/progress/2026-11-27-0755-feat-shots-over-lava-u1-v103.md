---
title: 'Progress 2026-11-27: feat/shots-over-lava, fold unit U1 rework (DEC-407 to DEC-409)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: the Bastions become a shield weapon and the Colossus starts with them (DEC-407); DEC-408 and DEC-409 are rows only.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/shots-over-lava, fold unit U1 rework (DEC-407 to DEC-409)

Phase 4 / sprint 4.2 · feat/shots-over-lava · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-76, -78)

- What was done: the owner's Owner Calls v103 answers on this branch. DEC-407 (HC-Q118 A): the
  weapon class `shield` and `content/weapons/bastions.ts` (the DEC-387 (W3) sweep, Sentinel only,
  dual-wielded with one arc per swing); the Colossus spec names the Bastions, so the interim "no
  weapon" is gone. DEC-408 (HC-Q122 B) and DEC-409 (HC-Q115 A, HC-Q116 note) are rows only:
  nothing changes on this branch. Decisions-log batch DEC-407 to DEC-409, four `INBOX.md` ticks,
  05 §10 (sketch, table row, PR 3 status note), glossary "Weapon class". Tests: the weapon
  catalogue lists the Bastions with their sweep and interval, the Colossus starts with them, and
  they are Sentinel only. Break: the Colossus spec back to `primaryWeaponId: null` turned the
  start-weapon test red (90 for 120); restored (`eternalus-agent-work/abilities/fold-plan/u1/breaks.log`).
  Gate: architecture-reviewer on the rework against 2b0445cb: PASS, no blockers; 4 SHOULD applied
  (the 05 §17 status table; dated answer sentences in the status notes of 05, 06 and 07; DEC
  citations at the forest camps, the kitchen hearth and `WorldObjectStore.removed`; the check lines
  below) and 2 NITs (DEC-408 and DEC-409 (2) readings marked, the DEC-408 merge clause on
  `structureBodiesOf`); NIT 7 rejected (no reference 07 edit: the decisions log outranks it).
  Ponytail: no cuts; two optional comment trims rejected (citations at the value). Critic round 2 on the fixes: PASS; 4 NITs applied, the "knockback" spelling NIT rejected (05 and the log use "knock-back").
- Checks run: `npm run check` (gated, on this tree without this line): core `Test Files  382 passed (382)`, `Tests  2581 passed (2581)`; protocol `Test Files  1 passed (1)`, `Tests  31 passed (31)`; client `Test Files  315 passed (315)`, `Tests  2218 passed (2218)`; server `Test Files  21 passed (21)`, `Tests  85 passed (85)`; `Documentation check passed.`; `CHECK_EXIT=0`.
- Next step: push feat/shots-over-lava as a fast-forward (coordinator script), then hand the head
  to PLAYER-STACK-FOLD-2 for U2 (#168 and wall-turrets).
