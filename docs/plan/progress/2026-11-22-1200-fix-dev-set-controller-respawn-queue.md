---
title: 'Progress 2026-11-22: feat/developer-menu-sim-mode (PR #112, merge of PR #100)'
description: 'Phase 3 / sprint 3, claudiodh + Claude Code: PR #100 merged into the #112 branch, and dev-set-controller treats a human Legend in the respawn queue as alive.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/developer-menu-sim-mode (PR #112, merge of PR #100)

Phase 3 / sprint 3 · feat/developer-menu-sim-mode · claudiodh + Claude Code

- What was done: the gate review found a latent bug. `DevSetControllerHandler` treated a human Legend outside `state.entities` as dead and cleared its seat. With PR #100 a waiting Legend lives in `state.respawns`, so the Legend would return with no seat. `origin/fix/legend-respawn` is merged into this branch (conflicts: `MatchWorld`, `Simulation`, `Match`, architecture 03, the decisions log and `PROGRESS.md`; both sides kept, the `legendRefusal` stand-in stays removed because `LegendSpawner` replaced it). The handler now keeps the seat of a Legend that waits in the respawn queue, and gives it to the Rover on a seat move. One new test.
- Checks run: see the PR comment for the final `npm run check` result.
- Next step: merge order is now PR #100 first, then this stack.
