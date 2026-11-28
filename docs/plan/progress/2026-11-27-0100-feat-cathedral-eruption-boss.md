---
title: 'Progress 2026-11-27: feat/cathedral-eruption-boss (phase/3 merge after #90, #170, #153, #173)'
description: 'Phase 3 / Cathedral, SamarjitBhogal + Claude Code: merged phase/3-sprint-3-work e8250d6b; nine conflicts and three unmarked clashes resolved; S1 (lethal blast) still open for the author.'
audience: [humans, agents]
status: active
owner: Aryan976503
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/cathedral-eruption-boss (phase/3 merge after #90, #170, #153, #173)

Phase 3 / Cathedral · feat/cathedral-eruption-boss (PR #160) · SamarjitBhogal + Claude Code

- What was done: merged `phase/3-sprint-3-work` at `e8250d6b` (after #82, #84, #90, #170, #153 and
  #173) for the acting owner. Nine conflicts, both sides kept:
  - `GuardRoster`: this PR's `firstTick` strategy table (`GUARD_FIRST_TICKS`, nullable until
    `activate`) with #173's `canLevel` on each post set; both sides' imports.
  - `SpawnSystem`: both buffers and listeners (`summoned` for `greater-boss-summoned`, #173's
    `pointsLost` for `capture-point-owner-changed`) and both TSDoc sentences.
  - `Match.ts`: the cut-scene imports and #90's `BiomeAtmosphereView`; the world layers end
    with `this.atmosphere`, then `EruptionView`, so the burst draws over the weather.
  - `Match.test.ts`: `setUp(content, withMapObjects, plannedMatchSeconds, playerSpecId)`; #170's
    caller passes `undefined` for the third.
  - Doc 03 event table: this PR's `greater-boss-summoned` and `boss-summoned` rows, #173's
    `checkpoint-cleared` row and listener cells; doc 08 §11: the cut-scene paragraph and #90's
    notes; doc 11: the newer `last-reviewed`; the decisions log: every 2026-11-26 batch, DEC-373
    to DEC-376 above this PR's DEC-370 to DEC-372.
- Three clashes git did not mark: the `cathedral-capture-point` guard plan needs #173's required
  `canLevel` (set `false`: before M6c a neutral post never levelled, so the boss keeps its
  behaviour); `MobView.test.ts` lost its `SOUTH` constant in #90's rewrite (restored); the
  boss disc test expected 5, but #90 draws every mob disc at `MOB_VISUAL_SCALE` (DEC-238), so it
  now expects `2.5 × 2 × MOB_VISUAL_SCALE` and still checks the neutral colour.
- Not done here: swholtzman's R6 **S1** (the blast must be lethal after `MinionStrengthStep`)
  and nits N4, N5, N1, N3; they stay with the author.
- Checks run: `npm run check` on Node 24.21.0 (see the PR #160 comment).
- Next step: the author fixes S1; then #164 merges this head.
