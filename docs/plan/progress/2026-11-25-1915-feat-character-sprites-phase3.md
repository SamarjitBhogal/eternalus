---
title: 'Progress 2026-11-25: PR #170 pre-PR gate fixes (Legend sprites)'
description: 'Phase 3, sholtzman + Claude Code: the critic and ponytail findings of the PR #170 pre-PR gate - the sheet loads in match-loading and goes into the renderer constructor, the sprite port and its query, PR #90 health-bar contract, budgets, TSDoc, ADR 0027 options, DEC-298 words, INBOX items.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: PR #170 pre-PR gate fixes (Legend sprites)

Phase 3 · feat/character-sprites-phase3 (review branch `review/pr170-fix`) · sholtzman + Claude
Code

- What was done: the fixes for the pre-PR gate (ADR 0010) of PR #170, critic round 1 and the
  ponytail review.
  - `match-loading` loads `match`, then the player's sheet group (`matchAssetGroups`).
    `MenuState` and `ResultsState` release both. A sheet that fails to load only warns.
  - `createBrowserMatch` gives the loaded atlas to `Canvas2dRenderer.fromCanvas`. `setAtlases`,
    the owner flag, the promise chain and the extra release adapter are gone.
  - The port is `drawSprite(sprite, anchor, width): void` plus the query `hasSprite`.
    One `drawImage` from the source cell, smoothing off; the frame cache is gone.
  - `createLegendView` uses the sprite view only when the renderer holds the atlas. Else the
    Legend is a disc and a WARN is logged.
  - The health bar uses PR #90's `visualRadiusOf?` query, byte for byte; the six unrelated views
    are back to the base. `LEGEND_SPRITE_SHEETS` has its own file; views no longer import `game/`.
  - Data: budget rows for the eight sheet groups (proposed), the attachment id typed, the
    licence order, TSDoc.
  - Docs: ADR 0027 in the template with four options, ADR 0028 date, the DEC-298 row in the
    owner's words, 08, 13 and 14 status, and two `INBOX.md` items (five better-than-design
    items, the Magus licence class).
- Checks run: `npm run check:quick` passed in each commit hook. The full `npm run check` runs on
  this head after this entry; its result is in the PR comment. Each new test failed first on a
  deliberate break.
- Next step: the critic re-checks the changed code (round 2); the owner answers cards PR170 (1)
  to (12); then the review branch is pushed to the PR.
