---
title: 'Progress 2026-11-22: fix/legend-respawn'
description: 'Phase 3 / sprint 3, claudiodh + Claude Code: PR #100 review items, merge of phase/3, buffered respawn XP, shared Legend reset.'
audience: [humans, agents]
status: active
owner: claudiodh
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: fix/legend-respawn

Phase 3 / sprint 3 · fix/legend-respawn · claudiodh + Claude Code

- What was done: merged phase/3-sprint-3-work (INBOX, doc 03, decisions log: both sides kept). Owed respawn XP is buffered by the `legend-respawned` listener and paid in `ProgressionSystem`'s pass on the next tick (doc 03 section 4); `level-matches-xp` now checks the recipient is back in the store, so `GameState.respawnedThisTick` is gone. New `LegendReset` is shared by `RespawnSystem` and `DuelRoundSystem`. Docs: 03 (insertion order, `RespawnSystem` adds entities), 05 (only the ultimate survives death, FR-117), 08 (`LegendBodies`), INBOX (DEC-186 built). The two 2026-11-20 PROGRESS.md entries moved to the bottom.
- Checks run: see the final `npm run check` result in the PR.
- Next step: critic and ponytail gate, then reviewer re-review.
