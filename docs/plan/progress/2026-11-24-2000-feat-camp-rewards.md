---
title: 'Progress 2026-11-24: feat/camp-rewards (phase/3 merge, PR #153 round 3)'
description: 'Phase 3 / minion plan gap (camp rewards), SamarjitBhogal + Claude Code: merged phase/3 39717a6b; the bonus is keyed by forest camp id; the camp check skips checkpoint-defender posts.'
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-24
tags: [plan, progress, log]
---

# Progress 2026-11-24: feat/camp-rewards (phase/3 merge, PR #153 round 3)

Phase 3 / minion plan gap: camp rewards · feat/camp-rewards · SamarjitBhogal + Claude Code

- What was done: merged `phase/3-sprint-3-work` at `39717a6b` (after #130). One conflict, in
  `docs/plan/minion-system-plan.md`: the base's gap table is kept without the closed
  "Camp rewards" row, and this branch's camp stand-in row replaces the base's. claudiodh's
  should-fix items for `bbf9fda7`: `XP_SOURCES.campCleared` is now keyed by camp definition id,
  with the three forest camps only, so a corner camp pays no clear bonus on top of its boss's
  team-wide XP (balancing.md lists the corner camps apart); `LevelMatchesXpInvariant` counts only
  the camp's own posts, not checkpoint-defender posts on the same home, as `GroupGuardRespawn`
  does. New tests: a corner-camp clear pays no bonus; a camp award passes while a defender on the
  same home stands (fails before the change). Doc 05 is updated.
- Checks run: see the PR #153 comment for this round (`npm run check`, quoted verbatim).
- Next step: the owner answers `INBOX.md` "Camp rewards" (who are "the clearing Legends");
  record the DEC row and change only the doc 05 line (as built) or the recipient code.
