---
title: 'Progress 2026-11-22: feat/zealot-weapon-swap'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: combat PR 9, the Zealot swaps its talons and its bow on gadget-1 (DEC-303); 12 deliberate breaks red, full check passed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/zealot-weapon-swap

Phase 4 / sprint 4.2 · feat/zealot-weapon-swap · sholtzman + Claude Code (PR-38-HELPER-42 to -45)

- What was done: combat PR 9 (DEC-303) from PR #148 `9cb3a31e`. The Zealot carries the
  `obsidian-bow` beside its talons; the `weapon-swap` gadget on `gadget-1` swaps them. New:
  `Loadout` component, `SwapWeaponEffect`, `Combat.equip` (agreed with COMBAT-WEAPONS-ABILITIES-55),
  spec fields `secondaryWeaponId` and `artifacts`, two content rules extended, bots skip gadgets,
  `StateHasher` field only while the bow is in hand. The recommended option of the four open
  "PR9" owner cards is built; numbers are `TUNE`. Docs: 05 §18 and 04 §13 status notes.
- Checks run: 12 deliberate breaks (B1–B12, `eternalus-agent-work/dec-288/pr9-breaks.log`), each
  turned its tests red, all restored. `npm run check` → `EXIT 0` (core 351 files / 2205 tests,
  protocol 1 / 31, client 314 / 2202, server 21 / 85, "Documentation check passed.";
  `pr9-check-2.log`). The first run failed `prettier --check` on 3 files of this diff; formatted.
- Next step: pre-PR gate (critic, ponytail, re-check), then the coordinator pushes; merge PR 2
  (`feat/melee-sweeps`) when pushed; DEC row once the owner's "PR9" answers are FINAL.
