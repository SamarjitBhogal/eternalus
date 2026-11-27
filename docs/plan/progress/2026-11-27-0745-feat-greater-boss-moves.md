---
title: 'Progress 2026-11-27: feat/greater-boss-moves (the Greater Boss reward, DEC-371 E8 and DEC-416)'
description: 'Phase 3 / Cathedral, swholtzman reviewer + Claude Code: the Greater Boss kill pays its team 2.5 levels and its last hitter 5, each keeping its share of its level; a minion or tower last hit pays the team Legend that hit last.'
audience: [humans, agents]
status: active
owner: Aryan976503
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/greater-boss-moves (the Greater Boss reward, DEC-371 E8 and DEC-416)

Phase 3 / Cathedral · feat/greater-boss-moves (PR #164), on the #160 S1 merge `96ddc1a0` ·
swholtzman reviewer (PR-REVIEW-90_91-22) + Claude Code

- What was done: built R4's E8a to E8c and recorded DEC-416. `XP_SOURCES.teamKills['greater-boss']`
  is `{ levels: 2.5, lastHitterLevels: 5 }`. `Progression.xpToAdvance` moves a Legend that many
  levels and keeps its share of its level (E8a). The last hitter is the killing Legend, or after a
  minion's or tower's last hit its team's Legend that hit last (`LastLegendHits`, kept by
  `KillCredit`). A waiting Legend is owed its share (E8c). New tests failed before the change, and
  four deliberate breaks (no share kept, no last hitter, killer only, owed `levels` dropped) each
  turned one or more red. INBOX reward item closed; docs 05, 07 and 12 updated.
- Checks run: `npm run typecheck` exit 0; eslint on the changed files exit 0; vitest on core
  systems, combat, state, match, content, components, commands, ai, config, entities, diagnostics
  and `index.test.ts`: 246 files, 1540 tests passed. Full `npm run check`: not yet run.
- Next step: full check, critic and ponytail; then the push script with the #160 merge.
