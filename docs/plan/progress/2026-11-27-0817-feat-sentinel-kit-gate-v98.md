---
title: 'Progress 2026-11-27: feat/sentinel-kit (lane B PR 6, gate v98 architecture fixes)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: the architecture critic of gate v98 approved; its two violations, one better-than-design item and four nits fixed; five follow-ups go to the owner as HC-B62.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/sentinel-kit (lane B PR 6, gate v98 architecture fixes)

Phase 4 / sprint 4.2 · feat/sentinel-kit (stacked on #162, base `2b1a9509`) · sholtzman + Claude Code (COMBAT-ABILITIES-LANE-2-31, -32)

- What was done: the gate on the owner answers (v98) ran three reviewers on `2b2b07b6..8c23f20b`. The correctness fixes are in `8c23f20b`. The architecture critic approved (0 blocker, 0 major). This commit fixes its findings; the reports are in `eternalus-agent-work/abilities/pr6-sentinel/gate-v98/`.
  - V1: the owner's answers R4 and R6 are cited as DEC-382 (R4 A) and (R6 A) at their values, test titles and 05 §18; the DEC-382 row names `shieldWall.ts` and `shieldWallBarrier.ts`.
  - V2: `state/placeWithRoom.test.ts`, a sibling test with a fake `CollisionQuery`.
  - B1 (built under DEC-223, DEC-232; sign-off in HC-B62): `StatusEffects.multiplierWith` gives a stat with one more instance of a status by the one fold, and `BuffEffect` uses it. `BuffEffect.growthOf`, a copy of the fold, is gone. The copy gave a wrong size when two statuses both add to the size (no shipped status does).
  - B4: the TSDoc of `impactDamage` says it also sets the damage of a unit a new Shield Wall pins.
  - N3: `loadKnockback` checks `impactDamage` with `assertNonNegativeFinite`, which now prints the unit `hp`.
  - N4: 02 §2 lists `Summoned`, `placeWithRoom` and `summonPlacement.ts`.
  - N5: the DEC-382 row marks the 40 as the build default under "balanced; tuneable", and the "Not enough space" prompt while the reason holds as a build reading.
  - Owner items: `INBOX.md` HC-B62 now holds five follow-ups (one damage-credit helper; the aim outline copy, with N2; no push damage for a minion still walking out of its building, B2; one `FakeCollisionQuery`, B3; options objects, N1) and asks sign-off for the two tidies built.
- Checks run: each new test failed first on a deliberate break (`owner-v98/breaklog-C.md`, R1 to R3, B1, M1 to M3, G1). Before the commit: core `npx tsc --noEmit` exit 0; Prettier and eslint on the changed files pass; the touched core test files pass. The full `npm run check` runs after this commit; the PR description records its result.
- Next step: a correctness critic (round 2) on `dc757e4c..` this commit, the full `npm run check`, then the #175 push script through the coordinator. After CI is green: fold #175 into #162 and #150.
