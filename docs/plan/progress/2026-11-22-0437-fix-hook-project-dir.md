---
title: 'Progress 2026-11-22: fix/hook-project-dir (hooks find the project root)'
description: 'Harness / process, sholtzman + Claude Code: the three hooks name their scripts from ${CLAUDE_PROJECT_DIR} and find their checkout with one projectRoot() helper, so they still run after a session changes folder (DEC-331).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: fix/hook-project-dir (hooks find the project root)

Harness / process · fix/hook-project-dir · sholtzman + Claude Code

- What was done: hook `args` paths start with `${CLAUDE_PROJECT_DIR}/`; `projectRoot()` gives
  each hook the git top level of its start folder (session folder; post-edit: the edited file's
  real folder) in this repository, else the scripts' checkout (DEC-331; ADR waiver pending,
  `INBOX.md` HC-B31). Critic rounds 1 to 3: all built except Linux and Windows runs (open).
- Checks run: `npm run check` → exit 0 (core 1683, protocol 29, client 2077, server 84 tests;
  "Documentation check passed."); `node --test scripts/hooks/*.test.mjs scripts/docs/*.test.mjs`
  → "ℹ pass 16", "ℹ fail 0"; each new test failed on a deliberate break first. Headless
  `claude -p --model haiku` after `cd docs`: PostToolUse exit 2 and Stop exit 2 on an `any`
  lint error, then Stop exit 0 (loop guard). macOS only; Linux and Windows not run.
- Next step: the PR into `phase/3-sprint-3-work` (sholtzman merges); owner call HC-B31.
