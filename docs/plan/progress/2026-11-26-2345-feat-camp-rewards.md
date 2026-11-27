---
title: 'Progress 2026-11-26: feat/camp-rewards (phase/3 merge after #170; DEC-375)'
description: 'Phase 3 / minion plan, SamarjitBhogal + Claude Code: merged phase/3-sprint-3-work 47ae8606 (no conflict); recorded DEC-375 (camp bonus to the last killer as built; B1 to B3 dropped).'
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-26
tags: [plan, progress, log]
---

# Progress 2026-11-26: feat/camp-rewards (phase/3 merge after #170; DEC-375)

Phase 3 / minion plan · feat/camp-rewards (PR #153) · SamarjitBhogal + Claude Code

- What was done: merged `phase/3-sprint-3-work` at `47ae8606` (after #82, #84, #90 and #170), no
  conflict. The acting owner answered both open items: "Camp rewards" **as built** (the Legend that
  killed the camp's last mob gets the bonus; nobody when a minion or turret does), and the critic's
  B1 to B3 refactors **dropped**. Recorded as DEC-375; doc 05 §18 states the rule instead of
  "Interim"; the minion plan §3 stand-in row is removed (no longer a stand-in); the
  `xpSources.ts` comment cites DEC-375; both INBOX items moved to _Done_.
- Checks run: `npm run check` on Node 24.21.0 (see the PR #153 comment).
- Next step: merge #153; then #173 merges this head and retargets to the phase branch.
