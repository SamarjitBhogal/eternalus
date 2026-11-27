---
title: 'Progress 2026-11-27: fix/bot-replan-on-map-change (DEC-379, DEC-392)'
description: 'Phase 3, PR-38-HELPER-58, -59 and -60 (Claude Code): a bot path cache and a stuck detour both keep the map version and plan again when it changes; follow-up to PR #84.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: fix/bot-replan-on-map-change (DEC-379, DEC-392)

Phase 3 · fix/bot-replan-on-map-change (follow-up to PR #84, from phase/3 `8ad77bfd`) ·
sholtzman + Claude Code (PR-38-HELPER-58, PR-38-HELPER-59, PR-38-HELPER-60)

- What was done: the owner's answers HC-B54 A and HC-B50 B (Owner Calls v103), recorded as
  DEC-392, with his v98 answer on the bot path cache recorded as DEC-379; both replace DEC-373.
  `WorldMap.version` counts every `stampFootprint` and `clearFootprint`, and `PathQuery.version`
  reads it. `BotMemory.pathVersion` stores the version with the cached waypoint, and
  `BotMovement` reuses the waypoint only while the versions are equal. `ChaseWatch` stores the
  version its detour was planned on, and `StuckSystem` asks for a new plan when
  `ChaseWatch.isWayStale` sees another version. Docs 06 §6, 11 §6 and 18 updated; INBOX _Done_
  entry added.
- Tests: new tests in `WorldMap`, `AStarPathfinder`, `ChaseWatch`, `StuckSystem`,
  `BotLegendController` and `BotLeaves`; `StateHasher` and `Simulation.bots` tests updated.
  Each of three deliberate breaks turned one new test red: `isMapChanged = false` in
  `StuckSystem` (the StuckSystem DEC-392 test), `isWayStale` returning `false` (the ChaseWatch
  DEC-392 test), and no `pathVersion` check in `BotMovement.reuseStep` (the BotLegendController
  DEC-379 test).
- Checks run: `npm run check` (Node 24.21.0) on the staged tree `5549afaf` before the commit,
  `EXIT=0`; its summary lines verbatim: "All matched files use Prettier code style!"; core "Test
  Files 317 passed (317)", "Tests 1929 passed (1929)"; protocol "Test Files 1 passed (1)", "Tests 31
  passed (31)"; client "Test Files 334 passed (334)", "Tests 2269 passed (2269)"; server "Test Files
  29 passed (29)", "Tests 163 passed (163)"; "Documentation check passed.". knip printed a
  configuration hint, not an error: "@eternalus/core apps/client knip.json Remove from
  ignoreDependencies". Then the checks line was written into this entry, and Prettier and the docs
  check ran again on it.
- Next step: Sam pushes the branch and opens the PR on phase/3; after CI is green, the
  coordinator asks Sam to merge it. Merge note: this PR and the DEC-393 PR each add a 2026-11-27
  batch at the top of the decisions log and an INBOX _Done_ entry; the second to merge keeps both.
