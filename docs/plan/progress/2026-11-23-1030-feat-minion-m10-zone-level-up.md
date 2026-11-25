---
title: 'Progress 2026-11-23: feat/minion-m10-zone-level-up (DEC-353 clean-ups, PR #131)'
description: 'Phase 3 / minion plan M10, SamarjitBhogal + Claude Code: built the owner-approved MinionLevelSystem, removeStacks and per-zone level-up (DEC-353), merged #130.'
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/minion-m10-zone-level-up (DEC-353 clean-ups, PR #131)

Phase 3 / minion plan M10 · feat/minion-m10-zone-level-up · SamarjitBhogal + Claude Code

- What was done: merged `feat/minion-m6b-checkpoint-defenders` at `bf8d6272` (which holds
  phase/3 `edf18533`; conflicts in `PROGRESS.md`, both sides kept, and the minion plan gap table,
  #130's rows plus this branch's Zone level-up row). Recorded DEC-353 ("Build all three in #131
  before it merges") and built it:
  (a) `systems/MinionLevelSystem.ts`, after `ZoneLevelUpSystem`, applies every minion level change
  on its pass; `VeterancySystem` now only counts kills (announcing `minion-level-earned`) and
  spreads the aura; the shared `systems/veterancyOf.ts` adds `Veterancy` on first use. 03 §4's
  exception is gone. A kill level now lands later in the same tick, so the aura sees it at its
  next cadence (at most `aura.everyTicks` later).
  (b) `StatusEffects.removeStacks` and `StatusEffectApplier.removeStacks`: a lost level sends one
  `status-stacks-lost` (or `status-expired` when no stack stays).
  (c) `ZoneDefinition.levelUp` on both capture points; `loadZoneLevelUp` returns them by zone id,
  hold time in ticks (DEC-241); `content/zones/zoneLevelUp.ts` is gone.
  Tests: `MinionLevelSystem.test.ts` (applied on the pass, not in the handler; one status event
  for a lost level), `StatusEffects`/`StatusEffectApplier` `removeStacks`, a per-zone level-up test
  and the loader by id. Docs 03, 05, 07, 18 updated.
- Checks run: see the PR #131 comment for this round (`npm run check`, quoted verbatim).
- Next step: re-review; merge after #130.
