---
title: 'Progress 2026-11-22: feat/ranged-attacks (phase/3 e2a4fd66 merge)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: merged #136 (with #123 and phase/3 e2a4fd66) into PR #148 for the demo; three docs conflicts kept both sides; full check passed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/ranged-attacks (phase/3 e2a4fd66 merge)

Phase 4 / sprint 4.2 · feat/ranged-attacks · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-53, -54)

- What was done: merged `feat/vanguard-kit` `0fd622df` (PR #136 with #123 `f08cb7d0` and
  `phase/3-sprint-3-work` `e2a4fd66`) into PR #148 in `05dceecf`, then #136's progress entry
  (`7d0fd9a7`) in `25f5c45f`. Merge only, no feature change. Three files conflicted, docs only,
  each keeps both sides (the commit message lists them): the decisions log (phase/3's 2026-11-21
  batch above this branch's 2026-11-20 batches), `glossary.md` (the later `last-reviewed`) and
  `PROGRESS.md`. First entry of this branch after the DEC-277 cut-over, so earlier entries stay
  in `PROGRESS.md`. No merge critic ran: the merge changed no code beyond what #123's and #136's
  merge critics approved.
- Checks run: `npm run check` on `25f5c45f` → `EXIT=0` (core 348 files / 2184 tests, protocol
  1 / 31, client 314 / 2202, server 21 / 85, "Documentation check passed.";
  `eternalus-agent-work/abilities/remerge-e2a4fd66/check-148.log`); `npm run docs:check` on
  this entry; pre-commit hook on commit.
- Next step: the owner pushes #123, #136 and #148 (the coordinator checks the script); lane B's
  Hamstring branch, PR 4 (wall turrets), PR 8 (passives) and PR 9 (second weapon) take the pushed
  #148 head; this head merges into PR 2 (`feat/melee-sweeps`).
