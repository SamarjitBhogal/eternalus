---
title: 'Progress 2026-11-25: feat/duel-arena-only-legends'
description: 'Phase 3, claudiodh + Claude Code: merge of phase/3 and the owner answers DEC-348 for PR #145.'
audience: [humans, agents]
status: active
owner: claudiodh
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/duel-arena-only-legends

Phase 3 / sprint 3 work · feat/duel-arena-only-legends · claudiodh + Claude Code

- What was done: merged phase/3 (`DefaultSystemPipeline` conflict: both the Duel's `spawnsMobs`
  switch and the checkpoint defenders kept). The re-review of 2026-11-23 (owner answers):
  DEC-348 recorded. A Duel builds no tower, gate, camp or Stronghold
  (`DUEL_RULES.arena.omittedStructureIds`, no longer `cathedral`: the gem stays) and drops their
  map objects and everything a side built (`omittedObjectKinds`, `omitsSideObjects` in
  `match/duelArena.ts`); the Cathedral's walls are `MapObject.isUnbreakable` in a Duel
  (`unbreakableCathedralKinds`, `WorldObjectStore`, `BreakabilityStep`). `CrystalStatus` draws in
  a Duel again. Tests: the gem stays, no structure objects or side objects stay, a Duel wall takes
  no damage while a normal one does, a bot Duel without Strongholds runs with every invariant,
  no mobs. Docs: architecture 06, 12, 13, the decisions log, INBOX Q1 and Q2.
- Checks run: `npm run check:quick` passed (pre-commit hook on each commit); `npm run docs:check`
  "Documentation check passed."; core `vitest run src/match src/state src/combat src/content src/systems
src/Simulation.duel.test.ts src/Simulation.mapObjects.test.ts src/Simulation.structures.test.ts
src/Simulation.bots.test.ts src/ai`: "Test Files 138 passed (138), Tests 923 passed (923)";
  client `vitest run src/ui/hud src/game/SessionController.duel.test.ts src/game/MatchBridge.test.ts`:
  "Test Files 30 passed (30), Tests 187 passed (187)". With no Strongholds the HUD structure strips
  are empty (tiles come from the snapshot's structures).
- Next step: the removed structures' art is still drawn in a Duel (hide it, or the owner accepts
  it); the closed-door drawing (INBOX); the pre-PR gate (`architecture-reviewer` critic and
  ponytail) in a Claude Code session; INBOX Q3 stays open.
