---
title: 'Progress 2026-11-26: PR #170 critic round 2 fixes (Legend sprites)'
description: 'Phase 3, sholtzman + Claude Code: the PR #170 critic round 2 findings - PlayerLegendSprite out of Match, the sheet passed into MatchDeps, three new tests, the 08, 13 and 14 status notes and two more better-than-design items in INBOX.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: PR #170 critic round 2 fixes (Legend sprites)

Phase 3 · feat/character-sprites-phase3 (review branch `review/pr170-fix`) · sholtzman + Claude
Code

- What was done: the fixes for the PR #170 critic round 2 (pre-PR gate, ADR 0010).
  - S-new-1 and BTD6: `game/PlayerLegendSprite.ts` owns the player's `LegendAnimation`, the
    frame tick and `createLegendView`. `Match` creates it in one statement. `MatchDeps` takes
    `playerSheet` in place of `playerSpecId`; `createBrowserMatch` passes the sheet it looks up.
    `Match.ts` has 297 lines (was 315). Its constructor has 77 lines (base 76): the one extra
    line creates `PlayerLegendSprite`.
  - S-new-2, N-new-3, N-new-7: architecture 08 §11 notes the DEC-238 row, the merge with PR #90
    and the `SpriteOptions` words, and names `PlayerLegendSprite`.
  - N-new-2: the budget test names the accepted and the proposed budgets.
  - N-new-4: architecture 14 §14 cites plan Phase 5, sprint 5.2 for `AssetCache`.
  - N-new-5: the manifest test checks that every sprite atlas has square cells.
  - N-new-6: architecture 13 §2 names the sheet group in the `match-loading` trigger.
  - N-new-8: a session test checks that `leave-match` frees the sheet group.
  - `INBOX.md`: one new row with BTD7 and BTD8.
  - N-new-1 is rejected: a fix needs a rebase. The PR comment proposes the squash title.
- Checks run: `npm run check:quick` passed in each commit hook. The changed client test files
  passed. Each new test failed first on a deliberate break (seven breaks). The full
  `npm run check` runs on this head after this entry; its result goes into the report.
- Next step: the critic re-checks the changed code (round 3); then the coordinator's script
  pushes the review branch to the PR.
