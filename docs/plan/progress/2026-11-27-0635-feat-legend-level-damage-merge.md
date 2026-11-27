---
title: 'Progress 2026-11-27: feat/legend-level-damage phase/3 merges (DEC-380)'
description: 'Phase 3: feat/legend-level-damage merges phase/3 e8250d6b; camp and checkpoint XP obey the no-match-XP gate of a Duel.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/legend-level-damage phase/3 merges (DEC-380)

Phase 3 / sprint 3 work · feat/legend-level-damage (base `phase/3-sprint-3-work` e8250d6b) ·
WORKFLOW-FIXES-8 and -9 (Claude Code). The work before the merges is in the 2026-11-26 entry.

- What was done:
  - Two merges of phase/3: 776eb57e (phase/3 317bede0: #82, #84, #90, #170, #153) and 0b56f800
    (phase/3 e8250d6b: #173).
  - Resolutions: `createDefaultDamageSteps(progressOf = null, units = LEGEND_CLASSES)`, and
    `DefaultSystemPipeline` passes both arguments. #153's `camp-cleared` listener moved into
    `listenForAwards`. #173's `CheckpointAwards` is built only when the match has match XP.
  - Result: a Duel (`hasMatchXp: false`) pays no camp XP and no checkpoint share, and keeps no
    checkpoint-set damage. The hash and replays do not change (`StateHasher` hashes the
    defender-damage store only when it is not empty, and a Duel has no guards).
  - Tests: a new checkpoint test (no share and no set damage without match XP); the Duel test in
    `ProgressionSystem.test.ts` also clears a camp.
  - Docs: the DEC-380 row, architecture 05 §18 (checkpoint XP is built; the minion-kill share
    radius is not), the `hasMatchXp` TSDocs and the `DUEL_RULES` comment.
- Fail-first: four breaks, each red and each restored by sha256
  (`eternalus-agent-work/legend-level-damage/breaks.log`): the camp listener outside the gate,
  the checkpoint buffer always built (twice: once for the award, once for the set-damage check),
  and the units not passed to the damage steps.
- Critic (architecture-reviewer, merge resolutions): approve, no blockers. Applied S1 (05 §18
  "not built" text), N1 (set damage checked after the first tick), N2 (`listenForAwards` TSDoc),
  N4 (this entry). N3 rejected: both branches edit the same setUp line in
  `ProgressionSystem.test.ts`, so a rules object does not remove the conflict with #177. BTD1 and
  BTD2 are `INBOX.md` HC-B59 (an `AwardSource` port; an options object for
  `createDefaultDamageSteps`).
- Ponytail on the resolutions: "Lean already"; no cuts.
- Checks run: `npm run check` on 0b56f800 plus these changes (06:33Z to 06:43Z) → exit 0:
  format, no-js, lint, typecheck, knip, coverage (core 317 files / 1918 tests, protocol 1 / 31,
  client 333 / 2263, server 29 / 163, all passed), build, "Documentation check passed.".
- Next step: push and open the PR against `phase/3-sprint-3-work`. The owner question on scaled
  hits against structures and bosses stays on Owner Calls (HC-Q119).
