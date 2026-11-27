---
title: 'Progress 2026-11-27: feat/cathedral-eruption-boss (Owner Calls v103, DEC-415)'
description: 'Phase 3 / Cathedral, swholtzman reviewer + Claude Code: the owner answers for the eruption blast, the cut-scene reach and the corner boss health (DEC-415); the corner boss takes the shared boss health, 8,188.'
audience: [humans, agents]
status: active
owner: Aryan976503
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/cathedral-eruption-boss (Owner Calls v103, DEC-415)

Phase 3 / Cathedral · feat/cathedral-eruption-boss (PR #160), on `7993b4b5` (R6 S1) · swholtzman
reviewer (PR-REVIEW-90_91-22) + Claude Code

- What was done: recorded the owner's v103 answers for PR #160 as DEC-415. The blast (every unit,
  no kill credit) and the 50 m cut-scene reach stay as built; their comments now cite DEC-415.
  `CORNER_BOSS.baseHealth` is now `Math.round(10 × refHealth(4))` = 8,188 (was 8,200), as the
  capture point boss's. `bossReference.test.ts` checks it and failed before the change ("expected
  8200 to be 8188"). The `INBOX.md` blast item and the corner boss question are closed; doc 07's
  implementation status cites DEC-415. Critic: approve; its should-fix items and nits are applied.
  Ponytail: one cut proposed (one test assert instead of two), rejected: the literal pins the
  owner's 8,188.
- Checks run: `npm run check` on `7993b4b5` (R6 S1): exit 0 (core 1947 tests in 321 files,
  protocol 31, client 2279, server 163; build; docs check, 214 files). On this commit: exit 0
  (core 1947 tests in 321 files, protocol 31, client 2279, server 163; build; docs check, 215
  files).
- Next step: the push script for both commits goes to the coordinator; then #164 merges this head.
