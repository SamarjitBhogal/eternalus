---
title: 'Progress 2026-11-25: feat/tower-orbs (DEC-366 the owner answers the orb cards)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: DEC-366 records the six tower-orb answers, and the lane-tower reach changes from 26 m to 30 m.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/tower-orbs (DEC-366 the owner answers the orb cards)

Phase 4 / sprint 4.2 · feat/tower-orbs · sholtzman + Claude Code (PR-REVIEW-ASSIST-44)

- What was done: the owner answered the six orb cards (Owner Calls version 97). DEC-366 records
  them. Five answers match the built option A. The range answer does not: the owner chose 30 m,
  not the recommended 26 m. `LANE_TOWER_REACH_FROM_CENTRE` is now 30. The longest orb flight is
  30 m at 20 m/s, 1.5 s, and the 14 m lead margin of the orb range cap still covers it. The `TUNE`
  notes on the answered values now cite DEC-366. INBOX HC-Q96 to HC-Q100 and the card "ORB flight
  over cliffs" are closed. The lane-tower tests check a target at 28 m, 29 m and 30 m and one past
  30 m.
- Docs edited: DEC-366 in `docs/reference/game-design/13-owner-decisions-log.md`; INBOX; architecture
  05 §10, 07 §13, 10 §12, 11 §10 (pending citations now cite DEC-366); balancing.md.
- Checks run: the lane-tower tests fail with the constant at 26 and pass at 30
  (`eternalus-agent-work/tower-orbs/fail-first-dec366.md`). `npm run check` on the tree before this line was filled in: `EXIT=0` (Prettier clean, core 378
  files / 2517 tests, protocol 1 / 31, client 316 / 2225, server 21 / 85, "Documentation check
  passed."; `eternalus-agent-work/tower-orbs/check-dec366.log`).
- Next step: the owner runs the push script; the PR can merge once CI is green.
