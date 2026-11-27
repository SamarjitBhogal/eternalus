---
title: 'Progress 2026-11-22: feat/vanguard-hamstring (merges, A11, HC-B26 (3) close-out)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: #150 Veil nits and #148 9cb3a31e merged into Hamstring; Hamstring-and-Veil scenario (A11); HC-B26 (3) answered by DEC-199.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/vanguard-hamstring (merges, A11, HC-B26 (3) close-out)

Phase 4 / sprint 4.2 · feat/vanguard-hamstring · sholtzman + Claude Code (COMBAT-ABILITIES-LANE-2-16)

- What was done: committed the staged Veil delta critic docs on #150 (`6602035b`; the last session left them staged).
  Merged #150 `6602035b` into this branch (`ab5c17e1`; `INBOX.md` conflict: HC-Q79 and HC-B26 both kept) and #148
  `9cb3a31e` (`15a34f79`; docs only, as this branch already had phase/3 `e2a4fd66`; `PROGRESS.md` held #148's four
  PR 1 entries twice, so one byte-identical copy was dropped). A11 (`4bc82060`): two scenarios in
  `hamstring.test.ts`. A Veiled Warrior's blade hits an enemy 6 m east for 80 and ends the thrower's Veil in tick 8.
  The blade hits a Veiled enemy for 80 and ends that Veil in tick 8. HC-B26 (3) (`12c9f107`): DEC-199 already
  answers it (the default kit uses Serrated: no slow). 06 names the Serrated default, `INBOX.md` records the
  answer, and 05 §18 cites DEC-199 and gains a "Veil" bullet. Breaks H30 and H31 each turned only their own test
  red, then were restored with `cmp` (`eternalus-agent-work/abilities/hamstring-breaks.log`).
- Checks run: one full `npm run check` on `12c9f107` (2026-11-22 05:03:19 to 05:13:35 MST) `EXIT=0`: core 353 files
  / 2250 tests, protocol 1 / 31, client 315 / 2212, server 21 / 85, "Documentation check passed." Log
  `eternalus-agent-work/abilities/hamstring-r2-check.log`.
- Gate round 2 (reports in `eternalus-agent-work/abilities/hamstring-gate/r2-*.md`): ponytail PASS (R2-P1
  rejected: `arrow.ts` carries the same comments, as for P4); architecture approve with nits. Fixed R2-A1 (05 §18
  records that the blade does not hit the Stronghold or a gate until `targetId` comes from `aimedBodyOf`), R2-A2
  (this file), R2-A3, R2-A4, R2-A5 (03 lists the cast level in the shot hash). Open: R2-A6 (optional BTD) and the
  correctness critic's report.
- Next step: finish pre-PR gate round 2 (briefs in `eternalus-agent-work/abilities/hamstring-gate/r2-briefs.md`). C3 (the
  blade hits the Stronghold and gates) waits for lane A PR 2 (`AreaHitQuery.aimedBodyOf`). The owner answers
  HC-B26 (1), HC-B26 (2) and HC-Q79. Then the owner pushes #150 (after its #136 `7d0fd9a7` merge) and this branch.
