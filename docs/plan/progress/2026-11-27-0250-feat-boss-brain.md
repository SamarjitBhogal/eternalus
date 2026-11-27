---
title: 'Progress 2026-11-27: feat/boss-brain (the Greater Boss brain, hurt phase and phase cue)'
description: 'Phase 3 / sprint 3.6, Claude Code (E7-BOSS-BRAIN-1 to -6): the Greater Boss picks moves by a situation tree (DEC-371 E7), a hurt phase opens the wide sweep and the charge (DEC-417), and the client draws a phase cue.'
audience: [humans, agents]
status: active
owner: sholtzman
last-reviewed: 2026-11-27
tags: [plan, progress, log]
---

# Progress 2026-11-27: feat/boss-brain (the Greater Boss brain, hurt phase and phase cue)

Phase 3 / sprint 3.6 · feat/boss-brain (stacked on #164 `feat/greater-boss-moves`, b365146b) · Claude Code

- What was done: `BossMoveChooser` (an `ActiveSelector` over punish, crowd, far and fallback, then a seeded `UtilityScorer` pick) replaces the move rotation (DEC-371 E7). `ThreatLedger` and `BossDamageSystem` record recent damage and put the boss in `hurt` below half health (`BossPhase`, `boss-phase-changed`, DEC-417). `dev-set-boss-phase` is a developer command. `boss-move` halts the boss and aims it at its target (a bug fix: every beam used to go to the last walk target). The client draws `BossPhaseCueView`. Docs: architecture 11 and 13, the decisions log (DEC-417), `INBOX.md` (brain and hurt-phase TUNE item). Not built yet: the developer-menu button (the menu is not on this line) and the appended DEC-371 citation (the row is not on this line); both come with the #160 merge.
- Critic 1 (`architecture-reviewer`, on the tree above): PASS, no blockers. Fixed after it (E7-BOSS-BRAIN-5 and -6): tests for `BossPhase` and `ThreatLedger`; the snapshot's `bossPhase` group is `null` for an entity without `BossPhase` (DEC-17); `BossPhase` records every hit to the boss, also one with no attacker; the fallback branch no longer holds the roar (the boss chases instead), and the leash scenario was rewritten so it still pulls the boss to the zone edge; `GREATER_BOSS_SLAM` is a named constant; `UtilityScorer.pick` never returns an option that scores 0 when float rounding leaves the roll unspent. Docs: architecture 03 (command, event, snapshot group, `boss-move`'s `targetId`), 08 (the phase cue pass) and 11 (the fallback and the profile list), and three more `INBOX.md` points (the roar at the phase change, the halt-and-aim rule, a boss-facts reader).
- Checks run: `npm run check` on the tree before the docs: `Documentation check passed.`, exit 0 (1840 + 29 + 2105 + 114 tests passed). The gated `npm run check` after the critic fixes is in the PR description. Deliberate breaks 1-42: `.handoffs/e7-boss-brain/breaks.md` (outside the repository).
- Next step: the critic re-check and ponytail, then a push script to the coordinator and a stacked PR into `feat/greater-boss-moves` (E7-BOSS-BRAIN-6). Later, when #164 moves: merge it, add the developer-menu button and the DEC-371 citation.
