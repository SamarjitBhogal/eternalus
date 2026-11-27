---
title: 'Progress 2026-11-27: feat/vanguard-kit (phase/3 e8250d6b merge, DEC-411 to DEC-413)'
description: 'Phase 3 / sprint 3 work, Claude Code: PR #136 takes phase/3 at e8250d6b (18 conflicts) and builds the owner answers HC-B52 (both Legends ready after a Duel round) and HC-Q121 (the corner boss fills the meter).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/vanguard-kit (phase/3 e8250d6b merge, DEC-411 to DEC-413)

Phase 3 / sprint 3 work · feat/vanguard-kit · sholtzman + Claude Code (COMBAT-WEAPONS-ABILITIES-75, -77)

- What was done: merge `67863e86` takes phase/3 at `e8250d6b` (#82, #84, #90, #170, #153, #173); its message lists the 18 conflicted files. Mechanical fixture changes (tsc): `readiness`, `NO_PATH`, `abilities` and `ultimateCharge`, `statuses: null` in 11 test files. Three new tests pin the joined behaviour (ProgressionSystem camp clear and meter, EntityLayer cue and bar order, Match range overlay over the atmosphere); breaks 1 to 11 in `eternalus-agent-work/abilities/fold-plan/stepA/breaks.log`. Owner Calls v103: DEC-411 (1) the Duel round reset readies both Legends' abilities but the ultimates (`DuelRoundSystem`); DEC-412 the corner boss fills the meter like the capture point boss (`content/progression/ultimateCharge.ts`); DEC-411 (2), (3) and DEC-413 are rows only. Breaks 12 and 13 turned the changed and the new test red. Gate: architecture-reviewer on `git show --remerge-diff 67863e86` and on the rework: both PASS, no blockers; 2 SHOULD applied (the doc 12 Duel note, `last-reviewed` on 05, 12 and 13) and 5 NITs (the 05 listener sentence and not-built list, two `INBOX.md` notes, the `Abilities` TSDoc); 3 better-than-design items are in `INBOX.md`, each with a planned place. Ponytail (`stepA/ponytail-r1.md`): 3 cuts; the `DuelRoundSystem` TSDoc cut is applied; the EntityLayer bar-height loop and the Match overlay count stay (a test is never cut or weakened).
- Checks run: `npm run check` (gated, on this tree without this line): core `Test Files  370 passed (370)`, `Tests  2288 passed (2288)`; protocol `Test Files  1 passed (1)`, `Tests  32 passed (32)`; client `Test Files  343 passed (343)`, `Tests  2378 passed (2378)`; server `Test Files  29 passed (29)`, `Tests  163 passed (163)`; `Documentation check passed.`; `CHECK_EXIT=0`.
- Next step: push script that fast-forwards feat/vanguard-kit to this head (after coordinator script 56), CI on both OSes. Then fold unit U5 (the big merge) and step D, COMBAT-WEAPONS-ABILITIES.
