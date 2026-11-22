---
title: 'Progress 2026-11-22: feat/greater-boss-moves (eruption merge after #91)'
description: 'Phase 3 / sprint 3.6, Aryan Walanj + Claude Code: merged the eruption branch (11cac8b4, with #132 and phase/3 edf18533) into the moves branch; four conflicts with the corner boss combined.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/greater-boss-moves (eruption merge after #91)

Phase 3 / sprint 3.6 · feat/greater-boss-moves · Aryan Walanj + Claude Code

- What was done: merged `feat/cathedral-eruption-boss` `11cac8b4`. Conflicts: `aggroRules.ts`
  keeps the corner boss and no Greater Boss profile (`BossController` targets its zone);
  `aggroRules.test.ts` lists all three bosses; `xpSources.ts` keeps the corner boss's 500 XP and
  the Greater Boss's flat 5 levels; doc 05 states both. `Simulation.cornerBoss.test.ts` narrows the
  reward union before it reads `xp` (same assertion).
- Checks run: `npm run check` (16:15-16:46) exit 1, timeouts only: core "Tests 17 failed |
  1763 passed | 9 skipped (1789)" (17 "Test timed out", one "Hook timed out in 240000ms"),
  client "Tests 1 failed | 2097 passed (2098)" (a timeout); format, lint, typecheck, knip,
  protocol 29 and server "Tests 114 passed (114)" passed. The 15 timed-out files with
  `--maxWorkers=2`: core "Tests 98 passed (98)", client "Tests 1 passed (1)".
- Next step: the owner pushes after #132 and the eruption branch; CI on the PR.
