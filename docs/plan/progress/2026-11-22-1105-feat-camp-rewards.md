---
title: 'Progress 2026-11-22: feat/camp-rewards'
description: 'Phase 3 / minion plan MVP gaps, SamarjitBhogal + Claude Code: clearing a forest camp pays its last killer a 50 XP bonus.'
audience: [humans, agents]
status: active
owner: SamarjitBhogal
last-reviewed: 2026-11-22
tags: [plan, progress, log]
---

# Progress 2026-11-22: feat/camp-rewards

Phase 3 / minion plan §1.2 "Camp rewards" · feat/camp-rewards · SamarjitBhogal + Claude Code

- What was done: `ProgressionSystem` listens to `camp-cleared` and pays the Legend that killed the
  camp's last mob `XP_SOURCES.campCleared` (50, `TUNE`, balancing.md "Camps"), as
  `xp-gained` with `cause: 'camp-cleared'`; `level-matches-xp` flags a camp award while the camp
  is no cleared guard home. Closed the minion plan's "Camp rewards" gap; its §3 stand-in now
  names the interim recipient rule. Doc 05 §13 and §18 updated. Asked INBOX "Camp rewards" (who are "the clearing Legends").
- Checks run: `npm run check` on Node 24.21.0 → exit 0 (core 1689 tests, protocol 29, client
  2077, server 84, "Documentation check passed."). On Node 22 the client's
  `WebSocketTransport.test.ts` fails with `CloseEvent is not defined` (engines pin 24.21).
  Critic: no code blocker; findings 2–6 fixed, B1–B3 to INBOX. Ponytail: lean, no cuts.
- Next step: the owner answers INBOX "Camp rewards"; a team-wide or radius answer is a change to
  the one listener.
