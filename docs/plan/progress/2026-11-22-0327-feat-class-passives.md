---
title: 'Progress 2026-11-22: feat/class-passives'
description: 'Phase 4 / sprint 4.1, sholtzman + Claude Code: Wrecking Run momentum for the Sentinel (DEC-307), checks green.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/class-passives

Phase 4 / sprint 4.1 · feat/class-passives (from `feat/ranged-attacks` 05dceecf) · sholtzman + Claude Code

- What was done: "Class passives as content", first part (DEC-307, Wrecking Run first). The
  Sentinel's `movementProfile.momentum` (`components/Momentum`, owned by `Movement`): a turn
  slides and loses speed, a reverse slides to a stop, and `CollisionSystem` → `Movement.hitBlock`
  stops it on a head-on wall hit. Numbers are `TUNE` from balancing.md and owner cards PR8 W1/W2.
  10 §12 and the phase-4 status line updated; `grip` as a second rate beside §2's one
  acceleration clamp waits for the pre-PR critic. Every new test was broken on purpose and went red.
  Waiting on the owner: PR8 cards W1–W4, S1, S2, N1, P1 (Owner Calls v42).
- Checks run: `npm run check` → EXIT=0 (core 2200, protocol 31, client 2202, server 85 tests;
  `Documentation check passed.`). The first run failed `prettier --check` on 4 new or edited files;
  fixed with `prettier --write`.
- Next step: merge lane A's pushed `feat/ranged-attacks` when it lands, review by
  COMBAT-ABILITIES-LANE-2, then the pre-PR gate; the rest of PR 8 after the owner's answers.
