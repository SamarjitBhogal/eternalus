---
title: 'Progress 2026-11-24: feat/greater-boss-moves (phase/3 merge with #130, defenders off the gem)'
description: 'Phase 3 / sprint 3.6, Aryan Walanj + Claude Code: merged phase/3-sprint-3-work (39717a6b, PR #130 checkpoint defenders) into #164; defender posts keep clear of the Cathedral gem; review R2 nits.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-24
tags: [plan, progress, log]
---

# Progress 2026-11-24: feat/greater-boss-moves (phase/3 merge with #130, defenders off the gem)

Phase 3 / sprint 3.6 · feat/greater-boss-moves · Aryan Walanj + Claude Code

- What was done:
  - Merged `phase/3-sprint-3-work` `39717a6b` (PR #130, checkpoint defenders). Six conflicts, each
    resolved by keeping both sides: `mobCatalogue.ts` (assist mobs and the Greater Boss),
    `guardLeash.ts`, `SpawnSystem.ts` (the boss summon and the checkpoint queue), docs 07 and 18
    (`last-reviewed`) and `PROGRESS.md`. `PostLayout.firstTick` is `number | null`, as the
    gem-eruption posts are filled by `activate`.
  - The merge made #132's Cathedral gem and #130's defenders meet: the defenders' posts (2 m from
    the centre) stood inside the gem's 5 m touch circle, so the gem burned them. `GuardRoster.defend`
    now keeps its posts clear of every structure standing in the zone (`clearGuardPost`'s
    `keepOut`); other guard posts are unchanged. New `GuardRoster` test; it fails without the
    fix. Doc 18 §6 says so.
  - Tests whose Legend stands in the Cathedral zone now clear its defenders
    (`clearCheckpointDefenders`, #130's fixture): the Greater Boss fixture, `CathedralGem.test.ts`
    and the bots' push test. The DEC-261 capture test runs at an outer capture point, as a
    defender chasing a Legend still brushes the gem; its assertions are unchanged.
  - Review R2 nits: the two comment lines over 100 characters are wrapped.
- Checks run: `npm run check` exit 1, timeouts only: core "Test Files 3 failed | 289 passed
  (292)", "Tests 5 failed | 1808 passed (1813)" (`Simulation.modifiers`, `Simulation.flowFields`,
  `Simulation.duel`: "Test timed out"); protocol "Tests 29 passed (29)", client "Tests 2098
  passed (2098)", server "Tests 114 passed (114)". The three timed-out files with
  `--maxWorkers=2`: "Tests 14 passed (14)". `npm run docs:check`: "Documentation check passed."
- Next step: CI on the push. Still open: B1 (the owner: #164 or #161), S1 (the push API with #123),
  the PR description (head and checks) and a code owner's review. #132 and #160 meet the same
  merge when they are updated.
