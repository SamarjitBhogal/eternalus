---
title: 'Progress 2026-11-27: chore/veil-hamstring-step-c (Step C of the #150 fold)'
description: 'Phase 4 / sprint 4.2, sholtzman + Claude Code: merged the vanguard-kit Step A heads into the Veil branch, recorded DEC-426 and fixed the merge critic findings (swing wedge under the Legend sprite, docs, one test).'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: chore/veil-hamstring-step-c (Step C of the #150 fold)

Phase 4 / sprint 4.2 · `chore/veil-hamstring-step-c` (becomes the head of PR #150,
`feat/vanguard-veil-hamstring`; lane A pushes it) · sholtzman + Claude Code
(COMBAT-ABILITIES-LANE-2-36 and -37)

- What was done:
  - Merge 1 (`f7f92c89`): `feat/vanguard-kit` `67863e86` (Step A) into the Veil branch at
    `7732b02f`. The gem fix: `EntityStore.ignoresHits` (hit paths) beside `takesNoDamage` (damage
    step, line of fire).
  - Merge 1b (`32a7845c`): lane A's Step A head `d22b2b66` (v103 rework, DEC-411 to DEC-413). Two
    doc conflicts: `INBOX.md` (HC-B52 tick) and the decisions log (theirs' v103 batch first).
  - `970f7a2d`: DEC-426 (`INBOX.md` HC-B62, Sentinel kit follow-ups), quoted from Owner Calls v108.
  - The critic findings on merge 1 (architecture-reviewer, PASS WITH FINDINGS, no blockers):
    - M1: a Legend sprite drew no swing wedge (DEC-304). `LegendView.draw` draws the wedge, then
      `drawBody`; `LegendSpriteView.draw` draws the wedge under the sprite and falls back to
      `drawBody`, so the wedge is drawn once. The text is lane A's (`u5-u4-preresolve`), so the
      fold into the #123 stack does not conflict. Two tests in `LegendSpriteView.test.ts`.
    - M2: architecture 06 §10, the "Walls placed during the match" section is whole again and
      sits before "Related".
    - m1: architecture 06 §10, the held attack picks no target (DEC-184, DEC-319 (6)); only the
      explorer's click uses the drawn size. Click order: unit, roof, gem, map object. The merge
      dropped `50f9a082`'s held-attack drawn-size pick.
    - m2: dated notes on DEC-333 (2) and `INBOX.md` HC-B35 (`ignoresHits` and `takesNoDamage`).
    - m3: `DamagePipeline.land` records the kill credit, so an execute (DEC-204) records the
      victim's last enemy hit. New test in `KillCredit.test.ts`.
    - Nits: TSDoc of `PlayerActions.attackObjectAt` (the gem) and `PlayerCommands.apply`
      (`snapshot`).
- Fail-first breaks: the HEAD versions of the two Legend views turn "draws the swing wedge under
  the sprite (DEC-304)" red; `recordHit` back in `apply` only turns the new `KillCredit` test red.
  Both were restored.
- Checks run: full `npm run check` on `970f7a2d`, `CHECK_EXIT=0` (core 419 files / 2798 tests,
  protocol 1 / 33, client 347 / 2423, server 29 / 164, "Documentation check passed."; log
  `eternalus-agent-work/abilities/fold-plan/stepC/chain-1b.log`). Before the fix commit: the
  touched test files, `npx tsc -b`, eslint, prettier and `npm run docs:check` pass. The full check
  on the fix commit runs in slot B; its log is `stepC/chain-fix.log`.
- Not done: the decisions log batch order (ours' 2026-11-26 to 2026-11-21 batches now come before
  theirs' 2026-11-26 batch); the critic marked it optional.
- Next step: critic round 2 on merge 1b, `970f7a2d` and the fix commit; the better-than-design item
  (a general "answers blocked hits" flag in place of the gem check in `EntityStore.ignoresHits`)
  and the whiff attack frames (`LegendAnimation`) go to the owner in `INBOX.md`. Then lane A folds
  and pushes #150.
