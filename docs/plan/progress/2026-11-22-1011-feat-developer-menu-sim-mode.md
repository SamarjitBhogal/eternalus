---
title: 'Progress 2026-11-22: feat/developer-menu-sim-mode (PR #112 review round 2)'
description: 'Phase 3 / sprint 3, claudiodh + Claude Code: parent merged, brain deletion moved into AiSystem, INBOX item names its base docs, checks run.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/developer-menu-sim-mode (PR #112 review round 2)

Phase 3 / sprint 3 · feat/developer-menu-sim-mode · claudiodh + Claude Code

- What was done: merged `feat/developer-menu-legends` (conflicts in PROGRESS, the decisions log and the `MatchRecord` constructor TSDoc, both sides kept). `AiSystem` now drops a brain whose entity is gone, unbound or bound to another controller or profile; `DevSetControllerHandler` only changes bindings and seats. INBOX BUG-4 item: controller id `player`, base docs named for (a), (c), (d), (f). Owner confirmation of those items stays open.
- Checks run: `npm run check` on Node 24.21.0 → exit 0: core 1724, protocol 29, client 2118, server 84 tests passed; "Documentation check passed."
- Next step: push; owner answers the INBOX item.
