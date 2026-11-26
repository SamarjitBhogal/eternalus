---
title: 'Progress 2026-11-25: feat/tower-orbs (orb lead margin 14 m to 21 m)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: the orb range cap now covers the aim point on the fastest Legend at the 30 m reach; a test pins it.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/tower-orbs (orb lead margin 14 m to 21 m)

Phase 4 / sprint 4.2 · feat/tower-orbs · sholtzman + Claude Code (PR-REVIEW-ASSIST-46)

- What was done: correction to the entry `2026-11-25-1810-feat-tower-orbs.md`. That entry says
  the 14 m lead margin of the orb range cap still covers the 30 m reach. It does not. A Sentinel
  (9 m/s) that runs straight away from the edge of the reach gets an aim point 50.9 m from the
  tower centre (`predictiveAim` with the launch delay), and the cap was 44 m. The orb then landed
  short. The margin in `content/projectiles/towerOrb.ts` is now 21 m (cap 51 m). It stays `TUNE`
  (no reference value; the owner did not set it).
- Tests: a new lane-tower test takes the fastest Legend from the catalogue at full speed, 0.1 m
  inside the reach and running away, and checks that the aim point is inside the orb range cap.
- Docs edited: none. The docs name the lead margin as `TUNE` and do not copy its value.
- Checks run: the new test fails with the 14 m margin ("expected 50.71475000000001 to be less
  than or equal to 44") and passes with 21 m
  (`eternalus-agent-work/tower-orbs/fail-first-lead-margin.md`). `npm run check` on the tree before this line was filled in: `EXIT=0`
  (Prettier clean, core 378 files / 2518 tests, protocol 1 / 31, client 316 / 2225, server 21 /
  85, "Documentation check passed."; `eternalus-agent-work/tower-orbs/check-lead-margin.log`).
- Next step: the critic checks the branch; then the owner runs the push script.
