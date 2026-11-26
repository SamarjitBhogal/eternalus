---
title: 'Progress 2026-11-26: feat/shots-over-lava HC-Q105 (camp fires) and its rework (DEC-373)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: shots fly over camp fires and light arrows (19ca92ee); critic REWORK fixed: one shot property for bodies (canShotsFlyOver), the forest camp home follows it from content; HC-Q115 and HC-Q116 asked.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/shots-over-lava HC-Q105 (camp fires) and its rework (DEC-373)

Phase 4 / sprint 4.2 · feat/shots-over-lava · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-66, -67)

- What was done: `19ca92ee` set `canShotsCross` and `canLightShots` on each camp fire (DEC-373 (2)).
  Critic REWORK (`eternalus-agent-work/abilities/hc-q89/critic-hc-q105-19ca92ee-report.md`): the
  fire's body and the forest camp's home still stopped shots. Built: `Outline.canShotsFlyOver`
  (C-1, C-8), `Collider.canShotsFlyOver` from `StructureDefinition.canShotsFlyOver` on the forest
  camps (C-2), read by `AreaHitQuery.stopsShot` and `aimedBodyOf`; new full-map test
  `Simulation.campFires.test.ts`; the hearth test line (C-7); TSDoc (C-6); the flag text in
  architecture 05 §10 and 10 §7 (C-3); dated notes in 05 §10, 06, 07 §13 and 10; DEC-373 correction;
  `INBOX.md` HC-Q115, HC-Q116. Critic round 2 (PASS, Q105-R2-1 to -8) fixed: the full-map test
  loops over all 16 camp fires; `ShotStopBody.collider` is read once, so `stopsShot` does no
  `findComponent` per shot; TSDoc, wrapped lines and notes (05 and 06 point to 10).
  Fail-first: 12 tests red before the fix, 11 deliberate breaks red (`hc-q89/breaks.log`).
- Checks run: full `npm run check` on `2b1151f2` plus the docs of this entry (before this line
  was written): `CHECK_EXIT=0` (`logs/check-2b1151f2-docs-tree.log`: core 373 files / 2519 tests,
  protocol 1/31, client 315/2214, server 21/85, documentation check passed). No golden replay
  hash changed. Table cell check and `prettier --check` clean on every edited Markdown file.
- Next step: CWA-67 runs the critic on the rework; the owner answers HC-Q115 and HC-Q116 on
  Owner Calls v100. C-5 (hearths) and C-9 (a flag preset) are not built.
