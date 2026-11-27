---
title: 'Progress 2026-11-22: feat/map-work-forts-towers (DEC-324, merge of #122 after DEC-325)'
description: 'Phase 3, sholtzman + Claude Code: DEC-324 inside-bonus answers built; merged #122 f2f2b818 (#98 DEC-325, phase/3 e2a4fd66); five docs and fixture conflicts kept both sides; full check passed.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/map-work-forts-towers (DEC-324, merge of #122 after DEC-325)

Phase 3 / map work · feat/map-work-forts-towers · sholtzman + Claude Code

- What was done: DEC-324 (1), (2) built (`a8d2263c`): every hit on a lane tower from inside its
  fort gets the ×1.25 bonus, and the court is the box inside the wall band (`state/courtBoxOf`,
  `FORT_WALL_SIDE`), so doorways are outside. `96d4e7cb`: the DEC-324 row, INBOX HC-B21, HC-B23
  and HC-B24 answered, an architecture 05 §9 status note. Then merged #122 at `f2f2b818` (#98
  `c5ca08d9`: DEC-325; phase/3 `e2a4fd66`: #137 DEC-277, #139). Five files conflicted (03, 13
  log, PROGRESS.md, bugs.md, `minionControllerSetup.ts`); each keeps both sides. A line-multiset
  check against ours + theirs − base shows only the older `last-reviewed` lines dropped.
- Checks run: `npm run check` → exit 0 on the merge before this file was added: core "Tests 1837
  passed (1837)", protocol 29, client 2105, server 84, "Documentation check passed."
  (`eternalus-agent-work/dec-288/check-13.log`); then `prettier --check .` and
  `npm run docs:check` with this file.
- Next step: push map-work and open its PR, stacked on #122 (pushed at `f2f2b818`); its docs are
  in #147 (pushed at `ddd9a670`). The coordinator runs the push script.
