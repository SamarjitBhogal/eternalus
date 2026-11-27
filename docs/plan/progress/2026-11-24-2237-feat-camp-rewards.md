---
title: 'Progress 2026-11-24: feat/camp-rewards (PR #153 review fixes)'
description: 'Phase 3 / minion plan gap (camp rewards), sholtzman + Claude Code: a Legend waiting to respawn is now owed the camp bonus end to end; a renamed camp id in XP_SOURCES.campCleared now fails a test (ADR 0023).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-24
tags: [plan, progress, log]
---

# Progress 2026-11-24: feat/camp-rewards (PR #153 review fixes)

Phase 3 / minion plan gap: camp rewards · feat/camp-rewards · sholtzman + Claude Code

- What was done: review fixes on `04a53660`. `GroupGuardRespawn` names a killer that waits to
  respawn (DEC-295), with its team from `state.respawns`, so `camp-cleared` reaches
  `ProgressionSystem` and the bonus is owed as doc 05 §18 says; before, only a hand-made event
  reached that path. New end-to-end test; it failed before the fix. `xpSources.test.ts` checks
  that every `campCleared` key names a `camp` structure, and the camp test no longer reads a
  missing entry as 0 (ADR 0023: a missed id must fail the checks). Owner call still open:
  `INBOX.md` "Camp rewards".
- Checks run: `npm run check` (Node 24.21.0) exit 0: core 1764 tests, protocol 29, client 2118,
  server 114, "Documentation check passed."
- Next step: the owner answers `INBOX.md` "Camp rewards" (and B1 to B3); then a DEC row.
