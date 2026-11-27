---
title: 'Progress 2026-11-23: feat/wall-turrets (DEC-341 owner answers)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: PR 4 builds the wall turret owner answers (DEC-341): XP only to the destroyer, the pylon stays as a ruin that blocks, ruins drawn for every structure body.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/wall-turrets (DEC-341 owner answers)

Phase 4 / sprint 4.2 · feat/wall-turrets · sholtzman + Claude Code (PR-REVIEW-ASSIST-36 and -37)

- What was done: the Owner Calls v68 answers on HC-Q90 to HC-Q94 (DEC-341). `29c04bee`: a
  destroyed wall turret pays 300 XP (`TUNE`) only to the Legend that lands the killing hit
  (`XP_SOURCES.destroyerOnly`). This commit: the pylon outlives its turret as a ruin that blocks.
  The remove-with-owner code (`isBodyRemovedWithIt`) is deleted. `WorldObjectStore.removed` marks
  every structure body ruined (`MapObjectSnapshot.isRuined`), and `WorldObjectsView` draws its
  ruins, so a fallen tower's fort also draws as ruins (coordinator option A). The Q90/Q93/Q94
  comments cite DEC-341. Docs: DEC-341 row, INBOX (Q90, Q91, Q94 done; Q92 team points and Q93
  arc shot open), architecture 05, 06, 07 §13, 11 §4.5, FR-073. Fail-first 108 to 112
  (`eternalus-agent-work/wall-turrets/fail-first.md`).
- Checks run: `npm run check` → `EXIT=0` (core 371 files / 2467 tests, protocol 1 / 31, client 315 /
  2210, server 21 / 85, "Documentation check passed."; `eternalus-agent-work/wall-turrets/check-8.log`,
  on the tree of this commit).
- Next step: delta critic on `80f2e2f4..`, then the push script through the coordinator. Then the
  tower-orb PR (DEC-342) with the arc shot of DEC-341 (4), stacked on #163.
