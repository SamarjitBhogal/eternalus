---
title: 'Progress 2026-11-25: feat/minion-m6c-defender-followups (M6c)'
description: 'Phase 3 / minion plan M6c, SamarjitBhogal + Claude Code: checkpoint-cleared and its damage-biased XP share, DEC-260 defender and camp-mob levelling, and DEC-350 defender limit and cancelling.'
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-25
tags: [plan, progress, log]
---

# Progress 2026-11-25: feat/minion-m6c-defender-followups (M6c)

Phase 3 / minion plan M6c · feat/minion-m6c-defender-followups (stacked on feat/camp-rewards,
PR #153) · SamarjitBhogal + Claude Code

- What was done:
  - DEC-260 / DEC-350 (4) levelling: guard plans and checkpoint defender plans carry `canLevel`,
    copied onto each `GuardSlot`; `VeterancySystem.isLeveller` reads it. True for tower guards,
    forest camps, the capture point boss group and the defenders; false for the corner camp.
  - DEC-350 (6), (7): `CHECKPOINT_DEFENDER_LIMIT` (10) in `guardPlans.ts`; `GuardRoster.defend`
    adds only what fits, in table order (`countDefenders`); `SpawnSystem` buffers
    `capture-point-owner-changed` and cancels the old owner's waiting defenders
    (`cancelWaitingDefenders`) before it adds new sets.
  - Checkpoint XP (07 §7): each reached set gets a `GuardSlot.defenceId`;
    `CheckpointGuardRespawn` emits `checkpoint-cleared` when a set's last defender is lost.
    `ProgressionSystem` delegates to `CheckpointAwards`, which buffers Legend hits on defenders
    into `GameState.defenderDamage` (new `DefenderDamageStore`, hashed) and pays
    `xpSources.checkpointCleared` (balancing.md 60 / 150 / 400, 10 m, 0.6 even share) as
    `xp-gained` cause `checkpoint-cleared`. `LevelMatchesXpInvariant` backs it with a lost
    defender post.
  - Docs: 07 §7, 18 §7.1 and the M6 status note, the minion plan §1.2 table (closed rows
    removed, including the ones M6b, M10 and #85/#86 closed), INBOX "Minion M6b follow-ups"
    update and the new "Minion M6c interpretations" item.
- Checks run: `npm run check` on Node 24.21.0, exit 0 (core 1801 tests, client 2179, server
  163).
- Next step: the pre-PR gate; then the owner answers "Minion M6c interpretations".
