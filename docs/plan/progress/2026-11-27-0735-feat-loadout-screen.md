---
title: 'Progress 2026-11-27: feat/loadout-screen (merge of phase/3)'
description: 'Phase 3 / sprint 3, claudiodh + Claude Code: PR #141 merges phase/3-sprint-3-work again; four conflicts and two phase/3 tests moved to the LegendEquipment argument.'
audience: [humans, agents]
status: active
owner: claudiodh
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/loadout-screen (merge of phase/3)

Phase 3 / sprint 3 · feat/loadout-screen (PR #141) · claudiodh + Claude Code

- What was done: merged `phase/3-sprint-3-work` (`5f93e2a5`, after #173, #129, #149, #177, #183
  and #184) into the branch head `6782880e`. Four conflicts, both sides kept:
  - `EntityFactory.ts`: phase/3's `MapFeatureLink` for an entity placed from a map feature
    (DEC-252, #129) and this branch's spawn loadout from the injected `LoadoutResolver`; the
    TSDoc names both.
  - `SpawnContextReader.ts`: phase/3 removed `mapFeatureId()` (nothing reads it after DEC-252);
    this branch's `loadout()` stays.
  - `ProgressionSystem.camps.test.ts`: this branch's `{ weapons }` `LegendEquipment` argument
    with phase/3's `CHECKPOINT_DEFENDER_LIMIT` for `GuardRoster`.
  - Architecture 15: the later `last-reviewed` (2026-11-26).
- Two phase/3 tests still passed the weapons as `EntityFactory`'s fourth argument; they now pass
  `{ weapons: loadWeapons(…) }`, as this branch did for the others: `JumpHandler.test.ts` and
  `ProgressionSystem.checkpoints.test.ts`.
- Checks run: `npm run check` EXIT=0 on the merge, after `npm ci` (core 2002, protocol 33,
  client 2376, server 165 tests passed; docs check passed).
- Next step: Samarjit re-reviews PR #141 (B1 is fixed by `86ffa5d0`); then the follow-up PR
  `feat/loadout-per-legend`.
