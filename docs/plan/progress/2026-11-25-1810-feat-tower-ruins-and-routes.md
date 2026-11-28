---
title: 'Progress 2026-11-25: feat/tower-ruins-and-routes (phase/3 merges 1145cf6b, e29ecec5, 67dbae61)'
description: 'Phase 3, sholtzman + Claude Code: merged phase/3 three times into #98 (up to 67dbae61, #132 Cathedral gem); conflicts in MatchWorld, WorldObjectStore, the Duel test, DefaultSystemPipeline and docs, both sides kept; full check passed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/tower-ruins-and-routes (phase/3 merges 1145cf6b, e29ecec5, 67dbae61)

Phase 3 / tower ruins and routes · feat/tower-ruins-and-routes · sholtzman + Claude Code

- What was done: three merges of `phase/3-sprint-3-work` into PR #98.
  - `58aeb68c` merges `1145cf6b` (#130, #107, #100, #109). `state/MatchWorld.ts` keeps this
    branch's reopen and phase/3's `strongholdOf`; `MatchWorld.test.ts` keeps both tests. The Duel
    test keeps phase/3's respawn test and this branch's kill-target test. The decisions log keeps
    the DEC-355 batch, then the DEC-325 batch. `DevSpawnLegendHandler.test.ts` and
    `RespawnSystem.test.ts` (new on phase/3) build a `MatchGrid`, because `MatchWorld` takes one
    on this branch. Full check on it: exit 0 (core 1813 tests, client 2118).
  - `fabdccd8` merges `e29ecec5` (#83, #104, #131, #118, #128, #142, #145).
    `state/WorldObjectStore.ts` keeps this branch's private `spawn` method and moves phase/3's
    DEC-348 line (an `isUnbreakable` object gets an unbreakable collider) into it.
    `Simulation.duel.test.ts` is phase/3's file: all four fight tests now use
    `FIGHT_TIMEOUT_MS = 180_000`, so this branch's `KILL_TARGET_TIMEOUT_MS` (DEC-325) is gone.
    The DEC-325 row and the `INBOX.md` request "Make the tower horde test and the Duel
    kill-target test faster" still name that constant; the row is a record and stays.
    Architecture 06, `PROGRESS.md` and the decisions log: both sides kept, phase/3's block first.
  - This commit merges `67dbae61` (#132, the Cathedral gem, DEC-346).
    `DefaultSystemPipeline.ts` and its options type take this branch's `ruinWall` and #132's
    `assistWindowTicks`. This branch's ruinWall refusal test now passes `assistWindowTicks`, as
    #132 did for every other pipeline in that test file.
- Found, not changed: phase/3 carries `packages/core/src/Simulation.duel.test.ts.orig`, a
  mergetool backup from #132's merge commit `9ea7c47a`. It is byte-equal to the Duel test at
  `e29ecec5` and no file names it. Reported to the coordinator; the fix belongs on phase/3.
- Checks run: `npm run check` on the staged merge of `67dbae61`, before this file was added →
  EXIT=0: core "Tests 1890 passed (1890)" (304 files), protocol "Tests 31 passed (31)", client
  "Tests 2186 passed (2186)" (320 files), server "Tests 163 passed (163)", both builds,
  "Documentation check passed."
  (`eternalus-agent-work/tower-ruins-and-routes/check-98-merge-67dbae61.log`); then
  `prettier --check` and `npm run docs:check` with this file.
- Next step: #122 takes this head; the coordinator gets one push script for #98 and #122.
