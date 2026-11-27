---
title: 'Progress 2026-11-27: feat/loadout-per-legend (DEC-418)'
description: "Phase 3, sholtzman + Claude Code: built the owner's v103 loadout answers on PR #179: core finds a Legend's class, the saved loadout is the nested SavedLoadoutDtoV1, and the docs match."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/loadout-per-legend (DEC-418)

Phase 3 / sprint 3 work · feat/loadout-per-legend (stacked on PR #141) · sholtzman + Claude Code (MEMORY-CLEANUP-17 to -20)

- What was done: built DEC-418 (the owner's v103 answers, "Loadout per Legend"). (2) Core finds a
  Legend's class: `Loadout.specId` is `string | null`, `autoBuildLoadout` takes the Legend id, the
  new `LegendOfClassRule` checks that the Legend belongs to the class, and `classDefaultLoadout`
  (core-internal) gives a bot its class default. The client no longer reads a Legend's class.
  (1) The saved record is the nested `SavedLoadoutDtoV1` of 14 §7 (`LoadoutDto.ts` moved to
  `SavedLoadoutDto.ts`): `name` is `null`, `updatedAt` comes from the repository's `now()`, and the
  slots are in `loadout`. (3) ERROR was already built, so only the docs changed. No released build
  saved loadouts, so the layout changed in place with no `schemaVersion` bump. Dev browsers that
  ran this branch hold flat records. The validator now refuses them, so they are quarantined and
  fall back to the auto-build. The docs match: 05 §12 and §18, 14 §14, 15 §4, the glossary,
  reference 15 (CD-13, CD-41), the phase 4 plan, `INBOX.md` and the DEC-418 batch in the owner
  decisions log. 41 deliberate breaks proved the new tests red.
- Pre-PR critic fixes: a rejected human loadout falls back to its Legend's auto-build when the
  Legend is of the spawned class, else to the class default (05 §12), and the `loadout-rejected`
  event gives the `givenSpecId`. The docs no longer say that a bot has no Legend: core's bot
  roster slot carries none yet, and the phase 4 plan schedules the fix. `PersistenceController`
  takes and returns the domain type `PersistedLoadout` again; `LoadoutRepository` maps it to and
  from the stored `LoadoutDtoV1` and keeps its own clock. 14 §7 and §8 keep the design text: the
  slots without class and Legend, and the missing mappers, are a better-than-design item in
  `INBOX.md`. 7 more deliberate breaks proved the new tests red.
- Critic round 2 fixes: `Simulation` takes the Legends as the injected option
  `SimulationOptions.specs` (default `LEGEND_SPECS`), and `loadout-rejected` also gives the
  `usedSpecId`. The core function `loadoutOfLegend` is a phase 4 plan task that waits for the
  owner's sign-off (`INBOX.md` item (3)). 2 more deliberate breaks proved the new tests red.
  Critic round 3: no blockers; its doc fixes are in.
- Not done: the class and Legend select-screen text and the interim icons (DEC-418 (1), second
  half). They wait for three owner questions on the Owner Calls page.
- Checks run: `npm run check` EXIT=0 on tree `fc5e8cc2`: core "Tests 1968 passed (1968)", protocol "Tests 31 passed (31)", client "Tests 2403 passed (2403)", server "Tests 163 passed (163)", "Documentation check passed."
- Next step: push through the coordinator, update the PR body, wait for CI. Build the
  select-screen text when the owner answers the three questions.
