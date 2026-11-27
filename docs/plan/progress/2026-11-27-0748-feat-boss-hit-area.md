---
title: 'Progress 2026-11-27: feat/boss-hit-area (hit path and head shots)'
description: "Phase 3 / sprint 3.6, sholtzman + Claude Code: DEC-381's 120-degree zone behind, the owner's answers (6) and (7), and each hit's path, so a shot's line of flight finds a head shot (HC-B60 A default)."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/boss-hit-area (hit path and head shots)

Phase 3 / sprint 3.6 · feat/boss-hit-area (on #160 `6858c960`) · sholtzman + Claude Code

- What was done: 6e983cc7 and 7c48a6f2 put "behind" on the side the art shows the boss's back
  and record DEC-381. 8d85f95b narrows the zone behind to 120 degrees (DEC-381 (2) B). This
  change records the owner's answers (6) A and (7) A in the DEC-381 row and builds the default of
  card HC-B60 (A): `DamagePipeline.apply` and `DamageHit` carry an optional `HitPath` (`origin`,
  `impactPoint`). Melee passes its attacker's position; status ticks, the eruption and the map
  collapse pass none, so they get no bonus. `CombatHitbox.isHeadShot` counts a shot whose impact
  point is on the head, or whose line of flight crosses the head (`geometry.doesRayCrossPolygon`).
  The unit definition has one `bodyShape` (`outline`, `head`); `CombatHitbox` checks it on
  construction, with `geometry.isPolygon`, which `ZoneArea` now shares. `findUnitAt` reads the
  radius only for a unit without an outline. Docs 03 §5, 04 §3, 05 §9, the DEC-381 row and
  `INBOX.md` updated. Each new or changed test was red first (breaks B29 to B38, logged outside
  the repo).
- Checks run: `npx vitest run` on the changed areas of `packages/core` (combat, components,
  utils/geometry, entities, content/mobs, state) → "Tests 511 passed (511)"; `npx tsc -b` passed;
  eslint and `prettier --check` on the changed files passed; `npm run docs:check` →
  "Documentation check passed."
- Next step: full `npm run check`, the critic and ponytail gate, merge #160's next head, then the
  push script and PR body to the coordinator. PR into `feat/cathedral-eruption-boss`.
