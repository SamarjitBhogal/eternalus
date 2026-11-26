---
title: 'Progress 2026-11-25: feat/cathedral-gem-hittable (#132: gem kill credit forgets an earlier life)'
description: "Phase 3 / sprint 3 work, Aryan Walanj + Claude Code: claudiodh's should-fix on #132: LegendReset removes LastEnemyHit, so a hit before a respawn or a Duel round reset earns no gem kill."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/cathedral-gem-hittable (#132: gem kill credit forgets an earlier life)

Phase 3 / sprint 3 work · feat/cathedral-gem-hittable · Aryan Walanj + Claude Code

- What was done: claudiodh's should-fix (approval on `fad0b776`): `LastEnemyHit` was never
  cleared. With #100 merged, `RespawnSystem` returns the same Legend object, so an enemy hit
  from before a death, still inside the 30 s window, could earn a gem kill after the respawn.
  `LegendReset` (used by `RespawnSystem` and `DuelRoundSystem`) now removes `LastEnemyHit`, so
  only a hit in the current life counts (DEC-346). Doc 05 §9 states the rule.
- Tests: `RespawnSystem.test.ts` "forgets the last enemy hit of the Legend's earlier life" and
  `DuelRoundSystem.test.ts` "forgets a reset Legend's last enemy hit": both red before the fix.
- Checks run: core `systems/`, `combat/`, `LastEnemyHit`, the Duel: "Test Files 45 passed (45)",
  "Tests 330 passed (330)"; `StateHasher` and `diagnostics/` (replays): "Test Files 21 passed
  (21)", "Tests 131 passed (131)"; `npm run check:quick` (pre-commit hook). The full check is left
  to CI on the push.
- Next step: push; claudiodh's other should-fix items (the PR description for DEC-346, a critic
  run on `a04ab22c..` and its verdict in the body) are open.
