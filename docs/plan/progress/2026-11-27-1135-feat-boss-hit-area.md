---
title: 'Progress 2026-11-27: feat/boss-hit-area (DEC-421, the boss hits from its body)'
description: 'Phase 3 / sprint 3.6, sholtzman + Claude Code: the owner answered HC-B60 (A) and HC-B61 (B) as DEC-421; the Greater Boss now reaches and holds from its drawn body outline; two #160 scenario tests move their Legend.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/boss-hit-area (DEC-421, the boss hits from its body)

Phase 3 / sprint 3.6 · feat/boss-hit-area (on #160 `5ac24b4c`) · sholtzman + Claude Code

- What was done: the owner answered cards HC-B60 (A: a head shot by the line of flight, as built)
  and HC-B61 (B: the boss hits from its whole drawn body) on 2026-11-27, logged as DEC-421.
  `EntityStore.isInReach` measures a `CombatHitbox` unit's reach from its body outline (0 inside
  it); other units keep their circle. `PathingSystem.chase` holds a `CombatHitbox` unit once its
  target is in that reach, so it does not walk on to its feet. A `ponytail:` note marks the open
  case: the boss still reaches a building from its circle (guards only take units). Two #160
  scenario tests change their setup, not their assertions: the gem eruption's Legend stands 30 m
  from the gem, outside the boss's 25 m zone; the leash test's Warrior starts 24 m below the boss
  and its run-away gap is measured to the body's edge. Docs: the DEC-421 row, a pointer in the
  DEC-381 row, the `INBOX.md` DEC-381 item, the 05 status note. Each new test was red first
  (breaks B45 and B46, logged outside the repo). Critic R3 (`architecture-reviewer`, docs as at
  bf0dd875): PASS WITH SHOULD-FIX, no blockers. Fixes: `BodyShapeRule` flags an outline that does
  not hold the whole footprint circle (else the boss's chase could stop short of its reach; break
  B47), the lock test asserts its Legend is in the zone, TSDoc, a `ponytail:` note, and 18 §5.2
  names the boss's chase hold. Critic items B8 to B10 (not built) are in `INBOX.md` for sign-off.
  The critic re-check of the fixes: PASS. `/ponytail-review`: no cuts. Then #160's new head
  `5ac24b4c` (it brings phase/3 `e3521feb`, the Legend jump) is merged in. Its five conflicts keep
  both sides: the snapshot's `mapFeatureId` now comes from `MapFeatureLink` beside our
  `combatHitbox`, 03 and 04 list both, and the decisions log keeps the newest batch first.
- Checks run: core `npx vitest run` → "Tests 1981 passed (1981)". The full `npm run check` on the merge commit 5ff78d7c: EXIT 0.
- Next step: the push script to the coordinator; the PR opens into #160's branch.
