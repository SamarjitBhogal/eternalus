---
title: 'Progress 2026-11-22: feat/developer-menu-legends (PR #109 review round 2)'
description: 'Phase 3 / sprint 3, claudiodh + Claude Code: parent merged, Legend commands added to the 03 union, remove-legend replay test, checks run.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/developer-menu-legends (PR #109 review round 2)

Phase 3 / sprint 3 · feat/developer-menu-legends · claudiodh + Claude Code

- What was done: merged `feat/developer-menu` (conflicts in PROGRESS, the decisions log and the `last-reviewed` line of 03, both sides kept). Review N3: `dev-spawn-legend` and `dev-remove-legend` are in the 03 `Command` union and the stale status sentence is gone. N4: the sim-mode clause in `Command.types.ts` reads outside sim mode, not the reverse. N5: a replay test sends `dev-spawn-legend` then `dev-remove-legend` twice and compares hashes. INBOX (c) to (g) stay open for the owner. FR-097 stays partial (INBOX (c), (f)).
- Checks run: `npm run check` on Node 24.21.0 → exit 0: core 1702, protocol 29, client 2114, server 84 tests passed; "Documentation check passed."
- Next step: push, then the stack merge into #112.
