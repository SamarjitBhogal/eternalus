---
title: 'Progress 2026-11-23: feat/cathedral-gem-hittable (#132 R7 N3)'
description: 'Phase 3 / sprint 3 work, Aryan Walanj + Claude Code: R7 nit N3 on #132: the scoring is loaded once and the gem kill window is passed into the pipeline.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: feat/cathedral-gem-hittable (#132 R7 N3)

Phase 3 / sprint 3 work · feat/cathedral-gem-hittable · Aryan Walanj + Claude Code

- What was done: R7 nit N3. `Simulation` loads the scoring once and passes its assist window to
  `DefaultSystemPipeline` (new optional `assistWindowTicks`; the shipped `SCORING`'s window when
  omitted, as the pipeline tests build it). Test: with a window of 0 the same gem death is
  nobody's kill; red when the pipeline ignores the option.
- Checks run: `npm run check:quick` and the kill credit tests; the full check is left to CI on the
  push (the local full run times out on this machine, see the 19:00 entry).
- Next step: push, then swholtzman re-reviews #132.
