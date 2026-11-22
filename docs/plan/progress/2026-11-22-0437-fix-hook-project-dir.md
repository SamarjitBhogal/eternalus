---
title: 'Progress 2026-11-22: fix/hook-project-dir (hooks find the project root)'
description: 'Harness fix, Claude Code: the three hooks name their scripts from ${CLAUDE_PROJECT_DIR} and act on the git top level of the session folder, so they still run after a session changes folder (DEC-331).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: fix/hook-project-dir (hooks find the project root)

Harness / process · fix/hook-project-dir · Claude Code

- What: the hooks named `scripts/hooks/*.mjs` by a relative path, and Claude Code runs a hook in
  the session's folder, so after a `cd` into a subfolder `node` exited 1 and no check ran. Each
  `args` path now starts with `${CLAUDE_PROJECT_DIR}/`. One helper, `projectRoot()`, gives all
  three hooks the git top level of the session's folder, or the scripts' checkout when that
  folder is outside this repository (DEC-331; ADR waiver pending, `INBOX.md` HC-B31).
- Checks: each new test in `settings.test.mjs` and `hookInput.test.mjs` failed on a deliberate
  break, then passed. Headless `claude -p --model haiku` after `cd docs`: old settings → Stop
  exit 1 "Cannot find module"; this branch → PostToolUse exit 2 and Stop exit 2 on an `any` lint
  error, then Stop exit 0 (loop guard). macOS only; Linux and Windows not run.
  `npm run check` and the script tests: see the PR description.
- Next: the pre-PR gate, then the PR into `phase/3-sprint-3-work`.
