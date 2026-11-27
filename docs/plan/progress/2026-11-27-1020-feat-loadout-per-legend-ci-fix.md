---
title: 'Progress 2026-11-27: feat/loadout-per-legend (base merge, CI fix)'
description: 'Phase 3, sholtzman + Claude Code: merged feat/loadout-screen 6782880e into PR #179 and added the snapshot combat group to six test fixtures that CI found without it.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/loadout-per-legend (base merge, CI fix)

Phase 3 / sprint 3 work · feat/loadout-per-legend (stacked on PR #141) · sholtzman + Claude Code (MEMORY-CLEANUP-16, MEMORY-CLEANUP-17)

- What was done: CI failed on both operating systems at `6168902c` (run 45953273836) with TS2741.
  The base, PR #141 (`feat/loadout-screen`), merged phase/3 `317bede0` at `6782880e`. Six phase/3
  test fixtures build an `EntitySnapshot` without the `combat` group that this branch adds (S4,
  DEC-354 (2)). This commit merges `6782880e` (no conflict) and adds `combat: null` to the six
  fixtures: `LegendAnimation.test.ts` and, in `views/`, `entityVisualState.test.ts`,
  `LegendSpriteView.test.ts`, `LegendView.phase3.test.ts`, `MinionView.test.ts` and
  `MobView.phase3.test.ts`. The fixtures go in the merge commit because the pre-commit hook
  (`check:quick`) fails on the merge alone. Only `MatchBridge.ts` reads `combat` in client code, so
  `null` changes no test behaviour.
- Checks run: `npm run check` EXIT=0 on tree `bbf1314c`: core "Tests 1933 passed (1933)", protocol "Tests 31 passed (31)", client "Tests 2387 passed (2387)", server "Tests 163 passed (163)", "Documentation check passed."
- Next step: push, wait for CI on both operating systems, then build DEC-418 (the owner's v103
  answers) on this branch.
