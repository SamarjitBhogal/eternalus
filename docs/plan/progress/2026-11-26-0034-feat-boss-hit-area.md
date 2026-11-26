---
title: 'Progress 2026-11-26: feat/boss-hit-area'
description: "Phase 3 / sprint 3.6, sholtzman + Claude Code: the Greater Boss's body-shape hit area moved from #161, and the back-hit and head-shot bonuses (DEC-381) as build defaults."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/boss-hit-area

Phase 3 / sprint 3.6 · feat/boss-hit-area (on #160 `ffc49e96`) · sholtzman + Claude Code

- What was done: a8c599fa moves #161's body outline to the Greater Boss (DEC-370): `CombatHitbox`,
  `UnitDefinition.combatHitbox`, `EntitySnapshot.combatHitbox`, `findUnitAt` and
  `EntityStore.outlineOf` (DEC-381, the exception to DEC-183 (2)). e8aebd1c adds
  `BodyPartBonusStep`: x1.15 from the rear half, x1.25 for a projectile on the `headHitbox`, the
  larger only (`BODY_PART_BONUS`, TUNE build defaults); `DamageHit.impactPoint` carries the
  point. No projectile deals damage yet. Docs 04 §3, 05 §9 and 06 updated. Each new test was red
  first (19 breaks, logged outside the repo). The owner card for the five tuning choices is
  drafted, not posted.
- Checks run: `npx vitest run --root packages/core --maxWorkers=4` → "Tests 1871 passed (1871)";
  `npx vitest run --root apps/client --maxWorkers=4` → "Tests 2200 passed (2200)"; `npx tsc -b`
  and the pre-commit `npm run check:quick` passed; eslint and `prettier --check` on the changed
  files passed; `npm run docs:check` → "Documentation check passed."
- Next step: the lane session writes the DEC-381 row and posts the card; PR into
  `feat/cathedral-eruption-boss` after the critic and ponytail gate.
