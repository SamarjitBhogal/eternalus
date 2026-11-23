---
title: 'Progress 2026-11-23: refactor/query-injection (pre-PR gate)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: HC-B35 follow-up through critic round 1 and the ponytail review; one injected TargetQuery and narrow query types (DEC-359, HC-B39); no behaviour change.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-23
tags: [plan, progress, log]
---

# Progress 2026-11-23: refactor/query-injection (pre-PR gate)

Phase 4 / sprint 4.2 · refactor/query-injection · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-61 and its runners)

- What was done: the pre-PR gate on `ee43e854`. Critic round 1: PASS, no blockers
  (`eternalus-agent-work/abilities/hc-b35/critic-r1.md`). Fixes `59160098`: B35-R1-2 and B35-R1-3
  built under the standing rule (one `TargetQuery` that the pipeline injects into `HitEffects`
  and `AbilitySystem`; `Pick<...>` types for the injected queries), DEC-359, `INBOX.md` HC-B39
  (Owner Calls v81); B35-R1-1 (a dated note in architecture 11), B35-R1-4, -5, -6 (the in-place
  edits to the PR 2 note in 05 reverted; a new dated note), -7, -8, -9. B35-R1-10 needs no action.
  Ponytail: no cuts (`hc-b35/ponytail-r1.md`); P1 rejected (the pipeline's optional defaults are
  its existing pattern, critic B35-R1-7), P2 and P3 rejected (no change needed).
- Checks run: `npm run check` → `CHECK_EXIT=0` (core 356 files / 2315 tests, protocol 1 / 31,
  client 315 / 2209, server 21 / 85, "Checked 143 Markdown files under docs." "Documentation check
  passed."; `eternalus-agent-work/abilities/hc-b35/logs/61-final-check.log`, on the tree of this
  commit).
- Next step: push and open the PR on base `feat/melee-sweeps` (#159) through the coordinator,
  after #159's `fabe45ad` is on origin. HC-B39 waits on the owner's sign-off.
