---
title: 'Progress 2026-11-22: feat/class-passives (pre-PR gate round 1 fixes)'
description: 'Phase 4 / sprint 4.1, sholtzman + Claude Code: Wrecking Run momentum builds along a wall, turns past 90° have no jump, the bot test uses the real decision cadence, HC-B29.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/class-passives (pre-PR gate round 1 fixes)

Phase 4 / sprint 4.1 · feat/class-passives (from `feat/ranged-attacks` 9cb3a31e) · sholtzman + Claude Code

- What was done: the fixes from pre-PR gate round 1 (architecture critic, correctness critic,
  ponytail).
  - Wall guidance: a Sentinel that steers into a wall it touches now builds along the wall, up to
    top speed × the cosine of its angle to the wall, and keeps a small push into the wall. Before,
    it lost speed: 0.14 m/s after 2.5 s at 45°, and 9 m/s fell to 7.83 m/s at 5°. Now it reaches
    3.69 m/s after 2 s at 30° and 45°, and holds 9·cos 5° = 8.97 m/s. When it turns further into
    the wall, the extra speed slides off at `grip` (no jump). Head-on still stops it dead.
  - `BLOCK_EPSILON` (`components/Momentum.constants`, 100 × `CONTACT_EPSILON`): a smaller loss is
    the resolver's back-off, not a wall.
  - Turns past 90°: the backward part brakes at `grip` while the sideways part slides, so 89°, 90°
    and 91° come out alike (91° was 0.60 m/s, the same as 180°). 45°, 90° and 180° are unchanged.
  - `ai/BotMovement.test.ts` decides at the bot Legend cadence (every 6 ticks), applies each
    command on the next tick, and runs all 6 offsets. The slowest settles in 6.4 s (limit 7 s).
  - The `CollisionSystem` glancing test is replaced by a build-up test along the house wall.
    `CollisionSystem` gets a `ponytail:` note on the summed loss.
  - Ponytail cut in `PositiveStatsRule`; throw guards in two tests; the `loadDefaultContent` TSDoc;
    the `sentinel.ts` comments (the owner cards are pending; DEC-305 covers distances, not speeds).
  - 10 §12 note rewritten (three stages, wall guidance, statuses cut speed at once, the summed-loss
    limit, HC-B29); `components/Momentum*` added to 10's `paths`. `INBOX.md` HC-B29 asks for
    sign-off on BTD-1, BTD-2 and BTD-4.
  - Breaks B17 to B24 all went red (work folder `breaks.log`).
- Checks run: `npm run check` → EXIT=0 (core 2221, protocol 31, client 2202, server 85 tests;
  `Documentation check passed.`).
- Next step: commit, pre-PR gate round 2 (correctness and architecture critics on the delta),
  then the push script to the coordinator.
