---
title: 'Progress 2026-11-25: fix/legend-respawn'
description: 'Phase 3, claudiodh + Claude Code: CI fix for PR #100 after the phase/3 merge.'
audience: [humans, agents]
status: active
owner: claudiodh
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: fix/legend-respawn

Phase 3 / sprint 3 work · fix/legend-respawn · claudiodh + Claude Code

- What was done: CI was red after the phase/3 merge (`afb3f19f`). (1) Prettier: formatted
  `LevelMatchesXpInvariant.ts` (the Copilot Autofix commit `8231f75b` left it unformatted).
  (2) `Simulation.capture.test.ts` (DEC-261, from #130) expected no dark Legend 30 s after the
  capture; with this PR a dead Legend respawns after 10 s (FR-051), so the test now checks that
  every dark Legend that took the point died, not that none exists.
- Checks run: `npm run check` EXIT=0 (core 1735 tests, protocol 29, client 2081, server 114;
  "Documentation check passed.").
- Next step: `8231f75b` changes `LevelMatchesXpInvariant` behaviour (a respawn XP award to a
  Legend that died this tick is no longer a violation) with no test; it needs a test or a revert.
