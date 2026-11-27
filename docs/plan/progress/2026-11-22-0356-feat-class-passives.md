---
title: 'Progress 2026-11-22: feat/class-passives (lane B review fixes)'
description: 'Phase 4 / sprint 4.1, sholtzman + Claude Code: lane B review fixes F2, F4, F5 and F7 for Wrecking Run momentum.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/class-passives (lane B review fixes)

Phase 4 / sprint 4.1 · feat/class-passives (from `feat/ranged-attacks` 05dceecf) · sholtzman + Claude Code

- What was done: the fixes from the COMBAT-ABILITIES-LANE-2 review of Wrecking Run momentum.
  F7: `components/Momentum` takes its lengths with `sqrt` from `utils/deterministicMath`, not
  `Math.hypot` (10 §10). F5: the new content rule `MomentumWalkSpeedRule` rejects a
  `momentum.walkSpeed` at or above `maxSpeed` when content loads. F4: `ai/BotMovement.test.ts`
  runs a bot Sentinel at top speed toward a point 30 m ahead: it slides 3.1 m past, turns back
  once and stops 1.6 m from the point after 5.4 s, so the bot arrival check needs no braking
  distance. F2 and F1: the 10 §12 note cites §2 step 3 friction for `grip` and names the
  difference from 05 §7 (passives as permanent `buff` statuses); `sentinel.ts` links
  `wrecking-run` to `movementProfile.momentum`. Every new test was broken on purpose and went red.
  Waiting on the owner: the PR8 cards and a new card on what a stun or slow does to a running
  Sentinel (lane B F3); F1 goes to the pre-PR critic as a better-than-design candidate.
- Checks run: `npm run check` → EXIT=0 (core 2204, protocol 31, client 2202, server 85 tests;
  `Documentation check passed.`).
- Next step: merge lane A's pushed `feat/ranged-attacks` when the coordinator confirms its head,
  then the pre-PR gate.
