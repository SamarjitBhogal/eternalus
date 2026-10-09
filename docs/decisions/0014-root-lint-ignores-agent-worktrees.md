---
title: 0014. Root lint ignores agent worktrees
description: The root ESLint config ignores .worktrees/ and .claude/worktrees/, so linting one checkout never lints, or fails on, another agent's worktree; read this before changing ESLint's ignore list or the worktree folders.
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-10-08
tags: [adr, guardrail, eslint, worktrees, agents]
related:
  [
    'docs/process/guardrails.md',
    'docs/agents/running-agents.md',
    'docs/reference/game-design/13-owner-decisions-log.md',
    'eslint.config.js',
  ]
---

# 0014. Root lint ignores agent worktrees

- Status: accepted (product owner decision, 2026-10-08, DEC-16)
- Date: 2026-10-08

## Context

Parallel agents work in git worktrees inside the repository: `.worktrees/<task>` and
`.claude/worktrees/<task>` (`docs/agents/running-agents.md` §3). Both folders are gitignored, but
ESLint's flat config does not read `.gitignore`. Running `eslint .` from the main checkout
therefore also linted every worktree: on 2026-10-08 that was 727 extra files on top of the main
tree's 174. Lint got slower, and one unfinished worktree with a lint error failed the main
checkout's pre-commit and pre-push hooks (`check:quick`), which have nothing to do with that
work.

## Decision

`globalIgnores` in `eslint.config.js` lists `.worktrees/` and `.claude/worktrees/` next to the
build and coverage folders. The patterns have no `**/` prefix, so they resolve against the
directory of the config file. Inside a worktree they point at folders that do not exist, and the
worktree lints all of its own files.

## Consequences

- Each checkout lints only itself. A worktree is linted by its own hooks, by its own
  `npm run check`, and by CI on its pull request. CI uses a fresh clone, so it lints the same
  tracked files as before.
- The ignore list holds only untracked folders. Adding a tracked folder to it would weaken the
  lint guardrail, which needs its own ADR.
- A new worktree location, for example `.gemini/worktrees/` (architecture 16), is added to
  `.gitignore` and to `globalIgnores` in the same change.
- Other tools need no change: `check:no-js` reads `git ls-files`, the docs check walks only
  `docs/`, and knip uses its workspace globs.
