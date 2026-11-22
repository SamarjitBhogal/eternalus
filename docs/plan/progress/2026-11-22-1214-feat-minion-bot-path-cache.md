---
title: 'Progress 2026-11-22: feat/minion-bot-path-cache (phase/3 merge, PR #84 review round 3)'
description: 'Phase 3 / minion plan M8, SamarjitBhogal + Claude Code: merged phase/3 e2a4fd66, fixed the round-2 findings and re-measured the cache on the same load, checks green.'
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/minion-bot-path-cache (phase/3 merge, PR #84 review round 3)

Phase 3 / minion plan M8 follow-up · feat/minion-bot-path-cache · SamarjitBhogal + Claude Code

- What was done: merged `phase/3-sprint-3-work` at `e2a4fd66`, then `25f1151c` (each time only `PROGRESS.md` conflicted:
  both sides kept, this branch's four pre-merge entries stay in the archive, DEC-277). Round-2
  fixes: `NO_PATH` written only when a cache is set (`BotMovement.forgetPath`); the
  `PathQuery.waypoint` exact-copy contract in its TSDoc; a generated-map match test showing a
  cached waypoint in the brain store, same hash twice; doc 11 §6 names the one-leg case when the
  grid opens. Bench: #83's `hordes.mjs` at `0067d856` on this tree, cache on and off
  interleaved, 3 runs each (numbers in the PR #84 body): A\* searches 4764 → 817 (144/team) and
  4384 → 652 (290/team); p95 times overlap under load. No product question.
- Checks run: `npm run check` → exit 0: "All matched files use Prettier code style!"; core
  "Tests 1694 passed (1694)"; protocol "Tests 29 passed (29)"; client "Tests 2077 passed (2077)";
  server "Tests 84 passed (84)"; "✓ built in 465ms"; "Documentation check passed."
- Next step: re-review by swholtzman; sholtzman signs off the doc 11 §6 wording. #98 (2.5 m grid,
  `WorldMap.version`) re-measures and settles the grid-version choice if it merges second.
