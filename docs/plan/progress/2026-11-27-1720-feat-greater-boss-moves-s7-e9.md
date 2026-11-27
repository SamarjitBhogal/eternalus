---
title: 'Progress 2026-11-27: feat/greater-boss-moves (S7 keep-out removal, DEC-371 E9 sweep warning)'
description: 'Phase 3 / Cathedral, swholtzman reviewer + Claude Code: #164 review S7 (the defenders keep-out circle around the gem is removed) and DEC-371 E9 (both sweeps warn 0.5 s before they land), one fix commit for merge train 1.'
audience: [humans, agents]
status: active
owner: Aryan976503
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/greater-boss-moves (S7 keep-out removal, DEC-371 E9 sweep warning)

Phase 3 / Cathedral · feat/greater-boss-moves (PR #164), on `1dafe2fe` · swholtzman reviewer
(PR-REVIEW-90_91-27) + Claude Code

- What was done:
  - S7 (reviews 6037513747 and 6051357907): DEC-346 removed the gem's touch strike, so checkpoint
    defenders need no keep-out circle around it. `GuardRoster` (`keepOut`, `structuresWithin`),
    `GuardRoster.types`, `clearGuardPost` (and its 156-column comment line), `GuardRoster.test`,
    `CathedralGem.test` (the `clearCheckpointDefenders` call), `Simulation.capture.test` and the
    doc 18 sentence go back to #160 `5ac24b4c`; `Simulation.capture.test` there is phase/3's. The
    three test files pass without the code (3 files, 36 tests). `worldObjects.blockingAt` still
    keeps posts off the gem's plinth. DEC-371 "BOSS guards" allows no defenders while the boss
    lives.
  - E9 (DEC-371): the sweep and the wide sweep (it spreads the sweep) warn 0.5 s before they land;
    the other moves keep 1 s. A new scenario test pins it. Red check: with the old 1 s it failed
    (expected 15 ticks, received 30).
  - `INBOX.md`: the sweep item notes that DEC-371 E9 answers (5) and the telegraph in (3).
  - Critic (`architecture-reviewer`): approve, no blockers. Nit taken: the `INBOX.md` note names
    only the telegraph part of (3). Nit not taken: the new test pairs telegraphs and landings by
    index, as the sibling test above it does, which also checks the pairing.
  - Ponytail: the delta is a removal plus one value and one test; no cuts.
- Checks run: vitest on the three S7 test files (36 passed) and on the 10 boss test files (77
  passed); core `tsc --noEmit`, eslint and prettier on the changed files exit 0. Full
  `npm run check` on the staged tree (gate slot C, 17:22Z): exit 0 (core 335 files / 2072 tests,
  client 337 / 2297, server 29 / 165, protocol 1 / 33, docs check passed). The critic's
  `INBOX.md` wording fix and this entry came after it; prettier and the docs check pass on them.
- Next step: the push script for #164 (fast-forward from `1dafe2fe`); #164 joins merge train 1 as
  a late car. The phase/3 merge stays with the train.
