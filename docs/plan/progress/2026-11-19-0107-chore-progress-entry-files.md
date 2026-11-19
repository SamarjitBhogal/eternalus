---
title: 'Progress 2026-11-19: chore/progress-entry-files'
description: 'Harness fix, sholtzman + Claude Code: one file per progress entry in docs/plan/progress/ (DEC-277); PROGRESS.md becomes the archive.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-19
tags: [plan, progress, log]
---

# Progress 2026-11-19: chore/progress-entry-files

Harness / process · chore/progress-entry-files · sholtzman + Claude Code

- What was done: DEC-277 (owner: "C: fix them"). New folder `docs/plan/progress/` with a README
  (naming rule, template) and this first entry. `docs/plan/PROGRESS.md` is now the archive (intro
  only). `scripts/hooks/session-start.mjs` reports the newest entry file. Live instructions
  (`AGENTS.md`, `CONTRIBUTING.md`, skills, agents, `docs/agents/`, architecture, plan, process,
  requirements docs) now say "add a new entry file". Historical records left as written.
- Checks run: `npm run check:quick` → exit 0 (typecheck and lint clean); `npm run docs:check` →
  `Checked 130 Markdown files under docs/. Documentation check passed.` Full `npm run check` is
  reported in the PR (the machine ran at load 35 to 40 while this was written).
- Next step: push and open the PR into `phase/3-sprint-3-work` (human, auto mode blocks it).
