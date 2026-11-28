---
title: 'Progress 2026-11-25: feat/cathedral-gem-hittable (#132: merge phase/3 after #118, #128, #142, #145)'
description: 'Phase 3 / sprint 3 work, Aryan Walanj + Claude Code: phase/3 (e29ecec5) merged into #132; nine conflicts resolved keeping both sides.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/cathedral-gem-hittable (#132: merge phase/3 after #118, #128, #142, #145)

Phase 3 / sprint 3 work · feat/cathedral-gem-hittable · Aryan Walanj + Claude Code

- What was done: merged `origin/phase/3-sprint-3-work` at `e29ecec5` so #132 is not behind. Nine
  conflicts, each resolved keeping both sides:
  - `DefaultSystemPipeline.ts`: the gem's `KillCredit` damage pipeline and phase/3's minion
    veterancy load; `CathedralGemSystem` stays right after `CaptureSystem`, before phase/3's
    `ZoneLevelUpSystem` and `MinionLevelSystem`. The doc comment names both the gem and the Duel's
    no-spawning rule. The pipeline order test lists all three.
  - `MapBuildingInteriorBuilder.ts`: #145 marked the four Cathedral doorways as Duel barriers in
    code this branch had moved to `CathedralInteriorBuilder` (DEC-346); the three
    `markDuelBarrier()` calls move there with it.
  - `Simulation.duel.test.ts`: phase/3's version (with its `FIGHT_TIMEOUT_MS`), plus this branch's
    walker that steps round the gem; this branch's own timeout constant is dropped as redundant.
  - Docs 03 (the `capture-point-owner-changed` row lists both new listeners), 05 (later
    `last-reviewed`), 18 (pipeline order with the gem before the zone and minion level systems),
    `INBOX.md` and the decisions log (both sides' items and batches).
  - One semantic conflict: #145's test "keeps the Cathedral gem, while building no tower, gate,
    camp or Stronghold (DEC-348)" added a stand-in `cathedral` structure because "the gem's own
    kind (#132) is not on this branch"; with #132 here that duplicated the real gem's id
    ("Duplicate definition id"), so the test now uses `STRUCTURE_DEFINITIONS` as it is (same
    assertions on what a Duel builds).
- Checks run: `npm run typecheck` (exit 0), eslint on the resolved code files (exit 0),
  `npm run docs:check` ("Documentation check passed."), and the tests nearest the conflicts
  (10 files: 74 passed and the one failure above; after the fix `Simulation.duel.test.ts` 15 passed
  (15) and the server's `CoreDuelSimulation.test.ts` 1 passed (1)). The full check is left to CI (2026-11-23 19:00 entry: the local full run times out).
- Next step: push; CI on the new head; then the reviewers' approval.
