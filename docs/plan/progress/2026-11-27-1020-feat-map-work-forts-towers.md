---
title: 'Progress 2026-11-27: feat/map-work-forts-towers (merge of the base at 6ec9a777)'
description: 'Phase 3, sholtzman + Claude Code: #152 takes its base refactor/tower-ruins-followups at 6ec9a777 (#122); 47 conflicts resolved, camps now drawn and cleared from one art registry.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/map-work-forts-towers (merge of the base at 6ec9a777)

Phase 3 / map work · feat/map-work-forts-towers · sholtzman + Claude Code (eternalus-163, eternalus-164)

- What was done: #152 takes its base `refactor/tower-ruins-followups` at `6ec9a777` (#122, which
  holds `feat/tower-ruins-and-routes` at `b1ea76e1` and phase/3 at `79a60dae`). 47 files
  conflicted. Both sides are kept:
  - Architecture 06 and the owner decisions log: both sides' sections and batches. The #152
    batches (DEC-358, DEC-340) stand before #122's first 2026-11-23 batch.
  - Camps: #122 draws each camp kind from its own art (a woodland circle, a corner shrine;
    DEC-238). #152 kept camps clear of the lane tower forts with a hand-sized tent box (DEC-315).
    The merge joins them in `map/campArtByKind.ts`: `CAMP_ART` (the art by kind) and
    `campHalfExtent` (the box, measured from the art, DEC-321). `MapBuilder.placeCamps` clears
    each kind with its own box. `MapSceneryBuilder` draws camps through `CAMP_ART`. A camp that
    could not move out of a fort keep-out loses each piece that is not ground and touches a
    keep-out; its ground stays (DEC-318 (BTD4) "drops", signed off by DEC-324 (4)). The tent
    geometry (`BUILDING_GEOMETRY.camp`, `CAMP_GEOMETRY`) and `CAMP_KINDS` are gone. DEC-427
    records this reading of DEC-321 (owner's standing rule of 2026-11-09), and DEC-321 gets an
    "Amended by DEC-427" note.
  - Tests: the two camp tests in `MapSceneryBuilder.test.ts` now compare with the art ("keeps
    every camp whole", "fills exactly the box"). `MapMountainBuilder.test.ts` and
    `LaneFlowFields.test.ts` use the generated map and the real match grid. Snapshot fixtures get
    `aura: null` and the draw-state literals get `time: 0`.
  - Architecture critic round 1 (architecture-reviewer, opus) found blockers; all fixed:
    - `docs/plan/bugs.md`: Prettier table fixed; BUG-2 now names PR #152.
    - `MapGenerator.test.ts` golden hash is `2_721_654_941`. A probe at seed 1234 shows the only
      change: `west-camp-corridor-0-0` and `east-camp-corridor-0-0` move from y 300.28 to 309.28,
      because each camp now clears the forts by the box of its own art.
    - `mapPreservation` snapshot regenerated. The camp hash and counts do not change. Towers,
      scenery and collision change for seeds 1, 2 and 42; these are #152's own changes (DEC-315
      forts, DEC-340 mountains, DEC-358 footprints). The critic's probe confirmed that the merged
      tower and fort objects are #152's and the camp objects are #122's.
    - The scenery builder now drops each piece that is not ground and touches a keep-out from a
      camp that could not move (above), with a new test "leaves out the pieces of a camp that cannot move" (5 lanes, 2 + 3 towers
      per lane, seeds 1234 and 7). `campPlacement.ts` keeps HEAD's doc line.
    - New `campArtByKind.test.ts`: the type guard, the pinned boxes (half extents camp 27 × 27,
      corner camp 39 × 58) and the mirrored Dark side art inside its box.
    - Architecture 07 note "Bigger forts, lane through the court" says "a camp's stones", not
      "a camp's tent".
    - Not done: the optional split of `campClearance` out of `MapBuilder` (326 lines; nit), and
      the date order of the dated notes in architecture 06 (moving them would put the 2026-11-25
      Duel note under the wrong heading). Rejected with a reason: a `{ build, halfExtent }`
      strategy in place of the anchor feature, because the camp builders need a `MapFeature` to
      place the art, so a strategy still builds at an anchor.
- Checks run: fail-first, each new or changed test turns red under a deliberate break and passes
  again after the break is removed:
  - `clearCampOfForts` that never moves a camp: "keeps every camp whole" lists 2 to 5 of 6
    blocking pieces lost.
  - `campHalfExtent` 1 unit too wide on x: "fills exactly the box" lists every camp.
  - The old scenery builder (pieces in a keep-out still drawn): "leaves out the pieces of a camp
    that cannot move" fails, 60 of 60 pieces drawn.
  - `campHalfExtent` with `y` in place of `Math.abs(y)`: 2 tests in `campArtByKind.test.ts` fail.
    The same break on x shows nothing: the largest x of the art is already positive, so the
    maximum does not change.
  - `npm run check` on the staged merge (stack gate, tree `f1b663da`, 10:42Z to 10:53Z): EXIT=0.
    Core 2080 tests, protocol 31, client 2297, server 163, "Documentation check passed." The
    round-2 edits after it (one `ponytail:` comment, wording in this entry and in the DEC-427
    batch) went through the pre-commit `check:quick`, Prettier and `docs:check`.
  - Architecture critic round 2 (re-check of the fixes): approve, no blocker or should-fix. Its
    three nits: the wording in this entry (fixed); DEC-427 has no sign-off card (the batch now
    says why); the camp drop works piece by piece, so a stone can lose its foot and keep its face
    in the one layout whose camp cannot move (marked `ponytail:` in
    `MapSceneryBuilder.clearOfForts`, with the upgrade path).
- Owner note: DEC-391 keeps 2.5 %. A probe on seed 1 gives 1.22 % (3 lanes) and 1.53 % (5 lanes)
  on the match grid, so 2 % would now hold. The number stays until the owner changes it.
- Next step: merge this head into `chore/horde-test-speed` (#154), then fold #154 -> #152 ->
  #122 -> #98 and push all four in one push through the coordinator.
