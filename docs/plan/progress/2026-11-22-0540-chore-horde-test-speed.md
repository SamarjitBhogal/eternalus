---
title: 'Progress 2026-11-22: chore/horde-test-speed (DEC-289 step 1, A* keeps its estimate; HC-B32)'
description: 'Phase 3, sholtzman + Claude Code: the A* queue keeps each cell estimate and CellHeap owns the tie rule (HC-B32); horde test about 1.4x faster under coverage with identical state hashes and flow fields; HORDE_WALK_TIMEOUT_MS waits for PR #84.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: chore/horde-test-speed (DEC-289 step 1, A* keeps its estimate; HC-B32)

Phase 3 / map work · chore/horde-test-speed (from PR #152 `b3890ca2`) · sholtzman + Claude Code
(MEMORY-CLEANUP-6, then MEMORY-CLEANUP-7)

- What was done: (1) A\* gives each queued cell its cost plus heuristic once, when it reaches
  the cell, so a queue compare no longer computes the heuristic again. (2) HC-B32 (critic round
  1, better than the design, built under the standing rule DEC-223, sign-off asked in INBOX):
  `CellHeap.push(cell, key)` keeps each queued cell's key and owns the 11 §5 tie rule (lower key,
  then lower cell index); `AStarPathfinder` and `FlowFieldBuilder` no longer have their own
  `isBefore`. The heap keeps its own keys because `FlowFieldBuilder` swaps its cost buffer into
  the field after each fill.
- Same behaviour: 7 state hashes and the A\* expansion counts per seed (1, 2, 10) do not change
  (`eternalus-agent-work/horde-test-speed/hash-before.txt` = `hash-l1.txt` = `hash-l3.txt`, the last on the final tree). All
  lane flow fields on 6 maps (3 and 5 lanes, seeds 1, 2, 10), after the first build and after two
  sliced rebuilds, do not change (`flow-before.txt` = `flow-after-2.txt`, on the final tree).
- Tests: A\* "ranks a queued cell by its newest cost" (red at 496, not 488, when the heap keeps
  a cell's first key); `CellHeap` test now proves the index tie rule (red without it) and the
  key update on a repeat push (red without it).
- Speed, horde test, local Mac, with coverage, per seed: 12.2-12.6 s at `b3890ca2`; 9.0-9.4 s
  with (1) only; 8.6-9.0 s with (1) and (2) (`timing-l2.txt`). CI at `b3890ca2` (run
  45012252643): windows 24.6-28.1 s, ubuntu 45.3-53.7 s.
- Checks run: `npm run check` on the final tree → EXIT=0: core "Tests 1838 passed (1838)",
  protocol "Tests 29 passed (29)", client "Tests 2105 passed (2105)", server "Tests 84 passed
  (84)", "Documentation check passed." (`eternalus-agent-work/horde-test-speed/check-2.log`).
  Critic round 2: pass with notes, no blocker; S1 and nits N1-N3 applied. Ponytail: no cuts.
- Next step: remove `HORDE_WALK_TIMEOUT_MS` after PR #84 (bot A\* waypoint cache, Samarjit)
  reaches PR #152's line; with both, 5.0-5.1 s locally (measured with (1) only). Owner: the
  coordinator assigns it. The Duel kill-target part of DEC-289/DEC-325 is not started.
