---
title: 'Progress 2026-11-25: refactor/tower-ruins-followups (merge of #98 at phase/3 67dbae61)'
description: 'Phase 3, sholtzman + Claude Code: merged #98 a0de3b8c (phase/3 up to 67dbae61, #132 Cathedral gem) into #122; three conflicts, new phase/3 tests moved to this branch API; full check passed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: refactor/tower-ruins-followups (merge of #98 at phase/3 67dbae61)

Phase 3 / tower ruins follow-ups · refactor/tower-ruins-followups · sholtzman + Claude Code

- What was done: merged `feat/tower-ruins-and-routes` at `a0de3b8c`. #98 merged phase/3 three
  times, up to `67dbae61` (#132, the Cathedral gem, DEC-346). Three files conflicted:
  - `systems/DefaultSystemPipeline.types.ts` keeps this branch's required `ruinWall` (DEC-245)
    and #132's `assistWindowTicks`.
  - `systems/DefaultSystemPipeline.test.ts`: the ruinWall refusal test stays deleted. `b7cd090c`
    (BTD3, DEC-245) deleted it together with the runtime throw that it tested.
  - `docs/architecture/06-map-and-minimap.md`: `last-reviewed` 2026-11-25, the newer date.
- Also changed: tests that phase/3 added since the last merge now use this branch's API.
  `DevSpawnLegendHandler.test.ts`, `RespawnSystem.test.ts` and `MatchWorld.test.ts` build
  `new MatchWorld(MatchGrid.build(...))` with one argument.
  `DefaultSystemPipeline.killCredit.test.ts` passes `ruinWall: RUINED_FORT_WALL_DEFINITION`.
- Checks run: `npm run check` on the staged merge, before this file was added → EXIT=0: core
  "Tests 1898 passed (1898)" (305 files), protocol "Tests 31 passed (31)", client "Tests 2186
  passed (2186)" (320 files), server "Tests 163 passed (163)", both builds, "Documentation check
  passed."
  (`eternalus-agent-work/tower-ruins-and-routes/check-122-merge-a0de3b8c.log`); then
  `prettier --check` and `npm run docs:check` with this file.
- Next step: push after #98's head `a0de3b8c`; the coordinator gets the push script.
