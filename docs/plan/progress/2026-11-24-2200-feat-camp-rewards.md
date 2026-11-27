---
title: 'Progress 2026-11-24: feat/camp-rewards (phase/3 merge after #100, Legend respawn)'
description: 'Phase 3 / minion plan gap (camp rewards), SamarjitBhogal + Claude Code: merged phase/3-sprint-3-work 579fb4f9 (#100); the camp bonus is owed to a Legend waiting to respawn, as a kill is.'
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-24
tags: [plan, progress, log]
---

# Progress 2026-11-24: feat/camp-rewards (phase/3 merge after #100, Legend respawn)

Phase 3 / minion plan gap: camp rewards · feat/camp-rewards · SamarjitBhogal + Claude Code

- What was done: merged `phase/3-sprint-3-work` at `579fb4f9` (#100, Legend respawn, DEC-295).
  Conflicts in `ProgressionSystem` (and its types), `GameEvents.types`, `LevelMatchesXpInvariant`
  (and its test) and doc 05: both sides kept. The camp award now follows #100's kill rules: a
  killer waiting to respawn is found in `state.respawns`, and its bonus is owed on its queue entry
  (`OwedXp.cause` gains `camp-cleared`) and paid as it returns (cause `respawn`). New test in
  `ProgressionSystem.test.ts`.
- Checks run: `npm run check` on Node 24.21.0 before the push (see the PR #153 comment).
- Next step: the owner answers INBOX "Camp rewards"; then re-review.
