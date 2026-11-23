---
title: 'Progress 2026-11-23: feat/melee-sweeps (PR 2 owner answers, DEC-344)'
description: 'Phase 4 / sprint 4.4 lane A PR 2, sholtzman + Claude Code: recorded the Owner Calls v68 answers to busy-minion-building, HC-Q87, HC-Q88 and HC-B35 as DEC-344, ticked the INBOX items and added HC-Q104; no behaviour change.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/melee-sweeps (PR 2 owner answers, DEC-344)

Phase 4 / sprint 4.4 · feat/melee-sweeps · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-60)

- What was done: recorded the owner's Owner Calls v68 answers (2026-11-23) for PR 2 as DEC-344,
  a new top batch in the decisions log. (1) `busy-minion-building`: A, as built (a minion that
  hits a building is not fighting). (2) HC-Q88: A, as built (ability hits count as attacks).
  (3) HC-B35: B, sign-off; the two rejected critic items are built in lane A's next PR after
  PR 2. (4) HC-Q87: the owner's note (the Stronghold's walls and throne take its damage; floors
  and furniture do not); not built here, asked as HC-Q104. Appended correction notes to DEC-322,
  DEC-326 and DEC-333. `INBOX.md`: ticked `busy-minion-building`, HC-B35 and HC-Q88; HC-Q87 stays
  open with the answer; added HC-Q104. DEC-344 citations in `LeashBehaviour.engage`,
  `CastInstance`, architecture 11 §4.3 and 18 §6.1. Comments and docs only; no behaviour change.
- Checks run: `npm run check` on the working tree before this line was filled in →
  `CHECK_EXIT=0` (format "All matched files use Prettier code style!", core 356 files / 2315
  tests, protocol 1 / 31, client 315 / 2209, server 21 / 85, "Documentation check passed.";
  `eternalus-agent-work/abilities/pr2-sweeps/logs/60-check-dec344.log`). Pre-commit hook
  (`check:quick`) on the commit.
- Next step: push script to the coordinator; new SHA to PR 4 (PR-REVIEW-ASSIST-36) and PR 9
  (PR-38-HELPER-51). Then the HC-Q89 PR on PR 4 (DEC-345) and the HC-B35 follow-up PR.
