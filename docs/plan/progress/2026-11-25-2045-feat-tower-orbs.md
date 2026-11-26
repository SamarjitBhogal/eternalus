---
title: 'Progress 2026-11-25: feat/tower-orbs (critic round 4 fixes)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: the lead-margin test covers the wall turret and both lane towers at the edge of their reach; DEC-366 and DEC-342 text fixed; a new owner card.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/tower-orbs (critic round 4 fixes)

Phase 4 / sprint 4.2 · feat/tower-orbs · sholtzman + Claude Code (PR-REVIEW-ASSIST-46)

- What was done: critic round 4 (on `a85f1dd9`) approved with should-fix items. The lead-margin
  test now stands the target at the edge of the reach, not 0.1 m inside, and runs for every
  turret carrier (wall turret, spawner tower, buff tower) against the cap of each ammo it holds.
  It replaces the lane-tower-only test of the entry `2026-11-25-1935-feat-tower-orbs.md`. The
  test fixture exports its tick rate. The orb and bolt cap comments point to the test and do not
  copy Legend speeds. The lane-tower window and override cite DEC-366.
- Docs edited: DEC-366 (the false "longest flight 1.5 s" sentence is replaced; the window and
  override fields are named), DEC-342 (a dated note: DEC-366 answers (2) and (4)), INBOX (new
  question HC-Q114: an orb can land past 30 m).
- Checks run: with the orb margin at 20.8 m and the heavy-bolt cap at 34.5 m, all three test
  cases fail (34.58 > 34.5; 50.88 > 50.8); restored, they pass
  (`eternalus-agent-work/tower-orbs/fail-first-lead-margin.md`). `npm run check` on the tree before this line was filled in: `EXIT=1`.
  Every step passed (Prettier clean, core 378 files / 2520 tests, protocol 1 / 31, client 316 /
  2225, server 21 / 85, build) except the last, `docs:check`: this entry's title did not match
  its H1. The title is fixed; `npm run docs:check` and Prettier then passed
  (`eternalus-agent-work/tower-orbs/check-r4.log`, `docs-recheck-r4.log`).
- Next step: the owner runs the push script and answers card HC-Q114 (the PR does not wait on
  it).
