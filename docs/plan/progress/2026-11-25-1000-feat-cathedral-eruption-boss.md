---
title: 'Progress 2026-11-25: feat/cathedral-eruption-boss (phase/3 merge with #132)'
description: 'Phase 3 / sprint 3.6, Aryan Walanj + Claude Code: merged phase/3-sprint-3-work 67dbae61 (#132 merged, with #107, #145, #131 and others) into the eruption branch.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/cathedral-eruption-boss (phase/3 merge with #132)

Phase 3 / sprint 3.6 · feat/cathedral-eruption-boss · Aryan Walanj + Claude Code

- What was done: merged phase/3 `67dbae61`, which now carries #132, so #160's base holds the gem
  it builds on. Conflicts, both sides kept:
  - `Match.ts`: the cut-scene and #107's Legend bodies and developer menu all observe, draw and
    are destroyed.
  - `Match.lifecycle.test.ts` and `SessionController.endToEnd.test.ts`: the match now has five
    simulation subscriptions (the cut-scene's `greater-boss-summoned` and the Legend bodies'
    `entity-removed` both join); the lifecycle test checks the subscribe and the drop order.
  - Doc 03's events table: phase/3's rows plus `greater-boss-summoned`, and `boss-summoned`
    emitted on it. Docs 03 and 12 keep the newer `last-reviewed`.
  - `PROGRESS.md`: phase/3's file plus this branch's 2026-11-22 entry (the #130 entry once).
- Checks run: `npm run check` exits 1 on timeouts only (this machine under load). Format,
  `check:no-js`, lint, typecheck and knip passed; core "Tests 6 failed | 1850 passed (1856)", each
  "Test timed out" (`replay`, `greaterBossSpawn`, `Simulation.modifiers`, `.zoneLevelUp`,
  `.flowFields`); protocol "Tests 31 passed (31)", client "Tests 2200 passed (2200)", server
  "Tests 163 passed (163)". The five files re-run with `--maxWorkers=2`: "Tests 29 passed (29)".
  `npm run build` exit 0; "Documentation check passed."

- Next step: swholtzman's re-review of #160; the owner's B1 and B2.
