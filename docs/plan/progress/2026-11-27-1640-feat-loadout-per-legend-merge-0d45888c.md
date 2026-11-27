---
title: 'Progress 2026-11-27: feat/loadout-per-legend (merge of feat/loadout-screen 0d45888c)'
description: "Phase 3 / sprint 3, sholtzman + Claude Code: PR #179, merged claudiodh's 0d45888c (his merge of phase/3 5f93e2a5 into PR #141, the base of PR #179)."
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/loadout-per-legend (merge of feat/loadout-screen 0d45888c)

Phase 3 / sprint 3 · feat/loadout-per-legend (PR #179) · sholtzman + Claude Code
(MEMORY-CLEANUP-22)

- What was done: claudiodh merged phase/3 `5f93e2a5` into `feat/loadout-screen` (PR #141, the
  base of this PR) as `0d45888c`. After that, GitHub showed this PR as conflicting. This merge
  commit takes `0d45888c`. Nine files conflicted. Each side added lines at the same place, and
  the result keeps both: the `combat: null` and `elevation: null` fields in two client test
  fixtures, the `Combat` and the `Jump`/`MapFeatureLink` imports and tests in
  `EntitySnapshotter.test.ts`, and `Combat` and `Jump` in the `EntitySnapshot` TSDoc. In
  `SpawnContextReader`, phase/3 removed `mapFeatureId()` (DEC-231 moved it to `MapFeatureLink`)
  and this branch rewrote the TSDoc of `loadout()` below it: the result drops the method and
  keeps the new TSDoc. In docs 03, 04 and 13, the `last-reviewed` date keeps the later one. In
  the owner decisions log, both sides added batches at the top: the DEC-418 batch comes first,
  then phase/3's, so the newest batch stays first. A line check found no line of either side
  lost, except the older dates.
  Two snapshot fixtures that phase/3 added (`AirborneView.test.ts` and the zone fixture in
  `MatchBridge.test.ts`) did not have the `combat` field that this branch added to
  `EntitySnapshot`. The merge adds `combat: null` to both.
- Checks run: `npm run check` EXIT=0 on tree `3ddcabb4`: core "Tests 2038 passed (2038)", protocol "Tests 33 passed (33)", client "Tests 2421 passed (2421)", server "Tests 165 passed (165)", "Documentation check passed."
- Next step: push through the coordinator, then wait for CI. PR #179 merges after PR #141
  (MORNING.md).
