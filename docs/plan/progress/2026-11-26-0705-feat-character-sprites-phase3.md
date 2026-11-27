---
title: 'Progress 2026-11-26: PR #170 DEC-378 (every Legend gets its sprite)'
description: 'Phase 3, sholtzman + Claude Code: the owner answers of Owner Calls v98 for PR #170 (DEC-378) - core carries each Legend sub-class into its snapshot, every Legend sheet loads, LegendSprites animates every Legend, ADR 0027 is accepted, the licence answer is recorded.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: PR #170 DEC-378 (every Legend gets its sprite)

Phase 3 · feat/character-sprites-phase3 (review branch `review/pr170-dec378`) · sholtzman +
Claude Code

- What was done: the owner's answers to Owner Calls v98 cards PR170 (1) to (4) (DEC-378).
  - Core: the spec plumbing of PR #123 (ADR 0026 (PR #123), decision 1), without kits:
    `RosterSlot.specId`, `Placement.specId` and `SpawnContextReader.specId`. The roster's spawn
    path passes the slot's spec through `LegendSpawner`. The Legend keeps it, and its
    `EntitySnapshot.specId` names it (left out for other entities). `StateHasher` does not hash
    it; no hash or golden replay value changed.
  - Client: `rosterSlots` passes each entry's `specId` (PR #123's change, word for word).
    `matchLegendSheets` gives the sheets of every Legend in the filled rosters, the player's
    first, each once. `matchAssetGroups` loads them after `match`, from the new
    `SessionContext.rosters()`; `MenuState` and `ResultsState` release them.
    `createBrowserMatch` gives the renderer every loaded atlas. `LegendSprites` (was
    `PlayerLegendSprite`; `createLegendView` is folded into it) animates every Legend with a
    loaded sheet, keyed by entity id, through one `damage-applied` listener. A Legend without a
    sheet, or whose atlas did not load, is a disc on its own. `LegendSpriteView` takes each
    sprite's ground offset from its sheet.
  - No bot fallback is built ("only if necessary"). A `ponytail:` note in `LegendSprites.ts`
    names the ceiling (about 20 sprite draws a frame, up to 8 sheets) and the upgrade path.
  - The online Duel does not change. Its server roster
    (`apps/server/src/match/CoreDuelSimulationFactory.constants.ts`) has no spec, so Duel
    Legends stay discs.
  - Docs: DEC-378 batch and a note on DEC-298 (6) in the decisions log; ADR 0027 accepted;
    architecture 03 §5 and §12, 08 §11, 13 §2 and §10, 14 §14; Legend sprite provenance (the
    licence answer) and Magus sprite provenance (the accepted budget); `INBOX.md` (the
    replacement item names the five sheets; the BTD5 name).
- Checks run: `npm run check:quick` runs in each commit hook. The changed test files passed. Each
  new test failed first on a deliberate break (28 breaks). The record is in the agent work
  folder, `pr-rule-2026-11-25/pr170-dec378-fail-first.md`. The full check runs on this head
  after this entry; its result goes into the report.
- Next step: the critic reviews the branch. Then the coordinator's script pushes it to the PR.
  Cards PR170 (5) to (14) stay open (Owner Calls v99).
