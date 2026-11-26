---
title: 'Progress 2026-11-25: feat/developer-menu-sim-mode'
description: 'Phase 3, claudiodh + Claude Code: PR #112 merge with phase/3 and the Follow picker.'
audience: [humans, agents]
status: active
owner: claudiodh
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/developer-menu-sim-mode

Phase 3 / sprint 3 work · feat/developer-menu-sim-mode · claudiodh + Claude Code

- What was done: merged `phase/3-sprint-3-work` (5 conflicts: `Match.ts`, the capture test, three
  docs). The Follow row of Sim mode is now a select of the live Legends ("None" ends it), in place
  of a typed Legend id. `13-game-interface.md` §10 says so. The bot role on release (DEC-356 (2))
  was already in `ec0ed3e3`.
- Checks run: `npm run check`, result in the PR description.
- Next step: DEC-356 row after Sam answers item (1) of the owner's note.
