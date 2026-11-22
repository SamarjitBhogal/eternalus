---
title: 'Progress 2026-11-22: feat/vanguard-hamstring (gate round 2 correctness nits, R2-A6)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: Hamstring gate round 2 correctness nits R2-C2, R2-C3, R2-C5 fixed; R2-A6 shot hash fields built (HC-B26 (4)); R2-C6 recorded (HC-B26 (5)).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/vanguard-hamstring (gate round 2 correctness nits, R2-A6)

Phase 4 / sprint 4.2 · feat/vanguard-hamstring · sholtzman + Claude Code (COMBAT-ABILITIES-LANE-2-17)

- What was done: the gate round 2 correctness report (`r2-correctness.md`) approves with nits. Its R2-C1 and
  R2-C4 were fixed in `d1078df0`. R2-C2: a new scenario test pins the blade at x = 51, 52, 53, 54 after ticks 1
  to 4 (1 m a tick, 30 m/s); the hit-tick test alone also passed at 28 and 31 m/s. R2-C3: the A11 comment now
  says that Veil stops at the hit in tick 7 and is removed (`invisible off`) in tick 8. Correction to the entry
  `2026-11-22-0514-feat-vanguard-hamstring.md`: "ends ... Veil in tick 8" there means the removal in tick 8;
  Veil stops at the hit in tick 7. R2-C5: the `AbilityImpact` copy comment gives the true reason (no alias of
  the live `Transform`, as `afterHit` does). R2-A6 (better than the design, built under DEC-223, `INBOX.md`
  HC-B26 (4)): `ProjectilePayload.fields` lists the shot's hashed fields in the same order, and `StateHasher`
  spreads them, so no hash changes; 03 points to it. R2-C6 (a `hit` area outside an `onHit` list hits nothing):
  recorded, not built (`INBOX.md` HC-B26 (5)). Breaks: H32 (blade `maxSpeed` 29, then 31) turned only the new
  speed test red; H33 (`fields` without the cast level) turned only the cast-level hash test red. Each was
  restored and checked with `cmp` (`eternalus-agent-work/abilities/hamstring-breaks.log`).
- Checks run: one full `npm run check` on this tree (2026-11-22 05:34:04 to 05:45:43 MST) `EXIT=0`: core 353
  files / 2251 tests, protocol 1 / 31, client 315 / 2212, server 21 / 85, "Documentation check passed." Log
  `eternalus-agent-work/abilities/hamstring-r2b-check.log`.
- Next step: a round-3 critic (the last) on the changed lines only. C3 (the blade hits the Stronghold and gates)
  waits for lane A PR 2 (`AreaHitQuery.aimedBodyOf`) on origin. The owner answers HC-B26 (1), (2), (4), (5) and
  HC-Q79. Then the owner pushes #150 (after its #136 `7d0fd9a7` merge) and this branch.
