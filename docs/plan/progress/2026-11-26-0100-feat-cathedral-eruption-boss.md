---
title: 'Progress 2026-11-26: feat/cathedral-eruption-boss (#160 R5, owner answers)'
description: "Phase 3 / sprint 3.6, Aryan Walanj + Claude Code: built DEC-370 to DEC-372 for #160 (cut-scene only near the Cathedral, the boss's capture lock, the eruption's blast, shared boss numbers) and S7."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/cathedral-eruption-boss (#160 R5, owner answers)

Phase 3 / sprint 3.6 · feat/cathedral-eruption-boss · Aryan Walanj + Claude Code

- What was done (swholtzman's R5, the owner's answers of 2026-11-26):
  - E4: `greater-boss` is in `ZONE_LOCKING_MOBS`; a scenario test shows the Cathedral locked,
    no checkpoint and so no defenders while the boss lives, and unlocked once it dies.
  - "BOSS guards": `GemEruptionSystem` (with the damage systems, before progression, spawn and
    death) kills every unit in the gem's capture zone on its pass after the eruption, as
    environment damage that credits no one. Unit and scenario tests.
  - E6: `content/mobs/bossReference.ts` holds `refHealth(level)` (balancing.md's 650 anchor,
    8% per level, compounding) and `HEAVY_MOB_BASE`; the Greater Boss (41,259) and the capture
    point boss (now 8,188) use them.
  - E1: `CathedralCutscene` plays only for a player whose living Legend is within
    `CUTSCENE.nearRadius` (50, TUNE) of the gem when it starts; `EruptionView` marks the burst on
    the minimap for everyone.
  - Docs: DEC-370, DEC-371, DEC-372 rows; INBOX items ticked, one new item (the blast's
    readings, "near", the corner boss's 8,200); 03, 07, 08 (S7) and 12 updated.
  - Critic (architecture-reviewer): FAIL on the pipeline-order test, plus should-fixes; all
    applied (order test, `GemEruptionSystem.test.ts`, "near" decided at the start, `refHealth`
    without the Warrior coupling, doc 12, INBOX corner boss line, nits). Not taken: a `Match`
    near-player integration test (no way to place the player near the gem from a client test;
    the unit test covers it).
- Checks run: `npm run check` exits 1 on timeouts only (other worktrees were loading the machine):
  core "Tests 3 failed | 1861 passed (1864)", each "Test timed out" (`replay`,
  `greaterBossSpawn.scenario`, `Simulation.flowFields`); client "Tests 2202 passed (2202)",
  server "Tests 163 passed (163)", protocol "Tests 31 passed (31)". The three files re-run with
  `--maxWorkers=2`: "Tests 24 passed (24)". Format, `check:no-js`, lint, typecheck and knip
  passed; `npm run build` exit 0; "Documentation check passed."
- Next step: push, ask swholtzman to re-review R5; #164 then merges this branch.
