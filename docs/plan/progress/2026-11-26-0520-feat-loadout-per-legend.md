---
title: 'Progress 2026-11-26: feat/loadout-per-legend'
description: 'Phase 3, sholtzman + Claude Code: loadouts saved per Legend, the held weapon on the HUD, settings per group, fake-indexeddb, and IndexedDB turned on (DEC-354).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/loadout-per-legend

Phase 3 / sprint 3 work · feat/loadout-per-legend (stacked on PR #141) · sholtzman + Claude Code (MEMORY-CLEANUP-11, -12, -13)

- What was done: DEC-354 (1), (2), (4) and (5), in five slices.
  - S1: the IndexedDB adapter tests run on `fake-indexeddb` 6.2.8 (test-only, DEC-354 (4)); the hand-written fake is deleted.
  - S2: settings are one record per group, keyed `[profileId, group]`. The v1 keyPath changed in place, with no DB version 2, because no released build wrote it. **A dev browser that ran PR #141 must clear its site data.**
  - S3: a saved loadout is keyed by the Legend (`specId`), and the Loadout screen has a "Legend" radio group. Core stays keyed by class: the per-Legend start weapons come with the weapon PR.
  - S4: the HUD weapon slot shows the held weapon's picture (new snapshot group `combat.weaponId`, art keyed by weapon id), or an empty slot. This replaces the DEC-114 per-class and per-Legend art; the Colossus now shows the battle axe.
  - S5: `main.tsx` injects `IndexedDbStorageAdapter` through `game/createPersistence.ts`, with the memory fallback that logs at ERROR (`INBOX.md` "four points" (2): WARN or ERROR is still the owner's choice).
  - Docs: appended notes on DEC-57, DEC-62, DEC-101 and DEC-114; 14 §8 and 05 §12 name `LoadoutController` as the place of repair (DEC-354 (3) (a)).
- Tests proven by a deliberate break (one test file each, restored after): 32 breaks (S1 7, S2 4, S3 10, S4 8, S5 3), each red. For example: `loadoutKey` that ignores `specId` (2/7 red, "Paladin leaves Knight unchanged"); the settings keyPath back to `profileId` (10/12 red, and 1/2 in `createPersistence.test.ts`); the fallback at WARN, not ERROR (1/2 red); `selectHeldWeaponArt` always `wuuthrad` (2/2 red). Client coverage after S1: 97.04 % statements.
- Pre-PR gate: the architecture critic found no blockers; its should-fix items and nits are applied (the adapter test waits on IndexedDB's request queue, not a real timer, and the late-connection break is red again; 04 §10 and 17 R26 name the ids saves store; reference 08 puts `defaultLoadout` on the Legend; the phase 4 plan schedules the per-Legend auto-build and start weapons; 05 §12's sketch has `field`; one status note). The correctness critic found no blockers (20/20 mutations red). Ponytail: cuts 1, 2, 4 and 5 applied; 3 and 6 rejected. Two owner calls are open in `INBOX.md` ("two layout calls before saves reach players").
- Checks run: `npm run check` passed (exit 0) on the gate-fix tree: core 1869, protocol 31, client 2310, server 163 tests; docs check passed. Client coverage 97.06 % statements.
- Next step: the coordinator pushes the branch and opens the PR on `feat/loadout-screen` after PR #141's push.
