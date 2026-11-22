---
title: 'Progress 2026-11-22: feat/vanguard-kit (phase/3 e2a4fd66 merge)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: merged #123 f08cb7d0 (phase/3 e2a4fd66) into PR #136 for the demo; 13 conflicts kept both sides; merge critic approved; full check passed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/vanguard-kit (phase/3 e2a4fd66 merge)

Phase 4 / sprint 4.2 · feat/vanguard-kit · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-53, -54)

- What was done: merged `feat/ability-framework` `f08cb7d0` (PR #123 with `phase/3-sprint-3-work`
  `e2a4fd66`) into PR #136 in `0fd622df`. 13 conflicts, each keeps both sides (the commit
  message lists them). Scoring: `createDefaultScoringRules` takes phase/3's loaded
  `ScoringOptions` (DEC-287) and #136's event bus, so `LegendDeathRule` still announces
  assist-earned (DEC-272). One semantic fix: phase/3's UE-03 test in
  `buildDisplayCatalogue.test.ts` passes #136's required `drawnStatusIds: []`. First entry of
  this branch after the DEC-277 cut-over, so earlier entries stay in `PROGRESS.md`. Merge critic
  (`architecture-reviewer`): approve, no blockers; its should-fix was this entry. Its nit (the
  merge commit message says "five tests" but names four) stays as history.
- Checks run: `npm run check` on `0fd622df` → `EXIT=0` (core 331 files / 2047 tests, protocol
  1 / 30, client 312 / 2187, server 21 / 84, "Documentation check passed.";
  `eternalus-agent-work/abilities/remerge-e2a4fd66/check-136.log`); `npm run docs:check` on
  this entry; pre-commit hook on commit.
- Next step: this head merges into #148 (`feat/ranged-attacks`) and then PR 2
  (`feat/melee-sweeps`); the owner pushes #123, #136 and #148 (PR 2 stays local until its gate).
