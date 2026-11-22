---
title: 'Progress 2026-11-22: fix/hook-project-dir (hook scripts named from the project root)'
description: 'Harness fix, Claude Code: the three Claude Code hooks name their scripts from ${CLAUDE_PROJECT_DIR}, so they still load after a session changes to a subfolder (DEC-331).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: fix/hook-project-dir (hook scripts named from the project root)

Harness / process · fix/hook-project-dir · Claude Code

- What was done: the `Stop` hook failed with `Cannot find module
'…/eternalus-agent-work/pr-review-coordination/scripts/hooks/stop-check.mjs'` in sessions that
  had run `cd` into a subfolder. Claude Code runs a hook in the session's current folder, and
  `.claude/settings.json` gave `node` a relative path. Each hook's `args` path now starts with
  `${CLAUDE_PROJECT_DIR}/` (DEC-331). New `scripts/hooks/settings.test.mjs` checks the prefix and
  that each script exists. The comment on `repoRoot()` in `scripts/hooks/hookInput.mjs` said
  hooks run from the project directory; it now says what is true. `docs/agents/tool-setup.md`
  and `docs/architecture/16-agentic-harness.md` §4 say why the prefix is there.
- Checks run: `node --test scripts/hooks/settings.test.mjs` failed before the settings change
  ("scripts/hooks/session-start.mjs must start with ${CLAUDE_PROJECT_DIR}/") and passed after it.
  End to end, two headless `claude -p --model haiku` runs that ran `cd docs && pwd` and then
  stopped: on the main checkout (old settings) the `Stop` hook exited 1 with `Cannot find module
'…/eternalus/docs/scripts/hooks/stop-check.mjs'`; on this branch it exited 0 with
  "[stop-check] checks on 2 changed file(s) passed." `npm run check` → exit 0 (core 1683 tests, protocol 29, client 2077, server 84, "Documentation check passed."); `node --test scripts/hooks/*.test.mjs scripts/docs/*.test.mjs` → 11/11 pass.
- Next step: the pre-PR gate (critic, ponytail, re-check), then the PR into
  `phase/3-sprint-3-work`. Sessions pick up the new hooks when they start after the merge reaches
  their checkout. Open follow-up: from a subfolder, `post-edit.mjs` still skips files outside
  that folder, because `repoRoot()` returns the session's current folder.
