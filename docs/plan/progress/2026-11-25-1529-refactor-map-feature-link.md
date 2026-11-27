---
title: 'Progress 2026-11-25: refactor/map-feature-link (phase/3 merges 1145cf6b and 67dbae61)'
description: 'Phase 3, GL-16, GAME-LOOP-AND-POST-GAME-68 (Claude Code): merged phase/3-sprint-3-work twice into PR #129; code conflicts in an import block, one test file, the core index and the entity snapshotter, both sides kept.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: refactor/map-feature-link (phase/3 merges 1145cf6b and 67dbae61)

Phase 3 / GL-16 · refactor/map-feature-link · sholtzman + Claude Code (GAME-LOOP-AND-POST-GAME-66, -67 and -68)

- What was done: PR #129 was conflicting again. Merged `phase/3-sprint-3-work` at 1145cf6b as
  `bde73aeb` (six conflicts: the import block of `MatchBridge.ts`, both sides' names kept;
  `last-reviewed` in architecture 03, 13 and the game-loop plan, the newer date kept; the owner
  decisions log, both 2026-11-15 batches kept; `PROGRESS.md`, both sides' entries kept). phase/3
  then moved twice (e29ecec5, then 67dbae61), so one more merge takes 67dbae61 (#83, #104, #131,
  #118, #128, #142, #145, #132). Six conflicts, and both sides are kept in each.
  `StateHasher.test.ts`: this branch's map-feature link test and #131's two granted-level tests
  stood at the same place; all three are kept. `packages/core/src/index.ts`: the type export
  list has this branch's `FeatureKeyedGroup` and #132's `GemSnapshot`. `EntitySnapshotter.ts`:
  the snapshot reads this branch's `MapFeatureLink` and #132's `CathedralGemState`.
  Architecture 04, the family table: the Structure row has this branch's `MapFeatureLink` text
  and #132's `cathedral-gem` kind. Architecture 15: `last-reviewed` keeps the newer date.
  `PROGRESS.md`: phase/3's entries first, this branch's two GL-16 entries at the end. One fix
  that git did not flag: #132 made `EntitySnapshot.gem` a required field, so the `zoneSnapshot`
  helper of `MatchBridge.test.ts` (this branch's test code) now sets `gem: null`. After each
  merge the branch differs from phase/3 in the same 38 files as before, plus this entry, the
  `INBOX.md` card below and one line of `Match.lifecycle.test.ts`. `package-lock.json` has
  phase/3's content.
- Critic (`architecture-reviewer`) on the 67dbae61 merge: approve with nits, 0 blockers. #132's
  gem is built from the Cathedral feature, so it now carries a `MapFeatureLink` to the feature
  the Cathedral zone names. The gem carries `health` and the zone carries `capture`, so
  `map-feature-groups-unique` holds, and no HUD tile changes (tiles are for team features; the
  Cathedral is neutral). Applied: "its planned structure" now reads "its gem structure" in
  `MapFeatureLink.ts`, `Snapshot.types.ts`, architecture 13 §10 and a `MatchBridge.test.ts`
  comment; the `Match.lifecycle.test.ts` structure-tile test reads only entities that carry
  `health` (DEC-233), because the zone's `null` overwrote the gem's health there. Not applied:
  a gem-shaped fixture in the `MatchBridge.test.ts` DEC-233 test (the test needs any structure
  with health on the feature); a sentence in the 07 gem note that the gem is the feature's
  `health` carrier (07 already tells the planned `Cathedral` building's PR to change the spawn
  link, and the invariant fails a second carrier). Its better-than-design item (the gem finds
  its zone by feature id, not by position) is owner card HC-B47.
- Checks run: `npm run check` → `EXIT=0` on the merge tree `fae6f116` (core 1837, protocol 31,
  client 2192, server 163 tests; docs check passed). After it only this line changed; Prettier
  and the docs check pass on it. The `Match.lifecycle.test.ts` line has no fail-first break: it
  narrows a test's lookup, and the test passes with and without it.
- Next step: the coordinator checks the push script and Sam pushes; claudiodh's review asked
  only for the merge and a green run.
