---
title: 'Progress 2026-11-27: feat/tower-ruins-and-routes (phase/3 e3521feb merge, #183 Legend jump)'
description: 'Phase 3, sholtzman + Claude Code: PR #98 (now the whole map stack at 6194ce39) takes in phase/3 at e3521feb (#183, the Legend jump); nine conflicts, both sides kept.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/tower-ruins-and-routes (phase/3 e3521feb merge, #183 Legend jump)

Phase 3 / map work · feat/tower-ruins-and-routes (PR #98, into phase/3) · sholtzman + Claude Code
(eternalus-166)

- What was done: this branch is the map-stack fold head `6194ce39` (#98, #122, #152, #154).
  phase/3 moved to `e3521feb` (#183, the Legend jump, DEC-390 and DEC-420), so it is merged in
  before #98 merges. Nine conflicts, each resolved so both sides stay:
  - `DefaultSystemPipeline.ts`: #183's `loadLegendJump` import is kept; the
    `MAP_FEATURE_DEFINITIONS` import is dropped, because this branch no longer uses it (DEC-235
    B2, B3). Both new systems are in the tick: `JumpSystem` (#183) and `StructureAuraSystem`
    (DEC-315).
  - `Snapshot.types.ts`: the doc names both new components, `Jump` and `Aura`.
  - `EntityLayer.ts`: each draw state has both #183's `height` and this branch's `time`.
  - `EntityLayer.test.ts`: all three new tests are kept (frame moment, ground order, jump height).
  - `StructureView.test.ts`: this branch rewrote the file (markers, aura fields); #183's one change
    (`elevation: null` in the fixture) is carried into the new `structure()` helper.
  - `EntitySnapshotter.test.ts`: both imports (`Footprint`, `Jump`).
  - Architecture 10: `last-reviewed` takes the newer date.
  - `INBOX.md`: #183's new DEC-420 item and this branch's wider horde-test item (DEC-325). For
    this file and the decisions log, the merged file minus each side has the same changed lines
    as the other side minus the merge base `8ad77bfd`.
  - Decisions log: two batch pairs, higher number first (DEC-427 then DEC-420, DEC-391 then
    DEC-390). 290 rows = 271 shared + 17 from this branch + 2 from #183, no duplicates.
  - Typecheck fallout, not text conflicts: #183's new tests `AirborneView.test.ts` and
    `defaultViewRegistry.test.ts` build an `EntitySnapshot` and `EntityDrawState` by hand, so they
    get this branch's required `aura: null` and `time: 0`.
- Checks run: `npm run check` EXIT=0 on tree `15fde9a5`: core "Tests 2121 passed (2121)", protocol "Tests 33 passed (33)", client "Tests 2309 passed (2309)", server "Tests 165 passed (165)", "Documentation check passed."
- Next step: push this head to #98 only (a fast-forward from `6194ce39`); after CI passes on both
  runners, #98 merges into phase/3.
