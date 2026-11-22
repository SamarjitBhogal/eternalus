---
title: 'Progress 2026-11-22: feat/cathedral-eruption-boss (#132 merge after #91)'
description: 'Phase 3 / sprint 3.6, Aryan Walanj + Claude Code: merged #132 (59428cea, with phase/3 edf18533) into the eruption branch; five conflicts with the corner boss combined.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/cathedral-eruption-boss (#132 merge after #91)

Phase 3 / sprint 3.6 · feat/cathedral-eruption-boss · Aryan Walanj + Claude Code

- What was done: merged #132 `59428cea` (phase/3 `edf18533`, with the corner boss #91). Conflicts:
  `aggroRules.ts` and `mobCatalogue.ts` keep both bosses; `guardPlans.test.ts` keeps #91's
  neutral-ally rule and adds the centre-only Greater Boss to both leash sums; doc 11 keeps the
  newer `last-reviewed`; `PROGRESS.md` keeps both sides in date order.
- Checks run: `vitest run` on `guardPlans.test.ts` and `greaterBossSpawn.scenario.test.ts`:
  "Tests 17 passed (17)". The full `npm run check` runs on `feat/greater-boss-moves`, which
  carries this merge.
- Next step: the owner pushes after #132; CI on the PR.
