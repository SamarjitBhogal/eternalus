---
title: 'Progress 2026-11-22: docs legend-respawned listeners'
description: 'Phase 3 / sprint 3, claudiodh + Claude Code: doc 03 legend-respawned listeners cell matches the removal of respawnedThisTick.'
audience: [humans, agents]
status: active
owner: claudiodh
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: docs legend-respawned listeners

Phase 3 / sprint 3 · fix/legend-respawn · claudiodh + Claude Code

- What was done: doc 03 `legend-respawned` row now lists `ProgressionSystem` (buffers the owed XP, pays it on the next tick, DEC-186) and the `level-matches-xp` invariant (checks the recipient is back in the store) as listeners. `GameState.respawnedThisTick` no longer exists.
- Checks run: see the final `npm run check` result in the PR.
- Next step: reviewer re-review.
