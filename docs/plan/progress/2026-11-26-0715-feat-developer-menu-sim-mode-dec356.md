---
title: 'Progress 2026-11-26: feat/developer-menu-sim-mode (DEC-356, bot pick)'
description: 'Phase 3 / sprint 3, sholtzman + Claude Code: PR #112 item (1), the optional bot pick of Remove human in sim mode (DEC-356).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/developer-menu-sim-mode (DEC-356, bot pick)

Phase 3 / sprint 3 · feat/developer-menu-sim-mode (PR #112) · sholtzman + Claude Code
(MEMORY-CLEANUP-15 and -16)

- What was done: the owner's answer to PR #112 item (1) (DEC-356), on top of `a5ba777d`.
  `dev-set-controller.controllerId` is `string | null` (public `Command` change): a bot id gives
  that bot (`createPickedBotChooser`, a registry by controller id), `null` the bot its team lacks.
  The client has a Bot select before Remove human. Docs: DEC-356 row, 03, 11 §7 and §10, 13 §10,
  mechanics-ideas §6, `INBOX.md` slice 3 (two readings for the owner in (i)). Critic: approve, its
  should-fix items applied. 22 deliberate breaks prove the new tests. Details: the PR #112 comment.
- Checks run: `npm run check` EXIT=0 (core 1872, protocol 31, client 2197, server
  163 tests passed; "Documentation check passed.").
- Next step: push through the coordinator; the owner confirms the readings in `INBOX.md` (i).
