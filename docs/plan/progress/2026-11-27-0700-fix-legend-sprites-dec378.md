---
title: 'Progress 2026-11-27: #170 follow-up (phase/3 merge, audit and critic fixes)'
description: 'Phase 3, sholtzman + Claude Code: the DEC-378 line merges phase/3 after PR #170, keeps the Legend click area at 2.6 m while the health bar uses the sprite top, makes LegendAnimation keep its last place, and applies the post-merge audit and critic items.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: #170 follow-up (phase/3 merge, audit and critic fixes)

Phase 3 · fix/legend-sprites-dec378 (the #170 follow-up PR, a draft until card HC-B56 is
answered) · sholtzman + Claude Code

- What was done:
  - Merge: phase/3 (with PR #170's round-1 design, #90, #173, #153, #84, #82) merged into the
    DEC-378 line. The merge commit lists each conflict and its resolution. Phase/3's rows
    DEC-373 to DEC-376 stay word for word.
  - Audit A (card PR170 (13), option A, built ahead of the answer): `EntityView` gets
    `visualTopOf?` for the health bar. `visualRadiusOf?` stays the click area, so a sprite
    Legend's click circle stays DEC-238's 2.6 m, not the 4.8 m sprite top. `EntityLayer` places
    the bar with `visualTopOf`, else `visualRadiusOf`, else the footprint.
  - Audit B: `MinionView.draw` returns `void` again. Audit C: ADR 0028 has a dated note that
    ADR 0027 is accepted. Audit D: 08 §11 states the merged PR #90. Audit E: the DEC-378 batch
    names this branch.
  - Critic B2 (the root fix for N5): `LegendAnimation` keeps its Legend's last place and tick.
    `LegendSprites.observe(current)` builds no map of every entity each tick. A Legend that was
    not in the last snapshot (a respawn) does not walk.
  - Critic N1, N2 (the sheets have no set order; the "player's sheet first" text is gone from
    the code, the tests, 08 §11, 14 §14, ADR 0027 and the DEC-378 row), N3, N4 (test titles),
    N6 (a status hit from a bot leaves it on its idle row), N7 ("for example" for the bot
    fallback), N8 (`sheetsFor` in `game/__fixtures__/`).
  - Merge recipe for PR #123 (critic S2). Whoever merges #123 after this branch does three
    things. (1) Take #123's TSDoc in `Simulation.types.ts`, `EntityFactory.types.ts`,
    `LegendSpawner.ts` and `Legend.ts`, and add "the Legend keeps it and its snapshot names it
    (DEC-378 (2))". (2) Keep `this.spec = reader.specId(context)` in `Legend`, and let #123's
    `specOf` read `this.spec` (better-than-design B1). (3) Add `specs: LEGEND_SPECS` to the two
    spawn calls in `Legend.test.ts` and `EntitySnapshotter.test.ts`; without it, #123's
    `specOf` throws.
  - Performance (critic S3): not measured. Estimate: a 2x sheet is 768 x 1280 px, about 3.9 MB
    decoded; 8 sheets are about 31 MB; a 1x sheet is about 1 MB. The draw cost is about 20
    `drawImage` calls a frame. The owner's playtest checks the 08 §9 metrics.
- Checks run: `npm run check:quick` runs in each commit hook. The changed test files passed.
  Each new or changed test failed first on a deliberate break. The record is in the agent work
  folder, `legend-sprites-dec378/fail-first.md`. The full check runs on this head after this
  entry; its result goes into the report.
- Next step: the critic reviews the branch. The PR stays a draft until the owner answers card
  HC-B56 (DEC-374 or DEC-378). Cards PR170 (5) to (14), HC-B57 and card 9 (F13) stay open.
