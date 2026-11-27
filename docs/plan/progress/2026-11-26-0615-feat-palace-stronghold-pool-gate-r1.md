---
title: 'Progress 2026-11-26: feat/palace-stronghold-pool, critic round 1 (HC-Q104, DEC-373 (1))'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: the full-check result of the first build, critic round 1 of HC-Q104 and its rework (the palace floor is not part of the Stronghold, the client draws the body, HC-Q122 asked).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/palace-stronghold-pool, critic round 1 (HC-Q104, DEC-373 (1))

Phase 4 / sprint 4.2 · feat/palace-stronghold-pool · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-69, -70)

- Full check of the first build (the entry `2026-11-26-0425-…` said it would run on its docs
  commit and recorded no result). On `44f51d89` it failed at knip (K1): "Unused exported types (1)
  MapObjectFlags type packages/core/src/content/maps/mapObjects.types.ts:25:13". Commit `4e4bee4b`
  fixed it. The full check on `4e4bee4b`: `CHECK_EXIT=0`; core 373 test files and 2521 tests; the
  other workspaces 1/31, 315/2214 and 21/85 (files/tests); docs check 151 files, passed
  (`eternalus-agent-work/abilities/hc-q104/logs/check-4e4bee4b.log`).
- Critic round 1 (`hc-q104/critic-r1-report.md`): verdict REWORK, one blocker (Q104-1). Rework by
  the COMBAT-WEAPONS-ABILITIES-70 runner, from `4e4bee4b`: `90f30c17` (one builder for a
  structure's body, `Footprint.ofBody`; `map/structureBodyParts` rejects a `partOf` object that
  does not block or names no structure; one hit-polygon helper; `partOf` declared once),
  `9864988a` (the palace floor is not part of the Stronghold, DEC-344 (4); tests for the fort box,
  a locked attack from outside, spots from geometry), `0f57a358` (client: a structure's body
  stays visible after its building falls), and this docs commit (DEC-373 correction, `INBOX.md`
  HC-Q122, HC-Q87 ticked, fort-box FYI, notes in 05, 07 and 10). Breaks R1-1 to R1-11:
  `hc-q104/breaks.log`. PR-body items: `hc-q104/pr-body-items-r1.md`.
- Checks run: `npm run check:quick` by the pre-commit hook on each commit: exit 0. The hook
  blocked the first try of the client commit (lint `no-confusing-void-expression` in a new test
  arrow); the arrow got braces, and the second try passed. All core tests
  on the code of `90f30c17`: 374 files, 2525 tests passed. Each break turned its test red; each
  file restored (`cmp`). The full `npm run check` runs once on the final head of this round; its
  log is `hc-q104/logs/check-<sha>.log`, and the next entry or the PR body records the result.
- Next step: critic round 2 on the rework. Then the orchestrator merges `feat/shots-over-lava`
  (#169, finding Q104-9: keep the per-polygon model). Owner answer HC-Q122 (Owner Calls v101)
  decides the after-fall rule; the #98 merge needs a per-definition after-fall rule either way.
