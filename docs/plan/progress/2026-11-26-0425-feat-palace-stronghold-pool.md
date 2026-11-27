---
title: 'Progress 2026-11-26: feat/palace-stronghold-pool (HC-Q104, DEC-373 (1))'
description: "Phase 4 / sprint 4.2, sholtzman + Claude Code: the Stronghold's outer walls and throne share its health; the inner ring and the room walls keep their own; records and the full check."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/palace-stronghold-pool (HC-Q104, DEC-373 (1))

Phase 4 / sprint 4.2 · feat/palace-stronghold-pool · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-67, -68)

- What was done: `INBOX.md` HC-Q104 built (owner answer B, DEC-373 (1)): the outer wall ring and
  the throne carry `MapObject.partOf` and are the Stronghold's body (one pool, the fort path); the
  inner ring and the room walls keep their own health. `Outline` has `walkOn` and `solid` lists.
  After the fall each body object stays a ruin that blocks (the fort rule, DEC-341). Commits
  `7b472a9a`, `516a335f`; takeover: two tests that were missing (a shot and a bot's line of fire
  over a mixed outline) and a TSDoc name fix. Records: DEC-373 addendum, 07 §13 note, HC-Q104
  ticked. Breaks B1 to B15: `eternalus-agent-work/abilities/hc-q104/breaks.log`.
- Checks run: `npm run check:quick` on the takeover tests: exit 0. Targeted vitest (6 HC-Q104
  files): 57 passed. Each break turned its test red; each file restored (`cmp`). The full
  `npm run check` runs on this docs commit: `hc-q104/logs/check-<sha>.log`, EXIT in the report.
- Next step: the orchestrator merges `feat/shots-over-lava` into this branch, then the pre-PR gate
  (critic, ponytail). The merge with #98 must decide the after-fall rule (DEC-373 addendum).
