---
title: 'Progress 2026-11-23: feat/wall-turrets (critic rounds 4 and 5 fixes)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: PR 4 fixes the delta critic findings on the DEC-341 work: ruins per wall piece, turret XP tests, event definitionId (HC-B38), owner card HC-Q106.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/wall-turrets (critic rounds 4 and 5 fixes)

Phase 4 / sprint 4.2 · feat/wall-turrets · sholtzman + Claude Code (PR-REVIEW-ASSIST-38 and -39)

- What was done: `eafdf085` fixes the round 4 delta critic findings. A ruined body (it still
  blocks) draws one ruin per footprint polygon, so a fallen tower's fort keeps the shape of its
  walls; a destroyed body draws one ruin over its whole box. `isDestroyed` in the client views is
  now `isFallen`. The XP tests check that each `destroyerOnly` key is a structure id and that the
  turret reward is worth 2 to 3 heavy-minion kills. DEC-341 (3) records the exception to DEC-190,
  and owner card HC-Q106 asks whether to keep 2 levels (built) or cap at 1. The
  `structure-destroyed` event carries `definitionId` (HC-B38 (1), coordinator ruling). This
  commit fixes the round 5 findings: architecture 03 event table, 06 dated entry (moved into date
  order, ruins per piece), 07 pointer to 05 §18, INBOX HC-B38, and HC-B38 (5): `WorldObjectsView`
  picks one ruin look per fallen object and uses it to cull and to draw. Fail-first 113 to 124
  (`eternalus-agent-work/wall-turrets/fail-first.md`).
- Checks run: `npm run check` → `EXIT=0` (core 371 files / 2470 tests, protocol 1 / 31, client 315 /
  2213, server 21 / 85, "Documentation check passed."; `eternalus-agent-work/wall-turrets/check-10.log`,
  on the tree of this commit before this line was filled in).
- Next step: push through the coordinator (fast-forward of #163, new PR body). Then the tower-orb
  PR (DEC-342), stacked on #163.
