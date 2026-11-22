---
title: 'Progress 2026-11-20: chore/progress-entry-files (transition rule)'
description: 'Harness fix, Claude Code: the owner set the DEC-277 cut-over at the merge; rule written into the DEC-277 row, progress/README.md and the PROGRESS.md intro.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-20
tags: [plan, progress, log]
---

# Progress 2026-11-20: chore/progress-entry-files (transition rule)

Harness / process · chore/progress-entry-files · Claude Code (PR-REVIEW-COORDINATION-8)

- What was done: owner answers on Owner Calls (2026-11-20). "DEC-277 transition": "Cut over at
  the merge: entries a branch wrote before it merged a phase/3 that has DEC-277 stay in
  PROGRESS.md; every entry after that is a file in progress/". Written into the DEC-277 row
  (quoted), `docs/plan/progress/README.md` and the `docs/plan/PROGRESS.md` intro. "03b1bb1a
  subject": "Leave it" (no rebase; the PR title carries the scope).
- Checks run: docs-only change after the full `npm run check` on `ad093975` (exit 0, previous
  entry). `npm run docs:check` → "Documentation check passed." (132 files); `prettier --check` on
  the four edited files → "All matched files use Prettier code style!"; pre-commit hook on commit.
- Next step: Sam pushes and opens the PR into `phase/3-sprint-3-work` (`push-C.sh`). The second
  of this PR and `chore/stop-hook-changed-files` to merge needs one more phase/3 merge.
