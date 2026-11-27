---
title: 'Progress 2026-11-27: fix/tower-orbs-windows-timeout (#168 Windows timeout)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: the Duel test takes one snapshot per tick and WorldObjectStore.blockingAt searches a lazy grid, so the #168 Duel test fits the CI limit; DEC-400 and the HC-B42 sign-off recorded.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: fix/tower-orbs-windows-timeout (#168 Windows timeout)

Phase 4 / sprint 4.2 · fix/tower-orbs-windows-timeout (local, on feat/tower-orbs `006ee78e`) ·
sholtzman + Claude Code (PLAYER-STACK-FOLD-1 and -2)

- What was done: the #168 Duel test "ends the match for the first team to reach the kill target"
  timed out on windows-latest (61.6 s, limit 60 s). It was slow on every head before #168 too.
  (a) `fightUntil` in `Simulation.duel.test.ts` takes one whole-map snapshot per tick, not two.
  (b) `WorldObjectStore.blockingAt` searches a lazy grid of record boxes (cell size in
  `WorldObjectStore.constants.ts`), rebuilt when the record count changes; the earliest record
  in placement order still wins, and a non-finite or huge circle checks every record. No
  timeout was raised and no test was skipped.
- Docs edited: decisions log DEC-400 (HC-Q114 = A, Owner Calls v103) and the HC-B42 owner
  sign-off on the DEC-362 row; INBOX HC-B42 and HC-Q114 ticked; architecture 10 §12 status note
  (the second grid; one shared box grid is a better-than-design item for sign-off).
- Checks run: four new grid tests each failed on a deliberate break first
  (`eternalus-agent-work/abilities/fold-plan/u2/fail-first-grid.md`); `npm run check:quick`
  passed at each commit. Interleaved timing: (a) 13.85 s to 10.27 s; micro-bench (b) 1.73 s to
  0.15 s with the same answer at 193,600 probes. Pre-PR critic: ready, no blockers; nits fixed.
  The full `npm run check` result is in the entry of the wall-turrets fold
  (`chore/wall-turrets-fold`).
- Next step: merge this branch and the U1 head into the wall-turrets fold; lane A pushes the
  stack.
