---
title: 'Progress 2026-11-22: feat/vanguard-hamstring (merge critic round 2 nits)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: merge critic round 2 approved with nits; fixed M2-1 to M2-4, recorded M2-5 as HC-B26 (6).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/vanguard-hamstring (merge critic round 2 nits)

Phase 4 / sprint 4.2 · feat/vanguard-hamstring · sholtzman + Claude Code (COMBAT-ABILITIES-LANE-2-19)

- What was done: the merge critic round 2 reviewed `584f9e20` and `056c272a` and gave "approve with nits" (no blocker, no should-fix; report `eternalus-agent-work/abilities/hamstring-merge-critic/r2-review.md`).
  - M2-1: a dated correction under `INBOX.md` HC-Q79: Veil ends through `StatusEffectSystem`, not `recordHits`; for (A), the three places that drop a hit on a body that takes no damage each send a contact event.
  - M2-3: the `AreaHitQuery.aimedBodyOf` and `isAimedByPoint` TSDoc say that a hidden unit does not count.
  - M2-4: 05 §18 "Hidden" and "Untargetable" rewrapped to 100 columns; the "near tie" sentence in "Launch" split into short sentences; `attack-aim` cites DEC-319 (5), (6) (also in `veil.test.ts`).
  - M2-5 (better than the design, not built: it changes lane A's PR 2 code, #159 is still open): one rule for "an enemy unit stands on this point", shared by `findUnitAt` and `AreaHitQuery`. Recorded as `INBOX.md` HC-B26 (6).
  - M2-6 and M2-7: acceptable, no change.
- Correction to `2026-11-22-1638-feat-vanguard-hamstring.md` (M2-2): round 1 reviewed the PR 2 merge `84df8e95` and C3 `2ef0466b`, not the #150 merge `90490af2`, which came after it. H37 was test-first: the new test went red before the M1-1 fix, so it had no restore and no `cmp`; H38 to H40 were breaks of working code, restored and checked with `cmp`.
- Checks run: full `npm run check` on `056c272a` (2026-11-22 16:46 to 16:55 MST) `EXIT=0`: core 361 files / 2387 tests, protocol 1 / 31, client 316 / 2219, server 21 / 85, "Documentation check passed." (148 files). Log `eternalus-agent-work/abilities/hamstring-056c272a-check.log`. This commit changes only TSDoc, a test comment, docs and `INBOX.md`; a full check on it runs before the push.
- Next step: the owner's push script pushes #150 and this branch and opens the Hamstring PR on #150. No critic round 3: round 2 had no blocker, and this commit changes only text.
