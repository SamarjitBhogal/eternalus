---
title: 'Progress 2026-11-25: feat/cathedral-gem-hittable (#132: merge phase/3 with #107, #100, #109)'
description: 'Phase 3 / sprint 3 work, Aryan Walanj + Claude Code: phase/3 (1145cf6b) merged into #132, eight conflicts resolved keeping both sides.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/cathedral-gem-hittable (#132: merge phase/3 with #107, #100, #109)

Phase 3 / sprint 3 work · feat/cathedral-gem-hittable · Aryan Walanj + Claude Code

- What was done: merged `origin/phase/3-sprint-3-work` at `1145cf6b` (#107 developer menu, #100
  Legend respawn, #109 developer menu Legends; 59 commits). Eight conflicts, each resolved keeping
  both sides:
  - `DefaultSystemPipeline.ts` doc comment and doc 18's pipeline positions: `RespawnSystem` (#100)
    and `CathedralGemSystem` both listed, in the order the code runs them.
  - `Simulation.duel.test.ts`: #100's "never queues a fallen Duel Legend to respawn" test, and
    this branch's two-kill test with its timeout (the walker round the gem is unchanged).
  - `ProgressionSystem.test.ts`: both imports (`LIGHT_MINION`, `CATHEDRAL_GEM`).
  - Doc 03's event table: #100's wider "Emitted by" column and `legend-respawned` row, plus this
    branch's `damage-blocked` row and the gem as a `capture-point-owner-changed` listener.
  - `INBOX.md` and the decisions log: both sides' items and batches (DEC-346, DEC-355).
  - `last-reviewed`: the later date of the two sides.
- Checks run: `npm run check:quick` exit 0; `npm run docs:check` "Documentation check passed.";
  core tests for the Duel, `systems/`, `combat/`, `entities/structures/` and the Cathedral map:
  "Test Files 48 passed (48)", "Tests 345 passed (345)". The full check is left to CI on the push
  (the local full run times out on this machine, 2026-11-23 19:00 entry).
- Next step: push; CI runs on both systems; swholtzman's approval after the owner's sign-off.
