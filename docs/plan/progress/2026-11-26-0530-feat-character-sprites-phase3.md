---
title: 'Progress 2026-11-26: PR #170 critic round 3 fixes (Legend sprites)'
description: 'Phase 3, sholtzman + Claude Code: the PR #170 critic round 3 findings - two tests that check Match drives the player sprite, a narrow input type for PlayerLegendSprite, an optional playerSheet type, one docs path and one INBOX wording fix.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: PR #170 critic round 3 fixes (Legend sprites)

Phase 3 · feat/character-sprites-phase3 (review branch `review/pr170-fix`) · sholtzman + Claude
Code

- What was done: the fixes for the PR #170 critic round 3 (pre-PR gate, ADR 0010). Runtime
  behaviour does not change.
  - S-r3-1: two new tests check that `Match` drives the sprite. `Match.lifecycle.test.ts` checks
    that `destroy()` drops the sprite's `damage-applied` listener, with the other listeners.
    `Match.test.ts` checks that a walking Legend draws a walk frame of the render's tick.
  - BTD9: `PlayerLegendSprite.types.ts` holds `PlayerLegendSpriteDeps`, a narrow input type.
    `PlayerLegendSprite.test.ts` no longer builds a real `Simulation` or stubs `step`,
    `snapshot` and `enqueueCommand`.
  - BTD10: `MatchDeps.playerSheet` is `LegendSpriteSheet | undefined`. Four conditional spreads
    are gone.
  - N-r3-1: architecture 08 lists `PlayerLegendSprite*` in its `paths`.
  - `INBOX.md`: the BTD5 text now names `PlayerLegendSprite.setFrameTick`, not `Match.frameTick`.
- Checks run: `npm run check:quick` passed in each commit hook. The changed client test files
  passed. Each new test failed first on a deliberate break: three breaks (`Match.ts` lines
  `observe`, `setFrameTick` and `destroy` removed one at a time). The record is in the agent work
  folder, `pr-rule-2026-11-25/pr170-fail-first-4.md`. The full `npm run check` runs on this head
  after this entry; its result goes into the report.
- Next step: the coordinator's script pushes the review branch to the PR.
