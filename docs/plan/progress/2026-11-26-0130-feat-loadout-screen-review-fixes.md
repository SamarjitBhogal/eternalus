---
title: 'Progress 2026-11-26: feat/loadout-screen (review fixes, critic round)'
description: 'Phase 3, sholtzman + Claude Code: PR #141 reviewer fixes on the branch, merge of 62c3bd2f, and the critic fixes to docs, TSDoc and one test name.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/loadout-screen (review fixes, critic round)

Phase 3 / sprint 3 work · feat/loadout-screen · sholtzman + Claude Code (MEMORY-CLEANUP-8 to -10)

- What was done: the reviewer fixed the PR #141 review findings on the branch (Sam's rule of
  2026-11-25), on top of claudiodh's head:
  - `LoadoutSlot` names the slot union; `LoadoutField` is `'class' | LoadoutSlot`, and
    `repairLoadout` returns `LoadoutSlot`s (DEC-354 (3) (b)).
  - A refused spawn loadout is the `loadout-rejected` diagnostic event, logged through `Logger`
    (DEC-354 (3) (c)).
  - A test shows that a human-slot replay diverges at tick 0 when its loadout is dropped.
  - `main.tsx` stays on `MemoryStorageAdapter` (claudiodh's `86ffa5d0`, DEC-354 (5)). The
    optional fallback is a `StorageFallback` (`build`, `reportError`): the switch to memory
    goes through `reportError`, not the WARN reporter.
  - The locked view shows "Weapon: <name>" again, with a test of the visible text.
  - Two merges of claudiodh's branch (`9bba77ce`, then `62c3bd2f`, which holds phase/3
    `67dbae61`). One conflict each time, in the owner decisions log; a content check found
    every line of both parents in the result.
  - The pre-push critic (correctness) found eight items. Accepted 1 to 6 and 8: the test name
    says `reportError`, not ERROR; `LoadoutSlot` and `repairLoadout` cite DEC-354 (3); the
    `DiagnosticEventMap` sketch in architecture 15 §4 has `loadout-rejected`; architecture 14
    §14 and the `INBOX.md` note say that `reportError` writes an ERROR record only once
    `main.tsx` passes the fallback. Rejected 7 (the `loadout-rejected` record has a null tick):
    this PR did not cause it. The ponytail review found nothing to cut.
- Tests proven by a deliberate break (one vitest file each, the file restored after):
  `repairLoadout` matching the wrong slots turned 1 test red in `loadoutApi.test.ts`; the event
  named `command-rejected` turned 1 red in `Simulation.human.test.ts`; a human slot that ignores
  its loadout turned 3 red there, the replay test among them; a fallback that skips
  `reportError` turned 1 red in `FallbackStorageAdapter.test.ts` and 1 in
  `PersistenceController.test.ts`; "Recommendation:" in place of "Weapon:" turned 1 red in
  `LockedSelectStep.test.tsx`.
- Checks run: `npm run check` EXIT=0 on `e85d552a` plus this commit's changes, after `npm ci`
  (core 1868, protocol 31, client 2281, server 163 tests passed; docs check passed).
- Next step: push through the coordinator; then the follow-up PR `feat/loadout-per-legend`
  (DEC-354 (1), (2), (4), (5) and the fallback wiring with its test).
