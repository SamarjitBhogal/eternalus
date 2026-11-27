---
title: 'Progress 2026-11-26: feat/start-weapons, a start weapon for each Legend (lane A PR 3, DEC-374)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: spec start weapons (primaryWeaponId, primaryWeaponIdOf, KnownSpecWeaponRule), long-sword, great-sword and dual-blades, talon bleed, the sundered bow debuff; the Bastions wait for a weapon class.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/start-weapons, a start weapon for each Legend (lane A PR 3, DEC-374)

Phase 4 / sprint 4.2 · feat/start-weapons · sholtzman + Claude Code (PR 3 builder, COMBAT-WEAPONS-ABILITIES-66)

- What was done: the owner answers PR3 W1 to W6 (DEC-374). New weapons `long-sword` (60 / 0.9 s,
  arc 120°), `great-sword` (85 / 1.2 s, arc 140°) and `dual-blades` (30 / 0.45 s, arc 100°). Raptor
  Talons add one `bleed` stack per hit. The Obsidian Bow adds one stack of the new `sundered`
  status per hit (+5 % damage taken per stack, 4 s, 3 stacks). The start weapon is now per spec:
  `LegendSpecDefinition.primaryWeaponId`, `primaryWeaponIdOf`, `KnownSpecWeaponRule`; the Templar
  has the dual blades, the Paladin the great sword, the Zealot the talons, the Bulwark Wuuthrad,
  the Magus specs the staff.
- Not built: W3, the Bastions. Reference 07 names no weapon class for them, so the Colossus keeps
  its class weapon. The question is in DEC-374 (7).
- Checks: see the commit messages and the PR report for the verbatim `npm run check` result.
  Deliberate breaks: `eternalus-agent-work/abilities/pr3-weapons/breaks.log` (12 breaks, all red).
- Next step: the owner names the Bastions' weapon class; the pre-PR gate (critic, ponytail).
