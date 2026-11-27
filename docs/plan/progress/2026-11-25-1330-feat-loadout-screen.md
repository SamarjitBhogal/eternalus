---
title: 'Progress 2026-11-25: feat/loadout-screen'
description: 'Phase 3, claudiodh + Claude Code: PR #141 unblock, memory storage until the final layout.'
audience: [humans, agents]
status: active
owner: claudiodh
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/loadout-screen

Phase 3 / sprint 3 work · feat/loadout-screen · claudiodh + Claude Code

- What was done: the owner's review blocked PR #141 on one item (B1): disk saves were on while
  the settings layout (one record per player) and the loadout key (per class) are not final.
  `main.tsx` now builds the `PersistenceController` on `MemoryStorageAdapter`, so nothing is
  written to players' browsers. The player text is "Weapon: <name>" again, in place of
  "Recommendation: <name>".
- Checks run: `npm run check` EXIT=0 on Node 24 (docs check passed).
- Next step: a follow-up PR changes the settings layout (per group) and keys loadouts by Legend
  (DEC-354), then turns `IndexedDbStorageAdapter.inBrowser()` on.
