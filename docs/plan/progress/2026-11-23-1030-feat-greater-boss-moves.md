---
title: 'Progress 2026-11-23: feat/greater-boss-moves (review fixes for #164)'
description: 'Phase 3 / sprint 3.6, Aryan Walanj + Claude Code: fixed B2, S2 to S6 and one nit of the review of PR #164; B1 and S1 wait on the owner and on #123.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/greater-boss-moves (review fixes for #164)

Phase 3 / sprint 3.6 · feat/greater-boss-moves · Aryan Walanj + Claude Code

- What was done (review of `90350651`):
  - B2: `BossController`'s TSDoc names the rotation as Aryan's request (INBOX), not an owner brief.
  - S2: a `StateHasher` test for a waiting boss move (fails with the hash line removed).
  - S3: the Greater Boss has no movement strategy, so `PathingSystem` loses its
    `controllerId !== 'guard'` exemption (no branch on a kind name).
  - S4: a test that a unit dead earlier in the tick is neither hit nor pushed by a sweep (fails
    without the `isAlive` filter; the damage pipeline already refuses dead targets, so the push is
    what the filter guards).
  - S5: the beam is cut at the zone edge with the charge's cut, now `reachInZone` in
    `unitsAlong.ts`; test fails without it.
  - S6: `SCORING.bossIds` (corner, capture point and Greater Boss) and `ScoredDeath.definitionId`;
    `MobDeathRule` scores nothing for them (DEC-79); tests fail without it. Doc 12 §5 says so.
  - Nit: doc 10's implementation status names the charge as a `pushBy` user.
  - Not done: B1 (owner: #164 or #161 owns the boss), S1 (agree the push API with #123's author),
    the `TeamKillReward` kind nit and `EntityStore.ts` at 308 lines.
- Checks run: `npm run check:quick` exit 0. `npm run check` exit 1, one timeout only: core "Test
  Files 1 failed | 290 passed (291)", "Tests 1 failed | 1794 passed (1795)"
  (`Simulation.modifiers.test.ts`, "Test timed out in 60000ms"); protocol "Tests 29 passed (29)",
  client "Tests 2098 passed (2098)", server "Tests 114 passed (114)". The timed-out file alone:
  "Tests 3 passed (3)" in 18 s.
- Next step: CI on the push; the owner's answer on B1; S1 with #123's author; a code owner's review.
