---
title: 'Progress 2026-11-26: feat/shots-over-lava, fold unit U1'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: local fold B1 of PR 3 and HC-Q104 into #169, and the renumber DEC-373 to DEC-386 and DEC-374 to DEC-387.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/shots-over-lava, fold unit U1

Phase 4 / sprint 4.2 · feat/shots-over-lava · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-76)

- What was done: merged PR 3 (`feat/start-weapons` c4ded563) and HC-Q104
  (`feat/palace-stronghold-pool` 983fcd3f) into #169 (08c2f691), no conflicts. Renumbered
  DEC-373 to DEC-386 and DEC-374 to DEC-387 in every file except the progress entries, because
  phase/3 used DEC-373 (#84) and DEC-374 (#170) the same night. The owner decisions log has a
  dated note on each renumbered batch. The renumber diff is a pure substitution (139 lines, checked
  by reversing it).
- Checks run: `npm run check` → EXIT=0 (06:37Z to 06:49Z, on this tree without this entry): core 382 test files, 2579 tests passed; client 315 test files, 2218 tests passed; "Documentation check passed."
- Next step: push feat/shots-over-lava as a fast-forward (coordinator script), then hand the head
  to PLAYER-STACK-FOLD-1 for U2 (#168 and wall-turrets).
