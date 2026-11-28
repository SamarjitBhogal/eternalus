---
title: 'Progress 2026-11-27: docs/dec-288-interior-bonus-buildings (phase/3 merge e8250d6b)'
description: 'Phase 3, PR-38-HELPER-57, -58 and -59 (Claude Code): merged phase/3 e8250d6b into the DEC-288 docs PR #147; four docs conflicts, both sides kept; full check passed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: docs/dec-288-interior-bonus-buildings (phase/3 merge e8250d6b)

Phase 3 · docs/dec-288-interior-bonus-buildings (#147) · sholtzman + Claude Code
(PR-38-HELPER-57, PR-38-HELPER-58, PR-38-HELPER-59)

- What was done: merged `phase/3-sprint-3-work` at `e8250d6b` (22 PR merges since `e2a4fd66`,
  the last one #173). Four docs conflicts. `INBOX.md`, `docs/plan/PROGRESS.md` and the owner
  decisions log keep both sides (this PR's lines first). `bugs.md` takes phase/3's table (BUG-6
  fixed, new BUG-8 row) and keeps this PR's BUG-2 Status and Notes cells; `last-reviewed` is the
  later date, 2026-11-22. A line-multiset check of each conflicted file against both parents and
  the merge base: every dropped line is a base line that the other side changed; the only other
  dropped line is this PR's older `bugs.md` `last-reviewed`.
- Checks run: `npm run check` (Node 24.21.0) on the staged merge tree `c2cf2521` before the commit,
  `EXIT=0`; its summary lines verbatim: "All matched files use Prettier code style!"; core "Test
  Files 315 passed (315)", "Tests 1911 passed (1911)"; protocol "Test Files 1 passed (1)", "Tests 31
  passed (31)"; client "Test Files 333 passed (333)", "Tests 2263 passed (2263)"; server "Test Files
  29 passed (29)", "Tests 163 passed (163)"; "Documentation check passed.". knip printed one
  configuration hint that was there before this merge ("Remove from ignoreDependencies"). Then this
  entry was written, and Prettier and the docs check were run again on it.
- Next step: Sam pushes the branch (#147); after CI is green, the coordinator asks Sam to merge it.
