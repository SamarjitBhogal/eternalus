---
title: 'Progress 2026-11-23: feat/cathedral-gem-hittable (#132 R7: T1, T2)'
description: "Phase 3 / sprint 3 work, Aryan Walanj + Claude Code: swholtzman's R7 on #132: a whole-pipeline kill credit test, the ally test without the friendly-fire step, two comment nits."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/cathedral-gem-hittable (#132 R7: T1, T2)

Phase 3 / sprint 3 work · feat/cathedral-gem-hittable · Aryan Walanj + Claude Code

- What was done: swholtzman's R7 on #132 (head `5e523b88`).
  - T1: `DefaultSystemPipeline.killCredit.test.ts` runs the match pipeline as a match builds it:
    a dark Warrior lands a hit on a light Warrior, which then swings at the gem with too little
    health for the burn; `entity-died` names the dark Warrior with the gem's burn as the source.
    Red with `KillCredit` given `[]` for the gem's status ids (R7's break), green without it.
  - T2: the "never credits an ally's hit" test builds its pipeline with no damage steps, so the
    ally's hit lands and only `KillCredit`'s team check stops the credit. Red with that check
    removed, green with it.
  - N1: the plinth's deliberate-shortcut note uses the repo's `ponytail:` marker. N2: the long
    comment lines in `gemBurn.ts` and `CathedralGem.ts` are wrapped to 100 columns.
  - N3 (load the scoring once) not taken: optional, and both reads agree today.
- Checks run: `npm run check` (Windows, Node from nvm) on the working tree **failed** twice, on
  timeouts only (no assertion failed), with the CPU held at 1.5 of 2.4 GHz. Last run:

  ```
  [core]   Test Files  9 failed | 279 passed (288)   Tests  12 failed | 1716 passed (1728)
  [client] Test Files  1 failed | 303 passed (304)   Tests  1 failed | 2083 passed (2084)
  every failure: "Error: Test timed out in 20000ms / 60000ms / 120000ms"
  ```

  The timed-out files, rerun on their own: core 11 files with coverage on two workers, 60 of 62
  passed and the other two (`Simulation.flowFields.test.ts` "5 lanes", `Simulation.duel.test.ts`
  "replays") timed out again; those two files without coverage: "Tests 11 passed (11)"; client
  `createBrowserMatch.replay.test.ts` and server `CoreDuelSimulation.test.ts`: passed. The
  changes since the green run on `5e523b88` are tests and comments only. Not done until a full
  check passes (CI on the push, or a local run on a faster machine).

- Next step: push, then swholtzman re-reviews #132. The Duel design stays a follow-up PR.
