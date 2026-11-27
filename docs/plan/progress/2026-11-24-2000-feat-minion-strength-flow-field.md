---
title: 'Progress 2026-11-24: feat/minion-strength-flow-field (phase/3 merge after #130)'
description: 'Phase 3 / minion plan gap (strength by flow-field distance), SamarjitBhogal + Claude Code: merged phase/3 39717a6b; the bot Push test runs on the two-lane map without the cathedral, whose new defenders made it fail.'
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-24
tags: [plan, progress, log]
---

# Progress 2026-11-24: feat/minion-strength-flow-field (phase/3 merge after #130)

Phase 3 / minion plan gap: minion strength by flow-field distance · feat/minion-strength-flow-field · SamarjitBhogal + Claude Code

- What was done: merged `phase/3-sprint-3-work` at `39717a6b` (after #130, M6b checkpoint
  defenders). One conflict: doc 18's `last-reviewed` (now 2026-11-24). After the merge,
  `Simulation.bots.test.ts` "hits the enemy structures on its lane" failed (no bot hit in 90 s).
  Cause: #130 puts neutral checkpoint defenders at the two-lane map's cathedral, on lane 0's bend.
  A bot they wound retreats to its tower and, with no out-of-combat healing yet (PR #86), never
  rejoins. On the base the other bot still reaches a tower; with this branch's strength curve the
  pushing bot is the wounded one. The test now runs on the same map without the cathedral, as it
  did before #130; the assertion is unchanged.
- Checks run: see the PR #82 comment for this round (`npm run check`, quoted verbatim).
- Next step: re-review. When PR #86 merges, the test can go back to the full map.
